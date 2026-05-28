// scroll.js — SSL Lingerie & Modas
// IntersectionObserver: scroll reveal + disparo de linhas SVG.
// Qualquer elemento com [data-svg-container] dispara desenhar() ao entrar na viewport.

(() => {

  /* --------------------------------------------------
     SCROLL REVEAL
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
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    elementos.forEach(el => observer.observe(el));
  };


  /* --------------------------------------------------
     SVG DRAW — genérico
     Qualquer elemento marcado com [data-svg-container]
     dispara o desenho do <svg> filho ao entrar na tela.
  -------------------------------------------------- */
  const observarSvgContainers = () => {
    const containers = document.querySelectorAll('[data-svg-container]');
    if (!containers.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const svg = entry.target.querySelector('svg');
        if (svg) window.SSL?.svgDraw?.desenhar(svg, 250);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    containers.forEach(el => observer.observe(el));
  };


  /* --------------------------------------------------
     ACTIVE LINK — destaca seção atual no header
     "A MARCA" (#manifesto) permanece ativo enquanto
     o usuário percorre manifesto → universo.
  -------------------------------------------------- */
  const observarSecaoAtiva = () => {
    const secoes = document.querySelectorAll('section[id]');
    const links  = document.querySelectorAll('.header__link');
    if (!secoes.length || !links.length) return;

    const mapaSecaoLink = {
      hero:      '#hero',
      manifesto: '#manifesto',
      filosofia: '#manifesto',
      drama:     '#manifesto',
      marca:     '#manifesto',
      universo:  '#manifesto',
      contato:   '#contato',
    };

    const ativarLink = (href) => {
      links.forEach(link => {
        link.setAttribute('aria-current',
          link.getAttribute('href') === href ? 'page' : 'false');
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const hrefAlvo = mapaSecaoLink[entry.target.id];
        if (hrefAlvo) ativarLink(hrefAlvo);
      });
    }, { threshold: 0, rootMargin: '0px 0px -70% 0px' });

    secoes.forEach(s => observer.observe(s));
  };


  observarReveal();
  observarSvgContainers();
  observarSecaoAtiva();

})();
