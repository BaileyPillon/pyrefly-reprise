# FINAL FANTASY X — Seymour Natus and Mortibody (the Highbridge of Bevelle): Implementation Reference

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-24: "I'll pick your recommendations plus Yojimbo." Seymour Natus at the Highbridge is the second of the three new chapters. It is **Chapter X** by registration order (decision D-058: Yojimbo is Chapter IX; the story order stays Natus, then Yojimbo).
**Research date:** 2026-09-24
**Encounter:** **Seymour Natus + Mortibody**, the northern end of the Highbridge of Bevelle, straight after the Via Purifico
**Bestiary entries:** #116 Seymour Natus, #117 Mortibody. Internal ids (decompile): **Seymour Natus `m126`**, **Mortibody `m127`**; formation `bosses.seymour_natus` = `[seymour_natus, mortibody]`
**Recommendation (§11):** build it as Chapter X, **FFX only**. The data is strong. The fight reuses two systems the anthology already has (Mortibsorption from Chapter I, Banish on aeons) and adds three new ones: the elemental combo, the petrify-then-shatter threat and the buff-punishing Desperado.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

These are the same tags as in `research/ffx-yojimbo.md` §0.1 and `research/ffx-evrae-airship.md` §0.1.

| Tag | Meaning |
|---|---|
| `[decompiled]` | Read byte by byte from the game's `ffx_mon_data(_hd)` / `ffx_monmagic1` / `ffx_monmagic2` / `ffx_command` tables in the Grayfox96 FFX-RNG-tracker data files, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680` (the same commit as the Evrae and Yojimbo files), and parsed with that repository's own code. |
| `[verified: N sources]` | N independent sources agree. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from `[decompiled]` constants with the damage chain in `research/ffx-combat-core.md` §2. |
| `[estimate]` | My own design judgement, not a measured fact. |

### 0.2 What I did

1. Read `research/ffx-yojimbo.md` and `research/ffx-evrae-airship.md` (structure, party preset), `research/ffx-seymour-flux.md` §0.3, §3.4 (the earlier Mortibody appendix) and §7 (the Gagazet preset), `research/ffx-combat-core.md` §1 to §2 and the Banish note, and the Natus lines in `research/ffx-seymour-anima-macalania.md` and `research/visual-bible.md`.
2. Ran the Grayfox96 tracker's **own Python modules, loaded into memory from the pinned commit** by an import hook. No repository file was written to disk (AGENTS.md rule 11). Parsed `m126`, `m127`, every action row they reference, their menu-action lists and the `seymour_natus` formation. **Sanity check:** the same loader returns Evrae `m119` as HP 32,000 / Def 0 / MDef 0 / Agi 20, exactly as `ffx-evrae-airship.md` §1 prints it.
3. **Byte-diffed the PS2 (NTSC) and HD monster tables.** `m127` (Mortibody) is byte-identical. `m126` (Natus) differs in **one byte, offset 403** (PS2 `0x00`, HD `0x0C`). The tracker does not parse that byte, and every parsed field is identical (§10 N-9).
4. Read the Final Fantasy Wiki through `api.php?action=parse&prop=wikitext|revid` with a browser user agent (the plain page returns HTTP 402). Page titles and revision ids are listed in Sources.
5. Cross-checked the results against GameFAQs (bover_87's *FFX Remaster Walkthrough*, the Bevelle / Via Purifico / Highbridge page), Jegged (Walkthrough 23, "Via Purifico", which contains the Highbridge) and Auronlu's FFX game script, Chapter X. Then ran the damage chain on the decompiled numbers (§5).
6. **Not retrievable this session:** Game8 (HTTP 403), EIP Gaming (no Natus page at the probed URL), GamerGuides (404 at the probed URLs).

### 0.3 Game case (AGENTS.md rule 14)

**FFX only.** Seymour Natus and Mortibody exist only in *Final Fantasy X*. The fight uses CTB, aeons, Trigger Commands (Talk), Overkill, Ronso-era party members and the FFX status set. *Final Fantasy X-2* has no Natus form, no Mortibody and no Highbridge boss (the X-2 Highbridge has only Yevon Defenders `[single source: wiki Bevelle]`). Nothing in this file transfers to an X-2 chapter. The Bevelle Underground scene already in the tree (`src/scenes/bevelle-underground.ts`) is the **FFX-2** Bahamut arena and is not this arena.

### 0.4 Two corrections to the brief

| Brief said | What the sources say |
|---|---|
| "Mortibody's absorb / **Full-Life** behaviour" | Mortibody has **no Full-Life**. Its revive is **Mortibsorption**: when KO'd it drains Seymour Natus for its own max HP and revives. Its heal is **Cura** on Natus below 12,000 HP. Full-Life belongs to **Mortiorchis** in the Seymour Flux fight (`ffx-seymour-flux.md` §4.2). `[decompiled]` action lists, confirmed by wiki + GameFAQs + Jegged. |
| "Banish / **Total Annihilation**" | **Banish is Natus's** (6:80). **Total Annihilation is not in this fight.** It is Seymour Flux's action, animated on Mortiorchis (`ffx-seymour-flux.md` §0.3, §4.4.2). Natus's menu actions are Banish, Break and Reflect; his scripted list is Protect, Flare, Break, Banish and the four Multi-spells `[decompiled]`. |

The mix-up has happened before in this project: `ffx-seymour-flux.md` C-1 and `visual-bible.md` §"CORRECTION TO THE BRIEF" record the reverse error (Mortibody attributed to the Flux fight). The three Seymour fights must each keep their own companion table.

---

## 1. Enemy stat block — Seymour Natus (`m126`, bestiary #116)

### 1.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **36,000** | `[decompiled]` + wiki + GameFAQs + Jegged `[verified: 4 sources]` |
| MP | 200 | `[decompiled]` + wiki |
| Overkill threshold | **3,500** | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Strength | 30 | `[decompiled]` + wiki (he has **no** Strength-formula action; see §3) |
| **Defense** | **0** (the formula floors it to 1; the wiki prints 1) | `[decompiled]` + wiki |
| Magic | **25** | `[decompiled]` + wiki |
| **Magic Defense** | **0** (floored to 1; the wiki prints 1) | `[decompiled]` + wiki |
| Agility | **21** → base CTB **10 ticks** (combat-core §1.2) | `[decompiled]` + wiki; ticks `[derived]` |
| Luck | 15 | `[decompiled]` + wiki |
| Evasion / Accuracy | 0 / 100 | `[decompiled]` + wiki |
| AP / Overkill AP | **6,300 / 9,450** | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Gil | **3,500** | `[decompiled]` + wiki + GameFAQs |
| Armored | No | `[decompiled]` |
| Poison tick | **4 %** of max HP = **1,440** per tick | `[decompiled]` (byte 42 = 4) + wiki ("poison% = 4") + GameFAQs ("4%") `[verified: 3 sources]` |
| Doom count | 30 (byte), but Doom is **immune** | `[decompiled]`; GameFAQs "Doom Count Immune" |
| Zanmato level | byte 402 = 3 → **level 4** under the 0-based rule of `ffx-seymour-anima-macalania.md` C-6 | `[decompiled]` + wiki ("zanmato = 4") `[verified: 2 sources]`. Moot: Yuna cannot own Yojimbo yet (§6.3). |

> **The design fact of the fight: Defense 0 and Magic Defense 0 behind 36,000 HP.** Every point of damage lands at full value (mitigation 725 of 730). The wall is the HP pool, the Cura heals, the Mortibsorption transfers and the phase changes, not his defences. `[derived]`

### 1.2 Elements

Neutral to Fire, Ice, Thunder, Water and Holy `[decompiled]`. The wiki and GameFAQs list no weakness.

### 1.3 Status resistances (0 = landable, 255 = immune; values between are a resistance subtracted from the chance)

| Status | Value | Note |
|---|---:|---|
| **Poison** | **50** | Lands with a reduced chance, then ticks 1,440. Lulu's **Bio** is the recommended opener in two guides (GameFAQs "Poison Seymour first", Jegged "Bio very early") `[verified: 3 sources incl. decompile]`. 36,000 / 1,440 = **25 ticks** to kill on Poison alone, matching GameFAQs' "25 of his turns" `[derived]`. |
| **Provoke** | 0 → landable | Enables the GameFAQs "Provoke + Reflect" line (§6.2) `[decompiled]` + GameFAQs "Status Vulnerabilities: Provoke" `[verified: 2 sources]` |
| **Power Break** | 0 → landable | Useless in practice: none of his actions uses Strength `[derived]` |
| Threaten | 0 (byte says landable) | **Wiki says Immune.** Conflict N-3. |
| Shell / Protect / **Reflect** / Nul× / Regen / Haste | 0 | Landable. **Reflect on Natus** bounces Mortibody's Cura back to the party (§4.3) |
| Death, Zombie, Petrify, Magic Break, Armor Break, Mental Break, Confuse, Berserk, Sleep, Silence, Dark, **Slow**, Eject, Auto-Life, **Doom** | **255** | Immune `[decompiled]` + wiki immunity list `[verified: 2 sources]` |
| Flags | `immune_to_percentage_damage` (Demi / Gravity), `immune_to_life` (Life / Phoenix Down do nothing to him), `immune_to_delay`, `immune_to_slice`, `immune_to_bribe`. **Not** Scan- or Sensor-immune. | `[decompiled]`; wiki "demi = Immune", "delay = Immune", "bribe = Immune" `[verified: 2 sources]` |

### 1.4 Rewards

| | Value | Confidence |
|---|---|---|
| Steal | **Tetra Elemental ×2** (common), **×3** (rare); base steal chance 255 | `[decompiled]` + wiki + GameFAQs + Jegged `[verified: 4 sources]`. The wiki notes Natus and Master Tonberry are the only steal sources of this item. |
| Drop | **Lv. 2 Key Sphere ×2** (normal kill), ×4 on Overkill `[decompiled]`; drop chance 255 | Wiki and GameFAQs print ×2 for both common and rare; neither prints the Overkill quantity `[single source for ×4]` |
| Equipment | Drop chance 255 (always). Slots 2 to 3. Weapon abilities Piercing (Auron, Kimahri only), Firestrike, Icestrike, Lightningstrike, Waterstrike. Armor ability **SOS Shell** | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]`. Ability count: decompile rolls 1; wiki and GameFAQs say 1 to 2 (N-8) |
| Bribe | Immune (the record holds a Potion ×1 that can never be bribed) | `[decompiled]` |
| Items on the Highbridge | Lv. 2 Key Sphere ×2 (chest) | `[single source: GameFAQs]` |

### 1.5 Scan / Sensor text (paraphrase only; never copy the game's wording)

- **Sensor:** he casts elemental magic, Break and Flare.
- **Scan:** he still uses elemental magic, now doubled. When his HP is low he petrifies with Break and casts the non-elemental Flare.

`[single source: wiki infobox]`; Jegged prints the same Scan line.

---

## 2. Enemy stat block — Mortibody (`m127`, bestiary #117)

### 2.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **4,000** (then 3,000 / 2,000 / 1,000 / 1,000 after each Mortibsorption, §4.4) | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| MP | 50 | `[decompiled]` + wiki |
| Overkill threshold | **36,000** (it effectively cannot be Overkilled) | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Strength | 22 | `[decompiled]` + wiki |
| **Defense** | **50** | `[decompiled]` + wiki |
| Magic | 20 | `[decompiled]` + wiki |
| Magic Defense | 0 (wiki prints 1) | `[decompiled]` + wiki |
| Agility | **28** → base CTB **9 ticks**: it acts slightly more often than Natus | `[decompiled]` + wiki; ticks `[derived]` |
| Luck | **20** | `[decompiled]`. **The wiki says 15** (N-4). |
| Evasion / Accuracy | 0 / 100 | `[decompiled]` + wiki |
| AP / Gil / Steal / Drop / Equipment | none | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Armored | No | `[decompiled]` |
| Poison tick | 25 % (but Poison is immune) | `[decompiled]` |

### 2.2 Status resistances

| Status | Value | Note |
|---|---:|---|
| Armor Break | **50** | Partial `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Power Break | 0 | Landable: halves **Shattering Claw**, the only Strength move it uses `[decompiled]` + GameFAQs |
| Threaten | 0 | Landable `[decompiled]` + GameFAQs |
| **Delay** | not immune | GameFAQs lists Delay as a vulnerability of Mortibody. Natus is Delay-immune `[decompiled]` |
| Shell / Protect / Reflect / Nul× / Regen / Haste | 0 | Landable |
| Death, Zombie, Petrify, Poison, Magic Break, Mental Break, Confuse, Berserk, Provoke, Sleep, Silence, Dark, Slow, the four Distillers, Eject, Auto-Life, Doom | **255** | Immune `[decompiled]` + wiki `[verified: 2 sources]` |
| Flags | `immune_to_percentage_damage`, `immune_to_life`, `immune_to_slice`, `immune_to_bribe` | `[decompiled]` + wiki |

### 2.3 Scan / Sensor (paraphrase)

- **Scan:** Shattering Claw smashes petrified characters. Desperado deals damage and strips magical buffs.
- **Sensor:** watch for their combination attacks.

`[single source: wiki]`

---

## 3. Exact action data (decompiled rows)

### 3.1 Seymour Natus (`monster_actions.json` m126)

| Row | Name | Target | Formula | DmgCon | Hits | Type | Rank | Notes | Confidence |
|---|---|---|---|---:|---:|---|---:|---|---|
| 6:171 / 173 / 175 / 177 | **Multi-Fira / -Blizzara / -Thundara / -Watera** | two party members (each row has a "2nd hit" twin: 6:172 / 174 / 176 / 178) | Magic | **36** | 1 + 1 | Magical, elemental | 3 | reflectable, affected by Silence (he is Silence-immune) | `[decompiled]` + wiki enemy-ability table ("36", "Two allies") `[verified: 2 sources]` |
| 3:59 | **Protect** | **Counter → self** | — | — | — | Magical | 3 | infinite Protect on himself | `[decompiled]` (target "Counter Self") + wiki + GameFAQs ("as a counter") `[verified: 3 sources]` |
| 6:79 | **Break** | one random character | Magic (no damage) | — | 1 | Other | 3 | **Petrify, chance 254**; reflectable | `[decompiled]` + wiki table ("Petrification: Infinite", "Can be reflected") `[verified: 2 sources]` |
| 3:82 | **Flare** | one random character | Magic | **60** | 1 | Magical, non-elemental | **5** | reflectable; shatter 10 %; the rank-5 recovery is the wiki's "delays his next turn" | `[decompiled]` + wiki (Natus uses DC 60; Flux uses 80) `[verified: 2 sources]` |
| 6:80 | **Banish** | one aeon | Magic (no damage) | — | 1 | Other | 3 | **Eject** as a status flag; `always_break_damage_limit`; **not** reflectable | `[decompiled]` + wiki ("Only used against aeons. Eject immunity is silently removed") `[verified: 2 sources]` |

**Menu list** (bytes 80 to 111): Banish, Break, **Reflect (6:95)**. Reflect is never assigned in the scripted list and no source mentions Natus casting it. **Treat it as unused** (N-7). `[decompiled]`

**No physical attack.** Natus has no Strength-formula action at all. `[decompiled]`

### 3.2 Mortibody (`monster_actions.json` m127)

| Row | Name | Target | Formula | DmgCon | Type | Rank | Notes | Confidence |
|---|---|---|---|---:|---|---:|---|---|
| 6:57 / 58 / 59 / 60 | **Fire / Blizzard / Thunder / Water** | **whole party** | Magic | **16** | Magical, elemental | 3 | reflectable (with the whole party on Reflect it bounces back to Mortibody), 10 % shatter | `[decompiled]` + wiki table ("12/16, Mortibody 16", "All allies: Mortibody only") `[verified: 2 sources]` |
| 6:118 | **Shattering Claw** | one random character | Strength | **16** | Physical | 3 | accuracy 100, **shatter 90 %**, `can_target_dead` | `[decompiled]` + wiki ("16", "100", "90 % PDR") `[verified: 2 sources]` |
| 6:94 | **Desperado** | whole party | **Fixed** | 10 | Other | 3 | 500 × roll = **468 to 529**; strips Shell, Protect, Reflect, NulTide, NulBlaze, NulShock, NulFrost, Regen, Haste | `[decompiled]` + wiki (same 468–529 and the same list) `[verified: 2 sources]` |
| 3:44 | **Cura** | slot M1 = **Natus** | Healing | 40 | Magical | 3 | reflectable | `[decompiled]` + wiki `[verified: 2 sources]` |
| 6:169 | **Mortibsorption** | slot M1 = Natus | **HP** (user max HP × 10 / 10) | 10 | Other | 3 | `drains` | `[decompiled]` + wiki (§4.4) |

**Menu list:** Attack (6:93, Strength 16, crit bonus 15, weak Delay), Desperado, **"Magic re-enabled."** (6:104), Shattering Claw. **Attack 6:93** is not in the scripted list and no source mentions it: treat it as unused (N-7). **Magic Re-Enabled** (heals 1,000, cures Silence) is **dummied** `[verified: 2 sources — decompile row not in the script + wiki "dummied", "Unused"]`.

### 3.3 Damage summary `[derived]` (integer chain, combat-core §2, mid roll 16; low–high roll in brackets)

**Incoming, by the party member's Magic Defense:**

| MDEF | Mortibody tier-1, all party (MAG 20, DC 16) | Natus Multi-ra, per hit (MAG 25, DC 36) | Natus Flare (MAG 25, DC 60) |
|---:|---:|---:|---:|
| 5 | 316 (296–334) | 1,216 (1,140–1,287) | 2,375 (2,226–2,514) |
| 10 | 305 (285–322) | 1,173 (1,099–1,241) | 2,291 (2,147–2,425) |
| 20 | 283 (265–299) | 1,090 (1,021–1,153) | 2,129 (1,995–2,253) |
| 30 | 263 (246–278) | 1,011 (947–1,070) | 1,974 (1,850–2,089) |
| 40 | 243 (227–257) | 933 (874–987) | 1,823 (1,709–1,929) |
| 50 | 223 (209–236) | 859 (805–909) | 1,678 (1,573–1,776) |

The Flare column reproduces the sources' "up to 2,500" (wiki) and "~2,500" (Jegged) from play `[derived]`, which validates the stat attribution. Shell halves every column. Yuna's Talk (+10 MDEF) moves her one row down.

**Incoming physical:** Shattering Claw (STR 22, DC 16) does **337 / 325 / 313 / 301 / 290** at party DEF 10 / 15 / 20 / 25 / 30. The damage is small; **the 90 % shatter is the whole threat.** Desperado does 468–529 flat to everyone (Other type, so Shell does not apply).

**Healing on Natus:** Cura (MAG 20, DC 40) = **1,200** (1,125–1,270) per cast.

**Outgoing into Natus** (Def 1, mitigation 725); **Talk (+10 STR) nearly triples a Tidus- or Auron-level hit:**

| Attacker STR | Attack into Natus | Same attacker after Talk (+10) | Attack into Mortibody (Def 50) |
|---:|---:|---:|---:|
| 20 | 278 | 867 | 191 |
| 25 | 514 | 1,359 | 353 |
| 30 | 867 | 2,016 | 595 |
| 34 | 1,249 | 2,673 | 858 |
| 40 | 2,016 | 3,909 | 1,384 |

**Outgoing magic** into MDEF 1 (both enemies): the -ra tier (DC 24) does 536 / 1,036 / 1,358 / 1,728 at MAG 20 / 30 / 35 / 40; the -ga tier (DC 42) does 2,002 at MAG 30 and 3,211 at MAG 40.

---

## 4. AI script

### 4.1 The three phases (HP thresholds on Natus)

| Phase | Natus HP | Mortibody's turn | Natus's turn | Confidence |
|---|---|---|---|---|
| **1** | **above 24,000** | a tier-1 elemental spell on the **whole party** | **Multi-ra of the same element** on two different party members (the combo) | wiki (both pages) + GameFAQs + Jegged `[verified: 3 sources]` |
| → | crossing 24,000 | — | **Protect on himself as a counter** to the hit that crossed the line | `[verified: 3 sources]` + decompile target "Counter Self" |
| **2** | **24,000 to 12,001** | **Shattering Claw** on a random character, every turn (GameFAQs: "not necessarily" the petrified one) | **Break** (Petrify) on one character, every turn | wiki + GameFAQs + Jegged `[verified: 3 sources]`; "every turn" GameFAQs `[single source]` |
| **3** | **12,000 and below** | **Cura on Natus**, repeatedly | **Flare** on one character (rank 5, so his turns come further apart) | wiki + GameFAQs + Jegged `[verified: 3 sources]` |

**The element order in phase 1 is Ice → Thunder → Water → Fire**, repeating `[single source: GameFAQs]`. Jegged says only "rotating through each element". Order unconfirmed (N-2).

**Special case (phase 1):** if only two party members are active and the left-most slot is KO'd, Natus sometimes casts only one spell `[single source: wiki]`.

### 4.2 The rule that makes Poison a strategy

**The phase only changes when Natus takes direct damage.** Poison ticks that carry him below 24,000 or 12,000 do **not** change his pattern until he is next hit, **but Mortibsorption does** `[verified: 2 sources — wiki Natus + GameFAQs]` for the Poison half; `[single source: wiki]` for the Mortibsorption half. So a party that only keeps itself healed while Poison ticks meets phase 1 for the whole fight (GameFAQs strategy 1).

Implement it as: thresholds are checked in the handler for "damage from an action", never in the Poison tick. Mortibsorption counts as an action. `[derived]`

### 4.3 Counters and triggers

| Trigger | Response | Confidence |
|---|---|---|
| **An aeon is on the field** | Natus uses **Banish** on his next turn (the aeon gets **one** turn). The aeon's Eject immunity is removed first, and the aeon ends up **KO'd**, so its Overdrive gauge resets (combat-core, Banish note) | wiki Natus + wiki Aeon (FFX) + GameFAQs + Jegged `[verified: 4 sources]` |
| **All three active party members have Haste** | Mortibody's next action is **Desperado** | wiki Mortibody + GameFAQs + Jegged `[verified: 3 sources]` |
| **4 / 5 / 6 / 7 buffs** among Haste, Shell, Reflect and the Nul spells across the party | Mortibody counters with Desperado at **25 / 50 / 75 / 100 %** | `[single source: wiki Mortibody]`. **How the buffs are counted is unstated** (N-5) |
| Nul spells in general | Jegged: Desperado whenever the party has NulX, or whenever three members share one status | `[single source: Jegged]`. It **contradicts** the wiki's ladder; do not build it |
| Mortibody's tier-1 spell on an all-Reflect party | bounces back onto Mortibody | `[single source: wiki Mortibody]` + decompile (reflectable, whole-party target) |
| **Reflect on Natus** | Mortibody's Cura bounces to a party member | wiki Mortibody + Jegged `[verified: 2 sources]` |
| Break reflected onto Natus | misses (he is Petrify-immune) | GameFAQs + decompile (255) `[verified: 2 sources]` |
| Direct attack on Natus | Jegged: he counters with a Multi-spell or Flare | `[single source: Jegged]`. No other source; the decompile shows only **Protect** as a counter row. **Do not build** (N-6) |

### 4.4 Mortibsorption (the revive), exact

- When Mortibody's HP reaches 0, it uses **Mortibsorption** on Natus: it deals damage equal to **its own current max HP** to Natus and revives with that HP. Its max HP then drops by 1,000 for the next cycle: **4,000 → 3,000 → 2,000 → 1,000 → 1,000 …**, floored at 1,000 `[verified: 4 sources — wiki Mortibody, wiki enemy-ability table ("1,000 HP onward"), GameFAQs, Jegged]`; the HP-formula row (user max HP × 10 / 10) is consistent `[decompiled]`.
- It fires **even when the drain kills Natus** `[single source: wiki, stated on both boss pages]`.
- **Chapter I already implements the identical mechanic for Mortiorchis** (`ffx-seymour-flux.md` §2.2: the clamp `maxHp = max(1000, maxHp - 1000)`, and the rule to resolve the drain first and check Natus's death after). **Reuse that code; do not write a second copy.** `[derived]`
- Killing Mortibody is therefore **free damage on Natus** (4,000 + 3,000 + 2,000 + 1,000 × n), and each drain **changes the phase** (§4.2). Jegged recommends it over trading blows with a phase-3 Natus. `[single source for the recommendation]`

### 4.5 End of battle

The battle ends when **Natus** dies. Mortibody has no death state of its own: it always revives. That is `[derived]` from the revive rule and from "will use Mortibsorption even if it kills Seymour". No source states the end condition in words (N-10). **The party cannot escape** `[single source: wiki infobox]`.

### 4.6 Reference pseudocode (sourced rules only)

```
state: phase = 1, elementIdx = 0            // ELEMENTS = [ice, thunder, water, fire] (N-2)
       mortiMax = 4000, lastElement = null

on damage from an action to Natus (not a Poison tick):
    if phase == 1 and natus.hp <= 24000: phase = 2; counter(natus, Protect -> self)
    if phase == 2 and natus.hp <= 12000: phase = 3
    // [estimate] one hit can cross both lines: apply both steps; the Protect counter fires once

Mortibody turn:
    if aeonOnField: (Natus handles it; Mortibody acts normally)
    if all3Active.haveHaste: Desperado; return
    phase 1: e = ELEMENTS[elementIdx++ % 4]; cast tier1(e) -> party; lastElement = e
    phase 2: Shattering Claw -> random character (a petrified target shatters at 90 %)
    phase 3: Cura -> Natus

Natus turn:
    if aeonOnField: Banish -> aeon; return
    phase 1: Multi-ra(lastElement) -> two different characters   (N-1: without a Mortibody spell first)
    phase 2: Break -> one random character
    phase 3: Flare -> one random character

Mortibody hp == 0:
    Mortibsorption: natus.hp -= mortiMax; mortibody.hp = mortiMax
    mortiMax = max(1000, mortiMax - 1000)
    re-check the thresholds (Mortibsorption counts as direct damage)
    if natus.hp <= 0: battle won
```

**Open inside the pseudocode:** the Desperado buff-count counter (N-5) and what Natus casts when Mortibody has not cast first (N-1).

---

## 5. Shatter, Petrify and the one-slot loss

- **Break** petrifies one character (254 = cannot miss short of immunity); **Shattering Claw** hits a random character. If the hit lands on a petrified one, **90 %** shatter chance `[decompiled]`. A shattered character is removed **for the rest of the battle**, and the party fights with two `[verified: 3 sources — wiki (both pages) + Jegged]`.
- Mortibody's elemental spells also carry a 10 % shatter chance on petrified targets `[decompiled]` + wiki.
- Counters, all sourced: **Stone Ward / Stoneproof** armour (GameFAQs, Jegged), a **Soft** or **Esuna** straight away (Jegged), and **Reflect** on the party so that Break bounces (the GameFAQs Provoke line).
- **The engine question:** Chapter VIII (Evrae) already has Petrify via Stone Gaze. Check whether it also has **shatter as a slot removal**. If it has not, that is this chapter's largest new system. `[estimate]`

---

## 6. The party and builds

### 6.1 Story position

After the wedding, the trial and the Via Purifico split: Yuna finds Lulu, Kimahri and Auron and beats Isaaru in a contest of aeons; Tidus, Wakka and Rikku beat Evrae Altana in the flooded tunnels. Everyone reunites on the Highbridge `[verified: 3 sources — wiki Bevelle, wiki Via Purifico, Auronlu Ch. X]`. If Yuna missed Lulu or Kimahri in the Via Purifico, they rejoin automatically at the Highbridge `[single source: wiki Via Purifico]`.

### 6.2 Party

- **All seven** are available: Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku.
- **Opening line-up: Tidus, Yuna, Kimahri.** Formation `seymour_natus` has `forced_party: "tyk"` `[decompiled: formations.json]`. The same field holds `twr` for Evrae Altana (Tidus / Wakka / Rikku, the real forced party of that fight), which supports reading it as the game's fixed start. It also fits the story: Kimahri stays to hold Seymour off, and the others turn back (§8.2). GameFAQs adds that Kimahri is absent from the Highbridge random battles before the boss `[single source]`. **Swapping is allowed during the fight** (no source says otherwise). Treat "tyk" as `[single source]` until checked (N-11).
- **Trigger Commands (Talk):** **Tidus +10 Strength, Auron +10 Strength, Yuna +10 Magic Defense**, for the battle `[verified: 4 sources — wiki Natus, wiki Trigger Command, GameFAQs, Jegged]`. This table is **Natus-only**: Macalania is Tidus / Yuna / Wakka and Flux is Yuna / Kimahri (`ffx-seymour-anima-macalania.md` row 4, "do not share one table").
- **Aeons:** Valefor, Ifrit, Ixion, Shiva, **Bahamut** (obtained in Bevelle Temple during this same visit). Anima, the Magus Sisters and Yojimbo are not owned yet `[verified: 2 sources — wiki Aeon (FFX) story order + wiki Bevelle "Temple aeon: Bahamut"]`; the same five as `ffx-seymour-flux.md` §7.6.
- **Aeon Overdrive gauges carry between battles** (`ffx-seymour-flux.md` §7.9.2). The **Isaaru duel just before** is aeon-only, and GameFAQs notes Bahamut fills his Overdrive there by taking hits. So "arrive with full aeon gauges and summon them one by one" is **story-true** here `[derived from GameFAQs + wiki Natus strategy]`.
- **Stats:** no source gives stats for this point. Use the Evrae preset (`ffx-evrae-airship.md` §9.3, six guardians) as the lower bound and the Gagazet preset (`ffx-seymour-flux.md` §7.3) as the upper bound. Yuna is the only character missing from the Evrae table: take her from the lower half of the Gagazet row. **Everything here is `[estimate]`** (the same caveat as `ffx-seymour-flux.md` C-11).
- **Yuna's Reflect:** Jegged suggests levelling Yuna **on the Highbridge** until she learns Reflect, so an ordinary Yuna may not have it yet `[single source]`. Whether the preset gives her Reflect is a design choice with a large effect on difficulty (O-3).
- **Shop:** **O'aka XXIII** sells on the Highbridge before the boss `[verified: 3 sources — Auronlu script, Jegged, GameFAQs]`.

### 6.3 Sourced strategies the chapter must support

| # | Strategy | Needs | Source |
|---|---|---|---|
| 1 | **Poison and wait**: Bio, keep healed, never hit Natus directly; phase 1 lasts the whole fight | Poison at resistance 50; thresholds ignore Poison ticks (§4.2) | wiki + GameFAQs `[verified: 2 sources]` |
| 2 | **Provoke + Reflect**: Provoke Natus, put Reflect on the Provoker; his single-target spells bounce back onto him | Provoke landable; Multi-ra / Flare / Break reflectable; Break misses him | `[single source: GameFAQs]` + decompile |
| 3 | **Aeon relay**: summon aeons with full gauges one at a time; each fires its Overdrive before Banish | Banish after one aeon turn; gauges persist | wiki (both pages) + GameFAQs + Jegged `[verified: 3 sources]` |
| 4 | **Brute force**: Stone Ward, Shell, Esuna / Soft, Talk for +10 STR | §5; Talk | GameFAQs + Jegged `[verified: 2 sources]` |
| 5 | **Reflect on Natus** in phase 3 so that Cura heals the party | reflectable Cura | wiki Mortibody + Jegged `[verified: 2 sources]` |
| 6 | **Farm Mortibsorption**: kill Mortibody for 4,000 / 3,000 / 2,000 / 1,000 … damage to Natus | §4.4 | wiki + Jegged `[verified: 2 sources]` |
| 7 | **Haste only two** party members (three triggers Desperado) | §4.3 | wiki + GameFAQs + Jegged `[verified: 3 sources]` |
| 8 | **Overkill**: finish with Bahamut's Mega Flare via Grand Summon | Overkill 3,500 | `[single source: wiki]` |

**Jegged's advice to Magic Break Natus or Mortibody would do nothing:** both are Magic Break-immune (255) `[decompiled]` + wiki. GameFAQs' "Delaying Seymour also helps" fails against Natus (Delay-immune) and works only on Mortibody. Do not teach either in the chapter's hints.

---

## 7. Arena — the Highbridge of Bevelle

| Fact | Source |
|---|---|
| The Highbridge is a long bridge leading to Bevelle Temple | `[single source: wiki Bevelle §Highbridge]` |
| The boss fight is at the **northern end**, in the plaza-like area in front of the **Main Gate** | `[single source: GameFAQs]` |
| Bevelle is built on the water | Lulu, Auronlu script Ch. X `[single source]` |
| The Via Purifico's water outlet lets the Tidus group out beside the bridge | Auronlu Ch. X ("wash up by the bridge") `[single source]` |
| The wedding was on high walkways by the **Tower of Light**; the palace roof spires lead to the temple | Auronlu Ch. X + wiki Bevelle §Palace `[verified: 2 sources]` |

The painted look (stone, banners, light, sky) has **no sourced description** in `research/visual-bible.md`. Its Bevelle palette lines are written for the **FFX-2** underground (§2.4), which does not settle an FFX surface scene (rule 14). The arena needs its own paper concept and an options round before anything is painted (AGENTS.md rule 9).

---

## 8. Story, beats and how the chapter list sets it up

### 8.1 What the existing chapters already cover

| Chapter | Story point | Relation to Natus |
|---|---|---|
| **VII** Seymour at Macalania (built) | Seymour dies and becomes unsent | Establishes that he is **dead**; that is the premise of the wedding and the trial |
| **VIII** Evrae (built) | The *Fahrenheit* fights its way to Bevelle; Yuna is absent | **Post beat 11** ends with Tidus going down the mooring chains while the city's bells ring, narrated in the past tense (`src/story/scripts/evrae-airship.ts`). **The wedding itself is not staged**; Chapter VIII stops at the chains. |
| **X** Seymour Natus (this file) | The wedding, the trial, the Via Purifico, the Highbridge | **Picks up where VIII's last line stops** |
| **IX** Yojimbo (registered, unlisted) | The first walk through the Calm Lands | Comes after this fight in the story (after the Macalania Woods campsite) |
| **I** Seymour Flux (built) | Mt. Gagazet | The next Seymour form; its data file already carries the Natus correction (§0.4) |

Number order (VII, VIII, IX, X, I) is **not** story order (VII, VIII, X, IX, I). D-058 settles it: the chapter number follows registration order, and the story order is Natus, then Yojimbo.

### 8.2 Beat sheet (paraphrased from Auronlu's FFX script, Chapter X; no line is transcribed)

**Before (the wedding to the transformation):**

1. **The steps of the wedding.** The guardians cut their way to the foot of the steps. Maester **Kinoc**'s monks pin them at rifle point. Yuna has come armed to send Seymour during the ceremony; Seymour sees it and admires it. Mika makes the friends' lives the price. Yuna drops her staff.
2. **The kiss and the order.** Seymour kisses her, then orders the guardians killed. Kinoc aims; Auron points out the hypocrisy of machina rifles under Yevon.
3. **"I can fly."** Yuna backs to the edge and tells them to go and to trust her. She steps off and summons **Valefor** on the way down. **Rikku's flashbomb** covers the retreat; Kimahri pulls a furious Tidus away.
4. **The Chamber of the Fayth.** The guardians find Yuna collapsed as Bahamut's fayth joins her. Kinoc's monks arrest them all.
5. **The trial.** Yuna accuses Seymour of patricide and of being dead. **Mika shows that he is unsent too.** Yevon's truth is endless continuity. Guilty.
6. **The Via Purifico, in one breath.** A cage conversation (Auron's "spiral of death"). Tidus's half: the flooded tunnels and Evrae Altana. Yuna's half: Lulu, Kimahri and Auron, then **Isaaru's contest of aeons**. Seymour volunteers to guard the exit; Kinoc insists on coming.
7. **The Highbridge.** The two groups reunite (Rikku runs to hug Yuna). Seymour arrives with **Kinoc's body** and drops it. His speech: death as mercy, and his plan to take Yuna to Zanarkand and become the next Sin.
8. **Kimahri plants his spear on Seymour's chest.** Seymour kills his own attendants, absorbs their pyreflies and Kinoc's, and becomes **Natus**.
9. **The retreat that turns round.** Auron orders the others to run. Yuna stops. Tidus says they are all guardians and he will follow her anywhere. They go back together, Lulu with an apologetic smile at Auron, who follows amused.

**During:** the three Talk exchanges (Auron and Kinoc's friendship; Tidus telling Seymour to stop talking; Yuna and the Farplane) and Seymour's line when he Banishes an aeon (Auronlu Ch. X, "Talk during Seymour battle").

**After:**

10. **Macalania Woods campsite.** Tidus's narration: they escaped, but Yuna's faith was shaken. Auron: they must avoid Bevelle from now on. This is the hand-off to Chapter IX (the Calm Lands).

The chapter must not quote any of this. Write original lines in the register of `research/writing-bible.md`, as the Evrae script does (AGENTS.md rule 8).

### 8.3 What the chapter should stage `[estimate]`

- **Pre:** beats 1 to 3 compressed (the steps, the kiss, the leap). Beats 4 to 6 as **one narration interlude** in Tidus's past-tense voice; it mirrors how Chapter VIII narrated the bells, and the trial and the Via Purifico are exposition, not fights. Beats 7 to 9 in full: they are the reason for the fight.
- **The hook is Kimahri's stand (beat 8) and the turn-back (beat 9).** It is the one Seymour fight where the party chooses to go back in, and the opening line-up (Tidus, Yuna, Kimahri) is that choice.
- **Mid:** the three Talk lines as authored equivalents; the Protect counter at 24,000 as a telegraph; the first Break; the first shatter; the Banish.
- **Post:** beat 10 as narration, closing on the road to the Calm Lands.

### 8.4 Music

| Track | What the OST listing says | Confidence |
|---|---|---|
| **"Run!!"** (急げ!!) | Plays "before the fight with Seymour Natus" (also Sin's attack on Zanarkand, the fall of Home) | `[single source: wiki OST]` |
| "The Wedding" / "Assault" / "Tragedy" / "Believe" | The wedding; the guardians' charge; the kiss; Yuna's leap | `[single source: wiki OST]` |
| "Via Purifico" | The prison | `[single source: wiki OST]` |
| "Fight With Seymour" | **Omnis only** (the final Seymour battle) | wiki OST + wiki track page `[verified: 2 sources]` |
| **The battle cue for Natus** | **No source names it.** | Open (O-5), like Evrae's C-16 |

**Do not transcribe, sample or arrange any of these** (AGENTS.md rule 8). The project's own score is `docs/audio/THEMES.md` §3 ("SEYMOUR — Noble Rot"), whose `boss-seymour` family and `SEYMOUR_UNMOORED` "final form" motif are the natural source for an original Natus cue. Chapter VII got its own cue, `boss-seymour-macalania`, from Bailey's pick of sketch A. **Any Natus cue is a new audio sketch that Bailey judges by ear** (rules 9 and 13).

---

## 9. Art: what exists

| Asset | Where | State |
|---|---|---|
| **Seymour Natus battle art** | — | **None.** There is no `public/art/characters/seymour-natus/` and no concept in `docs/concepts/` or `tools/gen/`. |
| **Mortibody battle art** | — | **None.** |
| Seymour Flux body (5 poses) | `public/art/characters/seymour-flux-body/` | **Approved** (`approved-hashes.json` "cast:seymour-flux-body"). Chapter I only: a different form. |
| Mortiorchis (5 poses) | `public/art/characters/mortiorchis/` | Present; **not** in `approved-hashes.json`. Chapter I only. |
| Seymour at Macalania, human form (idle / cast / hurt) | `public/art/characters/seymour-macalania/` | **CANDIDATE** (the sidecar says so); derived from the approved concept pick `seymour-b.png` |
| Speaker portraits | `public/art/portraits/seymour-macalania.png` (approved 2026-09-24, human form); `public/art/portraits/seymour.png` (Chapter I; whether it shows the human form or Flux is still open, `targets.json` NEW-1) | The approved Macalania portrait can voice Seymour's **pre-transformation** lines here `[estimate]`. Natus's own lines need a decision |
| Pause art | `public/art/pause/seymour.png` | Approved |

**So both combatants need new concepts.** Natus is not a variant of the approved Flux body, so METHOD-CHECK's "derive from approved pixels" applies only to Seymour's face and hair, and only if the options round shows that reuse reads right. Sourced appearance facts are thin:
- Mortibody is a "mechanical, hovering creature" `[single source: wiki Natus]` that Jegged describes as a small alien-like arm on Natus's left `[single source]`.
- The Japanese names: Natus = シーモア:異体 "Seymour: Mutation"; Mortibody = 幻光異体 "Pyrebody" (wiki).
- The English *natus* means "born" (wiki).

Anything more detailed must come from looking at reference images before the concepts are drawn, not from memory (rule 6), and the output must stay original (rule 8).

---

## 10. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| N-1 | What Natus casts in phase 1 if Mortibody has not cast first (turn order can give him the first turn) | **Open.** The sources describe the combo only as "Mortibody starts a round". Recommend an `[estimate]`: he uses the current element in the rotation. Label it. |
| N-2 | The phase-1 element order Ice → Thunder → Water → Fire | `[single source: GameFAQs]`. Build it that way and label it. |
| N-3 | Threaten on Natus: byte 0 (landable), wiki Immune | Unresolved. Do not let Threaten work until checked (the same rule as Evrae C-4 and Yojimbo Y-3). |
| N-4 | Mortibody Luck: decompile 20, wiki 15 | The decompile wins. |
| N-5 | The Desperado counter ladder (4 to 7 buffs → 25 to 100 %): **what is counted** (per character or party-wide, whether Protect or Regen count) is unstated | **Open.** Build only the Haste-on-all-three rule (3 sources) until a second source for the ladder turns up. |
| N-6 | Jegged: Natus counters direct attacks with a Multi-spell or Flare | Uncorroborated; the decompile shows only a Protect counter. **Do not build.** |
| N-7 | Menu-only rows: Natus Reflect (6:95), Mortibody Attack (6:93) | Treat as unused. |
| N-8 | Equipment ability count: decompile max rolls 1, wiki and GameFAQs 1 to 2 | Irrelevant unless equipment drops are built. |
| N-9 | PS2 and HD differ at Natus byte 403 (0x00 / 0x0C), a field the tracker does not parse | Every parsed field is identical. Note it; no action. |
| N-10 | The battle ends on Natus's death | `[derived]`, not stated in words by any source. |
| N-11 | The opening line-up Tidus / Yuna / Kimahri (`forced_party "tyk"`) | `[single source: decompile-derived formations.json]` + consistent with the script. Verify against footage before the preset is locked. |
| N-12 | Mortibody's phase-2 action: GameFAQs says Shattering Claw every turn; the wikis say it "will attack with" Shattering Claw | Consistent enough; build every turn. |
| N-13 | Talk's exact line content | The effect is 4-source; the words must be original anyway. |
| O-1 | Party stats at the Highbridge | `[estimate]` between the Evrae and Gagazet presets (§6.2). |
| O-2 | Aeon gauges at the start (full, as the Isaaru duel suggests, or empty) | Design choice; it decides whether strategy 3 exists. **Ask Bailey.** |
| O-3 | Does the preset Yuna know Reflect? | Design choice with a large difficulty effect. **Ask Bailey.** |
| O-4 | Does the chapter stage the Isaaru duel or Evrae Altana? | Recommend **no** (narration only). Both are separate fights with their own data (GameFAQs has Evrae Altana: HP 16,384, Zombie, and so on) and would be scope creep. |
| O-5 | The Natus battle music | Unsourced (§8.4). An original cue goes through an audio options round. |

---

## 11. Recommendation for the chapter (FFX only)

**Build it.** It is the best-sourced remaining FFX boss: every stat and action row is decompiled; the phase thresholds, the combo, Banish, Mortibsorption, Talk and the Haste-Desperado rule are 3 to 4 sources each. The story around it is among FFX's strongest (the wedding, Mika revealed as unsent, Kinoc's body, Kimahri's stand, the turn-back), and Chapter VIII already stops at the exact moment this chapter opens.

**Minimum mechanic list:**

1. **Two actors with a combo:** Mortibody's tier-1 spell on the party, then Natus's Multi-ra of the same element on two targets (§4.1). The element rotation is a visible pattern the player learns.
2. **HP thresholds at 24,000 and 12,000 that fire only on damage from an action** (§4.2), with the Protect counter at the first line.
3. **Petrify → shatter → the slot is lost for the battle** (§5). It may already half-exist from Chapter VIII's Stone Gaze.
4. **Desperado** on Haste-on-all-three: 468–529 flat damage plus the buff strip (§3.2, §4.3).
5. **Mortibsorption:** reuse Chapter I's implementation unchanged (§4.4).
6. **Banish** after an aeon's one turn: reuse Chapter I's (§4.3).
7. **Talk:** Tidus / Auron +10 STR, Yuna +10 MDEF, this fight's table only.
8. **Reflect interactions:** spells bounce, Cura bounces off a Reflected Natus, Break misses him.
9. **Stats, immunities and rewards exactly as §1 and §2.** Poison at resistance 50 with a 1,440 tick; Delay, Slow, Doom, Magic Break and Armor Break immune; the Tetra Elemental steal.

**Before anything is built (rules 9 and 10):** end-state options go to Bailey first for the Highbridge arena, the Natus and Mortibody billboards, the Seymour speaker portrait for the Natus form, a mockup of how the petrify / shatter state and the Desperado trigger read on the HUD, and a battle-cue sketch. Bailey also answers O-2 and O-3. None of these exists yet.

---

## Sources

**Decompile-derived data** (Grayfox96/FFX-RNG-tracker, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`, the modules and data files loaded into memory)

- https://github.com/Grayfox96/FFX-RNG-tracker
- `ffx_rng_tracker/data/data_files/ffx_mon_data.csv` and `ffx_mon_data_hd.csv`: `m126`, `m127` (and `m119` as the parser check)
- `ffx_rng_tracker/data/data_files/ffx_monmagic1.csv` / `ffx_monmagic2.csv` / `ffx_command.csv` through the tracker's action files 3 and 6: rows 3:44, 3:59, 3:82; 6:57–60, 6:79, 6:80, 6:93–95, 6:104, 6:118, 6:169, 6:171–178
- `ffx_rng_tracker/data/data_files/monster_actions.json` (`m126`, `m127`) and `formations.json` (`bosses.seymour_natus`, and `evrae_altana` for the forced-party check)
- `ffx_rng_tracker/data/monsters.py`, `actions.py`, `constants.py` (field offsets and enums)

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext|revid`, browser user agent; fetched 2026-09-24)

- Seymour Natus, revid 4017136: https://finalfantasy.fandom.com/wiki/Seymour_Natus
- Mortibody, revid 4017446: https://finalfantasy.fandom.com/wiki/Mortibody
- Final Fantasy X enemy abilities, revid 4008011: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities
- Seymour Guado, revid 4034466: https://finalfantasy.fandom.com/wiki/Seymour_Guado
- Bevelle, revid 4008196: https://finalfantasy.fandom.com/wiki/Bevelle
- Via Purifico, revid 4034460: https://finalfantasy.fandom.com/wiki/Via_Purifico
- Aeon (Final Fantasy X), revid 4029264: https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)
- Trigger Command, revid 4004212: https://finalfantasy.fandom.com/wiki/Trigger_Command
- Wedding, revid 4008698: https://finalfantasy.fandom.com/wiki/Wedding
- Final Fantasy X: Original Soundtrack, revid 4011106: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_Original_Soundtrack
- Fight With Seymour, revid 3980145: https://finalfantasy.fandom.com/wiki/Fight_With_Seymour

**Guides and script**

- GameFAQs, bover_87, *Final Fantasy X Remaster Walkthrough (PC)*, "Bevelle" page (Isaaru, Via Purifico, Evrae Altana, Highbridge, Seymour Natus): https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/bevelle
- Jegged, FFX Walkthrough 23, "Via Purifico" (includes the Highbridge and Seymour Natus): https://jegged.com/Games/Final-Fantasy-X/Walkthrough/23-Via-Purifico.html
- Auronlu, *FFX Game Script*, Chapter X: Bevelle: http://auronlu.istad.org/ffx-script/chapter-x-bevelle/
- Not retrievable this session: Game8 (HTTP 403), EIP Gaming and GamerGuides (404 at the probed URLs)

**Local prior research consulted:** `research/ffx-yojimbo.md` and `research/ffx-evrae-airship.md` (format, presets), `research/ffx-seymour-flux.md` §0.3, §2.2, §3.4, §7, `research/ffx-combat-core.md` §1 to §2 and the Banish note, `research/ffx-seymour-anima-macalania.md` (Trigger Command table, Zanmato rule C-6), `research/visual-bible.md` (the Mortibody correction; the Bevelle palette is FFX-2), `docs/audio/THEMES.md` §3, `src/story/scripts/evrae-airship.ts` (post beat 11), `docs/target/decisions.json` D-058, `docs/target/approved-hashes.json`.

---

## 12. Verification log (2026-09-24)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Parser correctness | the same in-memory loader on Evrae `m119` against `ffx-evrae-airship.md` §1 | identical |
| 2 | Natus HP 36,000 / Overkill 3,500 / AP 6,300 (9,450) / Gil 3,500 | decompile + wiki + GameFAQs (+ Jegged for HP) | agree |
| 3 | Natus Def 0 / MDef 0 / Mag 25 / Agi 21 | decompile + wiki (prints 1 for the zeros) | agree |
| 4 | Mortibody HP 4,000 / Def 50 / Agi 28 / Overkill 36,000 | decompile + wiki + GameFAQs | agree; Luck conflict N-4 |
| 5 | PS2 vs HD | byte diff of `m126` and `m127` | `m127` identical; `m126` differs at one unparsed byte (N-9) |
| 6 | Formation and opening party | `formations.json` `bosses.seymour_natus` | `[seymour_natus, mortibody]`, forced party `tyk` |
| 7 | Multi-ra DC 36 on two targets; Flare DC 60; Break Petrify; Banish Eject | decompiled rows + wiki enemy-ability table | agree |
| 8 | Mortibody tier-1 DC 16 party-wide; Shattering Claw 16 / 90 % shatter; Desperado 468–529 plus the buff strip | decompiled rows + wiki table | agree |
| 9 | Thresholds 24,000 / 12,000 and each phase's actions | wiki (both pages) + GameFAQs + Jegged | agree |
| 10 | Mortibsorption 4,000 → 1,000 floor, fires even if lethal | wiki (two pages) + GameFAQs + Jegged; HP-formula row | agree |
| 11 | Talk: Tidus / Auron +10 STR, Yuna +10 MDEF | wiki Natus + wiki Trigger Command + GameFAQs + Jegged | agree |
| 12 | Poison tick 4 % = 1,440; 25 ticks to kill | decompile + wiki + GameFAQs | agree |
| 13 | Flare "up to 2,500" | damage chain at MDEF 5: 2,375 (max roll 2,514) | reproduces the play figure |
| 14 | Steal Tetra Elemental ×2 / ×3; drop Lv. 2 Key Sphere | decompile + wiki + GameFAQs + Jegged | agree |
| 15 | Aeons owned: Valefor, Ifrit, Ixion, Shiva, Bahamut | wiki Aeon (FFX) story order + wiki Bevelle | agree |
| 16 | No Natus / Mortibody art exists; none approved | `public/art/characters/`, `docs/concepts/`, `tools/gen/`, `docs/target/approved-hashes.json` | confirmed absent |
