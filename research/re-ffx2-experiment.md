# FFX-2 Experiment (Djose Temple, Chapter 5) read from the game's own files: the three upgrade levels, the monster record, the AI script and the formations

**Game case: FFX-2 only.** (FFX has its own scripts, engine and notes.) Research only: no engine, data or AI code is changed by this
note. Drafted 2026-10-10 for the new-chapters lane. It continues the `re-ffx2-ai-*.md` notes
(`re-ffx2-ai-bahamut-vegnagun.md` section 1 and `re-ffx2-ai-leblanc-den-ixion.md` section 1 describe the engine rules every FFX-2 boss
script relies on; this note repeats only what it uses or what it checked again).

**Source note (applies to every statement unless a line says otherwise):** `FFX2_Data.vbf` of Bailey's live Steam copy
(FFX-2 build 25501027, FFX-2.exe SHA-256 6EA7F142...CD69), read with `D:\Tools\rea\tools\vbf-extract.mjs`. The AI is the developers' own
script source shipped in the archive under `ffx_ps2/ffx2/master/jppc/battle/mon/` (`m194.src` is the Experiment's body; `m195.src` its
part actor) and its compiled twin `mon/_m194/m194.bin`; ability rows are rows of `battle/kernel/monmagic.bin`, stats and rewards rows of
`kernel/monster.bin` (and `monster2.bin`), formations rows of `kernel/btl.txt`, start positions `btl/djyt06_225..229/pos_*.psc`. The upgrade
state lives in the save data and is written and read by the event packages `event/obj/dj/djyt0300/djyt0300.ebp`,
`dj/djyt0800/djyt0800.ebp`, `mi/missionsel/missionsel.ebp`, `mo/monlist/monlist.ebp`, the two debug packages `te/test02`, `te/testbattle`,
and fed by the Bikanel dig packages `bi/bika0700` to `bi/bika1400`. Engine behaviour is read from FFX-2.exe in Ghidra (the older copy on
:8090, whose battle functions sit 0x20 to 0x30 above the live build; every function cited was either compared with the live bytes by an
earlier lane or is only used for a presentation fact) and, where marked, run on the live exe in the emulator harness. Everything is
written in our own words: no script text, no game text and no decompiled code is reproduced here.

**Confidence tags.** [H] source and compiled script agree and the engine part was read (and, where stated, run); [M] read from the code but
not run, or partly inferred; [L] open. Numbers are written as the files have them. A "poll" is one call of the monster's action entry; a "step"
one battle logic step (29.97 per second, one step = 0.033367 s; 95 gauge units fall per step at Normal speed).

## Main findings in one screen

1. **The three upgrade levels are three 32-bit numbers in the save data, 0 to 4 (shown as Lv 1 to 5): Attack at offset 0xb74, Defense at
   0xb78, Special at 0xb7c.** They are recomputed from nine 16-bit piece counters at 0xb98 to 0xba8 whenever one of the scripts that need them runs (the Djose
   temple, the mission list, the bestiary). Each category's points are `first counter + 3 x second + 5 x third` (the wiki's A, S and Z pieces); the level is the
   number of thresholds reached: 4, 10, 20 and 38 points give Lv 2, 3, 4 and 5. **Level 5 needs 38 points, not 39. A level cannot exceed 5.**
   [H: six scripts compute it identically]
2. **Attack Lv n sets only the body's STR and MAG; Defense Lv n only DEF and MDEF; Special Lv n only chooses the battle scene.** Nothing else
   varies: HP 18,324, MP 0, level 50, AGI 68, ACC 95, EVA 0, LCK 0, every resistance, AP 40, Pilfer Gil 5,000, the steal and the drop are the same
   at all 125 combinations. The script writes 0 for MAG, DEF and MDEF at Lv 1; the engine stores 1 (a script write to those stats is clamped to
   1..255). [H]
3. **The five Special levels are five different battle scenes, chosen by the Djose event script from the Special level** (Lv 1 to 5 give
   `djyt06_229`, `228`, `227`, `226`, `225`). The AI tests the scene, not the level. Each scene is its own formation row: the body plus 0, 2, 4, 6 or 8
   invisible, untargetable part actors that trail behind it. [H]
4. **The AI is one script with five branches, no reaction, no phase change and no counter.** Lv 1 Attack only; Lv 2 Attack, Attack, Attack, then
   a 4-hit Rocket Launcher; **Lv 3 Attack, Attack, 6-hit Rocket Launcher, and, when its HP first falls below 60%, 40% and 20% (once per band,
   in that order), a Lifeslicer in place of that poll aimed at the girl with the highest current HP** (a detail only one fan guide mentions);
   Lv 4 a `% 6` roll: Lifeslicer 1/6, 8-hit Rocket Launcher 2/6, Attack 3/6; Lv 5 the seven-poll order Rocket Launcher (10 hits), Attack, Rocket Launcher,
   Attack, Lifeslicer, Annihilator, Attack. [H]
5. **Lifeslicer is damage equal to the target's maximum HP, never misses, ignores Protect and Shell (its row has no damage-type bit) and cannot be
   reflected; Annihilator is magic that ignores MDEF, always hits, delays each girl by 4,000 gauge units and hits for 1,240 to 1,400 at the maximum
   Attack level** (it scales with the Attack level's MAG: 626 to 707 at Attack Lv 1). The emulator run of the live damage function reproduces the
   fan wiki's figure exactly. [H for the base damage, run]
6. **The record is neutral to everything except Gravity, and immune to every harmful status and every stat-change status**, including the
   Breaks (group 2 slots 5 to 14 and group 1 slots 0 to 8, 10, 17, 18 are 255). The wiki's "Lightning: Absorb" is not in the record. [H]
7. **Rewards:** 40 AP, 0 gil, 0 EXP; Steal always succeeds (chance byte 255): Turbo Ether x1 common, Turbo Ether x2 rare; Pilfer Gil figure 5,000
   (pays 50% to 100% of it once); the drop is always one Elixir. [H]
8. **The "battle too long" block (four warnings and a 12-hit Time-Up Meteor) is dead code**: it only counts while no girl stands and the gauge
   does not run then. The script's "special battle: train boss" setting is presentation only (it chains the part actors behind the body). [H]
9. **Pace** is set by the rows' rest and charge numbers at AGI 68 (section 8): Attack rest 153 steps (5.1 s); Rocket Launcher charge 92 steps (3.1 s)
   then rest 153; Lifeslicer charge 153 then rest 275 (9.2 s); Annihilator charge 321 steps (10.7 s) then rest 153. The first poll comes 27 to 80 steps
   (0.9 to 2.7 s) after the start. Effect lengths were not measured.
10. **Digging (not needed for a fight chosen by menu):** every dig roll is `(draw & 0xffff) x 100 >> 16`; three 30-value blocks give an equal
    30% chance to each of Attack, Defense and Special, 10% give no piece, and the grade mix depends on the story-progress window (section 11).

## 0. How this was checked

- **Script against binary.** The 13 command ids in `m194.src` (names resolved with the game's own `monmagic.ath`/`command.ath`) are exactly the
  13 ids in the disassembly of the compiled package `_m194/m194.bin`, and its one random modulus (6) matches; the control flow, thresholds and
  counters of every branch were read side by side (`tools/cmp-src-bin.mjs`, `raw/dis/m194.dis.txt`). The package's embedded monster record equals
  the kernel row for the body and all 15 other actors (`tools/cmp-pkg-kernel.mjs`).
- **Event packages.** The `.ebp` event files are an "EV01" container whose Atel script starts at the header size; the same disassembler as the battle
  packages reads them. Call numbers outside the battle funcspace have no names in our references, so the argument count of each call id was inferred
  from the operand stack depth over all 669 event packages (`tools/infer-nin.mjs`); for the 23 battle-space calls that occur in events the inferred counts
  equal the declared signatures. The event reading is therefore exact for variables, constants, branches and `btlExe(scene, 0)` calls and descriptive
  only for what the unnamed calls do.
- **Engine.** Read in Ghidra: the stat setter (core 0x639430), the special-battle setter and its follower code (0x628e60, 0x628e90, 0x628db0,
  0x628fb0), the hit determination (0x641530), the target search (0x634e70), the target re-validation (0x63eee0) with all six of its callers, the
  charge-end mask strip (0x645390), the effect-range hit step (0x631260), the dig roll call (0x712870). **Run on the live exe** (harness, only the RNG
  scripted): the base damage function for every move at every Attack level (`tools/emu_exp_damage.py`), the random-target hit spread
  (`tools/emu_spread.py`) and the target re-validation for the Experiment's commands with girls dead (`tools/emu_revalidate_exp.py`).
- **Not checked:** animation and effect lengths, the formation row's flag columns, bit 10 of the special word, what several event flags mean (section 10), Auto-Life against Lifeslicer.

## 1. The fight: scenes, formations, start positions

Every story Experiment battle is started by `btlExe(scene, 0)` from `djyt0800.ebp` (section 10); a scan of the scene constants in all 3,496 event, monster and scene packages finds the five scene ids only in `djyt0800.ebp`, the debug battle menu `testbattle.ebp`,
the body's own script and the scene master `system_01` (`raw/scan-ints-experiment-scenes.txt`; `djyt0600.ebp` names the neighbouring scenes 221 to 224, a different set of Djose fights). The five scenes share the battle map
(the Djose Temple trial chamber), the music/background fields and the start positions:

| Special Lv | Scene (id) | Formation row (`btl.txt` line) | Actors (slot order) |
|---|---|---|---|
| 1 | `djyt06_229` (0x00ec00e5) | 0835 (847) | body |
| 2 | `djyt06_228` (0x00ec00e4) | 0836 (848) | body + 2 parts at scale 100, 100 |
| 3 | `djyt06_227` (0x00ec00e3) | 0837 (849) | body + 4 parts at 100, 100, 92, 92 |
| 4 | `djyt06_226` (0x00ec00e2) | 0838 (850) | body + 6 parts at 100, 100, 92, 92, 83, 83 |
| 5 | `djyt06_225` (0x00ec00e1) | 0839 (851) | body + 8 parts at 100, 100, 92, 92, 83, 83, 66, 66 |

The body is `m194` (monster id 0x10c2) at scale 100. The parts are `m195` (0x10c3), a one-HP actor whose script switches its existence, cursor and
action flags off: it is never targeted, never acts and does not count for the end of the battle (the end-of-battle check, 0x61ef90, skips monsters whose exist flag, character byte 0x1788, is off) [H]. The number in front of each monster
symbol in `btl.txt` is the model scale in percent (distribution over the whole table: 50 to 10,000; here the part model's real height of 49.1 is
45.2, 40.8 and 32.4 at 92, 83 and 66 percent, which are the real heights of the pre-scaled dummy models m197, m199 and m208) [M]. The script's "special battle 1
(train boss)" setting makes the engine chain the parts behind the body in two rows (the first part of each row trails the body, each later part trails the
one before it) and move them every frame; it reads no stat and writes none, and its only other reader is a debug overlay [H, presentation only].
Parts and Rocket Launcher hits are related only by arithmetic (hits = 2 + parts); nothing links them in code.

**Start positions** (`pos_djyt06_225..229.psc` are identical): girls slot 0 (0, 0, -19), slot 1 (16, 0, -18), slot 2 (-16, 0, -18); the body (0, 0, 15), facing
direction 0. The body cannot move or jump (its script sets both disable flags), so it always shoots from where it stands. **Near-weighted target odds**
with the girls at those positions and the body facing them: 50.0%, 25.0% and 25.0% for slots 0, 1, 2 (illustration only; 32.4/33.9/33.7 facing away; the girls move).

Other facts of the rows: the battle map is the Djose Temple "trial" chamber map; the scenes ship a message file and empty event, scene and camera sources. The six
flag columns of the row are all off, the integers after the author tags are 1, 0, 0, the fields after the map are 14 and 0; none of these is decoded [L]. The same pattern (six flags off, 1, 0, 0) is on the other boss rows
checked (Ixion, the Leblanc trio, Bahamut, Vegnagun's head, the Den of Woe shades, Trema), while random-encounter rows have one flag on and 1, 1, 1: so the last two integers probably switch off things bosses do not allow
(escape, a first-strike roll) [L, a guess from the pattern]. A debug row `zzzz01_94` (index 0196) fights the body alone on the test map. Eight more actors are named "Experiment" (monster ids 196 to 200, 208, 209 and the
part 195): they are one-HP dummies; only 195 is in a formation.

## 2. The monster record (`kernel/monster.bin` row 194; identical in the JP and US copies and in the compiled package)

| Field | Value | Notes |
|---|---|---|
| Level, HP, MP | 50, **18,324**, 0 | the script never changes HP; MP is 0 and no move costs MP |
| STR / DEF / MAG / MDEF in the record | 58 / 205 / 100 / 205 | **overwritten at battle start** by the script (section 5.3); only the AGI, ACC, EVA, LCK below are used as stored |
| AGI, ACC, EVA, LCK | 68, 95, 0, 0 | fan encyclopedias print 0 for ACC; the record has 95 |
| Thinking byte | 0 | unused by play (earlier lanes: thinking is 30 steps per fallen girl) |
| Special word | 0x7c3 | bits 0, 1, 6, 7, 8, 9, 10 set. Bit 0 immune to percent-of-HP formulas (4 and 7); bit 1 hit reactions do not slow it; bit 6 immune to ATB damage (Delay); bit 7 Zantetsu disabled (the game's header name); bits 8 and 9 are Bribe and magic-cancel flags (the header names them; the command note reads bit 9 as Bribe immunity); bit 10 has no name |
| Species | machine (type bit 0) | the Oversoul group field is 0xa02d (Al Bhed machine); only the Trema chapter's Oversoul counters read it |
| Elements | absorb none, **null Gravity (bit 4)**, half none, weak none | Fire, Ice, Lightning, Water, Holy are neutral |
| Status resist group 1 (255 = immune) | slots 0 to 8 (Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse), slot 10 (Eject), slots 17 and 18: 255; slot 9 and 11 to 16: 0 | |
| Status resist group 2 | slots 5 to 14 = 255: Slow, Stop, the seven stage-change slots (STR, MAG, DEF, MDEF, ACC, EVA, LCK) and Doom; slots 0 to 4 (Shell, Protect, Reflect, Regen, Haste): 0 | the Breaks cannot land |
| Auto statuses | none | |
| Commands (record list) | 0x41da, 0x4121, 0x4122, 0x4123, 0x4124, 0x4125, 0x4126, 0x4127 | Attack; Rocket Launcher x4; Lifeslicer; Annihilator; Die |
| Berserk move | none | |
| EXP, gil, AP | 0, 0, **40** | |
| Pilfer Gil figure, steal chance byte | 5,000, 255 | steal always succeeds once (the gil chance byte is forced to 255 for every monster, earlier note) |
| Steal items | common Turbo Ether x1, rare Turbo Ether x2 | rare taken on 12.5% of successes (earlier note) |
| Drop chance byte, items | 255 (always), Elixir x1 in both slots | |
| Bribe slots | empty | |
| Zantetsu byte | 180 | moot: bit 7 of the special word disables it |
| Model, motion, sound id | 4290 (0x10c2) | |

**The Oversoul variant** (`monster2.bin` row 194; used only when an Oversoul rebuild asks for it, never by this chapter): HP 25,540, Lv 67, AGI 105, special word 0x3c3,
Eject not immune, no AP, steal or drop. Same stats otherwise.

**Size** (from the size lane's table `D:\Tools\rea\analysis\size\ffx2-monsters-size.tsv`, rows 194 to 209): body engine scale 2.0, raw mesh 31.28 wide x 25.39 high x
19.02 deep, **real height 50.78** (engine height field 52.0; 2.86 times the Chapter 5 girls' mean of 17.73); part model m195 real height 49.14, width 23.31, depth 15.13.

## 3. The upgrade levels and what each changes

| Index (saved) | Shown as | Points needed (`A + 3 S + 5 Z`) | Attack: STR / MAG (script value; stored) | Defense: DEF = MDEF (script value; stored) |
|---|---|---|---|---|
| 0 | Lv 1 | 0 to 3 | 112 / 0 (stored 1) | 0 (stored 1) |
| 1 | Lv 2 | 4 to 9 | 130 / 20 | 50 |
| 2 | Lv 3 | 10 to 19 | **155** / 45 | 100 |
| 3 | Lv 4 | 20 to 37 | 180 / 72 | 150 |
| 4 | Lv 5 | 38 or more | 215 / 100 | 205 |

Special Lv 1 to 5 is the scene/formation table of section 1; the moves each Special level can use are:

| Special | Moves (row ids) |
|---|---|
| Lv 1 | Attack (0x41da) |
| Lv 2 | Attack, Rocket Launcher 4 hits (0x4121) |
| Lv 3 | Attack, Rocket Launcher 6 hits (0x4122), Lifeslicer (0x4125, only at 60/40/20% HP) |
| Lv 4 | Attack, Rocket Launcher 8 hits (0x4123), Lifeslicer |
| Lv 5 | Attack, Rocket Launcher 10 hits (0x4124), Lifeslicer, Annihilator (0x4126) |

Piece counts that reach a level on one grade alone: first weight 4, 10, 20, 38; second weight (x3) 2, 4, 7, 13;
third weight (x5) 1, 2, 4, 8. **Any of the 125 combinations is reachable** (the three counters are independent).

| Upgrade | Changes | Does not change |
|---|---|---|
| Attack index a | body STR and MAG (damage of Attack and Rocket Launcher: STR; Annihilator: MAG); shows attack modules 1..a of the body model (module 1 at index 1, ... module 4 at index 4; none at index 0); adds `a` to the effect-level number | everything else |
| Defense index d | body DEF and MDEF (physical and magical damage taken); shows defense modules 1..d; adds `256 d` to the effect-level number | everything else |
| Special index s | the scene (so the move list and the poll pattern), the number of part actors (2 s); adds `16 s` to the effect-level number | stats |

The **effect-level number** (`stat 222`) is `a + 16 s + 256 d`; the setter stores it on the character and on the model object (`FUN_006e5990`), so it is a
presentation parameter [M: its readers were not traced]. The body model's **head module** is shown only when the scene is the Special 5 scene **and** the
Attack and Defense indices are both 4; in every other case it is hidden.

## 4. How the game applies the levels: variables, readers, writers

### 4.1 Save-data fields [H]

| Offset | Size | What | Script name |
|---|---|---|---|
| 0xb74 | 32-bit | Attack level index 0..4 | `joseStrFlg` |
| 0xb78 | 32-bit | Defense level index 0..4 | `joseDefFlg` |
| 0xb7c | 32-bit | Special level index 0..4 | `joseAblFlg` |
| 0xb98, 0xb9a, 0xb9c | 16-bit each | Attack pieces: weight 1, weight 3, weight 5 | (counters) |
| 0xb9e, 0xba0, 0xba2 | 16-bit each | Defense pieces: weight 1, 3, 5 | |
| 0xba4, 0xba6, 0xba8 | 16-bit each | Special pieces: weight 1, 3, 5 | |
| 0xf9 bit 7 (0x80) | flag | "the machine was beaten and needs repair" (cleared by a repair) | section 10 |

The body's script declares the first three as its own variables (they live in the save area, so it reads them live); no other battle actor reads them.
The only other game objects that declare 0xb74..0xb7c are Djose's `djyt0300` and `djyt0800`, the mission list, the bestiary list and the two debug packages.

### 4.2 Where the levels are computed [H]

Six scripts contain the same block (`djyt0300.ebp` worker 32 function 1 at code 0x9b65 to 0x9cdf; `djyt0800.ebp` worker 33 at 0x482d to 0x49a7;
`missionsel.ebp` at 0x1f03f; `monlist.ebp` at 0x277d; `test02.ebp` at 0xbb49; `testbattle.ebp` at 0x0007). For each category it forms
`p = 10 x (first + 3 x second + 5 x third)` from its three counters and stores 0 if `p < 40`, 1 if `p < 100`, 2 if `p < 200`, 3 if `p < 380`, else 4. In piece points that is
4, 10, 20 and 38. The same block in `djyt0800.ebp` then sets bit 3 (0x08) of save byte 0xf9 when all three indices are 4 ("out of control" in the fan sources).
The result is stored; it is recomputed the next time one of these scripts runs, so a stored index can lag the counters until the player is back at Djose, the mission list or the bestiary.

### 4.3 Where the levels are read [H]

1. **Battle start (the body's init function).** Writes the effect-level number, then STR and MAG from the Attack index, then DEF and MDEF from the Defense index (table in section 3; any index above 3 takes the last entry).
2. **The body's model-setting function** reads Attack and Defense (and the scene) to hide model parts.
3. **`djyt0800.ebp`** picks the scene from the Special index (section 10) and shows the three levels (index + 1) in the technician's readout.

The Special index is **never read by the battle script**: the pattern comes from the scene. In a custom build the three indices are enough to reproduce a fight.

### 4.4 What the stat write does [H]

A script's write to STR, DEF, MAG, MDEF, AGI or LCK goes through the stat-setter core, which clamps the value to 1..255 before storing it (EVA is clamped to 0..255, ACC to 1..255).
So Attack Lv 1 gives MAG 1 and Defense Lv 1 gives DEF = MDEF = 1, as the fan sources print.

## 5. The AI script (`m194.src`, compiled `_m194/m194.bin`)

### 5.1 Entries [H]

| Entry | Source lines | Compiled offsets | What |
|---|---|---|---|
| Init | 16 to 99 | 0x0006 to 0x0253 | motion setup; death pattern "falls, cannot be raised"; move and jump disabled; special battle 1; effect-level number; STR/MAG and DEF/MDEF tables; counters 0 |
| Main | 101 to 103 | 0x0254 | halts |
| Model setting | 105 to 186 | 0x025f to 0x0405 | model parts by level (section 3) |
| Action (poll) | 188 to 480 | 0x0413 to 0x0a39 | the decision tables below |
| Reaction, menu, targeted | 482 to 492 | 0x0a3a to 0x0a3c | **empty** |
| Death | 494 to 501 | 0x0a40 | if a death reaction is allowed, the Die command (row 0x4127) |

Variables (private to the actor, assumed to start at 0 as in the earlier lanes [M]): the **cycle counter** (the tables below call it `turn`), the **band counter** (Special 3's Lifeslicer bands), the action counter and the warning stage
(time-out block), a target holder and a random holder. Targets: `near` = `searchr` (near-weighted, stream 4), `uniform` = `searchr_nop` (stream 4), `% 6` = `random() % 6` (stream 2), exactly as the Bahamut note sections 1.3 and 1.4.

**There are no timers in the script** other than the dead action counter below: no step counts, no clocks, no phase switch. The only things that change what it does are the cycle counter, Special 3's band counter, the random roll (Special 4) and
Special 3's HP; the cadence is the ATB gauge (section 8).

### 5.2 The time-out block [H, dead code]

Lines 189 to 223 count actions and, past 230, 240, 245 and 250 of them, queue four warning rows (0x4232 to 0x4235) and then a 12-hit Time-Up Meteor (0x4236, formula 5, power 200, random targets). It runs only when the
party-alive count (`btlCountChrPlayer(-25, -30)`, the same call as in the Bahamut and Leblanc scripts) is 0, which only happens with the party wiped, and the gauge does not run then (Bahamut note 1.6). It never runs.

### 5.3 Init: the level tables [H]

Source lines 39 to 65 (Attack) and 67 to 93 (Defense), compiled 0x00e2 to 0x0253. Case 0 to 3 as in section 3, any other index the Lv 5 values.

### 5.4 Poll tables (the scene decides) [H]

**Special 1 (scene 229), lines 471 to 475, compiled 0x0a2d:** every poll: **Attack (0x41da)** on one living girl, near-weighted.

**Special 2 (scene 228), lines 440 to 470, compiled 0x097b:** `turn` +1 each poll.

| `turn` after +1 | Command | Target |
|---|---|---|
| 1, 2, 3 | Attack | one living girl, near |
| otherwise (4) | `turn` = 0, then **Rocket Launcher, 4 hits (0x4121)** | all girls (random target per hit) |

**Special 3 (scene 227), lines 306 to 437, compiled 0x0686:** HP is read as `HP x 5 < maxHP x k` with integers; with maxHP 18,324 the three lines are HP at or below **10,994 (k = 3, 60%)**, **7,329 (k = 2, 40%)** and **3,664 (k = 1, 20%)**. The tests are nested, lowest line first:

| HP now | If the band counter is... | Action | Target |
|---|---|---|---|
| at or below the 20% line | 0, 1 or 2 | set the counter to 3; **Lifeslicer (0x4125)** | the living girl with the highest current HP (a first `searchr(all, alive)` draws and is discarded when two or more girls live; ties near-weighted) |
| at or below the 20% line | already 3 | the cycle below | |
| above the 20% line, at or below the 40% line | 0 or 1 | set the counter to 2; Lifeslicer | same |
| above the 20% line, at or below the 40% line | 2 or 3 | the cycle below | |
| above the 40% line, at or below the 60% line | 0 | set the counter to 1; Lifeslicer | same |
| above the 40% line, at or below the 60% line | 1, 2 or 3 | the cycle below | |
| above the 60% line | any | the cycle below | |

**The cycle:** `turn` +1; 1 and 2: Attack (near); 3: `turn` = 0 and **Rocket Launcher, 6 hits (0x4122)** on all girls. A Lifeslicer poll does not advance `turn`. Because the counter jumps straight to 3 at the lowest line, a drop through several lines between two polls (for example from 70% to 15%) fires one Lifeslicer and skips the other two. There are at most three Lifeslicers in a fight.

**Special 4 (scene 226), lines 280 to 303, compiled 0x05f3:** `r = random() % 6` each poll.

| `r` | Command | Chance (65,536 values: 10,923 for 0 to 3, 10,922 for 4 and 5) |
|---|---|---|
| 0 | **Lifeslicer**, one living girl chosen **uniformly** | 16.67% |
| 1, 2 | **Rocket Launcher, 8 hits (0x4123)** on all girls | 33.33% |
| 3, 4, 5 | Attack on one living girl, near | 50.00% |

**Special 5 (scene 225), lines 225 to 277, compiled 0x04f5:** `turn` +1 each poll; seven-poll cycle.

| `turn` after +1 | Command | Target |
|---|---|---|
| 1 | **Rocket Launcher, 10 hits (0x4124)** | all girls |
| 2 | Attack | near |
| 3 | Rocket Launcher, 10 hits | all girls |
| 4 | Attack | near |
| 5 | **Lifeslicer** | one living girl, uniform |
| 6 | **Annihilator (0x4126)** | all girls |
| otherwise (7) | `turn` = 0, then Attack | near |

The cycle then restarts at 1. No branch reads the party's HP, statuses or the attacker of the last hit.

### 5.5 Targets and the row masks [H unless tagged]

- **Dead girls and the mask.** `setdircom` with the whole party builds a mask of all three slots, KO'd girls included (Bahamut note 1.2). The three charged moves (sequence class 31) take the cast path of the command start, which
  does no re-validation and starts the charge; during the charge the per-step check (0x645080) re-validates with partial repair off, so it acts only when **every** girl in the mask has become invalid; when the charge ends the mask is
  stripped of invalid members (0x645390); the effect's range step then runs the hit determination on that stripped mask (0x631260 calling 0x641530) [M: this order is read in the code, not run end to end]. So a Rocket Launcher's hits are spread over
  the girls who are valid when the effect starts, and hits planned for a girl who falls during the volley are not executed [M]. The re-validation routine itself, **run on the live exe** with the Experiment's own rows
  (`emu_revalidate_exp.py`), removes a dead or untargetable girl from a party mask when it is called with partial repair on, which the instant path and the hit events do (0b111 -> 0b011 with Paine dead, 0b110 with Yuna dead,
  0b101 with Rikku dead, 0b100 with two dead).
- **Random target per hit** (row bit 0x4000): the hit determination takes **one draw per hit from fixed stream 5** and gives the hit to the `(draw mod candidates)`-th member of the mask in slot order; one candidate uses no draw.
  Run on the live exe (`emu_spread.py`): 10 hits over three candidates with draws 0..9 gave 4, 3, 3; over two candidates 5, 5; over one candidate all 10, no draw. All 10 hits are decided together before the first lands.
- **Single-target rows** (Attack 0x33, Lifeslicer 0x13) aimed at a girl who is dead are re-aimed at the nearest living girl by the same routine (run: Attack aimed at Yuna with Yuna dead goes to Rikku; with Yuna and Rikku dead to Paine;
  Lifeslicer behaves the same; with all three dead nothing is left). For the charged Lifeslicer this happens in the per-step check, which does repair a mask in which every member is invalid [M]. Lifeslicer's target flags lack the
  "may target the dead" bit, so it cannot hit a KO'd girl.
- The Experiment's moves carry no "all targets chosen" byte, so no all-target halving ever applies (Damage note section 5).

## 6. The rows (`kernel/monmagic.bin`)

| Row | Name | Class, formula, power, hits | Accuracy | Bits | Crit | Rest / charge cost | Target | Notes |
|---|---|---|---|---|---|---|---|---|
| 0x41da | Attack | HP, f0, 16, 1 | formula 2: attacker ACC 95 | physical, can crit | fixed 5% | 100 / 0 | one enemy | shatter 10; hit % = 95 + LCK_a - LCK_t - EVA_t + stage terms, roll `% 101` |
| 0x4121 | Rocket Launcher (Special 2) | HP, f0, **4**, **4** hits | never rolls | physical, can crit | fixed 10% per hit | 100 / 60 | all enemies, random target per hit | shatter 100 |
| 0x4122 | Rocket Launcher (Special 3) | HP, f0, **3**, **6** hits | never rolls | physical, can crit | fixed 10% | 100 / 60 | same | |
| 0x4123 | Rocket Launcher (Special 4) | HP, f0, 3, **8** hits | never rolls | physical, can crit | fixed 10% | 100 / 60 | same | |
| 0x4124 | Rocket Launcher (Special 5) | HP, f0, 3, **10** hits | never rolls | physical, can crit | fixed 10% | 100 / 60 | same | |
| 0x4125 | Lifeslicer | HP, f7, 16, 1 | never rolls | **none** | none | 180 / 100 | one enemy | 16/16 of the target's **maximum** HP; not reflectable; shatter 100 |
| 0x4126 | Annihilator | HP, f3, 20, 1 | never rolls | magical | none | 100 / 210 | all enemies | formula 3 ignores MDEF; **Delay weak** (4,000 gauge units, about 42 steps) on each target; shatter 100; links to the party Blue Bullet command 0x3053 |
| 0x4127 | Die | none | | | | 0 / 0 | the dead | the death command |
| 0x4232 to 0x4236 | the dead time-out rows | | | | | | | never issued |

All four Rocket Launcher rows, Lifeslicer and Annihilator use the charged sequence class (31); Attack is the instant class (1); Die is class 33. No row is reflectable or silenceable; none costs MP. Effect ids: Rocket Launcher 819, Lifeslicer 820, Annihilator 821, Die 823;
the Rocket Launcher and Lifeslicer effects have empty sources (the 1,444-byte generic stub), Annihilator's effect source is a camera script whose waits add up to about 163 frames (camera only, not a damage timeline).

**Reductions that apply** (from the damage notes): Protect halves Attack and the Rocket Launcher (physical bit); Shell halves Annihilator (magical bit); nothing reduces Lifeslicer. Chain: the first hit on a fresh target is x1 and each later hit
on the same girl multiplies by (n+28)/20 for the number n of hits already landed, until she stops reacting, so a 10-hit volley that favours one girl hits her hardest at the end ([re-ffx2-damage.md](re-ffx2-damage.md) section 4).
Evade & Counter makes a girl dodge Attack (accuracy formula 2) but not the other moves (formula 0).

**Base damage per hit, run on the live function** (before crit, Protect, Shell, chain; level 50; variance 240 to 271 out of 256; `tools/emu_exp_damage.py`, `raw/emu_exp_damage.out.txt`):

| Attack Lv (STR) | Attack P16 vs the target's DEF 1 / 50 / 100 / 150 / 205 | Rocket Launcher P4 (Special 2) vs DEF 1 / 100 / 205 | Rocket Launcher P3 (Special 3 to 5) vs DEF 1 / 100 / 205 |
|---|---|---|---|
| 1 (112) | 985-1112 / 806-910 / 622-702 / 439-496 / 238-268 | 245-277 / 155-175 / 59-66 | 184-208 / 116-131 / 44-49 |
| 2 (130) | 1257-1419 / 1028-1161 / 795-897 / 560-633 / 303-342 | 314-354 / 198-224 / 75-85 | 235-265 / 149-168 / 56-63 |
| 3 (155) | 1686-1904 / 1379-1557 / 1065-1203 / 751-848 / 406-459 | 420-475 / 266-300 / 101-114 | 315-356 / 199-225 / 75-85 |
| 4 (180) | 2175-2456 / 1779-2009 / 1375-1552 / 970-1095 / 525-593 | 543-613 / 343-387 / 131-148 | 407-460 / 257-291 / 98-111 |
| 5 (215) | 2962-3345 / 2422-2735 / 1872-2114 / 1320-1491 / 715-807 | 740-836 / 467-528 / 178-201 | 555-626 / 350-395 / 134-151 |

| Attack Lv (MAG) | Annihilator per girl | Lifeslicer |
|---|---|---|
| 1 (1) | 626-707 | the target's maximum HP |
| 2 (20) | 744-840 | |
| 3 (45) | 899-1015 | |
| 4 (72) | 1066-1204 | |
| 5 (100) | **1240-1400** (the fan wiki's published range) | |

## 7. Engine rules this fight relies on (checked again or new)

- **The special battle is cosmetic** (section 1). **Script stat writes clamp to 1..255** (4.4).
- **First attack.** No script of this fight presets the first-attack result (the Djose event calls no first-attack call, the scene package has no code), so the engine's normal roll (ATB note: about 8% preemptive, 8% ambush at equal AGI) applies [M]; whether the formation's flag columns suppress it is open [L].
- **Thinking, batches, steal, Pilfer Gil, clock, formulas:** as in the Leblanc note sections 1.1 to 1.12 and the ATB notes. The body's special word has bit 1, so a hit reaction does not slow its gauge.
- **Hit rolls:** accuracy formula 2 reads the attacker's ACC (95); the Rocket Launcher and Annihilator never roll; Lifeslicer never rolls.
- **Near-weighted odds:** formula in the Bahamut note 1.4 (weight `1 + floor(32768 / floor(cost + 1))`, `cost = (1 + d)(1 + 2|a|)`).

## 8. Cadence (units from the rows; steps at Normal speed rounded up; seconds at 29.97 steps per second)

AGI 68: recovery = `cost_atb x 10000 / 69`, charge = `cost_cast x 10000 / 69`. First gauge: `70 x 10000 / 69 = 10,144` units, start = full x ((draw & 63) + 32) / 128, i.e. 2,536 to 7,528 units = **27 to 80 steps (0.9 to 2.7 s)**.

| Move | Charge units (steps, s) | Rest units (steps, s) | Gauge time per use |
|---|---|---|---|
| Attack | 0 | 14,492 (153, 5.11) | 153 steps (5.1 s) |
| Rocket Launcher (all four) | 8,695 (92, 3.07) | 14,492 (153, 5.11) | 245 steps (8.2 s) |
| Lifeslicer | 14,492 (153, 5.11) | 26,086 (275, 9.18) | 428 steps (14.3 s) |
| Annihilator | 30,434 (321, 10.71) | 14,492 (153, 5.11) | 474 steps (15.8 s) |

Add 30 steps for each fallen girl (monster thinking) and the effect time of each move (not measured). Cycle times from the gauge numbers alone: Special 1 one Attack per 153 steps; Special 2 cycle 704 steps (23.5 s);
Special 3 cycle 551 steps (18.4 s) with a 428-step Lifeslicer poll inserted at most three times; Special 4 average 229.5 steps per poll (7.7 s); Special 5 cycle 1,851 steps (61.8 s, 7 polls).

## 9. Differences from the public guides (the fan wiki, SinirothX, Jegged, GamerGuides, Split_Infinity)

| # | Item | Guides | Files |
|---|---|---|---|
| 1 | Attack Lv 3 STR | 155 (most), 144 (two) | **155** |
| 2 | Lv 5 threshold | 38 (wiki, Jegged) or 39 | **38 points** (`p < 380` in tens) |
| 3 | Lightning | wiki: Absorb | **neutral**; only Gravity is nulled |
| 4 | Stat Breaks | wiki text: usable; infobox: immune | **immune** (group 2 slots 7 to 13) |
| 5 | Special 5 order | seven steps (most), six (one) | **seven**, as listed |
| 6 | Special 3 | Attack, Attack, Rocket Launcher | **plus a once-per-band Lifeslicer at 60/40/20% HP** (SinirothX only) |
| 7 | Steal quantity | x2/x2, x1/x1, ... | **x1 common, x2 rare** |
| 8 | Accuracy | 0 in the encyclopedia | **95** |
| 9 | MAG / DEF / MDEF at Lv 1 | 1 | the script writes 0, the stat becomes 1 |
| 10 | Annihilator damage | 1,240 to 1,400 (wiki), about 1,500 (guides) | 1,240 to 1,400 at Attack Lv 5; **626 to 1,204 at Lv 1 to 4** |

## 10. Event side (partly decoded)

Where the Experiment fight is started and what the technician does. Meanings of flags are read from the branch structure only [M]; the byte is save offset 0xf9 (one more flag byte at 0xfa).

| Flag (byte 0xf9 bit) | Written by | Read by | Reading |
|---|---|---|---|
| bit 0 (0x01) | `djyt0300` worker 32 function 7 (twice); `djyt0800` function 9 after the maxed fight | | story progress through the Djose visit |
| bit 1 (0x02) | `djyt0300` worker 32 function 7 and worker 43 function 2; cleared by `djyt0800` functions 7 and 9 after a fight | `djyt0800` worker 33 | "the machine is ready to be fought" |
| bit 2 (0x04) | `djyt0800` functions 7 and 9 | | set after a fight |
| bit 3 (0x08) | `djyt0800` worker 33 function 1 (4.2) | same | all three level indices are 4 |
| bit 4 (0x10) | `djyt0800` function 9 | worker 33 | the maxed fight has been done |
| bit 5 (0x20) | `djyt0300` worker 32 function 8 | worker 33 | when set, the technician only talks |
| bit 7 (0x80) | `djyt0800` functions 7 and 8 (after a fight) | worker 33, worker 6 | "beaten, needs repair"; cleared by the repair |

**The technician's state** (`djyt0800` worker 33 function 1, then worker 6 for the talk) is chosen in this order: bit 5 set -> talk only; else bit 7 set -> the "needs repair" talk; else if bit 3 is set (all indices 4): bit 4 clear -> the maxed fight (function 9), bit 4 set -> talk only;
else bit 1 set -> the fight (function 7); else talk only.

**Battle starts** (`djyt0800.ebp`, worker 33): function 7 at 0x574f to 0x5797 (the cutscene fight, reached in the "bit 1 set, not maxed" state) and function 8 at 0x5f92 to 0x5fda (the fight chosen from the technician's prompt, started by a request from worker 6 at 0x16cc) both call
`btlExe(scene, 0)` with the scene taken from the Special index (0 -> 0x00ec00e5 ... 4 -> 0x00ec00e1, the table of section 1); function 9 at 0x6468 starts scene 225 outright (the maxed fight; the three indices are all 4 there, so it is the same scene the Special switch would give).

**The prompt** (worker 6) shows Attack, Defense and Special as index + 1 and offers fight or walk away. **Repair:** with the "beaten" bit set and at least one manual in the bag (with none, the technician shows a different message and nothing changes), choosing to repair takes the **first** of the five repair manuals the party holds
(important items 0x7037 to 0x703b, tested in that order, one removed), clears the "beaten" bit and reopens the fight: **a manual is spent at the repair, not at the defeat**, and nothing else is reset (the counters and indices are untouched). Up to five repairs: six fights.
The five manuals are the important items "How to Repair with Soul" (0x7037), "The Spirit of Recycling" (0x7038), "The ABCs of Repair" (0x7039), "Repairing for Dummies" (0x703a) and "Everyman's Repair Manual" (0x703b).

**After a fight** function 7 sets bits 7 and 2, clears bit 1, stores 1 and 560 in two other save fields and flips two bits of byte 0xa11; function 8 sets bit 7 and stores 565; after the maxed fight function 9 sets bits 0, 4 and 2, clears bit 1, stores 2 and flips the same byte's bits (meanings [L]).
Episode Complete and the New Game+ reset were not traced.

## 11. The dig (for completeness; not needed when the chapter chooses the levels)

Each Bikanel screen (`bika0700`, `0800`, `0900`, `1000`, `1100`, `1200`, `1300`, `1400`) rolls `(stream-2 draw & 0xffff) x 100 >> 16` (0 to 99, call 0xa6 of the common funcspace) and adds 1 to one counter.
The table is picked by story progress (the save value at 0xa00): thresholds 1500, 2900, 3900, 5900 on the two big screens (0800, 1200; four tables), 2900/3900/5900 on 0700 and 1100 (three tables), 3900/5900 on 0900, 1300 and 1400 (two tables), and a single table (9 / 16 / 5) on 1000;
which table the screens with fewer tables use at lower progress was not traced.
Each table is three blocks, rolls 0 to 30, 31 to 60 and 61 to 90, one block per category (the **order of the blocks depends on the screen**: 0800 and 1200 Attack, Defense, Special; 0700 and 1100 Defense, Attack, Special; 0900, 1000, 1300, 1400 Special, Defense, Attack);
rolls 91 to 99 and one gap value in the first block give no piece. **So every category gets exactly 30% of the digs, 10% give nothing.** Inside a block the three grades split the rolls as (weight 1 / weight 3 / weight 5, of 30):
window up to 1500: 21 / 7 / 2 (and 11 / 7 / 12 in the Special block); up to 2900: 18 / 8 / 4; up to 3900: 15 / 10 / 5; up to 5900 (progress above 3900, which includes Chapter 5 at 4900 to 5900): **9 / 16 / 5** (30% / 53% / 17% of the pieces). Full per-screen tables: `raw/dig-tables.txt`
(the progress thresholds per screen: `raw/dig-selector.txt`). Whether a dig site can be dug at all, and the items a dig can give besides pieces, were not read.

## 12. Answers to the chapter lane's questions (`research.md` section 12) and gaps (its section 11)

| # | Question | Answer | Tag |
|---|---|---|---|
| Q1 | Where are the levels; thresholds; grades; max level; repair; scripts; dig | Sections 4, 10, 11: save ints 0xb74/0xb78/0xb7c, counters 0xb98..0xba8, grades 1/3/5, **38 points for Lv 5 (G-2)**, no level above 5, a repair clears only the "beaten" bit and spends a manual, the readout and prompt in `djyt0800` workers 33 and 6, the panel in `djyt0300` worker 32, the dig tables in section 11 (**no regional lean in the category chances: 30% each; the lean is the grade mix by story window**, G-11) | H / M |
| Q2 | The nine Experiment ids; formations 225 to 229; the objects; model changes | Body m194; m195 is the part actor used by scenes 225 to 228 (8, 6, 4, 2 parts; scene 229 has none); **the scene is chosen by the Special level** (Lv 5 -> 225 ... Lv 1 -> 229); the parts are never targeted and trail the body; the other Experiment ids (196 to 200, 208, 209) are one-HP dummies in no shipped formation. The number in front of each monster in the game's own row is the model scale in percent (SinirothX's `[C2]`/`[C3]` labels cannot be matched to a column here; in the file the "objects" are the m195 part actors, 8/6/4/2/0 of them, and the row's flag columns are not decoded). The body model shows Attack and Defense modules by index and a head module only at Special 5 with Attack and Defense maxed | H / M |
| Q3 | The body's record at each level | Section 2: HP 18,324 at all levels (**G-1 -> 155; G-3 -> Lightning neutral; G-4 -> immune to the Breaks; G-15 -> ACC 95, EVA 0, LCK 0**); the script overwrites STR, MAG, DEF, MDEF only; tables in section 3; steal Turbo Ether x1 / x2, drop Elixir, AP 40, gil 0, EXP 0, Pilfer Gil 5,000 (**G-6**) | H |
| Q4 | The AI per Special level | Section 5.4: **G-5 -> the seven-step order**; **G-7 -> confirmed** (60/40/20% lines, once each in that order, highest-HP girl); Special 4 is `% 6` with Lifeslicer 1/6, launcher 2/6, Attack 3/6; targets in 5.4 and 5.5; no counter, no reaction, no phase, the time-out block is dead | H |
| Q5 | The rows | Section 6: Attack DC 16, Evasion applies to Attack only; Rocket Launcher DC 4/3/3/3, 4/6/8/10 hits, random target per hit by one stream-5 draw, never rolls (Evasion does not apply), Evade & Counter does not dodge it; **Lifeslicer** f7 power 16 = the maximum HP, no damage bits (Protect and Shell do not matter), not reflectable, cannot target a KO'd girl, never rolls (Auto-Life not traced); **Annihilator** f3 power 20 ignores MDEF, magical (Shell applies), not reflectable, never rolls, weak Delay 4,000 gauge units, Blue Bullet link to the party command 0x3053 (that row: 48 MP, power 60); charge and rest in section 8 | H |
| Q6 | Staging | Section 1: the trial-chamber map; start positions identical in all five scenes (girls (0,-19), (16,-18), (-16,-18), body (0,15)); the field next to the map is 14 (not proven to be the music) [L]; the scenes ship a message file but no camera or event script; the death is the Die row; the maxed fight differs from the others only through the Special 5 scene and the head module | H / L |
| Q7 | Size | Section 2: body real height 50.78 (raw 25.39 x scale 2.0; the size lane's engine height field 52.0), part 49.14; the parts at the formation's 92/83/66 percent are 45.2/40.8/32.4 (the same as the pre-scaled dummy models) | H |
| Q8 | The wrap-up | Section 10: a manual is spent at the repair; the all-maxed bit is 0xf9 bit 3 and the maxed fight sets bit 4; Episode Complete and the New Game+ reset were not traced | M / L |
| G-8 | Where the fight is staged | The row names the Djose Temple trial-chamber battle map (SinirothX's name) | M |
| G-9 | Annihilator damage | 1,240 to 1,400 at MAG 100 (run on the live function); lower Attack levels give less (section 6) | H |
| G-10 | Two wins required | Not a battle-file fact; the flags above (bits 4 and 7) are the only trace | L |

## 13. Open questions

1. **Animation and effect lengths** per move (when the first and last hit land after the command starts, and the actor's own time). The body's motion-frame table (`raw\extract\...\mon\mf194.txt`: the three attack motions 24, 16 and 28 frames; the special motion groups sp0, sp1, sp2 of 26, 48 and 30 frames) exists but the mapping from commands to motions was not traced; Annihilator's camera script waits add up to about 163 frames.
2. **Hits planned for a girl who falls mid-volley** (5.5): lost [M], not run.
3. **Preemptive/ambush and escape for this formation** and the meaning of the six formation flag columns, the trailing 1, 0, 0 (the same on the other boss rows) and the 14 (music?) [L].
4. **Bit 10 of the special word** (0x400, set on the bosses' records in `monster.bin`, not in the Oversoul rows) [L]; bits 8 and 9 are named by the game's header only.
5. **The effect-level number's readers** (stored on the character and the model; presentation, but not traced).
6. **Event flag meanings** beyond the branch structure (0xf9 bits 0, 2, 4, 5, the two other save fields set after a fight, byte 0xa11 bits 2 to 5), Episode Complete, New Game+ [L].
7. **Near-weighted odds in play** need the girls' real positions and the body's facing at each poll; the start-position odds are in section 1.
8. **Private-variable zero-initialisation** (assumed 0, as the earlier lanes).
9. **The unnamed tail bytes of the rows** (offsets 0x86 and 0x87: 10 on most, 20 on the 8-hit launcher) [L].
10. **Auto-Life against Lifeslicer** and **which statuses can still be put on the Experiment** beyond the resist bytes (the game's status application was not re-run for this actor).

## 14. Files and tools (local only; nothing here goes in a repo)

`D:\Tools\ffx-parity\new-chapters\ffx2-experiment\`: `re-ffx2-experiment.md` (this note); `raw\extract\` (the live VBF files read: kernel tables and headers, `mon/m194..m209` sources and packages, `btl/djyt06_225..229`, the Djose event packages, `mag/mg_0819..0823`);
`raw\experiment-data.json` (levels, record, rows, cadence as numbers), `raw\dis\` (disassemblies: `m194`, `djyt0300`, `djyt0800`, `missionsel`, `monlist`, `test02`, `testbattle`, `bika0700..1400`), `raw\dig-tables.txt`, `raw\dig-selector.txt`, `raw\nin-event.json` (inferred call argument counts),
`raw\emu_exp_damage.out.txt`, `raw\emu_spread.out.txt`, `raw\emu_revalidate_exp.out.txt`, `raw\ghidra\` (read-only decompiles), `raw\scan-savevars-*.txt`; `tools\` (the copied decoders and my own: `ev-dis.mjs`, `infer-nin.mjs`, `scan-savevars.mjs`, `flag-ops.mjs`, `dig-tables.mjs`,
`dig-selector.mjs`, `cadence-exp.mjs`, `build-json.mjs`, `exp-rec.mjs`, `emu_exp_damage.py`, `emu_spread.py`, `emu_revalidate_exp.py`). Re-run: `node tools\ev-dis.mjs dj\djyt0800\djyt0800.ebp --nin raw\nin-event.json`, `D:\Tools\ffx-parity\venv\Scripts\python.exe -I tools\emu_exp_damage.py`.
