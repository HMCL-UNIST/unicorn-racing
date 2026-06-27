---
title: 시뮬레이션과 원격 레이스 제어를 위한 UNICORN Racing Stack 빌드
author: jeongsang-ryu
date: 2026-06-27 10:00:00 +0900
categories: [racing stack, environment]
tags: [racing-stack, simulation, ros2, jazzy, build]
image:
  path: /assets/img/posts/racing-stack-build-simulation-remote/image.png
lang: ko
lang_ref: racing-stack-build-simulation-remote
---

실제 차량 없이도 노트북에서 **시뮬레이션**을 돌리거나 **원격으로 레이스를 제어**할 수 있도록, UNICORN Racing Stack을 빌드하는 방법을 정리했습니다. 전체 코드는 [UNICORN Racing Stack 저장소](https://github.com/HMCL-UNIST/unicorn-racing-stack)에서 확인할 수 있습니다.

> 이 가이드는 **노트북/시뮬레이션용 빌드**입니다. 하드웨어 전용 노드와 매핑·로컬라이제이션은 제외하고 빌드됩니다. 실제 차량용 빌드는 [실차(RaceCar)에서 UNICORN Racing Stack 빌드]({{ site.baseurl }}/posts/racing-stack-build-racecar/)(`setup_conda_onCar.sh`)를 참고하세요.
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

## 2. 빌드 (노트북 — 시뮬레이션/원격 제어용)

```bash
./setup_conda_onLaptop.sh   # sim/laptop: 하드웨어 전용 노드와 매핑·로컬라이제이션은 제외하고 빌드
```

이 스크립트 하나로 `unicorn` conda 환경 생성, `unicorn` alias 등록(`~/.bashrc`, `~/.zshrc`), 의존성 설치까지 한 번에 처리됩니다. 빌드는 약 2분 정도 걸립니다.

<video controls autoplay loop muted width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-build-simulation-remote/build.mp4" type="video/mp4">
</video>

## 3. 실행 및 테스트

```bash
unicorn   # conda 환경 + ROS 2 Jazzy 워크스페이스 활성화 (alias)
ros2 launch stack_master race.launch.xml sim:=true map:=f   # 전체 자율주행 + 가상 상대 차량
```

키보드로 직접 차량을 조종할 수 있습니다.

- **방향키**: 수동 주행
- **`a`**: 자율주행(autonomous) 모드
- **`h`**: 수동 제어(human control) 모드

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-build-simulation-remote/demo-sim-race.mp4" type="video/mp4">
</video>

## 마무리

이 글에서는 UNICORN Racing Stack을 노트북에서 시뮬레이션·원격 제어용으로 빌드하는 과정을 다뤘습니다.

- Conda 환경 준비 → 저장소 클론 → `setup_conda_onLaptop.sh` 빌드 → `race.launch.xml`로 시뮬레이션 실행
- 실제 차량 없이도 자율주행 스택을 검증하고 테스트할 수 있습니다.

실제 차량에 배포하기 전, 시뮬레이션에서 충분히 검증하는 것을 권장합니다. **ROS 1** 기반 racing stack의 시뮬레이션 사용법은 [simulation과 함께 racing-stack 사용해보기]({{ site.baseurl }}/posts/racing-stack-simulation-test/) 글을 참고하세요.
