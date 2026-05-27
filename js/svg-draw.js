// svg-draw.js — SSL Lingerie & Modas
// Inicializa TODAS as .svg-linha da página e expõe a função desenhar().
// scroll.js dispara o desenho nas seções com [data-svg-container].

(() => {
  window.SSL = window.SSL || {};

  // Mede o comprimento real de cada path e define estado inicial invisível
  const inicializarTodas = () => {
    document.querySelectorAll('.svg-linha').forEach(p => {
      const L = Math.ceil(p.getTotalLength());
      p.style.strokeDasharray  = L;
      p.style.strokeDashoffset = L;
    });
  };

  // Anima as linhas dentro de um <svg> em sequência escalonada
  const desenhar = (svg, baseDelay = 0) => {
    svg.querySelectorAll('.svg-linha').forEach((p, i) => {
      setTimeout(() => {
        p.style.strokeDashoffset = '0';
      }, baseDelay + i * 380);
    });
  };

  inicializarTodas();

  // Hero: dispara em 1050ms — coincide com início do fade-out do preloader
  const heroSvg = document.querySelector('.hero__svg-linhas');
  if (heroSvg) setTimeout(() => desenhar(heroSvg, 0), 1050);

  window.SSL.svgDraw = { desenhar };

})();
