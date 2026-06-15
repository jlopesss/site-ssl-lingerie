// silk-shader.js — SSL Lingerie & Modas
// Fase 2: simulação de tecido de seda em WebGL puro na hero.
// Sem frameworks. GLSL ES 1.0. Fallback CSS automático.

// ══════════════════════════════════════════════════════════════════
// PARÂMETROS — ajuste aqui sem tocar no shader
// (injetados no GLSL via template-literal ${...})
// ══════════════════════════════════════════════════════════════════

// Onda 1 — diagonal suave (dominant fold)
var AMP_ONDA_1   = 0.55;   // amplitude  [0.3–0.8]
var FREQ_ONDA_1  = 3.5;    // freq espacial  [2–8]
var DIR_ONDA_1   = [1.0,  0.3];  // direção (será normalizada)
var VEL_ONDA_1   = 0.35;   // velocidade rad/s  [0.2–0.8]

// Onda 2 — cruza a 1 em ângulo diferente
var AMP_ONDA_2   = 0.35;
var FREQ_ONDA_2  = 5.0;
var DIR_ONDA_2   = [-0.6, 1.0];
var VEL_ONDA_2   = 0.28;

// Onda 3 — vincos mais finos
var AMP_ONDA_3   = 0.22;
var FREQ_ONDA_3  = 7.0;
var DIR_ONDA_3   = [0.8, -0.5];
var VEL_ONDA_3   = 0.45;

// Noise orgânico — detalhe APENAS, manter baixo
var PESO_NOISE   = 0.15;   // [0.05–0.20] — acima disso vira ruído de TV
var FREQ_NOISE   = 2.5;    // [1.0–3.0]   — acima de 3 começa a granular

// Velocidade global (multiplica todos os VEL_ONDA_*)
var VELOCIDADE_TEMPO = 0.7;   // [0.5–2.0]

// Cores
var COR_VALE     = '0.039, 0.075, 0.180';  // #0a1330 — sombra entre dobras
var COR_CRISTA   = '0.075, 0.133, 0.275';  // #122246 — cume das dobras
var COR_SPECULAR = '0.788, 0.659, 0.416';  // #c9a86a — brilho dourado

// Specular (reflexo nas cristas)
var SPEC_INTENSIDADE = 0.20;  // [0.10–0.35]
var SPEC_EXPOENTE    = 14.0;  // [8–24] — maior = brilho mais pontual

// Mouse — perturba a fase das ondas localmente
var INTENSIDADE_MOUSE = 1.0;   // força da perturbação  [0.5–2.0]
var LERP_MOUSE        = 0.12;  // suavização JS  [0.02=lento 0.15=rápido]

// ══════════════════════════════════════════════════════════════════

// Normaliza vetor de direção em JS e retorna string "x.xxxx, y.yyyy"
function norm2(v) {
  var len = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
  return (v[0]/len).toFixed(4) + ', ' + (v[1]/len).toFixed(4);
}

(function () {
  'use strict';

  function init() {

  // ── Pré-condições ──────────────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.getElementById('hero-silk');
  var hero   = document.getElementById('hero');
  if (!canvas || !hero) return;

  // ── Contexto WebGL ─────────────────────────────────────────────
  var gl = canvas.getContext('webgl',              { alpha: true, antialias: false })
        || canvas.getContext('experimental-webgl', { alpha: true, antialias: false });
  if (!gl) return;

  // ── Qualidade adaptativa ────────────────────────────────────────
  var isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
              || window.innerWidth < 768;
  var DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5);

  // ── Vertex shader ──────────────────────────────────────────────
  var VERT = `attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

  // ── Fragment shader ────────────────────────────────────────────
  // Arquitetura:
  //   altura(p, t) = Σ ondas senoidais direcionais + noise de baixa freq
  //   cor = mix(COR_VALE, COR_CRISTA, smoothstep(altura))  ← cor vem da altura
  //   spec = pow(dot(normal, luz), EXP) × só nas cristas
  //   mouse = perturba fase das ondas localmente (tLocal = t + infl*1.5)
  var FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;

// Value noise — 1 oitava apenas; noise é tempero, não base
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i),                  hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// Soma de 3 ondas senoidais direcionais + noise leve
// ESTAS ONDAS criam as "cordilheiras" visíveis que fazem parecer tecido.
// O noise é só organicidade — peso baixo, freq baixa.
float altura(vec2 p, float t) {
    float h = 0.0;
    h += ${AMP_ONDA_1.toFixed(3)} * sin(dot(p, vec2(${norm2(DIR_ONDA_1)})) * ${FREQ_ONDA_1.toFixed(2)} + t * ${VEL_ONDA_1.toFixed(2)});
    h += ${AMP_ONDA_2.toFixed(3)} * sin(dot(p, vec2(${norm2(DIR_ONDA_2)})) * ${FREQ_ONDA_2.toFixed(2)} + t * ${VEL_ONDA_2.toFixed(2)});
    h += ${AMP_ONDA_3.toFixed(3)} * sin(dot(p, vec2(${norm2(DIR_ONDA_3)})) * ${FREQ_ONDA_3.toFixed(2)} - t * ${VEL_ONDA_3.toFixed(2)});
    h += ${PESO_NOISE.toFixed(3)} * (vnoise(p * ${FREQ_NOISE.toFixed(2)} + t * 0.10) - 0.5);
    return h;
}

void main() {
    vec2  uv = gl_FragCoord.xy / u_res;
    float ar = u_res.x / u_res.y;

    // p: espaço de ondas com proporção correta (não estica as ondas)
    vec2 p   = vec2(uv.x * ar, uv.y);
    vec2 mUV = vec2(u_mouse.x * ar, u_mouse.y);

    // Mouse: perturbação de fase local — "carícia" nas ondas existentes
    float dM   = distance(p, mUV);
    float infl = smoothstep(0.40, 0.0, dM) * ${INTENSIDADE_MOUSE.toFixed(2)};
    float tL   = u_time * ${VELOCIDADE_TEMPO.toFixed(2)} + infl * 1.5;

    // ── Altura → normalizada 0..1 ─────────────────────────────────
    float h  = altura(p, tL);
    float hN = clamp((h + 1.1) / 2.2, 0.0, 1.0);

    // ── Cor base: vales escuros → cristas claras (modulada por hN) ─
    // É a altura que determina a cor — não o noise diretamente.
    vec3 cor = mix(
        vec3(${COR_VALE}),
        vec3(${COR_CRISTA}),
        smoothstep(0.25, 0.75, hN)
    );

    // ── Specular nas cristas por diferenças finitas ───────────────
    // Normal da superfície calculada pelo gradiente de altura.
    float eps = 0.005;
    float hx  = altura(p + vec2(eps, 0.0), tL) - altura(p - vec2(eps, 0.0), tL);
    float hy  = altura(p + vec2(0.0, eps), tL) - altura(p - vec2(0.0, eps), tL);
    vec3  nm  = normalize(vec3(-hx, -hy, 0.02));
    vec3  luz = normalize(vec3(0.3, -0.6, 0.7));
    float spec = pow(max(dot(nm, luz), 0.0), ${SPEC_EXPOENTE.toFixed(1)});
    // Limita o specular às cristas (hN alto) — não aparece nos vales
    spec *= smoothstep(0.55, 0.85, hN);
    cor  += vec3(${COR_SPECULAR}) * spec * ${SPEC_INTENSIDADE.toFixed(2)};

    // ── Vinheta — centro luminoso para legibilidade do texto ──────
    vec2  cv  = uv - 0.5;
    float vin = 1.0 - smoothstep(0.30, 0.85, length(cv));
    cor *= mix(0.65, 1.0, vin);

    gl_FragColor = vec4(cor, 1.0);
}`;

  // ── Compilar shader ────────────────────────────────────────────
  function compilar(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[ssl-silk]', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compilar(gl.VERTEX_SHADER,   VERT);
  var fs = compilar(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[ssl-silk]', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // ── Quad fullscreen (TRIANGLE_STRIP) ──────────────────────────
  var vBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
    gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes   = gl.getUniformLocation(prog, 'u_res');
  var uTime  = gl.getUniformLocation(prog, 'u_time');
  var uMouse = gl.getUniformLocation(prog, 'u_mouse');

  // ── Redimensionar canvas ───────────────────────────────────────
  function redimensionar() {
    var w = hero.clientWidth;
    var h = hero.clientHeight;
    canvas.width  = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  redimensionar();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redimensionar, 120);
  }, { passive: true });

  // ── Mouse (apenas desktop com hover real) ─────────────────────
  var mX = 0.5, mY = 0.5, mTX = 0.5, mTY = 0.5;
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mTX = (e.clientX - r.left)  / r.width;
      mTY = 1.0 - (e.clientY - r.top) / r.height;
    }, { passive: true });
  }

  // ── Loop de animação ────────────────────────────────────────────
  var rafId = null, ativo = false;

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
  new IntersectionObserver(function (entries) {
    ativo = entries[0].isIntersecting;
    if (ativo  && !rafId) rafId = requestAnimationFrame(desenhar);
    if (!ativo &&  rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }, { threshold: 0.01 }).observe(hero);

  hero.dataset.silk = '1';

  } // fim init

  // Compilação GLSL é pesada — cede a thread antes de inicializar o WebGL
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(init, { timeout: 2000 });
  } else {
    setTimeout(init, 0);
  }

})();
