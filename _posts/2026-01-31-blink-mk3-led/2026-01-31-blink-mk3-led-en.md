---
title: Showing Vehicle State with a USB LED (Blink mk3)
author: jeongsang-ryu
date: 2026-01-31 13:00:00 +0900
categories: [Hardware, Manual]
tags: [LED, blink, ROS, hardware, manual]
image:
  path: /assets/img/posts/blink-mk3-led/blink-mk3.png
lang: en
lang_ref: blink-mk3-led
---

Being able to see the vehicle’s state (driving, idle, emergency stop, etc.) from the outside helps a lot with debugging and safety. Our team mounts an LED inside the UNICORN horn to display vehicle state in real time.

This post compares three approaches we considered and explains why we chose **Blink mk3**.

---

## Method 1: Jetson GPIO

![Jetson GPIO](/assets/img/posts/blink-mk3-led/jetson-gpio.png)
*Source: [https://kettle-ear.tistory.com/11](https://kettle-ear.tistory.com/11)*

Jetson dev kits can control LEDs directly via GPIO. However, our main computing unit is **Intel NUC**, which has no GPIO, so we needed a USB‑based method.

---

## Method 2: Arduino

![Arduino Method](/assets/img/posts/blink-mk3-led/arduino-method.png)

This approach connects USB to an Arduino, and the Arduino controls the LED. The ForzaETH team reportedly uses this method.

But adding an Arduino adds hardware complexity, so we looked for a USB LED device with an official API.

---

## Method 3: Blink mk3 (Our choice)

![Blink Method](/assets/img/posts/blink-mk3-led/blink-method.png)

There are many USB LEDs, but the key requirement was **a developer API/driver**. After comparing options, we found **Blink mk3**, which even provides a **ROS driver**, making integration straightforward.

![Mounted on the Unicorn horn](/assets/img/posts/blink-mk3-led/unicorn-horn-led.png)
*Mounted on the Unicorn horn*

> The horn was designed and 3D‑printed by our team.
{: .prompt-info }

### Related links

- Our Blink ROS package: [https://github.com/HMCL-UNIST/unicorn-racing-stack/tree/main/sensors/blink](https://github.com/HMCL-UNIST/unicorn-racing-stack/tree/main/sensors/blink)
- Our Blink usage code: [https://github.com/HMCL-UNIST/unicorn-racing-stack/blob/main/state_machine/state_indicator/src/state_indicator_node.py](https://github.com/HMCL-UNIST/unicorn-racing-stack/blob/main/state_machine/state_indicator/src/state_indicator_node.py)
- Blink mk3 (Amazon): [https://www.amazon.com/ThingM-Blink-USB-RGB-BLINK1MK3/dp/B07Q8944QK?th=1](https://www.amazon.com/ThingM-Blink-USB-RGB-BLINK1MK3/dp/B07Q8944QK?th=1)
- ROS Wiki - blink1: [https://wiki.ros.org/blink1](https://wiki.ros.org/blink1)
- blink1_node (Bitbucket): [https://bitbucket.org/castacks/blink1_node/src/master/](https://bitbucket.org/castacks/blink1_node/src/master/)

---

## Summary

We compared three methods (Jetson GPIO, Arduino, USB LED) and chose **Blink mk3** for our autonomous vehicle state indicator.

Blink mk3 connects via USB and provides an official ROS driver, so we can show vehicle state without an extra microcontroller.
