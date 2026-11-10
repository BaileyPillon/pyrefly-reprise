# FFX Oblitzerator and the Luca crane (Number 4 Dock): records, formation and AI read from the game's own files

**Game case: FFX only.** The Oblitzerator (`m110`) and the dock crane (`m133`), formation `cdsp02_00`, exist only in FFX (Chapter 4, Luca, between the blitzball final and Auron's return). FFX-2 has no counterpart; nothing here applies to it. Written 2026-11-09 by a Sonnet sub-agent of the release driver (treeless research lane, program row 50 of `PLAN.md`). **Treeless: no repo file, engine, data, AI or art file was changed; nothing ran in a browser; no GPU.** Authority (relayed words, verbatim): Bailey 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please", "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

Companion: `docs/plans/ch-oblitzerator-review.md` (the paper preflight). Scratch: `t-obl.mjs` + `t-obl.out.txt` (the AI run), `calc-50.mjs` + `calc-50.out.txt` (arithmetic), `scan-f2.mjs` (command-row scan), `m110.dis.txt`, `m133.dis.txt`, `btl-cdsp02_00.dis.txt` (disassembly, for the next reader only; no script text goes into the repo).

**Tags.** **[bytes]** read from the game's own files (Steam build 25501027, unpacked read-only earlier, kept outside the repo, hard rule 8). **[disasm]** read from the Atel disassembly; no script line is reproduced. **[run]** the real bytecode ran in the small Atel interpreter of the earlier AI lanes (`sim2.mjs`, unchanged; the command-property reads of `t-keeper.mjs` added) against a mock battle with the real command rows; exact tallies over all 65,536 results of the shared random stream where a draw is involved. **[arith]** the repo's own kernels (`kernel/ctb.ts`, `kernel/damage.ts`, clean tree, read only): variance 240 to 271, no criticals. **[guide: Jegged / GG / SG]** a community guide, cited by name only (Jegged.com "09 Luca"; Gamer Guides "Oblitzerator" (HD); Samurai Gamers "Oblitzerator Boss Guide"; Game8 and Ludo.guide through a search summary), read 2026-11-09, nothing copied. **GameFAQs answered HTTP 403 to every automated fetch (tested again today) and the brief bars the browser, so it was not read; the Final Fantasy wiki answers 402.** The one conflict below is settled by the file, not by a tie-break. **[estimate]** ours.

## 0. The one-screen summary

- **Two monsters, one formation, one short battle.** `cdsp02_00` (area key 52, formation 0; the first monster slot is the Oblitzerator = actor 20, the second the Crane = actor 21). **Escape and Flee are disabled for every character; Normal start (3); fixed positions.** Three party entries and one aeon entry (unused: Yuna is not in the party). [bytes] [disasm]
- **The scripts are tiny.** `m110` holds **783 bytes** of code, `m133` **723**; the formation holds 8,205 bytes, **all of it camera work** except the five lines that set the rules. The plan's "187 KB" is the file size (model data).
- **Oblitzerator: 6,000 HP, DEF 0, MDEF 0, STR 16, AGI 1, weak to Thunder, resists Fire, Ice, Water and Holy, not Armored.** It has **one action of its own: Blitzball Rush** (10 hits of power 4, spread at random over the living front line), and **three counters**. It **speeds up** when hurt (AGI 1, then 16 below one third HP, then 26 below one twelfth). [bytes] [run]
- **The counters.** A hit by a **physical-formula command** draws **Blind Ball** (Darkness) on the attacker; a hit by a **magic-formula command** (any spell, Scan, Lancet, a Fury) draws **Mute Ball** (Silence) on the attacker; each with **exactly 21,846 of 65,536 (33.33 percent)**. The branch for formula 2 (**Doze Ball**, Sleep) **no player command can reach**: the guides' "Overdrives draw Doze Ball" is not in the files (section 4.3). [run] [bytes]
- **The crane is the fight.** The Crane (65,535 HP, absorbs Thunder, immune to the other four elements and to every status) answers the first **two** player-side **Thunder** casts with a "responds" line and **powers up on the third** (or at once on a **Thunder Fury**). Tidus then has the Trigger Command **Use crane** (it exists from the start, does nothing until the crane is powered, and says so). Used on the powered crane it hits the Oblitzerator for **15/16 of its current HP** (5,625 from full), switches off its turns and its counters, and the fight ends with the next hit. [run] [disasm]
- **Rewards:** 580 gil, 36 AP (54 on overkill), **Elixir** (a certain drop, x1; x2 on the rare roll), steal Potion, always one piece of gear (weapon Lightningstrike or Piercing, armour Defense +3 percent per the guides). No EXP in FFX. [bytes] [guide]
- **Sources agree with the files** on everything except Doze Ball and a status list (section 7).

## 1. The records [bytes]

### 1.1 Oblitzerator (`m110`)

| Field | Value | Note |
|---|---|---|
| HP / MP / overkill threshold | 6,000 / 10 / 600 | [guide: GG, SG, Game8 agree] |
| STR / DEF / MAG / MDEF | 16 / 0 / 0 / 0 | SG prints 1 for DEF, MDEF, MAG, AGI, Evasion, Luck (the file: 0, 0, 0, 1, 0, 0): the usual guide offset |
| AGI / LCK / EVA / ACC | 1 / 0 / 0 / 10 | tick speed 28 at AGI 1 |
| Flag byte +0x28 | 0x04: immune to Life | **not Armored**, not immune to Sensor or Scan-again |
| Flag byte +0x29 | 0x06: immune to Slice and Bribe | **not immune to CTB damage: Delay Attack and Delay Buster work** |
| Elements | weak Thunder; resists Fire, Ice, Water, Holy; absorbs and is immune to none | x3/2 on Thunder, x1/2 on the four |
| Status bytes | 255 (immune): Death, Zombie, Petrify, **Poison**, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, **Regen**. 0 (lands): the four Breaks, **Threaten**, Shell, Protect, Reflect, the four Nul, **Haste, Slow** | SG lists Threaten as immune: the file says it lands |
| Extra-immunity word 0x432E | Distill Power, Mana, Speed, Ability; Eject; Auto-Life; Doom. **Not Scan.** | |
| Commands (+0x50) | Blitzball Rush 0x600C, Doze Ball 0x600D, Blind Ball 0x600E, Mute Ball 0x600F, Crane 0x6012, Death 0x6013 | |
| Identity | monster word 0x106E, CTB icon 21, Doom byte 3, death animation "Boss" (the body stays), Tough and Heavy set (no recoil, no lift) | |
| Loot | gil 580; AP 36, overkill 54; slot 1 Elixir (common x1, rare x2; overkill x2 and x4), certain; steal Potion (both rolls); bribe Potion but Bribe is immune; gear always (14 ability rows: 0x8026 and 0x800B on the weapon rows, 0x806A on the armour rows); Zanmato level 3; Pilfer Gil 6; arena price 870 | the guides name the abilities Lightningstrike, Piercing, Defense +3 percent [guide: GG] |

### 1.2 Crane (`m133`)

HP 65,535, overkill threshold 65,535, **all stats 0 except EVA 100 and ACC 20**; Armored, immune to fractional damage, Life, Scan-again; immune to CTB damage, Slice, Bribe; **absorbs Thunder, immune to Fire, Ice, Water, Holy**; status bytes **255 on everything except Threaten (0)**; extra-immunity word 0x43EF (Scan, the Distills, Shield, Boost, Eject, Auto-Life, Doom). Command list: one row, **"Crane activated." 0x6015** (a message row, no effect). No loot, no gil, no AP. Identity: monster word 0x1085, CTB icon 20, Doom byte 99. The script writes: **no turns, not visible on the CTB bar, must-not-be-killed-to-end-the-battle (0)**, targetable. [bytes] [disasm]

## 2. The formation `cdsp02_00` [bytes] [disasm]

- **Rules** (the whole of the logic): Escape 0x3003 and Flee 0x3018 disabled for all characters; start type Normal; random positions off. Nothing else is disabled: **Switch and Summon stay** (there is no bench and no Yuna, so neither does anything).
- **Start positions** (chunk 3, one area): party (31, 0, -47), (1, 0, -62), (-29, 0, -47); **one aeon entry** at (1.1, 0, -47.5); **Oblitzerator (-1, 2.9, 25)** (in front of the party); **Crane (68.6, -2.9, -67.1)** (to the party's right and slightly behind: "a crane to your right"). Block bytes: voice 0, foot-sound bank 8, in-water 0. [bytes]
- **The "Use crane" command is added to character 0 (Tidus)**: the formation adds it at set-up (a type-2 worker, slot 41) and the Crane's own script removes it from character 0 when it is spent. On Tidus's **first turn** a scene runs once (scene A 2: Tidus points out the crane). [disasm]
- **Messages** (the game's own text, paraphrased here, not copied): the Crane's responses are one of three lines ("seems to respond"; the pair "we can use this crane" / "it's probably out of power" / "use that Thunder spell on it"). A banner text and a repeat hint are raised from the formation. The chapter writes its own lines. [bytes]
- **Music:** not set by the formation (the field launches the battle); the guides say nothing. **[unsourced]** which theme plays.
- **How the game launches the fight:** from the dock field event after Yuna is taken; not read.

## 3. The engine facts the scripts lean on [bytes] [note]

- **Hooks:** `m110` binds onTurn (f2), preTurn (f5, empty), onTargeted (f3), onHit (f4), onDeath (f6); `m133` binds onTurn (f2, empty), onTargeted (f3), onHit (f4). [run: tags]
- `findMatchingChr` here is called with the "all matching" selector and the script then targets **`-16`, the whole matched set**, not the one actor the call returns. With a **random-spread command** (misc bit 15; Blitzball Rush has flags1c 0x8006) the target builder picks, **for each hit, one living member of the set** (`research/re-ffx-targeting.md` section 1). This is why the guides say it "randomly hits all party members". [run] [note: re-ffx-targeting.md]
- Counters follow the engine's rule: **one answer per command per target**, armed by any HP or MP result (`re-ffx-targeting.md` G10).
- **Recovery uses the actor's current Agility** (`re-ffx-ctb-status.md`: `tickSpeed(current AGI) * rank`), so the script's AGI writes do speed it up from its next action on. [note]

## 4. The AI [disasm] [run]

### 4.1 Oblitzerator, onTurn

When it is not ended, it **sets its MAG to 30** (inert: all four of its attack rows are strength formulas; the write is a leftover) and **queues Blitzball Rush on the whole living front line**. It queues nothing else, ever. After the Crane has hit it, the "ended" variable (v2 = 255) makes the handler return at once: **no more turns**. Matched set with Lulu or Kimahri down: the survivors only. [run]

**Blitzball Rush** (monmagic2 row 12): strength formula 1, power 4, **10 hits**, random spread, accuracy byte 100, damage type 0 (special: **neither Protect nor Shell halves it; the target's Cheer does**, the strength formula carries the target-Cheer term), rank 3. Against the Luca cells of section 8: 32 to 39 per hit, **330 to 390 if all ten fall on one member**; the chance that one named member takes 7 or more of the 10 hits is 1.97 percent. [arith]

### 4.2 Oblitzerator, onHit: the speed-up and the counters

- **Speed-up** (a hit while v3 = 0 and HP below 1/3 of max, i.e. below 2,000): **AGI + 15** (1 to 16); (while v3 = 1 and HP below 1/12, i.e. below 500): **AGI + 10** (16 to 26). One step per hit; a single blow that crosses both lines moves one step, the next hit the other. Rank-3 recovery: AGI 1: 84 CTB (hasted 42); **AGI 16: 36**; **AGI 26: 27**. Against the Luca trio the Oblitzerator acts once per **5.8** party actions at the start, **2.5** below a third HP, **1.9** below a twelfth. [run] [arith]
- **Counters** (not after the Crane): the formula of the command that hit it (`readCommandProperty(cmd, formula)`; for a weapon-using command the monster's own weapon formula, 1) decides: **1 -> Blind Ball** (row 0x600E, Darkness 254, duration code 1) on the attacker; **3 -> Mute Ball** (0x600F, Silence 254) on the attacker; **2 -> Doze Ball** (0x600D, Sleep 254) on the attacker; each on a draw of `rng2 mod 3 == 0`: **21,846/65,536 = 33.334 percent**; healing (formula 7) and formula 0 answer nothing. All three balls are strength-formula hits (Blind Ball power 10, Mute Ball and Doze Ball power 7, rank 3, accuracy byte 100): small damage, the status is the point. The counter does **not** test whether counterattacks are allowed, so it also answers a hit that is part of a multi-hit command (once per command per target by the engine's own rule). [run] [bytes]

### 4.3 The Doze Ball branch is unreachable (a finding, and a conflict with two guides)

The Doze branch needs a command whose damage formula is **2** (strength, DEF ignored). A scan of every command row in the tables (`scan-f2.mjs`, ids 0x2000 to 0x61FF) finds **six rows with formula 2, all monster moves** (Gastric Juice, Mega Gastric Juice, Gastric Juice Blast, Full-Auto, Double Reaper, Armageddon). **All 86 player Overdrive rows carry formula 1 (the physical ones) or 3 (the Furies and the Blue-Magic ones), none carries 2.** So **no Overdrive draws Doze Ball in the Steam files**, against Gamer Guides ("Overdrives may trigger Doze Ball") and the HD wording of Ludo.guide; Jegged names only the physical and magical counters. [run] [bytes] **Pick: implement the files** (formula 1 and 3 only; keep the data row for Doze Ball but leave the branch unreachable and say so in the guide). **Live check (about ten minutes on a Steam copy, ask first):** use Slice and Dice or Thunder Fury on the Oblitzerator and see which ball comes back.

### 4.4 Oblitzerator, onTargeted and onDeath

- onTargeted: if the command is **Crane (0x6012)** it **force-performs Special 1 (0x6001, the exit animation)** on itself and sets v2 = 255. That is all the "ending" does; the damage is the Crane row itself. [run]
- onDeath: the "alive" flag is cleared, its sound faded, and **`endBattle(Victory)`**. Killing the Oblitzerator any other way wins the same. [run]

### 4.5 The Crane (`m133`)

- onTargeted (the first function): the used command **"Use crane" (0x3102)**: if the crane is not powered (v0 = 0) it **runs scene A 1** (Tidus-and-Lulu's "it's probably out of power") and does nothing else; if powered (v0 = 1) it **queues the Crane row (0x6012) on the Oblitzerator**, sets v0 = 2, **removes "Use crane" from character 0 and makes itself untargetable**. [run]
- onHit: **Thunder (the player-side row 0x3043 only)**: the first two casts run scene B 3 and queue the message row "The crane responds." (v2 counts 1, 2); **the third cast queues "Crane activated." and sets v0 = 1**. **Thunder Fury (0x307A)** powers it **at once** (a hit on a fresh crane, or after one Thunder). **Thundara, Thundaga, the other Furies, Lightning Shot, a Thunder weapon, Fire, Attack: nothing.** A fourth Thunder after power does nothing. [run]
- The Crane has no turns, never acts, and takes no counter from the Oblitzerator (its onHit counters belong to the Oblitzerator's own script, which runs only when the Oblitzerator is the target).
- **The Crane row (0x6012):** formula 5 (a fraction of the running HP), power 15, damage type 1 (physical), accuracy 0 (always lands), no variance: **15/16 of the Oblitzerator's current HP**. From 6,000: takes 5,625, leaves 375; from 3,000: 2,812, leaves 188. Jegged: "nearly 5,500". [arith] [guide: Jegged]

## 5. Party, speed and the numbers that matter (all `[estimate]` for the cells; the game's own start records underneath)

**Party: Tidus, Lulu, Kimahri** [guide: Gamer Guides names the three; Jegged and Samurai Gamers name Tidus and Lulu; the plan]. Yuna (taken at the docks), Wakka (with the team) and Auron (joins later) are not in the fight [guide: Jegged]. The formation has three party entries and one aeon entry, so **no bench**. **No preset exists for this point** (the repo's earliest FFX presets are the Ridge's, the Macalania Temple's and later). **Build point:** the game's start records (`START_RECORDS` in `src/data/ffx/builds/mushroom-rock.ts`, `[game table]`) moved **3/10 of the way to the Macalania preset** (the Ridge build uses 1/2 for stop 5 of 10: Besaid 1, Kilika 2, **Luca 3**, ... Macalania 10), rounded down: Tidus HP 709, MP 24, STR 16, DEF 10, MAG 6, MDF 6, AGI 13, Luck 18, EVA 12, ACC 12; Lulu HP 521, MP 125, STR 5, DEF 8, MAG 24, MDF 31, AGI 6, EVA 40; Kimahri HP 810, MP 84, STR 17, DEF 15, MAG 17, MDF 6, AGI 7. **Lower bound:** the raw start records (Tidus HP 520, Lulu 380 with MAG 20, Kimahri 644). `calc-50.out.txt` prints both. [arith]

| What | Against the S3 cells | Note |
|---|---|---|
| Blitzball Rush, per hit | 32 to 39 (Cheer x5 on the target: 21 to 25) | 330 to 390 if all ten hit one member |
| Tidus Attack | 148 to 167 | Kimahri 171 to 193; Lulu 30 to 34 |
| Lulu **Thunder** on the Oblitzerator (weak x3/2) | **454 to 513** (12 to 14 casts for 6,000) | Fire, Blizzard, Water: 151 to 171 (resisted); Thunder Fury, all 16 hits, 2,832 to 3,184 |
| The Crane | 5,625 from full | decides the fight |

**The player's choice is the crane or a slog.** The crane line: Lulu casts Thunder on the **Crane** three times (a cast at the crane draws no counter), Tidus uses the crane, anyone finishes the 375 left. About 5 to 7 party actions, so about one Blitzball Rush. The slog: 6,000 HP at roughly 330 a round plus counters (a Silenced Lulu, a Darkened Tidus), against an Oblitzerator that doubles its pace below a third. [arith]

## 6. Corrections to the plan

- The plan said "m110 (6,000 HP, 187 KB), Crane m133 (65,535), Thunder x3 then a Trigger Command". All exact; the **187 KB is model data, the script is 783 bytes**, and the crane powers on the **third** Thunder (two answers, then power), or on a Thunder Fury.
- The plan said "Fixed trio Tidus, Lulu, Kimahri; Yuna absent." Sourced by the guides; the files only give three party entries.
- **The Doze Ball counter does not exist in play** (4.3).
- **Nothing in this fight needs a new rule from the engine except the Crane-hits-Oblitzerator command and the "Use crane" Trigger Command**; see the preflight.

## 7. Sources against the files

| Point | Files | Guides |
|---|---|---|
| HP 6,000, overkill 600, AP 36 (54), 580 gil | same | GG, SG, Game8: same |
| Weak Thunder, resists Fire, Ice, Water, Holy | same | same |
| Counters: Blind (physical), Mute (magic) | same, 1 in 3 | GG: "not every time"; Jegged: physical, magical |
| **Overdrives draw Doze Ball** | **unreachable** | GG, Ludo.guide: yes |
| Crane: Thunder x3, Trigger Command, "nearly 5,500" | 3rd Thunder, 15/16 of current HP | same |
| Speeds up when damaged | AGI +15 then +10 | Jegged: yes |
| Threaten | lands (byte 0) | SG: immune |
| Elixir drop, Potion steal, gear | same | same |

## 8. Live checks (about thirty minutes on a Steam copy; ask Bailey first)

1. Which ball an Overdrive draws (4.3). 2. That the ten balls of one Rush spread over the three members, not all on one. 3. The party's real stats and bag at the dock (the field script and the save are not in the files). 4. The music. 5. Whether the Oblitzerator's AGI writes show as faster turns on the CTB bar (the recovery rule says yes). 6. Whether a ball's Darkness or Silence outlasts the swinger's own turn (settled by a second reading of the exe, section 10: it does, because the ball runs after the swinger's end-of-turn tick; the live check is now a confirmation, not a gate).

## 9. Sources actually read

The game's own files for `m110`, `m133`, `cdsp02_00`, the command tables; Jegged "09 Luca"; Gamer Guides "Oblitzerator" (HD) and Samurai Gamers "Oblitzerator Boss Guide" (via the fetch tool, 2026-11-09); Game8 and Ludo.guide only as search-result summaries. Not read: GameFAQs (403), the Final Fantasy wiki (402), StrategyWiki.

## 10. Corrections and additions from the build lane (2026-11-09; every other section stands as written)

- **Threaten (sections 1.1, 1.2 and 7).** The table above reads the Oblitzerator's and the crane's Threaten byte of 0 as "lands" and says Samurai Gamers' "immune" is the guide offset. **This repository's own reading is the other way:** the Threaten byte of a monster record is a success percentage (`research/ffx-seymour-anima-macalania.md` 0.4: Wendigo's is 100 and lands; the Guado Guardian's is 0 and is immune; `data/ffx/enemies/wendigo.ts`, `threatenChance`). On that reading a byte of 0 means **Threaten fails** on both, which is what the guide says, and the "conflict" of section 7 is no conflict. The chapter builds them immune (`threatenChance: 0`); `oblitzerator-data.test.ts` pins it. The raw byte (0) is the note's `[bytes]` fact and stands; only its reading is corrected.
- **Doze Ball (4.3).** Re-proved in the repository against the kernel fixture (`tests/fixtures/parity/ffx/command_records.json`): the six rows with formula 2 are 0x4054, 0x4057, 0x4058, 0x40b5, 0x40b7 and 0x40f4, all monster moves; `formulaByteOf` (`battle/ffx/ai/command-formula.ts`) reads no ability of the party's as 2. The note's "all 86 Overdrive rows carry formula 1 or 3" is not exact in the engine's data (the Demi Fury and a few other rows of the Overdrive family carry 5, 7, 8 or 9), and none carries 2, which is the claim that matters.
- **What a ball leaves behind (settled by a second reading of FFX.exe, 2026-11-09; the build lane's first reading of the engine was the other way, see the correction below).** Blind Ball, Mute Ball and Doze Ball inflict their status at chance 254 with **duration code 1** (`command_status.json`, rows 0x600e, 0x600f, 0x600d). **In the game the status outlasts the swing: it lands after the swinger's own end-of-turn tick, so it is on the swinger at its next menu and is counted off at the end of that next turn.** The order, `[eng]` (FFX.exe build 25501027, read in the decompile, in our own words):
  1. `pp_BtlApplyResults` (VA 0x0078d980) applies the action's hit records to every target (`pp_BtlApplyHitRecords`, VA 0x0078f060). When the last hit record of a target is applied, `ApplyHitRecords` raises the script's `onHit` event through `pp_BtlActionRequest` (VA 0x007aceb0, slot 3).
  2. The request runs the monster's script, and a command the script asks for is not run there: `FUN_007929b0` hands it to `pp_BtlQueueAction` (VA 0x007b2300) as a **free** entry (the flag byte of a turn entry is 0, of a reaction 1), inserted **right behind the attacker's own queue entry** (the function looks up the attacker's entry index, `Chr+0xde4`, and inserts after it).
  3. In the same pass of `ApplyResults`, once no target has a hit record pending and the last sub-action is done, `pp_BtlActionDone` (VA 0x007b20e0) is called for the attacker. It removes the attacker's entry and, for an entry with flag 0 (a turn), adds the recovery to the CTB counter and runs the end-of-turn status tick (VA 0x007af390). A reaction entry (flag 1) gets neither.
  4. The queued ball is therefore the next entry and runs afterwards: the status it puts on the attacker is not ticked by the turn that set it off. A status of duration code 1 is counted off by the end-of-turn tick of the attacker's **next** turn, so that turn is played under it (Darkness: the attacker's next blow is aimed under it; Silence: the next spell is off; Sleep: the next turn is passed).
  5. The infliction kernel's one self-cast rule (a finite duration cast on oneself lasts one turn more, `research/re-ffx-ctb-status.md` section 15.1 S7) compares the user's id with the target's id only; a ball is cast by the Oblitzerator on the attacker, so the rule does not apply and the code-1 duration is exact.
  The guides advise the cures (Eye Drops, Echo Screens), which agrees. **The repository's engine had run every script's queued reaction before the swinger's tick** (`engine-end.ts#afterAction`: the reaction drain, then `onTurnEnd`), which would have taken a ball's status off with the very turn that set it off (the build lane's finding, pinned until 2026-11-09). The fix is **opt-in and local**: a reaction queued `afterTick` (`ai/hooks.ts`) waits for the end-of-turn tick and runs in the drain after it (`engine-end.ts`); the Oblitzerator's balls are the only ones that ask for it, so no other chapter's order changed (the 24 FFX chapters x 3 seeds x 2 policies hash-compared in the review: identical; re-run after the fix). **Open, not touched:** the same decompile says that *every* script reaction runs after the triggering action's tick; the engine's older order differs for the others, and only a finite status a reaction puts on the acting character can tell the two apart; no other chapter was audited for one.
- **The speed-up on the Crane's own hit.** The Crane row naming the Oblitzerator is a hit like any other, so the script's speed-up runs on it too (the speed steps before the script tests the ended state, 4.2): from 6,000 the lift leaves 375, **under a twelfth** (a twelfth is 500; the first line, a third, is 2,000), and the step is **one**, because the script steps once per hit (AGI 16, phase 1; the second step waits for the next hit); the machine takes no turn after it, so it does not show. (Corrected 2026-11-09: this bullet first said "under a third and over a twelfth", which is wrong about 375; the conclusion and the code were right.)
- **The Rush's spread is not independent picks (fix-pass reading, 2026-11-09; do not quote the 1.97 percent as a game fact).** Section 4.1's figure for a named member taking seven or more of the ten balls assumes ten independent random picks. In the repository's engine the ten targets of a Rush are fixed before the first ball lands (`research/re-ffx-targeting.md` section 6 item 2), 36 percent of the balls after a member falls land on the fallen member, and a member took no fewer than two and no more than six balls in the runs of the review. Keep the copy at "spread"; whether the game picks all ten up front is live check 2 (section 8).
- **The numbers of the guide copy are for the flagged Luca party.** "32 to 39 apiece", "twelve to fourteen Thunders" and "thirty to forty blows" hold for the estimated Luca build (`data/ffx/builds/luca.ts`, flagged `[estimate]`); "about six of your turns" holds for rank-3 actions and a party that waits gets about eight and a half. The crane line's result does not depend on them.
