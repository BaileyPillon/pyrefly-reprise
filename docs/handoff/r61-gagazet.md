# Release 61: Chapter I's backdrop, depth and life (branch `r61-gagazet`)

**Game case: FFX only for the recipe (Chapter I, Seymour Flux, Mt. Gagazet, `scene.key` `gagazet`); both games for the plumbing (`src/engine/look/stage/`, the wind cell, option B's density hooks).**
Branch `r61-gagazet` from `origin/r61-repro` (`07ccc0029`, live release 60 plus the build-parity fix). **Not deployed, no review run, nothing on `main`.** It ships only after Bailey has seen the before / after clip.

Bailey, 2026-10-21 ~00:30 EDT (decision 169m): "the Seymour backdrop gets depth and life (parallax layers, drifting snow and mist, moonlight), shown as a before/after clip first." The pick was
"Add depth and life (Recommended)": "Parallax layers, drifting snow and mist, moonlight on the ice". The conference is Monday 2026-10-26.

## What live release 60 already had in Chapter I (measured, `explore1`; see "Numbers")

Measured on this tree's own build (`D:/Tools/pyrefly-scratch/2026-10-21/r61-gagazet/runs/perf1440`, headless GPU Chromium, release 60 art plus the `/fx` depth maps the live site serves, `?stage=off` for TODAY):

- **Option B's depth plates are on in live Chapter I.** `fx.snapshot().b`: tier `full`, **4 plates** cut from the painting by `fx/gagazet/depth.png` (coverage 1.00 / 0.65 / 0.44 / 0.21, composed at the master's 5376 px, built in 2.1 s at battle start), the camera's arcing drift at full weight
  (about 15 px of slide for the nearest plate against the far one at 1600 wide, 24 px at 2560, at the drift's extreme: `tests/unit/look-stage.test.ts` pins it), four haze sheets, three flake fields (260 flakes, 16 wind streaks, 70 near flakes), the moon's halo. The scene adds three snow bands, spindrift, glitter, a faint sheen, four mist planes.
- **So the layers this decision asked for already exist in live.** The earlier demo clips (`demo-int`, TODAY vs DEMO) were recorded on a harness whose dev server answered `/fx/*` with the app's `index.html` (no `public/fx` in those trees), so their TODAY had no depth plates and read flat. This branch's harness serves `/fx` from `D:/Tools/pyrefly-art-backup/fx`, as the deployed site does.
- **The look's light is not the moon.** `__pyrefly.look.stats()` for Chapter I: light `[0.211, 0.847]`, `lightFrom: 'found'`: the finder picked the bright snowfield at the bottom of the painting (the moon is at u 0.226, v 0.154). The bold shafts therefore rise from below the frame, and the party's key and rim follow that point. Authoring the moon as the light (tried, `ROOM_LOOKS`) bleaches the left half of the frame (the bold shafts are tuned for a source outside it), so this branch leaves the light alone and gives the shaft pass its own origin (below).

## What this branch adds

1. **One wind for the room's weather (`StageMaths.gustAt`, the shared cell `StageWind.ts`).** A gust comes about every 11 seconds, a smooth bell about 4 seconds wide, each a different strength (44 percent to full), with a light breath between them. While it blows the three snow bands and the spindrift of the scene
   (`scenes/gagazet.ts`) and option B's flakes, streaks and haze run on a clock up to 2.6 times faster, B's wind streaks and its mist at the ground thicken (up to 1.6 times; the far veils over the moon and the ridges stay as painted: thickening them bleached the moon in the first capture), and the moon's shafts brighten by up to 20 percent:
   more snow and mist in the air throws more of the light. Everything reads one cell, so a gust is one breath, not five effects.
2. **The moon's glitter on the ice (`StageGlintShader.ts`).** One flat sheet over the lit ground and under the fighters. For each fragment it knows the floor point, the eye (the live camera) and the moon (the painting's own, projected to its plane), so the road of sparkles slides across the ice as the camera drifts exactly as the
   painted plates slide behind it: that is what "moves with the parallax" means here. The floor is cut into 7 cm facets with one hashed tilt each; a facet shines when its normal lines up with the half vector between the eye and the moon; each has its own twinkle and a soft dot in its cell. Under the sparkles a broad
   saturated-blue sheen, brighter toward the horizon (Fresnel), broken into slow patches that drift. The patch dissolves toward its rim and toward the far distance.
3. **Two low mist banks (option B's own `Haze` sheet class, `look-stage-mist`)**: one behind the fighters over the ground, one that crosses their feet (up to their knees, never a face), scrolling on the gust-run clock and thickening in a gust.
4. **The quality tiers (`?lookq=medium|low`, F7)** drop the glitter (70 percent / off), the snow bands, option B's flakes and the haze sheets (70 / 45 percent; the far sheets go first), and soften the wind (85 / 60 percent). LOW EFFECTS takes the glitter and the banks away. REDUCE MOTION: the weather holds still, with no surge.
5. **The moon's shafts start at the moon (`LookMainShader` `shaftL`, `LookRig`).** The shaft pass had one origin, the room's light; for Gagazet that is the snowfield (see above). While the stage runs the pass starts its rays at the painted moon, at 0.075 of the bold gain (0.2 bleached the left of the frame, 0.04 was invisible; the sweep is in `runs/drive5`); the rim, the fog glow and the figures' key light still follow the room's light, as in release 60.
   With the stage off, the uniform equals `uLight` and the shader is the one it was.
6. **The painting's layers are option B's depth plates, unchanged** (see above): the same painting cut by its depth map into four plates, holes filled by a push-pull fill of the plate's own pixels, parallax from the camera's arcing drift. This branch does not add a second layer system on top of that one.


## Files

| File | What |
|---|---|
| `src/engine/look/stage/StageMaths.ts` | Pure: the gust envelope (`gustAt`), the warped weather clock (`windClock`), the thickening and shaft multipliers, the facet glitter (`facetGlint`, mirrored by the shader), the layer slide in pixels (`layerSlidePx`) |
| `src/engine/look/stage/StageConfig.ts` | The room table (`ROOM_STAGE.gagazet`, FFX), the quality tiers (`STAGE_QUALITY`), `stageWanted`, `?stage=off` |
| `src/engine/look/stage/StageWind.ts` | The shared wind cell the weather reads (`gust`, `speed`, `thicken`, `shaft`, `density`); calm values 0 / 1 / 1 / 1 / 1 |
| `src/engine/look/stage/StageGlintShader.ts` | The moon's glitter on the ice (GLSL) |
| `src/engine/look/stage/LookStage.ts` | The per-frame work: wind, glitter, quality, the restartable clock (`stage.t0`), live tuning (`stage.*`) |
| `src/engine/look/LookRig.ts` | Builds / updates / takes away the stage with the look; the moon's shaft gain times the gust (`stageWind.shaft`) |
| `src/scenes/gagazet.ts` | The three snow bands and the spindrift ride the wind clock and the density; the pyreflies and the ice glitter do not |
| `src/engine/fx/b/LivingPaintings.ts`, `QuadField.ts` | Option B's weather reads the wind clock, the streaks and mist the thickening, the flakes and haze sheets the density (`QuadField.setDensity`) |
| `tests/unit/look-stage.test.ts`, `look-stage-rig.test.ts` | The maths, the recipe table, the object (31 tests) |

## Switches

- It runs exactly while the HD-2D look at **bold** strength is on in a room with a recipe (`stageWanted`). `?look=off`, `?look=anime`, the VISUAL STYLE setting's CLASSIC (anything that turns the look off) and every other chapter get none of it,
  and the wind cell stands at its calm values, so option B's and the scene's arithmetic is the one it was (`dt * 1`, `opacity * 1`, no draw range written).
- `?stage=off` (dev): the look as release 60 had it, for the before / after captures. `__pyrefly.look.param('stage.off', 1)` does the same live.
- `__pyrefly.look.param(...)`: `stage.glint` (0 removes the glitter), `stage.gain`, `stage.rough`, `stage.width`, `stage.cell`, `stage.sheen`, `stage.speed` (multipliers on the recipe's numbers), `stage.wind` (0 = no gusts), `stage.density`, `stage.t0` (restart the stage clock at that second:
  the capture's gusts land on the same seconds every take). `__pyrefly.look.stats().stage` reads the state.
- Quality: `?lookq=medium|low` (F7): the glitter 70 percent / off, the snow and mist 70 / 45 percent, the wind 85 / 60 percent. LOW EFFECTS takes the glitter away; REDUCE MOTION holds the weather still with no surge.

## Numbers (RTX 5070 Ti, headless GPU Chromium, Chapter I at its first menu; `explore.mjs`, scratch)

Render ms is the post chain plus the scene draw, 240 frames back to back with a GPU sync at the end (the game's own sharpness ladder, no `crisp=` pin); rAF is the interval of the game running on its own for 8 s (481 frames).

| 2560x1440 | NEW (stage on) | TODAY (`?stage=off`, release 60's look) | look off |
|---|---|---|---|
| 01:29, first recipe, quiet GPU | 6.84 ms | 6.43 ms | 3.93 ms |
| 02:10, the first clip's recipe | 6.85 ms | 6.48 ms | 3.88 ms |
| 02:30, the final recipe, GPU busy (another lane was rendering; TODAY moved too) | 8.55 ms | 7.25 ms | 4.66 ms |

The stage costs about 0.4 ms at 1440p when the GPU is quiet (a floor sheet and two noise sheets) and about 1.3 ms in the busy run; the HD-2D bold look itself costs about 2.5 ms. rAF p50 / p95 / p99 = 16.7 / 16.8 / 16.8 ms in every run at 2560x1440 and at 1600x900: locked 60 fps.
The coordinator's render window (`RIG-RECORD.render-log`, 01:48:15 to 01:49:16) does not overlap any timing run.

## The clip (the gate: Bailey sees it before this ships)

`D:/Tools/pyrefly-scratch/2026-10-21/r61-gagazet/for-bailey/`: `gagazet-before-after.mp4` (TODAY | NEW, 3200x900, 15.4 s, 60 fps, 2560x1440 recordings scaled to 1600 wide each), `gagazet-new-alone.mp4`, and three matched stills (`still-1-idle`, `-2-attack`, `-3-spell`; `-TODAY.png` and `-NEW.png` at 2560x1440 with the demo HUD, `-pair.jpg` side by side).
Real keys on a paused page clock stepped at 60 Hz (the seed pinned, the same battle events in both): Tidus attacks Seymour Flux, then Yuna casts Cure on Tidus. TODAY is `?stage=off` of this very build (release 60's frame: with it off every new uniform and cell holds its calm value and the shader runs release 60's expressions), NEW the same page without it. Both takes played the same 30 battle events (checked event for event), the stills fall on the same frames (196, 624, 878 of 980), 0 console errors and 0 404s; the drift's phase and the stage clock (`stage.t0` 26.5: a strong gust 3.5 s and 14.5 s in) are pinned so both takes see the same weather.
Recorded by `tools/record.mjs` of the demo-int harness, adapted (`/fx` served, a fixed middleware) in the scratch folder `tools/`; nothing of it is in the repo.

## What it looks like, honestly

- Clearly better: the ice. The floor has a moon-lit glitter road of separate twinkling points round the fighters and a faint luminous sheen where the TODAY floor is flat navy; it slides with the camera drift. The moon has soft rays and a brighter heart.
- Better but quiet: the mist banks (one behind the fighters, one at their feet, thicker in a gust) and the gusts (the snow, streaks and mist surge about 3 times faster for 4 seconds, about every 11). Stills hide this; the motion shows it. Checked by the stage's own readout (`gust 0.87, speed 2.9` at the peak), not by eye on the video.
- Not new: the parallax. Option B's four plates already run in live (above); both takes have them. This branch adds no second layer system.
- Cost: the left half of the frame is lighter than TODAY in the idle shots (the moon's rays and the sheen); in the action shots (the camera looks away from the moon) NEW is a deeper blue than TODAY, which glows there from shafts rising from below the frame.
- Checked in the frames: no cut-out halos at the plates' edges at the drift's extremes (native-size crops of the ridge and the left rock), no stretched smears, no snow over a face (the near flakes pass over the fighters as in release 60), the HUD untouched.
- Not fixed, not this branch's: the pale flat ellipses on the floor beside the party (scene `snow-drift` masks) are in both takes; the look's light finder picks the snowfield, not the moon (above).

## Checks

- `npx tsc --noEmit` clean (tsc 7 on the tree, 3,763+ files).
- New unit files: `tests/unit/look-stage.test.ts` (24: the gust envelope and its shape, the warped clock, the facet glitter against its mirror maths, the Fresnel sheen, the layers' slide in pixels against option B's real plate depths, the recipe table and tiers) and `look-stage-rig.test.ts` (12: the stage object in a node scene: nothing built for a room with no recipe or for the other game,
  the glitter sheet and the two mist banks under the figures, the wind cell written and put back to calm, the tiers, LOW EFFECTS, REDUCE MOTION, the live tweaks, `stage.t0` giving the same wind in two takes, `QuadField.setDensity`).
- The existing look and option B tests pass with them (`look-*`, `fx-b-*`, `fx-living-ko-cross`, `eyecandy-flags`, `eye-candy-mix-connection`: 205 tests). The three goldens (`ff7-golden`, `ffx-engine-golden`, `ffx2-atb-golden`): 27 tests, as they were. `node tools/orphans.mjs`: 24 orphaned modules, none of them this branch's.
- In a browser (headless GPU Chromium, real keys, the first menu of Chapter I; scratch `D:/Tools/pyrefly-scratch/2026-10-21/r61-gagazet`): 0 console errors and 0 404s in every run; the stage's stats read on `__pyrefly.look.stats().stage`.
