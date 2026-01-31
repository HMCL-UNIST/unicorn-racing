---
title: VESC PID Speed Controller 튜닝하는 방법
author: hyeongjoon-yang
date: 2026-01-30 13:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, PID, motor-control, manual]
lang: ko
lang_ref: vesc-pid-controllers
---

VESC의 PID Speed Controller는 모터의 RPM 응답을 정밀하게 제어하기 위한 튜닝 도구다. **[FOC 세팅]({{ site.baseurl }}/posts/vesc-foc-tab/)**을 완료한 뒤, 모터 제어의 정밀도를 높이는 단계에서 사용한다.

> **Sensorless 모터**를 사용하는 경우 PID 튜닝이 필수적이다. Sensored 모터는 튜닝 없이도 비교적 안정적으로 동작한다.
{: .prompt-info }

---

## 1. PID 게인 설정

**Motor Settings - PID Controllers** 탭에서 Speed Controller의 P, I, D 게인을 조정할 수 있다.

![PID Controllers Interface](/assets/img/posts/vesc-pid-controllers/pid-interface.png)

---

## 2. 실시간 RPM 모니터링

튜닝 결과를 확인하려면 **Data Analysis - Realtime Data - RPM** 탭을 사용한다.

> 우측 메뉴바의 **Stream realtime data**를 반드시 활성화해야 실시간 데이터가 표시된다.
{: .prompt-warning }

![RPM Control](/assets/img/posts/vesc-pid-controllers/rpm-control.png)

하단의 RPM 옆 **재생 버튼**으로 모터를 구동하고, **STOP 버튼**으로 정지할 수 있다.

![Realtime Data](/assets/img/posts/vesc-pid-controllers/realtime-data.png)

---

## 3. 튜닝 가이드

| 게인 | 역할 | 튜닝 방향 |
|------|------|-----------|
| **P** | 목표 RPM과의 오차에 비례하여 반응 | 점진적으로 올려서 응답 속도 확보 |
| **I** | 정상 상태 오차 제거 | 대부분의 경우 기본값 유지 |
| **D** | 급격한 변화 억제 (진동 감쇠) | 조금씩 올려서 overshoot 억제 |

### 튜닝 순서

1. **P 게인부터 조정** - 다양한 RPM 범위에서 응답 속도를 확인하며 점진적으로 높인다. Overshoot이 심하지 않은 수준까지 올린다.
2. **D 게인으로 진동 억제** - P를 올린 후 발생하는 overshoot이나 큰 진동을 D 게인으로 줄인다. 너무 높이면 잔 진동에도 민감하게 반응하므로 조금씩 조정한다.
3. **다양한 RPM에서 검증** - 저속/고속 모두에서 안정적인지 확인한다.

> 전류를 직접 다루는 작업이므로, 게인 변경은 항상 **소폭으로 점진적**으로 진행해야 한다.
{: .prompt-danger }
