---
title: "Racing-Stack 원격 실행 가이드: 네트워크·SSH·Docker"
author: inyoung-choi
date: 2026-02-02 20:56:07 +0900
categories: [racing stack, environment]
tags: [racing-stack, remote, ssh, docker, ros]
image:
  path: /assets/img/posts/racing-stack-remote-run-guide/fin.png
lang: ko
lang_ref: racing-stack-remote-run-guide
---

Racing-Stack을 실제 운용할 때 필요한 원격 실행 환경 설정과 실행 순서를 정리했습니다. **네트워크 설정 → SSH 접속 → Docker 접속** 순서로 진행하면 됩니다.

## 1. 통신 네트워크

Local PC ↔ 차량 간 통신을 위해 먼저 네트워크를 확인합니다.

### 1-1. 네트워크 확인

- `ifconfig`로 현재 IP 주소를 확인합니다.
- Local PC와 차량은 반드시 **같은 네트워크(Wi‑Fi)**에 연결되어 있어야 합니다.

![ifconfig 확인](/assets/img/posts/racing-stack-remote-run-guide/ifconfig.jpg)

- `ping Car_ip`로 Local PC에서 차량에 통신이 가능한지 확인합니다.
- 응답이 없다면 **Car IP가 잘못되었거나**, **같은 네트워크가 아니거나**, **차량 전원이 꺼져 있는 상태**일 수 있습니다.

### 1-2. 네트워크 설정

확인한 IP 주소를 기반으로 Local PC의 `bashrc`에 네트워크 설정을 추가합니다.

![bashrc 네트워크 설정](/assets/img/posts/racing-stack-remote-run-guide/network-bashrc.png)

- Local PC 설정
  - `ROS_IP` / `ROS_HOSTNAME`: 다른 ROS 노드가 접속할 수 있도록 자신의 네트워크 주소를 명시합니다.

```bash
export ROS_IP="Local PC ip"
export ROS_HOSTNAME="Local PC ip"
```

- 차량(Car) 설정
  - `ROS_MASTER_URI`: ROS master가 실행 중인 위치(주소)를 명시합니다.

```bash
export ROS_MASTER_URI="http://Car_ip:11311"
```

## 2. 차량 원격 접속 (SSH)

원격 접속은 기본적으로 `ssh`를 사용합니다.

```bash
ssh 사용자명@Car_ip
```

자주 사용하는 옵션은 다음과 같습니다.

- `-t`: 원격 세션에 터미널을 강제로 할당합니다. (docker 실행, roslaunch 등 interactive 명령어에 필요)
- `-X`: 원격 GUI를 Local PC로 전달합니다. (rviz, rqt 등)
- `-C`: ssh 통신 데이터를 압축합니다.

### 비밀번호 입력 자동화 (sshpass)

```bash
sshpass -p 'password' ssh 사용자명@Car_ip
```

아래처럼 `bashrc`에 alias를 등록하면 더 쉽게 원격 접속을 사용할 수 있습니다.

```bash
alias 원하는_명령어="sshpass -p 'password' ssh -t -X -C 사용자명@Car_ip"
```

## 3. 차량 Docker 접속

SSH로 차량에 접속한 뒤, Docker 컨테이너를 실행하고 접속합니다.

1. 컨테이너 실행

```bash
docker start docker_name
```

2. 컨테이너 접속

```bash
docker exec -it docker_name bash
```

> 주의: **GUI 권한은 SSH로 최초 접속한 터미널에만** 적용됩니다. 이후에 새로 연 터미널에서는 GUI가 보이지 않을 수 있습니다. `xeyes`로 GUI 권한을 먼저 확인하는 것이 좋습니다.

![xeyes GUI 확인](/assets/img/posts/racing-stack-remote-run-guide/xeyes-check.png)

## 마무리

Racing-Stack 원격 실행은 **네트워크 설정 → SSH 접속 → Docker 접속** 순서로 진행하면 안정적으로 사용할 수 있습니다. 특히 네트워크 주소와 ROS 환경 변수를 정확히 설정하는 것이 중요하며, GUI 사용 여부에 따라 SSH 옵션과 터미널 선택을 신경 써야 합니다.
