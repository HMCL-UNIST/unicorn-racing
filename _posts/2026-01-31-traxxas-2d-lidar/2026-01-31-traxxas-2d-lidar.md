---
title: Traxxas에서 Serpent SRX8으로 차체를 바꾼 이유
author: jeongsang-ryu
date: 2026-01-31 15:00:00 +0900
categories: [Hardware]
tags: [chassis, Traxxas, Serpent, LiDAR, hardware]
image:
  path: /assets/img/posts/traxxas-2d-lidar/fiesta-slash.png
lang: ko
lang_ref: traxxas-2d-lidar
---

저희 팀은 기존에 사용하던 **Traxxas Fiesta**와 **Traxxas Slash**에서 **Serpent SRX8 GTE**로 차체를 전환했습니다. 이 글에서는 2D LiDAR 환경에서 Traxxas 차체가 가진 구조적 문제점들과, 차체를 바꾸게 된 이유를 정리합니다.

![Traxxas Fiesta & Slash](/assets/img/posts/traxxas-2d-lidar/fiesta-slash.png)

---

## 기본 전제

- 2D LiDAR를 사용하는 상황을 가정합니다.
- 평평한 바닥에서의 대회를 고려합니다.

이 조건에서 2D LiDAR와 보조 센서들(IMU, Wheel Odometry)만으로 현재 roll, pitch를 정확히 추정하는 것은 매우 어렵습니다. LiDAR 포인트가 바닥을 찍는지, 트랙 경계를 찍는지, 트랙 바깥을 찍는지 정확히 알 수 없기 때문입니다.

> roll, pitch 움직임은 **예측해야 할 대상이 아니라 제거해야 할 대상**으로 정의했습니다.
{: .prompt-danger }

---

## 1. 높은 차량 무게 중심

Traxxas Fiesta와 Slash는 2D space 및 고속 레이싱을 위해 설계된 차량이 아닙니다.

| 차량 | 설계 목적 |
|------|-----------|
| **Fiesta** | Rally용 |
| **Slash** | Offroad Truck |

무게 중심이 높기 때문에 고속 코너링 시 롤이 크게 발생하며, 이는 2D LiDAR의 스캔 평면을 벗어나게 만드는 직접적인 원인이 됩니다.

**해결 방법**: 낮은 차체의 차량을 사용하는 것이 근본적인 해결책입니다.

---

## 2. 불필요한 롤/피치 움직임

- 기본 쇽 업소버의 강성이 너무 약합니다.
- 제품 자체의 유격이 많은 편입니다.

**해결 방법**:
- 롤/피치 움직임이 작은 차량 선택
- 완성도가 높은 차량 사용 (비용이 더 들 수 있음)

---

## 3. 모터 고정 문제

이 문제가 가장 치명적이었습니다. 모터를 고정하는 주변 부품이 **플라스틱**으로 되어 있어서, 열과 반복적인 사용에 의해 점점 휘어집니다.

![문제의 모터 고정 부품](/assets/img/posts/traxxas-2d-lidar/motor-mount-part.png)
*문제의 모터 고정 부품*

모터의 축(**피니언 기어**)과 차량 중심 구동축(**스퍼 기어**)이 틀어지기 쉽고, 시간이 지날수록 소리가 커지고 기어가 갈리기 시작합니다.

![모터 정렬 상세](/assets/img/posts/traxxas-2d-lidar/motor-alignment-detail.png)

노란색 화살표로 연결되는 부분은 초록색 박스의 락너트로 강하게 결합되지만, 빨간색 화살표 부분은 단순히 걸쳐지는 구조입니다. 따라서 사용하다 보면 축 정렬 문제가 발생합니다.

![축 정렬 비교](/assets/img/posts/traxxas-2d-lidar/axis-alignment.png)

왼쪽처럼 초기에는 중심 구동축과 모터 축이 평행하게 정렬되어 있지만, 시간이 지나면서 오른쪽처럼 축이 비틀어집니다. 이 경우 모터 하우징 부품을 교체하는 것 외에는 방법이 없습니다.

> 기어가 갈리고 덜커덕거리는 소리가 나기 시작하면, 모터 하우징 부품을 확인해 보세요.
{: .prompt-warning }

### 해결 방법

- 모터 고정 부분이 **금속이나 단단한 소재**로 되어 있는 차량
- 2개 이상의 고정점이 있어서 지렛대 원리로 휘지 않는 차량
- 예시: **Serpent SRX8 GTE '23 1/8 4wd EP**

![Serpent SRX8 모터 마운트](/assets/img/posts/traxxas-2d-lidar/serpent-srx8-motor.png)
*Serpent SRX8은 모터 샤프트가 휘기 전에는 축 정렬 문제가 발생하지 않습니다.*

---

## 마무리

저희 팀이 Traxxas에서 Serpent SRX8으로 옮겨간 것은, 역설적이게도 하드웨어 업그레이드보다는 **하드웨어로 인한 문제를 줄이고 온전히 소프트웨어 경쟁을 하기 위함**이었습니다.

F1tenth(현 RoboRacer) 초창기에 Traxxas를 선정한 것은, 조립이 완료되어 있으며 가격이 합리적이라는 접근성 때문이었을 것입니다. 하지만 최근 몇 년간 많은 팀들이 쇽 업소버에 더 강한 스프링을 넣거나, 테이프와 순간 접착제로 충격을 흡수하지 않도록 만든 것은 기술적 치팅이 아니라, **2D LiDAR의 불필요한 움직임을 제거하기 위한 불가피한 선택**이었습니다.

급가속/급감속 시 불안정했던 것은 소프트웨어가 못 따라간 것이 아니라, 하드웨어 문제로 2D space에서는 불가능에 가까웠던 것입니다.

> 향후 3D LiDAR와 카메라를 활용하게 된다면, 더 엄격한 하드웨어 규정이 있더라도 소프트웨어의 발전으로 해결할 수 있을 것입니다. 대회 클래스를 나눈다면 차량 스펙보다는 **2D LiDAR vs 3D LiDAR + Camera**로 구분하는 것이 적절하지 않을까 생각합니다.
{: .prompt-tip }
