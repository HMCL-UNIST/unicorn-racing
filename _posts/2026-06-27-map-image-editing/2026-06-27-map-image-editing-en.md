---
title: "Editing the Mapping Output: Cleaning PGM to PNG and Drawing Fake Walls"
date: 2026-06-27 09:00:00 +0900
categories: [Software, mapping]
tags: [mapping, slam, gimp, occupancy-grid, centerline]
image:
  path: /assets/img/posts/map-image-editing/pgm-to-png.png
lang: en
lang_ref: map-image-editing
---

> GIMP · VS Code Luna Paint
>
> The step that cleans the raw map straight out of SLAM into a tidy track image that `centerline_extractor` can work with.
{: .prompt-info }

![PGM cleaned up into PNG](/assets/img/posts/map-image-editing/pgm-to-png.png)
*The raw mapping PGM (left) cleaned of noise and exported as PNG (right)*

## Why edit by hand

Driving one lap with SLAM (`slam_toolbox`, etc.) produces `[map_name].pgm` and `[map_name].yaml`. But that raw output is hard to use directly, for a few reasons.

- **Noise and ghosts**: traces of people walking by, obstacles briefly caught by the LiDAR, and points from reflections are scattered inside and outside the track. If they remain, the skeletonize step grows fake branches and centerline extraction fails.
- **Incomplete walls**: if a far wall is broken or has a hole, a closed contour cannot be formed, throwing off the track-width computation.
- **Need to guide the line**: sometimes you want to steer the global line down an intended path in a chicane or specific corner. That is done not in code but by **painting fake walls onto the image**.

So this step has three goals: **(1) remove noise/ghosts**, **(2) convert PGM→PNG**, and **(3) edit fake walls (`_modi`)**. And the PNG you clean up here can be reused as-is not only for centerline extraction but also as the **particle filter localization map**.

## The overall flow

The key point is that **everything branches from a single clean PNG**.

- `[map_name].png` (the cleaned original) → the particle filter localization map, and the real-wall reference for `centerline_extractor`
- `[map_name]_modi.png` (a copy with fake walls painted, optional) → the line-guiding image `centerline_extractor` prefers

## Tool 1 — GIMP

GIMP can open a PGM directly and export it as PNG, so it handles format conversion and large edits in one place.

### 1) Open the PGM

In GIMP, open `map.pgm` with `File → Open`. The occupancy grid is usually white (free space) / black (occupied) / gray (unexplored).

### 2) Remove noise and ghosts

- **Using the Pencil tool is the key.** The Brush paints with soft (anti-aliased) edges that create gray pixels, and gray near the binarization threshold gives unpredictable results. **The Pencil is a solid color with crisp edges**, so it is safe.
- Erase black dots/ghosts inside the track by painting them **white (255)**.
- Paint white smudges outside the track (not the driving area) **black (0)**.
- Reconnect broken walls with a black Pencil.

> Use only pure white (`#FFFFFF`) and pure black (`#000000`). If gray sneaks in, the `occupied_thresh`-based binarization classifies it differently than you intended.
{: .prompt-warning }

### 3) Export as PNG

Save `[map_name].png` with `File → Export As`. Match the filename to what the yaml's `image:` field points to. (PNG is lossless, which suits storing map images.)

## Tool 2 — Quick edits with VS Code Luna Paint

![Editing the map with Luna Paint in VS Code](/assets/img/posts/map-image-editing/luna-paint.png)
*Luna Paint opens a PNG directly inside VS Code for pixel-level edits*

When opening GIMP separately is a hassle, the **Luna Paint - Image Editor** extension lets you open and edit a PNG right inside VS Code. It is especially handy for small fixes or drawing fake walls.

### Installation

Search "Luna Paint" in the VS Code Extensions tab and install it. After that, clicking a PNG file in the explorer opens it on the Luna Paint canvas.

> Luna Paint opens PNG/JPG and so on well, but may not support PGM. So the smoothest workflow in practice is to **do the format conversion (PGM→PNG) in GIMP first**, then do the pixel-level edits in Luna Paint.
{: .prompt-tip }

### Editing tips

- Edit at 1px granularity with the **Pencil tool** — use the non-anti-aliased pencil for the same reason as in GIMP.
- Use only **black/white** from the color picker on the left.
- **Zoom in** to a magnification where the pixel grid is visible so you can match the track boundary precisely.
- Saving after editing reflects directly into the original PNG.

If you manage maps with git, the biggest advantage of Luna Paint is that edit → save → commit flows in one stream inside VS Code.

## Drawing fake walls (`_modi.png`)

To guide the global line down a particular path, copy the cleaned `[map_name].png` to `[map_name]_modi.png` and **paint fake walls in black.**

### How it works

If a `_modi.png` exists, `centerline_extractor` extracts the **centerline and track width (`w_tr`)** from this image. Narrowing the driving area with a fake wall shrinks the track width in that section, and this narrower width in turn shrinks the optimizer's (IQP) **deviation bound**, pushing the global line toward the side you want.

```text
black walls in map_modi.png  →  narrower w_tr  →  narrower QP deviation bound  →  guided raceline
```

### Step by step

1. Copy the cleaned `[map_name].png` and rename it to `[map_name]_modi.png` (in the same `maps/<map>/` folder).
2. Open it in Luna Paint or GIMP.
3. With a **black Pencil**, paint walls on the side you want to push the global line away from. E.g. blocking the inside of a corner pushes the line outward; blocking the outside pushes it inward.
4. Save. As long as the filename ends in `_modi`, it is recognized automatically — no yaml edit needed.

## Reusing the cleaned PNG — Particle Filter Localization

The same `[map_name].png` can be used not only for path planning but also for **localization**. The particle filter estimates the car's position by matching LiDAR scans to the map, and the reference for that is exactly this PNG that the yaml's `image:` field points to.

So the noise removal does double duty. Erasing ghosts makes **(1) centerline extraction stable** and simultaneously lets **(2) the particle filter match the real walls cleanly**, improving localization quality.

> However, **do not use the fake-wall `_modi.png` for localization.** Fake walls are walls that don't exist in the real environment, so they won't match LiDAR scans. The yaml's `image:` must always point to the **cleaned original `[map_name].png`**, while `_modi.png` is referenced only internally by `centerline_extractor`.
{: .prompt-warning }

## File summary

When the work is done, the `maps/<map>/` folder looks like this.

| File | Purpose | Who reads it |
|---|---|---|
| `map.pgm` | Mapping original (for archive) | — |
| `map.yaml` | Metadata (resolution, origin, image:) | All nodes |
| `map.png` | The cleaned, tidy track | particle filter + `centerline_extractor` (real walls) |
| `map_modi.png` | Fake walls (optional) | `centerline_extractor` (centerline/width) |

Once this polished PNG is ready, the next step, [Extracting the Centerline and Track Boundaries]({{ site.baseurl }}/posts/centerline-extraction/), reads this image to extract the centerline and walls.
