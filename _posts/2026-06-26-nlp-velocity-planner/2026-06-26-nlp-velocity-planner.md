---
title: "3D Velocity Planner: 라인 고정 후 속도만 NLP로 재최적화"
author: inyoung-choi
date: 2026-06-26 16:30:00 +0900
categories: [Software, planning]
tags: [velocity, optimization, nlp, planning]
lang: ko
lang_ref: nlp-velocity-planner
math: true
---

생성된 global raceline을 기반으로 **속도 프로파일($v_x$, $a_x$)만 다시 NLP로 최적화**하는 모듈입니다. 라인은 고정한 채 속도만 다루므로, 코너별로 가속/감속 특성을 더 세밀하게 조절할 수 있습니다. 코드: [`3d_optimized_vel_planner.py`](https://github.com/Brojoon-10/ICRA2026_HJ/blob/main/stack_master/scripts/3d_optimized_vel_planner.py)

| 구분 | Global Raceline | Velocity Planner |
|---|---|---|
| 결정 대상 | 라인 + 속도 동시 | **속도만** (라인 고정) |
| 입력 | track data, GGV | **이미 생성된 raceline** + GGV |

> 라인과 속도를 동시에 푸는 방법은 [Joint Optimization Racing Line]({{ site.baseurl }}/posts/joint-optimization-racing-line/)을, forward-backward 방식의 속도 계획은 [Velocity Planner]({{ site.baseurl }}/posts/velocity-planner/)를 참고하세요.
{: .prompt-tip }

## 비용 함수

```text
J = ∫[ w_T·(1/s_dot)
      + weight_acc · w_jx_acc · jx_pos²
      + weight_brk · w_jx_brk · jx_neg²
      + w_T · w_ax_corner_acc · ax_corner_term · ax_pos² ] ds
```

Time term뿐만 아니라 **각 코너의 가속도 term을 비용 함수에 포함**해, 코너별로 최적화 속도를 다르게 계산할 수 있도록 만들었습니다.

| 파라미터 | 효과 |
|---|---|
| `w_jx_acc` / `w_jx_brk` | 가속 vs 브레이크 **비대칭** (액추에이터 특성 반영) |
| $\alpha \cdot \tanh(\lvert\Omega_z\rvert / k_\alpha)$ | **곡률 절대값** 의존 — 코너에서 jerk 가중 강화 |
| $\beta \cdot \tanh(\lvert d\Omega_z/ds\rvert / k_\beta)$ | **곡률 변화율** 의존 — 코너 진입/탈출 transition 강화 |
| `w_ax_corner` | jerk=0이지만 ax 일정한 **정상상태 가속** 잡기 |

- 가속과 브레이크에 서로 다른 jerk 가중치를 주어, 실제 구동계/제동계의 비대칭 특성을 반영합니다.
- 곡률 절대값($\lvert\Omega_z\rvert$)과 곡률 변화율($\lvert d\Omega_z/ds\rvert$)에 따라 jerk 가중을 $\tanh$로 부드럽게 키워, 직선에서는 자유롭게, 코너와 그 전이 구간에서는 더 보수적으로 속도를 변화시킵니다.
- `w_ax_corner` 항은 jerk가 0인(=가속도 변화가 없는) 정상상태에서도 코너의 일정 가속을 비용으로 잡아, 코너별 정상상태 속도를 조절합니다.

## 마무리

3D Velocity Planner는 이미 최적화된 raceline의 **속도 프로파일만** NLP로 다시 다듬어, 코너별 가속/감속 특성과 액추에이터 비대칭까지 반영합니다. 라인 최적화(joint optimization)와 분리되어 있어, 같은 라인 위에서 속도 거동만 빠르게 재튜닝할 수 있는 것이 장점입니다.
