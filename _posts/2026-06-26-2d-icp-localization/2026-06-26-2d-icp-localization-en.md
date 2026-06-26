---
title: "2D ICP Localization: Simple but Powerful Pose Estimation"
date: 2026-06-26 15:00:00 +0900
categories: [Software, state estimation]
tags: [localization, icp, lidar, state-estimation]
lang: en
lang_ref: 2d-icp-localization
math: true
---

The first thing a racing stack needs is "where is the car on the track right now." We solve this localization with just a single 2D LiDAR and a pre-built occupancy grid map. This post covers what **ICP (Iterative Closest Point)** — the method we chose — actually is, why we chose it, and the two implementation details that made it work well in practice.

## What is ICP

In one sentence, ICP is the algorithm that **"rotates and translates the incoming LiDAR scan so it overlaps the pre-built map as well as possible."** Think of placing a puzzle piece (the scan) on the picture (the map) and nudging and rotating it until it fits. As the name says, it iterates three steps:

1. **Closest** — for each scan point, pair it with the nearest spot on the map.
2. **Point** — compute the rotation/translation that most reduces the mismatch (residual) of those pairs.
3. **Iterate** — from the slightly improved pose, go back to step 1. Converge when it no longer improves.

One important property: ICP converges quickly and accurately **when the initial pose estimate is near the answer**. Fortunately a racing car always roughly knows "about here" from wheel odometry and the IMU, so ICP refines that estimate precisely every frame.

## Why we chose ICP

There are several localization options — notably **particle filters** and SLAM-based localization like **Cartographer**. The reason we picked ICP comes down to **simplicity**.

**Versus particle filters.** A particle filter carries hundreds to thousands of hypotheses (particles) at once and estimates pose as a distribution. Its big strength is robustness to global "I have no idea where I am" situations and the kidnapped-robot problem. But that strength is rarely needed in our case: a racing car always roughly knows its position from odometry, so no global search is needed. A particle filter is also inherently stochastic, so its output pose jitters slightly. In other words, you **take on a noise burden for robustness you don't need**. ICP is deterministic, so its output is smooth, and with a good initial guess it converges precisely right away.

**Versus Cartographer.** Cartographer is excellent, but as anyone who has used it knows, it has dozens of `.lua` configuration parameters. When something breaks, "what do I even touch?" is daunting. ICP, by contrast, has few parameters and each is intuitive (correspondence distance, convergence threshold, robust kernel). **You can quickly narrow down the cause and tune it when something goes wrong** — in the field, that makes a bigger difference than you'd expect.

| | Particle filter | Cartographer | **ICP (our choice)** |
|---|---|---|---|
| Initial-guess dependence | Low (global) | Medium | High (handled by odometry) |
| Global robustness | High | Medium | Low (unneeded for racing) |
| Output characteristic | Stochastic, jittery | Smooth | Deterministic, smooth |
| Tuning difficulty | Low | **High** | **Low** |

In short, for our problem — **precisely refining a pose we already roughly know** — ICP fit best. And being simple, it gets much better with just the two details below.

## Detail 1 — Robust kernel: don't be swayed by what's not on the map

ICP computes rotation/translation from the mismatch (**residual**) between the map and sensor data, and there are several ways to handle that residual. The basic form, **L2 (least squares)**, minimizes the sum of squared residuals.

$$
\min \sum_i r_i^2
$$

The problem is the "square." Points with large residuals get squared and **dominate** the sum. But while the map has only static walls, a real scan captures **things not on the map** — most notably an opponent car passing alongside. From the alignment's point of view those points are **outliers**, and a few of them with large residuals pull the whole alignment toward themselves. The result: localization wobbles when a car passes by.

A **robust kernel** kills the weight once a residual exceeds a certain size, reducing the outliers' say. For example, the weight of the Geman–McClure kernel we use looks roughly like this:

$$
w(r) = \frac{c^4}{(c^2 + r^2)^2}
$$

When the residual $r$ is smaller than the scale $c$, the weight ≈ 1 (normal wall points stay); when it exceeds $c$, it drops quickly toward 0 (opponent points are nearly ignored). The alignment thus stays **faithful to the walls while letting outliers slide**.

![L2 alignment](/assets/img/posts/2d-icp-localization/l2.gif)
*L2 — localization wobbles when a car passes alongside*

![Geman–McClure alignment](/assets/img/posts/2d-icp-localization/mc.gif)
*Geman–McClure (robust) — stays stable in the same situation*

## Detail 2 — Point-to-plane: treat walls as "surfaces," not "points"

How you define the correspondence (residual) also greatly changes convergence behavior. There are two options.

- **Point-to-point**: attach scan point $p$ to the nearest **point** $q$ on the map. Residual $= \lVert p - q \rVert$.
- **Point-to-plane**: attach scan point $p$ to the **surface** it lies on. Residual $= \lvert (p - q)\cdot n \rvert$ (only the distance along the wall normal $n$).

The key difference is the **tangent direction along the wall**. Track walls are long and flat. Wherever you sample a point along the wall, the scan looks essentially the same (the tangent direction is unobservable). Yet point-to-point tries to stick the point "exactly" onto a specific point $q$, so it **forces a fit even along this unobservable tangent direction**. On a discretized grid this creates a fake constraint, and the longer the wall, the larger this wasted force — slowing convergence and wobbling at corners.

Point-to-plane looks **only at the normal-direction distance**, so points can slide freely along the wall. In environments with many flat surfaces, like a track or a corridor, it converges **faster and more stably**. This is why ICP commonly uses point-to-plane in indoor/structured environments.

![Point-to-point alignment](/assets/img/posts/2d-icp-localization/point2point.gif)
*Point-to-point — the fake constraint along the wall slows convergence and eventually diverges*

![Point-to-plane alignment](/assets/img/posts/2d-icp-localization/point2plane.gif)
*Point-to-plane — treating the wall as a surface converges smoothly*

## Wrap-up

Without bringing in a complex SLAM stack, **simple 2D ICP** plus two details does track localization well enough.

- A **robust kernel** keeps it from being swayed by objects not on the map (opponent cars), and
- **Point-to-plane** treats walls as surfaces for fast, stable convergence.

Above all, having few, intuitive parameters means you can fix it quickly when something goes wrong.
