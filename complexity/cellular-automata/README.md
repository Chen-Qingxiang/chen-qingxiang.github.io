# Elementary Cellular Automata

A lightweight, self-contained GitHub Pages project for visualizing
one-dimensional elementary cellular automata.

The app uses plain HTML, CSS, and JavaScript. It renders the automaton on a
canvas with space on the x-axis and time on the y-axis.

## Preview locally

Open `index.html` directly in a browser, or serve the folder with a simple
static server:

```sh
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

## GitHub Pages

This repo is intended to be served at:

```text
https://chen-qingxiang.github.io/complexity/cellular-automata/
```

Because the site uses relative paths for `style.css` and `script.js`, it can be
deployed from the repository root with GitHub Pages.
