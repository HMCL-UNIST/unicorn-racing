---
title: "3D Velocity Planner: Re-optimizing Speed Only with the Line Fixed (NLP)"
author: inyoung-choi
date: 2026-06-26 16:30:00 +0900
categories: [Software, planning]
tags: [velocity, optimization, nlp, planning]
lang: en
lang_ref: nlp-velocity-planner
math: true
---

This module **re-optimizes only the speed profile ($v_x$, $a_x$) with an NLP**, based on an already-generated global raceline. Because the line is fixed and only the speed is adjusted, you can tune acceleration/braking behavior per corner more finely. Code: [`3d_optimized_vel_planner.py`](https://github.com/Brojoon-10/ICRA2026_HJ/blob/main/stack_master/scripts/3d_optimized_vel_planner.py)

| Aspect | Global Raceline | Velocity Planner |
|---|---|---|
| Decision target | Line + speed together | **Speed only** (line fixed) |
| Input | track data, GGV | **the already-generated raceline** + GGV |

> For solving the line and speed together, see [Joint Optimization Racing Line]({{ site.baseurl }}/posts/joint-optimization-racing-line/); for forward-backward speed planning, see [Velocity Planner]({{ site.baseurl }}/posts/velocity-planner/).
{: .prompt-tip }

## Cost function

```text
J = ∫[ w_T·(1/s_dot)
      + weight_acc · w_jx_acc · jx_pos²
      + weight_brk · w_jx_brk · jx_neg²
      + w_T · w_ax_corner_acc · ax_corner_term · ax_pos² ] ds
```

Beyond the time term, it **includes a per-corner acceleration term in the cost**, so the optimal speed can be computed differently for each corner.

| Parameter | Effect |
|---|---|
| `w_jx_acc` / `w_jx_brk` | **Asymmetry** between acceleration and braking (reflects actuator characteristics) |
| $\alpha \cdot \tanh(\lvert\Omega_z\rvert / k_\alpha)$ | Depends on the **curvature magnitude** — strengthens jerk weighting in corners |
| $\beta \cdot \tanh(\lvert d\Omega_z/ds\rvert / k_\beta)$ | Depends on the **curvature rate** — strengthens entry/exit transitions |
| `w_ax_corner` | Captures **steady-state acceleration** where jerk = 0 but ax is constant |

- Different jerk weights for acceleration and braking reflect the asymmetric characteristics of the real drivetrain/brakes.
- Jerk weighting is increased smoothly via $\tanh$ according to the curvature magnitude ($\lvert\Omega_z\rvert$) and curvature rate ($\lvert d\Omega_z/ds\rvert$), so speed changes freely on straights but more conservatively in corners and their transition zones.
- The `w_ax_corner` term captures the constant cornering acceleration even in a steady state (zero jerk), tuning the steady-state speed per corner.

## Wrap-up

The 3D Velocity Planner refines **only the speed profile** of an already-optimized raceline with an NLP, reflecting per-corner acceleration/braking behavior and actuator asymmetry. Being separate from line optimization (joint optimization), its advantage is that you can quickly re-tune just the speed behavior on the same line.
