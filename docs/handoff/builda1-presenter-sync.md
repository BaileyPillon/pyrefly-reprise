# Build A.1 — presenter-sync

**Item:** critic round 03 #9, BLOCKER — *"the presenter runs behind the engine"*.
**Status:** fixed, committed, verified live on the real clock. Nothing open that blocks a deploy.
**Game case: both** (shared playback plumbing — AGENTS.md rule 14, `critic/CHECKS.md` CHK-020).

---

## What was wrong

Measured by the critic on Build A (`critic/rounds/round-03/b-ko2.mjs`, `ko2.json`, sampled
every 200 ms):

- the party row drew **Yuna at 711/1500 in living colours for 2145 ms** after the engine had
  already logged `{type:'ko', targetId:'yuna'}`;
- the **789 damage numeral was on screen at 1901 ms** while the same row still read 1500/1500,
  and did not reach 711 until **6395 ms** — its own hit led its own bar by about 4.5 s.

Wrong information on a panel is what the rubric punishes hardest (Part B 8.0 cap), so this is a
correctness defect, not a feel one.

## Root cause

Not a queue backlog, not stacking hold times, not a speed setting that missed a stage — the
critic's four hypotheses were all wrong, and so was mine until I ran it.

`BattlePresenter` has **no queue**. `play(events)` awaits one event's animation, then the next.
The only `syncHud()` in the loop ran **after `play()` returned**, i.e. after a whole burst had
finished animating:

- `BattlePresenter.run()` case `'resolved'` — `await this.play(...)` then `this.syncHud(engine)`
- the same in case `'waiting'` (FFX-2's ATB tick)
- `BattlePresenter.submit()` — `await this.play(engine.submit(command))` then `this.syncHud(engine)`

One command is `action-start → damage → ko → action-end → message`, each with its own beat from
the `TIMING` table (380 + 240 + 620 + … ms). For that entire stretch the HUD was still drawing the
numbers from **before the command**. The rows were late by exactly the remainder of the burst; the
numerals were never early. That is why the gap grew with the size of the action — 2.1 s for a
plain hit, 4.5 s when a message or a multi-hit sat behind it.

The obvious repair does not work. The engine has already resolved the whole burst by the time the
presenter plays it, so syncing from `engine.state()` per event paints a character **dead before the
blow lands** — the same lie pointing the other way.

## What changed

New pure module **`src/engine/BattlePresenterVitals.ts`** (no DOM, no `three` — hard rule 1):

- `captureVitals(state)` snapshots the numbers a status row draws (hp, mp, alive, statuses, the
  Overdrive gauge) for every combatant;
- `applyEventToVitals(vitals, event)` rolls **one** event's effect into that snapshot and reports
  whether anything visible moved;
- `projectState(state, vitals)` returns the live state with those numbers spliced over it —
  shallow, so the log, `activeIds`, stats and AI memory are still the engine's own objects.

`BattlePresenter` now:

- seeds the snapshot from the engine at the top of `run()` and on **every** `syncHud()`, so the
  projection is re-grounded in the engine's truth once per burst and can never drift;
- calls `presentVitals(event)` immediately before `playEvent(...)`, in the same clock reading the
  event's animation (and its damage numeral) starts on.

`HudPort` gains an **optional, additive** `syncVitals(state)`. Both HUDs implement it as the cheap
per-hit path — party rows only (FFX-2 also its enemy gauges). It deliberately does **not** rebuild
the turn forecast, the strategy guide, the advisor or the enemy-intent slab: that prediction
deep-clones the board two dozen times and is affordable once per playback step, never once per hit.
`FFXBattleHud.syncVitals` also leaves `lastState` alone, so the menu, guide and advisor keep
reading the engine's own state from the last full `sync`.

A HUD that does not implement `syncVitals` keeps exactly the old behaviour — which is what every
mock screen and test double wants, and is asserted.

`src/engine/HudPort.ts` is **not** listed in `docs/CONTRACTS.md`, and the change is additive and
optional, so there is no `CONTRACT-CHANGES.md` entry. Flagging it here in case the owner of that
list wants one anyway.

### Files

| File | Change |
|---|---|
| `src/engine/BattlePresenterVitals.ts` | new — the projection |
| `src/engine/BattlePresenter.ts` | seed on `run`/`syncHud`; `presentVitals` per event |
| `src/engine/HudPort.ts` | optional `syncVitals(state)` |
| `src/ui/ffx/FFXBattleHud.ts` | `syncVitals` → party rows only |
| `src/ui/ffx2/FFX2BattleHud.ts` | `syncVitals` → party rows + enemy gauges, from the last snapshot |
| `tests/unit/presenter-vitals-sync.test.ts` | new — the pin |

Commit: `25c6bf6 Presenter: move the status rows with the blow, not with the burst`.

## The test that pins it

`tests/unit/presenter-vitals-sync.test.ts` — 12 assertions, run twice over **real** engines and the
shipped data layer: Chapter 1 (Seymour Flux, FFX/CTB) and Chapter 4 (Bahamut, FFX-2/ATB), auto-played
with `intendedStrategy` through the real `BattlePresenter` on a **fake clock** (`sleep(ms)` advances
a counter and resolves immediately, so a whole battle plays in ~100 ms while every beat still "takes"
its real duration).

`HudPort.onEvent` stamps each event the instant before it is played; every `sync` and `syncVitals`
stamps what the rows were showing. Lag is *presentation time − impact time*, in presenter
milliseconds — the same quantity `ko2.json` sampled live. Bound: **250 ms**.

It asserts: a `ko` reaches the row within 250 ms; a KO'd character is never drawn with hit points;
every `damage` event's arithmetic (`max(0, hp − amount)`, the event's own signed delta from
`types.ts`) lands on the row within 250 ms; the worst lag at an early turn equals the worst at the
last turn, so nothing accumulates; the rows end **exactly** equal to the engine; and — the guard
against over-correcting — nobody is drawn dead *before* their `ko` event.

**9 of the 12 fail without the fix**, with measured KO lags of **820, 3340 and ∞ ms**. The three that
still pass are the two over-correction guards and the optional-`syncVitals` compatibility case, which
is what you would want.

Rule 14 is covered two ways: every assertion above runs against both engines with the *same* bound
(a fix that reached only one game turns the file red), and a dedicated case asserts the per-hit path
is exercised in both games rather than being a branch one of them takes.

## Measured on the real clock

Browser mode: **`PYREFLY_BROWSER=gpu`** for every run (real GPU, no black canvas, no SwiftShader
fallback needed). Local `vite` on port 5400, Chapter 1 and Chapter 4, seed 20260920, sampled every
60 ms. Probe: `.lagprobe-tmp.mjs` + `.laganalyse-tmp.mjs` at the repo root (agent scratch), shots
under `docs/screenshots/builda1/presenter-sync/`. The raw sample files (`*.json`, ~1.3 MB each) sit
beside the shots **untracked** — rerun the probe to regenerate them rather than pulling 5 MB of
timing dumps into the repo.

"Before" is the same probe pointed at the **live Build A** (`https://baileypillon.github.io/pyrefly-reprise/`),
same chapter, same seed, same viewport — so the two columns are one measurement, not two.

| Chapter 1, 1600×900 | before (live Build A) | after (fixed) |
|---|---|---|
| a damage numeral was on screen, row still showing the old number | median **934 ms** | median **0 ms** (max 400) |
| the row disagreed with the engine's own hp | median **4586 ms**, max **6379 ms** | median **926 ms**, max 2637 ms |
| `ko` in `battleLog()` → row drawn down | **2747 ms** | **1925 ms** |

Chapter 1 at 1280×720 (after): numeral-before-row median **0 ms**, row-vs-engine median 964 ms.
Chapter 4 (FFX-2) at 1600×900 (after): numeral-before-row median **0 ms** over 15 transitions,
row-vs-engine median **597 ms**.

The critic's own 6395 ms reading reproduces almost exactly in the "before" column (6379 ms max),
which is the check that the probe is measuring the same thing they did.

**Read the residuals correctly.** The ~600–2600 ms that is left in "row vs engine" and in
"`ko` event → row down" is **not** lag: the engine resolves an entire command before a single frame
of it is animated, so the row *must* trail `engine.state()` by however long the blow it is showing
takes to play. Painting it any sooner is the over-correction the test explicitly forbids. The number
that describes the defect is the first row — what the player sees the numeral say versus what the bar
says at the same instant — and that is now zero.

Screenshot: `docs/screenshots/builda1/presenter-sync/after-ch1-1600x900.png` — a 578 numeral up on
Seymour Flux with Kimahri's row already grey at `0 /2310`, portrait desaturated. That is the frame
that used to read `711 /1500` in colour.

## Verification

- `npx tsc --noEmit` clean for every file in this track. (One unrelated error exists in
  `tests/unit/zz-engst-tmp.test.ts` — another agent's scratch file, `zz-*`, left alone per AGENTS.md.
  It is a `TS6196` unused-import warning and does not affect the suite.)
- `npx vitest run` — **151 files, 4181 tests, all green.** (The first full run showed one failure in
  `tests/unit/ui-common-results.test.ts`, a file this track does not touch; it passes in isolation
  and passed on the re-run. Shared-tree flake, not a regression here.)
- `node tools/orphans.mjs` — `BattlePresenterVitals.ts` is imported; nothing new orphaned.

## Still open

- The Chapter 1 and Chapter 4 sample sets contain only 5 and 15 party-row hp transitions in ~70 s of
  play. That is the encounters being long, not the probe failing, but it means the live figures above
  are a confirmation rather than a population. The unit test is the precise instrument.
- `applyEventToVitals` deliberately ignores the structural events (`summon`, `switch`, `dismiss`,
  `form-change`): a combatant that arrives or leaves mid-burst is left to the full sync at the end of
  it. That is at most one burst of staleness for a figure that is being animated onto the field
  anyway, but if the critic wants the aeon's row live from the frame it lands, that is where to add it.
- Round 03 #9's fix note also asks for an e2e sample of the rendered row against `battleLog()` every
  animation frame through a KO (`tests/e2e/`). This track pinned it at 60 ms in a throwaway probe and
  at full precision in vitest; a permanent e2e spec is not written.
