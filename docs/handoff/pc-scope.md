# pc-scope: the cut-side anchor for big cuts (MF-18) and the wide scope ready to flip (MF-22)

Branch `pc-scope` (from `origin/r67-picks` `9d3e661f4`), 2026-10-28, wave 1 of the program of `D:/Tools/pyrefly-scratch/2026-10-28/PROGRAM-1028.md`. Authority: Bailey, 2026-10-28 ~13:00 EDT, "please work on the
pose continuity fix and and crtiques for chatgpt i mentioned awhile ago as well as motion fluidity and animation. work on all those. i'll go with all your recommendations and decision-making for the next
couple days." and 2026-10-22, "Pose continuity needs to be tight. It needs to be impressive." Nothing deployed, **no browser was run** (the browser belonged to the deep-gap pass): every number below is read
from kept recordings and JSON, every browser measurement is a ready job spec with its prediction written first (rule 15). **Both new words default to today; nothing a player sees changes in this branch.**

Scratch (not in the repo): `D:/Tools/pyrefly-scratch/2026-10-28/pc/pc-scope/` (`progress.md` the step log; `cutsteps.mjs`, `predict-anchor.mjs`, `predict-scope.mjs`, `classes.mjs` the offline reads and their `.out.txt`;
`make-jobs.mjs` and `jobs/` the job specs).

## What each item is, with its game case (AGENTS.md rule 14)

| item | game case | word | what it does | tests |
|---|---|---|---|---|
| **MF-18, the cut-side anchor** | **both games.** The mechanism is shared (`PaintedActor` planes, the smear director). The numbers come from FFX Chapter I and Yunalesca (heads of Auron's follow to idle 0.41 to 0.44 of his height apart, Yunalesca's attack to cast 0.44) and FFX-2 Trema and Chapter IV (no cut over 120 px: nothing to fix, nothing to break) | `?cutanchor=today\|on\|moving`, default `today` (`CUT_ANCHOR_DEFAULT`, one line) | on a plane cut whose two heads are more than **0.12 of the figure's height** apart along x (the planner's own `BIG_ANCHOR`; the point the harness reads), the INCOMING plane is drawn back toward the old head (its `align`, the drift the aligned dissolve already uses) so 0.12 is what is left at the cut, then **glides home on an ease-out** over 80 to 150 ms (never fewer than 4 frames of the display running, never over 200 ms), on real time, so it is the same at 60, 120 and 144 Hz. The cut (window, streak, flash) is unchanged. Sideways only: the feet keep the floor line, the head keeps the pose's own height. `moving` anchors only a cut made on a figure that is travelling (speed 0.45 body heights a second or more). A pair under the cap, a blend, a rig, a cut under an open FFX-2 menu (none is made there) and `?swap=aligned` (same field) are untouched. The planned-smear log entry carries `glide: { share, ms }` | `pc-scope-cut-anchor.test.ts` (13: the word, the plan, the curve, per-plane bookkeeping, Hz independence), `pc-scope-cut-anchor-director.test.ts` (10: the director on a fake host with the real `PoseBlend`), `engine/pc-scope-cut-anchor-actor.test.ts` (5, the REAL `PaintedActor`: drawn back at the cut, eases home monotonically to exactly 0, ends where `today` puts it to the last digit, the flip is on the same frame, a second hit counts the drift the first left) |
| **MF-22, the wide scope** | **both games** (shared plumbing; the looks it widens are the stance and cause picks, played per game from each game's own paintings) | `?swapscope=pack\|wide\|all`, default `pack` (`SCOPE_DEFAULT`, one line); `today` is `pack` | `pack` = Chapter I and IV (release 67). `wide` = the nineteen listed chapters (`WIDE_CHAPTERS`, equal to `CHAPTER_IDS`: a twentieth fails a test until decided) **except the named exceptions** (`SCOPE_EXCEPTIONS`: id to written reason and what lifts it). `all` = every chapter id, exceptions and hidden chapters included: the measuring word (unchanged meaning). A hidden or experimental chapter (fayth, the Wind Waker and Leblanc experiments) is never in `wide`. The smear style in `SmearDirector` now follows `swapsInScope()`. `__pyrefly.swapSwitch({ scope, cutAnchor })` returns `scopeExceptions` and `cutAnchor` | `pc-scope-swap-scope.test.ts` (17: the word, the exception list is real chapters with reasons, all nineteen chapters x pack / wide / all through the live switches), `engine/pc-scope-swap-scope-actor.test.ts` (6: a hit on the REAL actor in each of the nineteen chapters under each scope; smear off beats the scope; hidden chapters; an open FFX-2 menu still cuts nothing) |

Files: new `src/engine/motion/CutAnchor.ts` (160 lines); `SmearDirector.ts` (`anchor()`, `step(ms)`, `shiftPlane?` on `SmearHost`), `SmearFacts.ts` (`anchorDx`, signed), `SmearLog.ts` (`glide`), `SwapSwitch.ts` (`SwapScope`, `SCOPE_DEFAULT`, `WIDE_CHAPTERS`, `SCOPE_EXCEPTIONS`, `chapterInScope`), `src/debug/smearApi.ts`, `docs/DEV.md` (two rows).
`PaintedActor.ts` is 2,711 lines (was 2,712: the three-line `planes/cells/blend` host literal was folded to make room for `shiftPlane`, and `smear.step()` takes the frame's real ms). No contract file changed (`docs/CONTRACTS.md`'s six). `node tools/orphans.mjs` lists the same 24 modules as before.

## The one exception, and why

`SCOPE_EXCEPTIONS` holds **`yunalesca`** (FFX, the big foe): the rules-on run of 2026-10-27 (`mf-l1-swaps.md`, MF-22 table) took ghost frames a minute from 287 to 98 but swap jerks of 40 px or more from 9 to 25 (worst 62 to 155 px):
the planner's own moving-figure cuts across heads 0.41 to 0.44 of the height apart (Yunalesca attack to cast, Auron follow to idle). **It lifts when `yunalesca-all-anchor` (jobs below) lands**: the prediction is 48 planned cuts over
120 px down to 0. Every other chapter has no measurement with the rules on, so none is excepted on a guess; the 17 other chapters are measured tonight, and an entry is added for any that misses (its id, its pair, its px).

## What the kept runs say (offline; `predict-anchor.out.txt`, `predict-scope.out.txt`)

**MF-18, planned cuts' whole step (px at 1600 wide), the anchor applied to the kept runs' own cuts** (optimistic: the shift all lands in the direction of the step; "pessimistic" keeps a cut that is mostly travel as it was):

| run | planned cuts | median | worst | over 120 px |
|---|---|---|---|---|
| Chapter I today (`ch1-c0`) | 31 | 66.5 to 50.7 | 233 to 153 | 10 to 6 (7 pessimistic) |
| Chapter I `v1b + pick` (`ch1-fp`) | 70 | 63.7 to 55.4 | 227 to 180 | 13 to 8 (9) |
| Chapter I `v1a + cut` (`ch1-fr1`) | 94 | 52.7 to 45.7 | 232 to 155 | 18 to 11 (12) |
| **Yunalesca rules on (`y-p`)** | 324 | 68.7 to 49.7 | 154 to 82 | **48 to 0** |
| Trema rules on (`tr-p`) | 402 | 33.2 to 30.9 | 98 to 92 | 0 to 0 |
| Chapter IV (`ch4-fa1`, `ch4-fp`, `ch4-fr1`) | 31, 87, 137 | 48 to 36 / 48 / 46 | 85 to 77 | 0 to 0 |

**What the anchor does not and cannot fix (named, not hidden).** The cap takes the x part of a step; the rest stays: (1) **vertical**: Tidus `hurt`/`critical` and `idle>hurt` are 0.2 to 0.25 of his height lower in the new drawing (dy 113 to 147 px at the push-in); a vertical shift would lift his feet off the floor line, which is exactly what CHK-026's feet reading catches, so it is not built; these stay 120 to 150 px and are the pose's own bend. (2) **travel**: Kimahri's `idle>attack`, `ready>attack`, `attack>follow` are the run-in's own speed (anchor 0.04 to 0.14), the territory of MF-04 and the anticipation half of MF-18 (see "Not done"). (3) the **camera cut**: Auron `idle>victory` (159 px, anchor 0.14, figure drawn 1,096 px tall) is the victory close-up. So Chapter I's over-120 count is predicted to fall from 10 to 13 to 6 to 8, not to 0; the plan's "no whole step over 120 px that is not a named camera cut" holds for Yunalesca and Chapter IV and is **short by those named vertical and travel cuts in Chapter I**.

**MF-22, the picks through all 19 chapters** (`predict-scope.mjs` re-plays round 30's recorded swaps through the rules of `?stance=v1a&swapcause=pick`, scope all, class by class; it was calibrated against five of the lane's measured arms: it reads 11 to 37 percent LOW in the two pack chapters and +2 and +14 percent high in Trema and Yunalesca, so its numbers are bands, not points): ghost milliseconds a minute across all 19 chapters **3,474 to about 1,385** (-60 percent), Chapter I 1,689 to ~550, Chapter IV 1,505 to ~680. **PR-0379's acceptance line (under 1,000 ms a minute in every chapter) is NOT reached by the picks alone: 13 of 19 stay above it** (Trema ~2,800, Yunalesca ~2,100, Leblanc and Ixion ~1,900, Omnis ~1,450, Evrae and Fallen Aeons ~1,350). What is left, by class (Trema: party `hurt>idle` 27 percent, the foes' own `idle>attack`, `attack>idle` and `hurt>idle` 49 percent; Yunalesca: party `ready>attack`, `hurt>idle`, `follow>idle`, `cast>idle`, foe `idle>attack`): the classes MF-06 does not name (a foe's own attack swaps) and the uncovered classes whose pairs are "big" (outlines under half shared), which keep today's blend by the guard that stops a 50 ms blend popping a head. Options for the next batch, **none built (hard rule 10: they need a yes)**: (a) a cut with the new glide for the uncovered big pairs at rest (the glide is what makes a cut across far heads readable; the stop rule that guards `pick` was written for a plain cut); (b) a class for a foe's attack start and end; (c) leave them. Option (a) is the natural use of MF-18 and needs a clip first.

**PR-0380 outside the pack.** The round-30 swap jerks in the 17 other chapters are dissolves that move the weighted point (the live build plans no smear there: `smearsPlanned` 0). Under the wide rules the covered ones become excused cuts. The **200.5 px Vegnagun "tail"** step is not a stance or cause swap at all: it is the tail's `hurt>ko` (feet dx -200, dy -17), the part collapsing inside the white beam (read from `jerk-000-vegnagun-tail.jpg`: the tail comes apart over frames -2 to +2); the KO is the knock-out's own cut (`SmearPlan.SKIP`, `swapClassOf` returns null for it), so neither word nor the anchor touches it. It is a designed destruction the harness cannot tell from a pop, and it belongs to PR-0473 and MF-09 / MF-17 (the KO), not to this scope. A waiver row in `docs/target/pose-waivers.json` with that reason is the driver's call.

## Tonight's browser run (job specs: `D:/Tools/pyrefly-scratch/2026-10-28/pc/pc-scope/jobs/`)

`index.json` lists them; `queue-tonight.json` is the queue (23 continuity jobs, about 271 minutes of lock; the fluidity lane's `{ tag, chapter, query }` format plus `baseline`, `prediction`, `lockMinutes`); `films.json` the four clip jobs for the driver's look call; `check-prediction.mjs` compares a finished run with its prediction (tested on the kept runs; exit 2 on a miss); `run-queue.mjs` runs the queue one job at a time under the RIG-RECORD lock and stops on a miss (`--dry` prints every command; the dev server is started by hand: `npx vite --port 5191` in this tree, stopped by port afterwards).
Order: (1) Chapter I and Chapter IV, `?cutanchor=today` then `=on` (`ch1-pick`, `ch1-anchor`, `ch4-pick`, `ch4-anchor`: about 26 minutes; the first run of the default `v1a + pick`, which r67-picks open question 1 says was never measured), (2) Yunalesca `?swapscope=all` with the anchor off and on, (3) the other chapters shortest first with `?swapscope=all&cutanchor=on`. Jobs past 12 minutes of battle (Yunalesca, Vegnagun, Mirror Aeons, Sin core, Trema, Braska: 12 to 29 minutes) pass the lock's 10-minute hold: the runner refuses them without `--heartbeat` (or `--force-long`), because holding the lock longer is the owner's call.

The predictions, written before any run (a MISS stops the queue and is written up before the next job; the band is never widened to fit):

| job | prediction |
|---|---|
| `ch1-pick` (v1a + pick, anchor off) | ghost frames a minute 31 to 51 (model 32.8, pack band 0.95x to 1.55x; the lane's `v1b + pick` read 36.2 and 32.7), snaps 0, swap jerks of 40 px or more 0 to 4, planned cuts over 120 px 6 to 14, median whole step 50 to 72 |
| `ch1-anchor` (anchor on) | ghost frames within 12 percent of `ch1-pick`; planned cuts over 120 px **3 to 8**; median whole step **40 to 58**; worst 120 to 190; swap jerks no more than the control + 1; anchored cuts 10 to 90; dashes' worst no more than 70 px (the glide's first step is at most about 37 px at 60 Hz) |
| `ch4-pick` / `ch4-anchor` | ghost frames 35 to 55 (model 34.9); no planned cut over 120 px in either; median 40 to 56 / **28 to 50**; snaps 0; swap jerks 0 to 4 |
| `yunalesca-all-today` | the re-measure of the 2026-10-27 run: ghost frames 106 to 163, swap jerks 15 to 40, planned cuts over 120 px 30 to 60 |
| `yunalesca-all-anchor` | **planned cuts over 120 px 0 to 1, swap jerks of 40 px or more 0 to 12, median 40 to 58, worst 60 to 100**; if it lands, delete the `yunalesca` line of `SCOPE_EXCEPTIONS` |
| the 17 `<chapter>-all` jobs | ghost frames and ms a minute inside the per-chapter band of `predict-scope.out.txt` (0.85x to 1.3x the model), and **at most 0.7x the round-30 baseline**; snaps 0; swap jerks of 40 px or more no more than the baseline + 3; planned cuts over 120 px 0 to 2; head and feet fails no more than the baseline |

## How the driver flips it (after the run is read)

Three lines, each with the tests that pin it (a green suite after a flip means it was made on both sides):
1. `CUT_ANCHOR_DEFAULT = 'on'` (or `'moving'`) in `src/engine/motion/CutAnchor.ts`; tests: `pc-scope-cut-anchor.test.ts` ("is today with no word": the first expectation and `cutAnchorFromSearch('')`; `cutAnchorFromSearch('?cutanchor=banana')`), `pc-scope-cut-anchor-actor.test.ts` is word-explicit and does not change.
2. `SCOPE_DEFAULT = 'wide'` in `src/engine/motion/SwapSwitch.ts`; tests: `pc-scope-swap-scope.test.ts` ("the default is pack": the first test; the `?pack=demo` and bare-address lines), `release67-picks.test.ts` and `release66-defaults.test.ts` read the scope through `?swapscope=all` and `pack`: check them.
3. `SCOPE_EXCEPTIONS`: delete `yunalesca` when its job lands; add an id with its reason and what lifts it for any chapter that misses. The tests demand a real chapter id, a reason over 80 characters and the words "Lifts when".
Then `docs/DEV.md` (the two rows say "default `pack`" / "`today`"), the player note, and one CHANGELOG line per game: "Both games: in every chapter, the picked poses cut ..." The driver writes the words.

## Not done, and why

- **The anticipation half of MF-18** ("a 2 to 3 frame crouch and lean on the plane that stands before the cut"): it depends on MF-04's readable pull (`?run=flow`, lane L2) and edits its run-in file; under `?stance=v1a` the wind-up painting already carries the ready lean into the strike. Not built; the travel cuts it would shorten (Kimahri's three, 125 to 198 px) are the ones left in Chapter I.
- **A vertical anchor** (see above): rejected on the feet reading, not deferred.
- **`SmearPlan.CAUSE_MAX_ANCHOR`** (0.4, a cut on its cause at rest across heads this far apart stays today's blend) is left as it is: relaxing it with the glide is a look change for a clip (option (a) above).
- **Nothing was run in a browser.** The glide's look (does a figure that STANDS read as skating while it eases home?) is the clips' question: `films.json` has the paired clips, and `?cutanchor=moving` is the fallback word if a standing figure reads badly.
- The harness's `continuity.json` does not carry `glide` (the planned-smear log does, `window.__pyrefly.smearLog()`, and the raw recording `CONT_RAW_DIR` keeps it); the harness files are shared plumbing and were not edited.

## Open questions (for the driver)

1. **Is `moving` or `on` the default to flip to?** `on` anchors a standing figure's cut too (a hit on a figure at rest across 0.2 to 0.4 apart: a 100 ms slide after the flash); `moving` leaves those at today's cut. The prediction numbers are for `on`; the clip `film-yunalesca-anchor` and `film-ch1-anchor` decide.
2. **The 13 chapters the picks alone do not bring under PR-0379's 1,000 ms a minute.** Accept the line as 3,474 to ~1,400 and re-state the acceptance, or ask for option (a) or (b) above? Needs a yes.
3. **A waiver row for the Vegnagun tail's `hurt>ko`** (a designed destruction under the beam) so PR-0380 stops counting it.
4. `WIDE_CHAPTERS` is explicit on purpose (a new chapter must be decided); the hidden 3D fayth chapter and the experiments stay out of `wide`. Say if any should be in.
