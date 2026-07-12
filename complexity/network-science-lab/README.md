# Network Science Lab

A lightweight interactive GitHub Pages project for exploring basic network science concepts from complexity science.

The lab runs as a static site from `index.html` and uses plain HTML, CSS, JavaScript, and canvas. It does not require a build system, external libraries, CDN assets, or internet access.

## Features

- Erdos-Renyi random graph
- Watts-Strogatz small-world network
- Barabasi-Albert preferential attachment network
- Network visualization with simple force-directed layout
- Basic metrics: density, clustering, average path length, largest component, and degree summary
- Degree distribution histogram
- Robustness simulation with random failures and targeted hub attacks
- SI diffusion / spreading simulation
- Centrality view with degree centrality and PageRank-like scores

## Preview Locally

Open `index.html` directly in a browser:

```bash
open index.html
```

The command opens the static page from the current directory on macOS.

You can also use a local static server if preferred:

```bash
python3 -m http.server 8000
```

This serves the folder at `http://localhost:8000/`.

## GitHub Pages

This standalone repository is intended to be served at:

```text
https://chen-qingxiang.github.io/complexity/network-science-lab/
```

In GitHub Pages settings, publish the repository from the branch and folder that contain `index.html`, usually `main` and `/`.
