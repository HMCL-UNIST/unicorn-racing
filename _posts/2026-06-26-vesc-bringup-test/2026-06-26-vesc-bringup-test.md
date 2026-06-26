---
title: "VESC 브링업: 포트 설정과 모터·서보 동작 확인"
author: jeongsang-ryu
date: 2026-06-26 14:00:00 +0900
categories: [build, advanced]
tags: [vesc, motor, servo, bringup]
lang: ko
lang_ref: vesc-bringup-test
---

배선을 마친 뒤, 실제 주행 전에 **VESC가 정상 인식되는지 확인하고 모터·서보가 의도대로 동작하는지** 테스트하는 단계입니다.

## 1. 포트 설정

VESC가 연결된 시리얼 포트를 차량 config에 지정합니다.

`~/unicorn_ws/src/unicorn-racing-stack/stack_master/config/{CAR}/vehicle_config.yaml`

```yaml
vesc/**:
  ros__parameters:
    port: "/dev/ttyACM0"
```

## 2. 드라이버 실행 및 인식 확인

low-level 런치로 VESC 드라이버를 실행합니다.

```bash
ros2 launch stack_master low_level.launch.xml
```

정상적으로 인식되면 다음과 같이 하드웨어가 paired되었다는 로그가 출력됩니다.

```text
[vesc_driver_node-1] [INFO] [...] [vesc.vesc_driver_node]: -=60_MK6=- hardware paired 0
```

센서 토픽으로 상태가 들어오는지 확인합니다.

```bash
ros2 topic echo /vesc/sensors/core
```

```text
state:
  voltage_input: 16.3
  duty_cycle: 0.001
  fault_code: 0
  controller_id: 120
  ...
```

`voltage_input`이 배터리 전압과 비슷하고 `fault_code: 0`이면 정상입니다.

## 3. 모터 동작 확인

> 바퀴가 지면에 닿지 않도록 **차량을 받침대 위로 띄운 상태**에서 진행하세요.
{: .prompt-warning }

low-level 런치를 켜둔 채, 다른 터미널에서 모터 속도 명령을 발행합니다.

```bash
ros2 topic pub -r 20 /vesc/commands/motor/speed std_msgs/msg/Float64 "{data: 8000.0}"
```

바퀴가 **반대 방향**으로 돈다면, 모터 3선 중 **두 선을 서로 바꿔** 연결합니다.

## 4. 서보(조향) 동작 확인

서보 위치 명령으로 조향을 확인합니다.

```bash
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.2}"
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.5}"
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.8}"
```

부호 규약은 **0 = 중립, + = 좌, − = 우**입니다.

- `0.2`(작은 값)를 줬는데 바퀴가 **왼쪽**으로 가면, steering gain의 **부호를 반전**해야 합니다.
- `0.5`에서 정렬이 잘 맞지 않으면 서보 혼을 뺐다 다시 끼워야 할 수 있습니다. 자세한 절차는 [타이어 정렬 후 서보 암을 결합해야 하는 이유]({{ site.baseurl }}/posts/servo-horn-after-alignment/)를 참고하세요.

## 마무리

이 글에서는 VESC를 (1) 포트 설정 → (2) 드라이버 실행·인식 확인 → (3) 모터 방향 확인 → (4) 서보 방향·중립 확인 순으로 브링업하는 과정을 다뤘습니다. 여기까지 정상이라면 이후 ERPM/스티어링 게인 보정과 PID 튜닝으로 넘어갈 수 있습니다.
