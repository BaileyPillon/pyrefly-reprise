# FINAL FANTASY X — Seymour Omnis and the four Mortiphasms (Inside Sin, the Garden of Pain): Implementation Reference

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-24 ~21:45 EDT: "I'll go with Seymour Omnis and Trema." This file is the Seymour Omnis half (FFX). Decision record D-134.
**Research date:** 2026-09-24
**Encounter:** **Seymour Omnis + Mortiphasm ×4**, the Garden of Pain inside Sin, the last Seymour fight, before Dream's End (our Chapter III, Braska's Final Aeon)
**Bestiary entry:** #178 Seymour Omnis. Internal ids (decompile): **Seymour Omnis `m131`**, **Mortiphasm `m106`**; formation `bosses.seymour_omnis` = `[seymour_omnis, mortiphasm, mortiphasm, mortiphasm, mortiphasm]`, no forced party
**Recommendation (§11):** build it, **FFX only**. The stats are decompiled and the core rules (the discs, the attack counter, Dispel then Ultima) are 3 to 5 sources each. It is a puzzle fight, not a numbers fight, and the puzzle is its reason to exist. Its biggest cost is readability: four rotating four-colour discs the player must read and turn. Four rules are still open (§10); two need footage before the chapter is locked.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

The same tags as in `research/ffx-seymour-natus-highbridge.md` §0.1.

| Tag | Meaning |
|---|---|
| `[decompiled]` | Read from the game's `ffx_mon_data(_hd)` / `ffx_monmagic1` / `ffx_monmagic2` / `ffx_command` tables in the Grayfox96 FFX-RNG-tracker data files, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680` (the same commit as the Natus, Evrae and Yojimbo files), parsed with that repository's own code. |
| `[verified: N sources]` | N independent sources agree. The FF Wiki counts once, however many of its pages say it. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from `[decompiled]` constants with the damage chain in `research/ffx-combat-core.md` §2. |
| `[estimate]` | My own design judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §10 with what to do. |

### 0.2 What I did

1. Read `research/ffx-seymour-natus-highbridge.md` (structure), `research/ffx-bfa-yu-yevon.md` §4 (the party preset for this same dungeon), `research/ffx-combat-core.md` §1.2, §2 and §2.9, `research/ffx-seymour-anima-macalania.md` (C-6, the music note), `docs/audio/THEMES.md` §3, `src/story/scripts/seymour-flux.ts` (Chapter I's closing lines) and `docs/target/approved-hashes.json`.
2. Ran the Grayfox96 tracker's own Python modules, **loaded into memory from the pinned commit** by an import hook (the Natus session's loader; nothing from the repository written to disk, AGENTS.md rule 11). Parsed `m131`, every `mortiphasm*` record, the rows Omnis references, his menu-action list and the `seymour_omnis` formation. **Sanity check:** the same loader returns Seymour Natus `m126` as HP 36,000 / MP 200 / Mag 25 / Agi 21, exactly as `ffx-seymour-natus-highbridge.md` §1.1 prints it.
3. **Byte-diffed PS2 (NTSC) against HD.** `m131` differs in **one byte, offset 403**, the same unparsed byte that differs for Natus `m126` (Natus file N-9). Every parsed field is identical. `m106` is byte-identical.
4. Read the Final Fantasy Wiki through `api.php?action=parse&prop=wikitext|revid` with a browser user agent (the plain page returns HTTP 402). Titles and revision ids are in Sources.
5. Cross-checked against GameFAQs (bover_87, *FFX Remaster Walkthrough*, "Sin" page), Jegged (Walkthrough 31, "Sin"), GamerGuides (FFX HD walkthrough "Inside Sin" and bestiary "Seymour Omnis"), Samurai Gamers (Omnis boss guide), The Dark Id's *Let's Play* on LP Archive (Update 127) and Auronlu's FFX game script, Chapter XV. Then ran the damage chain on the decompiled numbers (§3.3).
6. **Not retrievable:** Game8 (HTTP 403).

### 0.3 Game case (AGENTS.md rule 14)

**FFX only.** Seymour Omnis, the Mortiphasms, Sin's interior and this party exist only in *Final Fantasy X*. The fight uses CTB, aeons (no Banish here), Nul spells, Focus stacks and the FFX status set. *X-2* has no Seymour fight. Nothing here transfers to an FFX-2 chapter.

### 0.4 Corrections to the brief and to the decision record

| Brief / record said | What the sources say |
|---|---|
| D-134 note: "his final boss form, **Zanarkand**" | He is fought **inside Sin**, in the **Garden of Pain**, after the airship battle with Sin, not at Zanarkand. The order is Zanarkand (Yunalesca, our Chapter II), then the *Fahrenheit* against Sin, then Inside Sin: Sea of Sorrow, **Garden of Pain (Omnis)**, City of Dying Dreams, Tower of the Dead, the Nucleus, Dream's End (our Chapter III) `[verified: 4 sources — wiki Inside Sin, Auronlu Ch. XV, Jegged 31/32, GameFAQs "Sin"]`. |
| "Ultima, **Total Annihilation**" | **Total Annihilation is not in this fight.** It belongs to Seymour Flux, animated on Mortiorchis (`ffx-seymour-flux.md` §4.4.2; the Natus file §0.4 records the same mix-up). Omnis's scripted list is the four -ra spells, the four -ga spells, **Dispel** and **Ultima** (plus his death animation) `[decompiled: monster_actions.json m131]` + wiki infobox `[verified: 2 sources]`. |
| "**Dispel/Break** behaviour" | Omnis casts **Dispel** on the party. He has **no Break** (Petrify-Break is Natus's, `ffx-seymour-natus-highbridge.md` §3.1). "Break" here can only mean the party's Armor Break and Mental Break **on him**, which both land (§1.3). |
| "the four Mortiphasms and how their elemental rotation changes his weakness and his spells" | Correct. One nuance: his weakness exists **only when all four discs match** (§4.2). With any other layout he has no weakness at all. |

---

## 1. Enemy stat block — Seymour Omnis (`m131`, bestiary #178)

### 1.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **80,000** | `[decompiled]` + wiki + Jegged + LP `[verified: 4 sources]`. **GameFAQs prints 60,000** `[conflict]` O-1: outvoted. |
| MP | 999 | `[decompiled]` + wiki |
| Overkill threshold | **15,000** | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Strength | 20 | `[decompiled]` + wiki (no Strength-formula action, §3) |
| **Defense** | **180** at the start; **100** after each Dispel; **150** after each Ultima | 180 `[decompiled]` + wiki. The two changes: `[single source: wiki]`; LP says only that Dispel lowers his defences "until the next turn" (partial support). The tracker does not parse the battle script, so the decompile cannot confirm them. |
| Magic | **35** | `[decompiled]` + wiki |
| **Magic Defense** | **100** | `[decompiled]` + wiki |
| Agility | **40** → base CTB **7 ticks** (combat-core §1.2): as fast as a quick Tidus | `[decompiled]` + wiki; ticks `[derived]` |
| Luck | 20 | `[decompiled]` + wiki |
| Evasion / Accuracy | 0 / 0 (wiki prints accuracy 1) | `[decompiled]` + wiki; moot, he has no physical attack |
| AP / Overkill AP | **24,000 / 36,000** | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Gil | **12,000** | `[decompiled]` + wiki + GameFAQs |
| Armored | No | `[decompiled]` |
| Zanmato level | byte = 3 → **level 4** (0-based, `ffx-seymour-anima-macalania.md` C-6) | `[decompiled]` + wiki ("zanmato = 4") `[verified: 2 sources]`. **Not moot here:** Yojimbo can be owned by this point (§6.2). |
| Wiki info line | Tough, Heavy; Eject-immune; **the party cannot escape** | `[single source: wiki]` |

### 1.2 Elements

The monster record is **Neutral** to Fire, Ice, Thunder, Water and Holy `[decompiled]`. The battle script overwrites the four elemental affinities from the discs every time they change (§4.2); wiki and GameFAQs both print "Varies" `[verified: 2 sources]`. **Holy is never touched by the discs** `[derived]`: it stays neutral all fight, which is why the wiki and Samurai Gamers recommend it.

### 1.3 Status resistances (0 = landable, 255 = immune)

| Status | Value | Note |
|---|---:|---|
| **Armor Break** | **0** | Landable. DEF 180 → 0 (floored to 1): Attack damage rises about **7×** (§3.3). Every guide names it `[verified: 4 sources — decompile, GameFAQs "Status Vulnerabilities", Jegged, wiki strategy]` |
| **Mental Break** | **0** | Landable. MDEF 100 → 0 `[verified: 4 sources, same]` |
| Threaten | 0 | **Wiki says Immune** `[conflict]` O-2 (the same byte-versus-wiki split as Natus N-3). |
| Shell / Protect / Reflect / Nul× / Regen / Haste | 0 | Landable on him. |
| Death, Zombie, Petrify, Poison, Power Break, Magic Break, Confuse, Berserk, **Provoke**, Sleep, Silence, Dark, **Slow**, the four Distillers, Eject, Auto-Life, **Doom** | **255** | Immune `[decompiled]` + wiki immunity list `[verified: 2 sources]`. Provoke-immune rules out the Natus Provoke + Reflect line; Silence-immune means his spells cannot be stopped. |
| Flags | `immune_to_percentage_damage` (Demi, Gravity), `immune_to_life`, `immune_to_delay`, `immune_to_slice`, `immune_to_bribe`. **Not** Scan- or Sensor-immune. | `[decompiled]`; wiki "demi / delay / bribe = Immune" `[verified: 2 sources]` |

### 1.4 Rewards

| | Value | Confidence |
|---|---|---|
| Steal | **Shining Gem** (common), **Supreme Gem** (rare); base chance 255 | `[decompiled]` + wiki + GameFAQs + Jegged `[verified: 4 sources]` |
| Drop | **Lv. 3 Key Sphere** ×1 (common) / ×2 (rare); Overkill ×2 / ×4; drop chance 255 | `[decompiled]`; wiki and GameFAQs print ×1 / ×2 `[verified: 3 sources]`; the Overkill quantities `[single source: decompile]` |
| Equipment | Always drops. Slots **3 to 4**, abilities 1 to 2. Weapon: **Magic +20%**, Piercing (Auron, Kimahri). Armor: **SOS Shell, SOS Haste, SOS Protect** | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Bribe | Immune (the record holds a Potion ×1 that can never be bribed) | `[decompiled]` |
| Trophy (HD) | "The Destination of Hatred" | wiki + Jegged `[verified: 2 sources]`. Name only; not for the chapter. |

### 1.5 Scan / Sensor text (paraphrase; never copy the game's wording)

- **Sensor:** the Mortiphasms power him.
- **Scan:** he casts only after the four discs behind him charge him; where they point changes what he does. Physical hits turn a disc left, magic turns it right.

`[verified: 2 sources — wiki infobox, Jegged "In Game Description"]`

---

## 2. Enemy stat block — Mortiphasm (`m106`, ×4)

| Field | Value | Confidence |
|---|---|---|
| HP / MP / every stat | **1** (Defense, Magic Defense, Agility 0 in the record; the wiki prints 1) | `[decompiled]` + wiki |
| Overkill | 1 | `[decompiled]` + wiki |
| Damage | **immune to physical, magical and all damage** (`immune_to_damage`) | `[decompiled]` + wiki ("physical = Immune", "magical = Immune"; "immune to damage") `[verified: 2 sources]` |
| Status | Immune to everything that matters (Shell, Protect, Reflect, Nul×, Haste, Regen, the Breaks, Provoke, Death, Doom and the rest are 255); Threaten 0 in the record, **Immune** on the wiki | `[decompiled]` + wiki |
| Scan / Sensor | **Immune to both** | `[decompiled]` + wiki `[verified: 2 sources]` |
| AP / Gil / items | none | `[decompiled]` + wiki |
| Actions | **Turns Left** (90° counter-clockwise) and **Turns Right** (90° clockwise), self-target | `[single source: wiki enemy-ability table]`; the tracker lists no actions for `m106` (it only parses what the RNG tracker needs). **Whether a disc owns a turn in the CTB queue, or only turns in reaction to a hit, is unsourced** `[estimate]`: no turns (plan B22; review E6) |
| Reach | **Out of melee range** ("flying" / back row): physical attacks can reach them only from **Wakka**, **Valefor**, **Anima** and **Mindy** (a normal Attack, not Passado) | wiki Mortiphasm (the full list) + GameFAQs ("only Wakka and certain aeons") + GamerGuides + LP ("only Wakka") `[verified: 4 sources]`. Jegged says "Wakka or Lulu" (Lulu through magic, which any caster can do). |
| Random-target attacks | Slice & Dice, Attack Reels and similar **never pick a disc** | `[single source: GameFAQs]` |

**Other `mortiphasm` records.** The tracker also names `m118`, `m150`, `m154` and `m177` "Mortiphasm" (HP 6,000 / 1 / 6,000 / 5,963). **None is in the Omnis formation**; only `m106` is `[decompiled: formations.json]`. Ignore them.

Japanese names: Omnis シーモア:最終異体 ("Seymour: Final Mutation"); Mortiphasm 幻光天極 ("Pyre-Celestial Pole") `[single source: wiki]`. *Omnis* is Latin, "all" (wiki Seymour Guado).

---

## 3. Exact action data (decompiled rows)

### 3.1 Seymour Omnis (`monster_actions.json` m131)

| Row | Name | Target | Formula | DmgCon | Type | Rank | Notes | Confidence |
|---|---|---|---|---:|---|---:|---|---|
| 3:69 / 70 / 71 / 72 | **Fira / Blizzara / Thundara / Watera** | one character per cast | Magic | **24** | Magical, elemental | 3 | reflectable; 10 % shatter on a petrified target | `[decompiled]` + wiki table ("24", "Up to 4 allies: Omnis") `[verified: 2 sources]` |
| 3:73 / 74 / 75 / 76 | **Firaga / Blizzaga / Thundaga / Waterga** | one character per cast | Magic | **42** | Magical, elemental | 3 | reflectable; 10 % shatter | `[decompiled]` + wiki table ("42") `[verified: 2 sources]` |
| 3:61 | **Dispel** | **the whole party** (tracker target "Characters' Party") | — | — | Magical | 3 | removes Shell, Protect, Reflect, the four Nuls, Regen, Haste, the four Breaks and Curse; **not reflectable** | `[decompiled]` + wiki table (same removal list) `[verified: 2 sources]`; matches combat-core §4 |
| 6:240 | **Ultima** | **the whole party** | Magic | **64** | **Other** | 3 | not reflectable; **Shell does not apply** (type Other); **Focus stacks do** (combat-core §2.9: magic-formula damage × (15 − stacks)/15); an aeon's **Shield** reduces it | `[decompiled]` + wiki ("64 instead of 70", "special damage", Shield and Focus) + GamerGuides + LP ("about 90 %", "special") `[verified: 4 sources]` |
| 6:242 | Death | self | no damage | — | — | 3 | his defeat animation | `[decompiled]` |

**Menu list** (bytes 80–111): the player's Ultima (3:83, DC 70, Magical), Dispel, the four -ga, the four -ra. The scripted Ultima is **6:240**, not 3:83 `[decompiled]`: build 6:240.

**No tier-1 spell and no physical attack.** LP describes "one Fire, Blizzard, Thunder and Water" when all four discs differ; the action list has no tier-1 row, so that is a misremembering: all-different discs give four **-ra** spells `[decompiled]` + wiki + GamerGuides + Samurai `[verified: 4 sources]`.

### 3.2 Ultima's 89.4 % check

Normal Ultima at Magic 35 against MDEF 25 does 4,000; Omnis's DC 64 version does 3,577: ratio **0.894** `[derived]`, exactly the wiki's "about 89.4 %". The stat attribution is right.

### 3.3 Damage summary `[derived]` (integer chain, combat-core §2, mid roll 16; low–high roll in brackets)

**Incoming, by the party member's Magic Defense (Omnis MAG 35):**

| MDEF | -ra, one cast (DC 24) | -ga, one cast (DC 42) | Ultima (DC 64, all) | Ultima with Focus ×5 |
|---:|---:|---:|---:|---:|
| 10 | 1,274 (1,194–1,348) | 2,406 (2,255–2,546) | 3,994 (3,744–4,228) | 2,662 |
| 20 | 1,184 (1,110–1,253) | 2,236 (2,096–2,367) | 3,712 (3,480–3,929) | 2,474 |
| 25 | 1,141 (1,069–1,207) | 2,154 (2,019–2,280) | 3,577 (3,353–3,786) | 2,384 |
| 30 | 1,098 (1,029–1,162) | 2,073 (1,943–2,194) | 3,442 (3,226–3,643) | 2,294 |
| 35 | 1,055 (989–1,116) | 1,992 (1,867–2,108) | 3,307 (3,100–3,500) | 2,204 |
| 40 | 1,013 (949–1,072) | 1,914 (1,794–2,026) | 3,177 (2,978–3,363) | 2,118 |
| 50 | 933 (874–987) | 1,762 (1,651–1,865) | 2,925 (2,742–3,096) | 1,950 |

- The Ultima column reproduces the play figures "around 4,000" (Jegged) and "can exceed 4,000" (wiki) at low MDEF, and GamerGuides' "keep HP above 4,000" `[derived]`.
- **Shell halves the -ra and -ga columns only.** A matching **Nul** spell cancels one spell of that element; **Ward / -proof / Eater** armour halves, nullifies or absorbs it (Jegged, GameFAQs, wiki `[verified: 3 sources]`).
- The opening turn is **four Firaga**: at the §6.2 preset MDEF (22 to 34) that is about **2,100 per hit, one per member plus a second on someone**, so one member takes about 4,200 on turn one `[derived]`. That is the fight's opening lesson (turn a disc, or NulBlaze).

**Outgoing into Omnis (Attack, DC 16):**

| Attacker STR | into DEF 180 (start) | into DEF 150 (after Ultima) | into DEF 100 (after Dispel) | **Armor Break** (DEF 0 → 1) |
|---:|---:|---:|---:|---:|
| 30 | 127 | 203 | 371 | 867 |
| 35 | 200 | 318 | 583 | 1,359 |
| 40 | 297 | 472 | 864 | 2,016 |
| 45 | 421 | 669 | 1,225 | 2,857 |

**Outgoing magic** (neutral element; then ×0.5 for one matching disc, 0 for two, absorbed for three or four, ×1.5 on the weakness): into MDEF 100 the -ga tier does 858 / 1,377 / 1,695 at MAG 30 / 40 / 45; after **Mental Break** it does 2,002 / 3,211 / 3,951 `[derived]`.

> **The design fact:** a fresh Omnis shrugs off everything (a 40-Strength Auron does 297). Armor Break and Mental Break turn that into 2,000 to 3,000 a hit, and the Dispel window (DEF 100) is a burst turn. The HP pool is 80,000; the danger is four -ga spells in one turn and Ultima, not the attrition.

---

## 4. The fight's rules

### 4.1 The discs and his spells

| Rule | Detail | Confidence |
|---|---|---|
| Four discs, four coloured sections each | **orange = Fire, purple = Ice, blue = Water, yellow = Thunder**. The section closest to Seymour is the one that counts. Jegged says "yellow/green" for Thunder. | wiki (both pages) + Jegged + GameFAQs ("orange (fire) edge") `[verified: 3 sources]` |
| **Opening layout** | **All four discs show Fire** | wiki Mortiphasm + GameFAQs + GamerGuides `[verified: 3 sources]` |
| **Four spells per turn** | One on each active party member, the fourth on a random one. With KO'd members he casts 2 or 3. | wiki Omnis + GamerGuides ("one on each party member, with the fourth one being random"); Jegged and LP "four spells every turn" `[verified: 4 sources]` for the four; KO rule `[single source: wiki]` |
| **Each disc casts its own element** `[conflict]` | Each disc produces one spell of its colour. Tier = **-ra** if that colour shows on 1 or 2 discs, **-ga** if on 3 or 4. So Fire, Fire, Fire, Ice = three Firaga + one Blizzara. | wiki Omnis (explicit, and its strategy: "rotate one disc and Nul spells cancel all three -ga, leaving the lone -ra") + Samurai Gamers (explicit per-count table) + LP ("four spells corresponding to the elements aligned") + GamerGuides (tier by count) `[verified: 4 sources]`. **GameFAQs says instead** that all four spells take the majority colour, ties broken Fire → Water → Ice → Thunder. Outvoted 4 to 1: build the per-disc rule (O-3). |
| Which spell goes to which member | **Unsourced.** | O-4 |

### 4.2 The discs and his elemental affinity

Each disc showing an element adds one step of resistance to it: **1 disc = half damage, 2 = immune, 3 = absorb, 4 = absorb and weak to the opposite element** `[verified: 5 sources — wiki (both pages), GameFAQs, Jegged, GamerGuides, LP]`. Opposites: **Fire ↔ Ice, Thunder ↔ Water** (`research/ffx2-combat-core.md` §1 for FFX-2 `[single source]`; for FFX the start state confirms Fire ↔ Ice: all-Fire opens with an **Ice** weakness, wiki Mortiphasm + GameFAQs + Samurai's "Shiva's Diamond Dust" `[verified: 3 sources]`; Thunder ↔ Water is the standard FFX pair but no Omnis source names it, O-5).

Consequences `[derived]`:
- Every element that shows on any disc is at least halved. With the discs split 1-1-1-1 he takes half from all four elements and has **no weakness**.
- Holy and non-elemental damage are never affected (§1.2).
- **Element-strike weapons and elemental Overdrives can heal him** (Jegged tells the player to unequip -strike weapons) `[single source for the advice]`.

**The two-Water bug:** with exactly two Water discs he becomes immune to **Fire**, not Water; it can leave him both resistant and immune to Fire `[single source: wiki, "persists across all versions"]`. Faithful-core question for Bailey (O-6): reproduce it or not.

### 4.3 Turning the discs

| Rule | Detail | Confidence |
|---|---|---|
| A **physical** hit on a disc turns **that disc** 90° **counter-clockwise** (left) | Only Wakka, Valefor, Anima, Mindy can reach (§2) | wiki (both pages + ability table) + GameFAQs + Jegged + GamerGuides + Samurai + LP `[verified: 6 sources]` |
| A **magic** hit on a disc turns it 90° **clockwise** (right) | Any caster; the disc takes no damage | same `[verified: 6 sources]` |
| **The order of the four colours around a disc** | **Unsourced.** Without it, "one turn left" has no defined result. Needs footage or a reference image (O-7). | open |
| Whether "magic" includes Nul spells, Haste, Cure, Scan and so on aimed at a disc | Unstated. The discs are immune to all those statuses; the sources mean offensive spells. Build: Black Magic and damaging magic only `[estimate]` (O-8). | open |

### 4.4 The attack counter, Dispel and Ultima

| Step | Detail | Confidence |
|---|---|---|
| Counter | After **6** attacks on Seymour he **glows red** | wiki + GameFAQs + Jegged + GamerGuides + LP `[verified: 5 sources]` |
| Below 20,000 HP | The counter drops to **3** | wiki + GameFAQs + GamerGuides + LP ("25 %" = 20,000) `[verified: 4 sources]` |
| What counts | Counterattacks and **reflected spells** count; several counters can land during one of his turns | `[single source: wiki]` |
| Whether hits on the **discs** count | Unstated (O-9) | open |
| Next turn | **Dispel** on the whole party; his DEF drops to 100 | Dispel: `[verified: 4 sources]`; DEF: `[single source: wiki]` + LP partial |
| The turn after | **Ultima** on the whole party; DEF rises to 150 | Ultima: `[verified: 4 sources]`; DEF: `[single source: wiki]` |
| Then | **All four discs are reset to one colour, the next in the cycle**, and he goes back to casting four spells | wiki (both pages) + GameFAQs + GamerGuides + LP `[verified: 4 sources]`. **When** `[conflict]`: GameFAQs "immediately after Ultima"; GamerGuides "on the turn after Ultima" and the wiki *Mortiphasm* page (revid 3981206) "on his next turn after casting Ultima". 2 sources against 1 (O-10, open; corrected 2026-09-24 by the plan review, S8). |
| **The cycle order** `[conflict]` | GameFAQs: **Fire → Water → Ice → Thunder**. The wiki says only "the next element listed above", and its list reads Fire, Ice, Water, Thunder. | O-11: build GameFAQs' explicit order, label it, and confirm on footage |
| Lines | He speaks before the first Dispel and before each Ultima (Auronlu Ch. XV; wiki quotes) | `[verified: 2 sources]`. Write original lines (rule 8). |

**Defense after the reset.** DEF stays 150 after the first Ultima (it never returns to 180) `[derived from the wiki's wording]`. How the scripted Defense values interact with Armor Break status is unstated (O-12).

### 4.5 Aeons and Anima

- **He never Banishes aeons** `[verified: 3 sources — wiki, Jegged, GamerGuides]`; GameFAQs' advice to sacrifice an aeon to Ultima is consistent. It is **the first Seymour fight where aeons are safe**, after Chapter VII (Anima, Macalania), Chapter X (Natus: Banish) and Chapter I (Flux: Banish).
- Aeons that absorb his element take his spells as healing: **Ifrit (Fire), Ixion (Thunder), Shiva (Ice)**; none absorbs Water `[verified: 2 sources — wiki, GamerGuides]`.
- **Anima:** if Yuna summons her, he says his mother opposes him too `[verified: 2 sources — wiki (Omnis and Seymour Guado pages), Auronlu]`. Anima is **optional** at this point (§6.2).
- An aeon's **Shield** reduces Ultima `[verified: 2 sources — wiki, GamerGuides]`.

### 4.6 End of battle

The battle ends when **Seymour** dies (the discs cannot be killed) `[derived]`. He kneels; Wakka tells Yuna to send him; she sends him `[verified: 2 sources — Auronlu Ch. XV, wiki Seymour Guado]`. **No Trigger Command (Talk) in this fight**: the wiki's Trigger Command table lists Seymour, Natus, Flux and Braska's Final Aeon only `[single source: wiki]`, and the script shows no Talk exchange (Auronlu) → `[verified: 2 sources]`.

### 4.7 Reference pseudocode (sourced rules only; the open items are marked)

```
ELEMENTS cycle (after Ultima) = [fire, water, ice, thunder]   // O-11, GameFAQs
discs = [fire, fire, fire, fire]; cycleIdx = 0; hits = 0; state = 'normal'
DISC_RING = ?                                                 // O-7: colour order around each disc

on any attack that hits Seymour (incl. counters and reflected spells; discs: O-9):
    hits += 1
    if hits >= (seymour.hp < 20000 ? 3 : 6) and state == 'normal': state = 'red'   // glow

on a hit on disc d:
    physical -> discs[d] = DISC_RING.left(discs[d]);  magic -> discs[d] = DISC_RING.right(discs[d])
    recomputeAffinity()

recomputeAffinity():
    for e in [fire, ice, thunder, water]:
        n = count(discs == e)
        affinity[e] = [neutral, half, immune, absorb, absorb][n]
    if all four discs equal e: affinity[opposite(e)] = weak
    // O-6: the two-Water bug (2 water -> Fire immune instead of Water)

Seymour turn:
    if state == 'red':      Dispel -> party; seymour.def = 100; state = 'dispelled'; return
    if state == 'dispelled': Ultima(6:240) -> party; seymour.def = 150; hits = 0
                             cycleIdx += 1; discs = [ELEMENTS[cycleIdx % 4]] * 4   // O-10: here straight after Ultima (GameFAQs); wiki + GamerGuides say his next turn
                             recomputeAffinity(); state = 'normal'; return
    targets = living party members, shuffled?, + one random          // O-4
    for i, d in enumerate(discs[: max(2, len(targets))]):            // KO rule, wiki; WHICH discs keep their spell is unsourced [estimate] (plan B12)
        n = count(discs == d); cast (n >= 3 ? ga(d) : ra(d)) -> targets[i]
```

---

## 5. Strategies the chapter must support (all sourced)

| # | Strategy | Needs | Source |
|---|---|---|---|
| 1 | **Break him first**: Armor Break, Mental Break | §1.3 | 4 sources |
| 2 | **Scramble the discs** so no -ga comes out (one disc turned leaves three -ga and one -ra; two different pairs give four -ra) | §4.1, §4.3 | wiki, GameFAQs, Jegged, GamerGuides `[verified: 4 sources]` |
| 3 | **Nul spells** against the showing element (with one disc turned, a Nul cancels all three -ga) | per-disc spells | wiki + GamerGuides + GameFAQs `[verified: 3 sources]` |
| 4 | **Elemental armour**: Ward / -proof / Eater; the **Phantom Ring** (Fire, Thunder, Water Eater) is found **in the Sea of Sorrow just before**; Phantom Bangle, Victorious | §6.3 | wiki + Jegged + GameFAQs + Samurai `[verified: 4 sources]` |
| 5 | **Exploit the weakness**: all four matching → hit the opposite element (Shiva's Diamond Dust at the start; doublecast) | §4.2 | wiki + Samurai `[verified: 2 sources]` |
| 6 | **Burst in the Dispel window** (DEF 100), then **survive Ultima**: heal above 4,000, Focus, an aeon's Shield, or sacrifice an aeon | §4.4 | wiki + GameFAQs + GamerGuides + LP `[verified: 4 sources]` |
| 7 | **Absorbing aeons**: Ifrit / Ixion / Shiva against their own element | §4.5 | 2 sources |
| 8 | **Auto-Reflect**: turn the discs so reflected spells hurt him instead of healing him | reflectable spells; affinity | `[single source: wiki]` |
| 9 | **Haste / Hastega**, re-cast after each Dispel | Dispel list | wiki + Jegged + Samurai `[verified: 3 sources]` |

**Shell against Ultima does nothing**: Jegged says Shell helps; the decompile (type Other) and wiki, GamerGuides and LP say it does not `[verified: 4 sources against 1]`. Shell still halves his -ra and -ga. Do not teach Shell against Ultima.

Every guide calls him the weakest of the four Seymour forms (GameFAQs, GamerGuides, LP). That is a **fact about the original**, not licence to tune him up (rule 6). If the chapter needs more tension, it comes from presentation and from the disc puzzle, never from new numbers.

---

## 6. The party and builds

### 6.1 Story position

After Yunalesca (our Chapter II) the party boards the *Fahrenheit*, fights Sin's outer body over Bevelle (the Sin boss battles are separate fights, not this chapter), flies into its mouth and lands in the Sea of Sorrow. Seymour waits at the top of the stairs in the Garden of Pain `[verified: 3 sources — Auronlu Ch. XV, wiki Inside Sin, Jegged 31]`. The point of no return is later, at the Tower of the Dead (Jegged 32, wiki Inside Sin); before Omnis the party can still leave Sin.

### 6.2 Party and aeons

- **All seven** are available; there is **no forced party** (`forced_party ""`, `forced_condition "normal"`) `[decompiled: formations.json]`. **Wakka matters more than anywhere else**: he is the only party member who can turn a disc left (§2).
- **Story aeons:** Valefor, Ifrit, Ixion, Shiva, Bahamut. **Optional by now:** Anima (Baaj Temple, needs the airship and all six Destruction Sphere treasures), Yojimbo (Cavern of the Stolen Fayth), the Magus Sisters (all other aeons plus the Blossom Crown and Flower Scepter) `[verified: 2 sources — wiki Aeon (FFX), ffx-bfa-yu-yevon.md §4.4]`. The BFA preset treats the three optional aeons as absent; do the same here unless Bailey wants the Anima line (O-13).
- **Stats:** no source gives stats for this point. **Reuse the Braska's Final Aeon preset** (`ffx-bfa-yu-yevon.md` §4.1): it is the same dungeon, one save sphere later. All `[estimate]`.
- **Abilities:** the BFA preset's list (Hastega, Protect, Curaga, Esuna, Life, Reflect, the four Breaks, Doublecast with Firaga and Thundaga, Steal / Use / Mix; no Holy, Ultima, Flare, Full-Life) fits; **add the four Nul spells** (Yuna's grid, `ffx-bfa-yu-yevon.md` §4.2 "Nul-spells: yes") and **Focus** (Lulu's grid) `[estimate from sourced grid positions]`.
- **Equipment:** only what the Sea of Sorrow gives **before** the fight: **Phantom Ring** (Yuna: Fire Eater, Lightning Eater, Water Eater, one empty slot), Wizard Lance (Kimahri), Special Sphere, Elixir, Lv. 3 Key Sphere `[verified: 2 sources — Jegged 31, GameFAQs]`. The City of Dying Dreams and Nucleus items in the BFA preset come **after** Omnis and must not be in this preset `[derived]`.

### 6.3 Save point

A Save Sphere sits at the foot of the stairs before the Garden of Pain `[verified: 2 sources — Jegged, GameFAQs]`.

---

## 7. Arena — the Garden of Pain (inside Sin)

| Fact | Source |
|---|---|
| Most areas inside Sin are **warped projections of ancient Zanarkand** | `[single source: wiki Inside Sin]` |
| **Sea of Sorrow** (悲しみの海): a haunting, **red-tinged sea** under a cloudless sky, crossed on watery blue walkways and **waterfalls**, with **Yevon symbols** around it | wiki Inside Sin; the waterfalls also Jegged + GameFAQs `[verified: 2 sources for the waterfalls]` |
| **Garden of Pain** (なげきの園, "Garden of Lament"): **a flight of steps up to a platform**; after the fight the area is skipped on later visits, "but the staves remain" | `[single source: wiki Inside Sin]`; "Seymour waits at the top of the stairs" Auronlu `[verified: 2 sources for the steps]` |
| Seymour **hovers** in front of the four large discs | wiki Omnis `[single source]`; LP: "translucent", "suspended twenty feet in the air" `[single source]` |
| He **glows red** before Dispel / Ultima (a wiki gallery image is captioned so) | wiki + Jegged + GamerGuides `[verified: 3 sources]` |
| On defeat he kneels and dissolves into pyreflies as Yuna sends him | Auronlu `[single source]` |

What "the staves" are, and the platform's look, are **not described** in any text source read. `research/visual-bible.md` has nothing on Inside Sin except Dream's End (via the BFA file, §5.1). The arena needs its own reference look and an options round (rule 9). One reuse question: the Dream's End diorama (Chapter III) already exists; the Garden of Pain is a **different** place and should not reuse it without Bailey's say.

---

## 8. Story, beats and how the chapter list sets it up

### 8.1 Where it sits among the Seymour chapters

| Chapter | Seymour's form and place | What it sets up for Omnis |
|---|---|---|
| **VII** Macalania | The man; he dies and comes back unsent | That he is dead, and his mother is Anima |
| **X** Natus (Highbridge) | First monstrous form; Kinoc's body; wants Yuna to make him Sin | His plan to **become Sin** |
| **I** Flux (Gagazet) | Tells Tidus his father is Sin, offers him Jecht's freedom; Yuna fails to send him ("You can't send what refuses to go" in our script) | Omnis is the pay-off: **Sin has absorbed him**, and this time **Yuna sends him** |
| **II** Yunalesca (Zanarkand) | — | He gloats that the party killed Yunalesca, so no Final Aeon can stop Sin |
| **Omnis (this file)** | Inside Sin | Last Seymour fight |
| **III** Braska's Final Aeon | Dream's End | Straight after (Tidus's parting line points there) |

Chapter I's post already closes on Seymour saying Spira's sorrow is patient (`src/story/scripts/seymour-flux.ts`). His real last words here say the same thing (sorrow outlives him): **the two chapters rhyme**, and the Omnis chapter must not repeat Chapter I's line word for word `[estimate]`.

### 8.2 Beat sheet (paraphrased from Auronlu's FFX script, Chapter XV; no line transcribed)

1. **Into Sin.** The *Fahrenheit* flies into the mouth; a glimpse of Seymour laughing as they pass through. (FMV; `[single source: Auronlu]`)
2. **Sea of Sorrow.** Tidus calls for his father; Auron says they must go to him; Tidus takes the lead.
3. **Garden of Pain.** Seymour laughs at the top of the steps. He says Sin chose him, that he is one with it and will learn to control it; since the party disposed of Yunalesca, nothing can destroy Sin now. Tidus says they can. Seymour says Tidus's death means his father's life.
4. **The fight.** Lines before the first Dispel and before Ultima; a line to Anima if summoned.
5. **The end.** He falls to his knees. Wakka tells Yuna to send him; she does. His last words: sorrow will outlast him. Tidus answers that Sin is next.

`[verified: 2 sources for 3 to 5 — Auronlu, wiki Seymour Guado / Seymour Omnis quotes]`. Write original lines in the register of `research/writing-bible.md` (rule 8).

### 8.3 What the chapter should stage `[estimate]`

- **Pre:** beat 1 as one line of narration (the dive into Sin); beat 3 in full. The hook is his reversal: he has lost, so he claims Sin itself.
- **Mid:** the disc lesson on turn one (four Firaga), the glow-red telegraph, the Dispel → Ultima pair, the Anima line if Anima is in the preset.
- **Post:** beat 5 in full. **Yuna finally sends him** is the emotional pay-off of all four Seymour chapters, and it should read as that, not as a mid-boss death.

### 8.4 Music

| Track | Use | Confidence |
|---|---|---|
| "The Unsent Laugh" (死人が笑う), 3:33 | When the party finds Seymour in the Garden of Pain | wiki Inside Sin + wiki Seymour Guado `[verified: 2 sources]` |
| **"Fight With Seymour"** (シーモアバトル), 6:49 | **The Omnis battle**; its own track, with a motif from Seymour's theme; the HD version adds choir late in the loop | wiki (Omnis, track and Seymour Guado pages) + LP `[verified: 2 sources]` |
| "Pursuit" (迫りくる者たち) | The Sea of Sorrow | wiki Inside Sin + LP ("Those Who Come Closer", the same Japanese title) `[verified: 2 sources]` |

**Do not transcribe, sample or arrange any of these** (rule 8). The project's own material is `docs/audio/THEMES.md` §3 "Noble Rot": `boss-seymour` (Chapter I) already spends `SEYMOUR_UNMOORED` once in its "final form" section; Chapter VII's `boss-seymour-macalania` does not. An Omnis cue is the natural home for Seymour's last statement of the motif, and a new audio sketch Bailey judges by ear (rules 9 and 13).

---

## 9. Art: what exists

| Asset | Where | State |
|---|---|---|
| **Seymour Omnis battle art** | — | **None.** No `public/art/characters/seymour-omnis/`, no concept in `docs/concepts/chapters/`. |
| **Mortiphasm discs** | — | **None.** |
| Seymour Natus idle, cast; Natus ring idle | `public/art/characters/seymour-natus/`, `seymour-natus-ring/` | **Approved** (`approved-hashes.json` "chapter:natus", "chapter:natus-cast"). Chapter X only: a different form. |
| Seymour Flux body (5 poses) | `public/art/characters/seymour-flux-body/` | **Approved** ("cast:seymour-flux-body"). Chapter I only. |
| Seymour Flux (older single idle) | `public/art/characters/seymour-flux/` | Present, **not** approved |
| Seymour at Macalania, human form (idle / cast / hurt) | `public/art/characters/seymour-macalania/` | **CANDIDATE** (sidecar) |
| Speaker portraits | `portraits/seymour-macalania.png` (approved, human form), `portraits/seymour-natus.png` (approved), `portraits/seymour.png` (Chapter I, **not** in approved-hashes; `targets.json` NEW-1 open) | Omnis's lines need a portrait decision: reuse Natus's or Macalania's, or a new one |
| Pause art | `pause/seymour.png`, `pause/ch1-seymour-flux.png` | Approved |

**Both combatants need new concepts.** Only Seymour's face and hair could come from approved pixels, and only if the options round shows it reads right. Sourced appearance facts are thin: he hovers in front of four large discs; each disc has four coloured sections (orange, purple, blue, yellow); he glows red before Ultima; LP calls him translucent and compares the discs to game-show wheels. There is official concept art of Omnis and of "the reels" (wiki gallery titles); look at reference images before drawing, then stay original (rules 6 and 8). **The discs are gameplay, not decoration**: the colour facing Seymour must be readable at game size, which argues for testing disc readability in the options round before any painting.

---

## 10. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| O-1 | HP: GameFAQs 60,000 vs decompile, wiki, Jegged, LP 80,000 | **80,000.** |
| O-2 | Threaten on Omnis: byte 0, wiki Immune | Do not let Threaten work until checked (as Natus N-3). |
| O-3 | Spells per disc (4 sources) vs four of the majority element (GameFAQs) | Build per-disc. |
| O-4 | Which disc's spell goes to which party member, and in what order | **Open.** `[estimate]`: disc order left to right, one per living member in slot order, the fourth at random. Label it. |
| O-5 | Thunder ↔ Water as the opposite pair in FFX | Standard, but no Omnis source names it (the all-Thunder and all-Water states are never described). Check on footage. |
| O-6 | The two-Water bug | `[single source]`. Ask Bailey: faithful or fixed. Recommend faithful but hidden (it only changes Fire). |
| O-7 | **The colour order around each disc** | **Open and blocking**: turning a disc has no defined result without it. Get it from footage or reference images before the chapter is built. |
| O-8 | Which spells turn a disc | `[estimate]`: damaging magic only. |
| O-9 | Whether hits on the discs count toward the 6 / 3 | **Open.** `[estimate]`: no (the sources say "attacks on Seymour"). |
| O-10 | Disc reset timing: straight after Ultima, or on his next turn | **Open** `[conflict]`: the wiki *Mortiphasm* page and GamerGuides say on his next turn after Ultima, GameFAQs straight after. 2 against 1, so the majority rule says **next turn**; Bailey's call (plan B23). *Corrected 2026-09-24: this row first said "build straight after Ultima"; the wiki sentence had not been counted.* |
| O-11 | **The post-Ultima cycle order**: GameFAQs Fire → Water → Ice → Thunder; the wiki's list reads Fire, Ice, Water, Thunder | Build GameFAQs' explicit order; **confirm on footage** with O-7. |
| O-12 | The scripted Defense changes (180 → 100 → 150) and Armor Break | `[single source]` for the values; the interaction with Armor Break is unstated. `[estimate]`: Armor Break wins while it lasts, and Dispel on the party does not remove it from him. |
| O-13 | Optional aeons (Anima, Yojimbo, Magus Sisters) in the preset | Design choice. Anima gives the one extra story line; Yojimbo's Zanmato level 4 is sourced. **Ask Bailey.** |
| O-14 | Party stats | `[estimate]`: the BFA preset (§6.2). |
| O-15 | Do we stage the airship battle with Sin? | Recommend **no**: separate fights with their own data (Sin's fins, Sinspawn Genais, Overdrive Sin). Narrate the dive in one line. |
| O-16 | The arena's look (the "staves", the platform) | Unsourced in text. Reference images, then an options round (rule 9). |
| O-17 | The battle cue | Original, through an audio options round (§8.4). |

---

## 11. Recommendation for the chapter (FFX only)

**Build it.** Every stat and action row is decompiled; the disc rules, the attack counter and the Dispel → Ultima pair are 4 to 6 sources each; and the story beat is the pay-off of every other Seymour chapter in the anthology: he claims Sin, and Yuna finally sends him. It also slots cleanly between two built chapters (II Yunalesca, III Braska's Final Aeon) in the same dungeon as III.

**It is a different fight from the other three Seymours.** No minion to kill, no Banish, no Talk, no status threat: a **readable puzzle** (turn the discs, Nul the element, break his defences, burst the Dispel window, survive Ultima). That makes the two hard problems presentation, not engine:

1. **The discs must read at game size**: which colour faces Seymour, on each of four discs, at a glance. This wants an options round with a HUD or diegetic read-out before any painting.
2. **Turning a disc must feel like a move**: Wakka's attack or a spell aimed at a disc, with a visible 90° turn and his affinity updating.

**Minimum mechanic list:**

1. Four untargetable-by-damage, targetable-by-action discs, each rotating 90° per hit (left physical, right magic), reachable physically only by Wakka and the listed aeons (§2, §4.3).
2. Per-disc spells, tier by colour count, four per turn (§4.1).
3. Affinity by colour count, weakness only on four of a kind (§4.2).
4. The 6 / 3 attack counter → glow → Dispel (DEF 100) → Ultima 6:240 (DEF 150, type Other) → reset to the next colour (§4.4).
5. No Banish; absorbing aeons; aeon Shield against Ultima (§4.5).
6. Stats, immunities and rewards exactly as §1 (Armor Break and Mental Break land; Provoke, Slow, Delay, Doom immune).

**Before anything is built (rules 9 and 10):** Bailey sees options for the Garden of Pain, the Omnis and Mortiphasm billboards and how the discs read, the speaker portrait question, and a battle-cue sketch; and answers O-6 and O-13. O-7 and O-11 must be settled from footage or reference images before the engine rules are locked. None of this exists yet.

---

## Sources

**Decompile-derived data** (Grayfox96/FFX-RNG-tracker, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`, loaded into memory only)

- https://github.com/Grayfox96/FFX-RNG-tracker
- `ffx_rng_tracker/data/data_files/ffx_mon_data.csv` and `ffx_mon_data_hd.csv`: `m131`, `m106` (and `m118`, `m150`, `m154`, `m177`, which are not in the formation; `m126` as the parser check)
- `ffx_mon_data` / `ffx_monmagic1` / `ffx_monmagic2` / `ffx_command` through the tracker's action files 3 and 6: rows 3:61, 3:69–76, 3:83, 6:240, 6:242
- `ffx_rng_tracker/data/data_files/monster_actions.json` (`m131`, `m106`) and `formations.json` (`bosses.seymour_omnis`)
- `ffx_rng_tracker/data/monsters.py`, `actions.py`, `constants.py`

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext|revid`, browser user agent; fetched 2026-09-24)

- Seymour Omnis, revid 4032306: https://finalfantasy.fandom.com/wiki/Seymour_Omnis
- Mortiphasm, revid 3981206: https://finalfantasy.fandom.com/wiki/Mortiphasm
- Final Fantasy X enemy abilities, revid 4008011: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities
- Inside Sin, revid 4034458: https://finalfantasy.fandom.com/wiki/Inside_Sin
- Seymour Guado, revid 4034466: https://finalfantasy.fandom.com/wiki/Seymour_Guado
- Fight With Seymour, revid 3980145: https://finalfantasy.fandom.com/wiki/Fight_With_Seymour
- Final Fantasy X: Original Soundtrack, revid 4011106: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_Original_Soundtrack
- Trigger Command, revid 4004212: https://finalfantasy.fandom.com/wiki/Trigger_Command
- Aeon (Final Fantasy X), revid 4029264: https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)
- Sin (Final Fantasy X), revid 4045228 (read; no Omnis content)

**Guides, play record and script**

- GameFAQs, bover_87, *Final Fantasy X Remaster Walkthrough (PC)*, "Sin" page (Sea of Sorrow, Garden of Pain, Seymour Omnis): https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/sin
- Jegged, FFX Walkthrough 31, "Sin" (Sea of Sorrow, Garden of Pain, Seymour Omnis): https://jegged.com/Games/Final-Fantasy-X/Walkthrough/31-Sin.html ; and 32, "Inside Sin" (the point of no return): https://jegged.com/Games/Final-Fantasy-X/Walkthrough/32-Inside-Sin.html
- GamerGuides, FFX HD walkthrough "Inside Sin", boss Seymour Omnis: https://www.gamerguides.com/final-fantasy-x-hd/guide/walkthrough/sin/inside-sin/boss-seymour-omnis_2 ; bestiary: https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/seymour-omnis (same author, same text: counted once)
- Samurai Gamers, *Seymour Omnis Boss Guide*: https://samurai-gamers.com/final-fantasy-x-x2-hd-remaster/seymour-omnis-boss-guide/
- LP Archive, The Dark Id, *Final Fantasy X*, Update 127: https://lparchive.org/Final-Fantasy-X-(by-The-Dark-Id)/Update%20127/
- Auronlu, *FFX Game Script*, Chapter XV: Showdown with Sin: http://auronlu.istad.org/ffx-script/chapter-xv-showdown-with-sin/
- Not retrievable: Game8 (HTTP 403)

**Local prior research consulted:** `research/ffx-seymour-natus-highbridge.md` (format, loader, N-3, N-9), `research/ffx-bfa-yu-yevon.md` §4 and §5.1, `research/ffx-seymour-flux.md` §4.4.2, `research/ffx-combat-core.md` §1.2, §2, §2.9, §4, `research/ffx2-combat-core.md` (opposite pairs), `research/ffx-seymour-anima-macalania.md` (C-6, music), `docs/audio/THEMES.md` §3, `src/story/scripts/seymour-flux.ts`, `src/data/encounters.ts` (chapter order), `docs/target/approved-hashes.json`, `docs/target/decisions.json` D-134.

---

## 12. Verification log (2026-09-24)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Parser correctness | the same in-memory loader on Natus `m126` against the Natus file §1.1 | identical |
| 2 | HP 80,000 / Overkill 15,000 / AP 24,000 (36,000) / Gil 12,000 | decompile + wiki + GameFAQs (+ Jegged, LP for HP) | agree, except GameFAQs HP 60,000 (O-1) |
| 3 | Def 180 / MDef 100 / Mag 35 / Agi 40 | decompile + wiki | agree |
| 4 | PS2 vs HD | byte diff of `m131` and `m106` | `m106` identical; `m131` differs at the one unparsed byte 403 (as Natus) |
| 5 | Formation | `formations.json` `bosses.seymour_omnis` | Omnis + `m106` ×4, no forced party |
| 6 | -ra DC 24, -ga DC 42, single target, reflectable; Ultima 6:240 DC 64 type Other; Dispel on the party | decompiled rows + wiki ability table | agree |
| 7 | Ultima ≈ 89.4 % of a normal Ultima | chain at MAG 35, MDEF 25: 3,577 / 4,000 | 0.894 |
| 8 | Ultima "about 4,000" | chain at MDEF 10: 3,994 (max roll 4,228) | reproduces the play figure |
| 9 | Opening all Fire, weak to Ice | wiki Mortiphasm + GameFAQs + GamerGuides + Samurai | agree |
| 10 | Affinity ladder half / immune / absorb / absorb + weak | 5 sources | agree |
| 11 | Per-disc spells | wiki, Samurai, LP, GamerGuides vs GameFAQs | 4 to 1 (O-3) |
| 12 | 6 attacks, 3 below 20,000 HP; Dispel then Ultima; discs reset after | wiki, GameFAQs, Jegged (6), GamerGuides, LP | agree; reset order conflict O-11 |
| 13 | No Banish; no Talk | wiki, Jegged, GamerGuides; Trigger Command table + Auronlu | agree |
| 14 | Steal Shining Gem / Supreme Gem; drop Lv. 3 Key Sphere | decompile + wiki + GameFAQs + Jegged | agree |
| 15 | Garden of Pain placement, before the point of no return | wiki Inside Sin, Auronlu, Jegged 31/32, GameFAQs | agree |
| 16 | No Omnis / Mortiphasm art exists | `public/art/characters/`, `docs/concepts/chapters/`, `approved-hashes.json` | confirmed absent |
| 17 | Plan review (2026-09-24, `docs/plans/chapter-omnis-review.md` Review) | re-fetched revids; engine `baseDamage` | tables confirmed; corrected here: O-10 is 2 sources to 1 for *next turn*; disc turns in the queue are an `[estimate]`; §3.3 cites §6.2 (was §6.3); which disc drops its spell with a member KO'd is an `[estimate]` |
