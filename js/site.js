(function () {
  'use strict';

  // Mobile navigation toggle
  document.querySelectorAll('.nav-toggle').forEach(function (btn) {
    var menu = document.getElementById(btn.getAttribute('aria-controls'));
    if (!menu) return;
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  });

  // Close menu on escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-links.is-open').forEach(function (m) {
        m.classList.remove('is-open');
        document.body.classList.remove('nav-open');
      });
      document.querySelectorAll('.nav-toggle[aria-expanded="true"]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-label', 'Open menu');
      });
    }
  });

  // Respect reduced motion — pause ticker
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.ticker').forEach(function (t) {
      t.style.animation = 'none';
    });
  }
})();