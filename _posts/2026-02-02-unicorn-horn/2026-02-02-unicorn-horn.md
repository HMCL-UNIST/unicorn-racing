---
title: Unicorn Horn 제작 과정
author: yunho-lee
date: 2026-02-02 10:00:00 +0900
categories: [resources]
tags: [3d-printing, blink, horn]
image:
  path: /assets/img/posts/unicorn-horn/horn-assembly.png
lang: ko
lang_ref: unicorn-horn
---

![Horn 파트 구성](/assets/img/posts/unicorn-horn/horn-parts.png)

Unicorn horn은 총 5개의 파트로 이루어져 있습니다.

![Blink 분해](/assets/img/posts/unicorn-horn/blink-disassembly.png)
_blink 분해_

Horn의 빈 공간에 Blink RGB LED를 플라스틱 부분을 제거한 후 넣어주었습니다.

순서대로 순간 접착제를 사용하여 붙여주어 사용했습니다. 그렇기 때문에 한번 결합 시 분리하기 어렵습니다.

뿔 뒤쪽에는 케이블이 나올 수 있도록 공간을 만들어 두었습니다.

Unicorn horn은 빛이 불투명하게 투과되어야 하므로, 3D 프린트 시 infill과 재료를 적절히 선택해야 합니다. (Infill 20%, NFC Nylon)

---

## 마무리

동일한 파일을 사용할 팀은 없을 수 있지만, 설계 및 프린팅을 위한 파일은 아래에 공유해 두었습니다.

STL 파일은 뿔이 앞으로 나와있는 각도를 조절할 수 있도록 10°, 20°, 30°로 설계하여 업로드해 두었습니다. (Default: 20°)

**SLDPRT 파일:**
- [horn_top_1_v3.SLDPRT]({{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_top_1_v3.sldprt)
- [horn_top_2_v3.SLDPRT]({{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_top_2_v3.sldprt)
- [horn_under_1_v3.SLDPRT]({{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_under_1_v3.sldprt)
- [horn_under_2_v3.SLDPRT]({{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_under_2_v3.sldprt)
- [horn_under_3_v3.SLDPRT]({{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_under_3_v3.sldprt)

**STL 파일:**
- <a href="{{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_assem_ver3_-_horn_top_1_v3-1.stl">horn_assem_ver3 - horn_top_1_v3-1.STL</a>
- <a href="{{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_assem_ver3_-_horn_top_2_v3-1.stl">horn_assem_ver3 - horn_top_2_v3-1.STL</a>
- <a href="{{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_assem_ver3_-_horn_under_1_v3-1.stl">horn_assem_ver3 - horn_under_1_v3-1.STL</a>
- <a href="{{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_10deg.stl">horn_assem_ver3 - horn_under_2_v3_10deg.STL</a>
- <a href="{{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_20deg.stl">horn_assem_ver3 - horn_under_2_v3_20deg.STL</a>
- <a href="{{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_assem_ver3_-_horn_under_2_v3_30deg.stl">horn_assem_ver3 - horn_under_2_v3_30deg.STL</a>
- <a href="{{ site.baseurl }}/assets/img/posts/unicorn-horn/horn_assem_ver3_-_horn_under_3_v3-1.stl">horn_assem_ver3 - horn_under_3_v3-1.STL</a>