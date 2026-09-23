# FFX-2 Wait mode (D-029, the new default) measured against Active — chapters 4, 5, 6

**Game case: FFX-2 only** [AGENTS.md rule 14] — Wait/Active is an FFX-2 Config
entry (`research/ffx2-combat-core.md` §1.5); FFX is CTB and has no clock under a
menu, so it is out of scope for this measurement. No boss number, enemy AI or
drop table was touched — measurement only (hard rule 6, memory "boss-side fix
needs measured options").

Owner: this run's own `critic/bench/ffx2-wait/**` and this file. Does not
re-derive the harnesses in `tests/unit/ffx2-active-measure.test.ts` or
`critic/bench/leblanc/bench.test.ts` (both Active-only, pre-D-029); a fresh
harness was built at `critic/bench/ffx2-wait/bench.test.ts`, same method, so
chapters 4/5/6 and both modes come from one session, one harness, one build
(commit `e1844cd`, tree unmodified by this run).

## 1. What was measured, and how

- **Mode**: `wait` (the new default, D-029) vs `active` (control, the setting
  D-029 keeps as the alternative), passed as `Ffx2EngineOptions.atbMode`.
- **Decision time `D`** (0 / 1500 / 4000 ms): a modelled, authored input to the
  measurement, not game data — real ms of `throughInput` clock the driver hands
  the engine at every `'player-input'` decision before submitting
  `intendedStrategy`'s pick. `D = 0` is the regression control for both modes.
- **Driver: the shipped chapter line (`intendedStrategy`) only.** The move
  advisor's "top row" driver (`critic/bench/advisor-v2`) is **not wired into
  this harness**, the same gap `docs/handoff/ffx2-active-menu-measure.md` §1
  already disclosed for the Active-only bench — this report inherits it rather
  than closing it. **Not done**, see §4.
- 40 seeds per arm (1-40), headless engine only — no DOM, no `three` (hard
  rule 1).
- Command: `PYREFLY_MEASURE=1 npx vitest run --config
  critic/bench/ffx2-wait/vitest.config.ts`. Raw rows:
  `critic/bench/ffx2-wait/results-wait-vs-active.json`.

## 2. Result

| chapter | mode | D | wins | median s | worst s | menus invalidated | commands refused | commands held | total KOs |
|---|---|---|---|---|---|---|---|---|---|
| ch4 Bahamut | wait | 0 ms | 40/40 | 100.5 | 104.6 | 0 | 0 | 0 | 40 |
| ch4 Bahamut | wait | 1500 ms | 40/40 | 100.5 | 104.6 | 0 | 0 | 0 | 40 |
| ch4 Bahamut | wait | 4000 ms | 40/40 | 100.5 | 104.6 | 0 | 0 | 0 | 40 |
| ch5 Vegnagun | wait | 0 ms | 40/40 | 379.1 | 609.7 | 0 | 0 | 0 | 1575 |
| ch5 Vegnagun | wait | 1500 ms | 40/40 | 379.1 | 609.7 | 0 | 0 | 0 | 1575 |
| ch5 Vegnagun | wait | 4000 ms | 40/40 | 379.1 | 609.7 | 0 | 0 | 0 | 1575 |
| ch6 Leblanc | wait | 0 ms | 40/40 | 76.6 | 126.0 | 0 | 0 | 0 | 322 |
| ch6 Leblanc | wait | 1500 ms | 40/40 | 76.6 | 126.0 | 0 | 0 | 0 | 322 |
| ch6 Leblanc | wait | 4000 ms | 40/40 | 76.6 | 126.0 | 0 | 0 | 0 | 322 |
| ch4 Bahamut | active | 0 ms | 40/40 | 100.5 | 104.6 | 0 | 0 | 0 | 40 |
| ch4 Bahamut | active | 1500 ms | 40/40 | 144.7 | 155.7 | 13 | 0 | 397 | 40 |
| ch4 Bahamut | active | 4000 ms | 40/40 | 162.6 | 173.2 | 20 | 0 | 354 | 40 |
| ch5 Vegnagun | active | 0 ms | 40/40 | 379.1 | 609.7 | 0 | 0 | 0 | 1575 |
| ch5 Vegnagun | active | 1500 ms | **5/40** | 835.9 | 1035.5 | 155 | 4 | 1323 | 2488 |
| ch5 Vegnagun | active | 4000 ms | **0/40** | 530.9 | 1317.8 | 187 | 1 | 1605 | 1344 |
| ch6 Leblanc | active | 0 ms | 40/40 | 76.6 | 126.0 | 0 | 0 | 0 | 322 |
| ch6 Leblanc | active | 1500 ms | **9/40** | 203.9 | 688.0 | 69 | 3 | 591 | 428 |
| ch6 Leblanc | active | 4000 ms | **4/40** | 181.1 | 1565.6 | 85 | 0 | 332 | 420 |

## 3. Reading

**Wait behaves exactly as `clockHeldByMenu` and D-029 intend, across all three
chapters:** wall time and every counted stat (invalidated, refused, held, KOs)
are byte-for-byte identical at D = 0, 1500 and 4000 ms — 40/40 wins at every
arm, every chapter. Decision time changes nothing an engine tracks while a
menu sits open, because nothing moves: not ATB, not charge, not recovery, not
status timers, not chain windows, not enemy turns, not carried ticks. This is
the invariant the brief asked to confirm, and it holds without exception in
this run.

**Active reproduces the shape of the earlier Active-only measurements**, though
not their exact numbers — see §4. D = 0 is identical to Wait's D = 0 in every
chapter (the golden control both modes must share). Past D = 0, Active costs
wins the way `docs/handoff/ffx2-active-menu-measure.md` already found:
chapter 4 stays at 40/40 (medians move because more clock passes while a held
command waits out its chain) but chapters 5 and 6 both drop hard — chapter 5
to 5/40 at D=1500 and 0/40 at D=4000, chapter 6 to 9/40 and 4/40. **Wait
removes that cost entirely** for the intended line: the chapters that were
"not majority-winnable" under Active at human decision times are 40/40 under
Wait at the same decision times, because Wait's whole point is that decision
time is no longer spent against a running clock.

**Do not tune.** No boss number, formation or drop changed between arms; the
difference between Wait's 40/40 and Active's falling numbers is the mode
itself, which is exactly what D-029 chose Wait to fix.

## 4. Not done / open

- **The move advisor's "top row" driver is not run here.** Every number above
  is the intended-chapter-line arm; the advisor-top-row arm that
  `ffx2-active-menu-measure.md` also excluded is still not measured under
  either mode. Building that driver into this bench is separate work and
  needs a yes before it is built (rule 10).
- **This run's Active numbers differ from `ffx2-active-menu-measure.md`'s**
  (ch5 D=1500: 5/40 here vs 4/40 Normal there; ch6 D=1500: 9/40 here vs 5/40
  there). Both harnesses use the same `intendedStrategy` driver, seeds 1-40,
  and `setupForNextLink`, built independently rather than sharing code, so a
  small difference in exactly how `heldCommand`/refuse-and-reopen unfolds
  turn-by-turn is plausible; both harnesses agree on the same qualitative
  result (chapter 4 unaffected, chapters 5 and 6 fall hard under Active at
  human decision times) and both report D=0 byte-identical to the shipped
  golden. Reconciling the exact seed-by-seed counts is not done — flagged as
  open, not claimed as a match.
- **ATB speed (Slow/Normal/Fast, §1.2) is not an arm here.** This bench only
  ever runs the Config default speed. `ffx2-active-menu-measure.md` already
  has the three-speed Active sweep for chapters 4/5; a Wait three-speed sweep
  is not built.
- No new engine, presenter or settings code was touched by this measurement.
  The build itself (commits `a93a4f4`, `e1844cd`) is the builder's work, not
  this run's; this run only measures the tree as committed.
