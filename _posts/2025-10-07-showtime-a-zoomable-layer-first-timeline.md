---
layout: default
title: "showtime — a zoomable, layer‑first timeline for learning history"
tags: [showtime, timeline, history, design-notes]
description: Why I built a minimal, CSV‑driven timeline for studying history; principles, interaction design, and roadmap.

---

---

> TL;DR — **showtime** is a single‑file, HTML5‑Canvas timeline for learners and researchers. It loads multiple CSV files as **stacked layers**, supports deep zoom & pan, and lets you **reorder or delete layers** on the fly. It exists because I couldn’t find a timeline tool that matched how I actually compare history across regions and periods.

## Why I built this

When studying history (including cultural, economic, and intellectual history), I often want two kinds of comparison:

1. **Horizontal (synchronous)** — what was happening *elsewhere* at the same time? E.g., while reading about the Eastern Han, what were Rome and Parthia doing? That’s naturally a multi‑layer view.
2. **Local causality (diachronic)** — what led *into* and *out of* an event? I constantly need to zoom the timeline window to inspect the years just before and after a focal period.

After a long survey of existing tools, I still couldn’t get the exact FREE workflow I wanted. My needs are modest but strict:

* unlimited layers
* free zooming & panning
* manual control over layer order (drag up/down)
* simple, durable data input (CSV)

Also, my current stack is intentionally small. I didn’t want to spin up a framework or a build pipeline. With help from an LLM for spot debugging and refactors, a **single HTML file** is enough.

## What makes *showtime* different

* **Layer‑first** mental model. Each CSV becomes one layer named by the file. You can stack as many as you like, drag to reorder, or right‑click a layer name to delete it.
* **Deep zoom.** The scale spans from continent‑wide sweeps to a handful of months. `Shift + Wheel` zooms around the center; `Ctrl/Cmd + Wheel` accelerates zooming. I intend to make it super flexible in terms of time scales, from cosmic scales (i.e., Gyrs) to atomic scales (i.e., nano-seconds) -- I need to remind myself about my physics background and it would be interesting to put something related in (e.g., the Cosmic thermal history?).
* **Robust time parsing.** Ranges like `-221~-207`, `221BC-207BC`, or `221BC 至 207BC` are supported. Single years (e.g., `1054`) become one‑year spans. Internally it uses astronomical year numbering for BCE calculations; display uses `BC` labels. And of course, ultimately all other popular ways for expressing time stamps.
* **No dependencies.** Pure Canvas, no framework, no bundler.

## Quick start

1. Open: **[https://chen-qingxiang.github.io/showtime/](https://chen-qingxiang.github.io/showtime/)**
2. Load data in either way:

   * Paste CSV into the left panel → **Load**
   * Or choose multiple CSV files → each becomes a layer
3. Interact:

   * **Wheel**: zoom (around the mouse)
   * **Shift + Wheel**: zoom around center
   * **Ctrl/Cmd + Wheel**: faster zoom
   * **Drag** (canvas): pan
   * **Drag** (layer names on the left): reorder layers
   * **Right‑click** a layer name: delete layer

## Data format (CSV, two columns)

Each line is `time,title`. Comments start with `#` and are ignored. Examples:

```text
# Range with negative years (BCE)
-221~-207,Qin Shi Huang (Ying Zheng)

# Common dynasty spans
-202~8,Western Han
25~220,Eastern Han

# Single year becomes a one‑year span
1054,Crab supernova observed
```

**Range separators** you can use: `~ - — – － 〜 ～ 至 到`.

**BCE forms** supported:

* negative years: `-221`
* explicit labels: `221BC`, `221 BCE`, or `公元前221` (internally mapped to astronomical years)

## Interaction & rendering notes

* When space is tight, text wins: we render `Title  Start~End` and clip the tail if necessary, so the label stays meaningful.
* The axis shows `BC` for negative years. There is no year "0" on the axis.
* The lane layout is a greedy interval coloring per layer—simple and fast. High‑DPI displays are supported via `devicePixelRatio`.

## Design principles

* **Minimal surface area.** A single file is easier to reason about, share, and archive alongside datasets.
* **Data is the product.** Users can curate *many small CSVs*—by region, dynasty, domain (e.g., “major Buddhist figures,” “Song economic reforms”)—which together grow into a personal knowledge base.

## Roadmap

* **Export** to PNG / SVG
* **Tooltips** and keyboard shortcuts (e.g., snap to next/previous event)
* **Bookmarks & shareable URLs** (persist zoom/pan, visible layers)
* **Inline color controls** per layer; quick show/hide (👁)
* **Dataset hygiene**: optional schema checks and helpful warnings
* **Plugin surface** for computed overlays (e.g., reign length histograms)

## Known limitations

* Month/day granularity is not part of the initial scope; the model is year‑based.
* Extremely dense layers may still require you to zoom in to see every label; that’s intentional to keep rendering fast and legible.

---

PRs and suggestions welcome.
