---
title: base_link 기준 센서 TF 설정 가이드
author: hangyo-cho
date: 2026-02-02 12:00:00 +0900
categories: [build, beginner]
tags: [TF, cartographer, imu, lidar, vesc]
image:
  path: /assets/img/posts/base-link-sensor-tf/overview.png
lang: ko
lang_ref: base-link-sensor-tf
---

## 들어가며

로봇을 개발하다 보면 가장 먼저 마주치는 문제 중 하나가 바로 센서 좌표계 설정입니다. LiDAR, IMU, 카메라 등 여러 센서의 데이터를 융합하려면 각 센서가 로봇의 어느 위치에 장착되어 있는지 정확히 알려줘야 합니다.

이 글에서는 Roboracer 플랫폼(SRX1 차량)에서 ROS의 TF(Transform) 시스템을 활용해 센서 좌표계를 설정하는 방법을 다룹니다.

## TF(Transform)란?

ROS에서 TF는 서로 다른 좌표계(coordinate frame) 간의 변환 관계를 관리하는 시스템입니다.

예를 들어:

- 로봇의 중심(`base_link`)에서 LiDAR까지 30cm 떨어져 있다
- IMU는 로봇 중심에서 왼쪽으로 6cm 이동한 곳에 있다

이런 공간적 관계를 정의하고 관리하는 게 TF의 역할입니다.

### TF가 왜 필요한가?

센서마다 자기만의 좌표계로 데이터를 발행합니다:

- LiDAR는 `laser` 프레임 기준으로 장애물 거리를 측정합니다.
- IMU는 `imu` 프레임 기준으로 가속도/각속도를 측정합니다.
- 카메라는 `camera_link` 프레임 기준으로 이미지를 촬영합니다.

이 데이터들을 융합하려면 공통 좌표계로 변환해야 하는데, 이때 TF가 각 센서의 위치/방향 정보를 제공합니다.

## UNICORN SRX1의 TF 구조

### Frame 계층 구조

```text
map
 └─ odom (또는 carto_odom)
     └─ base_link ← 로봇의 중심 좌표계
         ├─ imu (Microstrain IMU)
         │   └─ imu_rot (회전 보정)
         ├─ laser (Hokuyo LiDAR)
         ├─ vesc_imu (VESC 내장 IMU)
         │   └─ vesc_imu_rot
         └─ chassis (차체)
             └─ zed_camera_link (ZED 카메라)
                 ├─ camera_link (좌측 렌즈)
                 └─ zed_camera_right_link (우측 렌즈)
```

### 주요 Frame 설명

| Frame | 설명 | 부모 Frame |
| --- | --- | --- |
| map | 전역 고정 좌표계 (SLAM 맵) | - |
| odom | Odometry 좌표계 (drift 있음) | map |
| base_link | 로봇 중심 (후륜축 중앙, 지면) | odom |
| imu | IMU 센서 위치 | base_link |
| laser | LiDAR 센서 위치 | base_link |
| vesc_imu | VESC 모터 컨트롤러 IMU | base_link |
| chassis | 차체 (base_link보다 5cm 위) | base_link |
| zed_camera_link | ZED 스테레오 카메라 | chassis |

## 좌표계 Convention (규칙)

로봇 공학에서는 여러 좌표계 규칙이 사용됩니다. UNICORN은 ROS 표준(REP-105)을 따릅니다.

### base_link: FLU (Forward-Left-Up)

- X축: 전방 (차량이 나아가는 방향)
- Y축: 좌측 (운전자 기준 왼쪽)
- Z축: 상방 (하늘 방향)

![base_link FLU 축 방향](/assets/img/posts/base-link-sensor-tf/base-link-flu.png)

### map/odom: ENU (East-North-Up)

- X축: 동쪽
- Y축: 북쪽
- Z축: 상방

### 왜 다른 규칙을 사용하나?

- base_link는 로봇 중심 좌표계이므로 로봇의 움직임 기준이 됩니다.
- map/odom은 세계 좌표계이므로 지도 기준으로 표현됩니다.

센서 데이터는 로봇 중심으로 처리하고, 최종 위치는 지도 좌표계로 표현하는 게 자연스럽기 때문입니다.

## SRX1 센서 배치

실제 SRX1 차량의 센서들이 어디에 장착되어 있는지 살펴봅니다.

### 센서 위치 (base_link 기준)

| 센서 | X (m) | Y (m) | Z (m) | 설명 |
| --- | --- | --- | --- | --- |
| IMU | 0.085 | 0.06 | 0.065 | 차량 전방, 좌측으로 치우침 |
| LiDAR | 0.270 | 0.0 | 0.127 | 차량 중앙선, 전방 |
| VESC IMU | 0.10 | 0.0 | 0.127 | VESC 모터 컨트롤러 내장 |
| ZED Camera | 0.390 | 0.0 | 0.09 | 가장 전방, 중앙 |

```text
Front
        ↑
    [LiDAR]  (0.27, 0, 0.127)
        |
     [IMU]   (0.085, 0.06, 0.065) ← 6cm 왼쪽
        |
    [VESC]   (0.10, 0, 0.127)
        |
    base_link (0, 0, 0)
```

### 센서 배치 특징

SRX1의 Microstrain IMU는 차량 구조상 중앙에 장착하기 어려워 좌측으로 6cm 이동한 위치에 장착되어 있습니다. 이런 오프셋이 있어도 TF 시스템이 자동으로 보정해줍니다.

## TF 설정 파일

SRX1의 센서 TF는 다음 파일에 정의되어 있습니다.

```text
UNICORN/stack_master/config/SRX1/devices/static_transforms.launch.xml
```

### 파일 내용 살펴보기

```xml
<!-- -*- mode: XML -*- -->
<launch>
   <!-- TFs -->
  <arg name="pub_map_to_odom" default="False"/>

  <!-- 1. IMU Transform -->
  <node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_imu"
        args="0.085 0.06 0.065 0.0 1.0 0.0 0.0 base_link imu" />

  <node pkg="tf2_ros" type="static_transform_publisher" name="imu_to_imu_rot"
        args="0.0 0.0 0.0 0.0 1.0 0.0 0.0 imu imu_rot" />

  <!-- 2. LiDAR Transform -->
  <node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_laser"
        args="0.270 0.0 0.127 0.0 0.0 0.0 1.0 base_link laser" />

  <!-- 3. VESC IMU Transform -->
  <node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_vesc_imu"
        args="0.10 0.0 0.127 0.0 0.0 -0.7071 0.7071 base_link vesc_imu" />

  <node pkg="tf2_ros" type="static_transform_publisher" name="vesc_imu_to_vesc_imu_rot"
        args="0.0 0.0 0.0 0.0 0.0 0.7071 0.7071 vesc_imu vesc_imu_rot" />

  <!-- 4. Map to Odom (선택적) -->
  <group if="$(arg pub_map_to_odom)">
    <node pkg="tf" type="static_transform_publisher" name="map_to_odom"
          args="0 0 0 0 0 0 map odom 10" />
  </group>
</launch>
```

## TF 파라미터 해석하기

### static_transform_publisher의 args 형식

```text
args="x y z qx qy qz qw parent_frame child_frame"
```

- x, y, z: 위치 (단위: 미터)
- qx, qy, qz, qw: 회전 (Quaternion 형식)
- parent_frame: 부모 좌표계
- child_frame: 자식 좌표계

### 예제 1: LiDAR Transform

```text
args="0.270 0.0 0.127 0.0 0.0 0.0 1.0 base_link laser"
```

- 전방으로 27cm
- 좌우 중앙 (0)
- 위로 12.7cm
- 회전: (0, 0, 0, 1) = 회전 없음 (identity)
- `base_link`에서 `laser`로의 변환

LiDAR는 로봇 중심에서 전방 27cm, 높이 12.7cm에 있으며, `base_link`와 같은 방향을 보고 있다는 것을 의미합니다.

### 예제 2: IMU Transform

```text
args="0.085 0.06 0.065 0.0 1.0 0.0 0.0 base_link imu"
```

- 전방 8.5cm
- 좌측 6cm
- 위로 6.5cm
- 회전: (0, 1, 0, 0) = 180도 pitch 회전
- `base_link`에서 `imu`로의 변환

IMU는 좌측으로 치우쳐 있고, 물리적으로 뒤집혀(180도 회전) 장착되어 있다는 것을 의미합니다.

```text
Normal:    Flipped (180° pitch):
  ↑ Z         Z  ↓
  |              |
  o--→ X    X ←--o
```

## Quaternion 회전 이해하기

### Quaternion이란?

3D 회전을 표현하는 방법 중 하나입니다. 4개의 숫자(qx, qy, qz, qw)로 회전을 나타냅니다.

### 자주 사용되는 회전

| 회전 | Quaternion (qx, qy, qz, qw) | 설명 |
| --- | --- | --- |
| 회전 없음 | (0, 0, 0, 1) | Identity |
| Z축 90도 | (0, 0, 0.7071, 0.7071) | 좌회전 |
| Z축 -90도 | (0, 0, -0.7071, 0.7071) | 우회전 |
| Y축 180도 | (0, 1, 0, 0) | 뒤집힘 |
| X축 90도 | (0.7071, 0, 0, 0.7071) | 좌측 기울임 |

### 왜 IMU는 180도 회전하나?

IMU 센서가 물리적으로 거꾸로 장착되어 있기 때문입니다. 하지만 소프트웨어에서 TF로 보정해주면 데이터는 정상적으로 사용할 수 있습니다.

### imu_rot은 왜 필요한가?

`imu_rot`는 Cartographer(SLAM 알고리즘)의 `tracking_frame`으로 사용됩니다. IMU를 한 번 더 180도 회전시켜 원래 방향으로 돌려놓는 역할입니다.

```xml
<node pkg="tf2_ros" type="static_transform_publisher" name="imu_to_imu_rot"
      args="0.0 0.0 0.0 0.0 1.0 0.0 0.0 imu imu_rot" />
```

```text
base_link --[180° pitch]--> imu --[180° pitch]--> imu_rot
```

결과적으로 `imu_rot`는 `base_link`와 같은 방향이 되지만, 중간에 `imu` frame을 거치게 됩니다.

## VESC IMU의 회전

```text
<!-- VESC IMU: Z축 -90도 회전 -->
args="0.10 0.0 0.127 0.0 0.0 -0.7071 0.7071 base_link vesc_imu"

<!-- VESC IMU Rotation: Z축 +90도 회전 -->
args="0.0 0.0 0.0 0.0 0.0 0.7071 0.7071 vesc_imu vesc_imu_rot"
```

### 왜 두 번 회전하나?

VESC 모터 컨트롤러에 내장된 IMU는 PCB 보드의 방향에 따라 Z축으로 90도 틀어져 있습니다.

- `vesc_imu`: 물리적 마운트 방향 (-90도)
- `vesc_imu_rot`: 소프트웨어 보정 (+90도)

```text
base_link: X→ Y↑     vesc_imu: X↑ Y←     vesc_imu_rot: X→ Y↑
```

최종적으로 `vesc_imu_rot`는 `base_link`와 같은 방향이 됩니다.

## TF 설정 로드 과정

### Launch 파일 호출 순서

```text
base_system.launch
    └─ middle_level.launch
        └─ low_level.launch  ← 여기서 TF 로드!
            ├─ LiDAR 드라이버
            ├─ IMU 드라이버
            ├─ VESC 드라이버
            └─ static_transforms.launch.xml  ← TF 설정
```

### low_level.launch 내용

```xml
<!-- UNICORN/stack_master/launch/low_level.launch -->
<launch>
  <arg name="racecar_version" default="$(env CAR_NAME)" />

  <!-- LiDAR -->
  <node pkg="urg_node" type="urg_node" name="laser_node">
    <rosparam file="$(find stack_master)/config/$(arg racecar_version)/devices/lidar.yaml" />
  </node>

  <!-- IMU -->
  <node name="microstrain_inertial_driver" pkg="microstrain_inertial_driver"
        type="microstrain_inertial_driver_node">
    <rosparam file="$(find stack_master)/config/$(arg racecar_version)/devices/imu.yaml" />
  </node>

  <!-- VESC -->
  <group ns="vesc">
    <include file="$(find stack_master)/launch/vesc.launch">
      <arg name="racecar_version" value="$(arg racecar_version)" />
    </include>
  </group>

  <!-- ★ Static TF 로드 ★ -->
  <include file="$(find stack_master)/config/$(arg racecar_version)/devices/static_transforms.launch.xml"/>

  <!-- 기타 노드들 -->
  <node pkg="stack_master" type="relay_node.py" name="relay_node" />
  <node pkg="joy" type="joy_node" name="joy_node" />
</launch>
```

### 환경변수 CAR_NAME의 중요성

이 환경변수가 설정되어 있어야 올바른 차량의 TF 파일이 로드됩니다.

```bash
export CAR_NAME=SRX1
```

```text
$(find stack_master)/config/$(arg racecar_version)/devices/static_transforms.launch.xml
→ UNICORN/stack_master/config/SRX1/devices/static_transforms.launch.xml
```

잘못된 CAR_NAME을 사용하면 다음 문제가 발생합니다.

- 다른 차량의 센서 위치 정보가 로드됩니다.
- 센서 융합이 부정확해집니다.
- SLAM 성능이 저하됩니다.

## TF 확인하기

### 1. TF Tree 시각화

```bash
# ROS 실행 후
rosrun tf view_frames

# PDF 파일 생성됨
evince frames.pdf
```

출력 예시:

```text
map
 └─ odom
     └─ base_link
         ├─ imu
         │   └─ imu_rot
         ├─ laser
         └─ vesc_imu
             └─ vesc_imu_rot
```

### 2. 특정 Transform 확인

```bash
# LiDAR와 base_link 사이의 transform
rosrun tf tf_echo base_link laser

# 출력:
# At time 1234.567
# - Translation: [0.270, 0.000, 0.127]
# - Rotation: in Quaternion [0.000, 0.000, 0.000, 1.000]
#            in RPY (radian) [0.000, 0.000, 0.000]
#            in RPY (degree) [0.000, 0.000, 0.000]
```

```bash
# IMU와 base_link 사이의 transform
rosrun tf tf_echo base_link imu

# 출력:
# - Translation: [0.085, 0.060, 0.065]
# - Rotation: in Quaternion [0.000, 1.000, 0.000, 0.000]
#            in RPY (degree) [0.000, 180.000, 0.000]  ← 180도 pitch
```

### 3. Static TF 확인

```bash
rostopic echo /tf_static -n 20
```

모든 static transform이 발행되는지 확인할 수 있습니다.

### 4. RViz로 시각화

```bash
rosrun rviz rviz
```

RViz 설정:

- Fixed Frame을 `base_link`로 설정합니다.
- Add → TF를 선택합니다.
- Show Names를 체크해 frame 이름을 표시합니다.
- Show Axes를 체크해 좌표축을 표시합니다.
- Show Arrows를 체크해 부모-자식 관계 화살표를 표시합니다.

보이는 것:

- 빨간 화살표: X축 (전방)
- 초록 화살표: Y축 (좌측)
- 파란 화살표: Z축 (위)

각 센서의 위치와 방향을 직관적으로 확인할 수 있습니다.

## 센서 TF 수정하기

### 언제 TF를 수정하나?

- 센서 위치 변경: 물리적으로 센서를 다른 곳에 장착
- 센서 추가: 새로운 센서 장착
- 캘리브레이션: 더 정확한 위치 측정 후 업데이트

### 수정 절차

#### 1. 물리적 위치 측정

센서의 정확한 위치를 측정합니다.

측정 팁:

- 줄자로 cm 단위까지 측정합니다.
- X축은 차량 전방(보통 +값)입니다.
- Y축은 좌측이 +, 우측이 -입니다.
- Z축은 지면에서 센서까지의 높이입니다.

```text
기준점: base_link (후륜축 중앙, 지면)

측정 항목:
- X: 전방 거리 (m)
- Y: 좌우 거리 (m, 좌측이 +)
- Z: 높이 (m)
- 회전: roll, pitch, yaw (도 또는 라디안)
```

#### 2. Quaternion 계산

Roll, Pitch, Yaw를 Quaternion으로 변환합니다.

```python
#!/usr/bin/env python3
from tf.transformations import quaternion_from_euler
import math

# 각도를 라디안으로 변환
roll = math.radians(0)    # X축 회전
pitch = math.radians(180) # Y축 회전 (예: 뒤집힌 IMU)
yaw = math.radians(0)     # Z축 회전

# Quaternion 계산
quat = quaternion_from_euler(roll, pitch, yaw)

print(f"Quaternion:")
print(f"  qx = {quat[0]:.4f}")
print(f"  qy = {quat[1]:.4f}")
print(f"  qz = {quat[2]:.4f}")
print(f"  qw = {quat[3]:.4f}")

# 출력 예시:
# Quaternion:
#   qx = 0.0000
#   qy = 1.0000
#   qz = 0.0000
#   qw = 0.0000
```

#### 3. launch 파일 수정

```bash
cd ~/unicorn_ws/UNICORN/stack_master/config/SRX1/devices
code static_transforms.launch.xml
```

예시: LiDAR 위치를 30cm 전방으로 변경

변경 전:

```xml
<node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_laser"
      args="0.270 0.0 0.127 0.0 0.0 0.0 1.0 base_link laser" />
```

변경 후:

```xml
<node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_laser"
      args="0.300 0.0 0.127 0.0 0.0 0.0 1.0 base_link laser" />
```

#### 4. 재실행 및 확인

```bash
# ROS 재시작
roslaunch stack_master base_system.launch map:=YOUR_MAP

# 새 터미널에서 확인
rosrun tf tf_echo base_link laser
```

## 센서 추가하기

새로운 센서(예: Realsense 카메라)를 추가한다고 가정해봅시다.

### 1. 센서 위치 결정

- 위치: (0.35, 0.0, 0.10) - 전방 35cm, 중앙, 높이 10cm
- 회전: 15도 아래를 향함 (pitch = -15도)

### 2. Quaternion 계산

```python
from tf.transformations import quaternion_from_euler
import math

pitch = math.radians(-15)  # 15도 아래
quat = quaternion_from_euler(0, pitch, 0)

# 결과: (0.0, -0.1305, 0.0, 0.9914)
```

### 3. static_transforms.launch.xml에 추가

```xml
<!-- RealSense Camera -->
<node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_realsense"
      args="0.35 0.0 0.10 0.0 -0.1305 0.0 0.9914 base_link realsense_link" />
```

## IMU 설정 파일 (imu.yaml)

TF뿐만 아니라 IMU 센서 자체의 설정도 중요합니다.

### 주요 설정 항목

```yaml
# SRX1/devices/imu.yaml

# Frame 설정
frame_id: 'imu'
mount_frame_id: "base_link"
use_enu_frame: True  # ← 중요!

# IMU가 base_link 대비 어떻게 마운트되어 있는지
publish_mount_to_frame_id_transform: False
# TF는 static_transforms.launch.xml에서 관리하므로 False

# IMU 데이터 발행 주기
imu_data_rate: 100              # 100Hz
filter_imu_data_rate: 250       # 250Hz (EKF 필터링된 데이터)
```

### use_enu_frame의 의미

False (NED - North, East, Down):

- 항공/해양 표준
- Z축이 아래를 향함 (Down)

True (ENU - East, North, Up):

- ROS 표준
- Z축이 위를 향함 (Up)

SRX1은 `use_enu_frame: True`로 설정되어 ROS 표준을 따릅니다.

## Cartographer와 TF

### mapping.lua 설정

```lua
-- SRX1/SE/slam/mapping.lua

options = {
  map_frame = "map",
  tracking_frame = "imu_rot",      -- ← Cartographer가 추적할 frame
  published_frame = "base_link",   -- ← 결과를 발행할 frame
  odom_frame = "carto_odom",

  provide_odom_frame = true,
  publish_frame_projected_to_2d = true,

  num_laser_scans = 1,
  use_odometry = false,
}
```

### tracking_frame = "imu_rot"의 의미

Cartographer는 `imu_rot` frame의 자세(orientation)를 추적합니다.

왜 `base_link`가 아니라 `imu_rot`인가?

- IMU는 고주파 자세 데이터를 제공합니다 (100-250Hz).
- `base_link`는 센서 없음(가상의 좌표계)입니다.
- IMU를 tracking하면 부드럽고 정확한 자세 추정을 할 수 있습니다.

`published_frame = "base_link"`의 의미:

- 하지만 최종 결과는 `base_link`로 발행됩니다.
- TF를 통해 자동 변환됩니다: `imu_rot` → `imu` → `base_link`

## 문제 해결 (Troubleshooting)

### 문제 1: TF가 발행되지 않음

증상:

```bash
rosrun tf tf_echo base_link laser
# Exception thrown: Frame laser does not exist
```

원인:

- `static_transforms.launch.xml`이 로드되지 않음
- `CAR_NAME` 환경변수가 잘못됨
- launch 파일 문법 오류

해결:

```bash
# 1. CAR_NAME 확인
echo $CAR_NAME
# 출력: SRX1 (정상) 또는 비어있음 (비정상)

# 2. static_transform_publisher 노드 확인
rosnode list | grep static_transform_publisher
# 출력: /base_link_to_imu, /base_link_to_laser 등

# 3. launch 파일 문법 체크
roslaunch --check stack_master low_level.launch

# 4. 수동으로 TF 발행 테스트
rosrun tf2_ros static_transform_publisher 0.27 0 0.127 0 0 0 1 base_link laser
```

### 문제 2: TF가 계속 변함 (Static이 아님)

증상:

```bash
rostopic hz /tf
# rate average: 100.0  ← Static TF는 발행 빈도가 낮아야 함
```

원인:

- `/tf` 토픽을 사용함 (Dynamic TF용)
- `/tf_static` 토픽을 써야 함

해결:

```bash
# /tf_static 확인
rostopic hz /tf_static
# rate average: 0.1  ← 정상 (10초에 1번 정도)
```

### 문제 3: Cartographer가 IMU를 못 찾음

증상:

```text
[ERROR] [cartographer]: Failed to compute relative pose.
        Lookup would require extrapolation at time 1234.567,
        but only time 1234.560 is in the buffer.
```

원인:

- `imu_rot` frame이 없음
- IMU 데이터의 `frame_id`가 잘못됨

해결:

```bash
# 1. imu_rot frame 확인
rosrun tf tf_echo base_link imu_rot

# 2. IMU 데이터의 frame_id 확인
rostopic echo /imu/data -n 1 | grep frame_id
# 출력: frame_id: "imu"  ← "imu"여야 함

# 3. imu.yaml의 frame_id 확인
cat ~/unicorn_ws/UNICORN/stack_master/config/SRX1/devices/imu.yaml | grep frame_id
# 출력: frame_id : 'imu'
```

### 문제 4: 센서 데이터가 이상한 위치에 표시됨

증상:

- RViz에서 LiDAR 스캔이 차량 뒤에 표시됨
- IMU 방향이 반대

원인:

- TF의 위치/회전 값이 잘못됨
- Quaternion 부호 오류

해결:

```bash
# 1. TF 값 확인
rosrun tf tf_echo base_link laser

# 2. 예상 값과 비교
# X가 음수면? → 센서가 뒤쪽에 있다고 인식
# Quaternion의 부호가 반대면? → 180도 틀어짐

# 3. static_transforms.launch.xml 수정
# X 값을 음수에서 양수로, 또는 quaternion 부호 변경
```

## 마치며

정확한 TF가 없으면 다음 문제가 발생합니다.

- SLAM이 제대로 동작하지 않습니다.
- 센서 융합이 불가능합니다.
- 경로 계획 오류가 발생합니다.

하지만 한 번 설정해두면 모든 센서 데이터가 자동으로 정렬됩니다.

### 요약

1. base_link가 중심입니다: 모든 센서는 base_link 기준으로 정의합니다.
2. Static TF가 필요합니다: 센서 위치는 변하지 않으므로 static_transform_publisher를 사용합니다.
3. FLU Convention을 따릅니다: ROS 표준(Forward-Left-Up)입니다.
4. Quaternion으로 회전을 표현합니다.
5. `tf_echo`, `view_frames`, RViz로 반드시 확인합니다.

### Reference

- [ROS TF Tutorial](https://wiki.ros.org/tf/Tutorials)
- [REP-105: Coordinate Frames](https://www.ros.org/reps/rep-0105.html)
- [Quaternion Basics](https://wiki.ros.org/tf2/Tutorials/Quaternions)
- [Cartographer ROS Integration](https://google-cartographer-ros.readthedocs.io/)

## SRX1 전체 TF 설정

### static_transforms.launch.xml

```xml
<!-- -*- mode: XML -*- -->
<launch>
   <!-- TFs -->
  <arg name="pub_map_to_odom" default="False"/>

  <!-- IMU (Microstrain) -->
  <node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_imu"
        args="0.085 0.06 0.065 0.0 1.0 0.0 0.0 base_link imu" />
  <node pkg="tf2_ros" type="static_transform_publisher" name="imu_to_imu_rot"
        args="0.0 0.0 0.0 0.0 1.0 0.0 0.0 imu imu_rot" />

  <!-- LiDAR (Hokuyo) -->
  <node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_laser"
        args="0.270 0.0 0.127 0.0 0.0 0.0 1.0 base_link laser" />

  <!-- VESC IMU (내장) -->
  <node pkg="tf2_ros" type="static_transform_publisher" name="base_link_to_vesc_imu"
        args="0.10 0.0 0.127 0.0 0.0 -0.7071 0.7071 base_link vesc_imu" />
  <node pkg="tf2_ros" type="static_transform_publisher" name="vesc_imu_to_vesc_imu_rot"
        args="0.0 0.0 0.0 0.0 0.0 0.7071 0.7071 vesc_imu vesc_imu_rot" />

  <!-- Map to Odom (옵션) -->
  <group if="$(arg pub_map_to_odom)">
    <node pkg="tf" type="static_transform_publisher" name="map_to_odom"
          args="0 0 0 0 0 0 map odom 10" />
  </group>
</launch>
```

### 센서 위치 요약 (SRX1)

| Frame | Parent | X | Y | Z | Rotation (deg) |
| --- | --- | --- | --- | --- | --- |
| imu | base_link | 0.085 | 0.06 | 0.065 | pitch=180 |
| imu_rot | imu | 0 | 0 | 0 | pitch=180 |
| laser | base_link | 0.270 | 0 | 0.127 | none |
| vesc_imu | base_link | 0.10 | 0 | 0.127 | yaw=-90 |
| vesc_imu_rot | vesc_imu | 0 | 0 | 0 | yaw=+90 |
| chassis | base_link | 0 | 0 | 0.05 | none |
| zed_camera_link | chassis | 0.390 | 0 | 0.04 | none |
