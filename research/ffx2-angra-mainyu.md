# FINAL FANTASY X-2 — Angra Mainyu, Zarich and Tawrich: the Chapter 5 mission "Showdown in the Sands" (Bikanel Desert)

**Target project:** Pyrefly Reprise (Echoes of Spira). **Request:** Bailey, 2026-10-07, adopted the chapter (D-536: "Angra Mainyu (FFX-2, the Bikanel Desert superboss)"), and on 2026-10-14, relayed by the release driver: "Please work on finishing the unimplemented chapters STAT".
**Research date:** 2026-10-14.
**Game case (AGENTS.md rule 14):** **FFX-2 only.** Every number below is FFX-2 data (ATB, dresspheres, the FFX-2 monster rows). None of it applies to an FFX chapter.
**What this file is for:** the first build of the hidden chapter `ffx2-angra-mainyu` was written from this note. The game's own monster rows, formation, scene positions and AI scripts (the RE parity session, `research/re-ffx2-angra-mainyu.md`) are the better source wherever they say more; the chapter handoff lists every place the two disagree.

---

## 0. Provenance, method and tags

### 0.1 Tags

The tags follow `research/ffx2-fallen-aeons.md` §0.1.

| Tag | Meaning |
|---|---|
| `[verified: N sources]` | N independent sources agree. The FF Wiki counts once, however many of its pages say the same thing. |
| `[single source]` | Only one source says it. |
| `[estimate]` | Our own judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §7. |
| `[unsourced]` | No source read gives it. The chapter leaves it alone or marks the stand-in as a model. |

### 0.2 What was read (2026-10-14)

1. **The Final Fantasy Wiki**, through `api.php?action=parse&prop=wikitext` (one request a page; plain pages are refused): *Angra Mainyu (Final Fantasy X-2)* rev 4041096, *Tawrich* rev 3573851, *Zarich* rev 3573852, *Final Fantasy X-2 enemy abilities* rev 3998493 (the effect rows of Bloody Breath, Glimmer of Despair, Osmose, Demi, Unnatural Selection and Perdition's Flame), *Excavation minigame*, *Episode Complete* and *Final Fantasy X-2 OST*.
2. **Jegged.com**, *Final Fantasy X-2 Walkthrough: Chapter 5 - Bikanel Desert* (the page the project's guide follows, standing rule of 2026-10-03): the mission, the three bodies, the body's order of moves, both strategies and the loot table.
3. **Not read:** SinirothX's *Enemy Encyclopedia* (GameFAQs FAQ 31807) and Split_Infinity's *Boss Guide* section G0642. GameFAQs answered with a bot-protection page, which is not bypassed. So the stat block below has **two sources for HP, the steal and the drop, and one (the wiki) for everything else**.

Nothing was downloaded and no image was saved.

---

## 1. Where, when and what the fight is

| Fact | Value | Tag |
|---|---|---|
| The fight | The last boss of the Bikanel episode, the story mission **"Showdown in the Sands"** of **Chapter 5**, after the ten Cactuar Gatekeepers are found and Jumbo Cactuar is beaten. The battle begins as soon as the Bikanel Desert is chosen on the world map. | `[verified: 2 sources]` (Jegged; the wiki's "In Chapter 5" section) |
| Where | The Bikanel Desert, **the Al Bhed excavation camp**: the wiki says the fiend attacks the excavation site, and the Gullwings are sent to stop it. | `[verified: 2 sources]` |
| Who it is | A fiend the Cactuars of Cactuar Nation sealed away long ago, woken when the Al Bhed began to dig; a superboss with a unique design; the scan text says it woke "beneath the desert sands" and is bent on destroying everything. | `[single source]` (wiki) |
| Three bodies | **Angra Mainyu** (the body) and its two arms, **Zarich** (the left arm) and **Tawrich** (the right arm). | `[verified: 2 sources]` (Jegged, wiki) |
| Which arm is which | Zarich is the left arm and Tawrich the right (Jegged; the Zarich page; the Angra page's order of "Tawrich ... and Zarich" names no side). The Tawrich page calls Zarich "the right arm" once. | `[conflict]` §7, resolved: Zarich left |
| Before Chapter 5 | The same fiend roams the dig areas, invisible but for the minimap, where it does not attack and its arms cannot be targeted; it ejects the party with Unnatural Selection after 53 seconds or at a set HP. **Not this chapter.** | `[single source]` (wiki) |
| Music | The battle theme "Aeons" plays in the fight (also the Anything Eater and Humbaba bosses). | `[single source]` (wiki, OST page) |
| The party's level | **No source gives one.** The mission is mid-Chapter 5; the Chapter 5 party band is 43 to 52, and the project's Chapter V preset is Lv 46 / 48 / 50 (`src/data/ffx2/builds/farplane.ts`, used for the Experiment, which is also a Chapter 5 mission). **Release candidate r49-rc ships the party raised by 20 levels (66 / 68 / 70)**, the driver's delegated pick: a party-side estimate; the boss rows are untouched; the Chapter V preset is one constant away (`ANGRA_MAINYU_LEVEL_BONUS` in `src/data/ffx2/builds/angra-mainyu.ts`). | `[estimate]` |

---

## 2. Stat blocks (FF Wiki infoboxes; HP, steal and drop also Jegged)

| Field | Angra Mainyu (bestiary #175, rev 4041096) | Tawrich (#176, rev 3573851) | Zarich (#177, rev 3573852) |
|---|---|---|---|
| Level | 47 | 38 | 36 |
| HP | **333,444** `[verified: 2 sources]` | 5,440 | 5,440 |
| MP | 9,999 | 9,999 | 9,999 |
| Strength | 73 | 85 | 70 |
| Magic | 97 | 42 | 25 |
| Defense | 124 | 99 | (not listed) |
| Magic Defense | 114 | (not listed) | 99 |
| Agility | 68 | 113 | 82 |
| Luck | 2 | 1 | 1 |
| Accuracy, Evasion | (not listed) | (not listed) | (not listed) |
| EXP / AP / Gil | 5,000 / 30 / 5,000 | none listed | none listed |
| Pilfer Gil | 2,000 | | |
| Elements | Gravity halves | Gravity halves | Fire, Ice, Lightning, Water and Holy half; Gravity nulled |
| Statuses | Immune to Silence, Sleep, Darkness, Poison, Confuse, Berserk, Curse, Petrify, Slow, Delay, Stop, Eject, Interrupt, "multi attack", Defense and Magic Defense changes, Death, Doom, **fractional damage** and Reflect | Strength, Magic, Luck, Evasion and Accuracy changes immune | Strength, Magic, Luck, Evasion and Accuracy changes immune |
| Zantetsu | 255 | 255 | 255 |
| Drop | **Ribbon** x1, common and rare `[verified: 2 sources]` | | |
| Steal | **Megalixir** x1, common and rare `[verified: 2 sources]` | | |
| Moves listed | Bio, Curaga, Demi, Dispel, Flare, Full-Life, Osmose, Perdition's Flame, Unnatural Selection (the last only before the final fight) | Bloody Breath (and a plain physical attack) | Fira, Firaga, Blizzara, Blizzaga, Thundara, Thundaga, Watera, Waterga, Glimmer of Despair |
| Immunity to damage | Fractional damage: Demi and Gravity do nothing to it | **Immune to magical attacks** (the Angra page and Jegged) | **Immune to physical attacks** (the Angra page and Jegged) |

The scan texts, in our words: the body is "a fiendish fiend" woken under the sand; Zarich is "an extension" of it that handles the magic, and Glimmer of Despair lowers the party's attributes; Tawrich is another extension that handles the physical attacks and can inflict Silence, Darkness, Poison and Confusion (`[single source]`).

Not listed anywhere read: Accuracy and Evasion of any of the three, Zarich's Defense and Tawrich's Magic Defense, any reward for the arms, what the arms' Gravity or element bytes do beyond the table. `[unsourced]`; the game's rows give them.

---

## 3. The moves (FF Wiki enemy-abilities page rev 3998493, Jegged)

| Move | User | Effect | Tag |
|---|---|---|---|
| **Perdition's Flame** | Angra Mainyu | **Ten** non-elemental physical attacks, **each on a random party member, each taking 3/16 of that member's maximum HP** (Jegged: 18.75 percent each). Based on fractional damage (the wiki says Pernicious Powder's attack reduction does not touch it). With 53,328 or more maximum HP each hit reaches 9,999. | `[verified: 2 sources]` |
| **Demi** | Angra Mainyu | Reduces the party's HP by a quarter (Jegged: 25 percent of current HP). | `[verified: 2 sources]` |
| **Flare** | Angra Mainyu | Non-elemental damage to one target. | `[single source]` (Jegged) |
| **Osmose** | Angra Mainyu | Drains MP from a party member to restore its own. | `[verified: 2 sources]` |
| **Curaga** | Angra Mainyu | Heals one of the arms. | `[single source]` (Jegged) |
| **Full-Life** | Angra Mainyu | Revives a knocked-out arm to full health. | `[verified: 2 sources]` (Jegged, and both arm pages) |
| **Dispel** | Angra Mainyu | Used when the party uses Reflect. | `[single source]` (Jegged) |
| **Bio** | Angra Mainyu | Listed on the wiki; Jegged's list for this fight does not use it. | `[conflict]` §7 |
| **Unnatural Selection** | Angra Mainyu | Ejects the party; only in the encounters before Chapter 5. **Not used.** | `[single source]` |
| **Glimmer of Despair** | Zarich | Reduces the party's MP and lowers Strength, Magic, Defense and Magic Defense by one level. | `[verified: 2 sources]` |
| Elemental magic | Zarich | Fira, Firaga, Blizzara, Blizzaga, Thundara, Thundaga, Watera, Waterga, "from time to time". | `[verified: 2 sources]` |
| **Punch** | Tawrich | Plain physical damage. | `[single source]` (Jegged) |
| **Bloody Breath** | Tawrich | Moderate non-elemental damage and Poison, Darkness, Silence and Confusion. | `[verified: 2 sources]` |

---

## 4. The body's order of moves (Jegged)

Its pattern is the same every time. In order:

1. **Low on MP:** Osmose. (The wiki puts the line at under 200 MP and adds that with no MP left it uses only Osmose, and that with no MP on the party it gets stuck in a loop that does almost no damage.)
2. **An arm is knocked out:** Full-Life on it.
3. **Fifteen turns have passed:** Perdition's Flame.
4. **Otherwise, by chance:** 40 percent Demi, 20 percent Flare, 20 percent Perdition's Flame, 20 percent Curaga on one of its arms.

It **opens the fight with Perdition's Flame and uses it again seven turns later**. Dispel answers Reflect. `[single source]` (Jegged); not stated: whether a chance-rolled Perdition's Flame restarts the fifteen-turn count, whether "turns" are the body's own, whom Osmose, Flare and Curaga pick, how often the arms act and what they choose. `[unsourced]`

Zarich: Glimmer of Despair, and elemental magic now and then. Tawrich: Punch and Bloody Breath. (Jegged; no odds are given.)

---

## 5. The party and what the guides say

- **Party:** Yuna, Rikku and Paine. No level, dresspheres or bag is sourced; Chapter 5 band 43 to 52 (`research/ffx2-vegnagun-shuyin.md` §6), preset Lv 46 / 48 / 50, shipped in release candidate r49-rc raised by 20 levels (66 / 68 / 70: a party-side estimate; the boss rows are untouched; the Chapter V preset is one constant away). `[estimate]`
- **Jegged's first answer:** one girl heals (an Alchemist with Mega-Potions, or a White Mage with Curaga), the other two are Dark Knights. Their Darkness is neither physical nor magical ("special damage"), so it reaches **all three bodies**, ignoring the arms' immunities; they take less damage because of their Defense. Use it again and again on the arms and let the body spend its turns reviving and healing them. `[single source]`
- **Jegged's second answer:** drain the body's MP (a Gunner's Target MP, a Samurai's Magicide, a Thief's Pilfer MP, a Gun Mage's Absorb) and keep the party's MP low too, so the body falls into Osmose. `[single source]`; the wiki adds Soul Springs and Mana Springs, a Lady Luck's Item Reels, a Songstress's Sing against stat loss and the Warrior's Magic Break, and strategies built on two Berserkers and a Gun Mage, `[single source]`.
- **Gear:** protect against Poison, Silence and Darkness; the Ribbon helps (Jegged). `[single source]`

---

## 6. Look

No source in this note describes the body in words beyond "a unique design" and the scan texts. The paintings are ours and provisional (`docs/handoff/ch-angra-mainyu.md`): a horned fiend rising from the sand, and two separate arms. The official art is not used or copied.

---

## 7. Conflicts, gaps and what the game's rows must settle

1. **Which arm is which.** Jegged: Zarich left, Tawrich right. The Zarich page: left. The Tawrich page: "Zarich, the right arm". **Resolved: Zarich left.** (The row order and the scene positions decide it.)
2. **Tawrich and magic.** The Angra page and Jegged: Tawrich is immune to magical attacks. The Tawrich page: it "has very low Magic Defense", so magic works when the party has the MP. **Resolved for the first build: immune** (two sources); the game's rows settle it.
3. **Perdition's Flame:** the wiki says 3/16 of the target's **max** HP per hit; Jegged says 18.75 percent of HP. They are the same number; the base (max or current) is the wiki's. `[verified: 2 sources]`
4. **Bio:** on the wiki's list for the body, not on Jegged's order of moves. **Left out** of the first build.
5. **The 15-turn clock and the 7-turn repeat** are one source; the game's script settles them.
6. **Accuracy, Evasion, the arms' missing defence, the hit rule of each move, the arms' odds** are in no source read.
7. **The level** the party fights it at is an `[estimate]`: the Chapter V preset's 46 / 48 / 50, raised by 20 in release candidate r49-rc (a party-side estimate; the boss rows are untouched; the preset is one constant away).

---

## 8. What the game's own files settle (from `research/re-ffx2-angra-mainyu.md`, 2026-10-14; the guide card cites this section)

The RE session read the game's rows, its three AI scripts and the scene's start positions after the first build above was written. Where it speaks it wins; this section keeps the facts the guide and the first build lean on in one place, in the corpus's own form.

1. **The types of the moves** (the RE note's section 10, the move rows). Perdition's Flame is **physical** and never misses: Protect halves it and Shell does not. Flare, Demi and Zarich's four Ga spells are **magical**: Shell halves them. Punch is physical and is the only move that rolls to hit. Bio and Bloody Breath leave a status (Poison; Silence, Darkness, Poison, Confusion) and Glimmer of Despair takes MP and lowers four stats; none of those three is a blow. `[RE rows, verified]`
2. **The body's order** (the RE note's section 9.5, the script `m268`): the first poll is the opening Flame (HP at least 80 percent); Osmose below 200 MP; Full-Life on a fallen arm, Tawrich before Zarich; the Flame again when the poll counter reaches 15, so on polls 1, 8, 23, 38 and 53; otherwise one roll of five: Flare, Curaga on an arm, Bio, Demi, Demi. This settles items 4 and 5 of section 7: **Bio is in the roll** and the 15-poll clock is the script's own. `[RE script, verified]`
3. **Zarich and Tawrich** (the RE note's sections 9.7 and 9.8): Zarich opens with Glimmer of Despair and then goes round Firaga, Waterga, Thundaga and Blizzaga, with a Glimmer on every seventh poll; Tawrich throws seven Punches and then a Bloody Breath. `[RE script, verified]`
4. **Where the rows beat the wiki:** Gravity is nulled on all three (not halved), Reflect lands on the body (not immune), Accuracy is 95 and Evasion 0, and Zarich's Defense and Tawrich's Magic Defense are 0. Items 2 and 6 of section 7 stay as written: the arms' immunities are the one point the rows only hint at (`[inferred]`, group-2 slots 15 and 16). `[RE rows, verified]`

---

## Sources

- Final Fantasy Wiki (Fandom), through the MediaWiki API: *Angra Mainyu (Final Fantasy X-2)* rev 4041096; *Tawrich* rev 3573851; *Zarich* rev 3573852; *Final Fantasy X-2 enemy abilities* rev 3998493; *Excavation minigame*; *Episode Complete*; *Final Fantasy X-2 OST*.
- Jegged.com, *Final Fantasy X-2 Walkthrough: Chapter 5 - Bikanel Desert* (Mission: Showdown in the Sands).
- `docs/plans/next-content-2026-09-27.md` (the candidate ranking and the wiki revision, read earlier).
- `research/ffx2-combat-core.md` §3 and `research/ffx2-vegnagun-shuyin.md` §6 (the multi-hit random-target rule; the Chapter 5 party band and the Ribbon's effect).
