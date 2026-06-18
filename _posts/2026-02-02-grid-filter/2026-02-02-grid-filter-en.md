---
title: Preventing LiDAR Wall False Detection with Grid Filter
author: hangyo-cho
date: 2026-02-02 12:00:00 +0900
categories: [Software, perception]
tags: [detection, lidar, obstacle]
image:
  path: /assets/img/posts/grid-filter/grid-filter-hero.png
lang: en
lang_ref: grid-filter
math: true
---

## Design Goal

- Filter LiDAR point cloud based on **Static Map** data to prevent wall false detection.
- Secure safe margins during vehicle driving through **Grid map Erosion** and improve perception reliability.

---

## Prior Knowledge

This filter was built based on the following design rationale:

- **High dependent on the performance of Localization result**
- **Localization need to be robust on the rapidly movement**
- **Tuning method, kernel size with Rect. kernel**

---

## Equation

![Pixel Coordinate Conversion](/assets/img/posts/grid-filter/pixel-coordinate-conversion.png){: width="240" }

### Pixel Coordinate Conversion

This equation maps global coordinates (x, y) to pixel coordinates (u, v) on the map image.

$$
u = \left\lfloor \frac{x - x_{origin}}{resolution} \right\rfloor
$$

$$
v = \left\lfloor \frac{y - y_{origin}}{resolution} \right\rfloor
$$

- $(x, y)$: Global coordinates in the real world (unit: $m$)
- $(x_{origin}, y_{origin})$: Actual coordinates where the map's Origin is located (unit: $m$)
- $resolution$: Physical size per pixel (unit: $m/pixel$)
- $(u, v)$: Pixel index on the image ($Int$)

### Physical Distance Reduction Calculation

This equation converts the **number of pixels** eroded by image processing (Erosion) to **real world meters ($m$)**.

$$
d_{reduction} = \Delta \text{pixels} \times resolution
$$

**Example**:

Calculation when **5 pixels** are eroded ($\Delta \text{pixels}$) and the map resolution is **0.05m** ($5\text{cm}$):

$$
d_{reduction} = 5 \text{ pixels} \times 0.05 \text{ m/pixel} = 0.25 \text{ m}
$$

---

## Parameter Configuration

Core settings for Grid Filter.

- **Kernel**: Rectangle Kernel (`cv::getStructuringElement(cv::MORPH_RECT, size)`)
- **Resolution**: **0.05m (5cm/pixel)**
- **Tuning Variable**: `kernel_size` (controls Erosion intensity)

---

## LUT-based Point Filtering (Core Logic)

1. Create `erodedImage` by physically expanding the non-drivable area (Black) using `cv::erode`.
2. Convert input LiDAR points to pixel indices using the pixel coordinate conversion formula.
3. Check if the pixel value at that location in `erodedImage` is 255 (White).
4. Points with pixel value 0 are immediately removed (Ignore) from clustering candidates.

---

## Key Source Code

The code below converts real world coordinates to **pixel coordinates** on the map image and **checks if Scan Data from LiDAR is in an occupied area on the Grid Map**.

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

The code below **inflates the track by a certain size on the Grid Map** to prevent wall false detection, as shown in the image above.

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

## Results

### Case 1: Grid Filter (kernel size 1)

Maximum track width can be secured, but wall noise may be introduced during rapid movements.

![Kernel Size 1](/assets/img/posts/grid-filter/kernel-size-1.gif){: width="400" }

### Case 2: Grid Filter (kernel size 11)

Sufficient separation distance from walls is secured, providing excellent false detection suppression.

![Kernel Size 11](/assets/img/posts/grid-filter/kernel-size-11.gif){: width="400" }

- **Cluster Generation Restriction**: Points in areas where Grid Filter returns `false` (black areas processed by Erosion) are excluded from the clustering input stage.
- **Conclusion**: All points entering the expanded wall area through kernel size are ignored for cluster generation, thus improving perception reliability.

---

## Summary

Grid Filter is a filtering technique that prevents wall false detection in LiDAR point clouds by utilizing static maps.

Key points summarized:
- **Erosion-based Filtering**: Uses OpenCV's `cv::erode` to expand wall areas
- **Pixel Coordinate Conversion**: Converts global coordinates to map image pixel coordinates for fast LUT-based filtering
- **Kernel Size Tuning**: Adjust `kernel_size` to balance safety margins and track width

This technique is dependent on Localization performance, so stable position estimation must be established first. When used together with robust Localization that withstands rapid movements, perception reliability can be significantly improved.
