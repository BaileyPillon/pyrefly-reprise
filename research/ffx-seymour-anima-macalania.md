# FINAL FANTASY X — Seymour + Guado Guardians + Anima (Macalania Temple): Implementation Reference

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Encounter:** Boss #1 of the Seymour line — Seymour Guado, two Guado Guardians, and his aeon Anima, in the antechamber of the Chamber of the Fayth, Macalania Temple
**Proposed role:** the **FFX tutorial chapter** (CTB, Steal, elemental magic, Nul spells, Overdrives, summoning)
**Research date:** 2026-09-19
**Bestiary entries:** #077 Seymour, #078 Guado Guardian (Macalania Temple variant), #079 Anima
**Internal ids:** Seymour `m124`, Guado Guardian `m141`, Anima `m125`

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

Same vocabulary as `research/ffx-seymour-flux.md` §0.1. Repeated here so this file stands alone.

| Tag | Meaning |
|---|---|
| `[decompiled]` | Byte-level value read out of the game's `ffx_mon_data` / `ffx_monmagic2` / `ffx_command` tables via the Grayfox96 FFX-RNG-Tracker data files, parsed with the repository's own field offsets. Highest confidence available short of running the game. |
| `[verified: 2 sources]` | Two independent sources agree. |
| `[single source]` | One source only. |
| `[derived]` | Computed by me from `[decompiled]` constants using the decompiled damage formula, and cross-checked against at least one independently published number. |
| `[estimate]` | Authored design judgement. Not a measured fact. Must be labelled as such in-product. |

### 0.2 What I actually did

1. Read the local prior research first: `research/ffx-seymour-flux.md` (format, equipment model, Overdrive-gauge model), `research/ffx-combat-core.md` (CTB, damage skeleton, status model, §4.4 Threaten, §6.4 aeon stat derivation, §6.5 aeon gauge), `research/ffx2-bahamut.md` (structure), `research/visual-bible.md`, `research/writing-bible.md`. **Neither FFX chapter file contains Macalania-Seymour data.** Conflicts found against the prior files are recorded in §12 and §13.
2. Pulled the decompile-derived monster table, the four action tables, `monster_actions.json`, `characters.json` and `items.csv` from `Grayfox96/FFX-RNG-tracker` and parsed them with the repository's own byte offsets (`data/monsters.py`, `data/actions.py`, `data/constants.py`). This is the authoritative layer for §1–§4.
3. Re-implemented the decompiled damage formula (`_get_power`, `_get_mitigation`, `get_damage`) and computed §6's tables.
4. Cross-checked against the Final Fantasy Wiki (fetched through the MediaWiki `action=parse&prop=wikitext` API), GamerGuides (two separate pages), StrategyWiki and the FFX speedrunning reference site `grayfox96.github.io/FFX-Info`.
5. **Revision pass (same day).** The document was fact-checked against its own sources; eleven findings were re-verified independently — the monster table was re-parsed from scratch and the wiki pages re-fetched as raw wikitext — and the corrections applied. **Read §14 before trusting any confidence tag in this file:** several were withdrawn or downgraded, two decompiled numbers were wrong, two derived tables were recomputed, and one new blocker was added to §13.

### 0.3 Four independent validations of the damage port (read this before distrusting §6)

The formula port is not asserted, it is **checked against four published numbers that were not used to build it**:

| Published claim | Source | My computed value | Verdict |
|---|---|---|---|
| Anima's **Pain** "will always be between **459 and 518** damage" | FF Wiki *Anima (FFX boss)* and the FFX enemy-ability master table | Special Magic, Anima MAG 20, base 28, defence ignored → **459 … 518** across the full 32-value RNG range | **exact match** |
| Seymour's **-ga** spells "only increase in damage by **about 45%**" after Anima is dismissed | FF Wiki *Seymour (FFX boss)* | base 42, MAG 25 → 32 → **×1.45** | **exact match** |
| His **Multi--ra** spells are "inherently around **60% more powerful**" than the single versions | same | base 24 → 36 at fixed MAG → **×1.64** | match |
| Phase-3 spells are "over **140% more powerful**" than phase-1 | same | base 24 @ MAG 25 → base 36 @ MAG 32 → **×2.41 (+141%)** | **exact match** |

Four independent reproductions from three separate stat/base-damage attributions. §6's tables can be trusted to roughly the width of the ±6% damage-RNG band.

### 0.4 A correction this research forces on two other files — the "Threaten resistance" byte

> **This is the single most load-bearing finding in this document and it is not about this encounter.**

`ffx-seymour-flux.md` §1.3 and §9 **C-2** record an unresolved conflict: the decompiled "Threaten resistance" byte reads **0** for Seymour Flux (which that file read as *landable*), while the FF Wiki and Game8 both call Flux **immune** to Threaten. The same apparent conflict recurs here (Seymour `m124` byte = 0 but the wiki infobox says Threaten Immune) and in reverse for the Guado Guardian (byte = 100, which under a resistance reading would make Threaten mathematically impossible, yet the wiki strategy says Threaten disables the Guardians).

**Both apparent conflicts dissolve: for `Status.THREATEN` the byte is not a resistance. It is the enemy's initial Threaten *chance percent*, exactly the value `ffx-combat-core.md` §4.4 already models.**

Proof — the byte reproduces §4.4's published tier list enemy for enemy, with no exceptions:

| Enemy | §4.4's documented initial chance | Decompiled byte |
|---|---:|---:|
| Sinspawn Echuilles | 255 % | **255** |
| Extractor | 255 % | **255** |
| Bashura | 80 % | **80** |
| Spherimorph | 25 % | **25** |
| Yunalesca | 25 % | **25** |
| *default (every other non-immune enemy)* | 100 % | **100** (e.g. Guado Guardian `m141`, Basilisk, Wendigo) |
| flagged-immune | 0 % (never lands) | **0** (Seymour `m124`, Anima `m125`, Seymour Natus/Omnis/**Flux**, Mortiorchis, Crawler) |

`[verified: 2 sources — decompiled `ffx_mon_data.csv` byte 58 across seven named enemies, matched against the Fandom-documented tier table already transcribed in `ffx-combat-core.md` §4.4]`

**The decisive control is the three Guado Guardians, and it is stronger than the first draft stated.** All three share a species, a name and nearly every other byte, and they split on byte 58:

| Guardian | Byte 58 | FF Wiki infobox | Wiki strategy text |
|---|---:|---|---|
| `m141` (Macalania Temple — **this fight**) | **100** | **no `threaten` line at all** | "Threaten renders them unable to act" |
| `m213` (Lake Macalania / Wendigo) | **0** | `2 threaten = Immune` | — |
| `m222` (Home) | **0** | `3 threaten = Immune` | — |

Re-parsed 2026-09-19 from `ffx_mon_data.csv`; infobox lines read from the *Guado Guardian* page wikitext. A **resistance** reading is arithmetically impossible for `m141`: Heavenly Strike's Threaten landing chance is 100, so `chance = 100 − 100 = 0` could never exceed `rng % 101`, and Threaten would be *unlandable* on the one Guardian every guide tells you to Threaten — while the two the wiki explicitly marks **Immune** would read as fully vulnerable. The byte is a chance, not a resistance, and the sign of the effect is inverted under the wrong reading. This is not a plausible interpretation among several; it is the only one consistent with the data **and** the guides.

**Consequences to apply:**
- **`ffx-seymour-flux.md` C-2 is RESOLVED, in the guides' favour.** Seymour Flux's byte of 0 means **immune**, which is what the wiki and Game8 said all along. There was never a data-vs-guide disagreement, only a misread field. The Flux document's recommendation ("default to immune pending in-game verification") was correct and can now be stated as fact. Threaten must do nothing to Seymour Flux.
- **`ffx-combat-core.md` §4.4 should adopt this byte as its data source** instead of hand-listing tiers: `threatenChance = monData[58]`, with `0 ⇒ immune`. It also gains a free tier the Fandom list omits — anything reading 80 or 25 that nobody has documented.
- In **this** encounter: Seymour and Anima are Threaten-immune; the two Guado Guardians sit in the default 100 % tier, so Auron's Threaten and Shiva's Heavenly Strike genuinely lock them, with the ×0.7-per-success decay of §4.4 shared between both Guardians' own counters.

---

## 1. Enemy stat block — Seymour (`m124`, bestiary #077)

### 1.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **6,000** | `[decompiled]` + wiki + GamerGuides `[verified: 2 sources]` |
| MP | **100** | `[decompiled]` + wiki |
| Overkill threshold | **1,400** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Strength | **20** | `[decompiled]` + wiki |
| Defense | **0** (formula clamps; wiki prints "1") | `[decompiled]` |
| Magic | **25** phase 1 → **32** phase 3 | byte = 25 `[decompiled]`; the 32 is a script-applied change, wiki `[single source]`, but **independently corroborated by §0.3's ×1.45 / ×2.41 reproductions** |
| Magic Defense | **25** | `[decompiled]` + wiki |
| Agility | **20** | `[decompiled]` + wiki |
| Luck | **15** | `[decompiled]` + wiki |
| Evasion | **0** | `[decompiled]` + wiki |
| Accuracy | **100** | `[decompiled]` + wiki |
| AP (normal kill) | **2,000** | `[decompiled]` + wiki `[verified: 2 sources]` |
| AP (overkill) | **3,000** | `[decompiled]` + wiki |
| Gil | **5,000** | `[decompiled]` + wiki |
| Armored | **No** | `[decompiled]` |
| Zanmato level | **4** (byte 402 = 3; the byte is 0-based — §12 C-6) | `[verified: 2 sources]` |
| Doom turns | 3 | `[decompiled]` |
| Poison tick | **10 % of max HP = 600 per turn** | `[decompiled]` + wiki (`poison% = 10`) `[verified: 2 sources]` |

> **600 poison damage per turn against a 6,000 HP boss is 10 % of his bar per tick.** That is the largest proportional poison in any chapter this project has researched, and it is the reason the Guardians carry Remedies (§2.3). Poison is a *strategy*, not a chip effect, in this fight.

### 1.2 Elemental affinities

**All five elements NEUTRAL** — Fire / Ice / Thunder / Water / Holy, no weakness, resistance, absorb or immunity. `[decompiled]`

There is no elemental puzzle *on* Seymour. The elemental content of this fight is entirely about **his** element rotation hitting **the party** (§5.2), which is the opposite shape and is what makes it a good teaching fight for Nul spells.

### 1.3 Status table

Byte semantics for every status **except Threaten**: `0` = no resistance, `1–254` = subtracted from the action's landing chance, `255` = flat immune. The landing roll is `chance = actionLandingChance − targetResistance; rng = rngValue % 101; apply if chance > rng`, with landing chance `255` bypassing immunity and `254` bypassing resistance and RNG entirely. `[verified: 2 sources — grayfox96.github.io/FFX-Info/rng/status-chance + `ffx-combat-core.md` §4.1]` **This closes `ffx-seymour-flux.md` C-8**, which flagged the status-chance formula as "fetch before implementing". It is transcribed above.

| Status | Byte | Practical effect on Seymour | Confidence |
|---|---:|---|---|
| **Poison** | **40** | **Landable.** Bio / Poison Attack (chance 100) lands 60/101 ≈ 59 %. **Poison Fang (chance 254) always lands.** 600 dmg/turn. | `[decompiled]` + wiki |
| **Magic Break** | **50** | **Landable.** Auron's Magic Break (chance 100) lands 50/101. **Banishing Blade (chance 254) always lands** and applies all four Breaks — the wiki names this by name as the way past his partial resistance. | `[decompiled]` + wiki `[verified: 2 sources]` |
| **Armor Break** | **0** | **Fully landable** (100/101 with Auron's skill). Pairs with the physical route once the Guardians stop covering. | `[decompiled]` |
| **Mental Break** | **0** | **Fully landable.** The strongest single buff to the magic route: it strips his Magic Defense contribution. | `[decompiled]` |
| **Slow** | **0** | **Fully landable.** The wiki says so in prose: "Seymour is susceptible to Slow." | `[decompiled]` + wiki `[verified: 2 sources]` |
| Haste / Shell / Protect / Reflect / Regen / all four Nuls / Scan / the four Distillers / Shield / Boost / Curse / Defend / Guard / Sentinel | 0 | Landable (the player can Dispel him, and can Distill him for spheres) | `[decompiled]` |
| **Threaten** | **0 ⇒ IMMUNE** | See §0.4. Threaten and Heavenly Strike do nothing to him. | `[verified: 2 sources]` |
| Death / Zombie / Petrify / Power Break / Confuse / Berserk / Provoke / Sleep / Silence / Dark / Eject / Auto-Life / Doom | 255 | Immune | `[decompiled]` + wiki `[verified: 2 sources]` |

**Other immunity flags (bytes 40–41):** immune to **percentage/fractional damage** (Demi does nothing), immune to **Delay**, immune to **Slice**, immune to **Bribe**. **Not** immune to Sensor or Scan. `immune_to_life` is **set**. `[decompiled]` — the wiki's `demi = Immune`, `delay = Immune`, `bribe = Immune` lines agree `[verified: 2 sources]`.

### 1.4 Rewards

| Reward | Value | Confidence |
|---|---|---|
| Common drop | **Blk Magic Sphere ×1** (×2 on overkill) | `[decompiled]` + wiki + GamerGuides `[verified: 2 sources]` |
| Rare drop | **Special Sphere ×1** (×2 on overkill) | `[decompiled]` + wiki `[verified: 2 sources]` |
| Drop chance | 255 (guaranteed) | `[decompiled]` |
| **Common steal** | **Turbo Ether ×1** | `[decompiled]` + wiki + GamerGuides `[verified: 2 sources]` |
| **Rare steal** | **Elixir ×1** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Steal base chance | 255 (guaranteed) | `[decompiled]` |
| Bribe | **Impossible** | `[decompiled]` + wiki |
| Equipment drop | Drop rate 256 (always). **2–4 slots, 1–2 abilities.** Weapon rolls **Piercing / Silencestrike**; armor rolls **Silenceproof**. | wiki `[single source]`, slot/ability modifiers `[decompiled]` |
| Ronso Rage (Lancet) | **None** — `ronso_rage_id = 0`. Kimahri learns nothing from Seymour, the Guardians or Anima. | `[decompiled]` |

> **Seymour and Anima are the first two enemies in the game that can drop four-slotted equipment.** `[single source: wiki]` If the chapter ships an equipment layer, this is the moment the player's gear stops being a shop list and starts being a build — a genuinely good place to put the equipment tutorial.

### 1.5 Sensor / Scan text (paraphrased — do NOT copy the retail strings)

Sensor is one line: he cycles ice, lightning, water and fire, in that order. Scan says the same and adds the counter-play — have Yuna pre-cast the matching Nul spell — and a warning that he will summon when he is cornered. `[single source: wiki]`

Write original copy in the house telegraph style of `writing-bible.md` §5.3. The *information* is canon; the wording must be ours.

---

## 2. Enemy stat block — Guado Guardian (`m141`, bestiary #078, Macalania Temple variant)

> ⚠ **Three different Guado Guardians exist in the data.** `m141` (HP 2,000) is this fight's. `m213` (HP 1,200) is the pursuit/Wendigo variant on the lake. `m222` (HP 2,600) is the Home variant. **Do not ship `m213`'s Berserk / Summon / Eye Drops script here**, and do not ship `m222`'s Silence/Confuse anti-Lulu script either. `[decompiled]` + wiki (three-column infobox) `[verified: 2 sources]`

### 2.1 Core stats — two of these, one on each side of Seymour

| Field | Value | Confidence |
|---|---:|---|
| HP | **2,000** | `[decompiled]` + wiki `[verified: 2 sources]` |
| MP | 10 | `[decompiled]` + wiki |
| **Overkill threshold** | **2,000 — equal to its full HP** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Strength | 10 | `[decompiled]` + wiki |
| Defense | 0 (wiki prints 1) | `[decompiled]` |
| Magic | 15 | `[decompiled]` + wiki |
| Magic Defense | 0 (wiki prints 1) | `[decompiled]` |
| Agility | **12** | `[decompiled]` + wiki |
| Luck | 15 | `[decompiled]` + wiki |
| Evasion / Accuracy | 0 / 100 | `[decompiled]` + wiki |
| AP (normal / overkill) | **290 / 435** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Gil | 300 | `[decompiled]` + wiki |
| Armored | No | `[decompiled]` |
| Doom turns | **1** | `[decompiled]` |
| Poison tick | **25 % of max HP = 500 per turn** | `[decompiled]` + wiki |
| Zanmato level | **4** (byte = 3, 0-based — C-6) | `[verified: 2 sources]` |

> **The overkill threshold equals its whole HP bar.** A Guardian can only be overkilled by a *single hit of 2,000 or more* — i.e. by killing it outright from full. That is a real, teachable overkill lesson at exactly the power level where the player's best single hit is about to cross 2,000.

### 2.2 Status table

| Status | Byte | Effect |
|---|---:|---|
| **Petrify** | **0** | **Fully landable — and this is the fight's shortcut.** Kimahri's **Stone Breath** and Rikku's **Petrify Grenade** both petrify, and a petrified monster always shatters (`[verified: 2 sources — grayfox96 status-chance note + wiki strategy]`). Shattering **forfeits the overkill AP**. |
| **Threaten** | **100 ⇒ default 100 % tier** (§0.4) | Auron's Threaten / Shiva's Heavenly Strike lock a Guardian out of its turn. ~4–5 reliable locks before the shared per-enemy chance decays under 25 % (`ffx-combat-core.md` §4.4). |
| **Death** | **10** | Landable at 90/101 with a chance-100 source; Death Attack-class items apply at 254. |
| **Silence** | **20** | Wakka's Silence Attack lands 80/101; Silence Buster / Silence Grenade (254) always. Silencing a Guardian makes it **Remedy itself** (§2.3), which wastes its turn — a strictly good outcome. |
| Zombie / Poison / all four Breaks / Dark / Slow / Eject / the buff statuses | 0 | Landable |
| Confuse / Berserk / Provoke / Sleep / Auto-Life / Doom | 255 | Immune |

Not immune to percentage damage, Delay, Slice or Bribe. `[decompiled]`

### 2.3 The Guardians' three jobs (this is the whole of act one)

1. **Cover.** A living Guardian intercepts **physical** attacks aimed at Seymour. They cannot cover magic. `[verified: 2 sources — wiki *Guado Guardian* battle section + wiki *Seymour (FFX boss)* battle section]`
2. **Heal.** They carry Hi-Potions. **Auto-Potion** fires as a counter on themselves when they take damage (**scope disputed — see the box below, and C-11**), and **Hi-Potion** is used on Seymour when he drops below **4,800 HP** (80 %) *and the Guardians still have access to Hi-Potions*. Both restore a flat **1,000 HP**. If Seymour is **poisoned** they spend turns on **Remedy**. If a Guardian is itself **Silenced or Poisoned**, it Remedies itself. **Neither Remedy branch is gated on the potion supply** — Steal removes Auto-Potion and the Hi-Potion-on-Seymour line only. `[verified: 2 sources — wiki *Guado Guardian* battle section ("If Seymour falls below 4,800 HP **and the Guardians still have access to Hi-Potions**…"; the two Remedy sentences carry no such qualifier) + wiki infobox `1 info` line ("Steal disables ability to use Auto-Potion and Hi-Potion" — Remedy is not named) + FFX enemy-ability master table ("Restores 1,000 HP")]`

> ⚠ **What triggers Auto-Potion is not settled, and it changes the magic route.** The FF Wiki contradicts itself **on the same page**: *Seymour (FFX boss)* §Battle says the Guards use Hi-Potions "whenever they **take damage**", and its own §Strategy two paragraphs later says "whenever they are **hit with a physical attack**". The *Guado Guardian* page says "heal themselves with Hi-Potions **when damaged**". So: does a Lulu Blizzara into a Guardian trigger the 1,000 HP counter, or not? `[single source, self-contradictory]` — recorded as **C-11**, must be resolved in-game. Recommend shipping **any damage triggers it** (the majority reading, and the harsher one), behind a single flag so the other branch is one line away.
3. **Harass.** Otherwise: **50 % chance to do nothing**, and an even split of **Thunder**, **Blizzard** and **Shremedy** across the remaining half. Shremedy is a thrown item-shaped attack that inflicts **Confusion at 50 %** and no damage. `[verified: 2 sources — wiki battle section + `[decompiled]` action rows]`

### 2.4 Steal — the mechanic the chapter is named for

| Fact | Value | Confidence |
|---|---|---|
| Common steal | **Hi-Potion ×1** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Rare steal | **Ether ×1** (byte) — **the wiki says Hi-Potion** | **conflict, see C-1** |
| Base steal chance | 255 | `[decompiled]` |
| **Stealing disables the Guardian's Auto-Potion *and* its Hi-Potion-on-Seymour — and nothing else** | **yes** | `[verified: 2 sources — wiki infobox info line ("Steal disables ability to use Auto-Potion and Hi-Potion") + wiki strategy section + GamerGuides]` |
| **Stealing does NOT disable either Remedy branch** | **correct — do not gate them** | `[verified: 2 sources]`; see §2.3 and the fact-check log row 1 |
| **Each Guardian can be stolen from successfully only once** | **yes** | `[single source: wiki infobox info line]` |
| Bribe | **Ether ×10**, max cost 50,000 gil (= HP × 25) | `[decompiled]` + wiki `[verified: 2 sources]` |

**Implementation shape.** Give each Guardian a boolean `hasPotions`, initialised true. A **successful** Steal sets it false *and* consumes that Guardian's one steal. A failed Steal consumes nothing. While `hasPotions` is false the Guardian can neither counter with Auto-Potion nor spend a turn on Hi-Potion; it falls through to the Remedy / harassment branch. This is a **two-turn investment (one Steal each) that removes 2,000+ HP of healing from the boss** — the cleanest possible demonstration of why a non-damage command matters, and the reason this is the right fight to teach Steal in.

### 2.5 Rewards

Common and rare drop: **Ability Sphere ×1** (×2 on overkill), drop chance 255. Equipment drop rate 256, **1–3 slots** `[verified: 2 sources]`, **exactly 2 ability rolls** `[decompiled]` — the wiki infobox's `1 equip ability min = 1 / max = 3` is a **conflict, see C-13**; weapon rolls Sensor / Piercing / Strength +3 % / Strength +5 % / Magic +3 % / Magic +5 %, armor rolls HP +10 % / HP +5 % / Magic Def +5 %. `[decompiled]` + wiki `[verified: 2 sources]`

---

## 3. Enemy stat block — Anima (`m125`, bestiary #079)

### 3.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **18,000** | `[decompiled]` + wiki `[verified: 2 sources]` |
| MP | 50 | `[decompiled]` + wiki |
| Overkill threshold | **1,400** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Strength | **25** | `[decompiled]` + wiki |
| Defense | 0 (wiki prints 1) | `[decompiled]` |
| Magic | **20** | `[decompiled]` + wiki |
| Magic Defense | 0 (wiki prints 1) | `[decompiled]` |
| Agility | **25** | `[decompiled]` + wiki |
| Luck | 20 | `[decompiled]` + wiki |
| Evasion | 0 | `[decompiled]` + wiki |
| **Accuracy** | **30** | `[decompiled]` + wiki |
| AP (normal / overkill) | **2,500 / 3,750** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Gil | 3,000 | `[decompiled]` + wiki |
| Armored | No | `[decompiled]` |
| Poison tick byte | 25 % — **moot, she is Poison-immune** | `[decompiled]` |
| Doom turns | 3 | `[decompiled]` |
| Zanmato level | **4** (byte = 3, 0-based — C-6) | `[verified: 2 sources]` |

### 3.2 Status and immunity table

**Immune (255):** Death, Zombie, Petrify, **Poison**, all four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Dark, Slow, **Scan**, Eject, Auto-Life, Doom. Also flagged `immune_to_scan`, `immune_to_delay`, `immune_to_slice`, `immune_to_bribe`. `[decompiled]` + wiki `[verified: 2 sources]`

**Landable (0):** Threaten — but the §0.4 byte reads **0**, so she is **Threaten-immune**; Shell, Protect, Reflect, all four Nuls, Regen, Haste, the four Distillers, Shield, Boost, Curse, Defend, Guard, Sentinel.

**Not immune to percentage damage.** `[decompiled]` Combined with Boost (§3.4) this is the wiki's explicitly documented exploit: fractional-damage abilities such as Demi can kill her, because Boost's ×1.5 is applied *immediately before the damage cap*. `[single source: wiki]` — irrelevant to our preset (§8 has no Demi) but it must not be accidentally blocked by the engine.

**Enemy flags:** Tough, **Heavy**, immune to Eject, **the party cannot escape**. `[single source: wiki]`

### 3.3 Rewards

Common / rare drop **Ability Sphere ×1** (×2 overkill), chance 255. **Common steal Silence Grenade ×3, rare steal Farplane Shadow ×1**, chance 255 `[decompiled]` + wiki `[verified: 2 sources]`. Bribe impossible. Equipment drop rate 256, **2–4 slots, 1–2 ability rolls** `[decompiled]` — the wiki infobox's `1 equip ability max = 3` is a **conflict, see C-13**; weapon rolls Piercing / Darktouch / Silencetouch / Sleeptouch, armor rolls Dark Ward / Silence Ward / Sleep Ward. `[decompiled]` + wiki

> Anima's slot and ability-roll modifier bytes (173 = 15, 177 = 13) are **byte-identical to Seymour's**, so the two must print the same ability-roll range — and §1.4 correctly prints **1–2** for Seymour. The wiki agrees with the decompile on Seymour (`equip ability min = 1 / max = 2`) and disagrees on Anima (`1 / 3`) off the same data row, which is an inconsistency on the wiki's own side.

> The **rare steal is a Farplane Shadow** — the Death Ward catalyst that `ffx-seymour-flux.md` §7.7.1 rules "available by Zanarkand". One of them is available *here*, three chapters earlier. A continuity detail worth keeping if the anthology ever models a shared save.

### 3.4 Boost — the mechanic the Anima act is built on

`Boost` is a real aeon sub-command (`ffx_command.csv` #85, status flag `Boost`), and Anima uses it on herself.

| Rule | Value | Confidence |
|---|---|---|
| Damage and healing **taken** | **×1.5**, applied **immediately before the damage cap** | wiki `[single source]` |
| Duration | until her next turn | wiki `[single source]` |
| Effect on her Overdrive charge rate | **none** — this is the trap. Boost normally accelerates an aeon's gauge (`ffx-combat-core.md` §6.5); **Anima's gauge here charges a fixed amount per turn taken and per time she is targeted, independent of Boost.** | wiki `[single source]` |
| Player reading | Boost is a **free damage window the boss hands you**, once every two turns | `[derived]` |

**She alternates Pain and Boost.** `[verified: 2 sources — wiki *Anima (FFX boss)* battle section + wiki *Seymour (FFX boss)* cross-reference]` So the loop the player learns is: *she Boosts → you dump your biggest hit → she Pains → repeat*, while a third clock (the Overdrive gauge) counts down to Oblivion. Three interleaved rhythms, none of them hidden. That is a very good second combat lesson.

---

## 4. Exact action data (decompiled rows)

All rows below are byte-level reads from `ffx_command.csv` (file id 3), `ffx_monmagic1.csv` (file 4) and `ffx_monmagic2.csv` (file 6), keyed by the ids `monster_actions.json` assigns. `[decompiled]`

### 4.1 Seymour's action list (`m124`)

| Action | File/ID | Target | Formula | Base | Hits | Element | Notable flags |
|---|---|---|---|---:|---:|---|---|
| **Shell** | 3 / 58 | **Self** | Magic | 0 | 1 | — | MP 10, Shell @ 254, reflectable, silenceable, long range |
| **Blizzara** | 3 / 70 | Random Character | Magic | **24** | 1 | Ice | MP 8, shatter 10, reflectable, silenceable, `ignores_armored` |
| **Thundara** | 3 / 71 | Random Character | Magic | **24** | 1 | Thunder | as above |
| **Watera** | 3 / 72 | Random Character | Magic | **24** | 1 | Water | as above |
| **Fira** | 3 / 69 | Random Character | Magic | **24** | 1 | Fire | as above |
| **Blizzaga** | 3 / 74 | Random Character | Magic | **42** | 1 | Ice | MP 16 — **used only against a summoned aeon** |
| **Thundaga** | 3 / 75 | Random Character | Magic | **42** | 1 | Thunder | MP 16 — aeon only |
| **Waterga** | 3 / 76 | Random Character | Magic | **42** | 1 | Water | MP 16 — aeon only |
| **Firaga** | 3 / 73 | Random Character | Magic | **42** | 1 | Fire | MP 16 — aeon only |
| **Multi-Blizzara** + **Multi-Blizzara 2nd Hit** | 6 / 173 + 174 | Single Character (script-picked; see C-3) | Magic | **36** each | 1 each | Ice | phase 3 only, reflectable, silenceable, **not** `ignores_armored` |
| **Multi-Thundara** (+2nd Hit) | 6 / 175 + 176 | as above | Magic | **36** each | 1 each | Thunder | phase 3 only |
| **Multi-Watera** (+2nd Hit) | 6 / 177 + 178 | as above | Magic | **36** each | 1 each | Water | phase 3 only |
| **Multi-Fira** (+2nd Hit) | 6 / 171 + 172 | as above | Magic | **36** each | 1 each | Fire | phase 3 only |
| **Special 1** | 6 / 1 | **M4** (Anima's slot) | No Damage | 0 | 0 | — | idle/no-op — this is Seymour's turn while Anima is on the field |

> **Curiosity worth keeping for the animation layer:** the Multi- variants are **the only non-physical damage in the game that is not Piercing.** `[single source: wiki]` It has no gameplay consequence (characters cannot be Armored) but it is a real authored quirk.

### 4.2 Guado Guardian's action list (`m141`)

| Action | File/ID | Target | Formula | Base | Effect |
|---|---|---|---|---:|---|
| **Protect** | 3 / 59 | **Self** | Magic | 0 | Protect @ 254, MP 12. **Opening move, before the player's first turn.** |
| **Blizzard** | 3 / 65 | Random Character | Magic | **12** | Ice, MP 4, shatter 10 |
| **Thunder** | 3 / 67 | Random Character | Magic | **12** | Thunder, MP 4, shatter 10 |
| **Auto-Potion** | 4 / 16 | **Counter Self** | Fixed (no variance) | **20** | Heals **1,000** (`base × 50`). Fires as a counter on being damaged. Disabled by a successful Steal. |
| **Hi-Potion** | 6 / 62 | **M2** (Seymour) | Fixed (no variance) | **20** | Heals Seymour **1,000**. Spends the Guardian's turn. Disabled by a successful Steal. |
| **Remedy** | 6 / 64 | **M2** (Seymour) | Magic | 0 | Cures Petrify, Poison, Confuse, Berserk, Sleep, Silence, Dark, Slow on Seymour |
| **Remedy (self)** | 6 / 64 | **Self** | Magic | 0 | Same, on itself |
| **Shremedy** | 6 / 65 | Random Character | Magic | 0 | **Confuse @ 50.** No damage. |

### 4.3 Anima's action list (`m125`)

| Action | File/ID | Target | Formula | Base | Hits | Effect |
|---|---|---|---|---:|---:|---|
| **Summon Anima** | 6 / 181 | Self | No Damage | 0 | 0 | The entrance. Owned by the **Anima** actor, not Seymour's. |
| **Boost** | 3 / 85 | **Self** | No Damage | 0 | 1 | Status flag `Boost`. §3.4. |
| **Pain** | 6 / **222** | Random Character | **Special Magic** | **28** | 1 | **Death @ 100 %**, `ignores_armored`, **ignores Magic Defense**, ignores Heavy/Tough. **459–518 damage, always.** ⚠ **not the same action as Yuna's Anima's Pain — see the box below and §13 row 8** |
| **Oblivion** (Overdrive) | 6 / 223 | **Characters' Party** | Strength | **4** | **16** | `ignores_armored`, ignores Heavy/Tough. Mitigated by the target's **Defense**. |
| **Seymour dismisses Anima!** | 6 / 81 | Self | No Damage | 0 | 0 | Removes Anima from the battle when she is defeated. |

> ⚠ **`Pain` is TWO different actions and they carry different DmgCon values. Do not share one ability definition.**
>
> | Which | Action | DmgCon | Damage at MAG 20 |
> |---|---|---:|---|
> | **This boss** (Seymour's Anima, `m125`) | monmagic2 **#222** | **28** | **459–518** |
> | **Yuna's Anima** (the player's aeon) | monmagic2 **#220** — already defined in `ffx-combat-core.md` §6.3's aeon table | **20** | 328–370 |
>
> Both numbers are right for their own row. I re-executed the chain to confirm which belongs here: Special Magic POWER = (20³ // 32) + 30 = **280**, × 28/16 = **490**, × 240/256 … × 271/256 = **459 … 518** — reproducing the published figure exactly. DmgCon 20 yields **328–370** and cannot produce it. An implementer who reuses `ffx-combat-core.md` §6.3's `Pain` for this encounter ships a boss doing ~70 % of canon damage. `[verified: 2 sources — `[decompiled]` action ids + FF Wiki *Anima (FFX boss)* "always be between 459 and 518"]` Recorded as a forced correction in **§13 row 8**.

**Pain, precisely.** The Special Magic formula ignores the target's Magic Defense entirely, so Pain's damage is **flat across the whole party** — 459 to 518, never more, never less, before Shell. The rider is a **100 % Death flag**, so on a party member it is not "500 damage", it is a **kill**. On an aeon it is 500 damage and nothing else, because aeons carry the hidden Aeon Ribbon (`ffx-seymour-flux.md` §7.7.1) and cannot be instant-killed. **That single asymmetry is the entire reason act two is an aeon duel.** `[verified: 2 sources — enemy-ability master table "Inflicts 459~518 damage", Death 100 % + wiki strategy "aeons are immune to Instant Death and only suffer damage"]`

**Oblivion, precisely.** In the **International / PAL / HD** builds — which is our declared baseline per `ffx-combat-core.md` §0 — Oblivion is **16 separate hits**, and the total is about **85.3 %** of the original single-hit PS2-NA figure. Power is **4 per hit (INT/PAL)** versus **75 (original NA)**; our data file carries the 16-hit version. `[verified: 2 sources — `[decompiled]` `n_of_hits = 16`, `base_damage = 4` + the FF Wiki enemy-ability master table's INT/PAL footnotes]`

### 4.4 Dummied content — do NOT implement

Seymour's Anima has **three dummied attacks**: physical-attack variants with perfect accuracy and no crit capability, each inflicting **Sleep**, **Silence** or **Darkness** for two turns at 100 %. They are never scripted. `[single source: wiki]` Leave them out; if a designer wants a fourth Anima move later, these are the canon-legal candidates.

---

## 5. Fight structure — three acts

The wiki describes it in one line: *the battle is fought in three segments, the second against his summoned aeon.* `[verified: 2 sources — wiki + GamerGuides]` Everything below expands that.

### 5.1 Turn-order fundamentals

Agilities: **Seymour 20, Anima 25, Guado Guardian 12.** Party Agility at this story point is roughly 7–26 (§8.3), so:

- The **Guardians are slow** — slower than almost everyone. They are the punching bag whose turns the player can out-pace.
- **Seymour at 20 is mid-pack**, comparable to Tidus and faster than Auron, Lulu and Wakka.
- **Anima at 25 is faster than everything the player owns**, including Shiva. Shiva is the **fastest aeon the player owns** — the wiki's claim is that she has the *highest initial Agility of all the aeons* (base 14), which ranks her against other aeons, not against this boss. `[verified: 2 sources — wiki *Shiva (FFX)* profile + its stat-growth table]` At the shipped preset row (§8.4, 180–209 battles) **Shiva's Agility is 22 against Anima's 25**; she does not pass 25 until the 240–269 row (27), which is outside the preset. **Do not build an act-two rationale on turn order.**

> The aeon duel rests on **one** thing and it is enough: Pain's 100 % Death rider fails against an aeon's hidden **Aeon Ribbon** (§4.3, §8.4), so the same action that kills a party member merely hurts Shiva. That asymmetry is independently confirmed and does not need a speed argument propping it up.

Reuse `ffx-combat-core.md` §1 wholesale for ICV, ranks and prediction. There is **no alternation / two-turns-in-a-row guard** in this encounter — that rule is specific to the Flux fight. Do not copy it over.

### 5.2 Act one — Seymour + two Guado Guardians

**Opening, before the player's first turn:** both Guardians cast **Protect on themselves** and Seymour casts **Shell on himself.** `[verified: 2 sources — wiki *Seymour (FFX boss)* + wiki *Guado Guardian*]` The board the player first sees is already buffed. That is a deliberate opening statement and should be staged as a scripted pre-turn sequence, not as three ordinary turns.

**Seymour's rotation is a fixed cycle, and it never varies:**

| Step | Spell | Element |
|---:|---|---|
| 1 | **Blizzara** | Ice |
| 2 | **Thundara** | Thunder |
| 3 | **Watera** | Water |
| 4 | **Fira** | Fire |
| → | loop | |

`[verified: 2 sources — wiki battle section + wiki Scan text + GamerGuides]`

Each is a single hit on a **random party member**. Because the order is fixed and published in his own Scan text, **the player can always know the next element** — the pre-commitment loop the chapter is meant to teach.

**Against a summoned aeon he uses the -ga tier instead** — Blizzaga, Thundaga, Waterga, Firaga — **even when the aeon absorbs that element.** `[single source: wiki]` So a summoned **Shiva** is *healed* by his Blizzaga turn (she has Ice Eater) and hurt by the other three. Implement this as a target-class branch on his spell selection, not as a separate rotation; the elemental order is the same.

**Guardian behaviour per turn** (§2.3), in priority order:

```
// Branch ORDER below follows the wiki's own sentence order. It is NOT independently
// sourced — see C-12. Only the SET of branches is sourced, not their priority.
if (seymour.hp < 4800 && this.hasPotions)                -> HiPotion(seymour)        // heals 1000
else if (seymour.hasStatus(POISON))                      -> Remedy(seymour)          // NOT gated on hasPotions
else if (this.hasStatus(SILENCE) || this.hasStatus(POISON)) -> Remedy(self)           // NOT gated on hasPotions
else roll:  50% -> doNothing()
            else uniformly one of { Thunder, Blizzard, Shremedy }
// counter, not a turn:
onDamaged() { if (this.hasPotions) autoPotion(self); }   // heals 1000; trigger scope = C-11
```
`[verified: 2 sources — wiki *Guado Guardian* battle section (the 4,800 threshold, the potion-supply qualifier, the two Remedy branches and the 50 %/even-split roll) + GamerGuides]` for the **branch set**; `[single source]` and unsourced respectively for the **branch order** (C-12) and the **Auto-Potion trigger scope** (C-11).

> **The Remedy branches must fire whether or not the Guardian has been stolen from.** The wiki gates only the Hi-Potion-on-Seymour line on supply, and the infobox names only Auto-Potion and Hi-Potion as what Steal disables. Gating Remedy as well would silently double the value of the poison route (§6.2, §7 row 8) — one Steal per Guardian would buy an uncontested 600 dmg/turn — and make the fight materially easier than canon. Steal is already strong enough; do not overpay it.

**Cover:** while at least one Guardian lives, physical attacks targeted at Seymour are intercepted by a Guardian. Magic is never covered. `[verified: 2 sources]`

**Act-one exit condition: Seymour's HP reaches 3,000 (50 %).** `[verified: 2 sources — wiki "After Seymour's HP drops to 3,000" + GamerGuides "drops below 3,000"]` He then summons Anima, and **any living Guado Guardians are killed** by the summon. `[verified: 2 sources]`

**He cannot be killed before he summons.** A blow that would kill him leaves him at **1 HP**. In the HD Remaster this is enforced by **capping every hit on him at 5,999 damage until Anima has been summoned**; on PS2 the same situation with a Doublecast whose second spell dealt 6,000+ **softlocks the game.** `[verified: 2 sources — wiki *Seymour (FFX boss)* behind-the-scenes + wiki *Anima (FFX boss)* behind-the-scenes]`

> Ship the **HD behaviour** (the declared baseline): clamp incoming damage on Seymour to 5,999 while `!animaSummoned`, and floor his HP at 1 until the summon script has run. Write a test for it. The PS2 softlock is a bug, not a feature, and reproducing it would be an own goal.

### 5.3 Act two — Anima

**Anima enters in enemy slot 4.** Seymour remains on the field but does nothing: his only scheduled action for this stretch is `Special 1`, a zero-hit no-op **targeted at M4**. `[decompiled]` See **C-2** for the one thing this does not settle: whether he is *targetable* while she is out.

**Anima's loop: alternate Pain and Boost**, while a **third clock** — her Overdrive gauge — advances **a fixed amount every time she takes a turn and every time she is targeted**, Boost-independent. `[single source: wiki]` When it fills she uses **Oblivion**.

| Her action | What it does |
|---|---|
| **Boost** | Takes ×1.5 damage and healing until her next turn. Gives the player the damage window. |
| **Pain** | 459–518 damage **and a 100 % KO** on a party member; 459–518 and nothing else on an aeon. |
| **Oblivion** | 16 hits on the whole party, mitigated by Defense. ~1,700–2,100 total at this story point's Defense values (§6.4). |

**Act-two exit:** Anima at 0 HP → the script fires **"Seymour dismisses Anima!"** and she is removed. `[decompiled]` + wiki `[verified: 2 sources]`

### 5.4 Act three — Seymour alone

On Anima's removal, **Seymour returns to full health (6,000) with no Guardians**, and his Magic rises **25 → 32**. `[verified: 2 sources — FF Wiki *Seymour (FFX boss)* ("After Anima is defeated, Seymour will return to full health"; "His Magic stat goes from 25 to 32") + GamerGuides]` — StrategyWiki was cited here in the first draft and is not in this file's Sources; the two sources named above are the ones actually read.

He now casts the **Multi-** version of his -ra spell **twice in one turn** — the pair `Multi-X` + `Multi-X 2nd Hit`, base 36 each `[verified: 2 sources — wiki *Seymour (FFX boss)* "start casting his -ra spells twice in one turn" + `[decompiled]` action rows]`.

**Whether the ice → thunder → water → fire order persists into act three is `[single source]`.** The FF Wiki never restates the order for phase 3 — it says only that he casts the -ra spells twice per turn. The order claim comes from **GamerGuides' Macalania Temple walkthrough** alone (the first draft credited it to "wiki + StrategyWiki", which matches neither the wiki text nor this file's own Sources section). It is plausible — all four Multi- rows exist in the data, and nothing suggests the cycle resets — but it is one source. **Verify in-game (C-14)**; the whole Nul-spell finale depends on it.

Net effect, reproduced exactly by §0.3's arithmetic: **each hit is ~2.41× a phase-1 spell, and there are two of them per turn.** Against a party whose members hold 700–1,600 HP (§8.3), **one hit is close to lethal on the mages and a heavy hit on everyone else.** This is the difficulty spike of the encounter and it is entirely answered by the Nul spells, which the whole fight has been teaching.

**His HP bar is not restored between act one and act three in any sense the player can bank:** the 3,000 damage spent in act one is gone. The fight's real HP budget is **6,000 (act one, half of it) + 18,000 (Anima) + 6,000 (act three) ≈ 27,000**, of which only about 3,000 + 18,000 + 6,000 = **27,000** must actually be dealt.

### 5.5 Trigger Commands (pre-battle **Talk**)

| Character | Bonus | Confidence |
|---|---|---|
| **Tidus** | **+10 Strength** | `[verified: 2 sources — wiki *Seymour (FFX boss)* + wiki *Trigger Command* + GamerGuides]` |
| **Yuna** | **+10 Magic Defense** | `[verified: 2 sources]` |
| **Wakka** | **+10 Magic Defense** | `[verified: 2 sources]` |

> ⚠ **This is not the Flux fight's set.** `ffx-seymour-flux.md` §4.7 has **Kimahri +10 STR / Yuna +10 MDef**; the *Trigger Command* master table lists **Tidus, Yuna, Wakka** for *this* Seymour, **Tidus, Yuna, Auron** for Natus and **Yuna, Kimahri** for Flux. Do not share one table across the Seymour chapters. `[verified: 2 sources]`

+10 Magic Defense on Yuna and Wakka is worth roughly **6–8 %** off every -ra hit (§6.2) — small but real, and it is the right size for a tutorial: a visible reward for reading, not a solved fight.

### 5.6 Reference AI pseudocode

```ts
// ---- SEYMOUR (m124) ----
const ELEMENT_CYCLE = ['Ice', 'Thunder', 'Water', 'Fire'] as const;   // §5.2, never varies

function seymourPreBattle() {                       // §5.2, before the first player turn
  cast(Shell, SELF);
  for (const g of guardians) g.cast(Protect, SELF);
}

function seymourTurn(state) {
  if (state.animaOnField) return noop();            // Special 1 -> M4, §4.1
  const el = ELEMENT_CYCLE[state.cycleStep++ % 4];
  if (state.playerAeonOnField) return cast(gaSpell(el), randomCharacter());   // -ga, even if absorbed
  if (state.phase === 3) {                                                    // §5.4
    cast(multiSpell(el), randomCharacter());
    return cast(multiSpell2ndHit(el), randomCharacter());                     // see C-3
  }
  return cast(raSpell(el), randomCharacter());
}

function onSeymourDamaged(dmg, state) {
  if (!state.animaSummoned) {
    dmg = Math.min(dmg, 5999);                      // HD clamp, §5.2
    seymour.hp = Math.max(1, seymour.hp - dmg);     // never dies before the summon
    if (seymour.hp <= 3000) summonAnima();          // kills every living Guardian
    return;
  }
  seymour.hp -= dmg;
}

function summonAnima() {
  for (const g of guardians) if (g.alive) kill(g);  // §5.2
  spawn(ANIMA, MonsterSlot.M4);
  state.animaOnField = true; state.animaSummoned = true;
}

function onAnimaDefeated() {
  play('Seymour dismisses Anima!'); despawn(ANIMA);
  state.animaOnField = false;
  seymour.hp = seymour.maxHp;                       // full 6,000, §5.4
  seymour.magic = 32;                               // 25 -> 32, §5.4
  state.phase = 3;
}

// ---- GUADO GUARDIAN (m141) ---- see §5.2 for the branch order
onGuardianStolenFrom(success) { if (success) { this.hasPotions = false; this.stealUsed = true; } }
onGuardianDamaged() { if (this.hasPotions) counter(HiPotion_AutoPotion, SELF); }   // heals 1000

// ---- ANIMA (m125) ----
function animaTurn(state) {
  advanceOverdriveGauge(FIXED_PER_TURN);                       // Boost-independent, §3.4
  if (gaugeFull()) { gauge = 0; return cast(Oblivion, CHARACTERS_PARTY); }
  state.animaBoostNext = !state.animaBoostNext;
  return state.animaBoostNext ? cast(Boost, SELF) : cast(Pain, randomCharacter());
}
function onAnimaTargeted() { advanceOverdriveGauge(FIXED_PER_TARGETING); }   // §3.4; value = open question C-4
```

---

## 6. Damage model and computed tables

Formula, mitigation and post-multiplier order are `ffx-combat-core.md` §2 / `ffx-seymour-flux.md` §5.1 — not restated. All figures below are the **mid-RNG** value (`damage_rng = 16`) with the min/max of the 32-value RNG band where useful, **no Protect, no Shell, no Cheer/Focus** unless stated.

### 6.1 Act one — what the party takes

**Seymour's -ra spells (Magic, base 24, MAG 25)** — one random character per turn:

| Target Magic Defense | min | **mid** | max | with Shell | with the right Nul |
|---:|---:|---:|---:|---:|---:|
| 10 (Tidus, Auron, Kimahri, Wakka, Rikku) | 670 | **715** | 756 | 357 | **0** |
| 16 | 641 | **684** | 724 | 342 | **0** |
| 22 | 613 | **655** | 693 | 327 | **0** |
| 28 (Yuna, Lulu) | 585 | **625** | 661 | 312 | **0** |
| 38 (Yuna/Lulu with the Talk bonus and a Magic Def piece) | 541 | **578** | 611 | 289 | **0** |

`[derived]` from `[decompiled]` constants. (The MDef-38 row read 549 / 586 / 620 in the first draft — an arithmetic slip of ~1.4 %, corrected on re-execution of the §2.1–2.3 chain. The other four rows reproduce exactly.)

**Guado Guardian Thunder / Blizzard (Magic, base 12, MAG 15 → POWER 147):** **~108–139 at mid-RNG across the party's Magic Defense range of 7–40** (§8.3), or **~101–147** including the full damage-RNG band. Per-target: MDef 10 → 136, MDef 22 → 125, MDef 32 (Lulu) → 116, MDef 40 (Lulu, high end) → 108. With the Talk bonus Wakka and Yuna sit lower still (MDef 45 → ~104). `[derived]` — recomputed from `ffx-combat-core.md` §2.1–2.3; the first draft's "118–141" did not span the §8.3 party. Chip damage — deliberately trivial next to Seymour's 700. The Guardians are a *support* problem, not a damage problem, and the numbers say so loudly enough that a first-timer can read it.

**Shremedy:** 0 damage, Confusion at 50 %. `[decompiled]`

### 6.2 Act one — what the party deals

Into Seymour: **Defense 0** (physical) and **Magic Defense 25** (magic), **Shell halving all magic** until Dispelled or Aerosparked.

| Attack | vs Seymour, no Shell | **with his Shell** |
|---|---:|---:|
| Lulu Blizzara, MAG 22 | 520 | **260** |
| Lulu Blizzara, MAG 26 | 680 | **340** |
| Lulu Blizzara, MAG 30 | 870 | **435** |
| Lulu Blizzara, MAG 34 | 1,081 | **540** |
| Plain physical, STR 18 | 210 | *(blocked by Cover)* |
| Plain physical, STR 22 | 359 | *(blocked by Cover)* |
| Plain physical, STR 26 | 575 | *(blocked by Cover)* |
| Plain physical, STR 30 | 867 | *(blocked by Cover)* |

`[derived]`

Into a **Protected** Guado Guardian (Defense 0, physical halved):

| Attacker Strength | damage per hit |
|---:|---:|
| 14 | **57** |
| 18 | **106** |
| 22 | **181** |
| 26 | **289** |

`[derived]` — and every one of those hits triggers a **1,000 HP Auto-Potion** counter until you steal. **At STR 22 a Guardian out-heals four consecutive attacks.** That is the number that makes Steal mandatory rather than optional, and it should be visible to the player in the damage numerals within two turns.

**Poison on Seymour: 600 per turn, 10 % of his bar.** Landing it with a Poison Fang (chance 254, unblockable by his 40 resistance) and then killing the Guardians so they cannot Remedy him is the fastest documented act-one clear. `[derived]` + `[decompiled]`

### 6.3 Act two — Anima

**Pain: 459–518, flat, on anyone.** Plus a guaranteed KO on a party member; damage only on an aeon. `[verified: 2 sources]`

**Oblivion, 16 hits (Strength formula, STR 25, base 4):**

| Target Defense | per hit | **16-hit total** | with **Shield** (÷4) |
|---:|---:|---:|---:|
| 8 (a squishy party member) | 122 | **1,952** | — |
| 12 | 119 | **1,904** | — |
| 16 | 115 | **1,840** | — |
| 20 | 112 | **1,792** | — |
| 21 (Shiva at ~150 battles) | 111 | **1,776** | **444** |
| 23 (Shiva at ~190 battles) | 109 | **1,744** | **436** |
| 26 (Shiva at ~240 battles) | 107 | **1,712** | **428** |

`[derived]` — an unshielded Oblivion **kills the whole party outright** at this story point. Shielded, Shiva eats it for ~440 and keeps going. **That single comparison is the entire lesson of the aeon sub-command menu.**

**Shiva's output into Anima (Defense 0 / Magic Defense 0):**

| Shiva action | MAG/STR 33/23 (~150 battles) | 34/25 (~190) | 42/27 (~240) |
|---|---:|---:|---:|
| Plain Attack (aeon weapon base 14) | 356 | 449 | 560 |
| **Heavenly Strike** (Strength, base 17) | 432 | 546 | 680 |
| **Blizzara on herself** (absorbed — a heal) | **+957** | **+976** | **+1,101** |
| **Diamond Dust** (Special Magic, base 60) | **4,323** | **4,717** | **8,793** |
| **Diamond Dust into a Boosted Anima (×1.5)** | **6,484** | **7,075** | **9,999 (capped)** |

`[derived]` from `[decompiled]` constants and the wiki's own Shiva stat-growth table.

> **Read the last row.** Anima has 18,000 HP. **Two Diamond Dusts landed on Boost turns plus a handful of attacks clears the act.** Landing them off-Boost costs the player a third of that damage. The fight teaches "hit the window" without a single line of tutorial text.
>
> Note also that **Heavenly Strike does nothing extra here** — its Threaten rider is dead against Anima (§0.4), so it is a slightly-better Attack and no more. Do not build a tip around it.

### 6.4 Act three — the spike

**Multi--ra (Magic, base 36, MAG 32), per hit, two hits per turn:**

| Target Magic Defense | **per hit** | turn total (2 hits, worst case on one target) | per hit with Shell |
|---:|---:|---:|---:|
| 10 | **1,727** | 3,454 | 864 |
| 16 | **1,653** | 3,306 | 827 |
| 22 | **1,582** | 3,164 | 791 |
| 28 | **1,511** | 3,022 | 756 |
| 38 | **1,396** | 2,792 | 698 |
| **any, with the matching Nul up** | **0** *(first hit — see C-3)* | | |

**Seymour's -ga against a summoned aeon (Magic, base 42):**

| Aeon Magic Defense | MAG 25 (acts 1–2) | MAG 32 (act 3) |
|---:|---:|---:|
| 20 | 1,327 | 1,927 |
| 25 | 1,278 | 1,857 |
| 30 | 1,230 | 1,786 |
| 38 (Shiva, ~190 battles) | ~1,150 | ~1,690 |

`[derived]` — and against **Shiva specifically the Blizzaga step of the cycle *heals her* by that amount**, because he uses the -ga tier on aeons regardless of absorption (§5.2). One turn in four, the boss tops up your aeon. That is a canon behaviour, it is funny, and it is a free teaching moment about elemental affinity; keep it.

---

## 7. Player strategies — the mechanics that MUST work

Ordered by how central they are. Every row is something a published guide actually recommends.

| # | Strategy | Requires | Source |
|---:|---|---|---|
| 1 | **Steal from each Guardian once** to kill Auto-Potion and the Hi-Potion-on-Seymour line — **and nothing else; both Remedy branches survive** | Steal; per-enemy `hasPotions`; one-successful-steal limit | `[verified: 2 sources]` |
| 2 | **Petrify the Guardians** — Kimahri's Stone Breath (all enemies) or Rikku's Petrify Grenade — for an instant kill, at the cost of the overkill AP | Petrify + always-shatter on monsters; AP accounting that distinguishes shatter from overkill | `[verified: 2 sources]` |
| 3 | **Threaten the Guardians** to lock them out of their turns | Threaten with `ffx-combat-core.md` §4.4's per-enemy decaying chance, sourced from the mon-data byte (§0.4) | wiki `[single source]` |
| 4 | **Dispel Seymour's Shell**, or use **Ixion's Aerospark**, to double all magic damage on him | Dispel; Aerospark's buff-strip rider | `[verified: 2 sources]` |
| 5 | **Pre-cast the matching Nul spell** each turn using his published ice→thunder→water→fire order | NulBlaze/NulFrost/NulShock/NulTide, single-use, consumed by the matching element | `[verified: 2 sources]` |
| 6 | **Reflect** on the party as a blanket alternative to Nul spells | Reflect bouncing single-target enemy magic back | wiki `[single source]` |
| 7 | **Magic Break Seymour** — Auron's skill at 50/101, or **Banishing Blade** which applies all four Breaks at chance 254 and ignores his partial resistance | Break statuses; the 254-bypasses-resistance rule | `[verified: 2 sources]` |
| 8 | **Poison Seymour** (Poison Fang always lands) for 600/turn — but the Guardians must be **dead**, not merely stolen from: **Steal does not disable Remedy** (§2.3) | Poison as % of max HP; the Guardians' Remedy branch, ungated by `hasPotions` | `[derived]` + `[decompiled]` |
| 9 | **Slow Seymour** (fully landable) | Slow / CTB manipulation | `[verified: 2 sources]` |
| 10 | **Haste the party** (Tidus) | Haste | wiki `[single source]` |
| 11 | **Summon Shiva against Anima** — she is immune to Pain's instant death and only takes the damage | Aeon summon; Aeon Ribbon as the mechanism, not a hard-coded exception | `[verified: 2 sources]` |
| 12 | **Shield before Oblivion**, then drop it | Aeon Shield sub-command (÷4 damage, zero gauge gain) | `[verified: 2 sources]` |
| 13 | **Heal Shiva with her own Blizzara** (Ice Eater) between Pains | Elemental absorb on aeon armor abilities | `[verified: 2 sources]` |
| 14 | **Save Diamond Dust for a Boost turn** (×1.5) | Boost as a damage-taken multiplier applied before the cap | `[derived]` from wiki's Boost description |
| 15 | **Grand Summon Shiva with a full gauge** to open act two hot | Grand Summon's temporary-gauge behaviour (`ffx-combat-core.md` §6.5) | wiki `[single source]` |
| 16 | **Bank a Shiva Overdrive out of act two into act three** to delete Seymour's second bar | Aeon gauge persisting across the act transition and across dismiss | `[single source: EIP/community strategy, surfaced via search]` — **verify, see C-5** |

---

## 8. Typical player party at this point — authored story-progress preset

> **`[estimate]`, not a measured population average** — same construction and the same caveats as `ffx-seymour-flux.md` §7. The anchors underneath it are verifiable: base stats are `[decompiled]`, shop stock and ability availability are wiki-sourced, the aeon stats are cross-validated two ways (§8.4), and the stat ranges are back-solved against §6's damage math. Label it a development preset in-product.

### 8.1 Story position

Guadosalam (Seymour's proposal, the Farplane, Jyscal's sphere) → **Thunder Plains** → **Macalania Woods** (**Spherimorph** — mandatory) → **Lake Macalania** (Rin's agency; the Al Bhed) → **Macalania Temple**: Cloister of Trials, Yuna prays and receives **Shiva**, the guardians watch Jyscal's sphere in the Nuns' Chamber, Tromell's gifts, the confrontation in the antechamber.

**All seven characters are available.** Rikku joined at the Moonflow, two areas back, which is exactly why this is the right fight to teach Steal in — the command is new.

### 8.2 Base stats at Sphere Level 0 (exact, for reference)

Identical table to `ffx-seymour-flux.md` §7.2 `[decompiled: characters.json]`. Not restated; reference that file.

### 8.3 Estimated stats at Macalania Temple — `[estimate]`

Typical **sphere levels used ≈ 14–22** per character for a non-grinder here (excluding Rikku's +25 starting offset), against 28–40 at Mt. Gagazet.

| Character | HP | MP | STR | DEF | MAG | MDEF | AGI | LUCK | EVA | ACC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tidus** | 900–1,400 | 40–70 | 18–24 | 10–16 | 8–14 | 8–14 | 18–24 | 18 | 14–20 | 14–20 |
| **Yuna** | 900–1,250 | 150–210 | 8–11 | 8–11 | 26–33 | 28–35 | 11–14 | 17 | 32–34 | 4–6 |
| **Auron** | 1,600–2,200 | 40–60 | **28–34** | 18–24 | 6–10 | 7–12 | 8–12 | 17 | 6–10 | 5–9 |
| **Kimahri** | 900–1,500 | 80–120 | 18–24 | 15–20 | 17–22 | 7–12 | 9–14 | 18 | 6–12 | 7–12 |
| **Wakka** | 1,000–1,500 | 30–55 | 20–25 | 12–17 | 11–15 | 7–12 | 9–13 | 19 | 6–10 | **30–40** |
| **Lulu** | 700–1,000 | 170–240 | 6–9 | 9–13 | **30–38** | **32–40** | 7–11 | 17 | 40–44 | 4–7 |
| **Rikku** | 700–1,000 | 90–120 | 13–17 | 9–13 | 11–15 | 9–13 | **20–26** | 18 | 7–11 | 7–11 |

`[estimate]`. **The Yuna row is better than an estimate** — see §8.4.

Cross-check against §6: Seymour's 715-damage -ra against a 900–1,400 HP Tidus is a 51–79 % hit; a single phase-3 Multi hit of ~1,700 against a 700–1,000 HP Lulu is a **kill**. The preset and the damage tables agree that this fight is dangerous without Nul spells and comfortable with them, which is what every guide says about it.

### 8.4 Aeons — and the cross-validation that makes them trustworthy

Shiva's published stat-growth table is indexed by **number of battles fought**. At a normal Macalania-Temple pace that is roughly **150–240 battles**.

| Battles | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 150–179 | 1,178 | 35 | 23 | 21 | 33 | 34 | 19 | 35 | 12 |
| **180–209 (the recommended preset row)** | **1,342** | **40** | **25** | **23** | **34** | **38** | **22** | **39** | **13** |
| 210–239 | 1,384 | 41 | 25 | 24 | 37 | 42 | 22 | 39 | 13 |
| 240–269 | 1,444 | 44 | 27 | 26 | 42 | 42 | 27 | 39 | 14 |

`[single source: FF Wiki *Shiva (Final Fantasy X)* stat-growth table]` — **upgraded to `[verified: 2 sources]`** by the following independent reproduction:

Running `ffx-combat-core.md` §6.4 / `research/data/aeon-growth-reference.json`'s derivation — Shiva's coefficients applied to §8.3's Yuna row at encounter tier 5 (≈190 battles) — produces **HP 1,342 / MP 40 / STR 26 / DEF 23 / MAG 34 / MDEF 38 / AGI 22 / EVA 39 / ACC 15**. **Seven of nine** stats match the published row exactly — HP, MP, DEF, MAG, MDEF, AGI and EVA; only **STR and ACC** differ, by 1 and 2, because §8.3's authored Yuna exceeds the encounter floor on those stats. (The first draft said "six of nine", which contradicted its own "STR and ACC differ" in the same sentence. The published row itself is confirmed correct: all four rows quoted in the table above — 150–179, 180–209, 210–239, 240–269 — match the wiki's stat-growth table verbatim, re-checked 2026-09-19. The conclusion stands; only the count was wrong.)

**Two consequences worth stating plainly:**
1. The **aeon derivation in `ffx-combat-core.md` §6.4 is now independently validated** against a published table it was not built from.
2. **§8.3's Yuna row is validated too** — an authored preset that reproduces a published aeon table to within 1–2 points on 6 of 9 stats is not a guess. Promote the Yuna row from `[estimate]` to `[derived]`.

The other three aeons, by the same derivation at tier 5 `[derived]`:

| Aeon | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Valefor** | ~1,146 | 38 | 27 | 35 | 31 | 37 | 15 | 24 | 17 |
| **Ifrit** | ~1,515 | 36 | 29 | 46 | 30 | 32 | 13 | 12 | 17 |
| **Ixion** | ~1,513 | 40 | 31 | 40 | 30 | 46 | 11 | 13 | 19 |
| **Shiva** | **1,342** | **40** | **25** | **23** | **34** | **38** | **22** | **39** | **13** |

**Aeon default equipment** is the `ffx-seymour-flux.md` §7.7.1 table: every aeon carries the hidden **Aeon Ribbon** (this is *why* Pain cannot kill them — do not hard-code an exception), **Valefor alone lacks Piercing**, and **Shiva's aeon weapon base damage is 14, not 16**. Shiva's armor carries **Ice Eater**, which is what makes strategy 13 work. `[decompiled: characters.json]` + wiki `[verified: 2 sources]`

**Bahamut is not owned yet** (Bevelle is chapters away). **Anima is not owned** — the Destruction Sphere in *this temple's* Cloister of Trials is one of the prerequisites, which is a nice piece of dramatic irony to surface in the chapter's framing. `[single source: wiki]`

### 8.5 Abilities plausibly known — `[estimate]`

| Character | Likely has | Explicitly probably **not** yet |
|---|---|---|
| **Tidus** | Cheer, Provoke, **Haste** (borderline but the wiki's strategy assumes it), Delay Attack, Flee, Talk | Hastega, Slow, Quick Hit |
| **Yuna** | Cure, **Cura** (borderline), Life, **all four Nul spells**, Esuna (borderline), Scan, Pray, Shell/Protect (borderline), Grand Summon | **Dispel** (deep in the Wht Magic path), Holy, Full-Life, Auto-Life |
| **Auron** | Power Break, **Magic Break** (borderline), Armor Break (borderline), **Threaten** (borderline), Guard; Piercing katana by default | Mental Break, Sentinel |
| **Wakka** | Dark Attack, Silence Attack (borderline), Aim | Triple Foul, Drain |
| **Lulu** | Fire/Blizzard/Thunder/Water, **the full -ra tier** (borderline), Focus, Scan | Bio, the -ga tier, Doublecast, Demi, Flare |
| **Rikku** | **Steal**, Use, Flee; Mix | Mug (borderline), Luck |
| **Kimahri** | Lancet, Jump; **Stone Breath** (Lancet on a **Basilisk**, Djose Highroad — two regions back), Seed Cannon (Ragora, Kilika), Fire Breath / Self-Destruct (borderline) | Thrust Kick, Mighty Guard, White Wind, Bad Breath |

`[estimate]` for who owns what; the **ability names, their grid families and Stone Breath's source enemy are wiki-sourced** `[verified: 2 sources — FF Wiki *Ronso Rage* learn-from table + *Basilisk (FFX)* location]`.

> **Design consequence worth protecting:** a typical Yuna does **not** have Dispel here. The wiki's own strategy offers **Ixion's Aerospark** as the alternative, and Aerospark is a *free aeon sub-command*, not an Overdrive. So the answer to Seymour's Shell is "summon the right aeon", which is exactly the lesson the chapter wants. Do not hand the preset Dispel.

### 8.6 Overdrives available

| Character | Available here | Confidence |
|---|---|---|
| **Tidus** — Swordplay | **Spiral Cut**; Slice & Dice at 10 cumulative Overdrive uses (borderline) | wiki `[single source]` |
| **Auron** — Bushido | **Dragon Fang** (default) and **Shooting Star** — unlocked by *defeating Spherimorph*, which is **mandatory and happens in Macalania Woods, one region before this fight**. **Banishing Blade** (three Jecht Spheres) is reachable if the player backtracks to the Thunder Plains / Macalania Woods spheres, and the wiki names it for this fight. | `[verified: 2 sources — FF Wiki *Bushido (FFX)* unlock table + wiki Seymour strategy]` |
| **Yuna** — Grand Summon | always | wiki |
| **Wakka** — Slots | **Element Reels** only, realistically (Attack/Status Reels need blitzball prizes) | wiki `[single source]` |
| **Lulu** — Fury | always; limited to spells she knows; **bypasses Reflect and Shell, ignores Silence, costs no MP** — a real counter to Seymour's Shell | wiki `[single source]` |
| **Kimahri** — Ronso Rage | **Stone Breath**, plus whatever else he has Lancet'd | wiki |
| **Rikku** — Mix | always | wiki |

**Overdrive Modes:** realistically **Stoic** for everyone, with Warrior/Healer possible for the front-liners and Yuna. Same reasoning and the same exact increment formulas as `ffx-seymour-flux.md` §7.9–7.9.1; not restated.

**Gauge values at encounter start — `[estimate]`, with one hard rule:**

| Actor | Start gauge | Why |
|---|---:|---|
| Tidus / Wakka | 35–50 % | a Thunder Plains and Macalania Woods approach |
| Yuna | 30–45 % | Healer/Stoic, some curing on the way |
| Auron | 55–70 % | Stoic, he takes the hits |
| Lulu / Rikku | 30–45 % | |
| Kimahri | 40–55 % | |
| Valefor | 80–100 % | the aeon used casually since Besaid |
| Ifrit | 50–70 % | |
| Ixion | 50–70 % | |
| **Shiva** | **0 % — this is a rule, not a choice** | **She was obtained minutes ago and has never been in a battle.** Her gauge cannot be carried in. She must fill it inside this fight (or be Grand Summoned). |

That last row is the whole reason the Anima act has a shape: the player's newest, best answer arrives **empty**, fills over one or two exchanges with Anima under `ffx-combat-core.md` §6.5's model, and only then can spend Diamond Dust. Do not "helpfully" start Shiva at 100.

### 8.7 Equipment and shops — the shop is part of the encounter

Two shops sit between the player and this boss, and between them they sell the answers.

**Rin's Travel Agency, Lake Macalania** (on the frozen lake, one region before the temple) — **the cheap slot supply**: every weapon is **Strength +5 %** (or **Magic +5 %** for Yuna and Lulu) **+ 1 empty slot** at **825 gil** (1,650 for Kimahri's Halberd and Auron's Shimmering Blade); every **Seeker's** armor is **HP +10 % + 1 empty slot** at **1,575 gil**. Also Potion 50, Hi-Potion 500, Phoenix Down 100, Antidote/Eye Drops/Echo Screen/Soft 50 each, **Grenade 300**. `[single source: FF Wiki *Final Fantasy X shops*]`

**O'aka XXIII, Macalania Temple Hall** — **appears only after the party views Jyscal's sphere in the Nuns' Chamber**, i.e. literally one room before the fight. Prices swing ±25 % on the answer the player gave him back in Macalania Woods. `[single source: wiki *Macalania Temple*]`

| Item | User | Cost (Just right → Too pricey) |
|---|---|---:|
| Sonic Steel | Tidus | 18,450 → 13,837 |
| Halberd | Kimahri | 3,900 → 2,925 |
| Force Knuckles | Rikku | 1,950 → 1,462 |
| **Serum Ring** | Yuna | 4,350 → 3,262 |
| **Echo Bangle** | Lulu | 4,650 → 3,487 |
| **Echo Armlet** | Kimahri | 1,650 → 1,237 |
| **Soft Bracer** | Auron | 3,750 → 2,812 |
| Soldier's Targe | Rikku | 3,450 → 2,587 |
| Potion / Hi-Potion / Phoenix Down / Antidote / Eye Drops / Echo Screen / Soft | — | 100 / 1,000 / 200 / 100 / 100 / 100 / 100 |

**Tromell hands the party a Shell Targe (SOS Shell, Rikku) as a gift before the battle.** `[single source: wiki]` — a free, plot-delivered piece of the answer, handed over by the man who will disown them an hour later.

**Items found in the temple before the fight:** 400 gil, **5,000 gil**, **X-Potion ×2**, Phoenix Down ×3, Ether, **Elixir**, **Remedy ×2**, Hi-Potion ×2, Luck Sphere (Cloister of Trials), plus the Shell Targe. `[single source: wiki]`

**What the player cannot buy, and why that matters.** There is **no Confuse Ward** anywhere in this stretch — its catalyst is 16× Musk, and Musk's only realistic pre-airship source is a Floating Eye bribe at 3,500 gil a piece (≈56,000 gil) or the Mt. Gagazet Ahriman, chapters away (`ffx-seymour-flux.md` §7.7.1). **So Shremedy's Confusion has no equipment answer at this point in the game** — the player must eat it and cure it with a Remedy, with Esuna, or by hitting the confused ally. That is a real, sourced constraint and it is what stops the Guardians from being pure filler.

### 8.8 Authored loadout for the preset — `[estimate]` composition, `[verified]` components

Budget: the 5,000 gil chest in the temple plus whatever is carried in; the Rin stock below totals under 12,000 gil for the whole party.

| Character | Weapon | Slots | Weapon abilities | Armor | Slots | Armor abilities |
|---|---|---:|---|---|---:|---|
| **Tidus** | Baroque Sword (Rin, 825) | 2 | Strength +5 %, *empty* | Seeker's Shield (1,575) | 2 | HP +10 %, *empty* |
| **Yuna** | Ductile Rod (Rin, 825) | 2 | Magic +5 %, *empty* | Seeker's Ring (1,575) | 2 | HP +10 %, *empty* |
| **Auron** | *default katana* | 1 | **Piercing** | **Soft Bracer** (O'aka) | — | Stone Ward family |
| **Kimahri** | *default spear* | 2 | **Piercing**, Sensor | **Echo Armlet** (O'aka) | — | Silence Ward family |
| **Wakka** | Switch Hitter (Rin, 825) | 2 | Strength +5 %, *empty* | Seeker's Armguard (1,575) | 2 | HP +10 %, *empty* |
| **Lulu** | Variable Mog (Rin, 825) | 2 | Magic +5 %, *empty* | **Echo Bangle** (O'aka) | — | Silence Ward family |
| **Rikku** | Devastator (Rin, 825) | 2 | Strength +5 %, *empty* | **Shell Targe** (Tromell, free) | — | **SOS Shell** |

Notes that make this *the Macalania loadout*:
- **Nobody has an elemental ward, and that is correct.** Seymour cycles all four elements; warding one would be strictly worse than the **Nul spells**, which are free, retargetable and the thing the chapter is teaching.
- **Nobody has Confuse protection**, because it does not exist yet (§8.7).
- **Rikku's SOS Shell comes from Tromell**, so the one piece of the answer the player did not buy was given to them by the enemy's own retainer. Keep that; it is free characterisation.
- Piece names above are from the shop tables; the ability **families** implied by the "Serum / Echo / Soft" naming are `[derived]` from the armor ability-priority naming table in `ffx-seymour-flux.md` §7.7.1 and should be confirmed against the individual item pages before shipping exact ability strings (**C-7**).

### 8.9 Typical inventory — `[estimate]`

Potion 20–40 · Hi-Potion 5–15 · **X-Potion 2** (both found here) · Phoenix Down 10–25 · **Remedy 2–4** (two found here; *the* Confusion answer) · Ether 2–5 · **Elixir 1–2** · Antidote / Eye Drops / Echo Screen / Soft 5–15 each · Grenade 5–15 · **Petrify Grenade 2–8** (common steal *and* bribe from Basilisk on the Djose Highroad) · Silence Grenade 0–3 · **Poison Fang 0–3** · gil 5,000–20,000.

**Petrify Grenade and Poison Fang are the two consumables that change this fight**, and both come from a fiend the player has already been fighting for two regions. That is the honest, canon route to the strategies in §7, and it is why the preset carries them.

---

## 9. Scene, story beats and appearance notes

### 9.1 Where

**Macalania Temple, the antechamber outside the Chamber of the Fayth.** `[verified: 2 sources — wiki *Macalania Temple* enemy list ("Antechamber") + wiki *Seymour (FFX boss)*]`

The temple is **built primarily of ice** and stands **on top of the perpetually frozen Lake Macalania**. Its fayth and its aeon are both female; its High Priest is Seymour himself. `[verified: 2 sources — wiki *Macalania Temple* + wiki *Shiva (FFX)*]`

**Painters' brief — the hall `[estimate]` beyond the sourced facts above:**
- **Material story:** everything is ice pretending to be masonry. Columns, arches and stairs read as carved and polished rather than built; edges are slightly rounded, as if the building has been melting and refreezing for a thousand years. Warm gold Yevon metalwork and braziers are set *into* the ice, and the ice carries their light sideways for metres. The single most valuable thing a painting of this room can do is **make the light travel through the walls**.
- **Palette:** cold end — glacier blue, pale cyan, white with a faint green core in the thick ice; warm end — brazier gold, deep temple red, Guado ochre. Almost nothing in the middle. This is the **coldest** set in the anthology and should not share a palette with Mt. Gagazet, which is snow and grey rock; Macalania is **translucent**, Gagazet is **opaque**.
- **Camera:** the standard battle-camera convention of `visual-bible.md` §2.0. The shot wants **depth through the ice**: the Chamber-of-the-Fayth door glowing behind the enemy line, the ramp to the Cloister falling away behind the party.
- **The room must be shown before it is fought in.** A held establishing frame of the empty antechamber — the door, the light, the silence — before any combatant walks into it.

### 9.2 Seymour (human form) — painters' notes

Sourced description, in words only: a **tall Guado-human hybrid**, 187 cm, **light blue hair** with **two long horn-like locks running down his back** and a heavy fringe over one side of the face; **purplish-blue eyes**; **ornate robes unlike the other maesters'** — predominantly **dark blue with red trim and a green sash** — open above the waist, exposing a chest marked with **leonine tattoos**; sleeves long enough to half-swallow the hands; **pointed fingers**, more so than a human's, less so than a full Guado's; **rounded, human ears**, not the Guado's elf ears; **pronounced facial veins** and veins arching over the stomach, inherited from the Guado. He carries a staff as a maester, but **in this battle he has no staff and never uses his Overdrive**; he resembles his guest-party-member appearance from Operation Mi'ihen. `[verified: 2 sources — wiki *Seymour Guado* appearance section + wiki *Seymour (FFX boss)*]`

**Direction for the face pass:** he must read as **courteous** in the establishing frame and **obscene** in the same face two beats later, with no change of costume and almost no change of expression. The performance is in the eyes and the stillness. Per `writing-bible.md` §1.9 he is serene about atrocity; the painting has to be able to hold that.

### 9.3 Guado Guardians — painters' notes

Two identical retainers flanking him, one per side. Guado physiology: **long pointed fingers, elf-like ears, pronounced veining, tall and narrow**. Robed retinue dress in Guado ochre and green, subordinate in silhouette to Seymour — they should read as **furniture that moves**, which is exactly their mechanical role. `[derived]` from the Guado description in wiki *Seymour Guado*; their own artwork exists but must not be referenced directly (hard rule 8).

One visual job: **the potion.** The moment Rikku steals from a Guardian has to be legible at a glance, and the moment the Guardian reaches for a potion it no longer has is the single best piece of physical comedy in the encounter. Give them a belt pouch that is visibly full and then visibly empty.

### 9.4 Anima — painters' notes

**A towering two-part creature.** The **upper half is heavily restrained** — bound, chained, arms pinned. The **lower half is a horned demon**. A **picture of her fayth hangs at her neck, painted with a glowing halo like a saint's**. `[verified: 2 sources — wiki *Anima (summon)* profile + wiki *Anima (FFX boss)*]`

Two things the engine and the painters both need:
1. **Seymour's Anima uses a different, notably shorter 3D model than Yuna's, Belgemine's or Dark Anima's.** `[single source: wiki]` If the anthology ever paints a second Anima, these are **two different sizes of the same creature**, and the Macalania one is the smaller.
2. Her seal glyph is annotated with the kanji for **darkness**, and the glyph appears at the end of her Overdrive. We cannot reuse the glyph; we need **our own mark that does the same job** — a dark counterpart to Shiva's ice mark.

**The entrance is the chapter's money shot.** She arrives from below, still bound, and the two Guardians die when she does. Stage the summon as a single continuous camera move, and do not cut away from it.

### 9.5 Shiva — painters' notes

**Slim, feminine, humanoid, minimally clothed**, and the distinguishing feature is the hair: **long, bright blue dreadlocks tied up.** Her seal is annotated with the kanji for **ice**. Her victory pose is to **sweep her hair back**. She has the **highest initial Agility and second-highest Evasion of any aeon**, and her animation should read that way — fast, light, unhurried. **Ice attacks heal her.** `[verified: 2 sources — wiki *Shiva (FFX)* profile + battle section]`

**She is unnamed when she arrives.** Yuna can summon her in this fight before the player has named her, and she is displayed as **"????"**. `[single source: wiki]` That is a free, canon, and genuinely lovely presentation beat: the CTB portrait and the target label both read as unknown until the fight is over. **Ship it.**

### 9.6 Beat sheet — before the battle

Summarised in my own words throughout; nothing below is a transcript.

| # | Beat | Who | Tone |
|---:|---|---|---|
| 1 | At the Farplane in Guadosalam, Jyscal's spirit will not stay down. Yuna sends him. He leaves a sphere behind. | Yuna | Quiet dread |
| 2 | The sphere names his murderer: his son. Yuna hides it and tells no one. She decides to accept Seymour's proposal so she can deal with him herself, alone. | Yuna | The decision that drives the chapter |
| 3 | She goes ahead to the temple. The guardians follow, find the sphere in her things, and watch it in the Nuns' Chamber. | guardians | The floor tilts |
| 4 | Tromell escorts them, courteous and proud, and gives them gifts — including armour they will use against his master within the hour. | Tromell | Unbearable politeness |
| 5 | The guardians confront Seymour in the antechamber **before Yuna comes out of the Chamber of the Fayth.** | Tidus, Auron, Wakka, Lulu, Kimahri, Rikku | Accusation |
| 6 | Seymour does not deny the patricide. He explains it. Then he works out what Yuna was really planning to do, and says so, because taking that from her costs him nothing. | Seymour | Serene, obscene |
| 7 | Yuna emerges, having just received Shiva. Seymour stops pretending. | Yuna, Seymour | The turn |
| 8 | **BATTLE.** Trigger Commands: Tidus (+10 STR), Yuna (+10 MDef), Wakka (+10 MDef). | — | — |

`[verified: 2 sources — wiki *Macalania Temple* story section + wiki *Seymour Guado* story section]`

### 9.7 Beat sheet — after the battle

| # | Beat | Who | Tone |
|---:|---|---|---|
| 9 | Seymour falls. He is dead — properly dead, not dissolved like Flux will be. | Seymour | Flat, anticlimactic |
| 10 | Yuna kneels to send him. **Tromell and the Guado take the body away before she can**, and brand the party traitors for killing a Maester. Tromell destroys Jyscal's sphere — the only evidence. | Tromell, Yuna | The injustice that sets up the whole middle act of the game |
| 11 | Because he is not sent, Seymour becomes an **unsent**. The chapter's consequence is a villain who will be back three more times. | — | Dramatic irony |
| 12 | The party flees the temple. Guado Guardians pursue with fiends. | — | Chase |
| 13 | On the frozen lake, the **Wendigo** fight breaks the ice and the party falls through. | — | Fall |
| 14 | At the lake bed, **Shiva's fayth is still audible**, singing the Hymn through the ice above. Sin has come to listen too, and takes them. | — | Awe |

`[verified: 2 sources — wiki *Macalania Temple* story + wiki *Shiva (FFX)* story]`

**Chapter framing recommendation.** This is the one Seymour fight the party **wins cleanly and loses completely**. They kill him and it costs them their standing, their evidence, their pilgrimage's legitimacy and, eventually, Yuna's freedom. The mechanics rhyme with it: **the boss you beat gets his whole HP bar back once, and the thing you actually killed — Anima — was his mother.** If the chapter says one thing, say that.

### 9.8 Music

| Cue | Track | When | Confidence |
|---|---|---|---|
| Entering the temple | **"The Temple Players"** (寺院楽隊), 2:20 | as the party enters Macalania Temple | `[single source: wiki OST track list]` |
| After Jyscal's sphere | **"Out of the Frying Pan"** (夢も希望もありません), 2:50 | plays **before** this fight | `[single source: wiki OST]` |
| **The battle** | **"Seymour's Ambition"** (シーモアの野望), **2:19** | "plays when Seymour reveals his true intentions at Macalania, **and when the party battles him there**" | `[single source: wiki OST track list]` |
| Chamber of the Fayth | **"Hymn of the Fayth – Shiva"**, 0:37 | in the chamber, and still audible under the lake afterwards | `[verified: 2 sources — wiki OST + wiki *Macalania Temple*]` |
| The escape | **"Pursuit"** (迫りくる者たち), 2:08 | as the Guado chase the party out | `[verified: 2 sources]` |

> ⚠ **Not "Challenge", and not "Fight With Seymour".** "Challenge" is the *difficult-boss* theme (Sinspawn Gui 2, **Seymour Flux**, Yunalesca, Omega Weapon, Dark Bahamut) — it belongs to the Flux chapter, per `ffx-seymour-flux.md` §8.5. **"Fight With Seymour" (シーモアバトル, 6:49) is Seymour *Omnis*** and belongs to neither. This fight has its own cue, and it is a **short one — 2:19**, notably shorter than "Challenge"'s 4:14. `[single source: wiki OST track list, which states each track's battle usage individually]`
>
> **Do not transcribe, sample or arrange any of these.** The brief below exists so we can commission an original piece for the same slot.

**Mood/tempo brief for an original composition** `[estimate — my characterisation, for briefing purposes; hard rule 13 means Bailey judges the result from `docs/audio/audition.html`, not me]`:

| Parameter | Target |
|---|---|
| Length | **Short loop, ~2:00–2:20.** It should feel like it comes round again sooner than a boss theme ought to. |
| Tempo | Moderate and **unhurried** — around 120–132 BPM. This villain is not in a rush. |
| Texture | **Orchestral and ceremonial**, not industrial. Strings, low brass, a struck metal or bell layer that reads as *temple*. It should sound like a piece of liturgy that has been bent slightly out of true. |
| Harmony | Minor, with the cadences of religious music used insincerely — a plagal turn that resolves somewhere slightly wrong. |
| Melody | A **stated theme**, unlike the Flux chapter's motif-fragment approach. Seymour has an argument; the music should have a sentence. |
| Arc | Enters already composed and confident; rises once, at the summon; returns to composure. No triumphal release. |
| Emotional read | **Courteous menace.** The difference from the Flux chapter must be audible in one bar: Flux is *oppressive and inhuman*, this is *polite and wrong*. |
| Anti-brief | Avoid: synth-forward industrial textures, gated percussion, the relentless single-pedal ostinato — those are "Challenge"'s job and the Flux chapter owns them. Also avoid heroic brass; nobody is being heroic here. |

Since the anthology now has two Seymour chapters, **the two themes must be distinguishable within two seconds.** That contrast is the point, and it is faithful: the original score distinguishes them too.

---

## 10. What this fight can teach a first-time player

The task brief proposes this as **the FFX tutorial chapter**. It is well chosen, and here is the case, mechanic by mechanic. Each row is something the encounter teaches **through its own canon behaviour**, with no invented tutorial scaffolding.

| # | Lesson | How the fight teaches it, canonically |
|---:|---|---|
| 1 | **The CTB turn list is a plan, not a decoration** | The Guardians are Agility 12 against a party at 7–26. The player can *see* two of their own turns queued before a Guardian acts, and act on it. Slow (landable on Seymour) and Haste make the list visibly move. |
| 2 | **A non-damage command can be the strongest move on the board** | One Steal per Guardian deletes 2,000+ HP of healing. §6.2's table shows a STR-22 physical doing 181 into a 1,000-HP Auto-Potion counter — the player watches their damage get undone, then steals, then watches it stop. |
| 3 | **Enemies telegraph, and telegraphs can be pre-empted** | The ice→thunder→water→fire cycle never varies and is printed in his own Scan text. The Nul spell is cast **before** the hit, on faith, and it zeroes the damage. This is the single best "the queue answers before you commit" moment available in FFX. |
| 4 | **Buffs and debuffs are a damage multiplier, not a side dish** | Seymour opens with Shell on himself and the Guardians open with Protect on themselves. Dispel or Aerospark literally doubles the player's magic output; §6.2 prints both columns. |
| 5 | **Overdrives are banked resources with a timing cost** | Diamond Dust into a Boosted Anima is 7,075; into an unboosted one it is 4,717. Same button, 50 % more damage, because of *when*. |
| 6 | **Summoning is a tactical decision, not a cutscene** | Pain kills a party member and merely hurts an aeon. Oblivion wipes the party and is survivable with Shield. Shiva is not "the big damage button", she is **the only correct body to have on the field**. |
| 7 | **Aeons have their own menu** | Shield before Oblivion; Blizzara on herself as a heal; Boost as a deliberate risk. Three sub-commands, three visible outcomes, all in one act. |
| 8 | **Elemental affinity works in both directions** | Seymour's Blizzaga *heals* Shiva. The game shows the player a green number coming off the boss's own spell. |
| 9 | **Status effects matter and resistances are partial** | Poison at 600/turn on a 6,000-HP boss; Magic Break at 50/101 versus Banishing Blade's guaranteed application; Petrify as a one-shot on the Guardians; Confusion arriving with no equipment answer. |
| 10 | **Overkill is a thing, and it has a price** | The Guardians' overkill threshold *equals their HP* — the player has to one-shot them from full. Shattering them with Stone Breath is faster and **forfeits the bonus AP**. A real trade-off, stated in numbers. |
| 11 | **Bosses have phases, and phases change the rules** | Three acts, each with a different correct answer: support removal → aeon duel → pure elemental prediction. And the boss's bar coming back once is the clearest possible statement that an HP bar is not a progress bar. |

**Onboarding caveat to design around:** act three is the hardest part of the fight and it arrives *after* the spectacle. A tutorial chapter must make sure the player still has Nul spells and MP when it starts. The honest, canon lever is the **MP economy** — Yuna's four Nul spells cost 2 MP each, and she has 150–210. There is no reason to soften the damage.

---

## 11. Minimum viable mechanic list for this chapter

Ordered by implementation dependency. Items marked **†** are **already required by `ffx-seymour-flux.md` §10** and should be shared, not rebuilt.

1. † CTB scheduler with rank-based recovery, turn prediction, three-active/seven-reserve switching.
2. † The damage pipeline of `ffx-combat-core.md` §2, including the Magic / Strength / **Special Magic** / **Fixed (no variance)** formulas. Special Magic (Pain, Diamond Dust) and Fixed-no-variance (`base × 50`, the Guardians' potions) are both new to this chapter.
3. **Enemy "Cover"** — a living enemy intercepting **physical** attacks aimed at a protected enemy, magic exempt. New; no other chapter needs it.
4. **Steal against an enemy with consumable-backed behaviour**: per-enemy `hasPotions`, a **one-successful-steal limit**, and a healing branch that switches off when it is spent.
5. **Enemy item usage as an action** (Hi-Potion on an ally, Remedy on an ally or self) and **Auto-Potion as a damage counter**.
6. † Protect / Shell / Reflect / Dispel / Haste / Slow / Regen with correct `affected_by_reflect`, `affected_by_silence`, `ignores_armored` flags.
7. **The four Nul statuses as single-use elemental nullifiers**, cast pre-emptively, consumed by the matching element. Plus the open question in **C-3** about multi-hit consumption.
8. **Confusion**, its cures (Remedy, Esuna, taking damage) and the absence of a Confuse Ward at this story point.
9. **Petrify + always-shatter on monsters**, and an AP model where shattering forfeits overkill AP.
10. **Threaten with the §4.4 decaying per-enemy chance, sourced from the mon-data byte** (§0.4). Not a resistance roll.
11. **A scripted pre-battle buff sequence** that resolves before the player's first turn.
12. **A fixed, published, non-random enemy action cycle** with a target-class branch (-ra on characters, -ga on aeons) that deliberately ignores elemental absorption.
13. **HP-threshold phase transition at 50 %** that (a) clamps incoming damage to 5,999 beforehand, (b) floors HP at 1, (c) kills the enemy's own allies, (d) spawns a new enemy into slot 4.
14. **A mid-battle enemy that idles** (zero-hit no-op) while another enemy acts.
15. **A phase transition that restores an enemy to full HP and raises one of its stats.**
16. **Two-action turns** (`Multi-X` + `Multi-X 2nd Hit` resolved and displayed as two separate hits in one turn).
17. **Aeon summon with sub-commands**: **Shield** (÷4 damage, zero gauge gain) and **Boost** (×1.5 damage, ×1.5 gauge) on the player side; **Boost on the enemy side with the gauge effect suppressed** (§3.4).
18. **Aeon Ribbon as the mechanism** behind aeon status immunity, so Pain's 100 % Death rider fails on an aeon without a special case.
19. **Elemental absorb on an aeon** (Shiva's Ice Eater), so her own Blizzara and the boss's Blizzaga both heal her.
20. † Aeon Overdrive gauge on `ffx-combat-core.md` §6.5's model, **starting Shiva at 0**, plus **Grand Summon**'s temporary gauge.
21. **An enemy Overdrive gauge with its own fill rule** (fixed per turn taken and per targeting, Boost-independent) and a visible telegraph.
22. **A 16-hit party-wide action** resolved and displayed as 16 discrete hits.
23. **Trigger Command (pre-battle Talk)** granting a battle-scoped stat bonus — **with this chapter's own Tidus/Yuna/Wakka table**, not the Flux chapter's.
24. † Equipment as `{slots, abilities[]}`; a pre-battle merchant whose stock is part of the answer.
25. **Sensor and Scan as information the fight is designed around**, since Seymour's own Scan text hands the player the strategy.

---

## 12. Conflicts, gaps and verify-before-shipping list

| ID | Conflict / gap | Resolution |
|---|---|---|
| **C-1** | **Guado Guardian rare steal.** Decompiled byte says **Ether ×1**; the FF Wiki infobox says **Hi-Potion**. | Unresolved, low stakes. The *common* steal (Hi-Potion) is agreed by both and is the one the mechanic hangs on. Recommend shipping the decompile (Ether) and noting it; a wrong rare-steal item breaks nothing. |
| **C-2** | **Is Seymour targetable while Anima is on the field?** He is clearly *present* — his only scheduled action for that stretch is a no-op aimed at Anima's slot (§4.1) — but no source states whether the player can select him. | **Not resolved.** Recommend **present but untargetable**, because (a) the HD build explicitly prevents him being killed before the summon, and (b) if he were targetable during act two the player could simply finish him and skip the aeon duel, which contradicts every guide's description of a three-act fight. **Verify in-game before shipping**; this is the single most behaviourally load-bearing open question in the file. |
| **C-3** | **Act-three targeting and Nul consumption.** `monster_actions.json` assigns **no target** to the eight Multi- rows (the tracker does not simulate phase 3); the raw action bytes resolve to *Single Character*, and the plain -ra rows are overridden to *Random Character*. Unknown: whether the two halves pick **the same** character or two different ones, and whether **one Nul cast absorbs both halves** or only the first. | **Not resolved.** Recommend: two independent random-character picks, and **one Nul absorbs one hit** (they are two separate actions, and Nul statuses are consumed per elemental action). **Verify in-game** — this decides whether act three is survivable-with-Nuls or brutal-with-Nuls, and it is the difference between a good tutorial finale and an unfair one. |
| **C-4** | **Anima's Overdrive gauge increment at Macalania.** The wiki gives exact figures for the *other two* Animas (Remiem: +5 % per targeting; Inside Sin: 15–30 % from a Yu Pagoda's Power Wave, 0–10 % otherwise) but only says "a fixed amount every time she gets a turn or is attacked" for this one. | **Not published anywhere.** Mirrors `ffx-seymour-flux.md` C-15. Ship an `[estimate]`: **+10 % per turn taken and +5 % per targeting**, which produces an Oblivion roughly every 4–5 exchanges — consistent with every guide treating Oblivion as a thing you race, not a thing you eat repeatedly. Label it as an estimate in-product and tune it against play. |
| **C-5** | **Can a Shiva Overdrive be banked out of act two into act three?** A community strategy surfaced via search claims a stored Diamond Dust deletes act-three Seymour. Plausible under `ffx-combat-core.md` §6.5 (the gauge persists through dismiss and is only zeroed on aeon *death*), but no primary source states it. | `[single source]`. Follows from the documented persistence rule, so the engine will do it for free. **Verify**, and if it holds, note it as a legitimate skip — it is a reward for understanding the gauge, which is exactly what the chapter teaches. |
| **C-6** | **RESOLVED.** Decompiled byte 402 reads **3** for Seymour, the Guardians and Anima while the wiki prints Zanmato level **4** — an apparent off-by-one that also affects `ffx-seymour-flux.md` §1.1 and §2 (which print level 4 from bytes that read 3). | **Byte 402 is 0-based.** `wikiZanmatoLevel = byte402 + 1`. Proof: the byte's whole range across all 350 monsters is **0–4** while FFX's published Zanmato levels run **1–5**; **Nemesis**, the hardest enemy in the game and the canonical level-5 entry, reads **4**; **Basilisk** and other ordinary fiends read **0**. `[verified: 2 sources — `[decompiled]` byte distribution + the wiki's published levels for Nemesis and for the three enemies in this fight]`. Irrelevant to gameplay here (Yojimbo is not owned and is out of scope), but the Flux file's `[decompiled]` tag on that row is wrong about the byte and should be corrected — see §13 row 7. |
| **C-7** | **Exact ability strings on the O'aka / Rin armour pieces.** The shop tables give item names and prices; the ability sets for the "Serum / Echo / Soft / Seeker's" families are `[derived]` from the naming table, not read off the item pages. | Fetch the individual armour pages before shipping §8.8's ability column. Low risk, five minutes of work. |
| **C-8** | **Do the Guardians still award AP when the Anima summon kills them?** | Unsourced. Recommend **yes** (they died in the battle). **Verify.** It is worth 580 AP, which is material at this story point. |
| **C-9** | **Entire §8 party preset.** | `[estimate]` by construction, *except* the Yuna row and the aeon block, which are `[derived]` and cross-validated (§8.4). Playtest before claiming fidelity. |
| **C-10** | **The "typical battles fought" figure** that indexes Shiva's stat-growth table (150–240). | `[estimate]`. If the chapter is played standalone rather than inside a progression, pick the **180–209** row and freeze it. |
| **C-11** | **What triggers the Guardians' Auto-Potion counter — any damage, or physical damage only?** The FF Wiki contradicts itself on a single page (*Seymour (FFX boss)*: §Battle "whenever they take damage" vs §Strategy "whenever they are hit with a physical attack"); the *Guado Guardian* page says "when damaged". | **Not resolved; downgraded from `[verified: 2 sources]` to `[single source, self-contradictory]`.** This is a live branch decision — it decides whether Lulu's spells feed a 1,000 HP counter, which materially changes the magic route. Recommend **any damage triggers it** behind a one-line flag. **Verify in-game.** |
| **C-12** | **Priority order of the Guardians' behaviour branches.** No source states an order; the wiki's prose lists the Hi-Potion/4,800 condition *first*, then the Remedy branches. The first draft of §5.2 asserted the opposite order and tagged the whole block `[verified: 2 sources]`. | **Branch set is sourced; branch order is not.** §5.2 now follows the wiki's sentence order and says so. Low stakes — the two orders differ only when Seymour is simultaneously poisoned and under 4,800 HP — but it must not be presented as canon. **Verify in-game.** |
| **C-13** | **Equipment ability-roll counts vs the FF Wiki infobox.** Decompile: Anima **1–2** rolls (bytes 173 = 15, 177 = 13, identical to Seymour's); Guado Guardian `m141` **exactly 2** (bytes 173 = 11, 177 = 20). Wiki infobox: **1–3** for both. | **Ship the decompile.** Control case validates the parse: Seymour's bytes give {1,2} and the wiki *agrees* (`min = 1 / max = 2`) — so the offsets are being read correctly, and the wiki is internally inconsistent in printing 1–3 for Anima off a byte-identical row. Recorded as a conflict, **not** merged into the number, and the `[verified: 2 sources]` tag on the Guardian row is withdrawn. Cosmetic in impact; sits alongside C-1. |
| **C-14** | **Does the ice → thunder → water → fire order persist into act three?** The FF Wiki says only that he casts -ra spells twice per turn and never restates the order for phase 3. Sole source is GamerGuides' Macalania walkthrough. | `[single source]`, downgraded from a mis-cited `[verified: 2 sources]`. Plausible (all four Multi- rows exist; nothing suggests a reset) and it is what §5.4 ships, but **verify in-game** — the entire Nul-spell finale, and therefore the chapter's tutorial payoff, rests on it. |

---

## 13. Corrections this research forces on other files

| # | File | Correction | Severity |
|---:|---|---|---|
| 1 | `ffx-seymour-flux.md` §1.3, §9 **C-2**; `ffx-combat-core.md` §4.4 | **The "Threaten resistance" byte is the initial Threaten chance percent, not a resistance.** C-2 is resolved in the guides' favour: **Seymour Flux is immune to Threaten.** `ffx-combat-core.md` §4.4 should read the tier off the byte instead of hand-listing five enemies. Evidence in §0.4. | **blocker** — the Flux chapter would otherwise ship a Threaten that lands on a Threaten-immune boss |
| 2 | `ffx-seymour-flux.md` §9 **C-8** | **The status-chance formula is transcribed** in §1.3 of this file: `chance = landingChance − resistance`, `rng % 101`, apply if `chance > rng`, with 255 bypassing immunity and 254 bypassing resistance and RNG. C-8 can be closed. | major |
| 3 | `ffx-combat-core.md` §6.4 | **The aeon stat derivation is now independently validated** against the FF Wiki's published Shiva growth table (§8.4): six of nine stats reproduce exactly at the Macalania story point. Upgrade its confidence tag. | minor, positive |
| 4 | `ffx-seymour-flux.md` §4.7 | **Trigger Commands are per-encounter and must not be shared.** This fight is **Tidus / Yuna / Wakka**; Natus is Tidus / Yuna / Auron; Flux is Yuna / Kimahri. `[verified: 2 sources]` | major if a shared table is built |
| 5 | `research/writing-bible.md` §0.1 | The five-chapter scope list predates this chapter. If Macalania ships, the writing bible needs an **E8** outline and Seymour's §1.9 voice guide needs a **pre-Flux register** — courteous rather than messianic. | housekeeping |
| 6 | `research/visual-bible.md` §2 | Needs a **§2.6 Macalania Temple antechamber** location sheet, and §1.8 (Seymour Flux) needs a sibling entry for **human-form Seymour**, the **Guado Guardians**, **Anima** and **Shiva** (§1.13 covers aeons generically but not Shiva's fight-specific "????" state). | housekeeping |
| 7 | `ffx-seymour-flux.md` §1.1, §2 | **Byte 402 is a 0-based Zanmato index, not the level.** Both rows print "Zanmato level 4" — the right *value*, but §1.1 attributes it to the byte, which reads **3**. Change the annotation to `byte402 + 1`; the printed 4 stands. Proof in §12 C-6. | minor |
| 8 | `ffx-combat-core.md` §6.3 | **`Pain` is two distinct actions and §6.3's row must not be reused for this encounter.** monmagic2 **#222** is the *boss* Anima's Pain, **DmgCon 28** (→ 459–518 at MAG 20, matching the published figure exactly). monmagic2 **#220** is *Yuna's* Anima's Pain, **DmgCon 20** (→ 328–370), which is what §6.3's aeon table already defines. Both are correct for their own row; sharing one `Pain` definition ships the boss at ~70 % of canon damage, or the player's aeon at ~140 %. §6.3 should gain a cross-reference naming both ids. Evidence in §4.3. | **blocker** — silently wrong damage in whichever direction the shared definition is written |

---

## 14. Fact-check log (revision pass, 2026-09-19)

Every item below was **re-verified by me from primary data or primary source text** before the document was changed; nothing here was taken on the reviewer's word. The decompile re-parse was run fresh against `ffx_mon_data.csv` using the offsets in `ffx_rng_tracker/data/monsters.py`; the wiki text was re-fetched as raw wikitext.

| # | Section | What was wrong | What it says now | Verified against |
|---:|---|---|---|---|
| 1 | §2.3, §5.2, §7 row 1, §7 row 8 | The reference pseudocode gated the **Remedy-on-Seymour** branch behind `hasPotions`, so a successful Steal also switched off the Guardians' poison cure. Unsourced, and contradicted by the document's own §2.4 quotation of the infobox. | **Only Auto-Potion and Hi-Potion-on-Seymour are gated on the potion supply. Both Remedy branches fire regardless of Steal.** §7 row 8 now says the Guardians must be *killed*, not merely stolen from, for the poison route. | FF Wiki *Guado Guardian* §Battle: the Hi-Potion sentence carries "**and the Guardians still have access to Hi-Potions**", the two Remedy sentences carry no qualifier; infobox `1 info` names only Auto-Potion and Hi-Potion. Re-fetched wikitext. **Impact: prevented a silent doubling of the poison route's value (600 dmg/turn uncontested) and a materially easier-than-canon fight.** |
| 2 | §5.1 | Claimed Anima is out-sped by Shiva, and used that turn-order story to justify the whole aeon-duel design. False at the document's own shipped preset. | **Anima 25 out-speeds Shiva 22 at the 180–209 row.** The wiki's claim is "highest **initial** Agility of all the aeons" (base 14) — a ranking among aeons, not against this boss. Turn-order rationale deleted; the act-two case now rests solely on Pain's Death rider failing against the Aeon Ribbon. | FF Wiki *Shiva (FFX)* profile sentence + stat-growth table, re-fetched. Shiva passes 25 only at the 240–269 row (27), outside the preset. |
| 3 | §3.3 | Anima's equipment ability rolls printed as **1–3** and tagged `[decompiled] + wiki`. The decompiled half was wrong. | **2–4 slots, 1–2 ability rolls** `[decompiled]`; the wiki's 1–3 recorded as conflict **C-13**, not merged into the number. | Re-parsed `ffx_mon_data.csv` m125: bytes 173 = 15, 177 = 13 — **byte-identical to Seymour's m124**. `max(0, (177 + rng − 4) // 8)` over all 8 RNG values yields {1, 2}, never 3. The document already printed 1–2 for Seymour off the same row. |
| 4 | §2.5 | Guado Guardian ability rolls printed as **1–3** and tagged `[verified: 2 sources]` although the two sources disagree. | **1–3 slots** `[verified: 2 sources]`, **exactly 2 ability rolls** `[decompiled]`; wiki's 1–3 flagged as **C-13**. The unearned `[verified]` tag is withdrawn. | Re-parsed m141: bytes 173 = 11, 177 = 20 → exactly **2** rolls for all 8 RNG values. Control case: Seymour's byte gives {1,2} and the wiki *agrees* (`equip ability min = 1 / max = 2`), so the offset is read correctly. |
| 5 | §4.3, §13 | Gave Anima's Pain DmgCon as 28 without reconciling it against `ffx-combat-core.md` §6.3, which already defines Pain at DmgCon **20**. | **Pain is two distinct actions**: monmagic2 **#222** (boss, DmgCon 28) and **#220** (Yuna's Anima, DmgCon 20). Both are correct for their own row. New warning box in §4.3 and new **§13 row 8** (blocker). | Damage chain re-executed: POWER = (20³ // 32) + 30 = 280, × 28/16 = 490, × 240/256 … × 271/256 = **459 … 518** — the published figure exactly. DmgCon 20 gives 328–370 and cannot. `ffx-combat-core.md` §6.3 read locally. |
| 6 | §8.4 | "**Six of nine** stats match … STR and ACC differ" — self-contradictory arithmetic, in the passage used to upgrade two confidence tags on other files. | **Seven of nine.** HP, MP, DEF, MAG, MDEF, AGI and EVA all reproduce exactly. The conclusion (validating `ffx-combat-core.md` §6.4 and promoting §8.3's Yuna row) stands; only the count was wrong. | FF Wiki *Shiva (FFX)* stat-growth table re-fetched; all four rows quoted in §8.4 match verbatim. |
| 7 | §6.1 | Guado Guardian Thunder / Blizzard given as **118–141**, a band that does not span the document's own §8.3 party. | **~108–139 at mid-RNG across MDef 7–40**, ~101–147 including the RNG band, with per-target values. The qualitative point (trivial next to Seymour's ~715) is unaffected. Also corrected the **MDef-38 row of the -ra table** from 549/586/620 to **541/578/611**, a ~1.4 % slip found while re-running the chain. | Recomputed from `ffx-combat-core.md` §2.1–2.3: POWER = (15² // 6 + 12) × 12 // 4 = 147; MDef 0 → 147, 10 → 136, 22 → 125, 32 → 116, 40 → 108. |
| 8 | §2.3 | "Auto-Potion fires as a counter whenever they take damage" tagged `[verified: 2 sources]` although the sources disagree on scope. | **Downgraded to `[single source, self-contradictory]` + new open question C-11.** Recommended branch (any damage) stated as a recommendation behind a flag, not as canon. | FF Wiki *Seymour (FFX boss)* contradicts itself on one page: §Battle "whenever they **take damage**", §Strategy "whenever they are **hit with a physical attack**". *Guado Guardian*: "when damaged". |
| 9 | §5.2 | Branch **priority** (poison → Remedy above hp < 4800 → Hi-Potion) tagged `[verified: 2 sources]` along with the sourced branch set. No source states an order. | Pseudocode reordered to follow the wiki's own sentence order, with an explicit comment that the **order is not sourced**. New open question **C-12**. | FF Wiki *Guado Guardian* §Battle sentence order. |
| 10 | §5.4 | "following the same ice → thunder → water → fire order" in act three tagged `[verified: 2 sources — wiki + StrategyWiki]`. The citation matches neither the wiki text nor this file's own Sources section. | **`[single source: GamerGuides]`** + new open question **C-14**, with the wiki's actual wording quoted and the gap named. | FF Wiki *Seymour (FFX boss)*: "start casting his -ra spells twice in one turn" — the order is never restated for phase 3. |
| 11 | §0.4 | The Threaten-byte finding — the most load-bearing claim in the file — was stated more weakly than the evidence supports. | **Strengthened** with the three-Guado-Guardian control table and the arithmetic impossibility of a resistance reading for `m141`. | Re-parsed byte 58: `m141` = 100, `m213` = 0, `m222` = 0. *Guado Guardian* infobox: `2 threaten = Immune`, `3 threaten = Immune`, **no `threaten` line for variant 1**. Wiki strategy: "Threaten renders them unable to act." |

**Net effect on the document's confidence profile:** one `[verified: 2 sources]` tag withdrawn outright (§2.5 ability rolls), two downgraded to `[single source]` (§2.3 Auto-Potion scope, §5.4 phase-3 order), one unsourced assertion deleted (§5.1 turn order), two decompiled numbers corrected (§2.5, §3.3), two derived tables recomputed (§6.1), one arithmetic count fixed (§8.4), one new **blocker** added to §13 (the Pain action collision), and four new open questions (**C-11 … C-14**). Nothing in §0.3's four-way damage-port validation was affected; all four reproductions still hold.

---

## Sources

**Decompile-derived data (primary layer)** — all fetched 2026-09-19 from `github.com/Grayfox96/FFX-RNG-tracker`, `main`:

- `.../ffx_rng_tracker/data/data_files/ffx_mon_data.csv` — monster stat table (`m124` Seymour, `m125` Anima, `m141` Guado Guardian; plus `m067` Bashura, `m111` Extractor, `m114` Sinspawn Echuilles, `m121` Spherimorph, `m130` Yunalesca, `m142` Seymour Flux, `m185` Basilisk, `m212` Wendigo, `m213`/`m222` the other Guado Guardians — used for the §0.4 Threaten proof)
- `.../data_files/ffx_monmagic1.csv` (file id 4), `.../ffx_monmagic2.csv` (file id 6), `.../ffx_command.csv` (file id 3), `.../ffx_item.csv` (file id 2) — action tables
- `.../data_files/monster_actions.json` — per-monster action id + target assignments
- `.../data_files/characters.json` — character and aeon base stats, default equipment abilities
- `.../data_files/items.csv`, `.../data_files/text_characters.csv`
- `.../ffx_rng_tracker/data/monsters.py`, `.../data/actions.py`, `.../data/constants.py`, `.../data/statuses.py`, `.../utils.py` — field offsets and enum orderings
- https://grayfox96.github.io/FFX-Info/rng/status-chance — **the status-landing formula and the 254/255 special values** (closes `ffx-seymour-flux.md` C-8)

**Final Fantasy Wiki** (fetched via `finalfantasy.fandom.com/api.php?action=parse&prop=wikitext`):

- https://finalfantasy.fandom.com/wiki/Seymour_(Final_Fantasy_X_boss)
- https://finalfantasy.fandom.com/wiki/Anima_(Final_Fantasy_X_boss)
- https://finalfantasy.fandom.com/wiki/Guado_Guardian
- https://finalfantasy.fandom.com/wiki/Macalania_Temple
- https://finalfantasy.fandom.com/wiki/Shiva_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Anima_(summon)
- https://finalfantasy.fandom.com/wiki/Seymour_Guado
- https://finalfantasy.fandom.com/wiki/Trigger_Command
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities — Pain (459~518, Death 100 %), Oblivion (16 hits INT/PAL, power 4 vs 75), Auto-Potion / Hi-Potion ("Restores 1,000 HP"), Remedy, Shremedy (Confusion 50 %), "Seymour dismisses Anima!"
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_shops — Rin's Lake Macalania stock, O'aka's Temple Hall stock
- https://finalfantasy.fandom.com/wiki/Bushido_(Final_Fantasy_X) — Shooting Star from Spherimorph, Banishing Blade from three Jecht Spheres
- https://finalfantasy.fandom.com/wiki/Ronso_Rage — Stone Breath learned from Basilisk / Anacondaur / Yenke
- https://finalfantasy.fandom.com/wiki/Basilisk_(Final_Fantasy_X) — Djose Highroad; Petrify Grenade as common steal and bribe
- https://finalfantasy.fandom.com/wiki/Cover_(ability)
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X:_Original_Soundtrack — "Seymour's Ambition" 2:19 named for this battle; "Fight With Seymour" named for Omnis; "Challenge" named for Flux/Yunalesca

**Guides and secondary sources**

- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/seymour — independent confirmation of HP 6,000, the 3,000 summon threshold, the Guardians' Steal interaction, the three-phase structure, the drops and steals
- https://www.gamerguides.com/final-fantasy-x-hd/guide/walkthrough/macalania/macalania-temple — independent confirmation of the phase structure, the Blizzara→Thundara→Watera→Fira order persisting into phase 3, and Tromell's Shell Targe
- Community strategy surfaced via web search (StrategyWiki, EIP Gaming, GameFAQs answers) — corroborates the Shiva/Shield/Diamond Dust line and raises the act-two-to-act-three Overdrive banking claim recorded as **C-5**

**Local prior research (read first)**

- `research/ffx-seymour-flux.md` — format, confidence vocabulary, equipment model (§7.7.1), Overdrive-gauge model. **Contains no Macalania data.** Corrections against it recorded in §13.
- `research/ffx-combat-core.md` — CTB (§1), damage skeleton (§2), status model (§4.1), **Threaten model (§4.4)**, aeon stat derivation (§6.4), aeon gauge (§6.5)
- `research/ffx2-bahamut.md` — structural reference only
- `research/data/aeon-growth-reference.json` — aeon stat derivation coefficients and encounter-tier floors, used for §8.4
- `research/visual-bible.md`, `research/writing-bible.md` — appearance and voice conventions

**Rights note.** Square Enix owns *Final Fantasy X*, its characters, dialogue, music and art. Nothing in this document licenses reuse of any asset. Every story beat, Sensor/Scan description and appearance note above is summarised in my own words; **no dialogue is transcribed and no guide prose is reproduced.** "Seymour's Ambition" and every other cue named in §9.8 must be replaced by an original composition, not arranged or sampled.
