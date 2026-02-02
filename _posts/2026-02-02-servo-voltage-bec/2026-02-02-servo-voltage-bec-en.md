---
title: Importance of Servo Motor Input Voltage and How to Use a BEC
author: yunho-lee
date: 2026-02-02 16:00:00 +0900
categories: [build, advanced]
tags: [bec, servo, vesc]
image:
  path: /assets/img/posts/servo-voltage-bec/b210-servo.png
lang: en
lang_ref: servo-voltage-bec
---

Servo motors produce different torque and speed outputs depending on the input voltage. When driving a servo using only the VESC PPM port, it may not achieve maximum performance. Using a BEC to supply the proper voltage is important.

## Servo Motor Specifications by Voltage

Each servo motor has specific operating voltages with corresponding speed and torque ratings. Taking the **[HIGHEST] B210 Brushless SERVO** as an example, the specifications are as follows:

![B210 Spec](/assets/img/posts/servo-voltage-bec/b210-spec.png)

The torque and speed output vary depending on the input voltage, with higher voltage yielding better performance.

The stock servo motor provided with Traxxas vehicles also has Max Voltage with corresponding torque and speed output specified:

![Traxxas Servo Spec](/assets/img/posts/servo-voltage-bec/traxxas-servo-spec.png)

**Specifications:**
- **Torque:** 125 oz-in
- **Speed:** 0.17 sec/60°
- **Max Voltage:** 6V (NiMh)

## Limitations of the VESC PPM Port

When connecting all three servo wires (GND, +, Signal) to the VESC PPM port, the servo motor cannot operate at its full capacity.

![VESC PPM Port](/assets/img/posts/servo-voltage-bec/vesc-ppm-port.png)

The VESC PPM port outputs only **5V**, which falls short of the **[HIGHEST] B210 Brushless SERVO**'s maximum spec of **7.4V**. This results in slower rotation speed and insufficient torque from the servo motor.

> When comparing a servo connected directly to the VESC PPM port versus one powered at 7.4V through a BEC, the difference in vehicle performance is noticeable.
{: .prompt-info }

## Solution: Using a BEC

By using a BEC (Battery Eliminator Circuit) to supply the proper voltage (e.g., 7.4V) directly to the servo motor, you can utilize its maximum torque and speed. In this configuration, only the Signal wire is connected to the VESC PPM port, while power is supplied separately from the BEC.

> Stronger servo torque is not always better. On slippery surfaces, strong torque with irregular control inputs can actually reduce driving stability and cause the vehicle to spin.
{: .prompt-warning }

## Conclusion

This post introduced the importance of supplying proper voltage to the servo motor and how to use a BEC. Since the VESC PPM port (5V) alone cannot meet the maximum specifications of high-performance servos, supplying voltage matching the servo's spec through a BEC is effective for improving performance. However, excessive torque can compromise stability depending on driving conditions, so adjust accordingly.