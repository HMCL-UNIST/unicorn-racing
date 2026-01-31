---
title: VESC HFI (High Frequency Injection) 사용 가이드
description: Sensorless 모터 제어를 위한 VESC HFI 설정 및 활용 방법
author: jeongsang-ryu
date: 2026-01-28 11:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, HFI, Motor Control, Manual]
image:
   path: /assets/img/posts/vesc_mk6.png
lang: ko
lang_ref: vesc-hfi-guide
---

# VESC HFI 사용 가이드

## HFI란 무엇인가?

HFI(High Frequency Injection)는 VESC에서 **센서가 없는(sensorless) 모터의 로터 위치를 정확하게 추적**하기 위한 고급 제어 기법입니다. 특히 저속 및 정지 상태에서도 모터의 극(pole) 위상을 정확히 감지할 수 있어, 홀 센서나 엔코더 없이도 정밀한 모터 제어가 가능합니다.

### HFI의 작동 원리

HFI는 모터에 고주파 신호를 주입하고, 그 응답을 분석하여 로터의 위치를 추정합니다. 이를 통해 다음과 같은 장점을 얻을 수 있습니다:

- **제로 속도 제어**: 모터가 정지 상태이거나 매우 낮은 속도에서도 정확한 위치 제어 가능
- **센서 불필요**: 홀 센서나 엔코더 없이도 정밀한 FOC(Field Oriented Control) 구현
- **토크 향상**: 저속에서도 안정적인 토크 출력
- **부드러운 시작**: 모터 시동 시 떨림이나 코깅(cogging) 현상 최소화

## HFI의 종류

VESC는 두 가지 HFI 모드를 제공합니다.

### 1. 기본 HFI (Standard HFI)

전통적인 HFI 방식으로, 비교적 높은 주파수의 신호를 주입합니다.

**특징:**
- 높은 정확도
- 빠른 응답 속도
- 상대적으로 높은 소음 발생

### 2. Silent HFI

개선된 HFI 알고리즘으로, 소음을 줄이고 효율을 향상시킨 모드입니다.

**특징:**
- 기본 HFI 대비 낮은 소음
- 모터 발열 감소
- 에너지 효율 개선
- 대부분의 응용 분야에서 권장

## Silent HFI 설정 방법

Silent HFI를 설정하려면 VESC Tool에서 다음 단계를 따르십시오.

### 1단계: FOC 설정 완료

HFI를 사용하기 전에 먼저 FOC(Field Oriented Control) 설정이 완료되어야 합니다.

1. VESC Tool을 실행하고 VESC에 연결
2. **Motor Settings** → **FOC** 탭으로 이동
3. **Run Motor Detection**을 실행하여 기본 모터 파라미터 감지

### 2단계: HFI 활성화

<!-- ![Silent HFI 설정 화면]({{ site.baseurl }}/assets/img/posts/vesc-hfi/silent-hfi-settings.png) -->

1. **FOC** 탭에서 **Sensorless** 섹션을 찾습니다
2. **Observer Type**을 `HFI` 또는 `Silent HFI`로 설정
3. 주요 파라미터 조정:

#### HFI Voltage (권장: 1-4V)
- 주입되는 고주파 신호의 전압
- 값이 클수록 정확도가 높지만 소음과 발열도 증가
- 시작값: 2V에서 시작하여 필요에 따라 조정

#### HFI Frequency (권장: 10-20 kHz)
- 주입 신호의 주파수
- Silent HFI는 일반적으로 10-15 kHz 사용
- 기본 HFI는 15-20 kHz 사용

#### HFI Gain
- HFI 알고리즘의 이득 조정
- 너무 높으면 진동 발생, 너무 낮으면 정확도 저하
- 시작값: 0.005-0.01

### 3단계: 테스트 및 튜닝

1. **Apply** 버튼을 클릭하여 설정 저장
2. **Write Configuration** 버튼을 눌러 설정을 VESC에 기록
3. 저속에서 모터를 천천히 회전시켜 동작 확인
4. 필요시 파라미터를 미세 조정

## 사용 시 주의사항

### 1. 발열 문제

HFI는 고주파 신호를 지속적으로 주입하므로 **모터와 VESC 모두 발열이 증가**합니다.

**대응 방안:**
- 장시간 정지 상태에서는 HFI 사용 최소화
- 적절한 냉각 시스템 구비
- 온도 센서를 통한 모니터링 권장
- Silent HFI 사용으로 발열 감소

### 2. 소음

고주파 주입으로 인해 모터에서 **가청 주파수 범위의 소음**이 발생할 수 있습니다.

**대응 방안:**
- Silent HFI 모드 사용
- HFI Voltage 최소화 (정확도가 유지되는 선에서)
- HFI Frequency 조정 (가청 범위 외로)

### 3. 배터리 소모

HFI는 정지 상태에서도 전류를 소모합니다.

**대응 방안:**
- 사용하지 않을 때는 전원 차단
- 타임아웃 설정 활용
- 필요한 경우에만 HFI 활성화

### 4. 모터 호환성

모든 모터가 HFI에 적합한 것은 아닙니다.

**적합한 모터:**
- PMSM (Permanent Magnet Synchronous Motor)
- BLDC 모터 (3상)
- 충분한 센서리스 특성을 가진 모터

**부적합한 모터:**
- 브러시 DC 모터
- 유도 모터
- 매우 낮은 인덕턴스를 가진 모터

## HFI 사용이 필요한 경우

### 권장 사용 사례

1. **전동 스케이트보드 / E-스쿠터**
   - 저속 시작이 빈번한 경우
   - 부드러운 가속이 필요한 경우

2. **로봇 관절 제어**
   - 정밀한 위치 제어가 필요한 경우
   - 저속에서 높은 토크가 필요한 경우

3. **자율주행 차량**
   - 정확한 모터 제어가 중요한 경우
   - 센서 추가가 어려운 경우

### 권장하지 않는 사용 사례

1. **고속 주행만 하는 경우**
   - 일반 센서리스 모드로 충분
   - 불필요한 발열과 소음 발생

2. **배터리 수명이 중요한 경우**
   - 추가 전력 소비가 부담

3. **홀 센서가 이미 장착된 경우**
   - 센서 기반 제어가 더 효율적

## 문제 해결

### 모터가 떨리거나 진동이 발생하는 경우

1. HFI Gain 값을 낮춤 (예: 0.005)
2. HFI Voltage를 증가 (예: 3V)
3. Motor Detection을 다시 실행
4. 모터 케이블 연결 상태 확인

### 저속에서 회전이 불안정한 경우

1. HFI Voltage를 증가
2. HFI Frequency를 조정
3. FOC 파라미터 재검증
4. 모터 저항 및 인덕턴스 재측정

### 소음이 너무 큰 경우

1. Standard HFI 대신 Silent HFI 사용
2. HFI Voltage를 최소한으로 설정
3. HFI Frequency를 조정 (20 kHz 이상으로 상향)

### 모터가 과열되는 경우

1. Silent HFI 모드로 전환
2. HFI Voltage 감소
3. 냉각 시스템 개선
4. 장시간 정지 시 HFI 비활성화 고려

## 추가 학습 자료

### 공식 문서 및 포럼
- [VESC Project 포럼](https://vesc-project.com/)
- [VESC GitHub 저장소](https://github.com/vedderb/bldc)

### 관련 포스트
<!-- - [VESC 펌웨어 업그레이드](/posts/vesc-firmware-upgrade) -->
- [펌웨어 업그레이드]({{ site.baseurl }}/posts/vesc-firmware-upgrade)
- [VESC Tool 다운로드 및 설치]({{ site.baseurl }}/posts/vesc-tools-download)

### 추천 영상

VESC Silent HFI에 대한 자세한 설명은 다음 영상을 참고하세요:

{% include embed/youtube.html id='H-6qzmeCNtw' %}

이 영상에서는 Silent HFI의 작동 원리와 설정 방법을 시연합니다.

## 결론

HFI는 센서리스 모터 제어의 성능을 크게 향상시킬 수 있는 강력한 기능이지만, 발열과 소음, 전력 소비 등의 단점도 존재합니다. **Silent HFI 모드**를 사용하면 이러한 단점을 상당 부분 완화할 수 있으며, 대부분의 응용 분야에서 권장됩니다.

자신의 사용 환경과 요구사항을 고려하여 HFI 사용 여부를 결정하고, 적절한 파라미터 튜닝을 통해 최적의 성능을 얻을 수 있습니다.

## 참고 자료

- [VESC HFI: Sensorless position tracking at zero speed](https://benjaminsrobotics.ruplayers.com/k6ONlcPbraKbsqc/vesc-hfi-sensorless-position-tracking-at-zero-speed.html)
- [VESC Project - Strange HFI results](https://vesc-project.com/node/1565)
- [VESC Project - Motor whine with HFI?](https://vesc-project.com/node/2970)
