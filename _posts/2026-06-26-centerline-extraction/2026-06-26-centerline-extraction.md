---
title: "맵 이미지에서 Centerline과 트랙 경계 추출하기"
date: 2026-06-26 14:30:00 +0900
categories: [Software, mapping]
tags: [mapping, centerline, global-planning, opencv]
lang: ko
lang_ref: centerline-extraction
math: true
---

> `centerline_extractor.py` · `gb_optimizer` 패키지

Global Planning 파이프라인의 첫 단추로, SLAM으로 만든 맵 이미지를 최적화 가능한 트랙 데이터로 변환합니다.

## 목표

- **맵 → 트랙 변환**: SLAM으로 얻은 흑백 점유격자(occupancy grid) 이미지에서 주행 가능한 트랙의 **중심선(centerline)**과 **양쪽 벽(boundary)**을 자동 추출합니다.
- **최적화기가 바로 쓰는 형식**: 결과를 `centerline.csv`(x, y, 좌우 트랙 폭)와 `boundary_{left,right}.csv`로 저장해, 다음 단계인 `trajectory_optimizer`가 곧바로 global line 최적화를 수행할 수 있게 합니다.
- **가짜 벽(virtual wall) 지원**: `[map]_modi.png`로 global line을 의도한 경로로 유도하면서도, 실제 벽 경계는 원본 맵에서 따로 추출해 안전 검증·회피 경로 클램핑에 사용합니다.

## 개요

경로 계획의 출발점은 "트랙이 차량 기준 어디에 있는가"를 아는 것입니다. 입력은 SLAM(`slam_toolbox`, Cartographer 등)으로 만든 흑백 이미지 한 장뿐이고, 여기엔 좌표계도 트랙 중심도 폭 정보도 없습니다. `centerline_extractor`는 이 이미지를 가공해 다음을 만듭니다.

1. **Centerline** — 트랙 한가운데를 따라가는 닫힌 곡선 (최적화 기준선이자 좌표계 $s$의 원점)
2. **Track width** — 각 centerline 점에서 좌/우 벽까지 거리 (`w_tr_left`, `w_tr_right`)
3. **Wall boundary** — 실제 벽의 좌/우 contour (안전 검증·회피 클램핑용)

이 노드는 **한 번 실행되고 끝나는** 노드입니다. 매핑 직후 1회 실행해 CSV를 생성하면, 이후엔 `trajectory_optimizer`가 이를 읽어 global line을 최적화합니다.

## Step 1 — 맵 로드와 좌표계 정렬

`<map>.yaml`에서 메타데이터를 읽습니다. 이 세 값이 픽셀↔미터 변환의 전부입니다.

| 파라미터 | 의미 |
|---|---|
| `resolution` | 픽셀 한 칸의 실제 크기 [m/px] |
| `origin` | 맵 **좌하단**의 월드 좌표 (x, y) |
| `occupied_thresh` | 점유로 판단할 밝기 임계값 (기본 0.65) |

이미지 좌표계는 **좌상단**이 원점이고 y가 아래로 증가하지만, ROS 맵은 **좌하단**이 원점이고 y가 위로 증가합니다.

```python
img = cv2.flip(img, 0)   # 상하 반전: image top-left → ROS bottom-left
```

픽셀 (col, row)를 미터로 바꾸는 변환은 다음과 같습니다($r$=resolution, $(o_x, o_y)$=origin).

$$
x_{m} = \mathrm{col} \cdot r + o_x, \qquad y_{m} = \mathrm{row} \cdot r + o_y
$$

### `[map]_modi.png` 메커니즘 (2-pass)

global line을 특정 경로로 유도하고 싶을 때(예: 시케인에서 라인 강제), 원본 맵에 **가짜 벽을 칠한** `<map>_modi.png`를 만들어 둡니다(GIMP 등 활용).

- `_modi.png`가 있으면 → **센터라인과 트랙 폭**은 이 수정 이미지에서 추출 (좁아진 폭이 QP 편차 제약을 좁혀 원하는 라인을 유도)
- **실제 벽 경계**는 항상 원본 `<map>.png`에서 추출 (boundary·안전 검증은 진짜 벽 기준이어야 함)
- `yaml`의 `image:`(로컬라이제이션용 원본)은 건드리지 않음

```python
modi_path = os.path.join(self.map_dir, f'{self.map_name}_modi.png')
use_modi = os.path.exists(modi_path)
img_path = modi_path if use_modi else os.path.join(self.map_dir, map_data['image'])
```

## Step 2 — 이진화와 Morphological Opening

골격을 뽑으려면 먼저 "어디가 주행 가능 영역인가"를 깔끔한 흑백으로 정리합니다.

**이진화**: 임계값을 넘는 픽셀(자유 공간)을 흰색(255), 나머지를 검정(0)으로.

```python
threshold = int(occupied_thresh * 255)
bw = np.where(img > threshold, 255, 0).astype(np.uint8)
```

**Opening(열림)**: 침식 → 팽창을 연이어 적용해 작은 흰색 노이즈를 제거하면서 큰 형태는 보존합니다($A$=이진 이미지, $K$=9×9 커널, $\ominus$=침식, $\oplus$=팽창).

$$
A \circ K = (A \ominus K) \oplus K
$$

```python
kernel = np.ones((9, 9), np.uint8)
opening = cv2.morphologyEx(bw, cv2.MORPH_OPEN, kernel, iterations=1)
```

> ⚠️ 커널 크기 `9×9`는 맵 해상도에 민감합니다. 트랙이 얇거나 해상도가 높으면 큰 커널이 좁은 통로를 막을 수 있습니다.
{: .prompt-warning }

## Step 3 — Skeletonization (골격화)

채워진 주행 영역을 **두께 1픽셀의 중심선**으로 얇게 깎습니다. 형태·연결성을 유지하면서 경계로부터 가장 먼 "medial axis"만 남깁니다.

```python
from skimage.morphology import skeletonize
skeleton = skeletonize(opening, method='lee')
```

`method='lee'`는 토폴로지를 보존하는 안정적 thinning이라, 닫힌 루프 형태에서 끊김 없이 골격을 만듭니다.

## Step 4 — Centerline 추출 (최단 폐곡선 선택)

골격에는 여러 contour가 잡힐 수 있습니다(트랙 루프, 노이즈 가지 등). 원하는 건 **트랙을 한 바퀴 도는 가장 짧은 닫힌 곡선**입니다. `cv2.findContours`로 찾은 뒤 hierarchy로 닫힌 것만 추립니다.

```python
contours, hierarchy = cv2.findContours(
    skeleton_img, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)

closed_contours = []
for i, cont in enumerate(contours):
    opened = hierarchy[0][i][2] < 0 and hierarchy[0][i][3] < 0
    if not opened:
        closed_contours.append(cont)
```

각 닫힌 contour의 둘레를 미터로 계산해 **가장 짧은 것**을 센터라인으로 택합니다($r$=resolution, $\Delta x_k, \Delta y_k$=인접 점 픽셀 변위).

$$
L = r \sum_{k} \sqrt{(\Delta x_k)^2 + (\Delta y_k)^2}
$$

## Step 5 — 스무딩과 방향 정렬

**Savitzky-Golay 스무딩**: 슬라이딩 윈도우에서 3차 다항식을 최소제곱으로 맞춰, 단순 이동평균과 달리 코너의 **곡률을 보존**하며 계단형 들쭉날쭉함을 없앱니다.

```python
smooth = savgol_filter(centerline, filter_length, 3, axis=0)
```

**방향 정렬(CCW/CW)**: raceline 최적화와 좌표계 $s$ 진행 방향을 일관되게 하려면 회전 방향을 고정해야 합니다. **Shoelace 공식**으로 부호 있는 면적을 계산합니다.

$$
A = \frac{1}{2}\sum_{i} \left( x_i y_{i+1} - x_{i+1} y_i \right)
$$

$A > 0$이면 반시계(CCW), $A < 0$이면 시계(CW)입니다. `reverse` 설정과 맞지 않으면 점 순서를 뒤집습니다.

## Step 6 — 벽 경계 추출과 좌/우 분류

`opening` 이진 이미지에서 다시 `findContours`를 돌리면, 가장 긴 두 contour가 곧 **트랙의 안/바깥 벽**입니다. "어느 쪽이 좌/우인가"는 센터라인 접선 $\mathbf{t}$와 벽까지 벡터 $\mathbf{v}$의 **외적 부호로 투표**해 결정합니다.

$$
\mathbf{t} \times \mathbf{v} = t_x v_y - t_y v_x
$$

이 값이 음수면 그 벽은 진행 방향 기준 **오른쪽**입니다. 여러 샘플 점에서 다수결로 확정합니다.

## Step 7 — 트랙 폭 계산 (비대칭)

최적화기는 각 센터라인 점에서 **좌/우로 얼마나 벗어나도 되는지**를 알아야 합니다. 단순 distance transform은 대칭만 주므로, boundary 점을 **법선 방향으로 투영**해 좌/우 폭을 따로 구합니다(오른쪽 법선 $\mathbf{n}_r = (t_y, -t_x)$).

```python
normal_r = np.array([tangent[1], -tangent[0]])
proj_n_r = (bound_r - cl_pt) @ normal_r          # 법선 방향 투영
proj_t_r = np.abs((bound_r - cl_pt) @ tangent)   # 접선 방향 거리
mask_r = (proj_n_r > min_lateral) & (proj_t_r < window)
w_right[i] = proj_n_r[mask_r].min()
```

- **접선 방향 윈도우(`window=2.0m`)**: 근처 벽만 보도록 제한 (반대편 직선이 잡히는 것 방지)
- **median filter(size=15, wrap)**: 폭 프로파일의 튀는 값을 닫힌 루프 기준으로 정리
- **하한 클램프(0.15m)**: 폭이 0이 되어 최적화가 발산하는 것 방지

## Step 8 — CSV 출력

최종 결과를 두 종류의 CSV로 저장합니다. 이것이 다음 단계로 넘어가는 **인터페이스**입니다.

**`centerline.csv`** — `trajectory_optimizer` 입력

```csv
x_m, y_m, w_tr_right_m, w_tr_left_m
12.340000, 3.210000, 0.8500, 0.9200
...
```

**`boundary_left.csv` / `boundary_right.csv`** — 안전 검증·회피 클램핑용 (항상 실제 벽)

```csv
x_m, y_m
11.980000, 2.870000
...
```

## 노드 생명주기

```text
[mapping] → centerline_extractor → trajectory_optimizer → global_trajectory_publisher
            (1회 실행 후 종료)        (IQP → SP 최적화)        (런타임 재발행)
```

`centerline_extractor`는 `extract()`를 `__init__`에서 끝내고 **즉시 종료**합니다. launch 파일의 `OnProcessExit` 핸들러가 이 종료를 신호로 받아 다음 노드(`trajectory_optimizer`)를 시작하도록 설계되었기 때문입니다.

## 마무리

`centerline_extractor`는 **채워진 주행 영역 → 1픽셀 골격 → 미터 좌표 + 폭**으로 정보를 점점 정제해, 한 장의 SLAM 맵을 최적화 가능한 트랙 데이터로 바꿉니다. centerline·boundary CSV가 만들어지면 raceline 최적화와 속도 프로파일 생성으로 넘어갈 수 있습니다.
