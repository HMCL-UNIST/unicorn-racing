---
title: "2D LiDAR Detection & Clustering: From Breakpoint to Dual-Stage"
author: jeongsang-ryu
date: 2026-07-02 03:00:00 +0900
categories: [racing stack, perception]
tags: [detection, lidar, clustering, breakpoint]
image:
  path: /assets/img/posts/detection-clustering/image.png
lang: en
lang_ref: detection-clustering
math: true
---

During a race we need to track not only the **static obstacles** on the track but also the constantly moving **opponent cars** in real time. This post walks through how to detect such targets with just a single **2D LiDAR**.

## Starting Point: How to Group a LiDAR Pointset

![](/assets/img/posts/detection-clustering/image-1.png)

What a 2D LiDAR gives you is, in the end, a set of points scattered on a plane (a **pointset**). Finding *"which points belong to one object"* is exactly **clustering**.

There are many general-purpose techniques for clustering a pointset.

- **k-means** — partition into a predefined number $k$ of groups

- **DBSCAN** — density-based, robust to arbitrary shapes and noise

- **GMM (Gaussian Mixture Model)** — model as a mixture of several Gaussians

- …

But these methods share one common weakness: **real-time performance**.

Hokuyo-class 2D LiDARs pour out scans at about **40Hz**. The general algorithms above assume the points are **scattered without any order (unordered)**, so they must weigh distance relationships between all points every time.

> The problem is less about "accuracy" and more that "**we aren't using the information we already have**."
{: .prompt-tip }

## The Special Property of a Rotating LiDAR

The key insight is this.

> **A rotating LiDAR's data is already sorted by angle.**

Because the laser rotates in one direction and measures distances sequentially, the points naturally arrive lined up in order of increasing scan angle $\phi$. We get this **ordering for free**.

Points reflected from a single object are also gathered in a **contiguous angular interval**. So instead of searching all points, we only need to check the **distance between the previous point and the current point**. The moment that distance exceeds a threshold is the boundary between objects — a **breakpoint**.

Thanks to this, clustering finishes with just **a single pass over the points ($O(n)$)**, comfortably handling a 40Hz stream. The representative algorithms are the **Breakpoint Detector** and, adapting the threshold with range, the **Adaptive Breakpoint Detector (ABD)**. On top of that, we'll also look at the **Dual-Stage Adaptive Breakpoint Detector**, which handles the over-segmentation caused by real-world outliers.

## 1. Breakpoint Detector

![](/assets/img/posts/detection-clustering/image-2.png)

The simplest starting point. If the distance between two angularly adjacent points exceeds a fixed threshold $D_{max}$, split the object there.

$$
\lVert p_i - p_{i-1} \rVert > D_{max} \quad\Rightarrow\quad \text{New Cluster}
$$

Since it's an $O(n)$ algorithm that scans the points just once, it has plenty of headroom for a 40Hz stream.

The problem is that $D_{max}$ is a **constant**. Since LiDAR points get sparser with range, a threshold that fits nearby objects is **too small for far ones**, chopping a single car into several pieces.

Below is a demo where you can play with the fixed-threshold Breakpoint Detector directly. Move the sliders (angular resolution · noise · min cluster size) or place boxes, and watch how walls and cars split into several pieces at range (over-segmentation).

<iframe src="{{ site.baseurl }}/assets/img/posts/detection-clustering/breakpoint-demo.html" title="Breakpoint Detector interactive demo" loading="lazy" style="width:100%;height:1100px;border:1px solid #2a3550;border-radius:8px;"></iframe>

## 2. Adaptive Breakpoint Detector

![](/assets/img/posts/detection-clustering/image-3.png)

The fix is simple: **grow $D_{max}$ proportionally to range $r$**.

$$
D_{max} = r_{i-1}\cdot\frac{\sin(\Delta\phi)}{\sin(\lambda - \Delta\phi)} + 3\sigma
$$

- $\Delta\phi$ : scan angular interval (angular resolution)

- $\lambda$ : the **worst-case incidence angle** of a detectable surface — a parameter setting how permissive the threshold is

- $3\sigma$ : sensor-noise margin

The formula looks complex, but $\Delta\phi$ is a constant (the sensor resolution) and $\lambda$ is a tuning parameter, so if we treat $\frac{\sin(\Delta\phi)}{\sin(\lambda - \Delta\phi)}$ and $3\sigma$ as tunable values, we can rewrite it as:

$$
D_{max} = a\cdot r_{i-1} + b
$$

That is, it can be understood as adding a range-proportional allowance $a\cdot r_{i-1}$ on top of a fixed breakpoint threshold $b$.

Geometrically, you draw a **circle of radius $D_{max}$** around the previous point and connect the next point to the same object if it falls inside. **The farther away, the bigger the circle**, so sparse distant points are still kept as one object.

In the demo below you can play with the adaptive threshold (ABD) directly. Adjust `λ` (incidence angle) and `σ` to see how the circle (radius $D_{max}$) grows with range, and how distant objects stay unified compared to the fixed threshold.

<iframe src="{{ site.baseurl }}/assets/img/posts/detection-clustering/adaptive-demo.html" title="Adaptive Breakpoint Detector interactive demo" loading="lazy" style="width:100%;height:1100px;border:1px solid #2a3550;border-radius:8px;"></iframe>

## 3. Dual-Stage Adaptive Breakpoint Detector

![](/assets/img/posts/detection-clustering/image-4.png)

In real driving, a car is sometimes not measured continuously by the LiDAR (the over-segmentation problem). For example:

- besides the detection box, the opponent's body is also measured, and a beam passes through empty space, or

- the opponent's detection box is insufficient

At that moment ABD mistakes it for a breakpoint and splits the cluster.

When this happens, it can cause trouble in the tracking module when linking detections between the previous and current frames, and — worse — the **minimum-size filter** (`min cluster size`) that follows deletes the small fragments, so **the whole car disappears**. This is **especially fatal for distant cars** with only a few points.

### The Idea: Split, But Don't Give Up Right Away

The key is to **not immediately create a new object when a breakpoint fires; check once more whether it can be re-attached to an existing object**.

- **Stage 1 (adaptive)** — try to attach to the current cluster with ABD.

- **Stage 2 (re-merge)** — if it was split, find the **nearest endpoint among existing clusters** and, if within a fixed radius $\tau$, **re-merge** there. Only if there's still none, start a new cluster.

```text
for each point p (in angular order, on-track points only):
    if dist(p, current_cluster.endpoint) < D_max(r):     # Stage 1: ABD
        add to current cluster
    else:                                                 # Stage 2: re-merge
        c ← existing cluster with the nearest endpoint
        if dist(p, c.endpoint) < τ:
            add to c and make c the 'current'
        else:
            start a new cluster
```

Stage 2 is essentially **one step of fixed-radius single-linkage over the cluster endpoints**. It stitches back together the fragments briefly split by corners or occlusion, preserving **one car = one cluster**.

## Wrap-up

We covered clustering a 2D LiDAR pointset in $O(n)$ by exploiting the **angular ordering** a rotating LiDAR gives for free. It evolves from the fixed-threshold **Breakpoint Detector** → the range-adaptive **ABD** → the **Dual-Stage** that stitches split fragments back — reducing over-segmentation and preserving "one car = one cluster".

For real-world performance, the following also matter:

- **Hardware** — vehicle hardware and track flatness that keep things close to the 2D assumption
- **map filtering** — good localization performance to filter out static structures such as walls

## References

- [datmo (kostaskonkk/datmo)](https://github.com/kostaskonkk/datmo)
- [TU Delft — Detection and tracking of moving objects (thesis)](https://repository.tudelft.nl/file/File_55415b6d-b835-4390-92df-843ebed8d946?preview=1)
- [Improving obstacle separation with Dual-Stage clustering]({{ site.baseurl }}/posts/adaptive-breakpoint-detector-en/)
