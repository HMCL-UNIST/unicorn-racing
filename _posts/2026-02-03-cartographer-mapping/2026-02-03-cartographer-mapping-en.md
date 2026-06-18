---
title: Mapping Guide with Cartographer
author: hangyo-cho
date: 2026-02-03 11:00:00 +0900
categories: [Software, mapping]
tags: [cartographer, lidar, odometry]
image:
  path: /assets/img/posts/cartographer-mapping/cartographer-mapping-hero.png
lang: en
lang_ref: cartographer-mapping
math: true
---

## Cartographer

![Cartographer Mapping Demo](/assets/img/posts/cartographer-mapping/cartographer-mapping-demo.gif){: width="710" }

### Core Concepts

**Cartographer** is a **real-time SLAM (Simultaneous Localization and Mapping)** system developed by Google.

### Key Features

| Feature | Description |
|---------|-------------|
| **Real-time** | Online mapping, immediately usable |
| **Loop Closure** | Automatically recognizes same location → drift correction |
| **Sensor Fusion** | Integrates LiDAR + IMU + Odometry |
| **2D/3D Support** | 2D (planar) and 3D (spatial) mapping |
| **Submap-based** | Efficiently manages large maps by dividing into small submaps |

### Basic Operation Principle

```
┌─────────────────────────────────────────────────────┐
│ Sensor Data Input                                   │
├─────────────────────────────────────────────────────┤
│  📡 LiDAR Scan  +  🧭 IMU  +  🚗 Wheel Odometry     │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Local SLAM (Real-time Tracking)                     │
├─────────────────────────────────────────────────────┤
│  - Pose Extrapolation (IMU + Odom prediction)       │
│  - Scan Matching (match current scan to submap)     │
│  - Submap creation and update                       │
│  → Fast tracking (10-40 Hz)                         │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Global SLAM (Pose Graph Optimization)               │
├─────────────────────────────────────────────────────┤
│  - Loop Closure Detection (recognize same place)    │
│  - Constraint creation (relationships between submaps) │
│  - Pose Graph Optimization (global optimization)    │
│  → Drift correction, consistent map (periodic)      │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Output                                              │
├─────────────────────────────────────────────────────┤
│  🗺️ Occupancy Grid Map (.png + .yaml)               │
│  💾 State (.pbstream - submaps, poses, etc.)        │
└─────────────────────────────────────────────────────┘
```

### Understanding the Algorithm Based on Paper

The core algorithm of Cartographer is based on the following paper:

> Real-Time Loop Closure in 2D LIDAR SLAM
>
> Wolfgang Hess, Damon Kohler, Holger Rapp, and Daniel Andor
>
> *2016 IEEE International Conference on Robotics and Automation (ICRA)*

### Key Contributions

1. **Submap-based Representation**
   - Divide map into small submaps
   - Each submap is created/optimized independently
   - Memory efficient + fast matching

2. **Branch-and-Bound Scan Matching**
   - Multi-resolution grid pyramid
   - Fast global search (wide search window)
   - Robust to initial guess errors

3. **Pose Graph Optimization**
   - Sparse pose graph (nodes = trajectory poses, edges = constraints)
   - Efficient optimization with Ceres Solver
   - Drift correction with loop closure constraints

4. **Real-time Performance**
   - Local SLAM: Independent, fast (high frequency)
   - Global SLAM: Asynchronous, slow (low frequency)
   - Real-time performance through two-stage separation

### Algorithm Summary (Pseudo Code)

**Local SLAM**:

```python
def LocalSLAM(scan, imu, odom):
    # 1. Pose prediction
    predicted_pose = extrapolator.Predict(imu, odom)

    # 2. Scan matching (with current active submap)
    #    - Fast correlative scan matching (optional)
    #    - Ceres scan matching (continuous optimization)
    optimized_pose = ScanMatch(scan, active_submap, predicted_pose)

    # 3. Insert scan to submap
    active_submap.Insert(scan, optimized_pose)

    # 4. Pass to Global SLAM when submap is complete
    if active_submap.is_finished():
        GlobalSLAM.AddFinishedSubmap(active_submap)
        active_submap = CreateNewSubmap()

    return optimized_pose
```

**Global SLAM**:

```python
def GlobalSLAM():
    # Run periodically (background thread)

    # 1. Loop closure detection
    for new_submap in finished_submaps:
        for old_submap in all_submaps:
            if SpatiallyClose(new_submap, old_submap):
                # Fast correlative scan matching
                match_result = MatchSubmaps(new_submap, old_submap)
                if match_result.score > threshold:
                    # Create constraint
                    AddConstraint(new_submap, old_submap, match_result)

    # 2. Pose graph optimization
    #    Calculate optimal poses satisfying all constraints
    optimized_poses = CeresOptimize(pose_graph, constraints)

    # 3. Update submaps and trajectories
    UpdateSubmapPoses(optimized_poses)
```

**Pose Graph Optimization**:

$$
\mathbf{X}^* = \arg\min_\mathbf{X} \sum_{ij \in \mathcal{C}} \rho\left( \mathbf{e}_{ij}(\xi_i, \xi_j) \right)
$$

where:
- $\mathbf{X} = \{\xi_1, \ldots, \xi_N\}$: All poses
- $\mathcal{C}$: Constraints (intra-submap, inter-submap, loop closures)
- $\mathbf{e}_{ij}$: Residual (difference between measured and predicted values)
- $\rho$: Robust cost function (Huber loss)

**Scan Matching Cost**:

$$
C(\xi) = \sum_{p_i \in \mathcal{P}} \left(1 - M(\xi \circ p_i)\right)^2 + w_t \|\Delta t\|^2 + w_r \|\Delta r\|^2
$$

where:
- $\xi$: Pose to optimize
- $\mathcal{P}$: Scan points
- $M$: Occupancy probability grid (bilinear interpolation)
- $w_t, w_r$: Regularization weights

---

## Modified Cartographer

The UNICORN racing team modified Cartographer to optimize for **high-speed driving environments and tracks**.

### Modification #1: Exclude Wheel Odometry from PGO

#### Background Problem

- **High-speed Racing Environment**:
  - Frequent rapid acceleration/deceleration
  - Wheel slip occurs (especially on low-friction surfaces)
  - Wheel odometry accuracy varies significantly depending on traction

- **Original Cartographer**:
  - Uses wheel odometry for two purposes:
    1. Pose extrapolation (velocity reference)
    2. Pose graph optimization (constraint)

- **Problem**:
  - When inaccurate wheel odometry enters PGO
    - It actually worsens optimization results
    - Localization drift increases

#### Solution

**Exclude wheel odometry from PGO, use only as velocity reference**

```cpp
// Modified: trajectory_builder.lua
options.use_odometry = false  // ← Excluded from PGO

// Still remap in launch file
<remap from="odom" to="/vesc/odom" />  // ← Used as velocity reference
```

**Effect**:

- **Before (Original Cartographer)**:
  - Wheel slip occurs
    - Incorrect odometry constraint
    - PGO optimizes in wrong direction
    - Localization drift ⬆️

- **After (UNICORN Modified)**:
  - Wheel slip occurs
    - Odometry used only as velocity reference (extrapolation)
    - PGO uses only LiDAR + IMU
    - Robust optimization
    - Map quality ⬆️

### Modification #2: Adaptive Wheel Odometry

In low-friction conditions (e.g., tire wear, marble floor, dust):
- Wheel slip ⬆️
- Wheel odometry ≠ Actual velocity
- Pose extrapolation inaccurate
- Scan matching initial guess worsens

#### Solution

> For detailed information, see the [Adaptive Wheel Odometry Guide]({{ site.baseurl }}/posts/adaptive-wheel-odometry/).
{: .prompt-info }

---

## Mapping Guide

### Execution

#### Method 1: Full Mapping Pipeline

UNICORN's `mapping.launch` performs mapping + raceline optimization together.

```bash
# Launch sensor and joystick nodes
roslaunch stack_master low_level.launch

roslaunch stack_master mapping.launch \
  map:=map_name \
  create_map:=True \
  create_global_path:=False

# When mapping is complete, press y and enter >> then exit with ctrl + C.
```

#### Method 2: Rosbag Playback (Offline Mapping)

```bash
# If rosbag was recorded beforehand:
rosbag play ~~~.bag --clock

roslaunch stack_master bag_mapping.launch \
  map:=map_name

# When mapping is complete, press y and enter >> then exit with ctrl + C.
```

### Driving Strategy and Tips

Drive around the entire track at least 2 times.

**Driving Tips**:
- Try to drive along the track's **Centerline** as much as possible.
- Be careful to avoid sudden steering.
- If significant drift occurs during mapping, try starting the mapping from a **winding or complex area**.

---

## Summary

Cartographer is a real-time SLAM system developed by Google that performs efficient mapping with a 2-stage structure of Local SLAM and Global SLAM.

Key points summarized:
- **Submap-based**: Efficiently manages large maps by dividing into small submaps
- **Loop Closure**: Automatically recognizes the same location to correct drift
- **Modified Cartographer**: The UNICORN team improved map quality by excluding Wheel Odometry from PGO for high-speed driving environments

To create high-quality maps, it is important to drive around the entire track at least 2 times and drive stably along the Centerline.
