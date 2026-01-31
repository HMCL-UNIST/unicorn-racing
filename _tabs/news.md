---
icon: fas fa-newspaper
order: 6
---

<style>
.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.news-card {
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.2s;
  background: var(--card-bg, #fff);
  display: flex;
  flex-direction: column;
}

.news-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
}

.news-card a {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 🔥 img 대신 background-image 전용 */
.news-card-image {
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
  background-color: var(--img-bg, #f0f0f0);
}

.news-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.news-card-date {
  font-size: 0.8em;
  color: var(--text-muted-color, #999);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.news-card-title {
  font-size: 1.15em;
  font-weight: 700;
  margin: 0 0 10px;
  line-height: 1.4;
  color: var(--heading-color, #333);
}

.news-card-excerpt {
  font-size: 0.9em;
  color: var(--text-muted-color, #666);
  line-height: 1.6;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.news-card-tag {
  font-size: 0.75em;
  background: var(--tag-bg, #f0f0f0);
  color: var(--text-muted-color, #666);
  padding: 2px 10px;
  border-radius: 20px;
}

.news-card-placeholder {
  width: 100%;
  height: 200px;
  background: var(--img-bg, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted-color, #999);
  font-size: 2em;
}

@media (max-width: 768px) {
  .news-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<div class="news-grid">
  {% assign news_posts = site.posts | where_exp: "post", "post.categories contains 'news'" %}
  {% for post in news_posts %}
  <div class="news-card" data-lang="{{ post.lang | default: 'ko' }}" data-lang-ref="{{ post.lang_ref }}">
    <a href="{{ post.url | relative_url }}">

      {% if post.image.path %}
      <div class="news-card-image"
           style="background-image: url('{{ post.image.path | relative_url }}');">
      </div>

      {% elsif post.image %}
      <div class="news-card-image"
           style="background-image: url('{{ post.image }}');">
      </div>

      {% else %}
      <div class="news-card-placeholder">
        <i class="fas fa-newspaper"></i>
      </div>
      {% endif %}

      <div class="news-card-body">
        <div class="news-card-date">
          <i class="fas fa-calendar-alt"></i>
          {{ post.date | date: "%B %d, %Y" }}
        </div>

        <h3 class="news-card-title">{{ post.title }}</h3>

        <p class="news-card-excerpt">
          {{ post.excerpt | strip_html | truncate: 120 }}
        </p>

        {% if post.tags.size > 0 %}
        <div class="news-card-tags">
          {% for tag in post.tags %}
          <span class="news-card-tag">#{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
      </div>

    </a>
  </div>
  {% endfor %}
</div>
