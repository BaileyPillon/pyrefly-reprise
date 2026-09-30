# Pacing: `steady` is now the default (2026-09-30)

Bailey, 2026-09-29, on the driver's five recommendations: "yes, all your recommendations". Recommendation 3 was
that `steady` becomes the default battle pacing. Options and clips: [README.md](README.md). Handoff:
`docs/handoff/pacing-steady.md`.

## What changed

No `?pace=` now plays **steady**. `?pace=current` plays the pre-2026-09-30 timing exactly (every factor 1);
`?pace=relaxed` is unchanged. `__pyrefly.pace()` reads the setting and `__pyrefly.pace('<name>')` sets it.

| Game | Actions (waits, moves, camera, sparks, spell effects) | Damage numerals held | Entry + results wipe |
|---|---|---|---|
| FFX (Ch. I to III) | x1.2 | x1.3 | x1.2 |
| FFX-2 (Ch. IV, V) | x1.1 | x1.25 | x1.1 |
| FF7 | never paced | never paced | never paced |

Every number is `[ours]` (no source gives battle beat durations in seconds; rule 6 not touched). Game case: both,
with separate multipliers per game (rule 14). Presentation only: the engine, the RNG, the CTB order and the FFX-2
ATB clock are untouched.

## Measured by real keys on a production build (`BASE_PATH=/`, 1600x900, headless Chromium GPU, seed 3, 3 turns)

Build of branch `pacing-steady`, served on port 8330. `default` = no parameter, `current` = `?pace=current`, both
in this build and the same session. Medians in ms; "table" is the steady/current ratio the README's steady table
and the independent CHECK of the option got (Ch. I: windUp x1.19, numeral x1.30; Ch. IV: windUp x1.10, numeral x1.25).

| Chapter I, Seymour Flux (FFX) | default | `?pace=current` | ratio | table ratio (steady/current) |
|---|---|---|---|---|
| Wind-up | 274 | 235 | 1.17 | 1.19 to 1.20 |
| Hit reaction | 432 | 351 | 1.23 | 1.20 |
| Settle | 246 | 210 | 1.17 | 1.21 |
| Party action, start to settle | 955 | 783 | 1.22 | 1.20 |
| Enemy action, start to settle | 1474 | 1243 | 1.19 | 1.20 |
| Damage numeral on screen | 1181 | 899 | 1.31 | 1.31 |
| KO beat | 749 | 634 | 1.18 | 1.20 |
| Turn-start beat | 115 | 96 | 1.20 | 1.17 |
| Last beat to next menu | 0 | 0 | | 0 |

| Chapter IV, Bahamut (FFX-2, Wait) | default | `?pace=current` | ratio | table ratio |
|---|---|---|---|---|
| Wind-up | 883 | 811 | 1.09 | 1.09 to 1.10 |
| Hit reaction | 386 | 366 | 1.05 | 1.13 (noisy, n=8) |
| Settle | 222 | 201 | 1.10 | 1.13 |
| Enemy action, start to settle | 1482 | 1356 | 1.09 | 1.12 |
| Damage numeral on screen | 1134 | 916 | 1.24 | 1.25 to 1.26 |
| Turn-start beat | 104 | 95 | 1.09 | 1.11 |

All within run noise of the steady table (a few percent; `hit` in Chapter IV has 8 samples and a wide spread).
Party-action medians in Chapter IV (2802 vs 2651 here; 926 vs 801 in the README) depend on which spells the 3 manual
turns pick and are not comparable across runs, as the README already noted; the per-beat rows above are.

**Same engine, same events.** Under the default and under `?pace=current` the presenter's per-event trace has the
same 48 event types in the same order in Chapter I and the same 53 in Chapter IV, same party, no page errors
(`beats/default-ch*.json`, `beats/pacecurrent-ch*.json`). Unit level: `tests/unit/pace-option.test.ts` plays both
chapters through the real presenter under `steady` and `relaxed` and asserts the event log equals `current`'s and
every wait is the same or stretched by exactly the action factor.

**REDUCE MOTION does not make things faster.** Nothing in `pace.ts` reads it, and every preset factor is at least 1.
Measured with `--reduce` (emulated `prefers-reduced-motion`), Chapter I: default / `current`: wind-up 275 / 234,
hit 295 / 246, settle 248 / 203, party action 824 / 679, enemy action 1341 / 1150, numeral 1181 / 898. So the
default is longer than current under reduced motion too (about x1.2 and x1.3), never shorter, and the reduced-motion
entry stays a cut (`introMs` 0 x factor = 0).

## Not measured

- Battle entry overlay and results wipe by `--finish`: the entry overlay rows in the logs include loading and are
  noisy (Ch. I 2227 default vs 1730 current, Ch. IV 2234 vs 2800); the code path is a plain `durationMs` scale, unchanged
  and pinned by the earlier option work. The results wipe was not timed.
- No real Playwright e2e suite was re-run for this change; `tests/e2e` timing assumptions were not touched.
