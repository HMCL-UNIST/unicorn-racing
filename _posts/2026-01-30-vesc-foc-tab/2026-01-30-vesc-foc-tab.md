---
title: FOC Tab (Motor Settings)
author: hyeongjoon-yang
date: 2026-01-30 12:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, FOC, motor-control, manual]
lang: ko
lang_ref: vesc-foc-tab
---

> Motor Settings에 변화를 줄 경우, 이를 저장하기 위해, 항상 우측 메뉴바의 Write motor configuration을 클릭 해야함

FOC는 Field Oriented Control의 약자이며, BLDC를 제어하는 기본적인 제어 방식이다. 모터를 Detect 하고 구동하여 적절하게 모터를 제어할 수 있는 파라미터를 찾는 과정을 거쳐 모터를 제어한다.

General - General Tab에서 Sensor Mode를 선택할 수 있으며, 크게 Sensorless, HFI, Hall Sensors 로 나눌 수 있다.

3가지 방식 모두 공통적으로, General - General 옆에 있는 Sensorless, Hall Sensors, HFI Tab에서 각 센서 모드에 맞는 값을 측정 혹은 지정하여 사전에 필요한 세팅을 하고, 이후에, General - General Tab에서 센서 모드를 설정한 후, Detect and Calculate Parameters 섹션의 RL, 람다, Apply 를 순서대로 진행하면 된다.

RL를 누르면, '삐익' 하는 작은 공룡 소리가 나고 다음 단계를 위한 준비를 하며, 람다를 누르면 바퀴가 구르기 시작한다.

![Sensor Mode](/assets/img/posts/vesc-foc-tab/sensor-mode.png){: w="355" }

![Detect and Calculate Parameters](/assets/img/posts/vesc-foc-tab/detect-parameters.png)

![FOC Tab Full](/assets/img/posts/vesc-foc-tab/foc-tab-full.png)

간혹, 람다 값이 붉은색으로 유지되며 측정되지 않는 경우가 있는데, Firmware 버전이 낮으면 발생할 수 있는 문제로, Firmware Upgrade를 진행한 후, 다시 처음부터 세팅하는 것을 추천한다.

모터 파라미터가 측정된 후, 우측 메뉴바의 Write motor configuration을 빼놓지 말고 눌러주어야 저장이 완료된다.
