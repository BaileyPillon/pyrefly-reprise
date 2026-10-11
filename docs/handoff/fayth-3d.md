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

**For phase 4b (camera replay; done, see "Phase 4b" below):** apply the pose after `BattleCamera.update` and after the mix's lens shift; map with `ffxWorldMatrix()`; the vertical lens is kept (26.38 degrees at 1024); the scene already publishes the NEAR default as `intro`, `idle`, `action`, `enemy`, `party`, `victory` and the FAR default as the `-far` names, and `director.staging` hands the range director the same views.
**For animations:** the skin already follows the actor's alpha and divides out its scale; a pose needs the clip mixer on the model root (the files are `evrae-anims.glb` and the per-actor idle only so far), and the KO fall rotates `inner`, so the model tips with it.

## Phase 4b: DONE (2026-10-11 ~04:00 EDT; branch `fayth-3d`; FFX only): FFX's camera replayed on the deck scene for both skins, test modes A and B, the typical turn captured

**Game case: FFX only** (Evrae's fight, FFX's camera programs). The seam use is inert for every other chapter. **What exists (dev server with Bailey's local camera folder only; the website, production, every test and a dev server without the folder get phase 3's scene, the stub director, byte for byte):**

| What | Where |
|---|---|
| The scene glue: loads the programs (`loadFfxCameraPrograms('evrae')`), publishes the director for the `ffx` skin **and** `?skin=painted`, hooks the render, reads `?ffxcam=a\|b` and `?ffxseed=`, leaves the `__ffxcam` debug handle | `src/scenes/exp-fayth-camera.ts` (reached from `exp-fayth-deck.ts` through a second `import()` inside `import.meta.env.DEV`; with no skin staged or no camera folder it returns the build it was given) |
| The chapter's camera: the roster, the actor frames, the launch fallback, the range scenes, the defeat, the waits | `src/engine/ffxcam/faythCamera.ts`, `roster.ts`, `frames.ts` (pure: no `three`, no DOM) |
| The pose latch and the render hook; variant B's clamp | `src/engine/ffxcam/latch.ts`, `variant.ts` |
| Additions to the replayer: `launchOwed(ctx)`, `busy`, `sceneRunning` | `src/engine/ffxcam/director.ts` (344 lines) |
| Small additive pieces: sink option `clearViewOffset`; `worldPointToFfx` / `worldLengthToFfx`; `FfxModel.width` (the larger of the model box's x and z extents, `spreadOf`); `FfxSkin.modelOf` | `sink.ts`, `ffxWorld.ts`, `models.ts`, `ffxSkin.ts`; `exp-fayth-skin.ts` now exports `derive` and `skinOf` |

- **How the sink ordering works.** The frame runs in this order: the scene's `update` (the build's, where the director steps and **keeps** its pose in a `PoseLatch`), `BattleCamera.update` (writes position, aim and roll every frame), the MAX mix (`framing.applyLens`: a view offset), then the render. `WebGLRenderer.render` calls `scene.onBeforeRender` after the matrices are updated and before it reads them, so the latch is written there (`hookBeforeRender`, `ThreeCameraSink.apply`, only for the hooked camera, once per render, the same pose for every render of the frame). **Proved three ways:** `tests/unit/ffxcam-latch.test.ts` (a frame in the game's order against a stand-in for the head of `WebGLRenderer.render`, with a negative control that writes at the director's step and is overwritten); `tests/unit/chapters/exp-fayth-camera.test.ts` (the same through the real `loadScene`); and a **logged live frame** (`order-proof.mjs`: the battle camera parked on the `overview` rig, six frames: after `BattleCamera.update` the camera stands at x = -35.480, at the render hook after the sink at x = -9.253, FFX's near default view).
- **The mix opt-out.** The mix has no per-chapter switch (its gates are the global EYE CANDY settings, which are the player's), so nothing in `fx/mix/*` is touched and the **sink clears the view offset on every apply** (`clearViewOffset: true`). Live proof (`viewoffset-proof.mjs`): with a view offset of (-77, -43) put on the camera after every scene update, as `applyLens` does, it was on after the update in 30 of 30 frames and **off at the head of all 30 renders**. In the captured runs the mix never put an offset on in this scene (`camera.view` stayed null), and the looks-on frames show Evrae and the party at the same size as looks-off. **Not covered:** the HUD's panel clearance and anchors are laid out against the battle camera's rest camera, not the FFX pose, so panels do not dodge figures in FFX's shots, and the damage numeral and the head anchors follow the live camera (they landed on Evrae in the looks-on attack frames).
- **From a beat to the camera** (`faythCamera.ts`; the director's own table is in `director.ts`'s header):
  - **The launch fallback.** The presenter raises `impact` only where damage lands, so a status-only action (Slow, Haste, a miss) never reached its launch shot. At the action's close, **before Normal**, an action that owes its launch starts it and **the close waits** until the camera is idle: the battle waits for the program, never longer than the program runs (capped at `HOLD_CAP_STEPS` = 600 steps, released when the scene is left or the fight is won; at once when skipping). Measured: Tidus's Slow (a 252-step orbit, `w5.f43`) holds the close for 252 steps = **10 s at the default pace**, which is the longest stall. FFX cuts such an orbit with Normal when the action's effect ends; ours ends earlier, so a **cap on the fallback hold is the one pacing knob** (a number of ours, not game data: ask Bailey before inventing it).
  - **The range scenes.** The engine flips `airship.range` as it resolves Cid's order, **before** the presenter plays that action (the order itself raises no beat of its own: Cid's turn is a `turnStart` and nothing else), so the scene program (Pull back 185 steps, Move in 231) starts at the flip. While it runs, a turn start is not raised (the presenter does not wait for it) and **an action's opening waits for the scene to end** (the presenter awaits it), so the next action begins when the swoop has landed, as FFX's own order waits for Evrae's flight; its close waits too. The range director's own shift (1.5 s) never cuts the 6 s swoop: `rangeSettled` is only the clean-up (the director has already ended the scene).
  - **Defeat** (the seam has no beat): every active party actor in the `ko` pose is reported once and the director raises tag 67 (`system_01.w1.f5` plays: seen in the Poison Breath run, the whole party down).
  - **The roster** (`roster.ts`): Tidus 0, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6; Evrae 20 (monster 119), Cid 21 (149). **The frames** (`frames.ts`): the actor's world position through the inverse transform, heading pi for the party and 0 for Evrae (`sideFacing`), height and width in FFX units from the model (`FfxModel.height`, `.width`) or the painting. All four stay **Open** as game data (the camera lane's SPEC 12): the fixed-point shots (defaults, attacks, Poison Breath, Photon Spray, the airship scenes) do not use them, the character-relative ones (spells, items, the MagicStart orbit) do.
  - **Time.** `FaythCamera.update(dt)` advances the director by the frame's own dt at the playback rate of the last beat (`ctx.ms`), so it carries the pacing option: **at the default `steady` pace (x1.2 for FFX actions) the camera runs 25 steps a second, not 29.97** (measured 40.0 ms per step); `?pace=current` gives FFX's 29.97.
- **Variants.** `?ffxcam=a` (default): every angle. `?ffxcam=b`: a filter between the latch and the sink clamps the eye's azimuth about the look-at point to **`FFXCAM_B_AZIMUTH_LIMIT_DEG` = 35** degrees of the near default view's (101.52 degrees), keeping the look-at, the eye's height and horizontal radius (so the distance), the roll, the lens, the timing and the cuts (`variant.ts`; a pose inside the arc is returned as it is; the clamp is continuous). The director's programs see the unfiltered pose, the screen the filtered one (the capture traces keep both: `eye` and `rawEye`). `?ffxseed=n` seeds the camera's own dice (default 1, so A and B and two runs choose the same shots).
- **What the pictures show** (honest reading, FFX skin A unless said). **The camera numbers are the script's** (the capture traces hold every pose; the program constants stay in the local SPEC, not here): at battle start the near default view (eye (-95.97, -136.09, 333.64), the PS2 capture's); Tidus's Attack cuts at the action's opening to the side view of `w3.f9` (SPEC 9.2's eye and look-at, matched to the digit), holds through the hits and Normal cuts back to the default view at the close; Evrae's Attack uses the same side view; Poison Breath plays Normal at its start and its own shot (`w4.f2`, look-at rising through the head and tilting up into sky) at the first hit; Pull back is `w3.f10` to the step: hard cut at +0, a 120-step straight sweep out to a wide shot of the whole airship, the hard cut at +120 onto SPEC 9.2's key eye, a 64-step blend in to the FAR default, 185 steps. **It reads:** the swoop is a clear cinematic move (the airship's profile shrinking, then the stern with the party on top); the side view over the party's shoulder with Evrae facing the camera reads very well; the MagicStart close-up of the caster (variant B, e.g. Wakka's face and potion) is the best picture of the set. **What does not:**
  1. **The FAR default view frames neither the party nor Evrae** (phase 3's finding, now every FAR turn): the stern dome and sky. The second area record (POSITIONS.json `area1`) and its selection rule are unread; the party may stand elsewhere at FAR.
  2. **MagicStart variant A** (the other 50 percent of casts and items, picked by `camRand`) puts the eye 3.5 FFX units above the floor, **against or inside our reconstructed hull**: the frame is grey streaked deck for the whole orbit (seeds 1 and 2; seeds 3 and 4 get the portrait variant). The pose is the script's; the likely cause is stage geometry (the mirrored deck rising above the eye near the party), not the replay, but that is not proved.
  3. **Spell and item shots frame by estimated extents** (above); Evrae's head at the breath is about 3 world units lower than the capture's (phase 3).
  4. **Nothing animates yet**: the models hold their idle pose, so a swing is a static body and a slash effect.
  5. **Painted A is not viable**: the painted deck, billboards and sky plate were made for the near camera; FFX's side view sees the billboards edge-on and the plate behind them is missing (`painted-a-attack-side-view.png`), and the swoop leaves the plate (`painted-ab-pull-sheet.png`, top rows: deep navy). **Painted B works for the attack views and the swoop**: the clamp keeps the plate behind the deck and the party facing the camera (`painted-b-attack-side-view-clamped.png`, bottom rows of the sheet). It does not cover pitch or zoom: Poison Breath's tilt-up into the sky and the defeat camera still run off the plate's edge (deep navy beyond it), and once the swoop is over the spell shot at FAR fills the frame with Evrae's FAR painting (the last two frames of each row of the sheet).
  6. The command menu opens as soon as a turn starts, even under a swoop (FFX's flow waits for the scene); only the chosen action waits.
- **Pacing** (seed 1, auto `intended`, real time, 1920x1080, GPU Chromium, the default `steady` pace; **every run is a victory in 82 turns and 531 events**, so the engine's flow is identical and only the presentation differs). Battle durations (`BattleScreenResult.elapsedMs`):

  | Run | ms |
  |---|---|
  | Chapter VIII (`evrae-airship`), no director | **212,349** |
  | `exp-fayth` `?skin=classic` (the stub: declines every beat) | 211,968 |
  | `exp-fayth`, `ffx` skin, FFX director (A) | **227,923** (+15,574, +7.3 %) |
  | `exp-fayth` `?skin=painted`, director (A) | 226,687 (+14,338, +6.8 %) |
  | `exp-fayth`, `ffx` skin, director (A), a second run with the hold trace | 218,753 (+6,404, +3.0 %) |

  The two runs without a director agree within 0.4 s; the three with one differ by up to 9 s (the same fight under wall-clock timers and real frames), so read the cost as **+3 to +7 percent**. **Where it goes** (the traced run, `pacing-holds.mjs`): the director put **45.2 s of holds** on the battle in five answers, plus fourteen of 2 steps (the status-only moves whose launch is one frame): Tidus's Slow closes, 3 x 10.05 s (the launch fallback runs the 252-step orbit `w5.f43`), the Pull back scene held Tidus's next opening 5.9 s (149 of its 185 steps: the opening came 36 steps into the swoop) and Evrae's Swooping Scythe opening, which is the Move in scene, 9.1 s (231 steps). **It also removes** BattleMoments' 420 ms cast hold (x1.2 at this pace) at each of the 52 cast openings it takes, about 26 s, which is why the net is not +45 s. **No hold outlasts its program:** the longest is 252 steps for a 250-step orbit, and the scene waits are shorter than the scene.
- **Local pictures** (retail frames of the `ffx` skin: **only** in `D:\Tools\ffx-parity\shots\phase4b\`, never in git): one folder per condition, `ffx-a`, `ffx-b` (the `ffx` skin with `?ffxcam=a|b`), `painted-a`, `painted-b` (`?skin=painted&ffxcam=a|b`), each with `start`, `attack`, `pull`, `spell` and `missiles` windows at one frame every 10 director steps (the file name ends `-s+N`: the steps since the window opened) and a `<label>-trace.json` (every beat with its step, and per frame the program, the pose, the unfiltered pose and the camera's world position); `<label>-near` runs (the party attacks only, so Evrae stays NEAR) hold Evrae's first Attack and the Poison Breath; `ffx-a-item*` the MagicStart variants; `ffx-a-hud` the looks-on frames with the game's UI; contact sheets `*-sheet.png`, `cmp-attack.png`. **Videos** (`video\`, real time, 1280x720, the UI hidden): `<label>-sequence.webm` (about 28 s: the opening, Tidus's Attack, Rikku's Pull back order, Evrae's Attack, Wakka's potion, the Pull back swoop, Tidus's Slow) and `<label>-near.webm` (about 35 s, the party only attacks: Evrae's Attack, Stone Gaze, Inhale, Poison Breath, the party's fall) for `ffx-a`, `ffx-b`, `painted-a` and `painted-b`, each beside a `-beats.json` (every beat with its time: add `traceInstalledAtVideoSeconds` to find it in the video). The harness: `frames.mjs` (Playwright's fake clock paused after the trace is installed: every rAF frame is exactly 16 ms of virtual time, so a picture every 10 steps is exact and repeatable; `--ui=off` hides `#ui`; `--looks=off` as phase 3; `--strategy=attack` keeps Evrae at NEAR), `video.mjs`, `pacing.mjs`, `pacing-holds.mjs`, `order-proof.mjs`, `viewoffset-proof.mjs`, `prod-proof.mjs`, `sheet.mjs`, `trace-summary.mjs`. Painted-skin frames kept in git: `docs/screenshots/fayth-3d/phase4b/` (three files). Code at `48eaacc1`.
- **Production proof.** A production-mode Vite build of `exp-fayth-deck.ts` (library entry, minify off, `prod-proof.mjs`: 1,017 KiB) holds none of `stageFaythCamera`, `stageFaythSkin`, `FaythCamera`, `FfxCameraDirector`, `PoseLatch`, `hookBeforeRender`, `ThreeCameraSink`, `clampAzimuth`, `FAYTH_ROSTER`, `loadFfxCameraPrograms`, `ffxcam-index`, `loadFfxModels`, `FfxSkin`, `probeFfxLocal`, `__ffxcam` or `__ffx-local` (the one word `GLTFLoader` is in a three.js comment); `STUB_SHOT_DIRECTOR` is there. `tests/unit/ffx-local-guard.test.ts` now also pins, in source, that the deck scene reaches the skin and the camera glue only through `import()` inside `import.meta.env.DEV`, and that the glue is the only importer of the camera loader.
- **Open problems for the next lane:** (1) the FAR default and the second area record; (2) the MagicStart variant A frame inside the hull (flatten the deck near the party's slots, or clip); (3) heights, widths, aim point and heading of the frames against a real FFX sample; (4) the roll's sign (spell shots roll 15 degrees; `rollSign` exists) and how the Steam build widens 4:3 to 16:9 (the vertical field is kept); (5) a cap on the launch fallback's hold, and whether the long spell orbits should be cut by Normal as FFX cuts them; (6) the command menu under a swoop; (7) the HUD's panels against the FFX pose; (8) animations; (9) the options round for Bailey (phase 6): the real game's frames beside `ffx-a`, `painted-a` and `painted-b`.

## In flight when the cap hit (may have stopped mid-work)

1. **Phase 2 converter**: `D:\Tools\ffx-parity\assets\tools\phyre2gltf\` produces `assets\runtime\evrae\{stage,evrae,tidus,wakka,rikku}.glb` + `runtime\manifest.json` + `runtime\_checks\*.png`.
   - Port eArmada8/ed8pkg2gltf (MIT); the GPL refs are read-only.
   - Inputs: Evrae is m119; party battle models are `chr/pc/c001`–`c007`; the stage is field map `hiku15`.

## Next lanes (in order; 1 to 4 are done, see Phases 3 and 4b above)

1. **Camera programs for the Evrae fight.**
   - Decode every camera program the fight runs (`hiku15_00`, the tags 26/27/28/29+chr/52/66 programs in `btl/system_01`, the MagicCamera workers for the party's spells and items, and Evrae's custom shots).
   - Output: normalized JSON in `D:\Tools\ffx-parity\camera\programs\evrae\` plus a spec of the call subset used.
   - Tool: the RE session's disassembler `node D:\Tools\rea\tools\atel.mjs <bin> --ffx --vars` (read-only; Evrae dis in `D:\Tools\ffx-parity\ai\ffx-evrae-yojimbo-isaaru-sin\dis\`; call to handler via `ai\ffx-yunalesca-bfa\handler.mjs`).
2. **Formation positions** for `hiku15_00` (party slots and Evrae, near and far), so both skins stand where FFX stands them.
3. **Phase 3:** the `ffx` skin on `exp-fayth-deck` (models parented to the actor groups, painted planes hidden, the stage swapped in), and a first static render.
4. **Phase 4 (done 2026-10-11):** the FFX camera-program VM and its wiring behind the seam, variants A and B (`?ffxcam=a|b`) per D-632. The programs are Bailey's local transcription, not a data table in the repo (`src/data/ffx/camera/` was never made: rule 8).
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
