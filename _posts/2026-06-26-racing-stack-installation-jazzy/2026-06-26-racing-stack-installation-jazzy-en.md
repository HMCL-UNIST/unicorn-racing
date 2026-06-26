---
title: "UNICORN Racing Stack Installation Guide (Jazzy)"
date: 2026-06-26 13:30:00 +0900
categories: [Software, environment]
tags: [installation, ros2, jazzy, conda]
lang: en
lang_ref: racing-stack-installation-jazzy
---

This post covers installing the UNICORN Racing Stack (ROS 2 Jazzy) using a conda environment. Separate build scripts are provided for laptop/simulation and for the car.

> If you prefer a Docker + VS Code based setup, see [Building the racing stack with Docker and VS Code]({{ site.baseurl }}/posts/racing-stack-build-docker-vscode/).
{: .prompt-tip }

## 0. Conda setup (optional)

If you already have a conda environment, you can skip this.

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash "Miniforge3-$(uname)-$(uname -m).sh" && exec $SHELL
conda config --set auto_activate_base false
```

## 1. Clone

Create the workspace and clone with submodules.

```bash
mkdir -p ~/unicorn_ws/src && cd ~/unicorn_ws/src
git clone --recursive https://github.com/hmcl-unist/unicorn-racing-stack.git
cd unicorn-racing-stack
```

## 2. Install

Run the setup script that matches your target.

```bash
./setup_conda_onLaptop.sh   # sim / laptop: skips hardware-only nodes and mapping & localization
./setup_conda_onCar.sh      # the car: full build (everything)
```

- The **laptop/sim** build (`onLaptop`) excludes hardware-dependent nodes and mapping & localization, so it is suited for running simulation only, without a car.
- The **car** build (`onCar`) is a full build that includes every node.

## 3. Remote communication with the car

To communicate with the car remotely, you must **set the CycloneDDS IP explicitly**. CycloneDDS picks an interface address arbitrarily, so leaving it as-is means remote communication sometimes works and sometimes fails because it grabs an internal IP.

For detailed remote-run setup (network, SSH, Docker), see:

- [Racing-Stack remote run guide: network, SSH, Docker]({{ site.baseurl }}/posts/racing-stack-remote-run-guide/)

## Wrap-up

This post covered installing the UNICORN Racing Stack with conda in order: (0) prepare conda → (1) clone → (2) build per target → (3) set up remote communication. Use the `onLaptop` script if you only need simulation, or `onCar` for running on the real car.
