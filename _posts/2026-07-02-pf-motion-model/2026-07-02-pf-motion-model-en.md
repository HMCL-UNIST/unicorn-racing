---
title: "Particle Filter Localization — Motion Model"
author: hangyo-cho
date: 2026-07-02 12:00:00 +0900
categories: [racing stack, state estimation]
tags: [localization, particle-filter, odometry, motion-model]
image:
  path: /assets/img/posts/pf-motion-model/image.png
lang: en
lang_ref: pf-motion-model
---

The first problem a self-driving car or robot must solve to drive on its own is knowing "where am I on the map right now." But real-world sensors have resolution limits and noise, and motors and drivetrains can't move perfectly either, due to wear and control noise.

This post looks at what kind of algorithm the Particle Filter — chosen to resolve this fundamental uncertainty of robots — is, and organizes the key details of the Motion Model that fills the first slot of the localization stack.

## 1. What Is a Particle Filter

![](/assets/img/posts/pf-motion-model/pf_story1.gif)

In one sentence, a particle filter is an algorithm that "scatters many virtual robots (particles) across the map, keeps only the particles most similar to the real sensor data, and narrows down the position." The key is representing the probability distribution non-parametrically, using a finite set of samples (particles) rather than complex analytic formulas.

Fundamentally, a particle filter consists of a 'Motion Model' that predicts the robot's movement and a 'Measurement Model (or Sensor Model)' that evaluates sensor observations.

While the robot drives, the particle filter endlessly repeats the following three steps:

- Motion update (Motion Model): move all particles based on the robot's movement command (control input / odometry).

- Weight evaluation (Sensor Model): generate a virtual sensor scan at each particle's position, compare it with the real LiDAR observation, and assign a weight according to the posterior probability.

- Resampling: replicate high-weight particles into several copies and eliminate low-weight ones to form a new particle set.

To add one important property: a particle filter can find the answer even from a state where the initial position is completely unknown (Global Localization). Even if the particles are initially spread uniformly across the whole map, as the robot moves and gains sensor data they gradually gather around the real position.

## 2. Why We Chose the Particle Filter

![](/assets/img/posts/pf-motion-model/image-1.png)

There are several alternatives for localization, such as the Extended Kalman Filter (EKF) or deterministic ICP matching. Even so, the key reason we chose the particle filter is that it explicitly handles 'uncertainty' while keeping multiple possibilities open at the same time.

Even in repetitive environments where an algorithm that chases a single coordinate is easily confused, the particle filter offers these strong advantages:

- Maintaining multiple hypotheses: unlike EKF or ICP, it explicitly handles positional uncertainty and tracks several possibilities simultaneously.

- Robustness in similar terrain: even in a hallway with three identical doors, it distributes particles (hypotheses) in front of each door to prevent malfunction.

- Dynamic convergence: as the robot moves and gains new sensor clues, the scattered particles converge strongly onto the single true position.

| Item | EKF-SLAM | ICP matching | Particle Filter (our choice) |
|---|---|---|---|
| Initial-value dependence | High | High (must be near the answer) | Low (Global Localization possible) |
| Uncertainty handling | Limited to a single Gaussian | Limited (deterministic optimization) | Non-parametric distribution, multiple hypotheses |
| Output characteristics | Relatively smooth | Smooth | Probabilistic, dispersed (slight jitter) |
| Environmental adaptability | Limited to linear environments | Needs a static grid map | Very strong in ambiguous, complex structures |

When you must break through an ambiguous driving environment like ours — with large sensor/actuator noise and sometimes insufficient initial-position hints — the probabilistic particle filter becomes the strongest weapon.

## 3. What Wheel Odometry Means in a Racing Stack

So now let's dig deep into the first step, the motion model. Just because the particle filter is strong at global search doesn't mean randomly scattering thousands of particles every frame with no hints — that's a waste of compute.

Here, what serves as the reference point is wheel odometry, combining a wheel encoder and an IMU. In real autonomous racing environments too, such wheel-odometry information is used as a core input when building the motion model. Because odometry provides, in real time, the control input "the car moved roughly this much since the previous frame," the particle filter can efficiently concentrate its hypotheses (particles) near the region where the robot is likely to be, instead of searching the wrong space.

In the demo below, see how wheel odometry moves the particles. Move the translation / rotation sliders to see how the particles move and spread according to the odometry displacement.

<iframe src="{{ site.baseurl }}/assets/img/posts/pf-motion-model/wheelodom.html" title="Wheel odometry interactive demo" loading="lazy" style="width:100%;height:560px;border:1px solid #2a3550;border-radius:8px;"></iframe>

## 4. Odometry Uncertainty and Process Noise

A real racing car doesn't trace its trajectory perfectly by the odometry numbers.

- During high-speed driving and sharp cornering, slippage between tire and road surface is inevitable.

- When acceleration/deceleration is harsh, slip accumulates error in the encoder values.

For this reason, when implementing the motion model, you must not use the deterministic approach of simply adding the odometry displacement to the previous particle position. When applying the straight-line travel distance and the rotation angle, you must sample an independent Gaussian noise for each and add it explicitly.

This noise is a device that mathematically reflects the real physical phenomenon that "as time passes and travel distance grows, the vehicle's positional uncertainty gradually grows in all directions."

## 5. Key Detail: Uncertainty-Parameter Tuning and Particle Behavior

The Gaussian-noise parameter of this motion model is a value that reflects the 'uncertainty of the wheel odometry.' That is, if you expect large odometry error and increase this parameter, the particles spread over a wider range right after the motion update. How you set this value determines the particles' spread radius, and that decides the success or failure of the resampling step.

In the demo below, switch between the three tuning cases (under · over · optimal) with the tabs, and see directly how the relationship between the particle distribution and the actual position (blue dot) changes with the parameter.

<iframe src="{{ site.baseurl }}/assets/img/posts/pf-motion-model/motion-model.html" title="Motion model tuning interactive demo" loading="lazy" style="width:100%;height:620px;border:1px solid #2a3550;border-radius:8px;"></iframe>

### 1) Parameter Tuned Too Small (Underestimation)

- Symptom: the filter overtrusts the odometry sensor. Even after the motion update, the particles don't spread out but move tightly clustered like a single point.

- Problem: the moment the car slips even slightly at a corner, the real vehicle's true position (ground truth) escapes the range of the dense particle distribution entirely. In this state, even after sensor matching and resampling in the next step, not a single particle survives near the answer, so the filter points somewhere completely wrong and diverges.

### 2) Parameter Tuned Too Large (Overestimation)

- Symptom: the filter distrusts the odometry. Every time it goes through the motion-update rate, the particles spread excessively wide in all directions it hasn't even been.

- Problem: because the particles scatter too much, in the resampling step a wide range of particles each take a small share of the weight. In sections where sensor matching can't concentrate the weight perfectly, the particle centroid wobbles around, producing a noisy output — which feeds unstable pose information to the control stack.

### 3) The Optimal Tuning Point (Sweet Spot)

The most ideal tuning spreads the particles just enough to barely envelop the 'maximum slip-error range' the car might experience while driving. With an appropriately sized uncertainty parameter, the particles sufficiently contain the true position without dispersing excessively. In this state, when the sensor recognizes a valid environment (a wall or corner) and assigns weight, the particles densely cluster around the real position after resampling, securing a smooth trajectory that doesn't jump even during high-speed driving.

Of course, compensating for error through parameter tuning is essential, but fundamentally, the more accurate the wheel odometry itself, the far better. If the base odometry is accurate, you can keep the uncertainty parameter small in the first place, which prevents particles from scattering unnecessarily and maximizes compute efficiency and localization stability.

## 6. Wrap-up

In the end, the motion model of a particle filter is the process of acknowledging real-world uncertainty and cleverly spreading the particles by the amount of the odometry error.

How these odometry-based, appropriately spread particles meet the real LiDAR scan data to gain weights and finally converge — and the optimization techniques that solve the compute bottleneck arising in that process — will be continued in the [Measurement Model]({{ site.baseurl }}/posts/pf-measurement-model-en/) post.
