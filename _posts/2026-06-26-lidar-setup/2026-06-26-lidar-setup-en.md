---
title: "Hokuyo LiDAR Setup: Static IP and Scan Check"
author: jeongsang-ryu
date: 2026-06-26 12:00:00 +0900
categories: [build, advanced]
tags: [lidar, sensor, network]
image:
  path: /assets/img/posts/lidar-setup/ip-config-2.png
lang: en
lang_ref: lidar-setup
---

To connect a Hokuyo 2D LiDAR to your PC, you need to **assign the PC a static IP in the same subnet as the sensor**, then confirm scans arrive through the ROS driver (`urg_node`). This post walks through that process step by step.

## 1. Find the LiDAR IP

First you need the IP address configured on the sensor. If you don't know it, use Wireshark to read the Source IP of the sensor's packets.

- [Find the LiDAR sensor IP address with Wireshark]({{ site.baseurl }}/posts/lidar-ip-address-wireshark/)

This guide assumes the sensor IP is `192.168.0.10` (subnet `192.168.0.x`).

## 2. Set a static IP on the PC

To talk to the sensor, the PC's wired interface must use a static IP in the **same subnet** as the sensor.

Connect the PC and sensor over Ethernet, then open **Settings → Network** and click the gear (settings) icon on the Wired entry.

![Open network settings](/assets/img/posts/lidar-setup/ip-config-1.png)
*Settings → Network → Wired connection settings*

On the **IPv4** tab, choose **Manual** and enter an address in the same subnet as the sensor. Since the sensor is `192.168.0.10`, set the PC to a non-conflicting address such as `192.168.0.15`.

![IPv4 manual configuration](/assets/img/posts/lidar-setup/ip-config-2.png)
*IPv4 Manual — Address 192.168.0.15 / Netmask 255.255.255.0 / Gateway 192.168.0.1*

> Set Netmask to `255.255.255.0` and Gateway to the subnet's `.1` (e.g. `192.168.0.1`). Keep the PC address different from the sensor address (`.10`).
{: .prompt-tip }

To apply the change, **toggle the wired connection off and back on.**

![Turn the wired connection off](/assets/img/posts/lidar-setup/net-toggle-off.png)
*Toggle the wired connection off to apply the change*

![Turn the wired connection on](/assets/img/posts/lidar-setup/net-toggle-on.png)
*Turning it back on connects with the new static IP*

## 3. Configure urg_node

Give the LiDAR driver (`urg_node`) the sensor IP and the scan angle range. The settings live in the per-car config.

`~/unicorn_ws/src/unicorn-racing-stack/stack_master/config/{CAR}/vehicle_config.yaml`

```yaml
urg_node:
  ros__parameters:
    angle_max: 3.14
    angle_min: -3.14
    ip_address: "192.168.0.10"
```

- `ip_address`: the **sensor IP** confirmed in step 1
- `angle_min` / `angle_max`: the scan angle range to use (rad)

## 4. Launch and verify the scan

Bring up the driver with the low-level launch file.

```bash
ros2 launch stack_master low_level.launch.xml
```

Check that the `/scan` topic is published correctly.

```bash
ros2 topic echo /scan
ros2 topic echo /scan --field header
ros2 topic echo /scan --field ranges

ros2 topic hz /scan
```

- Use `topic echo` to see incoming data, and `--field` to inspect the header and range values.
- Use `topic hz` to verify the scan rate (frequency) is normal.

Finally, visualize `/scan` in `rviz2` to confirm the points appear correctly.

```bash
rviz2
```

## Wrap-up

This post covered the four steps to get a Hokuyo LiDAR running: (1) find the sensor IP, (2) set a static IP on the PC, (3) configure `urg_node`, and (4) verify `/scan`. Matching the subnet resolves most connection issues, after which the `/scan` topic feeds LiDAR data into mapping, localization, and more.
