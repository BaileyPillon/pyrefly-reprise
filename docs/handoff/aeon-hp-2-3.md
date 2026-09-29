# Aeon HP in Chapters II and III: the sourced §6.4.3 rows (D-274)

**Game case: FFX only** [AGENTS.md rule 14]: summoned aeons exist only in FFX.
Branch `aeon-hp-2-3` (worktree `D:/pyrefly-aeon-hp`). Not merged, not deployed.

## What changed

Bailey, 2026-09-28: "all your recommendations" (the driver's item: move Chapters II and III's aeon
HP to the same sourced table as Gagazet, so the aeons do not get weaker later in the story).

- Code stage, commit `578e7f22`: `src/data/ffx/builds/late-aeon-rows.ts` ships
  `research/ffx-combat-core.md` §6.4.3's Zanarkand Dome (N = 300) block for Chapter II and its
  inside-Sin (N = 360) block for Chapter III, every stat of the row, `[estimate]` in §6.4.3's own
  sense (the same tag as Chapter I's Gagazet rows). `LATE_AEON_ROWS = 'floor'` reaches the rows
  shipped until 2026-09-28 (`ffx-yunalesca.md` §12's battle-count floor) byte for byte, for
  measurement only (`tests/unit/helpers/late-aeon-rows.vitest.config.ts`).
- Chapter III's possessed aeons mirror the live roster (`ffx-bfa-yu-yevon.md` §2.2; §6.4.3 says the
  inside-Sin block is their stats too), so they move with it. Chapter XII clones III's aeons.
- No boss number is touched.

| Aeon | II floor -> sourced | III floor -> sourced |
|---|---:|---:|
| Valefor | 1,341 -> 1,674 | 1,465 -> 1,886 |
| Ifrit | 1,797 -> 2,275 | 2,007 -> 2,585 |
| Ixion | 1,787 -> 2,251 | 1,981 -> 2,551 |
| Shiva | 1,596 -> 2,004 | 1,760 -> 2,266 |
| Bahamut | 2,542 -> 3,218 | 2,840 -> 3,657 |

(For comparison, Chapter I's Gagazet rows: Valefor 1,530 ... Bahamut 2,935. Every other stat of each
row is in `late-aeon-rows.ts`.)

## Measure stage (2026-09-28), 200 seeds a row

`PYREFLY_MEASURE=1 node node_modules/vitest/vitest.mjs run tests/unit/chapters/aeon-hp-2-3-bench.test.ts`
(real engine and data; the whole chain from its first link, the screen's own carry; FFX is CTB, so
the human, Active and bench speeds are one column). **intended** = the shipped `intendedStrategy`;
**card** = the advisor card-follower (top suggestion every turn, planner on).

| Chapter | Driver | Wins floor | Wins sourced | Lost -> won | Won -> lost | Turns, all (floor -> sourced) | Losses where |
|---|---|---:|---:|---:|---:|---:|---|
| II Yunalesca | intended | 195/200 | **200/200** | 5 | 0 | 214.9 -> 183.4 | link 1 (5 -> 0) |
| II Yunalesca | card | 165/200 | **183/200** | 25 | 7 | 243.4 -> 219.1 | link 1 (35 -> 17) |
| III Braska's Final Aeon | intended | 193/200 | 194/200 | 7 | 6 | 331.2 -> 452.2 | link 1 (7 -> 6) |
| III Braska's Final Aeon | card | 193/200 | 194/200 | 6 | 6 | 330.6 -> 447.8 | link 1 (7 -> 6) |

Chapter III turns per link on wins (intended; card is within 2 turns of it):

| Link | 1 BFA | 2 | 3 | 4 | 5 | 6 | 7 Yu Yevon |
|---|---:|---:|---:|---:|---:|---:|---:|
| floor | 218.0 | 6.0 | 4.9 | 11.0 | 11.3 | 62.6 | 16.1 |
| sourced | 217.0 | 15.4 | 47.1 | 36.5 | 42.9 | 79.8 | 15.1 |

Every run in every row changed its battle log (200/200, card II 198/200). Summons per run are
unchanged (II about 4, III 5). Declines 0 everywhere.

**Read-out.** Chapter II gets easier on both drivers (the intended line now always wins; the
card-follower wins 18 more seeds). Chapter III's win rate is flat (every loss is still at link 1,
Braska's Final Aeon itself), but **the possessed-aeon gauntlet (links 2 to 6) takes about 120 more
engine turns** on a win (331 -> 452, +37 percent), because the possessed aeons mirror the roster and
now carry the inside-Sin rows too (research: §6.4.3 and `ffx-bfa-yu-yevon.md` §2.2 say so). That is a
length cost, not a difficulty cost, and it is what the sources say. Measured, not tuned: if Bailey
finds the gauntlet too long, the answer is measured options for Bailey, never a changed number.

### Chapter XII (Seymour Omnis), floor vs sourced

`LATE_AEON_ROWS=<arm> node node_modules/vitest/vitest.mjs run --config tests/unit/helpers/late-aeon-rows.vitest.config.ts tests/unit/chapters/omnis-bench.test.ts`

The two tables are **byte-identical**: intended 127/200, break-brute 1/200, weakness 142/200, wrong
0/200, intended with no ring 0/200. None of the bench's lines summons, so the aeon rows cannot reach
it. (The switch itself was confirmed to reach the builds: `data-ffx-builds.test.ts` fails its two
sourced-row checks under `LATE_AEON_ROWS=floor`.) The code stage's hash check did move 13 of 16
seymour-omnis logs, on the policies that do summon.

## Goldens and pinned seeds

None re-pinned in this stage: the full suite on the branch (merged with `origin/main` at `1a81a8ed`)
had 9,623 passing and one failure, `strategy-ffx2-bahamut.test.ts` "heal-only route" timing out at
15 s under full-suite load. That file is FFX-2 and cannot reach FFX aeon rows; alone it passes 19/19
in 8.8 s. The code stage (`578e7f22`) already carried the test moves (`data-ffx-builds` grinding rule,
`late-aeon-rows.test`).

## Real-key check (production build)

`vite build` into a scratch outDir, `vite preview` on port 7920 (stopped by PID), headless Chromium
(`PYREFLY_BROWSER=gpu`). Setup by the debug API (seed 1, chapter, cutscenes skipped), then real keys:
the others Attack, Yuna opens Summon, picks the aeon, Enter.

| Chapter | Aeon | HUD row | Battle state | Console errors |
|---|---|---|---|---:|
| II Yunalesca | Bahamut | `Bahamut 3218/3218 81/81` | hp 3,218 / max 3,218 | 0 |
| III Braska's Final Aeon | Ifrit | `Ifrit 2585/2585 59/59` | hp 2,585 / max 2,585 | 0 |

Both match §6.4.3 (Zanarkand Bahamut 3,218; inside-Sin Ifrit 2,585). Screenshots:
`docs/screenshots/aeon-hp-2-3/ch02-1-summon-list.jpg`, `ch02-2-bahamut-hp.jpg`,
`ch03-1-summon-list.jpg`, `ch03-2-ifrit-hp.jpg`.

## Checks

`tsc --noEmit` clean; `node tools/orphans.mjs` 24 orphaned (as main); full suite as above.

## Open

- Chapter III's possessed-aeon gauntlet is about 37 percent longer in engine turns (above). Disclose
  to Bailey with the merge; no number moves without Bailey's word.
- Merge into main, release and review belong to the driver.

## CHECK (independent, 2026-09-28, did not build it)

FFX only (rule 14). Checked on a6878731 (branch 1 ahead of origin, not pushed). Verdict: **0 blockers**.

- **Rows vs research:** all 50 cells of `ZANARKAND_SOURCED_ROWS` and `INSIDE_SIN_SOURCED_ROWS` match
  `research/ffx-combat-core.md` §6.4.3 (Yunalesca N = 300; inside Sin N = 360), Luck 17 per §6.4.3's
  column; the tag is `[estimate]` in §6.4.3's own sense, as Chapter I's Gagazet rows. The floor
  functions reproduce the removed `zanarkand.ts` / `dreams-end.ts` rows value for value.
- **No drop later in the story:** every stat of every aeon is non-decreasing Gagazet -> Zanarkand ->
  inside Sin (checked cell by cell); `data-ffx-builds` pins it and fails its two checks under
  `LATE_AEON_ROWS=floor`, as it should (reproduced).
- **Possessed aeons / Chapter XII:** Chapter III's possessed aeons mirror the roster (§6.4.3 says the
  inside-Sin block is their stats; `ffx-bfa-yu-yevon.md` §2.2), and `garden-of-pain.ts` clones
  `dreamsEndBuild.aeons`, so both follow the research. No boss number touched.
- **Benches reproduce exactly:** 200-seed `aeon-hp-2-3-bench` intended and card rows are identical to
  the table above (wins, turns, lost->won / won->lost, per-link turns). `omnis-bench` under
  `floor` and `sourced` gives identical tables (intended 127, break-brute 1, weakness 142, no ring 0).
- **Goldens:** no golden or pinned-seed file changed on the branch (test diff = the new bench, the
  new row test, the two helper files, `data-ffx-builds`).
- **Real keys:** screenshots read: Chapter II Bahamut 3218/3218 HP, 81/81 MP; Chapter III Ifrit
  2585/2585, 59/59 (match §6.4.3). Not re-driven in a browser.
- **tsc** clean; **orphans** 24 (as main); targeted files 3/3 (24 tests); **full suite once:** 9,623
  passed, 1 failed = `strategy-ffx2-bahamut` "heal-only route" 15 s timeout under load (FFX-2, no
  FFX-2 file on the branch), 19/19 alone in 9.3 s.
- **git merge-tree** against origin/main: clean.
- Minor: `src/engine/tactics/yunalesca.ts` ~L561 keeps the old 1,341 to 2,542 HP arithmetic, labelled
  as the pre-2026-09-28 rows; historical, harmless.
- Push not done by this check: pushing the public repo waits for the driver or Bailey.
