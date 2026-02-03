---
title: "Docker와 VS Code로 Racing-stack 빌드하기"
author: inyoung-choi
date: 2026-02-02 12:00:00 +0900
categories: [racing stack, environment]
tags: [docker, vscode, racing-stack]
image:
  path: /assets/img/posts/racing-stack-build-docker-vscode/docker-vscode-logo.png
lang: ko
lang_ref: racing-stack-build-docker-vscode
---

UNICORN Racing-stack을 Docker + VS Code 환경에서 빌드하고 실행하는 방법을 정리했습니다.

## 1. Docker 설치

- [https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

Docker 명령어를 매번 sudo 없이 사용하기 위해, 현재 사용자를 docker 그룹에 추가합니다.

## 2. Repository Clone

```bash
mkdir ~/unicorn_ws && cd ~/unicorn_ws
mkdir -p cache/noetic/build cache/noetic/devel cache/noetic/logs
```

```bash
git clone --recurse-submodules https://github.com/HMCL-UNIST/UNICORN.git && cd UNICORN
```

## 3. Docker Container Build

```bash
docker compose build base_x86
```

```bash
export UID=$(id -u)
export GID=$(id -g)
```

```bash
docker compose build nuc
```

## 4. Docker Container Rebuild (VS Code)

```bash
code ~/unicorn_ws/UNICORN
```

VS Code에서 **Dev Containers: Rebuild and Reopen in Container**를 실행합니다.

Docker 컨테이너 내부에 자동으로 진입하여 Racing-stack을 VS Code로 확인할 수 있습니다.
(사전에 Remote Development extension을 VS Code의 Extensions 탭에서 설치해야 합니다.)

## 결론

- Docker 기반으로 개발 환경을 통일하여 환경 의존 문제를 최소화했습니다.
- VS Code Dev Container를 이용해 개발 효율을 높였습니다.
- Racing-stack을 재현 가능한 방식으로 관리할 수 있습니다.

## Acknowledgement

ForzaETH의 오픈소스 코드인 race_stack을 기반으로 만들었습니다.
