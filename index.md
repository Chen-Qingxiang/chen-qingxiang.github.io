---
layout: default
title: Home
---

# Hi, I'm Chen Qingxiang

I build simple tools that make learning and research smoother. This site hosts my personal projects, notes, and small interactive demos.

## Projects

### Complexity Playground

Small interactive demos inspired by my reading of *Complexity*. They are mostly lightweight visual tools for exploring simple rules, nonlinear dynamics, evolution, networks, scaling, and information.

- 🌀 [Logistic Map Explorer](https://chen-qingxiang.github.io/logistic-map/)  
  Explore the logistic map, bifurcation, cobweb diagrams, and sensitivity to initial conditions.

- 🔳 [Elementary Cellular Automata](https://chen-qingxiang.github.io/cellular-automata/)  
  Visualize one-dimensional cellular automata, including Rule 30, Rule 90, Rule 110, and Rule 184.

- 🧬 [Conway's Game of Life](https://chen-qingxiang.github.io/game-of-life/)  
  Play with classic Life patterns such as block, blinker, glider, and Gosper glider gun.

- 🧪 [Genetic Algorithm Playground](https://chen-qingxiang.github.io/genetic-algorithm-playground/)  
  Compare a simple genetic algorithm on OneMax, deceptive trap functions, and NK landscapes.

- 🤖 [Robby GA](https://chen-qingxiang.github.io/robby-ga/)  
  Evolve policies for Robby the Robot in a grid world with cans, local perception, and rewards.

- 🕸️ [Network Science Lab](https://chen-qingxiang.github.io/network-science-lab/)  
  Generate and compare random, small-world, and preferential-attachment networks.

- 📈 [Scaling Laws Explorer](https://chen-qingxiang.github.io/scaling-laws/)  
  Explore power laws, log-log plots, biological allometry, and scaling exponents.

- 🎲 [Information Entropy Explorer](https://chen-qingxiang.github.io/information-entropy/)  
  Play with Shannon information, entropy, probability distributions, randomness, and compressibility.

### Other tools

- 🎬 [showtime — a zoomable timeline tool](https://chen-qingxiang.github.io/showtime/)  
  A CSV-driven timeline viewer for comparing events across layers, periods, and historical contexts.

## Latest posts

<ul>
{% for post in site.posts limit:10 %}
<li>
<a href="{{ post.url | relative_url }}">{{ post.title }}</a>
<small> — {{ post.date | date: "%Y-%m-%d" }}</small>
</li>
{% endfor %}
</ul>
