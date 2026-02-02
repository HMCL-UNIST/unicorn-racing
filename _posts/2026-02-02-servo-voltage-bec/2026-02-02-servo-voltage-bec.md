---
title: 서보 모터 입력 전압의 중요성과 BEC 활용 방법
author: yunho-lee
date: 2026-02-02 16:00:00 +0900
categories: [build, advanced]
tags: [bec, servo, vesc]
image:
  path: /assets/img/posts/servo-voltage-bec/b210-servo.png
lang: ko
lang_ref: servo-voltage-bec
---

서보 모터는 인가되는 전압에 따라 토크와 속도 출력이 달라집니다. VESC의 PPM 포트만으로 서보를 구동하면 최대 성능을 발휘하지 못할 수 있으며, BEC를 활용하여 적정 전압을 공급하는 것이 중요합니다.

![B210 서보 모터](/assets/img/posts/servo-voltage-bec/b210-servo.png)

## 서보 모터의 전압별 스펙

서보 모터들은 각각 작동하는 전압과 그에 따른 속도, 토크가 정해져 있습니다. 사용 중인 **[HIGHEST] B210 Brushless SERVO**를 예로 들어보면, 해당 서보 모터의 스펙은 다음과 같습니다.

![B210 스펙](/assets/img/posts/servo-voltage-bec/b210-spec.png)

인가되는 전원의 전압에 따라 토크 및 속도 출력이 다르며, 고전압을 인가해줄수록 더 좋은 성능을 보입니다.

Traxxas 차량에서 제공하는 서보 모터를 확인해봐도 Max Voltage와 그때의 토크 및 속도 출력이 명시되어 있습니다.

![Traxxas 서보 스펙](/assets/img/posts/servo-voltage-bec/traxxas-servo-spec.png)

**Specifications:**
- **Torque:** 125 oz-in
- **Speed:** 0.17 sec/60°
- **Max Voltage:** 6V (NiMh)

## VESC PPM 포트의 한계

회로를 구성할 때 VESC에서 나오는 PPM 포트에 서보의 GND, +, Signal 선을 모두 연결할 경우, 서보 모터의 최대 능력을 활용하지 못하게 됩니다.

![VESC PPM 포트](/assets/img/posts/servo-voltage-bec/vesc-ppm-port.png)

VESC의 PPM 포트에서 나오는 전력의 전압은 **5V**로, **[HIGHEST] B210 Brushless SERVO**의 최대 스펙인 **7.4V**를 충족하지 못합니다. 이 때문에 서보 모터의 회전 속도가 느리고, 힘이 부족한 현상이 발생합니다.

> 실제로 VESC의 PPM 포트에 서보를 연결한 경우와 BEC를 통해 7.4V를 인가한 경우를 비교하면, 차량 퍼포먼스에서 체감할 수 있을 정도의 차이가 발생합니다.
{: .prompt-info }

## BEC를 통한 해결

BEC(Battery Eliminator Circuit)를 사용하여 서보 모터에 적정 전압(예: 7.4V)을 직접 공급하면, 서보의 최대 토크와 속도를 활용할 수 있습니다. 이때 VESC의 PPM 포트에서는 Signal 선만 연결하고, 전원은 BEC에서 별도로 공급하는 방식으로 구성합니다.

> 서보의 토크를 강하게 하는 것이 무조건 좋은 것은 아닙니다. 미끄러운 바닥에서 강한 토크로 불규칙적인 제어가 들어가면 오히려 주행 안정성이 떨어지고 차량이 스핀할 수 있습니다.
{: .prompt-warning }

## 마무리

이 글에서는 서보 모터에 적정 전압을 인가하는 것의 중요성과 BEC 활용 방법을 소개했습니다. VESC의 PPM 포트(5V)만으로는 고성능 서보의 최대 스펙을 충족할 수 없으므로, BEC를 통해 서보 스펙에 맞는 전압을 공급하는 것이 퍼포먼스 향상에 효과적입니다. 다만 주행 환경에 따라 과도한 토크가 오히려 안정성을 해칠 수 있으므로, 상황에 맞게 조절하시기 바랍니다.
