// Math Sheet — vanilla JS whiteboard for equations + annotations
// State is one plain object; persisted to localStorage and exportable as JSON.

const STORAGE_KEY = 'math-sheet:v1';

// xcolor name → display hex. xcolor names are what MathLive understands inside
// \textcolor{...} and \colorbox{...}; the hex is what we paint on screen.
const PALETTE = {
  black:  '#111111',
  red:    '#e11d48',
  blue:   '#2563eb',
  green:  '#16a34a',
  orange: '#ca8a04',
  purple: '#9333ea',
};
const HIGHLIGHT = { // softer fills for \colorbox highlighting
  black:  '#e5e7eb',
  red:    '#fecaca',
  blue:   '#bfdbfe',
  green:  '#bbf7d0',
  orange: '#fde68a',
  purple: '#e9d5ff',
};

// ---------- state ----------
const state = loadState() ?? {
  view: { panX: 0, panY: 0, zoom: 1 },
  tool: 'move',
  colorName: 'black',
  nextId: 1,
  blocks: [],   // { id, type:'math'|'text', x, y, latex|text, note }
  strokes: [],  // { id, color, width, points:[[x,y],...] }
};
// non-persisted UI state
let activeMathField = null;
let panning = null;        // { startX, startY, panX0, panY0 }
let blockDrag = null;      // { id, dx, dy, pointerId }
let currentStroke = null;  // { id, el, points }

// ---------- DOM ----------
const viewport = document.getElementById('viewport');
const world    = document.getElementById('world');
const blocksEl = document.getElementById('blocks');
const overlay  = document.getElementById('overlay');
const zoomLbl  = document.getElementById('zoom-label');
const hintEl   = document.getElementById('hint');
const fileIn   = document.getElementById('file-input');

// ---------- helpers ----------
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const uid = () => 'id' + (state.nextId++);
function screenToWorld(cx, cy) {
  const r = viewport.getBoundingClientRect();
  return {
    x: (cx - r.left - state.view.panX) / state.view.zoom,
    y: (cy - r.top  - state.view.panY) / state.view.zoom,
  };
}
function applyTransform() {
  world.style.transform =
    `translate(${state.view.panX}px, ${state.view.panY}px) scale(${state.view.zoom})`;
  zoomLbl.textContent = Math.round(state.view.zoom * 100) + '%';
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); }
    catch (e) { console.warn('save failed', e); }
  }, 200);
}
function snapshot() {
  return {
    view: state.view,
    nextId: state.nextId,
    blocks: state.blocks,
    strokes: state.strokes,
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return Object.assign({ tool: 'move', colorName: 'black' }, s);
  } catch { return null; }
}

// ---------- block rendering ----------
function blockLabelNumber(block) {
  if (block.type !== 'math') return null;
  let n = 0;
  for (const b of state.blocks) {
    if (b.type !== 'math') continue;
    n++;
    if (b.id === block.id) return n;
  }
  return null;
}

function renderBlock(block) {
  const el = document.createElement('div');
  el.className = 'block block-' + block.type;
  el.dataset.id = block.id;
  positionBlock(el, block);

  // header
  const head = document.createElement('div');
  head.className = 'head';
  const label = document.createElement('span');
  label.className = 'label';
  head.appendChild(label);
  const spacer = document.createElement('span');
  spacer.className = 'spacer';
  head.appendChild(spacer);

  const noteBtn = headerBtn('note', 'Toggle note');
  noteBtn.onclick = (e) => { e.stopPropagation(); toggleNote(block.id); };
  head.appendChild(noteBtn);

  const dupBtn  = headerBtn('copy', 'Duplicate');
  dupBtn.onclick = (e) => { e.stopPropagation(); duplicateBlock(block.id); };
  head.appendChild(dupBtn);

  const delBtn  = headerBtn('close', 'Delete');
  delBtn.onclick = (e) => { e.stopPropagation(); deleteBlock(block.id); };
  head.appendChild(delBtn);

  head.addEventListener('pointerdown', (e) => startBlockDrag(e, block.id));
  el.appendChild(head);

  // body
  const body = document.createElement('div');
  body.className = 'body';
  if (block.type === 'math') {
    const mf = document.createElement('math-field');
    mf.value = block.latex ?? '';
    mf.addEventListener('input', () => {
      block.latex = mf.value;
      save();
    });
    mf.addEventListener('focus', () => { activeMathField = mf; });
    mf.addEventListener('blur',  () => { if (activeMathField === mf) activeMathField = null; });
    // Ctrl/Cmd+Enter = evaluate selection (or full expression) into a new block.
    mf.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        activeMathField = mf; // make sure it's set even on first keystroke
        evaluateSelection();
      }
    });
    body.appendChild(mf);
  } else {
    const txt = document.createElement('div');
    txt.className = 'text';
    txt.contentEditable = 'true';
    txt.spellcheck = true;
    txt.setAttribute('data-placeholder', 'Write something…');
    txt.textContent = block.text ?? '';
    txt.addEventListener('input', () => { block.text = txt.textContent; save(); });
    body.appendChild(txt);
  }
  el.appendChild(body);

  // margin note
  const note = document.createElement('div');
  note.className = 'note';
  note.contentEditable = 'true';
  note.setAttribute('data-placeholder', 'Note…');
  note.textContent = block.note ?? '';
  if (!block.note) note.classList.add('hidden');
  note.addEventListener('input', () => { block.note = note.textContent; save(); });
  el.appendChild(note);

  blocksEl.appendChild(el);
  updateBlockLabel(block);
  return el;
}

function headerBtn(iconId, title) {
  const b = document.createElement('button');
  b.title = title;
  b.innerHTML = `<svg class="ic"><use href="#i-${iconId}"/></svg>`;
  return b;
}

function positionBlock(el, block) {
  el.style.left = block.x + 'px';
  el.style.top  = block.y + 'px';
}

function updateBlockLabel(block) {
  const el = blocksEl.querySelector(`.block[data-id="${block.id}"] .label`);
  if (!el) return;
  if (block.type === 'math') {
    const n = blockLabelNumber(block);
    el.textContent = '(' + n + ')';
    el.title = 'Click to copy reference';
    el.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText('(' + n + ')');
      flash(el);
    };
  } else {
    el.innerHTML = '<svg class="ic" aria-label="text block"><use href="#i-text"/></svg>';
    el.style.cursor = 'default';
    el.style.background = 'transparent';
    el.style.padding = '0';
    el.onclick = null;
  }
}
function refreshAllLabels() {
  for (const b of state.blocks) updateBlockLabel(b);
}
function flash(el) {
  el.animate(
    [{ background: '#fde68a' }, { background: '' }],
    { duration: 500 }
  );
}

function toggleNote(id) {
  const block = state.blocks.find(b => b.id === id);
  if (!block) return;
  const el = blocksEl.querySelector(`.block[data-id="${id}"] .note`);
  el.classList.toggle('hidden');
  if (!el.classList.contains('hidden')) {
    if (block.note == null) block.note = '';
    el.focus();
  }
  save();
}

function duplicateBlock(id) {
  const src = state.blocks.find(b => b.id === id);
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = uid();
  copy.x += 24; copy.y += 24;
  state.blocks.push(copy);
  renderBlock(copy);
  refreshAllLabels();
  save();
}

function deleteBlock(id) {
  state.blocks = state.blocks.filter(b => b.id !== id);
  blocksEl.querySelector(`.block[data-id="${id}"]`)?.remove();
  refreshAllLabels();
  save();
}

// ---------- adding blocks ----------
function addMathBlock(opts = {}) {
  const center = viewportCenterWorld();
  const block = {
    id: uid(), type: 'math',
    x: Math.round(opts.x ?? center.x - 120),
    y: Math.round(opts.y ?? center.y - 24),
    latex: opts.latex ?? '',
    note: null,
  };
  state.blocks.push(block);
  const el = renderBlock(block);
  refreshAllLabels();
  // focus the math-field so the user can start typing immediately
  setTimeout(() => el.querySelector('math-field')?.focus(), 0);
  save();
  return block;
}
function addTextBlock(opts = {}) {
  const center = viewportCenterWorld();
  const block = {
    id: uid(), type: 'text',
    x: Math.round(opts.x ?? center.x - 140),
    y: Math.round(opts.y ?? center.y - 16),
    text: opts.text ?? '',
    note: null,
  };
  state.blocks.push(block);
  const el = renderBlock(block);
  refreshAllLabels();
  setTimeout(() => el.querySelector('.text')?.focus(), 0);
  save();
  return block;
}
function viewportCenterWorld() {
  const r = viewport.getBoundingClientRect();
  return screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
}

// ---------- pan / zoom / block drag ----------
viewport.addEventListener('pointerdown', (e) => {
  if (e.button === 2) return;          // ignore right-click
  if (state.tool === 'pen') return startStroke(e);
  if (state.tool === 'eraser') return; // eraser handled via overlay path clicks
  // don't pan if pointerdown is inside a block (so math-fields work)
  if (e.target.closest('.block')) return;
  startPan(e);
});

function startPan(e) {
  panning = {
    pointerId: e.pointerId,
    startX: e.clientX, startY: e.clientY,
    panX0: state.view.panX, panY0: state.view.panY,
  };
  viewport.setPointerCapture(e.pointerId);
  viewport.classList.add('panning');
}
viewport.addEventListener('pointermove', (e) => {
  if (panning && e.pointerId === panning.pointerId) {
    state.view.panX = panning.panX0 + (e.clientX - panning.startX);
    state.view.panY = panning.panY0 + (e.clientY - panning.startY);
    applyTransform();
    return;
  }
  if (blockDrag && e.pointerId === blockDrag.pointerId) {
    const w = screenToWorld(e.clientX, e.clientY);
    const block = state.blocks.find(b => b.id === blockDrag.id);
    if (!block) return;
    block.x = Math.round(w.x - blockDrag.dx);
    block.y = Math.round(w.y - blockDrag.dy);
    const el = blocksEl.querySelector(`.block[data-id="${block.id}"]`);
    if (el) positionBlock(el, block);
    return;
  }
  if (currentStroke && e.pointerId === currentStroke.pointerId) {
    extendStroke(e);
  }
});
viewport.addEventListener('pointerup', (e) => endPointer(e));
viewport.addEventListener('pointercancel', (e) => endPointer(e));
function endPointer(e) {
  if (panning && e.pointerId === panning.pointerId) {
    panning = null;
    viewport.classList.remove('panning');
    save();
  }
  if (blockDrag && e.pointerId === blockDrag.pointerId) {
    blockDrag = null;
    save();
  }
  if (currentStroke && e.pointerId === currentStroke.pointerId) {
    finishStroke();
  }
}

function startBlockDrag(e, id) {
  if (state.tool !== 'move') return;
  e.stopPropagation();
  const block = state.blocks.find(b => b.id === id);
  if (!block) return;
  const w = screenToWorld(e.clientX, e.clientY);
  blockDrag = {
    id, pointerId: e.pointerId,
    dx: w.x - block.x,
    dy: w.y - block.y,
  };
  viewport.setPointerCapture(e.pointerId);
}

viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  // pinch-zoom on trackpads sends ctrlKey; wheel on a mouse zooms too
  const factor = Math.exp(-e.deltaY * 0.0015);
  zoomAt(e.clientX, e.clientY, factor);
  save();
}, { passive: false });

function zoomAt(cx, cy, factor) {
  const r = viewport.getBoundingClientRect();
  const lx = cx - r.left, ly = cy - r.top;
  const newZoom = clamp(state.view.zoom * factor, 0.2, 4);
  const ratio = newZoom / state.view.zoom;
  state.view.panX = lx - (lx - state.view.panX) * ratio;
  state.view.panY = ly - (ly - state.view.panY) * ratio;
  state.view.zoom = newZoom;
  applyTransform();
}

// ---------- pen / eraser ----------
function startStroke(e) {
  if (e.target.closest('.block')) return; // shouldn't happen (pointer-events off), but guard
  const w = screenToWorld(e.clientX, e.clientY);
  const stroke = {
    id: uid(),
    color: PALETTE[state.colorName],
    width: 2, // world units; scales naturally with zoom (ink-on-paper feel)
    points: [[round(w.x), round(w.y)]],
  };
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'stroke');
  path.setAttribute('stroke', stroke.color);
  path.setAttribute('stroke-width', String(stroke.width));
  path.setAttribute('d', pointsToPath(stroke.points));
  path.dataset.id = stroke.id;
  path.addEventListener('click', () => {
    if (state.tool !== 'eraser') return;
    state.strokes = state.strokes.filter(s => s.id !== stroke.id);
    path.remove();
    save();
  });
  overlay.appendChild(path);
  state.strokes.push(stroke);
  currentStroke = { id: stroke.id, el: path, points: stroke.points, pointerId: e.pointerId };
  viewport.setPointerCapture(e.pointerId);
}
function extendStroke(e) {
  const w = screenToWorld(e.clientX, e.clientY);
  const pts = currentStroke.points;
  const last = pts[pts.length - 1];
  // throttle: skip points closer than ~1.5px in world space
  const dx = w.x - last[0], dy = w.y - last[1];
  if (dx*dx + dy*dy < 2.25) return;
  pts.push([round(w.x), round(w.y)]);
  currentStroke.el.setAttribute('d', pointsToPath(pts));
}
function finishStroke() {
  currentStroke = null;
  save();
}
function pointsToPath(pts) {
  if (!pts.length) return '';
  if (pts.length === 1) {
    const [x, y] = pts[0];
    return `M ${x} ${y} l 0.01 0`;
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  return d;
}
function round(n) { return Math.round(n * 10) / 10; }

// ---------- color action (highlight equation parts) ----------
function applyColorToSelection({ box = false } = {}) {
  if (!activeMathField) return false;
  const sel = activeMathField.getValue('selection', 'latex');
  if (!sel) return false;
  const name = state.colorName;
  const cmd = box
    ? `\\colorbox{${name}}{${sel}}`     // highlight background
    : `\\textcolor{${name}}{${sel}}`;   // change text color
  // Replace selection with wrapped version.
  activeMathField.insert(cmd, { selectionMode: 'after', focus: true });
  // update state
  const id = activeMathField.closest('.block')?.dataset.id;
  const block = state.blocks.find(b => b.id === id);
  if (block) block.latex = activeMathField.value;
  save();
  return true;
}

// ---------- evaluate / solve ----------
// Uses MathLive's optional Compute Engine (loaded via separate CDN script).
// If the selection is an equation (Equal), solve for its unknowns; otherwise
// simplify and numerically evaluate. The result is dropped into a new math
// block placed just below the source so the derivation stays on the sheet.
function evaluateSelection() {
  if (!activeMathField) { hint('Click into an equation first'); return; }

  // Lazy init / sanity check
  const ce = (window.MathfieldElement && MathfieldElement.computeEngine) || null;
  if (!ce) { hint('Compute engine still loading — try again in a sec'); return; }

  let latex = activeMathField.getValue('selection', 'latex') || activeMathField.value;
  if (!latex || !latex.trim()) { hint('Nothing to evaluate'); return; }

  let resultLatex = null;
  try {
    const expr = ce.parse(latex);
    if (!expr || expr.isValid === false) { hint('Could not parse that'); return; }

    const op = expr.operator || expr.head;
    if (op === 'Equal' || op === 'Equality') {
      const unknowns = expr.unknowns ?? [];
      if (unknowns.length === 0) {
        const r = expr.simplify();
        resultLatex = r.latex;
      } else {
        const sols = expr.solve(unknowns);
        if (!sols || sols.length === 0) {
          resultLatex = '\\text{no solution}';
        } else {
          const varname = unknowns[0];
          resultLatex = sols
            .map(s => `${varname} = ${(s.N ? s.N() : s).latex}`)
            .join(', \\quad ');
        }
      }
    } else {
      let r = expr.simplify();
      // Numerical eval when possible (e.g. 4+5 → 9)
      try {
        const num = r.N();
        if (num && num.isValid !== false) r = num;
      } catch {}
      resultLatex = r.latex;
    }
  } catch (e) {
    console.error(e); hint('Could not evaluate that'); return;
  }

  if (!resultLatex) { hint('No result'); return; }

  // Place result just below the source block
  const srcBlock = state.blocks.find(b =>
    b.id === activeMathField.closest('.block')?.dataset.id
  );
  if (srcBlock) {
    const srcEl = blocksEl.querySelector(`.block[data-id="${srcBlock.id}"]`);
    const h = srcEl?.offsetHeight ?? 60;
    addMathBlock({ latex: resultLatex, x: srcBlock.x, y: srcBlock.y + h + 16 });
  } else {
    addMathBlock({ latex: resultLatex });
  }
}

// ---------- toolbar ----------
// Stop toolbar buttons from stealing focus from the active math-field — otherwise
// the math-field blurs, clears activeMathField, and selection-based actions
// (color swatches, highlight, evaluate) silently do nothing.
document.getElementById('toolbar').addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) e.preventDefault();
});
document.getElementById('toolbar').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;

  if (t.dataset.tool) return setTool(t.dataset.tool);

  if (t.classList.contains('swatch')) return setColor(t.dataset.color);

  const action = t.dataset.action;
  if (!action) return;
  switch (action) {
    case 'add-math':       addMathBlock(); break;
    case 'add-text':       addTextBlock(); break;
    case 'highlight-box':  if (!applyColorToSelection({ box: true })) hint('Select part of an equation first'); break;
    case 'evaluate':       evaluateSelection(); break;
    case 'zoom-in':        zoomAt(window.innerWidth/2, window.innerHeight/2, 1.2); save(); break;
    case 'zoom-out':       zoomAt(window.innerWidth/2, window.innerHeight/2, 1/1.2); save(); break;
    case 'reset-view':     state.view = { panX: 0, panY: 0, zoom: 1 }; applyTransform(); save(); break;
    case 'save':           downloadJSON(); break;
    case 'open':           fileIn.click(); break;
    case 'png':            exportPNG(); break;
    case 'clear':          clearSheet(); break;
  }
});

function setTool(name) {
  state.tool = name;
  for (const b of document.querySelectorAll('.tool')) {
    b.classList.toggle('active', b.dataset.tool === name);
  }
  viewport.classList.toggle('tool-pen',    name === 'pen');
  viewport.classList.toggle('tool-eraser', name === 'eraser');
}

function setColor(name) {
  state.colorName = name;
  for (const b of document.querySelectorAll('.swatch')) {
    b.classList.toggle('active', b.dataset.color === name);
  }
  // If a math-field has a live selection, apply textcolor immediately.
  applyColorToSelection({ box: false });
}

const DEFAULT_HINT = 'Drag to pan · scroll to zoom · Ctrl+Enter solves the selection';
function hint(msg) {
  hintEl.textContent = msg;
  clearTimeout(hint._t);
  hint._t = setTimeout(() => { hintEl.textContent = DEFAULT_HINT; }, 2500);
}

// ---------- file save / load / png ----------
function downloadJSON() {
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sheet.mathsheet';
  a.click();
  URL.revokeObjectURL(a.href);
}
fileIn.addEventListener('change', () => {
  const f = fileIn.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try { loadFromObject(JSON.parse(r.result)); }
    catch (e) { hint('Could not open file'); console.error(e); }
  };
  r.readAsText(f);
  fileIn.value = '';
});
function loadFromObject(s) {
  blocksEl.innerHTML = '';
  overlay.innerHTML  = '';
  state.view    = s.view    ?? { panX: 0, panY: 0, zoom: 1 };
  state.nextId  = s.nextId  ?? 1;
  state.blocks  = s.blocks  ?? [];
  state.strokes = s.strokes ?? [];
  applyTransform();
  for (const b of state.blocks)  renderBlock(b);
  for (const s of state.strokes) renderStroke(s);
  refreshAllLabels();
  save();
}
function renderStroke(s) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'stroke');
  path.setAttribute('stroke', s.color);
  path.setAttribute('stroke-width', String(s.width ?? 2));
  path.setAttribute('d', pointsToPath(s.points));
  path.dataset.id = s.id;
  path.addEventListener('click', () => {
    if (state.tool !== 'eraser') return;
    state.strokes = state.strokes.filter(x => x.id !== s.id);
    path.remove();
    save();
  });
  overlay.appendChild(path);
}

async function exportPNG() {
  // PNG export pipeline:
  //   clone world → replace live <math-field>s with static rendered markup →
  //   serialize into an SVG <foreignObject> → load into an <img> → draw onto
  //   a canvas → download as PNG.
  // We must inline the page's <style> tags because foreignObject content
  // does not inherit document styles. We also rely on MathLive's
  // convertLatexToMarkup() so math actually shows up (the live shadow-DOM
  // contents of <math-field> would otherwise serialize empty).
  const bb = contentBounds();
  if (!bb) { hint('Nothing to export'); return; }
  const pad = 40;
  const w = bb.w + pad * 2, h = bb.h + pad * 2;
  try {
    const clone = world.cloneNode(true);

    // Replace each <math-field> in the clone with rendered markup
    const ml = window.MathLive;
    if (ml?.convertLatexToMarkup) {
      const originals = world.querySelectorAll('math-field');
      const clones    = clone.querySelectorAll('math-field');
      clones.forEach((mf, i) => {
        const latex = originals[i]?.value ?? '';
        const span = document.createElement('span');
        span.style.fontSize = '20px';
        span.style.display  = 'inline-block';
        span.innerHTML = ml.convertLatexToMarkup(latex);
        mf.replaceWith(span);
      });
    }

    // Shift cloned world so content fits at (pad, pad) with no transform
    clone.style.transform = `translate(${-bb.x + pad}px, ${-bb.y + pad}px)`;

    // Pull in all page styles (MathLive injects its CSS into <style> tags)
    const styles = [...document.head.querySelectorAll('style')]
      .map(s => s.textContent).join('\n');

    const inner = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <foreignObject x="0" y="0" width="${w}" height="${h}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;background:#f4f4ef;position:relative;overflow:hidden;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
          <style>${styles}</style>
          ${inner}
        </div>
      </foreignObject>
    </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const canvas = document.createElement('canvas');
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'sheet.png';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); hint('PNG export not supported in this browser'); };
    img.src = url;
  } catch (e) {
    console.error(e); hint('PNG export failed');
  }
}

function contentBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of state.blocks) {
    const el = blocksEl.querySelector(`.block[data-id="${b.id}"]`);
    if (!el) continue;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + el.offsetWidth);
    maxY = Math.max(maxY, b.y + el.offsetHeight);
  }
  for (const s of state.strokes) for (const [x, y] of s.points) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (!isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function clearSheet() {
  if (!confirm('Clear the whole sheet?')) return;
  state.blocks = []; state.strokes = []; state.nextId = 1;
  state.view = { panX: 0, panY: 0, zoom: 1 };
  blocksEl.innerHTML = ''; overlay.innerHTML = '';
  applyTransform();
  save();
}

// ---------- keyboard shortcuts ----------
window.addEventListener('keydown', (e) => {
  // ignore when typing in math-field / contenteditable / inputs
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'math-field' || tag === 'input' || tag === 'textarea') return;
  if (e.target.isContentEditable) return;

  if (e.key === 'e' || e.key === 'E') { addMathBlock(); e.preventDefault(); }
  else if (e.key === 't' || e.key === 'T') { addTextBlock(); e.preventDefault(); }
  else if (e.key === 'v' || e.key === 'V') setTool('move');
  else if (e.key === 'p' || e.key === 'P') setTool('pen');
  else if (e.key === 'x' || e.key === 'X') setTool('eraser');
  else if (e.key === '0') { state.view = { panX:0, panY:0, zoom:1 }; applyTransform(); save(); }
  else if (e.key === '+' || e.key === '=') { zoomAt(innerWidth/2, innerHeight/2, 1.2); save(); }
  else if (e.key === '-') { zoomAt(innerWidth/2, innerHeight/2, 1/1.2); save(); }
});

// suppress browser context menu on canvas (we use right-click for nothing yet, keeps UX clean)
viewport.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- boot ----------
function boot() {
  applyTransform();
  for (const b of state.blocks)  renderBlock(b);
  for (const s of state.strokes) renderStroke(s);
  refreshAllLabels();
  setTool(state.tool || 'move');
  setColor(state.colorName || 'black');

  // First-run: drop a friendly starter block in the center of the viewport.
  if (state.blocks.length === 0 && state.strokes.length === 0) {
    // Defer one frame so viewport has a real size before we measure it.
    requestAnimationFrame(() => {
      addMathBlock({ latex: 'x = \\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}' });
    });
  }
}
// MathLive registers its custom element on script load; we have `defer` on both,
// and our script is loaded after mathlive's, so by the time DOMContentLoaded
// fires the custom element is defined.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
