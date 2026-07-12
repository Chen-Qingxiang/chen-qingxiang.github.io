---
layout: default
title: "Logistic Map Explorer — a small demo of chaos"
tags: [complexity, chaos, logistic-map, visualization]
description: A lightweight interactive page for exploring the logistic map, bifurcation, cobweb diagrams, and sensitivity to initial conditions.
---

> **Project:** [Logistic Map Explorer]({{ "/complexity/logistic-map/" | relative_url }})

The logistic map is one of the smallest models I know that makes chaos visible. It is defined by a single recurrence:

```text
x_{t+1} = r x_t (1 - x_t)
```

The next value is fully determined by the current value and the parameter `r`. There is no external noise in the model. Still, as `r` changes, the behavior moves through fixed points, periodic cycles, period doubling, and chaotic-looking trajectories.

## What the page does

The explorer has four main views:

1. **Time series** — shows how `x_t` changes over iterations.
2. **Cobweb diagram** — shows the iteration process between `y = x` and `y = r x(1-x)`.
3. **Bifurcation diagram** — shows the long-run values of `x` across a range of `r` values.
4. **Sensitivity view** — compares two nearby initial conditions.

The preset buttons are meant to give quick entry points:

- `r = 2.5`: stable fixed point
- `r = 3.2`: period-2 cycle
- `r = 3.5`: period-doubling behavior
- `r = 3.9`: chaotic regime
- `r = 3.56995`: near the onset of chaos

## Why I made it

When reading about chaos, the phrase “deterministic but hard to predict” is easy to repeat and hard to feel. The logistic map gives a clean way to see the idea directly. A tiny recurrence can produce long-run behavior that depends sharply on the parameter and, in chaotic regimes, on the initial condition.

The bifurcation diagram is especially useful. It compresses many runs into one picture, so the transition from order to chaos becomes visible as a structure rather than a slogan.

## What to look for

Start with the presets. The most useful comparison is between `r = 3.2` and `r = 3.9`.

At `r = 3.2`, the time series settles into a small cycle. At `r = 3.9`, nearby initial values can separate quickly. The rule is still deterministic, but long-term prediction becomes fragile.

The cobweb diagram shows the same process geometrically: each iteration moves vertically to the curve and horizontally to the diagonal. This makes the recurrence feel more like a dynamical system than a bare formula.

## Link

Open the project here:

[{{ "/complexity/logistic-map/" | relative_url }}]({{ "/complexity/logistic-map/" | relative_url }})
