# FFX Biran Ronso and Yenke Ronso (Kimahri's solo trial on Mt. Gagazet): records, formation, party rules and AI read from the game's own files

**Game case: FFX only.** The fight, both monsters and the Ronso Rages exist only in FFX (FFX-2 has no Biran or Yenke); nothing here applies to FFX-2. Part of the `re-parity` track. Drafted 2026-10-14. Records only: no engine, data or AI code was changed.

**Source and tags.** Every statement is tagged:

- **[bytes]** read from the game's own file by a script of this lane (FFX_Data.vbf of the Steam build 25501027, files extracted read-only and kept outside the repo). **[bytes: exe]** the same, read from the executable FFX.exe (disassembled from its bytes, never run).
- **[note: X section]** taken from a checked note: a note in this repo (`research/...`) or one of the private coverage notes kept outside the repo (FFX-G09 Ronso learning, FFX-G10 end of battle and hand-off, FFX-H02 monster, loot and formation layouts).
- **[inferred]** not read directly. Fields no note maps are given raw and never guessed (AGENTS.md hard rule 6).

Files used (size, SHA-256 prefix): monster files `m134` Biran Ronso (26,504 bytes, aa5023a6) and `m135` Yenke Ronso (33,156 bytes, 8cde1bda); formation `mtgz01_10` (8,016 bytes, 251aca34); the field event of the first Gagazet map `mtgz0000` (135,104 bytes, c260e6b4); kernel tables `command.bin` (88e6a63a), `monmagic1.bin` (31a83925), `monmagic2.bin` (455be7f0), `btl.bin` (c4e27912). Move and item names are the English names of the game's own tables (the US text copy of the same rows). No script text, decompiled code or game dialogue is reproduced; the dialogue scenes are described only by what they do to the battle.

## 0. The one-screen summary

- **Ids.** Biran Ronso is monster file m134 (battle actor 20), Yenke Ronso m135 (actor 21), Kimahri is actor 3. They fight together in formation `mtgz01_10`, battle id 0x01E6000A (area key 486 `mtgz01`, formation 10), launched by the field event of the first Gagazet map. Formation 10 is listed in the area table with weight 0, so it is never rolled as a random encounter. [bytes]
- **The record numbers are placeholders for six stats.** Both records read HP 9,999, MP 200, STR 25, DEF 30, MAG 30, MDF 10, AGI 32, LCK 15, EVA 0, ACC 100. But the formation's opening scene overwrites **max HP/HP, STR, MAG, AGI and MDF** from **Kimahri's own STR, MAG, AGI and current HP** (section 3). Biran gets 8 units and Yenke 6 units of a Kimahri-derived HP figure; the two Ronso's STR and MAG come from a table indexed by Kimahri's current HP. DEF 30, LCK 15, EVA 0, ACC 100 and MP 200 stay as in the record. [bytes]
- **The two records are identical** except for one status byte (Biran can be Berserked, Yenke is immune), the forced action word (Biran: Bulldoze, Yenke: none) and the monster index / model word. No elemental affinity, no automatic status. Immune to Death, Zombie, Petrify, Poison, Confuse, Provoke, Sleep, Silence, Darkness, Reflect, Slow; the four Breaks, Shell, Protect, the four Nuls, Regen and Haste all land. Immune to Life, CTB damage, Slice and Bribe; Eject and Auto-Life extra immunities. [bytes]
- **Rewards (each Ronso, on its own death):** 1,500 gil, 4,500 AP (6,750 on an overkill, threshold 2,500), a Return Sphere (1/8 of the time a Friend Sphere instead; 2 on an overkill), always a gear drop (chance byte 255); steal: Lv. 3 Key Sphere x1 (rare x2); Bribe is blocked. [bytes]
- **Party rule.** The field event empties the party, removes all eight members and adds only Kimahri before launching the battle, then restores the stored party afterwards; the formation script disables Escape, Flee and Switch for Kimahri. A defeat is a game over (flag word 0x20401, bit 9 clear). [bytes]
- **Turn cycles (AI).** Biran: Thunder, Bulldoze, Blizzard, Bulldoze, repeating, all aimed at Kimahri. Yenke: Fire Breath, Aqua Breath, Bulldoze, repeating. Each Bulldoze swaps the brother to the other side of the arena. Nothing is random in the cycles. [bytes]
- **Reactions.** (a) Below half max HP while the brother lives, a Ronso uses its own Ronso Rage on its next turn (Biran: Mighty Guard, Yenke: White Wind), on both brothers when they stand on the same side, otherwise on itself. (b) When a brother dies the survivor gets stronger: Biran STR x5/4 (integer) and Berserk; Yenke MAG x5/4, Haste and AGI set to Kimahri's AGI minus 4. (c) A physical hit by Kimahri's plain Attack on one brother raises the other's DEF to 254 and gives it Sentinel until that other brother is next hit (section 5.6 has the quirk that limits which commands trigger it). (d) Lancet on a Ronso offers one Ronso Rage to learn, chosen by priority (section 7). [bytes]
- **Ronso Rages.** Biran: Mighty Guard (only after his half-HP Mighty Guard), Thrust Kick, Self-Destruct, Doom. Yenke: White Wind (only after his half-HP White Wind), Fire Breath, Aqua Breath, Stone Breath. One per Lancet, never one Kimahri already knows. [bytes]

## 1. Where the pieces are

| Piece | Identifier | Tag |
|---|---|---|
| Biran Ronso | monster file m134 (kernel monster row 134), formation slot 0 = battle actor 20, monster word 0x1086 | [bytes] |
| Yenke Ronso | monster file m135 (row 135), formation slot 1 = battle actor 21, monster word 0x1087 | [bytes] |
| Formation | `mtgz01_10`; battle id = (area key 486 << 16) or formation number 10 = 0x01E6000A | [bytes], id rule [note: FFX-G10 3.8] |
| Launching event | field event of the first Gagazet map (`mtgz0000`); one `launchBattle` with that id, preceded by `SetBattleFlags(0x20401, 0, 0)` and a party reset | [bytes] |
| Debug formations | `zzzz00_134` and `zzzz00_135` hold one Ronso each (unused by the story) | [bytes] |
| Monster record | monster file chunk 2 (0x80 bytes, byte-identical from 0x14 to 0x7F to the kernel row and to the English copy in chunk 6) | [bytes] |
| Loot record | monster file chunk 4 (0x118 bytes plus a text tail) | [bytes], layout [note: FFX-H02 3.4] |
| AI program | monster file chunk 0 (one worker), bound to the engine events by chunk 1 | [bytes] |

Both brothers have no level field: FFX monster records carry no level (the "Zanmato byte" +0x112 is 3 in both, which the engine reads as level 4 for Zanmato; it matters only for that command). [bytes]

## 2. The monster records (a)

Identical in both unless a column says otherwise. Offsets are record offsets (0x14 to 0x7F is the kernel row).

| Field | Biran Ronso (m134) | Yenke Ronso (m135) | Tag |
|---|---|---|---|
| HP / MP / overkill threshold | 9,999 / 200 / 2,500 (HP overwritten at battle start, section 3) | same | [bytes] |
| STR / DEF / MAG / MDF | 25 / 30 / 30 / 10 (STR, MAG, MDF overwritten, section 3) | same | [bytes] |
| AGI / LCK / EVA / ACC | 32 (overwritten) / 15 / 0 / 100 | same | [bytes] |
| Flags +0x28, +0x29 | 0x04 Immune to Life; 0x07 immune to CTB damage, Slice and Bribe | same | [bytes] |
| Poison damage byte (+0x2A) | 10 | same | [bytes] |
| Elemental absorb / immune / resist / weak (+0x2B to +0x2E) | none / none / none / none | same | [bytes] |
| Automatic statuses (permanent, temporary, extra) | none, none, none | same | [bytes] |
| Extra-status immunities (+0x4E) | Eject, Auto-Life (0x0300) | same | [bytes] |
| Doom counter (+0x77) / CTB icon (+0x76) | 20 / 22 | same | [bytes] |
| Forced action (+0x70) | 0x60A5 Bulldoze | none | [bytes] |
| Berserk byte (+0x38) | 0 (lands) | **255 (immune)** | [bytes] |
| Command list (+0x50) | Fire Breath 0x60A2, Aqua Breath 0x60A3, White Wind 0x60A1, Mighty Guard 0x60A4, Bulldoze 0x60A5 | same | [bytes] |
| Unmapped | +0x00 to +0x13 (text offsets: 00 00 5e 00 08 00 e1 00 1a 00 33 00 1f 00 then 9b 04 8f 00 33 00 / a7 04 90 00 33 00), +0x78 = 0xFF, +0x79 to +0x7F zero | | [bytes] |

**Status bytes** (255 immune; otherwise the move's chance minus the byte; Threaten's byte is a success percentage, so a byte of 0 means it can never land [note: re-ffx-ai-gui.md 3.2]). Both: immune (255) to Death, Zombie, Petrify, Poison, Confuse, Provoke, Sleep, Silence, Darkness, Reflect, Slow. Byte 0 (lands) for Power Break, Magic Break, Armor Break, Mental Break, Shell, Protect, Nul Tide, Nul Blaze, Nul Shock, Nul Frost, Regen, Haste. Threaten 0 (cannot land). Berserk: Biran 0, Yenke 255. [bytes]

**Loot record** (identical bytes 0 to 0x117 in both) [bytes], layout [note: FFX-H02 3.4, 3.5]:

| Field | Value |
|---|---|
| Gil / AP / AP on overkill | 1,500 / 4,500 / 6,750 |
| Learned-move word (+6) | 0 in the file (both scripts write it at run time, section 7) |
| Item chance bytes (slot 1 / slot 2) | 255 / 0 |
| Normal drop, slot 1 | common Return Sphere x1, rare Friend Sphere x1 (rare when the second draw's low byte is below 0x20: 1 in 8) |
| Overkill drop, slot 1 | Return Sphere x2, Friend Sphere x2 |
| Steal (chance byte 255) | common Lv. 3 Key Sphere x1, rare Lv. 3 Key Sphere x2 (the game halves a stolen quantity the first time and counts steals; see the note) |
| Bribe | immune (flag +0x29 bit 2); the record's Bribe item is Potion, factor 1 |
| Gear drop | chance byte 255; base slot count 12, formula 1, critical bonus 3, power 16, extra-ability tries 13; weapon rows start with Piercing for Auron and Kimahri (rows 4 and 6, pool Piercing only), the other weapon rows pool Piercing; armour rows pool "MP +20%" |
| +0x110, +0x111 (unmapped) | 120, 128 |
| Pilfer / Nab Gil factor (+0x113) | 5 |
| Monster Arena price (+0x114) | 2,250 |

Rewards are rolled once per dead monster that has a loot record, so each brother pays separately [note: FFX-H02 3.5]. A chance byte of 255 always passes its `draw % 255 < byte` test [note: FFX-H02 3.5] [inferred arithmetic].

## 3. What the fight does to the numbers at the start (the formation's opening scene)

The formation script's opening scene (worker 4, function 2: the two brothers' opening lines, then the stat setup, then the battle clock starts) overwrites the Ronso's stats from Kimahri's. [bytes] All arithmetic is integer, truncating [inferred, as in the earlier AI lanes]. "STR", "MAG", "AGI", "HP" below are Kimahri's current battle values read by the script (properties 9, 11, 13, 0).

1. `A = STR^3`, `B = MAG^3`, `C = ((A + B) / 2) * 16 / 15`, `U = ((C / 32) + 30) * 586 / 730`.
2. **Biran max HP and HP := 8 x U. Yenke max HP and HP := 6 x U.**
3. `k = (Kimahri HP - 644) / 200` when Kimahri's HP is above 644, else 0. A table by k sets **Biran STR** and **Yenke MAG**; k of 11 or more uses the last row:

| k | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11+ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Biran STR | 11 | 12 | 13 | 15 | 17 | 19 | 21 | 22 | 23 | 24 | 25 | 27 |
| Yenke MAG | 8 | 8 | 9 | 10 | 12 | 14 | 16 | 17 | 19 | 20 | 21 | 22 |

4. Then **Biran MAG := Yenke MAG / 2**, **Yenke STR := Biran STR / 2**, **Biran AGI := Kimahri AGI - 4**, **Yenke AGI := Kimahri AGI - 8**, both **MDF := 50**.

Worked examples of the HP rule (computed from the formula above, [inferred] arithmetic on [bytes] constants): Kimahri STR/MAG 30/20 gives U 492 (Biran 3,936 HP, Yenke 2,952); 40/20 gives U 987 (7,896 / 5,922); 50/25 gives U 1,904 (15,232 / 11,424); 60/30 gives U 3,275 (26,200 / 19,650). The HP and stat figures therefore move with Kimahri's build; any fixed HP for the fight is only valid for the Kimahri it was measured with. Whether the property writes are clamped (maximum HP caps) was not traced. [unproved]

Because the STR table starts low, the later "x5/4" rule (section 5.4) is `floor(STR / 4) * 5`, which lowers STR 11 to 10 and leaves 15 unchanged; it raises 17 to 20, 27 to 30. [bytes]

## 4. The formation, the positions and the party rules (b, c)

**Formation file `mtgz01_10`** [bytes], layout [note: FFX-H02 3.7]:

- Formation block (28 bytes): common-voice-lines flag 0, byte 1 = 0, foot-sound data id 0x0B (11), in-water flag 0, monster words 0x1086 (slot 0 = actor 20 = Biran) and 0x1087 (slot 1 = actor 21 = Yenke), the other six empty.
- Start rules from the script: `SetAmbushState(Normal)` (a normal start, no pre-emptive or ambush), random positions off (`btlSetRandPosFlag(0)`), and four actor-light presets. The formation init also sets Kimahri's facing to 90 degrees.
- The script disables **Escape (0x3003), Flee (0x3018) and Switch (0x3002) for actor 3**. [bytes]
- When the battle-end type reads 3 the formation ends the battle as a defeat. What produces end type 3 (result 4 in [note: FFX-G10 3.5]) was not traced. [bytes] / [unproved]

**Start positions** (the formation's position table, chunk 3, two areas; each position is four floats x, y, z, w) [bytes]:

| | Kimahri (3 party entries) | Biran | Yenke |
|---|---|---|---|
| Area 0 | (0, 0, 0, 0) for all three party entries | (20, 0, 80, 0) | (-20, 0, 80, 0) |
| Area 1 | (0, 0, 0, 0) | (-20, 0, -80, 0) | (20, 0, -80, 0) |

Both areas also list one aeon position (0.123, 0, -50.463) and extra vectors (-1.208, 0, 68.586) and (-3.808, 0, -70.755), plus a "final position" (68.1, 6.679, 1.235, 6.679), none of which this fight reads (aeons cannot be summoned here, the party being Kimahri). Both brothers stand on the same side at the start (area 0) [inferred: area 0 is the default value of the actor's Area property and the scripts treat Area 0 as the side Kimahri faces 90 degrees toward]. A brother changes side only through the scripted `AreaToMoveTo` writes that come with Bulldoze (section 5.3) and the Berserk side swap. The battlefield (stage) id listed for area key 486 is 1068; which zone's stage a scripted launch uses was not traced. [unproved]

**Party rules (c)** [bytes: field event]: before the launch the event stores the party setup, empties party slots 0 to 2, removes all eight members (Tidus, Yuna, Wakka, Kimahri, Lulu, Auron, Rikku, Seymour), adds Kimahri and places him in slot 0, disables player control, then runs `SetBattleFlags(0x20401, 0, 0)` and `launchBattle(0x01E6000A)` with the Screen Shatter transition. Afterwards it restores the stored party, requests the results menu (0x40011100) and continues. **Kimahri fights alone; there is no reserve; Escape, Flee and Switch are off.**

Flag word 0x20401 [note: FFX-G10 3.6]: low byte 1 means a scripted battle with no results panel at the hand-off (the event's own menu request supplies it); bit 9 (0x200) is clear, so **a defeat is a game over**; bit 8 (0x100) clear, so the victory pose and fanfare play; bit 16 (0x10000) clear, so the formation's end-scene hooks run. Bits 0x400 and 0x20000 are not decoded in any note. [unproved]

Note on party Chr records: the battle set-up initialises every party and aeon slot 0 to 17 from the save data, not only Kimahri's [bytes: exe, the set-up loop at 0x79C110]. This is why a script read of Tidus's maximum HP is non-zero even though he is not in the fight (used in section 5.6).

## 5. The AI scripts (d)

*The decoded AI follows in the next commit of this branch (record, formation, party and move rows above are final).*

## 6. The move rows the two scripts use (d)

Columns: the command id and table; target; damage type (the record's damage flag bits 0 and 1: 1 physical, 2 magical, 0 neither); formula (the numbered formulas of [note: re-ffx-damage.md]: 1 Strength vs DEF, 3 Magic vs MDF, 7 Healing, 15 MAG cube with no defence, 16 user max HP); power; element; hits; accuracy formula 0 = always hits [note: re-ffx-commands.md]; statuses (chance / duration byte); rank (the CTB cost class, [note: re-ffx-commands.md 7]); Overdrive cost. All rows are [bytes]; monsters pay no MP, so MP costs are moot [note: re-ffx-ai-seymour.md 1.2].

| Move (id) | Used by | Target | Type / formula / power | Element | Statuses and notes | Rank | OD cost |
|---|---|---|---|---|---|---:|---:|
| Thunder (0x3043, command row 67) | Biran, turn 1 of 4 | 1 enemy, long range | magical / 3 / 12 | Thunder | reflectable, pierces Armored | 3 | 0 |
| Blizzard (0x3041, row 65) | Biran, turn 3 of 4 | 1 enemy, long range | magical / 3 / 12 | Ice | reflectable, pierces Armored | 3 | 0 |
| Bulldoze (0x60A5, monster-magic-2 row 165) | both, side swap | 1 enemy | physical / 1 / 16, can crit | none | accuracy formula 0 (always hits); Biran's forced action when Berserk | 3 | 0 |
| Fire Breath (0x60A2, mm2 row 162) | Yenke, turn 1 of 3 | 1 enemy | neither / 3 / 16 | Fire | accuracy formula 0 | 3 | 0 |
| Aqua Breath (0x60A3, mm2 row 163) | Yenke, turn 2 of 3 | 1 enemy | neither / 3 / 16 | Water | accuracy formula 0 | 3 | 0 |
| Mighty Guard (0x3072, command row 114; Kimahri's Rage row) | Biran, half HP | party-side group | neither / 3 / 0 | none | Shell 254/254, Protect 254/254 (until removed), Nul Tide, Blaze, Shock, Frost 254 chance with duration 1 (one charge each) | 4 | 100 |
| White Wind (0x3070, command row 112; Kimahri's Rage row) | Yenke, half HP | party-side group | neither / 7 / 40, heals | none | pierces Armored | 3 | 100 |
| Haste (0x3036, command row 54) | Yenke, after Biran dies, on itself | 1 target, either side | magical / 13 / 8, heals flag | none | Haste 254/254 (until removed) | 4 | 0 |
| Berserk (0x400F, monster-magic-1 row 15) | Biran, after Yenke dies, on itself | 1 enemy-side or self | magical flag / 0 / 0 | none | Berserk chance 120, no duration byte; Biran's Berserk byte is 0, so it lands | 3 | 0 |
| Lancet (0x3020, command row 32) | Kimahri's tool, not theirs | 1 enemy, long range | neither / 3 / 6, drains | none | classes HP and MP; the learn trigger (section 7) | 2 | 0 |

Unlisted monster-side rows for the unused record commands: White Wind (0x60A1, mm2 row 161: neither / 3 / 80, heals, 1 target either side) and Mighty Guard (0x60A4, mm2 row 164: Shell and Protect 255 chance and 255 duration, neither / 3 / 0, rank 3). **The scripts never queue 0x60A1 or 0x60A4**: the half-HP actions use Kimahri's own Rage rows 0x3072 and 0x3070 (with the Overdrive gauge forced to 100 first to pay their cost). [bytes]

Because Thunder, Blizzard, Haste, Berserk and the two Rage rows are not in either record's command list, the scripts queue commands outside the list; the earlier AI lanes found the same for other bosses (Thunder and Demi on Gui's body) [note: re-ffx-ai-gui.md 3.1]. Whether a brother's Silence matters: both are immune. [bytes] / [inferred]

## 7. The Ronso Rages Kimahri can learn from each brother

How learning works [note: FFX-G09 1, 3.3, 3.4]: Kimahri learns a Rage only when he uses **Lancet (0x3020)** on a monster whose loot record's learned-move word (+6) is non-zero and he does not know it yet. The brothers' files carry 0 there, but each script **writes the word in its own targeted hook whenever the command used on it is Lancet**, choosing the first Rage in a fixed list that Kimahri does not know yet. Learning a Rage fills Kimahri's Overdrive gauge to its maximum. One Lancet learns at most one Rage. If everything on the offered list is known, nothing is written and nothing is learned. [bytes] script; [note: FFX-G09] engine.

| Order | Biran Ronso offers | Row (Kimahri's command row) | Yenke Ronso offers | Row |
|---:|---|---|---|---|
| 1 | Mighty Guard 0x3072, **only after Biran has queued his own half-HP Mighty Guard** | 114: party group, Shell + Protect + four Nul charges, rank 4 | White Wind 0x3070, **only after Yenke has queued his own half-HP White Wind** | 112: party group, Healing formula 7, power 40, rank 3 |
| 2 | Thrust Kick 0x306C | 108: 1 enemy, Strength formula 1, power 33, can crit, rank 3 | Fire Breath 0x3069 | 105: all enemies, formula 15 (MAG cube), power 24, Fire, rank 3 |
| 3 | Self-Destruct 0x306B | 107: 1 enemy, formula 16 (user max HP, power 30), rank 3 | Aqua Breath 0x306E | 110: all enemies, formula 15, power 26, Water, rank 3 |
| 4 | Doom 0x306F | 111: 1 enemy, Doom flag (extra word 0x4000), rank 3 | Stone Breath 0x306D | 109: all enemies, formula 1, power 0, Petrify chance 254, rank 3 |

All eight rows are Overdrive-class (command type 4) with an Overdrive cost of 100. [bytes]

Consequences, all from the scripts' own gates [bytes]:

- The "gate" is a private flag (v15 in both scripts) set to 255 at the moment the brother **queues** his half-HP action, not when it resolves. Before that, Mighty Guard / White Wind is skipped and the list starts at Thrust Kick / Fire Breath.
- The half-HP action only happens if the **brother is still alive** when the Ronso first drops below half (section 5.2). If the brother dies first, the pending half-HP flag is overwritten and the Rage is **never offered**. To learn Mighty Guard the player must get Biran below half max HP while Yenke lives, wait for Biran's next turn, and Lancet him afterwards; White Wind mirrors this for Yenke.
- Biran's script also writes 0 to the learned-move word at the start of its event-7 function (section 5.1); Yenke's does not. Either way the value is rewritten on every Lancet. [bytes]
- Each Rage a brother can offer is also on other fiends' lists [note: FFX-G09 4.1] (for example Dark Flan and Spirit teach White Wind through their own files).
