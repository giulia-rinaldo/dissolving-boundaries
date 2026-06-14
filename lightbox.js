// Lightbox: click su una foto → ingrandita al centro,
// con un rettangolo nero (largo come l'immagine) e testo bianco
// che riporta tutte le informazioni del blocco di quella foto.
(function () {
  // costruisce l'overlay una sola volta
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.hidden = true;
  lb.innerHTML =
    '<div class="lightbox-content">' +
      '<img class="lightbox-img" alt="">' +
      '<div class="lightbox-caption"></div>' +
    '</div>';
  document.body.appendChild(lb);

  const lbContent = lb.querySelector('.lightbox-content');
  const lbImg = lb.querySelector('.lightbox-img');
  const lbCaption = lb.querySelector('.lightbox-caption');

  // i click su foto/rettangolo non chiudono (solo l'area intorno chiude)
  lbContent.addEventListener('click', function (e) { e.stopPropagation(); });

  // larghezza del rettangolo = larghezza dell'immagine mostrata
  function syncWidth() {
    lbCaption.style.width = lbImg.offsetWidth + 'px';
  }

  // link a una fonte attendibile (Wikipedia) per ogni artista
  function artistHref(name) {
    const n = name.toLowerCase();
    if (n.indexOf('gallen-kallela') !== -1) return 'https://en.wikipedia.org/wiki/Akseli_Gallen-Kallela';
    if (n.indexOf('saarinen') !== -1) return 'https://en.wikipedia.org/wiki/Eliel_Saarinen';
    if (n.indexOf('sonck') !== -1) return 'https://en.wikipedia.org/wiki/Lars_Sonck';
    if (n.indexOf('thom') !== -1) return 'https://en.wikipedia.org/wiki/Verner_Thom%C3%A9';
    return null;
  }
  // restituisce il nome avvolto in un link (sottolineato) se disponibile
  function artistHTML(name) {
    const href = artistHref(name);
    return href
      ? '<a class="artist-link" href="' + href + '" target="_blank" rel="noopener">' + name + '</a>'
      : name;
  }

  function open(img) {
    const cell = img.closest('.cell');
    const number = cell ? cell.querySelector('.number') : null;
    const text = cell ? cell.querySelector('.text') : null;

    // cella "header" = contiene solo il nome dell'artista (marcatore ◼︎)
    const isHeader = !!(text && text.textContent.indexOf('◼') !== -1);

    let info = '';
    if (img.dataset.artist && isHeader) {
      // header (es. blocco 31): numero in tonde + simbolo quadrato + nome pulito
      if (number && number.textContent.trim()) {
        info += '<div class="lightbox-number">' + number.innerHTML + '</div>';
      }
      info += '◼︎ ' + artistHTML(img.dataset.artist);
    } else {
      // opere: nome dell'artista in tonde, poi le info
      if (img.dataset.artist) {
        info += '<div class="lightbox-artist">( &nbsp;' + artistHTML(img.dataset.artist) + '&nbsp; )</div>';
      } else if (number && number.textContent.trim()) {
        info += '<div class="lightbox-number">' + number.innerHTML + '</div>';
      }
      if (text) info += text.innerHTML;
    }

    lbImg.src = img.src;
    lbCaption.innerHTML = info;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';

    if (lbImg.complete) syncWidth();
    else lbImg.onload = syncWidth;
  }

  function close() {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  // rende cliccabile ogni foto
  document.querySelectorAll('.cell .content img').forEach(function (img) {
    img.style.cursor = 'pointer';
    img.addEventListener('click', open.bind(null, img));
  });

  // chiusura: click sull'overlay o tasto Esc
  lb.addEventListener('click', close);
  window.addEventListener('resize', function () {
    if (!lb.hidden) syncWidth();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lb.hidden) close();
  });
})();
