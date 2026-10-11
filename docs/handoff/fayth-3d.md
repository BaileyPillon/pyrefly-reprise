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

## Phase 3: DONE (2026-10-11 ~00:45 EDT; branch `fayth-3d`; FFX only): the `ffx` skin on `exp-fayth-deck`, the painted skin at FFX's staging, and the first pictures

**What exists (all dev-server only; production, the website and every test get phase 1's scene unchanged):**

| What | Where |
|---|---|
| The one transform: `world = FFX_UNIT * (x, -y, -z)`, `FFX_UNIT = 1.75 / 18.15 = 0.09642` (Tidus's 18.15 FFX units stand the painted Tidus's 1.75). The matrix, `ffxPoint`, `ffxDirection`, `yawToward`, the polar eye, the lens | `src/engine/ffx3d/ffxWorld.ts` (phase 4's camera sink takes `ffxWorldMatrix()`) |
| Party slots, Evrae NEAR and FAR, the two default views as world rigs, the overview rig, **which stage meshes the battle draws** | `src/engine/ffx3d/ffxStaging.ts` |
| glb loading (dynamic `import()` of three's `GLTFLoader`), unlit materials, weapons by bone, runtime scale, `shapeStage` | `src/engine/ffx3d/models.ts` |
| The skin: models ride the painted actors' `inner` group, planes off, facing, alpha and scale follow | `src/engine/ffx3d/ffxSkin.ts` |
| The scene glue: probe, `?skin=`, derived build (rigs, slots, pins, `sideFacing`, palette), painted layout at FFX's staging | `src/scenes/exp-fayth-skin.ts`, reached from `exp-fayth-deck.ts` through `import()` inside `import.meta.env.DEV` |
| The director's optional `staging` (Evrae's spots and the NEAR / FAR rigs; no Hor+ stand-back or trim while set) | `src/scenes/evrae-airship-director.ts` (399 lines) |

- **Skins.** A found manifest: the `ffx` skin. `?skin=painted`: the painted skin at FFX's staging (billboards at FFX's points, deck a quarter turn under the party's column, sky plate behind). `?skin=classic`: phase 1's scene. Nothing found and no switch: phase 1's scene, the very objects (a test pins the identity of `RIGS`). Chapter VIII's tables are never written (the build is derived; its getters stay getters).
- **Production proof.** A production-mode Vite build of `exp-fayth-deck.ts` holds no skin code, no loader and no route string (`stageFaythSkin`, `loadFfxModels`, `FfxSkin`, `GLTFLoader` code and `__ffx-local` are absent; two words appear only in comments).
- **Material.** Every material is rebuilt as an unlit `MeshBasicMaterial` (map, vertex colours, alpha-test, sidedness from the file; no fog). The texture is already shaded; unlit cannot go dark in our lights and shows what the file draws. Lit (the game's one directional character light) is a later question.
- **The stage is not the whole file (the main finding).** The converted stage is the airship's whole exterior. Placed at x10 with no offset, the near camera sits inside its superstructure and the party stands under a roof. The PS2 captures of the same view (`D:\Tools\pcsx2-ffx\re\shots\b2_ev76_0.png`, local) show the party on a pale domed hull with a flat plate beside them and a dark box at the bottom-left corner. What reproduces it: the **deck meshes mirrored in y** (their surface lies at the walkmesh's height with the sign reversed, to 0.3 FFX units at all three slots) and nothing above them drawn; the sky bowl as is, on the camera. `FFX_STAGE_PARTS` records the names and the reasoning. Side by side at the exact view (960 px wide panels): the party's first slot lands within 5 px of the capture's figure, the plate's tips within 15 px, and the corner box is about 50 px narrower than the capture's. **Open:** the lateral registration is verified only by that frame and the walkmesh's outline; nothing says the real game mirrors those meshes.
- **Evrae is not settled.** At x4 with idle frame 0 on `(-140, -35, 80)` its head lands about 3 world units (30 FFX) lower and left of the capture's and it reads about 1.3x too large. Origin, scale (medium confidence in the converter's notes) and pose all remain candidates. Its idle bounding box puts the origin mid-body, so the HUD's head anchor (`setWorldHeight`) uses the box top.
- **The painted game's MAX mix fights the FFX camera.** CHAPTER FRAMING (default on) re-registers the `idle` rig (3 to 4 percent farther here) and puts a `camera.view` offset on the camera (-77, -43 px at 1920x1080). The pictures were taken with the three EYE CANDY looks off (`__pyrefly.app.save.setSettings({ fxLight: false, fxLiving: false, fxSpectacle: false })`); a mix-on picture is kept beside them. Phase 4b's sink must clear `camera.view` and run after the mix, or the chapter must opt out of CHAPTER FRAMING.
- **FAR default view.** Through the numbers the party and Evrae are both outside the frame (the look-at stands 10.8 world units to the party's right where the half-width at their depth is 9.2; Evrae's FAR spot is 80 units off): the picture is the deck's bow and sky. Whether the real FAR view frames the party (another area record, another rule) is unread.
- **The painted pose swap still runs on the hidden planes** (the director loads Evrae's FAR painting and warns once per swap that its pixel scale differs); harmless.

**Pictures (local only; `D:\Tools\ffx-parity\shots\phase3\`, retail frames never in git):** `a-ffx-near-default.png` (and `-nohud`), `a2-ffx-near-default-mixon.png`, `b-painted-near-default.png` (and `-nohud`; the painted one is also at `docs/screenshots/fayth-3d/fayth-painted-ffx-staging-near.png`), `c-ffx-overview.png`, `d-ffx-far-default.png`, `cmp-near.png` (the PS2 frame beside ours), `capture.mjs` (the harness).

**For phase 4b (camera replay):** apply the pose after `BattleCamera.update` and after the mix's lens shift; map with `ffxWorldMatrix()`; the vertical lens is kept (26.38 degrees at 1024); the scene already publishes the NEAR default as `intro`, `idle`, `action`, `enemy`, `party`, `victory` and the FAR default as the `-far` names, and `director.staging` hands the range director the same views.
**For animations:** the skin already follows the actor's alpha and divides out its scale; a pose needs the clip mixer on the model root (the files are `evrae-anims.glb` and the per-actor idle only so far), and the KO fall rotates `inner`, so the model tips with it.

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
