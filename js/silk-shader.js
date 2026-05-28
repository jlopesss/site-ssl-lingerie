// silk-shader.js — SSL Lingerie & Modas
// Fase 2: simulação de tecido de seda em WebGL puro na hero.
// Sem frameworks. GLSL ES 1.0. Fallback CSS automático.

// ══════════════════════════════════════════════════════════════════
// PARÂMETROS — ajuste aqui sem tocar no shader
// (injetados no FRAG via template-literal ${...})
// ══════════════════════════════════════════════════════════════════

// Ondas — amplitude (quanto o tecido se dobra visualmente)
var AMP1 = 0.55;   // onda principal diag  [0.3–0.8]
var AMP2 = 0.35;   // onda secundária      [0.2–0.5]
var AMP3 = 0.22;   // onda terciária       [0.1–0.35]
var AMP4 = 0.12;   // ruído orgânico fbm   [0.05–0.20]

// Ondas — frequência espacial (quanto espaço há entre dobras)
var FREQ1 = 2.2;   // onda 1  [1.5–3.5]
var FREQ2 = 1.6;   // onda 2  [1.0–2.5]
var FREQ3 = 3.4;   // onda 3  [2.5–5.0]

// Ondas — velocidade de animação em rad/s (quanto mais alto, mais rápido)
var T1 = 0.55;     // velocidade onda 1  [1.0–3.0]
var T2 = 0.40;     // velocidade onda 2  [0.8–2.0]
var T3 = 0.28;     // velocidade onda 3  [0.5–1.5]

// Cores do tecido (vec3 linear, formato "R, G, B")
var COR_VALE   = '0.051, 0.106, 0.243';  // #0d1b3e — vales (azul profundo, não preto)
var COR_CRISTA = '0.102, 0.176, 0.361';  // #1a2d5c — cristas (luz nas dobras)

// Especular — reflexo nas cristas (cetim/seda)
var SPEC_POT = 12.0;  // expoente: menor = estria larga, maior = pontual  [8–32]
var SPEC_INT = 0.12;  // intensidade total do reflexo  [0.10–0.40]
var GOLD_LO  = 0.68;  // spec abaixo desse valor → branco azulado
var GOLD_HI  = 0.92;  // spec acima desse valor  → dourado #c9a86a

// Mouse — influência do cursor no tecido
var MOUSE_FORCA = 0.150;  // força do empurrão local  [0.02–0.20]
var MOUSE_RAIO  = 4.0;    // decaimento com distância (maior = área menor)  [3–8]
var LERP_MOUSE  = 0.120;  // suavização JS frame-a-frame  [0.01=lento 0.15=rápido]

// ══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Pré-condições ──────────────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('hero-silk');
  const hero   = document.getElementById('hero');
  if (!canvas || !hero) return;

  // ── Contexto WebGL ─────────────────────────────────────────────
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
  // Parâmetros JS são injetados via ${...} — ver bloco PARÂMETROS no topo.
  // GLSL ES 1.0: sem "const" em funções, sem multi-declaração na mesma linha.
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
        mix(hash(i),                  hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    ) * 2.0 - 1.0;
}
float fbm(vec2 p) {
    return 0.500 * sNoise(p)
         + 0.250 * sNoise(p * 2.10 + vec2(1.7, 9.2))
         + 0.125 * sNoise(p * 4.35 + vec2(8.3, 2.8));
}

// ── Campo de alturas do tecido ────────────────────────────────────
// 3 senoides em direções distintas + fbm orgânico.
// As frequências e velocidades são os parâmetros FREQ/T injetados.
float altura(vec2 uv, float t) {
    float h = 0.0;
    h += ${AMP1.toFixed(3)} * sin(uv.x * ${FREQ1.toFixed(2)} + uv.y * 0.80 + t * ${T1.toFixed(2)});
    h += ${AMP2.toFixed(3)} * sin(uv.x * 0.70 - uv.y * ${FREQ2.toFixed(2)} + t * ${T2.toFixed(2)} + 1.57);
    h += ${AMP3.toFixed(3)} * sin(uv.x * ${FREQ3.toFixed(2)} + uv.y * ${(FREQ3 * 0.6).toFixed(2)} - t * ${T3.toFixed(2)} + 0.80);
    h += ${AMP4.toFixed(3)} * fbm(uv * 1.5 + t * 0.06);
    return h;
}

void main() {
    vec2  uv  = gl_FragCoord.xy / u_res;
    float ar  = u_res.x / u_res.y;

    // UV em espaço de ondas (preserva proporção)
    vec2 wUV = vec2(uv.x * ar, uv.y) * 2.5;
    vec2 mUV = vec2(u_mouse.x * ar, u_mouse.y) * 2.5;

    // Empurrão suave do mouse: desvia UV localmente ao redor do cursor
    vec2  md   = wUV - mUV;
    float mDst = length(md) + 0.001;
    float mPes = exp(-mDst * ${MOUSE_RAIO.toFixed(1)}) * ${MOUSE_FORCA.toFixed(3)};
    vec2  warp = wUV + (md / mDst) * mPes;

    // ── Altura + normal por diferenças finitas ────────────────────
    float eps = 0.008;
    float h   = altura(warp, u_time);
    float hx  = altura(warp + vec2(eps, 0.0), u_time);
    float hy  = altura(warp + vec2(0.0, eps), u_time);

    // Normal aponta para cima, inclinada pela derivada da superfície
    vec3 N = normalize(vec3(
        -(hx - h) / eps * 0.45,
        -(hy - h) / eps * 0.45,
        1.0
    ));

    // ── Cor base: vales escuros → cristas mais claras ─────────────
    // t_h em 0..1; ao quadrado (t_h2) aumenta contraste na zona escura
    float t_h  = clamp(h * 0.5 + 0.5, 0.0, 1.0);
    float t_h2 = t_h * t_h;
    vec3 col = mix(
        vec3(${COR_VALE}),   // vale — sombra entre dobras
        vec3(${COR_CRISTA}), // crista — luz nas dobras
        t_h2
    );

    // ── Especular anisotrópico (modelo Scheuermann — fibras de seda) ─
    // Produz estria de brilho ao longo da fibra, não um ponto redondo.
    vec3  V  = vec3(0.0, 0.0, 1.0);
    vec3  L1 = normalize(vec3(0.50, 0.70, 1.20));
    // Tangente da fibra: levemente modulada pelo tempo para respiro orgânico
    vec3  T  = normalize(vec3(1.0, 0.10 * sin(u_time * 0.10 + warp.y * 0.40), 0.0));

    vec3  H1    = normalize(L1 + V);
    float tH1   = dot(T, H1);
    float aniso = sqrt(max(1.0 - tH1 * tH1, 0.0));
    // spec: intenso onde o normal de superfície aponta para a luz
    float spec  = pow(max(aniso, 0.0), ${SPEC_POT.toFixed(1)})
                * max(dot(N, L1), 0.0);

    // Mistura branco-azulado (reflexo neutro) → dourado (pico de brilho)
    vec3 sWhite = vec3(0.88, 0.93, 1.00);
    vec3 sGold  = vec3(0.788, 0.659, 0.416); // #c9a86a
    vec3 sCol   = mix(sWhite, sGold, smoothstep(${GOLD_LO.toFixed(2)}, ${GOLD_HI.toFixed(2)}, spec));

    // Difusa leve para dar volume sem apagar o azul base
    float diff = max(dot(N, L1), 0.0) * 0.18;
    col = col * (0.72 + diff) + spec * sCol * ${SPEC_INT.toFixed(2)};

    // ── Vinheta ───────────────────────────────────────────────────
    float vR   = length((uv - 0.5) * vec2(0.80, 1.20));
    float vign = 1.0 - smoothstep(0.0, 0.65, vR);
    col *= mix(0.28, 1.0, vign);

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

  // ── Quad fullscreen (TRIANGLE_STRIP) ──────────────────────────
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

  // ── Mouse (apenas desktop com hover real) ─────────────────────
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
    if (ativo  && !rafId) rafId = requestAnimationFrame(desenhar);
    if (!ativo &&  rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }, { threshold: 0.01 }).observe(hero);

  hero.dataset.silk = '1';

})();
