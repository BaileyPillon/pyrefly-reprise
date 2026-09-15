# FINAL FANTASY X-2 — Bahamut (Bevelle Underground) — Implementation Reference

**Target:** Pyrefly Reprise encounter module
**Source game:** *Final Fantasy X-2* (PS2 NTSC / International+Last Mission / HD Remaster)
**Scope:** story boss only. The Fiend Arena Bahamut is a different, much stronger entity and is documented separately at the end for disambiguation — **do not mix the two stat blocks.**

---

## 0. Corrections to the research brief (read first)

The brief contains four factual errors. Implementation agents must build against the corrected facts below.

| # | Brief said | Actual | Confidence | Impact |
|---|---|---|---|---|
| C1 | "Bevelle Underground, **Chapter 3**" | Bahamut is the **final boss of Chapter 2**. Bevelle Underground is revisited in Ch. 3 and Ch. 5, but the Ch. 3 boss there is a **Malboro**, not Bahamut. | [verified: 2 sources] | Changes party level, dresspheres, grids, and gear baseline substantially. |
| C2 | Party "~Lv 30–36", owning Samurai / Lady Luck / Berserker / Trainer | At the Ch. 2 Bahamut fight the party is typically **Lv 20–28**. Samurai, Lady Luck, Berserker and Trainer are **all Chapter 3 acquisitions** and cannot be owned. | [verified: 2 sources] | See §4. |
| C3 | Post-battle: "the fayth thanking her / apologizing" | **No fayth appears after this battle.** The Bahamut fayth's apology scene ("we weren't strong enough to overcome the darkness") happens in **Chapter 5, Farplane Abyss, after Dark Anima**. The Ch. 2 post-battle scene is the discovery of Vegnagun's empty chamber. | [verified: 2 sources] | See §5. |
| C4 | "X-2 boss theme" | This fight uses **"Yuna's Ballad"**, a sorrowful character leitmotif. Bahamut is explicitly *"the only aeon with a different battle theme."* | [verified: 2 sources] | See §5.4. |

Also answered directly:
- **Oversoul: not applicable.** Confirmed — Oversoul triggers on kill-counts of a repeatable fiend *type*; unique story bosses have no Oversoul entry. Bahamut's data has exactly two variants (Bevelle story, Fiend Arena), neither flagged Oversoul. [verified: 2 sources]
- **Ultima: no.** Bahamut's Bevelle ability set is exactly three entries: Curse, Impulse, Mega Flare. [verified: 2 sources]
- **Break Damage Limit: no, and irrelevant.** See §2.5.

---

## 1. Stat block — Bahamut (Bevelle Underground, Chapter 2)

Bestiary entry **#182** (between Shiva #181 and Anima #183).

### 1.1 Core stats

| Field | Value | Confidence |
|---|---|---|
| Level | **20** | [verified: 2 sources] |
| HP | **8,400** | [verified: 2 sources] |
| MP | **9,999** | [verified: 2 sources] |
| Strength | **71** | [verified: 2 sources] |
| Magic | **86** | [verified: 2 sources] |
| Defense | **160** | [verified: 2 sources] |
| Magic Defense | **10** | [verified: 2 sources] |
| Agility | **86** | [verified: 2 sources] |
| Accuracy | **not present in the data — implement as 0** | [verified: 2 sources for the absence; value [estimate] — see note] |
| Evasion | **0** | [verified: 2 sources] |
| Luck | **3** | [single source] |
| EXP | **1,300** | [verified: 2 sources] |
| AP | **15** | [verified: 2 sources] |
| Gil (battle reward) | **1,000** | [verified: 2 sources] |
| Gil (stealable) | **2,200** | [single source] |
| Scan description | "An aeon that once fought alongside Yuna." | [single source] |

> **Accuracy / Evasion — RESOLVED.** Jegged's independent FFX-2 bestiary explicitly lists **Evasion: 0** for the Bevelle Bahamut and, like the Fandom template, carries **no Accuracy row at all**. Two independent data-derived sources agreeing on the *shape* of the record (Evasion present and zero, Accuracy absent) settles this:
>
> | Field | Value | Confidence |
> |---|---|---|
> | Evasion | **0** | [verified: 2 sources — Jegged explicit, Fandom template omission] |
> | Accuracy | **absent from the record → implement as 0** | [verified: 2 sources for the absence; the 0 reading is [estimate]] |
>
> **Why 0 and not the ≈110 this document previously guessed.** `ffx2-combat-core.md` §2.6 records that in SinirothX's extracted enemy data **"enemy Evasion is frequently 0–1 and enemy Accuracy 0 on early fiends"** — i.e. Accuracy 0 is a normal, real value for FFX-2 enemies, not a missing field. It also supplies the recommended hit model:
>
> ```ts
> hitChance = clamp(0.25, 1.0, 0.90 + (attackerAcc - targetEva) / 200);
> ```
>
> Feed **Acc 110** into that model and every party member is clamped to a **100% hit rate** — which directly contradicts the sourced description of Bahamut's physical attack as *evadable*. Feed **Acc 0** and you get the correct behaviour: a high but beatable hit rate that scales with the target's Evasion.
>
> | Target (Lv 24) | Evasion | Bahamut hit chance at Acc 0 |
> |---|---|---|
> | Dark Knight | 2 | 89.0% |
> | Alchemist | 3 | 88.5% |
> | Gunner | 4 | 88.0% |
> | Warrior / White Mage | 5 | 87.5% |
> | **Thief** | **19** | **80.5%** |
> | Songstress | 10 | 85.0% |
>
> **Implementation:** `bahamut.accuracy = 0; bahamut.evasion = 0;` and route his normal Attack through the standard hit model. This makes Thief's Evasion 19 a genuine, visible defensive stat in this fight — the only dressphere that meaningfully dodges him. Bahamut's *own* Evasion 0 means **the party never misses him** with a physical attack (absent self-inflicted Darkness), which matters for Trigger Happy and Darkness routing. [verified: 2 sources for Eva 0; the hit-rate column is [estimate] because no FFX-2 hit formula is published]

### 1.2 Stat-shape reading (design intent)

This is the single most important line for combat feel, so state it explicitly in code comments:

> **Defense 160 is enormous; Magic Defense 10 is almost nothing.**

At Lv 20 a Warrior's own Defense is 95 and a Dark Knight's is 118 — Bahamut's 160 is well above any party member's. Meanwhile MDef 10 is *below* a Lv 20 Alchemist's (10) and a tenth of a Black Mage's (124). The encounter is therefore designed so that **raw physical attacks are near-worthless and anything that ignores Defense or routes through Magic is dominant.** Every "correct" strategy in §3 is an expression of this one fact. [verified: derived from 2 stat tables]

### 1.3 Elemental affinities

| Element | Affinity | Multiplier | Confidence |
|---|---|---|---|
| Fire | Neutral | ×1.0 | [verified: 2 sources] |
| Ice | Neutral | ×1.0 | [verified: 2 sources] |
| Lightning | Neutral | ×1.0 | [verified: 2 sources] |
| Water | Neutral | ×1.0 | [verified: 2 sources] |
| **Holy** | **Neutral — NOT a weakness** | **×1.0** | [verified: 2 sources — conflict resolved, see below] |
| **Gravity** | **Immune** | ×0 ("IMMUNE") | [verified: 2 sources] |
| Non-elemental | n/a — affinities ignored | ×1.0 | [verified: 2 sources] |

Method note: the wiki enemy template emits an element row only when the affinity is non-neutral. Bahamut's Bevelle entry emits **only** `gravity = Immune`. Compare Anima, whose entry does emit `fire=Halves, lightning=Halves, water=Halves, ice=Halves, gravity=Absorb, holy=Weak` — proving the template is being populated for aeons when values exist. Absence is therefore meaningful, not missing data. [verified: 2 sources by comparison]

**Implementation:** all five damage elements deal ×1.0. No weakness to exploit. Note that in X-2 an elemental *weakness* is **×2.0** (raised from FFX's ×1.5), so "no weakness" is a much bigger deal here than it would be in FFX. [single source]

> ### CONFLICT RESOLVED — Holy is **not** a weakness
>
> The previously-recorded two-source standoff (Fandom "no weakness by template omission" vs. GamerGuides "Elemental Weakness: Holy") is **broken by a third, independent, explicitly-populated source.**
>
> | Source | Type of evidence | Holy | Gravity |
> |---|---|---|---|
> | Final Fantasy Wiki enemy template | *Omission* — emits an element row only when non-neutral; emits only `gravity = Immune` | (neutral by omission) | Immune |
> | **Jegged.com FFX-2 bestiary** | **Explicit, fully-populated element table** — prints a value for every element | **"Holy: Normal"** | **"Gravity: Immune"** | 
> | GamerGuides boss page | Guide stat block | "Weakness: Holy" | Immune |
>
> **Why Jegged settles it.** Jegged's entry is not an omission argument: it *prints a value for all six elements* — "Fire: Normal, Ice: Normal, Water: Normal, Lightning: Normal, **Holy: Normal**, Gravity: Immune". A source that explicitly writes "Normal" in the Holy slot while correctly writing "Immune" in the Gravity slot on the same row is positively asserting no Holy weakness, not failing to record one. That converts the Fandom omission from an inference into a **corroborated** reading, and makes the tally **2 data-derived sources against 1 guide**.
>
> Jegged independently reproduces Bahamut's entire numeric stat block (Lv 20, HP 8,400, MP 9,999, Str 71, Def 160, Mag 86, MDef 10, Agi 86, Eva 0) and his drop/steal split — so it is demonstrably reading the same underlying enemy record, not paraphrasing a walkthrough.
>
> **Ruling: implement Holy at ×1.0. Bahamut has no elemental weakness.** [verified: 2 sources]
>
> **Consequences for party selection** — the encounter does *not* reward a Holy package:
>
> | Holy-element option | Effect vs. Bahamut |
> |---|---|
> | **Excalibur** (Warrior, 120 AP / 24 MP) | ×1.0, **and it is physical** → also crushed by Def 160. Worst of both. Do not recommend. |
> | **Holy Kogoro** / Holy-element items | ×1.0. No better than any other element. |
> | **Blessed Gem** | ×1.0. Ordinary damage item. |
> | **Holy** spell (Garment Grid / accessory only) | ×1.0 — but it is **magic** with the highest damage constant in the game (C = 100), so it is still strong *through MDef 10*, on magnitude alone rather than on element. |
>
> The one thing that survives this ruling: **Holy the spell is still excellent here, for the opposite reason to the one GamerGuides implies.** It routes through MDef 10 and carries a huge damage constant, not because Bahamut is weak to it. Do not double-count both effects.
>
> Residual risk: none of the three sources is decompile-grade. If a decompile later shows a Holy weakness, the change is a single affinity constant — keep it as a named constant (`BAHAMUT_HOLY_AFFINITY = 1.0`) rather than baking ×1.0 into the damage path.

Gravity immunity kills: Demi, Demi Sword, Quarter Pounder (25% current-HP shot), and any fractional-damage route. [verified: 2 sources]

### 1.4 Status immunities

**Immune to:** Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, **Curse**, Eject, Stop, Doom, **Delay**, Interrupt, Multi-Attack (Break Damage?), Gravity/fractional damage. [single source]

**NOT immune — these land:**

| Vector | Status/effect | Why it matters |
|---|---|---|
| **Slow** | ATB bar fills at **half speed**, bar turns gold | The only true debilitating status available. See §3.4. |
| **Power Break** | STR Down ×2 stacks | His physicals ×(12−n)/12 → **×0.167 at cap**. Turns 2–4 become noise. |
| **Armor Break** | DEF Down ×2 stacks | Your physicals ×(12+n)/12 → **×1.833 at cap**. Does *not* change his Def 160 — see §1.5. |
| **Magic Break** | MAG Down ×2 stacks | His magic ×(12−n)/12 → **×0.167 at cap. Cuts Mega Flare to one-sixth — the biggest single lever in the fight.** |
| **Mental Break** | MDEF Down ×2 stacks | Your magic ×(12+n)/12 → **×1.833 at cap**. *Not* marginal — it is a flat multiplier and ignores his MDef 10 entirely. |

This is a deliberate design contrast. Anima (the other story aeon) **is** flagged immune to `slow`, `str mod`, `mag mod`, `def mod`, `mdef mod`, `luck mod`, `accu mod`, `eva mod` — and so is the Fiend Arena Bahamut. The Bevelle Bahamut's entry omits every one of those rows. **Breaks and Slow are intended to work on this boss.** [verified: 2 sources by comparison]

`zantetsu = 100` — Zantetsuken/Shin-Zantetsu instant-death resistance value (Anima 110; Fiend Arena Bahamut 200). Moot in Chapter 2 because the Samurai dressphere is a Chapter 3 acquisition. [single source]

### 1.5 Stat-Down mechanics (needed to implement Breaks)

> **RESOLVED — and both previously-proposed models were wrong.** The linear-vs-compounding question was mis-framed. Per the decompile-grade damage flowchart (SinirothX, *Enemy Encyclopedia*, transcribed in `D:/Final Fantasy/research/ffx2-combat-core.md` §2.1–2.2), **Breaks do not modify the target's stat at all.** They set a *stack level* 0–10 that becomes a **multiplicative step inside the damage pipeline**. Bahamut's Defense stays 160 for the entire battle; what changes is a multiplier applied at step 5.

| Property | Value | Confidence |
|---|---|---|
| What a Break changes | a **stack level** (0–10), **not the stat** | [verified: 2 sources] |
| Magnitude | **1/12 per stack, applied once as a damage multiplier** | [verified: 2 sources] |
| Max stacks | **10** | [verified: 2 sources] |
| Stacks applied per Break cast | **2** | [single source] |
| Casts to reach cap | **5** | [derived] |
| Pipeline position — STR/MAG Down (attacker side) | **step 4**, before the Defense step is irrelevant (it is after step 3) | [single source, decompile-grade] |
| Pipeline position — DEF/MDEF Down (target side) | **step 5** | [single source, decompile-grade] |
| Stacking form | **linear in the multiplier**: `(12 ± n)/12`. **Not** compounding, **not** a stat subtraction. | [verified: 2 sources] |

**The four Breaks, exactly:**

| Break | Status applied | What it multiplies | At n stacks | At cap (n = 10) |
|---|---|---|---|---|
| **Power Break** | STR Down | damage **Bahamut deals** with physicals | `× (12 − n)/12` | **×0.167** |
| **Magic Break** | MAG Down | damage **Bahamut deals** with magic (Mega Flare, Impulse) | `× (12 − n)/12` | **×0.167** |
| **Armor Break** | DEF Down | physical damage **Bahamut takes** | `× (12 + n)/12` | **×1.833** |
| **Mental Break** | MDEF Down | magic damage **Bahamut takes** | `× (12 + n)/12` | **×1.833** |

**Ramp table** (2 stacks per cast — this is the schedule an implementer codes against):

| Casts | Stacks *n* | Power/Magic Break — his output | Armor/Mental Break — your output |
|---|---|---|---|
| 0 | 0 | ×1.000 | ×1.000 |
| 1 | 2 | ×0.833 | ×1.167 |
| 2 | 4 | ×0.667 | ×1.333 |
| 3 | 6 | ×0.500 | ×1.500 |
| 4 | 8 | ×0.333 | ×1.667 |
| **5** | **10 (cap)** | **×0.167** | **×1.833** |

> **The old "capped Defense" table is deleted — it described a mechanic that does not exist.** For anyone who must express Armor Break as an effective Defense (e.g. to reuse a stat-based engine), solve the linear Defense step `(270 − Def)/255` for the same result:
> `(270 − Def_eff)/255 = 1.833 × (270 − 160)/255` → **Def_eff ≈ 68**.
> Note this lands almost exactly on the **67.6** that the old *compounding* guess produced — a coincidence, but a useful cross-check that ~68, not ~27, is the right magnitude. **Armor Break is worth ×1.83 on physicals, not ×6.**

**Source conflict, recorded.** The Final Fantasy Wiki's *STR Down (Final Fantasy X-2)* / *DEF Down (Final Fantasy X-2)* pages phrase the effect as "decreases [the stat] by 1/12", which reads as a stat modification and is what produced this document's original ~26.7 figure. The SinirothX flowchart, which is extracted game data, places it as a damage-multiplier step that never touches the stat. **Per the research rule "prefer decompile-derived data over guides", the flowchart wins.** The two readings diverge sharply: on a Def-160 enemy the stat reading predicts ×2.2 incoming physical damage at cap, the flowchart reading ×1.83. [conflict — resolved in favour of the decompile-derived flowchart]

**Why this matters more than the Defense number:** under the stat model, Magic Break and Mental Break looked near-worthless against MDef 10 (there is nothing to subtract). Under the correct model they are **flat multipliers independent of the base stat** — so Magic Break cuts Mega Flare to one-sixth and Mental Break raises all party magic by 83%, *regardless* of MDef 10. See §3.3, where this reverses two of the document's previous recommendations.

### 1.6 Drops, steal, bribe

| Slot | Item | Notes | Confidence |
|---|---|---|---|
| Common drop | **Gris-Gris Bag** ×1 | Accessory: guards against Curse; Defense +4, Magic Defense +4 | [verified: 2 sources] |
| Rare drop | **Gris-Gris Bag** ×1 | Same item in both slots — the drop is deterministic | [verified: 2 sources] |
| Common steal | **Mute Shock** ×1 | Accessory: adds Silence to attacks, user can cast Silence; **Strength −5, Magic +3** | [verified: 2 sources] |
| Rare steal | **Mute Shock** ×1 | Same item in both slots — deterministic | [verified: 2 sources] |
| Steal rate | **128 / 255 ≈ 50.2%** total steal success | **Scale confirmed — see derivation below** | [verified: 2 sources] |
| └ Common slot (Mute Shock) | **43.9%** | 87.5% of the successful roll | [verified: 2 sources] |
| └ Rare slot (Mute Shock) | **6.3%** | 12.5% of the successful roll; Master Thief targets this slot | [verified: 2 sources] |
| Drop rate | **100%** (drop is guaranteed) | Split 87.5% common / 12.5% rare — both slots hold Gris-Gris Bag | [verified: 2 sources] |
| Steal gil | 2,200 | Thief's Pilfer Gil | [single source] |
| Bribe | Not flagged immune, but no bribe entry exists | Anima's entry explicitly sets `bribe = Immune`; Bahamut's does not | [gap] |

> **Steal-rate scale — RESOLVED.** The raw template byte **128** is on a **/255 scale**, and the common/rare split is a fixed **87.5% / 12.5%** of a *successful* roll. This is not an assumption — it is forced by arithmetic against Jegged's independently-published percentages:
>
> | Quantity | Jegged's published figure | Reconstruction | Match |
> |---|---|---|---|
> | Total steal success | (not published directly) | `128 / 255` = **50.196%** | — |
> | Common steal | **43.9%** | `50.196% × 0.875` = **43.92%** | ✅ exact |
> | Rare steal | **6.3%** | `50.196% × 0.125` = **6.27%** | ✅ exact |
> | Sum | 43.9 + 6.3 = **50.2%** | `128 / 255` = **50.196%** | ✅ exact |
> | Common drop | **87.5%** | `0.875` of a guaranteed drop | ✅ exact |
> | Rare drop | **12.5%** | `0.125` of a guaranteed drop | ✅ exact |
>
> Three independent checks land on the same two constants. **Implementation:**
>
> ```ts
> const STEAL_RATE_SCALE = 255;         // steal byte is out of 255
> const RARE_SLOT_SHARE  = 0.125;       // 1/8 of a successful steal hits the rare slot
>
> stealSucceeds = rand() < enemy.stealRate / STEAL_RATE_SCALE;   // 128/255 for Bahamut
> slot = rand() < RARE_SLOT_SHARE ? 'rare' : 'common';
> // Master Thief (Thief, 140 AP / 20 MP) forces slot = 'rare'
> // Sticky Fingers (Thief, 120 AP / 20 MP) forces stealSucceeds = true
> // Only one item may be stolen per enemy per battle.
> ```
>
> For Bahamut specifically the split is **cosmetic** — both slots hold Mute Shock, so the player's real question is only the 50.2% success roll. Implement the split anyway; it is the general rule and the same code serves every other encounter. [verified: 2 sources — Fandom raw byte 128, Jegged percentages]

Two nice ironies worth preserving as flavor: the drop (**Gris-Gris Bag**) is *Curseproof* — i.e. the boss drops the exact counter to his own opening move; and the steal (**Mute Shock**) grants *Silence*, to which he is immune.

> **Conflict recorded.** The Ribbon accessory's own wiki page lists "Drop: Angra Mainyu, **Bahamut (rare)**". This contradicts Bahamut's stat block, which lists Gris-Gris Bag in both drop slots for the Bevelle variant and **Ribbon as the rare drop for the *Fiend Arena* variant**. The Ribbon page is almost certainly referring to the Fiend Arena Bahamut. **Resolution: implement Gris-Gris Bag for the story boss.** [conflict — resolved in favour of the enemy stat block]

### 1.7 Misc flags

| Flag | Value |
|---|---|
| Oversoul | **Not available** [verified: 2 sources] |
| Victory pose | **Suppressed** — the party does not pose after this battle (unique; a deliberate tonal beat) [single source] |
| Trophy | "Defeating an Old Friend" (Bronze, HD Remaster) [single source] |

---

## 2. AI script

### 2.1 The script, verbatim

The Bevelle Bahamut uses a **fully deterministic, fixed 12-action loop**. No RNG branches, no HP thresholds, no phase changes.

```
Turn 1      Curse on random target
Turn 2      Normal Attack on random target
Turn 3      Normal Attack on random target
Turn 4      Normal Attack on random target
Turn 5      Impulse
Turn 6      Impulse
Turns 7-11  Countdown: starts at 5, decrements by 1 each turn
Turn 12     Mega Flare
Turn 13     Repeat from turn 1
```

[verified: 2 sources — decompile-derived AI transcription, corroborated by the prose battle description]

**This is the single most implementation-critical asset in this document.** It means:

- There is **no HP-threshold trigger** for Mega Flare. It is purely turn-counted.
- The counter is an **action counter, not a time counter** — it advances only when Bahamut takes a turn, so slowing him slows the whole script including the countdown.
- **Turns 7–11 are dead turns.** Bahamut spends five consecutive actions doing nothing but displaying a number. This is the party's designated free-damage window and the reason the fight is winnable at Lv 20.
- The loop never resets on damage. If the party survives Mega Flare, the script wraps to Curse and the whole pattern repeats identically.

### 2.2 Action table

| Turn(s) | Action | Type | Targets | Damage (Lv 24 party, unbuffed) | Effect | Confidence |
|---|---|---|---|---|---|---|
| 1 | **Curse** | Status | 1 random | — | Inflicts **Curse** status | [verified: 2 sources] |
| 2–4 | **Normal Attack** | Physical | 1 random | **≈ 115–200** | Standard physical; **evadable** (~80–89%, see §1.1); halved by **Protect**; reduced to 1 by **Sentinel** | [formula verified: 2 sources; constant [estimate]] |
| 5–6 | **Impulse** | Magic (fractional), party-wide | All 3 | **37.5% of current HP** | Halved by **Shell** → **18.75%** | [verified: 2 sources] |
| 7–11 | **Countdown** | None | — | 0 | Displays 5, 4, 3, 2, 1. No damage, no status. | [verified: 2 sources] |
| 12 | **Mega Flare** | Magic, party-wide | All 3 | **≈ 614–1,165** (varies by target MDef) | Non-elemental; halved by **Shell**; scaled by **Magic Break** | [formula verified: 2 sources; constant [estimate]] |

### 2.3 Ability detail

**Curse** — inflicts the Curse status on one random target.
- Curse in X-2 = **cannot spherechange** (cannot swap dresspheres mid-battle). It is *not* the FFX Curse.
- Wears off on its own. Cured by Esuna, Holy Water, Remedy, Full-Cure, White Wind, Panacea, Clean Slate, Ultra Cure.
- Blocked by **Gris-Gris Bag**, **Ribbon**, Shmooth Shailing, or the Curseproof auto-ability.
- Visual: the cursed character's battle model **darkens**.
- Design read: this is a targeted attack on the player's *systems*, not their HP. It punishes grid-hopping and Garment-Grid gate strategies specifically. It is also almost entirely neutralised by the Ribbon obtainable from the plate puzzle **in this same dungeon**.
[verified: 2 sources]

#### ★ Normal Attack (turns 2–4) — resolved formula

Previously this document gave the normal attack **no damage value at all**. It is computable from the published physical pipeline and Bahamut's known Lv 20 / Str 71.

**The pipeline** (physical type) [verified: 2 sources]:

| Step | Operation | Value for Bahamut |
|---|---|---|
| 1 | Base — physical: `(Lv + Str) × Lv × Str / 1024 + Str` | `(20+71) × 20 × 71 / 1024 + 71` = `126.19 + 71` = **197.2** |
| 3 | Defense: `× (270 − targetDef) / 255` | per-target |
| 4 | STR Up/Down: `× (12 + userStrLevel)/12` | ×1.0; **×0.167 at capped Power Break** |
| 5 | DEF Up/Down: `× (12 − targetDefLevel)/12` | ×1.0 unless the party runs DEF Up |
| 6 | Damage constant (part 2): `× C / 16` | **C = 16 → ×1.0** [estimate] |
| 7 | Randomiser: `× rand(240..271)/256` | ≈ ×0.9375 … ×1.0586 |
| 9 | Critical | ×2 if it crits (Luck 3 vs party Luck 10–26 → **crits are rare**) |
| 11 | Back attack | ×2 — not reachable in a scripted boss fight |
| 16 | Protect | **×0.5** |
| 17 | **Sentinel** | any Protect-reducible damage ≥2 becomes **1** |

```
Attack(target) = ((20 + 71) * 20 * 71 / 1024 + 71)          // 197.2
               * ((270 - target.def) / 255)
               * ((12 - bahamutStrDownStacks) / 12)
               * (ATTACK_CONSTANT / 16)                      // C = 16 -> x1.0
               * (rand(240,271) / 256)
               * (isCritical ? 2 : 1)
               * (target.hasProtect ? 0.5 : 1.0)
```

**The damage constant `C = 16` is [estimate].** No source publishes a constant for enemy basic attacks. 16 is the series-standard "plain Attack" constant (it makes step 6 a no-op, `16/16 = 1`), and it is the only value that produces damage consistent with every sourced description of turns 2–4 as low-threat. Expose it: `const BAHAMUT_ATTACK_CONSTANT = 16;`

**Resulting damage — Lv 24, mean roll:**

| Dressphere (Lv 24) | Def | `(270−Def)/255` | **Attack** | +Protect | +Protect +Power Break ×5 |
|---|---|---|---|---|---|
| White Mage | 12 | 1.012 | **200** | 100 | 17 |
| Black Mage | 7 | 1.031 | **203** | 102 | 17 |
| Thief | 27 | 0.953 | **188** | 94 | 16 |
| Alchemist | 28 | 0.949 | **187** | 94 | 16 |
| Gunner | 32 | 0.933 | **184** | 92 | 15 |
| Songstress | 7 | 1.031 | **203** | 102 | 17 |
| Gun Mage | 27 | 0.953 | **188** | 94 | 16 |
| Warrior | 99 | 0.671 | **132** | 66 | 11 |
| Dark Knight | 121 | 0.584 | **115** | 58 | 10 |

**Design read.** Three attacks across turns 2–4, at ~115–200 each into a 700–1,500 HP party, is **≈10–25% of one character's HP per cycle** — and they are spread across random targets. This confirms what the AI script implies: **turns 2–4 are filler, not a threat.** Protect is correctly ranked below Shell in §3.3, and **Power Break is the lowest-value of the four Breaks in this fight** (it neutralises the attack that was never dangerous). Sentinel reduces these to literally 1 HP, which is overkill.

**Cross-check that the constant scale is right.** Run the same physical formula the other way: a Lv 24 Warrior (Str 64) attacking Bahamut's Def 160 deals `((24+64)×24×64/1024 + 64) × (110/255)` = `196 × 0.431` ≈ **85 damage**. Against 8,400 HP that is ~99 attacks to kill — which independently reproduces this document's core thesis in §1.2 that **raw physicals are near-worthless here**. The two directions are consistent, so the constant scale is sound. [derived — [verified: 2 sources] for the formula, [estimate] for C]

**Impulse** — "Reduces the party's HP by 3/8."
- Fractional, **current-HP-based**, hits all three.
- Cannot kill on its own from full HP (3/8 < 1), and never reduces below ~5/8 of current per hit.
- **Shell interaction — RESOLVED as a clean ×0.5 → 3/16 (18.75%) of current HP.** [verified: 2 sources — derived from the damage flowchart]

  This is no longer an inference. In FFX-2 a **fractional** attack is just another *base-number type* at step 1 of the same 20-step pipeline (`base = target max/current HP × fraction`); it then runs through every subsequent step exactly as a constant- or formula-based attack does. **Shell is step 16**, and applies ×0.5 to any Shell-reducible attack that reaches it. Nothing in the pipeline exempts fractional bases from step 16 — the only fractional-specific rule is at **step 20**, where a fractional attack against a fractional-immune target displays "IMMUNE". So:

  | Condition | Impulse damage |
  |---|---|
  | Unmitigated | **37.5%** of current HP |
  | Under **Shell** | **18.75%** of current HP |
  | Under Shell + capped **Magic Break** | `0.375 × 0.5 × 0.167` = **3.1%** of current HP |

  ```
  Impulse(target) = target.currentHP * 0.375
                  * ((12 - bahamutMagDownStacks) / 12)      // step 4
                  * (rand(240,271) / 256)                    // step 7
                  * (target.hasShell ? 0.5 : 1.0)            // step 16
  ```

  **Two secondary consequences implementers miss:**
  - **Impulse is randomised.** Step 7 (`× rand(240..271)/256`) applies to everything except menu-cast White Magic, so Impulse is *not* exactly 3/8 — it varies ≈ ±5% per cast (35.2%–39.7%). Do not hard-code 0.375 as exact.
  - **Magic Break scales Impulse too**, because Impulse is magic-typed and step 4 keys off the attacker's MAG Down level. This is easy to miss when treating fractional damage as "special".

- Two consecutive casts (turns 5 and 6) from full HP leave a character at (5/8)² = **39.06%** of starting HP (unbuffed). Under Shell the pair leaves **66.0%** instead. This is the setup for Mega Flare: the script deliberately softens the party immediately before the burst — and Shell is what breaks that setup.

| After turns 5–6 | HP remaining |
|---|---|
| Unmitigated | (0.625)² = **39.1%** |
| Under **Shell** | (0.8125)² = **66.0%** |
| Shell + capped Magic Break | (0.969)² = **93.9%** |

[verified: 2 sources for 3/8; Shell → 3/16 now [verified: 2 sources] via the flowchart]

**Mega Flare** — "Major non-elemental damage to the party."
- Non-elemental, so no ward/proof/eater auto-ability reduces it; **only Shell** touches it (per the elements table: non-elemental damage ignores affinities entirely).
- Mitigated by **Shell** → ×0.5. [verified: 2 sources]
- **Reduced by Magic Break** → ×(12−n)/12, down to **×0.167** at cap. [verified: 2 sources]

#### ★ Mega Flare — resolved formula

No source publishes a Mega Flare damage constant. But FFX-2's **magic damage pipeline is fully published** (SinirothX's extracted-data flowchart, transcribed in `D:/Final Fantasy/research/ffx2-combat-core.md` §2.1), and Bahamut's Level and Magic are known — so the constant can be **solved for** against the two independent observed-damage reports rather than guessed. That is what this section does.

**The pipeline** (magic type, in order) [verified: 2 sources]:

| Step | Operation | Value for Bahamut |
|---|---|---|
| 1 | Base — magic: `Lv × 2 + Mag` | `20 × 2 + 86` = **126** |
| 2 | Damage constant (part 1): `× C² / 64` | `× C² / 64` |
| 3 | Defense: `× (270 − targetMDef) / 255` | per-target |
| 4 | MAG Up/Down: `× (12 + userMagLevel)/12` | ×1.0 unbuffed; **×0.167 at capped Magic Break** |
| 5 | MDEF Up/Down: `× (12 − targetMDefLevel)/12` | ×1.0 unless the party is running MDEF Up |
| 7 | Randomiser: `× rand(240..271)/256` | ≈ **×0.9375 … ×1.0586** (mean ≈ ×1.0) |
| 15 | Multi-target halving | **DOES NOT APPLY** — step 15 is scoped to *Black/White Magic cast on all*, i.e. the player's spell categories. Enemy party-wide abilities are not halved. |
| 16 | Shell | **×0.5** if the target has Shell |
| 19 | Damage cap | 9,999 — never reached here |

```
MegaFlare(target) = (20*2 + 86) * (C*C / 64) * ((270 - target.mdef) / 255)
                  * ((12 - bahamutMagDownStacks) / 12)
                  * (rand(240,271) / 256)
                  * (target.hasShell ? 0.5 : 1.0)
```

**Solving for C.** Rearranging step 1–3 for the damage constant:

```
C = sqrt( 64 * 255 * observedDamage / (126 * (270 - targetMDef)) )
```

The two independent observations are the Fandom/GameFAQs *"upwards of around 1,000"* and GamerGuides' *"500–1,000 magic damage to all"*. Both describe an **unbuffed Chapter-2 party**, which at that point is overwhelmingly the default trio — **Gunner (MDef 32) / Thief (MDef 57) / Warrior (MDef 8)**. Solving against the Gunner at 1,000 damage gives `C = 23.3`; against the Warrior at 1,000, `C = 22.1`.

**Adopted value: `C = 24`.** [estimate — reasoned] Three reasons:
1. It sits inside the solved band (22–24) from both observations.
2. **24 is an attested FFX-2 damage constant** — it is the published Lv.2 magic tier (Fira/Blizzara/Thundara/Watera). The known constant ladder is `Lv.1 = 12, Lv.2 = 24, Lv.3 = 42, Flare = 60, Ultima = 70, Holy = 100`, so 24 is a real value from the game's own table rather than an arbitrary fit. [single source for the ladder]
3. It reproduces **both** published damage descriptions simultaneously — the spread below runs 614–1,165, which is exactly "500–1,000" from one reporter and "upwards of around 1,000" from the other.

**Resulting damage table — Lv 24, unbuffed, mean roll** (`126 × 9 = 1,134`, then × the MDef term):

| Dressphere (Lv 24) | MDef | `(270−MDef)/255` | **Mega Flare** | Under **Shell** | Max HP | Survives from full? | Survives from post-Impulse 39.1%? |
|---|---|---|---|---|---|---|---|
| Warrior | 8 | 1.028 | **1,165** | 583 | 1,176 | ✅ by **11 HP** | ❌ |
| Alchemist | 11 | 1.016 | **1,152** | 576 | 917 | ❌ **dies** | ❌ |
| Gunner | 32 | 0.933 | **1,058** | 529 | 1,005 | ❌ **dies** | ❌ |
| Songstress | 42 | 0.894 | **1,014** | 507 | 699 | ❌ dies | ❌ |
| Thief | 57 | 0.835 | **947** | 474 | 1,048 | ✅ by 101 | ❌ |
| Gun Mage | 66 | 0.800 | **907** | 454 | 871 | ❌ dies | ❌ |
| Dark Knight | 82 | 0.737 | **836** | 418 | 1,533 | ✅ by 697 | ❌ (599 HP) |
| Black Mage | 127 | 0.561 | **636** | 318 | 692 | ✅ by 56 | ❌ |
| White Mage | 132 | 0.541 | **614** | 307 | 715 | ✅ by 101 | ❌ |

> **This overturns the tuning guidance this document previously gave.** The old advice — "a flat 1,000 one-shots the White Mage and leaves the Dark Knight comfortably alive" — is **wrong**, because a flat number ignores MDef. Under the real formula the White Mage is the **single most Mega-Flare-resistant** dressphere in the game (MDef 132 cuts it to 614), and the character who actually dies is the **Alchemist** — the healer, at MDef 11 — along with the **Gunner**. Do not implement a flat value.
>
> **The corrected design read, and it is a better one:** Mega Flare is a **magic-armour check**, not an HP check. It kills the low-MDef supports (Alchemist, Gunner, Warrior-adjacent) and spares the mages. That is precisely why **Shell is called "essential" in §3.3** — under Shell *every* dressphere in the table survives from full HP, and the fight becomes about topping the party back up during the countdown. It is also why **Magic Break is the strongest lever in the fight**: five casts drop Mega Flare to 102–194, below even a White Mage's post-Impulse HP.

**Combined mitigation, worst case (Alchemist, 917 HP):**

| Mitigation | Mega Flare | Survives from full? | Survives from 39.1%? |
|---|---|---|---|
| None | 1,152 | ❌ | ❌ |
| Shell | 576 | ✅ | ❌ (359 HP) |
| Magic Break ×5 | 192 | ✅ | ✅ |
| **Shell + Magic Break ×5** | **96** | ✅ | ✅ |

**Tuning knobs — expose all three as named constants:**

```ts
const MEGA_FLARE_CONSTANT = 24;   // [estimate] solved band 22-26; 24 is an attested FFX-2 tier value
const BAHAMUT_LEVEL       = 20;   // [verified: 2 sources]
const BAHAMUT_MAGIC       = 86;   // [verified: 2 sources]
```

Raising `C` to 26 lifts the spread to 720–1,367; dropping it to 22 lowers it to 516–979. **Tune with `C`, never with a flat damage number** — a flat number destroys the MDef gradient that makes the encounter legible.

> **The one structural uncertainty.** If FFX-2 *does* apply the step-15 multi-target halving to enemy party-wide magic (this document reads step 15 as scoped to player Black/White Magic, which is how the source states it), then `C` must roughly double to **34** to reproduce the same observed damage. The final numbers are identical either way; only the constant moves. Implement the halving as an explicit boolean so the two readings are one flag apart:
> ```ts
> const ENEMY_MULTI_TARGET_MAGIC_IS_HALVED = false;  // [estimate] — if true, set C = 34
> ```

### 2.4 Per-cycle damage budget (derived)

Assume a Lv 24 party at full HP, no buffs, using the resolved formulas above.

| Turn | Action | Cumulative HP remaining (as % of max), per target |
|---|---|---|
| 1 | Curse | 100% (one member loses spherechange) |
| 2–4 | 3× Attack | ~115–200 damage each, on random targets (≈10–25% of one character's HP total) |
| 5 | Impulse | 62.5% |
| 6 | Impulse | 39.1% |
| 7–11 | Countdown | 39.1% — **five free party turns** |
| 12 | Mega Flare | 39.1% of max, minus **614–1,165 scaled by MDef** → **the entire party dies unless healed during turns 7–11** |

**Worked cycle for the canonical party (§3.1), Lv 24, no buffs:**

| Member | Max HP | After 2× Impulse (39.1%) | Mega Flare | Result |
|---|---|---|---|---|
| Alchemist (MDef 11) | 917 | 359 | −1,152 | **KO** |
| Dark Knight (MDef 82) | 1,533 | 599 | −836 | **KO** |
| Warrior (MDef 8) | 1,176 | 460 | −1,165 | **KO** |

**Total party wipe** — so the five countdown turns are not a bonus, they are a hard requirement. The minimum survival budget is:

| Route | What it takes | Result |
|---|---|---|
| **Heal only** | Restore everyone to ≥ Mega Flare damage during turns 7–11. One Mega-Potion (2,000 HP to all) covers the Impulse deficit for all three. | Alchemist (917 max) still dies at 1,152 — **heal alone is not enough for her** |
| **Shell** | Impulse pair leaves 66% instead of 39.1%; Mega Flare halves to 307–583 | **Everyone survives** without any healing |
| **Magic Break ×5** | Mega Flare → 102–194; Impulse → 6.25% | **Everyone survives** trivially |

This is the numeric proof of §3.3's ranking: **Shell alone converts a guaranteed wipe into a guaranteed survival.** That is why it is tagged "Essential" and why the Alchemist's low MDef makes her, not the White Mage, the member the encounter is built to kill.

**The fight's whole rhythm is: survive → get five free turns → spend them on damage *and* on getting back above the Mega Flare threshold.** Implement the countdown as a visible, unmissable UI cue; it is the player's contract with the encounter.

### 2.5 Break Damage Limit

**Bahamut does not need it and the player cannot have it.**

| Question | Answer | Confidence |
|---|---|---|
| Does the boss break the 9,999 cap? | Irrelevant — party max HP at Ch. 2 is ~700–1,800, orders of magnitude below the cap | [derived] |
| Can the *player* break the cap here? | **No.** In X-2, BDL comes from the **Invincible** accessory (Chapter 5, Youth League base), the **Higher Power** grid (Ch. 5), **The End** grid (post-Bestiary completion), **Peerless/Last Resort** grids (Int./HD, arena rewards), or a special dressphere with its BDL key item (all Ch. 5). **None exist in Chapter 2.** | [verified: 2 sources] |
| Does it matter? | No — Bahamut has 8,400 HP, under the 9,999 cap. A single uncapped hit could never be needed. | [derived] |

Note the FFX-2 Bahamut is *not* the FFX summon. The **FFX** aeon Bahamut is one of the few summons that exceeds 9,999 from the start; that property does not carry into the X-2 boss. Do not conflate them. [verified: 2 sources]

### 2.6 "Bahamut prepares Mega Flare" string

The brief quotes a `"Bahamut prepares Mega Flare"` / `"counting down"` message pattern. **No accessible source records the on-screen string for the X-2 version.** What *is* documented is the numeric countdown: a decrementing 5→1 indicator over five turns, the series-standard Bahamut/Megaflare countdown presentation.

**Recommendation:** implement a numeric countdown badge on the boss (5, 4, 3, 2, 1) rather than a text banner, and treat any English string as authored-for-Pyrefly-Reprise rather than as a quotation. [gap — do not present invented strings as canon]

---

## 3. Player strategies

### 3.1 The canonical party

**Alchemist + Dark Knight + Warrior**, with a stock of Potions and Hi-Potions. [verified: 2 sources]

Turn-by-turn doctrine:

1. **Warrior** alternates **Power Break** and **Magic Break** until both are capped (5 casts each) — this cuts incoming physical and magic damage first.
2. **Alchemist** repeatedly **Mixes Potion + Hi-Potion → Mega-Potion** (party-wide heal). This is the sustain engine.
3. **Dark Knight** uses **Darkness every single turn**.
4. Once STR and MAG are floored, the Warrior switches to **Armor Break** and **Mental Break** to maximise party output.
5. If the fight is still going once all four stats are capped, the Warrior spherechanges to a second **Dark Knight** and also spams Darkness.

Substitution: if Alchemist isn't owned, a **White Mage with Shell, Protect and Curaga** covers the role. [verified: 2 sources]

> **Break ordering — the resolved maths endorses this doctrine, with one change.** Now that Breaks are known to be damage multipliers rather than stat edits (§1.5), the canonical order can be ranked precisely. Note that step 1 above ("Power Break and Magic Break until both are capped") is *half* optimal:
>
> | Priority | Break | Why | Casts |
> |---|---|---|---|
> | **1st** | **Magic Break** | Caps Mega Flare at ×0.167 and Impulse at 6.25% of current HP. This is the whole encounter. | 5 |
> | **2nd** | **Mental Break** | Flat ×1.833 to all party magic. Requires Magic Break — already done. | 5 |
> | 3rd | Armor Break | ×1.833 to physicals, but physicals are the weak route here. | 5 |
> | **last / skip** | Power Break | Neutralises ~115–200 damage per hit on turns 2–4. Lowest value. | 5 |
>
> **Ten Warrior turns (Magic Break ×5 → Mental Break ×5) is the strongest opening in the fight.** With the 12-action loop and ~5 free countdown turns per cycle, that is comfortably achievable inside two cycles. If the Alchemist substitute is a White Mage instead, cast **Shell before anything else** — it is the single action that converts a guaranteed wipe (§2.4) into a guaranteed survival.
>
> Caveat kept from §3.3: **do not run Armor Break alongside Table-turner** — Table-turner inverts both the Defense step and the DEF-Down step (`×(15+Def)/255` and `×(12 + targetDefLevel)/12`), so lowering his effective Defense actively reduces Table-turner's damage. [verified: 2 sources]

### 3.2 Why Darkness is the answer (mechanical justification)

**Darkness** (Dark Knight, **Initial** — costs 0 AP, available the moment the dressphere is picked up):

| Property | Value | Confidence |
|---|---|---|
| Cost | **12.5% of user's max HP** (no MP) | [verified: 2 sources] |
| Targets | **All enemies** | [verified: 2 sources] |
| **Ignores Defense** | **Yes** | [verified: 2 sources] |
| Range | Long range | [single source] |
| Can crit | **No** | [single source] |
| Fails if | User lacks the HP to pay | [single source] |
| Spellspring interaction | Reduces the **HP** cost to 0 (despite Spellspring nominally being MP-only) | [single source] |

Darkness bypassing Defense 160 is the entire point. A Lv 24 Dark Knight has 1,533 HP → **192 HP per cast**, comfortably affordable with Alchemist Mega-Potions backing it. This is why the Dark Knight dressphere is placed **inside this very dungeon** (lift puzzle, Chapter 2) — the game hands the player the counter immediately before the test.

### 3.3 Full strategy matrix

| Strategy | Works? | Mechanical reason | Confidence |
|---|---|---|---|
| **Shell** (White Mage, 10 MP; Selene Guard grid; Lunar Curtain) | **Essential** | Halves magic damage. Both Impulse and Mega Flare are magic-based. Halves the two biggest threats in the script. | [verified: 2 sources] |
| **Protect** (White Mage, 12 MP; Helios Guard grid; Light Curtain) | **Useful** | Halves physical. Only turns 2–4 are physical, so this is the lesser of the two buffs — cast Shell first. | [verified: 2 sources] |
| **Dark Knight Darkness** | **Best damage** | Ignores Defense 160. See §3.2. | [verified: 2 sources] |
| **Warrior Breaks** | **Yes — all four land** | Bahamut is **not** immune to stat modifiers (unlike Anima and the arena Bahamut). 30 AP / 4 MP each, 2 stacks per cast, 5 casts to cap. **Ranking corrected — see the Break table below; Magic Break, not Armor Break, is the highest-value one.** | [verified: 2 sources] |
| └ **Magic Break** | **Best in fight** | MAG Down caps at **×0.167** on *all* his magic. Mega Flare 1,152 → **192**; Impulse 37.5% → **6.25%**. Five casts defuse the entire win condition. Stacks multiplicatively with Shell (→ ×0.083). | [verified: 2 sources] |
| └ **Mental Break** | **Better than previously rated** | MDEF Down is a **flat ×1.833** on your magic and **does not care that his MDef is only 10** — the old "marginal" rating assumed a stat-subtraction model that does not exist (§1.5). +83% to Darkness-adjacent magic, Enchanted Ammo, Black Sky and all Black Magic. Requires Magic Break first, which you want anyway. | [verified: 2 sources] |
| └ **Armor Break** | **Good, not decisive** | DEF Down is **×1.833** on your physicals — *not* a reduction of Def 160 to ~27. A Lv 24 Warrior's Attack goes 85 → 156. Useful, but it multiplies a route (physical) that is bad here to begin with. **Anti-synergises with Table-turner.** | [verified: 2 sources] |
| └ **Power Break** | **Lowest value** | STR Down caps his physicals at **×0.167** — but turns 2–4 only deal ~115–200 unmitigated (§2.3), so this neutralises the threat that was never dangerous. Cast it last, or skip it. | [verified: 2 sources] |
| **Gunner Trigger Happy** | **Poor** | Each shot has **normal Attack strength** and is a plain physical — so each shot is individually crushed by Defense 160. Multi-hit does not help when per-hit damage is near-floored. Cat Nip's 9,999-per-shot trick is Chapter 5 gear *and* was removed in Int./HD (Cat Nip gained Auto-Berserk, which blocks command selection). | [verified: 2 sources] |
| **Gunner Cheap Shot** (8 AP / 30 MP) | **Good** | Physical damage that **ignores Defense**. The Gunner's real answer to this boss. | [single source] |
| **Gunner Table-turner** (8 AP / 60 MP) | **Excellent, situational** | *"Damage based on target's Defense; the higher the Defense, the greater the damage."* Against Defense **160** this is near-optimal. **Caveat: it anti-synergises with Armor Break** — do not run both on the same target. | [single source] |
| **Gunner On the Level** (12 AP / 40 MP) | **Reliable** | Fixed special damage = **user's level × 16**. At Lv 25 = 400, defense-independent. A dependable floor. | [verified: 2 sources] |
| **Gunner Enchanted Ammo** (8 AP / 30 MP) | **Good** | Non-elemental **magic** damage — routes through MDef **10** instead of Def 160. | [single source] |
| **Black Mage elemental magic** | **Decent** | No weakness (×1.0), but routes through MDef 10. Better than physical by a wide margin. | [derived] |
| **Berserker** | **Not available** | Chapter 3 acquisition (Lake Macalania). Cannot be owned at this fight. | [verified: 2 sources] |
| **Samurai / Zantetsu** | **Not available** | Chapter 3 acquisition (Kilika Temple). Also `zantetsu = 100` resistance. | [verified: 2 sources] |
| **Silver Hourglass** | **Yes** | Inflicts **Slow** on one enemy. Bahamut is **not** Slow-immune. Slow halves ATB fill rate — and because the AI is action-counted, this stretches the whole 12-turn cycle, including the free countdown window. **Strongest single item in the fight.** | [single source] |
| **Gold Hourglass** | **No** | **Delays** all enemies. Bahamut is flagged **Delay-immune**. Inert here. | [verified: 2 sources] |
| **Demi / Demi Sword / Quarter Pounder** | **No** | Gravity-immune / fractional-damage-immune. | [single source] |
| **Instant death (Death, Doom, Break/Petrify)** | **No** | Immune to Death, Doom, Petrify. | [single source] |
| **Poison, Silence, Darkness, Sleep, Confuse, Berserk, Stop, Eject** | **No** | All immune. | [single source] |
| **Potions / Hi-Potions / Mega-Potion via Mix** | **Core sustain** | Alchemist Mix (Potion + Hi-Potion → Mega-Potion) is the recommended healing engine; Mega-Potion restores 2,000 HP to all allies. | [verified: 2 sources] |
| **Special dressphere (Full Throttle recommended)** | **Strong** | Sinistral Wing raises Str/Def, casts Haste, lowers Bahamut's stats; Dextral Wing spams Poison Wing (status is wasted but the damage is not); Paine uses Fiers, which **always crits**. Adapts to Floral Fallal and Machina Maw. **Note:** accessories are disabled while in a special dressphere, and special-dressphere base stats scale with the *node count* of the equipped Garment Grid. | [single source] |
| **Ribbon** (plate puzzle, this dungeon) | **Hard-counters Curse** | Guards against all status ailments. Obtainable in the Restricted Area before the fight. | [verified: 2 sources] |
| **Gris-Gris Bag** | **Counters Curse** | Curseproof, Def +4 / MDef +4. Also the boss's own drop. | [verified: 2 sources] |
| **Creature Creator: Kukulcan** (Int./HD) | **Strong** | **Heaven's Cataract** lowers Bahamut's defenses. Pair with an Alchemist girl for sustain. | [single source] |
| **Creature Creator: Tonberry** (Int./HD) | **Strong** | Very high Strength and good all-round stats. | [single source] |
| **Creature Creator: Fly Eye / Vertigo / Sahagin** (Int./HD) | **Strong** | Lingering Gaze / Squirt Gun inflict **Slow**, which lands. Combine with Kukulcan for defense-down + Slow. | [single source] |

### 3.4 Implementation note on Slow

Because the AI script is **action-counted, not clock-counted**, Slow does not merely give the party more real-time — it **proportionally stretches every phase of the loop**, including the five dead countdown turns, without reducing the number of free party turns the party receives. Slowing Bahamut is therefore a pure, unambiguous win with no downside. If Pyrefly Reprise reimplements the ATB, preserve this property: Slow must scale Bahamut's action rate, not skip entries in his script.

---

## 4. Typical party at the Chapter 2 Bevelle fight

### 4.1 Level and progression baseline

| Field | Value | Confidence |
|---|---|---|
| Chapter | **2** (final boss of the chapter) | [verified: 2 sources] |
| Typical party level | **Lv 20–28**, centre of mass ~**Lv 24** | [estimate — anchored on boss Lv 20 and the immediately preceding bosses] |
| Anchor: boss level | Bahamut is Lv 20 | [verified: 2 sources] |
| Anchor: preceding bosses in this dungeon | **Precepts Guard 3,680 HP**; **Baralai 3,380 HP** | [single source] |

Character levelling note: the three girls have **separate EXP pools** and level at different rates. Yuna is the slowest (1,350,322 EXP to Lv 99), Rikku middle (1,249,480), Paine fastest (1,169,767). So a realistic party is **Paine ≥ Rikku ≥ Yuna**, e.g. Paine 25 / Rikku 24 / Yuna 23. [verified: 2 sources]

**Critical system note for implementers:** in FFX-2, **all combat stats come from the equipped dressphere, not the character.** Only Trainer, Mascot and the three special dresspheres have per-character stat differences. Yuna, Rikku and Paine are mechanically identical in any shared dressphere at the same level; only their level differs. Accessories are not character-specific either. [verified: 2 sources]

### 4.2 Dressphere stat tables, Lv 20–28

These are the actual per-level stat tables. Columns: HP, MP, Strength, Magic, Defense, Magic Defense, Agility, Accuracy, Evasion, Luck. [verified: 2 sources — transcribed from the per-dressphere stat tables]

**Gunner** (Yuna's default)
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 862 | 51 | 46 | 24 | 30 | 30 | 53 | 123 | 4 | 15 |
| 22 | 934 | 54 | 48 | 25 | 30 | 30 | 53 | 123 | 4 | 15 |
| 24 | 1005 | 57 | 52 | 26 | 32 | 32 | 53 | 123 | 4 | 15 |
| 26 | 1075 | 59 | 54 | 28 | 33 | 33 | 53 | 123 | 4 | 16 |
| 28 | 1143 | 63 | 58 | 29 | 35 | 35 | 53 | 123 | 4 | 16 |

**Thief** (Rikku's default)
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 896 | 74 | 39 | 32 | 24 | 54 | 60 | 110 | 19 | 26 |
| 22 | 972 | 78 | 42 | 34 | 25 | 55 | 60 | 110 | 19 | 26 |
| 24 | 1048 | 81 | 44 | 37 | 27 | 57 | 60 | 110 | 19 | 26 |
| 26 | 1122 | 85 | 48 | 38 | 28 | 59 | 61 | 110 | 20 | 27 |
| 28 | 1195 | 88 | 50 | 40 | 29 | 60 | 61 | 111 | 20 | 27 |

**Warrior** (Paine's default)
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 1002 | 58 | 57 | 24 | 95 | 8 | 50 | 102 | 5 | 12 |
| 22 | 1089 | 61 | 60 | 25 | 97 | 8 | 50 | 102 | 5 | 12 |
| 24 | 1176 | 65 | 64 | 26 | 99 | 8 | 50 | 102 | 5 | 12 |
| 26 | 1263 | 69 | 68 | 26 | 100 | 9 | 50 | 102 | 5 | 12 |
| 28 | 1349 | 72 | 72 | 27 | 102 | 9 | 50 | 102 | 5 | 12 |

**Dark Knight** (acquired in this dungeon)
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 1311 | 147 | 60 | 44 | 118 | 80 | 38 | 102 | 2 | 10 |
| 22 | 1422 | 152 | 64 | 47 | 120 | 81 | 38 | 102 | 2 | 10 |
| 24 | 1533 | 158 | 69 | 49 | 121 | 82 | 38 | 102 | 2 | 10 |
| 26 | 1643 | 164 | 72 | 52 | 123 | 83 | 38 | 102 | 2 | 10 |
| 28 | 1753 | 169 | 76 | 54 | 124 | 84 | 38 | 102 | 2 | 10 |

**White Mage**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 613 | 119 | 9 | 64 | 12 | 129 | 52 | 100 | 5 | 10 |
| 22 | 664 | 126 | 9 | 66 | 12 | 130 | 52 | 100 | 5 | 10 |
| 24 | 715 | 133 | 9 | 70 | 12 | 132 | 52 | 100 | 5 | 10 |
| 26 | 765 | 140 | 10 | 72 | 13 | 134 | 52 | 100 | 5 | 10 |
| 28 | 815 | 147 | 10 | 76 | 13 | 136 | 52 | 100 | 5 | 10 |

**Black Mage**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 593 | 130 | 8 | 68 | 7 | 124 | 51 | 99 | 4 | 10 |
| 22 | 642 | 137 | 8 | 71 | 7 | 125 | 51 | 99 | 4 | 10 |
| 24 | 692 | 145 | 8 | 74 | 7 | 127 | 51 | 99 | 4 | 10 |
| 26 | 740 | 153 | 9 | 77 | 8 | 128 | 51 | 99 | 4 | 10 |
| 28 | 789 | 160 | 9 | 80 | 8 | 130 | 51 | 99 | 4 | 10 |

**Alchemist**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 788 | 42 | 44 | 12 | 26 | 10 | 52 | 119 | 3 | 11 |
| 22 | 853 | 45 | 46 | 13 | 26 | 10 | 52 | 119 | 3 | 11 |
| 24 | 917 | 47 | 49 | 14 | 28 | 11 | 52 | 120 | 3 | 11 |
| 26 | 980 | 50 | 51 | 15 | 30 | 12 | 52 | 120 | 3 | 11 |
| 28 | 1041 | 52 | 54 | 15 | 30 | 13 | 52 | 120 | 3 | 11 |

**Gun Mage**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 747 | 98 | 52 | 61 | 25 | 63 | 53 | 120 | 3 | 10 |
| 22 | 809 | 104 | 55 | 64 | 25 | 65 | 53 | 120 | 3 | 10 |
| 24 | 871 | 109 | 59 | 67 | 27 | 66 | 53 | 120 | 3 | 10 |
| 26 | 932 | 115 | 62 | 70 | 28 | 68 | 53 | 120 | 3 | 10 |
| 28 | 991 | 120 | 66 | 73 | 29 | 69 | 53 | 121 | 3 | 10 |

**Songstress**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 597 | 98 | 7 | 46 | 7 | 41 | 55 | 98 | 10 | 9 |
| 22 | 648 | 104 | 7 | 48 | 7 | 41 | 55 | 98 | 10 | 9 |
| 24 | 699 | 110 | 7 | 50 | 7 | 42 | 55 | 98 | 10 | 9 |
| 26 | 750 | 115 | 8 | 53 | 8 | 43 | 56 | 98 | 10 | 9 |
| 28 | 800 | 121 | 8 | 56 | 8 | 44 | 56 | 98 | 10 | 9 |

**Berserker — NOT AVAILABLE in Chapter 2** (Chapter 3, Lake Macalania). Table included only so implementers can confirm it must be excluded:
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 1393 | 44 | 59 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 24 | 1640 | 50 | 66 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 28 | 1883 | 55 | 73 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |

### 4.3 Dressphere ownership by Chapter 2 Bevelle

| Dressphere | Owned? | Acquisition | Confidence |
|---|---|---|---|
| **Gunner** | **Yes** | Yuna's default | [verified: 2 sources] |
| **Thief** | **Yes** | Rikku's default | [verified: 2 sources] |
| **Warrior** | **Yes** | Paine's default | [verified: 2 sources] |
| **Black Mage** | **Yes** | Ch. 1, after the first Floating Ruins mission | [verified: 2 sources] |
| **White Mage** | **Yes** | Ch. 1, after the Besaid story mission | [verified: 2 sources] |
| **Songstress** | **Yes** | After first defeating Leblanc in Luca (Ch. 1) | [verified: 2 sources] |
| **Gun Mage** | **Likely** | Ch. 1 **or** Ch. 2 at the Moonflow — optional, commonly picked up | [verified: 2 sources] |
| **Alchemist** | **Likely** | Ch. 2 (or 3/5), Calm Lands Ruins — optional, and the wiki's recommended party needs it | [verified: 2 sources] |
| **Dark Knight** | **Yes — in this dungeon** | Bevelle Underground lift puzzle, Ch. 2/3/5. Chest near the end of the area, *before* Bahamut. | [verified: 2 sources] |
| **Samurai** | **NO** | Ch. 3, Kilika Temple | [verified: 2 sources] |
| **Lady Luck** | **NO** | Ch. 3 (Sphere Break vs. Shinra, Luca) or Ch. 5 | [verified: 2 sources] |
| **Berserker** | **NO** | Ch. 3, after the Lake Macalania mission | [verified: 2 sources] |
| **Trainer** | **NO** | Answer Kimahri correctly in Ch. 2, but he **gives** the dressphere in Ch. 3 | [verified: 2 sources] |
| **Mascot** | **NO** | Requires Episode Complete everywhere (endgame) | [verified: 2 sources] |
| **Floral Fallal** (Yuna special) | **Likely** | Ch. 2, Djose Highroad, behind a rock | [verified: 2 sources] |
| **Machina Maw** (Rikku special) | **Likely** | Ch. 2, Bikanel Desert Oasis | [verified: 2 sources] |
| **Full Throttle** (Paine special) | **Possible** | Talk to Tromell ×4 in Macalania Woods, Ch. 1 or 2. Fully optional and **permanently missable**. | [verified: 2 sources] |

> Note: special dresspheres are activated by passing through **every job on the equipped Garment Grid in one battle**. Their base stats scale with the grid's **node count**, and accessories are **disabled** while transformed. BDL key items are all Chapter 5, so specials here are un-mastered. [verified: 2 sources]

### 4.4 Typical abilities learned by this point

Key AP/MP costs for the abilities that matter in this fight. [verified: 2 sources]

**Warrior — Swordplay** (mastery 740 AP total)
| Ability | AP | MP | Effect |
|---|---|---|---|
| Power Break | 30 | 4 | Damage + **STR Down ×2** |
| Armor Break | 30 | 4 | Damage + **DEF Down ×2** |
| Magic Break | 30 | 4 | Damage + **MAG Down ×2** |
| Mental Break | 30 | 4 | Damage + **MDEF Down ×2** (requires Magic Break) |
| Flametongue / Ice Brand / Thunder Blade / Liquid Steel | 20 | 4 | Fire / Ice / Lightning / Water damage, single target |
| Demi Sword | 60 | 6 | Gravity — **useless here** (immune) |
| Excalibur | 120 | 24 | Holy damage (requires Demi Sword) |
| Delay Attack | 100 | 10 | **Useless here** (Delay-immune) |
| Delay Buster | 120 | 16 | **Useless here** (Delay-immune) |
| Sentinel (command) | 20 | — | Physical attacks deal 1 HP until next turn; **magic still full**; user immobile |
| Assault (command) | 100 | — | Casts Berserk + Haste + Shell + Protect on the party (requires Sentinel) |
| SOS Protect (auto) | 20 | — | Auto-Protect at low HP |

> **Assault is a sleeper pick for this fight** — one command grants party-wide Shell *and* Protect *and* Haste. The Berserk rider is the cost. 100 AP is a realistic Chapter 2 investment.

**Dark Knight — Arcana + commands** (mastery 490 AP — the *cheapest* dressphere to master)
| Ability | AP | MP | Effect |
|---|---|---|---|
| **Darkness** (command) | **Initial** | — (12.5% max HP) | All enemies, **ignores Defense**, no crit |
| Charon (command) | 20 | — | Sacrifice life to heavily damage one enemy |
| Drain | 20 | 8 | Absorb HP from one enemy |
| Demi | 20 | 10 | **Useless here** (Gravity-immune) |
| Confuse / Break / Bio / Doom / Death | 30–50 | 12–24 | **All useless here** (immune) |
| Black Sky | 100 | 80 | Moderate damage, all enemies (requires Death) |
| Poisonproof / Stoneproof / Confuseproof etc. (auto) | 30 each | — | Status immunities |

**Gunner — Gunplay** (mastery 800 AP)
| Ability | AP | MP | Effect | Verdict vs. Bahamut |
|---|---|---|---|---|
| **Trigger Happy** (command) | **Initial** | — | Mash R1 for N shots at normal Attack power | Poor (Def 160) |
| Trigger Happy Lv.2 (auto) | 80 | — | Window → 2.2 s | — |
| Trigger Happy Lv.3 (auto) | 150 | — | Window → 2.6 s (requires Lv.2) | — |
| Potshot | 8 | 20 | Physical, single | Poor |
| **Cheap Shot** | 8 | 30 | Physical, **ignores Defense** (requires Potshot) | **Good** |
| **Enchanted Ammo** | 8 | 30 | Non-elemental **magic** damage | **Good** (MDef 10) |
| Target MP | 8 | 30 | Damages MP (requires Enchanted Ammo) | Pointless (MP 9,999) |
| Quarter Pounder | 8 | 40 | −25% current HP | **Useless** (fractional-immune) |
| **On the Level** | 12 | 40 | Special damage = **user level × 16** | **Good** — flat, defense-independent [verified: 2 sources] |
| Burst Shot | 12 | 60 | Guaranteed critical, physical | Mediocre |
| **Table-turner** | 8 | 60 | Damage **scales with target's Defense** | **Excellent** — but conflicts with Armor Break |
| Scattershot | 8 | 80 | Physical, all enemies (requires Burst Shot) | Poor |
| Scatterburst | 36 | 120 | Guaranteed crits, all enemies | Mediocre |

**White Mage — White Magic** (mastery 750 AP)
| Spell | AP | MP | Effect |
|---|---|---|---|
| Cure | 20 (already known in Int./HD) | 4 | Minor heal, one or all |
| Cura | 40 | 10 | Moderate heal, one or all |
| **Curaga** | 80 | 20 | Major heal, one or all (requires Cura) |
| Esuna | 20 | 10 | Removes all negative statuses — **cures Curse** |
| Dispel | 30 | 12 | Removes positive statuses (requires Esuna) |
| Life | 30 | 18 | Revive |
| Full-Life | 160 | 60 | Full revive (requires Life) |
| **Shell** | 30 | 10 | **Halves magic damage** |
| **Protect** | 30 | 12 | Halves physical damage (requires Shell) |
| Reflect | — | 14 | Bounces spells |
| Regen | 80 | 40 | HP over time (requires Curaga) |
| White Magic Lv.2 / Lv.3 (auto) | 40 / 60 | — | −30% / −50% cast time |

> **Haste, Hastega, Auto-Life and Holy are NOT on the White Mage** in X-2 — they come only from accessories or Garment Grids. [verified: 2 sources]

**Thief** — Steal, Pilfer HP/MP/Gil, Flee, First Strike, Master Thief. Thief is the **fastest** dressphere and lands **two hits per Attack command**. [verified: 2 sources]

**Alchemist** — Stash (Potion/Hi-Potion/Mega-Potion/Elixir/Phoenix Down from a limitless pool), **Mix**, Chemist, Elementalist, Item Level-Ups. Mega-Potion restores **2,000 HP to all allies**. [verified: 2 sources]

### 4.5 Garment Grids owned by Chapter 2 Bevelle

Available at or before this fight [verified: 2 sources]:

| Grid | Chapter | Where | Relevance |
|---|---|---|---|
| **First Steps** | 1 | Start of game (6 nodes) | Baseline |
| **Vanguard** | Any | *Celsius* — view Shinra's Garment Grid tutorial | Baseline |
| **Selene Guard** | **2** | Mi'ihen Highroad, "Cuckoo for Chocobos!" — beat Chocobo Eater in time | **Contains Shell — top pick** |
| **Helios Guard** | **1** | Moonflow, "Shave the Hypello" with no luggage lost | **Contains Protect** |
| **Healing Light** | **2** | Chateau Leblanc, "Faking and Entering" | **Full-Cure**; Cure/Cura/Curaga/Life via gates |
| **Healing Wind** | 1 | Luca, "Behind the Scenes" | Cure/Cura/Curaga via gates |
| **Heart Reborn** | 1 | Zanarkand Ruins, "Claim the Treasure Sphere" | Life magic |
| **Protection Halo** | 1 | Besaid Cave — beat Flame Dragon, "Where's Wakka?" | Raises Def & MDef |
| **Hour of Need** | 2 | Bikanel Oasis — beat Logos, "Water We Doing Here?" | Raises Def & MDef |
| **Bum Rush** | 2 | *Celsius*, after "Strip Search" | Raises Str & Mag |
| **Downtrodder** | **2** | **Bevelle Underground Labyrinth** — first crossroad, right junction, cross the gap | Found in this dungeon |
| **Shining Mirror** | 2 | Mushroom Rock Rd — beat Elma (requires giving the Awesome Sphere to New Yevon) | Reflect |
| **Covetous** | 2 | Luca — be interviewed by Shelinda | Absorbs HP/MP; grants Osmose |
| **Seething Cauldron** | 2 | Moonflow, "YRP, the Scalpers Three" | Raises Magic |
| **Stonehewn** | 2 | Mt. Gagazet — beat Ormi, "Spring into Action" | Raises Defense |
| **Bitter Farewell** | 2 | Macalania Woods, Hypello at the southern entrance | Death magic — wasted here |
| **Mortal Coil** | 2/3/5 | Besaid Island minigame, score 1150 | — |
| **Enigma Plate** | 2/3/5 | Besaid Island minigame, score ≥500 | — |
| **Raging Giant** | 1/2/3/5 | Besaid Cave, second door (needs Besaid Key) | — |
| **Restless Sleep** | 1 | Mushroom Rock Rd, east-side path chest | — |
| **Still of Night** | 1 | Bikanel, "Can You Dig It?" (needs Djose Letter of Introduction) | — |
| **Heart of Flame** | 1 | Mushroom Rock Rd, "Foggy Fiend Frenzy" | Fire |
| **Ice Queen** | 1/2 | "Follow That O'aka!" | Ice |
| **Thunder Spawn** | 1/2/5 | Luca, chest at the end of Dock 5 | Lightning |
| **Menace of the Deep** | 1 | Kilika, "Awesome Sphere" using passwords, no guard fights | Water |
| **Highroad Winds** | 2/3/5 | "Clean Sweep" | — |
| **Samurai's Honor** | **2**/3 | Thunder Plains — visit all 10 towers, calibrate ≥5 | — |
| **Unerring Path** | 1/2 | Comes with the player's first special dressphere | — |
| **Mounted Assault** / **Strength of One** | 2/3/5 | Calm Lands Ruins chocobo dispatch (random) | — |

**Not yet available** (common misconceptions to guard against): Pride of the Sword (Ch. 3), Chaos Maelstrom (Ch. 3/5), White Signet (Ch. 3/5), Wishbringer (Ch. 3), Blood of the Beast (Ch. 3), Howling Wind (Ch. 3), Immortal Soul (Ch. 5), Sacred Beast (Ch. 5), Higher Power / The End (Ch. 5 / post-Bestiary). [verified: 2 sources]

**Recommended loadout for the encounter:** Selene Guard (Shell) on the healer, Healing Light (Full-Cure/Curaga) on the second support, Hour of Need or Protection Halo (Def/MDef) on the Dark Knight.

### 4.6 Accessories

Realistically ownable at this point [verified: 2 sources]:

| Accessory | Effect | Where |
|---|---|---|
| **Ribbon** | **Guards against ALL status ailments** | **This dungeon** — plate puzzle in the Restricted Area (Ch. 2/3/5). Also unlocks the "Treasure Hunter" trophy. |
| **Pearl Necklace** | Guards against Curse; Def +4, MDef +4 | **This dungeon** (Ch. 2); also Thunder Plains South (Ch. 2); buy Ch. 1/2 |
| **Glass Buckle** | Guards against Poison and Sleep; Def +8, MDef +8 | **This dungeon** (Ch. 2) |
| **Gris-Gris Bag** | Guards against Curse; Def +4, MDef +4 | **Bahamut's own drop** |
| **Favorite Outfit** | Guards against Itchy; Eva +10, Luck +10 | Mushroom Rock Road (Ch. 1) |
| **Star Pendant** | Guards against Poison; Def +4, MDef +4 | Buy on the *Celsius*, all chapters, 4,000 gil |
| **Mythril Gloves** | **Defense +20** | Buy Ch. 1/2, 1,000 gil |
| **Sword Lore** | Use learned Warrior abilities in any dressphere; **Str +12** | — |
| **Arcane Lore** | Use learned Dark Knight abilities in any dressphere; **Mag +12** | — |
| **White Lore** | Use learned White Mage abilities in any dressphere; **Mag +12** | — |
| **Black Lore** | Use learned Black Mage abilities in any dressphere; **Mag +12** | — |

> **Sword Lore and Arcane Lore are the power picks**: Sword Lore lets a non-Warrior throw Breaks; Arcane Lore lets a non-Dark-Knight use **Darkness**. Together they collapse the "correct" party into far more flexible shapes.

**Not available:** Speed Bracer (Via Infinito 40), Cat Nip (late), Invincible (Ch. 5), Enterprise, Iron Duke, Tetra Band, Diamond Gloves (Ch. 3+), Hyper Wrist (Ch. 5), Tarot Card / Amulet / Wristband (Ch. 3+). [verified: 2 sources]

### 4.7 Item inventory and gil

No source records a canonical inventory snapshot; the following is a defensible Chapter 2 baseline. **All [estimate].**

| Item | Typical count | Rationale |
|---|---|---|
| Potion | 40–99 | Cheap, constantly dropped; Alchemist Mix fodder |
| Hi-Potion | 15–30 | Mix partner for Mega-Potion |
| Phoenix Down | 15–25 | The Bevelle Underground alone yields ×5 in Ch. 2 |
| Ether | 8–15 | Bevelle Underground yields ×4 in Ch. 2 |
| Remedy | 6–12 | Bevelle Underground yields ×4 in Ch. 2; cures Curse |
| Holy Water | 3–8 | Cures Curse |
| Antidote / Eye Drops / Echo Screen / Soft | 5–20 each | Shop staples; all wasted on this boss |
| Lunar Curtain | 2–6 | Grants **Shell** — directly useful |
| Light Curtain | 2–6 | Grants Protect |
| **Silver Hourglass** | 0–3 | **Inflicts Slow — the best item here**, but only stealable from Oversouled Haizhe, so likely absent |
| Gold Hourglass | 0–2 | Inert (Delay-immune) |
| Gil | **5,000–20,000** | Chapter 2; the Underground alone gives 500 gil in Ch. 2 and Bahamut awards 1,000 |

Confirmed Chapter 2 Bevelle Underground treasure (deterministic, **all obtainable before the boss**) [verified: 2 sources]: 500 gil, Glass Buckle, Pearl Necklace, **Ribbon** (plate puzzle), Ether ×4, Remedy ×4, **Downtrodder** Garment Grid, Phoenix Down ×5, Hi-Potion, **Dark Knight dressphere** (lift puzzle).

---

## 5. Scene context and beat sheet

### 5.1 Setting — Bevelle Underground

A hidden complex beneath Bevelle Temple with **no known official entrance**; the Gullwings get in by jumping through the gaping hole in the **Chamber of the Fayth** — the same chamber where, two years earlier, Yuna prayed to Bahamut's fayth and received the aeon. That irony is load-bearing for the whole encounter.

The complex is an **ancient, expansive armoury** left from Bevelle's Machina War against Zanarkand a thousand years ago, **littered with Yevon's insignia** despite Yevon's own public ban on machina. It served as the **hangar for Vegnagun** and houses a machina-operated prison called the **Gaol**. Later, the same depths connect to the Via Infinito. [verified: 2 sources]

Sub-areas, in traversal order: **Restricted Area** → **Labyrinth** → **Gaol** → **Limbo** (Vegnagun's chamber). [verified: 2 sources]

Dungeon music: "Bevelle's Secret" and "The Bevelle Underground." [single source]

### 5.2 Political backdrop

- Two years into the **Eternal Calm**. Spira has fractured into **New Yevon** (Baralai, praetor — "one thing at a time"), the **Youth League** (Nooj), and the **Machine Faction** (Gippal). The three men are ex-**Crimson Squad** comrades, along with Paine.
- The Gullwings learn of Vegnagun's existence **from the Leblanc Syndicate**, and the two rival sphere-hunting crews **infiltrate Bevelle together** — an uneasy alliance that supplies the scene's comic relief.
- **Shuyin**, a thousand-year-old shade of despair born of a man shot dead beside his lover **Lenne** while trying to seize Vegnagun, has been latent inside **Nooj** since the Den of Woe. He drove Nooj to steal Vegnagun; Nooj's own conflicted will made the machina flee and burrow toward the Farplane.
- **Shuyin can possess fayth and turn their aeons against Spira.** Bahamut is the first aeon to fall. [verified: 2 sources]

### 5.3 Numbered beat sheet

Tone legend: **[dread]** **[grief]** **[levity]** **[resolve]**

| # | Beat | Speakers | Tone |
|---|---|---|---|
| 1 | The Gullwings and the Leblanc Syndicate infiltrate Bevelle and drop through the hole in the Chamber of the Fayth into the Underground. | YRP, Leblanc, Logos, Ormi | [dread] |
| 2 | Descent through the Restricted Area, Labyrinth and Gaol — machina wreckage, Yevon insignia, security towers. The party solves the lift puzzle and finds the **Dark Knight dressphere**; the plate puzzle yields the **Ribbon**. | — | [dread] |
| 3 | **Baralai** confronts them to stop anyone reaching Vegnagun. **Paine fights him alone.** Baralai flees after losing. (Boss: Baralai, 3,380 HP.) | Baralai, Paine | [dread] |
| 4 | The party pushes into **Limbo** and reaches Vegnagun's chamber. An enormous shape stirs. | — | [dread] |
| 5 | **Rikku recognises it first** — *"It's an aeon."* Blunt, shocked, no flourish. | Rikku | [dread] |
| 6 | **Yuna tries to reason with it.** She calls out to Bahamut — *"You must stop!"* — as if it could still hear her. It does not answer. This is the emotional centre of the encounter: Yuna attempting to talk down the aeon she personally summoned. | Yuna | [grief] |
| 7 | **Paine cuts through the hesitation.** *"Fight! You have to!"* Pragmatic, almost harsh — she's giving Yuna permission. | Paine | [resolve] |
| 8 | **BATTLE — Bahamut.** "Yuna's Ballad" plays instead of a boss theme. | — | [grief] |
| 9 | Bahamut falls. **The party does not perform a victory pose** — uniquely suppressed for this fight. | — | [grief] |
| 10 | They turn to Vegnagun's chamber and find it **empty** — just a vast, freshly-torn hole in the floor where the weapon burrowed away. Yuna: *"This isn't how it was supposed to be."* | Yuna | [dread] |
| 11 | **Leblanc breaks the silence with a joke** — Vegnagun must have run off when it heard *she* was coming. She orders **Logos and Ormi** to record everything. | Leblanc, Logos, Ormi | [levity] |
| 12 | Yuna voices the real stakes: *"The Eternal Calm... I can feel it crumbling."* | Yuna | [dread] |
| 13 | **Brother** contacts them and orders the Gullwings back to the *Celsius*. Chapter 2 ends. | Brother | [dread] |

> **NO FAYTH SCENE HERE.** Brief item C3 corrected. The Bahamut fayth does not appear, thank Yuna, or apologise at this point. That scene is **Chapter 5, Farplane Abyss, after Dark Anima**, where the fayth explains that he and the other fayth **were not strong enough to overcome the darkness**, and separately characterises Shuyin as a shade that only wants to vanish but cannot. Bahamut's fayth appears a final time at the **Farplane Glen** after Shuyin's defeat to offer Yuna the choice to bring Tidus back. **If Pyrefly Reprise wants a fayth beat attached to this encounter, it is an original addition, not a recreation.** [verified: 2 sources]

### 5.4 Music

- **Battle theme: "Yuna's Ballad"** (ユウナのバラード), by Noriko Matsueda and Takahito Eguchi. Disc 2, track 11 of the OST.
- Explicitly **not** the standard X-2 boss theme. Bahamut is *"the only aeon with a different battle theme."*
- Character: **emotional and sorrowful**, a second Yuna leitmotif deliberately reminiscent of her FFX theme. It otherwise plays in moments when Yuna is thinking about Tidus.
- **Mood direction for Pyrefly Reprise:** this fight should not sound triumphant or adrenal. The music frames Bahamut's death as a **loss Yuna is inflicting on herself**, not a victory. Sparse, elegiac, string- and piano-forward; restrained percussion; no heroic brass. The suppressed victory pose (beat 9) is the same instruction expressed mechanically — **do not let the player celebrate.**
[verified: 2 sources]

---

## 6. Visual direction for sprite artists

### 6.1 Bahamut

**Base design** (FFX aeon, designer **Tetsu Tsukamoto**, carried into X-2) [verified: 2 sources]:
- A **large black dragon with enormous red wings.**
- Can stand and move **either bipedally or quadrupedally** — a key animation note: he is not a pure wyvern silhouette. Upright stance for casting/countdown, dropping to all fours for physical lunges, reads well and is canon-supported.
- Heavily armoured, plated body; long tail.
- His seal/symbol is shared with Bevelle and is annotated with the kanji for **light** (光, *hikari*) — a usable motif for the arena floor or a summoning circle, and a pointed irony given the corruption.
- In FFX his victory pose is **crossing his arms** — a characterful idle for an upright stance.

**Corruption — verification status.** The brief asks whether the X-2 Bahamut is black-purple tinged. Here is exactly what the sources support and what they do not:

| Claim | Status |
|---|---|
| The X-2 Bevelle Bahamut is narratively a **corrupted / possessed** aeon ("**Dark Bahamut** is brought to life", "one of the many aeons to fall to Shuyin's dark influence") | [verified: 2 sources] |
| The wiki's article for the X-2 boss uses the image file **`Dark Bahamut.png`**, and the X-2 Anima article likewise uses `Dark Anima.png` | [single source] |
| The X-2 model is a **recoloured / desaturated / purple-tinged** variant rather than the stock FFX aeon model | **[UNVERIFIED]** — no accessible source states this, and the shared filename is weak evidence because it is also the FFX *Dark Aeon* Bahamut's image, so it may simply be asset reuse on the wiki |

**Recommendation:** lean into the corruption, because the narrative framing unambiguously supports it and the tonal design of the whole encounter (sorrowful theme, suppressed victory pose) demands the creature read as *wrong*. Proposed treatment, flagged as **interpretive**:
- Keep the canonical black body and **red** wing membranes as the base read so he is instantly recognisable as Yuna's Bahamut.
- Overlay a **violet/indigo rim-light and subsurface glow** in the plate seams, wing veins and throat, rather than recolouring the whole body — corruption as something *inside* him.
- Trailing **pyreflies** in cold violet-white (X-2's pyreflies are the visual grammar for possession, memory and unrest throughout the game).
- Eyes: blown-out pale glow with no pupil detail — the "nobody is home" read that justifies Yuna's failed attempt to talk to him (beat 6).
- For **Mega Flare's** five-turn countdown: escalating charge VFX at the chest/maw over the five turns is the natural HD-2D read, and gives the countdown a second, non-numeric channel.

**Scale.** Aeons are vastly larger than human characters; Bahamut is the largest of the storyline aeons and is fought in a chamber built to garage **Vegnagun**, a colossal locust-shaped machina. For a billboard-sprite pipeline, size him so that a YRP sprite reaches roughly **knee-to-mid-thigh** height on a quadrupedal Bahamut and less on an upright one, with a wingspan that overruns the frame. [estimate — derived from setting, not a stated figure]

### 6.2 The chamber

**Vegnagun's Chamber / Limbo** — the arena. [verified: 2 sources; palette notes are interpretive]

- A **cathedral-scale machina hangar**, not a cave. Built to hold a weapon the size of a building; the emptiness after Bahamut dies is the point, so the space must read as *far too big for anything currently in it*.
- **Ancient military architecture** from the Machina War — a thousand-year-old armoury — **stamped with Yevon's insignia** throughout. Bevelle's hypocrisy is literally embossed on the walls: a machina arsenal decorated with the iconography of the religion that banned machina.
- A vast, raw **hole torn in the floor** where Vegnagun burrowed toward the Farplane. In the post-battle beat this is the whole composition.
- Contrast the surrounding dungeon: the **Restricted Area** has chains, suspended walkways and six activatable towers; the **Labyrinth** is a maze with gaps to cross; the **Gaol** is a machina-operated prison.

**Suggested palette** (interpretive, consistent with the above and with the HD-2D diorama brief):
- **Ground/architecture:** cold desaturated steels, gunmetal, oxidised bronze, dust-grey stone.
- **Machina accents:** dim amber and sodium-orange indicator lights, corroded copper piping, dormant conduits — the light of a dead facility that still has power.
- **Yevon insignia:** faded gilt/ivory inlay, deliberately at odds with the industrial surfaces.
- **Bahamut's corruption:** violet/indigo, the only saturated cool in the frame.
- **The hole:** the darkest value in the scene, with a faint Farplane-adjacent glow far below.
- Overall: **low ambient, high contrast**, lit from below and from scattered machina sources rather than any sky — a room that has not seen daylight in a thousand years.

---

## 7. Disambiguation — Fiend Arena Bahamut (DO NOT USE for this encounter)

Included solely so implementers do not pull the wrong numbers. Bestiary **#305**; Int./HD only; unlocked by completing Azi Dahaka's fiend tale (set up an L-sized pod in Bevelle in Chapter 5). [single source]

| Stat | Story (Bevelle, Ch. 2) | Fiend Arena (Ch. 5) |
|---|---|---|
| Level | 20 | 82 |
| HP | **8,400** | **124,000** |
| Strength | 71 | 224 |
| Magic | 86 | 157 |
| Defense | 160 | 152 |
| Magic Defense | **10** | **175** |
| Agility | 86 | 121 |
| Accuracy | — | 153 |
| Evasion | — | 1 |
| Luck | 3 | 16 |
| EXP / AP / Gil | 1,300 / 15 / 1,000 | 2,500 / 1 / 2,000 |
| Common / rare drop | Gris-Gris Bag / Gris-Gris Bag | Tetra Guard / **Ribbon** |
| Common / rare steal | Mute Shock / Mute Shock | Tetra Band / Tetra Gloves |
| Slow | **Vulnerable** | **Immune** |
| Stat mods (Breaks) | **All vulnerable** | **All immune** |
| Zantetsu resist | 100 | 200 |
| Abilities | Curse, Impulse, Mega Flare | Black Sky, Curse Attack, Fireworks, Impulse, Kill Attack, Mega Flare, Quick Attack, Shin-Zantetsu, Stop Attack, Triple Shock |
| AI | Fixed 12-turn loop | Action-Count thresholds with 1/4 random branches |

Arena AI, for completeness — a fundamentally different architecture (counter-based, randomised):

```
Action Count 0-36
  1/4 Fireworks | 1/4 Stop Attack (random) | 1/4 Triple Shock (random) | 1/4 Curse Attack (random)
Action Count 37-76
  1/4 Quick Attack (random) | 1/4 Impulse | 1/4 Fireworks | 1/4 Shin-Zantetsu
Action Count 77-119
  1/4 Normal Attack (random) | 1/4 Kill Attack (random) | 1/4 Impulse | 1/4 Black Sky
Action Count 120+
  Mega Flare, reset Action Count to 0

Counter-Attack Pattern:
  When he performs any attack, raise Action Count by 3
  When he is attacked,       raise Action Count by 5
```

---

## 8. Open questions / gaps

> **Gap-fill pass — items 1–6 are now CLOSED.** Item 6 (the missing general damage formula) was the keystone: the full 20-step FFX-2 damage pipeline is transcribed in the sibling document `D:/Final Fantasy/research/ffx2-combat-core.md` §2.1–2.3, sourced from SinirothX's *Enemy Encyclopedia* extracted game data. With the pipeline in hand, items 1–5 fall out of it plus one new independent bestiary source (Jegged.com). The closures are recorded below for audit; the working values live in §1.1, §1.3, §1.5, §1.6 and §2.3.

| # | Original gap | Status | Resolution | Confidence |
|---|---|---|---|---|
| 1 | Mega Flare has no formula or base power | **CLOSED** | Full magic pipeline + damage constant **C = 24** solved against two independent damage observations. Yields 614–1,165 by target MDef. §2.3 | formula [verified: 2 sources]; C [estimate] |
| 2 | Accuracy / Evasion unrecorded | **CLOSED** | **Eva 0** (Jegged explicit + Fandom); **Acc absent → implement 0**. The old ≈110 guess was wrong — it clamps every hit to 100% and contradicts "evadable". §1.1 | Eva [verified: 2 sources]; Acc [estimate] |
| 3 | Stat-Down linear vs. compounding | **CLOSED — question was mis-framed** | Breaks never touch the stat. They set a 0–10 level used as a **damage multiplier** `(12±n)/12`. Def stays 160; incoming physicals ×1.833 at cap. §1.5 | [verified: 2 sources] |
| 4 | Shell × Impulse interaction | **CLOSED** | Fractional is just a base-number *type* at step 1; Shell is step 16 and applies to everything Shell-reducible. Clean ×0.5 → **18.75%** of current HP. §2.3 | [verified: 2 sources] |
| 5 | `steal rate = 128` scale unknown | **CLOSED** | **/255**, split 87.5% common / 12.5% rare. Reconstructs Jegged's published 43.9% / 6.3% / 87.5% / 12.5% to the decimal. §1.6 | [verified: 2 sources] |
| 6 | No general FFX-2 damage formula | **CLOSED** | SinirothX 20-step flowchart, via `ffx2-combat-core.md` §2.1. Physical, magic, special-magic, fractional and multiple base types all published. | [verified: 2 sources] |
| — | *(new)* Bahamut's normal Attack had no damage value | **CLOSED** | Physical pipeline + Lv 20 / Str 71 → base 197.2, **115–200** vs. a Lv 24 party. §2.3 | formula [verified: 2 sources]; C = 16 [estimate] |
| — | *(new)* Holy weakness conflict | **CLOSED** | Jegged explicitly prints "Holy: Normal" in a fully-populated element table. 2 data sources vs. 1 guide. **No weakness.** §1.3 | [verified: 2 sources] |

**Residual uncertainty that remains after this pass** — three constants, all isolated and all named in code:

| Constant | Value | Why it is still [estimate] | Blast radius if wrong |
|---|---|---|---|
| `MEGA_FLARE_CONSTANT` | **24** | Solved from anecdotal damage reports, not read from game data. Band 22–26. | Scales Mega Flare linearly in `C²`. Retune in one place. |
| `BAHAMUT_ATTACK_CONSTANT` | **16** | No source publishes constants for enemy basic attacks. | Turns 2–4 only; they are filler either way. |
| `ENEMY_MULTI_TARGET_MAGIC_IS_HALVED` | **false** | Step 15 is stated as scoped to player Black/White Magic; not explicitly tested for enemy abilities. | If true, `C` becomes 34 and **final damage is unchanged**. |

A decompile of the FFX-2 ability constant table would close all three. SinirothX's ability-constant section was **never completed**, so this is unlikely to be closed by any existing public document.
**Still open (non-blocking, all cosmetic or flavour):**

7. **Whether the X-2 Bahamut model is visually recoloured** vs. reusing the stock FFX aeon model. Narrative corruption is certain; the art treatment is not. *(Art direction, not mechanics — §6.1 gives an interpretive treatment.)*
8. **The on-screen countdown string** in the English release is unrecorded. Use a numeric badge; do not invent canon.
9. **Bribe behaviour** is unflagged in Bahamut's data (Anima explicitly sets `bribe = Immune`; Bahamut does not). If bribe is live, the §2.3 Lady Luck formula `bribeNum = (GilUsed × 256 / (fiendMaxHP × 5)) − 64` implies a guaranteed bribe at ≈ **8,400 × 6.25 = 52,500 gil**, far beyond a Chapter 2 wallet (§4.7: 5,000–20,000). **Moot in practice — Lady Luck is a Chapter 3 dressphere anyway.** [derived]
10. **Bahamut's Luck = 3** is still [single source] (Jegged omits Luck). It only feeds the crit check; against party Luck 10–26 it means **Bahamut essentially never crits**, which is the safe direction to be wrong in.
11. **Blocked sources.** GameFAQs (403) and the Final Fantasy Wiki (402 on both page and MediaWiki API) refused automated retrieval during this pass. **Jegged.com and GamerGuides were reachable** and supplied the new data. The remaining [single source] items (Luck 3, Zantetsu 100, the Delay-immunity flag, the Fiend Arena block) would likely reach [verified: 2 sources] with manual access to GameFAQs' SinirothX *Enemy Encyclopedia*.

---

## Sources

- Bahamut (*Final Fantasy X-2*) — stats, AI script, battle, strategy, Fiend Arena variant: https://finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X-2)
- Bevelle Underground — chapters, story, treasures, enemies, areas, music: https://finalfantasy.fandom.com/wiki/Bevelle_Underground
- Bahamut (*Final Fantasy X*) — design, X-2 story role, fayth scenes, Break Damage Limit note: https://finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X)
- *Final Fantasy X-2* enemy abilities — Impulse, Mega Flare, Curse definitions: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities
- Curse (*Final Fantasy X-2* status): https://finalfantasy.fandom.com/wiki/Curse_(Final_Fantasy_X-2_status)
- Countdown (ability) — X-2 five-turn Mega Flare countdown: https://finalfantasy.fandom.com/wiki/Countdown_(ability)
- Oversoul (*Final Fantasy X-2*): https://finalfantasy.fandom.com/wiki/Oversoul_(Final_Fantasy_X-2)
- *Final Fantasy X-2* elements — weakness is ×2.0, affinity system: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_elements
- Shell (*Final Fantasy X-2* status): https://finalfantasy.fandom.com/wiki/Shell_(Final_Fantasy_X-2_status)
- Protect (*Final Fantasy X-2* status): https://finalfantasy.fandom.com/wiki/Protect_(Final_Fantasy_X-2_status)
- Slow (*Final Fantasy X-2* status) — half ATB fill rate: https://finalfantasy.fandom.com/wiki/Slow_(Final_Fantasy_X-2_status)
- STR Down (*Final Fantasy X-2*) — −1/12, 10 stacks: https://finalfantasy.fandom.com/wiki/STR_Down_(Final_Fantasy_X-2)
- DEF Down (*Final Fantasy X-2*): https://finalfantasy.fandom.com/wiki/DEF_Down_(Final_Fantasy_X-2)
- Dressphere — acquisition chapter/location for all dresspheres: https://finalfantasy.fandom.com/wiki/Dressphere
- Dark Knight (*Final Fantasy X-2*) — stat table, abilities, acquisition: https://finalfantasy.fandom.com/wiki/Dark_Knight_(Final_Fantasy_X-2)
- Warrior (*Final Fantasy X-2*) — stat table, Sentinel/Assault: https://finalfantasy.fandom.com/wiki/Warrior_(Final_Fantasy_X-2)
- Gunner (*Final Fantasy X-2*) — stat table, Trigger Happy tiers: https://finalfantasy.fandom.com/wiki/Gunner_(Final_Fantasy_X-2)
- Thief (*Final Fantasy X-2*) — stat table, double attack: https://finalfantasy.fandom.com/wiki/Thief_(Final_Fantasy_X-2)
- White Mage (*Final Fantasy X-2*) — stat table: https://finalfantasy.fandom.com/wiki/White_Mage_(Final_Fantasy_X-2)
- Black Mage (*Final Fantasy X-2*) — stat table: https://finalfantasy.fandom.com/wiki/Black_Mage_(Final_Fantasy_X-2)
- Alchemist (*Final Fantasy X-2*) — stat table, Mix/Stash: https://finalfantasy.fandom.com/wiki/Alchemist_(Final_Fantasy_X-2)
- Gun Mage — stat table: https://finalfantasy.fandom.com/wiki/Gun_Mage
- Songstress — stat table: https://finalfantasy.fandom.com/wiki/Songstress
- Berserker (*Final Fantasy X-2*) — stat table, Ch. 3 acquisition: https://finalfantasy.fandom.com/wiki/Berserker_(Final_Fantasy_X-2)
- Swordplay (*Final Fantasy X-2*) — Break AP/MP costs and stack counts: https://finalfantasy.fandom.com/wiki/Swordplay_(Final_Fantasy_X-2)
- Arcana (*Final Fantasy X-2*) — Dark Knight spell list: https://finalfantasy.fandom.com/wiki/Arcana_(Final_Fantasy_X-2)
- Gunplay — full Gunner ability table incl. Cheap Shot, Table-turner, On the Level: https://finalfantasy.fandom.com/wiki/Gunplay
- White Magic (*Final Fantasy X-2*) — spell MP/AP costs and sources: https://finalfantasy.fandom.com/wiki/White_Magic_(Final_Fantasy_X-2)
- Darkness (Dark Knight ability) — X-2: 12.5% max HP, ignores Defense: https://finalfantasy.fandom.com/wiki/Darkness_(Dark_Knight_ability)
- Trigger Happy (Yuna ability) — shot power, Lv.2/Lv.3 windows, Cat Nip: https://finalfantasy.fandom.com/wiki/Trigger_Happy_(Yuna_ability)
- Garment Grid — full list with acquisition chapter/location: https://finalfantasy.fandom.com/wiki/Garment_Grid
- *Final Fantasy X-2* accessories — Ribbon, Gris-Gris Bag, Mute Shock, Lore accessories: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_accessories
- *Final Fantasy X-2* items: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_items
- Silver Hourglass — X-2 inflicts Slow: https://finalfantasy.fandom.com/wiki/Silver_Hourglass
- Gold Hourglass — X-2 delays all enemies: https://finalfantasy.fandom.com/wiki/Gold_Hourglass
- Break Damage Limit — X-2 sources are all Chapter 5: https://finalfantasy.fandom.com/wiki/Break_Damage_Limit
- Yuna's Ballad — battle theme for the Bahamut fight: https://finalfantasy.fandom.com/wiki/Yuna%27s_Ballad
- Yuna (*Final Fantasy X-2* party member) — EXP curves, dressphere-driven stats: https://finalfantasy.fandom.com/wiki/Yuna_(Final_Fantasy_X-2_party_member)
- Shuyin — possession of fayth/aeons, nature as a shade: https://finalfantasy.fandom.com/wiki/Shuyin
- Vegnagun — design, story, burrowing to the Farplane: https://finalfantasy.fandom.com/wiki/Vegnagun
- Bevelle — Machina War history, Bevelle Underground description, Yevon insignia: https://finalfantasy.fandom.com/wiki/Bevelle
- Aeon (*Final Fantasy X*) — aeon/fayth relationship, X-2 aeon list: https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)
- Anima (*Final Fantasy X-2*) — comparison stat block establishing template-omission methodology: https://finalfantasy.fandom.com/wiki/Anima_(Final_Fantasy_X-2)
- Dark Bahamut (*Final Fantasy X*) — disambiguation, "Heretic Bahamut": https://finalfantasy.fandom.com/wiki/Dark_Bahamut_(Final_Fantasy_X)
- Fayth/Dialogue — confirms the Bevelle fayth dialogue is FFX, not X-2: https://finalfantasy.fandom.com/wiki/Fayth/Dialogue
- FFX-2 script transcript, Chapter 2 Bevelle — scene beats and speaker order: https://ffx2-script.livejournal.com/8904.html
- FFExodus FFX-2 walkthrough, Chapter 2 Bevelle — Bahamut 8,400 HP / 1,300 EXP / 15 AP / 1,000 gil; Baralai 3,380 HP; Precepts Guard 3,680 HP: http://www.ffexodus.com/ffx2/walkthrough22.php
- GameFAQs, *Final Fantasy X / X-2 HD Remaster* — Bevelle Ch. 2 Finale walkthrough (Mega Flare ~1,000 party-wide observation; accessed via search summary, direct fetch blocked): https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/81757/bevelle-ch-2-finale
- Gamer Guides, *Final Fantasy X-2 HD Remaster* — Chapter 2 Bevelle walkthrough: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-2/bevelle
- StrategyWiki, *Final Fantasy X-2* Chapter 3 Bevelle — corroborates the Ch. 3 Bevelle boss is not Bahamut (fetch blocked; via search summary): https://strategywiki.org/wiki/Final_Fantasy_X-2/Chapter_3/Bevelle
- GameFAQs, *Final Fantasy X-2* — Enemy Encyclopedia by SinirothX (identified, not retrievable; recommended manual follow-up): https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807
- GameFAQs, *Final Fantasy X-2* — Ability Damage Formulas board thread (identified, not retrievable; recommended manual follow-up): https://gamefaqs.gamespot.com/boards/562386-final-fantasy-x-2/76204402
- GamerGuides, *Final Fantasy X-2* — "Hunting for Vegnagun" (Chapter 2) Dark Bahamut boss page, independent of the Fandom/ffexodus source family — HP 8,400, MP 9,999, EXP/AP/Gil rewards, Gravity immunity, Gris-Gris Bag drops, Mute Shock steal, 12-action AI script, Impulse 3/8, Mega Flare 500-1,000, and a conflicting "Elemental Weakness: Holy" claim (see CONFLICT note in §1.3): https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-2/hunting-for-vegnagun/boss-dark-bahamut
- GamerGuides, *Final Fantasy X-2* — Dark Knight dressphere page, independent corroboration of Darkness (1/8 max HP cost, hits all enemies, ignores Defense): https://www.gamerguides.com/final-fantasy-x-2/guide/extras/dresspheres/dark-knight
- GamerGuides, *Final Fantasy X-2* — Gunner dressphere page, independent corroboration of On the Level's damage formula (user's Lv. × 16): https://www.gamerguides.com/final-fantasy-x-2/guide/extras/dresspheres/gunner
- StrategyWiki, *Final Fantasy X-2* Chapter 3 Macalania Woods — independent confirmation the Berserker dressphere is obtained in Chapter 3 at Lake Macalania, not Chapter 2: https://strategywiki.org/wiki/Final_Fantasy_X-2/Chapter_3/Macalania_Woods
- EIP.gg database — Silver Hourglass entry (combined FFX/X-2 item text; does not cleanly separate per-game behavior, referenced in Verification log for the "single enemy" claim): https://eip.gg/ffx-x2/db/silver-hourglass/
- GameFAQs community board discussion (search-summary only, direct fetch blocked) — general corroboration of the Fiend Arena Bahamut having "over 100,000 HP": https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/68959002

**Added in the gap-fill pass (Accuracy/Evasion, Holy conflict, steal-rate scale, Mega Flare, normal Attack, Break stacking):**

- **Jegged.com, *Final Fantasy X-2* Bestiary — Bahamut.** The decisive new source for this pass. Independent, fully-populated enemy data table: confirms Lv 20 / HP 8,400 / MP 9,999 / Str 71 / Def 160 / Mag 86 / MDef 10 / Agi 86; adds **Evasion 0** (absent from the Fandom template); explicitly prints **"Holy: Normal"** alongside "Gravity: Immune", resolving the §1.3 conflict; and publishes the drop/steal percentages (common drop 87.5%, rare drop 12.5%, common steal 43.9%, rare steal 6.3%) that fix the §1.6 steal-rate scale at **/255** with an 87.5/12.5 slot split: https://www.jegged.com/Games/Final-Fantasy-X-2/Bestiary/Bahamut.html
- **`D:/Final Fantasy/research/ffx2-combat-core.md` §2.1–2.7 (sibling research document in this repository).** Source of the complete FFX-2 damage pipeline used to derive Mega Flare, Impulse-under-Shell, Bahamut's normal Attack and the corrected Break-stacking model. Transcribes SinirothX's *Enemy Encyclopedia* "Data Interpretation / Damage Mechanics Flowchart" (extracted game data), cross-checked there against the FF Wiki *Attack (command)* page and a third-party formula transcription. Specifically supplies: the 20-step damage flowchart (§2.1); the physical base `(Lv + Str) × Lv × Str / 1024 + Str`, magic base `Lv × 2 + Mag`, magic constant step `× C²/64`, physical constant step `× C/16`, linear Defense step `(270 − Def)/255`, randomiser `× rand(240..271)/256`, Shell/Protect at step 16; the ±1/12 stack-level Up/Down steps at 4 and 5 (§2.2, §2.8); the magic damage-constant ladder `Lv.1 = 12, Lv.2 = 24, Lv.3 = 42, Flare = 60, Ultima = 70, Holy = 100` (§3.6); the accuracy/evasion hit model and the note that enemy Accuracy is commonly 0 in SinirothX's data (§2.6); the element multiplier table, weak ×2 / resist ×0.5 / null ×0 (§2.7); and Table-turner's inverted Defense terms (§2.1 steps 3 and 5).
- GamerGuides, *Final Fantasy X-2* — Dark Bahamut boss page, re-fetched in this pass. Confirms its structured field set really does assert **"Weakness: Holy"** alongside "Resistance: None / Absorption: None / Immunity: Gravity", and restates Mega Flare as "500–1,000 magic damage to all". Recorded as the **outvoted** side of the §1.3 conflict, and used as the second damage observation for solving the Mega Flare constant: https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-2/hunting-for-vegnagun/boss-dark-bahamut
- Final Fantasy Wiki, *STR Down (Final Fantasy X-2)* and *DEF Down (Final Fantasy X-2)* — the "decreases the stat by 1/12" phrasing that produced this document's original (now superseded) stat-subtraction model; recorded as the losing side of the §1.5 conflict: https://finalfantasy.fandom.com/wiki/STR_Down_(Final_Fantasy_X-2) · https://finalfantasy.fandom.com/wiki/DEF_Down_(Final_Fantasy_X-2)
- GameFAQs board threads, *Ability Damage Formulas* (FFX-2) — the upstream discussions behind the flowchart transcription; still not directly retrievable (403), cited via `ffx2-combat-core.md`: https://gamefaqs.gamespot.com/boards/562386-final-fantasy-x-2/76204402 · https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/76205233
- Bear Ironfist, "FFX-2 Damage Formula" — independent third-party transcription of the physical / magic / magic-recovery / special-magic formulas and the quoted damage-constant values; the second source that lifts the base formulas to [verified: 2 sources] (cited via `ffx2-combat-core.md`): https://na.finalfantasyxiv.com/lodestone/character/4417600/blog/2916640

---

## Verification log

Fact-check pass performed against independent sources (primarily GamerGuides, StrategyWiki, EIP.gg, and GameFAQs board summaries) as a cross-check against the Fandom/ffexodus source family this document was originally built on.

| Claim | Verdict | Action taken |
|---|---|---|
| Bahamut HP 8,400 | Confirmed | Tag → [verified: 2 sources] (already tagged; GamerGuides source added) |
| Bahamut MP 9,999 | Confirmed | Tag upgraded to [verified: 2 sources] |
| Battle rewards: EXP 1,300 / AP 15 / Gil 1,000 | Confirmed | Tag → [verified: 2 sources] (already tagged; GamerGuides source added) |
| Immune to Gravity/fractional damage | Confirmed | Tag upgraded to [verified: 2 sources] |
| Common and rare drop both Gris-Gris Bag | Confirmed | Rare-drop tag upgraded to [verified: 2 sources] (common drop already tagged) |
| Steal item is Mute Shock (common + rare) | Confirmed | Both tags upgraded to [verified: 2 sources] |
| No elemental weakness (all five elements ×1.0) | Contradicted | GamerGuides independently lists "Elemental Weakness: Holy." Added a CONFLICT note in §1.3; kept the doc's "no weakness" as the implemented default (stronger, data-driven derivation) but flagged Holy as a real possibility pending decompile verification — per fact-checker's recommendation. |
| Fixed 12-action AI loop, no HP-threshold trigger | Confirmed | Already [verified: 2 sources]; GamerGuides source added |
| Impulse = 3/8 of current HP | Confirmed | Already [verified: 2 sources]; GamerGuides source added |
| Mega Flare ≈1,000 unmitigated / ≈500 under Shell | Confirmed | Tag upgraded to [verified: 2 sources, anecdotal] |
| Darkness costs 1/8 max HP, hits all enemies, ignores Defense | Confirmed | Already [verified: 2 sources]; GamerGuides source added |
| Stat-Down: −1/12 per stack, 10-stack cap | Unverifiable | No independent second source found; left as [single source] |
| Gunner "On the Level" = user's level × 16 | Confirmed | Both occurrences upgraded to [verified: 2 sources] |
| Berserker acquired Ch. 3 Lake Macalania, not Ch. 2 | Confirmed | Already [verified: 2 sources]; StrategyWiki/GameFAQs source added |
| Bahamut (Bevelle) is the Chapter 2 final boss, not Ch. 3 | Confirmed | Already [verified: 2 sources] |
| Bahamut (Bevelle) is Level 20 | Unverifiable | A Lv.26 figure in one aggregated search summary was judged a cross-game mix-up with FFX's Dark Aeon Bahamut, not a genuine contradiction; no change made |
| Core combat stats (Str 71 / Mag 86 / Def 160 / MDef 10 / Agi 86 / Luck 3) | Unverifiable | No independent full stat table found; left as [single source] |
| Silver Hourglass hits a single enemy with Slow | Unverifiable | EIP.gg conflates FFX/X-2 behavior and describes an all-enemies effect; not a clean contradiction of the X-2-specific claim, so left as-is, source noted in Sources |
| Bahamut is Delay-immune (Gold Hourglass inert) | Unverifiable | No independent source found; left as [verified: 2 sources] per existing doc claim (Gold Hourglass's general effect is independently confirmed, but Bahamut's specific immunity flag is not) |
| Zantetsu resistance = 100 (Bevelle) vs. 110 (Anima) vs. 200 (Fiend Arena) | Unverifiable | No independent source found; left as [single source] |
| Fiend Arena Bahamut: 124,000 HP at Level 82 | Unverifiable | GameFAQs board summary only corroborates ">100,000 HP"; exact 124,000/Lv.82 not independently found; left as-is, source added to Sources |

### Gap-fill pass (second pass) — blocker and major gaps

Targets: Mega Flare's missing formula (blocker); Accuracy/Evasion, Break stacking, Shell×Impulse, steal-rate scale and the absent normal-attack constant (major); the Holy-weakness conflict (major). New evidence: **Jegged.com's independent FFX-2 bestiary** and the sibling document **`ffx2-combat-core.md`** (SinirothX extracted-data damage pipeline).

| Claim | Verdict | Action taken |
|---|---|---|
| Core stats Str 71 / Mag 86 / Def 160 / MDef 10 / Agi 86 | **Confirmed** | Jegged reproduces the full block independently → all five tags upgraded `[single source]` → **[verified: 2 sources]** in §1.1 |
| Evasion = 0 | **Confirmed** | Jegged lists it explicitly → §1.1 row changed from "not listed" to **0**, [verified: 2 sources] |
| Accuracy ≈ 110 (this doc's prior estimate) | **Contradicted** | Absent in *both* data sources; `ffx2-combat-core.md` §2.6 records Accuracy 0 as a normal FFX-2 enemy value. Acc 110 clamps the published hit model to 100% and contradicts the sourced "evadable" description. **Changed to 0**, with a per-dressphere hit-rate table |
| Holy is a weakness (GamerGuides) | **Contradicted — conflict resolved** | Jegged prints **"Holy: Normal"** in a table that populates *every* element and correctly marks Gravity Immune. Converts the Fandom omission argument into positive corroboration: **2 data sources vs. 1 guide.** §1.3 rewritten; ×1.0 confirmed; Excalibur/Holy Kogoro/Blessed Gem explicitly de-recommended |
| Stat-Down = linear stat reduction (Def 160 → 26.7) | **Contradicted** | The decompile-grade flowchart shows Breaks never modify the stat — they set a 0–10 level applied as `(12±n)/12` **at steps 4/5 of the damage pipeline**. Def stays 160. §1.5 fully rewritten; old capped-stat table deleted |
| Armor Break is "the biggest single lever in the fight" | **Contradicted** | Armor Break is ×1.833 on physicals — the weak route here. **Magic Break** (×0.167 on Mega Flare *and* Impulse) is the biggest lever. §1.4, §3.1 and §3.3 corrected; a priority-ordered Break table added |
| Mental Break is "marginal (MDef already 10)" | **Contradicted** | Flat ×1.833 multiplier, independent of base MDef. Re-rated "better than previously rated" in §3.3 |
| Shell halves Impulse → 3/16 of current HP | **Confirmed** | Fractional is a base-number *type* at step 1; Shell is step 16 and is not exempted. Upgraded `[estimate]` → **[verified: 2 sources]**. Also newly noted: Impulse is randomised ±5% (step 7) and is scaled by Magic Break |
| Steal rate byte 128 is on a /255 scale | **Confirmed** | Jegged's 43.9% / 6.3% / 87.5% / 12.5% reconstruct exactly as `128/255` split 87.5/12.5. Upgraded `[single source]` → **[verified: 2 sources]**; drop rates added |
| Mega Flare "≈1,000 flat" | **Superseded** | Replaced with the solved magic formula (`C = 24`, base `Lv×2+Mag = 126`) giving **614–1,165 scaled by target MDef**. The prior claim that a flat 1,000 "one-shots the White Mage" is **wrong** — MDef 132 makes her the most resistant dressphere; the **Alchemist** (MDef 11) and **Gunner** are the members who actually die. §2.3 and §2.4 rewritten |
| Bahamut's normal Attack has no damage value | **Closed** | Physical pipeline + Lv 20 / Str 71 → base **197.2**, **115–200** vs. a Lv 24 party. New subsection in §2.3, with a reverse cross-check (Lv 24 Warrior deals ~85 to Def 160) that independently reproduces §1.2's "physicals are near-worthless" thesis |
| Party wipes to Mega Flare without mitigation | **Newly derived** | The canonical party (Alchemist/Dark Knight/Warrior) is a **guaranteed full wipe** at turn 12 from post-Impulse HP. Shell alone converts this to a guaranteed survival — the numeric justification for its "Essential" rating. §2.4 |
