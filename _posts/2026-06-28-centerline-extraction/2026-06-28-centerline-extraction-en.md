---
title: "Extracting the Centerline and Track Boundaries from a Map Image"
author: hyeong-gyun-noh
date: 2026-06-28 10:00:00 +0900
categories: [racing stack, planning]
tags: [centerline, mapping, global-planning, opencv]
image:
  path: /assets/img/posts/centerline-extraction/overview.png
lang: en
lang_ref: centerline-extraction
math: true
---

This converts a single black-and-white occupancy-grid image from SLAM into **track data** (`centerline.csv` + `boundary_left/right.csv`) that the optimizer can use directly. The `centerline_extractor` node in the `planner` package — the first step of the Global Planning pipeline.

> **It produces three things** — ① Centerline (the closed loop down the middle of the track, the reference for the $s$ coordinate) ② Track width (distance from each point to the left/right walls) ③ Wall boundary (the real walls — for safety checks and avoidance clamping)
{: .prompt-info }

## Pipeline at a Glance

![Centerline extraction pipeline](/assets/img/posts/centerline-extraction/pipeline-mermaid.png)

> The key idea is to progressively refine information: **filled drivable region → 1px skeleton → metric coordinates + width**. The binary image splits into two branches (skeleton/centerline and wall boundary), then they meet again at the width computation.
{: .prompt-info }

## Step by Step

### 1. Map Load + Coordinate Alignment

With just `resolution` (m/px), `origin` (bottom-left world coordinate), and `occupied_thresh` from `map.yaml`, the pixel↔meter conversion is complete. Image coordinates have their origin at the top-left, so we flip vertically to match ROS (bottom-left origin).

$$
x_m = \text{col}\cdot r + o_x, \qquad y_m = \text{row}\cdot r + o_y
$$

![Step 1 — map load / coordinate alignment](/assets/img/posts/centerline-extraction/step1-coord.png)

> **Virtual wall (_modi.png) 2-pass** — if `map_modi.png` exists, the centerline and width are extracted from the *modified image* (the narrowed width tightens the QP deviation constraint to guide the line), while the **real wall boundary is always extracted from the original**. The `image:` in the yaml (used for localization) is never touched. Paint it in GIMP.
{: .prompt-warning }

![Painting the virtual wall (_modi.png) in GIMP](/assets/img/posts/centerline-extraction/modi-gimp.png)

### 2. Binarization + Morphological Opening

Pixels above the threshold = white (free space). Opening (erosion → dilation) removes dot noise and protrusions while preserving the larger shape.

$$
A \circ K = (A \ominus K) \oplus K \quad (K = 9\times 9)
$$

> A 9×9 kernel is sensitive to resolution — if the track is thin or high-resolution, it can close off narrow passages.
{: .prompt-warning }

### 3. Skeletonization

Thin the filled drivable region down to a 1px centerline. `skeletonize(opening, method='lee')` — builds the skeleton without breaks on closed loops.

### 4. Centerline Extraction (Shortest Closed Curve)

Use `findContours` to keep only the closed contours, and select the one with the **shortest perimeter** as the centerline (the inner loop is the center line).

$$
L = r \sum_k \sqrt{(\Delta x_k)^2 + (\Delta y_k)^2}
$$

![Step 4 — selecting the centerline contour from the skeleton](/assets/img/posts/centerline-extraction/step4-centerline.png)

### 5. Direction Alignment (CCW/CW)

Use the signed area from the Shoelace formula to determine the rotation direction — positive = CCW, negative = CW. If it doesn't match `reverse`, flip the point order.

$$
A = \tfrac{1}{2}\sum_i (x_i\,y_{i+1} - x_{i+1}\,y_i)
$$

### 6. Wall Boundary Extraction + Left/Right Classification

The two longest contours in the binary image = the inner/outer walls. Left vs. right is decided by majority vote on the sign of the 2D cross product of the centerline tangent $t$ and the wall vector $v$ — negative means it is on the right relative to the direction of travel.

$$
t \times v = t_x\,v_y - t_y\,v_x
$$

![Step 6 — left / right wall classification](/assets/img/posts/centerline-extraction/step6-boundary.png)

### 7. Track Width (Asymmetric)

A plain distance transform only gives a symmetric result → instead we **project wall points along the normal** to get the left/right widths separately. The right normal is $n_r = (t_y, -t_x)$.

| Mechanism | Role |
|---|---|
| Tangent window (window=2.0m) | Only look at nearby walls (prevents false detection of the opposite straight) |
| median filter (size=15, wrap) | Smooth out spikes in the width profile on the closed loop |
| Lower clamp (0.15m) | Prevent width 0 → optimizer divergence |

### 8. CSV Output

`centerline.csv` (x_m, y_m, w_tr_right_m, w_tr_left_m) → input to the trajectory_optimizer. `boundary_left/right.csv` (x_m, y_m) → safety checks and clamping (always the real walls).

## Inputs / Outputs

| Parameter | Default | Description |
|---|---|---|
| map_name | (required) | stack_master/maps/&lt;name&gt;/ directory |
| reverse | False | True for CW (default CCW) |
| output_csv | centerline.csv | output filename |
| show_plots / debug_steps | False | matplotlib debug visualization |

Published topics (RViz, **latched/TRANSIENT_LOCAL** QoS): `/centerline_waypoints/markers` (blue spheres = centerline), `/track_bounds/markers` (green = right / yellow = left). The node runs once and exits → launch's `OnProcessExit` then starts the next node (trajectory_optimizer).

## Running It Yourself with RoboStack

> This stack is based on **RoboStack** (ROS installed via conda, `robostack-jazzy` channel). ROS 2 Jazzy runs in a single conda environment with no system ROS install. `/opt/ros/...` is never sourced.
{: .prompt-tip }

### 0~1. Create the conda + RoboStack Environment

```bash
# Miniforge (conda/mamba) — skip if you already have it
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash "Miniforge3-$(uname)-$(uname -m).sh" && exec $SHELL

# Create the ROS 2 Jazzy environment (environment.yml: robostack-jazzy + conda-forge)
cd ~/unicorn_ws/src/unicorn-racing-stack
conda env create -f environment.yml      # env name: unicorn
```

### 2. Enter the Environment + Build

```bash
source unicorn.sh          # = conda activate unicorn + PYTHONNOUSERSITE=1 + CycloneDDS + workspace
pip install -r requirements.txt
cbuild                     # colcon build (Release) + re-source. Provided by unicorn.sh
```

### 3. Run Centerline Extraction on a Map

```bash
# Place <map>.yaml + <map>.png(.pgm) in stack_master/maps/<map>/
ros2 run planner centerline_extractor --ros-args \
    -p map_name:=<map> \
    -p reverse:=false
# → generates maps/<map>/centerline.csv, boundary_left.csv, boundary_right.csv
```

> To verify: subscribe to `/centerline_waypoints/markers` (blue spheres) and `/track_bounds/markers` (green/yellow) in RViz. With latched QoS, the last markers still show even if you open RViz after the node exits. For debug plots, use `-p show_plots:=true`.
{: .prompt-info }

## Actual Results — What You Get When You Run It

These are the real results from running the command above (`-p map_name:=f`).

**1) Live run log** (RoboStack conda env, `ros2 run planner centerline_extractor -p map_name:=f`):

```
[CenterlineExtractor] Found 2 closed contours
[CenterlineExtractor] Selected contour 1: 90.6m (of 2 contours)
[CenterlineExtractor] Centerline direction: CCW
[CenterlineExtractor] Boundaries: right=1866 pts, left=1538 pts
[CenterlineExtractor] Centerline: 1680 points
[CenterlineExtractor] CSV saved: .../maps/f/centerline.csv
```

**2) Generated file** `stack_master/maps/f/centerline.csv` (first 3 rows):

```
x_m,y_m,w_tr_right_m,w_tr_left_m
1.680903,-4.619021,1.5197,1.5197
1.736227,-4.623181,1.5098,1.5098
1.791922,-4.625915,1.5000,1.5000
```

**3) Debug visualization during the run** (`show_plots`) — ① binary map + skeleton (red) ② centerline over the map ③ metric-coordinate centerline + left/right boundaries. These are figures the node printed live during execution:

![centerline_extractor debug output (live run on map f)](/assets/img/posts/centerline-extraction/run-debug.png)

**4) Track width profile** — the left/right width (`w_tr`) at each centerline point:

![Track width profile](/assets/img/posts/centerline-extraction/result-width.png)

**5) RViz visualization** — the actual screen with `map_server` showing the occupancy grid (`/map`) and the centerline markers published by the node. A blue line (centerline) follows the middle of the white drivable region (the F-shaped track):

![RViz: occupancy grid + centerline markers (live run)](/assets/img/posts/centerline-extraction/rviz-map.png)

> The marker topics are latched (TRANSIENT_LOCAL), so as long as the node is up (spinning), opening RViz shows `/centerline_waypoints/markers` and `/track_bounds/markers` right away.

> The figures and logs above are output from a real live run on map `f` (the F-shaped track) in a RoboStack conda env.
{: .prompt-tip }

## Wrap-up

SLAM black-and-white map → (8 refinement steps) → optimization-ready track data. With a RoboStack conda environment, you can run it in three beats — `conda env create` → `cbuild` → `ros2 run planner centerline_extractor` — with no system ROS. The next step is [**Global Trajectory Optimization**]({{ site.baseurl }}/posts/global-trajectory-optimization-en/) (IQP→SP), which consumes this `centerline.csv`.
