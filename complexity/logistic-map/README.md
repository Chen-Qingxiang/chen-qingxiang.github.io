# Logistic Map Explorer

A lightweight, dependency-free interactive GitHub Pages project for exploring the logistic map and chaos.

The logistic map is:

```text
x_{t+1} = r x_t (1 - x_t)
```

The page includes a time series plot, cobweb diagram, bifurcation diagram, sensitivity comparison, and presets for stable, periodic, and chaotic regimes.

## Preview locally

Open `index.html` directly in a browser, or serve the folder with a simple static server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

If port `8000` is already in use, replace it with another open port, for example:

```bash
python3 -m http.server 8001
```

## GitHub Pages

This standalone repository is intended to be served at:

```text
https://chen-qingxiang.github.io/complexity/logistic-map/
```
