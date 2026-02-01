---
title: VESC Tool Basics
author: jeongsang-ryu
date: 2026-01-04 22:05:27 +0900
categories: [build, beginner]
tags: [vesc, vesc-tools]
image:
  path: /assets/img/posts/vesc-tool-basic-usage/image.png
lang: en
lang_ref: vesc-tool-basic-usage
---

This post covers the basic VESC Tool features and the key things to watch out for.

## Connect VESC hardware to VESC Tool

![VESC Tool connection screen](/assets/img/posts/vesc-tool-basic-usage/image-1.png)

When you connect for the first time, you will see the initial screen shown above.

## Fix permission issues

If you get a permission error when clicking `Connect`, grant port permissions with the command below.

```bash
# Replace the port with your own.
# 666 grants read/write permissions (required for reading status and sending control commands).
sudo chmod 666 /dev/ttyACM0
```

- The same fix applies if you see permission issues in the VESC ROS driver.
- This also works for other USB devices with similar permission errors.
- VESC Tool and the VESC ROS driver cannot be connected at the same time.

> You can also set udev rules to grant permissions automatically by reading the VESC port Manufacturer field. See the [reference](https://github.com/HMCL-UNIST/unicorn-racing-stack/blob/main/INSTALLATION.md#udev-rules-setup) for details.

## VESC Tool basics

![VESC Tool right tab](/assets/img/posts/vesc-tool-basic-usage/right-tab.png)

The right tab in VESC Tool includes the following buttons.

1. **Reconnect last connect**
   - Nearly the same as connecting from the main page.
   - Automatically reconnects the most recently connected device when multiple VESCs are used.
2. **Disconnect**
   - Disconnects VESC from VESC Tool.
3. **Read Motor Configuration**
   - Reads Motor Settings from VESC → VESC Tool.
4. **Read Default Motor Configuration**
   - Resets motor settings to defaults.
5. **Write Motor Configuration**
   - Writes Motor Settings from VESC Tool → VESC.
6. **Read App Configuration**
   - Reads App Settings from VESC → VESC Tool.
7. **Read Default App Configuration**
   - Resets app settings to defaults.
8. **Write App Configuration**
   - Writes App Settings from VESC Tool → VESC.

### Important notes

- Changes in VESC Tool are not applied until you click `Write`.
- If you click `Write` without reading current settings first, you can overwrite existing values.
- Always use `Read` to confirm current settings before applying changes.
- You can save configurations to a file.
- Motor Settings changes motor parameters, and App Settings adjusts Servo output and IMU-related options.

## Wrap-up

Once you understand the `Read` and `Write` flow, VESC Tool becomes much safer to use. Always read current settings before applying changes, and resolve port permission issues first. If needed, set up udev rules for automatic permissions.
