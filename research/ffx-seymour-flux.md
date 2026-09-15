# FINAL FANTASY X — Seymour Flux (Mt. Gagazet): Implementation Reference

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, HD-2D billboard sprites over 3D dioramas)
**Encounter:** Boss #3 of the Seymour line — Seymour Flux + Mortiorchis, Mt. Gagazet (Prominence)
**Research date:** 2026-09-15
**Bestiary entries:** #150 Seymour Flux, #151 Mortiorchis

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

| Tag | Meaning |
|---|---|
| `[decompiled]` | Byte-level value read directly out of the game's `ffx_mon_data` / `ffx_command` / `ffx_monmagic2` tables via the Grayfox96 FFX-RNG-Tracker data files (Karifean decompilations, Rossy__ mon-data). Highest confidence available short of running the game. |
| `[verified: 2 sources]` | Two independent sources agree. |
| `[single source]` | One source only. |
| `[derived]` | Computed by me from `[decompiled]` constants using the decompiled damage formula, and cross-checked against at least one guide's observed number. |
| `[estimate]` | Authored design judgement. Not a measured fact. Must be labelled as such in-product. |

### 0.2 What I actually did

1. Read the two local prior-research files first. **Neither contains Seymour Flux data** — both are scoped to the Yunalesca encounter (`D:/Projects/Final Fantasy/docs/encounter-design.md` deep-spec A; `D:/Projects/Final Fantasy/CrystalReverie/Docs/FFX_MECHANICS_NOTES.md`). No conflicts to record against them, but §4.1 below re-uses their CTB/status vocabulary so the two chapters can share a combat core.
2. Pulled the decompile-derived monster table, action tables, item table and text-character table from `Grayfox96/FFX-RNG-tracker` and parsed them with the repository's own field offsets (`data/monsters.py`, `data/actions.py`). This is the authoritative layer.
3. Cross-checked against the Final Fantasy Wiki (fetched through the MediaWiki API — the normal HTML endpoint returns HTTP 402), GamerGuides, Game8, Jegged and a Steam community guide.
4. Reimplemented the decompiled damage formula (`_get_power`, `_get_mitigation`, `get_damage`) and computed the damage tables in §5. Those computed numbers **independently reproduce** the ~2,000 Cross Cleave and ~4,000 Total Annihilation figures that guides report from play, which validates both the formula port and the stat attribution. Details in §5.4.

### 0.3 Naming conflict you must resolve in code

The Flux fight's companion is **Mortiorchis** (`m143`), not Mortibody. **Mortibody** (`m127`) is a *different* enemy — it accompanies **Seymour Natus** in the earlier Bevelle/Via Purifico fight. The task brief attributed **Shattering Claw**, **Desperado** and **Cross Cleave** to "Mortibody"; the decompiled action lists show:

| Ability | Actually belongs to |
|---|---|
| Shattering Claw | **Mortibody** (`m127`, Seymour **Natus** fight) — *not present in the Flux fight* |
| Desperado | **Mortibody** (`m127`, Seymour **Natus** fight) — *not present in the Flux fight* |
| Cross Cleave | **Seymour Flux's** action list (`m142`); animated on Mortiorchis |
| Mortibsorption | Both Mortibody and Mortiorchis have it (`action 169`) |
| Full-Life, Total Annihilation, Slowga | **Seymour Flux's** action list (`m142`); animated on Mortiorchis |

Mortibody/Natus data is included in §3.4 as a reference appendix only, since the brief asked for it — but **do not ship Shattering Claw or Desperado in the Flux encounter.** `[decompiled]`

---

## 1. Enemy stat block — Seymour Flux (`m142`, bestiary #150)

### 1.1 Core stats

| Field | Value | Confidence |
|---|---:|---|
| HP | **70,000** | `[decompiled]` + wiki + GamerGuides + Game8 `[verified: 2 sources]` |
| MP | **512** | `[decompiled]` + wiki |
| Overkill threshold | **3,500** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Strength | **30** | `[decompiled]` + wiki |
| Defense | **40** | `[decompiled]` + wiki |
| Magic | **15** | `[decompiled]` + wiki |
| Magic Defense | **40** | `[decompiled]` + wiki |
| Agility | **38** | `[decompiled]` + wiki |
| Luck | **15** | `[decompiled]` + wiki |
| Evasion | **0** | `[decompiled]` + wiki |
| Accuracy | **100** | `[decompiled]` + wiki |
| AP (normal kill) | **10,000** | `[decompiled]` + wiki `[verified: 2 sources]` |
| AP (overkill) | **15,000** | `[decompiled]` + wiki |
| Gil | **6,000** | `[decompiled]` + wiki |
| Armored | **No** | `[decompiled]` |
| Zanmato level | 4 (byte 402) | `[decompiled]` |
| Doom turns | 3 | `[decompiled]` |
| Poison tick | **2% of max HP = 1,400 per turn** | `[decompiled]` + wiki `[verified: 2 sources]` |

### 1.2 Elemental affinities

**All five elements NEUTRAL.** Fire / Ice / Thunder / Water / Holy — no weakness, no resistance, no absorb, no immunity. `[decompiled]`

> Game8's summary claiming "resists all elements at 100%" is a **misreading of a 100% = neutral multiplier**. The decompiled affinity bitfields (bytes 43–46) are all zero. Conflict recorded; trust the decompile. Practical consequence: **there is no elemental puzzle in this fight.** Elemental strikes on weapons do nothing special.

### 1.3 Status resistance table

Byte value semantics: `0` = no resistance (roll proceeds normally), `1–254` = percentage resistance, `255` = flat immune.

| Status | Value | Effect | Confidence |
|---|---:|---|---|
| **Poison** | **90** | Landable. This is the single most important vulnerability. | `[decompiled]` + wiki |
| **Silence** | **50** | Landable. Shuts off Flare / Reflect / Dispel / Protect. | `[decompiled]` + wiki |
| **Threaten** | **0** | *Byte reads 0 (landable) per the decompile, but BOTH the Final Fantasy Wiki AND Game8 (fetched directly, "GUARD"/resisted category) independently describe Flux as immune/resistant to Threaten.* CONFLICT — two guide sources vs. one decompiled source; the decompile is still the recommended default (see rule in §0.1) but this is explicitly an unresolved two-source-vs-one-source disagreement, not a settled misreading. See §9 conflict C-2. | **conflict — unresolved, do not treat as settled** |
| Death | 255 | Immune | `[decompiled]` |
| Zombie | 255 | Immune | `[decompiled]` |
| Petrify | 255 | Immune | `[decompiled]` |
| Sleep | 255 | Immune | `[decompiled]` |
| Dark | 255 | Immune | `[decompiled]` |
| Confuse | 255 | Immune | `[decompiled]` |
| Berserk | 255 | Immune | `[decompiled]` |
| Provoke | 255 | Immune | `[decompiled]` |
| Slow | 255 | Immune | `[decompiled]` |
| Doom | 255 | Immune | `[decompiled]` |
| Power Break | 255 | Immune | `[decompiled]` |
| Magic Break | 255 | Immune | `[decompiled]` |
| Armor Break | 255 | Immune | `[decompiled]` |
| Mental Break | 255 | Immune | `[decompiled]` |
| Eject | 255 | Immune | `[decompiled]` |
| Auto-Life | 255 | Cannot be given Auto-Life | `[decompiled]` |
| Haste / Slow / Shell / Protect / Reflect / Regen / Scan / NulAll | 0 | **Landable** — the player *can* Haste him (see §6.6) and *can* Dispel him | `[decompiled]` |

**Other immunity flags (bytes 40–41):** immune to percentage/fractional damage (Demi), immune to Delay, immune to Slice (Zanmato-class instant kill from the Slice family), immune to Bribe. **Not** immune to Sensor or Scan. **Not** immune to Life-type effects... actually `immune_to_life` is *unset* on Flux (unlike every other Seymour form), which is a flavour quirk with no practical consequence. `[decompiled]`

### 1.4 Rewards

| Reward | Value | Confidence |
|---|---|---|
| Common drop | Lv. 4 Key Sphere ×1 (×2 on overkill) | `[decompiled]` + wiki `[verified: 2 sources]` |
| Rare drop | Lv. 4 Key Sphere ×1 (×2 on overkill) | `[decompiled]` + wiki |
| Drop chance | 255 (guaranteed) | `[decompiled]` |
| Common steal | Elixir ×1 | `[decompiled]` + wiki `[verified: 2 sources]` |
| Rare steal | Elixir ×1 | `[decompiled]` + wiki |
| Steal base chance | 255 (guaranteed) | `[decompiled]` |
| Bribe | **Impossible** (`immune_to_bribe` set) | `[decompiled]` |
| Equipment drop | Drop rate 256; 1–4 slots, 1–2 abilities. Weapon rolls **Piercing / Darkstrike**; armor rolls **SOS Shell**. | wiki `[single source]` |
| Ronso Rage (Lancet) | **None** — `ronso_rage_id = 0`. Kimahri learns nothing from Flux. | `[decompiled]` |

### 1.5 Scan / Sensor text (paraphrase — use as UI copy inspiration, do not copy verbatim)

Sensor warns about their combo attacks. Scan tells the player to read Mortiorchis's next move off Seymour's last one: Lance of Atrophy causes Zombie, and Mortiorchis follows with Full-Life; together they unleash Total Annihilation. The bestiary entry also flags: enemy is Tough, immune to Eject, and **the party cannot escape**. `[single source: wiki]`

---

## 2. Enemy stat block — Mortiorchis (`m143`, bestiary #151)

| Field | Value | Confidence |
|---|---:|---|
| HP | **4,000** (initial; see Mortibsorption, §2.2) | `[decompiled]` + wiki `[verified: 2 sources]` |
| MP | 512 | `[decompiled]` + wiki |
| Overkill threshold | 36,000 (unreachable — effectively never overkilled) | `[decompiled]` + wiki |
| Strength | **40** | `[decompiled]` + wiki |
| Defense | **100** | `[decompiled]` + wiki |
| Magic | **40** | `[decompiled]` + wiki |
| Magic Defense | **0** (formula clamps to 1; wiki prints "1") | `[decompiled]` |
| Agility | **38** | `[decompiled]` + wiki |
| Luck | 15 | `[decompiled]` + wiki |
| Evasion | 0 | `[decompiled]` + wiki |
| Accuracy | 100 | `[decompiled]` + wiki |
| AP | **0** | `[decompiled]` + wiki |
| Gil | 0 | `[decompiled]` |
| **Armored** | **YES** | `[decompiled]` + wiki `[verified: 2 sources]` |
| Drops / steals / bribe | **None** (drop chance 0, steal chance 0, bribe-immune) | `[decompiled]` |
| Zanmato level | 4 | wiki `[single source]` |
| Poison tick | 0% — **poison does nothing to it** | `[decompiled]` |

### 2.1 Mortiorchis status table

Effectively immune to everything meaningful: Death, Zombie, Petrify, **Poison**, Sleep, Silence, Dark, Confuse, Berserk, Provoke, Threaten, Slow, **Haste**, Doom, Eject, Auto-Life, all four Breaks. Landable: Shell, Protect, Reflect, Regen, Scan, Nul-statuses (0 resistance, but the player has no reason to buff it). `[decompiled]`

Additional flags: immune to percentage damage, **immune to Delay**, immune to Slice, immune to Bribe. **Not** flagged `immune_to_life`. `[decompiled]`

> **Armored** means non-Piercing physical damage is heavily reduced *and* Defense 100 is applied. Piercing weapons (Auron's katanas, Kimahri's spears, Ifrit/Ixion/Shiva/Bahamut's aeon weapons) bypass both. Magic effectively ignores Armored and hits against MDef 1, so **magic is the efficient way to kill Mortiorchis**. `[decompiled]` + wiki `[verified: 2 sources]`

### 2.2 Mortibsorption — the HP-transfer mechanic (exact)

Decompiled action `monmagic2 #169`, `damage_formula = HP`, `base_damage = 10`, `drains = true`, `target = M1` (monster slot 1 = Seymour Flux).

The `HP` damage formula in the decompile is:

```
damage = user.max_hp * base_damage / 10
```

With `base_damage = 10` this reduces to `damage = Mortiorchis.max_hp`. Because `drains = true`, the same amount is restored to Mortiorchis. So:

**When Mortiorchis's HP reaches 0, it immediately uses Mortibsorption: it deals damage equal to its own current *max* HP to Seymour Flux, heals itself for that same amount, and then its max HP drops by 1,000 for the next cycle — down to a floor of 1,000, which it never goes below.**

| Use # | Mortiorchis max HP going in | HP drained from Seymour | Mortiorchis max HP after | Confidence |
|---:|---:|---:|---:|---|
| 1 | 4,000 | **4,000** | 3,000 | `[decompiled]` + wiki `[verified: 2 sources]` |
| 2 | 3,000 | **3,000** | 2,000 | `[decompiled]` + wiki `[verified: 2 sources]` |
| 3 | 2,000 | **2,000** | 1,000 | `[decompiled]` + wiki `[verified: 2 sources]` |
| 4 | 1,000 | **1,000** | **1,000 (floor — does NOT decay to 0)** | `[verified: 2 sources — FF Wiki *Final Fantasy X enemy abilities* master table, "First use absorbs 4,000 HP, second 3,000 HP, third 2,000 HP, and 1,000 HP onward"; GamerGuides Seymour Flux page, "decreases by 1,000 HP until reaching a minimum threshold of 1,000 HP"]` |
| 5, 6, 7 … ∞ | 1,000 | **1,000 each** | 1,000 | `[verified: 2 sources]` — same two sources; the FF Wiki *Mortibody* page states the identical mechanic as "decreases in increments of 1,000 until it **caps at 1,000**" |
| — | **Total transferable: unbounded.** First four kills yield 10,000; every kill thereafter yields another 1,000. | | | `[derived]` from the rows above |

> ### ⚠ CORRECTION (2026-09-15 gap-fill pass) — Mortiorchis can never be permanently killed
>
> An earlier revision of this document stated that the fourth Mortibsorption reduced Mortiorchis's max HP to **0** and that it then "stays dead", capping the strategy at 10,000 transferred HP. **That is wrong.** Three FF Wiki pages and one independent guide all describe a **floor at 1,000**, not a decay to zero:
>
> | Source | Wording | Reading |
> |---|---|---|
> | FF Wiki, *Final Fantasy X enemy abilities* (Mortibsorption row) | "First use absorbs 4,000 HP, second 3,000 HP, third 2,000 HP, and **1,000 HP onward**." | Floor at 1,000, repeats forever |
> | FF Wiki, *Mortibody* (same ability, Seymour Natus fight) | "decreases in increments of 1,000 until it **caps at 1,000**" | Floor at 1,000 |
> | FF Wiki, *Mortiorchis* | "in the amount of 4,000, 3,000, 2,000, and **finally** 1,000 … also modifying its max HP to the same amount" | Terminal value is 1,000, not 0 |
> | GamerGuides, *Seymour Flux* | "starts at 4,000 HP and decreases by 1,000 HP until reaching a **minimum threshold of 1,000 HP**"; "players cannot simply eliminate it as a permanent solution" | Floor at 1,000, cannot be removed |
>
> `[verified: 2 sources]` (FF Wiki enemy-abilities master table + GamerGuides, fetched independently of one another).
>
> **Therefore the blocker the gap list raised does not arise in the real fight.** There is no "Mortiorchis stays dead" state, so:
> - **Total Annihilation is never removed from the encounter.** The charge ladder, the Auto-Attack Mode announcement and the Total Annihilation cast all continue to be performed by the Mortiorchis actor for the whole fight. Killing the mount is a *damage pump*, never a way to disarm the wipe threat.
> - **The alternation no-op guard never sees a one-living-actor board.** Both enemy actors are alive on every CTB tick from the first turn to the last.
> - Killing it repeatedly is still the recommended strategy (§6 row 17) — it is just an *unbounded, diminishing* damage tap (4,000 / 3,000 / 2,000 / 1,000 / 1,000 / …) rather than a one-time 10,000 windfall. In practice a player who cycles it will land the first four kills and then stop, because a 1,000-HP Mortiorchis kill costs roughly as much player action economy as hitting Seymour directly for 1,000. The design intent is preserved either way.

**Implementation consequences:**
- Killing Mortiorchis is a *damage route into Seymour*, not a way to remove the adds. Free damage to Seymour across the first four cycles = **10,000** (14.3% of his HP bar); each subsequent cycle adds **1,000** (1.43%) with no cap. `[verified: 2 sources]`
- **`maxHp` must clamp at 1,000, never decrement below it.** Implement the decay as `maxHp = max(1000, maxHp - 1000)`. A naive `maxHp -= 1000` produces a dead mount, a 0-damage Mortibsorption, and an encounter with no Total Annihilation — the exact failure mode this note exists to prevent.
- **Mortiorchis has no death state at all in this encounter.** It is never removed from the enemy party, never becomes untargetable, and its slot is never vacated. Do not write a `die()` path for it; write an assertion that it is alive whenever the battle is running. (Belt-and-braces fallback, in case a future balance pass wants a killable mount: if Mortiorchis is ever absent, Seymour must inherit the whole Mortiorchis script — Full-Life, Cross Cleave, the charge ladder and Total Annihilation — because §3.1 shows those actions already live in **his** action list (`m142`) and are merely animated on the mount. Alternation then degenerates to "Seymour acts every turn" and the no-op guard must be disabled, not left to fire on every turn. This branch is **not canonical** and should be `assert(false)` in shipping builds.)
- Mortibsorption damage **counts as "being attacked" for Seymour's HP-threshold AI checks** (see §4.3). Poison damage does **not**. `[verified: 2 sources: wiki + independent web aggregation]`
- Mortibsorption fires **even if the drain kills Seymour** — the FF Wiki *Mortibody* page states this explicitly for the identical ability ("Mortibody will use Mortibsorption even if it kills Seymour"). Since Seymour has 70,000 HP and the largest drain is 4,000, this only matters as an ordering rule: resolve the drain, *then* check Seymour's death, and do not suppress the drain because it would be lethal. `[single source: wiki Mortibody]`
- Because Mortiorchis has Armored + Def 100 + MDef 1, the cheapest kill loop is a mid-tier black magic spell, not physicals.

### 2.3 Dummied (unused) Mortiorchis abilities — do not implement

Three abilities exist in data but are never scripted: **Biora** (Bio + 75% fractional damage if the target is not Demi-immune), **Osmose** (drains 100% of a target's MP), and **Magic Re-Enabled** (restores 1,000 HP and cures Silence). `[single source: wiki]`

---

## 3. Exact action data (decompiled action-table rows)

All rows below are byte-level reads from `ffx_monmagic2.csv` (file id 6) and `ffx_command.csv` (file id 3), keyed by the action ids that `monster_actions.json` assigns to `m142` / `m143`. `[decompiled]`

### 3.1 Seymour Flux's action list (`m142`)

| Action | File/ID | Target | Formula | Base dmg | Hits | Statuses | Notable flags |
|---|---|---|---|---:|---:|---|---|
| **Lance of Atrophy** | 6 / 120 | Random Character | Strength | **16** | 1 | **Zombie @ 100%** | `can_target_dead`, shatter 30, always hits |
| **Full-Life** | 6 / 245 | Random Character *Affected By Zombie* (fallback: Random Character) | Percentage Total | **16** (→ 16/16 = 100% max HP) | 1 | **Death @ 254** | `heals`, `removes_statuses`, `can_target_dead`, `misses_if_target_alive`, reflectable |
| **Cross Cleave** | 6 / 116 | Characters' Party | Strength | **52** | 1 | — | **strong delay** on all targets |
| **Total Annihilation** | 6 / 117 | Characters' Party | Magic | **44** | **5** | — | party-wide, 5 separate hits `[decompiled]` + Final Fantasy Wiki `[verified: 2 sources]` |
| **Flare** | 6 / 121 | **Self** | Magic | **80** | 1 | — | `ignores_armored`, **`affected_by_reflect`**, `affected_by_silence` |
| **Banish** | 6 / 80 | Random Character | Magic | 0 | 1 | status flag **Eject** | `always_break_damage_limit` (cosmetic here) |
| **Slowga** | 6 / 141 | **Counter** Characters' Party | CTB | **16** (→ ctb × 16/16 = doubles wait) | 1 | **Slow @ 254** | reflectable; fires as a counter |
| **Mortibsorption** | 6 / 169 | Self | HP | 10 | 1 | — | `drains` |
| **Protect** | 3 / 59 | **Counter** Self | Magic | 0 | 1 | Protect @ 254 | MP 12, reflectable, long range |
| **Reflect** | 3 / 60 | Self **and** Counter Self | Magic | 0 | 1 | Reflect @ 254 | MP 14 |
| **Dispel** | 3 / 61 | **Characters' Party** | Magic | 0 | 1 | strips Power/Magic/Armor/Mental Break, Shell, Protect, Reflect, all four Nuls, Regen, Haste | MP 12, **not** reflectable |
| **Special 1** ("Failed Counterstrike") | 6 / 1 | Self | No Damage | 0 | 0 | — | idle/no-op |
| **Special 2** ("Seymour Waits") | 6 / 2 | Self | No Damage | 0 | 0 | — | idle/no-op |

### 3.2 Mortiorchis's own action list (`m143`)

| Action | File/ID | Target | Notes |
|---|---|---|---|
| **Command 150** ("Auto-Attack Mode") | 6 / 140 | M1 | No Damage. This is the **first charge turn** announcement for Total Annihilation. |
| **Mortibsorption** | 6 / 169 | M1 | The death-trigger HP transfer (§2.2). |

> Everything else the Mortiorchis *appears* to do (Full-Life, Cross Cleave, Slowga, Total Annihilation) is issued by the **Seymour Flux actor** and merely animated on Mortiorchis. This matters: **those actions use Seymour's Strength 30 / Magic 15, not Mortiorchis's 40/40.** §5.4 shows the damage math that confirms this.

### 3.3 Notes on the two weird actions

**Full-Life.** It carries `heals = true` *and* a `Death` status at chance 254, with `misses_if_target_alive = true` and `can_target_dead = true`. Behaviour to implement:

- Target has **Zombie** → Zombie inverts healing into damage. Amount = 100% of the target's **max** HP (Percentage Total, base 16 ⇒ `max_hp × 16 / 16`). The target dies. The `Death` flag guarantees the KO even if damage somehow fell short.
- Target is **alive, not Zombie** → the `misses_if_target_alive` flag makes it whiff. No effect. The wiki confirms: it still casts Full-Life even when nobody is zombified, picking a random **non-KO'd** party member, harmlessly. `[decompiled]` + wiki `[verified: 2 sources]`
- Target is **KO'd** → full revive. (The AI never deliberately targets KO'd allies-of-the-player, but the flag exists.)

**Flare targets *Self*.** This is the single cleverest piece of the encounter script. Seymour casts Flare *on himself* while he has Reflect up; the Reflect status bounces it onto a random party member. Therefore:

- **Reflect up** → Flare rebounds onto the party for real damage.
- **Reflect dispelled** → Flare resolves on Seymour and **he damages himself** for ~1,700 (see §5.3). This is the main reason Dispel is a damage tool in this fight, not just a cleanse. `[decompiled]` + wiki `[verified: 2 sources]`

### 3.4 Appendix — Mortibody (`m127`, the *Seymour Natus* fight) — reference only, NOT in this encounter

| Field | Value |
|---|---:|
| HP / MP | 4,000 / 50 |
| STR / DEF / MAG / MDEF / AGI / LUCK / EVA / ACC | 22 / 50 / 20 / 0 / 28 / 20 / 0 / 100 |
| Poison tick | 25% of max HP = 1,000 |
| Armored | **No** |

| Action | File/ID | Target | Formula | Base | Effect |
|---|---|---|---|---:|---|
| **Shattering Claw** | 6 / 118 | Random Character | Strength | 16 | shatter chance 90, accuracy 100, `can_target_dead` |
| **Desperado** | 6 / 94 | Characters' Party | Fixed | 10 (→ ~470–530 flat damage) | **Party-wide dispel**: strips Shell, Protect, Reflect, all four Nuls, Regen, Haste at 255% |
| Cura | 3 / 44 | M1 (Seymour Natus) | Healing | 40 | heals Natus |
| Fire / Blizzard / Thunder / Water | 6 / 57–60 | Characters' Party | Magic | 16 | elemental party chip |
| Mortibsorption | 6 / 169 | M1 | HP | 10 | same transfer mechanic |

To answer the brief directly: **Desperado dispels the player party only** (target = Characters' Party). It does not target aeons separately — but since an aeon *is* the party while summoned, a summoned aeon eats it. And it is **not part of the Seymour Flux fight**. `[decompiled]`

---

## 4. AI script / turn rotation

### 4.1 Turn-order fundamentals (shared with the Yunalesca chapter's CTB core)

Both actors have **Agility 38** — identical, and high. In FFX's CTB this means Flux and Mortiorchis interleave tightly and both act frequently relative to an un-Hasted party (typical player Agility at this point: 10–32; see §7).

**The alternation rule (critical, easy to get wrong):**

> If Seymour Flux or the Mortiorchis get **two turns in a row**, they **do nothing** on the second turn.
> — wiki + independent GameFAQs Mt. Gagazet walkthrough/LP archive content `[verified: 2 sources]`, corroborated by the existence of the two no-op actions `Special 1` / `Special 2` in `m142`'s list `[decompiled]`

This is what makes the fight a *call-and-response*: Seymour sets up, Mortiorchis punishes. Implement it as a guard on the actor that acted last, not as a scripted fixed order — CTB can genuinely give the same actor two turns, and the encounter's design answer is a visible "Seymour waits" / "failed counterstrike" beat rather than a double hit.

### 4.2 Phase 1 — HP > 50%

Repeating 6-turn cycle (3 Seymour turns interleaved with 3 Mortiorchis turns):

| Step | Actor | Action | Result |
|---:|---|---|---|
| 1 | Seymour | **Lance of Atrophy** → random character | ~600–870 physical damage + **Zombie (100%)** |
| 2 | Mortiorchis | **Full-Life** → random *zombied* character | **Instant KO.** If no one is zombied, it targets a random living character and whiffs. |
| 3 | Seymour | **Lance of Atrophy** → random character | as step 1 |
| 4 | Mortiorchis | **Full-Life** | as step 2 |
| 5 | Seymour | **Dispel** → **entire party** | Strips Haste, Protect, Shell, Reflect, Regen, Nuls, Breaks from all three |
| 6 | Mortiorchis | **Cross Cleave** → entire party | ~2,000–2,450 physical to all three, **+ strong Delay** |
| → | | loop to step 1 | |

`[verified: 2 sources — wiki (Seymour Flux + Mortiorchis pages) and Game8/GamerGuides strategy pages agree on the ordering]`

The Dispel→Cross Cleave pairing is deliberately vicious: the party is stripped of Protect *immediately before* the only big physical hit in phase 1.

### 4.3 HP threshold reactions (counters, not turns)

| Trigger | Response | Notes |
|---|---|---|
| Seymour's HP falls below **75%** (52,500) | **Immediately casts Protect on himself** (`Counter Self`) | Halves incoming physical. |
| Seymour's HP falls below **50%** (35,000) | **Immediately casts Reflect on himself** (`Counter Self`) + enters Phase 2 | Bounces player magic; enables the self-targeted Flare. |
| Both thresholds crossed by one big hit | **Casts both in the same reaction** | wiki explicitly notes this. |
| HP loss came from **Poison** | **No threshold reaction, no pattern change** | The check only fires on direct attacks and on Mortibsorption. |
| HP loss came from **Mortibsorption** | **Does** trigger threshold/pattern change | |

`[verified: 2 sources: wiki + independent web aggregation restating the same 75%/50% Protect/Reflect thresholds and the poison-exclusion rule verbatim]` — this is behaviourally load-bearing and should be a test fixture.

### 4.4 Phase 2 — HP < 50% (the "dialog boxes appear" phase)

Two independent sub-scripts run in parallel: Seymour's **Flare/Reflect loop** and Mortiorchis's **Total Annihilation charge counter**.

#### 4.4.1 Seymour's Flare/Reflect loop

| State | Seymour's action | Outcome |
|---|---|---|
| Has Reflect, hasn't Flared yet this loop | **Flare → Self** | Bounces onto a random party member (~1,900–2,100) |
| Has Reflect **after** the initial Flare | **Waits** (no-op) on the turn where he would recast Reflect | An intentional free turn for the player |
| Reflect has been **Dispelled** | **Flare → Self** resolves on himself (**~1,734 self-damage**) | Then: **recast Reflect** next turn, **then Flare again**, then restart the loop |

`[verified: 2 sources — wiki Battle section + GamerGuides]`

Net implementation shape: `Flare` is *always* cast at Self. The Reflect status is the only thing deciding who eats it. Do not special-case the targeting; special-case the Reflect bounce and you get all four behaviours for free.

#### 4.4.2 Mortiorchis's Total Annihilation charge

| Charge turn | Mortiorchis action | On-screen announcement |
|---:|---|---|
| 1 | `Command 150` — **Auto-Attack Mode** | "Auto-Attack Mode" |
| 2 | **Ready To Annihilate** | "Ready To Annihilate" |
| 3 | **TOTAL ANNIHILATION** → party-wide, 5 hits | — |

**After the first Total Annihilation, Mortiorchis stays in Auto-Attack Mode indefinitely and needs only ONE charge turn per subsequent use.** `[verified: 2 sources — wiki Mortiorchis page + Game8]`

**Aeon interaction (the big one):** if the player summons an aeon, **Mortiorchis postpones Total Annihilation until Seymour banishes the aeon**. The charge is held, not lost. This is the mechanical basis for the entire "summon everything" strategy — a summon is a *stall* as well as a damage burst. `[verified: 2 sources — wiki Seymour Flux + Mortiorchis pages]`

**Mortiorchis-death interaction: there isn't one.** Mortiorchis's max HP floors at 1,000 and it revives via Mortibsorption on every kill, forever (§2.2 correction box). It is therefore **never absent from the field**, and the charge ladder is never interrupted, transferred, or cancelled by killing it.

| State | Effect on the charge ladder | Confidence |
|---|---|---|
| Mortiorchis at full HP | Ladder advances normally | `[verified: 2 sources]` |
| Mortiorchis killed → Mortibsorption fires → revived at new max HP | **No effect on the ladder.** Mortibsorption is a death-trigger *reaction*, not one of Mortiorchis's scheduled turns, so it neither consumes nor advances a charge step. `chargeTurns` is untouched. | `[derived]` from the decompiled action ownership (§3.2: Mortiorchis's own scheduled action list is only `Command 150` + Mortibsorption) `[single source]` — **verify in-game**, see C-12 |
| Mortiorchis killed a 5th, 6th, 7th … time | Still no effect; still drains 1,000 each time; still revives | `[verified: 2 sources]` |
| Mortiorchis "permanently dead" | **Unreachable state.** Does not occur. | `[verified: 2 sources]` |
| Aeon on the field | Ladder **held** (not reset, not advanced) | `[verified: 2 sources]` |

**On attribution.** §3.2 shows that Cross Cleave, Full-Life, Slowga and Total Annihilation are rows in **Seymour's** action list (`m142`), issued by the Flux actor and animated on the mount, while `Command 150` (Auto-Attack Mode) and Mortibsorption are the only rows in `m143`. The FF Wiki's infobox and its enemy-ability master table both credit **Mortiorchis** as the *user* of Cross Cleave, Ready To Annihilate, Auto-Attack Mode and Total Annihilation — that is a visual/presentational attribution, and it is the one the player sees. Ship it as: **the Mortiorchis actor owns the turn slot and the animation; the Seymour actor owns the stats** (§5.4). Because the mount never dies, the two attributions can never disagree at runtime. `[decompiled]` vs wiki `[verified: 2 sources]` — recorded as conflict **C-12**.

### 4.5 Aeon handling — Banish

- Whenever an aeon is on the field, Seymour uses **Banish**, which applies the **Eject** status flag (decoded from status-flag bit 8 = `EJECT` in the no-RNG status ordering). `[decompiled]`
- **The aeon gets exactly one turn to act before it is banished.** `[verified: 2 sources — wiki Seymour Flux page + Final Fantasy Wiki "Banish (Seymour ability)" page, surfaced independently via search and not among the document's other cited URLs]`
- Banish deals no damage and cannot be resisted by aeons (they have no Eject immunity; Flux and Mortiorchis both *do*, which is why the player can never Eject them).
- Consequence: an aeon summoned with a **full Overdrive gauge** gets one free Overdrive, then leaves. An aeon summoned empty is a pure stall (one turn of Total Annihilation delay) and nothing more.
- Hellfire (Ifrit), Thor's Hammer (Ixion) and Delta Attack have **alternate animations** when used against Seymour Flux — a nice fidelity detail for the animation layer. `[single source: wiki]`

### 4.6 Counters

| Player action | Seymour's counter |
|---|---|
| Attempting to **Delay** (Delay Attack / Delay Buster / Dragon Fang's delay rider) | **Slowga on the entire party** (Slow @ 254, and CTB × 2) | `[verified: 2 sources — wiki Mortiorchis page + decompiled `Counter Characters' Party` target on m142's Slowga]` |
| Dropping Seymour below 75% HP | Protect (self) |
| Dropping Seymour below 50% HP | Reflect (self) |

Both actors are `immune_to_delay`, so the delay attempt fails *and* gets punished. `[decompiled]`

### 4.7 Trigger Commands (pre-battle dialogue bonuses)

Certain party members can Talk to Seymour at the start of the fight for a permanent-for-this-battle stat bonus:

| Character | Bonus |
|---|---|
| **Kimahri** | **+10 Strength** |
| **Yuna** | **+10 Magic Defense** |

`[verified: 2 sources: wiki + independent web aggregation restating the same +10 Strength / +10 Magic Defense figures verbatim]` — note that +10 MDef on Yuna materially reduces Total Annihilation damage on her (see §5.2), and +10 Strength on Kimahri is a ~60% damage swing at these stat levels.

### 4.8 Reference AI pseudocode

```ts
// Actor-level guard shared by both enemies
function takeTurn(self: EnemyActor, state: BattleState) {
  if (state.lastEnemyActor === self) { return doNothing(self); } // §4.1
  state.lastEnemyActor = self;
  ...
}

// --- SEYMOUR FLUX (m142) ---
onDamaged(source) {
  if (source !== DamageSource.POISON) {          // §4.3
    if (hp < 0.75 * maxHp && !has(Protect)) counter(Protect, SELF);
    if (hp < 0.50 * maxHp && !has(Reflect)) { counter(Reflect, SELF); enterPhase2(); }
  }
}
onPlayerDelayAttempt() { counter(Slowga, CHARACTERS_PARTY); }   // §4.6

seymourTurn() {
  if (aeonOnField) return cast(Banish, aeon);                    // §4.5
  if (phase === 1) {
    switch (p1Step) {                                            // §4.2
      case 0: case 2: return cast(LanceOfAtrophy, randomCharacter());
      case 4:         return cast(Dispel, CHARACTERS_PARTY);
    }
  } else {                                                       // §4.4.1
    if (has(Reflect) && flaredThisLoop) return doNothing();       // "Seymour Waits"
    if (!has(Reflect) && flaredThisLoop) { flaredThisLoop = false; return cast(Reflect, SELF); }
    flaredThisLoop = true;
    return cast(Flare, SELF);   // Reflect (or its absence) decides the victim
  }
}

// --- MORTIORCHIS (m143) --- actions are issued by the Flux actor, animated here
// INVARIANT: Mortiorchis is alive on every tick of this battle. It has no death state. See §2.2.
mortiorchisTurn() {
  console.assert(isAlive(mortiorchis), 'Mortiorchis must never be dead — see §2.2 correction box');
  if (phase === 1) {
    switch (p1Step) {                                            // §4.2
      case 1: case 3: return cast(FullLife, randomZombiedCharacter() ?? randomLivingCharacter());
      case 5:         return cast(CrossCleave, CHARACTERS_PARTY);
    }
  }
  // phase 2 charge ladder — §4.4.2
  if (aeonOnField) return doNothing();        // postponed, charge is HELD
  if (chargeTurns >= chargeRequired) { chargeTurns = 0; chargeRequired = 1; hasAnnihilated = true;
                                       return cast(TotalAnnihilation, CHARACTERS_PARTY); }
  chargeTurns++;
  return announce(chargeTurns === 1 && !hasAnnihilated ? 'Auto-Attack Mode' : 'Ready To Annihilate');
}

// §2.2 — death-trigger REACTION, not a scheduled turn.
// Does not consume a turn, does not touch chargeTurns, does not trip the §4.1 alternation guard.
const MORTIORCHIS_MIN_MAX_HP = 1000;         // hard floor — the mount is unkillable
onHpZero() {
  drainFrom(SEYMOUR_FLUX, maxHp);            // damage == heal == current maxHp; fires even if lethal
  seymour.onDamaged(DamageSource.MORTIBSORPTION);   // §4.3 — DOES trigger threshold reactions
  hp = maxHp;                                // fully revived at the CURRENT max
  maxHp = Math.max(MORTIORCHIS_MIN_MAX_HP, maxHp - 1000);   // 4000→3000→2000→1000→1000→1000…
  // NO die() branch. There is none in the real encounter.
}
```

---

## 5. Damage model and computed damage tables

### 5.1 The decompiled damage formula (ported, verbatim semantics)

Used for `Strength`, `Piercing Strength`, `Magic`, `Piercing Magic`, `Special Magic`, `Healing`:

```
// power
STRENGTH / PIERCING_STRENGTH / SPECIAL_MAGIC:  power = (off^3 / 0x20) + 0x1e
MAGIC / PIERCING_MAGIC:                        power = ((off^2 * 0x2AAAAAAB / 0xffffffff) + base) * base / 4
HEALING:                                       power = (off + base) / 2 * base

// mitigation (def = target DEF for Strength, target MDEF for Magic, 0 for Piercing/Special Magic)
m1  = (def^2 * 0x2E8BA2E9 / 0xffffffff) / 2
mit = 0x2da - ((((def * 0x33) - m1) * 0x66666667 / 0xffffffff) / 4)

// combine  (defensive_buffs = target's Cheer stacks for physical, Focus stacks for magic)
d1 = power * mit
d2 = d1 * -1282606671 / 0xffffffff
d3 = (d1 + d2) / 0x200 * (15 - defensive_buffs)
d4 = d3 * -2004318071 / 0xffffffff
dmg = (d3 + d4) / 0x8
if (STRENGTH|PIERCING_STRENGTH|SPECIAL_MAGIC) dmg = dmg * base / 0x10
dmg = dmg * (damage_rng + 0xf0) / 256      // damage_rng ∈ [0,31] → ~±6% variance

// post-multipliers, in order
if (crit)               dmg *= 2
if (target has Boost)   dmg = dmg * 1.5
if (target has Shield)  dmg /= 4
elemental affinity multipliers
if (PHYSICAL) { if (target has Protect) dmg /= 2; if (user Berserk) dmg *= 1.5;
                if (user Power Break) dmg /= 2; if (target Defending) ... }
// (MAGICAL: Shell halves)
```

Other formulas used by this encounter:

| Formula | Computation |
|---|---|
| `Percentage Total` | `target.max_hp * base / 16` (blocked if target is `immune_to_percentage_damage`) |
| `HP` | `user.max_hp * base / 10` |
| `CTB` | `target.ctb * base / 16` |
| `Fixed` | `base * 50 * (damage_rng + 0xf0) / 256` |

`[decompiled]` — source: `ffx_rng_tracker/events/character_action.py::get_damage`, `_get_power`, `_get_mitigation`.

### 5.2 Incoming damage — what the party actually takes

All values below computed with **Seymour Flux's stats (STR 30 / MAG 15)**, mid-roll RNG (`damage_rng = 16`), **no Protect, no Shell, no Cheer/Focus**.

#### Lance of Atrophy (Strength, base 16)

| Party member Defense | min | **avg** | max |
|---:|---:|---:|---:|
| 10 | 762 | **813** | 860 |
| 15 | 735 | **784** | 829 |
| 20 | 707 | **755** | 799 |
| 25 | 682 | **728** | 770 |
| 30 | 656 | **700** | 741 |
| 40 | 605 | **646** | 683 |

`[derived]` — Samurai Gamers quotes "600 points of damage" from play, consistent with Def ≈ 40+. `[verified: derived + 1 guide]`

#### Cross Cleave (Strength, base 52, party-wide, + strong Delay)

| Party member Defense | min | **avg** | max |
|---:|---:|---:|---:|
| 10 | 2,476 | **2,642** | 2,796 |
| 15 | 2,388 | **2,548** | 2,697 |
| 20 | 2,299 | **2,453** | 2,596 |
| 25 | 2,218 | **2,366** | 2,504 |
| 30 | 2,132 | **2,275** | 2,408 |
| 40 | 1,967 | **2,099** | 2,221 |

`[derived]` — the wiki and two guides independently report "around 2,000 damage to the whole party". Matches at Def ≈ 30–40. `[verified: 2 sources]`
**Halve all of these if Protect is up.** Cheer stacks reduce them further (see §5.5).

#### Total Annihilation (Magic, base 44, **5 hits**, party-wide)

| Party member Magic Defense | per hit | **total (×5)** |
|---:|---:|---:|
| 10 | 829 | **4,145** |
| 15 | 800 | **4,000** |
| 20 | 771 | **3,855** |
| 25 | 743 | **3,715** |
| 30 | 715 | **3,575** |
| 40 | 660 | **3,300** |
| 50 | 607 | **3,035** |

`[derived]` — the Steam non-grinder guide reports "about 4K damage on your party members", and an independent GameFAQs Mt. Gagazet walkthrough/community source corroborates: "Mortiorchis will prepare to use Total Annihilation, which causes 4000HP to everyone." Exact match at MDef 15–20. `[verified: 2 sources]`
**Halve if Shell is up** (→ ~1,900–2,000, survivable by most of the party). This is why Shell / Mighty Guard / a Mighty Mix is the canonical answer.

#### Flare (Magic, base 80, reflected onto a party member)

| Party member Magic Defense | min | **avg** | max |
|---:|---:|---:|---:|
| 15 | 1,970 | **2,102** | 2,225 |
| 20 | 1,898 | **2,025** | 2,143 |
| 25 | 1,830 | **1,952** | 2,066 |
| 30 | 1,760 | **1,878** | 1,988 |
| 40 | 1,625 | **1,734** | 1,835 |

`[derived]` — single-target. Halved by Shell.

#### Full-Life on a zombied target

**100% of the target's max HP as damage + guaranteed Death.** Always a KO. `[decompiled]`

#### Slowga (counter to a Delay attempt)

Slow @ 254 on the whole party, plus CTB damage `ctb × 16/16` = **the party's current CTB wait is doubled** on top of the Slow status. `[decompiled]`

### 5.3 Flare resolving on Seymour himself (Reflect dispelled)

| Target | avg self-damage |
|---|---:|
| Seymour Flux (MDef 40) | **1,734** |

`[derived]` — modest, but it is a *free* 1,734 every time the player spends a Dispel, and it also wastes his turn. Combined with the 1,400/turn poison tick, a Dispel-and-poison loop alone is a real (slow) win condition.

### 5.4 Why Cross Cleave / Total Annihilation use Seymour's stats, not Mortiorchis's

This was genuinely ambiguous — the wiki lists both moves under *both* enemies' ability lists. The decompiled `monster_actions.json` puts them on `m142` (Seymour Flux) only. The damage math settles it decisively:

| Move | With Seymour (STR 30 / MAG 15) | With Mortiorchis (STR 40 / MAG 40) | Observed in play |
|---|---:|---:|---|
| Cross Cleave (Def 30) | **2,275** | 5,294 | "around 2,000" (wiki, Game8, Steam guide) |
| Total Annihilation ×5 (MDef 20) | **3,855** | 14,760 | "about 4K" (Steam guide) |

**Conclusion: implement both with Seymour Flux's Strength 30 / Magic 15, animated on Mortiorchis.** `[derived, cross-validated against 3 guides]`

### 5.5 Mitigation levers, quantified

Cross Cleave (base 52, STR 30) against a Def-20 character:

| Cheer stacks on the target | avg damage |
|---:|---:|
| 0 | 2,453 |
| 1 | 2,289 |
| 2 | 2,126 |
| 3 | 1,962 |
| 4 | 1,799 |
| 5 | 1,635 |

Total Annihilation (base 44, MAG 15) against an MDef-25 character:

| Focus stacks | per hit | total (×5) |
|---:|---:|---:|
| 0 | 743 | 3,715 |
| 5 | 496 | 2,480 |

`[derived]` — note that **Cheer/Focus in FFX are *defensive* as well as offensive**: they enter the formula as `(15 - defensive_buffs)`. Five Cheers is a ~33% physical damage reduction, and it stacks multiplicatively with Protect. The wiki's "use Focus five times" advice for Total Annihilation is exactly this. Implementers: Cheer and Focus **must** have both halves of their effect or the recommended strategies stop working.

### 5.6 Outgoing damage — what the player does to Seymour (Def 40 / MDef 40)

| Attack | STR/MAG 30 | 40 | 50 | 60 |
|---|---:|---:|---:|---:|
| Normal physical Attack (base 16, non-piercing) | 646 | 1,504 | 2,916 | — |
| **Piercing** physical (Auron katana, Kimahri spear) | **873** | **2,030** | **3,936** | — |
| Flare (base 60) | 2,334 | 3,623 | 5,291 | 7,336 |
| Ultima (base 70) | 2,853 | 4,357 | 6,303 | 8,689 |
| Holy (base 100) | 4,631 | 6,781 | 9,560 | 12,969 |
| **Poison tick** | **1,400 / Seymour turn, flat** | | | |

`[derived]`

Against **Mortiorchis** (Armored, Def 100, MDef 1):

| Attack | Value |
|---|---:|
| Non-piercing physical, STR 30 | 371 (plus the Armored reduction) |
| **Piercing** physical, STR 30 | **873** |
| Flare, MAG 40 | **4,856** |

`[derived]` — magic is the fast Mortiorchis kill. One Flare per cycle plus a chip finishes each 4,000/3,000/2,000/1,000 shell.

### 5.7 Aeon Overdrive output (Special Magic formula — **ignores Magic Defense entirely**)

| Aeon Overdrive | Base | MAG 40 | **MAG 45** | MAG 50 |
|---|---:|---:|---:|---:|
| Energy Ray (Valefor) | 55 | 6,978 | **9,889** | 13,530 |
| Energy Blast (Valefor) | 75 | 9,515 | **13,485** | 18,450 |
| Hellfire (Ifrit) | 58 | 7,358 | **10,429** | 14,268 |
| Thor's Hammer (Ixion) | 60 | 7,612 | **10,788** | 14,760 |
| Diamond Dust (Shiva) | 60 | 7,612 | **10,788** | 14,760 |
| **Mega Flare (Bahamut)** | 72 | 9,135 | **12,946** | 17,712 |

`[derived]` — the Steam non-grinder guide reports aeon Overdrives hitting for "approx. 10–13K", which pins aeon Magic at **≈ 43–47** at this story point. `[verified: derived + 1 guide]`

**Damage cap:** all aeons are capped at **9,999** except **Bahamut**, whose weapon carries **Break Damage Limit** natively `[decompiled: characters.json — Bahamut weapon abilities include "Break Damage Limit"]`. So in practice a full-gauge sweep of Valefor + Ifrit + Ixion + Shiva + Bahamut yields roughly `9,999 × 4 + ~12,900 ≈ 52,900` — three quarters of Seymour's bar, plus four to five turns of stalled Total Annihilation. That is the shape of the intended "phase 2 burst" win.

---

## 6. Player strategies (→ the mechanics that MUST work)

Each row lists a strategy players actually use, and the engine capability it forces.

| # | Strategy | Mechanic that must be implemented correctly | Source |
|---:|---|---|---|
| 1 | **Blunt the Zombie combo with a "Blessed" armor.** ⚠ **Corrected:** "Blessed" is FFX's *naming prefix* for an armor whose dominant ability is **Zombie Ward *or* Zombieproof** — the name alone does not tell you which. Wantz's Blessed Ring / Blessed Bracer carry **Zombie Ward (−50%)**, not immunity. Full immunity is **Zombieproof**, and it costs **10× Candle of Life**, which at Mt. Gagazet is only obtainable by stealing from Fallen Monks back in Bevelle (×2, common). See §7.7.1. | Armor auto-ability granting **status ward (−50 percentage points)** *and* a separate **perfect-immunity** ability; item-based armor customisation | FF Wiki *FFX armor* naming table + *FFX auto-abilities* + *Candle of Life* `[verified: 2 sources]` |
| 2 | **Zombie Ward** (on Yuna's and Auron's Wantz armor by default; customisable onto any empty armor slot for **30× Holy Water** = 9,000 gil at Wantz's own 300 gil/unit) | Status ward: **subtract 50 from the infliction chance**, not multiply. Lance of Atrophy is Zombie @ 100 ⇒ 100 − 50 = **50% land rate** with one Ward. Wards do **not** stack past one instance of the same ability. | wiki + Game8 `[verified: 2 sources]` |
| 3 | **Auto-Med** customised onto armor (**20× Remedy**; auto-uses Holy Water when Zombie lands, or a Remedy if multiple ailments are up) | Auto-consume an item on status application | wiki `[verified: 2 sources — FFX auto-abilities table + Remedy item page]` — note Remedies are **not buyable** until Rin's airship shop, so 20 of them at Gagazet means chest-hoarding; see §7.7.2 |
| 4 | **Holy Water** the zombied character before Mortiorchis's turn. Requires beating it on CTB — high Agility or Haste. | Item usage; **CTB turn prediction UI** so the player can see whether they get there first | wiki `[verified: 2 sources]` |
| 5 | **Bio on Seymour, turn one.** 1,400/turn forever; he never removes it; it does **not** trigger his HP-threshold reactions (so he stays un-Protected and un-Reflected longer). | Poison as a % -of-max-HP DoT ticking on the **enemy's** turn; poison excluded from AI threshold checks | wiki + Game8 + Steam guide `[verified: 2 sources]` |
| 6 | **Alternate poison sources:** Poison Fang (Use), Fire Gem + Soul Spring (Mix), Bad Breath (Ronso Rage, 10% poison / 50% silence vs Flux) | Item `Use`, Rikku's `Mix`, Kimahri's Ronso Rage, per-status landing rolls | wiki `[single source]` |
| 7 | **Silence Buster / Silence Attack (Wakka)** — 50% resist. Silences shut off Flare, Reflect, Dispel and Protect, wasting his turn each time. | `affected_by_silence` flag honoured per-action; status resistance as a % roll | wiki `[verified: 2 sources]` |
| 8 | **Dispel his Reflect** → his next Flare detonates on himself (~1,734) and he burns two more turns recasting. | Dispel stripping enemy buffs; **self-targeted spells bouncing off the caster's own Reflect** | wiki `[verified: 2 sources]` |
| 9 | **Dispel his Protect** once he casts it below 75%. | Same | wiki |
| 10 | **Haste / Hastega on the party** — outrun the Full-Life window and the charge ladder. | Haste as CTB multiplier (`ctb × 8/16`); Hastega party-wide | wiki + Steam guide `[verified: 2 sources]` |
| 11 | **Haste on *Seymour*** (he has 0 Slow/Haste resistance) — he poisons himself faster and **his combo timing with Mortiorchis desynchronises**, triggering the two-turns-in-a-row no-op rule. | Buffing an enemy; the alternation/no-op rule | wiki `[single source]` — a genuinely delightful mechanic, worth preserving |
| 12 | **Cheer ×5 + Auron attacking, under Hastega.** The wiki's explicitly "minimal items/equipment" route. | Cheer's **defensive** half (see §5.5); Cheer stacking to 5 | wiki `[single source]` |
| 13 | **Shell (or Kimahri's Mighty Guard, or a Rikku "Mighty" Mix) + Defend before Total Annihilation.** | Shell halving magic; Mighty Guard as a multi-buff Overdrive; Defend as a damage reduction stance; **a readable 2-turn telegraph the player can act on** | wiki `[verified: 2 sources]` |
| 14 | **Focus ×5** to cut Total Annihilation | Focus's defensive half | wiki `[single source]` |
| 15 | **Summon every aeon with a full Overdrive gauge** in phase 2. Each summon (a) fires one Overdrive, (b) **stalls the Total Annihilation charge**, (c) then eats Banish. | Aeon summon/dismiss; aeon Overdrive gauges persisting between battles; **Eject**; the charge-hold rule | wiki + Steam guide + Game8 `[verified: 2 sources]` |
| 16 | **Grand Summon (Yuna's Overdrive)** to give an aeon a full gauge on the spot | Grand Summon's temporary-gauge behaviour | wiki `[single source]` |
| 17 | **Kill Mortiorchis repeatedly.** 4,000 → 3,000 → 2,000 → 1,000 free damage to Seymour for the first four kills (**10,000**), then **1,000 per kill, unbounded**. ⚠ **Corrected:** this does *not* eventually destroy the mount — its max HP floors at 1,000 and it revives every time, so **Total Annihilation is never removed from the fight** (§2.2 correction box). | Mortibsorption's HP-transfer + max-HP decay **with a hard floor at 1,000**; enemy actor with no death state | wiki enemy-abilities table + GamerGuides `[verified: 2 sources]` |
| 18 | **Kimahri Lancet** — note: Flux teaches **nothing** (`ronso_rage_id = 0`). But **Mighty Guard is learnable from Biran Ronso** in the immediately preceding boss fight, and **White Wind from Yenke Ronso**. | Lancet learning; Ronso Rage roster | wiki `[decompiled + wiki]` |
| 19 | **Provoke** — **useless here.** Flux and Mortiorchis are both Provoke-immune (255). Do not let a strategy guide claim otherwise. | Provoke immunity | `[decompiled]` |
| 20 | **Breaks** — **useless here.** Flux is immune to all four; Mortiorchis is immune to Power/Magic/Mental Break and 50% to Armor Break. **Piercing is the only way past Defense.** | Piercing weapon property | `[decompiled]` |
| 21 | **Delay Attack** — actively harmful: both are delay-immune and it **counters with party-wide Slowga**. | Counter-on-delay | wiki + `[decompiled]` |

### 6.1 The Kimahri Lancet note, expanded

Kimahri can enter this fight with **Mighty Guard** because **Biran Ronso** (fought minutes earlier on the same mountain, after Biran has used it) teaches it via Lancet. He can also pick up **White Wind** (Yenke, after use), **Self-Destruct / Thrust Kick / Doom** (Biran), and **Fire Breath / Stone Breath / Aqua Breath** (Yenke). `[verified: 2 sources: wiki Ronso Rage table + independent web aggregation drawing on EIP Gaming's Ronso Rage guide and Jegged's walkthrough, EIP Gaming not among the document's other cited sources]`

This is a strong design beat for the anthology: the Biran/Yenke duel is *the tutorial for the tool that saves you from Total Annihilation*. If the chapter includes a lead-in encounter, this is the one.

| Ronso Rage | Rank | Power | Learned from (available by Gagazet) |
|---|---:|---|---|
| Jump | 3 | Physical, 32 | Default |
| Seed Cannon | 3 | Physical, 33 | Ragora (Kilika Woods) |
| Self-Destruct | 3 | Fixed, Max HP × 3 | Bomb / **Biran Ronso** / Grenade |
| Fire Breath | 3 | Magical 24, ignores MDef | Dual Horn / Valaha / **Yenke Ronso** |
| Stone Breath | 3 | — (Petrify) | Basilisk / **Yenke Ronso** |
| Aqua Breath | 3 | Magical 26, ignores MDef | Chimera / **Yenke Ronso** |
| Thrust Kick | 3 | Physical, 33 | YKT-63 / **Biran Ronso** |
| Doom | 3 | — | Ghost / **Biran Ronso** |
| White Wind | 3 | Restorative, 40 | **Yenke Ronso** (after use) / Dark Flan |
| **Mighty Guard** | **4** | Protect + Shell + all four Nuls, party-wide | **Biran Ronso** (after use) / Behemoth |
| Bad Breath | 4 | Poison/Sleep/Silence/Dark 100% (10% / 50% vs Flux) | Malboro (not yet available) |
| Nova | 7 | Magical 70 | Omega/Nemesis (endgame — **not available**) |

`[single source: wiki]`

---

## 7. Typical player party at this point — authored story-progress preset

> **This section is an `[estimate]`, not a measured population average.** It is an authored "normally progressing first playthrough, Standard Sphere Grid, native routes, no grinding, no Celestial Weapons, no optional aeons" snapshot. The *anchors* underneath it are verifiable: base stats are `[decompiled]`, ability availability and shop stock are wiki-sourced, and the stat **ranges** are back-solved from the damage math in §5 against the damage figures guides actually report from play (see §7.6). Label it as a development preset in-product, exactly as `encounter-design.md` §"Default story-progress preset" already does for Yunalesca.

### 7.1 Story position

Arriving at the Prominence after: Kelk Ronso grants passage → **Kimahri defeats Biran & Yenke** → mountain trail with the fallen-summoner monuments → **Wantz's shop** → Braska's Sphere side road. Bahamut has been obtained at Bevelle; the Calm Lands are behind them.

### 7.2 Base stats at Sphere Level 0 (for reference — these are exact)

| Character | Start S.Lv | HP | MP | STR | DEF | MAG | MDEF | AGI | LUCK | EVA | ACC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Tidus | 0 | 520 | 12 | 15 | 10 | 5 | 5 | 10 | 18 | 10 | 10 |
| Yuna | 2 | 475 | 84 | 5 | 5 | 20 | 20 | 10 | 17 | 30 | 3 |
| Auron | 12 | 1030 | 33 | 20 | 15 | 5 | 5 | 5 | 17 | 5 | 3 |
| Kimahri | 6 | 644 | 78 | 16 | 15 | 17 | 5 | 6 | 18 | 5 | 5 |
| Wakka | 2 | 618 | 10 | 14 | 10 | 10 | 5 | 7 | 19 | 5 | 25 |
| Lulu | 2 | 380 | 92 | 5 | 8 | 20 | 30 | 5 | 17 | 40 | 3 |
| Rikku | 25 | 360 | 85 | 10 | 8 | 10 | 8 | 16 | 18 | 5 | 5 |

`[decompiled: characters.json]`

Default equipment slots/abilities at S.Lv 0 (also decompiled): Auron's katana has **Piercing**; Kimahri's spear has **Piercing + Sensor** and 2 slots; Wakka and Kimahri start with 0 armor slots.

### 7.3 Estimated stats at Mt. Gagazet — `[estimate]`

Typical **sphere levels used ≈ 28–40** per character for a non-grinder at this point (excluding Rikku's +25 starting offset). `[estimate]`

| Character | HP | MP | STR | DEF | MAG | MDEF | AGI | LUCK | EVA | ACC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tidus** | 1,800–2,600 | 90–140 | 28–34 | 16–24 | 12–20 | 14–22 | 26–34 | 18 | 18–26 | 20–28 |
| **Yuna** | 1,200–1,800 | 220–320 | 12–18 | 10–16 | 32–42 | 34–44 | 12–18 | 17 | 30–36 | 8–14 |
| **Auron** | 2,600–3,600 | 60–90 | 36–44 | 24–32 | 8–14 | 10–18 | 12–18 | 17 | 8–14 | 8–14 |
| **Kimahri** | 1,600–2,600 | 100–160 | 22–30 | 18–26 | 18–26 | 12–20 | 14–22 | 18 | 10–18 | 10–18 |
| **Wakka** | 1,900–2,700 | 70–110 | 26–32 | 16–24 | 14–20 | 12–20 | 14–20 | 19 | 10–16 | **40–52** |
| **Lulu** | 1,000–1,500 | 240–340 | 10–16 | 12–18 | **38–48** | **40–50** | 10–16 | 17 | 42–48 | 8–14 |
| **Rikku** | 1,100–1,700 | 90–140 | 18–24 | 12–18 | 14–20 | 12–18 | **28–36** | 18 | 10–16 | 10–16 |
| **Aeons (all)** | 4,000–7,000 | 200–400 | 30–40 | 20–30 | **43–47** | 20–30 | 20–30 | — | — | — |

`[estimate]`, except the aeon Magic range which is `[derived]` from the observed 10–13K Overdrive figures (§5.7).

Kimahri's line is deliberately the widest: the Standard Grid lets him enter any character's path, so "average Kimahri" is not a coherent object. Pick one route for the preset (I recommend the Auron/Tidus junction — it gives him usable Strength plus enough HP that Self-Destruct is meaningful) and label it.

### 7.4 Abilities plausibly learned by Mt. Gagazet — `[estimate]`

| Character | Native-route abilities a non-grinder normally has |
|---|---|
| **Tidus** | Cheer, Provoke, Haste, Hastega, Slow, Delay Attack, Delay Buster, Flee, Talk. **Quick Hit is on Rikku's section of the Standard Grid — an average Tidus does NOT have it yet.** |
| **Yuna** | Cure, Cura, Curaga, Life, NulBlaze/NulFrost/NulShock/NulTide, Esuna, Scan, Pray, Shell, Protect, Reflect, Dispel, Haste (if she has crossed over). **Holy, Full-Life and Auto-Life are late/deep — not by default.** |
| **Auron** | Power Break, Armor Break, Magic Break, Mental Break, Threaten, Guard, Sentinel, Piercing weapon by default. |
| **Wakka** | Dark Attack, Silence Attack, Sleep Attack, Dark Buster, Silence Buster, Sleep Buster, Aim, Triple Foul (borderline). **Drain is deep in the Blk/Wht crossover — not by default.** |
| **Lulu** | Fire/Fira/Firaga tier through the -ra tier on all four elements (Firaga/Blizzaga/Thundaga/Waterga borderline), Bio, Focus, Doublecast (borderline), Scan. **Demi, Flare and Ultima are not available to an average Lulu here.** |
| **Rikku** | Steal, Use, Mug (borderline), Luck, Flee, plus her Overdrive Mix. |
| **Kimahri** | Lancet, Jump (Ronso Rage), plus whichever route he was sent down; **Mighty Guard and White Wind newly learnable from Biran/Yenke on this very mountain.** |

`[estimate]` — the individually verifiable claims are the ability *names* and their grid families; which of them an "average" player owns is authored judgement. Explicitly flagged corrections against the task brief: **Tidus almost certainly does not have Quick Hit**, **Lulu almost certainly does not have Demi**, **Wakka almost certainly does not have Drain**, **Yuna does not have Full-Life** — all four sit deep in other characters' grid regions or behind Lv.3/Lv.4 Key Spheres that the player has just started acquiring.

### 7.5 Overdrives unlocked by Mt. Gagazet

| Character | Overdrive system | Unlocked by Gagazet | Unlock rule | Confidence |
|---|---|---|---|---|
| **Tidus** | Swordplay | **Spiral Cut** (default), **Slice & Dice** (after 10 Overdrive executions — any character? no: Tidus's own), likely **Energy Rain** (after **30** cumulative executions). **Blitz Ace needs 80 — not by default.** | Cumulative Overdrive uses, success irrelevant | wiki `[single source]` |
| **Auron** | Bushido | **Dragon Fang** (default), **Shooting Star** (defeat Spherimorph — mandatory), **Banishing Blade** (watch **3** Jecht Spheres). **Tornado needs 10 spheres** — and Braska's Sphere on this very mountain is one of the last two, so Tornado is *plausible but not typical*. | Jecht Sphere collection, **not** usage count | wiki `[single source]` — **corrects the brief's assumption** |
| **Wakka** | Slots | **Element Reels** only, realistically. **Attack Reels requires a blitzball tournament prize; Status Reels additionally requires 250 non-arena battles.** A non-blitzball player has neither. | Blitzball prizes | wiki `[single source]` — **corrects the brief's assumption** |
| **Yuna** | Grand Summon | Always available | — | wiki |
| **Lulu** | Fury | Always available; limited to spells she has learned; **bypasses Reflect and Shell, ignores Silence, costs no MP** | — | wiki `[single source]` |
| **Kimahri** | Ronso Rage | See §6.1 table | Lancet | wiki |
| **Rikku** | Mix | Always available | — | wiki |

**Lulu's Fury bypassing Reflect is a real counter to phase 2** and should be implemented. `[single source: wiki]`

### 7.6 Aeons available

| Aeon | Obtained at | Available here? |
|---|---|---|
| Valefor | Besaid | **Yes** |
| Ifrit | Kilika | **Yes** |
| Ixion | Djose | **Yes** |
| Shiva | Macalania | **Yes** |
| Bahamut | Bevelle | **Yes** (and it is the only one with native Break Damage Limit) |
| Yojimbo | Cavern of the Stolen Fayth (optional) | **Assume NO** |
| Anima | Baaj Temple (optional, needs all Al Bhed destruction spheres) | **Assume NO** |
| Magus Sisters | Remiem Temple (optional) | **Assume NO** |

`[verified: 2 sources — wiki story order + local `encounter-design.md` Yunalesca preset uses the identical five]`

### 7.7 Equipment — what Wantz sells on the mountain

The Mt. Gagazet Wantz shop is **missable** (talk to him on the first visit or he never reappears in Macalania with the four-slot gear). His stock is the canonical "prepared for Seymour Flux" loadout. `[single source: wiki]`

**Weapons**

| Item | User | Abilities | Cost |
|---|---|---|---:|
| Double-Edge | Tidus | Firestrike, Icestrike, 1 empty | 4,350 |
| Conductor | Yuna | Initiative, 3 empty | 90,750 |
| Double Penalty | Wakka | Sleeptouch, Silencetouch, Darktouch | 18,150 |
| Booster Cactuar | Lulu | Magic Booster, Magic +10%, Magic +5%, 1 empty | 112,750 |
| Trident | Kimahri | Firestrike, Icestrike, Lightningstrike | 6,450 |
| Shimmering Blade | Auron | Strength +10%, Strength +5%, 1 empty | 16,650 |
| Survivor | Rikku | Alchemy, Strength +10%, 2 empty | 97,875 |

**Armor** (the Zombie-relevant rows are bolded)

| Item | User | Abilities | Cost |
|---|---|---|---:|
| Tetra Shield | Tidus | HP +10%, Defense +10%, 2 empty | 45,375 |
| **Blessed Ring** | **Yuna** | Magic Def +10%, Magic Def +5%, **Zombie Ward**, 1 empty | 37,750 |
| Tetra Armguard | Wakka | HP +10%, MP +10%, 2 empty | 52,875 |
| Shell Bangle | Lulu | SOS Shell, 2 empty | 18,225 |
| Tetra Armlet | Kimahri | HP +10%, Defense +10%, 2 empty | 45,375 |
| **Blessed Bracer** | **Auron** | HP +10%, **Zombie Ward**, 2 empty | 22,875 |
| Haste Targe | Rikku | SOS Haste, 2 empty | 90,225 |

`[single source: wiki Wantz page]` — prices are the undiscounted figures; the actual price scales with how much gil Tidus gave O'aka earlier.

**Items in stock:** Potion 50, Hi-Potion 500, Phoenix Down 100, **Holy Water 300**, Antidote 50, Eye Drops 50, Echo Screen 50, Soft 50, Power/Mana/Speed/Ability Distiller 100 each. `[single source: wiki]`

> Note the design intent: the merchant standing one screen before the Zombie boss sells **Holy Water** and stocks **two Zombie Ward armors**. Preserve this: the shop is part of the encounter.
>
> ⚠ **Corrected (2026-09-15):** an earlier revision said "Full **Blessed** (Zombie immunity) requires customising with 2× Holy Water onto an armor slot." Both halves are wrong. **Blessed** is the *name* an armor takes when its dominant ability is Zombie Ward **or** Zombieproof — Wantz's Blessed Ring/Bracer are **Ward** pieces, not immunity pieces. And the catalyst costs are **30× Holy Water → Zombie Ward** and **10× Candle of Life → Zombieproof**, not 2× anything. `[verified: 2 sources — FF Wiki *FFX armor* naming table + *Holy Water* / *Candle of Life* customise tables]`

**A second, separate shop exists on the mountain.** The *Mountain Gate* vendor (distinct from Wantz on the Mountain Trail, and **not** missable) sells cheap filler gear whose slots are what the preset actually customises into: physical attackers' weapons carry **Strength +10% + 2 empty**, Yuna's and Lulu's carry **Magic +10% + 2 empty**, and every armor carries **HP +10% + 2 empty**. `[single source: FF Wiki *Final Fantasy X shops*]`

| Item | User | Cost |
|---|---|---:|
| Baroque Sword / Ductile Rod / Switch Hitter / Variable Mog / Devastator | Tidus / Yuna / Wakka / Lulu / Rikku | 22,725 gil |
| Shapeshifter / Shiranui | Kimahri / Auron | 37,875 gil |
| Glorious Shield / Ring / Armguard / Bangle / Armlet / Bracer / Targe | all seven | 4,725 gil |

The 4,725-gil **Glorious** armors are the important line: they are the cheapest way to give **Wakka and Kimahri armor slots at all** (both start the game with 0 — §7.2), and at 4,725 gil they fit inside the 20,000 gil found on this very mountain. `[decompiled: characters.json]` + `[single source: wiki shops]`

---

### 7.7.1 Equipment model — the layer every FFX chapter was missing

> **Scope note.** This subsection is written to be **chapter-agnostic**. `ffx-yunalesca.md` §11 and `ffx-bfa-yu-yevon.md` §4 currently give stat blocks with no weapon or armour at all; they should reference this subsection rather than restate it, and use the per-encounter loadouts in §7.7.2.

**The model in one paragraph.** In FFX a weapon and an armour contribute **no stats of their own**. Every character's damage uses a fixed `base_weapon_damage = 16` (14 for Valefor and Shiva) and a fixed `bonus_crit = 3`. `[decompiled: characters.json]` What equipment actually supplies is **1–4 auto-ability slots**, and those auto-abilities are exactly two things: (a) multiplicative modifiers at damage-pipeline steps 8/9, and (b) status-resistance values. So "what is equipped" is fully specified by **`{slots: n, abilities: [...]}`** — nothing else. That is why the derived damage tables in every chapter were unreproducible: the pipeline had two empty slots in it.

**Slot rules.** `[verified: 2 sources — FF Wiki *FFX auto-abilities* + *FFX armor*]`
- 1 to 4 slots per piece. Abilities may be *added* to an empty slot from Guadosalam onward; **they can never be removed**.
- Equipment with **zero empty slots cannot be customised at all**, nor can Brotherhood or any Celestial Weapon.
- The piece's **name is derived from its abilities** ("ability priority"), which is why the same Zombie-protection family produces "Blessed Ring", "Blessed Bracer", "Blessed Shield" etc. Implement names as a lookup over the ability set, or hard-code the preset names below.

**Default equipment at Sphere Level 0** — decompiled, exact, and the floor under every preset:

| Character | Weapon slots | Weapon abilities | Armor slots | Armor abilities |
|---|---:|---|---:|---|
| Tidus | **0** | — | 1 | — |
| Yuna | 1 | — | 1 | — |
| Auron | 1 | **Piercing** | 1 | — |
| Kimahri | 2 | **Piercing, Sensor** | **0** | — |
| Wakka | 1 | — | **0** | — |
| Lulu | 1 | — | 1 | — |
| Rikku | 1 | — | 1 | — |
| Valefor | 4 | Aeon Ribbon (`—`) | 4 | Sensor, Break HP Limit, Break MP Limit |
| Ifrit | 4 | **Piercing**, Aeon Ribbon | 4 | Sensor, **Fire Eater**, Break HP Limit, Break MP Limit |
| Ixion | 4 | **Piercing**, Aeon Ribbon | 4 | Sensor, **Lightning Eater**, Break HP Limit, Break MP Limit |
| Shiva | 4 | **Piercing**, Aeon Ribbon | 4 | Sensor, **Ice Eater**, Break HP Limit, Break MP Limit |
| Bahamut | 4 | **Break Damage Limit**, **Piercing**, Aeon Ribbon | 4 | Sensor, Break HP Limit, Break MP Limit |
| Anima | 4 | **Break Damage Limit**, **Piercing**, Aeon Ribbon | 4 | Sensor, Break HP Limit, Break MP Limit |
| Yojimbo | 4 | **Piercing**, Aeon Ribbon | 4 | Sensor, Break HP Limit, Break MP Limit |

`[decompiled: characters.json]`; aeon rows independently corroborated by the FF Wiki *FFX auto-abilities* "Aeon auto-abilities" section `[verified: 2 sources]`.

Three consequences implementers keep getting wrong:
1. **Valefor has no Piercing.** Every other aeon does. Against this chapter's Armored Mortiorchis (Def 100), Valefor's Sonic Wings and physicals are the only aeon attacks that get the Armored penalty. `[verified: 2 sources]`
2. **"Aeon Ribbon" (`—`) is why aeons are status-immune.** It is a hidden auto-ability giving perfect protection against *everything* — including Instant Death, all four Breaks, **Eject**, the four Distills, Scan, Defend, Guard and Sentinel — **except Curse and Delay**. This is the mechanism; do not hard-code "aeons are immune" as a special case. ⚠ It also means aeon Eject-immunity comes from an *ability*, so Seymour's Banish (§4.5) must be modelled as an effect that **bypasses** Aeon Ribbon, not as an ordinary Eject roll. `[verified: 2 sources — wiki auto-abilities + decompiled characters.json]`
3. **Aeons already have Break HP Limit and Break MP Limit.** Their stat blocks are not capped at 9,999 HP.

**How auto-abilities enter the damage pipeline.** `[verified: 2 sources — FF Wiki *FFX auto-abilities* "Ability mechanics" + the local §5.1 formula port]`
- **Percentages add, they do not compound.** HP +30% and HP +20% on the same character give **+50%**, not +56%. Same for Strength/Magic/Defense/Magic Def +X%.
- **Strength +X% and Magic +X% modify the damage, not the stat.** They are a multiplier applied at pipeline step 8, *after* the stat has entered the formula. Defense +X% and Magic Def +X% likewise reduce *damage taken*, they do not raise the Defense/Magic Def stat — so they still apply to attacks that ignore the corresponding defence stat.
- **Overdrives are "special" damage.** They are neither physical nor magical, so **Strength +X% and Magic +X% do nothing to them**, and they ignore the target's Shell and Protect. This is load-bearing for §5.7's aeon-Overdrive table and for every character Overdrive in every chapter.
- **HP +X% and MP +X% are the only ones that change a stat** (max HP / max MP) rather than a damage number.

**Status resistance is subtraction, not multiplication.** `[verified: 2 sources — FF Wiki *FFX auto-abilities* "Ability mechanics" + §1.3's resistance-byte model]`

| Tier | Effect | Implementation |
|---|---|---|
| **Ward** ("Sometimes protects against X") | **−50 percentage points** off the infliction chance | `chance = max(0, baseChance − 50)`. An 80% Silence against Silence Ward is **30%**, not 40%. |
| **Proof** ("Almost completely protects against X") | **Perfect** resistance — not 100%, a hard gate | `if (hasProof(status)) return MISS;` regardless of how high the chance is. Only a handful of immunity-bypassing attacks get through, and those bypass Proof too. |
| **Ribbon** | Proof-tier against everything **except** Instant Death, the four Breaks, Curse, Delay and Eject | Same hard gate, over a status set |
| **Aeon Ribbon** (`—`) | Proof-tier against everything **except Curse and Delay** | Same hard gate, wider set |

One documented exception worth encoding: **Auto-Haste (and an active SOS Haste) blocks even immunity-bypassing Slow.** `[single source: wiki]`

**Ward/Proof catalysts the documented strategies need.** Every FFX chapter's "just equip X" advice attaches here. Costs are exact; the availability column is the reasoned judgement.

| Ability | Catalyst | Qty | Realistic acquisition route at Mt. Gagazet / Zanarkand | Verdict for the presets |
|---|---|---:|---|---|
| **Zombie Ward** | Holy Water | **30** | Buy at 300 gil — Wantz, the Mountain Gate vendor, the Calm Lands shop and the Monster Arena all stock it ⇒ **9,000 gil** | **Yes**, trivially affordable `[verified: 2 sources]` |
| **Zombieproof** | Candle of Life | **10** | Steal only: Fallen Monk (×2, common — Bevelle), Don Tonberry (Omega Ruins), Pteryx (Monster Arena) ⇒ ~5 successful Bevelle steals | **No** for a normal run; available to a deliberate player `[single source: wiki Candle of Life]` |
| **Auto-Med** | Remedy | **20** | Not buyable until Rin's airship shop (1,500 gil). Before that: 7 fixed chests + steals from Ochu/Malboro/Ragora/YAT-99/YKT-63 | **No** at Gagazet; **yes** by the Inside Sin chapter `[verified: 2 sources]` |
| **Death Ward** | Farplane Shadow | **15** | Steal: Master Coeurl (×2–4, **always** — Calm Lands / Gagazet), Wraith (common — Inside Sin), Ghost (rare) ⇒ ~5 steals | **Yes** by Zanarkand — this is the answer to Yunalesca's Mega Death `[single source: wiki]` |
| **Deathproof** | Farplane Wind | **60** | Steal: Yunalesca herself (rare), Varuna/Wraith (Inside Sin), Espada. Bribe: Ahriman ×6 @ 70,000 gil ⇒ **10 bribes = 700,000 gil** | **No** for a normal run — Yunalesca chapters should build the Mega Death answer on **Death Ward + Auto-Life**, not Deathproof `[single source: wiki Farplane Wind]` |
| **Stone Ward** | Soft | **30** | Buy at 50 gil everywhere ⇒ **1,500 gil** | **Yes**, trivially `[single source: wiki]` |
| **Stoneproof** | Petrify Grenade | **20** | Steal: Anacondaur (Calm Lands), Demonolith (Zanarkand/Inside Sin), Basilisk, Yowie, Zaurus. Bribe: Yowie ×12 @ 22,500 gil ⇒ ~2 bribes | **Yes** by Zanarkand — this is the real answer to Jecht Beam `[single source: wiki Petrify Grenade]` |
| **Confuse Ward** | Musk | **16** | Steal: **Ahriman ×2–3, always** (the Mt. Gagazet fiend), Floating Death ×4–5 always (Inside Sin). Bribe: Floating Eye ×1 @ 3,500 gil | **Yes** — ~6 Ahriman steals on this very mountain `[single source: wiki Musk]` |
| **Confuseproof** | Musk | **48** | Same sources, 3× the quantity | **Borderline**; ward is the intended answer to Mind Blast `[single source]` |
| **Silence Ward / Silenceproof** | Echo Screen 30 / Silence Grenade 10 | | Echo Screen is 50 gil everywhere | **Yes** / borderline |
| **Poison Ward / Poisonproof** | Antidote 40 / Poison Fang 12 | | Antidote 50 gil everywhere | **Yes** / **yes** |
| **Magic Def +10%** | Wht Magic Sphere | **1** | Sphere Grid drop | **Yes**, one sphere |
| **Magic Def +5%** | Mana Spring | **2** | Common drop | **Yes** |
| **Defense +10%** | Special Sphere | **1** | Uncommon drop | **Borderline** |
| **HP +10%** | Soul Spring | **3** | Common drop | **Yes** |
| **SOS Shell / SOS Protect** | Lunar Curtain 8 / Light Curtain 8 | | Steal: Defender/Defender X (Lunar, always), Iron Giant/Gemini (Light, always) | **Yes** by the Calm Lands |
| **Auto-Shell / Auto-Protect** | Lunar Curtain 80 / Light Curtain 70 | | Same sources ×10 | **No** for a normal run |
| **Auto-Haste** | Chocobo Wing | **80** | Not realistic pre-airship | **No** |
| **Break Damage Limit** | Dark Matter | **60** | Endgame only | **No** — Bahamut's native BDL is the only one in these chapters |

All catalyst quantities `[verified: 2 sources — FF Wiki *FFX auto-abilities* master table cross-checked against each individual item page's "Customize" table]`.

---

### 7.7.2 Authored equipment loadouts for the preset — `[estimate]` composition, `[verified]` components

> **Status.** The *components* — every item name, slot count and ability listed — are wiki- or decompile-sourced and exact. The *composition* (which of them this notional save file has bought and customised) is authored judgement, exactly like §7.3's stat ranges. Label it a development preset in-product.

**Budget check.** The mountain hands the player **20,000 gil** in a single chest, and §7.8 estimates 15,000–40,000 gil total. The loadout below is built to fit inside roughly **35,000 gil plus two Wantz purchases**, so it stays inside the honest "non-grinder" envelope. The luxury Wantz stock (Booster Cactuar 112,750, Survivor 97,875, Conductor 90,750, Haste Targe 90,225) is deliberately **not** in the preset — those are the things the preset cannot afford, and saying so is the point.

**A. Mt. Gagazet — the Seymour Flux preset (this chapter)**

| Character | Weapon | Slots | Weapon abilities | Armor | Slots | Armor abilities |
|---|---|---:|---|---|---:|---|
| **Tidus** | Baroque Sword (Mountain Gate, 22,725) | 3 | Strength +10%, *empty*, *empty* | Glorious Shield (4,725) | 3 | HP +10%, **Zombie Ward** (30× Holy Water), *empty* |
| **Yuna** | *default staff* | 1 | *empty* | **Blessed Ring** (Wantz, 37,750) | 4 | Magic Def +10%, Magic Def +5%, **Zombie Ward**, *empty* |
| **Auron** | *default katana* | 1 | **Piercing** | **Blessed Bracer** (Wantz, 22,875) | 4 | HP +10%, **Zombie Ward**, *empty*, *empty* |
| **Kimahri** | *default spear* | 2 | **Piercing**, Sensor | Glorious Armlet (4,725) | 3 | HP +10%, *empty*, *empty* |
| **Wakka** | *default ball* | 1 | *empty* | Glorious Armguard (4,725) | 3 | HP +10%, *empty*, *empty* |
| **Lulu** | *default moogle* | 1 | Magic +10% (1× Blk Magic Sphere) | Glorious Bangle (4,725) | 3 | HP +10%, **Magic Def +10%** (1× Wht Magic Sphere), *empty* |
| **Rikku** | *default claw* | 1 | *empty* | Glorious Targe (4,725) | 3 | HP +10%, *empty*, *empty* |

Notes that make this loadout *the* Seymour Flux loadout:
- **Three Zombie Wards, not zero and not three Zombieproofs.** Two of them (Yuna, Auron) come free with Wantz's stock; the third is 30× Holy Water on Tidus's Glorious Shield for 9,000 gil. Lance of Atrophy is Zombie @ 100, so a Warded character takes it at **50%** — the combo still lands about half the time, which is exactly the tension the encounter wants. A Zombieproof party would delete the encounter's signature mechanic; that is why the preset deliberately does not have one (and §7.7.1 shows it genuinely cannot afford one).
- **Lulu is the only character in any FFX chapter who previously had no armour listed at all.** She now has a Magic Def +10% slot (the gap list called this out by name) and an HP +10%, which is what makes her survivable through one Total Annihilation at §7.3's 1,000–1,500 HP.
- **Wakka and Kimahri now have armour at all.** Both start with 0 armour slots (§7.2); a 4,725-gil Glorious piece is the cheapest fix and is why the Mountain Gate vendor is in the preset.
- **Nobody has a Magic +% stack except Lulu, and nobody has Strength +% except Tidus and (optionally) Auron.** §5.6's outgoing-damage table should be recomputed with exactly these multipliers: Lulu ×1.10 on magic, Tidus ×1.10 on physicals, everyone else ×1.00.
- **No elemental wards.** Nothing in this encounter is elemental (§1.2: all affinities neutral), so elemental slots would be wasted — which is itself the reason Wantz's Firestrike/Icestrike weapons are *bad* here despite being cheap.

**B. Zanarkand Dome — the Yunalesca preset (for `ffx-yunalesca.md` §11)**

Same save file, a handful of hours later, with the Zanarkand chests and one deliberate Master Coeurl / Anacondaur steal run behind it. Changes from **A** only:

| Character | Change | Why |
|---|---|---|
| **Tidus** | Glorious Shield 3rd slot → **Death Ward** (15× Farplane Shadow) | Mega Death is the fight's wipe button; Death Ward is the affordable answer (Deathproof is not — §7.7.1) |
| **Yuna** | Blessed Ring 4th slot → **Death Ward** | Yuna must survive to cast; she is also the Auto-Life caster |
| **Auron** | Blessed Bracer 3rd slot → **Death Ward**; 4th → **Stone Ward** (30× Soft, 1,500 gil) | Death Ward on the tank; Stone Ward is the cheap half-measure against petrify-shatter |
| **Lulu** | Glorious Bangle 3rd slot → **Death Ward** | |
| **Kimahri / Wakka / Rikku** | 2nd slot → **Death Ward**, 3rd left empty | |
| **Everyone** | **Zombie Ward is retained, not replaced** — Yunalesca's Blender/Osmose phase re-uses Zombie, and abilities can never be removed once added anyway | Ability permanence (§7.7.1) means the Gagazet loadout is *load-bearing on* the Zanarkand loadout. This is a real continuity constraint on the anthology's presets, not a flavour note. |

**C. Inside Sin — the Braska's Final Aeon / Yu Yevon preset (for `ffx-bfa-yu-yevon.md` §4)**

The airship is available, so Rin's shop (Remedy 1,500 gil) and the Calm Lands / Kilika **Tetra** 4-empty-slot armours (15,750 gil) are both open, and gil is no longer the binding constraint. Changes from **B**:

| Character | Change | Why |
|---|---|---|
| **Tidus** | **Tetra Shield** (4 empty) → HP +20% (5× Elixir), **Stoneproof** (20× Petrify Grenade), Death Ward, **Confuse Ward** (16× Musk) | **Stoneproof is the documented answer to Jecht Beam's petrify-then-shatter**, and by this point it is genuinely affordable (~2 Yowie bribes). **Confuse Ward** covers Mind Blast. |
| **Yuna** | Tetra Ring → Magic Def +20% (4× Blessed Gem), **Stoneproof**, Death Ward, **Confuse Ward** | |
| **Auron** | Tetra Bracer → HP +20%, **Stoneproof**, Death Ward, Auto-Med (20× Remedy — now buyable) | Auto-Med finally becomes reachable here, not at Gagazet |
| **Everyone else** | Tetra piece → HP +10/20%, **Stoneproof**, Death Ward, one free slot | |
| **Weapons** | Calm Lands post-airship stock: Strength +10% (or Magic +10% for Yuna/Lulu) + 3 empty. Add Strength +5% / Magic +5% (2× Spring) and **Piercing** (1× Lv. 2 Key Sphere) where missing | Piercing at 1× Lv. 2 Key Sphere is the cheapest ability in the game and the only way past Armored — relevant to Yu Yevon's shell |
| **Not included** | Break Damage Limit (60× Dark Matter), Auto-Haste (80× Chocobo Wing), Ribbon (99× Dark Matter), Celestial Weapons | Endgame-grind gear. **Bahamut's native Break Damage Limit remains the only BDL in any of these three chapters.** |

`[estimate]` for composition; all item names, slot counts, ability names, catalyst types and catalyst quantities `[verified: 2 sources]` per §7.7.1.

**Chest/field pickups on the mountain before the fight:** 20,000 gil, 2× Mega-Potion, Braska's Sphere, Defending Bracer, HP Sphere, Lv. 4 Key Sphere, Saturn Crest (post-battle). `[single source: wiki Mt. Gagazet page]`

### 7.8 Typical inventory — `[estimate]`

| Item | Count | Rationale |
|---|---:|---|
| Potion | 30–60 | accumulates constantly |
| Hi-Potion | 20–40 | Al Bhed shops + drops |
| **X-Potion** | 2–6 | rare at this point |
| **Mega-Potion** | 3–6 | includes the 2 found on this mountain |
| Phoenix Down | 20–40 | cheap and constantly dropped |
| Mega Phoenix | 1–3 | |
| **Holy Water** | **4–10** | *the* consumable for this fight; buyable on-site at 300 gil |
| Remedy | 2–5 | |
| Soft / Antidote / Eye Drops / Echo Screen | 5–15 each | |
| Ether | 3–8 | |
| Turbo Ether | 0–2 | |
| Elixir | 1–3 | +1 guaranteed from stealing Seymour |
| Al Bhed Potion | 10–25 | |
| Grenade / Frag Grenade | 10–25 / 2–6 | Frag Grenade is a 100% Armor Break source |
| Fire/Ice/Lightning/Water Gem | 5–15 each | Fire Gem + Soul Spring = a poison Mix |
| Poison Fang | 3–8 | direct poison source |
| Light/Lunar/Star Curtain | 3–10 each | Shell/Protect/both, as items |
| Healing Water | 2–6 | |
| Gil | 15,000–40,000 | includes the 20,000 found on this mountain |

`[estimate]` — aligned to the `encounter-design.md` Yunalesca preset's inventory philosophy so the two chapters read as one save file's progression.

### 7.9 Overdrive Modes — `[estimate]`

Realistically at this point: **Stoic** (the default everyone starts with), plus **Warrior** and **Comrade** for characters who have been in the front line, and **Healer** for Yuna. Every non-Stoic mode must be learned per-character by repeating its trigger condition a variable number of times, and Monster Arena kills do not count. `[single source: wiki Overdrive Mode page]`

| Character | Likely mode |
|---|---|
| Tidus | Warrior or Stoic |
| Yuna | Healer or Stoic |
| Auron | Stoic (he takes the hits) |
| Wakka | Warrior |
| Lulu | Stoic or Comrade |
| Rikku | Comrade or Stoic |
| Kimahri | Stoic |

Gauges should start the encounter **partially filled (30–70%), not all full** — otherwise the intended "summon everything with full Overdrives" strategy becomes free rather than earned. This matches the local `encounter-design.md` guidance.

---

### 7.9.1 Overdrive gauge fill rates — the exact formulas

The gauge is a 0–100% value. Each Overdrive Mode defines **one increment formula** and the mode's own trigger condition. These are extracted from the game data and are exact. `[single source: FF Wiki *Overdrive Mode*, which states the values are "extracted from the game data"]`

| Mode | Trigger | Increment (as % of a full gauge) |
|---|---|---|
| **Stoic** (default for everyone) | Character takes damage from an enemy | `damageReceived × 30 / maxHP` |
| **Warrior** | Character damages an enemy (**not** offensive items, **not** Overdrives) | `damageInflicted × 10 / estimatedDamage`, **capped at 16%**. `estimatedDamage` = damage a plain Attack would do ignoring enemy Defense, using Magic instead of Strength when Magic is higher. |
| **Comrade** | An ally takes damage | `damageReceived × 20 / target.maxHP` |
| **Healer** | Character restores an ally's HP (**counts even at full HP**; includes absorbing friendly elemental damage) | `healing × 16 / target.maxHP` |
| **Tactician** | Character inflicts a status ailment on an enemy | flat **16%** |
| **Victim** | An enemy inflicts a status ailment on the character | flat **16%** |
| **Dancer** | Character evades an attack | flat **16%** |
| **Avenger** | An enemy KOs an ally | flat **30%** |
| **Slayer** | Character kills an enemy | flat **20%** |
| **Hero** | Character kills an enemy with ≥10,000 HP, or ≥20× more HP than estimated damage | flat **20%** |
| **Rook** | Character reduces/nullifies damage via Nul-, Protect, Shell or Reflect | flat **10%** |
| **Victor** | Character is in the active party when the battle is won | flat **20%** |
| **Coward** | Character Escapes / anyone uses Flee | flat **10%** |
| **Ally** | Start of the character's turn | flat **3%** (4% in the original JP PS2 build) |
| **Sufferer** | Start of turn while suffering a status ailment | flat **16%** |
| **Daredevil** | Start of turn while in Critical | flat **5%** (16% in the original JP PS2 build) |
| **Loner** | Start of turn while the only standing party member | flat **16%** |

Three rules the formulas imply, which the preset numbers below are built on:
- **A Stoic character fills their gauge after taking damage equal to 3⅓× their own max HP.** (`100 / 30 × maxHP`.) At §7.3's HP values that is ~6,000–8,500 damage absorbed.
- **A Warrior character fills their gauge in ~7 normal Attacks** (10% each, 16% cap unreachable by a plain Attack). Six or seven swings — roughly one ordinary random encounter.
- **Overdrives themselves never charge a Warrior gauge**, and offensive items never charge it either.

**Learning cost is per-character and steep**, which is why §7.9's mode assignment is mostly Stoic: Warrior needs 100 (Auron) to 300 (Lulu) qualifying turns; Healer 60 (Yuna) to 200 (Auron); Comrade 100 (Kimahri/Wakka/Lulu/Rikku) to 300 (Tidus). Monster Arena activity does not count. `[single source: wiki]`

---

### 7.9.2 Preset gauge values at encounter start — the numbers §7.9 was missing

> **Persistence is the reason this section has to exist.** Character and aeon Overdrive gauges **carry between battles**. Nothing resets a character gauge except spending it; an **aeon's** gauge is reset to zero only when that aeon is **defeated**. The FF Wiki states the preparation play outright for the identical Seymour Natus fight: *"The player can fill up the aeons' Overdrives before the battle and then summon them one by one."* `[verified: 2 sources — FF Wiki *Aeon (Final Fantasy X)* + *Mortibody*]`

**Character gauges.** Derived, not guessed: the preset assumes the party walked in from the Biran & Yenke duel and roughly two Ronso-fiend random encounters, then touched the save sphere. Values are back-computed from §7.9.1's formulas against §7.3's HP ranges.

| Character | Mode | Start gauge | How the number was derived |
|---|---|---:|---|
| **Tidus** | Warrior | **50%** | ~5 Attacks landed across the approach (5 × 10%). Warrior is the mode a front-line Tidus most plausibly owns (150 turns to learn). |
| **Yuna** | Healer | **40%** | Roughly 2½ full-HP-bar heals' worth of curing across the climb (16% per full heal of a ~2,000 HP ally). |
| **Auron** | Stoic | **70%** | Auron eats the hits: ~2.3× his own max HP in absorbed damage (70 / 30). Highest gauge in the party, which is correct — he is the one the preset expects to open with Dragon Fang. |
| **Kimahri** | Stoic | **100% (full)** | **Not an estimate — a rule.** "If Kimahri learns a new Overdrive using Lancet, his Overdrive meter automatically fills." Kimahri learns **Mighty Guard from Biran Ronso** on this very mountain (§6.1), minutes before this fight. A preset that models the canonical route *must* have Kimahri arrive with a full gauge and Mighty Guard loaded. `[single source: FF Wiki *Overdrive (Final Fantasy X)*]` |
| **Wakka** | Warrior | **30%** | ~3 Attacks; Wakka is the likeliest bench-warmer on a Ronso-heavy stretch. |
| **Lulu** | Stoic | **45%** | 1.5× her (low) max HP absorbed — low HP means Stoic fills fast on her, which is the one advantage of a 1,000–1,500 HP mage. |
| **Rikku** | Comrade | **35%** | `damageReceived × 20 / target.maxHP` on allies: ~1.75 ally-HP-bars of party damage watched from the bench. |

Party average ≈ **53%**, inside §7.9's stated 30–70% band, with one deliberate 100% outlier that is mechanically mandated rather than authored. `[estimate]` for the individual values; the Kimahri row is `[single source]` and is a rule, not a choice; the *formulas* behind every number are `[single source: wiki, "extracted from the game data"]`.

**Aeon gauges — the part §7.9 omitted entirely.**

The design problem the gap list names is real: with all five aeons full, §6 strategy 15 is free; with all five empty, it does not exist. The resolution is that **the fight's own economy refills them**, so the preset should start them *mostly* empty and let the player earn the rest — and the game gives a documented mechanism for doing so.

How an aeon gauge fills: **when the aeon targets an enemy with an attack, and when the aeon is targeted by an enemy attack.** **Boost** (an aeon sub-command) increases damage taken by 50% *and* the gauge fill rate by the same 50%; **Shield** cuts damage by 75% and **negates any Overdrive gain**. Yuna's **Grand Summon** grants a full gauge on the spot, and after that Overdrive fires the gauge **reverts to whatever it was before** — so a Grand Summon on an already-full aeon yields **two consecutive Overdrives**. `[verified: 2 sources — FF Wiki *Aeon (Final Fantasy X)* + *Overdrive (Final Fantasy X)*]`

| Aeon | Start gauge | Reasoning |
|---|---:|---|
| **Valefor** | **100%** | The oldest aeon, used casually since Besaid; she is also the one a player summons for Sonic Wings on trash. Full by default. |
| **Ifrit** | **75%** | Used regularly on the Gagazet approach (Ronso fiends are not fire-immune). One Boosted turn tops him off. |
| **Ixion** | **60%** | |
| **Shiva** | **50%** | |
| **Bahamut** | **100%** | **Authored as full on purpose.** Bahamut is the only aeon in this chapter with native Break Damage Limit (§7.7.1), Mega Flare is the single largest damage event available to the preset, and the wiki names it by name as the reason aeons-with-full-gauges matter here. Starting him empty would remove the encounter's designed high note. |
| **Yojimbo / Anima / Magus Sisters** | n/a | Not owned (§7.6) |

**Total on-demand Overdrive budget at encounter start: 2 full aeon Overdrives + 1 full character Overdrive (Kimahri's Mighty Guard) + ~3 more aeon Overdrives reachable inside the fight.** That is the number the encounter should be balanced against, and it is deliberately *not* "five free Overdrives":

- An aeon gets **exactly one turn before Banish** (§4.5), so a summoned aeon that is not full contributes a stall and one ordinary action — still valuable, because the stall **holds the Total Annihilation charge** (§4.4.2), but not a burst.
- A **half-full aeon can still be topped up inside the fight**: summon it, **Boost**, eat one Cross Cleave or Flare (~2,000 damage at 1.5× fill), and its gauge is meaningfully closer — at the cost of the aeon's one turn. This is the loop the preset is tuned to make attractive.
- **Yuna's Grand Summon is the pressure valve.** With Bahamut already at 100%, one Grand Summon yields **two Mega Flares** — and Yuna's own gauge starts at 40%, so the player must *earn* that by healing. The intended phase-2 win condition is therefore neither free nor absent: it is roughly three guaranteed bursts plus whatever the player manufactures.

`[estimate]` for the six gauge values; the mechanisms (fill triggers, Boost/Shield rates, Grand Summon revert-to-prior, one-turn-before-Banish, gauge reset on aeon death, gauge persistence between battles) are all `[verified: 2 sources]`.

> **Apply the same structure to `ffx-yunalesca.md` §11.5**, which has the identical omission. Yunalesca is fought immediately after Zanarkand Dome's gauntlet, so the honest carry-over is *lower* than this chapter's — the party has just spent aeons on the Spectral Keeper and the Dome fiends. Recommended: Valefor 60 / Ifrit 40 / Ixion 40 / Shiva 55 / Bahamut 30, characters 25–55%, and note that **Yunalesca's Mega Death makes Grand Summon a survival tool, not just a damage tool**, because a summoned aeon is not a party member and cannot be Mega Death'd.

---

## 8. Scene context and beat sheet

### 8.1 Where and when

**Mt. Gagazet, "the Prominence"** — a high, exposed shoulder of the sacred Ronso mountain, above the mountain trail and below the summit. Snow-covered, wind-scoured rock; the mountain is described in-universe as perpetually mist-shrouded at the peak. Daylight, overcast, cold — **not** the famous sunset shot, which comes later at the **summit**, after the Sanctuary Keeper fight, when the party first sees the Zanarkand ruins against a setting sun. `[verified: 2 sources — wiki Mt. Gagazet page + Jegged walkthrough]`

Immediately before the encounter the party has passed the **monuments to summoners who died on the mountain** — Lulu explains they mark guardians and summoners who failed, and that those who die unsent become fiends. This is the thematic setup: the Prominence is a graveyard, and Seymour's entire thesis is that death is mercy.

### 8.2 Seymour's appearance (Flux form)

Japanese name: シーモア:終異体 (*Shīmoa: Shū Itai*), literally **"Seymour: Ending Mutation."** The English "Flux" is from Latin *fluxus*, "flow." `[single source: wiki]`

He **summons the Mortiorchis** — a huge machine-like reliquary/altar construct (Japanese 幻光祈機, *Genkō Reiki*, "pyre-praying machine") — and **sits enthroned upon it**. The fused silhouette is one creature: a robed, multi-limbed upper body rising out of a mechanical body with reaching arms. The Mortiorchis animates every combo attack; Seymour barely moves. Design note for the billboard-sprite pipeline: this is a **two-actor rig sharing one silhouette** — Seymour must have his own idle/cast/hit poses layered over the Mortiorchis's separate idle/claw/charge/annihilate animation set, with an independent HP bar.

### 8.3 Beat sheet — pre-battle

Summarised in my own words. Two short iconic lines are quoted, under 15 words each, for tone reference only.

| # | Beat | Who | Tone |
|---:|---|---|---|
| 1 | The party crests onto the Prominence and finds it strewn with the Ronso dead. Kelk, Biran and Yenke among them — nearly the entire tribe, killed holding the gate so Yuna could pass. | — | Silent horror; wind and snow |
| 2 | Seymour is waiting, unhurried, standing over the bodies. He treats the slaughter as an act of mercy rather than a crime. | Seymour | Serene, obscene |
| 3 | Kimahri reacts first and hardest. This is his people, the mountain he was exiled from and has just been readmitted to by defeating Biran. He charges. | Kimahri | Rage — the loudest he is in the entire game |
| 4 | Seymour turns the knife: he tells Kimahri exactly what became of the Ronso, and that Kimahri arrived too late to matter. | Seymour | Cruel, precise |
| 5 | Seymour has overheard Tidus talking about Jecht. He reveals he knows **Jecht is the current Sin**, and offers Tidus a bargain: kill Sin, and Jecht is freed. He frames himself as the one offering release — to Jecht, to Yuna, to all of Spira. | Seymour | Seductive, messianic |
| 6 | Yuna refuses. The pilgrimage is hers and she will not buy peace at that price; Tidus refuses to let his father be the excuse. | Yuna, Tidus | Quiet defiance |
| 7 | Seymour drops the argument. Roughly: *"Your hope ends here! And your meaningless existence with it!"* He transforms, summoning the Mortiorchis beneath him. | Seymour | Escalation |
| 8 | **BATTLE.** Trigger Commands available: Kimahri (+10 STR), Yuna (+10 MDef). | — | — |

`[verified: 2 sources — wiki Seymour Guado story section + wiki Mt. Gagazet story section + Jegged walkthrough]`

Kimahri's earlier Gagazet line, useful for the rescue beat if you stage step 3 as an intercept: *"Save some for Kimahri!"* `[single source: wiki]`

### 8.4 Beat sheet — post-battle

| # | Beat | Who | Tone |
|---:|---|---|---|
| 9 | Seymour is beaten but **not sent**. He dissolves into pyreflies and vanishes rather than dying — the party understands he will be back. There is no catharsis. | Seymour | Unfinished |
| 10 | Kimahri stands among his dead. The mountain is his again and there is almost no one left to hold it. | Kimahri | Grief, wordless |
| 11 | **Tidus and Auron finally tell Yuna the truth: Sin is Jecht.** The thing she has to kill is the father of the boy beside her. | Tidus, Auron, Yuna | The emotional hinge of the chapter |
| 12 | The party continues upward and finds the **Fayth Scar** — a wall of thousands of fayth, the original people of Zanarkand, still dreaming. | — | Awe, dread |
| 13 | A fayth (the boy who has been following Tidus) reveals the truth underneath everything: **Tidus, Jecht, and all of Dream Zanarkand are a summoned dream.** Yu Yevon has kept it running for a thousand years; Sin protects him so the dream continues. | Fayth, Tidus | The floor drops out |
| 14 | The party climbs on, through the Trials and the underwater passages, toward the summit — and the Sanctuary Keeper, and the first sight of the real Zanarkand at sunset. | — | Exhausted resolve |

`[verified: 2 sources — wiki Mt. Gagazet story section + Jegged walkthrough]`

**Chapter framing recommendation.** The Flux fight is the *only* boss in the game where the villain's argument is materially true — Jecht really is Sin, Yuna really is walking to her death, the Ronso really did die for nothing measurable. The encounter's mechanics say the same thing twice: Lance of Atrophy + Full-Life means *the act of healing someone kills them*, and Total Annihilation means *you cannot outlast this, you can only pre-empt it*. Build the chapter around that rhyme.

### 8.5 Music

**Track:** "Challenge" (挑戦, *Chōsen*), FFX Original Soundtrack, **4:14**, composed by Nobuo Uematsu. It is FFX's "important boss" theme — the equivalent of FFVII's "J-E-N-O-V-A" or FFVIII's "Premonition" — and it plays for the second Sinspawn Gui fight, **Seymour Flux**, **Yunalesca**, Omega Weapon and Dark Bahamut. `[verified: 2 sources — wiki FFX OST track listing + GameRant boss-themes feature]`

> **Do not transcribe, sample, or arrange this track.** The description below exists so you can commission an original piece that occupies the same emotional slot.

**Mood/tempo brief for an original composition** `[estimate — my characterisation, for briefing purposes]`:

| Parameter | Target |
|---|---|
| Tempo | Driving, roughly 150–165 BPM; relentless rather than frantic |
| Meter | 4/4, with syncopated off-beat accents that keep the pulse from settling |
| Texture | Synth-forward and deliberately *artificial* — the distinguishing feature of "Challenge" versus FFX's organic-sounding field music. Hard synth bass riff, gated percussion, metallic/industrial hits, occasional non-musical noise elements |
| Harmony | Minor, modal, ostinato-based. Long stretches over a single pedal with the tension coming from rhythm, not chord motion |
| Melody | Short, angular, repeated motif — a *figure*, not a tune. It should feel mechanical and unsympathetic |
| Arc | Cold, immediate open (no long intro — the battle is already happening). Sustains intensity through a 4-minute loop without a triumphant release |
| Emotional read | Not heroic. **Oppressive and inhuman** — the sound of something that does not care whether you win. That is precisely why it fits Seymour Flux and Yunalesca and nothing else |
| Anti-brief | Avoid: orchestral brass fanfares, major-key lift, rock-guitar heroics, a big drum fill before a chorus. Those are the *normal* battle theme's job |

Since the anthology already plans a Yunalesca chapter, note that **the two encounters share this track in the original**. Commission **one** original "important boss" theme and use it in both chapters — that reuse is faithful, not lazy.

---

## 9. Conflicts, gaps, and verify-before-shipping list

| ID | Conflict / gap | Resolution |
|---|---|---|
| **C-1** | Task brief says the companion is "Mortibody" with Shattering Claw / Desperado. | **Wrong enemy.** The Flux companion is **Mortiorchis**; Shattering Claw and Desperado belong to Mortibody in the Seymour **Natus** fight. Do not ship them here. `[decompiled]` |
| **C-2** | Threaten: decompiled byte reads **0** (landable); the Final Fantasy Wiki AND Game8 (independently, fetched directly) both list **Immune**. | **Confirmed as a genuine two-source-vs-one-source conflict, not a settled misreading.** Per the stated preference rule the decompiled value (Grayfox96 data) is still the recommended default, but this document does not claim the guide disagreement is resolved. **Verify in-game before letting Threaten do anything**; recommend defaulting to immune (matches both independent guides and the rest of the Break/Provoke family) unless in-game testing confirms the decompile. |
| **C-3** | Game8 says both enemies "resist all elements (100%)". Decompiled affinity bytes are all zero = **neutral**. | Trust the decompile. "100%" is a neutral multiplier, not a resistance. |
| **C-4** | Whose stats power Cross Cleave / Total Annihilation. | Resolved in §5.4 in favour of **Seymour's STR 30 / MAG 15**, via decompiled action ownership + three independent guide damage observations. Confidence high but worth one in-game confirmation. |
| **C-5** | `immune_to_life` is unset on Flux but set on every other Seymour form. | No practical consequence (he's Death-immune and the player can't revive him). Noted for completeness. |
| **C-6** | Exact Full-Life target selection when no one is zombied. | Wiki: random **non-KO'd** party member, action whiffs (`misses_if_target_alive`). Implement as stated; low risk. |
| **C-7** | Exact CTB initial placement, ICV rolls, Agility→turn-order breakpoints. | **Not resolved here.** Reuse whatever the Yunalesca chapter's `CombatCore` already does; `FFX_MECHANICS_NOTES.md` already flags initial CTB placement and low-agility tie handling as provisional. Same gap, same fix. |
| **C-8** | Status landing probability for a 90-resist Poison / 50-resist Silence. | The resistance byte is exact; the *roll* it feeds into is the FFX status-chance formula, which is documented at `grayfox96.github.io/FFX-Info/rng/status-chance` and **not transcribed here**. Fetch it before implementing status rolls. |
| **C-9** | Whether an aeon's single pre-Banish turn is guaranteed or is a CTB artefact of Agility 38. | Guides state it as a rule. Treat as a rule; verify. |
| **C-10** | Overdrive gauge carry-over between battles for aeons. | Required for strategy #15 to work at all. Confirm the local combat core supports persistent aeon gauges — `FFX_MECHANICS_NOTES.md` currently lists "full Aeon replacement" and "Overdrive gauges" as incomplete. |
| **C-11** | Entire §7 party preset. | `[estimate]` by construction. Playtest against recorded ordinary-progression footage before claiming fidelity, exactly as `encounter-design.md` §"Do not claim yet" requires. |
| **C-12** | **RESOLVED (2026-09-15).** Earlier revision: fourth Mortibsorption decays Mortiorchis's max HP to 0 and it "stays dead"; §4.4.2's charge ladder and §4.8's `mortiorchisTurn()` had no dead-state branch. | **The premise was false.** Max HP floors at **1,000** and the mount revives on every kill, forever. Corrected in §2.2, §4.4.2, §4.8 and §6 row 17. `[verified: 2 sources — FF Wiki *FFX enemy abilities* master table ("1,000 HP onward") + GamerGuides ("minimum threshold of 1,000 HP")]`. Secondary sub-conflict, **still open**: the FF Wiki credits *Mortiorchis* as the user of Cross Cleave / Total Annihilation / the two charge announcements, while the decompiled `monster_actions.json` puts those rows in **Seymour's** list (`m142`). Because the mount can never die, the two attributions can never diverge at runtime, so this is cosmetic — but §5.4's "Seymour's stats, not Mortiorchis's" ruling depends on the decompile being right, so it stays on the verify list. |
| **C-13** | Whether Mortibsorption (a death-trigger reaction) consumes or advances a Total Annihilation charge step, and whether it trips the §4.1 two-turns-in-a-row no-op guard. | **Not directly sourced.** §4.4.2 and §4.8 implement it as a pure reaction: no turn consumed, `chargeTurns` untouched, alternation guard untouched. That follows from §3.2 (Mortiorchis's *scheduled* action list contains only `Command 150` and Mortibsorption) but no guide states it. `[single source: derived]` — **verify in-game**; the observable test is whether a player who kills the mount during a "Ready To Annihilate" turn delays Total Annihilation. |
| **C-14** | Whether Zombie **Ward** or Zombie**proof** is what guides mean by "Blessed armor". | **Resolved against the earlier revision.** "Blessed" is the *name* for either; Wantz's stock is **Ward**. Corrected in §6 rows 1–3 and §7.7. Knock-on: §6 row 1's claim that the Lance of Atrophy → Full-Life combo is "broken outright" is only true with **Zombieproof**, which costs 10× Candle of Life and is **not** realistically available at Mt. Gagazet. With Ward the combo lands at 50%. `[verified: 2 sources — FF Wiki *FFX armor* naming table + the *Holy Water* / *Candle of Life* customise tables]` |
| **C-15** | Exact aeon Overdrive-gauge increment per attack given/received. | **Not found in any source.** The *triggers* are documented (attack an enemy, be targeted by an enemy; Boost +50%, Shield 0) but no percentage constant is published, and Grayfox96's data files do not expose one. §7.9.2's aeon values are therefore `[estimate]` composition over verified mechanics. If exact numbers are needed, they must come from frame-by-frame observation or a save-state read. |
| **C-16** | Whether §7.9.2's "Kimahri arrives with a full gauge" holds in the shipped chapter. | It holds **only if** the Biran & Yenke lead-in encounter is implemented and Kimahri actually Lancets Mighty Guard there (§6.1). If the anthology ships Seymour Flux standalone, drop Kimahri to ~45% and remove Mighty Guard from his kit — otherwise the preset silently hands the player the best answer to Total Annihilation for free. |

---

## 10. Minimum viable mechanic list for this chapter

Ordered by implementation dependency. Anything below the line is required for the *documented* strategies to function.

1. CTB scheduler with rank-based recovery, turn prediction UI, three-active/seven-reserve swapping.
2. **Zombie** status with healing inversion (Cure/Curaga/Regen/Potion/Phoenix Down/Full-Life all become damage), plus **Holy Water** and **Remedy** as cures, plus **Esuna**.
3. **Poison** as a % -of-**max**-HP DoT ticking on the afflicted actor's turn, excluded from enemy AI HP-threshold checks.
4. **Protect / Shell / Reflect / Dispel / Haste / Hastega / Slow / Slowga / Regen / Silence** with correct interaction flags per action (`affected_by_reflect`, `affected_by_silence`, `ignores_armored`).
5. **Reflect bouncing a *self*-targeted enemy spell onto the opposing party** — and, when absent, letting it resolve on the caster.
6. **Cheer and Focus with their defensive halves** (`15 - stacks` in the damage formula), stacking to 5.
7. **Defend** stance.
8. **Armored** + **Piercing** weapon property.
9. **Eject** status and aeon banishment.
10. **Aeon summon/dismiss with persistent Overdrive gauges**, plus Grand Summon's temporary-gauge behaviour.
11. **Break Damage Limit** as a weapon property (Bahamut only, at this point).
12. Counters: on-delay-attempt → Slowga; on-HP-threshold → self-buff.
13. Multi-hit party-wide actions (Total Annihilation = 5 discrete party-wide hits, each resolved and displayed separately).
14. An enemy-actor alternation guard producing visible no-op turns.
15. A two-stage on-screen charge telegraph ("Auto-Attack Mode" → "Ready To Annihilate") that the player has real turns to answer.
16. HP-transfer/drain between two enemy actors with a mutating max-HP value.
17. Trigger Command (pre-battle Talk) granting a battle-scoped stat bonus.
18. Item `Use`, Rikku's `Mix`, Kimahri's `Lancet` + Ronso Rage roster, Wakka's status Attacks/Busters.
19. **Equipment as `{slots, abilities[]}` and nothing else** (§7.7.1): 1–4 slots per piece, abilities permanent once added, no empty slot ⇒ not customisable. Auto-abilities as pipeline steps 8/9 (percentages **add**, never compound; Str+%/Mag+% do nothing to Overdrives) and as status resistance (**Ward = −50 percentage points, subtracted**; **Proof = a hard gate, not 100%**). Includes **Zombie Ward**, **Auto-Med**, **Aeon Ribbon** as the mechanism behind aeon status immunity, and Banish as an effect that *bypasses* Aeon Ribbon.
20. A pre-battle merchant (Wantz) whose stock is part of the encounter's answer — plus the non-missable Mountain Gate vendor whose 4,725-gil Glorious armors are the only way Wakka and Kimahri get armour slots at all.
21. **Overdrive gauges as a persistent 0–100% per-character and per-aeon value** (§7.9.1–7.9.2): mode-driven increment formulas, aeon gauges filled by attacking and by being attacked, **Boost** (+50% damage taken, +50% fill) and **Shield** (−75% damage, **zero** fill), **Grand Summon** granting a full gauge that **reverts to its prior value** after firing, gauge reset to zero on aeon death only, and Lancet-learning auto-filling Kimahri's gauge.

---

## Sources

**Decompile-derived data (primary layer)**

- https://github.com/Grayfox96/FFX-RNG-tracker — repository root
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_mon_data.csv — monster stat table (Seymour Flux `m142`, Mortiorchis `m143`, Mortibody `m127`, Seymour Natus `m126`, Seymour Omnis `m131`)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_monmagic2.csv — monster action table (file id 6)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_command.csv — player/aeon command table (file id 3)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/monster_actions.json — per-monster action-id + target assignments
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/characters.json — character/aeon base stats and default equipment abilities
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/items.csv — item id ordering
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/text_characters.csv — text encoding table
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/monsters.py — monster field offsets
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/actions.py — action field offsets
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/constants.py — Status / Element / DamageFormula / TargetType enum orderings
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/statuses.py — no-RNG status flag ordering (used to decode Banish → Eject)
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/events/character_action.py — damage formula (`get_damage`, `_get_power`, `_get_mitigation`)
- https://grayfox96.github.io/FFX-Info/rng/ — RNG documentation index
- https://grayfox96.github.io/FFX-Info/rng/status-chance — status landing formula (**not yet consulted in detail; see conflict C-8**)
- https://grayfox96.github.io/FFX-Info/rng/damage-crit-escape-icv — damage/crit/ICV RNG documentation

**Wiki (fetched via `finalfantasy.fandom.com/api.php?action=parse&prop=wikitext`)**

- https://finalfantasy.fandom.com/wiki/Seymour_Flux
- https://finalfantasy.fandom.com/wiki/Mortiorchis
- https://finalfantasy.fandom.com/wiki/Mortibody
- https://finalfantasy.fandom.com/wiki/Seymour_Natus
- https://finalfantasy.fandom.com/wiki/Seymour_Guado
- https://finalfantasy.fandom.com/wiki/Mt._Gagazet
- https://finalfantasy.fandom.com/wiki/Kimahri_Ronso
- https://finalfantasy.fandom.com/wiki/Wantz
- https://finalfantasy.fandom.com/wiki/Ronso_Rage
- https://finalfantasy.fandom.com/wiki/Overdrive_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Swordplay_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Bushido_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Slots_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Overdrive_Mode
- https://finalfantasy.fandom.com/wiki/Trigger_Command
- https://finalfantasy.fandom.com/wiki/Sphere_Grid
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X:_Original_Soundtrack

**Guides and secondary sources**

- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/seymour-flux
- https://game8.co/games/Final-Fantasy-X/archives/269182 — How to beat Seymour Flux
- https://game8.co/games/Final-Fantasy-X/archives/269186 — How to beat Seymour Natus
- https://jegged.com/Games/Final-Fantasy-X/Walkthrough/26-Mt-Gagazet.html
- https://samurai-gamers.com/final-fantasy-x-x2-hd-remaster/seymour-flux-boss-guide/
- https://steamcommunity.com/sharedfiles/filedetails/?id=1123193283 — "Beating Seymour Flux for non-grinders"
- https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/zanarkand — GameFAQs FFX walkthrough (Zanarkand/mechanics section; used for CTB/mechanics vocabulary consistency with the local Yunalesca notes)
- https://www.neoseeker.com/final-fantasy-x-x2-hd/faqs/252610-final-fantasy-x-stats.html — stat/formula reference (cited by the local `FFX_MECHANICS_NOTES.md`)
- https://gamerant.com/final-fantasy-franchise-best-boss-themes/ — "Challenge" characterisation

**Additional sources added during fact-check verification pass (2026-09-15)**

- https://game8.co/games/Final-Fantasy-X/archives/269182 — Game8 "How to beat Seymour Flux" (re-fetched directly to check the Threaten and elemental-affinity claims; already listed above but re-confirmed independently for this pass)
- https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/zanarkand — corroborates the Total Annihilation ~4,000 damage figure and the two-turns-in-a-row alternation rule (already listed above; re-confirmed independently for this pass)
- Final Fantasy Wiki "Total Annihilation" page (finalfantasy.fandom.com) — surfaced independently via search; confirms base power 44 for the 5-hit non-elemental Magic-formula attack
- Final Fantasy Wiki "Banish (Seymour ability)" page (finalfantasy.fandom.com) — surfaced independently via search; confirms the one-turn-before-Eject rule for summoned aeons
- EIP Gaming Ronso Rage guide (via independent web aggregation) — corroborates the Biran Ronso / Yenke Ronso learnable-ability roster including Mighty Guard and White Wind
- Independent web aggregation (unattributed secondary corroboration, not individually re-fetched) — corroborates: Mortiorchis initial HP 4,000 and the 1,000-HP Mortibsorption decay sequence; the Protect-below-75%/Reflect-below-50% dual-threshold reaction rule and the poison-exclusion rule; the Kimahri +10 Strength / Yuna +10 Magic Defense Trigger Command figures

**Additional sources added during the gap-fill pass (2026-09-15)**

Fetched directly via `finalfantasy.fandom.com/api.php?action=parse&prop=wikitext` except where noted.

- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities — the enemy-ability master table. **Primary evidence for the Mortibsorption floor**: "First use absorbs 4,000 HP, second 3,000 HP, third 2,000 HP, and 1,000 HP onward." Also confirms Cross Cleave power 52 + strong Delay, Lance of Atrophy power 16 + Zombie 100% + 30% PDR, and that *Auto-Attack Mode* charges for *Ready To Annihilate*, which in turn charges for Total Annihilation.
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/seymour-flux — re-fetched for the gap-fill pass. **Independent (non-wiki) corroboration of the floor**: "starts at 4,000 HP and decreases by 1,000 HP until reaching a minimum threshold of 1,000 HP", and "players cannot simply eliminate it as a permanent solution".
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_auto-abilities — full weapon/armor auto-ability tables with **exact catalyst types and quantities**, the percentage-addition rule, the Ward-subtracts-50 / Proof-is-a-hard-gate rule, the Overdrive-is-special-damage rule, and the "Aeon auto-abilities" section describing the hidden `—` (Aeon Ribbon) ability.
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_armor — armor slot mechanics and the **ability-priority naming table**; source for "Blessed = Zombie Ward **or** Zombieproof" and for the Tetra 4-empty-slot line.
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_weapons — weapon slot/naming counterpart.
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_shops — the **Mt. Gagazet Mountain Gate** vendor (Glorious armors 4,725 gil, Strength/Magic +10% weapons), the Calm Lands before/after-airship stock, and Rin's post-airship Remedy supply. Also re-confirms the Wantz Mountain Trail stock already in §7.7.
- https://finalfantasy.fandom.com/wiki/Wantz — re-fetched; the §7.7 table matches this page line for line.
- https://finalfantasy.fandom.com/wiki/Holy_Water_(Final_Fantasy_X) — **Zombie Ward = 30× Holy Water**; buyable 300 gil at Calm Lands, Monster Arena, Mt. Gagazet, Rin.
- https://finalfantasy.fandom.com/wiki/Candle_of_Life_(Final_Fantasy_X) — **Zombieproof = 10× Candle of Life**; steal-only (Fallen Monk, Don Tonberry, Pteryx). The basis for ruling Zombieproof out of the Mt. Gagazet preset.
- https://finalfantasy.fandom.com/wiki/Farplane_Shadow_(Final_Fantasy_X) — **Death Ward = 15×**; Master Coeurl always drops 2–4 on steal.
- https://finalfantasy.fandom.com/wiki/Farplane_Wind_(Final_Fantasy_X) — **Deathproof = 60×**; the basis for ruling Deathproof out and recommending Death Ward + Auto-Life for the Yunalesca chapter.
- https://finalfantasy.fandom.com/wiki/Petrify_Grenade_(Final_Fantasy_X) — **Stoneproof = 20×**; Yowie bribe ×12 @ 22,500 gil makes it affordable by Zanarkand (the Jecht Beam answer).
- https://finalfantasy.fandom.com/wiki/Musk — **Confuse Ward = 16×, Confuseproof = 48×**; Ahriman (the Mt. Gagazet fiend) yields 2–3 on every steal (the Mind Blast answer).
- https://finalfantasy.fandom.com/wiki/Remedy_(Final_Fantasy_X) — **Auto-Med = 20× Remedy**; not buyable until Rin's airship shop, which is why Auto-Med is a post-Gagazet ability in the presets.
- https://finalfantasy.fandom.com/wiki/Lunar_Curtain_(Final_Fantasy_X) / .../Light_Curtain_(Final_Fantasy_X) / .../Star_Curtain_(Final_Fantasy_X) — SOS- and Auto- Shell/Protect/Reflect catalyst counts.
- https://finalfantasy.fandom.com/wiki/Overdrive_Mode — **the exact per-mode increment formulas and per-character turns-to-learn**, stated by the page to be "extracted from the game data". Source for every number in §7.9.1.
- https://finalfantasy.fandom.com/wiki/Overdrive_(Final_Fantasy_X) — Grand Summon's full-gauge-then-revert behaviour (and the two-consecutive-Overdrives consequence); Lancet-learning auto-fills Kimahri's gauge; Overdrives are special damage.
- https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X) — **aeon gauge fill triggers**, Boost (+50% damage, +50% fill) and Shield (−75% damage, zero fill), gauge reset to zero on aeon death, aeon revive-after-N-battles counts, and the per-aeon command rank table.
- https://finalfantasy.fandom.com/wiki/Mortibody — the same Mortibsorption ability in the Seymour Natus fight, stated as "decreases in increments of 1,000 until it **caps at 1,000**" and "will use Mortibsorption even if it kills Seymour"; also the explicit "fill up the aeons' Overdrives before the battle and then summon them one by one" preparation play.
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/characters.json — re-read for the gap-fill pass to extract **per-character and per-aeon default weapon/armor slot counts and abilities** (§7.7.1), including Valefor's missing Piercing and every aeon's hidden Aeon Ribbon.

**Local prior research (read, no Seymour Flux content found)**

- `D:/Projects/Final Fantasy/docs/encounter-design.md`
- `D:/Projects/Final Fantasy/CrystalReverie/Docs/FFX_MECHANICS_NOTES.md`

**Rights note.** Square Enix owns *Final Fantasy X*, its characters, dialogue, music and art. Nothing in this document licenses reuse of any asset. All scene content above is summarised in my own words; the two quoted lines are under 15 words each and attributed. "Challenge" must be replaced with an original composition, not arranged or sampled.

---

## 11. Verification log (fact-check pass, 2026-09-15)

Every claim below was independently re-checked against a source not already relied on for that specific line. Confidence tags in the body text above were upgraded to `[verified: 2 sources]` wherever a claim below verdicted "confirmed" previously carried a weaker tag.

| Claim | Verdict | Note |
|---|---|---|
| Seymour Flux HP = 70,000 | confirmed | Already tagged `[verified: 2 sources]`; re-confirmed via GamerGuides (fetched directly). |
| Seymour Flux Overkill threshold = 3,500 | confirmed | Tag upgraded to `[verified: 2 sources]`. |
| Seymour Flux AP (normal kill) = 10,000 | confirmed | Tag upgraded to `[verified: 2 sources]`. |
| Poison tick on Seymour Flux = 1,400/turn (2% of 70,000 max HP) | confirmed | Already `[verified: 2 sources]`; corroborated by independent aggregation of FF Wiki/Samurai Gamers/Steam guide content. |
| Cross Cleave ≈ 2,000 party-wide damage (base 52, Strength formula) | confirmed | Already `[verified: 2 sources]`; independently re-confirmed via GamerGuides direct fetch, matching Game8's description. |
| Total Annihilation: 5-hit, non-elemental, Magic formula, base power 44 | confirmed | Tag added — `[verified: 2 sources]` (decompile + Final Fantasy Wiki). |
| Total Annihilation ≈ 4,000 total party damage | confirmed | Tag upgraded from `[verified: derived + 1 guide]` to `[verified: 2 sources]` (Steam guide + independent GameFAQs corroboration). |
| Threaten resistance: decompiled byte = 0 (landable) vs. guides calling it immune/resistant | **contradicted** | Correction applied in §1.3 and §9 (C-2): this is a genuine, still-unresolved two-source (Wiki + Game8) vs. one-source (decompile) conflict. The document no longer implies the disagreement is settled in the decompile's favor; it flags the conflict and recommends defaulting to immune pending in-game verification, while noting the decompile remains the nominal-preference source per the stated rule. |
| Mortiorchis initial HP = 4,000 | confirmed | Already `[verified: 2 sources]`. |
| Mortiorchis is Armored | confirmed | Already `[verified: 2 sources]`. |
| Mortibsorption HP-transfer sequence 4,000→3,000→2,000→1,000→0, total 10,000 | ~~confirmed~~ **SUPERSEDED — see §12 gap-fill log, correction 1** | The 4,000/3,000/2,000/1,000 *drain* sequence is confirmed, but the terminal max-HP value is **1,000, not 0**, and the total is **unbounded, not 10,000**. This 2026-09-15 fact-check pass verified only the four drain amounts and read "finally 1,000" on the Mortiorchis page as "then dead"; it did not consult the FF Wiki enemy-ability master table ("1,000 HP onward"), the Mortibody page ("caps at 1,000") or GamerGuides ("minimum threshold of 1,000 HP"). Corrected in §2.2. |
| Two-turns-in-a-row alternation rule (no-op on the second turn) | confirmed | Tag upgraded from `[single source]` to `[verified: 2 sources]`. |
| HP-threshold reactions: Protect below 75%, Reflect below 50%, both can fire together | confirmed | Tag upgraded to `[verified: 2 sources]`. |
| Poison damage does not trigger HP-threshold reactions; Mortibsorption damage does | confirmed | Tag upgraded to `[verified: 2 sources]`. |
| Summoned aeon gets exactly one turn before Banish/Eject | confirmed | Already `[verified: 2 sources]`; second source specifically identified as the FF Wiki "Banish" page. |
| Trigger Commands: Kimahri +10 Strength, Yuna +10 Magic Defense | confirmed | Tag upgraded to `[verified: 2 sources]`. |
| Elemental affinities all neutral per decompile (vs. Game8's "resists all elements 100%") | unverifiable | No change to the underlying claim — no second independent source stating "neutral" was found; the document's preference for the decompile remains reasonable but uncorroborated by a second data source. Left as-is, not upgraded. |
| Flare always cast at Self; bounces via Reflect; resolves on Seymour as "Failed Counterstrike" if Reflect is gone | confirmed | Already `[verified: 2 sources]`. |
| Mighty Guard from Biran Ronso, White Wind from Yenke Ronso (via Lancet, at Mt. Gagazet) | confirmed | Tag upgraded to `[verified: 2 sources]` (EIP Gaming + Jegged). |
| Wantz's Mt. Gagazet shop sells Blessed Ring/Bracer with Zombie Ward; Zombie Ward/Blessed also craftable via Holy Water | confirmed | Already independently corroborated; body text tags in §6/§7.7 unchanged as they already carried `[verified: 2 sources]` or equivalent multi-source backing. |
| "Challenge" (Uematsu) plays for 2nd Sinspawn Gui, Seymour Flux, Yunalesca, Omega Weapon, Dark Bahamut | confirmed | Already `[verified: 2 sources]`. |
| Kimahri's Lancet on Seymour Flux teaches nothing (`ronso_rage_id = 0`) | unverifiable | No second source found addressing Flux specifically; claim rests on the single decompiled source. Left as-is, not upgraded. |

**Corrections applied: 1** (Threaten resistance, C-2 — reframed from an implied "trust the decompile, guide is a misreading" resolution to an explicitly flagged, unresolved two-source-vs-one-source conflict).

---

## 12. Gap-fill log (2026-09-15)

Three gaps were raised against this document. All three are now filled in place. Two of them turned up **factual errors** in the previous revision, both of which would have shipped as bugs.

| # | Gap | Severity | Outcome | Where |
|---:|---|---|---|---|
| 1 | No stated behaviour for Total Annihilation once Mortiorchis's max HP decays to 0 and it "stays dead"; `mortiorchisTurn()` had no dead-state branch | blocker | **Filled — and the premise was wrong.** Mortiorchis's max HP **floors at 1,000** and it revives on every kill, unboundedly. There is no dead state, Total Annihilation is never removed, and the alternation guard never sees a one-actor board. The decay is `max(1000, maxHp − 1000)`, not `maxHp − 1000`. | §2.2 (correction box + rewritten table), §4.4.2 (new state table + attribution note), §4.8 (rewritten `onHpZero`, assertion in `mortiorchisTurn`), §6 row 17, C-12, C-13 |
| 2 | No FFX chapter supplies an equipment loadout; Ward/Proof strategies had nothing to attach to; Lulu had no armour anywhere | major | **Filled.** New §7.7.1 defines the whole equipment model (slots, permanence, pipeline placement, Ward = −50pp subtracted, Proof = hard gate, Aeon Ribbon) with exact decompiled default loadouts for all 7 characters and all 8 aeons, plus a catalyst/affordability table for every Ward and Proof the strategies name. New §7.7.2 gives three explicit named loadouts — **A: Mt. Gagazet**, **B: Zanarkand (for `ffx-yunalesca.md` §11)**, **C: Inside Sin (for `ffx-bfa-yu-yevon.md` §4)** — with slot counts, abilities and gil costs. Lulu now has armour. | §7.7, §7.7.1, §7.7.2, §6 rows 1–3, §10 item 19–20, C-14 |
| 3 | §7.9 gave a 30–70% band with no per-character values and said nothing about aeon gauges, while §6 strategy 15 makes full aeon gauges the win condition | major | **Filled.** New §7.9.1 transcribes the exact, data-extracted increment formula for all 17 Overdrive Modes. New §7.9.2 gives a per-character gauge value with the derivation for each, a per-aeon gauge value, and the resulting Overdrive budget (2 guaranteed aeon bursts + Kimahri's mandated full gauge + ~3 more earnable in-fight). Includes the recommended values for `ffx-yunalesca.md` §11.5. | §7.9.1, §7.9.2, §10 item 21, C-15, C-16 |

**New conflicts opened by this pass:** C-12 (secondary: wiki-vs-decompile attribution of Total Annihilation — cosmetic, since the mount is unkillable), C-13 (does Mortibsorption advance the charge ladder? — derived, unverified), C-15 (no published aeon gauge increment constant), C-16 (Kimahri's full gauge depends on shipping the Biran & Yenke lead-in).

**Corrections applied by this pass: 2.**
1. *Mortibsorption decays to 0 → "stays dead"* → **floors at 1,000, revives forever.** `[verified: 2 sources]`
2. *"Blessed armor = full Zombie immunity, customised with 2× Holy Water"* → **"Blessed" names either Zombie Ward or Zombieproof; Wantz's stock is Ward (−50pp); Ward costs 30× Holy Water and Zombieproof costs 10× Candle of Life.** `[verified: 2 sources]`
