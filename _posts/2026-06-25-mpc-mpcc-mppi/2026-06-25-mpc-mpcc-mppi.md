---
title: "MPC · MPCC · MPPI: 예측 기반 제어 알고리즘 비교"
author: hangyo-cho
date: 2026-06-25 12:00:00 +0900
categories: [Software, control]
tags: [control, mpc, mpcc, mppi]
image:
  path: /assets/img/posts/mpc-mpcc-mppi/overview.png
lang: ko
lang_ref: mpc-mpcc-mppi
math: true
---

자율주행 레이싱의 Advanced Control에서 자주 등장하는 세 가지 예측 기반 제어 알고리즘 **MPC · MPCC · MPPI**를 비교합니다. 세 알고리즘 모두 **"미래 N스텝을 예측하면서 최적 제어 입력을 찾는다"**는 아이디어를 공유합니다. 차이는 *어떻게* 최적화하느냐, 그리고 *무엇을* 최적화하느냐에 있습니다.

![MPC · MPCC · MPPI 비교](/assets/img/posts/mpc-mpcc-mppi/overview.png)
*세 알고리즘의 핵심 아이디어 · 최적화 방식 · 장단점 · 활용 분야 비교*

## MPC (Model Predictive Control)

가장 기본 형태입니다. 매 제어 주기마다 다음을 반복합니다.

1. 현재 상태에서 미래 N스텝을 시뮬레이션
2. 비용 함수(cost function)를 최소화하는 제어 입력 시퀀스를 수리 최적화로 계산
3. 첫 번째 입력만 실제로 적용하고 나머지는 버림 (**Receding Horizon**)

매 타임스텝마다 다음 최적화 문제를 풉니다.

$$
\min_{u}\ \sum_{k=0}^{N-1} \left[ (x_k - x_{ref})^\top Q (x_k - x_{ref}) + u_k^\top R\, u_k \right]
$$

$$
\text{s.t.}\quad x_{k+1} = f(x_k, u_k), \qquad x \in \mathcal{X},\ u \in \mathcal{U}
$$

선형 시스템이면 **QP(Quadratic Programming)**, 비선형이면 **NLP**로 풀립니다.

## MPCC (Model Predictive Contouring Control)

MPC의 확장판으로, **경로 추종(path following)**에 특화된 형태입니다. 일반 MPC는 "특정 좌표에 도달하라"는 식의 레퍼런스를 추종하지만, MPCC는 경로 위의 진행도(progress parameter) $\theta$를 **제어 변수로 함께 최적화**합니다.

비용 함수가 세 항으로 분리됩니다.

- **Contouring error** $(e_c)$: 경로에서 얼마나 벗어났나 — 줄여야 함
- **Lag error** $(e_l)$: 경로 방향으로 얼마나 뒤처졌나 — 줄여야 함
- **Progress** $(\dot{\theta})$: 얼마나 빨리 전진하는가 — 키워야 함

$$
\min\ \sum_{k} \left[ q_c\, e_c^2 + q_l\, e_l^2 - q_v\, \dot{\theta} \right]
$$

덕분에 *"빠르게 가되, 경로에서 너무 벗어나지 마라"*를 동시에 최적화할 수 있습니다. 자율주행 레이싱에서 특히 많이 쓰입니다.

## MPPI (Model Predictive Path Integral)

방법론이 완전히 다릅니다. 수리 최적화 대신 **확률적 샘플링**을 사용합니다. 정보 이론 기반(Path Integral 제어 이론)으로, 핵심 아이디어는 다음과 같습니다.

1. 현재 제어 입력에 **가우시안 노이즈를 추가한 $K$개의 후보 궤적**을 병렬로 샘플링
2. 각 궤적의 비용을 계산
3. 비용이 낮은 궤적에 **높은 가중치**를 부여해 가중 평균으로 최적 제어를 계산

$$
u^* = \sum_{k} w(\tau_k)\,(u_{nom} + \epsilon_k), \qquad w(\tau_k) \propto \exp\!\left(-\frac{1}{\lambda} S(\tau_k)\right)
$$

여기서 $S(\tau_k)$는 궤적 $\tau_k$의 비용으로, 비용이 낮을수록 가중치가 커집니다. 미분 불가능한 비용 함수, 비볼록 환경, 극단적인 비선형성에도 잘 작동하며, GPU로 수천 개 샘플을 동시에 돌릴 수 있어 실시간성도 확보됩니다. 오프로드 자율주행(Georgia Tech 연구), 험지 주행 로봇 등에 쓰입니다.

## 어떤 걸 써야 할까?

| 상황 | 추천 |
|------|------|
| 제약 조건이 중요하고 선형/약비선형 시스템 | **MPC** |
| 고속 경로 추종, 레이싱 라인 최적화 | **MPCC** |
| 복잡한 환경, 비선형/비볼록, GPU 사용 가능 | **MPPI** |

> 세 알고리즘 모두 "예측 + 최적화"라는 뼈대는 같습니다. *무엇을 최적화 변수로 두는가*(MPCC의 progress), *어떻게 최적해를 찾는가*(MPPI의 샘플링)가 핵심 차이입니다.
{: .prompt-tip }

## 마무리

- **MPC**: 제약을 명시적으로 다루는 기본형. 선형이면 QP, 비선형이면 NLP.
- **MPCC**: progress를 제어 변수로 넣어 *추종 정확도와 속도를 동시에* 최적화. 레이싱에 적합.
- **MPPI**: 샘플링 기반이라 비미분·비볼록 비용에도 강하고 GPU 병렬화에 유리.

속도 프로파일 생성은 [Velocity Planner]({{ site.baseurl }}/posts/velocity-planner/) 글을 참고하세요.
