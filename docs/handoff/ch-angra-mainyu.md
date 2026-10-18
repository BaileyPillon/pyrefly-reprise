# Angra Mainyu: a hidden FFX-2 chapter (the Bikanel Desert, the mission "Showdown in the Sands", FFX-2 Chapter 5)

**Branch `ch-angra-mainyu`** (from `origin/r48-rc` ea431aa0), pushed; **merged into release candidate r49-rc (with Biran and Yenke), not deployed.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres, the FFX-2 monster rows 268 to 270 and their three AI scripts; no FFX or FF7 file changes behaviour.
**Status: built, hidden, provisional art.** It is not on the board, not in "of 18", and not listed anywhere; it opens only by a typed word. Listing it waits for Bailey's word.

**What release candidate r49-rc changed on this chapter (FFX-2 only; the RE session's review of the branch tip 566003a1 found parity ship-ready, no engine fix needed: the same seed gives 264 of 264 FFX-2 rows identical against r48-rc and the goldens pass):** (1) the party's three levels are **raised by 20 (66 / 68 / 70)**, the driver's delegated pick recorded as Bailey's item 78a (section 6): a party-side estimate; the boss rows are untouched; the Chapter V preset is one constant away; (2) the arms' immunities are **proved**, no longer inferred (section 4), with one unproved link named; (3) the search origin of Tawrich's Punch stays inferred and carries RE's sensitivity note (section 4); (4) the "quarter of her maximum HP" a Darkness was said to cost is the data's 12.5 percent (section 6).

Bailey adopted the chapter on 2026-10-07 (D-536, "Angra Mainyu (FFX-2, the Bikanel Desert superboss)") and wrote on 2026-10-14, relayed by the driver, verbatim: "Please work on finishing the unimplemented chapters STAT". The driver's decisions: hidden behind the typed word **`angra`**, hidden chapter number **26** (25 is the Biran and Yenke lane's, word `gagazet`), no door word may end with the letter another begins with, listing waits for Bailey, the art is provisional and replaces no approved painting, the music is an existing cue by reference, the full fight only. Rulings that came with the RE note: the numbers come only from that note; the AI is built poll by poll as decoded; Punch is the only move that rolls to hit; the arms' immunities live in one named constant (inferred in the first build, proved by the RE session's later review: section 4); the ending is "the body falls, the arms leave with it", unproved and listed below; the 3 s action window stays on by precedent.

## 1. Play it

1. From the title, reach the chapter-select board (the title advances on Enter and E, so the word cannot be typed there).
2. Type `angra` on the board (any case, letters at most 2 s apart; the board never shows a hint). **It opens the chapter's party prep itself**, with no card and no sound before it. Enter starts the battle: an 11-line intro at the Al Bhed dig (our own words), then the first menu with the three bodies on a provisional Bikanel plate.
3. The word's letters are A (left), N (nothing), G (nothing), R (r1) and A (left): pinned with the real `Input`, the real board and the real title screen in `tests/unit/angra-door.test.ts` (22 tests), and the word is proven against every other door word, `gagazet` included (no word begins with, ends with or contains another, and no end of one is the beginning of another).
4. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

One formation, one link, no chain: **Angra Mainyu** (the body, bestiary #175, Lv 47, 333,444 HP) and its two arms as **parts**, **Zarich** (the left arm, #177, Lv 36, 5,440 HP) and **Tawrich** (the right arm, #176, Lv 38, 5,440 HP). The party is the Chapter V preset carried over (Yuna White Mage 46, Rikku and Paine Dark Knight 48 and 50: `[estimate]`), **raised by 20 levels in release candidate r49-rc (66 / 68 / 70; section 6)**. The fight cannot be fled.

| | |
|---|---|
| The body's moves | Perdition's Flame (ten hits on random girls, each 3/16 of that girl's maximum HP, physical: Protect halves it, Shell does not), Osmose (3/16 of each girl's current MP, which it drinks), Full-Life (on a fallen arm), Demi, Flare, Bio, Curaga (on an arm), Dispel |
| The body's script (**the game's own `m268`**) | per poll, the Flame counter gains 1 first; the first poll is the opening Flame (at least 80 percent HP) or no turn; Osmose below 200 MP; Full-Life on Tawrich, then Zarich; the Flame at counter 15 (so polls 1, 8, 23, 38, 53); otherwise one roll of five: Flare (Dispel when every girl has Reflect), Curaga on an arm, Bio, Demi, Demi |
| Zarich (`m269`) | Glimmer of Despair first (MP only, then STR and MAG down 1, DEF and MDEF down 2), then six Ga spells in the rotation Firaga, Waterga, Thundaga, Blizzaga from a random start, then Glimmer again: seven polls |
| Tawrich (`m270`) | seven Punches (near-weighted target, the only move that rolls to hit) then Bloody Breath (the whole party: Silence, Darkness, Poison, Confusion): eight polls |
| The arms' immunities (proved, section 4) | Zarich takes no physical damage, Tawrich no magical damage; **Darkness (Dark Knight) is neither, so it reaches all three bodies**. One constant: `COMPANION_IMMUNITY` |
| The ending (`[inferred]`) | the fight ends when the body falls, the arms standing or not; bringing both arms down ends nothing (the body raises them) |
| Rewards | the body only: 30 AP, 5,000 EXP, 5,000 gil, Pilfer Gil 2,000, drop Ribbon, steal Megalixir (both bytes 255); the arms pay nothing |
| Stage | a **provisional** Bikanel plate (dunes, a buried arch, a dug-in camp, a mesa under a bright sky), framed so the mesa and the dunes sit behind the three bodies; Chapter V's camera rigs and party slots |
| Art | provisional and new: the three bodies' `idle` paintings and the plate, section 7; no approved painting is replaced |
| Music | field bed `scene-bevelle-underground`, fight `boss-ffx2-fallen-aeons` (our own take, the cue Chapter XI, Ixion, Valefor and the Tourist Trap play; the wiki's OST page says "Aeons" plays here, `[single source]`), fanfare `victory-ffx2`. **Bailey's call by ear (rule 13)** |
| Guide | a card and a page in our words; the move advisor's tactic (`engine/tactics/ffx2-angra-mainyu.ts`) is the line the bench measures: one healer, two Dark Knights on Darkness |

## 3. The data, source by source (the RE session's rows win; every change from the first build is listed)

Sources, in order of authority: **`research/re-ffx2-angra-mainyu.md`** (the RE session's read of the game's own files: `monster.bin` rows 268 to 270, the move rows, the formation, the scene's start positions and the three AI scripts, 2026-10-14) and **`research/ffx2-angra-mainyu.md`** (the first build: the FF Wiki infoboxes at four revisions and Jegged's Chapter 5 page). Every number in `src/data/ffx2/enemies/angra-mainyu*.ts` carries its source in a comment, and `tests/fixtures/parity/ffx2/angra_mainyu_rows.json` holds the three rows as decoded fields, each with its record offset (the rows' 200 bytes are not kept), which `tests/unit/chapters/angra-mainyu-data.test.ts` (32 tests) compares to the data field by field.

**Where the rows and the wiki differ, the row wins** (the fixture's list, each pinned by a test):

| Field | The wiki | The row |
|---|---|---|
| Gravity (body and Tawrich) | halves | **nulled** (null byte 0x10); Zarich nulls it too |
| Reflect (body) | immune | **lands** (group-2 index 2 reads 0; the arms read 255) |
| Accuracy and Evasion | not listed | 95 and 0 |
| Zarich's Defense, Tawrich's Magic Defense | not listed | 0 and 0 |
| The body's order | Jegged's summary (Osmose low, Full-Life on an arm, the Flame on a clock, else Demi, Flare, Flame or Curaga) | the script: a roll of five, Demi twice, no Flame in the roll; the clock is 15 polls; Bio is in the roll |
| Move costs | none | every charge and recovery is the row's (`command-records/angra-mainyu.ts`), so the cadence follows from them and each body's agility (68, 82, 113) |

**Not built, on purpose:** the capped encounters of the Bikanel dig (the game's scenario levels 1 to 3: the body waits, ejects the party at 90, 70 or 50 percent HP, carries its HP between encounters, DEF and MDEF 255) and Unnatural Selection. Only the full fight (scenario level 5) is here. **Not used:** the second stat block in `monster2.bin` (boss Lv 56, 350,116 HP): all three rows have Oversoul type 0, so the only mechanism our notes know for selecting it does not fire (RE note section 5).

**Typos in the RE note, listed so nobody trusts them:** the printed hex of row 270 is 402 characters (201 bytes: one extra `00` in the last run; the fixture drops it, and every decoded field equals the note's table); the ground distance is printed 79.93 and is 79.925; the near-weighted shares are printed 28.8 / 41.7 / 29.5 percent and come out 28.7 / 41.7 / 29.6 from the weights 269 / 391 / 278, which match exactly.

## 4. The AI, and what is inferred

`src/battle/ffx2/ai/angra-mainyu.ts` is the game's own order, poll by poll (a poll is not a turn: the engine's `AI_REPOLL` and `idleFor(self, 1)` carry the one case where it is, the body's first poll under 80 percent HP, which cannot happen in the shipped fight because it starts at full HP). The scripts draw as the note says: `random() mod n` is stream 2 (one draw each), the target searches are stream 4 (a draw only with two or more candidates; near-weighted for Flare and Punch from the scene's start positions, uniform for Dispel and Zarich's spells). The same stream mapping the Tourist Trap and Valefor chapters use. `tests/unit/chapters/angra-mainyu-ai.test.ts` (21 tests) pins every branch on a stub context with exact draws, and each test fails when the matching constant moves (mutation-checked).

**Perdition's Flame is the game's own multi-hit machinery**, not a custom feature: `percent-total`, power 3, ten hits, the random-target bit. The ten hits are *planned* first (a girl is picked for each), then dealt round the planned girls; a Flame deals fewer than ten strikes when the girls they were planned for have fallen. Later hits on one girl ride the chain (x1.45, x1.5, x1.55 on the 2nd, 3rd and 4th).

**Hit rule (AGENTS.md rule 5):** Punch (0x4129) is the **only** move that rolls to hit (accuracy formula 1, byte 125); every other move carries `canMiss: false` explicitly, and a test pins both ways.

**Proved by the RE session's review of this branch (the first build had it inferred), still one named constant:**

- **`COMPANION_IMMUNITY`** (`data/ffx2/enemies/angra-mainyu.ts`): Zarich `null-physical`, Tawrich `null-magic`. The rows give both arms a permanent automatic status at group-2 slots 15 and 16 with the amount 127. **The game's stat ids 88 to 90** (`stat_invincible_physic`, `stat_invincible_magic`, `stat_invincible`; FFX2-G05 section 3.5) **write the counter bytes at 0x4B4 + 15, + 16 and + 17**, so slot 15 is physical immunity (Zarich), slot 16 magical immunity (Tawrich) and slot 17 full invincibility; **damage step 12** (`research/re-ffx2-damage.md` section 2.1) zeroes the damage of a hit that meets the matching byte, which is what the engine's pipeline does (`battle/ffx2/kernel/pipeline.ts`, `isImmune`, line 173). It matches Jegged and the wiki ("Zarich ignores physical, Tawrich ignores magic, Darkness is neither"). Laid as `autoStatuses`, the Vegnagun Leg's nodes' precedent; the engine's own damage pipeline refuses the wrong class (a `miss` with the reason `immune`) and lets Darkness through. **One link stays unproved: the monster set-up's copy of the row into the effective byte was read, not run.**

**Inferred, each in one named constant:**

- **`COMPANION_SEARCH_ORIGIN`** (`battle/ffx2/ai/angra-mainyu.ts`): Tawrich's near-weighted Punch is searched from **the body's spot** (-45, -13). The rows give both arms (0, 0) and the body's script links them to its model, so neither arm's own position is known; the driver's ruling. **It stays `[inferred]`, and the RE session measured how much it matters** (the shares of the three girls, in percent): at the body's spot they are **28.7 / 41.7 / 29.6**; a shift of **10 units** either way moves each share by **under 1 point**; the origin **(0, 0)** gives **23.6 / 51.6 / 24.8**; and **the facing assumption matters most**: with the body facing +x the shares are **23.5 / 30.4 / 46.1**.
- **Zarich's start draw is made at her first poll** (`random() mod 4` for the spell index): the engine has no battle-start hook for a script, and no other script draws on stream 2 before it (the body's first poll draws nothing; its first roll comes after the opening Flame's charge, about 11 seconds on, while her first poll comes within 2.2).

## 5. The unproved points (RE note section 12) and what would prove each

| # | Open point | How the chapter treats it | What would prove it |
|---|---|---|---|
| 1 | Which story chapter each counter range of the capped ladder is (1,500 / 2,900 / 3,900 / 5,900) and what the two level-5 events require | not built (the full fight only) | trace the Bikanel map scripts' counter and the events' conditions |
| 2 | What the battle does after Unnatural Selection ejects the party | not built | the same trace, plus a capture of an ejection |
| 3 | Whether the companions' existence flag stays off in the full fight (only the body's death ends it), and whether they are drawn | **the fight ends when the body falls; both arms are drawn and are targetable**; "the arms leave with the body" is told by the close | the end-of-battle check read against the companion flag, or a capture of a real full fight |
| 4 | The meaning of group-2 slots 15 to 17 and the amount 127 | **proved** by the RE session's review (section 4): `COMPANION_IMMUNITY`; one link is left, the monster set-up's copy of the row into the effective byte, read and not run | a physical hit and a spell on each arm in the Steam build would run that link |
| 5 | The body's facing at its first poll, and where the companions stand | the weights 269 / 391 / 278 (the body facing the middle of the party); `COMPANION_SEARCH_ORIGIN`, whose sensitivity is in section 4 (the facing matters most) | the model attach points; Tawrich's first twenty Punch targets counted in the real game |
| 6 | Whether the stat numbers the body sets to 255 are the DEF and MDEF the formulas read | only in the capped fights, which are not built | the damage formulas' reads of those stats |
| 7 | Animation and effect lengths of every move | the 3 s window (`ANGRA_MAINYU_ACTION_TIME_ON`), kept by precedent, **awaiting Bailey's pick** (section 6) | measured move lengths from the Steam build |
| 8 | Whether the game ever reads the `monster2.bin` rows for these three | not used | a trace of the Oversoul type's reads |
| 9 | Special-word bits 7, 8 and 10; the Bribe flag's bit | the row's word 0x7c3 is laid; the three carry `immune-to-bribe` like every boss here | the bits' effects traced |
| 10 | The unmapped raw columns, the formation row's unmapped columns, the level-5 battle flags | not read | the RE note's appendix, column by column |
| 11 | Monsters paying MP; a group-aimed single-target row hitting each girl | the engine pays each move's MP from the body's 9,999; Osmose hits every living girl | a run of the real fight |
| 12 | A new game on a used save | not applicable (the chapter starts at full HP) | a trace of the save variables |

Also open, and ours rather than the note's: the Reflect line (the wiki says the body is immune, the row says it lands; the row wins and Dispel is in the script for the case); the music is a single source; the arms' separate hit, KO and cast paintings do not exist.

## 6. Difficulty: measured, not tuned

`tests/unit/chapters/angra-mainyu-bench.test.ts`, 20 seeds a cell. The advisor line is the shipped tactic (one healer: Phoenix Down on a fallen girl, Turbo Ether, a Remedy for a Silence, Mega-Potion, Curaga, Protect then Shell, Esuna; two Dark Knights on Darkness with an X-Potion before they are low); the naive line has no Protect, Shell or items, and Rikku's Darkness with Paine's plain attacks:

| line | mode | wins | minutes | body actions | Flames | Osmoses | Full-Lifes | arm KOs | girl KOs | losses |
|---|---|---|---|---|---|---|---|---|---|---|
| advisor | bench (0 ms), action time on | 0/20 | 7.37 | 51.30 | 4.55 | 0.00 | 24.25 | 24.40 | 11.80 | 20 |
| advisor | bench (0 ms), action time OFF | 0/20 | 6.64 | 68.85 | 5.60 | 0.00 | 35.30 | 35.30 | 11.25 | 20 |
| advisor | Wait split 1.5 s, action time on | 0/20 | 5.69 | 39.35 | 3.75 | 0.00 | 16.90 | 17.05 | 10.70 | 20 |
| advisor | Wait split 1.5 s, action time OFF | 0/20 | 3.82 | 39.85 | 3.90 | 0.00 | 16.80 | 16.95 | 8.80 | 20 |
| advisor | Active 1.5 s, action time on | 0/20 | 3.29 | 22.60 | 2.70 | 0.00 | 6.70 | 6.85 | 9.00 | 20 |
| advisor | Active 1.5 s, action time OFF | 0/20 | 1.54 | 15.35 | 2.20 | 0.00 | 3.35 | 3.45 | 6.55 | 20 |
| naive | bench (0 ms), action time on | 0/20 | 0.70 | 4.25 | 1.10 | 0.00 | 0.55 | 0.60 | 3.70 | 20 |
| naive | bench (0 ms), action time OFF | 0/20 | 0.45 | 3.55 | 1.00 | 0.00 | 0.50 | 0.55 | 3.35 | 20 |
| naive | Wait split 1.5 s, action time on | 0/20 | 0.65 | 3.95 | 1.10 | 0.00 | 0.40 | 0.40 | 3.60 | 20 |
| naive | Wait split 1.5 s, action time OFF | 0/20 | 0.47 | 3.70 | 1.00 | 0.00 | 0.40 | 0.45 | 3.40 | 20 |
| naive | Active 1.5 s, action time on | 0/20 | 0.57 | 3.30 | 1.00 | 0.00 | 0.25 | 0.35 | 3.40 | 20 |
| naive | Active 1.5 s, action time OFF | 0/20 | 0.45 | 3.55 | 1.00 | 0.00 | 0.25 | 0.35 | 3.40 | 20 |

**At the sourced Chapter V preset the guide's line wins none of 240 fights, at any pace, with or without action time**, and the naive line is dead inside a minute (the first Flame took two girls on the seeds I read). This is the plain result and it is **not tuned**: no boss number moved. Why it loses, from the runs: the body has 333,444 HP and a Darkness does about 1,800 to 2,200 to each body, so the body falls to roughly 150 to 190 casts; each cast costs the caster 12.5 percent of her maximum HP (the data's figure, `hpCostPercent: 12.5` on `x2-dark-knight-darkness`; an earlier draft of this line said a quarter); the arms (5,440 HP) die to a few Darknesses and the body raises each with Full-Life (24 times in a mean seven-minute loss), so most of the body's turns go on that and the damage on the arms never counts; and the Flame, ten strikes at 3/16 of maximum HP with the chain, is a level-independent percentage that kills any girl who takes four of them.

**The one option the measurements handed to Bailey, now ON at +20 in release candidate r49-rc:** a raise of the preset's three levels, `ANGRA_MAINYU_LEVEL_BONUS` in `data/ffx2/builds/angra-mainyu.ts` (the table measures each raise from the sourced preset itself, `farplaneBuild`; the advisor line, bench speed, action time on):

| raise | levels | wins | minutes (all fights) | girl KOs |
|---|---|---|---|---|
| +0 | 46 / 48 / 50 | 0/20 | 7.37 | 11.80 |
| +10 | 56 / 58 / 60 | 7/20 | 9.62 | 7.55 |
| +20 | 66 / 68 / 70 | 18/20 | 7.09 | 2.50 |
| +30 | 76 / 78 / 80 | 20/20 | 4.66 | 0.95 |

**The raise is ON: +20, Lv 66 / 68 / 70, the driver's delegated pick** under Bailey's standing word to take all the recommendations (recorded as Bailey's item 78a; the lane measured 18 of 20 wins with the advisor's line at +20 and none of 240 at the Chapter V preset). **Party-side estimate; the boss rows are untouched; the Chapter V preset is one constant away** (`ANGRA_MAINYU_LEVEL_BONUS = 0`). No source gives a level for the mission (the research and the RE note hold no party number), so the raise is an `[estimate]` and Bailey's to keep or to take back. The girls' stats are a function of dressphere and level alone, so a raise changes nothing else.

**Why the sourced preset loses, and what the raise buys (the RE session's explanation, from the game's own rows at the estimated Lv 46 / 48 / 50):** survival is the whole problem. Perdition's Flame does about 6,657 per cast against about 14,000 total party HP, Flare one-shots an unshelled Yuna or Rikku, and Full-Life revives the arms 14 to 28 times. The +20 option won in 387 s and 427 s.

**The shipped party measured again** (the same bench, 20 seeds a cell, on the r49-rc tree, the party at +20 as it ships; the +20 row above and this table agree where they overlap, and every row of the sourced-preset table above came out the same on this tree, so the merge with Biran and Yenke moved no FFX-2 number):

| line | mode | wins | minutes | body actions | Flames | Osmoses | Full-Lifes | arm KOs | girl KOs | losses |
|---|---|---|---|---|---|---|---|---|---|---|
| advisor | bench (0 ms), action time on | 18/20 | 7.09 | 48.75 | 3.50 | 0.00 | 40.25 | 41.30 | 2.50 | 2 |
| advisor | bench (0 ms), action time OFF | 20/20 | 3.81 | 37.65 | 3.05 | 0.00 | 29.65 | 30.50 | 0.90 | 0 |
| advisor | Wait split 1.5 s, action time on | 16/20 | 8.47 | 58.75 | 3.95 | 0.00 | 45.90 | 46.95 | 4.10 | 4 |
| advisor | Wait split 1.5 s, action time OFF | 17/20 | 4.57 | 47.40 | 3.75 | 0.00 | 33.80 | 34.80 | 3.15 | 3 |
| advisor | Active 1.5 s, action time on | 1/20 | 9.18 | 63.20 | 5.00 | 0.00 | 36.60 | 36.85 | 12.25 | 19 |
| advisor | Active 1.5 s, action time OFF | 2/20 | 4.41 | 44.95 | 4.05 | 0.00 | 22.40 | 22.70 | 8.65 | 18 |
| naive | bench (0 ms), action time on | 0/20 | 1.02 | 6.25 | 1.35 | 0.00 | 2.35 | 2.50 | 3.75 | 20 |
| naive | bench (0 ms), action time OFF | 0/20 | 0.76 | 6.55 | 1.30 | 0.00 | 2.50 | 2.65 | 3.75 | 20 |
| naive | Wait split 1.5 s, action time on | 0/20 | 1.02 | 6.30 | 1.35 | 0.00 | 2.70 | 2.90 | 3.60 | 20 |
| naive | Wait split 1.5 s, action time OFF | 0/20 | 0.68 | 5.75 | 1.20 | 0.00 | 1.70 | 1.75 | 3.65 | 20 |
| naive | Active 1.5 s, action time on | 0/20 | 0.93 | 5.75 | 1.30 | 0.00 | 1.55 | 1.80 | 3.95 | 20 |
| naive | Active 1.5 s, action time OFF | 0/20 | 0.60 | 5.05 | 1.20 | 0.00 | 1.05 | 1.10 | 3.55 | 20 |

**What that says about the shipped raise, plainly:** at bench speed the guide's line wins 18 of 20 (20 of 20 without the 3 s window) and on the Wait-split clock at 1.5 s a menu 16 of 20, **but on the Active clock at 1.5 s a decision it wins 1 of 20** (2 of 20 without the window; 12.25 girl KOs a fight against 2.50 at bench speed); the naive line still wins none anywhere. So +20 makes the fight winnable by the advisor's line at a patient pace, not at a quick one; a further raise (+30 wins 20 of 20 at bench speed) is the other measured option, and the sourced preset the other end.

**The party preset is the nearest existing FFX-2 chapter's, in story order:** Jegged's Chapter 5 walkthrough runs Djose Temple, then the Bikanel Desert, then Bevelle, and the hidden Experiment (the Chapter 5 mission at Djose Temple) uses **the Chapter V preset** (`builds/farplane.ts`, Yuna White Mage 46, Rikku and Paine Dark Knight 48 and 50, the Experiment's `buildRef`). It sits inside the Chapter 5 level band (43 to 52) against the body's Lv 47. A deep copy, so no chapter's preset can mutate another's.

**Action time (the 3 s animation window) is kept by precedent (D-151 Cloister, D-187 and D-197 Road, D-269 Ixion), awaiting Bailey's pick for this chapter**; the table gives every cell both ways (`ANGRA_MAINYU_ACTION_TIME_ON`, one constant). In the real engine the window adds exactly 90 steps to every turn, and the turn lengths without it follow from the move rows and each body's agility: Tawrich's Punch 93 steps, Bloody Breath 185; Zarich's Glimmer 255 and each Ga spell 90; the body's Flame 337, Flare 154, Demi and Bio 124, Curaga 93 (`angra-mainyu-engine.test.ts` pins all of them, with and without the window).

## 7. Art (provisional) and the staging

- **No approved painting was replaced.** The paintings are **new files in the local art mirror** (`public/art` is gitignored on main, local only), written beside and renamed into place, each with a sidecar saying **PROVISIONAL: an agent pick, NOT Bailey's approval**; the mirror's manifest was rebuilt from the mirror itself (the other lane's new subjects stay listed).
- **What was made:** 26 candidate renders with the generator (`tools/gen/comfy.mjs`, Animagine XL 4.0 Opt, on the local ComfyUI, our own prompts, no retail image as input or reference): the body (6; pick: candidate 1), Zarich (8 in two rounds; the first round drew full-bodied creatures, the second "disembodied hand" drew arms; pick: the second round's 4th, a violet clawed hand), Tawrich (8 in two rounds; the first pick, the second round's 4th, a giant fist inside a swirl, drew as a square halo in the game and **was replaced by the second round's 2nd**, a red armoured limb ending in a spiked fist), the plate (4; pick: candidate 2). **The brief's 6 to 12 renders were for the body (6 made)**: the arms and the plate are three more subjects and took the other 20, Tawrich's second round (after the browser showed the halo) included.
- **What is there:** `characters/angra-mainyu/idle`, `characters/angra-zarich/idle`, `characters/angra-tawrich/idle` and `backdrops/bikanel-desert-provisional` (2688 x 1536). **No hurt, cast, attack, KO or overdrive painting exists for any of the three**: the presenter's fallback is drawn.
- **The framing** is Chapter V's camera rigs and party slots with the plate solved against them in the browser at 1600x900 and 390x844: the plate is 150 wide at z -48, slid 27 to the left and centred at y -23 so the mesa and the dunes sit behind the three bodies, a 3D floor tinted to the sand, a lower highlight gain (the plate is a bright daylight picture in a pipeline made for dark ones) and the painted figures kept out of its bloom. **Where the bodies stand and how tall they are is staging, ours, not game data**: the body at the back, Zarich in front on the left and Tawrich in front on the right, none under the right-hand command menu. **The scene key is the plate's own key** (`bikanel-desert-provisional`), as every chapter's is, because the cutscene screen and the party prep's wash draw `backdrops/<sceneKey>.png` (a scene key of its own had left the intro on a black screen; the browser proof found it).
- **Disclosed:** the plate's sunlit dunes still glare behind the girls on the desktop frame; each body has one painting, so none changes pose: the presenter's own tilt and shake are all the motion there is.

## 8. Files and merge hot spots

New: `src/data/angra-mainyu-ids.ts`, `chapter-ffx2-angra-mainyu.ts`, `chapter-meta-ffx2-angra-mainyu.ts`; `src/data/ffx2/enemies/{angra-mainyu,angra-mainyu-abilities}.ts`; `src/data/ffx2/builds/angra-mainyu.ts`; `src/data/ffx2/monster-records/records-angra-mainyu.ts`, `src/data/ffx2/command-records/angra-mainyu.ts`; `src/battle/ffx2/ai/angra-mainyu.ts`; `src/app/screens/frontend/angraDoor.ts`; `src/story/scripts/ffx2-angra-mainyu.ts`; `src/data/guides/ffx2-angra-mainyu.ts`, `guides/docs/ffx2-angra-mainyu.ts`; `src/engine/tactics/ffx2-angra-mainyu.ts`; `src/scenes/angra-mainyu-desert.ts`; the research notes `research/ffx2-angra-mainyu.md` and (merged from the RE branch) `research/re-ffx2-angra-mainyu.md`; the plan `docs/plans/ch-angra-mainyu-review.md`; the fixture and seven test files.

Shared files touched (all additive; `docs/CONTRACT-CHANGES.md`, newest entry on top). **Likely conflicts with the Biran and Yenke lane (`gagazet`, number 25), in order:**

1. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-angra-mainyu'` (first line of the union), `ListedChapterId` excludes it, `Chapter.number` gains `26` (**take the union with the other lane's `25`: `... | 24 | 25 | 26`**). No line is added (397 of 400 stays).
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts`: one added item each.
3. `src/app/screens/frontend/chapterDoors.ts`: one row and one import; `tests/unit/chapter-doors.test.ts`: the word list and the game list gain `angra` (**the other lane adds `gagazet` to the same two lines: union**). The pair is green: no other word starts with `a` or contains `angra`, none of `angra`'s endings (`a`, `ra`, `gra`, `ngra`) begins another word, and the shared rule is run against `gagazet` in `angra-door.test.ts`.
4. `src/battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `data/ffx2/monster-records/records.ts`, `data/ffx2/command-records/index.ts`, `src/data/guides/index.ts`, `guides/docs/index.ts`, `engine/tactics/index.ts` and `lookup.ts`: one registration line each.
5. `src/battle/ffx2/ai/script-rolls.ts`: one row (`angra`) in `SCENES`. `src/scenes/experiment-scenes.ts` and `src/engine/pyreflyCanon.ts`: the scene and its rows. `src/data/ffx2/items/held.ts`: the Ribbon (held only); `tests/unit/ffx2-steal-item-names.test.ts`: its price listed as unsourced.
6. Tests that count every chapter gained its row: `chapter-numbers`, `audio-music-batch1-2026-10-10` and `audio-music-batch2-2026-10-12` (the aeon cue's chapter list and the table of beds and cues), `guide-ffx2-wait-habit` (the carriers), `data-ffx2-monster-records` and `data-ffx2-command-records` (the all-rows checks), `parity-ffx2-ai-rolls` (the scene keys), `chapters/exp-fayth` (the hidden-scene list) and `chapters/trema-options` (the action-time allow-list). **`parity-ffx2-rng-streams` changed differently: its sample went from 400 to 2,000 actions** (section 10): every lane that adds FFX-2 abilities moves that sample, so the line belongs to whoever merges first.
7. `CHANGELOG.md` (the header count 70 becomes 71; the other lane adds its own entry: union and recount).

## 9. Open points for Bailey and the driver

1. **Listing**: the chapter stays hidden until Bailey says. Listing is a record move (into `CHAPTERS` and `CHAPTER_IDS`, removing `experimental`), a number and a numeral, plus the board's card art.
2. **The difficulty and the level option** (section 6): the guide's line wins none at the sourced preset. **The raise ships ON at +20 in release candidate r49-rc** (the driver's delegated pick, item 78a; the guide's line wins 18 of 20 at bench speed in about 7 minutes, 16 of 20 on the Wait-split clock, and **1 of 20 on the Active clock at 1.5 s a decision**). Bailey's call: keep it, or set `ANGRA_MAINYU_LEVEL_BONUS` back to 0 for the sourced preset.
3. **Action time** (3 s) kept by precedent, awaiting his pick.
4. **The three paintings and the plate are provisional picks of ours**, not Bailey's; the arms have an idle painting only; music by ear, existing cues only.
5. **The unproved points** in section 5, above all the ending (the arms standing when the body falls) and the arms' immunities.
6. The game's text is not quoted anywhere: the intro and the close are our own words over the sourced beats (Rikku's dig camp, the gatekeepers, the Cactuars' seal).

## 10. Tests and verification

**This chapter's tests (106):** `tests/unit/angra-door.test.ts` (22: the word and every other door word through the real `Input`, the real board and the real title screen, the shared overlap rule run with `gagazet` present), `tests/unit/chapters/angra-mainyu-data.test.ts` (32: the fixture as decoded fields with their offsets, the enemy data, the elements, the monster and command records, the immunity constant, the abilities, the scene and the constants of the scripts, the group, the party and the chapter record), `angra-mainyu-ai.test.ts` (21, the three scripts on a stub context with exact draws), `angra-mainyu-engine.test.ts` (12, the real engine against an immortal party that only defends: the scripts' order over 60 body actions on four seeds, the Flame, Protect and Shell, Glimmer, Osmose, the cadence with and without the window), `angra-mainyu-parts.test.ts` (10: the arms' immunities in the real engine, Full-Life, the ending and its rewards, the three pause objectives on real logs), `angra-mainyu-flow.test.ts` (5: the setup, the three story triggers once each, the stage, the experiments' store) and `angra-mainyu-bench.test.ts` (4). **The immortal party is a measurement rig, not a chapter**: the girls carry Invincible and are topped up at every decision, because no level survives a Flame unaided. Each test was mutation-checked: a changed constant in the script, the move rows or the data makes the matching test fail.

**Checks:** `tsc --noEmit` exit 0; `node tools/orphans.mjs`: 28 orphaned modules, all older, none of this chapter; `node tools/audio/qa.mjs`: 0 cues with findings, 0 sfx findings.

**Full suite** (once: `vitest run --maxWorkers=2` from the worktree, the art junction in place, temp on the second drive, on the step-4 tree): **1,256 files: 1,238 passed, 15 skipped, 3 failed; 19,713 tests passed, 4 failed, 74 skipped, 1 todo; 2,432 s.** The three failing files, each settled:

- `strategy-guide.test.ts` (1 test): the guide card's three citations named the RE note, and the test requires the corpus's own form (`ffx2-<slug> §n`). Fixed: section 8 of the first-source note (`research/ffx2-angra-mainyu.md`) now holds the facts the game's own files settle, in that form, and the card cites it.
- `parity-ffx2-rng-streams.test.ts` (2 tests): its sample of 400 actions is drawn from every registered ability, and the pool holds **one** Steal among about 280, so a sample misses it about one time in four; this chapter's fifteen abilities moved the sample onto a miss (the coverage check and the Steal mutant failed; no stream was wrong). The sample is now 2,000 (a miss under one in a thousand, half a second more). **A shared test changed: the other lanes that add FFX-2 abilities need the same line.**
- `live-url-follows-host.test.ts` (1 test): a 15 s timeout of a directory walk while the production build was copying ten gigabytes of art and two other suites ran; alone it passes in 0.4 s. No change.

After the fixes the 30 guide and stream files (390 tests), the 19 scene, chapter, door and number files (273 tests) and the live-url file pass; a second full run was not made.

**Browser proof** (headless Chromium from node with `PYREFLY_BROWSER=gpu`, a production build made with vite directly at `BASE_PATH=/` (4.9 minutes; the art step wrote 485 lossless WebP, 2,983 recompressed PNG and left 316 unchanged), one dist outside the repo tree, served by `vite preview` on one port, stopped afterwards; the script is scratch and not in the repo; no console errors and no 404s in any run; **the PAUSE flag of the overnight art queue was already in place and was left alone**):

- **Board** (1600x900, the first build, the step-5 tree): the board has 18 cards, none for the chapter, no "EXP" numeral, the strip says "0 of 18 beaten"; the word `angra` opens the chapter's party prep, and `valefor`, `daigoro`, `leblanc`, `experiment`, `mushroom` and `fayth` each still open their own chapter's prep; `limit` still opens the FF7 Guard Scorpion fight exactly as in the base build (that door has been open since 2026-09-27: the brief's "limit shut" is out of date, and the live check of the base build recorded the same); a wrong word (`angrg`) opens nothing. After the scene-key fix below, `angra` was run again on the final build.
- **Win** (1600x900, the final build, the shipped advisor through `autoBattle('intended')`): the 11-line intro plays over the desert plate, the first menu shows the three bodies on the plate with the guide card, the enemy card ("Tawrich acts next: Punch") and the three girls, **Escape opens the pause screen** (the chapter line and the next objective, "Bring both arms down") and Escape resumes; **the advisor line cannot win this fight at the sourced preset, so once the first menu was photographed the BODY's HP was set to 9,000 through the debug API's live battle state** (the proof is of the flow: the menu, the kill, the results; the difficulty is measured in the bench), and the fight was won in about a minute of battle clock. Its moves: Perdition's Flame first, then Bio three times, Full-Life once; Zarich's Glimmer and four spells; Tawrich's Punch six times; **both arms fell to Darkness** and the HUD showed them "DOWN"; the Flame's ten hits were planned and landed on girls; the results read EXP 5,000 (x3 party), AP 30, Gil 5,000, Ribbon.
- **Loss** (1600x900, nobody answers a menu, on the Active clock): defeat at 12 turns (the body's Flame, two Bio; Zarich's Glimmer and three spells; Tawrich's five Punches), the Defeat panel ("Attempts 1, Best: never cleared") and RETRY goes back to the party prep.
- **Phone** (390x844, touch): the same win (first menu, the stage drops on the girls' status chips after Glimmer, the Darkness banners, the results).
- **Screenshots** in `docs/screenshots/ch-angra-mainyu/`: the board before the word and the prep after it; 1600x900 and 390x844 party prep, intro (lines 1 and 5), first menu, the fiend's bar emptied after Darkness, the results; 1600x900 pause, defeat results and the retry. All were looked at. **The browser found two things the tests could not**: a first Tawrich painting that drew as a square halo (re-picked), and an intro on a black screen because the scene key was not the plate's key (fixed, `897a250c`); the staging itself took seven rounds (the plate's lower left is near-black in this pipeline).

**What the proof does not show:** the audio (rule 13: by ear), a win without the HP device, Zarich and Tawrich knocked out as paintings (the presenter hides a downed arm; no KO painting exists), the arms' presentation at the victory (the close says they leave with the body; on screen the results panel simply replaces the field), Osmose and the Reflect branch (engine tests only), and anything live (not deployed). The final build was made from commit 897a250c (the scene-key fix); the commit that carries this note, the changelog and the frames changes no code.

## 11. For the driver: NOW.md line and release notes

NOW.md (suggested): "Angra Mainyu (hidden FFX-2 chapter, typed word `angra` on the board, number 26 `EXP`): built on branch `ch-angra-mainyu`, pushed; the game's own rows 268 to 270 and scripts m268 to m270 (RE note 2026-10-14), one fight, the Chapter V party carried over; **the guide's line wins 0 of 240 fights at the sourced preset** (the measured option that raises the levels by 20 is ON in release candidate r49-rc: 18 of 20 at bench speed, a party-side estimate, the boss rows untouched, the preset one constant away); art provisional (new local paintings, nothing replaced); merged into r49-rc, not deployed; the unproved points and the inferred constants are in `docs/handoff/ch-angra-mainyu.md`."

CHANGELOG (FFX-2 only): in the file (an entry at the top, "not live"). Ledger rows are the driver's: the word (`angra`), the party-level estimate, the level option, the art picks (provisional), the action-time carry.
