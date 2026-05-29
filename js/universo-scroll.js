// universo-scroll.js — SSL Lingerie & Modas — Fase 8
// Desktop: traduz scroll vertical em translateX nos painéis (sticky).
// Mobile: scroll-snap horizontal nativo — JS não intervém.

(() => {
  'use strict';

  const secao  = document.querySelector('#universo');
  const track  = secao?.querySelector('.universo__track');
  const fill   = secao?.querySelector('.universo__progresso-fill');

  if (!secao || !track) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ehMobile      = () => window.innerWidth < 768;

  let maxTranslate = 0;
  let tickPendente = false;

  /* --------------------------------------------------
     Calcula a altura da seção para criar o espaço de
     scroll vertical equivalente ao percurso horizontal.
  -------------------------------------------------- */
  const configurar = () => {
    if (ehMobile() || reducedMotion) {
      secao.style.height    = '';
      track.style.transform = 'translateX(0)';
      return;
    }

    // Remove qualquer transform para medir o scroll width real
    track.style.transform = 'translateX(0)';
    maxTranslate          = track.scrollWidth - window.innerWidth;
    secao.style.height    = maxTranslate + window.innerHeight + 'px';
  };

  /* --------------------------------------------------
     Atualiza o translateX com base na posição de scroll
     dentro da seção.
  -------------------------------------------------- */
  const atualizar = () => {
    tickPendente = false;
    if (ehMobile() || reducedMotion) return;

    const rect      = secao.getBoundingClientRect();
    const scrollado = -rect.top;
    const maxScroll = secao.offsetHeight - window.innerHeight;

    const progresso = Math.min(1, Math.max(0, scrollado / maxScroll));

    track.style.transform = 'translateX(' + (-(progresso * maxTranslate).toFixed(1)) + 'px)';

    if (fill) fill.style.width = (progresso * 100).toFixed(1) + '%';
  };

  const onScroll = () => {
    if (tickPendente) return;
    tickPendente = true;
    requestAnimationFrame(atualizar);
  };

  /* Inicializa após layout completo (fontes e imagens carregadas) */
  window.addEventListener('load', () => {
    configurar();
    atualizar();
  });

  window.addEventListener('resize', () => {
    configurar();
    atualizar();
  }, { passive: true });

  window.addEventListener('scroll', onScroll, { passive: true });

})();
