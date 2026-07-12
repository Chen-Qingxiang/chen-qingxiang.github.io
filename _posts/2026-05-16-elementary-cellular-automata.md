---
layout: default
title: "Elementary Cellular Automata — tiny rules, large patterns"
tags: [complexity, cellular-automata, rule-30, rule-110, visualization]
description: An interactive visualizer for one-dimensional elementary cellular automata, including Rule 30, Rule 90, Rule 110, and Rule 184.
---

> **Project:** [Elementary Cellular Automata]({{ "/complexity/cellular-automata/" | relative_url }})

Elementary cellular automata are one-dimensional systems with binary cells. Each cell updates from three values: the left neighbor, itself, and the right neighbor.

There are only eight possible local neighborhoods:

```text
111 110 101 100 011 010 001 000
```

A rule assigns one output bit to each neighborhood. Those eight output bits form a number from 0 to 255. That is where names such as Rule 30 and Rule 110 come from.

## What the page does

The visualizer lets you choose:

- rule number, from 0 to 255
- grid width
- number of time steps
- single-cell or random initial condition
- random density

It also displays the rule table, so the rule number is not just a label. You can see exactly which output each local neighborhood produces.

## Presets included

The page includes quick buttons for a few famous rules:

- **Rule 30** — complex, random-looking patterns from a short rule
- **Rule 54** — particle-like structures and moving defects
- **Rule 90** — a Sierpiński-triangle-like pattern
- **Rule 110** — famous for universal computation
- **Rule 150** — another additive rule with strong fractal structure
- **Rule 184** — often read as a minimal traffic-flow model

## Why I made it

Cellular automata are useful because the mechanism is almost embarrassingly small. Each cell only sees a tiny local neighborhood. Yet the printed space-time diagram can show regularity, randomness, waves, boundaries, particles, and long-lived structures.

This page is mainly for playing with that transition from local update rules to global patterns. It is a visual companion to the cellular automata chapters in my complexity reading notes.

## What to look for

Try Rule 90 from a single center cell first. It gives a clean fractal pattern.

Then try Rule 30 from the same initial condition. The contrast is immediate: same grid, same update scheme, different local table, very different space-time behavior.

For Rule 184, switch to a random initial condition. Read `1` as a car and `0` as an empty space. The pattern starts to look like traffic moving through a one-lane road.

## Link

Open the project here:

[{{ "/complexity/cellular-automata/" | relative_url }}]({{ "/complexity/cellular-automata/" | relative_url }})
