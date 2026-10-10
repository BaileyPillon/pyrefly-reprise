# Handoff: fayth-3d (hidden 3D Evrae chapter; FFX only)

Written 2026-10-10 ~18:50 EDT by the main session ("FFX assets decompile and experimental chapter"), when account #4's weekly allowance read 99%. Plan: `docs/plans/fayth-3d.md`. Preflight: `docs/plans/fayth-3d-review.md` (PROCEED). Survey: `docs/plans/fayth-3d-survey.md`.

## Done (local outputs, never in git)

| What | Where |
|---|---|
| Full unpack of FFX_Data.vbf (71,979 files, matches the index) and inventory | `D:\Tools\ffx-parity\assets\raw\`, `INVENTORY.md` |
| Format research (Phyre clusters, `.mgrp` motion, ATEL camera, refs) | `D:\Tools\ffx-parity\assets\RESEARCH-FORMATS.md`, `refs\`, `DOWNLOADS.md` |
| Battle camera decompile (Proven, Read and Open labels) | `D:\Tools\ffx-parity\camera\CAMERA.md`, `anchors-camera.md`, `work\` |

## Key camera facts (CAMERA.md)

- **Live state:** look-at 0x01137580, eye 0x01137B9C (4 floats, Y down), roll 0x011381D0, lens scrDpt 0x011381DC. Vertical FOV = 2·atan(240/scrDpt) at 4:3, so 1024 = 26.4°. eye = ref + len·(cosφ cosθ, sinφ, cosφ sinθ), in degrees.
- **Update:** the solver runs once per logic step (29.97 Hz). Blends are linear, cosine or trapezoid; a destination set with no move armed is a hard cut.
- **Tags:** Enter 24, Select 25 (target cursor), Normal 28 (after each action), turn start 62 (no stock camera), command accepted 61, MagicStart 27, launch 52, attack 29+chr then 26, monsters 44–47, victory 66, defeat 67. Scripts are tried in this order: formation, monster, effect, then `btl/system_01`.
- **Evrae** (all camera work is in formation `hiku15_00`; m119 has none):
  - default hard cut by BattleDistance; scrDpt 1024 in both;
  - near: ref(-30.6985,-34.9897,13.5121), polar(-258.4762,-17.1948,342);
  - far: ref(87,-55,55), polar(-106,-6,250);
  - Pull back and Move in are about 184- and 230-step scripted moves;
  - elemental spells pick one of 3 shots (`camRand` mod 3, streams 14 and 15);
  - big spells use 250-step orbits; a plain Attack falls back to tag 26.
- **RNG:** shakes use stream 9. The Guided Missiles and victory cameras draw stream 2 (shared with the AI; parity note sent to the RE session).

## Phase 1: DONE and validated (2026-10-10 ~19:00 EDT)

- **Pushed:** `origin/fayth-3d` at c7da6c1f, six commits on `origin/rel-3944`.
- **Validated by the main session:**
  - `tsc --noEmit` clean;
  - `vitest run` on the 20 changed test files plus golden, canon, every `chapters/evrae-*` suite and the four door suites, with `--maxWorkers=2 --fsModuleCache --fsModuleCachePath D:/Tools/fayth3d-vitest-cache`: 30 files, 519 passed, 1 skipped, 0 failed.
- **Determinism:** seeds 1 to 4 replay Chapter VIII's event log exactly.
- **What the commits hold:**
  - the doors table `src/app/screens/frontend/chapterDoors.ts` (`BoardDoors`) with `fayth` → `exp-fayth`;
  - chapter 22 in `src/data/chapter-exp-fayth.ts`, its scene in `src/scenes/experiment-scenes.ts` (hidden-chapter scenes moved out of `index.ts`, which went 422 → 407);
  - the seam `src/engine/ShotDirector.ts` (10 optional beat handlers, ctx = camera port, speed, skipping, actor and side, action kind and ability id, targets, hit) through `SceneStaging.shotDirector`, `PaintedStage`, `BattleStage` and `BattleMoments`; the stub director declines everything;
  - `tools/vite-ffx-local.mjs` (serve-only) and `src/engine/ffx3d/localAssets.ts` (DEV-gated probe, validated manifest);
  - guards in `tests/unit/ffx-local-guard.test.ts`.
- **Architecture review (main session, ~19:10 EDT): PASS.**
  - `ask()` is undefined when no director exists, so every beat runs its old code with no extra await.
  - A handler that throws costs the shot, not the battle.
  - A taken beat skips only the camera moves; the letterbox, vignette, plate and sounds stay, which is right for the FFX camera.
  - Notes for the focused review: `BattleMoments.ts` grew 552 to 647, so consider a bridge helper; `subject()` calls `stage.sideOf` in `actionOpen` and `overdriveStart` even with no director (pure, but could be lazy).
- **Camera-lab:** the seam touches `BattleMoments`, `BattlePresenterBeats`, `BattlePresenterPorts` and `BattlePresenterStage`. Tell "Game perspective mockups" when it reaches main (it was not running on 2026-10-10).
- **Orphans:** 52 → 53; the new one is `localAssets.ts`, until phase 3 wires it.
- **critic-plan:** DEEP (chapter-registry, battle-presenter, build-config). Focused review before the deploy, deep after.

## In flight when the cap hit (may have stopped mid-work)

1. **Phase 2 converter**: `D:\Tools\ffx-parity\assets\tools\phyre2gltf\` produces `assets\runtime\evrae\{stage,evrae,tidus,wakka,rikku}.glb` + `runtime\manifest.json` + `runtime\_checks\*.png`.
   - Port eArmada8/ed8pkg2gltf (MIT); the GPL refs are read-only.
   - Inputs: Evrae is m119; party battle models are `chr/pc/c001`–`c007`; the stage is field map `hiku15`.

## Next lanes (in order)

1. **Camera programs for the Evrae fight.**
   - Decode every camera program the fight runs (`hiku15_00`, the tags 26/27/28/29+chr/52/66 programs in `btl/system_01`, the MagicCamera workers for the party's spells and items, and Evrae's custom shots).
   - Output: normalized JSON in `D:\Tools\ffx-parity\camera\programs\evrae\` plus a spec of the call subset used.
   - Tool: the RE session's disassembler `node D:\Tools\rea\tools\atel.mjs <bin> --ffx --vars` (read-only; Evrae dis in `D:\Tools\ffx-parity\ai\ffx-evrae-yojimbo-isaaru-sin\dis\`; call to handler via `ai\ffx-yunalesca-bfa\handler.mjs`).
2. **Formation positions** for `hiku15_00` (party slots and Evrae, near and far), so both skins stand where FFX stands them.
3. **Phase 3:** the `ffx` skin on `exp-fayth-deck` (models parented to the actor groups, painted planes hidden, the stage swapped in), and a first static render.
4. **Phase 4:** an FFX camera-program VM plus a data table in `src/data/ffx/camera/` (re-authored with source notes) behind the seam; variants A and B (`?ffxcam=a|b`) per D-632.
5. **Phase 6:** the options round for Bailey.
   - The real game beside the `ffx` skin, painted A and painted B.
   - Real-game frames by a read-only memory sampler at the addresses above, during an Evrae fight on Steam FFX.exe. It needs Bailey's window and an Evrae save.
   - Frames stay on the PC.

## Coordination

- **Release driver:** "FFX/FFX-2 2.5D game recreation", uds ...2b10e497. It assigned number 22 and the base `rel-3944`, and it has the D rows queued (request plus three picks). Ask it for a release slot after a focused SHIP.
- **RE session:** "Final Fantasy X/X-2 battle mechanics reverse engineering", uds ...be661763.
  - It owns the Ghidra servers (:8089 FFX). Its rules: GET only via curl.exe, no MCP tools, no connect_instance, never start or stop the servers.
  - It owns `D:\Tools\rea` and `ffx-parity\ai\` (read-only for us).
- **Camera-lab** ("Game perspective mockups"): send it a line when the `BattleMoments` seam lands.
