---
layout: default
title: Home
---

# Hi, I'm Chen Qingxiang

I build simple tools that make learning and research smoother. This site hosts my personal projects, notes, and small interactive demos.

## Projects

### Complexity Playground

[Open the consolidated playground]({{ "/complexity/" | relative_url }}) for the small interactive demos inspired by my reading of *Complexity*. They now live together as one collection for simple rules, nonlinear dynamics, evolution, networks, scaling, information, and high-dimensional geometry.

- [Logistic Map Explorer]({{ "/complexity/logistic-map/" | relative_url }}): Explore the logistic map, bifurcation, cobweb diagrams, and sensitivity to initial conditions.

- [Elementary Cellular Automata]({{ "/complexity/cellular-automata/" | relative_url }}): Visualize one-dimensional cellular automata, including Rule 30, Rule 90, Rule 110, and Rule 184.

- [Conway's Game of Life]({{ "/complexity/game-of-life/" | relative_url }}): Play with classic Life patterns such as block, blinker, glider, and Gosper glider gun.

- [Genetic Algorithm Playground]({{ "/complexity/genetic-algorithm-playground/" | relative_url }}): Compare a simple genetic algorithm on OneMax, deceptive trap functions, and NK landscapes.

- [Robby GA]({{ "/complexity/robby-ga/" | relative_url }}): Evolve policies for Robby the Robot in a grid world with cans, local perception, and rewards.

- [Network Science Lab]({{ "/complexity/network-science-lab/" | relative_url }}): Generate and compare random, small-world, and preferential-attachment networks.

- [Scaling Laws Explorer]({{ "/complexity/scaling-laws/" | relative_url }}): Explore power laws, log-log plots, biological allometry, and scaling exponents.

- [Information Entropy Explorer]({{ "/complexity/information-entropy/" | relative_url }}): Play with Shannon information, entropy, probability distributions, randomness, and compressibility.

- [The Shape of High Dimensions]({{ "/complexity/shape-of-high-dimensions/" | relative_url }}): Build intuition for concentration, volume, distance, and high-dimensional geometry.

### Other tools

- [showtime, a zoomable timeline tool](https://chen-qingxiang.github.io/showtime/): A CSV-driven timeline viewer for comparing events across layers, periods, and historical contexts.

## Latest Posts

<ul>
{% for post in site.posts limit:10 %}
<li>
<a href="{{ post.url | relative_url }}">{{ post.title }}</a>
<small> - {{ post.date | date: "%Y-%m-%d" }}</small>
</li>
{% endfor %}
</ul>
