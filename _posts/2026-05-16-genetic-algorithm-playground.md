---
layout: default
title: "Genetic Algorithm Playground — fitness landscapes in action"
tags: [complexity, genetic-algorithm, fitness-landscape, nk-landscape, visualization]
description: An interactive playground comparing a simple genetic algorithm on OneMax, deceptive trap functions, and NK landscapes.
---

> **Project:** [Genetic Algorithm Playground](https://chen-qingxiang.github.io/genetic-algorithm-playground/)

This project is an interactive playground for a simple genetic algorithm. The goal is to compare how the same algorithm behaves on different fitness landscapes.

The page currently focuses on three problems:

1. **OneMax**
2. **Deceptive Trap Function**
3. **NK Landscape**

## What the page does

You can adjust common GA parameters:

- population size
- genome length
- number of generations
- crossover probability
- mutation probability
- tournament size
- elitism
- random seed

The output includes:

- best fitness over generations
- average fitness over generations
- diversity
- best genome
- final population summary

## The three landscapes

**OneMax** is the simplest benchmark. The fitness is just the number of `1` bits. Each correct bit helps independently, so the landscape is smooth and easy for a GA.

**Deceptive Trap Function** splits the genome into blocks. The all-one block is the true optimum, but the all-zero block is a local trap. This makes it a compact example of how local improvement can point in the wrong direction.

**NK Landscape** adds interactions between genes. Each locus contributes to fitness based on itself and `K` other loci. Larger `K` creates more epistasis and a more rugged landscape.

## Why I made it

Genetic algorithms are often introduced with biological language: selection, mutation, crossover, population. Those terms are useful, but the behavior of the algorithm depends heavily on the fitness landscape.

This playground makes that dependence visible. OneMax usually improves smoothly. Trap functions can mislead local search. NK landscapes become harder as gene interactions increase.

## What to look for

Run OneMax first to establish a baseline.

Then switch to the deceptive trap function. Watch whether the best individual reaches the global optimum or gets pulled toward high-scoring but wrong block structures.

Finally, try the NK landscape and increase `K`. The search usually becomes less predictable as the landscape becomes more rugged.

## Link

Open the project here:

[https://chen-qingxiang.github.io/genetic-algorithm-playground/](https://chen-qingxiang.github.io/genetic-algorithm-playground/)
