---
title: "Racing-Stack Remote Run Guide: Network, SSH, and Docker"
author: inyoung-choi
date: 2026-02-02 20:56:07 +0900
categories: [racing stack, environment]
tags: [racing-stack, remote, ssh, docker, ros]
image:
  path: /assets/img/posts/racing-stack-remote-run-guide/fin.png
lang: en
lang_ref: racing-stack-remote-run-guide
---

This guide summarizes the remote execution setup for Racing-Stack. Follow the sequence **network setup → SSH access → Docker access**.

## 1. Network communication

You must confirm connectivity between the local PC and the vehicle first.

### 1-1. Check the network

- Use `ifconfig` to 확인 your current IP address.
- The local PC and the vehicle must be on the **same network (Wi‑Fi)**.

![ifconfig check](/assets/img/posts/racing-stack-remote-run-guide/ifconfig.jpg)

- Use `ping Car_ip` to verify connectivity from the local PC to the vehicle.
- If there is no response, the **Car IP may be wrong**, the devices are **not on the same network**, or the **vehicle power is off**.

### 1-2. Set ROS network variables

Based on the IP addresses, update `bashrc` on the local PC.

![bashrc network setup](/assets/img/posts/racing-stack-remote-run-guide/network-bashrc.png)

- Local PC
  - `ROS_IP` / `ROS_HOSTNAME`: your local address so other ROS nodes can connect.

```bash
export ROS_IP="Local PC ip"
export ROS_HOSTNAME="Local PC ip"
```

- Vehicle (Car)
  - `ROS_MASTER_URI`: the address where the ROS master is running.

```bash
export ROS_MASTER_URI="http://Car_ip:11311"
```

## 2. Remote access via SSH

Use `ssh` to access the vehicle remotely.

```bash
ssh username@Car_ip
```

Useful options:

- `-t`: force a TTY for interactive commands (docker, roslaunch, etc.)
- `-X`: forward GUI to the local PC (rviz, rqt, etc.)
- `-C`: compress SSH traffic

### Automate password input (sshpass)

```bash
sshpass -p 'password' ssh username@Car_ip
```

You can register an alias in `bashrc` for convenience.

```bash
alias your_command="sshpass -p 'password' ssh -t -X -C username@Car_ip"
```

## 3. Connect to the vehicle Docker container

After logging in via SSH, start and enter the container.

1. Start the container

```bash
docker start docker_name
```

2. Enter the container

```bash
docker exec -it docker_name bash
```

> Note: **GUI permissions are only available in the terminal you used for the initial SSH connection.** Terminals opened later may not have GUI access. Use `xeyes` to confirm GUI permissions.

![xeyes GUI check](/assets/img/posts/racing-stack-remote-run-guide/xeyes-check.png)

## Wrap-up

Remote execution for Racing-Stack is reliable if you follow **network setup → SSH access → Docker access**. Correct ROS network variables are critical, and GUI use requires the proper SSH options and terminal session.
