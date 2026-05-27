// svg-draw.js — SSL Lingerie & Modas
// Anima linhas SVG douradas com stroke-dashoffset (efeito "se desenha").
// Expõe window.SSL.svgDraw para scroll.js disparar as seções abaixo do fold.

(() => {
  window.SSL = window.SSL || {};

  // Mede o comprimento real de cada path e define o estado inicial invisível
  const inicializar = (svg) => {
    svg.querySelectorAll('.svg-linha').forEach(p => {
      const L = Math.ceil(p.getTotalLength());
      p.style.strokeDasharray  = L;
      p.style.strokeDashoffset = L;
    });
  };

  // Anima cada linha em sequência, com delay escalonado
  const desenhar = (svg, baseDelay = 0) => {
    svg.querySelectorAll('.svg-linha').forEach((p, i) => {
      setTimeout(() => {
        p.style.strokeDashoffset = '0';
      }, baseDelay + i * 380);
    });
  };

  // --- HERO: inicializa e dispara assim que o preloader começa a sumir ---
  const heroSvg = document.querySelector('.hero__svg-linhas');
  if (heroSvg) {
    inicializar(heroSvg);
    // 1050ms: coincide com o início do fade-out do preloader (1200ms no main.js)
    setTimeout(() => desenhar(heroSvg, 0), 1050);
  }

  // --- CONTATO: inicializa agora; scroll.js dispara ao entrar na viewport ---
  const contatoSvg = document.querySelector('.contato__svg-linhas');
  if (contatoSvg) inicializar(contatoSvg);

  // API pública para scroll.js
  window.SSL.svgDraw = { desenhar };

})();
