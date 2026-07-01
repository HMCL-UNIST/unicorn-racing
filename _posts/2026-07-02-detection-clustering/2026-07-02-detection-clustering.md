---
title: "2D LiDAR Detection & Clustering: Breakpoint부터 Dual-Stage까지"
author: jeongsang-ryu
date: 2026-07-02 03:00:00 +0900
categories: [racing stack, perception]
tags: [detection, lidar, clustering, breakpoint]
image:
  path: /assets/img/posts/detection-clustering/image.png
lang: ko
lang_ref: detection-clustering
math: true
---

레이스 중에는 트랙 위의 **정적 장애물**뿐 아니라 계속 움직이는 **상대 차량**까지 실시간으로 파악해야 합니다. 이 글에서는 **2D LiDAR** 하나만으로 이런 대상을 detect하는 방법을 정리해 보겠습니다.

## 시작점: LiDAR pointset을 어떻게 묶을까

![](/assets/img/posts/detection-clustering/image-1.png)

2D LiDAR가 주는 것은 결국 평면 위에 흩뿌려진 점들의 집합(**pointset**)입니다. 여기서 *"어떤 점들이 한 물체에 속하는가"* 를 찾아내는 과정이 바로 **clustering**입니다.

pointset을 클러스터링하는 범용 기법은 아주 많습니다.

- **k-means** — 미리 정한 $k$개의 그룹으로 분할

- **DBSCAN** — 밀도 기반, 임의 모양·noise에 강함

- **GMM (Gaussian Mixture Model)** — 여러 Gaussian의 혼합으로 모델링

- …

하지만 이 방법들에는 공통된 약점이 하나 있습니다. 바로 **실시간성**입니다.

Hokuyo 계열 2D LiDAR는 약 **40Hz**로 스캔을 쏟아냅니다. 그런데 위 범용 알고리즘들은 점들이 **아무 순서 없이(unordered) 흩어져 있다**고 가정하기 때문에, 매번 점들 사이의 거리 관계를 전방위로 따져야 합니다.

> 즉, 문제는 "정확도"보다 "**우리가 이미 가진 정보를 안 쓰고 있다**"는 데 있습니다.
{: .prompt-tip }

## 회전형 LiDAR의 특수성

핵심 인사이트는 이것입니다.

> **회전형 LiDAR의 데이터는 이미 각도(angle) 순서대로 정렬되어 있다.**

레이저가 한 방향으로 회전하며 순차적으로 거리를 재기 때문에, 점들은 scan angle $\varphi$ 가 증가하는 순서대로 자연스럽게 줄 세워져 들어옵니다. 우리는 이 **정렬(ordering)을 공짜로** 얻는 셈입니다.

한 물체에서 반사된 점들은 각도 상에서도 **연속된 구간**에 모여 있습니다. 그래서 굳이 전체 점을 뒤질 필요 없이, **바로 이전 점과 현재 점의 거리**만 확인하면 됩니다. 그 거리가 임계값을 넘는 순간이 곧 물체와 물체의 경계, 즉 **breakpoint**입니다.

덕분에 점들을 **딱 한 번 순회($O(n)$)**하는 것만으로 클러스터링이 끝나고, 40Hz 스트림도 여유 있게 처리할 수 있습니다. 대표적인 알고리즘이 **Breakpoint Detector**와, 거리에 따라 임계값을 적응시키는 **Adaptive Breakpoint Detector (ABD)**입니다. 여기에 더해, 실제 상황에서 생기는 outlier로 인한 over-segmentation 문제를 다루는 **Dual-Stage Adaptive Breakpoint Detector**까지 알아보겠습니다.

## 1. Breakpoint Detector

![](/assets/img/posts/detection-clustering/image-2.png)

가장 단순한 출발점입니다. **각도 순서로 이웃한 두 점의 거리**가 고정 임계값 $D_{max}$를 넘으면 거기서 물체를 끊습니다.

$$
\lVert p_i - p_{i-1} \rVert > D_{max} \quad\Rightarrow\quad \text{New Cluster}
$$

점을 딱 한 번 훑으면 끝나는 $O(n)$ 알고리즘이라 40Hz 스트림에 넉넉합니다.

문제는 $D_{max}$가 **상수**라는 점입니다. LiDAR는 멀어질수록 점이 sparse해지기 때문에, 가까운 물체엔 딱 맞는 임계값이 **먼 물체에선 너무 작아** 한 대를 여러 조각으로 끊어버립니다.

아래는 고정 임계값 Breakpoint Detector를 직접 조작해볼 수 있는 데모입니다. 슬라이더(각도 해상도·노이즈·최소 클러스터 크기)를 바꾸거나 박스를 배치하며, 원거리에서 벽·차량이 어떻게 여러 조각으로 끊기는지(over-segmentation) 확인해보세요.

<iframe src="{{ site.baseurl }}/assets/img/posts/detection-clustering/breakpoint-demo.html" title="Breakpoint Detector interactive demo" loading="lazy" style="width:100%;height:1100px;border:1px solid #2a3550;border-radius:8px;"></iframe>

## 2. Adaptive Breakpoint Detector

![](/assets/img/posts/detection-clustering/image-3.png)

해결책은 간단합니다. **$D_{max}$를 거리 $r$에 비례해 키우는 것**입니다.

$$
D_{max} = r_{i-1}\cdot\frac{\sin(\Delta\varphi)}{\sin(\lambda - \Delta\varphi)} + 3\sigma
$$

- $\Delta\varphi$ : 스캔 각도 간격(angular resolution)

- $\lambda$ : 검출 가능한 표면의 **worst-case 입사각** — 임계값이 얼마나 관대할지를 정하는 파라미터

- $3\sigma$ : 센서 노이즈 여유분

식이 복잡해 보이지만, $\Delta\varphi$ 는 센서 해상도라 상수이고 $\lambda$ 도 튜닝 파라미터이므로, $\frac{\sin(\Delta\varphi)}{\sin(\lambda - \Delta\varphi)}$ 와 $3\sigma$ 를 각각 튜닝 가능한 값으로 보면 다음처럼 다시 쓸 수 있습니다.

$$
D_{max} = a\cdot r_{i-1} + b
$$

즉 고정 breakpoint threshold $b$ 에 거리에 비례하는 허용치 $a\cdot r_{i-1}$ 를 더해 주는 것으로 이해할 수 있습니다.

기하학적으로 보면, 이전 점 주위에 **반지름 $D_{max}$ 인 원**을 그리고 다음 점이 그 안이면 같은 물체로 잇는 것입니다. **거리가 멀수록 원이 커지므로**, 성긴 원거리 점들도 한 물체로 잘 유지됩니다.

아래 데모에서는 적응형 임계값(ABD)을 직접 조작해볼 수 있습니다. `λ`(입사각)와 `σ`를 조절하면 거리에 따라 원(반지름 $D_{max}$)이 어떻게 커지는지, 고정 임계값 대비 원거리 물체가 어떻게 하나로 유지되는지 비교해보세요.

<iframe src="{{ site.baseurl }}/assets/img/posts/detection-clustering/adaptive-demo.html" title="Adaptive Breakpoint Detector interactive demo" loading="lazy" style="width:100%;height:1100px;border:1px solid #2a3550;border-radius:8px;"></iframe>

## 3. Dual-Stage Adaptive Breakpoint Detector

![](/assets/img/posts/detection-clustering/image-4.png)

실제 주행에서는 차량이 라이다에 연속적으로 측정되지 않는 경우가 생깁니다(over-segmentation problem). 예를 들어 다음과 같은 상황입니다.

- detection box 말고도 상대방의 차체가 함께 측정되면서, 빈공간으로 beam 이 통과해서

- 상대방의 detection box 가 미흡해서

ABD는 이 순간 breakpoint로 오인해 클러스터를 끊습니다.

이렇게 되면, tracking 모듈에서 이전 시점과 현재 시점의 detection 결과를 연결하는 과정에서 문제가 생길 수 도 있고, 더 나쁜 건, 뒤에 붙는 **최소 크기 필터**(`min cluster size`)가 작은 조각들을 지워버려서 — **차가 통째로 사라진다**는 점입니다. 점이 몇 개 안 되는 **원거리 차량에서 특히 치명적**입니다.

### 아이디어: 끊되, 바로 포기하지 않는다

핵심은 **breakpoint가 뜨면 곧장 새 물체를 만들지 말고, 기존 물체에 다시 이어붙일 수 있는지 한 번 더 확인**하는 것입니다.

- **Stage 1 (adaptive)** — ABD로 현재 클러스터에 이어붙이기 시도.

- **Stage 2 (re-merge)** — 끊겼다면, **기존 클러스터들의 끝점 중 최근접**을 찾아 고정 반경 $\tau$ 이내면 거기에 **재병합**. 그래도 없으면 그때 새 클러스터.

```text
for 각 점 p (각도 순, 트랙 위 점만):
    if dist(p, 현재클러스터.끝점) < D_max(r):     # Stage 1: ABD
        현재클러스터에 추가
    else:                                         # Stage 2: 재병합
        c ← 끝점이 가장 가까운 기존 클러스터
        if dist(p, c.끝점) < τ:
            c에 추가하고 c를 '현재'로
        else:
            새 클러스터 시작
```

Stage 2는 사실상 **클러스터 끝점들에 대한 고정 반경 single-linkage 한 스텝**입니다. 코너·occlusion으로 잠깐 끊긴 조각을 다시 꿰매, **한 대 = 한 클러스터**를 지켜줍니다.

## 마무리

2D LiDAR pointset을, 회전형 LiDAR가 공짜로 주는 **각도 정렬**을 이용해 $O(n)$으로 클러스터링하는 흐름을 다뤘습니다. 고정 임계값 **Breakpoint Detector** → 거리 적응형 **ABD** → 끊긴 조각을 다시 꿰매는 **Dual-Stage**로 발전하며, over-segmentation을 줄여 "한 대 = 한 클러스터"를 지킵니다.

실제 성능을 위해서는 다음도 중요합니다.

- **하드웨어** — 2D 가정에 가깝게 만들어 주는 차량 하드웨어와 트랙의 평평함
- **map filtering** — 벽 등 정적 구조를 걸러내려면 localization 성능이 중요합니다

## 참고자료

- [datmo (kostaskonkk/datmo)](https://github.com/kostaskonkk/datmo)
- [TU Delft — Detection and tracking of moving objects (thesis)](https://repository.tudelft.nl/file/File_55415b6d-b835-4390-92df-843ebed8d946?preview=1)
- [Dual-Stage 클러스터링으로 장애물 분리 정밀도 높이기]({{ site.baseurl }}/posts/adaptive-breakpoint-detector/)
