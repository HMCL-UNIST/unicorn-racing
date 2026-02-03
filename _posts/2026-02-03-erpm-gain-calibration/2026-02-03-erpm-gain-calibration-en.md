---
title: "ERPM Gain Calculation and Calibration Guide"
author: hyeongjoon-yang
date: 2026-02-03 01:12:52 +0900
categories: [build, beginner]
tags: [erpm, motor, odometry, vesc, wheel]
image:
  path: /assets/img/posts/erpm-gain-calibration/overview.png
lang: en
lang_ref: erpm-gain-calibration
math: true
---

When controlling a motor by speed rather than throttle, it is critical to find the proportional constant that maps user commands to the actual hardware setup. This constant affects odometry drift, and a wrong value can lead to control errors and accidents. This post summarizes the ERPM gain concept, theoretical calculation, and practical calibration.

## What is ERPM?

VESC converts a speed command (m/s) into **ERPM (Electrical RPM)** and sends it to the motor. ERPM is the motor's RPM multiplied by the number of **pole pairs**.

$$
ERPM = RPM \cdot \text{pole_pairs}
$$

The speed–ERPM relationship can be expressed with a gain and offset:

$$
ERPM = speed \cdot \text{speed_to_erpm_gain} + \text{speed_to_erpm_offset}
$$

VESC ROS packages use this relationship to convert speed commands into ERPM.

## Factors that affect ERPM gain

ERPM gain depends on hardware. Key factors include:

- **Motor pole pairs**: ERPM equals RPM multiplied by pole pairs. For example, the Traxxas Velineon 3500 is a 4‑pole motor, so pole pairs = 2.
- **Gear ratio**: The final ratio from pinion–spur and differential–shaft gears. Example for Traxxas Fiesta: 12:83 and 13:37.
- **Wheel radius**: Measure directly or check manufacturer specs. For Traxxas Fiesta, wheel diameter is ~10 cm, so radius is 0.05 m.

## Theoretical ERPM gain calculation

We calculate the theoretical ERPM gain for a Traxxas Fiesta with a Velineon motor.

### Hardware specs

| Item | Value |
| --- | --- |
| Motor | Traxxas Velineon 3500 (4‑pole) |
| Pole pairs | 2 |
| Pinion–spur ratio | 12 : 83 |
| Diff–shaft ratio | 13 : 37 |
| Wheel diameter | 10 cm |
| Wheel radius | 0.05 m |

### Gear ratio calculation

The final gear ratio is the product of the pinion–spur ratio and the diff–shaft ratio.

$$
\text{gear_ratio} = \frac{83}{12} \times \frac{37}{13} \approx 19.69
$$

### ERPM gain calculation

$$
\text{speed_to_erpm_gain} = \frac{\text{pole_pairs} \cdot \text{gear_ratio}}{2\pi \cdot \text{wheel_radius}}
$$

Plugging in the values gives a theoretical speed_to_erpm_gain of **~7520** for the Traxxas Fiesta + Velineon setup. Update the value in `vesc.yaml` accordingly.

## Estimating ERPM gain experimentally

If the exact hardware specs are unknown or theoretical calculation is difficult, you can estimate ERPM gain experimentally.

### Method 1: High‑speed camera (recommended)

This is the most direct and accurate method.

**What you need**
- A high‑speed camera (phone slow‑motion works)
- A marker on the tire (tape, etc.)

![Tire marker](/assets/img/posts/erpm-gain-calibration/tire-marker.png)

**Steps**
1. Place a rotation marker on the tire.
2. Command a constant speed. (PID tuning is required to hold steady speed.)
3. Measure the time for one full rotation using the high‑speed video.
4. Compute the actual speed from rotation time and wheel circumference.

**Adjusting gain**
- If actual speed is higher than commanded, increase the gain.
- If actual speed is lower, decrease the gain.

### Method 2: Odometry (noisy, not recommended)

This method uses ROS odometry.

**What you need**
- Tape measure or distance marker
- Start‑line tape
- A vehicle with servo offset tuning done

**Steps**
1. Mark the start position.
2. Reset or record `/vesc/odom` position to zero.
3. Drive straight for a fixed distance (e.g., 5 m) at low speed.
4. Compare the actual distance with the `/vesc/odom` distance.

**Calibration formula**
$$
\text{new\_gain} = \text{old\_gain} \times \frac{\text{actual\_distance}}{\text{odom\_distance}}
$$

For example, if old gain is 7520 and odom shows 5.5 m while the actual distance is 5 m:

$$
\text{new\_gain} = 7520 \times \frac{5.0}{5.5} \approx 6840
$$

Repeat until odom distance matches the actual distance.

## Wrap-up

ERPM gain calibration is fundamental for accurate speed control and odometry in autonomous vehicles. If calibration is off, odometry drift can accumulate and cause path deviations or accidents. Take the time to measure carefully and tune the gain precisely.
