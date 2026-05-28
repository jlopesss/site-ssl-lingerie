// silk-shader.js — SSL Lingerie & Modas
// Fase 2: simulação de tecido de seda em WebGL puro na hero.
// Sem frameworks. GLSL ES 1.0. Fallback CSS automático.

// ── PARÂMETROS (calibrar aqui) ─────────────────────────────────────────────
//
//  COR BASE DO TECIDO
//    AZUL_VALE   = cor no fundo das dobras  (vec3 linear, inserida no FRAG)
//    AZUL_CRISTA = cor no topo das dobras   (vec3 linear, inserida no FRAG)
//
//  ESPECULAR (reflexo nas cristas — dourado sutil)
//    SPEC1_POT   = shininess luz principal (maior = estria mais estreita)
//    SPEC1_INT   = intensidade especular principal   [0–1, recomendado: 0.18]
//    SPEC2_INT   = intensidade especular preenchimento [0–1, recomendado: 0.08]
//    GOLD_LO     = spec1 abaixo → branco puro
//    GOLD_HI     = spec1 acima → totalmente dourado
//
//  MOUSE
//    MOUSE_FORCA = deslocamento UV máximo do cursor  [recomendado: 0.018]
//    MOUSE_RAIO  = decaimento da influência (maior = raio menor) [recomendado: 6.0]
//    LERP_MOUSE  = suavização JS frame-a-frame  [0.01=lento, 0.05=médio]
//
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Parâmetros ajustáveis ──────────────────────────────────────
  // (injetados no FRAG via template-literal ${...} ou usados no JS)

  // Mouse — influência do cursor no tecido
  var MOUSE_FORCA = 0.018;   // deslocamento UV máximo  [0.01–0.04]
  var MOUSE_RAIO  = 6.0;    // decaimento com distância (maior = raio menor) [4–10]
  var LERP_MOUSE  = 0.015;  // suavização JS frame-a-frame  [0.01=lento 0.05=rápido]

  // Especular — reflexos nas cristas das dobras
  var SPEC1_POT  = 64.0;   // shininess luz principal  (maior = estria mais estreita)
  var SPEC1_INT  = 0.20;   // intensidade especular principal   [0.10–0.35]
  var SPEC2_INT  = 0.08;   // intensidade especular preenchimento [0.03–0.12]
  var GOLD_LO    = 0.45;   // spec1 abaixo → branco (sem dourado)
  var GOLD_HI    = 0.82;   // spec1 acima  → totalmente dourado

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
  // Fixes GLSL ES 1.0: sem "const" em funções, sem declarações múltiplas na mesma linha.
  const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;

// ── Value noise (GLSL ES 1.0 seguro) ─────────────────────────────
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float sNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i),                hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    ) * 2.0 - 1.0;
}
float fbm(vec2 p) {
    return 0.500 * sNoise(p)
         + 0.250 * sNoise(p * 2.1  + vec2(1.7, 9.2))
         + 0.125 * sNoise(p * 4.35 + vec2(8.3, 2.8));
}

// ── Campo de ondas do tecido ──────────────────────────────────────
float onda(vec2 uv, float t, vec2 m) {
    vec2  d    = uv - m;
    float dist = length(d) + 0.001;
    // Empurrão suave: decaimento rápido (MOUSE_RAIO) + força baixa (MOUSE_FORCA)
    float peso = exp(-dist * ${MOUSE_RAIO.toFixed(1)}) * ${MOUSE_FORCA.toFixed(3)};
    uv += (d / dist) * peso;
    float h = 0.0;
    h += 0.48 * sin(uv.x * 2.2  + uv.y * 1.6  + t * 0.32);
    h += 0.28 * sin(uv.x * 1.4  - uv.y * 2.5  + t * 0.48);
    h += 0.16 * sin(uv.x * 3.8  + uv.y * 2.9  - t * 0.22);
    h += 0.08 * fbm(uv * 1.2 + t * 0.04);
    return h;
}

void main() {
    vec2  uv  = gl_FragCoord.xy / u_res;
    float ar  = u_res.x / u_res.y;
    vec2  wUV = vec2(uv.x * ar, uv.y) * 2.5;
    vec2  mUV = vec2(u_mouse.x * ar, u_mouse.y) * 2.5;

    // ── Normal de superfície (diferenças finitas) ─────────────────
    float eps = 0.006;
    float h   = onda(wUV, u_time, mUV);
    float hx  = onda(wUV + vec2(eps, 0.0), u_time, mUV);
    float hy  = onda(wUV + vec2(0.0, eps), u_time, mUV);
    vec3  N   = normalize(vec3(-(hx - h) / eps * 0.32,
                               -(hy - h) / eps * 0.32, 1.0));

    // ── Cor base: azuis da marca por altura ───────────────────────
    float t_h = clamp((h + 1.0) * 0.5, 0.0, 1.0);
    vec3  col = mix(
        vec3(0.027, 0.059, 0.141),   // #070f24 — vale profundo
        vec3(0.086, 0.149, 0.310),   // #16264f — crista clara
        t_h
    );

    // ── Especular anisotrópico (fibra de seda — modelo Scheuermann) ─
    // Produz estria de brilho perpendicular à fibra, não um ponto.
    vec3  V   = vec3(0.0, 0.0, 1.0);
    vec3  L1  = normalize(vec3( 0.5,  0.7, 1.2));
    vec3  L2  = normalize(vec3(-0.6, -0.4, 1.0));
    vec3  T   = normalize(vec3(1.0, 0.08 * sin(u_time * 0.12 + wUV.y * 0.5), 0.0));

    vec3  H1    = normalize(L1 + V);
    float tH1   = dot(T, H1);
    float aniso1 = sqrt(max(1.0 - tH1 * tH1, 0.0));
    float spec1  = pow(max(aniso1, 0.0), ${SPEC1_POT.toFixed(1)}) * max(dot(N, L1), 0.0);

    vec3  H2    = normalize(L2 + V);
    float tH2   = dot(T, H2);
    float aniso2 = sqrt(max(1.0 - tH2 * tH2, 0.0));
    float spec2  = pow(max(aniso2, 0.0), ${(SPEC1_POT * 0.5).toFixed(1)}) * max(dot(N, L2), 0.0);

    // Branco-azulado nos reflexos baixos, dourado apenas nos picos intensos
    vec3 sWhite = vec3(0.88, 0.92, 1.00);
    vec3 sGold  = vec3(0.784, 0.627, 0.220);
    vec3 sCol1  = mix(sWhite, sGold, smoothstep(${GOLD_LO.toFixed(2)}, ${GOLD_HI.toFixed(2)}, spec1));

    float diff = max(dot(N, L1), 0.0) * 0.20;
    col = col * (0.65 + diff)
        + spec1 * sCol1  * ${SPEC1_INT.toFixed(2)}
        + spec2 * sWhite * ${SPEC2_INT.toFixed(2)};

    // ── Vinheta ───────────────────────────────────────────────────
    float vR   = length((uv - 0.5) * vec2(0.80, 1.20));
    float vign = 1.0 - smoothstep(0.0, 0.65, vR);
    col *= mix(0.35, 1.0, vign);

    gl_FragColor = vec4(col, 1.0);
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

  function desenhar(agora) {
    rafId = null;
    if (!ativo) return;

    mX += (mTX - mX) * LERP_MOUSE;
    mY += (mTY - mY) * LERP_MOUSE;

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
