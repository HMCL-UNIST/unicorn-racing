---
title: Unicorn Horn Build and 3D Printing Settings
author: yunho-lee
date: 2026-01-31 14:00:00 +0900
categories: [Hardware, Manual]
tags: [3d-printing, LED, hardware, manual]
image:
  path: /assets/img/posts/unicorn-horn/horn-assembly.png
lang: en
lang_ref: unicorn-horn
---

The Unicorn horn is our team’s symbol, but it is more than decoration—it houses a [Blink mk3 USB LED]({{ site.baseurl }}/posts/blink-mk3-led/) to display the vehicle’s current state. This post introduces the horn structure and 3D printing process.

---

## Horn Structure

The Unicorn horn consists of **five parts**.

![Horn assembly](/assets/img/posts/unicorn-horn/horn-assembly.png)

| Part | Description |
|------|-------------|
| `horn_top_1` | Top part 1 |
| `horn_top_2` | Top part 2 |
| `horn_under_1` | Bottom part 1 |
| `horn_under_2` | Bottom part 2 (angle adjustment) |
| `horn_under_3` | Bottom part 3 |

To adjust the forward tilt of the horn, `horn_under_2` has **10°, 20°, 30°** versions. The default is **20°**.

---

## Blink LED Installation

![Blink disassembly](/assets/img/posts/unicorn-horn/blink-disassembly.png)
*Blink mk3 disassembled*

To insert the Blink RGB LED inside the horn, we **removed the plastic case** and placed the board inside. The rear section has space for the USB cable exit.

---

## 3D Printing Settings

The Unicorn horn should transmit light **diffusely**, so material and print settings matter.

| Setting | Recommended |
|-----------|---------|
| **Infill** | 20% |
| **Material** | NFC Nylon |

> Parts are glued in order using instant adhesive. Once bonded, it is difficult to separate, so double‑check order and orientation before assembly.
{: .prompt-warning }

---

## Download Design Files

### STL files (for 3D printing)

<ul>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_top_1_v3-1.stl" download>horn_top_1_v3-1.stl</a> — top part 1</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_top_2_v3-1.stl" download>horn_top_2_v3-1.stl</a> — top part 2</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_1_v3-1.stl" download>horn_under_1_v3-1.stl</a> — bottom part 1</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_10deg.stl" download>horn_under_2_v3_10deg.stl</a> — bottom part 2 (10°)</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_20deg.stl" download>horn_under_2_v3_20deg.stl</a> — bottom part 2 (20°, default)</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_30deg.stl" download>horn_under_2_v3_30deg.stl</a> — bottom part 2 (30°)</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_3_v3-1.stl" download>horn_under_3_v3-1.stl</a> — bottom part 3</li>
</ul>

### SLDPRT files (SolidWorks source)

<ul>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_top_1_v3.sldprt" download>horn_top_1_v3.sldprt</a></li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_top_2_v3.sldprt" download>horn_top_2_v3.sldprt</a></li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_under_1_v3.sldprt" download>horn_under_1_v3.sldprt</a></li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_under_2_v3.sldprt" download>horn_under_2_v3.sldprt</a></li>
</ul>

---

## Summary

This post introduced the Unicorn Horn design and 3D printing process, including the embedded Blink mk3 LED. While the exact design may be unique to our team, we hope it helps others working on similar projects.

For LED control, see [Showing Vehicle State with a USB LED (Blink mk3)]({{ site.baseurl }}/posts/blink-mk3-led/).
