---
title: VESC Motor Direction and Current Settings Guide
author: hyeongjoon-yang
date: 2026-01-30 11:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, motor-control, manual]
lang: en
lang_ref: vesc-general-tab
---

In **Motor Settings → General**, you can set motor direction and current limits. These are critical settings that directly affect performance and safety.

> After changing Motor Settings, always click **Write Motor Configuration** in the right menu to save.
{: .prompt-warning }

---

## Motor Direction

If the motor spins in the wrong direction, you can fix it in three ways:

| Method | Description |
|------|------|
| **Invert Motor Direction** (recommended) | Simple checkbox in General → General |
| Swap 2 of the 3 phase wires | Physically swap any two motor wires |
| Flip sign in ROS package | Invert sign in the VESC ROS command path |

---

## Motor Current Limits

In **General → Current**, you can set the maximum current applied to the motor.

> Check **VESC specs** and **motor specs** before changing current limits.
{: .prompt-info }

![General Tab](/assets/img/posts/vesc-general-tab/general-tab.png)

### How to tell if current is insufficient

You can monitor current in real time via the ROS topic `vesc/sensors/core`. Consider increasing current if:

- Vehicle speed no longer increases even with higher commands
- Current consistently hits the configured maximum

### Current settings for sensorless motors

Sensorless motors cannot estimate rotor position at very low speed, so they **force rotation with maximum allowable current** and then transition to FOC. This makes current settings especially important.

| Case | Symptom |
|------|---------|
| Current **too high** | Overload at startup, risk of DRV8301 driver damage, “dinosaur” sound |
| Current **too low** | Slow start or failure to start; “dinosaur” sound may still occur |

> Voltage, RPM, Advanced, etc. can be dangerous if changed without expertise.
{: .prompt-danger }
