const toggle = document.getElementById('toggleView');
const grid = document.querySelector('.grid');

// inizializza in VIEW ALL
grid.classList.add('view-all');
toggle.setAttribute('aria-pressed', 'true');

toggle.addEventListener('click', () => {
  const pressed = toggle.getAttribute('aria-pressed') === 'true';
  toggle.setAttribute('aria-pressed', String(!pressed));

  if (!pressed) {
    // VIEW ALL mode
    grid.classList.remove('hide');
    grid.classList.add('view-all');
    toggle.classList.remove('hide-mode'); // bottone normale
  } else {
    // HIDE mode
    grid.classList.remove('view-all');
    grid.classList.add('hide');
    toggle.classList.add('hide-mode'); // bottone invertito
  }
});
