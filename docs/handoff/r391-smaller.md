# r391-smaller: release 39.1, the smaller decisions (B2, B3, B5, B6, B8, B9, B10, B11, N1)

Built 2026-10-05 by a Sonnet sub-agent for the driver, on branch `r391-smaller` (from `origin/main` cfab29b4, worktree `D:/pyrefly-cf-switch`).
Nothing was merged into main and nothing was deployed. Bailey, 2026-10-05: **"I'll go with all of your recommendations"** and **"you can go full speed
ahead i have another account with full usage"**; after seeing the B2, B6 and B9 before/after frames: **"I love the new changes. keep it going. it's lit."**
(B9 as built: the symmetric `DISC_LIFT` 0.30 layout.) B1, B4, B7, U1 and U2 are "no change" and were not touched.

Every proof below is by real input (the keys a player presses) in headless Chromium from node on the real GPU (`PYREFLY_BROWSER=gpu`), never the
Claude-in-Chrome extension or the in-app browser pane. Frames are in `docs/screenshots/r391-smaller/`. `docs/screenshots/` is outside the sparse checkout:
stage with `git add --sparse`.

## Per item (game case, commit, what changed, how it was measured)

| Item | Game case | What changed | Evidence |
|---|---|---|---|
| **B2** `22878c59` | FFX-2 only (only FFX-2 has the dressphere close-up) | The strategy guide and the move advisor step out (class `mix-held-sc`) while the close-up is held; the frame comes first. `MaxMix.ts`. | `b2-leblanc-paine-*`, `b2-bahamut-yuna-*` (before, after, strip). Test `r391-held-cards`. |
| **B3** `c49656ff` | FFX-2 only | The close-up waits up to 1.0 s (was 0.6 s) for an enemy action in flight (`shotPending.ts`, `PENDING_FOE_S`); a menu, the framing and a teammate's action keep 0.6 s; no ATB timing or enemy action is delayed. | Leblanc, Den of Woe, Fallen Aeons, Vegnagun x seeds 1 and 9 x 4 forced changes at 200 ms art delay (32 changes): shot present 20 of 32 before, 23 of 32 after; enemy-action refusals 5 before, 1 after; menu-gate refusals 7 before, 8 after (D-357/B1 keep that rule: the remaining misses are the menu gate). Test `r39-shot-pending` (4 new). |
| **B5** `28cd8ef6` | FFX-2 desktop only | `ShotRules.reveal`: when the played reveal rig would cut a girl (97 percent whole), the reveal goes as far toward the boss as keeps every girl (and the boss in play, else the girls alone), a blend of the master and the enemy rig (new optional `CameraPort.blendRig`). Same moves, same times, so the 6.0 s opening is as long as it was. | Den of Woe first link: Yuna's smallest share 0 before, 1.00 after, left edge -460 px to 21 px; Fallen Aeons 0 to 1.00 (-454 to 17 px); Den link 2 seam 0 to 1.00 (-285 to 18 px); opening 6.02 s before, 6.05 s after. Leblanc and Vegnagun: same rig as live. `b5-*` strips. Tests `r391-reveal-fit` (10), `presenter-shot-fit`. |
| **B6** `93faad26` | FFX-2 only (Chapter IV) | `plateDim.ts`: the lit pane strip of the Bevelle plate behind the gap in Bahamut's neck is held down (`BEVELLE_PLATE_DIM`). The first try (dimming the lamp glow) left the blob: the strip is in the painting, found by hiding Bahamut and mapping screen pixels to plate UV. | `b6-bahamut-*`, neck close-ups. Test `r391-plate-dim`. |
| **B8** `a0fa5659` | FFX only (Chapter IX) | `SAKURA_ARRIVAL_MS`: the going out is 2.2 to 3.6 s (was 3.6 to 5.8 s); the coming in is untouched. | Real run, 1600x900: full opening's arrival lasts 3.63 s from its first visible frame (5.77 s before); hurried 2.28 s (2.92 s before). `b8-arrival-before-vs-after.jpg`. Tests `cavern-scene` (new pin), `cavern-hurried-arrival`. |
| **B9** `cee699aa` | FFX only (Chapter XII) | `DISC_LIFT` 0.30: the four Mortiphasm discs stand 0.30 of Seymour's height higher (the whole grid, because the strip's order is pinned to the 2x2 on the field). | `b9-omnis-*`. Test `r391-disc-lift`. |
| **B10** `098ef85f` | both (shared pause screen) | `pause/extension.ts` + CSS: where the container is larger than the 3360x1920 plate, the same pause painting continues behind it, blurred and darkened; never drawn where the plate covers the window. | 3840x2160 right strip luma 3.9 to 17.0 (FFX), 3.9 to 7.5 (FFX-2); 3440x1440 right strip 4.4 to 12.2; 1600x900 identical to live (mean abs diff 0.065 and 0.067, no pixel over 24). `b10-pause-4k-before-vs-after.jpg`. Test `r391-pause-extension`. |
| **B11** `827dcd9a` | FFX only | `PlateSideFog.ts`: the backdrop painting, its layers and the Living Paintings depth plates fade their side edges into the scene's background colour where the plane ends inside the frame. | 1600x900: all 11 FFX chapters change 0 pixels; 2560x1080 Yunalesca changes 9.2 percent of the frame (the 15 percent worst case), Omnis 4.0, Macalania 3.8, Flux 2.5, Braska 2.2, Isaaru 0.04, five chapters 0. FFX-2 held at strength 0 (no scene pixel above the HUD changes). `b11-*` frames. Test `r391-plate-side-fog`. |
| **N1** | both | See the next section. | |

## Disclosed, not changed

- **Bahamut's reveal (FFX-2 Chapter IV) lets Yuna out of the frame for about 2 s**: smallest share 0.44 on live, 0.45 here, left edge about -120 px. The
  rig keeps the girls; the 0.12 push then takes Yuna out (the camera says it fits at push 0, and allows a push of only 0.008). B5 does not engage there (only a girl
  cut by the played rig changes the reveal). A fix would shrink that push to almost nothing, which is Bailey's call (drama of the push against Yuna in frame).
- B5: at Vegnagun the boss (its tail) is only 0.75 in frame even at the master; the first version of B5 treated that as a cut and changed the reveal. It is
  now girls only (checked: Vegnagun is the live rig again).
- The pause-screen B10 changes the vignette edge of the plate by under 1.5 luma levels at 3840x2160 (the extension shows through the plate's soft edge).
- `src/scenes/openingMark.ts` shows as modified in the worktree with no content change (a line-ending refresh); it is not in any commit.

## N1, the hidden mark key (both games)

**What it is.** Press the backtick (`Backquote`, bound to nothing in either game, the pause screen or the title; checked against `Input.ts` and every raw
`keydown` in `src/`) in a battle. It shows **nothing** on screen (no code, no toast, not one node added or changed: the node count, the text length and the
canvas count are identical before and after the press). It saves the record to `localStorage` (`pyrefly-reprise:mark:v1`, the last five), copies the short
code (`PM1.` and base64url, about 1.9 kB for 105 inputs) to the clipboard inside the key handler (a key press is a user gesture; a refused copy is skipped
silently) and writes one console line (`[pyrefly:mark]`, with the same code). The record: chapter, game, the engine's seed, the build (short sha and bundle),
the window and pixel ratio, whether the opening ran hurried, the party, the profile as the battle began (settings off their defaults, coaching seen), every key,
click, wheel turn and pad button since the battle began with its time and the engine's event count (and `m: 1` when a command menu was waiting), and the mark
itself (time, event count, an exact hash of the engine log, a hash of the fight without its clock, the presenter's phase). Files: `src/app/markMoment.ts` (the
record, the code, the hashes, the storage; no DOM), `src/app/markRecorder.ts` (the listeners), `BattleScreen.ts` (3 hunks), `src/debug/api.ts` (`__pyrefly.build()`),
`vite.config.ts` (`__PYREFLY_BUILD_SHA__`).

**The tool.** `node tools/replay-mark.mjs <code | record.json | localStorage export | ->  [--url= --size=WxH --reduce-motion --out= --compare= --json= --log= --trace=]`
walks to the battle by real keys in headless Chromium, sends every recorded input at its time and no earlier than the engine event count (and the menu) it was
made at, waits for the presenter to reach the recorded phase, saves a frame, and reports `logMatch` (the engine log equals the record's exact hash),
`sequenceMatch` (the same fight, clock left out), the clock drift, the late inputs, whether the party, seed and build match. Bailey can paste the code into
chat; the tool reads the code, the record, or an export of `localStorage`.

**Proof, by real keys (1600x900, REDUCE MOTION, GPU Chromium).** `docs/screenshots/r391-smaller/n1-mark-and-replay.jpg`.

| | Chapter I (FFX, Seymour Flux, 61 events, 105 inputs, marked at 51.5 s at Tidus's menu) | Chapter IV (FFX-2, Bahamut, 114 events, 43 inputs, marked at 28.8 s) |
|---|---|---|
| Mark key | nothing on screen (DOM identical), one record stored, code copied and in the console line | the same |
| Replay at the recorded size | **log identical** (hash `290ea17c`), phase `command:tidus`, clock drift 11 ms, 0 forced inputs; 13 percent of the pixels differ from the marked frame (7.5 percent strongly) | the fight diverged (see below) |
| Replay at 2560x1080 | **log identical**, drift -1 ms | not run |
| Replay at 1280x720 | **log identical**, drift 11 ms (the menu gate held the inputs for a slower start) | diverged |
| Run to run | the same hash `290ea17c` in 5 of 5 marks and 13 of 14 replays (the one that differed, at 1280x720 on a loaded machine, pressed into a menu that was not open yet at event 51; the menu flag `m` was added for that and all 9 replays after it are identical, at the three sizes) | 3 of 7 replays at the recorded size played the same fight on a different clock, 4 diverged; 1280x720 diverged twice of twice |

**Non-determinism found, written down on purpose.**

1. **FFX (CTB) is deterministic** under its seed: the same keys give the same engine log, whatever the window.
2. **FFX-2 (ATB) is not**, because the ATB clock advances by real time (frame time): the same keys 10 to 80 ms apart give the same first actions and then a
   different order of an enemy's turn against a girl's command. Measured on Chapter IV: replays are the same fight on a different clock (only `elapsedTicks`,
   `ticksRemaining` and `remaining` differ; `sequenceMatch` true) in 3 of 7 runs at the recorded size, and diverge in the other 4 (Yuna 513 HP in the
   marked frame, 562 or 969 in diverged replays); a 1280x720 replay diverged both times it was run. A replay of an FFX-2 moment is therefore *near* the moment, not it.
   A virtual engine clock for replays (the presenter feeding fixed steps, keyed to the recorded engine time of each input) would remove it; not built (it
   touches the presenter's pacing, which this release does not).
3. **Presentation is not seeded** (sway, particles, the presenter's pacing by the wall clock): the replayed frame is the same engine state, not the same
   pixels. In the Chapter I frames a KO'd Yuna lies down in the marked frame and stands in the replays (HP 0 in both): a presentation-state difference that
   might deserve a look; the engine log is identical.
4. The pre-battle walk (title, board, prep, pre-scene) is not in the record: the tool rebuilds it from `hurried`, the chapter and the party that stood on the
   field; the prep screen's party pick is not recorded (the tool says when the replayed party differs).
5. Inputs are replayed by wall time and event count; a machine under load is late (the report counts the late inputs) but is not wrong for FFX.

Tests: `r391-mark-moment` (19: the record, the code, the hashes, the storage, the recorder, that it shows nothing, the profile at the start, the menu flag),
`r391-replay-mark-tool` (6: the arguments, the pacing, the refusals).

## Gates run (at commit 08872da3, the last code commit)

- `tsc --noEmit` clean. `node tools/orphans.mjs`: none of the new modules is orphaned (24 orphans, all older).
- Every vitest file touched passes (r391-held-cards, r39-shot-pending, r391-plate-dim, r391-disc-lift, cavern-scene, cavern-hurried-arrival, r391-pause-extension,
  r391-reveal-fit, presenter-shot-fit, r391-plate-side-fog, r391-mark-moment, r391-replay-mark-tool, battle-screen-teardown).
- The full unit suite (880 files) ran twice on a machine shared with five other agents. The first run found one real failure of mine, fixed in `08872da3`: the
  battle screen's teardown tests give it a stand-in app and scene, and the mark recorder's eager profile read and the side fog's scene walk threw on them (both
  now cannot cost a battle; two new tests). Its other failures, and all 7 of the second run (13,012 passed), were wall-clock timeouts under that load
  (audio-manifest-io, strategy-ffx2-bahamut, sin-fins-core-bench, critic-release-rules, live-url-follows-host, ui-ffx-zanmato-gauge): each passes alone, and
  the six together, in 2 to 14 s. None touches these changes. A quiet machine should show a clean `npm test`; the driver's pre-push run is the one that counts.

## Where things are

Branch `r391-smaller` on origin (the commits are listed by `git log cfab29b4..r391-smaller`; every subject names its game case). Scratch evidence (run.json
files, frames, logs, the capture scripts) is under `D:/Tools/pyrefly-scratch/2026-10-05/r391-smaller`. The dev server on port 7391 is stopped.
