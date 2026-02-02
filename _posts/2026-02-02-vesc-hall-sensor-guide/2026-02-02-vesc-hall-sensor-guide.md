---
title: "VESC Hall Sensor 사용법"
author: jeongsang-ryu
date: 2026-02-02 21:40:14 +0900
categories: [build, advanced]
tags: [hall sensor, motor, vesc]
image:
  path: /assets/img/posts/vesc-hall-sensor-guide/overview.png
lang: ko
lang_ref: vesc-hall-sensor-guide
---

VESC에는 Hall Sensor를 활용해 모터를 정밀 제어하는 기능이 있습니다.

## 참고 영상

{% include embed/youtube.html id='RfV7ZwkSLok' %}

## Hall Sensor 측정 방법

SENSE 포트(사진 상단의 6개 선이 연결된 포트)에 모터의 Hall Sensor 선을 연결한 뒤, VESC의 **Motor Settings → FOC → Hall Sensors** 탭에서 하단의 재생 버튼을 눌러 측정합니다.

![SENSE 포트 위치](/assets/img/posts/vesc-hall-sensor-guide/sense-port.png)

측정 중 바퀴가 미세하게 앞뒤로 움직입니다. 측정이 끝나면 **Apply**로 센서 값을 저장하고, 우측 상단의 **Write Motor Configuration**으로 설정을 저장합니다.

![Hall Sensor 측정 화면](/assets/img/posts/vesc-hall-sensor-guide/hall-measure.png)

측정 이후 FOC를 수행하면 Hall Sensor 기반 FOC 제어가 가능합니다.

## 주의사항

모든 sensored 모터가 VESC에서 Hall Sensor 모드로 동작하는 것은 아닙니다. 모터 제조사 자체 ESC에 맞춰 설계된 **내장 고정밀 인코더** 모터는 VESC에서 sensored 제어가 불가능할 수 있습니다.

- Hall Sensor 사용 가능 예: [EZRUN 3665SD 2400kv G3](https://www.falconshop.co.kr/shop/goods/goods_view.php?goodsno=100073977)
- 사용 불가 가능성 예: [AXE550 R2 3300kv](https://m.toprc.co.kr/product/30401256-xerun-axe550-r2-3300kv-%EB%AA%A8%ED%84%B0/21488/display/1/)

## 마무리

Hall Sensor를 올바르게 측정하고 저장하면 저속에서도 안정적인 sensored 제어가 가능합니다. 측정 후에는 반드시 `Apply`와 `Write Motor Configuration`을 실행해 설정이 저장되었는지 확인하시기 바랍니다.