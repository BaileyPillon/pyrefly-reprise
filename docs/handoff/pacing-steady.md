# pacing-steady: battle pacing `steady` is the default (both games)

Branch `pacing-steady` (from main 1a6fd3cc), worktree `D:/pyrefly-aeon-hp`. Not pushed, not merged, not deployed.

## The words

Bailey, 2026-09-29, answering the driver's five recommendations: "yes, all your recommendations". Recommendation 3:
"'steady' becomes the default (FFX actions x1.2, numbers x1.3; FFX-2 x1.1 and x1.25; as documented on branch
fb-0929-pacing, now on main)". The friend's original complaint: "moves and transitions happen too fast".

## What changed

- `src/engine/pace.ts`: new `DEFAULT_PACE = 'steady'`; the module starts there. Header rewritten.
- `src/main.ts`: `setPace(paceFromQuery(...) ?? DEFAULT_PACE)`. `?pace=current` gives today's timing, `?pace=relaxed` stays.
- `src/debug/api.ts`: doc comment only (`__pyrefly.pace()`).
- `tests/unit/pace-option.test.ts`: pins the new default and its per-game numbers, keeps `current` as exact-1, checks no
  factor is below 1 (so REDUCE MOTION cannot make anything faster), and now runs the presentation-only test for
  `steady` as well as `relaxed` (same event log; each wait the same or stretched by exactly the action factor).
- `tools/pace-measure.mjs`: `--reduce` flag (emulated prefers-reduced-motion).
- `docs/CONTRACT-CHANGES.md` entry (the actors' `update` default rate changed), `docs/concepts/fb-0929/pacing/README.md`
  update note, new `docs/concepts/fb-0929/pacing/steady-default.md` with the measurements, raw
  `beats/default-ch{1,4}.json` and `beats/pacecurrent-ch{1,4}.json`.

Presentation only: `src/battle/**` untouched; engine, RNG, CTB order and the FFX-2 ATB clock unchanged.

## Game case

Both, with separate multipliers (rule 14): FFX (Ch. I to III) x1.2 actions / x1.3 numerals / x1.2 entry+wipe; FFX-2
(Ch. IV, V) x1.1 / x1.25 / x1.1. FF7 and everything outside a battle are never paced. All `[ours]`, no sourced numbers.

## Evidence

Production build (`BASE_PATH=/`, built and served from PowerShell: Git Bash mangles `/` into `C:/Program Files/Git/`),
real keys, headless Chromium GPU, seed 3, 3 turns. Default vs `?pace=current` ratios match the steady table within
run noise (Ch. I: wind-up x1.17, hit x1.23, numeral x1.31, enemy action x1.19; Ch. IV: wind-up x1.09, numeral x1.24,
enemy action x1.09). Event types and order identical (48 in Ch. I, 53 in Ch. IV). Under emulated reduced motion the
default is still about x1.2 / x1.3 of `current`, never shorter. Full tables: `docs/concepts/fb-0929/pacing/steady-default.md`.

## Checks

`npx tsc --noEmit` clean; `tests/unit/pace-option.test.ts` passes (and `ffx2-menu-cancel-delay`); full `npm test` once:
672 files passed, 2 failed on the 15 s timeout under load (`strategy-ffx2-bahamut.test.ts` heal-only route,
`audio-manifest-io.test.ts` four concurrent writes); both pass with `--testTimeout=120000` (28/28), neither touches
pacing. No other test pinned the old default.

## Not done

- Results wipe and the battle-to-results beat were not timed (entry overlay numbers include loading and are noisy).
- Playwright e2e specs were not re-run; none was edited. A spec that pins a battle beat's duration would now see x1.1
  to x1.3 of it; grep finds two that mention damage numerals (`hud-collision.spec.ts`, `intent-pause.spec.ts`); neither was run, so the deep/focused review should include them.
- No in-game OPTIONS row for pacing (new pause row needs a mockup and Bailey's yes).
- Nothing is canon-timed (needs frame-timed Steam footage, rule 6).

## CHECK (independent, 2026-09-30)

Verified on a fresh production build (BASE_PATH=/, vite preview, headless Chromium GPU, 1600x900, seed 3, 3 turns), default vs `?pace=current`:
- Chapter I: wind-up x1.18, hit x1.16, numeral x1.31, enemy action x1.18 (steady table: 1.2/1.2/1.3).
- Chapter IV: wind-up x1.09, hit x1.07, numeral x1.24, enemy action x1.09 (steady FFX-2: 1.1/1.25).
- `__pyrefly.pace()`: no parameter = steady, `?pace=current` = current, `?pace=relaxed` = relaxed. Presets in src/engine/pace.ts are as documented; nothing under src/battle changed; pace.ts does not read reduced motion.
- tsc clean; pace-option test 10/10; full suite once (testTimeout 120 s): 674 files passed, 5 skipped, 0 failed; orphans list unchanged (no new src modules); git merge-tree against origin/main (1a6fd3cc) has no conflicts.
- Not re-checked: the per-event trace comparison (relied on the builder's trace plus the presentation-only unit test); Playwright e2e specs still owed by the release review.
Blockers: none.
