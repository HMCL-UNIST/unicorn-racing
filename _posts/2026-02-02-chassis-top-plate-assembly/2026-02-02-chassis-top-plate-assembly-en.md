---
title: "Chassis and Top Plate Assembly Guide"
authors: [heedo-kim, yunho-lee]
date: 2026-02-02 21:30:20 +0900
categories: [build, beginner]
tags: [Chassis, wiring]
image:
  path: /assets/img/posts/chassis-top-plate-assembly/chassis-top-plate-assembly-hero.png
lang: en
lang_ref: chassis-top-plate-assembly
---

## Parts Preparation

- Empty SRX8 chassis.  
  ![Empty SRX8 chassis](/assets/img/posts/chassis-top-plate-assembly/srx8-empty.jpg)
  *Empty SRX8 chassis*

- All components needed for one car.  
  ![All required parts](/assets/img/posts/chassis-top-plate-assembly/parts-full-set.jpg)
  *Full set of required components*

- Power harnesses are unified to XT-60.  
  ![LiDAR power XT-60](/assets/img/posts/chassis-top-plate-assembly/lidar-power-xt60.png)  
  *LiDAR and BEC inputs/outputs converted to XT-60*  
  ![XT-60 to servo/NUC adapters](/assets/img/posts/chassis-top-plate-assembly/xt60-to-servo-barrel.png)  
  *XT-60 adapters for servo 3-pin and NUC barrel jack*

- The wiring diagram is for understanding only; **do not pre-assemble yet.**  
  ![Overall wiring diagram](/assets/img/posts/chassis-top-plate-assembly/wiring-overview-2026.png)
  *Overall wiring diagram*

## Lower Plate Assembly

### Mounting the VESC

We machined additional holes in the aluminum lower plate for VESC mounting and positioned the VESC using those holes.  
![Lower plate holes](/assets/img/posts/chassis-top-plate-assembly/lower-plate-holes-2026.png)
*Machined holes for VESC mounting*

To prevent the top cover from bending, washers were added so bolts/nuts are not over-tightened.  
![VESC with washers](/assets/img/posts/chassis-top-plate-assembly/vesc-washer-2026.jpg)
*VESC fastened with washers*

> After mounting, we confirmed the driveshaft travel does not interfere with the VESC.
{: .prompt-warning }

### Battery Velcro Strap Mount

Using existing holes, we fixed a Velcro strap so the battery can be secured later.  
![Velcro mount](/assets/img/posts/chassis-top-plate-assembly/velcro-mount-2026.jpg)
*Velcro strap mounted to the lower plate*

### Mounting the Servo Motor

A support piece removes the height gap, and the servo cable is routed inward.  
![Servo support and mount](/assets/img/posts/chassis-top-plate-assembly/servo-support-2026.png)
![Servo mounting example](/assets/img/posts/chassis-top-plate-assembly/servo-mount-2026.png)
*Servo support and mounting example*

Center the servo first, then attach the horn. See [{{ site.baseurl }}/posts/servo-horn-after-alignment/]({{ site.baseurl }}/posts/servo-horn-after-alignment/) for details.

### Motor Installation

Mount the DC motor after setting the gap between the pinion gear and the drivetrain gear.  
![Pinion gear gap](/assets/img/posts/chassis-top-plate-assembly/motor-pinion-2026.jpg)
*Pinion-to-driveshaft gear gap*

Gap adjustment steps: [{{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/]({{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/).

### Standoff Nuts

Once the lower assembly is done, install standoff nuts to support the top plate.  
![Standoff nuts](/assets/img/posts/chassis-top-plate-assembly/standoff-bolts-2026.jpg)
*Standoff nuts installed*

## Top Plate Assembly

### Mounting the IMU

Attach the IMU to the underside of the top plate first.  
![IMU mount](/assets/img/posts/chassis-top-plate-assembly/imu-mount-2026.png)
*IMU mounted under the top plate*

### Mounting the NUC

Align the NUC with the two mounting holes and use a nut/washer stack to prevent the bottom from lifting.  
![NUC mount](/assets/img/posts/chassis-top-plate-assembly/nuc-mount-2026.png)
*NUC mounting with nut/washer stack*

### Mounting the LiDAR

Finally, secure the LiDAR on the top plate.  
![LiDAR mount](/assets/img/posts/chassis-top-plate-assembly/lidar-mount-2026.jpg)
*LiDAR mounted on the top plate*

## Wrap-up

Standardizing power connectors, checking mechanical interference, and setting proper clamping force are all critical for this assembly. Washers protected the VESC housing, and precise alignment/gaps were set for the servo and motor before tightening. After standoffs and top plate installation, finish with tidy cable management to prevent vibration or disconnection during driving.
