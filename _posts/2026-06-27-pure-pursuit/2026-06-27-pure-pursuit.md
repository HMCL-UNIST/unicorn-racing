---
title: "Pure Pursuit 기반 조향·속도 제어: 순수 PP에 확장 모듈 얹기"
date: 2026-06-27 11:00:00 +0900
categories: [Software, control]
tags: [control, pure-pursuit, path-following, lookahead, friction-circle]
lang: ko
lang_ref: pure-pursuit
math: true
---

> `pp_heading_controller.py` · `pp_heading_params.yaml`
>
> Global planning이 만든 raceline을 실제 조향·속도 명령으로 바꾸는 런타임 제어기입니다.
{: .prompt-info }

## 목표

- **활성 경로 추종**: 차량이 매 순간 따라가야 할 **현재 경로(`/local_waypoints`)** 를 받아 조향각과 목표 속도를 계산합니다. 이 경로는 평상시엔 global line이지만, 장애물이 있으면 회피 스플라인으로 바뀝니다.
- **순수 Pure Pursuit을 뼈대로**: 기하학적 Pure Pursuit을 기본 조향 법칙으로 두고, 그 위에 **적응형 lookahead · understeer 보정 · 헤딩 PID · 마찰원 기반 속도/가속 제어**를 얹어 고속에서도 안정적으로 라인을 붙입니다.
- **50Hz 실시간 루프**: 단일 제어 주기에서 "가장 가까운 점 찾기 → lookahead 점 → 조향 → 속도"를 모두 계산합니다.

## 개요 — 추종 제어의 위치

Pure Pursuit은 스택의 **온라인·실시간** 제어기입니다. 차량의 현재 상태(odometry)와 **지금 따라가야 할 경로(`/local_waypoints`)** 를 받아, **매 50Hz마다** "지금 어디로 얼마나 꺾고, 얼마나 밟을지"를 결정합니다.

여기서 핵심은 Pure Pursuit이 **경로의 출처를 가리지 않는다**는 점입니다. 입력으로 들어오는 `/local_waypoints`는 상황에 따라 내용이 달라집니다.

- **평상시**: global planning이 만든 raceline (IQP 라인)
- **장애물 감지 시**: 회피 스플라인 등 local planning을 통해 생성된 우회 경로

Pure Pursuit은 이 둘을 구분하지 않고, **들어온 경로를 그대로 따라가는 범용 추종기**입니다. "어떤 경로를 따라갈지"는 상위 모듈(`state_machine`)이 정하고, Pure Pursuit은 "그 경로를 어떻게 잘 따라갈지"만 책임집니다.

```text
[경로 결정]   global raceline  ─┐
              회피 스플라인     ─┼→ state_machine → /local_waypoints
                                 ┘
[추종]        /local_waypoints → ★Pure Pursuit★ → /ackermann_cmd → 차량
```

## 메인: 순수 Pure Pursuit

### 기하학적 원리

Pure Pursuit은 가장 단순하고 견고한 경로 추종 알고리즘입니다. 직관은 이렇습니다. **경로 위에서 차 앞쪽으로 일정 거리(lookahead distance, $l_d$) 떨어진 한 점을 "목표점"으로 잡고, 그 점을 향해 원호를 그리며 가는 조향각을 계산한다.**

차량(자전거 모델)이 목표점을 지나는 원호를 따라간다고 하면, 그 원호의 곡률은 차량 좌표계에서 목표점의 횡방향 좌표($l_y$)와 거리($l_d$)로 결정됩니다.

$$
\kappa_{pp} = \frac{2\, l_y}{l_d^{2}}
$$

여기서 $l_y$는 차량 기준 목표점의 좌우 오프셋, $l_d$는 목표점까지의 거리입니다. 이 곡률을 자전거 모델로 조향각으로 변환합니다.

$$
\delta_{geo} = \arctan\!\left( L \cdot \kappa_{pp} \right)
$$

```python
# 목표점을 차량 좌표계로 변환 (lx_v: 전방, ly_v: 좌우)
lx_v =  dtx * cos_y + dty * sin_y
ly_v = -dtx * sin_y + dty * cos_y
dist = math.hypot(lx_v, ly_v)

kappa_pp  = 2.0 * ly_v / (dist * dist)              # 목표점까지의 곡률
delta_geo = math.atan(self.wheelbase * kappa_pp)    # → 조향각
```

가장 가까운 waypoint를 먼저 찾고(직전 인덱스 주변 30개만 탐색해 빠르게), 거기서 $l_d$만큼 경로를 전진시켜 목표점을 잡습니다.

```python
nearest_idx = ...   # 직전 인덱스 주변에서 가장 가까운 점
target_idx  = self._advance(nearest_idx, ld + extra, ...)  # ld만큼 전진
```

여기까지가 메인 알고리즘입니다. 아래부터는 그 위에 얹는 **확장 모듈**들로, 각각 "어떤 한계를 보완하려고 추가했는가"의 관점에서 소개합니다.

## 확장 모듈 (Extensions)

### 모듈 1 — Adaptive Lookahead

**보완하려는 한계**: 고정 lookahead는 추종 성격을 한쪽으로 고정합니다. **짧으면** 경로에 바짝 붙지만 고속에서 진동하고, **길면** 부드럽지만 코너를 잘라먹습니다(코너 커팅). 따라서 하나의 고정값으로는 저속·고속을 동시에 만족시키기 어렵습니다.

**무엇을 하나**: $l_d$를 **속도에 비례**시킵니다 — 빠를수록 멀리 본다는 time-headway 방식입니다.

$$
l_d = \mathrm{clip}\left( t_{hw} \cdot v_x,\ l_{d,\min},\ l_{d,\max} \right)
$$

```python
ld = float(np.clip(self.t_headway * vx, self.ld_min, self.ld_max))
```

| 파라미터 | 값 | 의미 |
|---|---|---|
| `t_headway` | 0.3 s | $v_x \to l_d$ 이득 (앞을 보는 시간) |
| `ld_min` | 0.6 m | 최소 lookahead |
| `ld_max` | 2.5 m | 최대 lookahead |

### 모듈 2 — Understeer Feedforward

**보완하려는 한계**: 고속 코너에서 타이어는 슬립앵글만큼 실제로 덜 꺾이는 understeer가 발생하는데, 이를 사후 피드백으로만 보정하면 반응이 늦습니다.

**무엇을 하나**: 예상되는 횡가속도에 비례해 **미리 조향을 더 주는** feedforward 항입니다.

$$
\delta_{us} = k_{us} \cdot a_{lat,geo}, \qquad a_{lat,geo} = v_x^{2}\, \kappa_{geo}
$$

```python
delta_us = self.k_understeer * a_lat_geo
```

`k_understeer` 파라미터가 너무 크면 코너 안쪽으로 파고듭니다.

### 모듈 3 — 잔차 헤딩 PID

**보완하려는 한계**: $\delta_{geo}$는 lookahead 점을 추종하지만(크로스트랙 + 곡률), 차량 헤딩이 경로 접선과 어긋나는 잔차(슬립·동역학에서 비롯)는 남깁니다.

**무엇을 하나**: **순수추종이 남긴 잔차** — 차량 헤딩과 경로 접선 사이 각도 오차 $e_h$만 — PID로 보정합니다. 목표점 베어링이 아니라 **경로 접선 잔차**를 쓰는 게 핵심인데, 이래야 $\delta_{geo}$와 이중 계산되지 않습니다.

$$
e_h = \mathrm{wrap}\left( \psi_{path} - \psi_{yaw} \right)
$$

$$
\delta_{pid} = K_p\, e_h + K_i \!\int e_h\, dt + K_d\, \dot{e}_h^{\,filt}
$$

```python
e_h = math.atan2(math.sin(psi_n - yaw), math.cos(psi_n - yaw))
delta_pid = (self.heading_kp * e_h + i_term + self.heading_kd * self._he_deriv)
```

| 게인 | 값 | 역할 |
|---|---|---|
| $K_p$ | 0.4 | 라인 수렴 (클수록 빨리 붙음) |
| $K_i$ | 0.0 | 정상상태 오차 제거 (기본 끔) |
| $K_d$ | 0.05 | 진동 감쇠 |

- **$K_d$ = yaw-rate 댐핑**: 접선 오차의 미분이 곧 yaw-rate 항이라, 별도 댐핑 항 없이 진동을 잡습니다.

### 모듈 4 — 마찰원 기반 속도·가속 제어

global planning과 가장 헷갈리는 부분이라, 먼저 **둘의 차이**를 짚습니다.

> **어디서 오는 마찰원인가 — planning vs control**
>
> 마찰원($a = \mu g$)은 global planning에서도 등장하지만 **시점과 대상이 다릅니다.**
>
> - **Global planning (오프라인)**: `ggv.csv`의 마찰원으로 raceline의 *모양*과 그 *$v_x$ 프로파일*을 한 번 계산합니다.
> - **Pure Pursuit (런타임)**: 같은 물리의 마찰원으로, **지금 따라가는 경로가 무엇이든** 매 50Hz마다 조향 곡률과 목표 속도를 *클램프*합니다.
>
> 즉 컨트롤러의 마찰원은 특정 라인에 묶인 게 아니라, 현재 활성 경로 위에서 차량이 미끄러지지 않도록 실시간 제한하는 일반 안전장치입니다. 회피 스플라인을 따라갈 때도 똑같이 작동합니다.
{: .prompt-info }

**마찰원 분배**: 전체 그립 $a_{total,max}$를 횡/종으로 나눠 씁니다. 코너에서 횡그립을 많이 쓰면 가속에 쓸 종그립이 줄어드는 게 마찰원의 핵심입니다. $a_{lat,ref}$는 현재 경로의 가장 가까운 점의 속도·곡률로 계산합니다.

$$
a_{long,budget} = \min\!\left( a_{long,\max},\ \sqrt{a_{total,\max}^{2} - a_{lat,ref}^{2}} \right)
$$

```python
a_lat_ref     = v_near * v_near * kappa_now
a_long_budget = min(self.a_long_max,
                    math.sqrt(max(0.0, self.a_total_max**2 - a_lat_ref**2)))
```

**코너 속도 캡 + 예측 제동**: 각 전방 점에서 곡률이 허용하는 최대 속도와 경로가 준 속도 중 작은 값을 목표로 잡고, **거리를 고려한 후방 제동 패스**로 "지금 얼마로 달려야 그 코너 전에 감속 가능한가"를 계산합니다.

$$
v_{ref} = \min_{s} \sqrt{\, v_{target}(s)^{2} + 2\, a_{brake,\max}\, \Delta s \,}
$$

```python
v_curve  = np.sqrt(a_lat_use / np.maximum(kappa_win, 1e-3))
v_target = np.minimum(self._vx_wp[v_win], v_curve)   # 경로가 준 vx와 곡률 캡 중 min
v_allow  = np.sqrt(v_target**2 + 2.0 * self.a_brake_max * ds)
v_ref    = float(np.min(v_allow))                    # 코너가 가까울수록 점진 감속
```

**헤딩 정렬 가속 게이트**: 코너 탈출 시 차가 경로 방향으로 펴지기 전에 액셀을 밟으면 불안정해집니다. 그래서 헤딩 오차 $\lvert e_h\rvert$가 크면 가속을 억제하는 게이트를 둡니다.

```python
align = (self.yaw_gate_max - abs(e_h)) / (self.yaw_gate_max - self.yaw_gate_min)
if v_ref > vx:
    v_cmd = min(v_ref, vx + a_long_budget * align * self.t_cmd_horizon)  # 가속만 게이트
else:
    v_cmd = v_ref                                                         # 제동은 항상 허용
```

| 파라미터 | 값 | 의미 |
|---|---|---|
| `yaw_gate_min` | 0.05 rad (~3°) | 이하: 가속 100% |
| `yaw_gate_max` | 0.40 rad (~23°) | 이상: 가속 0% |

> 가속만 게이트하고 **제동은 막지 않습니다** — 안전을 위한 비대칭 설계.
{: .prompt-tip }

## 입출력 / 토픽 연결

### 구독 (입력)

| 토픽 | 타입 | 내용 |
|---|---|---|
| `/car_state/odom` | `nav_msgs/Odometry` | 차량 위치·속도·자세 |
| `/local_waypoints` | `f110_msgs/WpntArray` | 추종할 현재 경로 (state_machine 출력) |

> Pure Pursuit이 구독하는 건 `/global_waypoints`가 아니라 **`/local_waypoints`**입니다. global raceline이든 회피 스플라인이든, `state_machine`이 "지금 따라갈 경로"로 확정한 결과가 이 토픽으로 들어옵니다. 각 waypoint는 `x, y, psi_rad, kappa_radpm, vx_mps`를 담고 있어, 컨트롤러는 출처와 무관하게 곡률 캡과 목표 속도를 동일하게 읽습니다.
{: .prompt-info }

### 발행 (출력)

| 토픽 | 타입 | 내용 |
|---|---|---|
| `drive_topic` (기본 `/vesc/high_level/ackermann_cmd`) | `AckermannDriveStamped` | 조향각 + 목표 속도 |
| `/pp/lookahead` | `Marker` | RViz용 lookahead 점 |
| `/pp_debug` | `Float64MultiArray` | 디버그 ($a_{lat}$, $\delta$ 분해, $e_h$, $l_d$, $v_{ref}$ 등) |

### 주요 파라미터 (`pp_heading_params.yaml`)

| 그룹 | 파라미터 | 값 |
|---|---|---|
| 차량 | `wheelbase_L` / `delta_max` | 0.33 m / 0.41 rad |
| 속도 | `v_min` / `v_max` | 0.5 / 8.0 m/s |
| Lookahead (모듈 1) | `ld_min` / `ld_max` / `t_headway` | 0.6 / 2.5 m / 0.3 s |
| 마찰원 (모듈 4) | `a_total_max` / `a_long_max` / `lat_safety` | 6.7 / 2.0 m/s² / 0.3 |
| Understeer (모듈 2) | `k_understeer` | 0.010 |
| 헤딩 PID (모듈 3) | `Kp` / `Ki` / `Kd` | 0.4 / 0.0 / 0.05 |
| 제동 (모듈 4) | `a_brake_max` / `t_cmd_horizon` | 3.5 m/s² / 0.3 s |
| 정렬 게이트 (모듈 4) | `yaw_gate_min` / `max` | 0.05 / 0.40 rad |

## 매 틱 요약

50Hz 루프 한 번에서 일어나는 일:

1. **가장 가까운 waypoint** 찾기 (직전 인덱스 주변 탐색)
2. **[모듈 1]** 적응형 lookahead $l_d = \mathrm{clip}(t_{hw} \cdot v_x)$ 계산
3. **목표점**을 경로에서 $l_d$만큼 전진해 선택
4. **조향** $= \delta_{geo}$(메인 PP) $+ \delta_{us}$(모듈 2) $+ \delta_{pid}$(모듈 3) → 클램프
5. **속도** = [모듈 4] 마찰원 분배 → 코너 캡 → 후방 제동 → 정렬 게이트
6. **발행**: drive 명령 + 디버그/시각화

```python
delta_cmd = clip(delta_geo + delta_us + delta_pid, ±delta_max)
v_cmd     = (가속: min(v_ref, vx + a_long_budget·align·t_horizon)) or (제동: v_ref)
self._publish_drive(delta_cmd, v_cmd)
```

Pure Pursuit은 이렇게 **검증된 순수 PP를 메인으로 두고, 그 한계를 보완하는 확장 모듈을 선택적으로 얹은** 구조의 범용 추종기입니다. 그 경로가 global raceline일 때는 빠른 주행을, 회피 스플라인일 때는 안전한 우회를 — 컨트롤러 입장에서는 동일한 추종 문제로 처리합니다.
