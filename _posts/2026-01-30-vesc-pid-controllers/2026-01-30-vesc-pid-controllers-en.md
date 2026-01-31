---
title: How to Tune the VESC PID Speed Controller
author: hyeongjoon-yang
date: 2026-01-30 13:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, PID, motor-control, manual]
lang: en
lang_ref: vesc-pid-controllers
---

The VESC PID Speed Controller tunes the motor’s RPM response. Use it after completing **[FOC setup]({{ site.baseurl }}/posts/vesc-foc-tab/)** to improve control precision.

> **Sensorless motors** require PID tuning. Sensored motors usually work more stably without extensive tuning.
{: .prompt-info }

---

## 1. Set PID Gains

In **Motor Settings → PID Controllers**, adjust the Speed Controller P, I, D gains.

![PID Controllers Interface](/assets/img/posts/vesc-pid-controllers/pid-interface.png)

---

## 2. Monitor RPM in Real Time

Use **Data Analysis → Realtime Data → RPM** to verify tuning results.

> Enable **Stream realtime data** in the right menu to display live data.
{: .prompt-warning }

![RPM Control](/assets/img/posts/vesc-pid-controllers/rpm-control.png)

Use the **play** button next to RPM to run the motor, and **STOP** to stop it.

![Realtime Data](/assets/img/posts/vesc-pid-controllers/realtime-data.png)

---

## 3. Tuning Guide

| Gain | Role | Tuning direction |
|------|------|------------------|
| **P** | Proportional response to RPM error | Increase gradually for faster response |
| **I** | Removes steady‑state error | Often keep default |
| **D** | Damps rapid changes (reduces oscillation) | Increase slightly to suppress overshoot |

### Tuning order

1. **Start with P** — raise gradually while checking response across RPM ranges. Stop before excessive overshoot.
2. **Add D** — reduce overshoot or large oscillations after raising P. Increase slowly to avoid over‑sensitivity.
3. **Validate across RPM range** — verify stability at both low and high speed.

> Because this directly affects current, always adjust gains **in small increments**.
{: .prompt-danger }
