---
title: "Gaussian Process를 활용한 상대 차량 궤적 예측"
date: 2026-06-26 13:00:00 +0900
categories: [Software, prediction]
tags: [prediction, gaussian-process, frenet, overtaking]
image:
  path: /assets/img/posts/gp-opponent-prediction/overview.png
lang: ko
lang_ref: gp-opponent-prediction
math: true
---

`gp_traj_predictor`는 tracking에서 검출한 상대 차량의 움직임을 이용해 **상대 차량의 주행 라인을 학습하고, planner가 사용할 수 있는 미래 obstacle prediction을 생성**합니다.

![상대 차량 모션 예측](/assets/img/posts/gp-opponent-prediction/overview.png)
*ego 차량이 상대 차량을 인지하고 미래 궤적을 예측*

## 핵심 아이디어

상대 차량의 위치를 **Frenet 좌표계**에서 다루는 것이 핵심입니다. $s$는 트랙을 따라 진행한 거리, $d$는 기준선으로부터의 횡방향 거리입니다. 상대 차량의 관측값을 $(s, d, v_s, v_d)$ 형태로 모은 뒤, **Gaussian Process Regression(GPR)**을 사용해 $s$ 위치에 따른 상대 차량의 라인과 속도를 추정합니다.

$$
d = f(s) + \epsilon
$$

GP는 평균 예측값뿐 아니라 **예측 불확실성**도 제공합니다. 그 값을 `d_var`, `vs_var`로 메시지에 포함하고, RViz marker의 크기와 색으로도 일부 시각화합니다.

## 전체 구조

```text
/tracking/obstacles
/car_state/odom_frenet
/global_waypoints
        |
        v
opponent_trajectory.py
        |  publishes /proj_opponent_trajectory
        v
gaussian_process_opp_traj.py
        |  publishes /opponent_trajectory
        v
opp_prediction.py
        |  publishes /opponent_prediction/obstacles
        |  publishes /opponent_prediction/obstacles_pred
        |  publishes /opponent_prediction/force_trailing
        v
planner / state machine
```

| 파일 | 역할 |
|---|---|
| `opponent_trajectory.py` | tracking obstacle에서 상대 차량을 선택하고 Frenet 관측 history 생성 |
| `gaussian_process_opp_traj.py` | 관측 history를 GP/CCMA로 보간해 상대 차량의 전체 trajectory 생성 |
| `predictor_opponent_trajectory.py` | 상대가 기존 trajectory에서 벗어났을 때 복귀 궤적을 보조 예측 |
| `opp_prediction.py` | 학습된 trajectory를 planner용 미래 obstacle sequence로 변환 |
| `dynamic_prediction_server.py` | Dynamic parameter node |
| `prediction_node.py` | 공통 ROS 2 helper 제공 |

## 1. 상대 차량 관측 수집

`opponent_trajectory.py`는 `/tracking/obstacles`에서 동적 obstacle을 찾고, ego 차량 기준으로 가장 가까운 상대를 선택합니다. ego 차량의 Frenet 상태는 `/car_state/odom_frenet`에서, track 길이와 waypoint 정보는 `/global_waypoints`에서 가져옵니다.

관측된 obstacle은 `ProjOppPoint`로 변환됩니다. 주요 필드는 다음과 같습니다.

```text
s, d       : 상대 차량의 Frenet 위치
vs, vd     : Frenet 방향 속도
time       : 관측 timestamp
s_var 등   : tracking에서 전달된 uncertainty
```

이 단계의 출력은 아직 완성된 상대 trajectory가 아니라, 실제 관측을 track 위에 정리한 raw/projection history에 가깝습니다.

## 2. GP 기반 상대 trajectory 생성

`gaussian_process_opp_traj.py`는 `/proj_opponent_trajectory`를 받아 상대 차량의 전체 주행 trajectory를 만들고 `/opponent_trajectory`로 발행합니다. 이 노드는 주로 두 가지 매핑을 추정합니다.

```text
s -> d
s -> vs
```

초기에는 상대 차량의 전체 lap 데이터가 없으므로 **half lap 단위**로 관측된 구간만 업데이트하고, 한 바퀴 이상 관측이 쌓이면 whole lap trajectory를 생성합니다. 속도 방향 성분 $v_s$는 GP로 추정하고, $v_d$는 interpolation으로 계산합니다. 시작선 근처에서는 $s=0$과 $s=\text{track\_length}$가 끊기는 문제가 있으므로, 리스트 앞뒤에 몇 미터 구간을 복제해 **wrap-around**를 처리합니다.

출력 메시지 `OpponentTrajectory`에는 `OppWpnt` 배열이 들어가며, 이는 상대 차량이 track 위에서 반복적으로 달릴 라인을 표현합니다.

![GP 기반 상대 trajectory 생성](/assets/img/posts/gp-opponent-prediction/gp-trajectory.gif)
*관측이 쌓이며 GP가 상대 차량의 주행 라인을 추정*

## 3. Trajectory 이탈 시 복귀 예측

`predictor_opponent_trajectory.py`는 상대 차량이 기존 `/opponent_trajectory`에서 벗어난 경우를 위한 보조 노드입니다. `opponent_trajectory.py`는 현재 관측이 기존 예측 trajectory의 $d$와 **0.3 m 이상** 차이 나는지 확인하고, 이런 상태가 여러 번 이어지면 `/proj_opponent_trajectory`의 `opp_is_on_trajectory`를 `False`로 발행합니다.

이때 보조 노드는 다음 데이터를 섞어 새 trajectory 일부를 만듭니다.

- 최근 상대 차량 detection 몇 개
- 기존 `/opponent_trajectory`의 앞쪽 waypoint 일부

즉, 상대가 기존 라인에서 벗어났더라도 무한히 직진한다고 보지 않고, **일정 거리 뒤에는 기존 racing line으로 복귀**한다고 가정합니다. 이 구간의 $d$를 GP로 예측한 뒤 `/opponent_trajectory`를 다시 publish합니다.

## 4. planner용 미래 obstacle prediction

`opp_prediction.py`(노드 이름 `/opponent_propagation_predictor`)는 학습된 `/opponent_trajectory`를 planner가 바로 사용할 수 있는 **미래 obstacle sequence**로 변환합니다.

상대가 학습된 trajectory 위에 있다고 판단되면, 현재 상대 위치에서 시작해 `time_steps`만큼 앞으로 진행합니다. 각 step마다 `/opponent_trajectory`에서 현재 $s$에 가까운 waypoint를 찾고, 해당 waypoint의 `proj_vs_mps`와 `d_m`을 사용해 미래 obstacle을 만듭니다.

상대가 학습된 trajectory에서 크게 벗어났거나, 아직 lap count가 1보다 작아 충분히 학습되지 않은 경우에는 더 **보수적으로** 동작합니다. 이 경우 현재 상대 $d$에서 centerline 쪽으로 점진적으로 보간한 prediction을 만들고, `/opponent_prediction/force_trailing`을 `True`로 publish합니다.

![planner용 미래 obstacle prediction](/assets/img/posts/gp-opponent-prediction/gp-prediction.gif)
*학습된 trajectory에서 미래 obstacle sequence를 생성*

## 마무리

GP 기반 상대 궤적 예측은 (1) 상대 관측 수집 → (2) GP로 전체 trajectory 학습 → (3) 이탈 시 복귀 예측 → (4) planner용 미래 obstacle 변환의 단계로 동작합니다. Frenet 좌표계와 GP를 결합해 상대 차량의 반복적인 racing line을 학습하고, 불확실성까지 함께 제공함으로써 overtaking 계획에 활용할 수 있는 예측을 생성합니다.
