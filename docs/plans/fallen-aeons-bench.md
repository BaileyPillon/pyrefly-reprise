# Chapter XI — Fallen Aeons: measured benches (FFX-2 only)

## 2026-09-25, evening: option A built, 3 s of action time on the Road (read this first)

Bailey, 2026-09-25 ~18:30 EDT: "All your recommendations", which takes this chapter's **option A**:
3 s of action time on the three Road links only (`ROAD_ACTION_TIME_ON`, `ROAD_ACTION_TIME_SECONDS = 3`
in `src/data/ffx2/enemies/fallen-aeons-road.ts`; the same switch and labelled `[estimate]` as Chapter
XIII's `CLOISTER_ACTION_TIME_SECONDS`). The rule is sourced `[verified: 2 sources]`, the length is our
estimate (`research/ffx2-trema.md` §12.4). No boss number moved. Main 46970be4 was merged first
(51af2d55). `tests/unit/chapters/fallen-aeons-ship-bench.test.ts` now measures the chapter as it ships;
its "action time OFF" row (engine option 0) is the chapter before the pick.

| Fight | Line | Bench (D = 0) | Human, Wait split (0.5 s top / 1.0 s held) |
|---|---|---:|---:|
| **Chapter (1-2-3), one run, as shipped** | intended on each link | 174/200 (87 %) | **33/40 (82.5 %); 159/200 (79.5 %)** |
| 1 Shiva | intended | 200/200 | 40/40 |
| 2 Magus Sisters | intended: Darkness x2 + Dispel + heals | 167/200 | 30/40 |
| 3 Anima | intended | 200/200 | 40/40 |
| 2 Sisters | Mindy first by Drain / Cindy first by Drain / Mindy first by Attack | 0 / 0 / 3 of 200 | 0 / 0 / 0 of 40 |
| 2 Sisters | wrong: Darkness spam, no Dispel | 113/200 | 18/40 |
| Chapter | the guide's habit (0.25 s on the top list) | | 34/40 |
| Chapter | action time OFF (the chapter before the pick) | 58/200 | 31/200 (15.5 %), as the table below |
| Chapter | action time 1.5 s (not picked) | 147/200 | 115/200 |
| Chapter | preset at Lv 52 / 52 / 52 on top of action time (not picked, not built) | 191/200 | 177/200 |

- **The pick's figure reproduces exactly: 159/200 (79.5 %) at human pace**, the same number the
  options table measured with the engine option. Human losses on 200 seeds: Shiva 0, **Sisters 41**,
  Anima 0. The intended line still beats every wrong line by a wide margin (Sisters 30/40 vs 18/40
  for Darkness spam and 0/40 for any kill-one-first line), so the fight still teaches its answer.
- **No other chapter moved.** Every chapter in `CHAPTERS` and `UNLISTED_CHAPTERS` (13), seeds 1-5, the
  shipped strategy, FFX-2 chapters under both Active D = 0 and the Wait split: 90 event-log hashes
  before and after the switch; **80 byte-identical, and the 10 that moved are all
  `ffx2-fallen-aeons`**. Evidence: `docs/concepts/chapters/fallen-aeons/ship/action-time-hashes.json`.
  The FFX-2 golden (`ffx2-atb-golden.test.ts`) and every Trema test pass unchanged.
- **Disclosed, for Bailey (measured, not tuned): with action time on, Shiva and Anima forgive the
  wrong line.** `fallen-aeons-bench.test.ts`: Shiva intended 200/200 vs all-out 194/200 at bench speed
  and 40/40 vs 40/40 at human pace (Wait split); Anima intended 200/200 vs "no Shell, no Remedy"
  200/200 and 40/40 vs 40/40 (before the pick: 198 vs 186 at bench speed). The wrong lines only take
  longer (Anima 2.3 min vs 1.6). **The Sisters still separate the lines** (167 vs 113 of 200 at bench
  speed, 30 vs 18 of 40 at human pace), so the chapter's test now lives there. That file's
  "intended beats wrong on every link" check became "never worse on any link, strictly better on the
  Sisters", and it now prints the three wrong lines at human pace.
- The switch is pinned by `tests/unit/chapters/fallen-aeons-action-time.test.ts` (each of Shiva's
  turns lands exactly 9,000 ticks later than with the switch forced off), and the scope test in
  `trema-options.test.ts` now allows the Cloister and the Road formations only.

## 2026-09-25, later: re-measured on main 3c4cd1f6 (read this first)

Main moved under the first re-measure: **07af1f90 (decision sheet item 4 A1) makes an enemy hit close
an open command menu** under Active and on the Wait split's top list, and the bench helper honours it
(`engine.inputValid` after each menu spell, then a fresh menu). Main was merged into this branch
(00e49f02) and `tests/unit/chapters/fallen-aeons-ship-bench.test.ts` re-run unchanged. Bench-speed rows
do not move (no menu is open at D = 0); every human row moves down a little.

| Fight | Line | Bench (D = 0) | Human, Wait split (761d3eb0) | Human, Wait split (main 3c4cd1f6) |
|---|---|---:|---:|---:|
| **Chapter (1-2-3), one run** | intended on each link | 58/200 (29 %) | 8/40; 36/200 (18 %) | **5/40 (12.5 %); 31/200 (15.5 %)** |
| 1 Shiva | intended | 183/200 | 39/40 | 39/40 |
| 2 Magus Sisters | intended | 84/200 | 8/40 | 8/40 |
| 3 Anima | intended | 198/200 | 39/40 | 40/40 |
| Chapter | the guide's habit (0.25 s on the top list) | | 7/40 | 5/40 |
| 2 Sisters | the guide's habit | | | 9/40 |
| Chapter | OPTION action time 1.5 s | 147/200 | 117/200 | 115/200 (57.5 %) |
| Chapter | OPTION action time 3 s | 174/200 | 164/200 | **159/200 (79.5 %)** |
| Chapter | OPTION preset at Lv 52 / 52 / 52 | 99/200 | 61/200 | 58/200 (29 %) |

Human losses on the Road, 200 seeds: Shiva 22, **Sisters 146**, Anima 1. Still under the 25 % gate;
the method check (`fallen-aeons-winnability-method-check.md`) stands with these numbers, and its one
question for Bailey is unchanged. Nothing built; no boss number moved.

## 2026-09-25: the ship gate's re-measure on 761d3eb0 (before item 4 A1)

Printed by `tests/unit/chapters/fallen-aeons-ship-bench.test.ts` (branch
`chapter-fallen-aeons-ship-0925`, main 761d3eb0), which reads the registered record (`FFX2_FALLEN_AEONS`:
build and first formation). Human pace = the live default, **Wait split**, 1.5 s a menu (0.5 s on the
top command list with the clock running, 1.0 s held), the model the Trema benches use. The chapter
row is one unbroken run of the Road through the Save Sphere restore; a link alone equals its FA3 retry.

| Fight | Line | Bench (D = 0) | Human, Wait split |
|---|---|---:|---:|
| **Chapter (1-2-3), one run** | intended on each link | 58/200 (29 %) | **8/40 (20 %); 36/200 (18 %)** |
| 1 Shiva | intended | 183/200 | 39/40 |
| 2 Magus Sisters | intended: Darkness x2 + Dispel + heals | 84/200 | 8/40 |
| 3 Anima | intended | 198/200 | 39/40 |
| 2 Sisters | Mindy first by Drain / Cindy first by Drain / Mindy first by Attack | 0 / 0 / 0 of 200 | 0 / 0 / 0 of 40 |
| 2 Sisters | wrong: Darkness spam, no Dispel | 54/200 | 5/40 |
| Chapter | the guide's habit (0.25 s on the top list) | | 7/40 |
| Chapter | OPTION action time 1.5 s | 147/200 | 117/200 |
| Chapter | OPTION action time 3 s | 174/200 | **164/200 (82 %)** |
| Chapter | OPTION preset at Lv 52 / 52 / 52 | 99/200 | 61/200 |

- **Under the 25 % gate at human pace**, so the method check is written:
  `docs/plans/fallen-aeons-winnability-method-check.md` (loss anatomy, the sourced options, one
  question for Bailey). Nothing is built; no boss number moved.
- **The Sisters lose 141 of 164 human runs.** They take about 36 turns to the party's 12 in the 40 s a
  loss lasts, and Sandy's physicals plus Mindy's spells do the killing (Delta Attack 0.5 a loss).
- **Moved since the 2026-09-24 table below, by 881d4548 (FFX-2 magic never rolls), not by this
  track:** Anima intended 173 -> 198, Anima wrong 109 -> 186, the Road 51 -> 58. Every other bench-speed
  row reproduces exactly (`fallen-aeons-bench.test.ts` re-run today).
- **Helper changes (additive, test only):** `fallenAeonsDrive.ts` returns the event log, takes an
  optional `build`, and has two optional line switches (`guardFirst`, `curtains`); existing lines replay
  unchanged.
- **For the ship layer:** the chapter's guide must carry the Wait-split habit rule exactly as main will
  ship it: "Pick a command at once. Until you do, the clock still runs."
  (`WAIT_SPLIT_HABIT_RULE`, `src/data/guides/ffx2-wait-habit.ts` on `decisions-0925`). Measured, the
  habit alone does not move this chapter (7/40 at 0.25 s against 8/40 at 0.5 s).

## 2026-09-24: the first pass (history)

**Measure, never tune** (plan `docs/plans/chapter-fallen-aeons-review.md` §9; memory rule
"never weaken a boss"). Every number below was produced by running the engine
(`tests/unit/chapters/fallen-aeons-bench.test.ts`, lines in `tests/unit/helpers/fallenAeonsDrive.ts`)
on 2026-09-24. No boss number was changed to move any of them. Game case: **FFX-2 only**.

## T0 — Darkness against the Sisters' evasion (FA7)

Hit chance per landing, the Chapter V preset as shipped (`hitPercent`, `x2-dark-knight-darkness`
has `canMiss: true`):

| Attacker | Mindy (Eva 76) | Sandy (Eva 33) | Cindy (Eva 4) | Shiva (Eva 58) | Anima (Eva 0) |
|---|---:|---:|---:|---:|---:|
| Rikku / Paine, Dark Knight Lv 48 / 50 (Acc 104, Luck 12) | 36 % | 79 % | 100 % | 52 % | 100 % |
| Yuna, White Mage Lv 46 (Acc 102, Luck 11) | 33 % | 76 % | 100 % | 49 % | 100 % |

An open chain window removes evasion, so a second Darkness right behind the first lands. **Not
changed:** research §4.2 and §5 say "Darkness cannot be evaded", but none of the five wiki pages
says so (plan Review R1), and Split_Infinity's guide returned HTTP 403 today. FA7 asks for 2+
sources before an FFX-2 data change that would touch Chapters 4 to 6; there are 0.

## The table (200 seeds a row unless marked; bench speed = the default Wait at 0 ms a menu)

Each link on its own is also the FA3 retry of that link (links 2 and 3 open through the Save
Sphere restore). "Overdrives" = Diamond Dust + Oblivion. **Re-measured 2026-09-24 after the repair
pass** (verifier findings): Oblivion is now `canMiss: false` (hard rule 5: every Overdrive always
hits), and a Sister's Regen tick adds 5 to her counter only when it heals her, once per payout.
The first-pass numbers are in brackets where they moved.

| Link | Line | ATB | Wins | Overdrives / fight | Delta Attacks / fight | Avg ticks |
|---|---|---|---:|---:|---:|---:|
| 1 Shiva | intended: Protect+Shell, Darkness x2, heals, Remedy on Stop | Wait, D=0 | 183/200 | 0.65 | 0.00 | 150371 |
| 1 Shiva | wrong: all-out (no cures, no Remedy) | Wait, D=0 | 58/200 | 0.67 | 0.00 | 150943 |
| 2 Sisters | intended: Darkness x2 + Dispel + heals (3-guide clear) | Wait, D=0 | 84/200 [78] | 0.00 | 0.37 | 163916 |
| 2 Sisters | alternative: kill Mindy first with Attack + Dispel | Wait, D=0 | 0/200 | 0.00 | 0.64 | 161841 |
| 2 Sisters | alternative: kill Mindy first with Drain + Dispel (new) | Wait, D=0 | 0/200 | 0.00 | 0.67 | 172169 |
| 2 Sisters | wrong: Darkness spam, no Dispel | Wait, D=0 | 54/200 [41] | 0.00 | 0.73 | 169053 |
| 3 Anima | intended: Shell+Protect, Darkness x2, heals, Remedy after Pain | Wait, D=0 | 173/200 [176] | 2.42 | 0.00 | 266133 |
| 3 Anima | wrong: no Shell, no Remedy | Wait, D=0 | 109/200 [95] | 2.79 | 0.00 | 284369 |
| 2 Sisters | intended, under FA8 b (landed damage only) | Wait, D=0 | 97/200 [88] | 0.00 | 0.27 | 183181 |
| 2 Sisters | wrong, under FA8 b | Wait, D=0 | 80/200 [52] | 0.00 | 0.60 | 199187 |
| Road (1-2-3) | intended on each link, one run, no retry | Wait, D=0 | 51/200 | lost at Shiva 17, Sisters 125 [128], Anima 7 [4] | | |
| 1 Shiva | intended | Active, D=1.5 s (40 seeds) | 26/40 | 1.15 | 0.00 | 220683 |
| 1 Shiva | intended | Wait split, D=1.5 s, 0.5 s on the top list (40) | 39/40 | 0.78 | 0.00 | 164699 |
| 1 Shiva | intended | Wait (whole menu), D=1.5 s (40) | 38/40 | 0.68 | 0.00 | 157826 |
| 2 Sisters | intended | Active, D=1.5 s (40) | 7/40 | 0.00 | 0.45 | 148434 |
| 2 Sisters | intended | Wait split, D=1.5 s (40) | 8/40 [6] | 0.00 | 0.60 | 137064 |
| 2 Sisters | intended | Wait (whole menu), D=1.5 s (40) | 14/40 | 0.00 | 0.42 | 157903 |
| 3 Anima | intended | Active, D=1.5 s (40) | 7/40 [5] | 3.55 | 0.00 | 376506 |
| 3 Anima | intended | Wait split, D=1.5 s (40) | 31/40 [32] | 2.90 | 0.00 | 326735 |
| 3 Anima | intended | Wait (whole menu), D=1.5 s (40) | 33/40 [37] | 2.35 | 0.00 | 265328 |

## Measured facts the first pass did not disclose (verifier, 2026-09-24)

- **Heavenly Strike's Stop and Stare's Poison almost never land with the Chapter V preset.** The
  linear Status 1 formula (combat-core §2.6a) is boss level x 5 + chance - girl level x 5. Shiva
  (Lv 41, Stop chance 30) lands Stop on Yuna (Lv 46) 4.7 % of the time and never on Rikku (48) or
  Paine (50); Anima (Lv 43, Poison chance 25) lands Poison on Yuna 10.4 % and never on the other
  two (2000 seeds each). So the sourced Stop puzzle and the FA16 "Stop lands" callout rarely
  happen. Levels, chances and formula are sourced; the preset's levels are our `[estimate]`
  (research §6, "do not invent a separate level"). Not changed.
- **Passado takes about 81.8 % of current HP** (80.8 to 82.7 % over 200 seeds per girl), because
  each of its 15 hits of 1/16 builds the FFX-2 chain bonus. 15 plain hits would take 62.1 %
  (leave 37.9 %). The engine's result matches Split_Infinity's and GamerGuides' observed 81.5 %.
  It never kills. F-6 stays open as a source conflict; nothing was tuned.
- **Oblivion** was a rolling physical move (about 92 to 93 % a blow). It is Anima's action-counter
  Overdrive, so hard rule 5 makes it `canMiss: false`; F-7's "physical" still decides that
  Protect, not Shell, reduces it.
- **"Kill Mindy first" was measured only with Attack** in the first pass. The preset's one
  single-target spell, Drain, is now measured too: 0/200. Drain deals about 120 to Mindy (9,788 HP)
  and, as shipped, **rolls to hit against her Evasion like the Attack (36 %)**: see the rule 5
  finding below. The guides' Mindy-first routes (Spare Change, Sword Dance, Black Mage spells)
  need dresspheres or abilities the Chapter V preset has not learned, so they are not measured.

## Rule 5 finding outside this track (for the driver; not changed here)

`hitPercent` (`src/battle/ffx2/hit.ts`) returns 100 only for `canMiss: false`, a fixed
`accuracy` or `formula: 'none'`. **35 FFX-2 party abilities with `damageType: 'magical'` leave
`canMiss` unset and therefore roll against Evasion**, among them every Black Mage spell,
`x2-dark-knight-drain`, `x2-dark-knight-demi`, `x2-dark-knight-black-sky`, the Gun Mage blue
magic, `x2-shared-holy`, `x2-shared-flare` and `x2-shared-ultima`. Hard rule 5 says magic always
hits. Fixing it changes Chapters 4 to 6 (and the Sisters' numbers), so it needs its own change
with an absence test and a bench re-run; this track owns only the new Chapter XI files.

## What the numbers say (for Bailey; options, not decisions)

- **Shiva and Anima:** the sourced clear wins about 9 in 10 at the
  default Wait, and the credibly wrong line loses far more often. Under **Active** at a human's
  1.5 s a menu both fall hard (Anima 7/40): the same warning as Chapter VI's 0/40.
- **The Sisters are the wall.** The sourced clear (two Darkness, Dispel, heals) wins 84/200. "Kill Mindy
  first" with what the preset has (Attack or Drain) wins 0/200: both land on Mindy 36 % of the
  time (T0 and the rule 5 finding), and Drain deals about 120 a cast. In the one log read turn by turn (seed 3, before the
  healer line used items) the three Sisters took 20 turns to the two Dark Knights' 6, and attrition
  (Passado, Demi, Absorb) wiped the party with no Delta Attack at all.
- **FA8** moves the Sisters a little (84 → 97 under reading b), and the wrong line more (54 → 80).
- **FA3 matters:** in one unbroken run of the Road, 125 of 149 losses happen at the Sisters. With
  the retry at the lost link the player retries the Sisters, not Shiva.
- Measured options if the Sisters' rate is too low (none is built; each needs a yes): (a) leave
  it as measured; (b) the FA7 change (Darkness cannot miss) if a second
  source turns up; (c) a line change on our side, such as the Chapter V preset's levels, which are
  our `[estimate]`. **No boss number is on this list.**
