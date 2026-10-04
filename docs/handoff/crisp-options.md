# crisp-options: how crisp can the standard battle view look? (an options round on release 39; scratch)

Date 2026-10-04. Branch `crisp-options`, made from `origin/r39-hires-engine` (296641de) in the worktree `D:/pyrefly-crisp`. **Never merged, never deployed.**
Game case: **both games, shared plumbing** (the post chain is shared; Chapters I and VIII are FFX, Chapter IV is FFX-2). Bailey, 2026-10-04, verbatim:
"I need super high resolution now. DO NOT hold back. I want the visual fidelity to be amazing and absolutely beautiful. The critic will ensure this is the case."
The independent check of release 39 found the standard view not visibly sharper than live; this round answers "how crisp can it look?" with real frames
(AGENTS.md rule 9: end state first). The options page (the driver publishes it; Bailey picks) is `critic/scratch/crisp-options-1004/index.html` in the main tree.

## What is on the branch

Every lever is a URL flag and a `window.__pyrefly.crisp` switch; with no flag the frame is release 39's (the same passes in the same order).

| File | What |
|---|---|
| `src/engine/crisp/CrispConfig.ts` | the config, the address parser (`?crisp=<preset>` plus single flags) and the named end states |
| `src/engine/crisp/CrispRig.ts` | owns the new passes, the texture registry and the per-frame switchboard; `Renderer` builds it and calls `beforeRender` |
| `src/engine/crisp/SsaaPass.ts` | the scene pass drawn at 1.5x to 3x, resolved by a separable Lanczos-3 / Lanczos-2 / Catmull-Rom / Mitchell / box filter with an anti-ringing clamp, before the bloom |
| `src/engine/crisp/CasPass.ts` | our own contrast-adaptive sharpening (amount, shape, noise floor, tilt-shift band mask), before or after the grade |
| `src/engine/crisp/MipPrefilter.ts` | Lanczos-3 mip chains for painted textures, alpha-weighted, on the GPU; also the readbacks the measurements use |
| `src/engine/crisp/sceneScale.ts` | the shared scene-scale cell: point sprites (`BattleScreen`, `StoneShards`, `OmnisGlowLook`, `OversoulLook`) and the backdrop focus pull (`BackdropFocus`) read it |
| `src/debug/crispApi.ts` | `__pyrefly.crisp`: `get`, `set`, `preset`, `flush`, `queued`, `report`, `inspect`, `sums`, `releaseSmaa` |
| `tests/unit/engine/crisp-config.test.ts` | the parser, the merge rules, the scene-scale cell |
| edits | `Renderer.ts` (builds the rig), `PaintedArt.ts` and `DepthPlates.ts` (register textures), `PaintedShader.ts` and `PaintedActor.ts` (a `mipBias` uniform, 0 by default), `BackdropFocus.ts` (adds `log2(scale)` to the biased lod), `main.ts` |

Named end states (`?crisp=`): `a` release 39 as built; `a2` one SMAA; `b` 4x MSAA; `c1`, `c2` SMAA + CAS (amount 0.5, or 1 with the hard lobe); `d15`, `d2` supersample 1.5x, 2x;
`e` prefiltered mips + anisotropy 16; `g1` = F (1.5x, CAS 0.4, aniso 16); `g2` = F plus (2x, CAS 0.3, aniso 16); `f1` = F with E's mips; `ref3` the 3x reference; and the comparison
states `c2post`, `c2nf`, `c2postnf`, `d2box`, `d2cat`, `d2mit`, `d2l2`, `ebias`, `g0`.

## Three findings that change how to read the check

1. **Release 39 draws SMAA twice.** The chain at the first menu: live is `scene, bloom, glow, tilt-shift H, tilt-shift V, SMAA, grade`; release 39 adds a second SMAA after the grade
   (`Renderer.smaaPass`) on top of the MAX mix's SMOOTH EDGES one (`fx/mix/cinema.ts`). The check's `?aa=off` only removes the second pass. Taking just it out (`a2`) lifts the figures'
   fine detail 19 percent for nothing.
2. **The ideal is about 2x what release 39 draws, and the gap is filtering.** A figure is drawn at 3.2 texels to a pixel at the standard camera, so no bigger master can add
   anything. The same frame drawn at 3x and resolved with Lanczos-3 holds 2.0x the Laplacian variance of release 39's frame (mean of eight figure crops).
3. **The plates' `tex.anisotropy = 8` never reaches the GPU** (a render target's texture is set up before the property is written). Read back: GL holds 1. Fixing it changed nothing I could measure.

## The numbers (2560x1440, eight figure crops in Chapters I, IV, VIII; frame time = mean of three chapters; RTX 5070 Ti, headless Chromium, D3D11)

| Lever | Detail kept (of the 3x ideal) | Distance from ideal (luma levels) | Halo % | Shimmer vs ideal | Frame time vs A, ms (1440p / 4K) | GPU MB vs A (1440p / 4K) |
|---|---|---|---|---|---|---|
| A release 39 | 50 % | 4.33 | 0.36 | 7.0 | 0 | 0 |
| A2 one SMAA | 60 % | 3.99 | 0.38 | 6.0 | -0.2 / -0.4 | -57 / -127 |
| B 4x MSAA | 71 % | 3.70 | 0.42 | 4.8 | -0.1 / -0.1 | +98 / +221 |
| C1 CAS 0.5 | 73 % | 3.87 | 0.45 | 6.4 | -0.2 / -0.2 | -57 / -127 |
| C2 CAS full | 120 % | 4.14 | 1.81 | 8.9 | -0.2 / -0.2 | -57 / -127 |
| D 1.5x | 78 % | 1.90 | 0.10 | 3.0 | +0.7 / +1.7 | +24 / +55 |
| D 2x | 91 % | 1.02 | 0.00 | 2.2 | +2.0 / +4.7 | +112 / +252 |
| E mips + aniso | 61 % | 3.97 | 0.40 | 5.9 | -0.2 / -0.3 | -57 / -127 |
| F 1.5x + CAS 0.4 | 89 % | 1.61 | 0.07 | 2.8 | +0.8 / +1.8 | +24 / +55 |
| **F plus 2x + CAS 0.3** | **100 %** | **0.95** | 0.02 | 2.3 | +2.0 / +4.7 | +112 / +252 |
| F + E's mips | 92 % | 1.61 | 0.07 | 2.7 | +0.9 / +1.8 | +24 / +55 |

Live (release 38) reads 64 percent on the crops where its frame lines up. On the independent check's own crop box (Tidus, Chapter I, 896,690 to 1344,1190) this build's A reads 849
(the check: 852 for release 39), live 1,187 (the check: 1,147). GPU memory is the harness tally with the SMAA passes an option switches off given back (`releaseSmaa`); the scratch
branch gives them back only in that measurement. Chapter IV is the heaviest scene: 7.2 ms for A and 15.0 ms for F plus at 4K on this GPU (Chapter I 4.7 and 10.1, Chapter VIII 3.1 and 4.1).

## Recommendation (the options page carries it)

**F plus**: supersample the scene 2x, resolve with Lanczos-3 before the bloom, both SMAA passes off, CAS amount 0.3 before the grade with the noise floor and the tilt-shift band,
plates at anisotropy 16; **F** (1.5x, CAS 0.4) as the automatic step-down on a slower GPU; the phone keeps today's frame. A2 is the free fix if Bailey takes nothing else.
Not recommended: E (nothing you can see at this camera), C at full strength (overshoots the ideal, halos, the most shimmer), B (edges only).
Known look change: the lit regions read 1 to 4 percent brighter in region averages (up to about 15 levels at a skylight's core) because a supersampled frame keeps the energy of small
bright lights and the bloom sees it; a bloom trim of about 3 percent under supersampling would match it back (not built).

## What a real build would still need (none of it done here)

- A device-class and frame-time governor for the scale (high class 2x, step down to 1.5x, mid and below off), and the phone untouched.
- Give the SMAA passes' buffers back when supersampling is on (`Cinema.aa(null)` and `Renderer.smaaPass`): +112 MB net at 1440p instead of about +226 MB.
- The bloom trim above, if Bailey wants the old glow exactly.
- Spell overlays and the spectacle pass are drawn after the chain at 1x; held shots (Overdrive, dressphere) and spells in motion were not run with supersampling.
- Chapters II, III, V to VII, IX to XV and the FF7 chapters were not captured.
- The `DepthPlates` anisotropy fix as its own tiny change; the SMAA de-duplication as its own tiny change (A2).
- Strip the scaffolding (presets table, `mipBias`, the prefilter, the debug API) down to what is picked; a picked option goes through the usual end-state, review and critic path.

## Evidence

Harness, frames, `metrics.json`, timing, VRAM, motion, HUD screenshots: `D:/Tools/pyrefly-scratch/2026-10-04/crisp/` (`harness/` has `capture.mjs`, `timing.mjs`, `vram.mjs`,
`motion.mjs`, `motionstrip.mjs`, `hudshot.mjs`, `analyze2.py`, the page builders). The evidence build is a code-only production build of this branch (`vite.crisp.config.mjs`) served over the
release-39 art build with `artlink=fast`; its bundle (`index-DLT7A_oH.js`) is byte-identical to a fresh build of the branch tip. The old variant frames of two earlier capture runs are parked in
`F:/pyrefly-parked/2026-10-04/crisp/`.
