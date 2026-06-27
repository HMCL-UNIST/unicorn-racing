---
title: "Hokuyo LiDAR Setup: Static IP Configuration and Sensor Data Check"
author: jeongsang-ryu
date: 2026-06-27 11:00:00 +0900
categories: [build, beginner]
tags: [lidar, hokuyo, ros2]
image:
  path: /assets/img/posts/hokuyo-lidar-setup/image.png
lang: en
lang_ref: hokuyo-lidar-setup
---

This guide walks through connecting a Hokuyo LiDAR to the vehicle, from configuring a static IP to checking the scan data in ROS 2.

> If you don't know the LiDAR's IP address, first see [How to Find LiDAR Sensor IP Address Using Wireshark]({{ site.baseurl }}/posts/lidar-ip-address-wireshark-en/).
{: .prompt-info }

<style>
.lidar-img-row { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.lidar-img-row .img-link { width: 49%; min-width: 240px; margin: 0; }
.lidar-img-row img { width: 100%; }
</style>

## 1. Static IP Configuration

The Ethernet interface of the board connected to the LiDAR must be set to a static IP. The following assumes the LiDAR's IP is `192.168.0.10`.

### 1.1 IPv4 Settings

Go to **Settings → Network → Wired settings button → IPv4**.

<div class="lidar-img-row">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-1.png" alt="Network settings">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-2.png" alt="IPv4 settings">
</div>

- **Address**: Keep the first three octets identical to the LiDAR IP and change only the last number. (e.g. `192.168.0.20`)
- **Netmask**: `255.255.255.0`
- **Gateway**: Keep the first three octets identical and append `1` at the end. (e.g. `192.168.0.1`)

### 1.2 Apply

To apply the settings, turn the wired connection off and back on.

<div class="lidar-img-row">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-3.png" alt="Turn connection off">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-4.png" alt="Turn connection on">
</div>

## 2. Sensor Data Check

> If you have not built the UNICORN Racing Stack on the car yet, please complete [Building the UNICORN Racing Stack on the RaceCar]({{ site.baseurl }}/posts/racing-stack-build-racecar-en/) first.
{: .prompt-warning }

### 2-1. Verify the LiDAR IP

Check that the LiDAR IP is set correctly in `~/unicorn_ws/src/unicorn-racing-stack/stack_master/config/CAR/vehicle_config.yaml`.

```yaml
urg_node:
  ros__parameters:
    angle_max: 3.14
    angle_min: -3.14
    ip_address: "192.168.0.10"
```

### 2-2. Launch Low Level (LiDAR, VESC, mux, …)

```bash
ros2 launch stack_master low_level.launch.xml
```

You should see output similar to the following.

![low level launch output](/assets/img/posts/hokuyo-lidar-setup/image-5.png)

### 2-3. Check Data in the Terminal

```bash
ros2 topic echo /scan
# or
ros2 topic echo /scan --field header
ros2 topic echo /scan --field ranges
ros2 topic hz /scan
```

### 2-4. Visualize Scan Data in Rviz2

Run Rviz2.

```bash
rviz2
```

Add the `scan` topic.

<div class="lidar-img-row">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-6.png" alt="Add scan topic">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-7.png" alt="Add scan topic">
</div>

Set the **Fixed Frame** and the topic **QoS**.

<div class="lidar-img-row">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-8.png" alt="Set Fixed Frame">
  <img src="/assets/img/posts/hokuyo-lidar-setup/image-9.png" alt="Set Topic QoS">
</div>

> If the LiDAR scan does not show up, make sure the scan topic's **Reliability Policy is set to Best Effort**. Sensor data is usually published as Best Effort.
{: .prompt-tip }

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/hokuyo-lidar-setup/demo-scan-rviz.mp4" type="video/mp4">
</video>

## Conclusion

In this post, we covered the static IP configuration required to use a Hokuyo LiDAR, and how to verify the scan data in ROS 2.

- Set the board's Ethernet to a static IP in the same subnet as the LiDAR.
- Match the `ip_address` in `vehicle_config.yaml` to the LiDAR IP.
- After running `low_level.launch.xml`, check the data via the `/scan` topic and Rviz2.

If you don't know the LiDAR's IP, see [How to Find LiDAR Sensor IP Address Using Wireshark]({{ site.baseurl }}/posts/lidar-ip-address-wireshark-en/).
