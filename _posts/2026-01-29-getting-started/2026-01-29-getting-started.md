---
title: "Getting Started"
date: 2026-01-29 00:00:00 +0900
categories: [Manual]
tags: [manual, getting-started]
lang: ko
lang_ref: getting-started
---

<style>
.gs-section {
  margin-bottom: 40px;
}

.gs-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border-color, #ddd);
}

.gs-section-header i {
  font-size: 1.5em;
  color: var(--link-color, #0066cc);
}

.gs-section-header h2 {
  margin: 0;
  font-size: 1.5em;
}

.gs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.gs-card {
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  background: var(--card-bg, #fff);
  position: relative;
}

.gs-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-3px);
  border-color: var(--link-color, #0066cc);
}

.gs-card a {
  text-decoration: none;
  color: inherit;
}

.gs-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.gs-card .step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: var(--link-color, #0066cc);
  color: #fff;
  font-weight: 700;
  font-size: 0.9em;
}

.gs-card .card-title {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--heading-color, #333);
}

.gs-card .card-desc {
  color: var(--text-muted-color, #666);
  font-size: 0.9em;
  line-height: 1.4;
  margin-left: 44px;
}

.gs-card.coming-soon {
  opacity: 0.5;
  pointer-events: none;
}

@media (max-width: 768px) {
  .gs-grid {
    grid-template-columns: 1fr;
  }
}
</style>

{% for section in site.data.wiki.getting-started %}
<div class="gs-section" id="{{ section.section }}">
  <div class="gs-section-header">
    <i class="{{ section.icon }}"></i>
    <h2>{{ section.title }}</h2>
  </div>

  <div class="gs-grid">
    {% for item in section.steps %}
    {% assign step_url = item.url %}
    {% assign is_external = item.external %}
    {% assign has_url = step_url != '' %}
    {% if item.lang_ref %}
      {% assign has_url = true %}
      {% assign match_lang = page.lang | default: 'ko' %}
      {% assign target = site.posts | where: 'lang_ref', item.lang_ref | where: 'lang', match_lang | first %}
      {% if target %}
        {% assign step_url = target.url %}
      {% else %}
        {% assign fallback = site.posts | where: 'lang_ref', item.lang_ref | first %}
        {% if fallback %}
          {% assign step_url = fallback.url %}
        {% endif %}
      {% endif %}
      {% assign is_external = false %}
    {% endif %}
    <div class="gs-card {% unless has_url %}coming-soon{% endunless %}">
      {% if has_url %}
      <a href="{% if is_external %}{{ step_url }}{% else %}{{ step_url | relative_url }}{% endif %}" {% if is_external %}target="_blank"{% endif %}>
      {% endif %}
        <div class="card-header">
          <div class="step-number">{{ item.step }}</div>
          <div class="card-title">{{ item.title }}</div>
        </div>
        <div class="card-desc">{{ item.description }}</div>
      {% if has_url %}
      </a>
      {% endif %}
    </div>
    {% endfor %}
  </div>
</div>
{% endfor %}
