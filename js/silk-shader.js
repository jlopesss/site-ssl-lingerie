// silk-shader.js — SSL Lingerie & Modas
// Fase 2: simulação de tecido de seda em WebGL puro na hero.
// Sem frameworks. GLSL ES 1.0. Fallback CSS automático.

(function () {
  'use strict';

  // ── Pré-condições ──────────────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('hero-silk');
  const hero   = document.getElementById('hero');
  if (!canvas || !hero) return;

  // ── Contexto WebGL ─────────────────────────────────────────────
  // alpha:true → canvas transparente por padrão → fallback CSS visível se shader falhar
  const gl = canvas.getContext('webgl',              { alpha: true, antialias: false })
          || canvas.getContext('experimental-webgl', { alpha: true, antialias: false });
  if (!gl) return;

  // ── Qualidade adaptativa ────────────────────────────────────────
  const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
                || window.innerWidth < 768;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5);

  // ── Vertex shader ──────────────────────────────────────────────
  const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

  // ── Fragment shader ────────────────────────────────────────────
  // Modelo: dobras de cetim azul com specular anisotrópico (fibras de seda)
  // e reflexo dourado nas cristas mais intensas.
  const FRAG = `
precision highp float;

uniform vec2  u_res;    // resolução em px (com DPR)
uniform float u_time;   // segundos desde início
uniform vec2  u_mouse;  // posição normalizada [0,1]; (0.5,0.5) = centro

// ── Value noise ─────────────────────────────────────────────────
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float sNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
        u.y
    ) * 2.0 - 1.0;
}
// fbm 3 oitavas (desdobrado — sem loop variável)
float fbm(vec2 p) {
    return 0.500 * sNoise(p)
         + 0.250 * sNoise(p * 2.10 + vec2(1.7,  9.2))
         + 0.125 * sNoise(p * 4.35 + vec2(8.3,  2.8));
}

// ── Campo de ondas do tecido ─────────────────────────────────────
// Soma de senoidais em direções distintas + fbm orgânico.
// O mouse perturba suavemente o UV por campo de warp radial.
float onda(vec2 uv, float t, vec2 m) {
    vec2  d    = uv - m;
    float dist = length(d) + 0.001;
    uv += (d / dist) * exp(-dist * 2.0) * 0.085;

    float h = 0.0;
    h += 0.45 * sin(uv.x * 2.20 + uv.y * 1.60 + t * 0.32);
    h += 0.25 * sin(uv.x * 1.40 - uv.y * 2.50 + t * 0.48);
    h += 0.14 * sin(uv.x * 3.80 + uv.y * 2.90 - t * 0.22);
    h += 0.08 * sin(uv.y * 0.90 + t * 0.18);
    h += 0.08 * fbm(uv * 1.20 + t * 0.04);
    return h; // intervalo aprox -1..1
}

void main() {
    vec2  uv  = gl_FragCoord.xy / u_res;
    float ar  = u_res.x / u_res.y;
    // Escalamos UV para wave-space (preserva aspecto)
    vec2  wUV = vec2(uv.x * ar, uv.y) * 2.5;
    vec2  mUV = vec2(u_mouse.x * ar, u_mouse.y) * 2.5;

    // ── Altura + normal de superfície (diferenças finitas) ────────
    const float EPS = 0.006;
    float h  = onda(wUV, u_time, mUV);
    float hx = onda(wUV + vec2(EPS, 0.0), u_time, mUV);
    float hy = onda(wUV + vec2(0.0, EPS), u_time, mUV);
    // Escala 0.28 controla inclinação das dobras — menor = mais plano (cetim)
    vec3  N  = normalize(vec3(-(hx - h) / EPS * 0.28,
                              -(hy - h) / EPS * 0.28, 1.0));

    // ── Cor base — 4 azuis da marca por faixa de altura ──────────
    float t_h = clamp((h + 1.0) * 0.5, 0.0, 1.0);
    vec3 c0 = vec3(0.0275, 0.0588, 0.1412); // #070f24 — vale profundo
    vec3 c1 = vec3(0.0392, 0.0784, 0.1882); // #0a1430
    vec3 c2 = vec3(0.0510, 0.1059, 0.2431); // #0d1b3e
    vec3 c3 = vec3(0.0863, 0.1490, 0.3098); // #16264f — crista
    vec3 base;
    if      (t_h < 0.33) base = mix(c0, c1, t_h / 0.33);
    else if (t_h < 0.66) base = mix(c1, c2, (t_h - 0.33) / 0.33);
    else                 base = mix(c2, c3, (t_h - 0.66) / 0.34);

    // ── Especular anisotrópico (fibras de seda / cetim) ───────────
    // Modelo Scheuermann: spec = sin(ângulo entre fibra e half-vector)^n
    // Produz estria de brilho perpendicular à fibra — distinto de água/plástico.
    vec3 V  = vec3(0.0, 0.0, 1.0);
    vec3 L1 = normalize(vec3( 0.50,  0.75, 1.20)); // luz principal (alto-direita)
    vec3 L2 = normalize(vec3(-0.70, -0.30, 1.00)); // preenchimento (baixo-esquerda)

    // Tangente da fibra — ligeiramente modulada pelo tempo para respiro orgânico
    vec3 T  = normalize(vec3(1.0, 0.06 * sin(u_time * 0.12 + wUV.y * 0.50), 0.0));

    // Specular 1 — luz principal, n=52 (estreito como cetim)
    vec3  H1    = normalize(L1 + V);
    float tH1   = dot(T, H1);
    float spec1 = pow(max(sqrt(max(1.0 - tH1 * tH1, 0.0)), 0.0), 52.0)
                * max(dot(N, L1), 0.0);

    // Specular 2 — preenchimento, n=20 (mais difuso)
    vec3  H2    = normalize(L2 + V);
    float tH2   = dot(T, H2);
    float spec2 = pow(max(sqrt(max(1.0 - tH2 * tH2, 0.0)), 0.0), 20.0)
                * max(dot(N, L2), 0.0) * 0.30;

    // Gradiente branco → dourado nos picos mais intensos
    vec3 sWhite = vec3(0.88, 0.93, 1.00);
    vec3 sGold  = vec3(0.784, 0.627, 0.220); // #c8a038
    vec3 sCol1  = mix(sWhite, sGold, smoothstep(0.08, 0.68, spec1));

    float diff1 = max(dot(N, L1), 0.0) * 0.22;
    float diff2 = max(dot(N, L2), 0.0) * 0.08;

    vec3 color = base  * (0.62 + diff1 + diff2)
               + spec1 * sCol1  * 0.80
               + spec2 * sWhite * 0.18;

    // ── Vinheta (bordas mais escuras = profundidade + legibilidade) ─
    float vR   = length((uv - 0.5) * vec2(0.80, 1.20));
    float vign = 1.0 - smoothstep(0.0, 0.65, vR);
    color     *= mix(0.35, 1.0, vign);

    gl_FragColor = vec4(color, 1.0);
}`;

  // ── Compilar shader ────────────────────────────────────────────
  function compilar(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[ssl-silk]', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compilar(gl.VERTEX_SHADER,   VERT);
  const fs = compilar(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[ssl-silk]', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // ── Quad fullscreen (dois triângulos em TRIANGLE_STRIP) ────────
  const vBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1]),
    gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uTime  = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  // ── Redimensionar canvas ───────────────────────────────────────
  function redimensionar() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    canvas.width  = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  redimensionar();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redimensionar, 120);
  }, { passive: true });

  // ── Mouse (apenas desktop com hover) ───────────────────────────
  let mX = 0.5, mY = 0.5, mTX = 0.5, mTY = 0.5;
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      mTX = (e.clientX - r.left)  / r.width;
      mTY = 1.0 - (e.clientY - r.top) / r.height;
    }, { passive: true });
  }

  // ── Loop de animação ────────────────────────────────────────────
  let rafId = null, ativo = false;
  const LERP = 0.04;

  function desenhar(agora) {
    rafId = null;
    if (!ativo) return;

    // Lerp para suavizar movimento do mouse
    mX += (mTX - mX) * LERP;
    mY += (mTY - mY) * LERP;

    gl.uniform1f(uTime,  agora * 0.001);
    gl.uniform2f(uMouse, mX, mY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    rafId = requestAnimationFrame(desenhar);
  }

  // ── IntersectionObserver — pausa fora da viewport ───────────────
  new IntersectionObserver(entries => {
    ativo = entries[0].isIntersecting;
    if (ativo && !rafId)  rafId = requestAnimationFrame(desenhar);
    if (!ativo && rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }, { threshold: 0.01 }).observe(hero);

  // Sinaliza que o shader está ativo (útil para debug / CSS)
  hero.dataset.silk = '1';

})();
