---
title: "Pure Pursuit Steering and Speed Control: Extension Modules on Top of Plain PP"
date: 2026-06-27 11:00:00 +0900
categories: [Software, control]
tags: [control, pure-pursuit, path-following, lookahead, friction-circle]
lang: en
lang_ref: pure-pursuit
math: true
---

> `pp_heading_controller.py` · `pp_heading_params.yaml`
>
> The runtime controller that turns the global planning raceline into actual steering and speed commands.
{: .prompt-info }

## Goals

- **Follow the active path**: take the **current path (`/local_waypoints`)** the car must follow at each moment and compute the steering angle and target speed. Normally this path is the global line, but with an obstacle it becomes an avoidance spline.
- **Plain Pure Pursuit as the skeleton**: keep geometric Pure Pursuit as the base steering law, and lay **adaptive lookahead, understeer compensation, a heading PID, and friction-circle speed/accel control** on top so the line is tracked stably even at high speed.
- **50 Hz real-time loop**: a single control cycle computes everything from "find the nearest point → lookahead point → steering → speed."

## Overview — where following control sits

Pure Pursuit is the stack's **online, real-time** controller. Taking the car's current state (odometry) and **the path it must follow now (`/local_waypoints`)**, it decides **every 50 Hz** "which way and how much to turn right now, and how hard to push."

The key here is that Pure Pursuit **doesn't care where the path comes from**. The incoming `/local_waypoints` varies by situation.

- **Normally**: the raceline made by global planning (the IQP line)
- **When an obstacle is detected**: a detour generated via local planning, e.g. an avoidance spline

Pure Pursuit doesn't distinguish the two — it's a **general-purpose follower that follows whatever path comes in**. "Which path to follow" is decided by the higher-level module (`state_machine`); Pure Pursuit is responsible only for "how to follow that path well."

```text
[path decision]   global raceline  ─┐
                  avoidance spline  ─┼→ state_machine → /local_waypoints
                                     ┘
[following]       /local_waypoints → ★Pure Pursuit★ → /ackermann_cmd → vehicle
```

## Main: plain Pure Pursuit

### Geometric principle

Pure Pursuit is the simplest and most robust path-following algorithm. The intuition: **take a point on the path a fixed distance (lookahead distance, $l_d$) ahead of the car as the "target point," and compute the steering angle to trace an arc toward that point.**

If the vehicle (bicycle model) follows the arc through the target point, that arc's curvature is determined by the target point's lateral coordinate ($l_y$) and distance ($l_d$) in the vehicle frame.

$$
\kappa_{pp} = \frac{2\, l_y}{l_d^{2}}
$$

where $l_y$ is the target point's lateral offset relative to the car and $l_d$ is the distance to it. This curvature is converted to a steering angle via the bicycle model.

$$
\delta_{geo} = \arctan\!\left( L \cdot \kappa_{pp} \right)
$$

```python
# transform the target point into the vehicle frame (lx_v: forward, ly_v: lateral)
lx_v =  dtx * cos_y + dty * sin_y
ly_v = -dtx * sin_y + dty * cos_y
dist = math.hypot(lx_v, ly_v)

kappa_pp  = 2.0 * ly_v / (dist * dist)              # curvature to the target point
delta_geo = math.atan(self.wheelbase * kappa_pp)    # → steering angle
```

It first finds the nearest waypoint (searching only ~30 around the previous index for speed), then advances along the path by $l_d$ to pick the target point.

```python
nearest_idx = ...   # nearest point around the previous index
target_idx  = self._advance(nearest_idx, ld + extra, ...)  # advance by ld
```

That's the main algorithm. From here on are the **extension modules** layered on top, each presented from the angle of "what limitation it was added to address."

## Extensions

### Module 1 — Adaptive Lookahead

**The limitation**: a fixed lookahead pins the following behavior to one extreme. **Short** hugs the path tightly but oscillates at high speed; **long** is smooth but cuts corners. So a single fixed value can't satisfy low and high speed at once.

**What it does**: makes $l_d$ **proportional to speed** — a time-headway scheme where the faster you go, the farther you look.

$$
l_d = \mathrm{clip}\left( t_{hw} \cdot v_x,\ l_{d,\min},\ l_{d,\max} \right)
$$

```python
ld = float(np.clip(self.t_headway * vx, self.ld_min, self.ld_max))
```

| Parameter | Value | Meaning |
|---|---|---|
| `t_headway` | 0.3 s | $v_x \to l_d$ gain (how far ahead in time) |
| `ld_min` | 0.6 m | minimum lookahead |
| `ld_max` | 2.5 m | maximum lookahead |

### Module 2 — Understeer Feedforward

**The limitation**: in high-speed corners the tire actually turns less by the slip angle (understeer); correcting this only with after-the-fact feedback responds too late.

**What it does**: a feedforward term that **adds steering in advance** proportional to the expected lateral acceleration.

$$
\delta_{us} = k_{us} \cdot a_{lat,geo}, \qquad a_{lat,geo} = v_x^{2}\, \kappa_{geo}
$$

```python
delta_us = self.k_understeer * a_lat_geo
```

If the `k_understeer` parameter is too large, the car digs toward the inside of the corner.

### Module 3 — Residual heading PID

**The limitation**: $\delta_{geo}$ tracks the lookahead point (cross-track + curvature), but the residual where the vehicle heading deviates from the path tangent (from slip/dynamics) remains.

**What it does**: corrects with a PID **only the residual left by pure pursuit** — the angle error $e_h$ between the vehicle heading and the path tangent. The key is using the **path-tangent residual**, not the target-point bearing, so it isn't double-counted with $\delta_{geo}$.

$$
e_h = \mathrm{wrap}\left( \psi_{path} - \psi_{yaw} \right)
$$

$$
\delta_{pid} = K_p\, e_h + K_i \!\int e_h\, dt + K_d\, \dot{e}_h^{\,filt}
$$

```python
e_h = math.atan2(math.sin(psi_n - yaw), math.cos(psi_n - yaw))
delta_pid = (self.heading_kp * e_h + i_term + self.heading_kd * self._he_deriv)
```

| Gain | Value | Role |
|---|---|---|
| $K_p$ | 0.4 | line convergence (larger = converges faster) |
| $K_i$ | 0.0 | removes steady-state error (off by default) |
| $K_d$ | 0.05 | oscillation damping |

- **$K_d$ = yaw-rate damping**: the derivative of the tangent error is itself the yaw-rate term, so it suppresses oscillation without a separate damping term.

### Module 4 — Friction-circle speed/accel control

This is the part most easily confused with global planning, so first the **difference between the two**.

> **Where the friction circle comes from — planning vs control**
>
> The friction circle ($a = \mu g$) also appears in global planning, but **the timing and target differ.**
>
> - **Global planning (offline)**: uses the friction circle from `ggv.csv` to compute the raceline's *shape* and its *$v_x$ profile*, once.
> - **Pure Pursuit (runtime)**: uses the same physics' friction circle to *clamp* the steering curvature and target speed every 50 Hz, **whatever path is being followed now**.
>
> So the controller's friction circle isn't tied to a specific line — it's a general safeguard that limits the car in real time, on the current active path, so it doesn't slip. It works the same when following an avoidance spline.
{: .prompt-info }

**Friction-circle allocation**: the total grip $a_{total,max}$ is split between lateral and longitudinal. The essence of the friction circle is that using a lot of lateral grip in a corner leaves less longitudinal grip for acceleration. $a_{lat,ref}$ is computed from the speed and curvature of the nearest point on the current path.

$$
a_{long,budget} = \min\!\left( a_{long,\max},\ \sqrt{a_{total,\max}^{2} - a_{lat,ref}^{2}} \right)
$$

```python
a_lat_ref     = v_near * v_near * kappa_now
a_long_budget = min(self.a_long_max,
                    math.sqrt(max(0.0, self.a_total_max**2 - a_lat_ref**2)))
```

**Corner speed cap + predictive braking**: at each forward point, it takes the smaller of the max speed the curvature allows and the speed the path gives, and with a **distance-aware backward braking pass** computes "how fast can I go now and still decelerate before that corner."

$$
v_{ref} = \min_{s} \sqrt{\, v_{target}(s)^{2} + 2\, a_{brake,\max}\, \Delta s \,}
$$

```python
v_curve  = np.sqrt(a_lat_use / np.maximum(kappa_win, 1e-3))
v_target = np.minimum(self._vx_wp[v_win], v_curve)   # min of path vx and curvature cap
v_allow  = np.sqrt(v_target**2 + 2.0 * self.a_brake_max * ds)
v_ref    = float(np.min(v_allow))                    # the closer the corner, the more gradual the slowdown
```

**Heading-alignment acceleration gate**: hitting the throttle on corner exit before the car straightens toward the path direction is destabilizing. So a gate suppresses acceleration when the heading error $\lvert e_h\rvert$ is large.

```python
align = (self.yaw_gate_max - abs(e_h)) / (self.yaw_gate_max - self.yaw_gate_min)
if v_ref > vx:
    v_cmd = min(v_ref, vx + a_long_budget * align * self.t_cmd_horizon)  # gate acceleration only
else:
    v_cmd = v_ref                                                         # braking always allowed
```

| Parameter | Value | Meaning |
|---|---|---|
| `yaw_gate_min` | 0.05 rad (~3°) | below: 100% acceleration |
| `yaw_gate_max` | 0.40 rad (~23°) | above: 0% acceleration |

> It gates only acceleration and **doesn't block braking** — an asymmetric design for safety.
{: .prompt-tip }

## I/O / topic wiring

### Subscribe (input)

| Topic | Type | Content |
|---|---|---|
| `/car_state/odom` | `nav_msgs/Odometry` | vehicle position/speed/attitude |
| `/local_waypoints` | `f110_msgs/WpntArray` | the current path to follow (state_machine output) |

> Pure Pursuit subscribes to **`/local_waypoints`**, not `/global_waypoints`. Whether it's the global raceline or an avoidance spline, what `state_machine` finalizes as "the path to follow now" arrives on this topic. Each waypoint carries `x, y, psi_rad, kappa_radpm, vx_mps`, so the controller reads the curvature cap and target speed the same way regardless of source.
{: .prompt-info }

### Publish (output)

| Topic | Type | Content |
|---|---|---|
| `drive_topic` (default `/vesc/high_level/ackermann_cmd`) | `AckermannDriveStamped` | steering angle + target speed |
| `/pp/lookahead` | `Marker` | lookahead point for RViz |
| `/pp_debug` | `Float64MultiArray` | debug ($a_{lat}$, $\delta$ breakdown, $e_h$, $l_d$, $v_{ref}$, etc.) |

### Key parameters (`pp_heading_params.yaml`)

| Group | Parameter | Value |
|---|---|---|
| Vehicle | `wheelbase_L` / `delta_max` | 0.33 m / 0.41 rad |
| Speed | `v_min` / `v_max` | 0.5 / 8.0 m/s |
| Lookahead (Module 1) | `ld_min` / `ld_max` / `t_headway` | 0.6 / 2.5 m / 0.3 s |
| Friction circle (Module 4) | `a_total_max` / `a_long_max` / `lat_safety` | 6.7 / 2.0 m/s² / 0.3 |
| Understeer (Module 2) | `k_understeer` | 0.010 |
| Heading PID (Module 3) | `Kp` / `Ki` / `Kd` | 0.4 / 0.0 / 0.05 |
| Braking (Module 4) | `a_brake_max` / `t_cmd_horizon` | 3.5 m/s² / 0.3 s |
| Alignment gate (Module 4) | `yaw_gate_min` / `max` | 0.05 / 0.40 rad |

## Per-tick summary

What happens in one 50 Hz loop:

1. **Find the nearest waypoint** (search around the previous index)
2. **[Module 1]** compute adaptive lookahead $l_d = \mathrm{clip}(t_{hw} \cdot v_x)$
3. **Pick the target point** by advancing along the path by $l_d$
4. **Steering** $= \delta_{geo}$ (main PP) $+ \delta_{us}$ (Module 2) $+ \delta_{pid}$ (Module 3) → clamp
5. **Speed** = [Module 4] friction-circle allocation → corner cap → backward braking → alignment gate
6. **Publish**: drive command + debug/visualization

```python
delta_cmd = clip(delta_geo + delta_us + delta_pid, ±delta_max)
v_cmd     = (accel: min(v_ref, vx + a_long_budget·align·t_horizon)) or (brake: v_ref)
self._publish_drive(delta_cmd, v_cmd)
```

Pure Pursuit is thus a general-purpose follower that **keeps a proven plain PP as the main and optionally layers extension modules to address its limitations.** When the path is the global raceline it drives fast; when it's an avoidance spline it detours safely — to the controller, both are the same following problem.
