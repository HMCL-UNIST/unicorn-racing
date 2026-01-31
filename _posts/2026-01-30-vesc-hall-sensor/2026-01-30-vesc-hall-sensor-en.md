---
title: Sensored FOC Setup with Hall Sensors on VESC
author: hyeongjoon-yang
date: 2026-01-30 10:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, hall-sensor, motor-control, manual]
lang: en
lang_ref: vesc-hall-sensor
---

Sensorless FOC can be unstable at low speed because rotor position estimation is weak. If your motor supports Hall sensors, switching to **Sensored FOC** provides stable low‑speed control.

> Not all sensored motors are compatible with VESC Hall Sensor mode. See [Motor Compatibility](#motor-compatibility).
{: .prompt-warning }

---

## 1. Hardware Connection

Connect the motor Hall sensor cable to the **SENSE port** (6‑pin) on the top of the VESC board.

![VESC SENSE port](/assets/img/posts/vesc-hall-sensor/sense-port.png){: w="240" }

---

## 2. Measure Hall Sensors

In **Motor Settings → FOC → Hall Sensors**, click the **play** button to measure the Hall sensors.

![Hall Sensor Tab](/assets/img/posts/vesc-hall-sensor/hall-sensor-tab.png)

During measurement, the wheels will twitch slightly. After it finishes:

1. Click **Apply**
2. Click **Write Motor Configuration** (top‑right) to save

Then in **[FOC settings]({{ site.baseurl }}/posts/vesc-foc-tab/)**, set Sensor Mode to **Hall Sensors** to enable Hall‑based FOC control.

---

## Motor Compatibility

| Motor | Hall Sensor | VESC Compatible |
|------|-------------|-----------------|
| [EZRUN 3665SD 2400kv G3](https://www.falconshop.co.kr/shop/goods/goods_view.php?goodsno=100073977) | Hall sensors | **Yes** |
| [AXE550 R2 3300kv](https://m.toprc.co.kr/product/30401256-xerun-axe550-r2-3300kv-%EB%AA%A8%ED%84%B0/21488/display/1/) | Proprietary magnetic encoder | **No** |

Motors with proprietary encoders designed for specific ESCs will not work with VESC Hall Sensor mode. Always verify that the motor uses **standard Hall sensors** before purchasing.
