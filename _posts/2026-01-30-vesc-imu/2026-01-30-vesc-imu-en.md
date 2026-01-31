---
title: Using the VESC Built‑in IMU in ROS
author: hyeongjoon-yang
date: 2026-01-30 15:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, IMU, ROS, manual]
lang: en
lang_ref: vesc-imu
---

VESC has a built‑in IMU, so you can use 6‑axis data without an external IMU module. To use it, you must first complete **[Firmware Upgrade]({{ site.baseurl }}/posts/vesc-firmware-upgrade/)**.

---

## Configure IMU in VESC Tool

In **App Settings → General → IMU Tab**, you can edit IMU settings. Enable **Activate IMU Sampling** in the right menu to view IMU data in real time.

![IMU Settings](/assets/img/posts/vesc-imu/imu-settings.png)

---

## Check IMU Data

You can inspect live IMU data in **Data Analysis → IMU Data**.

![IMU Data](/assets/img/posts/vesc-imu/imu-data.png)

---

## Use IMU Topics in ROS

When controlling VESC via ROS, the built‑in IMU data is published on:

```
vesc/sensors/imu/raw
```

> Always verify axis directions using IMU output, and set accurate static TF between `base_link` and the sensor frames.
{: .prompt-info }
