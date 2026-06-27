---
title: "Hokuyo LiDAR 셋업: static IP 설정과 센서 데이터 확인"
author: jeongsang-ryu
date: 2026-06-27 11:00:00 +0900
categories: [build, beginner]
tags: [lidar, hokuyo, ros2]
image:
  path: /assets/img/posts/hokuyo-lidar-setup/image.png
lang: ko
lang_ref: hokuyo-lidar-setup
---

Hokuyo LiDAR를 차량에 연결하고, static IP 설정부터 ROS 2에서 스캔 데이터를 확인하는 것까지의 과정을 정리했습니다.

> LiDAR의 IP를 모르는 경우, [Wireshark를 이용한 LiDAR 센서 IP 주소 확인 방법]({{ site.baseurl }}/posts/lidar-ip-address-wireshark/)을 먼저 참고하세요.
{: .prompt-info }

<style>
.lidar-img-row { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.lidar-img-row .img-link { width: 49%; min-width: 240px; margin: 0; }
.lidar-img-row img { width: 100%; }
</style>

## 1. Static IP 설정

LiDAR와 연결된 보드의 이더넷을 static IP로 설정해주어야 합니다. 예를 들어 LiDAR의 IP가 `192.168.0.10`인 경우를 기준으로 설명합니다.

### 1.1 IPv4 설정

**설정 → 네트워크 → 유선(Wired) 설정 버튼 → IPv4** 로 이동합니다.

<div class="lidar-img-row">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-1.png" alt="네트워크 설정">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-2.png" alt="IPv4 설정">
</div>

- **Address**: LiDAR IP와 앞 3자리는 동일하게 두고, 마지막 번호만 다르게 설정합니다. (예: `192.168.0.20`)
- **Netmask**: `255.255.255.0`
- **Gateway**: 앞 3자리는 동일하게 두고, 마지막에 `1`을 붙입니다. (예: `192.168.0.1`)

### 1.2 적용

설정을 적용하려면 유선 연결을 껐다가 다시 켜야 합니다.

<div class="lidar-img-row">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-3.png" alt="연결 끄기">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-4.png" alt="연결 켜기">
</div>

## 2. 센서 데이터 확인

> 아직 UNICORN Racing Stack을 빌드하지 않았다면, 먼저 빌드를 완료해주세요.
{: .prompt-warning }

### 2-1. LiDAR IP 설정 확인

`~/unicorn_ws/src/unicorn-racing-stack/stack_master/config/CAR/vehicle_config.yaml` 파일에서 LiDAR IP가 올바르게 설정되어 있는지 확인합니다.

```yaml
urg_node:
  ros__parameters:
    angle_max: 3.14
    angle_min: -3.14
    ip_address: "192.168.0.10"
```

### 2-2. Low Level 실행 (LiDAR, VESC, mux 등 포함)

```bash
ros2 launch stack_master low_level.launch.xml
```

아래와 같은 출력이 나오면 정상입니다.

![low level 실행 출력](/assets/img/posts/hokuyo-lidar-setup/image-5.png)

### 2-3. 터미널에서 데이터 확인

```bash
ros2 topic echo /scan
# 또는
ros2 topic echo /scan --field header
ros2 topic echo /scan --field ranges
ros2 topic hz /scan
```

### 2-4. Rviz2에서 스캔 데이터 시각화

Rviz2를 실행합니다.

```bash
rviz2
```

`scan` 토픽을 추가합니다.

<div class="lidar-img-row">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-6.png" alt="scan 토픽 추가">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-7.png" alt="scan 토픽 추가">
</div>

**Fixed Frame**과 토픽의 **QoS**를 설정합니다.

<div class="lidar-img-row">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-8.png" alt="Fixed Frame 설정">
  <img src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/image-9.png" alt="Topic QoS 설정">
</div>

> LiDAR 스캔 데이터가 보이지 않으면, scan 토픽의 **Reliability Policy를 Best Effort**로 설정했는지 확인하세요. 센서 데이터는 보통 Best Effort로 발행됩니다.
{: .prompt-tip }

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/demo-scan-rviz.mp4" type="video/mp4">
</video>

## 마무리

이 글에서는 Hokuyo LiDAR를 사용하기 위한 static IP 설정과, ROS 2에서 스캔 데이터를 확인하는 방법을 다뤘습니다.

- 보드의 이더넷을 LiDAR와 같은 대역의 static IP로 설정합니다.
- `vehicle_config.yaml`의 `ip_address`를 LiDAR IP와 일치시킵니다.
- `low_level.launch.xml` 실행 후 `/scan` 토픽과 Rviz2로 데이터를 확인합니다.

LiDAR의 IP를 모른다면 [Wireshark를 이용한 LiDAR 센서 IP 주소 확인 방법]({{ site.baseurl }}/posts/lidar-ip-address-wireshark/) 글을 참고하세요.
