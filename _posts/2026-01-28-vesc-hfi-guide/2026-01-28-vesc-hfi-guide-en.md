---
title: VESC HFI (High Frequency Injection) Guide
description: How to configure and use VESC HFI for sensorless motor control
author: jeongsang-ryu
date: 2026-01-28 11:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, HFI, Motor Control, Manual]
image:
   path: /assets/img/posts/vesc_mk6.png
lang: en
lang_ref: vesc-hfi-guide
---

# VESC HFI Guide

## What is HFI?

HFI (High Frequency Injection) is an advanced control technique that lets VESC **track rotor position accurately on sensorless motors**. It works even at very low speed or standstill, so you can achieve precise control without Hall sensors or encoders.

### How HFI Works

HFI injects a high-frequency signal into the motor and analyzes the response to estimate rotor position. This provides several benefits:

- **Zero-speed control**: accurate position control even when stopped or moving very slowly
- **No sensors required**: enables precise FOC (Field Oriented Control) without Hall sensors/encoders
- **Better torque at low speed**
- **Smoother starts** with less cogging

## Types of HFI

VESC provides two HFI modes:

### 1. Standard HFI

Traditional HFI with relatively higher injection frequency.

**Features:**
- High accuracy
- Fast response
- More audible noise

### 2. Silent HFI

Improved algorithm that reduces noise and improves efficiency.

**Features:**
- Lower noise than Standard HFI
- Less motor heating
- Better energy efficiency
- Recommended for most use cases

## How to Configure Silent HFI

### Step 1: Complete FOC setup

Before HFI, complete the standard FOC setup:

1. Run VESC Tool and connect to VESC
2. Go to **Motor Settings** → **FOC**
3. Run **Motor Detection** to identify base parameters

### Step 2: Enable HFI

1. In the **FOC** tab, find the **Sensorless** section
2. Set **Observer Type** to `HFI` or `Silent HFI`
3. Tune the main parameters:

#### HFI Voltage (recommended: 1–4V)
- Voltage of the injected high-frequency signal
- Higher values improve accuracy but increase noise and heat
- Start around **2V** and adjust as needed

#### HFI Frequency (recommended: 10–20 kHz)
- Injection frequency
- Silent HFI is typically **10–15 kHz**
- Standard HFI is typically **15–20 kHz**

#### HFI Gain
- Gain for the HFI algorithm
- Too high → vibration, too low → poor accuracy
- Start around **0.005–0.01**

### Step 3: Test and tune

1. Click **Apply**
2. Click **Write Configuration** to save to VESC
3. Rotate the motor slowly and check behavior
4. Fine-tune if needed

## Notes and Warnings

### 1. Heating

HFI continuously injects high-frequency signals, so **both motor and VESC heat up**.

**Mitigation:**
- Minimize HFI at long idle
- Use proper cooling
- Monitor temperature
- Use Silent HFI to reduce heat

### 2. Noise

The injected signal can create **audible noise**.

**Mitigation:**
- Use Silent HFI
- Reduce HFI Voltage (while keeping accuracy)
- Shift HFI Frequency outside audible range

### 3. Battery drain

HFI consumes current even at standstill.

**Mitigation:**
- Power off when not needed
- Use timeout settings
- Enable HFI only when required

### 4. Motor compatibility

Not all motors are suitable.

**Suitable:**
- PMSM (Permanent Magnet Synchronous Motor)
- BLDC (3‑phase)
- Motors with good sensorless characteristics

**Not suitable:**
- Brushed DC motors
- Induction motors
- Motors with extremely low inductance

## When to Use HFI

### Recommended

1. **Electric skateboard / E‑scooter**
   - Frequent low‑speed starts
   - Smooth acceleration required

2. **Robot joints**
   - Precise position control
   - High torque at low speed

3. **Autonomous vehicles**
   - Accurate motor control is important
   - Sensors are difficult to add

### Not Recommended

1. **High‑speed only applications**
   - Standard sensorless mode is sufficient
   - Unnecessary heat and noise

2. **Battery‑limited use**
   - Extra power consumption is a burden

3. **Motors with Hall sensors already installed**
   - Sensor‑based control is more efficient

## Troubleshooting

### Motor vibrates or shakes

1. Lower HFI Gain (e.g., 0.005)
2. Increase HFI Voltage (e.g., 3V)
3. Run Motor Detection again
4. Check motor wiring

### Unstable rotation at low speed

1. Increase HFI Voltage
2. Adjust HFI Frequency
3. Recheck FOC parameters
4. Re‑measure resistance and inductance

### Noise is too loud

1. Use Silent HFI instead of Standard HFI
2. Minimize HFI Voltage
3. Increase HFI Frequency (e.g., 20 kHz+)

### Motor overheating

1. Switch to Silent HFI
2. Reduce HFI Voltage
3. Improve cooling
4. Disable HFI during long idle periods

## Additional Resources

### Official docs & forums
- [VESC Project Forum](https://vesc-project.com/)
- [VESC GitHub Repository](https://github.com/vedderb/bldc)

### Related posts
- [Firmware Upgrade]({{ site.baseurl }}/posts/vesc-firmware-upgrade)
- [VESC Tool Download & Installation]({{ site.baseurl }}/posts/vesc-tools-download)

### Recommended video

VESC Silent HFI overview:

{% include embed/youtube.html id='H-6qzmeCNtw' %}

This video demonstrates how Silent HFI works and how to configure it.

## Conclusion

HFI can greatly improve sensorless motor control performance, but it also introduces heat, noise, and power consumption. **Silent HFI** reduces many of these downsides and is recommended for most applications.

Consider your use case and tune parameters carefully to achieve the best performance.

## References
