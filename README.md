# Math Sheet

A simple, single-page whiteboard for writing math by keyboard — no LaTeX
fluency required. Built on [MathLive](https://mathlive.io) and the
[Cortex Compute Engine](https://mathlive.io/compute-engine/).

No build step, no framework, no dependencies to install. Works as a static site
on GitHub Pages.

## What it does

- **Type math without LaTeX.** Click `Math`, start typing. `/` makes a fraction,
  `^` a superscript, `sqrt` becomes √, etc. Hit the keyboard icon on the field
  to bring up the on-screen math keyboard on mobile or whenever your fingers
  forget what's where.
- **Free-form whiteboard.** Drag blocks anywhere. Drag empty space to pan.
  Scroll (or pinch) to zoom. Drop multiple equations and arrange them however
  you'd explain it on paper.
- **Color highlights.** Select part of an equation and click a color swatch to
  recolor it (`\textcolor`). The highlight icon next to the swatches puts a
  colored box around the selection (`\colorbox`) — handy for marking the
  discriminant, a substitution, etc.
- **Margin notes.** Every block has a hidden italic note slot you can open
  with the pencil icon. Good for the "we did this because…" comments.
- **Numbered references.** Each equation gets a `(1)`, `(2)`, `(3)` label
  automatically. Click a label to copy the reference to your clipboard so you
  can paste *"plug into (2)…"* into a text block.
- **Freehand pen + eraser.** Switch to the pen tool to scribble arrows, circle
  steps, draw whatever you want over the sheet. Strokes live in world
  coordinates so they stay attached to nearby equations when you pan/zoom.
  The eraser tool deletes a stroke on click.
- **Evaluate / solve.** Select an expression (or a whole equation) and hit the
  `Solve` button — or `Ctrl/Cmd+Enter` while typing — and the result lands in
  a new block right below the source:
  - `4 + 5` → `9`
  - `\sin(\pi/4)` → `\frac{\sqrt{2}}{2}`
  - `x - 2 = 8` → `x = 10`
  - `x^{2} - 5x + 6 = 0` → `x = 2,\quad x = 3`
- **Autosave.** Everything you do is saved to `localStorage` and restored on
  reload.
- **Save / open files.** Download the sheet as a `.mathsheet` JSON file, or
  open one you saved before.
- **Export PNG.** Best-effort raster of the current sheet (Chrome works best;
  Safari's `foreignObject` support is patchy).

## Keyboard shortcuts

| Key | Action |
|---|---|
| `E` | Add math block |
| `T` | Add text block |
| `V` / `P` / `X` | Move / Pen / Eraser tool |
| `+` `−` `0` | Zoom in / out / reset |
| `Ctrl+Enter` (in a math-field) | Evaluate / solve selection |

## Running locally

It's a static site, so you just need any local web server (file:// won't work
because MathLive uses strict CORS):

```sh
# Python 3
python -m http.server 8000

# Node
npx serve .
```

Then open <http://localhost:8000>.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Source: `main` branch, `/` (root).
3. Visit `https://<user>.github.io/<repo>/`. The `.nojekyll` file in this repo
   tells Pages to serve the files as-is without Jekyll processing.

## Files

```
index.html   — markup, toolbar, inline SVG icons, CDN script tags
styles.css   — layout + theme
app.js       — all the logic (~700 lines, vanilla JS)
.nojekyll    — GH Pages config
```

That's it. No package.json, no build, no npm install.

## How it works (briefly)

- A `.world` div is transformed with `translate + scale` for pan/zoom.
- Blocks are absolutely-positioned divs inside `.world` (CSS transforms apply).
- Strokes are SVG `<path>`s in an overlay also inside `.world`, so they pan
  and zoom along with the blocks.
- Math blocks embed `<math-field>` (MathLive web component). The selection
  API (`mf.getValue('selection', 'latex')` + `mf.insert('\\textcolor{…}{#@}')`)
  is what powers the color/highlight buttons.
- The evaluate button parses the selected LaTeX with
  `MathfieldElement.computeEngine.parse(latex)`, then either calls
  `expr.solve(expr.unknowns)` (when the root operator is `Equal`) or
  `expr.simplify().N()` for plain arithmetic.

## Caveats

- PNG export depends on `<foreignObject>` rendering Web Components and HTML
  with their inline styles. Chrome handles it; Safari may render math blocks
  blank. The JSON `Save` works everywhere.
- The compute engine is loaded from a separate CDN script after MathLive — if
  evaluate doesn't respond, refresh and try again once the page is fully
  loaded.

## License

Do whatever you want with it.
