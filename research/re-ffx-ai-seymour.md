# FFX Seymour fights: what the game's own AI scripts do (Flux, Macalania, Natus, Omnis)

**Game case: FFX only.** These are the compiled boss scripts of four FFX encounters; FFX-2 has its own scripts and its own
engine and gets its own notes. Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)).
Drafted 2026-10-08. **Records only: no engine or AI code was changed.**

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe/FFX_Data.vbf Steam build
25501027 (FFX.exe SHA-256 0537B2A1...686D; FFX_Data.vbf SHA-256 starts b22025d4c39e799e). The AI scripts are data in the
archive (`ffx_ps2/ffx/master/jppc/battle/mon/_mNNN/mNNN.bin` for the monsters, `.../battle/btl/<formation>/<formation>.bin`
for the formation script that holds the cutscene scenes and the battle-start setup). They were extracted with our own reader
from the live Steam copy, decoded with our own Atel disassembler, and every engine call they make was checked against the
engine's own handler in Ghidra 12.1.4 (decompiler and disassembly). Everything is written in our own words: no script text,
no game dialogue and no decompiled code is reproduced. "Rule" tables give conditions, actions, probabilities and where in the
script each rule lives (monster id, hook, code offset).

| Fight (our chapter id) | Formation | Scripts read |
|---|---|---|
| Seymour Flux + Mortiorchis (`seymour-flux`) | `mtgz02_00` | m142, m143, formation script |
| Seymour (Macalania) + 2 Guado Guardians + Anima (`seymour-anima-macalania`) | `mcyt06_00` | m124, m141 (x2), m125, formation script |
| Seymour Natus + Mortibody (`seymour-natus`) | `stbv01_10` | m126, m127, formation script |
| Seymour Omnis + 4 Mortiphasm discs (`seymour-omnis`) | `sins03_00` | m131, m106 (x4), formation script |

Sections: 0 method and confidence; 1 how the scripts run (engine facts every table relies on); 2 to 5 the four fights;
6 differences from our AI; 7 what this changes in the earlier lane's FINDINGS B8 and B9; 8 not decoded or still open.

## 0. How this was read, and how far to trust it

1. **Extraction.** 13 script files and the three command tables (`command.bin`, `monmagic1.bin`, `monmagic2.bin`) were
   extracted from the live E: archive; the 19 files also present in the earlier lane's extraction are byte-identical.
   File sizes and SHA-256 prefixes: m142 155,864 B ca99c45c; m143 3,404 B 282fd969; m124 30,016 B f4cd4e19; m141 4,652 B
   b2e67460; m125 68,048 B 0b1dd8d9; m126 143,304 B 4b9164a9; m127 28,592 B 9f0737c5; m131 169,876 B 69b4e721; m106
   11,096 B 9589c73a; `mtgz02_00` 23,248 B b7b67105; `mcyt06_00` 21,184 B 24261825; `stbv01_10` 15,184 B 5791f962;
   `sins03_00` 68,192 B d215d229.
2. **Disassembly was verified by running it.** Besides reading every branch, the compiled hook functions were executed by an
   independent small interpreter of the script instruction set (written for this note, outside the repo) against a mock
   battle: the Flux/Mortiorchis cycle for both phases, every threshold edge, the revive loop, the Talk and Banish paths;
   Seymour's spell rotation and target pair over 60,000 draws per party shape; the Guardians' turn priorities and reaction
   conditions; Anima's whole loop including the Overdrive gauge and her death; Natus's phase edges (a 14-step hit sequence), his
   Provoke path and Mortibody's Desperado ladder (up to 40,000 draws per buff score); and all 256 disc layouts of Omnis through
   his real pre-turn and turn functions, plus the formation script's disc scenes driving the real disc motion handlers. In every
   case the run reproduced the reading below. The interpreter implements only the calls that decide behaviour; cosmetic calls
   (camera, motion, sound) are ignored.
3. **Engine handlers read** (VA in FFX.exe): the Atel call dispatcher (group = id >> 12, 16-byte entries) and the VM jump
   routine (0x8726f0: target = code base + the worker's jump table entry, so the operand really is a table index);
   findMatchingChr 0x7a5af0 with its picker 0x7acd40; performCommand 0x7a44b0; forcePerformCommand 0x7a49f0; the queue
   0x7ac9c0; target-group resolver 0x794330; readBtlChrProperty 0x7a4d50 (via 0x7b2dc0); readCommandProperty 0x78cd30;
   countChrOverlap 0x7a6870; usedCommand 0x7a62d0; isCounterattackAllowed 0x7a8450; the scene starters 0x7a5540 and 0x7a5780;
   the hook requester 0x7aceb0 and its callers (turn start 0x792a90, action executor 0x792210, target loop 0x7ad0c0, hit
   application 0x78f060, death check 0x78c740, action end 0x7b20e0, poison tick 0x7afab0); cover 0x78eef0 and its caller
   0x78ba70; the usability check 0x78ab20 with 0x78c690; the party swap 0x7adae0.
4. **Confidence labels used in the tables.** **A** = the rule was run in the interpreter and matches the reading (all numbers
   and branch orders). **B** = rests on an engine handler read in Ghidra but not executed. **C** = inferred, or a cutscene
   scene read only partly. Unlabelled rows are A.

## 1. How the scripts run (the engine facts every table below relies on)

### 1.1 Hooks

Each monster has one "AI" worker with up to nine entry points. This note names them by tag index.

| Tag | Hook | When the engine runs it | Source in the engine |
|---|---|---|---|
| 0 | onTurn | when the monster is asked for its action; the commands it queues are the turn | 0x792210 |
| 1 | preTurn | once per turn start, before Doom, Provoke and the action request; also run for every party member and aeon (their handlers live in the formation script) | 0x792a90 |
| 2 | onTargeted | for each target of a valid command, before the range check and before any damage; `usedCommand()` is that command | 0x7ad0c0 |
| 3 | onHit | **once per action per target, after the last of that action's hit records on the target is applied.** It fires for a miss too, because the record is still applied; it does not fire for a command that has no hit records at all (Talk, the Seymour "trigger" commands, Special 1/2, Summon Anima) | 0x78f060 (B) |
| 4 | onDeath | at the end of the death routine (the in-battle flag of a monster with a non-zero death pattern is already cleared) | 0x78c740 |
| 6 | postTurn | after the action's cost is paid | 0x7b20e0 |
| 8 | postPoison | right after the poison damage of that monster's own turn | 0x7afab0 |

**onHit runs before the death check.** A handler that puts HP back (Mortiorchis, Mortibody, Macalania Seymour) therefore stops
the death altogether. Nothing here runs per hit of a multi-hit move: Anima's Overdrive gain, Omnis's hit counter and Flux's
thresholds see one event per action.

### 1.2 Queued commands

* `performCommand(target, command)` queues only if the owner can act: not petrified, not Confused or Berserk, not asleep, not
  ejected, not Provoked (unless the script marks itself as keeping control; only Natus does), not Threatened. It returns
  without queueing otherwise. `forcePerformCommand` queues unconditionally. Spells still fail later if the owner is Silenced
  (the usability check, 0x78c690). Monsters pay no MP (the check forces the cost to 0). B
* A record holds at most 4 commands. In `onTurn` they are the turn (CTB delay by the command's rank). In `onTargeted`,
  `onHit`, `onDeath` they become **reactions of the hook's owner**, run after the triggering action resolves, and a reaction
  adds no CTB delay (the delay is added only for kind-0 records). The user of a queued command is always the hook's owner, which
  matters for Flux: Cross Cleave, Full-Life, Slowga and Total Annihilation are Flux's commands (his Strength 30 and Magic 15),
  even though Mortiorchis' turn triggers them. B
* A command whose target mask is empty, or whose targets are not in the battle, is dropped (the engine logs a target error).
  **While an aeon holds the field the party-slot list holds the aeon in the summoner's slot and "empty" in the other slots** (the
  summon routine 0x7adf90 empties them, 0x7adae0 clears their in-battle flag): `Character N` of an empty slot resolves to
  nothing, and a property read of nothing returns 0, so an HP test on it reads "0". B
* **Target specs used by the scripts:** `Frontline` = every non-monster actor currently in the battle (so the aeon alone while
  one is summoned); `Character 1/2/3` = the three active party slots in menu order; `LastAttacker`; `Self`; `AllMonsters`; a
  monster number (such as the Seymour in Macalania, monster 124); a plain actor number. Actors: party 0 Tidus, 1 Yuna,
  2 Auron, 3 Kimahri, 4 Wakka, 5 Lulu, 6 Rikku; aeons from 8; monsters 20 to 27 in formation order. B

### 1.3 Random numbers (this is the part an exact replay needs)

| Script call | What it draws | Distribution |
|---|---|---|
| `GetRandomValue()` | the shared **stream 2**, `rng2 & 0xFFFF` (the same stream every script and actor uses) | `mod 100 > 50` is true for residues 51 to 99: 32,095 of 65,536 = **48.97 %**; `mod 3`: residue 0 has 21,846 values, residues 1 and 2 have 21,845; `mod 4` is exactly uniform |
| `findMatchingChr(group, property, _, selector)` | **stream 4** (newly identified; the anchor map lists no use of it): the raw 31-bit value modulo the number of candidates, indexing the candidates in **ascending actor number** (not slot order). Candidates are the group members that are alive **and** targetable and that have the property set. **No draw if there is 0 or 1 candidate.** The call also stores the whole candidate mask as `MatchingGroup`, and a call whose result the script discards (Seymour in Macalania, Natus) still draws | uniform over candidates (a negligible bias from the modulo) |
| the battle-script random op (stream 14/15) | not used by any of these scripts | |

### 1.4 Shared state and scenes

* Variables are either **battle variables** (shared by every script and the formation script, addressed by offset 0x04, 0x08,
  0x0c, ...) or **private** to the monster. Each fight's table below names them by what they hold. Private variables start at 0.
* `runBtlSceneA/B(n)` start formation-script scene `n` (a cutscene or caption, which also pauses the battle clock); **a scene
  call is ignored if a scene is already running.** Scenes matter for behaviour in two places only: the Talk bonuses and the
  Omnis discs. Every other scene I read is a caption or a camera.
* Every formation script disables Escape (0x3003) and Flee (0x3018), adds Talk (0x3105) for the characters named below, and
  sets the ambush state to 3 ("random first attack off", so these battles cannot start preemptive or ambushed).

### 1.5 Talk (the Trigger Command)

Three fights let some characters Talk to the boss for a permanent stat bonus of **+10** (`BonusSTR` or `BonusMDF`), removing
Talk from that character afterwards. The scene only grants it if the talker is alive when the scene runs. Tables:
Flux: Yuna +10 Magic Defense, Kimahri +10 Strength. Macalania: Tidus +10 Strength, Yuna +10 Magic Defense, Wakka +10 Magic
Defense. Natus: Tidus +10 Strength, Yuna +10 Magic Defense, Auron +10 Strength. Omnis: no Talk. (Talking to Mortiorchis
or a Guado Guardian gives only a caption.) These tables match `seymour-flux.ts:319-322`, `macalania-talk.ts:27-31` and
`seymour-natus-rules.ts:235-239` exactly. **Macalania also gates Talk by status** (section 3.1): the command is switched on
or off at the start of each talker's turn.

## 2. Fight 1: Seymour Flux and Mortiorchis (formation `mtgz02_00`)

Actors: **20 Seymour Flux** (m142: HP 70,000, MP 512, STR 30, DEF 40, MAG 15, MDF 40, AGI 38, LCK 15, ACC 100) and
**21 Mortiorchis** (m143: HP 4,000, MP 512, STR 40, DEF 100, MAG 40, MDF 0, AGI 38, LCK 15, ACC 100).

| Script | init | preTurn | onTurn | onTargeted | onHit | onDeath |
|---|---|---|---|---|---|---|
| m142 (AI worker w1) | f0 @0x068 | f2 @0x241 | f3 @0x25a | f4 @0x3ab | f5 @0x533 | f6 @0x627 |
| m143 (AI worker w0) | f0 @0x000 | none | f2 @0x12e | f3 @0x166 | f4 @0x17d | none |

### 2.1 Battle start

* Formation script (init f0 @0x009): Escape and Flee off for party actors 0 to 6; Talk added to Yuna (1) and Kimahri (3); no
  CTB override and no start hook. Ambush state 3 (@0x357b).
* m142 init: floating, DeathAnimation "boss" (the body stays and cannot be targeted), "Tough" (no flinch); Mortiorchis is
  attached to Flux and takes Flux as its host; **battle variables all 0, then cycle state := 1 and phase := 0**; private
  phase-B flag := 0; **Protect threshold := floor(maxHP/4) x 3 = 52,500, Reflect threshold := floor(maxHP/2) = 35,000**; the
  commands Dispel All, Full-Life and Mortibsorption are added to Mortiorchis.
* m143 init: not required for the battle to end; DeathAnimation "boss"; item and gear drop chances 0; "Tough"; **revive HP
  := 4,000** (private).

### 2.2 Variables

| Holder | Meaning | Written by |
|---|---|---|
| battle[0x14] | **cycle state** `s` (1 to 6; starts 1) | Flux onTurn and onTargeted, onHit (reset to 1 at phase 2) |
| battle[0x10] | phase 0 / 1 (below 75 %) / 2 (below 50 %); the formation script's camera handler reads it | Flux onHit |
| m142 private flag | phase B (set at the 50 % edge, never cleared) | Flux onHit |
| battle[0x20] | **Delay-counter flag** (255 = armed) | Mortiorchis onHit (Mortiorchis' own second variable) |
| battle[0x04], [0x08] | talker actor and its row | Flux onTargeted (Talk) |
| battle[0x0c], [0x18], [0x1c] | caption/scene selectors and an animation flag | caption only |
| m143 private | Mortiorchis' revive HP (4,000, 3,000, 2,000, 1,000, floor 1,000) | Mortiorchis onHit |

### 2.3 Seymour Flux's own turn (m142 onTurn)

| # | Condition (in order) | Action | State change | Src |
|---|---|---|---|---|
| 1 | an aeon is in the battle | pick one living `Frontline` member (the aeon), clear its Eject immunity, **queue Banish on it**, play a caption scene; **end the turn** | none | @0x281 to 0x2b1 |
| 2 | phase-B flag = 0 and `s` = 1 | **Lance of Atrophy** on a random living `Frontline` member (stream 4) | `s` := 2 | @0x2d2 to 0x2e4 |
| 3 | phase-B flag = 0 and `s` = 3 | Lance of Atrophy, same targeting | `s` := 4 | @0x2f6 to 0x308 |
| 4 | phase-B flag = 0 and `s` = 5 | **Dispel** on all of `Frontline` | `s` := 6 | @0x311 to 0x31a |
| 5 | phase-B flag = 0 and `s` in {2, 4, 6} | nothing (his turn is wasted) | none | default |
| 6 | phase-B flag = 1 and `s` = 1 | **Flare aimed at Flux himself** (actor 20); Reflect bouncing it onto a party member is what makes it hit the party | `s` := 2 | @0x354 to 0x35d |
| 7 | phase-B flag = 1 and `s` = 3 | if Flux has no Reflect: **Reflect** on himself; if he already has it: only a caption scene | `s` := 4 (either way) | @0x366 to 0x38e |
| 8 | phase-B flag = 1 and `s` in {2, 4, 5, 6} | nothing | none | default |

Flux has no Provoke handling and no check on his own statuses: if he cannot act, `performCommand` queues nothing and the turn is lost.

### 2.4 Mortiorchis' turn, and Flux's reaction (m143 onTurn, m142 onTargeted)

Mortiorchis never attacks by itself. Its turn does exactly this:

| # | Condition | Action | Src |
|---|---|---|---|
| 1 | an aeon is in the battle | nothing (it does not even copy the CTB counter) | m143 @0x137 |
| 2 | otherwise | queue the dummy command **Command 150** (0x608C, no damage, no hits) on Flux (actor 20), then **copy Flux's CTB counter into its own** | @0x147 to 0x165 |

Command 150 is the trigger. It reaches Flux's `onTargeted`, which runs the reaction below as **Flux's own commands**
(reactions, no CTB cost):

| # | Condition (in order) | Action | State change | Src |
|---|---|---|---|---|
| 1 | the command used is Talk | record the talker, caption/bonus scene (section 1.5) | none | m142 @0x3b8 to 0x3df |
| 2 | the command is Command 150 and **the Delay-counter flag is 255** | clear it; **forced Slowga** on all of `Frontline`; stop | flag := 0 | @0x403 to 0x412 |
| 3 | Command 150, phase-B flag = 0, `s` = 2 | forced **Full-Life** on a random living `Frontline` member that is **Zombie**; if none, on a random living member | `s` := 3 | @0x438 to 0x466 |
| 4 | Command 150, phase-B flag = 0, `s` = 4 | forced Full-Life, same targeting | `s` := 5 | @0x478 to 0x4a6 |
| 5 | Command 150, phase-B flag = 0, `s` = 6 | **Cross Cleave** on all of `Frontline` | `s` := 1 | @0x4af to 0x4b8 |
| 6 | Command 150, phase-B flag = 1, `s` = 2 | caption scene (the notice that Total Annihilation is ready), then **Special 1** on Flux himself | `s` := 3 | @0x4e6 to 0x4fe |
| 7 | Command 150, phase-B flag = 1, `s` = 4 | **Total Annihilation** on all of `Frontline` (5 hits), then **Special 2** on himself | `s` := 1 | @0x504 to 0x519 |
| 8 | Command 150, any other `s` | nothing | none | default |

So the phase-1 cycle is exactly six steps and alternates the two actors: Flux (Lance), Mortiorchis (Full-Life), Flux (Lance),
Mortiorchis (Full-Life), Flux (Dispel), Mortiorchis (Cross Cleave). **The alternation is enforced by `s`, not by a "last actor"
memory: an actor that gets a turn when `s` has the other parity does nothing, and `s` is left alone.** Phase 2 is a four-step
cycle: Flux Flare, Mortiorchis Special 1, Flux Reflect (or a caption), Mortiorchis Total Annihilation. **Total Annihilation
therefore lands on every second Mortiorchis turn from the start, and "Special 1" is its telegraph; there is no separate charge
counter.** The first use looks longer in play only when the mount's first phase-2 turn arrives with `s` = 1 (wasted).

### 2.5 Reactions to being hit

**Flux onHit (m142 f5)**, evaluated once per action that reaches him, in this order:

| # | Condition | Action | Src |
|---|---|---|---|
| 1 | HP is 0 | stop | @0x540 |
| 2 | the action was Flare and he lost HP | a caption scene only | @0x559 to 0x565 |
| 3 | HP < 52,500 (strictly) and the Protect threshold has not fired | **forced Protect on himself, if he has none right now**; threshold := 0 (**one shot: a later Dispel is never answered by this rule**); phase := 1 | @0x575 to 0x5b8 |
| 4 | HP < 35,000 (strictly) and the Reflect threshold has not fired | **forced Reflect on himself, if he has none right now**; threshold := 0 (one shot); phase := 2; `s` := 1; phase-B flag := 1; caption scene (the first of the Total Annihilation notices) | @0x5c8 to 0x623 |

Both rows can fire in the same event (a big hit across both lines). **Poison never reaches these rows: Flux has no postPoison
hook.** Attackers on the enemy side are not excluded (Flux's own Flare damage, the Mortibsorption drain and any reflected
spell all run this hook). Confidence A; rows 3 and 4 are B for when the queued reaction runs.

**Mortiorchis onHit (m143 f4)**:

| # | Condition | Action | Src |
|---|---|---|---|
| 1 | HP is 0 | clear its drop chances, **set HP and max HP to the revive HP** (4,000, then 3,000, 2,000, 1,000 and 1,000 thereafter), set "Tough"; if Flux's HP is 0 stop; otherwise **lower the revive HP by 1,000 (floor 1,000)**; then queue **Mortibsorption on Flux** (forced if a counter is not allowed at the moment, otherwise normal) | @0x18a to 0x21f |
| 2 | HP is above 0 and the command used was **Delay Attack (0x3006) or Delay Buster (0x3007)** | animation flag on Flux, **arm the Delay-counter flag (255)**, queue Command 150 on Flux (which then answers with the forced Slowga, table 2.4 row 2) | @0x231 to 0x24c |
| 3 | otherwise | nothing | |

Mortibsorption's damage is `user max HP x power / 10 = user max HP` (formula 0x10, no variance), so the drain is 4,000, 3,000,
2,000, 1,000, 1,000 ... and the **mount is back at the same value** (4,000, 3,000, ...) in the same event, because the revive
runs before the engine's death check. Mortiorchis' onTargeted (f3 @0x166): Talk gives a caption only.

**Flux onDeath (f6 @0x627, its one instruction at 0x630):** one write only: actor property 89 of actor 21 (Mortiorchis) is set to 21, its own index. The earlier lane's table names property 89 "Host" with a question mark, so read it as detaching the mount from Flux (C: the property's meaning is not read in the engine). No command is queued and no script variable changes.

**Banish and the aeon:** the script has no counter of the aeon's turns. While any aeon is in the battle, Mortiorchis passes and
Flux's turn is the Banish above; his cycle state is frozen until the aeon is gone. (The caption scenes played at pre-turn and
after Banish change nothing else.)

### 2.6 Confidence

All rows A except those marked. Cutscene scenes: only the Talk scene is a behaviour; I read the rest as captions. What I did not
decode: the exact on-screen string chosen by each caption selector (not needed for behaviour), and the engine's pairing of
Flux's reaction commands with the mount's animation.

## 3. Fight 2: Seymour, the Guado Guardians and Anima (formation `mcyt06_00`, Macalania)

Actors: **20 Guado Guardian A** (m141: HP 2,000, MP 10, STR 10, DEF 0, MAG 15, MDF 0, AGI 12, LCK 15, ACC 100),
**21 Seymour** (m124: HP 6,000, MP 100, STR 20, DEF 0, MAG 25, MDF 25, AGI 20, LCK 15, ACC 100), **22 Guado Guardian B**
(m141 again) and **23 Anima** (m125: HP 18,000, MP 50, STR 25, DEF 0, MAG 20, MDF 0, AGI 25, LCK 20, ACC 30).

| Script | init | preTurn | onTurn | onTargeted | onHit | onDeath | other |
|---|---|---|---|---|---|---|---|
| m124 Seymour (w0) | f0 @0x000 | none | f2 @0x13c | f3 @0x422 | f4 @0x587 | f6 @0x820 (empty) | postPoison f5 @0x598 |
| m141 Guardian (w0) | f0 @0x000 | none | f2 @0x12a | f3 @0x2ca | f4 @0x342 | none | |
| m125 Anima (w1) | f0 @0x012 | f3 @0x1fb | f4 @0x21e | f5 @0x365 | f7 @0x43d | f8 @0x460 | postTurn f6 @0x420 |

### 3.1 Battle start

* Formation script (init f0 @0x009): Escape and Flee off for everyone; **Talk added to Tidus (0), Yuna (1), Wakka (4)**; a
  presentation flag for Anima. Ambush state 3 (@0x2793). **Start hook (@0x27a9)** runs when the battle opens: **First Strike
  := 1 on every monster; every monster's CTB counter := 0; Seymour's := 1; the three active party members and the four
  reserves each get +2 added to their counter.** So both Guardians act first, then Seymour, then the party.
* **Talk is switched by status.** The formation script also gives Tidus, Yuna, Wakka (and Shiva, for a caption flag) a preTurn
  handler (workers w1 to w4, slots 41, 42, 45, 52; @0x6ee, 0x73d, 0x78a, 0x7b1). At the start of the character's turn, Talk is
  **enabled if the character is "present without Death, Petrify, Sleep or Silence" and disabled otherwise.** Two details of
  the script as written: Wakka's handler tests Wakka but toggles actor 1's (Yuna's) Talk, so Wakka's own Talk is never
  re-disabled and Yuna's follows Wakka's status after his turn start; Yuna's handler also plays a one-time caption at act three.
  The Flux and Natus formation scripts have no such handlers.
* m124 init: DeathAnimation "boss"; **threshold := floor(maxHP/6) x 5 = 5,000** (it later steps to 4,000, 3,000, 0), restore
  value 6,000; battle variables: act := 0, second variable := 6,000, the rest 0.
* m141 init: both steal slots hold Hi-Potion; Guard status cleared; **"Hi-Potion line" := floor(Seymour's current HP x 4 / 5)
  = 4,800** (read once from monster 124 at battle start; I assume Seymour's HP is already loaded when this runs, B).
* m125 init: Anima starts hidden with no turns, not on the CTB bar and not targetable; Overdrive gauge max 100, current 0;
  gauge mode "aeons only"; Boost immunity cleared; her summoner is Seymour; cycle index := 0.

### 3.2 Variables

| Holder | Meaning |
|---|---|
| battle[0x04] | **act** (0 until 5,000; 1 from 5,000; 2 from 4,000; 3 at Anima's arrival; 4 at her death); the formation script uses it for cameras |
| battle[0x14] | **mode**: 0 in act one; **128** from the summon until Anima dies (set by Seymour at the 3,000 line); **255** after her death (set by Anima's onDeath) |
| battle[0x0c] | caption selector shared by the Guardians and Anima |
| battle[0x18], [0x20] | talker actor and its row (Talk) |
| m124 private | first-turn flag, spell-set index (0 to 3), the four spell ids, the target pair, the threshold |
| m125 private | arrival flag (128 on arrival, 240 after her first turn, 255 after that turn ends), cycle index 0 to 3 |
| Guardian private | first-turn flag, "asleep when targeted" flag, scratch |

### 3.3 Guado Guardian turn (m141 onTurn), same for A and B

| # | Condition (in order) | Action | Src |
|---|---|---|---|
| 1 | first turn | **Protect on itself**; set the flag | @0x131 to 0x143 |
| 2 | not yet stolen from, and 4,800 > Seymour's HP (i.e. HP < 4,800) | **Hi-Potion on Seymour** (monster 124) | @0x15f to 0x16b |
| 3 | Seymour Poisoned or Silenced | **Remedy on Seymour** | @0x187 to 0x193 |
| 4 | itself Poisoned or Silenced | **Remedy on itself** | @0x1af to 0x1bb |
| 5 | `GetRandomValue() mod 100 > 50` (**48.97 %**) | picks Blizzard, Thunder or Shremedy by a second draw **and then returns without casting it: the instructions that would cast it sit after the return and can never run.** Net effect: the turn does nothing | @0x1c7 to 0x203 |
| 6 | (the other 51.03 %) Guardian A (actor 20) Asleep or Silenced | **Remedy on actor 20** | @0x23b to 0x247 |
| 7 | Guardian B (actor 22) Asleep or Silenced | **Remedy on Seymour** (the script aims it at Seymour, not at actor 22) | @0x263 to 0x26f |
| 8 | otherwise | `GetRandomValue() mod 3`: 0 Blizzard, 1 Thunder, 2 Shremedy (Confuse) on a random living `Frontline` member (stream 4) | @0x277 to 0x2c6 |

Per Guardian turn that reaches row 5, P(do nothing) = 32,095/65,536; each of the three spells = 33,441/65,536 x 1/3 = 17.0 %.
Rows 2 to 4 return before the draw, so no random number is spent on them.

**Guardian onTargeted (f3):** clears a private "asleep" mark, sets it to 255 if the Guardian is asleep right now; for Talk it only
plays a caption (which caption depends on its row and whether it is asleep).
**Guardian onHit (f4):** (1) **Guard status := 0**; (2) if it has ever been stolen from, **its steal chance := 0**; (3) stop if
HP is 0, if it is asleep now, if the "asleep when targeted" mark is 255 (the mark is cleared and nothing else happens), if it is
Threatened, or if it lost no HP (a heal or a zero-damage action); (4) **if never stolen from: queue Auto-Potion on itself** (a
reaction, no CTB). So Auto-Potion answers any damaging action, physical or magical (B9 confirmed), once per action, and one
successful Steal removes it for good.

### 3.4 Seymour's turn (m124 onTurn)

| # | Condition (in order) | Action | State change | Src |
|---|---|---|---|---|
| 1 | mode = 128 (Anima is out) | nothing | none | @0x143 |
| 2 | first turn | **Shell on himself** | flag set | @0x14e to 0x160 |
| 3 | otherwise: pick the spell set by the index | set 0 Blizzara / Blizzaga / Multi-Blizzara + Command 184; set 1 Thundara / Thundaga / Multi-Thundara + Command 186; set 2 Watera / Waterga / Multi-Watera + Command 188; set 3 Fira / Firaga / Multi-Fira + Command 182 | **index := index + 1 mod 4, before anything is cast**, so the order is Ice, Thunder, Water, Fire and it advances even on a turn aimed at an aeon | @0x164 to 0x20c |
| 4 | count the living, targetable `Frontline` members (this call also draws stream 4 when there are 2 or more) | 3 alive: exclude one party slot (`mod 3`: slot 1 with 21,846/65,536, slots 2 and 3 with 21,845/65,536 each) and order the other two by `mod 100 > 50` (ascending slot order when true, descending when false); 2 alive: the two living slots, ordered the same way; 1 alive: the same target twice. The pair is only used by row 6 | | @0x218 to 0x3b9 |
| 5 | exactly one aeon on the field | **-ga spell of the set on the living member (the aeon)** | | @0x3c6 to 0x3e4 |
| 6 | mode = 255 (after Anima) | **two commands**: the Multi- spell on the first slot of the pair, then its twin (Command 18x) on the second slot; both power 36 | | @0x3ee to 0x403 |
| 7 | otherwise | the **-ara spell of the set** on a random living `Frontline` member (stream 4) | | @0x415 to 0x41e |

### 3.5 Seymour reacting (m124 onTargeted, onHit, postPoison)

**onTargeted (f3):**

| # | Condition | Action | Src |
|---|---|---|---|
| 1 | the command used is Talk | record the talker (`LastAttacker`) and its row, caption/bonus scene, stop | @0x465 to 0x480 |
| 2 | no Guado Guardian monster remains in the battle (monsters numbered 141) | stop | @0x488 |
| 3 | the command's damage type is not physical (`flags_damage & 3` != 1: magic, items, Talk-like specials) | stop | @0x493 |
| 4 | exactly one Guardian monster present | if Guardian A is alive: **Guard status on A unless A is asleep (then nothing at all)**; if A is dead: Guard on B unless B is asleep | @0x4ab to 0x4e9 |
| 5 | two Guardian monsters present | `mod 100 > 50` (48.97 %): Guard on A if A is not asleep, else on B if B is not asleep; otherwise (51.03 %) Guard on B if B is not asleep, else on A if A is not asleep | @0x4f7 to 0x573 |

The Guard status makes the engine redirect **single-target physical** commands aimed at Seymour to a Guard holder that can act
(the one with the most HP if both hold it). The Guard is cleared when that Guardian is next hit (section 3.3). The script does
not check "alive" in row 5. B for the redirect.

**onHit (f4) and postPoison (f5)** share one body (f4 first stops if he lost no HP; postPoison skips that test, so a poison tick
can move the phase). They do nothing once mode is not 0.

| # | Condition (in order) | Action | Src |
|---|---|---|---|
| 1 | HP = 0 and mode = 0 (a lethal hit before the summon) | set his max HP and HP to 6,000, act := 2, jump to row 4 | @0x5be to 0x5df |
| 2 | HP > threshold | stop | @0x5e9 |
| 3a | HP <= 5,000 and act = 0 | act := 1; the party's Area := 1 (a battle-position index, not read by any AI rule); **threshold := 4,000** | @0x5fc to 0x66a |
| 3b | HP <= 4,000 and act = 1 (can chain in the same event) | act := 2; Area := 2; threshold := 3,000 | @0x67c to 0x6ea |
| 4 | HP <= 3,000 and act = 2 | **mode := 128; threshold := 0; Area := 3; remove his Poison, Magic Break, Armor Break, Mental Break and Slow; make him untargetable and invisible on the CTB bar; MAG := 32; both Guardians' HP := 0 (they die); his max HP and HP := 6,000; remove Talk from Tidus, Yuna and Wakka; the "will die to an attack" flag := 0; forced Special 1 aimed at Anima (actor 23)** | @0x6fc to 0x81c |

Thresholds are inclusive (<=), unlike Flux's.

### 3.6 Anima (m125)

**Arrival (onTargeted f5 @0x365):** when the command used is Special 1 and her first-turn flag is 0: she gets turns, CTB
display and targetability; **her CTB counter := 0; each of the three active party members' counter += 1**; Seymour gets no
more turns; flag := 128; caption scene.

**Turn (onTurn f4 @0x21e):**

| # | Condition (in order) | Action | State change | Src |
|---|---|---|---|---|
| 1 | flag = 128 (her first turn) | **Summon Anima** aimed at Seymour (queued first), then continue with the rows below *in the same turn* | flag := 240; act := 3; becomes visible; caption scene | @0x231 to 0x298 |
| 2 | Overdrive gauge >= 100 | **Oblivion** (0x60DF) on all of `Frontline` | gauge := 0 | @0x2a8 to 0x2c3 |
| 3 | cycle index 0 or 2 | **Boost** on herself; caption scene | | @0x2d0 to 0x2dc |
| 4 | cycle index 1 or 3 | **Pain** (0x60DE) on a random living `Frontline` member (stream 4) | **gauge += 5** | @0x2f1 to 0x30d |
| 5 | always, after queueing | | cycle index := (index + 1) mod 4 | @0x353 to 0x361 |

So her first turn queues two commands (Summon Anima, then Boost). **The gauge gains +5 on each Pain, nothing on a Boost turn
and nothing for the turn itself.** preTurn (f3): if the gauge is already >= its max, play the Oblivion caption. onHit (f7):
**gauge += 5 for every action that reaches her** (once per action, not per hit). postTurn (f6): when the flag is 240, show the
gauge and set the flag to 255.

**Death (onDeath f8 @0x460):** act := 4; Seymour is **re-initialised** (`btlResetParam`) and made visible, targetable and given
turns again, his MAG := 32; the party's Area := 4; **mode := 255**; the dismissal command (0x6051, no hits) is queued; a caption
scene. Seymour returns at full HP (6,000, set earlier and restored by the re-initialisation, B). From then on his onTurn uses
row 6 above; his onHit/postPoison do nothing.

### 3.7 Confidence

Rows A. B: the redirect by the Guard status; the effect of re-initialisation. C: the Area values (presentation only, as far as I
could see), the exact caption strings.

## 4. Fight 3: Seymour Natus and Mortibody (formation `stbv01_10`)

Actors: **20 Seymour Natus** (m126: HP 36,000, MP 200, STR 30, DEF 0, MAG 25, MDF 0, AGI 21, LCK 15, ACC 100) and
**21 Mortibody** (m127: HP 4,000, MP 50, STR 22, DEF 50, MAG 20, MDF 0, AGI 28, LCK 20, ACC 100).

| Script | init | preTurn | onTurn | onTargeted | onHit | onDeath |
|---|---|---|---|---|---|---|
| m126 (w1) | f0 @0x05c | f2 @0x245 | f3 @0x258 | f4 @0x5b8 | f5 @0x603 | f6 @0x672 (empty) |
| m127 (w1) | f0 @0x054 | none | f2 @0x191 | f3 @0x4f2 | f4 @0x50f | none |

### 4.1 Battle start

* Formation script (init f0 @0x009): Escape and Flee off for party actors 0 to 6; **Talk added to Tidus (0), Yuna (1), Auron
  (2)**; ambush state 3 (@0x1ee0). No start hook.
* m126 init: floating; attaches Mortibody to himself; **keeps control when Provoked** (so his Provoke handling below applies);
  "Tough"; DeathAnimation "boss"; **rotation index := 0, phase := 0, `battle[0x10]` := -1**; thresholds **24,000 = floor(maxHP/3) x 2,
  12,000 = floor(maxHP/3), 18,000 = floor(maxHP/2)**; adds the eight Multi-ra commands (four elements, two each).
* m127 init: not required for the battle to end; **revive HP := 4,000**; "Tough"; adds Blizzard, Thunder, Water, Fire.

### 4.2 Variables

| Holder | Meaning |
|---|---|
| battle[0x0c] | **rotation index** 0 Ice, 1 Thunder, 2 Water, 3 Fire. **Written only by Natus**; Mortibody only reads it |
| battle[0x1c] | **Natus phase** 0 / 1 / 2 (written by Natus' onHit, read by Mortibody) |
| battle[0x04], [0x08], [0x18] | talker, its row, caption selector |
| battle[0x10], [0x14] | Mortibody's last target and its row (not read by either AI) |
| m126 private | the three thresholds (second one moves from 12,000 to 18,000), a Protect-once flag, scratch |
| m127 private | revive HP (4,000, 3,000, 2,000, 1,000, floor 1,000) |

### 4.3 Natus' turn (m126 onTurn)

| # | Condition (in order) | Action | Src |
|---|---|---|---|
| 1 | an aeon is in the battle | clear the aeon's Eject immunity, **Banish** on it, caption scene; end the turn (no check of the aeon's turns) | @0x261 to 0x291 |
| 2 | phase 0 | **Multi-ra pair of the element at the rotation index**: Multi-Blizzara + Command 184, Multi-Thundara + Command 186, Multi-Watera + Command 188, Multi-Fira + Command 182 (power 36 each); **then index := index + 1 mod 4**. The two commands go to two **different** party slots when 3 are alive (exclude one slot by `mod 3`, order the other two by `mod 100 > 50`, ascending slot order when true), to the two living slots when 2 are alive, to the same member twice when 1 is alive. **Provoked: both go to the provoker, forced** | @0x29c to 0x510 |
| 3 | phase 1 | **Break** (Petrify) on a random living `Frontline` member (stream 4); Provoked: on the provoker, forced | @0x513 to 0x556 |
| 4 | phase 2 | **Flare** (the player-side Flare, 0x3052) on a random living member; Provoked: on the provoker, forced | @0x559 to 0x59c |

The mask-making `findMatchingChr` before the pair also draws stream 4 when 2 or more are alive. Targets in row 2 are slot specs
(Character 1/2/3), not actor numbers.

### 4.4 Natus reacting (onTargeted f4, onHit f5)

| Hook | Condition | Action | Src |
|---|---|---|---|
| onTargeted | command used is Talk | record the talker, caption/bonus scene | @0x5c5 to 0x5e9 |
| onTargeted | command used is Mortibsorption | clear his "immune to fractional damage" flag for this hit | @0x5f3 to 0x5ff |
| onHit | every action that reaches him | set the "immune to fractional damage" flag back to 1 | @0x618 |
| onHit | HP < 24,000 | phase := 1; if he has no Protect **and the one-time Protect flag is unset**: set the flag and queue **Protect on himself** (not forced) | @0x622 to 0x64f |
| onHit | and HP < the second threshold (12,000 at first) | phase := 2; **that threshold := 18,000 from now on** | @0x659 to 0x665 |
| onHit | HP >= 24,000 | **phase := 0** | @0x66e |

**The phase is recomputed from his HP at every hit and can go back down** (a heal above 24,000 returns him to phase 0; once he
has been in phase 2, he stays in it until his HP is 18,000 or more, then phase 1 until 24,000). A poison tick does not
update it (no postPoison hook). It does not matter who hit him, so his own reflected Multi-ra and Mortibsorption count.

### 4.5 Mortibody (m127)

**onTurn (f2):**

| # | Condition (in order) | Action | Src |
|---|---|---|---|
| 1 | an aeon is in the battle | nothing | @0x19a |
| 2 | **Desperado test.** For each of the three active party slots add 1 for each of: Shell, Haste, Reflect, Nul-Tide, Nul-Blaze, Nul-Shock, Nul-Frost (Protect and Regen are not counted). Threshold = `GetRandomValue() mod 4 + 4` (4 to 7, uniform); minus 1 while Natus' phase is 2; **0 if all three slots have Haste**. If the total >= threshold | **Desperado** on all of `Frontline`; end | @0x1ab to 0x429 |
| 3 | Natus phase 1 | **Shattering Claw** on a random living member (stream 4) | @0x431 to 0x449 |
| 4 | Natus phase 2 | **Cura** on Natus (actor 20) | @0x44f to 0x455 |
| 5 | Natus phase 0 | pick a random living member (draws stream 4; the pick is stored but unused), then **the spell at the rotation index, aimed at all of `Frontline`**: 0 Blizzard (0x603A), 1 Thunder (0x603B), 2 Water (0x603C), 3 Fire (0x6039) | @0x45b to 0x4d6 |

**The rotation index is read after Natus has advanced it**, so under strict alternation that starts with Natus the sequence is:
Natus Ice pair, Mortibody Thunder, Natus Thunder pair, Mortibody Water, Natus Water pair, Mortibody Fire, ...; if Mortibody
acts first it casts Ice and Natus then casts the Ice pair. **Desperado probability from the total** (threshold uniform on 4 to 7, so
P = (total - 3) / 4 for totals 4 to 7, 0 below 4, 1 above 7; one level easier in Natus' phase 2; 1 with Haste on all three). The
runs gave 0 % at a total of 3, 24.65 % at 4 (25 % expected) and 100 % at 9 and at 14.

**onTargeted (f3):** Talk gives a caption only. **onHit (f4):** identical to Mortiorchis' revive row (table 2.5 row 1): HP 0
becomes the revive HP, which then drops by 1,000 down to a floor of 1,000, and Mortibsorption is queued on Natus. Mortibody has
no Delay row.

### 4.6 Confidence

Rows A. The Mortibsorption target (Natus, actor 20) and drain (its max HP) are as in Flux's fight. C: the purpose of the
fractional-damage flag (Mortibsorption's formula 0x10 is not one of the two formulas that flag cancels in the damage code I read,
so the clearing may be vestigial).

## 5. Fight 4: Seymour Omnis and the four Mortiphasm discs (formation `sins03_00`)

Actors: **20 Seymour Omnis** (m131: HP 80,000, MP 999, STR 20, DEF 180, MAG 35, MDF 100, AGI 40, LCK 20, ACC 0) and
**21, 22, 23, 24 Mortiphasm discs 1 to 4** (m106: 1 HP, no stats).

| Script | init | preTurn | onTurn | onTargeted | onHit | onDeath |
|---|---|---|---|---|---|---|
| m131 (w1) | f0 @0x05f | f2 @0x193 | f3 @0xa03 | f4 @0x1769 (empty) | f5 @0x176a | f6 @0x17c3 |
| m106 (w0) | f0 @0x000 | empty | empty | empty | f5 @0x113 | empty |

### 5.1 Battle start

* Formation script init (f0 @0x009): disc states := (0, 0, 0, 1) and **opening scene 4 is run at once**. That scene (@0x506)
  turns disc 1 up one state, disc 2 down one and disc 4 up one so that **the discs end at states (1, 3, 0, 2): all four show Fire.**
  Ambush state 3 (@0xc18d). No Talk, no CTB override.
* m131 init: enlarged model, "Heavy" and "Tough", **Absorb Fire := 1 and Weak Ice := 1** (consistent with the all-Fire opening),
  **hit threshold := 5**.
* **The formation script gives every party member and aeon a preTurn handler** (workers w1 to w17, slots 41 to 47 and 49 to 58;
  Anima's, w17, also plays a one-time caption). All seventeen run **the same affinity routine as Omnis' own preTurn** (section 5.3),
  without his state checks.

### 5.2 Variables

| Holder | Meaning |
|---|---|
| battle[0x04], [0x08], [0x0c], [0x10] | **disc 1, 2, 3, 4 state, 0 to 3** |
| battle[0x14] | type of the last hit on a disc: 0 magical, 1 physical |
| battle[0x20] | bit mask of the discs hit by the current action (bit 0 = disc 1) |
| battle[0x1c] | **reset colour index** 1, 2, 3, 0, 1, ... (Omnis writes it, the reset scene reads it) |
| battle[0x18] | caption selector |
| m131 private | state `St` (0 normal, 1 glowing, 2 dispelled, 3 reset due), hit counter, hit threshold, element counts, reset counter |

**Disc state to element** (each disc has its own offset into the same ring):

| Disc | state 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| 1 | Thunder | Fire | Ice | Water |
| 2 | Ice | Water | Thunder | Fire |
| 3 | Fire | Ice | Water | Thunder |
| 4 | Water | Thunder | Fire | Ice |

**A magical hit moves a disc +1 state, a physical hit -1; that is the ring Fire -> Ice -> Water -> Thunder -> Fire in the +1
direction.** Any other damage type does nothing.

### 5.3 Omnis' pre-turn: counts and affinity (m131 preTurn f2, and the seventeen party handlers)

* In Omnis' own copy only: while `St` = 1 play a caption scene and stop; `St` = 2 caption scene and stop; `St` = 3 stop.
* Otherwise count the discs by element from the four states (the table in 5.2), **clear all sixteen of his Absorb / Null /
  Resist / Weak flags** for Fire, Ice, Water and Thunder, and set them by the **first matching branch**, tested in this order:
  an element on four discs; an element on three discs (Fire, Ice, Water, Thunder); then pairs, tested Fire, Ice, Water, Thunder;
  then all singles. Four of a kind: Absorb it and Weak to its opposite (Fire/Ice, Water/Thunder). Three of a kind: Absorb it
  and Resist the fourth disc's element. A pair: Null that element (with the exception below) and, inside the same branch, Null a
  second pair if there is one, otherwise Resist each remaining single. All four different: Resist all four.

Full result for all 35 element multisets, from running his real pre-turn and turn functions over all 256 disc layouts (every
arrangement of the same multiset gives the same row, and the spells are the ones his turn then casts, in cast order):

| Discs (F Fire, I Ice, W Water, T Thunder) | Layouts | Affinity | Spells in cast order |
|---|---:|---|---|
| FFFF | 1 | Absorb Fire, Weak Ice | Firaga, Firaga, Firaga, Firaga |
| IIII | 1 | Absorb Ice, Weak Fire | Blizzaga, Blizzaga, Blizzaga, Blizzaga |
| WWWW | 1 | Absorb Water, Weak Thunder | Waterga, Waterga, Waterga, Waterga |
| TTTT | 1 | Absorb Thunder, Weak Water | Thundaga, Thundaga, Thundaga, Thundaga |
| FFFI | 4 | Absorb Fire, Resist Ice | Firaga, Firaga, Firaga, Blizzara |
| FFFW | 4 | Absorb Fire, Resist Water | Firaga, Firaga, Firaga, Watera |
| FFFT | 4 | Absorb Fire, Resist Thunder | Firaga, Firaga, Firaga, Thundara |
| FIII | 4 | Absorb Ice, Resist Fire | Blizzaga, Blizzaga, Blizzaga, Fira |
| IIIW | 4 | Absorb Ice, Resist Water | Blizzaga, Blizzaga, Blizzaga, Watera |
| IIIT | 4 | Absorb Ice, Resist Thunder | Blizzaga, Blizzaga, Blizzaga, Thundara |
| FWWW | 4 | Absorb Water, Resist Fire | Waterga, Waterga, Waterga, Fira |
| IWWW | 4 | Absorb Water, Resist Ice | Waterga, Waterga, Waterga, Blizzara |
| TWWW | 4 | Absorb Water, Resist Thunder | Waterga, Waterga, Waterga, Thundara |
| FTTT | 4 | Absorb Thunder, Resist Fire | Thundaga, Thundaga, Thundaga, Fira |
| ITTT | 4 | Absorb Thunder, Resist Ice | Thundaga, Thundaga, Thundaga, Blizzara |
| TTTW | 4 | Absorb Thunder, Resist Water | Thundaga, Thundaga, Thundaga, Watera |
| FFII | 6 | Null Fire, Null Ice | Fira, Fira, Blizzara, Blizzara |
| FFWW | 6 | Null Fire, Null Water | Fira, Fira, Watera, Watera |
| FFTT | 6 | Null Fire, Null Thunder | Fira, Fira, Thundara, Thundara |
| IIWW | 6 | Null Ice, Null Water | Blizzara, Blizzara, Watera, Watera |
| IITT | 6 | Null Ice, Null Thunder | Blizzara, Blizzara, Thundara, Thundara |
| **TTWW** | 6 | Null Fire, Null Thunder (**Null Fire where Null Water was meant**) | Watera, Watera, Thundara, Thundara |
| FFIW | 12 | Null Fire, Resist Ice, Resist Water | Fira, Fira, Blizzara, Watera |
| FFIT | 12 | Null Fire, Resist Ice, Resist Thunder | Fira, Fira, Blizzara, Thundara |
| FFTW | 12 | Null Fire, Resist Thunder, Resist Water | Fira, Fira, Watera, Thundara |
| FIIW | 12 | Null Ice, Resist Fire, Resist Water | Blizzara, Blizzara, Fira, Watera |
| FIIT | 12 | Null Ice, Resist Fire, Resist Thunder | Blizzara, Blizzara, Fira, Thundara |
| IITW | 12 | Null Ice, Resist Thunder, Resist Water | Blizzara, Blizzara, Watera, Thundara |
| FITT | 12 | Null Thunder, Resist Fire, Resist Ice | Thundara, Thundara, Blizzara, Fira |
| FTTW | 12 | Null Thunder, Resist Fire, Resist Water | Thundara, Thundara, Watera, Fira |
| ITTW | 12 | Null Thunder, Resist Ice, Resist Water | Thundara, Thundara, Blizzara, Watera |
| **FIWW** | 12 | Null Fire, Resist Fire, Resist Ice (**Null Fire where Null Water was meant**) | Watera, Watera, Blizzara, Fira |
| **FTWW** | 12 | Null Fire, Resist Fire, Resist Thunder (**Null Fire where Null Water was meant**) | Watera, Watera, Fira, Thundara |
| **ITWW** | 12 | Null Fire, Resist Ice, Resist Thunder (**Null Fire where Null Water was meant**) | Watera, Watera, Blizzara, Thundara |
| FITW | 24 | Resist Fire, Resist Ice, Resist Thunder, Resist Water | Fira, Blizzara, Watera, Thundara |

**The Water-pair slip:** when the Water pair is the first pair the chain meets, its branch writes Null Fire instead of Null
Water. That happens only when neither Fire nor Ice is a pair (the four bold rows). Water pairs together with a Fire pair or an
Ice pair (FFWW, IIWW) are correct because those branches test Water themselves. So the wiki's "two Water discs make him immune
to Fire" is true only for TTWW, FIWW, FTWW and ITWW; with FIWW and FTWW the Fire disc also adds Resist Fire.

**The affinity changes only when one of these routines runs: Omnis' own pre-turn (outside `St` 1 to 3) and every party
member's or aeon's pre-turn, i.e. at the start of each actor's turn.** A disc turned during an action is seen at the next turn
start, not inside the same action (a Doublecast's second spell meets the old affinity).

### 5.4 Omnis' turn (m131 onTurn), by `St`

| `St` | Action | State change | Src |
|---|---|---|---|
| 0 | **Exactly four spells, always**, in the order of the table above (the pair or triple first, then singles in the branch's own order), each -ga if its element has 3 or 4 discs, -ra otherwise. **Targets:** with 3 or 4 of a kind, spells 1 to 3 go to Character 1, 2, 3 in that order (a slot whose HP is 0 gets a random living member instead) and spell 4 to a random living member; **in every other case all four spells go to random living members** (each its own stream-4 draw) | | @0xa0a to 0x16c8 |
| 1 | **Dispel** on all of `Frontline` | `St` := 2; **DEF := 100** | @0x16cf to 0x16e4 |
| 2 | **Ultima** (0x60F0, power 64) on all of `Frontline`; caption scene | `St` := 3; **DEF := 150**; caption selector := 1 | @0x16eb to 0x170c |
| 3 | **no spells.** Reset the discs: reset counter := (counter + 1) mod 4 (starts 0), so the first reset is index 1; run the reset scene | `St` := 0 | @0x1710 to 0x1742 |

The reset scene turns every disc to one element chosen by the index: **1 -> all Ice, 2 -> all Water, 3 -> all Thunder, 0 -> all
Fire** (checked over all 256 starting layouts; the first reset is Ice). DEF is never restored to 180: each cycle sets it to 100
then 150.

### 5.5 Omnis reacting

* **onHit (f5):** if HP < floor(maxHP x 1 / 4) = 20,000, hit threshold := 2 (latched: never goes back to 5 if he is healed). If `St` = 0:
  hit counter += 1; if counter > threshold, counter := 0 and **`St` := 1** (the glow). **Hits during `St` 1 to 3 are ignored**, so
  the count restarts from 0 only after the reset turn. One event per action: a miss, a heal or a status-only action counts; a
  command with no hit records does not (B).
* **onDeath (f6):** forced "Death" command on himself.
* **Discs (m106 onHit, f5):** for disc number n (21 to 24): read the damage type of the command used (`flags_damage & 3`; 1
  physical, 2 magical). Magical: last-hit type := 0, set bit n; physical: type := 1, set bit n; any other type: nothing. If any
  bit is set, run scene B0, which rotates every flagged disc by +1 (type 0) or -1 (type 1) and clears the mask. The state
  changes at the start of the rotation. **No check of targeting mode, item or spell; only the damage type decides.** A scene
  call while another scene runs is ignored.
* **An aeon on the field** (B, and run in the interpreter with the slot list as above): the aeon sits in one party slot and the
  other two read as empty with HP 0, so the "slot's HP is 0, aim at a random living member" fallback sends their casts to the aeon
  too; the cast aimed at the aeon's own slot hits it directly. **All four spells therefore land on the aeon in every layout.**

### 5.6 Confidence

Rows A (all 256 layouts; the hit counter and sequence; the disc scenes against the real motion handlers). B: the aeon row, the
"a miss counts" statement, the affinity timing. C: the individual caption scenes.

## 6. Differences from our AI

"Ours" = `src/battle/ffx/ai/*` and the engine hooks they use, at the commit this note was written against. "Game" cites the
monster id and code offset in the tables above. Matches are listed after the table.

| # | Fight | Rule | Game (script) | Ours | Effect |
|---|---|---|---|---|---|
| D-01 | Flux | What drives the two actors' alternation | A shared cycle state. An actor that acts when the state has the other parity wastes its turn and changes nothing (m142 @0x2bf, @0x41f to 0x4d6) | A "last enemy actor" memory plus parity snapping, so each actor always acts on its own parity (`seymour-flux.ts:50-60`, `:124-129`, `:172`, `:239`) | If the mount goes first the game wastes its turn and ours casts Full-Life; after a Banish turn ours shifts the cycle. Under strict alternation the order Lance, Full-Life, Lance, Full-Life, Dispel, Cross Cleave is identical |
| D-02 | Flux | Banish, and the mount while an aeon is out | No condition on the aeon's turns: Flux banishes on his next turn whenever any aeon is in the battle, and **Mortiorchis passes in both phases** meanwhile (m142 @0x281 to 0x2b1; m143 @0x137) | Banish only after the aeon has taken a turn (`seymour-flux.ts:183`); in phase 1 the mount keeps attacking the aeon (`:246-258`); only the phase-2 ladder "holds" (`:261-264`) | Ours gives an aeon at least one free turn and hits it with Lance, Full-Life and Cross Cleave first |
| D-03 | Flux | Total Annihilation timing | Phase 2 is a four-step cycle in which the mount's reactions are "ready" (Special 1, state 2) and Total Annihilation (state 4): two effective mount turns, every time. The "auto-attack" notice belongs to the phase change itself (m142 @0x4e6 to 0x519, @0x5c8 to 0x623) | A ladder that needs 2 charge turns the first time and 1 afterwards, with the notices on mount turns (`seymour-flux.ts:262-286`) | Ours' first Total Annihilation arrives one mount turn later than the game's when the turns alternate normally |
| D-04 | Flux | Protect and Reflect lines | **One shot each**: the line is zeroed when it fires, so a later Dispel is never answered by this rule (m142 @0x575 to 0x623) | Re-evaluated on every damaging hit while HP is under the line and the status is absent (`seymour-flux.ts:292-312`, called from `reactions.ts:110`) | Ours re-casts Protect and Reflect for free after the party Dispels them. In the game Reflect returns only on his own Reflect turn, and Protect never |
| D-05 | Flux | The Slowga punishment | Only when **Mortiorchis** is hit by Delay Attack (0x3006) or Delay Buster (0x3007); the answer is a forced Slowga through Command 150 (m143 @0x231 to 0x24c; m142 @0x403 to 0x412) | Any `weak-delay` or `strong-delay` action against **either** actor (`reactions.ts:103-109`, `seymour-flux.ts:349`) | Delaying Flux himself, or any other delay move, is punished in ours and not in the game |
| D-06 | Flux, Natus | Mortibsorption revive HP | The mount is restored to the revive value **before** the value decays: 4,000, 3,000, 2,000, 1,000, 1,000 (m143 @0x1ba to 0x1fd; m127 @0x558 to 0x58f); the drain equals that restored value | The drain is the same sequence, but the mount returns at the decayed value: 3,000, 2,000, 1,000, 1,000 (`scripted.ts:122-134`) | Each of the first three lives is 1,000 HP weaker in ours |
| D-07 | Flux | Threshold hook and enemy-side attackers | Flux's onHit has no attacker test: his own Flare after his Reflect is dispelled, and any reflected spell, run it (m142 @0x533) | Counters are collected only for player-side actions (`reactions.ts:81`) | Self-inflicted damage cannot trip the 75 % or 50 % line in ours |
| D-08 | Flux | Mount and Flux CTB | At the end of its turn the mount copies Flux's CTB counter into its own (m143 @0x162) | Not modelled | The two actors stay in lockstep in the game; in ours only their equal Agility keeps them together |
| D-09 | Macalania | Opening turns | Each Guardian's first turn is a real Protect, Seymour's a real Shell; the start hook sets every monster's CTB to 0 (Seymour 1) and adds 2 to the party (m141 @0x131; m124 @0x14e; `mcyt06_00` @0x27a9) | Statuses applied at setup for free (`macalania-rules.ts:221-233`) | Ours spends no enemy actions on them and does not shift the opening CTB order |
| D-10 | Macalania | Guardian turn | Remedy on Seymour for Poison **or Silence**; in the 51 % branch two more Remedy rows (Guardian A asleep or silenced: on A; Guardian B asleep or silenced: **on Seymour**); the do-nothing chance is **48.97 %**, and the spell chosen in that half is never cast (m141 @0x187, @0x1c7 to 0x203, @0x23b to 0x26f) | Remedy on Seymour for Poison only; no ally-cure rows; a flat 50 % pass (`seymour-anima-macalania.ts:98`, `:107`) | Ours leaves a silenced Seymour and an asleep or silenced Guardian uncured |
| D-11 | Macalania | Cover | One Guardian gets Guard each time a **physical-type** command targets Seymour: with two Guardians a 48.97 / 51.03 split, skipping a sleeping one; the status is cleared when that Guardian is hit; the engine redirects single-target physical commands only, to the Guard holder that can act (m124 @0x42b to 0x586; engine 0x78eef0, 0x78ba70) | The first living, targetable Guardian always covers single-target physical commands (`targeting.ts:261-288`, `macalania-rules.ts:230-233`) | Ours covers with a sleeping Guardian, always prefers Guardian A, and cannot let a hit through while both are asleep or Threatened |
| D-12 | Macalania | Guardian Auto-Potion | Not if the Guardian was asleep when targeted, not for a heal or a zero change, never after a steal; a stolen-from Guardian's steal chance becomes 0 (m141 @0x2cd to 0x2e9, @0x35b to 0x3e1) | Fires after any damaging player-side action while not stolen from and not Threatened (`seymour-anima-macalania.ts:125-130`, `reactions.ts:121-125`) | Ours triggers on a Guardian that was asleep and keeps a second-steal chance (the game's is 0) |
| D-13 | Macalania | Act-three double cast | Two commands (the Multi spell, then its twin) at **two different party slots** when two or more members are alive; the same member twice only if one is left (m124 @0x218 to 0x3b9, @0x3ee to 0x403) | One record with two hits at random enemies, with replacement (`seymour-anima-macalania.ts:62-66`, `seymour-anima-macalania-abilities.ts:103-128`) | Ours can hit one member twice while two or three are standing (C-3 in the earlier note: the halves are separate commands) |
| D-14 | Macalania | Anima's Overdrive gauge | +5 on each Pain only (her turns 2 and 4 of the loop); +5 per action that reaches her; Boost turns add nothing and the turn itself adds nothing (m125 @0x30d, @0x43d) | +10 on every turn she takes and +5 per targeting (`seymour-anima-macalania.ts:149`, `macalania-rules.ts:153-154`) | Ours fills the gauge roughly twice as fast from her own turns, so Oblivion arrives earlier |
| D-15 | Macalania | Anima's arrival and first turn | On arrival her CTB counter is 0 and **each active party counter +1** (she acts first); her first turn queues Summon Anima (at Seymour, no hits) then Boost (m125 @0x37a to 0x41c, @0x231 to 0x298) | Her CTB is set to 0 (`src/battle/ffx/forms.ts:95`); the party counters are untouched; no Summon Anima command | A party member whose counter was 0 can act before her in ours |
| D-16 | Macalania | Seymour during act two | He has no turns at all (turns off, CTB entry hidden) (m124 @0x6fc to 0x81c; m125 @0x37a) | He keeps turns and spends them on a zero-hit "Wait" (`seymour-anima-macalania.ts:50`) | Same play, but ours shows idle enemy turns and consumes enemy slots |
| D-17 | Macalania | Seymour's lethal-hit protection | A lethal hit before the summon is not clamped: HP 0 triggers the summon, his HP is set to 6,000 and MAG to 32 at that moment (m124 @0x5be to 0x5df, @0x6fc to 0x81c) | A 5,999 per-hit cap and an HP floor of 1 until the summon; MAG 32 and the heal at the dismissal (`macalania-rules.ts:78-83,262-312`) | Same outcome in play; only the moment of the heal and the MAG change differ (he is untargetable between) |
| D-18 | Macalania | Talk availability | Switched on or off at the start of each talker's turn by "present without Death, Petrify, Sleep, Silence"; Wakka's handler actually toggles Yuna's Talk (`mcyt06_00` @0x6ee, @0x73d, @0x78a) | Available whenever the talker has not used it (`macalania-talk.ts:35-38`, `index.ts:123`) | A Silenced talker can still Talk in ours; in the game the command is off (until the next refresh) |
| D-19 | Natus | Who advances the element rotation | **Natus** advances it, after each of his casts; Mortibody only reads it (m126 @0x29c to 0x2f1; m127 @0x46a to 0x4d6) | **Mortibody** advances it and Natus answers in kind (`seymour-natus-rules.ts:175-193`) | If Natus acts first the game's Mortibody casts the next element (Thunder) while ours casts Ice again; ours then repeats an element on both actors where the game moves on at every Natus turn |
| D-20 | Natus | Phase rule | Recomputed from his HP at every hit and **can go back** (healed above 24,000: phase 0); the third-phase line moves from 12,000 to 18,000 once reached (m126 @0x60c to 0x66e) | A forward-only stored phase with fixed lines (`seymour-natus-rules.ts:44-46`, `:132-146`) | A healed Natus keeps Break or Flare in ours |
| D-21 | Natus | Desperado | The buff-count ladder is real: the sum of Shell, Haste, Reflect and the four Nuls over the three party slots against `mod 4 + 4` (minus 1 in Natus' phase 2; 0 if all three are Hasted) (m127 @0x1ab to 0x429) | Haste on all three only, "ladder not built" (`seymour-natus-rules.ts:201-206`) | Ours never casts Desperado for Shell, Reflect or Nul stacks |
| D-22 | Natus | Banish, and Mortibody with an aeon out | No condition on the aeon's turns; Mortibody does nothing while an aeon is present (m126 @0x261; m127 @0x19a) | Banish after one aeon turn (`seymour-natus-rules.ts:212-217`); Mortibody keeps acting, only Desperado is suppressed (`seymour-natus.ts:70-83`) | As D-02 |
| D-23 | Natus | Natus' Protect | One shot; cast only if he holds no Protect at that moment, and the flag is set only then (m126 @0x640 to 0x64f) | One shot regardless of status (`seymour-natus-rules.ts:137-143`) | Differs only if he already holds Protect at the line |
| D-24 | Omnis | Reset colour order | Ice, Water, Thunder, Fire (the counter starts at 1) (m131 @0x1710; scene @0x6be) | Water, Ice, Thunder, Fire (`seymour-omnis-rules.ts:99`, `:250`) | The first two resets are swapped |
| D-25 | Omnis | Disc ring and turn directions | +1 (magic) is Fire -> Ice -> Water -> Thunder -> Fire; physical is the reverse (m106 @0x1842 to 0x1b28) | Ring Fire, Water, Ice, Thunder; spell = -1 step, blow = +1 step (`seymour-omnis-rules.ts:109`, `:227-229`) | Every disc turn lands on a different colour: a Fire disc hit by magic goes to Ice in the game and to Thunder in ours; hit physically, Thunder in the game and Water in ours |
| D-26 | Omnis | Number, order and aim of the spells | **Always four**, ordered by element group (pair or triple first); only three-of-a-kind and four-of-a-kind aim spells 1 to 3 at Character 1 to 3, every other layout aims all four at random living members (m131 @0xa0a to 0x16c8) | One cast per disc left to right, `min(4, living + 1)` casts, disc i at living member i (`seymour-omnis.ts:132-146`) | Ours casts fewer spells with members down and pairs element and target by disc order |
| D-27 | Omnis | The reset turn | The third turn of the sequence is **only** the reset: no spells (m131 @0x1710) | The reset, then four spells in the same turn (`seymour-omnis.ts:100-103`) | The game gives the party one extra spell-free turn per cycle |
| D-28 | Omnis | Hit counter during the sequence | Hits while the sequence runs (glow, Dispel, Ultima, reset) are ignored; counting restarts after the reset turn; the lower threshold latches (m131 @0x1785 to 0x17c2) | Zeroed at Ultima, counts again before the reset turn; the threshold is re-read each time (`seymour-omnis.ts:93`, `seymour-omnis-rules.ts:279`, `:322-345`) | Ours can start the next glow early, and a healed Omnis returns to six |
| D-29 | Omnis | What counts as a hit | One event per action that reaches him: a hit, a miss, a heal or a status-only action; a command with no hit records does not count | A `damage` event from a non-healing action (`seymour-omnis-rules.ts:316-322`) | Ours skips misses and status-only actions (B: depends on the engine reading in section 1.1) |
| D-30 | Omnis | Affinity timing | Recomputed at the turn start of Omnis (outside `St` 1 to 3) and of every party member and aeon (formation script, 17 handlers) | Applied the instant a disc turns or resets (`seymour-omnis-rules.ts:230-241`, `:255`) | Ours lets a Doublecast's second spell meet the new affinity; the game does not |
| D-31 | Omnis | Water pairs | Null Fire (not Null Water) only when the Water pair is the first pair the chain meets (TTWW, FIWW, FTWW, ITWW); with a Fire or Ice pair it is Null Water as intended | Every exactly-two-Water layout gives Null Fire and drops Null Water (`seymour-omnis-rules.ts:194-197`) | FFWW and IIWW differ (and ours adds Null Fire to IIWW, where the game has Null Ice and Null Water) |
| D-32 | Omnis | What turns a disc | Any command that reaches a disc and whose damage type is physical (-1) or magical (+1); the script does not look at target mode or item | Single-target physical, or a damaging single-target spell; items and all-target actions excluded (`seymour-omnis-rules.ts:288-294`) | If all-target commands or typed items reach the discs in the game, ours ignores them (which commands the engine lets reach a disc was not read: C) |
| D-33 | Omnis | Spells with an aeon out | **All four spells land on the aeon in every layout**: empty party slots read HP 0 and fall into the random-living fallback, and the aeon's own slot hits it directly (m131 @0xa0a to 0x16c8; engine 0x7adf90, 0x7adae0, 0x794330) (B) | `min(4, 1 + 1)` = two casts, always (`seymour-omnis.ts:136`) | The aeon takes two spells too few in ours |

**Matches** (checked against the script and left alone): Flux's phase-1 order and targets (Full-Life prefers a Zombie member),
phase-2 Flare at himself and the Reflect loop, the 75 % and 50 % lines (52,500 and 35,000) as lines, all three Talk tables, the
Guardians' Hi-Potion line (4,800) and Remedy-on-self row, Macalania's Ice-Thunder-Water-Fire order and the -ga tier against an
aeon, Anima's Boost/Pain alternation starting with Boost and Oblivion at 100, Natus' 24,000 line for the first crossing and
his Break and Flare phases, Mortibody's three phase rows, Omnis' -ra/-ga classification, the all-Fire opening and its
Absorb Fire / Weak Ice, the six-hit rule (three under 20,000 HP), Dispel DEF 100 and Ultima DEF 150, and the four-of-a-kind weakness
pairs (Fire/Ice, Water/Thunder).

## 7. What this changes in the earlier lane's FINDINGS (B8 Omnis, B9 Macalania)

B8, line by line: the four discs are the Mortiphasm actors 21 to 24, each in state 0 to 3 **(confirmed)**; the ring is Fire, Ice,
Water, Thunder in the +1 direction **(confirmed)**; magic +1, physical -1, other nothing **(confirmed; the test is the command's
damage type, whatever the target mode or item)**; state 0 per disc **(confirmed)**; starting states (0, 0, 0, 1) is the value
the formation script writes, **but an opening scene then turns discs 1, 2 and 4 so the discs actually start at (1, 3, 0, 2), all
Fire**; four of a kind absorbs it and is weak to the opposite **(confirmed)**; "four spells, one per disc" should read **four
spells ordered by element group, not by disc**; "three of a kind is 3 Aga plus one Ara" and the other layouts being all Ara
**(confirmed)**; "slots 1 to 3 targeted in order, random if dead" holds **only for three or four of a kind**, all other layouts
are fully random; the hit rule and the three-turn sequence **(confirmed)** with these additions: the reset turn has no spells,
hits are ignored during the sequence, the counter threshold latches at 2 under 20,000 HP, DEF is set to 100 then 150 every cycle,
and the **affinity is refreshed at every turn start of any actor**, which B8 did not mention.

B9, line by line: actor order **(confirmed)**; the three HP lines and the Ice, Thunder, Water, Fire rotation **(confirmed; the lines
are inclusive and the rotation advances before the cast)**; at 3/6 Seymour becomes untargetable, loses his turns (Anima's arrival
removes them), is healed to 6,000 (at the summon) and both Guardians die, Anima appears **(confirmed)**; when Anima dies he
returns **(confirmed; he is re-initialised, MAG 32)**; the Guardians' cover **(confirmed, with the Guard mechanics above)**; the
Guardian's Auto-Potion conditions **(confirmed, with the asleep and steal details)** and the Hi-Potion line **(confirmed: 4,800)**;
Anima's gauge "+5 per hit taken and +5 per attack turn" **(confirmed if "attack turn" means the Pain turn only)**; Boost/Pain
alternation and Oblivion at 100 **(confirmed)**. C-3 (does a Nul absorb both halves of act three's Multi cast): the two halves are
**two separate commands at two different party slots** when two or more members are standing, so one Nul charge can never
meet both halves unless a single member is left.

## 8. Not decoded, or still open

* The cutscene scenes: only their effects on state (Talk bonuses, disc rotation, and the reset) were read; the rest are captions
  and cameras. I did not decode which string each caption selector shows.
* Whether the engine really executes a reaction record in the exact order and conditions I traced (0x7929b0, `pp_BtlQueueAction`).
  The CTB cost (none for a reaction) and the "attacker is not itself in a counter" test (used by Mortiorchis, Mortibody and the
  Guardians through `isCounterattackAllowed`) are read, not run.
* Initial CTB of Flux, Natus and Omnis: no script overrides it; the engine's ordinary start routine applies (not re-read here).
* `Area`, `Position` and the camera/motion properties the scripts set are battle-placement or presentation; I found no AI rule that
  reads them.
* The purpose of Natus' "immune to fractional damage" toggling around Mortibsorption (section 4.6).
* **New for the anchor map:** the picker used by every `findMatchingChr` draws **RNG stream 4**, indexing candidates in ascending
  actor number, and a call whose result is thrown away still draws.
