# Paper preflight: hidden chapter 43 (provisional) — Ultima Weapon, Omega Weapon and Nemesis (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-beast-review.md`, `docs/plans/ch-keeper-review.md` and `docs/plans/ch-mirror-aeons-review.md`: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-06 by a Sonnet sub-agent of the release driver (wave 3, FFX lane, program row 43). Authority (relayed words, verbatim, from the program plan): Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys.

**Read:** `research/re-ffx-omega-ultima-nemesis.md` (the sister note in this folder; "RE §n" below), the program plan (row 43, sections 6 to 9), `docs/plans/ch-mirror-aeons-review.md` (the chain, the two difficulty levers and the 70 percent band), `docs/plans/ch-keeper-review.md` (format), `src/data/ffx/builds/mirror-aeons.ts` (the party), `src/battle/ffx/ai/hooks.ts` and `hit-gates.ts` (the seams), all at `origin/main`. **Engine claims were read at `origin/main`; nothing was run, so rule 3 is owed by T0 and T9.**

**Verdict: PROCEED on data, AI and the small seams now; HOLD everything Bailey will see or hear (the three bosses' paintings, the plate, the music, the Nemesis look) until the end-state picks of section 9 are made (hard rule 9); the winnability numbers wait for the bench. Be honest on the card: against the repo's endgame party only the third act is a fight.**

## 0. What changes against the plan (read first)

1. **All three AIs are read in full: 1,165, 1,002 and 768 bytes of code** (the plan's "134 KB" and "172 KB" scripts are file sizes, mostly model data). R is finished for the AI; the residual R is the live checks of section 13. [RE §0]
2. **Nova is not the row the plan names.** The plan cites "Nova's row ... rank 7, power 70": that is Kimahri's Ronso Rage (0x3073). **Omega's own Nova is a monster row, 0x4067, MAG-based, power 60, capped at 9,999.** The cycle and the hidden counter the plan took from the wiki are now read from the file and confirmed exactly (+5 on an Attack, +2 on a special, Nova at 30 or more at the start of a turn; mean 11.44 turns). [RE §4.2, §10]
3. **Nemesis is not "Ultima recoloured" in the game**: a different monster and AI (Attack, Ethereal Cannon, Ultra Spark, an Armageddon counter, and **an Ultima on the front line in answer to every special-class command that hits it, all Overdrives and Mixes included**). Painting it as a recolour of Ultima Weapon stays a flagged compromise (WP6). Ultima Weapon and Nemesis share **one staging**, so one arena serves both. [RE §2, §4.3]
4. **Against the repo's endgame party (HP 9,999, DEF and MDEF 255) Ultima Weapon and Omega Weapon are harmless**: the biggest hit is about 330, Ultima's Attack never lands, and the party kills Ultima in one hit and Omega in 11 (Break Damage Limit). The guides' damage lines fit a mid-endgame party, not this one. **Nemesis is the real fight**: 14,000 to 31,000 a move, Armageddon 99,999 to all. [RE §6]
5. **Both Weapons' cycles depend on whether an aeon is on the field** (no guide says so): with an aeon out, the status turns (Break, Silence, Confuse, Sleep, Holy, Ultima, Demi) are replaced by more Core Energy and Shimmering Rain. [RE §4.1, §4.2]
6. **Zanmato levels 3, 3 and 4**: the Mirror chapter's lever (a landed Zanmato ends a fight under the game's own rules) applies to all three. [RE §10]
7. **The size drops** (64 to 45 hours, section 11): the research is done, the party, chain, bench and Zanmato rules exist, and Nemesis's three moves are rows.

## 1. Game case and sources

**Game case: FFX only.** CTB, aeons, the FFX status set; Omega Ruins (after the airship) and the Monster Arena. FFX-2 has none of these monsters; nothing here applies to it. New logic lives in new files under `src/battle/ffx` and `src/data/ffx` (an absence test pins that no ffx2 file imports it, as for the Keeper); the chapter registration and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, left to the wave-3 integrator commit.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `m99`, `m100`, `m276`, `omeg00_10`, `omeg01_10`, `zzzz02_76`, the rows | the records, formations, all three AIs, every number below | [R] (FFX_Data.vbf, Steam build 25501027) |
| RE §4 `[run]` and the exact distributions | the cycles, the two counters (Nova 7 to 16 turns, Armageddon 8 to 11), Nemesis's reply by damage type | [run] |
| Jegged "Omega Ruins" and "Nemesis"; Gamer Guides "Ultima Weapon", "Omega Weapon" | the guides' account: agrees with the files except where RE §7 says | [guide] |
| `src/data/ffx/builds/mirror-aeons.ts` | the endgame party (HP 9,999, stats 255, Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon, Break Damage Limit, Yojimbo and the Sisters) | [estimate], build point sourced |
| Samurai Gamers (404), GameFAQs, StrategyWiki, Final Fantasy wiki (403) | not read; the tie-break was never needed | [RE header] |

## 2. What the player experiences, in plain words (the game's own rules, RE §4)

**The set-up.** Three fights in a row, each its real formation: **Ultima Weapon** (99,999 HP), then **Omega Weapon** (999,999 HP), then **Nemesis** (10,000,000 HP). Escape and Flee are off in the two Ruins fights; Switch and Summon work; you pick any three of seven and any of the twelve aeon slots.

**Act I, Ultima Weapon.** A six-turn cycle: Attack, then (with no aeon out) one of Petrify-Break, Silence or Confuse, Core Energy, one of Holy, Sleep or Confuse, Attack, Shimmering Rain on all; with an aeon out the status turns become Core Energy and Rain. Nothing reacts to your hits.

**Act II, Omega Weapon.** It absorbs all five elements and is immune to every status. Each turn a third of the time it Attacks, otherwise it steps through a four-turn cycle: Core Energy, (Break or Confuse), Shimmering Rain, (Ultima or Demi), or with an aeon out Core Energy and Rain twice. **A hidden counter (+5 for an Attack, +2 for a special) sends Nova at 30**: on average every 11 to 12 of its turns, never fewer than 7 nor more than 16.

**Act III, Nemesis.** It acts about every 9 CTB (as often as a Hasted AGI 255 member does every 4). Each turn: Attack, Ethereal Cannon (one target), Ultra Spark (all, with Poison, Power Break, Slow, Curse) in a cycle. **A hidden counter (+3 for an Attack, +2 for anything else) sends Armageddon at 20: 99,999 to everyone, on average every 9.9 of its turns, never fewer than 8 nor more than 11.** **Every Overdrive, Mix, Steal and the like that hits it is answered by an Ultima on your whole front line** (5,100 to 5,800 each against the caps); Attack, Quick Hit and spells are not. It absorbs all five elements and is Armored (plain physical hits are divided by 3 unless the weapon pierces). Auto-Life (or a Phoenix Down every time) is what keeps the party standing.

**The wins.** Ultima: 20,000 gil, 40,000 AP, Lv. 3 Key Spheres x3, a steal of Door to Tomorrow, gear. Omega: 30,000 gil, 50,000 AP, Lv. 4 Key Spheres x3, Gambler's Spirit, Lancet teaches Kimahri Nova. Nemesis: 55,000 AP, Warp Sphere or Dark Matter. [RE §1.3]

**The design fact `[derived]`.** Ultima and Omega are the last two **checks of preparation** (a mid-endgame party feels them; the caps do not). Nemesis is the fight: **survive every Nemesis turn, never let Armageddon find you without Auto-Life, and win on damage that does not set off the Ultima counter.**

## 3. Engine work

Each row is mapped to the files on `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`encounters.ts`, `battle/ffx/setup.ts`, `chapter-meta.ts`) get net-zero edits or a one-line hook.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Records, rows (Ultima: Attack, Core Energy, Shimmering Rain, Break, Silence, Confuse, Sleep; Omega: Attack 0x410F, **Nova 0x4067**; Nemesis: Attack, Ethereal Cannon, Ultra Spark, Armageddon, Ultima; the **player-side Holy, Ultima and Demi cast by a monster**), loot, the status bytes, Armored on Nemesis | **Existing** formulas 1, 2, 3 and 5; the 99,999 cap bit (`always-break-damage-limit` in `adapt/command.ts`); Petrify, Confuse, Silence, Sleep, Poison, Power Break, Slow, Curse in the status set; new data | new `data/ffx/enemies/weapons.ts` + `loot/records.ts` entries | M |
| 2 | Ultima's six-turn cycle with the **aeon-on-the-field** branch, evaluated every turn | **New logic, existing hooks** (`ai/hooks.ts`; the same front-line query the Keeper and Spherimorph need) | new `ai/ultima-weapon.ts` | S |
| 3 | Omega's two counters, the draw mod 3 and mod 2 picks, the two cycle branches | **New logic, existing hooks**; the exact distribution is the test pin | new `ai/omega-weapon.ts` | M |
| 4 | Nemesis's Armageddon counter and three-step cycle | **New logic, existing hooks** | new `ai/nemesis.ts` | S to M |
| 5 | **Nemesis's reply by damage type** (answers any command whose damage class is neither physical nor magical, once per action per target) | **Partly**: `UsedCommand.def` and `HitReport` exist; the engine's ability def must expose the physical, magical or special class (T0 reads it); the reply is a `queueReaction` | rules file | S to M |
| 6 | A monster casting player-side rows (Holy, Ultima, Demi) | **Existing** pattern (a monster using player rows: Evrae's Haste, the Keeper's Curaga) | data | S |
| 7 | The chain: Act I to II to III, each its own formation and `plate`, heal between acts | **Existing** (`EnemyGroupDef.nextGroupId`, `plate`, `checkpointOnEntry`, the Mirror Aeons precedent) | group data | S to M |
| 8 | Formation: Escape and Flee off for characters **and aeons** (Ultima, Omega), Normal start, three party entries, twelve aeon entries, a second Omega area unused | **Existing** (`formation-commands.ts`, `commandDisables`) | formation data | S |
| 9 | The party: the Mirror Aeons build unchanged (Tidus, Yuna, Lulu in front; Yojimbo and the Sisters on the roster) | **Existing** (`builds/mirror-aeons.ts`) | none | none |
| 10 | Zanmato against bytes 3, 3 and 4 | **Existing** (Yojimbo's rules; the Pay roll reads the monster's byte) | data: the three bytes | S |
| 11 | HUD | **None new**; the HELP bar names the moves; no tell for the hidden counters (WP7) | | none |
| 12 | Presentation: three large bosses, one plate and its relights, Nova, Ultima, Armageddon effects | **New** (the biggest item) | `scenes`, `engine` | L |
| 13 | Chapter plumbing: new `ChapterId`, `Chapter.number` 43, meta, story, door word `weapon`, guide, tactic; absence tests | **New**, via side tables and new files | PLAN §7 | M |

**Order of dependence:** 1 first; 2 to 4 are independent; 5 needs T0's read of the damage class; 7 after 1 to 4.

## 4. The party

- **Build point: the Mirror Aeons build, unchanged** (`builds/mirror-aeons.ts`): the endgame party at the caps (HP 9,999, MP 999, every other stat 255, Luck 60, Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon on all, Break Damage Limit on every weapon, First Strike on Tidus and Yuna, Yuna's aeons at 600 battles, Yojimbo and the Magus Sisters on her list, 1,500,000 gil, 17 Phoenix Downs). **Every number is an `[estimate]`** (that file's own header); it is shared with rows 34, 35 and 54, so the same party meets the whole superboss set. Front line **Tidus, Yuna, Lulu**, bench Auron, Wakka, Kimahri, Rikku (the Mirror chapter's line).
- **Two gaps this chapter adds, neither filled here (rule 6):** (a) **the endgame weapons carry no Piercing** (`ENDGAME_WEAPONS`), so against the Armored Nemesis a plain physical hit is divided by 3 (37,711 to 42,582 instead of the 99,999 cap): a Piercing slot is a bench lever; (b) **Auto-Life** is Yuna's spell here (`EXTRA_SKILLS`), and Armageddon needs it (or Phoenix Downs) every cycle. Both are named levers, never tuned toward a result.
- **A mid-endgame preset is not built** (the repo has none between the Zanarkand cells and the caps). If Bailey wants Ultima and Omega to bite, the lever is a new party preset (about 4 hours, an `[estimate]` cell of RE §6), **never the boss**.
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line is unwinnable or trivial, Bailey gets options with numbers.

## 5. The arena

- **No Omega Ruins plate exists.** The game stages Ultima Weapon and Nemesis in the same place (identical start positions and camera work; the party on the left, the monster on the right, twelve aeon slots behind) and Omega in a second (the party on the right, the monster on the left). The nearest existing plate in the art mirror is **`cavern-stolen-fayth`** (a dark cave with shafts of cold light and a glowing ring platform on the floor): it reads as "underground, ancient, a platform for a fight" and is the closest match; `zanarkand-dome` (violet ruins, a glowing half-dome) and `garden-of-pain` (purple slabs over water) are further away.
- **Options (end state first, rule 9; a mockup at real resolution each, owed before building):** **(a)** the `cavern-stolen-fayth` plate as is for all three acts with the existing Cavern rigs (0 new plates; risk: it is Chapter IX's place, Yojimbo's, and the three bosses will be small against it); **(b)** the same plate **relit per act** (Ultima: pale ring; Omega: the glowing end of the path, a brighter ring and a mirrored camera; Nemesis: a dim red cast): 2 derived plates; **(c)** a new `omega-ruins` plate with its own depth map and rigs. **Recommendation (b)**: one approved plate, relit, since the plan's picture of the place is a ring of light in a cave; (c) if the frames show the Cavern fights the story position.
- **No phone rigs exist** for this plate in the Omega framing; a 390 x 844 solve is part of the pick (the party is a line; the bosses are large).

## 6. New art needed

Counts are images. Poses follow the repo's boss sets: idle, attack, cast, hurt; ko where the body stays (Nemesis dissipates).

| Asset | Images | Note |
|---|---:|---|
| **Ultima Weapon** (a large armoured flying machine in the game's description; no equivalent in the mirror) | 5 to 6 | idle, attack, cast (Core Energy, Holy), the rain pose, hurt, ko |
| **Omega Weapon** (a large mechanical dragon-like machine) | 5 to 6 | idle, attack, cast, Nova charge, hurt, ko |
| **Nemesis** (a colossal dark fiend; a recolour of Ultima Weapon is the flagged stand-in) | 3 to 5 recoloured, or 5 new | idle, attack, cast (Ethereal Cannon, Ultra Spark), Armageddon, hurt/dissipate |
| Backdrop | 0 to 2 derived, or 1 new | (a) as is, (b) two relit variants, (c) one new plate with depth |
| Effects (Nova, Ultima, Armageddon, the rain, the cannon) | 4 to 5 | may be drawn in code |
| Chapter card, thumbnail, pause plate | 3 | from the picks |
| **Total** | **about 20 to 27** | |

- **Recolour of existing paintings:** none of the mirror's boss paintings is close in silhouette to a Weapon or to Nemesis (`sin-core`, `overdrive-sin`, `yu-yevon`, `evrae` and `spectral-keeper` are the nearest large bosses and none fits); Nemesis from Ultima Weapon is the only recolour the plan names, with the **dark-recolour recipe** the Dark Yojimbo and Sisters sets used (prompts and seeds in the mirror). It is a compromise: a different monster in the game, so WP6 keeps "a new Nemesis painting" as the alternative (about 5 more images).
- Art route is the driver's (the Art Room per the standing art rules); nobody queues ComfyUI here (rule 12). Retail references are allowed (hard rule 8); the painting that ships must match the approved painted look (rule 9). **Bailey alone approves a painting.**

## 7. Music (rule 13: only his ears judge)

The game plays its normal boss themes. Stand-ins (flagged, the driver's pick): scene bed `scene-zanarkand-dome` (ruins; exists) for the Ruins acts; battle cue **`boss-challenge`** (the neutral FFX boss cue) for Acts I and II and **`boss-yu-yevon`** for Act III, with **`boss-sin-assault`** as the alternative; an entry on the audition page for Bailey. Alternative: one new take under the standing delegation (needs the driver's spend note; rule 11).

## 8. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

**Levers, and only these** (the Mirror chapter's rule): the **party preset** (`mirror-aeons.ts` constants) and **which real formations the acts use**; here each boss has exactly one formation, so the preset is the only lever. **Never** a boss number.

**Target.** Act III, the advisor's line wins **about 70 percent** (60 to 80 accepted); a careless line (no Auto-Life, Overdrives into the Ultima counter) loses under 20 percent. **Acts I and II are expected to be formalities** (above 99 percent for the advisor's line, and a plain-Attack line also above 95 percent): the bench reports that **honestly, with the damage tables**, rather than tuning anything. **Levers for Act III, in order:** the Phoenix Down stock (`ENDGAME_PHOENIX_DOWNS`) and Yuna's Auto-Life; a Piercing slot on the weapons (against the Armored division); the aeon roster and their Overdrive gauges on arrival; Yojimbo's Pay (a measured line with and without him, as the Mirror chapter does); Luck last (Nemesis's moves always hit).

**The sourced line the advisor carries (`engine/tactics/weapons.ts`, one named constant per rule):** Haste is armour (Auto-Haste); Auto-Life on everyone **before** the Armageddon window (the counter is hidden, so recast it every cycle: a cast lasts until the KO it prevents); Quick Hit and Piercing attacks for damage (**no Overdrive unless the party can eat 5,100 to 5,800 each**; Lulu's non-elemental spells and Doublecast do not set off the counter either); an aeon with Shield for Nova (Omega) as the guides advise; Stoneproof and Ribbon against the status turns (the caps preset has Ribbon).

**Predictions from the arithmetic (to be falsified by the bench, not promises):** (1) Ultima Weapon dies in the first or second hit and Omega in 11 hits, so Acts I and II take under three rounds; (2) at the caps the Weapons' damage is under 330 per hit and Ultima's Attack never lands (Evasion 255): the only risk is the **mid-chain heal** being skipped; (3) Nemesis's Attack (14,000 to 15,800), Ethereal Cannon (19,000 to 21,500, 37 percent survivable with Shell at full HP) and Ultra Spark (28,000 to 31,500) **each kill a 9,999-HP member**: Auto-Life or a Phoenix Down is needed after most Nemesis turns, which makes the Phoenix Down stock the clock; (4) Armageddon arrives between its 8th and 11th turn, about every 22 member actions: Auto-Life must be on by then or the party is wiped; (5) 101 hits of 99,999 need a Piercing weapon or spells (about 250 plain Armored hits otherwise: four Armageddon windows); (6) an Overdrive costs the party about 5,100 to 5,800 each: affordable once per cycle at 9,999 HP, not at 1.

**Tests (T0 first, T9 last):** T0 the engine checks (row 5's damage-class read, the aeon-on-the-field query, the 99,999 bit on a monster row, Petrify-Break and Curse end to end); T1 the data fixture; **T2 the AI rules with the interpreter's exact tallies as pins: Ultima's two six-turn cycles (14 turns each) and the three draws of each status turn; Omega's two four-step cycles, the Attack share 21,846 of 65,536, the Nova counter distribution (7: 0.14, 8: 0.55, 9: 8.11, 10: 26.18, 11: 9.10, 12: 32.51, 13: 18.01, 14: 1.54, 15: 3.51, 16: 0.34 percent; mean 11.443) and the draws-all-0 and draws-all-1 sequences; Nemesis's cycle, the Armageddon distribution (8: 0.69, 9: 25.18, 10: 59.83, 11: 14.31 percent; mean 9.878) and the reply table for the 12 commands of the run**; T3 the build check (the Mirror build unchanged); T4 the bench (12 then 500 seeds, copied from `tools/mirror-aeons-bench.mjs`, the advisor's line, the careless line, with and without Yojimbo, with and without Piercing); T5 the HUD (none new); T9 the integration. Rule 14: FFX only; the absence test names `ffx2-atb-golden` and `ff7-golden` unchanged.

## 9. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| WP1 | Number and word | **43, door word `weapon`** (PLAN §8; checked against the 15 words and `pilgrim`) | none |
| WP2 | Shape | **One three-act chain**: Ultima Weapon (`omeg00_10`), Omega Weapon (`omeg01_10`), Nemesis (`zzzz02_76`), heal between acts (the PLAN's call 4 keeps Nemesis here) | three chapters (adds two numbers and the same arena) |
| WP3 | Party | **the Mirror Aeons build unchanged**, front line Tidus, Yuna, Lulu | a new mid-endgame preset for Acts I and II (about 4 hours; the card says so) |
| WP4 | Honesty | the card and the guide say Acts I and II are formalities for a maxed party and name the guides' numbers | none |
| WP5 | Arena | **(b) the `cavern-stolen-fayth` plate relit per act**, mock (a) as is and (c) a new plate beside it | (c) as the first build |
| WP6 | Looks | Ultima and Omega new paintings; **Nemesis a recolour of Ultima** (flagged) | Nemesis a new painting (about 5 more images) |
| WP7 | The hidden counters (Nova, Armageddon) and the Ultima counter | **hidden, as in the game**; the guide teaches the Nova threshold and says Overdrives are punished | an on-screen tell (not faithful) |
| WP8 | Aeons | allowed (Summon is not disabled; an aeon out changes both Weapons' cycles: faithful) | barred (not faithful) |
| WP9 | Yojimbo and Zanmato | on the roster as in the Mirror build; the bench measures with and without; the three bytes (3, 3, 4) are the game's | Yojimbo removed (a different party) |
| WP10 | Music | stand-ins of section 7 | a new take |
| WP11 | Start | Normal for the two Ruins fights (the formations write it); Nemesis's formation writes none, so Normal | none |

## 10. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types.ts,src/battle/ffx/**,src/data/ffx/**,src/scenes/**` was **not run** (treeless lane); by the Keeper preflight's reading the same rows apply: the chapter registry, the shared combat core and the FFX engine each class a change **DEEP**, so expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class. The driver re-runs the command from the host. **Ship the wave-3 chapters in one release** so they share one deep review.

**Tracks (small vertical slices):** T0 engine checks (rows 2 and 5 of section 3); T1 data + loot; T2 the three AIs and rules; T3 the chain and formations; T4 the bench; T5 scene and plate (blocked on WP5); T6 art (blocked on WP6, serialised); T7 guide/story/card; T8 the integrator (shared tables, tests, the door-word re-check with `door-check.mjs`); T9 the integration. **Host (PLAN §6, wave 3, driver's call):** the `rig-v2` tree (merged and live, one untracked file, art mirror old: **repoint `public/art` to the newest mirror first**), branched from `origin/r75-boss-art` until r75 merges.

## 11. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 14 | **3** | the three AIs are read; the live checks of section 13 |
| B build | 24 | **17** | data and rows (3), the three AIs (S + M + S to M = 5), the damage-class reply (1), the chain and formations (2), plumbing (3), guide and story (2), the tactic (1) |
| A art | 16 | **16** | three large bosses (9), the plate and relights (3), effects, cards (4) |
| I integration and tests | 10 | **9** | the 12 to 15 shared tables (PLAN §7); the party and the chain exist |
| **Total** | **64** | **45** | |

## 12. Top risks

| Risk | Answer |
|---|---|
| Acts I and II feel like nothing | by the numbers at the caps (RE §6); the card says so; a mid-endgame preset is the named lever |
| Nemesis's reply to every Overdrive surprises the player | hidden as in the game; the guide says it; the bench measures a line that spends Overdrives |
| The damage class of an ability is not available to the AI hook | T0 checks it first; if absent, a small read of the ability def's kind (row 5 grows to M) |
| Armageddon wipes the party before Auto-Life is up | by design; the advisor casts it every cycle; the Phoenix Down stock is the lever |
| A recolour of Ultima looks wrong as Nemesis | WP6's alternative (a new painting) |
| Zanmato ends Nemesis in one Pay | by the game's own rules (RE found no immunity reader); the Pay roll with byte 4 is the limit; the bench reports the line with and without Yojimbo |
| A host file at the 400-line cap | net-zero edits and side tables; shared edits left to the integrator |

## 13. Open questions, and the live checks that settle them (about two hours)

1. **Does the engine raise onHit for the no-damage special commands (Steal, Jinx, Threaten, Provoke, Talk, an item) against an immune target**, and does a Zanmato that kills fire the reply? One engine test each (RE §8).
2. **The launching events' battle flags** (the defeat rule, whether the Monster Arena allows Escape for Nemesis): the formation for Nemesis disables nothing; the chapter treats a defeat as the normal result screen.
3. **The Bribe price of Ultima Weapon** (about 2.0 to 2.5 million gil by the sources; the file holds the factor only): not needed unless Bribe is offered in the chapter.
4. **The second area of `omeg01_10`**: not used; area 0 is the fight.
5. **Whether a Piercing slot is in the endgame weapon set** the bench uses (a bench lever, section 4).

## Corrections and findings (what the mapping turned up)

- The plan said "Nova's row is in `research/ffx-combat-core.md` (rank 7, power 70)": that is Kimahri's Nova. **Omega's Nova is 0x4067 (formula 3, power 60, MAG 57).**
- The plan said "Omega's four-stage cycle and hidden Nova counter come from the wiki only": **both are exact in the file**, plus the aeon branch.
- The plan said "Nemesis is Ultima recoloured": a stand-in only; the monster and the AI are different, and the **Ultima counter on special commands** is new information.
- "Omega Ruins: no plate": `cavern-stolen-fayth` is the nearest in the mirror and the pick's start.
- Ultima Weapon has **no** element affinity; Omega absorbs all five; Nemesis absorbs all five and is Armored; none can be Slowed, Slept, Confused, Provoked or Threatened; Ultima takes Silence and Darkness only from a chance above 95.
