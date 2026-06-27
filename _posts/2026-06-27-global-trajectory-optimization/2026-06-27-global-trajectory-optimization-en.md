---
title: "Global Trajectory Optimization: Min-Curvature (IQP) and Shortest-Path (SP) Racelines"
date: 2026-06-27 10:00:00 +0900
categories: [Software, planning]
tags: [raceline, optimization, iqp, shortest-path, global-planning]
lang: en
lang_ref: global-trajectory-optimization
math: true
---

> `trajectory_optimizer.py` · `gb_optimizer` package
>
> Takes `centerline.csv` and builds the global line the car actually drives, saving it as `global_waypoints.json`.
{: .prompt-info }

## Goals

- **Track → global line**: from the `centerline.csv` and boundary CSVs produced by `centerline_extractor`, compute the optimal driving line the car will actually follow.
- **Two-stage optimization (IQP → SP)**: generate both a **min-curvature line (IQP)**, which minimizes curvature, and a **shortest-path line (SP)**, which minimizes path length. Our stack **uses IQP as the main raceline** and saves SP as an auxiliary line for things like overtaking.
- **Downstream compatibility**: save results in the `gb_optimizer` JSON schema so the existing `global_trajectory_publisher` republishes them unmodified.

## Overview — why isn't the centerline enough?

The centerline is just a line through the middle of the track, not a **fast line**. To cut lap time in racing you either carve corners wide to lower curvature (raising cornering speed) or shorten the distance traveled outright. Solving "which line to drive" is global line optimization.

This node builds two classic global lines.

- **IQP (Iterative Quadratic Programming) — min-curvature line (main)**: minimizes path curvature. Passing corners smoothly and wide allows higher speed, usually giving the fastest lap. **This is the line we actually follow.**
- **SP (Shortest Path) — shortest line (auxiliary)**: minimizes distance traveled. It hugs the inside wall — high curvature but short — and is saved as a reference for certain situations (overtaking, defending, etc.).

## Core idea — alpha parameterization

The starting point of global line optimization is **"how do we represent the global line mathematically?"** If every point of the global line is a free $(x, y)$, the variables explode and the "stay inside the track" constraint gets complicated.

Instead, this stack represents every global line as **the centerline plus a normal-direction displacement $\alpha$**. At each centerline point, the point shifted by $\alpha(s)$ along that point's normal direction is the point on the global line.

$$
\mathbf{p}_{\text{race}}(s) = \mathbf{p}_{\text{center}}(s) + \alpha(s)\, \mathbf{n}(s)
$$

where $\mathbf{p}_{\text{center}}$ is the centerline point, $\mathbf{n}$ is the unit normal, and $\alpha(s)$ is the displacement at that point. This has big advantages.

- **One-dimensional variables**: each point optimizes a single $\alpha$ instead of two values $(x, y)$.
- **Simple track constraint**: "don't cross the wall" becomes just the box constraint $w_{tr,right} \le \alpha \le w_{tr,left}$.

## Pipeline — `run()`

The whole flow lives in `trajectory_optimizer`'s `run()` method, proceeding in order from loading inputs to optimizing both lines to saving the JSON.

```python
def run(self):
    reftrack_imp = self._load_centerline(csv_path)        # centerline.csv
    bound_r, bound_l = self._load_boundaries()            # boundary CSV (real walls)

    # track prep: resample + spline + curvature/heading
    reftrack_interp, normvec_interp, a_interp, cx, cy = tph.prep_track.prep_track(...)

    # Stage 1: IQP (min curvature) — main line
    traj_iqp, lap_iqp, reftrack_iqp, normvec_iqp = self._run_iqp(...)
    self._run_check('IQP', traj_iqp, bound_r, bound_l, ...)

    # Stage 2: SP (shortest path) — uses the IQP result as reference track
    traj_sp, lap_sp = self._run_sp(reftrack_iqp, normvec_iqp)

    self._save_json(...)                                  # global_waypoints.json
    self._run_check('SP', traj_sp, bound_r, bound_l, ...)
```

## Step 1 — Track preparation (`prep_track`)

The raw centerline has irregular point spacing and no spline information. `prep_track` cleans it into a form the optimizer can use.

- **Uniform resampling**: re-lay points at a fixed spacing per `stepsize_opts`.
- **Spline fitting**: fit a cubic spline through the points to form a continuous curve.
- **Normal vectors**: compute each point's unit normal $\mathbf{n}(s)$ (the axis of the $\alpha$ parameterization).
- **Curvature/heading**: derive $\kappa$ (curvature) and $\psi$ (heading) analytically from the spline coefficients.

```python
reftrack_interp, normvec_interp, a_interp, coeffs_x, coeffs_y = \
    tph.prep_track.prep_track(
        reftrack_imp=reftrack_imp,
        reg_smooth_opts=self.pars['reg_smooth_opts'],
        stepsize_opts=self.pars['stepsize_opts'],
        min_width=self.pars['imp_opts']['min_track_width'])
```

> Sections narrower than `min_track_width` (default 0.8 m) can make the optimization diverge, so this value enforces a lower bound. It works alongside the `centerline_extractor`'s width-floor clamp (0.15 m) as a safeguard.
{: .prompt-tip }

## Step 2 — IQP min-curvature optimization

Min-curvature optimization finds the $\alpha$ that minimizes the sum of squared curvature over the whole global line. The smaller the curvature, the higher the possible cornering speed, so the resulting line carves corners wide.

$$
\min_{\alpha} \ \sum_{i} \kappa_i(\alpha)^2
\quad \text{s.t.} \quad -w_{\text{right},i} \le \alpha_i \le w_{\text{left},i}
$$

Curvature $\kappa$ is nonlinear in $\alpha$, but linearizing at each iteration makes it solvable as a **quadratic program (QP)**. Solving once to update the line, then re-linearizing at the updated line and solving again, repeated, is **Iterative QP (IQP)**.

```python
alpha_opt, reftrack_iqp, normvec_iqp = tph.iqp_handler.iqp_handler(
    reftrack=reftrack_interp,
    normvectors=normvec_interp,
    kappa_bound=self.pars['veh_params']['curvlim'],   # vehicle max curvature
    w_veh=self.safety_width_iqp,                       # safety width
    iters_min=...['iqp_iters_min'],                    # min iterations
    curv_error_allowed=...['iqp_curverror_allowed'],   # convergence curvature error
)[0:3]
```

## Step 3 — SP shortest-path optimization (auxiliary)

Shortest-path optimization, as the name says, finds the $\alpha$ that **minimizes the total length** of the global line. The result hugs the inside wall. Length is a smooth function of $\alpha$, so a single QP solves it directly (no iteration).

$$
\min_{\alpha} \ \sum_{i} \left\| \mathbf{p}_{i+1}(\alpha) - \mathbf{p}_i(\alpha) \right\|^2
\quad \text{s.t.} \quad -w_{\text{right},i} \le \alpha_i \le w_{\text{left},i}
$$

```python
alpha_opt = tph.opt_shortest_path.opt_shortest_path(
    reftrack=reftrack_iqp,        # solved on the track IQP refined
    normvectors=normvec_iqp,
    w_veh=self.safety_width_sp,
)
```

## Step 4 — Trajectory assembly

Once $\alpha$ is fixed, the global line coordinates are recovered and a curvature/speed/acceleration profile is layered on to form a complete trajectory. (For the speed profile, see [Velocity Planner]({{ site.baseurl }}/posts/velocity-planner/).)

Each row of the final trajectory has these 7 columns.

| Column | Symbol | Meaning |
|---|---|---|
| `s_m` | $s$ | cumulative distance from the start |
| `x_m`, `y_m` | $x, y$ | global line coordinates |
| `psi_rad` | $\psi$ | heading angle |
| `kappa_radpm` | $\kappa$ | curvature |
| `vx_mps` | $v_x$ | target speed |
| `ax_mps2` | $a_x$ | target acceleration |

```python
# columns: [s_m, x_m, y_m, psi_rad, kappa_radpm, vx_mps, ax_mps2]
traj = np.column_stack([
    s_points_opt, raceline_interp[:, 0], raceline_interp[:, 1],
    psi_vel, kappa, vx_profile, ax_profile])
```

This trajectory becomes the target path that follow-up controllers like [Pure Pursuit]({{ site.baseurl }}/posts/pure-pursuit/) track.

## Step 5 — Check Trajectory (safety validation)

Validates that the optimization result is actually drivable. It runs if `enable_check_traj` is on and the boundary CSVs exist.

The checks are:

- **Wall collision**: points where the distance from the global line to the wall is less than the vehicle half-width (`veh_half`) → ERROR
- **Insufficient margin**: distance below the safety half-width (`safety_half`) → WARN
- **Curvature exceeded**: $\lvert\kappa\rvert >$ `curvlim` (over steering limit) → WARN
- **Speed exceeded**: $v_x >$ `v_max` → WARN
- **Lateral acceleration exceeded**: $a_{lat} = v_x^2 \lvert\kappa\rvert$ over the ggv limit → WARN

```python
dist = np.array([np.min(np.linalg.norm(bound - pt, axis=1)) for pt in raceline])
n_hit = int((dist < veh_half).sum())          # number of wall-collision points
...
a_lat = vx**2 * np.abs(kappa)                  # lateral acceleration
n_alat = int((a_lat > a_lat_max * 1.05).sum())
```

The log prints a summary as `[CheckTraj IQP] min_r=... min_l=... max_κ=... max_v=... max_a_lat=...`, so when a raceline breaks, check here first to see where the problem is.

## Where the parameters come from

Rather than taking ROS parameters directly, `trajectory_optimizer` reads vehicle/optimization parameters from **the config files in the `stack_master/config/<racecar_version>/` folder**. The default `racecar_version` is `CAR`, so without an override the files in `config/CAR/` are used.

```text
config/CAR/
├── racecar_f110.ini          # the body of all vehicle/optimization parameters
└── veh_dyn_info/
    ├── ggv.csv               # per-speed accel/decel & lateral-accel limits (g-g-v diagram)
    ├── ax_max_machines.csv   # per-speed motor accel limit
    └── b_ax_max_machines.csv # (backup/alternate motor limit table)
```

ROS parameters (`safety_width_iqp`, etc.) are only there to **override the ini values at runtime**, and are rarely touched otherwise. At the default -1.0 (or ≤0) the ini value is used as-is.

### ROS parameters (optional override)

| Parameter | Default | Behavior |
|---|---|---|
| `map_name` | (required) | `maps/<map>/` folder name |
| `racecar_version` | `CAR` | selects the `config/<version>/` folder |
| `safety_width_iqp` | -1.0 | if ≤0, uses ini's `optim_opts_mincurv.width_opt` |
| `safety_width_sp` | -1.0 | if ≤0, uses ini's `optim_opts_shortest_path.width_opt` |
| `enable_check_traj` | True | run safety validation after optimization |
| `enable_mintime` | False | additionally run `opt_mintime` (CasADi) |

### `racecar_f110.ini` — the key values actually used (CAR)

Most tuning is done by **editing this ini file directly**, not via ROS parameters.

**`[GENERAL_OPTIONS]` — veh_params (vehicle properties/limits)**

| Key | Value | Meaning | Used in |
|---|---|---|---|
| `v_max` | 15.0 | max speed [m/s] | speed profile, check_traj |
| `width` | 0.30 | vehicle width [m] | check_traj wall-collision test |
| `mass` | 3.518 | vehicle mass [kg] | speed profile |
| `dragcoeff` | 0.0136 | drag coefficient | speed profile |
| `curvlim` | 1.5 | max curvature [rad/m] | IQP `kappa_bound`, check_traj |

**`[GENERAL_OPTIONS]` — stepsize_opts (point spacing)**

| Key | Value | Meaning |
|---|---|---|
| `stepsize_prep` | 0.05 | linear-interp spacing before spline approx [m] |
| `stepsize_reg` | 0.2 | point spacing during optimization (= number of normals) [m] |
| `stepsize_interp_after_opt` | 0.1 | interp spacing after optimization [m] |

**`[OPTIMIZATION_OPTIONS]` — IQP (main line)**

```ini
optim_opts_mincurv = {"width_opt": 0.6,
                      "iqp_iters_min": 20,
                      "iqp_curverror_allowed": 1.0}
```

| Key | Value | Meaning |
|---|---|---|
| `width_opt` | 0.6 | **IQP safety width** (= `w_veh`). default source of `safety_width_iqp` |
| `iqp_iters_min` | 20 | IQP minimum iterations |
| `iqp_curverror_allowed` | 1.0 | convergence curvature error [rad/m] |

**`[OPTIMIZATION_OPTIONS]` — SP (auxiliary line)**

```ini
optim_opts_shortest_path = {"width_opt": 0.4}
```

`width_opt = 0.4` is the SP safety width (= `w_veh`) and the default source of `safety_width_sp`.

### File I/O

```text
[input]  maps/<map>/centerline.csv             ← centerline_extractor (fake-wall width)
         maps/<map>/boundary_{right,left}.csv  ← centerline_extractor (real walls)
         config/CAR/racecar_f110.ini           vehicle/optimization params (tune here)
         config/CAR/veh_dyn_info/ggv.csv
         config/CAR/veh_dyn_info/ax_max_machines.csv

[output] maps/<map>/global_waypoints.json      → global_trajectory_publisher (IQP main)
         maps/<map>/shortest_path.json          (SP auxiliary)
```

`global_waypoints.json` has the same key structure `readwrite_global_waypoints.read_global_waypoints` expects, so `global_trajectory_publisher` reads it unmodified and republishes it at runtime.

**Node lifecycle**

```text
centerline_extractor  →  trajectory_optimizer  →  global_trajectory_publisher
  (exits after CSV)        (exits after JSON)        (runtime republish)
```

`trajectory_optimizer` is also a run-once-then-exit node. After `run()` finishes, it does a single `spin_once` then shuts down.

> Turning on `enable_mintime` additionally runs CasADi/IPOPT-based **min-time (`opt_mintime`)** optimization. It solves the vehicle dynamics and tire model directly for the theoretically fastest line, but it is heavy and needs separate parameter tuning, so it's off by default. For details, see [Mintime Optimization]({{ site.baseurl }}/posts/mintime-optimization/).
{: .prompt-info }
