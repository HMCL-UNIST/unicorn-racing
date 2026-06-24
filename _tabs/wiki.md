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

/* Key components grid */
.hw-parts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.part-card {
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg, #fff);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
}
.part-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.12); transform: translateY(-2px); }
.part-card a { color: inherit; text-decoration: none !important; border-bottom: none !important; display: flex; flex-direction: column; height: 100%; }
.part-photo {
  width: 100%;
  height: 150px;
  object-fit: contain;
  background: #fafafa;
  padding: 6px;
  border-bottom: 1px solid var(--border-color, #ddd);
}
.part-photo--todo {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.82em;
  color: var(--text-muted-color, #6c757d);
  background: repeating-linear-gradient(45deg, var(--card-bg,#f7f7f7), var(--card-bg,#f7f7f7) 10px, rgba(127,127,127,0.06) 10px, rgba(127,127,127,0.06) 20px);
}
.part-body { padding: 12px 14px; }
.part-name { font-weight: 700; font-size: 0.96em; }
.part-model { font-size: 0.85em; color: var(--text-color); margin-top: 2px; }
.part-specs {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  font-size: 0.78em;
  color: var(--text-muted-color, #6c757d);
  line-height: 1.5;
}
.part-specs li { padding: 1px 0 1px 12px; position: relative; }
.part-specs li::before {
  content: "·";
  position: absolute;
  left: 2px;
  color: var(--link-color, #0066cc);
  font-weight: 700;
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

<!-- ===================== Key Components ===================== -->
<div class="wiki-section-title">
  <i class="fas fa-microchip"></i>
  <h2><span data-lang="ko">주요 부품</span><span data-lang="en">Key Components</span></h2>
</div>

<div class="hw-parts">

  <div class="part-card">
    <a href="{{ '/posts/chassis-top-plate-assembly/' | relative_url }}">
      <img class="part-photo" src="/assets/img/posts/chassis-top-plate-assembly/srx8-empty.jpg" alt="Serpent SRX8 chassis">
      <div class="part-body">
        <div class="part-name"><span data-lang="ko">섀시</span><span data-lang="en">Chassis</span></div>
        <div class="part-model">Serpent SRX8</div>
        <ul class="part-specs">
          <li><span data-lang="ko">1/8 스케일 부기</span><span data-lang="en">1/8-scale buggy</span></li>
          <li><span data-lang="ko">알루미늄 + 카본 하판</span><span data-lang="en">Aluminum + carbon deck</span></li>
          <li><span data-lang="ko">17mm 육각 휠</span><span data-lang="en">17 mm hex wheels</span></li>
        </ul>
      </div>
    </a>
  </div>

  <div class="part-card">
    <a href="{{ '/posts/vesc-general-tab-motor-settings/' | relative_url }}">
      <img class="part-photo" src="/assets/img/posts/vesc-imu/overview.png" alt="VESC 6 MK VI">
      <div class="part-body">
        <div class="part-name"><span data-lang="ko">모터 컨트롤러</span><span data-lang="en">Motor Controller</span></div>
        <div class="part-model">VESC 6 MK VI</div>
        <ul class="part-specs">
          <li><span data-lang="ko">60V 정격 (최대 12S)</span><span data-lang="en">60 V rated (up to 12S)</span></li>
          <li><span data-lang="ko">연속 80A · 피크 120A</span><span data-lang="en">80 A cont. · 120 A peak</span></li>
          <li><span data-lang="ko">FOC 제어 · 내장 IMU</span><span data-lang="en">FOC control · built-in IMU</span></li>
          <li><span data-lang="ko">권장 펌웨어 6.05</span><span data-lang="en">Firmware 6.05 recommended</span></li>
        </ul>
      </div>
    </a>
  </div>

  <div class="part-card">
    <a href="{{ '/posts/lidar-ip-address-wireshark/' | relative_url }}">
      <img class="part-photo" src="/assets/img/posts/lidar-ip-address-wireshark/lidar-overview.png" alt="Hokuyo LiDAR">
      <div class="part-body">
        <div class="part-name">LiDAR</div>
        <div class="part-model">Hokuyo UST-10LX / 30LX</div>
        <ul class="part-specs">
          <li><span data-lang="ko">2D 스캔 · 270° 시야각</span><span data-lang="en">2D scan · 270° FOV</span></li>
          <li><span data-lang="ko">각분해능 0.25° · 40Hz</span><span data-lang="en">0.25° resolution · 40 Hz</span></li>
          <li><span data-lang="ko">측정거리 10m / 30m</span><span data-lang="en">10 m / 30 m range</span></li>
          <li><span data-lang="ko">이더넷 연결</span><span data-lang="en">Ethernet interface</span></li>
        </ul>
      </div>
    </a>
  </div>

  <div class="part-card">
    <a href="{{ '/posts/servo-voltage-bec/' | relative_url }}">
      <img class="part-photo" src="/assets/img/posts/servo-voltage-bec/b210-servo.png" alt="Steering servo">
      <div class="part-body">
        <div class="part-name"><span data-lang="ko">조향 서보</span><span data-lang="en">Steering Servo</span></div>
        <div class="part-model">HIGHEST B210 HV</div>
        <ul class="part-specs">
          <li><span data-lang="ko">브러시리스 · 풀메탈 기어 (25T)</span><span data-lang="en">Brushless · full metal gear (25T)</span></li>
          <li><span data-lang="ko">토크 24.5 / 31.1 kg·cm (6.0 / 7.4V)</span><span data-lang="en">24.5 / 31.1 kg·cm (6.0 / 7.4 V)</span></li>
          <li><span data-lang="ko">속도 0.12 / 0.09 s·60°</span><span data-lang="en">0.12 / 0.09 s·60°</span></li>
          <li><span data-lang="ko">6.0–7.4V (Matek BEC 공급) · 73g</span><span data-lang="en">6.0–7.4 V (via Matek BEC) · 73 g</span></li>
        </ul>
      </div>
    </a>
  </div>

  <div class="part-card">
    <a href="{{ '/posts/status-led-blink-mk3/' | relative_url }}">
      <img class="part-photo" src="/assets/img/posts/unicorn-horn/horn-overview-2026.png" alt="Status LED unicorn horn">
      <div class="part-body">
        <div class="part-name"><span data-lang="ko">상태 LED</span><span data-lang="en">Status LED</span></div>
        <div class="part-model"><span data-lang="ko">유니콘 혼 (Blink mk3)</span><span data-lang="en">Unicorn horn (Blink mk3)</span></div>
        <ul class="part-specs">
          <li><span data-lang="ko">3D 프린트 혼 하우징</span><span data-lang="en">3D-printed horn housing</span></li>
          <li><span data-lang="ko">어드레서블 LED</span><span data-lang="en">Addressable LED</span></li>
          <li><span data-lang="ko">ROS로 주행 상태 표시</span><span data-lang="en">ROS-driven status display</span></li>
        </ul>
      </div>
    </a>
  </div>

  <div class="part-card">
    <div class="part-photo part-photo--todo">
      <span data-lang="ko">📷 사진 준비 중</span><span data-lang="en">📷 photo coming</span>
    </div>
    <div class="part-body">
      <div class="part-name"><span data-lang="ko">연산 보드</span><span data-lang="en">Compute</span></div>
      <div class="part-model"><span data-lang="ko">2가지 구성</span><span data-lang="en">Two options</span></div>
      <ul class="part-specs">
        <li>Intel NUC <span data-lang="ko">(x86 · 무거운 연산)</span><span data-lang="en">(x86 · heavy compute)</span></li>
        <li>NVIDIA Jetson Orin NX <span data-lang="ko">(경량 · GPU)</span><span data-lang="en">(lightweight · GPU)</span></li>
        <li><span data-lang="ko">상판에 장착, VESC와 연결</span><span data-lang="en">Mounted on upper plate, wired to VESC</span></li>
      </ul>
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
