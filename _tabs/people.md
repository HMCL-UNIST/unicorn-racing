---
icon: fas fa-users
order: 6
---

<style>
.people-section {
  margin: 40px 0;
}

.people-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.person-card {
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: box-shadow 0.3s, transform 0.2s;
}

.person-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.person-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 15px;
  display: block;
  background: var(--img-bg, #f0f0f0);
}

.person-name {
  font-size: 1.2em;
  font-weight: 600;
  margin: 10px 0 5px;
}

.person-role {
  color: var(--text-muted-color, #666);
  font-size: 0.9em;
  margin-bottom: 10px;
}

.person-info {
  font-size: 0.85em;
  color: var(--text-color, #333);
  margin: 5px 0;
  text-align: left;
}

.person-info strong {
  display: inline-block;
  min-width: 60px;
}

.person-links {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}

.person-links a {
  color: var(--link-color, #0066cc);
  font-size: 1.3em;
  transition: color 0.2s;
}

.person-links a:hover {
  color: var(--link-hover-color, #004499);
}

.advisor-section {
  margin-bottom: 50px;
}

.advisor-card {
  max-width: 600px;
  margin: 0 auto;
  border: 2px solid var(--border-color, #ddd);
}

/* Competition History */
.competition-entry {
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  background: var(--card-bg, #fff);
}

.competition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.competition-header a {
  text-decoration: none;
  color: inherit;
}

.competition-header a:hover .competition-name {
  color: var(--link-color, #0066cc);
}

.competition-name {
  font-size: 1.15em;
  font-weight: 600;
  color: var(--heading-color, #333);
  transition: color 0.2s;
}

.competition-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.competition-year {
  color: var(--text-muted-color, #666);
  font-size: 0.9em;
}

.competition-result {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 1em;
  font-weight: 700;
  background: var(--badge-bg, #e8f4fd);
  color: var(--link-color, #0066cc);
}

.competition-result.gold {
  background: #fff8e1;
  color: #f9a825;
}

.competition-result.silver {
  background: #f5f5f5;
  color: #757575;
}

.competition-result.bronze {
  background: #fff3e0;
  color: #e65100;
}

.competition-members {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}

.competition-member {
  display: flex;
  align-items: center;
  gap: 8px;
}

.competition-member-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--img-bg, #f0f0f0);
}

.competition-member-name {
  font-size: 0.9em;
  color: var(--text-color, #333);
}

.competition-member-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}

.competition-member-link:hover .competition-member-name {
  color: var(--link-color, #0066cc);
}

@media (max-width: 768px) {
  .people-grid {
    grid-template-columns: 1fr;
  }

  .competition-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<!-- Advisor Section -->
<div class="people-section advisor-section">
  <h2>Advisor</h2>

  {% for person_hash in site.data.people %}
    {% assign person_id = person_hash[0] %}
    {% assign person = person_hash[1] %}
    {% if person.type == 'advisor' %}
    <div class="person-card advisor-card">
      {% if person.image %}
      <img src="{{ person.image }}" alt="{{ person.name }}" class="person-image">
      {% endif %}

      <div class="person-name">{{ person.name }}</div>

      {% if person.title %}
      <div class="person-role">{{ person.title }}</div>
      {% endif %}

      {% if person.department %}
      <div class="person-info"><strong>Dept:</strong> {{ person.department }}</div>
      {% endif %}

      {% if person.email %}
      <div class="person-info"><strong>Email:</strong> <a href="mailto:{{ person.email }}">{{ person.email }}</a></div>
      {% endif %}

      {% if person.phone %}
      <div class="person-info"><strong>Office:</strong> {{ person.phone }}</div>
      {% endif %}

      <div class="person-links">
        {% if person.homepage %}
        <a href="{{ person.homepage }}" target="_blank" title="Homepage">
          <i class="fas fa-home"></i>
        </a>
        {% endif %}
      </div>
    </div>
    {% endif %}
  {% endfor %}
</div>

<!-- Competition History Section -->
<div class="people-section">
  <h2>Competition History</h2>

  {% for comp in site.data.competition_history %}
  <div class="competition-entry">
    <div class="competition-header">
      {% if comp.post %}
      <a href="{{ comp.post | relative_url }}">
        <div class="competition-name">{{ comp.name }}</div>
      </a>
      {% else %}
      <div class="competition-name">{{ comp.name }}</div>
      {% endif %}

      <div class="competition-meta">
        <span class="competition-year">{{ comp.year }}</span>
        {% if comp.result contains "1st" %}
        <span class="competition-result gold">{{ comp.result }}</span>
        {% elsif comp.result contains "2nd" %}
        <span class="competition-result silver">{{ comp.result }}</span>
        {% elsif comp.result contains "3rd" %}
        <span class="competition-result bronze">{{ comp.result }}</span>
        {% else %}
        <span class="competition-result">{{ comp.result }}</span>
        {% endif %}
      </div>
    </div>

    {% if comp.members.size > 0 %}
    <div class="competition-members">
      {% for member_key in comp.members %}
        {% assign member = site.data.people[member_key] %}
        {% if member %}
        <div class="competition-member">
          {% if member.email %}
          <a href="mailto:{{ member.email }}" class="competition-member-link">
          {% endif %}
            {% if member.image %}
            <img src="{{ member.image }}" alt="{{ member.name }}" class="competition-member-img">
            {% endif %}
            <span class="competition-member-name">{{ member.name }}</span>
          {% if member.email %}
          </a>
          {% endif %}
        </div>
        {% endif %}
      {% endfor %}
    </div>
    {% endif %}
  </div>
  {% endfor %}
</div>
