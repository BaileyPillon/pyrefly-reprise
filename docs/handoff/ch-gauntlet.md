# Handoff: the hidden Gauntlet chapter (lane ch-gauntlet; hidden chapter 54; FFX ONLY)

Branch `ch-gauntlet`, from `origin/main` `8e82fd2e7` (release 79 is live; `193f6aef4` is an ancestor), built 2026-11-09 in a sibling worktree. Authority (relayed by the release driver, verbatim): Bailey 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too" (every researched boss he never picked: hidden behind words, sourced numbers only); 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations."; 2026-11-09 "Keep going please with everything you were doing". Every pick below is **"the driver's call, his to overturn"**. Nothing deploys from this branch.

**Game case: FFX only** (rule 14). The Monster Arena and its creations are FFX content (CTB, the FFX monster files); FFX-2 has the Fiend Arena, a different system with different creatures. New logic lives in new files under `src/data/ffx` (and, in the stages to come, `src/battle/ffx`); `tests/unit/chapters/gauntlet-data.test.ts` pins that no FFX-2 source file names the chapter. The registrations in shared tables are data barrels, "both" in kind (CHK-020), additive and inert for every other chapter.

Plan: `docs/plans/ch-gauntlet-review.md` (the paper preflight, GA1 to GA13; read it with this note). Sources: `research/re-ffx-monster-arena-creations.md` ("RE n"). The shared ledgers (NOW.md, ACTIONS.md, DECISIONS.md, CHANGELOG.md) are **not touched here**: see "Records owed" at the end.

**The chapter in one line:** nine Monster Arena creations in the Calm Lands, one after another (Cactuar King, Don Tonberry, Jormungand, Earth Eater, Greater Sphere, Catastrophe, Th'uban, Neslug, the Ultima Buster with its Head and two Arms), the endgame party, a heal between acts, three releasable tiers of three; door word `gauntlet`.

## Stage 1 of 5: the branch, T0 (the engine checks) and T1 (data and loot) — DONE 2026-11-09

### What exists now

| File | What it is |
|---|---|
| `research/re-ffx-monster-arena-creations.md`, `docs/plans/ch-gauntlet-review.md` | the research note and the preflight, committed (local paths stripped) |
| `tools/gauntlet-rows-gen.mjs` | turns the research lane's record dump (`--rec <file>`, kept outside the repository) into the fixture; compares every dumped row with the kernel fixtures `command_records.json` and `command_status.json` and refuses to write on a difference |
| `tests/fixtures/parity/ffx/gauntlet_rows.json` | the fixture: 11 monster files (nine bodies, Head, Arm) with their stat record, loot record and arena price, and 46 move rows as decoded fields; **41 rows compared with the kernel fixtures, 0 differences**; 5 rows (Don Tonberry's Attack, Voodoo, Karma, Waddle and the Head's Special 1) taken from the kernel fixtures because the dump lists none for them (the monster record's command list is empty) |
| `src/data/ffx/gauntlet-ids.ts` | the chapter's ids (no imports): chapter `gauntlet`, number 54, door word, the nine creatures in act order, the parts, tiers, monster files, script ids, sprite keys, row ids |
| `src/data/ffx/enemies/gauntlet-records.ts` | the records, overkill thresholds, Zanmato and Doom bytes, **`ArenaPrice`** (`GAUNTLET_ARENA_PRICE`), immunity bytes, loot records (`FfxLootRecord`, item numbers) and steal pairs; the header carries every number with its source |
| `src/data/ffx/enemies/gauntlet-abilities.ts` | the **31 move rows** (`AbilityDef` + the game's command record word for word); the header tabulates them |
| `src/data/ffx/enemies/gauntlet.ts` | the 12 `EnemyDef` factories (nine bodies, Head, two Arms), `GAUNTLET_BODIES`, `GAUNTLET_PARTS`, `gauntletBody(id)` |
| `tests/unit/chapters/gauntlet-data.test.ts` | pins every number to the fixture (and the ten numbers of the note's table typed again as a second source) |
| `tests/unit/chapters/gauntlet-engine.test.ts` | the T0 checks C1 to C5 on the real engine |

### Registrations in shared tables (the integrator lists these)

1. `src/data/ffx/command-records/enemies.ts`: one import and `...COMMAND_RECORDS_GAUNTLET` in `COMMAND_RECORDS_ENEMIES`.
2. `src/data/ffx/enemies/hidden-ffx.ts`: one import and `...Object.values(GAUNTLET_ABILITIES)` in `HIDDEN_FFX_ABILITIES` (the 31 rows join the catalog; `attachCommandRecords` gives each its record).

3. `src/battle/ffx/ai/command-formula.ts`: one line in `FORMULA_BYTE_OVERRIDES`, `0x6018: 3` (Earth Eater's "Gets up.", a cleanse row of power 0 whose formula byte is 3; the same shape as Shinryu's Eraser).
4. `tests/fixtures/parity/ffx/evrae-gaze-classes.json`: 25 keys added (the game's formula class of each new row; additions only, `re-parity-ai-evrae.test.ts` requires the fixture to cover every shipped record).
5. `tests/unit/data-ffx-command-records.test.ts`: the row count (`['gauntlet', 31, 31]` in `ROWS_SINCE_KEEPER`) and 19 entries in `KNOWN_STATUS_DIFFERENCES` (Condemn and Gets up are cleanse rows that list none of the statuses they strip; Rainbow, Slime and Toxic Cloud carry the Curse bit in the record alone; Slime's Silence and Slow carry no duration byte), the same shapes the Dark Aeons' rows have.

**Inert for every other chapter, proved by running:** `tests/unit/ffx-engine-golden.test.ts` (every FFX chapter, the line, the whole chain; the hashes committed at the base) passes unchanged, 18 of 18; no shared engine or HUD file changed in stage 1 (the registrations are data barrels, the override is a table row for a record id that no other ability carries: the fixture row set for `re-parity-ai-evrae.test.ts` had no 0x6018 before). No formation was added, so no other chapter's battle contains a new row.

Not yet registered, left to the stages named: the formations (`HIDDEN_FFX_GROUPS`), the chapter (`ChapterId`, `chapter-meta`, the door), the scene, the story, the guide, the tactic, the AI scripts, the loot barrel. **`gauntlet.ts` has no importer in `src/` yet** (the tests import it): the group stage wires it (`node tools/orphans.mjs` will say so until then).

### The T0 checks (preflight section 3, rows 2, 5, 6 and 8): all four hold, one seam named

Output of the probes and the tests: `tests/unit/chapters/gauntlet-engine.test.ts` (36 tests). Numbers below are the engine's.

- **C1 formulas 22 and 23 and the flags.** Formula 23 (99999 Needles, power 51) is 509,949 on every variance draw; the row's cap bit makes it 99,999 in the engine (160 casts: 99,999 every time); formula 6 (10000 Needles, power 200) is a flat 10,000; formula 5 (Demi, power 4) 2,499 from 9,999; formula 8 (Hydraulic Press, power 15) 9,374 before Protect, 4,687 after; formula 4 (Convergence) 99,999. **No row of the chapter carries the random-spread bit (0x8000) and no row has more than one hit** (I read "finite-hit" as the hit-count byte), so every front-line cast deals exactly one hit to each of the three members (checked on nine rows) and the kernel's spread path is not used by this chapter. **Every one of the 19 rows the research note computed by arithmetic equals the engine's output on the preset**: Ultima 2,524 to 2,850; Contamination 2,707 to 3,057; Megaton 1,851 to 2,090 (Protect-halved); Slime 1,163 to 1,313; Hundred Thorns 728 to 822; Rainbow 781 to 882; Condemn 335 to 378; Cold Stare 146 to 165; the Vorpal 298 to 336; the Needles 10,000 and 99,999 (lethal to a 9,999-HP member); and so on (the test table has all 19).
- **C2 Karma (formula 22).** The kernel is right: `saveCounter` x power for a target id below 0x12 (500 kills, power 100: 50,000), the fallback for any other. **SEAM C2 (named, not closed): the engine deals Karma no damage today** (the row carries formula `'none'`; a cast makes no damage event). To close it the stage that writes Don Tonberry's rules makes three additive edits: (1) `FormulaKey` (`src/battle/common/types.ts`) gets `'kill-count'` and `FORMULA_NUMBER` (`src/battle/ffx/adapt/command.ts`) `'kill-count': 0x16`, then the Karma row gets that formula (a CONTRACT-CHANGES entry: `types.ts` is a shared contract); (2) `hitInputOf` (`src/battle/ffx/adapt/hit.ts`, the literal `target: { id: 0xff, saveCounter: 0, ... }`) passes the target's party slot (below 0x12) and its kill count, both read by formula 0x16 only, so inert for every other row; the kill count has no home today (`FFXMemberBuild` has no field), so the build carries one (GA5: 500 each, an `[estimate]`) and the combatant keeps it; (3) the test `SEAM C2` flips on purpose.
- **C3 a Flare cast at itself, bounced by its own Reflect.** Earth Eater with a Reflect status casting the party's own `flare` (0x3052, reflectable) at itself: 60 seeds, the 60 hits land on Tidus, Yuna and Auron (and never on Earth Eater, whose HP is untouched), 2,355 to 2,660 each, exactly the note's range. Control: without Reflect it hits itself for 6,985. **The Reflect status is data written at set-up** (`statuses['reflect']`, as the possessed Sisters' script does), not an immunity: Earth Eater's rules stage writes it.
- **C4 a DEF and Armored write at targeting time.** A script's `onTargeted` that writes DEF 255 and `armored` on the body is seen by the damage of the same action: Tidus's Attack on the Ultima Buster is 6,055 to 6,812 with the gate up, exactly a third of the 18,167 to 20,438 that DEF 255 alone gives, and 99,999 (the cap) with DEF 0 or with no write (the record's DEF 60); a spell (Yuna's Thundaga, 79,280 to 88,819) is untouched because the write is physical-only; `onHit` puts DEF 50 and not Armored back. The Arms' gate needs no engine seam.
- **C5 findings about the preset (nothing changed here).** See "Findings" below.

### Findings (for the bench stage and the integrator; each is in a test)

1. **F1: the Ribbon is no Death ward in this engine** (`types.ts`: Ribbon is Zombie, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, Doom; **not** Death, the Breaks, Curse, Delay, Eject). The preflight's section 4 ("a Death ward is already the Ribbon") and the note's line on Earth Eater are wrong for this engine: **Earth Eater's Megaton Punch (Death 100) kills the member it lands on** (Auto-Phoenix pays a Phoenix Down), and it answers every hit Earth Eater takes standing. `deathproof` on the armour stops it (tested: 30 casts, 30 survivals, each still hurts). That is a party lever for the build/bench stage, not a creature change.
2. **F2: Evasion 255 + Luck 60 makes the two accuracy-2 Attacks harmless.** Neslug's Attack (0x6000, byte 90) and Jormungand's (0x40BA, byte 150) never land on the preset (0 damage and 120 misses in 120 casts each; with Evasion 0 Neslug's lands 60+ times in 120). Same lever as Dark Ixion's blade.
3. **F3: Zanmato byte.** The note and the preflight say "3 on the area three, 4 on the Originals". The file says **Neslug is 3** (Cactuar King, Don Tonberry, Jormungand, Neslug: 3; the other five: 4). The data carries the file's bytes (`zanmatoLevel` 4 for Neslug).
4. **F4: Don Tonberry's Attack is power 20** (row 0x4062, the same row as Dark Valefor's), not the 16 the arithmetic (`calc-54`, "row not read here") assumed: Protect-halved it is 451 to 509 on a member, not 361 to 408. Voodoo is 2,049 to 2,314 a hit.
5. **F5: the party's physical hits are about 1.3 times the note's arithmetic.** Tidus's Attack on DEF 255 is 18,167 to 20,438 in the engine; the note's section 4 has 13,975 to 15,780 (its calc ignores the weapon's Strength bonus). The note's "hits to empty" for the Armored creatures and the Arms is therefore a little pessimistic; the capped cases (99,999) are unchanged. The bench measures.
6. **F6: Doom.** The extra-immunity word 0x301 is Scan, Eject and Auto-Life: **only Neslug (0x4301) is immune to Doom**; Cactuar King, Don Tonberry and Jormungand carry a Doom countdown of 200, the other five bodies 255, Neslug and the parts 3. The data carries `doomTurns` for every one (the engine throws on a Doomable enemy without one).
7. **F7: the parts' Distill immunity** (word 0x22F) has no status of ours; Scan and Auto-Life are modelled, Eject is (correctly) not in the word.

### Picks taken (the recommended column, the driver's call, his to overturn)

GA1 chapter 54, word `gauntlet` (id `gauntlet`); GA2 nine acts (Greater Sphere in); GA3 one chapter, three tiers; GA8 **the file's drops only**: the loot records are the engine's own format (item numbers; the kill-rewards roll is the game's), no x99 prize, `ArenaPrice` is data only (GA7: no gating, so it charges nothing); GA13 **`boss` flag on the nine bodies (Escape and Flee off)**, the parts carry none. GA4 to GA6, GA9 to GA12 belong to the stages that build the party, the chain, the act-1 retry, the art, the plate and the music.

### Deviations from the brief and the preflight

- The preflight's section 3 row 1 names `enemies/gauntlet*.ts`: done as `gauntlet-records.ts`, `gauntlet-abilities.ts`, `gauntlet.ts`.
- The preflight says "Th'uban ... Convergence kills one member": confirmed (99,999 on a 9,999-HP member; Shell does not save it).
- **Sprite keys are the art lane's own** (`GAUNTLET_SPRITE` in the ids module; none of the nine paintings exists). The group stage maps each to a stand-in painting in that one table; nothing in stage 1 renders.
- No Scan or Sensor text on any creature: all nine bodies are immune to both (the extra word's Scan bit, the flag byte's Sensor bit), so the panel prints "Immune to sensors." as Shinryu's does.
- The Ultima Buster's `battleDistance` is not set: the dump has no reach byte for it (the Gui chapter's Head had one from its own note). Open for the rules stage.
- Catastrophe is one `EnemyDef` with one form: its second form (AGI 60, Luck 30, not Armored, a painting change) is a rules write and a second `forms` entry that the rules stage adds.

### What is LEFT (exact list, in order of dependence)

1. **Stage 2 (T2: the AI and rules, tier 1 first):** the seven simple scripts (`battle/ffx/ai/gauntlet-*-rules.ts`, one file each, under 400 lines), their ids copied in the battle layer with a data test pinning the copies; Earth Eater's Reflect and knock-down; Neslug's shell; the Ultima Buster's gate and the Head's cycle; the Greater Sphere's reply table (about 2 hours with the Spherimorph harness: RE n 3.5, "not run end to end"); the **Karma seam (C2)**; Run Away's end of fight (GA9: a retry).
2. **Stage 3 (T3: the formations and the build, then the bench):** nine `EnemyGroupDef`s (Normal start, Escape and Flee off, the Ultima Buster with `parts`, music cues, the stand-in sprites), the party preset (row 34's endgame party with Switch open and one Piercing weapon, **plus a Death ward: F1**, and the kill count: GA5), the chain with a heal between acts, `tools/gauntlet-bench.mjs` copied from `tools/dark-aeons-bench.mjs`, 12 then 500 seeds with and without Yojimbo's Zanmato (GA6).
3. **Stages 4 and 5 (T4 to T7):** the scene and the plate (GA11, owed a mockup: hard rule 9), the art list below, story, guide, tactic, door word and the integrator's shared tables, the door tests.

### The art list for the art lane (nothing is final here)

Eight new creatures, about 5 images each (idle, attack, cast where it casts, hurt, ko or the state change) plus: Cactuar King (idle, Needles, hurt, leaves), Don Tonberry (idle, waddle, attack/Karma, hurt), Jormungand (idle, Cold Stare, hurt, ko), Earth Eater (standing, punch, **down**, getting up, hurt), Greater Sphere (idle, hurt, ko; the four element glows are code), Catastrophe (form 1 idle/cast, form 2 idle/attack, transform, hurt), Th'uban (the Sanctuary Keeper's painting recoloured: `characters/sanctuary-keeper`), Neslug (out, in the shell, broken shell, attack, hurt), the Ultima Buster (body idle, Ultima, hurt, ko; Head idle, attack; Arm idle, dead). Keys: `characters/<key>/<pose>.png` for the keys of `GAUNTLET_SPRITE`; backdrop `monster-arena`. The preflight's section 6 has the counts; sizes follow the repo's boss sets.

## Records owed (for the release pipeline)

- **ACTIONS.md** (one row, FFX only): hidden chapter 54 Gauntlet, stage 1: the branch, T0 and T1; evidence: this note, `tests/unit/chapters/gauntlet-*.test.ts`, the fixture `gauntlet_rows.json`; no decisions of Bailey's.
- **DECISIONS.md / decisions.json**: the driver's calls GA1, GA2, GA3, GA8 and GA13 as taken above (his to overturn); no row of Bailey's own.
- **NOW.md**: the lane `ch-gauntlet` (stage 1 of 5 done; stage 2 next); the findings F1 (Ribbon is no Death ward) and F2 (Evasion 255) belong in the bench notes.
- **CHANGELOG.md**: nothing yet (nothing ships from stage 1; the chapter is not registered).
- **CONTRACT-CHANGES.md**: nothing in stage 1 (no contract file changed); stage 2 owes the `FormulaKey` entry (SEAM C2).
- **`docs/target/in-flight.json`**: add `ch-gauntlet` as in flight (FFX only).
