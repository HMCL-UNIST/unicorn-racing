---
title: "MPCC Controller Principles: A Deep Dive into Progress-Based Racing Control"
date: 2026-06-26 17:00:00 +0900
categories: [Software, control]
tags: [control, mpcc, acados, optimization, racing]
lang: en
lang_ref: mpcc-controller-principles
math: true
---

> A walkthrough of the **MPCC (Model Predictive Contouring Control)** controller used on autonomous race cars, from basic concepts to implementation structure. (For a high-level MPC/MPCC/MPPI comparison, see [MPC · MPCC · MPPI]({{ site.baseurl }}/posts/mpc-mpcc-mppi/).)

## 1. The problem MPCC solves

The goal of race-car control is one sentence: **go around the lap as fast as possible without leaving the track.** As a control problem it becomes two conflicting desires — go fast and you get pushed off-line in corners; hug the line and you slow down.

A typical MPC follows a "timetable": it tracks a pre-planned trajectory along the time axis ("be here at 0.5 s, there at 1.0 s"). In racing this timetable breaks easily — fall behind or get ahead in a corner and you no longer match the planned position at the planned time, forcing the controller to overreach.

**MPCC uses distance along the track (arc length $s$) instead of time.** It thinks in "how far along the track am I," not "how many seconds." That lets you write the two desires directly as an optimization:

1. **Maximize progress** — increase $s$ as fast as possible (drive fast).
2. **Minimize contouring error** — penalize deviation from the line.

The two key errors are:

- **$e_c$ (contouring error):** lateral distance off the line.
- **$e_l$ (lag error):** how far ahead/behind along the line.

Every control cycle MPCC solves "over the next 1–2 s, how do I drive to go farthest without leaving the line," executes **only the first step**, and re-solves next cycle.

## 2. The control loop in the system

```text
state estimation ─── vehicle state (vx, vy, r, x, y, ψ) ──┐
global planner ───── racing line ─────────────────────────┤
global planner ───── centerline (corridor bounds) ────────┤
                                                          ▼
                  ┌──────────────────────────────────────┐
                  │  1. read current state x0             │
                  │  2. update weights (curvature/obstacle)│
                  │  3. solve OCP with acados             │ ← the core loop
                  │  4. extract command from the trajectory│
                  └──────────────────────────────────────┘
                                                          ▼
              driving command (speed·steer) → command mux → motor driver → motor
```

The MPCC node takes **vehicle state + racing line (target) + centerline (track bounds)** as input and produces **speed and steering commands**.

> **The MPC feeds the vehicle state into the optimization's initial state $x_0$ every cycle.** Position/speed feedback enters every cycle. This matters again in §8.
{: .prompt-info }

## 3. Writing the optimal control problem (OCP)

The OCP formulation defines four things: **state** (what to track), **control** (what to adjust), **dynamics** (how it moves), **cost & constraints** (what is good and what is forbidden).

### 3.1 State — 8 variables

`x = [x, y, ψ, vx, vy, r, s, δ_prev]`

| idx | symbol | meaning | unit |
|---|---|---|---|
| 0 | `x` | global X position | m |
| 1 | `y` | global Y position | m |
| 2 | `ψ` | heading | rad |
| 3 | `vx` | body longitudinal speed | m/s |
| 4 | `vy` | body lateral speed | m/s |
| 5 | `r` | yaw rate | rad/s |
| 6 | `s` | progress (arc length, monotonic) | m |
| 7 | `δ_prev` | previously applied steering | rad |

`δ_prev` remembers the last steering angle, so penalizing the difference keeps steering from chattering.

### 3.2 Control — 3 variables

`u = [a_x, δ, p_v]`

| idx | symbol | meaning | unit |
|---|---|---|---|
| 0 | `a_x` | longitudinal **acceleration** command | m/s² |
| 1 | `δ` | **steering angle** command | rad |
| 2 | `p_v` | progress speed (virtual speed) | m/s |

Note — the control is **acceleration**, not speed. So the speed command must be extracted from the future speed trajectory the solver builds by integrating acceleration (§5).

### 3.3 Dynamics: kinematic at low speed, dynamic at high speed, blended in between

Use a **kinematic model** (no tire slip) at low speed and a **dynamic model** (with slip) at high speed, blended smoothly by speed.

```python
w_dyn  = 0.5*(1 + tanh((vx - v_blend) / v_width))   # higher speed → more dynamic
f_expl = w_dyn*f_dyn + (1 - w_dyn)*f_kin
```

`tanh` is an S-curve, so the low→high transition is smooth — important because a model that jumps at some speed destabilizes the solver. The reason for falling back to kinematic at low speed is that the **dynamic model is numerically unstable at low speed** (slip angle `atan2(..., vx)` blows up as vx→0).

**Kinematic branch (low speed):**

```python
beta = atan(l_r * tan(δ) / L)   # bicycle-model slip angle
ẋ  = vx*cos(ψ + beta)
ẏ  = vx*sin(ψ + beta)
ψ̇  = (vx/L)*tan(δ)*cos(beta)
v̇x = a_x                         # commanded accel = accel (no-lag assumption)
ṡ  = p_v
```

**Dynamic branch (high speed):**

```python
α_f = atan2(-vy - l_f*r, vx_safe) + δ   # front slip angle
α_r = atan2(-vy + l_r*r, vx_safe)       # rear slip angle
F_y = μ·D·F_z·tanh(B·α)                  # tire lateral force (tanh saturation)
```

As slip angle grows, lateral force $F_y$ grows then saturates past the limit (modeled with `tanh`). `μ` is the road friction coefficient.

> `v̇x = a_x` assumes "command an acceleration and you instantly get it." Real drivetrain lag is not in the model — revisited in §8.
{: .prompt-warning }

### 3.4 Cost function: the weights are the controller's personality

Several residuals are weighted and minimized as $\tfrac{1}{2} r^\top W r$.

| Residual | Penalizes |
|---|---|
| `e_c - e_c_ref` | contouring (lateral deviation) |
| `e_l` | lag (longitudinal deviation) |
| `yaw_err` | heading error |
| `vx - ref_v` | speed tracking |
| `δ - curvature feedforward` | steering regularization |
| `p_v - speed_target` | progress reward |
| `δ - δ_prev` | steering rate (smoothing) |
| `a_x` | longitudinal-accel penalty |

What matters is the **relative** weight magnitudes.

- **Large steering-rate term** → suppresses steering changes (no chatter).
- **Speed-tracking > progress** → conservative / **larger progress** → aggressive.
- **Lower accel penalty** → more aggressive acceleration.

The **terminal cost** is applied only at the end of the horizon to settle the endpoint speed.

### 3.5 Computing contouring / lag error

The reference line is a spline parameterized by arc length `s`. The error vector is decomposed along the line's direction into two components.

```python
e_c =  sin_t*(x - ref_x) - cos_t*(y - ref_y)   # perpendicular → lateral deviation
e_l = -cos_t*(x - ref_x) - sin_t*(y - ref_y)   # along the line → fore/aft deviation
```

This lets you weight "lateral deviation" and "fore/aft deviation" differently (usually contouring more strongly).

### 3.6 Constraints: the friction ellipse enforces physical limits

**Box constraints** — `a_x` (max accel/brake), `δ` (max steer), `p_v` (upper bound), vx ≥ 0 (no reverse).

**Nonlinear constraints:**

1. **Obstacles** — keep the predicted trajectory from violating obstacles.
2. **Corridor** — confine `e_c` between left/right track bounds.
3. **Lateral-accel limit** — bound `|a_lat| = |vx·r|`.
4. **Friction ellipse** —

$$
\left(\frac{a_x}{a_{lim}}\right)^2 + \left(\frac{a_{lat}}{a_{lim}}\right)^2 \le 1, \qquad a_{lim} = \mu \cdot g \cdot \eta
$$

   Total tire grip is fixed — spend it all on acceleration and none is left for cornering. **Full acceleration + full cornering at once is physically impossible**, and this ellipse forces that limit, making the solver trade off grip automatically.
5. **Steering-rate limit** — a hard constraint.

**Per-stage speed cap:** at each point, cap speed by the local curvature `κ` via `v_cap = sqrt(a_lat/|κ|)`, so the car slows before reaching a sharp corner.

### 3.7 Solver settings

| Item | Choice | Meaning |
|---|---|---|
| Prediction horizon | tens of steps (~1–2 s) | sees about the next corner |
| Integrator | ERK (RK4) | integrates accel → speed·position |
| QP solver | HPIPM | solves each iteration's subproblem |
| NLP solver | SQP-RTI | solves the nonlinear problem |
| Hessian | Gauss-Newton | 2nd-derivative approximation |

> **SQP-RTI (Real-Time Iteration) is the key to real-time operation.** Nonlinear optimization usually iterates to convergence, which is too slow for a control cycle. RTI iterates **just once** per cycle to produce a "good enough" answer on time, compensating with warm-start and regularization.
{: .prompt-tip }

## 4. How the target speed (ref_v) is built

From the global planner's racing line (each point has x, y, curvature κ, target speed vx), `ref_v` is built through several caps.

```python
v_kappa = sqrt(a_lat_max / kappa)      # ① curvature-based corner speed (sharper → lower)
v_src   = wpnt.vx_mps * vel_scale       # ② speed stored on the racing line
ref_v   = clip(min(v_src, v_kappa, max_speed), v_min, max_speed)
# ③ forward/backward brake pass adds "deceleration-only" correction
```

`a_lat_max` is clamped to the real tire grip `μ·g·η`. **Setting μ higher than reality** makes the model overtrust grip → corner over-entry → line departure. So a conservative μ is safer. **Curvature lookahead** reflects far corners early so the car slows before arrival.

## 5. Output stage: how the speed command is extracted

The control variable is acceleration, but the motor driver needs a **speed command**. It is extracted from the solver's **future speed trajectory**.

**① accel-preview window** — command a slightly-future planned speed

```python
v_brk = min(planned speed over the near-future window)
if v_brk < v_now:   v_plan = v_brk          # braking plan → decelerate now
else:               v_plan = (a step-ahead planned speed)  # accel/hold → step ahead
```

**② braking-distance-aware output cap** — a safety net independent of the solver

```python
v_allow = sqrt(vH² + 2·brake_anticip_a·d)   # d = distance to the next corner
v_plan  = min(v_plan, min(v_allow))
```

**③ final clamp** — launch assist + speed cap; steering goes through an EMA filter and servo slew-rate limit.

> Do not scale the output speed afterward (e.g. ×1.2). The solver plans "drive at this speed, then brake this much there" as one coherent plan; multiplying the output breaks that consistency and overshoots in corners. To go faster, adjust **inside the solver, not the output.**
{: .prompt-warning }

## 6. acados: the engine that solves the OCP in real time

| Layer | Tool | Role |
|---|---|---|
| Symbolic | **CasADi** | write dynamics/cost/constraints symbolically → auto-differentiate + generate C code |
| OCP | **acados** | multi-stage OCP structure, integrators, SQP/RTI, condensing. Generates a dedicated C solver |
| QP | **HPIPM** | high-performance interior-point method for each iteration's QP |
| Linear algebra | **BLASFEO** | library specialized for small dense matrices |

Why it's fast: ① code generation (compiled dedicated C) ② condensing structure ③ warm-start ④ BLASFEO. The accurate-but-slower IPOPT is an option, but real-time racing uses acados.

## 7. Augmenting with data: GP residual correction & BO weight tuning

### 7.1 GP residual correction — learn the model error

```python
gp_z   = [vx, vy, r, δ, a_x]                          # GP input features
μ      = gp_posterior_mean(gp_z)                       # learned model error
f_expl = f_expl + [0, 0, 0, μ_vx, μ_vy, μ_r, 0, 0]    # correct speed states only
```

The key is adding correction **only to the speed states `[vx, vy, r]`**. A GP is trained offline on driving data, and at runtime its posterior mean is added to the dynamics and integrated into the solver (a standard technique in learning-based racing MPC).

> The GP makes the model's *prediction* more accurate. It does not fix the model-actuator mismatch of §8 (the car failing to follow commands).
{: .prompt-info }

### 7.2 BO — auto-tune the cost weights

Tuning many weights by hand is infeasible, so use **BO (Bayesian Optimization)**: ① pick a weight set → ② run a lap, measure a quality score (lap time − wall-violation/instability penalties) → ③ BO predicts the next promising set → ④ iterate to convergence. The key is reaching a good answer in **few trials**.

> More important than BO itself is **how the quality score is defined**. Using lap time alone learns to scrape walls as long as it's fast, so mix in penalties for wall violations, divergence, and stalling to steer toward "fast and safe."
{: .prompt-tip }

## 8. A common pitfall: the model assumes the actuator is fast

The `v̇x = a_x` of §3.3 assumes "command an acceleration and you instantly get it." In reality the command passes through the motor driver's inner speed loop; if that inner loop is slow, the car can't follow the commanded acceleration.

The problem is that **state feedback does not fix this**. The MPC receives the real speed as $x_0$ each cycle, so it knows "the car is slow now," but **the model's assumption that "commanding gives that acceleration" is not updated by feedback.** So it plans optimistically again and the car falls short again.

This assumption has a **dangerous asymmetry**. An error on the acceleration side is relatively harmless (output is capped by the braking cap anyway), but **the same error on the braking side causes crashes** — the model believes "brake hard before the corner and you stop," but if real braking is weak, it overshoots the corner.

| Direction | Method | Result |
|---|---|---|
| A. Fit the model to the car | Lower accel/brake limits to real values | Honest plan, safe braking, but reduced peak performance |
| B. Fit the car to the model | Make the inner loop fast (e.g. direct current control) | The solver's plan is realized → performance recovered |

In control terms, the **time-scale separation** assumption (the inner speed loop being fast enough) is broken. This is the first thing to check when putting model-based control on a real car.

## 9. Summary

- Using **track distance ($s$) instead of time** is the decisive difference from plain MPC.
- The control is **acceleration, not speed**, so the speed command is extracted from the future trajectory.
- The **friction ellipse** enforces "no full acceleration + full cornering at once."
- **acados / HPIPM** solve the nonlinear optimization in real time.
- Even a perfect algorithm is blocked if the **actuator can't follow the command.**

## 10. References

**Core theory**
- A. Liniger, A. Domahidi, M. Morari, *"Optimization-based autonomous racing of 1:43 scale RC cars,"* OCAM, 2015. — the MPCC racing origin
- D. Lam, C. Manzie, M. Good, *"Model predictive contouring control,"* IEEE CDC, 2010.
- A. Heilmeier et al., *"Minimum curvature trajectory planning and control for an autonomous race car,"* VSD, 2020.
- J. Kabzan, L. Hewing, A. Liniger, M. Zeilinger, *"Learning-based MPC for autonomous racing,"* IEEE RA-L, 2019. — GP residual
- U. Rosolia, F. Borrelli, *"Learning MPC for iterative tasks,"* IEEE TAC, 2018.
- H. B. Pacejka, *Tire and Vehicle Dynamics,* 3rd ed., 2012.

**Solvers · numerical optimization**
- R. Verschueren et al., *"acados,"* Math. Prog. Comp., 2022.
- G. Frison, M. Diehl, *"HPIPM,"* IFAC, 2020.
- G. Frison et al., *"BLASFEO,"* ACM TOMS, 2018.
- J. Andersson et al., *"CasADi,"* Math. Prog. Comp., 2019.
- M. Diehl, H. G. Bock, J. P. Schlöder, *"A real-time iteration scheme...,"* SIAM J. Control Optim., 2005.
