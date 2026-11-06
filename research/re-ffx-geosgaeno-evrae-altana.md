# FFX Geosgaeno (Baaj Temple) and Evrae Altana with the Gate Locks (Via Purifico): records, formations, AI and move rows from the game's own files

**Game case: FFX only.** Geosgaeno, Evrae Altana and the Gate Locks exist only in FFX; FFX-2 has none of them and nothing here applies to it. Part of the `re-parity` track (new chapters), the wave-2 sequel of `research/re-ffx-spectral-keeper.md` and `research/re-ffx-dark-aeons-six.md`, whose method and engine facts this note reuses. Drafted 2026-11-06 for program row 36 (the program plan of the hidden chapters 34 to 64). **Treeless: records, formations, AI and move rows only. No engine, data, AI or art file was changed; nothing here ran in a browser.**

**One correction to the plan before anything else.** PLAN.md row 36 calls the pair "Via Purifico: Geosgaeno and Evrae Altana". **Geosgaeno is not in the Via Purifico.** Its formations belong to the Baaj Temple field event (`bjyt0200`); the optional second fight is the one in front of Anima's chamber (Jegged: the hidden location reached from the airship, after the Cloisters; "Tidus, Wakka, and Rikku are the only ones who can swim"). Evrae Altana is the Via Purifico boss (`stbv0000`, Jegged "Bevelle - Via Purifico (Underwater)"). What the two share is real: the same fixed trio, a water battle (the in-water flag), the Petrify-shatters-at-once rule, the Boss Theme, Stone Ward advice. The bundle still works, but the chapter's name and the arena plan must say "two places" (section 9). Section 10 lists what else changes in the plan.

**Source and tags** (as in the Dark Aeons note).

- **[bytes]** read from the game's own file by a script of this lane (the Steam build 25501027, `FFX_Data.vbf`; the files were extracted read-only earlier and are kept outside the repo, hard rule 8). **[disasm: file @offset]** read from the Atel disassembly of that file's program; the offset is a code offset inside the monster or formation file. No script line is reproduced; scripts are described by what they do.
- **[run]** the real bytecode of the monster file ran in the small Atel interpreter of the earlier AI lanes (`ai/ffx-evrae-yojimbo-isaaru-sin/sim.mjs` and `sim2.mjs`, used unchanged; only a lookup of a command's damage-class byte was added in this lane's driver scripts) against a mock battle with the real command-table rows, with exact tallies over all 65,536 results of the shared random stream where a draw is involved. A run proves the script's own behaviour; the engine facts around it are the earlier lanes' (confidence B in their notes).
- **[engine]** read in the decompile corpus of the earlier lanes (the stored decompile corpus, FFX.exe SHA-256 0537B2A1...686D); Ghidra on :8089 was not answering during this lane, so only the stored corpus was read. **[arith]** arithmetic with the repo's own kernels (`src/battle/ffx/kernel/ctb.ts` and `damage.ts`, read from a clean tree, never executed as a battle): variance 240 to 271, no criticals, no Cheer or Focus.
- **[note: X]** taken from a checked note in this repo. **[guide: Jegged / GG / SG / G8]** a community guide, cited by name only (Jegged.com "Baaj Temple" and "Via Purifico" pages; Gamer Guides "Final Fantasy X HD Remaster, Bestiary, Bosses" pages for Geosgaeno (Optional) and Evrae Altana; Samurai Gamers boss guides; Game8 boss pages), all read 2026-11-06; nothing is copied. **GameFAQs and StrategyWiki answered HTTP 403 (a browser check) to this lane's plain GET and the brief bars the browser, so neither was read; the tie-break "GameFAQs wins when the files cannot settle it" was never needed because the files settled every conflict (section 7).** **[inferred]** not read directly. Fields no note maps are given as plain values and never guessed (hard rule 6).

Files used (size in bytes, SHA-256 prefix): monster files `m109` Geosgaeno (170,436, 4c322e49), `m120` Evrae Altana (179,112, 5c78e8ce), `m162` and `m171` Gate Lock (2,540 each, 27c258a7 and e4092fc3), `m255` the slot filler (4,812, e62c7ec8); formations `bjyt02_01` (7,684, d198b8b3), `bjyt02_02` (22,064, 90d7a212), `stbv00_10` (21,904, 9116005e), `stbv00_11` (21,280, 5b77eade), `stbv00_12` (20,960, eef257ce); field events `bjyt0200` (74,048, a65ede89) and `stbv0000` (34,816, cc799960); kernel tables `monmagic2.bin` (26,191, 455be7f0), `command.bin` (40,957, 88e6a63a), `monster1.bin` (26,496, 76dc8a40), `btl.bin` (4,096, c4e27912), `ctb_base.bin` (530, 72eaa7b3). The sizes and hashes of `monmagic2`, `monster1`, `btl` and `ctb_base` equal those of the Keeper and Dark Aeons notes. The record in each monster file (chunk 2, offsets 0x14 to 0x7F) is byte-identical to the kernel row, checked for all five. **The "170 KB" and "179 KB" scripts of the plan are file sizes: about 165 to 175 KB of each file is a model-and-motion chunk (chunk 5); the AI is 3,011 bytes of code in m109, 1,285 in m120, 343 in each Gate Lock.** Move and item names are the English names of the game's own tables.

## 0. The one-screen summary

- **Five fights, not two, in three places.** (1) `bjyt02_01`: the scripted first Geosgaeno (Baaj Temple, Tidus alone, three turns, cannot be won, ends by script). (2) `bjyt02_02`: the optional second Geosgaeno (Baaj Temple, Tidus, Wakka and Rikku, 32,767 HP, a real fight). (3) to (5) `stbv00_10`, `_11`, `_12`: **one Evrae Altana fought in three areas of the Via Purifico**; its HP is carried from area to area through a persistent script variable, and two Gate Locks per area (the first two areas) end the area when both are gone. [bytes] [disasm] (sections 2, 4)
- **Geosgaeno, second fight (m109):** 32,767 HP, Armored (physical damage divided by 3 unless the command pierces or the target is Armor Broken), **weak to all five elements**, Poison lands, nearly every other status is immune, Slow immune. A fixed cycle: **three attacks (Stone Punch), then Swallow, then Regurgitate**, repeated; below half HP a Stone Punch becomes a KO Punch 69 percent of the time (exact tally 45,200 of 65,536). After the first cycle the next swallow comes after 3 or 2 attacks (a coin on stream 2). Swallow takes a random living character **without Doom** out of the fight, copies that character's statuses onto itself, disables all of the character's commands and gives them one: Struggle. Next turn it spits the character out and **every front-line character takes the swallowed one's HP minus 1** (the swallowed one is left at 1 HP); if the swallowed one Struggled, only they take their own HP (a KO). **Killing Geosgaeno while it holds someone sets a 9,999 hit on the whole front line.** [bytes] [run] (4.1)
- **Evrae Altana (m120):** 16,384 HP, DEF 0, MDEF 0, a permanent Zombie (healing hurts it), weak to Holy only, not immune to percentage damage or to CTB damage; Slow and Darkness land at half strength. **Stone Gaze (single, Petrify 50 + Sleep 50) on the first turn and every other turn while all three are on the field, otherwise and between: Photon Spray (eight hits, each on a random front-line member)**; areas 1 and 2 add a **counter: a plain Attack on whoever dealt HP damage** (not in area 3, which has no counter at all). Two Phoenix Downs, or two X-Potions, end it: 8,192 each, exactly its maximum HP. [bytes] [run] [arith] (4.3)
- **Water is the sharpest rule: block byte 3 of all five Baaj and Via Purifico formations is the in-water flag, and in the status code a Petrify that lands on a non-monster in a water battle becomes Death plus Eject in the same step (a shatter).** Stone Punch (50), Stone Gaze (50) and the party's armour decide the fight; the Keeper's no-water summit has none of it. [bytes] [engine: pp_BtlInflictStatus 0x0078AE00] (2.2)
- **Gate Locks (m162, m171):** 500 HP, DEF 0, immune to all five elements, to magic and to every status, no turns, no CTB row, no loot, not required for the win. `Open lock` (command 0x312F, a Trigger Command on Tidus, Wakka and Rikku, fixed damage 50) makes the script set the lock's HP to 0; an ordinary physical hit should kill it as well (500 HP, DEF 0, no physical immunity; [inferred] from the flags). **When both locks of an area are dead the formation ends the battle as "player escaped", the next area starts with Evrae Altana's HP as it was and the party back in the field (shattered members return).** [bytes] [run] (4.4)
- **The clocks:** tick speed 6 (Geosgaeno, so 18 CTB per rank-3 action; 48 in the first fight, where its AGI is forced to 5), 9 (Evrae Altana, 27), against Tidus at 8 (24). Every move of the three is rank 3. Evrae Altana acts about a ninth less often than Tidus; Geosgaeno acts a third more often. [arith] (6)
- **Against the Gagazet-cell party (the repo's `[estimate]` stat cells):** Stone Punch about 1,140 to 1,440 a hit (about half with Protect), Evrae Altana's Attack/counter 800 to 1,020, Stone Gaze 360 to 520, one Photon Spray hit 82 to 120 (eight of them); the swallowed character's HP minus 1 to all three is the lethal number (6.3). [arith]
- **Rewards:** Geosgaeno 1,000 gil, 4,200 AP (6,300 overkill), Power Sphere x2, steal Water Gem, gear No Encounters weapon / Auto-Reflect armour; Evrae Altana 3,000 gil, 5,800 AP (8,700), Blk Magic Sphere, steal Water Gem x2 / Healing Spring, Stonetouch weapon / Stone Ward armour. [bytes]
- **Sources agree with the files** on all of this except: Jegged prints Geosgaeno's HP as 30,000 (file 32,767, Samurai Gamers and the search snippet of StrategyWiki agree with the file); Game8 reverses the Struggle rule (files, Gamer Guides and Samurai Gamers agree: Struggle KOs the one who struggles, no Struggle means the spit-out hits everyone for HP minus 1); Gamer Guides says the Evrae Altana counter answers physical attacks (the file counters any HP damage in areas 1 and 2). (section 7)
- **Recommendation for the chapter shape and every pick is in `docs/plans/ch-geosgaeno-review.md` (the draft beside this note).**

## 1. The monster records (a)

Offsets are record offsets (chunk 2; layout [note: re-ffx-dark-aeons.md 1; FFX-H02 3.1]). Heights, models and hit boxes were not read.

### 1.1 Identity

| Piece | Monster word | Model word | Notes | Tag |
|---|---|---|---|---|
| Geosgaeno `m109` | 0x106D | 0x106D (record +0x74) | CTB icon 21; Doom byte 3; death animation "Boss" (body stays, untargetable) | [bytes] [disasm: m109 @0x0066] |
| Evrae Altana `m120` | 0x1078 | 0x1077 (record +0x74) | CTB icon 21; Doom byte 3; death animation "Boss"; forced action byte 0x6066 (a Provoke-forced Critical Strike that never fires: Provoke is immune) | [bytes] [note: ffx-evrae-airship.md 3.4, C-10] |
| Gate Lock `m162` | 0x10A2 | 0x10A2 | CTB icon 22 (no turn); death animation "Character" (body stays and stays targetable) | [bytes] [disasm: m162 @0x0075] |
| Gate Lock `m171` | 0x10AB | 0x10A2 | the same model as m162; differs from it by Life immunity and the Poison byte | [bytes] |
| `m255` (slot filler) | 0x10FF | 0 | the record named "Magic Urn" in the tables; HP 999,999, DEF/MDEF 255; used as the unused slot of the area formations and hidden by Evrae Altana's script | [bytes] [disasm: m120 @0x016c] |

Slots: area 1 and 2 hold Evrae Altana (actor 20), Gate Lock m162 (21), Gate Lock m171 (22), the filler (23); area 3 holds Evrae Altana and three fillers (21 to 23). The Geosgaeno formations hold the one monster. [bytes]

### 1.2 Stats

No monster record carries a level. [bytes]

| Field | Geosgaeno | Evrae Altana | Gate Lock m162 | Gate Lock m171 | Tag |
|---|---:|---:|---:|---:|---|
| HP | 32,767 | 16,384 | 500 | 500 | [bytes] |
| MP | 128 | 200 | 1 | 1 | [bytes] |
| Overkill threshold | 32,767 | 2,000 | 2,000 | 2,000 | [bytes] |
| STR / DEF / MAG / MDEF | 36 / 50 / 40 / 50 | 32 / 0 / 27 / 0 | 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 | [bytes] |
| AGI / LCK / EVA / ACC | 48 / 15 / 0 / 50 | 25 / 15 / 0 / 100 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | [bytes] |
| Tick speed (from AGI) | 6 | 9 | n/a | n/a | [arith] |
| Flag byte +0x28 | 0x17: Armored, immune to percentage damage, to Life, to the second Scan | 0x04: immune to Life only | 0x5E: percentage, Life, Sensor, second Scan, **magical commands** | 0x5A: percentage, Sensor, second Scan, **magical commands** | [bytes] |
| Flag byte +0x29 | 0x07: immune to CTB damage, Slice, Bribe | 0x06: Slice and Bribe only (**CTB damage lands**) | 0x07 | 0x07 | [bytes] |
| Poison damage byte | 10 (10 percent of max HP per tick = 3,276) | 25 (immune to Poison) | 0 | 25 | [bytes] [note: re-ffx-ctb-status.md 14.4] |
| Element absorb / immune / resist / weak | 0 / 0 / 0 / **Fire, Ice, Thunder, Water, Holy** | 0 / 0 / 0 / **Holy** | 0 / all five / 0 / 0 | 0 / all five / 0 / 0 | [bytes] |
| Automatic statuses | none | **Zombie** (permanent word 0x0002) | none | none | [bytes] |
| Extra-immunity word (+0x4E) | 0x4301: Scan, Eject, Auto-Life, Doom | 0x4300: Eject, Auto-Life, Doom (**Scan lands**) | 0x7BEF: Scan, the four Distills, Shield, Boost, Eject, Auto-Life, Defend, Guard, Sentinel, Doom | the same | [bytes] |
| Command list (+0x50), as stored | Stone Punch 0x6032, Swallow 0x602E, Regurgitate 0x602F, KO Punch 0x6033, Regurgitate 0x606A, Regurgitate 0x6069, Half HP 0x6037, One HP 0x6038 | Attack 0x6000, Stone Gaze 0x604C, Photon Spray 0x604B, Photon Spray 0x606B | none | none | [bytes] |
| Forced action | Attack 0x6000 (never fires: Provoke immune) | Critical Strike 0x6066 (never fires) | none | none | [bytes] |

**Status bytes** (255 immune; otherwise the move's chance minus the byte, and a move whose chance byte is 254 lands on anything below 255 [engine: pp_BtlInflictStatus]; Threaten's byte is a success percentage [note: re-ffx-biran-yenke.md 2]).

| Status | Geosgaeno | Evrae Altana | Gate Locks |
|---|---:|---:|---:|
| Death, Petrify | 255 | 255 | 255 |
| Zombie | 255 | 0 (already Zombie by its automatic status) | 255 |
| Poison | **95** (Bio and Poison Fang, chance 254, land) | 255 | 255 |
| Power / Magic / Armor / Mental Break | 255 | **0 (land)** | 255 |
| Confuse, Berserk, Provoke | 255 | 255 | 255 |
| Threaten | 0 (cannot land) | 0 (cannot land) | 0 (cannot land) |
| Sleep, Silence | 255 | 255 | 255 |
| Darkness | 255 | **50** | 255 |
| Shell, Protect, Reflect, the four Nul, Regen, Haste | 0 (land) | 0 (land) | 255 |
| Slow | 255 | **50** | 255 |

**Stored list and script:** the list's Regurgitate rows 0x606A and 0x6069 and One HP 0x6038 are never queued by m109's script, and Evrae Altana's Attack 0x6000 is queued only as a counter; a row in the list that no branch queues is not part of the fight. [bytes] [run]

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5], values from `coverage/ffx/FFX-H02/monsters_loot.tsv`)

| Field | Geosgaeno | Evrae Altana | Keeper (row 39) | Tag |
|---|---|---|---|---|
| Gil / AP / AP on overkill | 1,000 / 4,200 / 6,300 | 3,000 / 5,800 / 8,700 | 6,500 / 11,000 / 16,500 | [bytes] |
| Normal drop (item chance byte 255) | Power Sphere 0x2046 x2; overkill x4 | Blk Magic Sphere 0x204F x1; overkill x2 | Return Sphere 0x2060 x1; overkill x2 | [bytes] |
| Steal common x qty / rare x qty | Water Gem x1 / Water Gem x2 | Water Gem x2 / Healing Spring 0x203B x1 | Turbo Ether x1 / Turbo Ether x2 | [bytes] |
| Gear (chance 255: always one piece) | weapons No Encounters 0x801D (all seven characters), armour Auto-Reflect 0x8058 | weapons Stonetouch 0x8037 (Auron and Kimahri also Piercing 0x800B), armour Stone Ward 0x8039 | weapons Half MP Cost 0x800C (Auron, Kimahri also Piercing), armour MP +10 percent 0x8077 | [bytes] (names by `a_ability.bin`) |
| Zanmato level byte | 3 | 3 | 3 | [bytes] |
| Gil Pilfer-steal byte (x100) | 10 | 22 | 33 | [bytes] |

The Gate Locks pay nothing (every field 0). In the **first** Geosgaeno fight the script writes item and gear drop chances 0 and AGI 5 for the monster (section 4.2), so that fight pays no drop. [bytes] [run] (Samurai Gamers prints AP 1 for the first fight and 4,200 for the second; the file's AP field is the same for both, so the 1 is not in the record and was not traced.) Gil, AP, drops and the steal list agree with Jegged, Samurai Gamers and Gamer Guides. [guide]

## 2. The formations (b)

### 2.1 What the formations hold

Formation block (28 bytes; layout [note: FFX-H02 3.7]), area table of `btl.bin`, launching events. Battle id = (area key << 16) or formation number [note: FFX-G10 3.8].

| Formation | Battle id (hex / decimal) | Area key | Monster words (slots 0 to 3) | Block bytes (voice, byte 1, foot-sound id, **in-water**) | Battle flag word at launch | Tag |
|---|---|---:|---|---|---|---|
| `bjyt02_01` | 0x00200001 / 2,097,153 | 32 | 0x106D | 0, 0, 16, **1** | 66,817 (0x10501) | [bytes] |
| `bjyt02_02` | 0x00200002 / 2,097,154 | 32 | 0x106D | 0, 0, 16, **1** | 3,072 (0xC00) | [bytes] |
| `stbv00_10` (area 1) | 0x0195000A / 26,542,090 | 405 | 0x1078, 0x10A2, 0x10AB, 0x10FF | 0, 0, 16, **1** | 66,817 | [bytes] |
| `stbv00_11` (area 2) | 0x0195000B / 26,542,091 | 405 | the same four | 0, 0, 16, **1** | 66,817 | [bytes] |
| `stbv00_12` (area 3) | 0x0195000C / 26,542,092 | 405 | 0x1078, 0x10FF, 0x10FF, 0x10FF | 0, 0, 16, **1** | 66,817 | [bytes] |

Flag words (decoded as in the Dark Aeons note [note: FFX-G10 3.6]): bit 9 (0x200) is clear in all five, so **a defeat is a game over**; 66,817 has bit 8 (0x100) set (no victory pose or fanfare, by the earlier decode) and bit 10 (0x400) set (not decoded by any checked note) plus bits 0 and 16 (not decoded); 3,072 (the second Geosgaeno) has bit 8 clear, so it plays the victory pose and fanfare. The Boss Theme (BGM 12) plays before every one of the five launches. [bytes]

### 2.2 The in-water flag

Block byte 3 is copied to the global at 0x0112C9CE by the formation loader (0x00783E20) and read by about twenty functions [note: FFX-H02 3.7 and 3.11]. The one that matters here is the status infliction (pp_BtlInflictStatus 0x0078AE00): when Petrify lands, **if the target is not a monster and the global is zero, the Petrify stays as a status (a later physical hit may shatter it, the ordinary rule the engine has); if the target is a monster or the global is non-zero, the same step adds the Death and Eject bits** (a shatter). So **in a water battle every Petrify that lands on a party member removes them from the battle at once, with no Petrified stage and no chance to cure it**. The guides say exactly this ("instantly shatter"). [engine: corpus 0078ae00.c lines 105 to 113] [guide: Jegged, GG, G8] The global is also read by the camera and motion code (0x00794830, 0x00794AB0, 0x00794C20, 0x00795980: half a distance added or removed), which is presentation. The four formations of the Keeper's summit have the flag 0 (row 39).

### 2.3 What the formation scripts do

- **`bjyt02_01` (scripted first fight):** disables Escape, Flee and Switch for character 0 (Tidus); `btlSetMapCenter(0, -50, 37)`; writes **no** start state (the engine's roll stands); the formation has two functions that end the battle as "player escaped" (one unconditional, one when a stored variable reads 255), and the monster's third turn runs a scene. Five areas (0 to 4): Tidus changes place after each Attack he lands (section 4.2). [bytes] [disasm: bjyt02_01 @0x0009 to 0x0060]
- **`bjyt02_02` (second fight):** disables Escape and Flee for characters 0, 4 and 6 and **Switch for 0, 3, 4, 6** (character 3 is Kimahri; the script does not say why he is on the list); writes property 338 := 0 for 0, 4 and 6 (not decoded); hides a map layer; **Normal start**; most of the file is camera. Its one gameplay-adjacent job: **when Geosgaeno swallows, a banner is printed naming the character that was swallowed (three strings, one per character 0, 4, 6), and after the transfer one banner per status that moved to Geosgaeno (nineteen strings)**, read from two bit masks the monster's script keeps. [bytes] [disasm: bjyt02_02 @0x0009 to 0x0415, @0x04cc, @0x22fb]
- **`stbv00_10` / `_11` (areas 1, 2):** disables Escape and Flee for every character (group -21) and Switch for 0, 4 and 6; **adds the Open lock command to Tidus, Wakka and Rikku**; `btlSetMapCenter(1053, -30, -1445)` in area 1 and `(573, -30, -890)` in area 2. Its per-turn handler: if all three of characters 0, 4, 6 are dead it does nothing special (the engine's game over); **if actors 21 and 22 (the Gate Locks) are both dead it clears statuses (`btlStatusOff`), shows seven map layers, and ends the battle as "player escaped"**; otherwise it prints one banner and moves on. A second handler stores the monster's HP when the battle ended as "player escaped" and zero otherwise (section 4.3). **Normal start.** [bytes] [disasm: stbv00_10 @0x0009 to 0x0164, @0x0171]
- **`stbv00_12` (area 3):** Escape and Flee off for all seven characters, Switch off for 0, 4, 6; **no Open lock command, no locks**; `btlSetMapCenter(525, -50, -260)`; the handler prints one banner and waits for a confirm; **Normal start.** The event puts Tidus in slot 2, Wakka in slot 1 and Rikku in slot 0 before this launch. [bytes] [disasm: stbv00_12 @0x0009 to 0x0101; event stbv0000 @0x49FC]
- Nothing in the five scripts changes the AI, the HP, or ends a battle early except as listed. Every area of the Evrae Altana fight is a separate formation: the HP, the Zombie state and the party come across through the persistent variable and through the event's party setup. [bytes]

### 2.4 Start positions (chunk 3; area 0 unless stated; x, y, z) [bytes]

| Formation | Party (3 entries) | Monster slots |
|---|---|---|
| `bjyt02_01` | (0, -50, -20) | (0, -60, 70); Tidus's place by area 1 to 4: (-6, -53, -44), (18, -54, -24), (-2, -41, -74), (18, -41, -47) |
| `bjyt02_02` | (35, -40, -40), (0, -65, -40), (-35, -60, -40) | (0, -60, 40); a second area table holds all three party entries at (0, -60, 40) and the monster at (0, -60, 70), not reached by a script read here |
| `stbv00_10` | (998, -30, -1474), (998, -30, -1444), (998, -30, -1414) | Evrae Altana (1153, -30, -1444); locks (960.7, -10, -1398) and (960.7, -10, -1481.3); filler (957.1, -58, -1440.4) |
| `stbv00_11` | (529, -30, -828), (569, -30, -828), (609, -30, -828) | Evrae Altana (569, -30, -988); locks (611.3, -10, -790.7) and (528.7, -10, -790.7); filler (570.4, -53, -786.6) |
| `stbv00_12` | (338.2, -37, -328.2), (368.7, -70, -260.2), (378.6, -43, -234.1) | Evrae Altana (613, -35, -281); fillers off the floor |

Three party entries, never more: the Via Purifico and Baaj fights field exactly the trio. [bytes]

### 2.5 How the game launches each fight (the field events)

| Fight | Launched from | What the event does before launch | Tag |
|---|---|---|---|
| `bjyt02_01` | `bjyt0200` @0x8BBC | stores the party, removes all eight, adds back Tidus only; Boss Theme | [bytes] |
| `bjyt02_02` | `bjyt0200` @0x9966 | adds Yuna, Lulu, Auron and Kimahri back and restores a stored party setup before the launch (the stored setup is what the guides call the three swimmers; not traced), Boss Theme; after the win the event plays the "Eerie" track (BGM 44) | [bytes] |
| `stbv00_10`, `_11` | `stbv0000` @0x433F and @0x473E | launch with the party already the trio | [bytes] |
| `stbv00_12` | `stbv0000` @0x4A29 | slots 0 to 2 set to Rikku, Wakka, Tidus | [bytes] |

The conditions that unlock each (the airship and the Cloister chests for Baaj; the Highbridge route for the Via Purifico) are the guides' [guide: Jegged], not traced.

## 3. The engine facts the scripts lean on

Only those used here are repeated; the Dark Aeons note, `research/re-ffx-ai-seymour.md` and `research/re-ffx-ctb-status.md` give the rest.

- **Hooks.** m109 binds onTurn, onTargeted, onHit, onDeath and postTurn; m120 binds preTurn (empty), onTurn, onHit, onDeath; the Gate Locks bind onTurn (empty), onTargeted and onDeath. [bytes] [disasm: m109 @0x01a5, @0x04bc, @0x0542, @0x0699, @0x06e2; m120 @0x030b to @0x03a4; m162 @0x0129 to @0x0141]
- **onHit** is raised once per action per target, before the death check [note: re-ffx-ai-seymour.md]. **Geosgaeno's onHit does not check `isCounterattackAllowed`** and Evrae Altana's does not either. [disasm]
- **Random draws.** `GetRandomValue()` is stream 2 masked to 16 bits: modulo 2 is exact, modulo 3 gives residue 0 on 21,846 of 65,536, modulo 5 gives residue 0 on 13,108 and residues 1 to 4 on 13,107 each, modulo 100 gives 0 to 35 on 656 each and the rest on 655. `findMatchingChr` over the front line is a uniform pick among living, targetable members, one stream-4 draw when two or more are candidates. [run]
- **Variable locations.** A script variable has a location in its top bits. Geosgaeno's v0 to v2 are battle-wide and v3 to v14 are private to the actor; Evrae Altana's **v0 is a persistent cell (location 0, address 0xA7C) shared with the formations' own v0**, which is what carries its HP across areas. [bytes] [run: location tags]
- **Cap rule:** damage is capped at 9,999, or 99,999 with Break Damage Limit, and `Cmd+0x20` bit 0x80 forces 99,999 [note: re-ffx-damage.md 6]. Regurgitate and Mana Breath carry the bit; Stone Punch, KO Punch, Photon Spray, Tail Sweep and Curaga do not. [bytes]

## 4. The AIs

### 4.1 Geosgaeno (m109), `bjyt02_02` [bytes] [disasm: m109 @0x0027, @0x01a5, @0x04bc, @0x0542, @0x0699, @0x06e2] [run]

**Set-up (init f0).** Death animation "Boss"; adds the Death row (0x6030) to its own list; saves half its maximum HP (16,383) as the "below half" line. In `bjyt02_01` it also writes AGI 5 and drop chances 0; in the other fight it writes property 128 := -1 (the swallowed-character link, empty). Nothing is written to the party except that the formation hides a map layer. [run]

**The turn (onTurn), second fight.** Three states, held in private v4:

1. **Attack state (v4 at most 2):** v4 is incremented; the target is the Provoker if Provoked (dead code: Provoke is immune), otherwise a random living front-line member (one stream-4 draw with two or more). **If its HP is below half and a stream-2 draw modulo 100 exceeds 30, the move is KO Punch; otherwise Stone Punch.** Exact tally over 65,536 results: at HP 10,000/32,767 Stone Punch 20,336 (31.03 percent), KO Punch 45,200 (68.97 percent); at full HP Stone Punch 65,536. One stream-2 draw per turn once below half. [run]
2. **Swallow state (v4 = 3):** the target is a random living front-line member **who does not have Doom** (`findMatchingChr` with the "not" selector on property 157); **if all living members have Doom** it uses KO Punch on a random one instead and nothing is swallowed. Otherwise: v4 := 255, a flag := 128, the victim gets the Struggle command (0x3109), becomes **untargetable**, has Attack, White Magic, Black Magic, Item, Skill, Special, Weapon, Armor **and its Overdrive command (Swordplay for Tidus, Slots for Wakka, Mix for Rikku) disabled**, and Swallow is queued on it. [run: Doom cases] [note: re-parity-rc10-ffx-script-command-locks.md, row m109, 33 calls]
3. **Spit-out state (v4 = 255):** v4 := a stream-2 draw modulo 2 (so the next swallow follows after **3 attacks if the draw is even, 2 if odd**); the victim becomes targetable again, its command rows return, the **Struggle command is removed**; Geosgaeno saves its own HP and maximum HP, **sets its maximum HP to the victim's current HP minus 1**, and queues Regurgitate (0x602F, formula 0x10 = user maximum HP x 10 / 10, no variance) on the whole front line. Its post-turn handler restores its HP and maximum HP. [run] Result: **every front-line character, the victim included, takes (victim HP - 1)**; the victim is left at 1 HP, and a front-line character whose HP is at or below that number is KO'd.

**The post-turn transfer (postTurn).** On the turn Swallow is queued, the handler copies the victim's statuses onto Geosgaeno, ignoring its own immunities, and clears most from the victim: **ailments** Zombie, Poison, Power Break, Magic Break, Armor Break, Mental Break, Silence (set to 2), Darkness (set to 2) (moved; Geosgaeno gains them); **buffs** Shell, Protect, Reflect (10 turns each), the four Nul (1), Regen (10), Haste (10, and Slow cleared), Slow (10, and Haste cleared; the victim's Slow is removed). The victim also loses Poison, Confuse and Zombie at the end. Two bit masks (ailments up to 511, buffs up to 1,023) feed the formation's banners; a scene runs if either is non-zero. Sleep is tested and ignored. The victim keeps its buffs (copied, not moved). [run: with Haste, Protect, Poison, Power Break, Zombie, Silence on the victim the masks read 135 and 258 and Geosgaeno gained Haste 10 and Protect 10]

**onTargeted** counts every Attack (12288) aimed at Geosgaeno in the **first** fight and moves Tidus to area 1, 2, 3 and back to 0 on the first four. In the second fight onTargeted does nothing.

**onHit (second fight).** If the command that hit was **Struggle**: Geosgaeno sets its maximum HP to the victim's current HP (not minus 1), queues Regurgitate on **the victim alone**, with the same restore afterwards; the damage equals the victim's HP, so **the one who struggles is KO'd and nobody else is hurt**. [run: max HP 4,001 for a victim at 4,001] Nothing else happens on a hit. The random-draw gate for Struggle is "always" (a draw modulo 100 is below 100).

**onDeath.** If the second fight is on and **v4 is 255 (someone is inside)**: maximum HP := 9,999 and Regurgitate on the whole front line (**9,999 to everyone**, the held one included); then the Death row replaces the death animation. [run] With nobody inside it only replaces the animation.

**Cadence.** Geosgaeno acts every 18 CTB (tick speed 6); the full cycle of three attacks, Swallow, Spit-out is 5 turns (90 CTB) the first time and 5 or 4 after. [arith]

### 4.2 Geosgaeno, first fight (`bjyt02_01`) [run]

One character in the party (Tidus). Geosgaeno's first two turns are **Half HP** (0x6037, formula 5 power 8: half of the target's current HP, no variance) on character 0; the third turn runs a scene and the battle ends (a fourth turn never comes). Tidus's first four Attacks move him between the five areas. The monster's AGI is 5 (tick speed 16: 48 CTB per action) and it drops nothing. **There is no winning line**: the guides say so ("cannot be won"). Half HP against Tidus at 2,420 HP: 1,210, then 605. [run] [arith] [guide: GG, SG, G8]

### 4.3 Evrae Altana (m120), `stbv00_10` / `_11` / `_12` [bytes] [disasm: m120 @0x000f, @0x030b to @0x03a4] [run]

**Set-up, per area.** All areas: Death animation "Boss", the Tough and Heavy flags set (no delay recoil, no lift), floating and gravity-free (presentation). It sets the Photon Spray row in v5: **0x604B in areas 1 and 2, 0x606B in area 3** (the two rows are identical in power, hits and targeting; they differ in animation words only). Area 1: hides map layer 20, **turns actor 23 off** (no turns, not on the CTB bar, untargetable, not required), sets the enemy group of actors 21 and 22 to 1 with CTB icons 0 and 1, **saves its maximum HP to the persistent cell v0**. Area 2: hides layer 21, the same hiding, **writes property 261 := 9,000 (not decoded) and sets its HP to the persistent cell v0**. Area 3: takes the party-side flag of actors 21 and 22 off (they are not in the front line), hides actor 23, **sets its HP to v0**. [run: area 1 v0 = 16,384; areas 2 and 3 start with HP from the cell] [disasm: m120 @0x0157 to @0x02f7]

**The turn (onTurn).** A private flag v6 starts at 0 and flips every turn. **When v6 is 0 and the front line holds exactly three characters, the move is Stone Gaze (0x604C) on one random living character; otherwise it is Photon Spray (v5) on the front line**, and the flag flips either way. [run] With three on the field this is **Stone Gaze, Photon Spray, Stone Gaze, Photon Spray, ...**; with two or one (a shattered member leaves the front line) it is **Photon Spray every turn** and the cadence of Gazes is lost until the area ends. The flag starts at 0 in each area, so each area opens with a Stone Gaze. [run] Photon Spray is eight hits (row field), and the guides and the airship note say each re-rolls its target among the front line [note: ffx-evrae-airship.md 3.3 note 5 and 3.5: the retargeting "comes from the guides", the target byte only says "random character"]. Darkness and Slow land on Evrae Altana only at the move's chance minus 50.

**The counter (onHit).** **Areas 1 and 2:** if the hit left a nonzero `LastDamageTakenHP` (property 166), Evrae Altana queues a plain **Attack (0x6000) on the last attacker**, whatever the damage type or command (so a Phoenix Down thrown at it, which damages it, draws the counter too [inferred from the property test]). **Area 3: no counter at all**; instead, on the first hit it sets a flag and runs scene B(0) once. Exact: damage taken 0 in area 1 queues nothing; 800 queues Attack on actor 4 (the sim's attacker); area 3 queues nothing on the first or the second hit. [run]

**onDeath.** Map layers on, then the Boss death animation (the body stays); nothing else. [disasm: m120 @0x03a4]

**Between areas.** In area 1 and 2 the formation ends the battle when both Gate Locks are dead. At that moment its battle-end handler (`BattleEndType()` is 3, "player escaped") stores Evrae Altana's current HP in the persistent cell, otherwise it stores 0. [bytes] [disasm: stbv00_10 @0x0171 to @0x0189] **The next area starts the monster with that HP** (and the same Zombie state and no status, since `btlStatusOff` ran); the party returns with the HP it had, with **shattered members back in the field** [guide: GG: the lock "will revive/bring back other party members that may have been petrified and shattered"; not traced in the files]. If Evrae Altana dies in area 1 or 2 the cell holds 0 and no further area comes.

### 4.4 The Gate Locks (m162, m171) [bytes] [disasm: m162 @0x0003 to @0x0141] [run]

Init: scale 1.2; Targetable stays at its default (**targetable**); MustBeKilled 0, VisibleOnCTB 0, GetsTurns 0; facing 90 degrees in area 1 and 0 in the other areas; HP 500. **onTargeted: if the command was Open lock (12591 = 0x312F) its HP becomes 0**; any other command does nothing here (a damaging hit still removes HP in the engine). onDeath: plays the sound and scene A(0) (the gate opens). Open lock itself is formula 6 power 1, a fixed 50 damage, target byte 0x93 (not decoded), Trigger-Command row 303 of `command.bin`. [bytes] [run: HP 500 after another command, 0 after Open lock, in all three areas]

## 5. The move rows (c)

Rows of `monmagic2.bin` (the 0x6xxx ids) and `command.bin` (the 0x3xxx ids). Accuracy formula = bits 3 to 5 of the flag word `Cmd+0x1c` (0 always hits; 2: the command's accuracy byte minus the target's Evasion, plus the user's Luck, minus the target's Luck [note: re-ffx-rng-hit.md 4]). Rank 3 for all (CTB cost = recovery for rank 3).

| Row | Id | User | Target | Damage | Formula / power / hits | Hit | Element | Statuses (chance) | Cap | Tag |
|---|---|---|---|---|---|---|---|---|---|---|
| Stone Punch | 0x6032 | Geosgaeno | one | physical | f1 / 16 / 1 | formula 2, byte 100, crit bonus 10 | none | Petrify 50 (shatters in water) | 9,999 | [bytes] |
| KO Punch | 0x6033 | Geosgaeno | one | physical | f1 / 16 / 1 | formula 2, byte 100, crit bonus 10 | none | Death 50 + **Curse (extra word 0x400, always)** | 9,999 | [bytes] |
| Swallow | 0x602E | Geosgaeno | one | none | f0 | always | none | none (the script does the work) | n/a | [bytes] |
| Regurgitate | 0x602F | Geosgaeno | party (script aims) | HP | f16 (maxHP x 10 / 10) / 10 / 1 | always | none | none | **99,999** (bit 0x80) | [bytes] |
| Half HP | 0x6037 | Geosgaeno (first fight) | one | HP | f5 / 8 / 1 (current HP x 8 / 16) | always | none | none | 9,999 | [bytes] |
| Attack | 0x6000 | Evrae Altana | one (counter) | physical | f1 / 16 / 1 | formula 2, byte 90 | none | none | 9,999 | [bytes] |
| Stone Gaze | 0x604C | Evrae Altana | one | magical | f3 / 16 / 1 | always | none | **Petrify 50, Sleep 50** | 9,999 | [bytes] |
| Photon Spray | 0x604B / 0x606B | Evrae Altana | party, 8 hits each on a random member | magical | f3 / 4 / 8 | always | none | none | 9,999 | [bytes] |
| Struggle | 0x3109 | the held character | self | n/a | (trigger row 265) | n/a | none | none | n/a | [bytes] |
| Open lock | 0x312F | Tidus, Wakka, Rikku | one Gate Lock | fixed | f6 / 1 / 1 (50) | n/a | none | none | 9,999 | [bytes] |

The Struggle and Open lock rows are party Trigger Commands; what they do is in the monsters' scripts, not in the rows. [bytes] [disasm]

## 6. Numbers (arithmetic only; no engine ran)

All figures: the lane's arithmetic output (`calc-w2.out.txt`, kept outside the repo). Party cells are the repo's Gagazet preset (`src/data/ffx/builds/gagazet.ts`, `[estimate]`): Tidus HP 2,420 DEF 20 MDEF 18 AGI 30, Wakka 2,530 / 20 / 16 / 17, Rikku 1,540 / 15 / 15 / 32; and for Evrae Altana also the Fahrenheit cells (the lower bound, `fahrenheit.ts`): Tidus 1,265 / 14 / 12, Wakka 1,430 / 14 / 12, Rikku 880 / 12 / 14. [arith]

### 6.1 Clocks

| Actor | AGI | Tick speed | CTB per rank-3 action (plain / Hasted / Slowed) |
|---|---:|---:|---|
| Geosgaeno (first fight: AGI 5) | 48 (5) | 6 (16) | 18 / 9 / 36 (48) |
| Evrae Altana | 25 | 9 | 27 / 13 / 54 |
| Tidus, Rikku (Gagazet cells) | 30, 32 | 8 | 24 / 12 / 48 |
| Wakka | 17 | 11 | 33 / 16 / 66 |

So Geosgaeno acts a third more often than Tidus; Evrae Altana a ninth less often. A Stone Gaze comes every 54 CTB (two Evrae turns), a Photon Spray on the turns between. [arith]

### 6.2 What the monsters do to the Gagazet-cell party (per hit, base damage over V; no criticals)

| Move | Tidus | Wakka | Rikku | With Protect (physical) or Shell (magical) |
|---|---:|---:|---:|---|
| Geosgaeno Stone Punch / KO Punch (f1 p16 STR 36) | 1,207 to 1,363 | 1,207 to 1,363 | 1,253 to 1,415 | 603 to 707 |
| Evrae Altana Attack / counter (f1 p16 STR 32) | 855 to 965 | 855 to 965 | 887 to 1,002 | 427 to 501 |
| Evrae Altana Stone Gaze (f3 p16 MAG 27) | 450 to 509 | 457 to 516 | 461 to 520 | 225 to 260 |
| Evrae Altana Photon Spray, one hit of eight | 102 to 115 | 104 to 117 | 105 to 118 | 51 to 59 |
| Evrae Altana against the Fahrenheit cells: Attack | 894 to 1,009 (Tidus) | 894 to 1,009 | 907 to 1,024 | 447 to 512 |

Hit chance (formula 2) against Evasion 0 and Luck 18 to 19: Stone Punch and KO Punch about 96 percent (byte 100 plus 15 minus 18, roll below that); Evrae Altana's Attack about 86 percent (byte 90). Magic always hits. [arith] [note: re-ffx-rng-hit.md 4]

### 6.3 The swallow numbers

The spit-out hit equals the **victim's HP minus 1** to each of the three; the Struggle hit equals the **victim's HP** to the victim only; the death hit is 9,999 to each. With the Gagazet cells: a victim at full HP (Tidus 2,420) spits out 2,419 on each, which **KOs Rikku (1,540) and leaves Wakka (2,530) at 111**; Wakka swallowed (2,530) spits out 2,529, KOs both others and leaves Wakka at 1; Rikku swallowed at 1,540 spits out 1,539, which Tidus and Wakka survive. A character above 9,999 HP (Break HP Limit) survives the death hit; the Gagazet cells do not. Struggle costs the one who struggles their place (KO) and nothing else. [arith] [run]

### 6.4 What the party does (one plain physical hit, f1 p16, weapon extras ignored)

| User | Geosgaeno (DEF 50, Armored) | Evrae Altana (DEF 0) |
|---|---|---|
| Tidus STR 31 | 613 to 692, **divided by 3** (Armored) unless the command pierces: about 205 to 230 | 900 to 1,016 |
| Wakka STR 29 | 506 to 571, divided by 3 | 742 to 838 |
| Rikku STR 21 | 203 to 229, divided by 3 | 299 to 337 |
| Lulu MAG 43 f3 p20 (carries the pierce bit) | 1,048 to 1,183, **x1.5 per element bit it is weak to** (a Fire spell: 1,572 to 1,774) | 1,537 to 1,736 |

Geosgaeno (32,767 HP, weak to all five) is a magic, element and Poison fight: an elemental weapon, Wakka's element reels, Rikku's gems (Fire Gem, Sunburst) and Poison (**3,276 per Geosgaeno tick**, byte 10) do the work; plain physical hits are cut to a third. Evrae Altana (16,384 HP, DEF 0, MDEF 0) takes about 17 to 19 of Tidus's plain hits, or **two Phoenix Downs: 8,192 each (max HP x 8 / 16), exactly its maximum HP; two X-Potions: 9,999 each after the cap**. [arith] [guide: Jegged, GG, SG, G8 agree]

## 7. Cross-check with the guides: agreement and the conflicts (the files win)

| Point | Files | Guides | Verdict |
|---|---|---|---|
| Geosgaeno HP | 32,767 | Jegged 30,000 (Baaj page); Samurai Gamers 32,767; the search summary of StrategyWiki 32,767 | files and two guides agree; Jegged is off |
| Geosgaeno weak to all elements, Poison lands | weak byte 0x1F; Poison 95, Bio chance 254 | Jegged: weak to all; Samurai: poison works | agree |
| Stone Punch Petrify, shatter in water | Petrify 50; in-water Petrify = Death + Eject | Jegged, GG, SG | agree |
| KO Punch only below half HP, always Curse, "may instantly KO" | below 16,383 HP, 69 percent; Curse always; Death 50 | GG, SG | agree |
| "After the boss attacks three times it swallows" | 3 attacks, then 3 or 2 | GG | agree (the 2 is not in the guide) |
| Spit-out damage, Struggle | spit-out = victim HP minus 1 to all, victim at 1 HP; Struggle = victim KO'd | GG, SG agree; **Game8 says the reverse** | files, GG, SG win |
| Doom blocks the swallow | yes | GG | agree |
| Defeat while holding = 9,999 to everyone | yes | GG, SG, G8 | agree |
| Transfers buffs/ailments | the lists of 4.1 | GG ("most of them") | agree |
| Evrae Altana HP 16,384, Zombie, healing items hurt it | HP 16,384; automatic Zombie; f8 negated | Jegged, SG, G8, GG | agree |
| Two Phoenix Downs / X-Potions win | 8,192 x 2 / 9,999 x 2 | Jegged, GG, G8 | agree [arith] |
| Stone Gaze first when all three are active | yes | SG | agree |
| Photon Spray "eight hits at random characters" | 8 hits, re-rolled targets | GG | agree |
| Evrae Altana counters "physical attacks" | **any HP damage, areas 1 and 2; none in area 3** | GG | files win (GG's wording is narrower) |
| Shadow gems (Gravity) hurt it despite being a boss | not immune to percentage damage | G8 | agree |
| Evrae Altana's rows | Attack acc 90, Photon Spray MAG base 4 x8, Stone Gaze base 16 with Petrify 50 / Sleep 50, a second Photon Spray row for the third encounter | `research/ffx-evrae-airship.md` 3.5 (an appendix from the community tables) lists the same four | agree |
| The locks move the battle on and bring back shattered members | both locks dead ends the area; HP carries | GG, Jegged | agree (the revival is the next battle's party setup, not traced) |
| Opening a lock skips the two treasure chests | not in these files | Jegged, G8 | story-side, out of scope |

## 8. What is not proved

- **Not run in the engine or the emulator.** The AI was run in the Atel interpreter against a mock world; the game was not run.
- **The shatter on landing** is read from the status code (`pp_BtlInflictStatus`) and the formation byte; the exact move of the "ejected" character (when it returns, what its HP is) was not traced. The party-return-at-the-next-area claim is the guides'.
- **Property numbers 128, 261, 338 and the formation-flag bits 0, 10, 16** are written or read by the scripts and not decoded by any checked note.
- **Whether a Phoenix Down thrown at Evrae Altana draws the counter** (the script tests the HP lost, not the command); and whether an `ImmuneLife` flag alters what a Phoenix Down does to a Zombie (every guide says it deals damage; the file's Life-immunity bit is on the record).
- **The first-fight AP** (Samurai Gamers prints 1, the record says 4,200).
- **What the area index selects for Evrae Altana's three battles** (plate, camera, stage) was not read; the three formations are separate files with their own stage ids.
- **The stage ids and camera of each formation** were not read; positions were.
- **The Keeper is in the sister note** (row 39).

## 9. The fights, for the chapter (facts only; no number proposed)

- **What a chapter has to carry that the engine does not:** the in-water Petrify shatter; the swallow-hold (an actor out of the fight with one granted command, status copy, a rewritten maximum HP, a kill-while-holding rule); the Open lock trigger command on a hittable prop; an enemy HP carried across three areas with the party returning.
- **What it can reuse:** Photon Spray's eight-hit row family (the airship Evrae has it), the Zombie damage-from-healing rule of the kernel, `formula 0x10` (`user-max-hp`, built for Mortibsorption), the trigger-command machinery of the airship Evrae, the chain act pattern of the Mirror Aeons.
- **What is order-sensitive:** Evrae Altana's HP carry; the 3 or 2 attacks between swallows; the Doom rule; Struggle.
- **What the geography says:** two places, two plates, one trio. The plan's one-name bundle must be renamed.

## 10. Things that change PLAN.md

1. **Geosgaeno is Baaj Temple, not the Via Purifico.** Row 36's title, arena line ("flooded-sewer variant of the Isaaru plate") and bundle logic change; the Baaj waterway has no plate.
2. **The first Geosgaeno fight (`bjyt02_01`) cannot be won** and is not part of the 41-hour estimate unless made a scripted prologue.
3. **The AI read is small:** 3,011 bytes of code in m109, 1,285 in m120; the "170 KB / 179 KB scripts" are model data. R for row 36 is finished by this note: the residual R is 2 hours of live checks, not 9.
4. **The sourced party for Geosgaeno is also Tidus, Wakka and Rikku** (the formation bars three of the four party commands only for them; Jegged says only they can swim), so one build file serves both places.
5. **Evrae Altana is a three-area fight with a carried HP**, not a single battle; the chain pattern fits, the "area" rule is new.
6. **The in-water flag is set in 54 of the 863 formations** (`FFX-H02` `formations_all.tsv`, column inWater); among the program rows it is also set for Shinryu (`zzzz02_83`, row 48) and Echuilles (`slik02_01`, row 57), and not for Omega, Ultima, Nemesis, the Lake Macalania pair, the Luca dock or the Chocobo Eater. The water rule built for this chapter is shared plumbing for rows 48 and 57; build it first.
7. **Use the Atel code length, not the file size, when sizing a research row:** every monster file of this size class carries about 165 to 175 KB of model and motion data; the AI itself is 1 to 4 KB of code (m109 3,011, m120 1,285, m128 2,407 bytes).

## 11. How this was checked, and what was not

Scripts and outputs (kept outside the repo, in the lane's own folder): `monrec.out.txt` (records), `m109.txt`, `m120.txt`, `m162.txt`, `m171.txt`, `btl-*.txt` (disassemblies), `rows-36.out.txt` (rows), `t-geo.mjs` and `t-evrae.mjs` with their `.out.txt` (the runs), `calc-w2.mjs` and `calc-w2.out.txt` (arithmetic), `positions.out.txt`, `web/` (the guide texts). Ghidra was not answering; the stored decompile corpus supplied the one engine read (the in-water Petrify branch). Not done: any run of the game, any browser, any art or GPU work, any change to the repo.
