---
title: "Opponent Trajectory Prediction with Gaussian Processes"
date: 2026-06-26 13:00:00 +0900
categories: [Software, prediction]
tags: [prediction, gaussian-process, frenet, overtaking]
image:
  path: /assets/img/posts/gp-opponent-prediction/overview.png
lang: en
lang_ref: gp-opponent-prediction
math: true
---

`gp_traj_predictor` uses the opponent's motion detected by tracking to **learn the opponent's driving line and generate a future obstacle prediction the planner can use**.

![Opponent motion prediction](/assets/img/posts/gp-opponent-prediction/overview.png)
*The ego car perceives the opponent and predicts its future trajectory*

## Core idea

The key is to handle the opponent's position in the **Frenet frame**. $s$ is the distance traveled along the track, and $d$ is the lateral distance from the reference line. We collect opponent observations as $(s, d, v_s, v_d)$, then use **Gaussian Process Regression (GPR)** to estimate the opponent's line and speed as a function of $s$.

$$
d = f(s) + \epsilon
$$

A GP provides not only the mean prediction but also the **prediction uncertainty**. We include those values as `d_var` and `vs_var` in the message and partially visualize them through the size and color of RViz markers.

## Overall architecture

```text
/tracking/obstacles
/car_state/odom_frenet
/global_waypoints
        |
        v
opponent_trajectory.py
        |  publishes /proj_opponent_trajectory
        v
gaussian_process_opp_traj.py
        |  publishes /opponent_trajectory
        v
opp_prediction.py
        |  publishes /opponent_prediction/obstacles
        |  publishes /opponent_prediction/obstacles_pred
        |  publishes /opponent_prediction/force_trailing
        v
planner / state machine
```

| File | Role |
|---|---|
| `opponent_trajectory.py` | Select the opponent from tracking obstacles and build a Frenet observation history |
| `gaussian_process_opp_traj.py` | Interpolate the observation history with GP/CCMA to build the opponent's full trajectory |
| `predictor_opponent_trajectory.py` | Auxiliary recovery prediction when the opponent leaves its known trajectory |
| `opp_prediction.py` | Convert the learned trajectory into a future obstacle sequence for the planner |
| `dynamic_prediction_server.py` | Dynamic parameter node |
| `prediction_node.py` | Common ROS 2 helpers |

## 1. Collecting opponent observations

`opponent_trajectory.py` finds dynamic obstacles in `/tracking/obstacles` and selects the opponent closest to the ego car. The ego car's Frenet state comes from `/car_state/odom_frenet`, and the track length and waypoint information from `/global_waypoints`.

Each observed obstacle is converted into a `ProjOppPoint`. The main fields are:

```text
s, d       : opponent's Frenet position
vs, vd     : Frenet-direction velocities
time       : observation timestamp
s_var etc. : uncertainty passed from tracking
```

The output of this stage is not yet a finished opponent trajectory, but rather a raw/projection history of actual observations placed onto the track.

## 2. GP-based opponent trajectory generation

`gaussian_process_opp_traj.py` takes `/proj_opponent_trajectory` and builds the opponent's full driving trajectory, published on `/opponent_trajectory`. The node mainly estimates two mappings:

```text
s -> d
s -> vs
```

Early on there is no full-lap data for the opponent, so it updates only the observed segments in **half-lap units**; once more than one lap of observations accumulate, it builds a whole-lap trajectory. The speed component $v_s$ is estimated with the GP, while $v_d$ is computed by interpolation. Near the start line, $s=0$ and $s=\text{track\_length}$ are discontinuous, so it duplicates a few meters at the front and back of the list to handle **wrap-around**.

The output message `OpponentTrajectory` contains an array of `OppWpnt`, representing the line the opponent repeatedly drives on the track.

![GP-based opponent trajectory generation](/assets/img/posts/gp-opponent-prediction/gp-trajectory.gif)
*As observations accumulate, the GP estimates the opponent's driving line*

## 3. Recovery prediction when off-trajectory

`predictor_opponent_trajectory.py` is an auxiliary node for when the opponent leaves its known `/opponent_trajectory`. `opponent_trajectory.py` checks whether the current observation differs from the predicted trajectory's $d$ by **more than 0.3 m**; if this persists for several samples, it publishes `opp_is_on_trajectory = False` on `/proj_opponent_trajectory`.

In that case the auxiliary node blends the following to build part of a new trajectory:

- A few recent opponent detections
- Some of the front waypoints of the existing `/opponent_trajectory`

In other words, even if the opponent leaves its known line, it is not assumed to drive straight forever — after some distance it is assumed to **return to the existing racing line**. The $d$ of this segment is predicted with the GP and `/opponent_trajectory` is republished.

## 4. Future obstacle prediction for the planner

`opp_prediction.py` (node name `/opponent_propagation_predictor`) converts the learned `/opponent_trajectory` into a **future obstacle sequence** the planner can use directly.

When the opponent is judged to be on the learned trajectory, it starts from the current opponent position and propagates forward by `time_steps`. At each step it finds the waypoint in `/opponent_trajectory` closest to the current $s$ and uses that waypoint's `proj_vs_mps` and `d_m` to build a future obstacle.

When the opponent has strayed far from the learned trajectory, or the lap count is still below 1 (not yet sufficiently learned), it behaves more **conservatively**: it builds a prediction that interpolates gradually from the current opponent $d$ toward the centerline, and publishes `/opponent_prediction/force_trailing = True`.

![Future obstacle prediction for the planner](/assets/img/posts/gp-opponent-prediction/gp-prediction.gif)
*Generating a future obstacle sequence from the learned trajectory*

## Wrap-up

GP-based opponent prediction works in stages: (1) collect opponent observations → (2) learn the full trajectory with a GP → (3) predict recovery when off-trajectory → (4) convert to future obstacles for the planner. By combining the Frenet frame with a GP, it learns the opponent's repeated racing line and provides uncertainty alongside it, producing predictions usable for overtaking planning.
