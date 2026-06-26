---
title: "Hokuyo LiDAR 셋업: 고정 IP 설정과 스캔 확인"
author: jeongsang-ryu
date: 2026-06-26 12:00:00 +0900
categories: [build, advanced]
tags: [lidar, sensor, network]
image:
  path: /assets/img/posts/lidar-setup/ip-config-2.png
lang: ko
lang_ref: lidar-setup
---

Hokuyo 2D LiDAR를 PC에 연결하려면, **센서와 같은 IP 대역으로 PC에 고정 IP를 설정**한 뒤 ROS 드라이버(`urg_node`)로 스캔이 들어오는지 확인해야 합니다. 이 글에서는 그 과정을 단계별로 정리합니다.

## 1. LiDAR IP 확인

먼저 센서에 설정된 IP 주소를 알아야 합니다. IP를 모른다면 Wireshark로 패킷의 Source IP를 확인하는 방법을 참고하세요.

- [Wireshark로 LiDAR 센서 IP 주소 확인하기]({{ site.baseurl }}/posts/lidar-ip-address-wireshark/)

이 글에서는 센서 IP가 `192.168.0.10`인 경우(대역 `192.168.0.x`)를 기준으로 진행합니다.

## 2. PC 고정 IP 설정

센서와 통신하려면 PC의 유선 인터페이스를 센서와 **같은 대역**의 고정 IP로 설정해야 합니다.

PC와 센서를 이더넷으로 연결한 뒤, **Settings → Network**의 유선(Wired) 항목에서 톱니바퀴(설정) 아이콘을 클릭합니다.

![네트워크 설정 진입](/assets/img/posts/lidar-setup/ip-config-1.png)
*Settings → Network → 유선 연결 설정*

**IPv4** 탭에서 **Manual**을 선택하고, 센서와 같은 대역의 주소를 입력합니다. 센서가 `192.168.0.10`이므로 PC는 겹치지 않는 `192.168.0.15` 등으로 설정합니다.

![IPv4 수동 설정](/assets/img/posts/lidar-setup/ip-config-2.png)
*IPv4 Manual — Address 192.168.0.15 / Netmask 255.255.255.0 / Gateway 192.168.0.1*

> Netmask는 `255.255.255.0`, Gateway는 대역의 `.1`(예: `192.168.0.1`)로 설정합니다. PC 주소는 센서 주소(`.10`)와 겹치지 않게 합니다.
{: .prompt-tip }

설정을 적용하려면 유선 연결을 **껐다가 다시 켭니다.**

![유선 연결 끄기](/assets/img/posts/lidar-setup/net-toggle-off.png)
*변경 적용을 위해 유선 연결을 끔*

![유선 연결 켜기](/assets/img/posts/lidar-setup/net-toggle-on.png)
*다시 켜면 새 고정 IP로 연결됨*

## 3. urg_node 설정

LiDAR 드라이버(`urg_node`)에 센서 IP와 스캔 각도 범위를 지정합니다. 설정 파일은 차량별 config에 있습니다.

`~/unicorn_ws/src/unicorn-racing-stack/stack_master/config/{CAR}/vehicle_config.yaml`

```yaml
urg_node:
  ros__parameters:
    angle_max: 3.14
    angle_min: -3.14
    ip_address: "192.168.0.10"
```

- `ip_address`: 1번에서 확인한 **센서 IP**
- `angle_min` / `angle_max`: 사용할 스캔 각도 범위(rad)

## 4. 실행 및 스캔 확인

low-level 런치로 드라이버를 실행합니다.

```bash
ros2 launch stack_master low_level.launch.xml
```

`/scan` 토픽이 정상적으로 발행되는지 확인합니다.

```bash
ros2 topic echo /scan
ros2 topic echo /scan --field header
ros2 topic echo /scan --field ranges

ros2 topic hz /scan
```

- `topic echo`로 데이터가 들어오는지, `--field`로 헤더·거리값을 확인합니다.
- `topic hz`로 스캔 주기(주파수)가 정상인지 확인합니다.

마지막으로 `rviz2`에서 `/scan`을 시각화해 포인트가 제대로 찍히는지 확인합니다.

```bash
rviz2
```

## 마무리

이 글에서는 Hokuyo LiDAR를 사용하기 위한 (1) 센서 IP 확인, (2) PC 고정 IP 설정, (3) `urg_node` 설정, (4) `/scan` 확인 과정을 다뤘습니다. IP 대역만 맞추면 대부분의 연결 문제는 해결되며, 이후 `/scan` 토픽을 통해 매핑·로컬라이제이션 등에 LiDAR 데이터를 활용할 수 있습니다.
