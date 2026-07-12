---
layout: default
title: "Conway's Game of Life — local rules and moving patterns"
tags: [complexity, game-of-life, cellular-automata, visualization]
description: An interactive Conway's Game of Life page with block, blinker, glider, and Gosper glider gun presets.
---

> **Project:** [Conway's Game of Life]({{ "/complexity/game-of-life/" | relative_url }})

Conway's Game of Life is a two-dimensional cellular automaton. Each cell is either alive or dead. Each update depends only on the eight neighboring cells.

The standard rule is usually written as `B3/S23`:

- a dead cell is born with exactly 3 live neighbors
- a live cell survives with 2 or 3 live neighbors
- all other live cells die
- all cells update synchronously

## What the page does

The page provides an interactive canvas where you can:

- play and pause the simulation
- step one generation at a time
- clear or randomize the grid
- change speed and density
- click or drag to draw cells
- load classic patterns

Pattern presets include:

- block
- blinker
- glider
- Gosper glider gun

## Why I made it

The Game of Life is one of the clearest examples of pattern formation in a cellular automaton. A few local birth and survival conditions generate stable objects, oscillators, moving structures, and collisions.

The glider is the key object for me. It persists as a small pattern while moving across the grid. That makes it possible to read it as a signal. Once moving patterns and collisions are available, the connection to distributed computation becomes much easier to understand.

## What to look for

Start with the blinker. It shows a simple period-2 oscillator.

Then try the glider. Watch the pattern change shape while keeping its identity over several generations.

Finally, try the Gosper glider gun. It periodically emits gliders. This is the moment where the system starts to feel less like a static grid and more like a medium that can carry signals.

## Link

Open the project here:

[{{ "/complexity/game-of-life/" | relative_url }}]({{ "/complexity/game-of-life/" | relative_url }})
