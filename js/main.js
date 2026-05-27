// main.js — SSL Lingerie & Modas
// Menu mobile, preloader, header dinâmico, cursor customizado.

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------
     PRELOADER
     Oculta após o carregamento completo da página.
  -------------------------------------------------- */
  const preloader = document.getElementById('preloader');

  const ocultarPreloader = () => {
    if (!preloader) return;
    preloader.classList.add('is-oculto');
    // Remove do fluxo após a transição CSS (0.7s)
    preloader.addEventListener('transitionend', () => {
      preloader.remove();
    }, { once: true });
  };

  if (document.readyState === 'complete') {
    setTimeout(ocultarPreloader, 1200);
  } else {
    window.addEventListener('load', () => setTimeout(ocultarPreloader, 1200));
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


  /* --------------------------------------------------
     CURSOR CUSTOMIZADO (apenas desktop, não-touch)
  -------------------------------------------------- */
  const semTouch = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (semTouch) {
    const cursor = document.createElement('div');
    cursor.classList.add('cursor-custom');
    document.body.appendChild(cursor);

    let cx = 0, cy = 0;
    let rafId = null;

    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          cursor.style.transform = `translate(calc(${cx}px - 50%), calc(${cy}px - 50%))`;
          rafId = null;
        });
      }

      cursor.classList.add('cursor-visivel');
    });

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor-visivel');
    });

    // Expande ao passar sobre links e botões
    const interativos = 'a, button, [role="button"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interativos)) {
        cursor.classList.add('cursor-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interativos)) {
        cursor.classList.remove('cursor-hover');
      }
    });
  }

});
