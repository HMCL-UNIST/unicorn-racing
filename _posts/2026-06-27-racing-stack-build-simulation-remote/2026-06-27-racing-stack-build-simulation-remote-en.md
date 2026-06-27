---
title: Building the UNICORN Racing Stack for Simulation and Remote Race Control
author: jeongsang-ryu
date: 2026-06-27 10:00:00 +0900
categories: [racing stack, environment]
tags: [racing-stack, simulation, ros2, jazzy, build]
image:
  path: /assets/img/posts/racing-stack-build-simulation-remote/image.png
lang: en
lang_ref: racing-stack-build-simulation-remote
---

This guide explains how to build the UNICORN Racing Stack so you can run **simulations** or **control a race remotely** from your laptop, without a physical vehicle. The full source is available in the [UNICORN Racing Stack repository](https://github.com/HMCL-UNIST/unicorn-racing-stack).

> This is a **laptop/simulation build**. Hardware-only nodes, mapping, and localization are skipped. For the actual vehicle, use `setup_conda_onCar.sh` instead.
{: .prompt-info }

## 0. Conda Setup

If you already have a conda environment, you can skip this step. Otherwise, we recommend installing **miniforge**.

```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash "Miniforge3-$(uname)-$(uname -m).sh" && exec $SHELL
conda config --set auto_activate_base false
```

## 1. Clone

```bash
mkdir -p ~/unicorn_ws/src && cd ~/unicorn_ws/src
git clone --recursive https://github.com/hmcl-unist/unicorn-racing-stack.git
cd unicorn-racing-stack
```

> The submodules must be fetched as well, so always use the `--recursive` option.
{: .prompt-warning }

## 2. Build (Laptop — for Simulation / Remote Control)

```bash
./setup_conda_onLaptop.sh   # sim/laptop: skips hardware-only nodes, mapping, and localization
```

This single script creates the `unicorn` conda environment, registers the `unicorn` alias (in `~/.bashrc` and `~/.zshrc`), and installs all dependencies at once. The build takes about 2 minutes.

<video controls autoplay loop muted width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-build-simulation-remote/build.mp4" type="video/mp4">
</video>

## 3. Run and Test

```bash
unicorn   # activate the conda env + ROS 2 Jazzy workspace (alias)
ros2 launch stack_master race.launch.xml sim:=true map:=f   # full autonomy + virtual opponent
```

You can drive the vehicle directly with the keyboard.

- **Arrow keys**: manual driving
- **`a`**: autonomous mode
- **`h`**: human control mode

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-build-simulation-remote/demo-sim-race.mp4" type="video/mp4">
</video>

## Conclusion

In this post, we walked through building the UNICORN Racing Stack on a laptop for simulation and remote control.

- Conda setup → clone the repository → build with `setup_conda_onLaptop.sh` → run the simulation with `race.launch.xml`
- You can validate and test the autonomy stack without a physical vehicle.

We recommend validating thoroughly in simulation before deploying to the real car. For the simulation workflow of the **ROS 1** racing stack, see [Trying out the racing-stack with simulation]({{ site.baseurl }}/posts/racing-stack-simulation-test/).
