---
title: Cartographer를 활용한 Pure Localization 가이드
author: hangyo-cho
date: 2026-02-03 10:00:00 +0900
categories: [Software, state estimation]
tags: [Localization, cartographer, imu, lidar, odometry]
image:
  path: /assets/img/posts/cartographer-localization/cartographer-localization-flow.png
lang: ko
lang_ref: cartographer-localization
---

## Cartographer Localization

### 핵심 개념

**Cartographer Pure Localization**은 사전에 구축된 맵(.pbstream)을 기반으로 **위치 추정만 수행**하고 **새로운 맵을 생성하지 않는** 모드입니다.

### 주요 특징

| 특징 | 설명 |
|------|------|
| **Map-based** | 사전 구축된 고품질 맵 사용 |
| **Real-time** | 40Hz 이상의 고빈도 위치 추정 |
| **Memory Efficient** | 메모리 사용량 일정 (최대 3개 submaps) |
| **Stable** | 최적화된 맵 사용으로 일관된 성능 |
| **Initial Pose Required** | 초기 위치 설정 필수 |

### 기본 동작 원리

```
┌─────────────────────────────────────────────────────┐
│ Input: Prior Map (.pbstream)                        │
├─────────────────────────────────────────────────────┤
│  🗺️ Frozen Submaps (사전 구축된 맵, 수정 안됨)           │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Sensor Data Input                                   │
├─────────────────────────────────────────────────────┤
│  📡 LiDAR Scan  +  🧭 IMU  +  🚗 Wheel Odometry     │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Local SLAM (Real-time Tracking)                     │
├─────────────────────────────────────────────────────┤
│  - Pose Extrapolation (IMU + Odom 예측)              │
│  - Scan Matching (Local submaps만 사용)              │
│  - Local Submap 생성 (최대 3개만 유지) ← Trimmer        │
│  → 빠른 tracking (40+ Hz)                            │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Global SLAM (Pose Graph Optimization)               │
├─────────────────────────────────────────────────────┤
│  - Prior Map과의 Constraint 생성                      │
│  - Pose Graph Optimization (전역 최적화)              │
│  → Drift 보정 (주기적, 2 nodes마다)                    │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│ Output                                                    │
├───────────────────────────────────────────────────────────┤
│  📍 /tracked_pose (PoseStamped)                           │
│  📊 /base_link_pose_with_cov (PoseWithCovarianceStamped)  │
└───────────────────────────────────────────────────────────┘
```

### SLAM vs Pure Localization

| 특성 | SLAM (Mapping) | Pure Localization |
|------|----------------|-------------------|
| 맵 생성 | ✅ 새로운 맵 생성 | ❌ 기존 맵 사용 |
| Submap 추가 | ✅ 계속 추가 | ❌ 최대 3개만 유지 (Trimmer) |
| 메모리 사용량 | 증가 (시간에 비례) | 일정 |
| 초기 위치 설정 | 불필요 | **필수** |
| PGO 주기 | 20 nodes마다 | 2 nodes마다 (더 빈번) |

### Pure Localization Trimmer

```
시간 흐름 →

[Prior Map Submaps: S0, S1, S2, ..., S_n] (Frozen)
                                            ↓
[Local SLAM Submaps: L0, L1, L2] ← 최대 3개만 유지
                     ↑   ↑   ↑
                   삭제 유지 유지
```

**핵심**:
- Prior map의 submaps는 **고정(frozen)** 되어 최적화 대상이 아닙니다
- Local SLAM이 생성하는 submaps는 **rolling window** 방식으로 최근 3개만 유지됩니다
- 메모리 사용량을 **일정하게 제한**합니다

```lua
TRAJECTORY_BUILDER.pure_localization_trimmer = {
  max_submaps_to_keep = 3,  -- 이것이 핵심!
}
```

---

## Modified Cartographer (Localization)

UNICORN racing 팀은 **레이싱 환경**에 최적화하기 위해 Cartographer Localization을 수정했습니다.

### 수정 사항 #1: PoseWithCovarianceStamped Publisher

#### 배경 문제

- **원래 Cartographer**:
  - `/tracked_pose` (PoseStamped)만 발행
  - **Covariance 정보 없음**
  - Downstream 모듈이 위치 불확실성 파악 불가

- **레이싱 요구사항**:
  - Planning & Control이 **위치 신뢰도**를 알아야 합니다
  - 불확실성 높을 때 → 보수적 주행
  - 불확실성 낮을 때 → 공격적 주행

#### 해결 방법

**PoseWithCovarianceStamped를 추가로 발행**합니다.

`node.cc:122-124`:
```cpp
published_pose_publisher_ =
    node_handle_.advertise<::geometry_msgs::PoseWithCovarianceStamped>(
        "base_link_pose_with_cov", kLatestOnlyPublisherQueueSize);
```

`node.cc:329-341`:
```cpp
::geometry_msgs::PoseWithCovarianceStamped pose_cov_msg;
pose_cov_msg.header.frame_id = node_options_.map_frame;
pose_cov_msg.header.stamp = stamped_transform.header.stamp;
pose_cov_msg.pose.pose = ToGeometryMsgPose(tracking_to_map * (*trajectory_data.published_to_tracking));
pose_cov_msg.pose.covariance = {{
    0.001, 0,     0,     0,       0,       0,
    0,     0.001, 0,     0,       0,       0,
    0,     0,     0.001, 0,       0,       0,
    0,     0,     0,     0.0001,  0,       0,
    0,     0,     0,     0,       0.0001,  0,
    0,     0,     0,     0,       0,       0.0001
}};
published_pose_publisher_.publish(pose_cov_msg);
```

**Covariance Matrix**:
- Position (x, y, z): 0.001 m² (σ ≈ 3.2 cm)
- Orientation (roll, pitch, yaw): 0.0001 rad² (σ ≈ 0.01 rad ≈ 0.57°)

**효과**:
- Planning 모듈이 위치 신뢰도 기반으로 전략 조정 가능
- Kalman Filter 등 센서 융합 가능
- 표준 ROS Navigation Stack과 호환

### 수정 사항 #2: Adaptive Wheel Odometry

#### 배경 문제

저마찰 조건 (예: 타이어 마모, 대리석 바닥, 흙먼지)에서:
- **Wheel slip ⬆️**
- **Wheel odometry ≠ Actual velocity**
- Pose extrapolation 부정확
- Scan matching 초기 guess 저하
- **결과**: Localization 성능 저하

#### 해결 방법

**Adaptive Wheel Odometry**: LiDAR 기반 실시간 odometry 보정을 적용합니다.

> 상세 내용은 [Adaptive Wheel Odometry 가이드]({{ site.baseurl }}/posts/adaptive-wheel-odometry/)를 참고하세요.
{: .prompt-info }

**핵심 아이디어**:
- Scan matching 결과와 wheel odometry 비교
- Slip 감지 시 동적으로 odometry scaling factor 조정
- 보정된 odometry로 pose extrapolation 개선

**효과**:
- 저마찰 환경에서도 안정적인 localization
- Scan matching 수렴 속도 향상
- 전반적인 tracking 성능 개선

### 수정 사항 #3: Dynamic Initial Pose Setting

#### 배경 문제

- **Pure Localization 특성**:
  - 초기 위치 설정 **필수**
  - 잘못된 초기 위치 → Localization 실패

- **레이싱 시나리오**:
  - 차량을 다른 위치에서 시작할 수 있음
  - 매번 launch file 수정은 비효율적

#### 해결 방법

**RViz 기반 동적 Initial Pose 설정**을 구현했습니다.

`set_pose_v2_node.py`:

1. **RViz "2D Pose Estimate" 툴 대기**
```python
rospy.Subscriber('initialpose', PoseWithCovarianceStamped, self.update_initial_pose)
```

2. **현재 Trajectory 종료**
```python
rosservice call /finish_trajectory {trajectory_id}
```

3. **새 Trajectory 시작 (Initial Pose 포함)**
```python
rosservice call /start_trajectory "{
    configuration_directory: ...,
    configuration_basename: 'localization.lua',
    use_initial_pose: true,
    initial_pose: {position: {x, y, z}, orientation: {x, y, z, w}},
    relative_to_trajectory_id: 0  # Prior map trajectory
}"
```

**사용법**:
1. Localization 실행
2. RViz에서 "2D Pose Estimate" 클릭
3. 맵 위에서 현재 위치 클릭 & 드래그 (방향 설정)
4. 자동으로 새 trajectory 시작

**효과**:
- Runtime에 언제든지 재초기화 가능
- Localization 실패 시 빠른 복구
- 다양한 시작 위치 지원

### Localization 전용 튜닝

`localization.lua`:

```lua
-- PGO 빈번하게 (mapping: 20, localization: 2)
POSE_GRAPH.optimize_every_n_nodes = 2

-- Rotation weight 감소 (고속 주행 시 회전 변화 크지 않음)
TRAJECTORY_BUILDER_2D.ceres_scan_matcher.rotation_weight = 0.1

-- Scan 누적 (노이즈 감소)
TRAJECTORY_BUILDER_2D.num_accumulated_range_data = 10

-- Loop closure 범위
POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher.linear_search_window = 1.0  -- 1m
POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher.angular_search_window = math.rad(20.)  -- 20°

-- Global localization 비활성화 (초기 위치 필수이므로)
POSE_GRAPH.global_sampling_ratio = 0.000
```

> 고품질 맵 생성에 대한 자세한 내용은 Cartographer Mapping 가이드를 참조하세요.
{: .prompt-tip }

---

## Localization 가이드

### 사전 준비

**필수 요구사항**:

1. **Prior Map** 준비
   - 위치: `UNICORN/stack_master/maps/{map_name}/`
   - 파일:
     - `{map_name}.pbstream` (Cartographer state)
     - `{map_name}.png` (시각화)
     - `{map_name}.yaml` (메타데이터)

2. **센서 정상 동작**
```bash
rostopic hz /scan        # LiDAR
rostopic hz /imu/data    # IMU
rostopic hz /vesc/odom   # Wheel odometry
```

3. **맵 품질 확인**
   - Loop closure가 잘 된 일관된 맵
   - 드리프트가 적은 맵

### 실행

#### Method 1: 실제 차량에서 실행

```bash
# Localization 실행
roslaunch stack_master base_system.launch \
  map:={map_name}
```

#### Method 2: Bag 파일로 테스트

```bash
# 사전에 rosbag을 녹화한 경우:
rosbag play ~~~.bag --clock

roslaunch stack_master bag_localization.launch \
  map:={map_name}
```

### Initial Pose 설정

> Pure Localization은 초기 위치 설정이 **필수**입니다.
{: .prompt-warning }

1. **RViz 확인**
   - Launch 후 RViz 자동 실행
   - Prior map이 표시됩니다

2. **"2D Pose Estimate" 사용**
   - RViz 상단 툴바에서 클릭
   - 맵 위에서 차량의 **현재 실제 위치** 클릭
   - 드래그하여 **방향** 설정

3. **수렴 확인**
   - LiDAR scan이 맵과 정렬되는지 확인
   - 몇 초 내에 정확히 매칭되어야 합니다

---

## 마무리

이 글에서는 Cartographer Pure Localization의 핵심 개념과 UNICORN racing 팀이 레이싱 환경에 맞게 수정한 사항들을 다뤘습니다.

주요 수정 사항을 요약하면:
- **PoseWithCovarianceStamped Publisher**: 위치 불확실성 정보 제공
- **Adaptive Wheel Odometry**: 저마찰 환경에서의 안정적인 localization
- **Dynamic Initial Pose Setting**: RViz를 통한 런타임 초기 위치 설정

Pure Localization을 사용할 때는 반드시 **고품질의 Prior Map**을 준비하고, **초기 위치를 정확하게 설정**해야 합니다. 이 두 가지가 localization 성능에 가장 큰 영향을 미칩니다.
