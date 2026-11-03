# The Fallen Maesters: the Via Infinito's floors 20, 40, 60 and 80 (a hidden FFX-2 chapter, number 30)

**Branch `ch-maesters`** (from `origin/r73-int` d5049f686), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres, the FFX-2 monster rows 221, 69, 232 and 239 and their four AI scripts; no FFX or FF7 file changes behaviour. The registry rows, the door row and the stat-setter case are shared plumbing, "both" (CHK-020), inert for every other chapter.
**Status: built, hidden, no paintings.** The chapter opens only by a typed word. Listing it waits for Bailey's word. **The four bosses have no painting yet (ART NEEDS, section 7): the presenter draws its procedural placeholder for them.**
Written 2026-11-02 by a Sonnet sub-agent of the release driver. Nothing here was shown in a browser (the lane ran no browser, no dev server, no GPU): section 9 holds the browser jobs with their predictions.

Authority: Bailey 2026-10-18 (D-1039, "Spectral Keeper + Fallen Maesters (Recommended)"), and 2026-11-02, relayed by the driver, verbatim: "i'll go with all of your recommendations please implement all the unimplemented chapters that i decided on" (and 2026-10-31: "you make the executive decisions for the next few days"). **Every pick in section 5 is the paper preflight's own recommendation, "driver pick, his to overturn".**

## 1. Play it

1. From the title, reach the chapter-select board. Type **`infinito`** (the Via Infinito's name; any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it; the cursor does not move for any letter (only F is a bound key, `l1`, which the board ignores). On a phone, the long-press field on the "Chapter select" label takes the same word.
2. Enter starts the chapter: a pre scene (our draft, section 8), then **floor 20: Aranea**, a fresh fight. After her fall a 15 s seam (the glyph mends the girls), then **floor 40: the Black Elemental**, then **floor 60: Concherer**, then **floor 80: Chac**, then the post scene. Each link opens at full HP and MP with a fallen girl standing and **no Save Sphere card** (the floor's glyph is not one); items spent stay spent; statuses and the worn dressphere do not carry. A defeat on floors 40, 60 or 80 retries **that floor**; a defeat on floor 20 starts the chapter over. Escape is off.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration. The party is Chapter XIII's Lv 99 three (Yuna and Paine Dark Knights, Rikku an Alchemist).

## 2. What it is

| Floor | Fiend (game row) | Lv | HP | What it does (the game's own script, poll by poll) |
|---|---|---:|---:|---|
| 20 | **Aranea** (221) | 52 | 18,280 | four plain polls (Attack, two hits of power 8, three in four; Spider Bite, power 32 with no Defense term and an 8.7 s charge, one in four), then **Gooey End** on the party (140 to 158 HP, Poison, Stop with a counter of 25, STR and MAG down a stage), repeat |
| 40 | **Black Elemental** (69) | 88 | 9,999 | a permanent **Reflect**; fastest gauge (AGI 255); every third poll Magic Up on itself (five times: polls 3, 6, 9, 12, 15); otherwise Berserk (50), Flare (33.3), Ultima (16.7 percent; Ultima is not reflectable); below a third of its HP one poll in four is Absorb on the girl with the most HP |
| 60 | **Concherer** (232) | 96 | 343,280 | a permanent **Shell and Protect**; Gunk (all of one girl's MP, Poison), **Megaton Press** (about 55,000 to 62,000 on a girl: a KO; 28,000 to 31,000 through Protect) or Attack, a quarter, a quarter, a half; **one result of 10,000 HP or more breaks the shell** (DEF and MDEF to 1) and from then on it only Attacks |
| 80 | **Chac** (239) | 98 | 437,850 | a start draw sets its counter; **Heaven's Cataract** on the party on poll 3, 4, 5 or 6 and then every sixth (about 9,300 to 14,600 a girl, and DEF, MDEF, ACC and slots 12 and 13 down ten stages); otherwise **Stony Glare** (Petrify at 255, through any resist) two polls in three; **her Attack and Cataract shatter a petrified girl** (Death and Eject); a plain Attack only when exactly one girl is alive and not stone, and then on any living girl, stone included |

Absorbs Thunder and is weak to Ice: Chac only. All four null Gravity and are immune to the usual ailments; **Chac alone can be delayed and interrupted** (special word 0x99: the no-ATB-damage and Interrupt bits are clear), which is what Jegged's delay-lock line uses. Rewards: the rows' EXP, Gil, AP (1) and Pilfer Gil; steals; the four kill-reward rows (section 3).

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx2-fallen-maesters.md` (the RE parity session, 2026-10-19, `monster.bin` rows 221, 69, 232, 239 and the move rows of the normal scripts), tagged `[RE §n]` in the files. **`tests/fixtures/parity/ffx2/fallen_maesters_rows.json`** holds the four monsters and the fifteen moves as decoded fields with their file offsets (generated from the note's hex), and `tests/unit/chapters/fallen-maesters-data.test.ts` (51 tests) compares the enemy data, the monster records and the command records to it field by field.

**Where the note's prose and its rows differ, the row wins** (listed so nobody trusts the prose): Spider Bite's table text says "physical", its row's damage flags are 0 (neither Protect nor Shell reduces it; the test pins that Protect changes nothing); the RE note's wiki-level "Evasion and Luck" for Cataract's slots 12 and 13 stay `[I]` (the engine maps those slots to Evasion and Luck stages).

**Gaps, named (not invented):**
- **Item ids.** The note gives steal, bribe and drop items by NAME. Ids are laid only where the repo already pairs a name with an id: Ether 0x2004, Turbo Ether 0x2005, Elixir 0x2008 and Stamina Tonic 0x203b (`research/re-ffx2-commands.md`), Mythril Bangle 0x9002, Crystal Gloves 0x900e and Pixie Dust 0x9012 (`KILL_ITEM_ID`). **Rune Bracer, Kinesis Badge, Mana Tonic, Tetra Gloves, Blessed Gem, Shining Gem and every Bribe slot have no id in any table of this repo**, so those slots are 0 (empty) in the records and in `kill-rewards.ts`, and the authored steal's rare slot stands in with the common item (flagged in the enemy file). The RE session can fill all of them from `item.bin` and `accessory.bin`. Effect: the Black Elemental drops nothing, Concherer and Chac only their rare slot, Aranea a Stamina Tonic or a Mythril Bangle.
- **Positions.** The four floor scenes ship no start positions; the near-weighted target search uses Trema's scene (`stbv09_229`, the same battle-map family) as one named constant, `MAESTERS_SCENE` (`battle/ffx2/ai/fallen-maesters-a.ts`), `[inferred]`. Alternative: a uniform search (`searchUniform`, a one-line change). The RE note's sensitivity warning for the Angra fight applies: the facing assumption moves the shares most.
- **Action time** (animation length) and **stature** are unread (RE Q14, Q15): the fights use the per-command span with its fallback for an unregistered monster body, and every fiend stands at the stage's default boss height (3.1) on the boss spot. The model scales (Aranea 125, Black Elemental 200, Concherer 115, Chac 150 percent) are staging that waits for the stature read and the paintings.
- **`monster2.bin`** (the Oversoul versions) is not used (FM2 a).

Kill-reward rows (`monster-records/kill-rewards.ts`, `kill_reward_rows.json`): 221 pays 4,000 EXP, 800 gil, 1 AP; 69 pays 770, 380, 1; 232 pays 6,000, 1,200, 1; 239 pays 2,200, 750, 1; all drop byte 255.

## 4. Engine work (the preflight's N1 to N10) and what the T0 checks found

| # | Need | What was done |
|---|---|---|
| N1 | the shell break on ONE result of 10,000 HP or more | **No edit to the four capped host files.** `Concherer`'s script reads the HP lost between two `onResult` calls (the hook runs once per result, after its HP is in; nothing else changes Concherer's HP in between: it is immune to Poison and the percent formulas and has no Regen). It is the same number as the game's per-result amount. Tests: the AI file (9,999 does not break, 10,000 does, two results of 6,000 do not) and the engine file (Charon with Break Damage Limit: 21,420 and 31,059 break it end to end; Darkness never does). |
| N2 | writing DEF and MDEF | two `case`s in `adapt/stat-setter.ts` (`Chr+0x397`, `0x399`), 111 lines. |
| N3a, N3b, N7 | Oversoul versions and counter | not built (FM2 a). |
| N4, N5 | Chac's attack-candidate rule; the petrified in an all-party mask | the script (`alive minus stone is exactly one` includes the stone in the Attack's candidates and excludes them from Stony Glare's), pinned in the AI file; **N5 checked on the engine: Heaven's Cataract reaches a petrified girl and destroys her (at least 17 of 20 seeds, the 100-in-101 draw), and a blow on a stone girl destroys her.** |
| N6 | a spot and a height by id | **moot**: a slot-0 enemy already stands on `CLOISTER_BOSS_SPOT` at the stage's boss height; `scenes/cloister-100.ts` is untouched. |
| N8 | Chac's slow-down bit | wired by the record: `atb-engine.ts` reads special bit 1 (`& 2`) and bit 6; Chac's word has both clear. |
| N9 | data blocks | `data/ffx2/enemies/fallen-maesters*.ts`, `command-records/fallen-maesters.ts`, `monster-records/records-fallen-maesters.ts`, the fixture. |
| N10 | chapter plumbing | the id, the number, the meta, the door `infinito`, `docs/CONTRACT-CHANGES.md`. |

**T0 findings (each pinned by a test, so a change that moves one fails loudly):**
1. **The engine has no Reflect redirect** (`kernel/hit.ts` says `pp_reflect_redirect` is not built), for any unit. The Black Elemental's permanent Reflect is therefore **data only**: it shows as a status and survives a Dispel, and a reflectable spell (Drain) aimed at it LANDS instead of bouncing. **This makes floor 40 easier than the game** (28 of 30 seeds win on a plain Darkness line). The test is named "T0, KNOWN GAP"; it fails the day the redirect is ported. RE's job, not this lane's (rule 6).
2. **Remedy cures the Petrify Chac deals** (the engine removes `petrify`); Phoenix Downs are not needed for it and a destroyed girl (Death and Eject) cannot be raised, which the test lines respect.
3. **Break Damage Limit is not on at the start.** `viaInfinitoBuild` puts Paine on The End at node 0 with no gate passed, and The End's Break Damage Limit needs the green and red gates (`garment-grids.ts`). At the start Charon is capped at 9,999 and Darkness reaches 6,000 to 9,700: **no result of this party ever reaches the 10,000 the shell needs until a girl has passed those gates (Spherechange work).** With the limit broken (the bench's rig) the shell breaks in every fight.
4. **Girls' HP.** 10,710 for Yuna and Paine, 5,106 for Rikku (Crystal Bangle included): Ultima caps at 9,999 a girl and KOs Rikku outright; Megaton Press (59,524 in the probe) KOs any girl; Cataract unshelled takes 9,300 to 14,600 a girl.
5. **Aranea's Attack never lands on this party** (Luck 111 from Rabite's Foot beats her ACC 95: 40 of 40 evaded); on a girl with no Luck and no Evasion it lands as two hits.

## 5. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick | Alternative |
|---|---|---|---|
| FM1 | chapter shape | **(b) four links, each a fresh fight**: `nextGroupId`, `restoresPartyOnEntry` + `noSaveSphereCard` on links 2 to 4 (the glyph heals; the retry checkpoint is the link) | (a) chained with carried HP/MP; (c) a floor picker on the card |
| FM2 | which version | **(a) normal only** | (b) Oversoul as an authored form switch later (Chapter XIII's pattern, +9 agent hours); (c) the kill counter (unproved) |
| FM3 | party and kit | **(a) `viaInfinitoBuild` as is**, measured (section 6) | (b) the Trema kit (measured: no better on floors 60 and 80); (c) per-link bands. **Boss numbers are not tuned.** |
| FM4 | arena | **(a) the Via Infinito plate as is** (the game shares one map across every `stbv09` row) | (b) a plate per pair; (c) four arenas (not sourced) |
| FM5 | the four paintings, the shell-break look | **none made** (ART NEEDS); the shell break is announced by a system message and the intent slab | concepts for Bailey's pick; a cracked-shell variant painting |
| FM6 | story | **a draft in our words** (section 8), the four people hinted at and never named | name Wen Kinoc, Jyscal Guado, Yo Mika and Lady Yunalesca: a one-line change a floor |
| FM7 | the Pilgrimage placement | **not built**: the FFX-2 boon pool and run layer do not exist; `getChapter` already finds the chapter by id | a five-stop descent ending at Chapter XIII; forks into Trema; Chac as the elite |
| FM8 | Escape | **off** (the game's own answer, Q3, is unread) | on |
| FM9 | Chac's slow-down bit | **wired by her special word** (section 4, N8) | none |
| FM10 | music | **stand-in: scene `scene-bevelle-underground`, battle `boss-ffx2-fallen-aeons`, fanfare `victory-ffx2`** on all four links (Trema keeps `boss-trema`) | `boss-trema` or a new cue on his ear (rule 13). Bailey's ears for the final. |
| FM11 | hidden, then listed | **hidden behind `infinito`, number 30**; listing waits for his word | another word |
| FM12 | live checks | not run (no game, no browser); Q3, Q4, Q15 and Q14 stay with the RE session | |
| FM13 | ship together with the Keeper | **the integrator's call**: nothing here depends on the Keeper lane; the shared lines (the number union, the door lists, the CONTRACT entry) are written to merge | |

**Words and numbers.** Number 30 as assigned; `Chapter.number` gains `29 | 30 | 31 | 32` (the same edit in every new chapter's lane). The word `infinito` overlaps no existing word nor `pilgrim`, `yrp` or `waker`; the Keeper lane's word is unknown, and `chapter-doors.test.ts` will say if it overlaps.

## 6. Difficulty: measured, not tuned

`tests/unit/chapters/fallen-maesters-bench.test.ts` (12 seeds in the suite, `PYREFLY_BENCH_SEEDS=30` for the table below; bench speed, wait ATB). A *line* is a test input standing in for a player (`tests/unit/helpers/fallenMaestersDrive.ts`): **darkness** (Yuna and Paine Darkness, Rikku mends), **curtains** (the same with Rikku's first two turns a Light and a Lunar Curtain), **charon** (Charon instead of Darkness), **remedy** (curing a petrified girl first); **BDL rig** = Yuna and Paine break the damage limit from the first turn (what passing The End's gates gives; the chapter does not give it).

| Floor | Line | Wins (30 seeds) | Girl KOs a fight | Minutes a fight | Shell broken |
|---|---|---:|---:|---:|---:|
| 20 Aranea | darkness | **30** | 0.00 | 0.16 | n/a |
| 40 Black Elemental | darkness | **28** | 0.40 | 0.22 | n/a |
| 60 Concherer | darkness | 2 | 4.33 | 1.43 | 0 |
| 60 | curtains | 1 | 4.40 | 1.44 | 0 |
| 60 | charon, no limit break | 0 | 5.70 | 0.68 | 0 |
| 60 | **charon + BDL rig** | **26** | 15.00 (Charon costs its caster's HP; Rikku raises them) | 2.12 | 30 |
| 60 | curtains, (b) Trema kit / (c) + 10 Phoenix Downs | 0 / 1 | 3.87 / 4.40 | 1.30 / 1.44 | 0 |
| 80 Chac | darkness / curtains / charon / remedy-charon (+BDL) | **0** of 30 each | 2.2 to 3.0 | 0.25 to 0.49 | n/a |
| 80 | curtains with (b) / (c) | 0 / 0 | 3.00 / 2.97 | 0.47 / 0.48 | n/a |
| 60 and 80 | everyone defends | 0 (30 defeats each) | 3.00 / 2.97 | 1.03 / 0.46 | |

**What that says, plainly.** Floor 20 is trivial and floor 40 nearly so (Reflect is data only; section 4). **Floor 60 is decided by the shell**: until a girl passes The End's gates no result reaches 10,000, and Megaton Press (one poll in four) KOs a girl each time; with the limit broken it is winnable (26 of 30). **Floor 80 is not won by any simple line, and nothing was tuned**: Chac acts about five times to each girl action (AGI 164 against the girls' 42 to 58) and loses the party in 15 to 30 seconds of game time (a Cataract unshelled, a Glare, a shatter). The sourced answer (Jegged's delay-lock, three Gunners, Samurai or Warriors, `research/re-ffx2-fallen-maesters.md` §2) is the one thing she is built to be beaten by (her special word allows it), and it needs Spherechange sequencing that no line here does. The Trema kit and ten Phoenix Downs do not change floors 60 and 80. **Options with numbers for Bailey** (his, if he plays it and wants floor 80 reachable): keep it a hard optional fight as the game has it; or seed the party with passed gates (so Break Damage Limit is on from the start, 26 of 30 on floor 60); or a delay-lock line first measured on the bench (not run).

## 7. ART NEEDS (nothing below exists on disk; no ComfyUI was run)

`public/art` was searched: **no painting fits any of the four** (the nearest in kind are Paragon, the hall's other boss, and Trema; the Angra Mainyu paintings are provisional and not approved). Used as they are, and said so: the Via Infinito plate `backdrops/via-infinito.png` (2688 x 1536, approved, Chapter XIII's), Paragon's idle and Paine's portrait as pause snapshots. Style reference for every item: **the approved Via Infinito set** (`characters/paragon/*`, `characters/trema/*`, the plate), the painted 2.5D look, facing left toward the party, a sidecar JSON each (`width`, `height`, `baselineY`, `pose`, `facing`, `nonBiped`). Sprite keys are `x2-aranea`, `x2-black-elemental`, `x2-concherer`, `x2-chac` (`src/data/fallen-maesters-ids.ts`); the presenter's placeholder draws until they are installed.

| Subject (key) | Poses (masters) | Size to ask for | Notes |
|---|---|---|---|
| **Aranea** `x2-aranea` | idle, attack (Spider Bite and Attack), cast (Gooey End), hurt; idle @2x | about 1150 x 815, non-biped, baseline near the bottom (Paragon's frame) | a spider the size of a cottage on the stone; the wiki ties it to a Maester of Yevon |
| **Black Elemental** `x2-black-elemental` | idle, attack, cast (Ultima, Flare, Magic Up), hurt; idle @2x | about 800 x 900 | small, black, floating, mirror-bright (its Reflect); the game draws it at twice its model size, so height waits for the stature read |
| **Concherer** `x2-concherer` | idle, attack (Megaton Press), cast (Gunk), hurt; idle @2x; **a second idle with the shell cracked** (the shell-break look) | about 1150 x 900, non-biped | a hermit fiend in a shell the size of a house; the cracked variant is the break's picture |
| **Chac** `x2-chac` | idle, attack, cast (Stony Glare, Cataract), hurt; idle @2x | about 1150 x 815, non-biped | a basilisk; a stone-dust effect belongs to the presenter, not the painting |
| the card | `pause/ffx2-fallen-maesters` (the pause hero plate; its fallback today is the Via Infinito plate) | the other pause plates' size | one of the four fiends, or the hall |

On install (the art lane's step, not this one's): the sidecars, a row for each subject in `tools/posescale/subjects.json`, the mirror's `manifest.json` rebuilt (`node tools/gen/manifest.mjs --root=<mirror>`) and `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table` (it is generated, never edited by hand). About 19 to 23 images with the @2x set (the preflight's count). No KO pose (all four die as pyreflies). Art route is the driver's (the Art Room, rule 12, Bailey alone approves a painting).

## 8. The story draft

`src/story/scripts/ffx2-fallen-maesters.ts`: **a DRAFT for Bailey to read before it ships** (FM6). A pre scene at floor 20; three seams (the fall of Aranea, the Black Elemental and Concherer: the glyph mends the girls, the next floor, the next fiend, about 14.5 to 15 s each, hands off); four callouts (the first Gooey End, Magic Up, Megaton Press and Stony Glare); a post scene (one sincere exchange for Paine, the joke restored, "the hundredth floor is still waiting"). Our own words over the sourced beats; the four people the wiki ties to the fiends are hinted at ("a Maester of Yevon", "a lord of the Guado", "a Grand Maester", "a summoner from a thousand years ago") and never named. `tests/unit/chapters/fallen-maesters-story.test.ts` (16) holds the lint, the cast, the rations, the triggers and the budgets.

## 9. Browser job specs (none run; predictions for the person who runs them)

All at 1600x900 and 390x844, `PYREFLY_BROWSER=gpu`, a production build, headless Chromium from node (the review-browser lock applies); the debug API (`window.__pyrefly`) may set the fiend's HP low (the Angra precedent) to reach the later links. Every prediction is from the engine tests, not from a browser.

| Job | Steps | Prediction |
|---|---|---|
| **J1 board** | type `infinito` on the board; also on a phone through the long-press field | party prep opens for "The Fallen Maesters", numeral EXP; the board still draws nineteen cards and "of 19 beaten"; the cursor does not move; nothing is written under any key |
| **J2 prep and pre scene** | read the prep card, Enter, play the pre scene | the hero art falls back to the Via Infinito plate; the tip box fits (about five lines); the pre scene is 11 lines over the plate with the bed `scene-bevelle-underground`; the last line starts the battle |
| **J3 floor 20** | first menu; defend through a Gooey End; then win | the boss strip names Aranea; the sprite is the procedural placeholder (one console WARNING per missing painting key, `[painted] ... using a procedural placeholder`, not an error; four keys x their poses); Poison, Stop and the two stat-down icons on all three girls; after the win a 15 s seam, then floor 40 opens with the girls at full HP and MP, a fallen girl up and no Save Sphere card |
| **J4 floor 40** | first menu; Ultima | the boss strip shows a Reflect status; Ultima takes about 9,999 off each girl (Rikku is KO'd); the pause screen reads "BATTLE 2 OF 4" |
| **J5 floor 60** | Megaton Press; a Charon with the limit broken, or the debug API | Press KOs a girl; the system message "Concherer's shell breaks!" appears once on a result of 10,000 or more; the boss's DEF reads 1 afterwards; floor 60's retry after a defeat opens floor 60 with the girls whole |
| **J6 floor 80** | Stony Glare, Attack on stone, Cataract | a petrified girl is stone-coloured; a blow on her removes her (Death and Eject, "destroyed"); the Cataract takes five stage icons off each girl; the fight is lost in 15 to 30 s on a plain line |
| **J7 defeat and retry** | defend through floor 60 | Defeat panel; RETRY goes back to floor 60, not to Aranea; on floor 20 RETRY goes back to party prep |
| **J8 pause and phone** | pause on each floor; 390x844 | the chapter tab with three objectives ("Get past Aranea", "Get past Concherer", "Defeat Chac"), the three snapshots resolve (the plate, Paragon's idle, Paine's portrait); on the phone the placeholder stands on the boss spot (1.05, 0, -5.8) clear of the command list and the intent slab hangs over it |
| **J9 console** | the whole run | no 404 other than the four fiends' missing painting files and their sidecars; no error |

## 10. Files and merge hot spots

New: `src/data/fallen-maesters-ids.ts`, `chapter-ffx2-fallen-maesters.ts`, `chapter-meta-ffx2-fallen-maesters.ts`; `src/data/ffx2/enemies/{fallen-maesters,fallen-maesters-abilities}.ts`; `src/data/ffx2/builds/fallen-maesters.ts`; `src/data/ffx2/monster-records/records-fallen-maesters.ts`; `src/data/ffx2/command-records/fallen-maesters.ts`; `src/battle/ffx2/ai/fallen-maesters-{a,b}.ts`; `src/app/screens/frontend/maestersDoor.ts`; `src/story/scripts/ffx2-fallen-maesters.ts`; the fixture `tests/fixtures/parity/ffx2/fallen_maesters_rows.json`; the helper `tests/unit/helpers/fallenMaestersDrive.ts`; seven test files (`chapters/fallen-maesters-{ai,data,engine,flow,story,bench}.test.ts`, `maesters-door.test.ts`).

Shared files touched (all additive; **likely conflicts with the other new-chapter lanes, in order**):
1. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-fallen-maesters'` (the first line of the union), `ListedChapterId` excludes it, `Chapter.number` gains `29 | 30 | 31 | 32` (**take the union with the other lanes' edits of the same line**). No line is added (399 of 400).
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts`: one item each. `src/app/screens/frontend/chapterDoors.ts`: one row and one import; `tests/unit/chapter-doors.test.ts`: the word list and the game list gain `infinito` (**union with the other lanes' words**).
3. `src/battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `command-records/index.ts`, `monster-records/records.ts`: registration lines. `monster-records/kill-rewards.ts` (four rows), `battle/ffx2/adapt/kill-rewards.ts` (`0x203b`), `tests/fixtures/parity/ffx2/kill_reward_rows.json` (four rows), `tests/unit/parity-ffx2-rewards-data.test.ts` (`0x203b` in its names), `data-ffx2-monster-records.test.ts` and `data-ffx2-command-records.test.ts` (the new rows are pinned by their own fixture), `audio-music-batch1-2026-10-10.test.ts` and `audio-music-batch2-2026-10-12.test.ts` (the aeon cue's chapter list, the table of beds and cues). The wide run found six more pinned lists, now updated: `critic/runner/lib/route-pure.mjs` (the critic route's door words, one row) with `critic-route-doors.test.ts` (12 words), the neighbour lists of `gagazet-door`, `yojimbo-door` and `summon-door` (each gains `infinito`), `chapters/experiment-flow.test.ts` (the three Maesters links are allowed to carry the no-card flag beside the Experiment's Act II and the Mirror tiers) and `ffx2-hit-reaction-wiring.test.ts` (the four bodies have no damage-clip frame counts yet: see section 13, item 5).
4. `src/battle/ffx2/adapt/stat-setter.ts`: two cases (DEF, MDEF).
5. `docs/CONTRACT-CHANGES.md`: the entry on top. **`CHANGELOG.md` and NOW.md are not edited** (the integrator writes the release entry; the lines are in section 12).

No source file added is over 400 lines (the longest, `data/ffx2/enemies/fallen-maesters.ts`, is 306); the file touched that is at the cap (`encounters.ts`, 399) gained no line. Two new test files are over 400 (the AI test 402, the door test 426), as many of the repository's tests are. `scenes/cloister-100.ts` is untouched.

## 11. Tests and checks

- `node node_modules/typescript/bin/tsc --noEmit`: clean. `node tools/orphans.mjs`: 24 orphaned of 2,253 modules, the same 24 as before, none of this lane's.
- This chapter's tests: **AI 25, data 51, engine 18, flow 10, story 16, bench 9, door 21 = 150**, all green, plus the pinned lists and fixtures of the shared tests named in section 10 (257 tests in the 15 files run together). The bench rows above are the 30-seed run.
- **The wide run** (667 files whose path contains `chapters/`, `ffx2`, `x2-`, `chapter`, `guide`, `tactic`, `story`, `scene`, `door`, `meta`, `canon`, `encounter`, `registry` or `parity`; 3 workers, about 75 minutes): 625 files passed, 24 skipped, 10 failed with 9 tests. **Seven were this lane's pinned lists (listed in section 10; fixed in the second commit), one a missing confidence word in the abilities file's header (fixed), and three were load timeouts or a key-timing flake that pass alone** (`chapters/omnis-bench`, `strategy-ffx2-bahamut`: 600 s timeouts under three workers; `valefor-door`'s two-words-in-a-row case: a letter gap over 2 s under load). All 14 files re-run after the fixes (415 tests) and the two timeouts alone (23 tests) pass. The full `npm test` (about 77 minutes) was not run.
- `node tools/critic-plan.mjs --paths <the shipped src files>` classes the change **DEEP** (the FFX-2 engine, the chapter registry and a new chapter are each a deep row): a focused review of the production candidate before a deploy, then live verification and the deep review on the live build. Not save-data class (`SaveData.ts` untouched). Ship it with the Keeper to share one deep review (the deploy cap).
- Each test file's new assertions were run against the real engine first (probes), not written from the note: the numbers in section 4 are what the engine produced.

## 12. CHANGELOG lines (FFX-2 only unless tagged; for the integrator's release entry)

- **FFX-2 only (new hidden chapter 30, "The Fallen Maesters", not on the board):** the Via Infinito's four fixed floor fights as four fresh fights in a row, opened by typing `infinito` on chapter select: floor 20 Aranea, floor 40 the Black Elemental, floor 60 Concherer, floor 80 Chac, the game's own rows and scripts, the Lv 99 party of Chapter XIII, the glyph between floors mending the party. The four fiends have no paintings yet (placeholders), the story is a draft, the music is a stand-in.
- **FFX-2 only:** Concherer's shell breaks on a single hit of 10,000 or more; Chac's Attack and Heaven's Cataract destroy a petrified girl; the Black Elemental wears a permanent Reflect (shown only: reflection itself is not built).
- **Both games (shared plumbing, nothing a player sees):** the FFX-2 script stat setter can store Defense and Magic Defense; four more rows in the kill-reward table.

## 13. Open questions (for Bailey, or for the RE session where it says so)

1. **Floor 80.** No simple line beats Chac in this engine (section 6). Keep it a hard optional fight, seed the party with passed gates, or measure the delay-lock first? (Bailey's call after he plays it; the bench is ready for a delay-lock line.)
2. **Break Damage Limit at floor 60.** The shell needs a result of 10,000 and the party starts unable to make one. As the game has it, or start with the gates passed?
3. **Reflect (RE).** Port `pp_reflect_redirect`: it changes floor 40 (and every Reflect in the game) and the fight's answers; until then the Black Elemental is easy.
4. **Item ids (RE).** Rune Bracer, Kinesis Badge, Mana Tonic, Tetra Gloves, Blessed Gem, Shining Gem and the Bribe slots, from `item.bin` and `accessory.bin`.
5. **Stature, action time, damage-clip frames, default placement (RE Q14, Q15 and the default `pos_` of the shared map).** They size the fiends on the stage, the move lengths, the hit-reaction length (`MONSTER_MOTION_SET` gains rows 69 to 0x1044, 221 to 0x1084, 232 to 0x109b and 239 to 0x1058 and `MONSTER_CLIP_FRAMES` their `[dmg1, hdmg1]` once the frame table is read; until then the engine's 2 s / 3 s window stands for them) and the target shares (`MAESTERS_SCENE`).
6. **The four paintings and the card (section 7)**, and the story draft's read (section 8): Bailey's, with the names option.
7. **Listing the chapter, the Oversoul versions and the Pilgrimage placement** wait for his word (FM2, FM7, FM11).
