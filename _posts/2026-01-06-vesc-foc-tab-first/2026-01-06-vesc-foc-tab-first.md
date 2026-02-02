---
title: "모터 연결 후 가장 먼저 할 일: FOC 탭 설정"
authors: [hyeongjoon-yang, jeongsang-ryu]
date: 2026-01-06 21:13:56 +0900
categories: [build, beginner]
tags: [motor, vesc, vesc-tools, foc]
image:
  path: /assets/img/posts/vesc-foc-tab-first/overview.png
lang: ko
lang_ref: vesc-foc-tab-first
---

![FOC 탭 개요](/assets/img/posts/vesc-foc-tab-first/overview.png)

VESC로 BLDC 모터를 제어하려면 **FOC 설정이 필수**입니다. FOC 설정이 제대로 되지 않으면 모터가 정상적으로 구동되지 않거나 효율이 떨어지고, 심한 경우 모터나 드라이버에 손상이 발생할 수 있습니다. 이 글에서는 FOC 설정 방법, Sensor Mode 종류, 문제 해결 방법을 정리합니다.

- 참고 영상:

{% include embed/youtube.html id='GBYRSxds28k' %}

## FOC란?

FOC는 Field Oriented Control의 약자이며, BLDC 모터 제어의 기본 방식입니다. 모터를 Detect하고 구동해 적절한 파라미터를 찾은 뒤, 그 값을 기반으로 모터를 제어합니다.

## Sensor Mode 종류

General → General 탭에서 Sensor Mode를 선택할 수 있으며, 크게 Sensorless, HFI, Hall Sensors로 나뉩니다.

![Sensor Mode 선택](/assets/img/posts/vesc-foc-tab-first/sensor-mode.png)

## FOC 설정 방법

세 가지 방식 모두 공통적으로 다음 순서로 설정합니다.

1. 각 센서 모드에 맞는 값을 측정/지정합니다.
   - Sensorless, Hall Sensors, HFI 탭에서 사전 세팅
2. General → General 탭에서 Sensor Mode를 설정합니다.
3. Detect and Calculate Parameters 섹션에서 `RL → λ → Apply` 순서로 진행합니다.

- `RL`을 누르면 작은 경고음이 나며 다음 단계를 준비합니다.
- `λ`를 누르면 바퀴가 구르기 시작합니다.

![RL, λ 측정 화면](/assets/img/posts/vesc-foc-tab-first/rl-lambda.png)

## 문제 해결

`λ` 값이 붉은색으로 유지되며 측정되지 않는 경우가 있습니다. 이 문제는 **낮은 Firmware 버전**에서 발생할 수 있으므로, 먼저 펌웨어 업그레이드를 진행한 뒤 다시 설정하는 것을 권장합니다.

- 펌웨어 업그레이드 가이드: [{{ site.baseurl }}/posts/vesc-firmware-upgrade-guide/]({{ site.baseurl }}/posts/vesc-firmware-upgrade-guide/)

## 주의사항

- 모터 파라미터 측정 후, 우측 메뉴의 **Write motor configuration**을 눌러야 저장이 완료됩니다.
- 차량 조립 후가 아니라, **모터만 따로 분리한 상태**에서 측정해야 정확한 값을 얻을 수 있습니다.

## 마무리

FOC 설정은 모터 제어의 기본이 되는 중요한 과정입니다. 설정이 잘못되거나 저장되지 않으면 모터 제어가 불안정해지고 손상이 발생할 수 있습니다. 설정을 마친 뒤에는 반드시 `Write motor configuration`으로 저장하고, 이후 Motor Settings에서 전류 설정과 회전 방향 등 세부 설정을 이어가면 됩니다.
