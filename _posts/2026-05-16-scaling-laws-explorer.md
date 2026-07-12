---
layout: default
title: "Scaling Laws Explorer — power laws and log-log plots"
tags: [complexity, scaling-laws, power-laws, allometry, visualization]
description: An interactive visualizer for power laws, log-log plots, biological allometry, and scaling exponents.
---

> **Project:** [Scaling Laws Explorer]({{ "/complexity/scaling-laws/" | relative_url }})

Scaling laws describe how one quantity changes with the size of a system. A common form is:

```text
Y = Y0 * M^β
```

The exponent `β` controls the relationship. When `β < 1`, the quantity grows sublinearly. When `β = 1`, it grows linearly. When `β > 1`, it grows superlinearly.

## What the page does

The explorer includes:

- a power-law plotter
- linear and log-log views
- exponent presets
- biological allometry comparisons
- city / network scaling examples
- a doubling calculator

The log-log view is important. For an exact power law:

```text
log(Y) = log(Y0) + β log(M)
```

So the exponent becomes the slope of a straight line.

## Presets included

The page includes several useful exponent presets:

- `β = 2/3`: surface-area-like scaling
- `β = 3/4`: often discussed in biological metabolic scaling
- `β = 1`: linear scaling
- `β = 1.15`: a simple superlinear example

There are also city-style examples, such as sublinear infrastructure scaling and superlinear socioeconomic output.

## Why I made it

Power laws are easy to write down and easy to misuse. I wanted a page that makes the exponent visible. Changing `β` should immediately change the curve, the log-log slope, and the doubling multiplier.

The doubling calculator is a small but useful anchor. If system size doubles, `Y` is multiplied by `2^β`. For `β = 3/4`, doubling size gives about `1.68x`, not `2x`.

## What to look for

Switch between linear and log-log views. On ordinary axes, the curve can be hard to interpret. On log-log axes, the scaling exponent becomes visually readable.

Then compare `β = 2/3`, `β = 3/4`, and `β = 1`. The differences are modest at small ranges but large across several orders of magnitude.

## Link

Open the project here:

[{{ "/complexity/scaling-laws/" | relative_url }}]({{ "/complexity/scaling-laws/" | relative_url }})
