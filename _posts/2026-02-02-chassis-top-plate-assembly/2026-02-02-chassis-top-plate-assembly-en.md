---
title: "Chassis and Top Plate Assembly Guide"
authors: [heedo-kim, yunho-lee]
date: 2026-02-02 21:30:20 +0900
categories: [build, beginner]
tags: [Chassis, wiring]
image:
  path: /assets/img/posts/chassis-top-plate-assembly/chassis-empty.jpg
lang: en
lang_ref: chassis-top-plate-assembly
---

## 1. Required items overview

The photo below shows an empty SRX8 chassis.

The next photo shows the components that will be mounted later.

![Parts overview](/assets/img/posts/chassis-top-plate-assembly/parts-overview.jpg)

The following parts were modified so they can be used in our setup. Most connectors were converted to XT-60.

| ![LiDAR power XT-60](/assets/img/posts/chassis-top-plate-assembly/lidar-xt60.png)<br>LiDAR power cable converted to XT-60. | ![Matek BEC XT-60](/assets/img/posts/chassis-top-plate-assembly/matek-bec-xt60.png)<br>Matek BEC input/output converted to XT-60. |
| --- | --- |
| ![XT-60 to Servo 3pin](/assets/img/posts/chassis-top-plate-assembly/xt60-to-servo.png)<br>XT-60 to Servo 3‑pin connector. | ![XT-60 to Barrel Jack](/assets/img/posts/chassis-top-plate-assembly/xt60-to-barrel.png)<br>XT-60 to 5.5mm × 2.5mm barrel jack. |

Below is the overall wiring diagram. It is for reference only, **do not assemble based on this beforehand.**

![Wiring diagram](/assets/img/posts/chassis-top-plate-assembly/wiring-diagram.png)

## 2. Lower plate machining and VESC mounting

The aluminum lower plate needs additional holes. We chose to mount the VESC directly on the lower plate, so we drilled the mounting holes and installed the VESC based on them.

| ![Lower plate hole positions](/assets/img/posts/chassis-top-plate-assembly/lower-plate-hole.png) | ![VESC mounting position](/assets/img/posts/chassis-top-plate-assembly/lower-plate-vesc.jpg) |
| --- | --- |

If the VESC bolts and nuts are tightened too much, the top plate can deform. Since it must not detach during driving, we used washers to minimize deformation.

![Washer use](/assets/img/posts/chassis-top-plate-assembly/vesc-washer.jpg)

The VESC position overlaps with the shaft area, so you must **check for interference across the actual shaft range**.

## 3. Velcro mount for battery fixing

The photo below shows a structure that uses the lower plate holes to attach Velcro for future battery fixing.

![Velcro mount](/assets/img/posts/chassis-top-plate-assembly/velcro-mount.jpg)

## 4. Servo motor installation

Install the servo as shown below. The small plastic part is a support to remove play caused by servo height and is usually included with the chassis.

![Servo support](/assets/img/posts/chassis-top-plate-assembly/servo-support.png)

| ![Servo installation 1](/assets/img/posts/chassis-top-plate-assembly/servo-mount-1.jpg) | ![Servo installation 2](/assets/img/posts/chassis-top-plate-assembly/servo-mount-2.jpg) |
| --- | --- |

We recommend routing the servo cable **toward the inside**. After wiring, center the servo and then mount the servo horn.

## 5. Top plate assembly sequence

1. Install the DC motor and set the proper gap between the pinion gear and the spur gear.
   - Gap adjustment tip: [{{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/]({{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/)

   ![Motor pinion gear](/assets/img/posts/chassis-top-plate-assembly/motor-pinion.jpg)

2. At this point, the first-stage lower plate assembly is complete. Assemble the standoff bolts for the top plate as shown below.

   ![Standoff bolts](/assets/img/posts/chassis-top-plate-assembly/standoff-bolts.jpg)

3. The top plate will carry the LiDAR, NUC, and IMU. Since the IMU mounts under the top plate, install it first.

   | ![IMU mount position](/assets/img/posts/chassis-top-plate-assembly/imu-mount.png) | ![IMU mount example](/assets/img/posts/chassis-top-plate-assembly/imu-mount-photo.jpg) |
   | --- | --- |

4. Mount the NUC on the top plate. The NUC has two mounting holes, but using only bolts may lift the NUC base. We used **nuts and washers** to create the required spacing.

   | ![NUC mount structure](/assets/img/posts/chassis-top-plate-assembly/nuc-mount.png) | ![NUC spacing](/assets/img/posts/chassis-top-plate-assembly/nuc-spacer.png) |
   | --- | --- |

5. Mount the LiDAR.

   ![LiDAR mounting](/assets/img/posts/chassis-top-plate-assembly/lidar-mount.jpg)

6. Basic chassis assembly is complete. The next steps must be done **together with cable management**.

## Wrap-up

Chassis and top-plate assembly requires careful consideration of wiring, interference, and fastening. Check for mechanical interference, and use washers/spacers to prevent damage while keeping the assembly rigid. After mounting, perform cable management to ensure stable operation.