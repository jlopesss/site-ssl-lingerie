// parallax.js — SSL Lingerie & Modas
// Fase 3: Interações da hero (apenas desktop com hover real)
//
// EFEITO ATIVO:
//   GLOW DO CURSOR — brilho dourado do "SSL" intensifica
//   quando o cursor se aproxima do wordmark.
//   Desativar: hero.dataset.cursorGlow = 'off'
//
// prefers-reduced-motion: módulo inteiro é desligado.

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var hero     = document.getElementById('hero');
  var wordmark = document.querySelector('.hero__wordmark');
  var ssl      = document.querySelector('.hero__wordmark-ssl');
  if (!hero || !wordmark || !ssl) return;

  // ── Parâmetros do Glow do cursor ───────────────────────────────
  // drop-shadow em 3 camadas; GLOW_BASE = com cursor distante, GLOW_PICO = sobre o SSL
  var GLOW_BASE = [0.80, 0.48, 0.22];
  var GLOW_PICO = [1.10, 0.72, 0.38];
  var GLOW_RAIO = 380;    // px — raio de influência do cursor
  var LERP_G    = 0.06;

  // ── Estado interno ─────────────────────────────────────────────
  var tGlow = 0, cGlow = 0; // intensidade do glow 0..1

  var sslBcr = null;
  var mouseX = 0, mouseY = 0;
  var dentro = false;
  var frame  = 0;

  // ── Eventos de mouse ───────────────────────────────────────────
  hero.addEventListener('mouseenter', function () {
    sslBcr = ssl.getBoundingClientRect();
    dentro = true;
  }, { passive: true });

  hero.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  hero.addEventListener('mouseleave', function () {
    tGlow = 0;
    dentro = false;
  }, { passive: true });

  window.addEventListener('resize', function () {
    heroBcr = null; // força recálculo no próximo mousemove
    sslBcr  = null;
  }, { passive: true });

  // ── Loop de animação ───────────────────────────────────────────
  var rafId = null;

  function tick() {
    rafId = requestAnimationFrame(tick);
    frame++;

    // ── Glow do cursor ─────────────────────────────────────────
    if (hero.dataset.cursorGlow !== 'off') {
      if (dentro && sslBcr) {
        var cx   = sslBcr.left + sslBcr.width  * 0.5;
        var cy   = sslBcr.top  + sslBcr.height * 0.5;
        var dist = Math.sqrt((mouseX - cx) * (mouseX - cx) + (mouseY - cy) * (mouseY - cy));
        tGlow = Math.max(0.0, 1.0 - dist / GLOW_RAIO);
      } else {
        tGlow = 0;
      }

      cGlow += (tGlow - cGlow) * LERP_G;

      var a = (GLOW_BASE[0] + (GLOW_PICO[0] - GLOW_BASE[0]) * cGlow).toFixed(2);
      var b = (GLOW_BASE[1] + (GLOW_PICO[1] - GLOW_BASE[1]) * cGlow).toFixed(2);
      var c = (GLOW_BASE[2] + (GLOW_PICO[2] - GLOW_BASE[2]) * cGlow).toFixed(2);

      ssl.style.filter =
        'drop-shadow(0 0 18px rgba(200,160,56,' + a + ')) ' +
        'drop-shadow(0 0 55px rgba(200,160,56,' + b + ')) ' +
        'drop-shadow(0 0 120px rgba(200,160,56,' + c + '))';
    }

    // Atualiza bounding rect do SSL a cada 60 frames (evita layout thrashing)
    if (frame % 60 === 0 && dentro) {
      sslBcr = ssl.getBoundingClientRect();
    }
  }

  // ── Pausa fora da viewport ─────────────────────────────────────
  new IntersectionObserver(function (entries) {
    var visivel = entries[0].isIntersecting;
    if (visivel && !rafId) {
      rafId = requestAnimationFrame(tick);
    }
    if (!visivel && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
      ssl.style.filter = '';
      cGlow = 0;
    }
  }, { threshold: 0.1 }).observe(hero);

})();
