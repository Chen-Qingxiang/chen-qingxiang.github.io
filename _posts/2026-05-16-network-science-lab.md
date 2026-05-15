---
layout: default
title: "Network Science Lab — graphs, hubs, spreading, and fragility"
tags: [complexity, network-science, graphs, scale-free, visualization]
description: An interactive network science lab with random graphs, small-world networks, preferential attachment, robustness, diffusion, and centrality.
---

> **Project:** [Network Science Lab](https://chen-qingxiang.github.io/network-science-lab/)

Network science studies systems made of nodes and edges. Social networks, web pages, transport systems, biological interactions, and citation networks can all be described this way.

This project is a small browser-based lab for generating and comparing network models.

## What the page does

The lab includes several modules:

- network generation
- metrics and degree distribution
- robustness and attack simulation
- diffusion / spreading simulation
- centrality and PageRank-like scores

The current network is drawn on a canvas, with high-degree nodes visually emphasized.

## Network models included

**Erdős–Rényi random graph** places each possible edge independently with probability `p`. It is a useful baseline.

**Watts–Strogatz small-world network** starts from local ring connections and rewires some edges. A small amount of rewiring can reduce path lengths while preserving clustering.

**Barabási–Albert preferential attachment network** grows one node at a time. New nodes prefer to attach to already well-connected nodes. This creates hubs and a heavy-tailed degree distribution.

## Why I made it

Many network concepts are easier to understand when the graph changes in front of you. Average degree, clustering, path length, giant component size, hubs, and spreading speed are all structural ideas. They become clearer when the same controls update both the picture and the metrics.

The robustness module is especially useful. Random node removal and targeted hub removal can produce very different outcomes, especially in hub-dominated networks.

## What to look for

Generate a Watts–Strogatz network and gradually increase the rewiring probability. Watch how local regularity gives way to shorter long-distance paths.

Generate a Barabási–Albert network and look at the degree histogram. The hubs should stand out.

Then compare random removal with targeted removal. Removing a few hubs can damage connectivity much faster than removing random nodes.

## Link

Open the project here:

[https://chen-qingxiang.github.io/network-science-lab/](https://chen-qingxiang.github.io/network-science-lab/)
