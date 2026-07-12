# Scaling Laws Explorer

A lightweight static site for exploring scaling laws, power laws, and allometric scaling.

Core formula:

```text
Y = Y0 * M^β
```

## Main features

- Power law explorer with live controls
- Linear and log-log plots
- Exponent presets for β = 2/3, β = 3/4, β = 1, and β = 1.15
- Biological allometry comparison
- City / network scaling comparison
- Doubling calculator for `scaleFactor^β`

## Preview locally

Serve the folder with Python:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

## GitHub Pages

This repo is intended to be served at:

```text
https://chen-qingxiang.github.io/complexity/scaling-laws/
```

## JavaScript architecture

The site uses browser-native ES Modules with no build step or runtime dependencies. `index.html` loads `js/main.js`, which wires UI events and delegates rendering to small section modules:

- `js/data.js` stores shared color constants, animal marker data, and city presets.
- `js/math.js` and `js/format.js` contain pure helpers that are easy to test.
- `js/plot.js` owns canvas setup, scaling, axis, legend, and slope-guide drawing.
- `js/explorer.js`, `js/logLog.js`, `js/allometry.js`, `js/city.js`, and `js/calculator.js` render individual page sections.
- `js/dom.js` centralizes element lookup and numeric input parsing.

Because ES Modules are loaded by the browser, preview the site through a local server rather than opening the HTML file directly. Optional pure helper checks can be run with Node:

```bash
npm test
```
