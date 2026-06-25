---
title: "MPC · MPCC · MPPI: Comparing Predictive Control Algorithms"
author: hangyo-cho
date: 2026-06-25 12:00:00 +0900
categories: [Software, control]
tags: [control, mpc, mpcc, mppi]
image:
  path: /assets/img/posts/mpc-mpcc-mppi/overview.png
lang: en
lang_ref: mpc-mpcc-mppi
math: true
---

This post compares three predictive control algorithms that show up often in advanced control for autonomous racing — **MPC · MPCC · MPPI**. All three share the same idea: **"predict N steps into the future and find the optimal control input."** The difference lies in *how* they optimize and *what* they optimize.

![MPC · MPCC · MPPI comparison](/assets/img/posts/mpc-mpcc-mppi/overview.png)
*Comparison of the three algorithms — core idea, optimization method, pros/cons, and use cases*

## MPC (Model Predictive Control)

The most basic form. Every control cycle it repeats the following:

1. Simulate N steps into the future from the current state
2. Compute the control input sequence that minimizes a cost function via numerical optimization
3. Apply only the first input and discard the rest (**Receding Horizon**)

At each timestep it solves the following optimization problem:

$$
\min_{u}\ \sum_{k=0}^{N-1} \left[ (x_k - x_{ref})^\top Q (x_k - x_{ref}) + u_k^\top R\, u_k \right]
$$

$$
\text{s.t.}\quad x_{k+1} = f(x_k, u_k), \qquad x \in \mathcal{X},\ u \in \mathcal{U}
$$

For linear systems this becomes a **QP (Quadratic Programming)** problem; for nonlinear systems, an **NLP**.

## MPCC (Model Predictive Contouring Control)

An extension of MPC specialized for **path following**. Plain MPC tracks a reference of the form "reach this coordinate," whereas MPCC also **optimizes the progress parameter** $\theta$ along the path **as a control variable**.

The cost function splits into three terms:

- **Contouring error** $(e_c)$: how far off the path you are — minimize
- **Lag error** $(e_l)$: how far behind along the path you are — minimize
- **Progress** $(\dot{\theta})$: how fast you move forward — maximize

$$
\min\ \sum_{k} \left[ q_c\, e_c^2 + q_l\, e_l^2 - q_v\, \dot{\theta} \right]
$$

This lets you optimize *"go fast, but don't stray too far from the path"* at the same time. It is especially popular in autonomous racing.

## MPPI (Model Predictive Path Integral)

A completely different methodology. Instead of numerical optimization it uses **stochastic sampling**. Grounded in information theory (path-integral control), the core idea is:

1. Sample **$K$ candidate trajectories in parallel** by adding Gaussian noise to the current control input
2. Compute the cost of each trajectory
3. Assign **higher weights to lower-cost trajectories** and take a weighted average to obtain the optimal control

$$
u^* = \sum_{k} w(\tau_k)\,(u_{nom} + \epsilon_k), \qquad w(\tau_k) \propto \exp\!\left(-\frac{1}{\lambda} S(\tau_k)\right)
$$

where $S(\tau_k)$ is the cost of trajectory $\tau_k$ — the lower the cost, the higher the weight. It handles non-differentiable cost functions, non-convex environments, and extreme nonlinearities well, and can run thousands of samples in parallel on a GPU for real-time performance. It is used in off-road autonomous driving (Georgia Tech research) and rough-terrain robots.

## Which one should you use?

| Situation | Recommendation |
|-----------|----------------|
| Constraints matter, linear / mildly nonlinear system | **MPC** |
| High-speed path following, racing-line optimization | **MPCC** |
| Complex environment, nonlinear / non-convex, GPU available | **MPPI** |

> All three share the same backbone of "predict + optimize." The key differences are *what you treat as an optimization variable* (MPCC's progress) and *how you find the optimum* (MPPI's sampling).
{: .prompt-tip }

## Wrap-up

- **MPC**: the baseline that handles constraints explicitly. QP if linear, NLP if nonlinear.
- **MPCC**: adds progress as a control variable to optimize *tracking accuracy and speed at once*. Great for racing.
- **MPPI**: sampling-based, so it is robust to non-differentiable / non-convex costs and benefits from GPU parallelism.

For speed-profile generation, see the [Velocity Planner]({{ site.baseurl }}/posts/velocity-planner/) post.
