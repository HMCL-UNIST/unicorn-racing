---
title: Grid Filter로 LiDAR 벽 오감지 방지하기
author: hangyo-cho
date: 2026-02-02 12:00:00 +0900
categories: [Software, perception]
tags: [detection, lidar, obstacle]
image:
  path: /assets/img/posts/grid-filter/grid-filter-hero.png
lang: ko
lang_ref: grid-filter
math: true
---

## 설계 목표

- **정적 지도(Static Map)** 데이터를 기반으로 LiDAR 포인트 클라우드를 필터링하여 벽 오감지를 방지합니다.
- **Grid map Erosion**을 통해 차량 주행 시 안전한 마진을 확보하고 인지 성능의 신뢰도를 높입니다.

---

## 사전 지식 및 설계 근거 (Prior Knowledge)

본 필터는 다음과 같은 설계 근거를 바탕으로 구축되었습니다:

- **High dependent on the performance of Localization result**
- **Localization need to be robust on the rapidly movement**
- **Tuning method, kernel size with Rect. kernel**

---

## 관계식 (Equation)

![Pixel Coordinate Conversion](/assets/img/posts/grid-filter/pixel-coordinate-conversion.png){: width="240" }

### 픽셀 좌표 변환

글로벌 좌표 (x, y)를 맵 이미지 상의 픽셀 좌표 (u, v)로 매핑하는 식입니다.

$$
u = \left\lfloor \frac{x - x_{origin}}{resolution} \right\rfloor
$$

$$
v = \left\lfloor \frac{y - y_{origin}}{resolution} \right\rfloor
$$

- $(x, y)$: 현실 세계의 글로벌 좌표 (단위: $m$)
- $(x_{origin}, y_{origin})$: 지도의 원점(Origin)이 위치한 실제 좌표 (단위: $m$)
- $resolution$: 픽셀 한 칸당 물리적 크기 (단위: $m/pixel$)
- $(u, v)$: 이미지 상의 픽셀 인덱스 ($Int$)

### 물리적 거리 감소량 계산

이 식은 이미지 처리(Erosion)로 깎인 **픽셀의 개수**를 **리얼 월드의 미터($m$) 단위**로 변환하는 식입니다.

$$
d_{reduction} = \Delta \text{pixels} \times resolution
$$

**예시**:

이미지 상에서 **5픽셀**을 깎았고($\Delta \text{pixels}$), 맵의 해상도가 **0.05m**($5\text{cm}$)일 때의 계산:

$$
d_{reduction} = 5 \text{ pixels} \times 0.05 \text{ m/pixel} = 0.25 \text{ m}
$$

---

## 파라미터 구성

Grid Filter의 핵심 설정값입니다.

- **Kernel**: Rectangle Kernel (`cv::getStructuringElement(cv::MORPH_RECT, size)`)
- **Resolution**: **0.05m (5cm/pixel)**
- **Tuning Variable**: `kernel_size` (Erosion 강도 조절)

---

## LUT 기반 포인트 필터링 (Core Logic)

1. `cv::erode`를 통해 주행 불가 영역(Black)을 물리적으로 확장한 `erodedImage` 생성.
2. 입력된 LiDAR 포인트를 픽셀 좌표 변환 수식을 통해 픽셀 인덱스로 변환.
3. `erodedImage`에서 해당 픽셀 값이 255(White)인지 확인.
4. 픽셀 값이 0인 포인트는 클러스터링 후보군에서 즉시 제거(Ignore).

---

## 주요 소스 코드

아래 코드는 각각 리얼 월드의 좌표를 지도 이미지의 **픽셀 좌표로 변환** 및 **LiDAR로 부터 들어온 Scan Data가 Grid Map 상의 점유된 구역에 있는지 확인**하는 역할을 합니다.

```python
# grid_filter.py
# 74~91

def world_to_pixel(self, x, y):
    """Convert world coordinates to pixel coordinates."""
    px = int((x - self.origin[0]) / self.resolution)
    py = int((y - self.origin[1]) / self.resolution)
    return px, py

def is_point_inside(self, x, y):
    """Check if a world coordinate is inside an obstacle."""
    if self.eroded_image is None:
        # rospy.logwarn("Eroded map not available.")
        return False

    px, py = self.world_to_pixel(x, y)

    if px < 0 or py < 0 or px >= self.eroded_image.shape[1] or py >= self.eroded_image.shape[0]:
        return False

    return self.eroded_image[py, px] == 255
```

![Eroded Map](/assets/img/posts/grid-filter/eroded-map.png){: width="288" }

아래 코드는 위 사진과 같이 **Grid Map에서** 벽 오감지 방지를 위하여 **트랙을 일정 크기만큼 부풀려주는 역할**을 합니다.

```python
# grid_filter.py
# 61~72

def update_image(self):
    """Apply erosion to the map."""
    if self.image is None:
        rospy.logwarn("Map image not initialized.")
        return

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (self.kernel_size, self.kernel_size))
    self.eroded_image = cv2.erode(self.image, kernel)

    if self.debug:
        cv2.imshow("Eroded Map", self.eroded_image)
        cv2.waitKey(0)
```

---

## 결과 (Results)

### Case 1: Grid Filter (kernel size 1)

트랙 폭을 최대한 확보할 수 있으나, 급격한 움직임 시 벽 노이즈가 유입될 수 있습니다.

![Kernel Size 1](/assets/img/posts/grid-filter/kernel-size-1.gif){: width="400" }

### Case 2: Grid Filter (kernel size 11)

벽으로부터 충분한 이격 거리를 확보하여 오감지 억제력이 우수합니다.

![Kernel Size 11](/assets/img/posts/grid-filter/kernel-size-11.gif){: width="400" }

- **클러스터 생성 제한**: Grid Filter가 `false`를 반환하는 영역(Erosion으로 처리된 검은색 영역)의 포인트들은 클러스터링 입력 단계에서 제외됩니다.
- **결론**: 커널 사이즈를 통해 확장된 벽 영역 안쪽으로 들어오는 모든 포인트는 클러스터 생성 자체가 무시되므로, 인지 신뢰도가 향상됩니다.

---

## 마무리

Grid Filter는 정적 지도를 활용하여 LiDAR 포인트 클라우드에서 벽 오감지를 방지하는 필터링 기법입니다.

주요 포인트를 요약하면:
- **Erosion 기반 필터링**: OpenCV의 `cv::erode`를 사용하여 벽 영역을 확장합니다
- **픽셀 좌표 변환**: 글로벌 좌표를 맵 이미지의 픽셀 좌표로 변환하여 LUT 방식으로 빠르게 필터링합니다
- **커널 사이즈 튜닝**: `kernel_size`를 조절하여 안전 마진과 트랙 폭 간의 균형을 맞춥니다

이 기법은 Localization 성능에 의존적이므로, 안정적인 위치 추정이 선행되어야 합니다. 급격한 움직임에서도 강건한 Localization과 함께 사용하면 인지 신뢰도를 크게 향상시킬 수 있습니다.
