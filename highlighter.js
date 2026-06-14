// Evidenziatore per la pagina paper.
// Due strumenti: cursore normale ed evidenziatore.
// Le frasi evidenziate vengono salvate in localStorage (per browser/dispositivo)
// e ricaricate alla visita successiva. Usa la CSS Custom Highlight API.
(function () {
  const STORAGE_KEY = 'paper-highlights-v1';
  const HL_NAME = 'saved-highlights';
  const supported = typeof Highlight !== 'undefined' && window.CSS && CSS.highlights;

  // blocchi di testo evidenziabili (con contenuto)
  const blocks = Array.from(document.querySelectorAll('.text'))
    .filter(function (b) { return b.textContent.trim().length > 0; });
  const blockIndex = new Map();
  blocks.forEach(function (b, i) { blockIndex.set(b, i); });

  let records = load();   // [{ block, start, end, text }]
  let mode = 'cursor';    // 'cursor' | 'marker'

  // ---------- storage ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // ---------- offset <-> range ----------
  // costruisce un Range dato l'offset (in caratteri) dentro un blocco
  function offsetsToRange(block, start, end) {
    const range = document.createRange();
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    let pos = 0, startSet = false, node;
    while ((node = walker.nextNode())) {
      const len = node.nodeValue.length;
      if (!startSet && start <= pos + len) {
        range.setStart(node, start - pos);
        startSet = true;
      }
      if (startSet && end <= pos + len) {
        range.setEnd(node, end - pos);
        return range;
      }
      pos += len;
    }
    return null;
  }
  // calcola start/end (in caratteri) di una selezione rispetto al blocco
  function selectionOffsets(block, range) {
    const pre = document.createRange();
    pre.selectNodeContents(block);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end = start + range.toString().length;
    return { start: start, end: end };
  }

  // ---------- rendering ----------
  function render() {
    if (supported) {
      const hl = new Highlight();
      records.forEach(function (r) {
        const block = blocks[r.block];
        if (!block) return;
        const range = offsetsToRange(block, r.start, r.end);
        if (range) hl.add(range);
      });
      CSS.highlights.set(HL_NAME, hl);
    }
    updatePanel();
  }

  // ---------- aggiungi dalla selezione ----------
  function addFromSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const start = range.startContainer.parentElement;
    const block = start ? start.closest('.text') : null;
    if (!block || !blockIndex.has(block)) return;           // solo dentro il testo
    if (!block.contains(range.endContainer)) return;        // selezione in un solo blocco
    const off = selectionOffsets(block, range);
    if (off.end <= off.start) return;
    const text = range.toString().replace(/\s+/g, ' ').trim();
    if (!text) return;
    records.push({ block: blockIndex.get(block), start: off.start, end: off.end, text: text });
    persist();
    render();
    sel.removeAllRanges();
  }

  function removeAt(i) { records.splice(i, 1); persist(); render(); }
  function clearAll() { records = []; persist(); render(); }

  // ---------- UI ----------
  const bar = document.createElement('div');
  bar.className = 'hl-toolbar';
  bar.innerHTML =
    '<button class="hl-btn hl-cursor active">CURSORE</button>' +
    '<button class="hl-btn hl-marker">EVIDENZIA</button>' +
    '<button class="hl-btn hl-panel-toggle">SALVATI (<span class="hl-count">0</span>)</button>';
  document.body.appendChild(bar);

  const panel = document.createElement('div');
  panel.className = 'hl-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="hl-panel-head"><span>EVIDENZIATI</span>' +
    '<button class="hl-clear">CANCELLA TUTTO</button></div>' +
    '<ul class="hl-list"></ul>';
  document.body.appendChild(panel);

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
  }
  btnCursor.addEventListener('click', function () { setMode('cursor'); });
  btnMarker.addEventListener('click', function () { setMode('marker'); });
  btnPanel.addEventListener('click', function () { panel.hidden = !panel.hidden; });
  panel.querySelector('.hl-clear').addEventListener('click', clearAll);

  function updatePanel() {
    countEl.textContent = records.length;
    listEl.innerHTML = '';
    if (!records.length) {
      const li = document.createElement('li');
      li.className = 'hl-empty';
      li.textContent = 'Nessuna frase evidenziata.';
      listEl.appendChild(li);
      return;
    }
    records.forEach(function (r, i) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.className = 'hl-text';
      span.textContent = r.text.length > 90 ? r.text.slice(0, 90) + '…' : r.text;
      span.addEventListener('click', function () {
        const block = blocks[r.block];
        if (block) block.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      const rm = document.createElement('button');
      rm.className = 'hl-remove';
      rm.textContent = '✕';
      rm.setAttribute('aria-label', 'rimuovi');
      rm.addEventListener('click', function () { removeAt(i); });
      li.appendChild(span);
      li.appendChild(rm);
      listEl.appendChild(li);
    });
  }

  // evidenzia al rilascio della selezione, solo in modalità evidenziatore
  function maybeAdd() { if (mode === 'marker') setTimeout(addFromSelection, 0); }
  document.addEventListener('mouseup', maybeAdd);
  document.addEventListener('touchend', maybeAdd);

  if (!supported) {
    // fallback minimo: salva comunque, ma avvisa che l'evidenziazione visiva
    // non è supportata da questo browser
    console.warn('CSS Custom Highlight API non supportata: le frasi vengono salvate ma non colorate.');
  }

  render();
})();
