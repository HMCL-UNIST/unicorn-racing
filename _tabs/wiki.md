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
</style>

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
