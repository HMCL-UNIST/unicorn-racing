---
title: VESC에서 Hall Sensor를 이용한 Sensored FOC 설정 방법
author: hyeongjoon-yang
date: 2026-01-30 10:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, hall-sensor, motor-control, manual]
lang: ko
lang_ref: vesc-hall-sensor
---

Sensorless FOC는 저속에서 로터 위치 추정이 불안정한 단점이 있다. Hall Sensor를 지원하는 모터라면 **Sensored FOC**로 전환하여 저속 구간에서도 안정적인 제어가 가능하다.

> 모든 sensored motor가 VESC의 Hall Sensor 모드를 지원하는 것은 아니다. 아래 [호환성 참고](#모터-호환성) 참조.
{: .prompt-warning }

---

## 1. 하드웨어 연결

VESC 보드 상단의 **SENSE 포트**(6핀)에 모터의 Hall Sensor 선을 연결한다.

![VESC SENSE 포트](/assets/img/posts/vesc-hall-sensor/sense-port.png){: w="240" }

---

## 2. Hall Sensor 측정

**Motor Settings - FOC - Hall Sensors** 탭에서 하단의 **재생 버튼**을 눌러 Hall Sensor를 측정한다.

![Hall Sensor Tab](/assets/img/posts/vesc-hall-sensor/hall-sensor-tab.png)

측정 과정에서 바퀴가 미세하게 앞뒤로 움직이며, 완료 후:

1. **Apply**를 눌러 센서값 적용
2. 우측 상단의 **Write Motor Configuration**을 눌러 설정 저장

이후 **[FOC 세팅]({{ site.baseurl }}/posts/vesc-foc-tab/)**에서 Sensor Mode를 **Hall Sensors**로 선택하면, Hall Sensor 기반 FOC 제어가 가능하다.

---

## 모터 호환성

| 모터 | Hall Sensor | VESC 호환 |
|------|-------------|-----------|
| [EZRUN 3665SD 2400kv G3](https://www.falconshop.co.kr/shop/goods/goods_view.php?goodsno=100073977) | Hall Sensor 탑재 | **가능** |
| [AXE550 R2 3300kv](https://m.toprc.co.kr/product/30401256-xerun-axe550-r2-3300kv-%EB%AA%A8%ED%84%B0/21488/display/1/) | 자체 자기 인코더 | **불가** |

모터 제조사가 자체 ESC 전용으로 설계한 인코더를 탑재한 모터는 VESC의 Hall Sensor 모드가 동작하지 않는다. 구매 전 반드시 **Hall Sensor 방식인지** 확인이 필요하다.
