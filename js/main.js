// main.js — SSL Lingerie & Modas
// Menu mobile, preloader, header dinâmico, cursor customizado.

// Marca presença do JS logo que o script carrega (antes do DOMContentLoaded)
// Permite que o CSS mostre estado inicial de reveal só quando JS está ativo
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------
     PRELOADER
     Oculta após o carregamento completo da página.
  -------------------------------------------------- */
  const preloader = document.getElementById('preloader');

  const ocultarPreloader = () => {
    if (!preloader) return;

    const logo          = preloader.querySelector('.preloader__logo');
    const marca         = preloader.querySelector('.preloader__marca');
    const headerLogoImg = document.querySelector('.header__logo-img');

    // prefers-reduced-motion ou elementos ausentes → fade simples
    if (!logo || !headerLogoImg ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      preloader.classList.add('is-oculto');
      preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
      return;
    }

    // Mede posições antes de qualquer transform
    const logoRect   = logo.getBoundingClientRect();
    const headerRect = headerLogoImg.getBoundingClientRect();

    const dx     = (headerRect.left + headerRect.width  / 2) - (logoRect.left + logoRect.width  / 2);
    const dy     = (headerRect.top  + headerRect.height / 2) - (logoRect.top  + logoRect.height / 2);
    const escala = headerRect.width / logoRect.width;

    // Oculta o logo do header: reaparece durante o fade do fundo
    headerLogoImg.style.opacity = '0';

    // Aguarda 500ms extras com logo visível, depois inicia a saída
    setTimeout(() => {

      // Marca some primeiro — cancela fill:forwards e inicia fade imediatamente
      if (marca) {
        marca.style.opacity    = '1';
        marca.style.animation  = 'none';
        marca.style.transition = 'opacity 0.30s ease-out';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { marca.style.opacity = '0'; });
        });
      }

      // Logo voa 120ms depois — dá tempo da marca já estar desaparecendo
      setTimeout(() => {
        logo.style.opacity         = '1';
        logo.style.transform       = 'none';
        logo.style.animation       = 'none';
        logo.style.transition      = 'transform 0.60s cubic-bezier(0.4, 0, 0.2, 1)';
        logo.style.transformOrigin = 'center center';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            logo.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;
          });
        });
      }, 120);

      // Após o logo chegar: fundo dissolve, logo do header aparece
      // — a transição opacity no preloader dispara o anel em brilhos.js
      // (630ms de voo + 120ms de head start da marca = 750ms)
      setTimeout(() => {
        preloader.style.transition = 'opacity 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 0.45s';
        preloader.style.opacity    = '0';
        preloader.style.visibility = 'hidden';

        headerLogoImg.style.transition = 'opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        headerLogoImg.style.opacity    = '1';
      }, 750);

      // Remove o preloader do DOM
      setTimeout(() => preloader.remove(), 1250);

    }, 300);
  };

  // Dispara com timeout máximo de 600ms a partir do DOMContentLoaded.
  // NÃO espera window.load — isso bloquearia até todas as imagens carregarem (~35s no mobile).
  // Se window.load vier antes dos 600ms, cancela o fallback e dispara imediatamente.
  const MAX_PRELOADER_MS = 600;
  if (document.readyState === 'complete') {
    setTimeout(ocultarPreloader, 300);
  } else {
    const maxTimeout = setTimeout(ocultarPreloader, MAX_PRELOADER_MS);
    window.addEventListener('load', () => {
      clearTimeout(maxTimeout);
      setTimeout(ocultarPreloader, 300);
    }, { once: true });
  }


  /* --------------------------------------------------
     HEADER DINÂMICO
     Adiciona .is-scrolled ao rolar > 60px.
  -------------------------------------------------- */
  const header = document.getElementById('header');

  if (header) {
    const atualizarHeader = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 60);
    };

    window.addEventListener('scroll', atualizarHeader, { passive: true });
    atualizarHeader(); // estado inicial
  }


  /* --------------------------------------------------
     MENU MOBILE
     Hamburguer abre/fecha o overlay fullscreen.
  -------------------------------------------------- */
  const hamburger  = document.querySelector('.header__hamburger');
  const overlay    = document.getElementById('nav-overlay');
  const fecharBtn  = document.querySelector('.nav-overlay__fechar');
  const linksMenu  = document.querySelectorAll('.nav-overlay__link');

  const abrirMenu = () => {
    overlay.classList.add('is-aberto');
    overlay.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    fecharBtn?.focus();
  };

  const fecharMenu = () => {
    overlay.classList.remove('is-aberto');
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger?.focus();
  };

  hamburger?.addEventListener('click', () => {
    const aberto = overlay.classList.contains('is-aberto');
    aberto ? fecharMenu() : abrirMenu();
  });

  fecharBtn?.addEventListener('click', fecharMenu);

  // Fecha ao clicar em um link do menu
  linksMenu.forEach(link => link.addEventListener('click', fecharMenu));

  // Fecha com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('is-aberto')) {
      fecharMenu();
    }
  });


  /* --------------------------------------------------
     SMIL — pausa animações SVG em prefers-reduced-motion
  -------------------------------------------------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.filosofia__ornamento svg, .marca__ornamento svg').forEach(svg => {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }


  /* --------------------------------------------------
     SMOOTH SCROLL — links âncora internos
  -------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const alvo = document.querySelector(link.getAttribute('href'));
      if (!alvo) return;
      e.preventDefault();
      alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });


});
