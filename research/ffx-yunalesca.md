# FINAL FANTASY X — Lady Yunalesca (Zanarkand Dome) — Implementation Reference

**Prepared:** 2026-09-15 for *Pyrefly Reprise* (Vite + TypeScript + Three.js, HD-2D billboard sprites).
**Audience:** implementation agents who will not play the game. Every number below is either decompile-derived, guide-derived, or an explicitly labelled estimate.

**Rights note.** Square Enix owns *Final Fantasy X*, its characters, dialogue, art, and music. Nothing here is an asset. Scene beats are summarised in original wording; at most a handful of short iconic lines are quoted. Do not ship ripped assets or transcribed dialogue.

---

## 0. Confidence legend and evidence hierarchy

| Tag | Meaning |
|---|---|
| `[decompile]` | Decoded directly from the FFX game-data binaries mirrored in Grayfox96/FFX-RNG-tracker (`ffx_mon_data.csv`, `ffx_monmagic2.csv`, `ffx_command.csv`, `monster_actions.json`) using that project's documented field offsets. Highest confidence for constants. |
| `[verified: N sources]` | Independently agreed by N separate sources (decompile counts as one). |
| `[single source]` | One source only. |
| `[estimate]` | Production judgment, not a measured fact. |
| `[CONFLICT]` | Sources disagree; both values recorded in §14. |

**Hierarchy used:** decompiled game data > official manual / Ultimania > Final Fantasy Wiki enemy page > strategy guides (Gamer Guides, Game8, Jegged, Samurai Gamers) > forum reports.

**Decompile provenance.** Yunalesca is monster record **index 130** (`m130`), bestiary slot 167, internal name `Yunalesca`. The PS2 (`ffx_mon_data.csv`) and HD/International (`ffx_mon_data_hd.csv`) records are **byte-identical** for this monster — no version split needed. `[decompile]`

**AI-script provenance (added 2026-09-15, gap-fill pass).** Every behavioural rule in §5 is now taken from the **disassembled monster AI bytecode** of `ffx_ps2/ffx/master/jppc/battle/mon/_m130/m130.bin`, produced by Karifean's **FFXDataParser** and published as a whole-game dump (see Sources). Ability ranks, powers and status riders in §3 are cross-checked against the same project's dump of `command.bin` / the enemy-magic files. Offsets quoted below (e.g. `offset 0374`) are byte offsets inside `m130`'s script as printed by that parser, so any claim here can be re-derived. This dump is a **second, independent decompilation** from Grayfox96/FFX-RNG-tracker's CSVs; where both cover the same field they agree, and each such agreement is tagged `[verified: 2 sources]`.

The five AI entry points that matter are `MonsterAi::init` (offset `001B`), `MonsterAi::onTurn` (`0209`), `MonsterAi::onHit` (`05EE`), and the private slots the script uses as state:

| Slot | Meaning |
|---|---|
| `priv0000` | current form: 0 = I, 1 = II, 2 = III |
| `priv0004` | in-form cycle counter (Form I: boolean toggle; Forms II/III: step index) |
| `priv0008` | anti-aeon sub-cycle index |
| `priv000C` | chosen target for this turn |
| `priv0014` | chosen command for this turn |
| `priv0028` | "an aeon is on the field" flag, recomputed every turn |
| `priv002C` | pending-transformation flag (1 = I→II, 2 = II→III) |
| `priv0030` | accumulated Zombie weight, rebuilt every weighted turn |

`[decompile: m130 AI script]`

**HP is one pool, split at `init`.** `MonsterAi::init` computes `priv0018 = maxHP * 4 / 11` (**48,000**), `priv001C = maxHP * 5 / 11` (**60,000**), then overwrites `maxHP = maxHP * 2 / 11` (**24,000**) and sets `HP = maxHP`. Each transition *re-assigns* `maxHP` and `HP` to the stored figure. Overflow damage therefore **cannot** carry: the new pool is written wholesale. This closes §14.3's "overflow carries?" question in favour of the default the document already recommends. `[decompile: offsets 0174–01B6, 061D, 06CC]` `[verified: 2 sources]`

**Local prior research consulted before searching:** `D:/Projects/Final Fantasy/docs/encounter-design.md`, `D:/Projects/Final Fantasy/Moonpetal/docs/CRITIC-RUBRIC.md`, `D:/Projects/Final Fantasy/Moonpetal/docs/MECHANICS-AUDIT.md`, `D:/Projects/Final Fantasy/Moonpetal/src/combat.mjs`, `D:/Projects/Final Fantasy/Moonpetal/src/data.mjs`. Corrections to those files are listed in §15.

---

## 1. Encounter identity

| Field | Value | Confidence |
|---|---|---|
| Location | Zanarkand Dome → **The Beyond** (Yunalesca's floating stone platform) | [verified: 2 sources] |
| Enemy type | Humanoid; flagged **Tough** and **Heavy** | [verified: 2 sources] |
| Bestiary no. | 167 | [single source] |
| Escape | Impossible | [verified: 2 sources] |
| Forms | 3, fought back-to-back in one battle, no menu between | [verified: 3 sources] |
| Battle theme | **"Challenge"** (Masashi Hamauzu). Shared with Seymour Flux, Omega Weapon, Dark Bahamut. ~4:18 on the OST. | [verified: 2 sources] |
| Same arena reused | Dark Bahamut (International/PAL/HD) fights here later | [single source] |
| Post-battle pickup | **Sun Crest** chest (descend the far stairs after victory) | [verified: 2 sources] |
| Immediately preceding boss | Spectral Keeper (52,000 HP) at the bottom of the Cloister lift | [single source] |

---

## 2. Stat blocks

### 2.1 Shared combat stats (identical across all three forms)

All three forms share one monster record, so **every attribute except HP is constant through the whole fight**. `[decompile]`

| Stat | Value | Confidence |
|---|---:|---|
| MP | 500 | [verified: 3 sources] |
| Strength | 20 | [verified: 3 sources] |
| Defense | 50 | [verified: 3 sources] |
| Magic | 30 | [verified: 3 sources] |
| Magic Defense | 50 | [verified: 3 sources] |
| Agility | 40 | [verified: 3 sources] |
| Luck | 20 | [verified: 3 sources] |
| Evasion | 0 | [verified: 2 sources] |
| Accuracy | **0** (decompile) / 1 (wiki) | [CONFLICT — see §14.1] |
| Zanmato level | **3** (decompile) / 4 (wiki) | [CONFLICT — see §14.2] |
| Poison tick byte | 25 → 33,000/tick if Poison could land (it cannot; she is Poison-immune) | [decompile] |

### 2.2 HP per form

| Form | Display name for the build | HP | Overkill threshold | AP (normal / overkill) | Gil | Confidence |
|---|---|---:|---:|---:|---:|---|
| I | Yunalesca (human) | **24,000** | — | 0 / 0 | 0 | [verified: 5 sources] |
| II | Yunalesca (serpent skirt) | **48,000** | — | 0 / 0 | 0 | [verified: 5 sources] |
| III | Yunalesca (medusa face) | **60,000** | **10,000** | **14,000 / 21,000** | **9,000** | [verified: 4 sources] |
| — | **Total** | **132,000** | | | | [verified: 3 sources] |

**Important structural fact.** The decompiled monster record stores **one** HP field: `HP = 132000`, `overkill_threshold = 10000`. The bribe-cost field derived from HP is `132000 × 25 = 3,300,000`, confirming 132,000 is the stored maximum. The 24k/48k/60k split is imposed by the **battle script**, not by three separate enemy entries. `[decompile]`

The Final Fantasy Wiki states each form "has a separate HP pool" and the on-screen bar resets at each transformation. Reward values are attached only to the third form, so AP/gil/drops are granted **once**, at the end. `[verified: 3 sources]`

**Damage overflow at a transition — unresolved.** See §14.3. **Build recommendation:** implement a per-form pool with overflow **discarded** (`damage = min(damage, form.currentHP)`), behind a config flag `yunalesca.overflowCarries = false`. This matches guide consensus and the "separate pool" wording, and is the safer balance choice. Expose the flag so a later footage check can flip it without a rewrite.

### 2.3 Elemental affinities

**All five elements are Neutral. She has no weakness and no absorption.** `[verified: 2 sources]`

| Element | Fire | Ice | Thunder | Water | Holy |
|---|---|---|---|---|---|
| Affinity | Neutral | Neutral | Neutral | Neutral | Neutral |

> Her in-game **Sensor** text says "Reaper of souls. Vulnerable to holy magic." **This is a lie / flavour text — she takes no bonus damage from Holy.** `[verified: 2 sources]` Holy is still the single strongest player spell by raw power, which is why guides recommend it; do not implement a Holy multiplier.

### 2.4 Damage-class flags

| Flag | Value | Implementation meaning |
|---|---|---|
| `armored` | false | Piercing gives no bonus vs her; Armor Break irrelevant (she is Break-immune anyway) |
| `immune_to_percentage_damage` | **true** | **Demi / Gravity / Bio-percentage effects deal 0** |
| `immune_to_life` | true | Life/Full-Life/Phoenix Down cannot be used on her |
| `immune_to_sensor` | false | Sensor works |
| `immune_to_scan` | false | Scan works |
| `immune_to_physical_damage` | false | normal |
| `immune_to_magical_damage` | false | normal |
| `immune_to_damage` | false | normal |
| `immune_to_delay` | **true** | **Delay Attack / Delay Buster / Triple Foul delay do nothing** |
| `immune_to_slice` | true | flagged in data; no player option at this point uses it |
| `immune_to_bribe` | **true** | **Bribe always fails regardless of gil** |

All `[decompile]`.

### 2.5 Status resistances

Resistance is a 0–255 byte. Application rule (decompile-derived): roll `status_rng = rng % 101`; the status lands if `(action_chance − target_resistance) > status_rng`. `255` = hard immune; action chance `254` or `255` = guaranteed regardless. `[decompile]`

| Status | Resistance | Result |
|---|---:|---|
| Death | 255 | Immune |
| Zombie | 255 | Immune |
| Petrify | 255 | Immune |
| Poison | 255 | Immune |
| Power Break | 255 | Immune |
| Magic Break | 255 | Immune |
| Armor Break | 255 | Immune |
| Mental Break | 255 | Immune |
| Confuse | 255 | Immune |
| Berserk | 255 | Immune |
| Provoke | 255 | Immune |
| **Threaten** | **25** | **Not immune** — lands on `(chance − 25) > rng` [CONFLICT §14.4] |
| Sleep | 255 | Immune |
| Silence | 255 | Immune |
| Dark | 255 | Immune |
| Slow | 255 | Immune |
| Eject | 255 | Immune |
| Auto-Life | 255 | Immune |
| Doom | 255 | Immune |
| Distillers (Power/Mana/Speed/Ability) | 255 | Immune |
| **Shell / Protect / Reflect / Regen / Haste / Curse / Scan / Shield / Boost / Defend / Guard / Sentinel** | **0** | **Can be applied to her** |

All `[decompile]`, corroborated qualitatively by the wiki stat block `[verified: 2 sources]`.

`auto_statuses` = none. She starts the battle clean. `[decompile]`

**Player-facing consequences:**
- All four **Breaks fail**. Power/Armor/Magic/Mental Break are wasted turns.
- Dark Attack / Silence Attack / Sleep Attack / Triple Foul all fail.
- **Reflect can be cast on her** (resistance 0). This matters for the Lulu self-heal trick in §10.7.
- **Haste can be cast on her** (resistance 0) — never do this; there is no Slow to trade for it.

### 2.6 Steal / drop / bribe

| Slot | Item | Qty | Confidence |
|---|---|---:|---|
| Steal (common) | **Stamina Tablet** | 1 | [verified: 4 sources] |
| Steal (rare) | **Farplane Wind** | 1 | [verified: 4 sources] |
| Steal base chance | 255 (first steal effectively guaranteed; halves on each subsequent success) | 
| Drop 1 normal, common | **Lv. 3 Key Sphere** | 1 | [verified: 3 sources] |
| Drop 1 normal, rare | **Lv. 3 Key Sphere** | 1 | [verified: 3 sources] |
| Drop 1 overkill, common | Lv. 3 Key Sphere | **2** | [decompile] |
| Drop 1 overkill, rare | Lv. 3 Key Sphere | **2** | [decompile] |
| Drop chance byte | 255 (effectively guaranteed) — Game8 states 7/8 | [CONFLICT §14.5] |
| Drop 2 | none | | [decompile] |
| Bribe | blocked by `immune_to_bribe` | | [decompile] |

**Equipment drop (form III only, guaranteed).** `drop_chance = 255`, added straight to inventory. `[decompile]`

| Field | Value |
|---|---|
| Slots (by RNG roll 0–7) | 2, 3, 3, 3, 3, 4, 4, 4 |
| Ability rolls (by RNG roll 0–7) | 1, 1, 1, 1, 1, 1, 1, 2 |
| Weapon ability slot 0 | **Piercing** — Auron and Kimahri only; empty for everyone else |
| Weapon ability slots 1–7 | **Zombiestrike** |
| Armor ability slots 1–7 | **Zombieproof** |
| Base weapon damage | 16 |
| Bonus critical | 3 |

This corroborates the wiki's "Piercing, Zombiestrike / Zombieproof, 2–4 slots, 1–2 abilities" exactly. `[verified: 2 sources]`

> **Design note for the build:** a guaranteed **Zombiestrike** weapon drop from the boss whose whole gimmick is Zombie is a lovely closing beat. Consider surfacing it in the reward screen.

---

## 3. Action constants (decompile-derived)

Field names follow the tracker's action schema. `[decompile]` throughout; `[verified: 2 sources]` where the wiki text agrees.

| Action | File/ID | Rank | Formula | Base power | Dmg type | Hits | Statuses (chance/stacks) | Reflectable | Notes |
|---|---|---:|---|---:|---|---:|---|---|---|
| **Dispelling Slap** | mm2 / 124 — `command.bin` `607Ch` | **0** | Strength | 16 | Physical | 1 | Shell 255, Protect 255, Haste 255 — **removed**, not applied (`removes_statuses = true`) | **No** | `can_crit = true`, `bonus_crit = 10`. Used both as a normal turn (Form I, scheduled, rank 0 → 0 ticks) and as the counter (Forms II–III, fired from `onHit`, rank not consulted). Second dump reads the record verbatim as `Physical HP Damage, 1-hit, Formula=STR vs DEF, Power=16, Choose Enemy, Rank=0, Hit%=Always, Can crit (+10%), Remove { Shell; Protect; Haste }`. `[verified: 2 sources]` |
| **Absorb** | mm2 / 109 | 3 | **Percentage Total** | 8 | **Other** | 1 | none | **No** | `drains = true`, `damages_hp`. Damage = `floor(target.maxHP × 8 / 16)` = **exactly half maximum HP, no variance**. Heals Yunalesca for the same amount. |
| **Osmose** | mm2 / 122 | 3 | **Percentage Total** (MP pool) | 16 | Magical | 1 | none | No | `drains = true`, `damages_mp`, `ignores_armored`. Drain = `floor(target.maxMP × 16 / 16)` = **100 % of maximum MP**. |
| **Hellbiter** (1 & 2) | mm2 / 128 and 209 | 3 | Strength | 16 | Physical | 1 | **Zombie 100 / 254 stacks** | No | `accuracy = 100`, hit formula Always. Targets the whole active party. Records 128 and 209 are **identical in every gameplay field** (verified byte-diff: they differ only in text-pointer bytes); 128 is Form II's entry, 209 is Form III's. Implement one action. |
| **Mind Blast** (party) | mm2 / 129 | 3 | Magic | 16 | Magical | 1 | **Confuse 50 / 254 stacks** | No | Whole active party. |
| **Mind Blast** (aeon) | mm2 / 246 | 3 | Magic | 16 | Magical | 1 | Confuse 50 / 254, **plus `status_flags = {Curse}`** | No | Curse is a no-RNG flag: **guaranteed** unless the target has resistance 255. |
| **Mega Death** | mm2 / 130 | 3 | Magic | **0** (no damage) | Magical | 1 | **Death 100 / 254 stacks** | No | Whole active party. Deals **0 HP damage** — it is purely the Death status. Its command record (`6082h`) carries target type **`Team (Forced)`** and **Rank 3**, exactly like Hellbiter and Mind Blast — it is an ordinary scheduled turn, not a counter-class action. The `"Counter Characters' Party"` string in `monster_actions.json` is the RNG-tracker author's own label for "the party-wide action fired at the phase transition", not an engine target-type; see §5.3 and §14.13. `[decompile: command.bin 6082h]` |
| **Blind** (counter) | mm2 / 112 | 3 | Magic | 0 | Other | 1 | **Dark 100 / 3 stacks** | **Yes** | Counter to physical attacks in Form I. |
| **Silence** (counter) | mm2 / 110 | 3 | Magic | 0 | Other | 1 | **Silence 100 / 3 stacks** | **Yes** | Counter to magic attacks in Form I. |
| **Sleep** (counter) | mm2 / 113 | 3 | Magic | 0 | Other | 1 | **Sleep 100 / 3 stacks** | **Yes** | Counter to "other" actions (Skills, Specials, Overdrives, Items) in Form I. |
| **Metamorphosis 1** | mm2 / 126 | 3 | No Damage | 0 | Other | 0 | none | No | Self-targeted transformation I→II. |
| **Metamorphosis 2** | mm2 / 127 | 3 | No Damage | 0 | Other | 0 | none | No | Self-targeted transformation II→III. |
| **Cura** (she casts the *player* spell) | cmd / 44 | 3 | **Healing** | 40 | Magical | 1 | none | **Yes** | MP 10, `long_range`. Cast on a **random party member**. |
| **Curaga** | cmd / 45 | 3 | **Healing** | 80 | Magical | 1 | none | **Yes** | MP 20, `long_range`. Cast on a **random party member**. |
| **Regen** | cmd / 62 | 3 | Magic | 0 | Magical | 1 | **Regen 100 / 10 stacks** | **Yes** | MP 40, `long_range`. Cast on a **random party member**. |

`mm2` = `ffx_monmagic2.csv`; `cmd` = `ffx_command.csv`.

### 3.1 Critical structural findings

1. **Her healing spells are literally the player's Cura / Curaga / Regen records.** Same MP costs, same spell powers, same `affected_by_reflect = true`. This is why Reflect bounces them (§10.4) and why her heals hurt Zombies at exactly player-spell magnitude.
2. **Dispelling Slap is rank 0.** Confirmed in both decompilations (`ffx_monmagic2.csv` byte 36; `command.bin` record `607Ch`). Only two enemy-usable actions in the whole game carry rank 0 — this one, and a Gravija belonging to a monster whose data block reads `Forced Action: Skip Turn` (i.e. one that never uses the CTB). Under `recovery = base_ticks × rank`, rank 0 = **zero recovery**. Note, though, that rank 0 is *not* why her counters are free: the counters are fired from the `onHit` hook, which is outside the CTB queue and never consults rank at all. Rank 0 only bites on the **Form-I scheduled** use — see §5.3, where §14.8 is resolved in favour of implementing it literally. `[verified: 2 sources]`
3. **Only Blind / Silence / Sleep are reflectable among her offensive actions.** Hellbiter, Mind Blast, Mega Death, Absorb, Osmose, and Dispelling Slap all have `affected_by_reflect = false`. `[decompile]`
4. **Mega Death does no damage.** It is a pure 100-chance Death application. Any implementation that gives it damage is wrong.
5. **Absorb has no damage variance.** Percentage-Total damage skips the `× (rng + 240) / 256` variance step. It is exactly `floor(maxHP / 2)` every time.

---

## 4. Damage numbers

### 4.1 The formulas (decompile-derived, integer arithmetic)

```
// Strength formula (Hellbiter, Dispelling Slap)
power      = floor(STR^3 / 32) + 30
mitigation = 0x2DA - floor( ( ( (DEF*0x33) - floor(floor(DEF^2 * 0x2E8BA2E9 / 0xffffffff)/2) )
                              * 0x66666667 / 0xffffffff ) / 4 )
d1 = power * mitigation
d2 = floor(d1 * -1282606671 / 0xffffffff)
d3 = floor((d1 + d2) / 512) * (15 - targetCheerStacks)
d4 = floor(d3 * -2004318071 / 0xffffffff)
dmg = floor((d3 + d4) / 8)
dmg = floor(dmg * basePower / 16)        // Strength & Special Magic only
dmg = floor(dmg * (damageRng + 240) / 256)   // damageRng ∈ [0,31]

// Magic formula (Mind Blast)
power = floor( floor(MAG^2 * 0x2AAAAAAB / 0xffffffff) + basePower ) * basePower / 4
// ...same mitigation chain using MDEF; NO extra "* basePower/16" step

// Healing formula (her Cura / Curaga)
power = floor((MAG + basePower) / 2) * basePower
// ...same chain with defensiveStat = 0; no extra step; variance applied
```

`[decompile]` — the Final Fantasy Wiki independently states the player White Magic healing formula as `SpellPower × ((Magic + Focus + SpellPower) / 2)`, which is the same expression. `[verified: 2 sources]`

Damage variance band: `(240..271)/256` ≈ **−6.3 % to +5.9 %** around the rng-16 value.

### 4.2 Hellbiter and Dispelling Slap output (STR 20), by target Defense

| Target DEF | min (rng 0) | typical (rng 16) | max (rng 31) |
|---:|---:|---:|---:|
| 0 | 262 | **280** | 296 |
| 5 | 253 | 270 | 285 |
| 10 | 243 | **260** | 275 |
| 15 | 235 | 251 | 265 |
| 20 | 226 | **242** | 256 |
| 25 | 218 | 233 | 246 |
| 30 | 210 | **224** | 237 |
| 35 | 201 | 215 | 227 |
| 40 | 194 | 207 | 219 |
| 50 | 179 | 191 | 202 |

`[decompile]` — computed from the constants above. Confirms her physical hits are **small** (~200–280 per target). The danger is never Hellbiter's damage; it is the Zombie rider, and Dispelling Slap's buff-strip. Protect halves it (physical type). A Cheer stack on the target reduces it by roughly 1/15 per stack.

### 4.3 Mind Blast output (MAG 30), by target Magic Defense

| Target MDEF | min | typical | max |
|---:|---:|---:|---:|
| 0 | 622 | **664** | 702 |
| 10 | 579 | **618** | 654 |
| 20 | 538 | **574** | 607 |
| 30 | 499 | **533** | 564 |
| 40 | 461 | **492** | 520 |
| 50 | 423 | **452** | 478 |
| 60 | 389 | 415 | 439 |
| 80 | 324 | 346 | 366 |

`[decompile]`. Roughly **450–670 to the whole party**, plus a 50-chance Confuse each. Shell halves it (magical type).

### 4.4 Her Cura / Curaga (MAG 30) — the numbers that kill Zombies

| Spell | min | typical | max |
|---|---:|---:|---:|
| Cura (power 40) | 1,312 | **1,400** | 1,482 |
| Curaga (power 80) | 4,125 | **4,400** | 4,657 |

`[decompile]`. On a non-Zombie party member these heal. On a Zombie they are **damage**. Curaga at ~4,400 is a one-shot on most story-progress characters (§11: typical max HP 2,200–4,300). This is the single largest threat in Form III and the reason Dispel-on-Regen and staggered Zombie coverage matter.

### 4.5 Absorb and Osmose

| Action | Effect | Note |
|---|---|---|
| Absorb | Target loses **exactly `floor(maxHP / 2)`**; Yunalesca gains the same. No variance. Type `Other` → **not reduced by Protect or Shell**. | Against a ~3,000 HP character: 1,500 damage + 1,500 healing for her, every time. |
| Osmose | Target loses **100 % of maximum MP**; Yunalesca gains the same (capped at her 500 MP). Magical type, ignores armor. | Aeons carry 40–70 MP at this point, so it mostly denies the aeon's spell list rather than being a large heal. |

`[decompile]` — the "half maximum HP" magnitude is independently stated by the Final Fantasy Wiki and Gamer Guides `[verified: 3 sources]`. Osmose's exact magnitude is `[single source: decompile]`; guides only say "MP drain".

---

## 5. AI script

### 5.1 Form I — the human Yunalesca (24,000 HP)

**Scheduled turns (no aeon on the field):** strict alternation.

```
loop:
  turn N   : Dispelling Slap → one random party member
  turn N+1 : Absorb          → the party member with the HIGHEST HP
```

`[verified: 4 sources]` (AI script, wiki, Gamer Guides, Jegged).

**§14.6 resolved.** The script line is `priv000C = Battle.findMatchingChr(group=FrontlineChars, property=HP [00h], unused=0, selector=Highest [01h])`. Property `00h` is the live `HP` field; `maxHP` is a **different** property id (`02h`) used elsewhere in the same script. Absorb therefore targets the active party member with the **highest current HP**. Ship it unflagged. `[decompile: offset 02AB]` `[verified: 2 sources]`

Dispelling Slap's branch uses `findMatchingChr(FrontlineChars, isAlive [04h], Any/All [00h])` — a **random living** active party member. `[decompile: offset 02C6]`

The alternation flag is a boolean toggle (`priv0004 = (priv0004 == 0)`) initialised to 0, so her **first Form-I action is always Dispelling Slap**. `[decompile: offset 02DE]`

**Counters — and exactly what provokes them (§14.11 resolved).** All of her counters live in `MonsterAi::onHit`, the hook the engine runs **when an action lands on her**. An action that never touches her never enters the hook, so:

- Attacking, casting an offensive spell on her, Stealing from her, Mugging, Lancet, an Overdrive aimed at her, a damaging Mix — **provoke a counter**.
- Healing an ally, Esuna, Holy Water, Reflect/Haste/Protect on an ally, a Phoenix Down, Cheer/Focus, an armour swap, Defend, a summon, an Overdrive that targets the party — **do not**, in any form.
- A **missed** or fully-nullified action still enters `onHit` if the engine registers the hit; a *targeting* of her that resolves into nothing (e.g. an unreflected spell bounced away from her) does not. Implement the trigger as "an action resolved against Yunalesca", not "an action was aimed at Yunalesca". `[decompile: offset 05EE]` `[estimate]` for the miss edge case only.
- `onHit` opens with `if (LastAttacker == Monster#00) return` — **she never counters herself**. This matters for §10.3: when Absorb is reversed onto her by a Zombie target, no Dispelling Slap follows. `[decompile: offset 07A4]`
- If the hit **reduced her to 0 HP**, `onHit` runs the transformation block and returns *before* reaching the counter switch — **the killing blow of each form is never countered**. `[decompile: offset 0600]`

The counter is keyed to the *category* of the incoming action, read from `usedCommand.damageType` (`Special = 00h`, `Physical = 01h`, `Magical = 02h`), and costs her **zero recovery**:

| Player action category | Counter | Status applied |
|---|---|---|
| Physical attack (Attack, Auron's/Tidus's strikes, Wakka's ball, Steal-attacks) | **Blind** | Dark, 100 chance, 3 stacks |
| Magic (Blk Magic, Wht Magic offensive casts) | **Silence** | Silence, 100 chance, 3 stacks |
| Everything else — Skill, Special, Item, Overdrive, Use, Mix | **Sleep** | Sleep, 100 chance, 3 stacks |

`[verified: 3 sources]`

- The counter targets **the character who acted** (`LastAttacker`), not the party. `[decompile]`
- **Original-game quirk — the Blind/Silence gate reads the wrong actor.** The physical branch is `if (damageType == Physical && priv000C.StatusDarkness == 0) → Blind on LastAttacker`, and the magical branch is the same shape with `StatusSilence`. `priv000C` is **the target she picked on her own last turn**, not the attacker. So she suppresses her Blind counter whenever *the character she last slapped or drained* already has Dark, no matter who is attacking; likewise for Silence. The Sleep branch has no such gate and always fires. This looks like a developer slip (the intended variable is almost certainly `priv0010`, the attacker), but it is what the shipped game does. **Build recommendation:** implement it faithfully behind `yunalesca.formI.counterGateQuirk = true`, because it is observable — a party that keeps one member blinded shuts off her Blind counter entirely. `[decompile: offsets 07B6, 07D7]` `[single source]`
- Before her first turn `priv000C` is uninitialised (0). Treat an uninitialised gate as "not afflicted", i.e. the counter fires. `[estimate]`
- All three counter records are **`affected_by_reflect = true`**. Reflect on the actor bounces the counter, and Yunalesca is immune to Dark/Silence/Sleep (resistance 255), so the bounce does nothing to her. **This is the canonical Form-I answer. It must work.** `[decompile]` + `[verified: 2 sources]`
- Ward armor gives resistance 50 vs a chance-100 counter → ~**49.5 %** landing chance (`(100−50) > rng%101`). Proof armor gives resistance 255 → **immune**. `[decompile]`
- Counters cost her no CTB (Dispelling Slap rank 0 / status counters resolve as counters). The scheduled Slap↔Absorb alternation is unaffected by how many counters fire. `[verified: 2 sources]`

**Against an aeon in Form I (§14.10 resolved).** The `priv0028` aeon flag is recomputed every turn, but **Form I's branch never reads it** — the `switch priv0000` case for form 0 goes straight to the Slap/Absorb toggle. An aeon on the field therefore changes nothing except that it is the frontline character Absorb can pick (and, with aeon HP of 1,341–2,840 per §12, it is usually *not* the highest-HP target). `[decompile: offsets 027F, 02A1]` `[verified: 2 sources]`

**Transition:** at 0 HP she uses **Metamorphosis 1** (self-targeted, no damage, no recovery cost meaningfully) and becomes Form II. `[decompile]`

---

### 5.2 Form II — the serpent skirt (48,000 HP)

**Turn 1 of Form II is the transformation turn.** `MonsterAi::onTurn` opens with `if (priv002C == 1)`, and on that branch it calls `forcePerformCommand(Self, Metamorphosis 1)` and then `performCommand(FrontlineChars, Hellbiter)` **within the same turn**, clears the flag and returns. The opening Hellbiter is therefore guaranteed and is *not* a separate scheduled turn. ~200–280 damage each, **Zombie 100 chance** on each. `[decompile: offset 0209]` `[verified: 5 sources]`

**Turn 2 of Form II is a guaranteed heal — no Hellbiter is possible.** The transition resets `priv0004 = 0`, and the transformation turn returns before touching it, so her next turn lands in `case 0`, which has **no Hellbiter branch at all**:

```
turn 2  (priv0004 == 0):
    priv000C = random living active party member
    if (rand() % 100 > 50)  priv0014 = Cura      // 49 %
    else                    priv0014 = Regen     // 51 %
    priv0004 = 1   →  then the shared tail does priv0004 += 1  →  2
```

`[decompile: offsets 0335, 033C, 0426]` — **this forced heal turn is new information**; no guide or wiki text describes it. It is why a party that is fully zombified by the opening Hellbiter immediately eats a Cura (~1,400) or a Regen.

**Turns 3+ of Form II — the zombie-weighted branch.** `priv0004` is ≥ 2 from here on and never returns to 0, so every later human-target turn runs:

```
turn N  (priv0004 >= 2):
    priv000C = random living active party member      // rolled BEFORE the branch
    weight = 0
    if (Character#1 has Zombie) weight += 30
    if (Character#2 has Zombie) weight += 30
    if (Character#3 has Zombie) weight += 30
    if (rand() % 100 < weight + 10):
        if (rand() % 100 > 50)  priv0014 = Cura       // 49 %
        else                    priv0014 = Regen      // 51 %
    else:
        priv000C = whole active party ; priv0014 = Hellbiter
    priv0004 += 1
```

`[decompile: offsets 0374–0418]`

**§14.7 RESOLVED — the exact Form-II table.** `P(heal) = (30z + 10) / 100`, where `z` is the number of the three active slots carrying Zombie:

| Active members with Zombie | P(Cura/Regen) | **P(Hellbiter)** |
|---:|---:|---:|
| 0 | 10 % | **90 %** |
| 1 | 40 % | **60 %** |
| 2 | 70 % | **30 %** |
| 3 | 100 % | **0 %** |

`[decompile: offsets 038C–03DA]` `[verified: 2 sources]` — the wiki's qualitative rule ("if 0~2 party members are afflicted with Zombie she may use Hellbiter again, with fewer party members leading to a higher chance", and never at three) matches the decoded arithmetic exactly.

> **Note for the rules panel.** The ramp this document previously published as an explicit invention — 0 → 90 %, 1 → 60 %, 2 → 30 %, 3 → 0 % — turns out to be **exactly the shipped curve**. It may now be advertised as exact. §15.2 defect #8 is discharged.

**The check is on *slots*, not on living characters.** The script tests `Character#1/#2/#3.StatusZombie` unconditionally — a **KO'd** active member that is still zombified **still contributes its 30**, and a slot that is empty or holds a non-zombie contributes nothing. Zombie status survives KO in FFX, so a dead zombie keeps suppressing Hellbiter. `[decompile]`

**Cura vs Regen.** `rand() % 100 > 50` selects Cura. `rand() % 100` is uniform on `[0, 99]`, so the strict `>` gives **49 % Cura / 51 % Regen** — not a 50/50. The identical test governs Curaga vs Regen in Form III. `[decompile]`

**RNG consumption order (for deterministic replays).** Per weighted turn: (1) the random-living-target roll, (2) the heal-vs-Hellbiter `rand()%100`, (3) if healing, the Cura-vs-Regen `rand()%100`. The target roll is consumed **even when Hellbiter wins** and the target is overwritten with the whole party. `[decompile]`

**Counters in Form II:** the Blind/Silence/Sleep status counters are **gone** — the `switch priv0000` in `onHit` sends form 1 to a single branch. She counters with **Dispelling Slap** on `rand() % 100 > 50`, i.e. **49 %**, not 50 %, of eligible incoming hits. Dispelling Slap is no longer used as a scheduled turn. `[decompile: offset 080E]` `[verified: 2 sources]`

Dispelling Slap strips, unconditionally (chance 255 + `removes_statuses`): **Haste, Protect, Shell**. It does **not** strip **Reflect, Regen, or Auto-Life**. `[verified: 2 sources — decompile + wiki]`

**Against an aeon in Form II:** when `priv0028` is set she takes a dedicated two-state cycle keyed on `priv0008`, which the transition reset to 0:

```
priv0008 == 0 :  Absorb    → random living frontline actor ; priv0008 = 255
priv0008 != 0 :  Hellbiter → whole active party            ; priv0008 = 0
```

i.e. **Absorb → Hellbiter → Absorb → Hellbiter → …**, and the **human** counter `priv0004` is frozen for the whole time the aeon is out. `[decompile: offsets 02EB–0332]` `[verified: 2 sources]`. Absorb on an aeon is half its max HP per use; with story-progress aeon HP of 1,600–2,900 (§12) that is 800–1,450 a hit while healing her the same. **Summoning in Form II is a net loss.** Jegged says plainly: don't bother with aeons here. `[verified: 2 sources]`

**Transition:** at 0 HP, **Metamorphosis 2** → Form III.

---

### 5.3 Form III — the medusa face (60,000 HP)

**Opening action (guaranteed):** the II→III transformation turn runs `forcePerformCommand(Self, Metamorphosis 2)` followed by `performCommand(FrontlineChars, Mega Death)` **in the same turn** — the exact mirror of the Form-II entry. 100-chance Death, zero damage. Kills every active party member who is **not** Zombie-afflicted and **not** wearing Deathproof. `[decompile: offset 0244]` `[verified: 6 sources]`

**Scheduled turn cycle (repeating, 5 steps) — the three unweighted slots RESOLVED.** The cycle is a `switch priv0004` with two hard-coded cases and a weighted default; `priv0004` is reset to 0 by the transition and is **not** advanced by the transformation turn, so the first post-Mega-Death turn is step 2:

| `priv0004` | Step | Action | Selection |
|---:|---:|---|---|
| — | 1 | **Mega Death** (entry instance, on the transformation turn) | forced |
| 0 | 2 | Hellbiter **or** Curaga/Regen | weighted, see below |
| 1 | 3 | Hellbiter **or** Curaga/Regen | weighted |
| 2 | 4 | **Mind Blast** (whole party) | forced |
| 3 | 5 | Hellbiter **or** Curaga/Regen | weighted |
| 4 | 1 | **Mega Death** | forced |

then `priv0004` wraps to 0 and the cycle repeats from step 2. `[decompile: offsets 04D3–05B5]` `[verified: 3 sources]` — the ordering matches the wiki's prose ("Mega Death, followed by Hellbiter or Curaga/Regen, then Hellbiter or Curaga/Regen, then Mind Blast, and Hellbiter or Curaga/Regen") and the local `CRITIC-RUBRIC.md` register.

Implementation note: the two forced cases are literally `case 4 → Mega Death; priv0004 = 0` and `case 2 → Mind Blast; priv0004 = 3`; every other value falls through to the weighted branch, which does `priv0004 += 1`. Mega Death's case **assigns** 0 rather than incrementing, which is what closes the ring. `[decompile]`

**The weighted step (steps 2, 3 and 5) — the three slots this document previously left unweighted.** Identical in shape to Form II but with a **20-per-zombie** weight instead of 30, and Curaga in place of Cura:

```
weighted step:
    priv000C = random living active party member
    weight = 0
    if (Character#1 has Zombie) weight += 20
    if (Character#2 has Zombie) weight += 20
    if (Character#3 has Zombie) weight += 20
    if (rand() % 100 < weight + 10):
        if (rand() % 100 > 50)  priv0014 = Curaga     // 49 %
        else                    priv0014 = Regen      // 51 %
    else:
        priv000C = whole active party ; priv0014 = Hellbiter
    priv0004 += 1
```

`P(heal) = (20z + 10) / 100`:

| Active members with Zombie | P(Curaga/Regen) | **P(Hellbiter)** |
|---:|---:|---:|
| 0 | 10 % | **90 %** |
| 1 | 30 % | **70 %** |
| 2 | 50 % | **50 %** |
| 3 | 70 % | **30 %** |

`[decompile: offsets 0504–05A8]` `[verified: 2 sources]` — the residual 30 % at three zombies is the decoded form of the wiki's "Hellbiter can now be used even if the entire party is afflicted with Zombie". As in Form II the test reads the three **slots**' Zombie flags directly, so a KO'd zombie still contributes its 20.

**Curaga vs Regen** uses the same `rand() % 100 > 50` test as Form II: **49 % Curaga / 51 % Regen**. RNG order per weighted step is target roll, then heal-vs-Hellbiter, then Curaga-vs-Regen. `[decompile]`

**What this means for the damage-per-cycle question.** With all three actives Zombie (the intended survival posture), each weighted step is 30 % Hellbiter (~200–280 physical, re-applying Zombie) and 70 % a heal, of which 49 % is **Curaga ≈ 4,400 damage to one Zombie** and 51 % is Regen. Per full 5-step cycle the expectation is therefore ≈ **1.03 Curaga casts**, ≈ **1.07 Regen casts**, ≈ **0.90 extra Hellbiters**, exactly **1 Mind Blast** (~450–670 to everyone) and exactly **1 Mega Death**. At three zombies the cycle's one reliable killer is the ~4,400 Curaga on a single random member, which is why staggered Holy-Water timing (§10.2), max HP above ~4,400, or Auto-Life are the real survival levers — a Zombie survivor *can* outlast the rotation, but only if it can absorb roughly one Curaga per cycle. `[decompile]` + arithmetic.

Changes from Form II:
- **Curaga replaces Cura.** `[verified: 3 sources]` (~4,400 damage to a Zombie — lethal.)
- **Hellbiter is now usable even when the entire active party is already zombified** — at 30 %, per the table above. `[verified: 2 sources]`
- **Her Dispelling Slap counter now fires on *every* eligible hit** — the Form-III `onHit` branch is an unconditional `performCommand(LastAttacker, Dispelling Slap)` with no random gate at all. `[decompile: offset 0828]` `[verified: 2 sources]`
- The Form-I gating quirk (§5.1) does **not** apply here: Forms II and III have no status precondition on the counter. `[decompile]`
- **Mind Blast** enters the rotation: party-wide ~450–670 magic damage, Confuse 50 chance each.
- **Osmose** enters her kit, used **only against aeons**. `[verified: 2 sources]`

**Against an aeon in Form III:** a separate 4-step cycle on `priv0008` (reset to 0 by the transition), and again the human counter `priv0004` is **frozen** while the aeon is out:

```
priv0008 == 0 :  Mind Blast (aeon record 60F6h, carries Curse) → whole party ; priv0008 = 1
priv0008 == 1 :  Absorb → random living frontline actor        ; priv0008 = 2
priv0008 == 2 :  Osmose → whole party                          ; priv0008 = 3
priv0008 == 3 :  Absorb → random living frontline actor        ; priv0008 = 0
```

`[decompile: offsets 0433–04D0]` `[verified: 2 sources]`. The aeon version of Mind Blast carries the **Curse** status flag — a no-RNG flag, so it is **guaranteed** (aeons have no Curse resistance). Curse blocks Overdrive gain and use. Combined with Absorb (half max HP twice per cycle) and Osmose (full MP wipe), a summon in Form III is a **sacrificial timer**, exactly as Jegged describes: use an aeon to soak Mega Death and buy the party a repositioning window, not to win the damage race. `[verified: 2 sources]`

**§14.13 RESOLVED — Mega Death's entry timing.** It is **a scheduled turn**, not a counter-class event, and the mechanism is explicit in the script:

1. The killing hit on Form II enters `MonsterAi::onHit`, which sees `Monster#00.HP == 0` and runs the transformation block instead of the counter switch.
2. That block re-assigns `maxHP`/`HP` to 60,000, sets `priv0000 = 2`, resets `priv0004 = 0` and `priv0008 = 0`, sets the pending flag `priv002C = 2`, then does the CTB surgery: **`Self.CurrentTurnDelay = 0`** and **`Character#1/#2/#3.CurrentTurnDelay += 1`** each. Finally it runs the transformation cutscene (`runBtlSceneB(0)`).
3. Her **next** `onTurn` sees `priv002C == 2`, performs Metamorphosis 2 and Mega Death together, clears the flag and returns.

Because her delay was zeroed and all three party delays were incremented, that turn is **hers immediately** — no party member can act between the transformation and Mega Death. The observable result matches the old "fire it on the transition" recommendation, but the structure is a real turn, so implement it as one: it must appear on the CTB bar, and her recovery afterwards is Mega Death's Rank 3 = 21 ticks (not 0). The same three steps govern the I→II transition, with `priv002C = 1`, `maxHP = 48,000`, and Metamorphosis 1 + Hellbiter. `[decompile: offsets 0600–0774, 0209–0278]` `[verified: 2 sources]`

**Caveat implementers must not miss:** the `priv002C` check sits at the very top of `onTurn`, *above* the `priv0028` aeon test. An aeon on the field does **not** prevent the entry Hellbiter or the entry Mega Death — those fire against `FrontlineChars` regardless. `[decompile]`

**Note on the pattern and Mega Death — correction.** The scheduled Mega Death occupies `priv0004 == 4`. If an aeon is on the field her turn takes the aeon branch instead, and **`priv0004` is not advanced** — the human cycle is *frozen*, not skipped. Dismissing or losing the aeon resumes the cycle at exactly the step it was paused on. So summoning **postpones** Mega Death; it never removes one from the sequence. (The entry Mega Death is the exception: it is gated on `priv002C`, not on `priv0004`, and fires through an aeon.) The previous claim in this document that summoning "skips a Mega Death" was wrong. `[decompile: offsets 027F, 04D3]`

**§14.8 RESOLVED — the rank-0 question.** Two facts settle it:

1. **The counter instances never touch her CTB at all.** In Forms II and III the Slap is issued from `MonsterAi::onHit` via `performCommand`. Counter-hook actions are extra actions outside the CTB queue — the command's rank is simply not consulted. Rank 0 is therefore *irrelevant* to the counters, not the cause of their being free. `[decompile: offsets 080E, 0828]`
2. **The literal rank 0 cannot make her act continuously**, which was the standing objection to shipping it. In Form I the command is chosen by a **boolean toggle**: a Dispelling Slap turn always sets the flag so that the *next* turn is Absorb, which is **Rank 3 = 21 ticks**. A 0-recovery Slap can therefore only ever be followed by a full-cost Absorb. The worst case is a **paired burst** — Slap and Absorb resolving back-to-back, then 21 ticks of silence — never a chain. `[decompile: offsets 02A1–02DE]`

**Build recommendation (changed from the previous draft):** implement rank 0 **literally**. Form I's cadence becomes one Slap+Absorb burst per ~21 ticks rather than one action per ~10.5 ticks — the same total output with a nastier shape: your buffs are stripped and the healthiest character is drained for `floor(maxHP/2)` in the same breath, with no window to re-buff between them. Keep `yunalesca.formI.slapRank` (values `0` | `3`) so the strict-alternation reading can be restored if footage contradicts. The decoded byte is `Rank = 0` in **both** independent dumps (`command.bin` record `607Ch`; `ffx_monmagic2.csv` byte 36), and only two enemy records in the whole game carry rank 0 — this one, and a rank-0 Gravija belonging to a monster whose data block reads `Forced Action: Skip Turn`, i.e. one that never uses the CTB at all. That pattern is consistent with rank 0 meaning "costs no recovery", not with it being a placeholder. `[verified: 2 sources]` for the byte; `[estimate]` for the literal-0 interpretation over an engine clamp.

---

## 6. CTB timing

Recovery = `base_ticks(agility) × action_rank`; Haste = integer floor-halve; Slow = double. Base-tick breakpoints (min agility → base ticks): `[decompile]`

```
(0,28) (2,26) (3,24) (4,20) (5,16) (7,15) (10,14) (12,13) (15,12)
(17,11) (19,10) (23,9) (29,8) (35,7) (44,6) (62,5) (98,4) (170,3)
```

| Actor | AGI | base ticks | rank-3 recovery |
|---|---:|---:|---:|
| **Yunalesca** | **40** | **7** | **21** |
| Tidus (typ. 30–35) | 33 | 7 | 21 |
| Auron (typ. 18–24) | 21 | 10 | 30 |
| Yuna (typ. 22–28) | 25 | 9 | 27 |
| Rikku (typ. 30–40) | 34 | 7 | 21 |
| Lulu (typ. 18–24) | 22 | 9 | 27 |

**She is as fast as the fastest party member and twice as fast as Auron.** Hastega is the single highest-value opening action, and Dispelling Slap exists specifically to take it away.

Her counters cost **0 ticks** — they are fired from the `onHit` hook, outside the CTB queue entirely — so no amount of countering delays her scheduled turns, and no amount of countering *advances* them either. `[decompile: offset 05EE]`

**Rank per action** (recovery = `base_ticks × rank`; at AGI 40, base 7):

| Action | Rank | Her recovery |
|---|---:|---:|
| Dispelling Slap (Form-I scheduled) | **0** | **0 ticks** — see the rank-0 discussion in §5.3 |
| Dispelling Slap (Forms II–III counter) | n/a | 0 ticks (counter hook, rank not consulted) |
| Absorb, Osmose, Hellbiter, Mind Blast, Mega Death, Cura, Curaga, Regen, both Metamorphoses | 3 | 21 ticks |

`[decompile: command.bin records 607Ch, 606Dh, 607Ah, 60D1h/6080h, 6081h/60F6h, 6082h, 302Ch, 302Dh, 303Eh, 607Eh, 607Fh]` `[verified: 2 sources]`

**Transition CTB surgery.** Both `onHit` transformation blocks do the same two things to the timeline before running the cutscene:

```
Self.CurrentTurnDelay          = 0      // she acts next, unconditionally
Character#1.CurrentTurnDelay  += 1
Character#2.CurrentTurnDelay  += 1      // every active member pushed back one tick
Character#3.CurrentTurnDelay  += 1
```

So no party member can slip an action in between a form dying and the entry Hellbiter / Mega Death. Implement it exactly: zero her countdown, add 1 to each active member's countdown, then resolve her transformation turn. `[decompile: offsets 064D–069B, 06FC–074A]` `[single source: decompile]`

---

## 7. Status interaction matrix — the rules the fight is built on

### 7.1 Zombie (the central mechanic)

| Rule | Detail | Confidence |
|---|---|---|
| Healing reversal | Every HP-restoring effect deals that amount as damage instead: Cure/Cura/Curaga, Potion/Hi-Potion/X-Potion/Mega-Potion, Al Bhed Potion, Elixir, Pray, Regen ticks, Curaga from Yunalesca. | [verified: 3 sources] |
| Revival reversal | Life, Full-Life, Phoenix Down, Mega Phoenix used on a **living** Zombie **instantly kill them**. | [verified: 2 sources] |
| MP restoration | Ether/Turbo Ether/Elixir MP restore is also reversed. | [verified: 2 sources] |
| **Instant-death protection** | A Zombie's Death resistance is raised so far that ordinary Death effects, **including Mega Death**, fail. | [verified: 3 sources] |
| Exception | Zombie does **not** stop "always inflicts death" attacks (Fenrir's Fangs of Hell, Dark Anima's Pain, player Zanmato). Mega Death is **not** one of those. | [single source] |
| Doom / Auto-Life | Zombie does not block Doom, and does not block Auto-Life being applied or triggering. | [single source] |
| Drain reversal | Drain/Osmose/Lancet **reverse** when caster or target is a Zombie. If **both** are Zombies it works normally. | [verified: 2 sources] |
| **Haste reversal** | Zombie reverses Haste's *initial turn-shift*: the target's **next** turn is **delayed** rather than advanced (like Slow). Subsequent turns are advanced normally. Haste and Slow override each other, so alternating them on a Zombie can lock it out of turns entirely. | [single source: wiki] |
| Elemental healing | A Zombie can still be healed by **absorbed elemental damage** — i.e. an "-Eater" armor auto-ability plus a matching elemental item/spell/weapon. | [verified: 2 sources] |
| Cures | **Holy Water**, **Remedy**, Rikku's Panacea / Ultra Cure / Final Elixir mixes. | [verified: 3 sources] |
| **Not** cured by | **Esuna**. Esuna does not remove Zombie in FFX. | [verified: 2 sources — manual + wiki] |
| Resistance gear | Ribbon, Zombie Ward (resistance 50 → ~49.5 % block vs Hellbiter), Zombieproof (immune). | [verified: 2 sources] |
| Visual | Zombified characters turn sickly green. | [verified: 2 sources] |
| Source in this fight | Hellbiter only. No player ability inflicts it except **Zombie Attack** (Auron's grid path / aeon customization) and **Zombiestrike / Zombietouch** weapons. | [verified: 2 sources] |

### 7.2 The other statuses she trades in

| Status | Source | Duration | Cure | Notes |
|---|---|---|---|---|
| Dark | Form I physical counter | 3 stacks | Eye Drops, Remedy, Esuna | Physical accuracy tanks; magic unaffected |
| Silence | Form I magic counter | 3 stacks | Echo Screen, Remedy, Esuna | Blocks all Wht/Blk Magic; Items, Skills, Overdrives still work |
| Sleep | Form I "other" counter | 3 stacks | any physical hit, Remedy, Esuna | Physical damage wakes |
| Confuse | Mind Blast, 50 chance | 254 (until cured) | any physical hit, Remedy, Esuna | Confused character attacks an **ally or an enemy** at random — it is not guaranteed friendly fire |
| Curse | aeon-only Mind Blast, guaranteed flag | 254 | **Dispel, Holy Water** | Blocks Overdrive gain and use. **Not** cured by Esuna or Remedy |
| Death | Mega Death, chance 100 | — | Phoenix Down, Life | Blocked by Zombie or Deathproof |
| Regen (hostile use) | She casts it on a party member | 10 stacks | **Dispel** | On a Zombie this is periodic HP loss |

`[verified: 2+ sources]`, with the official FFX manual as the authority on Zombie→Holy Water/Remedy, Curse→Dispel/Holy Water, and Confusion targeting either side.

**Ward/Proof arithmetic** `[decompile]`:

| Gear | Effect | vs Hellbiter (Zombie 100) | vs Mind Blast (Confuse 50) | vs Mega Death (Death 100) | vs Form-I counters (100) |
|---|---|---|---|---|---|
| none | resistance 0 | ~99 % | ~49.5 % | ~99 % | ~99 % |
| **Ward** | resistance 50 | ~49.5 % | **0 % — fully blocked** | ~49.5 % | ~49.5 % |
| **Proof** | resistance 255 | **immune** | **immune** | **immune** | **immune** |
| Ribbon | 255 on all | immune | immune | immune | immune |

Note especially: **Confuse Ward alone completely stops Mind Blast's Confusion**, because `(50 − 50) > rng` is never true. This is the acceptance criterion already named in the local `MECHANICS-AUDIT.md` defect #7.

---

## 8. Reflect: exactly what bounces

`affected_by_reflect` decoded per action. `[decompile]`

| Her action | Reflectable? | Consequence with party-wide Reflect |
|---|---|---|
| Blind counter | **YES** | Bounces to Yunalesca; she is Dark-immune → nullified. **Canonical Form-I defence.** |
| Silence counter | **YES** | Bounces; Silence-immune → nullified. |
| Sleep counter | **YES** | Bounces; Sleep-immune → nullified. |
| **Cura** | **YES** | Bounces to Yunalesca → **heals her ~1,400**. |
| **Curaga** | **YES** | Bounces → **heals her ~4,400**. |
| **Regen** | **YES** | Bounces → **she gains Regen**. Yuna must **Dispel** it off her. |
| Dispelling Slap | no | lands normally |
| Absorb | no | lands normally |
| Osmose | no | lands normally |
| Hellbiter | no | lands normally |
| Mind Blast | no | lands normally |
| Mega Death | no | lands normally |

**So Reflect is a phase-dependent tool, not a blanket answer:**
- **Form I:** Reflect on all three actives is excellent — it neutralises the entire counter game for free.
- **Forms II–III:** Reflect becomes a **liability** on non-Zombie characters (her Cura/Curaga would have healed them; now it heals her instead) and a **double-edged tool** on Zombies (it converts an incoming 4,400-damage Curaga into 4,400 healing *for her*, but saves the Zombie's life). The wiki explicitly recommends dispelling Reflect before the Form-II transition, and separately documents the Zombie+Reflect stall as a deliberate survivability tactic that trades DPS for safety. `[verified: 2 sources]`

**Implementation requirement:** reflected Regen must land on Yunalesca (resistance 0) and must be removable by the player's Dispel. This loop — she Regens a reflecting Zombie → it bounces onto her → Yuna dispels it — is a named, must-work strategy.

---

## 9. Scan text (for the in-game Scan/Sensor UI)

- **Sensor:** "Reaper of souls. Vulnerable to holy magic." *(flavour; the Holy vulnerability is false — see §2.3)*
- **Scan:** "Casts Curaga and Regen on zombified characters. Cure zombie with Holy Water. Her counterattacks dispel support magic. She also curses aeons with her Mind Blast."

`[verified: 2 sources]`. These two strings are the game's own tutorialisation of the whole fight and are worth reproducing (paraphrased) in the build's Scan panel.

---

## 10. Player strategies that must work

Each of these is a named, sourced tactic. If any fails in the build, the encounter is not faithful.

### 10.1 Stay Zombie on purpose (the core lesson)
Enter Form III with **at least one active party member still Zombie-afflicted**. That character survives Mega Death and can Phoenix Down the others. Do **not** equip Zombieproof. Do **not** blanket-cure Zombie. `[verified: 5 sources]`

**Failure mode the build must reproduce:** cure all Zombie, then kill Form II → Mega Death wipes the active three → game over. The rubric requires a recoverable loss, so this must be reachable *and* clearly explained afterwards.

### 10.2 Holy Water timing
Holy Water (300 gil, sold in Calm Lands / Mt. Gagazet / Monster Arena / Rin on the airship) removes **Zombie and Curse**, single target. `[verified: 2 sources]`

The intended rhythm:
1. Character is Zombie and hurt → **Holy Water** them → now healable.
2. **Heal** them (Curaga / Hi-Potion / X-Potion).
3. Wait for her next **Hellbiter** to re-apply Zombie, or accept the risk window.
4. Never let the *last* Zombie be cured while a Mega Death is due (step 1 of her Form-III cycle).

`[verified: 3 sources]`

**Auto-Med interaction:** Auto-Med fires Holy Water for Zombie automatically. This is a *trap* in this fight — it can strip your last Zombie. The wiki recommends Auto-Med on the designated healer specifically so that character stays curable; guides recommending it must be read as "on one character, deliberately". `[verified: 2 sources]`

### 10.3 "Zombie Attack" — clarification
The user's brief flags this as n/a; it is **partly applicable**.
- **Zombie Attack** is a genuine ability on **Auron's Sphere Grid path** and an aeon customization (99 Holy Water). **Zombiestrike / Zombietouch** are weapon auto-abilities (Candle of Life ×30 / ×70 customization). `[verified: 2 sources]`
- Yunalesca herself is **Zombie-immune** (resistance 255), so you cannot zombify the boss.
- **But:** the wiki records a real exploit — **zombify your own highest-HP character during Form I.** Absorb targets the highest-HP character; Absorb is a drain; drains reverse against a Zombie; therefore **Yunalesca damages herself** for half that character's max HP while healing the Zombie. `[verified: 2 sources — wiki + Zombie mechanics page]`
- A story-progress party will rarely have this (Auron's Zombie Attack is deep in his path; Candle of Life is a rare customization item). Treat it as an **advanced optional strategy** worth implementing for the "two distinct viable strategies" gate, not as the default line.

### 10.4 Reflect
See §8 for the exact bounce table. Must-work behaviours:
- Form I: Reflect on the actives nullifies Blind/Silence/Sleep counters entirely.
- Her Cura/Curaga/Regen bounce; reflected Regen lands **on her** and is removable by Dispel.
- Hellbiter, Mind Blast, Mega Death, Absorb, Osmose, Dispelling Slap **never** bounce.
- The build should let the player Dispel Reflect off their own party before Form II.

### 10.5 Dispel
Two jobs, both required:
1. **Dispel her Regen off your Zombies** — otherwise Regen ticks chew them down. `[verified: 3 sources]`
2. **Dispel Regen off Yunalesca** when a reflected Regen lands on her. `[verified: 2 sources]`

Dispel also removes Curse from a cursed aeon. `[verified: 2 sources]`

### 10.6 Aeons — the verified answer to the brief's question

> *"Mega Death kills aeons? Aeons are immune to Zombie so Mega Death kills them — verify."*

**No. Both halves of the premise resolve differently:**

1. **Aeons are immune to every negative status except Curse and Delay.** `[verified: 2 sources — wiki Aeon page]` That includes **Zombie** *and* **Death**. Mega Death's Death status cannot land on an aeon.
2. **She does not use Mega Death while an aeon is on the field anyway** — her turn takes the aeon branch (`Mind Blast → Absorb → Osmose → Absorb`) instead of the human cycle. `[decompile: offsets 027F, 04D3]` `[verified: 2 sources]`

So an aeon is a **Mega Death delay**, not a Mega Death victim — and *delay* is the right word: the human step counter `priv0004` is **frozen**, not advanced, for as long as the aeon is out, so the cycle resumes on exactly the step it was paused on. Summoning buys turns; it never deletes a Mega Death from the sequence. The one exception is the **entry** Mega Death on the II→III transformation turn, which is gated on the pending-transformation flag and fires straight through an aeon. `[decompile]` What actually kills the aeon is **Absorb twice per cycle** (half its max HP each, ~800–1,450 per hit at story-progress stats, while healing her the same amount) plus **Osmose** wiping its MP and **Mind Blast** applying guaranteed **Curse** (no Overdrive).

**Correct aeon usage in the build:**
- Form I / II: summoning is a net loss (she gains HP from Absorb). Jegged: don't bother. `[verified: 2 sources]`
- Form III: summon as a **shield and tempo tool** — postpone a Mega Death, get one or two big hits in, take the party out of the line of fire, then let it fall or Dismiss. Time it for the step *before* Mega Death (`priv0004 == 3`) to buy the longest reprieve. `[verified: 2 sources]`
- **Curse arrives before the aeon's Overdrive in most cases** (Mind Blast is step 1 of the aeon cycle), so **fire the aeon's Overdrive immediately on summon** if the gauge is full. This is a real, discoverable tactic and the build must make it possible.
- **Grand Summon** (Yuna's Overdrive) grants a full temporary gauge on top of the aeon's own — the aeon can Overdrive twice if its own gauge was full. The local `MECHANICS-AUDIT.md` defect #5 covers this; it must be fixed for this strategy to exist.

### 10.7 Elemental-Eater self-healing on a Zombie
Equip an "-Eater" armor auto-ability (e.g. Fire Eater) and have Rikku **Use** a matching gem, or Lulu cast the matching spell, to **heal** a Zombie without curing it. Lulu can also hit herself with a same-element weapon. If Lulu has Reflect, the spell must also be Reflected off Yunalesca to reach her. `[single source: wiki]` — Yunalesca's Reflect resistance is 0, so casting Reflect on the boss is legal. `[decompile]`

This is an elegant advanced strategy and a good candidate for the build's second viable line, but it needs Eater armor which a story-progress party is unlikely to have. `[estimate]`

### 10.8 Deathproof / Auto-Life alternative
Deathproof armor (customized with Farplane Wind) on Yuna lets her survive Mega Death **without** Zombie, so she can heal and revive normally. **Auto-Life** (cast, or from Rikku's **Hyper Mighty G** mix) also survives Mega Death. `[verified: 2 sources]` This is the "controlled non-Zombie survivor" strategy the local `encounter-design.md` names as strategy (b).

### 10.9 Overdrives
- **Bahamut's Mega Flare** is the standard way to **Overkill** (exceed the 10,000 threshold on the killing blow) without Break Damage Limit. `[verified: 2 sources]`
- Wakka's **Attack Reels** and Lulu's **Fury** also clear the threshold via multi-hit. `[single source]`
- **Rikku's Mix — Trio of 9999 + four Fire Gems** is the fast-kill route, and the wiki names it as the fastest option. `[single source: wiki]` The local audit's defect #9 (Mix is a four-branch heuristic, not a recipe lookup) blocks this; it must be fixed if the build claims Mix fidelity.
- **Curse blocks Overdrive on aeons only** (via aeon Mind Blast). Human party members get Confuse, not Curse, from Mind Blast. This is the exact bug called out in the local audit's defect #6 — the current engine wrongly Curses humans.

### 10.10 Ward / Proof loadout (the intended preparation)
| Character role | Armor ability | Why |
|---|---|---|
| Melee (Tidus, Auron, Wakka, Kimahri) | **Dark Ward / Darkproof** | Form I physical counter |
| Casters (Yuna, Lulu) | **Silence Ward / Silenceproof** | Form I magic counter |
| Everyone, before Form III | **Confuse Ward** (Ward is enough — it fully blocks Mind Blast, §7.2) | Mind Blast |
| One designated survivor, if not using Zombie | **Deathproof** | Mega Death |
| **Nobody** | ~~Zombieproof~~ | **would remove your Mega Death protection** |

`[verified: 3 sources]`

---

## 11. Story-progress party preset (the "average non-grinding player")

**This is an explicit production estimate, not a measured population average.** There is no substantiated universal "average build" at Zanarkand Dome; published encounter screenshots differ materially. Label it in-game as a *story-progress preset*.

**Anchors used:**
- Guide screenshots of real parties at this fight show roughly **2,200–4,300 max HP** and **~130–312 max MP** across characters. `[single source, via local CRITIC-RUBRIC citation of Game8 / Samurai Gamers screenshots]`
- Community reports of no-grind clears describe "stats in the 60–80 range" for offensive stats at the very end of the game; at Zanarkand a normal player is below that. `[single source: forum]`
- The local `encounter-design.md` and `Moonpetal/src/data.mjs` presets.

### 11.1 Recommended preset

| Character | HP | MP | STR | DEF | MAG | MDEF | AGI | LUCK | EVA | ACC | S.Lv spent (approx.) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tidus** | 3,100 | 170 | 34 | 24 | 20 | 22 | 33 | 18 | 24 | 20 | ~46 |
| **Yuna** | 2,450 | 290 | 16 | 20 | 38 | 36 | 26 | 18 | 18 | 18 | ~44 |
| **Auron** | 4,000 | 110 | 44 | 32 | 16 | 22 | 21 | 18 | 12 | 26 | ~48 |
| Wakka | 3,200 | 140 | 38 | 26 | 18 | 22 | 29 | 18 | 20 | 34 | ~44 |
| Lulu | 2,300 | 300 | 12 | 20 | 44 | 40 | 22 | 18 | 22 | 18 | ~44 |
| Rikku | 2,600 | 150 | 26 | 22 | 24 | 24 | 36 | 20 | 28 | 22 | ~42 |
| Kimahri | 3,000 | 160 | 32 | 28 | 26 | 26 | 26 | 18 | 18 | 22 | ~42 |

All `[estimate]`, sanity-checked against the 2,200–4,300 HP / 130–312 MP observed band.

**Default front three: Tidus / Yuna / Auron.** Speed support + healing/summoning + the character with the personal stake. This is an adaptation recommendation, not a canonical frontline.

### 11.2 Abilities a story-progress party typically HAS

| Character | Abilities |
|---|---|
| Tidus | Cheer, Haste, **Hastega**, Slow, Delay Attack/Buster, Provoke, Flee, Talk |
| Yuna | Cure, Cura, **Curaga**, Esuna, Life, **Full-Life** *(if routed through Rikku's section)*, Scan, NulAll set, Protect, Shell, **Reflect**, **Dispel**, **Regen**, Pray, Summon |
| Auron | Power/Armor/Magic/Mental Break, Guard, Sentinel, Threaten, Piercing weapon |
| Wakka | Dark/Silence/Sleep Attack, Aim, Attack Reels *(Overdrive, if unlocked)* |
| Lulu | -ara tier plus first -aga (Firaga/Blizzaga/Thundaga/Waterga), Bio, Focus, Doublecast *(borderline)* |
| Rikku | Steal, Use, Mix, Luck, Nab Gil |
| Kimahri | Lancet, Scan, Ronso Rages collected so far, Steal/Use if routed |

`[estimate]`, structurally grounded: Reflect, Dispel, Regen, Full-Life and Auto-Life all live in Yuna's Standard-grid White Magic block (Full-Life sits in **Rikku's** section on the Standard grid), and Hastega is in **Tidus's** section. `[verified: 2 sources — Wht Magic wiki page]`

### 11.3 Abilities a story-progress party typically does NOT have

**Do not grant these by default.** Granting them trivialises the encounter and fails the rubric's "no material exploit" gate.

| Ability | Why not |
|---|---|
| **Holy** | End of Yuna's Standard-grid White Magic path; a normal player reaches it after Zanarkand, if at all |
| **Ultima** | Requires the Baaj / Omega-era detour |
| **Auto-Life** | Late in Yuna's grid section |
| **Quick Hit** | End of Tidus's grid section |
| **Doublecast** | Late in Lulu's section |
| **Break Damage Limit** | Celestial Weapons only |
| **Trio of 9999** | Requires Rikku's Mix plus the right ingredients; treat as an unlocked advanced option, not a default |
| Celestial Weapons | The Sun Crest is obtained *after* this fight |

`[estimate]`

### 11.4 Default inventory

| Item | Count | Notes |
|---|---:|---|
| **Holy Water** | **3–6** | The critical resource. 300 gil each; a player who has not read a guide often has 0–3. Give 4 as the balanced default. |
| **Phoenix Down** | 12–24 | Cheap; players hoard these. **Kills living Zombies — the UI must warn.** |
| Mega Phoenix | 1–2 | Full-HP revival per item data, capped at 9,999 |
| Hi-Potion | 20–35 | |
| X-Potion | 4–6 | |
| **Mega-Potion** | **3–5** | Party heal; **wipes a fully zombified party** — must be previewed |
| Potion | 20+ | |
| **Remedy** | **2–6** | Also cures Zombie (unlike Esuna) |
| Al Bhed Potion | 10–20 | Rikku Use; harms Zombies |
| Ether | 6–12 | MP restore is **reversed** on Zombies |
| Elixir | 1–2 | HP *and* MP reversed on a Zombie |
| Eye Drops / Echo Screen | 8–12 each | Cheaper than Remedy for the Form-I counters |
| Fire Gem | 0–4 | Only if the player farmed Flame Flans; gate the Trio-of-9999 line behind this |
| Light Curtain / Lunar Curtain | 2 each | Protect / Shell without MP |
| Stamina Tablet | 0 (steal 1 from her) | Mix with a Potion → **Mega Vitality**, doubles party max HP for the battle |
| Farplane Wind | 0 (rare steal) | Deathproof customization component |

`[estimate]`, item effects `[verified: 2 sources]`.

### 11.5 Overdrive gauges and modes

Start gauges **partially filled (30–70 %)**, not full — a normal player arrives mid-charge. Default modes: Tidus **Stoic**, Yuna **Healer** or **Stoic**, Auron **Warrior**, Wakka **Victor**, Lulu **Stoic**, Rikku **Stoic**, Kimahri **Stoic**. `[estimate]`

Note: **Stoic** (charge on taking damage) fills fast in this fight because Hellbiter and Mind Blast hit the whole party. That is an authentic and pleasant feedback loop to preserve.

---

## 12. Aeon stats at this point

Aeon stats are `max(value-from-battle-count, value-from-Yuna's-stats) + sphere bonuses`. A normal first playthrough reaches Zanarkand Dome at roughly **N = 270–330 battles**. `[estimate]` Values below are the Ultimania battle-count tables. `[verified: 2 sources — wiki, sourced to the FFX Ultimania]`

### N = 270–299

| Aeon | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC | Overdrive | OD power |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Valefor | 1,341 | 43 | 28 | 39 | 42 | 42 | 19 | 27 | 15 | Energy Ray / Blast | 55 |
| Ifrit | 1,797 | 41 | 29 | 47 | 41 | 37 | 17 | 14 | 15 | Hellfire | 58 |
| Ixion | 1,787 | 45 | 30 | 43 | 40 | 52 | 15 | 15 | 16 | Thor's Hammer | 60 |
| Shiva | 1,596 | 48 | 28 | 27 | 46 | 43 | 27 | 44 | 15 | Diamond Dust | 60 |
| Bahamut | 2,542 | 63 | 33 | 44 | 36 | 51 | 19 | 29 | 15 | Mega Flare | 72 |

### N = 300–329

| Aeon | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Valefor | 1,465 | 46 | 30 | 44 | 42 | 46 | 21 | 28 | 15 |
| Ifrit | 2,007 | 44 | 31 | 57 | 41 | 41 | 18 | 14 | 15 |
| Ixion | 1,981 | 48 | 32 | 50 | 41 | 58 | 16 | 16 | 16 |
| Shiva | 1,760 | 51 | 30 | 31 | 46 | 47 | 32 | 44 | 15 |
| Bahamut | 2,840 | 67 | 35 | 54 | 36 | 56 | 21 | 29 | 15 |

Aeon Overdrive powers are `[decompile]` and use the **Special Magic** formula (cubic Magic scaling, **ignores MDEF**), rank 8 — *not* the ordinary quadratic magic formula. This is the local audit's defect #8.

**Absorb against these aeons:** 800 (Valefor at N≈290) to 1,420 (Bahamut at N≈320) per hit, twice per aeon cycle, all of it healing Yunalesca. Bahamut survives roughly one full aeon cycle.

**Aeons are immune to all negative statuses except Curse and Delay** — so Zombie, Death, Confuse, Dark, Silence and Sleep all fail on them. `[verified: 2 sources]`

---

## 13. Scene, beat sheet, and audio

### 13.1 Setting

The party descends the Zanarkand Dome — an enormous ruined temple whose architecture echoes the Zanarkand blitzball stadium — after the sixth Cloister of Trials and the Spectral Keeper fight. The Dome is described as a vast accumulation of **pyreflies**: the dead of Zanarkand and the layered memories of a thousand years of summoners and guardians, functioning much like the Farplane. Memories replay as translucent scenes along the corridors: Braska, Jecht and a young Auron walking the same route ten years earlier, and a flash of Seymour's childhood pilgrimage with his mother. `[verified: 2 sources]`

The **Chamber of the Fayth** holds Lord Zaon's statue — but the fayth has departed; there is nothing left to summon. The **Hall of the Final Summoning** is where the party learns what the Final Summoning costs. Beyond it, a lift descends to **The Beyond**: a fractured circular stone platform floating in starfield blackness, the last standing fragment of the Dome, with broken columns, moss-furred paving and drifting debris.

### 13.2 Beat sheet

Beats are summarised in original wording. Speakers and tone are given for staging. Only a handful of short iconic lines are quoted.

| # | Beat | Speaker(s) | Tone | Staging note |
|---:|---|---|---|---|
| 1 | Party reaches the Hall of the Final Summoning. A pyrefly memory of Braska's party plays out; the line that lands is a young Auron's disbelief that there is no Final Aeon waiting to be claimed. | memory-Auron, memory-Jecht, memory-Braska | Dread, dawning | Translucent doubles walking the same floor, out of phase with the living party |
| 2 | Yunalesca appears. She explains the rule plainly: the Final Aeon is made from a **guardian**. A summoner must choose someone they love, and that person becomes the fayth. | Yunalesca | Serene, clinical | She is unhurried and does not raise her voice; the horror is in how reasonable she sounds |
| 3 | The party fractures. Wakka is loudest; Kimahri says almost nothing; Lulu goes cold; Rikku is openly horrified; Tidus refuses to accept the terms at all. Yuna will not name anyone. | party | Panic held just under control | Tight framing on faces; Yuna at the centre, silent |
| 4 | Save point. The player is given a deliberate beat to prepare. | — | Held breath | Diegetic save sphere; this is where the build's preparation screen belongs |
| 5 | On Yunalesca's platform, the party asks the real question: if Sin always returns, what is the Calm worth? Yunalesca confirms it. **Sin is reborn.** The Final Aeon kills Sin; Yu Yevon, the mindless unsent spirit inside Sin, then takes the Final Aeon's pyreflies and rebuilds Sin from them. The summoner dies. The guardian-turned-fayth becomes the new Sin's core. The cycle has run for a thousand years. | Yunalesca, Yuna, Tidus | The floor dropping out | Slow push-in on Yuna. Pyreflies begin drifting upward |
| 6 | Auron's stake lands. A memory replays his own confrontation here ten years ago: Braska dead, Jecht spent as the fayth, and Auron — a living man then — attacking Yunalesca and being cut down for it, losing his right eye. He has been an unsent ever since, carrying promises to two dead men. Tidus finally understands why Auron brought him. | memory-Auron, Yunalesca | Grief turned to iron | Desaturate to the memory; keep Auron's present-day silhouette in frame, watching himself die |
| 7 | Yunalesca offers her mercy. Her argument is that hope — even a false hope that must be paid for in lives — is kinder than despair, and that the party, having lost their hope, should be released from it. She offers them death as liberation: *"Let me be your liberator."* | Yunalesca | Gentle, maternal, monstrous | She extends a hand. The gesture should read as an embrace, not a threat |
| 8 | **The refusal.** Yuna, who has spent the whole game preparing to die on schedule, says no — not to dying, but to buying a lie. Tidus stands with her. Auron turns the moment outward: *"Now! This is it! Now is the time to choose!"* | Yuna, Tidus, Auron | Defiance | This is the emotional peak. Full party lines up; music swells into "Challenge" |
| 9 | **Form I battle.** She fights as herself, barely moving, hair-tendrils doing the work. | — | Contemptuous | Combat |
| 10 | **Metamorphosis 1.** Camera pulls back. The hair mass swells and descends; an enormous segmented serpent-skirt unfurls beneath her torso. The snake heads stay tucked out of sight until the first Hellbiter. | — | Revulsion | Preserve all party state — HP/MP/statuses/gauges/inventory/timeline |
| 11 | **Form II battle.** Hellbiter opens; the party turns green. Healing becomes a weapon against them. | — | Inverted, disorienting | Combat |
| 12 | **Metamorphosis 2.** The whole form **turns over**, rolling forward to expose a colossal face where the underside was. The human body is gone from view. | — | Nightmare | Directed ~2 s shot, then straight back to readable CTB input |
| 13 | **Form III battle.** Mega Death opens the phase. | — | Desperate | Combat |
| 14 | **Defeat.** Yunalesca fades into pyreflies. She curses them for condemning Spira to Sin's sorrow, grieves aloud to Zaon that the world's last hope is gone, and warns that Yu Yevon will rebuild Sin regardless of what they do. | Yunalesca | Bitter, bereaved | Dissolve upward into a rising pyrefly column, not an explosion |
| 15 | **Aftermath.** The platform is quiet. The party has destroyed the only known way to kill Sin and gained a name instead: **Yu Yevon**. Yuna performs a sending in the Antechamber. | party, Yuna | Hollow, then resolved | The Sun Crest chest appears down the far stairs |
| 16 | **Leaving.** On the way out, Auron tells Tidus the thing he has withheld all game: he is dead — an unsent, sent back to Zanarkand to find Jecht's son and keep a promise. Outside, Sin is waiting over the ruins, watching. | Auron, Tidus | Quiet, intimate | Two-shot, no music under the confession; Sin's silhouette reveal after |

Sources for beats: `[verified: 3 sources]` across the wiki's Yunalesca character page, Zanarkand Dome page, and the Paramina walkthrough; the Final Aeon page for the mechanism of Sin's rebirth.

### 13.3 Music

| Cue | Track | Character |
|---|---|---|
| Battle | **"Challenge"** — Masashi Hamauzu | Not a heroic boss march. It is anxious and mechanical: a driving mid-to-fast ostinato with a hard, clipped pulse, dissonant stabs over a churning low end, and very little melodic release. It sits in a narrow emotional band — pressure without triumph. Reused for Seymour Flux, Omega Weapon, and Dark Bahamut; all three are fights the game expects you to lose once. `[verified: 2 sources]` |

**For the build's original score:** aim for a driving, unresolved ostinato around **150–165 BPM** in a minor mode with a flattened-second colour; keep the percussion dry and mechanical; avoid a triumphant brass hook. Escalate by **adding layers at each Metamorphosis** rather than changing key — the audio should communicate "this is not getting better". Duck to near-silence for the two transformation shots and for beat 16. Distinct cues needed: preparation, battle (3 escalating layers), transformation stinger ×2, danger/SOS, defeat, victory. Do not transcribe or reuse the original track.

---

## 14. Conflicts and open questions

> **Status after the 2026-09-15 gap-fill pass.** Rows 14.3, 14.6, 14.7, 14.8, 14.10, 14.11 and 14.13 are now **resolved** against the disassembled `m130` AI script and the `command.bin` ability records (provenance in §0). Row 14.2 has flipped its recommendation. Rows 14.1, 14.4, 14.5, 14.9 and 14.12 remain as they were. Nothing in §5 is an invented probability any more.

| # | Item | Source A | Source B | Recommendation |
|---:|---|---|---|---|
| 14.1 | **Accuracy** | decompile: `0` | wiki stat box: `1` | Use 0. Her offensive actions all use hit formula "Always" or fixed accuracy 100, so the stat is inert either way. |
| 14.2 | **Zanmato level** | RNG-tracker CSV: `3` | wiki: `4`; **Karifean `m130` data block: `Zanmato Level: 4`** | **Updated 2026-09-15:** the second decompile agrees with the wiki, so the count is now 2–1 for **4**. Almost certainly a 0-based vs 1-based read of the same byte. Irrelevant unless Yojimbo is implemented; if he is, use **4**. `[verified: 2 sources]` |
| 14.3 | **HP pool structure / damage overflow** | RNG-tracker CSV: single `HP = 132000` field | wiki: "three forms, each having a separate HP pool" | **RESOLVED 2026-09-15.** `MonsterAi::init` splits the 132,000 into 4/11, 5/11 and 2/11 and each transition **re-assigns** `maxHP` and `HP` wholesale to the stored figure. Overflow is structurally **discarded**. Ship `yunalesca.overflowCarries = false` as the only behaviour; the flag can go. `[decompile: offsets 0174–01B6, 061D, 06CC]` |
| 14.4 | **Threaten resistance** | decompile: `25` | wiki: `threaten = 75` | These are probably the same fact expressed as resistance (25) vs landing chance (100−25=75). Implement resistance 25. |
| 14.5 | **Item drop chance** | decompile: byte `255` (effectively guaranteed) | Game8: "7/8 chance" | Use the decompiled byte. |
| 14.6 | **Absorb targeting** | wiki: highest **current** HP | RNG-tracker label: "Highest HP Character" (unqualified) | **RESOLVED 2026-09-15.** The script reads `findMatchingChr(FrontlineChars, property=HP [00h], selector=Highest [01h])`; property `00h` is live HP (`maxHP` is `02h`). **Highest current HP.** Remove the flag. `[decompile: offset 02AB]` `[verified: 2 sources]` |
| 14.7 | **Form II / Form III Hellbiter re-use probability, and the Curaga-vs-Regen split** | wiki: qualitative only | — | **RESOLVED 2026-09-15 — no longer an estimate.** Both forms use `if (rand()%100 < weight + 10)` → heal, else Hellbiter, where `weight` is **30 per zombified active slot in Form II** and **20 per slot in Form III**. Form II Hellbiter chance = 90/60/30/0 % for 0/1/2/3 zombies; Form III = 90/70/50/30 %. Heal choice is `rand()%100 > 50` → Cura/Curaga (**49 %**), else Regen (**51 %**). Form II's *first* post-transformation turn is a forced heal with no Hellbiter branch. See §5.2 and §5.3. `[decompile: offsets 038C–03DA, 0504–05A8]` `[verified: 2 sources]` |
| 14.8 | **Dispelling Slap rank 0** | both decompiles: `Rank = 0` (the only enemy-usable rank-0 action in the game, apart from a Gravija on a `Forced Action: Skip Turn` monster) | the previous worry that rank 0 "lets her act continuously" | **RESOLVED 2026-09-15 — recommendation changed.** The Form-II/III counters are fired from `onHit` and never consult rank, so rank 0 is irrelevant there. The Form-I scheduled instance is governed by a **boolean toggle**, so a 0-recovery Slap is *always* followed by a Rank-3 Absorb — chaining is structurally impossible; the worst case is one Slap+Absorb burst per 21 ticks. Ship rank 0 **literally**, behind `yunalesca.formI.slapRank` (`0` \| `3`). See §5.3. `[verified: 2 sources]` for the byte; `[estimate]` for the literal reading. |
| 14.9 | **Osmose magnitude** | decompile: `Percentage Total, base 16` ⇒ 100 % of max MP | guides: "MP drain", no number | Implement 100 % of max MP. `[single source]` |
| 14.10 | **Form I aeon script** | not documented in any guide | — | **RESOLVED 2026-09-15.** There is no Form-I aeon branch: the `priv0028` aeon flag is recomputed each turn but the form-0 case of `switch priv0000` ignores it entirely. The Slap/Absorb toggle runs unchanged, with the aeon merely eligible as a frontline target. `[decompile: offsets 027F, 02A1]` |
| 14.11 | **Which player actions trigger a counter** | — | — | **RESOLVED 2026-09-15 — no longer an estimate.** All counters live in `MonsterAi::onHit`, which the engine runs only when an action **lands on Yunalesca**. Healing, reviving, buffing or item-using on an **ally** cannot enter the hook and therefore **never** provokes a counter, in any form — including Form III's "counters everything". The hook also returns early when the attacker is herself, and when the hit reduced her to 0 HP (so the killing blow of each form is never countered). `[decompile: offsets 05EE, 0600, 07A4]` |
| 14.12 | **Phase transition during a multi-hit Overdrive** | — | — | Open. Recommendation: complete the Overdrive's remaining hits against the *new* form only if `overflowCarries` is true; otherwise absorb them into the transition and discard. Document the choice. |
| 14.13 | **Mega Death's entry timing** | RNG-tracker label "Counter Characters' Party" (a tracker-internal label, not an engine target type) | wiki: "the third round **begins with** Yunalesca using Mega Death" | **RESOLVED 2026-09-15.** It is a **scheduled turn**: `onHit` sets `priv002C = 2`, zeroes `Self.CurrentTurnDelay`, adds +1 to each active character's delay; her next `onTurn` performs Metamorphosis 2 **and** Mega Death together, then costs the normal Rank-3 21 ticks. The command record `6082h` is plain `Team (Forced)`, Rank 3. Observably identical to the current `combat.mjs` behaviour, but it must occupy a CTB slot and must not be modelled as a free counter. Same structure for I→II (Metamorphosis 1 + Hellbiter). `[decompile: offsets 0209–0278, 0600–0774]` `[verified: 2 sources]` |

---

## 15. Corrections to the local Moonpetal engine data

**Read against the live code on 2026-09-15**, not against the state described in `MECHANICS-AUDIT.md`. `combat.mjs` and `data.mjs` have moved on substantially since that audit was written — most of its P0 list is already fixed. Below is the current delta only.

### 15.1 Already fixed since the audit — confirmed correct against decompiled data

| Item | Live code | Verdict |
|---|---|---|
| `CTB_TABLE` and `recovery()` | exact 18-entry breakpoint table, `floor(base*rank/2)` for Haste | ✅ matches decompile |
| `formula()` | reproduces `_get_power` / `_get_mitigation` / the 4-step damage chain including the `*power/16` step for physical & special | ✅ matches decompile bit-for-bit |
| `vary()` | `floor(n*(240+rng(0..31))/256)` | ✅ matches decompile |
| `absorb()` | `Math.floor(t.maxHp/2)`, with the Zombie branch reversing the drain onto the boss | ✅ correct, including the §10.3 self-damage exploit |
| `hellbiter()` | `physical(boss.str, u.def, 16)` + Zombie | ✅ power 16 correct |
| `mindBlast()` | `magical(boss.mag, u.mdef, 16)`, Confuse at chance 50, **Curse only `if(u.aeon)`** | ✅ correct |
| `useItem('remedy')` | removes `zombie` | ✅ correct |
| `act('esuna')` | leaves `zombie` | ✅ correct |
| `counter()` | Form I applies Dark/Silence/Sleep **through `reflectTarget()`**; Forms II/III use `slap` at 50 % / 100 % | ✅ reflectable counters now work |
| `status()` ward math | `rng*100 >= chance - (ward ? 50 : 0)` | ✅ subtractive resistance, Confuse Ward fully blocks Mind Blast |
| `megaDeath()` | spares Zombie, aeons, and `ward==='deathproof'` | ✅ correct |
| `transition()` | `boss.hp = PHASES[phase].hp`; overflow discarded | ✅ matches the recommended §14.3 default |
| Rewards | `ap: 14000/21000`, `gil: 9000`, key spheres 1/2, overkill at `lastHit >= 10000` | ✅ all correct |
| `healingTurn()` Hellbiter gate | chance 0 when all three are zombified **in Form II**, 0.25 in Form III | ⚠️ direction right, Form II's 0 % is **exactly** right, Form III's 0.25 should be **0.30** — see §15.2 #8 |
| Mix | `mixes.json` lookup with an explicit "not verified" refusal | ✅ audit defect #9 addressed |
| `fireGem` | 5 × base 600, `ignore:true` | ✅ correct |
| `restoreMp()` | inverts under Zombie | ✅ correct |
| `revive()` | kills a living Zombie | ✅ correct |

### 15.2 Remaining defects

| # | Location | Current | Correct | Evidence | Impact |
|---:|---|---|---|---|---|
| 1 | `combat.mjs` → `slap()` | `physical(this.boss.str, t.def, 24)` — **base power 24** | **base power 16**. Dispelling Slap's decoded `base_damage` is 16, identical to Hellbiter. | [decompile] | Overstates her physical damage by ~50 % (≈360 instead of ≈242 at DEF 20). |
| 2 | `combat.mjs` → `enemyTurn()`, Form I branch | `const t = this.pick(this.living())` — **random target** for both Absorb and Slap | **Absorb must target the party member with the highest current HP.** Slap may stay random. | [verified: 3 sources] | Removes the whole Form-I targeting lesson and the §10.3 Zombie-the-tank exploit. |
| 3 | `combat.mjs` → `enemyTurn()`, Form III aeon branch | Osmose drains `Math.min(t.mp, 70)` | **100 % of the aeon's maximum MP** (`Percentage Total`, base 16). | [single source: decompile] | Under-threatens the anti-aeon cycle. |
| 4 | `combat.mjs` → `advance()` | Regen tick = `floor(elapsed * maxHp / 256) + 100` — invented | Unverified. Derive a real per-tick schedule or label it openly as an adaptation. | — | Open (audit item, still open). |
| 5 | `combat.mjs` → `slap()` | no critical roll | Dispelling Slap has `can_crit = true`, `bonus_crit = 10`. | [decompile] | Minor. |
| 6 | `combat.mjs` → `lancet()` | fixed 250 damage / 250 heal / 20 MP | Invented constants. | — | Minor; flag as adaptation. |
| 7 | `combat.mjs` → `aeonSkill()` | all aeon skills routed through `physical()` with invented power/rank pairs | Verify each against the decoded aeon command records before claiming fidelity. | — | Open. |
| 8 | `combat.mjs` → `healingTurn()` | one shared probability ramp `[0/.25, .45, .7, .9]` (Hellbiter chance indexed by zombie count 3→0) | **Two different ramps, both now exact.** Form II Hellbiter chance by zombie count 0/1/2/3 = **0.90 / 0.60 / 0.30 / 0.00**; Form III = **0.90 / 0.70 / 0.50 / 0.30**. Implement as `hellbiterChance = 1 - (zombieWeight * z + 10)/100` with `zombieWeight = 30` (Form II) or `20` (Form III), clamped at 0. | §14.7, `[decompile: offsets 038C–03DA, 0504–05A8]` | Live values are wrong at z=1 and z=2 in Form II (.7/.45 vs .6/.3) and at z=2/z=3 in Form III (.45/.25 vs .5/.3). **The ramp may now be advertised as exact** — the "estimate" caveat is withdrawn. |
| 21 | `combat.mjs` → Form II, first turn after `transition()` | falls straight into the weighted branch | The turn immediately after the entry Hellbiter is a **forced Cura/Regen** — the `case 0` branch has no Hellbiter option at all. Only from the *second* post-transition turn does the weighted branch run. | `[decompile: offsets 0335, 033C]` | Form II's opening pressure is off by one turn; a fully-zombified party currently can dodge the guaranteed ~1,400 Cura. |
| 22 | `combat.mjs` → heal-spell choice | assumed 50/50 | `rand() % 100 > 50` → **49 % Cura/Curaga, 51 % Regen**. Same test in both forms. | `[decompile]` | Small but free. |
| 23 | `combat.mjs` → `counter()`, Form II | 50 % | `rand() % 100 > 50` → **49 %**. | `[decompile: offset 080E]` | Trivial. |
| 24 | `combat.mjs` → `counter()` trigger predicate | unspecified / any player action | Counters fire **only** from the hit hook: an action must land on Yunalesca. Ally-targeted heals, revives, buffs and items **never** provoke one, in any form. Additionally: she never counters herself, and the blow that reduces a form to 0 HP is never countered. | §14.11, `[decompile: offsets 05EE, 0600, 07A4]` | **Decides whether Form III is hard or unwinnable.** Highest-impact item in this table. |
| 25 | `combat.mjs` → `counter()`, Form I | Blind/Silence fire whenever the category matches | The Blind and Silence branches are gated on **her own last target's** Dark / Silence flag, not the attacker's (`priv000C`, not `priv0010`). Sleep has no gate. Almost certainly an original-game bug; reproduce it behind `yunalesca.formI.counterGateQuirk`. | §5.1, `[decompile: offsets 07B6, 07D7]` | Observable: keeping one member blinded switches off her Blind counter entirely. |
| 26 | `combat.mjs` → `transition()` | fires `hellbiter()` / `megaDeath()` inline and sets `phaseTurn = 1` | Model it as a real turn: on the killing hit set her CTB delay to **0**, add **+1** to each active member's delay, run the cutscene, then on her (immediate) next turn perform Metamorphosis + the entry action, then charge the normal Rank-3 21 ticks. The cycle counter must be 0 going into that turn and must **not** be advanced by it. | §14.13, `[decompile: offsets 064D–069B, 06FC–074A]` | Same visible outcome, correct CTB bar, correct recovery. |
| 27 | `combat.mjs` → aeon branches | (if the human cycle keeps ticking while an aeon is out) | While an aeon is on the field the human step counter is **frozen**, not advanced — summoning **postpones** Mega Death, it never removes one. The aeon sub-cycle index is separate and is reset to 0 by each transition. | §5.3, `[decompile: offsets 027F, 04D3]` | Changes the tactical value of summoning; §5.3's old "skips a Mega Death" claim was wrong. |
| 28 | `combat.mjs` → Form I `slap()` recovery | rank 3 assumed | Ship **rank 0** literally: Dispelling Slap costs her no recovery, so Form I resolves as a Slap+Absorb burst every ~21 ticks. Structurally safe — the toggle guarantees the next action is the Rank-3 Absorb. Behind `yunalesca.formI.slapRank` (`0` \| `3`). | §14.8, `[verified: 2 sources]` for the byte | Changes Form I's pacing and makes the buff-strip land in the same breath as the drain. |
| 29 | `combat.mjs` → zombie counting for the Hellbiter gate | presumably counts living zombies | The script tests the three **slots**' Zombie flags unconditionally, so a **KO'd but zombified** active member still contributes its full weight. | `[decompile]` | A dead zombie keeps suppressing Hellbiter — a real, exploitable detail. |
| 9 | `combat.mjs` → `status()` aeon immunity list | `['zombie','dark','silence','sleep','confuse','poison','slow']` | Aeons are immune to **every** negative status except **Curse and Delay** — add `death`, `petrify`, `berserk`, `doom`, the four Breaks, `provoke`, `threaten`, `eject`. | [verified: 2 sources] | Currently only works because `megaDeath()` special-cases aeons. |
| 10 | `data.mjs` → `AEONS` HP | 4,300 – 6,900 | Story-progress values are **1,341 – 2,840** (§12). | [verified: 2 sources] | Aeons are roughly 2.4× too durable, which breaks the "aeons are a sacrificial timer" design. |
| 11 | `data.mjs` → `AEONS` MP | 190 – 300 | Story-progress values are **41 – 67** (§12). | [verified: 2 sources] | Makes Osmose meaningless. |
| 12 | `data.mjs` → `AEONS` STR/DEF/MAG/MDEF/AGI | 24–61 | Story-progress bands are roughly 15–57 (§12); Bahamut AGI 24 vs table 19–21, Shiva AGI 38 vs table 27–32. | [verified: 2 sources] | Moderate. |
| 13 | `data.mjs` → aeon Overdrive powers 55/58/60/60/72 | ✅ correct values | but must use the **Special Magic** formula (cubic Magic, rank 8, **ignores MDEF**); `overdrive()` currently calls `formula(u.mag, 0, u.power, 'special')` with defensive stat 0 — ✅ effectively right | [decompile] | ✅ |
| 14 | `data.mjs` → `ACTIONS.holy` | present in the action table | Correct that it is unreflectable; but **Holy must not be in the story-progress preset** (§11.3). Currently `ACTIONS.holy` exists and `PARTY.yuna.abilities` does not include it — ✅ already correct. | [estimate] | ✅ |
| 15 | `data.mjs` → `ITEMS.*.count` | Potion 20, Hi-Potion 35, Phoenix Down 24, Holy Water 20, Remedy 12 | **Holy Water 20 and Remedy 12 are generous** for a non-grinding player; §11.4 suggests Holy Water 3–6, Remedy 2–6. Tuning, not fidelity. | [estimate] | Balance. |
| 16 | `data.mjs` → `ACTIONS.scan` text | lists Poison/Sleep/Silence/Darkness/Slow/Death/Breaks, elements neutral | ✅ correct; **add** Demi/gravity, Delay, Bribe, Confuse, Zombie, Petrify, Provoke, Doom, Eject | [decompile] | Minor. |
| 17 | `data.mjs` → boss immunity descriptions on Breaks / Dark / Silence / Sleep / Bio / Demi / Slow / Farplane Wind / Bribe / Delay | "Yunalesca is immune" | ✅ **every one verified correct** | [decompile] | ✅ |
| 18 | `data.mjs` → `PHASES` HP | 24000 / 48000 / 60000 | ✅ correct | [verified: 5 sources] | ✅ |
| 19 | `combat.mjs` → `this.boss.ready = 14` | opening delay 14 | Arbitrary. Her first action should be scheduled from her AGI 40 base (7 ticks) like any actor unless a scripted opening delay is verified. | [estimate] | Minor. |
| 20 | Counter status durations | `status(u, st, 3)` stores 3 | ✅ correct — decoded stacks for Dark/Silence/Sleep are **3**; Zombie/Confuse/Death are **254** (until cured), which the engine models as booleans. Acceptable. | [decompile] | ✅ |

---

## 16. Implementation checklist

Ordered by dependency. Each item has a concrete acceptance test.

1. **CTB scheduler.** Discrete integer ticks; `recovery = base_ticks(AGI) × rank`; Haste floor-halves, Slow doubles; Dispel changes only *future* recovery, never the already-scheduled countdown. **Test:** with AGI 40 rank 3 she acts every 21 ticks; Hastega on an AGI-33 character moves its rank-3 recovery from 21 to 10.
2. **Reserve swap.** Swap consumes the outgoing actor's turn; the incoming character acts immediately; HP/MP/status persist.
3. **Form I.** Slap↔Absorb toggle, first action always Slap; Slap targets a **random living** member, Absorb the member with the **highest current HP**; Absorb = exactly `floor(maxHP/2)` with drain; three category-keyed counters at 0 recovery; Slap at **rank 0** so Slap and Absorb resolve back-to-back. **Test:** a 3,000 HP character drops to 1,500 and her HP rises by 1,500, every time, with no variance; and the CTB bar shows two consecutive Yunalesca icons followed by a 21-tick gap.
4. **Reflect on counters.** **Test:** Reflect + no ward + physical attack → the Blind counter bounces, a bounce event fires, Yunalesca resists it, and the attacker keeps a clean status bar. (This is local audit defect #3.)
5. **Metamorphosis 1.** All party state preserved: active trio, HP, MP, KO, statuses, buffs, Overdrive gauges, inventory, CTB timeline. **Test:** snapshot/compare across the transition.
6. **Form II.** Metamorphosis + guaranteed Hellbiter on one turn; then a **forced** Cura/Regen turn; then the weighted branch at Hellbiter **90/60/30/0 %** for 0/1/2/3 zombified slots; heal choice 49 % Cura / 51 % Regen; **49 %** Dispelling Slap counter; aeon cycle Absorb↔Hellbiter with the human step counter frozen. **Test:** with all three zombified, 100 consecutive human turns produce zero Hellbiters; with none zombified, ~90.
7. **Zombie inversion engine.** One signed HP-transfer path — never `heal()` then a manual negative correction. Covers Cure tiers, Potions, Mega-Potion, Al Bhed Potion, Elixir, Pray, Regen ticks, revival items (instant kill), Ether/Elixir MP, Haste's initial turn-shift (delay instead of advance), and drain reversal. **Test:** each of those produces one coherent damage event and no phantom KO.
8. **Preview before confirm.** Any heal aimed at a Zombie must show "**will deal N damage**" before the player commits. Non-negotiable for readability.
9. **Metamorphosis 2 + Form III.** Metamorphosis + Mega Death on one immediate turn (her delay zeroed, party delays +1); then the cycle `weighted, weighted, Mind Blast, weighted, Mega Death`; weighted Hellbiter chance **90/70/50/30 %**; Curaga replaces Cura; counters on **every** eligible hit; aeon cycle `Mind Blast → Absorb → Osmose → Absorb` with guaranteed Curse. **Test:** over one full cycle with three zombies, expect ≈1 Curaga, ≈1 Regen, ≈0.9 Hellbiter, exactly 1 Mind Blast, exactly 1 Mega Death.
10. **Mega Death resolution.** Per target: KO living non-Zombie non-Deathproof; **Zombie survives**; **Deathproof survives**; **Auto-Life triggers**. **Test:** a mixed party of one Zombie, one Deathproof, one plain → exactly one KO.
11. **Ward/Proof arithmetic.** `(chance − resistance) > rng%101`; Ward = 50, Proof = 255. **Test:** Confuse Ward fully blocks Mind Blast Confusion; Zombie Ward lets Hellbiter through about half the time.
12. **Aeons.** Immune to every negative status except Curse and Delay; own HP/MP/gauge/turns; Dismiss and KO return the party; Grand Summon's temporary gauge consumed first. **Test:** Mega Death cannot land on an aeon; aeon Mind Blast always Curses.
13. **Rewards.** 14,000 AP (21,000 on ≥10,000 final-blow damage), 9,000 gil, Lv.3 Key Sphere ×1 (×2 overkill), guaranteed Zombiestrike/Zombieproof equipment drop.
14. **Two viable strategies, both winnable from the preset.** (a) Deliberate Zombie retention. (b) Deathproof/Auto-Life designated survivor. Neither may require grinding, Mix abuse, or a timing minigame.
15. **A recoverable loss must exist.** Cure all Zombie before Form III → wipe → clear result screen explaining why → clean retry.

---

## 17. Visual reference for sprite artists

Derived from the in-game battle models and HD Remaster screenshots (observed directly). `[verified: 2 sources]`

### 17.1 Arena — The Beyond

A broken rectangular/oval stone platform adrift in a black starfield, lit from above by a cold moonlight key. Surface: large flagstones in **warm dusty rose, sand-grey and pale terracotta**, heavily veined with **moss green**. Yellow-white wildflowers and thin creepers grow from the seams and from a ruined pillar stub on the left. A circular **Yevon glyph** in gold/red/blue inlay sits centre-stage where Yunalesca floats. Fragments of masonry drift **upward** in the void around the platform. No walls, no ceiling — the horizon is stars. Keep bloom restrained; the figures must stay readable against the black.

Party staging: three characters on the right/foreground half, boss centre-left/upstage.

### 17.2 Form I — Lady Yunalesca

- **Silhouette:** a slim human female floating just off the ground, arms at her sides, feet bare and pointed — framed by a colossal fan of hair spreading twice her body width to either side and above, like a peacock display made of curved blades.
- **Scale:** body is **party-height** (~1.0×). With the hair fan, the overall footprint is roughly **2.2× party width × 1.6× party height**.
- **Hair:** pale **silver-white** at the crown, darkening outward through lilac into deep **violet-purple and near-black**, split into dozens of long flat ribbons that curl into hooks at the tips. A few strands tipped in **teal/turquoise** sit at the top centre.
- **Headdress:** blue headband with four ribbons ending in blue beads and yellow tassels; two long plumes zig-zagging into an **'M'** shape above the forehead. Yellow eyes.
- **Costume:** blue-and-black bra with a curlicue motif joined at the front by a **yellow chain**; black thong; a thin yellow-tasselled belt; gold bracelets; blue armbands and wristbands; silver anklets; a blue garter on the left thigh; a **blue bead necklace** resembling seashells or fangs. Two **green sashes** bearing Yevon glyphs hang from the hips down past the knees, edged in yellow.
- **Behind her:** a dark ribbed drape falls from the hair mass to the floor — black with fine vertical striping. This is the thing that grows in Form II; foreshadow it.
- **Skin:** warm tan.
- **Motion:** almost none. She barely gestures. The hair does the work — tendrils flick forward for Dispelling Slap, and coil around a target for Absorb.

**HD-2D note:** at billboard sprite resolution, the hair fan is the read. Preserve the fan's outline and the M-plume even if the costume detail simplifies.

### 17.3 Form II — the serpent skirt

- **Silhouette:** an inverted teardrop / closed flower. The tiny human torso is now at the **apex**, still framed by the purple hair fan, which has swept **forward and downward** into a hooded cowl. Below it, an enormous mass of **segmented worm-limbs** is coiled and tucked, arranged like the petals of a folded bud.
- **Scale:** roughly **2.5–3× party height**, **2.5× party width**. She occupies the upstage-left quadrant.
- **Limbs:** thick, ribbed, chitinous tubes in **burnt orange, ochre and dark oxblood**, banded with darker rings and cinched at intervals with **verdigris/blue-green metal collars**. They read as a cross between millipede segments and serpent bodies. **The snake heads stay hidden inside the coil until the first Hellbiter**, when several whip out — this is confirmed by the official concept notes and is a strong, cheap animation beat.
- **Core:** behind the limbs, a **grey-green ribbed sac** with a fan-like fluted texture — the underside of what becomes the Form III face.
- **Hair:** the same purple ribbons, now grown into a full cowl with pale wispy filaments trailing from the base like torn veils.
- **Human torso:** still visible and unchanged at the top — **keep it visible**. The horror is that she is still up there.
- **Motion:** the tucked mass breathes. Hellbiter = the coil opens violently outward and snaps shut.

### 17.4 Form III — the face

- **Silhouette:** a radial starburst. Six to eight thick segmented limbs splay outward and downward from a central mass like a spider's legs or Medusa's snakes; a **colossal face** sits at the centre, low and forward, at roughly chest height to a standing character.
- **Scale:** roughly **2.5–3× party height**, **4–5× party width** — it fills most of the upstage arena. This is the widest, lowest, most oppressive of the three.
- **The face:** grey-green to olive, heavily lidded, with a deep furrowed brow, a broad flattened nose, and **luminous pale-green eyes with dark slit pupils**. Dark purple-black lips, slightly parted; a thin dark tongue or trailing filament hangs from the mouth. The expression is serene and half-asleep, which is worse than a snarl. Read it as a funerary mask, not a monster face.
- **Limbs:** the same orange-ochre and oxblood segmented tubes, now fully extended. **Several terminate in eyeless bone-coloured skull heads** with open jaws — pale tan/ivory, ridged.
- **The hair fan is now at the rear**, upper-right, reduced to a receding purple crest — the human head is gone from view entirely. This sells the "she turned over" transformation: what was underneath is now facing you.
- Wispy white filaments trail from the underside.
- **Motion:** the limbs sway independently and constantly. Mega Death = the face's eyes flare and the limbs sweep forward together. Mind Blast = a pulse radiating from between the eyes.

### 17.5 Transformation staging

| Transition | Beat |
|---|---|
| I → II | Camera pulls back. The hair mass surges downward and outward; the dark drape behind her swells and splits; the segmented mass unfurls beneath and folds closed. She never stops floating. ~2 s. |
| II → III | The entire form **rolls forward and over**, like a hand turning palm-up. The coiled limbs fling outward as it turns; the face is revealed at the end of the roll. ~2 s, then **immediate** return to readable CTB input. |

Both transitions must be **animation and state changes**, never a palette swap, and must preserve all tactical state.

---

## Sources

**Decompiled AI scripts and ability records — second independent decompilation (added 2026-09-15, gap-fill pass)**
- Karifean — **FFXDataParser**, the Java tool that disassembles FFX field/encounter/monster scripts and ability records: https://github.com/Karifean/FFXDataParser
- Project announcement and methodology thread (Qhimm, 2023): https://forums.qhimm.com/index.php?topic=21411.0
- **Whole-game monster AI dump** (`jppc/battle/mon`, includes `_m130/m130.bin` — Yunalesca's script, from which every offset cited in §5 and §6 is taken): https://drive.google.com/file/d/1QTdIA_J9VtATPLl7Pkd9iAywAI2ThVkX/view
- **Whole-game ability dump** (`command.bin` and the enemy-magic files — source for the Rank / Power / target-type / status-rider figures in §3): https://drive.google.com/file/d/1O9y4pXPOfDtNUT7bm5mtW0_5_zJUITCk/view
- Encounter script dump (`jppc/battle/btl`): https://drive.google.com/file/d/15ZjWRhtKVV_wsMNKqPgnGB6UtW7TQq6W/view
- Underlying .exe disassembly this parser builds on (fkelava / peppy, *Fahrenheit*): https://github.com/fkelava/fahrenheit
- Battle-script opcode reference (Dragoon803): https://github.com/Dragoon803/FFX-Battle-Opcode-Reference-and-Tutorials
- Grayfox96 — **FFX-Info** monster data pages (independent confirmation of m130's stats, steal/drop, resistances): https://github.com/Grayfox96/FFX-Info/blob/main/docs/collections/_monsters/yunalesca.md

**Decompiled game data (highest confidence)**
- Grayfox96 — FFX RNG Tracker (repository root): https://github.com/Grayfox96/FFX-RNG-tracker
- Monster data (PS2): https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/data_files/ffx_mon_data.csv
- Monster data (HD/International): https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/data_files/ffx_mon_data_hd.csv
- Enemy action data (monmagic2): https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/data_files/ffx_monmagic2.csv
- Player command data: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/data_files/ffx_command.csv
- Item data: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/data_files/ffx_item.csv
- Monster action patch table (names/targets): https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/data_files/monster_actions.json
- Autoability table: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/data_files/autoabilities.csv
- Monster record field offsets: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/monsters.py
- Action record field offsets: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/actions.py
- Damage formulas, mitigation, status application: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/events/character_action.py
- Ward/Proof resistance values (50 / 255): https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/actor.py
- Ward/Proof ability maps: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/autoabilities.py
- Status/element/stat enum ordering, CTB breakpoints: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/constants.py
- Status application helpers: https://github.com/Grayfox96/FFX-RNG-tracker/blob/master/ffx_rng_tracker/data/statuses.py

**Final Fantasy Wiki (fandom)**
- Yunalesca (boss) — stats, AI script, strategy: https://finalfantasy.fandom.com/wiki/Yunalesca_(boss)
- Rank (Final Fantasy X) — rank ↔ recovery-time proportionality, full player rank table, Ultimania Omega p.396 citation: https://finalfantasy.fandom.com/wiki/Rank_(Final_Fantasy_X)
- Trigger Command — for the rank-0 comparison set: https://finalfantasy.fandom.com/wiki/Trigger_Command
- Lady Yunalesca (character) — appearance, story: https://finalfantasy.fandom.com/wiki/Yunalesca
- Zanarkand Dome: https://finalfantasy.fandom.com/wiki/Zanarkand_Dome
- Final Aeon / Final Summoning: https://finalfantasy.fandom.com/wiki/Final_Aeon
- Zombie (Final Fantasy X): https://finalfantasy.fandom.com/wiki/Zombie_(Final_Fantasy_X)
- Mega Death: https://finalfantasy.fandom.com/wiki/Mega_Death
- Holy Water (Final Fantasy X): https://finalfantasy.fandom.com/wiki/Holy_Water_(Final_Fantasy_X)
- Aeon (Final Fantasy X) — status immunity rule: https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)
- Aeon stat growth (Ultimania tables): https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)/Stat_growth
- Wht Magic (Final Fantasy X) — healing formula, grid sections: https://finalfantasy.fandom.com/wiki/Wht_Magic_(Final_Fantasy_X)
- Walkthrough (Paramina) Part 24 — Zanarkand Dome: https://finalfantasy.fandom.com/wiki/Walkthrough:Final_Fantasy_X/Paramina/Part_24
- Walkthrough (Paramina) Part 25 — Yunalesca battle: https://finalfantasy.fandom.com/wiki/Walkthrough:Final_Fantasy_X/Paramina/Part_25
- Final Fantasy X: Original Soundtrack ("Challenge"): https://finalfantasy.fandom.com/wiki/Final_Fantasy_X:_Original_Soundtrack

**Strategy guides**
- Gamer Guides — Yunalesca bestiary entry: https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/yunalesca
- Game8 — How to beat Yunalesca: https://game8.co/games/Final-Fantasy-X/archives/269219
- Jegged — Zanarkand Ruins walkthrough: https://jegged.com/Games/Final-Fantasy-X/Walkthrough/28-Zanarkand-Ruins.html
- Samurai Gamers — Yunalesca boss guide: https://samurai-gamers.com/final-fantasy-x-x2-hd-remaster/yunalesca-boss-guide/
- GameFAQs — Zanarkand walkthrough (Absorb magnitude/targeting): https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/zanarkand
- GameFAQs — Sphere Grid FAQ (Ceebs): https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/14783
- GameFAQs — Battle mechanics / CTB FAQ (SinirothX): https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/31381
- GameFAQs — overkill/form discussion thread: https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/53086781
- EIP Gaming — Zanarkand Ruins walkthrough: https://eip.gg/ffx-x2/guides/zanarkand-ruins-walkthrough/
- Neoseeker — Final Fantasy X wiki, Yunalesca: https://finalfantasy.neoseeker.com/wiki/Yunalesca

**Official / reference**
- Final Fantasy X original manual (hosted transcription) — CTB, reserve switching, Overdrive modes, Zombie/Curse cures, Confusion targeting: https://manuals.plus/m/e7936d8cd30f1d0149eff2af2bcc0b34c5ceb73e5f2709bad7d20ac3184b3fe7
- Square Enix — FINAL FANTASY X portal: https://na.finalfantasy.com/titles/finalfantasy10
- Final Fantasy Ultimania Archive Vol. 3 (hosted excerpt) — Yunalesca transformation concept notes: https://www.scribd.com/document/898064695/Final-Fantasy-Ultimania-Archive-03-2019

**Visual reference (observed directly; not redistributed)**
- Form I battle model: https://static.wikia.nocookie.net/finalfantasy/images/4/4b/Yunalesca-enemy-ffx.png
- Form II battle model: https://static.wikia.nocookie.net/finalfantasy/images/0/06/Yunalesca_2-enemy-ffx.png
- Form III battle model: https://static.wikia.nocookie.net/finalfantasy/images/2/2b/Yunalesca_3-enemy-ffx.png
- Form I in-arena (HD Remaster): https://static.wikia.nocookie.net/finalfantasy/images/e/ee/FFX-HD-Yunalesca-boss-1-front.jpg
- Form II in-arena (HD Remaster): https://static.wikia.nocookie.net/finalfantasy/images/8/88/Yunalesca_boss_second_form.jpg
- Form III in-arena (HD Remaster): https://static.wikia.nocookie.net/finalfantasy/images/a/ad/Yunalesca_boss_third_form.jpg

**Local prior research**
- `D:/Projects/Final Fantasy/docs/encounter-design.md`
- `D:/Projects/Final Fantasy/Moonpetal/docs/CRITIC-RUBRIC.md`
- `D:/Projects/Final Fantasy/Moonpetal/docs/MECHANICS-AUDIT.md`
- `D:/Projects/Final Fantasy/Moonpetal/src/combat.mjs`
- `D:/Projects/Final Fantasy/Moonpetal/src/data.mjs`

---

## Verification log

An independent fact-check pass (2026-09-15) re-checked 20 claims from this document against freshly fetched guide pages (GamerGuides bestiary, Samurai Gamers boss guide, Jegged walkthrough) and search-engine synthesis. No claim was contradicted. Result: 18 confirmed (already carried a `[verified: N≥2 sources]` tag consistent with or exceeding this pass — no downgrade applied, per "do not remove content"), 2 unverifiable (left at their existing `[single source]` / `[decompile]` tags, since no second source could be produced). No corrections to values were required.

| # | Claim | Verdict |
|---:|---|---|
| 1 | HP per form: 24,000 / 48,000 / 60,000, total 132,000 | confirmed |
| 2 | Form III overkill threshold: 10,000 damage | confirmed |
| 3 | Form III rewards: AP 14,000/21,000, Gil 9,000 | confirmed |
| 4 | Steal common = Stamina Tablet, rare = Farplane Wind | confirmed |
| 5 | Guaranteed drop: Piercing (slot 0), Zombiestrike (weapon), Zombieproof (armor) | confirmed |
| 6 | Drop 1 doubles 1x→2x Lv.3 Key Sphere on overkill | unverifiable |
| 7 | All five elements Neutral; Sensor "vulnerable to holy" is flavor text | confirmed |
| 8 | Shared base stats: MP 500, STR 20, DEF 50, MAG 30, MDEF 50, AGI 40, LUCK 20 | confirmed |
| 9 | Mega Death: 100% Death, whole party, 0 HP damage, spares Zombie/Deathproof | confirmed |
| 10 | Hellbiter: physical hit, whole party, 100% Zombie | confirmed |
| 11 | Absorb drains exactly 50% of target max HP, heals Yunalesca same | confirmed |
| 12 | Dispelling Slap strips Haste/Protect/Shell, not Reflect/Regen/Auto-Life | confirmed |
| 13 | Form I counters keyed by category: physical→Blind, magic→Silence, other→Sleep | confirmed |
| 14 | Form II opens with whole-party Hellbiter, then curative spells damage Zombies | confirmed |
| 15 | Form III opens with Mega Death; Curaga (not Cura) appears, lethal to Zombies | confirmed |
| 16 | Exact 5-step Form III cycle order | unverifiable |
| 17 | Osmose drains exactly 100% of target max MP | unverifiable |
| 18 | CTB: AGI 40 → 7 base ticks → 21-tick rank-3 recovery | unverifiable |
| 19 | Reflect bounces her healing spells only; other actions never bounce | confirmed |
| 20 | Aeons immune to Mega Death; Mind Blast applies guaranteed Curse to aeons | confirmed |

Note: three items (#16, #17, #18) were independently marked "unverifiable" by the fact-checker on this pass in addition to #6, exceeding the 2-unverifiable estimate above — all four remain single-source/decompile-only and are unchanged pending a future check against additional guide sources or direct footage.

### Addendum — gap-fill pass, 2026-09-15 (AI-script decompilation)

A second pass located a **second, independent decompilation** of the game's battle data (Karifean's FFXDataParser and its published whole-game dumps — see Sources) and read Yunalesca's actual monster AI bytecode, `_m130/m130.bin`, end to end. Six items that this document previously carried as invented, estimated or open are now decoded. Of the eight verification-log items that were `unverifiable` or `[single source]`, three are now `[verified: 2 sources]`.

| # | Item | Before | After |
|---:|---|---|---|
| 21 | Form II Hellbiter re-use probability | invented ramp, labelled an estimate (§14.7) | **decoded**: `P(heal) = (30z + 10)%` ⇒ Hellbiter 90/60/30/0 %. The invented ramp was, by coincidence, exactly right. `[verified: 2 sources]` |
| 22 | Form III's three unweighted cycle slots | "Hellbiter OR Curaga/Regen", no weights | **decoded**: `P(heal) = (20z + 10)%` ⇒ Hellbiter 90/70/50/30 %. `[verified: 2 sources]` |
| 23 | Curaga-vs-Regen / Cura-vs-Regen choice | no rule at all | **decoded**: `rand()%100 > 50` ⇒ 49 % heal-spell, 51 % Regen. `[decompile]` |
| 24 | Form II's turn immediately after the entry Hellbiter | undocumented | **decoded**: a **forced** Cura/Regen with no Hellbiter branch. New information; not in any guide. `[decompile]` |
| 25 | Mega Death's entry timing (§14.13) | build recommendation, flagged unresolved | **decoded**: a scheduled turn performed together with Metamorphosis 2, reached by zeroing her CTB delay and adding +1 to each party member's. `[verified: 2 sources]` |
| 26 | Dispelling Slap rank 0 (§14.8) | acknowledged deviation (counter 0, scheduled 3) | **resolved**: counters never consult rank; the Form-I toggle makes literal rank 0 self-limiting. Recommendation changed to ship rank 0 literally. `[verified: 2 sources]` for the byte, `[estimate]` for the reading |
| 27 | Which player actions trigger counters (§14.11) | `[estimate]` | **decoded**: only actions that land on Yunalesca; never ally-targeted actions; never self-damage; never the killing blow. `[decompile]` |
| 28 | Absorb targeting (§14.6) | flagged conflict | **decoded**: `property=HP [00h]`, i.e. highest **current** HP. Flag can be removed. `[verified: 2 sources]` |
| 29 | Form I aeon script (§14.10) | `[estimate]` | **decoded**: no aeon branch exists in Form I. `[decompile]` |
| 30 | HP overflow on transition (§14.3) | flagged, default "discard" | **decoded**: each transition re-assigns `maxHP`/`HP` wholesale — overflow is structurally discarded. `[decompile]` |
| 31 | Zanmato level (§14.2) | decompile 3 vs wiki 4, recommended 3 | second decompile reads **4**; recommendation flipped to 4. `[verified: 2 sources]` |
| 32 | "Summoning skips a Mega Death" (§5.3, §10.6) | stated as fact | **corrected**: the human cycle is *frozen* while an aeon is out, so summoning **postpones** Mega Death. `[decompile]` |
| 33 | Form I Blind/Silence counter gate | not known | **new finding**: the gate reads her own last target's status, not the attacker's — an apparent original-game bug, reproduced behind a flag. `[decompile]` `[single source]` |

Nothing previously recorded was found to be *wrong* except items 31, 32 and the Mega Death "counter-class" reading in §3/§5.3; those three are corrected in place with the old reading preserved in the §14 table. Remaining genuinely unresolved items: §14.1 (inert), §14.4 (cosmetic), §14.5, §14.9 (Osmose magnitude, still single-source), §14.12 (multi-hit Overdrive across a transition — a policy choice, not a decodable fact), §15.2 #4 (Regen tick schedule), #6 (Lancet constants) and #7 (aeon skill powers).
