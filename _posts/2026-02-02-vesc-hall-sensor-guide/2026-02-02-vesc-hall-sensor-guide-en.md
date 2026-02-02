---
title: "VESC Hall Sensor Guide"
author: jeongsang-ryu
date: 2026-02-02 21:40:14 +0900
categories: [build, advanced]
tags: [hall sensor, motor, vesc]
image:
  path: /assets/img/posts/vesc-hall-sensor-guide/overview.png
lang: en
lang_ref: vesc-hall-sensor-guide
---

VESC can use Hall Sensors for precise motor control.

## Reference video

{% include embed/youtube.html id='RfV7ZwkSLok' %}

## How to measure Hall Sensors

Connect the motor Hall Sensor wires to the SENSE port (the 6-pin connector at the top in the photo). Then go to **Motor Settings → FOC → Hall Sensors** and press the play button at the bottom to measure.

![SENSE port location](/assets/img/posts/vesc-hall-sensor-guide/sense-port.png)

During measurement, the wheel will move slightly forward and backward. After measurement, click **Apply** to save the sensor values and **Write Motor Configuration** in the top-right to save the config.

![Hall Sensor measurement screen](/assets/img/posts/vesc-hall-sensor-guide/hall-measure.png)

After this, you can run FOC using Hall Sensors.

## Cautions

Not all sensored motors are compatible with VESC Hall Sensor mode. Motors with **built-in proprietary encoders** designed for their own ESCs may not work with VESC.

- Example compatible: [EZRUN 3665SD 2400kv G3](https://www.falconshop.co.kr/shop/goods/goods_view.php?goodsno=100073977)
- Example likely incompatible: [AXE550 R2 3300kv](https://m.toprc.co.kr/product/30401256-xerun-axe550-r2-3300kv-%EB%AA%A8%ED%84%B0/21488/display/1/)

## Wrap-up

Once Hall Sensors are measured and saved correctly, you can achieve stable sensored control at low speed. Always run `Apply` and `Write Motor Configuration` to ensure the settings are stored.