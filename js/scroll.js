// scroll.js — SSL Lingerie & Modas
// IntersectionObserver: scroll reveal + disparo das linhas SVG da seção Contato.
// Roda depois de svg-draw.js (ordem garantida pelos <script defer> no HTML).

(() => {

  /* --------------------------------------------------
     SCROLL REVEAL
     Adiciona .reveal-visivel quando o elemento entra
     na viewport. One-shot: para de observar depois.
  -------------------------------------------------- */
  const observarReveal = () => {
    const elementos = document.querySelectorAll(
      '.reveal, .reveal-esquerda, .reveal-direita'
    );
    if (!elementos.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('reveal-visivel');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -48px 0px'  // dispara um pouco antes do borda inferior
    });

    elementos.forEach(el => observer.observe(el));
  };


  /* --------------------------------------------------
     SVG DRAW — seção Contato
     Dispara o desenho das linhas quando a seção
     entra na viewport pela primeira vez.
  -------------------------------------------------- */
  const observarContatoSvg = () => {
    const contatoSvg = document.querySelector('.contato__svg-linhas');
    const contatoSecao = document.getElementById('contato');
    if (!contatoSvg || !contatoSecao) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        // Garante que ssl.svgDraw está disponível (carregado antes por ordem dos scripts)
        window.SSL?.svgDraw?.desenhar(contatoSvg, 300);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    observer.observe(contatoSecao);
  };


  /* --------------------------------------------------
     ACTIVE LINK — destaca o link do header conforme
     a seção visível (útil quando adicionarmos mais nav)
  -------------------------------------------------- */
  const observarSecaoAtiva = () => {
    const secoes  = document.querySelectorAll('section[id]');
    const links   = document.querySelectorAll('.header__link');
    if (!secoes.length || !links.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach(link => {
          const href = link.getAttribute('href')?.replace('#', '');
          link.setAttribute('aria-current', href === id ? 'page' : 'false');
        });
      });
    }, { threshold: 0.4 });

    secoes.forEach(s => observer.observe(s));
  };


  // Inicializa tudo
  observarReveal();
  observarContatoSvg();
  observarSecaoAtiva();

})();
