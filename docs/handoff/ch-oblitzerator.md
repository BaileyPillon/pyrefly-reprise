# The Oblitzerator and the Luca crane (a hidden FFX chapter, number 50, the word `blitz`)

**Branch `ch-oblitzerator`** (from `origin/main` `bc93b1fdd`, through the research note and the paper preflight `df11dc16b`, then the build), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX only** (AGENTS.md rule 14): the blitzball machine and the dock crane exist only in FFX (Chapter 4, Luca, between the blitzball final and Auron's return); CTB and the FFX status set and Trigger Commands. FFX-2 has no counterpart and nothing here applies to it (`oblitzerator-absence.test.ts` pins that no file of `src/battle/ffx2`, `src/data/ffx2` or `src/battle/ff7` names the chapter). The registry rows, the door row, the one menu row, the one setup call, the one trigger-table entry and the pinned lists are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status: built, hidden, played in a headless browser from the title to the results by real keys on both sizes (section 8), measured by scripted players over 200 seeds on two seed sets and two builds (section 6), no painting.** The chapter opens only by a typed word on chapter select. Listing it waits for Bailey's word. **The machine and the crane have no painting yet (section 7): the presenter draws its procedural silhouettes; the stage is the Mushroom Rock Road's plate standing in for the Number 4 Dock.**
Written 2026-11-09 by a Sonnet sub-agent of the release driver (wave 5b, FFX lane, program row 50).

Authority: Bailey, relayed by the driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (about 00:55 EST), 2026-11-09 "Keep going please with everything you were doing" and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 5 is the paper preflight's own recommendation or the bench's, "driver's call, his to overturn"; the alternative is written beside it.**

## 0. What changed against the preflight (read first)

1. **The build is the preflight, as written; one real piece of invention, flagged:** the Luca party (section 4). The note's "Threaten lands" is corrected (below), and one finding about the balls is new (item 3).
2. **Threaten fails on both** (the note read the byte 0 as "lands"; this repository's reading of a monster's Threaten byte is a success percentage, so 0 is immune, which is what Samurai Gamers says). Wendigo's byte is 100 and lands; the Guado Guardian's is 0 and does not. The data says `threatenChance: 0`; the note has a section 10 with the correction (`research/re-ffx-oblitzerator-crane.md`).
3. **FINDING: the Blind and Mute Ball's status does not outlast the swing on this engine.** The balls inflict Darkness, Silence and Sleep at chance 254 with duration code 1 (the record's own). The engine runs a counter before the end-of-turn tick of the attacker's own turn (`engine-end.ts#afterAction`: the reaction drain, then `onTurnEnd`), so a code-1 status the ball puts on the swinger ticks off at the end of that very turn (`status-add`, `status-tick` 0, `status-remove`; pinned in `oblitzerator-engine.test.ts`). **What stays is the ball's damage** (Blind Ball 80 to 100 on Kimahri, Mute Ball 55 to 75 on Lulu) **and nothing else**; Eye Drops and Echo Screens have nothing to cure, so no line, no bot and no guide sentence uses them (the bag keeps them: the preflight's bag). The guides advise the cures, which suggests the game's own order lets the status outlast the turn: **a live check is added to the note (section 8, item 6)**. The order is shared plumbing and nobody here changed it; the alternative (a counter that runs after the tick) is a shared-engine change for Bailey's yes.
4. **The Doze Ball is unreachable, proved four ways** (section 3).
5. **The crane line costs one Rush and nobody falls** (section 6): 13 decisions, 1.00 Rush, 0.00 balls, 0.00 KOs, 200 of 200, on two seed sets, at the shipped build and at the raw start records. The slog (no crane, with care) also wins 200 of 200 at the shipped build, in 31 decisions and 6.8 Rushes; the preflight predicted it would be hard, and it is not, at stop 3. At the raw start records it wins 41 percent.
6. **The move card does not follow the crane line** (section 11, open issue 2): the guide's NEXT line, the auto-battler and the tactic do; the card's top row is "Thunder -> Oblitzerator" (the slog), because the card follows a chapter's line only for the three chapters in `advisor-line.ts`.

## 1. Play it

1. From the title, reach the chapter-select board (any window, **the phone tier included: the chapter is painted 2D and not gated**). Type **`blitz`** (any case, letters at most 2 s apart; the board shows no hint). B, L, I and T are bound to nothing; **the last letter, Z, is `confirm`**, which the word claims, so it opens no card and starts nothing (the first word with a `confirm` as its last letter; `oblitzerator-board.test.ts` types it with a card selected and holds the Z down through the opening frames). The board opens the chapter's party prep itself, with no card and no sound before it. On a phone the long-press field on the "Chapter select" label takes the same word.
2. Enter starts the chapter: a pre scene (our draft, section 7), then the fight, the post scene and the results page. The party is **Tidus, Lulu and Kimahri** (no bench, no aeon: Yuna was taken at the docks), the Luca build (section 4). **Escape and Flee are off for everyone; Switch and Summon are not** (and do nothing with no bench and no Yuna). A defeat is the retry card.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

Six thousand HP, no Defense, **weak to Thunder** (x3/2), resists Fire, Ice, Water and Holy, not Armored. One move of its own and three reflexes; and a crane.

| What happens | What it does (the game's own scripts, RE 4) |
|---|---|
| its turn (AGI 1: once per about **5.8** of the party's actions) | **Blitzball Rush**: ten balls of power 4, **each at a member picked at random** over the living front line, 32 to 39 apiece at this build; **neither Protect, Shell nor Defend halves them** (damage type 0); a Cheer does. Nothing else, ever |
| it is hit by a command whose formula byte is **1** (a weapon blow, the physical skills, the Breaks, Spiral Cut) | **Blind Ball** on the attacker, one time in three (`GetRandomValue() mod 3 == 0`: **21,846 of 65,536**) |
| it is hit by a command whose formula byte is **3** (any spell, Lancet, Scan, a Fury, the status spells) | **Mute Ball** on the attacker, one time in three |
| formula byte 2 | **Doze Ball**: no player command has one |
| its HP falls under a third (strictly under 2,000) | AGI + 15 (1 to 16): its turn comes every **36** ticks instead of 84; under a twelfth (under 500) AGI + 10 more (26: 27 ticks); one step per hit |
| **the Crane row names it** | no more turns, no more counters (and the Crane row takes **15/16 of its current HP**) |
| the **crane** (65,535 HP, no turns, off the CTB bar, no part of the victory, absorbs Thunder, immune to the rest) | the first two Thunder casts (the player's own row 0x3043) are answered with a line; **the third powers it**; one **Thunder Fury** powers it at once; Thundara, Thundaga, the other Furies, Fire and a weapon do nothing |
| **Use crane** (Tidus's Trigger Command, **the first row of his menu**, from the start) | on the dark crane: a line, nothing else, the turn spent; on the powered crane: the Crane row on the machine (**5,625 off 6,000, 375 left**), the command leaves his menu, the crane cannot be named again |

Rewards: **580 gil, 36 AP (54 on an overkill of 600), an Elixir** (a certain drop), a Potion to steal (both rolls); the gear drop is not modelled (section 3). **The design fact:** the first-time player is meant to read the crane, not out-damage 6,000 HP; a fan who ignores it can still win.

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx-oblitzerator-crane.md` (the game's own files: monster files `m110` and `m133`, formation `cdsp02_00`, the Atel scripts run in the earlier lanes' interpreter; "RE n" in the files), tagged `[bytes]`, `[run]`, `[arith]`. The six rows are pinned **word for word** to the kernel fixtures `tests/fixtures/parity/ffx/command_records.json` and `command_status.json` (rows 0x600c to 0x600f, 0x6012 and 0x3102: type, flag words, damage class, rank, status chances and durations) by `tests/unit/chapters/oblitzerator-data.test.ts` (29 tests). **Rule 5:** every row of the chapter has accuracy formula 0 and is `canMiss: false`. The two scripts' tallies are the interpreter's: the counters 21,846 of 65,536 for each of Attack, Thunder, Thunder Fury, Scan, Lancet and Spiral Cut, **one draw per hit and no draw for a heal or a formula-0 command**, the speed-up lines at 2,000 and 500, the one-step-per-hit rule, the crane's count (`oblitzerator-ai.test.ts`, 30 tests).

**The Doze Ball is unreachable, four ways:** (1) the six rows of the kernel fixture with formula 2 are all monster moves (ids from 0x4000); (2) `formulaByteOf` reads no ability of the party's (above 300 of them) as 2; (3) no Overdrive is 2 (the physical ones are 1, the Furies 3); (4) a synthetic row of formula 2 does draw the Doze Ball (the branch is in the code and the data). Two guides say an Overdrive draws it; the files win; **live check (RE 8, item 1)**.

**Gaps, named (not invented):**
- **The gear drop** ("always one piece of gear": Lightningstrike or Piercing weapons, a Defense +3 percent armour) is not modelled: the ability codes 0x8026, 0x800B and 0x806A are not decoded and the loot record of `m110` is not in `loot/records.ts` (its digest is not in the repo), as for the Wendigo and the Spherimorph. The chapter pays the sourced fields: gil, AP, the Elixir, the Potion steal. The rare roll's second Elixir, Pilfer Gil 6 and the arena price 870 have no engine field.
- **The forced-action words of `m110` and `m133`** are not in the note (it gives the command list, not the word): both are 0 in the table, `[unsourced]` and unreachable (both records are immune to Berserk, Confuse and Provoke).
- **The Distill statuses** of the extra-immunity words (0x432E, 0x43EF) have no status of ours; Eject, Auto-Life, Doom, Scan, Shield and Boost are immunities of both. Immunity to "Slice" (a flag of the Oblitzerator's) has no flag of ours.
- **The Special 1 exit animation** (forced on the machine when the Crane row names it) and the two message rows ("The crane responds", "Crane activated") are not rows: the chapter's banners stand for them; the presenter has no exit pose request.
- **The party** is the Luca estimate (section 4); the bag, the gauges and the armour abilities at this point are not sourced. Nothing was tuned toward a result.
- **Which theme the battle plays, the field event that launches it and whether a wipe is a game over** (RE 8): not read; the formation sets no music; a defeat is the retry card.
- **The positions** (RE 2: party at (31, 0, -47), (1, 0, -62), (-29, 0, -47); the machine at (-1, 2.9, 25), the crane at (68.6, -2.9, -67.1)) are the game's; the stage's spots are estimates in its own units.

## 4. The party, and the one piece of invention

No preset of this repository stands at Luca (the earliest are the Ridge's and the Temple's). **`builds/luca.ts` is new and flagged: the game's start records (`START_RECORDS`, `[game table]`) moved 3/10 of the way to the Macalania preset (`[estimate]`), rounded down** (Luca is stop 3 of 10: Besaid 1, Kilika 2, Luca 3 ... Macalania 10; the Ridge's rule is the midpoint at stop 5). Tidus 709 HP, MP 24, STR 16, DEF 10, MAG 6, MDEF 6, AGI 13, Luck 18, EVA 12, ACC 12; Lulu 521 / 125 / 5 / 8 / 24 / 31 / 6 / 17 / 40 / 3; Kimahri 810 / 84 / 17 / 15 / 17 / 6 / 7 / 18 / 6 / 6. **The raw start records are the lower bound** and the bench runs both (`lucaBuildAt(0)`). Kits: Tidus Cheer and Haste (his start commands) and the Trigger Command from the formation; Lulu Fire, Blizzard, Thunder, Water and no Focus; Kimahri his spear alone (Lancet is a magic-formula command and the research names no skill of his); bag `[estimate]`: Potions 10, Phoenix Downs 2, Eye Drops 3, Echo Screens 3, Antidotes 2; a Fury gauge of a fifth for everyone (the Ridge's). **The levers if Bailey wants another difficulty, in order: the build fraction, the bag, the gauge. Never the machine's numbers.**

## 5. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick (built) | Alternative |
|---|---|---|---|
| OB1 | number and word | **50, `blitz`**, not listed (the door pair test passes on this base against all 29 words; the last letter Z is a `confirm` the word claims) | `oblitzerator` (fails the pair rule five ways) |
| OB2 | party | **Tidus, Lulu, Kimahri**, no bench | add Wakka (no source) |
| OB3 | build | **S3**: start records 3/10 of the way to Macalania; stop 0 reported as the lower bound | the Ridge's 1/2 rule (too strong for Luca) |
| OB4 | arena | **(c), the stand-in: the Mushroom Rock Road's plate and scene** with the machine in front and the crane at the right (`scenes/luca-dock.ts`; it happens to carry a painted crane), 0 new plates | (a) a new `luca-dock` plate; **(b) the plate plus a two-state crane overlay (the preflight's recommendation, owed a mockup before it is built, rule 9)** |
| OB5 | the looks | **procedural silhouettes** until Bailey's art; the list is section 7 | a repaint of an existing machine (none fits) |
| OB6 | Doze Ball | **follow the files**: the branch is dead; the guide says nothing of it | implement "Overdrives draw Doze Ball" per two guides (not the files) |
| OB7 | the crane's wake | Thunder x3 or one Thunder Fury, **the exact commands** | any Thunder-element hit (not the files) |
| OB8 | counters | the file's rule, hidden (1 in 3, no tell); the guide teaches it | an on-screen tell (not faithful) |
| OB9 | music | scene bed `scene-gagazet` (the road's, as the Gui chapter uses on this plate), battle cue **`battle-ffx`**, victory `victory-ffx`: **flagged stand-ins** (rule 13); the audition-page entry is owed | `boss-seymour`, the louder alternative; a new take |
| OB10 | start and flee | Normal; Escape and Flee off | none |
| OB11 | rewards | the file's loot (580 gil, 36 AP, Elixir; gear not modelled) | none |
| new | Use crane's place | **Tidus's menu as a Trigger Command row, first in the list** (the UI puts trigger rows first, as the game's Talk is first), enabled from the start | greyed until the crane has power (the game keeps it available and "does nothing" until then, so it stays available) |
| new | the banners | six `script-trigger` callouts, one line each, our words: Tidus's first turn, the crane's two answers and its waking, Use crane while dark, the machine lifted | none (the game has scenes; we have banners) |
| new | the card and the page | **built**: the registered tactic (`engine/tactics/oblitzerator.ts`) with its guide card and page: five rules, eight hints, two phase notes and a boss page (HP 6,000, the Rush, the balls, the crane, the strategy in five steps, Steal and Drops as the data pays them) | the generic card alone |
| new | the coach's line | **no turn-order line** (Auron is not in the party; the line is Auron's voice) | none |

## 6. Difficulty: measured, not tuned (rule 15)

`tests/unit/chapters/oblitzerator-bench.test.ts` (8 always-on, 1 behind `OBLITZERATOR_BENCH=200`), the harness `tests/unit/helpers/oblitzeratorBot.ts` and the tool `node --experimental-transform-types tools/oblitzerator-bench.mjs --seeds 200 [--from 1001] [--stop 3|0] [--lines ...] [--tactic]`. **No boss number was touched**; the levers are the build and the bag. A *line* is a scripted player that reads only what a player reads and never the script's counters. The preflight's target (a tutorial-grade fight): the **crane line at least 95 percent**; the slog and the naive line are reported, not tuned.

**The table of record, 200 seeds a cell, no god mode, the shipped build (stop 3), seeds 1 to 200 / seeds 1001 to 1200:**

| Line | Wins (1 to 200) | Wins (1001 to 1200) | Decisions (median) | Rushes a fight | Balls a fight | KOs a fight |
|---|---:|---:|---:|---:|---:|---:|
| careless (Attack with everyone) | **0** | 0 | 22 | 4.70 | 7.64 | 3.00 |
| naive (no crane, Lulu's Thunder at the machine, no care) | **55 (27.5 %)** | 50 (25 %) | 20 | 4.70 | 6.66 | 2.47 |
| **slog** (no crane, Potions and Phoenix Downs) | **200 (100 %)** | 200 | 31 | 6.79 | 6.83 | 0.07 |
| **crane** (Haste on Lulu, Thunder x3, Use crane, swing) | **200 (100 %)** | 200 | **13** | **1.00** | **0.00** | **0.00** |
| crane, no care | 200 | 200 | 13 | 1.00 | 0.00 | 0.00 |
| crane, no Haste | 200 | 200 | 17 | 1.04 | 0.00 | 0.00 |
| wrong spells (Fire, Blizzard, Water at the crane) | **0** (it never wakes; 14 Rushes) | 0 | 132 | 14.41 | 0.00 | 4.84 |
| no Thunder, no crane (swing; Lulu hits with her staff) | **19 (9.5 %)** | 19 | 47 | 11.05 | 11.76 | 4.54 |
| **tactic** (the shipped line through the generic ladder) | **200 (100 %)** | 200 | 13 | 1.00 | 0.00 | 0.00 |

**The lower bound, the raw start records (stop 0), seeds 1 to 200:** crane **200 of 200** (11 decisions), tactic 200, **slog 82 (41 %)** (37 decisions, 9.5 Rushes, 3.3 KOs), naive 0, careless 0, no Thunder 0, wrong spells 0.

**What that says, plainly.**
1. **The prediction held for the crane line** (5 to 7 party actions, one Rush, nobody falls): it wins every fight on both seed sets and on both builds, in 11 to 13 decisions, and the Haste on Lulu only makes it 4 decisions shorter. The target (95 percent) is met with room, and no lever was needed.
2. **The prediction was wrong about the slog.** The preflight guessed it meets the speed-up and is a slog "against a machine that doubles its pace"; at the shipped build it wins 200 of 200 with care in 31 decisions, because Lulu's Thunder is 454 to 513 against a weakness and Kimahri and Tidus hit for 150 to 190, so about eight rounds end it, and the Potions cover the 6.8 Rushes. **Without care or the Thunder it loses most fights** (naive 27.5 percent, careless 0): the Rush's ten balls and the speed-up are not forgiving to a party that does not heal. At the raw start records the slog is a coin toss (41 percent).
3. **A Silenced Lulu is not how the crane line slips** (the preflight's third prediction), because no status outlasts the turn it lands in (section 0, item 3), and nobody swings at the machine in the crane line anyway.
4. **The only way the crane line fails is not waking it:** Fire, Blizzard or Water at the crane do nothing, the line never gets its Use crane, and the party Defends into 14 Rushes (0 of 200).
5. **A fight takes 0.03 s of engine time.** The bench takes about 80 s for 200 seeds of nine lines.

**Disclosed, not nerfed.** The fight is the game's tutorial: an informed player wins it with one Rush taken. A player who ignores the crane wins about a quarter of the time with Thunder and no care, and always with care at the shipped build. Nothing was tuned; if Bailey wants it harder, the levers are in section 4.

## 7. Stand-ins and what is a draft (listed)

| What | State |
|---|---|
| **The Oblitzerator's and the crane's paintings** (`characters/oblitzerator/`, `characters/luca-crane/`) | **none exist**: the presenter reads the art manifest and draws its procedural silhouettes silently (the smoke saw no console error and no 4xx or 5xx: the placeholder asks for no file) |
| The stage | the Mushroom Rock Road's plate and scene (a sea-cliff road with a crane and a cage painted in it), the party on the road's three slots (held), the machine at `[0.9, 0, -2.6]` (2.8 tall), the crane at `[4.8, 0, -4.2]` (4.6 tall, left of the HUD's rail: seen at 1600x900 and 390x844); both heights are `[estimate]`s, no stature row exists |
| The story | a draft for Bailey to read (`story/scripts/oblitzerator.ts`: nine lines before, one of them a narration, five after, six one-line banners; "THIS IS A DRAFT FOR BAILEY TO READ"; the machine and the crane speak no word; every line ours, the game's three crane lines paraphrased not copied) |
| The music | existing cues by reference (OB9); Bailey's ears decide |
| The chapter card and thumbnail | `thumbnailKey` is the Ridge's card (`chapter-sinspawn-gui`); the chapter's own is owed and unused until the board lists the chapter |
| The pause hero `pause/ch50-oblitzerator` | not made; the pause tab falls back to the road's plate (`heroArtFallback`) |
| The painted effects (the balls, the sparks on the crane's arm, the lift) | may be drawn in code; none exist |
| The pyrefly lens band | the canon row is `unattested` (no source names pyreflies on the dock); the stage adds nothing |

### ART NEEDS (nothing below exists on disk; no ComfyUI was run, nobody generated art: rule 12, and only Bailey approves a painting)

Style reference: the approved boss sets in `public/art/characters` (`anima`, `yunalesca-1`, `spherimorph`: idle with `baselineY`, attack, cast, hurt, ko, each with `@2x` to `@4x` and a sidecar JSON), the painted 2.5D look, facing left toward the party. Retail references are allowed (hard rule 8 lifted 2026-10-18); the painting that ships must match the approved painted look.

| Subject (sprite key) | Poses | Notes |
|---|---|---|
| **The Oblitzerator** `characters/oblitzerator/` (`spriteKey` `oblitzerator`) | `idle`, `attack` (the Rush), `cast` (the balls it answers with), `hurt`, `ko` (the body stays: death animation "Boss"), `idle@2x` | a blitzball-throwing machine with a cannon arm; **5 poses plus @2x to @4x**, each with a sidecar; a row each in `tools/posescale/subjects.json`; the mirror's `manifest.json` rebuilt; `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table` (generated, never edited). The preflight's `exit` pose (lifted by the crane) has no request in the presenter: a hook is the engine's to add if Bailey wants it |
| **The crane** `characters/luca-crane/` (`spriteKey` `luca-crane`) | `idle` (dark), `attack` (the lift, with sparks on the arm), `idle@2x` | a dock crane; the powered state is a pose the presenter cannot switch on a flag today: `attack` plays on the lift. The preflight's recommended overlay with two states (dead, powered) needs a presenter hook on `oblitzerator.crane` |
| the portraits | two, cut from the idles | the CTB tiles (they show "O" today) |
| the pause hero `pause/ch50-oblitzerator` | one | the machine and the crane on the dock |
| the card `chapter-oblitzerator` and its thumbnail | two | unused until listed |
| a dock plate (optional, OB4 (a) or (b)) | one (`backdrops/luca-dock`, with a 2x and a depth map) | the Number 4 Dock: a warehouse wall, containers, the crane at the right, a ramp ahead; **the scene key IS the file name**, so `SCENE_BACKDROP_FILE`'s row (`src/data/art/artNamespace.ts`) is removed when it is installed, and the scene needs its own factory instead of the derivation (`scenes/luca-dock.ts`, as the Wendigo's plate row went) |

**Count: 5 + 2 poses + @2x + two portraits + pause hero + card + thumbnail = about 12 required images** (+1 optional plate), plus three short effects drawn in code. Art route is the driver's (the Art Room).

## 8. Browser job specs, with predictions (written first; what the run said beside each)

Headless Chromium from node, `PYREFLY_BROWSER=gpu`, a dev server on a port of its own (5452, started and stopped by its PID), the machine-wide browser lock (`tools/rig-record-lock.mjs`); `node tools/oblitzerator-smoke.mjs` plays them all. The party's HP is kept up by a state edit through the debug API (said so); **every command is a real key press**. Screenshots committed: `docs/screenshots/ch-oblitzerator/` (`desk-*` at 1600x900, `phone-*` at 390x844, touch).

| Job | Prediction | The run |
|---|---|---|
| **J1 the board and the word** | the board draws nineteen cards and none for the chapter; typing `blitz` opens party prep for "The Oblitzerator" (numeral EXP), Tidus, Lulu and Kimahri in front and nobody on the bench; the Z, a `confirm`, starts nothing | **as predicted**: 19 cards, no card, party prep holds after the word (`desk-0-board.jpg`, `desk-1-party-prep.jpg`) |
| **J2 the pre scene and the first menu** | nine lines play over the coast road's plate; the first menu opens with the two silhouettes (the machine nearer and smaller, the crane tall at the right, both inside the rail), **Use crane the first row and selected**, Escape greyed, Tidus's banner line up; the guide card on the left is our page | **as predicted** (`desk-2-pre-scene.jpg`, `desk-3-first-menu.jpg`, `desk-3a-first-menu-clear.jpg`): the crane's foot is at about 0.7 of the width, the turn list from 0.86; **one thing the screen shows**: pressing Enter on Tidus's first turn opens Use crane, not Attack (the first row; section 11, open issue 3) |
| **J3 Use crane while dark** | a line ("still dark"), no damage, the key stays | **as predicted**: the machine on 6,000, the crane state 0, the callout raised (`desk-4-use-crane-dark.jpg`) |
| **J4 Lulu's Thunder at the Crane x3, by the menu** | Black Magic, Thunder, the target cursor walked to the Crane (the name chip reads "Crane"); the crane stays at 65,535; the answers and the waking come in order | **as predicted**: three casts, `thunders` 1, 2, 2 and the state 1 on the third, the callouts `responds-1`, `responds-2`, `powered`, no ball drawn (`desk-5-lulu-menu.jpg` to `desk-7-powered.jpg`) |
| **J5 Use crane on the powered crane** | the machine falls to 375 (5,625 off), AGI 16, lifted; Tidus's menu has no Use crane; the crane cannot be named | **as predicted** (`desk-8-the-lift.jpg`, `desk-9-lifted.jpg`): Tidus's menu is Attack, Items, Escape (the rows after the key is spent) |
| **J6 the win** | two blows end it with nothing answering; the results read 580 gil, 36 AP for each of three and an Elixir; no console error, no 4xx or 5xx | **as predicted**: "LUCA - THE NUMBER 4 DOCK - CLEARED, Victory, AP 36 x3, GIL 580, ITEMS Elixir" (`desk-11-results.jpg`); 21 checks pass, none fails, **no console error, no 4xx or 5xx, no missing painting listed** |
| **J7 a phone (390x844, touch)** | the scene has phone rigs; both silhouettes are in frame and the command grid covers neither; the intent strip carries the note's ranges for the Rush | **as predicted, and the same checks pass**: the strip reads "OBLITZERATOR 6TH Blitzball Rush SCRIPTED, random: Tid 33-38 / Lul 34-39 / Kim 32-37", which is the note's per-hit range for each (`phone-3a-first-menu-clear.jpg`); the fight plays to the results |

**What the runs found beyond the predictions:** (1) the card's NEXT BEST MOVE reads "Thunder -> Oblitzerator, most damage on the board" for Lulu: the move card does not follow the crane line (section 11, open issue 2); (2) Use crane is the first row of Tidus's menu and selected, so a press of Enter there opens it (the game's Talk is first too); (3) the target cursor opens on the machine for Thunder and walks to the crane with the arrow keys; (4) **not run (named):** a second seed through the whole fight, the Thunder Fury shortcut in the browser (the engine tests pin it), the Blind and Mute Balls in the browser (the engine tests pin them), the pause screen's chapter tab with the three objectives ticking, the board's long-press field on a phone.

## 9. Files and merge hot spots

New: `src/data/ffx/oblitzerator-ids.ts`; `src/data/ffx/enemies/oblitzerator.ts` and `oblitzerator-abilities.ts`; `src/data/ffx/builds/luca.ts`; `src/battle/ffx/ai/oblitzerator.ts`, `oblitzerator-rules.ts` and `luca-crane.ts`; `src/data/chapter-oblitzerator.ts` and `chapter-meta-oblitzerator.ts`; `src/engine/tactics/oblitzerator.ts`; `src/data/guides/oblitzerator.ts` and `src/data/guides/docs/oblitzerator.ts`; `src/scenes/luca-dock.ts`; `src/story/scripts/oblitzerator.ts`; `src/app/screens/frontend/blitzDoor.ts`; `research/re-ffx-oblitzerator-crane.md` and `docs/plans/ch-oblitzerator-review.md`; the tools `tools/oblitzerator-bench.mjs` and `tools/oblitzerator-smoke.mjs`; the helpers `tests/unit/helpers/oblitzeratorDrive.ts` and `oblitzeratorBot.ts`; twelve test files `tests/unit/chapters/oblitzerator-{ai,engine,fight,bench,data,door,board,absence,tactic,guide,scene,story}.test.ts` (the engine suite is two files to stay under 400 lines); the screenshots.

Shared files touched (all additive and inert elsewhere; **likely conflicts with the other new-chapter lanes, for the integrator, in order**):
1. `src/data/encounters.ts`: `ChapterId`, `ListedChapterId` and `Chapter.number` gain `'oblitzerator'` and `50` (the same three lines every lane edits: take the union; the file stays at 399 lines, no line added).
2. `src/battle/ffx/commands.ts` (+1 import, one more spread on the line that holds Move and Open lock: `...useCraneRows(ctx, user)`), `src/battle/ffx/ai/index.ts` (two imports and **one `TRIGGERS` entry**: `use-crane`; 337 lines), `src/battle/ffx/formation-commands.ts` (one import and **one call**, `applyLucaSetup(ctx, group)`, after the Flooded Ways' setup; 219 lines), `src/battle/ffx/kernel/forced-action-table.ts` (two rows).
3. `src/data/chapters-experiments.ts`, `src/data/chapter-meta-hidden-r76.ts`, `src/engine/tactics/index.ts` and `lookup.ts`, `src/data/guides/index.ts` and `docs/index.ts`, `src/data/ffx/enemies/hidden-ffx.ts`, `src/data/ffx/command-records/enemies.ts`, `src/app/screens/frontend/chapterDoors.ts` (the word `blitz`, the thirtieth of the table's rows), `src/engine/pyreflyCanon.ts`, `src/data/art/artNamespace.ts`, `src/scenes/experiment-scenes.ts`, `critic/runner/lib/route-pure.mjs`: one item each. `src/ui/coach/turnOrderLine.ts` has **no entry for this chapter** (Auron is not in the party).
3b. Pinned lists and fixtures: see section 10.
4. `docs/CONTRACT-CHANGES.md`: the entry on top. **`CHANGELOG.md`, NOW.md, ACTIONS.md and DECISIONS.md are not edited** (the integrator writes them; the lines are in section 12).

No source file added is over 400 lines (the longest, `luca-crane.ts`, is about 170).

## 10. Tests and checks

- `node node_modules/typescript/bin/tsc --noEmit` (TypeScript 7): clean. `node tools/orphans.mjs`: 24 orphaned of 2,598 modules, the same 24 as on the base, none of this lane's (the tactic, the card, the page, the scene, the door and both scripts are reachable).
- **This chapter's tests, all green: 150 run and 1 skipped (the 200-seed table behind `OBLITZERATOR_BENCH`)** in twelve files: AI 30, engine 9, fight 16, bench 8 (+1 skipped), data 29, door 6, board 13, absence 7, tactic 11, guide 8, scene 7, story 6. The AI file runs the interpreter's tallies through the real script (the counters 21,846 of 65,536 on six commands with one draw each and none for a heal; the speed-up lines at 2,000 and 500; the crane's count; the Use crane handler), the engine and fight files run the real engine (the opening, the Rush, the counters through the damage path, the crane line to its end and the slog to its end on seeds 1 to 3, the Fury shortcut, the speed-up on the clock), the board file types the word with the real `Input` and the real board.
- **The pinned lists and fixtures the registrations touch** (one allowance each, nothing loosened): `audio-music-batch2` (the music table: +1 row), `data-ffx-command-records` (+`['oblitzerator', 6, 6]`), `parity-ffx-loot-data` and `parity-ffx-engine-loot-battles` (the two bodies join the no-record sets), `parity-ffx-isaaru-commands` (the groups that carry command disables), `r62-auron-turn-order-tip` (the no-line list), `scene-backdrop-file` and `chapters/exp-fayth` (the code-keyed and the hidden scenes), `engine/party-stature-chapters` (a hidden FFX chapter like the others), `parity-ffx-reach` (Use crane is a trigger row like Open lock) and the fixture `evrae-gaze-classes.json` (six rows: the class each record takes from its formula byte). `chapter-doors`, `critic-route-doors`, the older door suites, `chapter-numbers`, `strategy-guide`, `tactics-lookup` and the others of the Spherimorph's list passed unchanged (the door table is data; the pair-test allowance is `doors * 40 s`). `guide-doc` held my page to its 260-character blocks (three paragraphs were split).
- **The whole suite, in ONE run on the tree at `6309edd7f`** (`node node_modules/vitest/vitest.mjs run --maxWorkers=3`, 8,036 s, on a PC about twenty other vitest runs were sharing; a first full run was stopped by its PID after 25 minutes to fix the pins found by targeted runs): **2,173 test files: 2,138 passed | 3 failed | 32 skipped; 34,662 tests: 33,901 passed | 9 failed | 751 skipped | 1 todo.** Every failure explained:
  - `parity-ffx-reach` (1): **this lane's**: the hand-written reach-0 set has no Use crane (0x3102), whose table reach is 0; it is a trigger row like the Flooded Ways' Open lock and joins the test's `markers`. **Fixed, green.**
  - `re-parity-ai-evrae` (1): **this lane's**: the gaze-class fixture holds no row for the six new records (0x600c to 0x600f: class 2, formula 1; 0x6012 and 0x3102: class 0). **Six rows added, green** (the fixture's other readers, `last-summoning-records` and `re-parity-ai-merged-hooks`, pass).
  - `chapters/r78-boss-art-resolves` (7): **not this lane's, environmental**: it reads the installed art (the mirror `BOSS_ART_ROOT` names, else `public/art`), and this tree's `public/art` is the r64 mirror, which has no paintings of Spherimorph, Ultima Weapon, Omega Weapon or Nemesis. **With `BOSS_ART_ROOT` at the r78 mirror the file passes 10 of 10**; no file of this diff is art.
  After the two fixes the six files that read the fixture or the changed test (`parity-ffx-reach`, `re-parity-ai-evrae`, `last-summoning-records`, `re-parity-ai-merged-hooks`, `oblitzerator-ai`, `oblitzerator-data`: 219 tests) pass; **the whole suite was not run a second time** (8,000 s).
- `node tools/critic-plan.mjs --paths <the shipped files>` was not run in this lane (the driver runs it from the host); by the Keeper's and Wendigo's reading the chapter registry, the shared combat core and the FFX engine each class a change DEEP: expect review DEEP, focused before the deploy, live verification and the deep review after; not the save-data class. Ship it with the wave's other chapters to share one deep review (the deploy cap: two deploys while a deep review is owed).
- **Door words:** the program plan's `door-check.mjs` accepted `blitz` against the existing words; this tree's table of thirty rows (and `pilgrim`) is pinned by `chapter-doors.test.ts` and the older suites, which run the pair test for every pair of words, and by `oblitzerator-door.test.ts`.
- **Process slips of this lane (no harm):** several scratch scripts and the first chapter files (`blitzDoor.ts`, `chapter-oblitzerator.ts`, `chapter-meta-oblitzerator.ts`, `scenes/luca-dock.ts`) were written with a shell heredoc instead of the Write tool (the contents were then checked by `tsc`, the tests and `node --check`); two scratch files of this lane's own were removed with `rm -f`; the dev server on port 5452 was started with the tool's background mode and stopped by its PID.

## 11. Owed, open issues and questions for Bailey

- **Owed (built nowhere):** the machine's and the crane's paintings and the card art (section 7); a mockup of the dock plate with the two-state crane overlay (OB4 (b)), rule 9; the pause hero; the audition page entry for `battle-ffx` (OB9); the gear drop (section 3); the live checks of the note (RE 8: which ball an Overdrive draws, that the ten balls spread over the members in the game, the real party and bag at the dock, the music, that the AGI writes show as faster turns on the CTB bar, **and whether a ball's status outlasts the swinger's turn**).
- **Open issues found on the way (none is this chapter's rule, none was tuned around):**
  1. **The balls' status ticks off with the swinger's own turn** (section 0, item 3). The cures are therefore dead weight here; a reorder (a counter after the tick) would be a shared engine change.
  2. **The move card does not follow the crane line.** `engine/tactics/advisor-line.ts` lists three chapters whose card puts the line on top (`LINE_FIRST_CHAPTERS`: `ffx2-trema`, `isaaru-via-purifico`, `mirror-aeons`), each measured as a card that loses clearly to its line. Here the card's top row (Thunder at the machine) is the slog, which also wins 200 of 200, so the measured bar is not met and nothing was added to the shared list; the tactic feeds the guide's NEXT line, the intent tip and the auto-battler. Listing `oblitzerator` is one line and the driver's call.
  3. **Use crane is the first row of Tidus's menu and the cursor starts on it**, so a player who presses Enter on his first turn spends it on a no-op (it says "still dark"). The game's Talk is first too; a cursor that starts on Attack when the row is a Trigger Command would be a shared UI change.
  4. **The crane's powered state has no sprite switch** (a two-state overlay needs a presenter hook on `oblitzerator.crane`); the lift plays the crane's `attack`.
  5. **The stage's spots and heights are estimates**, read in a browser at 1600x900 and 390x844 (section 8); no stature row exists for `m110` or `m133`.
- **Questions for Bailey (at most three):** (1) **Is the fight too easy as measured?** The crane line wins 200 of 200 in 13 decisions and the slog wins 200 of 200 with care; nothing was tuned, the levers are in section 4. (2) Hidden behind `blitz` (this build) or listed on the board now? (3) The dock plate and the paintings: three concepts each are still to be drawn (OB4, OB5), rule 9.

## 12. CHANGELOG lines (FFX only; for the integrator's release entry)

- **FFX only (new hidden chapter 50, "The Oblitzerator", not on the board):** the blitzball machine and the dock crane at Luca, opened by typing `blitz` on chapter select: the game's own scripts (ten balls spread at random, a Blind Ball for a blow and a Mute Ball for a spell one time in three, a machine that runs faster as it is hurt) and the puzzle the game built around the crane (Lulu's Thunder three times wakes it; Tidus's new Use crane then takes fifteen sixteenths of the machine's HP). Tidus, Lulu and Kimahri on an estimated Luca build. The paintings and the dock are stand-ins, the story is a draft, the music is a stand-in.
- **Both games (shared plumbing, nothing a player sees):** six more rows in the FFX command-record table, a thirtieth door row, one more menu row beside Defend, one trigger-table entry, one setup call, and the pinned lists that read them.
