# r39-visfix: the visual, animation and camera defects of critic round 21 (live release 38)

**Branch:** `r39-visfix` (from `origin/main` c3c4daba, release 38 plus the round 21 records), pushed, **not merged, not deployed, not reviewed**.
Code and tests: `98093890`, `6c8d41e5`, `9ff5760f`, `d9b12780`, `764ecca9`, `c5dc5fac`, `76e6575b`, `f2855e63`; this note, the preflight and the stills are the commit after them.
Built by a Sonnet sub-agent of the driver session in the worktree `D:/pyrefly-r39-visfix` (junctions `node_modules` and `public/art`, read only).
**Asked by Bailey** (2026-10-04): "I need another pass on visuals and maxing out eye candy with special emphasis on character models, enemy models,
animations, visual fidelity, and camera perspective in relation to characters, enemies, and the battlefield as a whole. The critic needs to be involved as
well and I need updated scores. I need super high resolution now. DO NOT hold back. I want the visual fidelity to be amazing and absolutely beautiful. The
critic will ensure this is the case." This lane is the defect half of that: the visual, animation and camera defects of deep round 21 that hold the five
visual sub-scores down (characters 8.2, enemies 7.8, animation 7.4, fidelity 8.2, camera 7.9). New looks and the eye-candy additions are other lanes'; anything
here that would change an approved look or add one is listed for Bailey (section 4), not built.
**Game case (rule 14), per item:** PR-0334, PR-0314, PR-0364 / PR-0347's run-in half, PR-0344: **FFX-2 only** (only FFX-2 has a spherechange, the DRESSPHERE SHOT,
the run-in and the A-1 framing rule; Chapters IV and XIII stand on the Bevelle plate). PR-0367: **FFX only** (Chapter VIII's Evrae; the mechanism is shared
plumbing and names one art id). Every commit says its case.
**critic-plan class** (`node tools/critic-plan.mjs --paths <the 24 shipped files>`): **DEEP**, because `BattlePresenterStage.ts` is the shared presenter's stage; a
FOCUSED review of the production candidate before a deploy, live verification, then the DEEP review on the live build (this build owes both). Checks CHK-002, 003,
006 to 011, 013 to 017, 020 to 023. Not the save-data class. Paper preflight: [docs/plans/r39-visfix-review.md](../plans/r39-visfix-review.md). PR-0314 had stalled over
three reviews, so its method check is written first: [docs/plans/pr-0314-dressphere-shot-method-check.md](../plans/pr-0314-dressphere-shot-method-check.md) (rule 15).

Everything below was measured in headless Chromium with real GPU (`PYREFLY_BROWSER=gpu`) from node (never Claude-in-Chrome or the browser pane), against the dev
server of this branch (port 7170) and, for every "before", a dev server of the release 38 code in a disposable worktree (`D:/pyrefly-r39-vf-base`, port 7171), on one
machine, with real keys from the title and seed 1. Scripts, raw runs, logs: `D:/Tools/pyrefly-scratch/2026-10-04/r39-visfix/` (`cap/*.mjs`, `tools/*.py`, `evidence/gaps/`,
`logs/`, `PROGRESS.md`). Stills in the repo: `docs/screenshots/r39-visfix/`. Nothing here is a hook that changes the game: the probes read it, and the two
scaffolds are labelled where they appear (a forced Change at every opportunity, 200 ms of art delay per request in the proofs that name it).

## 1. What changed, in one table

| Item | Ticket | Game | Cause | Fix | Proof (before -> after) |
|---|---|---|---|---|---|
| White hard-edged rectangle at the twirl start | PR-0334 | FFX-2 | the CSS light column opened on the change's first frame but the painted keys that replace it showed only after they and the new outfit had loaded (0.4 to 0.6 s on a network): a white slab over the girl | the document wears `mix-twirl` synchronously when a change has keys, so the column is hidden from frame 1; it is given back, replayed over what is left, only when the keys are late; the fallback column's mask is a bell; the idle sidecars the change reads are fetched with the keys | column drawn before the twirl: **8 of 8 changes (133 to 617 ms) -> 1 of 8** (the late-keys fallback, soft) |
| Dressphere close-up absent | PR-0314 | FFX-2 | the shot was decided on ONE frame (the frame the new outfit's paintings landed, 0.45 to 0.77 s after the change began on a network), so any closed gate on it was final, and three of five refusals left no trace | a change waits up to 0.6 s for a clean moment, starts at its first frame, searches past the grid, records the gate that ended it; the twirl starts before the outfit has loaded; no rule loosened | shot present **5 of 8 -> 6 of 8**, the two misses are rules (acting, menu); hold 1.30 to 1.45 s -> 1.47 to 1.68 s; 83 % in the quiet matrix both ways, **72 % -> 83 % at 8x CPU**; every miss carries its gate |
| Run-in cuts a girl off | PR-0364, PR-0347 | FFX-2 | the truck followed half of every run whatever it did to the girls on her side, and it stays on through the first hit's cut to the foe's rig | `fitTruck` judges each girl on the shot she runs on, with the held dolly and the window's slice, and on each rig the first hit may cut to; margin 3 % | 1600x900, 7 chapters: **girl cropped in 10 of 14 runs (Ixion's Yuna 13 % in frame) -> 0 of 21** (smallest left edge 49 px); phone: 4 of 4 -> 0 of 4 |
| Evrae shows two heads | PR-0367 | FFX | its hurt and attack move only the head, so the 140 ms crossfade drew two heads at half strength (planes 0.49 + 0.51) | Evrae cuts between its poses (`SceneStaging.poseCutArt`) | frames with both planes visible **14 to 21 per hit, 3 of 3 hits -> 0** |
| Tilted "wing" seam at 21:9 | PR-0344 | FFX-2 | not the painted wings: two foreground conduits (3D pipes) stood a third into the frame as dark slabs at 21:9, and the plate's parallax layers ended on a vertical line, stepping the brightness | the pipes' x is scaled by aspect over 16:9, and a layer may feather its sides (`featherSide`, Bevelle's two layers only) | frames at 2560x1080 before/after; nothing moves at 16:9 or narrower |

Measured and **not** changed (section 3 says why and what the options are): PR-0316 (Bahamut's head and rim), PR-0317 (Seymour Flux's crown), PR-0342 (the blue tree),
PR-0365 (the hidden Mortiphasm disc), PR-0301 and PR-0347's seam half (the chain-seam opening), PR-0293, PR-0332, PR-0320.

## 2. Item by item

### 2.1 PR-0334, the white rectangle at the twirl start (FFX-2 only)

**Reproduced first.** With 200 to 300 ms of art delay per request (what a network is), a change's keys and the new outfit land 0.4 to 0.6 s after the Change press, and for
all of that time the flourish's CSS column (`.ffx2sf__column`, white, 800 ms) stands over the girl: round 21's "hard-edged white rectangle for 150 to 450 ms in 7 of 7 changes".
**Cause:** `TwirlSlot` hid the column only once its play began, i.e. after the keys and the outfit had loaded (`twirl.ts` `load`). **Fix** (`98093890`, `twirlColumn.ts`):
`TwirlSlot.start` sets `html.mix-twirl` synchronously, the same frame as the change, when the manifest lists keys for it (3 s guard); `giveBackColumn` removes the class and
replays each of the girl's columns from where the flourish has got to (`--sf-ms`), only when the keys are late or none is real; the fallback column's mask is a nine-stop bell and
its edge blur 1.4 px, so the fallback is a light shaft, not a slab. The idle sidecars a change reads are fetched with the keys (`prewarmFrom`, `prewarmGrid`), which also stops a first change
from missing `LATE_MS` for want of a sidecar. Tests: `tests/unit/r39-twirl-column.test.ts` (8).
**Proof** (`D:/.../evidence/gaps/p2-*`, 1600x900, seed 1, a Change forced at every opportunity, 200 ms of art delay, four chapters, 8 real changes each pass; column "drawn" = computed opacity
above 0.05 and a non-empty rect):

| | column drawn before the twirl | first drawn | twirl keys begin |
|---|---|---|---|
| release 38 | **8 of 8** changes, 133 to 617 ms (183, 250, 283, 333, 333, 383, 617, 133) | 147 to 194 ms after the press | 396 to 627 ms |
| r39-visfix | **1 of 8** (Vegnagun's first change: the keys missed the 300 ms `LATE_MS`, the soft fallback plays from 600 ms, 300 ms) | none in the other 7 | 106 to 147 ms |

Frames: `pr-0334-twirl-start-leblanc-rikku-before-after.jpg`, `pr-0334-twirl-start-den-rikku-before-after.jpg` (top row release 38: the slab at 169 to 418 ms; bottom row: the ribbons already
at 234 ms). Not touched: the keys' own painting, the flourish's motes, ring and name plate.
**The phone** (390x844 touch, Leblanc and Den of Woe, two changes each, 200 ms of art delay, `ph-*`): release 38 draws the white column from 162 to 190 ms for 583 to 617 ms in **4 of 4** changes; r39-visfix draws none in the first
435 ms in any of them, and in 3 of 4 the keys are late on a cold phone fetch (the phone does not prewarm at battle start, `eager` off) so the soft fallback column is replayed from 502 to 602 ms for 350 to 417 ms, close to when the new outfit
lands; in the fourth the keys played. A real player's dwell in the Change submenu (`prewarmGrid`) fetches the new outfit's keys first; the probe presses Enter 0.8 s after opening it.

### 2.2 PR-0314, the dressphere close-up (FFX-2 only; the third attempt, after a written method check)

PR-0314 was open in rounds 19b, 20 and 21 ("absent in 5 of 10 changes", then "6 of 7", and the D-346 push-in "never seen"). The method check
([the plan](../plans/pr-0314-dressphere-shot-method-check.md)) found why neither earlier fix moved the number: nobody could see which gate refused a change, the decision was one frame, and
that frame was late. **What the gate trace showed** (a per-frame trace of every staged figure beside the mix's decision, release 38, Leblanc, Vegnagun, Fallen Aeons, Den of Woe): **14 of 17
changes had a shot, 3 had none**: an enemy cast genuinely in flight (the rule works), no framing passing (Paine, a nearer taller neighbour), and Yuna 16 % in view at the frame's edge.
The critic's own 1 of 7 (a loaded host, four live-site lanes, a screencast) is not reproducible here, even with 6x CPU throttle and 300 ms of art delay, so the gates, not the machine, are what can be repaired.
**Fix** (`764ecca9`, `c5dc5fac`; `shotPending.ts`, `shotSearch.ts`, `followFlourish.ts`, `twirlPlan.ts`, `heldShots.ts`, `twirl.ts`): a change **waits up to 0.6 s** for a clean moment (menu, readiness, anyone acting, framing; at most
three searches 0.12 s apart); it **starts at the change's first frame** (the twirl slot's `takeBegun`, with the subject change as the fallback under REDUCE MOTION); **every outcome is
recorded with its gate** (`fx.mix.snapshot().shots.decisions`: off, menu, not-ready, acting, placeholder, no-frame, expired); the framing search **walks from the grid's best point** when the grid finds
no passing frame (`searchShot`, `WALK_ROUNDS` 24); the shot is **not handed back for quiet while the twirl is loading or playing**; the twirl **starts as soon as its keys are here** instead of after
every pose of the new outfit has loaded (each key carries a size for the idle standing now and one for the new idle; the last key holds, at most 4 s, until the outfit is in), and a play another
change takes over frees its textures. **The rules are as they were:** never over a menu, never while anyone else acts, the strict framing, the placeholder rule.
Tests: `r39-shot-pending` (14), `r39-shot-search` (5), `r39-twirl-early` (8), `fx-mix-shot-hold` updated for the wait.
**Proof, the ask ("at least 7 changes across 4 chapters"):** `p2-*`, Leblanc, Den of Woe, Fallen Aeons, Vegnagun, 8 real changes each pass, same seed, same 200 ms of art delay:

| Chapter | Girl | release 38 | r39-visfix |
|---|---|---|---|
| Leblanc | Yuna | none (an enemy action in flight) | none: gate `acting` (Fem-Goon's cast began before the change; the rule) |
| Leblanc | Rikku | full, 1.38 s | full, 1.47 s |
| Den of Woe | Yuna | full, 1.30 s | full, 1.68 s |
| Den of Woe | Paine (before), Rikku (after) | Paine: none (the push-in refused it) | Rikku: full, 1.53 s (the forced-change sequence put a different girl second) |
| Fallen Aeons | Yuna | full, 1.37 s | full, 1.65 s |
| Fallen Aeons | Paine | push-in, 1.45 s | **full, 1.57 s** (the walked frame) |
| Vegnagun | Yuna | full, 1.32 s | full, 1.67 s (keys late: the legacy flourish under the shot) |
| Vegnagun | Paine | none | none: gate `menu` (the next girl's menu was already up; D-357) |

Shot present **5 of 8 -> 6 of 8**; the two misses carry their gate and both are standing rules. In every shot: no menu up (`menuDuringShot` false), no enemy action inside it
(`enemyInside` 0), the first-time coach line hidden (`coachShown` 0, which is also PR-0320's check). The broader matrices (`m3`, 5 changes a chapter, four chapters, 200 ms delay, 23 changes each pass): **83 % both
ways when the machine is quiet**, misses `acting` 1, `menu` 2, `no-frame` 1; **at 8x CPU throttle (`m4`, 18 changes) 72 % -> 83 %**. The measured effect on this machine is therefore modest
by design: the repair is that the shot starts with the change, survives a busy frame, cannot be lost silently, and that the next batch can read each refusal. Frames:
`pr-0314-shot-*.jpg` (four chapters, 18 frames each over 1.8 s).
**More evidence, a fifth chapter and the phone:** Trema (Chapter XIII) at 2000x1012, three changes (Yuna, Paine, Rikku): the full shot in 3 of 3, 1.63 to 1.67 s, Paine's by the walked frame, no coach line, no menu, no column
(`pr0320-trema-2000`). The upright phone, 390x844, Leblanc and Den, two changes each (`ph-*`): the push-in plays in **2 of 4** (1.75 and 1.83 s) against **1 of 4** on release 38 (1.67 s); the other two are `acting` and `no-frame`.
Left for Bailey: the three remaining refusals (section 4, B1 to B3).

### 2.3 PR-0364 and PR-0347 (the run-in half), the run-in cuts a girl off (FFX-2 only)

**Reproduced first.** A per-frame probe projects every party figure's painted box through the LIVE camera during each short-range Attack and reports the least share of any girl inside the frame.
Release 38, 1600x900, seven FFX-2 chapters, two attacks each: **10 of 14 runs crop a girl**: Ixion's Yuna **13 %** in frame (left edge -233 px, truck 1.75), Den of Woe 67 %, Leblanc 36 to 81 %
(round 21: "Yuna cut off at the left edge for about 1 s"), Fallen Aeons 93 %, Bahamut 95 %; at 390x844 (touch) **4 of 4** (Ch IV 25 and 54 %, Vegnagun 39 and 62 %).
**Two causes.** (1) The truck followed half of every run whatever it did to the girls on her side (`6c8d41e5`: `fitTruck` cuts the follow back in steps until no girl in `keep` is more cropped at the
left, right or bottom than at rest, and none at all when even the smallest follow would; the rectangles the planner reads include the dolly the action shot holds (`BattleCamera.restCamera(true)`,
`pushTarget`), and the planner's frame is the part of the canvas the window shows (the phone's slice, `StageMotionPort.view`)). (2) After that, Yuna was still 3 to 12 px out at the blow in Chapters IV and XIII:
the first hit cuts to **another rig** with the truck still on, and the planner had judged only the shot she runs on (`76e6575b`). Which rig the cut lands on is the A-1 rule's pick (`ShotFit.ffx2Shot`), made at the
blow with the boss in whatever pose it is in; the same attack was measured landing on `action~calm` in one run and on `idle` in the next. So the fix does not guess one rig: `CutRig.cutRigsOf` names each rig the rule
could pick (those that keep the girls who are not running on screen at rest, and the master it falls back to), under the comfort preset's own name for it (`PresetCamera.shotRig`: `action~calm`),
and `fitTruck` judges the girls on each, through `StageMotion.rect`'s new `rig` argument (the held dolly kept). The margin is 3 % of the frame, because the idle sway (about 30 px at 1600 wide, measured:
Chapter IV, Yuna's left edge, the rest rig 332 px and the sway 297 to 332) is not in the rest rig the planner reads. Tests: `r39-run-in-truck-keep` (8), `r39-run-in-cuts` (16, including the preset's rig and the pure `cutRigsOf`).
**Proof** (`ri2-*` the first pass and the release 38 base, `ri5-*` the final code; smallest share of any girl in frame, then the smallest left edge of any girl in px):

| 1600x900, seven chapters | runs | a girl cropped | worst share | smallest left edge |
|---|---|---|---|---|
| release 38 | 14 | **10** | 0.130 (Ixion) | -233 px |
| first pass (`6c8d41e5`) | 14 | 3 (Bahamut, Trema at the blow) | 0.956 | -12 px |
| **final (`76e6575b`), 3 attacks a chapter** | 21 | **0** | 1.000 | **49 px** |

| Other frames | release 38 | final |
|---|---|---|
| 2560x1080 (Bahamut, Den) | 0 of 4 cropped, 118 px | 0 of 3, 261 px |
| 390x844 touch (Bahamut, Vegnagun) | **4 of 4** cropped, worst 0.247 | **0 of 4**, truck 0 |
| 1024x768, 4:3 (Leblanc, Bahamut, Den; two attacks each, `ri7-*`) | **5 of 6** cropped: Leblanc's Yuna **0 %** in frame (-168 px, both attacks), Den 8 %, Bahamut 67 and 80 % | **0 of 6 by the truck**: Leblanc and Bahamut whole (24 to 134 px); Den's two read 0.90 and 0.96 with the truck already 0, which is the A-1 rule's own 90 % floor on the cut rig, not the run-in |
| 2000x1012 (Leblanc, Bahamut, Trema, Fallen Aeons, Den; two attacks each, `ri6-*`) | **1 of 9** cropped (Leblanc's Yuna 0.854, -31 px; others as near as 10 px), smallest 10 px | **0 of 10**, smallest left edge 63 px |

Frames: `pr-0364-runin-leblanc-before-after.jpg`, `pr-0364-runin-ixion-before-after.jpg`, `pr-0364-runin-bahamut-390-before-after.jpg`. **The cost:** the follow is shorter where the cut rig leaves little room
(of the release 38 follow: Bahamut 0.5 of 0.875 at 1600x900 and 0.84 at 2000x1012, Trema 0.5 or none, Fallen Aeons and Den of Woe's Paine runs 0.1 to 0.4, Ixion none, Vegnagun 1.05 to 1.19 of 2.6 to 3.0, Leblanc about as before), and the stop is scored under the truck it runs with, so
the runner stays in frame and her stop can be a little farther. If Bailey would rather keep the full follow and let the truck go at the first hit's cut instead (the cut is a hard cut, the truck is not part
of the picked shot), that is the other way to fix it: a small port method called after `moments.impact` (section 4, B4).
**Not done here:** PR-0347's other half, the Den of Woe / Fallen Aeons *chain seam* reveal (Yuna out of frame 2.6 s into the boss reveal: `v` 0 at 2.6 s in Den and Aeons, 1 in Leblanc and Vegnagun). That is the boss rig itself
and the approved opening (D-138): section 4, B5.

### 2.4 PR-0367, Evrae's two heads (FFX only)

Evrae's hurt is its idle with the head and neck thrown back 22 degrees and its attack puts the head aside; the body is the same pixels in all three, so the 140 ms crossfade drew only the head twice, each at about
half strength (a plane probe: idle 0.493 + hurt 0.507 at the worst frame, 14 to 21 frames per hit, **3 of 3 hits** at 1600x900). **Fix** (`9ff5760f`, `PoseCut.ts`): `SceneStaging.poseCutArt` names art ids that cut
between poses (where FF7's `poseCut` cuts the whole scene); the Evrae deck names `evrae` and nobody else, so the party keeps its crossfade. After: 0 frames with both planes visible in 3 of 3 hits. Test `r39-pose-cut` (4). Frames:
`pr-0367-evrae-hurt-before-after.jpg`.

### 2.5 PR-0344, the "tilted wing seam" at 21:9 (FFX-2 only in use: Chapters IV and XIII)

At 2560x1080 the seam the critic read as the painted wings meeting the plate was two other things: the foreground conduits (3D pipes with a strip of lamps, placed so the 16:9 frame cuts them) stood a third of the way into the
frame as dark slabs with straight, tilted sides, and the plate's parallax layers stopped on a vertical line there, stepping the brightness. Hiding the pipes made the join disappear; the wings were innocent. **Fix** (`d9b12780`,
`frameBracket.ts`, `Backdrop.sideFeatherStops`): the pipes' x is scaled by aspect over 16:9 (nothing moves at 16:9 or narrower), so they are cut by the edge at every width, and a layer may name `featherSide` (a smoothstep over 6 % of
its width, set on Bevelle's two layers only). The painted wings and the approved plate are untouched. Test `r39-plate-seam` (6). Frames: `pr-0344-bevelle-2560x1080-before-after.jpg` (before left, after right; top the left edge, bottom the right).

## 3. Measured, not changed

**PR-0316, Bahamut's head washed out by the lamp's bloom (Ch IV), and the cyan rim on the cut-outs.** With the HUD hidden at 1600x900, 2000x1012 and 2560x1440, live art and the trapped-white candidates
(the other lane's `public-after`, served from a second dev server): the head reads at the sizes looked at (pink eye, jaw, crest; 3x crop at 1600x900 `pr-0316-bahamut-head-1600-before-after.jpg`, and the 2000x1012 and 2560x1440 frames show the same). What reads as "washed" is **a white blob in the S-curve of the neck, under the jaw**:
the plate's own lamp bank (white-hot, behind the boss at neck height, x 0.49 to 0.58 of the frame at 1600x900) seen through the gap in the silhouette, with the bloom filling the gap and stopping at the figure's edge (probe `pr-0316-bahamut-neck-gap-probe-1600.jpg`: as is, bloom off, boss hidden, both).
At 1600x900, 842 (live art) and 1,090 (trapped-white art) of the 4,800 pixels of the neck gap are at 245 or above, and the trapped-white cleanup does not remove it (it is background, not trapped white; it is slightly larger after, because the cleanup opens more of the silhouette). The bloom on this stage runs at strength 0.88, threshold
0.45, radius 0.55 at the first menu (the stage's palette says 0.66, 0.88, 0.62: something in the look stack raises it; not this lane's). The rim is a 1.5 px hairline (`RIM_MAX_PX`) on every alpha edge toward the light, so on the torn wing
edges it draws a thin cyan outline; after the cleanup the pale grey-lilac shards inside the wings and the chest are still there (the check's note 4: the cleanup is partial). **No safe fix without changing the look**, so it is listed (B6).

**PR-0317, Seymour Flux's crown clipped by the frame top (Ch I).** Not reproduced on the default (calm) camera: the painted content's top edge over whole fights, attack pose: **10 px** (seed 1, 1600x900, 111 frames), **14 px** (seed 2, 170 s, 152 frames),
**18 px** at 2000x1012; idle 13 px at 1600x900 and 16 px at 2000x1012; cast 39 to 56 px. The ticket's acceptance (the crown at least 8 px inside, every action frame, 1600x900 and 2000x1012) holds in all three runs; the margin is thin (the attack key is about 23 painted px taller than the idle,
and the idle itself has 13 px), so a sway phase could take it to about 3 px without cutting it. Nothing was changed; if Bailey wants more headroom the smallest change is the Ch I enemy rig's aim 0.1 up (B7).

**PR-0342, "a foreign blue tree over the cavern backdrop" (Ch IX).** It is the approved night-sakura arrival (Bailey's O-4 pick, D-072: one sakura tree blooms with BLUE flowers, Daigoro comes first, Yojimbo steps out from it), not a leak: sampled over 22 s at 2000x1012 the tree plane is up from
422 ms to 3,260 ms after the battle screen (the opening was hurried by a Confirm press, so the clock ran 2x), at opacity 0 from then on, and the first menu opens at 3.5 s. On an unhurried opening the timeline (`SAKURA_ARRIVAL_MS`) keeps the tree until 5.2 s, which is about 1 s after the median first menu (4.2 s): that tail is
what a reviewer sees as a stray tree. The arrival's timings are ours (the approved sheet is a still), so ending it by about 3.6 s would remove the tail; listed (B8), not changed.

**PR-0365, a Mortiphasm disc hidden at the Ch XII first menu (FFX).** Measured at 1280x720, 1600x900, 2000x1012 and 2560x1440 (`before-discs-*`): the lower-left disc is 5 % visible (behind Yuna and Auron) and the lower-right sits under the intent card and Tidus's row; no rectangle geometry reaches the ticket's 0.75
for the lower-left disc with the party standing in front of it, and nudging `DISC_LAYOUT` moves a painted-layout decision. Annotated frame: `pr-0365-discs-first-menu-annotated.jpg`. Options in B9.

**PR-0301, the FFX-2 chain-seam opening is 6.0 s.** Re-measured (`before-seamauto-*`, link openings of Den of Woe, Fallen Aeons, Leblanc, Vegnagun): **6.05, 6.02, 6.05, 6.57 s** from the seam to the end of `moment:battle-start`; a Confirm press still ends it at once (PR-0061). It is the two approved picks
(the calm camera, D-291, +1.7 s; steady pacing, D-294, +0.4 s) on top of the approved opening (D-138): the three questions to Bailey are already written in `docs/handoff/r34fix-seams.md` (askBailey, PR-0301). Nothing changed.

**PR-0293, the pause painting at 3840x2160 is 3369x1925, not the window.** By design: the pause plates are 2688x1536 masters and `build.mjs` refuses a framing that magnifies one past 1.25x (`plates.ts` `MAX_MAGNIFY`), which is exactly 3,360 px. A full-bleed answer needs more magnification (soft), a
blurred extension behind the sharp plate, or a higher-resolution master (art). B10.

**PR-0332, plate side bands at 21:9 in the FFX chapters (Yunalesca 15 % worst).** FFX-2's Bevelle plate now has its painted wings (release 38) and its seam is repaired above; the FFX plates have none. A fix is new painted wings (art generation), a cover-scale crop, or fog on the edge. B11.

**PR-0320, the first-time coach line over the girls' feet during a held shot.** The coach mark is in the held-shot HUD list (`html.mix-held .coach-mark[data-game='ffx2']` hidden): `coachShown` was 0 in every shot of the proof runs above.
**Not looked at:** PR-0247 (Chapter VII's Anima arrival at 390x844, a phone-only finding from round 16; needs Seymour below half HP to trigger it), PR-0366 / PR-0248 / PR-0271 / PR-0333 (HUD slabs over actors: the interface lane's), PR-0317's neighbour PR-0319, PR-0331 (a question).

## 4. Left for Bailey (each needs a yes; nothing here is built)

| Id | Question | What it costs | My recommendation |
|---|---|---|---|
| B1 | Allow the dressphere shot while the NEXT girl's menu is already up (D-357 says never over a menu). 2 of 23 changes in the matrix. | the close shot under an open command menu | no: the menu rule was a pick |
| B2 | Hide the guide and advisor cards during the 1.6 s shot as the intent and Sensor cards already are (`HELD_CSS`), or let a neighbour's body, not her head, stand under a panel. 1 of 23. | a visible HUD change | yes to hiding the cards, with a frame to look at first |
| B3 | Hold an enemy cast already in flight until the shot is over (Active mode). 1 of 23; the critic suggested it. | enemy hits land up to 1.6 s later than their cast | ask: it changes ATB timing feel |
| B4 | Run-in: keep the full follow and release the truck at the first hit's hard cut instead of shortening the follow (section 2.3). | a port method after `moments.impact`; the blow's composition becomes the plain A-1 shot | optional: the shipped fix is safe and shorter |
| B5 | Chain-seam reveal: the boss reveal push hides Yuna in Den of Woe and Fallen Aeons for about 2 s, and the opening is 6 s (PR-0301, PR-0347). | the approved opening (D-138) | the three questions in `r34fix-seams.md` |
| B6 | Bahamut's neck gap: shift his slot (about 0.5 units right moves the gap off the lamp bank, then the rail margins of `ENEMY_SLOTS` must be re-solved), or dim the plate's lamp bank behind him, or leave; and the rim's width on torn edges. | a composition change (the slot was solved to 0.014 of headroom) | leave the head; try the lamp bank first, with a frame |
| B7 | Ch I: aim the enemy rig 0.1 up for headroom over Flux's attack key (+15 px). | a framing change | not needed now |
| B8 | Ch IX: end the sakura arrival by 3.6 s so the first menu opens on the plain chamber. | the arrival's tail | yes: timings were ours |
| B9 | Ch XII discs: (A) move the two lower discs, (B) move the party's slots, (C) leave. | the approved layout | A, with a mockup |
| B10 | 4K pause: soft magnification, a blurred extension, or a 4K master. | art | blurred extension |
| B11 | 21:9 side bands on the FFX plates: painted wings, a crop, or fog. | art generation | fog first |

## 5. Gates (on the tip `f2855e63`, the commit before this note)

- `node node_modules/typescript/bin/tsc --noEmit`: clean.
- Full unit suite (`node node_modules/vitest/vitest.mjs run --testTimeout=60000 --maxWorkers=3`): **808 files passed, 5 skipped (813); 11,884 tests passed, 46 skipped, 1 todo**, 2,837 s (the machine was also running the browser sweeps).
- `node tools/orphans.mjs`: 1,228 modules, 1,204 reachable, 24 orphaned: all 24 old (the sprite format, the voice presets, `MessageBar`, `PartyPrep` and so on); none of this lane's new modules (`CutRig`, `twirlPlan`, `twirlColumn`, `shotPending`, `shotSearch`, `followFlourish`, `frameBracket`, `PoseCut`).
- Source files under 400 lines for everything this lane created or trimmed; the three older files over 400 are named in section 6.
- New and updated test files: `r39-twirl-column` (8), `r39-twirl-early` (8), `r39-run-in-truck-keep` (8), `r39-run-in-cuts` (16), `r39-pose-cut` (4), `r39-plate-seam` (6), `r39-shot-pending` (14), `r39-shot-search` (5), `fx-mix-shot-hold` (updated for the wait).
- Servers: the dev servers this lane started (7170 the branch, 7171 the release 38 baseline, 7173 the trapped-white art) are stopped by port; nothing is deployed and no `dist/` was written.

## 6. For the critic and the merge

Shared files this lane touched, for a merge with the other release 39 lanes: `src/engine/BattlePresenterStage.ts` (`motionView`, `cutRigs`, `posesCut`), `src/engine/BattleCamera.ts`, `src/engine/FrameFit.ts`, `src/engine/CameraPreset.ts`, `src/engine/Backdrop.ts`, `src/scenes/types.ts`, `src/scenes/bevelle-underground.ts`,
`src/scenes/evrae-airship-deck.ts` (399 lines), `src/engine/fx/mix/*` (`MaxMix.ts`, `twirl.ts`, `heldShots.ts` and new `twirlPlan.ts`, `twirlColumn.ts`, `shotPending.ts`, `shotSearch.ts`, `followFlourish.ts`), `src/engine/motion/*` (`StandOff.ts`, `StageMotion.ts`, `StageMotionPort.ts`, new `CutRig.ts`),
`src/app/screens/BattleScreenRunIn.ts`, `src/ui/ffx2/spherechange-flourish.css`. Files over 400 lines were over it before (`BattlePresenterStage.ts`, `Backdrop.ts`, `bevelle-underground.ts`); this lane added 22, 26 and 27 lines to them. Nothing touches a `docs/CONTRACTS.md` file.
What to look at in a review: a first change of a battle on a slow link (the soft fallback column), Paine's changes (the shot's gates), every FFX-2 Attack with a girl at the frame's left edge (the shorter follow), Evrae's hits, Chapters IV and XIII at 2560x1080.
