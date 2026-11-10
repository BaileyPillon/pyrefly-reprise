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

## Records owed (for the release pipeline)

- **ACTIONS.md** (two rows, FFX only): hidden chapter 54 Gauntlet, stage 1 (the branch, T0 and T1; evidence: this note, `tests/unit/chapters/gauntlet-*.test.ts`, the fixture `gauntlet_rows.json`) and stage 2 (the chain, the party, the bench tool and tier 1, the Karma and Run Away seams; evidence: the bench table above, the A/B of 456 digests, `tests/unit/chapters/gauntlet-{cactuar-king,don-tonberry,jormungand,chain,bench}.test.ts`); no decisions of Bailey's.
- **DECISIONS.md / decisions.json**: the driver's calls GA1, GA2, GA3, GA8 and GA13 (stage 1) and GA4, GA5, GA6, GA9 and the stand-ins of GA10 to GA12 (stage 2), as taken above (his to overturn); no row of Bailey's own. **For Bailey (options, not a build): tier 1 cannot be placed in the 60 to 80 percent band by any lever tried** (stage 2, the bench section: leave it as the easy opening, or a stat estimate near 0.25, or fewer Phoenix Downs).
- **NOW.md**: the lane `ch-gauntlet` (stages 1 and 2 of 5 done; stage 3, tier 2, next); the findings F1 (Ribbon is no Death ward) and F2 (Evasion 255) belong in the bench notes; the tier-1 bench result (every act won every time).
- **CHANGELOG.md**: nothing yet (nothing ships from stage 1; the chapter is not registered).
- **CONTRACT-CHANGES.md**: stage 1 none; **stage 2 wrote its entry (2026-11-10)** for `FormulaKey 'kill-count'`, `FFXMemberBuild.kills` and `FFXCombatant.kills` (it is already in the file).
- **`docs/target/in-flight.json`**: add `ch-gauntlet` as in flight (FFX only).
