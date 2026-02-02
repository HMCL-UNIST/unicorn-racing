---
title: "VESC HFI 사용법: Sensorless 저속 정밀도 향상"
author: jeongsang-ryu
date: 2026-02-02 21:40:14 +0900
categories: [build, advanced]
tags: [hall sensor, hfi, motor, vesc]
image:
  path: /assets/img/posts/vesc-hfi-guide-new/overview.png
  fit: contain            # cover(기본) / contain
  # position: center top    # center / center top / left center 등
  # ratio: 16/9             # 40/21(기본), 1/1 등
lang: ko
lang_ref: vesc-hfi-guide-new
recommended: true

---

HFI는 VESC에서 sensorless 모터의 극 위상을 저속에서도 정확히 찾도록 도와주는 기능입니다. 주행 성능 자체에 큰 영향을 주지는 않지만, **sensorless 모터의 저속 정밀도**를 일정 수준 확보할 수 있어 레이싱 출발 시에 이점을 줄 수 있습니다.

## 참고 영상

{% include embed/youtube.html id='ta1P01DJ5gs' %}

## HFI 사용 시 주의사항

- 기본 HFI와 Silent 모드(45 Deg/Coupled)가 있으며, 모두 동작 시 초고주파음이 지속적으로 발생합니다.
- 매우 높은 주파수로 전류를 인가하므로, HFI 상태가 오래 유지되면 **모터가 과열**되어 모터 마운트 변형 또는 차체 하우징 손상이 발생할 수 있습니다.
- 세팅 중 소음/발열이 크게 발생할 수 있으므로 **손상 위험을 고려해 짧게 테스트**하는 것을 권장합니다.
- 잘 세팅되면 저속에서 sensored 모터 성능의 약 95% 수준을 확보하지만, **가끔(약 10번 중 1번)** 출발 시 버벅거릴 수 있습니다.
- HFI 사용 시 저속 장시간 주행을 피해야 하며, 실제 주행 없이도 JOY 신호가 지속되면 HFI가 오래 유지되어 모터와 차체에 무리가 갈 수 있습니다.

## VESC Silent HFI

{% include embed/youtube.html id='H-6qzmeCNtw' %}

![Silent HFI 설정 화면](/assets/img/posts/vesc-hfi-guide-new/silent-hfi.png)

## 마무리

HFI는 sensorless 모터의 저속 정밀도를 보완하는 유용한 기능이지만, 소음과 발열이 크기 때문에 **짧은 테스트와 안전한 운용**이 중요합니다. 설정 후 저속 구간의 반응을 확인하고, 과열 징후가 보이면 즉시 중단하는 것을 권장합니다.