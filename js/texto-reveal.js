// texto-reveal.js — SSL Lingerie & Modas — Fase 6
// Reveal sofisticado: manifesto linha-a-linha, títulos palavra-a-palavra.

(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* --------------------------------------------------
     MANIFESTO — linha por linha
     Atribui --i a cada .manifesto__linha para o stagger CSS.
     IntersectionObserver próprio: quando o container entra na
     viewport, adiciona .linhas-visiveis na frase após um pequeno
     delay, para o efeito de slide do container já ter começado.
  -------------------------------------------------- */
  document.querySelectorAll('.manifesto__linha').forEach((el, i) => {
    el.style.setProperty('--i', i);
  });

  const manifContent = document.querySelector('.manifesto__content');
  if (manifContent) {
    const obsManif = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        // Dispara após 300ms para o slide do container já estar em curso
        setTimeout(() => {
          document.querySelector('.manifesto__frase')?.classList.add('linhas-visiveis');
        }, 300);
        obsManif.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    obsManif.observe(manifContent);
  }


  /* --------------------------------------------------
     TÍTULOS DE DESTAQUE — palavra por palavra
     Quebra só os text nodes diretos (não recursivo),
     preservando <em> e outros elementos com gradient-text intactos.
  -------------------------------------------------- */
  const quebrarPalavras = (seletor) => {
    const el = document.querySelector(seletor);
    if (!el || el.dataset.qp) return;

    // Processa apenas text nodes filhos diretos
    [...el.childNodes]
      .filter(n => n.nodeType === 3)
      .forEach(no => {
        const partes = no.textContent.split(/(\s+)/);
        const frag  = document.createDocumentFragment();
        partes.forEach(p => {
          if (/\S/.test(p)) {
            const s = document.createElement('span');
            s.className = 'palavra';
            s.textContent = p;
            frag.appendChild(s);
          } else if (p) {
            frag.appendChild(document.createTextNode(p));
          }
        });
        no.parentNode.replaceChild(frag, no);
      });

    el.dataset.qp = '1';

    // Índice de delay para cada palavra
    el.querySelectorAll('.palavra').forEach((s, i) => {
      s.style.setProperty('--i', i);
    });

    // Elementos <em> animam após as palavras (como unidade única)
    const totalPalavras = el.querySelectorAll('.palavra').length;
    el.querySelectorAll('em').forEach((em, j) => {
      const delay = (totalPalavras + j) * 0.055 + 0.10;
      em.style.setProperty('--em-delay', `${delay.toFixed(3)}s`);
    });

    // IntersectionObserver dispara .palavras-visiveis no título
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('palavras-visiveis');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.30 });

    obs.observe(el);
  };

  quebrarPalavras('.filosofia__frase');
  quebrarPalavras('.drama__titulo');
  quebrarPalavras('.marca__titulo');

})();
