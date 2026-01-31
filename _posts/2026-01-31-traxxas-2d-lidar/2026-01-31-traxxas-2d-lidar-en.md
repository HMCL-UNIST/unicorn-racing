---
title: Why We Switched the Chassis from Traxxas to Serpent SRX8
author: jeongsang-ryu
date: 2026-01-31 15:00:00 +0900
categories: [Hardware]
tags: [chassis, Traxxas, Serpent, LiDAR, hardware]
image:
  path: /assets/img/posts/traxxas-2d-lidar/fiesta-slash.png
lang: en
lang_ref: traxxas-2d-lidar
---

Our team moved from **Traxxas Fiesta** and **Traxxas Slash** to **Serpent SRX8 GTE**. This post summarizes the structural issues of Traxxas chassis in a 2D LiDAR setup, and why we decided to switch.

![Traxxas Fiesta & Slash](/assets/img/posts/traxxas-2d-lidar/fiesta-slash.png)

---

## Assumptions

- We assume a 2D LiDAR setup
- We consider competitions on flat tracks

Under these conditions, accurately estimating roll and pitch with only 2D LiDAR and auxiliary sensors (IMU, wheel odometry) is very difficult. It is hard to tell whether LiDAR points are on the ground, on track boundaries, or outside the track.

> We treat roll/pitch motion as **something to eliminate**, not something to estimate.
{: .prompt-danger }

---

## 1. High Center of Gravity

Traxxas Fiesta and Slash were not designed for 2D‑space or high‑speed racing.

| Vehicle | Intended use |
|------|-----------|
| **Fiesta** | Rally |
| **Slash** | Off‑road truck |

The high center of gravity causes large roll in high‑speed cornering, which pushes the LiDAR scan plane out of alignment.

**Solution:** use a lower‑profile chassis.

---

## 2. Unnecessary Roll/Pitch Motion

- Stock shock stiffness is too soft
- The chassis has a lot of mechanical play

**Solution:**
- Choose a chassis with less roll/pitch
- Use a more rigid, higher‑quality platform (may cost more)

---

## 3. Motor Mounting Issue (Critical)

This was the most serious issue. The motor mount area is **plastic**, so it gradually warps from heat and repeated use.

![Problematic motor mount](/assets/img/posts/traxxas-2d-lidar/motor-mount-part.png)
*Problematic motor mount part*

The motor shaft (**pinion gear**) and the drivetrain (**spur gear**) easily misalign. Over time, noise increases and the gears start to grind.

![Motor alignment detail](/assets/img/posts/traxxas-2d-lidar/motor-alignment-detail.png)

The yellow‑arrow area is firmly clamped with a lock nut (green box), but the red‑arrow area is simply supported. This structure leads to alignment drift.

![Axis alignment comparison](/assets/img/posts/traxxas-2d-lidar/axis-alignment.png)

Initially the shafts are aligned (left), but over time they twist (right). At that point, replacing the motor housing is the only fix.

> If you hear grinding or rattling, check the motor housing parts.
{: .prompt-warning }

### Solution

- Chassis with **metal or rigid** motor mounts
- Two or more mounting points to prevent bending (lever effect)
- Example: **Serpent SRX8 GTE '23 1/8 4WD EP**

![Serpent SRX8 motor mount](/assets/img/posts/traxxas-2d-lidar/serpent-srx8-motor.png)
*With Serpent SRX8, axis alignment does not drift unless the motor shaft itself bends.*

---

## Conclusion

We switched from Traxxas to Serpent SRX8 not as a hardware upgrade for performance, but to **reduce hardware‑induced problems and focus on software competition**.

Early in F1TENTH (now RoboRacer), Traxxas was popular because it was pre‑assembled and affordable. In recent years, many teams strengthened suspensions or used tape/CA glue to reduce shocks. This was not “cheating,” but an unavoidable step to reduce **unnecessary motion in 2D LiDAR**.

The instability during hard acceleration/braking was not a software failure—it was a hardware limitation that made stable 2D operation nearly impossible.

> If we move to 3D LiDAR and cameras in the future, software advances could solve more issues even with stricter hardware rules. A better class split might be **2D LiDAR** vs **3D LiDAR + Camera**, rather than strict chassis specs.
{: .prompt-tip }
