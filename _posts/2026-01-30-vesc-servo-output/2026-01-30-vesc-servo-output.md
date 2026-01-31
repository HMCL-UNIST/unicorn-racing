---
title: VESC에서 Servo 출력이 안 나오는 경우
author: hyeongjoon-yang
date: 2026-01-30 14:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, servo, motor-control, manual]
lang: ko
lang_ref: vesc-servo-output
---

VESC에 서보 모터를 연결했는데 출력이 나오지 않는다면, VESC Tool에서 Servo Output이 비활성화되어 있을 가능성이 높다.

---

## Servo Output 활성화

**App Settings - General - General Tab**에서 `Enable Servo Output` 옵션을 활성화해야 한다.

![Servo Enable](/assets/img/posts/vesc-servo-output/servo-enable.png)

이 옵션이 꺼져 있으면 VESC의 서보 핀에서 PWM 신호가 출력되지 않는다.

---

## Servo 동작 확인

설정을 활성화한 후, **App Settings - General - Controls Tab**에서 서보가 정상적으로 동작하는지 테스트할 수 있다.

![Servo Controls](/assets/img/posts/vesc-servo-output/servo-controls.png)

슬라이더를 움직여 서보가 반응하면 정상적으로 설정이 완료된 것이다.

> 설정 변경 후 반드시 우측 메뉴바의 **Write App Configuration**을 눌러 저장해야 한다.
{: .prompt-warning }
