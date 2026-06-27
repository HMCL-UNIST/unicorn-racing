---
title: "Mintime Optimization: 동역학을 직접 푸는 최소시간 레이스라인"
date: 2026-06-27 10:30:00 +0900
categories: [Software, planning]
tags: [raceline, optimization, mintime, ocp, casadi, ipopt]
lang: ko
lang_ref: mintime-optimization
math: true
---

> `trajectory_optimizer.py` · `enable_mintime`
>
> 차량 동역학과 타이어 모델을 직접 풀어 이론상 가장 빠른 라인을 찾는 선택적 최적화입니다.
{: .prompt-info }

## 설계 목표

- **진짜 랩타임 최소화**: IQP(최소 곡률)와 SP(최단 경로)가 "기하학적으로 좋은 라인"을 근사하는 데 비해, mintime은 **랩타임 자체를 목적함수로** 두고 차량 동역학을 만족하는 최적 라인 + 속도 프로파일을 동시에 찾습니다.
- **선택적·고비용**: CasADi/IPOPT 기반의 비선형 최적제어(OCP)를 풀기 때문에 무겁고 파라미터가 많습니다. 기본은 꺼져 있고(`enable_mintime=False`), 필요할 때만 켭니다.

## 개요 — IQP/SP와 무엇이 다른가

[Global Trajectory Optimization]({{ site.baseurl }}/posts/global-trajectory-optimization/)에서 본 IQP와 SP는 **alpha(법선 변위)** 만을 변수로 두고, "곡률을 줄이자" 또는 "거리를 줄이자"는 기하학적 대리 목표(proxy)를 풉니다. 이 라인이 빠른 이유는 경험적으로 곡률이 작으면 빨리 달릴 수 있기 때문이지, 랩타임을 직접 계산해서가 아닙니다.

mintime은 접근이 근본적으로 다릅니다. 트랙을 따라가는 **시간 최소화 최적제어 문제(OCP)** 를 세우고, 차량의 운동 방정식(상태: 횡위치·heading·속도·슬립 등)과 타이어 마찰 한계(Magic Formula), 액추에이터 동특성을 제약으로 넣어 **"동역학을 어기지 않으면서 가장 빨리 도는 라인과 속도"** 를 한 번에 풉니다.

| | IQP | SP | mintime |
|---|---|---|---|
| 변수 | alpha | alpha | alpha + 속도 + 차량 상태 |
| 목적 | 곡률² 최소 | 거리 최소 | **랩타임 최소** |
| 모델 | 기하 | 기하 | **동역학 + 타이어 + 액추에이터** |
| 풀이 | 반복 QP | 단일 QP | 비선형 OCP (CasADi/IPOPT) |
| 속도 프로파일 | 사후 계산 | 사후 계산 | **최적화에 내장** |
| 비용 | 보통 | 빠름 | **느림 (수십 초~분)** |

## 핵심 아이디어 — 시간 최소화 OCP

mintime은 트랙 위치 $s$를 독립변수로 하는 최적제어 문제를 풉니다. 직관적으로는 "트랙의 각 지점에서 차량이 어떤 상태로, 얼마나 빠르게 지나갈지"를 모두 미지수로 두고, 전체 통과 시간을 최소화합니다.

$$
\min_{\mathbf{u}} \ T = \int_{0}^{s_{\text{end}}} \frac{1}{\dot{s}}\, ds
\quad \text{s.t.} \quad
\begin{cases}
\dot{\mathbf{x}} = f(\mathbf{x}, \mathbf{u}) \\
\mathbf{g}(\mathbf{x}, \mathbf{u}) \le 0
\end{cases}
$$

여기서 $\mathbf{x}$는 차량 상태(횡변위, heading 오차, 속도, 슬립각 등), $\mathbf{u}$는 제어 입력(조향·구동/제동), $f$는 차량 운동 방정식입니다. 타이어 힘은 **Magic Formula(Pacejka)** 로 모델링되어, 종/횡 그립의 결합 한계(마찰원)를 넘지 못하게 제약합니다.

이 문제는 닫힌 해가 없어, CasADi로 이산화한 뒤 IPOPT(내부점 비선형 솔버)로 수치적으로 풉니다. 그래서 무겁습니다.

## 코드 흐름 — `_run_mintime()`

mintime은 `run()` 안에서 `enable_mintime`이 켜져 있을 때만 호출됩니다. **IQP 결과를 기준 트랙으로 받아** 그 위에서 OCP를 풉니다.

```python
if self.enable_mintime and self.pars['optim_opts_mintime']:
    # IQP 결과(reftrack_iqp)를 다시 prep_track으로 정리
    reftrack_mt, normvec_mt, a_mt, coeffs_x_mt, coeffs_y_mt = \
        tph.prep_track.prep_track(reftrack_imp=reftrack_iqp, ...)
    traj_mt, lap_mt = self._run_mintime(
        reftrack_mt, normvec_mt, a_mt, coeffs_x_mt, coeffs_y_mt)
```

### 1) 지연 임포트 (lazy import)

CasADi와 sklearn은 무겁고 mintime에서만 필요하므로, 함수 안에서 그때서야 임포트합니다. 덕분에 mintime을 안 쓰면 이 의존성이 로드되지 않습니다.

```python
def _run_mintime(self, reftrack_interp, normvec_interp, a_interp,
                 coeffs_x_interp, coeffs_y_interp):
    import opt_mintime_traj  # lazy: CasADi + sklearn only needed here
    export_path = os.path.join(self.map_dir, 'mintime_export')
    os.makedirs(export_path, exist_ok=True)
```

### 2) 파라미터 구성

ini의 mintime 관련 섹션들을 모아 `pars_mt`로 넘깁니다. `var_friction`(가변 마찰)과 `warm_start`는 여기서 끕니다.

```python
pars_mt = dict(self.pars)
pars_mt['optim_opts'] = dict(self.pars['optim_opts_mintime'])
pars_mt['optim_opts']['var_friction'] = None
pars_mt['optim_opts']['warm_start'] = False
```

### 3) OCP 풀기

핵심 호출입니다. 트랙·스플라인 계수·법선과 모든 파라미터를 넘기면, **alpha(라인)뿐 아니라 속도 프로파일 `v_opt`까지 함께** 반환합니다. 이게 IQP/SP와 결정적으로 다른 점입니다 — 속도가 사후 계산이 아니라 최적화 안에서 나옵니다.

```python
alpha_opt, v_opt, reftrack_out, a_interp_out, normvec_out = \
    opt_mintime_traj.src.opt_mintime.opt_mintime(
        reftrack=reftrack_interp,
        coeffs_x=coeffs_x_interp, coeffs_y=coeffs_y_interp,
        normvectors=normvec_interp,
        pars=pars_mt,
        export_path=export_path,
        print_debug=True, plot_debug=False,
    )
```

### 4) 속도 프로파일 처리

mintime이 내놓은 `v_opt`를 global line 점들에 보간해 그대로 씁니다(IQP/SP처럼 별도 `calc_vel_profile`을 돌리지 않음). `v_max`로 상한만 클램프합니다.

```python
s_splines = np.insert(np.cumsum(spline_lengths_opt), 0, 0.0)
vx_profile = np.interp(s_points_opt, s_splines[:-1], v_opt)   # OCP가 준 속도
vx_profile = np.minimum(vx_profile, self.pars['veh_params']['v_max'])
```

## 재최적화 옵션 (`reopt_mintime_solution`)

mintime 해는 OCP 이산화 때문에 라인이 약간 거칠 수 있습니다. `reopt_mintime_solution`이 켜져 있으면, mintime 라인을 **다시 최소곡률(`opt_min_curv`)로 한 번 더 다듬는** 후처리를 거칩니다.

```python
if pars_mt['optim_opts'].get('reopt_mintime_solution', False):
    # mintime 라인을 새 기준 트랙으로 만들고
    racetrack_mt = np.column_stack((raceline_mt, w_tr_right_mt, w_tr_left_mt))
    ref_reopt, norm_reopt, a_reopt = tph.prep_track.prep_track(...)
    # 최소곡률로 재최적화
    alpha_opt = tph.opt_min_curv.opt_min_curv(
        reftrack=racetrack_reopt, normvectors=norm_reopt, A=a_reopt,
        kappa_bound=self.pars['veh_params']['curvlim'],
        w_veh=pars_mt['optim_opts']['w_veh_reopt'])[0]
```

이때 `width_opt`는 재최적화용 폭(`w_tr_reopt`, `w_veh_reopt`, `w_add_spl_regr`)으로 보정됩니다. 두 번째 스플라인 회귀로 라인이 살짝 줄어드는 걸 폭으로 보상하는 장치입니다.

## 파라미터 — `config/CAR/racecar_f110.ini`

mintime은 ini에 **세 개의 큰 섹션**을 추가로 사용합니다. 모두 `enable_mintime=True`일 때만 읽힙니다.

### `optim_opts_mintime` — 최적화 동작

```ini
optim_opts_mintime = {"width_opt": 0.8,
                      "penalty_delta": 1.0,
                      "penalty_F": 0.1,
                      "mue": 1.0,
                      "n_gauss": 5,
                      "dn": 0.025,
                      "safe_traj": false, ...}
```

| 키 | 값(CAR) | 의미 |
|---|---|---|
| `width_opt` | 0.8 | mintime 안전 차폭 [m] (`safety_width_mintime`로 override) |
| `penalty_delta` | 1.0 | 조향 변화율 페널티 (제어 부드럽게) |
| `penalty_F` | 0.1 | 구동력 변화율 페널티 |
| `mue` | 1.0 | 마찰계수 (타이어 D 파라미터: $D = F_z \cdot \mu$) |
| `safe_traj` | false | true면 가속도를 추가로 제한 |

### `vehicle_params_mintime` — 차량 동역학

질량 중심·관성·축거 등 OCP가 운동 방정식에 쓰는 물성입니다. (CAR 기준 일부)

| 키 | 값 | 의미 |
|---|---|---|
| `wheelbase_front` / `rear` | 0.15875 / 0.17145 | 앞/뒤 축거 [m] |
| `I_z` | 0.04712 | 요 관성 [kg·m²] |
| `cog_z` | 0.074 | 무게중심 높이 [m] |
| `power_max` | 267 | 최대 출력 [W] |
| `f_drive_max` / `f_brake_max` | 33.4 / 47.4 | 최대 구동/제동력 [N] |
| `delta_max` | 0.34 | 최대 조향각 [rad] |

> 코드는 `wheelbase_front + wheelbase_rear`를 더해 전체 wheelbase를 자동 계산해 넣습니다.
{: .prompt-tip }

### `tire_params_mintime` — 타이어 Magic Formula

Pacejka Magic Formula의 B·C·E 계수들. 타이어 힘-슬립 곡선의 모양을 결정합니다.

| 키 | 값 | 의미 |
|---|---|---|
| `B_front` / `B_rear` | 7.4 / 7.4 | 강성 계수 |
| `C_front` / `C_rear` | 1.2 / 1.2 | 형상 계수 |
| `E_front` / `E_rear` | 0.85 / 0.85 | 곡률 계수 |
| `f_z0` | 8.6 | 공칭 수직력 [N] |

> `pwr_params_mintime`(파워트레인 열 모델)은 `pwr_behavior=false`로 꺼져 있어 기본 흐름에선 쓰이지 않습니다. 모터·배터리·인버터 온도까지 고려하는 고급 옵션입니다.
{: .prompt-info }

## 출력과 검증

mintime 결과도 IQP/SP와 동일한 7열 trajectory(`s, x, y, psi, kappa, vx, ax`)로 조립되어, 같은 `_save_json`으로 저장되고 `check_traj`로 검증됩니다.

```python
self._save_json(traj_mt, traj_sp, lap_mt, ...)
if self.enable_check_traj and bound_r is not None:
    self._run_check('MinTime', traj_mt, bound_r, bound_l, self.safety_width_mintime)
```

로그에는 `[MinTime] Done in ...s, lap≈...s`와 `[CheckTraj MinTime] ...`가 찍힙니다. mintime export 폴더(`maps/<map>/mintime_export/`)에는 OCP 솔버의 디버그 출력이 저장됩니다.

## 언제 켜는가 (실용 가이드)

- **기본 운영**: mintime은 꺼두고 IQP를 메인으로 씁니다. IQP가 충분히 빠르고 안정적이며, 재현·튜닝이 쉽습니다.
- **mintime을 고려할 때**: 차량 동역학·타이어 파라미터가 실차와 잘 맞춰져 있고, 마지막 랩타임을 더 짜내고 싶을 때. 단, 파라미터가 부정확하면 mintime 라인이 오히려 비현실적으로 나올 수 있어 주의가 필요합니다.
- **켜는 법**: launch 파라미터로 `enable_mintime:=true`. 필요하면 `safety_width_mintime`도 함께 지정합니다.

```bash
ros2 run gb_optimizer trajectory_optimizer --ros-args \
    -p map_name:=<map> -p enable_mintime:=true -p safety_width_mintime:=0.7
```

> mintime은 CasADi·IPOPT·sklearn 의존성이 추가로 필요합니다. 환경에 이들이 없으면 lazy import 시점에서 실패하므로, 켜기 전에 설치 여부를 확인하세요.
{: .prompt-warning }
