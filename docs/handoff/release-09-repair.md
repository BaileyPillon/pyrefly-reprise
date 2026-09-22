# Release 09 batch — repair pass after the adversarial verifier

Written 2026-09-22 by the repair agent of workflow `wf_d471add8-24f` ("pyrefly-release-09-batch").
Answers the verifier's refutations (evidence `critic/scratch/release-09/`); this pass's own scratch,
probes and captures are in `critic/scratch/release-09/repair/`. Nothing pushed, nothing deployed.

## Status by item

| Item | Game case (rule 14) | Status |
|---|---|---|
| PR-0075 FFX-2 heals / items roll the enemy hit check on an ally | FFX-2 only | **FIXED** (preflight + engine + tests) |
| PR-0076 chapter 5 not majority-winnable at D=1500 | FFX-2 only | **STILL OPEN — Bailey's decision**, re-measured, options below |
| FOC-06 phone claim (badge wraps, move clipped at 390x844) | both | **FIXED for FFX-2**; FFX phone card stays hidden (pre-existing, live too) |
| FOC-06 content loss at 1280x720 | both (seen in FFX ch1) | **DISCLOSED, not fixable without a layout change** — measured below |
| PR-0078 hero frame stops at x 1461, black band | both | **FIXED**: full-bleed to the wedge, as tile A-results |
| Release: `SaveData.ts` in the batch | both | **Process, not code**: this batch needs a DEEP review before deploy |
| House rule 7 growth | — | **FIXED** for every batch file but `SaveData.ts` (+3) and `api.ts` (+7, Leblanc's) |
| FOC-05 minor: mark grazes the command stack | FFX only | **FIXED** |

## PR-0075 (FFX-2 only)

Preflight `docs/plans/ffx2-item-accuracy-review.md` (critic-plan: DEEP). `hitPercent` returns 100
when `user.side === target.side` and the action is restorative (`heals` flag, `healing` formula or
item category). Sources: §2.6 is an attacker-versus-defender race; the §2.9.1 tables mark ally-support
rows "—" in the Accuracy column; FFX's `accuracy.ts` already carves heals out (§2.11). Hostile actions
on an ally (Confuse) still roll. The hit check moved to `src/battle/ffx2/hit.ts` (formulas.ts was 399
lines), re-exported from `formulas.ts`.

- Test `tests/unit/ffx2-ally-heal-accuracy.test.ts`: 4 of 6 failed on the old code (A1 x2, A3 x2).
- Goldens `tests/unit/ffx2-atb-golden.test.ts` re-pinned, with the reason written in the file. Before
  re-pinning: old chapter 4 D=0 had friendly misses on 9 of 20 seeds, chapter 5 on 18 of 20 (evaded
  only); a throwaway variant that still drew the roll left the 11 clean chapter 4 seeds byte-identical,
  so only the friendly miss moved. After: zero friendly "evaded" misses on every seed.
- `PYREFLY_MEASURE=1 tests/unit/ffx2-active-measure.test.ts`: ch4 40/40 at D 0/1500/4000 (100.5 s at
  D=0); ch5 D=0 **40/40** (379.1 s, was 373.0), D=1500 5/40 (was 4/40), D=4000 0/40.
- Chapter 6 bench (`critic/bench/leblanc`): D=0 40/40, D=1500 **9/40** (was 5/40), D=4000 4/40 (was 0).
  `tests/unit/strategy-ffx2-leblanc.test.ts` "Huggles is lethal" now holds on 10 of 11 Huggles runs
  (seed 13 heals through it); the assertion is now >= 80 %, with the reason in the test. No boss number
  moved.
- No shipped enemy heal changes: Node Cura on the Leg was already 100 %, Leblanc's White Wind is
  `canMiss: false`, enemy revives return before the hit check.
- Not decided (unsourced): whether an item thrown at an enemy that misses is refunded. `execute.ts`
  still spends before the roll; no friendly item can miss any more.

## PR-0076 (FFX-2 only): not cleared, measured for Bailey

The hold fix works mechanically, but the chapter's intended line is still not winnable by a majority
at a modelled 1.5 s per decision. Chapter 5 sweep after PR-0075 (40 seeds, Normal speed, intended line,
`critic/scratch/release-09/repair/ch5-dsweep.txt`):

| D per decision | 500 ms | 750 ms | 1000 ms | 1250 ms | 1500 ms | 4000 ms |
|---|---|---|---|---|---|---|
| wins | 32/40 | 27/40 | 11/40 | 8/40 | 5/40 | 0/40 |

So a player under ~0.75 s a decision clears it on a majority; at 1 s and up it does not. The boss is
not touched (standing rule). Levers left are Bailey's: accept it as the last-fight spike; the Config
speed (Slow bought one seed); a Wait mode (D-009 said Active only); a ready chime / last-command repeat
(new visible things, options first). The round-08 HOLD cannot be called cleared without his word.

## FOC-06 (both games)

- **Phone.** At 390x844 the 12.2 px floor wrapped "NEXT BEST MOVE" onto three lines and pushed the
  move under the cap. The last rung of the card's density ladder (`MoveAdvisor.ts`, rung 6) now also
  drops the title, keeping the actor and every move. Measured on this build: chapter 4 "Yuna | Shell ->
  the party", chapter 5 "Yuna | Light Curtain -> the party", nothing clipped, 12.2 px minimum.
  Screenshot `docs/screenshots/onboarding/foc-06-phone-card-ch4-390x844.png`. Test in
  `tests/unit/ui-move-advisor.test.ts` (failed before).
- **FFX on a phone:** the card is hidden (the FFX safe zone declines to place it) on this build and on
  live alike. A phone layout for the card is one of the option rounds waiting on Bailey; not invented here.
- **Content loss, disclosed.** Same seed, live 1b33971 vs this build (runs = text runs in the card):
  FFX ch1 1280x720 11 -> 8 (loses "always hits", "+ Haste", the effect line and the reason; the FFX safe
  zone gives the card 144x56 grid px there and the floored type needs more), 1600x900 11 -> 11,
  2000x1012 12 on this build; FFX-2 ch4 12 -> 12 at 1280 and 1600 (12 at 2000). Keeping all rows at 1280x720 needs a bigger zone
  (moving the guide rail or the card) = a visible layout change, options first (rule 9).

## PR-0078 (both games)

`.rres__hero-frame` is now the wedge's bounding box (left 307.2 = the polygon's 48 % foot, to the right
edge, 420 tall so a close crop bleeds off the bottom), and the wedge's own clip cuts the diagonal; the
face sits at the tile's eye position (`RESULTS_HERO_FACE`, read off A-results.jpg). `coverCropBox` moved
to `src/ui/common/coverCrop.ts` (with an `eyeX`); `victoryHeroHtml` moved to `resultsMath.ts`.
New tests in `tests/unit/ui-common-results.test.ts` (frame reaches both edges; for all ten party
portraits the painting covers the frame and the eyes and jaw clear the diagonal). Captures at 1600x900
and 2000x1012, both games, real victories via `gotoChapter(..., { auto: 'intended' })`:
`docs/screenshots/results/pr-0078-fullbleed-*.png`. The FFX-2 chapter 4 victory shows `portraits/yuna`
(the FFX-2 leader id resolves to `yuna`): pre-existing, not touched.

## FOC-05 residue (FFX only)

`coachAvoid.slideClearOf` slides the mark right of `.ig-cmd-stack` when it lands on it below the card,
never onto the card, never off the stage. Browser, fresh save, chapter 1 first turn: mark-vs-card and
mark-vs-stack overlap 0 at 1280x720, 1600x900, 2000x1012, 2560x1080 and 390x844, sampled for 3 s and
after a real ArrowDown; 0 stack pixels under the mark by elementFromPoint.
`docs/screenshots/onboarding/foc-05-clear-of-stack-{1600x900,1280x720}.png`.

## Release process

`node tools/critic-plan.mjs --paths src/app/SaveData.ts,...` answers "DEEP review of the production
candidate before deploy (save-data class)" because `030d7e1` added `Settings.ffx2AtbSpeed` (optional,
no migration). A focused pass alone cannot ship this batch; `src/battle/ffx2/**` (PR-0075) is DEEP too.

## House rule 7 (batch files, pre-batch -> now)

engine.ts 637 -> 636 (bookkeeping moved to `engineHooks.ts`), ResultsScreen.ts 421 -> 421,
portrait.ts 757 -> 757, FFXBattleHud.ts 1606 -> 1606, FFX2BattleHud.ts 1124 -> 1124, formulas.ts
399 -> 341, SaveData.ts 541 -> 544 (a comment; no more trimming of a save-data file for style),
MoveAdvisor.ts 604 -> 604. `src/debug/api.ts` 490 -> 497 is the Leblanc scene registration
(`68b8b6b`), not this batch; left alone.

## Verification

`npx tsc --noEmit` clean; full `npx vitest run` 233 files, 5,438 passed, 2 skipped; `node
tools/orphans.mjs` names none of the new modules. Browser: own Vite on 127.0.0.1:5961,
`PYREFLY_BROWSER=gpu`, stopped by its own PID.
