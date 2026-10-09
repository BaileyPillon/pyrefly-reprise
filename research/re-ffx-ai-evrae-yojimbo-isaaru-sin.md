# FFX Evrae, Yojimbo, Isaaru's aeons and Sin: what the game's own AI scripts do

**Game case: FFX only.** These are the compiled boss scripts of FFX encounters; FFX-2 has its own scripts and its own
engine and gets its own notes. Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)).
Drafted 2026-10-08. **Records only: no engine or AI code was changed.**

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe/FFX_Data.vbf Steam build
25501027 (FFX.exe SHA-256 0537B2A1...686D; FFX_Data.vbf 20,701,622,962 bytes, SHA-256 starts B22025D4C39E799E, hashed again
for this note). The AI scripts are data in the archive (`ffx_ps2/ffx/master/jppc/battle/mon/_mNNN/mNNN.bin` for the
monsters, `.../battle/btl/<formation>/<formation>.bin` for the formation script that holds the cutscene scenes, the
party-side handlers and the battle-start setup). They were extracted with our own reader from the live Steam copy, decoded
with our own Atel disassembler, and every engine call they make was checked against the engine's own handler in Ghidra 12.1.4
(decompiler and disassembly). Everything is written in our own words: no script text, no game dialogue and no decompiled
code is reproduced. "Rule" tables give conditions, actions, probabilities and where in the script each rule lives (monster
id, hook, code offset). Command names are the game's own data names; the "dummy" commands (no effect, they only show a line
of text) are named by what they do and by id.

| Fight (our chapter id) | Formation | Scripts read |
|---|---|---|
| Evrae on the airship (`evrae-airship`) | `hiku15_00` | m119 Evrae, m149 Cid, m255 Magic Urn (inert here), formation script |
| Yojimbo, Cavern of the Stolen Fayth (`yojimbo-cavern`) | `nagi05_10` | m288 Yojimbo, m266 Koma Inu (Daigoro), m249 (the summoner), formation script; `lmyt01_05` (Belgemine's Yojimbo) for contrast |
| Isaaru's aeons, Via Purifico (`isaaru-via-purifico`) | `bvyt09_10`, `_11`, `_12` | m248 Isaaru, m284 Fist (our Grothia), m254 Wing (Pterya), m287 Sword (Spathi), the three formation scripts |
| Sin: Left Fin, Right Fin (`sin-fins-core`, links 1 and 2) | `ssbt00_00`, `ssbt01_00` | m136, m137, m149 Cid (Fin mode), the two formation scripts |
| Sin: Sinspawn Genais and the Core (`sin-fins-core`, link 3) | `ssbt02_00` | m139 Genais, m138 Core, formation script |
| Sin's face, "Overdrive Sin" (`sin-face`) | `ssbt03_00` | m140, formation script |

Sections: 0 method and confidence; 1 how the scripts run (engine facts every table relies on); 2 Evrae and Cid; 3 Yojimbo;
4 Isaaru's aeons; 5 the Fins; 6 Genais and the Core; 7 Sin's face; 8 differences from our AI; 9 verdicts on FINDINGS B5
and B7; 10 not decoded or still open.

## 0. How this was read, and how far to trust it

1. **Extraction.** 15 monster files, 10 formation files and the kernel tables (`command.bin`, `monmagic1.bin`,
   `monmagic2.bin`, `monster1..3.bin`) were extracted from the live E: archive; every file also present in the earlier
   lanes' extraction is byte-identical. Sizes and SHA-256 prefixes: m119 150,852 B 386d6257; m149 2,960 B 8f0c1386; m255
   4,812 B e62c7ec8; m288 51,476 B 059881a8; m266 12,212 B 3f4d0483; m249 3,424 B bc655bd8; m248 3,428 B 9839ecdf; m284
   52,884 B 920ea2ba; m254 52,724 B e03383c3; m287 33,268 B 85cf3e3f; m136 123,156 B 8f5c55f2; m137 123,188 B 7ca82f22;
   m138 37,708 B 81329ab3; m139 157,916 B 91ba4a20; m140 188,184 B 13e2725c; `hiku15_00` 25,872 B f1001699; `nagi05_10`
   26,256 B 6f8a51b3; `lmyt01_05` 6,848 B 0d63cf15; `bvyt09_10` 25,520 B fa2252cc; `bvyt09_11` 24,256 B 072908b6;
   `bvyt09_12` 7,680 B daa932df; `ssbt00_00` 29,856 B e2081498; `ssbt01_00` 28,144 B 8cc384e8; `ssbt02_00` 20,464 B 52d7184a;
   `ssbt03_00` 22,304 B 3b5ff829.
2. **Disassembly was verified by running it.** Besides reading every branch, every AI hook of every monster above was
   executed by an independent small interpreter of the script instruction set (private, outside the repo: the Seymour lane's
   interpreter plus the array opcodes and a dozen more engine calls) against a mock battle, with the real command-table
   fields behind `readCommandProperty`. Run: Evrae's turn in both ranges and both phases and his hit handler for 34 different
   commands, the Haste edge cases, Cid's whole order and missile loop together with the formation's own scene functions and
   the two party pre-turn handlers; Yojimbo's turn for every gauge band over all 65,536 results of the shared random number
   (exact tallies), his hit handler and Koma Inu's reaction; the three aeons for every branch (aeon out, Yuna alone, gauge
   edges, defeat check); both Fins over every random result and over all 16,384 buff layouts of the party crossed with the
   Fin's Breaks (0 mismatches against a closed form); Genais and the Core likewise (the same 16,384 layouts, the 36,000-wide
   modulus tallies, the score decay, every threshold edge); Sin's first 14 turns and the Gaze counter for the party, an aeon
   and the Magus Sisters. In every case the run reproduced the reading below. The interpreter implements only the calls that
   decide behaviour; cosmetic calls (camera, motion, sound) are ignored.
3. **Engine handlers read** (VA in FFX.exe): the Atel call dispatcher and the VM jump routine (as in the Seymour note);
   findMatchingChr 0x7a5af0 with its picker 0x7acd40; performCommand 0x7a44b0 and forcePerformCommand 0x7a49f0 (with
   their call frames, see 1.1); the queue 0x7ac9c0; the target-group resolvers 0x794330 and 0x7947f0; dereferenceCharacter
   0x7a6a80; CurrentBattle 0x7a4e90 -> 0x782970; overrideAttemptedCommand 0x7a66a0 -> 0x7ac940; readCommandProperty 0x7a6390 ->
   0x78cd30; usedCommand 0x7a62d0; isCounterattackAllowed 0x7a8450 with the can-act test 0x7b24a0; the hook requester
   0x7aceb0 and the call sites of its 14 callers (turn start 0x792a90, action executor 0x792210, target loop 0x7ad0c0, hit
   application 0x78f060 and its caller 0x78d980, death check 0x78c740, action end 0x7b20e0, poison tick 0x7afab0 and seven
   more); the range check 0x791fa0 with the reach function 0x799690; the monster setup 0x79b4f0; the CTB scheduler 0x790fb0
   and the action-rank store 0x7892e0; the start-type writer 0x7a4cd0; the per-aeon enable flag (0x7a6ef0 -> 0x79b470, read
   by 0x79a5b0 and 0x79a080); the status-property getter 0x7b2dc0; the scene starters 0x7a5540 and 0x7a5780.
4. **Confidence labels used in the tables.** **A** = the rule was run in the interpreter and matches the reading (all
   numbers and branch orders). **B** = rests on an engine handler read in Ghidra but not executed. **C** = inferred, or a
   cutscene scene read only partly. Unlabelled rows are A.

## 1. How the scripts run (the engine facts every table below relies on)

Shared mechanics (hooks, the queue, the random sources, scenes, Talk) are described in section 1 of
[re-ffx-ai-seymour.md](re-ffx-ai-seymour.md) and were re-checked here. What follows is what this lane added or tightened.
Function-table entries (`f2 @0x1d5`) are the code offsets the file's table binds to each hook.

### 1.1 Hooks, and the answer to "per hit or per action"

Each monster has one "AI" worker with up to nine entry points, named by tag: 0 onTurn, 1 preTurn, 2 onTargeted, 3 onHit,
4 onDeath, 6 postTurn, 8 postPoison (5 and 7 are raised by the movement code and are not used here). The hook requester has
14 callers in the whole executable; every call site was checked for its tag, and the hit application, executor, turn start,
target loop and action-done functions were read in full. B

* **onHit (tag 3) is raised from one place, `pp_BtlApplyHitRecords` 0x78f060.** Each call of it applies the next pending
  hit record of one target of one sub-action (HP/MP/CTB change, status copy-back, the party-side Overdrive hooks) and
  advances that block's index; its caller 0x78d980 runs it again each frame for every target in the action's mask. **The
  hook is requested when the last record of that target's block has been applied, and only once** (a flag in the block).
  So the hook fires **once per sub-action per target, after the last hit**: a 12-hit move, a Doublecast half, a miss and a
  status-only move that owns a hit record each raise one event; a command with zero hits (the Trigger Commands, the dummy
  captions) raises none. It runs before the death check. A Doublecast is two sub-actions and so two events. B
* **The two functions the anchor map lists as the "hit-event handler" (0x7afe00, 0x7b1b50) are not hook callers.** 0x7b1b50 is
  Wakka's reel-result builder (its own debug string names the reels) and 0x7afe00 rebuilds pending hit results for the
  minigame-style Overdrive actions (it shuffles with stream 16; its switch is on the command's type byte `Cmd+0x58`).
  Neither is among the callers. Yojimbo's gauge gain is the AI script's own onHit handler. B
* **Reactions.** Commands queued from onTargeted, onHit and onDeath become reaction records of the hook's owner and add no
  CTB. The hook script *runs* whatever the circumstances; only what it *queues* is filtered, in the requester 0x7aceb0:
  a `performCommand` reaction is kept only if the owner can act (not Petrified, Confused, Berserk, asleep, Ejected or
  Threatened; Provoked blocks too unless the script marks itself as keeping control) **and** the attacker's own current
  record is a normal turn (`Chr+0xdf1` = 0, so not a party counter-attack or other reaction) **and** the owner has no
  reaction already pending (0x7b0720). `forcePerformCommand` skips the owner test and sets a flag that skips the other two
  (read from the call frames: the fourth argument of the queue function is the leftover stack word 0 after 0x7a44b0's
  group-resolver call and 1 after 0x7a49f0's). **A script that only changes its own variables therefore still sees every hit
  event, including those caused by a party counter-attack; only its queued commands are lost.** B
* **`isCounterattackAllowed()`** (0x7a8450) = "the owner is not Petrified/Confused/Berserk/asleep/Ejected/Threatened
  (Provoked and not-in-battle are allowed) and its last attacker exists and is not itself running a reaction record". B
* **onTargeted** runs per target before the range check, but not for a target that already has a reaction queued. B

### 1.2 Group specs and the "is an aeon out" test

`FrontlineChars` = every non-monster actor that is in the battle and not removed (a KO'd character stays in it; the alive
filter belongs to `findMatchingChr`). `AllActors` = every actor in the battle. `dereferenceCharacter(group)` returns the
character number of the **lowest-numbered actor in the group**. Because summoning an aeon removes the party from the battle
(the Seymour note, 1.2), `dereferenceCharacter(AllActors)` is the lowest party member (0 to 6) while the party is in front
and the aeon (8 Valefor, 9 Ifrit, 10 Ixion, 11 Shiva, 12 Bahamut, 13 Anima, 14 Yojimbo) while one is out. The three Magus
Sisters (15 to 17) fall in the "default" case of every switch that uses it. **The Fins and Sin use this as their "an aeon
holds the field" test, not the identity of whoever hit them.** B (A for the scripts' use of it)

`Character 1/2/3` (group specs -6, -7, -8) are the three active party slots in menu order, alive or not; a slot the summon
routine emptied reads 0 on every status and the aeon's statuses count in the summoner's slot (the Seymour note, 1.2). Every
"slot 1, 2, 3" below means these, not left and right on screen. A dead monster leaves the battle when its death-animation value
is not 0 (the death check 0x78c740 clears the in-battle flag, `Chr+0xdc8`, when `Chr+0x3f5` is set, and property 79 writes that
byte), so `AllMonsters` and the monster-number specs stop counting it. B

### 1.3 Reach and BattleDistance (settles S-28)

`BattleDistance` is a signed byte on the actor (`Chr+0x4ff`). A command can pick a target when `reach >= target's
BattleDistance`, or when the target is the user (0x791fa0). The reach of a command is `bit 7 of its target flags + 2 * bit 0
of its usage flags` (0..3, from the kernel records), except that a command with usage bit 1 set counts as 3 when the user is
Wakka, Valefor or Anima (0x799690); that bit is set on the plain weapon commands (Attack, Delay Attack and Buster, the Breaks,
the status Attacks, Mug, Quick Hit, the Extract and Nab moves), so Wakka's own weapon commands reach at any distance. In these
fights a party member's own BattleDistance is 0, so only the monster side's distance matters. Read from the real command
table:

| Reach | Party commands |
|---|---|
| 0 (needs distance 0) | every melee/weapon command (Attack, Delay Attack and Buster, the status Attacks, the four Breaks, Mug, Steal, Quick Hit, Threaten, Provoke, the Extract and Nab moves), the physical Overdrives of Tidus, Auron and Kimahri, Kimahri's other Ronso Rages (Nova, Stone Breath, Aqua Breath, Bad Breath, White Wind...), the plain Attacks of Ifrit, Ixion, Shiva, Bahamut and Cindy and Sandy, Oblivion, Camisade, Razzia, Passado |
| 1 (distance <= 1) | the aeon Overdrives Hellfire, Thor's Hammer, Diamond Dust, Mega Flare, Zanmato and Delta Attack, Spare Change, Fire Breath |
| 2 (distance <= 2) | **Use and every item**, **Wakka's four Overdrive reels**, Rikku's Mix recipes, Seed Cannon, Valefor's Energy Blast and Energy Ray, the gunner shots |
| 3 (any distance) | every spell (the Fury versions too), Lancet, Scan, Cheer/Aim/Focus/Reflex/Luck/Jinx, Pray, Defend/Guard/Sentinel, Doom, the Attack commands of Valefor, Anima and Mindy (0x30cb, 0x30db, 0x30e8), Sonic Wings, Meteor Strike, Aerospark, Heavenly Strike, Impulse, Pain; and the Trigger Commands "Move in" and "Cancel" (but not "Pull back", reach 0) |

The reach classes were computed for every record of `command.bin`, the item table and the two monster-magic tables from the two
flag bytes above (the owner of each aeon command is as mapped in [re-ffx-commands.md](re-ffx-commands.md)). So at distance 3 (the Fins at the start, Evrae when FAR, Sin at the start and after his first pull) only
reach-3 commands land; at distance 1 (Sin after his second pull) Use, items, Wakka's reels, Spare Change, Fire Breath and the aeon
Overdrives of reach 1 do land and melee does not; at 0 everything does. B

### 1.4 The cost of a turn with no command, and scenes

Every command these scripts use has rank 3 (kernel records). The scheduler stores rank 3 in `Chr+0xde8` each time an actor's
counter reaches 0 (0x790fb0); the action orchestrator overwrites it with the rank of the command that actually runs
(0x7892e0). A turn in which the AI queues nothing (Cid carrying out an order, Sin's mouth turns) therefore pays the default
**rank 3**. B

`runBtlSceneA/B(n)` starts the formation script's scene `n`, the function bound at slot 62 tag `n`; it is ignored if a scene
is already running. A pre-turn scene finishes before the same turn's onTurn runs, because turn start returns while a scene is
active (0x792a90 tests the scene flag after the pre-turn request). B Scenes spend no CTB. **They do draw from the shared random
stream 2** (voice-line choices; counted per fight below), which matters for an exact replay.

### 1.5 Status properties, the start type, and the random sources

* `readBtlChrProperty(group, StatusX)` for Shell, Protect, Reflect, the Nul statuses, Regen, Haste and Slow returns **1 per
  actor whose turn counter is non-zero**, summed over the group (0x7b2dc0), so `== 1` and `!= 0` mean the same on one actor;
  the Breaks are permanent-status bits, also 0 or 1. B
* `SetAmbushState(n)` writes the battle start type (0x7a4cd0; 0 and 3 are the "normal" kinds). Every formation here writes 0
  or 3. Whether the script's write lands after the opening roll was not traced. C
* Random sources used by these scripts: **only** `GetRandomValue()` (stream 2, `& 0xFFFF`) and `findMatchingChr` (stream 4,
  uniform over the alive and targetable members in ascending actor order, no draw with fewer than two candidates). None of
  them uses the battle-script random op (streams 14/15), `GetRandomInRange`, or the action-list shuffle (stream 16). The
  moduli are slightly uneven: `mod 3` residue 0 occurs 21,846 times of the 65,536 and residues 1 and 2 occur 21,845;
  `mod 5` residue 0 occurs 13,108 times and the rest 13,107; `mod 12` residues 0 to 3 occur 5,462 times and the rest 5,461;
  `mod 100` residues 0 to 35 occur 656 times and the rest 655; `mod 2`, `mod 4`, `mod 8` and `mod 16` are exact. A

### 1.6 Opening and speeds

Where a formation or a monster sets the opening state, it is a "start hook" of the same shape as in the Seymour note: First
Strike := 1 on the boss, its CTB counter := 0, and each of the seven party counters (three active, four reserve) += 1. The
Evrae and Fin formations have none. Speeds (tick speed by Agility from the CTB note; every command here has rank 3, so
recovery is three times the tick): Evrae 20 -> tick 10 -> 30 (15 hasted); Cid 11 -> 14 -> 42; the Fins and the Core 20 -> 10
-> 30; Genais 25 and 26 -> 9 -> 27; Sin's face 30 -> 8 -> 24; Yojimbo 32 -> 8 -> 24; Fist 18 -> 11 -> 33; Wing 21 and
Sword 20 -> 10 -> 30.

## 2. Fight 1: Evrae and Cid on the airship (formation `hiku15_00`)

Actors: **20 Evrae** (m119: HP 32,000, MP 500, STR 36, DEF 0, MAG 30, MDF 0, AGI 20, LCK 15, ACC 100; resists Fire, Ice,
Thunder and Water; immune to Death, Zombie, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Silence, Magic Break and Armor
Break; Dark and Slow resistance 50; Power Break, Mental Break, Threaten, Haste and the buffs 0), **21 Cid** (m149: HP 410, not
targetable; one command, Guided Missiles) and **22 Magic Urn** (m255; see 2.7).

| Script | init | preTurn | onTurn | onTargeted | onHit | onDeath |
|---|---|---|---|---|---|---|
| m119 (AI worker w1) | f0 @0x0b5 | none | f2 @0x1d5 | f3 @0x30b | f4 @0x3e8 | f5 @0x539 |
| m149 (w0) | f0 @0x000 | f2 @0x05f | f3 @0x105 | none | none | none |
| formation `hiku15_00` | f0 @0x000 | Tidus f2 @0x694, Rikku f2 @0x6cc | scenes (slot 62): A0 @0x0e3 (the move), A1 @0x179 and A2 @0x3e4 (voice lines), A3 @0x62e (tutorial text) | | | |

### 2.1 Battle start

* Formation init (@0x003 to 0x0de): Escape and Flee off for party actors 0 to 6; the order variable (bv0x04) := 0;
  **"Pull back" is added to Tidus (0) and Rikku (6) only**; the start type is written 3 here and 0 by the slot-63 init at
  @0x348c (which write lands last was not traced, C). The slot-63 init also takes the Urn (actor 22) out of play (no turns, not
  targetable, not on the CTB bar) and sets the airship special-battle flag (@0x34e0). No start hook, no CTB override: the
  ordinary opening applies.
* Evrae init (@0x0b5 to 0x1d0): presentation values; floating; DeathAnimation "boss" (the body stays); **Haste line :=
  maxHP / 3 with integer division = 10,666** (@0x1cd). Evrae starts at BattleDistance 0 (NEAR): nothing writes it.
* Cid init (@0x009 to 0x057): not targetable; **Agility := 11** (the kernel record says 16); not required for victory;
  **missile counter := 4**; reads the battle id and keeps it.

### 2.2 Variables

| Holder | Meaning | Written by |
|---|---|---|
| bv0x04 `order` | 0 none pending; **1 = Pull back pending; 2 = Move in pending** | Evrae onTargeted (1/2/0), the Haste-phase Scythe (0), scene A0 (0) |
| bv0x0c | who gave the order (0 Tidus, 6 Rikku), read by the voice scene A2 | Evrae onTargeted |
| bv0x10 | which caption Cid's scene A1 plays | Cid |
| bv0x14 | written 0 by Evrae's Haste-phase Scythe; read by no script of this battle | Evrae |
| bv0x20 | "tutorial scene shown" flag | Tidus/Rikku pre-turn |
| Evrae `v7` | cycle slot 0 to 3 | Evrae onTurn (advances only at NEAR) |
| Evrae `v8` | **Stone Gaze counter** | Evrae onHit |
| Evrae `v9` | **Haste phase** (255 once triggered, never cleared) | Evrae onHit |
| Evrae `v10` | Haste line, 10,666 | init |
| Evrae `v11` | one-event guard after the Haste trigger | Evrae onHit |
| Evrae `v12` | **Delay count**: Delay Attack +1, Delay Buster +3 | Evrae onHit |
| Cid `v2` | missile counter (4, 3, 2, 1, 0) | Cid onTurn |

### 2.3 Evrae's turn (m119 onTurn, in order)

| # | Condition | Action | State change | Src |
|---|---|---|---|---|
| 1 | NEAR (BattleDistance != 3), `v7` = 0 or 1 | pick one alive, targetable front-line member (stream 4); **if `v8` > 5: Stone Gaze on it and `v8` := 0, else Attack (0x407f) on it** | `v7` += 1 | @0x27a, 0x28d to 0x2bf |
| 2 | NEAR, `v7` = 2 | **Inhale** (a dummy aimed at himself) | `v7` := 3 | @0x2c8 |
| 3 | NEAR, `v7` = 3 | **Poison Breath** on the whole front line (magic, power 36, Poison 100%) | `v7` := 0 | @0x2de |
| 4 | FAR (BattleDistance = 3), `v7` = 3 (he inhaled and the ship then pulled back) | the "cannot reach" dummy (0x6065) on himself: no damage | `v7` := 0 | @0x1f2 to 0x204 |
| 5 | FAR, Haste phase (`v9` = 255), `v7` != 3 | **Swooping Scythe** on the whole front line; then **BattleDistance := 0**, `order` := 0, bv0x14 := 0, "Move in" and "Cancel" removed from Tidus and Rikku, "Pull back" added | | @0x20e to 0x268 |
| 6 | FAR, no Haste phase, `v7` != 3 | **Photon Spray** on the whole front line (8 hits, each a random target) | none (`v7` does not move at FAR) | @0x271 |

The cycle is Attack/Gaze, Attack/Gaze, Inhale, Poison Breath, and **only NEAR turns advance it**. A charge that survives a
retreat is paid out as the dummy on the next FAR turn and the cycle restarts. Attack and Stone Gaze share one target pick.
Random draws: stream 4 once per Attack/Gaze turn (two or more candidates); stream 2 none. A

### 2.4 What Evrae does when targeted (m119 onTargeted, @0x30b)

| Command used | Action | Src |
|---|---|---|
| **Pull back** (0x3107) | `order` := 1; who := the user; remove "Pull back" from Tidus and Rikku; start voice scene A2 | @0x324 to 0x357 |
| **Move in** (0x3106) | `order` := 2; who := the user; remove "Move in"; scene A2 | @0x35f to 0x392 |
| **Cancel** (0x3108) | `order` := 0; remove "Cancel"; give back **Move in if Evrae is FAR, else Pull back** | @0x39a to 0x3e6 |
| anything else | nothing | |

The three Trigger Commands are ordinary commands aimed at Evrae: "Pull back" has reach 0 (so it only works while he is NEAR),
"Move in" and "Cancel" reach 3. None has a hit record, so they raise no onHit event. B

### 2.5 What Evrae does when hit (m119 onHit, @0x3e8), once per action

Order of evaluation, with `v11` the guard flag:

| # | Condition | Action | Src |
|---|---|---|---|
| 1 | `v11` = 1 | clear it and stop (this swallows the hit event of the Haste action itself) | @0x3fb, 0x535 |
| 2 | **Haste phase** and FAR | **Swooping Scythe** on the front line; BattleDistance := 0; `order` := 0; "Pull back" restored to Tidus and Rikku; stop | @0x405 to 0x469 |
| 3 | Haste phase, NEAR, Slow on him | **Haste** on himself (command 0x3036); stop | @0x479 to 0x482 |
| 4 | Haste phase, otherwise | nothing | |
| 5 | otherwise (phase 1): read the command's damage-formula byte `f` (for a weapon-flagged command the byte is Evrae's own record value, 1) | **`f` = 1: `v8` += 2; `f` = 3: `v8` += 1; any other `f`: nothing**; Delay Attack: `v12` += 1; Delay Buster: `v12` += 3 | @0x489 to 0x4e8 |
| 6 | then: **HP < 10,666** (strict) | `v9` := 255, `v11` := 1, **Haste on himself** | @0x4f5 to 0x50d |
| 7 | else **`v12` >= 3** | the same Haste | @0x517 to 0x52c |

What counts for the counter (row 5), computed for every record of the command and item tables (the damage-formula byte, or 1 for
a weapon-flagged command): **+2** (byte 1) for every weapon command (Attack, Delay Attack and Buster, the status Attacks and
Busters, Triple Foul, the four Breaks, Full Break, Mug, Quick Hit, the Extract moves, Nab Gil), Provoke, Seed Cannon, Wakka's four
reels, Spiral Cut, Slice & Dice, Energy Rain, Blitz Ace, Shooting Star, Dragon Fang, Banishing Blade, Tornado, Jump, Thrust Kick,
Stone Breath, the gunner shots, every aeon's plain Attack and the aeon commands of byte 1 (Sonic Wings, Meteor Strike, Aerospark,
Heavenly Strike, Impulse, Oblivion, Zanmato, Delta Attack, Daigoro, Kozuka, Wakizashi, Camisade, Razzia, Passado), and, an oddity
of the table, the Mix recipe Panacea; **+1** (byte 3) for every damaging spell and Fury, Lancet, Scan, Esuna, Dispel, Holy,
Auto-Life, Shell, Protect, Reflect, Regen, the four Nul spells, Death, Bio, Drain, Osmose, Flare, Ultima, Doom, Bad Breath,
Mighty Guard, the Mix recipes from NulAll through Eccentrick (not the grenades or the healing recipes), Requiem and the curtain
and spring items; **0** for Cheer/Aim/Focus/Reflex/Luck/Jinx, Defend and its kin, Threaten, Pray, Cure/Cura/Curaga,
Life and Full-Life, Haste/Hastega/Slow/Slowga, Demi, Spare Change, Fire Breath, Aqua Breath, Nova, White Wind, the grenade
recipes, ordinary items, Valefor's Energy Blast and Ray and the Overdrives Hellfire, Thor's Hammer, Diamond Dust, Mega Flare and
Pain, and Cid's Guided Missiles. Steal, Use and Doublecast have no hit record, so they raise no hit event at all. Hits by Cid
count as nothing for the counter but do run the Haste tests. Once the Haste phase has started the counter stops counting,
**but a value above 5 still triggers one Stone Gaze at the next Attack slot**. Confidence A (the hook and every row, run for 34
commands; the classes by the kernel records); the "once per action" cadence is B.

Notes: (a) the Haste is a queued reaction, so a Threatened or otherwise disabled Evrae sets `v9` and `v11` without actually
being Hasted. (b) Three Delay Attacks or one Delay Buster start the Haste phase without any HP loss. (c) The Haste is Evrae's
use of the player's Haste command (0x3036) on himself, so it halves his pending counter and his recovery like any Haste. A

### 2.6 Cid (m149) and the orders

Cid's program branches on the battle id (this formation's id is `(0x18B << 16) | 0`). Evrae-battle branch:

| Hook | Condition | Action | Src |
|---|---|---|---|
| preTurn | `order` = 0, Evrae FAR, missile counter = 4 | caption scene (his first FAR turn) | @0x066 to 0x099 |
| preTurn | `order` = 1 | his voice-line scene for a retreat (one stream-2 draw) | @0x0a3 to 0x0af |
| preTurn | `order` = 2 | his voice-line scene for closing in (one stream-2 draw) | @0x0b8 to 0x0be |
| onTurn | `order` = 0, Evrae FAR, counter 4, 3 or 2 | **Guided Missiles at Evrae** (12 hits, rank 3, fixed formula 9); counter -= 1; caption scene | @0x14f to 0x1af |
| onTurn | `order` = 0, Evrae FAR, counter 1 | caption scene only (the last-volley line); counter := 0 | @0x136 to 0x149 |
| onTurn | `order` = 0, otherwise | nothing | |
| onTurn | **`order` = 1 (Pull back pending)** | add "Move in" to Tidus and Rikku; **scene A0 sets Evrae's BattleDistance := 3 and `order` := 0** | @0x1e4 to 0x1fc |
| onTurn | **`order` = 2 (Move in pending)** | add "Pull back" to Tidus and Rikku; **scene A0 sets BattleDistance := 0 and `order` := 0** | @0x208 to 0x217 |

So Cid has **three volleys**, a fourth FAR turn that is a caption only, then nothing; every order costs the Cid turn it is
executed on (no volley that turn); his missiles fire only when no order is pending. He acts at Agility 11 (42 ticks per
turn). A

Tidus's and Rikku's pre-turn handlers (formation @0x694, @0x6cc): on their first turn, a tutorial text scene; at **every**
turn start remove "Cancel" and re-add it **only if an order is pending**. So the Trigger menu at any moment is exactly one of:
Pull back (NEAR, nothing pending), Move in (FAR, nothing pending), Cancel (an order pending). **There is no way to queue a
second order or a redundant one, and "last order wins" does not exist; Cancel is the only change of mind.** The commands exist
only on Tidus and Rikku. A

Timeline of one retreat (run end to end with the real scene functions): Tidus uses Pull back -> Evrae.onTargeted sets `order`
1 and removes the command -> the next pre-turn of Tidus and of Rikku offers Cancel -> on Cid's next turn the pre-turn caption
plays, then onTurn adds Move in and scene A0 flips BattleDistance to 3 and clears `order`. Evrae keeps acting at NEAR until
that moment. A

Randomness spent by the scenes (stream 2): scene A1 draws once (`mod 2`, which of two voice lines) for the two "order pending"
captions and not at all for the missile captions; scene A2 (the voice reply of whoever gave the order, Tidus or Rikku) draws `mod
100` once and a second time when that draw is below the speaker's threshold (255 at first, afterwards the speaker's previous second
draw), which re-rolls the threshold. The two Fin formations repeat the pattern. A

### 2.7 The Magic Urn (m255) is inert in this battle

Its hit handler and its init key on two other battle ids; in `hiku15_00` they do nothing. B

### 2.8 Confidence

All of 2.3 to 2.6 are A. The cadence of onHit (once per action) and the timing of the retreat relative to Evrae's own turns
are B. Not decoded: the on-screen text each caption selector shows.

## 3. Fight 2: Yojimbo in the Cavern of the Stolen Fayth (formation `nagi05_10`)

Actors: **20 the summoner** (m249, kernel name "Mira", our Lady Ginnem: HP 10, a bystander), **21 Yojimbo** (m288: HP 33,000, MP
2,000, STR 34, DEF 80, MAG 35, MDF 0, AGI 32, LCK 15, ACC 0; Threaten resistance 0, Slow, Sleep, Silence, Dark, Poison, the
Breaks, Provoke and Death immune) and **22 Koma Inu**, Daigoro (m266: HP 1, STR 25). Yojimbo's program also contains the
Belgemine battle (`lmyt01_05`, id `(446 << 16) | 5`), whose differences are listed at 3.5.

| Script | init | onTurn | onTargeted | onHit | onDeath |
|---|---|---|---|---|---|
| m288 (w0) | f0 @0x000 | f2 @0x1dd | none | f3 @0x530 | f6 @0x56b |
| m266 (w1) | f0 @0x00f | f2 @0x125 (empty) | none | f3 @0x126 | none |
| m249 (w0) | f0 @0x000 | all hooks empty | | | |
| formation `nagi05_10` | f0 @0x000; start hook (slot 137) @0x4bbf | | | | |

### 3.1 Battle start

Formation: Escape and Flee off for the seven party actors; start type 3. **Start hook** (@0x4bbf to 0x4c68): Yojimbo's First
Strike := 1 and CTB counter := 0; every party slot (three active, four reserve) counter += 1. Yojimbo init: DeathAnimation
"boss", Overdrive bar shown, **Overdrive maximum := 100**, "Tough", hidden birth, the Belgemine stat block only when the
battle id is Belgemine's; the summoner is monster 249 here. The gauge starts at 0 (the monster setup writes 0). The summoner
and Daigoro are not targetable, not on the CTB bar and not required for victory. A, B

### 3.2 Yojimbo's turn (m288 onTurn, in order)

| # | Condition | Action | Gauge | Src |
|---|---|---|---|---|
| 1 | first turn | **Summon** (a no-damage command, 0x4090) aimed at the summoner (actor 20) | unchanged | @0x33c to 0x372 |
| 2 | gauge >= 100 | gauge := 0, then **Zanmato** on the whole front line (fixed formula 6, power 200, no accuracy roll) | **then +2: it ends at 2** | @0x382 to 0x39a |
| 3 | gauge >= 80 | draw `mod 4`: 0 **Wakizashi** (a random alive front-line member), 1 **Kozuka** (the same), 2 and 3 **Daigoro** (the order) | +2 | @0x3aa to 0x419 |
| 4 | gauge >= 50 | draw `mod 5`: 0 Wakizashi, 1 Kozuka, 2 to 4 Daigoro | +2 | @0x429 to 0x498 |
| 5 | gauge >= 25 | draw `mod 4`: 0 Kozuka, 1 to 3 Daigoro | +2 | @0x4a8 to 0x4f1 |
| 6 | otherwise | Daigoro, no draw | +2 | @0x4fa |

The +2 is added at the join point after every row except the first turn, capped at 100 (@0x506 to 0x52f). **Exact odds (all
65,536 results):** band 80 to 99: Wakizashi 25.000%, Kozuka 25.000%, Daigoro 50.000%; band 50 to 79: Wakizashi 20.001% (13,108),
Kozuka 20.000% (13,107), Daigoro 59.999% (39,321); band 25 to 49: Kozuka 25%, Daigoro 75%; below 25 Daigoro. One stream-2 draw
per turn in the three upper bands, none otherwise; stream 4 once per Wakizashi/Kozuka (two or more candidates), none for
Daigoro and Zanmato. From a gauge of 0, fifty ordinary turns (+2 each) reach 100 and the next ordinary turn is Zanmato; the
gauge is then 2. A

### 3.3 Yojimbo's hit handler (m288 onHit, @0x530)

If `isCounterattackAllowed()` (1.1), the gauge gains **3** (capped at 100). Nothing else. **Once per action that reaches him,
after its last hit**; a miss counts; a party counter-attack does not (the attacker's record is a reaction); and nothing is
gained while he is Threatened (his one reachable disabling status: the others are immune). A (script), B (cadence and gate)

### 3.4 Daigoro and the bystanders

* **Daigoro is two steps.** Yojimbo's "Daigoro" (0x4086, no damage, one hit record) is aimed at actor 22, the dog. The dog's
  program has one handler, onHit (m266 @0x126): **if `isCounterattackAllowed()`, pick a random alive, targetable front-line
  member (stream 4) and queue Daigoro's own bite (0x40B1, physical, power 20, rank 3) as a reaction**, which pays no CTB and
  uses the dog's own Strength 25. The dog's onTurn is empty. B for the chain, A for each handler.
* The summoner has no behaviour at all (every hook is empty). Both bystanders keep Agility-0 CTB counters (tick 28); whether
  the engine skips their empty turns was not decoded. C
* Yojimbo's death handler only swaps in a "Die" command as the death animation.

### 3.5 Belgemine's version (`lmyt01_05`), for contrast

With battle id `(446 << 16) | 5` the init rewrites the stat block (HP/MP 32,000/1,200, STR 30, MAG 45, AGI 25, EVA 50,
ACC 15), the summoner is Belgemine, the first turn adds a scene, and **at every turn, if no recruited aeon (actors 8 to 13,
15 to 17) has HP above 0, the battle ends as "PlayerEscaped"**. The Cavern fight uses none of that. Belgemine's formation has
the same start hook and disables Yuna's other commands. A

### 3.6 Confidence

A for everything that is arithmetic or order. B for the cadence, the reaction gates and the Daigoro chain. C for the idle
bystander turns. Not decoded: the cutscene around the first turn.

## 4. Fight 3: Isaaru and his three aeons (formations `bvyt09_10`, `_11`, `_12`)

Three separate battles, each with **20 Isaaru** (m248: HP 10, a bystander) and **21 the aeon**: Fist (m284, our Grothia: HP 8,000,
MP 600, STR 23, DEF 10, MAG 21, MDF 0, AGI 18; absorbs Fire), Wing (m254, Pterya: HP 12,000, MP 1,000, STR 20, DEF 10, MAG 18,
MDF 10, AGI 21), Sword (m287, Spathi: HP 20,000, MP 1,500, STR 31, DEF 0, MAG 38, MDF 0, AGI 20). All three are immune to Death,
Zombie, Petrify, Poison, the Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Dark and Slow; their Threaten resistance is 0.
Battle ids: `(419 << 16) | 10, 11, 12`. Every number below is the record value; the extra stat blocks inside the scripts belong
to other battle ids.

| Script | init | onTurn | onHit |
|---|---|---|---|
| m248 | f0 @0x000 | empty | empty |
| m284 Fist | f0 @0x000 (this battle @0x1b5 to 0x1d3) | f2 @0x271 | f3 @0x6f8 |
| m254 Wing | f0 @0x000 (this battle @0x13f to 0x151) | f2 @0x1d7 | f3 @0x604 |
| m287 Sword | f0 @0x000 (this battle @0x12a to 0x178) | f2 @0x228 | f3 @0x4bd |

### 4.1 Formation setup (all three)

Escape, Flee and Switch off for everyone; **Defend off** (`setDefendingEnabled(0)`); **Yuna (actor 1) keeps only Summon** (Attack,
Item, Weapon, Armor, Black and White Magic, Skill and Special disabled); the start type is written 0 by one init worker and 3
by the other (both are "normal" kinds); and **the one aeon that mirrors the enemy is made unavailable** (a per-aeon enable flag set to 0: **Ifrit against Fist,
Valefor against Wing, Bahamut against Sword**; Belgemine's formation does the same to Yojimbo). Start hook (slot 137): the aeon's
First Strike := 1 and CTB := 0, each party slot += 1. A (script), B (what the flag does)

### 4.2 The defeat check

At the start of its own turn, and in the formation at the start of Yuna's turn, the check asks whether any **recruited** aeon
other than the mirror has HP above 0 (Fist: actors 8, 10 to 14, 16, 15, 17; Wing: 9 to 14, 16, 15, 17; Sword: 8 to 11, 13, 14, 16,
15, 17; "recruited" is the save-record join flag, so an aeon that has not been summoned yet counts if its HP is above 0). If none
does, **the battle ends as a Defeat**. B for the join flag; whether an unsummoned aeon's HP reads above 0 at battle start is C.

### 4.3 Grothia (Fist, m284 onTurn, this battle's rows @0x271 to 0x6f7)

| # | Condition | Action | Gauge | Src |
|---|---|---|---|---|
| 1 | first turn | **Summon** aimed at Isaaru | **starts at 100** | @0x3d6 to 0x42f |
| 2 | an aeon of Yuna's is in the front line, gauge >= 100 | gauge := 0, **Hellfire** on the front line (a second Hellfire id, same numbers, when Anima is the aeon out) | 0 | @0x525 to 0x555 |
| 3 | an aeon is in the front line, otherwise | pick one alive front-line member (stream 4), draw `mod 3`: 0 **Fira**, else **Attack** (0x4000) on it | +5 | @0x567 to 0x5c5 |
| 4 | no aeon in the front line (Yuna alone) | **Attack** (0x407f) on the alive front-line member, **without looking at the gauge** | **+5 (capped at 100)** | @0x5d7 to 0x612 |

Fira odds 21,846 / 65,536 = 33.334%, Attack 66.666%. "An aeon is in the front line" is `countChrOverlap(front line, all
aeons)`. A

### 4.4 Pterya (Wing, m254 onTurn @0x1d7 to 0x603)

| # | Condition | Action | Gauge | Src |
|---|---|---|---|---|
| 1 | first turn | **Summon** aimed at Isaaru | **starts at 0** | @0x33c to 0x37a |
| 2 | an aeon out, gauge >= 100 | gauge := 0, **Energy Ray** on **one** alive front-line member (stream 4) | 0 | @0x39d to 0x3d7 |
| 3 | an aeon out, otherwise | pick one member (stream 4), draw `mod 3`: 0 **Sonic Wings**, else **Attack** (0x4000) | +10 | @0x3e9 to 0x444 |
| 4 | no aeon out | **Attack** (0x405c) on Yuna | **+10** | @0x459 to 0x494 |

Same 33.334% / 66.666% split. A

### 4.5 Spathi (Sword, m287 onTurn @0x228 to 0x4bc)

| # | Condition | Action | Gauge | Src |
|---|---|---|---|---|
| 1 | first turn | **Summon** aimed at Isaaru | starts at 0 | @0x38d to 0x3c8 |
| 2 | gauge >= 100 | gauge := 0, **Mega Flare** on the front line (Yuna if no aeon is out) | 0 | @0x3e6 to 0x404 |
| 3 | otherwise | no command: a caption scene counting five to one | **+20** | @0x40e to 0x446 |

**Timeline from the start of the battle: turn 1 Summon, turns 2 to 6 the countdown (gauge 20 to 100), turn 7 Mega Flare, turns 8 to
12 the countdown, turn 13 Mega Flare, and so on.** There is no aeon test: Mega Flare lands on Yuna if she is alone. **In this
battle Spathi has no hit reaction** (the counter rows belong to other battle ids). A

### 4.6 The "when targeted" gains

Grothia's and Pterya's onHit adds **3** and **15** to the gauge (capped at 100) once per action that reaches them, only if
`isCounterattackAllowed()` (A for the script, B for the gate); Spathi gains nothing. Isaaru's handlers are all empty.

### 4.7 Confidence

A for every row (run for each branch with the aeon out, Yuna alone, the gauge at its edges and the defeat check). B for the
mirror-aeon flag and the join flag. Not decoded: the dialogue scenes.

## 5. Fight 4: the Left Fin and the Right Fin with Cid (formations `ssbt00_00`, `ssbt01_00`)

Actors: **20 Left Fin** (m136) or **Right Fin** (m137), **21 Cid** (m149 in its non-Evrae branch). Both Fins: HP 65,000, MP 999,
STR 30, DEF 100, MAG 30, MDF 50, AGI 20, Armored, immune to Death, Zombie, Petrify, Poison, Confuse, Berserk, Provoke, Sleep,
Silence, Dark, Haste, Slow, to Power Break and Magic Break and to Delay; **Armor Break and Mental Break can land**. Both start
FAR.

| Script | init | onTurn | onTargeted | onHit |
|---|---|---|---|---|
| m136 Left Fin (w1) | f0 @0x0d6 | f3 @0x203 (preTurn f2 @0x202 is empty) | f4 @0x384 | f5 @0x461 |
| m137 Right Fin (w1) | f0 @0x0d6 | f2 @0x202 | f3 @0x35f | f4 @0x43c |
| formations | f0 @0x000 (adds "Move in" to Tidus and Rikku), scene A0 @0x059, pre-turn handlers @0x52d / @0x54f | | | |

### 5.1 Battle start

* Fin init: **BattleDistance := 3** (@0x199); the charge counter and hit counter start at 0; Heavy and "Tough"; "boss" death. A
  `maxHP / 3` value is computed and never read.
* Formation: Escape and Flee off; start type 3; **"Move in" is added to Tidus and Rikku** (the opposite of Evrae's fight); the
  Cancel handlers are as in Evrae's. No start hook.
* Cid (m149) in this battle (id != Evrae's): preTurn and onTurn only run the order machinery: **if `order` = 1 the pre-turn voice
  scene plays and the turn adds "Move in" and runs scene A0 (Fin FAR); if `order` = 2 it adds "Pull back" and runs A0 (Fin
  NEAR)**. No missiles. Scene A0 writes the Fin's BattleDistance (3 or 0) and clears `order`. The Fin's own onTargeted handles
  the three Trigger Commands exactly as Evrae's does (2.4). A

### 5.2 The turn (identical except for the numbers in the last two columns)

| # | Condition | Action | State | Left Fin | Right Fin |
|---|---|---|---|---|---|
| 1 | FAR and charge counter `v7` = 4 | the do-nothing Gravija (aimed at himself, no damage) | `v7` := 0 | same | same |
| 2 | FAR, otherwise | **Smack** on the whole front line if the hit counter `v8` > T, else the "motionless" dummy | counter := 0 after Smack | T = 6 (7 hits) | T = 4 (5 hits); **2 (3 hits) after the 25% latch** |
| 3 | NEAR, `v7` = 0, 1 or 2 | **Ram** on the front line if the Ram test passes, else the dummy; **`v7` += 1 either way** | counter := 0 after Ram | draw `mod 3` (stream 2, every time): Ram iff draw <= `v8` | Ram iff **latched or `v8` > 3**; no draw |
| 4 | NEAR, `v7` = 3 | the charge dummy ("gathers energy") | `v7` := 4 | same | same |
| 5 | NEAR, `v7` = 4 | **Gravija** on the front line (75% of current HP; formula 5, power 12) | `v7` := 0 | same | same |

The charge counter only advances at NEAR. A charge announced and then answered by "Pull back" is paid out as the do-nothing
Gravija. The Left Fin's NEAR Ram odds follow the hit counter: **33.334% (21,846 of 65,536) at 0 hits, 66.667% (43,691) at 1, 100%
from 2**, and the draw is spent on every NEAR regular turn, even when the outcome is certain. Gravija (the damaging one) is
not a regular turn: the three-regular-turn count restarts at 0 after it. A

### 5.3 The hit handler (m136 onHit @0x461, m137 onHit @0x43c), once per action

| # | Step | Detail | Src |
|---|---|---|---|
| 1 | Right Fin only: **if HP < 16,250 (maxHP * 1 / 4, strict) the phase flag := 255, for good** | evaluated at each hit event, before the guard test | @0x445 to 0x469 |
| 2 | if the previous event was a FAR Negation (`v9` = 1): clear it and stop | | @0x473, 0x790 |
| 3 | **hit counter += 2 if `dereferenceCharacter(AllActors)` is an aeon 8 to 14, else += 1** | the "aeon out" test of 1.2 | @0x47c to 0x4d6 |
| 4 | score `S` | = Shell on each of slots 1, 2, 3 (+1 each) + Reflect on each (+1 each) + **Protect on slot 1 (+1), none for slot 2, slot 3 counted twice (+2)** + **Haste on k of the three slots: k = 0: 0, 1: +3, 2: +4, 3: +5** + **Armor Break on the Fin +2** + **Mental Break on the Fin +1** | @0x4e3 to 0x71a |
| 5 | FAR | if the Fin has Mental Break **and** `draw mod 100 < 80`: **Negation on himself** (a status wipe), `v9` := 1. The draw is spent whether or not he has Mental Break | @0x71a to 0x744 |
| 6 | NEAR | draw `mod 16` (Left) or `mod 12` (Right); `S` := max(0, `S` - 3); **if draw < `S`: Negation on the whole front line and the Fin** | @0x74e to 0x78a |

Both Fins use Armor Break +2 and Mental Break +1 (the earlier note said Left only). "Slot 1, 2, 3" are the party slots of 1.2.
The exact Negation chance at NEAR is `k / 16` for the Left Fin with `k = max(0, S - 3)` (6.250% per point, certain from S = 19);
for the Right Fin `(5,461 k + min(k, 4)) / 65,536` (S = 4: 8.334%, 5: 16.669%, 6: 25.003%, 8: 41.670%, 10: 58.336%, 14:
91.667%, certain from S = 15). At FAR it is 80.011% (52,436 of 65,536 draws, `mod 100` below 80) with Mental Break and 0 without. The Negation command removes **24** statuses (Zombie, Petrify, Poison, the four Breaks, Confuse,
Berserk, Provoke, Threaten, Sleep, Silence, Dark, Shell, Protect, Reflect, the four Nuls, Regen, Haste, Slow) from everyone in
its mask; the Right Fin's own Negation ids (0x60B7, 0x60B9) with a shorter list are not used by its script. A

**Side effect of the Fin hitting itself.** The NEAR Negation includes the Fin in its mask, the FAR Negation and the do-nothing
Gravija are aimed at the Fin, and all three own a hit record (the kernel records say one hit each), so each raises a hit event
on the Fin. Only the FAR Negation sets the guard that swallows the next event; the NEAR Negation and the do-nothing Gravija
therefore each add **+1 (+2 with an aeon out)** to the hit counter. Run on the real script: a NEAR hit event with a full buff
layout queues the group Negation (counter 1); the Fin's own event from that Negation, after every buff is gone, adds the second
point and queues nothing (the score is 0). The Negation is the Fin's reaction record, so a command that event could queue would
be dropped by the reaction filter of 1.1; the do-nothing Gravija is the Fin's own normal turn, so a FAR Negation rolled in its
event would be kept. A (the script's side), B (the engine's hook on a self-hit)

### 5.4 Confidence

A for all rows (run: both Fins over every draw, 16,384 buff layouts against a closed form with 0 mismatches). B for the side
effect and the gates.

## 6. Fight 4 (continued): Sinspawn Genais and Sin's Core (formation `ssbt02_00`)

Actors: **20 Genais** (m139: HP 20,000, MP 200, STR 30, DEF 80, MAG 35, MDF 50, AGI 25; absorbs Water, weak to Fire; starts
**Armored**) and **21 the Core** (m138, kernel name "Sin": HP 36,000, MP 999, STR 1, DEF 100, MAG 30, MDF 100, AGI 20; Armored,
Reflect immune).

| Script | init | preTurn | onTurn | onTargeted | onHit | onDeath |
|---|---|---|---|---|---|---|
| m139 Genais (w0) | f0 @0x000 | none | f2 @0x11d | f3 @0x249 | f4 @0x278 | f5 @0x2d1 |
| m138 Core (w1) | f0 @0x056 | f2 @0x172 | f3 @0x35f | f4 @0x417 | f5 @0x460 | f6 @0x575 |

### 6.1 Battle start

* **Genais init** (@0x009 to 0x118): Armored := 1, First Strike := 1, CTB := 0, each party slot += 1 (@0x051 to 0x0f7); its state
  variable `s` := 0 (**0 means in the shell: it starts in its shell**), battle variable bv0x04 := 0.
* Core init: BattleDistance := 3, an enemy-group id of 1, "boss" death. The formation's start hook (slot 137, @0x2be1) repeats
  Genais's First Strike, CTB and party-slot lines. **Genais acts first.** Both writes exist; whether the init-time ones are
  overwritten by the engine's opening-CTB pass (0x78ded0) before the start hook runs was not traced, so the net opening of the
  party counters (+1 or +2) is C. A

### 6.2 Genais's turn (m139 onTurn @0x11d)

| # | Condition | Action | State | Src |
|---|---|---|---|---|
| 1 | in the shell, HP > 12,000 (60%, strict) | the "exits shell" dummy (0x6099) | Armored := 0, **Agility + 1**, `s` := 1, bv0x04 := 1 | @0x124 to 0x18e |
| 2 | in the shell, otherwise | **Sigh** on the front line (magic, Dark 100%) | | @0x197 |
| 3 | out of the shell, HP < 10,000 (50%, strict) | the "enters shell" dummy (0x609A) | Armored := 1, Agility - 1, `s` := 0, bv0x04 := 0, **the Venom count := 0** | @0x1b8 to 0x204 |
| 4 | out, Venom count < 2 | **Venom** (Poison 100%) on one random alive member (stream 4) | count += 1 | @0x20e |
| 5 | out, Venom count = 2 | **Thrashing** on the front line | count := 0 | @0x23f |

First turn: the shell exit. Cycle outside the shell: Venom, Venom, Thrashing, repeating; **entering the shell restarts it.** A

### 6.3 Genais's reactions

| Hook | Condition | Action | Src |
|---|---|---|---|
| onTargeted | in the shell and the command is the Core's Gravija (0x6094) or Demi (0x304e) | NullMagic := 1 for this hit (the hit does nothing) | @0x24c to 0x274 |
| onHit | always | NullMagic := 0 | @0x281 |
| onHit | **in the shell**, command is not the Core's Gravija | **Cura on himself** (reaction), after every hit event: a miss and a status-only move included | @0x28b to 0x2a8 |
| onHit | **out of the shell**, the command's damage-formula byte is 3 | **Waterga** on the attacker | @0x2ae to 0x2cd |
| onDeath | in the shell: also a forced "exits shell"; always a forced "death"; **if the Core is alive: Core's BattleDistance := 0, bv0x04 := 2** | | @0x2d1 to 0x31c |

"Formula 3" includes every damaging spell, Lancet, Scan and the other support spells carrying that byte (the same set as the +1
class of 2.5, so Dispel, Esuna, Shell and the rest provoke Waterga too), and the Mix recipes from NulAll to Eccentrick; Demi (5),
the Cure family (7), physical commands (1) and Overdrives with other bytes do not. A Cura cast in the shell is itself a hit
event on Genais, but it is Genais's own reaction record, so the reaction filter of 1.1 drops the second Cura it would queue: the
shell's Cura does not chain. B

### 6.4 The Core's turn (m138 onTurn @0x35f), in order

| # | Condition | Action | Src |
|---|---|---|---|
| 1 | charged (`v2` = 1) | **Gravija** (75% of current HP) on the front line **and on Genais**, whatever bv0x04 says now; `v2` := 0 | @0x366 to 0x3a4 |
| 2 | bv0x04 = 0 (Genais shelled) or 2 (Genais dead) | the charge dummy; `v2` := 1 | @0x3b4, 0x3e9 |
| 3 | bv0x04 = 1 (Genais out of the shell) | the "inactive" dummy | @0x3dd |

### 6.5 The Core's score, Negation and counters

* **preTurn (@0x172 to 0x35e) recomputes a stored score `S` once per Core turn:** for each of slots 1, 2, 3: Shell +1, **Haste +2**,
  Reflect +1; **Protect on slot 1 +1, none for slot 2, slot 3 +2 (counted twice)**; **Armor Break on the Core +3 and Mental Break
  +3.** A
* **onHit (@0x460 to 0x574), once per action:** if the guard flag `v11` is 1, clear it and stop. Otherwise draw twice (stream 2):
  `r1 mod maxHP`, then `r2 mod 8`. **`S` := max(0, `S` - 3)** (stored: it falls by 3 with every hit event until the next Core
  turn). **If `r2 < S`: Negation (on the front line, the Core and Genais if alive), `v11` := 1**, which swallows the Core's own hit
  event of that Negation. **Otherwise, if HP < `r1 mod 36,000`: a counter, the next of Fire, Blizzard, Thunder, Water on the
  whole front line** (the cycle moves only when one fires). A
* Exact numbers: with a stored score of 15, the Negation chances on successive hit events are 100%, 100%, 75%, 37.5%, 0%. The
  counter chance (when Negation did not fire) is the share of the 65,536 draws whose residue modulo 36,000 exceeds the Core's HP:
  `(35,999 - HP) / 65,536` for HP >= 29,536 and `(2 (29,535 - HP) + 6,464) / 65,536` below: 0% at full HP, 9.154% at 30,000,
  45.065% at 18,000 (50% by the linear rule), 81.686% at 6,000, 99.994% at 1 HP. A
* **onTargeted (@0x417 to 0x45f): "Magic absorbed".** If Genais is in the battle, **out of its shell** (bv0x04 != 0) and the
  command's damage type is magical (`flags & 3` = 2), the attempted command is replaced by the absorbed-magic dummy (0x609B, no
  hit records) and its target becomes Genais. The spell never reaches the Core: no damage and no hit event, hence no Negation roll
  and no counter. Special-type commands (Lancet, Overdrives) and physical ones pass. "In the battle" is `countChrOverlap(all
  monsters, monster 139)`; a dead Genais has left the battle (1.2: its death-animation value is 1), so the count is 0 and the hook
  returns at its first test: **the Core takes magic normally once Genais is dead**. B for the "no counter" and for the
  dead-Genais case.
* onDeath: a visual scene if the Core was charged. A

### 6.6 Confidence

A for 6.2 to 6.5; B for the self-hit swallow, the absorbed spell's lack of an event and the gates.

## 7. Fight 5: Sin's face, "Overdrive Sin" (formation `ssbt03_00`)

Actor: **20 Sin** (m140: HP 140,000, MP 999, STR 30, DEF 40, MAG 30, MDF 40, AGI 30, Armored, immune to the usual statuses;
Armor Break and Mental Break can land). Script: init f0 @0x053, onTurn f3 @0x234, onHit f4 @0x464 (preTurn f2 @0x233 is empty).

### 7.1 Battle start

Start type 3, Escape/Flee off, Anima's chain animation off; **start hook** (slot 137 @0x2c3c): Sin's First Strike := 1, CTB := 0,
each party slot += 1. Sin's own init (@0x053 to 0x22e) shows the Overdrive bar (max 100), sets **BattleDistance := 3**, zeroes the
turn counter (`v0`) and writes the same three opening lines (First Strike @0x185, CTB, party +1) a second time; as for Genais
(6.1), whether the init-time copy survives the engine's opening-CTB pass is C. Sin acts first. A

### 7.2 Sin's turns

| Turn | Action | BattleDistance after | Overdrive bar | Src |
|---|---|---|---|---|
| 1 | "Drawn to Sin" (dummy, 0x6029) | 3 | 10 | @0x237 to 0x280 |
| 2 | "Drawn to Sin" | **1** | 20 | @0x287 to 0x2c6 |
| 3 | "Drawn to Sin" | **0** | 30 | @0x2cd to 0x30c |
| 4 to 11 | no command: the mouth scene A0; counter += 1 | 0 | +10 per turn (40 ... 110) | @0x417 to 0x436 |
| **12** | **clear Auto-Life on all 17 party and aeon actors, Giga-Graviton on the front line (damage formula 8 at power 16, the target's maximum HP; Death chance 255), mark the summon game over** | 0 | 0 | @0x31d to 0x407 |

The mouth turns issue no command (rank 3 recovery); the counter is reset to 0 after Giga-Graviton, so if anything survived it,
the cycle would restart with mouth turns. **Giga-Graviton is Sin's 12th turn.** A

### 7.3 The Gaze counter (m140 onHit @0x464), once per action

1. `v3` += 1 on **every** hit event, from the first (also during the pulls).
2. Only when the pull phase is over (after turn 3): if `dereferenceCharacter(AllActors)` is an aeon 8 to 14: **if `v3` > 2: the aeon
   Gaze (0x60A0, magic damage of power 50, no status) on the front line**; `v3` := 0. Otherwise (party in front, or the Magus
   Sisters): **if `v3` > 5: draw `mod 3`: 0 Gaze with Zombie (0x609D), 1 Petrify (0x609E), 2 Confuse (0x609F), each a magic hit of power
   20 with a 30% status chance, on the front line**; `v3` := 0. Zombie 33.334% (21,846), Petrify and Confuse 33.333% (21,845). A

A count above the threshold carried out of the pull phase therefore fires on the first hit after the third pull.

### 7.4 Confidence

A for all rows. The Overdrive bar is written 110 on turn 11; whether the property clamps at 100 is C.

## 8. Differences from our AI

"Ours" = `src/battle/ffx/ai/*` and the engine pieces they use, at the commit this note was written against. "Game" cites the
monster id and code offset in the tables above. Matches are listed after the table.

| # | Fight | Rule | Game (script) | Ours | Effect |
|---|---|---|---|---|---|
| D-01 | Evrae | Haste line | HP < 10,666: maxHP / 3 with integer division, strict (m119 @0x1cd, @0x4f5) | `HASTE_THRESHOLD = 10_667`, Haste at `hp < 10_667` (`evrae-rules.ts:103`, `evrae-counters.ts:67`) | Ours Hastes him one HP point early (at exactly 10,666) |
| D-02 | Evrae | Delay starts the Haste phase | Delay Attack +1, Delay Buster +3, at 3 or more: Haste (@0x489 to 0x4c7, @0x517 to 0x52c) | Not built; owner decision C-13 (`evrae-rules.ts:184`) | The wiki claim is true: one Delay Buster or three Delay Attacks start the Haste phase with no HP loss; ours never does |
| D-03 | Evrae | What fills the Stone Gaze counter | By the command's damage-formula byte: 1 = +2, 3 = +1, anything else 0; weapon-flagged commands read Evrae's own byte (1), so every weapon command is +2 (@0x489 to 0x4e8) | By category (attack, black magic, skill, overdrive) and `formula !== 'none'`, physical +2 else +1 (`evrae-counters.ts:87-92`, `evrae-rules.ts:193`) | Ours skips the support spells the game counts +1 (Shell, Protect, Reflect, Regen, Esuna, Dispel, Scan, Auto-Life, Holy) and counts Demi, which the game counts 0 |
| D-04 | Evrae | Stone Gaze after the Haste phase starts | The counter stops counting but a value above 5 still fires at the next Attack slot (@0x27a to 0x2bf) | Gaze is impossible in phase 2, a readied one is lost (`stoneGazeDue`, `evrae-counters.ts:94-96`) | A counter at 6 or more when the phase flips costs the party one more Gaze in the game |
| D-05 | Evrae | His own FAR turn in phase 2 | **Swooping Scythe** on everyone, then he is NEAR and the pending order is cleared (@0x20e to 0x268) | Photon Spray in both phases (`evrae.ts:86-91`) | Ours keeps spraying from afar in phase 2; the game closes in and Scythes |
| D-06 | Evrae | The Scythe counter | A hit event (a hit record, a miss included) on FAR Evrae in phase 2; it also clears `order` and re-offers Pull back (@0x405 to 0x469) | Any targeting in phase 2 while FAR (`evrae-counters.ts:141,159-163`) | Targeting with no hit record does not provoke it in the game; the order state is not touched in ours |
| D-07 | Evrae | Slow answer | Haste on any hit event while NEAR in phase 2 with Slow on him; at FAR the Scythe branch wins (@0x405, @0x479) | Haste whenever Slow lands on a hasted Evrae, at any range (`evrae-counters.ts:154-156`) | Differs when Slow lands at FAR; the game re-casts after any later hit while Slow persists |
| D-08 | Evrae, Fins | Orders | One Trigger command is on offer: Pull back at NEAR, Move in at FAR, Cancel while one is pending; no second or redundant order; Tidus and Rikku only, refreshed at their turn starts (m119 @0x30b; formation @0x694, @0x6cc) | "Last order wins", a redundant order still burns Cid's turn, no Cancel (`evrae-rules.ts:138,342-365`; `sin-fins-rules.ts` S-20) | Ours lets the player overwrite or repeat an order; the game forces Cancel first |
| D-09 | Evrae, Fins | Cid's speed | Agility := 11 at init -> 42 ticks per turn (m149 @0x015) | Agility 16 -> 36 (`src/data/ffx/enemies/evrae.ts:224`) | Cid acts 17% more often in ours (the wiki's 11 was right) |
| D-10 | Yojimbo | First turn | **Summon** aimed at the summoner, gauge unchanged (m288 @0x33c) | No first turn (`yojimbo.ts:49-67`) | Ours acts one turn early |
| D-11 | Yojimbo | Odds inside a band | Exact: 80 to 99 W 25 / K 25 / D 50; 50 to 79 W 20 / K 20 / D 60; 25 to 49 K 25 / D 75 (@0x3aa to 0x4f1) | Equal split of the open actions (`yojimbo-rules.ts:104-108`, B2) | In the 50 to 79 band ours is 33 / 33 / 33; in 25 to 49, 50 / 50 |
| D-12 | Yojimbo | After Zanmato | Gauge 0, then the common +2: **2** (@0x39a, @0x506) | Reset to 0, no +2 (`yojimbo.ts:56-60`, `yojimbo-rules.ts:72`) | Ours returns to Zanmato one turn later |
| D-13 | Yojimbo, Isaaru | The "when targeted" gain | Per **hit event** (after the last hit record, once per action per target, a miss counts), only if he can act and the attacker is not in a reaction; party counter-attacks do not charge it (m288 @0x530; 0x78f060, 0x7a8450) | Once per player-side action that names him, before the hit loop, no status gate, counters not excluded (`overdrive.ts:146-151`, `abilities.ts:111`, `yojimbo-rules.ts:170`) | Differs for counter-attacks and while he is Threatened (resistance byte 0) |
| D-14 | Yojimbo, aeons, Genais, Sin face | Opening | First Strike, CTB 0 for the boss and +1 on the party, by a formation start hook (`nagi05_10` @0x4bbf; `bvyt09_10` @0x44f6, `_11` @0x44d3, `_12` @0x50a; `ssbt02_00` @0x2be1; `ssbt03_00` @0x2c3c), and for Genais (m139 @0x051) and Sin (m140 @0x185) once more in the monster's own init (net effect C) | Ordinary opening (CTB note C5, C6) | Ours can let the party act before the boss's first turn |
| D-15 | Isaaru | Gauge gain with no aeon out | Grothia +5, Pterya +10 on every attack at Yuna (m284 @0x5ec, m254 @0x46e) | "No gauge gain" (`isaaru.ts:88`) | The game's gauge keeps filling while Yuna is alone; Pterya can arrive with a full gauge |
| D-16 | Isaaru | Attack against Fira / Sonic Wings | Draw mod 3: the special on 33.334%, Attack 66.666% (@0x571, @0x3f3) | Even, `ctx.rng.pick` (`isaaru.ts:95`, O-5) | Ours uses the special 50% of the time |
| D-17 | Isaaru | First turn | **Summon** on Isaaru for all three aeons (@0x3d6, @0x33c, @0x38d) | None (`isaaru.ts:116-127`) | Spathi's first Mega Flare is on his 7th turn in the game, the 6th in ours |
| D-18 | Isaaru | Defeat condition | At the aeon's turn start and Yuna's: no recruited, non-mirror aeon with HP above 0 -> Defeat (@0x3ac; formation) | No aeon on the field and none summonable (`aeon-duel.ts:123-124`) | Timing and the definition of "left" differ |
| D-19 | Fins | Left Fin NEAR roll | A draw on every NEAR regular turn; thresholds 21,846 / 43,691 of 65,536 (m136 @0x2d7) | 0.33 / 0.67 and no draw when certain (`sin-fins-rules.ts:75`, `sin-fins.ts:86`) | Stream 2 drifts; the odds differ in the third decimal |
| D-20 | Fins | Hit counter | +2 if an aeon (8 to 14) holds the field, else +1; **the Fin's own Negation and do-nothing Gravija add another +1/+2** (m136 @0x47c; B) | +2 by the attacker's side (`sin-fins-rules.ts:261`); self-hits not counted | Self-hits are missing in ours |
| D-21 | Fins | Negation score | Shell/Reflect +1 per party slot; Protect: party slot 1 +1, slot 2 nothing, slot 3 +2 (the script reads slot 3's flag in two places and slot 2's in none); Haste 0/3/4/5 by how many slots have it; Armor Break +2, Mental Break +1 (the only Breaks that land); no base (m136 @0x4e3 to 0x71a; m137 @0x4e2 to 0x719) | Base 2; +2 for the first Break of **any** kind, +1 for a second; +1 per Shell/Reflect/Haste on each living member; Protect +2 for the first living member, +1 for the last living member (`sin-negation.ts:78-135`) | A different chance for almost every layout: the game has no base, weights Haste 3/4/5 instead of 1 per member, and gives the Protect bonus to the third slot, ours to the first |
| D-22 | Fins, Core | Random draws of the Negation roll | One draw on every hit event (even when impossible) | No draw when the chance is 0 (`sin-fins-rules.ts:264`) | Stream 2 drifts |
| D-23 | Genais | Where it starts | In the shell; its first turn is "exits shell" (Armored off, Agility 26 from then on) (m139 @0x009 to 0x118, @0x124) | Starts out of the shell (`sin-genais-core-rules.ts:216`) | Ours gives no free first turn; Agility 25 vs 26 |
| D-24 | Genais | Thresholds | Exit HP > 12,000, enter HP < 10,000, both strict | `>=` and `<=` (`sin-genais-core.ts:44,48`) | Off by one at exactly 12,000 and 10,000 |
| D-25 | Genais | Venom cycle | Restarts at Venom when the shell is entered (v5 := 0) | Resumes where it stopped (`sin-genais-core.ts:53-56`, "rotation-resumes") | |
| D-26 | Genais | The shell's Cura | After **every** hit event except the Core's Gravija: misses and status-only moves too | Only after an action that dealt damage (`genaisCounter`, `sin-genais-core-rules.ts:317-323`) | Misses and status moves draw no Cura in ours |
| D-27 | Genais | Waterga | Hit by a command whose damage-formula byte is 3 (spells, Lancet, support spells) | Black/White magic or magical type, minus percent formulas (`isMagicForWaterga`, `sin-genais-core-rules.ts:279`) | Differences at the edges (Lancet, Scan, Dispel) |
| D-28 | Core | Counter chance | After a failed Negation roll: P(`draw mod 36,000` > HP): 0% at full HP, 45.07% at half | Always (`CORE_COUNTER_CHANCE_BEFORE/AFTER = 1`, `sin-genais-core-rules.ts:71-73`) | Ours punishes every hit; the game mostly low-HP hits |
| D-29 | Core | Negation | Score taken at the Core's turn start and **reduced by 3 with every hit event**; slot weights Protect 1 / 0 / 2 (m138 @0x172, @0x49d) | Recomputed each turn and held; Protect leftmost +2, rightmost +1 (`sin-genais-core-rules.ts:177-195`) | Ours gives a constant chance between turns; the game decays it |
| D-30 | Core | Absorbed spell | Replaced before it resolves: no hit event, no counter (@0x417 to 0x45f; 0x7ac940) | The absorbed spell still draws a counter (`CORE_ABSORBED_SPELL_DRAWS_COUNTER = true`, `sin-genais-core-rules.ts:79`) | Ours counters absorbed casts |
| D-31 | Sin face | Giga-Graviton | **Sin's 12th turn** (m140 @0x31d; 3 pulls + 8 mouth turns) | 13th (`GIGA_GRAVITON_TURN = 13`, `overdrive-sin-rules.ts:83`, S-1) | Ours gives one more turn |
| D-32 | Sin face | Distance | 3 at the start and after pull 1, **1 after pull 2**, 0 after pull 3 | FAR until pull 3, then NEAR (`overdrive-sin.ts:66-68`, S-28 "not built") | Use, items and Wakka's reels can reach after the second pull in the game |
| D-33 | Sin face | Gaze counter | +1 per hit event from the first; fires only after the pulls; threshold 5 (party) or 2 (aeon 8 to 14 holds the field), tested at the moment of the hit; variants 21,846 / 21,845 / 21,845 | Aeon actions weigh 2 against a threshold of 6, can fire during the pulls, uniform pick (`overdrive-sin-rules.ts:199-205`, S-16) | Mixed sequences and the pull phase differ |
| D-34 | All | Party counter-attacks | The hooks still run (their counters and scores move); only the commands they queue are dropped | `collectBossCounters` skips counter actions entirely | Evrae's Gaze counter, the Fins' hit counters, the Core's score decay and Sin's Gaze count do not move in ours on a party counter-attack |

**Matches** (checked against the script and left alone): Evrae's cycle Attack, Attack, Inhale, Poison Breath with the retreat
dummy and the persistent charge; Stone Gaze threshold 6 and +2 / +1 (the classification differs, D-03); three Cid volleys and a
silent fourth turn; Cid executing an order on his next turn instead of a volley; the opening at NEAR; Yojimbo's bands and the
+2 per turn; Daigoro as an order with the dog's own Strength; the mirror locks (Ifrit, Valefor, Bahamut); Grothia starting at 100
and Pterya at 0; Spathi's five-to-one countdown; the Fins' FAR/NEAR thresholds (Left: 7 hits at FAR, 33/67/100% at NEAR; Right:
5 and 4 hits, 3 at FAR after the latch), the 25% latch line 16,250, the do-nothing Gravija at FAR, the charge cycle, the Gravija
turn not counting toward the next three; the Negation removal list and scope; Genais's Venom, Venom, Thrashing and the Sigh in
the shell; the Core waiting on Genais; Sin's three pulls and the mouth turns costing a rank-3 turn.

## 9. What this changes in the earlier lane's FINDINGS B5 and B7

**B5, line by line.** "Giga-Graviton is Sin's 12th turn. Turns 1 to 3 pulls, 4 to 11 mouth turns, turn 12 fires it. All
Auto-Life cleared first" **(confirmed, for all 17 party and aeon actors)**. Gaze: "shared, increments on every hit, including
during the first three turns; fires on more than 5 party hits or more than 2 aeon hits, Zombie, Petrify or Confuse at 1/3 each;
resets" **(confirmed; add: it cannot fire until the pulls are over, the aeon test is the field state at that moment, and the
three variants are 33.334 / 33.333 / 33.333%)**. Fins: "start FAR; an aeon hit counts as 2" **(confirmed; it is the field
state, and the Fin's own Negation and do-nothing Gravija add a hit)**; Left Fin "(hits+1)/3 NEAR, needs 7 FAR" **(confirmed,
exact 33.334 / 66.667 / 100%)**; Right Fin "4 hits NEAR, 5 FAR, below 25% always NEAR and 3 FAR, latched" **(confirmed, strict at
16,250)**. Charge cycle **(confirmed; the counter does not advance at FAR)**. Fin Negation: chance `max(0, score - 3)/16` or `/12`
**(confirmed, with the exact residues)**; score components Shell and Reflect +1, Protect slot 1 +1, slot 3 +2, slot 2 0
**(confirmed; no base)**, Haste +3/+4/+5 **(confirmed)**, "Armor Break +2, Mental Break +1, **Left Fin only**" **(corrected: both
Fins)**; FAR Negation 80% with Mental Break **(confirmed: 80.011%, a draw is spent either way)**. Cancel next to Move in and Pull
back **(confirmed: exactly one of the three is on offer)**. Genais: "starts in its shell and leaves on its next turn once HP >
60% (12,000); re-enters below 50%; Cura on every hit in the shell, Waterga on ordinary magic out of it" **(confirmed; thresholds
strict; it spends its first turn exiting; "ordinary magic" is damage-formula byte 3; the Cura rule includes misses; the Core's
Gravija is the one exception)**. Core: "Negation `max(0, score - 3)/8`, Haste +2, Armor Break and Mental Break +3" **(confirmed, but
the score is taken at the Core's turn start and falls by 3 with every hit event until then; Shell and Reflect +1; Protect slots
1 +1, 2 0, 3 +2)**; "otherwise counters with probability (maxHP - HP)/maxHP cycling Fire, Blizzard, Thunder, Water" **(confirmed in
shape; the true probability is the share of 16-bit draws above HP modulo 36,000: 9.15% at 30,000 HP, 45.07% at 18,000)**; "magic
aimed at the Core is absorbed only while Genais is alive and out of its shell" **(confirmed for magical-type commands; the
absorbed spell raises no hit event)**. **S-28 (open): resolved.** The distance goes 3 (start and pull 1), **1 after pull 2**, 0
after pull 3; the range check lets a command pick a target when its reach is at least the target's distance; Use and every item
and Wakka's reels have reach 2, so they land from the second pull on and not before; melee needs 0.

**B7, line by line.** "His first turn is Summon" **(confirmed, aimed at the summoner, no gauge change)**. Gauge bands
**(confirmed with exact odds: 80 to 99 25/25/50; 50 to 79 20/20/60; 25 to 49 25/75)**. "Zanmato, then G resets to 0"
**(corrected: it is reset to 0 and then the common +2 applies, so G is 2)**. "G gains +2 after each non-first turn" **(confirmed,
the Zanmato turn included)**; "+3 on each hit event, capped at 100" **(confirmed; the gate is `isCounterattackAllowed`)**. "The
script never sets a starting value, so it is 0" **(confirmed; the monster setup writes 0)**. "Wakizashi and Kozuka are
single-target; Daigoro and Ginnem untargetable and hidden from the CTB" **(confirmed; Daigoro's order is aimed at the dog and the
dog bites as a reaction; whether the two bystanders take idle turns is undecoded)**. **Open point, how often the hit handler adds
+3 on multi-hit moves: once per action per target, after the last hit record**, from the script's own onHit hook; the two
functions the anchor map suspected (0x7afe00, 0x7b1b50) are not hook callers.

## 10. Not decoded, or still open

* The cutscene and caption scenes: only their effects on state (the move, Cancel, caption selectors, the random draws they spend)
  were read; the on-screen strings were not decoded.
* Whether the summoner and Daigoro take idle turns (they keep Agility-0 counters and empty onTurn hooks).
* The initial CTB of Evrae, Cid, both Fins, the Core and Isaaru's aeon relative to the party when no start hook exists (the
  ordinary opening applies; not re-read here).
* Whether the opening start-type roll is overwritten by the formation's write (init order, 1.5), and which of the two start-type
  writes of the Evrae and Isaaru formations lands last.
* Whether the opening writes inside the monster inits of Genais and Sin's face survive the engine's opening-CTB pass (6.1, 7.1):
  the party counters get +1 from the start hook either way, +2 if both copies stand.
* The engine behaviour of a Reflected Evrae's self-Haste, and of a Threatened boss's reaction (the script marks the phase before
  it queues the Haste). Likewise the hook writes Evrae's BattleDistance itself before the queued Scythe passes the reaction
  filter, so if the filter refuses the Scythe (a party counter-attack caused the hit, or Evrae is Threatened) the distance would
  still change without it (inferred from the order of operations, C).
* The Overdrive bar's value 110 on Sin's 11th mouth turn (clamped or not).
* Whether an unsummoned aeon's HP reads above 0 at the start of an Isaaru battle (4.2).
* The Threaten resistance byte is 0 on every actor in these fights; whether Threaten lands is the status lane's question, but it
  contradicts the "immune" settings in the `evrae`, `yojimbo`, `isaaru` and `sin-*` data (D-13).
