# Paper preflight (draft): Chapter 42 (hidden) — The Youth League Tournament, Mushroom Rock Road (FFX-2) — branch `ch-youth`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`, `ch-tourist-trap-review.md` and `chapter-gippal-review.md`: a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-06 by a Sonnet sub-agent of the release driver, as the paper preflight of plan row 42 (wave 3) from its research note (`research/re-ffx2-youth-league-tournament.md`, "RE §n" below). It is a **draft**: the driver reads it, takes or overturns each pick in section 10, and a build lane starts from it. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables of section 3.4); the run it needs is the one this chapter's tests already imply.

**Authority (relayed words, verbatim):** 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too" (the researched bosses he never picked); 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick below is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note (written first, in this lane), `origin/main` 4310f6b63 (the engine claims in section 3 were re-checked by reading it: `src/battle/ffx2/ai/den-of-woe.ts`, `leblanc-syndicate.ts`, `script-rolls.ts`, `targeting.ts`, `steal.ts`, `src/data/ffx2/enemies/den-of-woe.ts`, `src/data/chapter-ffx2-den-of-woe.ts`, `src/data/ffx2/builds/farplane.ts`, `den-of-woe.ts`), `docs/plans/den-of-woe-bench.md`, the program plan's rows 38, 42, 47 and section 8, the art mirror's backdrops and character sets. Nothing was run, so rule 3 ("prove it by running the engine") is owed by T0 and T8.

**Verdict: PROCEED.** The data, the nine scripts and the seven-act chain need no new mechanic; one engine fact is checked first (T0, section 3.1); everything Bailey will see or hear waits for the picks of section 10 (hard rule 9), which the driver takes under the delegation above.

## 1. Game case and sources

**Game case: FFX-2 only.** The mission "Youth League Tournament" of Chapter 5 (ATB, dresspheres, the FFX-2 item rows and status set). FFX's CTB and its Mushroom Rock Road chapter (the hidden Sinspawn Gui chapter, word `mushroom`) are different fights on the same road; nothing of FFX's data or code is reused and no FFX file changes behaviour. The shared plumbing (the chapter registry rows, the door row, the scene row) is "both" (`critic/CHECKS.md` CHK-020) and additive: a build without the chapter behaves as before.

**Sources** (the note's tags: **R** read from the game's files, **I** inferred, **G** a guide): the kernel rows of Yaibal 183, Lucil 184, Elma 279 and five League rows (RE §3); nine AI sources, each equal to its compiled worker (RE §1, §5); the Mushroom Rock Road event package, which gives the seven battles, their order and the exit rule (RE §2, §8); Jegged, Gamer Guides, DrSlice (RE §9). The repo has no earlier note on the tournament beyond one line in `ffx2-combat-core.md` §10.2 ("Lucil at Mushroom Rock, seven" fights with no field step between them: the seam is real for acts 5 to 7 only).

**The plan's row 42 corrected by the files (RE §10):** seven acts, not three rounds; Elma is **row 279**, not 185; "item-using enemy AI" is data, not engine; the seventh act's win ends the tournament, a defeat anywhere returns to the start; research done, size down to about 33 h.

## 2. What the player experiences, act by act (plain words)

The tournament is a **walkover by design** [G: Jegged "easy fights", Gamer Guides "a walkover"] and by the numbers (RE §7: the strongest single hit is 168 to 190 on a Level 50 Dark Knight, about 5,000 HP). It plays as a staged run: a brass-and-drums bout seven times, with three named opponents each doing something a little odd. No boss number is touched.

| Act | Scene / rows | What it does (RE §5) | What it asks of the player |
|---:|---|---|---|
| 1 | `kino01_223`: **Yaibal** (Lv 26, 4,330 HP) + 2 League Warriors (Lv 24, 422) | Yaibal attacks; **if Yuna is down, one turn in three he attacks and two in three he Phoenix-Downs her (25 percent of her HP)**; if Yuna is below a quarter of her HP he Hi-Potions her (1,000) or, one turn in three, hits Paine or Rikku instead; otherwise a quarter of his turns are the "Sorry" grenade (468 to 529 to each girl). Warriors attack and Hi-Potion a wounded friend. | Break the Warriors, win the first bout. The odd thing to see: the opponent looks after Yuna. |
| 2 | `kino01_220`: 2 League Mages (Lv 23, 1,020; 420 MP) + a Veteran (Lv 33, 1,720) | Mages cast Fira/Blizzara/Thundara/Watera at one girl or all, Confuse, Demi (25 percent of current HP); the Veteran attacks. | Kill the Mages first (low DEF, MDEF 52). |
| 3 | `kino01_219`: Warrior + 2 Veterans | Attacks; a Veteran's one-in-five **Critical Attack** goes to the girl with the lowest HP; the Warrior heals a friend under a quarter. | A plain brawl. |
| 4 | `kino01_218`: 2 Slashers (Lv 30, 1,650) + a Master (Lv 32, 1,732; 670 MP) | Slashers attack or throw a Flash Bomb (Darkness 50 on the party, one in six); the Master casts one element picked at the start, at one girl or all. | The first status the tournament throws (Darkness 50 from the Flash Bomb); the Master's element is drawn once, so it is the same element all fight. |
| 5 | `kino01_217`: **4 Veterans** (6,880 HP in all) | Four Veterans, each turn one in five a **Critical Attack** on the lowest-HP girl, the rest plain attacks. | The first act of the unbroken run: nothing is healed after it. |
| 6 | `kino01_221`: **Elma** (Lv 36, 4,882; 870 MP) + 2 Veterans | Elma **guards herself and both Veterans first** (Shell, Protect, Regen), then picks the girl who lacks Reflect: the four -ra spells, Confuse, Sleep, Osmose, Flash Bomb and Hush Grenade on the party; if all three reflect, Dispel. | Dispel the Guard or ignore it; Reflect on all three turns her into a Dispel machine. |
| 7 | `kino01_222`: **Lucil** (Lv 43, 7,324; 370 MP) | Every fifth action **Harbinger** (damage plus **Doom, counter 4**) on a girl who has none; between them Lunar and Light Curtain on herself, each elemental Gem once (six hits of about 100), one Gold Hourglass (Slow), two Hi-Potions at most. | Kill her or cure the Doom in time. **Her defeat ends the tournament:** speech, results. |

**Seams.** Acts 1 to 4 are fought on the road with a field walk between them (the menu is reachable) [RE §2, I]; acts 5, 6 and 7 are one function with dialogue between and no menu [RE §2, R]. A defeat anywhere is not a game over: the party is returned to the road's start [RE §8, R for the branch]. **Total pool 40,354 HP; EXP 5,370, Gil 2,760, AP 22** (the game's own, RE §0); no item of its own.

**The three odd things to keep and to say:** Yaibal's care for Yuna (no guide mentions it; the script does it); Lucil's five-beat Harbinger rhythm and two-potion cap (the guide lists her moves, not the rhythm); Elma's guard on the whole line. The intent board states each in plain words (T5).

## 3. Engine work

Checked by reading `origin/main` 4310f6b63; the Maesters, Den of Woe and Syndicate notes are the precedents.

### 3.1 What is new (small)

| # | Item | Why | Size |
|---|---|---|---|
| E1 | **An enemy command that heals or revives a girl.** Yaibal's Phoenix Down on a KO'd Yuna and Hi-Potion on a hurt one | `targeting.ts` resolves a named target by id and the flag `can-target-dead` opens KO'd units (`isTargetable`), so the aim should work; **whether the resolver applies a recovery row to an opposing-side target** (and the Death cure) is the one unknown. T0 proves it by running the engine (rule 3) | T0, 1 h; fix, if any, in the resolver and additive |
| E2 | Enemy ability rows for the throws: Ice, Lightning and Water Gem, Gold Hourglass (Slow party), Phoenix Down, Hi-Potion, Light/Lunar Curtain, "Sorry" grenade, Critical Attack; plus the casts (Not-So-Mighty Guard, Dispel, Osmose, Confuse, Sleep, the four -ra spells, Demi, Flash Bomb, Hush Grenade) | the established pattern is one `x2-<chapter>-<name>` ability record per move (`den-of-woe-abilities.ts`, `leblanc-syndicate-abilities.ts`; `x2-leblanc-flash-bomb`, `-hush-grenade` exist and may be shared); item ids for Fire Gem, Hi-Potion, Phoenix Down, the Curtains and Gold Hourglass exist in `data/ffx2/items` for the party side | data, about 28 rows (RE §6) |
| E3 | **Doom counter 4 from a row.** Harbinger's status byte 254, time byte 4 | the engine has `doomTurns` and a duration model (`types.ts`: Doom counts 10,000 units of the owner's speed); T0 checks that a row's time byte reaches the girl's Doom counter as it does for the Maesters, and that cures (Esuna, Remedy, Dispel Tonic: whichever the data lists) remove it | check, 0.5 h |
| E4 | A **chapter-level rule**: the seventh act's win completes the tournament (results, the closing card); a defeat anywhere is the chain's ordinary loss | the Den of Woe chain already does this (`nextGroupId`, `carriesFullPartyState`, `canEscape: false`, `checkpointOnEntry`) | data only |
| E5 | **A tournament ladder** in the HUD (section 7, option A) | a small chip row over the existing chain HUD | HUD, 2 h |

### 3.2 What exists and is enough (read in `origin/main`)

* **A chain of acts:** `EnemyGroupDef.nextGroupId`, `carriesFullPartyState` (HP, MP, KO, items, statuses, dressphere and grid progress carry: the Den's GP3 a), `canEscape: false`, `checkpointOnEntry` (a retry from the state the party entered the act: Trema's and the Den's GP4 b seam, `BattleChainCheckpoint.ts`), `musicCues`; spoils per act (`BattleChainSpoils.ts`).
* **AI scripts:** the contract `AiScript(ctx) -> Command`; `script-rolls.ts` (`scriptMod` for `random() % n`, `pickId` and `searchUniform` for picks, `girls(ctx)`, `lacking(girls, status)` for "a girl without Reflect/Doom", `maxHpDiv` for "HP below a quarter"); `extremeId(..., 'min'|'max')` for "lowest HP" and "most MP" (the Den's Baralai Absorb and Gippal); `ctx.allies()`; per-unit memory (`mem`, `setMem`) for the counters; `target.stolenFrom` (`steal.ts`) for the Warrior's "has been stolen from"; Not-So-Mighty Guard on all monsters (Leblanc's script); multi-hit rows spread over random girls (Black Sky, Meteor, Blitz Ace). A draw only where the script's condition holds (the Lucil tests) is the Maesters' conditional-draw rule.
* **Aim picks without positions:** the scene files carry none (RE §4), so the near-weighted picks are uniform, as in the Tourist Trap and Leblanc notes.
* **Monster records:** `src/data/ffx2/monster-records/records-<chapter>.ts` with a fixture under `tests/fixtures/parity/ffx2/` (the Tourist Trap's re-pin), attached through `attachMonsterRecords`.
* **Party prep, carry, results, door, tactic, guide, sensor and scan texts:** the same set as the Tourist Trap (`chapter-ffx2-tourist-trap.ts`, `chapter-meta-ffx2-tourist-trap.ts`, `chapters-experiments.ts`, `guides/ffx2-tourist-trap.ts`, `engine/tactics/*`).

### 3.3 The nine scripts

One file for the three named fighters (`ai/youth-league.ts`: Yaibal about 45 lines, Lucil about 70, Elma about 55) and one for the five League types and their coin-flipped single-or-party casts (`ai/youth-league-league.ts`): under the 400-line rule. Each follows its source line for line (RE §5): Yaibal's three branches on Yuna; Lucil's counter (fifth poll Harbinger, the seven ordered one-in-eight tests, the per-fight Gem and Hourglass flags, the two-potion cap); Elma's opening guard, the "girl without Reflect" search and the `% 11` table; the Warrior's heal-a-friend rule; the Veteran's `% 5`; the Slasher's `% 6`; the Mage's MP gate and `% 5`; the Master's element drawn once. **No time-out block** (RE §7). Deterministic under the seeded RNG; rule 5: every row whose accuracy formula is 0 (Harbinger, Critical Attack, the spells, the throws) gets `canMiss: false`; the plain Attacks (accuracy formula 2, race with ACC 95; Elma's formula 1 against 130) roll.

### 3.4 The shared hot spots (not this lane's)

The 12 to 15 shared tables every new chapter forces (the program plan, section 7): the unions in `encounters.ts`, `chapter-meta.ts`, `chapters-experiments.ts`, `battle/ffx2/setup.ts` hooks if any, the door table and its test (the sixteenth word), `chapter-numbers.test.ts`, `critic/runner/lib/route-pure.mjs`, `artNamespace.ts`, `CONTRACT-CHANGES.md`, `CHANGELOG.md`, `THEMES.md`. They are the wave's **integrator** commit; this lane builds in new files and side tables, and its "I" hours (section 11) are tests and the bench, not those edits.

## 4. The party

**The Chapter V preset, unmodified: `farplaneBuild`** (Yuna White Mage Lv 46, Rikku Dark Knight Lv 48, Paine Dark Knight Lv 50; Tempered Will, Flash of Steel, Pride of the Sword; Crystal Bangle on all, Hyper Wrist on the Dark Knights; Lady Luck on every grid; the bag of 40 Potions, 30 Hi-Potions, 20 X-Potions, 15 Mega-Potions, Elixirs, Turbo Ethers, 25 Phoenix Downs, 15 Remedies, Curtains and Feathers; 200,000 gil). **No kit options** (no Hero Drinks, no level bonus): the Den's raises exist because its shades are Lv 52 to 63; these opponents are Lv 22 to 43.

**Why:** (1) it is the repo's one sourced Chapter 5 build point (band 43 to 52, `ffx2-combat-core.md` §5.1b, `[estimate]` for the three levels); (2) the Den of Woe, the same road in the same chapter, already plays it; (3) the sourced line is two Dark Knights plus a White Mage, a fine answer to every act here. **The tournament is early in Chapter 5, so Lv 40 to 44 is the other honest reading;** the bench (section 8) measures both and reports; no number moves for either. `[estimate]` in Bailey's name, as the Den's G-12.

**Alternatives:** the Chapter 3 build (`djoseBuild`, Lv 32/33/34) as a harder what-if; a Lv 40/42/44 variant of the preset. Neither is recommended; both are measured.

## 5. The arena

The game's scene: battle map 1036, "Mushroom Rock Road side path (first half)", wasteland ground (RE §4). **The repo's plate `mushroom-rock-road`** (2,688 x 1,536, the hidden FFX Sinspawn Gui chapter's, status PROVISIONAL, an overnight agent pick, never approved by Bailey) is a sandy cliff road with a lift gondola and the sea at the right edge: the right place, but tagged "FFX only" and unpeopled; **`mushroom-rock-road-ruined`** is the burning aftermath of that chapter and the wrong mood. **Recommended: derive `mushroom-rock-road-league` from `mushroom-rock-road`** (banners, lanterns, a rope line and a bracket board on the cliff side: the Youth League's stage two years later), as a new plate that replaces no approved painting (rule 9, the Dark Yojimbo recipe: the derivation's prompt and seed saved). **Alternatives:** the plate as it stands with a CSS banner layer (cheapest, the chapter says it is a stand-in); `den-of-woe` (the ravine, nearer in the game's geography, too dark and blue for a bout).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| **Plate** `mushroom-rock-road-league` | derive from `mushroom-rock-road` (provisional) | 1 plate (+ @2x) |
| **Yaibal, Lucil, Elma** | none exist (the mirror has no League painting; the Syndicate goons `ffx2-dr-goon`, `ffx2-fem-goon` are Leblanc's; `baralai-shade`, `nooj-shade` are translucent shades) | 3 bodies, 4 poses each (idle, attack, hurt, ko; casts folded into attack: Elma and the Mages hold a staff) |
| **League melee fighter** (Warrior, Veteran, Slasher) | one body, **three colour variants** of the same pose set (the Th'uban-from-Keeper method of row 54) | 1 body x 4 poses + 3 palettes |
| **League mage** (Mage, Master) | one body, **two colour variants** | 1 body x 4 poses + 2 palettes |
| Props (Sword, Weapon) | **no separate art**: baked into the bodies (the game's props are visual links, not targets: RE §3.2) | 0 |
| Party | Yuna, Rikku, Paine in the Chapter V dresspheres exist (`yuna-white-mage`, `rikku-dark-knight`, `paine-dark-knight`, `chapter V` sets) | 0 |
| Portraits | Yaibal, Lucil, Elma speaker portraits for the story beats | 3 (optional, YL10) |

**Direction:** painted 2.5D from the approved pipeline (no 3D, no Meshy; hard rule 9 and the 2026-10-20 "AI slop" verdict on 3D models); the identity words come from the visual bible where it has them; Yaibal and Lucil's looks are inferred from the game's models (`0x10b7`, `0x10b8`) only if the art lane reads them. **The art lane pilots 3 to 5 and Bailey looks before any batch** (the pose-recipe lesson, 2026-09-21). ComfyUI wall time serialises through the machine-wide GPU lock; the budget is the plan's A8 (3 named + 2 mob bodies + plate derivation + variants).

## 7. Presentation needs, and three layouts for the mockup lane (end state first, hard rule 9)

Nothing is built until a layout is picked; the driver picks under the delegation, Bailey overturns on sight. Written concepts first (the cheapest rung of the ladder); the mockup lane draws the survivor at real resolution.

* **A. The ladder (recommended).** A seven-pip bracket pinned at the top left through every act: pips 1 to 4 show League crests, pip 5 a padlock ("no rest from here"), pips 6 and 7 the portraits of Elma and Lucil; the current pip pulses, beaten pips go gold. Each act opens with a two-second banner ("Round 3 of 7") over the plate; between acts a one-line bark from the named fighter. Built on the existing chain HUD chip row; reads at phone width. Cheapest, clearest.
* **B. The road.** A horizontal road strip along the bottom: Yaibal's gate, three skirmish stops, Lucil's lift, with the party's marker walking; between acts 1 to 4 the camera pans the road and an items-and-dresspheres rest step (the party-prep screen reused with carried HP and MP) opens. The faithful seam, the most work (+5 h) for a walkover.
* **C. The card.** No persistent bracket: each act has a title card (like the chain chapters' cards) and a one-line results card; the three odd behaviours are surfaced only by the intent board. Lowest cost, least presence.

**Picks, with reasons, "driver's call, his to overturn":** A. **Intent-board lines (our own words, numbers from the files):** Yaibal: "He picks Yuna up when she falls and patches her when she's low. A quarter of his turns is a grenade at all three (about 500 each)." Lucil: "Every fifth action is Harbinger: Doom on a girl who has none yet. Between them, Curtains for herself, each Gem once (six hits of about 100), one Gold Hourglass." Elma: "She guards her whole line first, then goes after whoever has no Reflect. With three reflecting she dispels."

**Music:** stand-ins, not Bailey's ears (rule 13): battle `boss-ffx2-fallen-aeons` (the repo's brass-and-drums duel cue, the one Chapters XI and XVI play) on all seven acts; victory `victory-ffx2`. Alternative: `boss-leblanc` (a bright brass parade) or `boss-den-of-woe` (the road's own, darker cue). No new cue is asked for; the field bed is the placeholder chosen by the integrator. The game's own battle bgm number (879) is unmapped (RE §4). The audition page lists the choice for his ears.

**Story:** our own words, short beats (no quotation): Yaibal's invitation before act 1 (accept or step back to the chapter board), a one-line bark between acts, Lucil's closing words (the speech), the results card. The scripts follow the Den's placeholder pattern (`pre`, `post`, `mid`) until the writing lane picks them up (`research/writing-bible.md`).

## 8. Open questions, the winnability method, and the live checks

**Method (measure, never tune; the Den of Woe's, `docs/plans/den-of-woe-bench.md`):** a vitest bench with a driver helper, the same split of two speeds: **200 seeds at bench speed** and **40 seeds at "human" Wait-split speed** (1.5 s a menu). Rows: each act fresh; the seven-act chain; the unbroken run (acts 5 to 7); the party presets (the Chapter V preset, the Lv 40/42/44 variant, the Chapter 3 build as a what-if). For each: win rate, KO count, HP lost per act, engine seconds, Doom landed and cured, Yaibal's revives. **Reading the result:** the sourced difficulty is "easy" (G), so the bench's job is to confirm "easy" — an expected chain win of at least 90 percent at human speed on the preset — **not** a 60 to 80 percent band; if a row is far under, that is a finding for Bailey (a party question), never a boss tweak.

**Open items (RE §11), each with its fix:**
1. A defeat's exact consequences, Flee, and whether beaten acts repeat (the formation flags are unmapped): the build uses the chain's conventions (no escape, a checkpoint per act, YL4/YL5) and says so on the card. *Settle by:* Ghidra read-only GETs on the FFX-2 server for the flag columns, or a live loss on the Youth League path.
2. Yaibal's revive and heal (E1): T0 plays it in the engine; a live check of the HD game is the other witness.
3. The party level (section 4): measured both ways.
4. The "thinking byte" (30 / 10 / 0) and the Doom counter's real length at the girls' speed (the Maesters note's open item): neither moves a boss; recorded.

## 9. Review class

**DEEP**, by the shared registry tables (`encounters.ts`, `chapter-meta.ts`, `chapters-experiments.ts`, `ai/index.ts`, the door table), as the Tourist Trap. The save-data class is **not** touched (a hidden chapter with no save schema change: confirm at T9). One release per wave: the focused review before, the deep review after on the live build, within the cap of two deploys while one is owed (`AGENTS.md` Release). This lane does not deploy.

## 10. Build order, tracks, and the decisions (recommended picks; the alternative named)

### 10.1 Order (small vertical slices that can ship behind the word `youth`)

| Track | Work | Hours |
|---|---|---:|
| **T0** | engine checks by running it: E1 (an enemy heals and revives a girl), E3 (Doom counter 4 from a row; cures), the conditional-draw order of Lucil's tests, `stolenFrom` on a Warrior | 1.5 |
| **T1** | data: eight enemy records (`records-youth-league.ts` + fixture `youth_league_rows.json`), the enemy defs and groups (`youth-league.ts`, seven `EnemyGroupDef` with `nextGroupId`, `canEscape: false`, `carriesFullPartyState`), the ability rows (`youth-league-abilities.ts`) | 3.5 |
| **T2** | the nine AI scripts (section 3.3) and a registry line each; unit tests per script on a scripted RNG | 3 |
| **T3** | the chapter record (`chapter-ffx2-youth-league.ts`: id `ffx2-youth-league`, game `ffx2`, number 42, title "The Youth League Tournament", location "Mushroom Rock Road", sceneKey, buildRef `farplaneBuild`, enemyGroupRef act 1, music), meta, the retry rule, the results/closing card; spoils per act | 3 |
| **T4** | prep tip, guide page, tactic (the sourced line vs each act), scan/sensor texts, door row (typed word `youth`, number 42) | 2.5 |
| **T5** | HUD ladder chips (option A) and the three intent-board lines | 2 |
| **T6** | story beats (our words): invitation, barks, closing | 1.5 |
| **T7** | art: plate derivation, 3 named bodies, 2 mob bodies and variants, install (the art lane; wall time on the machine-wide browser and GPU lock) | A8 |
| **T8** | the bench and its tests (section 8) | 2.5 |
| **T9** | tests, handoff note, `CHANGELOG` entry, the integrator's shared tables (not this lane's) | 2 + integrator |

**Total: R1 B17 A8 I7 = 33 h** `[estimate]` in Sonnet agent-hours (the plan priced 42; the 8 h of research are spent in the note; E1 and E3 are checks, not features; no new mechanic). Counted the way the Keeper preflight counts (about 25 h for a new-mechanic chapter with a finished RE note). **Wave:** the plan's wave 3 stands; the research is ready now, so the lane can start the moment a host frees (the plan's section 6 rules apply: ancestry checks, 0 modified files, the art mirror repointed).

### 10.2 Decisions (YL1 to YL10)

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| YL1 | Scope | **The seven Chapter 5 acts only.** Elma row 185 (the Chapter 2 New Yevon-path miniboss) is **left out**: the two paths exclude each other in the game | an optional "act 0" on the Chapter 2 scene `kino01_229` with its enrage block (1 h more, plus Time Up Meteor) |
| YL2 | Party | the Chapter V preset `farplaneBuild`, unmodified (section 4) | a Lv 40/42/44 variant, or the Chapter 3 build, as measured what-ifs only |
| YL3 | Seams | **all seven acts unbroken** like the Den of Woe (`carriesFullPartyState`, the chain's own carry), with a banner and a bark between acts | an intermission after acts 1 to 4 that reuses the party-prep items screen with carried HP/MP and no free heal (the faithful seam, +5 h; layout B) |
| YL4 | Retry | `checkpointOnEntry` on acts 2 to 7: a loss retries that act from the state the party entered it (kind; the game's retry is unmapped, RE §8) | the Den's GP4 a: a loss anywhere restarts from act 1 |
| YL5 | Escape | `canEscape: false` on every act (the Den's rule; the flag is unmapped) | allow Flee (restarts the act) |
| YL6 | The script text | **follow each script exactly**: Yaibal heals and revives Yuna; no fairness tweak; the intent board says so | none (a boss-side change needs a measured option and Bailey's yes) |
| YL7 | Arena | derive `mushroom-rock-road-league` from the provisional plate (section 5) | the plate unchanged with a banner layer, or `den-of-woe` |
| YL8 | Music | stand-in `boss-ffx2-fallen-aeons`, `victory-ffx2` (rule 13: his ears) | `boss-leblanc` or `boss-den-of-woe` |
| YL9 | Id, number, word | `ffx2-youth-league`, **42**, **`youth`** (re-checked at 4310f6b63; it fits the door rule and tightens none) | `league` (also checked in the plan's pool) |
| YL10 | Portraits | three speaker portraits (Yaibal, Lucil, Elma) for the barks, drawn with the bodies | no portraits (text-only barks) |

## 11. Size and risks

**Size:** section 10.1. **Top risks:**
1. **E1 fails** (the resolver treats an enemy recovery on a girl as damage or refuses a KO'd opposing target): fix in the resolver, additive and tested; worst case Yaibal's two friendly moves are replaced by the next sourced branch **and the note says so** (never silently).
2. **Too easy to be a chapter.** The source is a walkover; the chapter's weight is the staging, the three odd fighters and the ladder. Honest: it is the shortest chapter of the program (about 4 minutes of fighting). The measured band is "easy"; difficulty comes only from the party preset (YL2), never a boss.
3. **Art cost** for five human bodies (the plan's A8 holds; the pose-recipe lesson: pilot 3 to 5 and look before a batch).
4. **A hidden mismatch in the nine scripts' conditional draws** (Lucil's seven tests and the Maesters' draw-only-when-the-condition-holds rule): T0 and the script tests pin the draw order.
5. **The Chapter 2 gate** is not kept by the repo: the chapter fixes the Youth League path as its precondition and says so on its card (the same note as row 47's Garik).

## Corrections and findings (what the mapping turned up)

1. **Row 42's rounds:** the game's mission is **seven battles**; the event package gives the order and the position triggers along the road.
2. **Row 185 is the wrong Elma** for the tournament (Lv 22 Chapter 2 fight; row 279 is Chapter 5's).
3. **"Item-using enemy AI"** needs no engine feature: thrown items are enemy ability rows (RE §6).
4. **Row 63's Last Mission, row 38's cup rows, row 47's Garik** are not changed by this lane; rows 325 to 327 (the cup copies of these three) can reuse this chapter's paintings (RE §10).
5. **`youth` stays a valid door word** (the table of `origin/main` 4310f6b63 still has the plan's 15 rows).
6. **The "Speed Bracer from the Youth League Tournament"** line in the repo's accessory table is the Colosseum Youth League Cup's prize, not this mission's (RE §8).
