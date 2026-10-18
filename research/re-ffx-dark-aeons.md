# FFX Dark Yojimbo and the Dark Magus Sisters: records, formations and the AI read from the game's own files

**Game case: FFX only.** Dark Yojimbo, the Dark Magus Sisters and the whole Dark Aeon set exist only in FFX (the HD Remaster carries the International content); FFX-2 has none of them and nothing here applies to it. Part of the `re-parity` track. Drafted 2026-10-15. Records, formations and AI only: no engine, data or AI code was changed.

**Source and tags.** Every statement is tagged:

- **[bytes]** read from the game's own file by a script of this lane (FFX_Data.vbf of the Steam build 25501027, files extracted read-only and kept outside the repo). **[disasm: file @offset]** read from the disassembly of that file's program; the offset is a code offset inside the monster file (or formation file) program, as in `research/re-ffx-biran-yenke.md`. No script line is reproduced; scripts are described by what they do to the battle.
- **[run]** the hook was executed: the real bytecode of the monster file ran in the small Atel interpreter of the earlier AI lanes (the Seymour/Evrae lane's, used unchanged) against a mock battle with the real command-table rows, with exact tallies over the shared random result where a draw is involved. A run proves the script's own behaviour; it does not prove the engine facts around it (section 3).
- **[note: X section]** taken from a checked note: a note in this repo (`research/...`), `research/re-ffx-yojimbo-sisters-feasibility.md` (branch `re-ffx-yojimbo-sisters-feasibility`, 8892f8f6, called "the feasibility note" below, which this note re-reads and extends), or one of the private coverage notes kept outside the repo (FFX-G04 targeting and counters, FFX-G08 aeon-side logic, FFX-G10 battle entry and hand-off, FFX-H02 record layouts).
- **[inferred]** not read directly, or arithmetic on [bytes] constants. Fields no note maps are given as plain values (never as a run of bytes, hard rule 8) and never guessed (AGENTS.md hard rule 6).

Files used (size in bytes, SHA-256 prefix): monster files `m340` Dark Yojimbo (50,840, 82da17d4), `m341` Dark Cindy (55,592, 53cac21e), `m342` Dark Sandy (53,176, 58012d66), `m343` Dark Mindy (47,912, db183406), `m116` the dog's file (2,996, f34e962d); formations `nagi05_70` to `_74` (7,156 / 6,900 / 6,900 / 6,900 / 7,028; 3a0b0a26, aa7c1276, d746a6d5, 03f837ca, 58dd948f), `kino00_70` (7,780, ba2a0b01), `kino01_70` to `_72` (7,396 each; e82fb469, f7d54c35, 140500fa), `kino05_70` (7,396, 9bffc1aa), `kino05_71` (7,972, 25e4c5aa); kernel tables `monmagic1.bin` (31,420, 31a83925), `btl.bin` (4,096, c4e27912) and the monster tables; field events `nagi0500` (79,296, b2a53ecd), `kino0000` (115,392, d3178365), `kino0100` (114,112, 8e120aec), `kino0500` (88,704, 118fda05); the executable FFX.exe (SHA-256 0537B2A1...686D) for a handful of engine addresses. The sizes and hashes of the monster, formation and event files equal those the feasibility note lists. Move and item names are the English names of the game's own tables.

## 0. The one-screen summary

- **Dark Yojimbo (m340) is five fights, `nagi05_70` to `_74`**, each a fresh 1,600,000-HP Dark Yojimbo with the same record and the same script; the only difference is one constant: how much his Overdrive gauge gains after each of his own turns (+6 / +10 / +16 / +20 / +26, battle ids 0x01AE0046 to 0x01AE004A). He is fast (AGI 243, one action every 9 ticks). Each turn: if the gauge is 100 or more, **Zanmato** on the whole front line; otherwise one stream-2 draw modulo 3 chooses **Wakizashi on the whole front line**, **Kozuka on one random living front-line character**, or the **dog order**, which makes the dog (m116) bite a random living front-line character. The gain is added **after every turn including the Zanmato turn**, so the gauge restarts at the tier's step, not at 0. Each hit event on him adds +2. Nothing else: no HP threshold, no phases, no reaction beyond the +2. [bytes] [disasm: m340 @0x0132, @0x02f0] [run]
- **The Dark Sisters (m341 Cindy, m342 Sandy, m343 Mindy) are six formations** (`kino00_70` and `kino01_70` the trio, `kino01_71` Cindy alone, `kino01_72` Mindy and Sandy, `kino05_70` Sandy alone, `kino05_71` Mindy alone). Each Sister's turn: (1) trio formations only, while all three live and all three gauges are 100 or more, **Cindy uses Delta Attack** on the whole front line and zeroes the three gauges, while Sandy and Mindy attack and keep their gauge at 100; (2) otherwise, with her own gauge at 100 or more, **Mega Graviton** on the whole front line and her gauge to 0; (3) otherwise a fair coin (stream 2, modulo 2) between her two basic moves (Cindy: Camisade or the dispelling attack 0x412B; Sandy: Razzia or Attack with Petrify; Mindy: Passado or Calamity), each adding 20 to her gauge. Each hit event on a Sister adds +5. The trio starts with all three gauges at 100, so in a normal start Delta Attack is the third enemy action of the battle; every other formation starts the gauge at 0 and the cycle is five basic turns then Mega Graviton. Killing one Sister ends Delta Attack for good. [bytes] [disasm: m341 @0x01d8, m342 @0x01b4, m343 @0x01d8] [run]
- **At the game's own numbers every damaging move is an instant KO on an aeon.** Against the minimum player-side aeon stats (section 6.3) Kozuka, Wakizashi, Zanmato and the dog's bite all exceed the 99,999 cap before any defence; Delta Attack deals 781,430 per hit (six hits); Razzia, Camisade and the Attack with Petrify exceed the cap; only Passado per hit (about 11,500 to 14,500) and Mega Graviton (7/16 of the target's maximum HP) do not. Zanmato, Delta Attack, Razzia and the dispelling attack 0x412B also carry the cleanse flag with an extra-status word, which by the record rules removes those statuses (Auto-Life, for the first three) from the target instead of inflicting them. The difficulty of a mirror chapter is therefore set by whatever the chapter scales, not by the tier or the formation alone. [inferred arithmetic on [bytes] rows] (section 6.3)
- **Recommendation (section 2.6; the driver decides).** Act 1: `nagi05_71` (tier 2, +10 per turn, Zanmato on his 11th turn then every 10, about four player-aeon actions apart); tier 1 if the chapter scales enemy damage up, tiers 3 to 5 leave two actions or fewer. Act 2: `kino01_72` (Mindy and Sandy, 4,500,000 HP together, gauges start at 0, Mega Graviton on each one's 6th turn); the faithful three-against-three trio opens with Delta Attack as the third enemy action in 87.5 percent of normal starts, so it needs the gauges started at 0 (Delta Attack then arrives at tick 45) or a damage scale-down.
- **Two rules a mirror chapter departs from or must decide.** Every Dark Aeon formation calls one unmapped call with the matching aeon's own id (14 for Dark Yojimbo; 15, 16, 17 for the Sisters): this was first read as a lock on the matching aeon (section 2.2), but **section 9 (2026-10-15) disproves that: the call only pins an actor's loaded data, and the matching aeon stays summonable at the game's gate**. Escape and Flee are disabled in all eleven formations, and their flag words make a defeat a game over.
- **Rows are in section 1, formations in section 2 (with the recommendation and the numbers per option), the engine facts the scripts lean on in section 3, Dark Yojimbo's AI in section 4, the Sisters' AI in section 5, every move row in section 6, what is not proved in section 8.**

## 1. The monster records (a)

Offsets are record offsets (the monster file's chunk 2; byte-identical from 0x14 to 0x7F to the kernel row and to the English copy in chunk 6, checked for all five files). Layout [note: FFX-H02 3.1; re-ffx-biran-yenke.md 2].

### 1.1 Identity

| Piece | Identifier | Tag |
|---|---|---|
| Dark Yojimbo | m340, monster word 0x1154, model word 0x3008, CTB icon 21 | [bytes] |
| Dark Cindy / Sandy / Mindy | m341 / m342 / m343, words 0x1155 / 0x1156 / 0x1157, model words 0x3009 / 0x300A / 0x300B, CTB icon 20 | [bytes] |
| The dog (second slot of the five Dark Yojimbo formations) | m116, word 0x1074, model word 0x3017; the name table lists the file as Sinscale | [bytes] |
| Actor numbers | slot 0 is battle actor 20, slot 1 actor 21, slot 2 actor 22 [note: FFX-G10 3.3]. In the trio **Mindy is actor 20, Sandy 21, Cindy 22**; in `kino01_72` Mindy 20, Sandy 21; every solo formation has its Sister at actor 20; Dark Yojimbo is 20 and the dog 21 | [bytes] |

### 1.2 Stats

No monster record carries a level. The Zanmato byte (loot +0x112) is the only graded field: 4 for the four Dark rows, 0 for the dog [note: re-ffx-biran-yenke.md 1].

| Field | Dark Yojimbo m340 | Dark Cindy m341 | Dark Sandy m342 | Dark Mindy m343 | Dog m116 | Tag |
|---|---:|---:|---:|---:|---:|---|
| HP | 1,600,000 | 3,000,000 | 2,500,000 | 2,000,000 | 100 | [bytes] |
| MP | 999 | 999 | 999 | 999 | 1 | [bytes] |
| Overkill threshold | 99,999 | 99,999 | 99,999 | 99,999 | 300 | [bytes] |
| STR | 244 | 175 | 186 | 148 | 10 (the script writes **244** in the five Dark Yojimbo battles) | [bytes], [disasm: m116 @0x00f7 to 0x0179] |
| DEF | 210 | 223 | 201 | 187 | 0 | [bytes] |
| MAG | 131 | 171 | 207 | 248 | 0 | [bytes] |
| MDEF | 144 | 105 | 168 | 132 | 0 | [bytes] |
| AGI | 243 | 185 | 201 | 233 | 0 | [bytes] |
| LCK | 114 | 40 | 80 | 130 | 0 | [bytes] |
| EVA | 0 | 0 | 100 | 240 | 0 | [bytes] |
| ACC | 255 | 255 | 255 | 255 | 30 | [bytes] |
| Tick speed / rank-3 recovery (from AGI) | 3 / 9 | 3 / 9 | 3 / 9 | 3 / 9 | no turns | [note: re-ffx-ctb-status.md 1, 2], [inferred] for the figures |
| Flag byte +0x28 | 0x1E | 0x1E | 0x1E | 0x1E | 0x18 | [bytes] |
| Flag byte +0x29 | 0x07 | 0x07 | 0x07 | 0x07 | 0x06 | [bytes] |
| Poison damage byte (+0x2A) | 25 | 25 | 25 | 25 | 25 | [bytes] |
| Element absorb / immune / resist / weak (+0x2B to +0x2E) | 0 / 0 / 0 / 0 | same | same | same | 0 / 0 / 0 / 0 | [bytes] |
| Automatic statuses (permanent, temporary, extra: +0x48, +0x4A, +0x4C) | none | none | none | none | none | [bytes] |
| Extra-immunity word (+0x4E) | 0x432F | 0x432F | 0x432F | 0x432F | 0x0201 | [bytes] |
| Command list (+0x50) | 0x410A Zanmato, 0x4107 Kozuka, 0x4108 Wakizashi, 0x4109 Wakizashi, 0x410B Daigoro | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4101 Camisade, 0x412B (name table: "Extra 44") | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4100 Razzia, 0x4127 Attack | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4102 Passado, 0x4104 Calamity | empty | [bytes] |
| Forced action (+0x70) / monster index (+0x72) | none / 340 | none / 341 | none / 342 | none / 343 | none / 116 | [bytes] |
| Doom counter (+0x77) / Arena index (+0x78) | 255 / 255 | 255 / 255 | 255 / 255 | 255 / 255 | 3 / 255 | [bytes] |
| Word at +0x7A (sound bank by the layout note) | 0x1120 | 0x1122 | 0x1121 | 0x1123 | 0x0000 | [bytes] |
| Unmapped +0x79, +0x7B to +0x7F | all 0 | all 0 | all 0 | all 0 | all 0 | [bytes] |
| Unmapped +0x00 to +0x13 (text offsets) | ten 16-bit text offsets (not reproduced) | same | same | same | same | [bytes] |

**Flag bytes.** +0x28 = 0x1E (the Dark rows): immune to percentage damage (bit 1), Life (bit 2), Sensor (bit 3) and the second Scan (bit 4); **not** armored, not immune to physical, magical or HP damage. +0x29 = 0x07: immune to CTB damage, Slice and Bribe. +0x4E = 0x432F: immune to Scan, Distill Power, Distill Mana, Distill Speed, Distill Ability, Eject, Auto-Life and Doom. The dog: +0x28 = 0x18 (Sensor, second Scan), +0x29 = 0x06 (Slice, Bribe), extra word 0x0201 (Scan, Auto-Life). [bytes]

**Status bytes** (255 immune; otherwise the move's chance minus the byte; Threaten's byte is a success percentage, so 0 can never land [note: re-ffx-biran-yenke.md 2]). All four Dark rows: 255 (immune) for Death, Zombie, Petrify, Poison, Power Break, Magic Break, Armor Break, Mental Break, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; 0 (lands) for Shell, Protect, Reflect, Nul-Tide, Nul-Blaze, Nul-Shock, Nul-Frost, Regen and Haste; Threaten 0 (cannot land). The dog: 255 only for Confuse and Berserk; every other byte 0 (it is not targetable, so none of this is reachable). [bytes]

**Overkill.** The threshold field is 99,999 in all four Dark rows. With the per-hit cap at 99,999 an overkill needs the killing blow to exceed what is left by the whole threshold, so it looks effectively unreachable [inferred; engine use [note: research/ffx-evrae-airship.md]]; the overkill columns exist and are given below. [bytes]

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5])

Rewards are rolled once per dead monster [note: FFX-H02 3.5], so each Sister pays separately; the dog has no loot.

| Field | Dark Yojimbo | Dark Cindy | Dark Sandy | Dark Mindy | Tag |
|---|---|---|---|---|---|
| Gil | 0 | 0 | 0 | 0 | [bytes] |
| AP / AP on overkill | 8,000 / 10,000 | 10,000 / 12,000 | 10,000 / 12,000 | 10,000 / 12,000 | [bytes] |
| Learned-move word (+6) | 0 | 0 | 0 | 0 | [bytes] |
| Item chance bytes (slot 1 / slot 2), steal chance, gear chance | 255 / 0, 255, 255 | same | same | same | [bytes] |
| Normal drop, slot 1 (common x qty / rare x qty) | Dark Matter 0x2035 x1 / Master Sphere 0x2050 x1 | same | same | same | [bytes] |
| Overkill drop, slot 1 | Dark Matter x2 / Master Sphere x2 | same | same | same | [bytes] |
| Steal (common x qty / rare x qty) | Stamina Tonic 0x2043 x2 / Elixir 0x2008 x1 | Return Sphere 0x2060 x1 / Elixir x1 | Friend Sphere 0x2061 x1 / Elixir x1 | Teleport Sphere 0x2062 x1 / Elixir x1 | [bytes] |
| Bribe | immune (flag +0x29 bit 2), no item | same | same | same | [bytes] |
| Gear drop | base slot count 18, formula 1, critical bonus 6, power 16, extra-ability tries 20 | same | same | same | [bytes] |
| Gear ability pool, raw: weapon row (rows 0, 2, 4, ... 12 of the 14 owner rows, all identical) | 0x0000, 0x8019 x2, 0x8003 x2, 0x8005 x2, 0x8011 | 0x0000, 0x8019 x2, 0x800F, 0x8007 x2, 0x801A x2 | 0x0000, 0x8019 x2, 0x800F, 0x8005 x2, 0x8004 x2 | 0x0000, 0x8019 x2, 0x800F, 0x8006 x2, 0x800D x2 | [bytes] |
| Gear ability pool, raw: armour row (rows 1, 3, ... 13, all identical) | 0x0000, 0x8017 x3, 0x8052 x3, 0x8080 | 0x0000, 0x8017 x3, 0x800A x3, 0x8080 | 0x0000, 0x8017 x3, 0x8054 x3, 0x8080 | 0x0000, 0x8017 x3, 0x8056 x3, 0x8080 | [bytes] |
| +0x110, +0x111 (unmapped) / Zanmato byte (+0x112) / Pilfer-Nab Gil factor (+0x113) / Monster Arena price (+0x114) | 128, 128 / 4 / 0 / 0 | same | same | same | [bytes] |

The ability names the feasibility note gives for these raw ids (Break Damage Limit, Counterattack, Magic Counter, Overdrive to AP, Break HP Limit, Curseproof, Ribbon for Yojimbo; the Triple Overdrive, Alchemy, Gillionaire, Auto-Phoenix, Auto-Shell, Magic Booster, One MP Cost, Auto-Haste variants for the Sisters) stand [note: feasibility note 2]; they were not re-derived here.

### 1.4 The dog (m116)

The dog is a real monster file in the five Dark Yojimbo formations: a stand-in record (the kernel row the name table lists as Sinscale: 100 HP, 1 MP, STR 10, ACC 30, AGI 0, no commands) whose **script was written for these five battles**. Its setup, in every battle that uses the file: not required for victory, not shown on the CTB bar, no turns, death animation "boss" (the body stays), then not targetable; in the five Dark Yojimbo battle ids it also sets STR to 244 and leaves its birth animation alone (in any other battle id the setup hides its birth animation instead). Its turn function does nothing. Its hit function is its whole behaviour (section 4.4). [bytes] [disasm: m116 @0x0009 to 0x0185, @0x018a, @0x018b] [run]

## 2. The formations (b)

### 2.1 What the formations hold

Formation block (28 bytes; layout [note: FFX-H02 3.7]), area table of `btl.bin`, launching events. Battle id = (area key << 16) or formation number [note: FFX-G10 3.8].

| Formation | Battle id (hex / decimal) | Area key / stage id | Monster words by slot (actor) | Block bytes (voice, byte 1, foot-sound id, in-water) | Battle flag word | Tag |
|---|---|---|---|---|---|---|
| `nagi05_70` | 0x01AE0046 / 28,180,550 | 430 / 1080 | 0x1154 Dark Yojimbo (20), 0x1074 dog (21) | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_71` | 0x01AE0047 / 28,180,551 | 430 / 1066 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_72` | 0x01AE0048 / 28,180,552 | 430 / 1080 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_73` | 0x01AE0049 / 28,180,553 | 430 / 1066 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_74` | 0x01AE004A / 28,180,554 | 430 / 1066 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `kino00_70` (trio) | 0x00DC0046 / 14,417,990 | 220 / 1035 | 0x1157 Mindy (20), 0x1156 Sandy (21), 0x1155 Cindy (22) | 0, 0, 5, 0 | 0x1800 | [bytes] |
| `kino01_70` (trio) | 0x00DD0046 / 14,483,526 | 221 / 1036 | same | 0, 0, 9, 0 | 0x1800 | [bytes] |
| `kino01_71` (Cindy) | 0x00DD0047 / 14,483,527 | 221 / 1036 | 0x1155 Cindy (20) | 0, 0, 9, 0 | 0x1800 | [bytes] |
| `kino01_72` (Mindy, Sandy) | 0x00DD0048 / 14,483,528 | 221 / 1036 | 0x1157 Mindy (20), 0x1156 Sandy (21) | 0, 0, 9, 0 | 0x1000 | [bytes] |
| `kino05_70` (Sandy) | 0x00E10046 / 14,745,670 | 225 / 1036 | 0x1156 Sandy (20) | 0, 0, 9, 0 | 0x1000 | [bytes] |
| `kino05_71` (Mindy) | 0x00E10047 / 14,745,671 | 225 / 1036 | 0x1157 Mindy (20) | 0, 0, 9, 0 | 0x1000 | [bytes] |

Every formation is listed in the area table as a zone with weight 0 (never a random encounter). Flag words, read in the launching events: 0x1500 (5376): low byte 0 (results panel requested at the hand-off), bit 9 (0x200) clear so **a defeat is a game over**, bit 8 (0x100) set so **no victory pose or fanfare**; 0x1800 (6144) and 0x1000 (4096): bits 8 and 9 clear (victory pose plays, a defeat is a game over); bits 0x400, 0x800 and 0x1000 are not decoded [note: FFX-G10 3.6]. Every launch uses transition 0 (Screen Shatter). [bytes] The stage ids alternate for Dark Yojimbo (1080 for tiers 1 and 3, 1066 for tiers 2, 4 and 5) and are 1035 / 1036 for the Sisters; what the ids draw was not read. [unproved]

### 2.2 What the formation scripts do

All eleven formation scripts do the same three things and nothing about the AI [bytes] [disasm: nagi05_70 @0x0003 to 0x0024, kino00_70 @0x0003 to 0x0027]:

1. **Escape (0x3003) and Flee (0x3018) are disabled for all characters and aeons.** Nothing else is disabled: Switch, the summon commands and everything else stay available. No script of these formations or of m340 to m343 ends the battle early; a battle ends on a win or on the engine's defeat rule.
2. **They call one unmapped call (`ct_7126`, shown with one argument) with the Dark Aeon's own aeon id**: 14 in the five Dark Yojimbo formations; 16, 15, 17 in the trio; 15 in `kino01_71`; 16 and 17 in `kino01_72`; 16 in `kino05_70`; 17 in `kino05_71`. The other Dark Aeon formations do the same with their own aeon (Valefor 8, Ifrit 9, Ixion 10, Shiva 11, Bahamut 12, Anima 13). The call's handler (FFX.exe VA 0x7A5260) forwards to a setter (VA 0x797090, through 0x7969B0 and 0x796670) that writes one byte of a four-byte group in an actor record and recomputes an "all four non-zero" byte. **The exact argument layout and what the byte gates were not decoded**; because the argument is always the aeon that matches the enemy, and because the Isaaru formations make the mirror aeon unavailable [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 4.1], the most probable reading is that **the game forbids summoning the matching aeon against its Dark Aeon**. This is [inferred] and [unproved]; a chapter that puts the player's own aeons against their dark twins is departing from this rule if it holds. **Superseded by section 9 (2026-10-15):** the handler named here belongs to the neighbouring call 0x7127; the real handler of 0x7126 is at 0x7A8550, and it forbids nothing.
3. **Random positions off** and a few actor-light presets; the rest is camera work per summoned aeon (cursor style, polar camera moves chosen with stream-2 draws) with no battle effect. The Dark Yojimbo formations additionally write **`SetAmbushState(Normal)`**; the Sisters' formations write no start state.

**Start type.** Dark Yojimbo: the formation writes Normal (3); tier 1 only (`nagi05_70`) the m340 script also writes Ambushed (2). By the order the earlier lane read, a monster script's write lands after the opening counters and can change only the intro scene [note: FFX-G10 3.2, open question 3 there]. The Sisters: no write, so the engine's roll stands: with no Initiative gear on a character in the battle 191/256 normal, 32/256 preemptive, 33/256 ambush; with Initiative 191 normal, 65 preemptive, no ambush [note: FFX-G10 (start-type roll), E n=589,824]. [bytes] / [note]

**Opening counters** (so who moves first) [note: re-ffx-ctb-status.md 3], [inferred] for the figures: each Dark Aeon has AGI 185 to 243 (tick speed 3), so its base counter is 9; a normal start sets a monster's counter to `base x 100 / (100 - draw mod 11)`, which is 9 (10 once in 11 draws); ties among monsters go to the lower actor number (Mindy, Sandy, Cindy; Dark Yojimbo). A party member of AGI 30 (tick 8) starts at 22 to 24 before the minimum is subtracted. A normal or ambush start therefore gives every Dark Aeon its first action, and a second one at tick 9, before a party-side aeon of AGI 30 to 42 acts at about tick 13 to 15; a preemptive start (Sisters only: 12.5 percent without Initiative gear) puts the party first.

### 2.3 Start positions (chunk 3; first block = area 0; each position x, y, z) [bytes]

| Formation | Party (3 entries) | Monsters by slot | Aeon positions |
|---|---|---|---|
| `nagi05_70` to `_74` (area 0 identical in `_70` and `_74`; the tier files differ only in the camera work) | (25.018, 0, -28.963), (0.061, 0, -35.045), (-21.878, 0, -31.690) | slot 0 Dark Yojimbo (-0.121, 0, 31.575); slot 1 the dog (19.782, 0, 28.898) | 12 entries; index 6 (-10.686, 0, -61.414) |
| `kino00_70`, `kino01_70` | (23.314, 0, -48.214), (3.314, 0, -39.414), (-17.686, 0, -43.414) | slot 0 Mindy (23.314, 0, 31.786); slot 1 Sandy (3.314, 0, 30.586); slot 2 Cindy (-17.686, 0, 36.586) | entries 7, 8, 9 equal the three party positions; the other nine are the single point (-0.866, 0, -45.309) |
| `kino01_71` | same | slot 0 Cindy (3.314, 0, 30.586) | same |
| `kino01_72` | same | slot 0 Mindy (13.314, 0, 31.786); slot 1 Sandy (-6.686, 0, 30.586) | same |
| `kino05_70`, `kino05_71` | same | slot 0 (3.314, 0, 30.586) | same |
| the same Sister files, area 1 (raw; which area a battle starts in was not traced) | (8.099, 10, 6.344), (11.099, 13, 9.344), (14.099, 16, 12.344) | five slots all at (-38.901, 2 to 6, 7.344) | one aeon position (1.099, 2, -2.656) |

Reading the aeon positions as indexed by the aeon's actor id minus 8 (so index 6 is Yojimbo and 7 to 9 are Cindy, Sandy, Mindy) fits the three Sisters standing on the three party positions [inferred]. Slots 2 to 5 of the Dark Yojimbo area 0 list (-23.419, 0, 43.786), (1.130, 0, 67.232), (9.130, 0, 52.232), (-0.870, 0, 25.232) are unused.

### 2.4 How the game launches each fight (who triggers which tier) [bytes]

**Dark Yojimbo is a ladder walked in one field map (the event `nagi0500`).** Five collision zones along the route each call one launch function of the same worker; the functions use a progress word whose bits record what is done (bit 4 tier 1, 8 tier 2, 16 tier 3, 32 tier 4, 64 tier 5) and the whole hunt starts from a sixth zone that sets the "hunt active" bit (1) and switches the five zones on:

| Zone (in route order) | Launches | Condition |
|---|---|---|
| 1st | `nagi05_70` (tier 1), sets bit 4 | hunt active and bit 2 set; the first contact with this zone plays an introduction scene (worker function 8) that sets bit 2, the next contact launches tier 1 |
| 2nd | `nagi05_71` (tier 2), sets bit 8 | hunt active |
| 3rd | `nagi05_72` (tier 3), sets bit 16 | hunt active and bit 16 clear |
| 4th | `nagi05_73` (tier 4, sets bit 32) **if bit 16 is set**, else `nagi05_72` (tier 3) | hunt active |
| 5th | `nagi05_74` (tier 5, sets bit 64) **if bit 32 is set**, else `nagi05_73` (tier 4) | hunt active |

So the fourth and fifth zones launch "the next tier not yet done"; a player who has won the earlier tiers meets 1 to 5 in order. After the last launch the event sets Dark Yojimbo's "done" bit (value 128 of the quest word) when tier 5 was fought, and a progress-word bit 128 otherwise (the tail was not traced further); when the done bits of all eight Dark Aeons are set, the last event warps to room 223. What sets the quest bit that allows the hunt (value 1 of the quest word) was not traced. Each tier is a new full-HP Dark Yojimbo: nothing writes HP, so nothing carries over. [bytes] / [unproved] for the quest condition

**The Sisters are launched from three maps.** `kino0000` (Sisters trio `kino00_70`, one launch); `kino0100` (trio `kino01_70`, or the pair `kino01_72` and Cindy alone `kino01_71`); `kino0500` (Sandy alone `kino05_70`, Mindy alone `kino05_71`). A per-map flag word records Mindy (bit 2), Sandy (bit 4) and Cindy (bit 8); the trio launch sets all three plus the "Sisters done" bit (128), the pair sets Mindy and Sandy, Cindy alone sets Cindy, and the done bit is set when all three are. The same warp to room 223 follows when the eight Dark Aeons are all done. [bytes]

### 2.5 Starting gauges and what is on the field at the start [run]

| Formation | Dark Aeon gauge at the start (current / maximum) | Bar shown | Dog / extras |
|---|---|---|---|
| `nagi05_70` to `_74` | Dark Yojimbo 0 / 100 (no write; the monster setup writes 0 [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 3.1]) | yes | the dog is on the field, not targetable, no turns |
| `kino00_70`, `kino01_70` | **Mindy 100, Sandy 100, Cindy 100** (each script writes 100), maximum 100 | yes | none |
| `kino01_71`, `kino01_72`, `kino05_70`, `kino05_71` | 0 / 100 for each Sister present | yes | none |

Each of the four Dark rows also writes one unmapped property (number 296): 300 for Dark Yojimbo, 100 for Dark Cindy, 200 for Dark Mindy, none for Dark Sandy (Cindy and Mindy write it in every battle id; the number is unmapped in every checked note). Other setup writes are presentation only (hit-reaction dullness off, a "returns before the death animation" property, death animation: boss for Dark Yojimbo, "fiend" dissipation for the Sisters, model scale 1.3 for Cindy and 1.2 for Sandy). [bytes] [run]

### 2.6 Recommendation, with the numbers per option (the driver decides)

All turn counts below are the enemy's own turns; **an enemy turn is 9 ticks** (AGI 185 to 243 gives tick speed 3, every move has rank 3) and an enemy's first action is at tick 0. A player-side aeon of AGI 30 to 34 (tick 8) acts every 24 ticks, AGI 42 every 21 [note: feasibility note 5.5 for the minima; re-ffx-ctb-status.md 2]. The "player actions" figures come from an arithmetic timeline (one player aeon acting every 24 ticks from tick 24, each of its actions reaching the enemy once as one hit event, the enemy first acting at tick 0). [inferred arithmetic on [run] gauge rules]

**Act 1, Dark Yojimbo (HP 1,600,000 in every tier; only the gauge step differs):**

| Tier (formation, stage) | Gauge per own turn | First Zanmato (his turn / tick), no hits | Period (turns / ticks), no hits | With one player aeon acting every 24 ticks (+2 per hit) | Reading |
|---|---:|---|---|---|---|
| 1 `nagi05_70`, 1080 | +6 | 18th turn / tick 153 | 17 turns / 153 ticks | 16th turn / tick 135, after 5 player actions; then every 15 turns / 135 ticks (5 to 6 actions) | gentlest; the only tier whose script also writes Ambushed |
| 2 `nagi05_71`, 1066 | +10 | 11th / tick 90 | 10 / 90 | 11th / tick 90, after 3 actions; then every 10 turns / 90 ticks (4 actions) | **recommended default** |
| 3 `nagi05_72`, 1080 | +16 | 8th / tick 63 | 7 / 63 | 7th / tick 54, after 2 actions; then every 6 turns / 54 ticks (2 actions) | |
| 4 `nagi05_73`, 1066 | +20 | 6th / tick 45 | 5 / 45 | 6th / tick 45, after 1 action; then every 5 turns / 45 ticks (2 actions) | |
| 5 `nagi05_74`, 1066 | +26 | 5th / tick 36 | 4 / 36 | 5th / tick 36, after 1 action; then every 4 turns / 36 ticks (1 to 2 actions) | hardest |

Why tier 2: it leaves about four player actions between Zanmatos, which is the first spacing at which a player can read the gauge and plan; tiers 3 to 5 leave two or fewer; tier 1 is the safe fallback if the chapter scales the enemy's damage up rather than down. The tier sets only the Zanmato spacing; it does **not** change the other two thirds of his turns (Wakizashi on all, Kozuka on one, the dog's bite), which are each a one-hit KO at the game's own numbers (section 6.3). So "not too easy, not too hard" needs a scaling of damage, HP or both that is the chapter's own; the sourced numbers above are the part the game fixes. A Dark Yojimbo turn mix: 33.334% Wakizashi on all, 33.333% Kozuka on one, 33.333% dog order (exact tally over all 65,536 results), except on a turn that starts with the gauge at 100, which is always Zanmato. [run]

**Act 2, the Sisters:**

| Formation | Enemies (HP) | Start gauges | What happens first | Cadence |
|---|---|---|---|---|
| `kino05_71` Mindy alone, `kino05_70` Sandy alone, `kino01_71` Cindy alone | 2,000,000 / 2,500,000 / 3,000,000 | 0 | five basic turns (Mindy: Passado or Calamity; Sandy: Razzia or Attack; Cindy: Camisade or 0x412B), each +20 | **Mega Graviton on her 6th turn (tick 45)**, then every 6 turns / 54 ticks; each player action reaching her adds +5, which does not change the first one for a single aeon and moves the second to the 11th turn for three acting aeons |
| `kino01_72` Mindy and Sandy | 4,500,000 together | 0 and 0 | the two cycle independently, both on the same 9-tick beat: Mindy acts first, then Sandy | both reach Mega Graviton on their 6th turn (tick 45), then every 6 turns |
| `kino00_70` / `kino01_70` trio (the faithful mirror of three Sisters against three Sisters) | 7,500,000 together | **100, 100, 100** | **normal or ambush start (87.5 percent): Mindy and Sandy attack (their gauges stay at 100), then Cindy's first turn is Delta Attack on the whole front line, all inside the first 9 ticks and before any party-side aeon acts**; preemptive start (12.5 percent): the party acts first | after Delta Attack the three gauges are 0 and refill at +20 per turn: round 7 is Mindy and Sandy attacking at 100 and **Cindy's second Delta Attack**, then every 6 rounds / 54 ticks; no Mega Graviton while the three stay in step (hits add +5 each and can break the step; section 5.4) |
| trio with the gauges started at **0** (not a game formation: the scripts read the battle id, so the chapter would use the trio's battle id and write the three gauges to 0 after the setup) | 7,500,000 | 0, 0, 0 | five rounds of three basic turns (+20 each); round 6: Mindy and Sandy attack (gauge held at 100) and **Cindy uses Delta Attack at tick 45** | the gauges refill at +20 per turn, so the next Delta Attack is Cindy's 7th turn (6 rounds / 54 ticks after the first) and Delta Attack repeats every 6 rounds; Mega Graviton does not fire while all three live and stay in step, but each hit event adds +5, so a Sister hit more often than the others reaches 100 first and, with the other two below 100, uses Mega Graviton and drops out of step |

Advice: the pair `kino01_72` is the best fit for "not too easy, not too hard" as a game-sourced formation: two enemies, no Delta Attack, and a Mega Graviton on turn 6 that the player can see coming on the visible gauge. If the chapter must show three Sisters against three, the faithful trio is a wipe at its opening in 87.5 percent of normal starts at the game's own numbers (Delta Attack is the third enemy action), so it needs either the gauges started at 0 (above) or the Sisters' damage scaled; the first is the smaller departure from the game's data and keeps the signature move (Delta Attack at tick 45, after five rounds in which the player acts about twice per aeon). Killing one Sister disables Delta Attack for the rest of the trio fight, which is the player's counterplay and is worth keeping. Which Sister to kill first: Cindy (3,000,000 HP) is the only one who can throw Delta Attack, but the trio test also fails if Sandy or Mindy is dead, so the smallest HP (Mindy, 2,000,000) is the cheapest way to switch it off; Cindy dead also switches it off. [inferred from the scripts [run]; arithmetic [inferred]]

## 3. The engine facts the scripts lean on

The scripts are the game's own bytecode; what they do depends on a few engine rules that earlier lanes proved. Only those used here are repeated (VA = address in FFX.exe).

**Hooks.** Each monster file has one AI worker (slot 61) whose function table binds the engine events by tag: 0 onTurn, 1 preTurn, 2 onTargeted, 3 onHit, 4 onDeath [note: re-ffx-ai-seymour.md 1.1; re-ffx-biran-yenke.md 5.1]. The five files here bind:

| File | init | onTurn | preTurn | onTargeted | onHit | onDeath |
|---|---|---|---|---|---|---|
| m340 Dark Yojimbo | f0 @0x0000 | f2 @0x0132 | f4 @0x0329 (empty) | f5 @0x032a (empty) | f3 @0x02f0 | f6 @0x032b (swaps in his Die command as the death animation) |
| m341 Dark Cindy | f0 @0x0000 | f2 @0x01d8 | f4 @0x0415 (empty) | f5 @0x0416 (empty) | f3 @0x03dc | f6 @0x0417 (empty) |
| m342 Dark Sandy | f0 @0x0000 | f2 @0x01b4 | f4 @0x04ed (empty) | f5 @0x04ee (empty) | f3 @0x04b4 | f6 @0x04ef (empty) |
| m343 Dark Mindy | f0 @0x0000 | f2 @0x01d8 | f4 @0x0511 (empty) | f5 @0x0512 (empty) | f3 @0x04d8 | f6 @0x0513 (empty) |
| m116 the dog | f0 @0x0000 | f2 @0x018a (empty) | none | none | f3 @0x018b | none |

Each of the four Dark files has a second worker (type 1, slot 4) that only sets presentation (low-health slump off; Cindy and Sandy also scale the model). There is no preTurn, onTargeted or onDeath logic anywhere in these five files. [bytes] [disasm: the five files]

**onHit and the +2 / +5 gain.** onHit is raised once per sub-action per target, after the last hit of that target's block; a miss, a status-only move and a move with a hit record but no damage each raise one; a command with zero hit records raises none. It runs before the death check. `isCounterattackAllowed()` is true when the owner is not Petrified, Confused, Berserk, asleep, Ejected or Threatened (Provoked and not-in-battle are allowed), the owner's last attacker exists, and that attacker is not itself running a reaction record, so a party counter-attack does not pay the gain [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.1; engine VA 0x7A8450]. The Dark rows are immune to every disabling status except Threaten, which cannot land (byte 0), so in practice **every player action that reaches the monster pays the gain once**, however many hits or targets it has. A script gain happens on top of any engine rule; no engine rule fills a monster's script Overdrive gauge (property 19) in these battles, so the gauge changes only where the scripts write it [inferred: no other writer was looked for; the run results are the scripts'].

**Random draws.** `GetRandomValue()` is stream 2 masked to 16 bits: modulo 2 is exact (32,768 each), modulo 3 gives residue 0 on 21,846 of the 65,536 values and residues 1 and 2 on 21,845 each [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.5]. `findMatchingChr(front line, alive, 0, any)` is a uniform pick among the living, targetable members of the group in ascending actor number, drawing one stream-4 value when there are two or more candidates and none for zero or one [note: re-ffx-ai-seymour.md 1.3; re-ffx-ai-yunalesca-bfa.md 1.3]. The earlier feasibility note read the Kozuka target as "the first living front-line character"; the engine rule makes it a random living one.

**Groups and commands.** `FrontlineChars` is every non-monster actor in the battle, a KO'd one included; when an aeon is summoned the parked party leaves the battle, so the front line is the summoned aeon or aeons [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.2; FFX-G08 5]. `performCommand(group, id)` queues one action against the whole group; with an actor id it targets that actor; it queues only if the owner can act [note: re-ffx-ai-seymour.md 1.2]. The dog's reaction is kept only if the dog can act and the order's attacker is on a normal turn [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.1].

**Speed.** Recovery after an action is `tick speed (AGI) x rank`, halved by Haste and doubled by Slow; every move below has rank 3 and every Dark Aeon is in the 170 to 255 plateau (tick speed 3), so **each of them acts every 9 ticks** (4 hasted: all four accept Haste; Slow is immune) [note: re-ffx-ctb-status.md 1, 2]. The dog gets no turns.

**The scripts' tests, once, in plain words** (used in sections 4 and 5): "gauge" is the Overdrive current value (script property 19), "max" its maximum (property 20, written 100); every addition is capped at max; the Sisters' trio test reads the actors 20, 21 and 22 by number.

## 4. Dark Yojimbo's AI (m340) and the dog (m116)

### 4.1 Setup (init, f0 @0x0000 to 0x012d) [bytes] [disasm: m340 @0x0006 to 0x012d] [run]

Presentation values; death animation "boss" (the body stays and cannot be targeted); Overdrive bar shown, **maximum 100**; unmapped property 296 := 300; "Tough" (no delay recoil) on; "returns before the death animation" on; hit reactions not dulled. **No write to HP, MP, STR or any other stat**, so every tier starts at the record's 1,600,000 HP, STR 244, AGI 243. No write to the gauge, which starts at 0 (the monster setup writes 0 [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 3.1]). In the battle id 28,180,550 (tier 1) only, it also writes `SetAmbushState(Ambushed)`, which lands after the opening counters and changes the intro only [note: FFX-G10 3.2, open question 3 there]. The dog's setup is in section 1.4.

### 4.2 The turn (onTurn, f2) [bytes] [disasm: m340 @0x013f to 0x02ef] [run, exact tallies over all 65,536 stream-2 results]

1. **Gauge 100 or more:** **Zanmato** on the whole front line (no draw), then the gauge is written 0.
2. **Otherwise** one stream-2 draw, modulo 3:
   - residue 0 (21,846 of 65,536, 33.334 percent): **Wakizashi (the group row 0x4109)** on the whole front line;
   - residue 1 (21,845, 33.333 percent): **Kozuka (0x4107)** on one random living front-line character (stream 4 when two or more live; no draw for one);
   - residue 2 (21,845, 33.333 percent): the **dog order, Daigoro (0x4086)**, aimed at actor 21, the dog.
3. **After either branch (Zanmato included)** the gauge gains the tier's step, capped at 100: battle id 28,180,550 +6; 28,180,551 +10; 28,180,552 +16; 28,180,553 +20; 28,180,554 +26. A battle id outside these five adds nothing (not reachable in the game). **The Zanmato turn therefore ends with the gauge at the step, not at 0**: [run] gauge 100 becomes 6, 10, 16, 20, 26 after Zanmato in the five tiers.

Draws: one stream-2 draw on every ordinary turn, none on a Zanmato turn; one stream-4 draw on a Kozuka turn when two or more characters are alive; none for Zanmato, the group Wakizashi or the order. The row 0x4108 (single Wakizashi) is in his list but no branch queues it. [run]

### 4.3 What a hit does (onHit, f3 @0x02f0) [bytes] [run]

If `isCounterattackAllowed()` the gauge gains **2**, capped at 100 [run: 0 to 2, 99 to 100, no gain when the gate is false]. Once per player action that reaches him, a miss included, a party counter-attack not (section 3). There is no HP-based phase, no half-HP action and no counter command. Dark Yojimbo has no onTargeted, preTurn or other reaction code; his onDeath only substitutes his Die command for the death animation (f6 @0x032b). [bytes]

### 4.4 The dog and its bite [bytes] [disasm: m116 @0x0192 to 0x028c] [run]

The dog order (0x4086) is a row with one hit and no damage class, no status and formula 0, aimed at the dog; by the onHit rule (section 3) that raises the dog's onHit. In each of the five Dark Yojimbo battle ids the dog's onHit does one thing: **if its own `isCounterattackAllowed()` holds, it picks a random living front-line character (stream 4, a draw only when two or more live) and queues the bite (Daigoro 0x410B) as a reaction against that character** [run: the queue holds the bite aimed at the character; no queue when the gate is false]. A reaction pays no CTB and uses the dog's own STR, which the dog's setup wrote as 244. The bite: formula 1 power 8, "neither" type, always hits, cap 99,999, Petrify 254 and Poison 254 (section 6). In any other battle id the same file queues a plain Attack (0x6000) instead and the order is not part of the story. [bytes]

The chain (order, then dog hit event, then reaction) is the same one the Cavern trial Yojimbo uses with its dog [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 3.4, confidence B there]. That the hit event is raised although the dog cannot be targeted is therefore proved only by that fight's reading, not run here. [inferred]

### 4.5 What each tier changes

Only the step of 4.2 rule 3 (and, for tier 1, the intro-only Ambushed write). Everything else is identical byte for byte in the five fights: HP, stats, the roll, the moves, the dog. [bytes] [run]

| Tier / battle id | Step | Gauge after his turns 1 to 6, no hits | First Zanmato (his turn) | Zanmato gap (turns) |
|---|---:|---|---|---:|
| 1 / 28,180,550 | +6 | 6, 12, 18, 24, 30, 36 | 18th | 17 |
| 2 / 28,180,551 | +10 | 10, 20, 30, 40, 50, 60 | 11th | 10 |
| 3 / 28,180,552 | +16 | 16, 32, 48, 64, 80, 96 | 8th | 7 |
| 4 / 28,180,553 | +20 | 20, 40, 60, 80, 100, then 20 | 6th | 5 |
| 5 / 28,180,554 | +26 | 26, 52, 78, 100, then 26, 52 | 5th | 4 |

[run] Each player action that reaches him adds 2 on top, so the real gap is shorter by 1 to 2 turns when the player acts every 24 ticks (section 2.6). A turn is 9 ticks.

### 4.6 What triggers each tier

The field event, not the monster: five route zones launch the tiers in order, with a "next tier not yet done" fallback in the fourth and fifth zones (section 2.4). The monster script has no memory of earlier tiers; each fight is self-contained. [bytes]

## 5. The Dark Magus Sisters' AI (m341, m342, m343)

### 5.1 Setup (init, f0)

All three: Overdrive bar shown, maximum 100, hit reactions not dulled, "returns before the death animation" on, death animation "fiend" (dissipation); the battle-id branches decide only the gauge write [bytes] [disasm: m341 @0x00c6 to 0x01d3, m342 @0x00c6 to 0x01af, m343 @0x00c6 to 0x01d3] [run]:

| Battle id | Gauge written | Property 296 |
|---|---|---|
| `kino00_70` (14,417,990) | current := 100 | Cindy 100, Mindy 200, Sandy none |
| `kino01_70` (14,483,526) | current := 100 | the same |
| any other id (`kino01_71`, `kino01_72`, `kino05_70`, `kino05_71`) | none, so it starts at 0 | the same |

### 5.2 The turn (onTurn, f2): one rule list for all three

Evaluated in this order; the first rule that fires ends the turn. "The trio test" exists only when the battle id is `kino00_70` or `kino01_70` (the two branches are identical). "Front line" is the group of the player's side; "a random target" is the stream-4 pick of section 3. [bytes] [disasm: m341 @0x01df to 0x03db, m342 @0x01bb to 0x04b3, m343 @0x01df to 0x04d7] [run]

| # | Condition | Cindy | Sandy | Mindy | Gauge afterwards |
|---|---|---|---|---|---|
| 1 | trio battle id, and actors 20, 21 and 22 are all alive, and the three gauges are each 100 or more | **Delta Attack on the whole front line**; she first writes 0 to all three gauges | stream-2 coin (draw modulo 2): 0 Razzia, 1 Attack (0x4127), each on a random target | coin: 0 Passado, 1 Calamity, each on a random target | Cindy: all three become 0; Sandy and Mindy: own gauge + 20, capped at 100, so it stays 100 |
| 2 | own gauge 100 or more | **Mega Graviton on the whole front line** | the same | the same | own gauge := 0 (no addition afterwards) |
| 3 | otherwise | coin: 0 Camisade, 1 the dispelling attack 0x412B, each on a random target | coin: 0 Razzia, 1 Attack (0x4127) | coin: 0 Passado, 1 Calamity | own gauge + 20, capped at 100 |

Exact odds: the coin is 50.000 / 50.000 (modulo 2 is exact); rule 1 for Cindy and rule 2 draw nothing from stream 2; rule 1 for Sandy and Mindy draws one, as does rule 3. Each single-target move draws one stream-4 value when two or more front-line characters are alive. The trio test reads actors 20, 21 and 22, which are Mindy, Sandy and Cindy in the trio formations: the numbers are right only there, and that is the only place the test runs. [run: every branch above, exact tallies]

**Important order effect.** The trio test is checked on **each** Sister's own turn against the gauges at that moment. Mindy (actor 20) and Sandy (21) act before Cindy (22) in a round (equal counters resolve to the lower actor), so Delta Attack happens on **Cindy's** turn, after Mindy and Sandy have already spent theirs as plain attacks that leave their gauge at 100. [inferred from the CTB tie rule and the run]

### 5.3 What a Sister does when hit, targeted or killed

- **onHit (f3):** if `isCounterattackAllowed()`, own gauge + 5, capped at 100; nothing else. One gain per player action that reaches her (section 3). [bytes] [run: gauge 0 to 5, 98 to 100, no gain when the gate is false]
- **onTargeted, preTurn:** empty. **onDeath:** empty in all three. There is no counter-attack, no reaction command, no phase change and no HP threshold in any of the three scripts. [bytes] [disasm]
- **A Sister's death changes the others only through the trio test.** The test needs all three alive, so the first death turns it off for the rest of the fight: Cindy then goes to rules 2 and 3 (Mega Graviton at 100, otherwise Camisade or 0x412B), Sandy and Mindy likewise, and nothing ever uses Delta Attack again. A dead Sister's gauge is never read (the alive test comes first). No other script reads another Sister's HP or gauge; nothing is copied to the survivors. [run: trio, Sandy dead, all gauges 100: Cindy and Mindy each take rule 2]
- **Gauge sync in the trio.** With the three gauges moving together (+20 per own turn) the trio test passes at the start of the round after all three reach 100, so Mindy and Sandy hold at 100 and Cindy throws Delta Attack. Hits add +5 to the Sister hit, so a Sister hit more often than the others can reach 100 while another is still below it; on her turn she then takes rule 2 (Mega Graviton, gauge to 0), and the trio test fails until all three are back at 100. In the faithful trio (all start at 100, Delta Attack on Cindy's first turn) the three gauges are zeroed together and refill together at +20 per turn, so the next Delta Attack is Cindy's 7th turn (54 ticks later) unless hits have broken the step. [run, inferred for the sync arithmetic]

### 5.4 How the script branches by battle id (the per-formation reading)

| Formation | Rules live | Start gauges | Cycle of each Sister |
|---|---|---|---|
| `kino00_70`, `kino01_70` (trio) | 1, 2, 3 | 100, 100, 100 | opening: Mindy (basic move), Sandy (basic move), Cindy **Delta Attack**; afterwards five basic turns then Delta Attack (period 6 turns / 54 ticks) while the three stay in step and alive |
| `kino01_71` (Cindy alone) | 2, 3 | 0 | five basic turns (Camisade or 0x412B), Mega Graviton on the 6th, repeat (period 6 / 54 ticks) |
| `kino01_72` (Mindy, Sandy) | 2, 3 | 0, 0 | each Sister alone as above; no interaction |
| `kino05_70` (Sandy alone) | 2, 3 | 0 | five basic turns (Razzia or Attack), Mega Graviton on the 6th |
| `kino05_71` (Mindy alone) | 2, 3 | 0 | five basic turns (Passado or Calamity), Mega Graviton on the 6th |

[run] Hits shorten the first Mega Graviton only when a Sister is hit enough to carry 100 into her fifth turn (five +20 turns already give 100 at the start of the sixth); with +5 per hit, four hits before her fifth turn bring it forward by one turn. [inferred arithmetic]

### 5.5 Targeting, summed up

Single-target moves go to a random living front-line character (uniform, stream 4, one draw only if two or more are alive); Mega Graviton and Delta Attack go to the whole front line. There is no Provoke, Threaten or target memory: all four are immune to Provoke, and no script reads the last attacker. With the player's single aeon out the pick has no draw; with the player's three Sisters out it is a one-in-three pick each time. [bytes] [run]

## 6. The move rows (c)

All fourteen rows are in `monmagic1` (monster magic table 1, 92-byte records; layout [note: re-ffx-commands.md 1, 7]). Formula numbers are those of [note: re-ffx-damage.md 2]: 1 Strength against DEF, 3 Magic against MDF, 4 Magic with MDF ignored, 8 fraction of the target's maximum (`max x power / 16`), 15 MAG cube with no defence. Damage type from the flags (+0x20 bits 0 and 1): physical halves under Protect, magical under Shell, "neither" under neither. **Every row carries accuracy formula 0 (always hits), so any later data row must set `canMiss: false`** (AGENTS.md hard rule 5). Rank 3 everywhere (the record's 0 would also mean 3). Monsters pay no MP. [bytes]

### 6.1 The rows

| Move (id, table row) | Used by | Target / usage bytes (+0x1a, +0x1b) | Type / formula / power / hits | Classes (+0x23) | Crit bonus (+0x27) / shatter (+0x2c) | Statuses (chance), durations | Extra word (+0x54) | Flags | Rank |
|---|---|---|---|---|---|---|---|---|---:|
| Zanmato 0x410A, monmagic1 row 266 | Dark Yojimbo, gauge 100: whole front line | 0x3b, 0x47 | neither / 1 / 250 / 1 | HP | 0 / 100 | none | 0x200 (Auto-Life) | **cleanse**, cap 99,999, always hits, bit 0x40000000 set (unmapped) | 3 |
| Wakizashi (group) 0x4109, monmagic1 row 265 | Dark Yojimbo, 1/3 of ordinary turns: whole front line | 0x3b, 0x47 | physical / 1 / 28 / 1 | HP | 0 / 100 | none | 0 | cap 99,999, always hits | 3 |
| Kozuka 0x4107, monmagic1 row 263 | Dark Yojimbo, 1/3: one random living front-line character | 0x33, 0x47 | physical / 1 / 16 / 1 | HP | 0 / 0 | Power Break 254, Magic Break 254, Armor Break 254, Mental Break 254, Slow 254; durations Slow 254 | 0 | cap 99,999, always hits | 3 |
| Daigoro (order) 0x4086, monmagic1 row 134 | Dark Yojimbo, 1/3: aimed at the dog (actor 21) | 0x33, 0x45 | neither / 0 / 0 / 1 | none | 0 / 0 | none | 0 | always hits | 3 |
| Daigoro (bite) 0x410B, monmagic1 row 267 | the dog, as a reaction to the order: one random living front-line character | 0x33, 0x45 | neither / 1 / 8 / 1 | HP | 0 / 0 | Petrify 254, Poison 254 | 0 | cap 99,999, always hits | 3 |
| Wakizashi (single) 0x4108, monmagic1 row 264 | in Dark Yojimbo's list; no script queues it | 0x33, 0x47 | physical / 1 / 32 / 1 | HP | 0 / 100 | none | 0 | cap 99,999, always hits | 3 |
| Delta Attack 0x4106, monmagic1 row 262 | Cindy, trio rule: whole front line | 0x3b, 0x45 | neither / 15 / 80 / 6 | HP | 0 / 0 | none | 0x200 (Auto-Life) | can crit, crit bonus from gear, **cleanse**, cap 99,999, always hits, bit 0x40000000 set (unmapped) | 3 |
| Mega Graviton 0x4105, monmagic1 row 261 | each Sister, own gauge 100: whole front line | 0x3b, 0x06 | magical / 8 / 7 / 1 | HP | 0 / 0 | Sleep 254, Silence 254, Darkness 254, Slow 254; durations Sleep 99, Silence 99, Darkness 99, Slow 254 | 0x4000 (Doom) | cap 99,999, always hits | 3 |
| Camisade 0x4101, monmagic1 row 257 | Cindy, coin 0: one random living front-line character | 0x33, 0x45 | physical / 4 / 100 / 1 | HP+MP | 0 / 100 | none | 0 | cap 99,999, always hits | 3 |
| "Extra 44" 0x412B, monmagic1 row 299 | Cindy, coin 1: one random living front-line character | 0x33, 0x06 | physical / 1 / 36 / 1 | HP | 0 / 100 | Shell 254, Protect 254, Reflect 254, Nul-Tide 254, Nul-Blaze 254, Nul-Shock 254, Nul-Frost 254, Regen 254, Haste 254; durations Shell 254, Protect 254, Reflect 254, Nul-Tide 254, Nul-Blaze 254, Nul-Shock 254, Nul-Frost 254, Regen 254, Haste 254 | 0x200 (Auto-Life) | can crit, crit bonus from gear, **cleanse**, cap 99,999, always hits | 3 |
| Razzia 0x4100, monmagic1 row 256 | Sandy, coin 0: one | 0x33, 0x45 | physical / 4 / 100 / 1 | HP | 0 / 100 | none | 0x200 (Auto-Life) | **cleanse**, cap 99,999, always hits | 3 |
| Attack 0x4127, monmagic1 row 295 | Sandy, coin 1: one | 0x33, 0x06 | physical / 1 / 36 / 1 | HP | 0 / 100 | Petrify 254 | 0 | can crit, crit bonus from gear, cap 99,999, always hits | 3 |
| Passado 0x4102, monmagic1 row 258 | Mindy, coin 0: one | 0x33, 0x45 | neither / 1 / 4 / 15 | HP | 15 / 100 | Death 254 | 0 | can crit, cap 99,999, always hits | 3 |
| Calamity 0x4104, monmagic1 row 260 | Mindy, coin 1: one | 0x33, 0x45 | neither / 3 / 0 / 1 | none | 0 / 0 | Poison 254, Power Break 254, Magic Break 254, Armor Break 254, Mental Break 254, Silence 254, Darkness 254; durations Silence 254, Darkness 254 | 0x400 (Curse) | cap 99,999, always hits | 3 |

### 6.2 Reading the rows

- **The cleanse flag (`**cleanse**`, +0x20 bit 5).** A record with this bit removes instead of inflicting; its status bytes and extra word then mean "remove this" [note: re-ffx-commands.md 7, "Cleansing"]. So **0x412B ("Extra 44") is a physical attack of power 36 that dispels the target's Shell, Protect, Reflect, the four Nuls, Regen and Haste** (the buff-looking bytes are the list to remove; the feasibility note listed them as inflicted, which the flag reverses) and Auto-Life; **Zanmato, Delta Attack and Razzia remove Auto-Life** from their targets. Whether the removal precedes the death check inside the same hit (so that Auto-Life cannot save the target) was not traced; the ordering in [note: re-ffx-damage.md 3] puts status steps after the damage, which would let Auto-Life trigger on the KO. [bytes] / [unproved]
- **Mega Graviton** has no cleanse flag, so its extra word **inflicts Doom**; it deals `7/16 x the target's maximum HP` (Shell halves it), and inflicts Sleep, Silence and Darkness (duration 99) and Slow (254) at chance 254 against the target's byte. **Calamity** does no damage (power 0) and inflicts Poison, the four Breaks, Silence and Darkness at 254 plus the Curse bit. **Passado** is 15 hits of power 4 with Death at 254 on each hit (the status step sits inside the per-hit pipeline [note: re-ffx-damage.md 3], so it rolls per hit [inferred]), crit bonus 15. **Attack (0x4127)** inflicts Petrify at 254. **Kozuka** inflicts the four Breaks and Slow at 254 (Slow duration 254). **The dog's bite** inflicts Petrify and Poison at 254. Statuses land when the chance 254 exceeds the target's resist byte (a byte of 255 blocks all of them), so a character with the matching proof gear or an aeon with 255 in that slot is immune. [bytes] [note: re-ffx-biran-yenke.md 2 for the byte rule]
- **Camisade is the only row with the MP class**: it deals its (capped) damage to HP and also to MP. [bytes]
- **Shatter byte 100** on Zanmato, both Wakizashi, Camisade, Razzia, Attack, 0x412B and Passado means a hit on an already Petrified target shatters it with certainty [note: re-ffx-commands.md 7.4]; Sandy's Attack petrifies, so a following hit from any of these ends that character. [bytes] [inferred for the chain]
- **Unmapped bits.** Zanmato and Delta Attack set bit 0x40000000 of the +0x1c flag word, which no checked note maps; byte +0x1b (usage) is 0x45 / 0x47 / 0x06 as listed; bytes +0x00 to +0x0f are text offsets. The other unmapped values of each row are in section 6.4. [bytes]

### 6.3 What the numbers mean against a player-side aeon (arithmetic on the formulas; no engine was run)

Reference defenders are the minimum aeon stats of the last tier in the feasibility note (5.5): Yojimbo HP 3,064, DEF 73; Cindy HP 8,410, DEF 94; Sandy HP 6,910, DEF 76; Mindy HP 4,887, DEF 70 (the minima, not what a given save has). Base values before Protect, Shell, Defend, Shield, variance (240 to 271 over 256) and criticals; "cap" is the 99,999 per-hit cap of the row. [inferred arithmetic on [bytes]]

| Move (user stats) | Yojimbo | Cindy | Sandy | Mindy |
|---|---:|---:|---:|---:|
| Zanmato (STR 244, formula 1, power 250) | 3,954,937 (cap) | 3,216,421 (cap) | 3,838,328 (cap) | 4,061,828 (cap) |
| Wakizashi, group (power 28) | 442,953 (cap) | 360,239 (cap) | 429,892 (cap) | 454,924 (cap) |
| Kozuka (power 16) | 253,116 (cap) | 205,851 (cap) | 245,653 (cap) | 259,957 (cap) |
| Daigoro bite (dog STR 244, power 8) | 126,558 (cap) | 102,925 (cap) | 122,826 (cap) | 129,978 (cap) |
| Delta Attack per hit (Cindy MAG 171, formula 15, power 80, six hits) | 781,430 (cap) | same | same | same |
| Camisade (Cindy MAG 171, formula 4, power 100) | 124,325 (cap) | same | same | same |
| Razzia (Sandy MAG 207, formula 4, power 100) | 181,025 (cap) | same | same | same |
| Attack 0x4127 (Sandy STR 186, power 36) | 252,292 (cap) | 205,182 (cap) | 244,854 (cap) | 259,112 (cap) |
| Dispelling attack 0x412B (Cindy STR 175, power 36) | 210,132 (cap) | 170,894 (cap) | 203,935 (cap) | 215,811 (cap) |
| Passado per hit (Mindy STR 148, power 4, 15 hits) | 14,124 | 11,487 | 13,708 | 14,506 |
| Mega Graviton (7/16 of maximum HP) | 1,340 | 3,679 | 3,023 | 2,138 |

Reading: **every damaging move except Passado per hit and Mega Graviton exceeds an aeon's whole HP several times over, before Protect or Shell halves it once**; Passado's first hit already exceeds every one of the four minimum HP figures (Death at 254 on every hit besides). The cap (99,999) is far above any aeon HP the feasibility note lists, and Zanmato, Delta Attack and Razzia also strip Auto-Life. Therefore a mirror chapter that keeps these rows unchanged is decided by who acts first and by whether the player's side ever gets a move; the scaling knobs that exist in the data are the enemy's STR and MAG (the cube makes damage grow with the cube of the stat), HP, the gauge steps, and which formation or tier is used. Nothing here proposes a number.

### 6.4 Where the rows were read, and the fields table 6.1 does not carry

**Source.** [bytes] `ffx_ps2/ffx/master/jppc/battle/kernel/monmagic1.bin`, extracted read-only from `data/FFX_Data.vbf` in the game folder (31,420 bytes, SHA-256 starts 31a83925). The table has rows 0 to 299 of 92 bytes; the row of move id 0x4000 + n starts at file offset 0x14 + 92 n (0x410A is row 266, at 0x5FAC). Read with this lane's VBF reader and kernel-table reader (standard library only, kept outside the repo with the extracted files) and decoded by the lane's row decoder, whose output is table 6.1: it was re-run on 2026-10-18 and its fourteen lines equal table 6.1 character for character. The English copy (`new_uspc/battle/kernel/monmagic1.bin`, 31,060 bytes, SHA-256 starts 50d67377) equals the Japanese-PC copy from +0x10 to +0x5b in all fourteen rows.

This section used to print bytes +0x10 to +0x5b of each of the fourteen rows as hex. They are removed (hard rule 8: no game files in the repo). Everything they proved is table 6.1, which carries every mapped field of every row by the record layout of [note: re-ffx-commands.md 1, 7]. What table 6.1 does not carry follows.

**Unmapped values** (no checked note maps them; given as plain values, no meaning claimed) [bytes]:

| Move (id) | Table row | File offset of the record | 16-bit word at +0x10 | 16-bit word at +0x12 | Byte at +0x15 | Flag word 1 (+0x1c) |
|---|---:|---|---|---|---:|---|
| Zanmato 0x410A | 266 | 0x5FAC | 0x01B2 | 0x01B2 | 3 | 0x40000006 |
| Wakizashi (group) 0x4109 | 265 | 0x5F50 | 0x01B0 | 0x01B0 | 3 | 0x00000006 |
| Kozuka 0x4107 | 263 | 0x5E98 | 0x01AF | 0x01AF | 3 | 0x00000006 |
| Daigoro (order) 0x4086 | 134 | 0x303C | 0x0000 | 0x0000 | 18 | 0x00000006 |
| Daigoro (bite) 0x410B | 267 | 0x6008 | 0x0000 | 0x0000 | 1 | 0x00000006 |
| Wakizashi (single) 0x4108 | 264 | 0x5EF4 | 0x01B0 | 0x01B0 | 3 | 0x00000006 |
| Delta Attack 0x4106 | 262 | 0x5E3C | 0x0203 | 0x0203 | 3 | 0x40000006 |
| Mega Graviton 0x4105 | 261 | 0x5DE0 | 0x0066 | 0x0067 | 3 | 0x00000006 |
| Camisade 0x4101 | 257 | 0x5C70 | 0x0201 | 0x0201 | 3 | 0x00000006 |
| "Extra 44" 0x412B | 299 | 0x6B88 | 0x0000 | 0x0000 | 1 | 0x00000002 |
| Razzia 0x4100 | 256 | 0x5C14 | 0x0200 | 0x0200 | 3 | 0x00000006 |
| Attack 0x4127 | 295 | 0x6A18 | 0x0000 | 0x0000 | 1 | 0x00000002 |
| Passado 0x4102 | 258 | 0x5CCC | 0x0202 | 0x0202 | 3 | 0x00000006 |
| Calamity 0x4104 | 260 | 0x5D84 | 0x0152 | 0x016D | 3 | 0x00000006 |

Bits 1 and 2 of flag word 1 are set in every row except 0x412B and Attack 0x4127 (bit 1 only), and no checked note maps them; bit 0x40000000 is the one table 6.1 names on Zanmato and Delta Attack. **Zero in all fourteen rows** [bytes]: +0x14; +0x16 to +0x19 (so the command type at +0x17 is 0 in every row); +0x1d and +0x1e; +0x21 and +0x22; +0x25 and +0x26; the accuracy byte +0x29; the element byte +0x2d; the status chance bytes +0x2f and +0x36 to +0x39 (no row inflicts Zombie, Confuse, Berserk, Provoke or Threaten); +0x54 (the low byte of the extra word); and +0x56 to +0x5b (no row carries a stage buff or a buff flag).

## 7. Randomness at a glance (for an exact replay) [run]

| Script | Stream 2 (`GetRandomValue`) | Stream 4 (`findMatchingChr`, only with two or more living candidates) |
|---|---|---|
| Dark Yojimbo ordinary turn | 1 draw, modulo 3 | 1 draw on a Kozuka turn |
| Dark Yojimbo Zanmato turn | none | none |
| The dog's bite (reaction) | none | 1 draw |
| Sister, rule 1 (Cindy) / rule 2 | none | none |
| Sister, rule 1 (Sandy, Mindy) / rule 3 | 1 draw, modulo 2 | 1 draw for the single-target move |
| onHit of all five scripts | none | none (the dog: see above) |

The formation scripts' camera functions draw stream 2 too (modulo 3, to pick an angle, in functions bound to engine events that depend on which aeon is on the field; the event numbers and the draw counts per scene were not decoded); those draws shift the stream and are not part of the AI. [bytes] Variance, critical and status draws belong to the damage pipeline [note: re-ffx-damage.md 3; re-ffx-rng-hit.md].

## 8. What is not proved

1. **No script ran in the real engine.** The bytecode ran in the earlier lanes' small interpreter with the real command rows; every behavioural line marked [run] is the script's own. The engine facts around it (the counter gate, the reaction filter, group and target resolution, the opening counters, the tie order) are the earlier lanes' (confidence B in their notes) and were not re-proved here.
2. **`ct_7126`**: settled in section 9 (a pin on an actor's loaded data, not a lock; the matching aeon stays summonable at the gate and in the summon kernel). What remains open there is a play check and the identity of the pinned data (9.6).
3. **Whether Auto-Life survives Zanmato, Delta Attack, Razzia and 0x412B**: the rows carry the cleanse flag with the Auto-Life bit; the order of the cleanse against the death check inside a hit was not traced (section 6.2).
4. **The dog's hit event** while the dog is untargetable (section 4.4): from the Cavern trial's identical chain, not run.
5. **The start of a battle for a player who summons**: how the front line, the opening counters and the start type behave when the player's aeons take the field mid-battle (the chapter's own hand-off) is not covered; section 2.2 gives the figures for a battle whose party starts on the field.
6. **Event conditions**: what sets the quest bit that allows the Dark Yojimbo ladder, why the stage ids alternate, what area (0 or 1) a battle starts in, what room 223 holds after the eight Dark Aeons, and the tail of the `nagi0500` launch function (bits 128 of the progress and quest words) were not traced.
7. **Unmapped fields**, named by offset (no run of unmapped bytes is reproduced): monster record +0x00 to +0x13 (text offsets) and +0x79 to +0x7F (all 0); loot +0x110 and +0x111; the unmapped property 296 (written 300 / 100 / 200 / none); the +0x1c flag bit 0x40000000 on Zanmato and Delta Attack; the +0x1b usage byte (0x45 / 0x47 / 0x06) and the first sixteen bytes of each move row; flag-word bits 0x400, 0x800 and 0x1000 of the battle flag words; the move rows' other unmapped values (+0x10 to +0x13, +0x15, bits 1 and 2 of the +0x1c word) are in section 6.4.
8. **Arithmetic marked [inferred]**: the CTB figures (9 ticks per enemy turn, the player aeon's 24), the timelines of section 2.6, the damage table of section 6.3 (formulas applied by hand to the minimum aeon stats; no criticals, no Protect, Shell, Defend or Shield, variance taken as 1) and the gauge-sync reading in 5.3.
9. **Corrections to the feasibility note, each from bytes or a run, none against its bytes:** the Zanmato turn restarts the gauge at the tier's step, not at 0 (4.2); Kozuka picks a random living front-line character, not the first (section 3); 0x412B dispels (cleanse flag) rather than buffs (6.2); the "further branch" of Cindy's script is a coin between Camisade and 0x412B (5.2); Sandy's and Mindy's later branches are Mega Graviton at 100 and the same coin (5.2); the "counter allowed" test it left open is `isCounterattackAllowed` (section 3); the dog's file is authored for the five Dark Yojimbo battle ids (1.4).
10. Everything tagged [note] is as proved in its own note; none was re-run here.

## 9. `ct_7126`: the Dark Aeon summon rule (2026-10-15)

**Game case: FFX only** (the Dark Aeons exist only in FFX; FFX-2 has no such call and nothing here applies to it). This section settles the question section 2.2 and item 2 of section 8 left open, and **corrects section 2.2**. Research only: no engine, data or AI code was changed.

**Tags in this section.** **[harness]** the game's own machine code of `FFX.exe` (Steam build 25501027, SHA-256 starting 0537B2A1) ran in the Unicorn x86 harness of the parity program, against the real kernel tables; nothing was replaced except where a line says so. **[static]** read from the disassembly of the same executable (no run); a count of readers or callers is a full sweep of the code section by a linear disassembly, so a reader reached only through an unusual addressing form could be missed. **[bytes]** read from the game's formation scripts, all 860 of which were scanned.

### 9.1 The answer

**The game does not forbid anything.** `ct_7126` (script call 0x7126) is **not** a lock on the matching aeon. It sets **one byte to 1, at offset +0x3E, in three actor-slot records of the aeon id it is given** (the character record of that id and two records of the 62-record resource array, at index id and id + 0x1F), and returns the id (it returns 0xFF and writes nothing for -1). The only code that ever reads that byte is the **actor-resource release** (below): while the byte is 1, releasing the actor frees its model but **keeps two handle sets (the records' offsets +4 and +8) loaded**. It is a memory-lifetime pin. It does not touch the summon list, the command gates, the availability flag, the party lists or any other aeon. **In all eleven formations of this note the player's matching aeon (and Grand Summon) stay usable at the game's usability gate** [harness]. Evidence: **proved** for what the call does and for the gates (harness run, 9.3); **strongly indicated** for "the aeon can be summoned in play", because the game was not run and the Summon menu's list builder (UI code) was not run (its answer was an input), though nothing it could read is changed (9.2). Why the pin exists is **inferred** (9.4).

### 9.2 What was read [static], and the correction to section 2.2

- **The handler.** The exe's own static call table (group 7, 16 bytes per call: start, poll, float handler, integer handler) holds the integer handler for call 0x7126 at **VA 0x7A8550**. It pops one integer (the aeon id; a negative value returns 0xFF at once), takes the record that the actor accessor 0x794020 returns for that id (ids 0 to 0x1E: the 0xF90-byte character record), then the two records the accessor 0x795B10 returns for (id, 0) and (id, 1) (the resource array at index id and id + 0x1F, 0x390 bytes each), writes 1 at +0x3E of all three, and returns the id.
- **Correction.** The handler chain named in section 2.2 (VA 0x7A5260 and the setter chain behind it) is **not this call's**. 0x7A5260 lies inside the function at 0x7A5240, which is the handler of the **neighbouring call 0x7127** (two arguments; it appears once in the whole corpus, in one other formation). The earlier read followed the wrong table slot. That chain was not re-read here and nothing in this section depends on it. The formation scripts do call 0x7126: a byte scan of all 860 formation scripts finds the call (operand bytes 0x26 0x71 after the call opcode) at **23 sites in 18 scripts, every one with an aeon id from 8 to 17**: once per Dark Aeon present (`nagi05_70` to `_74` pass 14; `kino00_70` and `kino01_70` pass 16, 15, 17; `kino01_71` 15; `kino01_72` 16 and 17; `kino05_70` 16; `kino05_71` 17), and in the seven other Dark Aeon formations with their own id (`bsil07_70` 8, `bika03_70` 9, `kami03_70` and `kami03_71` 10, `mcyt00_70` 11, `dome06_70` 12, `mtgz01_70` 13). [bytes]
- **The only readers of the byte.** A sweep of the code section for every byte read at offset +0x3E finds **four in the battle-record code, in two functions**: the release of an actor's loaded data for the character record (0x796DC0, reached from the actor release 0x793410) and the same test for the resource records (0x7AD750). Both do the same thing: before releasing the handle at +8 (and, separately, the handle at +4) they skip it when the byte is non-zero. The seven other byte reads at +0x3E in the executable sit in functions that fetch no battle record and touch neither record array. So nothing else reads it: not the command gate, the availability test, the summon or arrival code, the party lists or the Overdrive code. [static]
- **When that release runs.** The actor release 0x793410 is reached from the **dismissal of an aeon** (the dismiss function 0x7AEF20 calls the actor remover 0x7AE0A0, which asks for the full release) and from one case of the battle state machine (a hide-and-release step). So the pin matters exactly when an aeon that was summoned is dismissed or wiped. [static]
- **It lasts the battle only.** Battle setup (0x7814BC, through 0x793530) allocates and zero-fills the character and resource arrays; the end-of-battle teardown (0x793480, from 0x7815F5) first frees the model handles, then writes 0 into +0x3E of every slot and only then releases the +4 and +8 handle sets, and then the arrays are freed. [static] So the byte is 0 when a battle starts, is set by the formation script, and is cleared at the end before it could protect anything; it is never saved.
- **How the game does forbid an aeon.** The availability flag at Chr+0xDD4 is the only thing that makes an aeon's list entry unusable besides death, the "left the battle" byte and the recovery byte (the class-0 gate of FFX-G07, 0x79A080 and 0x79A5B0). The script call that sets it is **0x7A6EF0 (script call 0x703B, labelled setCommandDisabled)**, called with the owner (Yuna, 1), the aeon id and the flag **0**. A scan of all 860 formation scripts finds it used with an aeon id (below 0x1000) in **14 scripts, 16 call sites**: `lmyt01_00` to `_07` (one aeon each: 8, 9, 10, 11, 12, 14, 13, and the Sisters' script with 16, 15, 17), `bvyt09_10` to `_12` (9, 8, 12, which are the Isaaru lane's "Ifrit against Fist, Valefor against Wing, Bahamut against Sword" [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 4.1]), `genk00_40` (10), `mihn00_60` (9) and `nagi00_40` (11). **None of the eleven formations of this note, none of the other seven Dark Aeon formations, and none of the monster scripts m340 to m343 calls it.** So the game has a "no matching aeon" mechanism and the Dark Aeon fights do not use it. [bytes] / [static]

### 9.3 What was run [harness]

All runs use the real handler 0x7A8550 (called with the script-stack layout the call dispatcher gives it), the real menu-side gate 0x89ACA0 (Yuna, command or aeon id), the disabled test 0x79A5B0, the availability test 0x79A080 and the real kernel tables. The sub-menu list counter 0x89B5A0 (UI) is an input (5 entries), as in the earlier gate runs. Yuna is set with full Overdrive and plenty of MP so that no other gate refuses.

| Check | Vectors | Result |
|---|---|---|
| **Which bytes change.** Call the handler for every actor id 0 to 0x1E and for -1, from a zeroed world, diff the whole 31-record character array and the 62-record resource array | 32 | Exactly three bytes change per id, **+0x3E from 0 to 1** in the character record of the id and in resource records id and id + 0x1F; nothing else; -1 returns 0xFF and changes nothing. The return value is the id. Calling it twice, or in another order (16, 15, 17 against 17, 16, 15, 15), gives the same memory |
| **Gate before and after.** For each of the ten aeon ids 8 to 17 (Valefor to Mindy) in three states (ready; knocked out; disabled through the game's own routine 0x79B470 with flag 0), the six gate answers (the aeon's own list entry through 0x89ACA0, the disabled test, the availability test, Summon 0x3117, Grand Summon 0x3118, the Sisters' command 0x30FF), taken once before and again after each of **28 triggers**: each aeon id 8 to 17 alone, six controls (ids 0, 1, 7, 0x14, 0x1E, -1) and **the twelve real call sequences** of the Dark Aeon formations (14; 16, 15, 17; 15; 16 and 17; 16; 17; and the six single-aeon formations) | 30 baselines + 840 after-runs | **0 differences.** Ready: the aeon's own entry answers 255 (go), the test answers 0 (usable); knocked out or disabled: -1 and 1 (refused). The refused states are the **positive control**: the check does see a lock, and ct_7126 never produces one, not for the matching aeon, not for any other, not for Summon, Grand Summon or the Sisters' command |
| **The game's own lock, through its script handler.** Call 0x7A6EF0 with (1, aeon id, 0) for each aeon 8 to 17 (the owner lookup and the selector-to-mask helper are replaced by hooks that return the owner byte 1 and Yuna's mask bit) | 10 | The availability flag becomes 0 and the gate answer goes from 255 to -1 in all ten: **a lock is refused at the usability gate** (the disabled code -1, the same any disabled command takes) |
| **What the pin does.** Run the actor release (0x793410) with flags 7 (what a dismissal asks for) and 0xC (what the state-machine case asks for) on aeon ids 14, 15, 16, 17 and 9, with the model-free and handle-release helpers replaced by recorders, once with the byte 0 and once with it 1 | 20 | Byte 0: the model is freed (hidden with 0xC) and the **+8 handle is released, and with 7 the +4 handle too**, for the character record and both resource records. Byte 1: the model is still freed (or hidden) and **no handle is released**, for all three records |
| **The summon kernel, pinned and not.** The G08 party generator (summon, arrival, dismissal, wipe, restore, swap; same seed, same worlds) run twice: once as is, once after calling the real handler for one to four aeon ids per world, always including the aeon being summoned or swapped in | 3,000 worlds each way; 1,879 summon or swap in an aeon that is in the pinned set | **0 differences** in every modelled output (the four party lists, the globals, the in-battle bytes, the arrival flag, counters, gauges) and **0 differences** in a hash of the whole 31-record character array taken after every operation (the +0x3E bytes masked) |

### 9.4 The questions, answered

- **Which aeons does it block?** None. It blocks no aeon, summon, Grand Summon or command. [harness] The mirror-lock mechanism exists (9.2) and these formations do not call it.
- **Hides, greys or refuses?** It does none of them. (The game's real lock, by contrast, is refused at the usability gate with the disabled code -1; whether the menu then draws the entry grey or leaves it out is UI code that was not run.) [harness]
- **Battle only?** Yes: the byte is zeroed at battle setup and by the teardown loop at the end, and is saved nowhere. [static]
- **Does it touch Grand Summon or the other aeons?** It touches only the three records of the id it is given; the other aeons' records, the Sisters' command (which checks all three Sisters) and Grand Summon are unchanged in all 840 runs. In the Sisters' formations it is called once per Dark Sister present, each call independent. [harness]
- **Why does the game pin the matching aeon?** **[inferred]:** a Dark Aeon is a recoloured copy of the player's aeon (its model and animation families match), so the formation protects the player's own aeon's loaded data from being released when that aeon is dismissed or wiped while its dark twin is still on the field. That only makes sense if the matching aeon **can** be summoned and dismissed in the battle. The pin's presence is therefore weak evidence for "summonable", on top of the proved facts above.

### 9.5 What this means for a mirror chapter (for the driver)

1. **Section 2.2's "departure" does not exist.** The game's Dark Aeon fights do not bar the matching aeon at the gate; a chapter that lets the player's own Yojimbo or Sisters fight Dark Yojimbo or the Dark Sisters is not departing from a rule of the game on this point.
2. **If the chapter wants the matching aeon barred** (a design choice, for balance or fiction), the faithful way is the game's own lock: the aeon's availability flag set to 0 for Yuna, as the trial and Isaaru formations do (9.2). That would be an addition, not the Dark Aeons' rule. It needs a yes (AGENTS.md rule 10).
3. **The call has no counterpart in a web build** that does not manage loaded model data: it can be ignored. Nothing about damage, hit rolls, counters or the AI depends on it.

### 9.6 What is still open

- **Play check.** The game was not run, so "the matching aeon can be summoned against its dark twin" is proved at the gate and in the summon kernel, not seen on screen. The Summon sub-menu's list is built by UI code that was not run; the list's source and the aeon-list entry codes follow the earlier gate notes.
- **The data behind the two handles** (offsets +4 and +8 of a slot record) was not decoded; "shared model or animation data of the dark twin" is the reading that fits the release order and the call sites, not a decoded fact.
- **Whether a monster slot's records carry the same layout** (the Dark Aeons' own records live at ids 0x14 and up) was not needed: the call is never given those ids.
