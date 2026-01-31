---
title: USB LED로 차량 상태를 표시하는 방법 (Blink mk3)
author: jeongsang-ryu
date: 2026-01-31 13:00:00 +0900
categories: [Hardware, Manual]
tags: [LED, blink, ROS, hardware, manual]
image:
  path: /assets/img/posts/blink-mk3-led/blink-mk3.png
lang: ko
lang_ref: blink-mk3-led
---

자율주행 차량의 현재 상태(주행 중, 대기, 비상 정지 등)를 외부에서 시각적으로 확인할 수 있으면 디버깅과 안전 관리에 큰 도움이 됩니다. 저희 팀에서는 UNICORN 뿔에 LED를 장착하여 차량 상태를 실시간으로 표시하고 있습니다.

이 글에서는 LED 상태 표시를 구현하기 위해 검토했던 3가지 방법과, 최종적으로 선택한 **Blink mk3**를 소개합니다.

---

## 방법 1: Jetson GPIO 포트 이용하기

![Jetson GPIO](/assets/img/posts/blink-mk3-led/jetson-gpio.png)
*출처: [https://kettle-ear.tistory.com/11](https://kettle-ear.tistory.com/11)*

Jetson 개발자 키트에서는 GPIO 포트를 이용해서 LED를 직접 제어할 수 있습니다. 하지만 저희 팀의 주력 컴퓨팅 유닛은 **Intel NUC**이기 때문에 GPIO 포트가 없습니다. 따라서 USB 포트를 활용하는 다른 방법을 찾아야 했습니다.

---

## 방법 2: 아두이노 이용하기

![Arduino Method](/assets/img/posts/blink-mk3-led/arduino-method.png)

USB를 아두이노에 연결하고, 아두이노에서 LED를 제어하는 방식입니다. ForzaETH 팀에서 이 방식을 사용하고 있는 것으로 알고 있습니다.

하지만 아두이노를 추가로 연결하면 하드웨어 구성이 복잡해지기 때문에, USB로 직접 연결되는 LED 제품을 찾아보기로 했습니다.

---

## 방법 3: Blink mk3 이용하기 (Our Method)

![Blink Method](/assets/img/posts/blink-mk3-led/blink-method.png)

최종적으로 선택한 방식입니다. USB 형식의 LED 제품은 매우 많지만, 핵심은 **개발자용 API나 드라이버를 제공하는 제품**을 찾는 것이었습니다.

여러 제품을 비교한 끝에 찾아낸 **Blink mk3**는 **ROS 드라이버까지 제공**하고 있어서 저희 시스템에 바로 통합할 수 있었습니다.

![Unicorn 뿔에 장착된 모습](/assets/img/posts/blink-mk3-led/unicorn-horn-led.png)
*Unicorn 뿔에 장착된 모습*

> 뿔은 직접 3D 프린팅으로 설계하여 제작했습니다.
{: .prompt-info }

### 관련 링크

- 저희 팀 Blink ROS 패키지: [https://github.com/HMCL-UNIST/unicorn-racing-stack/tree/main/sensors/blink](https://github.com/HMCL-UNIST/unicorn-racing-stack/tree/main/sensors/blink)
- 저희 팀 Blink 사용 코드: [https://github.com/HMCL-UNIST/unicorn-racing-stack/blob/main/state_machine/state_indicator/src/state_indicator_node.py](https://github.com/HMCL-UNIST/unicorn-racing-stack/blob/main/state_machine/state_indicator/src/state_indicator_node.py) 
- Blink mk3 구매 링크 (Amazon): [https://www.amazon.com/ThingM-Blink-USB-RGB-BLINK1MK3/dp/B07Q8944QK?th=1](https://www.amazon.com/ThingM-Blink-USB-RGB-BLINK1MK3/dp/B07Q8944QK?th=1)
- ROS Wiki - blink1: [https://wiki.ros.org/blink1](https://wiki.ros.org/blink1)
- blink1_node (Bitbucket): [https://bitbucket.org/castacks/blink1_node/src/master/](https://bitbucket.org/castacks/blink1_node/src/master/)

---

## 마무리

이 글에서는 자율주행 차량에 상태 표시 LED를 구현하기 위해 검토했던 3가지 방법(Jetson GPIO, 아두이노, USB LED)을 비교하고, 최종적으로 **Blink mk3**를 선택한 이유를 소개했습니다.

Blink mk3는 USB로 간단히 연결할 수 있고 ROS 드라이버를 공식 지원하기 때문에, 별도의 마이크로컨트롤러 없이도 차량 상태를 LED로 표시할 수 있습니다.
