# Handoff: advisor v4 (look-ahead search in a Web Worker, FFX)

Branch `advisor-v4` (worktree `D:/pyrefly-advisor-v4`), **not merged**. 2026-09-28.
Method check and prototype numbers: [docs/plans/advisor-v4-method-check.md](../plans/advisor-v4-method-check.md).

> **Bailey, 2026-09-27:** *"the advisor needs to be WAY WAY smarter please"*.
> **Bailey, 2026-09-28** (D-272): "all your recommendations" = advisor v4 as a background search, FFX first.

## Where it stands

**SWITCHED ON for FFX at the mini budget on every device, 2026-09-29** (`ADVISOR_V4_FFX = true`; see "SWITCHED ON" at the end). The paragraph below is the earlier state (built, measured, left OFF), kept for history.
Gate: every FFX chapter equal or better than v3 through the worker path, and the menu-open latency
does not grow. The latency passes, and falls. The scorecard fails by one seed in three chapters, at the budget
that runs them:

| Blocks the switch | Budget (where it runs) | v3 | v4 |
|---|---|---:|---:|
| **II Yunalesca** | lean (desktop) | 37/40 | 36/40 (+3 / −4 seeds) |
| **VIII Evrae** | lean (desktop) | 40/40 | 39/40 (seed 19) |
| **X Seymour Natus** | mini (phone) | 38/40 | 37/40 (+1 / −2 seeds) |

Everything else is equal or better. Totals: **lean 339/360, mini 338/360, v3 310/360**. Each
blocking gap is one run in forty, and the other budget scores the same chapter the other way (II
mini 38, VIII mini 40, X lean 39). They read as noise at 40 seeds. The rule is literal, though, so
the switch stays off until Bailey or the driver decides (Open, 1).

**Update 2026-09-29 (see DECISION at the end):** seeds 41 to 80 clear every win gate at both
budgets, but the fork-tested Chapter III reading fails at lean (2 real lethal-save deaths against
v3's 0, all on seed 35). The switch stays OFF.

**Game case (rule 14): FFX only.** CTB fixes the next menu's board at the press, and the search
runs while the turns animate [research/ffx-combat-core.md §1.1]. FFX-2 stays on v3
(`ADVISOR_V4_FFX2 = false`): its window, a girl's time on the top list, is unmeasured (method check
§6.6). The coach-wrapper getter below is shared plumbing, but only the FFX wiring reads it.

## What was built (514b7e0b, 6e398cfa)

- `src/battle/ffx/engine.ts` + `engine-end.ts`: the facade split under 400 lines, unchanged logic
  (a golden log test covers every FFX chapter). `FFXEngine.transferable()` / `restore()` pass the battle to the worker as plain data.
- `src/engine/tactics/advisor-v4/`: the prototype search as a generator. `LEAN` (desktop: 4
  futures, 2 ranked rows, confirm 8), `MINI` (phone: 2, 1, confirm 4). Counts, never a clock.
- `src/app/advisorV4/`: the host pre-starts a search at each `init` and `submit` (not while an
  Overdrive picker waits). The worker restores the copy, plays on to the next menu, computes v3's
  card and searches. The card reads the answer once at menu open for that exact board (`boardKey`),
  or else shows v3's card. A search is cancelled on menu close; 15 s cap; a silent worker is killed.
- `src/ui/common/MoveAdvisor.ts`: reads the look-ahead once at menu open. No thinking state, no flip (rule 9).
- The switch also reads `globalThis.__pyreflyAdvisorV4Force` (measurement only, read once per battle;
  nothing in the game sets it).

## Fixed during this measurement

- **v4 could never switch on in the real game.** `BattleScreen` passes `attachAdvisorV4` its
  `this.hud`, which is always the coach wrapper (`CoachedHud`), and the wrapper had no
  `moveAdvisor`. The duck-typed probe found nothing, so the look-ahead stayed off whatever the
  switch said. The unit tests used a bare owner. The browser run on the production build found it:
  the wrapper hole of PR-0090, PR-0122 and PR-0157, a fifth time. Fix: a forwarding getter in
  `src/ui/coach/CoachLayer.ts`. `tests/unit/advisor-v4-coach-wrapper.test.ts` checks that the
  game's own `createHud('ffx')` exposes the card and that `attachAdvisorV4` attaches through the wrapper.
- `tests/unit/results-withdrew.test.ts` read the stalemate line from `engine.ts`. The split
  moved it to `engine-end.ts` (text unchanged), and the test now reads that file.

## 1. Scorecard through the worker path (40 seeds, every FFX chapter)

`critic/bench/advisor-v4/worker-path.test.ts`: the live engine with `attachAdvisorV4`, a pre-start at
every `init` / `submit`, every message `structuredClone`d into the real worker core, and the card
read at menu open. The v3 column reproduces main's 310/360 exactly. Node lets every search
finish, so this is v4's card whenever it is ready; §2 measures how often it is ready in a browser.
`node critic/bench/advisor-v4/wp-table.mjs lean|mini`.

**Lean (desktop)**

| Ch. | v3 | v4 | +/− seeds | Lethal-save miss v3→v4 | Missed revive v3→v4 | Top row switched | Worker ms p50/p95 | |
|---|---:|---:|---|---|---|---|---|---|
| I | 19 | 37 | +18 / −0 | 0 → 0 | 398 → 479 | 2.3 % of 1937 | 81 / 155 | better |
| II | 37 | 36 | +3 / −4 | 0 → 0 | 4 → 5 | 3.1 % of 6873 | 161 / 363 | **worse** |
| III | 39 | 39 | +1 / −1 | **1 → 9** | 8 → 1 | 1.2 % of 8270 | 293 / 838 | equal |
| VII | 37 | 38 | +1 / −0 | 21 → 19 | 16 → 5 | 2.0 % of 1956 | 59 / 121 | better |
| VIII | 40 | 39 | +0 / −1 | 0 → 0 | 1 → 8 | 1.5 % of 2751 | 54 / 114 | **worse** |
| IX | 40 | 40 | 0 / 0 | 2 → 1 | 2 → 2 | 0.7 % of 708 | 92 / 188 | equal |
| X | 38 | 39 | +2 / −1 | 0 → 1 | 1 → 0 | 5.5 % of 2029 | 55 / 165 | better |
| XII | 25 | 33 | +14 / −6 | 14 → 2 | 188 → 143 | 7.3 % of 4525 | 145 / 463 | better |
| XIV | 35 | 38 | +4 / −1 | 0 → 0 | 0 → 0 | 3.3 % of 1363 | 32 / 75 | better |
| **All** | **310** | **339** | | | | 3.1 % of 30,412 | | |

**Mini (phone)**

| Ch. | v3 | v4 | +/− seeds | Lethal-save miss v3→v4 | Missed revive v3→v4 | Top row switched | Worker ms p50/p95 | |
|---|---:|---:|---|---|---|---|---|---|
| I | 19 | 37 | +18 / −0 | 0 → 0 | 398 → 549 | 2.5 % | 28 / 55 | better |
| II | 37 | 38 | +2 / −1 | 0 → 0 | 4 → 7 | 1.2 % | 59 / 123 | better |
| III | 39 | 40 | +1 / −0 | 1 → 0 | 8 → 0 | 1.0 % | 111 / 292 | better |
| VII | 37 | 38 | +1 / −0 | 21 → 19 | 16 → 7 | 1.7 % | 23 / 46 | better |
| VIII | 40 | 40 | 0 / 0 | 0 → 0 | 1 → 0 | 0.2 % | 22 / 44 | equal |
| IX | 40 | 40 | 0 / 0 | 2 → 2 | 2 → 2 | 0.1 % | 34 / 63 | equal |
| X | 38 | 37 | +1 / −2 | 0 → 0 | 1 → 0 | 2.0 % | 21 / 51 | **worse** |
| XII | 25 | 30 | +9 / −4 | 14 → 18 | 188 → 128 | 5.3 % | 51 / 164 | better |
| XIV | 35 | 38 | +3 / −0 | 0 → 0 | 0 → 0 | 1.8 % | 11 / 24 | better |
| **All** | **310** | **338** | | | | 1.8 % of 29,741 | | |

- Lethal-save miss is the v3 scorecard's arithmetic reading (method check §4.1). It went up only
  on III at lean (1 → 9) and XII at mini (14 → 18). v4 never moves a top row whose own facts carry
  the proof, so those misses are v3's rows on the other boards that v4's runs reach. The bench does not split the two cases.
- Evrae seed 19 (lean): three times v4 put Cheer or Focus above v3's Al Bhed Potion while Lulu
  was at 279 to 348 HP. It lost at decision 82; v3 won at decision 70. By the reading this is not a lethal-save miss.

## 2. Browser timing on a production build

`browser-timing.mjs`: `vite build` + `vite preview` on port 7900, headless Chromium
(`PYREFLY_BROWSER=gpu`), real keys (Enter on the first row and on its target). Runs: I on seeds 1 to 4, and XII, II
and III on seed 1, each with v4 forced on and off. Menu open = the wall time of `MoveAdvisor.showDecision`.
Frames = every rAF delta. Raw files: `critic/bench/advisor-v4/results/browser/`; table:
`node critic/bench/advisor-v4/browser-table.mjs critic/bench/advisor-v4/results/browser`.

| Size | v4 | Menus | Ready at menu open | Menu open ms p50 / p95 / max | Frames > 34 / > 50 ms | Worker ms p95, worst run |
|---|---|---:|---|---|---|---:|
| 1600x900 | off | 62 | - | 6.8 / 22.8 / 25.4 | 36 / 26 of 19,593 | - |
| 1600x900 | on | 62 | **62/62 (100 %)** | **1.0 / 3.7 / 8.5** | 38 / 30 of 19,595 | 645 |
| 390x844, 4x CPU | off | 62 | - | 35.8 / 128.0 / 166.0 | 222 / 144 of 19,583 | - |
| 390x844, 4x CPU | on | 62 | **62/62 (100 %)** | **4.2 / 52.4 / 60.1** | 184 / 98 of 19,615 | 264 |

- Ready at menu open: 100 % at both sizes. A finished answer waited 1.6 to 8.6 s at the median
  before its menu opened; the tightest window was 0.56 s (II, desktop) and 0.81 s (XII, phone).
- Menu-open latency does not grow. It falls, because a ready card skips v3's own computation.
- Frame time is unchanged on desktop and better on the phone. Main-thread cost per job is the
  copy handed to the worker: 1.3 to 2 ms at p95.
- One phone run (I, seed 4, on) was slow over the whole battle, searching or not: machine
  contention. The rerun gave 25 / 13 long frames with v4 on and 26 / 14 with it off. The rerun is pooled, and the contended files are in `results/browser/outlier/`.
- **Caveat:** the worker's CPU throttle is unproven. The CDP call to each worker target reports
  success, but the phone worker's times look unthrottled. Scaled 4x by hand, the worst job (about
  1.06 s) would miss the tightest window (0.81 s). On a real phone, a few menus in long fights may
  fall back to v3's card, and that fallback is safe.

## 3. Real keys, Chapters I and XII, both sizes

`real-keys.mjs` (v4 forced on): at each menu it reads the card at open and again 1.5 s later, then
saves a frame (`docs/screenshots/advisor-v4/`, readings in `results/real-keys/`).

| Ch. | Size | Menus | v4 ready | Identical after 1.5 s | Errors | First top row |
|---|---|---:|---:|---|---:|---|
| I | 1600x900 | 3 | 3/3 | yes | 0 | **Slow → Seymour Flux** (lean) |
| I | 390x844, 4x | 3 | 3/3 | yes | 0 | Hastega → the party (mini keeps v3's row here) |
| XII | 1600x900 | 4 | 4/4 | yes | 0 | Switch Wakka, then Armor Break → Omnis |
| XII | 390x844, 4x | 4 | 4/4 | yes | 0 | Switch Wakka, then Armor Break → Omnis |

The desktop card starts collapsed, so the frames show the menu and Auron's first-use line. The phone
shows the card's line in the TIP strip. Enter on the first row is not the card's line, so these runs
lose early: they check the card, not the play.

## Slow on Seymour Flux: source conflict (labelled, data unchanged)

Chapter I's gain (19 → 37) comes almost entirely from Slow on Seymour Flux on the first menu.
**`research/ffx-seymour-flux.md` §1.3 lists Slow both ways**: "Slow | 255 | Immune", and in the row
"Haste / Slow / Shell / Protect / Reflect / Regen / Scan / NulAll | 0 | Landable". Both are
`[decompiled]`. The engine lands Slow. **No data changed** (rule 6). It needs the Steam HD
Remaster check (with Bailey's OK to take the screen). If Slow does not land, the Chapter I gain
goes, and the card would be recommending a move that fails.

## Checks run

- `tsc --noEmit` clean; `typecheck:e2e` clean; `orphans`: 24, the same as main, none in v4's folders.
- Full `npm test`: 2 of 622 files failed. `results-withdrew` is fixed above.
  `strategy-ffx2-bahamut` (FFX-2, untouched) timed out at 15 s under load and passes alone (19/19).
  The suite ran twice, once more than the brief allowed: the second run only listed the failing names.
- The v4 unit files, the new coach-wrapper test and the coach tests pass.

## Open

1. **The switch is Bailey's or the driver's call.** (a) Keep it off and run seeds 41 to 80 on II,
   VIII and X. (b) Accept gains that are within noise and switch it on (lean 339, mini 338, v3 310). (c) Run lean on phones if a
   real-phone window allows it (§2 caveat).
2. The Steam check on Slow and Seymour Flux.
3. III lethal-save reading 1 → 9 at lean: run a fork-tested reading (v3 §6b) before switching on.
4. FFX-2: measure its window in the browser first.
5. Run `critic-plan --paths` before any release (the advisor, the presenter wiring, the coach wrapper).

## Re-run

```
V4W_CHAPTERS=<id> V4W_BUDGET=lean|mini V4W_TAG=wp-<budget>-<id> node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/worker-path.test.ts
node critic/bench/advisor-v4/wp-table.mjs lean
node critic/bench/advisor-v4/browser-timing.mjs --url=http://127.0.0.1:7900/pyrefly-reprise/ --chapter=seymour-flux --v4=on --viewport=390x844 --throttle=4 --decisions=24 --seed=1 --out=<json>
node critic/bench/advisor-v4/real-keys.mjs --url=http://127.0.0.1:7900/pyrefly-reprise/ --chapter=seymour-omnis --viewport=1600x900 --menus=4 --force=on --shots=docs/screenshots/advisor-v4
```

## CHECK (adversarial, 2026-09-29; a different agent, not the builder)

Checked on 007ea041, switch as committed (`ADVISOR_V4_FFX = false`). Production build of this
worktree, `vite preview` on port 7910, headless Chromium (`PYREFLY_BROWSER=gpu`), real Enter keys.
Round 15's bench and one browser ran side by side, so absolute timings carry contention; every
on/off comparison below was rerun where it looked odd. **Verdict: no blocker.** The switch stays off
for the reason the builder gives (II and VIII at lean, X at mini, each one seed below v3).

**Scorecard reproduces exactly.** Both budgets, every FFX chapter, 40 seeds, v3 and v4 through the
worker path (`V4W_TAG=chk-wp-lean|mini`): every field of every row (wins, win seeds, links,
decisions, v4 shown, switched, not ready, lethal-save misses, savable, missed revives, off-menu, bad
aim, refused) is identical to the builder's `wp-<budget>-<chapter>.json`. Lean 339/360, mini
338/360, v3 310/360. The gate still fails on II lean (36 vs 37), VIII lean (39 vs 40), X mini (37 vs 38).

**The battle is untouched (rule 1).**
- Node, 10 runs (all nine FFX chapters on seed 1, Evrae on seed 19, plus XII on seed 2; X and the
  XII seed-2 run at mini, the rest at lean),
  pressed by v3's top row with v4 attached through the in-process worker and without: the event log
  per link and the final RNG position are identical, and the live state, runtime and RNG hash taken
  before and after each menu-open read changed at 0 of 848 menus.
- Browser: 12 chapter/size groups (nine FFX chapters at 1600x900; I, II and XII at 390x844 with 4x
  CPU), each played with v4 off, on, and late (see below) by the same keys: the battle log hash and
  `nextSeq` are identical across all three in every group. The cancel runs below also end on the
  off run's log.
- The facade split: the pre-split `engine.ts` from cf3306eb, run beside the split one on the nine
  FFX chapters x seeds 1 to 5 by the chapter's line, gives identical logs and RNG at every link
  (45/45), and so does the split engine hopped onto `restore(structuredClone(transferable()))`
  every third menu.

**The card never flips while a menu is open (rule 9).** The card's rows and text were read every
animation frame while each menu was open: 45 browser runs, 441 menus, 0 row changes. 93 of those
menus had a worker answer land while they were open (the late runs hold menus 7 s and delay answers
9 s): none changed the card. The text changes the poller saw are the card's own density fitting and
guide badge. They are the same with v4 off.

**The menu never waits, and the fallback is exact.**
- Late runs (the worker's answers delayed 9 s, a slow phone): ready fell to between 0 and 4 menus per run,
  and on the 99 menus where the answer was not ready, the card's rows equal the v4-off run's rows
  on the same board, 99/99.
- Node: every card v4 handed over without a switch equals v3's card built on the live board
  (JSON-equal), 805/805.
- Menu open (`showDecision` wall ms, p50 / p95, my runs): desktop off 7.2 / 24.6, on 1.2 / 4.5, late
  6.7 / 14.4; phone off 55.2 / 146, on 5.8 / 127.6. Phone late read 34.7 / 309.5 in one contended
  burst. Rerun, it read 31.6 / 54.8 and 48.4 / 97.5 against off 42.2 / 64.4. The host's own
  `cardFor` is at most 7.8 ms, and 1.5 ms or less on all but one menu. So a late answer costs the
  menu nothing measurable, and a ready one makes it faster.
- The builder's `browser-timing.mjs` (II and XII, seed 1, both sizes, on and off): desktop menu p95
  7.0 to 1.5 ms (II) and 15.5 to 2.0 ms (XII); long frames (> 34 ms) 4 vs 5 and 10 vs 5. Phone
  menu p95 63.5 to 6.9 ms and 60.3 to 18.5 ms. Phone long frames: 98 off vs 82 on (II). XII's
  first on run read 272 against 60 off, with the worker's p95 at 444 ms, a contended run. Two
  interleaved reruns read 21 and 22 on against 30 and 42 off.

**Cancelled when the menu closes.** Every close with a job running posts `cancel` (24 in the late
runs). With the job's start delayed 2.5 to 4 s and the menus pressed at once (III twice, II once),
22 jobs were cancelled. The worker answered `cancelled` 21 to 160 ms after the cancel when it came
mid-search, and 0.4 to 3.9 s after when it came before the delayed job arrived. Nothing from a
cancelled job reached a card, one worker served each whole run, and the log equals the off run.

**Rails.** Across the node runs, 43 switched cards were checked. Each top row is an enabled row of
that menu aimed at a target it offers (43/43). None replaced a v3 top row carrying
`saves-from-lethal` (0), none replaced a v3 revive (0), and none lifted a revive that
`reviveRisk` (Bailey's refusal rule) refuses (0). FFX has nothing in flight, so that rail cannot
fire. FFX-2 and FF7: `attachAdvisorV4` returns null even with the force flag set (Bahamut,
LeBlanc, Ixion), as it does for an FFX engine labelled `ffx2`. The `lift` path in
`buildAdvisorView` is gated on `given.lift`, which only the worker passes. With the committed
switch and no force, a real Chapter I battle has no host, and v3's card shows (Hastega).

**Also run.** `tsc --noEmit` clean. The v4 unit files, the coach wrapper, purity, golden, fork and
`results-withdrew` tests pass (41/41), and so do all 16 coach and move-advisor files (142/142).
`strategy-ffx2-bahamut` passes alone (19/19). `orphans`: 24, none in v4's folders. The full suite
was not run: the one change here is this section.

### Findings (none blocks; the switch decision is unchanged)

1. **The 4x throttle never reaches the worker (confirmed).** The same II phone run's worker read p50
   58 / p95 96 ms at throttle 1 and 60 / 121 ms at throttle 4, while the page slowed about 5x. The
   "62/62 ready on the phone" figure is an unthrottled worker. On a real slow phone, readiness is
   unmeasured. The late runs show what happens when an answer is late: v3's card exactly, with no
   flip and no slower menu. A real phone also runs the worker on a CPU the page shares, which no
   run here reproduces.
2. **A cancelled or superseded job still pays its whole prelude.** `V4Core.run` checks `stop()`
   only inside the search loop, so a job the host has already cancelled still restores, plays on
   to the menu, builds v3's card and its candidates before it notices. Replies came 0.4 to 0.85 s
   after some cancels. It is worker time only and never reaches a card, but on a phone it delays
   the next job. A `stop()` check before the restore and after the advance would end it.
3. **The same board can show a different card at a second opening.** If the first opening misses
   (v3's card) and the menu reopens after the search lands (for example, backing out of an
   Overdrive picker), the second opening shows v4's card. The host documents this. It is not a
   flip while open, but rule 9's spirit may want the first answer kept for that board.
4. **The lifted row is never one of v3's shown rows.** It was off v3's shown list at all 43 switches
   (for example Hi-Potion to Dragon Fang, Curaga on another target, NulTide to NulBlaze). It is
   always a row v3 priced and a real menu row, so this is on-rail. Still, the card then
   recommends a move the v3 card never showed, which a reviewer of the card's wording should know.
5. **Small leaks.** `V4Core.cancelled` keeps every cancelled job id (it is cleared only on
   success). `globalThis.__pyreflyAdvisorV4` keeps the last host, and its engine, after the HUD
   unmounts.
6. **The press costs main-thread time.** Each press clones the whole battle, log included, into
   the worker. It took 0.2 / 0.4 ms (p50 / p95) on desktop and 1.7 / 5.3 ms, at most 13.5 ms, on
   the 4x phone. That cost is small but grows with the fight's log.

Scratch (untracked, not committed): `.v4chk-browser-tmp.mjs` (the tapped-worker, per-frame
poller), `critic/bench/advisor-v4/zz-chk.tmp.test.ts` (purity, card identity, rails, split),
`critic/bench/advisor-v4/results/chk-wp-{lean,mini}.json`. Raw browser readings are in
`D:/Tools/pyrefly-scratch/v4chk/`.

## DECISION (2026-09-29): the switch stays OFF, on Chapter III's fork-tested lethal saves at lean

**Rule (the driver's brief).** Switch `ADVISOR_V4_FFX` on only if, at both lean and mini, every
FFX chapter's pooled wins are at least v3's (80 seeds for II, VIII and X; the 40-seed rows
elsewhere), **and** the fork-tested Chapter III lethal-save deaths are not more than v3's.

**Wins: the gate passes at both budgets.** Seeds 41 to 80 on II, VIII and X
(`results/wp41-lean-<id>.json`, v3 and v4; `results/wp41-mini-<id>.json`, v4; v3 has no budget, so
its lean row is its only row), pooled with seeds 1 to 40:

| Ch. | v3 1-40 + 41-80 | v4 lean | v4 mini | |
|---|---:|---:|---:|---|
| II Yunalesca | 37 + 33 = **70/80** | 36 + 36 = **72/80** | 38 + 33 = **71/80** | pass |
| VIII Evrae | 40 + 38 = **78/80** | 39 + 40 = **79/80** | 40 + 40 = **80/80** | pass |
| X Seymour Natus | 38 + 36 = **74/80** | 39 + 38 = **77/80** | 37 + 37 = **74/80** | pass (mini equal) |
| I, III, VII, IX, XII, XIV (40 seeds) | as §1 | every row >= v3 | every row >= v3 | pass |

Seeds 41 to 80 also showed v4 lean's arithmetic lethal-save misses 0 → 2 on X (v3 0) and none
elsewhere; missed revives at lean fell on II (8 → 4) and X (7 → 0), VIII 0 → 0. The one-seed deficits of §1 were noise.

**Chapter III lethal saves, fork-tested: the gate fails at lean.**
`critic/bench/advisor-v4/lethal-fork.test.ts` (v3 method check §6b ported to CTB: at every decision
the arithmetic flags, fork the live engine and press the pick and every saving row on v3's 4
`provedSave` seeds and on the real RNG stream, to the end of the first enemy action). Seeds 1 to 40;
the runs reproduce the worker path exactly (wins 39 / 39 / 40 and 1 / 9 / 0 flags).
Files: `results/fork-lean-iii.json` (v3 and v4 lean), `results/fork-mini-iii.json` (v4 mini).

| III | Wins | Flagged (arithmetic) | Fork-tested misses | Real deaths with the pick | ...that a saving row avoids | Seed deaths pick / best save |
|---|---:|---:|---:|---:|---:|---|
| v3 | 39/40 (lost 17) | 1 | 0 | **0** | 0 | 0 / 0 |
| v4 lean | 39/40 (lost 35) | 9 | 3 | **2** | 1 | 11 / 3 |
| v4 mini | 40/40 | 0 | 0 | 0 | 0 | 0 / 0 |

All nine v4 lean flags are one run: seed 35, decisions 301 to 320, Yuna threatened, and the
seed v4 loses. At decision 302 Auron's pick is Attack on the Aeon; on the real stream Yuna dies,
and Hi-Potion on Yuna (an enabled row of that menu) keeps her alive on that same stream and on all 4 seeds
(pick 2 deaths of 4). At 311 and 314 (Lulu's Doublecast, then Hi-Potion on Lulu) the seeds kill
her 2 and 3 times of 4 against 0 for Hi-Potion on Yuna. At 318 she dies on the real stream
whichever row is pressed. So the arithmetic over-counted (9 flags, 3 fork-tested misses), but
the misses are real: v4 lean lets a savable girl die where v3 lets none die. Mini has none.

**Outcome: OFF** (`ADVISOR_V4_FFX = false`, unchanged). Failing chapter and number: **III at
lean, fork-tested real deaths 2 against v3's 0** (fork-tested misses 3 against 0). Every win
gate passes. Game case: FFX only.

What would clear it (not built; each needs the driver's yes): a v4 rail that never lifts a row
over a v3 row carrying `saves-from-lethal` when the forecast names a girl, at the whole-card
level, not only when v3's top row itself carries the proof (not yet checked: whether v3's top row
on seed 35's flagged boards was a save); or ship mini's settings on desktop too (mini passes every gate here).
Re-run: `V4F_BUDGET=lean V4F_TAG=fork-lean-iii node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/lethal-fork.test.ts`.

## SWITCHED ON (2026-09-29): `ADVISOR_V4_FFX = true`, mini budget on every device

**Game case: FFX only.** FFX-2 stays on v3 (`ADVISOR_V4_FFX2` off; its window is unmeasured). The
wiring change (budget) is shared plumbing but only FFX battles reach it. FF7 never attaches.

**The rule and the decision (the driver, from the DECISION above).** Lean failed the rule on one
number: Chapter III seed 35, fork-tested savable deaths 2 against v3's 0. Mini passed every gate:
pooled wins II 71 vs v3 70, VIII 80 vs 78, X 74 vs 74, every other chapter >= v3 at 40 seeds
(total 338 vs v3's 310), Chapter III fork-tested 0 flagged, 0 deaths. Lean's total is only one win
higher (339), so lean's extra reach buys almost nothing and costs the one failed gate. Hence mini on
desktop and phone alike.

**What changed.**
- `src/engine/tactics/advisor-v4/switch.ts`: `ADVISOR_V4_FFX = true`.
- `src/app/advisorV4/wiring.ts`: the budget is the constant `GAME_BUDGET = 'mini'`, not
  phone-versus-desktop (the `onPhone()` probe and its import are gone). A bench still passes
  `{ budget: 'lean' }` in the options (`options` is spread after the default) and labels the run lean.
- Tests: new `tests/unit/advisor-v4-switch.test.ts` pins FFX on, FFX-2 and FF7 off, a bench override
  cannot turn FFX-2 on, and the budget is `mini` on a desktop, a phone layout and a coarse pointer,
  with `lean` still selectable. `advisor-v4-coach-wrapper.test.ts`: the old "off stays off, no force"
  test pinned the switch's old value, so it now pins the override (`false` leaves v3's card) and a new
  test pins that no override attaches v4 through the wrapper. The card and purity tests already passed an explicit budget.

**Proof on a headless production build** (`vite build` to `D:/Tools/pyrefly-scratch/overnight-0929/v4on/dist`,
`vite preview` on port 8500, PYREFLY_BROWSER=gpu, real Enter keys, 2 s dwell per menu, no override
set so the shipped switch decides; raw JSON in `D:/Tools/pyrefly-scratch/overnight-0929/v4on/runs/`, scratch
scripts `.v4on-browser-tmp.mjs` and `.v4on-agg-tmp.mjs`, untracked). Blind Enter loses these fights
fast, so menus are pooled over seeds 1 to 6 per chapter; every seed was played with v4 on (default) and
forced off.

| 1600x900 | Menus | v4 attached (coach wrapper, budget) | Ready at menu open | Log hash on = off | Rows changed after open |
|---|---:|---|---:|---|---:|
| I (seymour-flux) | 27 | yes, mini | 27/27 | 6/6 seeds | 0 |
| III (braskas-final-aeon) | 75 | yes, mini | 75/75 | 6/6 seeds | 0 |
| XII (seymour-omnis) | 93 | yes, mini | 93/93 | 6/6 seeds | 0 |
| **all** | **195** | | **195/195 (100 %)** | **18/18** | **0** |

- Menu-open latency (`showDecision` wall time): v4 on p50 / p95 / max **0.8 / 3.4 / 5.1 ms**; v3
  (forced off) 4.9 / 17.1 / 23.9 ms. Not above v3's at p95: about a fifth of it.
- The card after open: the rows never changed on any of the 195 menus (0 flips), and no v4 answer
  arrived after a menu opened. The card's text does change once at every menu, when the detail lines
  fold away after the dwell; that is v3's own behaviour: 153 of 195 opens with v4, 151 of 195 with v4
  off. Nothing depends on the search.
- Battle log hash (FNV over the whole log) and `nextSeq` identical on/off on 18 of 18 seed runs (3 chapters x 6 seeds).
- 0 console or page errors in any run.

| 390x844, 4x CPU (page and worker throttled) | Menus | Ready at open | Log hash on = off | Rows changed | Open ms p50 / p95 |
|---|---:|---:|---|---:|---|
| I (seeds 1 to 6) | 27 | 27/27 | 6/6 | 0 | on 5.1 / 51.2; off 36.5 / 98.5 |

Budget mini, card text unchanged after open on all 27 menus, 0 errors.

**Checks.** `tsc --noEmit` and `typecheck:e2e` clean; the advisor v3, v4 and card unit files pass (38
files); `tools/orphans.mjs` lists 24 modules, none in the advisor; the full suite passes except one
timeout in `strategy-ffx2-bahamut.test.ts` (an FFX-2 simulation, 15 s limit, run while the machine was
loaded by other agents), which passes alone (19/19).

**Still true.** The advisor never touches the battle's state or RNG (the purity tests and the hash
rows above); the card never flips while a menu is open (0 flips); a search that is late or absent
leaves v3's card. Seed 35 on Chapter III at lean remains the known case if lean is ever wanted.

**Not done (each needs the driver or Bailey):** no deploy, not merged, not pushed. A release needs the
critic plan (`node tools/critic-plan.mjs`) and the deep review the release rules ask for; the change
touches the advisor card in every FFX chapter.

## CHECK of the switch-on (2026-09-29; an independent agent, not the builder of f5984206)

**Verdict: no blocker.** Game case: FFX only (FFX-2 confirmed still on v3). Nothing pushed, merged or deployed.

**Static.** `tsc --noEmit` and `tsconfig.e2e.json` clean. Advisor unit files (`tests/unit/advisor*`,
`ffx2-advisor*`, `guide-advisor*`, `tactics-lookup`, `ui-move-advisor`): 39 files passed, 1 skipped,
380 tests. `switch.ts` reads `ADVISOR_V4_FFX = true`, `ADVISOR_V4_FFX2 = false`; `wiring.ts` passes
`GAME_BUDGET = 'mini'` with no device probe.

**Bench reproduction (mini, worker path, v3 and v4).** The recorded 40-seed files reproduce seed by
seed. Slices were picked to contain losses, so they can tell the two drivers apart:

| Slice | v3 win seeds now = recorded | v4 win seeds now = recorded | Other |
|---|---|---|---|
| II, seeds 1-10 and 21-30 | yes (lost 26, 30) | yes (lost 26, 29) | |
| III, seeds 1-10 and 11-20 | yes (lost 17; its 1 lethal flag reproduces) | yes (10/10, 0 lethal flags) | |
| VIII, all 40 seeds | yes, 40/40, decisions 2708 = 2708 | yes, 40/40, decisions 2718 = 2718 | revive misses 1/1 and 0/0 |

Files: `critic/bench/advisor-v4/results/zz-chk2-mini-*.json` (untracked scratch).

**Browser, fresh production build of f5984206** (`vite build` to
`D:/Tools/pyrefly-scratch/overnight-0929/v4chk2/dist`, `vite preview` on 8501, stopped by PID),
headless Chromium, PYREFLY_BROWSER=gpu, real Enter keys, 1.6 s dwell per menu. Every seed was played twice:
with no override (the shipped switch decides) and with `__pyreflyAdvisorV4Force = false` (v3).
My own script (`.v4chk2-browser-tmp.mjs`, untracked) counts, for each menu, the host's `ready` change
inside `showDecision`, polls the card's rows and text every frame while the menu is open, and taps
the advisor worker's messages.

| | Runs (seeds x on/off) | Menus | v4 attached, budget | Ready at open | Rows changed while open | Log hash + nextSeq on = off | Open ms p50 / p95 / max, v4 on | same, v3 (off) | Errors |
|---|---|---:|---|---:|---:|---|---|---|---:|
| 1600x900, I, III, IX, XII | 4 x 3 x 2 | 122 | yes, mini, 1 worker | **122/122** | **0** | **12/12** | 0.9 / 3.4 / 4.4 | 4.9 / 17.0 / 18.2 | 0 |
| 390x844, 4x CPU, I | 1 x 3 x 2 | 10 | yes, mini | **10/10** | **0** | **3/3** | 5.6 / 51.5 / 51.5 | 39.5 / 94.9 / 94.9 | 0 |
| FFX-2 Bahamut (default switch) | 1 | 5 | **no host, no v4 worker spawned** (v3) | - | 0 | - | 5.4 / 6.8 | - | 0 |

No worker answer was delivered while a menu was open (0 of 132). v4's pick differed from v3's at 5 of
132 opens, and it was already there when the menu opened.

**Card text while a menu is open (not a flip, and v3 does it too).** The rows never change. The text
changes the same way with v4 on and off. 118 of 132 opens have the same pattern both ways. The 14 that
differ are the fit pass trimming lines in the first 5 to 61 ms (for example, dropping an item's flavour
line, or the "Next best move" heading), and the dwell fold at about 1.6 s. The trim fires in one run and
not the other on the same row, so it depends on timing, not on v4. On the phone the text never changed
(0/10 both ways).

**Merge.** `git merge-tree --write-tree HEAD origin/main` (49005f73) is clean. There are no textual
conflicts, but main changed the advisor's inputs after this branch's base (1a81a8ed): 578e7f22 gives
Chapters II and III research §6.4.3's aeon rows (`braskas-final-aeon.ts`, `yunalesca.ts`), and 63f4472a
changes `advisor.ts`, `guide-inflight.ts`, `guide.ts` and `MoveAdvisor.ts`. So the v3-versus-v4 numbers
above, and the whole gate, were measured on the pre-merge base. The merged tree should re-run the
worker-path bench on II and III, plus the III lethal fork at mini, before a release.

## MERGED RE-CHECK (2026-09-29): the switch stays ON (mini) on the merged tree

**Game case: FFX only** (FFX-2 stays on v3; nothing in the switch or wiring changed).

**Why.** The switch-on check (CHK2-1) found the gate had been measured on the pre-merge base, while
main (49005f73) had since changed Chapter II/III's aeon rows (578e7f22) and `advisor.ts`,
`guide-inflight.ts`, `guide.ts`, `MoveAdvisor.ts` (63f4472a). This re-runs the gate on the merge.

**Merge.** `git merge --no-ff origin/main` (49005f73) into `advisor-v4`: no conflicts. On the merged
tree `tsc --noEmit` and `typecheck:e2e` are clean; the advisor v3/v4 and card unit files
(`tests/unit/advisor*`, `ffx2-advisor*`, `guide-advisor*`, `tactics-lookup`, `ui-move-advisor`) pass:
39 files, 1 skipped, 380 tests.

**Worker path, mini, v3 and v4, merged tree** (`results/merged-mini-*.json`; pre-merge from `wp-mini-<id>.json`):

| Chapter | Seeds | v3 wins | v4 wins | Lost (v3 / v4) | Lethal-save miss v3 → v4 | Missed revive v3 → v4 | Top row switched | Pre-merge v3 / v4 |
|---|---:|---:|---:|---|---|---|---|---|
| II (yunalesca) | 40 | 37 | **39** | 26, 35, 39 / 26 | 0 → 0 | 7 → 0 | 8 / 5744 | 37 / 38 |
| III (braskas-final-aeon) | 40 | 39 | **40** | 38 / none | 0 → 0 | 1 → 0 | 18 / 9934 | 39 / 40 |
| I (seymour-flux), smoke | 20 | 10 | **17** | 10 seeds / 16, 19, 20 | 0 → 0 | 188 → 227 | 21 / 940 | 10 / 17 |
| XII (seymour-omnis), smoke | 20 | 13 | **18** | 7 seeds / 1, 7 | 6 → 3 | 99 → 119 | 114 / 2397 | 13 / 13 |

**Chapter III lethal saves, fork-tested, mini, merged** (`results/fork-mini-iii-merged.json`):

| Driver | Wins | Flagged | Fork miss | Real deaths (pick) | Avoidable |
|---|---:|---:|---:|---:|---:|
| v3 | 39/40 | 0 | 0 | 0 | 0 |
| v4 mini | 40/40 | 0 | 0 | 0 | 0 |

**Rule and outcome.** v4 >= v3 on II (39 vs 37) and III (40 vs 39) at 40 seeds; the III fork-tested
lethal deaths at mini are 0 against v3's 0; I (17 vs 10) and XII (18 vs 13) are not below v3 on the
20-seed smoke. Every number passes, so `ADVISOR_V4_FFX` stays **true** at the mini budget; `switch.ts`
and its pinning test are unchanged.

**Notes.** The merged aeon rows moved v3 on III from a seed-17 loss with one arithmetic lethal flag to
a seed-38 loss with none. XII's v4 improved from 13 to 18 on seeds 1-20 after the merge (v3 unchanged),
which is 63f4472a's advisor inputs reaching v4's candidates; it was not the question asked here and was
not dissected. Missed-revive counts on I and XII rise with v4; they are counted per decision and v4 plays more
decisions there (940 vs 689, 2397 vs 2142) because it survives longer. Not a gate.

**Not done:** no deploy, not pushed, not merged into main. A release still needs `critic-plan` and the
reviews it names.
