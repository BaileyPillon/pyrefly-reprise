# Fayth 3D: a hidden Evrae chapter with FFX's own camera, and FFX's own models on Bailey's PC

**Game case: FFX only.** Evrae is FFX's fight (Chapter VIII), and the camera being recreated is FFX's battle camera (D-632). Nothing here applies to FFX-2 or FF7.

## Bailey's words

- 2026-10-10 ~15:00 EDT, verbatim: "decompile all ffx art and assets as well as camera perspective and camera angles changes during battle then add an experimental new chapter with this 3d presentation of an encounter we already have in game. add as a new experimental chapter please that is hidden. with a code word i need to type in at the chapter select menu please."
- ~15:15 EDT (AskUserQuestion, three recommended options):
  - **"Both versions"**: one chapter. On Bailey's PC it loads the real FFX models and stage; on the website the same chapter and camera use our painted art; same code word in both.
  - **Evrae** first.
  - Code word **fayth**.
- Before he picked, he was told that retail FFX models and textures never go into the repo or onto the site (AGENTS.md rule 8).
- Standing decision D-632 (2026-10-08): replicate the real FFX battle camera and its angle switches. Record the real camera first, then build test modes **A** (fully faithful angles) and **B** (faithful timing and framing, angles kept near the front) for one chapter, and show them side by side with the real game before anything ships. This chapter is that test chapter.

## What gets built

1. **A hidden chapter `exp-fayth`, number 22**, opened by typing `fayth` on the chapter-select board.
   - It is derived from Chapter VIII's record (same build, enemy group, scripts and music), so it plays Chapter VIII's battle exactly; a determinism test proves it.
   - It has its own scene key, `exp-fayth-deck`, built with `makeAirshipDeckScene` over Chapter VIII's plate.
   - It is `experimental: true`, so it writes only the experiments' store and never the save.
2. **Two skins, one scene.**
   - `painted` (always; the only skin a production build has): Chapter VIII's deck and paintings.
   - `ffx` (local only): Bailey's own converted FFX models and stage. A dev server loads it from `/__ffx-local/`, served by a dev-only Vite plugin from `D:\Tools\ffx-parity\assets\runtime\` (env `PYREFLY_FFX_LOCAL` overrides). The probe sits behind `import.meta.env.DEV`, so a production bundle never asks for it.
   - Models attach to the existing actors' groups, so the presenter's motion (position, lunge, hop, recoil, shake) moves them; the painted planes are hidden. Poses map to animation clips once the motion format is decoded.
3. **FFX's battle camera** as a scene-provided shot director, `src/engine/ffxcam/`.
   - One additive seam: `SceneStaging.shotDirector` plus a consult in `BattleMoments` at each beat. A director that handles a beat replaces that beat's camera move; with no director published, every other chapter is byte-identical.
   - Shot data is our own re-authored table with source notes (`src/data/ffx/camera/`), taken from the decompile and the real-camera recordings, never a raw extracted file.
   - Variants A and B (D-632) are chosen with `?ffxcam=a|b` until Bailey picks.
   - In this scene the airship range director keeps staging Evrae (spots, paintings) but does not drive the camera.

## Where things live

| What | Where |
|---|---|
| Code | worktree `.claude/worktrees/fayth-3d`, branch `fayth-3d`, from `origin/rel-3944` 3d71c216 |
| Raw unpack of Bailey's FFX copy, inventory | `D:\Tools\ffx-parity\assets\raw\`, `INVENTORY.md` (local only) |
| Converted runtime files (glTF binary `.glb` + PNG + `manifest.json`) | `D:\Tools\ffx-parity\assets\runtime\` (local only) |
| Camera decompile notes | `D:\Tools\ffx-parity\camera\` (local only) |
| Real-camera recordings (PS2, PCSX2) | `D:\Tools\pcsx2-ffx\re\dumps\camera\` (read-only; nothing under pcsx2-ffx is ever deleted) |

## Guards (rule 8)

- No retail file under `public/`, in `dist/` or in git. The guard tests check:
  - the plugin is `apply: 'serve'` with `configureServer` only (not preview, not build);
  - `public/` holds no `.glb`, `.gltf`, `.phyre`, `.dds` or `.mgrp`;
  - the probe module fetches nothing unless `import.meta.env.DEV`.
- Ledgers, docs and commits never quote retail file contents.
- `docs/ARCHITECTURE.md:125-127` and `src/data/ffx/party-stature.ts:15` stay true for the repo.

## Phases

| # | What | Who | Gate |
|---|---|---|---|
| 1 | Doors made table-driven plus `fayth`; chapter 22 registered; scene key; the shot-director seam (inert); the dev-only plugin, probe and guards; tests | Sonnet lane in this worktree | paper preflight `fayth-3d-review.md` (PROCEED), tsc, targeted vitest, orphans |
| 2 | Converter: `.dae.phyre` meshes and skeletons to `.glb`, textures to PNG, for Evrae, the Fahrenheit-deck stage and the active party (Tidus, Wakka, Rikku) | Sonnet lane, local tools under `D:\Tools\ffx-parity\assets\tools\` | the inventory and the format research |
| 3 | The `ffx` skin in the scene; a static first render | Sonnet lane | phase 1 and 2 |
| 4 | The FFX shot director with A and B from the camera data. **Done 2026-10-11:** 4a the replayer (`src/engine/ffxcam/`), 4b its wiring into `exp-fayth-deck` for both skins, variant B, the typical turn captured (`docs/handoff/fayth-3d.md`, "Phase 4b") | Sonnet lane | the Ghidra camera lane, the recordings |
| 5 | Animations (motion format) | Sonnet lane | format decoded, or root motion only |
| 6 | **Options round for Bailey**: the real game's shot beside `ffx` skin, painted A and painted B, same moments | main session | end state first, D-632 |
| 7 | After his pick: polish, focused review, the release driver deploys the painted skin; the `ffx` skin stays on his PC | release driver | `critic-plan` (deep: focused before, deep after) |

## Process

- Not save-data class: experimental store only, no `SaveData.ts`, no settings row.
- Deep classes touched: `chapter-registry` (`encounters.ts`, `chapter-meta.ts`, `scenes/index.ts`), `battle-presenter` (`BattleMoments.ts`) and `build-and-delivery` (`vite.config.ts`). So: a focused review before the deploy and a deep review after.
- Camera-lab session ("Game perspective mockups"): tell it when the seam lands in `BattleMoments.ts`.
- House rules:
  - every file stays under 400 lines; `scenes/index.ts` (422) must not grow, so move the experimental scenes' rows into a side table if needed;
  - `.ts` on relative imports;
  - `node tools/orphans.mjs` after adding modules;
  - a `CONTRACT-CHANGES.md` entry for `encounters.ts`, plus `scenes/types.ts` if `SceneStaging` grows.
- Records: the release driver records the D rows (sent 2026-10-10 ~15:25) and the A rows; NOW.md and this file are updated as phases land.
