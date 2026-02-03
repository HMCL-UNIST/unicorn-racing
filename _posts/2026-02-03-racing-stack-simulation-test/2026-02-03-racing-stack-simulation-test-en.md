---
title: Testing Racing-Stack with Simulation
author: inyoung-choi
date: 2026-02-03 14:00:00 +0900
categories: [racing stack, environment]
tags: [simulation, racing-stack, ros]
image:
  path: /assets/img/posts/racing-stack-simulation-test/image.png
lang: en
lang_ref: racing-stack-simulation-test
---

This guide explains how to run **Racing-Stack** in a simulation environment, allowing you to test without an actual vehicle.

You can use this for logic verification and testing before operating the actual vehicle.

## Mapping

1. Since you cannot create a map within the simulation environment, you need **map.png** and **map.yaml** files.

> Note) File generation process on the actual vehicle:
> 1. Run `roscore`
> 2. Launch vehicle sensors (LIDAR, IMU, VESC) with `roslaunch stack_master low_level.launch`
> 3. Generate files with `roslaunch stack_master mapping.launch map:=map_name create_map:=true` (drive one lap around the closed-loop map)
{: .prompt-info }

### File Example

![map.yaml example](/assets/img/posts/racing-stack-simulation-test/map-yaml-example.jpg)

| Field | Description |
|-------|-------------|
| image | Filename |
| resolution | 1 pixel = 0.05m |
| origin | Map origin point |
| occupied_thresh | Obstacle detection threshold |
| free_thresh | Free space detection threshold |
| negate | Image inversion flag |

2. Calculate the optimal path based on the map.

```bash
roslaunch stack_master mapping.launch map:=map_name create_map:=false create_global_path:=true
```

- Extract centerline based on map.png

![Centerline extraction](/assets/img/posts/racing-stack-simulation-test/image-1.png)

- Set **Speed sector** for speed tuning per section

![Speed sector settings](/assets/img/posts/racing-stack-simulation-test/image-2.png)

- Set **Overtaking sector** to define overtaking allowed zones

![Overtaking sector settings](/assets/img/posts/racing-stack-simulation-test/image-3.png)

Three files are generated in the end.

> - `global_waypoints.json`: Optimal path and speed profile
> - `speed_scaling.yaml`: Speed limits per section
> - `ot_sectors.yaml`: Overtaking allowed zones
{: .prompt-tip }

## Head to head

1. Launch the simulation environment.

```bash
roslaunch stack_master base_system.launch map:=map_name sim:=true
```

2. Enable obstacle detection, driving state judgment, and vehicle control functions.

```bash
roslaunch stack_master headtohead.launch perception:=false
```

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-simulation-test/demo-headtohead.mp4" type="video/mp4">
</video>

## Obstacle

### 1. Static obstacle avoidance

You can create **static obstacles** using `Publish Point` in rviz.

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-simulation-test/demo-static-obstacle.mp4" type="video/mp4">
</video>

The system detects the static obstacle and generates an avoidance path, showing collision-free obstacle avoidance.

### 2. Dynamic obstacle overtaking

You can create a **dynamic obstacle** that travels along the optimal path at a slower speed (0.4x).

```bash
roslaunch obstacle_publisher obstacle_publisher.launch speed_scaler:=0.4
```

<video controls width="100%">
  <source src="{{ site.baseurl }}/assets/img/posts/racing-stack-simulation-test/demo-dynamic-obstacle.mp4" type="video/mp4">
</video>

The system detects the dynamic obstacle and generates an overtaking path, demonstrating successful overtaking behavior.

## Conclusion

This guide covered how to test Racing-Stack in a simulation environment.

- You can verify racing-stack logic using simulation.
- You can generate map-based driving data (optimal path, speed profile, overtaking zones).
- You can test virtual obstacle scenarios (static obstacle avoidance and dynamic obstacle overtaking).

We recommend thoroughly verifying in simulation before deploying to the actual vehicle.
