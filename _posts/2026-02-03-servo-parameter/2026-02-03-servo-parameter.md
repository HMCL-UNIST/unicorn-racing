---
title: VESC Servo Parameter 찾는 방법
author: hyeongjoon-yang
date: 2026-02-03 21:00:00 +0900
categories: [build, beginner]
tags: [gain, servo, vesc]
image:
  path: /assets/img/posts/servo-parameter/servo-output.png
lang: ko
lang_ref: servo-parameter
math: true
---

자율 주행에서 정확한 조향 제어는 경로 추종 성능에 직접적인 영향을 미칩니다. 조향 명령과 실제 바퀴 각도 사이의 변환이 정확하지 않으면, 차량은 의도한 경로를 따라가지 못하고 경로 이탈이나 사고로 이어질 수 있습니다. 본 포스트에서는 Servo Parameter의 개념과 특성, 그리고 실험을 통한 캘리브레이션 방법을 정리합니다.

## Servo Parameter란?

VESC ROS 패키지에서 조향 명령은 라디안 단위의 조향각으로 입력되며, 이를 서보가 이해하는 0에서 1 사이의 값으로 변환하여 전달합니다. 이 변환 관계는 다음과 같이 gain과 offset으로 나타낼 수 있습니다.

```
servo_value = steering_angle_to_servo_gain × steering_angle + steering_angle_to_servo_offset
```

- **steering_angle**: 사용자가 입력하는 조향각 (라디안)
- **servo_value**: 서보에 전달되는 명령 (0 ~ 1)
- **steering_angle_to_servo_gain**: 조향각을 서보 값으로 변환하는 비례상수
- **steering_angle_to_servo_offset**: 직진 상태(조향각 0)에서의 서보 값

## Servo Parameter의 이론적 측정

ERPM gain의 경우, 기어비, 극 쌍수, 바퀴 반지름 등의 하드웨어 스펙이 선형적으로 곱해지기 때문에 수학적으로 깔끔하게 계산할 수 있습니다.

반면, Servo Parameter는 이론적으로 측정하기 어렵습니다. 그 이유를 이해하기 위해서는 RC카의 조향 시스템 구조를 알아야 합니다.

### Ackermann Steering Geometry란?

차량이 회전할 때, 앞바퀴 두 개는 회전 중심으로부터 서로 다른 거리에 위치합니다. 내측 바퀴는 회전 중심에 가깝고, 외측 바퀴는 멀습니다.

바퀴는 축에 수직인 방향으로만 순수하게 굴러갈 수 있습니다. 만약 두 앞바퀴가 같은 조향각으로 꺾이면, 두 바퀴 축의 연장선이 서로 평행해지고, 각 바퀴의 회전 반경이 달라지며 옆으로 끌려가는 슬립이 발생합니다.

이를 방지하기 위해, 두 바퀴 축의 연장선이 동일한 회전 중심에서 만나도록 내측 바퀴는 더 크게, 외측 바퀴는 더 작게 꺾어야 합니다. 이러한 기하학적 조건을 **Ackermann Steering Geometry**라고 합니다.

![Ackermann Steering Geometry](/assets/img/posts/servo-parameter/ackermann-geometry.png)
_Ackermann Steering Geometry_

### Bellcrank 시스템의 비선형성

RC카에서는 bellcrank 시스템과 타이로드, 너클 암 등의 링키지를 통해 Ackermann Steering Geometry를 근사적으로 구현합니다. 이 복잡한 기구학적 구조로 인해, 서보 각도와 실제 바퀴 조향각 사이의 관계는 **비선형**입니다.

| ![Traxxas Bellcrank](/assets/img/posts/servo-parameter/traxxas-bellcrank.png) | ![Traxxas Ackermann](/assets/img/posts/servo-parameter/traxxas-ackermann.png) |
|:---:|:---:|
| Traxxas Fiesta의 조향 시스템 (Bellcrank) | Traxxas Fiesta의 Ackermann Steering Geometry |

즉, 우리가 설정하는 `steering_angle_to_servo_gain`은 사실 선형 근사이며, 중앙(직진) 부근에서는 잘 맞지만 최대 조향각 부근에서는 오차가 발생할 수 있습니다. 따라서 Servo Parameter는 이론적 계산보다 실험을 통해 자주 사용하는 범위에 맞게 캘리브레이션하는 것이 일반적입니다.

## Servo Parameter의 특성

### 하드웨어에 따른 서보 범위

서보는 0에서 1 사이의 명령을 받지만, 하드웨어 사양에 따라 조향 명령(라디안)만으로 이 범위를 전부 사용할 수도 있고 일부만 사용할 수도 있습니다.

### 비선형성과 캘리브레이션 범위

벨크랭크 링키지 구조로 인해 서보 값과 실제 바퀴 조향각 사이의 관계는 비선형성을 띱니다. 따라서 모든 조향각에서 요구되는 회전반경에 정확하게 매핑되지 않습니다. 이러한 이유로, 자주 사용하는 조향각 범위 내에서 servo gain 매핑을 하는 것을 추천합니다.

예를 들어, F1tenth 주행에서 ±0.25 라디안(약 ±14도) 범위 내에서 대부분의 조향이 이루어진다면, 해당 범위에서 정확도를 맞추는 것이 효과적입니다. 극단적인 조향각은 저속 긴급 상황에서나 사용되므로, 약간의 오차는 감수할 수 있습니다.

### 서보 혼 초기 위치의 중요성

servo gain과 offset이 적용된 상태에서 하드웨어의 한계까지 조향 명령을 주었을 때, 좌측이나 우측 한 방향으로만 제약되지 않도록 주의해야 합니다. 즉, 최대 조향 명령을 주어도 서보 명령은 항상 0에서 1 사이에 존재해야 합니다.

이를 위해 서보 혼 초기 위치를 가동범위 중앙에 잘 위치시키는 것이 중요합니다. 서보 혼이 잘 장착된 경우, offset은 0.5에 근접하게 측정됩니다.

## 실험으로 Servo Parameter 찾기

### Offset 찾기 (직진 맞추기)

offset은 조향각 0일 때의 서보 값입니다. 바퀴가 정확히 직진 방향을 가리킬 때의 서보 값을 찾으면 됩니다.

### 측정 순서

1. 타이어의 마찰이나 바닥 결에 대한 영향을 최소화하기 위해, 측정 전 조이스틱을 이용해 좌우로 조향 명령을 주어 서보모터가 중앙에 잘 위치하도록 합니다.
2. 타이어가 미끄러지지 않도록 서서히 출발하여 직진 주행합니다.
3. 차량이 진행하는 방향을 관찰하여, 좌우로 치우치지 않고 직진하는지 확인합니다.
4. 직진하지 않는다면 offset 값을 조금씩 조정하며 반복합니다.
5. 차량이 정확히 직진할 때의 값을 `steering_angle_to_servo_offset`으로 설정합니다.

> 서보 혼이 잘 장착되어 있다면 offset은 0.5 근처가 됩니다. 만약 0.5에서 크게 벗어난다면, 서보 혼을 분리 후 재장착하여 중앙에 맞추는 것을 권장합니다.
{: .prompt-tip }

### Gain 찾기

gain은 조향각 변화에 따른 서보 값 변화의 비율입니다. rviz에서 누적된 odometry를 통해 회전반경을 측정하고, Ackermann 공식을 이용하여 gain을 튜닝합니다.

### Ackermann 회전반경 공식

Ackermann steering geometry에서 조향각과 회전반경의 관계는 다음과 같습니다. wheelbase는 앞 차축과 뒷 차축 사이의 거리로, 자를 통해 직접 측정하거나, 제조사에 적혀있는 정보를 참고하면 됩니다.

$$
\text{turning_radius} = \frac{\text{wheelbase}}{\tan(\text{steering_angle})}
$$

명령한 조향각으로 예상 회전반경을 계산하고, 실제 측정된 회전반경과 비교하여 gain을 조정합니다.

![Rviz 회전 반경 측정](/assets/img/posts/servo-parameter/rviz-turning-radius.png)
_Rviz를 통해 회전 반경을 측정하는 모습_

### 측정 순서

1. rviz에서 odometry를 시각화할 수 있는 상태에서 시작합니다.
2. 일정한 조향각 명령(예: 0.2 rad)을 준 채로 slip 없이 저속으로 원을 그리며 주행합니다.
3. rviz에서 누적된 odometry 궤적이 원을 그리면, Measure 기능을 활용하여 원의 지름을 측정하고 회전반경(R)을 구합니다.
4. 명령한 조향각으로 계산한 예상 회전반경과 실제 회전반경을 비교하여 gain을 조정합니다.

### 계산 예시 (Traxxas Fiesta 기준)

| 항목 | 값 |
|------|-----|
| 휠베이스 | 0.33m |
| 명령한 조향각 | 0.2 rad |
| 예상 회전반경 | 0.33 / tan(0.2) ≈ 1.62m |
| 실제 측정된 회전반경 | 1.8m |

이 경우, 예상(1.62m)보다 실제(1.8m)가 크므로 실제 조향각이 명령보다 작다는 의미입니다. 따라서 gain의 절댓값을 늘려야 합니다.

### 보정 방법

| 상황 | 조치 |
|------|------|
| 실제 회전반경 > 예상 회전반경 | gain의 절댓값을 늘린다 |
| 실제 회전반경 < 예상 회전반경 | gain의 절댓값을 줄인다 |

### 주의사항

- 자주 사용하는 조향각 범위(예: ±0.25 rad) 내에서 여러 지점을 테스트하여 전반적으로 잘 맞는 gain을 찾습니다.
- 측정 시 slip이 발생하지 않도록 충분히 저속으로 주행해야 정확한 회전반경을 얻을 수 있습니다.

## 마무리

Servo Parameter는 실험을 통해 측정해야 하지만, 하드웨어가 변경되지 않는 한 값이 변하지 않기 때문에 한 번만 정확하게 측정하면 됩니다. 시간을 들여 정밀하게 캘리브레이션하는 것을 권장합니다. 이 파라미터는 사용자가 의도한 조향각이 차량에 정확히 전달되도록 매핑하는 역할을 하므로, 캘리브레이션 이후 임의로 조작하지 않도록 주의해야 합니다.
