---
title: "샤시 및 상판 부품 체결 가이드"
authors: [heedo-kim, yunho-lee]
date: 2026-02-02 21:30:20 +0900
categories: [build, beginner]
tags: [Chassis, wiring]
image:
  path: /assets/img/posts/chassis-top-plate-assembly/chassis-top-plate-assembly-hero.png
lang: ko
lang_ref: chassis-top-plate-assembly
---

## 필요 물품 준비

- 아래는 비어 있는 SRX8 샤시입니다.  
  ![빈 SRX8 샤시](/assets/img/posts/chassis-top-plate-assembly/srx8-empty.jpg)
  *빈 SRX8 샤시 상태*

- 한 대에 필요한 전체 부품입니다.  
  ![필요 부품 전체](/assets/img/posts/chassis-top-plate-assembly/parts-full-set.jpg)
  *사용될 전체 부품 모음*

- 전원 하네스는 모두 XT-60 규격으로 통일했습니다.  
  ![LiDAR 전원선 XT-60](/assets/img/posts/chassis-top-plate-assembly/lidar-power-xt60.png)  
  *LiDAR와 BEC 입력·출력을 XT-60으로 변환*  
  ![Servo/NUC용 XT-60 변환](/assets/img/posts/chassis-top-plate-assembly/xt60-to-servo-barrel.png)  
  *Servo 3핀, NUC 배럴 잭을 XT-60으로 변환*

- 배선도는 이해용 참고 자료이므로 지금은 조립하지 않습니다.  
  ![전체 배선도](/assets/img/posts/chassis-top-plate-assembly/wiring-overview-2026.png)
  *전체 배선 흐름도*

## 하판 부품 조립

### 섀시에 VESC 장착

알루미늄 하판에 VESC 고정용 추가 홀을 가공했습니다. 이 홀을 기준으로 VESC를 위치시켰습니다.  
![하판 가공 위치](/assets/img/posts/chassis-top-plate-assembly/lower-plate-holes-2026.png)
*VESC 고정 홀 가공 위치*

볼트·너트를 과도하게 조이면 상판이 찌그러질 수 있어, 와셔를 넣어 변형을 최소화했습니다.  
![VESC 체결과 와셔](/assets/img/posts/chassis-top-plate-assembly/vesc-washer-2026.jpg)
*와셔를 사용한 VESC 체결*

> 샤프트 구동 범위와 VESC가 간섭하지 않는지 장착 후 반드시 확인했습니다.
{: .prompt-warning }

### 섀시에 배터리 고정 끈 장착

기존 하판 홀을 활용해 벨크로 스트랩을 고정했습니다. 추후 배터리를 안정적으로 묶을 수 있습니다.  
![벨크로 고정 구조](/assets/img/posts/chassis-top-plate-assembly/velcro-mount-2026.jpg)
*벨크로 스트랩 고정*

### 섀시에 서보모터 장착

서보 높이로 생기는 유격을 없애는 서포트를 먼저 끼우고, 서보 케이블이 안쪽으로 향하도록 장착했습니다.  
![서보 서포트와 장착](/assets/img/posts/chassis-top-plate-assembly/servo-support-2026.png)
![서보 장착 예시](/assets/img/posts/chassis-top-plate-assembly/servo-mount-2026.png)
*서보 서포트 및 장착 예시*

서보 중앙 정렬을 끝낸 뒤 서보 암을 결합했습니다. 자세한 절차는 [{{ site.baseurl }}/posts/servo-horn-after-alignment/]({{ site.baseurl }}/posts/servo-horn-after-alignment/)를 참고했습니다.

### 모터 장착

DC 모터는 피니언 기어와 구동축 기어 간격을 맞춘 뒤 체결했습니다.  
![피니언 기어 간격 조절](/assets/img/posts/chassis-top-plate-assembly/motor-pinion-2026.jpg)
*피니언-구동축 기어 간격 설정*

간격 조절 방법은 [{{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/]({{ site.baseurl }}/posts/motor-pinion-gear-gap-adjustment/)를 참고했습니다.

### 지지대 너트 체결

하판 조립이 끝나면 상판을 올리기 위한 지지대 너트를 체결합니다.  
![지지대 너트 체결](/assets/img/posts/chassis-top-plate-assembly/standoff-bolts-2026.jpg)
*지지대 너트 체결 상태*

## 상판 부품 조립

### IMU 장착

상판 아랫면에 IMU를 먼저 부착했습니다.  
![IMU 장착](/assets/img/posts/chassis-top-plate-assembly/imu-mount-2026.png)
*IMU 부착 위치*

### NUC 장착

상판의 두 개 고정 홀에 맞춰 NUC를 체결했습니다. 하판이 들뜨지 않도록 너트와 와셔를 조합해 간격을 확보했습니다.  
![NUC 장착](/assets/img/posts/chassis-top-plate-assembly/nuc-mount-2026.png)
*NUC 고정 및 스페이서 활용*

### Lidar 장착

마지막으로 LiDAR를 상판에 고정했습니다.  
![LiDAR 장착](/assets/img/posts/chassis-top-plate-assembly/lidar-mount-2026.jpg)
*상판 LiDAR 장착*

## 마무리

샤시와 상판에 부품을 체결할 때는 전원 하네스 규격 통일, 기계적 간섭, 체결 강도를 모두 고려해야 합니다. VESC 주변은 변형을 막기 위해 와셔를 사용했고, 서보·모터는 정렬과 간격을 먼저 맞춘 뒤 조립했습니다. 지지대와 상판 장착을 마쳤다면 배선 정리까지 완료해 주행 중 흔들림이나 단선을 예방하시기 바랍니다.
