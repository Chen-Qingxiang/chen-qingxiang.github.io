---
layout: default
title: Home
---


# Hi, I'm Chen Qingxiang
I build simple tools that make learning and research smoother. This site hosts my personal projects, notes and some ideas (maybe).


## Projects
- 🎬 [showtime — a zoomable timeline tool](https://chen-qingxiang.github.io/showtime/)


## Latest posts
<ul>
{% for post in site.posts limit:10 %}
<li>
<a href="{{ post.url | relative_url }}">{{ post.title }}</a>
<small> — {{ post.date | date: "%Y-%m-%d" }}</small>
</li>
{% endfor %}
</ul>
