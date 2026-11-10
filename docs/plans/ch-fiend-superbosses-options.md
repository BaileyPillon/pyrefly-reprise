# The Fiend Arena Superbosses: what the bench measured, and the options for Bailey

**FFX-2 only** (hidden chapter 53, word `legion`, id `ffx2-fiend-superbosses`; AGENTS.md rule 14: the rows are FFX-2 kernel rows 329 to 336 and nothing of FFX or FF7 is read). Written 2026-11-10 by a Sonnet sub-agent of the Echoes of Spira driver, stage 4 of lane w53. **No recommendation is built, no boss number was touched, and the shipped build is LG3 as the preflight says (`viaInfinitoBuild`, a deep copy).** Every number below is a run of the engine (`node --experimental-transform-types tools/fiend-superbosses-bench.mjs`, the cells of `tests/unit/helpers/fiendSuperbossBenchCells.ts`; the test `tests/unit/chapters/fiend-superbosses-bench.test.ts` pins their character): 200 seeds a cell at bench speed (zero decision time), 40 at each human pace (the Wait split at 1.5 s a menu, and the Active clock at 1.5 s), 58 cells, none cut, the slowest three minutes. Time is battle time at the engine's 29.97 logic steps a second.

Authority: Bailey, relayed by the driver: "implement all unimplemented chapters please" (2026-11-06), "yes on all these too", and 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Hard rule 10: nothing below is built; each option is his to take.

## 1. The result in one paragraph

**The shipped party wins neither act, on any line, at any pace: 0 of 200 seeds in every bench cell and 0 of 40 in every human-pace cell.** It is not close. Almighty Shinra's opening Clione (ten blows of 6,000 to 9,999) lands 2.6 to 2.8 s in, before any girl's first action can finish, and the first move alone wipes the party on 158 of 200 seeds. **Act 2 is worse as the chapter plays it**: it is a chained link, which the engine opens with every wait whole, so the Numerus's first blow lands 2.9 to 3.4 s in and **the girls are never asked for a single command** (200 of 200 seeds; 9.0 s from the bell to the defeat panel; the browser smoke saw the same). What it would take to win is **invulnerability from the first second**, which nothing in the kit can give in time. The guide's own answer (Gamer Guides: "the hardest fights in the game", ten to thirty minutes with an invulnerability loop) is the right size for the fight once the opening is solved: with Invincible for good the party wins act 2 on every seed in about six minutes.

## 2. Why: the opening (measured; `tests/unit/helpers/fiendSuperbossOpening.ts`, 200 seeds, the advisor line)

| | first girl menu (s) | first foe blow lands (s) | a girl's action COMPLETES before the blow | wiped by the foe's first move | battle ends (s) |
|---|---|---|---:|---:|---|
| **act 1**, Almighty Shinra (a first link, `normal`) | 0.63 to 2.64, median 1.40 (a menu before the blow on 194 of 200) | 2.60 to 2.77, median 2.67 | **0 of 200** (the earliest completes at 3.87 s) | **158 of 200** | median 5.8, p90 16.5, max 20.0 |
| **act 2**, the Numerus, **as the chapter plays it** (a continuation link, `scripted`: every wait whole, no trim; `battle/ffx2/atb-open.ts`) | **none: no girl is ever asked** (0 of 200) | 2.87 to 3.37, median 2.87 | 0 of 200 | **200 of 200** | **9.04 on every seed** |
| act 2 opened as a fresh first link (the comparator, never played) | 0.63 to 3.40, median 1.43 (a menu before the blow on 160 of 200) | 1.57 to 2.60, median 2.07 | 0 of 200 | 85 of 200 | median 8.0, p90 8.3 |

A Light Curtain or a Mix started at Rikku's first menu has not landed when the first blow does (a Drink lands 4.8 s after the menu). Clione's damage at the real HP (10,710 / 5,106 / 10,710) is stage 1's: 6,000 to 9,999 a hit; Protect and Shell change none of the four Commands.

## 3. The shipped build (LG3 as built), what the bench reports

Both acts, wins of 200 seeds at bench speed (and of 40 at each human pace): **0** on the advisor line (the shipped tactic), **0** on the Darkness line (Yuna and Paine Darkness, Rikku swings), **0** on the naive line (every girl a plain Attack). Seconds a fight 7.5 (act 1) and 9.0 (act 2); all three girls fall every time; Shinra loses 0.2 percent of his HP; no head falls. Cells `base/*` of the table in section 6.

## 4. The options the preflight named (LG4), measured: none changes the result

Each is a rig the bench applies to the party and **none ships**. Wins of 200 seeds, bench speed (40 at each human pace: also 0 in every cell). Act 2 is as the chapter plays it; the fresh-first-link column is in parentheses where it differs.

| Option | What was applied | act 1 | act 2 | What it did |
|---|---|---:|---:|---|
| **O1. A Miracle Drink loop** | 99 Dark Matter and 99 Potions in the bag (the shipped bag holds none: no Drink can be made as built); Rikku Mixes whenever a living girl's Invincible would be gone by the time a new Drink lands. **Bench-only: Rikku's menu has no Mix row** (the picker is a later step of the Mix lane; a human cannot do this today) | **0** | **0** (0) | Act 1: Rikku starts a Mix on 0.93 of fights and none lands before Clione. Act 2: **no Mix is ever started** (no menu). The loop's own arithmetic (3 seeds, both acts): a Drink lands **4.8 s** after the menu, Invincible lasts **7.9 s**, Rikku's menu comes every **7.3 s**: the next Drink lands while the last stands, a status does not stack, so every second Drink is wasted and a Mixing Rikku alone covers about half the time |
| **O2. Hero Drinks** | 10 in the bag (`[estimate]`, the Den of Woe's pattern); a girl drinks one on herself while a foe charges a big blow | **0** | **0** (0) | 2.06 drunk a fight in act 1 (none lands in time), none in act 2. A Hero Drink covers one girl; every Command but Radis hits all three |
| **O3. Thunder-proof girls** | `affinities.lightning = immune` on each girl (a pure rig: no accessory sets an affinity in the game's data today) | **0** | **0** (0) | Fulmen, Tria's Command, would do 0; but it is one blow of four and the party is wiped before it |
| **O4. A Ribbon** | a Ribbon in place of each girl's Crystal Bangle (it stops every status Duo throws; stage 2's finding) | **0** | **0** (0) | the fights get shorter (act 1 6.2 s against 7.5: the Bangle's stats go with it) |
| **O5. O1 + O3 + O4 together** | the loop, the Ribbon and Thunder-proofing | **0** | **0** (0) | act 1 6.5 s, act 2 9.0 s |

## 5. Diagnostic rigs: where the wall is (NOT options anything could ship today)

These say what the fight is, not how to take it down. 200 seeds, bench speed, Lv 99 party.

| Rig | act 1 | act 2 (chained) | Reading |
|---|---:|---:|---|
| **R1. The opening bridged for one Drink's length** (Invincible laid on all three girls before the first blow, 15 counts = 7.9 s) with the O1 loop; also with Ribbon and Thunder-proofing; also with Hero Drinks | 0, 0, 0 | 0, 0, 0 | the party lives 14.6 to 36.6 s (act 1) and 14.5 to 20.8 s (act 2) and is wiped in the first gap of the loop. **Handing over the first eight seconds does not carry the loop** |
| **R2. Invincible for good, the girls' HP topped up at each decision** (the Dark Knights' Darkness costs HP) | Darkness line **160**, advisor line **133** (the rest of the 200 run to the 40-minute cap, none is lost: Shinra's Regen keeps ahead of a line that mends or casts curtains) | Darkness line **0**, advisor line **0** | act 2 is lost to **Duo's Petrify**, which lands through Invincible (2.3 to 2.5 girls stoned a fight, 25 to 28 Commands cast, almost all of them survived) |
| **R3. R2 plus a Ribbon** | 160 / 133 (a Ribbon changes nothing in act 1) | **200 / 200** | act 2 is won on **every seed in 346 s** (5.8 minutes), 24 to 26 Commands cast, 24.05 and 25.68 of them leave every girl standing: the guide's "ten to thirty minutes with an invulnerability loop" |

## 6. What each option would need (not built; each is Bailey's yes)

1. **Invulnerability at the bell.** The only family that wins (R2 and R3). Nothing in the kit gives it: the Miracle Drink needs 4.8 s, the opening blow lands at 2.6 s (act 1) and 2.9 s (act 2). It would be a rule or an item that does not exist in the engine's data today, and it is **a change to the fight's conditions, not to a boss number**. Not found in the sources (`research/re-ffx2-fiend-arena-superbosses.md`); the guide's loop is a Mix loop, which this bench shows cannot start in time.
2. **The game's full battle start for act 2.** The engine opens a chained link with every wait whole (`atb-open.ts`: "which the game does not do"); the game gives each link the random opening waits (25 to 74 percent of the standard wait) and the trim, and `EnemyGroupDef.opensAsSeparateBattle` plus the `SEPARATE_BATTLE_GAUGES` switch are that path, off by Bailey's D-242 and reaching only Chapter VI's Acts II and III. The comparator column above is that start: it gives the girls a menu first on 160 of 200 seeds and **still wins 0 of 200 with every option of section 4** (the act 2 cells are all 0 when the same 58 cells are run with act 2 opened `normal`, which `Spec.condition` of the bench selects, except the Darkness-line R2 at 0 and the advisor-line R2 at 1 of 200; 200 of 200 only for R3). A shared engine switch with its own history: Bailey's call.
3. **A Ribbon for act 2** (a stand-in for "something that stops Duo's Petrify and the other five statuses"): worth it only with item 1, since R2 without it loses act 2 on every seed and R3 with it wins every one.
4. **A Mix row in Rikku's menu** (the picker the Mix lane owes): needed by O1 for a human to play it at all; with the loop's 7.3 s cadence against a 7.9 s Drink it can cover about half the time on its own.

Named and **not measured** (rule 6: no source number to measure with, or not in the engine): Haste or Speed gear for Rikku (the guide's Speed Bracer, which would shorten both the Mix and her cadence), Auto-Protect and Auto-Shell gear (Protect halves Final Impact; no Command), Final Wall and Mega Cocktail, a Break Damage Limit walk on Paine's grid (it lifts the girls' 9,999 cap; the fight is not lost on damage), a higher HP total (Lv 99 is the cap), the heads' real drops (Enterprise, Iron Duke, Invincible, Ragnarok are not in our item tables), Unum alone (Jegged's "Outer Plane Envoy").

## 7. The full table (200 seeds at bench speed, 40 at each human pace; act 2 as the chapter plays it)

`pace` is `bench` (zero decision time, Wait), `split` (the live default: Wait split, 1.5 s a menu, 0.5 s of it on the top list with the clock running) or `active` (the Active clock, 1.5 s a decision). Columns: wins; defeats; cap (a run that reached 40 minutes of battle time: counted, never hidden); girl KOs a fight; seconds a fight; the foes' HP left at the end; heads down (act 2); Commands cast / Commands that left every girl standing while in flight; Miracle Drinks and Hero Drinks started a fight; girls turned to stone a fight.

| cell | line | kit | pace | wins | defeats | cap | girl KOs a fight | seconds a fight | foe HP left | heads down | Commands cast / left every girl standing | Miracle Drinks | Hero Drinks | stoned |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| base/advisor/act1/bench | advisor | as built | bench | 0/200 | 200 | 0 | 3.00 | 7.5 | 99.8 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/advisor/act1/split | advisor | as built | split | 0/40 | 40 | 0 | 3.00 | 8.3 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/advisor/act1/active | advisor | as built | active | 0/40 | 40 | 0 | 3.00 | 8.1 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/advisor/act2/bench | advisor | as built | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/advisor/act2/split | advisor | as built | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/advisor/act2/active | advisor | as built | active | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/naive/act1/bench | naive | as built | bench | 0/200 | 200 | 0 | 3.00 | 7.9 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/naive/act1/split | naive | as built | split | 0/40 | 40 | 0 | 3.00 | 8.3 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/naive/act1/active | naive | as built | active | 0/40 | 40 | 0 | 3.00 | 8.2 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/naive/act2/bench | naive | as built | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/naive/act2/split | naive | as built | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/naive/act2/active | naive | as built | active | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/darkness/act1/bench | darkness | as built | bench | 0/200 | 200 | 0 | 3.00 | 7.5 | 99.8 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| base/darkness/act2/bench | darkness | as built | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/miracle/act1/bench | miracle | darkMatter | bench | 0/200 | 200 | 0 | 3.02 | 7.7 | 99.8 % | 0.00 | 0.00 / 0.00 | 0.93 | 0.00 | 0.00 |
| whatif/miracle/act1/split | miracle | darkMatter | split | 0/40 | 40 | 0 | 3.00 | 8.3 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.75 | 0.00 | 0.00 |
| whatif/miracle/act1/active | miracle | darkMatter | active | 0/40 | 40 | 0 | 3.00 | 8.1 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.38 | 0.00 | 0.00 |
| whatif/miracle/act2/bench | miracle | darkMatter | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/miracle/act2/split | miracle | darkMatter | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/miracle/act2/active | miracle | darkMatter | active | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/hero/act1/bench | hero | heroDrinks 10 | bench | 0/200 | 200 | 0 | 3.02 | 9.5 | 99.9 % | 0.00 | 0.00 / 0.00 | 0.00 | 2.06 | 0.00 |
| whatif/hero/act1/split | hero | heroDrinks 10 | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 1.50 | 0.00 |
| whatif/hero/act1/active | hero | heroDrinks 10 | active | 0/40 | 40 | 0 | 3.00 | 8.1 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.50 | 0.00 |
| whatif/hero/act2/bench | hero | heroDrinks 10 | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/hero/act2/split | hero | heroDrinks 10 | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/hero/act2/active | hero | heroDrinks 10 | active | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/thunder/act1/bench | advisor | thunder | bench | 0/200 | 200 | 0 | 3.00 | 7.5 | 99.8 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/thunder/act1/split | advisor | thunder | split | 0/40 | 40 | 0 | 3.00 | 8.3 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/thunder/act1/active | advisor | thunder | active | 0/40 | 40 | 0 | 3.00 | 8.1 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/thunder/act2/bench | advisor | thunder | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/thunder/act2/split | advisor | thunder | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/thunder/act2/active | advisor | thunder | active | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/ribbon/act1/bench | advisor | ribbon | bench | 0/200 | 200 | 0 | 3.00 | 6.2 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/ribbon/act1/split | advisor | ribbon | split | 0/40 | 40 | 0 | 3.00 | 6.8 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/ribbon/act1/active | advisor | ribbon | active | 0/40 | 40 | 0 | 3.00 | 6.7 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/ribbon/act2/bench | advisor | ribbon | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/ribbon/act2/split | advisor | ribbon | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/ribbon/act2/active | advisor | ribbon | active | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/all/act1/bench | miracle | darkMatter, ribbon, thunder | bench | 0/200 | 200 | 0 | 3.02 | 6.5 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.93 | 0.00 | 0.00 |
| whatif/all/act1/split | miracle | darkMatter, ribbon, thunder | split | 0/40 | 40 | 0 | 3.00 | 6.8 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.75 | 0.00 | 0.00 |
| whatif/all/act1/active | miracle | darkMatter, ribbon, thunder | active | 0/40 | 40 | 0 | 3.00 | 6.7 | 100.0 % | 0.00 | 0.00 / 0.00 | 0.38 | 0.00 | 0.00 |
| whatif/all/act2/bench | miracle | darkMatter, ribbon, thunder | bench | 0/200 | 200 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/all/act2/split | miracle | darkMatter, ribbon, thunder | split | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| whatif/all/act2/active | miracle | darkMatter, ribbon, thunder | active | 0/40 | 40 | 0 | 3.00 | 9.0 | 100.0 % | 0.00 | 1.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| rig/cover15-miracle/act1/bench | miracle | darkMatter, cover 15 | bench | 0/200 | 200 | 0 | 3.00 | 36.6 | 99.6 % | 0.00 | 0.00 / 0.00 | 0.96 | 0.00 | 0.00 |
| rig/cover15-miracle/act2/bench | miracle | darkMatter, cover 15 | bench | 0/200 | 200 | 0 | 3.09 | 20.5 | 97.6 % | 0.00 | 2.58 / 1.59 | 1.24 | 0.00 | 0.36 |
| rig/cover15-miracle-ribbon/act1/bench | miracle | darkMatter, cover 15, ribbon, thunder | bench | 0/200 | 200 | 0 | 3.00 | 14.6 | 97.9 % | 0.00 | 0.00 / 0.00 | 0.93 | 0.00 | 0.00 |
| rig/cover15-miracle-ribbon/act2/bench | miracle | darkMatter, cover 15, ribbon, thunder | bench | 0/200 | 200 | 0 | 3.33 | 20.8 | 97.9 % | 0.00 | 2.48 / 1.64 | 1.40 | 0.00 | 0.00 |
| rig/cover15-hero/act1/bench | hero | heroDrinks 10, cover 15, ribbon | bench | 0/200 | 200 | 0 | 3.00 | 20.1 | 98.4 % | 0.00 | 0.00 / 0.00 | 0.00 | 1.29 | 0.00 |
| rig/cover15-hero/act2/bench | hero | heroDrinks 10, cover 15, ribbon | bench | 0/200 | 200 | 0 | 3.00 | 14.5 | 98.6 % | 0.00 | 2.00 / 1.00 | 0.00 | 0.00 | 0.00 |
| rig/forever-advisor/act1/bench | advisor | cover Infinity, topUp | bench | 133/200 | 0 | 67 | 0.00 | 1140.2 | 33.4 % | 0.67 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| rig/forever-advisor/act2/bench | advisor | cover Infinity, topUp | bench | 0/200 | 200 | 0 | 3.54 | 307.0 | 77.5 % | 0.00 | 27.88 / 25.60 | 0.00 | 0.00 | 2.47 |
| rig/forever-darkness/act1/bench | darkness | cover Infinity, topUp | bench | 160/200 | 0 | 40 | 0.00 | 842.1 | 19.9 % | 0.80 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| rig/forever-darkness/act2/bench | darkness | cover Infinity, topUp | bench | 0/200 | 200 | 0 | 2.70 | 283.0 | 78.3 % | 0.01 | 25.25 / 23.41 | 0.00 | 0.00 | 2.27 |
| rig/forever-advisor-ribbon/act1/bench | advisor | cover Infinity, topUp, ribbon | bench | 133/200 | 0 | 67 | 0.00 | 1140.2 | 33.4 % | 0.67 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| rig/forever-advisor-ribbon/act2/bench | advisor | cover Infinity, topUp, ribbon | bench | 200/200 | 0 | 0 | 0.00 | 346.9 | 0.0 % | 4.00 | 26.27 / 25.68 | 0.00 | 0.00 | 0.00 |
| rig/forever-darkness-ribbon/act1/bench | darkness | cover Infinity, topUp, ribbon | bench | 160/200 | 0 | 40 | 0.00 | 842.1 | 19.9 % | 0.80 | 0.00 / 0.00 | 0.00 | 0.00 | 0.00 |
| rig/forever-darkness-ribbon/act2/bench | darkness | cover Infinity, topUp, ribbon | bench | 200/200 | 0 | 0 | 0.00 | 345.7 | 0.0 % | 4.00 | 24.24 / 24.05 | 0.00 | 0.00 | 0.00 |

## 8. Open questions for Bailey (none blocks anything built)

- Does he want the arena's superbosses to be **winnable by the shipped party** at all, or kept as the hidden "the base party cannot win, and the chapter says so" fight that LG3 ships? Every option above that wins needs item 1 of section 6.
- Whether act 2 should open with the **game's full battle start** (item 2): the engine's switch is his (D-242); the numbers say it changes the first seconds and no outcome.
- The Miracle Drink's length: **7.9 s** on the engine (15 counts; the research note's "about 8 s" holds; stage 1's "3.9 s" was a unit slip: the FFX-2 engine ticks 29.97 steps a second, not 60), against the guide's "assume 30 minutes".
- Whether the heads' real drops are built as items (not in our tables), and whether the pause tab may keep a borrowed plate (Chapter XIII's Trema) until the art lane delivers.
