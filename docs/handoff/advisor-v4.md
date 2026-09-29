# Handoff: advisor v4 (look-ahead search in a Web Worker, FFX)

Branch `advisor-v4` (worktree `D:/pyrefly-advisor-v4`), **not merged**. 2026-09-28.
Method check and prototype numbers: [docs/plans/advisor-v4-method-check.md](../plans/advisor-v4-method-check.md).

> **Bailey, 2026-09-27:** *"the advisor needs to be WAY WAY smarter please"*.
> **Bailey, 2026-09-28** (D-272): "all your recommendations" = advisor v4 as a background search, FFX first.

## Where it stands

**Built, measured, left OFF** (`ADVISOR_V4_FFX = false`, `src/engine/tactics/advisor-v4/switch.ts`).
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
