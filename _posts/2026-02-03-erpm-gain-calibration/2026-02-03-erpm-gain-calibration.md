---
title: "ERPM 게인 계산 및 캘리브레이션 가이드"
author: hyeongjoon-yang
date: 2026-02-03 01:12:52 +0900
categories: [build, beginner]
tags: [erpm, motor, odometry, vesc, wheel]
image:
  path: /assets/img/posts/erpm-gain-calibration/overview.png
lang: ko
lang_ref: erpm-gain-calibration
math: true
---

모터를 Throttle 제어가 아닌 속도를 활용해 제어할 때, 사용자의 명령을 하드웨어 조합에 맞게 적절히 변환하는 비례 상수를 찾는 것은 매우 중요합니다. 해당 상수는 자율 주행에서 위치 추정 오차 누적의 원인이 되며, 잘못된 제어로 사고를 유발할 수 있습니다. 이 글에서는 ERPM 게인의 개념과 이론적 계산 방법, 그리고 실험을 통한 캘리브레이션 방법을 정리했습니다.

## ERPM이란?

VESC는 사용자의 속도 명령(m/s)을 모터가 이해하는 **ERPM(Electrical RPM)**으로 변환해 모터에 전달합니다. ERPM은 모터의 실제 RPM에 **극 쌍수(pole pairs)**를 곱한 값입니다.

$$
ERPM = RPM \cdot \text{pole_pairs}
$$

속도와 ERPM의 관계는 다음과 같이 비례상수(gain과 offset)로 나타낼 수 있습니다.

$$
ERPM = speed \cdot \text{speed_to_erpm_gain} + \text{speed_to_erpm_offset}
$$

실제 VESC ROS 패키지에서도 위 관계식을 통해 사용자가 입력한 속도 명령을 ERPM으로 변환해 모터에 전달합니다.

## ERPM 게인에 영향을 주는 요인

ERPM 게인은 하드웨어 조건에 따라 결정됩니다. 주요 요인은 다음과 같습니다.

- **전기 모터의 극 쌍수(Pole Pairs)**: ERPM은 실제 RPM에 극 쌍수를 곱한 값입니다. 예를 들어 Traxxas Velineon 3500 모터는 4극 모터이므로 극 쌍수는 2입니다.
- **기어비(Gear Ratio)**: 피니언-스퍼 기어비, 디퍼런셜-샤프트 기어비 등 맞물리는 기어의 최종 회전 비율입니다. 예를 들어 Traxxas Fiesta 기본 세팅은 12:83, 13:37입니다.
- **바퀴 반지름**: 직접 측정하거나 제조사 스펙을 확인하는 것을 권장합니다. Traxxas Fiesta 기본 타이어는 지름 약 10cm로 반지름 0.05m입니다.

## 이론적 ERPM 게인 찾기

Traxxas Fiesta 차량에 Velineon 모터 조합으로 이론적 ERPM 게인을 계산해 보겠습니다.

### 하드웨어 스펙

| 항목 | 값 |
| --- | --- |
| 모터 | Traxxas Velineon 3500 (4극) |
| 극 쌍수 (pole_pairs) | 2 |
| 피니언-스퍼 기어비 | 12 : 83 |
| 디퍼런셜-샤프트 기어비 | 13 : 37 |
| 바퀴 지름 | 10cm |
| 바퀴 반지름 (wheel_radius) | 0.05m |

### 기어비 계산

최종 기어비는 피니언-스퍼 기어비와 디퍼런셜-샤프트 기어비를 곱해 구합니다.

$$
\text{gear_ratio} = \frac{83}{12} \times \frac{37}{13} \approx 19.69
$$

### ERPM 게인 계산

$$
\text{speed_to_erpm_gain} = \frac{\text{pole_pairs} \cdot \text{gear_ratio}}{2\pi \cdot \text{wheel_radius}}
$$

위 값을 대입하면 Traxxas Fiesta + Velineon 조합의 이론적 speed_to_erpm_gain 값은 **약 7520**입니다. `vesc.yaml`에 기록된 speed_to_erpm_gain 값을 변경해 사용하면 됩니다.

## 간접적으로 ERPM 게인 유추하기

정확한 하드웨어 스펙을 알 수 없거나 이론 계산이 어려운 경우, 실험을 통해 ERPM 게인을 유추할 수 있습니다.

### 방법 1: 초고속 카메라 활용 (추천)

가장 직관적이고 정확한 방법입니다.

**준비물**
- 초고속 카메라(스마트폰 슬로모션 기능도 가능)
- 바퀴에 부착할 마커(테이프 등)

![테이프가 부착된 타이어](/assets/img/posts/erpm-gain-calibration/tire-marker.png)

**측정 순서**
1. 바퀴에 회전수 측정용 표시를 합니다.
2. 일정한 속도 명령을 줍니다. (PID 튜닝이 되어 있어야 일정한 속도 유지가 가능합니다.)
3. 초고속 카메라로 바퀴가 한 바퀴 도는 시간을 측정합니다.
4. 측정된 시간과 바퀴 둘레로 실제 속도를 계산합니다.

**보정 방법**
- 명령한 속도보다 실제 속도가 빠르면 gain 값을 높입니다.
- 느리면 gain 값을 낮춥니다.

### 방법 2: Odometry 활용 (노이즈 가능, 비추천)

ROS 토픽으로 캘리브레이션하는 방법입니다.

**준비물**
- 줄자 또는 측정 도구
- 출발선 마킹용 테이프
- Servo Offset Tuning이 완료된 차량

**측정 순서**
1. 차량 출발 지점을 마킹합니다.
2. `/vesc/odom` 토픽의 position 값을 0으로 초기화하거나 기록합니다.
3. 일정 거리(예: 5m)를 저속으로 직진 주행합니다.
4. 실제 이동 거리와 `/vesc/odom` 토픽 상의 이동 거리를 비교합니다.

**보정 공식**
$$
\text{new\_gain} = \text{old\_gain} \times \frac{\text{actual\_distance}}{\text{odom\_distance}}
$$

예를 들어 기존 gain이 7520이고, odom이 5.5m를 표시했는데 실제로는 5m를 이동했다면 다음과 같이 보정합니다.

$$
\text{new\_gain} = 7520 \times \frac{5.0}{5.5} \approx 6840
$$

이 과정을 odom 거리와 실제 거리가 일치할 때까지 반복합니다.

## 마무리

ERPM 게인 캘리브레이션은 자율 주행 차량의 정밀한 속도 제어와 위치 추정의 기반이 되는 중요한 과정입니다. 캘리브레이션이 정확하지 않으면 Odometry 오차가 누적되어 경로 이탈이나 사고로 이어질 수 있으므로, 시간을 들여 정확하게 측정하기를 권장합니다.
