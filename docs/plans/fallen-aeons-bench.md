# Chapter XI — Fallen Aeons: measured benches (FFX-2 only)

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
