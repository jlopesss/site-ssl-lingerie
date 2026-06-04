# CLAUDE.md — SSL Lingerie & Modas

## Skills instaladas (frontend / UX)
Há skills de frontend e UX instaladas — use-as para a QUALIDADE TÉCNICA: hierarquia visual, espaçamento, acessibilidade, responsividade, performance, semântica. Elas cuidam do "COMO fazer bem".

Porém, a VISÃO da marca tem prioridade sobre defaults genéricos das skills. Este projeto é intencionalmente dramático, escuro, ornamentado e artístico (estilo editorial "Bold and Blush") — NÃO minimalista/clean genérico. Se uma boa prática de UX entrar em conflito com a estética definida no planejamento, siga o planejamento e me avise do trade-off (ex.: contraste do dourado sobre azul — ajuste o tom em vez de abandonar a paleta).

Resumo: skills = COMO (excelência técnica). CLAUDE.md + planejamento + copy = O QUÊ (a visão da SSL). Em conflito, a visão da SSL vence, mas sem sacrificar acessibilidade e performance — busque a solução que atende aos dois.

## Sobre este projeto
Site institucional/conceitual de luxo para a **SSL Lingerie & Modas** (loja de lingerie e moda em Icaraí, Niterói — RJ).
**NÃO é e-commerce** — é uma experiência de apresentação de marca, no estilo "obra de arte moderna interativa".

➡️ **Antes de qualquer coisa, leia o arquivo `PLANEJAMENTO_SSL_LINGERIE.md` por completo.** Ele contém todo o conceito, design system, paleta, tipografia, estrutura de seções e a estrutura de arquivos. Esse documento é a fonte da verdade — siga-o.

## Stack
- HTML + CSS + JavaScript puro (vanilla). Pode usar Canvas para as partículas.
- **Sem frameworks** (sem React, sem build tools pesadas). 
- Hospedagem final: **Vercel** (site estático).

## ⚠️ REGRA INEGOCIÁVEL: arquivos separados desde o início
- **NUNCA** colocar CSS dentro de `<style>` no HTML, nem JS dentro de `<script>` inline no HTML.
- HTML, CSS e JS ficam SEMPRE em arquivos separados, na estrutura definida no planejamento.
- O `index.html` só referencia os arquivos externos: `<link rel="stylesheet" href="css/...">` e `<script src="js/..." defer>`.
- O CSS é dividido em vários arquivos (reset, variables, style, animations) — não um único arquivo gigante.
- O JS é modular (main, scroll, particles, svg-draw, parallax) — cada responsabilidade em seu arquivo.
- Isso vale desde o primeiro commit. Nada de "depois eu separo".

## Conceito visual (resumo — detalhes no planejamento)
- Editorial multi-seção, **escuro e dramático**, inspirado no branding "Bold and Blush".
- Camada de **arte SVG animada no fundo**: linhas douradas que se desenham, padrão de corações/arabescos, formas geométricas, partículas conectadas.
- Nível tech **equilibrado**: movimento sutil e elegante, nunca exagerado.
- **Predominância de seções escuras**; a seção de Contato é clara (respiro).

## Paleta (CSS variables)
- Azuis escuros: `#070f24` (base), `#0a1430`, `#0d1b3e`, `#16264f`
- Preto: `#000000` (seção dramática)
- Dourado base: `#c8a038` (variável `--dourado`) — âmbar-ouro quente. **Nunca usar como cor sólida em textos visíveis.**
- Dourado claro: `#e0b850` (`--dourado-claro`), Dourado escuro: `#a07e1e` (`--dourado-escuro`)
- Claros: `#f4f1ea` (off-white), `#e8dfc8` (creme-marfim — seção Contato), `#ffffff`

### Paleta extra — fundo ouro polido (não tokenizada, use diretamente)
Usada em `.contato` e `.universo__painel--dourado`. Cores validadas em revisão:
- `#f8eecc` — champanhe quente (highlight; substitui amarelos saturados)
- `#d4a030` — âmbar rico (meio-tom dominante)
- `#9a6c18` — âmbar profundo (sulco/sombra; dá profundidade sem escurecer demais)
- `#6a4a18` — âmbar-terra (stroke dos ornamentos botânicos `.svg-org`, opacity 0.11)

**Não usar** `#e8c458` / `#f5e098` / `#e0b840` nesses fundos — leem como amarelo plástico.

### Token adicionado em variables.css
- `--peso-bold: 700` — adicionado após `--peso-semi: 600` na seção Pesos.

## ⚠️ REGRA: Dourado é sempre metálico, nunca cor sólida plana

**Em textos e labels dourados visíveis:**
```css
background: var(--gradiente-dourado);   /* definido em variables.css */
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```
O gradiente vai de creme-ouro nos cantos (`#f0df98` em 0% e 100%) para âmbar-profundo no centro (`#9e7c38` em 50%) — simula metal polido.

**Em fundos dourados grandes** (seções/painéis): usar o padrão de 4 camadas validado — ver seção "Fundo ouro polido metálico" abaixo. Não usar gradiente simples de um único ângulo.

**Em bordas/filetes**: usar `border-image: linear-gradient(...) 1` ou pseudo-elemento.

**Exceções permitidas** (cor sólida `--dourado` está OK):
- Bordas e box-shadow/glow
- Ícones SVG via `fill/stroke` ou `currentColor`
- Elementos muito pequenos onde o gradiente não é percebido

## Fundo ouro polido metálico

Técnica validada para `.contato` e `.universo__painel--dourado`. Empilha 4 camadas de background + pseudo-elemento de grão:

```css
background:
  /* 1 — Highlight especular off-center */
  radial-gradient(ellipse 70% 55% at 30% 25%,
    rgba(248, 238, 204, 0.65) 0%, transparent 45%),
  /* 2 — Vinheta (profundidade nas bordas) */
  radial-gradient(ellipse 90% 80% at 50% 50%,
    transparent 38%, rgba(140, 90, 28, 0.18) 100%),
  /* 3 — Interferência tonal (ângulo cruzado — lê como metal escovado) */
  linear-gradient(38deg,
    rgba(248,238,204,0.30)  0%, rgba(180,128,28,0.45) 40%,
    rgba(248,238,204,0.20) 70%, rgba(154,108,24,0.38) 100%),
  /* 4 — Base: highlights champanhe + âmbar rico */
  linear-gradient(135deg,
    #f8eecc  0%, #d4a030 18%, #9a6c18 36%,
    #d4a030 52%, #9a6c18 66%, #d4a030 82%, #f8eecc 100%);
```

**Grão fino** via `::after` (abaixo do conteúdo — `z-index: 0`; conteúdo deve ter `z-index: 1`):
```css
::after {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 192px 192px;
  opacity: 0.10–0.12;
  mix-blend-mode: overlay;
}
```

**Ornamentos botânicos** (`.svg-org`) sobre fundo ouro: `stroke: #6a4a18; opacity: 0.11`.

**Para neutralizar o hover azul** de `.universo__painel:hover` no painel dourado:
```css
.universo__painel--dourado:hover { background-color: transparent; }
```

## Efeitos visuais implementados

### Shimmer (faixa de luz varrendo da esquerda → direita)
- **`lingerie & modas` (hero)**: dois layers de `background` — layer 1 é a faixa branca animada com `background-size: 200% / background-position`, layer 2 é o gradiente metálico estático. Animação `shimmer-script` (9s, ease-in-out, sweep nos primeiros 35%).
- **Ornamento "A Marca"**: `::after` pseudo-elemento com `background-position` animada. Animação `shimmer-svg-brilho` (9s, 1.5s delay).
- Keyframes em `css/animations.css`. Ambos desativados em `prefers-reduced-motion`.

### Glow (emissão de luz dourada)
- **SSL (hero)**: `text-shadow` em 4 camadas (18 / 55 / 120 / 260px blur) — parece emitir luz.
- **Ornamento "A Filosofia"**: `filter: drop-shadow` duplo (8px + 22px).
- **Formas geométricas "O Detalhe"**: `filter: drop-shadow(0 0 16px rgba(200,160,56,0.65))` no `.drama__arte-geo`.

### Partículas ("O Detalhe" — `js/particles.js`)
- Array `CORES_OURO` com 8 tons do gradiente metálico (âmbar escuro → creme-ouro).
- Cada partícula recebe cor e opacidade aleatórias; `fase` individual para cintilação suave via `sin()`.
- Linhas de conexão em tom médio `rgba(200, 164, 88, opac)`.

## Tipografia
- Display serifada: **Cormorant Garamond** (títulos grandes)
- Script cursiva: **Tangerine** ou **Great Vibes** (wordmark, frases-assinatura — usar com parcimônia)
- Sans: **Jost** ou **Montserrat** (corpo, labels em CAIXA ALTA com letter-spacing)

## Dados reais da marca
- Endereço: R. Gavião Peixoto, 117 — Sobreloja 01, Icaraí, Niterói — RJ
- WhatsApp (ação principal): https://wa.me/5521982059599
- Instagram (secundário): https://instagram.com/ssl.lingerie
- Manifesto: "Lingerie é a moldura e o corpo é a arte que ela abraça."

## Regras de trabalho
- **Mobile-first.** Atenção a performance no celular (simplificar/pausar animações pesadas).
- Respeitar `prefers-reduced-motion` (desligar animações para quem prefere).
- Construir **uma seção de cada vez**, e me deixar revisar no navegador antes de avançar.
- Imagens em `webp` com `loading="lazy"`. Fontes `woff2` com `font-display: swap`.
- Pausar animações Canvas/SVG fora da viewport (IntersectionObserver).
- HTML semântico, foco visível, contraste testado (dourado sobre azul).
- Os textos definitivos (copy) estão no arquivo `COPY_SSL_LINGERIE.md` — usar esses textos nas seções correspondentes. Onde houver opções (A/B/C), usar a opção A por padrão, salvo indicação contrária.
- Logo: arquivos SVG em `assets/logo/` (dourado, branco, azul). Refinar se necessário.

## Como rodar localmente
Site estático: basta abrir `index.html` no navegador, ou rodar um servidor simples:
```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```
