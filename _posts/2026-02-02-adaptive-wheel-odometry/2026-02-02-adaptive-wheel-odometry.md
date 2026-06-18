---
title: Adaptive Wheel Odometry로 휠 슬립 보정하기
author: hangyo-cho
date: 2026-02-02 11:00:00 +0900
categories: [Software, state estimation]
tags: [cartographer, lidar, odometry]
image:
  path: /assets/img/posts/adaptive-wheel-odometry/adaptive-odometry-diagram.png
lang: ko
lang_ref: adaptive-wheel-odometry
math: true

---

## 설계 목표

차량의 실제 속도($v_{car}$)와 휠 오도메트리의 속도($v_{wheel}$)를 최대한 비슷하게 만드는 것을 목표로 했습니다. 이를 위해 $ERPM\ gain$ 값을 고정된 상수($constant$)가 아닌, 주행 상황에 따라 동적으로 변하도록 설계했습니다.

---

## 사전 지식 및 설계 근거 (Prior Knowledge)

본 모델은 다음과 같은 네 가지 핵심적인 사전 지식과 가설을 토대로 설계되었습니다.

1. **가속 구간**: 실제 속도보다 휠 오도메트리의 예측 값이 더 크게 나타납니다.
2. **제동(브레이크) 구간**: 실제 속도보다 휠 오도메트리의 예측 값이 더 작게 나타납니다.
3. **가속도 비례성**: 미끄러지는 정도는 차량 헤딩 방향 가속도($a_x$)에 비례한다고 가정합니다.
4. **정속 주행 슬립**: 가속이 없는 정속 주행(Constant velocity) 상태에서도 일정량의 슬립이 발생한다는 점을 고려합니다.

---

## 관계식 (Equation)

상기 기술한 사전 지식을 바탕으로 다음과 같은 동적 관계식을 도출했습니다.

$$
\text{Adaptive ERPM gain} = (\text{Theoretical ERPM gain}) + \sigma \cdot a_x + \delta
$$

---

## 파라미터 구성

- **$\sigma$ (Slip rate) 및 $\delta$ (Offset)**: 미끄러운 정도를 직접 측정하는 것이 아니라, 대회장의 노면 상황 및 Localization의 품질에 따라 유연하게 대응할 수 있도록 별도의 튜닝 파라미터로 설정했습니다.

> 노면 상태에 따라 $\sigma$와 $\delta$ 값을 조정하면 다양한 환경에서 안정적인 오도메트리를 얻을 수 있습니다.
{: .prompt-tip }

---

## 주요 소스 코드 분석

아래 코드는 IMU로부터 들어온 **가속도 데이터를 Low-pass filter로 필터링**하고, 필터링된 가속도 값을 이용하여 **Adaptive ERPM gain을 계산**하는 역할을 합니다.

```cpp
// adaptive_vesc_to_odom.cpp
// 114~116

// Low-pass filter를 이용하여 가속도 데이터 필터링
filtered_linear_accel_x = l_filter_alpha_ * linear_accel_x + (1-l_filter_alpha_)*filtered_linear_accel_x;

// Adaptive ERPM gain 계산: (Theoretical gain + offset) + σ * a_x
double filtered_speed_to_erpm_gain_ = (speed_to_erpm_gain_ + eprm_offset_) + accel_gain_ * filtered_linear_accel_x;
```

아래 코드는 위에서 계산된 **Adaptive ERPM gain을 이용하여 현재 속도를 계산**하는 역할을 합니다.

```cpp
// adaptive_vesc_to_odom.cpp
// 121~126

// Adaptive gain을 적용하여 현재 속도 계산
double current_speed = (-state->state.speed + speed_to_erpm_offset_) / filtered_speed_to_erpm_gain_;

// 노이즈 제거를 위한 데드존 적용
if (std::fabs(current_speed) < 0.05)
{
  current_speed = 0.0;
}
```

---

## 결과

이와 같은 동적 Gain 모델을 적용하여 파라미터를 최적화한 결과, 실제 속도와 오도메트리 사이의 오차를 효과적으로 줄일 수 있었습니다.

---

## 마무리

Adaptive Wheel Odometry는 가속/감속 시 발생하는 휠 슬립을 IMU 가속도 데이터를 활용하여 실시간으로 보정하는 기법입니다.

주요 포인트를 요약하면:
- **동적 ERPM gain**: 고정된 상수 대신 가속도에 따라 동적으로 변하는 gain을 사용합니다
- **Low-pass filter**: IMU 가속도 데이터의 노이즈를 제거하여 안정적인 보정값을 얻습니다
- **튜닝 파라미터**: $\sigma$(slip rate)와 $\delta$(offset)를 노면 상황에 맞게 조정합니다

이 기법은 특히 저마찰 노면이나 고속 주행 시 Localization 성능을 향상시키는 데 효과적입니다. Cartographer와 함께 사용하면 더욱 정확한 위치 추정이 가능합니다.
