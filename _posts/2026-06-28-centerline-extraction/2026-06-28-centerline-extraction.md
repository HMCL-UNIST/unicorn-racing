---
title: "맵 이미지에서 Centerline과 트랙 경계 추출하기"
author: hyeong-gyun-noh
date: 2026-06-28 10:00:00 +0900
categories: [racing stack, planning]
tags: [centerline, mapping, global-planning, opencv]
image:
  path: /assets/img/posts/centerline-extraction/overview.png
lang: ko
lang_ref: centerline-extraction
math: true
---

SLAM으로 얻은 흑백 점유격자(occupancy grid) 이미지 한 장을, 최적화가 바로 쓸 수 있는 **트랙 데이터**(`centerline.csv` + `boundary_left/right.csv`)로 변환합니다. `planner` 패키지의 `centerline_extractor` 노드 — Global Planning 파이프라인의 첫 단추입니다.


> **세 가지를 만듭니다** — ① Centerline(트랙 중앙 폐곡선, 좌표계 $s$ 의 기준) ② Track width(각 점에서 좌/우 벽까지 거리) ③ Wall boundary(실제 벽 — 안전검증·회피 클램핑용)
{: .prompt-info }

## 파이프라인 한눈에

![Centerline 추출 파이프라인](/assets/img/posts/centerline-extraction/pipeline-mermaid.png)

> 핵심은 **채워진 주행영역 → 1px 골격 → 미터 좌표 + 폭** 으로 정보를 점점 정제하는 것. 이진 이미지가 골격(센터라인)과 벽 경계 두 갈래로 갈라졌다가 폭 계산에서 다시 만납니다.
{: .prompt-info }

## 단계별 핵심

### 1. 맵 로드 + 좌표계 정렬

`map.yaml`의 `resolution`(m/px), `origin`(좌하단 월드좌표), `occupied_thresh`만 있으면 픽셀↔미터 변환이 끝납니다. 이미지 좌표는 좌상단 원점이라 ROS(좌하단) 기준으로 상하 반전합니다.

$$
x_m = \text{col}\cdot r + o_x, \qquad y_m = \text{row}\cdot r + o_y
$$

![Step 1 — 맵 로드 / 좌표계 정렬](/assets/img/posts/centerline-extraction/step1-coord.png)

> **가짜 벽(_modi.png) 2-pass** — `map_modi.png`가 있으면 센터라인·폭은 *수정 이미지*에서(좁힌 폭이 QP 편차제약을 좁혀 라인 유도), **실제 벽 경계는 항상 원본**에서 추출. yaml의 `image:`(로컬라이제이션용)은 절대 안 건드림. GIMP로 칠합니다.
{: .prompt-warning }

![가짜 벽(_modi.png)을 GIMP로 칠하기](/assets/img/posts/centerline-extraction/modi-gimp.png)

### 2. 이진화 + Morphological Opening

임계값 넘는 픽셀=흰색(자유공간). Opening(침식→팽창)으로 점 노이즈·돌기 제거, 큰 형태는 보존.

$$
A \circ K = (A \ominus K) \oplus K \quad (K = 9\times 9)
$$

> 커널 9×9는 해상도에 민감 — 트랙이 얇거나 고해상도면 좁은 통로를 막을 수 있음.
{: .prompt-warning }

### 3. Skeletonization

채워진 주행영역을 1px 중심선으로 thinning. `skeletonize(opening, method='lee')` — 닫힌 루프에서 끊김 없이 골격을 만듭니다.

### 4. Centerline 추출 (최단 폐곡선)

`findContours`로 닫힌 contour만 추리고, 둘레가 **가장 짧은 것**을 센터라인으로 선택(안쪽 루프가 곧 중심선).

$$
L = r \sum_k \sqrt{(\Delta x_k)^2 + (\Delta y_k)^2}
$$

![Step 4 — 골격에서 센터라인 contour 선택](/assets/img/posts/centerline-extraction/step4-centerline.png)

### 5. 방향 정렬 (CCW/CW)

Shoelace 부호면적으로 회전방향 판정 — 양수=CCW, 음수=CW. `reverse`와 안 맞으면 점 순서 뒤집기.

$$
A = \tfrac{1}{2}\sum_i (x_i\,y_{i+1} - x_{i+1}\,y_i)
$$

### 6. 벽 경계 추출 + 좌/우 분류

이진 이미지에서 가장 긴 두 contour = 안/바깥 벽. 좌/우는 센터라인 접선 $t$ 과 벽 벡터 $v$ 의 2D 외적 부호로 다수결 — 음수면 진행방향 기준 오른쪽.

$$
t \times v = t_x\,v_y - t_y\,v_x
$$

![Step 6 — 좌 / 우 벽 분류](/assets/img/posts/centerline-extraction/step6-boundary.png)

### 7. 트랙 폭 (비대칭)

단순 distance transform은 좌우 대칭만 줌 → 벽 점을 **법선 방향으로 투영**해 좌/우 폭을 따로. 오른쪽 법선 $n_r = (t_y, -t_x)$ .

| 장치 | 역할 |
|---|---|
| 접선 윈도우 (window=2.0m) | 근방 벽만 보기 (반대편 직선 오검출 방지) |
| median filter (size=15, wrap) | 닫힌 루프 기준 폭 프로파일 튐 정리 |
| 하한 클램프 (0.15m) | 폭 0 → 최적화 발산 방지 |

### 8. CSV 출력

`centerline.csv` (x_m, y_m, w_tr_right_m, w_tr_left_m) → trajectory_optimizer 입력. `boundary_left/right.csv` (x_m, y_m) → 안전검증·클램핑(항상 실제 벽).

## 입출력

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| map_name | (필수) | stack_master/maps/&lt;name&gt;/ 디렉토리 |
| reverse | False | True면 CW (기본 CCW) |
| output_csv | centerline.csv | 출력 파일명 |
| show_plots / debug_steps | False | matplotlib 디버그 시각화 |

발행 토픽(RViz, **latched/TRANSIENT_LOCAL** QoS): `/centerline_waypoints/markers`(파란 구체=센터라인), `/track_bounds/markers`(초록=우/노랑=좌). 노드는 1회 실행 후 종료 → launch의 `OnProcessExit`가 다음 노드(trajectory_optimizer)를 시작.

## RoboStack로 직접 실행하기

> 이 스택은 **RoboStack**(conda로 ROS 설치, `robostack-jazzy` 채널) 기반입니다. 시스템 ROS 설치 없이 conda 환경 하나로 ROS 2 Jazzy가 돌아갑니다. `/opt/ros/...`는 source하지 않습니다.
{: .prompt-tip }

### 0~1. conda + RoboStack 환경 생성

```bash
# Miniforge (conda/mamba) — 이미 있으면 skip
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash "Miniforge3-$(uname)-$(uname -m).sh" && exec $SHELL

# RoboStack ROS 2 Jazzy 환경 생성 (environment.yml: robostack-jazzy + conda-forge)
cd ~/unicorn_ws/src/unicorn-racing-stack
conda env create -f environment.yml      # env 이름: unicorn
```

### 2. 환경 진입 + 빌드

```bash
source unicorn.sh          # = conda activate unicorn + PYTHONNOUSERSITE=1 + CycloneDDS + 워크스페이스
pip install -r requirements.txt
cbuild                     # colcon build (Release) + 재-source. unicorn.sh가 제공
```

### 3. 맵 두고 centerline 추출 실행

```bash
# stack_master/maps/<map>/ 에 <map>.yaml + <map>.png(.pgm) 준비
ros2 run planner centerline_extractor --ros-args \
    -p map_name:=<map> \
    -p reverse:=false
# → maps/<map>/centerline.csv, boundary_left.csv, boundary_right.csv 생성
```

> 결과 확인: RViz에서 `/centerline_waypoints/markers`(파란 구체)·`/track_bounds/markers`(초록/노랑) 구독. latched QoS라 노드 종료 뒤 RViz를 켜도 마지막 마커가 뜸. 디버그 플롯은 `-p show_plots:=true`.
{: .prompt-info }

## 실행 결과 — 돌리면 뭐가 나오나

위 명령(`-p map_name:=f`)을 돌렸을 때 나오는 실제 결과입니다.

**1) 라이브 실행 로그** (RoboStack conda env, `ros2 run planner centerline_extractor -p map_name:=f`):

```
[CenterlineExtractor] Found 2 closed contours
[CenterlineExtractor] Selected contour 1: 90.6m (of 2 contours)
[CenterlineExtractor] Centerline direction: CCW
[CenterlineExtractor] Boundaries: right=1866 pts, left=1538 pts
[CenterlineExtractor] Centerline: 1680 points
[CenterlineExtractor] CSV saved: .../maps/f/centerline.csv
```

**2) 생성 파일** `stack_master/maps/f/centerline.csv` (앞 3줄):

```
x_m,y_m,w_tr_right_m,w_tr_left_m
1.680903,-4.619021,1.5197,1.5197
1.736227,-4.623181,1.5098,1.5098
1.791922,-4.625915,1.5000,1.5000
```

**3) 실행 중 디버그 시각화** (`show_plots`) — ① 이진맵+골격(빨간) ② 맵 위 센터라인 ③ 미터 좌표 centerline+좌/우 경계. 노드가 실행 중 직접 출력한 그림입니다:

![centerline_extractor 디버그 출력 (map f 라이브 실행)](/assets/img/posts/centerline-extraction/run-debug.png)

**4) 트랙 폭 프로파일** — 각 centerline 점의 좌/우 폭(`w_tr`):

![트랙 폭 프로파일](/assets/img/posts/centerline-extraction/result-width.png)

**5) RViz 시각화** — `map_server`로 점유격자 맵(`/map`)을 띄우고, 노드가 발행한 centerline 마커를 올린 실제 화면. 흰 주행영역(F자 트랙) 중앙을 파란 선(센터라인)이 따라갑니다:

![RViz: 점유격자 맵 + 센터라인 마커 (라이브 실행)](/assets/img/posts/centerline-extraction/rviz-map.png)

> 마커 토픽은 latched(TRANSIENT_LOCAL)라 노드가 spin으로 떠 있는 동안 RViz를 띄우면 `/centerline_waypoints/markers`·`/track_bounds/markers`가 그대로 보입니다.

> 위 그림·로그는 RoboStack conda env에서 map `f`(F자 트랙)를 **실제 라이브 실행**한 출력입니다.
{: .prompt-tip }

## 마무리

SLAM 흑백맵 → (정제 8단계) → 최적화용 트랙 데이터. RoboStack conda 환경이면 시스템 ROS 없이 `conda env create` → `cbuild` → `ros2 run planner centerline_extractor` 세 박자로 바로 돌릴 수 있습니다. 다음 단계는 이 `centerline.csv`를 받는 [**Global Trajectory Optimization**]({{ site.baseurl }}/posts/global-trajectory-optimization/)(IQP→SP)입니다.
