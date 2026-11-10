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
- **C2 Karma (formula 22).** **CLOSED in stage 2 (below).** The kernel is right: `saveCounter` x power for a target id below 0x12 (500 kills, power 100: 50,000), the fallback for any other. **SEAM C2 (named, not closed): the engine deals Karma no damage today** (the row carries formula `'none'`; a cast makes no damage event). To close it the stage that writes Don Tonberry's rules makes three additive edits: (1) `FormulaKey` (`src/battle/common/types.ts`) gets `'kill-count'` and `FORMULA_NUMBER` (`src/battle/ffx/adapt/command.ts`) `'kill-count': 0x16`, then the Karma row gets that formula (a CONTRACT-CHANGES entry: `types.ts` is a shared contract); (2) `hitInputOf` (`src/battle/ffx/adapt/hit.ts`, the literal `target: { id: 0xff, saveCounter: 0, ... }`) passes the target's party slot (below 0x12) and its kill count, both read by formula 0x16 only, so inert for every other row; the kill count has no home today (`FFXMemberBuild` has no field), so the build carries one (GA5: 500 each, an `[estimate]`) and the combatant keeps it; (3) the test `SEAM C2` flips on purpose.
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

## Stage 2 of 5: the chain, the party, the bench tool and tier 1 (Cactuar King, Don Tonberry, Jormungand) — DONE 2026-11-10

Game case: **FFX only** (as stage 1). The brief of this stage moved the chain skeleton, the party and the bench tool from stage 3 to stage 2; the group stage of the list above is therefore done for the nine acts, with the tiers built as a switch.

### What exists now (files)

| File | What it is |
|---|---|
| `src/battle/ffx/ai/gauntlet-rules.ts` | the battle layer's copies of the tier-1 combatant, script and row ids, and the two `state.flags` keys (`gauntlet.gotAway`, `gauntlet.tonberry.waypoint`); the later tiers add theirs |
| `src/battle/ffx/ai/gauntlet-cactuar-king.ts` | act 1: one draw `mod 6` (0 rest or, on the third rest roll, Run Away; 1 to 3 99999 Needles; 4 and 5 10000 Needles), and the counter (10000 Needles on every hit event) |
| `src/battle/ffx/ai/gauntlet-don-tonberry.ts` | act 2: four Waddles then the Attack, Voodoo with an aeon in the front line, Karma on the attacker while it walks in (the first hit after each Waddle is free) |
| `src/battle/ffx/ai/gauntlet-jormungand.ts` | act 3: the statue branch, `mod 3` with nobody petrified, `mod 4` with an aeon |
| `src/battle/ffx/ai/gauntlet-end.ts` | `gauntletOutcome(ctx)`: the Cactuar King's Run Away ends the battle as an `'escape'` ("it got away", GA9) |
| `src/battle/ffx/adapt/kill-count.ts` | `killCountInput(target)`: the two kernel inputs formula 0x16 reads (SEAM C2 of stage 1, closed) |
| `src/data/ffx/enemies/gauntlet-groups.ts` | the nine formations (`gauntletGroup(index)`), `GAUNTLET_GROUPS` (the tiers built), the chain flags |
| `src/data/ffx/builds/gauntlet.ts` | the party (GA4 and GA5) |
| `src/engine/tactics/gauntlet.ts` | the advisor's line for tier 1 (`lineWith`, `LineOptions`, `SHIPPED_LINE`); **not registered yet** (stage 5 adds it to `lookup.ts`/`index.ts`) |
| `tests/unit/helpers/gauntletDrive.ts`, `gauntletFake.ts`, `gauntletBench.ts` | the drive, the fake context for script tests and the bench harness |
| `tools/gauntlet-bench.mjs` | the bench table (made from `tools/dark-aeons-bench.mjs`) |
| `tests/unit/chapters/gauntlet-{cactuar-king,don-tonberry,jormungand,chain,bench}.test.ts` | new; `gauntlet-engine`/`gauntlet-data` updated (the seam flipped; the stand-ins) |

### The chain (preflight row 1, GA2, GA3)

Nine acts in three tiers of three (`GAUNTLET_ACTS` in `data/ffx/gauntlet-ids.ts`). Every act: `canEscape: false`, Normal start, the creature as `bossId`, the headline, the plate and music stand-ins. Act 1 is plain; **every act from the second on is a fresh fight** (`restoresPartyOnEntry`, `restoresAeonsOnEntry`: the party and every aeon whole, a fallen member or aeon up, statuses cleared; the bag, the gil, the gauges and the kill counts carry), a **retry checkpoint** (`checkpointOnEntry`) with **no Save Sphere card** (`noSaveSphereCard`); the last built act pays every act's spoils (`poolsChainSpoils`). The Ultima Buster's formation has four slots (body, Head, two Arms; the parts are `isPart`). **`GAUNTLET_TIERS_BUILT` (1 now) is the switch**: the chain ends at act `3 x GAUNTLET_TIERS_BUILT`, and only those formations are registered in `HIDDEN_FFX_GROUPS`, so nothing reaches a creature whose script is not written. Stage 3 sets it to 2, stage 4 to 3. Stand-ins (all named in `GAUNTLET_SPRITE`, `GAUNTLET_PLATE`, the music cue): `pterya`, `grothia`, `geosgaeno`, `sinspawn-gui`, `spherimorph`, `spectral-keeper`, `sanctuary-keeper` (Th'uban: the same model, RE n 0), `mortibody`, `ultima-weapon`, `ginnem` (Head), `gate-lock` (Arms); the plate is `zanarkand-dome` (the preflight's option (c)); the music is `boss-challenge`, `boss-yojimbo` for the last act (the Dark Aeons chapter's choice). Nothing here is final (rule 9, rule 13).

### The party (GA4, GA5, GA6)

`gauntletBuild` = `darkAeonsBuild` (row 34's party: Tidus, Yuna, Auron on the field, Lulu, Wakka, Kimahri, Rikku on the bench, **Switch open**: no formation changes the line-up) with two changes and no others (`gauntlet-chain.test.ts` pins that): **Auron's weapon has Piercing in place of Strength +5** (the one Piercing weapon) and **every member has 500 kills** (`FFXMemberBuild.kills`, GA5, flagged `[estimate]`). **GA6: Zanmato allowed**: Yojimbo and the purse are the preset's. The Death ward of stage 1's finding F1 is **not** added: the Ribbon holds a slot that Petrify and Confuse need; tier 2's bench decides (`deathproof` is the lever).

### The seams closed (the shared-file edits; CONTRACT-CHANGES entry 2026-11-10)

1. **Karma (SEAM C2).** `FormulaKey` gains `'kill-count'` (0x16 in `FORMULA_NUMBER`); `FFXMemberBuild.kills?` and `FFXCombatant.kills?`; `setup.ts` copies it (a conditional spread on the line that copies `guest`; the file stays at 399 lines); `hitInputOf` feeds the kernel `killCountInput(target)`, **the old constants (`id: 0xff, saveCounter: 0`) for any combatant with no `kills`**. The Karma row is now `formula: 'kill-count'`. Through the engine: 500 kills = 50,000, 1 kill = 100, 1,000 = 99,999 (the row's cap), none = 0 (`gauntlet-engine.test.ts`).
2. **Run Away (GA9).** The script sets `gauntlet.gotAway` as it performs the row; `engine-end.ts#checkEnd` reads `floodedWaysOutcome(ctx) ?? gauntletOutcome(ctx)` once the action is over and finishes the battle as an `'escape'` with the system line "The Cactuar King got away!"; nothing is paid, the King is alive. The flow retries an `'escape'` like a defeat: act 1 is the chapter's start, so the chapter starts over. **The withdrawal card (`app/screens/withdrawal.ts`) prints only the stalemate line today**; stage 5 teaches it this line (a small shared-UI edit, owed).

### Registrations in shared tables made in stage 2 (the integrator lists these; each a minimal add)

1. `src/battle/common/types.ts` (a contract file): `FormulaKey` += `'kill-count'`; `FFXMemberBuild.kills?`; `FFXCombatant.kills?` (CONTRACT-CHANGES, 2026-11-10).
2. `src/battle/ffx/adapt/command.ts`: `'kill-count': 0x16` in `FORMULA_NUMBER`. 3. `src/battle/ffx/adapt/hit.ts`: the import and `...killCountInput(target)` in place of the two constants.
4. `src/battle/ffx/setup.ts`: `kills` copied on the line that copies `guest` (no new line). 5. `src/battle/ffx/engine-end.ts`: the import and `?? gauntletOutcome(ctx)` on the scripted-outcome line.
6. `src/battle/ffx/ai/index.ts`: one line importing the three scripts. 7. `src/data/ffx/enemies/hidden-ffx.ts`: the import and `...GAUNTLET_GROUPS` in `HIDDEN_FFX_GROUPS`.
8. Shared tests that learned the chapter (each extended, none loosened): `data-ffx-command-records` (the 0x16 test names Karma as its one row), `parity-ffx-loot-data` and `parity-ffx-engine-loot-battles` (the twelve combatants carry their own loot records, outside the 43 files of those oracles).

**Inert for every other chapter, proved by running** (`ab-hash.mjs` and its two outputs in the stage folder): the A/B of seeded event-log hashes of **every other FFX chapter and formation** against the base commit `8e82fd2e7` (a `git archive` of its `src`, run by plain Node): the 12 listed FFX chapters through their whole chains and the 64 other formations of the data layer against the endgame party, 3 seeds, 2 policies (attack the first foe; cycle through the enabled rows), **456 digests, identical on both sides** (equal md5). `tests/unit/ffx-engine-golden.test.ts` 18 of 18 and the shared parity suites pass unchanged.

### Tier 1: the rules, as the tests pin them (RE n 3.7 to 3.9)

- **Cactuar King** (`mod 6` over 65,536 values: 32,769 99999 Needles, 21,844 10000 Needles, 10,923 rest; after two rests the third rest roll is Run Away; the counter is 10000 Needles on a random living member, not at the attacker, gated by `isCounterattackAllowed()` and "the attacker is not the King").
- **Don Tonberry** (no random draw decides a move: four Waddles with the waypoint 1 to 4 in `state.flags`, then the Attack; with an aeon in the front line Voodoo every turn from the first; Karma while `v4 < 4`, no aeon, and not on the first hit after a Waddle; `isCounterattackAllowed()` wraps the free-hit test, so a hit during a reaction does not spend it).
- **Jormungand** (no aeon, nobody petrified: `mod 3` 21,846 Attack / 21,845 Cold Stare / 21,845 Vorpal; a member petrified: Attack on it with no `mod` draw, the picker drawn twice with two or more statues; an aeon: `mod 4` 49,152 Attack / 16,384 Cold Stare, never the Vorpal; no counter).
- "An aeon is in the front line" is `aeonHoldsField` (Yuna's seven aeons, actors 8 to 14), the test every earlier script of the project uses; the Magus Sisters are not among them (the note's `AllAeons` may include them: unread, open).

### The bench (100 seeds a cell, `bench-s2-100.out.txt`; the harness is pinned by `gauntlet-bench.test.ts`)

| act | advisor | with Zanmato at every act | without Zanmato | careless | notes |
|---|---:|---:|---:|---:|---|
| Cactuar King | 100 | 100 | 100 | 100 | it acts 0.01 to 0.09 times a fight (200 seeds, the advisor's line and its ablations: the party is faster); its **counter** costs 1.42 party KOs a fight with the aeon shield, 1.91 without, 1.97 careless (200 seeds) |
| Don Tonberry | 100 | 100 | 100 | 100 | the sourced line (wait for the fourth Waddle) is **91 inputs, 0 KOs**; careless is 5 inputs and **4 KOs (4 Phoenix Downs)**; Zanmato lands in 99 of 100 and costs **about 456,000 gil a fight** |
| Jormungand | 100 | 100 | 100 | 100 | careless: 6.0 turns of 6.0 inputs over 100 seeds, so it never acts; Zanmato lands in 98 of 100 and costs about 457,000 gil |
| the chain of the three | 100 | 100 | 100 | 100 | no loss and no departure on any seed |

**The result: the preset wins tier 1 every time with every line**, which is the preflight's own prediction 1 (the area three are won by a careless line); no seed was lost, none got away, none unfinished. **The levers** (100 seeds a cell, `bench-s2-levers-final.out.txt`, `-fine.out.txt`, `-fine2.out.txt`): Evasion 0, kills 0 and Luck 20 with Evasion 100 move nothing (all 100, one careless King loss at the last); **the party's stat estimate is the only lever that moves a result, and it moves a cliff, not a slope**. Percent won, the advisor's line (no Yojimbo):

| stat estimate (share of the caps) | Cactuar King | Don Tonberry | Jormungand |
|---:|---:|---:|---:|
| 1 (the preset), 0.5, 0.35 | 100 | 100 | 100 |
| 0.25 | 96 | 100 | 100 |
| 0.2, 0.175 | | 100, 100 | 99, 98 |
| 0.165, 0.16 | | 100, 93 | |
| 0.15 | 88 (3 got away) | 14 | 91 |
| 0.125 | | 0 | 66 |
| 0.1 | 88 (3 got away) | 0 | 3 |

The careless line falls off earlier: at 0.35 it still wins the King and Jormungand but loses every Don Tonberry (each hit before the arrival draws a 50,000 Karma and a weaker party needs more hits; the cause is not traced further); at 0.25 it wins 6, 0 and 80; at 0.15 and below 0, 0 and 0. With Yojimbo called in at every act (`zanmato-all`) the three hold far better: at 0.25 99, 100, 100; at 0.15 89, 100, 99; at 0.1 89, 99, 99 (a landed Zanmato ends the act whatever the stats). **A cell inside the 60 to 80 percent band exists for Jormungand (0.125: 66), none was found for Don Tonberry (93 at 0.16, 14 at 0.15: the cliff lies between; a finer step could land one) and none for the Cactuar King (it holds 88 to 96 from 0.25 down to 0.1)**, so no single stat estimate puts the three acts in the band together. This is a result for Bailey, not a reason to touch a creature (rule 15). The options: (a) leave tier 1 as the arena's easy opening (the game's own area creations are its easiest, and the chain's weight is tiers 2 and 3); (b) a whole-chapter stat estimate near 0.15 to 0.25, which would move tiers 2 and 3 too (to be measured there); (c) a smaller Phoenix Down stock, which is what the careless line pays at Don Tonberry (4 a fight). The recommended pick is (a). **The shipped line calls Yojimbo in against none of tier 1** (`zanmatoAt: []`): a Zanmato route costs about 456,000 gil an act of the 1,500,000 purse for a fight that is won every time without him; the purse is for tier 3's long fights.

### Picks taken in this stage (the driver's call, his to overturn)

GA4 (the party, Auron's Piercing), GA5 (500 kills, flagged), GA6 (Zanmato allowed, not used at tier 1), GA9 (the King's departure is an `'escape'`, the act retried), the stand-ins of GA10, GA11 and GA12 (above), and the stage's own: `GAUNTLET_TIERS_BUILT` as the cut, the advisor's line for tier 1 in `engine/tactics/gauntlet.ts` (written now because the bench measures the shipped line), `aeonHoldsField` for "an aeon is in the front line".

### Findings of this stage

1. The King's damage is its counter, not its turns: it acts once in a hundred fights; each hit event it takes draws a 10,000 Needle (lethal to a 9,999-HP member), so the minimum is one KO per action that reaches it. The aeon shield moves a share of them onto the aeon (1.91 to 1.42 KOs a fight); an Overdrive (one hit event for many blows) is the sourced answer, and the preset's gauges are empty at act 1 (`no-overdrives` changes nothing).
2. Don Tonberry's cheap answers all cost something: waiting is 91 inputs, striking is 4 Phoenix Downs, Zanmato is 456,000 gil.
3. Jormungand never acts against a party that strikes (6 hits at the party's speed); its Attack cannot land on the preset (F2) and the Ribbon wards Petrify, so on the preset its script is invisible.

### What is LEFT (exact list)

1. **Stage 3 (tier 2):** the rules of Earth Eater (Reflect at set-up, Megaton Punch counter, the 100,000 line, the two-turn lie, Flare at itself), the Greater Sphere (the reply table, RE n 3.5, not run end to end), Catastrophe (the 80 percent transform, a second `forms` entry); `GAUNTLET_TIERS_BUILT = 2`; the tier's bench (and the Death ward lever: F1); the tactic's tier-2 rules.
2. **Stage 4 (tier 3):** Th'uban, Neslug, the Ultima Buster with its Head and Arms (the DEF/Armored write at targeting time, T0 C4; the Head's cycle); `GAUNTLET_TIERS_BUILT = 3`; the bench and the chain; the Zanmato budget of the purse.
3. **Stage 5 (integration):** the chapter (`ChapterId`, `Chapter.number` 54, meta, the door word, the shared tables), the scene and plate (GA11, owed a mockup), the story, the guide (Jegged citation), **registering `engine/tactics/gauntlet.ts` and `data/ffx/builds/gauntlet.ts`** (both orphans until then), the withdrawal card's "got away" line, the absence test, the door tests; the three `EXTRA_FORMATION_CHAPTER`-style shared lists need no entry once the chapter's chain reaches the groups (the loot tests already exempt the twelve combatants).

### What the next stage must know

- The shipped line's `zanmatoAt` is empty; tier 3's long fights list theirs, and `zanmato-all` is the bench's way to measure Yojimbo.
- `tests/unit/helpers/gauntletBench.ts#BUILT` and the tests read `GAUNTLET_ACTS_BUILT`; raising `GAUNTLET_TIERS_BUILT` is the only change that registers a tier's groups, and `gauntlet-chain.test.ts` ("only the tiers built are registered") must be updated with it (it pins 3 acts today).
- The scripts take the memory slots `gauntlet.cactuar.rests`, `gauntlet.tonberry.waddles` and `gauntlet.tonberry.freeHit` from `rtOf(ctx, id).ai`; a script test that wants a state sets them directly (see the three test files).
- The `intent`/preview code calls `chooseAiCommand` on a clone: the Cactuar King's rest counter and the Run Away flag are written on the clone only.
- Disk: D: 28 GiB free at the end; tsc and a test file run in seconds when the machine is quiet.

## Stage 3 of 5: tier 2 (Earth Eater, the Greater Sphere, Catastrophe) — DONE 2026-11-10

Game case: **FFX only** (as before; the kernel table row and the set-up hook are keyed by this chapter's ids, and the FFX-2 absence test still passes). `GAUNTLET_TIERS_BUILT` is **2**: the chain is **six acts**, and acts 7 to 9 are still not registered.

### What exists now (files)

| File | What it is |
|---|---|
| `src/battle/ffx/ai/gauntlet-earth-eater.ts` | act 4: the standing turn (a coin: Attack, or two Megaton Punches), the running total, the strict 100,000 line, the crossing hit that asks for nothing, the two turns down and Gets up, the Flare at itself |
| `src/battle/ffx/ai/gauntlet-greater-sphere.ts` | act 5: Spherimorph's machine with the bytecode's own answers (the four states, the turn, the reply table, the shift, the Doublecast gate) |
| `src/battle/ffx/ai/gauntlet-catastrophe.ts` | act 6: rest then cloud, the change below 4/5 of its HP, the three-turn cycle of the second form |
| `src/battle/ffx/ai/gauntlet-setup.ts` | the opening state: Earth Eater's Reflect, the Greater Sphere's first element; hung on `dark-aeons-setup.ts` by one line |
| `src/battle/ffx/ai/gauntlet-rules.ts` | (extended) the three ids, scripts, group ids, the move rows, the flag keys, `setArmored` |
| `src/engine/tactics/gauntlet.ts` | (extended) rules 8 to 10 of the line and their `LineOptions` |
| `tests/unit/chapters/gauntlet-{earth-eater,greater-sphere,catastrophe}.test.ts` | **84 new tests** (22, 46, 16); `gauntlet-bench` 7 to 16, `gauntlet-chain` 18 to 19, `gauntlet-data` 141 to 144 |
| `tests/unit/helpers/gauntletSphere.ts`, `gauntletSphereMatrix.ts` | the Greater Sphere's reply helper and the **literal reply matrix generated from the interpreter's run** (`gen-matrix3.mjs`, lane scratch) |

### The three scripts, as the tests pin them (RE n 3.3 to 3.5)

- **Earth Eater** (`m279`; the disassembly, with its returns, is the source; the `.c` dump elides them). Standing: a draw `mod 2` (32,768 each over 65,536): Attack on one member, or **two Megaton Punches**, the second queued behind the first as a free follow-up of the same turn (its target picked at once, the queue drops it if that member is gone). Every hit that does HP damage adds the action's `LastDamageTakenHP` (overkill included; an Overdrive is one event) to a running total and draws **one Megaton Punch** on a random living member; the hit that takes the total **strictly past 100,000** (`+1` at exactly 100,000 is still answered) knocks it down, **Armored off**, total back to 0, and **is not answered**. Down: its first two turns queue nothing (no draw), the third is **Gets up** on itself (Armored back on, total and counters reset); every damaging hit while it lies is answered by **a Flare it casts at itself**, which its Reflect (the record's start-up word 0x20, written by `gauntlet-setup.ts`) bounces onto a random party member (2,355 to 2,660 a member on the preset, tested on the real engine; never on itself). **Its bytes never test `isCounterattackAllowed()`**, so it queues its answers itself (the owner must be able to act, no reaction of its own waiting) and not through `react()`; nothing in the preset hits it from inside a reaction, so the difference does not show here (a test pins that a hit inside a reaction is still answered).
- **Greater Sphere** (`m281`): see the next section. Its turn: a draw `mod 100` every turn, below half its HP (strictly: 750,000) and under 50 a **Hydraulic Press** on the living front line without a second draw, otherwise a draw `mod 2`: Press or an Attack on a random member. **Above half it presses 50.00 percent of its turns (65,536 of 131,072 draw pairs), below half 75.01 percent (98,322 of 131,072)**, the interpreter's `3,221,815,296 / 2^32`.
- **Catastrophe** (`m277`): form 1 alternates a lost turn and **Toxic Cloud** on the front line (no draw at all); **its `onHit` transforms it the moment its HP is strictly below `maxHP x 4 / 5` (1,760,000)**: Armored off, Luck 30, **Agility 60** (from 34), the second painting, `v1` back to 0, **Transform** on itself as a free action and a `form-change` banner after the action's events (the pattern of Penance: it stays one form in the engine's sense, a second would turn its death into a transformation). Form 2 cycles **Toxic Spray on the living member with the most HP** (a tie is one picker draw), **Demi on the front line**, **Hundred Thorns on the front line**. It answers nothing else. Agility 60 is on the real clock (tested: more turns over the same ticks).

### The Greater Sphere's reply table, read end to end (RE n 3.5 had it "in outline only")

The note owed "about 2 hours with the Spherimorph harness". I adapted that harness (`t-sphere.mjs`, read only) to `m281`'s variables (`t-gsphere.mjs`, lane scratch) and **ran the real hook bytecode** for 20 commands in each of the four states and both signs of the damage (`t-gsphere.out.txt`). Nothing had to be left out: **every reply is certain**, and the disassembly agrees line by line. What the run says (and what the note had not):

- The four states are Spherimorph's (weak Fire/Ice/Thunder/Water, the other three elements and Holy absorbed, 16,384 of 65,536 each). The **player-side row `v7` is the -aga of the opposite element** (state 0 Blizzaga, 1 Firaga, 2 Waterga, 3 Thundaga) and the **monster-side row `v8` is Ultima, row 0x40F3, in all four states** (the Ultima Buster's own row, `ROW.ultima`; the record's command list names the player's Ultima 0x3053 instead, which the script never performs: the data lists both).
- **Magic:** absorbed -> **Ultima on the front line** (the **player-side -aga on the front line** when an aeon holds the field: the aeon alone); no element at all (Flare, Demi, Ultima) -> Ultima on the front line; the weakness -> **shift**. **Physical: it took damage and the command carries an element (a weapon's counts) -> Hydraulic Press on the front line; any other physical hit, a plain blow included -> Ultima on the front line. A physical hit never shifts it.** **Special** (Overdrives, Wakka's shots): absorbed -> Ultima; **healed -> Flare on one random member**; elemental -> shift; **otherwise Hydraulic Press on the front line**. Scan -> Ultima on the front line. The Doublecast gate and the gates (Threaten, no counter allowed, HP 0) are Spherimorph's. Not Spherimorph's: the answers themselves, the no-shift physical branch and the absence of banners.
- **For the party this means:** a plain blow of Tidus draws an **Ultima (about 900 each with the Sphere's MAG 102)** on all three; an Overdrive draws a **Hydraulic Press (4,687 each with Auto-Protect, 9,374 without)**, which kills whoever is below that.
- `tests/unit/chapters/gauntlet-greater-sphere.test.ts` pins the engine to the **literal interpreter table**: 20 commands x 4 states x the damage sign the kernel actually produced (Element Reels is a minigame shell here with no hit record: its reading, an elemental-free special even in a fire weapon's hands, is tested through the shared reader), the ten aeon cells, the shift tally, the gates, the Doublecast triple (nothing, Ultima, nothing).

### Registrations in shared tables made in stage 3 (the integrator lists these; each a minimal add)

1. `src/battle/ffx/ai/index.ts`: three imports on the Gauntlet line. 2. `src/battle/ffx/ai/dark-aeons-setup.ts`: one import and one line, `applyGauntletSetup(ctx, group)`, beside the Belgemine and Dark Aeons set-ups (a no-op unless the group is Earth Eater's or the Greater Sphere's). 3. **`src/battle/ffx/kernel/forced-action-table.ts`: six rows (0x0000, the record's word) for the six creatures built**; stage 2 had left the three of tier 1 out, and `tests/unit/parity-ffx-default-attack.test.ts` (which sweeps every shipped group) would have failed on them; it passes now. Stage 4 adds its creatures' rows. 4. `src/data/ffx/gauntlet-ids.ts`: `GAUNTLET_TIERS_BUILT = 2` (registers acts 4 to 6 through `HIDDEN_FFX_GROUPS`). **No contract file changed** (`docs/CONTRACTS.md` lists none of these), so no CONTRACT-CHANGES entry this stage.

**Inert for every other chapter, proved by running:** `ab-hash.mjs` (stage 2's script, unchanged) plays the 12 listed FFX chapters through their whole chains and the 64 other formations of the data layer, 3 seeds, 2 policies, once on `git archive 8e82fd2e7 src` (run by plain Node from `base/`) and once on this tree: **456 digests, identical** (`ab-base-s3.out.txt`, `ab-cand-s3.out.txt`, md5 `80e0a534059c9a73f38377bdeec2650d` both). `ffx-engine-golden.test.ts` passes unchanged.

### The bench (100 seeds a cell; `bench-s3-final.out.txt`, `bench-s3-100b.out.txt`)

`node --experimental-transform-types tools/gauntlet-bench.mjs --tier 2 --seeds 100 --lines advisor,careless,no-zanmato,zanmato-t2,... --chain`; the tool now takes `--tier N`, `--chain-acts` and `--deathproof <armour ability>`.

| act | advisor | Yojimbo against tier 2 | without Yojimbo | careless |
|---|---:|---:|---:|---:|
| Earth Eater | 100 | 100 | 100 | 100 |
| Greater Sphere | 100 | 100 | 100 | **66** (34 lost) |
| Catastrophe | 100 | 100 | 100 | 100 |
| the chain of the three (tier 2 alone) | 100 | 100 | 100 | 67 (33 lost at act 5) |
| **the chain of all six built** | **100** | 100 | | **59** (41 lost at act 5) |

**The result: the preset wins tier 2 every time with the advisor's line; only a line that never heals loses (the Greater Sphere, a third of the time).** What the lines cost (`cost-s3.mjs`, 100 seeds): Earth Eater **26 inputs and 1.0 member lost a fight** (one Megaton Punch; 12.95 Flares at itself, all on the party), careless 18 inputs and 5.8 members lost; the Greater Sphere **21.6 inputs, 15.0 Ultimas, 0.69 Presses, 0.36 members lost** (careless 14.6 inputs, 4.1 lost); Catastrophe **23 inputs and no member lost**, it hardly acts at all (0.82 Toxic Sprays a fight, no Toxic Cloud and no Demi: the party empties its 2,200,000 HP before its second turn comes).

**The line's rules, each by an ablation** (100 seeds; chain of the three unless said):

| rule | shipped | ablation | result |
|---|---|---|---|
| Earth Eater: only Auron strikes while it stands | on | everybody strikes (`no-eater-focus`) | wins 100 both; **1.95 members lost a fight against 1.01**, 23 inputs against 26 |
| Earth Eater: hit it while it lies down | on | wait out its two turns (`eater-wait`) | wins 100 both; **372 inputs and 7.7 members lost against 26 and 1.0**: waiting is the worse line, the note's "wait two turns" does not hold for this party (a Flare at itself is 2,400 a member, a blow on it lying is 70,000 or more) |
| the Greater Sphere: no Overdrive | on | Overdrives allowed (`sphere-od`) | **97 against 100** (3 chains lost at act 5: the gauges carry, the first Overdrive draws a Press that kills whoever is under 4,687); alone the same cell is 100 both, because the gauges start empty |
| an aeon as the shield against the Greater Sphere | off | on (`sphere-fodder`) | wins 100 both; 36 inputs against 22; no member lost, but slower; left off |
| an aeon as the shield against Earth Eater | off | on (`eater-fodder`) | 100 both; 44 inputs against 26, 17 punches on the aeon; left off |
| Yojimbo's Zanmato against tier 2 | none (`zanmatoAt` stays `[]`) | `zanmato-t2` | 100 both: not needed |

**The levers** (the advisor's line, 100 seeds a cell; `bench-s3-levers*.out.txt`). The **stat estimate** moves tier 2 along cliffs that are **not monotonic and not aligned**, because it scales Strength, Defense, Magic and Magic Defense together and the creatures' damage depends on them in steps:

| share of the stat caps | Earth Eater | Greater Sphere | Catastrophe | chain of the three |
|---:|---:|---:|---:|---:|
| 1 (the preset), 0.95, 0.9 | 100 | 100 | 100 | 100 |
| 0.88 | 100 | 95 | 100 | 95 |
| 0.87, 0.86, 0.85, 0.84 | 100 | **62** | 100 | **63** |
| 0.83 to 0.79 | 99 to 100 | 96 to 100 | 100 | 74 to 99 |
| 0.78 | 100 | 82 | 100 | 85 |
| 0.77 | 100 | 17 | 100 | 9 |
| 0.765 / 0.76 / 0.757 | 97 / 94 / 78 | 8 to 34 | 100 | 1 to 7 |
| 0.752 | **64** | 51 | 100 | 10 |
| 0.75 | 32 | **77** | 100 | 6 |
| 0.74, 0.72 | 16, 9 | 94, 97 | 100 | 3, 2 |
| 0.7 | 0 | 94 | 100 | 0 |
| 0.65 to 0.53 | 0 | 0 | 100 | 0 |
| 0.515 / 0.51 / 0.505 / 0.5 / 0.49 / 0.48 | 0 | 0 | 96 / **78** / **69** / 57 / 17 / 3 | 0 |

**A cell inside the 60 to 80 percent band exists for each act** (the Earth Eater at 0.752 and 0.755 to 0.757, the Greater Sphere at 0.84 to 0.87 and 0.75, Catastrophe at 0.505 to 0.51) **and for the chain of the three** (0.84 to 0.87: 63; 0.79: 74), but **no single stat estimate puts the three acts in the band together**, and tier 1 needs a quarter of the caps or less for its band (stage 2). This is a result for Bailey, not a reason to touch a creature (rule 15). The options: (a) leave tier 2 as the arena's middle: the preset wins it, and its weight is length (recommended); (b) a whole-chapter stat estimate near 0.85, which puts the tier-2 chain at 63 percent (the Greater Sphere the act that falls) and leaves tier 1 at 100 and tier 3 to be measured; (c) the armour lever below.

**Other levers.** **Deathproof in place of the Ribbon** takes Earth Eater's punch from 1.01 members lost a fight to **0.01** and costs tier 2 nothing (the numbers above are unchanged: 100 / 100 / 100, careless Sphere 66; the six-act chain 100 / careless 67), because Jormungand dies before it acts and the Ribbon's other wards matter at tier 3 (Th'uban's Rainbow, Slime, Toxic Cloud): **the party is not changed here; tier 3's bench decides**. **Deathproof in place of Auto-Protect** drops the Greater Sphere to **37 percent** (a Press is 9,374 without it: every wounded member dies; the Eater is unaffected), the one armour lever that lands near the band at tier 2 for a single act. **Phoenix Downs 0 or 5, Evasion 0 or 100: nothing moves** (Auto-Phoenix pays the one KO a fight; the creatures' Attacks are the only moves Evasion changes and they are rare). **Luck 0** slows the party (Earth Eater 37 inputs against 26, Catastrophe 32 against 23) and wins everything.

### Findings of this stage

1. **The Greater Sphere punishes specials, not magic** (the table above): an Overdrive is an elemental-free special and draws the Press. The carried gauges are why the chain loses what the act alone never does; the line bars Overdrives against it (rule 10).
2. **The Earth Eater is a pounding fight**: a Piercing blow or two takes the total past 100,000 with one punch, and the party then hits an unarmored creature for 70,000 to 99,999 a blow, at the price of 2,400 a member per blow. The note's "wait out two turns" costs 14 times the inputs.
3. **Catastrophe is length**: Armored form 1 divides Tidus's blows by three, Auron's Piercing ignores it, form 2 hardly gets a turn.
4. **The Ribbon swap for a Death ward is free through tier 2** (finding F1 of stage 1, now measured); whether it stays free is tier 3's bench.
5. **A gap in stage 2, closed here:** `tests/unit/parity-ffx-default-attack.test.ts` sweeps every shipped enemy for a forced-action word; stage 2 did not run it, so tier 1's three creatures had no row. Six rows now (0x0000, the record's word, `gauntlet_rows.json`).
6. **A wrong reading of mine, caught before the commit:** the first Greater Sphere data had the player's Ultima (0x3053, the record's command list) as the reply; the bytecode's `v8` is 16627 = 0x40F3 in all four states, confirmed by the run. The data lists both rows.

### Picks taken in this stage (the driver's call, his to overturn)

The Greater Sphere stays in the chain (nothing was left out: the table is certain); the Overdrive bar against it; Earth Eater: Auron alone while it stands, everybody while it lies; no aeon shield against either (the ablations lose on inputs); Yojimbo not used at tier 2; **the party unchanged, no Death ward** (the lever is listed with numbers); the second Megaton Punch as a queued follow-up (a `counter` event with cause `script` in the log); Earth Eater's answers not gated by `isCounterattackAllowed` (its bytes have none); Reflect as a 254-turn status like a cast one; the Transform row queued and the `form-change` banner after it; **a dying Catastrophe is left alone** (the bytes transform it on the killing blow too; presentation only) and its death handler's transform (reachable only by a death with no hit) is not modelled; Catastrophe's second painting is the first one's stand-in (`GAUNTLET_CATASTROPHE_FORM2_SPRITE`, `catastrophe-form-2` owed to the art lane); `GAUNTLET_TIERS_BUILT = 2`.

### What is LEFT (exact list)

1. **Stage 4 (tier 3):** Th'uban, Neslug, the Ultima Buster body, Head and Arms (the targeting-time DEF/Armored write: T0 C4; the Head's cycle; the body's counter `v10`); `GAUNTLET_TIERS_BUILT = 3`; their six `forced-action-table` rows (and the Head's and Arm's, if the sweep wants them); the tactic's tier-3 rules and `GAUNTLET_BOSS_IDS`; the tier-3 bench and the nine-act chain (the Zanmato budget of the purse, the Death ward lever against Rainbow/Slime/Toxic Cloud); update the pins that name six acts (`gauntlet-chain.test.ts` "only the tiers built", `gauntlet-bench.test.ts` harness test, `tierActs(3)`).
2. **Stage 5 (integration):** unchanged from stage 2's list, plus: the scene reads `gauntlet.earthEater.down` (the lying pose), `gauntlet.earthEater.total` (a gauge, if Bailey wants one), `gauntlet.sphere.state` (the element glow; the four colours are code), `gauntlet.catastrophe.form` and the `form-change` event; the withdrawal card's "got away" line; the absence test.
3. **Art list additions** (nothing is final): Catastrophe's second painting `catastrophe-form-2` (idle, attack); Earth Eater's lying and getting-up poses are already on the list (the scene swaps on the flag).

### What the next stage must know

- The scripts of tier 2 are the pattern for tier 3: one file a creature, the numbers at the top with their source, the state in `rtOf(ctx, id).ai` and the few flags the scene needs in `state.flags`, tests on a fake context (all 65,536 draws) and then the real engine, and a literal table from the interpreter where a reply matrix exists (the Greater Sphere's; Neslug's three states and the Ultima Buster's parts are the same kind of job). **Read the `.dis.txt`, not the `.c.txt`: the decompile elides the `return`s** (the Earth Eater's first reading from the `.c` had the crossing hit answered with a Flare; the disassembly has it return).
- `lineWith`'s new options: `fodderAt`, `eaterAuronOnly`, `eaterPound`, `odBarredAt`; the bench ablations `zanmato-t1`, `zanmato-t2`, `sphere-fodder`, `eater-fodder`, `sphere-od`, `no-eater-focus`, `eater-wait`. `zanmato-all` now means every creature the line knows.
- `playChain` and `chainRate` take the acts of the chain (`tierActs(n)`); `--tier N` on the tool plays that tier's acts and chains them alone.
- A chain test run takes seconds; the 100-seed tier table about 100 seconds; the whole lane about 20 seconds.
- The working tree is CRLF in places and LF in others; git normalises either; the Edit tool is safe.

## Records owed (for the release pipeline)

- **ACTIONS.md** (three rows, FFX only): hidden chapter 54 Gauntlet, stage 1 (the branch, T0 and T1; evidence: this note, `tests/unit/chapters/gauntlet-*.test.ts`, the fixture `gauntlet_rows.json`) and stage 2 (the chain, the party, the bench tool and tier 1, the Karma and Run Away seams; evidence: the bench table above, the A/B of 456 digests, `tests/unit/chapters/gauntlet-{cactuar-king,don-tonberry,jormungand,chain,bench}.test.ts`) and **stage 3** (tier 2: Earth Eater, the Greater Sphere read end to end from the bytecode, Catastrophe; the set-up hook, six forced-action rows, the tier-2 line and bench; evidence: the stage 3 section above, the interpreter run `t-gsphere.out.txt`, the A/B of 456 digests, `tests/unit/chapters/gauntlet-{earth-eater,greater-sphere,catastrophe,chain,bench,data}.test.ts`); no decisions of Bailey's.
- **DECISIONS.md / decisions.json**: the driver's calls GA1, GA2, GA3, GA8 and GA13 (stage 1) and GA4, GA5, GA6, GA9 and the stand-ins of GA10 to GA12 (stage 2), and the stage 3 picks above (the Greater Sphere in the chain, the Overdrive bar, Auron alone while Earth Eater stands and everybody while it lies, no aeon shield, no Death ward in the party, the second form's stand-in painting), as taken above (his to overturn); no row of Bailey's own. **For Bailey (options, not a build): tier 1 cannot be placed in the 60 to 80 percent band by any lever tried** (stage 2, the bench section: leave it as the easy opening, or a stat estimate near 0.25, or fewer Phoenix Downs). **And tier 2:** the preset wins it every time (100 / 100 / 100, the chain 100); a cell in the band exists for each act and for the tier-2 chain (0.84 to 0.87 of the caps: 63) but no single stat estimate serves tier 1 (a quarter of the caps) and tier 2 (above three quarters) together (stage 3, the levers table); the options are in that section.
- **NOW.md**: the lane `ch-gauntlet` (stages 1 to 3 of 5 done; stage 4, tier 3, next); the findings F1 (Ribbon is no Death ward; a Deathproof in its place is free through tier 2) and F2 (Evasion 255) belong in the bench notes; the tier-1 and tier-2 bench results (every act won every time by the advisor's line; the Greater Sphere 66 percent for a line that never heals).
- **CHANGELOG.md**: nothing yet (nothing ships from stage 1; the chapter is not registered).
- **CONTRACT-CHANGES.md**: stage 1 none; **stage 2 wrote its entry (2026-11-10)** for `FormulaKey 'kill-count'`, `FFXMemberBuild.kills` and `FFXCombatant.kills` (it is already in the file); stage 3 none (no contract file touched).
- **`docs/target/in-flight.json`**: add `ch-gauntlet` as in flight (FFX only).
