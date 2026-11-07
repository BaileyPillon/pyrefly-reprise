# FFX Spherimorph (Macalania Woods spring): record, formation and AI read from the game's own files

**Game case: FFX only.** Spherimorph (`m121`, formation `mcfr03_00`, the spring in Macalania Woods, between the Thunder Plains and Lake Macalania) exists only in FFX. FFX-2 has no counterpart; nothing here applies to it. Part of the `re-parity` track (new chapters), wave-3 sequel of the Sanctuary Keeper and Via Purifico notes, whose method this note reuses. Drafted 2026-11-06 for program row 41 (`PLAN.md`). **Treeless: record, formation and AI only. No engine, data, AI or art file was changed; nothing here ran in a browser.**

**Source and tags** (as in the sister notes `re-ffx-sanctuary-keeper.md` and `re-ffx-geosgaeno-evrae-altana.md`).

- **[bytes]** read from the game's own file by a script of this lane (Steam build 25501027, `FFX_Data.vbf`, unpacked read-only earlier and kept outside the repo, hard rule 8). **[disasm: file @offset]** read from the Atel disassembly; no script line is reproduced.
- **[run]** the real bytecode of `m121` ran in the small Atel interpreter of the earlier AI lanes (`sim.mjs`, `sim2.mjs`, used unchanged; this lane's driver adds the command-property reads the script makes: damage type, HP class, the five element bits, and the "for actor" read that adds the attacker's weapon element) against a mock battle with the real command-table rows, with exact tallies over all 65,536 results of the shared random stream where a draw is involved. **[engine]** the earlier lanes' decompile corpus. **[arith]** the repo's own kernels (`kernel/ctb.ts`, `kernel/damage.ts` of the clean tree, read only): variance 240 to 271, no criticals.
- **[note: X]** a checked note in this repo (`research/re-ffx-damage.md`, `re-ffx-ai-seymour.md`, `re-ffx-targeting.md`, `ffx-seymour-anima-macalania.md`). **[guide: Jegged / GG / SG]** a community guide, cited by name only (Jegged.com "Macalania Woods"; Gamer Guides "Spherimorph"; Samurai Gamers "Spherimorph Boss Guide"), read 2026-11-06; nothing copied. **GameFAQs, StrategyWiki and the Final Fantasy wiki answered HTTP 403 (a browser check) and the brief bars the browser, so none was read; the tie-break "GameFAQs wins" was never needed (the files settled every conflict).** **[observed]** the 2026-09-26 Steam session in `research/observed-ffx-steam-2026-09-26.md` (party Tidus, Auron, Lulu). **[inferred]** not read directly.

Files used (size in bytes): monster file `m121` (51,336; the AI is **3,277 bytes of code**, the rest is model and motion data); formation `mcfr03_00` (21,568); kernel tables `monmagic2.bin`, `command.bin`, `monster1.bin`, `btl.bin`, `ctb_base.bin`. The record in the monster file (chunk 2, 0x14 to 0x7F) equals the kernel row byte for byte. **The "51 KB script" of the plan is the file size.** Move and item names are the English names of the game's own tables.

## 0. The one-screen summary

- **One monster, one formation, one battle.** `mcfr03_00`, battle id 313 << 16 (20,512,768); Spherimorph is slot 0 (actor 20), no helper. **Escape and Flee are disabled for every character; Normal start; not a water battle.** (Whether a defeat is a game over is set by the launching field event's battle-flag word, which was not read; the guides treat it as a story fight, so the chapter should too.) Three party entries and **three aeon entries** (at this story point Valefor, Ifrit and Ixion; Shiva comes at the temple after it). [bytes] [disasm]
- **12,000 HP, DEF 100, MDEF 0, Armored.** Armored means a physical hit is divided by 3 unless the weapon or command pierces (Auron's and Kimahri's weapons do). Immune to Death, Petrify, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, **Slow**, Life, Scan and Sensor ("Immune to sensors" in the HELP bar [observed]), Delay (CTB damage), Slice and Bribe. **Not immune to Gravity-type percentage damage, to Zombie, or to any of the four Breaks (all land)**; Poison lands (byte 90) and costs 600 a tick; Threaten starts at 25 percent. [bytes]
- **The fight is a puzzle, not a damage race.** It has **only two actions of its own: a plain Attack on a random living front-line member, and, once below half HP (6,000), a 50 percent chance per turn of Press** (half of everyone's current HP, physical class so Protect halves it). **Every spell it casts is a counter.** [disasm] [run] (4.2)
- **A four-state weakness machine.** At the start one of four states is drawn (exactly 16,384 of 65,536 each): *weak Fire, weak Ice, weak Thunder, weak Water*. In a state it is weak (x3/2) to that one element and **absorbs the other three and Holy** (absorbed damage heals it). [bytes] [run] (4.1)
- **It answers a hit according to what hit it, and the answer reveals the weakness.** A plain physical hit makes it cast, on the attacker, the **opposite** element of its weakness (weak Fire answers Blizzard; weak Ice answers Fire; weak Thunder answers Water; weak Water answers Thunder). An absorbed spell is answered on the **whole front line** with the same opposite element (a weaker player-side row when an aeon is on the field). **Hitting it with its weakness is answered by no spell at all: it shifts to a new state drawn uniformly over all four, so one time in four it stays the same.** [run] (4.3)
- **The numbers that matter, against the repo's Macalania cells (an `[estimate]`, the Temple build one region later):** its Attack 225 to 277 on one member, a monster-side spell 235 to 324 (half with Shell), the counter on the attacker 167 to 231, **Press 425 to 950 from full HP**; Lulu's Fira on the weakness 1,822 to 2,056, Firaga 3,454 to 3,900; Tidus's plain Attack does **42 to 47** (Armored), Auron's 382 to 431. [arith] (6)
- **Rewards:** 4,000 gil, 3,240 AP (4,860 overkill), Lv. 2 Key Sphere, steal Ether or Turbo Ether, gear (four Strike weapons, Piercing on two rows; four Ward armours). [bytes]
- **Sources agree with the files** on the mechanic, HP, Press and the weakness rule. Differences: Samurai Gamers lists MDEF 1, Evasion 1 and overkill AP 4,680 (the file: 0, 0, 4,860) and "Absorbs: none" (the file writes the absorb flags at run time), Jegged says "immune" where the file says absorb, and no guide mentions the Scan reply, the Doublecast rule or that a weakness hit draws no counter. (section 7)
- **Recommendation for the chapter shape and every pick is in `docs/plans/ch-spherimorph-review.md` (the draft beside this note).**

## 1. The monster record (a)

Offsets are record offsets (chunk 2; layout [note: re-ffx-dark-aeons.md 1; FFX-H02 3.1]). Height, model and hit box were not read.

### 1.1 Identity

Monster word 0x1079, model word 0x1079, CTB icon 21, Doom byte 20, death animation "Boss" (the body stays, untargetable), forced-action byte Attack (a Provoke-forced move that never fires: Provoke is immune). Slot 0 = battle actor 20. Birth animation none. [bytes] [disasm: m121 @0x0000 to @0x0111]

### 1.2 Stats

| Field | Value | Tag |
|---|---|---|
| HP / MP / overkill threshold | 12,000 / 100 / 2,000 | [bytes] |
| STR / DEF / MAG / MDEF | 20 / 100 / 20 / 0 | [bytes] |
| AGI / LCK / EVA / ACC | 15 / 15 / 0 / 30 | [bytes] |
| Tick speed (from AGI 15) | 12 (36 CTB per rank-3 action; 18 Hasted; Slow is immune) | [arith] |
| Flag byte +0x28 | 0x1D: **Armored**, immune to Life, to Sensor, to Scan-again | [bytes] |
| Flag byte +0x29 | 0x07: immune to CTB damage (Delay Attack and Buster do nothing), to Slice, to Bribe | [bytes] |
| Poison damage byte | 5 (**5 percent of 12,000 = 600 per tick**) | [bytes] [note: re-ffx-ctb-status.md 14.4] |
| Element absorb / immune / resist / weak (record) | none of them: **the script writes them at run time (4.1)** | [bytes] |
| Automatic statuses | none | [bytes] |
| Extra-immunity word | 0x0301: Scan, Eject, Auto-Life | [bytes] |
| Command list (+0x50) | Fire, Blizzard, Thunder, Water (monster rows 0x6039 to 0x603C), Elemental Shift 0x6036, Death 0x6067 | [bytes] |
| Added by the script at init | the four **player-side** rows Blizzard 0x3041, Fire 0x3042, Thunder 0x3043, Water 0x3044, and Press 0x603F | [disasm: m121 @0x03a0 to @0x03c4] |

**Status bytes** (255 immune; otherwise the move's chance minus the byte, and a 254-chance move lands on anything below 255 [engine: pp_BtlInflictStatus 0x0078AE00]; Threaten's byte is a success percentage [note: ffx-seymour-anima-macalania.md 0]): Death 255, **Zombie 0**, Petrify 255, **Poison 90**, **Power, Magic, Armor, Mental Break 0**, Confuse 255, Berserk 255, Provoke 255, **Threaten 25**, Sleep 255, Silence 255, Darkness 255, Shell, Protect, Reflect, the four Nul, Regen, Haste 0, **Slow 255**. [bytes]

What that means for the player moves: all four Breaks land on 100 of 101 rolls from a 100-chance move; Bio and Poison Fang (254) always poison it; Threaten (starts at 25 percent, 17, 11 ... after each success [note: ffx-combat-core.md 4.4]) rarely lands; Slow, Sleep, Silence, Darkness, Confuse, Provoke, Petrify, Death never. Armor Break also removes the Armored division on physical hits [note: re-ffx-damage.md 4, step 13]. [bytes] [arith]

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5])

4,000 gil; 3,240 AP, 4,860 on overkill; normal drop **Lv. 2 Key Sphere** x1 (overkill x2); steal **Ether** (common) or **Turbo Ether** (rare), one each; bribe item Potion but Bribe is immune; always one piece of gear: weapon abilities Firestrike, Icestrike, Lightningstrike, Waterstrike (Piercing too on two of the fourteen rows), armour abilities the four Wards; Zanmato level byte 3; Pilfer Gil 16; arena price 6,000. [bytes] Jegged and Samurai Gamers agree on the drop, the steal and the gear families. [guide]

## 2. The formation (b)

`mcfr03_00`: battle id 313 << 16 (area key 313, formation 0). Block bytes: voice 0, foot-sound bank 14, **in-water 0**; monster word 0x1079 in slot 0, the other seven empty. [bytes]

**What the script does.** Disables **Escape (0x3003) and Flee (0x3018) for every character** (the group "all characters"), `btlSetMapCenter(-20, 0, 83)`; the start type is **Normal** (3); `btlSetRandPosFlag(0)`; four actor lights. Nothing else is disabled: **Switch, Summon, Defend and every other command stay**. Most of the file (about 2,200 lines of disassembly) is camera work chosen by which actor acts. [bytes] [disasm: mcfr03_00 @0x0009 to @0x0021, @0x3028 to @0x3076]

**Messages.** The formation carries a voice line and two on-screen hints, all about the one fact the fight teaches: *it takes damage from only one element and absorbs the rest*. The opening line plays when **Lulu (actor 5)** is alive and not Silenced at the start (the formation's first handler); a repeat hint (banner) and a second banner are raised by the monster script the first time an **absorbed elemental spell** lands (scene B 0 if Lulu is in the front line and no scene has run, scene B 2 afterwards). The texts are the game's own and are **paraphrased here, not copied**; the chapter writes its own lines. [bytes] [disasm: mcfr03_00 @0x0029 to @0x00C0; m121 @0x05ae to @0x05db]

**Start positions** (chunk 3; one area): party (35, 0, 85), (0, 0, 75), (-35, 0, 85); **three aeon entries** at (0, 0, 55), (0, 0, 40), (0, 0, 40); Spherimorph (0, -14, 140). Three party entries, never more. [bytes]

**How the game launches the fight:** from the field event on the spring path (the guides: "the battle starts when you walk forward on the path" [guide: Jegged]); not read. [guide]

## 3. The engine facts the script leans on

- **Hooks.** One AI worker (slot 61) binds onTurn, onTargeted, onHit and onDeath; a second worker (slot 4) carries presentation only (the attack and the spell motions). [bytes] [disasm: m121 @0x03cc, @0x0410, @0x05df, @0x0a66]
- **onTargeted** runs before the damage, **onHit** after it (once per action per target, before the death check [note: re-ffx-ai-seymour.md]). The script reads `usedCommand()`, its damage type (1 physical, 2 magical, 0 special), whether it affects HP, the five element bits of the command, **for a physical or special command the attacker's own element bits (the weapon's, through the "for actor" read)**, `LastDamageTakenHP` (property 166, negative for a heal) and `isDoublecasting` of the last attacker (property 313). [disasm] [note: `HitReport.lastDamage` in `ai/hooks.ts` is the same definition]
- **`isCounterattackAllowed()`** is tested by onHit; **Threaten on it** and **HP 0** also end the handler before any reply. [disasm]
- **Random draws.** `GetRandomValue()` is stream 2 masked to 16 bits: modulo 4 is exactly uniform (16,384 each of 65,536); modulo 100 gives residue 0 to 35 on 656 and 36 to 99 on 655 of 65,536. `findMatchingChr` is a uniform pick among the living, targetable members of the group, one stream-4 draw with two or more candidates. [run]
- **Absorb, weak and the damage steps** [note: re-ffx-damage.md 5]: a weak element multiplies by 3/2; an absorbed element negates the hit (a heal); Armored divides by 3 unless the command carries the pierce bit (all player spell rows do; plain Attack does not unless the weapon pierces).

## 4. The AI (m121, worker 0 of the monster file) [bytes] [disasm: m121 @0x0003 to @0x0a66] [run]

### 4.1 Set-up (init f0) and the state table

Death animation "Boss"; **the half-HP line v12 = 6,000** (max HP / 2); counters v0 = 0, v1 = 0; the five added commands. Then **one stream-2 draw modulo 4 picks the state** (the same block runs again on every shift):

| State (v6) | Weak (x3/2) | Absorbs | Counter on a physical hit (player-side row, v9) | Counter on magic (monster-side row, v10) |
|---:|---|---|---|---|
| 0 | Fire | Ice, Thunder, Water, **Holy** | Blizzard 0x3041 | Blizzard 0x603A |
| 1 | Ice | Fire, Thunder, Water, Holy | Fire 0x3042 | Fire 0x6039 |
| 2 | Thunder | Fire, Ice, Water, Holy | Water 0x3044 | Water 0x603C |
| 3 | Water | Fire, Ice, Thunder, Holy | Thunder 0x3043 | Thunder 0x603B |

(The counter is always the **opposite** of the weakness: Fire and Ice are a pair, Thunder and Water are a pair.) Holy is absorbed in every state. [run: all four states]

### 4.2 The turn (onTurn), once per Spherimorph turn

- **HP below 6,000 and a stream-2 draw modulo 100 below 50 (32,786 of 65,536 = 50.027 percent): Press on the whole front line.** HP exactly 6,000 does not count (strictly below).
- Otherwise: **Attack on a uniformly random living front-line member** (one stream-4 draw).

It never casts a spell on its own turn. A turn is 36 CTB (AGI 15), as often as a Tidus with AGI 15. [run: HP 12,000, 6,000, 5,999; all 65,536 draws]

### 4.3 When it is hit (onTargeted, then onHit)

**onTargeted** (before damage). For a magical command it reads the five element bits of the command; for a physical or special one it reads the attacker's (weapon) bits. Nothing is recorded for a command that affects no HP (Bio, Dispel, Slow, Haste, Esuna and the like: **no reply at all**), nor for one with no element (v19 = 0). It marks the hit **"absorbed" (v11 = 128)** when the command lacks the element of the current weakness, or carries Holy. A multi-element command that contains the weak element is *not* absorbed unless it also carries Holy. On an absorbed magical hit it raises the hint scene (4.2 above). [disasm] [run]

**onHit** (after damage), in this order; the first line that applies ends it:

1. HP 0, Threaten on it, or counterattacks not allowed: **nothing**.
2. **Doublecast:** if the last attacker is Doublecasting and the rule has not yet been armed, arm it and **ignore this spell** (the first of the pair); the second spell is handled normally. [run]
3. **Scan (0x3032): reply with the monster-side counter spell on the whole front line.** (Not in any guide; the Sensor-immune HELP text of the observed session is the sibling fact.) [run]
4. A command that **does not affect HP**: nothing.
5. **Magical command:** absorbed (4.3 above) -> reply on the **whole front line** with the monster-side row, **or with the player-side row when any aeon is on the field**; element-free magic that affects HP (Flare, Demi, Ultima) -> the monster-side row on the front line; **an elemental spell of the weakness -> no reply, shift.**
6. **Physical command:** it took damage and the weapon or command has an element -> shift; otherwise -> the **player-side row on the attacker**. (An elemental weapon of an absorbed element heals it and is answered on the attacker.) [run: all four states]
7. **Special command (Overdrives, Wakka's reels and shots, Mix grenades, Steal, Lancet and the like):** healed (absorbed element) and elemental -> the monster-side row on the front line; damage and elemental -> shift; element-free -> the player-side row on the attacker. The list the script calls out by id is Wakka's Fire, Ice, Water and Thunder Shots (their element is recomputed without Holy) and his Element, Attack, Status and Aurochs Reels. [disasm] [run]
8. **The shift:** a stream-2 draw modulo 4 picks the new state (**uniform over all four, the old state included: 16,384 of 65,536 each from every state**), the flags and the counter rows are rewritten at once, and Spherimorph queues **Elemental Shift** (a no-damage action) on itself. [run]

So a plain Attack (Tidus, unelemented weapon) is the **probe**: it is always answered by the opposite element on the attacker, which names the weakness; the next cast of the opposite element by Lulu hits for x3/2 and triggers the shift; the probe is needed again unless the draw repeated the state (25 percent).

### 4.4 Death

onDeath forces the "Death" action on itself (the body stays). [disasm: m121 @0x0a66]

## 5. The move rows (c)

Rows of `monmagic2.bin` (0x6xxx) and `command.bin` (0x3xxx). Rank 3 for all of these.

| Row | Id | Target | Damage | Formula / power | Hit | Notes | Tag |
|---|---|---|---|---|---|---|---|
| Attack | 0x6000 | one | physical | f1 / 16 | formula 2, byte 90 | | [bytes] |
| **Press** | 0x603F | front line (by the script) | physical class | **f5 / 8: half of the target's current HP, no variance** | always | Protect halves it | [bytes] [note: re-ffx-damage.md 4 step 4] |
| Fire, Blizzard, Thunder, Water (monster) | 0x6039 to 0x603C | one (by the script, the front line) | magical, element | f3 / 16 | always | reflectable | [bytes] |
| Fire, Blizzard, Thunder, Water (player-side) | 0x3042, 0x3041, 0x3043, 0x3044 | the attacker or the front line | magical, element | f3 / 12 | always | MP 4 in the row; reflectable; pierces armor | [bytes] |
| Elemental Shift | 0x6036 | self | none | none | always | the shift action | [bytes] |
| Death | 0x6067 | self | none | none | | forced on death | [bytes] |

## 6. Numbers (arithmetic only; no engine ran)

Cells are the repo's Macalania preset (`src/data/ffx/builds/macalania.ts` and `macalania-bench.ts` at `origin/main`, an `[estimate]`: the Temple one region after the Woods, with Shiva in the roster; the Woods build is this minus Shiva). Tidus HP 1,265 DEF 13 MDEF 11 AGI 21; Yuna 1,182 / 9 / 31 / 12; Rikku 850 / 11 / 11 / 23; Wakka 1,375 / 14 / 9 / 11; Auron 1,900 / 21 / 9 / 10; Lulu 850 / 11 / 36 / 9; Kimahri 1,200 / 17 / 9 / 11. [arith]

| Spherimorph move | Tidus | Yuna | Rikku | Auron | Lulu |
|---|---:|---:|---:|---:|---:|
| Attack (f1 p16, STR 20) | 239 to 269 | 245 to 277 | 241 to 273 | 225 to 254 | 241 to 273 |
| Monster spell (f3 p16, MAG 20) | 284 to 320 | 244 to 276 | 284 to 320 | 287 to 324 | 235 to 265 |
| Player-side counter row (f3 p12) | 202 to 228 | 174 to 196 | 202 to 228 | 205 to 231 | 167 to 189 |
| Press from full HP | 632 | 591 | 425 | 950 | 425 |

Protect halves the Attack and Press; Shell halves the spells; a Nul-element spell makes one hit of that element zero. **The worst single hit is under a third of any member's max HP except Rikku's (38 percent for a monster spell; Lulu's worst is 32 percent, from the Attack)**; Press is half of current HP, so it never kills by itself. [arith]

**The party against it** (MDEF 0, so the defence term is 730; Armored divides physical by 3 unless it pierces; weakness x3/2): Lulu (MAG 34, no Focus) **Fire, Blizzard, Thunder, Water 859 to 970 on the weakness, 573 to 647 neutral (heals the same when absorbed); Fira and the other -ra spells 1,822 to 2,056 weak; Firaga 3,454 to 3,900 weak**; with two Focus stacks Fira 2,025 to 2,286. Tidus's plain Attack **42 to 47**, Auron's **382 to 431** (Piercing), Kimahri's 126 to 142, Wakka's 48 to 54, Rikku's 17 to 20: 12,000 HP is **6 to 7 Fira casts on the weakness**, or about 28 Auron hits. A wrong-element -ra cast heals it by about 1,215 to 1,371. Poison is 600 a tick; **Armor Break (defence 0 and no Armored division) makes Tidus's Attack 299 to 337, Wakka's 339 to 383 and Auron's 900 to 1,016**, so an Armor Break turns the plain-attack line from hopeless into about 12 Auron hits. [arith]

**Clock.** Spherimorph 36 CTB per action; Tidus 30, Rikku 27, Yuna 39, Wakka, Auron and Kimahri 42, Lulu 45 (Hasted: about half). It acts a little more often than any one member of this party. [arith]

## 7. Cross-check with the guides: agreement and the conflicts (the files win)

| Point | Files | Guides | Verdict |
|---|---|---|---|
| HP 12,000; steal Ether, Turbo Ether; drop Lv. 2 Key Sphere | yes | Jegged, GG, SG | agree |
| It absorbs every element except one; the weakness is random | yes (four states, uniform) | GG, Jegged, SG | agree |
| A plain physical hit is answered by a spell that reveals the weakness (the opposite element) | yes | GG, Jegged, SG | agree |
| Hitting it with its weakness makes it change (Elemental Shift) | yes | GG, SG, Jegged | agree |
| "Counters each attack with a spell" | **a weakness hit is not answered by a spell; it shifts** | Jegged | the file refines it |
| Press halves HP, when it is low | f5 p8 below 6,000 HP, 50.03 percent per turn | GG, SG | agree (the line and the odds are the file's) |
| Magic Defense 1, Evasion 1 | 0 and 0 | SG | file wins (SG adds 1) |
| Overkill AP 4,680 | 4,860 | SG | file wins (digit swap) |
| "Absorbs: none" | writes absorb flags for three elements and Holy | SG | file wins; GG says it absorbs all but one |
| "Immune to" the element it attacks with | it absorbs that element (and two others, and Holy) | Jegged | file wins |
| Gear: Piercing, four Strikes, four Wards (and Alchemy) | Piercing on two rows, Strikes, Wards | SG | agree (Alchemy not in the rows read here) |
| Threaten, Zombie, Breaks | Threaten 25 percent, Zombie and the four Breaks land | none | file only |
| Scan reply, Doublecast rule, aeon-on-the-field spell row | in the script | none | file only |
| Auron's Magic Break shrinks its spells; Nul spells stop one | Magic Break lands (byte 0); Nul works | Jegged, GG, SG | agree |

## 8. What is not proved

- **Not run in the engine or the emulator.** The AI ran in the Atel interpreter against a mock world; the game was not run.
- **The weapon element of a physical hit** is read in the interpreter from a table this lane supplied; the real "for actor" read adds the attacker's equipment bits and the command's own element [inferred from the damage pipeline: `User+0x5d9 | Cmd+0x2d`, note: re-ffx-damage.md 3 step 1].
- **Whether a monster's cast of a player-side row spends the monster's 100 MP** (4 per cast) was not read. The repo's Seymour, Anima and Sanctuary Keeper scripts already cast player rows, so the engine has a rule to mirror.
- **Whether the body or the orbs show the current element** (the model and motion data were not read). The game's own tell is the counter spell.
- **Whether a Scan used on an immune target still raises onHit in the engine** (the observed session shows the "Immune to sensors" text; the reply was not observed).
- **The two launch details** (the field-event gate and the battle-flag word) were not read; the formation leaves the default.
- **Ghidra was not answering** during this lane; the stored decompile corpus supplied the one engine read.

## 9. The fight, for the chapter (facts only; no number proposed)

- **What it needs that the engine may not have:** a four-state affinity machine that rewrites the boss's absorb and weak flags at run time (Omnis does this with discs: `ai/seymour-omnis-rules.ts` `withDiscAffinities`); a hit classifier that reads the command's damage type, HP class and element bits and, for physical and special hits, the attacker's weapon element; the "Doublecast ignores the first spell" gate (the engine has a Doublecast gate in `ai/hit-gates.ts`); the Scan reply; the aeon-on-the-field choice between two spell rows; `Elemental Shift` as a no-damage action.
- **What it can reuse:** every spell is a monster or player row the engine has; counters aimed at the last attacker or at the front line (`queueReaction` with `requiresAlive`); Press is formula 5 (the kernel has it); Armored; the absorb and weak steps; the Sensor-immune HELP text (`src/ui/ffx/sensorImmune.ts`).
- **What is order-sensitive:** onTargeted before the damage and onHit after it; the shift writes the new flags immediately, before the Elemental Shift action runs; one draw per shift.
- **What is open:** the build point (Woods versus Temple), the front line of three, whether the model shows the element.

## 10. Things that change PLAN.md

1. **R for row 41 is finished by this note:** the AI is 3,277 bytes of code and read in full; the residual R is about a quarter of an hour of live checks (section 8), not 5 hours.
2. The plan said "random-element weakness that changes when hit": **it changes only when the weakness is hit, to a uniform draw over all four elements (a quarter of the time the same one)**; other hits are answered, not shifted. "The counter shows the weakness" is the game's own tell (the counter spell is the opposite element), not an on-screen counter.
3. **Armored** (a plain physical hit is divided by 3) and **Press below half HP** are not in the plan; they change the party's roles (Tidus probes, Auron pierces, Lulu nukes).
4. **Arena:** the formation has three aeon entries (Valefor, Ifrit, Ixion) and one area; the Woods plate does not exist (the temple plate is the stand-in the plan names).
5. Engine gap in the plan ("one new state machine in the AI hooks"): confirmed, plus the hit classifier, the Scan reply and the aeon-on-the-field row choice; all small.

## 11. How this was checked, and what was not

Scripts and outputs kept outside the repo in the lane's own folder: `rec.mjs` (record and loot decode), `dump.mjs` (disassembly of the monster and formation scripts, and the position tables), `m121.txt` and `btl-mcfr03_00.txt`, `rows-sphere.out.txt`, `t-sphere.mjs` and `t-sphere.out.txt` (the run), `calc-sphere.mjs` and `calc-sphere.out.txt` (the arithmetic), `names-q.mjs`, `web/` (the guide texts). Not done: any run of the game, any browser, any art or GPU work, any change to the repo.
