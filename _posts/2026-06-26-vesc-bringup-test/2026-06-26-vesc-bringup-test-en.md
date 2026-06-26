---
title: "VESC Bring-up: Port Setup and Motor/Servo Check"
author: jeongsang-ryu
date: 2026-06-26 14:00:00 +0900
categories: [build, advanced]
tags: [vesc, motor, servo, bringup]
lang: en
lang_ref: vesc-bringup-test
---

After wiring is done, and before actually driving, this step **verifies that the VESC is recognized and that the motor and servo behave as intended.**

## 1. Port configuration

Set the serial port the VESC is connected to in the car config.

`~/unicorn_ws/src/unicorn-racing-stack/stack_master/config/{CAR}/vehicle_config.yaml`

```yaml
vesc/**:
  ros__parameters:
    port: "/dev/ttyACM0"
```

## 2. Launch the driver and verify recognition

Bring up the VESC driver with the low-level launch file.

```bash
ros2 launch stack_master low_level.launch.xml
```

When recognized correctly, a log line confirming the hardware is paired appears:

```text
[vesc_driver_node-1] [INFO] [...] [vesc.vesc_driver_node]: -=60_MK6=- hardware paired 0
```

Check that state is arriving on the sensor topic:

```bash
ros2 topic echo /vesc/sensors/core
```

```text
state:
  voltage_input: 16.3
  duty_cycle: 0.001
  fault_code: 0
  controller_id: 120
  ...
```

If `voltage_input` is close to the battery voltage and `fault_code: 0`, it is healthy.

## 3. Motor check

> Keep the **car lifted on a stand** so the wheels do not touch the ground.
{: .prompt-warning }

With the low-level launch running, publish a motor speed command from another terminal.

```bash
ros2 topic pub -r 20 /vesc/commands/motor/speed std_msgs/msg/Float64 "{data: 8000.0}"
```

If the wheels spin in the **wrong direction**, **swap two of the three motor wires**.

## 4. Servo (steering) check

Check steering with servo position commands.

```bash
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.2}"
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.5}"
ros2 topic pub -r 20 /vesc/commands/servo/position std_msgs/msg/Float64 "{data: 0.8}"
```

The sign convention is **0 = neutral, + = left, − = right**.

- If a small value like `0.2` turns the wheels to the **left**, you need to **invert the sign** of the steering gain.
- If alignment is off at `0.5`, you may need to remove and re-seat the servo horn. See [Why you should attach the servo horn after alignment]({{ site.baseurl }}/posts/servo-horn-after-alignment/) for details.

## Wrap-up

This post covered bringing up the VESC in order: (1) port configuration → (2) launch and verify recognition → (3) check motor direction → (4) check servo direction and neutral. Once this all works, you can move on to ERPM/steering-gain calibration and PID tuning.
