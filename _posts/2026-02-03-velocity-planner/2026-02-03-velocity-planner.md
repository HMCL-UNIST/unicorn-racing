---
title: "Velocity Planner: 속도 프로파일 생성"
author: inyoung-choi
date: 2026-02-03 15:00:00 +0900
categories: [Software, planning]
tags: [velocity]
image:
  path: /assets/img/posts/velocity-planner/ggv-diagram.png
lang: ko
lang_ref: velocity-planner
math: true
---

**Velocity Planner**는 주어진 경로(Waypoints)에 대해 차량의 동역학적 제약을 고려하여 최적의 속도 프로파일을 생성하는 모듈입니다. 차량의 물리적 임계치를 초과하지 않는 범위 내에서 주행 효율을 극대화함과 동시에, 주행 안정성을 확보하는 것을 목표로 합니다.

| 특징 | 설명 |
|------|------|
| Physics-based 제약 | 타이어 마찰, 모터/브레이크 한계, 공기 저항 고려 |
| Forward-Backward Solver | 가속 & 감속 제약을 고려하는 속도 계획 알고리즘 |
| GGV Diagram | 속도에 따른 종/횡 가속 한계를 GGV 다이어그램으로 표현 |
| Real-time | 빠른 계산 (analytical solution) |
| Path-dependent | 곡률(curvature)에 따른 동적 속도 조정 |

## Physics Constraints (물리 기반 제약 모델)

### Friction Circle (타이어 가속 제약)

타이어가 제공할 수 있는 총 가속도는 마찰 한계로 제한됩니다. 종방향(가속·제동)과 횡방향(코너링) 가속도는 독립적으로 발생할 수 없으며, 그 조합은 일정한 한계를 갖습니다. 이러한 제약을 일반화하여 표현한 것이 **Generalized Friction Circle(Ellipse)** 모델입니다.

$$
\left(\frac{a_x}{a_{x,max}}\right)^p + \left(\frac{a_y}{a_{y,max}}\right)^p \leq 1
$$

- $a_x$ : 종방향 가속도 (가속/감속)
- $a_y$ : 횡방향 가속도 (코너링)
- $a_{x,max}$ : 타이어 종가속 한계
- $a_{y,max}$ : 타이어 횡가속 한계
- $p$ : dynamic model exponent (combined-slip 형태를 결정하며, 일반적으로 1.0~2.0 값을 가집니다)

$p$가 클수록 planner는 더 공격적인 가속을 허용하며, 값에 따라 friction circle의 형태는 다음과 같습니다.

| $p$ | Friction Circle 형태 | 특성 |
|-----|---------------------|------|
| 1.0 | Diamond (◇) | 매우 보수적, 코너에서 가속 제한 강함 |
| 1.5 | 중간 | 안정성과 성능의 균형 |
| 2.0 | Circle / Ellipse (○) | 공격적, 코너 중 가속 허용 |

### 가속도 계산

주행 중 사용 중인 횡가속도는 곡률로부터 계산됩니다.

$$
a_{y,used} = \frac{v^2}{r}
$$

이를 Friction 제약에 대입하면, 현재 상태에서 사용 가능한 가용 종방향 가속도는 다음과 같습니다.

$$
a_{x,avail} = a_{x,max} \cdot \left(1 - \left(\frac{a_{y,used}}{a_{y,max}}\right)^p\right)^{1/p}
$$

- 직선 구간 $(a_y = 0)$에서는 $a_x = a_{x,max}$이므로, 최대 가속이 가능합니다.
- 코너 진입 ($a_y$ 증가)에서는 $a_x$가 줄어드므로, 가속이 제한됩니다.

따라서, 조향을 많이 할수록 가능한 가속값이 작아짐을 알 수 있습니다.

### 공기저항

속도가 증가함에 따라 공기 저항에 의해 추가적인 감속이 발생합니다.

$$
a_{drag} = -\frac{c_d \cdot v^2}{m_{veh}}
$$

$$
c_d = 0.5 \cdot C_w \cdot A_{front} \cdot \rho_{air}
$$

- $c_d$ : 항력 계수
- $m_{veh}$ : 차량 질량

따라서, 공기저항은 속도 증가에 따라 급격히 커지며, 고속 영역에서 가속 성능을 제한하고 타이어 마찰 제약과 함께 최종 가속 한계를 결정합니다.

## 알고리즘 (Forward-Backward Solver)

### 원리 (Two-pass Velocity Planning)

경로를 따라 주행 가능한 속도를 계산하기 위해 **Forward-Backward two-pass** 알고리즘을 사용합니다.

- **Forward Pass**: 차량의 가속능력을 고려하여, 현재 위치에서 다음 위치까지 가속 가능한 최대 속도를 계산합니다.
- **Backward Pass**: 차량의 감속(제동)능력을 고려하여, 다음 위치에 안전하게 도달할 수 있는 최대 허용 속도를 역방향으로 계산합니다.

각 지점의 최종 속도는 Forward와 Backward 결과 중 더 작은 값을 선택함으로써, 모든 동역학적 제약을 만족하는 속도 프로파일을 생성합니다.

### 진행 단계

#### Step 1: 초기 속도 프로파일 (Lateral G 제약)

곡률($\kappa$)이 주어진 경로에서, 타이어의 횡가속 한계를 만족하는 최대 속도를 계산합니다.

$$
v_{max}(i) = \sqrt{\frac{a_{y,max}}{|\kappa(i)|}}
$$

- $a_{y,max}$ : 타이어의 최대 횡방향 가속도
- $\kappa(i)$ : $i$번째 지점의 곡률 (1/반경)

해당 단계는 코너링 한계만 고려한 이론적 최대 속도를 제공합니다.

#### Step 2: Forward Pass (가속 제한)

시작 지점부터 경로를 따라 진행하면서, 이용 가능한 종방향 가속도를 고려해 다음 지점의 최대 속도를 계산합니다.

$$
v_{i+1} = \sqrt{v_i^2 + 2 \cdot a_{x,avail} \cdot \Delta s}
$$

- $a_{x,avail}$ : 타이어, 모터, 공기저항을 고려한 이용 가능한 종방향 가속도
- $\Delta s$ : $i \rightarrow i+1$ 지점 간 거리

해당 단계는 차량이 실제 가속할 수 있는 범위를 반영합니다.

#### Step 3: Backward Pass (감속 제한)

경로의 끝점에서 시작점 방향으로 역행하면서, 브레이크 성능을 고려해 안전한 감속이 가능한 속도를 계산합니다.

$$
v_i = \sqrt{v_{i+1}^2 + 2 \cdot a_{x,brake} \cdot \Delta s}
$$

다음 지점에서 요구되는 속도를 만족하기 위해, 미리 감속이 가능하도록 보장합니다.

#### Step 4: 최종 속도 결정

각 지점에서 Forward와 Backward Pass의 결과 중 더 작은 값을 선택합니다.

$$
v_{final}(i) = \min(v_{forward}(i), v_{backward}(i))
$$

> 해당 과정을 통해 가속 한계, 감속 한계, 타이어 마찰 제약, 공기 저항을 모두 만족하는 속도 프로파일을 생성할 수 있습니다.
{: .prompt-tip }

## GGV Diagram 및 구동계 제약

속도에 따른 가속 성능 변화를 반영하기 위해, **GGV Diagram**과 모터 및 브레이크 제약을 함께 사용합니다.

### GGV Diagram

속도에 따라 차량이 생성할 수 있는 최대 종방향 가속도와 최대 횡방향 가속도를 정리한 표는 아래와 같습니다.

| 속도 (v) | 최대 종가속 ($a_{x,max}$) | 최대 횡가속 ($a_{y,max}$) |
|----------|--------------------------|--------------------------|
| 0 m/s | 7.0 m/s² | 5.8 m/s² |
| 4 m/s | 7.0 m/s² | 5.8 m/s² |
| 8 m/s | 7.0 m/s² | 5.8 m/s² |
| 12 m/s | 7.0 m/s² | 5.8 m/s² |

Friction Circle(Ellipse)의 $a_{x,max}$와 $a_{y,max}$의 값을 속도별로 제공함으로써, 코너링 한계 및 가속 계산의 기본 입력 데이터로 사용할 수 있습니다.

### 구동계 제약 (Motor / Brake Limits)

타이어가 허용하더라도, 실제 가속/감속 성능은 모터 출력 및 브레이크 성능에 의해 추가적으로 제한됩니다.

**Motor Acceleration Limit (ax_max_machines.csv):**

| 속도 | 최대 모터 가속도 |
|------|-----------------|
| 0-15 m/s | 4.2 m/s² |

모터가 생성할 수 있는 최대 구동 가속도로, 직선 가속시 실제 가속 성능의 상한을 결정합니다.

**Brake Deceleration Limit (b_ax_max_machines.csv):**

| 속도 | 최대 브레이크 감속도 |
|------|---------------------|
| 0-15 m/s | -7.0 m/s² |

브레이크의 최대 감속 성능으로, Backward pass에서 감속 가능 여부를 판단하는데 사용합니다.

### 알고리즘에서의 통합 방식

**Forward Pass (가속)**

$$
a_{x,avail} = \min(a_{x,tires}, a_{x,motor}) + a_{drag}
$$

타이어 마찰 한계와 모터 성능 중 더 작은 값을 가속 상한으로 선택하고, 여기에 공기 저항으로 인한 감속 항을 추가하여 실제 이용 가능한 종방향 가속도를 계산합니다.

**Backward Pass (감속)**

$$
a_{x,avail} = \min(a_{x,tires}, a_{x,brake}) + a_{drag}
$$

타이어 제약과 브레이크 성능을 동시에 고려하여 감속 한계를 계산합니다. 여기에 속도에 비례해 증가하는 공기 저항이 추가되어 고속 영역에서의 유효 감속 성능이 변화합니다.

## 구현 및 사용

메인 함수 `calc_vel_profile()`에 필요한 입력(ggv, kappa, el_lengths 등)과 설정 옵션을 아래와 같이 구성합니다.

```python
vx_profile = calc_vel_profile(
    ggv=ggv,                        # g-g diagram
    ax_max_machines=ax_max,         # 모터 한계
    b_ax_max_machines=b_ax_max,     # 브레이크 한계
    kappa=kappa,                    # 곡률 배열
    el_lengths=el_lengths,          # 웨이포인트 간 거리
    closed=True/False,              # Closed loop 여부
    v_max=12.0,                     # 최대 속도
    v_start=cur_v,                  # 시작 속도 (open loop만)
    dyn_model_exp=1.0,
    drag_coeff=0.0136,
    m_veh=3.5
)
```

### 사용 시나리오

**Raceline optimization (offline)**

트랙 한 바퀴를 대상으로 `closed=True` 설정을 사용하여, 속도 프로파일을 계산합니다. 한번 계산 후 저장된 결과는 이후 주행에 재사용됩니다.

**Local planning (runtime)**

`closed=False` 설정을 사용하여, 현재 차량 위치부터 전방의 일정 구간에 대해서만 속도를 계산합니다. `v_start=현재속도`로 사용하여, 주행 중 주기적으로 속도 프로파일을 재계산함으로써 정적 장애물과 같은 환경 변화에 대응할 수 있습니다.

## 파라미터 튜닝

### 파라미터 파일

**차량 파라미터**: `config/{CAR_NAME}/racecar_f110.ini`

```ini
[GENERAL_OPTIONS]
veh_params = {
    "v_max": 12.0,          # 최대 속도 (m/s)
    "mass": 3.5,            # 차량 질량 (kg)
    "dragcoeff": 0.0136     # 공기 저항 계수
}
vel_calc_opts = {
    "dyn_model_exp": 1.0,                   # Diamond model
    "vel_profile_conv_filt_window": 51      # Filter window (홀수)
}
```

**GGV Diagram**: `config/{CAR_NAME}/veh_dyn_info/ggv.csv`

```csv
# v_mps, ax_max_mps2, ay_max_mps2
0.0,  7.0, 5.8
4.0,  7.0, 5.8
8.0,  7.0, 5.8
12.0, 7.0, 5.8
```

**모터**: `config/{CAR_NAME}/veh_dyn_info/ax_max_machines.csv`

```csv
# v_mps, ax_max_machines_mps2
0.0,  4.2
4.0,  4.2
8.0,  4.2
12.0, 4.2
```

### 튜닝 가이드

#### 최대 속도

```python
self.v_max = 12.0  # → 15.0 (더 빠르게)
```

직선 구간에서 주행 속도가 향상되지만, 코너 진입 속도 또한 증가하므로 주행 안정성에 대한 추가적인 주의가 필요합니다.

#### 코너 속도 (횡가속 한계)

```python
self.a_y_max = 5.8  # → 6.5 (코너 속도 증가)
```

코너 구간에서 더 높은 속도를 유지할 수 있어 코너링 성능이 향상됩니다. 그러나 타이어 슬립이나 언더스티어를 유발할 수 있으므로, 실제 타이어 성능을 기반으로 조정해야 합니다.

#### 가속 (모터 성능)

```python
self.ax_max_motor = 4.2  # → 5.0 (더 빠른 가속)
```

공격적인 주행이 가능해지지만, 모터 및 배터리의 물리적 한계를 초과하지 않도록 주의가 필요합니다.

#### 감속 (브레이크 성능)

```python
self.ax_max_brake = 7.0  # → 8.0 (더 강한 제동)
```

제동 거리가 감소하여 보다 늦은 제동이 가능해집니다. 그러나 급제동시 차량의 state가 불안정해질 수 있으므로, 안정성을 고려한 조정이 필요합니다.

#### Friction shape (dynamic model exponent)

```python
self.dyn_model_exp = 1.0  # Diamond model (보수적)
                  # → 1.5  # 중간
                  # → 2.0  # Circle model (공격적)
```

`dyn_model_exp`는 Friction Circle의 형태를 결정하는 파라미터입니다. 일반적으로 안정성을 우선하는 경우에는 1.0~1.3 범위가 권장되며, 성능을 우선하는 경우에는 1.5~2.0 범위의 값을 사용하는 것이 적절합니다.

#### Moving Average Filter (global)

```python
filt_window = 51  # → 31 (덜 부드러움, 더 공격적)
                  # → 71 (더 부드러움, 더 보수적)
```

필터의 윈도우 크기가 클수록 속도 변화가 완만해져 주행이 부드러워지지만, 반응 속도는 감소합니다.

#### Acceleration Filter (local)

```python
alpha = 0.2  # → 0.5 (더 빠른 응답)
             # → 0.1 (더 부드러운 응답)

# 가속/감속 비율 조정
if self.filtered_acc > 0:
    target_speed = self.cur_v + self.filtered_acc / 8.0   # ← 이 값 조정
else:
    target_speed = self.cur_v + self.filtered_acc / 1.4   # ← 이 값 조정
```

차량의 가속 및 감속 응답성을 조절하는 역할로, alpha를 증가시키면 반응이 빨라지지만 속도 변화가 급격해집니다.

## Troubleshooting

### 속도가 너무 보수적인 경우

코너 및 직선 구간에서 예상보다 낮은 속도로 주행한다면, 원인은 다음과 같습니다.

- GGV에 설정된 가속 한계값이 너무 낮음
- `dyn_model_exp` 값이 너무 작음 (1.0)
- 속도 필터 윈도우의 크기가 너무 큼

**해결 방안:**

```python
# 1. GGV 증가
self.a_y_max = 5.8  # → 6.5

# 2. Dynamic model 조정
self.dyn_model_exp = 1.0  # → 1.5

# 3. 필터 감소
filt_window = 51  # → 31
```

### 속도가 불안정한 경우

속도가 주행 중 심하게 진동하거나 불규칙하게 변한다면, 원인은 다음과 같습니다.

- 필터링이 충분하지 않음
- 경로(waypoints)가 불안정
- 곡률(kappa) 계산 오류

**해결 방안:**

```python
# 1. 필터 증가
filt_window = 31  # → 51

# 2. Alpha 감소 (local)
alpha = 0.5  # → 0.2

# 3. 곡률 스무딩
kappa = smooth_curvature(kappa, window=5)
```

### 코너에서 언더/오버스티어인 경우

코너 구간에서 타이어가 미끄러지거나 차량이 경로를 이탈한다면, 원인은 다음과 같습니다.

- `a_y_max`가 실제 타이어 성능보다 과도하게 설정됨
- `dyn_model_exp` 값이 너무 큼 (2.0)
- 노면 마찰 계수 변화가 고려되지 않음

**해결 방안:**

```python
# 1. 횡가속 한계 감소
self.a_y_max = 6.5  # → 5.5

# 2. Dynamic model 보수적으로
self.dyn_model_exp = 2.0  # → 1.0

# 3. 안전 마진 적용
self.a_y_max *= 0.9  # 10% 마진
```

## 마무리

이 글에서는 Velocity Planner의 물리 기반 제약 모델, Forward-Backward 알고리즘, GGV Diagram을 활용한 속도 프로파일 생성 방법을 다뤘습니다.

핵심 포인트:
- Friction Circle을 통해 타이어의 종/횡 가속 한계를 모델링합니다.
- Forward-Backward two-pass 알고리즘으로 가속/감속 제약을 모두 만족하는 속도를 계산합니다.
- 파라미터 튜닝을 통해 보수적/공격적 주행 특성을 조절할 수 있습니다.

## Reference

- Trajectory Planning Helpers: [https://github.com/TUMFTM/trajectory_planning_helpers](https://github.com/TUMFTM/trajectory_planning_helpers)
- Original Paper: "Minimum Curvature Trajectory Planning and Control for an Autonomous Race Car"
- Friction Circle: [https://driver61.com/uni/friction-circle](https://driver61.com/uni/friction-circle)
