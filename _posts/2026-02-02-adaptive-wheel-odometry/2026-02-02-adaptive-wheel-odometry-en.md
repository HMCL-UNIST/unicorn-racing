---
title: Correcting Wheel Slip with Adaptive Wheel Odometry
author: hangyo-cho
date: 2026-02-02 11:00:00 +0900
categories: [Software, state estimation]
tags: [cartographer, lidar, odometry]
image:
  path: /assets/img/posts/adaptive-wheel-odometry/adaptive-odometry-diagram.png
lang: en
lang_ref: adaptive-wheel-odometry
math: true

---

## Design Goal

The goal was to make the actual vehicle speed ($v_{car}$) and the wheel odometry speed ($v_{wheel}$) as similar as possible. To achieve this, the $ERPM\ gain$ value was designed to change dynamically based on driving conditions, rather than being a fixed $constant$.

---

## Prior Knowledge

This model was designed based on the following four key pieces of prior knowledge and assumptions.

1. **Acceleration Phase**: The wheel odometry prediction is larger than the actual speed.
2. **Braking Phase**: The wheel odometry prediction is smaller than the actual speed.
3. **Acceleration Proportionality**: The degree of slip is assumed to be proportional to the vehicle heading direction acceleration ($a_x$).
4. **Constant Velocity Slip**: A certain amount of slip occurs even during constant velocity driving without acceleration.

---

## Equation

Based on the prior knowledge described above, the following dynamic equation was derived.

$$
\text{Adaptive ERPM gain} = (\text{Theoretical ERPM gain}) + \sigma \cdot a_x + \delta
$$

---

## Parameter Configuration

- **$\sigma$ (Slip rate) and $\delta$ (Offset)**: Rather than directly measuring the degree of slipperiness, these were set as separate tuning parameters to flexibly respond to the road surface conditions at the competition venue and the quality of Localization.

> By adjusting the $\sigma$ and $\delta$ values according to road surface conditions, stable odometry can be obtained in various environments.
{: .prompt-tip }

---

## Key Source Code Analysis

The code below **filters the acceleration data from the IMU using a Low-pass filter** and **calculates the Adaptive ERPM gain** using the filtered acceleration value.

```cpp
// adaptive_vesc_to_odom.cpp
// 114~116

// Filter acceleration data using Low-pass filter
filtered_linear_accel_x = l_filter_alpha_ * linear_accel_x + (1-l_filter_alpha_)*filtered_linear_accel_x;

// Calculate Adaptive ERPM gain: (Theoretical gain + offset) + σ * a_x
double filtered_speed_to_erpm_gain_ = (speed_to_erpm_gain_ + eprm_offset_) + accel_gain_ * filtered_linear_accel_x;
```

The code below **calculates the current speed using the Adaptive ERPM gain** computed above.

```cpp
// adaptive_vesc_to_odom.cpp
// 121~126

// Calculate current speed using Adaptive gain
double current_speed = (-state->state.speed + speed_to_erpm_offset_) / filtered_speed_to_erpm_gain_;

// Apply deadzone to remove noise
if (std::fabs(current_speed) < 0.05)
{
  current_speed = 0.0;
}
```

---

## Results

By applying this dynamic Gain model and optimizing the parameters, the error between actual speed and odometry was effectively reduced.

---

## Summary

Adaptive Wheel Odometry is a technique that corrects wheel slip occurring during acceleration/deceleration in real-time using IMU acceleration data.

Key points summarized:
- **Dynamic ERPM gain**: Uses a gain that changes dynamically based on acceleration instead of a fixed constant
- **Low-pass filter**: Removes noise from IMU acceleration data to obtain stable correction values
- **Tuning parameters**: Adjust $\sigma$ (slip rate) and $\delta$ (offset) according to road surface conditions

This technique is particularly effective for improving Localization performance on low-friction surfaces or during high-speed driving. When used together with Cartographer, more accurate position estimation becomes possible.
