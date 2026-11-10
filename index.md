---
layout: default
title: Qingxiang Chen
---

## About

I build small, browser-based tools that make learning and research smoother. Everything here is a static page: no account, no backend, and your files stay on your own machine. Source code for all of it is in [this repository](https://github.com/chen-qingxiang/chen-qingxiang.github.io).

**Quick links:** [Projects](#projects) · [Blog]({{ "/blog/" | relative_url }}) · [RSS]({{ "/feed.xml" | relative_url }}) · [GitHub](https://github.com/chen-qingxiang)

## Projects

### Complexity Playground

Interactive demos written while reading about complexity science: simple rules, nonlinear dynamics, evolution, networks, scaling, information and high-dimensional geometry. [Open the collection]({{ "/complexity/" | relative_url }}) — it can be installed as an offline app (PWA).

| Demo | What you can do | Notes |
|---|---|---|
| [Logistic Map Explorer]({{ "/complexity/logistic-map/" | relative_url }}) | Time series, cobweb plot, bifurcation diagram, sensitivity to initial conditions | [post]({{ "/blog/logistic-map-explorer/" | relative_url }}) |
| [Elementary Cellular Automata]({{ "/complexity/cellular-automata/" | relative_url }}) | Any rule 0–255 with its rule table; presets for Rules 30, 54, 90, 110, 150, 184 | [post]({{ "/blog/elementary-cellular-automata/" | relative_url }}) |
| [Conway's Game of Life]({{ "/complexity/game-of-life/" | relative_url }}) | Draw cells, step or run; block, blinker, glider, Gosper glider gun | [post]({{ "/blog/conways-game-of-life/" | relative_url }}) |
| [Genetic Algorithm Playground]({{ "/complexity/genetic-algorithm-playground/" | relative_url }}) | One GA on OneMax, deceptive traps and NK landscapes; fitness and diversity curves | [post]({{ "/blog/genetic-algorithm-playground/" | relative_url }}) |
| [Robby GA]({{ "/complexity/robby-ga/" | relative_url }}) | Evolve a 243-entry policy for a can-collecting robot and replay it | [post]({{ "/blog/robby-ga/" | relative_url }}) |
| [Network Science Lab]({{ "/complexity/network-science-lab/" | relative_url }}) | Erdős–Rényi, Watts–Strogatz, Barabási–Albert graphs; robustness, spreading, centrality | [post]({{ "/blog/network-science-lab/" | relative_url }}) |
| [Scaling Laws Explorer]({{ "/complexity/scaling-laws/" | relative_url }}) | Power laws on linear and log-log axes, allometry, city scaling, doubling calculator | [post]({{ "/blog/scaling-laws-explorer/" | relative_url }}) |
| [Information Entropy Explorer]({{ "/complexity/information-entropy/" | relative_url }}) | Surprise, coin and multi-symbol entropy, sampled sequences, compressibility | [post]({{ "/blog/information-entropy-explorer/" | relative_url }}) |
| [The Shape of High Dimensions]({{ "/complexity/shape-of-high-dimensions/" | relative_url }}) | Concentration of measure, volume and distance in many dimensions | |

### History and geography

| Project | What you can do |
|---|---|
| [Spacetime Trails · 时空行迹]({{ "/spacetime/" | relative_url }}) | Play back a historical figure's life on a map and a timeline together: 35+ people (Zhang Qian, Xuanzang, Su Dongpo, Zheng He, El Cid…), with a [multi-person compare mode]({{ "/spacetime/compare.html" | relative_url }}). Chinese UI, works on mobile. |
| [Terrain Atlas · 山海图]({{ "/terrain-atlas/" | relative_url }}) | 3D globe with 1–200× vertical exaggeration of land and sea floor, city search, modern boundaries, rivers, landform labels, and your own GeoJSON layers. Chinese UI. [Data sources]({{ "/terrain-atlas/sources.html" | relative_url }}) |
| [showtime](https://chen-qingxiang.github.io/showtime/) | Zoomable, CSV-driven timeline: each CSV becomes a layer you can stack, reorder and compare. [Design notes]({{ "/blog/showtime-a-zoomable-layer-first-timeline/" | relative_url }}) |

### Physics and chemistry

| Project | What you can do |
|---|---|
| [X-ray Shell & Edge Atlas]({{ "/xray-shells/" | relative_url }}) | K/L/M shell binding energies, absorption edges and characteristic emission lines across the periodic table |
| [X-ray Interaction Explorer]({{ "/xray-interactions/" | relative_url }}) | Photoelectric absorption, Rayleigh and Compton scattering from 20–200 keV, with material presets and attenuation curves |
| [元素周期表 · Periodic Table]({{ "/periodic-table/" | relative_url }}) | Bilingual periodic table: Chinese and English names, IPA, Mandarin/English pronunciation, plus X-ray data per element. Installable as an offline app. |

### Utilities

| Project | What you can do |
|---|---|
| [PDF Local]({{ "/pdf-tool/" | relative_url }}) | Extract pages, merge PDFs, crop and lay out scanned regions. Runs entirely in the browser — files are never uploaded. Installable as an offline app. |

## Latest posts

{% for post in site.posts limit:5 %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>— {{ post.date | date: "%Y-%m-%d" }}</small>
{% endfor %}

[All posts →]({{ "/blog/" | relative_url }})

## Feedback

Found a bug or have a suggestion? [Open an issue on GitHub](https://github.com/chen-qingxiang/chen-qingxiang.github.io/issues).
