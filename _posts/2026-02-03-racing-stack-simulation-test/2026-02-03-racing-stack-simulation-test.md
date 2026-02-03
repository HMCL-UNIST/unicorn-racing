---
title: simulation과 함께 racing-stack 사용해보기
author: inyoung-choi
date: 2026-02-03 14:00:00 +0900
categories: [racing stack, environment]
tags: [simulation, racing-stack, ros]
image:
  path: /assets/img/posts/racing-stack-simulation-test/image.png
lang: ko
lang_ref: racing-stack-simulation-test
---

**Racing-Stack**을 실제 차량 없이도 테스트할 수 있도록, Simulation 환경에서 실행하는 방법을 정리합니다.

실제 차량 운용 전 로직 검증 및 테스트하는 것을 목적으로 활용할 수 있습니다.

## Mapping

1. 시뮬레이션 환경 내에서는 map을 생성할 수 없으므로 **map.png**와 **map.yaml** 파일이 필요합니다.

> 참고) 실제 차량에서의 해당 파일 생성 과정
> 1. `roscore` 실행
> 2. `roslaunch stack_master low_level.launch`를 통해 차량의 LIDAR, IMU, VESC 센서 실행
> 3. `roslaunch stack_master mapping.launch map:=map_name create_map:=true`를 통해 파일 생성 (실제 map을 closed-loop로 한 바퀴 주행)
{: .prompt-info }

### 파일 예시

![map.yaml 예시](/assets/img/posts/racing-stack-simulation-test/map-yaml-example.jpg)

| 항목 | 설명 |
|------|------|
| image | 파일명 |
| resolution | 1픽셀 = 0.05m |
| origin | map의 원점 |
| occupied_thresh | 장애물 판정 임계값 |
| free_thresh | 빈 공간 판정 임계값 |
| negate | 이미지 반전 여부 |

2. map 기반 최적 경로를 계산합니다.

```bash
roslaunch stack_master mapping.launch map:=map_name create_map:=false create_global_path:=true
```

- map.png를 기반으로 centerline 추출

![centerline 추출](/assets/img/posts/racing-stack-simulation-test/image-1.png)

- 구간별 속도 튜닝을 위한 **Speed sector** 설정

![Speed sector 설정](/assets/img/posts/racing-stack-simulation-test/image-2.png)

- 추월 허용 구간을 구분하기 위한 **Overtaking sector** 설정

![Overtaking sector 설정](/assets/img/posts/racing-stack-simulation-test/image-3.png)

최종적으로 3가지 파일이 생성됩니다.

> - `global_waypoints.json`: 최적 경로 및 속도 프로파일
> - `speed_scaling.yaml`: 구간별 속도 제한
> - `ot_sectors.yaml`: 추월 허용 구간
{: .prompt-tip }

## Head to head

1. 시뮬레이션 환경을 실행시킵니다.

```bash
roslaunch stack_master base_system.launch map:=map_name sim:=true
```

2. 장애물 감지, 주행 상태 판단, 차량을 움직이게 하는 제어 기능을 활성화시킵니다.

```bash
roslaunch stack_master headtohead.launch perception:=false
```

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-simulation-test/demo-headtohead.mp4" type="video/mp4">
</video>

## Obstacle

### 1. Static obstacle 회피

rviz에서 `Publish Point`를 통해 **static obstacle**를 생성할 수 있습니다.

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-simulation-test/demo-static-obstacle.mp4" type="video/mp4">
</video>

생성된 static obstacle를 감지하여 회피 경로를 생성 및 추종함으로써 충돌 없이 정적 장애물을 회피하는 모습을 확인할 수 있습니다.

### 2. Dynamic obstacle overtaking

최적 경로를 느린 속도(0.4배)로 주행하는 **dynamic obstacle**를 생성할 수 있습니다.

```bash
roslaunch obstacle_publisher obstacle_publisher.launch speed_scaler:=0.4
```

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-simulation-test/demo-dynamic-obstacle.mp4" type="video/mp4">
</video>

생성된 dynamic obstacle를 감지하여 overtaking 경로를 생성 및 추종함으로써 추월하는 모습을 확인할 수 있습니다.

## 마무리

이 글에서는 Simulation 환경에서 Racing-Stack을 테스트하는 방법을 다뤘습니다.

- Simulation을 활용하여 racing-stack 로직 검증이 가능합니다.
- Map 기반 주행 데이터 생성(최적 경로, 속도 프로파일, 추월 구간 설정)을 할 수 있습니다.
- 가상 장애물 시나리오 테스트(정적 장애물 회피 및 동적 장애물 추월)가 가능합니다.

실제 차량에 배포하기 전에 시뮬레이션에서 충분히 검증하는 것을 권장합니다.
