# FFX Spectral Keeper and the Circles: record, formation and AI read from the game's own files

**Game case: FFX only.** The Spectral Keeper fight (Zanarkand Dome, story, just before Yunalesca) exists only in FFX. FFX-2's Bevelle Underground guardians are separate fights in the ATB engine; nothing here applies to them. Part of the `re-parity` track (new chapters). Drafted 2026-10-19. **Research only: no engine, data or AI code was changed, and nothing in this note was executed** (no interpreter run, no emulator); every statement is a reading, labelled below.

**Tags.**

- **[R]** read from the game's own files by a script of this lane (FFX_Data.vbf of the Steam build 25501027; the extracted copies are kept outside the repo). **[R: m129 @0x03f4]** names the code offset inside that file's program where the rule sits; scripts are paraphrased, no line is reproduced.
- **[R: engine VA]** read in the decompile corpus of the earlier lanes (FFX.exe, SHA-256 0537B2A1...686D); Ghidra itself was not opened for this note.
- **[note: X]** taken from a checked note in this repo (`research/re-ffx-*.md`) or a private coverage note (FFX-G10, FFX-H02) that those cite.
- **[I]** inferred, or arithmetic on [R] constants. **[E]** emulated: none in this note. Fields no note maps are given raw and never guessed (AGENTS.md hard rule 6).

Files used (size in bytes, SHA-256 prefix): monster files `m129` Spectral Keeper (90,316, c4f07c57) and `m146` Circle (6,892, 9343ee97); formation `dome02_00` (17,448, ddf8d893; the `new_uspc` copy of the same name is a 150-byte text file and holds no script); launching event `dome0200` (11,200, cd2e6510); kernel tables `monster1.bin` (26,496, 76dc8a40), `monmagic2.bin` (26,191, 455be7f0), `command.bin` rows, `btl.bin` (4,096, c4e27912), `ctb_base.bin` (530, 72eaa7b3). The `jppc` copies in the VBF equal the extracted copies byte for byte (checked for `dome02_00` and `m129`). Move and item names are the English names of the game's own tables.

## 0. The one-screen summary (for the driver)

- **One fight, one formation: `dome02_00`, battle id 33,882,112 (0x02050000), launched once by the field event `dome0200`.** Actors: the Keeper (actor 20) and seven Circle actors 21 to 27. Circles 21 to 26 are the six platforms of a hexagon round the Keeper (platform numbers 1 to 6); Circle 27 is a seventh platform 204 units to the side that only matters when an aeon is out. The party is the player's own front line (the event sets no party), Switch and Summon stay available. Escape, Flee, **Guard and Sentinel are disabled for everyone**; the one command added is **Move** (0x3103, a Trigger-style party command, on all seven characters); the front line gets First Strike. [R] (section 2)
- **Keeper (m129): 52,000 HP, 500 MP, STR 36, DEF 100, MAG 0, MDEF 100, AGI 36 (one rank-3 action every 21 ticks), no elements; immune to Death, Zombie, Petrify, Poison, the three Breaks, Confuse, Berserk, Sleep, Darkness and Slow.** Gil 7,000, AP 12,000 (18,000 on overkill), always a Lv. 4 Key Sphere (2 on overkill), steals Ether / Turbo Ether, always drops a piece of gear. This agrees with the 52,000 in `research/ffx-yunalesca.md` (which called it single-source). [R] (section 1)
- **No HP phases.** The script computes two thirds and one third of the maximum HP and never reads them. Everything it does is three rules. [R: m129 @0x039d, @0x03f4, @0x08e7] (section 4)
  1. **Its turn: Berserk Tail on one random living front-line character** (its Provoker if Provoked); that character's platform becomes "the platform in front".
  2. **Every hit event from a normal party turn that uses an HP-class command, a miss included, draws a counter: Attack All on whoever stands on the platform in front and its two neighbours** (three of the six). Hits that reach it as party counter-attacks lose the queued counter but still count.
  3. **Hit counter:** each damaging hit adds 1. On a Keeper turn with the counter at 4 or more and **no mine active**, it spends the turn on Glyph Mine instead of the tail: two random unarmed Circles are armed, the counter resets to 0.
- **A mine is a Circle that has been given turns; its own CTB turn is the detonation.** When it comes up it uses a Death move (chance 255, so Deathproof does not stop it; fraction-of-maximum-HP formula at full power) on whoever is standing on that platform right then, or fizzles if the platform is empty. So the timer is **CTB time, not turns and not hits**; the arming is hit-counted. The Circle shows on the CTB bar with its own platform icon. [R: m146 @0x01aa; m129 @0x0777] (section 5)
- **Platforms are one per-actor byte, the Position property (property 29, byte at actor offset 0x4fe).** Platforms 1 to 6 are the ring, 7 is the aeon rock. **Move** can target only Circles, and Circles can be targeted only by Move; Move on a free platform makes the engine Warp the mover, and about 20 script frames later the formation writes the new Position and facing. The vacated platform becomes selectable again. An Eject (a character removed from the battle) frees a platform too; a plain KO does not. [R: m146 @0x02c5; dome02_00 @0x0107] (section 3)
- **Aeons change it:** with an aeon out, the Keeper stops using the tail and the sweep (it uses a plain single Attack on a random aeon instead), every one of its own turns adds 1 to the counter, each damaging hit adds 2, and the mine is the seventh Circle, which kills a random living aeon. [R: m129 @0x03f4, @0x092a] (section 4.4)
- **Not settled by reading:** where the three characters start (the engine writes slots 0, 1, 2 into Position, but every script rule and the Keeper's own set-up read like platforms 1, 2, 3); and how long a mine really burns (it depends on a stored counter whose phase and base I could not fix without running). Both are cheap live checks (section 8).
- **A correction for the candidate list.** `src/battle/ffx/triggers.ts` is the mid-battle *story* trigger system (cutscene hooks), not player Trigger Commands. The Trigger-Command-like pieces are in `src/battle/ffx/ai/evrae-rules.ts`. Platforms (a per-actor position) and mines (a hidden actor given turns by a script) are **not in the engine**; section 7 lists what is there and what is missing.

## 1. The monster records (a)

Offsets are record offsets (chunk 2; byte-identical from 0x14 to 0x7F to the kernel row and to the chunk-6 copy, checked for both files). Layout [note: FFX-H02 3.1; re-ffx-biran-yenke.md 2].

### 1.1 Identity

| Piece | Identifier | Tag |
|---|---|---|
| Spectral Keeper | m129, monster word 0x1081 (also +0x74), CTB icon 21, Doom counter byte 30 | [R] |
| Circle | m146, monster word 0x1092, CTB icon byte 22 (the script overwrites the icon with its platform number minus 1 at set-up), Doom counter byte 99 | [R] |
| Actor numbers in `dome02_00` | slot 0 = the Keeper = actor 20; slots 1 to 7 = Circles = actors 21 to 27 [note: FFX-G10 3.3] | [R] |
| Alone-battle copies | `zzzz00_129` and `zzzz00_146` are the one-monster test formations (debug); not reachable in the game | [R] |

### 1.2 Stats

| Field | Spectral Keeper m129 | Circle m146 | Tag |
|---|---:|---:|---|
| HP / MP / overkill threshold | 52,000 / 500 / 8,000 | 10,000 / 1 / 10,000 | [R] |
| STR / DEF / MAG / MDEF | 36 / 100 / 0 / 100 | 1 / 0 / 0 / 0 | [R] |
| AGI / LCK / EVA / ACC | 36 / 15 / 0 / 8 | 0 / 0 / 0 / 0 (the script writes AGI 8 and EVA 255) | [R] |
| Tick speed, rank-3 recovery | 7, 21 (AGI 36) | 15, 45 once the script's AGI 8 applies (the record's AGI 0 reads as 1: 28, 84) | [I] from `ctb_base.bin` via [note: re-ffx-ctb-status.md 1, 2] |
| Flag byte +0x28 | 0x06: immune to percentage damage and to Life | 0xFE: immune to percentage damage, Life, Sensor, the second Scan, physical, magical and HP damage | [R] |
| Flag byte +0x29 | 0x07: immune to CTB damage, Slice, Bribe | 0x06: immune to Slice, Bribe | [R] |
| Poison damage byte (+0x2A) | 5 | 0 | [R] |
| Element absorb / immune / resist / weak (+0x2B to +0x2E) | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | [R] |
| Automatic statuses (+0x48, +0x4A, +0x4C) | none | none | [R] |
| Extra-immunity word (+0x4E) | 0x4300: Eject, Auto-Life, Doom | 0x4301: Scan, Eject, Auto-Life, Doom | [R] |
| Command list (+0x50) | 0x6045 Berserk Tail, 0x6046 (table name "Counter,Attack"), 0x6047 Attack All, 0x604D Glyph Mine, 0x6048 Attack, 0x604E Attack, 0x6049 Attack | 0x606C Warp | [R] |
| Script adds at set-up | Absorb 0x606D and Death 0x60B4 (Death only as the death animation) | none | [R: m129 @0x03b6] |
| Forced action (+0x70) / monster index (+0x72) / arena (+0x78) | none / 129 / 255 | none / 146 / 255 | [R] |

**Status bytes** (255 immune; otherwise the move's chance minus the byte; Threaten's byte is a success percentage [note: re-ffx-biran-yenke.md 2]). Keeper: 255 for Death, Zombie, Petrify, Poison, Power Break, Magic Break, Armor Break, Confuse, Berserk, Sleep, Darkness, Slow; **0 (lands) for Mental Break, Provoke, Threaten, Silence, Shell, Protect, Reflect, the four Nul statuses, Regen and Haste**. Circle: 255 for Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke; 0 for the rest (it cannot be hit anyway: it is only targetable by Move, section 3). [R]

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5])

| Field | Spectral Keeper | Circle | Tag |
|---|---|---|---|
| Gil / AP / AP on overkill | 7,000 / 12,000 / 18,000 | 0 / 0 / 0 | [R] |
| Item chance bytes (slot 1 / slot 2), steal chance, gear chance | 255 / 0, 255, 255 | all 0 | [R] |
| Normal drop slot 1 (common x qty / rare x qty) | Lv. 4 Key Sphere 0x2054 x1 / the same x1 | none | [R] |
| Overkill drop slot 1 | Lv. 4 Key Sphere x2 / x2 | none | [R] |
| Steal (common x qty / rare x qty) | Ether 0x2004 x1 / Turbo Ether 0x2005 x1 | none | [R] |
| Bribe | immune (flag +0x29 bit 2); the table names Potion x1 | none | [R] |
| Gear drop | base slot count 12, formula 1, critical bonus 3, power 16, extra-ability tries 20 | none | [R] |
| Gear ability pool, raw, weapon rows (even rows 0 to 12 of 14) | first element 0x0000, except rows 4 and 6 (owners 2 and 3, Auron and Kimahri) 0x800B; pool 0x802A x1, 0x801E x2, 0x8022 x2, 0x8026 x2 | none | [R] |
| Gear ability pool, raw, armour rows (odd rows) | first element 0x0000; pool 0x802C x1, 0x8020 x2, 0x8024 x2, 0x8028 x2 | none | [R] |
| +0x110, +0x111 (unmapped) / Zanmato byte +0x112 / Pilfer-Nab Gil factor +0x113 / Monster Arena price +0x114 | 40, 128 / 3 / 37 / 10,500 | 0, 0 / 3 / 0 / 0 | [R] |

Rewards are rolled once per dead monster [note: FFX-H02 3.5]; the Keeper's death animation is "Boss" (the body stays and cannot be targeted). The raw ability ids are not named here (no note maps this range); the Keeper's pool is a ladder of seven ability pairs, one per slot of a late-game piece. [R] / [I]

### 1.4 Command rows the scripts use

Columns follow `research/re-ffx-dark-aeons.md` section 6 (target byte +0x1A given raw, formula +0x28, accuracy byte +0x29, power +0x2A, rank +0x24). Rank 0 counts as 3 [note: re-ffx-ctb-status.md 2].

| Id | Name in the table | What the script uses it for | Target byte | Formula / power / hits | Accuracy, status, notes | Tag |
|---|---|---|---|---|---|---|
| 0x6045 | Berserk Tail | the Keeper's turn | 0x33 | 1 / 16 / 1 | accuracy byte 100; **Berserk 50** | [R] |
| 0x6047 | Attack All | the counter sweep on the platform group | 0x3B (the group is supplied by the script) | 1 / 32 / 1 | accuracy formula 2, byte 126; shatter 120 | [R] |
| 0x604D | Glyph Mine | arms a Circle | 0x33 | 0 / 0 / 0 hits | extra-status word 0x4000 (Doom) but no hit record, so nothing lands; its effect is the Circle's `onTargeted` (section 5) | [R] |
| 0x6048 | Attack | **the mine's blast** on a living character | 0x73 | **8 / 16 / 1**, cap 99,999 | **Death 255** (always lands, ignores the target's resistance byte [note: re-ffx-ctb-status.md 6]); formula 8 is "fraction of the maximum", 16/16 [note: re-ffx-damage.md] | [R] |
| 0x6049 | Attack | the fizzle: a mine on an empty platform strikes itself | 0x33 | 0 / 0 / 0 | nothing | [R] |
| 0x604E | Attack | against aeons: the counter and the plain turn | 0x33 | 1 / 24 / 1 | accuracy formula 2, byte 100, critical 10 | [R] |
| 0x6046 | "Counter,Attack" | in the list, never queued by any rule | 0x33 | 0 / 0 / 1 | Death 255, cleansing flag | [R] |
| 0x606D | Absorb | added at set-up, **queued only in unreachable code** (section 4.7) | 0x33 | 8 / 8 / 1 | absorb flag | [R] |
| 0x606C | Warp | the Circle's reaction that moves a character | 0x33 | 0 / 0 / 0 | rank 3 | [R] |
| 0x6001 | Special 1 | the lit glyph (a visual) | 0x00 | 0 / 0 / 0 | | [R] |
| 0x3103 | Move | the party command (table `command`, row 259) | 0x03 | 0 / 0 / 0 hits | **rank byte 0, so the engine charges rank 3** [note: re-ffx-ctb-status.md 2] | [R] / [note] |
| 0x306B | Self,Destruct | the Keeper's `onHit` frees Kimahri's platform when it is used | 0x13 | 16 / 30 / 1 | | [R] |

All of the rank bytes of the monster rows are 3, so the Keeper pays 21 ticks after Berserk Tail, Glyph Mine, or any other turn [I]. Reaction commands (the sweep, the aeon counter, the Warp) add no CTB [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.1].

## 2. The formation (b)

### 2.1 Identity and launch

| Piece | Value | Tag |
|---|---|---|
| Formation | `dome02_00`; battle id (area key 517 << 16) = 33,882,112 = 0x02050000; area `dome02`, one zone, stage id 517, weight 0 (never a random encounter) | [R] |
| Monster words by slot | 0x1081 Keeper (actor 20), 0x1092 Circle x7 (actors 21 to 27) | [R] |
| Block bytes | voice 0, byte 1 = 0, foot-sound id 7, in-water 0 | [R] |
| Launching event | `dome0200`, one `SetBattleFlags(0x0501)` then `launchBattle` with the **Fade** transition (not Screen Shatter) | [R: dome0200 @0x0c8a, @0x0c93] |
| Flag word 0x0501 | low byte 1 (a scripted battle with low byte 1: the hand-off requests **no results panel**); bit 9 clear (a defeat is a game over); bit 8 set (no victory pose); bit 10 set (not decoded) [note: FFX-G10 3.6, 4.3]. The event itself asks for no menu or results module after the fight | [R] / [note] |
| After the fight | the event sets a local value 2780, fades out, and warps to room 320 (the Yunalesca approach is launched later by `dome0600`: battle 34,144,256, flag word 0x10504) | [R] |
| Party | the event loads the models of all seven characters and sets no party; the front line is whoever the player took in. No setCommandDisabled touches Summon, Switch or the bench | [R] |

### 2.2 What the formation's start-up script does (w0.f0 @0x0009 to 0x00fc)

1. **Disables four commands for all characters and aeons:** Escape (0x3003), Flee (0x3018), **Guard (0x3022) and Sentinel (0x3023)**. [R: dome02_00 @0x0009 to 0x002d]
2. Front line **BattleDistance := 1**. Each character's pre-turn and post-hit handlers write 1 again, and when one of nine support commands (Pray, Cheer, Aim, Focus, Reflex, Luck, Entrust, White Wind, Mighty Guard) targets a character the whole front line is set to 0 until the next handler. It reads as the "run in to the target or stay back" choice of the attack animation; whether it is also a reach input was not traced (the targeting note uses BattleDistance for reach [note: re-ffx-ai-seymour.md 5.1]). [R: @0x0039, w1.f2 and f3]
3. **Adds the command Move (0x3103) to characters 0 to 6** (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku: owner order [note: FFX-H02 3.4]), bench included. [R: @0x0042 to 0x006f]
4. **Facing:** Character 1 -90 degrees, Character 2 -120, Character 3 150, the Keeper 30. [R: @0x0081 to 0x009c]
5. Map centre set to 204,0,0 (the aeon rock); "ForceCloseRangeAttackAnim" on characters 0, 1, 2, 3, 5, 6 (not Wakka). [R]
6. **Front line First Strike := 1.** First Strike zeroes a counter after the opening draw, so all three characters act before the Keeper's first turn [note: re-ffx-ctb-status.md 3]. [R: @0x00fc]

No random positions, no ambush write (the engine's start-type roll stands [note: FFX-G10 3.2]), no Trigger Command other than Move. The rest of the script is camera work: one worker per party member for the pre-turn and post-hit handlers below, and camera, map and cursor-style scenes that depend on the aeon on the field.

### 2.3 Party-side handlers in the formation script (workers 1 to 7, one per character 0 to 6)

- **preTurn** (f2): front line BattleDistance := 1; stores the character's Position + 1 in a camera variable.
- **onTargeted** (f3): one of the nine support commands of item 2 above sets the front line's BattleDistance to 0.
- **onHit** (f4): front line BattleDistance := 1. **If the character is Ejected (removed from the battle): the Circle at its Position becomes targetable again** (so the platform can be taken). Otherwise, if the command used was Berserk Tail, the Keeper's "target was not Berserk before" flag is clear and the character is now Berserk, a camera scene plays. [R: dome02_00 @0x0185 to 0x02ab and the same per worker]

### 2.4 Start positions (chunk 3; area 0, the only area) [R]

The party table has **seven** entries, not three, and the monster table eight. For the monsters the entry number is the Position the engine writes (the Keeper 0, Circles 1 to 7 [R: engine VA 0x79c110]); that the party table is indexed by Position the same way, with entry 0 the Keeper's spot, is [I] from the geometry.

| Entry | Party table | Monster table (Circles) | Facing a character gets when it Moves there |
|---|---|---|---|
| 0 | (0, 0, 0) | Keeper (0, 0, 0) | none |
| 1 | (0, 0, 72) | Circle 21 (0, 0, 70) | -90 |
| 2 | (64, 0, 36) | Circle 22 (60.6, 0, 35) | -120 |
| 3 | (64, 0, -36) | Circle 23 (60.6, 0, -35) | +120 |
| 4 | (0, 0, -72) | Circle 24 (0, 0, -70) | +90 |
| 5 | (-64, 0, -36) | Circle 25 (-60.6, 0, -35) | +30 |
| 6 | (-64, 0, 36) | Circle 26 (-60.6, 0, 35) | -30 |
| 7 (aeons) | all seven aeon entries (204, 0, 0) | Circle 27 (204, 0, 0) | none |

The facing numbers are the Circle's own table (m146 @0x03b0 to 0x0417), applied to the mover. A hexagon with a 70-unit radius, the Keeper in the middle, the aeon rock off to one side.

## 3. Platforms and position: how the game represents "where is everybody"

1. **The platform of an actor is its Position property**, property 29, a signed byte at actor offset 0x4fe (getter 0x7b2dc0, setter 0x7b4b70; the same byte is used as the index of the actor's start position, 0x7abfe0). Values: 1 to 6 are the ring; 7 is the aeon rock (Circle 27); 0 is the Keeper's own slot. Scripts read it with `readBtlChrProperty(actor, 29)` and write it with `writeBtlChrProperty`; the only writer in this fight is the formation scene in item 3. [R: engine VA; m129, m146, dome02_00]
2. **Start values.** The actor set-up routine (0x79c110) writes Position := the actor's slot index for the front line (0, 1, 2), := the formation slot index for monsters (the Keeper 0, Circles 1 to 7), and := actor number minus 8 for aeons. The Keeper's own set-up makes Circles 21, 22 and 23 (Positions 1, 2, 3) untargetable and the other three targetable, as if the three characters stood on platforms 1, 2 and 3; the Keeper's "platform in front" starts at 2; the start facings above (-90, -120) match platforms 1 and 2. **Whether the characters really begin on 1, 2, 3, or on 0, 1, 2 with a step I did not find, is not settled** (the party table's entry 0 is the Keeper's centre). [R] for each piece; the conclusion is open (section 8, question 1).
3. **Move.** A character uses Move (0x3103) on a Circle. The Circle's `onTargeted` (m146 f3 @0x02c5) runs before anything else: it frees the Circle of the mover's current platform (makes it targetable), makes itself untargetable, sets the mover's facing for the new platform, queues the **Warp** (0x606C) as a reaction on the mover, stores the mover, the angle and the new platform number in three shared battle variables (0x8, 0xc, 0x10), and starts formation scene 0. That scene (dome02_00 w0.f2 @0x0107) waits 20 script frames, **writes the mover's Position and facing**, waits 10 more and releases the battle. So the Position changes at the end of the Warp, not when Move is chosen. [R]
4. **Which Circles Move can reach.** Each Circle has "only targetable by" := Move (property 345 written 12547), so no other command can aim at a Circle; and the Circle of an occupied platform is untargetable. A Circle that has been armed with a mine is not made untargetable, so **a character can Move onto a ticking mine** (it then dies when the mine blows). That Move cannot select the Keeper is **not proved**: nothing in the scripts stops the Keeper from being a legal target of Move; it would just do nothing. [R] / [I]
5. **Cost.** Move has no hit record (no `onHit`); its rank byte is 0, which the CTB code treats as 3 [note: re-ffx-ctb-status.md 2], so it costs the character's turn at rank 3 and is not free [I]. The Warp is a reaction and adds no CTB.
6. **Leaving and arriving.** A character who is **Ejected** frees its platform (formation onHit, section 2.3); a KO does not (the Circle stays untargetable under the body). When a bench member is switched in for a downed one, the swap routine (0x7adae0) copies the leaving member's four position bytes (area, kind, Position, distance) to the member coming in, so the platform is **probably** inherited; the copy reads the leaving member's saved bytes (offsets 0x500 to 0x502), what saves them was not traced, and nothing was run [R: engine VA, code shape] / [I]. Kimahri's Self-Destruct (0x306B) used on the Keeper frees the Circle of character 3's platform in the Keeper's `onHit`. [R: m129 @0x095a]
7. **"In front" and the Keeper's facing.** The Keeper has no turning logic of its own. Its "platform in front" is a private variable, **v19, initial 2, overwritten with the Position of the target of every Berserk Tail**. The sweep is aimed at the platforms v19, v19+1 and v19-1 (mod 6); the other three are safe. Front trios: v19 = 1: platforms 1, 2, 6; 2: 2, 3, 1; 3: 3, 4, 2; 4: 4, 5, 3; 5: 5, 6, 4; 6: 6, 1, 5. [R: m129 @0x09ec to 0x0a9b]
8. **Platform count.** Six ring platforms (Positions 1 to 6, Circles 21 to 26) and the aeon rock (Position 7, Circle 27). [R]
9. **Aeons.** While an aeon is out, the front line is the aeon alone [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.2]; the camera map centre moves to the aeon rock (153 for Hellfire, 204 otherwise). Aeon actors take Positions from their actor number (item 2) but only the aeon rock Circle (Position 7) is ever armed against them (section 4.4). [R]

## 4. The Keeper's AI (m129, worker w1: tags onTurn f2 @0x03eb, onTargeted f5 @0x0e4b, onHit f3 @0x08da, onDeath f4 @0x0e41)

### 4.1 Set-up (init f0 @0x01bb to 0x03e6)

Hit reactions not dulled; birth animation none; death animation "Boss"; Tough and Heavy on (no delay recoil, no lift-off); keeps control when Provoked; gravity on; presentation motion values. **Front platform variable := 2.** Circles 21 to 26 targetable, then 21, 22, 23 untargetable. All shared variables zeroed. Two-thirds and one-third of maximum HP stored and **never read**. Adds Absorb and Death; swaps the camera animations of Hellfire (0x30D1), Thor's Hammer (0x30D4) and Delta Attack (0x30EA) when they hit it. [R]

### 4.2 Variables

| Variable | Where | Meaning | Tag |
|---|---|---|---|
| v0 (battle var 0x04, shared with the Circles) | Keeper writes 0/1/2 when it lays mines; **each Circle subtracts 1 when it detonates** | mines active | [R] |
| v1, v2, v3 (0x08, 0x0c, 0x10) | written by a Circle when a character moves | mover, facing angle, new platform; read by the formation scene | [R] |
| v4 (0x14) | Keeper, on its turn | "the target was already Berserk" (camera flag) | [R] |
| v5, v6, v7 (0x18, 0x1c, 0x20) | the sweep | camera data (how many of the three platforms hold characters, where to look) | [R] |
| v19 (private) | tail target's Position | **platform in front**, start 2 | [R] |
| v23 (private) | onHit, onTurn | **hit counter** | [R] |
| v8 to v13, v16 to v18, v20 to v22 | scratch | targets, platform trio, who stands where | [R] |
| v14, v15 | init | 2/3 and 1/3 of max HP, unused | [R] |

### 4.3 The turn (onTurn f2 @0x03eb), no aeon out

1. **Counter test.** With the counter v23 below 4: skip to rule 3. With **v23 at 4 or more**: if the mine count v0 is 0, run rule 2; otherwise skip to rule 3 (the counter is **not** reset and stays above 4 until the mines are gone). [R: @0x0408, @0x077e]
2. **Lay mines** (v0 is 0): v23 := 0. Group = every monster except the Keeper (20) and Circle 27 whose GetsTurns is 0; **pick one at random with the game's picker, give it turns and CTB visibility; remove it from the pool; pick a second the same way; queue Glyph Mine on the two together; v0 := 2.** The pool is the six ring Circles whether or not a character stands on them (the "including untargetable" variant is used). The turn is over. [R: @0x07cc to 0x0865; the picker is the one of [note: re-ffx-ai-seymour.md 1.3]; that this variant draws once like findMatchingChr was not read separately: [I]]
3. **The tail.** Target = the Provoker if Provoked, else a random living front-line character (one stream-4 draw when two or more live [note: re-ffx-ai-yunalesca-bfa.md 1.3]). Store whether it is already Berserk; v19 := its Position; **queue Berserk Tail on it.** [R: @0x0876 to 0x08d6]

Berserk Tail: physical, formula 1, power 16, accuracy byte 100, **Berserk 50** (chance minus the target's Berserk byte, subject to the usual Berserk immunity rules). [R] No other normal turn exists: with a sweep as the only counter, the Keeper has no second attack of its own.

### 4.4 With an aeon out ([R: @0x03f4, @0x0777 to 0x07c3, @0x092a])

- **Every Keeper turn adds 1 to the counter** (the game counts turns instead of waiting for the party to hit, because aeon hits are rarer than turns).
- On a turn with the counter at 4 or more and no mine active: **Circle 27 gets turns and CTB visibility, is aimed with Glyph Mine, v0 := 1, counter reset.** Otherwise it queues a plain **Attack (0x604E, power 24)** at its Provoker or a random living front-line character (the aeon) instead of the tail. The tail and the platform-in-front variable are not touched, so the sweep is not used.
- **onHit with an aeon out:** the damaging-hit gain applies as in 4.5 (+1), **and again +1** (so +2 per damaging hit), and the Keeper queues a plain Attack at a random living front-line character; no sweep.
- The mine on Circle 27 kills a random living front-line character (section 5).

### 4.5 When it is hit (onHit f3 @0x08da to 0x0e40) — in this order

1. Dead: nothing. The command used is Absorb: nothing. **A command whose damage class does not include HP (`affectHP` 0: Scan, buffs, support commands and the like) stops here: no count, no counter.** [R: @0x08e7 to 0x0906]
2. **Last HP damage taken above 0: counter += 1.** A miss, a heal and a zero-damage HP command add nothing. [R: @0x0914]
3. Aeon out: counter += 1 more, queue a plain Attack at a random living aeon, stop (4.4).
4. The command used was **Self-Destruct** (0x306B): make the Circle of character 3's Position targetable, stop (no sweep).
5. Otherwise: **the sweep.** Set the map centre; for the platform in front and its two neighbours, build one group: every living character of the three active slots standing there, or the Circle itself when none does; queue **Attack All (0x6047) on that group.** [R: @0x09e6 to 0x0e3d]

Because onHit is raised **once per action per target after the last hit record** [note: re-ffx-ai-seymour.md 1.1], a 6-hit Overdrive or a Slice and Dice counts as one, not six; a missed HP-class attack still draws a sweep. The queued counter is dropped when the attacker's own record is a party counter-attack or when the Keeper cannot act, but the counter variable still counts [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.1]. [R] / [note]

### 4.6 onTargeted and onDeath

onTargeted (f5 @0x0e4b): only the camera map centre (153 when the command is Hellfire, 204 otherwise). onDeath (f4 @0x0e41): the Death command (0x60B4) replaces the death animation. Nothing resets, nothing is dropped, no Circle is released. [R]

### 4.7 Dead code, for the record

The block at m129 @0x0414 to 0x0776 (a seven-way choice by platform that would queue **Absorb** at the occupant of the platform in front, or at a Circle) is **unreachable**: the only jump to it comes from an instruction that follows an unconditional jump, and no other jump table entry points into it. Its platform-4 test reads the first reserve slot where the others read characters 2 and 3, which shows it was never run. Absorb is listed in the record and added at set-up but nothing live queues it. [R: jump-target scan of worker w1]

## 5. The Circles' AI: the mines and the Move (m146, worker w1: tags onTurn f2 @0x019d, onTargeted f3 @0x02c2)

### 5.1 Set-up (init f0 @0x0038 to 0x0198)

Not required for victory, hidden on the CTB bar, **GetsTurns := 0**, death animation "Boss", **only targetable by Move**, no body hit, Tough and Heavy, a block of presentation values. Stores its own Position in a private variable; **AGI := 8, CTB icon := Position - 1 (icons 0 to 5, and 6 for the aeon rock), EVA := 255, Armored := 1** (Circle 27 gets Armored := 0). [R]

### 5.2 onTargeted (f3): two jobs

- **Glyph Mine hits the Circle:** effect level := 1 (the glyph lights) and the Circle queues Special 1 on itself. The Circle is not made untargetable. [R: @0x02c5 to 0x02e4]
- **Move targets the Circle:** the whole Move sequence of section 3, item 3. Any other command stops after the first test. [R: @0x02ee to 0x0453]

### 5.3 The turn: the detonation (onTurn f2 @0x019d), run only while the Circle is visible on the CTB bar

1. Start from "strike itself with the fizzle (0x6049)".
2. **Circle 27 (Position 7), aeon out:** the victim is a random living front-line character, and the blast is 0x6048.
3. **Circle 1 to 6, no aeon out:** look at characters 1, 2 and 3 in that order; **the last living one whose Position equals this Circle's is the victim**, and the blast is 0x6048. (Two characters on one platform cannot happen by Move; if it did, only one dies.) With an aeon out, a ground mine fizzles.
4. Queue the move. **Mine count v0 := v0 - 1**, effect level := 0, CTB visibility := 0, **GetsTurns := 0**, Armored := 1. The Circle is available to be armed again. [R]

The blast, 0x6048, is "fraction of maximum HP" at 16/16 with Death 255. Death 255 lands whatever the target's resistance byte [note: re-ffx-ctb-status.md 6]; Auto-Life (the revive) and Zombie are the status code's usual cases and were not checked here. [R] / [I]

### 5.4 The timer: what it counts

- **Arming is counted in hits** (section 4.3 rule 2), and checked on the Keeper's own turn: the 4th damaging hit does not lay anything; the next Keeper turn does. [R]
- **Detonation is counted in CTB time.** A Circle with GetsTurns := 1 is an ordinary scheduler slot with its own counter. While it was unarmed, the scheduler kept resetting that counter to its stored base each time it reached 0 ("if the slot does not get turns, the counter is set back to its base" [note: re-ffx-ctb-status.md 4]). Arming does not touch the counter, so **the mine goes off at the next time that cycling counter reaches 0: between 1 tick and one full base away** [I]. The base is `3 x tick speed` fixed when the battle started [note: re-ffx-ctb-status.md 2]: 84 if it came from the record's AGI 0, 45 if the script's AGI 8 counts. The script's write of AGI does not refresh the base (the setter only writes the byte [R: engine VA 0x7b4b70]), and a monster script's writes land after the opening counters [note: re-ffx-dark-aeons.md 2.2], so **84 is the likelier base** [I]. A 24-tick party action (AGI 30) then fits about 0 to 3.5 times into a mine's remaining life. [I] arithmetic; the real fuse is a live check (section 8, question 2).
- **Not counted in turns of the party and not reset by moving.** Moving away is the defence: a blast on an empty platform fizzles.

## 6. Timing figures (arithmetic on [R] values, for planning only)

| Quantity | Value | Basis |
|---|---|---|
| Keeper recovery after any of its turns | 21 ticks (tick speed 7, rank 3) | AGI 36; [note: re-ffx-ctb-status.md 2] |
| Keeper opening counter, normal start | 21 to 23 | `21 x 100 / (100 - draw mod 11)` [note: re-ffx-ctb-status.md 3] |
| Party | acts first (First Strike) | [R] item 2.2.6 |
| A character at AGI 30, rank 3 | 24 ticks per action | tick speed 8 |
| Damaging hits to arm a mine | 4 damaging hit events; with an aeon out +2 per damaging hit and +1 per Keeper turn, so 2 hits, or 1 hit and 2 Keeper turns | [R] section 4 |
| Mine count per lay | 2 (ring), 1 (aeon rock) | [R] |
| Number of mines at once | at most 2; a new lay needs the count back at 0 | [R] |

## 7. What our engine would need (no build here)

"Has" cites `file:line` on the commit this note is based on (origin/main 1fd983b5a); "missing" means nothing equivalent exists.

| # | Mechanic the game has | In the engine today | Cite |
|---|---|---|---|
| 1 | **A platform (Position) on every actor**, 1 to 6 plus 7, readable by scripts, inherited on a switch | **Missing.** An actor has only a field `slot` for the sprite | `src/battle/common/types.ts:624`, `:2946` |
| 2 | **Move**: a seven-character party command, rank 3, aimed at a Circle, applying a Warp reaction and a Position write after a delay | **Partly.** Trigger-style party commands that cost the character's turn at rank 3 exist (Evrae's orders); aiming at a map object does not | `src/battle/ffx/ai/evrae-rules.ts:34`, `:154` (`ORDER_RANK`); `src/data/ffx/abilities/special-orders-evrae.ts` |
| 3 | **Circles**: eight non-combatant monster actors, never part of the victory, "only targetable by Move" | **Partly.** Non-turn-taking, hidden actors exist (`ordersOnly`); an "only targetable by one command" rule does not | `src/battle/ffx/ai/dark-aeons-setup.ts:42`; `src/battle/ffx/ai/sinspawn-gui-rules.ts:135`; `src/battle/ffx/ai/isaaru-rules.ts:157` |
| 4 | **Script hooks**: onTargeted (the Circle's Move and Mine jobs), onHit with `lastDamage` and the HP-class bit, preTurn, the reaction queue and its "owner can act" test | **Has.** The runner, the report fields and the queue are the game's | `src/battle/ffx/ai/hooks.ts:58`, `:127`, `:192`, `:239`; `ai/hit-script.ts` |
| 5 | **A hit counter on the Keeper** (+1 per damaging hit; +2 and +1 per turn with an aeon out) | **Has the pattern.** A per-hit gauge gain owned by a script exists | `src/battle/ffx/ai/dark-aeons-rules.ts:29`, `:31` |
| 6 | **The sweep**: one command aimed at the characters on three platforms chosen by a variable | **Missing the aim.** A reaction can name its targets (the hook queue takes a target list); the group-by-platform rule is new | `src/battle/ffx/targeting.ts:182` (`Aim`); `ai/hooks.ts:192` |
| 7 | **Mines**: a Circle given turns by a script, shown on the CTB bar with a per-platform icon, exploding on its own turn, then disarmed | **Partly.** A script can already flip a hidden actor's `ordersOnly` on and off mid-battle; the kernel scheduler has the "no turns: counter resets to base" rule, but the adapter passes `getsTurns: true` for everyone, so an unarmed actor's counter never cycles; CTB-bar icons for it are UI work | `src/battle/ffx/ai/macalania-acts.ts:50`, `:102`; `src/battle/ffx/kernel/ctb-scheduler.ts:149`; `src/battle/ffx/adapt/ctb.ts:71`, `:92` |
| 8 | **The blast**: Death chance 255 plus fraction-of-max formula on a named occupant | **Has the rules** (status chance 255, formula 8) as data work; no mine row exists | `src/battle/ffx/kernel/status-inflict.ts:257` (the chance-255 rule); `src/battle/ffx/kernel/damage.ts:217` (formula 8) |
| 9 | **Berserk Tail**: Berserk 50 with the usual immunity rules, provoker or random living target | **Has.** | `src/battle/common/types.ts:171`; `src/battle/ffx/ai/game-rolls.ts:72` (`randomLiving`) |
| 10 | **Escape and Flee disabled** | **Has** (`canEscape`). | `src/battle/ffx/commands.ts:135`; `src/battle/ffx/setup.ts:294` |
| 11 | **Guard and Sentinel disabled for the whole battle** | **Missing.** Only `canEscape` and `noSwitch` exist as per-battle command switches | `src/battle/ffx/runtime.ts:165`, `:166` |
| 12 | **First Strike for the whole front line** | **Partly.** Only for characters with the auto-ability; a battle-level switch does not exist | [note: re-ffx-ctb-status.md C5] |
| 13 | **Aeon mode**: the seventh platform, plain Attack counters, a turn-counted hit counter, a one-mine lay on the rock | **Missing** (the aeon summon exists, a platform for it does not) | `src/battle/ffx/aeons.ts` |
| 14 | **Presentation**: six glyph platforms and a rock, a lit mine glyph and blast, a Warp, the Keeper turning to the tail's target, four camera sets, CTB icons 1 to 6 | **Missing** (presenter and scene work); the Dome painting exists | `src/data/encounters.ts:174` (`zanarkand-dome`) |

Order of dependence if built: 1 (Position) before 2 (Move), 3 (Circles) before 2 and 7, 11 (disable list) and 12 (battle-level First Strike) are small data switches, 6 (platform aim) before the Keeper's AI. The Keeper's turn/hit rules (4.3 to 4.6) and the Circle's (5.2, 5.3) are short enough to port line for line once 1 to 3 exist. [I]

## 8. Open questions, and what a live check would settle

1. **Where do the three characters start, and what does the Keeper face at the start?** The engine writes Position 0, 1, 2 to the front line; the scripts read like 1, 2, 3 (Circles 21, 22, 23 untargetable; front starts at 2; facings -90 and -120 are platforms 1 and 2). *Live check:* open the first command menu and see which platforms are untargetable under Move, or read the byte at actor + 0x4fe for the three characters (the Timing lane's read-only memory reads are enough). If it is 0, 1, 2, find the step that adds 1.
2. **How long does a mine really burn?** Section 5.4 gives a window, not a number. *Live check:* time the Glyph Mine to the blast against the CTB bar in several fights, and read the Circle's counter (+0x65c) and stored base (+0x65d) at the moment of arming; that says 45 vs 84 and the phase.
3. **Which two Circles does Glyph Mine arm: uniform over the unarmed six?** The "including untargetable" picker was not read separately. *Live check:* tally 30 or more lays.
4. **Does a KO'd character block its platform?** The script says yes (only Eject frees a Circle). *Live check:* KO a character and try to Move onto its platform.
5. **Can Move target the Keeper, and is Move's price rank 3 on the CTB bar?** Not provable from the scripts. *Live check:* the target list and the bar after a Move.
6. **Does a missed attack draw a sweep, and does a party counter-attack still count toward the 4?** The scripts say yes to both ([R]); the engine's reaction filter says the sweep is dropped for a counter-attack ([note]). *Live check:* a miss, then an Auto-Potion / counter-attack turn.
7. **Results and spoils.** Neither the hand-off nor `dome0200` requests a results panel (low byte 1); whether the next scene (room 320) shows the spoils was not read.
8. **BattleDistance for the front line** (section 2.2 item 2): reach input or animation only.
9. **The unreachable Absorb block** (section 4.7) may be a removed design (a drain on the occupant of the platform in front); it has no effect on play.

## 9. How this was checked, and what was not

- Extracted with the earlier lanes' readers: the VBF reader (`vbf-extract`), the Atel disassembler with the jump-table and variable-table printers, the monster-record, loot and command-row decoders of `re-ffx-biran-yenke.md`, the formation and position readers, and the event decoder (with a one-line fix for a second chunk offset of zero in `dome0200`). Kernel variables were matched across the three programs by their battle-variable offsets.
- **Not run:** no script was executed. Section 4 and 5 are readings; where an engine rule decides the outcome, the earlier lanes' proved rules are cited, not re-proved. The mine fuse (5.4) and the start positions (3.2) are the two places where a rule I could not prove matters.
- **Not read:** the camera scenes, the animation workers (w0 and w2 of m129, w0 of m146), the Dome field map and room 320, the HD-only changes (none were seen: the `new_uspc` copy of the formation is a text file).
- Ghidra was not opened; engine addresses come from the on-disk decompile corpus of the earlier lanes.
