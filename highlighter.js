// Evidenziatore per la pagina paper.
// Due strumenti: cursore (selezione testo normale) ed evidenziatore (tratto a mano libera).
// In modalità evidenziatore si disegna un tratto giallo che SEGUE IL MOUSE (non le righe del testo).
// I tratti sono salvati in localStorage (per browser/dispositivo) e ricaricati alla visita successiva.
(function () {
  const STORAGE_KEY = 'paper-strokes-v1';
  const COLOR = '#e8ff00';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const WIDTH = 16;

  let strokes = load();   // [{ points: [[x, y], ...] }]
  let mode = 'cursor';    // 'cursor' | 'marker'

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(strokes)); }

  // ---------- overlay SVG (tratto a mano libera) ----------
  const canvas = document.createElementNS(SVGNS, 'svg');
  canvas.setAttribute('class', 'hl-canvas');
  document.body.appendChild(canvas);

  function sizeCanvas() {
    canvas.setAttribute('width', document.documentElement.scrollWidth);
    canvas.setAttribute('height', document.documentElement.scrollHeight);
  }
  function pointsAttr(pts) {
    return pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
  }
  function makeStrokeEl(pts) {
    const pl = document.createElementNS(SVGNS, 'polyline');
    pl.setAttribute('points', pointsAttr(pts));
    pl.setAttribute('fill', 'none');
    pl.setAttribute('stroke', COLOR);
    pl.setAttribute('stroke-width', WIDTH);
    pl.setAttribute('stroke-linecap', 'round');
    pl.setAttribute('stroke-linejoin', 'round');
    pl.setAttribute('opacity', '0.55');
    return pl;
  }
  function renderStrokes() {
    sizeCanvas();
    while (canvas.firstChild) canvas.removeChild(canvas.firstChild);
    strokes.forEach(function (s) {
      if (s.points && s.points.length) canvas.appendChild(makeStrokeEl(s.points));
    });
  }
  function render() { renderStrokes(); updatePanel(); }

  // ---------- disegno (solo in modalità evidenziatore) ----------
  let drawing = false, current = null, currentEl = null;
  function toPoint(e) {
    return [Math.round(e.clientX + window.scrollX), Math.round(e.clientY + window.scrollY)];
  }
  function onDown(e) {
    if (mode !== 'marker') return;
    if (e.target && e.target.closest && e.target.closest('.hl-toolbar, .hl-panel')) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();                       // niente selezione: solo tratto a mano libera
    drawing = true;
    current = { points: [toPoint(e)] };
    currentEl = makeStrokeEl(current.points);
    canvas.appendChild(currentEl);
  }
  function onMove(e) {
    if (!drawing) return;
    const p = toPoint(e);
    const last = current.points[current.points.length - 1];
    if (last[0] === p[0] && last[1] === p[1]) return;
    current.points.push(p);
    currentEl.setAttribute('points', pointsAttr(current.points));
  }
  function onUp() {
    if (!drawing) return;
    drawing = false;
    if (current.points.length === 1) {        // semplice click → puntino
      const p = current.points[0];
      current.points.push([p[0] + 0.1, p[1]]);
      currentEl.setAttribute('points', pointsAttr(current.points));
    }
    strokes.push(current);
    persist();
    current = null;
    currentEl = null;
    updatePanel();
  }
  document.addEventListener('mousedown', onDown);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  window.addEventListener('resize', sizeCanvas);

  function removeAt(i) { strokes.splice(i, 1); persist(); render(); }
  function clearAll() { strokes = []; persist(); render(); }

  // ---------- UI ----------
  // icone SVG (seguono il colore del bottone tramite currentColor)
  const ICON_CURSOR = '<svg class="hl-ico hl-ico-cursor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v10"/><path d="M10 7h4"/><path d="M10 17h4"/></svg>';
  const ICON_MARKER = '<svg class="hl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>';
  const ICON_BOOKMARK = '<svg class="hl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
  const ICON_TRASH = '<svg class="hl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>';

  const bar = document.createElement('div');
  bar.className = 'hl-toolbar';
  bar.innerHTML =
    '<button class="hl-btn hl-cursor active" title="Select text" aria-label="Select text">' + ICON_CURSOR + '</button>' +
    '<button class="hl-btn hl-marker" title="Highlighter" aria-label="Highlighter">' + ICON_MARKER + '</button>' +
    '<button class="hl-btn hl-panel-toggle" title="Highlights" aria-label="Highlights">' + ICON_BOOKMARK + '<span class="hl-count">0</span></button>';
  document.body.appendChild(bar);

  const panel = document.createElement('div');
  panel.className = 'hl-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="hl-panel-head"><span class="hl-panel-title">HIGHLIGHTS</span>' +
    '<button class="hl-clear" title="Clear all" aria-label="Clear all">' + ICON_TRASH + '</button></div>' +
    '<ul class="hl-list"></ul>';
  document.body.appendChild(panel);

  // cursore personalizzato che segue il mouse (stile Figma), uno per ogni strumento
  const GHOSTS = {
    cursor: {
      svg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14"/><path d="M9.5 5h5"/><path d="M9.5 19h5"/></svg>',
      ox: 13, oy: 13
    },
    marker: {
      svg: '<svg width="30" height="30" viewBox="0 0 24 24" fill="#e8ff00" stroke="#000" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>',
      ox: 4, oy: 25
    }
  };
  const ghost = document.createElement('div');
  ghost.className = 'hl-ghost';
  ghost.hidden = true;
  document.body.appendChild(ghost);

  let ghostOX = 13, ghostOY = 13;
  function applyGhostIcon(m) {
    const g = GHOSTS[m] || GHOSTS.cursor;
    ghost.innerHTML = g.svg;
    ghostOX = g.ox;
    ghostOY = g.oy;
  }
  applyGhostIcon(mode);

  function moveGhost(e) {
    const t = e.target;
    if (t && t.closest && t.closest('.hl-toolbar, .hl-panel')) { ghost.hidden = true; return; }
    ghost.hidden = false;
    ghost.style.left = (e.clientX - ghostOX) + 'px';
    ghost.style.top = (e.clientY - ghostOY) + 'px';
  }
  document.addEventListener('mousemove', moveGhost);
  document.addEventListener('mouseleave', function () { ghost.hidden = true; });

  const btnCursor = bar.querySelector('.hl-cursor');
  const btnMarker = bar.querySelector('.hl-marker');
  const btnPanel = bar.querySelector('.hl-panel-toggle');
  const countEl = bar.querySelector('.hl-count');
  const listEl = panel.querySelector('.hl-list');

  function setMode(m) {
    mode = m;
    btnCursor.classList.toggle('active', m === 'cursor');
    btnMarker.classList.toggle('active', m === 'marker');
    document.body.classList.toggle('hl-marker', m === 'marker');
    applyGhostIcon(m);
  }
  btnCursor.addEventListener('click', function () { setMode('cursor'); });
  btnMarker.addEventListener('click', function () { setMode('marker'); });
  btnPanel.addEventListener('click', function () { panel.hidden = !panel.hidden; });
  panel.querySelector('.hl-clear').addEventListener('click', clearAll);

  function updatePanel() {
    countEl.textContent = strokes.length;
    listEl.innerHTML = '';
    if (!strokes.length) {
      const li = document.createElement('li');
      li.className = 'hl-empty';
      li.textContent = 'No highlights yet.';
      listEl.appendChild(li);
      return;
    }
    strokes.forEach(function (s, i) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.className = 'hl-text';
      span.textContent = 'Highlight ' + (i + 1);
      span.addEventListener('click', function () {
        const y = s.points && s.points[0] ? s.points[0][1] : 0;
        window.scrollTo({ top: Math.max(0, y - 120), behavior: 'smooth' });
      });
      const rm = document.createElement('button');
      rm.className = 'hl-remove';
      rm.textContent = '✕';
      rm.setAttribute('aria-label', 'remove');
      rm.addEventListener('click', function () { removeAt(i); });
      li.appendChild(span);
      li.appendChild(rm);
      listEl.appendChild(li);
    });
  }

  render();
})();
