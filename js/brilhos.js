// brilhos.js — SSL Lingerie & Modas
// Fase 4:
//   1. Glow dourado reativo ao scroll nos labels (IntersectionObserver)
//   2. Anel animado do logo — dispara uma vez ao entrar no site (após preloader)
//      e a cada mouseenter no logo (desktop).
// Desativado em prefers-reduced-motion.

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Adia 600ms para não competir com LCP na main thread.
  // Seguro: o transitionend do preloader (anel) só dispara em ~1.3s.
  setTimeout(function () {

  /* ── 1. Glow dos labels ao entrar na viewport ─────────────── */

  var seletores = [
    '.manifesto__label',
    '.filosofia__label',
    '.drama__label',
    '.marca__label',
    '.universo__label',
    '.universo__sublabel',
  ].join(', ');

  var elementos = document.querySelectorAll(seletores);

  if (elementos.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        el.classList.add('is-glow');

        el.addEventListener('animationend', function handler() {
          el.classList.remove('is-glow');
          el.removeEventListener('animationend', handler);
        });

        observer.unobserve(el);
      });
    }, { threshold: 0.6 });

    elementos.forEach(function (el) { observer.observe(el); });
  }


  /* ── 2. Anel animado do logo ──────────────────────────────── */

  var ring   = document.querySelector('.header__logo-ring');
  var logoEl = document.querySelector('.header__logo');
  if (!ring || !logoEl) return;

  function disparar() {
    ring.classList.remove('is-animando');
    ring.getBoundingClientRect(); // força reflow em SVG (offsetWidth não funciona)
    ring.classList.add('is-animando');
  }

  // Dispara após o preloader sumir (opacity transition termina)
  var preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'opacity') return;
      disparar();
      preloader.removeEventListener('transitionend', handler);
    });
  } else {
    // Preloader já removido (ex.: visita com cache)
    disparar();
  }

  // Dispara ao passar o mouse — só em dispositivos com hover real
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    logoEl.addEventListener('mouseenter', disparar);
  }

  }, 600); // fim setTimeout

})();
