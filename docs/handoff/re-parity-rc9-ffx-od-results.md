# Re-parity RC9, lane FFX-B: the Overdrive results (FFX only)

Status: **built, tested, measured and mutation-checked on branch `re-parity-rc9-ffx-od-results` (from the tip of `re-parity-rc9-ffx-overdrives`, `1c21857eb`, lane FFX-A); pushed; not merged, not deployed** (2026-10-15). Two of the plan's three open rows are built (B2 the Fail rank, B3 the timing factor in the game's units) and one is left out on purpose and said so (B4, which hits the factor reaches). `node tools/critic-plan.mjs --paths <the lane's source files>` says DEEP (the FFX CTB engine); this lane deploys nothing.
**Game case: FFX only** (AGENTS.md rule 14): Swordplay (Tidus) and Bushido (Auron) exist only in FFX. Nothing under `src/battle/ffx2`, `src/data/ffx2` or `src/audio` is touched; `ffx2-atb-golden` and `ff7-golden` pass unchanged. No file of `docs/CONTRACTS.md` is touched (`TimingBonus` is an FFX-internal type in `adapt/hit.ts`; `battle/common/types.ts` is not edited), so `docs/CONTRACT-CHANGES.md` has no entry. No boss number and no party number was changed or added.

Bailey's words, as the brief quotes them: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please"; 2026-10-13 "keep going please all of this reverse engineering needs to be incorporated into our game" and "keep going please full speed ahead". Plan: `wiring-plan-draft-2026-10-11.md` lane FFX-B (B1 and B5 landed in RC4; B2 to B4 here) with the addendum of 2026-10-13. Notes: `FFX-G01` (sections 3, 4.1, 5, 6.1, rows 17, 22 and 22b of section 10, open questions 4, 9, 10, 11) and `FFX-H01` section 3.5 (which closes open question 10). Paper preflight: `docs/plans/re-parity-rc9-ffx-od-results-review.md`.

## 0. Result in one paragraph

Two rows are built and one is left out and said so. **B2:** the user is charged the menu command's rank whatever the grade, as the game does (the rank is stored when the action is first calculated and the result handler never rewrites it): a failed Tornado or Blitz Ace costs 7, not 6. The gate (nobody had run the rank store and the delay) was closed by `FFX-H01` with 2,400 end-to-end vectors and is **reproduced here from a fresh seed** (2,400 of 2,400, 799 of them Fail grades, plus the 1,920-row sweep, 0 mismatches); 456 of its vectors are exported as a fixture and the engine's turn charge equals the game's on every one. **B3:** the scale override is fed `A` and `B` in float32 seconds, `A = float32(B - frame / 30)`, as the game's timer holds them, instead of float32 milliseconds; exported as 267 frames x 64 damages from the real timer and override, the old arithmetic differs on 132 of 17,088 numbers (0.77 percent, never by more than one point). **B4** (which hits the factor reaches) **is not built:** it is gated on where the Blitz Ace and Bushido controllers start in the animation, which the emulator cannot settle (it runs functions of the exe; the start point is in the animation data, a container nobody has read). The engine keeps scaling every hit, a comment and a pin test name the gate, and this note measures what the change will cost Blitz Ace when it lands (4 to 17 percent, about 11 percent on average). **Nothing a chapter measures moved but seven rounding points:** 0 of 132 logs at 12 seeds on every chapter, 7 of 3,500 at 500 seeds on the seven chapters whose line fires a timed move, each one damage event one point lower (cause shown by ablation: 14 of 14 runs back on the base), no win, outcome or turn count changed, no golden moved. **Checks:** `tsc` is clean; the lane's 28 test files and the three goldens pass (602 tests); the whole suite, once: 1,270 files and 19,660 tests, 198 failed in 26 files: the previous lane's 22 art-only files (182 tests, the paintings are not in the worktree) and 4 files (16 tests) that hit the 15 s per-test timeout on a machine at 99 percent CPU and pass, 74 of 74 tests, when re-run alone with the timeout lifted; a 24-fault mutation pass of the production code catches 23 on the first run and the last after the test it asked for, and none survives.

## 1. What changed

| Row | Before (the FFX-A tip) | Now (the game's) | Where |
|---|---|---|---|
| **B2** the Fail rank | A failed Tornado or Blitz Ace charged the user **rank 6** (`failRank: 6` in the two records, the research table's "(fail 6)"); the other six Overdrives already charged the menu rank on a fail | The user is charged the **menu command's rank whatever the grade**: the rank is stored in `Chr+0xDE8` when the action is first calculated (`0x7892E0`), the minigame result handler (`0x7B0470` / `0x7AFE00`) never writes it, and the action-done call (`0x7B20E0`) pays it. Tornado and Blitz Ace cost **7** on a Fail. The 6 is the rank of the replacement row (`0x310D`, the finisher `0x3112`), which never reaches the user | `overdriveShape.ts#rowFromExtra` (a fail row keeps the menu row's rank; it no longer reads a rank of its own), `data/ffx/abilities/overdrive-tidus.ts` and `overdrive-auron.ts` (no `failRank`) |
| **B3** the timing factor in the game's units | The scale override was fed `A` and `B` as float32 **milliseconds** (`a = min(time left ms, limit ms)`, `b = limit ms`) | `A` and `B` are float32 **seconds**, as the game's timer holds them: `B` the limit, `A = float32(B - frame / 30)` (0 on a failure), built from the controller's `frame` (lane FFX-A's seam). A result that carries no frame (the headless stand-in's whole milliseconds, a test rig's) is read as the float32 of its seconds. **Wakka's reels keep their milliseconds** (the floats his script passes are unread) | `kernel/minigame-timer.ts#timingScale` (new), `overdrive.ts#timingBonusFrom`, `adapt/hit.ts` (`TimingBonus.scale`, read by `hitInputOf`) |
| **B4** which hits the factor reaches | The factor reaches every hit of an ability (Blitz Ace's eight kicks and its finisher) | **Not built.** Unchanged, with a comment where the finisher shares the timing and a test that pins the reading, so the later change is a decision and not an accident | `execute.ts` (comment), `tests/unit/parity-ffx-engine-od-results.test.ts` |

What is NOT changed (kept on purpose): the three overlays and every screen; the headless stand-in `rollDefaultMinigame` (same draws, same count, same order, same stream: only the unit its number is read in); Wakka's reel path; the rank source for every command that is not an Overdrive (`FFX-H01` row 1, open item 3); Fury (it never switches the factor on: the engine returns no bonus for it, as the game never enables it for Lulu).

## 2. The gates: what gates each row, and whether the emulator can settle it

The plan says "two measurements gate two rows". The brief asks for each gated row: what gates it, and whether the Unicorn harness (`D:\Tools\ffx-parity\harness`, which runs FFX.exe's own code) can settle it within about an hour.

| Row | Gate | Can the harness settle it now? | What this lane did |
|---|---|---|---|
| **B2** | `FFX-G01` open question 10: nobody had run the rank store (`0x7892E0`, `0x7895B0`) and the delay path (`0x78D1D0`, `0x78C150`, `0x7909C0`) | **Yes, and it already had been**: `FFX-H01` section 3.5 ran the whole chain on the real code (2,400 end-to-end vectors, 770 of them Fail grades, plus 8,000 rank-rule vectors and all 320 command rows, 0 mismatches). | **Reproduced from a fresh seed** (`rerun_sweep_b.py`, seed 20261015): sweep B **2,400 of 2,400**, 799 Fail grades, the handler ran and cleared the armed byte in all 2,400 and changed a result record in 1,897; the all-rows sweep **1,920 of 1,920**, 0 mismatches. **Exported** as a fixture of 476 vectors and **built.** |
| **B3** | The `frame` field of the result (lane FFX-A, landed) | Nothing to settle. The arithmetic (`0x78BD90`, 92,400 vectors) and the timer (`0x891AC0`) were proven. | Chained them on the real code for every frame of every limit (267 frames x 64 damages, 17,088 pairs) and **built.** |
| **B4** | `FFX-G01` open question 4: where the Blitz Ace and Bushido controllers start in the animation (the start gate `0x7AFC90` admits only categories 0x20, 0x25, 0x30 and 0x40, so the animation script starts the other controllers through the script native `0x7AFD30`) | **No.** The harness runs functions of the exe over a world it builds. The start point is a property of the animation timeline, that is, of the order of the hit-apply natives and the minigame starter inside Tidus's and Auron's action data, which lives in the install's character files (`chr/pc/c001/*.ah`, `.cdf`, the model's animation container; on the PS2 side `chr/pc/c001/mot/resident0..3.mgrp` and `battle/mot`) in containers whose layout nobody in the program has read. The one exe-side lever, the Atel VM loop (`0x8641E0`, `FFX-G06`), was run over the 1,224 monster and formation scripts and has no player-action script to feed. `audit-round2.md` (FFX-H07) classes it "a play or script read" and lists G01 4 among the six questions that need the running game. A few minutes against the install's file listing confirmed that no script of that kind is there to feed the loop; I judge it not settleable within the hour. | **Not built.** Measured what it would cost Blitz Ace (section 6) so the later decision has a number. |

## 3. The proofs (the game's own code, run in the emulator)

Both fixtures are real runs of FFX.exe (Steam build 25501027, SHA-256 `0537B2A1...686D`) in the Unicorn harness, made by the lane's `gen_od_results.py` (scratch, not committed: it needs the private harness and the exe copy) and stored under `tests/fixtures/parity/ffx/` in the shared vector layout (numbers only).

| Fixture | Function chain | Vectors |
|---|---|---|
| `overdrive_rank.json` (B2) | the first calculation `0x7892E0` (rank rule `0x7895B0`, command lookup `0x78CE50`) -> the result entry `0x7B0470` / handler `0x7AFE00` with a Fail or a success (and the (Immune) rows) -> the action-done call `0x7B20E0` with the real delay path | 476: 20 table rows (the eight menu ranks and the replacement rows', read from the real command table), **192 Fails and 192 successes** (every Overdrive x agility 5, 9, 14, 30, 62, 98, 170, 255 x Haste, Slow or neither) and **72 (Immune) rows** (Shooting Star, Dragon Fang, Banishing Blade against a target the first pass cannot inflict the rider on). The rank byte is the same before and after the result handler in all 456; the handler ran in all of them; the variant byte shows the Fail row (0), the success row (1) and the (Immune) row (2) |
| `overdrive_scale.json` (B3) | the timer `0x891AC0` (ticks at 30 a second) -> the scale override `0x78BD90` with `A` from the timer and `B` the limit, both float32 seconds | 267 frames (every frame of the 2, 3 and 4 second limits whose input is still accepted: 59 + 89 + 119) x 64 damages (36 chosen and 28 random, 1 to 99,999) = 17,088 pairs; the real timer's `A` agrees with the independent model `float32(B - f / 30)` at all 267 frames |

What the second fixture says about the old arithmetic: the milliseconds path agrees with the game on 16,956 of the 17,088 pairs and differs on **132 (0.77 percent; 1.11 percent for damages up to 9,999)**: the game's number is one lower in 103 of them and one higher in 29, never more than one. That is `FFX-G01` row 22's "about 1 percent", now measured on the instants the game produces.

## 4. Tests

| File | What it pins |
|---|---|
| `parity-ffx-engine-od-results` (new, 19 tests) | **B2**: the eight menu ranks restated from the note and read from the real table; the replacement rows' ranks; the result handler never writes the rank (456 vectors); **every vector through the engine's `executeCommand` and `chargeForAction`**: rank and turn charge equal the game's recovery for every Overdrive, grade, agility, Haste and Slow (456 of 456), the engine takes the (Immune) row where the game does (72 of 72); a Fail costs the menu rank (Tornado and Blitz Ace 7); every Fail and (Immune) row the shaper builds carries the menu rank; the old rule disagrees with the game on all 48 Fails of Tornado and Blitz Ace. **B3**: `timingScale` gives the real timer's `A` bit for bit at 267 frames; the engine's own path (`timingBonusFrom` -> `HitRequest` -> `hitInputOf` -> the override) gives the real override's damage for **22,784 pairs** (four Overdrives, every frame); the frame beats the milliseconds when a result carries both; a result with no frame is read as float32 seconds; a failure earns A = 0 whatever frame it carries; Wakka's reels untouched; the stand-in keeps its draws (200 seeds); three wrong readings of the old kind disagree with the game on 132, more than 5,000 and more than 5,000 pairs. **B4**: the factor still reaches all nine hits of Blitz Ace |
| `ffx-overdrive-fail-rows` (3 pins), `ffx-blitz-ace-finisher` (1), `ffx-bushido-fail-no-rider` (1) | updated, **cause written next to each**: five pins said rank 6 for a failed Tornado or Blitz Ace (a fail "comes back sooner", rank 6 on the fail row); they now say what the game does (the same moment, rank 7) |
| `ffx-swordplay-miss-restart` (1), `ffx-bushido-fail-bonus` (1) | updated: `timingBonusFrom` also carries `scale`, the game's `A` and `B` in float32 seconds (a failure: A = 0) |
| goldens | **nothing moved**: `ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden` pass unchanged (no digest is re-baselined) |

Lane run: the 28 files of section 13 (the previous lane's list, this lane's `parity-ffx-engine-od-results` and the wiring, modifiers and CTB files that read the timing and the rank) pass: **602 tests, 0 failed** (read from the whole-suite run's report; a targeted run of the same 28 files before the last test additions gave 28 files and 600 tests, all passed), and `tsc --noEmit` is clean; `node tools/orphans.mjs` lists 28 orphaned modules, none of them this lane's.

### The mutation pass: 24 faults, 23 caught on the first run, the last after the test it asked for, none survives

One exact-string change of the production code at a time, the lane's ten test files run with `--bail=1` (a fault is CAUGHT when a test fails), the file put back byte for byte after each run (`git status` shows only the committed changes after the pass). Each fault puts one rule of the lane back the way it was, or breaks it the way a later edit could. Runner and list: `D:\Tools\ffx-parity\rc9\od-results\mutate.mjs` and `mutants.mjs` (the FFX-A runner, adapted); results in `mutation-results.json` and `mutation-results-r04.json`.

| Fault | What it puts wrong | Caught by (the first failing test file) |
|---|---|---|
| R01 | B2: Tornado's Fail row takes rank 6 again (the replacement row's own, the old failRank) | parity-ffx-engine-od-results |
| R02 | B2: Blitz Ace's Fail row takes rank 6 again | parity-ffx-engine-od-results |
| R03 | B2: every Fail row takes rank 3 (any rank but the menu row's) | parity-ffx-engine-od-results |
| R04 | B2: the (Immune) rows take rank 5 (the replacement rows' ranks reach the row the engine builds) | **survived the first run** (a gap: the (Immune) rows' own rank is dead data in the engine's charge path, so only an invariant sees it; now the test 'every Fail and (Immune) row the engine builds carries its move's MENU rank'); **caught by the added test**: parity-ffx-engine-od-results |
| D01 | B2 data: Tornado's menu rank 6 (the game: 7) | parity-ffx-engine-od-results |
| D02 | B2 data: Blitz Ace's menu rank 6 (the game: 7) | parity-ffx-engine-od-results |
| D03 | B2 data: Banishing Blade's menu rank 5 (the game: 6) | parity-ffx-engine-od-results |
| D04 | B2 data: Spiral Cut's menu rank 4 (the game: 3) | parity-ffx-engine-od-results |
| T01 | B3: B is the limit in milliseconds, A in seconds (mixed units) | parity-ffx-engine-od-results |
| T02 | B3: the frame is ignored, A is read from the milliseconds | parity-ffx-engine-od-results |
| T03 | B3: A is the timer one frame early (frame - 1 ticks) | parity-ffx-engine-od-results |
| T04 | B3: A at 25 ticks a second (the PAL rate) | parity-ffx-engine-od-results |
| T05 | B3: no clamp of the milliseconds to 0..limit | parity-ffx-engine-od-results |
| T06 | B3: A is not float32 when it is read from milliseconds | parity-ffx-engine-od-results |
| T07 | B3: a failed result keeps its frame (A from the timer, not 0) | parity-ffx-engine-od-results |
| T08 | B3: a failed result keeps its milliseconds | parity-ffx-engine-od-results |
| T09 | B3: the hit pipeline ignores the scale and reads the milliseconds (the old engine) | parity-ffx-engine-od-results |
| T10 | B3: Wakka's reels are given a scale in seconds (his script's floats are unread) | parity-ffx-engine-od-results |
| T11 | B3: Bushido's result loses its frame | parity-ffx-engine-od-results |
| T12 | B3: Swordplay's result loses its frame | parity-ffx-engine-od-results |
| T13 | B3: a hit with no timing reaches the override (a scale with B = 0) | parity-ffx-engine-wiring |
| T14 | B3: Swordplay takes the def's limit instead of the result's own | parity-ffx-engine-od-results |
| B01 | B4: the timing factor reaches only the finisher (the eight kicks lose it) - the change that is gated | parity-ffx-engine-od-results |
| B02 | B4: the finisher loses the timing factor | parity-ffx-engine-od-results |

**The survivor.** R04 (the (Immune) rows take rank 5) survived the first run: the (Immune) rows' own rank is dead data in the engine's charge path (the action's rank is the success row's), so only an invariant sees it. That was a real gap in the tests, now closed by 'every Fail and (Immune) row the engine builds carries its move's MENU rank'. A second gap found by reasoning before the run (a failed result that carries an early frame, a result whose milliseconds and frame disagree) was closed in the same commit. **Final count: 24 faults, 24 caught, no equivalent survivor.**

## 5. Measurement

Method: the shipped `intendedStrategy` plays each chapter's whole chain through the app's own path (the same wiring as `ffx-parity-measure.test.ts` and the goldens), every minigame auto-resolved by the engine's stand-in, on seeds 1 to 12 for every FFX chapter and seeds 1 to 500 for the seven chapters whose shipped line fires a Swordplay or Bushido move (I Seymour Flux: Dragon Fang; II Yunalesca: Shooting Star, Spiral Cut; III Braska's Final Aeon: Shooting Star, Energy Rain; VII Seymour and Anima: Spiral Cut, Banishing Blade, Dragon Fang; VIII Evrae: Spiral Cut; XVII Sin, the Fins and the Core: Spiral Cut, Dragon Fang and Lulu's Fire Fury; XVIII Sin, the Face: Dragon Fang). The other four chapters (IX Yojimbo, X Natus, XII Omnis, XIV Isaaru) fire no timed move (Grand Summon only). **Base is the tip of lane FFX-A** (`1c21857eb`, this branch's parent): the 12-seed census was re-run on the unmodified tree before anything was edited and all 132 digests equal FFX-A's own final 12-seed measurement, which makes FFX-A's 500-seed file (made on the same source) a valid base. **The tip is the code commit `b824b5c42`** (the commits after it carry tests and this note only). Per seed the census keeps the outcome, the party and engine turns, the party KOs and a digest of the whole event log (every field). Nothing was tuned. **None of the shipped lines fires Slice and Dice, Blitz Ace or Tornado at any seed** (the "uses" in the tables name every timed move each line fires), so row B2 cannot move a chapter, and row B4 is not built.

### 5.1 Seeds 1 to 12, every FFX chapter

Every win, turn count, KO count and log is the base's: **0 of 132 logs move.**

| Chapter (timed moves the line fires, uses) | wins | party turns | engine turns | party KOs | seeds whose log moved | outcome of any seed changed |
|---|---|---|---|---|---|---|
| seymour-flux (dragon-fang 1) | 12 to 12 | 53.33 to 53.33 | 73.17 to 73.17 | 1.08 to 1.08 | 0 | 0 |
| yunalesca (shooting-star 27, spiral-cut 10) | 12 to 12 | 148.5 to 148.5 | 210.67 to 210.67 | 12 to 12 | 0 | 0 |
| braskas-final-aeon (shooting-star 24, energy-rain 40) | 11 to 11 | 240.08 to 240.08 | 386.17 to 386.17 | 5.5 to 5.5 | 0 | 0 |
| seymour-anima-macalania (spiral-cut 10, banishing-blade 1) | 12 to 12 | 54.17 to 54.17 | 87.92 to 87.92 | 4.75 to 4.75 | 0 | 0 |
| evrae-airship (spiral-cut 6) | 12 to 12 | 70.92 to 70.92 | 88.58 to 88.58 | 0.67 to 0.67 | 0 | 0 |
| yojimbo-cavern (none) | 11 to 11 | 65.25 to 65.25 | 92.5 to 92.5 | 3.58 to 3.58 | 0 | 0 |
| seymour-natus (none) | 11 to 11 | 35 to 35 | 51.5 to 51.5 | 2.42 to 2.42 | 0 | 0 |
| seymour-omnis (none) | 11 to 11 | 91.5 to 91.5 | 124.25 to 124.25 | 0.75 to 0.75 | 0 | 0 |
| isaaru-via-purifico (none) | 11 to 11 | 37.58 to 37.58 | 83.25 to 83.25 | 3 to 3 | 0 | 0 |
| sin-fins-core (spiral-cut 26, fire-fury 10, dragon-fang 15) | 11 to 11 | 311.58 to 311.58 | 398.17 to 398.17 | 2.25 to 2.25 | 0 | 0 |
| sin-face (dragon-fang 12) | 12 to 12 | 45.5 to 45.5 | 50.5 to 50.5 | 0 to 0 | 0 | 0 |
total seeds 132, logs moved 0, outcomes changed 0

### 5.2 Seeds 1 to 500, the seven chapters whose line fires a timed move

| Chapter (timed moves the line fires, uses) | wins | party turns | engine turns | party KOs | seeds whose log moved | outcome of any seed changed |
|---|---|---|---|---|---|---|
| seymour-flux (dragon-fang 107) | 500 to 500 | 51.96 to 51.96 | 70.76 to 70.76 | 0.92 to 0.92 | 0 | 0 |
| yunalesca (shooting-star 1,116, spiral-cut 419) | 453 to 453 | 157.66 to 157.66 | 223.97 to 223.97 | 13.59 to 13.59 | 0 | 0 |
| braskas-final-aeon (shooting-star 1,070, energy-rain 1,490) | 479 to 479 | 232.13 to 232.13 | 373.04 to 373.04 | 5.37 to 5.37 | 5 | 0 |
| seymour-anima-macalania (spiral-cut 326, banishing-blade 44, dragon-fang 5) | 470 to 470 | 54.68 to 54.68 | 86.72 to 86.72 | 4.75 to 4.75 | 0 | 0 |
| evrae-airship (spiral-cut 281) | 488 to 488 | 71.03 to 71.03 | 89.79 to 89.79 | 0.73 to 0.73 | 0 | 0 |
| sin-fins-core (spiral-cut 1,105, fire-fury 452, dragon-fang 647) | 433 to 433 | 294.15 to 294.15 | 380.14 to 380.14 | 2.82 to 2.82 | 2 | 0 |
| sin-face (dragon-fang 500) | 500 to 500 | 45.27 to 45.27 | 50.27 to 50.27 | 0 to 0 | 0 | 0 |
total seeds 3500, logs moved 7, outcomes changed 0

**7 of 3,500 logs move; no win, no outcome, no turn count and no KO count changes.** The moved runs are Chapter III seeds 61, 94, 264, 361 and 451 and Chapter XVII seeds 146 and 354.

### 5.3 Causes, by ablation and by the logs (not by reading)

- **B3, the whole of it: seven hits, one point each.** Replaying each moved seed at the tip and with the old milliseconds path put back (one exact-string change of `adapt/hit.ts`, restored byte for byte; `ablate.mjs`): the ablated run's digest equals the base's in **14 of 14** runs (the seven moved seeds and seven that did not move), while the tip moves the seven. Comparing the two logs of each moved seed: the same number of events, the same action sequence, and **exactly one damage event differs, by one point, always lower; the other 1,900 to 2,500 events of the log are identical.** The seven hits: Tidus's Energy Rain on the possessed Ifrit (seed 61: 966 to 965; seed 361: 963 to 962) and on the possessed Bahamut (seed 264: 2,640 to 2,639); Auron's Shooting Star on the possessed Bahamut (seed 94: 2,241 to 2,240) and Valefor (seed 451: 2,973 to 2,972); Tidus's Spiral Cut on the Right Fin (Chapter XVII seed 146: 4,862 to 4,861) and on Sin's Core (seed 354: 2,727 to 2,726). That is the rate the notes predicted for the stand-in's whole-millisecond instants (`FFX-G01` row 22: 0.08 to 0.10 percent of timed hits): 7 moved hits in about 7,100 timed Overdrives (Dragon Fang 1,259, Shooting Star 2,186, Spiral Cut 2,131, Energy Rain 1,490, Banishing Blade 44 uses over the seven chapters at 500 seeds).
- **B2 cannot reach these chapters:** no shipped line fires Tornado or Blitz Ace, and the six Overdrives that do fire already charged the menu rank on a fail. It is proven by the vectors (section 3), not by these runs.
- **B4 is not built**, so it moves nothing; what it would cost is in section 6.
- **Goldens:** `ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden` pass unchanged: no digest is re-baselined.

## 6. What a player meets, in numbers

**B2: how much longer a user waits after a failed Blitz Ace or Tornado.** The recovery in CTB ticks, from the real code (the fixture's Fail vectors); "before" is what the engine charged, the rank-6 recovery (the real code gives it for Banishing Blade, rank 6, at the same agility and status). The extra wait is one rank point of the user's speed:

| Agility | normal: the game | before (rank 6) | extra wait | extra under Haste | extra under Slow |
|---:|---:|---:|---:|---:|---:|
| 5 | 112 | 96 | +16 | +8 | +32 |
| 9 | 105 | 90 | +15 | +7 | +30 |
| 14 | 91 | 78 | +13 | +6 | +26 |
| 30 | 56 | 48 | +8 | +4 | +16 |
| 62 | 35 | 30 | +5 | +2 | +10 |
| 98 | 28 | 24 | +4 | +2 | +8 |
| 170 | 21 | 18 | +3 | +1 | +6 |
| 255 | 21 | 18 | +3 | +1 | +6 |

A user at agility 14 waits 91 ticks where the engine had it wait 78; under Slow, double. The other six Overdrives already cost the same on a fail and on a success (their replacement rows carry the menu row's rank). **No shipped fight fires Tornado or Blitz Ace**, so no chapter's result moves (section 5).

**B3: how often a hit's number changes.** The size of the bonus is unchanged: the factor is `1 + A / (2B)`, at most about 1.49 (Spiral Cut pressed in frame 13 gives 1.4278, frame 38 1.2889, frame 63 1.1500, frame 88 1.0111; `FFX-G01` section 5). What changes is a rounding: the old arithmetic rounded milliseconds to single precision, the game rounds seconds. Over every frame the game accepts and 64 damages from 1 to 99,999, **132 of 17,088 numbers differ (0.77 percent; 1.11 percent up to 9,999): the game's number is one lower in 103 and one higher in 29, never more than one.** A player's timed hit therefore shows a different number about once in a hundred hits, by a single point. For the headless stand-in (whole milliseconds, which are not instants the game produces) the rate is about a tenth of that (`FFX-G01` row 22: 0.08 to 0.10 percent).

**B4: what Blitz Ace would lose when the gate is settled (not built).** Blitz Ace's total at each of the four press frames the game accepts (11, 30, 31 and 50), as the engine has it now and with the eight kicks unscaled and only the finisher scaled (the mean of 300 seeds on a plain board, Tidus Strength 40 against Defense 30, through the engine's own `shapeOverdrive` and `resolveAbility`; the draws are the same in both, so the totals compare directly; scratch `b4whatif.test.ts`):

| Press frame | A (s) | factor | Blitz Ace's total now | with only the last hit scaled | drop |
|---:|---:|---:|---:|---:|---:|
| 11 | 1.633 | 1.4083 | 8,003 | 6,682 | 16.5 % |
| 30 | 1.000 | 1.2500 | 7,104 | 6,296 | 11.4 % |
| 31 | 0.967 | 1.2417 | 7,056 | 6,275 | 11.1 % |
| 50 | 0.333 | 1.0833 | 6,155 | 5,889 | 4.3 % |

The drop is largest on an early press, where the bonus is largest, and the eight kicks are 57 percent of the move's power (8 x 4 against the finisher's 24). Averaged over the four frames it is **about 11 percent** of a successful Blitz Ace's damage. The numbers are the engine's, so the effect of a real fight scales with them; the size of the drop does not.

## 7. The whole suite, once

**One run, `--maxWorkers=2`, started 20:20 EDT on commit `9458a9396` (the worktree without its paintings, as in the previous lane's run), 6,564 seconds** (1 h 49 min; the previous lane's run took 2,686 s: the machine was at about 99 percent CPU with over a hundred node processes of other agents for the whole run). `D:\Tools\ffx-parity\rc9\od-results\suite.log` and `suite.json`.

**Result: 1,270 files, 19,660 tests: 19,338 passed, 198 failed, 123 skipped, 1 todo; 1,229 files passed, 15 skipped, 26 failed.** The previous lane's run had 1,268 files and 19,626 tests; the difference is `ffx-raw-input-edge-only` (10 tests, added to that lane after its run), the five tests its mutation pass added to `parity-ffx-engine-minigames`, and this lane's new file (19 tests): 19,626 + 10 + 5 + 19 = 19,660.

**22 of the 26 failed files are the previous lane's art-only failures, file for file and test for test (182 failed tests, 5 of the files cannot load).** They fail because the paintings are not in the worktree (an ENOENT on `public/art/...`, a plate or a pause-card image that is not there, a sprite or art manifest that is missing); the previous lane showed that 21 of its 23 pass with the art linked.

| Files | Failed tests | What is missing |
|---|---|---|
| `ui-portrait-face-crop` | 145 | a face-crop row measured against a painting on disk |
| `trema-ship-content` 4, `art-ref-defaults` 4, `pause-remake` 3, `chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3, `chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2, `chapters/natus-ship-content` 2, `chapters/leblanc-art` 2, `chapters/fallen-aeons-ship-content` 2, `chapter-meta-ffx2-leblanc` 2, `cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1, `chapters/experiment-scene` 1, `chapters/den-of-woe-ship-scene` 1 | 37 | an ENOENT on `public/art/...`, an `existsSync` of a plate or a pause-card image |
| `party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta` | 5 files that failed to load | `public/art/manifest.json` or a sprite manifest |

(`ffxcam-load`, which failed the previous lane's run on a stat of `public/art`, passes here.)

**The other 4 failed files, 16 tests, are timeouts and nothing else.** `advisor-floor` (9 tests), `advisor-note` (5), `advisor-menu` (1) and `chapters/aeon-hp-2-3-bench` (1) each failed with `Error: Test timed out in 15000ms` (the bench: `180000ms`) after 15 to 141 seconds of natural play (the bench 248 seconds); the repo's per-test timeout is 15 seconds (`vitest.config.ts`) and the play-throughs ran two to twelve times slower than the same tests run alone afterwards. They are the "holds across N chapters, intended and random play" tests of the advisor, which none of this lane's files feed. **Re-run alone afterwards with the timeout lifted** (`--testTimeout=1800000`, the same code): **4 files, 74 tests, all passed (245 s), including the 16 that had timed out**; alone, the slowest of the 16 took 18 s (`advisor-floor` on Seymour Omnis; Braska's Final Aeon took 14 s, the bench 61 s) against 15 to 141 s (248 s) in the suite. They sit close to the 15 s limit even without the load, so they are flaky on a busy machine and not in this lane's reach (`advisor-floor` and `advisor-note` appear in no file of this lane). `rerun-advisor.log` and `rerun-advisor.json`.

**Nothing this lane touches failed:** the lane's 28 test files (section 13) passed in the whole-suite run, 602 tests, 0 failed; no test about a minigame, an Overdrive, Fury, the key watcher, CTB, the three goldens or the new file failed.

## 8. Disclosures, in player words (what the release should say, and what it should admit)

**FFX only**

- **A failed Blitz Ace or a failed Tornado makes the user wait as long as a clean one does.** The user pays the rank of the command that was chosen, 7 for both, whatever the grade; it was 6 for a fail, so a failed one let the user act sooner. The difference is one rank point of the user's speed: 13 ticks at agility 14, 16 at agility 5, 8 at 30, 4 at 98, 3 at 170 and above; half as much under Haste, twice as much under Slow (section 6). The other six Overdrives already cost the same on a fail and on a success. A player will see it only as a slightly later next turn after a failed Blitz Ace or Tornado.
- **Swordplay's and Bushido's time bonus is worked out in the game's own units.** The bonus is the same size (up to about +49 percent), but it is computed from the game's clock reading in seconds and single precision, so about one timed hit in a hundred shows a number one point away from before, mostly one lower. It is a rounding, not a balance change.
- **Blitz Ace's bonus still reaches all nine hits, and that is probably not the game's.** The game applies the factor only to hits its result handler recalculates; for Blitz Ace that is the last pending hit (the finisher) if the animation starts the minigame when one hit is left, which the move's own rows imply and nobody has observed. If so, a successful Blitz Ace loses 4 to 17 percent of its damage, about 11 percent on average over the four press frames (section 6). It waits on one look at the game (open item 1) and is **not changed here.**
- **What does NOT change:** the look and the keys of the three screens; Wakka's reels; Lulu's Fury (the game never switches the factor on for her); no chapter's wins; no boss number and no party number. The shipped line plays Tidus's and Auron's Overdrives through a stand-in, so a fight's numbers move only where a timed hit's rounding changes (section 5).
- **Unverified, kept as the engine's reading (said so in the notes):** a battle runs the controllers at 30 frames a second (`FFX-G01` open question 9: read on the title screen, not in a battle) and the x87 precision of the damage scale is 53 bits (open question 11); both underlie the whole timing factor and neither is new here. That Blitz Ace's recalculated hit is the last pending one is the plan's [I] (open question 4).

## 9. CHANGELOG paragraph (for the main session to paste; `CHANGELOG.md` is not edited here)

**FFX only.** A failed Blitz Ace or a failed Tornado now makes Tidus or Auron wait as long for the next turn as a clean one does (rank 7, as the game charges), where a fail let them act a rank point sooner: at agility 14 the wait is 13 ticks longer, at agility 5 it is 16, from agility 170 up it is 3, doubled under Slow and halved under Haste; the other six Overdrives already cost the same on a fail and on a success. The time bonus of Tidus's Swordplay and Auron's Bushido is now worked out from the game's own clock reading, in seconds and single precision, instead of milliseconds: the bonus is the same size (up to about +49 percent), but about one timed hit in a hundred shows a number one point away from before, usually one lower. Not changed yet: the bonus still reaches all nine hits of Blitz Ace; the game most likely applies it to the last hit only, which will take about 4 to 17 percent off a successful Blitz Ace (about 11 percent on average) once one look at the running game settles where the move's minigame starts. No boss number and no party number changed, and no chapter's result moved: none of the shipped fights fires Tornado or Blitz Ace, and 7 of 3,500 chapter runs differ at all (one hit each, one point lower).

## 10. Open items

1. **B4: where the Blitz Ace and Bushido controllers start** (`FFX-G01` open question 4, the one row still gated). It decides which hits of Blitz Ace and of the four Bushido the timing factor reaches (plan row B4). **How to settle it, cheaply:** one read-only look at the running game, already on the plan's Q12 list and not among the five cases of the 2026-10-15 live plan: with the FFX sampler on (`sampler_ffx_live.py` reads the Chr array), log for the Overdrive user, at every frame, the armed byte `Chr+0xD24` and, in each target's result record, the hits applied (`rec+0`) and the hits in total (`rec+1`); at the first frame the byte reads 1, `total - applied` is how many hits are still pending when the controller starts. One Blitz Ace and one of each Bushido answer all five (the three Swordplay moves start before the animation, by the start gate). The alternative is reading the motion data of Tidus's and Auron's actions (`chr/pc/c001/mot/resident*.mgrp` on the PS2 side, the animation container on the PC side), whose layout is unread. When it lands, Blitz Ace's damage drops 4 to 17 percent (section 6) and `execute.ts` hands the factor to the finisher only; the pin test `B4 is OPEN` is then changed on purpose.
2. **Wakka's Overdrives charge rank 3, the reel commands are rank 4 in the command table.** `shapeOverdrive` replaces the reel-set command with the resolved shot (rank 3) and `executeCommand` charges the shot's rank; by the rule this lane proved for the other Overdrives (the rank of the command in the action's first entry, stored at the first calculation and never rewritten) the user would pay the reel command's 4. Not changed: how Wakka's script replaces the command is unread (`FFX-G01` open questions 1 to 3, the Atel read), so it is an [I], and no shipped line fires Wakka's Overdrives. It is the same family as B2 and the first thing to check when the script is read.
3. **The rank rule's kernel is still imported by nothing** (`kernel/ctb.ts#actionRank`, the port of `0x7895B0`, `FFX-H01` row 3): B2 reaches the game's number for the eight Overdrives by keeping the menu row's rank; the game's rule for every other command (the rank of entry 0's ids: Doublecast, Quick Pockets, Copycat, a Mix) is the action-orchestration lane's (`FFX-H01` row 1).
4. **The headless stand-in rolls whole milliseconds, not frames** (`rollDefaultMinigame`, one draw on the `aux` stream): kept on purpose, so no stream moves and no chapter measurement changes for a reason that is not the game's. A stand-in that rolled frames would give instants the game can produce; it would change the range of the draw and move every shipped line that fires a timed move, for no player-visible gain.
5. **The two assumptions under the whole timing factor are unchanged and still [I]:** 30 controller frames a second (`FFX-G01` open question 9: read on the title screen, not in a battle) and 53-bit x87 precision (open question 11). If a battle runs another rate, `TICKS_PER_SECOND` in `kernel/minigame-timer.ts` is the one number to change.
6. **Stale research text, not rewritten:** `research/ffx-combat-core.md` sections 5.3 and 5.5 (the Blitz Ace and Tornado rows "7 (fail 6)") and `research/ffx-overdrive-input-rules-2026-09-30.md` D4 (lines 141, 205) now describe the replacement row's rank, not the user's; this note and the records' comments carry the fact.
7. **Petrified targets and the other edge cases of byte `0x16`** (`FFX-G01` open question 6) stay unmapped; they belong to B1 (RC4) and were not touched.
8. **No pictures, no screen work:** the three overlays and every screen are the release driver's and are untouched; this lane changes numbers and a turn order, not a look.

## 11. Findings now wired, and findings still only decompiled (the three states)

| Finding (`FFX-G01`, `FFX-H01`) | Decompiled | Wired (this branch) | Live |
|---|---|---|---|
| The user's recovery after an Overdrive is the menu command's rank whatever the grade (Tornado and Blitz Ace 7 on a Fail) | yes (emulated, `FFX-H01` 3.5; reproduced here) | yes | not yet (not merged) |
| The timing factor is built from float32 seconds, `A = float32(B - frame / 30)` (Swordplay, Bushido) | yes (emulated) | yes | not yet |
| The same for Wakka's reels (the floats his script passes) | no (Atel script unread) | no, milliseconds as before | no |
| Which hits the factor reaches: all hits of the three Swordplay moves | yes (they start before the animation) | yes (the engine already scaled every hit) | already true |
| Which hits the factor reaches: Blitz Ace's last hit only; Bushido | the arithmetic yes, the animation start no | **no** (gated; the engine scales every hit) | no |
| The rank of Wakka's reel commands as the user's recovery | the rule yes, the reel flow no | no | no |

## 12. Decisions for Bailey

1. **Take the Blitz Ace and Bushido start look in the next live session** (the one observation of open item 1: read-only, five moves). Recommendation: yes; it closes the last gated row of lane FFX-B, and Wakka's rank follows from the same kind of read (the Atel script). Until then B4 stays out.
2. **When B4 lands, accept the drop in Blitz Ace's damage** (4 to 17 percent, about 11 percent on average) as the game's. It is a visible numbers change in Tidus's signature move; it is the parity Bailey ordered ("It needs to be a 1:1 parity."), so the recommendation is yes, disclosed in the release notes the day it ships.
3. **Keep the headless stand-in in milliseconds** (open item 4)? Recommendation: yes. Rolling frames instead would make its instants game-reachable but would move every shipped timed Overdrive for no gain a player sees.

## 13. Re-run

From the worktree root, Git Bash, tools by path, `TEMP` and `TMP` on `D:`:

```
export TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx-engine-od-results.test.ts tests/unit/ffx-overdrive-fail-rows.test.ts tests/unit/ffx-blitz-ace-finisher.test.ts tests/unit/ffx-bushido-fail-no-rider.test.ts tests/unit/ffx-bushido-fail-bonus.test.ts tests/unit/ffx-swordplay-miss-restart.test.ts tests/unit/parity-ffx-minigames.test.ts tests/unit/parity-ffx-engine-minigames.test.ts tests/unit/parity-ffx-frame-driver.test.ts tests/unit/ffx-raw-input-edge-only.test.ts tests/unit/ffx-bushido-wrong-press-reset.test.ts tests/unit/ffx-overlay-input.test.ts tests/unit/ffx-overdrive-inputs.test.ts tests/unit/ui-ffx-minigames.test.ts tests/unit/ffx-formulas.test.ts tests/unit/ffx-engine.test.ts tests/unit/ffx-bushido-immune-rows.test.ts tests/unit/parity-ffx-engine-overdrive-result.test.ts tests/unit/parity-ffx-overdrive-result.test.ts tests/unit/parity-ffx-overdrive.test.ts tests/unit/ffx-overdrive-menu-rows.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts tests/unit/parity-ffx-engine-wiring.test.ts tests/unit/parity-ffx-modifiers.test.ts tests/unit/parity-ffx-engine-ctb-status.test.ts tests/unit/parity-ffx-ctb.test.ts
node tools/orphans.mjs
```

The mutation pass is `node D:/Tools/ffx-parity/rc9/od-results/mutate.mjs <worktree> D:/Tools/ffx-parity/rc9/od-results/mutants.mjs <out.json>` from any directory (`CHECK=1` only validates the fault strings; `ONLY=R04,T09` runs some; every file is put back byte for byte).

The vectors are regenerated from the game's code by the lane's `gen_od_results.py` (scratch, not committed: it needs the private harness and the exe copy; run with the harness venv, `D:\Tools\ffx-parity\venv\Scripts\python.exe -I gen_od_results.py <out_dir>`, about 4 seconds). The gate's reproduction is `rerun_sweep_b.py` (the same venv, 17 seconds). The measurement is the FFX-A lane's `census.test.ts` with `PYREFLY_CENSUS_SEEDS` and `PYREFLY_CENSUS_CHAPTERS` (the copy in `D:\Tools\ffx-parity\rc9\od-results\`, run with its `vitest.scratch.config.mjs`); the ablation is `ablate.mjs`; the Blitz Ace what-if is `b4whatif.test.ts`.
