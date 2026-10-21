# R61, the conference booth (branch `r61-booth`, from `origin/r61-repro` 07ccc0029)

**Game case: both games, one case per part.** The first-use card and Esc rule: **both** (shared plumbing; FFX's card holds, FFX-2's fades). Demo mode's cards, quick way back and board focus: **both** (Chapter I FFX, Chapter IV FFX-2 are the demo chapters). The battle-start stall: **both** (shared presentation plumbing; the same stall in Chapter I FFX and Chapter IV FFX-2; the HD-2D look is not its cause). The kit and the script: tooling and docs, both. Nothing here moves a rule, a number or an engine; no deploy, no review (the driver does both).

Bailey, 2026-10-19 and 20: "I demo my game in a week at a huge gaming conference" (2026-10-26), "This PC", "Demo mode: party moves first (Recommended)"; decision 169 (the booth flow: a gamepad, a 1440p monitor, headphones, about 5 minutes and one fight each). Round 27's deep review of live r60 (PR-0480, PR-0481, PR-0495) adds three findings that this branch answers in part.

## 1. Esc closes a first-use card before it pauses

Live r60, fresh profile, Chapter I: with Auron's first-command card up, the first Esc closed it AND opened the pause. FR-34-01 (release 34) had made that so on purpose; the booth wants the rule every other overlay follows. Now **Esc, X, Backspace and the pad's B close the card and nothing else; the next press pauses.**

- `src/ui/coach/cardPress.ts` (new): `swallowCancelKey` (the keyboard, capture phase, before the menu behind the card), `absorbCardPress` (the drop `App` hands in: the exclusive `Input.claimKeyboard` taken and returned at once, the way the briefing does), `coachCardUp` (asked by `BattleScreen.canPauseOnCancel` for the one frame in which the pad's edge can be read before the card's own poll has taken the card down).
- `CoachMark`: a cancel press takes the card whole (key: capture listener; pad: `claimHeldPad('cancel')`), absorbs the press when the card was on screen, and ends. `firstRunGuide`'s battle step no longer relies on the pause opening.
- The other first-run cards, checked in the real game: the briefing (exclusive claim), the guide's board card and prep card (`absorbInput`, already) and the Sphere Grid explainer (a modal that consumes cancel) all took their own Esc before this change; the battle cards (Chapter I's guided card, Chapter IV's Rikku line) are the ones that did not.
- **Real keys, headless GPU Chromium, fresh profile, dev server (`docs/screenshots/r61/esc-*`):** 14 of 14 checks: the briefing's Esc leaves the board up, the board card's Esc does not go back to the title, the prep card's Esc does not go back to the board, and at Chapter I's first menu (FFX) and Chapter IV's first menu (FFX-2) the first Esc closes the card with the screen still `battle`, the second Esc opens the pause, the third closes it. Unit: `tests/unit/r61-booth-card-esc.test.ts` (17, with the real `Input`, a polled pad, FFX and FFX-2 and a torn-down card); `ui-coach-first-run` and `ui-coach-dismiss-press` are re-pinned (they asserted FR-34-01). **Before, on the live r60** (the same check, Chapter I, https://echoesofspira.com/, fresh profile): the card is up, the first Esc closes it AND the screen is `pause` (1 of 4 checks), the bug as reported; the pictures of both are `docs/screenshots/r61/esc-D*` (this branch) and `docs/screenshots/r61/esc-D2-LIVE-r60-before-first-esc-opens-pause.jpg` (the live r60 after one Esc: the pause menu).

## 2. Demo mode (`?demo=1`)

- **No teaching cards.** `coachState.shouldShow` answers false for every surface in demo mode and the guide never arms. Nothing is marked seen, so the save is untouched. Chosen over "once per session" because the demo runs in one tab all day (once would give the cards to the first visitor and take them from the rest) and FFX's card holds the fight until a key.
- **A win goes back to the board fast, on the other demo chapter.** The story after the results panel is not played (not for a Pilgrimage fight); the board opens on Chapter IV after Chapter I and the reverse, once.
- **Real keys:** 22 of 22 checks (title -> board without a briefing -> Chapter I, seed 7, no card, nothing seen -> win -> Enter on the results -> board in 508 ms on Chapter IV -> Chapter IV, seed 56, no card -> win -> board in 477 ms on Chapter I), 0 console errors, 0 404s. The two wins are the engine's own auto-play at skip speed (disclosed; the keys are real everywhere else). `tests/unit/r61-booth-demo-polish.test.ts` (14).

## 3. The battle-start stall (PR-0481)

Measured on a cold page (headless GPU Chromium on the dev server, real keys from party prep; the scratch tools are `D:/Tools/pyrefly-scratch/2026-10-21/r61-booth/tools/hitch-profile.mjs` and its runs in `runs/hitch-*.json`: every frame gap over 200 ms with a V8 CPU profile of its window, every WebGL call over 3 ms with the program's name and defines or the texture's size). **The look is not the cause: Chapter I with `?look=off` has the same gaps.** Everything below lands under the entry's swirl, which is a held, blurred frame that dissolves when the battle is ready; it freezes the swirl's own animation and delays the reveal, it does not freeze a visible fight.

| What | Where | Cost | Cause |
|---|---|---|---|
| The probe's second WebGL2 context | `StageProbe.probeBrowser`, from the `TextureStager`'s constructor in `BattleScreen.enter` | 664 to 785 ms of `getContext` alone (Chapter I gap 0.93 to 1.1 s; about 0.45 s in Chapter IV) | once per page: ANGLE builds a whole second D3D11 context |
| The spell atlas | `FxAtlas.atlasPixels`, from `SpellFxLayer.prepare` | 120 to 140 ms | 1 MB of pixels computed in JS, once per page |
| The figures' breathing alpha | `breathRig.readAlpha` in the first updates | 0.45 to 0.63 s on a quiet GPU, 1.4 to 2.2 s busy | `getImageData` after `drawImage` of a canvas the GPU holds is a sync point that waits for the GPU queue, which holds the scene's shader builds; even the 32 x 48 thumbnail of an `ImageBitmap` waited 1.47 s |
| The first draw | `warmShaders({ draw: true })` | 0.8 to 1.0 s in one gap | `getProgramInfoLog` waits for the biggest programs' GPU executables one after the other: a Phong with shadows 210 to 240 ms, the 13 K-character shadow program 115 ms, Chapter IV's plume 270 ms, uploads 45 to 65 ms each |
| (Sometimes) the matte clean | `PaintedMatte.cleanMatte` for a late pose | 0.8 s once | a CPU pixel loop; it did not show in every run |

**The finding that shaped the fix:** any call that has to WAIT for the GPU (a readback, a second WebGL context, `getProgramInfoLog`) stops the main thread until the GPU process has built the scene's shaders, and **whichever such call comes first pays all of it**. Moving one of them only moved the stall: with the probe moved out, the breathing readback paid 1.4 s; with that held, the splash crop's `toBlob` paid 1.09 s (a run that was worse than the start, 1,317 ms). So the fix is a rule, not a patch.

**What changed** (`engine/StageWarm.ts`, `engine/GpuSettle.ts`, `BattleScreenWarmup.drawSliced`, `breathRig`, `fx/mix/splash.ts`, all in `tests/unit/r61-booth-warm.test.ts`):

1. `warmBattleStage()` takes the probe and builds the atlas once per page when a chapter is confirmed (`GameFlow.runChapter`, behind the party prep) and, in demo mode, 4 s after boot (the title stands a long time on a booth).
2. `GpuSettle`: `BattleScreen.enter` holds optional synchronous GPU work from its start and releases it after the first draw (8 s ceiling). The breathing alpha is read asynchronously (`createImageBitmap` with a resize; the flat rig meanwhile, the stand-in the code always used for a texture not yet decoded) and not while held; the Overdrive splash's crop (`splash.ts`, a speculative `toBlob` nothing needs before the first menu) waits on it. While the compile runs in the background the main thread is idle and the swirl moves.
3. The first draw is **sliced**: one draw per program family, a frame apart, the other families hidden for that draw (the field is not shown yet; visibility is restored in a `finally`), then one complete draw. The same stalls land one at a time.

**Numbers** (rAF gaps over 100 ms, one cold page each, headless GPU, dev server; one run per cell, so a pointer and not a distribution; `runs/hitch-*.json`):

| | before (worst gap / sum of gaps) | after, all changes (worst / sum) | main thread blocked after (the largest single block) |
|---|---|---|---|
| Chapter I, look on | 1,100 / 3,217 ms | **617 / 2,050 ms** | 0.32 s (the first draw's program links; the 617 and 450 ms gaps are the main thread IDLE while the busy GPU withholds frames) |
| Chapter I, look off | 967 / 2,583 ms | not re-run | |
| Chapter IV, look on | 967 / 2,101 ms | **450 / 1,716 ms** | 0.25 s per program family at most |
| Chapter IV, look off | 850 / 2,450 ms | not re-run | |

The round's acceptance, "no frame gap over 500 ms in Chapter I and IV on a cold page", is **not** met: Chapter I's worst gap is 617 ms, and it is no longer a main-thread block. Cutting below 250 ms stops here because what is left is the GPU process building the scene's biggest programs (a single Phong-with-shadows program is 187 to 224 ms of `getProgramInfoLog`), which the page cannot shorten. Building those programs before the battle's entry is the round's own proposal, "warm the battle stage during the last scene lines": it needs the battle's diorama and its lights to exist before the pre-scene ends (a reorder of `BattleScreen.enter`), which is **not a safe change before Monday**, so I changed nothing there. What the booth does instead: the graphics driver keeps compiled programs in the browser's shader cache, and a kiosk profile whose caches are kept (`reset-demo.cmd` keeps them) meets the stall once, in the warm-up the booth script asks for before the doors open. Not measured: a second fight in the same page (the review's "warm" 1,199 ms), and how visible the freeze is under the swirl to a person.

## 4. PR-0480 (Chapter IV's long frames with the look)

Measured over a whole Chapter IV fight (170 s of the engine's own auto-play at normal speed, demo seed 56, 1600x900, headless GPU, dev server; every `requestAnimationFrame` delta; `runs/frames-*.json`):

| | fps | p99 | frames over 34 ms | worst frame |
|---|---|---|---|---|
| look on (default), run 1 | 60.0 | 16.8 ms | 2 of 10,240 (0.02 %) | 50 ms |
| look on (default), run 2 | 59.4 | 16.8 ms | 13 of 10,163 (0.13 %) | 567 ms (6 frames over 100 ms) |
| `?look=off`, run 1 | 54.9 | 33.3 ms | 53 of 9,391 (0.56 %) | 1,150 ms (another session was using the GPU then) |
| `?look=off`, run 2 | 60.0 | 16.8 ms | 0 of 10,244 | 33 ms |

**Not reproduced, and not the look as far as this shows.** The review's figure is 2.0 % of frames over 34 ms and p99 44 to 46 ms on the live build under its continuity harness (which captures frames as it times them); here the look-on fight has p99 16.8 ms and 0.02 to 0.13 % over 34 ms, and the look-off arm had both the worst run (contaminated) and the cleanest. Occasional spikes appear in both arms and follow other sessions' GPU use; I changed nothing for PR-0480. A frame trace on the booth PC itself with nothing else running would settle it.

## 5. PR-0495 (the scene's music on a slow line)

`MusicLoader` asks for the cue with `fetch` priority `high`; `battlePreload`'s later-pose prefetch asks `low` (a `fetch` is high by default, so on a 400 KB/s line the music shared the line with art that was not on screen). **Not measured under a throttle on HTTP/2**: the dev server is HTTP/1.1 on the loopback, where the option cannot be seen. The offline kit makes it moot for the booth.

## 6. The demo kit and the booth script

`docs/DEMO-KIT.md` and `docs/BOOTH-SCRIPT.md` (written for the booth flow: the pad, one fight each, `A` picks, `B` goes back, hold Back + Start resets; the picker, the reset key, the attract loop and the QR are the `r61-flow` and `r61-pad` lanes' and are not in this branch). `tools/demo-kit/` serves a copy of the live site from a folder on the loopback, opens Chrome (else Edge) in kiosk mode at `?demo=1` in a profile of its own, stops what it started by PID after checking the command line, and resets a visitor by deleting the save and the per-tab memory while keeping the caches. **The full copy is 10.2 GiB, 6,160 files (the brief said a few hundred MB: 9.9 GiB of it is the figures' `@2x`, `@3x` and `@4x` masters); it does not fit on D:, the default folder is on C: (130 GB free), `--max-tier 2` is 3.0 GiB.** Run for real: the downloader on 32 live files (8.5 MB, every hash matched, a second run kept all 32), the server and start / status / stop on that folder, `tests/unit/demo-kit.test.ts` (29), and the launcher with the real Chrome, windowed, 13 of 13 checks (`runs/kit-launch-test.log`: the browser asked the server for the page, ran in the kit's own profile at `?demo=1`, `reset` closed it by PID and opened a new one with the caches kept, `stop` closed the browser and the server and left no state).

## What is not done

- The kiosk (`--kiosk --start-fullscreen`) window on the 1440p monitor, and the pad in it, were not run: the launcher was tested windowed with the real Chrome, and the kiosk flags are asserted in `tests/unit/demo-kit.test.ts` only. First thing to do on the booth PC: `start-demo.cmd`, press a pad button, check the pad moves the cursor.
- The full 10.2 GiB download was not run (D: has 7.5 GB free).
- Fix 2 is partial: see section 3.
- The first-draw slices group drawables by a program-family key that approximates three's own; a family that hides two programs still stalls them together.
