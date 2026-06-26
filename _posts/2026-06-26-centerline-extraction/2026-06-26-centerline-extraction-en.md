---
title: "Extracting Centerline and Track Boundaries from a Map Image"
date: 2026-06-26 14:30:00 +0900
categories: [Software, planning]
tags: [mapping, centerline, global-planning, opencv]
lang: en
lang_ref: centerline-extraction
math: true
---

> `centerline_extractor.py` · `gb_optimizer` package

The first step of the global planning pipeline: it converts a SLAM-built map image into track data that the optimizer can use.

## Goal

- **Map → track conversion**: automatically extract the drivable track's **centerline** and **both walls (boundaries)** from the black-and-white occupancy grid image produced by SLAM.
- **A format the optimizer uses directly**: save the result as `centerline.csv` (x, y, left/right track width) and `boundary_{left,right}.csv`, so the next stage `trajectory_optimizer` can immediately optimize the global line.
- **Virtual-wall support**: with `[map]_modi.png` you can deliberately steer the global line along a chosen path, while the real wall boundary is still extracted from the original map for safety checking and avoidance-path clamping.

## Overview

The starting point of path planning is knowing "where the track is relative to the car." The only input is a single black-and-white image from SLAM (`slam_toolbox`, Cartographer, etc.), which has no coordinate frame, no track center, and no width information. `centerline_extractor` processes this image to produce:

1. **Centerline** — a closed curve down the middle of the track (the optimizer's reference line and the origin of the $s$ coordinate)
2. **Track width** — distance from each centerline point to the left/right wall (`w_tr_left`, `w_tr_right`)
3. **Wall boundary** — the real left/right wall contours (for safety checking and avoidance clamping)

This node **runs once and exits**. It runs once right after mapping to generate the CSVs, after which `trajectory_optimizer` reads them to optimize the global line.

## Step 1 — Load the map and align coordinates

Read metadata from `<map>.yaml`. These three values are everything for the pixel↔meter conversion.

| Parameter | Meaning |
|---|---|
| `resolution` | Real size of one pixel [m/px] |
| `origin` | World coordinate of the map's **bottom-left** (x, y) |
| `occupied_thresh` | Brightness threshold for "occupied" (default 0.65) |

The image frame has its origin at **top-left** with y increasing downward, whereas the ROS map frame has its origin at **bottom-left** with y increasing upward.

```python
img = cv2.flip(img, 0)   # vertical flip: image top-left → ROS bottom-left
```

The conversion from pixel (col, row) to meters is ($r$=resolution, $(o_x, o_y)$=origin):

$$
x_{m} = \mathrm{col} \cdot r + o_x, \qquad y_{m} = \mathrm{row} \cdot r + o_y
$$

### The `[map]_modi.png` mechanism (2-pass)

When you want to steer the global line along a specific path (e.g. force a line through a chicane), make a `<map>_modi.png` with **virtual walls painted** onto the original map (using a tool like GIMP).

- If `_modi.png` exists → the **centerline and track width** are extracted from this modified image (the narrowed width tightens the QP deviation constraint and steers the desired line)
- The **real wall boundary** is always extracted from the original `<map>.png` (boundaries and safety checks must be based on the real walls)
- The `yaml` `image:` (the original used for localization) is never touched

```python
modi_path = os.path.join(self.map_dir, f'{self.map_name}_modi.png')
use_modi = os.path.exists(modi_path)
img_path = modi_path if use_modi else os.path.join(self.map_dir, map_data['image'])
```

## Step 2 — Binarization and morphological opening

To extract the skeleton, first clean up "where is drivable" into crisp black and white.

**Binarization**: pixels above the threshold (free space) become white (255), the rest black (0).

```python
threshold = int(occupied_thresh * 255)
bw = np.where(img > threshold, 255, 0).astype(np.uint8)
```

**Opening**: erosion followed by dilation removes small white noise while preserving large shapes ($A$=binary image, $K$=9×9 kernel, $\ominus$=erosion, $\oplus$=dilation).

$$
A \circ K = (A \ominus K) \oplus K
$$

```python
kernel = np.ones((9, 9), np.uint8)
opening = cv2.morphologyEx(bw, cv2.MORPH_OPEN, kernel, iterations=1)
```

> ⚠️ The `9×9` kernel size is sensitive to map resolution. If the track is thin or the resolution is high, a large kernel can close off narrow corridors.
{: .prompt-warning }

## Step 3 — Skeletonization

Thin the filled drivable area down to a **1-pixel-thick centerline**, keeping only the "medial axis" farthest from the boundary while preserving shape and connectivity.

```python
from skimage.morphology import skeletonize
skeleton = skeletonize(opening, method='lee')
```

`method='lee'` is a stable thinning algorithm that preserves topology, so it builds the skeleton without breaks on closed-loop shapes.

## Step 4 — Centerline extraction (pick the shortest closed curve)

The skeleton may yield several contours (track loop, noise branches, etc.). We want **the single shortest closed curve that goes around the track once**. Find them with `cv2.findContours`, then keep only the closed ones via the hierarchy.

```python
contours, hierarchy = cv2.findContours(
    skeleton_img, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)

closed_contours = []
for i, cont in enumerate(contours):
    opened = hierarchy[0][i][2] < 0 and hierarchy[0][i][3] < 0
    if not opened:
        closed_contours.append(cont)
```

Compute each closed contour's perimeter in meters and choose the **shortest** as the centerline ($r$=resolution, $\Delta x_k, \Delta y_k$=pixel displacement between adjacent points).

$$
L = r \sum_{k} \sqrt{(\Delta x_k)^2 + (\Delta y_k)^2}
$$

## Step 5 — Smoothing and direction alignment

**Savitzky-Golay smoothing**: it least-squares fits a cubic polynomial within a sliding window, so unlike a simple moving average it **preserves curvature** at corners while removing the staircase jaggedness.

```python
smooth = savgol_filter(centerline, filter_length, 3, axis=0)
```

**Direction alignment (CCW/CW)**: to keep the raceline optimization and the $s$ coordinate's travel direction consistent, the rotation direction must be fixed. The **shoelace formula** gives the signed area.

$$
A = \frac{1}{2}\sum_{i} \left( x_i y_{i+1} - x_{i+1} y_i \right)
$$

$A > 0$ means counter-clockwise (CCW), $A < 0$ means clockwise (CW). If it does not match the `reverse` setting, flip the point order.

## Step 6 — Boundary extraction and left/right classification

Running `findContours` again on the `opening` binary image, the two longest contours are the **inner and outer track walls**. To decide "which is left/right," **vote using the sign of the cross product** of the centerline tangent $\mathbf{t}$ and the vector to the wall $\mathbf{v}$.

$$
\mathbf{t} \times \mathbf{v} = t_x v_y - t_y v_x
$$

If this is negative, that wall is on the **right** relative to the travel direction. A majority vote over several sample points settles it.

## Step 7 — Track width (asymmetric)

The optimizer needs to know **how far left/right it may deviate** at each centerline point. A simple distance transform gives only a symmetric value, so we **project boundary points onto the normal direction** to get left/right widths separately (right normal $\mathbf{n}_r = (t_y, -t_x)$).

```python
normal_r = np.array([tangent[1], -tangent[0]])
proj_n_r = (bound_r - cl_pt) @ normal_r          # projection onto the normal
proj_t_r = np.abs((bound_r - cl_pt) @ tangent)   # distance along the tangent
mask_r = (proj_n_r > min_lateral) & (proj_t_r < window)
w_right[i] = proj_n_r[mask_r].min()
```

- **Tangent-direction window (`window=2.0m`)**: only look at walls near the point (prevents catching the far straight on the opposite side)
- **Median filter (size=15, wrap)**: clean spiky values in the width profile on a closed-loop basis
- **Lower clamp (0.15m)**: prevent the width from going to zero and diverging the optimizer

## Step 8 — CSV output

Save the final result as two kinds of CSV. This is the **interface** to the next stage.

**`centerline.csv`** — input to `trajectory_optimizer`

```csv
x_m, y_m, w_tr_right_m, w_tr_left_m
12.340000, 3.210000, 0.8500, 0.9200
...
```

**`boundary_left.csv` / `boundary_right.csv`** — for safety checking and avoidance clamping (always the real walls)

```csv
x_m, y_m
11.980000, 2.870000
...
```

## Node lifecycle

```text
[mapping] → centerline_extractor → trajectory_optimizer → global_trajectory_publisher
            (runs once, then exits)  (IQP → SP optimization)  (republishes at runtime)
```

`centerline_extractor` finishes `extract()` in `__init__` and **exits immediately**. This is by design: the launch file's `OnProcessExit` handler uses that exit as the signal to start the next node (`trajectory_optimizer`).

## Wrap-up

`centerline_extractor` refines information step by step — **filled drivable area → 1-pixel skeleton → meter coordinates + width** — turning a single SLAM map into track data the optimizer can use. Once the centerline and boundary CSVs are produced, you can move on to raceline optimization and speed-profile generation.
