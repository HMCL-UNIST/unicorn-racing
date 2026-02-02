---
title: "Adaptive Wheel Odometry: 동적 ERPM Gain 모델"
author: hangyo-cho
date: 2026-02-02 20:57:54 +0900
categories: [racing stack]
tags: [racing-stack, odometry, wheel-odometry, localization, erpm]
image:
  path: /assets/img/posts/adaptive-wheel-odometry/overview.png
math: true
lang: ko
lang_ref: adaptive-wheel-odometry
---

![Adaptive wheel odometry overview](/assets/img/posts/adaptive-wheel-odometry/overview.png)

## 설계 목표

차량의 실제 속도($v_{car}$)와 휠 오도메트리 속도($v_{wheel}$)를 최대한 유사하게 만드는 것이 목표입니다. 이를 위해 ERPM gain을 고정 상수가 아니라 **주행 상황에 따라 동적으로 변하는 값**으로 설계했습니다.

---

## 사전 지식 및 설계 근거

모델은 다음 가정과 관측에 기반합니다.

1. **가속 구간**에서는 휠 오도메트리 추정 속도가 실제 속도보다 크게 나타납니다.
2. **제동 구간**에서는 휠 오도메트리 추정 속도가 실제 속도보다 작게 나타납니다.
3. **가속도 비례성**: 미끄러짐 정도는 차량 진행 방향 가속도($a_x$)에 비례한다고 가정합니다.
4. **정속 주행 슬립**: 가속이 없는 정속 주행에서도 일정 수준의 슬립이 존재합니다.

---

## 관계식 (Equation)

위 사전 지식을 바탕으로 다음과 같은 동적 관계식을 사용합니다.

$$
\text{Adaptive ERPM gain} = (\text{Theoretical ERPM gain}) + \sigma \cdot a_x + \delta
$$

### 파라미터 구성

- **$\sigma$ (Slip rate)**, **$\delta$ (Offset)**: 실제 슬립을 직접 측정하기 어려운 환경을 고려해, 노면 상태 및 Localization 품질에 유연하게 대응할 수 있는 튜닝 파라미터로 설정합니다.

---

## 결과

동적 Gain 모델을 적용해 파라미터를 최적화한 결과, 실제 속도와 오도메트리 사이의 오차를 효과적으로 줄일 수 있었습니다.

## 마무리

Adaptive ERPM gain 모델은 가속·제동·정속 주행에서 발생하는 슬립을 반영해 휠 오도메트리의 정확도를 높입니다. 노면 조건과 Localization 품질에 따라 $\sigma$와 $\delta$를 조정하면, 실제 속도 추정 성능을 안정적으로 개선할 수 있습니다.
