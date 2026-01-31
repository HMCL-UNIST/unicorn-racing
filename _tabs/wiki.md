---
title: "Wiki"
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

.wiki-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.wiki-grid-2col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.wiki-card {
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  background: var(--card-bg, #fff);
}

.wiki-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-3px);
  border-color: var(--link-color, #0066cc);
}

.wiki-card a {
  text-decoration: none;
  color: inherit;
}

.wiki-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.wiki-card .card-icon {
  font-size: 1.8em;
  color: var(--link-color, #0066cc);
}

.wiki-card .card-title {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--heading-color, #333);
}

.wiki-card .card-desc {
  color: var(--text-muted-color, #666);
  font-size: 0.9em;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .wiki-grid, .wiki-grid-2col {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Getting Started Section -->
<div class="wiki-section-title">
  <i class="fas fa-rocket"></i>
  <h2>Getting Started</h2>
</div>

<div class="wiki-grid">
  {% for section in site.data.wiki.getting-started %}
  <div class="wiki-card">
    <a href="{{ '/posts/getting-started/' | relative_url }}#{{ section.section }}">
      <div class="card-header">
        <i class="{{ section.icon }} card-icon"></i>
        <div class="card-title">{{ section.title }}</div>
      </div>
      <div class="card-desc">{{ section.description }}</div>
    </a>
  </div>
  {% endfor %}
</div>

<!-- Useful Pages Section -->
<div class="wiki-section-title">
  <i class="fas fa-link"></i>
  <h2>Pages</h2>
</div>

<div class="wiki-grid-2col">
  {% for link in site.data.wiki.links %}
  <div class="wiki-card">
    <a href="{% if link.type == 'external' %}{{ link.url }}{% else %}{{ link.url | relative_url }}{% endif %}" {% if link.type == "external" %}target="_blank"{% endif %}>
      <div class="card-header">
        <i class="{{ link.icon }} card-icon"></i>
        <div class="card-title">{{ link.title }}</div>
      </div>
      <div class="card-desc">{{ link.description }}</div>
    </a>
  </div>
  {% endfor %}
</div>
