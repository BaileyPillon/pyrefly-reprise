# The Omega Ruins: Ultima Weapon, Omega Weapon and Nemesis (a hidden FFX chapter, number 43, the word `weapon`)

**Branch `ch-omega-ruins`** (from `origin/r75-release` `4310f6b63`, through the research note and the paper preflight `8a4a20df5`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX only** (AGENTS.md rule 14): the Omega Ruins (after the airship) and the Monster Arena's last creation; CTB, aeons, the FFX status set. FFX-2 has none of these monsters and nothing here applies to it. The registry rows, the door row and the pinned lists are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status: built, hidden, played in a headless browser from the title to the results by real keys (section 8), measured by scripted players over 400 seeds a cell (section 6), no painting.** The chapter opens only by a typed word on chapter select. Listing it waits for Bailey's word. **None of the three bodies has a painting yet (section 7): the presenter draws its procedural silhouette; the stage is the Cavern of the Stolen Fayth's plate standing in for the Ruins.**
Written 2026-11-06 by a Sonnet sub-agent of the release driver (wave 3, FFX lane, program row 43).

Authority: Bailey, relayed by the driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (about 00:55 EST), and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 5 is the paper preflight's own recommendation or the bench's, "driver's call, his to overturn"; the alternative is written beside it.**

**UPDATE 2026-11-07 (r77 art install): the paintings of the art list are made, registered and wired** (Ultima Weapon, Omega Weapon and Nemesis as `characters/ultima-weapon/`, `omega-weapon/` and `nemesis/`, each with its spread-wing special, their faces and the pause plate `pause/ch43-omega-ruins`; Nemesis is a colour map of the Ultima Weapon paintings with the same alpha; the driver's picks under Bailey's delegation, his to overturn, FFX only): `docs/handoff/r77-art-install.md`. The stage keeps the Cavern's plate.

## 0. What changed against the preflight (read first)

1. **Only the third act is a fight, as predicted, and the shared preset cannot win it.** Against the Mirror Aeons party itself (17 Phoenix Downs, 2 Turbo Ethers, weapons with no Piercing) the advisor's line wins Nemesis **1 time in 200**. Three preset levers bring it to **68.5 percent over 400 seeds** (section 6): Piercing on every weapon, 26 Phoenix Downs, 6 Turbo Ethers. Nothing of the bosses' was touched.
2. **The preflight's prediction (3), that Nemesis's Attack "kills a 9,999-HP member", did not hold for the party's real armour.** The Attack is 13,975 to 15,780 before Protect, and the party's Auto-Protect halves a physical blow, so it is 6,987 to 7,890 and a member at full health lives through it (pinned in `omega-ruins-engine.test.ts`). The **Ethereal Cannon (19,069 to 21,532), the Ultra Spark (27,950 to 31,560 each) and the Armageddon (99,999 each) do kill**, and a second blow kills a member the Attack left at 2,000.
3. **Ribbon blocks Break and Poison but not Power Break or Curse; Slow does not stand on an Auto-Haste wearer.** So the Ultra Spark's four statuses matter little: a survivor (there are none without a second life) keeps Power Break and Curse, and a KO takes every status off.
4. **A Phoenix Down cannot stand a party that is all down at once** (the engine's Auto-Phoenix needs a living reactor: `engine-end.ts`, the game's own rule). The careless line is dead at the first Ultra Spark; **Auto-Life on at least one member is the whole difference between a fight and a defeat** (the note's design fact, now measured).
5. **The Zanmato lottery (WP9) is real and reported, not tuned**: with Yojimbo opening, even a careless line wins Nemesis 36 percent of the time (71 of 200). Section 6 has the table and the alternative.
6. **No engine rule changed** (one table line in `ai/command-formula.ts`, section 9). Every seam the preflight asked about already existed (`command-class.ts#commandDamageType`, `state.ts#aeonsOut`, `hit-gates.ts#react`, `hooks.ts` `onHit`); the T0 checks (section 4) are pinned in tests.

## 1. Play it

1. From the title, reach the chapter-select board. Type **`weapon`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. The first letter W is an `up` press and moves the board's cursor one step (as the first letters of `daigoro` and `fayth` do); E is `start` and A is `left`, both claimed by the word once it has begun. On a phone the long-press field on the "Chapter select" label takes the same word (the door is not desktop-only: the stage is painted 2D).
2. Enter starts the chapter: a pre scene (our draft, section 7), then Ultima Weapon, a seam, Omega Weapon, a seam, Nemesis, the post scene and one results page that pools the three fights' spoils. The party is **Tidus, Yuna and Lulu** in front (Auron, Wakka, Kimahri and Rikku on the bench: Switch is legal), the Mirror Aeons preset with three levers. **Escape and Flee are off for everyone in all three acts; Switch and Summon are not.** Acts II and III open on a whole party and whole aeons (the heal between the acts) and are retry checkpoints: a defeat in Nemesis's fight retries Nemesis, not the Ruins.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

| Act | Body | HP | The round (the game's own script, RE 4) |
|---|---|---:|---|
| I | **Ultima Weapon** (`m99`) | 99,999 | six turns: Attack, **Break, Silence or Confuse**, Core Energy, **Holy, Sleep or Confuse**, Attack, Shimmering Rain on all. **With an aeon on the field** the curses become Core Energy and rain: Attack, Core Energy, Rain, Core Energy, Attack, Rain. Nothing reacts to your hits. Its Attack never lands on a party with Evasion 255 |
| II | **Omega Weapon** (`m100`) | 999,999 | absorbs all five elements, takes no ailment. A third of its turns an Attack (always hits); otherwise a four-step round: Core Energy, **Break or Confuse**, Rain, **Ultima or Demi**; with an aeon out Core Energy, Rain, Core Energy, Rain. **A hidden count (+5 for an Attack, +2 for a special) sends Nova on all three at 30**: on average every 11.44 turns, never fewer than 7 nor more than 16 |
| III | **Nemesis** (`m276`) | 10,000,000 | Armored (a plain blow is divided by three unless the weapon pierces), absorbs all five. Acts about every 9 CTB. Attack, **Ethereal Cannon** (one target, 19,069 to 21,532), **Ultra Spark** (all, 27,950 to 31,560 each, with Poison, Power Break, Slow and Curse), in a round; **a hidden count (+3 for an Attack, +2 for anything else) sends Armageddon on all three at 20: 99,999 each, on average every 9.88 turns, never fewer than 8 nor more than 11.** **Every special-class command that reaches it is answered by an Ultima on the whole line** (5,100 to 5,800 each): all Overdrives, Mixes, Steal, Lancet, Jinx and the item command; not a plain Attack, Quick Hit or any spell |

Rewards (the engine pays them; the results page pools the three): Ultima Weapon 20,000 gil, 40,000 AP (50,000 on an overkill) and three Lv. 3 Key Spheres (six on an overkill), a steal of Door to Tomorrow; Omega Weapon 30,000 gil, 50,000 AP (60,000), three Lv. 4 Key Spheres, a steal of Gambler's Spirit; Nemesis no gil, 55,000 AP, a Warp Sphere (or a Dark Matter one time in eight), a steal of a Lv. 4 Key Sphere or a Warp Sphere.

**The design fact (measured):** Ultima Weapon and Omega Weapon are **checks of preparation** (the party kills the first in one blow and the second in eleven, and the biggest hit is about 330); **Nemesis kills with its Cannon, its Spark and its Armageddon (its Attack leaves a Protected member at a few thousand, and the next blow finishes him), and the only way to win is to be able to stand twice**: Auto-Life on all three, a Piercing weapon, the MP to keep casting it, and no Overdrive.

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx-omega-ultima-nemesis.md` (the game's own files: monster files `m99`, `m100`, `m276`, formations `omeg00_10`, `omeg01_10`, `zzzz02_76`; the Atel scripts run in the earlier lanes' interpreter; "RE n" in the files), tagged `[bytes]`, `[run]`, `[arith]`. The fourteen move rows are pinned **word for word** to the kernel fixtures `tests/fixtures/parity/ffx/command_records.json` and `command_status.json` by `tests/unit/chapters/omega-ruins-data.test.ts` (type, both flag words, damage class, rank, shatter, every status chance and duration byte, the extra word) and each row's formula, power, hits, accuracy, crit bonus and cap bit to the note's section 5. **Rule 5:** every row whose accuracy formula is 0 has `canMiss: false`; Ultima Weapon's Attack (accuracy 120) is the one that rolls. Holy, Ultima and Demi are the player's own rows, used by their ids.

**Gaps, named (not invented):**
- **The gear drops** (Double and Triple Overdrive, Break MP Limit, Break HP Limit, Break Damage Limit) and **Lancet teaching Kimahri Nova** are not modelled; the loot records of `m99`, `m100` and `m276` are not in `loot/records.ts` (their digests are not in the repo), so the three bodies pay the sourced fields as a record of the same shape, as the Dark Aeons, the Spectral Keeper and the Sanctuary Keeper do. The Bribe price of Ultima Weapon (about 2.0 to 2.5 million) follows from the engine's own rule, 25 gil an HP, and the party holds 1.5 million.
- **Two reward items are not in the item catalogue** (Door to Tomorrow, Gambler's Spirit): they are the Mix chart's own ids, so a Steal pays them and the message reads "Stole door-to-tomorrow x10!" with the raw id. A catalogue entry is a shared edit left to the driver.
- **The Doom byte** (99, 222, 255) is read as `doomTurns`, the countdown a Doom landed on it runs on: our reading of the byte (`[inferred]`); no fight can land one (no Doom in the party's kit).
- **"On the field"**: the test of both Weapons' cycles (`countChrOverlap(front line, all aeons)`) is `state.ts#aeonsOut`, so **Yuna's Magus Sisters count** as aeons; the note ran one aeon and not the three Sisters (`[inferred]`, pinned in a test as a choice).
- **The party** is the Mirror Aeons preset (an `[estimate]` over a sourced build point) plus three levers (section 6); the gauges and the bag on arrival are not sourced for these fights. Nothing was tuned toward a result beyond the levers.
- **Height and position**: no stature row exists for `m99`, `m100` or `m276`; 3.4, 3.8 and 4.4 are `[estimate]`s on one boss spot at (2.4, 0, -4.4).
- **The launching events' flags** (the defeat rule, whether the Monster Arena allows Escape for Nemesis) were not read; the chapter turns Escape and Flee off in the third act too (WP12).

## 4. Engine work and what the T0 checks found

| # | Need | What was done |
|---|---|---|
| 1 | Records, rows, loot, status bytes, Armored | `data/ffx/enemies/weapons.ts`, `weapons-abilities.ts`, `weapons-groups.ts`; the fourteen rows by id, three bodies, three groups |
| 2 | Ultima Weapon's six-turn cycle with the aeon branch, every turn | `battle/ffx/ai/ultima-weapon.ts` |
| 3 | Omega's two counters, the draw modulo 3 and 2, the two cycle branches | `omega-weapon.ts`; the exact Nova distribution is the test pin |
| 4 | Nemesis's Armageddon counter and three-step cycle | `nemesis.ts` |
| 5 | Nemesis's reply by damage type | `nemesis.ts` `onHit` (existing hook), `commandDamageType` (existing), `hit-gates.ts#react` (existing) |
| 6 | A monster casting player rows (Holy, Ultima, Demi) | existing pattern, by id |
| 7 | The chain, the heal between the acts | existing (`nextGroupId`, `checkpointOnEntry`, `restoresPartyOnEntry`, `restoresAeonsOnEntry`, `poolsChainSpoils`) |
| 8 | Escape and Flee off for characters and aeons | existing (`commandDisables`) |
| 9 | The party | `data/ffx/builds/omega-ruins.ts`: the Mirror Aeons build, Piercing, two bag counts |
| 10 | Zanmato against bytes 3, 3 and 4 | data: `zanmatoLevel` 4, 4 and 5 |
| 11 | HUD | none new |
| 12 | Presentation | a stage on the Cavern's plate; the paintings are owed |
| 13 | Chapter plumbing | `chapter-omega-ruins.ts`, `chapter-meta-omega-ruins.ts`, the door `weaponDoor.ts`, the registrations |

**T0 findings (each pinned by a test):**
1. **The seams already existed**: the damage type of a command (`commandDamageType`), the aeon test, the reaction gate. No engine rule changed (the one table line in `ai/command-formula.ts` aside, section 9).
2. **Nemesis's reply fires for the no-damage special commands**: a real Steal (Rikku in front) is answered by an Ultima on all three; a Scan and a plain Attack are not. A blow that **kills** Nemesis (an Overdrive at 1 HP) is answered by nothing: the dead take no turn (the note's question 1: the order of the death against `onHit` is, in this engine, that the reaction is refused at the queue). The engine gate differs from the game's script in one place: it refuses a reaction raised inside another reaction; no special-class command of the party's is a reaction.
3. **The cycles and counters are the note's, exactly**: Nova's distribution (7: 0.14, 8: 0.55, 9: 8.11, 10: 26.18, 11: 9.10, 12: 32.51, 13: 18.01, 14: 1.54, 15: 3.51, 16: 0.34 percent; mean 11.443) and Armageddon's (8: 0.69, 9: 25.18, 10: 59.83, 11: 14.31; mean 9.878) are rebuilt from the real scripts' own transitions over the 16-bit residues (21,846 / 21,845 / 21,845 of 65,536) and equal the note's tallies; the all-Attack and all-special draws give the Nova on turns 7 and 16 and the Armageddon on turns 8 and 11, in both aeon branches.
4. **Damage on the engine equals the note's arithmetic** (no Defend, the party kept up): Core Energy 112 to 127 and Rain 74 to 83 (Ultima Weapon), 173 to 195 and 115 to 130 (Omega Weapon), Nova 242 to 274, Ultima 287 to 324, Demi 2,499 from 9,999, the Cannon 19,069 to 21,532, the Spark 27,950 to 31,560, the Armageddon 99,999 through Protect, Shell and Shield alike. Ultima Weapon's Attack landed 0 times in more than twelve tries (Evasion 255). The Ultima reply measured 5,339 (the note: 5,146 to 5,811).
5. **The rewards on a one-blow kill are the overkill ones**: 50,000 AP and six Lv. 3 Key Spheres from Ultima Weapon, 60,000 AP and six Lv. 4 from Omega Weapon, 55,000 AP and two Warp Spheres from Nemesis. The sourced field is the plain kill; the engine's overkill rule doubles it.
6. **The heal between the acts**: a party left at 100 HP with a member down enters Act II whole.
7. **Escape and Flee** are in every menu and enabled in none.

## 5. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick (built) | Alternative |
|---|---|---|---|
| WP1 | number and word | **43, `weapon`**, not listed (the door test pins sixteen words; `weapon` overlaps none in any position; `omega` and `ultima` fail the rule, a test pins that) | any word that passes the door test |
| WP2 | shape | **one three-act chain** (Ultima Weapon, Omega Weapon, Nemesis), the party and the aeons restored between the acts, Acts II and III retry checkpoints, one pooled results page | three chapters (adds two numbers and the same arena) |
| WP3 | party | **the Mirror Aeons build, front line Tidus, Yuna, Lulu, with three levers the bench set** (section 6) | a new mid-endgame preset for Acts I and II (about four hours; the card would say so); the shared preset unchanged (Nemesis is then unwinnable: 1 of 200) |
| WP4 | honesty | the guide's page says Acts I and II are checks of preparation and prints the figures | none |
| WP5 | arena | **(a) the Cavern of the Stolen Fayth's plate as is** for all three acts (0 new plates; it is Chapter IX's place and the bosses are drawn large against it) | (b) the plate relit per act (two derived plates; mock beside it first, rule 9), (c) a new plate with its own depth map |
| WP6 | looks | **Ultima Weapon and Omega Weapon new paintings; Nemesis a recolour of Ultima Weapon's** (flagged: a different monster in the game) | Nemesis a new painting (about five more images) |
| WP7 | the hidden counters and the reply | **hidden, as in the game**; the guide and the card's tip teach the Nova threshold, the Armageddon window and that Overdrives are punished | an on-screen tell (not faithful) |
| WP8 | aeons | allowed (Summon is not disabled; an aeon out changes both Weapons' rounds: faithful) | barred (not faithful) |
| WP9 | Yojimbo and Zanmato | on the roster as in the Mirror build; **the bench measures with and without** (section 6): the shipped line does not use him | Yojimbo removed from this chapter's roster (a different party; one line in `builds/omega-ruins.ts`) |
| WP10 | music | the Dome's bed `scene-zanarkand-dome`, `boss-challenge` for the two Weapons, `boss-yu-yevon` for Nemesis, `victory-ffx`: **flagged stand-ins** (the game plays its Boss Theme; Bailey's ear decides, rule 13) | `boss-sin-assault` for Nemesis, or a new take under the delegation (needs a spend note, rule 11) |
| WP11 | start | Normal (the Ruins formations write it; Nemesis's writes none) | none |
| **WP12 (new)** | Escape and Flee in the third act | **off** (the Ruins formations switch them off; Nemesis's formation writes nothing and the launching event was not read) | on: the chapter then ends on a result page that says nothing the retry card does not |
| **WP13 (new)** | the preset's levers | **Piercing on one slot of every weapon (the weakest; First Strike and Break Damage Limit stay), 26 Phoenix Downs, 6 Turbo Ethers**: the values nearest the target of about 70 percent (the Mirror chapter's method) | fewer levers: Piercing alone is 26 percent, 30 Phoenix Downs and 6 Turbo Ethers without Piercing is 46; more: 30 Phoenix Downs is 74.5 percent |
| **WP14 (new)** | the shipped line and Yojimbo | the advisor's line never summons Yojimbo (it is the line that needs skill: Auto-Life) | a line that opens with him (72 percent, and 36 percent for a careless line) |
| **WP15 (new)** | the tip on the card | "Auto-Life on all three, always: Nemesis can wipe you in one turn. Swing and cast; Overdrives are punished." (107 characters; fits the prep card's band, needs no short form) | none |

## 6. Difficulty: measured, not tuned (rule 15)

`tests/unit/chapters/omega-ruins-bench.test.ts` (6 always-on at 100 seeds a cell, 4 behind `OMEGA_RUINS_BENCH=1` at 200), the harness `tests/unit/helpers/omegaRuinsBench.ts` and the tool `node --experimental-transform-types tools/omega-ruins-bench.mjs --seeds 200 --first 1 --acts --chain --levers --ablate --yojimbo`. **No boss number was touched**; the levers are the party preset, the line and the front line. A *line* is a scripted player that reads only what a player reads (the menu's rows, the statuses, the MP gauge): **careless** (everyone Attacks the first foe), **advisor** (`src/engine/tactics/omega-ruins.ts`: Auto-Life on whoever of the line lacks it, Yuna first and drinking a Turbo Ether, an Elixir or an Ether when she cannot pay 97 MP; Tidus Quick Hit while he has the 36 MP; Lulu swings; stand a fallen member up; cure Petrify with a Soft, Confuse and Sleep with Esuna or a Remedy; **never an Overdrive**), and the advisor with one piece removed.

**The table of record, the shipped preset (Piercing, 26 Phoenix Downs, 6 Turbo Ethers), 400 seeds a cell (seeds 1 to 200 and 201 to 400), no god mode:**

| Fight | advisor | careless |
|---|---:|---:|
| Ultima Weapon | 400 of 400, no KO | 400 of 400 |
| Omega Weapon | 400 of 400, no KO | 400 of 400 |
| **Nemesis** | **133 + 141 = 274 of 400 (68.5 percent)**; 66.5 and 70.5 per block of 200 | **0 of 400** |
| the whole chapter (three acts chained) | 132 + 141 = 273 of 400 (68.25 percent), every loss in the third act | 0 of 400 |

Seeds 1 to 100 alone give 62 and 61 (the always-on 100-seed tests are held to a sample band of 55 to 85, since one hundred seeds carry about 5 points of noise; the table's own 60 to 80 band is kept for the 200 and 400 seed cells and pinned in the harness test). A win takes about 31 Nemesis turns, 15 KOs (each covered by an Auto-Life or a Phoenix Down), and the three MP items and the bag's Ethers; a loss is the MP or the Phoenix Downs running out at about 30 turns with 300,000 to 3,000,000 HP left, or an early wipe when an Armageddon and a Spark follow each other before Auto-Life is back (the hidden counters).

**The levers, Act III, the advisor's line, seeds 1 to 200:**

| Preset | wins |
|---|---:|
| the shared preset (no lever): 17 Phoenix Downs, 2 Turbo Ethers, no Piercing | **1 of 200 (0.5 percent)** |
| Piercing alone | 51 (26 percent) |
| Piercing + 30 Phoenix Downs (2 Turbo Ethers) | 95 (48) |
| Piercing + 6 Turbo Ethers (17 Phoenix Downs) | 59 (30) |
| 30 Phoenix Downs + 6 Turbo Ethers, no Piercing | 91 (46) |
| Piercing + 6 Turbo Ethers + **17 / 20 / 22 / 24 Phoenix Downs** | 59 (30) / 88 (44) / 107 (54) / 117 (59) |
| Piercing + 6 Turbo Ethers + **26 (shipped) / 28 / 30 / 33 / 36 Phoenix Downs** | **133 (67)** / 142 (71) / 147 (74) / 155 (78) / 157 (79) |

On seeds 201 to 400 the same cells give 26: 141 (70.5), 28: 149 (74.5), 30: 151 (75.5): **26 is the stock nearest the target of about 70 over 400 seeds** (68.5; 28 gives 72.8, 30 gives 74.5). With 2 Turbo Ethers no Phoenix Down stock gets past 53 percent (MP is then the clock); with 4 or more the Phoenix Downs are.

**The ablations (shipped preset, seeds 1 to 200):** without Auto-Life **0**; without the MP items (Yuna never drinks) **0**; Auto-Life on one member alone **0**; on two members **11 percent** (21 of 200); without Quick Hit **61 percent** (122): Quick Hit is worth about six points.

**The Zanmato lottery (WP9; seeds 1 to 200, shipped preset):**

| Act III | wins |
|---|---:|
| the advisor alone (Yojimbo stays on the list, unused) | 133 of 200 (67 percent) |
| **Yojimbo opens**, paid 100,000 a menu, then the advisor | 144 (72) |
| **Yojimbo opens, then a careless line** | **71 (36)** |

**What that says, plainly.** (a) The preflight's predictions held for the Weapons (they are formalities) and for the hidden counters, and **not** for Nemesis's Attack (Protect halves it: section 0.2). (b) **Auto-Life is the whole fight** (0 without it, 0 with one holder, 11 with two, 67 with three) and **MP and Phoenix Downs are its clock** (the two bag levers); Piercing is the damage (a plain Armored blow does about 54,000, a Piercing one about 99,999). (c) **A landed Zanmato ends the fight under the game's own rules** (RE found no immunity reader; the Pay roll with byte 4 is the only limit): a free 36 percent for a player who does nothing else. The chapter ships it as the game has it, hidden behind the roster, and the alternative (Yojimbo off this chapter's list) is one line. **Not tried (named):** an aeon to take an Armageddon, a Switch to Auron or Rikku mid-fight, the Magus Sisters' Delta Attack as damage (it is a special-class command, so it is answered), Doublecast Ultima from Lulu, Cheer, Shell. They are the line's, not the data's; a thinking player's ceiling is above these numbers.

## 7. Stand-ins and what is a draft (listed)

| What | State |
|---|---|
| **The three paintings** (`characters/ultima-weapon/`, `omega-weapon/`, `nemesis/`) | **none exist**: the presenter reads the art manifest and draws its procedural silhouette silently |
| The stage | the Cavern of the Stolen Fayth's plate and scene (`SCENE_BACKDROP_FILE`), the party on its slots, the boss on one spot at an estimated height; the Ruins have no plate (WP5) |
| The story | a draft for Bailey to read (`story/scripts/omega-ruins.ts`: seven lines before, three in each seam, six after; each seam ends on an 800 ms white flash, kept under the 900 ms that `flash-covers` lists as covers; the bodies speak no word; "THIS IS A DRAFT FOR BAILEY TO READ") |
| The music | existing cues by reference (WP10); Bailey's ears decide |
| The chapter card and thumbnail | `thumbnailKey` is Chapter IX's card (`chapter-yojimbo-cavern`); the chapter's own is owed and unused until the board lists the chapter |
| The pause hero `pause/ch43-omega-ruins` | not made; the pause tab falls back to the Cavern's plate (`heroArtFallback`) |
| The departures | the default (dissolve) for all three. The files give Ultima Weapon and Omega Weapon the death animation "Boss" (the body stays, untargetable: the table's `body` kind) and Nemesis "Fiend" (it dissipates); the `body` kind needs the shared departure and entrance-canon tables (`BattlePresenterDepartures.ts`, `entrance/entranceCanon.ts`), left to the integrator |
| The advisor's tactic line, the guide card and page | **built**: `engine/tactics/omega-ruins.ts` (the card's NEXT BEST MOVE follows it), `data/guides/omega-ruins.ts` and `docs/omega-ruins.ts` (five rules, nine hints, three phase notes, three boss pages: HP, the strategy, Steal, Drops). Our own words over the game's files |
| The painted effects (Nova, Ultima, Armageddon, the rain, the cannon) | may be drawn in code; none exist |

### ART NEEDS (nothing below exists on disk; no ComfyUI was run, nobody generated art: rule 12, and only Bailey approves a painting)

Style reference: the approved boss sets in `public/art/characters` (`yunalesca-1`, `spectral-keeper`, `evrae`: idle with `baselineY`, attack, cast, hurt, ko, `idle@2x`), the painted 2.5D look, facing left toward the party, a sidecar JSON each (`width`, `height`, `baselineY`, `pose`, `facing`, `nonBiped`). Retail references are allowed (hard rule 8 lifted 2026-10-18); the painting that ships must match the approved painted look.

| Subject (art key) | Poses | Notes |
|---|---|---|
| **Ultima Weapon** `ultima-weapon` | idle, attack, cast (Core Energy, Holy), rain, hurt, ko (the body stays), idle@2x | a large armoured flying machine |
| **Omega Weapon** `omega-weapon` | idle, attack, cast, Nova charge, hurt, ko (the body stays), idle@2x | a large mechanical dragon-like machine; the Nova pose carries the hidden count's tell if Bailey wants one (WP7 alternative) |
| **Nemesis** `nemesis` | idle, attack, cast (Ethereal Cannon, Ultra Spark), Armageddon, hurt, ko (it dissipates), idle@2x | a colossal dark fiend; **a dark recolour of Ultima Weapon's painting is the flagged stand-in** (WP6), the Dark Yojimbo and Sisters recipe (prompts and seeds in the mirror) |
| the three portraits | one each, cut from the idles | the CTB tiles |
| the pause hero `pause/ch43-omega-ruins` | one | the three guardians' silhouettes over the ring |
| the card `chapter-omega-ruins` and its thumbnail | two | unused until listed |
| plates (WP5 (b), optional) | two derived variants | the Cavern's plate relit: Ultima Weapon a pale ring, Omega Weapon a brighter ring and a mirrored camera, Nemesis a dim red cast; derived from the approved plate, which stays untouched |

**Count: 3 x (6 poses + @2x) + 3 portraits + pause hero + card + thumbnail = 26 required images** (+2 optional plates), each with a sidecar, a row in `tools/posescale/subjects.json`, the mirror's `manifest.json` rebuilt and `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table` (generated, never edited). Art route is the driver's (the Art Room).

## 8. Browser job specs, with predictions (written first; what the run said beside each)

Headless Chromium from node, `PYREFLY_BROWSER=gpu`, a dev server on a port of its own (5443), the review-browser lock, `node tools/fx-assets.mjs ensure` first; `node tools/omega-ruins-smoke.mjs` (the tool plays them all). The party's HP is kept up in Act III by a state edit through the debug API (said so), Nemesis's HP is set to 1 for the last blow; **every command is a real key press**.

| Job | Prediction | The run |
|---|---|---|
| **J1 the board and the word (1600x900)** | the board draws its listed cards and none for the chapter; typing `weapon` opens party prep (numeral EXP), Tidus, Yuna and Lulu in front, four on the bench; the tip box fits | **Held.** The board drew its 19 cards and none for the chapter; the word `weapon` opened party prep on the chapter (header "EXP · THE OMEGA RUINS"), Tidus, Yuna and Lulu in front, four on the bench, the tip inside its box (`docs/screenshots/ch-omega-ruins/desk-0-board.jpg`, `desk-1-party-prep.jpg`). One cosmetic note: the header repeats the name ("THE OMEGA RUINS — THE OMEGA RUINS") because the chapter's title and location are the same words; a different location string is an open pick (section 11) |
| **J2 the pre scene and the first menu** | seven lines play over the Cavern's plate; the first menu opens with Ultima Weapon alone at 99,999, the procedural silhouette inside the rail; the coach's first card appears | **Held.** Enter on prep played the seven lines over the Cavern's plate; the first menu opened with Ultima Weapon alone at 99,999 (the procedural silhouette stands inside the rail and clear of the menus), Tidus, Yuna and Lulu whole with Protect and Haste, 9,999 HP and 999 MP; the coach's card, the "BOSS BATTLE" guide and the move advisor ("Attack, kills, 99,999") drew; the pause screen opened (`desk-2-pre-scene.jpg`, `desk-3-first-menu.jpg`, `desk-3a-first-menu-clear.jpg`, `desk-3c-pause.jpg`) |
| **J3 Act I by one real Attack** | one Attack fells Ultima Weapon (99,999 HP against a Break Damage Limit blow); the seam plays; the chain loads Omega Weapon on a whole party | **Held.** One real Attack (Enter, Enter) felled Ultima Weapon; the chain loaded Omega Weapon at 999,999 on a whole party (`desk-4-act-one-blow.jpg`, `desk-5-act-two-first-menu.jpg`) |
| **J4 Act II by real Attacks** | about eleven Attacks fell Omega Weapon; its moves are its own list only; the chain loads Nemesis on a whole party | **Held on the clean run.** Eleven real Attacks felled Omega Weapon, as the bench said; the chain loaded Nemesis at 10,000,000 on a whole party. Omega Weapon never got a turn in those eleven blows (the party is hasted, a member acting every four ticks, and Omega acts about every 21), so its own move list was **not** exercised on the GPU run; the engine tests carry it (section 10) |
| **J5 Act III** | Nemesis stands at 10,000,000; a real Attack takes 40,000 to 99,999 off; it acts from its own five moves only; with its HP at 1 the last real Attack ends the chain, the post scene plays and the results page pools the spoils | **Held.** Nemesis stood at 10,000,000; one real Attack took 99,999 off (10,000,000 to 9,900,001: the Piercing weapon, so the armour did not divide it); it acted twice from its own list (both Attack, so the Cannon, Spark and Armageddon were **not** seen on the GPU run; the engine tests carry them); with its HP set to 1 through the debug API the last real Attack ended the chain and the results page drew "THE OMEGA RUINS · CLEARED", Victory, Overkill ×1, 165,000 AP ×3, 50,000 gil, and the pooled items (`desk-6-act-three-first-menu.jpg`, `desk-7-nemesis-after-a-blow.jpg`, `desk-8-nemesis-moves.jpg`, `desk-10-results.jpg`) |

**The run:** desktop 1600x900, headless Chromium on the GPU, real keys only for the board, the word, party prep, the cutscene and every command; **no console error and no 4xx or 5xx response**, and no request for a missing painting (the three bosses draw as procedural silhouettes, section 5). The one thing the run edits through the debug API is the party's HP (kept whole in Act III so the run reaches the end) and Nemesis's HP (set to 1 for the last blow); the screenshots of Act III therefore show six-digit party HP. **A first run of the same script failed one check** ("Nemesis stands at 10,000,000 and the party is whole": Nemesis read 9,900,001): the script's Act II loop sent a twelfth Attack while the chain was still loading Nemesis, so one real blow landed on Nemesis. That was the script's race, not the game's (Omega fell to the eleventh blow, as the bench says, and Nemesis arrived at 10,000,000 on the clean run); the loop now waits for each blow to land and stops when the foe has fallen (`tools/omega-ruins-smoke.mjs`), and the second run passed all 15 checks. **A phone-width pass** (390x844, touch emulation, the same keyboard script: the layout and the chain, not real finger input) passed the same 15 checks with no console error and no failed request; the frames are `docs/screenshots/ch-omega-ruins/phone-*.jpg` (party prep, the first menu with the boss clear of the command tiles, the results). **Not run:** real finger input on a phone, and Act III beyond a few turns by real keys (the bench carries the fight's difficulty; the GPU run carries the plumbing).

## 9. Files and merge hot spots

New: `src/data/ffx/omega-ruins-ids.ts`, `src/data/chapter-omega-ruins.ts`, `src/data/chapter-meta-omega-ruins.ts`; `src/data/ffx/enemies/weapons.ts`, `weapons-abilities.ts`, `weapons-groups.ts`; `src/data/ffx/builds/omega-ruins.ts`; `src/battle/ffx/ai/ultima-weapon.ts`, `omega-weapon.ts`, `nemesis.ts`, `weapons-rules.ts`; `src/engine/tactics/omega-ruins.ts`; `src/data/guides/omega-ruins.ts` and `docs/omega-ruins.ts`; `src/scenes/omega-ruins.ts`; `src/story/scripts/omega-ruins.ts`; `src/app/screens/frontend/weaponDoor.ts`; `research/re-ffx-omega-ultima-nemesis.md`; `docs/plans/ch-weapon-review.md`; the tools `tools/omega-ruins-bench.mjs` and `tools/omega-ruins-smoke.mjs`; the helpers `tests/unit/helpers/omegaRuinsDrive.ts`, `omegaRuinsBench.ts` and `omegaRuinsScript.ts`; thirteen test files (`chapters/omega-ruins-{data,ai,nemesis,engine,bench,board,door,story,scene,absence,tactic,guide,chapter}.test.ts`).

Shared files touched (all additive and inert elsewhere; **likely conflicts with the other new-chapter lanes, for the integrator, in order**):
1. `src/data/encounters.ts`: `ChapterId`, `ListedChapterId` and `Chapter.number` gain `'omega-ruins'` and `43` (the same three lines every lane edits: take the union; 399 of 400 lines, no line added).
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts` (**399 lines**: two old imports, Evrae's and Yojimbo's, share a line; the Sanctuary Keeper lane did the same: take both), `src/engine/tactics/index.ts` and `lookup.ts`, `src/data/guides/index.ts` and `docs/index.ts`, `src/data/ffx/enemies/hidden-ffx.ts`, `src/data/ffx/command-records/enemies.ts`, `src/battle/ffx/ai/index.ts` (three imports on one line), `src/battle/ffx/kernel/forced-action-table.ts`, `src/app/screens/frontend/chapterDoors.ts` (the word `weapon`), `src/engine/pyreflyCanon.ts`, `src/data/art/artNamespace.ts`, `src/scenes/experiment-scenes.ts`, `src/ui/coach/turnOrderLine.ts`, `critic/runner/lib/route-pure.mjs`: one item each.
3. Pinned lists and fixtures: `chapter-doors`, `critic-route-doors`, the neighbour lists of `gagazet-door`, `yojimbo-door` and `summon-door` (their pair tests' 180 s raised to 240 s), `data-ffx-command-records` (**533 abilities and 530 records**), `parity-ffx-engine-loot-battles` and `parity-ffx-loot-data` (three bodies without a record), `parity-ffx-isaaru-commands` (three more groups that carry `commandDisables`), `prep-tip-band` and `prep-tip-short-forms` (33), `audio-music-batch2`, `r62-auron-turn-order-tip`, `scene-backdrop-file`, `party-stature-chapters`, `exp-fayth`, `exp-windwaker` and `exp-yrp-3d` (the hidden scenes' side table: this chapter's row is appended last; the Wind Waker's row is second-to-last, the 3D Bahamut's third-to-last, 13 rows; each later lane moves them by one), **and `evrae-gaze-classes.json`** (ten rows added, each the class its record's formula byte takes in `command_records.json`; the full suite's `re-parity-ai-evrae` demanded them), with **one line in `ai/command-formula.ts#FORMULA_BYTE_OVERRIDES`** (0x6072, Confuse, byte 3: a status word with no formula of ours, as 0x604f, 0x606e and 0x6071 already are). Both are in the CONTRACT-CHANGES entry; take the union with the other lanes' rows. Also `experiment-flow` (its list of the formations that set `noSaveSphereCard` gains the chain's Acts II and III; the full suite caught it).
4. `docs/CONTRACT-CHANGES.md`: the entry on top. **`CHANGELOG.md`, NOW.md, ACTIONS.md and DECISIONS.md are not edited** (the integrator writes them).

No source file added is over 400 lines (the longest, `weapons-abilities.ts`, is 294).

## 10. Tests and checks

**Run on 2026-11-06 in this tree (branch `ch-omega-ruins`).**

- **`node node_modules/typescript/bin/tsc --noEmit`: clean (exit 0).**
- **`node tools/orphans.mjs`: 2,360 modules, 24 orphaned, none of them this chapter's** (the voice presets, the sprite templates, `BlobShadow`, `SpriteActor`, `MessageBar`, the FFX-2 `PartyPrep`, ...; 24 older modules that nothing imports in this tree). Every new module is reached from `src/main.ts`.
- **The new tests: 13 files, 172 always-on tests, all pass** (`data` 48, `ai` 15, `nemesis` 8, `engine` 20, `bench` 6 with 4 more behind `OMEGA_RUINS_BENCH=1`, `board` 15, `door` 5, `story` 12, `scene` 5, `absence` 5, `tactic` 16, `guide` 9, `chapter` 8).
- **The full suite** (`vitest run --maxWorkers=3`, 1,983 files, 72 minutes with other lanes on the machine): **first run 5 files failed, 6 tests of 30,744; 1,947 files passed, 31 skipped.** Every failure explained:
  - **Three were this chapter's, found by the suite and fixed**: `flash-covers` (the two seam flashes were 900 and 1,000 ms; the test lists every white-out of 900 ms or longer as a cover, so the flashes are now 800 ms, a flash and not a cover), `re-parity-ai-evrae` (the game's gaze-class fixture holds one row per shipped record: ten rows added, and one line in `FORMULA_BYTE_OVERRIDES` for Confuse, 0x6072; both in CONTRACT-CHANGES), `experiment-flow` (its list of the formations that set `noSaveSphereCard` gained the chain's Acts II and III).
  - **Three were 15-second test timeouts under the machine's load and none of them walks this chapter**: `advisor-floor` ("holds across 3. Braska's Final Aeon", took 16.0 s, and "27. Mirror Aeons", 21.3 s) and `tourist-trap-bench` ("prints the table", 17.9 s). Rerun alone with `--testTimeout=120000`: both files pass (32 tests; the Braska case passed even at the default 15 s when run alone, Mirror Aeons took 15.1 s there).
  - **No art-mirror failure this run**: `boss-art-r75.test.ts` passed (122 tests, 77 skipped for art not on this tree).
- **After the fixes**, the delta was rerun: the 13 `omega-ruins` files, `flash-covers`, `re-parity-ai-evrae`, `experiment-flow`, `data-ffx-command-records`, the `prep-tip` files and every `guide*` file: **37 files, 562 tests passed, 4 skipped** (the four bench cells behind the flag). The wording and test-split edits made while the first run was under way (`omega-ruins-ai`, `-nemesis`, `-guide`, `-story`, `-chapter`, `guide-doc*`, `prep-tip-band`) are inside that delta rerun; a later full run was **not** made.
- **After the review and the fix pass (section 12), one clean full run: `vitest run --maxWorkers=3`, 1,984 files, 53 minutes: 1,953 files passed, 31 skipped, 0 failed; 30,495 tests passed, 256 skipped, 1 todo.** The three load timeouts of the first run did not recur, and no art-mirror failure (`boss-art-r75.test.ts` passed). `tsc --noEmit` clean; `node tools/orphans.mjs`: 2,360 modules, 24 orphaned, none new. The 13 chapter test files: 172 passed, 4 skipped (the flag-gated bench cells, which passed 10 of 10 under `OMEGA_RUINS_BENCH=1` in the reviewer's run).
- **The gate files not in the delta and unchanged since the first run**: the door tests (`chapter-doors`, `critic-route-doors`, `gagazet-door`, `yojimbo-door`, `summon-door`) passed in the full run before the final edits and none of the later edits touches them.

## 11. Open issues and what waits for Bailey

1. **The Zanmato lottery** (section 6): a careless line wins Nemesis 36 percent of the time with Yojimbo opening. By the game's own rules as the reverse engineering read them; the chapter ships it. His to overturn: Yojimbo off this chapter's list (one line in `builds/omega-ruins.ts`).
2. **The preset levers are `[estimate]`s that decide the difficulty** (Piercing, 26 Phoenix Downs, 6 Turbo Ethers): the table lists the neighbours so he can pick another.
3. **The three paintings, the plate, the card and the music** (rule 9, rule 13): nothing perceivable was built beyond stand-ins; the end-state options for each are owed before any is painted. The faithful "body stays" departure of the two Weapons waits for the shared tables.
4. **Acts I and II are formalities against this party**; a mid-endgame preset (about four hours) is the lever if he wants them to bite, never the bosses.
5. **Two reward items print their raw ids** (Door to Tomorrow, Gambler's Spirit) until the catalogue has them.
6. **Listing the chapter on the board**: move `OMEGA_RUINS` from `EXPERIMENT_CHAPTERS` into `CHAPTERS` (and its meta from `UNLISTED_CHAPTER_META`), drop `experimental: true`, give it a numeral and a card; the saved record then moves from the experiments' store to the save (a save change: `SaveData.ts` is a deep-review file).
7. **The prep header repeats the name** ("EXP · THE OMEGA RUINS — THE OMEGA RUINS"): the chapter record's title and its location string are the same words. A different location line is a one-word change in `chapter-meta-omega-ruins.ts` once the game's own place name for it is sourced (rule 6; nothing was invented to fill it).
8. **The GPU smoke did not exercise** Omega Weapon's own moves or Nemesis's Cannon, Spark and Armageddon (the hasted party fells Omega before its first turn, and Nemesis used only its Attack in the turns played); the engine tests and the 400-seed bench carry them. Real finger input on a phone was not tried (the phone pass used the keys on a touch-sized viewport).

## 12. The review and the fix pass (2026-11-06, wave 3b)

An independent reviewer read the branch at `5233b09ad` against the game's decoded files and ran the engine: **no CRITICAL and no MAJOR defect.** It re-derived the Nova and Armageddon distributions to the printed digit, found the records, status bytes, loot, flags and all fourteen command rows equal to the dumps and the kernel fixtures, the three scripts equal to the disassembly, Escape and Flee off in the Ruins fights, a 400-seed bench identical to section 6, and 0 violations in a 4,200 + 5,093 + 2,942 turn cycle reconstruction and a random-command fuzz. It disclosed nothing new. Seven MINORs, all fixed in the fix pass (no data, rule or boss number changed):

| # | Finding | Fix |
|---|---|---|
| 1 | The always-on 100-seed bands (60 to 80 percent) sat two seeds above their floor on seeds 1 to 100 (62 and 61): an unrelated engine change could turn them red | `SAMPLE_BAND` 55 to 85 for the two always-on 100-seed tests (`omega-ruins-bench.test.ts`); the harness test still pins `BAND` 60 to 80 and the flag-gated 200-seed cells keep it |
| 2 | `fx('pyreflies-rising')` on Ultima Weapon and Omega Weapon contradicted the chapter's own canon row ("nothing added; the guardians go dark where they stood") | both fx dropped from `story/scripts/omega-ruins.ts` (`hideActor` kept; the `fx` import dropped) |
| 3 | The Nemesis page said it "acts about every nine ticks, as often as a hasted member of yours does every four" | "It acts every nine ticks; a hasted member of yours acts every four." (the note: Ultima 24, Omega 21, Nemesis 9 CTB). The same slip in section 8's J4 row (it said Omega acts about every nine ticks) now reads 21 |
| 4 | "costs more MP than she carries" (Yuna carries 999; Auto-Life costs 97): true only over a long fight | the page and the rule now say each cast takes her MP and a long fight drains it (no number: the guide test allows only the note's 99,999) |
| 5 | "An aeon with Shield takes the Nova for you" was unsourced (Omega's Nova row is special type, so Protect and Shell do not lessen it) | replaced with the sourced advice: keep every member near full before the count nears thirty; the Nova is a few hundred at the caps and over five thousand each on a lighter party (the note's section 6, an estimate) |
| 6 | A stray empty doc line in `chapters-experiments.ts` | removed |
| 7 | The commit trailer read "Claude Sonnet 5.5" | this commit's trailer is the brief's ("Claude Sonnet") |

The reviewer's notes and probe scripts are in the lane's scratch folder (not committed). It could not tie two items to a dump and said so: that Nemesis disables nothing (the Nemesis formation dump has no disable line, so that half holds) and the Ruins formations' Normal start (taken from the note only).
