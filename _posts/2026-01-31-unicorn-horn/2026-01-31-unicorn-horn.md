---
title: Unicorn Horn 제작 과정과 3D 프린팅 설정
author: yunho-lee
date: 2026-01-31 14:00:00 +0900
categories: [Hardware, Manual]
tags: [3d-printing, LED, hardware, manual]
image:
  path: /assets/img/posts/unicorn-horn/horn-assembly.png
lang: ko
lang_ref: unicorn-horn
---

저희 팀의 상징인 Unicorn 뿔은 단순한 장식이 아니라, [Blink mk3 USB LED]({{ site.baseurl }}/posts/blink-mk3-led/)를 내장하여 차량의 현재 상태를 표시하는 역할을 합니다. 이 글에서는 Unicorn Horn의 구조와 3D 프린팅 제작 과정을 소개합니다.

---

## Horn 구조

Unicorn Horn은 총 **5개의 파트**로 구성되어 있습니다.

![Horn 조립 구조](/assets/img/posts/unicorn-horn/horn-assembly.png)

| 파트 | 설명 |
|------|------|
| `horn_top_1` | 뿔 상단 파트 1 |
| `horn_top_2` | 뿔 상단 파트 2 |
| `horn_under_1` | 뿔 하단 파트 1 |
| `horn_under_2` | 뿔 하단 파트 2 (각도 조절용) |
| `horn_under_3` | 뿔 하단 파트 3 |

뿔이 앞으로 나오는 각도를 조절할 수 있도록 `horn_under_2`는 **10°, 20°, 30°** 세 가지 버전으로 설계했습니다. 기본값은 **20°**입니다.

---

## Blink LED 장착

![Blink 분해](/assets/img/posts/unicorn-horn/blink-disassembly.png)
*Blink mk3 분해 모습*

Horn의 빈 공간에 Blink RGB LED를 넣기 위해 **플라스틱 케이스를 제거**한 후 삽입했습니다. 뿔 뒤쪽에는 USB 케이블이 나올 수 있도록 공간을 만들어 두었습니다.

---

## 3D 프린팅 설정

Unicorn Horn은 빛이 **불투명하게 투과**되어야 하므로, 3D 프린트 시 재료와 설정 선택이 중요합니다.

| 설정 항목 | 권장 값 |
|-----------|---------|
| **Infill** | 20% |
| **재료** | NFC Nylon |

> 각 파트는 순간 접착제를 사용하여 순서대로 붙여 결합합니다. 한번 결합하면 분리가 어려우니 조립 전에 순서와 방향을 충분히 확인하세요.
{: .prompt-warning }

---

## 설계 파일 다운로드

### STL 파일 (3D 프린팅용)

<ul>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_top_1_v3-1.stl" download>horn_top_1_v3-1.stl</a> — 상단 파트 1</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_top_2_v3-1.stl" download>horn_top_2_v3-1.stl</a> — 상단 파트 2</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_1_v3-1.stl" download>horn_under_1_v3-1.stl</a> — 하단 파트 1</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_10deg.stl" download>horn_under_2_v3_10deg.stl</a> — 하단 파트 2 (10°)</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_20deg.stl" download>horn_under_2_v3_20deg.stl</a> — 하단 파트 2 (20°, 기본)</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_30deg.stl" download>horn_under_2_v3_30deg.stl</a> — 하단 파트 2 (30°)</li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_assem_ver3_-_horn_under_3_v3-1.stl" download>horn_under_3_v3-1.stl</a> — 하단 파트 3</li>
</ul>

### SLDPRT 파일 (SolidWorks 원본)

<ul>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_top_1_v3.sldprt" download>horn_top_1_v3.sldprt</a></li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_top_2_v3.sldprt" download>horn_top_2_v3.sldprt</a></li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_under_1_v3.sldprt" download>horn_under_1_v3.sldprt</a></li>
  <li><a href="{{ site.baseurl }}/assets/files/unicorn-horn/horn_under_2_v3.sldprt" download>horn_under_2_v3.sldprt</a></li>
</ul>

---

## 마무리

이 글에서는 Blink mk3 LED를 내장한 Unicorn Horn의 구조와 3D 프린팅 제작 방법을 소개했습니다. 동일한 설계를 사용할 팀은 없을 수 있지만, 유사한 프로젝트를 진행하시는 분들에게 참고가 되었으면 합니다.

LED 제어 방법이 궁금하시다면 [USB LED로 차량 상태를 표시하는 방법 (Blink mk3)]({{ site.baseurl }}/posts/blink-mk3-led/) 포스트를 참고하세요.
