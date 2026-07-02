---
title: "Detection — Feature Extraction: 클러스터를 사각형으로 요약하기"
author: jeongsang-ryu
date: 2026-07-02 04:00:00 +0900
categories: [racing stack, perception]
tags: [detection, feature-extraction, l-shape-fitting, rectangle]
image:
  path: /assets/img/posts/detection-feature-extraction/image.png
lang: ko
lang_ref: detection-feature-extraction
math: true
---

지난 글 [Detection & Clustering]({{ site.baseurl }}/posts/detection-clustering/)에서는 흩어진 점들을 clustering으로 작은 pointset들로 묶었습니다. 그런데 cluster는 아직 *"점의 집합"*일 뿐입니다. 이걸 그대로 tracking에 넘기면 표현이 무겁고, 상대의 **방향·크기** 같은 물리량도 알 수 없습니다. 그래서 하나의 클러스터를 대표하는 상태(feature)를 추출해야 합니다.

## Rectangle Extraction

![](/assets/img/posts/detection-feature-extraction/image-1.png)

차량과 감지 박스는 결국 **직사각형**에 가깝습니다. 그래서 클러스터를 감싸는 사각형을 찾아 상대를 요약합니다.

방법은 단순합니다. 가능한 모든 방향 $\theta$ 를 훑으면서 그 방향으로 점들을 감싸는 사각형을 만들고, 정해진 점수 기준에서 **점수가 가장 높은(또는 가장 낮은) 방향**을 고릅니다. 최종적으로 상대를 **center · size · orientation($\theta$)** 로 요약한 박스를 얻습니다.

이렇게 얻은 박스는 tracking·prediction 단계에서 상대의 위치뿐 아니라 진행 방향과 크기까지 가볍게 전달할 수 있는 표현이 됩니다.

## 방향을 고르는 두 가지 기준(Criterion)

![](/assets/img/posts/detection-feature-extraction/image-2.png)

그렇다면 "가장 좋은 방향"을 무엇으로 판단할까요? 대표적으로 **두 가지 기준(criterion)**이 있습니다 — 변에 점이 얼마나 붙는지 보는 **Closeness**와, 감싸는 넓이가 최소인지 보는 **Area Minimization**입니다.

### 1. Closeness — 변에 점이 가장 가까이 붙는 방향

각 방향에서 점들을 사각형의 두 축(변)에 투영했을 때, **점들이 변에 얼마나 바싹 붙는지**를 점수로 씁니다. 한 변이 실제 물체의 모서리와 나란히 정렬되면 점들이 그 변에 몰리며 점수가 최대가 됩니다.

아래 데모에서 **왼쪽 애니메이션**은 방향 $\theta$ 를 돌리며 점들이 x/y 축에 투영되는 모습을, **오른쪽 그래프**는 그때의 closeness score를 보여줍니다. 점수가 최대가 되는 $\theta^{*}$ 에서 변이 모서리에 딱 맞는 것을 확인할 수 있습니다. **Full rectangle**(네 변 다 보임)과 **Half(2 faces)**(실제 라이다처럼 두 변만 보임)를 전환해보면, closeness는 두 면만 보이는 현실 상황에서도 $0°/90°$ 에서 점수가 깔끔하게 서는 것을 볼 수 있습니다.

<iframe src="{{ site.baseurl }}/assets/img/posts/detection-feature-extraction/closeness-demo.html" title="Rectangle fitting — closeness criterion demo" loading="lazy" style="width:100%;height:740px;border:1px solid #2a3550;border-radius:8px;"></iframe>

### 2. Area Minimization — 감싸는 넓이가 최소인 방향

또 다른 기준은 **사각형(bounding box)의 넓이가 최소가 되는 방향**을 고르는 것입니다. 점들을 가장 빈틈없이 감싸는 방향이 곧 물체의 방향이라는 직관입니다.

다만 한계가 있습니다. 실제 한 시점의 라이다는 물체의 **두 면(L자 형태)** 정도만 측정합니다. 네 변이 모두 관측되면 넓이 최소화가 정확하지만, 두 면만 보이는 경우에는 여러 방향에서 감싸는 넓이가 비슷해져 **최소 지점이 모호(ambiguous)**해집니다. 이런 상황에서는 앞의 closeness 기준이 더 안정적입니다.

아래 데모에서 방향에 따라 bounding box의 넓이가 어떻게 변하는지, 그리고 두 면만 보일 때 최소 지점이 얼마나 평평(모호)해지는지 비교해보세요.

<iframe src="{{ site.baseurl }}/assets/img/posts/detection-feature-extraction/area-demo.html" title="Rectangle fitting — area minimization demo" loading="lazy" style="width:100%;height:740px;border:1px solid #2a3550;border-radius:8px;"></iframe>

## 마무리

clustering으로 묶은 점의 집합을, 방향 $\theta$ 를 훑어 감싸는 사각형으로 요약해 **center · size · orientation**을 뽑아내는 과정을 다뤘습니다. 방향 선택 기준으로는 변에 점이 붙는 정도를 보는 **Closeness**와 감싸는 넓이를 보는 **Area Minimization**이 있으며, 두 면(L자)만 보이는 실제 라이다 환경에서는 closeness가 더 강인합니다.

이렇게 추출한 박스(feature)는 다음 단계인 tracking·prediction으로 넘어가, 상대 차량의 궤적을 추정하는 입력이 됩니다.

## 참고자료

- [datmo (kostaskonkk/datmo)](https://github.com/kostaskonkk/datmo)
- [TU Delft — Detection and tracking of moving objects (thesis)](https://repository.tudelft.nl/file/File_55415b6d-b835-4390-92df-843ebed8d946?preview=1)

<script>
(function () {
  function fit(f) {
    try {
      var d = f.contentDocument || f.contentWindow.document;
      var h = Math.ceil(d.documentElement.scrollHeight);
      if (h > 60) f.style.height = (h + 4) + "px";
    } catch (e) {}
  }
  function fitAll() {
    document.querySelectorAll('iframe[src*="/assets/img/posts/"]').forEach(function (f) {
      var run = function () { fit(f); setTimeout(function () { fit(f); }, 400); };
      if (f.contentDocument && f.contentDocument.readyState === "complete") run();
      f.addEventListener("load", run);
    });
  }
  if (document.readyState === "complete") fitAll(); else window.addEventListener("load", fitAll);
  var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fitAll, 200); });
})();
</script>
