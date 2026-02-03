---
title: 선 정리 및 배선 마무리 가이드
authors: [heedo-kim, yunho-lee]
date: 2026-02-03 10:00:00 +0900
categories: [build, beginner]
tags: [Chassis, wiring]
image:
  path: /assets/img/posts/wire-management-finish/wiring-overview.png
lang: ko
lang_ref: wire-management-finish
---

샤시와 상판에 주요 부품을 모두 장착했다면, 이제 배선을 정리해 주행 중 간섭과 단선을 막아야 합니다. 아래 순서를 따라 공간별로 선을 정리하고 단단히 고정했습니다.

## 선정리 전 회로 구성

상판 조립이 끝난 뒤 전체 배선 흐름을 먼저 확인했습니다. 배선도는 이해를 돕기 위한 참고용입니다.  
![최종 배선도](/assets/img/posts/wire-management-finish/wiring-diagram-final.png)
*최종 배선 흐름도*

## 서보모터 아래 공간 활용

VESC에서 나오는 전원 하네스를 서보모터 옆 빈 공간을 통해 배치해 배터리 수납부와 가장 가깝게 연결했습니다. 이후 여유 케이블은 실리콘 테이프로 고정해 움직임을 최소화했습니다.  
![VESC 하네스 경로](/assets/img/posts/wire-management-finish/vesc-harness-routing.png)
*VESC 하네스를 서보모터 옆 공간으로 라우팅*
![NUC·서보 전원선 정리 1](/assets/img/posts/wire-management-finish/nuc-servo-power-routing-1.jpg)
*상판이 조립된 후의 모습*

## 상판의 아랫면 활용

NUC 전원선과 서보 전원선을 상판 아랫면에 붙여 깔끔하게 정리했습니다. Matek BEC는 하판에 있던 BEC 옆 빈자리에 실리콘 테이프로 고정했습니다.  

![NUC·서보 전원선 정리 2](/assets/img/posts/wire-management-finish/nuc-servo-power-routing-2.jpg)
*회로에 BEC와 배럴 잭 추가 연결*
![모터 케이블 고정 1](/assets/img/posts/wire-management-finish/motor-cable-management-1.jpg)
*상판 아래부분 공간 활용 선정리*
## 샤시 구조 활용

모터 삼상선과 센서 케이블은 샤프트와 매우 가까워 주행 중 간섭 위험이 큽니다. 샤시의 리브(구조대)를 이용해 케이블 타이로 묶어 간섭을 방지했습니다.  
![모터 케이블 고정 2](/assets/img/posts/wire-management-finish/motor-cable-management-2.jpg)
*샤시 리브를 활용한 케이블 타이 고정*

## 상판 위 남는 공간 활용

상판을 덮은 뒤 남는 공간에 잔여 케이블을 말아 넣고 움직이지 않도록 고정했습니다.  
![상판 내부 케이블 정리](/assets/img/posts/wire-management-finish/top-plate-cable-space.jpg)
*상판 내부 남는 공간에 케이블 수납*

## 배터리 장착 방법

- 배터리가 주행 중 흔들리지 않도록 벨크로 스트랩과 폼을 활용했습니다.  
  ![배터리 고정 1](/assets/img/posts/wire-management-finish/battery-mount-1.jpg)
- 케이블이 구동부와 간섭하지 않도록 배터리 케이블을 본체 쪽으로 정렬했습니다.  
  ![배터리 고정 2](/assets/img/posts/wire-management-finish/battery-mount-2.jpg)
  ![배터리 고정 3](/assets/img/posts/wire-management-finish/battery-mount-3.jpg)
  ![배터리 고정 4](/assets/img/posts/wire-management-finish/battery-mount-4.jpg)
*배터리와 배선이 움직이지 않도록 스트랩과 배선 정렬을 병행*

## 마무리

배선 마무리의 핵심은 **간섭 최소화**와 **확실한 고정**입니다. 빈 공간(서보 주변, 상판 아래/위, 샤시 리브)을 적극 활용해 케이블을 분산 배치했고, 케이블 타이·실리콘 테이프로 움직임을 차단했습니다. 마지막으로 배터리와 전원선이 다른 구동부와 간섭하지 않는지 다시 확인하면 주행 준비가 완료됩니다.
