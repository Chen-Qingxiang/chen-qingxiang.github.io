# Robby GA

Robby GA is a lightweight static site for exploring the Robby the Robot genetic algorithm example. It uses plain HTML, CSS, and JavaScript, with canvas-based visualization for the grid world and fitness chart.

## What Robby Does

Robby lives in a square grid world containing empty cells and cans. At each step, Robby sees only five local locations:

- current cell
- north
- south
- west
- east

Each location can be `EMPTY`, `CAN`, or `WALL`, so there are `3^5 = 243` perceptual states. A policy is a 243-entry genotype where each gene stores one action:

- `NORTH`
- `SOUTH`
- `EAST`
- `WEST`
- `STAY`
- `PICKUP`
- `RANDOM`

Rewards:

- successful pickup: `+10`
- pickup on an empty cell: `-1`
- move into wall: `-5`
- valid movement: `0`
- stay: `0`

The genetic algorithm trains policies by evaluating their average score across random worlds. Selection favors better average behavior, crossover recombines policy entries, and mutation explores new actions.

## Preview Locally

Open `index.html` directly in a browser.

You can also serve the folder with a simple static server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## GitHub Pages

This repo is intended to be served at:

```text
https://chen-qingxiang.github.io/complexity/robby-ga/
```

Because the project is a standalone static site with relative file paths, it can be deployed from the repository root using GitHub Pages.

## Code Organization

The app is still a dependency-free static site, but the JavaScript is split into browser-native ES Modules under `js/`:

- `constants.js`, `rng.js`, `world.js`, `percept.js`, `policy.js`, `simulation.js`, and `ga.js` contain pure Robby and genetic-algorithm logic.
- `drawing/` contains canvas renderers for the grid world and fitness chart.
- `ui/` contains DOM lookup, app state, controls, demo playback, training orchestration, and policy inspection.
- `main.js` is the browser entry point loaded by `index.html` with `<script type="module" src="js/main.js"></script>`.

Serve the repository root with `python3 -m http.server 8000` so native module imports resolve the same way they do on GitHub Pages.
