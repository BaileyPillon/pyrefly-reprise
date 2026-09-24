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
Sphere restore). "Overdrives" = Diamond Dust + Oblivion.

| Link | Line | ATB | Wins | Overdrives / fight | Delta Attacks / fight | Avg ticks |
|---|---|---|---:|---:|---:|---:|
| 1 Shiva | intended: Protect+Shell, Darkness x2, heals, Remedy on Stop | Wait, D=0 | 183/200 | 0.65 | 0.00 | 150371 |
| 1 Shiva | wrong: all-out (no cures, no Remedy) | Wait, D=0 | 58/200 | 0.67 | 0.00 | 150943 |
| 2 Sisters | intended: Darkness x2 + Dispel + heals (3-guide clear) | Wait, D=0 | 78/200 | 0.00 | 0.45 | 157303 |
| 2 Sisters | alternative: kill Mindy first with Attack + Dispel | Wait, D=0 | 0/200 | 0.00 | 0.92 | 133234 |
| 2 Sisters | wrong: Darkness spam, no Dispel | Wait, D=0 | 41/200 | 0.00 | 0.83 | 147394 |
| 3 Anima | intended: Shell+Protect, Darkness x2, heals, Remedy after Pain | Wait, D=0 | 176/200 | 2.36 | 0.00 | 257710 |
| 3 Anima | wrong: no Shell, no Remedy | Wait, D=0 | 95/200 | 2.93 | 0.00 | 291391 |
| 2 Sisters | intended, under FA8 b (landed damage only) | Wait, D=0 | 88/200 | 0.00 | 0.34 | 171114 |
| 2 Sisters | wrong, under FA8 b | Wait, D=0 | 52/200 | 0.00 | 0.80 | 169639 |
| Road (1-2-3) | intended on each link, one run, no retry | Wait, D=0 | 51/200 | lost at Shiva 17, Sisters 128, Anima 4 | | |
| 1 Shiva | intended | Active, D=1.5 s (40 seeds) | 26/40 | 1.15 | 0.00 | 220683 |
| 1 Shiva | intended | Wait split, D=1.5 s, 0.5 s on the top list (40) | 39/40 | 0.78 | 0.00 | 164699 |
| 1 Shiva | intended | Wait (whole menu), D=1.5 s (40) | 38/40 | 0.68 | 0.00 | 157826 |
| 2 Sisters | intended | Active, D=1.5 s (40) | 7/40 | 0.00 | 0.63 | 141493 |
| 2 Sisters | intended | Wait split, D=1.5 s (40) | 6/40 | 0.00 | 0.70 | 139392 |
| 2 Sisters | intended | Wait (whole menu), D=1.5 s (40) | 14/40 | 0.00 | 0.50 | 158006 |
| 3 Anima | intended | Active, D=1.5 s (40) | 5/40 | 3.25 | 0.00 | 350784 |
| 3 Anima | intended | Wait split, D=1.5 s (40) | 32/40 | 2.88 | 0.00 | 331768 |
| 3 Anima | intended | Wait (whole menu), D=1.5 s (40) | 37/40 | 2.35 | 0.00 | 254033 |

## What the numbers say (for Bailey; options, not decisions)

- **Shiva and Anima:** the sourced clear wins about 9 in 10 at the
  default Wait, and the credibly wrong line loses far more often. Under **Active** at a human's
  1.5 s a menu both fall hard (Anima 5/40): the same warning as Chapter VI's 0/40.
- **The Sisters are the wall.** The sourced clear (two Darkness, Dispel, heals) wins 78/200. The
  guides' "kill Mindy first" is unwinnable in our engine (0/200) because a Dark Knight's Attack
  lands on Mindy 36 % of the time (T0). In the one log read turn by turn (seed 3, before the
  healer line used items) the three Sisters took 20 turns to the two Dark Knights' 6, and attrition
  (Passado, Demi, Absorb) wiped the party with no Delta Attack at all.
- **FA8** barely moves the Sisters (78 → 88 under reading b).
- **FA3 matters:** in one unbroken run of the Road, 128 of 149 losses happen at the Sisters. With
  the retry at the lost link the player retries the Sisters, not Shiva.
- Measured options if the Sisters' rate is too low (none is built; each needs a yes): (a) leave
  it as measured; (b) the FA7 change (Darkness cannot miss) if a second
  source turns up; (c) a line change on our side, such as the Chapter V preset's levels, which are
  our `[estimate]`. **No boss number is on this list.**
