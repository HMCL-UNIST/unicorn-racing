---
title: "UNICORN Racing Stack 설치 가이드 (Jazzy)"
date: 2026-06-26 13:30:00 +0900
categories: [Software, environment]
tags: [installation, ros2, jazzy, conda]
lang: ko
lang_ref: racing-stack-installation-jazzy
---

이 글에서는 conda 환경을 이용해 UNICORN Racing Stack(ROS 2 Jazzy)을 설치하는 방법을 정리합니다. 랩탑/시뮬레이션용과 실차용 빌드 스크립트가 따로 준비되어 있습니다.

> Docker + VS Code 기반 설치를 원한다면 [Docker와 VS Code로 Racing-stack 빌드하기]({{ site.baseurl }}/posts/racing-stack-build-docker-vscode/)를 참고하세요.
{: .prompt-tip }

## 0. Conda 설치 (선택)

이미 conda 환경이 있다면 건너뛰어도 됩니다.

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash "Miniforge3-$(uname)-$(uname -m).sh" && exec $SHELL
conda config --set auto_activate_base false
```

## 1. 클론

워크스페이스를 만들고 서브모듈까지 함께 클론합니다.

```bash
mkdir -p ~/unicorn_ws/src && cd ~/unicorn_ws/src
git clone --recursive https://github.com/hmcl-unist/unicorn-racing-stack.git
cd unicorn-racing-stack
```

## 2. 설치

용도에 맞는 셋업 스크립트를 실행합니다.

```bash
./setup_conda_onLaptop.sh   # 시뮬/랩탑: 하드웨어 전용 노드와 mapping·localization을 건너뜀
./setup_conda_onCar.sh      # 실차: 전체 빌드(모든 노드)
```

- **랩탑/시뮬용**(`onLaptop`)은 하드웨어 의존 노드와 mapping·localization을 제외하고 빌드하므로, 차량 없이 시뮬레이션만 돌릴 때 적합합니다.
- **실차용**(`onCar`)은 모든 노드를 포함한 전체 빌드입니다.

## 3. 차량과의 원격 통신 설정

실차와 원격으로 통신하려면 **CycloneDDS의 IP를 명시적으로 설정**해야 합니다. CycloneDDS는 인터페이스 주소를 임의로 고르기 때문에, 그대로 두면 원격 통신이 될 때도 있고 내부 IP를 잡아 통신이 안 될 때도 있습니다.

원격 실행(네트워크·SSH·Docker)에 대한 자세한 설정은 다음 글을 참고하세요.

- [Racing-Stack 원격 실행 가이드: 네트워크·SSH·Docker]({{ site.baseurl }}/posts/racing-stack-remote-run-guide/)

## 마무리

이 글에서는 conda 기반으로 UNICORN Racing Stack을 (0) conda 준비 → (1) 클론 → (2) 용도별 빌드 → (3) 원격 통신 설정 순으로 설치하는 과정을 다뤘습니다. 시뮬레이션만 필요하면 `onLaptop`, 실차 운용이면 `onCar` 스크립트를 사용하면 됩니다.
