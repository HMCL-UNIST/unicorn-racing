---
title: When Servo Output Does Not Work on VESC
author: hyeongjoon-yang
date: 2026-01-30 14:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, servo, motor-control, manual]
lang: en
lang_ref: vesc-servo-output
---

If you connect a servo to VESC but get no output, the Servo Output option is likely disabled in VESC Tool.

---

## Enable Servo Output

In **App Settings → General → General Tab**, enable `Enable Servo Output`.

![Servo Enable](/assets/img/posts/vesc-servo-output/servo-enable.png)

If this is off, VESC will not output PWM on the servo pins.

---

## Verify Servo Operation

After enabling, test the servo in **App Settings → General → Controls Tab**.

![Servo Controls](/assets/img/posts/vesc-servo-output/servo-controls.png)

If the servo responds to the slider, the setup is correct.

> After changes, always click **Write App Configuration** in the right menu to save.
{: .prompt-warning }
