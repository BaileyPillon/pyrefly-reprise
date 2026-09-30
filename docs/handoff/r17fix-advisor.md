# Handoff: r17fix-advisor (PR-0269, the Sin races and the move advisor)

Branch `r17fix-advisor` (worktree `D:/pyrefly-advisor-v4`), from `main` 29c18cd3. Not merged, not pushed.
2026-09-30.

> **Bailey, 2026-09-27 (D-271/D-272):** *"the advisor needs to be WAY WAY smarter please"*.
> Round 17, PR-0269 (major): following the NEXT BEST MOVE card every turn loses the Sin races,
> Chapter XVIII 5 of 5 and Chapter XVII 2 of 2 on the candidate, while a sensible real-key line wins both.

**Game case (rule 14): FFX only.** Both chapters are FFX (CTB, Overdrive Sin's clock, the Fins' chain).
Every new rule reads `raceOf(state)`, which is `null` on an FFX-2 board (`state.game`) and on every
other FFX chapter, and the forecast change touches only a row the data marks `scriptedGameOver`
(Giga-Graviton alone). FFX-2 and FF7 are unchanged. No boss number, no game data and no card words changed.

## Result

| PR-0269 | Before | After | Verdict |
|---|---:|---:|---|
| **XVIII Sin: the Face**, card in game (v4, mini), seeds 1-200 | 43/200 (21.5 %) | **73/200 (36.5 %)** | **FIXED (the cause); acceptance not met** |
| XVIII, v3 fallback card, seeds 1-200 | 44/200 (22 %) | **73/200 (36.5 %)** | |
| XVIII, seeds 1-40 (v4 / v3) | 8 / 10 | 13 / 14 | |
| XVIII, route17 by real keys, production build, 1600x900, seed 1 | lost, Sin 17,757 HP left (round 17) | lost, **Sin 883 HP left** | |
| **XVII Sin: the Fins and the Core**, v4 (mini), seeds 1-40 | 0/40 | **5/40** | **PARTLY**: v4 better, v3 unchanged |
| XVII, v4, seeds 41-80 | 0/40 | **3/40** (pooled 1-80: **0 -> 8**) | |
| XVII, v3 fallback, seeds 1-40 / 41-80 | 1/40 / 1/40 | 1/40 (unchanged) | NOT FIXED on v3 (measured, reason below) |

The acceptance check in round 17 ("advisor-following route wins XVIII and XVII on at least 3 of 4
seeds") is **not met, and cannot be met by the card alone**: the chapter's own sensible line (the line the card
follows) wins 31 % in the link-4 bench (`docs/plans/sin-link4-bench.md`, 62/200). After this fix the card
wins 36.5 %, above its own line. Beyond that is a different line (aeon Overdrives, a gauge plan) or the S-1
data question (12th or 13th turn), both Bailey's, see Questions.

## 1. XVIII, cause proven: the forecast read Giga-Graviton as a lethal hit to heal against

Run first (node, the game's card, seed 1, `critic/bench/advisor-v4/zz-r17-diag.tmp.test.ts`, scratch):
on Sin's last turn (`sin.turnsLeft` 1) the card put **Al Bhed Potion, Hi-Potion, Remedy** on top with the
`saves-from-lethal` fact, three of the party's last actions, and lost with Sin at **8,740 HP** (each action
is about 2,500 to 3,700). Giga-Graviton is 100 % of max HP plus Death 255, and **the Game Over is the script**,
whatever Auto-Life or an aeon does (research/ffx-sin.md §3.4 [verified: 4 sources]; the data marks the row
`extra.scriptedGameOver`). No row saves anyone from it; the only answer is damage in time.
Round 17's own browser turn log (`critic/rounds/round-17/evidence/sin-face-win/turn-log.json`, turns 60-62)
shows the same three Al Bhed Potions in a row at Sin 20,215. Bench numbers: "lethal miss" 81 before, 0 after.

**Fix.** `src/engine/tactics/advisor-forecast.ts`: the FFX forecast skips a predicted move whose ability is
marked `scriptedGameOver` (`scriptedGameOver()` exported). With only that change the card wins 12/40 (was 10/40).

## 2. XVIII: the clock term on the card (v3, and so v4's default)

`src/engine/tactics/advisor-race.ts` (new, 110 lines), wired in one line of `advisor.ts` (no growth: 1928 to
1925 lines; the `advisor-plan` import went to one line):

- `raceOf(state)`: `{ kind: 'clock', turnsLeft }` on Overdrive Sin (the engine's `sin.turnsLeft`, S-1's 13th
  turn by Bailey's default), `{ kind: 'hp' }` while a Fin, Genais or the Core stands, else `null`.
- `stable(state, intent)`: no living active member is lethal to the forecast's next enemy action.
- `raceLift`: on the clock, with the party stable, a top row that **only restores HP** (no damage, no revive,
  no status taken off, not a proved save) gives way to the row that deals the most damage; and **on Sin's last
  turn a raise** gives way too (the raised ally re-enters at 3x base delay, research/ffx-combat-core.md §1.6,
  `turnQueue.ts#onRevived`, so Giga-Graviton comes first). Found by the browser run: a Phoenix Down on the last
  turn with Sin at 2,406 HP.
- Cures (Soft, Remedy, Holy Water), buffs, Breaks, switches and a lethal save are never lifted.
- The lifted row keeps **its own existing sentence**: `override` is set only for v4's lift, so the card never
  says "the long plan is still X-Potion". No new words.

## 3. XVIII and XVII: the clock term in advisor v4

- `advisor-v4/value.ts#lostValue` (the race credit): on a race board a lost future is worth `raceCredit` (0.4)
  times the share of the chain's enemy HP it took off since the root, always below any win; 0 everywhere else,
  so other chapters' searches are byte-for-byte what they were. This is what moved the Fins (0 to 5 of 40): a
  wipe on the Core is no longer valued the same as a wipe on the Left Fin.
- `advisor-race.ts#offRaceLine` (rail, `candidates.ts`): on the clock with a stable party, a challenger must
  deal damage or raise. Without it v4 lifted Al Bhed Potions and Remedies over Attack and Firaga (27 switches on
  seeds 1-6).
- `advisor-race.ts#raceHolds` (`search.ts`, `skipped: 'race'`): on the clock with a stable party, v3's top row
  that already works on the race (damage, a Break on Sin, an Overdrive, a switch) stands without a search. The
  2-future answers there were noise (Armor Break and Mental Break to Power Break, Dragon Fang to Attack) and cost
  wins: v4 43 -> 58/200 without the hold, **69 -> 73/200** with it. It also cuts the worker's time on Sin (p50 33
  to 5 ms).

## Measured and rejected (kept out, with numbers)

| Variant | Where | Result | Why rejected |
|---|---|---|---|
| The heal lift on the Fins' HP race (one-move forecast) | XVII, v3, seeds 1-10 | link-1 wipes on 3 seeds that the old card cleared | Gravija (75 % of current, cannot kill) is "stable", then Ram kills: one enemy move is not the Fins' lethal range. v3 on the Fins stays as it was. |
| Zombie cure counted as upkeep | XVIII, 200 seeds | v3 70, v4 65 (vs 68 / 69) | noise, more missed revives (13 vs 6) |
| Gaze's reach (Sin's counter) always in "stable" | XVIII, 200 seeds | v3 54 (vs 73) | heals come back and cost the race |
| Gaze's reach only when "GAZE IN 1" | XVIII, 400 seeds | v3 129, v4 144 (vs 140 / 137) | equal within noise; the simpler rule is kept |

## Every other FFX chapter (the scorecard must not drop)

`worker-path` scorecard, mini budget (the game's), seeds 1-40, after the change:

| Chapter | v3 | v4 |
|---|---:|---:|
| I seymour-flux | 19 | 37 |
| II yunalesca | 37 | 39 |
| III braskas-final-aeon | 39 | 40 |
| VII seymour-anima-macalania | 37 | 38 |
| VIII evrae-airship | 40 | 40 |
| IX yojimbo-cavern | 40 | 40 |
| X seymour-natus | 38 | 37 |
| XII seymour-omnis | 24 | 32 |
| XIV isaaru-via-purifico | 35 | 38 |

"Before" is the same run with every change of this branch switched off by a measurement-only global (removed
before the commit; it reproduced the untouched code exactly on Sin, 10/40 and 8/40): **all 18 rows
(9 chapters x v3/v4) are identical in every field** (wins, win seeds, links, decisions, v4 shown, switched,
lethal-save misses, missed revives, menu, aim, refusals); only the worker timings differ. Nothing dropped
anywhere. By construction nothing here can differ: `raceOf` is `null` on these boards, and the forecast
filter only drops a row marked `scriptedGameOver`.

## Real keys, production build (headless Chromium, PYREFLY_BROWSER=gpu, port 8720)

- route17 (round 17's harness, imports pointed at this worktree), `sin-face win --size=1600x900 --seed=N`:
  seeds 1-4 all lost by Giga-Graviton. Sin's HP at the last menu (before its action): 2,412 (then
  **883** at Giga-Graviton, from the battle log), 11,057, 20,218 and 2,881. Round 17 on the candidate, same
  reading: seed 1 17,757; its confirmer's seeds 2 and 3 ended at 10,304 and 16,353. This harness fails every Overdrive minigame (the confirmer's
  note), so it is a floor. 0 errors, 0 seams, every menu reached.
- `critic/bench/advisor-v4/real-keys.mjs --chapter=sin-face --menus=12`: v4 ready at every menu (12/12), the card
  identical 1.5 s after opening at every menu (no flip), 0 errors. The menu never waits: the lift is computed
  inside the same `buildAdvisorView` call as before, and the search only got cheaper on Sin.
- Frames: `docs/screenshots/r17fix-advisor/` (advisor at the first menu, mid-fight with the HUD's own
  "13 TURNS LEFT" clock and "GAZE IN 5", results).

## Tests

`tests/unit/advisor-race.test.ts` (6): boards reached by the chapter's own line, which this change does not
touch. Before the fix (all changes off) the behavioural ones fail: the last turn's card carried
`saves-from-lethal` (expected false), and the heal board's card was **X-Potion**.
`npx tsc --noEmit` clean. `tools/orphans.mjs`: 24, as on main.

## Not fixed, and why

1. **XVII on the v3 card** (1/40): the heal lift loses there (above). The Fins' losses are the line's
   attrition: 60-77 heals and up to 12 raises a run, Yuna swinging, the chain carried into Genais at low HP.
   That is the line (`sin-fins-core.ts`, research §8), not a card that ignores a race. v4 (the card the game
   shows) gains through the race credit.
2. **"3 of 4 seeds"** on either chapter: above the sourced line's own ceiling (31 % on XVIII). Needs Bailey
   (below).
3. **Stalemates on XVII with v4.** The engine's stalemate watch (`engine-end.ts`, no new enemy-HP minimum
   for its window; the result reads `escape`, "The battle cannot be won from here.") ends 12 of v4's 80 runs
   now (6 + 6) where every one of the 80 was a defeat before; v3 has 3 + 4 of them, before and after. Every
   such run was a loss before too; wins went 0 -> 8. Why v4's line stalls there (a party that no longer dies
   but no longer lands damage on the Core) is not looked at here.

## Questions for Bailey

- Wording: the HUD already shows the clock ("13 TURNS LEFT", "GAZE IN n"). Round 17 suggested a race line on
  the card; two mock-ups would be a countdown chip on the card or one line "race: damage first". Not built.
- A stronger XVIII line (aeon Overdrives, a gauge plan) is new content for the line and the guide (rule 10).
- S-1 (Giga-Graviton on the 12th or 13th turn) still decides the chapter; the Steam check is his.

## Re-run

```
V4W_CHAPTERS=sin-face V4W_SEEDS=200 V4W_BUDGET=mini V4W_TAG=r17-after-face200-mini node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/worker-path.test.ts
V4W_CHAPTERS=sin-fins-core V4W_SEEDS=40 V4W_BUDGET=mini V4W_TAG=r17-after-fins-mini node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/worker-path.test.ts
node node_modules/vitest/vitest.mjs run tests/unit/advisor-race.test.ts
```
Results (`critic/bench/advisor-v4/results/`): `r17-before-mini.json` (both Sin chapters, seeds 1-40, untouched
code), `r17-before-face200-mini.json` / `r17-after-face200-mini.json`, `r17-after-fins-mini.json`,
`r17-before-fins41-mini.json` / `r17-after-fins41-mini.json`, `r17-before-others-mini.json` /
`r17-after-others-mini.json`. Rejected variants and scratch harnesses are parked in
`F:/pyrefly-parked/2026-09-30/r17fix-advisor/` (MOVED.txt); raw browser evidence in
`D:/Tools/pyrefly-scratch/r17fix-advisor/`.

## Checks

- `npx tsc --noEmit` clean. `tools/orphans.mjs`: 24 orphaned, as on main (the new module is imported).
- Full `npm test` once: 691 files passed, 2 failed, both unrelated and both pass alone (28/28):
  `audio-manifest-io` (EPERM on a temp lock file under load) and `strategy-ffx2-bahamut` (the known 15 s
  timeout of an FFX-2 simulation under load).
- `node tools/critic-plan.mjs --paths` before any release: the advisor and its v4 search changed (the card).
