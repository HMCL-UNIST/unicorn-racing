---
title: "샤시 및 상판 부품 체결 가이드"
authors: [heedo-kim, yunho-lee]
date: 2026-02-02 21:30:20 +0900
categories: [build, beginner]
tags: [Chassis, wiring]
image:
  path: /assets/img/posts/chassis-top-plate-assembly/chassis-empty.jpg
lang: ko
lang_ref: chassis-top-plate-assembly
---

## 1. 필요 물품 정리

아래 사진은 아예 비어있는 SRX8 샤시입니다.

아래 사진은 추후 부착할 부품들의 전체 사진입니다.

![부품 전체 사진](/assets/img/posts/chassis-top-plate-assembly/parts-overview.jpg)

아래 사진은 기존 부품을 사용 가능한 형태로 수정한 구성입니다. 대부분 XT-60 커넥터를 사용할 수 있도록 구성했습니다.

| ![라이다 전원 XT-60](/assets/img/posts/chassis-top-plate-assembly/lidar-xt60.png)<br>라이다 전원선을 XT-60 커넥터로 만들었습니다. | ![Matek BEC XT-60](/assets/img/posts/chassis-top-plate-assembly/matek-bec-xt60.png)<br>Matek BEC의 Input, Output 모두 XT-60으로 만들었습니다. |
| --- | --- |
| ![XT-60 to Servo 3pin](/assets/img/posts/chassis-top-plate-assembly/xt60-to-servo.png)<br>XT-60 to Servo 3pin 커넥터입니다. | ![XT-60 to Barrel Jack](/assets/img/posts/chassis-top-plate-assembly/xt60-to-barrel.png)<br>XT-60 to 5.5mm × 2.5mm 배럴 잭입니다. |

아래는 전체적인 배선도입니다. 배선도는 이해를 돕기 위한 사진이니 **미리 조립하면 안 됩니다.**

![전체 배선도](/assets/img/posts/chassis-top-plate-assembly/wiring-diagram.png)

## 2. 하판 가공 및 VESC 장착

알루미늄 하판은 추가 구멍 가공이 필요합니다. 저희는 VESC를 하판에 직접 조립하는 구조를 선택했기 때문에, VESC를 고정할 구멍을 뚫었습니다. 이 구멍을 기준으로 VESC를 설치합니다.

| ![하판 가공 위치](/assets/img/posts/chassis-top-plate-assembly/lower-plate-hole.png) | ![VESC 장착 위치](/assets/img/posts/chassis-top-plate-assembly/lower-plate-vesc.jpg) |
| --- | --- |

VESC와 연결되는 볼트/너트를 너무 강하게 조이면 VESC 상판이 찌그러집니다. 하지만 주행 중 분리되면 안 되므로, 와셔를 활용해 이를 최소화했습니다.

![와셔 적용](/assets/img/posts/chassis-top-plate-assembly/vesc-washer.jpg)

위 구조를 확인했을 때 VESC와 샤프트 위치가 겹칩니다. 따라서 **실제 샤프트 구동 범위와 VESC 간섭이 없는지** 반드시 확인해야 합니다.

## 3. 배터리 고정 벨크로 구조물

아래 사진은 하판의 구멍에 벨크로를 연결해 추후 배터리를 고정할 수 있도록 만든 구조물입니다.

![벨크로 고정 구조](/assets/img/posts/chassis-top-plate-assembly/velcro-mount.jpg)

## 4. 서보모터 장착

아래와 같이 서보모터를 장착합니다. 작은 플라스틱 부품은 서보모터 높이로 인해 생기는 유격을 없애는 서포트이며, 샤시 구매 시 보통 함께 포함되어 있습니다.

![서보 서포트](/assets/img/posts/chassis-top-plate-assembly/servo-support.png)

| ![서보 장착 1](/assets/img/posts/chassis-top-plate-assembly/servo-mount-1.jpg) | ![서보 장착 2](/assets/img/posts/chassis-top-plate-assembly/servo-mount-2.jpg) |
| --- | --- |

서보모터는 **선이 안쪽으로 가게** 조립하는 것을 추천합니다. 연결 후 서보 중앙 정렬을 완료하고 서보 암을 장착해야 합니다.

## 5. 상판 부품 체결 순서

1. DC 모터를 설치하되, 피니언 기어와 구동축 기어 사이 간격을 적절히 맞춰야 합니다.
   - 간격 조절 팁: [{{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/]({{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/)

   ![모터 피니언 기어 설치](/assets/img/posts/chassis-top-plate-assembly/motor-pinion.jpg)

2. 여기까지 진행하면 1차 하판 조립이 완료됩니다. 이후 상판을 올리기 위한 지지대 볼트를 아래와 같이 조립합니다.

   ![지지대 볼트 조립](/assets/img/posts/chassis-top-plate-assembly/standoff-bolts.jpg)

3. 상판에는 Lidar, NUC, IMU가 부착됩니다. 이 중 IMU는 상판 아랫부분에 부착되므로 먼저 조립합니다.

   | ![IMU 부착 위치](/assets/img/posts/chassis-top-plate-assembly/imu-mount.png) | ![IMU 부착 예시](/assets/img/posts/chassis-top-plate-assembly/imu-mount-photo.jpg) |
   | --- | --- |

4. 이후 NUC를 상판에 조립합니다. NUC는 하판에 체결 가능한 2개의 구멍이 있으므로 이에 맞춰 조립해야 합니다. 볼트만 체결하면 NUC 하판이 들리는 문제가 있어, **너트와 와셔를 조합해 공간을 확보**했습니다.

   | ![NUC 장착 구조](/assets/img/posts/chassis-top-plate-assembly/nuc-mount.png) | ![NUC 간격 보정](/assets/img/posts/chassis-top-plate-assembly/nuc-spacer.png) |
   | --- | --- |

5. 이후 Lidar를 체결합니다.

   ![Lidar 장착](/assets/img/posts/chassis-top-plate-assembly/lidar-mount.jpg)

6. 기초적인 차체 조립은 완료되었습니다. 이후 과정은 **필수적으로 선정리와 함께** 진행해야 합니다.

## 마무리

샤시와 상판 부품 체결은 배선, 간섭, 고정력까지 함께 고려해야 하는 단계입니다. 각 부품을 고정할 때 간섭 여부를 확인하고, 와셔와 스페이서를 활용해 손상을 줄이면서도 견고하게 체결하는 것이 중요합니다. 조립 후에는 반드시 선정리를 함께 진행해 안정적인 주행 상태를 확보하시기 바랍니다.