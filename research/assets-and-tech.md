# Pyrefly Reprise — Assets & Tech Survey

**Scope:** fonts, HD-2D rendering recipes in Three.js, an LLM-authorable pixel-sprite pipeline, original music/SFX synthesis, Playwright + Vitest testing, GitHub Pages deployment, and a legal-assets inventory.

**Audience:** implementation agents. Everything here is meant to be copied, pinned, and executed. Nothing here requires playing the games.

**Research date:** 2026-09-15. All npm versions were read directly from `registry.npmjs.org` dist-tags on that date.

**Prior research:** `D:/Final Fantasy/research/` was empty at the time of first writing. It now holds ten documents; this one cross-references `visual-bible.md` (art and UI), `ffx-combat-core.md` and `ffx2-combat-core.md` (mechanics), and the five per-encounter documents. **Where this document and `visual-bible.md` disagreed, the disagreements are now resolved in place and each resolution is tagged `[CONFLICT RESOLVED]`** — see §2.7, §2.13a, §3.5 and §3.5a, and the gap-fill log at the end.

---

## 0. Legal ground rules (read first — this constrains everything below)

| Rule | Detail |
|---|---|
| **No ripped retail assets, ever** | Do not extract, convert, decompile, or include any texture, sprite, model, font file, sound effect, voice clip, or music from *Final Fantasy X*, *X-2*, the HD Remaster, or any Square Enix product — not in `public/`, not in `src/`, not in git history, not in the downloadable zip. This includes "reference" copies committed "temporarily". |
| **No retail font files** | The FFX/X-2 UI typefaces are licensed commercial/custom faces. Use an OFL/CC0 lookalike (§1). |
| **No melodies** | Do not transcribe, quote, approximate, or "reharmonize" any melody, bassline, or distinctive motif from the FFX/X-2 soundtracks. See §4.7 for the hard rules. |
| **Names and mechanics** | Character names, ability names, and mechanics are used as a non-commercial fan tribute; the README already carries the disclaimer. Keep the project non-commercial and unmonetized. |
| **`.gitignore` already handles it** | `public/assets/hifi/` is gitignored as a local-only drop-in. Nothing in that directory may ever be referenced by committed code paths that ship — treat it as strictly optional local enhancement and make the game fully playable without it. |
| **Attribution file** | Ship `public/CREDITS.md` (and link it from the title screen) listing every third-party font/SFX with license and URL. CC0 needs no attribution but list it anyway. |

---

## 1. Fonts

### 1.1 What the real games use (and why we can't match it exactly)

There is **no public identification of the FFX or FFX-2 UI typefaces.** Two dedicated font-ID threads (dafont forum, GameFAQs) ran without reaching a conclusion; the dafont thread ended with no font name proposed at all. [verified: 2 sources — dafont forum 273501, GameFAQs 643146/68353036]

Documented facts we *can* rely on:

| Fact | Confidence |
|---|---|
| The HD Remaster replaced the PS2 in-game typeface with a new one (a widely disliked change, repeatedly complained about on the official boards) | [verified: 2 sources — GameFAQs 643146/68353036, 102484/72062036] |
| The FFX PS2 menu/subtitle face is a semi-condensed humanist sans with squared-off terminals, no identified commercial origin | [estimate] |
| The FFX-2 UI face is wider, rounder and more "techno-pop", with squared bowls — the Eurostile/Microgramma family sits in the same visual territory | [estimate] |
| Eurostile is a direct descendant/expansion of Microgramma (adds lowercase + weights); Bank Gothic is visually adjacent | [verified: 2 sources — Wikipedia Eurostile, Wikipedia Microgramma] |

**Implication for implementation:** do not chase a match. Pick OFL faces that read *in the same register* and commit to them as the game's own identity. Below are the picks.

### 1.2 Recommended font stack (all SIL OFL 1.1 unless noted)

| Role | Font | License | Google Fonts | Upstream repo / site | npm (self-host) |
|---|---|---|---|---|---|
| **Primary UI / menus / dialogue** (FFX register) | **Exo 2** | OFL 1.1 [verified: 2 sources] | `fonts.google.com/specimen/Exo+2` | `github.com/googlefonts/Exo-2.0` | `@fontsource-variable/exo-2` |
| Alt primary (softer, more humanist) | **Titillium Web** | OFL 1.1 [single source] | `fonts.google.com/specimen/Titillium+Web` | `github.com/google/fonts/tree/main/ofl/titilliumweb` | `@fontsource/titillium-web` |
| **FFX-2 UI / dressphere menus** (techno, wide, squared) | **Chakra Petch** | OFL 1.1 [verified: 2 sources] | `fonts.google.com/specimen/Chakra+Petch` | `github.com/google/fonts/tree/main/ofl/chakrapetch` | `@fontsource/chakra-petch` |
| Alt FFX-2 (squarer, tighter, good at small sizes) | **Oxanium** | OFL 1.1 [single source] | `fonts.google.com/specimen/Oxanium` | `github.com/google/fonts/tree/main/ofl/oxanium` | `@fontsource/oxanium` |
| FFX-2 display headers only (very wide, all-caps) | **Michroma** | OFL 1.1 [single source] | `fonts.google.com/specimen/Michroma` | `github.com/google/fonts/tree/main/ofl/michroma` | `@fontsource/michroma` |
| Condensed numerals / HP+MP bars / stat readouts | **Rajdhani** | OFL 1.1 [single source] | `fonts.google.com/specimen/Rajdhani` | `github.com/google/fonts/tree/main/ofl/rajdhani` | `@fontsource/rajdhani` |
| **Damage numbers** (heavy, squared, has true italic) | **Chakra Petch Bold Italic** (700 italic) | OFL 1.1 [verified: 2 sources] | same as above | same | `@fontsource/chakra-petch/700-italic.css` |
| Damage numbers, chunkier alternative | **Russo One** | OFL 1.1 [single source] | `fonts.google.com/specimen/Russo+One` | `github.com/google/fonts/tree/main/ofl/russoone` | `@fontsource/russo-one` |
| **Pixel font — small UI, tooltips, debug HUD** | **Silkscreen** (Jason Kottke, 2001) | OFL 1.1 [verified: 2 sources] | `fonts.google.com/specimen/Silkscreen` | `github.com/googlefonts/silkscreen` | `@fontsource/silkscreen` |
| Pixel font — arcade/title flavour | **Press Start 2P** | OFL 1.1 [verified: 2 sources] | `fonts.google.com/specimen/Press+Start+2P` | `github.com/codeman38/PressStart2P` | `@fontsource/press-start-2p` |
| Pixel font — display, has real lowercase + weights | **Pixelify Sans** (variable) | OFL 1.1 [verified: 2 sources] | `fonts.google.com/specimen/Pixelify+Sans` | `github.com/eifetx/Pixelify-Sans` | `@fontsource-variable/pixelify-sans` |
| Pixel mono — debug overlay, console, sphere-grid coords | **Departure Mono** | OFL [verified: 2 sources] | *not on Google Fonts* | `departuremono.com` / `github.com/rektdeckard/departure-mono` (releases page has the .zip) | — (vendor the .woff2) |
| Pixel — CC0 rather than OFL, if you want zero license text | **Kenney Fonts** | CC0 [verified: 2 sources] | *not on Google Fonts* | `kenney.nl/assets/kenney-fonts` | — |

**Departure Mono sizing note:** the author specifies **font sizes in increments of 11px** for pixel-perfect rendering. [verified: 2 sources — departuremono.com, github.com/rektdeckard/departure-mono README]

### 1.3 Direct download URLs

- **Google Fonts one-click zip pattern:** `https://fonts.google.com/download?family=<Name%20With%20Spaces>` — e.g. `https://fonts.google.com/download?family=Exo%202`. [single source — Google Fonts UI behaviour]
- **Authoritative source of truth (always includes `OFL.txt`):** `https://github.com/google/fonts/tree/main/ofl/<slug>` where `<slug>` is the lowercased family name with spaces and digits joined (`exo2`, `chakrapetch`, `oxanium`, `silkscreen`, `pressstart2p`, `pixelifysans`, `rajdhani`, `russoone`, `michroma`, `titilliumweb`). [verified: 2 sources — google/fonts repo layout, googlefonts/silkscreen]
- **Departure Mono:** `https://github.com/rektdeckard/departure-mono/releases` (latest tagged release ships a `.zip` with `.otf`/`.woff2`). [verified: 2 sources]

### 1.4 Delivery decision — self-host, do not use the Google Fonts CDN

**Recommendation: self-host via `@fontsource*` npm packages.** [decision, rationale below]

Reasons specific to this project:
1. The downloadable-zip build (§6.3) must work with no network. A CDN `<link>` breaks it.
2. Playwright screenshot determinism (§5.3) is destroyed by a CDN that can serve a different subset/version or fail to load.
3. GitHub Pages has no server config; a third-party CDN adds a request-blocking round trip on first paint.
4. Fontsource ships the same OFL files with the license text included, so the CREDITS story is clean.

Install and import:

```bash
npm i -D @fontsource-variable/exo-2 @fontsource/chakra-petch @fontsource/silkscreen
```

```ts
// src/ui/fonts.ts — import once, at app entry
import '@fontsource-variable/exo-2';            // variable wght axis
import '@fontsource/chakra-petch/500.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/chakra-petch/700-italic.css'; // damage numbers
import '@fontsource/silkscreen/400.css';
```

```css
/* src/ui/tokens.css */
:root {
  --font-ui:     'Exo 2 Variable', 'Exo 2', system-ui, sans-serif;
  --font-x2:     'Chakra Petch', var(--font-ui);
  --font-damage: 'Chakra Petch', var(--font-ui);
  --font-pixel:  'Silkscreen', monospace;
}
```

Fontsource requires a bundler that can import CSS — Vite qualifies. Variable fonts are recommended over multiple static weights to cut bundle size. [verified: 2 sources — fontsource.org/docs/getting-started/install, aaronjbecker.com]

### 1.5 Damage numbers — render as canvas texture, not DOM

Damage numbers in FFX pop, arc, and scale in world space. Implement them as **billboarded canvas textures**, not DOM overlays, so they respect depth, bloom, and the grade pass.

```ts
// Render once per distinct number into a small canvas; cache by string.
function makeDamageTexture(text: string, style: 'normal'|'crit'|'heal'|'miss'): THREE.CanvasTexture {
  const S = 4;                                  // supersample, then NearestFilter down is wrong —
  const c = document.createElement('canvas');   // so instead render AT final size with no AA-ish font.
  const px = 44;                                // cap height in texels
  const ctx = c.getContext('2d')!;
  ctx.font = `italic 700 ${px}px 'Chakra Petch', sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 16;
  c.width = w; c.height = px + 20;
  const g = c.getContext('2d')!;
  g.font = ctx.font;
  g.textBaseline = 'top';
  g.lineJoin = 'round';
  // 3-pass: dark outline, body gradient, top highlight
  g.strokeStyle = '#120a1e'; g.lineWidth = 6; g.strokeText(text, 8, 8);
  const grad = g.createLinearGradient(0, 8, 0, 8 + px);
  const ramp = { normal: ['#ffffff','#ffd9a0'], crit: ['#fffbe0','#ff8a3c'],
                 heal:   ['#eaffff','#6fe3c8'], miss: ['#e8e8f2','#9aa0b8'] }[style];
  grad.addColorStop(0, ramp[0]); grad.addColorStop(1, ramp[1]);
  g.fillStyle = grad; g.fillText(text, 8, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;   // damage text is NOT pixel art — linear is correct here
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}
```

Note the deliberate inconsistency: **sprites use `NearestFilter`, damage text uses `LinearFilter`.** Text rendered by the browser already has grey anti-aliased edges; forcing nearest on it produces crawling artefacts. Keep the two paths separate. [estimate — rendering judgement]

---

## 2. HD-2D in Three.js

### 2.1 Pinned versions (all read from npm dist-tags on 2026-09-15)

| Package | Version | License | Notes | Confidence |
|---|---|---|---|---|
| `three` | **0.186.0** | MIT | ESM-only (`"type": "module"`); exports `./addons/*` and `./examples/jsm/*` | [verified: 2 sources — registry dist-tags + registry manifest] |
| `@types/three` | **0.186.0** | MIT | Still required — three does **not** ship its own `types` field | [verified: 2 sources — registry dist-tags + three `package.json` has no `types`/`typings`] |
| `vite` | **8.3.0** | MIT | | [verified: registry dist-tags] |
| `typescript` | **7.0.2** | Apache-2.0 | Go-native compiler (`tsgo`); GA 2026-07-08, 8–12× faster full builds | [verified: 2 sources — registry dist-tags + InfoQ] |
| `vitest` | **5.0.1** | MIT | peer `vite: ^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0`; engines `^22.12.0 \|\| ^24 \|\| >=26` | [verified: 2 sources — registry manifest + vitest.dev/blog/vitest-5] |
| `@vitest/coverage-v8` | **5.x** (match vitest major) | MIT | must be upgraded in lockstep with vitest | [single source — vitest 5 blog] |
| `@playwright/test` | **1.63.0** | Apache-2.0 | | [verified: registry dist-tags] |
| `pngjs` | **7.0.0** | MIT | pure JS, zero native deps | [verified: 2 sources — registry dist-tags + pngjs README] |
| `vite-plugin-singlefile` | **2.3.3** | MIT | for the offline zip build | [verified: registry dist-tags] |
| `postprocessing` | 6.39.5 | Zlib | peer `three: ">= 0.168.0 < 0.187.0"` | [verified: 2 sources — registry manifest, unpkg.com/postprocessing@6.39.5/package.json] |

**Node runtime floor: `>=22.12.0`**, driven by Vitest 5. Pin it in `package.json` `engines` and in the CI `setup-node`. [verified: 2 sources]

#### TypeScript 7 caveat — read before wiring ESLint

TypeScript 7.0 **ships without a stable programmatic API**; it is expected in 7.1. Consequently `typescript-eslint` and framework tooling (Vue/Svelte/Astro/Angular) cannot consume it yet. Microsoft publishes a compatibility package **`@typescript/typescript6`** exposing a `tsc6` binary and re-exporting the 6.0 API for tools that need it. [verified: 2 sources — InfoQ, sitepoint migration guide]

**Recommendation for Pyrefly Reprise:** this is a plain TS + Vite + Three project with no framework compiler, so:
- Use `typescript@7.0.2` for `tsc --noEmit` type checking and for editor/IDE.
- If you add ESLint, also add `@typescript/typescript6` as a devDependency and point `typescript-eslint`'s `parserOptions` at it until 7.1 lands.
- If ESLint friction is not worth it, skip ESLint entirely and rely on `tsc --noEmit` + Vitest. This project is small enough. [estimate]

#### `postprocessing` npm package vs `three/addons/postprocessing` — **use `three/addons`**

| Criterion | `three/addons/postprocessing` | `postprocessing` (pmndrs) |
|---|---|---|
| Extra dependency | none (ships with three) | one more package |
| three version coupling | always in lockstep | hard peer range `>= 0.168.0 < 0.187.0` — **breaks the moment three ships 0.187** |
| Effect merging | one full-screen pass per effect | merges effects into a single fragment shader (fewer passes, meaningfully faster) |
| Available passes (r186) | `AfterimagePass, BloomPass, BokehPass, ClearPass, CubeTexturePass, DotScreenPass, EffectComposer, FXAAPass, FilmPass, GTAOPass, GlitchPass, HalftonePass, LUTPass, MaskPass, OutlinePass, OutputPass, Pass, RenderPass, RenderPixelatedPass, RenderTransitionPass, SAOPass, SMAAPass, SSAARenderPass, SSAOPass, SSRPass, SavePass, ShaderPass, TAARenderPass, TexturePass, UnrealBloomPass` | `BloomEffect, DepthOfFieldEffect, VignetteEffect, ToneMappingEffect, …` |
| Custom shaders | trivially easy (`new ShaderPass({uniforms, vertexShader, fragmentShader})`) | requires writing an `Effect` subclass |

**Decision: `three/addons/postprocessing`.** [decision]
Rationale: our chain is short (bloom → tilt-shift blur → grade+vignette → output), two of those four passes are custom shaders we write ourselves, and the version lock on `postprocessing` is an active liability for a project that will be maintained across three releases. The per-pass overhead of 4 full-screen passes at 1080p is negligible next to the bloom's own mip chain. Revisit only if the frame budget proves tight on low-end laptops.
[verified: pass list from `mrdoob/three.js/tree/dev/examples/jsm/postprocessing`; peer range from `postprocessing@6.39.5` manifest]

### 2.2 `package.json`

```jsonc
{
  "name": "pyrefly-reprise",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev":        "vite",
    "build":      "tsc --noEmit && vite build",
    "preview":    "vite preview",
    "build:zip":  "vite build --mode offline && node tools/make-zip.mjs",
    "test":       "vitest run",
    "test:watch": "vitest",
    "test:e2e":   "playwright test",
    "sprites":    "node tools/render-sprites.mjs",
    "music":      "node tools/render-music.mjs"
  },
  "dependencies": {
    "three": "0.186.0"
  },
  "devDependencies": {
    "@fontsource-variable/exo-2": "^5",
    "@fontsource/chakra-petch": "^5",
    "@fontsource/silkscreen": "^5",
    "@playwright/test": "1.63.0",
    "@types/three": "0.186.0",
    "@vitest/coverage-v8": "5.0.1",
    "pngjs": "7.0.0",
    "typescript": "7.0.2",
    "vite": "8.3.0",
    "vite-plugin-singlefile": "2.3.3",
    "vitest": "5.0.1"
  }
}
```

Note `three` is a **dependency**, not devDependency — it is shipped code.

### 2.3 Renderer and colour management

```ts
import * as THREE from 'three';

export function makeRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,          // sprites are nearest-filtered; MSAA does nothing useful and costs fill
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(1);   // FIXED at 1 — see §5.3 determinism
  renderer.outputColorSpace = THREE.SRGBColorSpace;   // three default, set explicitly for clarity
  renderer.toneMapping = THREE.NoToneMapping;         // we grade by hand in the final pass
  renderer.setClearColor(0x000000, 1);
  return renderer;
}
```

**Colour rules (get these wrong and every sprite looks washed out):**

| Texture kind | `colorSpace` |
|---|---|
| Sprite albedo, UI atlas, damage text, ground colour maps | `THREE.SRGBColorSpace` |
| Noise masks, height/roughness/alpha-only data, particle falloff | `THREE.NoColorSpace` (the default) |

`Texture.colorSpace` defaults to `NoColorSpace`; three's docs say to set `SRGBColorSpace` for colour data. [verified: 2 sources — threejs.org/docs/pages/Texture.html, three.js source (`src/textures/Texture.js` default `colorSpace = NoColorSpace`)]

**Tone mapping choice:** `NoToneMapping` + hand grading. ACES Filmic desaturates flat sprite colours badly and fights the deliberately saturated HD-2D palette. Bloom is fed by an explicit luminance threshold instead of HDR tone response. [estimate — art-direction judgement; revisit if bloom clips]

### 2.4 Camera

```ts
const FOV = 35;
const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 200);
camera.position.set(0, 6.4, 11.2);
camera.lookAt(0, 1.5, 0);      // => pitch ≈ -24.5°
```

| Preset | Position | LookAt | Effective pitch | Use |
|---|---|---|---|---|
| `battle` | `(0, 6.4, 11.2)` | `(0, 1.5, 0)` | ≈ −24.5° | default CTB camera |
| `battle_close` | `(0, 4.2, 7.0)` | `(0, 1.4, 0)` | ≈ −21.8° | attack/ability beats |
| `boss_wide` | `(0, 9.5, 16.0)` | `(0, 2.4, 0)` | ≈ −23.4° | Sin, Vegnagun, Yunalesca |
| `cutscene_low` | `(2.2, 2.4, 6.2)` | `(0, 1.7, 0)` | ≈ −6.4° | dialogue beats |
| `overdrive` | `(0, 3.0, 5.4)` | `(0, 1.8, 0)` | ≈ −12.5° | Overdrive flourishes |

Keep **FOV fixed at 35** across all presets and move the camera instead — changing FOV changes the texel→pixel ratio (§2.5) and makes sprites shimmer.

Gentle idle drift (adds life without breaking screenshot determinism if driven by the injected clock, §5.4):

```ts
camera.position.x = base.x + Math.sin(t * 0.17) * 0.12;
camera.position.y = base.y + Math.sin(t * 0.23 + 1.1) * 0.06;
```

### 2.5 Texel-to-pixel ratio (the crispness formula)

For a `PerspectiveCamera` with vertical FOV `F` (deg), canvas height `H` (px, at pixelRatio 1), an object at camera distance `d` (world units):

```
visibleWorldHeight V = 2 * d * tan(F * PI / 360)
screenPixelsPerWorldUnit = H / V
worldUnitsPerScreenPixel = V / H
```

To make one sprite texel occupy exactly `S` screen pixels:

```ts
export function spriteWorldHeight(texelsTall: number, S: number, d: number, fovDeg: number, canvasH: number) {
  const V = 2 * d * Math.tan(fovDeg * Math.PI / 360);
  return texelsTall * S * (V / canvasH);
}
```

**Project constants:**

| Constant | Value | Rationale |
|---|---|---|
| `PPU` (texels per world unit) | **32** | a 64px-tall character sprite = 2.0 world units ≈ human height |
| Design canvas | **1280 × 720** (letterboxed, `object-fit: contain`) | integer 2× of 640×360; keeps `S` near-integer at the default camera distance |
| Target `S` at `battle` preset | **≈ 2.0 screen px per texel** | verify at runtime with the formula; log a warning if `S` drifts >8% from 2.0 |

Add a dev assert so drift is caught:

```ts
if (import.meta.env.DEV) {
  const S = (canvasH / (2 * d * Math.tan(FOV * Math.PI / 360))) / PPU;
  if (Math.abs(S - 2) > 0.16) console.warn(`[hd2d] texel ratio drifted: S=${S.toFixed(3)}`);
}
```

### 2.6 Pixel-art sprite billboards

**Do not use `THREE.Sprite`.** `Sprite` always faces the camera on all axes (including pitch), which makes characters appear to lie back as the camera tilts, and its `center`/`scale` semantics fight the feet-pivot convention. Use a `PlaneGeometry` + `MeshBasicMaterial` and control billboarding explicitly. [estimate — rendering judgement; `Sprite` is fine for tiny FX motes]

```ts
export type BillboardMode = 'yaw' | 'full';

export function makeSpriteTexture(img: TexImageSource): THREE.Texture {
  const t = new THREE.Texture(img as any);
  t.colorSpace   = THREE.SRGBColorSpace;
  t.magFilter    = THREE.NearestFilter;
  t.minFilter    = THREE.NearestFilter;   // NOT NearestMipmapNearest — we never minify past 1:1
  t.generateMipmaps = false;              // mipmaps + nearest = shimmer on a moving camera
  t.anisotropy   = 1;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

export function makeBillboard(tex: THREE.Texture, texW: number, texH: number, mode: BillboardMode = 'yaw') {
  const w = texW / PPU, h = texH / PPU;
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);             // pivot at FEET (y=0), so ground placement is trivial

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: false,    // <- deliberate; see the alpha note below
    alphaTest: 0.5,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,     // sprite colours are already final; don't let three re-map them
    fog: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.onBeforeRender = (_r, _s, cam) => {
    if (mode === 'full') {
      mesh.quaternion.copy(cam.quaternion);
    } else {
      // yaw-only: stay vertical, rotate about Y to face the camera
      const dx = cam.position.x - mesh.position.x;
      const dz = cam.position.z - mesh.position.z;
      mesh.rotation.set(0, Math.atan2(dx, dz), 0);
    }
  };
  return mesh;
}
```

#### The alpha rule (this is the single most important line in this section)

Our sprites are authored with **binary alpha only** — every pixel is either fully opaque (255) or fully transparent (0). There is no anti-aliased fringe, because the rasterizer in §3 never anti-aliases. Therefore:

> **Use `transparent: false` + `alphaTest: 0.5` + `depthWrite: true` for sprite bodies.**

This puts sprites in the **opaque render queue**, which means the depth buffer sorts them correctly against each other and against the ground — no manual `renderOrder` bookkeeping, no "character behind the boss pops in front" bug, no per-frame sort cost. It is strictly better than `transparent: true` for hard-edged pixel art.

`transparent: true, depthWrite: false` is reserved for things that genuinely need graded alpha: shadow blobs, glows, particle sheets, screen flashes. Those get explicit `renderOrder`.

Common guidance says to use `transparent: true, alphaTest: 0.12, depthWrite: false, side: DoubleSide` for sprite sheets; that guidance targets *soft-edged* art and is wrong for us. [conflict recorded — fundamental.sh spritesheet article vs this document; we deviate deliberately]

Nearest filtering on both `minFilter` and `magFilter` is the standard pixel-art configuration. [verified: 2 sources — mrdoob/three.js#1418, fundamental.sh]

### 2.7 Sprite-sheet animation via UV offsets

Sheet layout convention: **one row per animation clip, frames left→right, all frames the same cell size, no padding, power-of-two total dimensions not required.**

```ts
export interface Clip { row: number; frames: number; fps: number; loop: boolean; }

export class SheetAnimator {
  private t = 0; private frame = 0;
  constructor(
    private tex: THREE.Texture,
    private cols: number,
    private rows: number,
    private clips: Record<string, Clip>,
    private current = 'idle',
  ) {
    tex.repeat.set(1 / cols, 1 / rows);   // Texture.repeat default is (1,1)
    this.apply();
  }
  play(name: string) { if (name !== this.current) { this.current = name; this.t = 0; this.frame = 0; this.apply(); } }
  update(dt: number) {
    const c = this.clips[this.current];
    this.t += dt;
    const step = 1 / c.fps;
    while (this.t >= step) {
      this.t -= step;
      this.frame = c.loop ? (this.frame + 1) % c.frames : Math.min(this.frame + 1, c.frames - 1);
      this.apply();
    }
  }
  private apply() {
    const c = this.clips[this.current];
    // three's V axis runs bottom-up; row 0 is the TOP row of the PNG.
    this.tex.offset.set(this.frame / this.cols, 1 - (c.row + 1) / this.rows);
  }
}
```

Gotchas:
- `Texture.offset`/`repeat` default to `(0,0)` / `(1,1)`. [verified: threejs.org/docs/pages/Texture.html]
- With `ClampToEdgeWrapping` and `NearestFilter`, sub-texel offset error bleeds the neighbouring frame. Keep cell sizes integral and the sheet dimensions exactly `cols*cellW × rows*cellH`.
- **Never share one `Texture` between two animators** — `offset` is per-texture state. Clone with `tex.clone()` (cheap; shares the same GPU image) per instance.
- Animation must be driven by the injected clock (§5.4), not `performance.now()`.

**Canonical clip set — the row contract.** `visual-bible.md` §6.8 authors idles at 10 fps and actions at 12–15 fps with per-character 2–8 frame loops; this document previously fixed a single frame-count and fps per clip. Those are not compatible, and sheets authored against one cannot be indexed by the other's animator. **Resolution: the row index is fixed and normative; the frame count and fps are per-character data.** `[CONFLICT RESOLVED — assets-and-tech §2.7 vs visual-bible §6.8; the row contract is kept because the animator must index blind, the fps/frame freedom is kept because it is what the art direction actually needs]`

Every character sheet must define all ten rows (a row may be 1 frame). Row order may never change — `SheetAnimator` indexes by row number, not by name.

| Row | Clip | Default frames | Allowed frames | Default fps | Allowed fps | Loop |
|---:|---|---:|---|---:|---|---|
| 0 | `idle` | 4 | 4–8 | **10** | 6–10 | yes |
| 1 | `ready` (active turn) | 4 | 2–8 | **10** | 8–12 | yes |
| 2 | `walk` | 6 | 4–8 | **12** | 10–12 | yes |
| 3 | `attack` | 6 | 5–8 | **14** | 12–15 | no |
| 4 | `cast` | 6 | 5–8 | **12** | 10–15 | no |
| 5 | `hurt` | 2 | 2–4 | **15** | 12–15 | no |
| 6 | `guard` | 2 | 2–4 | **10** | 6–10 | yes |
| 7 | `ko` | 4 | 4–6 | **10** | 8–12 | no |
| 8 | `victory` | 6 | 4–8 | **12** | 8–15 | yes |
| 9 | `overdrive` | 8 | 6–8 | **12** | 12–15 | no |

The defaults are the values an agent gets for free; `sheet.json` overrides them inside the allowed bands, and `render-sprites.mjs` fails the build on an out-of-band value. The fps bands are §6.8's ("author at 10 fps for idles, 12–15 fps for actions"), widened downward only for `idle`/`guard`/`ko` so heavy characters (Kimahri, Auron, bosses) can breathe slowly.

`SheetAnimator` also needs §6.8's "hold the impact frame for 2 frame-times", which the interface above cannot express. Extend `Clip` with an optional per-frame hold multiplier:

```ts
export interface Clip {
  row: number; frames: number; fps: number; loop: boolean;
  holds?: number[];          // length === frames; multiplies that frame's dwell. Default all 1.
}
// inside update(): const step = (c.holds?.[this.frame] ?? 1) / c.fps;
```

**Sheet manifest.** Every sheet ships `assets/sprites/<name>.sheet.json` beside its PNG. This file, not a constant in the code, is the source of truth for both the renderer and the animator:

```jsonc
{
  "cell": [64, 80],            // from the canonical size table, §3.5
  "pivot": [32, 79],           // feet-centred, bottom row
  "cols": 8, "rows": 10,
  "pages": ["kimahri.png"],    // >1 only when cols*cellW would exceed 2048
  "clips": {
    "idle":      { "row": 0, "frames": 6, "fps": 10, "loop": true },
    "attack":    { "row": 3, "frames": 7, "fps": 14, "loop": false, "holds": [1,1,1,2,1,1,1] }
  }
}
```

**Sheet size.** `sheetW = cols × cellW`, `sheetH = rows × cellH`, no padding. For the three party cell sizes: 48×64 ⇒ 384×640, 56×72 ⇒ 448×720, 64×80 ⇒ **512×800**. All comfortable.

**Bosses do not use the ten-row sheet.** A 384×320 Vegnagun cell × 8 columns is 3 072 px wide, past the safe texture budget. Bosses use the reduced row set below, and any sheet whose `cols × cellW` would exceed **2048 px** is split into pages of `floor(2048 / cellW)` columns each, listed in `pages[]` and bound as separate textures by the animator. 2048 is a deliberately conservative authoring cap rather than a hardware limit — real WebGL2 contexts report far more — but it keeps every sheet loadable on low-end integrated GPUs and inside the §6.9 "textures resident < 96 MB" guard-rail. `[estimate — the 2048 cap is an authoring budget, not a spec citation]`

| Row | Boss clip | Default frames | Default fps | Loop |
|---:|---|---:|---:|---|
| 0 | `idle` | 6 | 8 | yes |
| 1 | `attack` | 6 | 12 | no |
| 2 | `cast` | 6 | 10 | no |
| 3 | `hurt` | 2 | 15 | no |
| 4 | `phase` (transition / transform) | 8 | 10 | no |
| 5 | `ko` (death / dissolve) | 6 | 8 | no |

Rows 6–9 are absent, not blank: `rows` in the manifest is 6 for a boss. `SheetAnimator` must therefore read `rows` from the manifest and never assume 10. Requesting a clip a sheet does not define falls back to `idle` and logs once in dev builds.

### 2.8 Shadow blobs

No real shadow maps. A procedurally generated radial-falloff blob per actor:

```ts
let blobTex: THREE.CanvasTexture | null = null;
function shadowBlobTexture(): THREE.CanvasTexture {
  if (blobTex) return blobTex;
  const N = 64, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(N/2, N/2, 0, N/2, N/2, N/2);
  grad.addColorStop(0.00, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.34)');
  grad.addColorStop(1.00, 'rgba(0,0,0,0.00)');
  g.fillStyle = grad; g.fillRect(0, 0, N, N);
  blobTex = new THREE.CanvasTexture(c);
  blobTex.colorSpace = THREE.NoColorSpace;   // alpha-only data, not colour
  return blobTex;
}

export function makeShadowBlob(radius = 0.55) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: shadowBlobTexture(),
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;        // z-fight insurance on top of polygonOffset
  m.renderOrder = 1;           // after opaque ground, before transparent FX
  return m;
}
```

Per-frame: scale the blob by jump height (`scale = clamp(1 - y*0.35, 0.45, 1)`) and fade `material.opacity` the same way. Shadow blobs go in the transparent queue, so give them a `renderOrder` band: ground `0`, shadows `1`, sprites (opaque, queue-sorted) n/a, FX `10+`, screen flashes `100`.

### 2.9 EffectComposer chain

```ts
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass }     from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js';

export function makeComposer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, w: number, h: number) {
  // HalfFloat render targets so bloom has headroom above 1.0
  const rt = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    magFilter: THREE.NearestFilter,   // keeps the pixel look through the chain
    minFilter: THREE.NearestFilter,
    samples: 0,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.setSize(w, h);

  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.62, 0.55, 0.72);
  composer.addPass(bloom);

  const tiltH = new ShaderPass(TiltShiftShader); tiltH.uniforms.uDir.value.set(1, 0);
  const tiltV = new ShaderPass(TiltShiftShader); tiltV.uniforms.uDir.value.set(0, 1);
  composer.addPass(tiltH);
  composer.addPass(tiltV);

  composer.addPass(new ShaderPass(GradeVignetteShader));

  composer.addPass(new OutputPass());   // MUST be last: tone map + linear→sRGB
  return { composer, bloom, tiltH, tiltV };
}
```

#### UnrealBloomPass parameters

Constructor signature: `new UnrealBloomPass(resolution: Vector2, strength: number, radius: number, threshold: number)`. Defaults: `strength = 1`, resolution default `(256,256)`, `radius` in `[0,1]`, `threshold` is the luminance cut below which nothing blooms. [verified: 2 sources — threejs.org/docs/pages/UnrealBloomPass.html, waelyasmina.net]

**Tuned presets for Pyrefly Reprise** [estimate — art direction; start here and tune against reference screenshots]:

| Scene | strength | radius | threshold | Note |
|---|---|---|---|---|
| Default battle (Besaid / Mi'ihen) | 0.62 | 0.55 | 0.72 | subtle; sprite whites barely bloom |
| Via Purifico / underwater | 0.85 | 0.70 | 0.62 | wet, caustic glow |
| Seymour (Flux/Omnis) | 1.10 | 0.62 | 0.55 | heavy magical bloom |
| Sin / Final battle | 1.35 | 0.75 | 0.48 | near-blowout, intentional |
| Vegnagun / X-2 Mach 3 | 1.00 | 0.58 | 0.60 | hard neon edges |
| Pyrefly-heavy dissolves | +0.3 to current, ramped over 0.8s | — | −0.10 | animate, then restore |

Resolution: pass the real canvas size, not `(256,256)` — but note that bloom cost scales with it, so on a low-end path drop to `new THREE.Vector2(w/2, h/2)` and let the upscale blur for free.

#### Tilt-shift / depth-of-field: prefer a screen-space band blur over `BokehPass`

`BokehPass` exists in `three/addons/postprocessing/BokehPass.js` and does true depth-based DOF. For HD-2D, the signature look (Octopath, Triangle Strategy) is not physical DOF — it is a **tilt-shift band**: sharp through a horizontal band, blurring toward the top and bottom of frame. This is cheaper, has no depth-buffer edge artefacts around alpha-tested sprites (a real problem: `alphaTest` sprites write depth at the quad's plane, so BokehPass blurs *around* cut-out silhouettes incorrectly), and is trivially art-directable.

**Decision: custom separable tilt-shift, two `ShaderPass` instances (H then V).** Keep `BokehPass` as a documented fallback if a scene genuinely needs depth-based focus. [decision; estimate on the artefact claim]

```glsl
// TiltShiftShader.fs — 9-tap separable Gaussian, weight driven by |y - focus|
uniform sampler2D tDiffuse;
uniform vec2  uTexel;     // (1/w, 1/h)
uniform vec2  uDir;       // (1,0) then (0,1)
uniform float uFocus;     // 0..1, screen-space Y of the sharp band centre  (0.56)
uniform float uBand;      // half-height of the fully sharp band            (0.16)
uniform float uFeather;   // falloff distance beyond the band               (0.30)
uniform float uMaxRadius; // px at full blur                                (3.5)
varying vec2  vUv;

const float W[5] = float[5](0.227027, 0.194595, 0.121622, 0.054054, 0.016216);

void main() {
  float d = abs(vUv.y - uFocus);
  float k = smoothstep(uBand, uBand + uFeather, d);   // 0 sharp .. 1 blurred
  if (k < 0.002) { gl_FragColor = texture2D(tDiffuse, vUv); return; }
  vec2 step = uDir * uTexel * uMaxRadius * k;
  vec4 sum = texture2D(tDiffuse, vUv) * W[0];
  for (int i = 1; i < 5; i++) {
    sum += texture2D(tDiffuse, vUv + step * float(i)) * W[i];
    sum += texture2D(tDiffuse, vUv - step * float(i)) * W[i];
  }
  gl_FragColor = sum;
}
```

Uniform defaults: `uFocus = 0.56`, `uBand = 0.16`, `uFeather = 0.30`, `uMaxRadius = 3.5`. For the `cutscene_low` camera, drop `uMaxRadius` to `1.8` and raise `uFocus` to `0.50`. [estimate]

#### Vignette + colour grading (one combined pass)

Combining vignette, lift/gamma/gain, saturation and a shadow tint into one pass saves three full-screen reads.

```glsl
// GradeVignetteShader.fs
uniform sampler2D tDiffuse;
uniform vec3  uLift;        // additive, shadows        default (0.010, 0.004, 0.028)
uniform vec3  uGain;        // multiplicative, highs    default (1.030, 1.000, 0.975)
uniform float uGamma;       // default 0.98
uniform float uSaturation;  // default 1.12
uniform float uVignette;    // strength 0..1, default 0.42
uniform float uVigSoft;     // default 0.55
uniform vec3  uShadowTint;  // default (0.35, 0.42, 0.85)
uniform float uShadowTintAmt; // default 0.10
uniform float uFlash;       // 0..1 screen flash, animated
uniform vec3  uFlashColor;
varying vec2 vUv;

void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;

  c = pow(max(c, 0.0), vec3(uGamma));
  c = c * uGain + uLift;

  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSaturation);

  // tint the shadows cool (the FFX/Spira blue)
  float sh = 1.0 - smoothstep(0.0, 0.42, l);
  c = mix(c, c * uShadowTint, sh * uShadowTintAmt);

  // vignette
  vec2 p = (vUv - 0.5) * vec2(1.0, 0.92);
  float v = smoothstep(0.78, uVigSoft, length(p) * 1.414);
  c *= mix(1.0 - uVignette, 1.0, v);

  c = mix(c, uFlashColor, uFlash);
  gl_FragColor = vec4(c, 1.0);
}
```

Expose `uFlash`/`uFlashColor` on the pass so combat can drive white flashes on crits, red on party KO, and a slow gold ramp on Overdrive. Animate from the injected clock.

**Per-encounter grade presets** to define in `src/render/grades.ts` [estimate]:

| Encounter | lift | gain | sat | vignette | shadow tint |
|---|---|---|---|---|---|
| Besaid / Kilika (warm coast) | `(0.012,0.008,0.020)` | `(1.05,1.01,0.96)` | 1.14 | 0.36 | `(0.42,0.50,0.85)` |
| Mi'ihen / Djose (overcast) | `(0.010,0.010,0.024)` | `(0.99,1.00,1.02)` | 1.02 | 0.44 | `(0.40,0.46,0.80)` |
| Seymour (violet, cold) | `(0.018,0.006,0.040)` | `(1.01,0.96,1.08)` | 1.18 | 0.52 | `(0.34,0.30,0.92)` |
| Sin / Final (bleached) | `(0.024,0.022,0.030)` | `(1.10,1.06,1.00)` | 0.92 | 0.30 | `(0.55,0.58,0.78)` |
| X-2 (bright pop) | `(0.006,0.006,0.010)` | `(1.06,1.03,1.04)` | 1.24 | 0.28 | `(0.45,0.50,0.88)` |

### 2.10 Particles — `Points` + custom `ShaderMaterial`

One reusable system, three configurations.

```ts
export interface ParticleConfig {
  count: number;
  lifeRange: [number, number];
  sizeRange: [number, number];      // in world units at unit distance
  velocity: (i: number, rng: () => number) => THREE.Vector3;
  origin: (i: number, rng: () => number) => THREE.Vector3;
  gravity: number;
  swayAmp: number; swayFreq: number;
  colorA: THREE.Color; colorB: THREE.Color;
  blending: THREE.Blending;
  spin: number;                     // radians/sec applied to gl_PointCoord
}
```

Geometry attributes (all static — the GPU animates everything from `uTime`, so there is **zero per-frame CPU work** and the system is perfectly deterministic given a seeded RNG):

| Attribute | Size | Meaning |
|---|---|---|
| `position` | 3 | spawn point |
| `aVel` | 3 | initial velocity |
| `aSeed` | 1 | 0..1 per-particle random |
| `aStart` | 1 | spawn time offset (stagger) |
| `aLife` | 1 | lifetime seconds |
| `aSize` | 1 | base point size |

```glsl
// particles.vs
uniform float uTime;
uniform float uPixelHeight;   // canvas height in px (for correct size-by-distance)
uniform float uGravity;
uniform float uSwayAmp;
uniform float uSwayFreq;
attribute vec3  aVel;
attribute float aSeed, aStart, aLife, aSize;
varying float vAge;      // 0..1
varying float vSeed;

void main() {
  float t = mod(uTime - aStart, aLife);
  vAge = t / aLife;
  vSeed = aSeed;

  vec3 p = position + aVel * t;
  p.y -= 0.5 * uGravity * t * t;
  p.x += sin(t * uSwayFreq + aSeed * 6.2831) * uSwayAmp;
  p.z += cos(t * uSwayFreq * 0.83 + aSeed * 6.2831) * uSwayAmp * 0.6;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // fade in over the first 12%, out over the last 35%
  float env = smoothstep(0.0, 0.12, vAge) * (1.0 - smoothstep(0.65, 1.0, vAge));
  gl_PointSize = aSize * env * (uPixelHeight / -mv.z);
}
```

```glsl
// particles.fs
uniform vec3  uColorA, uColorB;
uniform float uTime, uSpin;
uniform sampler2D uMask;     // optional; omit for soft round motes
varying float vAge, vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  // rotate the point sprite (Points cannot be rotated any other way)
  float a = uTime * uSpin + vSeed * 6.2831;
  float s = sin(a), c = cos(a);
  uv = mat2(c, -s, s, c) * uv;

  float r = length(uv);
  if (r > 0.5) discard;
  float soft = 1.0 - smoothstep(0.18, 0.5, r);

  float env = smoothstep(0.0, 0.12, vAge) * (1.0 - smoothstep(0.65, 1.0, vAge));
  vec3 col = mix(uColorA, uColorB, vAge);
  gl_FragColor = vec4(col, soft * env);
}
```

Material: `new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: true, blending: <per config> })`, `mesh.renderOrder = 12`.

**Three configured systems:**

| System | count | life (s) | blending | colorA → colorB | gravity | sway | spin |
|---|---|---|---|---|---|---|---|
| **Pyreflies** (deaths, Sendings, ambient Farplane) | 240 | 2.2–4.5 | `AdditiveBlending` | `#fff6d2` → `#5fe3ff` | **−0.9** (rises) | 0.22 @ 1.4 Hz | 0.0 |
| **Snow** (Macalania, Mt. Gagazet) | 600 | 6–11 | `NormalBlending` | `#ffffff` → `#dfeaff` | +0.55 | 0.35 @ 0.55 Hz | 0.0 |
| **Petals** (Besaid, X-2 Luca/Gullwings) | 180 | 4–8 | `NormalBlending` | `#ffd6e6` → `#ff9fc4` | +0.35 | 0.5 @ 0.8 Hz | **2.4** (uses `uMask` = petal shape) |

**Critical caveat — `gl_PointSize` clamping.** Drivers cap point size, and the cap can be as low as 63 on some GL ES paths. Query it and fall back:

```ts
const gl = renderer.getContext();
const [, maxPoint] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array;
if (maxPoint < 128) console.warn('[fx] small point-size cap', maxPoint);
```

For anything that must render large on screen (big pyrefly orbs during a Sending, Overdrive sparks), use an `InstancedMesh` of billboarded quads instead of `Points`. Points are for many-and-small only. [verified: 2 sources — webglfundamentals.org gl_PointSize workaround article (63px cap cited), Chromium ALIASED_POINT_SIZE_RANGE bug discussion; verify per-target]

### 2.11 Procedural ground textures (no image downloads)

Everything is generated at boot into an offscreen canvas. Zero network, zero binary assets, fully deterministic given a seed.

```ts
// Deterministic value noise — same RNG family as the combat engine (§5.4)
function mulberry32(a: number) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export interface GroundSpec {
  size: number;                 // px, use 512
  base: string;                 // hex
  ramp: string[];               // 3–5 hex stops, dark→light
  grain: number;                // 0..1 speckle amount
  patchScale: number;           // large-blob frequency, e.g. 6
  crackDensity?: number;        // 0..1 for stone/ruins
  seed: number;
}

export function makeGroundTexture(s: GroundSpec): THREE.CanvasTexture {
  const rng = mulberry32(s.seed);
  const c = document.createElement('canvas'); c.width = c.height = s.size;
  const g = c.getContext('2d')!;
  g.fillStyle = s.base; g.fillRect(0, 0, s.size, s.size);

  // 1. large soft patches (tileable: draw each blob 9x in a 3x3 wrap grid)
  for (let i = 0; i < s.patchScale * 8; i++) {
    const x = rng() * s.size, y = rng() * s.size, r = (0.05 + rng() * 0.12) * s.size;
    g.fillStyle = s.ramp[(rng() * s.ramp.length) | 0];
    g.globalAlpha = 0.10 + rng() * 0.18;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      g.beginPath(); g.arc(x + ox * s.size, y + oy * s.size, r, 0, Math.PI * 2); g.fill();
    }
  }
  g.globalAlpha = 1;

  // 2. per-pixel grain
  const img = g.getImageData(0, 0, s.size, s.size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rng() - 0.5) * 2 * s.grain * 42;
    img.data[i] += n; img.data[i+1] += n; img.data[i+2] += n;
  }
  g.putImageData(img, 0, 0);

  // 3. optional cracks (tileable wrap not attempted; keep density low)
  if (s.crackDensity) { /* random walks with 1px dark strokes */ }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;  // ground DOES minify -> mipmaps help
  t.generateMipmaps = true;
  t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return t;
}
```

Note the deliberate difference from sprites: **ground planes recede into the distance, so they genuinely minify** — give them mipmaps and anisotropy. Sprites never minify below 1:1, so they get neither.

Per-encounter ground specs to author:

| Diorama | base | ramp | grain | patchScale | cracks |
|---|---|---|---|---|---|
| Besaid beach | `#e8d9a8` | `#d6c48c, #f2e6bd, #c9b478` | 0.30 | 5 | — |
| Mi'ihen Highroad | `#b9a179` | `#9e8763, #cdb891, #8c7654` | 0.42 | 7 | 0.10 |
| Macalania ice | `#cfe4f2` | `#a9cde6, #eaf6ff, #8fbcda` | 0.18 | 4 | 0.22 |
| Via Purifico stone | `#5b6472` | `#454d59, #77808e, #39404a` | 0.35 | 6 | 0.35 |
| Bevelle / Vegnagun deck | `#8a8f9e` | `#6d7280, #a9aebb, #5a5f6c` | 0.25 | 8 | 0.08 |
| Sin's interior | `#4a3b52` | `#33283a, #6a5675, #261d2c` | 0.48 | 5 | 0.18 |

### 2.12 Skybox / gradient background

A `BackSide` sphere with a world-direction gradient shader. Preferred over `scene.background = CanvasTexture` because it gives you per-encounter control of horizon position, banding, and a cheap sun/moon disc without extra draw calls.

```ts
const SkyShader = {
  uniforms: {
    uTop:    { value: new THREE.Color('#12204a') },
    uMid:    { value: new THREE.Color('#3f6ea8') },
    uBottom: { value: new THREE.Color('#d9c48e') },
    uHorizon:{ value: 0.42 },   // 0..1 where mid sits
    uSharp:  { value: 1.6 },    // gradient contrast
    uBands:  { value: 0.0 },    // >0 quantises to N steps for a poster/HD-2D look
  },
  vertexShader: `
    varying vec3 vDir;
    void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform vec3 uTop, uMid, uBottom; uniform float uHorizon, uSharp, uBands;
    varying vec3 vDir;
    void main() {
      float h = vDir.y * 0.5 + 0.5;                    // 0 = straight down, 1 = straight up
      if (uBands > 0.5) h = floor(h * uBands) / uBands;
      float a = smoothstep(uHorizon, 1.0, pow(h, uSharp));
      float b = smoothstep(0.0, uHorizon, h);
      vec3 c = mix(uBottom, uMid, b);
      c = mix(c, uTop, a);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(120, 24, 16),
  new THREE.ShaderMaterial({ ...SkyShader, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }),
);
sky.renderOrder = -1;
scene.add(sky);
```

Set `uBands` to `12` or `16` for the deliberately posterised skies that read as painted backdrops — a strong HD-2D cue. [estimate]

### 2.13 Scene assembly checklist (ordering matters)

1. `sky` mesh, `renderOrder = -1`, `depthWrite: false`
2. Ground plane(s), opaque, `renderOrder = 0`
3. Diorama props: billboards (opaque, alphaTest) + a few extruded boxes for depth parallax
4. Shadow blobs, `transparent`, `renderOrder = 1`
5. Character/enemy billboards, opaque (alphaTest) — depth-sorted by the GPU
6. FX billboards and `Points` systems, `transparent`, `renderOrder = 10..20`
7. Damage-number billboards, `transparent`, `renderOrder = 30`, `depthTest: false` (always on top)
8. CTB timeline, HP bars, menus: **DOM overlay** at integer scale, not WebGL — crisper text, accessible, easier to test. **See §2.13a for the full decision and its reconciliation with visual-bible §3.9 / §6.1.**

Lighting: `MeshBasicMaterial` throughout for sprites means **no lights are needed at all** for them. Add one `AmbientLight(0xffffff, 1)` + one `DirectionalLight` only if you use `MeshLambertMaterial` on the extruded diorama geometry for cheap form shading.

### 2.13a UI rendering path — decided: two surfaces, DOM for screen-space

`visual-bible.md` §3.9 mandates pre-rasterising all UI text to a bitmap atlas at 3× drawn with nearest filtering, and §6.1 budgets 1024×1024 UI atlas pages; item 8 above mandates a DOM overlay. Those are two different rendering paths with different layout units, different scaling behaviour and different test assertions. `[CONFLICT RESOLVED]` The resolution is **not** "pick one" — it is that the two documents were describing two different surfaces.

| Surface | What lives there | Path | Why |
|---|---|---|---|
| **World-space** | damage / healing / MISS numerals, crit bursts, the X-2 chain-counter popup, target reticles that ride an actor's head, aeon-arrival banners | **Canvas texture on a billboard inside the WebGL scene**, exactly as §1.5 already specifies | They must depth-sort against sprites, receive bloom and the grade pass, and arc in 3D. DOM cannot do any of that. |
| **Screen-space** | CTB / Act List, command window, party status window, ATB gauges, Garment Grid wheel, help window, target list, victory screen, title and chapter select | **DOM overlay `#ui-root`** at integer scale | Crisp text at any resolution, real focus order and ARIA for accessibility, `toHaveText` assertions instead of pixel diffs, and no re-authoring of visual-bible §3's coordinates. |

visual-bible §3.9's "pre-rasterise at 3× with nearest" therefore **still governs the world-space surface** — that is precisely the damage-numeral atlas — and is **withdrawn for the screen-space surface**. §6.1's "UI atlas pages 1024×1024 at 3×" survives too, but as a **CSS sprite sheet** rather than a WebGL texture: the same PNG, referenced by DOM nodes through `background-image` / `background-position` (and `border-image` for 9-slice window chrome). Nothing that was authored is thrown away; only its consumer changes.

#### The integer-scale contract

This is what makes DOM text crisp and keeps visual-bible §3's pixel-exact coordinates valid **unchanged**.

```css
:root {
  --u: 3px;                 /* ONE logical pixel. Set from JS. Always an integer count of device px. */
  --ui-w: 640; --ui-h: 360; /* the design canvas from visual-bible §3.0 */
}
#ui-root {
  position: absolute; inset: 0; margin: auto;
  width:  calc(var(--u) * var(--ui-w));
  height: calc(var(--u) * var(--ui-h));
  pointer-events: none;                 /* the WebGL canvas keeps the pointer by default */
  image-rendering: pixelated;           /* chrome/icons upscale by nearest */
  font-family: 'Jost', system-ui, sans-serif;
  font-size: calc(var(--u) * 10);       /* visual-bible §3.9 body size, 10 logical px */
  line-height: 1.4;
  font-variant-numeric: tabular-lining; /* §3.9: counters must not jitter while rolling */
}
#ui-root .interactive { pointer-events: auto; }
.window {                                /* 9-slice from the CSS sprite sheet */
  border-image: url('/assets/ui/chrome.png') 4 fill / calc(var(--u) * 4) / 0 repeat;
}
```

```ts
// One integer scale, recomputed on resize. No fractional scaling, ever.
function applyUiScale() {
  const n = Math.max(1, Math.floor(Math.min(innerWidth / 640, innerHeight / 360)));
  document.documentElement.style.setProperty('--u', `${n}px`);
}
```

| Viewport | `--u` | UI box | Note |
|---|---:|---|---|
| 1280 × 720 | **2** | 1280 × 720 | the Playwright viewport (§5.3 lever 4) — exact fit |
| 1920 × 1080 | **3** | 1920 × 1080 | exact fit; matches visual-bible §3.9's "3×" |
| 2560 × 1440 | **4** | 2560 × 1440 | exact fit |
| 3840 × 2160 | **6** | 3840 × 2160 | exact fit |
| 1366 × 768 | **2** | 1280 × 720 | letterboxed, centred by `margin: auto` |
| < 640 × 360 | **1** | 640 × 360 | clipped; the touch layout (§2A.6) reflows instead |

**No `transform: scale()`.** Scaling by a custom property means every length, font size and border is an integer count of device pixels computed by the layout engine, so there is no re-rasterisation question, no compositing-layer blur, and Playwright's box-model assertions return the numbers the spec predicts. `image-rendering: pixelated` is defined as nearest-neighbour that "upscales to the nearest integer multiple first"; at an integer `--u` that first step *is* the final step, so chrome and icons are exactly nearest-filtered. It applies to background images as well as `<img>`. `[verified: 2 sources — MDN image-rendering; CSS Images Module Level 3]`

#### What we deliberately do not use

**`CSS2DRenderer` is not used.** It has no depth occlusion against WebGL objects and runs a second render pipeline synchronised by hand. `[verified: single source — threejs.org CSS2DRenderer docs]` Our screen-space UI never needs a 3D anchor, and everything that *does* need one is already a depth-sorted canvas-texture billboard (§1.5, §2.13 item 7). If a future element needs both DOM text and 3D anchoring, project the world position with `Vector3.project()` and set `left`/`top` in logical units yourself — a dozen lines, fully testable, no extra renderer.

#### Consequences for §5 (testing)

§5.3 already scopes screenshots to `#game-canvas` **or `#ui-root`** — that split was written for exactly this architecture and needs no change. The additions are:

| Concern | Assertion |
|---|---|
| UI text content | `await expect(page.locator('#ui-root .ctb-list')).toContainText('Auron')` — no pixel diff, no flake |
| UI geometry | `expect((await page.locator('#ui-root .cmd-window').boundingBox())!.x).toBe(24 * 2)` at `--u: 2` — visual-bible §3's logical coordinates times the scale, exactly |
| UI appearance | element-scoped `toHaveScreenshot('#ui-root')` after `document.fonts.ready` (§5.3 lever 5) |
| World-space numerals | element-scoped `toHaveScreenshot('#game-canvas')` — these are texels, so they use the WebGL tolerance (`maxDiffPixelRatio: 0.02`), not the DOM tolerance |
| Scale integrity | a unit test over the viewport table above: `uiScale(w, h)` returns the listed integer and never 0 or a fraction |
| Accessibility | `#ui-root` passes an axe scan; every `.interactive` node is reachable by `Tab` (which is why §2A.2 leaves `Tab` unbound) |

#### Cost accepted

DOM text carries greyscale antialiasing, which is not pixel art. We accept it, for the same reason §1.5 accepts `LinearFilter` on damage text: browser-rendered glyphs already have grey edges and forcing nearest on them produces crawling. The §3.9 hard 1 px shadow (`1px 1px 0 #08101E`, expressed as `calc(var(--u)*1)`) restores most of the chunky read. If a specific element must be genuinely pixel-perfect — the chapter-select card titles, say — bake *that element* into the CSS sprite sheet as an image and leave the rest as text. `[estimate — rendering judgement, same trade as §1.5]`

---

## 2A. Input mapping — PS2 buttons → keyboard, gamepad, touch

> **Why this section exists.** Every Overdrive minigame and both party-management systems in `ffx-combat-core.md` / `ffx2-combat-core.md` are specified in PS2 button terms (L1, R1, ○, ✕, △, □, D-pad, right stick) with millisecond timing windows. This section is the single normative bridge from those specifications to a browser build. **Nothing in `src/` may reference a physical key, a gamepad index, or a PS2 glyph directly** — game code sees only the abstract actions in §2A.1.

### 2A.1 The abstract action layer

15 actions. This is the complete set; the five encounters need nothing else.

| Action id | Semantic role | PS2 | Xbox / standard pad |
|---|---|---|---|
| `dir.up` / `dir.down` / `dir.left` / `dir.right` | menu navigation, target cycling, Bushido sequence symbols | D-pad ↑↓←→ | D-pad |
| `face.south` | **Confirm.** Swordplay timing press, Slots reel stop, Lady Luck reel stop, Bushido symbol ✕ | **✕** | **A** |
| `face.east` | **Cancel / back.** Bushido symbol ○ | **○** | **B** |
| `face.west` | Bushido symbol □; secondary menu action (Sort / Compare) | **□** | **X** |
| `face.north` | Bushido symbol △; opens the Help window over a highlighted command | **△** | **Y** |
| `shoulder.left` | **Party overlay.** FFX: opens the reserve-roster list (the `Switch` command, rank 3 — `ffx-combat-core.md` §1.7). FFX-2: opens the Garment Grid / **Spherechange** wheel. Bushido symbol L1 | **L1** | **LB** |
| `shoulder.right` | **Fire.** Gunner's **Trigger Happy** mash. Bushido symbol R1 | **R1** | **RB** |
| `trigger.left` / `trigger.right` | camera orbit in the diorama viewer; unused in combat | L2 / R2 | LT / RT |
| `menu.start` | pause / system menu | Start | Menu |
| `menu.select` | toggle the persistent Help window | Select | View |
| `rot` (analog, not a button) | **Fury.** Continuous signed-angle accumulator | right stick | right stick |

`shoulder.left` is deliberately one action for two games: **L1 is Switch in FFX and Spherechange in FFX-2**, and the two never coexist in one encounter, so the binding is context-dispatched by the active rules module. `[verified: 2 sources — ffx2-combat-core.md §status (Curse "disables the L1 Garment Grid menu", Itchy "must spherechange (L1)"), each itself 2-sourced; ffx-combat-core.md §1.7 Switch]`. The specific claim that FFX's Switch is reached by **L1** rather than by a visible menu row is `[single source]` — but it does not matter mechanically, because the overlay is ours to place; the *command* and its rank-3 cost are the verified part.

### 2A.2 Default bindings

Keyboard bindings are stored and compared as **`KeyboardEvent.code`**, never `.key` — `code` is the layout-independent physical key, so the layout stays a diamond on AZERTY and Dvorak. `[verified: 2 sources — MDN "Keyboard event code values", MDN KeyboardEvent.code]`

| Action | Keyboard primary | Keyboard alt | Gamepad (`mapping === "standard"`) |
|---|---|---|---|
| `dir.up` | `KeyW` | `ArrowUp` | `buttons[12]` **or** `axes[1] < −0.5` |
| `dir.down` | `KeyS` | `ArrowDown` | `buttons[13]` **or** `axes[1] > 0.5` |
| `dir.left` | `KeyA` | `ArrowLeft` | `buttons[14]` **or** `axes[0] < −0.5` |
| `dir.right` | `KeyD` | `ArrowRight` | `buttons[15]` **or** `axes[0] > 0.5` |
| `face.north` (△/Y) | `KeyI` | — | `buttons[3]` |
| `face.west` (□/X) | `KeyJ` | — | `buttons[2]` |
| `face.south` (✕/A) | `KeyK` | `Space`, `Enter` | `buttons[0]` |
| `face.east` (○/B) | `KeyL` | `Backspace` | `buttons[1]` |
| `shoulder.left` (L1/LB) | `KeyU` | `KeyQ` | `buttons[4]` |
| `shoulder.right` (R1/RB) | `KeyO` | `KeyE` | `buttons[5]` |
| `trigger.left` (L2/LT) | `KeyY` | — | `buttons[6]` (use `.value`, threshold 0.35) |
| `trigger.right` (R2/RT) | `KeyP` | — | `buttons[7]` (use `.value`, threshold 0.35) |
| `menu.select` | `KeyH` | — | `buttons[8]` |
| `menu.start` | `Escape` | — | `buttons[9]` |
| `rot` | `KeyA` ⇄ `KeyD` alternation | circular pointer drag | `axes[2]`, `axes[3]` |

The gamepad indices are the **W3C Standard Gamepad** layout, not a guess: `buttons[4]` is specified as "top left front button" (L1/LB), `buttons[5]` "top right front button" (R1/RB), `buttons[12..15]` the D-pad cluster, `axes[0..1]` the left stick and `axes[2..3]` the right stick, each in `−1.0 … 1.0`. Only trust these when `gamepad.mapping === "standard"`; otherwise fall back to keyboard and show the remap screen. `[verified: 2 sources — W3C Gamepad spec §remapping; MDN "Using the Gamepad API"]`

**Layout rationale** `[estimate]`: the face buttons sit on `I`/`J`/`K`/`L` — a literal diamond under the right hand in the same spatial arrangement as △□✕○ — and the two shoulders sit directly above them on `U` and `O`. That is what makes a seven-symbol Bushido prompt like `↑ L1 ↓ R1 → ← △` readable without a legend. The left hand keeps `WASD` for directions. `Escape` is **not** also bound to cancel (that is `Backspace`) so that `Escape` can unambiguously mean "pause". `Tab` is deliberately left unbound so browser focus navigation through the DOM UI overlay (§2.13a) still works for keyboard and screen-reader users.

### 2A.3 Button prompts — how the glyphs are surfaced

The prompt widget renders **the currently bound control**, never a hard-coded PS2 glyph. One component, `<ButtonPrompt action="face.south">`, resolves through the active binding profile:

| Detected device | Glyph shown for `face.south` | Source of the glyph |
|---|---|---|
| Keyboard (no pad seen) | a drawn key-cap containing the `code`'s display label (`K`) | 16×16 UI icon, §3.5 |
| Standard pad, generic | neutral shape set: filled circle / cross / square / triangle, outlined, no brand styling | 16×16 UI icon |
| Standard pad, Xbox-family `gamepad.id` | letter-in-circle `A` `B` `X` `Y`, `LB` `RB` in a rounded rect | 16×16 UI icon |
| Standard pad, Sony-family `gamepad.id` | **generic geometric shapes only** — see the legal note below | 16×16 UI icon |

Device family is sniffed from `gamepad.id` (substring match on `Xbox`, `XInput`, `045e` for Microsoft; `DualSense`, `DualShock`, `054c` for Sony) and cached; it re-evaluates on `gamepadconnected`. The Gamepad API fires `gamepadconnected` / `gamepaddisconnected` and returns an empty list until a user gesture on the pad, so the prompt set must be able to change **mid-battle** without a reload. `[verified: 2 sources — W3C Gamepad spec (getGamepads returns empty until a gamepad user gesture); MDN "Using the Gamepad API"]`

> **Legal note (extends §0).** The stylised PlayStation ✕ ○ □ △ face-button symbols and the Xbox button art are trademarked device marks. Draw **generic, unstyled geometry** — a plain cross, a plain ring, a plain square, a plain triangle, in our own palette and outline weight — and never trace or embed a first-party glyph font or icon pack. In running prose and in the research docs it is fine to *write* "○/✕"; it is the shipped raster glyph that must be original. `[estimate — applies the §0 no-retail-assets rule to input iconography]`

Bushido sequences are displayed as a **row of these prompt glyphs**, left to right, with consumed symbols dimmed to `ink-3` and the next expected symbol at full brightness with a 1 px `--od-gold` ring. The row is authored from the sequence data in `ffx-combat-core.md` §5.5 with no per-symbol art of its own.

### 2A.4 What a "ms timing window" means in a browser

This is the part that makes the quoted millisecond values executable.

| Fact | Value | Consequence |
|---|---|---|
| Sim step | fixed **60 Hz**, 16.667 ms | The normative unit for every window is **frames**; ms are shown for reference at 60 Hz |
| Keyboard event timestamp | `KeyboardEvent.timeStamp`, a `DOMHighResTimeStamp` on the `performance.now()` timeline, coarsened to **100 µs** (non-isolated) or **5 µs** (cross-origin-isolated) | Keyboard presses are, for our purposes, *exact*: the coarsening is ~1/167th of a frame `[verified: 2 sources — MDN Performance.now(), MDN DOMHighResTimeStamp]` |
| Gamepad press timestamp | **none** — the Gamepad API has no button events. State is polled | A pad press is only observed at the next poll: worst case **1 frame** late, mean **½ frame** `[verified: 2 sources — MDN "Using the Gamepad API"; W3C Gamepad spec]` |
| Fairness compensation | **+1 frame (16.7 ms) grace** added to the *late* edge of every timing window when the resolving input came from a gamepad | Without it, pad players are measurably worse at Swordplay than keyboard players `[estimate — follows directly from the polling asymmetry above]` |
| Minimum authorable window | **4 frames (66.7 ms)** | Anything narrower is not reliably hittable once the grace frame is added |
| OS key auto-repeat | `keydown` fires repeatedly while a key is held; `KeyboardEvent.repeat === true` on every event after the first | **Mandatory:** mash minigames must discard `event.repeat` events, or holding `KeyO` would out-fire any human `[verified: 2 sources — MDN KeyboardEvent.repeat; W3C UI Events]` |

**Architecture.** One `InputSource` polls the pad inside the same fixed-step loop that drives the sim, and keyboard/pointer listeners push into the same queue. Every entry is `{ action, phase: 'down'|'up', simTime, device }` where `simTime` comes from the **injected `Clock` of §5.4**, never from `performance.now()` — this is what keeps §5.3 lever 2 (deterministic clock) true for input as well as animation. Replaying a recorded queue against the same seed must reproduce a battle exactly.

```ts
// src/input/source.ts — shape only; game code never sees this type
export interface InputEvent { action: ActionId; phase: 'down' | 'up'; simTime: number; device: 'kbd' | 'pad' | 'touch'; }
export interface AnalogSample { simTime: number; x: number; y: number; }   // right stick, for `rot`
```

### 2A.5 Per-minigame input specification

All timers below are the verified in-game values from the combat-core documents; everything marked `[estimate]` is a browser-side detail those documents do not carry.

| Minigame | Source timer | Input | Browser spec |
|---|---|---|---|
| **Swordplay** (Tidus) | **3 000 ms** `[verified: 2 sources — ffx-combat-core §5.2 OD_TIMERS + wiki]` | `face.south` once | A 192-logical-px bar; the cursor sweeps left→right→left with a **1 200 ms one-way period** (so 2.5 passes fit the timer). The success zone is centred. Zone widths and their dwell times, narrowing per Overdrive exactly as the source describes: Spiral Cut **40 px / 250 ms / 15 f**, Slice & Dice **28 px / 175 ms / 10 f**, Energy Rain **20 px / 125 ms / 8 f**, Blitz Ace **12 px / 75 ms / 5 f**. Press outside ⇒ the "fail" ability row. `[estimate — widths are ours; the "zone narrows for stronger Overdrives" rule and the fail-row behaviour are `[verified: 2 sources]` in ffx-combat-core §5.3]` |
| **Bushido** (Auron) | **4 000 ms** `[verified: 2 sources]` | 6–8 symbols from `{dir.*, shoulder.left, shoulder.right, face.*}` | Sequence data comes verbatim from ffx-combat-core §5.5. Symbols must be entered **in order**. A wrong symbol is **ignored** (no instant fail) but costs a **200 ms / 12 f lockout** during which further input is dropped — this is what makes the remaining-time bonus (§5.2) the real skill test rather than a fail switch. Timer expiry ⇒ the "(Fail)" row. `[estimate — the ignore-and-lockout rule; the 4 000 ms timer, the ordered sequences and the Fail/Immune rows are `[verified: 2 sources]`]` |
| **Slots** (Wakka) | **20 000 ms** `[verified: 2 sources]` | `face.south` ×3, one per reel | Three reels spin simultaneously; each advances one symbol every **120 ms (7 f)**. Press *n* freezes reel *n* on the symbol displayed on that frame. A press is only accepted **≥ 4 frames** after the previous one, so a single bounced key cannot stop two reels. Unstopped reels at timer expiry stop themselves left-to-right over 3 frames. `[estimate — advance rate and debounce; the 3-reel/20 s/press-to-stop structure is `[verified: 2 sources — jegged.com Slots; ffx-combat-core §5.6]`]` |
| **Fury** (Lulu) | **~4 000 ms**, no time bonus `[verified: 2 sources — ffx-combat-core §5.6a; jegged.com Fury "the timer will always count down to zero"]` | `rot` | Accumulate **signed angle** θ from the right stick: per frame compute `atan2(axes[3], axes[2])`, take the delta, **discard frames whose stick magnitude < 0.35** (deadzone) and **clamp any single-frame delta to ±90°** (rejects stick teleports and wrap artefacts). Cast *n* fires when cumulative clockwise θ passes `req(n)`. Cap **16 casts** `[verified: 2 sources]`. Requirement growth (the source says only "the required rotation size grows with Lulu's Magic stat and with the number of rotations already made, and a rotation can become 720°"): `req(n) = clamp(360 + 45·n + 3·(MAG − 20), 360, 720)` degrees `[estimate — the 360→720 range and both growth terms are verified; the coefficients are ours, chosen so a level-appropriate Lulu (MAG ≈ 40–60) reaches the 720° ceiling at around cast 5–9, which matches the observed "high-Magic Lulu gets fewer casts per rotation" behaviour]`. **Keyboard equivalent:** each valid `KeyA`→`KeyD`→`KeyA` alternation contributes **180°**; a repeat of the same key contributes nothing. **Pointer equivalent:** circular drag inside a 96-logical-px ring widget, same signed-angle accumulator. All three paths feed one counter, so the three input devices are mechanically equal. |
| **Trigger Happy** (X-2 Gunner) | **1 800 / 2 200 / 2 600 ms** at Lv.1 / 2 / 3 `[verified: 2 sources — ffx2-combat-core §Gunner]` | `shoulder.right` mash | Count rising edges only. **Discard `KeyboardEvent.repeat === true`.** Per-shot cooldown **90 ms (≈5.4 f)** ⇒ hard ceilings of **20 / 24 / 28** shots `[estimate — cooldown is ours; the "one shot per R1 press, subject to a per-shot cooldown/animation" rule is `[verified: 2 sources]`]`. Each shot self-chains (X-2 chain counter). While Trigger Happy runs the player may still issue commands for the other two girls, and **if two characters are running it at once one `shoulder.right` press fires for both** — implement as a broadcast to every active mash context, not a per-actor binding `[verified: 2 sources — ffx2-combat-core §Gunner]`. Minigame-local alias: `Space` and `KeyE` also fire, because `face.south` is idle during the window `[estimate — ergonomics]`. |
| **Reels** (X-2 Lady Luck) | no published timer | `face.south` ×3 | The three slots **begin spinning in a random order** and the player presses `face.south` three times, one per reel `[verified: 2 sources — ffx2-combat-core §Lady Luck]`. Same 120 ms advance and 4-frame debounce as Slots. Add a **10 000 ms safety timeout** that auto-stops the remaining reels, so an idle player cannot hang the battle `[estimate — no source gives a timer]`. |
| **Spherechange** (X-2) | none — it is a menu | `shoulder.left` | Opens the Garment Grid wheel (visual-bible §4.5). Disabled while **Curse** is active; **forced** while **Itchy** is active (only `shoulder.left` and Escape remain available) `[verified: 2 sources — ffx2-combat-core §status]`. The wheel is DOM (§2.13a), navigated with `dir.*` and confirmed with `face.south`. |
| **Switch** (FFX) | none — it is a rank-3 command | `shoulder.left` | Opens the reserve-roster overlay on an active member's turn; the incoming member **takes the turn in progress** `[verified: 2 sources — ffx-combat-core §1.7]`. Disabled in underwater battles `[verified: 2 sources]`. |

### 2A.6 Remapping, touch, and assists

| Item | Spec |
|---|---|
| **Remap UI** | A settings screen listing the 15 actions; "press any key or button" capture; writes `{[ActionId]: {codes: string[], pad: number[]}}` to `localStorage` under `pyrefly.bindings.v1`. Conflicts are rejected with an inline message rather than silently overwriting. |
| **Reset** | One "restore defaults" button; the default profile is a frozen constant, not the current state. |
| **Touch / pointer** | Optional on-screen layer, auto-enabled when `navigator.maxTouchPoints > 0` and no pad is present: an 8-way pad on the left, the four face buttons on the right in the same diamond, `L1`/`R1` above them, and a **rotation ring** for Fury. Every target ≥ **44 × 44 CSS px** — comfortably above the WCAG 2.2 SC 2.5.8 (AA) floor of **24 × 24 CSS px** `[verified: single source — W3C WCAG 2.2 Understanding 2.5.8]`, and sized for the AAA target instead `[estimate]`. |
| **Assist: hold-to-fire** | Toggle. While on, holding `shoulder.right` fires Trigger Happy at the 90 ms cooldown rate. Removes the mashing requirement without changing the shot ceiling. `[estimate — accessibility addition, not from the games]` |
| **Assist: auto-rotate** | Toggle. While on, holding any `rot` input accumulates 360°/s, so Fury needs one held direction rather than a rotation. `[estimate]` |
| **Assist: widen windows** | Toggle, ×2 on every zone width and lockout in §2A.5. Recorded in the run's metadata so screenshot baselines never mix modes. `[estimate]` |
| **Never** | Do not make any minigame require simultaneous chords, sub-4-frame precision, or an analog stick with no digital equivalent. Every action in §2A.1 is reachable from a keyboard alone. |

### 2A.7 Testing input

Playwright drives the keyboard path; the gamepad path is driven by the debug API, because Playwright cannot synthesise a `Gamepad`.

```ts
// Bushido: Dragon Fang is ↓ ← ↑ → L1 R1 ○ ✕  (ffx-combat-core §5.5)
const DRAGON_FANG = ['KeyS','KeyA','KeyW','KeyD','KeyU','KeyO','KeyL','KeyK'];
for (const code of DRAGON_FANG) await page.keyboard.press(code, { delay: 20 });
```

`page.keyboard.press()` accepts `code`-style names (`KeyA`, `ArrowLeft`, `Digit1`, `Escape`) and a `delay` option in ms between `keydown` and `keyup`; `keyboard.down()` called twice sets the repeat flag, which is exactly the auto-repeat case the mash guard must reject. `[verified: single source — playwright.dev Keyboard class]`

Add to the `window.__pyrefly` debug API of §5.4:

```ts
  // ---- input ----
  input(action: ActionId, phase: 'down' | 'up', atSimTime?: number): void;  // inject at an exact sim time
  analog(x: number, y: number, atSimTime?: number): void;                   // inject a `rot` sample
  bindings(): Record<ActionId, { codes: string[]; pad: number[] }>;
  setDevice(d: 'kbd' | 'pad' | 'touch'): void;                              // forces the prompt glyph set
```

| Test | Asserts |
|---|---|
| `input-bindings.test.ts` (Vitest) | every `ActionId` has ≥ 1 keyboard code; no code is bound to two actions; the default profile round-trips through `localStorage` |
| `input-timing.test.ts` (Vitest) | injecting `face.south` at the exact centre frame of a Swordplay zone resolves the success row; one frame outside the zone + grace resolves the fail row; the gamepad grace frame applies only to `device: 'pad'` |
| `input-mash.test.ts` (Vitest) | 40 `down` events inside 1 800 ms with a 90 ms cooldown yield exactly 20 shots; events with `repeat` set yield 0 |
| `input-fury.test.ts` (Vitest) | a synthetic 8-samples-per-revolution analog stream produces the expected cast count at MAG 20 and MAG 60; a single-frame 179° jump is clamped, not counted |
| `bushido.spec.ts` (Playwright) | the on-screen prompt row dims exactly one glyph per correct press and none per wrong press |
| `prompts.spec.ts` (Playwright) | `setDevice('pad')` then `setDevice('kbd')` swaps every visible glyph without a reload |

---

## 3. Pixel-sprite authoring pipeline for LLM agents

### 3.1 Design goals

An implementation agent cannot draw. It can write structured text and it can `Read` a PNG. The pipeline must therefore be: **text in → PNG out → upscaled preview the agent reads → agent edits text → repeat.**

Two authoring formats, both compiling to the same indexed-colour buffer:

- **Format A — `.pxl` glyph grid.** Direct, exact, best for ≤ 64×64 and for hand-tuning faces, icons, and UI. One character per pixel.
- **Format B — `.shape.json` op list.** Compact, best for ≥ 64×64 bodies and bosses where a 96×128 glyph grid is unreadable and unwieldy in a diff. Includes mirror, outline, shade, and dither ops so the agent describes *form* rather than every pixel.

Both are plain text, diff-friendly, and reviewable.

### 3.2 Format A — `.pxl` glyph grid

```
@name    tidus_idle
@size    48 64
@pivot   24 63
@cell    48 64
@palette
  .  none
  K  #14102a      ; outline
  k  #2a2350      ; shadow line
  s  #f4d5a8      ; skin
  S  #c79b6e      ; skin shade
  h  #f3c352      ; hair
  H  #c28f2a      ; hair shade
  b  #2d5fa8      ; jacket blue
  B  #1b3d73      ; jacket shade
  y  #ffe9a8      ; highlight
  r  #b8412f      ; belt red
@rows
................KKKKKK..........................
..............KKhhhhhhKK........................
............KKhhhhhhhhhhKK......................
...........KhhhhhHHHHhhhhhK.....................
(… 64 rows total, each exactly 48 chars …)
```

Rules the parser enforces (and errors loudly on):
- `@size W H` must equal the row count and every row's length. Mismatch = hard error naming the offending row index and its length.
- `.` is always the transparent index. Every other glyph must appear in `@palette`.
- Palette entries are `<glyph><spaces><#rrggbb|none>` with an optional `; comment`.
- Glyphs are case-sensitive ASCII; convention is **lowercase = base tone, uppercase = shade tone, `K` = outline, `y` = highlight.**
- Multi-frame sheets: repeat `@rows` blocks separated by `@frame <clip> <index>` headers; the renderer lays them out per §2.7.

### 3.3 Format B — `.shape.json` op list

```jsonc
{
  "name": "seymour_flux_idle",
  "size": [96, 128],
  "pivot": [48, 127],
  "palette": {
    "out":  "#0e0a1c",
    "robe": "#3a2a6e", "robeS": "#241a49", "robeH": "#5f4aa8",
    "skin": "#e8d6c0", "skinS": "#b99f86",
    "hair": "#7fb4d8", "hairS": "#4d7ea3",
    "glow": "#9de8ff", "bone": "#e6e2d2", "boneS": "#b3ad98"
  },
  "ops": [
    { "op": "ellipse", "cx": 48, "cy": 34, "rx": 11, "ry": 13, "fill": "skin" },
    { "op": "poly",    "pts": [[30,48],[48,40],[66,48],[70,110],[26,110]], "fill": "robe" },
    { "op": "rect",    "x": 44, "y": 46, "w": 8, "h": 40, "fill": "robeH" },
    { "op": "poly",    "pts": [[66,52],[92,30],[88,72]], "fill": "bone" },
    { "op": "mirrorX", "about": 48, "from": "bone" },
    { "op": "line",    "a": [48,86], "b": [48,118], "w": 2, "fill": "glow" },
    { "op": "noise",   "region": [26,90,70,110], "fill": "robeS", "density": 0.22, "seed": 7 },
    { "op": "dither",  "region": [26,70,70,100], "a": "robe", "b": "robeS", "pattern": "bayer2" },
    { "op": "shade",   "light": [-1,-1], "map": { "robe": "robeS", "skin": "skinS", "bone": "boneS", "hair": "hairS" }, "depth": 2 },
    { "op": "outline", "color": "out", "mode": 8 },
    { "op": "highlight", "light": [-1,-1], "map": { "robe": "robeH" }, "depth": 1 }
  ]
}
```

**Op reference:**

| Op | Fields | Semantics |
|---|---|---|
| `rect` | `x y w h fill` | axis-aligned fill, inclusive of `x..x+w-1` |
| `ellipse` | `cx cy rx ry fill` | midpoint ellipse, filled, no AA |
| `poly` | `pts[] fill` | even-odd scanline fill, integer vertices |
| `line` | `a b w fill` | Bresenham, `w` px thick (square brush) |
| `noise` | `region fill density seed` | deterministic speckle inside the rect, only over non-transparent pixels |
| `dither` | `region a b pattern` | replaces `a` with `b` on the pattern lattice (`bayer2`, `bayer4`, `checker`, `diag`) |
| `mirrorX` | `about from?` | mirrors pixels (optionally only those of index `from`) across a vertical axis |
| `mirrorY` | `about from?` | as above, horizontal axis |
| `shade` | `light[2] map depth` | for each mapped colour, pixels within `depth` of the silhouette edge *away* from `light` become the mapped shade colour |
| `highlight` | `light[2] map depth` | same, on the lit side |
| `outline` | `color mode(4\|8)` | adds a 1px border of `color` on transparent pixels adjacent to any opaque pixel |
| `translate` | `dx dy` | shifts everything drawn so far |
| `replace` | `from to` | global palette index swap (cheap recolour for a second frame) |

**Op order is significant and the canonical order is:** geometry → `mirror` → `noise`/`dither` → `shade` → `highlight` → `outline`. Outline last, always, or shading eats the outline.

### 3.4 Renderer — `tools/render-sprites.mjs` (pngjs, zero native deps)

**`pngjs` over `canvas`:** `pngjs` is a pure-JavaScript PNG encoder/decoder with no dependencies and no compilation step, so it installs on Windows with no build toolchain. `node-canvas` is Cairo-backed and requires native system libraries; v2+ ships prebuilt binaries for Windows but still recommends a working build environment, and prebuilds routinely go stale against new Node majors. For a pipeline whose entire output is indexed-colour rectangles, a full Cairo canvas buys us nothing. [verified: 2 sources — pngjs README/npm, Automattic/node-canvas README]

**Decision: `pngjs@7.0.0`. Do not add `canvas`.** [decision]

```js
// tools/render-sprites.mjs
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const SRC = 'assets/sprites/src';     // .pxl and .shape.json live here
const OUT = 'public/assets/sprites';  // shipped PNGs
const PRV = 'critic/sprites';         // upscaled previews + contact sheets (gitignored)

// ---- core buffer -------------------------------------------------------
class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Int16Array(w * h).fill(-1); } // -1 = transparent
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? -1 : this.px[y * this.w + x]; }
  set(x, y, i) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = i; }
}

// ---- encode ------------------------------------------------------------
function encode(buf, palette /* array of [r,g,b] | null */, scale = 1) {
  const png = new PNG({ width: buf.w * scale, height: buf.h * scale });
  for (let y = 0; y < buf.h * scale; y++) {
    for (let x = 0; x < buf.w * scale; x++) {
      const i = buf.get((x / scale) | 0, (y / scale) | 0);
      const o = (y * png.width + x) << 2;
      if (i < 0) { png.data[o] = png.data[o+1] = png.data[o+2] = png.data[o+3] = 0; continue; }
      const [r, g, b] = palette[i];
      png.data[o] = r; png.data[o+1] = g; png.data[o+2] = b; png.data[o+3] = 255; // BINARY alpha only
    }
  }
  return PNG.sync.write(png, { colorType: 6, deflateLevel: 9 });
}

// ---- .pxl parser -------------------------------------------------------
function parsePxl(text) { /* @directives, palette map, fixed-width rows; hard-errors on ragged rows */ }
// ---- .shape.json rasterizer -------------------------------------------
function rasterShape(doc) { /* apply ops in order onto a Buf; see §3.3 op table */ }

// ---- main --------------------------------------------------------------
mkdirSync(OUT, { recursive: true }); mkdirSync(PRV, { recursive: true });
for (const f of readdirSync(SRC)) {
  const name = basename(f).replace(/\.(pxl|shape\.json)$/, '');
  const raw = readFileSync(join(SRC, f), 'utf8');
  const { buf, palette } = f.endsWith('.pxl') ? parsePxl(raw) : rasterShape(JSON.parse(raw));
  writeFileSync(join(OUT, `${name}.png`), encode(buf, palette, 1));    // shipped, 1:1
  writeFileSync(join(PRV, `${name}.x6.png`), encode(buf, palette, 6)); // agent-readable preview
  console.log(`✓ ${name}  ${buf.w}x${buf.h}`);
}
```

**Why `scale = 6` for the preview:** a 48×64 sprite becomes 288×384 — large enough that an agent reading the PNG can actually judge silhouette, shading direction, and outline integrity, while staying well under any image-size limit. Use `scale = 4` for sheets ≥ 128px wide.

**Also emit a contact sheet** (`critic/sprites/_contact.png`): all previews tiled 4-across with 8px gutters, so one `Read` shows the whole cast and palette consistency problems jump out.

### 3.5 Sprite and palette sizing standards

**Authority note.** `visual-bible.md` §0.4 derives every cell size from published in-fiction heights via `body_px = round(height_cm × 0.343)`, and gives a per-boss framing table. An earlier revision of this section flattened all party characters to 48×64 and all bosses to 96×128 / 192×192. Those flat numbers are **withdrawn**: a sheet authored at one size cannot be indexed by an animator expecting the other, and Kimahri and every boss had two different canvases. `[CONFLICT RESOLVED — visual-bible §0.4 wins because it has a stated derivation and per-boss framing; this section now restates it so there is one table, not two]`

#### Party, NPC and prop cells

| Asset class | Cell (px) | Pivot | Palette budget | Notes |
|---|---|---|---:|---|
| Party — Tidus, Yuna (FFX & X-2), Lulu, Rikku (FFX & X-2), Paine, Shuyin, Lenne | **48 × 64** | `(24, 63)` | ≤ 24 | feet centred on the bottom row |
| Party — **Auron, Wakka** (and Seymour as a humanoid) | **56 × 72** | `(28, 71)` | ≤ 24 | |
| Party — **Kimahri** | **64 × 80** | `(32, 79)` | ≤ 24 | the only 64-wide party rig |
| Character portrait (dialogue, CTB face icon) | 64 × 64 | centre | ≤ 20 | 1–2 frames (talk blink) |
| Small fiend | 48 × 48 | bottom centre | ≤ 16 | boss clip rows, §2.7 |
| Medium fiend / Guado guard | 64 × 80 | bottom centre | ≤ 18 | |
| Prop billboard (rock, banner, cairn, pillar) | 32–128 | bottom centre | ≤ 12 | |
| FX frame (slash, spell burst, pyrefly puff) | 64 × 64 | centre | ≤ 10 | additive; bright and few |
| UI icon (element, status, ability, **button prompt** §2A.3) | 16 × 16 | — | ≤ 6 | |
| UI icon large (dressphere, aeon crest) | 32 × 32 | — | ≤ 10 | |
| Sphere-grid node | 16 × 16 | — | 5 | 2 frames (dim / lit) |

#### Boss and aeon cells — restated from visual-bible §0.4

Use the **boss clip rows** of §2.7 (6 rows), not the ten-row party sheet. Any sheet wider than 2048 px pages per §2.7.

| Boss / aeon | Sprite height (px) | **Cell** | Sheet at 6 cols | Pages |
|---|---:|---|---|---:|
| Seymour Flux (rider only) | 80 | 96 × 96 | 576 × 576 | 1 |
| Mortiorchis (mount) | 120 | 192 × 160 | 1152 × 960 | 1 |
| Yunalesca form 1 | 72 | 96 × 96 | 576 × 576 | 1 |
| Yunalesca form 2 | 112 | 128 × 128 | 768 × 768 | 1 |
| Yunalesca form 3 | 176 | 224 × 192 | 1344 × 1152 | 1 |
| Braska's Final Aeon f1 | 160 | 192 × 192 | 1152 × 1152 | 1 |
| Braska's Final Aeon f2 | 176 | 208 × 208 | 1248 × 1248 | 1 |
| Yu Pagoda (×2) | 56 | 64 × 64 | 384 × 384 | 1 |
| Jecht (human, cutscene) | 62 | 48 × 64 | 288 × 384 | 1 |
| Yu Yevon | 96 | 128 × 128 | 768 × 768 | 1 |
| FFX-2 Bahamut | 168 | 192 × 192 | 1152 × 1152 | 1 |
| Vegnagun (leg) | 240 | 256 × 256 | 1536 × 1536 | 1 |
| **Vegnagun (head / cannon)** | 288 | **384 × 320** | 2304 × 1920 → **paged** | **2** (5 + 1 cols) |
| Shuyin (boss) | 60 | 48 × 64 | 288 × 384 | 1 — same rig as Tidus |
| Valefor | 110 | 160 × 128 | 960 × 768 | 1 |
| Ifrit | 120 | 128 × 128 | 768 × 768 | 1 |
| Ixion | 100 | 160 × 128 | 960 × 768 | 1 |
| Shiva | 96 | 96 × 128 | 576 × 768 | 1 |
| Bahamut (FFX) | 150 | 192 × 192 | 1152 × 1152 | 1 |
| Anima | 200 | 160 × 256 | 960 × 1536 | 1 |
| Yojimbo (+ Daigoro 24 px) | 84 | 96 × 96 | 576 × 576 | 1 |

Colossal parts (Vegnagun, Braska's Final Aeon) should still be split into 2–3 layered billboards for parallax; the cell above is the **composite framing**, and each layer is authored at the same cell with transparency.

### 3.5a The master palette — `assets/sprites/master-palette.json`

`visual-bible.md` §1 specifies hundreds of per-character hex ramps that were not derived from any master palette, and §0.5 defines a separate 9-token "master scene-neutral palette". This section previously mandated a 48-colour master ramp and a build-failing lint against it, but never defined the palette — so the lint would have rejected every sprite authored from the visual bible's own colour tables. `[CONFLICT RESOLVED]`

The resolution is a **two-tier palette**, and §0.5's nine tokens turn out to be a **named subset of the master**, not a competitor:

| Tier | What | Budget | Enforced by |
|---|---|---|---|
| **Master** | the 48 colours below. Shared by every sprite in the game. | 48 | hard lint |
| **Signature** | a per-sprite extension file, `assets/sprites/palettes/<name>.json`, holding the colours from that character's visual-bible §1 table that the master cannot carry | ≤ 8 for a party/humanoid sprite, ≤ 16 for a boss | hard lint on count, soft lint on harmony |
| **Free** | `#FFFFFF` (catchlights) and full transparency | 2 | always legal, not counted |

#### The 48

**10 material families × 4 steps (shade / base / light / rim) + 8 accents.** The 4-step ramp is not a change: `visual-bible.md` §0.3 already specifies "Palette ramp per material — 4 steps: shadow / base / light / rim". The earlier "8 families × 5 steps" shape is withdrawn in its favour, and the freed slots buy a green family and an earth family, both of which the five encounters need and neither of which the old eight covered. 45 of the 48 are **verbatim hexes already used in visual-bible §1** (most of them among its highest-frequency colours); the three exceptions are marked.

| # | Family | shade | base | light | rim |
|---:|---|---|---|---|---|
| 0 | `skin` | `#A9714A` | `#E8B48A` | `#F0C4A2` | `#FFD2AC` |
| 1 | `red` (warm cloth, haori, blood) | `#7E1F22` | `#B02A2A` ← `--blood` | `#C93A42` | `#F06060` |
| 2 | `gold` (blond hair, obi, brass, Yevon) | `#7E5626` | `#B08418` | `#E3B94A` ← `--yevon-gold` | `#FFF0A8` |
| 3 | `blue` (cool cloth, water, FFX chrome) | `#1B3A6B` | `#2E5A9E` | `#4E86C8` | `#8FD0F0` |
| 4 | `violet` (hakama, X-2 chrome, arcane cloth) | `#3A1A4E` | `#5E3C7E` | `#7A4FA6` | `#B8A0F0` |
| 5 | `green` (foliage, moss, Al Bhed olive) | `#22421F` † | `#3D6B33` † | `#75913A` | `#A2BC62` |
| 6 | `metal` (steel, silver, chrome, **Paine's hair**) | `#3A4456` | `#7B8290` | `#9BA3AD` | `#C9CFD6` |
| 7 | `stone` (rock, bone, ivory, paper) | `#8A7E6E` † | `#B9B3A4` | `#E9E3D2` | `#F4F1E8` ← `--paper` |
| 8 | `ink` (outline, near-black cloth, **Lulu's hair**) | `#0B0A12` ← `--ink` | `#1A1526` ← `--ink-soft` | `#2A3246` | `#4E5A70` |
| 9 | `earth` (leather, wood, hide, brown hair) | `#2A1A12` † | `#4E3418` | `#7A4B2E` | `#A9762E` |

| # | Accent | Hex | Role |
|---:|---|---|---|
| 40 | `pyre-green` | `#8BE8B0` | pyrefly core (Spira) — `--pyre-green` |
| 41 | `pyre-white` | `#E9FFF4` | pyrefly hot core — `--pyre-white` |
| 42 | `pyre-pink` | `#F7B6D9` | Farplane pyrefly variant — `--pyre-pink` |
| 43 | `od-gold` | `#F2C21E` | Overdrive gauge, target reticle, sparks (the single most-used hex in the visual bible) |
| 44 | `arcane` | `#B048F0` | Seymour / dark magic / Vegnagun charge |
| 45 | `x2-magenta` | `#B0489E` | FFX-2 window chrome |
| 46 | `emerald` | `#4FB05E` | healing, Al Bhed machina glow |
| 47 | `flame` | `#F2712E` | fire VFX, HP-danger tier |

† `#22421F`, `#3D6B33`, `#8A7E6E`, `#2A1A12` are derived (they close ramps the visual bible left open-ended), not lifted verbatim. `[estimate]` Everything else is a verbatim visual-bible hex. The whole table is `[estimate]` as *colour values* — Square Enix has published no palette data for either game (visual-bible §7 item 10) — but the family structure and the derivation rules are `[verified: single source — visual-bible §0.3 house rules]`.

**`--spira-sky` `#7FC6E8`** is the one §0.5 token not in the 48; it is within ΔE 5 of `blue.rim` `#8FD0F0` and snaps there. Every other §0.5 token is present verbatim and is marked with a `←` above.

```jsonc
// assets/sprites/master-palette.json — the file the lint reads
{
  "families": {
    "skin":   ["#A9714A","#E8B48A","#F0C4A2","#FFD2AC"],
    "red":    ["#7E1F22","#B02A2A","#C93A42","#F06060"],
    "gold":   ["#7E5626","#B08418","#E3B94A","#FFF0A8"],
    "blue":   ["#1B3A6B","#2E5A9E","#4E86C8","#8FD0F0"],
    "violet": ["#3A1A4E","#5E3C7E","#7A4FA6","#B8A0F0"],
    "green":  ["#22421F","#3D6B33","#75913A","#A2BC62"],
    "metal":  ["#3A4456","#7B8290","#9BA3AD","#C9CFD6"],
    "stone":  ["#8A7E6E","#B9B3A4","#E9E3D2","#F4F1E8"],
    "ink":    ["#0B0A12","#1A1526","#2A3246","#4E5A70"],
    "earth":  ["#2A1A12","#4E3418","#7A4B2E","#A9762E"]
  },
  "accents": {
    "pyre-green":"#8BE8B0", "pyre-white":"#E9FFF4", "pyre-pink":"#F7B6D9",
    "od-gold":"#F2C21E", "arcane":"#B048F0", "x2-magenta":"#B0489E",
    "emerald":"#4FB05E", "flame":"#F2712E"
  },
  "free": ["#FFFFFF"],
  "tokens": {
    "--ink":"ink.0", "--ink-soft":"ink.1", "--paper":"stone.3",
    "--yevon-gold":"gold.2", "--blood":"red.1",
    "--pyre-green":"accents.pyre-green", "--pyre-white":"accents.pyre-white",
    "--pyre-pink":"accents.pyre-pink",
    "--spira-sky":"blue.3"
  }
}
```

#### How much of the visual bible this actually covers

Measured over all **592 distinct hexes** in `visual-bible.md` (excluding `#FFFFFF`/`#000000`), nearest-master distance in CIE L\*a\*b\* (ΔE76):

| ΔE ≤ | Colours covered | Share |
|---:|---:|---:|
| 6 | 191 | 32 % |
| 8 | 311 | 53 % |
| **10** | **392** | **66 %** |
| 12 | 463 | 78 % |
| **15** | **525** | **89 %** |
| 20 | 572 | 97 % |
| max | — | **30** |

`[verified: computed, reproducible — the script is `tools/palette-coverage.mjs`; re-run it after any palette edit and paste the new table here]`

**ΔE ≤ 10 is the snap threshold** and **ΔE > 10 is what the signature palette is for.** The residual clusters, in order of size, are exactly what you would expect from the character sheets: **rose / mauve** (Yuna's FFX pink sleeves `#A9556B` `#EC8FAE`, FFX-2 chrome `#C46A8E` `#B5486E` — worst case ΔE 28), **teal** (Yuna's staff gem `#3E9E96`, X-2 machina `#3ECBBC` — ΔE 25–30), and a thin **yellow-green** edge (`#A8D84A`). Those three groups are the first claim on every sprite's 8-entry signature quota.

#### The lint — `tools/render-sprites.mjs`

Replaces the old "fails if a sprite uses a colour outside the master palette" rule, which was unsatisfiable.

| Check | Level | Rule |
|---|---|---|
| Total colour count | **error** | ≤ 24 for a party/humanoid/portrait sprite, ≤ 40 for a boss, ≤ the class budget in the §3.5 table for everything else. These are `visual-bible.md` §0.3's caps; this document's earlier "12–24, hard cap 32" is withdrawn. `[CONFLICT RESOLVED]` |
| Membership | **error** | Every colour is in the master 48, in that sprite's registered signature file, or `#FFFFFF`. An unregistered colour is a build failure with a suggested nearest master entry in the message. |
| Signature size | **error** | ≤ 8 entries (party/humanoid/FX/UI), ≤ 16 (boss). |
| Signature harmony | **warning** | Each signature colour must sit within **ΔE 30** of some master entry, and must not be within **ΔE 6** of one (if it is that close, use the master entry — this is what stops 40 near-duplicate skins). |
| Outline | **error** | The selective outline colour must be `ink.0` or `ink.1`. |
| Light direction | **advisory** | A per-sprite `"light": [-1,-1]` field is required in the manifest and is only checked by the agent's own review pass. |
| Cell size | **error** | The PNG's dimensions must equal `cols × cellW` by `rows × cellH` from `<name>.sheet.json`, and the cell must match this section's table for that asset class. |

The signature files are what make "40 sprites drawn by different agent invocations look like one game" achievable rather than aspirational: two thirds of every sprite's colours are literally the same bytes, the outline and the shadow ramps are always the same bytes, and the divergence is capped at 8 colours that a human can eyeball in one screen.

### 3.6 Agent iteration loop (put this in `CLAUDE.md`)

1. Write or edit `assets/sprites/src/<name>.pxl` (or `.shape.json`).
2. Run `npm run sprites`.
3. `Read` `critic/sprites/<name>.x6.png`.
4. Check against the rubric below; edit the text; repeat. Budget **3–5 iterations** per sprite before moving on.

**Review rubric (agent self-check):**
- Silhouette readable as a solid black shape? (temporarily add `{"op":"replace","from":"*","to":"out"}` to test.)
- Outline complete — no gaps where the body touches the canvas edge?
- Light direction consistent (project convention: **upper-left, `[-1,-1]`**) across every sprite?
- No isolated single pixels (visual noise) unless deliberate sparkle.
- Feet pivot exactly on the bottom row so ground contact is correct.
- Colour count within budget (§3.5a lint); every colour from the **master 48**, from this sprite's registered **signature file**, or `#FFFFFF`.
- Cell size matches the canonical table in §3.5, and the sheet's ten rows (six for a boss) match the row contract in §2.7.
- Does it read at 1:1? View the shipped PNG, not only the ×6 preview.

---

## 4. Music and SFX — original composition with Web Audio

### 4.1 Architecture decision: a pure-sample renderer, not a Web Audio graph

**Decision:** write the synth as a **pure TypeScript function that fills a `Float32Array`**, with no dependency on `AudioContext`. Play it in the browser by copying into an `AudioBuffer`; render it in Node by writing a WAV header. [decision]

Why not build a `OfflineAudioContext` graph and reuse it in Node via `node-web-audio-api`?

| | Pure sample renderer | Web Audio graph + `node-web-audio-api` |
|---|---|---|
| Node dependency | none | one native package (does ship prebuilt binaries for several platforms) |
| Determinism | bit-exact, always | depends on implementation; browser vs Node differ subtly |
| Browser/Node parity | identical code path | two implementations to keep in sync |
| Testability in Vitest | trivial — assert on the float array | needs an audio implementation in the test env |
| Effort | ~400 lines | ~250 lines + install risk |

`node-web-audio-api` is a real option and does implement `OfflineAudioContext` with prebuilt binaries; keep it noted as the fallback if the hand-written renderer proves limiting. [verified: 2 sources — npm node-web-audio-api, ircam-ismm/node-web-audio-api]

### 4.2 Note-data format

```ts
/** [startStep, durationSteps, midiPitch, velocity 0..1, (optional) paramA] */
export type Note = [number, number, number, number, number?];

export type InstrumentId =
  | 'pad' | 'pluck' | 'strings' | 'choir' | 'bass'
  | 'bell' | 'kick' | 'snare' | 'hat' | 'taiko' | 'cymbal';

export interface Pattern {
  id: string;
  instrument: InstrumentId;
  lengthSteps: number;      // typically 64 (4 bars of 16ths)
  notes: Note[];
  gain?: number;            // 0..1, default 1
  pan?: number;             // -1..1, default 0
}

export interface Section { name: string; patterns: string[]; repeats: number; }

export interface TrackDoc {
  title: string;
  bpm: number;
  stepsPerBeat: number;     // 4 => 16th notes
  key: string;              // e.g. "D minor" — documentation only, not enforced
  swing?: number;           // 0..0.3, offsets odd steps
  master: { gain: number; reverb: { mix: number; decay: number; predelay: number } };
  patterns: Pattern[];
  sections: Section[];      // arrangement, played in order
  loopFrom?: number;        // section index to loop back to
}
```

Stored as `assets/music/<name>.track.json`. MIDI pitch is standard (60 = C4). Percussion instruments ignore pitch except `taiko` (pitch shifts the drop) and `snare` (pitch tunes the body).

### 4.3 Instruments — synthesis recipes

All are additive/subtractive DSP written directly into the sample buffer. Each instrument is `(note, sampleRate, out, offsetSamples, rng) => void`.

| Instrument | Oscillators | Filter | Envelope (A/D/S/R, seconds) | Extras |
|---|---|---|---|---|
| **pad** | 3 × saw, detuned `0, ±7 cents`, + 1 saw at −12 st @ 0.4 gain | 2-pole lowpass, cutoff `800 + 1200·vel` Hz, env-modulated +40% over A | `0.9 / 1.6 / 0.55 / 2.4` | slow 0.12 Hz cutoff LFO ±15%; stereo spread via ±9 ms haas |
| **pluck** | 1 triangle + 1 square @ 0.25 gain, detune ±4 cents | 1-pole lowpass at `1400 + 3000·vel`, decays to 600 Hz over D | `0.004 / 0.28 / 0.0 / 0.12` | tiny noise burst (3 ms) at onset for the "pick"; this is the workhorse melodic voice |
| **strings** | 5 × saw, detune `0, ±6, ±13 cents`, stagger onsets 0–18 ms | 2-pole lowpass `1200 + 1800·vel` | `0.22 / 0.5 / 0.7 / 0.55` | 5.2 Hz vibrato, depth 7 cents, delayed 0.35 s; per-voice random phase |
| **choir** | 4 × saw through 3 fixed formant band-passes (`F1 700, F2 1150, F3 2600` Hz, Q 8/9/10) | formant bank, then lowpass 4 kHz | `0.35 / 0.6 / 0.75 / 0.9` | breath = pink noise at 0.06 gain, band-passed 900 Hz; 4.4 Hz vibrato depth 11 cents; wide stereo |
| **bass** | 1 sine + 1 saw @ 0.3, sub sine at −12 st | lowpass 420 Hz | `0.006 / 0.25 / 0.6 / 0.15` | soft clip `tanh(x*1.6)` |
| **bell** | 6 sines at partials `1, 2.01, 3.03, 4.17, 5.43, 6.79`, gains `1,.6,.4,.25,.15,.1` | — | per-partial exp decay, higher partials decay faster (`τ = 2.4 / p`) | the Sending / pyrefly voice |
| **kick** | sine, pitch `120 → 45` Hz over 55 ms (exponential) | — | `0.001 / 0.22 / 0 / 0.02` | 4 ms click of HP noise |
| **snare** | white noise + sine @ 190 Hz @ 0.35 | band-pass 1.6 kHz Q 1.1 | `0.001 / 0.14 / 0 / 0.04` | |
| **hat** | white noise | high-pass 7 kHz | `0.001 / 0.045 / 0 / 0.01` (closed) · `0.001 / 0.28 …` (open, `paramA = 1`) | |
| **taiko** | sine, pitch `pitch·1.9 → pitch·0.8` over 90 ms | — | `0.002 / 0.45 / 0 / 0.1` | + 60 ms noise body @ 0.25, band-pass 400 Hz; the Spira battle-drum voice |
| **cymbal** | 8 inharmonic square partials (ratios `1, 1.41, 1.73, 2.24, 2.83, 3.16, 3.87, 4.47`) | high-pass 3 kHz | `0.002 / 1.6 / 0 / 0.4` | |

**Master chain (applied after mixdown):** a simple Schroeder reverb (4 comb filters at 1557/1617/1491/1422 samples scaled to sample rate, feedback from `decay`; 2 all-passes at 225/556), then `tanh` soft clip, then `master.gain`. Predelay as a plain sample offset.

### 4.4 Offline WAV rendering — `tools/render-music.mjs`

Zero dependencies. The WAV writer is ~30 lines.

```js
// tools/render-music.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderTrack } from '../src/audio/render.js';   // the SAME code the browser runs

const SR = 44100;

function wav(L, R, sampleRate = SR) {
  const n = L.length, bytes = n * 4;                 // 2ch * 16-bit
  const buf = Buffer.alloc(44 + bytes);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + bytes, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);                          // PCM
  buf.writeUInt16LE(2, 22);                          // channels
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);             // byte rate
  buf.writeUInt16LE(4, 32);                          // block align
  buf.writeUInt16LE(16, 34);                         // bits
  buf.write('data', 36); buf.writeUInt32LE(bytes, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, L[i])) * 32767;
    const r = Math.max(-1, Math.min(1, R[i])) * 32767;
    buf.writeInt16LE(l | 0, 44 + i * 4);
    buf.writeInt16LE(r | 0, 46 + i * 4);
  }
  return buf;
}

mkdirSync('critic/music', { recursive: true });
for (const f of readdirSync('assets/music').filter(f => f.endsWith('.track.json'))) {
  const doc = JSON.parse(readFileSync(join('assets/music', f), 'utf8'));
  const { L, R, seconds } = renderTrack(doc, SR);
  writeFileSync(join('critic/music', f.replace('.track.json', '.wav')), wav(L, R));
  console.log(`♪ ${doc.title}  ${seconds.toFixed(1)}s  ${doc.bpm}bpm`);
}
```

The agent cannot *listen* to the WAV. So also emit a **spectrogram/waveform PNG** via `pngjs` (`critic/music/<name>.png`) so structure is at least visually reviewable — section boundaries, dynamic arc, whether the mix clips. Render: top half = peak waveform envelope, bottom half = a coarse 64-bin magnitude spectrogram from a naive DFT every 512 samples. That is enough for an agent to spot "the bridge is empty", "everything clips", or "the arrangement never changes".

Humans review by ear from `critic/music/*.wav`.

### 4.5 Browser playback

```ts
export async function playTrack(ctx: AudioContext, doc: TrackDoc) {
  const { L, R, seconds } = renderTrack(doc, ctx.sampleRate);   // identical function
  const ab = ctx.createBuffer(2, L.length, ctx.sampleRate);
  ab.copyToChannel(L, 0); ab.copyToChannel(R, 1);
  const src = ctx.createBufferSource();
  src.buffer = ab; src.loop = true;
  if (doc.loopFrom !== undefined) { src.loopStart = sectionStartSeconds(doc, doc.loopFrom); src.loopEnd = seconds; }
  const g = ctx.createGain(); g.gain.value = doc.master.gain;
  src.connect(g).connect(ctx.destination);
  src.start();
  return { src, gain: g };
}
```

Render each track **once at boot into a cached `AudioBuffer`** (a 90 s stereo track at 48 kHz is ~34 MB of float; downsample the cache to 32 kHz mono-ish stems if memory bites). Cross-fade between tracks with two `GainNode`s over 1.2 s.

**Autoplay:** browsers require a user gesture. Create the `AudioContext` on the title-screen "Press Start" click and never before. In Playwright, stub it (§5.5).

### 4.6 SFX — synthesised, same engine

Combat SFX are one-shot `TrackDoc`s with a single 1–3 step pattern, rendered at boot. No files to ship.

| SFX | Recipe |
|---|---|
| Menu move | `pluck`, C6, 40 ms, lowpass 3 kHz |
| Menu confirm | `bell`, G5 + D6, 260 ms |
| Menu cancel | `pluck`, F4 → falling, 120 ms |
| Physical hit | `snare` + `taiko` layered, 90 ms, band-pass 900 Hz |
| Critical | above + `cymbal` 400 ms + a rising 8-partial sweep |
| Fire spell | pink noise, band-pass sweeping 400 → 2500 Hz over 350 ms, + `taiko` |
| Ice spell | `bell` cluster (minor 2nds), + noise HP 6 kHz shimmer |
| Thunder | noise burst, low-passed 900 Hz, 3 random retriggers over 500 ms |
| Water | noise, band-pass 300 Hz with 6 Hz LFO, 600 ms |
| Cure | `choir` 3-note rising arpeggio, 700 ms, heavy reverb |
| KO | `bell` descending minor 3rd + `pad` swell down |
| Pyrefly burst | `bell` at 6 random pitches over 900 ms, additive, wide stereo |
| CTB turn tick | `hat` closed, 30 ms, quiet |
| Overdrive charge full | rising `pad` + `bell`, 1.4 s |

### 4.7 Mood references — and the hard rule about melody

> **NEVER reproduce, transcribe, approximate, or "reinterpret" any melody, countermelody, bassline, chord progression, or distinctive rhythmic figure from the Final Fantasy X or X-2 soundtracks.** Do not feed any FFX/X-2 audio or sheet music into any tool that generates our music. Do not name our tracks after theirs. If a composition starts to sound recognisably like a real track, discard it and start over. The reference table below exists to communicate **mood, tempo, instrumentation and energy only.**

FFX OST composers: **Nobuo Uematsu** (51 tracks), **Masashi Hamauzu** (20), **Junya Nakano** (18) — the first mainline FF where Uematsu was not sole composer. [verified: 2 sources — Wikipedia FFX:OST, Final Fantasy Wiki]
FFX-2 OST composers: **Noriko Matsueda** and **Takahito Eguchi**, released on 2 CDs in 2003 by Avex. [verified: 2 sources — Wikipedia Music of FFX-2, VGMdb album 1581]

| Reference (mood only) | Where it sits | Mood target for our original track | Our working title | BPM | Key feel | Lead instruments |
|---|---|---|---|---|---|---|
| "Battle Theme" (D1 T9, Uematsu) / "Enemy Attack" (D1 T16, Nakano) | routine encounters | urgent but *light*; propulsive, not heavy; resolves quickly | `spira_skirmish` | 148 | D minor, modal | `pluck` lead, `taiko` + `hat`, `bass`, thin `strings` |
| "Challenge" (D4 T10, Hamauzu) | mid-tier boss | driving, rhythmic, slightly jazzy/irregular; harmonically restless | `tideturn` | 158 | A minor, chromatic bass | `pluck` + `bass` interplay, busy drums, `pad` stabs |
| "Fight With Seymour" (D4 T15, Uematsu) | Seymour fights | grand, dread-tinged, choir-forward, organ weight | `hollow_prayer` | 132 | C# minor | `choir` lead, `pad` organ-ish, `taiko`, `bell` |
| "Otherworld" (D1 T5, Uematsu) | opening / Sin | aggressive, distorted, rock-adjacent, blunt | `undertow` | 138 | E minor, pedal drone | heavily-clipped `bass`, `cymbal`, `snare`, no `choir` |
| "Final Battle" (D3 T18, Hamauzu) | last fight | enormous; long crescendo; thematic recall of our own earlier motifs | `the_last_summoning` | 96 → 144 | D minor → D | full ensemble, `choir` + `strings` + `taiko` |
| "A Contest of Aeons" (D3 T19, Nakano) | aeon duel | ceremonial, percussive, ritual | `rite_of_aeons` | 124 | F# minor | `taiko` front, `choir` pads, sparse `bell` |
| "Suteki Da Ne" (D3 T21) | reflective interludes | fragile, folk-adjacent, sparse | `stillwater` | 72 | G major | solo `pluck`, `pad` bed, `bell` |
| FFX-2 "Yuna's Ballad" | X-2 reflective | warmer, poppier, major-key, brighter production | `gullwing_sky` | 98 | E♭ major | `pluck` + `bell`, light kit, `strings` |
| FFX-2 "1000 Words" | X-2 emotional peak | soaring ballad, big strings, wide stereo | `thousandfold` | 76 | B♭ major | `strings` + `choir`, `pad`, no drums until the last third |
| FFX-2 Vegnagun material | X-2 final fight | mechanical, relentless, metallic, industrial | `engine_of_the_deep` | 168 | F minor, ostinato | detuned `pad` drone, `bass` ostinato, `snare` + `cymbal`, metallic `bell` |

Each of the five encounters needs: **1 battle track, 1 pre-fight scene bed, 1 victory sting (4–6 s), 1 defeat sting (3 s).** That is 5×2 loops + 10 stings = manageable.

---

## 5. Testing

### 5.1 `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,               // WebGL contexts are expensive; serial is more deterministic
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,        // WebGL rendering variance across GPUs/drivers
      animations: 'disabled',
      scale: 'css',
      threshold: 0.2,
    },
  },
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,             // MUST be 1; matches renderer.setPixelRatio(1)
    colorScheme: 'dark',
    timezoneId: 'UTC',
    locale: 'en-US',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-webgl',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',          // NEW headless mode — real Chromium, compositor + GPU process
        launchOptions: { args: CHROMIUM_WEBGL_ARGS },
      },
    },
  ],
});
```

### 5.2 Chromium flags for WebGL in headless

```ts
export const CHROMIUM_WEBGL_ARGS = [
  // --- required: Chrome no longer auto-falls-back to software WebGL ---
  '--enable-unsafe-swiftshader',
  // --- deterministic CPU rasterisation: identical output on every machine ---
  '--use-gl=angle',
  '--use-angle=swiftshader',
  // --- stability in CI containers ---
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu-sandbox',
  // --- determinism ---
  '--disable-lcd-text',
  '--force-device-scale-factor=1',
  '--disable-partial-raster',
  '--disable-skia-runtime-opts',
  '--deterministic-mode',
  '--run-all-compositor-stages-before-draw',
  '--disable-new-content-rendering-timeout',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--hide-scrollbars',
  '--mute-audio',
];
```

Key facts behind these choices:

| Flag / choice | Why | Confidence |
|---|---|---|
| `--enable-unsafe-swiftshader` | Automatic fallback to SwiftShader-backed WebGL is **deprecated** (warned in DevTools since Chrome 130) and requires explicit opt-in; without it, headless machines with no GPU get a null WebGL context | [verified: 2 sources — Chromium `docs/gpu/swiftshader.md`, chromestatus "Remove SwiftShader fallback"] |
| `--use-angle=swiftshader` | CPU rasterisation → **byte-identical output across machines**, which is what makes screenshot baselines viable. Slow (single-digit fps) but our tests are step-driven, not real-time | [verified: 2 sources — Chromium swiftshader docs, createit blog] |
| `channel: 'chromium'` (not the default headless shell) | Playwright ships `chromium-headless-shell` (old headless) by default; the `chromium` channel opts into **new headless**, the real binary with compositor and GPU process, which is what has proper WebGL support. Available since Playwright v1.49 | [verified: 2 sources — playwright.dev/docs/browsers, microsoft/playwright#33566] |
| `--use-angle=gl` (alternative) | If you have a real GPU and want speed over determinism, `--use-angle=gl` gives hardware acceleration (one report: 8 fps → 60 fps). Use this for a local `--project=chromium-gpu` variant, **never** for screenshot baselines | [verified: 2 sources — createit blog, michelkraemer.com] |
| `maxDiffPixelRatio: 0.02` | The widely recommended WebGL tolerance (vs `0.01` for 2D canvas), because different GPUs and OS versions render slightly differently | [verified: 2 sources — testdino playwright-skill canvas-and-webgl.md, bug0 guide] |

Provide a second project for local GPU runs:

```ts
{ name: 'chromium-gpu', use: { channel: 'chromium',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] } } }
```

### 5.3 Deterministic screenshots

Six things must be pinned. Missing any one produces flaky baselines.

| # | Lever | How |
|---|---|---|
| 1 | **RNG** | Single seeded `mulberry32`. `window.__pyrefly.seed(n)` reseeds *everything* — combat, particles, procedural textures. No `Math.random()` anywhere in `src/` (add an ESLint/grep guard in CI). |
| 2 | **Clock** | No `performance.now()`, no `Date.now()`, no bare `requestAnimationFrame` in game code. All time flows from an injectable `Clock` (§5.4). Also call `await page.clock.setFixedTime(...)` for anything that escapes. |
| 3 | **Pixel ratio** | `renderer.setPixelRatio(1)` + `deviceScaleFactor: 1` + `--force-device-scale-factor=1`. All three. |
| 4 | **Viewport** | Fixed `1280 × 720`. The game letterboxes to its design size, so the WebGL canvas is always exactly 1280×720 regardless of window. |
| 5 | **Fonts** | Self-hosted (§1.4). Await `document.fonts.ready` before signalling render-ready, or text metrics shift between runs. |
| 6 | **Render-ready signal** | Never `waitForTimeout`. Expose an explicit signal and wait for it. |

```ts
// tests/e2e/helpers.ts
export async function gotoEncounter(page: Page, id: string, seed = 12345) {
  await page.goto('/?test=1');
  await page.waitForFunction(() => (window as any).__pyrefly?.ready === true);
  await page.evaluate(([id, seed]) => (window as any).__pyrefly.goto(id, { seed }), [id, seed] as const);
  await page.waitForFunction(() => document.body.dataset.pyreflyState === 'idle');
  await page.evaluate(() => (window as any).__pyrefly.renderOnce());
  await page.waitForFunction(() => (window as any).__pyrefly.frameSettled === true);
}

test('seymour flux — opening frame', async ({ page }) => {
  await gotoEncounter(page, 'seymour-flux');
  await expect(page.locator('#game-canvas')).toHaveScreenshot('seymour-flux-open.png');
});
```

Also verify WebGL actually came up, so a driver regression fails loudly rather than producing a black baseline:

```ts
const ok = await page.evaluate(() => {
  const c = document.querySelector('canvas') as HTMLCanvasElement;
  return !!(c.getContext('webgl2') || c.getContext('webgl'));
});
expect(ok, 'WebGL context must be available').toBe(true);
```

Scope screenshots to `#game-canvas` (or the `#ui-root` overlay), **never** full-page — element-scoped shots are markedly more stable. [verified: testdino playwright-skill]

### 5.4 `window.__pyrefly` debug API

Exposed only when `import.meta.env.DEV || new URLSearchParams(location.search).has('test')`. Tree-shaken out of the public production build.

```ts
export interface PyreflyDebug {
  // ---- lifecycle ----
  readonly ready: boolean;
  readonly version: string;
  readonly frame: number;              // monotonic simulated frame counter
  readonly frameSettled: boolean;      // true once renderOnce() has fully drawn

  // ---- determinism ----
  seed(n: number): void;               // reseed ALL RNG streams
  setTime(seconds: number): void;      // absolute simulated time; drives every animation
  advance(seconds: number): void;      // step the sim by dt, no rAF involved
  stepFrames(n: number, dt?: number): void;  // default dt = 1/60

  // ---- input (§2A.4) ----
  input(action: ActionId, phase: 'down' | 'up', atSimTime?: number): void;  // inject at an exact sim time
  analog(x: number, y: number, atSimTime?: number): void;                   // inject a `rot` sample for Fury
  bindings(): Record<ActionId, { codes: string[]; pad: number[] }>;
  setDevice(d: 'kbd' | 'pad' | 'touch'): void;                              // forces the prompt glyph set
  inputLog(): ReadonlyArray<{ action: ActionId; phase: string; simTime: number; device: string }>;

  // ---- navigation ----
  goto(encounter: EncounterId, o?: { seed?: number; phase?: number; skipIntro?: boolean }): Promise<void>;
  skipScene(): void;

  // ---- combat inspection / control ----
  state(): SerializedBattleState;      // plain JSON: actors, HP/MP, CTB queue, statuses, RNG counter
  ctb(): Array<{ actor: string; ticks: number }>;
  act(cmd: DebugCommand): Promise<void>;   // { actor, kind:'attack'|'ability'|'item'|'overdrive'|'swap', target, id }
  forceRoll(stream: 'hit'|'crit'|'damage'|'drop', values: number[]): void;  // queue deterministic rolls
  setHp(actor: string, hp: number): void;
  grantOverdrive(actor: string, amount?: number): void;
  killAll(side: 'party'|'enemy'): void;

  // ---- rendering ----
  pauseRender(): void;
  resumeRender(): void;
  renderOnce(): Promise<void>;         // resolves after the composer has drawn one full frame
  setCameraPreset(name: string): void;
  fxDisable(kinds?: Array<'bloom'|'tilt'|'grade'|'particles'|'shake'>): void;

  // ---- audio ----
  muteAudio(): void;                   // tests always call this

  // ---- observability ----
  readonly log: ReadonlyArray<{ t: number; tag: string; msg: string; data?: unknown }>;
  clearLog(): void;
  readonly errors: ReadonlyArray<string>;
}
declare global { interface Window { __pyrefly?: PyreflyDebug } }
```

Alongside it, mirror coarse state onto the DOM so Playwright can use ordinary web-first assertions with auto-waiting:

```html
<body data-pyrefly-state="boot|loading|idle|animating|menu|dialogue|victory|defeat"
      data-pyrefly-encounter="seymour-flux"
      data-pyrefly-turn="7">
```

```ts
await expect(page.locator('body')).toHaveAttribute('data-pyrefly-state', 'idle');
```

`forceRoll` is the most important entry: it lets an E2E test drive a *scripted, reproducible playthrough* ("Tidus attacks, forced non-crit, 412 damage; Seymour casts Flare on Yuna") without depending on RNG stability across engine refactors.

The clock abstraction that makes all this work:

```ts
export class Clock {
  private t = 0;
  now() { return this.t; }
  advance(dt: number) { this.t += dt; }
  set(t: number) { this.t = t; }
}
// One instance, injected into: animation, particles (uTime), camera drift,
// grade-pass uFlash, CTB timers, audio scheduling. Nothing calls performance.now().
```

### 5.5 Audio in tests

Stub before any app script runs, so the game never touches the real audio stack:

```ts
await page.addInitScript(() => {
  class FakeCtx {
    sampleRate = 44100; currentTime = 0; state = 'running'; destination = {};
    createBuffer(ch: number, len: number, sr: number) {
      return { numberOfChannels: ch, length: len, sampleRate: sr, duration: len / sr,
               copyToChannel() {}, getChannelData: () => new Float32Array(len) };
    }
    createBufferSource() { return { buffer: null, loop: false, connect: () => ({ connect() {} }), start() {}, stop() {} }; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect: () => ({ connect() {} }) }; }
    resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
  }
  (window as any).AudioContext = FakeCtx;
  (window as any).webkitAudioContext = FakeCtx;
});
```

This also removes the multi-second boot cost of rendering tracks to buffers, which otherwise dominates E2E runtime.

### 5.6 Vitest for the combat engine

The combat engine must be a **pure, headless TypeScript module** with zero imports from `three` or the DOM. That is the single design decision that makes it testable, and it is worth enforcing with an architectural test.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',           // engine is DOM-free; no jsdom needed
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    globals: false,                // explicit imports; clearer for agents reading the code
    clearMocks: true,              // Vitest 5 default; stated explicitly for clarity
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/combat/**', 'src/audio/render.ts'],
      thresholds: { lines: 85, functions: 85, branches: 75, statements: 85 },
    },
  },
});
```

Vitest 5 notes that affect us [verified: 2 sources — vitest.dev/blog/vitest-5, registry manifest]:
- Requires **Vite ≥ 6.4.0** and **Node ≥ 22.12.0**; peer allows `vite@^8`, so `vite@8.3.0` is fine.
- `clearMocks` now defaults to **`true`** — mock call history is wiped before each test. Tests that accumulated calls across cases will break.
- `vi.mock()` hoisting violations are now a **thrown error**, not a warning.
- Config lookup no longer walks up to a parent directory — keep `vitest.config.ts` at the repo root and run from there.
- Upgrade `@vitest/coverage-v8` to `5` in lockstep.
- Unawaited async assertions now **fail** the test, and `expect.poll` rejects on timeout.
- New `vi.when()` for per-argument mock behaviour; `--repeats` for flake hunting.

**Test suites to write:**

| Suite | What it pins |
|---|---|
| `ctb.test.ts` | CTB tick ordering, Agility→ICV math, Haste/Slow, turn insertion, ties |
| `damage.test.ts` | the physical/magical damage formulas against a table of known inputs/outputs from the mechanics research |
| `status.test.ts` | application chance, duration in turns vs ticks, immunity, stacking |
| `overdrive.test.ts` | charge modes, gain rates, Overdrive effects |
| `sphere-grid.test.ts` | node activation legality, stat application, lock spheres |
| `dressphere.test.ts` | X-2 garment-grid transitions, ATB interaction |
| `rng.test.ts` | `mulberry32` reproducibility; the same seed yields the same 10 000-value stream |
| `script.test.ts` | boss AI scripts: phase transitions fire at the documented HP thresholds |
| `audio-render.test.ts` | `renderTrack` is deterministic (same doc → identical Float32Array) and never clips (`max abs ≤ 1.0`) |
| `arch.test.ts` | greps `src/combat/**` for `three`, `window`, `document`, `Math.random` and fails if found; also greps all of `src/` for raw `KeyboardEvent.code` literals and `buttons[` indices outside `src/input/`, per §2A |
| `input-bindings.test.ts` | every `ActionId` has ≥ 1 keyboard code; no code bound twice; the default profile round-trips through `localStorage` (§2A.7) |
| `input-timing.test.ts` | Swordplay zone hit/miss at exact frame boundaries; the gamepad grace frame applies only to `device: 'pad'` (§2A.4) |
| `input-mash.test.ts` | Trigger Happy shot ceiling at the 90 ms cooldown; `repeat` events yield zero shots (§2A.5) |
| `input-fury.test.ts` | Fury cast counts at MAG 20 and MAG 60; a single-frame 179° jump is clamped, not counted (§2A.5) |
| `ui-scale.test.ts` | `uiScale(w, h)` returns the integers in §2.13a's viewport table and never 0 or a fraction |
| `palette.test.ts` | `master-palette.json` holds exactly 48 unique hexes; every `--token` alias in it resolves; the coverage script's ΔE table matches the one pasted in §3.5a |

---

## 6. Deployment

### 6.1 Vite base-path handling

**Recommendation: `base: './'`** — relative asset URLs. [decision]

It works unmodified for all three targets we care about: `https://<user>.github.io/<repo>/`, a custom domain at the root, and a locally-served `dist/` folder from the zip. The usual downside of relative bases (History-API routing breaks under nested paths) does not apply — this is a single-page game with no router.

Vite's documented guidance is `base: '/<REPO>/'` for a project page and `'/'` for a user/org page or custom domain. [verified: vite.dev/guide/static-deploy] `'./'` satisfies both without an environment branch.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: mode !== 'offline',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: mode === 'offline' ? undefined : { three: ['three'] },
      },
    },
  },
  plugins: mode === 'offline' ? [viteSingleFile()] : [],
  server: { port: 5173 },
  preview: { port: 4173 },
}));
```

Splitting `three` into its own chunk gives friends-on-repeat-visits a cached ~700 KB vendor chunk while the game code churns.

### 6.2 GitHub Actions → GitHub Pages

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run sprites          # regenerate PNGs from text sources
      - run: npm run music            # regenerate WAV previews (not shipped)
      - run: npm run build            # tsc --noEmit && vite build
      - run: npx playwright install --with-deps chromium
      - run: npm test                 # vitest
      - run: npm run test:e2e         # playwright
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

Action versions and the three-permission block match Vite's documented Pages workflow (`actions/checkout@v7`, `setup-node@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`). [verified: vite.dev/guide/static-deploy] Vite pins these by commit SHA in its published example; pinning by SHA is stricter and worth adopting for supply-chain hygiene.

One-time repo setup: **Settings → Pages → Source → "GitHub Actions"**.

Add a `public/.nojekyll` file so Pages does not strip files/directories beginning with `_`.

### 6.3 Downloadable zip for friends

Add an `offline` build mode that inlines everything into one HTML file via `vite-plugin-singlefile@2.3.3`.

```js
// tools/make-zip.mjs — zero-dependency zip via the OS
import { execSync } from 'node:child_process';
import { mkdirSync, cpSync, writeFileSync } from 'node:fs';

mkdirSync('release/pyrefly-reprise', { recursive: true });
cpSync('dist', 'release/pyrefly-reprise', { recursive: true });
writeFileSync('release/pyrefly-reprise/README.txt',
`Pyrefly Reprise — offline build

EASIEST: open index.html in Google Chrome.

If the page is blank, your browser is blocking local files. Then instead run,
from inside this folder:

    npx --yes serve .

and open the address it prints (usually http://localhost:3000).

Chrome is required. Unofficial non-commercial fan tribute; not affiliated with
Square Enix. All code, art, music and writing in this build are original.
See CREDITS.md for third-party fonts and sounds.
`);
execSync('powershell -NoProfile -Command "Compress-Archive -Path release/pyrefly-reprise/* -DestinationPath release/pyrefly-reprise.zip -Force"');
```

**The `file://` caveat, stated precisely:** opening an HTML file with the `file:` protocol makes cross-origin requests fail, because CORS only supports certain schemes — so a normal Vite build (which emits `<script type="module" src="./assets/...">`) will not run. Vite's own advice is to serve over HTTP via `vite preview`. [verified: 2 sources — vite.dev/guide/troubleshooting, vite-plugin-make-offline README]

`vite-plugin-singlefile` sidesteps this by inlining the script **into** the HTML, so there is nothing to fetch. If a friend still hits a blank page (browser policy varies by version), the `npx serve` fallback in the README always works. Ship both instructions and **lead with the GitHub Pages URL** — that is the zero-friction path.

Publish the zip on a tag:

```yaml
  release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: 22, cache: npm }
      - run: npm ci && npm run build:zip
      - uses: softprops/action-gh-release@v2
        with: { files: release/pyrefly-reprise.zip }
```

---

## 7. Legal third-party assets

### 7.1 Safe to include

| Asset | License | URL | Use in Pyrefly Reprise |
|---|---|---|---|
| Exo 2, Chakra Petch, Oxanium, Rajdhani, Michroma, Titillium Web, Russo One | OFL 1.1 | `fonts.google.com` / `github.com/google/fonts/tree/main/ofl/<slug>` | all UI text (§1.2) |
| Press Start 2P, Silkscreen, Pixelify Sans | OFL 1.1 | as above | pixel UI, debug HUD |
| Departure Mono | OFL | `departuremono.com` · `github.com/rektdeckard/departure-mono` | debug/console overlay |
| Kenney **UI Audio** (50 assets) | **CC0** | `kenney.nl/assets/ui-audio` | menu move/confirm/cancel, if synthesis proves fiddly |
| Kenney **Interface Sounds** | **CC0** | `kenney.nl/assets/interface-sounds` | as above |
| Kenney **Sci-fi Sounds** (70 assets) | **CC0** | `kenney.nl/assets/sci-fi-sounds` | Vegnagun / machina SFX |
| Kenney **Digital Audio** | **CC0** | `kenney.nl/assets/digital-audio` | sphere-grid / menu blips |
| Kenney **Fonts** | **CC0** | `kenney.nl/assets/kenney-fonts` | pixel font with no OFL notice obligation |
| OpenGameArt **CC0 Sound Effects** | CC0 | `opengameart.org/content/cc0-sound-effects` | general SFX |
| OpenGameArt **UI Sound Effects Pack** | CC0 (verify per file) | `opengameart.org/content/ui-sound-effects-pack` | UI |
| OpenGameArt **100 CC0 SFX** | CC0 | `opengameart.org/content/100-cc0-sfx` | general SFX |
| Freesound, filtered to CC0 | CC0 | `freesound.org` (use the CC0 license filter) | ambience, foley |
| **Sonniss GDC Game Audio Bundle** (2026: 7.47 GB, 347 WAV) | Royalty-free, no attribution required, unlimited projects, commercially usable | `gdc.sonniss.com` · archive: `sonniss.com/gameaudiogdc` | high-quality impacts, whooshes, ambience [verified: 2 sources — bedroomproducersblog.com/2026/03/16/sonniss-gdc-2026-bundle/, gdc.sonniss.com] |
| three.js | MIT | `github.com/mrdoob/three.js` | engine |
| pngjs | MIT | `github.com/pngjs/pngjs` | sprite pipeline |

**Licenses are per-file on OpenGameArt and Freesound.** Filter for CC0, then verify each individual file before shipping it, and record the source URL in `CREDITS.md`. [verified: 2 sources — OpenGameArt/Freesound license model, cinevva guide]

**Note on the OFL:** it permits embedding/bundling in commercially sold products and allows use, study, modification and redistribution, provided the fonts are not sold by themselves and Reserved Font Names are not used by derivative works. Ship the `OFL.txt` alongside each font (Fontsource packages include it). [verified: 2 sources — Wikipedia SIL OFL, Font Squirrel license page for Exo 2]

### 7.2 Explicitly forbidden

Do not include, convert, or reference:
- Any texture, sprite, model, animation, font, sound effect, voice line, or music track extracted from FFX, FFX-2, the HD Remaster, or any Square Enix title.
- The FFX/FFX-2/Final Fantasy logos, the Yoshitaka Amano logo artwork, or any Square Enix trademark as a game asset.
- Fan-made "FFX font" recreations distributed on dafont / fontmeme / font.download / DeviantArt — these are almost universally traced from the retail fonts and carry no valid license. The DeviantArt "Final Fantasy X Fonts" package and similar re-uploads are in this category. **Do not use them.** [estimate on provenance; treat as forbidden regardless]
- UI mods from Nexus Mods for FFX/X-2 — they contain or derive from retail assets.
- Anything from `public/assets/hifi/` may be a local-only experiment; it is gitignored and must never be a hard dependency of shipped code.

### 7.3 Paid assets worth knowing about (do not purchase without approval)

| Asset | Price | URL | Would help with |
|---|---|---|---|
| **Kenney Game Assets All-in-1** (60 000+ assets, 2D/3D/audio) | **$19.95 USD** (periodic 50%-off sales; has had free days) [verified: 2 sources — kenney.itch.io/kenney-game-assets, itch.io/s/136638/kenney-game-assets-all-in-1-sale] | `kenney.itch.io/kenney-game-assets` | a single bulk CC0 drop covering every SFX and UI need; the individual packs are already free on kenney.nl, so this mainly buys convenience |

Everything else on the "would substantially help" list turns out to be free: the Sonniss GDC bundle covers professional SFX at no cost, and the fonts are all OFL. **No purchase is recommended or required for this project.**

---

## 8. Open questions for the orchestrator

1. **Target frame budget / minimum hardware.** The postprocessing decision (§2.1) and bloom resolution (§2.9) assume a mid-range laptop iGPU at 1280×720. If a low-end floor matters, we should add a quality toggle that halves bloom resolution and drops the tilt-shift passes.
2. **Sprite count budget.** §3.5 implies roughly 40–60 distinct sprite sheets across five encounters. At 3–5 agent iterations each, that is the largest single cost in the project. Confirm the encounter cast lists before authoring begins.
3. **Voice/dialogue delivery.** Scene beats are text-only in this plan. If any voice is wanted it must be original recording or synthesis — never retail clips — and that is a separate pipeline.
4. **X-2 dresspheres — visual scope.** Each dressphere is effectively a full alternate sprite sheet per character. Confirm how many are in scope; the count drives §3.5's budget hard.
5. **Screenshot baselines in CI.** SwiftShader output should be machine-independent, but this needs empirical confirmation on the actual runner before baselines are committed. Plan a throwaway PR that commits baselines, then re-runs, before relying on them.
6. **`three` 0.187 and `postprocessing`.** We chose `three/addons`, so this does not bite us — but if anyone adds `postprocessing` later, its peer range `< 0.187.0` will break on the next three release.
7. **Default keyboard layout (§2A.2).** The `WASD` + `IJKL`/`UO` diamond is ours, not anything the games shipped. It is the single most opinionated decision in this document and the cheapest to change — it lives in one frozen constant. If anyone with hands on a keyboard dislikes it, change it before sprites are authored, because §2A.3's prompt glyphs are drawn from it.
8. **Assist defaults (§2A.6).** Should hold-to-fire / auto-rotate / widened windows be **on** by default? Off is faithful; on is kinder to a friend playing once in a browser tab. Recommendation: off, but offer all three on the pre-battle screen rather than burying them in settings — and record the state in the run metadata so screenshot baselines never mix modes.
9. **Signature-palette quota (§3.5a).** 8 entries for a party sprite is a measured guess from the ΔE table, not an authored result. Author Tidus, Yuna and Lulu first and re-check; if three characters all blow the quota on the rose/mauve and teal clusters, promote one of each into the master 48 by demoting two accents rather than raising the quota for everyone.

---

## Sources

**npm registry (dist-tags and manifests, all read 2026-09-15)**
- https://registry.npmjs.org/-/package/three/dist-tags
- https://registry.npmjs.org/three/0.186.0
- https://www.npmjs.com/package/three
- https://registry.npmjs.org/-/package/@types/three/dist-tags
- https://registry.npmjs.org/-/package/vite/dist-tags
- https://registry.npmjs.org/-/package/typescript/dist-tags
- https://registry.npmjs.org/-/package/vitest/dist-tags
- https://registry.npmjs.org/vitest/5.0.1
- https://registry.npmjs.org/-/package/@playwright/test/dist-tags
- https://registry.npmjs.org/-/package/postprocessing/dist-tags
- https://registry.npmjs.org/postprocessing/6.39.5
- https://registry.npmjs.org/-/package/pngjs/dist-tags
- https://registry.npmjs.org/-/package/vite-plugin-singlefile/dist-tags

**three.js**
- https://github.com/mrdoob/three.js/releases
- https://github.com/mrdoob/three.js/releases/tag/r186
- https://raw.githubusercontent.com/mrdoob/three.js/dev/package.json
- https://github.com/mrdoob/three.js/tree/dev/examples/jsm/postprocessing
- https://threejs.org/docs/pages/Texture.html
- https://threejs.org/docs/pages/UnrealBloomPass.html
- https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/UnrealBloomPass.js
- https://github.com/mrdoob/three.js/issues/1418
- https://github.com/three-types/three-ts-types/issues/2251
- https://www.npmjs.com/package/@types/three
- https://waelyasmina.net/articles/unreal-bloom-selective-threejs-post-processing/
- https://fundamental.sh/p/sprite-sheet-animation-aseprite-react-threejs
- https://threejsfundamentals.org/threejs/lessons/threejs-billboards.html
- https://discourse.threejs.org/t/is-billboard-depth-supported/6504
- https://webglfundamentals.org/webgl/lessons/webgl-qna-working-around-gl_pointsize-limitations-webgl.html
- https://unpkg.com/postprocessing@6.39.5/package.json

**TypeScript 7**
- https://www.infoq.com/news/2026/08/typescript-7-released/
- https://www.sitepoint.com/typescript-70-rc-the-go-rewrite-migration-guide/
- https://visualstudiomagazine.com/articles/2026/06/22/typescript-7-0-rc-moves-microsofts-go-rewrite-into-the-mainline-compiler.aspx

**Vitest**
- https://vitest.dev/blog/vitest-5.html
- https://vitest.dev/blog/vitest-4
- https://vitest.dev/guide/migration/
- https://vitest.dev/config/clearmocks

**Vite / deployment**
- https://vite.dev/guide/static-deploy
- https://vite.dev/guide/troubleshooting
- https://github.com/JuanQP/vite-plugin-make-offline

**Playwright / headless WebGL**
- https://playwright.dev/docs/browsers
- https://github.com/microsoft/playwright/issues/33566
- https://www.createit.com/blog/headless-chrome-testing-webgl-using-playwright/
- https://michelkraemer.com/enable-gpu-for-slow-playwright-tests-in-headless-mode/
- https://blog.promaton.com/testing-3d-applications-with-playwright-on-gpu-1e9cfc8b54a9
- https://github.com/testdino-hq/playwright-skill/blob/main/core/canvas-and-webgl.md
- https://bug0.com/knowledge-base/playwright-visual-regression-testing
- https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/gpu/swiftshader.md
- https://chromestatus.com/feature/5166674414927872
- https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM
- https://issues.chromium.org/issues/40277080
- https://chromeenterprise.google/policies/enable-unsafe-swift-shader/

**Fonts**
- https://fonts.google.com/specimen/Exo+2
- https://fonts.google.com/specimen/Chakra+Petch
- https://fonts.google.com/specimen/Oxanium
- https://fonts.google.com/specimen/Rajdhani
- https://fonts.google.com/specimen/Michroma
- https://fonts.google.com/specimen/Titillium+Web
- https://fonts.google.com/specimen/Russo+One
- https://fonts.google.com/specimen/Press+Start+2P
- https://fonts.google.com/specimen/Silkscreen
- https://fonts.google.com/specimen/Pixelify+Sans
- https://github.com/google/fonts
- https://github.com/googlefonts/Exo-2.0
- https://github.com/googlefonts/silkscreen
- https://github.com/codeman38/PressStart2P
- https://github.com/eifetx/Pixelify-Sans
- https://github.com/rektdeckard/departure-mono
- https://github.com/rektdeckard/departure-mono/releases
- https://departuremono.com/
- https://www.fontsquirrel.com/license/exo-2
- https://en.wikipedia.org/wiki/SIL_Open_Font_License
- https://fossa.com/blog/open-source-licenses-101-sil-open-font-license-ofl/
- https://fontsource.org/docs/getting-started/install
- https://aaronjbecker.com/posts/fontsource-fontaine-tailwind-vite/
- https://kenney.nl/assets/kenney-fonts

**FFX / FFX-2 font identification (all inconclusive — recorded as such)**
- https://www.dafont.com/forum/read/273501/final-fantasy-x-original-ps2-subtitles-and-menu-font
- https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/68353036
- https://gamefaqs.gamespot.com/boards/102484-final-fantasy-x-x-2-hd-remaster/72062036
- https://en.wikipedia.org/wiki/Eurostile
- https://en.wikipedia.org/wiki/Microgramma_(typeface)

**Sprite pipeline**
- https://github.com/pngjs/pngjs
- https://www.npmjs.com/package/pngjs
- https://github.com/Automattic/node-canvas
- https://www.npmjs.com/package/canvas

**Audio**
- https://www.npmjs.com/package/node-web-audio-api
- https://github.com/ircam-ismm/node-web-audio-api
- https://github.com/mohayonao/web-audio-engine
- https://en.wikipedia.org/wiki/Final_Fantasy_X:_Original_Soundtrack
- https://en.wikipedia.org/wiki/Music_of_Final_Fantasy_X-2
- https://vgmdb.net/album/1581
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack

**CC0 / free assets**
- https://kenney.nl/assets/ui-audio
- https://kenney.nl/assets/interface-sounds
- https://kenney.nl/assets/sci-fi-sounds
- https://kenney.nl/assets/digital-audio
- https://kenney.nl/assets/category:Audio
- https://kenney.itch.io/kenney-game-assets
- https://opengameart.org/content/cc0-sound-effects
- https://opengameart.org/content/ui-sound-effects-pack
- https://opengameart.org/content/100-cc0-sfx
- https://opengameart.org/content/all-cc0-uploader-kenney
- https://gdc.sonniss.com/
- https://sonniss.com/gameaudiogdc/
- https://bedroomproducersblog.com/2026/03/16/sonniss-gdc-2026-bundle/
- https://itch.io/s/136638/kenney-game-assets-all-in-1-sale
- https://freesound.org/
- https://app.cinevva.com/guides/free-sound-effects-music

---

**Input — web platform specs (gap-fill pass, read 2026-09-15)**
- https://w3c.github.io/gamepad/ — Standard Gamepad button/axis index table; `mapping === "standard"`; getGamepads() empty until a gamepad user gesture
- https://w3c.github.io/gamepad/#remapping — the remapping section specifically
- https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API — polling model (no button events), gamepadconnected/disconnected, `pressed` vs `value`, axes range
- https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/mapping
- https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values — `code` is layout-independent (physical key); full code list
- https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat — `repeat` is true for OS auto-repeat events
- https://developer.mozilla.org/en-US/docs/Web/API/Performance/now — 5 µs resolution cross-origin-isolated, 100 µs otherwise
- https://playwright.dev/docs/api/class-keyboard — `press` / `down` / `up`, `code`-style key names, `delay` option, repeat flag on repeated `down()`
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — SC 2.5.8 (AA) minimum target 24 × 24 CSS px

**UI rendering path (gap-fill pass)**
- https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering — `pixelated` upscales to the nearest integer multiple first; applies to background images
- https://threejs.org/docs/index.html#examples/en/renderers/CSS2DRenderer — no depth occlusion against WebGL objects; separate render pipeline

**Overdrive minigame inputs (gap-fill pass)**
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Bushido.html — Auron's four button sequences verbatim
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Swordplay.html — cursor-on-a-bar, cross/A/B to stop, zone narrows for stronger Overdrives
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Slots.html — three reels, 20-second timer, Cross/A/B stops each reel
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Fury.html — right analog stick clockwise, ~4 s, timer always reaches zero so no time bonus

**Local prior research consumed (not URLs)**
- `D:/Final Fantasy/research/visual-bible.md` §0.3 house pixel rules, §0.4 canonical size system, §0.5 scene-neutral tokens, §1 character colour tables, §3.9 text styling, §6.1 sprite budget, §6.8 animation, §7 conflicts
- `D:/Final Fantasy/research/ffx-combat-core.md` §1.7 Switch, §5.2 timed-input bonus, §5.3 Swordplay, §5.5 Bushido, §5.6 Slots, §5.6a Fury
- `D:/Final Fantasy/research/ffx2-combat-core.md` §Gunner (Trigger Happy), §Lady Luck (Reels), §status (Curse / Itchy and the L1 Garment Grid)


## Verification log

Fact-check pass run 2026-09-15. No claims in this document were rated "contradicted" — the 22 checked claims were "confirmed" or "unverifiable" only, so no value corrections were needed; work below is confidence-tag/source updates on the confirmed set.

| # | Claim (short) | Verdict | Action taken |
|---|---|---|---|
| 0 | Scope note: doc has no boss-HP/formula/AI-rotation claims (fact-checker checked the 22 most consequential numeric/tech claims instead) | unverifiable | No change — scope statement already accurate (§ line 5) |
| 1 | `three` latest is 0.186.0, MIT | confirmed | Tag already `[verified: 2 sources]`; added npmjs.com/package/three to Sources |
| 2 | `typescript@7.0.2` is tsgo, GA 2026-07-08, 8–12x faster | confirmed | Tag already `[verified: 2 sources]` |
| 3 | `vitest@5.0.1` requires Vite ≥6.4.0, Node ≥22.12.0 | confirmed | Tag already `[verified: 2 sources]`; added vitest.dev/guide/migration/ and /config/clearmocks to Sources |
| 4 | TS 7.0 ships without stable programmatic API; `@typescript/typescript6` compat package | unverifiable | No change (flagged as such by fact-checker; doc's own caveat language left intact) |
| 5 | `UnrealBloomPass(resolution, strength, radius, threshold)`, default strength=1, default resolution (256,256) | confirmed | Tag already `[verified: 2 sources]` |
| 6 | `Texture.colorSpace` defaults to `NoColorSpace`; use `SRGBColorSpace` for colour textures | confirmed | Tag upgraded to `[verified: 2 sources]` |
| 7 | `postprocessing@6.39.5` peer range `>= 0.168.0 < 0.187.0` | confirmed | Tag upgraded to `[verified: 2 sources]`; added unpkg package.json URL to Sources |
| 8 | Chromium SwiftShader auto-fallback deprecated; `--enable-unsafe-swiftshader` required, warned since Chrome 130 | confirmed | Tag already `[verified: 2 sources]` |
| 9 | Playwright `channel: 'chromium'` new-headless (compositor + GPU process) available since v1.49 | confirmed | Tag already `[verified: 2 sources]` |
| 10 | Vitest 5 `clearMocks` defaults to `true` | confirmed | Already reflected in config comment/notes under a `[verified: 2 sources]` block |
| 11 | `node-canvas` v2+ ships prebuilt Windows binaries but recommends a working build env; prebuilds go stale | confirmed | Tag already `[verified: 2 sources]` |
| 12 | `gl_PointSize`/point-sprite cap as low as 63px on some GPUs; query via `ALIASED_POINT_SIZE_RANGE` | confirmed | Tag upgraded to `[verified: 2 sources]`; added webglfundamentals.org URL to Sources |
| 13 | FFX OST composers: Uematsu, Hamauzu, Nakano; first mainline FF without sole-Uematsu composition | confirmed | Tag already `[verified: 2 sources]` |
| 14 | FFX OST per-composer track split 51/20/18 | unverifiable | No change — left as the existing figures with no independent second source |
| 15 | FFX-2 OST by Matsueda & Eguchi, 2 CDs, 2003, Avex | confirmed | Tag already `[verified: 2 sources]` |
| 16 | Kenney Game Assets All-in-1 bundle: $19.95 USD | confirmed | Added `[verified: 2 sources]` tag with itch.io sale page as second source |
| 17 | Sonniss GDC 2026 bundle: 7.47 GB / 347 WAV, royalty-free, no attribution, unlimited commercial use | confirmed | Added `[verified: 2 sources]` tag with bedroomproducersblog.com as second source |
| 18 | Departure Mono font sizes in 11px increments | confirmed | Tag upgraded from `[single source]` to `[verified: 2 sources]` |
| 19 | SIL OFL 1.1: embeddable in commercial products, cannot be sold alone, RFN restriction on derivatives | confirmed | Tag already `[verified: 2 sources]`; added fossa.com blog to Sources as a further corroborating source |
| 20 | `maxDiffPixelRatio: 0.02` is the widely recommended Playwright WebGL tolerance vs 0.01 for 2D canvas | unverifiable | No change — only the doc's own two cited sources found; left as-is |
| 21 | `@playwright/test` latest is 1.63.0 | unverifiable | No change — single-sourced npm dist-tag, no independent second source exists by nature |
| 22 | `vite@8.3.0` and `pngjs@7.0.0` latest versions | unverifiable | No change — same as above, npm dist-tags are self-authoritative |

No "contradicted" claims were reported, so no CONFLICT notes were required and no values in the document were changed — only confidence tags and the Sources list were updated.


---

## Gap-fill log (2026-09-15)

Four gaps were filled in place. Every fill is marked in the body with `[CONFLICT RESOLVED]` or a confidence tag.

| # | Gap | Severity | Where it was filled | Resolution |
|---:|---|---|---|---|
| 1 | No input mapping existed in any of the ten research documents — no keyboard table, no gamepad mapping, and no specification of how the PS2 button prompts the mechanics depend on (L1 Switch / Spherechange, R1 Trigger Happy, the ○/✕ Swordplay press, the seven-symbol Bushido sequences, the right-stick Fury rotation, the three ✕ presses for Lady Luck and for Slots) reach a browser | **blocker** | **new §2A**, plus §5.4 (debug API) and §5.6 (test suites) | A 15-action abstract layer; a full keyboard (`KeyboardEvent.code`) and W3C Standard Gamepad binding table; device-aware prompt glyphs with a trademark caveat; a sampling model that makes the quoted ms windows executable (60 Hz sim, frames as the normative unit, +1 frame gamepad grace, mandatory `event.repeat` guard); a per-minigame spec table converting every verified PS2 timer into browser terms; remap, touch and three assist toggles; and six input test suites |
| 2 | §3.5 mandated a shared 48-colour master ramp and a build-failing lint against it, but never defined the palette; visual-bible §1 independently specifies hundreds of per-character hexes and §0.5 a separate 9-token palette | major | **new §3.5a**, §3.6 rubric, §5.6 | Two-tier palette. The **48 are now defined** (10 families × 4 steps + 8 accents; the 4-step ramp is visual-bible §0.3's own), 45 of them verbatim high-frequency visual-bible hexes, and §0.5's nine tokens are shown to be a **named subset** rather than a competitor. Per-sprite **signature palettes** (≤ 8 party, ≤ 16 boss) carry what the master cannot. The lint is rewritten to be satisfiable, and the decision is backed by a measured ΔE coverage table over all 592 distinct hexes in the visual bible |
| 3 | Sprite cell sizes and the animation clip set were specified twice with different values (visual-bible §0.4 vs §3.5; visual-bible §6.8 vs §2.7) | major | **§2.7** (clip table rewritten), **§3.5** (size table rewritten) | visual-bible §0.4 wins on cell sizes — it has a stated derivation from published heights and per-boss framing — and its table is restated here so there is one table, not two. The ten-row clip **order becomes the contract** (the animator indexes blind) while **frames and fps become per-character data** in a `<name>.sheet.json` manifest, defaulting to §6.8's 10 fps idles / 12–15 fps actions and bounded by lint. A `holds[]` field adds §6.8's held impact frame. Bosses get a separate six-row set and a 2048 px paging rule |
| 4 | §2.13 item 8 mandated a DOM overlay for UI; visual-bible §3.9 mandated a 3× nearest-filtered bitmap text atlas and §6.1 budgeted 1024×1024 atlas pages | major | **new §2.13a**, §2.13 item 8, §5.6 | The two documents were describing **two different surfaces**. World-space UI (damage numerals, chain popup, reticles) stays a canvas-textured billboard in WebGL per §1.5 — that *is* the 3× atlas, and §3.9 still governs it. Screen-space UI becomes a DOM overlay at **integer scale via a `--u` custom property, not `transform: scale()`**, so visual-bible §3's pixel-exact 640×360 coordinates stay valid unchanged and Playwright's box-model assertions return exactly the specified numbers. §6.1's atlas pages survive as a **CSS sprite sheet**. `CSS2DRenderer` is explicitly rejected, with the reason |

**Deliberately left unresolved** (recorded as open questions §8 items 7–9): the specific default keyboard layout, whether the accessibility assists default on, and whether the 8-entry signature quota survives contact with the first three character sheets.

**Not found on the web, estimated with reasoning instead:** Swordplay success-zone widths per Overdrive; the Bushido wrong-press penalty; the Slots/Reels symbol advance rate; the Trigger Happy per-shot cooldown; the exact coefficients in Fury's `req(n)` rotation-growth formula; any published timer for Lady Luck's Reels. Each is tagged `[estimate]` at the point of use with the verified fact it was derived from.
