# FFX the possession chain for "The Last Summoning" (hidden chapter 28): menu, battles, rows and Zanmato rules from the game's own files

**Game case: FFX only.** The chain of possessed aeons after Braska's Final Aeon exists only in FFX (the HD Remaster carries it); FFX-2 has nothing like it and nothing here applies to it. Part of the `re-parity` track, written for the release driver who builds the hidden chapter "The Last Summoning" (a variant of Dream's End in which Yu Yevon possesses the player's aeons one at a time in the order the player picks; Chapter III itself stays unchanged). Drafted 2026-10-15. Research only: no engine, data, AI or test file was changed.

**Source and tags.** Every statement is tagged:

- **[bytes]** read from the game's own file by a script of this lane (FFX_Data.vbf of the Steam build 25501027, read-only; the files used were compared by SHA-256 prefix with the VBF itself for the two possession formations and two kernel tables). A script's behaviour read from its disassembly is also [bytes]; no hook was run.
- **[static]** read from the disassembly of `FFX.exe` of the same build (SHA-256 starting 0537B2A1) by a linear disassembler; no code was run in this lane. A count of "readers" or "callers" is a sweep of the code section and can miss a caller reached through a pointer table.
- **[note: X]** taken from a checked note: this repo's `research/re-ffx-ai-yunalesca-bfa.md` (section 5, the chain), `research/re-ffx-yojimbo-sisters-feasibility.md` (section 6), `research/re-ffx-dark-aeons.md` (section 9, the lock call), `research/re-ffx-overdrive-steal-aeons.md`, `research/re-ffx-damage.md`, `research/re-ffx-ctb-status.md`, and the private coverage notes FFX-G07 (usability gate), FFX-G08 (aeon-side logic) and FFX-H02 (record layouts).
- **[inferred]** not read directly. **[unproved]** named in section 9.

No script text, decompiled code or game dialogue is reproduced. Scripted lines are described by what they do. Move names are the English names of the game's own tables; the in-game captions of the "possessed" actions are not quoted.

## 0. The answers in one screen

1. **The menu** (field event `sins0700`, worker 26): it reads which of the aeons 8 to 15 Yuna holds (Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, and Cindy as the single entry of the Magus Sisters), lists them in ascending id order as a message window at the top left, lets the player choose **any** of the remaining ones, removes the chosen aeon from the party (for the Sisters also Sandy and Mindy), launches that aeon's possession battle, then reads the set again. No default order is coded. An aeon Yuna does not hold has no entry and no link; with none the event goes straight to Yu Yevon. **Nothing restores HP, MP or statuses between links.** (section 2)
2. **Summons while the chain runs**: yes. Yuna's Summon command is never disabled in the chain, and the summon list shows every held aeon that is still in the party. The chosen aeon is taken out of the party **before** its battle and each possessed aeon's script also sets the game's own availability lock (script call 0x703B, value 0) on its own aeon id, so the player never has the matching aeon, and never has an aeon already possessed; an aeon not yet possessed is summonable in every link and in both forms of Braska's Final Aeon. The lock is used by **ten monster scripts** (the seven possessed aeons and the three possessed Sisters), on the matching aeon only, and by **no** chain formation script. (section 5)
3. **The two battles** (sections 1.3, 1.4, 6): Yojimbo's `sins07_06` (battle 0x024B0006) holds the possessed Yojimbo, both Yu Pagodas, a Sinscale model that stands in for Daigoro (hidden after his first turn, its branch unreachable) and a dummy helper; he opens with a no-damage staging turn, then every turn Kozuka or Wakizashi 50/50 on a random living front-line actor (power 14 each) and Zanmato (fixed 9,999 on the whole front line, not a kill) at a full gauge. The Sisters' `sins07_07` (0x024B0007) holds all three possessed Sisters, both Pagodas and the helper in one battle: Delta Attack when all three gauges are full, otherwise Cindy heals or drains, Sandy buffs, Mindy casts or flurries; the Pagodas' Power Wave feeds the Sister with the lowest gauge.
4. **Stat copy**: at battle start each possessed copy takes STR, DEF, MAG, MDF, AGI, EVA, ACC and maximum HP from the player's own aeon in that battle (actor 8 to 14; the Sisters from 15, 16, 17) and starts at full HP. Luck stays 0 and MP stays 1. There is no scaling and no carry-over of the player aeon's current HP or gauge; the copy's Overdrive gauge starts at 0 on a 100-point scale of its own. (section 7)
5. **Ids**: Valefor 8, Ifrit 9, Ixion 10, Shiva 11, Bahamut 12, **Anima 13**, Yojimbo 14, Sisters 15 (with 16 and 17); battles 0x024B0000 to 0x024B0007 in that order; Yu Yevon 0x024B000A. Anima has no fixed place: it sits between Bahamut and Yojimbo in the list and the player picks when. (section 3)
6. **Zanmato**: the second pass can never produce a Zanmato (a Zanmato on the second roll becomes Wakizashi on all), so the chance is the first pass only, with the motivation divided by (byte + 1) for hire answers 0 and 1. Bytes: possessed Valefor to Yojimbo 2, possessed Sisters 3, **Yu Pagodas 4**, Yu Yevon 4, Braska's Final Aeon 5, Dark Aeons 4, Penance 5. Because the penalty uses the highest byte of **all** monsters on the field and both Pagodas are on the field in every link, the chain's effective byte is 4 in every possession link and 5 in the Braska fight. Exact tables in section 8.
7. **Repo mismatch**: confirmed and wider than the brief. The game's possessed Yojimbo never uses Daigoro; his two moves are Kozuka and Wakizashi, both power 14. Chapter III's shipped line cannot reach the possessed Yojimbo or Sisters records (section 4 has the grep and the 12-seed check).

## 1. Rows

### 1.1 The chain's battles [bytes]

Battle ids are `0x024B0000 + n`: the area key 587 (`sins07`) in the high half, the formation number in the low half. All launches use a Fade transition. Flag word 0x10504 (link battles): the low byte is the "move task" with two extra arguments, bit 9 is clear so a defeat is a Game Over [note: FFX-G10 3.6]. The two extra arguments are the room numbers listed (the game's own warp targets, kept here only as raw ids).

| Aeon id | Aeon | Formation | Battle id | Possessed monster file (monster word) | Copies the stats of | Room args | Zanmato byte |
|---:|---|---|---|---|---|---|---:|
| 8 | Valefor | `sins07_00` | 0x024B0000 (38,469,632) | m163 (0x10A3) | actor 8 | 622, 21 | 2 |
| 9 | Ifrit | `sins07_01` | 0x024B0001 (38,469,633) | m164 (0x10A4) | actor 9 | 623, 21 | 2 |
| 10 | Ixion | `sins07_02` | 0x024B0002 (38,469,634) | m165 (0x10A5) | actor 10 | 625, 21 | 2 |
| 11 | Shiva | `sins07_03` | 0x024B0003 (38,469,635) | m166 (0x10A6) | actor 11 | 624, 21 | 2 |
| 12 | Bahamut | `sins07_04` | 0x024B0004 (38,469,636) | m167 (0x10A7) | actor 12 | 626, 21 | 2 |
| 13 | Anima | `sins07_05` | 0x024B0005 (38,469,637) | m168 (0x10A8) | actor 13 | 628, 21 | 2 |
| 14 | **Yojimbo** | `sins07_06` | 0x024B0006 (38,469,638) | m169 (0x10A9) | actor 14 | 627, 21 | 2 |
| 15 (+16, 17) | **Magus Sisters** | `sins07_07` | 0x024B0007 (38,469,639) | m178 Cindy (0x10B2), m179 Sandy (0x10B3), m180 Mindy (0x10B4) | actors 15, 16, 17 | 629, 21 | 3 each |
| none left | Yu Yevon | `sins07_10` | 0x024B000A (38,469,642) | m176 (0x10B0) | (own record) | flag word 0x10D01 | 4 |
| before the chain | Braska's Final Aeon | `sins06_00` | 0x024A0000 (38,404,096) | m132 (0x1084) | (own record) | flag word 0xD01 | 5 |

### 1.2 The possessed monster rows (kernel monster table and file; the numbers are placeholders replaced at battle start, section 7) [bytes]

| | m169 possessed Yojimbo | m178 Cindy | m179 Sandy | m180 Mindy |
|---|---|---|---|---|
| HP / MP / overkill threshold | 169 / 1 / 169 | 2,000 / 1 / 2,000 | 2,000 / 1 / 2,000 | 2,000 / 1 / 2,000 |
| STR DEF MAG MDF AGI LCK EVA ACC | 7 0 0 0 0 0 2 10 | 1 1 1 0 1 0 1 0 | 1 0 0 0 0 0 0 0 | 1 0 0 0 0 0 0 0 |
| Record commands | 0x60CF (Death), 0x60EC (possession caption) | 0x60EF (Death), 0x60EE (caption) | same | same |
| Doom counter / CTB icon | 10 / 14 | 3 / 21 | 3 / 21 | 3 / 21 |
| Monster file's flag bytes | +0x28: second-Scan immunity only; +0x29: Slice and Bribe immunity | same | same | same |
| Extra-immunity word | Scan, Eject, Auto-Life, Doom | same | same | same |
| Zanmato byte (loot record +0x112) | 2 | 3 | 3 | 3 |

All four: status bytes 255 (immune) for Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; Threaten 0 (cannot land); Shell, Protect, Reflect, the four Nuls, Regen and Haste land (0). Poison damage 25 percent. No element affinity (the other possessed aeons differ: Ifrit absorbs Fire, Ixion Thunder, Shiva Ice). No loot, AP or gil.

### 1.3 The formations: slots, stage, start positions [bytes]

Stage (battlefield) id from the area table: `sins06` stage 586, `sins07` stage **587** for every link and for Yu Yevon; each area lists its zone with weight 0 (never a random encounter). Formation block: voice 0, byte 1 = 0, foot-sound id 5 (`sins06_00`) or 8 (`sins07_*`), in-water 0. Positions are x, y, z (the fourth float is 0); the party's three starts and the monsters' by slot; a summoned aeon uses the aeon position of its id minus 8.

| Formation | Slot (actor) | Monster | Start position |
|---|---|---|---|
| `sins06_00` | 20 | m132 Braska's Final Aeon | (0, 0, 40) |
| | 21 / 22 | m174 / m173 Yu Pagoda | (-60, 0, 110) / (60, 0, 110) |
| | party 1, 2, 3 | | (32, 0, -50), (0, 0, -56), (-32, 0, -50) |
| `sins07_06` (Yojimbo) | 20 | m169 possessed Yojimbo | (0, -10.1, 0) |
| | 21 / 22 | m174 / m173 Yu Pagoda | (0, -35, -60) / (0, -35, 60) |
| | 23 | m116 Sinscale (the Daigoro stand-in) | (3.487, -10.1, 19.777) |
| | 24 | m274 helper actor (the "summoner" of the staging turn; it never acts, is not targetable and does not count for the battle end) | (0, -10.1, 0) |
| | party 1, 2, 3 | | (70, -10.1, 35), (80, -10.1, 0), (70, -10.1, -35) |
| `sins07_07` (Sisters) | 20 | m180 possessed Mindy | (-10, -10.1, 20) |
| | 21 | m179 possessed Sandy | (0, -10.1, 0) |
| | 22 | m178 possessed Cindy | (-10, -10.1, -20) |
| | 23 / 24 | m174 / m173 Yu Pagoda | (0, -35, -60) / (0, -35, 60) |
| | 25 | m274 helper actor | (0, -10.1, 0) |
| | party 1, 2, 3 | | same as above |
| `sins07_00` to `_05` | 20, 21, 22, 23 | possessed aeon, Pagoda m174, Pagoda m173, helper m274 | (0, -10.1, 0), the Pagodas as above, (0, -10.1, 0) |
| `sins07_10` (Yu Yevon) | 20, 21, 22 | m176, Pagodas | (0, 0, 0), the Pagodas as above; aeon positions (50, 0, 0) |

Aeon start positions in the `sins07` battles (index = aeon id minus 8): Valefor, Ifrit, Ixion, Shiva, Bahamut, Yojimbo and Sandy (70, -10.1, 0); Anima (80, -10.1, 0); Cindy (75, -10.1, 20); Mindy (75, -10.1, -21). In `sins06_00` all aeons are at (0, 0, -86) except Cindy (20, 0, -94.8) and Mindy (-21, 0, -90). The Pagodas' CTB is 24 at the start of every link; the possessed actor has First Strike and CTB 0 (in the Sisters' battle only Cindy); party and reserves get CTB + 1 [note: re-ffx-ai-yunalesca-bfa.md 5.3]. Escape and Flee are disabled for everyone in every battle of the chain; every party member without an aeon slot gets permanent Auto-Life at the start of each link [note: 5.2].

### 1.4 The move rows of the two possession battles [bytes]

All rows have accuracy formula 0 (always hit; the engine reads only `canMiss === false`, hard rule 5), damage class HP, element none, no status, cap 9,999 per hit (no Break Damage Limit flag; 99,999 would need the row's cap-99,999 flag or the user's Break Damage Limit, which a possessed monster does not have). "Target word" is the row's byte +0x1A: 0x33 one target, 0x37 a group (the scripts aim the group moves at the whole front line). Rank is the CTB cost class. Formula numbers are those of `research/re-ffx-damage.md`: 1 Strength against DEF, 3 Magic against MDF, 6 fixed `power x 50`, 7 heal, 13 buff, 15 MAG cube with no defence.

| Move (id, table row) | Used by | Type / formula / power / hits | Target word | Crit | Rank | Notes |
|---|---|---|---|---|---:|---|
| Kozuka 0x60E0 (monster magic 2, row 224) | possessed Yojimbo, coin | physical / 1 / **14** / 1 | 0x33 | can crit; equipment crit bonus (none) | 3 | pierces Armored; shatter chance 0 |
| Wakizashi 0x60E1 (row 225) | possessed Yojimbo, coin | physical / 1 / **14** / 1 | 0x33 | same | 3 | identical to Kozuka in every field |
| Zanmato 0x60E2 (row 226) | possessed Yojimbo, gauge 100 | neither / **6** / 200 / 1 | 0x37 | none | 3 | fixed 200 x 50 = 10,000, cut to **9,999** on each front-line actor; **no status, not a kill**; flag bit 0x40000000 (unmapped) |
| Camisade 0x30E5 (command table, row 229) | possessed Cindy | physical / 1 / 21 / 1 | 0x33 | can crit | **5** | shatter chance 30 |
| Razzia 0x30E7 (command table, row 231) | possessed Sandy | physical / 1 / 21 / 1 | 0x33 | can crit | **5** | shatter chance 30 |
| (Camisade 0x60E3, Razzia 0x60E4, rows 227 and 228) | no script calls them | same fields, rank 3, shatter 0 | 0x33 | can crit | 3 | present in the table, unused |
| Passado 0x60E5 (row 229) | possessed Mindy | physical / 1 / **2** / **15** | 0x33 | can crit | 3 | no status (the Dark Mindy's Passado carries Death; this one does not) |
| Delta Attack 0x60E6 (row 230) | possessed Cindy, all three gauges full | neither / **15** / 10 / **6** | 0x37 | can crit | 3 | cube of MAG, no defence, six hits on each front-line actor |
| Drain 0x3050 (command table, row 80) | possessed Cindy | magical / 3 / 20 / 1 | 0xB3 | none | 2 | absorbs (heals the user); reflectable |
| Curaga 0x302D (row 45) | possessed Cindy | white magic, heals / 7 / 80 / 1 | 0xB1 | none | 3 | a Sister at 50 percent or less |
| Reflect 0x303C (row 60) | possessed Sandy | status / 3 / 0 | 0xB1 | none | 3 | Reflect at chance 254, duration 254 |
| Haste 0x3036 (row 54) | possessed Sandy | status / 13 / 8 | 0xB1 | none | 4 | Haste at chance 254, duration 254 |
| Flare 0x3052 (row 82) | possessed Mindy | magical / 3 / 60 / 1 | 0xB3 | none | 5 | reflectable |
| Power Wave 0x60D2 (row 210) | both Pagodas | heal / 6 / 30 / 1 | 0x33 | none | 3 | fixed 1,500 heal; removes Zombie, Poison and Reflect |
| Daigoro 0x4086 (monster magic 1, row 134) | possessed Yojimbo's unreachable branch | formula 0, power 0 | 0x33 | none | 3 | a staging row with no damage (see 6.1) |
| staging rows 0x408B, 0x4090, 0x4092 ("Summon") and 0x60EC to 0x60EE (the possession captions) | first turn only | formula 0, power 0 | 0x33 | none | 3 | no damage, no status |

The spells (Drain, Curaga, Reflect, Haste, Flare) are the player-side command-table rows; monsters pay no MP [note: re-ffx-ai-seymour.md 1.2], so the row's MP cost (12, 20, 14, 8, 54) is not charged.

### 1.5 The Zanmato byte of every relevant actor (loot record +0x112; the only graded field of a monster record) [bytes]

| Actor | Byte |
|---|---:|
| Braska's Final Aeon m132 (both forms are one record) | **5** |
| Yu Pagodas m173, m174 | **4** |
| Yu Yevon m176 | **4** |
| possessed Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo (m163 to m169) | **2** |
| possessed Cindy, Sandy, Mindy (m178 to m180) | **3** |
| helper m274, Sinscale stand-in m116 | 0 |
| Yunalesca m130 (for comparison) | 3 |
| Dark Valefor to Dark Anima m334 to m339, Dark Yojimbo m340, Dark Cindy, Sandy, Mindy m341 to m343 | **4** |
| Penance m344 and both arms | 5 |
| the player-side aeon records m288 to m291 | 0 |

(The wiki's "level 6" for Braska's Final Aeon is not what the Steam file holds: the byte is 5.)

## 2. Answer 1: the possession-order menu (field event `sins0700`, worker 26)

**What the event does, in order** [bytes]:

1. At its start it reads **which aeons Yuna holds**: the game's own native loops the ids **8 to 15 inclusive** (Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, Cindy) and sets one bit per aeon whose party record is switched on [static]. **The three Magus Sisters therefore appear as one entry, tested through Cindy (15) only**; Sandy (16) and Mindy (17) are never read. The set is kept twice: as it was at the start, and as it is now (re-read after every link).
2. While the current set is **not empty** it shows a message window at the top left with the aeon list, then waits for the player's choice. The list builder takes the aeons in **ascending id order** (8 first, 15 last) and gives each remaining aeon a numbered choice marker; an aeon that was in the starting set but is already gone is drawn without one (a second line style the builder distinguishes; exactly how it looks was not run) [static, inferred for the look]. The choice index is turned back into an aeon id by counting the **remaining** aeons in ascending id order [static].
3. **Any order is allowed.** Nothing in the event sets an order, a precondition or a forced first link. **No default is coded**: the script simply waits on the choice window. (Where the cursor rests when the window opens is the dialogue system's; the first choice is the likely start [inferred].)
4. The chosen aeon is taken out of the party with the party-removal native (not the "remove completely" one, whose difference is that the member is also hidden in the party list). For the Sisters the event also removes Sandy (16) and Mindy (17) so all three leave together. The removal is never undone in the event [bytes].
5. A switch on the aeon id launches the matching battle (section 1.1) with a Fade, with the game-over flag word of section 1.1. After the battle the event re-reads the set and loops.
6. When the set is empty the event fades the music out and runs the final scene function, which launches Yu Yevon (`sins07_10`) with flag word 0x10D01.

**An aeon Yuna does not hold** is simply not in the set: there is no entry, no link and no placeholder. The chain is as long as the number of entries (the Sisters count once, and only if Cindy is held). With no aeon at all the loop is skipped and Yu Yevon follows at once. [bytes, static]

**HP, MP and statuses between links**: **no restore of any kind** is called in the event (the three events `sins0600`, `sins0700` and the chain's formations were searched; the two unlabelled natives that wrap every launch only set a script-worker flag and one global byte) [bytes, static]. The party's HP, MP and statuses therefore carry from link to link, exactly as from any battle to the next. What changes at every link start is the formation's own setup: every non-aeon party member gets **permanent Auto-Life** again (a 25 percent revive each time it triggers, so the party cannot be wiped by one blow) and the revived member acts next [note: re-ffx-ai-yunalesca-bfa.md 5.2]. A knocked-out player aeon keeps its recovery counter across links (it is dropped by one per finished battle) [note: re-ffx-overdrive-steal-aeons.md 4.7, 4.8].

## 3. Answer 5: Anima's place and the full id list

The list is in section 1.1. **Anima is aeon id 13**, between Bahamut (12) and Yojimbo (14) in the list. It has **no fixed place in the order**: the player may choose it first, last or anywhere in between, like any other entry. Its possession battle is `sins07_05`, battle id **0x024B0005**; the possessed Anima (m168) copies actor 13's stats, never uses the plain Attack and uses Pain on a random living front-line actor on every turn below a full gauge, and its Overdrive (Oblivion) at 100 [note: re-ffx-ai-yunalesca-bfa.md 5.5]. Its Zanmato byte is 2 (section 1.5).

The complete id list, as the event's switch uses it: 8 Valefor, 9 Ifrit, 10 Ixion, 11 Shiva, 12 Bahamut, 13 Anima, 14 Yojimbo, 15 the Magus Sisters (16 and 17 ride along). Ids 16 and 17 are never an entry of their own. [bytes]

## 4. Answer 7: the repo's possessed-yojimbo-daigoro record against the files

**The repo** (`origin/r49-rc`): in `src/data/ffx/enemies/braskas-final-aeon-abilities.ts` the id `possessed-yojimbo-daigoro` is named Daigoro, Strength formula, **power 10**, physical, one enemy, rank 3, flag piercing, no crit flag; its source comment takes the number from the player-side Yojimbo's action table (`research/ffx-combat-core.md` section 6.3, "Daigoro (222) DmgCon 10"), and `tests/unit/chapters/possessed-aeons.test.ts` pins power 10 by comparing it with the player-aeon Daigoro. In `src/data/ffx/command-records/enemies.ts` the same id points at the record 0x40B1. The AI (`src/battle/ffx/ai/possessed-aeons.ts`) draws a coin and uses that one record "for Kozuka or Wakizashi".

**The files** [bytes]: the possessed Yojimbo's script has three branches below a full gauge: a coin of two (Kozuka or Wakizashi) on a random living front-line actor, and a third branch (Daigoro on the dog stand-in) that the coin can never reach (a modulo of 2 gives 0 or 1). Both reachable moves are rows of the monster-magic-2 table:

| Field | Kozuka 0x60E0 | Wakizashi 0x60E1 |
|---|---|---|
| Damage type, formula | physical, 1 (Strength against DEF) | same |
| **Power** | **14** | **14** |
| Hits | 1 | 1 |
| Accuracy | always hits (formula 0) | same |
| Target | one (0x33) | same |
| Crit | can crit; equipment crit bonus, none on a monster | same |
| Armored | pierces Armored | same |
| Status, element | none | same |
| Cap, rank | 9,999 per hit; rank 3 | same |

So the repo's number is **10 where the files say 14**, the name and the id are wrong (there is no Daigoro damage in the possessed fight at all: its only Daigoro row, 0x4086, has formula 0 and power 0), and the repo's one record stands for two identical rows, which is fine for the numbers once corrected. 10 is the **player-side** Daigoro (command 0x30DE, power 10); the player-side Kozuka is 13 and the player-side Wakizashi 18, with a shatter chance of 100, none of which the possessed copy uses. The possessed Yojimbo never uses the plain Attack (the file's turn has no Attack branch).

**Wider than the brief** (same file, same method; each checked against the rows of section 1.4):

| Repo record | Repo value | The files |
|---|---|---|
| `possessed-yojimbo-zanmato` | formula none, power 0, **Death at chance 255**, all enemies | row 0x60E2: formula 6 (fixed), power 200, **9,999 damage to each front-line actor, no Death, no status** |
| `possessed-cindy-camisade` | power 30, rank 3 | command 0x30E5: power 21, **rank 5**, shatter chance 30 |
| `possessed-sandy-razzia` | power 28, **all enemies** | command 0x30E7: power 21, **one target (0x33)**, rank 5, shatter chance 30 |
| `possessed-cindy-delta-attack` | power 65, special-magic formula, 1 hit | row 0x60E6: **formula 15 (cube of MAG), power 10, 6 hits**, group |
| `possessed-mindy-passado` | power 2, 15 hits, one target | **matches** row 0x60E5 |
| Cindy's list in the repo | Camisade, Delta Attack, Curaga | the file also has **Drain** (when her HP is under two thirds of her maximum) |
| Mindy's list in the repo | Passado only | the file also has **Flare** (a coin with Passado, and on Cindy when she has Reflect) |
| Sandy's list | Razzia, Haste, Reflect | matches |
| `command-records/enemies.ts` ids | Camisade 0x60E3, Razzia 0x60E4 | the scripts call 0x30E5 and 0x30E7 (the 0x60E3 and 0x60E4 rows have the same power but rank 3 and no shatter) |

**Does Chapter III's shipped line ever reach these records?** The data layer builds the possessed chain from the player's owned aeons (`buildPossessedAeonChain`); the shipped chain `possessedAeonGroups` is built once from the five mandatory aeons, and `dreams-end.ts` lists only those five (Anima, Yojimbo and the Magus Sisters are left out on purpose). Grep on `origin/r49-rc`: outside the data file and tests, nothing calls `buildPossessedAeonChain`; `src/data/ffx/index.ts` registers the prebuilt `possessedAeonGroups` only. The tests that build the full chain (`audio-chain-entrance-owner`, `possessed-aeons`, `data-ffx-enemies`) pass the full list by hand. So the possessed Yojimbo and Sisters records are unreachable from Chapter III as shipped. A run of 12 seeds of the shipped chain confirming that no such ability fires follows in section 9.

## 5 to 9. To follow

Answers 2, 3, 4 and 6 in full (the summon gate during the chain, the two possession battles, the stat copy, the Zanmato tables), the 12-seed check of Chapter III and the list of what is not proved follow in the next commits of this branch.
