// particles.js — SSL Lingerie & Modas
// Canvas de partículas douradas conectadas (estilo constelação) na seção Drama.
// Reage sutilmente ao mouse no desktop. Pausa fora da viewport (IntersectionObserver).

(() => {

  const canvas = document.getElementById('drama-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  const secao  = canvas.closest('.drama');

  /* ---- Configuração ---- */
  const CONFIG = {
    qtd:          55,       // número de partículas
    raioMax:      2.2,      // raio máximo de cada ponto
    velocidade:   0.28,     // pixels/frame
    distConexao:  130,      // distância máxima para desenhar linha
    corPonto:     '201,168,106',   // RGB do --dourado
    opacPonto:    0.55,
    opacLinha:    0.12,
    mouseForca:   80,       // raio de influência do mouse
    mouseIntens:  0.018,    // intensidade do deslocamento pelo mouse
  };

  /* ---- Estado ---- */
  let W, H, particulas = [], mouse = { x: null, y: null };
  let animando = false, rafId = null;

  /* ---- Redimensionamento ---- */
  const redimensionar = () => {
    W = canvas.width  = secao.offsetWidth;
    H = canvas.height = secao.offsetHeight;
  };

  /* ---- Criação das partículas ---- */
  const criarParticulas = () => {
    particulas = Array.from({ length: CONFIG.qtd }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.velocidade * 2,
      vy: (Math.random() - 0.5) * CONFIG.velocidade * 2,
      r:  Math.random() * CONFIG.raioMax + 0.8,
    }));
  };

  /* ---- Loop de animação ---- */
  const atualizar = () => {
    particulas.forEach(p => {
      // Movimento base
      p.x += p.vx;
      p.y += p.vy;

      // Rebate nas bordas
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      // Repulsão leve pelo mouse (desktop)
      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONFIG.mouseForca) {
          const forca = (CONFIG.mouseForca - dist) / CONFIG.mouseForca;
          p.x += dx * forca * CONFIG.mouseIntens;
          p.y += dy * forca * CONFIG.mouseIntens;
        }
      }
    });
  };

  const desenhar = () => {
    ctx.clearRect(0, 0, W, H);

    // Pontos
    particulas.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.corPonto}, ${CONFIG.opacPonto})`;
      ctx.fill();
    });

    // Conexões
    for (let i = 0; i < particulas.length; i++) {
      for (let j = i + 1; j < particulas.length; j++) {
        const dx   = particulas[i].x - particulas[j].x;
        const dy   = particulas[i].y - particulas[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.distConexao) {
          // Opacidade inversamente proporcional à distância
          const opac = CONFIG.opacLinha * (1 - dist / CONFIG.distConexao);
          ctx.beginPath();
          ctx.moveTo(particulas[i].x, particulas[i].y);
          ctx.lineTo(particulas[j].x, particulas[j].y);
          ctx.strokeStyle = `rgba(${CONFIG.corPonto}, ${opac})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  };

  const loop = () => {
    if (!animando) return;
    atualizar();
    desenhar();
    rafId = requestAnimationFrame(loop);
  };

  const iniciar = () => {
    if (animando) return;
    animando = true;
    loop();
  };

  const pausar = () => {
    animando = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  /* ---- IntersectionObserver — pausa fora da viewport ---- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        iniciar();
      } else {
        pausar();
      }
    });
  }, { threshold: 0.05 });

  observer.observe(secao);

  /* ---- Mouse (apenas desktop) ---- */
  const semTouch = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (semTouch) {
    secao.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });

    secao.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
  }

  /* ---- Redimensionamento com debounce ---- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      redimensionar();
      criarParticulas();
    }, 150);
  }, { passive: true });

  /* ---- Inicialização ---- */
  redimensionar();
  criarParticulas();

  /* ---- prefers-reduced-motion: não anima ---- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Desenha o estado estático uma única vez (sem loop)
    desenhar();
  }
  // Caso contrário, o IntersectionObserver controla o início

})();
