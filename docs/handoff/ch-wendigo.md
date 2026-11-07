# Wendigo: the brute and its two Guado Guardians on frozen Lake Macalania (a hidden FFX chapter, number 49, the word `wendigo`): the battle side

**Branch `ch-wendigo`** (from `origin/r76-int` `d6895820c`, through the research note and the paper preflight `9bde6b2e5`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX only** (AGENTS.md rule 14): the fight is the last one before the lake bottom, after the Temple; CTB, aeons, the FFX status set. FFX-2 has no counterpart and nothing here applies to it. The registry rows, the door row and the pinned lists are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status: the battle side is built, hidden, played in a headless browser from the title to the results by real keys on a GPU (section 7), and measured by scripted players over 200 and 1,000 seeds (section 6). The stage is a STAND-IN (Chapter VII's Macalania Temple, painted) with a procedural silhouette for Wendigo; the Meshy 3D stage, the retargeted motions and the epilogue are the next lane's (section 9).** The chapter opens only by a typed word on chapter select and only on a desktop window. Listing it waits for Bailey's word.
Written 2026-11-06 by a Sonnet sub-agent of the release driver (the Meshy tech-demo chapter, battle lane).

Authority: Bailey, relayed by the driver, verbatim: "make 1 brand new chapter using meshy extensively please", "like a tech demo"; "you can spend as much meshy credits as you see fit. use your own judgment."; 2026-10-18 the retail-assets rule was lifted; 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **The driver's pick of the subject (his to overturn): card B, Wendigo on frozen Lake Macalania, FFX only, hidden Chapter 49, word `wendigo`, desktop only, every model by Meshy, the party moved by the real FFX animations retargeted onto the Meshy rigs.** Every other pick below is the paper preflight's recommendation (`docs/plans/ch-wendigo-review.md`) or the bench's, "driver's call, his to overturn"; the alternative is written beside it.

## 0. What changed against the preflight (read first)

1. **The `onDeath` hook for an ordinary monster already existed** (the Penance chapter added `ScriptHooks.onDeath`, run by `hp.ts#koActor` for any script that has one), so no new hook was needed. What was missing is **a command of the dying monster**: the reaction drain dropped any reaction whose owner was not alive. `Reaction` gained the optional `ownerMayBeDead` (opt-in; every other dead-owner reaction is dropped as before) and the Guardians cast Protect or Shell on Wendigo as they fall. CONTRACT-CHANGES has the entry.
2. **The Berserk x3/2 did not apply to a monster with a recorded plain Attack.** Found by running the engine (T0, rule 3): a Berserk Wendigo hit Tidus for 1,736 to 1,960, a third under the note's 2,604 to 2,940. The adapter passed the party's 0x3000 as every user's default attack; `defaultAttackIdOf` now uses the monster's own plain Attack record when it is the monster's forced-action word (Wendigo's 0x4000, Sinspawn Gui's 0x6000). Everything else is unchanged. The note's arithmetic and the engine now agree to the unit (40 seeds).
3. **The first-turn order is answered** (open question 3): at the CTB start Rikku (27 ticks a turn) and Tidus (30) act first, then the two Guardians (30) and Wendigo (33), then Yuna (39). **Nobody acts before the first menu, on every seed of 1 to 100**, so Auron's line at the first menu is the party-first one (`ui/coach/turnOrderLine.ts`).
4. **One Petrify Grenade reaches both Guardians** (the item is a group item; the Guardians' Petrify byte is 25 and the grenade's chance byte 254, which lands on anything below 255): **200 of 200 seeds**. A petrified Guardian is no death: it casts no last shield, drinks no potion, casts no Berserk. It still pays when the fight ends (the engine counts it defeated). This is the sourced answer the guides name ("unless through Petrification", "Petrify Grenades x4 in the bag").
5. **The 1.55 x Tidus is the drawn height** (28.07 against 18.15), not the stored design height E (26.4, 1.45 x): the research note's first draft called 26.4 the 1.55. The note is corrected; the Guardian is 19.58 (1.08 x), E 20.0.
6. **The size estimate fell for the battle side** (the preflight's 11 agent-hours): the Temple Guardians' helpers, the forced Berserk turn, the preset and the formation command disables existed; the new work was the two scripts, the stance, the data, the guide and the bench.

## 1. Play it

1. From the title, reach the chapter-select board **on a desktop window**. Type **`wendigo`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. **On the phone tier the door stays shut** (decision 219q, the fourth hidden 3D chapter: `yrp`, `waker`, `gear`, `wendigo`).
2. Enter starts the chapter: a silent pre scene (a fade in), then the fight, the post scene and the results page. The party is Tidus, Yuna and Rikku in front (the Macalania preset's own; Wakka, Auron, Lulu and Kimahri on the bench, Valefor, Ifrit, Ixion and Shiva in the roster). **Escape and Flee are off for everyone; Switch and Summon are not.** A defeat is the retry card.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

Eighteen thousand HP, STR 40, no Defense and no weakness; a punch of 1,634 to 2,015 against cells of 850 to 1,900 HP, so **a member dies to a blow unless the blow is weakened**. Two Guado Guardians keep it that way.

| Wendigo's turn (every 33 ticks) | What it does (the game's own script, RE 4.2) |
|---|---|
| above half HP | 1 turn in 3 the **Double Punch** (power 24, never misses) on the **lowest-HP** member; else the **Punch** (power 16, accuracy 120) on a random living member |
| below half HP (strictly under 9,000) | a **seven-turn cycle**: **arms up** (the raise turn and the next two: nothing), arms down, then **three attack turns** (1 in 3 the Double Punch, else the plain Attack, accuracy 90) |
| arms up | every **physical** hit on it (the Attack, Dark/Sleep/Silence Attack, the four Breaks, Delay Attack and Buster, Aerospark, Sonic Wings) is answered by the **Counter Punch** (power 20, never misses) on the attacker, **unless an aeon holds the field**; spells, Steal, Threaten, Provoke, Lancet, Jump, Spiral Cut, Cheer, Focus and every Overdrive are not answered |
| Berserk or Provoked | **no script**: the forced plain Attack, at x3/2 under Berserk (2,604 to 2,940 on Tidus); it never raises its arms or throws the Double Punch |

| The Guardians (1,200 HP, AGI 20, MAG 14; two of them; RE 4.4) | |
|---|---|
| Wendigo blind | **Eye Drops** on Wendigo (not once stolen from: GameFAQs; the script has no test, see section 4) |
| Wendigo's arms up | **Berserk on a party member** who is not Berserk yet (the file only: in no guide) |
| Wendigo Berserk | 37.5 percent Thundara, 37.5 Blizzara (240 to 333), 25 percent **Auto-Potion on Wendigo** (+1,000); stolen from: 62.5 Blizzara, 37.5 Thundara |
| otherwise | **Berserk on Wendigo** (it lands: Wendigo's byte is 0) |
| hit | **Auto-Potion on itself** (+1,000) unless stolen from, asleep, Threatened, or the hit was a Berserk cast |
| falls | the first casts **Protect** on Wendigo, the second **Shell**, from the dead; not if Petrified, not if Wendigo is dead |

Rewards: Wendigo 3,000 gil, 2,000 AP (3,000 on an overkill of 1,432), a Power Sphere (two on an overkill), steals Hi-Potion or X-Potion; each Guardian 480 gil, 290 AP (580), an Ability Sphere (two on an overkill). **The design fact:** the fight is about **controlling Wendigo's state while the Guardians keep resetting it** (Berserk on or off, arms up or down, buffs, blind or not, the Guardians alive, robbed, stone or dead); damage is secondary (18 Auron swings, 15 Fira casts, no weakness).

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx-wendigo-lake-macalania.md` (the game's own files: monster files `m212` and `m213`, formation `maca02_01`, the Atel scripts run in the earlier lanes' interpreter; "RE n" in the files), tagged `[bytes]`, `[run]`, `[arith]`. The eight rows are pinned **word for word** to the kernel fixtures `tests/fixtures/parity/ffx/command_records.json` and `command_status.json` (rows 0x407F, 0x4080, 0x4062, 0x403B, 0x4063, 0x400F, 0x4010 and the item row 0x200C) by `tests/unit/chapters/wendigo-data.test.ts`. The plain Attack is the game's row 0x4000 (accuracy 90); the Guardians' Blizzara, Thundara, Protect and Shell are the player's own rows by their ids. **Rule 5:** the Double Punch, the Counter Punch, Berserk, Auto-Potion and Eye Drops have accuracy formula 0 and never roll (`canMiss: false`); the Punch and the plain Attack roll (120 and 90). **The stance** is the engine flag `wendigo.arms` (the game's status property 61 and its script's `v5`), with `wendigo.armTurns` (`v6`) and `wendigo.cycle` (`v7`); the Guardians, the tactic and the stage read it.

**Gaps, named (not invented):**
- **The gear drop** (50 percent: Counterattack and Piercing weapons, SOS Haste and HP +10 percent armour per the guides) is not modelled: the ability codes 0x8003, 0x800B, 0x805B and 0x8073 are not decoded, and the loot records of `m212` and `m213` are not in `loot/records.ts` (their digests are not in the repo); the engine pays the fields above as a record of the same shape.
- **The party** is the Macalania preset (`[estimate]` over a sourced build point, a few chase battles before this fight); the bag, the gauges and the armour abilities at this exact point are not sourced. Nothing was tuned toward a result.
- **A Provoked Guardian** (forced-action word 0x3047, Thundara in the game) throws the engine's one generic Attack (STR 1), as every monster's forced turn does here; the word only decides whether there is one.
- **Which theme the battle plays, the flags word and what a defeat does** (RE 8): not read; the chapter treats a defeat as the normal retry card.

## 4. Engine work and what the T0 checks found

The preflight's rows, as built:

| # | Need | What was done |
|---|---|---|
| 1 | records, rows, loot | `data/ffx/enemies/wendigo.ts`, `wendigo-abilities.ts`; the records word for word; rewards as fields |
| 2 | Wendigo's turn | `battle/ffx/ai/wendigo.ts`, `wendigo-rules.ts` (the three states, the seven-turn cycle, the lowest-HP selector with the group builder's wasted picker draw) |
| 3 | the stance and its counter | the same files: a flag, the damage type read from the command's own record (`damageTypeOf`), the aeon test, Threaten and reaction gates |
| 4 | the Guardians | `battle/ffx/ai/lake-guardian.ts` (a sibling of the Temple's, not a copy) |
| 5 | a death handler | **existing** `onDeath`; **new** `Reaction.ownerMayBeDead` (section 0, item 1) |
| 6 | a Berserk Wendigo runs no script | **existing** `forced-turn.ts` (forced-action word 0x4000 added); **new** the x3/2 fix (section 0, item 2) |
| 7 | a monster using an item (Eye Drops) | an ability row with the item's record (rank 2); after a Steal the Guardian passes its turn (GameFAQs wins what the file does not settle; the engine's own rule is unread) |
| 8 | formation | data: Escape and Flee off for everyone, Normal start, music a stand-in |
| 9 to 11 | party, HUD, plumbing | the Macalania preset unchanged, no new command, the registrations of the CONTRACT-CHANGES entry |

**T0 findings (each pinned by a test):**
1. **A Berserk Wendigo's blows now equal the note's arithmetic** (2,604 to 2,940 on Tidus, 2,638 to 2,979 on Rikku, 2,677 to 3,023 on Yuna): section 0, item 2.
2. **The exact tallies hold on the real script:** 21,846 of 65,536 the Double Punch above half HP and in the attack phase below it (at 18,000 and at exactly 9,000), the seven-turn cycle (turns 1 to 14 as the interpreter's), the half line strict and on the integer half, the Guardians' branches over all 131,072 draw pairs (25 / 37.5 / 37.5 and 62.5 / 37.5 once stolen from), Wendigo dead 32,768 each.
3. **The counter table matches the interpreter's 35 commands** on the real command rows: twelve physical commands answered, eighteen others not, an aeon on the field silences it, Threaten and a reaction in progress stop it.
4. **Open reading, followed as the note has it: Sleep ends the stance.** The Evrae lane read `isCounterattackAllowed()` as false for a sleeper, which would make the note's Sleep branch unreachable; the Wendigo note's run treats it as live. The hook's own gate here lets a sleeper through (every other refusal still refuses), and a **physical** hit wakes a sleeper before the hook runs (`hit-apply.ts`), so the branch is reached by a magic or status hit on a sleeper. **One look at the real game settles it (ask first).**
5. **Open reading: Eye Drops after a Steal.** GameFAQs says a Steal stops them; the file's branch has no steal test (the test is on the Auto-Potion branches). The Guardian passes its turn; pinned, with the other reading one line away (`lake-guardian.ts`).
6. **The stance flag is set when the script chooses Raise Arms**, a few ticks before the game's status write (RE 8: the write was not read). Invisible except to a Sleep in between.
7. **The group builder spends a picker draw nobody uses** when two or more members live (`findMatchingChr` twice for the lowest-HP pick): reproduced (`script-random.ts#drawPicker`), pinned (`wendigo-ai.test.ts` "draws the way the script does").
8. **A petrified Guardian pays.** The win paid 3,960 gil and 2,580 AP with both Guardians stone (3,000 + 2 x 480; 2,000 + 2 x 290): the engine counts a petrified monster defeated.

## 5. The picks (the driver's, his to overturn; each with its alternative)

| # | Question | Pick (built) | Alternative |
|---|---|---|---|
| CW1 | number and word | **49, `wendigo`**, not listed, desktop only (the door test pins 24 words; `wendigo` overlaps none, in any position) | any word that passes the door test |
| CW2 | scope | **the Wendigo fight (`maca02_01`) with its two Guardians** | add the Crawler and Negator fight (`maca02_00`) as a second act |
| CW3 | front line | **Tidus, Yuna, Rikku** (the preset's), bench Auron, Wakka, Lulu, Kimahri: the bench says both lines win 100 percent (section 6) | Tidus, Auron, Rikku (one line in `builds/wendigo.ts`) |
| CW4 | build | the Macalania preset with Shiva and four aeons, unchanged | none |
| CW5, CW6 | Wendigo's look and size | the next lane's; the stand-in is a procedural silhouette at **1.55 x Tidus** (drawn height, corrected) | the card's giant |
| CW8 | the ice | **the sourced epilogue only** (after the win; the next lane's); no mid-fight crack | the card's mid-fight crack (an addition: needs a yes) |
| CW15 | story and results | **no line of its own**: the pre and post scenes are silent (`story/scripts/wendigo.ts`) | a one-line caption (his words) |
| CW16 | music | scene bed `scene-macalania-temple`, battle cue `boss-challenge`, victory `victory-ffx`: **flagged stand-ins** (the game's battle theme is not read; rule 13: Bailey's ear) | `boss-seymour-macalania`, or a new take under the delegation (a spend note, rule 11) |
| CW17 | the tutorial | **none** (the game has none; the guide teaches the Guardians and the stance) | a banner in our own words (a gameplay addition: needs a yes) |
| new | the advisor's line | Petrify Grenade first, then Power Break and Dark Attack by Switch, Protect, no swing while the arms are up (section 6) | the Steal-and-kill line (wins 200 of 200 too, in 1,291 ticks against 786) |

## 6. Difficulty: measured, not tuned (rule 15)

`tests/unit/chapters/wendigo-bench.test.ts` (11 tests, 100 seeds a cell for the lines that carry the claim, 60 for the ablations), the harness `tests/unit/helpers/wendigoBot.ts` and the tool `node --experimental-transform-types tools/wendigo-bench.mjs --seeds 200 --tactic`. **No boss number was touched**; the levers (in the preflight's order: the Phoenix Down and Hi-Potion stock, Yuna's Protect and Shell, the front line, the Petrify Grenades) were not needed. A *line* is a scripted player that reads only what a player reads: **careless** (everyone Attacks Wendigo), **plain** (care and Attack), **advisor** (the sourced line), and the advisor with one piece removed.

**The table of record, 200 seeds a cell (seeds 1 to 200), no god mode, Tidus, Yuna, Rikku in front:**

| Line | Wins | Defeats | Wendigo HP at the end (median) | Ticks (median) | Wendigo turns a fight | KOs a fight (median) |
|---|---:|---:|---:|---:|---:|---:|
| careless | **0 / 200** | 200 | 17,674 | 106 | 3.9 | 3 |
| plain | **0 / 200** | 200 | 17,541 | 964 | 30.1 | 21 |
| **advisor** | **200 / 200** | 0 | 0 | 786 | 25.9 | 2 |
| the shipped line (the registered tactic through the generic ladder) | **200 / 200** | 0 | 0 | 786 | 25.9 | 2 |
| no Petrify Grenade (Steal and kill instead) | 200 / 200 | 0 | 0 | 1,291 | 39.2 | 3 |
| neither Grenade nor Steal | 60 / 200 (30 percent) | 140 | 14,935 | 1,824 | 56.5 | 20 |
| **no Power Break** | **10 / 200 (5 percent)** | 190 | 4,790 | 1,525 | 45.0 | 20 |
| the front line only (no Switch: no Power Break, no Dark Attack) | 0 / 200 | 200 | 8,765 | 1,064 | 33.0 | 20 |
| no Dark Attack | 200 / 200 | 0 | 0 | 1,054 | 33.6 | 5 |
| no Protect | 200 / 200 | 0 | 0 | 948 | 29.6 | 10 |
| no wait while the arms are up | 200 / 200 | 0 | 0 | 634 | 24.4 | 2 |
| an aeon while the arms are up | 200 / 200 | 0 | 0 | 687 | 17.1 | 3 |

The advisor over **1,000 seeds: 1,000 of 1,000**. On Tidus, Auron, Rikku in front (the preflight's alternative): advisor 200 of 200, **no Power Break 181 of 200 (90.5 percent)** (Auron's 1,900 HP survives a blow), careless and plain 0 of 200. **The preflight's target is met** (the sourced line 90 percent or more, an unmanaged line losing almost always: 0 of 200).

**What that says, plainly.** (a) **The preflight's predictions held:** an unmanaged front line is dead in a round (the careless line: 106 ticks, three KOs, Wendigo untouched); the one-shot damage is the whole problem. (b) **Power Break is the mover** (halving everything: with Protect a punch is 408 to 503 and the Double Punch 612 to 755, so a member lives through one); without it the same line wins 5 percent. **The Switch is the second:** the preset's three alone cannot do it (0 of 200); Auron and Wakka are one Switch away and a switched-in member acts at once. (c) The Petrify Grenade makes the fight faster and safer, not winnable by itself. (d) Protect, Darkness and the wait while the arms are up are comforts: each removed, the line still wins every seed (the arms' counter is survivable under Power Break and Protect). (e) **The fight is easier than the preflight feared for a player who knows it**, and exactly as lethal as the note says for one who does not. **Not tried (named):** Threaten, Provoke, Sleep Attack, Kimahri's Stone Breath, Lulu's Fira, Ixion's Aerospark, the Overdrives, the Steal's X-Potion, a Wendigo that is left Berserk with the Guardians stone.

## 7. The browser job (written before the run; what the run said)

Headless Chromium from node, `PYREFLY_BROWSER=gpu`, a dev server on port 5441 started and stopped by PID, the machine-wide browser lock taken by the tool, `node tools/fx-assets.mjs ensure` first; `node tools/wendigo-smoke.mjs --base http://127.0.0.1:5441/ --tag desk`. The party's HP is kept up by a state edit through the debug API (said so), the enemies' HP set to 1 for the last blows; **every command is a real key press**. **Predictions:** every check passes; the first screenshot shows Wendigo's procedural silhouette between the Temple's Guardians at 1.55 x Tidus; the first menu's NEXT BEST MOVE card names the Petrify Grenade; no console error; no 4xx other than the missing Wendigo painting.

**The run (2026-11-06, 1600 x 900, GPU): OK on every check.** The board has no card; the word `wendigo` opens party prep; Tidus, Yuna and Rikku open on Wendigo 18,000 and two Guardians at 1,200; the Guardians' first spell is Berserk on Wendigo and Wendigo's first action is the plain Attack; **the first Guardian to fall cast Protect on Wendigo from the dead** (the shield icon appears beside the Berserk icon); Wendigo falls; the results page reads Victory, AP 2,580, gil 3,960, Ability Sphere x2, Power Sphere; **no console error and no 4xx or 5xx at all** (the presenter draws the missing Wendigo painting's silhouette without a request). Screenshots: `docs/screenshots/ch-wendigo/desk-*.jpg` (the board, party prep, the first menu with the Petrify Grenade card, the opening, the shield, the results).

## 8. Stand-ins and what is a draft (listed)

| What | State |
|---|---|
| **Wendigo's painting and model** | none: the presenter draws its procedural silhouette (a dark horned cone) at 1.55 x Tidus; the Meshy figure is the next lane's |
| The Guardians | the Temple's painting (`characters/guado-guardian/`), twice, at 1.08 x Tidus |
| The stage | Chapter VII's Macalania Temple plate and scene (`scenes/wendigo-lake.ts`, a thin derivation: layout B for the party, Guardian A, Wendigo on Seymour's focal point, Guardian B); no plate exists for the lake |
| The story | silent (CW15) |
| The music | existing cues by reference (CW16); Bailey's ears decide; **no audition-page entry was added** (owed) |
| The chapter card, thumbnail and pause plate | Chapter VII's (`chapter-seymour-anima-macalania`, `pause/macalania`); the chapter's own are owed and unused until the board lists the chapter |
| The painted effects (the Counter Punch, the stance) | none; the stand-in plays the shared hit effects |
| The loot records and the gear drop | not modelled (section 3) |

## 9. What the presentation lane needs from this branch

**The seam.** `src/scenes/wendigo-lake.ts` exports `WENDIGO_SCENE_ENTRY` (the table row, in `scenes/experiment-scenes.ts` beside the anime chapter's `EXP_ANIME_SCENE_ENTRY`), `buildWendigoLakeScene` (the factory in `EXPERIMENT_SCENE_FACTORIES`) and `WENDIGO_LAKE_SLOTS`. The 3D stage replaces the factory and **keeps the key `wendigo-lake` and the slots** (party slots 0 to 2 Tidus, Yuna, Rikku and four bench spots off frame-left; enemy slots 0 to 2 Guardian A, Wendigo, Guardian B; `holdParty`, `enemySpots`, `figureHeights` in `WENDIGO_LAKE_STAGING`). The chapter opts out of the painted stage's framing the way the anime chapter does (`noRigs`, `ownImpacts` in `SceneStaging`). `data/art/artNamespace.ts` maps the scene key to the plate the board and the prep wash show (`macalania-temple`); change it with the stage.

**Combatant ids the stage must draw:** party `tidus yuna rikku wakka auron lulu kimahri` and the aeons `valefor ifrit ixion shiva`; enemies `wendigo`, `lake-guardian-a`, `lake-guardian-b` (`data/ffx/wendigo-ids.ts`).

**Events to animate** (from `BattleState.log`, all real in the smoke): Wendigo's `action-start` rows `attack` (the plain punch), `wendigo-punch`, `wendigo-haymaker` (the Double Punch), `wendigo-raise-arms`, `wendigo-lower-arms`; the `counter` event (actor Wendigo, `cause: 'script'`, target the attacker) followed by the `wendigo-counter-punch` action; the Guardians' `lake-berserk` (on Wendigo or on a party member), `lake-eye-drops`, `lake-auto-potion` (on itself, a reply after a hit, or on Wendigo), `blizzara`, `thundara`; **`protect` / `shell` as an `action-start` whose actor is a Guardian whose `ko` event has already fired** (the death handler's command: the stage must still play the cast from the fallen figure or its last pose; the painted stand-in draws it without error); a Guardian **petrified** (status `petrify`, hp 0, no `ko`: draw stone, not a fade); Wendigo's death animation is "Boss" (the body stays, untargetable), the Guardians' "Humanoid" (the body fades).

**State the stage reads:** `state.flags['wendigo.arms']` is true from the raise to the lower; **Sleep ends the stance with no action event** (the flag turns false and `wendigo.armTurns` is 3), so the stage must read the flag after every event, not only on the two arm rows. Statuses on Wendigo (`berserk`, `darkness`, `power-break`, `protect`, `shell`) have icons already (the smoke screenshot).

**Motion.** Wendigo's own bank `chr/mon/m212/mot/resident1.mgrp` has 26 clips and no clip map yet (the script starts motions 2 to 5 for the attacks, 184, 185, 186 for the stance, 160 to 162 for Sleep; RE 8 and the preflight's P3); the Guardian's bank `m213` was not read. The rows map: Punch, Double Punch, plain Attack and Counter Punch to the attack clips; Raise Arms to 184 (hold 185, lower 186); a hit to the hurt clip; KO to the death. The party clips are the converted Tidus, Wakka and Rikku banks and the retarget tool of the assets lane.

**The epilogue** (sourced, RE 2): after the win the field event plays a magic effect, hides the twelve ice layers, shakes the camera twice, fades to white and warps to the lake bottom. It belongs between the post scene's `camera('victory')` and `results()` in `story/scripts/wendigo.ts` (the DSL has `fx`, `shake`, `flash` and `fade`); no text (CW15).

**Shipping.** Models under `public/models-exp/lake/` (each file under the host's 25 MiB), a verifier and the dist filter, as the yrp chapter's: not started here. The door already carries the `desktopOnly` gate. The smoke tool (`tools/wendigo-smoke.mjs`) is the job to run again on the 3D stage; its checks are about the engine's state and keys, not the picture.

## 10. Tests and verification

New: `chapters/wendigo-data` (22 tests), `-ai` (40), `-engine` (9), `-bench` (11), `-tactic` (12), `-guide` (7), `-door` (7), `-scene` (7), `-story` (5), `-absence` (7), 127 in all; helpers `wendigoDrive.ts` and `wendigoBot.ts`; tools `wendigo-bench.mjs` and `wendigo-smoke.mjs`. Changed (list pins now carrying the chapter, nothing loosened): `chapter-doors`, `r74-hidden-3d-phone-doors`, `wraith-door`, `scene-backdrop-file`, `engine/party-stature-chapters`, `data-ffx-command-records`, `r62-auron-turn-order-tip`, `helpers/doorWords`.

**The full suite** (one run, `npx vitest run --maxWorkers=3`, 2,063 files, 2,770 s): **9 files failed with 12 tests, 32,148 passed, 582 skipped, 1 todo.** Every failure is explained:
- **Eight were list pins that did not yet carry the chapter** (each fixed by adding the chapter, nothing loosened; the Sanctuary Keeper's lane edited the same ones): `audio-music-batch2-2026-10-12` (two tests: the routing table and the owners of `boss-challenge`), `chapters/exp-fayth` (the side table of hidden scenes), `chapters/natus-provoke` (Wendigo's two arm rows are self rows on a Provokable enemy; a Provoked Wendigo's script does not run, so nothing is redirected), `chapters/yunas-ballad-data` (its door is no longer the last row), `parity-ffx-engine-loot-battles` (the three bodies have no loot record in the table, as the Sanctuary Keeper's), `parity-ffx-isaaru-commands` (the formations that carry `commandDisables`), `re-parity-ai-evrae` (the formula-class fixture `evrae-gaze-classes.json` gains the three records the chapter adds: 0x403B and 0x4063 class 0, 0x4080 class 2; its other five records were already there under Grothia's rows). `parity-ffx-loot-data` took the same loot-record edit.
- **Four are not this branch's:** `ww-models-tool` (1) and `ww3d/anime-files` (3) read the anime chapter's Meshy files on this disk (`anime/paine.glb`, `anime/rikku.glb`) and find them different from the recorded hashes and proportions (`tools/ww/ww-models.json` was last changed by 9a4f6c55c on `r76-int`); no file of this branch's diff is theirs.
After the fixes the 14 touched files re-ran green (201 tests) and the 56 files of the new and list-pin suites together (895 tests); `npx tsc --noEmit` is clean; `node tools/orphans.mjs`: 24 orphans, none new (all the modules of this chapter are reachable).

## 11. Open items (named, not hidden)

- **Two readings to settle on the real game** (ask first): Sleep ending the stance (section 4, item 4) and Eye Drops after a Steal (item 5).
- **The Berserk fix touches a shared adapter**: any future Berserk monster with a recorded plain Attack equal to its forced-action word is now boosted. The full suite is the proof that no listed chapter changed.
- **The loot records, the gear drop, the battle theme, the flags word and the defeat behaviour** are unread (section 3).
- **A deep review is owed** by the preflight's reading of the review class (combat core and the registry: DEEP, focused before deploy, deep after); the shared changes are small and additive. Ship it in the release that carries the other hidden chapters.
- **The audition-page entry for the stand-in cues** is owed.
- **NOW.md** is the integrator's: this lane did not edit it.
