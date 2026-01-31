---
title: FOC Tab (Motor Settings)
author: hyeongjoon-yang
date: 2026-01-30 12:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, FOC, motor-control, manual]
lang: en
lang_ref: vesc-foc-tab
---

> If you change any Motor Settings, you must click **Write motor configuration** on the right menu to save.

FOC stands for Field Oriented Control and is the standard control method for BLDC motors. You run motor detection to find parameters that allow proper control, then apply them to the motor.

In **General → General**, you can select the Sensor Mode: **Sensorless**, **HFI**, or **Hall Sensors**.

For all three modes, you should first measure or set the required values in the Sensorless / Hall Sensors / HFI tabs next to General. Then, in **General → General**, set the sensor mode and run **Detect and Calculate Parameters** in order: **RL**, **Lambda**, **Apply**.

When you press **RL**, you will hear a short “beep” (dinosaur‑like sound) while it prepares for the next step. When you press **Lambda**, the wheels begin to spin.

![Sensor Mode](/assets/img/posts/vesc-foc-tab/sensor-mode.png){: w="355" }

![Detect and Calculate Parameters](/assets/img/posts/vesc-foc-tab/detect-parameters.png)

![FOC Tab Full](/assets/img/posts/vesc-foc-tab/foc-tab-full.png)

Sometimes the Lambda value stays red and does not complete. This can happen on older firmware. If so, **upgrade the firmware** and repeat the setup from the beginning.

After parameters are measured, do not forget to click **Write motor configuration** to save.
