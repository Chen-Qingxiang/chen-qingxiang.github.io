# Genetic Algorithm Playground

A lightweight static GitHub Pages project for exploring how a simple genetic
algorithm behaves on different binary fitness landscapes.

The app is self-contained and uses only plain HTML, CSS, JavaScript, and canvas.
It is intended to be served at:

https://chen-qingxiang.github.io/complexity/genetic-algorithm-playground/

## Landscapes

### OneMax

OneMax scores a binary genome by counting its 1 bits:

```text
fitness(x) = sum of bits
```

The global optimum is the all-ones genome. This is a smooth benchmark because
each 1 bit independently improves fitness.

### Deceptive Trap Function

The genome is split into blocks of size `K`. For each block, let `u` be the
number of 1 bits.

```text
if u == K: block fitness = K
otherwise: block fitness = K - 1 - u
```

The all-one block is globally optimal, but the all-zero block is a local trap.
The playground includes a simple steepest-ascent hill-climbing comparison for
this landscape.

### NK Landscape

An NK landscape has `N` binary loci. Each locus contributes a random local
fitness value based on its own bit and `K` other interacting loci. The total
fitness is the average of all local contributions.

`K` controls epistasis: `K = 0` gives mostly independent contributions, while
larger `K` creates a more rugged landscape with more local optima. This demo
enumerates the true global optimum only when `N <= 16`.

## Preview Locally

Open `index.html` directly in a browser, or serve the directory with a small
static server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## GitHub Pages

This repository is intended to be deployed as a standalone GitHub Pages project
site:

```text
https://chen-qingxiang.github.io/complexity/genetic-algorithm-playground/
```

In GitHub, enable Pages for this repository and serve from the branch/root that
contains `index.html`.

## JavaScript Architecture

The app remains a static, dependency-free GitHub Pages site that uses
browser-native ES Modules. The module entry point is `js/main.js`, loaded from
`index.html` with `<script type="module" src="js/main.js"></script>`.

The code is organized by responsibility:

- `js/fitness/` contains landscape implementations and problem construction.
- `js/ga/` contains pure genetic algorithm, genome, operator, diversity, and
  hill-climbing logic.
- `js/charts/` contains canvas setup and line chart drawing.
- `js/ui/` contains DOM lookup, config reading, problem-specific UI updates,
  result rendering, and event binding.
- Shared helpers such as RNG, formatting, constants, and app state live at the
  top level of `js/`.

No build step is required; serve the repository root with
`python3 -m http.server 8000` and open `http://localhost:8000/`.
