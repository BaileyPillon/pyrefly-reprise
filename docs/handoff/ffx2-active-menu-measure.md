# FFX-2 chapters 4/5/6 measured under the PR-0076/PR-0080 fixes and the Config ATB speed lever

**Game case: FFX-2 only** [AGENTS.md rule 14] — chapters 4, 5 and 6 are FFX-2's
Active ATB; FFX has no clock under a menu and no chain lock, so it is out of scope
for this measurement. No boss number, enemy AI or drop table was touched; this is
measurement only (hard rule 6, memory "boss-side fix needs measured options").

**Scope of this note**: this run's own critic/bench/ffx2-active/** and this file
(brief for the ffx2-active-menu track). It does **not** re-derive the harnesses —
those are owned by `tests/unit/ffx2-active-measure.test.ts` (ch4/ch5, committed at
`be09723`) and `critic/bench/leblanc/bench.test.ts` (ch4 control + ch6, committed
earlier this program, see `docs/handoff/chapter-leblanc-measure.md`). This note runs
them on the current tree, adds the one arm neither had (ch4/ch5 at ATB speed **Fast**),
and reports all three chapters side by side with the pre-fix control row.

## 1. What was measured, and how

- Driver: **the shipped chapter line (`intendedStrategy`) only.** The move advisor's
  "top row" driver (`critic/bench/advisor-v2/harness.ts`'s `advisor-v2` driver) is
  **not wired into either chapter-4/5/6 harness** — see §4 Not done. Every number
  below is the intended-line arm the brief asked for; the advisor-top-row arm is not
  in this report.
- Decision time `D` (0 / 1500 / 4000 ms): a modelled, authored input to the
  measurement, not game data — real ms of `throughInput` clock handed to the engine
  at every `'player-input'` decision before the driver submits its pick. `D = 0` is
  today's behaviour and the regression control.
- ATB speed (Slow 0.746x / Normal / Fast 1.262x, `research/ffx2-combat-core.md` §1.2):
  the sourced Config lever added in `27c3601`. Chapters 4 and 5 run all three speeds
  (`tests/unit/ffx2-active-measure.test.ts`'s `PYREFLY_ATB_SPEED` env var). **Chapter
  6's bench does not have a speed arm** — it only ever runs at Normal — so the
  Leblanc rows below are Normal-only; that is a gap, not a zero result for Slow/Fast.
- 40 seeds per arm, same seed set (1-40) reused across arms, headless engine only —
  no DOM, no `three` (hard rule 1).
- Commands: `PYREFLY_MEASURE=1 [PYREFLY_ATB_SPEED=slow|fast] npx vitest run
  tests/unit/ffx2-active-measure.test.ts` (ch4/ch5); `PYREFLY_MEASURE=1 npx vitest
  run --config critic/bench/leblanc/vitest.config.ts` (ch4 control + ch6). Run
  2026-09-22 on commit `be09723` (the tree carrying PR-0076/PR-0080, the Config ATB
  speed lever, and the pause ATB SPEED row). Raw rows:
  `critic/bench/ffx2-active/results-normal-slow-fast.json`.

## 2. Chapter 4 (Bahamut) and Chapter 5 (Vegnagun chain) — control, then all three speeds

Control row is round 08's pre-fix measurement (`docs/handoff/ffx2-active-menu.md` §4,
`docs/handoff/chapter-leblanc-measure.md`), reproduced here for the side-by-side.

| chapter | D | control (pre-fix, Normal) | after, Fast | after, Normal | after, Slow |
|---|---|---|---|---|---|
| ch4 | 0 ms | 40/40, 100.7 s | 40/40, 79.8 s | 40/40, 100.7 s (byte-identical) | 40/40, 134.9 s |
| ch4 | 1500 ms | 40/40, 170.1 s, 510 invalidated | 40/40, 120.2 s, 19 inv. | 40/40, 143.4 s, 15 inv. | 40/40, 179.6 s, 11 inv. |
| ch4 | 4000 ms | 40/40, 229.7 s, 762 invalidated | 40/40, 126.2 s, 24 inv. | 40/40, 159.3 s, 24 inv. | 40/40, 211.5 s, 24 inv. |
| ch5 | 0 ms | 40/40, 373.0 s | 40/40, 301.0 s | 40/40, 373.0 s (byte-identical) | 40/40, 502.8 s |
| ch5 | 1500 ms | **0/40**, 141.6 s, 948 invalidated | **3/40**, 679.5 s, 158 inv. | **4/40**, 860.1 s, 173 inv. | **5/40**, 1057.6 s, 111 inv. |
| ch5 | 4000 ms | 0/40, 126.8 s | 0/40, 435.4 s | 0/40, 498.0 s | 0/40, 998.7 s |

**Reading.** D=0 is byte-identical to the pre-fix build at Normal (the golden test
already pins this); Fast/Slow at D=0 scale the same clean run only by the tick rate,
as §1.2's "single global tick rate" says. At human decision times the fixes hold
chapter 4 at 40/40 across all three speeds (medians move because more clock passes
while a held command waits out its chain, not because a win is lost). Chapter 5's
intended line remains **not majority-winnable at any of the three speeds** at
D=1500: 3/40 Fast, 4/40 Normal, 5/40 Slow — Slow buys exactly one extra seed over
Normal, same as `ffx2-active-menu.md` already found. At D=4000 the intended line
wins zero seeds at every speed.

## 3. Chapter 6 (Leblanc, three-act mission) — control, then Normal only

| D | control (pre-fix) | after the fixes, Normal |
|---|---|---|
| 0 ms | 40/40, 74.2 s | 40/40, 74.2 s |
| 1500 ms | **4/40**, 185.9 s, 755 invalidated | **5/40**, 178.6 s, 56 inv., 518 refused |
| 4000 ms | 0/40, 176.2 s | 0/40, 127.4 s, 106 inv., 193 refused |

The bench's own earlier decision-time sweep (`docs/handoff/chapter-leblanc-measure.md`
"option" arms, pre-fix, Normal only) for where the line stops being majority-winnable:
500 ms 35/40 (87.5%), 750 ms 25/40 (62.5%), 1000 ms 11/40 (30.0%), 1250 ms 6/40 (12.5%).
Re-running the same four option arms post-fix on this tree gave the same shape (35/40,
25/40, 11/40, 6/40) — the fixes move chapter 6's D=1500/4000 numbers by only 1 seed and
a large drop in refused/invalidated commands, not by changing where the line's majority
threshold sits. Chapter 6, like chapter 5, is **not majority-winnable by the intended
line past roughly D=750-1000 ms**, before or after PR-0076/PR-0080.

## 4. Not done (say so rather than guess)

- **The advisor's top-row driver is not measured for chapters 4/5/6 at any speed.**
  `critic/bench/advisor-v2/harness.ts` has the `advisor-v2` driver and already runs
  chapters 4 and 5 (`ffx2-bahamut`, `ffx2-vegnagun-shuyin`) for its own bench, but
  that harness has no decision-time (`D`) or ATB-speed axis, and chapter 6 (Leblanc)
  is not in its `CHAPTER_IDS`. Wiring the advisor driver into the `D`/speed grid for
  three chapters is new harness work, not a rerun of an existing one; it was not
  attempted here given the time this measurement track had, and is not represented
  in §2/§3's tables — do not read the "after" rows above as advisor-driven.
- **Chapter 6 has no Slow/Fast arm.** Its bench (`critic/bench/leblanc/bench.test.ts`)
  only runs Normal. Adding a speed env var there mirrors
  `tests/unit/ffx2-active-measure.test.ts`'s pattern but was not done.
- No new test file was added under `critic/bench/ffx2-active/`; this track only adds
  the raw-results JSON and this note, and reruns the two existing harnesses rather
  than forking a third copy of the same driver (the leblanc bench's own header already
  explains why it was built fresh instead of editing the ch4/ch5 file; a fourth copy
  for this note was not justified).
- `docs/plans/ffx2-active-menu-review.md` §6 (referenced in the brief) already covers
  the invariants and regression checks; nothing here revises it, since no code changed
  in this track, only measurement.

## 5. For Bailey (options, each with its measured result; no number tuned)

The chapter 5/6 intended line is not majority-winnable near human decision speed at
any Config ATB speed measured. Options, as measured, not recommended:

1. **Normal + fixes (shipped default).** ch4 40/40 all D; ch5 4/40 at D=1500; ch6 5/40
   at D=1500. Matches `docs/handoff/ffx2-active-menu.md`'s own reporting.
2. **Slow + fixes.** ch4 40/40 all D (slower clock, same outcome); ch5 5/40 at D=1500
   (best of the three speeds, still a small minority); ch6 not measured at Slow (§4).
3. **Fast + fixes.** ch4 40/40 all D; ch5 3/40 at D=1500 (worst of the three); ch6 not
   measured at Fast (§4).
4. **Leave chapter 5/6 as the last-fight difficulty spike** (already an open item in
   `ffx2-active-menu.md` §7.1) — no further engine change, Bailey plays it as shipped.

None of these change a boss number; the choice is entirely the Config ATB speed
default and whether chapter 5/6's difficulty at human decision time is accepted.
