# Handoff: preview-picks (in-game preview of the recommended art picks)

Branch `preview-picks` (worktree `D:/pyrefly-iter2-spellfx`, from `origin/main` 3fb1de85). Pushed for the record, **never merged, never deployed**.
Bailey, 2026-10-03 ~10:25 EDT (verbatim): "I need another pass on visuals and maxing out eye candy with special emphasis on character models,
enemy models, animations, visual fidelity, and camera perspective in relation to characters, enemies, and the battlefield as a whole. The critic
needs to be involved as well and I need updated scores." This note covers the preview of the morning page's recommended picks (rules 9 and 10:
options and previews, no product change).

## Game case (rule 14)

FFX-2 only: Yuna Thief, Rikku Warrior, Paine Thief, the dressphere re-rolls, the FFX-2 apex keys, Bahamut / Shuyin / Trema / LeBlanc / Vegnagun
telegraphs. FFX only: the Overdrive apex keys (Wakka, Lulu, Kimahri, Rikku, Yuna, Tidus) and the Flux, Yunalesca, Braska, Omnis, Evrae, aeon and Sin
telegraphs. Shared plumbing (the overlay, the family alias, the telegraph hold) is "both" (CHK-020).

## What is on the branch

- `tools/preview-picks/` (dev-only, never shipped): `preview-art-plugin.mjs` + `vite.preview.config.mjs` (an extra art root laid over `public/art`, manifest
  merged with `buildManifest`, `/__preview/on|off`), `make-picks.py` -> `picks.json`, `stage.mjs` (staging + sidecars), `package.mjs` (install-ready packages),
  `drive.mjs` / `scen.mjs` / `scenarios.mjs` / `scen-ffx.mjs` / `lineup.mjs` / `clip.mjs` / `pair.py` / `sheet.py` (capture harness), `run-queue.mjs`.
  Start: `PREVIEW_PORT=6210 node node_modules/vite/bin/vite.js --config tools/preview-picks/vite.preview.config.mjs`, then `node tools/preview-picks/scen.mjs ch6b preview a`.
  The dev server does not watch files (HMR off): restart it after editing `src/`.
- `src/engine/KeySlots.ts`: `odFamilyOf` and a family lookup in `armOdKey` (PREVIEW: one painting per family: `od-element-reels`, `od-mix`, `od-fury`, `od-x2-black-mage-cast`).
- `src/engine/PreviewTelegraph.ts` (+ two lines in `BattlePresenterBeats.ts`): holds the boss's `telegraph` painting 950 ms before Flux's Lance of Atrophy, Yunalesca's
  Mega Death / Hellbiter, Evrae's Inhale (and Photon Spray as a stand-in), Trema's Meteor / Ultima. Off unless `globalThis.__previewTelegraph` is true. An added wait.
- `src/engine/KoPoseScale.ts`: the `yuna-white-mage` 0.64 entry dropped (D-334's KO is a body-length match).
- `tsc --noEmit` clean; `r37-key-slots` and `ko-pose-scale` tests pass.

## Findings (details in `D:/Tools/pyrefly-scratch/2026-10-03/visual-options/preview/README.md`)

Only Yuna's Thief is reachable in a shipped chapter; the telegraph slot fires only on `charge` events (Mortiorchis, FFX-2 Bahamut, Shuyin, Vegnagun's body); the FFX-2 menu
rule hides most keys in real play and the apex hook ignores buffs (Sentinel); the engine's Overdrive ids (`fire-shot`, `mix-*`, `<spell>-fury`, 12 Black spells) do not match the
files the page names, so a family alias or many copies are needed; the recommended sets total 59.7 MB against 1.37 MB of headroom.

## Install-ready

`D:/Tools/pyrefly-art-backup/candidates/2026-10-03-overnight/install-ready/` (README.md, manifest.json, one folder per set). Nothing is installed.
