---
title: "Joint Optimization: 경로와 속도를 동시에 푸는 Min-Time Racing Line"
author: inyoung-choi
date: 2026-06-26 16:00:00 +0900
categories: [Software, planning]
tags: [raceline, optimization, nlp, ipopt, min-time]
lang: ko
lang_ref: joint-optimization-racing-line
math: true
---

3D planner(실제 사용)는 **경로(raceline)와 속도를 동시에** 최적화해 랩타임을 최소화(min-time)하는 global racing line을 생성합니다. 코드: [`gen_global_racing_line.py`](https://github.com/Brojoon-10/ICRA2026_HJ/blob/main/planner/3d_gb_optimizer/global_line/global_racing_line/gen_global_racing_line.py)

## 비용 함수 (min-time & curvature)

$$
J = \int \left[ w_T \cdot \frac{1}{\dot{s}} + w_{jx}\, j_{x,t}^2 + w_{jy}\, j_{y,t}^2 + w_{d\Omega_z}\, d\Omega_z^2 \right] ds
$$

| 항 | 식 | 역할 |
|---|---|---|
| Time | $w_T \cdot (1/\dot{s})$ | 랩타임 |
| Jerk | $w_{jx}\, j_{x,t}^2 + w_{jy}\, j_{y,t}^2$ | 가속도 변화율 (부드러움) |
| Curvature | $w_{d\Omega_z}\, d\Omega_z^2$ | 궤적의 곡률 |

## GGV와 곡률

$$
\frac{V^2}{R} \le a_{y,max} \;\Rightarrow\; V \le \sqrt{a_{y,max} \cdot R}
$$

동일한 $a_{y,max}$에서 속도 $V$를 높이는 방법은 **곡률 반경 $R$을 키우는 것**입니다. 따라서 $R$이 커지면 raceline이 바깥쪽으로 확장됩니다.

## Case 1 — Min Laptime ($w_{d\Omega_z} = 0$)

- cost gradient가 $V$가 커지는 방향으로 작용
- 코너에서 속도를 높이기 위해 곡률 반경이 커짐
- NLP가 트랙 경계 가까이까지 활용해 raceline 생성
- 결과적으로 **late apex 라인** 형성 → 코너 속도보다 코너 진입/탈출 속도를 중시(for min-time), 라인이 안쪽 벽에 가깝게 생성됨
  - 진입: outside
  - Apex: 코너 후반의 inside
  - 출구: outside (출구에서 $R$을 크게 확보 → 출구 가속 극대화)

**장점**

| 항목 | 내용 |
|---|---|
| 랩타임 | 이론적 최단 (모델 가정 내 물리적 하한) |
| 벤치마크 | 차량/트랙의 한계 성능 측정 가능 |
| R 활용 | 트랙 폭을 R 확보 도구로 풀활용 → 코너 V 극대화 |
| 출구 가속 | Late apex로 출구 R 큼 → 다음 직선 평균 V↑ |

**단점**

| 항목 | 내용 |
|---|---|
| ax/ay 거침 | 마찰원 경계에 빠듯하게 active → bang-bang에 가까운 프로파일 |
| 실차 추종성 | 컨트롤러 cross-track error 큼, 액추에이터 부담 |
| 슬립 위험 | 마찰 한계 풀활용 → 외란 시 마진 없음 |
| 수치적 안정성 | 다수 제약 동시 active → KKT dual ambiguity, IPOPT 진동 |
| 모델 의존성 | Point-mass 가정에 강하게 의존 → 실차 갭 큼 |
| 재현성 | 노면/타이어 상태 변화에 민감 |

## Case 2 — Laptime + Curvature Trade-off

NLP가 time과 curvature의 gradient를 **동시에** 고려합니다.

| 항 | 그래디언트가 끌어당기는 방향 |
|---|---|
| Time | 라인을 늘리는 방향 (late apex) |
| Curvature | 라인을 평평하게 하는 방향 ($d\chi$가 $-\Omega_z$를 추적) |

결과적으로 **geometric apex 라인**이 형성됩니다 (진입/출구 R이 대칭, 기하학적으로 가장 큰 단일 반경을 가지는 raceline).

**장점**

| 항목 | 내용 |
|---|---|
| 부드러운 프로파일 | ax/ay 변화 완만, jerk 항과 시너지 |
| 실차 추종성 | 컨트롤러 추종 오차 ↓, 안정적 주행 |
| 마진 확보 | 마찰원 경계에서 떨어져 외란 흡수 가능 |
| NLP 수렴 안정 | Curvature 항이 자연 정규화 → IPOPT 빠르고 안정 |
| 튜닝 자유도 | $w_{d\Omega_z}$ 하나로 안정성 ↔ 속도 스칼라 조절 |
| 재현성 | 노면 변동에 덜 민감 |

**단점**

| 항목 | 내용 |
|---|---|
| 랩타임 손해 | 보통 약 1% 내외 증가 ($w_{d\Omega_z}$ 크기에 따라) |
| R 활용 제한 | 트랙 폭 풀활용 못함 → 코너 V 잠재 손실 |
| 출구 가속 약화 | Geometric apex로 출구 R이 Case 1보다 작음 |
| 튜닝 필요 | $w_{d\Omega_z}$ 값을 트랙/차량마다 찾아야 함 |
| 너무 크면 손실 | $\ge 10^0$ → 곡률 항 dominate, 랩타임 명확히 손해 |

## 최적화 방법

### 1. Nonlinear Programming (NLP)

비선형 비용 함수와 비선형 제약을 가진 최적화로, 트랙 한 바퀴 동안의 비용 $J$를 최소화하는 궤적을 계산합니다.

```text
min J(비용함수)
subject to  ẋ = f(x, u, s)           (3D 점질량)
            GGV 마찰원 부등식          (타이어 한계)
            n ∈ [n_lb(s), n_ub(s)]   (트랙 경계)
            V ≥ V_min                (속도 하한)
            X_0 = X_N                (closed loop)
```

### 2. Direct Multiple Shooting 이산화

연속 시간/공간 최적제어를 NLP로 변환합니다.

- 트랙을 호장 $s$로 균등 분할: `step_size_opt = 0.2 m`
- 각 grid step에 결정변수 할당: `[V_k, n_k, χ_k, ax_k, ay_k]`(상태) + `[jx_k, jy_k]`(제어)
- 구간별 RK4 적분: 각 $[k\cdot ds, (k+1)\cdot ds]$ 구간을 4단계 Runge-Kutta로 적분 → `F(X_k, U_k, s_k) = (X_k_end, q_t, q_reg)`
- 연속성 등식 제약: `X_k_end − X_{k+1} = 0`
- closed-loop 경계조건: `X_0 − X_N = 0`

변수가 grid step 수에 비례해 늘어나지만, 수치적으로 안정적이고 병렬화 가능합니다.

### 3. 초기해 (Initial Guess)

NLP는 반복적 해법이라 시작점이 필요합니다.

- 속도 `V = V_guess = 3.0 m/s` (모든 step)
- 횡변위 `n = (w_tr_l + w_tr_r) / 2` (트랙 중앙)
- heading 오차 `χ = 0`
- 가속도 `ax = ay ≈ 0` (정확히는 `1e-6`, 수치 안정성용)
- 제어 `jx = jy = 0`

즉 "트랙 중앙을 일정한 저속으로 도는 균질한 궤적"입니다. 이 초기해는 모든 제약을 자동 만족(feasible)해 IPOPT가 안정적으로 시작할 수 있습니다.

### 4. IPOPT 반복 (Interior-Point Method)

CasADi가 `nlpsol('ipopt', ...)`로 IPOPT를 호출합니다. 한 iteration에서:

1. 비용 그래디언트 `∇J` 계산
2. 제약 야코비안 `∇g`, `∇h` 계산
3. Hessian 근사: `limited-memory BFGS` (메모리 절약)
4. Newton step: HSL `ma27`로 풀이
5. Step size: line search (`cg-penalty`)
6. 변수 업데이트: `w ← w + α · Δw`
7. 수렴 체크: KKT 잔차(primal/dual/complementarity)

이 반복을 `max_iter = 2000`까지 수행합니다.

### 5. 결정변수의 변화

| 변수 | 변화 방향 |
|---|---|
| `V` | 비용↓ → 증가 (시간 항이 V↑를 원함) |
| `n` | 비용↓ → 라인 모양 변화 (R 확보 또는 곡률 억제) |
| `χ` | `n` 변화와 ODE를 통해 연동 |
| `ax, ay` | 마찰원 한계 내에서 V 변화를 만들도록 조정 |
| `jx, jy` | jerk 항이 작아지도록 부드럽게 |

제약은 비용을 줄이는 방향만 허용합니다 — 마찰원 부등식($a_y$가 $a_{y,max}$에 닿으면 코너 V 결정), 벽 박스($n$이 트랙 폭 한계), 연속성 등식(물리적으로 가능한 궤적), 클로즈드 루프(주기적 궤적).

### 6. 수렴

- Primal feasibility: 제약 잔차 < `constr_viol_tol = 1e-4`
- Dual feasibility: < `dual_inf_tol = 1e-1`
- Complementarity: 부등식 active/inactive 일관성 < `compl_inf_tol = 1e-4`

세 조건이 동시에 만족되면 IPOPT가 종료합니다.

## 마무리

| 단계 | 내용 |
|---|---|
| 1. 문제 정의 | 비용 $J$ 최소화 + 비선형 제약(ODE, 마찰원, 벽, 속도 하한, 경계조건) |
| 2. 이산화 | Direct multiple shooting + RK4, 0.2 m grid |
| 3. 초기해 | 트랙 중앙 + V_guess의 균질 feasible 궤적 |
| 4. IPOPT 반복 | Interior-point + barrier + line search |
| 5. 변수 변화 | 비용 그래디언트 따라 조정, 제약 active 시 그 방향 차단 |
| 6. 수렴 | primal/dual/complementarity 잔차가 톨러런스 이하 |

$w_{d\Omega_z}$를 0으로 두면 이론적 최단의 late-apex 라인을, 키우면 실차 친화적인 geometric-apex 라인을 얻습니다. 생성된 raceline의 속도 프로파일을 별도로 다듬는 방법은 [3D Velocity Planner]({{ site.baseurl }}/posts/nlp-velocity-planner/)를 참고하세요.
