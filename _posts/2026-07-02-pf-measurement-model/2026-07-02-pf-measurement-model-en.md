---
title: "Particle Filter Localization — Measurement Model"
author: hangyo-cho
date: 2026-07-02 13:00:00 +0900
categories: [racing stack, state estimation]
tags: [localization, particle-filter, raycasting, amcl, measurement-model]
image:
  path: /assets/img/posts/pf-measurement-model/image.png
lang: en
lang_ref: pf-measurement-model
math: true
---

In the previous post, [Motion Model]({{ site.baseurl }}/posts/pf-motion-model-en/), we spread particles across the map by the amount of the odometry's uncertainty. Now it's time to sort out "which of these scattered particles is actually at my position." The tool for that is the Measurement Model (or Sensor Model).

If the motion model is the process of guessing "where am I roughly?", the measurement model is the process of scoring "how well does the scene in front of me match my guess?".

A robot sees its surroundings through a sensor such as LiDAR. The measurement model predicts the virtual scan data each particle would observe assuming it is at its current pose, and compares it with the data the real robot actually observed.

The more similar the two, the higher the probability that particle is the robot's real position, so it is given a high weight. If the prediction and reality differ, the weight is cut. Only after this process do the particles near the true position survive and cluster together in the following resampling step.

So how do we implement this measurement model?

## 2. The Limits and Compute Bottleneck of Virtual LiDAR Matching (Raycasting)

The most intuitive sensor-model approach we currently use is raycasting: from each particle's virtual pose, cast virtual rays toward the occupancy grid map to compute distances.

The most common raycasting uses the Bresenham or DDA algorithm, which must inspect the grid cells one by one to find the walls, making it very compute-heavy.

- Number of particles: M (e.g., 1000)

- Number of LiDAR rays: N (e.g., 360 per channel)

- Total compute: O(M x N) geometric ray-tracing operations every loop

This is incomparably heavier than a motion-model update. On a single CPU thread, securing real-time performance (at least 20Hz) is nearly impossible.

### Why GPU Builds Are Emphasized on the Jetson Orin

Fortunately, in raycasting the computation of each particle and each ray is perfectly independent — an embarrassingly parallel structure. Building with CUDA-based GPU acceleration on an embedded board with thousands of cores, such as the NVIDIA Jetson Orin, lets you raycast thousands of particles at once, dramatically boosting compute speed.

## 3. A Smart Alternative That Reduces Compute: AMCL's Look-up Table Approach

But what if hardware resources are limited, or you must secure fast compute on CPU alone without a GPU? The official ROS standard package AMCL (Adaptive Monte Carlo Localization) uses an entirely different paradigm — the Likelihood Field / Distance Transform approach.

### Key Idea: Don't Cast Virtual Rays!

Raycasting is heavy because of "the process of traversing the map interior to find walls." So, conversely, what if we pre-compute, for every cell of the map, the distance to the nearest wall (obstacle)?

- Pre-computation (Offline): when loading the map, use a Distance Transform algorithm to bake a Look-up Table into memory holding the distance from each grid cell to the nearest wall.

- Online compute: when the sensor-update loop runs, there's no need to cast virtual rays — just project the endpoint coordinates of the real vehicle's LiDAR scan onto the map relative to each particle's pose.

- Weight matching: read, in O(1), how far the projected endpoint's grid cell is from a wall from the table, and compute the probability (weight).

### The Clear Trade-off Between the Two

| Item | Raycasting (our approach) | Likelihood Field (AMCL approach) |
|---|---|---|
| Online compute | Very high (grid search) | Very low (simple projection + lookup) |
| Memory (RAM) usage | Low (only the base grid map) | Very high (loads a precise distance-field table) |
| Hardware optimization | Optimized for GPU parallel acceleration | Runs in real time on CPU multi-core alone |
| Robustness to dynamic obstacles | Relatively robust (aware of walls behind the map) | Error grows if endpoints hit obstacles not on the map (opponent cars) |

## 4. Various Raycasting Techniques and Their Trade-offs

The virtual-LiDAR matching mentioned above isn't limited to the Bresenham method that scans the grid cell by cell. Depending on hardware and memory constraints, you can apply various optimization techniques:

- Bresenham / DDA: inspects visited cells one by one. Needs no pre-computation and only the map data, but is compute-heavy and has grid-unit precision.

- Ray Marching (Sphere Tracing): pre-computes the distance-transform map once. Jumps through empty space by the minimum distance to a wall at each position, speeding up the search.

- CDDT / PCDDT: generates and compression-stores per-direction look-up tables. Interpolates by looking up two entries, and reduces compute via pruning.

- Giant LUT: bakes results for all x, y, and angle (θ) in advance. Finishes in a single O(1) lookup — the fastest — but entries explode, devouring enormous memory (RAM).

- Segment Analytic: doesn't use a grid; inspects a list of line segments directly. Achieves exact precision independent of grid resolution.

Below you can compare the five raycasting techniques above directly. Switch techniques with the top tabs, and drag the robot or adjust the angle on the canvas to see how the trade-offs of visited cells · pre-computation · memory · precision change.

<iframe src="{{ site.baseurl }}/assets/img/posts/pf-measurement-model/raycasting.html" title="Raycasting techniques interactive demo" loading="lazy" style="width:100%;height:780px;border:1px solid #ccc;border-radius:8px;"></iframe>

## 5. Weight Computation

Once you've generated a virtual LiDAR scan or read distances from the look-up table, it's time to compare with the real LiDAR scan and score it.

Here, the difference between each particle's virtual scan and the real scan is fed into a Gaussian distribution to obtain a probability.

$$
p(o_t \mid \bar{x}_t^i) = \frac{1}{\sigma\sqrt{2\pi}}\, e^{-\frac{(o_t - r^i)^2}{2\sigma^2}}
$$

Here $o_t$ is the actual observation, $r^i$ is the range particle $i$ expects from its pose $\bar{x}_t^i$, and $\sigma$ is the sensor-noise standard deviation. What the formula means is simple: the closer a particle's expected scan is to the real observation, the exponentially larger the weight it receives.

## 6. Resampling and Final Pose

Once weight computation is done, we perform resampling — keeping high-scoring particles and discarding low-scoring ones.

Typically we sample uniformly at 1/M intervals over the cumulative weight distribution. This way, high-weight particles are naturally selected multiple times and replicated into the next generation, while stray particles with near-zero weight are culled and disappear.

After resampling, the surviving particles form a dense cluster around the real robot position. At this point we either pick the most frequently occurring particle position, or compute the expectation of the whole particle distribution, to finalize the robot's estimated pose.

## 7. Wrap-up

In the end, the measurement model is the core process of evaluating countless hypotheses from the LiDAR data (weighting), filtering only the good ones (resampling), and deriving the final answer.

When designing an autonomous racing stack, you must go beyond simply picking a famous algorithm and consider the hardware architecture and the limits of your compute resources. In an environment with a powerful onboard GPU, it's advantageous to advance a raycasting-based stack that maximizes parallelism; in a CPU-centric embedded environment, adopting the distance-transform-based AMCL approach that guarantees O(1) compute — even at the cost of more memory — is the technically smart choice.

## References

- [https://www.youtube.com/watch?v=SRBdpoPl57Q](https://www.youtube.com/watch?v=SRBdpoPl57Q)
