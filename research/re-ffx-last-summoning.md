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
6. **Zanmato**: the second pass can never produce a Zanmato (a Zanmato on the second roll becomes Wakizashi on all), so the chance is the first pass only, with the motivation divided by (byte + 1) for hire answers 0 and 1. Bytes: possessed Valefor to Yojimbo 2, possessed Sisters 3, **Yu Pagodas 4**, Yu Yevon 4, Braska's Final Aeon 5, Dark Aeons 4, Penance 5. Because the penalty uses the highest byte of **all** monsters on the field and both Pagodas are on the field in every link, the chain's effective byte is 4 in every possession link and 5 in the Braska fight (read from the selector's code, not run). Exact tables in section 8.
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

Aeon start positions in the `sins07` battles (index = aeon id minus 8): Valefor, Ifrit, Ixion, Shiva, Bahamut, Yojimbo and Sandy (70, -10.1, 0); Anima (80, -10.1, 0); Cindy (75, -10.1, 20); Mindy (75, -10.1, -21). In `sins06_00` all aeons are at (0, 0, -86) except Cindy (20, 0, -94.8) and Mindy (-21, 0, -90). The Pagodas' CTB is 24 at the start of every link; the possessed actor has First Strike and CTB 0 (in the Sisters' battle only Cindy); party and reserves get CTB + 1 [note: re-ffx-ai-yunalesca-bfa.md 5.3]. Escape and Flee are disabled for everyone in every battle of the chain; every non-aeon party member gets permanent Auto-Life at the start of each link [note: 5.2].

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

(The file's byte 5 is the wiki's level 6: the wiki counts levels from 1, the file from 0.)

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

**Does Chapter III's shipped line ever reach these records?** The data layer builds the possessed chain from the player's owned aeons (`buildPossessedAeonChain`); the shipped chain `possessedAeonGroups` is built once from the five mandatory aeons, and `dreams-end.ts` lists only those five (Anima, Yojimbo and the Magus Sisters are left out on purpose). Grep on `origin/r49-rc`: outside the data file and tests, nothing calls `buildPossessedAeonChain`; `src/data/ffx/index.ts` registers the prebuilt `possessedAeonGroups` only. The tests that build the full chain (`audio-chain-entrance-owner`, `possessed-aeons`, `data-ffx-enemies`) pass the full list by hand. So the possessed Yojimbo and Sisters records are unreachable from Chapter III as shipped.

**The 12-seed check** (a throw-away test, deleted after the run, on the exact source of `origin/r49-rc` extracted into a scratch folder, so not on the other lane's worktree, which sits on a different branch): for seeds 1 to 12 it played every link of the shipped chain (`possessed-valefor`, `-ifrit`, `-ixion`, `-shiva`, `-bahamut`, then `yu-yevon`, followed through `nextGroupId`) on the real engine with the Dream's End party and a naive line (the first Attack on the first target, else Defend), and logged every enemy action. Result: the chain holds **six formations and no Anima, Yojimbo or Sister**; 72 battles, all victories; the possessed aeons used only Sonic Wings and Energy Ray (Valefor), Meteor Strike and Hellfire (Ifrit), Aerospark and Thor's Hammer (Ixion), Heavenly Strike and Diamond Dust (Shiva), Impulse and Mega Flare (Bahamut); **0 possessed-Yojimbo or possessed-Sisters actions**. The line is not a balance measurement, only a reachability check.

## 5. Answer 2: can Yuna summon an aeon that is not yet possessed while the chain runs?

**Yes, in both forms of Braska's Final Aeon and in every possession link.** The pieces:

1. **Nothing disables the Summon command.** The formation scripts of `sins06_00` and of every `sins07_*` battle write the command-disable call only for Escape and Flee (everyone) and, in the Braska fight, for Talk. Summon (0x3117), Grand Summon (0x3118) and the Sisters' own command (0x30FF) are left alone. [bytes]
2. **The summon list.** The battle menu builds the Summon list from the battle's character records for ids 0 to 17: an aeon is listed when its record exists in this battle and it is an aeon; the three Sisters are folded into one entry (the 0x30FF command). A record exists in a battle when the aeon's party flag is on at the start (or it already existed) [static]. Because the event switched the party flag off with the party-removal native **before** launching a link (section 2), an aeon that was chosen earlier or is being possessed now has no record in that battle and is not in the list; every other held aeon (Anima, Yojimbo and the Sisters included) is. [static]
3. **The usability gate** for a listed aeon (the menu-side gate and the disabled test, FFX-G07 3.6) refuses it only when its HP is not above 0, its availability flag is clear, it was removed for good, or its recovery counter is set. The availability flag is set to 1 for every character record at battle start [static: the battle-start routine writes 1 for all 31 records], so the only thing that clears it during the chain is the lock call below. A listed Sisters entry is also refused when any one of the three Sisters is unavailable. [static, note: FFX-G07 3.6]

**The lock (script call 0x703B, "set command disabled", handler 0x7A6EF0) and the chain.** Its handler takes (owner, id, value). For an id below 0x1000 (an aeon) it writes the value into that aeon's availability byte (the owner is ignored); for a command id of 0x3000 or more it sets or clears a bit in the owner's disabled-command mask (value 1 disables; Escape and Flee in the chain are of this second kind). [static] A value of 0 on an aeon id is therefore the game's real "no such aeon" lock; the harness run of `research/re-ffx-dark-aeons.md` section 9 showed that a locked aeon is refused at the usability gate with the disabled code. The earlier scan (16 sites in 14 formations) covered **formation scripts only**. This lane also swept the **monster scripts** (all 361 files) and found the lock used with an aeon id in exactly **ten** of them, which are the chain's:

| Monster script | Locks | Value |
|---|---|---:|
| m163 possessed Valefor | aeon 8 | 0 |
| m164 possessed Ifrit | aeon 9 | 0 |
| m165 possessed Ixion | aeon 10 | 0 |
| m166 possessed Shiva | aeon 11 | 0 |
| m167 possessed Bahamut | aeon 12 | 0 |
| m168 possessed Anima | aeon 13 | 0 |
| m169 possessed Yojimbo | aeon 14 | 0 |
| m178 possessed Cindy | aeon 15 | 0 |
| m179 possessed Sandy | aeon 16 | 0 |
| m180 possessed Mindy | aeon 17 | 0 |

Each runs once, in the monster's own setup at battle start, and locks **only its own aeon**. Answer to "does any chain formation use that lock, and on which aeons": **no formation script of the chain does** (`sins06_00`, `sins07_00` to `sins07_07`, `sins07_10` call only Escape, Flee and Talk); **the monster scripts of the possessed aeons do**, one aeon each. In the normal flow the lock is redundant with the party removal (the aeon is already out of the list); it is the second layer. In the Sisters' battle the three locks together also refuse the Sisters' entry. Other monster scripts that call the same native use command ids, not aeon ids. [bytes, static]

**Which aeons the gate offers, link by link** (A = the aeons Yuna holds, as entries; the Sisters are one entry):

| Point | Offered by the summon gate |
|---|---|
| Braska's Final Aeon, form I and form II (one battle, one party) | every entry of A that is not knocked out or on a recovery counter; nothing is removed or locked |
| Link 1 (the aeon the player chose first, call it X1) | A without X1 (X1 is out of the party and locked) |
| Link k (the k-th chosen, Xk) | A without X1 to Xk |
| Yu Yevon | none: every entry has been removed |

So the player's summon pool **shrinks by one entry per link**, and the aeon fought in a link is never the aeon the player can bring in. In the Sisters' link all three are removed together. [bytes, static]

**What a summon does in a link** [note: FFX-G08 5; re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.2]: the whole party is parked, frozen exactly as it is (HP, MP, statuses, counters); the aeon arrives with its own 20-point gauge. The monsters' "front line" is then the summoned aeon alone (the group is every non-monster actor in the battle), so the possessed aeon's single-target moves, its group moves and the Overdrive all land on it; the Pagodas' Power Wave still goes only to the possessed actor (or, in the Sisters' battle, to the Sister with the lowest gauge). When every aeon-side member is down the battle does not end: the aeon is dismissed without revive, the party returns, the aeon takes a recovery counter (Valefor 9, Ifrit 13, Ixion 21, Shiva 21, Bahamut 25, Anima 25, Yojimbo 25 and each Sister 31 are the counters after a wipe; one is dropped per finished battle) [note: re-ffx-overdrive-steal-aeons.md 4.8], and at most nine battles follow Braska's Final Aeon (eight links and Yu Yevon), so an aeon wiped in a link, or in the Braska fight, is not available again before the chain ends [inferred arithmetic]. A wipe is not a Game Over. The party's permanent Auto-Life does not cover an aeon. [note]

## 6. Answer 3: the two possession battles

Rows, slots, stage and positions are in sections 1.1 to 1.4; this section is the behaviour. All of it is the compiled AI of the monster files m169 and m178 to m180 and of the two Pagodas, read from the disassembly and run by the earlier lane's interpreter against the real rows; only the sentences marked otherwise are new.

### 6.1 Yojimbo's battle (`sins07_06`, battle 0x024B0006)

- **Cast on the field**: slot 20 the possessed Yojimbo; slots 21 and 22 the two Yu Pagodas (hidden at the start, shown by his first turn); slot 23 a **Sinscale model standing in for Daigoro** (the third branch of his AI aims the Daigoro staging row at it; the branch is unreachable, and the script hides the stand-in after his first turn); slot 24 the helper actor (the "summoner" of the staging turn; never acts, not targetable, not needed for the battle end). Stage 587; positions in 1.3. [bytes]
- **Opening** (his first turn, which comes first: First Strike and CTB 0, both Pagodas at CTB 24, the party and reserves at CTB + 1 and one more from the aeon's own setup): **no attack**. The helper performs a no-damage staging action in the manner of a summon, then he performs the no-damage possession caption action, and both Pagodas are shown. [bytes, note: 5.3, 5.5]
- **Every later turn**, in this order: (1) if his Overdrive gauge is 100 or more, **Zanmato** on the whole front line, gauge back to 0; (2) otherwise pick a random living front-line actor (a stream-4 draw only when two or more can be chosen) and flip a coin (stream 2, modulo 2): **Kozuka** or **Wakizashi** on that actor, power 14 either way; there is no Attack and no reachable Daigoro. The gauge then rises by 0 to 9 on a turn that was not the Overdrive and clamps at 100. [bytes]
- **When he is hit**: ignored when his HP is 0, his gauge is full or the move does not touch HP; otherwise the gauge rises by 0 to 9 per action (a miss counts, a heal does not); a Pagoda's Power Wave on him adds 5 more (5 to 14 in all, where the other six aeons get 15 to 33). [bytes, note: 5.5]
- **The Pagodas** here: Power Wave 0x60D2 (a fixed 1,500 heal that removes Zombie, Poison and Reflect) on the possessed Yojimbo **only while his gauge is below 100**; otherwise they repeat their last command. When one is "destroyed" it is made invisible and untargetable for 1 (Slowed), 2 or 3 of its own turns and returns with all the damage it absorbed; the Pagoda scripts treat the player's Zanmato (0x30E2) as hitting for its whole current pool. [bytes, note: 4]
- **Death**: the body stays (boss death), the battle ends when the possessed actor is dead and the Pagodas, which never count, are ignored. The battle's AI never ends it early. [bytes]
- **Damage he does** (before Shell/Protect/Defend, variance and criticals): Kozuka and Wakizashi are Strength-against-DEF rows of power 14, capped at 9,999; Zanmato is a flat 9,999 on each front-line actor. His Strength is the player's Yojimbo's Strength (section 7), so how hard he hits is what the player built. [bytes, inferred for the sentence on strength]

### 6.2 The Magus Sisters' battle (`sins07_07`, battle 0x024B0007)

- **Cast on the field**: slot 20 Mindy, slot 21 Sandy, slot 22 Cindy (note the order: Mindy is the first slot), slots 23 and 24 the Yu Pagodas, slot 25 the helper actor. Stage 587; positions in 1.3. Sandy and Mindy start hidden (their AI skips a turn while hidden); what un-hides them is a battle scene that no AI function queues, so how the second and third Sister enter play was not traced. [bytes, note: 5.6]
- **Opening**: only Cindy has First Strike and CTB 0; the other two Sisters and both Pagodas start at CTB 24. Cindy's first turn is the staging turn (a no-damage summon-style action by the helper and the possession caption), and shows the Pagodas. [bytes]
- **Cindy's turn**, in order: (1) if **all three Sisters are alive and each has a gauge of 100 or more**: **Delta Attack** on the whole front line (her post-turn step then zeroes all three gauges); (2) else if her HP is under two thirds of her maximum (`(max / 3) x 2`, integer): **Drain** on the front-line actor with the highest HP; (3) else, with Sandy's and Mindy's HP percent (255 for a dead one): if either is at 50 or less, **Curaga** on the one with the lower percent (a tie goes to Mindy); (4) else **Camisade** (command 0x30E5) on a random living front-line actor. If she is targeted by the one-off "special" token that Sandy or Mindy send when the three gauges are full, she throws the Delta Attack at once and zeroes her own gauge. She also remembers her Reflect so that a Pagoda's Power Wave stripping it is undone on the hit. [bytes]
- **Sandy's turn**: (1) all three gauges full: send the token to Cindy; (2) else if Cindy is alive without Reflect: **Reflect on Cindy**; (3) else **Haste** on a random Sister without Haste; (4) else **Razzia** (command 0x30E7) on a random living front-line actor. [bytes]
- **Mindy's turn**: (1) all three gauges full: send the token to Cindy; (2) else if Cindy is alive and has Reflect: **Flare on Cindy** (it bounces onto the front line through her Reflect); (3) else a coin that is Passado with probability 48.97 percent (a modulo-100 draw above 50) and Flare otherwise, on a random living front-line actor. [bytes, note: 5.6]
- **Gauges**: each Sister's gauge is on a 100-point scale of her own (the Sister writes the maximum explicitly), starts at 0, and rises by 0 to 9 on each of her own turns, by **10 to 19 per hit event** against her and by a further 30 to 39 when the hit is a Pagoda's Power Wave (about 40 to 58 in all); it clamps at 100. [bytes]
- **The Pagodas' preference**: in this battle a Pagoda's Power Wave goes to the **living Sister with the lowest gauge** (ties random) and the Pagoda takes no action at all when that lowest gauge is already 100. The group it picks from is every monster except actors 23, 24 and 25 (the Pagodas and the helper). So the Pagodas feed the Sister who is furthest from Delta Attack, and Delta Attack is on the table once all three are full and alive. [bytes, note: 4.2]
- **Death**: a dead Sister leaves a body, her bar is hidden and she is untargetable; one dead Sister makes Delta Attack impossible for the rest of the fight (the test needs all three alive). The battle ends when all three are dead. [bytes]

## 7. Answer 4: how a possessed copy takes the player's stats

All eight lines below are in the setup of each possessed monster script, run at battle start, and are the same for every aeon of the chain [bytes]:

- **Copied from the player's own aeon in this battle** (the aeon's battle character record: actor 8 for Valefor through 14 for Yojimbo; actors 15, 16, 17 for Cindy, Sandy and Mindy): **STR, DEF, MAG, MDF, AGI, EVA, ACC and maximum HP**. The copy's HP is then set to that maximum, so it **starts at full HP**.
- **Not copied**: Luck (stays the record's 0), MP (the record's 1), the aeon's current HP, statuses, gear, the aeon's Overdrive gauge or learned abilities (the one exception is a check on Valefor: whether the player's Valefor knows Energy Blast decides which Overdrive the copy uses). The possessed copy gets the aeon's name and, for Ifrit, Ixion and Shiva, the record's Fire, Thunder or Ice absorb.
- **Scaling**: none. The numbers are straight copies, with no multiplier, floor or level step; the record placeholders of section 1.2 are overwritten. How strong the copy is depends only on what the player's aeon was built to. The aeon's stats themselves are rebuilt from Yuna's at every battle's end with a floor that depends on the number of battles fought [note: re-ffx-overdrive-steal-aeons.md 4.3 to 4.6].
- **Overdrive**: the copy runs the "aeons only" Overdrive mode with the bar shown and a gauge that starts at **0**; the Sisters set the maximum to 100 explicitly and the other seven keep the monster default of 100. All the scripts' arithmetic is on that 100-point scale (the player's own aeon gauge is 20 points wide, which is not copied). The engine's own aeon gain rules (a monster hitting the aeon, the aeon hitting a monster) do not apply to a possessed copy because the hits on it come from the player's side and the hits it deals land on the party [inferred: the engine's attacker-side test was not run]; the gain comes from the scripts alone (turn: 0 to 9; hit: 0 to 9, Sisters 10 to 19; Power Wave extras as in section 6).
- **HP carry-over**: none in either direction. The copy ignores the player aeon's current HP and the fight does not touch the player aeon. What does carry across links is the **party's** HP, MP and statuses, and the recovery counters of aeons that were wiped (section 2).
- **Raw property writes with no mapped meaning**: property 296 is set at the start to 6000 (Valefor), 3000 (Ifrit), 4000 (Ixion), 3500 (Shiva), 1500 (Bahamut), 5000 (Anima), 3500 (Yojimbo), 5000 (Cindy), 3000 (Sandy), 4000 (Mindy); property 295 is set to 1 for the Sisters; properties 217 and 238 are set to 1 and 0 for all. They are listed raw and not interpreted.

## 8. Answer 6: the player's Yojimbo's Zanmato against a target's Zanmato byte

Everything in 8.1 and 8.2 is the "Pay" path of the player's Yojimbo, as read and run by the aeon-side lane (FFX-G08 3.2 and 4.4: the script on the game's own script machine, 0 mismatches against an independent model) [note: FFX-G08]. The probabilities below are this lane's exact arithmetic on those rules (every count is out of the 64 equally likely values of the draw's low six bits).

### 8.1 The rule

1. **Motivation `V0`** (a number, before any monster penalty): `V0 = 4 x n + (compatibility div 10)`, where `n = floor(log2 of the gil paid) - 2` for a payment of 8 gil or more and 0 below. Compatibility runs 0 to 255 and the payment up to 99,999,999, so `V0` runs from 0 to **121**. (Examples: compatibility 128 and 100,000 gil give 68; compatibility 128 and 1,000,000 gil give 80; compatibility 255 and 1,000,000 gil give 93.)
2. **The monster penalty** uses `L`, the **highest Zanmato byte over every monster on the field** (the game's property getter takes the maximum over the group "all monsters"). Hire answer 0: `V = V0 x (75 + 50 x paid / total gil) / 100`, then `V / (L + 1)`. Hire answer 1: `V = V0 / (L + 1)`. Hire answer 2: `V = V0 x 0.8 / ((L + 3) div 3)`, which is a divisor of 1 for `L` 0 to 2, 2 for 3 to 5 and 3 for 6 and 7. A full Overdrive gauge (and no Curse) then adds **20** to `V`.
3. **The first roll** is `trunc(V) + b` with `b` the low six bits of one draw: below 32 Daigoro, 32 to 47 Kozuka, 48 to 62 Wakizashi on one, 63 to 79 Wakizashi on all, **80 and over Zanmato**. So the number of Zanmato draws out of 64 is `clamp(trunc(V) - 16, 0, 64)`.
4. **The second pass.** If `L` is above 0 and the first roll is **not** Zanmato, the script rolls **again with `L` taken as 0** (`V` recomputed from the same payment, the same full-gauge bonus), with a fresh draw. That second roll is final, and **a Zanmato on it becomes Wakizashi on all**. So the second pass can **never** produce a Zanmato: the whole chance of Zanmato is the first roll's, and the monster penalty only gates Zanmato. A failed first roll does not drag the result down to Kozuka or Daigoro: once `V0` is 63 or more (and 43 or more with a full gauge) the second roll is Wakizashi on all with certainty (hire answer 1; the other answers scale `V0` first). (Compatibility change follows the final command: Wakizashi on all +3, Zanmato +4.)
5. **A free attack** (the turn-start roll, no payment, no hire answer, no gauge bonus) is a separate path: its Zanmato result is replaced by Wakizashi on all when the pick finds no target **or the highest Zanmato byte of the "matching group" is above 0** (what that group resolves to for the check is an open question in the aeon-side note), so against any monster with a byte above 0 a free attack is never Zanmato [note: FFX-G08 3.3, 11.2; inferred for the group].

### 8.2 The exact chances

Zanmato draws out of 64, first roll = the whole chance, hire answer 1 (the divisor is `L + 1`); each cell is "no bonus | full gauge" (`+20`). `L` 0 is the reference for an ordinary monster.

| `L` (byte) | `V0` 40 | 60 | 68 | 80 | 93 | 100 | 121 | Zanmato possible without the bonus from `V0` |
|---:|---|---|---|---|---|---|---|---:|
| 0 | 24 \| 44 | 44 \| 64 | 52 \| 64 | 64 \| 64 | 64 \| 64 | 64 \| 64 | 64 \| 64 |17 |
| **2** | 0 \| 17 | 4 \| 24 | 6 \| 26 | 10 \| 30 | 15 \| 35 | 17 \| 37 | 24 \| 44 | 51 |
| **3** | 0 \| 14 | 0 \| 19 | 1 \| 21 | 4 \| 24 | 7 \| 27 | 9 \| 29 | 14 \| 34 | 68 |
| **4** | 0 \| 12 | 0 \| 16 | 0 \| 17 | 0 \| 20 | 2 \| 22 | 4 \| 24 | 8 \| 28 | 85 |
| **5** | 0 \| 10 | 0 \| 14 | 0 \| 15 | 0 \| 17 | 0 \| 19 | 0 \| 20 | 4 \| 24 | 102 |

As percentages: 1 of 64 is 1.56, 2 is 3.13, 4 is 6.25, 8 is 12.5, 14 is 21.9, 20 is 31.3, 24 is 37.5, 28 is 43.75, 34 is 53.1, 44 is 68.75. With a full gauge a Zanmato is possible at any `V0` (at `V0` 0 and `L` 4 it is 4 of 64); without it, only from `V0 = 17 x (L + 1)`, and a Zanmato can never be certain for `L` above 0 (it would need `V0` of 80 x (L + 1), far above 121).

**The best case a player can reach** (`V0` = 121: the whole 99,999,999 gil at compatibility 255; for answer 0 the whole gil paid, factor 1.25), Zanmato chance in percent, no bonus | full gauge:

| `L` | hire answer 0 | hire answer 1 | hire answer 2 |
|---:|---|---|---|
| 2 | 53.1 \| 84.4 | 37.5 \| 68.8 | 100 \| 100 |
| 3 | 32.8 \| 64.1 | 21.9 \| 53.1 | 50.0 \| 81.3 |
| 4 | 21.9 \| 53.1 | 12.5 \| 43.8 | 50.0 \| 81.3 |
| 5 | 14.1 \| 45.3 | 6.25 \| 37.5 | 50.0 \| 81.3 |

**Final result, not only the Zanmato chance** (answer 1, `L` 4): at `V0` 80 the command is Wakizashi on all 100 percent of the time without the bonus, and Zanmato 31.25 percent / Wakizashi on all 68.75 percent with a full gauge; at `V0` 93, 3.13 / 96.88 percent without and 34.4 / 65.6 with; at `V0` 121, 12.5 / 87.5 without and 43.75 / 56.25 with. No Daigoro and no Kozuka appears in any of these, because the second roll has the full `V0`.

### 8.3 The Zanmato byte of every relevant target (section 1.5 has the full list)

| Target | Byte | Notes |
|---|---:|---|
| possessed Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo | 2 | on its own they would give a divisor of 3 (or 1 for answer 2) |
| possessed Cindy, Sandy, Mindy | 3 | divisor 4 (2 for answer 2) |
| **Yu Pagodas (present in every link and in the Yu Yevon fight)** | **4** | decides `L` in every link |
| Yu Yevon | 4 | |
| **Braska's Final Aeon** | **5** | byte 5 (the wiki's level 6); both forms are one record |
| Dark Aeons (all of them, Dark Yojimbo and the Dark Sisters included) | 4 | `research/re-ffx-dark-aeons.md` |
| helper actor, Sinscale stand-in (the dog) | 0 | never lower `L` |

`L` is a maximum over everything on the field, so a stand-in or helper of byte 0 changes nothing and **a battle's `L` is its highest actor**: Braska's Final Aeon fight 5 (the boss) with the Pagodas at 4 behind it; **every possession link 4, because the two Pagodas (4) stand in the battle beside a possessed aeon of 2 or 3**; Yu Yevon 4. The selector's code counts every monster slot that is in the battle and has not left it [static]; the Pagodas are hidden or "destroyed" but never leave (their scripts keep taking turns), so I read them as counted [inferred: the spawn code that sets the in-battle byte of a hidden monster was not traced]. If they were not counted, the links would read 2 (Valefor to Yojimbo) and 3 (the Sisters), which is the first row and the second row of the table.

**The Braska "current form only" quirk** (the wiki's words): in the file it follows from the script, not from the byte: when his first form's HP reaches 0 the script resets him to the second form's pool (120,000 HP, Strength + 5), so whatever kills the first form, a landed Zanmato included, leaves the second form to fight [bytes, note: re-ffx-ai-yunalesca-bfa.md 3.7]. Whether a Zanmato can land on him at all is not shown here (section 9).

### 8.4 What this means for the two chapters, in words

- **Chapter 27, Dark Mirror** (the player's aeon against its Dark twin): every Dark Aeon has byte 4, and the Dark Yojimbo's dog, the only other thing on the field, has 0, so `L` is 4 throughout. The player's Yojimbo cannot make a Zanmato below `V0` = 85 without a full gauge; at the extreme (the whole gil, compatibility 255) it is 12.5 percent for answer 1, 21.9 for answer 0 and 50 for answer 2; typical payments give Wakizashi on all, and a full gauge lifts Zanmato to roughly 31 to 44 percent at the higher payments (`V0` 80 to 121). A free attack is never Zanmato there.
- **Chapter 28, The Last Summoning**: against Braska's Final Aeon (`L` 5) the best case is 6.25 percent (answer 1) with no bonus and 37.5 with a full gauge; in every possession link `L` is 4, so the same figures as Chapter 27 apply whichever aeon is possessed, **the possessed aeon's own byte of 2 or 3 never lowers the penalty**; against Yu Yevon also 4. The Sisters' battle is no different: the Pagodas still stand in it.
- **What a landed Zanmato does to these targets is not shown by this lane.** Every target above has Death resistance 255 and the Slice flag, yet the player's Zanmato inflicts Death at chance 255, which the status code lands whatever the resistance byte [note: re-ffx-ctb-status.md], and the Pagoda scripts expect a Zanmato to reach them. What the Slice flag (record flag byte +0x29, bit 1) does to a landed Zanmato was not traced: the engine reads it through a getter table, and Yunalesca, Evrae and Omega Weapon carry it as well. So the numbers above are the chance that Yojimbo **chooses** Zanmato; whether it then kills a possessed aeon, a Dark Aeon or a Pagoda needs its own trace before a chapter relies on it.
- **The possessed Yojimbo's own Zanmato is not that move**: it is a fixed 9,999 on every front-line actor (section 1.4), not a death.

## 9. What is not proved

1. **No game code and no script was run in this lane.** The chain's AI is the earlier lane's interpreter run [note: re-ffx-ai-yunalesca-bfa.md]; the menu, the summon list, the lock and the selector were read from the executable's disassembly. The Zanmato arithmetic is exact on the aeon-side lane's proven rules.
2. **The menu's look and cursor.** That the list shows already-possessed aeons in a second style, and where the cursor starts, are read from the list builder's two states and not run; the dialogue code was not read.
3. **Where the copy's numbers come from.** The scripts read the player's aeon's battle record by actor number after the aeon was removed from the party. That the record then holds the aeon's stats was not traced (the game does it; how its battle setup fills a removed aeon's record is not shown).
4. **Whether the Pagodas count for the Zanmato penalty** (8.3): read from the selector, not run.
5. **What a landed Zanmato does** to each target; **the matching-group selector** of the free attack.
6. **How the second and third Sister enter play** in the Sisters' battle (what un-hides Sandy and Mindy).
7. **The single aeons' gauge maximum.** Only the Sisters write it (100); the other seven rely on the monster default of 100 (the mode byte and the maximum byte are separate fields of the character record [note: re-ffx-overdrive-steal-aeons.md 1.1]).
8. **Unmapped values**, kept raw: properties 295, 296, 217 and 238; the row flag bit 0x40000000 on Zanmato and Delta Attack; the two natives that wrap each launch in the event (one sets a worker flag, one a global byte).
9. **The starting compatibility and the hire answer** of a given save (aeon-side note, open question 1); every table above takes them as inputs.
10. **The 12-seed check is a reachability check**, with a naive line and the shipped five-aeon chain. It does not measure balance, and it did not play any chain that holds Anima, Yojimbo or the Sisters (none is built in the shipped game).
11. **The wiki's "level 6" for Braska's Final Aeon:** the wiki's level 6 equals the file's byte 5 (levels count from 1); no conflict.
