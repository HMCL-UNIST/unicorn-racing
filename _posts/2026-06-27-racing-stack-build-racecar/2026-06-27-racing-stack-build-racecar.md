---
title: 실차(RaceCar)에서 UNICORN Racing Stack 빌드
author: jeongsang-ryu
date: 2026-06-27 13:00:00 +0900
categories: [racing stack, environment]
tags: [racing-stack, ros2, jazzy, build, cyclonedds]
image:
  path: /assets/img/posts/racing-stack-build-racecar/image.png
lang: ko
lang_ref: racing-stack-build-racecar
---

실제 차량(RaceCar)에서 UNICORN Racing Stack을 빌드하고, LiDAR·VESC 설정과 원격 제어(CycloneDDS)까지 구성하는 전체 과정을 정리했습니다. 전체 코드는 [UNICORN Racing Stack 저장소](https://github.com/HMCL-UNIST/unicorn-racing-stack)에서 확인할 수 있습니다.

> 시뮬레이션·원격 제어용 **노트북 빌드**는 [시뮬레이션과 원격 레이스 제어를 위한 UNICORN Racing Stack 빌드]({{ site.baseurl }}/posts/racing-stack-build-simulation-remote/)를 참고하세요. 이 글은 **실제 차량(전체 빌드)** 기준입니다.
{: .prompt-info }

## 0. Conda 환경 준비

이미 conda 환경이 있다면 이 단계는 건너뛰어도 됩니다. 새로 설치한다면 **miniforge** 설치를 추천합니다.

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash "Miniforge3-$(uname)-$(uname -m).sh" && exec $SHELL
conda config --set auto_activate_base false
```

## 1. 저장소 클론

```bash
mkdir -p ~/unicorn_ws/src && cd ~/unicorn_ws/src
git clone --recursive https://github.com/hmcl-unist/unicorn-racing-stack.git
cd unicorn-racing-stack
```

> 서브모듈까지 함께 받아야 하므로 반드시 `--recursive` 옵션을 사용합니다.
{: .prompt-warning }

## 2. 차량에서 빌드 (실차 레이스용)

```bash
./setup_conda_onCar.sh   # the car: full build (everything)
```

차량 빌드는 cartographer를 비롯해 하드웨어·매핑·로컬라이제이션까지 **모두** 빌드하므로, 노트북 빌드(`onLaptop`)보다 시간이 더 걸립니다.

## 3. Hokuyo LiDAR 설정

LiDAR의 static IP 설정과 센서 데이터 확인은 [Hokuyo LiDAR 셋업: static IP 설정과 센서 데이터 확인]({{ site.baseurl }}/posts/hokuyo-lidar-setup/) 글을 참고하세요.

## 4. VESC 설정

VESC 포트 설정과 모터·서보 연결 확인은 [VESC 포트 설정과 연결 확인]({{ site.baseurl }}/posts/vesc-port-setup/) 글을 참고하세요.

## 5. 원격 제어용 CycloneDDS 설정

### 5-1. 같은 네트워크에 연결

먼저 차량의 온보드 PC와 노트북을 **동일한 네트워크**에 연결합니다.

### 5-2. cyclonedds.xml 인터페이스 맞추기

`ifconfig` 명령으로 네트워크 인터페이스 이름을 확인하고, `cyclonedds.xml`의 인터페이스를 그에 맞게 설정합니다.

`ifconfig`가 설치되어 있지 않다면 다음으로 설치합니다.

```bash
sudo apt install net-tools
```

- 무선 연결인지 유선 연결인지에 따라 알맞은 인터페이스 이름을 선택합니다.
- **차량과 노트북 양쪽 모두** 설정해야 합니다.
- 설정 파일 경로: `/home/unicorn/unicorn_ws/src/unicorn-racing-stack/cyclonedds.xml`

![ifconfig와 cyclonedds.xml 인터페이스 설정](/assets/img/posts/racing-stack-build-racecar/image-1.png)

## 6. 원격 연결 확인

차량(onCar)에서 low-level을 실행합니다.

```bash
ros2 launch stack_master low_level.launch.xml
```

노트북(onLaptop)에서 토픽이 수신되는지 확인합니다.

```bash
ros2 topic echo /scan
```

노트북에서 `/scan` 데이터가 보이면 원격 연결이 정상입니다.

## 마무리

이 글에서는 실제 차량에서 UNICORN Racing Stack을 빌드하고, 센서 설정과 원격 제어까지 구성하는 과정을 다뤘습니다.

- `setup_conda_onCar.sh`로 차량 전체 빌드
- [Hokuyo LiDAR 설정]({{ site.baseurl }}/posts/hokuyo-lidar-setup/) · [VESC 설정]({{ site.baseurl }}/posts/vesc-port-setup/)은 각 가이드 참고
- CycloneDDS로 차량–노트북 원격 연결 구성

실제 차량에 적용하기 전 시뮬레이션에서 먼저 검증하려면 [시뮬레이션과 원격 레이스 제어를 위한 UNICORN Racing Stack 빌드]({{ site.baseurl }}/posts/racing-stack-build-simulation-remote/)를 참고하세요.
