---
title: "Build Racing-stack with Docker and VS Code"
author: inyoung-choi
date: 2026-02-02 12:00:00 +0900
categories: [racing stack, environment]
tags: [docker, vscode, racing-stack]
image:
  path: /assets/img/posts/racing-stack-build-docker-vscode/docker-vscode-logo.png
lang: en
lang_ref: racing-stack-build-docker-vscode
---

This guide summarizes how to build and run UNICORN Racing-stack using Docker and VS Code.

## 1. Install Docker

- [https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

To use Docker without sudo, add your user to the docker group.

## 2. Repository clone

```bash
mkdir ~/unicorn_ws && cd ~/unicorn_ws
mkdir -p cache/noetic/build cache/noetic/devel cache/noetic/logs
```

```bash
git clone --recurse-submodules https://github.com/HMCL-UNIST/UNICORN.git && cd UNICORN
```

## 3. Build Docker containers

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

## 4. Rebuild in VS Code

```bash
code ~/unicorn_ws/UNICORN
```

In VS Code, run **Dev Containers: Rebuild and Reopen in Container**.

You will enter the Docker container automatically and can inspect the Racing-stack from VS Code.
(The Remote Development extension must be installed in advance via the VS Code Extensions tab.)

## Conclusion

- We unify the development environment using Docker to reduce dependency issues.
- We improve development efficiency using VS Code Dev Containers.
- We manage the Racing-stack in a reproducible and consistent manner.

## Acknowledgement

This is based on the ForzaETH open-source race_stack codebase.
