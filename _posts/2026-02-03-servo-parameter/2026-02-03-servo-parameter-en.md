---
title: How to Find VESC Servo Parameters
author: hyeongjoon-yang
date: 2026-02-03 21:00:00 +0900
categories: [build, beginner]
tags: [gain, servo, vesc]
image:
  path: /assets/img/posts/servo-parameter/servo-output.png
lang: en
lang_ref: servo-parameter
math: true
---

In autonomous driving, precise steering control directly affects path following performance. If the conversion between steering commands and actual wheel angles is inaccurate, the vehicle cannot follow the intended path and may result in path deviation or accidents. This post covers the concept and characteristics of Servo Parameters and how to calibrate them through experiments.

## What is Servo Parameter?

In the VESC ROS package, steering commands are input as steering angles in radians and converted to values between 0 and 1 that the servo understands. This conversion relationship can be represented by gain and offset as follows:

```
servo_value = steering_angle_to_servo_gain × steering_angle + steering_angle_to_servo_offset
```

- **steering_angle**: Steering angle input by the user (radians)
- **servo_value**: Command delivered to the servo (0 ~ 1)
- **steering_angle_to_servo_gain**: Proportional constant for converting steering angle to servo value
- **steering_angle_to_servo_offset**: Servo value at straight-ahead position (steering angle 0)

## Theoretical Measurement of Servo Parameters

For ERPM gain, hardware specifications such as gear ratio, pole pairs, and wheel radius are multiplied linearly, so it can be calculated mathematically.

On the other hand, Servo Parameters are difficult to measure theoretically. To understand why, you need to know the structure of RC car steering systems.

### What is Ackermann Steering Geometry?

When a vehicle turns, the two front wheels are positioned at different distances from the center of rotation. The inner wheel is closer to the center of rotation, and the outer wheel is farther away.

Wheels can only roll purely in a direction perpendicular to their axis. If both front wheels turn at the same steering angle, the extensions of the two wheel axes become parallel, resulting in different turning radii for each wheel and slip occurring.

To prevent this, the inner wheel must turn more and the outer wheel less so that the extensions of both wheel axes meet at the same center of rotation. This geometric condition is called **Ackermann Steering Geometry**.

![Ackermann Steering Geometry](/assets/img/posts/servo-parameter/ackermann-geometry.png)
_Ackermann Steering Geometry_

### Nonlinearity of Bellcrank System

In RC cars, Ackermann Steering Geometry is approximately implemented through bellcrank systems, tie rods, and knuckle arms. Due to this complex kinematic structure, the relationship between servo angle and actual wheel steering angle is **nonlinear**.

| ![Traxxas Bellcrank](/assets/img/posts/servo-parameter/traxxas-bellcrank.png) | ![Traxxas Ackermann](/assets/img/posts/servo-parameter/traxxas-ackermann.png) |
|:---:|:---:|
| Traxxas Fiesta Steering System (Bellcrank) | Traxxas Fiesta Ackermann Steering Geometry |

In other words, the `steering_angle_to_servo_gain` we set is actually a linear approximation that works well around the center (straight ahead) but may have errors near maximum steering angles. Therefore, it's common to calibrate Servo Parameters experimentally for the range you frequently use rather than through theoretical calculations.

## Characteristics of Servo Parameters

### Servo Range Based on Hardware

While the servo receives commands between 0 and 1, depending on hardware specifications, steering commands (radians) may use the entire range or only a portion of it.

### Nonlinearity and Calibration Range

Due to the bellcrank linkage structure, the relationship between servo value and actual wheel steering angle is nonlinear. Therefore, it doesn't map accurately to the required turning radius at all steering angles. For this reason, it's recommended to map servo gain within the steering angle range you frequently use.

For example, if most steering in F1tenth driving occurs within ±0.25 radians (approximately ±14 degrees), it's effective to match accuracy within that range. Extreme steering angles are only used in low-speed emergency situations, so slight errors are acceptable.

### Importance of Servo Horn Initial Position

When applying servo gain and offset, care must be taken to ensure that maximum steering commands don't constrain only one direction (left or right). In other words, even with maximum steering commands, servo commands must always be between 0 and 1.

For this purpose, it's important to position the servo horn initial position well at the center of the operating range. When the servo horn is properly installed, the offset is measured close to 0.5.

## Finding Servo Parameters Experimentally

### Finding Offset (Straight Alignment)

The offset is the servo value when the steering angle is 0. You just need to find the servo value when the wheels point exactly straight ahead.

### Measurement Procedure

1. To minimize the effects of tire friction or floor texture, use the joystick to give left and right steering commands before measurement so the servo motor is well positioned at center.
2. Start slowly to avoid tire slipping and drive straight.
3. Observe the direction the vehicle is traveling to check if it goes straight without drifting left or right.
4. If it doesn't go straight, adjust the offset value slightly and repeat.
5. Set the value when the vehicle goes exactly straight as `steering_angle_to_servo_offset`.

> If the servo horn is properly installed, the offset will be near 0.5. If it deviates significantly from 0.5, it's recommended to remove and reinstall the servo horn to center it.
{: .prompt-tip }

### Finding Gain

Gain is the ratio of servo value change to steering angle change. Measure the turning radius through accumulated odometry in rviz and tune the gain using the Ackermann formula.

### Ackermann Turning Radius Formula

In Ackermann steering geometry, the relationship between steering angle and turning radius is as follows. The wheelbase is the distance between the front and rear axles, which can be measured directly with a ruler or referenced from manufacturer information.

$$
\text{turning_radius} = \frac{\text{wheelbase}}{\tan(\text{steering_angle})}
$$

Calculate the expected turning radius from the commanded steering angle and adjust the gain by comparing it with the actual measured turning radius.

![Rviz Turning Radius Measurement](/assets/img/posts/servo-parameter/rviz-turning-radius.png)
_Measuring turning radius using Rviz_

### Measurement Procedure

1. Start with odometry visualization available in rviz.
2. Drive in a circle at low speed without slip while giving a constant steering angle command (e.g., 0.2 rad).
3. When the accumulated odometry trajectory in rviz forms a circle, use the Measure function to measure the circle's diameter and obtain the turning radius (R).
4. Compare the expected turning radius calculated from the commanded steering angle with the actual turning radius and adjust the gain.

### Calculation Example (Based on Traxxas Fiesta)

| Item | Value |
|------|-------|
| Wheelbase | 0.33m |
| Commanded steering angle | 0.2 rad |
| Expected turning radius | 0.33 / tan(0.2) ≈ 1.62m |
| Actually measured turning radius | 1.8m |

In this case, since the actual (1.8m) is larger than expected (1.62m), it means the actual steering angle is smaller than commanded. Therefore, the absolute value of gain should be increased.

### Correction Method

| Situation | Action |
|-----------|--------|
| Actual turning radius > Expected turning radius | Increase the absolute value of gain |
| Actual turning radius < Expected turning radius | Decrease the absolute value of gain |

### Precautions

- Test multiple points within the frequently used steering angle range (e.g., ±0.25 rad) to find a gain that works well overall.
- When measuring, drive at sufficiently low speed to avoid slip to obtain an accurate turning radius.

## Conclusion

Servo Parameters must be measured experimentally, but since the values don't change unless the hardware is modified, you only need to measure them accurately once. It's recommended to take time for precise calibration. These parameters map the user's intended steering angle to be accurately transmitted to the vehicle, so be careful not to manipulate them arbitrarily after calibration.
