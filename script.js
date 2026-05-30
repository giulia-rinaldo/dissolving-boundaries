const toggle = document.getElementById('toggleView');
const grid = document.querySelector('.grid');

// inizializza in VIEW ALL
grid.classList.add('view-all');
toggle.setAttribute('aria-pressed', 'true');

toggle.addEventListener('click', () => {
  const pressed = toggle.getAttribute('aria-pressed') === 'true';
  toggle.setAttribute('aria-pressed', String(!pressed));

  if (!pressed) {
    // VIEW ALL mode → tutte le foto visibili, bottone bianco
    grid.classList.remove('hide');
    grid.classList.add('view-all');
    toggle.classList.remove('all-mode');
  } else {
    // HIDE mode → bottone nero
    grid.classList.remove('view-all');
    grid.classList.add('hide');
    toggle.classList.add('all-mode');
  }
});
