---
title: LiDAR Intensity 데이터로 차량 수평 정렬하는 방법
author: hangyo-cho
date: 2026-02-02 14:00:00 +0900
categories: [general]
tags: [LiDAR, RViz, sensor]
image:
  path: /assets/img/posts/lidar-intensity-vehicle-leveling/rviz-intensity-settings.png
lang: ko
lang_ref: lidar-intensity-vehicle-leveling
---

LiDAR 센서의 물리적인 수평 상태는 자율주행 시스템의 데이터 신뢰도를 결정짓는 핵심 요소입니다. 이 글에서는 LiDAR Intensity 데이터를 RViz에서 시각화하여 차량 수평을 판별하고 조정하는 방법을 다룹니다.

## 차량 수평 정렬의 필요성

수평이 맞지 않을 경우 다음과 같은 기술적 오류가 발생합니다.

- **지면 오인식 (Ground Misclassification):** 센서가 하향 정렬될 경우, 바닥면을 장애물로 인식하여 경로 계획(Path Planning) 시 불필요한 급정거를 유발합니다.
- **위치추정 실패 (Localization Failure):** 벽면이나 주변 지형지물을 스캔할 때 실제 궤적과 다른 각도로 데이터가 수집됩니다. 이 경우 **Scan Matching** 과정에서 스캔 데이터가 트랙 내부가 아닌 외부 벽면에 붙어버리는 현상이 발생하여 위치 추정 정밀도가 급격히 하락합니다.

> 센서 수평이 맞지 않으면 자율주행의 모든 후속 처리(장애물 인식, 위치 추정 등)에 영향을 미치므로, 반드시 사전에 확인해야 합니다.
{: .prompt-warning }

---

## LiDAR Intensity의 이해

LiDAR 센서는 레이저를 발사한 후 물체에 반사되어 돌아오는 에너지를 감지합니다.

- **정의:** 반사되어 돌아온 빛의 세기(신호 강도)를 의미합니다.
- **재질 및 색상:** 물체의 표면 색상이나 거칠기에 따라 흡수율이 달라지며 Intensity 값이 변합니다.
  - **입사각:** 레이저가 물체에 수평으로 닿을수록 에너지가 집중되어 일정한 데이터를 얻을 수 있습니다. 센서가 기울어지면 동일 지점에서도 Intensity 편차가 발생합니다.

---

## RViz 시각화 설정 및 분석 가이드

정확한 상태 판별을 위해 RViz에서 아래와 같이 세팅합니다.

### 권장 설정 (Settings)

- **Color Transformer:** `Intensity`
- **Autocompute Intensity Bounds:** **OFF**
  - 자동 범위를 켜두면 주변 환경에 따라 색상 기준이 실시간으로 변하므로, 수평 편차를 시각적으로 정량화하기 어렵습니다. 고정된 범위를 사용해 색상 변화를 관찰해야 합니다.
- **Min, Max Intensity**는 상황에 따라 조정하면 됩니다.

### Intensity 기반 판별 기준

Intensity 강도에 따라 다음과 같은 색상 대응을 가집니다. RViz 상에서 Intensity의 Min, Max를 어떻게 설정하느냐에 따라 달라집니다.

| 강도 구분 | 색상 (Color) | 상태 해석 |
|----------|-------------|----------|
| **Minimum** | **빨간색 (Red)** | 신호 흡수, 먼 거리, 혹은 입사각 불량 |
| **Intermediate** | 노란색 ~ 초록색 | 일반적인 반사 상태 |
| **Maximum** | **보라색 (Violet)** | 고반사체 (차선, 반사 테이프 등) |

### Good 상태

동일한 재질의 벽면이나 지면을 스캔할 때 색상 분포가 균일하게 나타납니다.

![Intensity 균일 - 양호](/assets/img/posts/lidar-intensity-vehicle-leveling/intensity-good.png)

### Bad 상태

특정 방향으로 갈수록 Intensity가 급격히 변하거나(예: 한쪽은 노란색, 반대쪽은 빨간색), 동일 위치에서 색상 분포가 넓게 퍼진다면 **센서가 한쪽으로 기울어져 있음**을 시사합니다.

![Intensity 불균일 - 기울어짐](/assets/img/posts/lidar-intensity-vehicle-leveling/intensity-bad.png)

---

## 하드웨어 수평 조정 방법

데이터 분석 결과 수평 불균형이 확인될 경우, 물리적인 조정 작업을 수행합니다.

1. RC 차량 서스펜션 시스템의 **쇼크 업소버(Shock Absorber) 조절 나사**를 활용합니다.
2. 평지에 차량을 거치한 상태에서 RViz의 Intensity 분포를 실시간 모니터링하며, 좌우/전후 쇼바의 나사를 조여 센서의 수평 평형을 맞춥니다.
3. 지면 및 벽면 데이터가 모든 방향에서 일정한 Intensity 색상(분포)을 유지하도록 조정합니다.

> 조정 작업은 반드시 평평한 바닥에서 수행하고, RViz의 Intensity 분포를 실시간으로 확인하면서 진행하세요.
{: .prompt-tip }

## 마무리

이 글에서는 LiDAR Intensity 데이터를 활용하여 차량 수평을 판별하고 조정하는 방법을 다뤘습니다. RViz에서 Intensity를 시각화할 때는 Autocompute를 끄고 고정 범위를 사용하는 것이 핵심이며, 색상 분포가 균일하지 않다면 쇼크 업소버 조절 나사를 통해 물리적으로 수평을 맞춰야 합니다. 센서 수평은 자율주행 데이터의 신뢰도에 직접적으로 영향을 미치므로, 운영 전 반드시 확인하시기 바랍니다.