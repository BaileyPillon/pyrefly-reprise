# Options sheet: the Gauntlet's difficulty (hidden chapter 54, FFX only), measured and not built

Written 2026-11-10 by the stage 5 agent of lane `ch-gauntlet` (a Sonnet sub-agent of the release driver). Authority (relayed words, verbatim): Bailey 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations."; 2026-11-09 "Keep going please with everything you were doing". **This is an options sheet for Bailey, not a build.** Nothing here touches a creature (AGENTS.md rule 15: "mechanics never bend"), and no lever below is turned in the shipped chapter. Game case: **FFX only**. Read with `docs/plans/ch-gauntlet-review.md` (section 8 is the target) and `docs/handoff/ch-gauntlet.md` (the stage sections hold every table this one summarises).

## The result in one paragraph

The preflight's target was "the advisor's line wins each act about 70 percent (60 to 80 accepted), the chain reported; if nine acts cannot land in the band, split 3 + 3 + 3". **The preset wins every act and the whole nine-act chain 200 times of 200 with the shipped line, with or without Yojimbo's Zanmato; a line that does not know the chapter loses the Greater Sphere a third of the time and can never win Neslug or the Ultima Buster.** The difficulty is therefore not in the numbers but in knowing the line (Lulu's magic for the shell, an Arm before the body, no Overdrive on the Greater Sphere), and **no party lever puts the nine acts in the band together** (each act has its own cliff, and they are far apart). That is the Dark Aeons chapter's shape (a cliff, not a slope), and it is a result, not a defect: the chapter is faithful and winnable.

## What was measured (200 seeds a cell, the real engine, `tools/gauntlet-bench.mjs`)

The four lines: **advisor** is the shipped line (`src/engine/tactics/gauntlet.ts`, Yojimbo unused); **zanmato-all** is the same line with Yojimbo called in at every act and paid every turn while the 1,500,000 gil last; **careless** is the plain Attack at the first foe with no aeon, no spell and no potion; **bare + zanmato-all** is the shipped line with every rule taken away but a Phoenix Down for the fallen, and Yojimbo at every act (the careless line's "with Zanmato"). No cell was cut: all 200 seeds were played in every cell (each line's nine acts and its chain took under two minutes; the 20-minute limit was never near).

| act | advisor | zanmato-all | careless | bare + zanmato-all |
|---|---:|---:|---:|---:|
| 1 Cactuar King | 200 | 200 | 200 | 200 |
| 2 Don Tonberry | 200 | 200 | 200 | 200 |
| 3 Jormungand | 200 | 200 | 200 | 200 |
| 4 Earth Eater | 200 | 200 | 200 | 200 |
| 5 Greater Sphere | 200 | 200 | **135** (68 percent; 65 lost) | 174 (87 percent; 26 lost) |
| 6 Catastrophe | 200 | 200 | 200 | 200 |
| 7 Th'uban | 200 | 200 | 196 (98 percent; 4 lost) | 200 |
| 8 Neslug | 200 | 200 | **0** (200 stalemates: the engine ends it as "the battle cannot be won from here") | 168 (84 percent; 1 lost, 31 stalemates) |
| 9 Ultima Buster | 200 | 200 | **0** (200 lost) | 136 (68 percent; 64 lost) |
| **the chain of nine** | **200** | **200** | **0** (first loss at act 5: 80, act 7: 56, act 8: 64) | **1** (act 5: 51, act 7: 10, act 8: 138) |

The three tiers alone (the 3 + 3 + 3 cut), same cells:

| tier | advisor | zanmato-all | careless |
|---|---:|---:|---:|
| 1 (Cactuar King, Don Tonberry, Jormungand) | 200 | 200 | 200 |
| 2 (Earth Eater, Greater Sphere, Catastrophe) | 200 | 200 | **136 (68 percent**; all 64 losses at the Greater Sphere) |
| 3 (Th'uban, Neslug, Ultima Buster) | 200 | 200 | **0** (4 lost at Th'uban, 196 stalemates at Neslug) |

The bench files are in the lane's scratch folder (`bench200-*.out.txt`, named in the handoff).

## The options, each with its numbers (the advisor's line, 100 seeds a cell, from the stage tables in the handoff unless a row says otherwise)

**O1. Leave it as built (the driver's lean, his to overturn).** The chapter is the faithful fight: the creatures are the game's, the party is the endgame preset, and what the player must know is in the guide card and the page. Numbers: 200 of 200 on every act and the chain with the shipped line; 0 of 200 on the chain for a line that never casts; the Greater Sphere alone is 68 percent for it. Cost: none. What it gives up: no act sits inside the 60 to 80 percent band for a player who knows the line.

**O2. Name the line less (a text change, not a number).** The difficulty is already in the line: a player who has read nothing wins tiers 1 and 2 (200 and 136 of 200) and cannot win tier 3. If Bailey wants the chapter to read as harder, the lever is what the card and the tip say (they now name Lulu, the Arms and the Overdrive bar), not a stat. Cost: none in the engine; it is a copy decision for Bailey.

**O3. The party's stat estimate (every stat scaled together; the only lever that moves a result, and it moves a cliff).** Percent won by the advisor's line, 100 seeds a cell, the cells of the stage tables (a blank is a cell not measured):

| share of the caps | Cactuar King | Don Tonberry | Jormungand |
|---:|---:|---:|---:|
| 1, 0.5, 0.35 | 100 | 100 | 100 |
| 0.25 | 96 | 100 | 100 |
| 0.2 | | 100 | 99 |
| 0.16 | | 93 | |
| 0.15 | 88 | 14 | 91 |
| 0.125 | | 0 | **66** |
| 0.1 | 88 | 0 | 3 |

| share of the caps | Earth Eater | Greater Sphere | Catastrophe | chain of three |
|---:|---:|---:|---:|---:|
| 1 to 0.9 | 100 | 100 | 100 | 100 |
| 0.88 | 100 | 95 | 100 | 95 |
| 0.87 to 0.84 | 100 | **62** | 100 | **63** |
| 0.77 | 100 | 17 | 100 | 9 |
| 0.752 | **64** | 51 | 100 | 10 |
| 0.75 | 32 | **77** | 100 | 6 |
| 0.7 | 0 | 94 | 100 | 0 |
| 0.65 to 0.53 | 0 | 0 | 100 | 0 |
| 0.51 | 0 | 0 | **78** | 0 |
| 0.5 | 0 | 0 | 57 | 0 |

| share of the caps | Th'uban | Neslug | Ultima Buster |
|---:|---:|---:|---:|
| 1 to 0.8 | 100 | 100 | 100 |
| 0.78 | 100 | 100 | 92 |
| 0.775 | | | **81** |
| 0.774 | | | 41 |
| 0.77 | 100 | 100 | 30 |
| 0.76 | 100 | 100 | 1 |
| 0.7 | 100 | 97 | 0 |
| 0.6 | 84 | 94 | 0 |
| 0.595 | **73** | 92 | 0 |
| 0.59 | **63** | 86 | 0 |
| 0.585 | 56 | **77** | 0 |
| 0.575 | | **61** | 0 |
| 0.56 | 17 | 38 | 0 |
| 0.5 | 0 | 34 | 0 |
| 0.4 | 0 | 0 | 0 |

Bold is inside the 60 to 80 band. **No single value serves three acts, let alone nine**: the cliffs lie at about a quarter of the caps or less (tier 1), above three quarters (tier 2) and at 0.59, 0.58 and 0.775 (tier 3), and they are not monotonic (the same seeds fail at 0.84 and pass at 0.83). Cost: a whole-chapter estimate moves all nine acts at once, and the preset stops being row 34's endgame party.

**O4. An armour swap for a Death ward (the party's slot is the price).** Earth Eater's Megaton Punch kills the member it lands on (the Ribbon is no Death ward, stage 1 F1). A `deathproof` armour in place of the Ribbon: the punch goes from 1.01 members lost a fight to 0.01 and tier 2 is unchanged, but **the tier-3 chain falls to 92 of 100** (Th'uban 92: the Ribbon wards Rainbow's Confuse, Sleep, Silence and Darkness, Slime and Contamination's ailments). In place of Auto-Protect: **the Greater Sphere falls to 37** (a Hydraulic Press is 9,374 without it) and tier 3 is unchanged. So the swap is a trade at either slot, not a free lever. Cost: the party changes; the chain gets harder at one act whichever slot is chosen.

**O5. The bag, the luck and the kills (these move nothing for the shipped line).** Phoenix Downs 0 or 5, Evasion 0 or 100, Luck 0, the Yojimbo gauge full, kills 0: all 100 of 100 (Luck 0 slows the party, 37 inputs against 26 at Earth Eater, and wins). For the careless line a Phoenix Down stock of 0 takes Th'uban from 98 to 0. Cost: none for the shipped line; the careless line's tier-1 and tier-2 wins depend on the stock.

**O6. Yojimbo's purse.** With Zanmato at every act the chain is 200 of 200 (the 1,500,000 gil last about four acts; the rest are plain strikes). A Zanmato lands in 99 of 100 against Don Tonberry and 98 of 100 against Jormungand (tier 1) and in 37, 35 and 37 of 40 against Th'uban, Neslug and the Ultima Buster, at about 456,000 and 457,000 gil a fight (tier 1) and 332,500, 327,500 and 332,500 (tier 3). The careless line with him (bare + zanmato-all) still loses the chain (1 of 200: it needs a heal at the Greater Sphere, a Lulu at Neslug and an Arm-first line at the Ultima Buster). Cost: the purse is a lever (a smaller one makes the Zanmato route fall to the plain line sooner); it is not a need.

**O7. The shape: one chapter or three.** The three tiers are already releasable cuts (`GAUNTLET_TIERS_BUILT` is the switch). Alone, tier 1 is a warm-up the careless line wins 200 of 200, tier 2 is the one tier a careless line wins in the band (136 of 200, 68 percent: the Greater Sphere), and tier 3 is the one only a line with magic can win. The preflight's alternative to nine acts (the plan's eight, without the Greater Sphere) is not measured here: it would make tier 2 trivial for the careless line (200 of 200 at Earth Eater and Catastrophe). Cost: a chapter number per cut; the board has no card for any of them while they are hidden.

## What this sheet does not do

It builds nothing, tunes no creature, and recommends no stat. The measured fact for Bailey: **the preset wins the chapter every time, and the 60 to 80 percent band exists only for the Greater Sphere and tier 2 as a careless line meets them (68 and 68), and in narrow stat-estimate windows that differ per act.** The driver's lean is O1 (leave it), with O2 (the card's words) as the cheap lever if the chapter should feel harder; both are his to overturn.
