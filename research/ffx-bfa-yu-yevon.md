# FFX — Braska's Final Aeon & Yu Yevon (Dream's End / Inside Sin)

**Target:** Pyrefly Reprise encounter chapter — implementation-ready reference.
**Scope:** Braska's Final Aeon (both forms) + Yu Pagodas → possessed-aeon gauntlet → Yu Yevon → the Sending / ending.
**Compiled:** 2026-09-15. Every number carries a confidence tag. Conflicts between sources are recorded explicitly, never silently averaged.

> **Rights note.** Square Enix owns *Final Fantasy X*. Nothing here is an asset. Dialogue is summarised in our own words; the few direct quotes are short, iconic, and attributed. Ship original art/audio/text.

---

## 0. Source-tier policy and the one structural conflict

Two classes of data are used:

| Tier | Source | Use |
|---|---|---|
| **A — decompile** | `ffx_mon_data.csv`, `ffx_monmagic2.csv`, `ffx_command.csv`, `monster_actions.json` from **Grayfox96/FFX-RNG-Tracker** (byte-level dumps of the retail monster/ability structs, plus the tracker's reimplemented damage formula) | Authoritative for per-entry base stats, ability damage formula/base power/status chances/flags |
| **B — guides/wiki** | Final Fantasy Wiki (Fandom, via MediaWiki API), Gamer Guides, Game8 | Authoritative for **battle-script** behaviour (form transitions, turn patterns, revive rules) which is *not* in the monster struct |

### The structural conflict you must understand before implementing

`ffx_mon_data.csv` stores **one entry per monster**, and the HP field of that entry is **not always the HP you fight**. Proof, from the same file:

| Entry | `mon_data` HP field | Actual in-battle HP | Source of truth |
|---|---:|---|---|
| m173/m174 **Yu Pagoda** | 65535 | **5,000** | Wiki bestiary + Gamer Guides + the entry's own `overkill` field (5000) |
| m130 **Yunalesca** | 132000 | 24,000 / 48,000 / 60,000 (= 132,000 summed) | Local prior research + guides |
| m132 **Braska's Final Aeon** | 60000 | **60,000 then 120,000** | Wiki bestiary + Game8 + Gamer Guides + Fandom walkthrough |

**Resolution adopted here:** the monster struct holds the *form-1 / baseline* values; the encounter's battle script overrides HP (and, for BFA, Strength) on transformation. This is independently corroborated by damage math — see §1.5, where form-2 Strength 50 (wiki) reproduces the documented Ultimate Jecht Shot damage band and Strength 45 (struct) does not. **Implement 60,000 → 120,000.** [verified: 4 sources]

---

## 1. Braska's Final Aeon (Jecht)

Bestiary #233. Japanese ブラスカの究極召喚 (*Braska's Ultimate Summon*). French release name: *Jecht, l'Ultime Chimère*.
Arena: **Dream's End**, the innermost chamber of Sin. Party at battle start is **forced to Tidus / Yuna / Auron**; reserve swapping works normally. [verified: 2 sources]

### 1.1 Stat block

| Stat | Form 1 | Form 2 | Confidence / note |
|---|---:|---:|---|
| HP | **60,000** | **120,000** | [verified: 4 sources] — struct holds 60000 only; see §0 |
| Overkill threshold | 20,000 | 20,000 | [verified: 2 sources] (struct + wiki) |
| MP | 100 | 100 | [single source: decompile] — **wiki says 106**; conflict, see §1.7 |
| Strength | **45** | **50** | F1 [verified: 2 sources]; F2 [verified: 2 sources] (wiki + damage-band derivation §1.5) |
| Defense | 100 | 100 | [verified: 2 sources] |
| Magic | 50 | 50 | [verified: 2 sources] |
| Magic Defense | 100 | 100 | [verified: 2 sources] |
| Agility | 44 | 44 | [single source: decompile] — **wiki says 40**; conflict, see §1.7 |
| Luck | 15 | 15 | [verified: 2 sources] |
| Evasion | 0 | 0 | [verified: 2 sources] |
| Accuracy | 10 | 10 | [verified: 2 sources] |
| AP (normal / overkill) | 0 / 0 | 0 / 0 | [verified: 2 sources] |
| Gil | 0 | 0 | [verified: 2 sources] |
| Poison tick | 1% of max HP = **600** | 1% = **1,200** | [verified: 2 sources] (struct byte 42 = 1; wiki `poison% = 1`) |
| Steal | Common **Turbo Ether**, Rare **Elixir** | same | [verified: 2 sources] |
| Drop | none | none | [verified: 2 sources] |

### 1.2 Elemental and status table

Elements: **Fire / Ice / Thunder / Water / Holy — all Neutral**. No weakness, no resistance, no absorb. [verified: 2 sources — struct bytes 43–46 all zero; Gamer Guides "Weak: nothing / Strong: nothing"]

> Game8's page claims "resists all elements (100%)". The struct is unambiguous that all five affinities are Neutral; Game8's "100%" is almost certainly a mis-rendered *status* resistance column. **Use Neutral.** [conflict recorded]

| Status | Value | Meaning for implementation |
|---|---|---|
| Death | Immune | |
| Petrify | Immune | |
| Sleep | Immune | |
| Dark (Blind) | Immune | |
| Slow | Immune | |
| Regen | Immune | |
| Doom | Immune | |
| Threaten | Immune | |
| Eject | Immune | |
| Distillers (all 4) | Immune | |
| Bribe | Immune | |
| Delay | Immune | struct byte 41 bit0 |
| **Zombie** | **resist 50** | *lands* — the key exploitable status (§1.6) |
| **Silence** | resist 75 | lands |
| **Poison** | resist 90 | lands |
| Power / Magic / Armor / Mental Break | **0 (lands freely)** | Full Break is fully effective |
| Haste, Shell, Protect, Reflect, Boost, Shield, Curse, NulX, Scan | 0 | lands (mostly irrelevant) |
| **Immune to percentage/fractional damage** | yes | Demi/Gravity and % attacks do 0 |
| **Immune to "Life"/revivification** | yes | **Phoenix Down / Mega Phoenix / Elixir / Megalixir / X-Potion / Healing Water / Tetra Elemental do nothing, even while he is Zombie** |
| Zanmato level | 6 (5 in the original JP/NA release) | Zanmato one-shots the current form; **form 2 must still be fought** |
| Party may flee | No | |

[verified: 2 sources for the whole table — decompiled struct bytes 40–79 and the wiki bestiary infobox]

### 1.3 Ability table — exact decompiled data

All rows below are byte-exact from `ffx_monmagic2.csv` unless noted. "Base" = the struct's base-damage byte fed into the FFX damage formula (§1.5).

| # | Ability | Form | Target | Formula | Type | Base | Hits | Status | Dmg-limit flag | Other flags |
|---:|---|---|---|---|---|---:|---:|---|---|---|
| 198 | **Left-Arm Strike** (normal attack) | 1 | Random character | Strength | Physical | 16 | 1 | — | **always breaks limit** | can crit; **shatter chance 100** (kills a Petrified target outright); affected by Dark; weak Delay |
| 138 | **Jecht Beam** | 1 & 2 | Random character | Magic | Magical | 8 | 1 | **Petrify 100%** | never breaks limit | can crit (+10 bonus crit); always hits |
| 133 | **Triumphant Grasp** (Overdrive) | 1 | Random character **not** Petrified | Strength | Other (ignores Protect) | 12 | **2** | **Zombie 100%** | never breaks limit | can crit (+10) |
| 135 | **Jecht Bomber** (anti-Aeon Overdrive) | 1 | Random character | Strength | Other | 24 | 1 | — | never breaks limit | always hits |
| 136 | *Draws sword.* | 1→2 | Self | — | — | 0 | 0 | — | — | transformation cue, no damage |
| 1 / 2 | *Special 1 / Special 2* | — | Self | No damage | Other | 0 | 0 | — | — | script/animation hooks |
| 199 | **Left-Arm Strike 2** | 2 | Random character | Strength | Physical | 16 | 1 | — | **always breaks limit** | shatter 100; can crit; affected by Dark; weak Delay |
| 137 | **Blade Blitz** (party-wide sword swipe) | 2 | **Whole party** | Strength | Physical | 16 | 1 | — | never breaks limit | accuracy 150; **weak Delay on all**; affected by Dark. *Unnamed on screen* — "Blade Blitz" is the data-file name |
| 201 | **Triumphant Grasp 2** (Overdrive) | 2 | Random character not Petrified | Strength | Other | **14** | **2** | **none** | **always breaks limit** | can crit (+10). **No Zombie in form 2** |
| 134 | **Ultimate Jecht Shot** (Overdrive, ≤50% HP) | 2 | **Whole party** | Strength | Other | 22 | 1 | — | never breaks limit (cap 9,999) | always hits |
| 200 | **Jecht Bomber 2** (anti-Aeon Overdrive) | 2 | Random character | Strength | Other | 24 | 1 | — | **always breaks limit** | always hits |

**Note on Triumphant Grasp 2:** the decompiled struct carries **no status bytes** on ability 201, and the wiki independently states form-2 Triumphant Grasp "no longer inflicts Zombie or criticals." The struct *does* set `can_crit` + bonus-crit 10 on 201, so the "no criticals" half of the wiki claim is contradicted by the data. [conflict recorded — trust the struct for crit, both agree on no-Zombie]

### 1.4 Yu Pagodas (fought in every battle in this chapter)

Bestiary #234. Two of them, flanking. They **cannot be permanently killed**.

| Stat | Value | Confidence |
|---|---:|---|
| HP | **5,000** (initial) | [verified: 3 sources] — struct HP field is a 65535 placeholder; struct `overkill` = 5000 |
| MP | 5,000 | [verified: 2 sources] |
| Strength | 1 | [verified: 2 sources] |
| Defense | 0 (wiki lists 1) | [single source each — immaterial, they are never attacked by the party for damage-reduction purposes] |
| Magic | 20 | [verified: 2 sources] |
| Magic Defense | 50 | [verified: 2 sources] |
| Agility | **40** in the BFA fight; **30** in the aeon and Yu Yevon fights after their first turn | [single source: wiki] |
| Luck / Evasion / Accuracy | 15 / 0 / 0 | [verified: 2 sources] |
| AP / Gil | 0 / 0 | [verified: 2 sources] |
| Statuses | Immune to essentially everything **except Slow (resist 50) and Delay** | [verified: 2 sources] |
| Zanmato level | 5 | [single source] |

**Revive rule (critical to implement correctly):** a destroyed Pagoda returns after roughly three turns with **new max HP = 5,000 + excess damage from the killing blow**.

> **Revive timer — implementable value.** No source gives a turn count: the Final Fantasy Wiki says only "will revive after a short time", Jegged says "after a few turns", and the struct's `doom_turns = 3` is a *Doom* field and is not proven to be the same counter. Implement the timer **in CTB ticks, not in turns**, because a dead Pagoda takes no turns of its own and "three turns" is otherwise undefined:
>
> | Fight | Pagoda AGI | base ticks | rank-3 recovery | **Revive delay to implement** |
> |---|---:|---:|---:|---:|
> | Braska's Final Aeon | 40 | 7 | 21 | **63 ticks** (= 3 × its own rank-3 turn) |
> | Possessed aeons / Yu Yevon | 30 | 8 | 24 | **72 ticks** |
>
> Start the countdown the moment the Pagoda's HP reaches 0; on expiry it re-enters the CTB queue exactly like a revived character (`ctb = baseCTB × 3`, per `ffx-combat-core.md` §1.6). At 63 ticks a Pagoda is down for about **3.5 BFA turns** (BFA's own turn is 18 ticks at AGI 44), which is what "around three turns" describes from the player's seat and is long enough that killing both really does buy a meaningful Power-Wave-free window. **[estimate]** — the 3× multiplier is the sourced part ("a few"/"around three turns"); converting it to 63/72 ticks is derived from the Pagodas' own decompiled Agility and the shared CTB table. Wiki's worked example: start 5,000, take 2,700 then 2,600 → revives with **5,300**. Consequences: an attacker with Break Damage Limit makes them balloon into the tens of thousands, while an attacker capped at exactly 9,999 keeps them permanently at 9,999 and therefore permanently killable. [verified: 2 sources]

| Pagoda ability | Data | Effect |
|---|---|---|
| **Power Wave (BFA version)**, `mm2 #139` | Formula **Fixed (no variance)**, base **30** → **exactly 1,500**, `heals=true`, `removes_statuses=true`, targets **M1** (the boss) | Heals BFA **1,500 HP**, strips **Zombie, Poison, Silence, Dark, Slow, and all four Breaks** [verified: 2 sources — gamerguides.com bestiary page independently corroborates the fixed 1,500 heal and status-strip effect], and adds **+20%** to BFA's Overdrive gauge [single source: decompile — not independently restated]. If BFA is **Zombie**, the 1,500 becomes **damage** instead — but it still strips the Zombie. |
| **Power Wave (aeon / Yu Yevon version)**, `mm2 #210` | identical 1,500 fixed heal | Strips only **Poison, Zombie, Reflect**. Against the Magus Sisters it instead targets a sister whose Overdrive gauge is not full, and does nothing if all three are full. |
| **Curse**, `mm2 #123` | Magic formula, base 16, magical | Inflicts **Curse + Poison + Sleep(3) + Silence(3) + Dark(3)** on one character, at 100% each, plus ~250–310 magic damage vs typical MDef |
| **Osmose**, `mm2 #122` | Percentage-Total MP, base **16/16** | **Drains 100% of the target's max MP**, ignores Armored |

**Targeting rule:** while *both* Pagodas are alive they only use Power Wave on the boss. If **only one** is active it switches to attacking the party — **Pagoda A prioritises Curse, Pagoda B prioritises Osmose**. This is why "kill both or neither" is the correct guidance. [verified: 2 sources]

Their two turns come back-to-back by default; **Slow on exactly one of them** de-synchronises the pair and roughly halves effective Power Wave uptime. Slowga or a Silver Hourglass (Delay) can lock them out of turns entirely; Gold Hourglass does not (fixed weak Delay + damage). [single source]

### 1.5 Damage model and computed values

FFX damage (Strength/Magic families), reproduced from the tracker's decompile-derived implementation.

> ⚠ **Corrected 2026-09-15 — cross-document conflict resolved.** The transcription previously printed in this section was arithmetically wrong in two places: it gave `power(MAG) = (floor(MAG^2 / 3) + base) * base / 4` (should be **`/6`**) and `mitigation(D) = 730 - floor(floor(D*51 - floor(D^2/7)/2) * 0.4)/4` (should be **`D^2 × 2/11`**, with the `/4` *inside* the outer floor). Both errors came from mis-reading the decompiled magic constants: `0x2AAAAAAB / 0xFFFFFFFF ≈ 0.1666667 = 1/6` (not 1/3) and `0x2E8BA2E9 / 0xFFFFFFFF ≈ 0.1818182 = 2/11` (not 1/7). The corrected block below is **byte-identical in behaviour to `ffx-combat-core.md` §2.2/§2.3 and `ffx-yunalesca.md` §4.1**, which were already correct; those two documents are the canonical statement of the core math and this chapter now agrees with them. **All numeric tables in this section were recomputed from the corrected chain and are unchanged** — the tables were always produced by executing the decompile's own functions, only the prose transcription was wrong. [verified: 3 sources — decompile `events/character_action.py::get_damage/_get_power/_get_mitigation`; `ffx-combat-core.md` §2.2/§2.3; `ffx-yunalesca.md` §4.1]

```
# ---- POWER -------------------------------------------------------------
power(STR)  = floor(STR^3 / 32) + 30            # 0x20 , 0x1E
              -- CONFLICT: GameFAQs "Stat Mechanics FAQ" by SinirothX (ps2/197344/faqs/31381)
                 gives the constant as +32, not +30: "[(Stat^3 / 32) + 32]". That FAQ could not be
                 fetched directly (403; value obtained via search-engine snippet) and is an
                 independently-authored community source, unlike the decompile/tracker source used
                 here. Per this doc's source-tier policy (§0) the decompile value (+30) is the one to
                 implement; ffx-combat-core.md §2.2 reaches the same conclusion independently.
power(MAG)  = (floor(MAG^2 / 6) + base) * base / 4
              # /6 is literally (MAG^2 * 0x2AAAAAAB) // 0xFFFFFFFF
power(HEAL) = floor((MAG + base) / 2) * base

# ---- MITIGATION --------------------------------------------------------
# D = target Defense (physical / Strength family) or Magic Defense (magical / Magic family).
mitigation(D):
    m = (D*D * 0x2E8BA2E9) // 0xFFFFFFFF        # == floor(D^2 * 2/11)
    m = m // 2
    m = (D * 0x33) - m                          # 0x33 = 51
    m = (m * 0x66666667) // 0xFFFFFFFF          # == floor(m * 0.4)
    return 0x2DA - (m // 4)                     # 0x2DA = 730

# Unit-test fixtures for mitigation(D) — copy these into the test suite:
#   D:   0    1    5   10   20   30   40   50   60   80  100  150  200  255
#   m: 730  725  705  680  632  586  541  498  457  381  311  170   74   21

# ---- SHARED CHAIN ------------------------------------------------------
d1 = power * mitigation
d2 = (d1 * -1282606671) // 0xFFFFFFFF           # ~= -0.298629 * d1
d3 = ((d1 + d2) // 512) * (15 - defensive_stacks)   # Cheer for STR family, Focus for MAG/HEAL
d4 = (d3 * -2004318071) // 0xFFFFFFFF           # ~= -0.466667 * d3
d  = (d3 + d4) // 8
if formula in {Strength, PiercingStrength, SpecialMagic}:  d = d * base // 16
d = d * (damage_rng + 240) // 256               # damage_rng in 0..31  ->  x0.9375 .. x1.0586
crit  -> x2 ;  Protect (physical) -> /2 ;  Shield -> /4 ;  Boost on target -> x1.5
Fixed (no variance)      ->  d = base * 50
Percentage Total/Current ->  d = (max|current) HP or MP * base / 16
```
[verified: 3 sources — decompiled ability structs + the tracker's formula implementation, cross-checked line-by-line against `ffx-combat-core.md` §2.2/§2.3 and `ffx-yunalesca.md` §4.1; validated against the published damage bands below. NOTE: the +30 constant in `power(STR)` conflicts with an independent community source giving +32 — see inline CONFLICT note above; decompile value retained per policy.]

**Authority note for implementers.** `ffx-combat-core.md` §2 is the single source of truth for the damage chain, post-formula modifier order, and the damage-limit clamp. This section reproduces only the subset needed to reproduce BFA's numbers; if the two ever diverge again, **`ffx-combat-core.md` wins.**

**BFA output vs. a party member's Defense** (damage_rng = 16, i.e. x1.000; no Protect):

| Ability | vs DEF 10 | vs DEF 20 | vs DEF 30 | vs DEF 40 |
|---|---:|---:|---:|---:|
| Left-Arm Strike (F1, STR 45, base 16) | 2,679 | 2,490 | 2,309 | 2,132 |
| Jecht Bomber (F1, STR 45, base 24) | 4,018 | 3,735 | 3,463 | 3,198 |
| Triumphant Grasp (F1, per hit, base 12) ×2 | 2,009 | 1,867 | 1,731 | 1,599 |
| Left-Arm Strike 2 / Blade Blitz (F2, STR 50, base 16) | 3,666 | 3,407 | 3,159 | 2,916 |
| Triumphant Grasp 2 (F2, per hit, base 14) ×2 | 3,207 | 2,981 | 2,764 | 2,551 |
| **Ultimate Jecht Shot** (F2, STR 50, base 22) | 5,040 | 4,684 | 4,343 | 4,009 |
| Jecht Bomber 2 (F2, STR 50, base 24) | 5,499 | 5,110 | 4,738 | 4,374 |
| **Jecht Beam** (MAG 50, base 8) vs MDEF 10/20/30/40 | 789 | 734 | 680 | 628 |

**Cross-validation (this is why form-2 STR is 50, not 45):** the wiki states Jecht Bomber does "up to 4,000" in form 1 and Ultimate Jecht Shot hits "around 4,000 to 5,000". Form-1 Jecht Bomber at STR 45 computes to 3,198–4,018 ✓. Ultimate Jecht Shot at **STR 50** over the full RNG spread computes to **4,391–4,958** vs DEF 20 ✓; at STR 45 it would only reach ~3,400–3,700 ✗. [verified: derived + 2 sources]

### 1.6 Battle script — phases, Overdrive gauge, Trigger Command

**BFA's Overdrive gauge — quantified**

The gauge is a 0–100 % meter. Published sources quantify exactly one of its three inputs; the other two are given only as "fills by a small amount when targeted or using an attack" (Final Fantasy Wiki, verbatim). The table below fills the gap using the **only comparable enemy gauges the wiki does quantify**, both of which sit in this same chapter or its sister encounter and are driven by the same Yu Pagoda script.

| Input | Value to implement | Confidence / derivation |
|---|---|---|
| Yu Pagoda **Power Wave** lands on him | **+20 %** (fixed, not a range) | [verified: 2 sources — decompile + finalfantasy.fandom.com/wiki/Braska's_Final_Aeon "increases by 20% when the Pagodas use Power Wave"] |
| He is **targeted** by a damaging action (per action resolved against him, not per hit) | **+5 %**, rolled uniformly in **0–10 %** | **[estimate]** — see derivation below |
| He **takes a turn** (any action, including the scripted `Draws sword.`) | **+5 %**, rolled uniformly in **0–10 %** | **[estimate]** — see derivation below |
| Gauge reaches **100 %** | He spends it on his **next** turn, then resets to 0 % | [verified: 2 sources] |
| **Talk** trigger command | Sets the gauge to **0 %** and he loses his next turn entirely | [verified: 2 sources] |

**Derivation of the two [estimate] rows.** The wiki quantifies enemy Overdrive gauges in exactly two comparable places, and both use the same vocabulary the BFA page leaves unquantified:

| Comparable enemy | Power Wave / magic hit | Targeted by an attack | Acting | Source |
|---|---|---|---|---|
| **Possessed aeons, Inside Sin** (same chapter, same Pagodas, same `#210` Power Wave) | **15~30 %** | **0~10 %** | **0~10 %** ("or using an ability") | [verified: 2 sources — Valefor and Bahamut FFX-boss wiki pages state the identical figures independently] |
| **Belgemine's Valefor, Remiem** (no Pagodas) | 15 % (magical attack) | 5 % | 10 % | [single source] |

BFA's Power Wave figure (a flat 20 %) sits inside the possessed-aeon 15–30 % band, which is strong evidence that BFA runs the **same gauge subsystem** with a fixed rather than rolled Power Wave value. The two unquantified inputs are therefore modelled on the possessed-aeon numbers: **0–10 %, mean 5 %**. Belgemine's 5 %/10 % pair independently brackets the same magnitude. Use the flat 5 % for deterministic fixtures and the 0–10 % roll for play.

**Tuning check (this is the number the designer actually needs).** With both Pagodas alive and un-slowed, the gauge is dominated by Power Wave:

| Situation | Gauge gain per BFA turn | Turns to Overdrive |
|---|---:|---:|
| Both Pagodas alive, 3 party members attacking each BFA turn | 2×20 % (Power Wave) + 3×5 % (targeted) + 5 % (acting) = **60 %** | **~1.7** |
| One Pagoda alive (the other down) | 20 + 15 + 5 = **40 %** | **2.5** |
| Both Pagodas down, or both Slowed and desynced | 15 + 5 = **20 %** | **5** |
| Both Pagodas down, party turtling (1 attack per BFA turn) | 5 + 5 = **10 %** | **10** |

This is what makes the two Talk charges legible: at full Pagoda uptime BFA overdrives roughly every other turn, so two Talks buy roughly four turns of safety and **must** be saved for the Ultimate Jecht Shot phase — exactly the guidance every guide gives. If a playtest shows the fight is too punishing, lower the targeted/acting gains to a flat 3 % before touching the 20 %, which is the one verified number. **[estimate]** for the whole tuning table, derived from the rows above.

**Gauge behaviour across the form transition — resolved.** **Carry the gauge over; do not reset it.** Reasoning, since no source states it either way: (a) the decompile has a **single** monster entry `m132` for both forms — the transformation is an in-script ability (`#136 Draws sword.`), not a new encounter, so there is no second actor for a fresh gauge to live on; (b) every other piece of battle state persists across the cutscene (§1.7); (c) the **Talk** charges are a pool of **two for the whole battle**, not two per form, which only makes sense if the resource they manage is likewise battle-wide. The carry-over is safe because **Ultimate Jecht Shot is gated on form-2 HP ≤ 50 %**, and form 2 starts at a full 120,000 — so a gauge that arrives full at the transition produces *Triumphant Grasp 2*, not an instant party wipe. **Fallback if playtesting disagrees:** clamp the carried value to 50 % rather than zeroing it, so the transition still feels dangerous. **[estimate]** — supersedes the earlier "recommend reset" note.

When the gauge is spent, the action chosen is:

| Condition (checked in this order) | Overdrive used |
|---|---|
| An **Aeon** is on the field | **Jecht Bomber** (form 1) / **Jecht Bomber 2** (form 2) |
| Form 2 **and** HP ≤ 50 % | **Ultimate Jecht Shot** |
| Form 2, HP > 50 % | **Triumphant Grasp 2** |
| Form 1 | **Triumphant Grasp** |
[verified: 2 sources]

**Trigger Command — "Talk" (Tidus only).** Selecting it **resets BFA's Overdrive gauge**; the effect lands on **his next turn**, which he then loses entirely (he does not act). **Usable twice.** The command appears a **third** time but has no effect. Design intent: a scripted, exhaustible panic button — hold the second charge for the Ultimate Jecht Shot phase. [verified: 2 sources]

**Turn selection — weighted tables**

No published source gives a probability table, and the FFX monster AI scripts are not in any public decompile dataset (the RNG-tracker's `monster_actions.json` carries only `actions_file / action_id / name / target` per monster — no weights, no script). Every source is qualitative: the wiki gives "Blade Blitz will always be used first and has a small chance to be used afterwards" and nothing more; Gamer Guides states outright that "turn-by-turn probabilities aren't specified"; Game8, Jegged, Neoseeker and Samurai Gamers give no frequencies at all. The weights below are therefore **authored [estimate]s**, chosen to reproduce the qualitative descriptions and the fight's documented difficulty, and written as a single tunable table so a designer can move them in one place.

**Resolution order every BFA turn** (check top to bottom, first match wins):

1. A **Talk** is pending → he loses the turn, gauge already 0. [verified: 2 sources]
2. Gauge at 100 % → spend it (branch table above). [verified: 2 sources]
3. First turn of form 2 → **Blade Blitz**, unconditionally. [verified: 2 sources]
4. Otherwise → roll on the phase's weight table below. **[estimate]**

| Phase | Left-Arm Strike / 2 | Jecht Beam | Blade Blitz | Confidence |
|---|---:|---:|---:|---|
| **Form 1** | **75 %** | **25 %** | — | [estimate] |
| **Form 2, HP > 50 %** | **60 %** | **25 %** | **15 %** | [estimate] |
| **Form 2, HP ≤ 50 %** | **0 %** (replaced) | **25 %** | **75 %** | [estimate] |

**Derivation / why these numbers.**

- **Jecht Beam at 25 % in every phase.** The wiki calls it "interleaved" and never phase-gates it, so the rate is held constant across all three rows — this is the one behaviour all sources agree continues unchanged into form 2. 25 % means **a Petrify attempt roughly once every four boss turns**. This is the load-bearing tuning decision of the whole encounter and it was picked from the fight's own economics, not guessed: at BFA's AGI 44 (base 6 ticks, rank 3 → **18 ticks** per turn) a Petrify every ~4 turns gives the party a window of roughly 72 ticks — two to four party actions — to spend a Soft, Remedy or Esuna before the next Left-Arm Strike shatters the victim. That window is what makes **Stoneproof a real decision rather than a mandate**: without it the fight is survivable but demands a dedicated cleanse slot every few turns; with it that pressure disappears. Push Jecht Beam to 50 % and Stoneproof becomes compulsory (a character is petrified nearly every other turn, and the party cannot cleanse fast enough); drop it to 10 % and the signature threat stops registering at all. **If you change one number in this section, change this one — and re-test the Stoneproof decision.**
- **Blade Blitz "small chance" = 15 %** above half HP. "Small" in wiki phrasing for FFX bosses is consistently a minority branch, not a rare one; 15 % makes it appear roughly once per seven turns, often enough that the party cannot assume single-target damage but rare enough that the guaranteed opener still reads as special.
- **Below 50 % HP, Blade Blitz takes the entire Left-Arm Strike share** (60 % + 15 % → 75 %), which is the literal wiki statement that it "replaces the normal physical attack." Left-Arm Strike 2 drops to 0 % — note the consequence: **the shatter follow-up now comes from Blade Blitz's party-wide swing**, so a petrified character dies to the next AoE rather than needing to be singled out. This is why the last phase is so much deadlier than its raw damage suggests.
- **Form-1 Left-Arm Strike 75 %** is simply the residue of Jecht Beam's 25 %; the wiki calls it "the default action" with no other branch.

**Recorded conflict.** Samurai Gamers states that in phase 2 "Jecht Bomber... comes out more frequently as it is no longer the boss' Overdrive attack." The decompile contradicts this: `#200 Jecht Bomber 2` is still flagged as the **anti-Aeon Overdrive** branch, not a normal-turn action, and no other source repeats the claim. **Do not add Jecht Bomber to the normal-turn weight table.** [conflict recorded — decompile preferred per §0]

**Form 1 loop**

| Step | Behaviour |
|---|---|
| Default action | **Left-Arm Strike** on a random character — 75 % [estimate] |
| Interleaved | **Jecht Beam** on a random character (100 % Petrify) — 25 % [estimate] |
| Overdrive (gauge full) | **Triumphant Grasp** on a random non-Petrified character — 2 hits + Zombie |
| Overdrive with an Aeon present | **Jecht Bomber** instead (~3,200–4,000) |
| Kill condition | HP 0 → cutscene: he **draws a sword out of his own chest**, spiked wings erupt → form 2 |

**Form 2 loop**

| Step | Behaviour |
|---|---|
| **First action of form 2** | **Blade Blitz always**, on the whole party, with weak Delay [verified: 2 sources] |
| Thereafter (HP > 50%) | Left-Arm Strike 2 **60 %**, Blade Blitz **15 %**, Jecht Beam **25 %** [estimate] |
| Overdrive (HP > 50%) | **Triumphant Grasp 2** — 2 hits, stronger, **no Zombie**, **breaks the damage limit** |
| **HP ≤ 50% (60,000 of 120,000)** | Overdrive becomes **Ultimate Jecht Shot** (party-wide, ~4,000–5,000 each); **Blade Blitz replaces the normal physical attack entirely** → Blade Blitz **75 %**, Jecht Beam **25 %** [estimate] |
| Overdrive with an Aeon present | **Jecht Bomber 2**, which now breaks the damage limit |
[verified: 2 sources for the phase structure; the percentages are [estimate] — see derivation above]

**The petrify → shatter kill chain (the encounter's signature lethality):** Jecht Beam applies **Petrify at 100%**; Left-Arm Strike carries **shatter chance 100**, so the very next normal attack on that character **removes them from the battle permanently** (shatter is not revivable by Phoenix Down). Additionally, because Jecht Beam *also* deals damage, **if the beam's damage kills the target, they shatter instantly**. Countermeasure: **Stoneproof** armour, or a Soft/Remedy before his next turn. [verified: 2 sources]

**Zombie exploit (form 1 only in practice):** BFA resists Zombie at 50 but is not immune. While Zombie, the next Power Wave deals **1,500 damage** instead of healing — and then cleanses it. Zombiestrike on a weapon re-applies it repeatedly. He is still **immune to revivification**, so the usual "Zombie + Phoenix Down" instant kill does **not** work on him. [verified: 2 sources]

**Aeon rules in this fight — explicitly permitted.** Unlike Yunalesca (Banish) and several other late bosses, **Yuna may summon normally throughout both BFA forms**. The boss has a dedicated anti-Aeon Overdrive (Jecht Bomber / Jecht Bomber 2) precisely because the designers expected Aeons here. Aeon **Shield** cuts Jecht Bomber to one quarter; **Cheer** reduces it further. Hellfire (Ifrit) and Thor's Hammer (Ixion) have unique alternate animations against BFA — worth reproducing as a fidelity touch. [verified: 2 sources]

### 1.7 "HP after the cutscene" and other quirks

- **No HP-carryover quirk is documented.** Form 2 begins at a **full, fresh 120,000**; damage dealt to form 1 does not carry over. The battle is continuous, so the **party's HP/MP, statuses, buffs, inventory, CTB timeline and Overdrive gauges all persist** across the transformation. [verified: 2 sources for the fresh HP pool; party-state persistence is [estimate] — it is a single uninterrupted battle with a mid-battle cutscene, and no source reports a reset]
- **Zanmato quirk:** Yojimbo's Zanmato kills the *current form* only. Using it on form 1 still leaves form 2 to be fought. [single source]
- **Overkill threshold 20,000 but AP 0** — overkill is cosmetic here; there is no reward either way. [verified: 2 sources]
- **BFA's own Overdrive gauge across the transformation:** no source states whether it persists or resets. **Resolved in §1.6: carry it over.** The single `m132` monster entry, the battle-wide (not per-form) pool of two Talk charges, and the general persistence of battle state all point the same way; the guaranteed Blade Blitz opener still reads cleanly because it is a scripted override that outranks the gauge check, and a full gauge arriving in form 2 above 50 % HP yields Triumphant Grasp 2, not Ultimate Jecht Shot. [estimate] — supersedes this section's earlier "recommend reset".
- **Sensor/Scan text** (useful as in-game tutorialisation): Sensor returns *"Use the trigger command to talk."*; Scan returns a line explaining that he draws power from the Yu Pagodas and unleashes Overdrives once charged, and that Tidus can talk to lower the gauge. [verified: 2 sources]

---

## 2. The possessed-aeon sequence

After BFA falls, Jecht passes on and **Yu Yevon's spirit — a floating mote of light — seeks a new host**. He possesses **each aeon Yuna currently owns, one at a time**, and the party must destroy them all so that he runs out of bodies.

### 2.1 Order and roster

Fixed order = aeon acquisition order. **Only aeons Yuna actually has are fought.**

| # | Aeon | Mandatory? | Struct id | Struct `overkill` (the entry's fingerprint) |
|---:|---|---|---|---:|
| 1 | Valefor | Yes (Besaid) | m163 | 1,000 |
| 2 | Ifrit | Yes (Kilika) | m164 | 2,000 |
| 3 | Ixion | Yes (Djose) | m165 | 3,000 |
| 4 | Shiva | Yes (Macalania) | m166 | 4,000 |
| 5 | Bahamut | Yes (Zanarkand) | m167 | 5,000 |
| 6 | **Anima** | **Optional** (Baaj Temple / all Destruction Spheres) | m168 | 168 |
| 7 | **Yojimbo** | **Optional** (Cavern of the Stolen Fayth, paid) | m169 | 169 |
| 8 | **Magus Sisters** (Cindy / Sandy / Mindy, all three at once) | **Optional** (Remiem Temple) | m178 / m179 / m180 | 2,000 each |
[verified: 2 sources]

> The `mon_data` HP fields for m163–m169 (1000/2000/3000/4000/5000/168/169) are **placeholders**. The 168/169 values are literally the monster indices — a tell that the script overwrites them.

### 2.2 The mirroring rule

**Each possessed aeon fights with exactly the stats it has as the player's own aeon** — the wiki bestiary literally lists `HP = "Yuna Valefor HP"`, and Strength / Magic / Defense / Magic Defense / Agility / Accuracy / Evasion as **"Varies"**. Luck is forced to **1**. So a player who grid-fed Yuna heavily faces harder possessed aeons; a player who ignored them faces trivial ones. **This is self-balancing and must be implemented as a live copy of the player's aeon stat block, not as a fixed table.** [verified: 2 sources]

| Aeon | Moveset as a possessed boss | Notes |
|---|---|---|
| Valefor | Attack, **Sonic Wings**, **Energy Ray**, **Energy Blast** (Overdrive) | Uses Energy Blast as its Overdrive **if the player has unlocked it**; otherwise Energy Ray |
| Ifrit | Attack, **Meteor Strike**, **Hellfire** (Overdrive) | |
| Ixion | Attack, **Aerospark**, **Thor's Hammer** (Overdrive) | |
| Shiva | Attack, **Heavenly Strike**, **Diamond Dust** (Overdrive) | |
| Bahamut | Attack, **Impulse**, **Mega Flare** (Overdrive) | No Countdown script here — unlike the Remiem version |
| Anima | **Pain**, **Oblivion** (Overdrive) | Flagged Tough + Heavy |
| Yojimbo | **Daigoro, Kozuka, Wakizashi, Zanmato** | |
| Magus Sisters | Cindy: Curaga (on M1/M2), Drain, **Camisade**, **Delta Attack** (Overdrive). Sandy: Haste, Reflect, **Razzia**. Mindy: *Passado* | Fought as a trio; Yu Pagodas prioritise Power Wave on a sister whose gauge is not full |

Every one of them also has the scripted non-action **"Possessed by Yu Yevon!"** as its opening beat. [verified: 2 sources]

Possessed-aeon Sensor lines are short and devastating and are worth mirroring in the fan game (our own wording): Valefor — *"Strike me down."*; Bahamut — *"Soon... eternal rest."*; Anima — *"Thus I atone."* [verified: 2 sources]

### 2.3 Rules that apply from here to the end of the game

| Rule | Detail | Confidence |
|---|---|---|
| **Permanent Auto-Life** | From the possessed-aeon fights onward, the entire party carries a **permanent, non-consumable Auto-Life** granted by the fayth. A KO'd character immediately revives. | [verified: 3 sources] |
| **Cannot lose** | Consequence of the above. The *only* documented loss is deliberate self-petrification of the whole party (Petrify defeats Auto-Life because a shattered/petrified character is not revived). | [verified: 3 sources] |
| **Aeon roster shrinks** | Each aeon you destroy is **gone**. By the time Yu Yevon appears you have **no Summon command at all** — a walkthrough explicitly notes "you no longer have access to Bahamut". | [verified: 2 sources] |
| **Yu Pagodas** | Two of them are present in **every** possessed-aeon fight and in the Yu Yevon fight, using the **#210 Power Wave** variant (strips Poison / Zombie / **Reflect**). | [verified: 2 sources] |
| **No escape** | Flee disabled throughout. | [verified: 2 sources] |
| **Aeon Overdrive gauges** | A possessed aeon's Overdrive gauge fills **15–30%** when hit by a Yu Pagoda's Power Wave and **0–10%** when targeted by an attack or when it acts. These are the only *quantified* enemy-gauge figures published anywhere, and they are the anchor for BFA's own [estimate] rates in §1.6. | [verified: 2 sources — the Valefor and Bahamut FFX-boss wiki pages each state the identical 15~30 % / 0~10 % figures independently] |
| KO revival loses buffs | Auto-Life revives but any buffs the character held are lost. | [single source] |

---

## 3. Yu Yevon

The final boss. No dialogue, ever. Bug-like, tick-like, parasitic; a glowing **Yevon glyph ("A" in the Yevon/Siddham script)** serves as its face.

### 3.1 Stat block

| Stat | Value | Confidence |
|---|---:|---|
| HP | **99,999** | [verified: 3 sources — struct, wiki, Gamer Guides] |
| Overkill | 99,999 | [verified: 2 sources] |
| MP | 1 | [verified: 2 sources] |
| Strength | 1 | [verified: 2 sources] |
| Defense | 0 (wiki: 1) | [conflict, immaterial] |
| **Magic** | **200** | [verified: 2 sources] |
| Magic Defense | 0 (wiki: 1) | [conflict, immaterial] |
| Agility | 44 | [verified: 2 sources] |
| Accuracy / Evasion / Luck | 1 / 0 / 0–1 | [verified: 2 sources] |
| AP / Gil | 0 / 0 | [verified: 2 sources] |
| Poison tick | **10% of max HP = 9,999/tick** | [verified: 2 sources] |
| Doom counter | **3 turns** | [verified: 2 sources] |

### 3.2 Immunities and — crucially — vulnerabilities

| Immune | Vulnerable (this is the puzzle) |
|---|---|
| Death, Petrify, Sleep, Silence, Dark, Confuse, Berserk, Provoke, Threaten, Scan/Sensor, Eject, Bribe | **Zombie (resist 0)**, **Doom (resist 0, 3-turn count)**, **Poison (10%/tick)**, all four **Breaks**, **Shell / Protect / Reflect / Regen / Haste / Slow**, and **revivification** |
| Elements | **All five Neutral** — no weakness, no resistance [verified: 2 sources; Game8's "100% Fire/Lightning/Water/Ice" is the same mis-rendered column noted in §1.2] |

Full immunity/vulnerability split (immune to Death/Petrify/Sleep/Silence/Dark/Confuse/Berserk; vulnerable to Zombie, Doom, Poison, and all four Breaks at 0% resistance): [verified: 2 sources — strategywiki.org/wiki/Final_Fantasy_X/Inside_Sin and villains.fandom.com/wiki/Yu_Yevon]

The wiki's own commentary is worth quoting for design intent: this was likely meant as a *puzzle* boss, and "the programmers made the mistake of not making him invulnerable to status effects."

### 3.3 Abilities

| Ability | Data | Effect |
|---|---|---|
| **Gravija**, `mm2 #131` | **Percentage-Current**, base **12/16**, magical, **raw rank byte 0 → implement as rank 3** (see caveat below) | **Removes exactly 75% of current HP from every target on the field — including Yu Yevon himself.** Cannot KO (75% of current can never reach 0). |
| **Curaga**, `cmd #45` | Healing formula, base 80, MAG 200 → computes to 11,200, **capped at 9,999** | **Counter: cast on self every time he takes damage.** Heals **9,999**. Halved by **Magic Break**; with Magic Break **+ Shell on him** it drops to roughly **2,700**. [verified: 2 sources — GameFAQs FAQ 79145 independently states the 9,999 capped counter-heal] |
| **Osmose**, `mm2 #122` | Percentage-Total MP, base 16/16 | Party-wide; **drains 100% of max MP** |
| **Ultima**, `cmd #83` | Magic, base 70, MAG 200 → uncapped ~102,000, **capped at 9,999** | Party-wide **9,999**. Harmless in practice thanks to Auto-Life, except that revived characters lose their buffs. |
| *Command 254*, `mm2 #244` | No damage, can target dead | Script hook (the Auto-Life / possession bookkeeping) |

Gravija removes exactly 75% of current HP from every target, including Yu Yevon himself, and cannot KO. [verified: 2 sources — finalfantasy.fandom.com/wiki/Gravija and lparchive.org LP Update 131]

### 3.4 AI cycle

```
loop:
  alternate  [do nothing]  /  [Gravija]        # scheduled turns, rank 3 (see rank-0 caveat)
  count Curaga counters (one per COUNTER-TRIGGERING ACTION — see §3.4.1)
  when Curaga has fired 7 times:
      next turn  -> Osmose (party-wide)
      turn after -> Ultima (party-wide)
      reset counter, resume loop
```
[verified: 2 sources for the cycle structure]

#### 3.4.1 What counts as one "instance" — the counting rule (**this is the fight**)

"One per instance of damage taken" was previously undefined here, and the whole encounter hinges on it: a 12-hit Attack Reels, a 16-cast Fury, a Doublecast and a party-wide spell differ by an order of magnitude under the two readings. **Implement the per-action rule below.**

> **RULE.** Yu Yevon fires **at most one Curaga per player-side action that deals him damage**, evaluated **after that action has fully resolved**. Multi-hit is irrelevant: the number of hits, targets, or spells inside one command does not matter.

| Player input | Damage instances | **Curagas fired** | Net damage (9,999-capped hits) |
|---|---:|---:|---:|
| Single Attack | 1 | **1** | dmg − 9,999 |
| **Doublecast** Firaga/Firaga | 2 | **1** | 19,998 − 9,999 = **9,999** |
| **Attack Reels** (12 hits) | 12 | **1** | up to 119,988 − 9,999 |
| **Blitz Ace** (multi-hit Overdrive) | many | **1** | (whole Overdrive) − 9,999 |
| **Fury** (Lulu, 16 casts in one command) | 16 | **1** | (whole Fury) − 9,999 |
| Party-wide spell (single target here — he is alone with the Pagodas) | 1 | **1** | dmg − 9,999 |
| **Poison tick** (9,999/turn) | 1 (DoT, not an action) | **0** | 9,999 |
| **Gravija's self-damage** | 1 (his own action) | **0** | 75 % of current HP |
| **Yu Pagoda Power Wave** while he is Zombie | 1 (enemy action) | **0** | 1,500 |
| **His own Curaga** while he is Zombie | 1 (a counter) | **0** — counters never re-trigger counters | 9,999 |

**Evidence and reasoning.**

1. **The wiki's own worked example settles Doublecast.** Its strategy section pairs "Another strategy is to Doublecast magic for two 9,999s (or more with Break Damage Limit) every turn" with "Yu Yevon will only be able to use Curaga for one 9,999." Two 9,999 damage instances inside one command produce **one** Curaga, netting 9,999 per turn. Under a per-hit reading that strategy would net exactly zero and the wiki would not recommend it. [verified: 2 sources — finalfantasy.fandom.com/wiki/Yu_Yevon_(boss) strategy section; lparchive.org LP Update 131, "Any attacks toward Yu Yevon will cause it to immediately counter by casting Curaga for a 9999 HP heal" — *attacks*, i.e. per action]
2. **Gravija self-damage must not counter, or the intended attrition route is mathematically impossible.** Gravija strips 75 % of his current HP; Curaga restores a flat 9,999. If his own Gravija triggered a Curaga, the two would reach equilibrium at `0.75 × HP = 9,999` → **HP ≈ 13,332**, and he would never fall below it. But the wiki explicitly documents the attrition win — "keeping the Yu Pagodas incapacitated, while Yu Yevon slowly whittles down his own HP with his Gravija spells" until Gravija displays 0 at 1 HP. **Therefore Gravija's self-damage is excluded from the counter.** [verified: derived + 2 sources — the arithmetic is forced by the wiki's own stated win condition]
3. **Counters do not recurse.** Under Zombie his Curaga damages him 9,999; if that damage counted, the counter would loop infinitely and resolve the battle inside one stack frame. Standard FFX counter semantics (and `ffx-yunalesca.md` §6, where her rank-0 counters cost 0 ticks but do not chain) put counters outside the trigger set. The Zombie route still wins decisively — it just wins through *his scheduled turns and the Pagodas*, not through a recursion. [estimate — no source addresses recursion; this is the only non-degenerate reading]
4. **DoTs are not actions.** Poison ticks at end-of-turn and is not a command; excluding it keeps Poison (9,999/tick at his 10 % rate) a genuine win route, which is how every source presents it. [estimate]

**Consequence — restate the win condition correctly.** The commonly-quoted "deal more than 9,999 per instance of damage" is **wrong under this rule**. The real bar is **more than 9,999 per *action***, which is a far lower bar and is why every multi-hit Overdrive trivialises the fight. §3.5 has been reworded accordingly.

**If you implement the per-hit reading instead**, note what it costs you: Doublecast nets 0, Attack Reels nets negative, and the only remaining routes are Zombie, Doom, Reflect, Poison and attrition. That is a *coherent* fight, but it is not the documented one — record it as a deliberate deviation if you choose it.

#### 3.4.2 Gravija's rank-0 caveat — do **not** read it as "instant"

Gravija's decoded rank byte is `0`, the same raw value that `ffx-yunalesca.md` §14.8 flags for Dispelling Slap. The resolution is already settled in the core doc and applies verbatim here:

> **If an action's raw rank byte is 0, the engine falls back to rank 3.** (`ffx-combat-core.md` §1.1, decompile.) "Rank 0 = instant recovery" is a misreading of the raw byte.

A literal `recovery = baseCTB × 0 = 0` would let Yu Yevon act continuously and cast Gravija forever, which matches no footage and contradicts the wiki's "alternate between doing nothing and using Gravija". **Implement Gravija as rank 3**: at AGI 44 → base 6 ticks → **18 ticks** recovery, and because half his turns are the scripted "do nothing", a Gravija lands roughly **every 36 ticks**. The Curaga counter, by contrast, is a true counter and costs **0 ticks** — it must never consume or delay his scheduled turn (same split as `ffx-yunalesca.md` §14.8 draws for Dispelling Slap: counter instance 0, scheduled instance rank 3). [verified: 2 sources — `ffx-combat-core.md` §1.1 rank-0 fallback; wiki's alternating-turn description] / the 18-and-36-tick figures are [estimate] derived from those two.

### 3.5 Win conditions (implement all of them; players find all of them)

| Route | Mechanic |
|---|---|
| **Out-damage the counter** | Deal **>9,999 per *action*** (not per hit — see §3.4.1). Doublecast nets 9,999/turn; any multi-hit Overdrive (Attack Reels, Blitz Ace, Fury) nets its full total minus a single 9,999; Break Damage Limit raises the per-hit ceiling on top of that. |
| **Zombie** | He is Zombie-vulnerable at resist 0. Then his **own Curaga damages him 9,999**, the Pagodas' Power Wave damages him, and **any revive item (Phoenix Down, Life, Full-Life) kills him instantly**. The single fastest kill. |
| **Reflect** | Cast Reflect on him; his Curaga bounces onto the party instead. Note the Pagodas' Power Wave #210 **strips Reflect**. |
| **Doom** | Candle of Life → dead in **3 turns**. |
| **Attrition / the "intended" puzzle** | Keep both Pagodas suppressed and simply wait: **Gravija damages Yu Yevon himself for 75% of his own current HP each cast.** When Gravija starts showing **0**, he is at **1 HP** and any hit finishes him. |
| **Magic Break (+ Shell)** | Reduces the 9,999 counter-heal to ~5,000 (~2,700 with Shell), making ordinary damage sufficient. |
[verified: 2 sources]

### 3.6 Ending of the battle

On Yu Yevon's death the **two Yu Pagodas converge on him and dissolve** (the wiki compares the death animation to Chaos in *Final Fantasy I*). Sin is destroyed permanently and detonates above **Bevelle** while the party escapes on the *Fahrenheit*. Then the **Final Sending**: Yuna sends Sin, the aeons, and Auron. The fayth stop dreaming. [verified: 2 sources]

---

## 4. Typical party at Dream's End — **explicitly an authored estimate**

There is **no published statistical average** for FFX party stats at this point; searches across guides, forums and speedrun resources return only min-max endgame data. What follows is a **labelled design preset** for "a normally-progressing first playthrough on the Standard Sphere Grid, no grinding, no Monster Arena, no Celestial Weapons." It is grounded in two verifiable anchors: (a) which abilities sit on which grid section, and (b) the boss's own damage output, which implies the survivable HP band.

**All numbers in §4.1 are [estimate].** Everything in §4.2–§4.4 is sourced.

### 4.1 Preset stat block

| Character | HP | MP | STR | DEF | MAG | MDEF | AGI | LCK | EVA | ACC | S.Lv spent (approx.) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tidus** | 3,600 | 140 | 32 | 26 | 22 | 22 | 35 | 18 | 28 | 22 | ~180 |
| **Yuna** | 2,700 | 320 | 20 | 20 | 36 | 32 | 26 | 18 | 20 | 24 | ~175 |
| **Auron** | 4,400 | 100 | 42 | 32 | 20 | 22 | 22 | 18 | 14 | 30 | ~180 |
| Wakka | 3,400 | 110 | 33 | 26 | 22 | 24 | 26 | 20 | 22 | 40 | ~165 |
| Lulu | 2,500 | 300 | 18 | 20 | 42 | 34 | 26 | 18 | 24 | 22 | ~170 |
| Rikku | 3,000 | 130 | 26 | 24 | 26 | 26 | 33 | 20 | 30 | 24 | ~160 |
| Kimahri | 3,300 | 140 | 30 | 28 | 26 | 26 | 26 | 18 | 20 | 26 | ~150 |

Sanity check against the encounter: Ultimate Jecht Shot at ~4,400 vs DEF ~26 would **KO Yuna and Lulu outright** and leave Tidus near death — which matches the walkthrough's warning that it can be "possibly an instant Game Over if you're underlevelled." That is the intended tension; the preset should be tuned so the fight is winnable **only** with the Trigger Command, Protect, and disciplined healing.

### 4.2 Abilities — what an average player actually has

| Ability | Grid location | Typically owned at Dream's End? | Source |
|---|---|---|---|
| **Haste / Hastega / Slow / Delay Attack / Cheer / Flee** | Tidus's section (main line) | **Yes** | [verified: 2 sources] |
| **Quick Hit** | **End of Tidus's section** | **Usually not** — requires pushing to the far end of his path | [verified: 2 sources] |
| Cure / Cura / Curaga / Esuna / Nul-spells / Reflect / Shell / Protect / Life | Yuna's section (main line) | **Yes** | [verified: 2 sources] |
| **Auto-Life** | Yuna's section, late | **Sometimes** — the wiki's own BFA strategy says "**if** Yuna has learned Auto-Life" | [verified: 2 sources] |
| **Holy** | **End of Yuna's section** | **Usually not** | [verified: 2 sources] |
| **Full-Life** | **Rikku's** section | **Usually not** (requires crossing a Lv-key lock into Rikku's grid) | [verified: 2 sources] |
| Fire/Blizzard/Thunder/Water lines up to -aga, Bio, Demi, Focus, Doublecast | Lulu's section | **-ara yes, -aga often, Doublecast sometimes** | [verified: 2 sources] |
| **Flare** | **End of Lulu's section** | **Usually not** | [verified: 2 sources] |
| **Ultima** | **Centre of Kimahri's section** (needs a Lv.4 Key Sphere) | **No** for an average build | [verified: 2 sources] |
| Power/Armor/Magic/Mental Break, Guard, Sentinel | Auron's section | **Yes** | [verified: 2 sources] |
| **Full Break** | Auron's section — **only exists in International / PAL / HD Remaster** | **Rarely** | [verified: 2 sources] |
| Steal, Use, Mix, Al Bhed Potion | Rikku's section | **Yes** | [verified: 2 sources] |
| Bribe | End of Rikku's section | No | [verified: 2 sources] |

**Recommendation for the chapter preset:** grant **Hastega, Protect, Curaga, Esuna, Life, Reflect, all four Breaks, Doublecast + Firaga/Thundaga, Steal/Use/Mix**. **Withhold** Holy, Ultima, Flare, Full-Life, Quick Hit and Full Break, and make **Auto-Life a coin-flip the preset explicitly does not grant** — this preserves the intended difficulty curve and makes the Trigger Command matter.

### 4.3 Overdrives

| Character | Overdrive | Unlock rule | Average player has it? |
|---|---|---|---|
| Tidus | Spiral Cut → **Slice & Dice** → **Energy Rain** → **Blitz Ace** | Cumulative Overdrive uses: **10 / 30 / 80** (success not required) | Slice & Dice yes; Energy Rain likely; **Blitz Ace only if the player used Swordplay habitually — 80 is a lot** [verified: 2 sources] |
| Auron | Dragon Fang → **Shooting Star** → **Banishing Blade** → **Tornado** | Dragon Fang default; Shooting Star = **defeat Spherimorph** (story-mandatory); Banishing Blade and **Tornado require collecting and watching Jecht Spheres — Tornado needs all ten** | Shooting Star yes; **Tornado usually NOT** — it is gated on an optional collectible hunt [verified: 2 sources] |
| Yuna | Grand Summon | Default | Yes |
| Wakka | Element Reels / Attack Reels / Status Reels / Aurochs Reels | Blitzball prizes | Usually only the early ones |
| Lulu | Fury | Default | Yes |
| Rikku | Mix | Default | Yes |
| Kimahri | Ronso Rage (Lancet-learned) | Varies | Seed Cannon / Stone Breath typical |

Overdrive damage bonus formula (all timed Overdrives): `1 + 0.5 * (time_remaining / total_time)`. [verified: 2 sources]

### 4.4 Aeons, equipment, inventory

**Aeons.** Assume **Valefor, Ifrit, Ixion, Shiva, Bahamut** (all five story-mandatory). Treat **Anima, Yojimbo and the Magus Sisters as absent** for the default preset — but ship their data, because their presence *lengthens the possessed-aeon gauntlet by up to three extra battles* and dramatically changes pacing. Anima is the single biggest outlier: the wiki notes that a player with Anima and a developed Yuna can delete BFA's second form in about two hits. Aeon stats scale off **Yuna's** Strength/Magic, which is why the wiki singles out "Yuna's Strength at least 28" as the threshold for Bahamut's Mega Flare plus a couple of attacks to finish the job. [verified: 2 sources]

**Equipment (typical, not Celestial).** Celestial Weapons are an optional quest chain (Cloudy/Sun Crests and Sigils) and should be **excluded**. Assume story-found gear plus what the dungeon itself hands you — *Inside Sin* is generous and its chests are part of the intended loadout:

| Item found in Inside Sin | Abilities |
|---|---|
| **Phantom Ring** (armour) | Fire Eater, Lightning Eater, Water Eater, 1 empty |
| **Defending Bracer** (armour) | Darkproof, **Deathproof**, 2 empty |
| Wizard Lance | Magic +3/+5/+10%, 1 empty |
| Four-on-One | Firestrike, Icestrike, Lightningstrike, Waterstrike |
| **Stillblade** | **Silencestrike, Stonestrike**, 1 empty |
| Knight Lance | Strength +3/+5/+10%, 1 empty |
| **Infinity** | One MP Cost, Sensor |
| Hrunting / Laevatein | SOS Overdrive |
| Prism Ball | Magic Counter, 1 empty |
| Wicked Cait Sith | Deathstrike, 3 empty |
| Mage's Staff | Magic +3/+5/+10% |
[verified: 2 sources]

> **Stoneproof is the defining equipment decision of this chapter.** It is not on any found armour above; players customise it with **Petrify Grenades**. Our chapter should let the player buy/craft exactly one or two Stoneproof pieces during preparation so the Jecht Beam → shatter threat is a real, solvable decision rather than a coin flip. [verified: 2 sources]

**Inventory preset [estimate]:** 20 Hi-Potions, 10 X-Potions, 8 Al Bhed Potions, 10 Phoenix Downs, 2 Mega Phoenix, 6 Remedies, 4 Softs, 4 Holy Waters, 3 Ethers, 2 Turbo Ethers, 1 Elixir, 4 Light/Lunar Curtains, 2 Stamina Tonics, 1 Candle of Life, ~50,000 gil. (The Candle of Life and the Turbo Ether/Elixir steal off BFA are both *sourced* touches worth including.)

---

## 5. Scene and beat sheet

### 5.1 Setting — Dream's End

**Dream's End** (夢の終わり *Yume no Owari*) is the innermost chamber of Sin: **a ruined recreation of Dream Zanarkand's blitzball stadium**, a narrow platform running out to a circular arena at the centre. The pyreflies saturating the space are said to **reflect Jecht's own memories**, which is why Sin's core looks like a warped Zanarkand — including a **burning Zanarkand Abes logo** hanging in the sky behind the arena. It is the same place Tidus was briefly deposited in the game's opening, when Sin first absorbed him. The battles after BFA take place in an unnamed void beyond it. [verified: 2 sources]

**Staging notes for an HD-2D diorama:** dark, near-black sky; broken stadium tiers as floating fragments at multiple depths; the arena floor as a single readable lit disc; the Abes emblem as a large flame-lit backdrop element; pyrefly motes as drifting particle layers at three parallax depths. The approach corridor is a straight platform — perfect for a long dolly-in on Jecht's silhouette.

### 5.2 Beat sheet

Summarised in our own words. Speaker, tone, and camera are production suggestions.

| # | Beat | Speaker / tone | Camera suggestion |
|---:|---|---|---|
| 1 | The party is deposited at Dream's End after the Nucleus. The stadium ruin resolves out of the dark. Jecht is waiting alone at the centre, arms folded. | Silence; wind and distant hymn. | Slow push-in down the platform; Jecht held small in frame for a long beat. |
| 2 | Jecht admits he can barely hear the Hymn any more, that he is nearly wholly Sin, and that once it starts he will not be able to hold himself back. He apologises in advance. | Jecht: gruff, tired, uncharacteristically direct. Iconic line: *"I'm sorry."* | Two-shot, low angle on Jecht; Tidus's back to camera. |
| 3 | Jecht asks Tidus to say what he came to say. Tidus shouts that he **hates** him — and the line lands as the exact opposite: he says it because it is what they have always been, and neither of them believes it any more. | Tidus: shouting, then breaking. *"I hate you, Dad."* | Hard cut to a tight close-up on Tidus. Hold. |
| 4 | Father and son embrace. Auron and Yuna hold back. | Wordless. The only physical affection the two ever share on-screen. | Wide, static, unhurried — do not cut. |
| 5 | Jecht steps back, the transformation takes him, and he becomes **Braska's Final Aeon** — enormous, horned, scaled. Tidus commits: *"Hit me with all you got, Dad!"* | Tidus: defiant, grinning through it. | Whip-pan up the boss's full height; drop to the battle camera. |
| 6 | **Battle, form 1.** Tidus/Yuna/Auron forced. Pagodas feed him. Petrify threat. | — | Standard combat framing. |
| 7 | **Transformation.** He tears a greatsword out of his own chest; spiked "wings" erupt from his back; HP doubles. | Wordless, brutal. | Two-second directed shot, then straight back to readable CTB input. |
| 8 | **Battle, form 2.** Blade Blitz opens. At half HP, Ultimate Jecht Shot — a monstrous blitzball kick aimed at the whole party. | — | Reserve the full multi-part cinematic only for the first Ultimate Jecht Shot. |
| 9 | **Jecht's death.** He is freed from Yu Yevon and fades. Tidus is with him at the end and tells him he is proud to have had him as a father. | Tidus: quiet, steady — the inversion of beat 3. | Kneeling two-shot; pyreflies rising between them. |
| 10 | **Yu Yevon manifests** as a mote of light, then as a small hooked insect with a glowing Yevon glyph for a face, searching for a host. Jecht and the aeons tell Yuna to call them. Jecht fades out. | Fayth/aeons: calm, requesting. | Slow orbit; keep Yu Yevon deliberately small and unimpressive against the void. |
| 11 | **The aeon gauntlet.** Yu Yevon possesses each of Yuna's aeons in turn; the party must destroy each one. Yuna keeps summoning, knowing what it costs. | Grief without dialogue. Yuna does not flinch. | Each fight opens on Yuna's summon ritual, then a hard cut to the corrupted aeon. |
| 12 | **Before the last fight**, Tidus tells the party he will vanish once Yu Yevon dies. *"I know it's selfish, but this is my story!"* | Tidus: bright, forced, breaking underneath. | Circle-up party shot. |
| 13 | **Yu Yevon.** Permanent Auto-Life; the party cannot lose. The fight is a symbolic crescendo, not a threat. | — | Keep the arena empty and vast. |
| 14 | **Yu Yevon dies**, the Pagodas converge and dissolve, and **Sin is destroyed for good**, detonating over Bevelle as the *Fahrenheit* flies clear. | Awe. | Exterior wide; the party small against the blast. |
| 15 | **The Final Sending.** Yuna sends Sin, the aeons, and Auron. Auron thanks her and departs; the fayth stop dreaming. | Yuna: the sending dance, silent. | The single longest held shot in the chapter. |
| 16 | **Tidus fades.** He apologises to Yuna for never being able to show her his Zanarkand, says goodbye to each guardian. Yuna runs to him and passes straight through. She tells him she loves him (in the Japanese script she simply thanks him). He holds her one last time, then takes a running leap off the deck. | Devastating restraint. | Deck-level tracking shot behind Yuna; the pass-through must be staged clearly. |
| 17 | **Farplane.** Tidus rejoins Braska, Auron and Jecht; he and Jecht exchange a high-five. Peace. | Warm, brief. | Single wide, backlit. |
| 18 | **Epilogue — Luca.** Days later Yuna stands on the Luca docks and **whistles** out over the water — their promise. A montage of the journey plays. She addresses Spira and closes with the game's last line: *"...never forget them."* | Yuna: composed, resolved, no longer anyone's sacrifice. | Rear three-quarter on Yuna at the dock rail, sea filling frame. |
| 19 | **Post-credits stinger.** Tidus wakes underwater among pyreflies and swims for the surface, smiling. | Hope. | Upward swim toward light. |
[verified: 2 sources for the beat order and content]

### 5.3 Music moods

Never transcribe or reuse the recordings; these are mood targets for original composition.

| Cue | Original track | Mood target |
|---|---|---|
| Opening of the game & **the BFA battle** | **"Otherworld"** (Nobuo Uematsu, vocals Bill Muir). An alternate arrangement plays for BFA on all PS2 releases. | The only vocal metal track in the score: distorted downtuned guitar, double-kick, shouted English vocal. It is deliberately *wrong* for Spira — it is Zanarkand's sound, Jecht's sound. Loud, blunt, and personal rather than epic. |
| Before the possessed-aeon battles | **"Hymn of the Fayth — Yunalesca"**, distorted | The prayer hymn bent out of tune. Sacred music made wrong. |
| **Possessed-aeon battles** | **"Summoned Monster Battle"** (召喚獣バトル) | Driving, ceremonial, brass-and-percussion led — the aeon-duel theme, now a funeral for your own companions. |
| **Yu Yevon** | **"Final Battle"** (決戦 *Kessen*, 6:12) | Long-form, choral, more processional than frantic. Ends the game rather than threatens the player. |
| Melancholy Jecht/Zanarkand cue | **"A Fleeting Dream"** (いつか終わる夢, *A Dream That Will End Some Day*) | Solo piano over sustained strings; unresolved, wistful. Use under beats 2–4 and 9. |
| Ending | **"Ending Theme"** (5:50) and the vocal theme **"Suteki da ne (Isn't It Wonderful?)"** | "Suteki da ne" is a folk-inflected ballad — Okinawan-flavoured plucked strings, a single female voice, gentle and unhurried. Uematsu treats it as Yuna's theme and effectively the main melody of the whole score. The Ending Theme is its orchestral bloom. |
| Last line | Audio clip *"Omoidashite kudasai"* ("Please remember") | Spoken, unaccompanied, over silence. |
[verified: 2 sources]

---

## 6. Visual reference for sprite artists

### 6.1 Jecht — human form (beats 1–5, 9, 17)

- Dark-skinned, heavily muscular adult man. **Long, unruly black hair**; **red eyes**.
- **Shirtless and barefoot.** Black shorts; an **orange-and-red sash** wrapped over the **right** leg.
- **Red headband.**
- **Metal gauntlet and pauldron on the LEFT arm only** — a strong asymmetric silhouette cue, keep it readable at sprite scale.
- The outfit reads as a **Zanarkand Abes jumper with the straps undone** and hanging — the same uniform family as Tidus's.
- **Black Zanarkand Abes emblem tattooed across the chest.**
- He never wields a sword on screen in FFX; the black-with-red-dolphin-markings greatsword is concept/Dissidia material — but BFA carries an enlarged version of exactly that design, so the artist should design the two together.
[verified: 2 sources]

### 6.2 Braska's Final Aeon — form 1

- A **huge, deformed version of Jecht himself** — the resemblance must survive the scale-up; this is the whole point of the design.
- **Brown scales**, **horns**, **crests of spikes emerging from the back and shoulders**.
- **White hair**, emerging in tufts from between the spikes around the head.
- An **enlarged version of his red headband**.
- **Glowing eyes.**
- The Abes chest tattoo is still there, now rendered **white**.
- **Another large crest of spikes partially covers the legs** below the waist.
- **Asymmetric hands: the right hand is normal proportion** (it will hold the sword), **the left hand is an oversized claw** (hence "Left-Arm Strike" and "Triumphant Grasp").
- Scale target: he should read as roughly 5–7× a party sprite's height, filling the upper two-thirds of the arena frame.
[verified: 2 sources]

### 6.3 Braska's Final Aeon — form 2

- Identical body, **plus**: he **pulls an enormous greatsword out of his own chest** — a large-scale version of Jecht's black/red-marked blade — and **spikes that resemble wings erupt from his back**.
- The chest wound / open cavity where the sword came from is a strong silhouette and lighting beat; keep it visible and lit from within.
- The normal-proportioned **right** hand wields the sword; the claw stays on the left.
- His physical attack gets an entirely new animation, and **Blade Blitz is a single wide horizontal sweep across the entire party** — stage it as a full-width screen slash.
[verified: 2 sources]

### 6.4 Yu Pagodas

- Two ornate, **pagoda/stupa-shaped totems** flanking the boss — architectural, not organic; tiered roofs, Yevon glyphwork.
- They **float**, do not walk, and have no attack animation of their own beyond emitting **Power Wave**, a broad energy pulse that washes over the boss.
- Left and right variants are visually distinct in the original (separate "Yu Pagoda left / right" assets) — differentiate them, because their behaviour differs when only one survives (A → Curse, B → Osmose).
- At the end of the Yu Yevon fight they **converge inward on him and dissolve together**.
[verified: 2 sources]

### 6.5 Yu Yevon

- Deliberately **small, bizarre and unimpressive** — the anticlimax is the point.
- A **floating, insect-like creature**: described in sources as **tick-like** or **bedbug-like**, with **hooks/barbed limbs**.
- Its "face" is a **glowing Yevon emblem** — the letter **"A"** in the Yevon script (based on Siddham/Sanskrit *bonji* glyphs). Looked at closely, the glyph resembles a robed figure with long sleeves and a large collar, head centred in the "eye".
- He also appears briefly as a **plain floating ball of light**, pyrefly-like, when moving between hosts.
- **No mouth, no voice, no dialogue — ever.**
[verified: 2 sources]

### 6.6 Possessed aeons

**Each possessed aeon takes on the appearance of its corresponding Dark Aeon** — darkened, desaturated palette with a corrupted/oily sheen and altered glow colour, over the otherwise-identical model. This is the cheapest high-impact visual rule in the whole chapter: **author one corruption shader/palette pass and apply it to the existing aeon sprites.** [verified: 2 sources]

---

## 7. Implementation checklist

1. **CTB scheduler** with per-action Rank. **Raw rank byte 0 means rank 3, not "instant"** — Gravija included (§3.4.2). Most BFA actions are rank 3 (18 ticks at AGI 44). True *counters* (Yu Yevon's Curaga) cost 0 ticks and never consume a scheduled turn. Plus Agility-driven turn order, Delay (weak/strong), Haste/Slow.
2. **Enemy Overdrive gauge** as a first-class, visible resource: **+20 % per Power Wave** [verified], **+5 % (roll 0–10 %) when targeted** and **+5 % (roll 0–10 %) when he acts** [estimate, §1.6], spend-on-full with the target-dependent branch (Triumphant Grasp / Jecht Bomber / Ultimate Jecht Shot). **The gauge carries across the form transition**; it is not reset.
3. **Trigger Command "Talk"** with a **charge counter of 2**, a delayed effect that lands on the boss's next turn, a **turn-skip** side effect, and a **third, deliberately inert** appearance.
4. **Petrify → shatter chain**: Petrify status, `shatter_chance` on the follow-up attack, permanent removal, and Jecht Beam's "damage kills → instant shatter" special case. Preview the consequence to the player before they confirm a risky action.
5. **Yu Pagoda lifecycle**: 5,000 HP, disabled-not-killed, **revive after 63 ticks (BFA fight) / 72 ticks (aeon + Yu Yevon fights)**, **new max HP = 5,000 + excess damage**, and the solo-Pagoda behaviour switch (A→Curse, B→Osmose).
6. **Damage-limit flags per ability**, not per enemy. Several BFA abilities `always_break_limit`; others `never_break_limit`. Getting this wrong changes the fight's entire feel.
7. **Two-form transition** preserving all party state, refilling boss HP to 120,000 and raising Strength to 50, with a guaranteed **Blade Blitz** as the first form-2 action.
8. **Zombie inversion** on the boss (Power Wave heals → damages) **and** the separate `immune_to_life` flag that blocks revive-item kills.
9. **Possessed-aeon fights as live copies of the player's own aeon stat blocks** (Luck forced to 1), with each defeated aeon permanently removed from the Summon command.
10. **Permanent Auto-Life** as an unremovable party status from the first possessed-aeon fight onward, plus the single documented loss condition (party-wide Petrify).
11. **Yu Yevon's Curaga counter** — **one per player-side damaging *action*, evaluated after the action fully resolves** (multi-hit, Doublecast, Fury and Attack Reels each fire exactly one); **excluded**: Gravija self-damage, Poison ticks, Pagoda Power Wave, and the counter's own Zombie-inverted damage (no recursion). See §3.4.1. Then the **7-counter → Osmose → Ultima** escalation, and **Gravija self-damage** so the attrition route actually works.
12. **Turn-selection weights** (§1.6) exposed as data, not hard-coded: Form 1 `75/25`, Form 2 >50 % `60/25/15`, Form 2 ≤50 % `0/25/75` for Left-Arm Strike / Jecht Beam / Blade Blitz, with the resolution order Talk → Overdrive → scripted form-2 opener → weighted roll.

---

## 8. Open questions / unresolved

1. **MP 100 vs 106** and **Agility 44 vs 40** for BFA — decompiled struct vs wiki bestiary. Neither is load-bearing for play feel; the struct is the better bet. Unresolved.
2. ~~**Does BFA's Overdrive gauge carry across the transformation?**~~ **CLOSED (design ruling, 2026-09-15).** No source addresses it; §1.6 resolves it as **carry over, do not reset**, with a clamp-to-50 % fallback if playtesting disagrees. The two unquantified gauge inputs are likewise closed with **+5 % (roll 0–10 %)** [estimate] anchored on the wiki's quantified possessed-aeon and Belgemine figures. Residual uncertainty: the true retail values for "targeted" and "acting" remain unpublished.
3. ~~**Exact turn weights**~~ **CLOSED as an authored [estimate] (2026-09-15).** Confirmed that no probability table exists anywhere: the monster AI scripts are absent from the RNG-tracker dataset (`monster_actions.json` exposes only `actions_file / action_id / name / target`), Grayfox96's FFX-Info monster pages carry stats but no AI, and Gamer Guides states explicitly that turn-by-turn probabilities are not specified. §1.6 now publishes weights (F1 `75/25`; F2 >50 % `60/25/15`; F2 ≤50 % `0/25/75`) with the reasoning behind each, and flags **Jecht Beam's 25 %** as the single tuning dial that decides whether Stoneproof is optional or mandatory. Residual uncertainty: the retail weights.
4. ~~**Exact Pagoda revive timer**~~ **CLOSED as an authored [estimate] (2026-09-15).** No source gives a turn count ("a short time" / "a few turns"). §1.4 converts the qualitative "around three turns" into **63 ticks** in the BFA fight (3 × the Pagoda's own rank-3 recovery at AGI 40) and **72 ticks** in the aeon/Yu Yevon fights (AGI 30), so the timer is well-defined for an actor that takes no turns while dead. The struct's `doom_turns = 3` is still **not** confirmed to be the same counter.
4b. **CLOSED (2026-09-15): what counts as one "instance" for Yu Yevon's Curaga counter.** §3.4.1 rules it **one per player-side damaging action**, on the strength of the wiki's own Doublecast worked example and the arithmetic of the attrition win (which is impossible if Gravija self-damage counters). The per-hit reading is documented as a deliberate-deviation option.
5. **Triumphant Grasp 2 critical hits** — struct says it can crit (+10 bonus), wiki says it cannot. Struct preferred.
6. **HD Remaster BFA battle music** — the wiki specifies the "Otherworld" alternate arrangement "on all PlayStation 2 releases," implying the HD version may differ. Not confirmed either way.
7. **Whether the party's Summon command is hard-disabled or merely empty** during the later possessed-aeon fights. Sources confirm the roster is exhausted; the UI behaviour is undocumented.

---

## Sources

**Decompile-derived (tier A)**
- https://github.com/Grayfox96/FFX-RNG-tracker
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_mon_data.csv
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_mon_data_hd.csv
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_monmagic1.csv
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_monmagic2.csv
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/ffx_command.csv
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/monster_actions.json
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/data_files/text_characters.csv
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/monsters.py
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/actions.py
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/data/constants.py
- https://raw.githubusercontent.com/Grayfox96/FFX-RNG-tracker/main/ffx_rng_tracker/events/character_action.py
- https://grayfox96.github.io/FFX-Info/rng/
- https://grayfox96.github.io/FFX-Info/monsters/ (monster index — confirms no AI/probability data is published anywhere in the dataset)
- https://grayfox96.github.io/FFX-Info/monsters/braskas-final-aeon (stat/ability dump; **contains no AI, action-probability or Overdrive-gauge data** — negative result for §1.6/§8 item 3)
- https://grayfox96.github.io/FFX-Info/monsters/yu-yevon (same; negative result for §3.4)

**Final Fantasy Wiki** — originally fetched via the MediaWiki API (`https://finalfantasy.fandom.com/api.php?action=parse&page=...&prop=wikitext`). **As of the 2026-09-15 gap-fill pass that API, `rest.php`, `Special:Export` and the plain HTML endpoints all return HTTP 402 to this toolchain**; the gap-fill pass re-read the pages through the `https://r.jina.ai/<url>` text proxy instead. Canonical URLs are listed below.
- https://finalfantasy.fandom.com/wiki/Braska%27s_Final_Aeon
- https://finalfantasy.fandom.com/wiki/Yu_Pagoda
- https://finalfantasy.fandom.com/wiki/Yu_Yevon_(boss)
- https://finalfantasy.fandom.com/wiki/Yu_Yevon
- https://finalfantasy.fandom.com/wiki/Inside_Sin
- https://finalfantasy.fandom.com/wiki/Jecht
- https://finalfantasy.fandom.com/wiki/Tidus
- https://finalfantasy.fandom.com/wiki/Valefor_(Final_Fantasy_X_boss)
- https://finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X_boss)
- https://finalfantasy.fandom.com/wiki/Anima_(Final_Fantasy_X_boss)
- https://finalfantasy.fandom.com/wiki/Sphere_Grid
- https://finalfantasy.fandom.com/wiki/Overdrive_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Swordplay_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Bushido_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X:_Original_Soundtrack
- https://finalfantasy.fandom.com/wiki/Walkthrough:Final_Fantasy_X/Apoqliphoth/Part_25
- https://finalfantasy.fandom.com/wiki/Jecht_Beam
- https://finalfantasy.fandom.com/wiki/Final_Aeon

**Added by the 2026-09-15 gap-fill pass**
- https://finalfantasy.fandom.com/wiki/Valefor_(Final_Fantasy_X_boss) — **quantified enemy Overdrive gauge rates**: Inside Sin "15~30% when targeted by Power Wave from a Yu Pagoda", "0~10% when targeted by an attack or using an ability"; Remiem/Belgemine "5% when targeted", "15% when targeted by a magical attack", "10% when attacking". Anchor for §1.6's [estimate].
- https://finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X_boss) — independently repeats the identical 15~30 % / 0~10 % possessed-aeon figures (second source for that band).
- https://finalfantasy.fandom.com/wiki/Braska%27s_Final_Aeon — verbatim: gauge "fills by a small amount when targeted or using an attack", "fills by 20% when the Pagodas use Power Wave"; "Blade Blitz will always be used first and has a small chance to be used afterwards"; Talk "will take effect on Braska's Final Aeon's next turn and prevent him from acting, but this can only be done twice".
- https://finalfantasy.fandom.com/wiki/Yu_Yevon_(boss) — verbatim strategy text underpinning §3.4.1: "he casts Curaga on himself every time he takes damage, restoring 9,999 HP"; "Another strategy is to Doublecast magic for two 9,999s (or more with Break Damage Limit) every turn" / "Yu Yevon will only be able to use Curaga for one 9,999"; "alternate between doing nothing and using Gravija, until Curaga is used seven times"; Magic Break + Shell → "around 2700".
- https://finalfantasy.fandom.com/wiki/Yu_Pagoda — revive "after a short time" (no turn count published); Power Wave status-strip lists for both variants; solo-Pagoda targeting switch.
- https://lparchive.org/Final-Fantasy-X-(by-The-Dark-Id)/Update%20131/ — "Any attacks toward Yu Yevon will cause it to immediately counter by casting Curaga for a 9999 HP heal" (second source for the per-**action** counter reading).

**Guides**
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/braskas-final-aeon
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/yu-yevon
- https://www.gamerguides.com/final-fantasy-x-hd/guide/walkthrough/sin/the-final-battle
- https://game8.co/games/Final-Fantasy-X/archives/269352
- https://game8.co/games/Final-Fantasy-X/archives/271780
- https://samurai-gamers.com/final-fantasy-x-x-2-hd-remaster/braskas-final-aeon-boss-guide/
- https://finalfantasy.neoseeker.com/wiki/Braska's_Final_Aeon
- https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/answers/118051-how-do-i-beat-yu-yevon-at-the-end-of-the-game
- https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/56575662
- https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/79145/stat-maxing-general
- https://lparchive.org/Final-Fantasy-X-(by-The-Dark-Id)/Update%20129/
- https://lparchive.org/Final-Fantasy-X-(by-The-Dark-Id)/Update%20130/
- https://auronlu.istad.org/ffx-script/chapter-xv-showdown-with-sin/
- https://en.wikiquote.org/wiki/Final_Fantasy_X
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/braskas-final-aeon (fact-check corroboration, BFA HP/Strength)
- https://finalfantasy.neoseeker.com/wiki/Braska's_Final_Aeon (fact-check corroboration, BFA Strength; also Neoseeker forums thread "Braska's Final Aeon Zanmato Level?")
- https://finalfantasy.fandom.com/wiki/Yu_Pagoda (fact-check corroboration, Yu Pagoda HP/revive rule)
- https://lparchive.org/Final-Fantasy-X-(by-The-Dark-Id)/ (LP Updates 129/130/131 — Yu Pagoda HP/revive, Gravija)
- https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/79145/the-final-battle (fact-check corroboration, Yu Yevon HP/Curaga/AI cycle/Auto-Life)
- https://game8.co/games/Final-Fantasy-X/archives/271780 (fact-check corroboration, Yu Yevon HP)
- https://strategywiki.org/wiki/Final_Fantasy_X/Inside_Sin (fact-check corroboration, Yu Yevon AI cycle/Zombie/Reflect/immunities)
- https://villains.fandom.com/wiki/Yu_Yevon (fact-check corroboration, Auto-Life/immunities)
- https://finalfantasy.fandom.com/wiki/Yu_Yevon_(boss) (fact-check corroboration, Doom counter)
- https://kjcesports.com (fact-check corroboration, Doom counter kill via Candle of Life)
- https://finalfantasy.fandom.com/wiki/Gravija (fact-check corroboration, Gravija 75% self-damage)
- https://jegged.com/Games/Final-Fantasy-X/Walkthrough/32-Inside-Sin.html (fact-check corroboration, Trigger Command "Talk")
- https://samurai-gamers.com (boss guide; fact-check corroboration, Talk command / Ultimate Jecht Shot damage band)
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_version_differences (fact-check corroboration, Zanmato level 5→6)
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/ (fact-check corroboration, Overdrive damage bonus formula)
- https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/31381 (SinirothX "Stat Mechanics FAQ" — CONFLICTING value for the STR power-formula constant; 403 on direct fetch, obtained via search snippet)

**Local prior research consulted (contains Yunalesca data only; no BFA/Yu Yevon content)**
- `D:/Projects/Final Fantasy/docs/encounter-design.md`
- `D:/Projects/Final Fantasy/CrystalReverie/Docs/FFX_MECHANICS_NOTES.md`

**Sibling research documents in this repository (canonical for shared systems — read these before re-deriving anything)**
- `D:/Final Fantasy/research/ffx-combat-core.md` — **§2.2 POWER, §2.3 MITIGATION** (the corrected damage constants this chapter now matches), **§1.1** (raw rank byte 0 → rank 3 fallback), §1.3 action ranks, §1.6 revived-actor CTB re-entry, §2.4 modifier order.
- `D:/Final Fantasy/research/ffx-yunalesca.md` — **§4.1** (same damage chain, independently transcribed correctly), **§6** (rank-0 counters cost 0 ticks), **§14.8** (the rank-0 counter-vs-scheduled split reused for Gravija in §3.4.2).

---

## Verification log

Independent fact-check pass (2026-09-15) against this document's claims. Each row: claim, verdict, action taken.

| # | Claim | Verdict | Action taken |
|---:|---|---|---|
| 1 | BFA HP: Form 1 = 60,000, Form 2 = 120,000 (struct override) | confirmed | Tag already [verified: 4 sources]; corroborating source added to Sources. |
| 2 | BFA Strength: Form 1 = 45, Form 2 = 50 | confirmed | Tag already [verified: 2 sources] per form; corroborating sources added to Sources. |
| 3 | BFA MP = 100 (decompile) vs wiki 106 | unverifiable | No change — doc already flags as open conflict, decompile value retained per policy. |
| 4 | BFA Agility: decompile 44 vs wiki 40 | unverifiable | No change — doc already flags as open conflict, decompile value retained per policy. |
| 5 | Yu Pagoda initial HP = 5,000 (overkill field, not the 65535 struct placeholder) | confirmed | Tag already [verified: 3 sources]; corroborating sources added to Sources. |
| 6 | Yu Pagoda revive rule: new max HP = 5,000 + excess damage; worked example 5,300 | confirmed | Tag already [verified: 2 sources]; corroborating sources added to Sources. |
| 7 | Yu Yevon HP = 99,999 | confirmed | Tag already [verified: 3 sources]; corroborating sources added to Sources. |
| 8 | Yu Yevon Curaga counter-heals a capped 9,999 on taking damage | confirmed | Added inline [verified: 2 sources] tag (previously untagged); source added. |
| 9 | Yu Yevon AI cycle: alternate nothing/Gravija; Curaga ×7 → Osmose → Ultima → reset | confirmed | Tag already [verified: 2 sources]; corroborating source added. |
| 10 | Gravija removes 75% of current HP from every target incl. Yu Yevon, cannot KO | confirmed | Added inline [verified: 2 sources] tag (previously untagged); source added. |
| 11 | Permanent Auto-Life from possessed-aeon fights onward; only loss = deliberate party Petrify | confirmed | Tag already [verified: 3 sources]; corroborating sources added. |
| 12 | Doom counter kills Yu Yevon in exactly 3 turns (e.g., Candle of Life) | confirmed | Tag already [verified: 2 sources]; corroborating sources added. |
| 13 | Zombie (resist 0) turns Curaga/Power Wave/revive items into instant kills on Yu Yevon | confirmed | Covered by existing table-level [verified: 2 sources] tag; source added. |
| 14 | Reflect on Yu Yevon bounces Curaga onto the party | confirmed | Covered by existing table-level [verified: 2 sources] tag; source added. |
| 15 | Trigger Command "Talk" resets BFA Overdrive gauge, costs next turn, usable twice, third appearance inert | confirmed | Tag already [verified: 2 sources]; corroborating sources added. |
| 16 | BFA Zanmato resistance: 5 (PS2 original) → 6 (HD Remaster) | confirmed | Covered by existing table-level [verified: 2 sources] tag; corroborating source (Neoseeker forum) added. |
| 17 | Damage formula power(STR) = (STR^3/32) + 30 | contradicted | Correction applied inline in §1.5: recorded as a CONFLICT (independent community FAQ gives +32), decompile value (+30) retained per source-tier policy, second source added to Sources. |
| 18 | Overdrive damage bonus: multiplier = 1 + 0.5 × (time_remaining/total_time) | confirmed | Tag already [verified: 2 sources]; corroborating source added. |
| 19 | Possessed aeons mirror player's own aeon stat block exactly, Luck forced to 1 | confirmed | Tag already [verified: 2 sources] (Luck-forced-to-1 sub-detail noted as single-sourced by fact-check; left as is, no independent second source found for that sub-clause). |
| 20 | BFA/Yu Yevon overkill threshold = 20,000 | unverifiable | No change — no independent second source found; struct-only. |
| 21 | Yu Pagoda Power Wave (BFA): fixed 1,500 heal, strips statuses, +20% Overdrive gauge | confirmed | Split tag applied inline: heal/status-strip [verified: 2 sources]; +20% gauge clause left [single source: decompile] per fact-check finding. |
| 22 | Ultimate Jecht Shot ≈ 4,000–5,000 dmg/target, consistent with STR 50 in form 2 | confirmed | Covered by existing §1.5 cross-validation tag; corroborating source added. |
| 23 | Yu Yevon immune to Death/Petrify/Sleep/Silence/Dark/Confuse/Berserk; vulnerable to Zombie/Doom/Poison/Breaks at 0% resist | confirmed | Added inline [verified: 2 sources] tag (previously untagged); sources added. |
| 24 | BFA/Yu Yevon are all-Neutral on elements; Game8's "100% resist" is a mis-rendered status column | unverifiable | No change — remains the doc's own inference, no independent second source resolves it. |
| 25 | Yu Pagoda targeting: both alive → Power Wave only; one alive → A=Curse, B=Osmose | unverifiable | No change — no independent second source found for this AI-branching detail. |
| 26 | Triumphant Grasp 2 (form 2 OD) still can_crit per struct, vs wiki's "no longer inflicts Zombie or criticals" | unverifiable | No change — remains a single-sourced (decompile) vs single-sourced (wiki) conflict, as already stated in the doc; no third source resolves it. |

### Gap-fill pass — 2026-09-15

Four gaps raised against this chapter, all now addressed.

| # | Gap | Verdict | Action taken |
|---:|---|---|---|
| G1 | **§1.5 damage formula transcribed wrong in two places** (`MAG^2/3` should be `/6`; `D^2/7` should be `D^2 × 2/11`, with a misplaced outer floor) — and the three FFX docs disagreed with no conflict note | **confirmed error** | §1.5 rewritten with the byte-exact integer chain (`0x2AAAAAAB → /6`, `0x2E8BA2E9 → 2/11`, `0x33 = 51`, `0x66666667 → ×0.4`, `0x2DA = 730`), plus mitigation unit-test fixtures and an explicit authority note naming `ffx-combat-core.md` §2 as the tie-breaker. **All §1.5 damage tables were recomputed from the corrected chain and came back byte-identical** (Left-Arm Strike F1 vs DEF 10/20/30/40 = 2,679/2,490/2,309/2,132; Ultimate Jecht Shot vs DEF 20 = 4,684 at rng 16 and 4,391–4,958 over the full spread) — the tables were always generated from the decompile's own functions, only the prose transcription was wrong. Cross-document conflict now recorded inline. |
| G2 | **BFA Overdrive gauge**: only "+20 % per Power Wave" quantified; "targeted" and "acting" left as "a small amount"; carry-across-transition unresolved | **partially unverifiable → closed with a sourced [estimate]** | §1.6 now publishes a full gauge table. Anchored on the wiki's *quantified* sibling gauges — possessed aeons (15~30 % Power Wave / 0~10 % targeted / 0~10 % acting, stated independently on both the Valefor and Bahamut FFX-boss pages) and Belgemine's Valefor (5 % / 15 % / 10 %). BFA's verified flat 20 % sits inside the possessed-aeon band, evidencing a shared subsystem. Adopted: **+5 %, rolled 0–10 %** for both unquantified inputs, with a turns-to-Overdrive tuning table (≈1.7 turns at full Pagoda uptime → 10 turns with both Pagodas down). Transition question closed as **carry over** on three structural grounds (single `m132` monster entry; battle-wide Talk pool of two; general battle-state persistence), with a clamp-to-50 % fallback. |
| G3 | **§3.4 "one per instance of damage taken" undefined** for multi-hit / Doublecast / Fury / party-wide; **Gravija rank-0** lacked the caveat `ffx-yunalesca.md` §14.8 gives Dispelling Slap | **confirmed gap → closed** | New **§3.4.1** rules **one Curaga per player-side damaging _action_**, with a per-input table (Doublecast 1, Attack Reels 1, Fury 1, Poison tick 0, Gravija self-damage 0, Pagoda Power Wave 0, counter-on-counter 0). Evidence: the wiki's own Doublecast worked example ("two 9,999s" → "only be able to use Curaga for one 9,999") plus LP Update 131's "any attacks toward Yu Yevon will cause it to immediately counter"; and a forcing argument — if Gravija self-damage countered, the wiki's own documented attrition win would stall at HP ≈ 13,332 and be impossible. New **§3.4.2** applies the `ffx-combat-core.md` §1.1 rank-0 → rank-3 fallback to Gravija (18 ticks; a Gravija roughly every 36 ticks given the alternating do-nothing turn) while keeping the Curaga *counter* at 0 ticks. §3.5's win condition reworded from "per instance" to "per action". |
| G4 | **No probability table for BFA turn selection**; Pagoda revive "around three turns" | **confirmed unavailable → closed as an authored [estimate]** | Sources exhausted first: the RNG-tracker's `monster_actions.json` carries only `actions_file / action_id / name / target` (no weights, no script); Grayfox96's FFX-Info monster pages carry stats but no AI; Gamer Guides states outright that turn-by-turn probabilities are not specified; Game8, Jegged, Neoseeker, Samurai Gamers and the Jecht Beam page give no frequencies. §1.6 now publishes a resolution order (Talk → Overdrive → scripted form-2 opener → weighted roll) and weights **F1 75/25**, **F2 >50 % 60/25/15**, **F2 ≤50 % 0/25/75** (Left-Arm Strike / Jecht Beam / Blade Blitz), each with its reasoning, and names **Jecht Beam's 25 %** as the dial that decides whether Stoneproof is optional or mandatory (derived from BFA's 18-tick turn giving a ~72-tick cleanse window). §1.4 converts the revive timer to **63 ticks** (BFA fight, Pagoda AGI 40) / **72 ticks** (aeon + Yu Yevon fights, AGI 30). New recorded conflict: Samurai Gamers' claim that Jecht Bomber becomes a normal-turn action in phase 2 is rejected against the decompile. |

**Stray discrepancy observed during this pass (not one of the four gaps, not acted on):** `grayfox96.github.io/FFX-Info/monsters/braskas-final-aeon` and `/monsters/yu-yevon` both display **Zanmato Level 4**, where §1.2 records 6 (5 in the original JP/NA release) for BFA and §1.4 records 5 for the Yu Pagodas. The site may be indexing a different Zanmato table or a different release. Left as-is and flagged here so a later pass resolves it rather than silently inheriting either number. [conflict recorded]

**Tooling note for the next pass:** every `finalfantasy.fandom.com` endpoint (MediaWiki API, `rest.php`, `Special:Export`, plain HTML) returned HTTP 402 to this toolchain on 2026-09-15; the pages were re-read successfully through the `https://r.jina.ai/<url>` text proxy. `gamefaqs.gamespot.com` and `strategywiki.org` returned 403 both directly and through the proxy, so the GameFAQs FAQs cited earlier in this document could not be re-verified on this pass.
