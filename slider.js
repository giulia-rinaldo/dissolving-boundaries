// Slider orizzontale per le 3 interpretazioni.
// Scorrimento con frecce, puntini, swipe (touch) e frecce della tastiera.
(function () {
  const slides = document.querySelector('.slides');
  if (!slides) return;

  const slideEls = Array.from(slides.querySelectorAll('.slide'));
  const prev = document.querySelector('.slide-arrow.prev');
  const next = document.querySelector('.slide-arrow.next');
  const dotsWrap = document.querySelector('.slide-dots');

  let index = 0;

  // puntini di navigazione
  const dots = slideEls.map(function (_, i) {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'vai alla slide ' + (i + 1));
    b.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(b);
    return b;
  });

  function goTo(i) {
    index = Math.max(0, Math.min(slideEls.length - 1, i));
    slides.scrollTo({ left: slides.clientWidth * index, behavior: 'smooth' });
    update();
  }

  function update() {
    dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    if (prev) prev.style.visibility = index === 0 ? 'hidden' : 'visible';
    if (next) next.style.visibility = index === slideEls.length - 1 ? 'hidden' : 'visible';
  }

  if (prev) prev.addEventListener('click', function () { goTo(index - 1); });
  if (next) next.addEventListener('click', function () { goTo(index + 1); });

  // sincronizza l'indice con lo scorrimento manuale / swipe
  let t;
  slides.addEventListener('scroll', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      index = Math.round(slides.scrollLeft / slides.clientWidth);
      update();
    }, 80);
  });

  // frecce della tastiera
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
  });

  // mantieni la slide corretta al ridimensionamento
  window.addEventListener('resize', function () {
    slides.scrollLeft = slides.clientWidth * index;
  });

  update();
})();
