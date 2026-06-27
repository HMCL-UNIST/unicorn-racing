---
title: "매핑 결과 가공하기: PGM을 PNG로 다듬고 가짜벽 그리기"
date: 2026-06-27 09:00:00 +0900
categories: [Software, mapping]
tags: [mapping, slam, gimp, occupancy-grid, centerline]
image:
  path: /assets/img/posts/map-image-editing/pgm-to-png.png
lang: ko
lang_ref: map-image-editing
---

> GIMP · VS Code Luna Paint
>
> 매핑 직후의 거친 맵을 `centerline_extractor`가 가공하기 좋은 깨끗한 트랙 이미지로 손질하는 단계입니다.
{: .prompt-info }

![PGM에서 PNG로 정리한 비교](/assets/img/posts/map-image-editing/pgm-to-png.png)
*매핑 원본 PGM(좌)을 노이즈 제거 후 PNG로 다듬은 결과(우)*

## 왜 손으로 다듬는가

SLAM(`slam_toolbox` 등)으로 한 바퀴 돌면 `[map_name].pgm`과 `[map_name].yaml`이 나옵니다. 하지만 이 원본은 그대로 쓰기 어렵습니다. 몇 가지 이유가 있습니다.

- **노이즈와 잔상**: 사람이 지나간 흔적, 라이다에 잠깐 잡힌 장애물, 반사로 생긴 점들이 트랙 안팎에 흩어져 있습니다. 이게 남아 있으면 skeletonize 단계에서 가짜 가지(branch)가 생겨 센터라인 추출이 실패합니다.
- **불완전한 벽**: 먼 구간의 벽이 끊겨 있거나 구멍이 뚫려 있으면, 닫힌 contour가 만들어지지 않아 트랙 폭 계산이 어긋납니다.
- **라인 유도 필요**: 시케인이나 특정 코너에서 global line을 의도한 경로로 보내고 싶을 때가 있습니다. 이건 코드가 아니라 **이미지에 가짜벽을 칠하는** 방식으로 합니다.

즉 이 단계의 목적은 세 가지입니다. **(1) 노이즈·잔상 제거**, **(2) PGM→PNG 포맷 변환**, **(3) 가짜벽(`_modi`) 편집**. 그리고 이렇게 정리한 PNG는 센터라인 추출뿐 아니라 **particle filter localization 맵**으로도 그대로 재사용할 수 있습니다.

## 전체 흐름

핵심은 **하나의 깨끗한 PNG에서 두 갈래로 갈라진다**는 점입니다.

- `[map_name].png` (정리된 원본) → particle filter의 localization 맵이자, `centerline_extractor`의 실제 벽 기준
- `[map_name]_modi.png` (가짜벽 칠한 사본, 선택) → `centerline_extractor`가 우선 사용하는 라인 유도용 이미지

## 도구 1 — GIMP

GIMP는 PGM을 직접 열고 PNG로 내보낼 수 있어, 포맷 변환과 큰 편집을 한 번에 처리하기 좋습니다.

### 1) PGM 열기

GIMP에서 `File → Open`으로 `map.pgm`을 엽니다. 점유격자는 보통 흰색(자유 공간) / 검정(점유) / 회색(미탐색)으로 표현됩니다.

### 2) 노이즈·잔상 제거

- **Pencil 도구**(연필)를 쓰는 게 핵심입니다. Brush(붓)는 가장자리가 부드럽게(anti-aliasing) 칠해져 회색 픽셀이 생기는데, 이진화 임계값 근처의 회색은 예측 불가능한 결과를 낳습니다. **Pencil은 경계가 딱 떨어지는 단색**이라 안전합니다.
- 트랙 안쪽의 검은 점·잔상은 **흰색(255)** 으로 칠해 지웁니다.
- 트랙 바깥(주행 영역이 아닌 곳)의 흰 얼룩은 **검정(0)** 으로 칠합니다.
- 끊긴 벽은 검정 Pencil로 이어 줍니다.

> 색은 반드시 순수 흰색(`#FFFFFF`)과 순수 검정(`#000000`)만 사용하세요. 회색이 섞이면 `occupied_thresh` 기준 이진화에서 의도와 다르게 분류됩니다.
{: .prompt-warning }

### 3) PNG로 내보내기

`File → Export As`로 `[map_name].png`를 저장합니다. yaml의 `image:` 필드가 가리키는 파일명과 맞춰야 합니다. (PNG는 무손실이라 매핑 이미지 보관에 적합합니다.)

## 도구 2 — VS Code Luna Paint로 빠른 편집

![VS Code Luna Paint로 맵 편집](/assets/img/posts/map-image-editing/luna-paint.png)
*VS Code 안에서 PNG를 바로 열어 픽셀 단위로 수정하는 Luna Paint*

GIMP를 따로 켜기 번거로울 때, **Luna Paint - Image Editor** 확장을 쓰면 VS Code 안에서 PNG를 바로 열어 편집할 수 있습니다. 작은 수정이나 가짜벽 그리기에 특히 편합니다.

### 설치

VS Code 확장 탭에서 "Luna Paint"를 검색해 설치합니다. 이후 탐색기에서 PNG 파일을 클릭하면 Luna Paint 캔버스로 열립니다.

> Luna Paint는 PNG·JPG 등은 잘 열지만 PGM은 지원하지 않을 수 있습니다. 그래서 **포맷 변환(PGM→PNG)은 GIMP에서 먼저 하고**, 이후의 픽셀 단위 수정은 Luna Paint에서 하는 조합이 실전에서 가장 매끄럽습니다.
{: .prompt-tip }

### 편집 요령

- **Pencil(연필) 도구**로 1px 단위 편집 — GIMP와 같은 이유로 anti-aliasing이 없는 연필을 씁니다.
- 좌측 색상에서 **검정/흰색**만 사용.
- **Zoom in** 해서 픽셀 격자가 보이는 배율에서 작업하면 트랙 경계를 정확히 맞출 수 있습니다.
- 수정 후 저장하면 원본 PNG에 바로 반영됩니다.

git으로 맵을 관리한다면 VS Code 안에서 편집→저장→커밋이 한 흐름으로 이어지는 게 Luna Paint의 가장 큰 장점입니다.

## 가짜벽(`_modi.png`) 그리기

global line을 특정 라인으로 유도하려면, 정리된 `[map_name].png`를 복제해 `[map_name]_modi.png`로 저장한 뒤 **검은색으로 가짜벽을 칠합니다.**

### 원리

`centerline_extractor`는 `_modi.png`가 있으면 **센터라인과 트랙 폭(`w_tr`)** 을 이 이미지에서 추출합니다. 가짜벽으로 주행 영역을 좁히면 그 구간의 트랙 폭이 줄어들고, 이 좁아진 폭이 곧 최적화기(IQP)의 **편차 허용 범위(deviation bound)** 를 좁혀 global line이 원하는 쪽으로 밀려납니다.

```text
map_modi.png 의 검은 벽  →  좁아진 w_tr  →  좁아진 QP deviation bound  →  유도된 raceline
```

### 작업 순서

1. 정리된 `[map_name].png`를 복사해 `[map_name]_modi.png`로 이름 변경 (같은 `maps/<map>/` 폴더 안에).
2. Luna Paint 또는 GIMP에서 열기.
3. **검은색 Pencil**로, global line을 밀어내고 싶은 쪽에 벽을 칠합니다. 예: 코너 안쪽을 막으면 라인이 바깥쪽으로, 바깥을 막으면 안쪽으로 유도됩니다.
4. 저장. 파일명만 `_modi`면 자동으로 인식되므로 yaml 수정은 필요 없습니다.

## 정리된 PNG의 재사용 — Particle Filter Localization

같은 `[map_name].png`는 경로 계획만이 아니라 **localization**에도 활용할 수 있습니다. particle filter는 라이다 스캔을 맵에 매칭해 차량 위치를 추정하는데, 이때 기준이 되는 게 바로 yaml의 `image:` 필드가 가리키는 이 PNG입니다.

그래서 노이즈 제거 작업은 일석이조입니다. 잔상을 지우면 **(1) 센터라인 추출이 안정**되고, 동시에 **(2) particle filter가 실제 벽과 깨끗하게 매칭**되어 위치 추정 품질도 올라갑니다.

> 단, **가짜벽 `_modi.png`는 localization에 쓰면 안 됩니다.** 가짜벽은 실제 환경에 없는 벽이라 라이다 스캔과 매칭되지 않습니다. yaml의 `image:`는 항상 **정리된 원본 `[map_name].png`**를 가리켜야 하고, `_modi.png`는 `centerline_extractor`만 내부적으로 참조합니다.
{: .prompt-warning }

## 파일 정리 요약

작업이 끝나면 `maps/<map>/` 폴더는 다음과 같은 상태가 됩니다.

| 파일 | 용도 | 누가 읽나 |
|---|---|---|
| `map.pgm` | 매핑 원본 (보관용) | — |
| `map.yaml` | 메타데이터 (resolution, origin, image:) | 모든 노드 |
| `map.png` | 정리된 깨끗한 트랙 | particle filter + `centerline_extractor`(실제 벽) |
| `map_modi.png` | 가짜벽 (선택) | `centerline_extractor`(센터라인·폭) |

이렇게 손질된 PNG가 준비되면, 다음 단계인 [Centerline과 트랙 경계 추출하기]({{ site.baseurl }}/posts/centerline-extraction/)가 이 이미지를 읽어 센터라인과 벽을 추출합니다.
