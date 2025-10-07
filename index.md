---
layout: default
title: Home
---


# Hi, I'm Chen Qingxiang
I build simple tools that make learning and research smoother. This site hosts my personal projects, notes and some ideas (maybe).


## Projects
- 🎬 [showtime — a zoomable timeline tool](https://chen-qingxiang.github.io/showtime/)


## Latest posts
{% if site.posts.size > 0 %}
{% for post in site.posts limit:10 %}
- [{{ post.title }}]({{ post.url | relative_url }}) — {{ post.date | date: "%Y-%m-%d" }}
{% endfor %}
{% else %}
_No posts published yet._
{% endif %}
