---
title: "Mintime Optimization: A Min-Time Raceline Solving the Dynamics Directly"
date: 2026-06-27 10:30:00 +0900
categories: [Software, planning]
tags: [raceline, optimization, mintime, ocp, casadi, ipopt]
lang: en
lang_ref: mintime-optimization
math: true
---

> `trajectory_optimizer.py` · `enable_mintime`
>
> An optional optimization that solves the vehicle dynamics and tire model directly to find the theoretically fastest line.
{: .prompt-info }

## Design goals

- **Truly minimize lap time**: whereas IQP (min curvature) and SP (shortest path) approximate a "geometrically good line," mintime puts **lap time itself as the objective** and finds the optimal line + speed profile that satisfies the vehicle dynamics, simultaneously.
- **Optional and expensive**: it solves a nonlinear optimal control problem (OCP) on CasADi/IPOPT, so it's heavy with many parameters. It's off by default (`enable_mintime=False`) and turned on only when needed.

## Overview — how it differs from IQP/SP

The IQP and SP from [Global Trajectory Optimization]({{ site.baseurl }}/posts/global-trajectory-optimization/) take only **alpha (the normal displacement)** as the variable and solve a geometric proxy objective — "reduce curvature" or "reduce distance." Those lines are fast because empirically smaller curvature lets you drive faster, not because lap time is computed directly.

mintime takes a fundamentally different approach. It sets up a **time-minimizing optimal control problem (OCP)** along the track and, by putting the vehicle's equations of motion (states: lateral position, heading, speed, slip, etc.), the tire friction limit (Magic Formula), and actuator dynamics in as constraints, it solves **"the line and speed that lap fastest without violating the dynamics"** all at once.

| | IQP | SP | mintime |
|---|---|---|---|
| Variables | alpha | alpha | alpha + speed + vehicle state |
| Objective | min curvature² | min distance | **min lap time** |
| Model | geometric | geometric | **dynamics + tire + actuator** |
| Solver | iterative QP | single QP | nonlinear OCP (CasADi/IPOPT) |
| Speed profile | post-computed | post-computed | **built into the optimization** |
| Cost | moderate | fast | **slow (tens of seconds~minutes)** |

## Core idea — the time-minimizing OCP

mintime solves an optimal control problem with track position $s$ as the independent variable. Intuitively, it leaves "what state the car is in and how fast it passes each point of the track" all as unknowns and minimizes the total transit time.

$$
\min_{\mathbf{u}} \ T = \int_{0}^{s_{\text{end}}} \frac{1}{\dot{s}}\, ds
\quad \text{s.t.} \quad
\begin{cases}
\dot{\mathbf{x}} = f(\mathbf{x}, \mathbf{u}) \\
\mathbf{g}(\mathbf{x}, \mathbf{u}) \le 0
\end{cases}
$$

Here $\mathbf{x}$ is the vehicle state (lateral displacement, heading error, speed, slip angle, etc.), $\mathbf{u}$ is the control input (steering, drive/brake), and $f$ is the vehicle equations of motion. Tire forces are modeled with the **Magic Formula (Pacejka)**, constraining the combined longitudinal/lateral grip limit (the friction circle) so it isn't exceeded.

This problem has no closed-form solution, so it's discretized with CasADi and solved numerically with IPOPT (an interior-point nonlinear solver). That's why it's heavy.

## Code flow — `_run_mintime()`

mintime is called inside `run()` only when `enable_mintime` is on. It **takes the IQP result as the reference track** and solves the OCP on top of it.

```python
if self.enable_mintime and self.pars['optim_opts_mintime']:
    # re-prep the IQP result (reftrack_iqp) with prep_track
    reftrack_mt, normvec_mt, a_mt, coeffs_x_mt, coeffs_y_mt = \
        tph.prep_track.prep_track(reftrack_imp=reftrack_iqp, ...)
    traj_mt, lap_mt = self._run_mintime(
        reftrack_mt, normvec_mt, a_mt, coeffs_x_mt, coeffs_y_mt)
```

### 1) Lazy import

CasADi and sklearn are heavy and needed only in mintime, so they're imported inside the function only then. As a result, if you don't use mintime these dependencies aren't loaded.

```python
def _run_mintime(self, reftrack_interp, normvec_interp, a_interp,
                 coeffs_x_interp, coeffs_y_interp):
    import opt_mintime_traj  # lazy: CasADi + sklearn only needed here
    export_path = os.path.join(self.map_dir, 'mintime_export')
    os.makedirs(export_path, exist_ok=True)
```

### 2) Building the parameters

It gathers the ini's mintime-related sections and passes them as `pars_mt`. `var_friction` (variable friction) and `warm_start` are turned off here.

```python
pars_mt = dict(self.pars)
pars_mt['optim_opts'] = dict(self.pars['optim_opts_mintime'])
pars_mt['optim_opts']['var_friction'] = None
pars_mt['optim_opts']['warm_start'] = False
```

### 3) Solving the OCP

The core call. Passing the track, spline coefficients, normals, and all parameters returns **not just alpha (the line) but the speed profile `v_opt` as well**. This is the decisive difference from IQP/SP — the speed comes out of the optimization, not post-computed.

```python
alpha_opt, v_opt, reftrack_out, a_interp_out, normvec_out = \
    opt_mintime_traj.src.opt_mintime.opt_mintime(
        reftrack=reftrack_interp,
        coeffs_x=coeffs_x_interp, coeffs_y=coeffs_y_interp,
        normvectors=normvec_interp,
        pars=pars_mt,
        export_path=export_path,
        print_debug=True, plot_debug=False,
    )
```

### 4) Handling the speed profile

It interpolates the `v_opt` from mintime onto the global line points and uses it as-is (no separate `calc_vel_profile` like IQP/SP). Only the upper bound is clamped by `v_max`.

```python
s_splines = np.insert(np.cumsum(spline_lengths_opt), 0, 0.0)
vx_profile = np.interp(s_points_opt, s_splines[:-1], v_opt)   # speed from the OCP
vx_profile = np.minimum(vx_profile, self.pars['veh_params']['v_max'])
```

## Re-optimization option (`reopt_mintime_solution`)

The mintime solution can be slightly rough due to OCP discretization. If `reopt_mintime_solution` is on, it post-processes the mintime line by **smoothing it once more with min-curvature (`opt_min_curv`)**.

```python
if pars_mt['optim_opts'].get('reopt_mintime_solution', False):
    # make the mintime line a new reference track
    racetrack_mt = np.column_stack((raceline_mt, w_tr_right_mt, w_tr_left_mt))
    ref_reopt, norm_reopt, a_reopt = tph.prep_track.prep_track(...)
    # re-optimize with min curvature
    alpha_opt = tph.opt_min_curv.opt_min_curv(
        reftrack=racetrack_reopt, normvectors=norm_reopt, A=a_reopt,
        kappa_bound=self.pars['veh_params']['curvlim'],
        w_veh=pars_mt['optim_opts']['w_veh_reopt'])[0]
```

Here `width_opt` is corrected with re-optimization widths (`w_tr_reopt`, `w_veh_reopt`, `w_add_spl_regr`). It's a device to compensate, via width, for the slight line shrinkage caused by the second spline regression.

## Parameters — `config/CAR/racecar_f110.ini`

mintime uses **three additional large sections** in the ini. All are read only when `enable_mintime=True`.

### `optim_opts_mintime` — optimization behavior

```ini
optim_opts_mintime = {"width_opt": 0.8,
                      "penalty_delta": 1.0,
                      "penalty_F": 0.1,
                      "mue": 1.0,
                      "n_gauss": 5,
                      "dn": 0.025,
                      "safe_traj": false, ...}
```

| Key | Value (CAR) | Meaning |
|---|---|---|
| `width_opt` | 0.8 | mintime safety width [m] (overridden by `safety_width_mintime`) |
| `penalty_delta` | 1.0 | steering-rate penalty (smooths control) |
| `penalty_F` | 0.1 | drive-force-rate penalty |
| `mue` | 1.0 | friction coefficient (tire D parameter: $D = F_z \cdot \mu$) |
| `safe_traj` | false | if true, additionally limits acceleration |

### `vehicle_params_mintime` — vehicle dynamics

The physical properties the OCP uses in the equations of motion — center of mass, inertia, wheelbase, etc. (partial, CAR).

| Key | Value | Meaning |
|---|---|---|
| `wheelbase_front` / `rear` | 0.15875 / 0.17145 | front/rear wheelbase [m] |
| `I_z` | 0.04712 | yaw inertia [kg·m²] |
| `cog_z` | 0.074 | center-of-mass height [m] |
| `power_max` | 267 | max power [W] |
| `f_drive_max` / `f_brake_max` | 33.4 / 47.4 | max drive/brake force [N] |
| `delta_max` | 0.34 | max steering angle [rad] |

> The code adds `wheelbase_front + wheelbase_rear` to compute and fill in the full wheelbase automatically.
{: .prompt-tip }

### `tire_params_mintime` — tire Magic Formula

The B·C·E coefficients of the Pacejka Magic Formula. They determine the shape of the tire force-slip curve.

| Key | Value | Meaning |
|---|---|---|
| `B_front` / `B_rear` | 7.4 / 7.4 | stiffness factor |
| `C_front` / `C_rear` | 1.2 / 1.2 | shape factor |
| `E_front` / `E_rear` | 0.85 / 0.85 | curvature factor |
| `f_z0` | 8.6 | nominal vertical force [N] |

> `pwr_params_mintime` (the powertrain thermal model) is off via `pwr_behavior=false`, so it's unused in the default flow. It's an advanced option that even accounts for motor/battery/inverter temperatures.
{: .prompt-info }

## Output and validation

The mintime result is also assembled into the same 7-column trajectory (`s, x, y, psi, kappa, vx, ax`) as IQP/SP, saved with the same `_save_json`, and validated with `check_traj`.

```python
self._save_json(traj_mt, traj_sp, lap_mt, ...)
if self.enable_check_traj and bound_r is not None:
    self._run_check('MinTime', traj_mt, bound_r, bound_l, self.safety_width_mintime)
```

The log prints `[MinTime] Done in ...s, lap≈...s` and `[CheckTraj MinTime] ...`. The mintime export folder (`maps/<map>/mintime_export/`) stores the OCP solver's debug output.

## When to turn it on (practical guide)

- **Normal operation**: keep mintime off and use IQP as the main. IQP is fast and stable enough, and easy to reproduce and tune.
- **When to consider mintime**: when the vehicle dynamics/tire parameters are well matched to the real car and you want to squeeze out the last bit of lap time. But beware — if the parameters are inaccurate, the mintime line can come out unrealistic.
- **How to enable**: `enable_mintime:=true` as a launch parameter. Specify `safety_width_mintime` too if needed.

```bash
ros2 run gb_optimizer trajectory_optimizer --ros-args \
    -p map_name:=<map> -p enable_mintime:=true -p safety_width_mintime:=0.7
```

> mintime needs the extra CasADi/IPOPT/sklearn dependencies. If they're absent in your environment, it fails at the lazy-import point, so check that they're installed before enabling it.
{: .prompt-warning }
