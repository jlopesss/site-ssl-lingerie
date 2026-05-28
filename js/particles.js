// particles.js — SSL Lingerie & Modas
// Canvas de partículas douradas conectadas (estilo constelação) na seção Drama.
// Cada partícula recebe um tom aleatório da paleta metálica; brilho individual sutil.
// Reage ao mouse no desktop. Pausa fora da viewport (IntersectionObserver).

(() => {

  const canvas = document.getElementById('drama-canvas');
  if (!canvas) return;

  const ctx   = canvas.getContext('2d');
  const secao = canvas.closest('.drama');

  /* ---- Paleta metálica — espelha o --gradiente-dourado do CSS ---- */
  const CORES_OURO = [
    '140, 112,  64',   // #8c7040  âmbar escuro
    '158, 124,  56',   // #9e7c38  âmbar profundo (centro do gradiente)
    '168, 136,  78',   // #a8884e  âmbar médio
    '201, 168, 106',   // #c9a86a  ouro base
    '212, 180,  92',   // #d4b45c  ouro médio-claro
    '232, 208, 128',   // #e8d080  ouro claro
    '224, 200, 150',   // #e0c896  ouro suave
    '240, 223, 152',   // #f0df98  creme-ouro (borda do gradiente)
  ];

  /* ---- Configuração ---- */
  const CONFIG = {
    qtd:         55,
    raioMax:     2.4,
    velocidade:  0.28,
    distConexao: 130,
    corLinha:    '200, 164,  88',   // tom médio para as linhas de conexão
    opacLinha:   0.14,
    mouseForca:  80,
    mouseIntens: 0.018,
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
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * CONFIG.velocidade * 2,
      vy:   (Math.random() - 0.5) * CONFIG.velocidade * 2,
      r:    Math.random() * CONFIG.raioMax + 0.7,
      cor:  CORES_OURO[Math.floor(Math.random() * CORES_OURO.length)],
      opac: 0.35 + Math.random() * 0.35,       // 0.35–0.70
      fase: Math.random() * Math.PI * 2,        // fase individual para cintilação
      // Sparkle — brilho intenso aleatório
      sparkleTimer: Math.random() * 300,        // frame de início aleatório
      sparkleAtivo: false,
      sparkleFase:  0,
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

      // Cintilação — fase avança suavemente
      p.fase += 0.016;

      // Sparkle — brilho intenso e aleatório
      p.sparkleTimer -= 1;
      if (p.sparkleTimer <= 0) {
        p.sparkleAtivo = true;
        p.sparkleFase  = 0;
        p.sparkleTimer = 120 + Math.random() * 480; // próximo brilho em 2–8s (60fps)
      }
      if (p.sparkleAtivo) {
        p.sparkleFase += 0.10;
        if (p.sparkleFase >= Math.PI) {
          p.sparkleAtivo = false;
          p.sparkleFase  = 0;
        }
      }

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

    // Pontos com cintilação + sparkle individual
    particulas.forEach(p => {
      const sparkle   = p.sparkleAtivo ? Math.sin(p.sparkleFase) : 0;
      const opacAtual = Math.max(0.15, Math.min(0.85, p.opac + Math.sin(p.fase) * 0.16));
      const raioAtual = p.r + sparkle * 1.2;

      // Partícula base
      ctx.beginPath();
      ctx.arc(p.x, p.y, raioAtual, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.cor}, ${opacAtual})`;
      ctx.fill();

      // Sparkle: núcleo branco-dourado que brilha brevemente — sem halo externo
      if (sparkle > 0.05) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, raioAtual * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 248, 215, ${sparkle * 0.88})`;
        ctx.fill();
      }
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
          ctx.strokeStyle = `rgba(${CONFIG.corLinha}, ${opac})`;
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
      if (entry.isIntersecting) iniciar();
      else pausar();
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

  /* ---- prefers-reduced-motion: frame estático ---- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    desenhar();
  }

})();
