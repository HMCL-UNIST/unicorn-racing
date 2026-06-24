---
title: "Docs"
icon: fas fa-book-open
date: 2026-01-29 00:00:00 +0900
categories: [resources]
tags: [links, navigation]
order: 0
---

<style>
.wiki-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border-color, #ddd);
}

.wiki-section-title i {
  font-size: 1.3em;
  color: var(--link-color, #0066cc);
}

.wiki-section-title h2 {
  margin: 0;
  font-size: 1.4em;
}

.wiki-list {
  margin: 0 0 28px 1.2rem;
  padding: 0;
}

.wiki-list li {
  padding: 6px 0;
}

.wiki-list a {
  color: var(--link-color, #0066cc);
  text-decoration: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}

.wiki-list .is-disabled {
  color: var(--text-muted-color, #6c757d);
  cursor: not-allowed;
  text-decoration: none;
  pointer-events: none;
}

/* Hardware overview */
.hw-intro { margin: 8px 0 28px; }
.hw-lead { color: var(--text-muted-color, #6c757d); margin-bottom: 18px; }

.hw-top {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 28px;
}
.hw-photo { flex: 1 1 300px; margin: 0; }
.hw-photo img { width: 100%; border-radius: 12px; display: block; }
.hw-photo figcaption {
  text-align: center;
  font-size: 0.85em;
  color: var(--text-muted-color, #6c757d);
  margin-top: 6px;
}

.hw-spec {
  flex: 1 1 340px;
  border-collapse: collapse;
  font-size: 0.95em;
}
.hw-spec th, .hw-spec td {
  border: 1px solid var(--border-color, #ddd);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}
.hw-spec th {
  width: 32%;
  white-space: nowrap;
  background: var(--card-bg, #f7f7f7);
  color: var(--text-color);
  font-weight: 600;
}

.hw-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 32px;
}
.hw-step {
  flex: 1 1 130px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
  padding: 14px 12px;
  text-align: center;
  background: var(--card-bg, #fff);
}
.hw-step .hw-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  margin-bottom: 8px;
  border-radius: 50%;
  background: var(--link-color, #0066cc);
  color: #fff;
  font-size: 0.85em;
  font-weight: 700;
}
.hw-step .hw-name { display: block; font-weight: 600; }
.hw-step .hw-sub { display: block; font-size: 0.82em; color: var(--text-muted-color, #6c757d); margin-top: 3px; }
.hw-arrow {
  display: flex;
  align-items: center;
  color: var(--text-muted-color, #6c757d);
  font-size: 1.3em;
}
@media (max-width: 600px) {
  .hw-flow { flex-direction: column; }
  .hw-arrow { justify-content: center; transform: rotate(90deg); }
  .hw-spec th { width: 40%; }
}
</style>

<!-- ===================== Hardware Overview ===================== -->
<div class="hw-intro">

  <p class="hw-lead">
    <span data-lang="ko">UNICORN Racing의 자율주행 레이싱카 하드웨어 구성과 빌드 흐름입니다. 처음이라면 Beginner부터 순서대로 따라오세요.</span>
    <span data-lang="en">Hardware stack and build flow of the UNICORN Racing autonomous race car. New here? Follow the Beginner track in order.</span>
  </p>

  <div class="hw-top">
    <figure class="hw-photo">
      <img src="/assets/img/posts/2025-icra-roboracer/vehicle-photo.jpg" alt="UNICORN Racing autonomous race car">
      <figcaption>
        <span data-lang="ko">RoboRacer 플랫폼 기반 완성 차량 (2025 ICRA RoboRacer)</span>
        <span data-lang="en">A completed car on the RoboRacer platform (2025 ICRA RoboRacer)</span>
      </figcaption>
    </figure>

    <table class="hw-spec">
    <tr>
      <th><span data-lang="ko">플랫폼</span><span data-lang="en">Platform</span></th>
      <td>RoboRacer <span data-lang="ko">(구 F1TENTH)</span><span data-lang="en">(formerly F1TENTH)</span></td>
    </tr>
    <tr>
      <th><span data-lang="ko">섀시</span><span data-lang="en">Chassis</span></th>
      <td>Serpent SRX8 (1/8) · Traxxas (1/10)</td>
    </tr>
    <tr>
      <th><span data-lang="ko">연산 보드</span><span data-lang="en">Compute</span></th>
      <td>Intel NUC · NVIDIA Jetson Orin NX</td>
    </tr>
    <tr>
      <th><span data-lang="ko">모터 컨트롤러</span><span data-lang="en">Motor Controller</span></th>
      <td>VESC 6 <span data-lang="ko">(권장 펌웨어 6.05)</span><span data-lang="en">(firmware 6.05 recommended)</span></td>
    </tr>
    <tr>
      <th>LiDAR</th>
      <td>Hokuyo UST-10LX / 30LX (2D)</td>
    </tr>
    <tr>
      <th><span data-lang="ko">자세 · 주행거리</span><span data-lang="en">IMU / Odometry</span></th>
      <td><span data-lang="ko">VESC 내장 IMU · 휠 오도메트리</span><span data-lang="en">VESC built-in IMU · wheel odometry</span></td>
    </tr>
    <tr>
      <th><span data-lang="ko">전원</span><span data-lang="en">Power</span></th>
      <td><span data-lang="ko">4S LiPo · XT 커넥터 분배 · 서보는 Matek BEC</span><span data-lang="en">4S LiPo · XT distribution · servo via Matek BEC</span></td>
    </tr>
    </table>
  </div>

  <div class="hw-flow">
    <div class="hw-step">
      <span class="hw-num">1</span>
      <span class="hw-name"><span data-lang="ko">전원 · 배선</span><span data-lang="en">Power &amp; Wiring</span></span>
      <span class="hw-sub"><span data-lang="ko">회로 · 배터리 · BEC</span><span data-lang="en">Circuit · battery · BEC</span></span>
    </div>
    <div class="hw-arrow">→</div>
    <div class="hw-step">
      <span class="hw-num">2</span>
      <span class="hw-name"><span data-lang="ko">VESC 세팅</span><span data-lang="en">VESC Setup</span></span>
      <span class="hw-sub"><span data-lang="ko">펌웨어 · FOC · PID</span><span data-lang="en">Firmware · FOC · PID</span></span>
    </div>
    <div class="hw-arrow">→</div>
    <div class="hw-step">
      <span class="hw-num">3</span>
      <span class="hw-name"><span data-lang="ko">기구 조립</span><span data-lang="en">Assembly</span></span>
      <span class="hw-sub"><span data-lang="ko">섀시 · 상판 · 센서 장착</span><span data-lang="en">Chassis · plate · sensors</span></span>
    </div>
    <div class="hw-arrow">→</div>
    <div class="hw-step">
      <span class="hw-num">4</span>
      <span class="hw-name"><span data-lang="ko">정렬 · 캘리브레이션</span><span data-lang="en">Calibration</span></span>
      <span class="hw-sub"><span data-lang="ko">ERPM · 서보 · TF</span><span data-lang="en">ERPM · servo · TF</span></span>
    </div>
  </div>

</div>

<!-- Wiki Sections -->
{% for section in site.data.wiki.wiki %}
<div class="wiki-section-title" id="{{ section.section }}">
  <i class="{{ section.icon }}"></i>
  <h2>{{ section.title }}</h2>
</div>

<ol class="wiki-list">
  {% for link in section.steps %}
  {% if link.url %}
    {% if link.external %}
    <li>
      <a href="{{ link.url }}" target="_blank">
        {{ link.title }}
      </a>
    </li>
    {% else %}
      {% assign matched_post = site.posts | where: "url", link.url | first %}
      {% if matched_post and matched_post.lang_ref %}
        {% assign same_lang_posts = site.posts | where: "lang_ref", matched_post.lang_ref %}
        {% assign ko_post = same_lang_posts | where_exp: "p", "p.lang == 'ko' or p.lang == nil" | first %}
        {% assign en_post = same_lang_posts | where: "lang", "en" | first %}
        {% if ko_post %}
        <li data-lang="ko" data-lang-ref="{{ ko_post.lang_ref }}">
          <a href="{{ ko_post.url | relative_url }}">{{ ko_post.title }}</a>
        </li>
        {% endif %}
        {% if en_post %}
        <li data-lang="en" data-lang-ref="{{ en_post.lang_ref }}">
          <a href="{{ en_post.url | relative_url }}">{{ en_post.title }}</a>
        </li>
        {% endif %}
      {% else %}
      <li>
        <a href="{{ link.url | relative_url }}">
          {{ link.title }}
        </a>
      </li>
      {% endif %}
    {% endif %}
  {% else %}
  <li>
    <span class="is-disabled">{{ link.title }}</span>
  </li>
  {% endif %}
  {% endfor %}
</ol>
{% endfor %}
