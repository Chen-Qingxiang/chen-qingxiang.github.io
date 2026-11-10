# chen-qingxiang.github.io

Source for <https://chen-qingxiang.github.io> — a personal site that hosts small, static, browser-based tools plus a short blog about them. Built by GitHub Pages with Jekyll and the Cayman theme.

## Layout

| Path | What it is |
|---|---|
| `index.md` | Home page (project list) |
| `blog/index.md` | Blog archive, grouped by year |
| `_posts/` | Blog posts (`YYYY-MM-DD-slug.md`, served at `/blog/slug/`) |
| `_layouts/post.html` | Post layout: date, tags, prev/next links |
| `_config.yml` | Site settings and plugins (feed, sitemap, SEO tags) |
| `complexity/` | Complexity Playground: 9 demos, installable PWA |
| `spacetime/` | Spacetime Trails · 时空行迹 (historical figures on map + timeline) |
| `terrain-atlas/` | Terrain Atlas · 山海图 (3D terrain, CesiumJS) |
| `periodic-table/` | Bilingual periodic table with X-ray data (PWA) |
| `xray-shells/`, `xray-interactions/` | X-ray physics explorers |
| `pdf-tool/` | PDF Local, a browser-only PDF toolkit (PWA) |

Each tool is a self-contained static folder; several have their own `README.md` with details.

## Adding a post

Create `_posts/YYYY-MM-DD-some-slug.md`:

```yaml
---
title: "Title"
description: One sentence; shown on the blog index and in search results.
tags: [tag1, tag2]
---
```

No `layout:` line is needed — posts default to the `post` layout.

## Local preview

```bash
gem install bundler jekyll jekyll-theme-cayman jekyll-feed jekyll-sitemap jekyll-seo-tag
jekyll serve        # then open http://localhost:4000
```
