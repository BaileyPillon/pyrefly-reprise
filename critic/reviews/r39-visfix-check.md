# r39-visfix: independent check of the visual lane (2026-10-04)

**Subject:** branch `r39-visfix`, tip `1b8dd553` (last code commit `f2855e63`), built by another agent; this check did not build it. Nothing was changed, merged or deployed.
**Asked by:** the driver (for release 39, after Bailey's "another pass on visuals" order and critic round 21). **Class of review:** independent re-measurement of the lane's five claims, a regression hunt, the gates.
**Game case (rule 14):** PR-0334, PR-0314, PR-0364 are FFX-2 only; PR-0367 is FFX only (Chapter VIII); PR-0344 is FFX-2 (Chapter IV); the shared plumbing was checked on both games.

## 1. Method

- Headless Chromium 153 from node (Playwright 1.63) on the real GPU (RTX 5070 Ti, ANGLE D3D11, `PYREFLY_BROWSER=gpu`); never the Chrome extension or the browser pane; never more than 2 browsers at once; no production build.
- Real keys from the title (real touch taps for the phone runs). The only hook is `__pyrefly.setSeed(n)` before the first key (seeds 1 and 9). Labelled scaffolds: a **forced Change at every opportunity** (Change, ArrowRight, Enter); **200 ms of delay** on every `art/characters` request during the change; `fx.freeze` plus the HUD hidden for the Bevelle frames. The probes only read the engine (the stage figures' planes and `contentQuad` through the live camera, `fx.mix.snapshot()`, the battle log).
- Builds compared: **A** = the candidate on a dev server (127.0.0.1:7180); **B** = live release 38 on https://echoesofspira.com (main 8136f2ed); **C** = a dev server of the release 38 source (the lane's base worktree c3c4daba: the same game code as live, it differs only by the GitHub-only moved note), used where timing decides the answer (same conditions as A).
- The machine was at 94 to 100 % CPU from other agents plus the full vitest run, so single-frame times are noisy (p95 frame 16.8 ms everywhere; worst frames are reported). Raw runs, scripts and logs are parked at `F:/pyrefly-parked/2026-10-04/r39-visfix-check/` (`cap/*.mjs`, `out/*/run.json`).

## 2. Verdicts

| Item | Verdict | Numbers (A = candidate, B = live 38, C = release 38 source) |
|---|---|---|
| tsc | PASS | 2,877 files, 0 errors |
| full `npm test` (vitest 5.0.1) | PASS | 808 files passed, 5 skipped (813); 11,884 tests passed, 46 skipped, 1 todo; 1,307 s (the lane's counts exactly) |
| `node tools/orphans.mjs` | PASS | 1,228 modules, 24 orphaned: the same 24 old ones; none of the lane's new modules |
| PR-0334 white column before the twirl | PASS | see 3.1 |
| PR-0314 dressphere shot, presence and hold | PASS (modest) | see 3.2 |
| PR-0364 / PR-0347 run-in keeps the girls in frame | PASS; phone PASS with a note | see 3.3 |
| PR-0367 Evrae two heads | PASS | see 3.4 |
| PR-0344 Bevelle conduits and layer ends at 21:9 | PASS, with a disclosure | see 3.5 |
| Twirl key-texture release, two or more changes in a row | PASS | 4 changes in a row (Den of Woe, seed 9): keys played 4 of 4, **0 frames** with a plane showing no image, 0 console errors; 15 timed frames per change show the ribbons and the new outfit, nothing black or missing (`twirl-two-changes-in-a-row-r39.jpg`) |
| FFX Chapter I real-key turns | PASS | 3 turns (Tidus, Kimahri, Kimahri) on A and B: the same events (4, 4, 5), 0 console errors, the same frame times; the camera paths of A and B differ by 0.10 to 0.49 units, **the same as two runs of B differ from each other (0.03 to 0.42)**; the camera diffs are additive only (`heldPush`, `shotRig`, `rigPose`) |
| FFX-2 dressphere change on the phone (390x844) by real keys and by real taps | PASS | Leblanc: 3 changes by keys and 3 by taps on A and on B, all real, 0 errors; keys played 1 of 3 on A both ways, 1 of 3 (keys) and 0 of 3 (taps) on B (a cold phone fetch, as the lane said); the fallback column is 380 to 400 ms and soft on A, 600 ms and hard on B; Den of Woe: the push-in shot in 2 of 3 on A and on B (1.65 to 1.70 s, 1.60 to 1.62 s) |
| REDUCE MOTION change | PASS | 2 changes: no keys, no column, the held shot plays as a static cut ("under REDUCE MOTION as ever", `MaxMix.ts`), 0 errors |
| Window resize while a battle is up (PR-0344) | PASS | conduits follow: 2560x1080 -10.53 / +11.87, 1600x900 -7.90 / +8.90, 3440x1440 -10.62 / +11.96, 390x844 -7.90 / +8.90, back to 2560x1080 -10.53; 0 errors |
| Overdrive shot (moved into `shotSearch.ts`) | PASS (read, not run) | the same four tables, the same loop order, the same scoring as the old inline loops; the walk is `refine: kind === 'sc'` only |
| Console | PASS | 0 errors in every run on A; the warnings are the same classes on A and B (shader gradient note; Evrae "pose clamped" notes) plus the dev-server-only "depth plates unavailable", which C shows too |

### 3.1 PR-0334 (200 ms of art delay, 4 FFX-2 chapters x seeds 1 and 9, 3 forced changes each = 24 real changes per build)

| | keys played / late | column drawn BEFORE keys that then played | column when keys were late | keys begin |
|---|---|---|---|---|
| C (release 38 source) | 19 / 5 | **19 of 19** (median 217 to 433 ms long per seed, first drawn at 150 to 167 ms) | 5 of 5, hard, 567 to 617 ms from 200 ms | median 500 to 650 ms |
| B (live 38) | 1 / 23 (network plus delay) | 1 of 1 | 23 of 23, hard, 617 ms from 150 ms | n/a |
| **A (candidate)** | 19 / 5 | **0 of 19** | 5 of 5, soft, 367 to 417 ms from 450 to 483 ms (633 ms in the two Vegnagun repeats) | **100 to 117 ms** (median 117; a few 217 to 350) |

The `mix-twirl` class lands 100 to 117 ms after the engine's spherechange reaches the page, the frame the flourish opens, so no frame draws the column before the keys. Frames: `pr-0334-twirl-start-den-live-vs-r39.jpg` (the slab over Yuna from 233 to 580 ms on live; none on the candidate) and `pr-0334-late-keys-column-live-vs-r39.jpg` (both builds with late keys: live's hard-edged box against the candidate's soft shaft). The late rate is the same on A and C (5 of 24), so the lane's "1 of 8" was a lucky sample; the residual is in D1 below.

### 3.2 PR-0314 (the same 24 changes per build)

| | shot present | hold | refusals |
|---|---|---|---|
| A | **15 of 24** (seed 1: 7 of 12, seed 9: 8 of 12), all full shots | 1.60 to 1.75 s (median 1.63 s) | 9, each with its gate: `menu` 5, `acting` 4 |
| C | 14 of 24 | 1.60 to 1.67 s | 10, no trace |
| B | 14 of 24 | 1.22 to 1.67 s | 10, no trace |

The rules held in every shot on A: no menu up (0 of 15), no enemy action inside (0), no coach line (0). So the lane's repair is real (the wait, the early start, every refusal carries its gate) and the presence gain is +1 of 24 (62 % against 58 %): the lane called it modest. My 62 % is below the lane's 83 % quiet-machine matrix; the difference is the refusals by standing rules (21 % `menu`, 17 % `acting`), which depend on seed and load. The phone push-in is 2 of 3 in Den of Woe on A and B.

### 3.3 PR-0364 (Rikku and Paine attacks, 7 FFX-2 chapters in all; a girl "cropped" = her painted box under 99 % inside the window in any frame)

| | attacks | cropped | worst share | smallest left edge | follow (max truck.x) |
|---|---|---|---|---|---|
| 1600x900, B | 18 | **11** (8 below 90 %) | 0.014 (Yuna, Ixion seed 9) | -239 px | 1.75 |
| 1600x900, **A** | 18 | **0** | 1.000 | **+51 px** | 0.525 |
| 2000x1012, B | 10 | 4 | 0.645 (Yuna, Den) | -106 px | 1.40 |
| 2000x1012, **A** | 10 | 1 (**one frame, 6 px**, Yuna 0.986, Den seed 1) | 0.986 | -6 px | 0.875 |
| 390x844 touch, B | 8 | **8** (all below 90 %) | 0.004 (Yuna, Vegnagun) | -75 px | 1.23 |
| 390x844 touch, **A** | 8 | 3 (Yuna 0.77 to 0.83, 7 to 28 frames) | 0.774 | -26 px | **0** |

The truck no longer crops anyone. The phone residual (D2) is not the truck: it is Yuna at the left edge of the slice with the truck at 0, and it is on live too (Vegnagun seed 9: her rest share is 0.81 on B and 0.777 on A). Frame: `pr-0364-runin-ixion-1600-live-vs-r39.jpg` (Paine's run-in in Ixion: Yuna out of the frame on live, whole on the candidate). The cost the lane disclosed holds: the follow is about 30 % of release 38's at 1600x900 and none in Ixion or on the phone (B4).

### 3.4 PR-0367 (Chapter VIII, 170 s of real-key fight each, seeds 1 and 9)

| | Evrae pose events | frames with both Evrae planes drawn |
|---|---|---|
| B (live) | 60 (seed 1), 66 (seed 9) | **410 and 451** (6 to 7 frames per hit, 14 per return in some) |
| **A** | 60, 66 | **0 and 0**, every event |

Frame: `pr-0367-evrae-hurt-live-vs-r39.jpg` (two half-strength heads on live, one on the candidate). The party keeps its crossfade on A (6 frames per pose change, as on B).

Of the 48 Evrae hurt cuts, **5 were at the near range** (the head-throw painting, where the two-heads defect shows: 4 in seed 1, 1 in seed 9) and **43 at the far range**, where "hurt" is the same far picture within about 4 px (a crossfade there drew no second head to see; live's plane-opacity count still reads 6 to 7 frames, the candidate's 0).

**The other Evrae cuts** (the question for attack and breath charge): at a cut the body does not jump. The pixel scale ratio is 1.000 at every Evrae pose change; the bottom edge moves -1 to +3 px (median); near-range hurt: the plane is 11.5 % taller (4.19 to 4.67 world units, the hurt painting is a 90 px taller canvas at the same pixel scale) and the box top rises 39 px (the head thrown back), the box centre moves +6 to +8 px (median); **breath charge (`cast`): the box does not change at all** (centre 0, size 0, 12 events). The two jumps that show are the painted head moving, with the same numbers on live (where a crossfade smeared them): **attack start: the head's box moves left 54 to 57 px and widens 39 to 45 px in one frame** (3 events), and a near-range hurt box swing of up to 94 px on its first frame (the same maximum on live: the hit's recoil, not the cut). No pop in size or position; the attack's instant 55 px head move is the one cut a reviewer may call abrupt (D5).

### 3.5 PR-0344

Chapter IV (`ffx2-bahamut`) at 2560x1080, frames `pr-0344-bevelle-2560x1080-live-vs-r39.jpg`: on live the two conduits stand in the picture as dark slabs with straight tilted sides and a lantern strip, and the plate layers end in vertical brightness steps; on the candidate both are gone (the conduits are cut by the frame edge, the layer ends are feathered). Numbers: the pipes' x are **x 1.3333 at 2560x1080** (-7.90 to -10.53, +8.90 to +11.87), 1.344 at 3440x1440, **unchanged at 1600x900, 1024x768 and 390x844**. Chapter XIII (`ffx2-trema`) shows no conduit meshes at its first menu in this run (one layer, no pillars) and no seam on either build.

## 4. Defects and disclosures

| Id | Severity | What | introducedByCandidate | regressionVsLive |
|---|---|---|---|---|
| D1 | minor | **PR-0334 is softened, not closed, when the keys are late.** On a cold link the keys miss `LATE_MS` and the flourish's column plays: 5 of 24 desktop changes and **7 of 9 phone changes** at 200 ms of delay (soft shaft, 380 to 420 ms; live: hard box, 600 ms, 8 of 9). The slab before keys that play is gone (19 of 19 to 0 of 19). | no (the late path is release 38's; the candidate softens and shortens it) | no |
| D2 | minor | Phone run-ins: Yuna's left edge is 23 to 26 px outside the slice in 3 of 8 attacks (Vegnagun both seeds, Bahamut seed 1), with the truck at 0; present at rest on live | no | no (live: 8 of 8 cropped to 0.4 %) |
| D3 | major (carried) | PR-0314 stays open: the shot is refused in 9 of 24 changes by standing rules (`menu` 5, `acting` 4) and present in 15 of 24 (62 %). Every refusal now names its gate. | no | no (14 of 24 on B and C) |
| D4 | minor | The Bevelle layer feather also changes the **1600x900 look**: the vertical layer-end step at about 7 % from the left edge on live is gone (`pr-0344-bevelle-1600x900-layer-feather-live-vs-r39.jpg`). An improvement, but the handoff says "nothing moves at 16:9", which is true of geometry only; disclose it as a look change. | yes (visible, intended) | no (improvement) |
| D5 | minor | Evrae's attack start is an instant head move (54 to 57 px) now that it cuts | yes (by design) | no (live: a ghosted crossfade) |
| D6 | minor | The run-in's follow is about 30 % of release 38's at 1600x900 (max truck 0.525 against 1.75) and none in Ixion or on the phone: less camera travel with the runner | yes (disclosed as B4) | arguable |
| D7 | minor | One 830 ms frame in 1 of 24 candidate changes (Vegnagun, seed 1, change 3). Not reproduced in two repeat runs (6 changes: worst 167 ms), absent in 48 changes on B and C (worst 183 ms). `twirl.stats.ghost` also reached 1.0 in 2 of 29 changes; it is read before the pin, and 15 timed frames of one of them show no double figure. | unproven | no |
| D8 | major (pre-existing, owned by r39-posescale) | **Size changes at pose changes (Bailey's report), numbers from real-key fights (Chapters I and VIII) on A; Chapter I's repeat on B is the same, and the lane touched neither art nor scale factors.** Engine pixel-scale factor per pose against idle (`unitsPerPixel`): Tidus ready 1.30, follow 1.40, critical 0.95; Wakka ready 1.449, follow 1.40; Rikku ready 1.05, follow 1.10, critical 0.80; Lulu ready 1.20, critical 0.72; Yuna ready 1.20, ko 0.52; Kimahri ready 1.20, follow 1.35; Auron ready 1.20; Flux, Evrae 1.00. On-screen painted-box height at a pose change (median, n = events): **Tidus idle to ready x0.88 (12)**, ready to cast/item x1.13 to 1.14, follow to idle x1.18; **Wakka idle to ready x1.117 (13), ready to item x0.815**, hurt to idle x1.123; Lulu critical to idle x1.36, idle to ready x1.10; Rikku critical to ready x1.30, follow to idle x1.12; Seymour Flux idle to telegraph x0.87, telegraph to attack x1.14; Mortiorchis idle to cast x0.88. Evrae: none (see 3.4). Not fixed here. | no | no |

No critical defect, and no defect introduced by the candidate above minor.

## 5. Where this check differs from the lane's numbers

PR-0314 62 % here against the lane's 83 % (a loaded machine, other seeds, 24 changes against 23); the late-keys rate 5 of 24 against "1 of 8"; the phone run-ins 3 of 8 cropped (small, not the truck) against "0 of 4"; the Evrae both-planes frames 6 to 7 per hit here against 14 to 21 (the lane counted over screenshot-slowed frames). The direction and the claimed fixes agree in every case.

## 6. "Left for Bailey", B1 to B11: one line each (recommendations only; nothing built)

| Id | What | Remedy I would recommend |
|---|---|---|
| B1 | The shot is refused while the next girl's menu is already up (D-357); 5 of 24 here. | Keep D-357 (it was a pick); if presence matters, hold the next girl's menu until the 1.6 s shot ends instead of loosening the rule. |
| B2 | Guide and advisor cards over the girl during the shot. | Yes: hide them as the intent and Sensor cards already are; show Bailey a frame first (no coach line appeared in 15 shots here). |
| B3 | An enemy cast already in flight refuses the shot (4 of 24). | Extend the `acting` wait first (0.6 s to about 1.0 s), measure; ask Bailey about Active timing only if presence stays under about 80 %. |
| B4 | Run-in: keep the full follow and release the truck at the first hit's cut. | Ship the safe shorter follow now; do B4 later if Bailey misses the travel (the follow is 30 % of release 38's, none in Ixion or on the phone). |
| B5 | Chain-seam reveal hides Yuna about 2 s; the opening is 6 s (PR-0301, PR-0347). | Ask the three questions in `r34fix-seams.md`; keep D-138's opening and widen the reveal push so Yuna stays in frame rather than shortening it (not re-measured here). |
| B6 | Bahamut's neck gap (white lamp bank through the silhouette) and the rim. | Leave the head; dim the lamp bank behind him locally first, with a frame, before moving his slot (0.014 of headroom); not re-measured here. |
| B7 | Ch I headroom over Flux's attack key (10 to 14 px). | Not needed now; revisit if the camera or the attack key changes (not re-measured here). |
| B8 | Ch IX sakura arrival tail past the first menu. | Yes: end it by about 3.6 s (the timings are ours); keep the hurried path as it is (not re-measured here). |
| B9 | Ch XII hidden Mortiphasm discs. | A (move the two lower discs) with a mockup first, as the lane said (not re-measured here). |
| B10 | 4K pause painting is 3369x1925, not the window. | A blurred extension behind the sharp plate (no art cost); use a 4K master only if release 39's hires tier already has one (not re-measured here). |
| B11 | 21:9 side bands on the FFX plates. | Fog on the edge first (cheap); painted wings only on Bailey's yes, they cost GPU time (not re-measured here; the FFX-2 Bevelle plate is fixed, 3.5). |

## 7. Frames (`docs/screenshots/r39-visfix-check/`, JPEG)

`pr-0334-twirl-start-den-live-vs-r39.jpg`, `pr-0334-late-keys-column-live-vs-r39.jpg`, `pr-0314-dressphere-shot-twirl-r39.jpg`, `pr-0364-runin-ixion-1600-live-vs-r39.jpg`, `pr-0367-evrae-hurt-live-vs-r39.jpg`, `pr-0344-bevelle-2560x1080-live-vs-r39.jpg`, `pr-0344-bevelle-1600x900-layer-feather-live-vs-r39.jpg`, `twirl-two-changes-in-a-row-r39.jpg`.

## 8. Verdict

All five claimed fixes reproduce independently and nothing regresses against live release 38 in what was measured; the candidate is fit for the focused review of the production candidate. The open items are D1 (the late-keys column, worst on the phone), D3 (PR-0314's refusals, now visible) and D8 (pose size, another lane).
