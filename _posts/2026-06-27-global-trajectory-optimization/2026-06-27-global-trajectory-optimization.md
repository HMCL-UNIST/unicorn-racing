---
title: "Global Trajectory Optimization: 최소곡률(IQP)과 최단경로(SP) 레이스라인"
date: 2026-06-27 10:00:00 +0900
categories: [Software, planning]
tags: [raceline, optimization, iqp, shortest-path, global-planning]
lang: ko
lang_ref: global-trajectory-optimization
math: true
---

> `trajectory_optimizer.py` · `gb_optimizer` 패키지
>
> `centerline.csv`를 받아 실제로 달릴 global line을 만들고 `global_waypoints.json`으로 저장합니다.
{: .prompt-info }

## 목표

- **트랙 → global line**: `centerline_extractor`가 만든 `centerline.csv`와 boundary CSV를 입력으로, 차량이 실제로 추종할 최적 주행선을 계산합니다.
- **2단계 최적화 (IQP → SP)**: 곡률을 최소화한 **최소곡률 라인(IQP)** 과, 경로 길이를 최소화한 **최단경로 라인(SP)** 을 모두 생성합니다. 우리 스택은 **IQP를 메인 raceline으로 사용**하고, SP는 추월 경로 등을 위한 보조 라인으로 함께 저장합니다.
- **다운스트림 호환**: 결과를 `gb_optimizer`의 JSON 스키마로 저장해, 기존 `global_trajectory_publisher`가 수정 없이 그대로 재발행하도록 합니다.

## 개요 — 왜 센터라인만으론 부족한가?

센터라인은 트랙 한가운데를 지나는 선일 뿐, **빠른 선**이 아닙니다. 레이싱에서 랩타임을 줄이려면 코너를 넓게 깎아 들어가 곡률을 낮추거나(코너링 속도↑), 아예 이동 거리를 줄여야 합니다. 이 "어떤 선으로 달릴 것인가"를 푸는 게 global line 최적화입니다.

이 노드는 두 가지 고전적 global line을 만듭니다.

- **IQP (Iterative Quadratic Programming) — 최소곡률 라인 (메인)**: 경로의 곡률을 최소화. 코너를 부드럽고 넓게 통과해 더 높은 속도를 낼 수 있어, 보통 가장 빠른 랩타임을 줍니다. **우리가 실제로 추종하는 라인**입니다.
- **SP (Shortest Path) — 최단경로 라인 (보조)**: 이동 거리를 최소화. 안쪽 벽에 바짝 붙는 라인으로, 곡률은 크지만 거리가 짧아 특정 상황(추월·방어 등)에서 참고용으로 함께 저장됩니다.

## 핵심 아이디어 — alpha 파라미터화

global line 최적화의 출발점은 **"global line을 어떻게 수학적으로 표현할 것인가"** 입니다. 만약 global line의 모든 점을 자유로운 $(x, y)$로 두면 변수가 폭발하고, 트랙 안에 있어야 한다는 제약도 복잡해집니다.

대신 이 스택은 모든 global line을 **센터라인 + 법선 방향 변위 $\alpha$** 로 표현합니다. 센터라인의 각 점에서 그 점의 법선(normal) 방향으로 $\alpha(s)$만큼 이동한 점이 global line 위의 점입니다.

$$
\mathbf{p}_{\text{race}}(s) = \mathbf{p}_{\text{center}}(s) + \alpha(s)\, \mathbf{n}(s)
$$

여기서 $\mathbf{p}_{\text{center}}$는 센터라인 점, $\mathbf{n}$은 단위 법선 벡터, $\alpha(s)$는 그 지점의 변위입니다. 이렇게 두면 이점이 큽니다.

- **변수가 1차원**: 각 점마다 $(x, y)$ 두 개가 아니라 $\alpha$ 하나만 최적화하면 됩니다.
- **트랙 제약이 단순**: "벽을 넘지 마라"가 그냥 $w_{tr,right} \le \alpha \le w_{tr,left}$ 라는 박스 제약이 됩니다.

## 파이프라인 — `run()`

전체 흐름은 `trajectory_optimizer`의 `run()` 메서드에 담겨 있습니다. 입력 로드부터 두 라인 최적화, JSON 저장까지 순서대로 진행됩니다.

```python
def run(self):
    reftrack_imp = self._load_centerline(csv_path)        # centerline.csv
    bound_r, bound_l = self._load_boundaries()            # boundary CSV (실제 벽)

    # 트랙 전처리: 리샘플링 + 스플라인 + 곡률/heading
    reftrack_interp, normvec_interp, a_interp, cx, cy = tph.prep_track.prep_track(...)

    # 1단계: IQP (최소 곡률) — 메인 라인
    traj_iqp, lap_iqp, reftrack_iqp, normvec_iqp = self._run_iqp(...)
    self._run_check('IQP', traj_iqp, bound_r, bound_l, ...)

    # 2단계: SP (최단 경로) — IQP 결과를 기준 트랙으로 사용
    traj_sp, lap_sp = self._run_sp(reftrack_iqp, normvec_iqp)

    self._save_json(...)                                  # global_waypoints.json
    self._run_check('SP', traj_sp, bound_r, bound_l, ...)
```

## Step 1 — 트랙 전처리 (`prep_track`)

원본 centerline은 점 간격도 불규칙하고 스플라인 정보도 없습니다. `prep_track`이 이를 최적화기가 쓸 수 있는 형태로 정리합니다.

- **균일 리샘플링**: `stepsize_opts`에 따라 일정 간격으로 점을 다시 깝니다.
- **스플라인 피팅**: 점들을 3차 스플라인으로 맞춰 연속적인 곡선으로 만듭니다.
- **법선 벡터 계산**: 각 점의 단위 법선 $\mathbf{n}(s)$을 구합니다 ($\alpha$ 파라미터화의 축).
- **곡률·heading 계산**: 스플라인 계수에서 해석적으로 $\kappa$(곡률), $\psi$(heading)를 산출합니다.

```python
reftrack_interp, normvec_interp, a_interp, coeffs_x, coeffs_y = \
    tph.prep_track.prep_track(
        reftrack_imp=reftrack_imp,
        reg_smooth_opts=self.pars['reg_smooth_opts'],
        stepsize_opts=self.pars['stepsize_opts'],
        min_width=self.pars['imp_opts']['min_track_width'])
```

> `min_track_width`(기본 0.8m)보다 좁은 구간은 최적화가 발산할 수 있어 이 값으로 하한을 보장합니다. `centerline_extractor`의 폭 하한 클램프(0.15m)와 함께 작동하는 안전장치입니다.
{: .prompt-tip }

## Step 2 — IQP 최소곡률 최적화

최소곡률 최적화는 global line 전체의 곡률 제곱합을 최소화하는 $\alpha$를 찾습니다. 곡률이 작을수록 더 빠른 코너링 속도가 가능하므로, 결과 라인은 코너를 넓게 깎아 들어갑니다.

$$
\min_{\alpha} \ \sum_{i} \kappa_i(\alpha)^2
\quad \text{s.t.} \quad -w_{\text{right},i} \le \alpha_i \le w_{\text{left},i}
$$

곡률 $\kappa$는 $\alpha$에 대해 비선형이지만, 각 반복에서 선형 근사하면 **이차 계획법(QP)** 으로 풀 수 있습니다. 한 번 풀어 라인을 갱신하고, 갱신된 라인에서 다시 선형화해 푸는 것을 반복하는 게 **Iterative QP(IQP)** 입니다.

```python
alpha_opt, reftrack_iqp, normvec_iqp = tph.iqp_handler.iqp_handler(
    reftrack=reftrack_interp,
    normvectors=normvec_interp,
    kappa_bound=self.pars['veh_params']['curvlim'],   # 차량 최대 곡률
    w_veh=self.safety_width_iqp,                       # 안전 차폭
    iters_min=...['iqp_iters_min'],                    # 최소 반복 횟수
    curv_error_allowed=...['iqp_curverror_allowed'],   # 수렴 판정 곡률 오차
)[0:3]
```

## Step 3 — SP 최단경로 최적화 (보조)

최단경로 최적화는 이름 그대로 global line의 **전체 길이를 최소화**하는 $\alpha$를 찾습니다. 결과는 안쪽 벽에 바짝 붙는 라인이 됩니다. 길이는 $\alpha$에 대한 매끄러운 함수라 QP 한 번으로 바로 풀립니다(반복 불필요).

$$
\min_{\alpha} \ \sum_{i} \left\| \mathbf{p}_{i+1}(\alpha) - \mathbf{p}_i(\alpha) \right\|^2
\quad \text{s.t.} \quad -w_{\text{right},i} \le \alpha_i \le w_{\text{left},i}
$$

```python
alpha_opt = tph.opt_shortest_path.opt_shortest_path(
    reftrack=reftrack_iqp,        # IQP가 다듬은 트랙 위에서 풂
    normvectors=normvec_iqp,
    w_veh=self.safety_width_sp,
)
```

## Step 4 — Trajectory 조립

$\alpha$가 정해지면 global line 좌표가 복원되고, 거기에 곡률·속도·가속도 프로파일을 입혀 완전한 trajectory를 만듭니다. (속도 프로파일은 [Velocity Planner]({{ site.baseurl }}/posts/velocity-planner/) 참고.)

최종 trajectory의 각 행은 다음 7개 열을 가집니다.

| 열 | 기호 | 의미 |
|---|---|---|
| `s_m` | $s$ | 시작점부터의 누적 거리 |
| `x_m`, `y_m` | $x, y$ | global line 좌표 |
| `psi_rad` | $\psi$ | heading 각도 |
| `kappa_radpm` | $\kappa$ | 곡률 |
| `vx_mps` | $v_x$ | 목표 속도 |
| `ax_mps2` | $a_x$ | 목표 가속도 |

```python
# columns: [s_m, x_m, y_m, psi_rad, kappa_radpm, vx_mps, ax_mps2]
traj = np.column_stack([
    s_points_opt, raceline_interp[:, 0], raceline_interp[:, 1],
    psi_vel, kappa, vx_profile, ax_profile])
```

이 trajectory가 곧 [Pure Pursuit]({{ site.baseurl }}/posts/pure-pursuit/) 등 추종 제어가 따라갈 목표 경로가 됩니다.

## Step 5 — Check Trajectory (안전 검증)

최적화 결과가 실제로 달릴 수 있는 라인인지 검증합니다. `enable_check_traj`가 켜져 있고 boundary CSV가 있으면 실행됩니다.

검사 항목은 다음과 같습니다.

- **벽 충돌**: global line에서 벽까지 거리가 차량 반폭(`veh_half`)보다 작은 점 → ERROR
- **여유 부족**: 거리가 안전 반폭(`safety_half`) 미만 → WARN
- **곡률 초과**: $\lvert\kappa\rvert >$ `curvlim` (조향 한계 초과) → WARN
- **속도 초과**: $v_x >$ `v_max` → WARN
- **횡가속도 초과**: $a_{lat} = v_x^2 \lvert\kappa\rvert$ 가 ggv 한계 초과 → WARN

```python
dist = np.array([np.min(np.linalg.norm(bound - pt, axis=1)) for pt in raceline])
n_hit = int((dist < veh_half).sum())          # 벽 충돌 점 수
...
a_lat = vx**2 * np.abs(kappa)                  # 횡가속도
n_alat = int((a_lat > a_lat_max * 1.05).sum())
```

로그에 `[CheckTraj IQP] min_r=... min_l=... max_κ=... max_v=... max_a_lat=...` 형태로 요약이 찍히니, raceline이 깨졌을 때 어디가 문제인지 여기서 먼저 확인하면 됩니다.

## 파라미터는 어디서 오는가

`trajectory_optimizer`는 ROS 파라미터를 직접 받기보다, **`stack_master/config/<racecar_version>/` 폴더의 설정 파일들**에서 차량·최적화 파라미터를 읽습니다. 기본 `racecar_version`은 `CAR`이므로, 별도 지정이 없으면 `config/CAR/`의 파일들이 사용됩니다.

```text
config/CAR/
├── racecar_f110.ini          # 차량·최적화 모든 파라미터의 본체
└── veh_dyn_info/
    ├── ggv.csv               # 속도별 가감속·횡가속 한계 (g-g-v diagram)
    ├── ax_max_machines.csv   # 속도별 모터 가속 한계
    └── b_ax_max_machines.csv # (백업/대안 모터 한계 테이블)
```

ROS 파라미터(`safety_width_iqp` 등)는 **ini 값을 실행 시 덮어쓰는 용도**일 뿐, 평소엔 거의 건드리지 않습니다. 기본값 -1.0(또는 ≤0)이면 ini의 값을 그대로 씁니다.

### ROS 파라미터 (선택적 override)

| 파라미터 | 기본값 | 동작 |
|---|---|---|
| `map_name` | (필수) | `maps/<map>/` 폴더 이름 |
| `racecar_version` | `CAR` | `config/<version>/` 폴더 선택 |
| `safety_width_iqp` | -1.0 | ≤0이면 ini의 `optim_opts_mincurv.width_opt` 사용 |
| `safety_width_sp` | -1.0 | ≤0이면 ini의 `optim_opts_shortest_path.width_opt` 사용 |
| `enable_check_traj` | True | 최적화 후 안전 검증 실행 |
| `enable_mintime` | False | `opt_mintime`(CasADi) 추가 실행 |

### `racecar_f110.ini` — 실제로 쓰이는 핵심 값 (CAR 기준)

대부분의 튜닝은 ROS 파라미터가 아니라 **이 ini 파일을 직접 수정**해서 합니다.

**`[GENERAL_OPTIONS]` — veh_params (차량 물성·한계)**

| 키 | 값 | 의미 | 쓰이는 곳 |
|---|---|---|---|
| `v_max` | 15.0 | 최대 속도 [m/s] | 속도 프로파일, check_traj |
| `width` | 0.30 | 차폭 [m] | check_traj 벽 충돌 판정 |
| `mass` | 3.518 | 차량 질량 [kg] | 속도 프로파일 |
| `dragcoeff` | 0.0136 | 공기저항 계수 | 속도 프로파일 |
| `curvlim` | 1.5 | 최대 곡률 [rad/m] | IQP `kappa_bound`, check_traj |

**`[GENERAL_OPTIONS]` — stepsize_opts (점 간격)**

| 키 | 값 | 의미 |
|---|---|---|
| `stepsize_prep` | 0.05 | 스플라인 근사 전 선형보간 간격 [m] |
| `stepsize_reg` | 0.2 | 최적화 중 점 간격 (= 법선 개수) [m] |
| `stepsize_interp_after_opt` | 0.1 | 최적화 후 보간 간격 [m] |

**`[OPTIMIZATION_OPTIONS]` — IQP (메인 라인)**

```ini
optim_opts_mincurv = {"width_opt": 0.6,
                      "iqp_iters_min": 20,
                      "iqp_curverror_allowed": 1.0}
```

| 키 | 값 | 의미 |
|---|---|---|
| `width_opt` | 0.6 | **IQP 안전 차폭** (= `w_veh`). `safety_width_iqp` 기본 출처 |
| `iqp_iters_min` | 20 | IQP 최소 반복 횟수 |
| `iqp_curverror_allowed` | 1.0 | 수렴 판정 곡률 오차 [rad/m] |

**`[OPTIMIZATION_OPTIONS]` — SP (보조 라인)**

```ini
optim_opts_shortest_path = {"width_opt": 0.4}
```

`width_opt = 0.4`는 SP 안전 차폭(= `w_veh`)이며 `safety_width_sp`의 기본 출처입니다.

### 파일 입출력

```text
[입력]  maps/<map>/centerline.csv             ← centerline_extractor (가짜벽 폭)
        maps/<map>/boundary_{right,left}.csv  ← centerline_extractor (실제 벽)
        config/CAR/racecar_f110.ini           차량·최적화 파라미터 (튜닝은 여기서)
        config/CAR/veh_dyn_info/ggv.csv
        config/CAR/veh_dyn_info/ax_max_machines.csv

[출력]  maps/<map>/global_waypoints.json      → global_trajectory_publisher (IQP 메인)
        maps/<map>/shortest_path.json          (SP 보조)
```

`global_waypoints.json`은 `readwrite_global_waypoints.read_global_waypoints`가 기대하는 키 구조와 동일하므로, `global_trajectory_publisher`가 수정 없이 읽어 런타임에 재발행합니다.

**노드 생명주기**

```text
centerline_extractor  →  trajectory_optimizer  →  global_trajectory_publisher
  (CSV 생성 후 종료)        (JSON 생성 후 종료)        (런타임 재발행)
```

`trajectory_optimizer`도 1회 실행 후 종료하는 노드입니다. `run()`이 끝나면 `spin_once` 한 번 후 셧다운합니다.

> `enable_mintime`을 켜면 CasADi/IPOPT 기반의 **최소시간(`opt_mintime`)** 최적화도 추가로 돌릴 수 있습니다. 차량 동역학·타이어 모델을 직접 풀어 이론상 가장 빠른 라인을 주지만, 무겁고 별도 파라미터 튜닝이 필요해 기본은 꺼져 있습니다. 자세한 내용은 [Mintime Optimization]({{ site.baseurl }}/posts/mintime-optimization/)을 참고하세요.
{: .prompt-info }
