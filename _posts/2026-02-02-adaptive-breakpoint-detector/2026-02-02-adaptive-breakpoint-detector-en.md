---
title: Improving Obstacle Separation Precision with Dual-Stage Clustering
author: hangyo-cho
date: 2026-02-02 13:00:00 +0900
categories: [Software, perception]
tags: [detection, lidar, obstacle]
image:
  path: /assets/img/posts/adaptive-breakpoint-detector/dual-stage-detector-hero.png
lang: en
lang_ref: adaptive-breakpoint-detector
math: true
---

## Design Goal

- **Improved Object Separation Precision**: Apply variable thresholds based on distance and incidence angle to prevent fragmentation of distant objects and ensure detection stability.
- **Geometric Feature Modeling**: Formalize clustered data into rectangular shapes to derive key parameters (position, size, orientation) required for tracking.

---

## Overview

This document describes the evolution of segmentation algorithms and feature extraction methodology for precise detection of moving vehicles using 2D LiDAR data. It covers step-by-step improvements from basic distance-based methods to the adaptive clustering actually applied.

---

## Breakpoint Detector

![Breakpoint Detector](/assets/img/posts/adaptive-breakpoint-detector/breakpoint-detector.png){: width="297" }

Breakpoint Detector (BP) is the most basic method that performs clustering based on the Euclidean distance between adjacent points in a 2D LiDAR point cloud consisting of n points.

- If the distance between two consecutive points $p_{n}$ and $p_{n-1}$ is less than a predefined fixed threshold $D_{max}$, they are classified as the same cluster; if exceeded, a new cluster is created.
- The fixed threshold cannot reflect the characteristic that point density decreases as distance from the LiDAR sensor increases. This causes fragmentation problems where measurements of distant objects are recognized as being divided into different clusters.

$$
\left| p_{n} - p_{n-1} \right| > D_{max}
$$

---

## Adaptive Breakpoint Detector

![Adaptive Breakpoint Detector](/assets/img/posts/adaptive-breakpoint-detector/adaptive-breakpoint-detector.png){: width="232" }

Adaptive Breakpoint Detector (ABP) is an algorithm that dynamically adjusts the threshold $D_{max}$ according to the measurement distance to address the limitations of BP.

- The theoretical maximum distance $r_{n}^{h}$ is calculated considering the sensor's scanning angle, resolution, and incidence angle ($\lambda$) to the object. This is designed so that the threshold increases proportionally as distance increases.
- By adding error variance $\sigma_{r}$ to the geometric distance calculation results considering sensor-specific errors, stability of close-range data is ensured.

$$
D_{max} = r_{n-1} \cdot \frac{\sin(\Delta\phi)}{\sin(\lambda - \Delta\phi)} + \sigma_{r}
$$

---

## Adaptive Breakpoint Detector (Dual-Stage)

![Dual-Stage Clustering](/assets/img/posts/adaptive-breakpoint-detector/dual-stage-clustering.png){: width="624" }

The existing ABP algorithm has been extended to a **Dual-Stage Clustering** approach.

- **1st Stage (Point-to-Point)**: Clusters consecutive points using ABP-based Point-to-Point method.
- **2nd Stage (Point-to-Cluster)**: If the threshold is exceeded in 1st Stage, it is compared against all previously created clusters. When points such as walls are removed during track filtering, the distance between consecutive points of the same object may increase. In this case, if the nearest cluster is within the threshold, it is merged into that group to prevent object splitting.
- **$3\sigma$ Noise Handling** is applied to improve data reliability against LiDAR measurement noise.
- All computations are performed in the **Global Map Frame** to ensure continuity of obstacle detection even during rapid vehicle maneuvers.

---

## Feature Extraction and Output Parameters

![Rectangle Fitting](/assets/img/posts/adaptive-breakpoint-detector/rectangle-fitting.png){: width="345" }

**Search-Based Rectangle Fitting** algorithm is performed to define specific obstacle shapes from segmented clusters.

- Performance scores are calculated for all angle candidates from 0 to 89 degrees to determine the optimal rectangle angle.
- Through the fitting process, the following key feature values are extracted, which become the base data for the tracking stage:
  1. **Position ($x_{corner}, y_{corner}$)**: Corner coordinates or center coordinates of the point closest to the sensor.
  2. **Size ($L_{1}, L_{2}$)**: Width and length information of the extracted rectangle.
  3. **Orientation Angle ($\theta$)**: The heading angle the object is facing.

---

## Parameter-based Obstacle Identification Criteria

The following threshold filters are applied to make final determinations of valid obstacles based on extracted parameters.

| Criteria | Parameter Name | Threshold | Role and Analysis |
|----------|---------------|-----------|-------------------|
| **Data Density** | `min_size_n_` | **10 or more** | Remove floating noise with insufficient point count |
| **Physical Size** | `min_size_m_` | **0.2 m or more** | Filter meaningful vehicle sizes excluding small noise |
| **Physical Size** | `max_size_m_` | **0.5 m or less** | Exclude abnormally large object recognition |
| **Recognition Range** | `max_viewing_distance_` | **Within 9.0 m** | Limit to effective range where data precision is guaranteed |
| **Spatial Constraint** | `GridFilter` | **Track Inside** | Select only objects inside the track by comparing map information |

---

## Summary

Static and dynamic obstacle data extracted through this algorithm is subsequently linked with a Kalman Filter-based tracking module for obstacle path prediction.

Key points summarized:
- **Adaptive Breakpoint Detector**: Dynamically adjusts thresholds according to distance to prevent fragmentation of distant objects
- **Dual-Stage Clustering**: Performs more accurate clustering through two stages of Point-to-Point and Point-to-Cluster
- **Rectangle Fitting**: Extracts obstacle position, size, and orientation using Search-Based algorithm

This technique is used together with Grid Filter to select only valid obstacles inside the track, and is utilized in conjunction with the Tracking module to predict obstacle paths.
