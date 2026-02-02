---
title: "Adaptive Wheel Odometry: Dynamic ERPM Gain Model"
author: hangyo-cho
date: 2026-02-02 20:57:54 +0900
categories: [racing stack]
tags: [racing-stack, odometry, wheel-odometry, localization, erpm]
image:
  path: /assets/img/posts/adaptive-wheel-odometry/overview.png
math: true
lang: en
lang_ref: adaptive-wheel-odometry
---

## Design goal

The goal is to make the wheel-odometry velocity ($v_{wheel}$) as close as possible to the true vehicle velocity ($v_{car}$). To achieve this, the ERPM gain is modeled as a **dynamic value** rather than a fixed constant.

---

## Prior knowledge and assumptions

The model is based on the following observations and hypotheses.

1. **Acceleration phase**: wheel odometry tends to overestimate the true velocity.
2. **Braking phase**: wheel odometry tends to underestimate the true velocity.
3. **Proportionality to acceleration**: slip magnitude is assumed to be proportional to longitudinal acceleration ($a_x$).
4. **Slip at constant speed**: a non-zero slip is present even during constant-velocity motion.

---

## Equation

Based on the assumptions above, we use the following dynamic relationship.

$$
\text{Adaptive ERPM gain} = (\text{Theoretical ERPM gain}) + \sigma \cdot a_x + \delta
$$

### Parameters

- **$\sigma$ (Slip rate)** and **$\delta$ (Offset)**: tuning parameters that adapt to track conditions and localization quality when direct slip measurement is not available.

---

## Result

With the dynamic gain model and optimized parameters, the error between wheel odometry and true vehicle speed can be significantly reduced.

## Wrap-up

The adaptive ERPM gain model improves wheel-odometry accuracy by reflecting slip during acceleration, braking, and constant-speed motion. By tuning $\sigma$ and $\delta$ to the surface and localization quality, you can achieve more stable and reliable velocity estimates.