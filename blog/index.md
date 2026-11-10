---
layout: default
title: Blog
---

# Blog

Notes on the tools hosted on this site: why each one exists, what it does, and what to look for when using it. Subscribe via [RSS]({{ "/feed.xml" | relative_url }}).

{% assign by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in by_year %}
## {{ year.name }}

{% for post in year.items %}
- **[{{ post.title }}]({{ post.url | relative_url }})** <small>({{ post.date | date: "%Y-%m-%d" }})</small><br>
  {{ post.description }}
{% endfor %}
{% endfor %}
