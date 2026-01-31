---
title: VESC 모터 회전 방향과 전류 설정 가이드
author: hyeongjoon-yang
date: 2026-01-30 11:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, motor-control, manual]
lang: ko
lang_ref: vesc-general-tab
---

VESC의 **Motor Settings - General** 탭에서는 모터의 회전 방향과 전류 한도를 설정할 수 있다. 차량 성능과 안전에 직접적으로 영향을 미치는 핵심 설정이다.

> 모든 Motor Settings 변경 후, 우측 메뉴바의 **Write Motor Configuration**을 반드시 클릭해야 저장된다.
{: .prompt-warning }

---

## 모터 회전 방향 세팅

모터 회전 방향이 반대인 경우, 아래 3가지 방법으로 해결할 수 있다.

| 방법 | 설명 |
|------|------|
| **Invert Motor Direction** (추천) | General - General 탭에서 체크박스 하나로 간단히 변경 |
| 3상 선 순서 변경 | 모터 배선 2개를 물리적으로 교체 |
| ROS 패키지에서 부호 변경 | VESC ROS Package의 command 전달 부분에서 부호 반전 |

---

## 모터 전류 설정

**General - Current** 탭에서 모터에 인가할 최대 전류를 변경할 수 있다.

> 반드시 **VESC 스펙**과 **모터 스펙**을 사전에 확인한 뒤 설정해야 한다.
{: .prompt-info }

![General Tab](/assets/img/posts/vesc-general-tab/general-tab.png)

### 전류가 부족한지 확인하는 방법

ROS 토픽 `vesc/sensors/core`를 통해 주행 중 실시간 전류를 모니터링할 수 있다. 다음과 같은 증상이 보이면 최대 전류를 높이는 것을 고려한다:

- 속도 명령을 높여도 차량 속도가 더 이상 올라가지 않는 경우
- 전류가 설정된 최대값에 계속 도달하는 경우

### Sensorless 모터의 전류 설정

Sensorless 모터는 저속에서 로터 위치를 추정할 수 없기 때문에, **최대 허용 전류를 인가하여 강제로 회전을 시작**한 뒤 FOC 제어로 전환하는 방식으로 동작한다. 이 특성 때문에 전류 설정이 특히 중요하다.

| 상황 | 증상 |
|------|------|
| 최대 전류가 **너무 높은** 경우 | 출발 시 VESC에 과부하 발생, DRV8301 드라이버 소손 위험, 공룡 소리 발생 |
| 최대 전류가 **너무 낮은** 경우 | 출발 자체가 오래 걸리거나 실패, 역시 공룡 소리 발생 가능 |

> Voltage, RPM, Advanced 등 나머지 설정은 전문적인 지식 없이 변경하면 치명적일 수 있으므로 주의가 필요하다.
{: .prompt-danger }
