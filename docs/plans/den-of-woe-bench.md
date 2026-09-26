# Chapter XV, the Den of Woe: the bench (FFX-2 only)

**Game case: FFX-2 only** (AGENTS.md rule 14): the three shades, ATB, the FFX-2 status set.
Re-measured 2026-09-25 (~18:00 EDT) on branch `chapter-gippal-ship-0925` after the second merge of `main` (53b926fe),
and again after the ship layer (identical rows),
by `tests/unit/chapters/den-of-woe-bench.test.ts` with the lines in
`tests/unit/helpers/denOfWoeDrive.ts`. **Measure, never tune:** no boss number was changed to move
any row (plan `docs/plans/chapter-gippal-review.md` §9; memory "boss-side fix needs measured
options"). Every what-if row is a question for Bailey, not a shipped change.


## The number to read

| Line | Bench (200 seeds, D = 0) | Human, Wait split (40 seeds) |
|---|---:|---:|
| **The whole Den, intended line** (the shipped chapter, and what its tactic plays) | **12 / 200 (6 %)** | **0 / 40 (0 %)** |
| The whole Den, intended without the Lightfall prep | 26 / 200 | 3 / 40 |

**Human speed** is Wait split, the live default: 1.5 s a menu, 0.5 s of it on the top-level
command menu with the clock running and 1.0 s held in a submenu or on a target (the Trema bench's
method, `trema-shipped-bench.test.ts`). At human speed nobody wins the Den on the intended line.
The wall is Nooj: fought fresh he is 24 / 200 at bench speed and **1 / 40** at human speed.
Lightfall (5,000 to everyone, exact) kills Yuna from full (2,488 max HP) and any Dark Knight at
5,000 HP or less; Greedy Aura (3/16 of max HP and MP) finishes the survivors. Baralai (39 / 40)
and Gippal (29 / 40) are winnable at human speed. Main's merge moved the human rows by a seed or
two (the first merge read Baralai 38, Gippal 29, Nooj 0, Den 0 and 2 of 40); the bench rows did
not move.

The shipped tactic (`src/engine/tactics/ffx2-den-of-woe.ts`) wins exactly as the intended line
does at bench speed, 20 seeds a link: Baralai 20, Gippal 17, Nooj 3 of 20
(`tests/unit/chapters/den-of-woe-ship-content.test.ts`).

## Sourced player-side options the numbers call for (never touch a boss)

| Option | Source | Den, bench | Den, human Wait split | Nooj fresh, human |
|---|---|---:|---:|---:|
| Shipped (GP5 a, GP6 a) | Chapter V preset and bag | 12 / 200 | 0 / 40 | 1 / 40 |
| **GP6 b: 3 Hero Drinks** (Invincible 10.6 s, drunk before Lightfall; the count is an `[estimate]`) | research §5, "Invincible" is the sourced Lightfall answer (wiki, GamerGuides) | 63 / 200 | 4 / 40 | 16 / 40 |
| GP5 b: +8 levels (54 / 56 / 58, nearer the shades' 52-63; `[estimate]`) | research §5, G-12 (no source gives a level) | 45 / 200 | 1 / 40 | n/a |
| **GP6 b + GP5 b** | both | 96 / 200 | **10 / 40** | 15 / 40 |
| GP4 b: retry from the lost link (Trema's checkpoint seam) | plan GP4 (built as a) | n/a | each link alone: 39, 29, **1** of 40 | 1 / 40 |

GP4 b alone does not help: a retry from Nooj still meets a Nooj nobody beats at human speed. The
Hero Drink is the sourced answer (Invincible through Lightfall); the Chapter V bag has none, so it
is Bailey's call (GP6), with or without a higher level (GP5). Even both together leave the Den at
a quarter at human speed.

## Repair cycle 1 (2026-09-25): the options built OFF, re-measured at 200 human seeds

The ship check's blocker B1 and major M1 (`docs/concepts/chapters/den-of-woe/ship/CHECK.md`) are
answered by **four switches, all at Bailey's picks** (GP6 b Hero Drinks, GP5 b levels, GP4 b retry
from the lost shade, M1 the Lightfall prep), measured at 200 seeds a row at human speed, with
retries, in `tests/unit/chapters/den-of-woe-options-bench.test.ts` (`PYREFLY_MEASURE=1`). The 40-seed human rows above
stay as they were measured. At 200 seeds the shipped line is 0/200, and no prep is 15/200. Both kit
options with the prep give 52/200, the best first try at 1.5 s only. Repair 2 swept the menu speed
(1.0 / 1.5 / 2.5 s). Under both options, no prep wins at 1.0 s and 2.5 s and within five tries at every
speed, and on every other kit it wins everywhere. The sheet therefore puts the prep as its own call,
with no prep as the lean. The sheet for Bailey, with the full tables and replies, is
`docs/plans/den-of-woe-options-2026-09-25.md`.

## Two things the bench shows about its own lines

- **The Lightfall prep is worse than no prep** (Den 12 vs 26 at bench speed). Keeping the Dark
  Knights above 5,000 HP means plain Attacks against DEF 144 near the end; a likely reason, not
  measured, is that the fight runs longer and Greedy Aura comes around more often. The prep is the sources' advice for a *higher-HP* party; the
  guide still says "keep them above 5,000" only on Curaga, and says Yuna cannot survive it.
- **Gippal alone: the "magic" wrong line now edges the intended one (162 vs 157 of 200).** Proven
  by running seed 3's log before and after the merge (scratch, rule 3): main's spherechange fix
  (`spherechange.ts`, accessories kept across a change, method check E2) gives the magic line's
  silenced White Mage, who falls back to a change into Gunner, her bangle's HP. The intended rows
  are unchanged by the merge. The whole Den still punishes the magic line: 0 / 200, lost at
  Baralai. The test now pins the intended line above the magic line on Baralai and Nooj and above
  all-out everywhere.

## Full table (copied from the test's output, after the ship layer)

| Link | Line | ATB | Wins | Avg ticks, or where the Den was lost |
|---|---|---|---:|---|
| 1 Baralai | intended: Protect+Shell, Darkness x2, heals, Remedy, Lightfall prep | Wait, D=0 | 199/200 | 86652 |
| 1 Baralai | intended without the Lightfall prep | Wait, D=0 | 199/200 | 86652 |
| 1 Baralai | wrong: magic (Drain on MP), no Protect, no Remedy | Wait, D=0 | 16/200 | 361512 |
| 1 Baralai | wrong: all-out, no cures, no Remedy | Wait, D=0 | 8/200 | 266283 |
| 2 Gippal | intended: Protect+Shell, Darkness x2, heals, Remedy, Lightfall prep | Wait, D=0 | 157/200 | 127417 |
| 2 Gippal | intended without the Lightfall prep | Wait, D=0 | 157/200 | 127417 |
| 2 Gippal | wrong: magic (Drain on MP), no Protect, no Remedy | Wait, D=0 | 162/200 | 349155 |
| 2 Gippal | wrong: all-out, no cures, no Remedy | Wait, D=0 | 35/200 | 121122 |
| 3 Nooj | intended: Protect+Shell, Darkness x2, heals, Remedy, Lightfall prep | Wait, D=0 | 24/200 | 152772 |
| 3 Nooj | intended without the Lightfall prep | Wait, D=0 | 33/200 | 134202 |
| 3 Nooj | wrong: magic (Drain on MP), no Protect, no Remedy | Wait, D=0 | 2/200 | 354035 |
| 3 Nooj | wrong: all-out, no cures, no Remedy | Wait, D=0 | 0/200 | 99991 |
| Den (1-2-3) | intended: Protect+Shell, Darkness x2, heals, Remedy, Lightfall prep | Wait, D=0 | 12/200 | lost at Baralai 1, Gippal 37, Nooj 150 |
| Den (1-2-3) | intended without the Lightfall prep | Wait, D=0 | 26/200 | lost at Baralai 1, Gippal 37, Nooj 136 |
| Den (1-2-3) | wrong: magic (Drain on MP), no Protect, no Remedy | Wait, D=0 | 0/200 | lost at Baralai 184, Gippal 13, Nooj 3 |
| Den (1-2-3) | wrong: all-out, no cures, no Remedy | Wait, D=0 | 0/200 | lost at Baralai 192, Gippal 8, Nooj 0 |
| (expiries, Baralai, magic line, seeds 1-20) | {"girl:stop":46,"baralai:regen":1} | | | |
| 1 Baralai | intended, what-if +8 levels | Wait, D=0 | 200/200 | 67533 |
| 2 Gippal | intended, what-if +8 levels | Wait, D=0 | 186/200 | 98936 |
| 3 Nooj | intended, what-if +8 levels | Wait, D=0 | 50/200 | 117079 |
| Den (1-2-3) | intended, what-if +8 levels | Wait, D=0 | 45/200 | lost at Baralai 0, Gippal 25, Nooj 130 |
| 3 Nooj | intended + 3 Hero Drinks, what-if | Wait, D=0 | 133/200 | 190259 |
| Den (1-2-3) | intended + 3 Hero Drinks, what-if | Wait, D=0 | 63/200 | lost at Baralai 1, Gippal 37, Nooj 99 |
| 3 Nooj | intended + 3 Hero Drinks, what-if | Wait split, D=1.5 s | 16/40 | 209489 |
| Den (1-2-3) | intended + 3 Hero Drinks, what-if | Wait split, D=1.5 s | 4/40 | lost at Baralai 1, Gippal 15, Nooj 20 |
| 3 Nooj | intended + 3 Hero Drinks + 8 levels, what-if | Wait, D=0 | 131/200 | 143507 |
| Den (1-2-3) | intended + 3 Hero Drinks + 8 levels, what-if | Wait, D=0 | 96/200 | lost at Baralai 0, Gippal 25, Nooj 79 |
| 3 Nooj | intended + 3 Hero Drinks + 8 levels, what-if | Wait split, D=1.5 s | 15/40 | 169142 |
| Den (1-2-3) | intended + 3 Hero Drinks + 8 levels, what-if | Wait split, D=1.5 s | 10/40 | lost at Baralai 0, Gippal 8, Nooj 22 |
| Den (1-2-3) | intended, what-if +8 levels | Wait split, D=1.5 s | 1/40 | lost at Baralai 0, Gippal 8, Nooj 31 |
| 1 Baralai | intended | Wait split, D=1.5 s | 39/40 | 101430 |
| 2 Gippal | intended | Wait split, D=1.5 s | 29/40 | 152791 |
| 3 Nooj | intended | Wait split, D=1.5 s | 1/40 | 172728 |
| Den (1-2-3) | intended: Protect+Shell, Darkness x2, heals, Remedy, Lightfall prep | Wait split, D=1.5 s | 0/40 | lost at Baralai 1, Gippal 15, Nooj 24 |
| Den (1-2-3) | intended without the Lightfall prep | Wait split, D=1.5 s | 3/40 | lost at Baralai 1, Gippal 15, Nooj 21 |
| 1 Baralai | intended | Active, D=1.5 s | 29/40 | 182010 |
| 2 Gippal | intended | Active, D=1.5 s | 7/40 | 208279 |
| 3 Nooj | intended | Active, D=1.5 s | 0/40 | 177418 |
| Den (1-2-3) | intended | Active, D=1.5 s | 0/40 | lost at Baralai 11, Gippal 28, Nooj 1 |

## Bailey's pick, 2026-09-26: the chapter as shipped

Bailey: "I pick your recommendation for Den of Woe" = "Den: both, drop the prep". The shipped kit is the
preset + 3 Hero Drinks + 8 levels (both `[estimate]`), with no Lightfall prep. The retry is from Baralai.
The rows above are the Chapter V preset's (the drive helper's default party) and stay as measured. The
shipped chapter's own bench is `tests/unit/chapters/den-of-woe-shipped-bench.test.ts` (`PYREFLY_MEASURE=1`):

| Speed | First try (of 200) | Within 3 / 5, retry from Baralai |
|---|---:|---|
| Human, Wait split 1.0 s / 0.3 s | 66 | 136 / 173 |
| Human, Wait split 1.5 s / 0.5 s (live default) | 39 | 115 / 160 |
| Human, Wait split 2.5 s / 0.8 s | 48 | 99 / 134 |
| Bench, D = 0 | 102 | 173 / 199 |
| Active, 1.5 s | 7 | 15 / 20 |

The shipped tactic on the shipped kit, 20 seeds a link at bench speed, plays as the shipped line does:
Baralai 20, Gippal 18, Nooj 13 (`den-of-woe-ship-content.test.ts`). The all-target wrap in
`resolve.ts` flatters these rows. With each target hit once (scratch, not committed) the live default
row reads 34 and 102 / 149 (see the options sheet).
