---
title: "Joint Optimization: A Min-Time Racing Line Solving Path and Speed Together"
author: inyoung-choi
date: 2026-06-26 16:00:00 +0900
categories: [Software, planning]
tags: [raceline, optimization, nlp, ipopt, min-time]
lang: en
lang_ref: joint-optimization-racing-line
math: true
---

The 3D planner (the one actually used) generates a global racing line that minimizes lap time (min-time) by optimizing **the path (raceline) and speed together**. Code: [`gen_global_racing_line.py`](https://github.com/Brojoon-10/ICRA2026_HJ/blob/main/planner/3d_gb_optimizer/global_line/global_racing_line/gen_global_racing_line.py)

## Cost function (min-time & curvature)

$$
J = \int \left[ w_T \cdot \frac{1}{\dot{s}} + w_{jx}\, j_{x,t}^2 + w_{jy}\, j_{y,t}^2 + w_{d\Omega_z}\, d\Omega_z^2 \right] ds
$$

| Term | Expression | Role |
|---|---|---|
| Time | $w_T \cdot (1/\dot{s})$ | Lap time |
| Jerk | $w_{jx}\, j_{x,t}^2 + w_{jy}\, j_{y,t}^2$ | Rate of acceleration change (smoothness) |
| Curvature | $w_{d\Omega_z}\, d\Omega_z^2$ | Trajectory curvature |

## GGV and curvature

$$
\frac{V^2}{R} \le a_{y,max} \;\Rightarrow\; V \le \sqrt{a_{y,max} \cdot R}
$$

For a fixed $a_{y,max}$, the way to raise speed $V$ is to **increase the curvature radius $R$**. So as $R$ grows, the raceline expands outward.

## Case 1 — Min Laptime ($w_{d\Omega_z} = 0$)

- The cost gradient acts to increase $V$
- To raise corner speed, the curvature radius grows
- The NLP uses the track up close to the boundaries to form the raceline
- The result is a **late-apex line** → it values corner entry/exit speed over mid-corner speed (for min-time), with the line hugging the inside wall
  - Entry: outside
  - Apex: inside, late in the corner
  - Exit: outside (large $R$ secured at exit → maximizes exit acceleration)

**Pros**

| Item | Detail |
|---|---|
| Lap time | Theoretical minimum (physical lower bound within the model assumptions) |
| Benchmark | Measures the limit performance of the car/track |
| R usage | Fully uses track width as a tool to secure R → maximizes corner V |
| Exit acceleration | Late apex gives large exit R → higher average V on the next straight |

**Cons**

| Item | Detail |
|---|---|
| Harsh ax/ay | Tightly active at the friction-circle boundary → near bang-bang profile |
| Real-car tracking | Large controller cross-track error, actuator burden |
| Slip risk | Fully uses the friction limit → no margin under disturbance |
| Numerical stability | Many constraints active at once → KKT dual ambiguity, IPOPT oscillation |
| Model dependence | Strongly relies on the point-mass assumption → large real-car gap |
| Reproducibility | Sensitive to road/tire condition changes |

## Case 2 — Laptime + Curvature Trade-off

The NLP considers the time and curvature gradients **simultaneously**.

| Term | Direction the gradient pulls |
|---|---|
| Time | Lengthening the line (late apex) |
| Curvature | Flattening the line ($d\chi$ tracking $-\Omega_z$) |

The result is a **geometric-apex line** (symmetric entry/exit R — the raceline with the single largest geometric radius).

**Pros**

| Item | Detail |
|---|---|
| Smooth profile | Gentle ax/ay changes, synergy with the jerk term |
| Real-car tracking | Lower controller tracking error, stable driving |
| Margin | Stays off the friction-circle boundary, absorbs disturbances |
| Stable NLP convergence | The curvature term acts as natural regularization → IPOPT is fast and stable |
| Tuning freedom | A single $w_{d\Omega_z}$ scalar trades stability ↔ speed |
| Reproducibility | Less sensitive to road variation |

**Cons**

| Item | Detail |
|---|---|
| Lap-time cost | Usually ~1% increase (depending on $w_{d\Omega_z}$) |
| Limited R usage | Doesn't fully use track width → potential corner-V loss |
| Weaker exit acceleration | Geometric apex gives smaller exit R than Case 1 |
| Tuning needed | $w_{d\Omega_z}$ must be found per track/car |
| Too large is clearly worse | $\ge 10^0$ → curvature term dominates, clear lap-time loss |

## Optimization method

### 1. Nonlinear Programming (NLP)

Optimization with a nonlinear cost and nonlinear constraints — computing the trajectory that minimizes the cost $J$ over one lap.

```text
min J(cost)
subject to  ẋ = f(x, u, s)           (3D point mass)
            GGV friction-circle ineq. (tire limit)
            n ∈ [n_lb(s), n_ub(s)]   (track boundary)
            V ≥ V_min                (speed lower bound)
            X_0 = X_N                (closed loop)
```

### 2. Direct multiple shooting discretization

Converts continuous time/space optimal control into an NLP.

- Uniformly split the track by arc length $s$: `step_size_opt = 0.2 m`
- Assign decision variables to each grid step: `[V_k, n_k, χ_k, ax_k, ay_k]` (state) + `[jx_k, jy_k]` (control)
- Per-segment RK4 integration: integrate each $[k\cdot ds, (k+1)\cdot ds]$ with 4-stage Runge-Kutta → `F(X_k, U_k, s_k) = (X_k_end, q_t, q_reg)`
- Continuity equality constraint: `X_k_end − X_{k+1} = 0`
- Closed-loop boundary condition: `X_0 − X_N = 0`

Variables grow with the number of grid steps, but it is numerically stable and parallelizable.

### 3. Initial guess

The NLP is iterative, so it needs a starting point.

- Speed `V = V_guess = 3.0 m/s` (every step)
- Lateral offset `n = (w_tr_l + w_tr_r) / 2` (track center)
- Heading error `χ = 0`
- Acceleration `ax = ay ≈ 0` (exactly `1e-6`, for numerical stability)
- Control `jx = jy = 0`

That is, "a homogeneous trajectory going around the track center at a constant low speed." This guess automatically satisfies all constraints (feasible), so IPOPT can start stably.

### 4. IPOPT iteration (interior-point method)

CasADi calls IPOPT via `nlpsol('ipopt', ...)`. In one iteration:

1. Compute the cost gradient `∇J`
2. Compute the constraint Jacobians `∇g`, `∇h`
3. Hessian approximation: `limited-memory BFGS` (memory saving)
4. Newton step: solved with HSL `ma27`
5. Step size: line search (`cg-penalty`)
6. Variable update: `w ← w + α · Δw`
7. Convergence check: KKT residual (primal/dual/complementarity)

This repeats up to `max_iter = 2000`.

### 5. How the decision variables evolve

| Variable | Direction of change |
|---|---|
| `V` | toward lower cost → increases (the time term wants V↑) |
| `n` | toward lower cost → changes the line shape (secure R or suppress curvature) |
| `χ` | linked to `n` changes through the ODE |
| `ax, ay` | adjusted to produce V changes within the friction-circle limit |
| `jx, jy` | smoothed so the jerk term shrinks |

Constraints only allow directions that reduce cost — the friction-circle inequality (corner V is set when $a_y$ reaches $a_{y,max}$), the wall box ($n$ limited by track width), continuity equalities (physically feasible trajectory), and the closed loop (periodic trajectory).

### 6. Convergence

- Primal feasibility: constraint residual < `constr_viol_tol = 1e-4`
- Dual feasibility: < `dual_inf_tol = 1e-1`
- Complementarity: inequality active/inactive consistency < `compl_inf_tol = 1e-4`

IPOPT terminates when all three are met simultaneously.

## Wrap-up

| Step | Detail |
|---|---|
| 1. Define | Minimize cost $J$ + satisfy nonlinear constraints (ODE, friction circle, walls, speed lower bound, boundary conditions) |
| 2. Discretize | Direct multiple shooting + RK4, 0.2 m grid |
| 3. Initial guess | Homogeneous feasible trajectory at track center + V_guess |
| 4. IPOPT iterate | Interior-point + barrier + line search |
| 5. Variable change | Adjust along the cost gradient; blocked when constraints become active |
| 6. Converge | primal/dual/complementarity residuals below tolerance |

Setting $w_{d\Omega_z}$ to 0 gives the theoretically fastest late-apex line; increasing it gives a real-car-friendly geometric-apex line. To refine the speed profile of the generated raceline separately, see the [3D Velocity Planner]({{ site.baseurl }}/posts/nlp-velocity-planner/).
