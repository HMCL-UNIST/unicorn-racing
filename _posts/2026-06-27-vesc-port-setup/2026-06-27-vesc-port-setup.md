---
title: "VESC 포트 설정과 연결 확인"
author: jeongsang-ryu
date: 2026-06-27 12:00:00 +0900
categories: [build, beginner]
tags: [vesc, ros2, motor, servo]
image:
  path: /assets/img/posts/vesc-port-setup/image.png
lang: ko
lang_ref: vesc-port-setup
---

VESC를 차량에 연결한 뒤, 시리얼 포트를 찾아 지정하고 ROS 2에서 모터·서보·센서 연결을 확인하는 과정을 정리했습니다.

## 1. VESC 포트 찾기

### Option 1. udev 규칙으로 /dev/VESC 고정 + 권한 자동 부여

VESC를 항상 `/dev/VESC`로 인식하도록 udev 규칙을 등록하면, 포트 이름이 바뀌어도 매번 찾을 필요가 없습니다.

```bash
echo 'SUBSYSTEM=="tty", ATTRS{manufacturer}=="STMicroelectronics", SYMLINK+="VESC", MODE="0666"' | sudo tee /etc/udev/rules.d/99-vesc.rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Option 2. 직접 포트 찾기

```bash
ls /dev/
```

![/dev 목록](/assets/img/posts/vesc-port-setup/image-1.png)

VESC는 `ttyACMx` 중 하나입니다. USB 연결 장치가 여러 개이면 `ttyACM0`, `ttyACM1`과 같이 순서대로 이름이 붙습니다.

## 2. VESC 포트 지정하기

`~/unicorn_ws/src/unicorn-racing-stack/stack_master/config/CAR/vehicle_config.yaml` 파일에서 찾은 포트를 지정합니다.

```yaml
vesc/**:
  ros__parameters:
    port: "/dev/ttyACM0"
```

> Option 1의 udev 규칙을 사용했다면 `port: "/dev/VESC"`로 지정하면 됩니다.
{: .prompt-tip }

## 3. 연결 확인하기

> 아직 UNICORN Racing Stack을 빌드하지 않았다면, 먼저 빌드를 완료해주세요.
{: .prompt-warning }

### 3.1 Low Level 실행

```bash
ros2 launch stack_master low_level.launch.xml
```

아래와 같이 VESC가 정상적으로 paired 되었다는 로그가 나오면 연결된 것입니다.

```
[vesc_driver_node-1] [INFO] [1782325231.708176116] [vesc.vesc_driver_node]: -=60_MK6=- hardware paired 0
```

![low level 실행 로그](/assets/img/posts/vesc-port-setup/image-2.png)

### 3.2 센서 데이터 확인

```bash
ros2 topic echo /vesc/sensors/core
# 또는
ros2 topic echo /vesc/sensors/imu/raw
```

### 3.3 모터·서보 연결 확인

> 모터를 구동하기 전에 반드시 **차량을 바닥에서 들어 올려** 바퀴가 공중에 뜬 상태로 만드세요. 그렇지 않으면 차량이 갑자기 튀어나가 사고로 이어질 수 있습니다.
{: .prompt-danger }

모터를 회전시켜 봅니다.

```bash
ros2 topic pub -r 20 /vesc/commands/motor/speed std_msgs/msg/Float64 "{data: 8000.0}"
```

바퀴가 반대 방향으로 돈다면, 모터 3선 중 2선을 서로 바꿔 연결합니다.

서보를 움직여 봅니다.

```bash
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.2}"
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.5}"
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.8}"
```

## 마무리

이 글에서는 VESC의 시리얼 포트를 찾아 지정하고, ROS 2에서 연결과 모터·서보 동작을 확인하는 방법을 다뤘습니다.

- udev 규칙으로 `/dev/VESC`를 고정하거나, `ls /dev/`로 직접 포트를 찾습니다.
- `vehicle_config.yaml`에 포트를 지정합니다.
- `low_level.launch.xml` 실행 후 로그와 `/vesc/sensors` 토픽, 모터·서보 명령으로 연결을 확인합니다.

LiDAR 설정은 [Hokuyo LiDAR 셋업: static IP 설정과 센서 데이터 확인]({{ site.baseurl }}/posts/hokuyo-lidar-setup/) 글을 참고하세요.
