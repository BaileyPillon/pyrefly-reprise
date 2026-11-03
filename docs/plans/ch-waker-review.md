# ch-waker (exp-windwaker): paper preflight (AGENTS.md rule 15)

Written 2026-10-21 by the phase-1 code lane, after the build (the brief's order was "before"; the build was a port of an approved look lab, so this is the review it would have had, plus what the build found). Section 6 is the 2026-11-02 addendum of the ch-waker lane (the merge onto r73-int; Chapter 32).
`node tools/critic-plan.mjs --paths <changed files>` classes the change **DEEP**: "chapter registry or a new chapter is a shared system" (`encounters.ts`, `chapter-meta.ts`), "unclassified product path is a shared system" (the new data files, `artNamespace.ts`), "battle presenter and lifecycle" (`BattlePresenterStage.ts`). Systems it names: battle presenter, chapter registry, effects/lighting/sprites, move advisor and enemy intent, title/chapter-select/prep/pause/results screens.

## 1. What changes, and the game case

- **FFX-2 only.** The chapter is hidden chapter 24's Valefor fight (`ffx2-valefor-besaid`, research/ffx2-fallen-aeons.md section 7.1) by reference: same build, formation, scripts, music, Sensor line, card words. No battle data of its own (rule 6). Proven by `tests/unit/chapters/exp-windwaker.test.ts` (the same event log as chapter 24 on seeds 1 and 2).
- **Shared plumbing touched, additively** (game case "both", CHK-020): the chapter registry (`encounters.ts` unions, `chapters-experiments.ts`, `chapter-meta.ts`), the board's door table (`chapterDoors.ts`), the pyrefly canon, the tactics game table, the experiment scene table, `artNamespace.ts` (a backdrop mapping), the critic route's door table (`critic/runner/lib/route-pure.mjs`), `tools/dist-filter.mjs` and `.gitignore`; three optional scene fields (`ownGrade`, `noRigs`, `ownImpacts`) read in `GoldenHour.ts`, `BattleScreenEncounter.ts`, `BattlePresenterStage.ts` and `battleSpectacle.ts`, and `strategyGuide.startFolded()` in `BattleScreenWiring.ts`.
- **New, in its own folders:** `src/engine/ww3d/` (the presentation, loaded on use through dynamic imports), `src/scenes/exp-windwaker-stage.ts`, `src/app/screens/frontend/windwakerDoor.ts`, `src/data/windwaker-ids.ts`, `chapter-exp-windwaker.ts`, `chapter-meta-exp-windwaker.ts`, and (2026-11-02) `tools/ww-models.mjs` with `tools/ww/ww-models.json`.

## 2. What could go wrong, and the net

| Risk | Net |
|---|---|
| A hidden chapter leaks into a count (the board's "of 19", the veteran check, play time, the save) | `experimental: true`, not in `CHAPTERS` / `CHAPTER_IDS`; `exp-windwaker.test.ts`, `chapter-numbers.test.ts`; attempts go to the experiments' store |
| The word `waker` overlaps another door, opens the wrong chapter, or latches a key into party prep | `chapter-doors.test.ts` (no begin/end/contain/suffix-prefix overlap over the whole table), `windwaker-door.test.ts` (real `Input`, real board, real title and prep), the neighbour-list tests updated, `phone-door-field.test.ts`, `critic-route-doors.test.ts` |
| ~~The local models or the swappable pieces ship to the public site~~ SUPERSEDED 2026-11-02: they now SHIP on purpose (addendum item 1), and a release without them silently draws capsules | `tools/dist-filter.mjs` ships `models-exp/windwaker/**` only (an allow-list); `tools/ww-models.mjs` verifies the eleven files by sha256; `dist-filter.test.ts`, `exp-windwaker.test.ts`, `ww-models-tool.test.ts` |
| A three.js upgrade moves a shader line the toon patch needs | `toon.test.ts` runs the patch against three's own `ShaderLib` chunks; on a failed patch the material draws as stock toon and logs |
| `PaintedActor`'s private parts are renamed and the skin draws nothing | `skin.test.ts` pins them on a real actor; an actor without them is left painted |
| Layering (rule 1) | `src/battle/**` and `BattlePresenter*.ts` untouched except `BattlePresenterStage.ts` (type-only imports from `ownImpacts.ts`); `ww3d` imports `three` and is imported by the scene only |
| A lit 3D scene under the game's grade: the chain does not sRGB-encode (see `figureTrue.ts`), the bloom keeps the whole colour above its threshold | Neutral palette that encodes (gamma 2.2), bloom threshold 1.0, and a ceiling of 0.995 on a lit surface in the toon material so only glows bloom. Seen on a GPU on r60 (polish 1 and 2); **unseen on r73-int** |
| Orphans (rule 4) | `node tools/orphans.mjs`: 24 modules, all pre-existing, none in `ww3d` or the new files |
| Merge with the other new chapters (29 the Spectral Keeper, 30 the Fallen Maesters, 31 yrp) | Same files edited at the same lines (listed in the handoff); the door words must not overlap (`chapter-doors.test.ts` says) |

## 3. Things the build found

- **A real bug caught by a test:** `AnimationMixer` puts the bones back as they were when its action stops, so a facing read after `stopAllAction` read the bind pose. `pose.ts` reads inside the posed window (`readAt`); the stance facing, the ground line and the clip yaw offsets are now measured on the posed skeleton. The real files give a stance twist of about -0.88 rad (50 degrees) and attack offsets of -0.30 (Yuna), -0.17 (Rikku), -1.13 (Paine).
- The real files run through the real model code in Node (`files.test.ts`, images stripped): the feet on the floor, the heights, the head turn, the weapons aimed, the strike windows (Yuna's at 2.0 to 3.1 s of her 7.3 s attack, as the lab found by eye).

## 4. What the deep review should look at (after merge)

1. The board with the word typed on a keyboard and on a phone (the long-press field); the chapter opens party prep and a fight; clears and attempts land in the experiments' store.
2. The picture at 1600x900 against TARGET-C: the mean luma (lab: hd 131.85 against 119.3; polish 2: 135.6), bloom on the flames and the shaft only, no whiteout, the shadows on the floor, the camera rigs for every beat, the HUD's calm bottom fifth.
3. Motion, in clips (Bailey judges rigs in motion): the stance, the attack round (head turn steady, no spin on a clip cut), Valefor's flap and moves, KO, victory.
4. Memory and load: the 4096 shadow map, the GLB sizes (33.9 MB on the wire, about 240 MB of decoded textures), disposal on leaving the fight (`dispose` frees the cache, the stage, the effects).
5. That nothing else changed: chapter 24 and the listed chapters play their own records and draw their own pixels; the other hidden chapters' doors still open.

## 5. Stop rule

If Bailey calls the look uncanny in motion: a written method check before a third try (rule 15). The look is the lab's approved `hd` variant; the open questions are the stage's invention (TARGET-C's chamber, not sourced) and the HUD and camera (undecided in the target).

## 6. Addendum, 2026-11-02 (the merge onto r73-int d5049f686; Chapter 32)

Written by the ch-waker lane before the deep review. The branch was cut 766 commits ago; what the merge changes about the risks above:

1. **The models ship.** Bailey asked for the chapter to be implemented (2026-11-02, after D-1157 "Build the chapter"); a live chapter on capsules is not the approved look. The 33.9 MB of eleven `.glb` files go out in the build (no hash in the name, so they revalidate; the 800 MB line no longer binds on Cloudflare). They are not in git. A release cut from a clean worktree has none: `node tools/ww-models.mjs ensure` before the build and `verify --dir <build>/models-exp/windwaker` after it (the deploy script is not changed by this lane).
2. **Upstream drift in what the chapter reads (50 of the 225 files it imports changed).** The ones that matter: `PaintedActor` was split into eleven files (the skin reads `showFigure`, `slots`, `inner` and `u` by cast; all four still exist, and `internalsOf` returns null, leaving the actor painted, if one goes); the FFX-2 HUD (10 commits: the advisor card's place may differ, so Paine's boot and sword clearance is unverified); `BattleCamera` (the pro camera is gated by chapter id and `?camera=pro`, nothing runs for this chapter); `ShotDirector` (additive fields; the `impact` beat the burst listens to is unchanged); `Renderer` (the grade's `time` uniform reads `frameSeconds()`). `fx/mix/framing.ts` (the lens shift the layout maths assumes, (0, 36) px) did NOT change.
3. **Merge conflicts:** two, both resolved by keeping the current game (BattleScreen's `rigs` line moved to `BattleScreenEncounter.ts`; battleSpectacle's two imports).
4. **Nets added:** the models list and tool, the `dist-filter` allow-list tests, the renumbered chapter and door tests (32, `waker`).
5. **Not run (no browser in this lane):** every GPU check in section 4; the A/B proof that Chapters I, IV and 24 draw the same pixels as r73-int. Both are written as job specs with predictions in `docs/handoff/ch-waker.md`.
