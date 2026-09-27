# FINAL FANTASY VII (1997) — Core Battle System, the slice the Guard Scorpion fight needs

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-27 ~00:35 EDT: "go with guard scorpion first, full speed ahead, but make it a hidden selectable encounter since it's experimental then tell me how to select it. dont make it so obvious on the encounter/chapter menu"
**Research date:** 2026-09-27
**Game case (AGENTS.md rule 14):** **FF7 only.** This is the original *Final Fantasy VII* (1997) battle system: ATB with a Turn Timer, Materia, a Limit gauge that fills from damage taken. None of it transfers to the FFX (CTB) or FFX-2 (ATB with charge and recovery times) chapters, and none of their rules transfer here. FF7 Remake / Rebirth are different games and are out of scope.
**Companion file:** `research/ff7-guard-scorpion.md` (the boss, its AI, the canon party, the arena).
**Scope:** everything a deterministic engine needs to run Cloud and Barret against the Guard Scorpion, plus the general rules around it (Cover, back attacks, rewards) so the engine does not have to be rewritten for the next FF7 fight. Rules the first fight cannot reach are marked so.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

| Tag | Meaning |
|---|---|
| `[verified: N sources]` | N independent sources agree. The Final Fantasy Wiki counts once however many of its pages say it. Wiki text that cites Fergusson as its own source is **not** counted as independent of Fergusson. |
| `[single source]` | Only one source says it. The source is named. |
| `[derived]` | Computed here from sourced constants with the formulas in this file. Reproducible; the inputs are named. |
| `[estimate]` | Our own judgement, not a measured fact. Say "our estimate" to Bailey. |
| `[unsourced]` | Nobody we could read says it. Do not build on it without a decision. |
| `[conflict]` | Sources disagree. Listed again in §15 with what we recommend. |

### 0.2 Primary sources, ranked

1. **Terence Fergusson, *The FF7 Battle Mechanics* v1.10** (GameFAQs FAQ 22395, updated 2009-06-29). Timers, Battle Speed, hit, critical and status formulas, the damage formulas and their modifier order, final checks, escaping. Written from memory dumps and the game code of the PC version; Fergusson states the key bugs apply to both the PC and PlayStation versions. **Rank 1; preferred on any conflict (Bailey prefers GameFAQs).**
2. **Terence Fergusson, *FF7 Party Mechanics*** (GameFAQs FAQ 36775, PC page). Starting stats, XP curve, Materia, spells, Limit gauge and Limit data, weapons, armour, battle items.
3. **Terence Fergusson, *The FF7 Enemy Mechanics* v1.11** (GameFAQs FAQ 31903, updated 2009-07-31). The data key used for enemies, AI script sections, item drop classes. Its Guard Scorpion entry is used in the companion file.
4. **Final Fantasy Wiki** (finalfantasy.fandom.com, read through `api.php?action=parse&prop=wikitext`; revision ids under Sources). ATB modes and the grace pause (not in Fergusson), the Limit gauge page, row, Defend, Cover, battle rewards, per-level stat tables.
5. **Gamer Corner Guides** (guides.gamercorner.net). Enemy stat dump with internal Defense values; a cross-check only.
6. **Earlier FF7 work on this PC:** the "Lifestream Encore" project at `D:\FF7` (2026-09-15/16, a separate repo), `docs/research/formulas.md`, `party.md`, `enemies.md`, `catalog.md`. Reused where it matches the primary sources; four errors found in it are listed in §15.2. It is never counted as an independent source, because it was built from the same three Fergusson guides.

### 0.3 What I did

1. Searched this PC for earlier FF7 work: found `D:\FF7` (Lifestream Encore, a Vite + Three.js FF7 encounter collection with five chapters, Guard Scorpion as chapter I). Read its research files for Guard Scorpion, the formulas and the party.
2. Read the three Fergusson guides in the built-in browser pane (WebFetch returns HTTP 403 on GameFAQs), section by section, into memory only. Nothing from them is saved in the repo beyond the facts and short attributed quotes below. Closed the tab afterwards.
3. Read the Final Fantasy Wiki pages listed under Sources through the MediaWiki parse API from the browser pane (plain fetches return HTTP 402).
4. Cross-checked the Guard Scorpion stat block with Gamer Corner (WebFetch works there) and the reactor walkthrough with Jegged.
5. Ran the formulas below in a scratch Node script to produce every `[derived]` number (script not committed; each number states its inputs).

### 0.4 Version

The PlayStation (1997, English) and PC (1998) versions share the battle tables Fergusson reads. He notes the Armour MDef bug and the Limit unlock table are identical on both `[single source: Fergusson BM §1.1, PM §3.1]`. Where the two differ in text (dialogue wording), the companion file says so.

---

## 1. Stats

### 1.1 Primary and derived stats `[verified: 2 sources — Fergusson BM §1.1; wiki "Final Fantasy VII battle system" §Stats]`

Seven primary stats: `Lvl, Str, Vit, Mag, Spr, Dex, Lck`. Derived stats:

```
Att = Str        + weapon Attack
At% =              weapon Attack%
Def = Vit        + armour Defense
Df% = [Dex / 4]  + armour Defense%
MAt = Mag
MDf = Spr        (+ armour MDefense: NOT applied, see bug)
MD% =              armour MDefense%
```

`[x]` means floor (integer truncation) everywhere in this file. FF7 is an integer engine: **use integer division at every step, in the order given**, or numbers drift by one.

**Bug, keep it:** armour MDefense is never added to MDf in battle, on PC or PlayStation `[single source: Fergusson BM §1.1]`. Irrelevant at the first fight (Bronze Bangle has no MDef), relevant later.

Equipment and Materia bonuses to primary stats (for example the Buster Sword's `Mag +2`) do flow into the derived stats `[single source: Fergusson BM §1.1]`.

### 1.2 Stat Modifier `[single source: Fergusson BM §3.1]`

`Att, Def, MAt, MDf, Df%, Dex` each carry a Stat Modifier, an integer percentage from -100 to +100, reset to 0 at battle start. Any formula reading the stat uses `Stat + [Modifier * Stat]`. Only Hero Drink and Dragon Force touch it; neither exists at the first fight.

### 1.3 Enemy stats `[single source: Fergusson EM §4.1]`

An enemy's listed Att, Def, Df%, MAt, MDf, Dex, Lck are already final (no Dex-to-Df% bonus). **Enemies have no MD% stat**, so a magical attack never takes the MD% miss check against them.

---

## 2. Time: the ATB

### 2.1 Battle Speed and Speed Value `[verified: 2 sources — Fergusson BM §2.1; wiki "Battle Speed" (cites Fergusson, so treat as 1.5)]`

The Config slider is a byte 0 (fastest) to 255 (slowest); **default 128**.

```
SpeedValue = [32768 / (120 + [BattleSpeed * 15 / 8])]
```

| Battle Speed | Speed Value | % of default |
|---|---|---|
| 0 | 273 | 300% |
| 32 | 182 | 200% |
| 64 | 136 | 149% |
| 96 | 109 | 120% |
| **128 (default)** | **91** | **100%** |
| 160 | 78 | 86% |
| 192 | 68 | 75% |
| 224 | 60 | 66% |
| 255 | 54 | 59% |

### 2.2 The four timers `[single source: Fergusson BM §2, §2.2 to §2.6]`

Every timer earns one **Unit** per 8,192 points. All advance once per **tick**.

| Timer | Per-tick increase | Battle Speed? | Haste / Slow / Stop / Death? | Paralysed / Petrify / Sleep? | Used for |
|---|---|---|---|---|---|
| Global | `SpeedValue` | yes | no | no | Stop's duration, escape checks |
| V-Timer (each combatant) | `2 * SpeedValue` | yes | yes (x2 / x0.5 / x0) | no | most status durations |
| C-Timer (each combatant) | 136 (the game uses 68 per 4,096; same rate) | **no** | yes | no | Death-sentence, Slow-numb |
| Turn Timer (each combatant) | see 2.3 | via V | via V | **halted** | the ATB gauge |

Default-speed rates for an average-Dex party member, no status: Global 91, V 182, Turn 182, C 136 per tick `[single source: Fergusson BM §2.6]`.

**Tick length in real time:** Fergusson defines the tick only relative to the timers. **`[unsourced]`.** The D:\FF7 research inferred 30 ticks per second on NTSC from observed turn lengths `[estimate]`. The engine should keep the tick as the unit and map ticks to seconds in one presentation constant, so a later measurement changes one number.

### 2.3 The Turn Timer (the ATB gauge) `[single source: Fergusson BM §2.5]`

At battle start the game fixes a **Normal Speed** from the **base** Dexterity of the battle party (no Sources, Materia or equipment), rounded up:

```
NormalSpeed = RU( sum(base Dex of party members) / partySize ) + 50
```

Per tick:

```
party member:  TurnTimer += [ (TotalDex + 50) * VTimerIncrease / NormalSpeed ]
enemy:         TurnTimer += [  Dex            * VTimerIncrease / NormalSpeed ]
```

- The gauge is **full at 65,535**. Taking a turn resets it to 0.
- `TotalDex` includes Sources, Materia and equipment; `NormalSpeed` does not.
- Enemies get no `+50`, which is why enemy Dex values look large. Fergusson's rule of thumb: an enemy's Dex should be read as 50 lower when compared with a party member's `[single source: Fergusson EM §4.1]`.
- Paralysed, Petrify and Sleep halt the Turn Timer only.

**Derived for the Guard Scorpion fight** (Battle Speed 128, so `VTimerIncrease = 182`; Cloud base Dex 9, Barret base Dex 10, the medians in the companion file §8; Guard Scorpion Dex 60) `[derived]`:

| Combatant | NormalSpeed | Increase per tick | Ticks per full gauge |
|---|---|---|---|
| Cloud | 60 | `[(9+50)*182/60]` = 178 | 369 |
| Barret | 60 | `[(10+50)*182/60]` = 182 | 361 |
| Guard Scorpion | 60 | `[60*182/60]` = 182 | 361 |

With the lowest base Dex in the level-7 / level-6 ranges (Cloud 7, Barret 6), NormalSpeed is 57 and the boss fills in 344 ticks against Cloud's 361 and Barret's 369. **The three act at nearly the same rate in every plausible roll;** the boss is at most about 7% faster `[derived]`.

### 2.4 Battle start `[single source: Fergusson BM §2.5]`

Every Turn Timer is first set to `Rnd(0..32767)` (0 to 50% full), then:

| Formation | Adjustment |
|---|---|
| Normal | Raise the highest Turn Timer to 57,344 (87.5%) and add the same amount to everyone. Everyone starts between 37.5% and 87.5%. |
| Pre-emptive / Side Attack | Enemies' timers divided by 8; every party member set to 65,534 (acts at once). |
| Back Attack / Ambush | As Normal but the highest goes to 61,440 (93.75%); then every party member is reset to 0. |
| Final 1-v-1 plot battle | Party 65,534, enemies 0. |

The Guard Scorpion battle is a fixed story formation (formation 324); the sources list no special formation for it, so it is a **Normal** start `[single source: wiki "Guard Scorpion (Final Fantasy VII)", formation 324 "(fixed)"]` `[estimate: Normal]`.

**Enemies choose and commit their action the instant their gauge fills**; party members act only once the player confirms a command `[single source: Fergusson BM §2.5]`.

### 2.5 Battle modes: Active, Recommended, Wait `[single source: wiki "Final Fantasy VII battle system" §Overview]`

Fergusson does not document these; the wiki does. **Recommended is the default.**

| Mode | Time stops |
|---|---|
| Active | only during Summon animations |
| Recommended (default) | during battle animations |
| Wait | during battle animations, **and** while the player targets or is in a sub-menu (Item, Magic, Summon lists) |

**The manual's wording** (Config, ATB, p. 29; read 2026-09-27, see Sources): Active, "Time lapses even while you are selecting commands such as Magic and Items"; Recommended, "Time stops while the screen effects are displayed when using Magic and Items"; Wait, "Time stops while you are selecting commands such as Magic and Items". It agrees with the table on the menus. On animations it is narrower than the wiki (Recommended names only Magic and Item effects) `[conflict: manual vs wiki on which animations hold Recommended]`; the engine follows the wiki's "battle animations" and lists this as open.

**Grace pause** (wiki footnote, Recommended and Wait): each turn, time pauses briefly after another action is queued or when a party member's gauge fills; the pause length depends on Battle Speed; it cannot be triggered by a member who was already full; Limit Breaks and counters do not update the pause trigger. **The pause length in ticks is `[unsourced]`.** Difficulty order per the wiki: Wait (easiest), Recommended, Active (hardest).

### 2.6 Queueing `[estimate]`

No source we read describes the action queue as an object. The engine model the D:\FF7 research proposed, and which matches every sourced rule above: one action resolves at a time; combatants whose gauge fills join a first-in first-out ready list; an enemy's action is chosen when its gauge fills; the Turn Timer resets when the action executes. Treat this as our model, not a sourced rule, and pin it in tests so it cannot drift.

### 2.7 Escaping `[single source: Fergusson BM §2.7]`

Holding the two run buttons: at the end of each Global Timer Unit, if more than half of that Unit was spent running, a Run Check lowers the encounter's Run Difficulty by 1 (always after a pre-emptive or side attack; otherwise 25% chance). The party escapes when it reaches 0. Most encounters start at 1. Escape spell and Smoke Bomb always work. Fleeing earns nothing and does not count Limit uses or kills.

**The Guard Scorpion battle cannot be escaped** `[single source: wiki Guard Scorpion page, "The party cannot escape"]`. (D:\FF7 `enemies.md` §1 says the same, citing Gamer Corner's encounter page, which I did not re-read.)

---

## 3. Hit, critical and status chance

### 3.1 Physical hit (PAt%) `[single source: Fergusson BM §3.3.1]`

Automatic Hit% = 255 if any of: back-attacking the target; the target has Death Weakness, Auto-Hit Weakness, Immunity or Absorb for the element; the target has Death, Sleep, Confusion, Stop, Petrify, Manipulate or Paralysed; the target is Covering someone. A landed hit cures Sleep, Confusion and Manipulate on the target. (A 255 At% weapon is not an automatic hit.)

Otherwise:

```
Hit% = [AttackerDex / 4] + At% + AttackerDf% - TargetDf%
if attacker has Fury: Hit% = Hit% - [Hit% * 3 / 10]
if Hit% < 1: Hit% = 1
```

For enemies, `At%` is the ability's PAt%.

Lucky Hit / Lucky Evade, one shared roll `R = Rnd(0..99)`: if `R < [AttackerLck / 4]`, Hit% = 255. Else, only when a non-party attacker targets a party member, if `R < [TargetLck / 4]`, Hit% = 0. Enemies never Lucky Evade.

Final roll: `Random = [Rnd(0..65535) * 99 / 65535] + 1`; the attack hits if `Random < Hit%`. A Hit% of 1 never lands; 101 almost always does.

### 3.2 Magical hit (MAt%) `[single source: Fergusson BM §3.3.2]`

Automatic hit if: MAt% is 255; element Death Weakness / Auto-Hit / Immune / Absorb; reflectable ability against Reflect; or the ability inflicts no status and the target has Death, Sleep, Confusion, Stop, Petrify or Paralysed. Otherwise:

```
if attacker has Fury: MAt% = MAt% - [MAt% * 3 / 10]
if Rnd(0..99) < TargetMD%: MISS          (enemies have no MD%)
Hit% = MAt% + AttackerLvl - [TargetLvl / 2] - 1
hit if Rnd(0..99) < Hit%
```

**Derived:** Cloud (Lv 7) casting Bolt (MAt% 100) at Guard Scorpion (Lv 12): `100 + 7 - 6 - 1 = 100` → **always hits** `[derived]`.

### 3.3 Critical hit (Physical formula only) `[single source: Fergusson BM §3.3.3]`

```
Crit% = [(AttackerLck + AttackerLvl - TargetLvl) / 4]   (+ weapon crit bonus for party members)
Random = [Rnd(0..65535) * 99 / 65535] + 1
critical if Random <= Crit%
```

Buster Sword and Gatling Gun have no crit bonus `[single source: Fergusson PM §4.1.1, §4.1.2]`. **Derived:** Cloud (Lck 15, Lv 7) vs Lv 12: `[10/4]` = 2%; Barret (Lck 17, Lv 6): `[11/4]` = 2%; Guard Scorpion (Lck 1, Lv 12) vs Cloud Lv 7: `[6/4]` = 1% `[derived]`.

### 3.4 Status chance `[single source: Fergusson BM §3.3.4]`

Checked before resistances. Automatic if the listed chance is 100% (and three special cases for Frog, Small, and Haste/Berserk/Shield on party members). Otherwise `chance = listed chance` (times MP Turbo, times 2/3 on a split multi-target, halved by Quadra Magic), then `chance - 1`, hits if `Rnd(0..99) < chance`. **Not reachable at the first fight:** no party ability there inflicts a status, and the Guard Scorpion is immune to almost everything (companion file §3).

---

## 4. Damage

### 4.1 Physical formula `[verified: 2 sources — Fergusson BM §3.4.1; reproduces Gamer Corner's printed Guard Scorpion base 41, see companion §4]`

```
Base   = Att + [(Att + Lvl) / 32] * [(Att * Lvl) / 32]
Damage = [(Power * (512 - Def) * Base) / (16 * 512)]
```

`Power` is an integer; **16 = 1x Base**. Guides print it as a fraction ("1 3/4x Base" = 28). Feed the integer, not the fraction. At `Def = 255` damage is about half of `Def = 0`.

### 4.2 Magical formula `[single source: Fergusson BM §3.4.2]`

```
Base   = 6 * (MAt + Lvl)
Damage = [(Power * (512 - MDf) * Base) / (16 * 512)]
```

### 4.3 Cure formula `[single source: Fergusson BM §3.4.3]`

```
Base   = 6 * (MAt + Lvl)
Damage = Base + 22 * Power          (listed as "Base + constant", e.g. Cure = Base + 110)
```

### 4.4 Item and other formulas `[single source: Fergusson BM §3.4.4, §3.4.5]`

- **Item:** `Damage = [16 * Power * (512 - Def) / 512]` (listings print `16 * Power`, for example Grenade 160). Only modifier: Random Variation. Magical items use MDf.
- **HP% / Max HP%:** `[TargetHP * Power / 32]` or the Max HP version. Only modifier: Quadra Magic.
- **Fixed:** `Power * 20` (listings print it multiplied: Potion 100). No modifiers.
- **Custom:** each ability defines its own; no Def, no variation, no modifiers.

### 4.5 Modifiers, strictly in this order `[single source: Fergusson BM §3.4.6]`

| # | Modifier | Applies to | Effect |
|---|---|---|---|
| 1 | Critical hit | Physical | x2 |
| 2 | Berserk on attacker | Physical | `[x 1.5]` |
| 3 | **Row check** | Physical | if attacker **or** target is in the back row and the ability is **not Long Range**: `[/ 2]` |
| 4 | **Defend on target** | Physical | target used Defend on its most recent turn: `[/ 2]` |
| 5 | Back-attacked target | Physical | `[x BackAttackMultiplier / 8]`; the multiplier is 16 (x2) for the party and almost all enemies |
| 6 | Frog on attacker | Physical | `[/ 4]` |
| 7 | Sadness on target | Physical, Magical | `- [x 3 / 10]` |
| 8 | **Split damage** / Quadra Magic | Physical, Magical, Cure (never HP%) | Quadra: `[/ 2]` and no split. Otherwise a multi-target hit: `[x 2 / 3]`. Physical and Cure always split on more than one target; Magical splits only if the ability can toggle between one and all targets |
| 9 | Barrier (physical) / MBarrier (magical) on target | Physical, Magical, Cure | `[/ 2]` |
| 10 | MP Turbo | Physical, Magical, Cure | `[x (10 + level) / 10]` |
| 11 | Mini on attacker | Physical | 0 |
| 12 | **Random Variation** | Physical, Magical, Cure, Item | `[x (3841 + Rnd(0..255)) / 4096]`, then if 0 → 1 |

The Magical formula uses only 7, 8, 9, 10, 12. The Cure formula uses 8, 9, 10, 12 (no Sadness). Random Variation makes the computed value the **maximum**; the minimum is `3841/4096` (about 93.8%) of it. It also guarantees at least 1 damage on anything that did not miss or meet an immunity.

Overflow bugs exist past about 262,144 predicted damage; unreachable at the first fight `[single source: Fergusson BM §3.4.1, §3.4.6]`.

### 4.6 Final checks, in order `[single source: Fergusson BM §3.6]`

1. After-damage effects (weapon specials; none at the first fight).
2. Elements, by priority: **Death Weakness > Recovery > Immune > Absorb > Weak/Resist > Normal.**
   - Weak (and not absorbing): `x 2`. Resist: `[(dmg + 1) / 2]`. Both together cancel.
   - Immune: damage 0; elements and statuses stripped; if a status had landed or the element was Earth, the ability counts as a miss.
   - Absorb: toggles the Restorative flag (heal instead of harm).
3. Cap: **9,999** HP damage; **999** for MP damage (the caps swap if the target has HP<->MP).
4. Re-check Physical/Magical Immunity, Peerless, Petrify: damage 0.
5. Lucky 7s (attacker at 7,777 HP): damage 7,777.
6. Apply: heal is capped at Max, damage floored at 0. (Two unsigned-overflow bugs; unreachable here.)

**Weakness is applied after Random Variation**, so a weak-element spell's range is exactly twice the neutral range `[derived from the order above]`.

---

## 5. Rows, Long Range, Defend, Cover

### 5.1 Row `[verified: 2 sources — Fergusson BM §3.4.6 row check; wiki "Final Fantasy VII battle system" §Overview]`

- A party member in the **back row** takes half physical damage and deals half physical damage, unless the attack is **Long Range**.
- The check is once, not twice, if both sides are in the back row (the formula halves once) `[single source: Fergusson]`.
- **Limits, Magic, Summons and Items ignore row** `[single source: wiki]`. The Magical formula has no row step, which agrees `[derived]`.
- Long Range is a flag on the weapon or ability, **not** an element. Barret's Gatling Gun and Assault Gun are Long Range; the Buster Sword is not `[single source: Fergusson PM §4.1.1, §4.1.2]`.
- **Change** swaps a member's row in battle `[verified: 2 sources — wiki battle system; manual p. 18]`. The manual: it appears when you press left at the left edge of the battle command window (Defend: right at the right edge), and "the changed status will not be carried over to the next battle"; it cannot be used in a Side Attack or an Attack From Both Sides (p. 16). Whether it spends the turn is not stated in any source read `[unsourced]`; the engine treats it as a command like Defend that spends the turn `[estimate]`.
- Enemies have rows for targeting but no "back row" damage rule `[single source: wiki "Final Fantasy VII statuses" §Back Row]`.

### 5.2 Defend `[verified: 2 sources — Fergusson BM §3.4.6 step 4; wiki battle system and statuses page]`

The Defend command halves **physical** damage the character takes until their next turn begins. It does nothing against magic. The manual (p. 18): damage "will be reduced by half until the Time gauge fills up", which fixes the end at the gauge filling, not at the member's next action `[verified: 2 sources for the end point — wiki; manual p. 18]`.

### 5.3 Cover `[single source: wiki "Cover (Final Fantasy VII)"]` — not reachable at the first fight

Cover is an Independent Materia first found in Aerith's garden in Sector 5 `[single source: wiki]`, so **neither Cloud nor Barret can have it at the Sector 1 reactor** `[derived]`. For the engine's future: a chance (20% at level 1 up to 100% at level 5, stacking, overflowing past 255%) to take a **single-target physical** attack aimed at an ally, regardless of the ally's HP; a covering character is auto-hit (Fergusson §3.3.1); a back-row coverer still takes back-row half damage.

---

## 6. Elements

### 6.1 The element list `[verified: 2 sources — Fergusson BM §1.2 via EM §4.1 key; wiki "Final Fantasy VII battle system" §Elements]`

Magical elements: Fire, Ice, Lightning, Earth, Poison, Gravity, Water, Wind, Holy, Restorative. Hidden physical elements carried by weapons and enemy attacks: Cut, Hit, Punch, Shoot, Shout. Physical elements matter only when a target has an affinity to them; the Guard Scorpion has none (companion §3).

### 6.2 Affinity levels `[single source: Fergusson EM §4.1]`

Death (instant kill), Auto-Hit (cannot evade), Weak (x2), Half/Resist, Void/Immune, Absorb. Recovery exists on a few enemies (Fergusson BM §3.6). Resolution order is §4.6.

---

## 7. The Limit gauge

### 7.1 Fill `[verified: 2 sources — Fergusson PM §3.2; wiki "Limit (Final Fantasy VII)" §Limit gauge]`

The gauge is an integer 0 to **255**; full at 255. It fills **only from HP damage done by an enemy** (damage from allies, including Confusion, does not count; a Manipulated enemy's damage does).

```
Units gained = [ [300 * HPLost / MaxHP] * 256 * StatusFactor / LNum ]
StatusFactor = 2 (Fury), 0.5 (Sadness), 1 otherwise
```

| Character | LNum Lv 1 | Lv 2 | Lv 3 | Lv 4 | % of Max HP to fill at Lv 1 |
|---|---|---|---|---|---|
| Cloud | **140** | 324 | 435 | 506 | 46.5% |
| Barret | **129** | 240 | 374 | 450 | 42.8% |

### 7.2 Using and losing it

- When full, **Limit replaces the Attack command** `[single source: wiki battle system]`.
- Using a Limit empties it `[single source: wiki Limit page, "Three events deplete the Limit gauge"]`.
- It **carries between battles** `[single source: wiki Limit page, quoting the in-game Beginner's Hall tutorial]`.
- **KO empties it** `[single source: wiki Limit page]`.
- **Switching Limit Level empties it** `[single source: wiki Limit page]` `[conflict]` with the D:\FF7 research, which said switching keeps a full bar. D:\FF7 gives no source for its claim; use the wiki. Not reachable at the first fight (only Limit Level 1 exists).
- Limit Breaks take turn priority `[single source: wiki Limit page]`.

### 7.3 Limit Level 1 moves at the Sector 1 reactor `[single source: Fergusson PM §3.3.1, §3.3.2]`

The first Limit of Level 1 is available from the start `[single source: wiki Limit page, "The first Limit Break is available automatically"]`.

| Limit | Owner | Formula | Power | PAt% | Target | Element | Notes |
|---|---|---|---|---|---|---|---|
| **Braver** | Cloud (L1-1) | Physical, Long Range | 3x Base (48) | 255 | 1 enemy | none | |
| **Big Shot** | Barret (L1-1) | Physical, Long Range | 3 1/4x Base (52) | 255 | 1 enemy | none | |

Unlocking the second Level-1 Limit needs 8 Braver uses (Cloud) or 9 Big Shot uses (Barret), counted only in battles that are won `[single source: Fergusson PM §3.1]`. Not reachable at the first fight `[derived]`.

"Long Range" on a Limit means row does not halve it; PAt% 255 is still run through the hit formula (it is not an automatic hit by itself, §3.1), but with `Hit% ≥ 255` it can only miss on the 1-in-65,536 roll `[derived]`.

---

## 8. Materia, spells and MP at the Sector 1 reactor

### 8.1 Slots `[verified: 2 sources — Fergusson PM §4.1.1, §4.1.2, §4.2; wiki Cloud and Barret pages]`

| Equipment | Slots |
|---|---|
| Buster Sword (Cloud) | `O=O` (one linked pair) |
| Gatling Gun (Barret) | `O` (one slot) |
| Bronze Bangle (both) | none |

So the party can hold **three** Materia in total. Links matter only for Support Materia, and there is none before this fight `[derived]`.

### 8.2 Materia owned at the fight

| Materia | Where | Source |
|---|---|---|
| Lightning (Bolt) | equipped on Cloud at the start | `[verified: 2 sources — wiki Cloud page "Materia"; Jegged walkthrough]` |
| Ice (Ice) | equipped on Cloud at the start | `[verified: 2 sources — same]` |
| Restore (Cure) | picked up on the walkway to the reactor core, just before the boss | `[verified: 2 sources — wiki "No. 1 Reactor Bombing"; Jegged walkthrough]` |

Barret joins with no Materia `[single source: wiki Barret page]`. The player can move any Materia between the two, which changes stats (8.3). The default loadout at the boss (who holds Restore) is a player choice; see the companion file §8.

### 8.3 Materia stat changes and AP `[single source: Fergusson PM §2.1]`

Lightning, Ice and Restore each give: **HP -2%, MP +2%, Str -1, Mag +1**. Level 2 needs 2,000 AP (Bolt2, Ice2) or 2,500 AP (Cure2). The fight gives 10 AP, so no Materia levels up in it `[derived]`.

### 8.4 Spells `[single source: Fergusson PM §2.6]`

| Spell | Formula | Power | MAt% | MP | Target | Element | Notes |
|---|---|---|---|---|---|---|---|
| **Bolt** | Magical | 1/2x Base (8) | 100 | 4 | one or all (toggle) | Lightning | reflectable |
| **Ice** | Magical | 1/2x Base (8) | 100 | 4 | one or all | Ice | reflectable |
| **Cure** | Cure | Base + 110 (Power 5) | 255 | 5 | one or all | Restorative | reflectable |

Because Bolt and Ice can toggle, cast on all targets they split (`x 2/3`, §4.5). The Guard Scorpion fight has one enemy, so the split never applies to the party's attacks `[derived]`.

### 8.5 MP

Cloud starts the game at Lv 6 with 54 MP; at Lv 7 his MP is 55 in every roll `[verified: 2 sources — Fergusson PM §1.1; wiki Cloud stat table]`. With two magic Materia: `55 + [55 * 4 / 100]` = **57** `[derived]`, that is 14 casts of Bolt. Barret at Lv 6 has 42 to 44 MP `[single source: wiki Barret stat table]`. Neither has an MP item before this fight (8.6).

### 8.6 Items reachable before the fight

| Item | Effect | How many before the boss |
|---|---|---|
| **Potion** | Fixed 100 HP, one ally `[single source: Fergusson PM §5]` | 2 from the knocked-out guards at Sector 1 station + 1 in the reactor `[verified: 2 sources — wiki "No. 1 Reactor Bombing"; Jegged]`; plus random MP drops (chance class 8, i.e. 9/64 per MP killed `[derived: Fergusson EM MP entry; wiki drop rule]`) |
| **Phoenix Down** | Revives, restores Max HP / 4 `[single source: Fergusson PM §5]` | 1, chest in the reactor `[verified: 2 sources — wiki No. 1 Reactor item list; Jegged]` |
| Grenade | Item formula, Power 160, auto-hit, Shoot `[single source: Fergusson PM §5]` | **0 reachable**: MPs carry one only as a Steal, and no Steal Materia exists yet `[derived]` |
| Ether | Fixed 100 MP | **0**: the first one is in Sector 7 after this mission `[single source: Jegged]` |

**The inventory a new game starts with is `[unsourced]`.** None of the sources we read lists it.

---

## 9. Commands at the first fight `[single source: wiki battle system §Overview, except where noted]`

Attack (physical, Power 16, the weapon's At% and element), **Magic** (from Materia), **Item**, **Defend**, **Change** (row), **Limit** (replaces Attack when the gauge is full). Escape by holding two buttons (2.7), disabled here. No Command Materia exists yet.

---

## 10. Back attacks, pincers, side attacks

Only relevant to random encounters `[single source: wiki "Final Fantasy VII battle system" §Formation]`. For completeness: a **back attack** reverses the party's rows and gives the enemy the first move (§2.4); attacking a combatant from behind doubles physical damage (§4.5 step 5) and is an automatic hit (§3.1). The Guard Scorpion's fixed formation is not one of these (§2.4). **Not needed for the first fight.**

---

## 11. Battle end and rewards

- **Victory** when every enemy is gone; **Game Over** when every party member is KO'd `[single source: wiki battle system]`.
- **EXP:** each party member in the party and not KO'd gets the **full** total (it is not divided); KO'd members get 0; members outside the party get half `[single source: Fergusson PM §1.3]`.
- **AP** goes to the equipped Materia; **gil** to the party; Limit uses and kills count only in won battles `[verified: 2 sources — wiki battle rewards; Fergusson PM §3.1]`.
- **Item drops:** each item on an enemy's list has a chance class 0 to 63; it drops if `Rnd(0..63) <= class`, i.e. with probability `(class + 1) / 64`, checked in list order `[verified: 2 sources — Fergusson EM §4.1; wiki battle rewards]`. **Class 63 is a certain drop.**
- **Level up:** the XP totals come from a per-character quadratic table; the stat gains are random and self-correcting toward a curve `[single source: Fergusson PM §1.2, §1.4]`. Cloud needs 616 total XP for Lv 7 and 949 for Lv 8; Barret needs 385 for Lv 6 `[verified: 2 sources — derived from Fergusson PM §1.2 and equal to the wiki stat tables' XP column]`.

---

## 12. How enemy AI runs `[single source: Fergusson EM §4.2]`

Each enemy script has sections:

- **Setup:** runs once at battle start.
- **Main:** runs whenever the enemy may take a turn (its gauge is full).
- **Counter:** each counter section names what it reacts to (for example Death, Damage, Physical, or a general counter). It runs **whenever the enemy experiences that effect**.

Temporary variables are reset to 0 at battle start and may be set in Setup. Fergusson simplifies scripts for readability while keeping their effect; treat his scripts as behaviour, not bytecode. The Guard Scorpion script is in the companion file §5. A counter does not wait for, consume or reset the counterer's gauge `[estimate]` (D:\FF7 `formulas.md` §9.11 says so without a source we could check; Fergusson's key only says the section "will be run whenever the enemy experiences the listed effect").

---

## 13. Engine checklist for the first fight

What the Guard Scorpion slice needs from this file, and what it does not.

| Needed now | Section |
|---|---|
| Speed Value, V-Timer, Turn Timer with NormalSpeed, the battle-start seed (Normal) | 2.1 to 2.4 |
| Active / Recommended / Wait time rules; enemies commit at once | 2.4, 2.5 |
| Physical and magical hit, critical, Lucky Hit / Evade | 3.1 to 3.3 |
| Physical, Magical, Cure, Fixed formulas; modifiers 1, 3, 4, 8, 12; Weak x2; cap 9,999 | 4 |
| Row, Long Range, Defend, Change | 5.1, 5.2 |
| Limit gauge, Braver, Big Shot | 7 |
| Materia stat changes, Bolt, Ice, Cure, MP | 8 |
| Potion, Phoenix Down, KO and revive | 8.6 |
| Counters that fire on being attacked | 12 |
| EXP, AP, gil, a certain drop | 11 |

| Not needed now (keep the seams) | Section |
|---|---|
| Statuses and their timers (C-Timer, Global Timer uses) | 2.2, 3.4 |
| Barrier, MP Turbo, Quadra, Berserk, Frog, Mini, Sadness, Fury | 4.5 |
| Cover, back attacks, escape | 5.3, 10, 2.7 |

---

## 14. Worked numbers (the Guard Scorpion fight)

All `[derived]` from this file's formulas and the companion file's stat block. Party stats are the medians of the companion file §8; ranges there.

| Action | Target | Result per hit (min to max) |
|---|---|---|
| Cloud Attack (Att 37, Base 45) | Scorpion, tail down (Def 40) | 38 to 41 (crit 76 to 82) |
| Cloud Attack | Scorpion, tail up (Def 255) | 20 to 22 |
| Cloud Bolt (MAt 25, Base 192, Weak x2) | tail down (MDf 256) | 90 to 96 |
| Cloud Bolt | tail up (MDf 384) | 44 to 48 |
| Cloud Braver (Power 48) | tail down | 116 to 124 |
| Barret Attack (Att 32 with Restore equipped, Base 38) | tail down | 32 to 35 |
| Barret Big Shot (Power 52) | tail down | 105 to 113 |
| Barret Cure (MAt 17 with Restore, Base 138) | ally | 232 to 248 HP |
| Potion | ally | 100 HP |

---

## 15. Conflicts, open questions, corrections

### 15.1 Open

| # | Item | Status |
|---|---|---|
| Q1 | Ticks per second | `[unsourced]`. 30 Hz NTSC was inferred in D:\FF7 `[estimate]`. Keep ticks as the engine unit. |
| Q2 | Grace-pause length | `[unsourced]`. The rule is sourced (wiki), the number is not. Our estimate: proportional to Speed Value, tuned by playtest, documented as ours. |
| Q3 | The action queue | `[estimate]` (§2.6). |
| Q4 | New-game inventory and gil | `[unsourced]`. |
| Q5 | Starting rows of Cloud and Barret | `[unsourced]` (companion §8). |
| Q6 | Switching Limit Level empties the gauge | `[conflict]`: wiki yes, D:\FF7 no (no source). Use the wiki. Unreachable in the first fight. |
| Q7 | Real-copy check | FF7 is not known to be owned on Steam; the Steam rule in memory is about FFX. Ask Bailey before assuming any in-game check is possible. |

### 15.2 Corrections to the earlier D:\FF7 research (do not copy these)

1. **Assault Gun drop rate.** D:\FF7 `enemies.md` §1.1 says 63/255 (24.7%). The value 63 is a **chance class out of 63**: `Rnd(0..63) <= 63` is always true, so the drop is **certain** `[verified: 2 sources — Fergusson EM lists it as "Win: 100% Assault Gun"; wiki drop formula (class+1)/64 with the wiki's own "drop 1 rate = 63"]`.
2. **"Shoot attacks ignore back-row reduction"** (D:\FF7 `enemies.md` §0.4). Fergusson's row check reads the **Long Range flag**, not the element (§5.1). Guard Scorpion's Rifle, Scorpion Tail and Tail Laser are Shoot-element but listed without Long Range, so a back-row target takes half `[single source: Fergusson EM, BM]` `[derived]`; the wiki's advice to put Barret in the back row "to take less damage" agrees.
3. **The Restore Materia.** D:\FF7 `party.md` §4 gives the party only Lightning and Ice. Restore is picked up on the walkway right before the boss (§8.2).
4. **Worked ATB example.** D:\FF7 `formulas.md` §5.4 uses base Dex 7 (Cloud) and 5 (Barret). Barret's Lv 1 Dex is 5, but he joins at Lv 6 (companion §8); use §2.3 of this file.

---

## Sources

**GameFAQs (read in the built-in browser pane on 2026-09-27; WebFetch returned HTTP 403)**

- Terence Fergusson, *The FF7 Battle Mechanics* v1.10, updated 2009-06-29 (first release 2002-03-23), FAQ 22395: https://gamefaqs.gamespot.com/ps/197341-final-fantasy-vii/faqs/22395 — §1.1, §2 (all), §3.1, §3.3, §3.4, §3.6.
- Terence Fergusson, *FF7 Party Mechanics*, FAQ 36775 (PC page): https://gamefaqs.gamespot.com/pc/130791-final-fantasy-vii/faqs/36775 — §1.1 to §1.4, §2.1, §2.6, §3.1 to §3.3, §4.1.1, §4.1.2, §4.2, §5.
- Terence Fergusson, *The FF7 Enemy Mechanics* v1.11, updated 2009-07-31, FAQ 31903: https://gamefaqs.gamespot.com/ps/197341-final-fantasy-vii/faqs/31903 — §4.1, §4.2, §5.1.1.

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext` from the browser pane, 2026-09-27)

- Final Fantasy VII battle system, revid 4039023: https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_battle_system
- Limit (Final Fantasy VII), revid 4051388: https://finalfantasy.fandom.com/wiki/Limit_(Final_Fantasy_VII)
- Cover (Final Fantasy VII), revid 3994128: https://finalfantasy.fandom.com/wiki/Cover_(Final_Fantasy_VII)
- Final Fantasy VII statuses (redirect target of "Defend (Final Fantasy VII status)"), revid 3996722: https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_statuses
- Cloud (Final Fantasy VII party member), revid 4042478: https://finalfantasy.fandom.com/wiki/Cloud_(Final_Fantasy_VII_party_member)
- Barret (Final Fantasy VII party member), revid 4026950: https://finalfantasy.fandom.com/wiki/Barret_(Final_Fantasy_VII_party_member)
- No. 1 Reactor Bombing, revid 3865377: https://finalfantasy.fandom.com/wiki/No._1_Reactor_Bombing
- No. 1 Reactor (Final Fantasy VII field), revid 3874852: https://finalfantasy.fandom.com/wiki/No._1_Reactor_(Final_Fantasy_VII_field)
- Guard Scorpion (Final Fantasy VII), revid 4014097: https://finalfantasy.fandom.com/wiki/Guard_Scorpion_(Final_Fantasy_VII)
- Row, revid 4028706 (read, not cited beyond the battle-system page): https://finalfantasy.fandom.com/wiki/Row

**Official**

- *Final Fantasy VII* instruction manual, North America, PlayStation (digital edition): https://secure.cdn.us.playstation.com/manuals/classic/games/final-fantasy-vii-manual-en.pdf — pp. 16 (formations and Change), 18 (Change, Defend), 29 (Config ATB). Read 2026-09-27 (WebFetch, text extracted locally; not saved in the repo).

**Other**

- Jegged, *Final Fantasy VII Walkthrough: Train Station, Sector 1 and Sector 8* (no author or date shown): https://jegged.com/Games/Final-Fantasy-VII/Walkthrough/Disc-1/01-Train-Station-Sector-1-Sector-8.html
- Gamer Corner Guides, Guard Scorpion: https://guides.gamercorner.net/ffvii/monsters/guard-scorpion
- Earlier local research (not an independent source): `D:\FF7\docs\research\formulas.md`, `party.md`, `enemies.md`, `catalog.md` (Lifestream Encore, 2026-09-15/16).
- Not retrievable this session: FF7 Speedrun Wiki (HTTP 500).
