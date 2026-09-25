# FINAL FANTASY X-2 — Trema at the bottom of the Via Infinito (Cloister 100), and Paragon before him

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-24 ~21:45 EDT: "I'll go with Seymour Omnis and Trema". This file is the Trema half (decision D-134 in `docs/target/decisions.json`). Seymour Omnis is FFX and is researched separately.
**Research date:** 2026-09-24
**Game case (AGENTS.md rule 14):** **FFX-2 only.** Everything here is FFX-2 data (ATB, dresspheres, Garment Grids, Spherechange, Oversoul, Mix). Nothing transfers to an FFX chapter. Two things look like FFX but are not: Paragon shares its model with FFX's Nemesis, and Trema shares his with FFX's unsent priest at the Zanarkand Dome. Neither shares that FFX enemy's data.
**Recommendation (§1.3):** **A two-link chapter on Cloister 100: Paragon, then Trema, with HP, MP and status carried over.** That is how the game stages it, and Trema's entrance (he kills Paragon himself) is the story beat. Use the **International / HD Remaster** data. Four questions go to Bailey before anything is built (§9): the version, the fight length, the Lv 99 party, and the music.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

The tags follow `research/ffx2-fallen-aeons.md` §0.1.

| Tag | Meaning |
|---|---|
| `[SinirothX]` | SinirothX, *Enemy Encyclopedia* (GameFAQs FAQ 31807, v1.3, 2007): a stat, attack and AI dump taken from the game's data. It is the ranked first FFX-2 source in this repo (`ffx2-vegnagun-shuyin.md`, "Primary data source ranking"). Its `<...>` brackets mark changes in the International version (FAQ §"Note on '<>' Brackets"). |
| `[verified: N sources]` | N independent sources agree. The FF Wiki counts once, however many of its pages say it. **Split_Infinity (GameFAQs) and GamerGuides are the same author, Damir Kolar, so together they count once.** `ffx2-fallen-aeons.md` counted them twice; see §10 T-12. |
| `[single source]` | Only one source says it. |
| `[derived]` | I computed it from sourced constants. |
| `[estimate]` | My own judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §10 with what to do. |

### 0.2 What I did

1. Read `research/ffx2-fallen-aeons.md` for the structure, then `ffx2-vegnagun-shuyin.md` §6 (party method), `ffx2-combat-core.md` (damage cap, Cat Nip, Iron Duke), `src/battle/ffx2/constants.ts` (the engine's 9,999 and 99,999 caps), the `public/art` listing and `docs/target/decisions.json` D-134. All read only.
2. Read the Final Fantasy Wiki through `api.php?action=parse&prop=wikitext` with a browser user agent. Page titles and revision ids are under Sources.
3. Read the GameFAQs documents listed under Sources into scratch on D: (`D:/Tools/pyrefly-scratch/trema/`), plus GamerGuides' HD page for the Via Infinito. Nothing from them is saved in the repo, and no file was downloaded into the project.
4. Compared every stat, AI and trigger field across the sources and wrote down each disagreement (§10).

### 0.3 Which versions exist, and what changes for Trema

| Version | Trema changes | Source |
|---|---|---|
| **Original** (PS2: Japan 2003, North America and Europe 2003–2004) | Base data. **Meteor is physical** (Protect halves it, a Warrior's Sentinel reduces it to 1 per hit). Gunner + **Cat Nip** (every hit does 9,999 at Critical HP) with Trigger Happy is the standard way to kill him. | wiki Trema (boss); Split_Infinity; NightMare185; nemes1s; Paradisio `[verified: 4 sources]` |
| **International + Last Mission** (PS2, Japan, 2004) | Trema gains **Spellspring** as an auto-status (spells cost no MP). **Meteor becomes magical** (Shell halves it, Sentinel no longer works). Cat Nip gains Auto-Berserk and Auto-Slow, so the Trigger Happy trick is gone. Trema can be captured (Creature Creator) and fought again in the Fiend Arena's Farplane Cup. | Spellspring: Split_Infinity *Version Differences* §18 + SinirothX `<Spellspring>` `[verified: 2 sources]`. Meteor magical: wiki only `[single source]`, and see T-3. Cat Nip: wiki + `ffx2-combat-core.md` §3.1 `[verified: 2 sources]`. |
| **HD Remaster** (2014 onward) | Built on International. Adds the gold trophy **"Founder"** for defeating Trema. | wiki Trema (boss); GamerGuides `[verified: 2 sources]` |

**The Fiend Arena Trema is a separate stat block** (§3.3). The wiki says he fights "identically" apart from his stats and rewards, and you start that fight at full HP and MP. It has no story. Do not mix its numbers with the Via Infinito fight.

---

## 1. The answer: where and when, what corrects the brief, what the chapter is

### 1.1 Where and when (the driver's description checked)

- **Confirmed:** Trema is fought at the **bottom of the Via Infinito, Cloister (floor) 100, under Bevelle** `[verified: 4 sources — wiki Via Infinito and Trema (boss), SinirothX formation "Bevelle - Secret Dungeon - Level 100 - BOSS 229 Trema 1", GamerGuides, NightMare185]`.
- **When:** Chapter 5. The Via Infinito opens in Chapter 5 through a glowing glyph in the chamber to the right inside Bevelle's temple (New Yevon HQ), which the **Kinderguardians** (Pacce and his friends) found `[verified: 4 sources — wiki Via Infinito and Kinderguardians, GamerGuides, NightMare185, Blackestmage]`. It is an **optional bonus dungeon**. Trema is the game's **superboss**, not a story boss `[verified: 2 sources — wiki, GamerGuides]`.
- **Correction 1: it is two bosses in a row, not one.** On Cloister 100 the party first fights **Paragon**. When Paragon falls, Trema appears, finishes it off himself, and the Trema battle starts **with no healing and no chance to change equipment**. The party starts it in whatever state the Paragon fight left them `[verified: 5 sources — wiki Trema (boss), wiki Paragon, Split_Infinity, Blackestmage, Paradisio; nemes1s says the same]`. Spherechanging during battle is still allowed, and the strategies use it (§5).
- **Correction 2: "former leader" is right, but he is the *founder*, and an unsent.** Trema founded New Yevon and led it first. The Ultimania adds that he was already an unsent when he did, having posed as an "Unaffiliated Yevon Priest" to get inside Yevon (wiki, citing *Final Fantasy X-2 Ultimania Omega* p. 88). He walked into the Via Infinito about a year before the game and never came out `[verified: 3 sources — wiki Trema and New Yevon (one source), Ultimania timeline translation by Ryu Kaze, Blackestmage's account of Paine's floor-20 line]`. After him came an unnamed chairman and then Baralai as Praetor (wiki New Yevon).
- **Iron Duke** is the reward for beating him `[verified: 4 sources — wiki, Split_Infinity/GamerGuides, Blackestmage, 3D Delta]`. `ffx2-combat-core.md` already has its stats.

### 1.2 The Via Infinito bosses on the way down

A Great Cloister every 20 floors, each with a boss except Cloister 0. From Cloister 0 you can teleport to any Great Cloister you have already reached. Every floor has a blue glyph that fully heals and can warp you out `[verified: 3 sources — wiki, GamerGuides, NightMare185]`.

| Cloister | Boss | Who it was (wiki) | Level / HP `[SinirothX]`, HP cross-checked with GamerGuides | Signature |
|---|---|---|---|---|
| 20 | **Aranea** | Maester Wen Kinoc | Lv 52 / 18,280 | 4 turns of Attack or Bite, then Gooey End (Poison, Stop, Str and Mag down) |
| 40 | **Black Elemental** | Lord Jyscal Guado | Lv 88 / 9,999 | Flare, Ultima, Berserk, Magic Up; reward chest with Cat Nip and Speed Bracer |
| 60 | **Concherer** | Grand Maester Yo Mika | Lv 96 / 343,280 | Megaton Press (DC 254, ignores Defense), Gunk (MP to 0, Poison) |
| 80 | **Chac** | Lady Yunalesca (after a scene of her embracing Zaon) | Lv 98 / 437,850 | Stony Glare (Petrify through any protection), Heaven's Cataract (−10 levels to Def, MDef, Acc, Eva, Luck) |
| **100** | **Paragon**, then **Trema** | Lord Zaon, then Trema | Lv 99 / 200,000; Lv 99 / 999,999 | §3, §4 |

Floors 81 to 99 also throw the earlier bosses at you as random encounters, which you can escape; Elder Drakes and Mega Tonberries roam the floors `[single source: wiki]`.

### 1.3 Recommendation: Paragon → Trema, one chapter of two links

1. **Faithful to the staging.** The game ties the two together: no heal, no gear change, and Trema's entrance is him killing Paragon. A Trema-only chapter at full HP exists only as the International / HD Fiend Arena bout, which has no story.
2. **Both fights are well sourced.** SinirothX gives full blocks and AI for both. HP, rewards and triggers agree across three to five sources. The open items (§10) are specific and few.
3. **Two different puzzles.** Paragon punishes the wrong kind of attack: anything that goes through Protect or Shell draws **Big Bang** (DC 250). Trema is endurance: 999,999 HP, 99 Evasion, two Meteors and an Ultima set off by his HP. The carry-over makes the first fight's cleanup part of the second.
4. **Leave out the other four Great Cloister bosses.** They sit 20 to 80 floors up, and the game lets you heal and warp out between them. Chac is Yunalesca, a boss we already have (FFX, Chapter 2). None of them is part of Trema's story. If Bailey wants more of the dungeon, a separate chapter could cover them. I do not recommend one.
5. **Fallback if Bailey wants one fight:** **Trema alone**, starting from full HP and MP, using the **Fiend Arena** block (§3.3). That is a sourced full-HP Trema, not an invented one. It loses the Paragon story beat.

`[estimate]` for the recommendation as a whole; each reason above is sourced.

---

## 2. The shape of the chapter

| Step | What happens | Source |
|---|---|---|
| 0 | (Context only.) On Cloister 0 an old man tells the Kinderguardians about a man called Trema who went down the dungeon and never came back, then vanishes; the children run home. Crimson Sphere 6 is on the floor. | NightMare185 (calls him "a Maester"), Blackestmage, Paradisio `[verified: 3 sources]` |
| 0b | (Context only.) After Aranea on Cloister 20, Paine explains that Trema founded New Yevon and went in a year ago, and wonders whether he was already dead then. | Blackestmage; wiki Trema ("Paine theorizes...") `[verified: 2 sources]` |
| 1 | **Link 1: Paragon.** Music: "The Bevelle Underground". | §4.1; music §6.3 |
| 2 | Paragon falls. The old man from Cloister 0 appears, destroys Paragon "in quite an impressive scene", reveals himself as Trema, founder of New Yevon, explains why he did what he did, and challenges the party. | Blackestmage; Paradisio ("finish off Paragon in a super powered combo"); wiki Trema `[verified: 3 sources]` |
| 3 | **Link 2: Trema.** It starts from the state Paragon left. Music: "New Yevon". | §4.2 |
| 4 | Trema is beaten. Yuna tells him what she fights for: the memories she made with her friends. Trema says, "You are the paragon of pastlessness", and fades away. The Iron Duke is awarded. The party drops through the hole to leave. | Blackestmage (Yuna's answer, the vanishing, the Iron Duke); wiki Trema (the quote) `[verified: 2 sources]` |
| 5 | Afterwards Paragon can be fought again at the far end of Cloister 100, behind a Tonberry. There is no Episode Complete; the Bevelle hotspot is gone. | wiki Paragon; Split_Infinity; nemes1s |

**Unsourced:** the exact wording of Trema's speech before the fight in step 2. Two lines are quoted on the wiki (§7.2). Everything else comes only from guides' paraphrases. **Our dialogue will be written separately anyway** (`research/writing-bible.md`); these beats are for tone.

---

## 3. Stat blocks

### 3.1 Trema, Via Infinito (story version; bestiary #243 on the wiki)

| Field | Value | Confidence |
|---|---:|---|
| Level | 99 | SinirothX + wiki `[verified: 2 sources]` |
| **HP** | **999,999** | SinirothX, wiki, Split_Infinity, GamerGuides, NightMare185, Blackestmage, 3D Delta `[verified: 6 sources]` |
| MP | **999** | SinirothX, wiki, Split_Infinity, NightMare185, 3D Delta `[verified: 5 sources]` (zero_six's incomplete entry prints 9,999; T-9) |
| STR / MAG / DEF / MDEF | **255 / 255 / 255 / 255** | SinirothX + wiki; Split_Infinity: "255 stats in STR, MAG, DEF and MDEF" `[verified: 3 sources]` |
| Agility | **129** (SinirothX) / 128 (wiki) | `[conflict, minor]` T-8. Use 129. |
| **Evasion** | **99** | SinirothX + wiki `[verified: 2 sources]`. Normal attacks almost never hit him without a very high Luck (wiki; Split_Infinity's Lv 99 Dark Knight "hit Mr T. for measly 500"). |
| Luck / Accuracy | 26 / 0 | SinirothX (wiki: Luck 26, no Accuracy field) |
| EXP / AP / Gil / Pilfer gil | 10,000 / 50 / 10,000 / 300 | SinirothX + wiki; EXP, AP and gil also Split_Infinity and GamerGuides `[verified: 3 sources]` |
| Elements | neutral to Fire, Ice, Lightning, Water and Holy; **Gravity immune** | SinirothX, wiki, Split_Infinity, GamerGuides `[verified: 4 sources]` |
| Status immunities | Instant Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, **Slow, Stop**, **every stat Up/Down**, Doom, Delay, Interrupt, fractional damage, Reflect (wiki); Zantetsu resistance 255 | SinirothX + wiki + Split_Infinity `[verified: 3 sources]`. Nothing lands on him: no Breaks, no Slow, no Demi-type damage. |
| Auto-status | **Spellspring** (International / HD only) | SinirothX `<Spellspring>` + Split_Infinity *Version Differences* `[verified: 2 sources]` |
| Drop / rare drop | Dark Matter / Dark Matter ×2 (drop rate 100%) | SinirothX, wiki, GamerGuides `[verified: 3 sources]` |
| Steal / rare steal | Ether / Turbo Ether; SinirothX says Turbo Ether ×2, the wiki ×1; steal rate 128 (about 50%) | `[conflict, minor]` T-10 |
| Bribe | not possible | SinirothX, Split_Infinity |
| Reward | **Iron Duke** | §1.1 |
| Scan | "The founder of New Yevon. He is now a dark puppeteer, able to bend Spira's most powerful fiends to his will. He once operated a training academy for Spira's youth." | SinirothX + wiki + zero_six (identical) |

### 3.2 Paragon, Via Infinito (bestiary #119 on the wiki)

| Field | Normal | Oversoul | Confidence |
|---|---:|---:|---|
| Level | 99 | 99 | SinirothX + wiki |
| **HP** | **200,000** | **210,000** | SinirothX, wiki, Split_Infinity, GamerGuides, zero_six `[verified: 4 sources]` |
| MP | 9,999 | 9,999 | same |
| STR / MAG / DEF / MDEF | **SinirothX: 244 / 244 / 88 / 88** · **wiki: 244 / 88 / 244 / 89** | SinirothX Oversoul MDEF 89 | `[conflict]` **T-6**, blocks the build |
| Agility | 188 | 244 | SinirothX + wiki |
| Luck / Accuracy | SinirothX: Luck 13, Acc 0 · wiki prints "Accuracy 13" and no Luck | SinirothX Luck 16 | The wiki's field is probably mislabelled; use SinirothX |
| EXP / AP / Gil | 9,000 / 1 / 3,000 | 13,000 / 2 / 8,000 | SinirothX, wiki, Split_Infinity, GamerGuides, zero_six `[verified: 4 sources]` |
| Pilfer gil | 4,000 (SinirothX, wiki) / 3,000 (zero_six) | 6,800 / 4,500 | minor, T-11 |
| Elements | neutral; Gravity immune | | all sources |
| Status immunities | the same list as Trema (not Reflect) | | SinirothX + wiki + Split_Infinity |
| Drop / rare | Supreme Gem / Dark Matter | Dark Matter / Dark Matter ×2 | SinirothX, wiki, GamerGuides, zero_six |
| Steal | Supreme Gem / Supreme Gem ×2 (25%) | same (12%) | SinirothX + wiki |
| Bribe | Dark Matter ×10 / ×20 (800,000 gil per the wiki) | ×24 / ×30 | SinirothX + wiki |

**Oversoul.** Paragon arrives Oversouled if the player has killed ten Omega or Ultima Weapons first `[verified: 2 sources — wiki, Split_Infinity/GamerGuides]`. Every guide calls the Oversoul form *easier* (§4.1). Which form the chapter uses is a design question (§9 Q3).

### 3.3 Trema, Fiend Arena (International / HD only; fallback use only)

| Field | Value | Source |
|---|---:|---|
| Level / HP / MP | 99 / 999,999 / 999 | SinirothX (Colosseum) + wiki `[verified: 2 sources]` |
| STR / MAG / DEF / MDEF / Evasion | 255 / 255 / 255 / 255 / 99 | same |
| **Agility / Luck** | **95 / 128** (story: 129 / 26) | same |
| Accuracy | 26 | SinirothX only |
| EXP / AP / Gil / Pilfer | 2,000 / 1 / 3,000 / 3,000 | same |
| Drop / rare | Dark Matter ×2 / ×3 | same |
| Steal | Turbo Ether / Turbo Ether ×2 (rate 64) | same |
| AI weights | Demi **1/6**, Flare **1/12** (story: 1/8 and 1/8); the rest as story | SinirothX Colosseum entry (its pattern text is cut off after Waning Moon) `[single source]` |
| Start state | full HP and MP (no Paragon before him) | wiki |

---

## 4. Actions and AI

Damage constants (DC) are `[SinirothX]`. The formulas are in `research/ffx2-combat-core.md` §2; the engine already has the 9,999 cap and the 99,999 Break Damage Limit cap (`src/battle/ffx2/constants.ts`).

### 4.1 Paragon

| Action | Effect | DC / type |
|---|---|---|
| Normal Attack 1 | one target, Poison (chance 100) | 16, physical |
| Normal Attack 2 | one target, Itchy (always) | 16, physical |
| Normal Attack 3 | one target, Poison (always) and Confuse (chance 120) | 16, physical |
| Normal Attack 4 | one target, **ignores Defense** (wiki: 8,273 to 9,342 observed) | 16, physical |
| Normal Attack 5 | one target, drains HP | 16, physical |
| **Genesis** | everyone in a 150° arc in front of it (wiki: 180°); **removes Auto-Life, Shell, Protect, Reflect, Regen, Haste, every stat change and Spellspring** | 44, magic |
| **Big Bang** | whole party (Split_Infinity: about 25,000 even at maximum MDEF; wiki: up to 99,999) | **250**, magic |

**AI, normal form** `[SinirothX]`, prose matching on the wiki and in Split_Infinity:

```
(1) 1/4 each: Normal Attack 1 / 2 / 3 / 4
(2) 1/2 Normal Attack 5, 1/2 Genesis
(3) back to (1)
Counter: hit by any attack that Shell or Protect cannot reduce  ->  Big Bang
```

Examples of attacks that trigger Big Bang: Dark Knight's Darkness, Absorb, 1000 Needles (Split_Infinity); Nooj's Lightfall (wiki). The wiki also says it uses Big Bang "if the party doesn't attack it for too long". SinirothX's normal-form script has no such rule; only its Oversoul script does (T-7).

**AI, Oversoul form** `[SinirothX]`, summarised. It waits and does nothing until it is hit or its HP or MP changes. It **copies** Black Magic, Arcana (except Black Sky), MP Absorb, Supernova, Dispel, Haste, Hastega and Holy back at the attacker, answers healing and buffs with Demi, and otherwise uses a Normal Attack. After 20 seconds of being left alone it uses Judgment, Genesis or Big Bang (or Dispel if anyone has Reflect). Below 4/10 HP: 1/2 Normal Attack, 1/8 each Firaga, Blizzaga, Thundaga or Waterga on everyone. Below 1/10 HP: Ultima, Holy, Judgment, Genesis or Big Bang at 1/5 each, plus **Final Impact** once (14 random hits of 1/8 of max HP and MP). Its physicals **miss** in Oversoul (Split_Infinity, GamerGuides, Blackestmage) `[verified: 2 sources]`.

### 4.2 Trema

| Action | Effect | DC / type | Source |
|---|---|---|---|
| **Dying Star** | one target, 3 hits | 3 ×3, physical, can break the damage limit | SinirothX + wiki + Split_Infinity |
| **Falling Leaf** | one target, 3 hits; always follows Dying Star | 1 ×3, physical | same |
| **Thundering Wave** | one target, 3 hits; always follows Falling Leaf | 4 ×3, physical | same |
| Choking Mist | one target, 3 hits, **Poison** (always) | 4 ×3, physical | same |
| Beguiling Mire | one target, 3 hits, **Stop** (chance 120) | 4 ×3, physical (Fiend Arena: 5 ×3) | same |
| Waning Moon | one target, 3 hits, each takes **5/16 of current MP** | fractional | same |
| Demi | whole party, 1/4 of current HP, Gravity, 10 MP | fractional | SinirothX + wiki |
| Flare | one target, 54 MP | **55**, magic | SinirothX + wiki |
| **Ultima** | whole party, 90 MP | **70**, magic | SinirothX + wiki |
| **Meteor** | **12 hits** on random party members, each **1/8 of max HP**; no MP cost | "fractional" (SinirothX); physical in the original, magical in International / HD (wiki) | hits T-2, type T-3, cap T-4 |

The chained Dying Star → Falling Leaf → Thundering Wave can land on one girl or be split across the party (Split_Infinity). The three-part chain hits whatever the target's Evasion and Luck; a high Luck lets you dodge Mist, Mire and Moon (Split_Infinity; the wiki says "many of which always hit") `[verified: 2 sources]`. The wiki adds that his attacks have **no charge time and a short recovery** `[single source]`. Observed damage with a well-defended Lv 99 party: 300 to 1,500 per hit (NightMare185) `[single source; depends on the party]`.

**AI** `[SinirothX]`. The HP triggers agree with the wiki; §10 lists the dissent.

```
Basic pattern:
(1) 1/2 Dying Star, 1/8 Demi, 1/8 Flare, 1/12 Choking Mist, 1/12 Beguiling Mire, 1/12 Waning Moon
(2a) after Dying Star: Falling Leaf, then (3a) Thundering Wave, then back to (1)
(2b) after anything else: back to (1)
HP triggers (each fires once, at the next chance):
  HP < 1/2 max  -> Meteor      (499,999 HP left)
  HP < 1/4 max  -> Meteor      (249,999 HP left)
  HP < 1/6 max  -> Ultima      (166,666 HP left)
```

- **Meteor twice and only twice**, at 50% and at 25% of HP left `[verified: 4 sources — SinirothX, wiki, Split_Infinity, NightMare185]`.
- **Meteor works at 0 MP.** Draining his MP (Soul Spring, Mana Spring, the Gunner's Target MP) stops Demi, Flare and Ultima but not Meteor `[verified: 4 sources — NightMare185, nemes1s, Blackestmage, Split_Infinity]`. Whether draining still stops his spells in International / HD, where he has Spellspring, is **open** (T-5).
- `[derived]`: 12 hits of 1/8 of max HP spread over three targets average 4 hits, or **50% of max HP**, per girl. All 12 on one girl is **150%**, a certain KO. This is why the guides say to keep everyone above about 75 to 90% before each Meteor (Split_Infinity: 75%; wiki: "over 9000 HP or at least 90%").
- `[derived]`: 999,999 HP at the 9,999 cap needs at least **101 capped hits**. Split_Infinity's two Dark Knights did about 5,000 per Darkness, and the clear "lasted around 30 minutes". §9 Q2.
- NightMare185's percentages ("3-attack combo about 90%", and so on) are his impression from playing, and he says they vary. SinirothX's weights come from the data. Use SinirothX.

---

## 5. The party and builds at that point

- **Party:** Yuna, Rikku, Paine. Dresspheres, Garment Grids and accessories as available in Chapter 5, plus what the dungeon itself hands out (Cat Nip and Speed Bracer on Cloister 40).
- **Level: 99.** Split_Infinity "Girls all Lv99"; GamerGuides "Come in at Level 99" (after grinding "to Level 75-99"); Blackestmage says to level to the maximum from Cloister 20 on; the wiki says to have "max stats" `[verified: 3 sources, counting Kolar once]`. This is **far above** our Chapter 5 preset (Lv 45–52, `ffx2-vegnagun-shuyin.md` §6.1). The chapter needs its own preset.
- **In a dressphere, the girls' stats are identical** except in Mascot, Trainer and the special dresspheres (`ffx2-vegnagun-shuyin.md` §6.1). Lv 99 rows from the wiki's dressphere tables (transcribed game tables) `[single source]`:

| Dressphere, Lv 99 | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dark Knight | 5,355 | 338 | 175 | 109 | 151 | 105 | 42 | 105 | 3 | 11 |
| Warrior | 4,122 | 168 | 168 | 56 | 132 | 13 | 54 | 103 | 6 | 13 |
| Alchemist | 2,553 | 107 | 125 | 29 | 52 | 35 | 58 | 124 | 4 | 12 |
| White Mage | 2,294 | 350 | 20 | 154 | 21 | 194 | 55 | 103 | 7 | 12 |
| Gun Mage | 2,523 | 288 | 152 | 149 | 51 | 97 | 59 | 127 | 4 | 11 |
| Gunner | 2,837 | 123 | 137 | 73 | 58 | 58* | 57 | 131 | 4 | 24 |
| Mascot (Yuna / Rikku / Paine) | 6,647 / 6,594 / 6,521 | 572 / 582 / 426 | 163 / 155 / 172 | 149 / 156 / 137 | 143 / 141 / 140 | 130 / 143 / 130 | 66 / 66 / 63 | 130 / 128 / 137 | 19 / 19 / 12 | 18 / 17 / 19 |

\* The wiki's Gunner table copies Defense into Magic Defense; the algorithm gives about 48 at Lv 99 (`ffx2-combat-core.md`, data warning).

- **What players actually bring** (each is a strategy the chapter should allow):
  - **Two Dark Knights plus a healer**: Alchemist (Split_Infinity, Blackestmage) or White Mage opened as Gun Mage for Mighty Guard (GamerGuides). Darkness gets past Trema's 255 Defense and is the main damage `[verified: 3 sources]`. **Darkness must not be used against Paragon's normal form**, because it draws Big Bang.
  - **The Valiant Lustre Garment Grid**: each gate crossed adds +40 Defense, and GamerGuides and Split_Infinity cross two with quick Spherechanges while Trema cannot act; the wiki uses its edge for maximum HP, Defense and Magic Defense `[verified: 2 sources]`.
  - **Drain his MP first** (Soul Spring, Mana Spring, Target MP) `[verified: 4 sources]`.
  - **Stamina Tonic** (doubles HP), Megalixir, Light or Lunar Curtain, Chocobo Wing (Haste), Defense Bracer (Protect and Shell), Crystal Bangle (+100% HP), Rabite's Foot (Luck, so Mist, Mire and Moon miss) `[verified: 3 sources]`.
  - **Original only:** Gunner at Critical HP + Cat Nip + Trigger Happy (about 150,000 per round, wiki) `[verified: 4 sources]`.
  - **International / HD:** three **Mascots** on the **Higher Power** grid (Break Damage Limit), Rikku with a Rabite's Foot chaining into Paine's Cactling Gun for 70,000 to 99,999; Dark Matter + any item in Mix = the party is **Invincible**; captured fiends `[single source: wiki]`.
- **Art on disk for the party** (`public/art/characters/`, not approved or rejected here): Dark Knight, White Mage and Gunner for all three girls; Alchemist for Rikku; Warrior for Yuna and Paine. **No Mascot and no Gun Mage paintings exist.**

---

## 6. Arena, the characters' look, music

### 6.1 Arena

- **The Via Infinito:** a descending stack of 100 cloisters. You drop through a hole in the floor to go down and can never climb back up. Every floor has **upside-down banners bearing Yu Yevon's likeness**. Pyreflies and Yevon flags are everywhere (Blackestmage). A blue glyph heals and teleports you `[verified: 2 sources — wiki, Blackestmage]`.
- **Cloister 100 itself:** the wiki has a picture captioned "Final Cloister" (not viewed). After Trema, Paragon waits "at the far end of the room" with a Tonberry in front (wiki), so it is one large room. **No source I read describes it in words.** Look at the wiki's pictures before any art options (§9 Q5).
- The wiki's Trema page has a picture captioned "An illusion of Zanarkand created by Trema", with no text saying when it appears. **Unverified; do not stage it** until a source places it.
- **Nearest existing assets:** `public/art/backdrops/bevelle-underground.png` (Chapter 4) is the same Bevelle underworld family, and the Via Infinito's field music is also used in the Bevelle Underground labyrinth (wiki OST). Whether it can serve as a base is an art-options question for Bailey (rule 9), not a decision here.

### 6.2 The characters' look

- **Trema:** an old man in a torn Yevon priest's robe, fast and agile despite his age; he uses the same model as the unsent priest at the Zanarkand Dome in FFX `[single source: wiki]`. The International and HD versions have battle and field idle images on the wiki (not fetched). **New art:** a new subject, original work only (rule 8).
- **Paragon:** Lord Zaon's fiend form, which uses FFX's Nemesis model (wiki, Paragon and Zaon pages) `[single source]`. **New art.** Nothing on disk comes close.

### 6.3 Music

| Moment | Track (FFX-2 OST) | Source |
|---|---|---|
| **Trema battle** | **"New Yevon"** (1:37; Japanese title *Shin Ebon Tō*, "The New Yevon Party") | wiki Trema and OST pages `[single source]` |
| Paragon battle | "The Bevelle Underground" (2:01) | wiki OST page `[single source]` |
| Via Infinito floors | "Disquiet" (2:11, also called "Anxiety") | wiki Via Infinito + OST `[single source]` |
| Great Cloisters | "Bevelle's Secret" (1:14) | wiki OST `[single source]` |

The game already has `scene-bevelle-underground` (an original cue). There is **no New Yevon-style original cue**. Whether this chapter needs one, or which existing cue it reuses, is Bailey's call by ear (rules 9 and 13).

---

## 7. Story: who Trema is, what he says, and why

### 7.1 Background (sourced; wiki citing the *Ultimania Omega* p. 88, plus the Ultimania timeline translation)

- After Sin fell, Trema, "a former denizen of Yevon", started **sphere hunting** (he led a group called the Seekers) and **founded New Yevon** half a year after Sin's defeat to steady Bevelle. He later **closed the training facility on the Calm Lands**, the Monster Arena, which he had taken over from Lord Mi'ihen (its founder 800 years earlier, per the wiki) to train Crusaders. He had seen that after each Sin, soldiers with nothing left to fight turned on each other, and decided people needed spiritual training, not physical `[verified: 2 sources — wiki Trema and New Yevon; Ryu Kaze's Ultimania timeline translation]`.
- **His real aim** in having people collect spheres was not to find Spira's truths but to **erase the past**. He believed "people must rid themselves of the past to become stronger". A year after Sin's defeat he took the spheres New Yevon had gathered down into the Via Infinito, **destroyed them there**, and disappeared `[verified: 2 sources — wiki; Ultimania timeline: "enters the mausoleum of Saint Bevelle... and destroys the collected spheres"]`.
- **He was an unsent all along**, posing as an "Unaffiliated Yevon Priest" (wiki, Ultimania) `[single source, citing the Ultimania]`. In the Via Infinito he commands its fiends; his Scan calls him "a dark puppeteer".

### 7.2 What he says (game text; short lines only)

- Before the battle: "Now, show me. Show me the strength that you have gained!" (wiki Trema (boss)) `[single source]`.
- After his defeat, to Yuna: "You are the paragon of pastlessness." (wiki Trema) `[single source]`.
- **In battle** (wiki boss page, agent_0042's *Battle Quotes List*) `[verified: 2 sources]`: "The unenlightened shall fall." (with Demi); "Now, prostrate before me." / "Be flung unto the Farplane!" (with Ultima); before his first Meteor he chants a line from the **Hymn of the Fayth**, "Ha sa te ka na e Ku ta ma e", and "Release your past and tower above all." goes with Meteor too. The wiki also lists "Know your place!" and "I know nothing of defeat."
- **The reasoning** (from the guide paraphrases): he tells the party why he destroyed the past and asks to see what strength they have gained. Yuna answers that she fights for the memories of her time with her friends, the reverse of his creed. He calls her the paragon of pastlessness and fades (Blackestmage, wiki). **No full transcript was found**, so beats only.

### 7.3 Why it fits Pyrefly

Trema is FFX-2's argument about the past (spheres, memory, letting go), put in the mouth of an unsent priest. It mirrors Shuyin (who cannot let go) and closes the New Yevon thread of our Chapter 4 (Bahamut under Bevelle). `[estimate]`: a note on theme, not a sourced claim.

---

## 8. Minimum mechanic list (FFX-2 only)

1. **Carry-over between links:** HP, MP, KO and status go from Paragon into Trema; no equipment changes; Spherechange stays available.
2. **HP-triggered one-shot actions:** Meteor at < 1/2 and < 1/4, Ultima at < 1/6, each once.
3. **Fixed follow-ups:** Dying Star → Falling Leaf → Thundering Wave, with each part choosing its own target.
4. **Actions that need no MP** (Meteor) alongside actions gated by MP (Demi 10, Flare 54, Ultima 90), plus Spellspring in International / HD (T-5).
5. **Fractional hits:** Meteor at 1/8 of max HP, Waning Moon at 5/16 of current MP, Demi at 1/4 of current HP.
6. **Paragon's counter rule:** an attack that ignores Shell or Protect draws Big Bang. The engine needs a flag on each ability for whether Protect or Shell reduces it.
7. **Genesis strips buffs**, Auto-Life included.
8. **Break Damage Limit and 999,999 HP** show in the HUD (the cap constants exist in `src/battle/ffx2/constants.ts`; the HP bar and number layout at seven digits need checking).
9. **Before any of this is built:** end-state options for Trema, Paragon, Cloister 100, the Lv 99 party (including whether Mascot and Gun Mage are needed) and the music (rules 9 and 13).

---

## 9. Questions for Bailey (none decided here)

| # | Question | Options | My lean `[estimate]` |
|---|---|---|---|
| **Q1** | Which version's Trema? | (a) Original: Meteor physical, no Spellspring, Cat Nip trick live; (b) International / HD: Spellspring, Meteor magical (T-3), Cat Nip nerfed | **(b).** It is the version sold today, and in (a) Cat Nip + Trigger Happy decides the fight. |
| **Q2** | Length. A faithful clear takes about 30 minutes (Split_Infinity); at least 101 capped hits. **Never tune his numbers** (house rule). | (a) Faithful, with a Lv 99 party carrying the sourced tools (Break Damage Limit via Higher Power, Mix Invincible, Mascot); (b) the same, plus a mid-fight checkpoint at each Meteor; (c) show Bailey a measured run of each before choosing | **(c)**: measure first, then ask once. The same approach as the Acta Est Fabula decision. |
| **Q3** | Paragon's form | Normal (Big Bang counter) or Oversoul (ten Omega kills first; misses with its physicals, easier according to every guide) | **Normal.** It is what you meet without preparing for it, and its one rule (no Protect/Shell-piercing attacks) is a clean puzzle. |
| **Q4** | The party preset | Two Dark Knights + Alchemist (existing paintings), or the Mascot build (no paintings) | **Two Dark Knights + Alchemist,** which three sources use and our art already covers. |
| **Q5** | Arena, Trema, Paragon art, and the music cue | Options round per rule 9 | Look at the wiki's "Final Cloister" and Trema pictures first (read only, no downloads). |

---

## 10. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| T-1 | **Ultima threshold:** < 1/6 of max HP (SinirothX; wiki "after losing 83.3%") vs "after he loses 75%" (Split_Infinity) vs "after 85%" (NightMare185, observed). | Use **1/6** `[verified: 2 sources]`; the others are observations. |
| **T-2** | **Meteor hit count:** 12 (SinirothX, wiki) vs 10 ("up to 10 hits on one girl", Split_Infinity; "ten random-target hits", GamerGuides; one author). | Use **12** `[verified: 2 sources]`. |
| **T-3** | **Meteor type in International / HD:** magical and halved by Shell (wiki) vs "Yes, Meteor is physical" (GamerGuides' **HD** guide). SinirothX says "fractional". Everyone agrees it is physical in the original. | **Open.** It decides whether Protect/Sentinel or Shell is the answer. Needs a second source for International / HD. |
| **T-4** | **Meteor and the damage cap:** "capped at 9,999" per hit (wiki) vs "can break damage limit" (SinirothX). This matters once Stamina Tonic or Break HP Limit pushes max HP past 9,999. | **Open.** |
| **T-5** | **MP drain vs Spellspring (International / HD):** Spellspring makes spells free, yet GamerGuides' HD strategy drains his MP with Soul Springs and says he then "can't use most of his magic". No source explains how the two interact. | **Open.** Do not build either behaviour until it is resolved; ask Bailey or find a data source. |
| **T-6** | **Paragon's Magic and Defense:** SinirothX Mag 244 / Def 88 / MDef 88; wiki Mag 88 / Def 244 / MDef 89 (the wiki's Zaon page repeats "high Strength, Defense... Magic and Magic Defense average", but it is the same wiki). | **Open and blocking** for link 1. SinirothX is the ranked source; only the wiki's own prose supports the wiki. Find a third data source before building. |
| T-7 | Paragon's Big Bang "if the party doesn't attack it for too long" (wiki) is only in SinirothX's **Oversoul** script. | Use SinirothX: the normal form has no idle Big Bang. |
| T-8 | Trema's Agility: 129 (SinirothX) vs 128 (wiki). | Use 129. |
| T-9 | Trema's MP: 999 (five sources) vs 9,999 (zero_six, an unfinished entry). | 999. |
| T-10 | Trema's rare steal: Turbo Ether ×2 (SinirothX) vs ×1 (wiki). | Irrelevant unless Steal is in the chapter. |
| T-11 | Paragon's pilfer gil 4,000 (SinirothX, wiki) vs 3,000 (zero_six). | 4,000. |
| **T-12** | **Source independence:** Split_Infinity and GamerGuides are both Damir Kolar. `ffx2-fallen-aeons.md` counts them as two sources. | Recount that file's `[verified: N]` tags when it is next touched; not changed here (not my file). |
| T-13 | Trema's words before the fight: no transcript. | Beats only (§7.2); our dialogue is written separately. |
| T-14 | The look of Cloister 100 and when the "illusion of Zanarkand" appears. | Look at the wiki pictures (read only) before the art options. |
| T-15 | Damage in numbers (Paragon's Big Bang about 25,000 at maximum MDEF, Trema's 300 to 1,500 per hit) depends on the writer's party. | Compute from the DCs with `ffx2-combat-core.md` once the preset exists; do not ship guide figures as data. |

---

## Sources

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext`, browser user agent; fetched 2026-09-24)

- Trema, revid 4011844: https://finalfantasy.fandom.com/wiki/Trema
- Trema (boss), revid 4008691: https://finalfantasy.fandom.com/wiki/Trema_(boss)
- Via Infinito, revid 3983658: https://finalfantasy.fandom.com/wiki/Via_Infinito
- Paragon (Final Fantasy X-2), revid 3998078: https://finalfantasy.fandom.com/wiki/Paragon_(Final_Fantasy_X-2)
- Zaon, revid 4034745: https://finalfantasy.fandom.com/wiki/Zaon
- New Yevon, revid 3739267: https://finalfantasy.fandom.com/wiki/New_Yevon
- Kinderguardians, revid 3989396: https://finalfantasy.fandom.com/wiki/Kinderguardians
- Final Fantasy X-2: Original Soundtrack, revid 3984616: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack
- Final Fantasy X-2 enemy abilities, revid 3998493 (Meteor, Beguiling Mire, Choking Mist, Dying Star, Falling Leaf, Thundering Wave, Waning Moon rows): https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities
- Dressphere tables: Dark Knight (Final Fantasy X-2) revid 3998402; Alchemist (Final Fantasy X-2) revid 3937542; Gunner (Final Fantasy X-2) revid 3948003; Warrior (Final Fantasy X-2) revid 3911174; White Mage (Final Fantasy X-2) revid 3989304; Gun Mage revid 3939420; Mascot revid 4041062

**GameFAQs** (FFX-2, PS2; read into scratch on D:, 2026-09-24)

- SinirothX, *Enemy Encyclopedia* v1.3 (FFX-2 / International + Last Mission), FAQ 31807: entries Trema, Trema (Colosseum), Paragon, Aranea, Black Elemental, Concherer, Chac; formation table (Bevelle - Secret Dungeon, BOSS 224–229). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807
- Split_Infinity (Damir Kolar), *Boss Guide* ("Leifang", 2008), FAQ 26832, sections G0648 Paragon, G0649 Trema. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/26832
- Split_Infinity (Damir Kolar), *Regional/International Version Changes* ("Lenne", 2008), FAQ 30013, §18 and the Colosseum roster. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/30013
- NightMare185, *Via Infinito FAQ* v3.2 (US version), FAQ 27609. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27609
- agent_0042 (Agent0042, renovated by Zeruel), *Battle Quotes List*, FAQ 27214. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27214
- Blackestmage, *Guide and Walkthrough* (North American version, 2006), FAQ 28684: Cloister 0, 20 and 100 scenes. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/28684
- Paradisio, *Guide and Walkthrough* (US version) v1.0, FAQ 27115. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27115
- nemes1s (hpsolo), *Perfect Game Guide* v2.02 (US release), FAQ 27786. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27786
- 3D Delta Developers, *Guide and Walkthrough*, FAQ 26991 (Trema HP/MP/EXP/steal, Iron Duke). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/26991
- zero_six, *Enemy Database*, FAQ 28832 (Paragon; Trema entry incomplete). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/28832
- Ryu Kaze, *Ultimania Translations* v1.00 (2006), FAQ 42601 (the timeline). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/42601

**Walkthrough**

- GamerGuides (Damir Kolar), *Final Fantasy X-2 HD Remaster*, "Bevelle & the Via Infinito" (Chapter 5): https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-5/bevelle-the-via-infinito

**Local files consulted (read only):** `research/ffx2-fallen-aeons.md`, `research/ffx2-vegnagun-shuyin.md` §6, `research/ffx2-combat-core.md` (§2.4, §3.1, accessories), `src/battle/ffx2/constants.ts`, `src/audio/tracks/` listing, `public/art/characters/` and `public/art/backdrops/` listings, `docs/target/decisions.json` (D-134).

---

## 11. Verification log (2026-09-24)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Trema is fought on floor 100 of the Via Infinito under Bevelle | SinirothX formation table; wiki; GamerGuides; NightMare185 | agree (formation "Level 100 - BOSS 229 Trema 1") |
| 2 | Paragon is fought first; no healing in between | wiki ×2 pages, Split_Infinity, Blackestmage, Paradisio, nemes1s | agree |
| 3 | Trema HP 999,999, MP 999, all four main stats 255 | SinirothX, wiki, Split_Infinity, GamerGuides, NightMare185, 3D Delta | agree (zero_six MP 9,999, incomplete entry) |
| 4 | Trema's AI weights and HP triggers | SinirothX script vs wiki prose vs Split_Infinity vs NightMare185 | Meteor at 1/2 and 1/4 all agree; Ultima 1/6 (SinirothX, wiki) vs 75% (Split_Infinity) |
| 5 | The three-part chain | SinirothX (2a)/(3a) vs Split_Infinity vs GamerGuides | agree |
| 6 | Meteor: hits, fraction, type | SinirothX, wiki, Split_Infinity, GamerGuides, NightMare185 | 1/8 of max HP agrees; hits 12 vs 10; type differs by version and between sources (T-2, T-3) |
| 7 | Spellspring added in International | SinirothX `<>` + Split_Infinity version FAQ | agree |
| 8 | Paragon HP, rewards, counter rule | SinirothX, wiki, Split_Infinity, GamerGuides, zero_six | agree; Magic/Defense swap (T-6) |
| 9 | Other Great Cloister bosses, levels and HP | SinirothX vs GamerGuides | Aranea 18,280, Black Elemental 9,999, Concherer 343,280, Chac 437,850: agree |
| 10 | Story: founder, unsent, spheres destroyed, disappeared a year earlier | wiki (Ultimania p. 88) + Ultimania timeline translation + Blackestmage | agree |
| 11 | Battle quotes | wiki boss page vs agent_0042 | agree on every line both carry |
| 12 | Music | wiki Trema page + wiki OST page | "New Yevon" for Trema; single source (one wiki) |
| 13 | Dressphere Lv 99 rows | wiki dressphere tables | transcribed; Gunner MDef duplication known |
