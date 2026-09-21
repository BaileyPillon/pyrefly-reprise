# FINAL FANTASY X — Core Battle System, Implementation-Ready

Target: **Pyrefly Reprise** (Vite + TypeScript + Three.js, HD-2D). Baseline version: **FFX International / PAL / HD Remaster** (the "HD" build in decompile terms). Where the original PS2 NA/JP build differs, the difference is called out inline.

**Evidence hierarchy used here**
1. **Decompile-derived data** — Grayfox96's *FFX RNG Tracker*, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`. Its `ffx_command.csv` / `ffx_item.csv` are the game's own action records; `events/character_action.py` is a transcription of the game's integer damage routine. Every table below marked "CSV row N" was produced by running that repo's own parser at that commit.
2. **Final Fantasy Wiki** (Fandom), fetched as raw wikitext through the MediaWiki API. Mostly cites *Final Fantasy X Ultimania Omega* and community disassembly.
3. **Guides** (Jegged, SuperCheats/Tha Demon2004, SinirothX, Ceebs, BradyGames Mix chart) — used for content the decompile does not encode (unlock conditions, minigame UI, mix recipes).

Where 1 and 3 conflict, **1 wins and the conflict is recorded** in §11.

**Confidence tags**: `[verified: 2 sources]` = decompile + at least one independent source agree. `[single source]` = one source only. `[estimate]` = derived/computed by me from a cited rule, not directly stated anywhere.

**Prior local research consumed (read before searching):**
`D:/Projects/Final Fantasy/Moonpetal/docs/MECHANICS-AUDIT.md`, `SECOND-MECHANICS-REVIEW.md`, `SOURCES.md`, `MIX-REVIEW.md`, `STANDARD-GRID-RESEARCH.md`, `src/combat.mjs`, `src/data.mjs`, `docs/research/standard-hd-graph.json`, `docs/research/aeon-growth-reference.json`; `D:/Projects/Final Fantasy/CrystalReverie/Docs/FFX_MECHANICS_NOTES.md`. Their decoded constants are reproduced and, where they were provisional, now confirmed or corrected against the pinned decompile directly.

---

## 0. Declared version baseline (project-wide)

**This is the single normative answer to "which version are we building?" for every document in this repository.** Where an individual chapter quoted a different value, this section overrides it; chapters are expected to be reconciled against this table rather than carrying their own version logic.

> **BASELINE: `FFX International / PAL / HD Remaster` ("HD" in decompile terms), and `FFX-2 International + Last Mission / HD Remaster` for the X-2 chapters.**
> No version branches are to be implemented. Original-PS2 NA/JP values are recorded below only so that a guide quoting them can be recognised and discarded.

| # | Mechanic | **Baseline value (ship this)** | Original PS2 NA/JP value (do NOT ship) | Ref |
|---:|---|---|---|---|
| V1 | Quick Hit | **rank 2, 36 MP** | rank 1, 12 MP | §11 C8 |
| V2 | Anima — Oblivion | **16 hits × DmgCon 4** | 1 hit × DmgCon 75 | §6.3, §11 C9 |
| V3 | Magus Sisters — Delta Attack | **6 hits × DmgCon 10** | 1 hit × DmgCon 60 | §6.3, §11 C9 |
| V4 | Auron — Tornado | **2 hits** on success | 1 hit | §5.5 |
| V5 | Wakka — timed-Overdrive damage bonus | **applies** | did not apply | §5.2 |
| V6 | Overdrive mode **Ally** increment | **3 %** | 4 % | §5.1 |
| V7 | Overdrive mode **Daredevil** increment | **5 %** | 16 % | §5.1 |
| V8 | Critical / SOS threshold | **HP < 50 % of max** | HP < 25 % of max (JP PS2) | §5.1, §9 |
| V9 | Yojimbo starting compatibility | **128** | 50 | §6.5 |
| V10 | Yojimbo compatibility divisor / OD bonus / gil constant K | **10 / 20 / 4** | 30 / 2 / 2 | §6.5 |
| V11 | Sphere Grid | **Standard (860 nodes)** | Regular (828 nodes) | §10 |
| V12 | Bribe — 100 % success threshold | **gil = maxHP × 25** | maxHP × 20 (JP only) | §7.8 |
| V13 | Bribe — zero-gil offer | **rejected outright (`gil < 1` returns early)** | allowed | §7.8 |
| V14 | Bushido — Dragon Fang sequence | **↓ ← ↑ → L1 R1 ✕ ○** | ↓ ← ↑ → L1 R1 ○ ✕ | §5.5 |
| V15 | Bushido — Shooting Star sequence | **△ ✕ □ ○ ← → ○** | △ ○ □ ✕ ← → ✕ | §5.5 |
| V16 | Bushido — Tornado sequence | **○ → R1 ← L1 △** | ✕ → R1 ← L1 △ | §5.5 |
| V17 | Dark Aeons / Penance | **present** | absent | content |

**FFX-2 baseline splits** (consolidated here from the X-2 chapters; the X-2 combat core remains the detail owner):

| # | Mechanic | **Baseline value (ship this)** | Original value | Ref |
|---:|---|---|---|---|
| V18 | Cat Nip | **Auto-Berserk rider present** | no Auto-Berserk rider | ffx2-combat-core |
| V19 | Shuyin — Yuna-targeting bias | **present** | absent / weaker | ffx2-vegnagun-shuyin |
| V20 | Creature Creator / Last Mission content | **present** | absent | content |

`[verified: 2 sources]` for V1–V3, V5, V9–V11, V17 (decompile `GameVersion` switches + Fandom *Final Fantasy X version differences*); `[verified: 2 sources]` for V6–V8 and V14–V16 (Fandom Overdrive Mode / Bushido pages state the split explicitly); `[single source]` for V4, V12–V13 and V18–V20.

**Rule for implementers:** if a guide's number disagrees with a baseline value above, the guide is describing the original PS2 build. Do not add a runtime version flag; there is exactly one target build.

---

## 1. CTB — Conditional Turn-Based turn order

### 1.1 The core clock

Every actor (party member, aeon, enemy) owns a single integer **CTB counter**. The actor with the **lowest CTB** acts next. After acting, the actor's CTB increases by its *recovery*. After each action the engine subtracts the minimum CTB in the field from everybody (normalisation), so counters stay small and "elapsed ticks" is well defined. `[verified: 2 sources]` — decompile `gamestate.py::get_min_ctb/normalize_ctbs`; wiki describes the same "ticks" model.

```
nextActor   = argmin(ctb) over living, non-Eject, non-Petrify actors
recovery    = baseCTB(agility) * rank
if HASTE:  recovery = floor(recovery / 2)
elif SLOW: recovery = recovery * 2
actor.ctb += recovery
// then: elapsed = min(ctb of all actors); subtract elapsed from every actor
```
Source: `events/character_action.py::_get_ctb`. `[verified: 2 sources]`

If an action's raw rank byte is `0`, the engine falls back to **rank 3**. `[single source]` (decompile). Do not read "rank 0 = instant" from the raw byte — Dismiss stores 0 and is *not* proven instant.

### 1.2 Agility → base tick table (`ICV_BASE`)

Base CTB is a 256-entry lookup indexed by Agility. Breakpoints (min agility → base ticks): `[verified: 2 sources]` (decompile `constants.py::ICV_BASE`; matches the SinirothX Stat Mechanics FAQ from AGI 4 upward, and is independently corroborated at AGI 1–3 by Grayfox96's companion site <https://grayfox96.github.io/FFX-Info/mechanics/ctb>, which states explicitly "Agility 1: Base CTB 28" — see §11 conflict C4 for the resulting disagreement with SinirothX below AGI 4)

| Agility ≥ | Base ticks | Agility ≥ | Base ticks |
|---:|---:|---:|---:|
| 0 | 28 | 19 | 10 |
| 2 | 26 | 23 | 9 |
| 3 | 24 | 29 | 8 |
| 4 | 20 | 35 | 7 |
| 5 | 16 | 44 | 6 |
| 7 | 15 | 62 | 5 |
| 10 | 14 | 98 | 4 |
| 12 | 13 | 170 | 3 |
| 15 | 12 | (255 max) | 3 |
| 17 | 11 | | |

Agility above **170** changes nothing except first-turn placement. `[verified: 2 sources]`

### 1.3 Action ranks (1–10)

Recovery is **linear in rank**: rank 4 delays exactly twice as long as rank 2. `[verified: 2 sources]` (independently corroborated by the SinirothX Stat Mechanics FAQ, mirrored at <https://www.neoseeker.com/final-fantasy-x/faqs/82727-stats.html> and on GameFAQs, which describes recovery as tick-speed × rank × speed-status, i.e. linear in rank)

Complete player-command rank table (decompiled `rank` byte; the Fandom rank list agrees on every row except the two noted):

| Rank | Commands |
|---:|---|
| 1 | Escape, Weapon switch, Armor switch, Quick Pockets, Quick Hit *(PS2 NA/JP only)* |
| 2 | Item, Defend, Use, Flee, Cheer, Aim, Focus, Reflex, Luck, Jinx, Lancet, Nul-spells (×4), Drain, Osmose, Sonic Wings (Valefor), **Quick Hit (Int/HD)** |
| 3 | **Attack**, Summon, Switch, all Attack/Buster status skills, Zombie Attack, Triple Foul, Mug, Nab Gil, Extract ×4, Steal, Pray, Guard, Sentinel, Spare Change, Threaten, Provoke, Entrust, Copycat, Doublecast, Bribe, all tier 1–3 Blk Magic, Bio, Demi, Death, Cure/Cura/Curaga, Scan, Esuna, Life, Full-Life, Slow, Shell, Protect, Reflect, Dispel, Regen, Auto-Life, Spiral Cut, Jump, Fire Breath, Seed Cannon, Self-Destruct, Thrust Kick, Stone Breath, Aqua Breath, Doom, White Wind, aeon Attack/Shield/Boost, Yojimbo's four attacks, Wakka's resolved reel shots *(see §11 C1)* |
| 4 | Power/Magic/Armor/Mental Break, **Haste**, Slowga, Holy, Slice & Dice, Bad Breath, Mighty Guard, Drain Fury, Osmose Fury, Meteor Strike, Aerospark, Heavenly Strike, Requiem (Seymour), Element/Attack/Status/Aurochs Reels *(wrapper)* |
| 5 | Full Break, Flare, Energy Rain, Grand Summon, Dragon Fang, Shooting Star, all tier1–3 + Bio/Death Fury, Camisade, Razzia, Passado, Delta Attack |
| 6 | **Hastega**, Delay Attack, Ultima, Banishing Blade, Demi Fury, Impulse (Bahamut), Pain (Anima), **all Mixes** |
| 7 | Blitz Ace, Tornado, Nova, Flare Fury |
| 8 | Delay Buster, all aeon Overdrives (Energy Ray, Hellfire, Thor's Hammer, Diamond Dust, Mega Flare, Oblivion) |
| 9 | Energy Blast (Valefor 2nd Overdrive) |
| 10 | Ultima Fury |

Sources: decompiled `ffx_command.csv` rank byte; <https://finalfantasy.fandom.com/wiki/Rank_(Final_Fantasy_X)>. `[verified: 2 sources]`

**UI trap to reproduce (or deliberately not):** Mix displays rank **5** on the CTB preview but every mix actually resolves at rank **6**; Slots displays rank 5 but resolves at 4 (wiki) / 3 (decompile). `[verified: 2 sources]` for Mix.

### 1.4 Haste / Slow

| Status | Effect on future recovery | Immediate effect on the target's **current** CTB |
|---|---|---|
| Haste | `floor(recovery/2)` | Haste/Hastega/Chocobo Feather/Chocobo Wing use damage formula `CTB` with base 8 and the `heals` flag → target's remaining CTB is **reduced by `floor(currentCTB × 8/16)` = 50%** |
| Slow | `recovery × 2` | Slow/Slowga use formula `CTB` base 16 without `heals` → remaining CTB **increased by 100%** |

`[single source]` (decompile: `ffx_command.csv` rows 54–57, `get_damage` case `DamageFormula.CTB`, `_apply_damages`). This is a commonly-missed rule: **Haste is not only a future-recovery buff, it instantly halves the pending wait.**

Haste and Slow are mutually exclusive: applying one pops the other. A target whose Haste/Slow has stack value ≥ 255 (permanent, e.g. Auto-Haste) cannot receive the opposite status at all. `[verified: 2 sources]`

Dispel and Aerospark remove Haste; **removing Haste must not retroactively re-inflate an already-scheduled counter** — only future recovery changes.

### 1.5 Delay

Two delay strengths, applied *after* statuses resolve, to the **target's** counter, using the **target's** base ticks:

| Flag | Amount | Carriers |
|---|---|---|
| Weak delay | `target.ctb += floor(target.baseCTB × 3 / 2)` | Delay Attack (row 6), Sonic Wings (204), Dragon Fang (101), Time Shot (249/250) |
| Strong delay | `target.ctb += target.baseCTB × 3` | Delay Buster (row 7) |

`[single source]` (decompile `_get_statuses`). Enemies flagged `immune_to_delay` ignore both. Threatened enemies also cannot be delayed. `[verified: 2 sources]`

### 1.6 Turn-list prediction rules

* The CTB window shows upcoming turns; hovering a command re-renders the list with **that command's** rank applied to the current actor. `[verified: 2 sources]`
* The forecast **assumes every other actor will use a rank-3 action**. It is a projection, not a promise. `[verified: 2 sources]`
* Tie-break order when counters are equal (highest priority first):
  **Tidus → Yuna → Auron → Kimahri → Wakka → Lulu → Rikku → the player's aeon → Cindy → Sandy → Mindy → enemies → Cid (lowest)**. Among enemies: a boss icon with no number first, then numbered icons ascending, then lettered icons alphabetically. `[single source]` (<https://finalfantasy.fandom.com/wiki/Rank_(Final_Fantasy_X)>)
* Revived characters re-enter with a delay **equal to a rank-3 action** (`ctb = baseCTB × 3`). `[verified: 2 sources]` (decompile `_remove_statuses` Death branch; wiki).
* Summoning an aeon **freezes** every party member's counter and every status duration until the aeon is dismissed or dies. `[verified: 2 sources]`
* Because everything floors, two rank-1 actions can cost *fewer* ticks than one rank-2 action at high Agility + Haste. Reproduce the flooring, don't smooth it. `[single source]`

### 1.7 Switch (swapping party members)

* Switch is a **rank-3 command** in the data (`ffx_command.csv` row 2) usable on any active member's turn; the incoming reserve member **takes the turn that is happening right now** — i.e. the player selects Switch, the bench character walks in, and the menu re-opens for them. The turn is not consumed by the swap. `[verified: 2 sources]` (wiki "Characters can also switch out for backline party members… and also change their equipment during their turn"; Moonpetal/CrystalReverie prior research states the same "swapped-in guardian gets the current turn" rule)
* A character switched out **during their first turn** earns no AP for the battle. `[single source]` (wiki Sphere Grid page)
* Any reserve member may be swapped in at any point; all seven can therefore participate. Underwater battles restrict the roster to Tidus/Wakka/Rikku and disable Switch and Summon entirely. `[verified: 2 sources]`
* A shattered (petrified-then-hit) character removes one bench slot permanently for that battle. `[single source]`
* **First Strike** on the incoming character still guarantees them the opening turn if they are swapped in before the battle starts — the practical trick is keeping one First Strike weapon on the bench. `[single source]`

### 1.8 Escape and Flee

| Command | Row | Rank | MP | Target | Behaviour |
|---|---:|---:|---:|---|---|
| Escape | 3 | 1 | 0 | Self | One character attempts to leave. Roll `rng & 255`; success if `< 191` → **74.6 %** per attempt. On success that character gains `Eject` and is out of the battle. | 
| Flee | 24 | 2 | 0 | Characters' Party | Tidus's skill. **The whole party escapes; it always succeeds** and ends the battle. Because it ends the battle its rank is effectively irrelevant. |

`[verified: 2 sources]` for the 191/256 escape constant (decompile `events/escape.py`; independently corroborated by <https://grayfox96.github.io/FFX-Info/rng/damage-crit-escape-icv>, which states the identical rng<191, ~74.6% formula); `[verified: 2 sources]` for Flee's guaranteed full-party escape (decompile target type + wiki Rank page note "Flee is guaranteed to finish the battle").
Fleeing/escaping forfeits all battle rewards unless an enemy was already defeated. Boss formations disable both. `[verified: 2 sources]`

### 1.9 Preemptive / Normal / Ambush

Roll `encounterRNG & 255` once at encounter start. With **Initiative** on any active party member, subtract 33 first.

| Result | Condition | Base chance | With Initiative |
|---|---|---:|---:|
| Preemptive | roll < 32 | 32/256 = **12.5 %** | 65/256 = **25.4 %** |
| Normal | 32 ≤ roll < 223 | 74.6 % | 74.6 % |
| Ambush | roll ≥ 223 | 12.5 % | **0 %** |

`[verified: 2 sources]` (decompile `events/encounter.py::_get_condition`; wiki battle-system page states 12.5 %/12.5 % and "Initiative → 25 % preemptive, ambushes eliminated"; independently corroborated by a second, distinct wiki page <https://finalfantasy.fandom.com/wiki/First_Strike_(ability)> giving the same 12.5%/12.5% without Initiative and 25%/0% with Initiative).

Initial CTB values (`ICV`):

| Condition | Party members | Enemies |
|---|---|---|
| **Preemptive** | `ctb = 0` (all act first) | `ctb = baseCTB × 3` |
| **Normal** | `ctb = baseCTB × 3 − (rng % (ICV_VARIANCE[AGI] + 1))`, then halved if already Hasted. Characters with **First Strike** keep `ctb = 0`. | `ctb = floor(baseCTB × 3 × 100 / (100 − rng%11))` — i.e. 0–10 % *slower* than nominal |
| **Ambush** | `ctb = baseCTB × 3` (halved if Hasted); **First Strike characters stay at 0** | `ctb = 0` |

`[single source]` (decompile `events/encounter.py`). Three enemies always ambush regardless of Initiative (Great Malboro in Omega Ruins/Nucleus/Arena, Malboro Menace, first Dark Yojimbo). `[single source]`

#### `ICV_VARIANCE` — the second 256-entry table (now transcribed)

`ICV_VARIANCE` is indexed by Agility exactly like `ICV_BASE` and yields the **exclusive upper bound of the opening jitter**: a party member's normal-condition start is `ctb = baseCTB × 3 − (rng % (ICV_VARIANCE[AGI] + 1))`, so the subtraction is a uniform integer in `[0, ICV_VARIANCE[AGI]]`.

The table is not arbitrary: it is **constant on each `ICV_BASE` plateau and counts position within that plateau**, capped at 9. Reproducing the run structure below is bit-exact with `constants.py` — verified by parsing the pinned file and diffing all 256 entries. `[verified: 2 sources]` (decompile `constants.py::ICV_VARIANCE`, transcribed at the pinned commit; structure independently re-derived from `ICV_BASE` plateaus)

| Agility range | `ICV_BASE` | Plateau length | `ICV_VARIANCE` over the range | Group size |
|---|---:|---:|---|---:|
| 0 | 28 | — | **0** (no jitter at all) | — |
| 1 | 28 | 2 | 1 | 1 |
| 2 | 26 | 1 | 1 | 1 |
| 3 | 24 | 1 | 1 | 1 |
| 4 | 20 | 1 | 1 | 1 |
| 5–6 | 16 | 2 | 1, 2 | 1 |
| 7–9 | 15 | 3 | 1, 2, 3 | 1 |
| 10–11 | 14 | 2 | 1, 2 | 1 |
| 12–14 | 13 | 3 | 1, 2, 3 | 1 |
| 15–16 | 12 | 2 | 1, 2 | 1 |
| 17–18 | 11 | 2 | 1, 2 | 1 |
| 19–22 | 10 | 4 | 1, 2, 3, 4 | 1 |
| 23–28 | 9 | 6 | 1 … 6 | 1 |
| 29–34 | 8 | 6 | 1 … 6 | 1 |
| 35–43 | 7 | 9 | 1 … 9 | 1 |
| 44–61 | 6 | 18 | 1,1, 2,2, … 9,9 | 2 |
| 62–97 | 5 | 36 | 1×4, 2×4, … 9×4 | 4 |
| 98–169 | 4 | 72 | 1×8, 2×8, … 9×8 | 8 |
| 170–255 | 3 | 86 | 1×16, 2×16, 3×16, 4×16, 5×16, **6×6** (table ends) | 16 |

Equivalent generator (produces all 256 entries exactly):

```ts
// runStart = lowest AGI sharing this ICV_BASE value; groupSize per the table above
ICV_VARIANCE[agi] = (agi === 0) ? 0
                  : Math.floor((agi - runStart) / groupSize) + 1;   // never exceeds 9
```

**Practical consequences for opening order** `[estimate]` (computed from the table):
* At AGI 0 the opening CTB is deterministic (`84`, no jitter).
* Realistic party Agility (10–40) draws jitter from `[0, 1]` up to `[0, 9]` ticks against a nominal opening CTB of `baseCTB × 3` = 39 (AGI 10) down to 21 (AGI 35–43) — i.e. **jitter is worth up to ~40 % of the opening counter at high Agility** and is the main reason opening orders are not fixed.
* The last plateau (AGI ≥ 170) tops out at 6, not 9, purely because the 256-entry table runs out mid-plateau. This is a data-table artefact, not a designed rule — **reproduce it anyway** if you want RNG-exact openings.

The earlier suggestion in this document that "a small uniform jitter of 0–`ICV_VARIANCE[AGI]`" could stand in for the table was circular and has been removed; the table above *is* the missing data. This closes the question **ffx-seymour-flux.md §9 C-7** deferred back to this chapter.

---

## 2. Damage formulas

All arithmetic below is **integer** with `//` = floor-toward-negative-infinity (Python semantics; the negative-constant steps genuinely rely on this). Source for every step: `ffx_rng_tracker/events/character_action.py::get_damage`, `_get_power`, `_get_mitigation` at the pinned commit. `[single source]` for the exact bit-level chain; `[verified: 2 sources]` for the algebraically-equivalent classic forms, which match the SinirothX FAQ / Fandom formulation.

### 2.1 Shared skeleton

```
POWER      = f(formula, DmgCon, offensiveStat)          // §2.2
MITIGATION = g(defensiveStat)                           // §2.3

d1 = POWER * MITIGATION
d2 = (d1 * -1282606671) // 0xFFFFFFFF                   // ≈ -0.298629 * d1
d3 = ((d1 + d2) // 0x200) * (15 - defensiveBuffs)       // 0x200 = 512
d4 = (d3 * -2004318071) // 0xFFFFFFFF                   // ≈ -0.466667 * d3
dmg = (d3 + d4) // 8

if formula in {Strength, PiercingStrength, SpecialMagic}:
    dmg = dmg * DmgCon // 16
dmg = dmg * (damageRNG + 240) // 256                    // damageRNG ∈ [0,31]
```

Algebraically this is **`dmg ≈ POWER × MITIGATION / 730 × (15 − defensiveBuffs)/15`**, then `× DmgCon/16` for Strength/Special-Magic formulas, then the variance term. `[estimate]` for the simplification; use the integer chain for parity.

* `defensiveBuffs` = the **target's** Cheer stacks for Strength formulas, the target's **Focus** stacks for Magic / Special Magic / **Healing** formulas. (Yes — Focus on an ally reduces healing received. `[single source]`)
* **Variance**: `damageRNG` is a uniform integer 0–31, so the multiplier ranges **×240/256 = 0.9375** to **×271/256 = 1.0586**. `damageRNG = 16` gives exactly ×1.0 — use 16 for deterministic fixtures. This is a **32-step discrete roll, not a continuous ±12 % band.** `[verified: 2 sources]` — independently corroborated by <https://grayfox96.github.io/FFX-Info/rng/damage-crit-escape-icv>, which states "damage rng = rng value MOD 31" and "damage roll = damage rng + 240", matching the doc's formula exactly.

### 2.2 POWER by formula

| `DamageFormula` | POWER | Offensive stat | Used by |
|---|---|---|---|
| `Strength` (1) | `(stat³ // 32) + 30` | STR + Cheer stacks | Attack, all Skills, most Overdrives, aeon specials |
| `Piercing Strength` (2) | same | STR + Cheer | ignores Defense (treats DEF as 0) |
| `Magic` (3) | `(stat² // 6 + DmgCon) * DmgCon // 4` | MAG + Focus stacks | all Blk/Wht offensive magic, Lulu's Fury |
| `Piercing Magic` (4) | same | MAG + Focus | treats MDef as 0 |
| `Special Magic` (15) | `(stat³ // 32) + 30`, **then × DmgCon/16**, **and MDef is always 0** | MAG + Focus | all aeon Overdrives, Fire Breath, Aqua Breath, Nova, Anima's Pain |
| `Healing` (7) | `((stat + DmgCon) // 2) * DmgCon` | MAG + Focus | Cure/Cura/Curaga, Pray, White Wind |

The `// 6` step is literally `(stat² * 0x2AAAAAAB) // 0xFFFFFFFF`; the `// 32` + `30` step is literally `(stat³ // 0x20) + 0x1E`. **The frequently-quoted "+32" from older FAQs is wrong for this build — the constant is 0x1E = 30.** `[verified: 2 sources]` — a GameFAQs Q&A (gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/answers/573062) independently confirms the classic guide formula is `[(Str³/32)+32]`, corroborating that the "+32" form is the widely-circulated guide value the decompile's "+30" corrects. See §11 C5.

Non-stat formulas:

| `DamageFormula` | Damage |
|---|---|
| `Fixed` (9) | `DmgCon * 50 * (rng + 240) // 256` |
| `Fixed (no variance)` (6) | `DmgCon * 50` |
| `Percentage Total` (8) | `targetMaxHP * DmgCon // 16` (or MaxMP for the MP pool) |
| `Percentage Current` (5) | `targetCurrentHP * DmgCon // 16` |
| `HP` (16) | `userMaxHP * DmgCon // 10` (Kimahri's Self-Destruct: DmgCon 30 → 3× his max HP) |
| `CTB` (13) | `targetCTB * DmgCon // 16`, applied to the CTB pool |
| `Gil` (21) | `gilSpent // 10` (Spare Change) |
| `Deal 9999` (23) | `9999 * DmgCon` (Sunburst: DmgCon 2 → **19 998**) |

`immune_to_percentage_damage` enemies take 0 from `Percentage Total`/`Percentage Current`. `[single source]`

### 2.3 MITIGATION (DefNum) from Defense / Magic Defense

```
m1 = defStat * defStat
m1 = (m1 * 0x2E8BA2E9) // 0xFFFFFFFF        // ≈ defStat² * 2/11
m1 = m1 // 2
m  = (defStat * 0x33) - m1                  // 0x33 = 51
m  = (m * 0x66666667) // 0xFFFFFFFF         // ≈ 0.4
MITIGATION = 0x2DA - (m // 4)               // 0x2DA = 730
```

The classic published form `DefNum = floor((Def − 280.4)² / 110) + 16` matches this **for 230 of 256 Defense values and is off by exactly 1 for the other 26** (e.g. Def 12, 18, 25, 32, 34, 48, 54, 67, 165, 176, 182, 186, 192, 204, 210, 214, 220–222, 229…). Use the integer chain. `[verified: 2 sources]` with the ±1 caveat measured by me `[estimate]`.

Reference values:

| Def/MDef | 0 | 1 | 5 | 10 | 20 | 30 | 40 | 50 | 60 | 80 | 100 | 150 | 200 | 255 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| MITIGATION | 730 | 725 | 705 | 680 | 632 | 586 | 541 | 498 | 457 | 381 | 311 | 170 | 74 | 21 |

Defense is floored at **1** for the Strength formula (`max(DEF,1)`), and set to **0** when the target has **Armor Break** or the action is `Piercing Strength`. Magic Defense likewise floored at 1, zeroed by **Mental Break** or `Piercing Magic`, and always 0 for `Special Magic`. `[single source]`

### 2.4 Post-formula modifier order (apply exactly in this order)

| # | Modifier | Effect |
|---:|---|---|
| 0 | Target `immune_to_damage` / `immune_to_physical` / `immune_to_magical` | return 0 |
| 1 | **Critical hit** | `dmg × 2` |
| 2 | Target has **Boost** (aeon stance) | `int(dmg × 1.5)` |
| 3 | Target has **Shield** (aeon stance) | `dmg // 4` |
| 4 | **Elemental affinity** | see §3 |
| 5 | Physical only | Target Protect `//2`; user Berserk `×1.5`; user Power Break `//2`; target Defend `//2` |
| 6 | Magical only | user Magic Booster `×1.5`; target Shell `//2`; user Magic Break `//2` |
| 7 | **Alchemy** (user) on healing items | `dmg × 2` |
| 8 | Offensive % auto-abilities | `dmg = dmg + dmg*bonus//100` — **Strength +x%** on physical only, **Magic +x%** on magical only |
| 9 | Defensive % auto-abilities | `dmg = dmg − dmg*bonus//100` — **Defense +x%** vs physical, **Magic Def +x%** vs magical |
| 10 | **Armored** target | `dmg // 3` unless user has **Piercing**, or the action has `ignores_armored`, or target has **Armor Break** |
| 11 | Drain sign | if user has Zombie → `× −1`; if target has Zombie → `× −1` (both Zombie ⇒ normal) |
| 12 | Overdrive timing bonus | `dmg += dmg * timeRemainingMs // (timerMs*2)` — see §5.2 |
| 13 | **Damage limit** | `min(dmg, 9999)` normally; `99999` if the action has `always_break_damage_limit` **or** the user has **Break Damage Limit**; forced `9999` if the action has `never_break_damage_limit` (all items, Mega Phoenix/Megalixir mixes) |
| 14 | Heal sign | if action `heals` and target is **not** Zombie → `× −1` (negative damage = healing) |
| 15 | **Damage 9999** status (Trio of 9999 / Quartet of 9) | clamp any value in `[0,9999]` to 9999 and any in `[−9999,−1]` to −9999 |

**Critical note for an "Other"-damage engine:** every character Overdrive and every Mix has damage type **Other**, so steps 5, 6, 8 and 9 do **not** apply to them — Overdrives ignore Protect, Shell, Strength +20 %, Magic +20 %, Power Break and Magic Break entirely. `[verified: 2 sources]` (decompile `damage_type`; wiki Overdrive page: "their power cannot be boosted by Str+% or Mag+% abilities, and they ignore targets' Shell and Protect").

### 2.5 Physical attack: worked reference table

Standard **Attack** (CSV row 0): formula `Strength`, type **Physical**, DmgCon 16, 1 hit, crit-eligible, uses weapon properties, affected by Darkness. Values below are with `damageRNG = 16` (×1.00), no crit, no buffs, non-armored target.

| STR \ DEF | 0 | 20 | 50 | 100 | 200 |
|---:|---:|---:|---:|---:|---:|
| 20 | 280 | 242 | 191 | 119 | 28 |
| 40 | 2 030 | 1 757 | 1 384 | 864 | 205 |
| 80 | 16 030 → 9 999 | 13 878 → 9 999 | 10 935 → 9 999 | 6 829 | 1 624 |
| 120 | 54 030 | 46 776 | 36 858 | 23 018 | 5 477 |
| 180 | 182 280 | 157 809 | 124 349 | 77 656 | 18 477 |
| 255 | 518 197 | 448 630 | 353 509 | 220 766 | 52 529 |

(→ 9 999 marks where the default cap bites; with Break Damage Limit the cap is 99 999.) `[estimate]` — computed by me by executing the pinned decompile's own functions.

### 2.6 Magic: worked reference table (damage at rng 16, no Shell)

`Magic` formula, type **Magical**. Tier DmgCon values: **Fire/Blizzard/Thunder/Water = 12**, **-ra tier = 24**, **-ga tier = 42**, **Drain = 20**, **Osmose = 10**, **Flare = 60**, **Ultima = 70**, **Holy = 100**.

| MAG | MDef | Fire 12 | Fira 24 | Firaga 42 | Drain 20 | Osmose 10 | Flare 60 | Ultima 70 | Holy 100 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 20 | 0 | 234 | 540 | 1 134 | 430 | 190 | 1 890 | 2 380 | 4 150 |
| 40 | 0 | 834 | 1 740 | 3 234 | 1 430 | 690 | 4 890 | 5 880 | 9 150 |
| 40 | 50 | 568 | 1 187 | 2 206 | 975 | 470 | 3 335 | 4 011 | 6 242 |
| 80 | 0 | 3 234 | 6 540 | 11 634 | 5 430 | 2 690 | 16 890 | 19 880 | 29 150 |
| 80 | 50 | 2 206 | 4 461 | 7 936 | 3 704 | 1 835 | 11 522 | 13 561 | 19 885 |
| 120 | 100 | 3 082 | 6 196 | 10 923 | 5 154 | 2 566 | 15 720 | 18 415 | 26 626 |
| 255 | 0 | 32 547 | 65 166 | 114 229 | 54 285 | 27 117 | 163 455 | 190 872 | 273 425 |

`[estimate]` — computed from the decompiled functions.

### 2.7 Special / fixed formulas

| Ability | Row | Formula | DmgCon | Result |
|---|---:|---|---:|---|
| **Demi** | 78 | Percentage Current | 4 | 25 % of current HP, all enemies, type Magical, no MDef reduction, Reflect-immune (party-wide target) |
| **Nega Burst** (Mix) | 169 | Percentage Current | 12 | 75 % of current HP |
| **Black Hole** (Mix) | 170 | Percentage Current | 15 | 93.75 % of current HP |
| **Shadow Gem** (item) | i41 | Percentage Current | 8 | 50 % of current HP |
| **Absorb**-type enemy moves | — | Percentage Total | 8 | 50 % of **maximum** HP (this is the correction to Moonpetal's `hp/2` bug) |
| **Drain** | 80 | Magic | 20 | HP damage; `drains` → user gains the same amount. Zombie on either side flips the sign |
| **Osmose** | 81 | Magic (MP pool) | 10 | MP damage, `drains`, 0 MP cost, rank 2 |
| **Lancet** | 32 | Magic | 6 | **Both** HP and MP pools drained, damage type **Other** (so Shell does not apply), ignores Armored, rank 2, 0 MP. Also learns a Ronso Rage when the target has one |
| **Death** | 79 | Magic (0 damage) | 0 | `Death` status at chance **80/101**; reflectable |
| **Death #2** (enemy/Zanmato) | 288 | — | — | `Death` at chance **255** = ignores all resistance |
| **Holy** | 63 | Magic | 100 | Holy element, rank 4, 85 MP, shatter 100 |
| **Ultima** | 83 | Magic | 70 | rank 6, 90 MP, targets whole enemy party, **not** reflectable |
| **Flare** | 82 | Magic | 60 | rank 5, 54 MP, single target, reflectable |
| **Sunburst** (Mix) | 171 | Deal 9999 | 2 | flat **19 998** to all enemies, `always_break_damage_limit` |
| **Spare Change** | 36 | Gil | 1 | `gilThrown // 10`, `never_break_damage_limit` (hard 9 999 cap) |
| **Self-Destruct** | 107 | HP | 30 | `userMaxHP × 30 // 10` = 3× Kimahri's max HP; `destroys_user` → Kimahri is Ejected |

### 2.8 Healing

`Healing` formula, POWER = `((MAG + Focus + DmgCon) // 2) * DmgCon`, MITIGATION = 730 (no defensive stat), so **healing = POWER × (15 − targetFocus)/15 × (rng+240)/256**.

| MAG | Pray (8) | Cure (24) | Cura (40) | Curaga (80) / White Wind (40 → see note) |
|---:|---:|---:|---:|---:|
| 20 | 112 | 528 | 1 200 | 4 000 |
| 40 | 192 | 768 | 1 600 | 4 800 |
| 60 | 272 | 1 008 | 2 000 | 5 600 |
| 80 | 352 | 1 248 | 2 400 | 6 400 |
| 120 | 512 | 1 728 | 3 200 | 8 000 |
| 180 | 752 | 2 448 | 4 400 | 10 400 → 9 999 |
| 255 | 1 048 | 3 336 | 5 880 | 13 360 → 9 999 |

White Wind (row 112) uses `Healing` DmgCon **40**, type Other, party-wide — i.e. the Cura column. `[estimate]` computed from the decompile. Guides describe White Wind as "restores ½ HP"; the record says it is a MAG-scaled Cura-strength party heal. `[single source]` conflict noted in §11 C7.

Healing items use `Fixed (no variance)` or `Percentage Total` and do **not** scale with MAG:

| Item | Formula | DmgCon | Restores |
|---|---|---:|---|
| Potion | Fixed-no-var | 4 | 200 HP |
| Hi-Potion | Fixed-no-var | 20 | 1 000 HP |
| X-Potion | %Total | 16 | 100 % max HP |
| Mega-Potion | Fixed-no-var | 40 | 2 000 HP, whole party |
| Ether | Fixed-no-var | 2 | 100 MP |
| Turbo Ether | Fixed-no-var | 10 | 500 MP |
| Elixir | %Total | 16 | 100 % HP + 100 % MP, one ally |
| Megalixir | %Total | 16 | 100 % HP + MP, party |
| Phoenix Down | %Total | 8 | **50 %** max HP, revive only |
| Mega Phoenix | %Total | 16 | **100 %** max HP, revive only, party |
| Al Bhed Potion | Fixed-no-var | 20 | 1 000 HP party + cures Petrify/Poison/Silence |
| Healing Water | %Total | 16 | 100 % HP, party |
| Tetra Elemental | %Total | 16 | 100 % HP + all four Nul statuses, one ally |

All items carry `never_break_damage_limit` → hard-capped at 9 999 even with Break Damage Limit. `[verified: 2 sources]`

### 2.9 Cheer / Focus / Aim / Reflex / Luck / Jinx (stacking)

All six are rank-2, 0-MP, party-wide `Special` commands (rows 26–31) that add **+1 stack**, capped at **5**. `[verified: 2 sources]`

| Buff | Offensive effect | Defensive effect |
|---|---|---|
| **Cheer** | `+1 Strength` per stack (added to the offensive stat before cubing) | Physical damage received × `(15 − stacks)/15` → **−33.3 % at 5 stacks** |
| **Focus** | `+1 Magic` per stack | Magical / Special-Magic damage received × `(15 − stacks)/15`; **also reduces healing received** |
| **Aim** | `+10` to hit chance per stack | — |
| **Reflex** | — | `−10` to the attacker's hit chance per stack (i.e. +10 % evade) `[verified: 2 sources]` (independently corroborated by <https://grayfox96.github.io/FFX-Info/rng/hit-chance>, which states verbatim "every aim on the user adds 10 to hit chance" and "every reflex on the target subtracts 10 from hit chance") |
| **Luck** | `+1` to hit chance per stack **and +10** to critical chance per stack | — |
| **Jinx** | `+1` to attackers' hit chance against the target per stack, and `−10` to the target's effective Luck for **crit** purposes (so +10 % crit against them) per stack | — |

The wiki says Luck "increases hit accuracy and critical hit rate by 1 % each"; the decompiled code gives **+1 hit, +10 crit**. See §11 C6. `[single source]` for the +10 crit figure.
Buffs are cleared by KO but **survive Petrification**. `[single source]`

### 2.10 Break statuses

| Status | Exact effect | Applied by |
|---|---|---|
| **Power Break** | The **user's** physical damage is halved (`//2`, step 5) | Power Break (r4, 8 MP), Full Break, Banishing Blade, Break Shot, Calamity Bomb/Chaos Grenade/Abaddon-class mixes |
| **Magic Break** | The user's **magical** damage is halved | Magic Break (r4, 8 MP), Full Break, … |
| **Armor Break** | Target's **Defense treated as 0** *and* the Armored `//3` is cancelled | Armor Break (r4, 12 MP), Frag Grenade, Full Break, … |
| **Mental Break** | Target's **Magic Defense treated as 0** | Mental Break (r4, 12 MP), Full Break, … |

All four are permanent (stack byte 254) for the battle, removable only by **Dispel**, and there is **no armour ward/proof** against them. Ribbon does **not** block them. `[verified: 2 sources]`
Application chance is **100** for the individual Break skills and Full Break; **254** (unconditional, bypasses resistance) for Banishing Blade and Break Shot; **50** for the Abaddon/Krysta/Thunderblast/Dark Rain/Calamity Bomb mixes; **150** for Chaos Grenade. `[single source]`

### 2.11 Accuracy / Evasion / hit chance

```
if action.hitFormula == ALWAYS or target has Sleep or Petrify:  HIT
else:
  hitRoll = rng % 101                                  // 0..100
  // 1. base from the accuracy table (only for uses_hit_chance_table actions)
  raw = ACC                        // or ACC*5//2, ACC*3//2, ACC//2 per action
  raw = floor(raw * 0.4)                               // only 40% of Accuracy counts
  idx = clamp(raw - targetEVA + 10, 0, 8)
  base = HIT_CHANCE_TABLE[idx]     // (25, 30, 30, 40, 40, 50, 60, 80, 100)
  // ...or, for USE_ACTION_ACCURACY actions:
  // base = action.accuracy - targetEVA
  // 2. Darkness
  if action.affectedByDark and user has Dark:
      base = floor(base * 0.4) // 4                    // ⇒ base/10
  // 3. Luck / buffs
  chance = base + userLuck - max(targetLuck,1) + userLuckStacks
                + targetJinxStacks + 10*(userAim - targetReflex)
  HIT if chance > hitRoll
```
`[verified: 2 sources]` (decompile `_get_hits`; wiki stats page confirms "only 40 % of their accuracy is used", "Aim/Reflex each cast (up to 5) enhances… by 10 %", "Darkness overrides Accuracy and Evasion… lowers to 10 %"; independently corroborated by <https://grayfox96.github.io/FFX-Info/rng/hit-chance>, which states the identical `accuracy*2//5` (~40%) formula and the identical table (25,30,30,40,40,50,60,80,100) with the same index formula).

* Enemy Accuracy is **never used** — enemy abilities carry their own `accuracy` byte and use the `USE_ACTION_ACCURACY` branch. `[verified: 2 sources]`
* A Darkness-blinded attacker whose Luck exceeds the target's by ≥ 90 fully cancels Darkness. `[single source]` (wiki)
* Aeon `Attack` variants use the `Accuracy × 2.5` (Valefor, Shiva) or `Accuracy × 1.5` (Ifrit, Ixion, Bahamut, Anima) hit formulas. `[single source]`

### 2.12 Critical hits and Luck

```
if not action.canCrit: no crit
critRoll = rng % 101
if user has the Critical status (Hero Drink / Miracle Drink): ALWAYS crit
critChance = (userLuck + 10*userLuckStacks + (equipmentCrit or action.bonusCrit))
           - (max(targetLuck,1) - 10*targetJinxStacks)
crit if critRoll < critChance
```
`equipmentCrit` = weapon `bonus_crit` + armor `bonus_crit`, used when the action has `adds_equipment_crit` (Attack and all weapon-property Skills); otherwise the action's own `bonus_crit` byte is used. A crit **doubles** damage (step 1 of §2.4). `[verified: 2 sources]` — the base `critChance = userLuck − targetLuck` (+equipment bonus when applicable) relationship is independently corroborated by <https://grayfox96.github.io/FFX-Info/rng/damage-crit-escape-icv> ("crit chance = user luck - target luck", equipment bonus added when the action uses equipment bonuses); the Luck-stack and Jinx-stack multipliers remain `[single source]` (not visible in that page's summary).

### 2.13 Damage cap and Break Damage Limit

* Default cap: **9 999** for damage *and* healing.
* **Break Damage Limit** (weapon auto-ability) raises the user's cap to **99 999**. All Celestial Weapons carry it. It does **not** raise item caps or most Mix caps, because those actions carry `never_break_damage_limit`. `[verified: 2 sources]`
* Actions with `always_break_damage_limit` ignore the user's equipment entirely: **Mega Flare** (Bahamut), **Oblivion** (Anima), **Sunburst**, **Final Elixir**, **Dark Matter**.
* Actions with `never_break_damage_limit`: every item, Spare Change, Mix Mega Phoenix, Mix Elixir, Mix Megalixir.
* The cap is applied **after** all multipliers and **before** the heal sign flip, so healing is capped at 9 999 too unless the healer has Break Damage Limit (and the action doesn't force the cap).

---

## 3. Elements and affinities

Five elements: **Fire, Ice, Thunder, Water, Holy**. `[verified: 2 sources]`

| Affinity | Multiplier |
|---|---:|
| Weak | **×1.5** |
| Neutral | ×1.0 |
| Resists | **×0.5** |
| Immune | **×0.0** |
| Absorbs | **×−1.0** (heals the target for the damage amount) |

Source: decompile `constants.py::ELEMENTAL_AFFINITY_MODIFIERS`. `[verified: 2 sources]`

**Multi-element resolution** (`get_element_mods`): take the **single strongest** affinity among the attack's elements; the one exception is that if the target is Weak to more than one of the elements, **each** ×1.5 is applied multiplicatively (so double-weak = ×2.25). `[single source]`

**Nul statuses beat everything.** If the attack's element set is fully covered by Nul statuses on the target, the attack **misses entirely** (0 damage, no status), and one stack of each relevant Nul is consumed. This happens *before* affinity is consulted, so NulBlaze prevents Ifrit / a Fire-Eater character from absorbing fire. `[verified: 2 sources]`

| Element | Nul status | Ward ability (→ Resists) | Proof (→ Immune) | Eater (→ Absorbs) | Strike (weapon adds element) |
|---|---|---|---|---|---|
| Fire | NulBlaze | Fire Ward | Fireproof | Fire Eater | Firestrike |
| Ice | NulFrost | Ice Ward | Iceproof | Ice Eater | Icestrike |
| Thunder | NulShock | Lightning Ward | Lightningproof | Lightning Eater | Lightningstrike |
| Water | NulTide | Water Ward | Waterproof | Water Eater | Waterstrike |
| Holy | — | — | — | — | — |

`[verified: 2 sources]` (decompile `autoabilities.py`; wiki auto-ability list).
A Zombie character **can** be healed by an absorbed elemental hit (the absorb sign flip happens at step 4, the Zombie heal flip at step 14, so absorbed damage stays negative = healing). `[single source]`

---

## 4. Status effects

### 4.1 Application model

```
if status already present:                     skip (no refresh, no stacking)
if applying Haste while Slow.stacks >= 255:    skip (and vice versa)
statusRoll = rng % 101                         // skipped for "no-RNG" statuses
resistance = target.statusResistances[status]  // 0 default, 50 = Ward, 255 = Proof/immune
if chance == 255:                    applied      // ignores immunity entirely
elif resistance == 255:              blocked
elif chance == 254:                  applied      // guaranteed, but immunity still blocks
elif (chance - resistance) > roll:   applied
else:                                blocked
```
**Resistance subtracts, it does not multiply** — a 50-resistance Ward completely blocks a chance-50 application. `[verified: 2 sources]` (decompile `_get_statuses`; wiki: "Status resistance values are subtracted from infliction chances, rather than multiplied by"; independently corroborated by <https://grayfox96.github.io/FFX-Info/rng/status-chance>, which states the identical rule set: "status chance = landing chance − target resistance", chance 255 always applies, 254 applies but is still blocked by 255 immunity, and 255 resistance grants full immunity).

Stack byte = **duration in the victim's own turns** for the timed statuses; `254` means "until end of battle"; `255` means permanent/undispellable.
Only **Sleep, Silence, Darkness, Slow, Regen** (`DURATION_STATUSES`) tick down, by 1 at the **end of the victim's own action**. Haste from a spell is 254 (battle-long). `[verified: 2 sources]`

Touch/Strike weapon abilities: **Touch = 50 % chance**, **Strike = 100 %**; both on the same weapon stack additively to **150 %** (useful against partially-resistant enemies). `[verified: 2 sources]`

### 4.2 Full status table

| Status | Exact effect | Typical duration | Cured by | Prevented by |
|---|---|---|---|---|
| **Death / KO** | HP = 0, cannot act. Whole active party KO'd/petrified/ejected = Game Over | until revived | Life, Full-Life, Phoenix Down, Mega Phoenix, Auto-Life, Full/Final Elixir, Final Phoenix | Deathproof (255), Death Ward (50) |
| **Zombie** | All HP-restoring effects **damage** instead. Life/Full-Life/Phoenix Down/Mega Phoenix **instantly kill** a living Zombie. Drain/Osmose/Lancet reverse sign. Greatly raises resistance to ordinary instant death (but not to chance-255 Death, nor Doom) | 254 (battle) | **Holy Water, Remedy, Panacea, Ultra Cure, Super/Final Elixir. NOT Esuna.** | Zombieproof / Zombie Ward / Ribbon |
| **Petrify** | Cannot act; all other statuses are **wiped** on petrification (buffs like Cheer survive); CTB counter is **not** reset. A physical hit afterwards **shatters** (chance = action `shatter_chance`, 0–100) → Eject. Enemies and any underwater unit shatter immediately | 254 | Soft, Remedy, Esuna, Panacea | Stoneproof / Stone Ward / Ribbon |
| **Poison** | At the **end of the victim's own turn**, lose `maxHP // 4` = **25 %** (characters). Enemies use a per-monster percentage. Applies even while asleep or skipping | 254 | Antidote, Esuna, Remedy, Panacea | Poisonproof / Poison Ward / Ribbon |
| **Silence** | Blocks Wht Magic, Blk Magic and Summon. Does **not** block Fury or Grand Summon (Overdrives are never silenced) | usually 3 turns (Silence Attack/Buster: 3/1) | Echo Screen, Esuna, Remedy | Silenceproof / Silence Ward / Ribbon |
| **Sleep** | Cannot act. **Attacks against a sleeper always hit.** Physical damage wakes; magic does not. Poison and Doom still tick | 3 turns (Sleep Attack), 1 (Sleep Buster), 5 (Sleeping Powder), 8 (Dream Powder), 10 (Bad Breath) | Esuna, Remedy, physical hit | Sleepproof / Sleep Ward / Ribbon |
| **Darkness** | Overrides Accuracy/Evasion: physical hit chance becomes **base/10 (≈10 %)** before Luck | 3 turns (Dark Attack), 1 (Dark Buster), 8 (Smoke Bomb), 10 (Bad Breath) | Eye Drops, Esuna, Remedy | Darkproof / Dark Ward / Ribbon |
| **Slow** | Recovery `× 2`; on application also **adds 100 % of current CTB**. Mutually exclusive with Haste | 254 | Haste, Esuna, Remedy, Dispel | Slowproof / Slow Ward (Auto-Haste = immune) |
| **Haste** | Recovery `floor(/2)`; on application **halves current CTB** | 254 (permanent from Auto-Haste) | Dispel, Slow, Aerospark, Purifying Salt | — |
| **Berserk** | Auto-attacks only; **all** damage dealt `× 1.5` | 254 | Esuna, Remedy, Panacea; Provoke and Threaten also clear it on enemies | Berserkproof / Berserk Ward / Ribbon |
| **Confuse** | Acts automatically, attacking a **random target — ally or enemy** (per the official manual). Physical damage cures it. Cancels Provoke. Not player-inflictable except via a reflected Confuse | 254 | Esuna, Remedy, Panacea, a physical hit | Confuseproof / Confuse Ward / Ribbon |
| **Doom** | Countdown shown over the head; decrements on the victim's turn (even asleep/skipped). At 0 → instant KO. **Party members: 5.** Enemies: varies, up to 255 | counter | **Nothing removes it.** Only Ribbon prevents it | Ribbon |
| **Curse** | Cannot use Overdrive and gauge cannot fill. One of the few things **aeons are not immune to** | 254 | **Dispel, Holy Water**, Panacea/Ultra Cure/Super & Final Elixir (flag) | Curseproof (Curse Ward exists but Curseproof is not its upgrade) |
| **Delay** | Not a status — a one-off push to the CTB counter (§1.5) | — | — | Threaten blocks further delay on enemies |
| **Provoke** | Forces the enemy to target the provoker. Clears Berserk and Confusion on that enemy. Cancelled by Confusion or Threaten | 254 | — | — |
| **Threaten** | Target cannot act **or counterattack** (can still evade). Lasts until the **user's** next turn, and the target's next turn is then scheduled **immediately after** the user's. Clears Berserk, Provoke, Haste, Slow, Confusion; blocks Haste/Slow/Delay on **both** user and target while active. Applying Provoke or Berserk to the target, or KO-ing the user, removes Threaten (a Provoke/Berserk application leaves the target's scheduled turn unchanged). **Decay rule: §4.4** | 1 user-turn | — | **Party members and aeons are innately immune (resistance 255)** |
| **Guard** | The user intercepts **all** single-target physical attacks aimed at the other two members | until the user's next turn | — | — |
| **Sentinel** | Guard **plus** Defend: intercepts and halves physical damage | until the user's next turn | — | — |
| **Defend** | Halves physical damage taken. Stacks with Protect | until next turn | — | — |
| **Protect** | Physical damage `//2` | 254 | Dispel, Purifying Salt, Aerospark | — |
| **Shell** | Magical damage **and magical healing** `//2` | 254 | Dispel, Purifying Salt, Aerospark | — |
| **Reflect** | Bounces one targeted spell to the opposite party. Works on Blk/Wht magic; **not** on party-wide spells (Demi, Ultima), **not** on Dispel or Auto-Life, **not** on items, **not** on Overdrives or Mixes | 254 | Dispel, Purifying Salt, Aerospark | — |
| **Regen** | At the **start of any unit's turn**: `HP += floor(elapsedTicks × maxHP / 256) + 100`. The **+100 is an unconditional addend, not a clamp** — see §4.3 | **10 turns** (Regen spell, Healing Spring); **20** (Super/Hyper Mighty G); infinite (Auto-Regen, SOS Regen, Right Arm's Mighty Guard) | Dispel, Aerospark, Purifying Salt, Condemn, Desperado, Dark Bahamut's Mega Flare, Dark Anima's Oblivion — **Auto-Regen cannot be removed** | — |
| **NulBlaze / NulFrost / NulShock / NulTide** | Nullify **one** attack of the matching element, consuming one stack. Beats Absorb | 1 charge (SOS-versions = permanent while in Critical) | Dispel, Aerospark, Purifying Salt | — |
| **Auto-Life** | On reaching 0 HP, auto-revive at **25 % max HP** (this is `Percentage Total` DmgCon 4 on CSV row 287, and it scales with the *caster's* Magic +% and Magic Booster). Consumed on use. Cannot be cast on a KO'd target. Prevents Game Over unless the wipe was petrification/eject/Giga-Graviton | until consumed | Dispel does **not** remove it | — |
| **Critical (SOS)** | Automatic while HP < **50 %** of max (25 % in the original Japanese build). Triggers SOS auto-abilities and Daredevil charging | dynamic | — | — |
| **Shield** (aeon) | All damage **and healing** `//4` (−75 %); no Overdrive gain this turn | until next turn | — | — |
| **Boost** (aeon) | All damage **and healing** `×1.5`; much faster Overdrive gain | until next turn | — | — |
| **Eject** | Removed from battle, counts as defeated. A bench member cannot fill the slot | permanent | — | Aeons immune (except Seymour's Banish) |
| **Scan** | Reveals HP/affinities/immunities | 254 | — | — |
| **MAX HP ×2 / MAX MP ×2 / MP = 0 / Damage 9999 / Critical / Overdrive ×1.5 / Overdrive ×2** | Mix & tonic enhancement flags. Not dispellable, but **removed by KO** (not by Petrification) | battle | — | — |

Cure-item coverage summary (decompiled `ffx_item.csv`):

| Item | Removes |
|---|---|
| Antidote | Poison |
| Soft | Petrify |
| Eye Drops | Darkness |
| Echo Screen | Silence |
| **Holy Water** | **Zombie + Curse** |
| **Remedy** | **Zombie**, Petrify, Poison, Confuse, Berserk, Sleep, Silence, Darkness, Slow (**not** Curse, **not** Death, **not** Doom, **not** Breaks) |
| Esuna (spell) | Petrify, Poison, Confuse, Berserk, Sleep, Silence, Darkness, Slow (**not Zombie**, not Curse, not Death, not Doom) |
| Dispel (spell) | 4× Break, Shell, Protect, Reflect, 4× Nul, Regen, Haste, **Curse** |
| Purifying Salt (item) | Shell, Protect, Reflect, 4× Nul, Regen, Haste — **plus 1 100 damage** |

`[verified: 2 sources]` — this is the exact point the Moonpetal audit flagged: **Esuna does not cure Zombie; Remedy does.** Confirmed both by the decompiled item/command records and by the official Square Enix HD manual.

---

### 4.3 Regen — tick schedule (and why it is NOT invented)

**Status correction.** This document previously tagged the Regen expression `[single source]` / "unverifiable", and `ffx-yunalesca.md` §15.2 defect #4 called the identical expression **"invented"**, instructing the implementer to replace it. **Both judgements were wrong.** The expression is present verbatim in the pinned decompile *and* is published independently by the Fandom wiki, which prints it as a formula rather than as prose:

> `[(Ticks passed x Max HP) / 256] + 100` — Fandom, *Regen (Final Fantasy X status)*, which adds "The minimum amount of HP restored is 100."

and in the decompile, `events/character_action.py` (the Auto-Regen catch-up branch used when a counter-action revives a character):

```python
target.current_hp += (int(self.gamestate.ctb_since_last_action
                          * (target.max_hp / 256))
                      + 100)
```

The two agree on the divisor (256), the operand (**max** HP, not current), the tick term, and the `+100`. **Tag upgraded to `[verified: 2 sources]`.** `ffx-yunalesca.md` §15.2 defect #4 should be struck, and §11's "still unverified" entry for Regen is withdrawn.

**Normative implementation**

```ts
// Fires at the START of ANY unit's turn, for every unit currently carrying Regen.
// elapsedTicks = CTB ticks since the previous turn boundary (the pink meter in the turn list).
function regenTick(u: Actor, elapsedTicks: number) {
  const amount = Math.floor(elapsedTicks * u.maxHP / 256) + 100;
  if (u.hasStatus(ZOMBIE) || u.isUndead) u.damage(amount);   // sign flips
  else u.heal(amount);
  u.regenTurnsRemaining -= 1;
}
```

| Property | Value | Confidence |
|---|---|---|
| Divisor | **256** | `[verified: 2 sources]` |
| HP operand | **max** HP, not current | `[verified: 2 sources]` |
| Unconditional addend | **+100** | `[verified: 2 sources]` |
| Trigger | start of **any** unit's turn, not only the carrier's | `[verified: 2 sources]` |
| Tick term | CTB ticks elapsed since the previous turn boundary | `[verified: 2 sources]` |
| Duration — Regen spell / Healing Spring | **10 turns** | `[verified: 2 sources]` |
| Duration — Super Mighty G / Hyper Mighty G | **20 turns** | `[verified: 2 sources]` |
| Duration — Auto-Regen / SOS Regen | infinite; Auto-Regen is **not Dispellable** | `[verified: 2 sources]` |
| May exceed the 99 999 display limit on million-HP enemies | yes | `[single source]` |
| Regen and **Poison** coexist on one target | yes | `[single source]` |
| Regen on **Zombie / undead** | **deals damage instead of healing** | `[verified: 2 sources]` |
| Rounding | decompile does a float multiply then truncates; at maxHP <= 9 999 identical to integer `//` | `[estimate]` |

**Higher Agility restores *less* per tick** (shorter gaps between turns, so a smaller `elapsedTicks`) but more often; total throughput still rises, because the `+100` is paid per boundary regardless. That is why the `+100` dominates for fast, low-HP actors and is negligible for slow, high-HP bosses. `[verified: 2 sources]`

**Behaviour on the turn Regen is cast** — previously listed as unverified, now resolved by the trigger rule: Regen fires at the *start* of a turn, and the cast resolves *during* a turn, so **the caster's own turn does not tick it**. The first tick lands at the start of the next unit's turn. Consequence: **a freshly-cast Regen always pays at least its +100 at the very next turn boundary**, and no more than that if the boundary is immediate. `[estimate]` — derived from the verified trigger rule; no source states the cast-turn case in so many words, so gate it behind a named flag.

**The Yunalesca interaction, fully specified** (this is the "weaponised Regen" that encounter depends on):
* Yunalesca carries the enemy ability *Regen*, granting Regen for **10 turns to one ally**; in phase 3 she uses it on **Zombie-d party members**, where the same expression runs with the sign flipped. `[verified: 2 sources]` (Fandom lists Yunalesca among the five enemies with the Regen enemy ability)
* Worked attrition on a Zombie: at maxHP 2 000 with a typical 20-tick turn boundary the tick is `floor(20 x 2000 / 256) + 100` = **256 HP**, and it fires on *every* unit's turn — with three party members plus Yunalesca that is roughly **1 000 HP per round**. The `+100` alone accounts for ~40 % of that, which is exactly why the clause is not cosmetic. `[estimate]` (worked from the verified formula)
* A **reflected** Regen lands on Yunalesca and **is Dispellable**: Regen is in Dispel's removal list (§4.2) and Yunalesca is not on the Regen-immune list (Magic Urn, Earth Eater, Braska's Final Aeon, Crane, Crawler, Extractor, Mortiphasm, Negator, Oblitzerator, Tanker, Yu Pagoda). `[verified: 2 sources]`
* **Braska's Final Aeon is Regen-immune**, so the BFA chapter must not build any Regen trick against him. `[single source]`

---

### 4.4 Threaten — the full infliction-chance model

Threaten does **not** use the shared status-application path of §4.1. It is the only status in the game with its own probability model. `[verified: 2 sources]` (Fandom *Threaten (status)* and *Threaten (ability)*, independently maintained pages that state the rule and print the resulting sequences)

```ts
// Per-enemy, per-battle state. Reset to the enemy's initial value at the start of every battle.
threatenChance: number      // a PERCENT, not a /255 byte; may legitimately exceed 100

function onThreatenAttempt(enemy): boolean {
  const roll = rng() % 100;
  if (roll < enemy.threatenChance) {
    applyThreaten(enemy);
    // ONLY a SUCCESS decays the chance:
    enemy.threatenChance = Math.max(1, Math.floor(enemy.threatenChance * 0.7));
    return true;
  }
  return false;               // a FAILURE changes nothing at all
}
```

Three rules that are easy to get wrong:
1. **Failure has no effect on the chance.** Only successes decay it.
2. The step is **x 0.7, floored**, with a **floor of 1 %** — not a fixed decrement.
3. The chance is a **percent that may exceed 100**; the 255 % tier needs four successes before it stops being certain.

**Initial chance by enemy** (every enemy not listed and not flagged immune uses 100 %):

| Initial | Enemies | Sequence over successive **successes** |
|---:|---|---|
| **255 %** | Sinspawn Echuilles, Extractor | 255, 178, 124, 86, 60, 42, 29, 20, 14, 9, 6, 4, 2, 1 |
| **100 %** | *default — every other non-immune enemy* | 100, 70, 49, 34, 23, 16, 11, 7, 4, 2, 1 |
| **80 %** | Bashura | 80, 56, 39, 27, 18, 12, 8, 5, 3, 2, 1 |
| **25 %** | Spherimorph, **Yunalesca** | 25, 17, 11, 7, 4, 2, 1 |
| **0 %** | flagged-immune enemies | never lands |

**Encounter-relevant readings:**
* **Yunalesca sits in the 25 % tier.** Threaten is a long-shot disruption in that fight, not a lockdown — after three successes it is already at 7 %. Any Yunalesca plan leaning on Threaten must be re-scoped. `[verified: 2 sources]`
* Against a default 100 % enemy, Auron gets roughly **4–5 reliable locks** before the chance falls under 25 %. Threaten is therefore a **tempo tool with a soft budget** — neither a permanent stun-lock nor a one-shot. That is the answer this gap asked for.
* **Reset condition: battle start only.** There is no in-battle reset; dismissing and re-summoning does not reset it.
* **Shiva's Heavenly Strike** carries Threaten at chance 100 (§6.3) and feeds the *same* per-enemy counter — an aeon Threaten and an Auron Threaten decay one shared value. Budget them together.
* Threaten also **blocks Delay** on the target (§1.5) and blocks Haste/Slow on *both* parties while active, so Threaten/Heavenly Strike do not stack with a delay plan — they replace it.
* Threaten is enemy-only in practice (§11 C12), so the party never needs this state.

---

## 5. Overdrive system

### 5.1 Gauge model and modes

Model the gauge as **0–100 points, where one point = one percent**; every character Overdrive has `od_cost = 100`. This unit is not a convention chosen here — the Fandom *Overdrive Mode* table, which states it is **"extracted from the game data"**, defines its Increment column as "how much each Overdrive mode charges the Overdrive gauge each time, **expressed as a percentage of the full charge**". Every coefficient below therefore yields **percent**, and the ambiguity flagged in the previous revision (are these gauge points out of 100?) is resolved: **yes, percent out of 100.** `[verified: 2 sources]`

Aeon Overdrives carry `od_cost = 20` in the data rather than 100 — see §6.6 for the aeon gauge model. `[single source]`

Overdrive damage is type **Other** (§2.4) and costs no MP. Silence does not block Fury or Grand Summon. Character Overdrives are neither physical nor magical but a third "special" category: **Str+% and Mag+% auto-abilities do not boost them, and they ignore the target's Protect and Shell.** `[verified: 2 sources]`

Auto-abilities on the gauge: **Double Overdrive ×2**, **Triple Overdrive ×3**, **SOS Overdrive** (charge only while in Critical, at a boosted rate), **Overdrive → AP** (gauge gain is converted to AP instead). `[verified: 2 sources]`
Mix enhancements: **Hot Spurs ×1.5** (party), **Eccentrick ×2** (party, stacks with Hot Spurs). `[verified: 2 sources]`

**Overdrive Modes.** Everyone starts on **Stoic**. A mode is learned by performing its trigger N times, with N per character. Fulfilling a learning condition **in the Monster Arena does not count**. Switching modes does not disturb the current gauge value. `[verified: 2 sources]`

The table below is **replaced wholesale** against the Fandom *Overdrive Mode* page, which publishes the values as game-data extracts. **The previous revision of this document contained three transcription errors, now corrected** (see §11 C13): the Victim row was a duplicate of the Sufferer row, and the Ally and Daredevil increments were the original-JP values rather than the baseline ones.

Column order below is the in-game party order: **Tidus / Yuna / Auron / Kimahri / Wakka / Lulu / Rikku**.

| Mode | Fill trigger | **Increment (percent of full gauge)** | Turns to learn (Ti / Yu / Au / Ki / Wa / Lu / Ri) |
|---|---|---|---|
| **Stoic** | user takes damage from an enemy | `damageReceived × 30 / maxHP` | *default* |
| **Warrior** | user damages an enemy (**not** via offensive items, **not** via Overdrives) | `damageInflicted × 10 / estimatedDamage`, **capped at 16** | 150 / 200 / 100 / 120 / 160 / 300 / 140 |
| **Comrade** | an ally takes damage | `damageReceived × 20 / target's maxHP` | 300 / 240 / 220 / 100 / 100 / 100 / 100 |
| **Healer** | user restores an ally's HP (**counts even at full HP**, and includes absorbing friendly elemental damage) | `healedAmount × 16 / target's maxHP` | 80 / 60 / 200 / 100 / 110 / 170 / 70 |
| **Tactician** | user inflicts a status ailment on an enemy | **16 %** | 75 / 100 / 110 / 60 / 80 / 75 / 90 |
| **Victim** | an enemy inflicts a status ailment on the user | **16 %** | 120 / 100 / 160 / 100 / 110 / 130 / 125 |
| **Dancer** | user evades an enemy attack | **16 %** | 250 / 200 / 200 / 130 / 200 / 300 / 200 |
| **Avenger** | an enemy KOs an ally | **30 %** | 100 / 80 / 120 / 100 / 100 / 150 / 90 |
| **Slayer** | user kills an enemy | **20 %** (**40 %** for Warrior Monk / Fallen Monk, whose weapons also count) | 100 / 110 / 80 / 120 / 90 / 130 / 100 |
| **Hero** | user kills an enemy with **≥ 10 000 HP, or ≥ 20× the estimated damage** | **20 %** | 50 / 50 / 40 / 45 / 50 / 70 / 50 |
| **Rook** | user reduces or nullifies enemy damage via NulBlaze / NulFrost / NulShock / NulTide / **Protect** / **Shell** / Reflect | **10 %** | 120 / 110 / 120 / 120 / 120 / 120 / 120 |
| **Victor** | user is in the **active** party when the battle is won | **20 %** | 120 / 150 / 200 / 120 / 160 / 200 / 140 |
| **Coward** | user Escapes (a **Flee** by anyone also counts) | **10 %** | 600 / 900 / 1000 / 700 / 400 / 980 / 450 |
| **Ally** | start of the user's turn | **3 %** *(4 % in the original JP PS2 — see §0 V6)* | 600 / 500 / 450 / 300 / 350 / 480 / 320 |
| **Sufferer** | start of the user's turn while afflicted | **16 %** | 100 / 80 / 120 / 130 / 100 / 110 / 90 |
| **Daredevil** | start of the user's turn while in **Critical** status | **5 %** *(16 % in the original JP PS2 — see §0 V7)* | 170 / 90 / 260 / 200 / 140 / 150 / 110 |
| **Loner** | start of the user's turn while the sole surviving/active member (allies KO'd, petrified, Ejected or escaped) | **16 %** | 60 / 180 / 35 / 90 / 110 / 45 / 170 |

`[verified: 2 sources]` for the whole table (Fandom *Overdrive Mode*, stated as game-data extracts, cross-checked against the Jegged and SuperCheats mode lists for triggers and against the prior revision of this document for the 13 rows that agree).

**Status-list definitions** (needed so Tactician/Victim/Sufferer are not guesses) `[verified: 2 sources]`:
* **Tactician counts:** Sleep, Silence, Darkness, Poison, Petrify, Slow, Zombie, Power/Magic/Armor/Mental Break, **Threaten**, **Provoke**, **Doom**.
* **Victim and Sufferer count:** Silence, Sleep, Doom, Darkness, Slow, Poison, Zombie, Confuse. (Note Breaks/Threaten/Provoke are *not* in this list — the two lists are deliberately different.)

#### `estimatedDamage` — defined, no longer an open term

The previously-undefined term in Warrior mode has an explicit definition in the same game-data extract:

> "Estimated damage is damage dealt by **Attack regardless of enemy Defense**. When **Magic is higher than Strength, it is used instead**."

```ts
// The reference figure the Warrior increment is measured against.
// Uses the §2.2 POWER chain with MITIGATION forced to the no-Defense case.
function estimatedDamage(user: Actor): number {
  const stat = user.magic > user.strength ? user.magic : user.strength;
  return damageFromPower(stat, /* DmgCon */ 16, /* DefNum for Defense 0 */ NO_DEFENSE);
}

// Warrior increment, in percent of the gauge:
gain = Math.min(16, Math.floor(damageInflicted * 10 / estimatedDamage(user)));
```

So Warrior pays **10 % of the gauge for a hit equal to your own undefended Attack**, and caps at 16 % however large the hit. A character whose Magic exceeds Strength (Lulu, Yuna) is measured against their *Magic*, which is why casters do not trivially cap Warrior with one big spell. `[verified: 2 sources]` for the definition; `[estimate]` for the `DmgCon 16` reading of "damage dealt by Attack" (16 is the Attack command's own DmgCon, §7).

The previous revision's formula `damageInflicted × 10 / estimatedDamage × 3, cap 16` carried a spurious `× 3`; it is removed. `[verified: 2 sources]`

**Practical gauge budget for a boss fight** `[estimate]` (worked from the table, for the Seymour Flux "summon everything" plan and the BFA gauntlet):
* On **Stoic**, a character at 2 000 maxHP taking a 1 200-damage hit gains `1200 × 30 / 2000` = **18 %**. Roughly **5–6 big hits** per Overdrive.
* On **Ally** (3 %), a character needs **34 turns** — effectively never inside one boss fight. Ally is a field-grinding mode, not a boss mode.
* On **Comrade**, a party-wide 1 200-damage hit gives each observer `1200 × 20 / 2000` = **12 %** per ally hit, i.e. up to 24 % per AoE for a three-member party. **Comrade is the strongest boss-fight mode against multi-target bosses** and is the realistic answer to "how many Overdrives does the player get".
* On **Healer**, a Curaga healing 2 000 on a 2 000-maxHP ally gives `2000 × 16 / 2000` = **16 %**.

### 5.2 Timed-input bonus (Tidus, Auron, Wakka)

```
timerMs = {Tidus: 3000, Auron: 4000, Wakka: 20000}[overdriveUser]
timeRemaining = min(timeRemaining, timerMs)
damage += damage * timeRemaining // (timerMs * 2)      // up to +50%
```
i.e. **multiplier `1 + ½ × (timeRemaining / totalTime)`**. `[verified: 2 sources]` (decompile `OD_TIMERS` + `get_damage`; wiki Overdrive page states the same formula). Lulu's timer always reaches 0, so Fury gets no bonus. In the original NA/JP PS2 build Wakka did **not** receive this bonus. `[single source]`

For the Int/HD Slots timer the bonus is commonly written `1 + remainingMs/40000` for the 20-second timer — identical to the general formula. `[verified: 2 sources]`

### 5.3 Tidus — Swordplay

**UI and input rules.** A horizontal meter appears with a **count-down timer**. A marker sweeps left-to-right; a small **gold zone sits at the centre** of the meter. The player presses the confirm button to stop the marker. `[verified: 2 sources]` (Fandom *Swordplay (Final Fantasy X)*; SuperCheats)

The three rules the previous revision left open:

1. **A miss is not a failure.** "If the player misses, the marker will return to its default position (far **left** of the meter) and start moving again." The player may keep retrying until the timer expires. **Failure is timer expiry, not a bad press.** `[verified: 2 sources]`
2. **Zone width, marker speed and timer length all scale with the Overdrive's strength** — stronger Overdrive ⇒ narrower gold zone, faster marker, *shorter* timer. `[verified: 2 sources]` (stated qualitatively; the exact pixel/ms values are not published anywhere — see the tuning table below)
3. Success selects the "success" action row; timer expiry selects the distinct weaker "fail" row.

**Shipping parameters** — `[estimate]`. No source publishes zone widths or cursor speeds, so these are authored values chosen to reproduce the *published ordering* (zone narrows, marker speeds up, timer shortens monotonically with tier) and to make each tier feel about as hard as the next is rewarding. Tune freely; they are not facts.

| Overdrive | Timer (ms) | Meter travel L→R (ms) | Gold zone width (% of meter) | Effective window (ms) |
|---|---:|---:|---:|---:|
| Spiral Cut | 3 000 | 1 400 | 22 % | ~308 |
| Slice & Dice | 3 000 | 1 150 | 16 % | ~184 |
| Energy Rain | 2 600 | 900 | 12 % | ~108 |
| Blitz Ace | 2 200 | 700 | 9 % | ~63 |

The §5.2 remaining-time bonus uses the **timer** column as `timerMs`; because a miss restarts the sweep but not the timer, repeated misses directly cost damage. That is the intended skill gradient. `[estimate]`

**Tidus's Overdrives can land critical hits** given a high Luck stat — unlike Wakka's Slots, which never crit. `[verified: 2 sources]`

**Learning:** Tidus learns the next Swordplay by **executing Overdrives**, success irrelevant, cumulative — *any* Overdrive counts, not only the previous one. `[verified: 2 sources]`

| Overdrive | Row (success / fail) | Rank | Target | Formula | DmgCon × hits (success) | DmgCon × hits (fail) | Unlock |
|---|---|---:|---|---|---|---|---|
| Spiral Cut | 96 / 235 | 3 | 1 enemy | Strength, Other, crit-eligible | **32 × 1** | 24 × 1 | start |
| Slice & Dice | 97 / 236 | 4 | random enemies | Strength, Other, crit | **6 × 6** | 8 × 3 | 10 cumulative Overdrive executions |
| Energy Rain | 98 / 237 | 5 | all enemies | Strength, Other, crit | **26 × 1** | 20 × 1 | 30 cumulative executions |
| Blitz Ace | 99 + 274 / 238 | 7 (fail 6) | 1 enemy | Strength, Other, crit | **4 × 8, then a final 24 × 1** (row 274 "Last Hit") | 4 × 8 | 80 cumulative executions |

`[verified: 2 sources]` (rows/ranks/DmgCon from the decompile; hit counts, unlock counts and the "any Overdrive counts" rule from Fandom *Swordplay (Final Fantasy X)*).

> **Correction:** the previous revision listed Blitz Ace as **4 × 9**; Fandom states **eight** sword attacks plus the finishing kick. Treat the hit count as 8 + 1. `[single source]` — flagged in §11 C14.

### 5.4 Yuna — Grand Summon

Row 280, **rank 5**, costs the full gauge. Summons any owned aeon **with a full Overdrive gauge**. Critically: **after the aeon spends that temporary gauge, its own stored gauge is restored** — so an aeon that was already at 100 can fire **two Overdrives back to back**. Dismissing before spending the temporary gauge must restore the original stored value, not overwrite it with 100. `[verified: 2 sources]` (wiki Overdrive page; Gamer Guides Grand Summon page). Implement temporary and stored gauges as **separate fields**, temporary consumed first.

### 5.5 Auron — Bushido

**UI and input rules.** A button sequence is displayed and must be entered before a **4 000 ms** timer expires. The faster it is completed, the larger the §5.2 remaining-time bonus. `[verified: 2 sources]`

The per-input rules the previous revision left open — **all three are authored decisions**, because no source documents the input state machine:

| Question | **Shipping rule** | Basis |
|---|---|---|
| Does a wrong button abort immediately? | **No — a wrong press is ignored** and the expected input does not advance. | `[estimate]` Aborting on one mis-press would make an 8-input sequence on a 4 s timer punitively swingy, and the published failure condition is described only as the sequence being "unsuccessful" within the time limit. |
| Is there a per-button sub-window? | **No.** There is one global 4 000 ms budget for the whole sequence; individual inputs are untimed. | `[estimate]` Only one timer is ever shown. |
| How does "faster = larger bonus" reach §5.2? | The sequence **completes early**; `timeRemaining = 4000 − msElapsedWhenLastInputLanded`, fed straight into the §5.2 term with `timerMs = 4000`. Completing in 1 500 ms yields `1 + ½ × (2500/4000)` = **×1.31**. | `[verified: 2 sources]` for the §5.2 formula; `[estimate]` for the completion-time reading |

Failure (timer expiry) resolves the "(Fail)" row. A third "(Immune)" row exists for targets immune to the Overdrive's rider status, with a **higher** DmgCon compensating for the lost effect.

**Tornado is the special case.** Tornado has **no rider status**, so no target is ever "vulnerable" to it — the engine therefore always selects the *immune* row on success. That reconciles the decompile (rows 103 = 15, 269 = 15, 273 = 20) with Fandom's flat statement that a successful Tornado is "Physical, 20 (2 hits)" and a failed one is 15: **row 273 is Tornado's success row.** The previous revision's "success 15 × 2" was wrong. `[verified: 2 sources]` — recorded as §11 C15.

| Overdrive | Rows (success / fail / immune) | Rank | Target | DmgCon × hits (**success**) | DmgCon × hits (fail) | Rider | Sequence (**baseline = International**) | Unlock |
|---|---|---:|---|---|---|---|---|---|
| Dragon Fang | 101 / 267 / 271 | 5 | all enemies | **17 × 1** (immune 19 × 1) | 16 × 1 | weak Delay | **↓ ← ↑ → L1 R1 ✕ ○** *(NA/JP: … ○ ✕)* | start |
| Shooting Star | 100 / 266 / 270 | 5 | 1 enemy | **24 × 1** (immune 27 × 1) | 24 × 1 | **Eject** | **△ ✕ □ ○ ← → ○** *(NA/JP: △ ○ □ ✕ ← → ✕)* | defeat Spherimorph (Jecht Sphere 1) |
| Banishing Blade | 102 / 268 / 272 | 6 | 1 enemy | **28 × 1** (immune 30 × 1) | 28 × 1 | all four Breaks at chance **254**; one of only two attacks in the game with a 100 % Armor Break | **↑ L1 ↓ R1 → ← △** *(unchanged across versions)* | 3 Jecht Spheres |
| Tornado | 103 / 269 / **273 = success** | 7 (fail 6) | all enemies | **20 × 2** (row 273 — see note above) | 15 × 1 | — (no rider) | **○ → R1 ← L1 △** *(NA/JP: ✕ → R1 ← L1 △)* | 10 Jecht Spheres |

`[verified: 2 sources]` (rows/DmgCon from the decompile; sequences, version splits, hit counts and unlocks from Fandom *Bushido (Final Fantasy X)*, cross-checked against Jegged + SuperCheats).

> **Correction:** the previous revision printed the **NA/JP** button sequences while declaring an International/HD baseline. The baseline sequences are the bolded ones above; see §0 V14–V16.

### 5.6 Wakka — Slots

Three reels, **20 000 ms** timer, player stops each reel in turn.

#### The gap's premise is wrong: Slots is **not** a probability minigame

> "Unlike many iterations of the slots in other games of the series, **the player can control the outcome completely.**" — Fandom, *Slots (Final Fantasy X)*

There is **no per-symbol probability distribution to find**, because there is no random symbol selection: each reel spins through a fixed, visible symbol strip at a constant rate and the player stops it on the symbol they want. Expected damage is therefore a function of **player skill**, not of reel weights, and a competent player reliably lines up three of a kind. `[verified: 2 sources]` (Fandom states player control outright; every guide that describes Slots treats the outcome as chosen, and the reels are the basis of the well-known "Attack Reels" speedrun strategy, which would be impossible under random reels)

**What an implementation actually needs** is therefore a reel *strip* and a *spin rate*, not weights:

| Parameter | **Shipping value** | Basis |
|---|---|---|
| Symbol strip per reel | the reel set's symbol list, repeated, in fixed order (see the table below) | `[verified: 2 sources]` for the symbol sets |
| Symbols visible at rest | 1 per reel (3 total) | `[verified: 2 sources]` |
| Spin rate | **~6 symbols/second** per reel, constant, identical on all three reels | `[estimate]` — chosen so a symbol dwells ~167 ms, which is stoppable with practice but not trivial; no source publishes the rate |
| Stop order | left → centre → right, one button press each | `[verified: 2 sources]` |
| Timer | 20 000 ms total for all three stops; expiry auto-stops the remaining reels **at their current position** | `[verified: 2 sources]` for the 20 s timer; `[estimate]` for the auto-stop-in-place behaviour |
| Crit | **Slots never crit**, on any outcome | `[verified: 2 sources]` |

If the project wants an *AI* or an auto-battle fallback to roll Slots rather than play it, use a uniform draw over the reel's symbol set — but record it as an AI convenience, **not** as the game's model. `[estimate]`

**Matching rule** (identical for all four reel sets):

| Match | Result |
|---|---|
| **3 of a kind** | the matched effect hits **every** enemy |
| **2 of a kind** | the matched effect hits **one random** enemy |
| **no match** | one non-elemental **Power Shot** on one random enemy |

`[verified: 2 sources]` (Fandom *Slots (Final Fantasy X)*; the decompile carries explicit single-target and "(AoE)" rows for each shot).

| Reel set | Symbols on the strip | Resolved actions (rows) | DmgCon | Unlock |
|---|---|---|---:|---|
| **Element Reels** | Fire / Ice / Water / Thunder | Fire Shot 239/240, Ice Shot 241/242, Water Shot 243/244, Thunder Shot 245/246 | **34 × 1**, elemental, Strength formula, type Other, **no crit**, no weapon properties | start |
| **Attack Reels** | **1 Hit / 2 Hit / Miss** | Attack Reels 302 | **10 × n** — see the hit-count rule below | win a Blitzball tournament |
| **Status Reels** | Skull / Down-Arrow / Egg-timer | Havoc Shot 247/248, Break Shot 251/252, Time Shot 249/250 | **34 × 1** each | Attack Reels + 250 non-Arena battles + win the Blitzball league |
| **Aurochs Reels** | Element + Status symbols **plus Besaid Aurochs symbols** | Aurochs Shot 253 (3× Aurochs), otherwise the matching Element/Status shot | **72 × 1** all enemies (Aurochs Shot); 34 × 1 otherwise | Status Reels + 450 cumulative non-Arena battles + win a tournament |
| **(no match)** | — | Power Shot 254 | **32 × 1**, non-elemental, one random enemy — described as "double the attack power of a normal attack" | — |

#### Attack Reels — the hit-count rule, fully specified

This is the distribution question the gap asked about, and it has a deterministic answer. Note the third symbol is **Miss**, which the previous revision omitted.

```
n = sum of the three stopped symbols        // Miss = 0, "1 Hit" = 1, "2 Hit" = 2
if (all three symbols are identical) n = n * 2
// each of the n hits: DmgCon 10, random enemy, no crit
```

| Stopped combination | Raw sum | 3-match? | **Final hits** |
|---|---:|---|---:|
| Miss / Miss / Miss | 0 | yes | **0** |
| Miss / Miss / 1 Hit | 1 | no | 1 |
| 1 Hit / 1 Hit / 2 Hit | 4 | no | **4** |
| 1 Hit / 1 Hit / 1 Hit | 3 | yes | **6** |
| 2 Hit / 2 Hit / 1 Hit | 5 | no | 5 |
| **2 Hit / 2 Hit / 2 Hit** | 6 | yes | **12** *(maximum)* |

**12 is the true maximum**, reached only by a perfect 2-2-2. The previous revision described 12 as an engine clamp; it is not — 12 is simply `6 × 2`, the largest value the rule can produce. `[verified: 2 sources]` (Fandom gives the worked "1 Hit, 1 Hit, 2 Hit ⇒ four attacks" and "three 2 Hits ⇒ 12 (6 × 2)" examples; the decompile's row 302 carries DmgCon 10).

#### Status Reels — per-symbol effects

| Symbol | Action | Effect |
|---|---|---|
| **Skull** | Havoc Shot (247/248) | Poison, **plus Sleep, Silence and Darkness for 3 rounds** unless immune |
| **Down-Arrow** | Break Shot (251/252) | **Full Break — all four Breaks at 100 %** |
| **Egg-timer** | Time Shot (249/250) | **Petrify at 100 %**; if the target resists Petrify, instead **weak Delay + Slow (100 %, 0 turns)**, which also strips Haste |

`[verified: 2 sources]`.

Rows 116–119 ("Element/Attack/Status/Aurochs Reels (Unused)", DmgCon 48, rank 4) are **wrapper/menu entries, not the resolved attack** — do not use their constants. `[single source]`

For the *non-Attack* reel sets a two-match and a three-match deal identical **per-target** damage (34); the three-match difference is that it hits **all** enemies instead of one random enemy, so against a single boss the two are equivalent. **Attack Reels is the exception** — there a three-match genuinely doubles output. `[verified: 2 sources]`

**Reel rank** remains the one open conflict in this subsection — decompile says 3, Fandom's Slots page says the wrapper is rank 5 and "each ability is Rank 4". See §11 C1.

### 5.7 Lulu — Fury

**UI.** After choosing a learned Blk Magic spell, the player rotates the **right analog stick**. Each completed rotation increments a counter; the spell is cast that many times, **capped at 16**. There is no timing damage bonus (Lulu's timer always reaches 0, §5.2). `[verified: 2 sources]`

Fury casts cost **no MP**, are **not blocked by Silence**, and **bypass Reflect and Shell** (damage type Other); each individual hit is weaker than a normal cast. `[verified: 2 sources]`

#### Rotation size — the formula, calibrated against published anchors

The previous revision said "the required rotation size **grows** with Lulu's Magic stat". **That is backwards.** Fandom publishes a calibration table giving the number of casts obtained **after 15 rotations** at Magic 0, 128 and 255, and casts *increase* with Magic — so the required rotation **shrinks** as Magic rises. (The wiki's prose "the size of a rotation is based on Lulu's Magic stat and how many rotations the player has already made" describes *what it depends on*, not the direction.) `[verified: 2 sources]`

**Published anchor table — casts obtained after 15 stick rotations:**

| Fury tier (DmgCon) | Mag 0 | Mag 128 | Mag 255 |
|---|---:|---:|---:|
| Fire / Blizzard / Thunder / Water Fury (5) | **7** | **12** | **16** |
| Fira / Blizzara / Thundara / Watera Fury (10) | 6 | 10 | 16 |
| Drain Fury (9), Osmose Fury (4) | 6 | 10 | 16 |
| Firaga / Blizzaga / Thundaga / Waterga Fury (18) | 6 | 10 | 12 |
| Bio Fury, Death Fury, Demi Fury | 6 | 10 | 12 |
| Flare Fury (22) | 4 | 6 | 7 |
| **Ultima Fury (26)** | **4** | **4** | **4** |

`[verified: 2 sources]` (Fandom *Fury (Final Fantasy X)*; corroborated by the decompile's DmgCon ordering — the required rotation grows monotonically with the spell's power, and Ultima Fury is flat because it is already at the ceiling).

**Shipping model.** Treat 15 rotations as an angular budget of `15 × 360° = 5 400°` and derive a constant per-cast requirement that reproduces every anchor exactly:

```ts
// degreesPerCast for the three anchor Magic values, from the table above:
//   degreesPerCast = 5400 / castsAt15Rotations
const ANCHORS = {                       // [Mag0, Mag128, Mag255] in degrees per cast
  tier1:  [771, 450, 338],              // 5400/7,  5400/12, 5400/16
  tier2:  [900, 540, 338],              // 5400/6,  5400/10, 5400/16   (also Drain/Osmose)
  tier3:  [900, 540, 450],              // 5400/6,  5400/10, 5400/12   (also Bio/Death/Demi)
  flare:  [1350, 900, 771],             // 5400/4,  5400/6,  5400/7
  ultima: [1350, 1350, 1350],           // flat
};

function degreesPerCast(spell, magic) {          // piecewise-linear in Magic
  const [a0, a128, a255] = ANCHORS[spell.furyTier];
  return magic <= 128 ? a0   + (a128 - a0)   * (magic / 128)
                      : a128 + (a255 - a128) * ((magic - 128) / 127);
}

// During the input window, accumulate the stick's total swept angle:
casts = Math.min(16, Math.floor(totalSweptDegrees / degreesPerCast(spell, lulu.magic)));
```

`[estimate]` for the model; **exact** at the nine published anchor points per tier. Sanity checks it reproduces: a Mag-0 Lulu needs **~771°** (more than two full circles) per Fire Fury cast, matching the wiki's remark that "a successful rotation might be 720 degrees"; a Mag-255 Lulu needs **~338°** (just under one circle) and caps Fire Fury at 16.

**Deliberate simplification, flagged:** the real game also grows the requirement *within* a single sequence (later rotations in the same input are larger). The flat-per-sequence model above reproduces every published anchor and is monotone in Magic and spell power; the intra-sequence ramp is cosmetic at the level of granularity anyone can measure. If it is wanted later, apply `degreesPerCast × (1 + 0.04 × (k − 1))` for the k-th cast and re-solve the constants. `[estimate]`

**Input window:** ~4 s, consistent with the other timed Overdrives; no source publishes it precisely. `[estimate]`

#### Encounter readings
* **Fury is the named counter to Seymour Flux phase 2** because it bypasses Reflect *and* Shell. At a Gagazet-typical Lulu Magic of 38–48 (see `ffx-seymour-flux.md` §7.3), `degreesPerCast` for a -ga Fury is ≈ **793°**, giving **6–7 casts** from a clean 15-rotation input — i.e. `18 DmgCon × 6` ≈ a full-strength Firaga's worth of unblockable damage. That is a real but not dominant counter, which is the intended balance. `[estimate]`
* As an **Overkill route vs Yunalesca**, the same Lulu gets 6–7 casts; Ultima Fury (if ever learned) is flat at 4 regardless of Magic, so it is *not* the Overkill tool — the -ga tier is. `[estimate]`

| Fury | Row | Rank | Target | DmgCon × max hits | Element/effect |
|---|---:|---:|---|---|---|
| Fire / Blizzard / Thunder / Water Fury | 121 / 120 / 122 / 123 | 5 | random enemies | **5 × 16** | respective element |
| Fira / Blizzara / Thundara / Watera Fury | 124–127 | 5 | random | **10 × 16** | element |
| Firaga / Blizzaga / Thundaga / Waterga Fury | 128–131 | 5 | random | **18 × 16** | element |
| Bio Fury | 132 | 5 | random | 0 dmg × 16 | Poison chance 80 |
| Demi Fury | 133 | 6 | all enemies | Percentage Current **2/16 = 12.5 %** × 16 | — |
| Death Fury | 134 | 5 | random | 0 dmg × 16 | Death chance 80 |
| Drain Fury | 135 | 4 | random | **9 × 16**, drains HP | — |
| Osmose Fury | 136 | 4 | random | **4 × 16**, drains MP | — |
| Flare Fury | 137 | 7 | random | **22 × 16** | — |
| Ultima Fury | 138 | **10** | all enemies | **26 × 16** | — |

`[verified: 2 sources]` (DmgCon/rows decompile; ranks and the per-Magic rotation anchors match the Fandom Fury page exactly).

### 5.8 Kimahri — Ronso Rage

Learned via **Lancet** on enemies that carry the skill. Learning one **instantly fills** Kimahri's gauge. All Rages cost a full gauge, no MP, and are **not blocked by Silence**. All 12: `[verified: 2 sources]`

| Rage | Row | Rank | Target | Formula | DmgCon | Effect | Learn from |
|---|---:|---:|---|---|---:|---|---|
| Jump | 104 | 3 | 1 enemy | Strength, Other, crit | **32** | plain damage | starting |
| Fire Breath | 105 | 3 | all enemies | **Special Magic**, Other, crit, ignores MDef | **24** | Fire | Dual Horn, Grendel, Valaha, Yenke Ronso |
| Seed Cannon | 106 | 3 | 1 enemy | Strength, Other, crit | **33** | plain | Grat, Ragora, Sandragora, Ochu |
| Self-Destruct | 107 | 3 | 1 enemy | **HP** formula | **30** | `userMaxHP × 3`; **Kimahri is Ejected** | Biran Ronso, Bomb, Grenade, Puroboros |
| Thrust Kick | 108 | 3 | 1 enemy | Strength, Other, crit | **33** | plain damage — **does not eject** despite the in-game text | Biran Ronso, YKT-11, YKT-63 |
| Stone Breath | 109 | 3 | all enemies | Strength | 0 | **Petrify at chance 254** | Anacondaur, Basilisk, Yenke Ronso |
| Aqua Breath | 110 | 3 | all enemies | **Special Magic**, crit | **26** | Water | Chimera(-Brain/-geist), Yenke Ronso |
| Doom | 111 | 3 | 1 enemy | Magic | 0 | applies **Doom** flag | Biran Ronso, Ghost, Wraith |
| White Wind | 112 | 3 | whole party | **Healing** | **40** | MAG-scaled Cura-strength party heal | Dark Flan, Spirit |
| Bad Breath | 113 | 4 | all enemies | Magic | 0 | Poison 100/254, Sleep 100/**10**, Silence 100/**10**, Darkness 100/**10** — *Kimahri's version cannot Confuse* | Malboro, Great Malboro |
| Mighty Guard | 114 | 4 | whole party | Magic | 0 | **Protect + Shell (254) + one charge of each of the four Nuls** | Behemoth, Behemoth King, Biran Ronso |
| Nova | 115 | **7** | all enemies | **Special Magic**, crit | **70** | massive non-elemental | Omega Weapon, Nemesis |

### 5.9 Rikku — Mix

Two items are consumed and a single result action fires. **Every mix is rank 6** (the CTB preview lies and shows 5). All mixes have damage type **Other** and `ignores_armored`. Recipes are an unordered pair lookup over the game's item "mix groups"; many pairs collapse to the same result. `[verified: 2 sources]`

**Resolution-order warning (P0 for implementers):** the engine computes the signed HP/MP amounts from the **pre-action** target state, then removes statuses, then applies the amounts. Therefore **Super Elixir and Final Elixir remove Zombie and still kill that character** with reversed healing. Panacea (no HP component) is the only safe cleanse. `[verified: 2 sources]`

Top ~40 practically relevant mixes (row, effect, and one confirmed ingredient pair):

| Mix | Row | Rank | Target | Effect (decompiled) | Example pair |
|---|---:|---:|---|---|---|
| **Ultra Potion** | 172 | 6 | party | %Total 16 → full HP | Potion + Potion |
| **Panacea** | 173 | 6 | party | Cleanse Zombie, Petrify, Poison, Confuse, Berserk, Sleep, Silence, Darkness, Slow + Curse. **No HP change** | Remedy + Remedy |
| **Ultra Cure** | 174 | 6 | party | %Total 8 → **50 % HP** + the same cleanse (**still kills Zombies**) | Power Distiller + Sleeping Powder |
| **Mega Phoenix** | 175 | 6 | party | %Total 16 → **revive at 100 % max HP**; `misses_if_target_alive`; `never_break_damage_limit` | Phoenix Down + Phoenix Down |
| **Final Phoenix** | 176 | 6 | party | %Total 16 → revive KO'd **and** top up the living to full | Mega Phoenix + Mega Phoenix |
| **Elixir** | 177 | 6 | 1 random ally | %Total 16 HP + MP | Antidote + Power Sphere |
| **Megalixir** | 178 | 6 | party | %Total 16 HP + MP | Potion + Elixir |
| **Super Elixir** | 179 | 6 | party | Full HP + MP **and** cleanse (kills Zombies — see warning) | Potion + Megalixir |
| **Final Elixir** | 180 | 6 | party | Full HP + MP + cleanse + revive; `always_break_damage_limit` (only ability that restores > 999 MP) | Potion + Dark Matter |
| **NulAll** | 181 | 6 | 1 random ally | one charge of each of the four Nuls | Potion + Fire Gem |
| **Mega NulAll** | 182 | 6 | party | four Nuls each | Hi-Potion + Fire Gem |
| **Hyper NulAll** | 183 | 6 | party | four Nuls + **Cheer ×5 + Focus ×5** | Lunar Curtain + Mana Spring |
| **Ultra NulAll** | 184 | 6 | party | four Nuls + **Cheer/Aim/Focus/Reflex all ×5** | Healing Spring + Hypello Potion |
| **Mighty Wall** | 185 | 6 | party | Protect + Shell | Antidote + Lunar Curtain |
| **Mighty G** | 186 | 6 | party | Protect + Shell + **Haste** | Remedy + Lunar Curtain |
| **Super Mighty G** | 187 | 6 | party | Protect + Shell + Haste + **Regen (20 turns)** | Fire Gem + Lunar Curtain |
| **Hyper Mighty G** | 188 | 6 | party | Super Mighty G + **Auto-Life** | Chocobo Wing + Door to Tomorrow |
| **Vitality** | 189 | 6 | 1 random ally | MAX HP ×2 (no immediate healing) | Hi-Potion + Hi-Potion |
| **Mega Vitality** | 190 | 6 | party | MAX HP ×2 | Potion + Stamina Tablet |
| **Hyper Vitality** | 191 | 6 | party | MAX HP ×2 + Cheer ×5 | Potion + Stamina Tonic |
| **Mana** | 192 | 6 | 1 random ally | MAX MP ×2 | Potion + Ether |
| **Mega Mana** | 193 | 6 | party | MAX MP ×2 | Potion + Turbo Ether |
| **Hyper Mana** | 194 | 6 | party | MAX MP ×2 + Focus ×5 | Potion + Mana Tablet |
| **Freedom** | 195 | 6 | 1 random ally | MP cost = 0 | Ether + Mega Phoenix |
| **Freedom X** | 196 | 6 | party | MP cost = 0 | Potion + Twin Stars |
| **Quartet of 9** | 197 | 6 | 1 random ally | **Damage 9999** flag (min 9 999 per hit, heal floor 9 999) | Fire Gem + Door to Tomorrow |
| **Trio of 9999** | 198 | 6 | party | **Damage 9999** flag for all | Door to Tomorrow ×2 |
| **Hero Drink** | 199 | 6 | 1 random ally | `Critical` flag — guaranteed crits | Potion + Designer Wallet |
| **Miracle Drink** | 200 | 6 | party | `Critical` flag for all | Ether + Designer Wallet |
| **Hot Spurs** | 201 | 6 | party | Overdrive gain ×1.5 | Megalixir ×2 |
| **Eccentrick** | 202 | 6 | party | Overdrive gain ×2 (stacks with Hot Spurs) | Elixir + Door to Tomorrow |
| **Grenade** | 139 | 6 | all enemies | Fixed 7 → **350** base, crit-eligible | Fire Gem + Ice Gem |
| **Frag Grenade** | 140 | 6 | all enemies | Fixed 16 → **800** + Armor Break 254 | Power Sphere ×2 |
| **Potato Masher** | 142 | 6 | all enemies | Fixed 54 → **2 700** | Map + Map |
| **Cluster Bomb** | 143 | 6 | all enemies | Fixed 100 → **5 000** | Fire Gem + Shining Gem |
| **Tallboy** | 144 | 6 | all enemies | Fixed 180 → **9 000** | Grenade + Door to Tomorrow |
| **Chaos Grenade** | 148 | 6 | all enemies | Fixed 146 → **7 300** + Poison 254 + all four Breaks at 150 + Slow 254 + Sleep/Silence/Dark 254 for **8** turns | Grenade + Teleport Sphere |
| **Firestorm** | 150 | 6 | random enemies | Fixed 14 → **700** × **6 hits**, Fire | Antidote + Fire Gem |
| **Abaddon Flame** | 153 | 6 | random enemies | Fixed 18 → **900** × **3 hits**, Fire + Poison 254 + Breaks at 50 + Sleep/Silence/Dark ×3 turns | Fire Gem + Hypello Potion |
| **Burning Soul** | 151 | 6 | random enemies | Fixed 18 → **900** × **9 hits**, Fire | Fire Gem + Lv. 1 Key Sphere |
| **Nega Burst** | 169 | 6 | all enemies | Percentage Current 12 → **75 %** of current HP | Power Distiller + Shadow Gem |
| **Black Hole** | 170 | 6 | all enemies | Percentage Current 15 → **93.75 %** of current HP | Shadow Gem + Door to Tomorrow |
| **Sunburst** | 171 | 6 | all enemies | Deal 9999 ×2 = **19 998**, `always_break_damage_limit` | Fire Gem + Dark Matter |

The elemental families follow the same shape in ice / thunder / water: `x Blaster/Flurry/Bolt/Waterfall` = 400×5, `Firestorm/Icefall/Rolling Thunder/Flash Flood` = 700×6, `Burning Soul/Winter Storm/Lightning Bolt/Tidal Wave` = 900×9, `Brimstone/Black Ice/Electroshock/Aqua Toxin` = 400×3 + minor statuses, `Abaddon Flame/Krysta/Thunderblast/Dark Rain` = 900×3 + Poison/Breaks. `[verified: 2 sources]`

Ingredient pairs come from the SuperCheats/Tha Demon2004 table cross-checked against the official BradyGames Mix chart and Ceebs's Mix research. Order of the two ingredients never matters. `[verified: 2 sources]`
Selecting a mix that targets enemies when no enemy is in range prints "Mix failed!", **keeps** the gauge but still consumes the items and still delays Rikku. `[single source]`

---

## 6. Aeons

### 6.1 Summon rules

* `Summon` is a **rank-3** command available only to Yuna. The summoned aeon **replaces the entire active party**; the party members are removed from the field and **their CTB counters and all status durations freeze** until the aeon leaves. `[verified: 2 sources]`
* Only one aeon at a time (the Magus Sisters are three actors but count as one summon).
* Aeons cannot be targeted by party items or party spells; the player cannot heal them from outside. `[single source]`
* Elemental aeons **absorb** their own element, so Ifrit/Ixion/Shiva can heal themselves by casting their own black magic on themselves. `[verified: 2 sources]`
* **Dismiss** (rows 86/87) returns the party. A re-summoned aeon in the same battle **retains its statuses and its HP/MP**. The raw rank byte is 0 → the engine's fallback is rank 3; do **not** claim instant dismissal from the byte alone. `[single source]`
* **HP/MP persistence between battles:** an aeon's HP and MP carry over; they are **not** refilled by winning a battle. Restore by touching a **Save Sphere**, or by the aeon's own elemental self-heal. If the aeon was **KO'd**, it cannot be summoned again until a set number of battles have passed, after which it returns at **full HP and MP**. `[verified: 2 sources]` — upgraded from `[single source]`: Fandom *Aeon (Final Fantasy X)* states "If the aeon dies, they cannot be summoned again until a set number of battles take place, where they will be revived with full HP and MP. Otherwise, touching a save sphere will heal them," matching the community sources previously cited.
* **Post-KO restoration cadence — the number of battles is still unpublished.** Ship **3 battles** as the authored value. `[estimate]` — chosen so that an aeon lost in one of this project's five set-piece encounters is unavailable for the rest of that encounter and the immediate next, but recovers before the following chapter; no source gives a figure, and the five encounters here are not separated by normal random battles anyway, so the constant is nearly inert in practice. Expose it as `AEON_REVIVE_BATTLES`.
* **Seymour Flux / Seymour Natus destroy summons outright.** Against either, an aeon gets **exactly one turn** before Seymour casts **Banish**, which removes the aeon and **overrides the aeon's innate Eject immunity**, flagging it as **KO'd** afterwards. `[verified: 2 sources]` (Fandom *Aeon (Final Fantasy X)*; corroborated by the Seymour Flux chapter's own move list). Two consequences the Seymour Flux chapter depends on: the "summon-stall" is **one action per aeon, not a stall**, and because Banish leaves the aeon KO'd, **that aeon's Overdrive gauge is reset to zero** (§6.6) and it is unavailable for `AEON_REVIVE_BATTLES` afterwards.
* An aeon being defeated ends the summon and returns the party; it does **not** cause a Game Over.
* Aeon status immunity ("—"): everything Ribbon covers **plus** all four Breaks, instant Death, Eject, Scan, Defend, Guard and Sentinel. **Curse is the notable exception aeons are vulnerable to.** Threaten is also blocked. Delay is **not** blocked. `[verified: 2 sources]`

### 6.2 Aeon sub-commands

| Command | Row | Rank | Effect |
|---|---:|---:|---|
| **Shield** | 84 | 3 | All damage **and healing** received `//4` (−75 %) until the aeon's next turn; **Overdrive gain is negated entirely** while active (not merely reduced). Applied just before the damage cap, so it applies to percentage and fixed damage too. `[verified: 2 sources]` |
| **Boost** | 85 | 3 | All damage and healing received `×1.5` until next turn; **the Overdrive gauge fills by the same ×1.5** — "increases the damage the aeon receives by 50 %, but increases the rate at which the Overdrive gauge fills by the same amount". This quantifies the previous revision's "much faster". `[verified: 2 sources]` |
| **Dismiss** | 86 | (0→3) | Return the party |

`[verified: 2 sources]`. Both stances modify **percentage-based** damage as well — this was a confirmed bug in the Moonpetal prototype.

### 6.3 Aeon abilities and Overdrives (decompiled)

| Aeon | Attack row / hit formula | Special (row) | Rank | Target | Formula | DmgCon | Rider | Overdrive (row) | Rank | Formula | DmgCon |
|---|---|---|---:|---|---|---:|---|---|---:|---|---:|
| **Valefor** | 203, ACC×2.5, DmgCon 14 | **Sonic Wings** (204) | **2** | 1 enemy | Strength, **Physical** | **8** | weak Delay | **Energy Ray** (206) / **Energy Blast** (205) | 8 / **9** | Special Magic, Other | **55** / **75** |
| **Ifrit** | 207, ACC×1.5, DmgCon 16 | **Meteor Strike** (208) | 4 | 1 enemy | Strength, **Other** | **17** | — | **Hellfire** (209) | 8 | Special Magic, Fire | **58** |
| **Ixion** | 210, ACC×1.5, 16 | **Aerospark** (211) | 4 | 1 enemy | Strength, Physical | **16** | **removes Shell, Protect, Reflect, all 4 Nuls, Regen, Haste** | **Thor's Hammer** (212) | 8 | Special Magic, Thunder | **60** |
| **Shiva** | 213, ACC×2.5, 14 | **Heavenly Strike** (214) | 4 | 1 enemy | Strength, Physical | **17** | **Threaten** chance 100 (never lands on party/aeons) | **Diamond Dust** (215) | 8 | Special Magic, Ice | **60** |
| **Bahamut** | 216, ACC×1.5, 16 | **Impulse** (217) | **6** | **all enemies** | Strength, Physical | **16** | — | **Mega Flare** (218) | 8 | Special Magic, Other, **`always_break_damage_limit`** | **72** |
| **Anima** | 219, ACC×1.5, 16 | **Pain** (220) | 6 | 1 enemy | **Special Magic**, Magical | **20** | **Death chance 100** | **Oblivion** (221) | 8 | Strength, Other, `always_break_damage_limit` | **4 × 16 hits** (Int/HD; original = 75 × 1) |
| **Yojimbo** | — | Daigoro (222) DmgCon 10 / Kozuka (223) 13 / Wakizashi ST (224) 18 / Wakizashi MT (225) 18 | 3 | 1 or all | Strength, Physical | — | — | **Zanmato** (226) | 3 | — | Death at chance **255** (ignores all resistance) |
| **Magus Sisters** | Cindy 228 (14) / Sandy 230 (14) / Mindy 232 (14) | Camisade (229) 21, Razzia (231) 21, Passado (233) **2 × 15 hits**, NulAll (301) | 5 / 5 / 5 / 3 | — | Strength, Physical | — | — | **Delta Attack** (234) | 5 | Strength, Other | **10 × 6 hits** (Int/HD; original = 60 × 1) |

`[verified: 2 sources]` — rows/ranks/DmgCon from the decompile, ranks independently confirmed by the Fandom rank table.

Notes for implementers:
* **All five core aeon specials use the Strength formula against the target's Defense.** "Ignores Armored" is *not* the same as "ignores Defense". The Moonpetal prototype had all five on Magic/no-defense — that is wrong.
* All aeon **Overdrives** are `Special Magic`: cubic Magic scaling, **MDef treated as 0**, damage type Other → Shell does not reduce them.
* Only **Bahamut's Mega Flare** (and Anima's Oblivion) innately break the 9 999 limit.
* Valefor is the only aeon with two Overdrives; Energy Blast is unlocked by the Besaid shopkeeper/dog sidequest.

### 6.4 Aeon stat derivation from Yuna

> **BLOCKER RESOLVED — the three "incompatible" aeon stat models are one model.**
>
> This document's coefficient derivation, `ffx-yunalesca.md` §12's "Ultimania battle-count tables", and `ffx-seymour-flux.md` §7.3's `4,000–7,000` range were treated as three rival figures. They are not rivals:
>
> * The formula is `aeon[stat] = max(x, y) + z`, where **`x` is computed from the battle count** and **`y` is computed from Yuna's actual stats** (`z` = Aeon's Soul sphere training).
> * **`ffx-yunalesca.md` §12's tables are exactly the `x` branch** — the battle-count floor, evaluated with Yuna sitting *on* the floor. Verified by executing the pinned decompile: it reproduces all **45 values** (9 stats × 5 aeons × 2 battle brackets) in that chapter **exactly**, including Valefor 1,341 / 1,465 and Bahamut 2,542 / 2,840.
> * **This section's 1,869 / 3,618 figures are the `y` branch**, for a Yuna who is *above* the floor (HP 1 875, MAG 52, MDEF 52, AGI 36, EVA 48). Both numbers are correct for their respective Yuna.
> * **`ffx-seymour-flux.md` §7.3's "Aeons (all) 4,000–7,000" is simply wrong** for the five story aeons at Mt. Gagazet and should be replaced with the §6.4.3 block below. That range only describes **Cindy and Sandy** (optional Magus Sisters), or the story aeons several hundred battles later. `ffx-yunalesca.md` §15.2 defect #10's "roughly 2.4× too durable" verdict is **upheld**.
>
> `[verified: 3 sources]` — decompile `gamestate.py::calculate_aeon_stats` + `constants.py`; the Fandom *Aeon (Final Fantasy X)/Stat growth* page, which publishes the same `A = max(x, y) + z` formula, the same per-aeon coefficients, and per-battle-count tables that match the computation to the unit across all ten aeons and all twenty brackets; and the local `aeon-growth-reference.json` extract.

Aeon stats are **recomputed at the end of every encounter** from Yuna's current stats and a story-progress floor.

```
powerBase(s) = min(HP,9999)//100 + min(MP,999)//10 + STR + DEF + MAG + MDEF + AGI + EVA + ACC

tier      = clamp((encountersCount - 30) // 30, 0, 19)
encStats  = ENCOUNTERS_YUNA_STATS[stat][tier]        // story-progress floor
yunaPB    = powerBase(yunaStats);  encPB = powerBase(encStats)

for each stat:
    y = yunaStats[stat] * xPercent // 100 + int(yunaPB * yCoef)   // "from Yuna"
    x = encStats[stat]  * xPercent // 100 + int(encPB  * yCoef)   // "from battle count"
    aeon[stat] = max(x, y) + trainedAeonBonus[stat]
aeon[LUCK] = yuna[LUCK] + trainedAeonBonus[LUCK]
```

All battles count toward `encountersCount` — boss battles, battles fled from, and battles fought before Yuna joins the party. `[verified: 2 sources]`

Coefficients `(xPercent, yCoef)` per aeon. **Tag upgraded to `[verified: 2 sources]`** — the Fandom stat-growth page publishes the identical constants in `a`/`b` form (e.g. Valefor HP `a=6, b=20` ↔ `(20 %, ×6)`; Bahamut `a=7, b=100` ↔ `(100 %, ×7)`):

| Aeon | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC |
|---|---|---|---|---|---|---|---|---|---|
| Valefor | 20 %, ×6 | 4 %, ×1/5 | 60 %, ×1/7 | 50 %, ×1/5 | 100 %, ×1/70 | 100 %, ×1/30 | 50 %, ×1/20 | 50 %, ×1/24 | 200 %, ×1/20 |
| Ifrit | 70 %, ×5 | 3 %, ×1/5 | 80 %, ×1/7 | 170 %, ×1/5 | 90 %, ×1/33 | 90 %, ×1/34 | 40 %, ×1/20 | 30 %, ×1/70 | 200 %, ×1/20 |
| Ixion | 55 %, ×6 | 5 %, ×1/5 | 100 %, ×1/7 | 100 %, ×1/5 | 90 %, ×1/38 | 130 %, ×1/30 | 30 %, ×1/20 | 30 %, ×1/47 | 250 %, ×1/20 |
| Shiva | 40 %, ×6 | 7 %, ×1/5 | 120 %, ×1/8 | 40 %, ×1/7 | 100 %, ×1/28 | 100 %, ×1/25 | 100 %, ×1/23 | 100 %, ×1/44 | 200 %, ×1/20 |
| Bahamut | 100 %, ×7 | 5 %, ×3/10 | 160 %, ×1/7 | 200 %, ×1/6 | 90 %, ×1/250 | 100 %, ×1/12 | 50 %, ×1/20 | 50 %, ×1/20 | 200 %, ×1/20 |
| Anima | 120 %, ×8 | 4 %, ×2/5 | **330 %**, ×1/6 | 100 %, ×1/5 | 70 %, ×1/12 | 100 %, ×1/30 | 40 %, ×1/20 | 50 %, ×1/20 | 200 %, ×1/20 |
| Yojimbo | 18 %, ×9 | 0 | 240 %, ×1/6 | 250 %, ×1/8 | 60 %, ×1/23 | 100 %, ×1/30 | 40 %, ×1/20 | 180 %, ×1/20 | 300 %, ×1/10 |
| Cindy | 240 %, ×10 | 18 %, ×3/10 | 230 %, ×1/6 | 300 %, ×1/6 | 100 %, ×1/60 | 100 %, ×1/12 | 50 %, ×1/20 | 50 %, ×1/20 | 200 %, ×1/20 |
| Sandy | 200 %, ×8 | 5 %, ×3/10 | **550 %**, ×1/7 | 180 %, ×1/6 | 110 %, ×1/40 | 100 %, ×1/12 | 50 %, ×1/20 | 40 %, ×1/20 | 270 %, ×1/20 |
| Mindy | 150 %, ×5 | 20 %, ×2/5 | 160 %, ×1/7 | 140 %, ×1/6 | 130 %, ×1/40 | 100 %, ×1/12 | 70 %, ×1/20 | 60 %, ×1/20 | 240 %, ×1/20 |

Story-progress floor table `ENCOUNTERS_YUNA_STATS` (index = tier 0…19): `[verified: 2 sources]`

| Stat | values |
|---|---|
| HP | 475, 475, 675, 875, 875, 1075, 1075, 1075, 1275, 1475, 1475, 1475, 1675, 1875, 1875, 1875, 2075, 2075, 2275, 2275 |
| MP | 84, 104, 104, 104, 124, 144, 144, 164, 184, 184, 204, 204, 224, 224, 244, 244, 264, 264, 304, 304 |
| STR | 5 (all tiers) |
| DEF | 5, 5, 7, 7, 7, 7, 7, 7, 7, 11, 11, 11, 11, 11, 11, 15, 15, 15, 15, 15 |
| MAG | 20, 23, 26, 26, 29, 29, 32, 36, 40, 40, 44, 44, 48, 48, 52, 52, 56, 56, 60, 60 |
| MDEF | 20, 23, 23, 26, 29, 32, 36, 36, 36, 40, 40, 44, 48, 48, 52, 52, 52, 56, 56, 60 |
| AGI | 10, 10, 13, 13, 13, 16, 16, 20, 20, 24, 24, 28, 28, 32, 32, 36, 36, 36, 40, 40 |
| LUCK | 17 (all tiers) |
| EVA | 30, 32, 32, 32, 32, 36, 36, 36, 40, 40, 44, 44, 44, 48, 48, 52, 52, 56, 56, 60 |
| ACC | 3 (all tiers) |

#### 6.4.1 The `x` branch — aeon Max HP by battle count (the "Ultimania" table)

This is the table `ffx-yunalesca.md` §12 quotes. It is the **lower bound**: an aeon is never weaker than this, whatever Yuna's stats. Computed by executing the formula above with Yuna pinned to the floor; every column matches the Fandom stat-growth tables to the unit. `[verified: 3 sources]`

| N (battles) | tier | Valefor | Ifrit | Ixion | Shiva | Bahamut | Anima | Yojimbo | Cindy | Sandy | Mindy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0–59 | 0 | 725 | 857 | 891 | 820 | 1,210 | 1,410 | 1,030 | 2,190 | 1,790 | 1,237 |
| 60–89 | 1 | 785 | 907 | 951 | 880 | 1,280 | 1,490 | 1,120 | 2,290 | 1,870 | 1,287 |
| 90–119 | 2 | 885 | 1,097 | 1,121 | 1,020 | 1,550 | 1,810 | 1,246 | 2,870 | 2,350 | 1,637 |
| 120–149 | 3 | 955 | 1,262 | 1,261 | 1,130 | 1,785 | 2,090 | 1,327 | 3,400 | 2,790 | 1,962 |
| 150–179 | 4 | 1,003 | 1,302 | 1,309 | 1,178 | 1,841 | 2,154 | 1,399 | 3,480 | 2,854 | 2,002 |
| 180–209 | 5 | 1,127 | 1,512 | 1,503 | 1,342 | 2,139 | 2,506 | 1,561 | 4,100 | 3,366 | 2,372 |
| 210–239 | 6 | 1,169 | 1,547 | 1,545 | 1,384 | 2,188 | 2,562 | 1,624 | 4,170 | 3,422 | 2,407 |
| **240–269** | 7 | **1,229** | **1,597** | **1,605** | **1,444** | **2,258** | 2,642 | 1,714 | 4,270 | 3,502 | 2,457 |
| **270–299** | 8 | **1,341** | **1,797** | **1,787** | **1,596** | **2,542** | 2,978 | 1,858 | 4,870 | 3,998 | 2,817 |
| **300–329** | 9 | **1,465** | **2,007** | **1,981** | **1,760** | **2,840** | 3,330 | 2,020 | 5,490 | 4,510 | 3,187 |
| 330–359 | 10 | 1,525 | 2,057 | 2,041 | 1,820 | 2,910 | 3,410 | 2,110 | 5,590 | 4,590 | 3,237 |
| 360–389 | 11 | 1,573 | 2,097 | 2,089 | 1,868 | 2,966 | 3,474 | 2,182 | 5,670 | 4,654 | 3,277 |
| 390–419 | 12 | 1,685 | 2,297 | 2,271 | 2,020 | 3,250 | 3,810 | 2,326 | 6,270 | 5,150 | 3,637 |
| 420–449 | 13 | 1,785 | 2,487 | 2,441 | 2,160 | 3,520 | 4,130 | 2,452 | 6,850 | 5,630 | 3,987 |
| 450–479 | 14 | 1,845 | 2,537 | 2,501 | 2,220 | 3,590 | 4,210 | 2,542 | 6,950 | 5,710 | 4,037 |
| 480–509 | 15 | 1,917 | 2,597 | 2,573 | 2,292 | 3,674 | 4,306 | 2,650 | 7,070 | 5,806 | 4,097 |
| 510–539 | 16 | 2,005 | 2,777 | 2,731 | 2,420 | 3,930 | 4,610 | 2,758 | 7,630 | 6,270 | 4,437 |
| 540–569 | 17 | 2,053 | 2,817 | 2,779 | 2,468 | 3,986 | 4,674 | 2,830 | 7,710 | 6,334 | 4,477 |
| 570–599 | 18 | 2,177 | 3,027 | 2,973 | 2,632 | 4,284 | 5,026 | 2,992 | 8,330 | 6,846 | 4,847 |
| 600+ | 19 | 2,225 | 3,067 | 3,021 | 2,680 | 4,340 | 5,090 | 3,064 | 8,410 | 6,910 | 4,887 |

#### 6.4.2 Canonical Yuna profiles for the three FFX encounters

To make aeon stats deterministic across chapters, this project **declares** the following Yuna stat blocks. They sit inside the `ffx-seymour-flux.md` §7.3 published ranges and just above the story floor, which is where a non-grinding first playthrough lands. `[estimate]` — authored presets, not measurements; every aeon number in §6.4.3 follows from them mechanically.

| Encounter | Battles N | tier | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC | LUCK |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Seymour Flux** (Mt. Gagazet) | 250 | 7 | 1 500 | 270 | 15 | 13 | 37 | 39 | 15 | 33 | 11 | 17 |
| **Yunalesca** (Zanarkand Dome) | 300 | 9 | 1 650 | 290 | 16 | 14 | 41 | 43 | 17 | 36 | 12 | 17 |
| **Braska's Final Aeon / Yu Yevon** (inside Sin) | 360 | 11 | 1 900 | 320 | 18 | 16 | 46 | 48 | 19 | 40 | 13 | 17 |

#### 6.4.3 Canonical aeon stat blocks — **ship these**

Computed by executing the formula in §6.4 against the §6.4.2 Yuna profiles, no Aeon's Soul training. The **branch** column shows, per stat in the order HP·MP·STR·DEF·MAG·MDEF·AGI·EVA·ACC, whether the value came from Yuna (`Y`) or the battle-count floor (`F`) — useful when tuning, because changing Yuna only moves `Y` stats. `[estimate]` (mechanically derived from `[verified: 3 sources]` constants and `[estimate]` Yuna profiles)

**Seymour Flux — Mt. Gagazet, N = 250 (tier 7).** Only Valefor/Ifrit/Ixion/Shiva/Bahamut are available (§7.6 of the Seymour chapter); the rest are listed for completeness.

| Aeon | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC | LUCK | baseCTB | branch |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Valefor** | **1,530** | 51 | 38 | 47 | 39 | 45 | 18 | 25 | 32 | 17 | 11 | YYYYYYFFY |
| **Ifrit** | **2,075** | 49 | 41 | 63 | 39 | 41 | 16 | 12 | 32 | 17 | 12 | YYYYYYYFY |
| **Ixion** | **2,055** | 54 | 44 | 54 | 38 | 56 | 14 | 13 | 37 | 17 | 13 | YYYYYYYYY |
| **Shiva** | **1,830** | 59 | 43 | 34 | 44 | 47 | 27 | 39 | 32 | 17 | 9 | YYYYYYFFY |
| **Bahamut** | **2,935** | 74 | 53 | 60 | 33 | 56 | 18 | 26 | 32 | 17 | 11 | YYYYYYFYY |
| Anima | 3,440 | 92 | 83 | 54 | 42 | 45 | 16 | 26 | 32 | 17 | 12 | YYYYYYYYY |
| Yojimbo | 2,115 | 0 | 70 | 57 | 30 | 45 | 16 | 72 | 53 | 17 | 12 | YYYYYYYFY |
| Cindy | 5,650 | 109 | 68 | 73 | 40 | 56 | 18 | 26 | 32 | 17 | 11 | YYYYYYFYY |
| Sandy | 4,640 | 74 | 111 | 57 | 45 | 56 | 18 | 23 | 39 | 17 | 11 | YYYYYYFYY |
| Mindy | 3,275 | 136 | 53 | 52 | 53 | 56 | 22 | 29 | 36 | 17 | 10 | YYYYYYFYY |

**Yunalesca — Zanarkand Dome, N = 300 (tier 9).**

| Aeon | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC | LUCK | baseCTB | branch |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Valefor** | **1,674** | 55 | 41 | 51 | 44 | 50 | 21 | 28 | 35 | 17 | 10 | YYYYYYFFY |
| **Ifrit** | **2,275** | 52 | 44 | 67 | 42 | 44 | 18 | 14 | 35 | 17 | 11 | YYYYYYFFY |
| **Ixion** | **2,251** | 58 | 48 | 58 | 41 | 62 | 16 | 16 | 41 | 17 | 12 | YYYYYYYFY |
| **Shiva** | **2,004** | 64 | 47 | 37 | 49 | 51 | 32 | 44 | 35 | 17 | 8 | YYYYYYFFY |
| **Bahamut** | **3,218** | 81 | 57 | 65 | 36 | 61 | 21 | 29 | 35 | 17 | 10 | YYYYYYFYY |
| Anima | 3,772 | 100 | 89 | 58 | 46 | 50 | 18 | 29 | 35 | 17 | 11 | YYYYYYFYY |
| Yojimbo | 2,313 | 0 | 75 | 63 | 33 | 50 | 18 | 81 | 58 | 17 | 11 | YYYYYYFFY |
| Cindy | 6,200 | 119 | 73 | 79 | 44 | 61 | 21 | 29 | 35 | 17 | 10 | YYYYYYFYY |
| Sandy | 5,092 | 81 | 120 | 62 | 50 | 61 | 21 | 25 | 43 | 17 | 10 | YYYYYYFYY |
| Mindy | 3,595 | 147 | 57 | 56 | 58 | 61 | 25 | 33 | 39 | 17 | 9 | YYYYYYFFY |

**Braska's Final Aeon / Yu Yevon — inside Sin, N = 360 (tier 11).** These are also the stats for the **possessed aeons** the party must fight in the Yu Yevon gauntlet, which mirrors the player's own aeon block.

| Aeon | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | ACC | LUCK | baseCTB | branch |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Valefor** | **1,886** | 62 | 45 | 58 | 49 | 56 | 24 | 30 | 38 | 17 | 9 | YYYYYYFYY |
| **Ifrit** | **2,585** | 59 | 49 | 77 | 48 | 50 | 21 | 16 | 38 | 17 | 10 | YYYYYYFFY |
| **Ixion** | **2,551** | 66 | 53 | 66 | 47 | 70 | 18 | 17 | 44 | 17 | 11 | YYYYYYFYY |
| **Shiva** | **2,266** | 72 | 52 | 41 | 54 | 58 | 37 | 48 | 38 | 17 | 7 | YYYYYYFFY |
| **Bahamut** | **3,657** | 91 | 63 | 73 | 42 | 68 | 24 | 32 | 38 | 17 | 9 | YYYYYYFYY |
| Anima | 4,288 | 112 | 100 | 66 | 52 | 56 | 21 | 32 | 38 | 17 | 10 | YYYYYYFYY |
| Yojimbo | 2,601 | 0 | 84 | 71 | 37 | 56 | 21 | 89 | 64 | 17 | 10 | YYYYYYFFY |
| Cindy | 7,070 | 132 | 82 | 89 | 50 | 68 | 24 | 32 | 38 | 17 | 9 | YYYYYYFYY |
| Sandy | 5,808 | 91 | 134 | 69 | 56 | 68 | 24 | 28 | 47 | 17 | 9 | YYYYYYFYY |
| Mindy | 4,105 | 164 | 63 | 63 | 65 | 68 | 29 | 36 | 43 | 17 | 8 | YYYYYYFYY |

**Headline for the three dependent strategies:**
* Story aeons at these story points sit at **1,500–3,700 HP**, not 4,000–7,000. Bahamut is the only story aeon above 2,900.
* Against Seymour Flux, an aeon lives exactly **one turn** regardless of HP (Banish, §6.1) — HP is almost irrelevant there; **the Overdrive gauge is what matters**, which is why §6.5 is the load-bearing section for that encounter, not this one.
* Against Yunalesca, an aeon is a **sacrificial timer** whose length is set by these HP values and her absorb-per-hit; Bahamut at 3,218 survives meaningfully longer than Valefor at 1,674, which is the intended ordering.

#### 6.4.4 Cross-check: aeon Overdrive output

The Fandom stat-growth page also publishes per-battle-count **aeon Overdrive damage** figures. Those figures reproduce to within ±1 % as `k × DmgCon × MAG³` with a single shared constant across all five aeons (Shiva 10,796 / Valefor 10,305 / Ifrit 7,418 / Ixion 7,136 / Bahamut 6,277 at N = 270–299), which independently confirms **both** §6.3's DmgCon values **and** the Special-Magic cubic-Magic, MDef-0 formula **and** the §6.4 stat model at once. `[verified: 2 sources]`

Note the wiki labels that column "damage that would cause the Aeon to perform his Overdrive", which reads like gauge-fill data; the numeric fit shows it is **Overdrive output damage**. It does **not** answer the gauge question — see §6.5.

Sanity: Bahamut at MAG 36 (Yunalesca, N = 300) firing Mega Flare (Special Magic, DmgCon 72, MDef 0) ⇒ ≈ **6,300–7,100**, i.e. comfortably under 9 999 — **Mega Flare does not need its innate Break Damage Limit at this story point**. The previous revision's "≈ 12 900 raw" assumed a much stronger Yuna and should not be used for encounter tuning. `[verified: 2 sources]`

### 6.5 Aeon Overdrive gauge — scale, fill rate and persistence

This section closes `ffx-seymour-flux.md` §6 strategy 15 / §9 C-10 and `ffx-yunalesca.md` §10.6, both of which require a specified aeon gauge.

**What is actually documented** `[verified: 2 sources]` (Fandom *Aeon (Final Fantasy X)*; decompile `od_cost`):

| Rule | Value |
|---|---|
| Fill trigger 1 | The aeon **targets an enemy with an attack** — *except* Anima's **Pain** and all of Yojimbo's abilities, which charge nothing |
| Fill trigger 2 | The aeon **is targeted by an enemy attack** |
| Mode | **Not configurable.** Aeons have no Overdrive Mode menu; they are permanently on a fixed Stoic + Warrior hybrid |
| **Boost** | Damage taken ×1.5 **and gauge fill ×1.5** |
| **Shield** | Damage taken ÷4 and **gauge fill zeroed** |
| **Grand Summon** | Fills the aeon's gauge to full for that summon; after the Overdrive fires, the gauge **returns to its pre-Grand-Summon value** — so an already-full aeon fires **two Overdrives back to back** |
| **On aeon death** | **Gauge is reset to zero.** Not preserved, not partially retained |
| Between battles | The gauge persists with HP/MP (it is not cleared by winning) |
| Magus Sisters | Three separate gauges, one per sister |
| `od_cost` | **20** for aeon Overdrives vs **100** for character Overdrives (decompile) |

**What is NOT documented anywhere:** the per-event increment. No guide, wiki page or decompiled table quantifies it.

**Shipping model** `[estimate]` — reasoned from the decompiled 20 : 100 `od_cost` ratio:

> Keep **one 0–100 display scale for everybody**, and give aeons **5× the character increment**, since their Overdrive costs one fifth as much.

```ts
// Aeon gauge, same 0-100 scale as characters. Not mode-configurable.
const AEON_FILL_MULT = 5;                  // = 100 / od_cost(20)

onAeonDamaged(aeon, dmg) {
  if (aeon.hasStance(SHIELD)) return;                       // Shield zeroes gain
  let g = dmg * 30 / aeon.maxHP;                            // Stoic coefficient
  if (aeon.hasStance(BOOST)) g *= 1.5;
  aeon.gauge = Math.min(100, aeon.gauge + g * AEON_FILL_MULT);
}

onAeonDealtDamage(aeon, dmg, action) {
  if (action.isOverdrive || action.isPain || action.isYojimbo) return;
  let g = Math.min(16, dmg * 10 / estimatedDamage(aeon));    // Warrior coefficient
  aeon.gauge = Math.min(100, aeon.gauge + g * AEON_FILL_MULT);
}
```

**What this produces, and why it is the right target** `[estimate]`:
* An aeon that **attacks once and is hit once** for roughly its own undefended Attack gains about `(10 + 30×dmg/maxHP) × 5`. For Bahamut at 3,218 HP taking a 1,600-damage hit: `(10 + 15) × 5` = **125 → capped at 100**. In other words **an aeon that trades one full round with a boss reaches Overdrive**, which matches the universal player experience that aeons Overdrive almost immediately and is the behaviour the encounters assume.
* With **Boost** active the damage-taken half is ×1.5, so Boost genuinely accelerates the Overdrive — the documented purpose of the stance.
* **Shield** stalls the gauge completely, so Shield-tanking and Overdrive-charging are mutually exclusive, again as documented.

**Persistence rule — normative:**

```
aeon.gauge persists across battles, together with HP and MP.
aeon.gauge is set to 0 when the aeon is KO'd (including Seymour's Banish, §6.1).
aeon.gauge is NOT reset by Dismiss, by re-summoning, or by winning a battle.
Grand Summon uses a SEPARATE temporary gauge; the stored value is restored afterwards.
```

Implement `gaugeStored` and `gaugeTemporary` as **two fields**, temporary consumed first (§5.4).

**Encounter consequences — read these before tuning:**
* **Seymour Flux (§6 strategy 15).** Persistent gauges are what make the phase-2 burst exist: the player arrives with several aeons already at 100 from earlier battles, summons each one, and fires its Overdrive **on its single pre-Banish turn**. Because Banish KOs the aeon, the gauge is then **zeroed** — so the burst is strictly one Overdrive per aeon per visit, and the aeon is also unavailable for `AEON_REVIVE_BATTLES` afterwards. That is the whole budget, and it is finite by design.
* **Yunalesca (§10.6).** Firing the aeon Overdrive **immediately on summon, before Curse lands**, is possible exactly when the stored gauge is already full — i.e. the player must have banked it before entering. Curse (the one status aeons are vulnerable to, §6.1) disables the Overdrive command, so a partially-filled gauge is effectively a dead aeon for this purpose. Design the encounter around *banked* gauges, not gauges filled in-fight.
* **Yu Yevon's possessed aeons** use the same block (§6.4.3) and the same gauge rules, so the player's own aeon tuning is automatically mirrored.

---

### 6.6 Yojimbo pay logic (simplified but faithful)

State: **compatibility** 0–255 (Int/HD starting value **128**; NA/JP 50). `[single source]`

```
// 1. free-attack check
if (compatibility // 4) > (rng & 255):
    motivation = compatibility//4 + (rng & 0x3F)
    pick the highest-tier attack whose needed_motivation <= motivation
    gil paid = 0
// 2. paid attack
else:
    base       = compatibility // COMPAT_DIV        // Int/HD 10, NA/JP 30
    resistance = ZANMATO_RESISTANCES[monster.zanmatoLevel]   // (0.8,0.8,0.8,0.4,0.4,0.4)
    fixed      = int(base * resistance) + (rng & 0x3F)
    if a full Overdrive gauge is spent: fixed += OD_BONUS     // Int/HD 20, NA/JP 2
    gil = 1
    while fixed + int(gilMotivation(gil) * resistance) < needed_motivation:
        gil *= 2
    gilMotivation(g) = max(0, int(log2(g / K)) * K)           // K: Int/HD 4, NA/JP 2
// 3. compatibility update
compatibility += action.compatibilityModifier
```

| Action | needed motivation | compatibility modifier |
|---|---:|---:|
| Daigoro | 0 | **−1** |
| Kozuka | 32 | 0 |
| Wakizashi (single target) | 48 | **+1** |
| Wakizashi (multi target) | 63 | **+3** |
| **Zanmato** | 80 | **+4** |
| Dismiss | — | 0 |
| Dismiss on his first turn | — | **−3** |
| Auto-dismiss (paid 0 gil) | — | **−20** |

`[single source]` (decompile `data/actions.py::YOJIMBO_ACTIONS`, `events/yojimbo_turn.py`, `constants.py`). Zanmato applies Death at chance **255** — it ignores every instant-death resistance. `[verified: 2 sources]`

---

## 7. Character skill lists (MP, rank, DmgCon, effects)

All rows are decompiled `ffx_command.csv` entries. Unless noted, physical Skills use `Strength` formula, damage type **Physical**, DmgCon **16**, 1 hit, crit-eligible, **inherit weapon elements/status-strikes and weapon bonus crit**, and are affected by Darkness.

### 7.1 Tidus

| Ability | Row | Rank | MP | Target | Damage | Effect |
|---|---:|---:|---:|---|---|---|
| Haste | 54 | **4** | 8 | 1 | CTB, DmgCon 8, heals | **Halves the target's current CTB** + Haste (254). Reflectable, Silence-blocked |
| Hastega | 55 | **6** | 30 | either party | CTB 8, heals | Same, whole party. Reflectable per-target |
| Slow | 56 | 3 | 12 | 1 | CTB, DmgCon 16 | **+100 % of current CTB** + Slow chance 100. Reflectable |
| Slowga | 57 | **4** | 20 | either party | CTB 16 | Same, whole party |
| Delay Attack | 6 | **6** | 8 | 1 | STR 16 | **weak Delay** (+1.5× base CTB) |
| Delay Buster | 7 | **8** | 18 | 1 | STR 16 | **strong Delay** (+3× base CTB) |
| Quick Hit | 21 | **2** (HD/Int) / 1 (NA/JP) | **36** (HD/Int) / 12 (NA/JP) | 1 | STR 16 | Identical to Attack, short recovery |
| Cheer | 26 | 2 | 0 | party | — | Cheer +1 (max 5) — §2.9 |
| Flee | 24 | 2 | 0 | party | — | **Whole party escapes, guaranteed** |
| Provoke | 38 | 3 | 4 | 1 enemy | Strength, **Other**, DmgCon 0 | Provoke (254); clears the enemy's Berserk/Confusion. Always hits |

### 7.2 Wakka

| Ability | Row | Rank | MP | Damage | Status applied |
|---|---:|---:|---:|---|---|
| Dark Attack | 10 | 3 | 5 | STR 16 | Darkness, chance **100**, **3 turns** |
| Dark Buster | 14 | 3 | 10 | STR 16 | Darkness, chance **254** (unconditional), **1 turn** |
| Silence Attack | 9 | 3 | 5 | STR 16 | Silence, 100, 3 turns |
| Silence Buster | 13 | 3 | 10 | STR 16 | Silence, 254, 1 turn |
| Sleep Attack | 8 | 3 | 5 | STR 16 | Sleep, 100, 3 turns |
| Sleep Buster | 12 | 3 | 10 | STR 16 | Sleep, 254, 1 turn |
| Triple Foul | 15 | 3 | 24 | STR 16 | Sleep + Silence + Darkness, each 100, 3 turns |
| Aim | 27 | 2 | 0 | — | Aim +1 (max 5), party |
| Drain | 80 | **2** | 12 | Magic, DmgCon **20**, Magical | Drains HP to the user. Reflectable. Zombie flips the sign |

**Buster vs Attack:** the Busters have chance **254** (bypasses ordinary resistance values but **not** a 255 immunity) at the cost of a 1-turn duration; the Attacks have chance 100 for 3 turns. `[single source]`

### 7.3 Auron

| Ability | Row | Rank | MP | Damage | Effect |
|---|---:|---:|---:|---|---|
| Power Break | 16 | **4** | 8 | STR 16 | Power Break, chance 100, permanent |
| Magic Break | 17 | **4** | 8 | STR 16 | Magic Break, 100 |
| Armor Break | 18 | **4** | 12 | STR 16 | Armor Break, 100 — zeroes DEF **and** cancels Armored |
| Mental Break | 19 | **4** | 12 | STR 16 | Mental Break, 100 — zeroes MDef |
| Full Break | 89 | **5** | **99** | STR 16 | All four Breaks at chance 100; shatter 100 |
| Threaten | 37 | 3 | 12 | no damage | Threaten chance 100 — freezes the enemy until Auron's next turn |
| Guard | 34 | 3 | 0 | — | Intercept all single-target physical attacks on the other two |
| Sentinel | 35 | 3 | 0 | — | Guard + Defend (halved physical) |
| Zombie Attack | 11 | 3 | 10 | STR 16 | Zombie, chance 100, permanent |

### 7.4 Lulu (Blk Magic + specials)

| Spell | Row | Rank | MP | DmgCon | Element / effect |
|---|---:|---:|---:|---:|---|
| Fire / Blizzard / Thunder / Water | 66 / 65 / 67 / 68 | 3 | 4 | 12 | respective element, shatter 10 |
| Fira / Blizzara / Thundara / Watera | 69 / 70 / 71 / 72 | 3 | 8 | 24 | element |
| Firaga / Blizzaga / Thundaga / Waterga | 73 / 74 / 75 / 76 | 3 | 16 | 42 | element |
| Bio | 77 | 3 | 10 | 0 | Poison, chance **254** |
| Demi | 78 | 3 | 32 | 4 | **Percentage Current 25 %**, all enemies, **not reflectable** |
| Death | 79 | 3 | 20 | 0 | Death, chance **80** |
| Drain | 80 | **2** | 12 | 20 | drains HP |
| Osmose | 81 | **2** | **0** | 10 | drains MP |
| Flare | 82 | **5** | 54 | 60 | single target, non-elemental |
| Ultima | 83 | **6** | 90 | 70 | **all enemies**, non-elemental, **not reflectable** |
| Focus | 28 | 2 | 0 | — | Focus +1 (max 5), party |
| Reflex | 29 | 2 | 0 | — | Reflex +1 (max 5), party |
| Doublecast | 41 | 3 | 0 (+ both spells' MP) | — | Two Blk Magic casts at a **fixed rank 3** |

All single-target Blk Magic is reflectable and Silence-blocked; **Demi and Ultima are not reflectable** because they target the whole party at once. `[verified: 2 sources]`

### 7.5 Yuna (Wht Magic + Pray)

| Spell | Row | Rank | MP | Formula / DmgCon | Effect |
|---|---:|---:|---:|---|---|
| Cure | 43 | 3 | 4 | Healing 24 | see §2.8 |
| Cura | 44 | 3 | 10 | Healing 40 | |
| Curaga | 45 | 3 | 20 | Healing 80 | |
| Esuna | 51 | 3 | 5 | removes | Petrify, Poison, Confuse, Berserk, Sleep, Silence, Darkness, Slow. **NOT Zombie, NOT Curse** |
| Life | 52 | 3 | 18 | %Total **8** | Revive at **50 %** max HP; `misses_if_target_alive`; **kills a living Zombie** |
| Full-Life | 53 | 3 | 60 | %Total **16** | Revive at **100 %** max HP; same Zombie behaviour |
| NulBlaze / NulFrost / NulShock / NulTide | 47 / 46 / 48 / 49 | **2** | **2** | — | one charge, chance 254. **Target: whole party** — see §7.5.1 |
| Protect | 59 | 3 | 12 | — | Protect (254) |
| Shell | 58 | 3 | 10 | — | Shell (254) |
| Reflect | 60 | 3 | 14 | — | Reflect (254) |
| Dispel | 61 | 3 | 12 | removes | 4× Break, Shell, Protect, Reflect, 4× Nul, Regen, Haste, **Curse**. **Not reflectable** |
| Regen | 62 | 3 | **40** | — | Regen, chance 100, **10 turns** |
| Holy | 63 | **4** | **85** | Magic **100**, Holy element | shatter 100 |
| Auto-Life | 64 | 3 | **97** | — | Auto-Life flag; revives at **25 %** max HP when consumed (row 287 = `%Total 4`). **Not reflectable** |
| Pray | 25 | 3 | 0 | Healing **8**, type Other | Small party heal; always hits |

#### 7.5.1 Nul-spell targeting, sourced 2026-09-21 [FFX only, AGENTS.md rule 14]

The row above has no Target column in this corpus (see the note that used to
sit here and in `docs/handoff/chapter-macalania-engine.md` question 1). Two
independent web sources were checked to settle it, both structured
ability-by-ability tables (not a single paraphrased blurb) that also correctly
distinguish Haste (single) from Hastega (whole party) and Shell/Protect/Reflect
(single) from these four — the same pattern this corpus already uses for
Tidus's Haste/Hastega/Slow/Slowga in §7.1:

| Spell | Target | MP | Blocks | Hits blocked |
|---|---|---:|---|---|
| NulBlaze | Whole party | 2 | Fire | 1 |
| NulFrost | Whole party | 2 | Ice | 1 |
| NulShock | Whole party | 2 | Thunder | 1 |
| NulTide | Whole party | 2 | Water | 1 |

Sources (accessed 2026-09-21):

- Final Fantasy Wiki (Fandom), "Wht Magic (Final Fantasy X)":
  <https://finalfantasy.fandom.com/wiki/Wht_Magic_(Final_Fantasy_X)> — "NulBlaze
  ... Bestows NulBlaze status to **all members of a party**. Nullifies
  Fire-elemental damage for one attack." Same wording pattern for NulFrost /
  NulShock / NulTide (all-party), contrasted on the same page with Shell /
  Protect / Reflect ("Bestows [status] to **a** [target/party member]") and
  Haste ("to **one** target") vs Hastega ("to all members of a party").
- GameFAQs, *Final Fantasy X / X-2 HD Remaster Walkthrough & Guide* (PC), by
  bover_87, "Abilities":
  <https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/79145/abilities>
  — "NulBlaze ... Grants NulBlaze status to **all allies**, granting Immunity
  to one Fire-elemental attack." Same wording for NulFrost / NulShock /
  NulTide, and the same FAQ explicitly gives Shell / Protect / Reflect /
  Auto-Life / Regen as "Grants [status] to **one** character" for contrast.

A third, less structured source (jegged.com's White Magic sphere-grid page)
was also checked and is not treated as a disagreement: its one-line in-game
quoted description reads *"Nullifies one fire attack **on party**"* (matching
whole-party), while only its own paraphrased "EFFECT" prose says "a team
member" — an internal inconsistency in that source's own wording, not a
second reading backed by a structured table the way the two sources above are.

**Both structured sources agree: whole party, not single-ally.** Per AGENTS.md
rule 6 this replaces the shipped `single-ally` estimate in
`src/data/ffx/abilities/whitemagic-protect.ts` with `targeting: 'all-allies'`;
MP (2), rank (2) and the one-charge/chance-254 status application are
unchanged. `docs/handoff/chapter-macalania-engine.md` question 1 is settled by
this section.

### 7.6 Rikku

| Ability | Row | Rank | MP | Effect |
|---|---:|---:|---:|---|
| Steal | 22 | 3 | 0 | Steal an item. **Full roll in §7.8** |
| Use | 23 | **2** | 0 | Use the "special items" submenu (gems, tablets, distillers, springs…) |
| Mug | 20 | 3 | 10 | Attack (STR 16) **and** steal in one action — the steal half uses the **identical** roll and shares the same counter (§7.8) |
| Luck | 30 | 2 | 0 | Luck +1 (max 5), party — §2.9 |
| Bribe | 42 | 3 | 0 | Pay gil to make an enemy leave and drop an item. `ignores_armored`. **Full formula in §7.8** |
| Copycat | 40 | 3 | **28** | Repeat the previous ally action at a **fixed rank 3** |
| Spare Change | 36 | 3 | 0 | Damage = `gilThrown // 10`; `never_break_damage_limit`; shatter 100 |
| Pilfer Gil | 88 | 3 | 20 | Steal gil — same roll as Steal, **separate counter** (§7.8) |
| Nab Gil | 94 | 3 | 30 | Attack + steal gil — same roll as Pilfer Gil (§7.8) |
| Quick Pockets | 95 | **1** | **70** | Rank-1 Item command |

### 7.7 Kimahri

| Ability | Row | Rank | MP | Formula / DmgCon | Effect |
|---|---:|---:|---:|---|---|
| Lancet | 32 | **2** | 0 | Magic **6**, damage type **Other**, ignores Armored, always hits | Drains **both HP and MP** (independent rolls). Learns a Ronso Rage where available. Zombie on either side flips both signs |
| Jump | 104 | 3 | 0 (full gauge) | Strength 32, Other, crit | see §5.8 |
| Extract Power / Mana / Speed / Ability | 90 / 91 / 92 / 93 | 3 | **1** | STR 16 | Attack + the corresponding Distiller flag (enemy drops that sphere type on death) |
| Scan | 50 | 3 | 1 | — | Scan status |
| Jinx | 31 | 2 | 0 | — | Jinx +1 on all enemies (max 5) |

---

### 7.8 Steal, Mug, Bribe and the gil-steal family — exact rolls

The previous revision defined Steal only as "success chance halves after each success" with no base chance and Bribe as "pay gil to make an enemy leave" with no formula. Both are fully decompiled. `[verified: 2 sources]` throughout this section (decompile `events/steal.py` and `events/bribe.py` at the pinned commit; Fandom's Bribe page independently publishes the resulting 25/50/75/100 % chance curve, which the decompiled expression reproduces exactly — see the derivation below).

#### 7.8.1 Steal / Mug

```python
# events/steal.py, pinned commit
rng_steal    = rng(10) % 255                        # 0..254
steal_chance = monster.steal.base_chance // (2 ** successful_steals)
if steal_chance > rng_steal:
    rng_rarity = rng(11) & 255                      # 0..255
    item = (rng_rarity < 32) ? steal.items[RARE] : steal.items[COMMON]
else:
    item = None                                     # failure
```

**Three things this settles:**

1. **The base chance is a per-monster byte** (`steal.base_chance`), and the per-boss "steal base chance 255" bytes the encounter chapters carry now have a formula to feed. `255` means **guaranteed on the first attempt** — `rng_steal` maxes at 254, so `255 > rng_steal` always holds.
2. **The halving is integer division on the base, keyed to *successes only*.** A failed steal does **not** advance `successful_steals`, so the player may retry at the same odds indefinitely. (Contrast Threaten, §4.4, which also decays on success only but by ×0.7.)
3. **Rare vs common is an independent 32/256 = 12.5 % roll**, made only after the steal has already succeeded. It is not affected by the steal counter.

**Resulting chance schedule for a `base_chance = 255` boss** (the case all three encounter chapters need):

| Successful steals so far | `steal_chance` | Success probability |
|---:|---:|---:|
| 0 | 255 | **100 %** |
| 1 | 127 | 127/255 = **49.8 %** |
| 2 | 63 | **24.7 %** |
| 3 | 31 | **12.2 %** |
| 4 | 15 | **5.9 %** |
| 5 | 7 | **2.7 %** |
| 6 | 3 | **1.2 %** |
| 7 | 1 | **0.4 %** |
| 8+ | 0 | **0 % — permanently impossible** |

So a boss with base 255 yields at most **8 steals in a battle**, and realistically 2–3. The Elixir from Seymour Flux, the Stamina Tablet / Farplane Wind from Yunalesca and the Turbo Ether / Elixir from Braska's Final Aeon are therefore **guaranteed on the first steal** and progressively unlikely after — which is the intended reward shape.

| Related ability | Roll | Counter |
|---|---|---|
| **Steal** (row 22) | as above | the monster's `successful_steals` |
| **Mug** (row 20) | attack resolves first, then the **identical** steal roll | **shares** the Steal counter |
| **Pilfer Gil** (row 88) | same expression against the monster's gil-steal byte | **separate** counter |
| **Nab Gil** (row 94) | attack + the Pilfer Gil roll | shares the Pilfer Gil counter |

`[verified: 2 sources]` for Steal/Mug; `[estimate]` for the claim that the gil family uses a *separate* counter — the decompile models only item steals, but the two abilities draw from a distinct per-monster byte, so a shared counter would let an item steal lock out a gil steal, which no guide reports.

**Auto-abilities** — these now have something to modify: `[verified: 2 sources]`

| Auto-ability | Effect | Implementation |
|---|---|---|
| **Master Thief** | Steals are **always rare** | force the rarity branch to `RARE`; do **not** touch `steal_chance` |
| **Pickpocket** | Raises the rare-item rate | raise the rarity threshold from 32 to **128** (⇒ 50 %). `[estimate]` — the multiplier is not published; 4× is the common community figure |
| **Initiative / First Strike** | unrelated to stealing | — |

#### 7.8.2 Bribe

```python
# events/bribe.py, pinned commit
if game_version in (HD, PS2INT) and gil < 1: return None      # HD/Int reject a 0-gil offer
if monster.immune_to_bribe or SLEEP in monster.statuses: return None

gil    = offeredGil + monster.bribe_gil_spent                  # running total, see below
chance = int(gil * 256 / monster.maxHP / 20) - 64
if (rng & 255) >= chance: return None                          # failure

quantity = int(sqrt(chance) * item.quantity * 0.0625
               * ((rngA % 11) + 20) / 25
               + (rngB & 1))
quantity = min(max(1, quantity), 99)
monster.statuses[EJECT] = 254                                  # the enemy leaves
```

**Derivation — the decompiled expression and the published guide curve are the same thing.** Substituting `gil = k × maxHP`:

| Offer | `chance` | Success | Fandom's published figure |
|---|---:|---:|---|
| maxHP × 5 | 0 | **0 %** | (below any listed threshold) |
| maxHP × 10 | 64 | **25 %** | "x10 Max HP = 25%" ✓ |
| maxHP × 15 | 128 | **50 %** | "x15 Max HP = 50%" ✓ |
| maxHP × 20 | 192 | **75 %** | "x20 Max HP = 75%" ✓ |
| **maxHP × 25** | 256 | **100 %** | "x25 Max HP = 100%" ✓ |

All four agree exactly. **This confirms the `HP × 25` figure `ffx-yunalesca.md` mentions in passing** and supplies the success rule that chapter lacked. `[verified: 2 sources]`

Rules that follow, all of which matter:

* **Nothing below `maxHP × 5` can ever succeed** (`chance ≤ 0`).
* **Gil accumulates across failed attempts on the same enemy.** A failed bribe is not refunded but *is* banked in `monster.bribe_gil_spent`. Offering 120 000 and failing, then offering 1 gil, is evaluated as **120 001**. The documented exploit is to over-offer once and then spam 1-gil bribes until it lands — reproduce this, it is load-bearing for the economy.
* **Sleeping enemies cannot be bribed and the gil is still consumed.**
* **Version split:** in the original JP release the 100 % point is `maxHP × 20`; every later version uses `× 25`. English guides still print the × 20 values, so a guide disagreeing with the table above is quoting JP. See §0 V12.
* **HD/International reject an offer of 0 gil outright** before any roll. See §0 V13.
* **On success the enemy gains Eject (254) and leaves**, and drops its bribe item; the kill is processed as a **normal kill** for drop/AP purposes.
* **Item quantity is random**, scaling with `sqrt(chance)` — so over-paying past 100 % still buys *more items*, it just stops buying more certainty. `(rngA % 11) + 20` spans 20–30 against a divisor of 25, i.e. a **±20 % variance band**.

---

## 8. Items — full effect table

All items are **rank 2**, all carry `ignores_armored` and (except Dark Matter) `never_break_damage_limit`. `Fixed` damage = `DmgCon × 50 × (rng+240) // 256`; `Fixed (no variance)` = `DmgCon × 50` flat. Item source: decompiled `ffx_item.csv`. `[verified: 2 sources]` for the marquee values (guides agree); `[single source]` for the raw DmgCon bytes.

### 8.1 Restoratives

| Item | Row | Target | Formula | DmgCon | Exact effect |
|---|---:|---|---|---:|---|
| Potion | 0 | 1 ally | Fixed-no-var | 4 | **+200 HP** |
| Hi-Potion | 1 | 1 ally | Fixed-no-var | 20 | **+1 000 HP** |
| X-Potion | 2 | 1 ally | %Total | 16 | **full HP** |
| Mega-Potion | 3 | party | Fixed-no-var | 40 | **+2 000 HP** each |
| Ether | 4 | 1 ally | Fixed-no-var (MP) | 2 | **+100 MP** |
| Turbo Ether | 5 | 1 ally | Fixed-no-var (MP) | 10 | **+500 MP** |
| Elixir | 8 | 1 ally | %Total HP+MP | 16 | full HP **and** MP |
| Megalixir | 9 | party | %Total HP+MP | 16 | full HP and MP, all |
| Phoenix Down | 6 | 1 KO'd ally | %Total | 8 | revive at **50 %** max HP; misses living targets; **kills a living Zombie** |
| Mega Phoenix | 7 | party | %Total | 16 | revive at **100 %** max HP; misses living; kills living Zombies |
| Al Bhed Potion | 20 | party (via **Use**) | Fixed-no-var | 20 | **+1 000 HP** and removes Petrify, Poison, Silence |
| Healing Water | 21 | party (Use) | %Total | 16 | full HP, party |
| Tetra Elemental | 22 | 1 ally (Use) | %Total | 16 | full HP + all four Nul charges |

**Zombie rule for every one of these:** HP-restoring items *damage* a Zombie for the same amount; revival items *kill* it. Ether/Elixir MP restoration also inverts on a Zombie. `[verified: 2 sources]`
**Hi-Potion on a Zombie** therefore deals exactly **1 000 damage** — a standard way to finish a zombified ally you cannot cure.

### 8.2 Status cures and utility

| Item | Row | Target | Effect |
|---|---:|---|---|
| Antidote | 10 | 1 ally | remove Poison |
| Soft | 11 | 1 ally | remove Petrify |
| Eye Drops | 12 | 1 ally | remove Darkness |
| Echo Screen | 13 | 1 ally | remove Silence |
| **Holy Water** | 14 | 1 ally | remove **Zombie + Curse** |
| **Remedy** | 15 | 1 ally | remove Zombie, Petrify, Poison, Confuse, Berserk, Sleep, Silence, Darkness, Slow |
| Chocobo Feather | 54 | 1 ally | CTB 8 (heals) → **halve current CTB** + Haste |
| Chocobo Wing | 55 | party | same, whole party |
| Lunar Curtain | 56 | 1 ally | Shell (254) |
| Light Curtain | 57 | 1 ally | Protect (254) |
| Star Curtain | 58 | 1 ally | Reflect (254) |
| Healing Spring | 59 | 1 ally | Regen, **10 turns** |
| Stamina Tablet | 64 | 1 ally | **MAX HP ×2** (no immediate heal; cleared by KO) |
| Mana Tablet | 65 | 1 ally | MAX MP ×2 |
| Twin Stars | 66 | 1 ally | **MP cost = 0** |
| Stamina Tonic | 67 | party | MAX HP ×2 |
| Mana Tonic | 68 | party | MAX MP ×2 |
| Three Stars | 69 | party | MP cost = 0 |
| Candle of Life | 48 | 1 enemy | apply **Doom** |
| Power / Mana / Speed / Ability Distiller | 16–19 | 1 enemy | the enemy drops that sphere type on death |

### 8.3 Offensive items (via **Use**)

| Item | Row | Target | Formula | DmgCon | Base damage | Extra |
|---|---:|---|---|---:|---:|---|
| Grenade | 35 | all enemies | Fixed | 7 | **350** | crit-eligible |
| Frag Grenade | 36 | all enemies | Fixed | 16 | **800** | crit; **Armor Break** 254 |
| Sleeping Powder | 37 | all enemies | Fixed | 15 | **750** | Sleep 254 / **5 turns** |
| Dream Powder | 38 | all enemies | Fixed | 20 | **1 000** | Sleep 254 / **8 turns** |
| Silence Grenade | 39 | all enemies | Fixed | 15 | **750** | Silence 254 / **8 turns** |
| Smoke Bomb | 40 | all enemies | Fixed | 15 | **750** | Darkness 254 / **8 turns** |
| Petrify Grenade | 49 | all enemies | — | 0 | — | **Petrify 254** (no damage) |
| Poison Fang | 45 | 1 enemy | Fixed | 40 | **2 000** | Poison 254 |
| Antarctic Wind / Bomb Fragment / Electro Marble / Fish Scale | 23 / 26 / 29 / 32 | 1 enemy | Fixed | 12 | **600** | Ice / Fire / Thunder / Water |
| Arctic Wind / **Bomb Core** / Lightning Marble / Dragon Scale | 24 / 27 / 30 / 33 | 1 enemy | Fixed | 20 | **1 000** | Ice / **Fire** / Thunder / Water |
| **Ice / Fire / Lightning / Water Gem** | 25 / 28 / 31 / 34 | random enemies | Fixed | 12 | **600 × 5 hits** | respective element; **no crit** |
| Shadow Gem | 41 | all enemies | %Current | 8 | **50 % of current HP** | |
| Shining Gem | 42 | 1 enemy | Fixed | 120 | **6 000** | |
| Blessed Gem | 43 | 1 enemy | Fixed | 160 | **8 000** | Holy |
| Supreme Gem | 44 | all enemies | Fixed | 200 | **10 000** (→ capped 9 999) | |
| **Purifying Salt** | 63 | 1 enemy | Fixed | 22 | **1 100** | **also removes** Shell, Protect, Reflect, 4× Nul, Regen, Haste |
| Silver Hourglass | 46 | all enemies | CTB | 8 | **+50 % of current CTB** | Slow 254 |
| Gold Hourglass | 47 | all enemies | Fixed | 20 | **1 000** | Slow 254 |
| Farplane Shadow | 50 | 1 enemy | — | 0 | — | Death chance 100 |
| Farplane Wind | 51 | random enemies | — | 0 | — | Death chance 100, **4 hits** |
| **Mana Spring** | 60 | 1 enemy | Fixed (MP), drains | 20 | **1 000 MP** drained to the user | |
| **Stamina Spring** | 61 | 1 enemy | Fixed (HP), drains | 8 | **400 HP** drained | |
| **Soul Spring** | 62 | 1 enemy | Fixed (HP+MP), drains | 30 | **1 500 HP and 1 500 MP** drained | |
| Dark Matter | 53 | all enemies | Fixed | **255** | **12 750**, `always_break_damage_limit` | |

---

## 9. Equipment auto-abilities (numeric)

Equipment in FFX **does not change stats**; it grants auto-abilities only. `[verified: 2 sources]`

| Ability | Exact numeric behaviour |
|---|---|
| **Sensor** | Reveals target's current/max HP, elemental affinities and statuses. No combat effect. |
| **First Strike** | The character's initial CTB is **0** in every encounter condition, including Ambush. Enemy First Strike outranks the party's. |
| **Initiative** | Subtracts **33** from the encounter-condition roll (`0–255`): preemptive 32→65/256 (**25.4 %**), ambush eliminated. Only needs one active party member. |
| **Piercing** | Skips the `//3` Armored reduction (step 10). Nothing else. |
| **Strength +3 % / +5 % / +10 % / +20 %** | `dmg += dmg × N // 100` on **Physical-type** damage only. Does **not** raise the Strength stat, does **not** affect Overdrives/Mixes (type Other). |
| **Magic +3/5/10/20 %** | Same, on **Magical-type** damage only (including magical healing and Auto-Life's revive amount). |
| **Defense +3/5/10/20 %** | `dmg -= dmg × N // 100` on incoming **Physical** damage. |
| **Magic Def +3/5/10/20 %** | Same, on incoming **Magical** damage. |
| **HP +5/10/20/30 %** | `maxHP = baseHP × (100+N) // 100`, clamped to 9 999 (99 999 with Break HP Limit). |
| **MP +5/10/20/30 %** | `maxMP = baseMP × (100+N) // 100`, clamped 999 (9 999 with Break MP Limit). |
| **Break HP Limit / Break MP Limit** | Raises those caps to 99 999 / 9 999. |
| **Break Damage Limit** | User's damage & healing cap becomes **99 999**. Does not override an action's `never_break_damage_limit` (items, most mixes). |
| **One MP Cost** | Every MP-costing ability costs exactly **1**. |
| **Half MP Cost** | `cost // 2`. Applied **after** Magic Booster's doubling. |
| **Magic Booster** | Magical damage `× 1.5`; Blk/Wht Magic MP cost `× 2`. |
| **Alchemy** | Recovery **items** (heal-flagged `Fixed (no variance)` / `Percentage Total`) restore **×2**. Does not extend to Mixes. |
| **Counterattack** | Automatic Attack against the aggressor after any physical attack. The counter action has `ctb = 0` (costs no turn). |
| **Evade & Counter** | Evades a standard physical attack **and** counters; the counter fires even when the evade fails. |
| **Magic Counter** | Counters magical attacks the same way. |
| **Auto-Potion** | When damage leaves the user below 50 % max HP, automatically consumes the **weakest available potion** (Potion → Hi-Potion → X-Potion). Counter-class action, no turn cost. |
| **Auto-Med** | Automatically consumes a status cure when afflicted with Darkness, Silence, Poison or Zombie. |
| **Auto-Phoenix** | Automatically uses a Phoenix Down on any KO'd ally, provided the user was not killed by the same attack. |
| **Auto-Haste / Auto-Protect / Auto-Shell / Auto-Regen / Auto-Reflect** | Applies that status permanently (stack 255) at the start of every battle and re-applies after revival. Auto-Haste therefore makes the wearer **immune to Slow**. |
| **SOS Haste / Protect / Shell / Regen / Reflect / NulTide / NulFrost / NulShock / NulBlaze** | Applies that status (stack 255) whenever current HP < 50 % of max, re-checked at the start of every turn. SOS Nul-versions nullify **all** attacks of that element, not one charge. |
| **Stonestrike / Deathstrike / Zombiestrike / Poisonstrike / Sleepstrike / Silencestrike / Darkstrike / Slowstrike** | Weapon adds that status at chance **100** (stack 254) to every weapon-property attack. |
| **…touch variants** | Same at chance **50**. Touch + Strike on one weapon = **150** cumulative. |
| **Stoneproof / Deathproof / Zombieproof / Poisonproof / Sleepproof / Silenceproof / Darkproof / Slowproof / Confuseproof / Berserkproof / Curseproof** | Sets that status's resistance to **255** = absolute immunity (except to chance-255 applications). |
| **…Ward variants** | Sets resistance to **50** (subtractive) — fully blocks any chance-50 application, halves a chance-100 one. |
| **Ribbon** | Resistance 255 for Zombie, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, **Doom**. Does **not** cover Death, the four Breaks, Curse, Delay, Eject. |
| **Aeon Ribbon** | Ribbon's list **plus** Death, all four Breaks, Scan and the four Distillers. |
| **Firestrike / Icestrike / Lightningstrike / Waterstrike** | Adds that element to every weapon-property attack (so it can be Nul'd, resisted, or absorbed). |
| **Fire/Ice/Lightning/Water Ward** | That element's affinity becomes **Resists (×0.5)**. |
| **…proof** | Affinity becomes **Immune (×0)**. |
| **…Eater** | Affinity becomes **Absorbs (×−1)** — but an active Nul status of that element overrides and nullifies instead. |
| **Double Overdrive / Triple Overdrive** | Gauge gain ×2 / ×3. |
| **SOS Overdrive** | Gauge charges only while in Critical (< 50 % HP), at a boosted rate. |
| **Overdrive → AP** | Gauge gain is converted to AP instead of filling the gauge; multiplies with Double/Triple Overdrive. |
| **Double AP / Triple AP / No AP** | Post-battle AP ×2 / ×3 / 0. |
| **Capture** | Fiends reduced to 0 HP are captured instead of killed. |
| **No Encounters** | Suppresses random encounters on the field. |
| **Gillionaire** | Doubles gil rewards. |
| **HP Stroll / MP Stroll** | Regenerate HP/MP while walking on the field. |
| **Master Thief / Pickpocket** | Steal always gets the rare item / raises rare-steal chance. |

Sources: decompiled `data/autoabilities.py` + `data/actor.py::_update_abilities_effects` + `get_damage`; <https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_auto-abilities>. `[verified: 2 sources]`

---

## 10. Sphere Grid

### 10.1 Rules

* **AP → Sphere Levels.** Every party member who took **at least one full turn** earns AP at the end of a battle. Characters switched out during their first turn, KO'd, or petrified at the end earn nothing. If an aeon lands the kill, **Yuna counts as having acted** even if she only summoned. `[verified: 2 sources]`
* AP needed for the *next* S.Lv:
  ```
  apForLevel(sLv) = min( 5*(sLv+1) + floor(sLv³ / 50), 22000 )
  ```
  Reference values: S0 = 5, S48 = 2 456, S100 = 20 505, S101 = 21 116, S102 = 21 739, S103 = 22 000 (cap). `[single source]` (decompile `data/characters.py::s_lv_to_ap`). The Fandom stats page states an abrupt cap "after 101 levels" — see §11 C3.
* **Movement.** One S.Lv = move **one node** onto an *unconnected* node. Moving back along a path the character has already travelled costs one S.Lv per **four** nodes. Passing a node does not activate it. `[verified: 2 sources]`
* **Activation** costs the matching sphere and is **per-character**; the movement/path colouring is per-character; **lock removals and creation-sphere content changes are global**.
* **Locks.** Lv. 1–4 Key Spheres open the matching lock. **A removed lock becomes an empty node**, which a purple creation sphere can then fill with a stat node. Implement lock → empty → creation → activation as four distinct states. `[verified: 2 sources]` (Ceebs's Sphere Grid research + Fandom)
* **Node values.** Native HP nodes **+200**, MP **+20**, other stats **+1…+4**. Purple-sphere creations are stronger: HP **+300**, MP **+40**, all others **+4**. `[verified: 2 sources]`
* **Caps.** HP 9 999 (99 999 with Break HP Limit), MP 999 (9 999), every other stat **255**. Agility above 170 only affects the opening turn. `[verified: 2 sources]`
* **Grid variants.** Regular (original JP/NA) = 828 nodes; **Standard (International/PAL/HD) = 860 nodes**; Expert = 805 nodes. `[verified: 2 sources]`

### 10.2 Sphere types

| Category | Spheres | Function |
|---|---|---|
| Red (activation) | Power, Mana, Speed, Ability, **Fortune** | Power → STR/DEF/HP; Mana → MAG/MDEF/MP; Speed → AGI/ACC/EVA; Ability → Skill/Special/Wht/Blk nodes; Fortune → **Luck** nodes (rarest) |
| Key | Lv. 1 / 2 / 3 / 4 Key Sphere | Opens the matching lock (globally) |
| Purple (creation) | HP, MP, Strength, Defense, Magic, Magic Def, Agility, Evasion, Accuracy, Luck | Turns an **empty** node into a stat node (+300 HP / +40 MP / +4 otherwise) |
| Yellow (remote activation) | Attribute, Special, Skill, Wht Magic, Blk Magic, **Master** | Activate any node of that class that **another character already activated**, regardless of distance |
| Light blue (movement) | Return, Friend, Teleport, Warp | Warp to own activated node / to an ally / to an ally-activated node / anywhere |
| Clear | Clear Sphere | Wipes a stat node's content (not abilities, not locks); 10 000 gil at the Monster Arena |

`[verified: 2 sources]`

### 10.3 The Standard-HD graph file — **now vendored into this repository**

> **BLOCKER RESOLVED.** The grid data no longer lives outside this repository. It has been copied to:
>
> * **`D:/Final Fantasy/research/data/standard-hd-graph.json`** — 860 nodes / 881 links / 98 clusters (436 KB)
> * **`D:/Final Fantasy/research/data/aeon-growth-reference.json`** — the §6.4 coefficients, machine-readable
> * **`D:/Final Fantasy/research/data/LICENSE-FFX-SPHERE-GRID-VIEWER.txt`** — MIT © 2024 Grayfox96; **ship this file alongside any build that embeds the graph**
>
> Source of truth: Grayfox96's **FFX-Sphere-Grid-viewer**, commit `c191aa6e2c46debb58610e2b90e230204f55e7b1`, converted from `clusters_dat02.csv` / `nodes_dat02.csv` / `links_dat02.csv` / `dat10.csv` / `panel.csv`. The §10.3.4 inventories below are **generated from that file**, so §10 is now self-sufficient for ability gating and levelling even without opening the JSON.

**Top level**
```jsonc
{
  "source": "https://github.com/Grayfox96/FFX-Sphere-Grid-viewer",
  "commit": "c191aa6e2c46debb58610e2b90e230204f55e7b1",
  "license": "MIT; copyright (c) 2024 Grayfox96; see LICENSE-FFX-SPHERE-GRID-VIEWER.txt",
  "variant": "Standard International / HD",
  "files":  ["clusters_dat02.csv","nodes_dat02.csv","links_dat02.csv","dat10.csv","panel.csv"],
  "counts": { "nodes": 860, "links": 881, "clusters": 98 },
  "nodes":  [ /* 860 */ ],
  "links":  [ /* 881 */ ],
  "clusters": [ /* 98 */ ]
}
```

#### 10.3.1 `nodes[i]` field contract (verified against the file)

| Field | Type | Meaning |
|---|---|---|
| `id` | int 0–859 | Stable node id = CSV row index. Also used inside `links[]` and `nodes[].links` |
| `x`, `y` | signed int | Layout coordinates (roughly ±900). **y grows downward** |
| `cluster` | int 0–97 | Index into `clusters[]` |
| `typeId` | int | Raw panel type id (1 = Empty, 2 = Strength, 6 = Defense, 39 = Lv.1 Lock, 62 = Special ability, …) |
| `name` | string | Display name ("Empty Node", "Lv. 1 Lock", "Cheer", "Defense +1") |
| `appearance` | enum | `EMPTY_NODE, HP, MP, STRENGTH, DEFENSE, MAGIC, MAGIC_DEFENSE, AGILITY, EVASION, ACCURACY, LUCK, L_1_LOCK…L_4_LOCK, SPECIAL, SKILL, WHITE_MAGIC, BLACK_MAGIC` |
| `kind` | enum | `"empty"` (191) / `"stat"` (507) / `"ability"` (85) / `"lock"` (77) |
| `sphere` | enum/null | Activating sphere: `power` (217), `mana` (149), `speed` (132), `ability` (85), `fortune` (9), `key1` (12), `key2` (12), `key3` (20), `key4` (33); `null` for empty nodes |
| `lockLevel` | 1–4 / null | Lock level |
| `stat` | enum/null | `maxHp, maxMp, str, def, mag, mdef, agi, evasion, accuracy, luck` |
| `value` | int | Stat amount **already in game units** — HP nodes carry `200`, MP `20`/`40`, all other stats `1–4`. The converter has already applied the `×50` / `×5` scaling: **use `value` directly, do not rescale** |
| `commandRow` | int/null | **Index into the decompiled `ffx_command.csv` command table** for ability nodes — the same row numbers used in §5 and §7. Derived as `rawLearnedMove − 0x3000`. **Map abilities by this number, never by display name** |
| `rawEffectBits`, `rawLearnedMove` | int | Original panel bytes, kept for auditing |
| `links` | int[] | Adjacent node ids (already reciprocal) |

**`links[j]`**: `{ "a": int, "b": int, "center": int|null }` — `a`/`b` are the movement endpoints; `center` is a **geometry-only** control-point node id for the **411 curved** links (470 are straight, `center: null`). **`center` is not a third endpoint — never treat it as adjacency.**

**`clusters[k]`**: `{ "id": int, "x": int, "y": int, "type": int }` — the 98 circular sub-grids. `type` counts: 0×19, 1×14, 2×9, 3×9, 4×9, 5×18, 6×10, 7×10.

#### 10.3.2 Loading recipe

1. `JSON.parse` once at build time; build `Map<id, Node>` and an adjacency list from `links` (or just use `node.links`, which is pre-computed and reciprocal).
2. Keep the file **immutable**. Per-save mutable state is: `activatedBy[nodeId] : Set<characterId>`, `removedLocks : Set<nodeId>`, `contentOverride[nodeId] : {stat, value}` (creation spheres), `position[characterId] : nodeId`, `travelled[characterId] : Set<edgeKey>`, unspent S.Lv, and the sphere inventory.
3. Resolve an ability node's action by `commandRow` against your command table.
4. Assert the §10.3.4 census on load — it is a complete checksum of the file, not a spot-check.

#### 10.3.3 Starting nodes — status corrected

| Character | Node id | What is actually at that id | Cluster |
|---|---:|---|---:|
| Tidus | 0 | Empty Node | 4 |
| Yuna | 342 | Empty Node | 5 |
| Auron | 540 | Empty Node | 27 |
| Kimahri | 637 | Empty Node (grid centre, `x = −1, y = −84`) | 2 |
| Wakka | 60 | Empty Node | 6 |
| Lulu | 221 | **Thunder** (ability, `commandRow` 67) | 0 |
| Rikku | 450 | **Use** (ability, `commandRow` 23) | 1 |

`[single source]` (save-editing research), **but now partially corroborated**: five of the seven ids resolve to Empty Nodes, which is what a starting position should be, and the two that do not resolve to precisely the ability each character starts the game already knowing (Lulu → Thunder, Rikku → Use). That is exactly the pattern you would expect if a character begins *standing on* their innate ability node with it pre-activated. Kimahri's id lands at the geometric centre of the grid, which is his documented Standard-Grid start.

**Normative reading:** treat these as the starting **positions**, and additionally mark node 221 activated for Lulu and node 450 activated for Rikku at new-game time. `[estimate]` — the starting *activation bits* were not independently decoded; this is the reading most consistent with the data and with in-game behaviour. Keep it behind a named constant so it can be corrected.

#### 10.3.4 Generated inventories (checksums for the loader)

**Node census** — 860 total: 507 stat, 191 empty, 85 ability, 77 lock.

**Locks** (77): Lv.1 ×12, Lv.2 ×12, Lv.3 ×20, Lv.4 ×33.

**Stat nodes by type and value** (507):

| Stat | Sphere | +1 | +2 | +3 | +4 | total nodes | total if all activated |
|---|---|---:|---:|---:|---:|---:|---:|
| maxHp | power | — | — | — | — | 97 (all `+200`) | **+19 400** |
| maxMp | mana | — | — | — | — | 56 (49× `+20`, 7× `+40`) | **+1 260** |
| str | power | 11 | 27 | 5 | 23 | 66 | +172 |
| def | power | 1 | 22 | 19 | 12 | 54 | +150 |
| mag | mana | 2 | 13 | 14 | 18 | 47 | +142 |
| mdef | mana | 6 | 18 | 6 | 16 | 46 | +124 |
| agi | speed | 5 | 20 | 15 | 21 | 61 | +174 |
| evasion | speed | 2 | 17 | 4 | 19 | 42 | +124 |
| accuracy | speed | 4 | 13 | 8 | 4 | 29 | +70 |
| luck | fortune | 4 | 3 | — | 2 | 9 | **+18** |

Sanity readings: only **9 Luck nodes exist on the whole grid** (+18 total), which is why Luck is the scarcest stat and why the Luck *command* (§2.9) matters so much; and the grid's +19 400 HP comfortably overshoots the 9 999 cap, so HP nodes stop mattering long before the grid is exhausted. `[verified: 2 sources]` (generated from the file; totals consistent with §10.1's node-value rules)

**All 85 ability nodes** — `cmd` is `commandRow` (index into `ffx_command.csv`, the same numbering as §5/§7); `node` is the node id. Every ability appears **exactly once** on the Standard grid, so this table is also the complete ability-unlock gating list.

| Ability | cmd | node | Ability | cmd | node | Ability | cmd | node |
|---|---:|---:|---|---:|---:|---|---:|---:|
| Aim | 27 | 74 | Firaga | 73 | 305 | Quick Hit | 21 | 377 |
| Armor Break | 18 | 582 | Fire | 66 | 220 | Quick Pockets | 95 | 850 |
| Auto-Life | 64 | 705 | Flare | 82 | 333 | Reflect | 60 | 400 |
| Bio | 77 | 279 | Flee | 24 | 6 | Reflex | 29 | 261 |
| Blizzaga | 74 | 306 | Focus | 28 | 236 | Regen | 62 | 427 |
| Blizzara | 70 | 252 | Full Break | 89 | 835 | Scan | 50 | 648 |
| Blizzard | 65 | 222 | Full-Life | 53 | 721 | Sentinel | 35 | 634 |
| Bribe | 42 | 527 | Guard | 34 | 10 | Shell | 58 | 384 |
| Cheer | 26 | 3 | Haste | 54 | 13 | Silence Attack | 9 | 65 |
| Copycat | 40 | 674 | Hastega | 55 | 121 | Silence Buster | 13 | 168 |
| Cura | 44 | 146 | Holy | 63 | 444 | Sleep Attack | 8 | 81 |
| Curaga | 45 | 420 | Jinx | 31 | 653 | Sleep Buster | 12 | 180 |
| Cure | 43 | 335 | Lancet | 32 | 636 | Slow | 56 | 46 |
| Dark Attack | 10 | 57 | Life | 52 | 350 | Slowga | 57 | 96 |
| Dark Buster | 14 | 152 | Luck | 30 | 460 | Spare Change | 36 | 466 |
| Death | 79 | 745 | Magic Break | 17 | 557 | Steal | 22 | 449 |
| Delay Attack | 6 | 26 | Mental Break | 19 | 595 | Threaten | 37 | 576 |
| Delay Buster | 7 | 111 | Mug | 20 | 489 | Thundaga | 75 | 302 |
| Demi | 78 | 287 | Nab Gil | 94 | 851 | Thundara | 71 | 246 |
| Dispel | 61 | 405 | NulBlaze | 47 | 337 | Thunder | 67 | 221 |
| Doublecast | 41 | 786 | NulFrost | 46 | 339 | Triple Foul | 15 | 212 |
| Drain | 80 | 155 | NulShock | 48 | 338 | Ultima | 83 | 641 |
| Entrust | 39 | 774 | NulTide | 49 | 340 | Use | 23 | 450 |
| Esuna | 51 | 336 | Osmose | 81 | 188 | Water | 68 | 223 |
| Extract Ability | 93 | 832 | Pilfer Gil | 88 | 844 | Watera | 72 | 748 |
| Extract Mana | 91 | 652 | Power Break | 16 | 541 | Waterga | 76 | 307 |
| Extract Power | 90 | 547 | Pray | 25 | 273 | Zombie Attack | 11 | 762 |
| Extract Speed | 92 | 829 | Protect | 59 | 389 |  |  |  |
| Fira | 69 | 251 | Provoke | 38 | 21 |  |  |  |

`[verified: 2 sources]` — generated from the vendored file; all 27 of the previously-listed sanity ids (Cheer 3, Haste 13, Hastega 121, Quick Hit 377, Cure 335, Curaga 420, Regen 427, Holy 444, Steal 449, Use 450, Sentinel 634, Lancet 636, Scan 648, Thundaga 302, Firaga 305, Blizzaga 306, Waterga 307, Mug 489, Full Break 835, Doublecast 786, Ultima 641, Auto-Life 705, Full-Life 721, Death 745, Zombie Attack 762, Flare 333, Entrust 774) were re-checked against the file by name and **all 27 match**.

Companion memo: **`D:/Projects/Final Fantasy/Moonpetal/docs/STANDARD-GRID-RESEARCH.md`** (variant selection — `dat02`/`dat10` is Standard, `dat01`/`dat09` the original PS2 grid, `dat03`/`dat11` Expert; conversion contract; a proposed route and the derived pre-equipment stat block for all seven characters).

---

## 11. Recorded conflicts between sources

| # | Topic | Source A (decompile, pinned) | Source B | Recommendation |
|---:|---|---|---|---|
| **C1** | Wakka reel **rank** | Resolved shot rows 239–254 and Attack Reels 302 all specify **rank 3** | Fandom rank table and Kuronoe77's Overdrive database both say **4** (with the note "Slots shows rank 5 on the CTB bar") | Unresolved. Implement rank 4 if you want to match the visible guides; rank 3 matches the data. A CTB trace at known AGI with no Haste distinguishes them. |
| **C2** | Mix **Mega Phoenix** revive % | Item row 7 and command row 175 both: `Percentage Total`, DmgCon 16 = **100 %** max HP | Several guides (SuperCheats table, KeyBlade999 Mix text) say **50 %** | Use **100 %**. The 50 % figure is the *Phoenix Down* value (DmgCon 8) leaking into the Mix description. Fandom's Mix page also says "full HP". |
| **C3** | AP cap boundary | `min(5*(sLv+1) + sLv³//50, 22000)` — reaches 22 000 at **S103** | Fandom stats page: "always 22,000 after 101 levels"; Terence Fergusson's older write-up says an abrupt cap at S101 | Use the decompile formula; note the boundary is unverified between S101 and S103. |
| **C4** | Low-Agility base ticks | `ICV_BASE[0..3] = 28, 28, 26, 24` (Agi0=28, Agi1=28, Agi2=26, Agi3=24). Independently corroborated by Grayfox96's companion site <https://grayfox96.github.io/FFX-Info/mechanics/ctb> ("Agility 1: Base CTB 28"), a separate published decompile-derived resource from the same underlying game code as the RNG-Tracker repo. | SinirothX's Stat Mechanics FAQ (mirrored on GameFAQs/Neoseeker) gives a one-step-shifted table at low Agility with no plateau at Agi 1: Agi0=28, Agi1=26, Agi2=24, Agi3=22, Agi4=20, and says **Haste rounds up** | **CONFLICT, decompile wins**: use the decompile/Grayfox96 values (`floor`, Agi1=28) — two independent decompile-derived sources agree against the single older guide FAQ. Keep a regression fixture. Irrelevant for any realistic party (AGI ≥ 10). |
| **C5** | Strength/Special-Magic power constant | `+0x1E` = **+30** | Widely-circulated FAQ formula `[(Str³/32) + 32]` | Use **+30**. At STR 40 the difference is ~0.04 %; at STR 5 it is ~17 %. |
| **C6** | Luck **command** effect | `+1` to hit chance per stack, **`+10` to crit chance** per stack | Fandom stats page: "increases hit accuracy and critical hit rate by 1 % each" | Use the decompile. The wiki's "1 %" is likely reading only the hit branch. |
| **C7** | Kimahri's **White Wind** | `Healing` formula, DmgCon **40** (MAG-scaled, Cura-strength, party) | SuperCheats table: "Recovers 1/2 HP of Allies" | Use the formula. The "½ HP" phrasing describes the typical outcome, not the rule. |
| **C8** | **Quick Hit** | Rank 2 / 36 MP in the HD build; the parser explicitly synthesises a rank-1 PS2 variant | — | Version-dependent, not a conflict: HD/International = rank 2, 36 MP; original JP/NA = rank 1, 12 MP. |
| **C9** | **Anima's Oblivion** / **Delta Attack** | 16 hits × DmgCon 4 / 6 hits × DmgCon 10 | Original PS2 JP/NA: 1 hit × 75 / 1 hit × 60 | Version-dependent. Use the Int/HD multi-hit versions for this project's baseline. |
| **C10** | Aeon **Overdrive gauge cost** | `od_cost = 20` for aeon Overdrives vs `100` for character Overdrives | No guide quantifies the per-event increment; Fandom *does* document the triggers, Boost ×1.5, Shield-zeroes, reset-on-death and Grand-Summon restore | **RESOLVED into a shipping model — see §6.5.** Keep one 0–100 scale for everybody and multiply aeon increments by `100/20 = 5`. The qualitative rules are `[verified: 2 sources]`; only the 5× increment is `[estimate]`. |
| **C11** | Mega Phoenix / Life on **living Zombies** | `misses_if_target_alive` is set, but the Zombie branch in `_remove_statuses` explicitly KOs a living Zombie | Prototype code filtered on `hp <= 0` and protected them | Revival effects **must** process living Zombies and kill them. |
| **C12** | **Threaten** availability | Party members and aeons have resistance 255 permanently | — | Belgemine's Shiva (Heavenly Strike) is the only enemy source and always fails. Implement Threaten as enemy-only. |

| **C13** | **Overdrive Mode** coefficients | — | Fandom *Overdrive Mode*, published as game-data extracts | **Fandom wins; §5.1 rewritten.** The previous revision of this document had three errors: the **Victim** row was a duplicated copy of the **Sufferer** row; the **Ally** increment (4 %) and **Daredevil** increment (16 %) were the original-JP values, not the baseline ones (3 % / 5 %). Warrior's formula also carried a spurious `× 3`. All corrected. |
| **C14** | **Blitz Ace** hit count | decompile rows 99 + 274 | Fandom *Swordplay*: "**eight** sword attacks" plus the finishing kick | Use **4 × 8 + 24 × 1**. The previous revision's `4 × 9` is unsourced. `[single source]` |
| **C15** | **Tornado** success row | rows 103 = 15, 269 = 15, **273 = 20 (×2)** | Fandom *Bushido*: success "Physical, 20 (2 hits)", fail 15, immune "N/A" | **Resolved, not a conflict.** Tornado has no rider status, so no target is ever "vulnerable" — the engine always takes the *immune* row on success. **Row 273 is Tornado's success row.** |
| **C16** | **Slots** outcome model | — | Fandom *Slots*: "the player can control the outcome completely" | **There is no symbol probability distribution.** Slots is deterministic given player timing; implement reel strips + a spin rate, not weights. See §5.6. |
| **C17** | Aeon stat model — three "rival" figures across chapters | `max(x, y) + z` | `ffx-yunalesca.md` §12 tables; `ffx-seymour-flux.md` §7.3 range | **Not rivals — one model.** §12's tables are the `x` (battle-count) branch; this document's figures were the `y` (from-Yuna) branch. Verified: the decompile reproduces all 45 of §12's values exactly. `ffx-seymour-flux.md` §7.3's `4 000–7 000` is **wrong** for story aeons and must be replaced with §6.4.3. See §6.4. |

**Still unverified anywhere (flag as open):** per-monster Poison percentages; whether Counterattack fires on non-Attack physical Skills; the **number** of battles before a KO'd aeon is restored (§6.1 ships 3 as an authored constant); the exact **per-event increment** of the aeon Overdrive gauge (§6.5 ships a 5× model derived from `od_cost`); Swordplay zone widths and cursor speeds (§5.3 ships authored values); Bushido's per-input state machine (§5.5 ships authored rules); the Slots reel spin rate (§5.6 ships ~6 symbols/s); Lulu's Fury intra-sequence rotation ramp (§5.7 ships a flat-per-sequence model exact at all published anchors); Pickpocket's rare-rate multiplier (§7.8 ships 4×).

**Closed since the previous revision:** `ICV_VARIANCE` (transcribed, §1.9); Regen's formula, durations and cast-turn behaviour (§4.3); Threaten's decay rule and per-enemy initial chances (§4.4); Warrior mode's `estimatedDamage` term and every mode's units (§5.1); Steal and Bribe rolls (§7.8); the aeon stat-model reconciliation (§6.4); the Sphere Grid data (§10.3, now vendored).

---

## 12. Unified data schema (authoring contract for all ten documents)

Every chapter in this repository currently invents its own table columns — `ffx-seymour-flux.md` uses *File/ID, Target, Formula, Base dmg, Hits, Statuses, Notable flags*; `ffx-yunalesca.md` uses *Rank, Formula, Base power, Dmg type, Hits, Statuses (chance/stacks), Reflectable*; the X-2 chapters use *AP, MP, Tgt, Type, Effect, Flags*. This section is the **single authoring format** they should all normalise to, so an implementer transcribes once rather than reconciling three dialects. It is an **authored contract** `[estimate]` — no source dictates a schema — but every *enumerated value* below is drawn from the decompiled records described in §§1–10.

FFX and FFX-2 share these types. Where X-2 diverges (ATB instead of CTB, dresspheres, no aeons) the divergence is carried in the marked optional fields, not in a separate schema.

### 12.1 Core types

```ts
type Game = "ffx" | "ffx2";
type Element = "fire" | "ice" | "thunder" | "water" | "holy" | "none";
type DamageType = "physical" | "magical" | "other";
type Formula =
  | "strength" | "magic" | "specialMagic" | "healing" | "hp" | "ctb"
  | "fixed" | "percentTotal" | "percentCurrent" | "gil";

interface Action {
  id: string;              // stable project key, e.g. "ffx.bushido.tornado"
  commandRow: number|null; // decompiled ffx_command.csv row; null for authored content
  name: string;
  game: Game;
  rank: number;            // 1-10 (FFX CTB). X-2: ATB recovery in ticks
  mpCost: number;
  target: Target;
  formula: Formula;
  damageType: DamageType;
  damageConstant: number;  // "DmgCon" / "base power" throughout this repo
  hits: number;            // 1 for single-hit
  element: Element[];      // [] for non-elemental
  statuses: StatusApplication[];
  flags: ActionFlag[];     // see 12.3 - CLOSED enumeration
  notes?: string;
}

type Target =
  | "self" | "oneEnemy" | "allEnemies" | "randomEnemies"
  | "oneAlly" | "allAllies" | "oneRandomAlly" | "everyone";

interface StatusApplication {
  status: StatusId;
  chance: number;   // 0-255 raw byte. 254 = "always unless immune". 255 = ignores resistance
  stacks: number;   // turns/duration; 254 = battle-long; 255 = permanent
}
```

> **The `chance` byte is the single most-copied value in this repository and it is not a percentage.** Per §4.1 it is compared after subtracting the target's resistance. Keep it raw; convert only at the point of rolling.

### 12.2 Actors and encounters

```ts
interface Actor {
  id: string;
  kind: "character" | "aeon" | "enemy" | "guest";
  stats: Stats;                 // hp, mp, str, def, mag, mdef, agi, luck, eva, acc
  baseCtb: number;              // derived: ICV_BASE[agi] (1.2)
  elementAffinity: Partial<Record<Element, "absorb"|"immune"|"resist"|"weak">>;
  statusResistance: Partial<Record<StatusId, number>>;  // 0-255; 255 = immune
  immunities: ImmunityFlag[];   // see 12.3
  autoAbilities: string[];
  overdrive?: { mode: OverdriveMode; gauge: number; costScale: number };  // costScale 1 for characters, 5 for aeons (6.5)
  steal?:  { baseChance: number; common: ItemDrop; rare: ItemDrop };      // 7.8.1
  bribe?:  { item: ItemDrop; immune: boolean };                            // 7.8.2
  ap?: number; gil?: number; drops?: ItemDrop[];
}

interface Encounter {
  id: string;                   // "ffx.seymourFlux"
  game: Game;
  actors: string[];             // Actor ids
  phases: Phase[];              // HP- or turn-gated
  condition: "normal" | "preemptive" | "ambush" | "scripted";
  canEscape: boolean;
  musicCue: string;
  rewards: { ap: number; gil: number; items: ItemDrop[]; steals: ItemDrop[] };
}

interface Phase {
  id: string;
  enterWhen: { hpBelowPct?: number; afterTurn?: number; onActorDeath?: string };
  ai: AiRule[];                 // ordered; first match wins
}

interface AiRule {
  when?: string;                // small guarded expression, e.g. "self.hp < 0.5*self.maxHp"
  weight?: number;              // for random selection among matching rules
  action: string;               // Action id
  target?: Target | string;
}
```

### 12.3 Flag enumerations — **closed sets**

The gap correctly noted that flags named in prose across the chapters (`misses_if_target_alive`, `ignores_armored`, `always_break_damage_limit`, `can_target_dead`, `drains`, `heals`, `removes_statuses`, `adds_equipment_crit`) had no definitions. Here they are. **Any flag not on this list is not a flag** — add it here first.

| `ActionFlag` | Definition | Seen on |
|---|---|---|
| `ignores_armored` | Bypasses the target's Armored property (does **not** bypass Defense — §6.3 note) | all Mixes, Lancet, Bribe |
| `always_break_damage_limit` | Damage cap is 99 999 regardless of equipment | Mega Flare, Oblivion |
| `never_break_damage_limit` | Damage cap is forced to 9 999 even with Break Damage Limit | Spare Change, Mega Phoenix |
| `misses_if_target_alive` | The action **fails** on a living target (revival effects). Note §11 C11: a *living Zombie* is still processed and killed | Life, Full-Life, Phoenix Down, Mega Phoenix |
| `can_target_dead` | May be selected on a KO'd actor | revival effects |
| `drains` | The damage dealt is added to the user's HP (or MP for `drainsMp`) | Drain, Osmose, Lancet, Drain Fury |
| `drains_mp` | As `drains`, against MP | Osmose, Osmose Fury, Lancet |
| `heals` | Sign of the computed amount is inverted — it restores rather than damages. On `formula: "ctb"` this *reduces* the target's counter (§1.4 Haste) | Cure line, Haste |
| `removes_statuses` | Carries a removal list rather than an application list | Dispel, Esuna, Panacea, Aerospark |
| `adds_equipment_crit` | The user's weapon's bonus critical rate is added to this action's crit chance | Attack and physical Skills (§7 preamble) |
| `crit_eligible` | May roll a critical hit at all | most physical; **never** Slots (§5.6) |
| `inherits_weapon_properties` | Picks up weapon elements and status-strikes | physical Skills |
| `is_counter` | Resolving as a counterattack (affects CTB bookkeeping, §4.3) | counterattacks |
| `reflectable` | Bounces off Reflect | most Blk/Wht Magic; **not** Fury, **not** Ultima |
| `affected_by_darkness` | Accuracy penalised by Darkness | physical |
| `piercing` | Uses Defense 0 against Armored targets | aeon weapons except Valefor |
| `weak_delay` / `strong_delay` | §1.5 CTB push on the target | Delay Attack / Delay Buster |
| `shatter` | Can shatter a Petrified target; carries its own chance | Spare Change, Time Shot |

| `ImmunityFlag` | Definition |
|---|---|
| `immune_to_delay` | §1.5 delays do nothing |
| `immune_to_bribe` | §7.8.2 always fails |
| `immune_to_life` | Revival effects fail; relevant to the Zombie/Death branch |
| `immune_to_threaten` | §4.4 initial chance 0 |
| `immune_to_regen` | Regen cannot be applied (BFA is on this list — §4.3) |
| `armored` | Reduces physical damage unless `ignores_armored` / `piercing` |
| `boss` | Disables Escape and Flee |

### 12.4 Confidence and provenance on every row

Every numeric field carried in a chapter table must carry a tag in its row or its table caption, using the three values defined in this document's preamble: `[verified: 2 sources]`, `[single source]`, `[estimate]`. A table with no tag anywhere is a defect. Where a number is `[estimate]`, the reasoning must be stated inline — as done throughout §5.3, §5.5, §5.6, §5.7, §6.4.2 and §6.5.

### 12.5 Migration note for the existing chapters

| Chapter column | Maps to |
|---|---|
| "File/ID" / "Row" | `Action.commandRow` |
| "Base dmg" / "Base power" / "DmgCon" | `Action.damageConstant` |
| "Tgt" / "Target" | `Action.target` |
| "Type" / "Dmg type" | `Action.damageType` |
| "Statuses (chance/stacks)" | `Action.statuses[]` |
| "Reflectable" | `flags: ["reflectable"]` |
| "Notable flags" / "Flags" | `Action.flags[]` — **must be drawn from §12.3** |
| "AP" (X-2) | `Action` cost field on the dressphere ability record |

---

## Sources

**Decompile-derived (primary), all pinned to commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`**
- <https://github.com/Grayfox96/FFX-RNG-tracker>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/constants.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/actions.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/events/character_action.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/events/encounter.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/events/escape.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/events/yojimbo_turn.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/gamestate.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/actor.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/autoabilities.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/statuses.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/events/steal.py> — §7.8.1 steal roll
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/events/bribe.py> — §7.8.2 bribe chance/quantity
- <https://github.com/Grayfox96/FFX-Sphere-Grid-viewer> — §10.3 Standard-HD grid, commit `c191aa6e2c46debb58610e2b90e230204f55e7b1`

**Vendored data files (this repository)**
- `D:/Final Fantasy/research/data/standard-hd-graph.json` — 860 nodes / 881 links / 98 clusters
- `D:/Final Fantasy/research/data/aeon-growth-reference.json` — §6.4 coefficients, machine-readable
- `D:/Final Fantasy/research/data/LICENSE-FFX-SPHERE-GRID-VIEWER.txt` — MIT © 2024 Grayfox96

**Fandom pages added in this gap-fill pass** (fetched as raw wikitext via the MediaWiki `action=parse` API)
- <https://finalfantasy.fandom.com/wiki/Regen_(Final_Fantasy_X_status)> — §4.3 tick formula, durations, Zombie/undead inversion, immune and Auto-Regen enemy lists
- <https://finalfantasy.fandom.com/wiki/Regen_(status)> — §4.3 cross-check
- <https://finalfantasy.fandom.com/wiki/Threaten_(status)> — §4.4 ×0.7-on-success decay, per-enemy initial chances, interaction list
- <https://finalfantasy.fandom.com/wiki/Threaten_(ability)> — §4.4 default 100 % sequence, Steal comparison
- <https://finalfantasy.fandom.com/wiki/Overdrive_Mode> — §5.1 full mode table, stated as game-data extracts; `estimatedDamage` definition; percent units; Ally/Daredevil version splits
- <https://finalfantasy.fandom.com/wiki/Overdrive_(Final_Fantasy_X)> — §5.1 special-damage category, §5.2 timed bonus
- <https://finalfantasy.fandom.com/wiki/Swordplay_(Final_Fantasy_X)> — §5.3 meter/miss-retry rules, hit counts, unlock counts
- <https://finalfantasy.fandom.com/wiki/Bushido_(Final_Fantasy_X)> — §5.5 sequences incl. International variants, Tornado 2-hit split, immune/fail powers
- <https://finalfantasy.fandom.com/wiki/Slots_(Final_Fantasy_X)> — §5.6 complete player control, Miss symbol, Attack Reels doubling, Status Reels effects
- <https://finalfantasy.fandom.com/wiki/Fury_(Final_Fantasy_X)> — §5.7 casts-after-15-rotations anchors at Magic 0 / 128 / 255
- <https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)> — §6.1 Banish/KO rules, §6.5 gauge triggers, Boost ×1.5, Shield zeroing, reset-on-death, aeon auto-abilities
- <https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)/Stat_growth> — §6.4 `max(x,y)+z` model, per-aeon coefficients, per-battle-count tables, Overdrive-output cross-check
- <https://finalfantasy.fandom.com/wiki/Bribe_(Final_Fantasy_X)> — §7.8.2 the 25/50/75/100 % curve and the gil-accumulation rule
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/characters.py>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/data_files/ffx_command.csv>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/data_files/ffx_item.csv>
- <https://github.com/Grayfox96/FFX-RNG-tracker/blob/0acf1ac3190c4b75b6a8e9f02eb47897da20c680/ffx_rng_tracker/data/data_files/characters.json>
- <https://github.com/Grayfox96/FFX-Sphere-Grid-viewer/tree/c191aa6e2c46debb58610e2b90e230204f55e7b1>
- <https://github.com/Grayfox96/FFX-Sphere-Grid-viewer/blob/c191aa6e2c46debb58610e2b90e230204f55e7b1/LICENSE>
- <https://github.com/Grayfox96/FFX-Sphere-Grid-viewer/blob/c191aa6e2c46debb58610e2b90e230204f55e7b1/ffx_sphere_grid_viewer/data/layout.py>
- <https://github.com/Grayfox96/FFX-Sphere-Grid-viewer/blob/c191aa6e2c46debb58610e2b90e230204f55e7b1/ffx_sphere_grid_viewer/data/node.py>
- <https://github.com/Grayfox96/FFX-Sphere-Grid-viewer/blob/c191aa6e2c46debb58610e2b90e230204f55e7b1/ffx_sphere_grid_viewer/data/node_types.py>

**Grayfox96's FFX-Info companion site (decompile-derived, independent published resource from the RNG-Tracker repo — added by fact-check pass)**
- <https://grayfox96.github.io/FFX-Info/rng/damage-crit-escape-icv> — escape constant, damage variance formula, base crit-chance relationship
- <https://grayfox96.github.io/FFX-Info/mechanics/ctb> — low-Agility base CTB table (corroborates Agi1=28)
- <https://grayfox96.github.io/FFX-Info/rng/hit-chance> — hit-chance formula/table, Aim/Reflex +10/-10 per stack
- <https://grayfox96.github.io/FFX-Info/rng/status-chance> — status application rule set (255/254 chance, resistance subtraction)
- <https://finalfantasy.fandom.com/wiki/First_Strike_(ability)> — preemptive/ambush/Initiative percentages (distinct wiki page from the battle-system page already cited)
- <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/answers/573062> — GameFAQs Q&A confirming the classic "+32" guide formula that the decompile's "+30" corrects

**Official**
- <https://cdn.sqexeu.com/sea/ffxii/manuals/FFX-FFX2_PS3_ManInt_English_013014.pdf> — Square Enix FFX/X-2 HD manual (status cures; Confusion targets allies *or* enemies; CTB command-dependent ordering)
- <https://ptgmedia.pearsoncmg.com/imprint_downloads/brady/final-fantasy/rikkus-mix-chart.pdf> — official BradyGames Rikku's Mix chart

**Final Fantasy Wiki (Fandom)** — fetched as raw wikitext via `https://finalfantasy.fandom.com/api.php?action=parse&prop=wikitext`
- <https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_battle_system>
- <https://finalfantasy.fandom.com/wiki/Rank_(Final_Fantasy_X)>
- <https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_stats>
- <https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_statuses>
- <https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_auto-abilities>
- <https://finalfantasy.fandom.com/wiki/Overdrive_(Final_Fantasy_X)>
- <https://finalfantasy.fandom.com/wiki/Overdrive_Mode>
- <https://finalfantasy.fandom.com/wiki/Mix_(Final_Fantasy_X)>
- <https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)>
- <https://finalfantasy.fandom.com/wiki/Sphere_Grid>
- <https://finalfantasy.fandom.com/wiki/Delay_(Final_Fantasy_X)>
- <https://finalfantasy.fandom.com/wiki/Zombie_(Final_Fantasy_X)>
- <https://finalfantasy.fandom.com/wiki/Dismiss>
- <https://finalfantasy.fandom.com/wiki/Attack_(command)>

**Guides**
- <https://jegged.com/Games/Final-Fantasy-X/Overdrives/Overdrive-Modes.html> — Overdrive mode charge formulas and unlock counts
- <https://jegged.com/Games/Final-Fantasy-X/Overdrives/Slots.html> — Wakka reel matching rules
- <https://jegged.com/Games/Final-Fantasy-X/Overdrives/Bushido.html> — Auron button sequences
- <https://jegged.com/Games/Final-Fantasy-X/Overdrives/Fury.html> — Lulu rotation timer
- <https://jegged.com/Games/Final-Fantasy-X/Overdrives/Mix.html> — Mix highlights
- <https://jegged.com/Games/Final-Fantasy-X/Tips-and-Tricks/Statuses.html>
- <https://jegged.com/Games/Final-Fantasy-X/Tips-and-Tricks/Combat.html>
- <https://jegged.com/Games/Final-Fantasy-X/Walkthrough/28-Zanarkand-Ruins.html>
- <https://www.supercheats.com/playstation2/walkthroughs/finalfantasyx-walkthrough09.txt> — Tha Demon2004 Overdrive Guide: mode list, Tidus/Auron/Wakka unlock counts, ~64 Mix recipes with one ingredient pair each, Ronso Rage sources
- <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/31381> — SinirothX, Stat Mechanics FAQ (CTB table, damage formula, DefNum)
- <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/14551> — Ceebs, Mix research
- <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/14783> — Ceebs, Sphere Grid research (lock → empty → creation sphere)
- <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/status-effects> — status effects, Darkness 10 % base
- <https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/79145/aeons> — aeon mechanics
- <https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/59160333> — barreltheif, ability Rank list (the Fandom rank table's cited source)
- <https://gamefaqs.gamespot.com/switch/248081-final-fantasy-x-x-2-hd-remaster/faqs/15350> — PFriedman, version-specific research (Wakka's HD timer bonus)
- <https://www.neoseeker.com/final-fantasy-x-x2-hd/faqs/252610-final-fantasy-x-stats.html> — stats/CTB/Regen cross-check
- <https://www.neoseeker.com/final-fantasy-x/faqs/182463-overdrive-kuronoe77.html> — Kuronoe77 Overdrive database (source of the rank-4 Slots claim)
- <https://eip.gg/ffx-x2/guides/mix-combinations/> — Mix combination tables
- <https://eip.gg/ffx-x2/guides/aeons/> — aeon Boost/Shield percentages
- <https://www.gamerguides.com/final-fantasy-x-hd/guide/characters/yuna/grand-summon-overdrive> — Grand Summon temporary-vs-stored gauge
- <https://game8.co/games/Final-Fantasy-X/archives/270985> — healing/reviving aeons between battles
- <https://strategywiki.org/wiki/Final_Fantasy_X/Overdrive_Modes> — Overdrive mode cross-check
- <https://www.rpgdl.com/forums/index.php?topic=205.0> — Overdrive gauge multiplier analysis (Triple Overdrive ×3 ⇒ Stoic base 30)
- <https://www.cheatscorner.de/database/ps2/gamefaqs/466-final_fantasy_x_pal_version_guide_teil_2b_version_7_1.html?ltpl=print> — PAL guide mirror (Regen tick behaviour)
- <https://www.reddit.com/r/finalfantasyx/comments/14b7jr4/in_regards_to_creating_challenge_runs/> — Standard-grid starting node ids

**Local prior research (read first, as instructed)**
- `D:/Projects/Final Fantasy/Moonpetal/docs/MECHANICS-AUDIT.md`
- `D:/Projects/Final Fantasy/Moonpetal/docs/SECOND-MECHANICS-REVIEW.md`
- `D:/Projects/Final Fantasy/Moonpetal/docs/MIX-REVIEW.md`
- `D:/Projects/Final Fantasy/Moonpetal/docs/SOURCES.md`
- `D:/Projects/Final Fantasy/Moonpetal/docs/STANDARD-GRID-RESEARCH.md`
- `D:/Projects/Final Fantasy/Moonpetal/docs/research/standard-hd-graph.json`
- `D:/Projects/Final Fantasy/Moonpetal/docs/research/aeon-growth-reference.json`
- `D:/Projects/Final Fantasy/Moonpetal/src/combat.mjs`, `src/data.mjs`
- `D:/Projects/Final Fantasy/CrystalReverie/Docs/FFX_MECHANICS_NOTES.md`

---

## Verification log

Fact-check pass results, per claim (see updated confidence tags and §11 C4 inline for detail):

| Claim (section) | Verdict |
|---|---|
| Escape succeeds at rng&255<191, 74.6% (§1.8) | confirmed |
| Preemptive/Normal/Ambush base and Initiative percentages (§1.9) | confirmed |
| Agility→base CTB tick table breakpoints, e.g. Agi1=28 (§1.2) | contradicted (vs. SinirothX FAQ) — corrected/annotated, decompile value retained, conflict recorded in §11 C4 |
| Strength/Special-Magic POWER constant +30 not +32 (§2.2) | confirmed |
| Hit chance formula and HIT_CHANCE_TABLE (§2.11) | confirmed |
| Status application rules: 255/254 chance, resistance subtraction (§4.1) | confirmed |
| Aim +10 / Reflex −10 per stack (§2.9, §2.11) | confirmed |
| Luck effect +1 hit / +10 crit vs wiki's "1% each" (§2.9, §2.12) | unverifiable — left as [single source] |
| Regen formula and durations (§4.2, now §4.3) | **confirmed** — Fandom *Regen (Final Fantasy X status)* prints the identical `[(Ticks × Max HP)/256] + 100` and the 10/20/infinite durations; decompile `character_action.py` carries the same expression. Tag raised to `[verified: 2 sources]`. `ffx-yunalesca.md` §15.2 defect #4 ("invented") is **withdrawn** |
| Auto-Life revives at 25% max HP (§4.2) | unverifiable — left as-is |
| Doom counter = 5 for party members (§4.2) | unverifiable — left as-is |
| Poison: maxHP//4 at end of own turn (§4.2) | unverifiable — left as-is |
| Ultima: rank 6, 90 MP, whole party, not reflectable (§2.7) | unverifiable — left as-is |
| Holy/Flare rank, MP, shatter, reflectability (§2.7) | unverifiable — left as-is |
| Self-Destruct (Kimahri) DmgCon 30 = 3× max HP (§2.7) | unverifiable — left as-is |
| Zombie cured by Holy Water/Remedy/etc., NOT Esuna (§4.2) | unverifiable — left as-is |
| Elemental affinity multipliers incl. double-weak ×2.25 (§3) | unverifiable — left as-is |
| Damage cap 9999/99999, Break Damage Limit on Celestial Weapons (§2.13) | unverifiable — left as-is |
| Break statuses permanent, Dispel-only, Ribbon does not block (§2.10) | unverifiable — left as-is |
| Mix displays rank 5, resolves rank 6 (§1.3 UI trap) | unverifiable — left as-is |
| Threaten diminishing chance, floor 1% (§4.2, now §4.4) | **confirmed and completed** — decay is `× 0.7` floored on **success only**, floor 1 %; per-enemy initial chances 0/25/80/100/255 %; resets at battle start. Tag raised to `[verified: 2 sources]` |
| Critical hit chance formula (§2.12) | confirmed |
| Damage variance: 32-step discrete roll, ×240/256 to ×271/256 (§2.1) | confirmed |
| MITIGATION integer chain / classic-form off-by-1 for 26 values (§2.3) | unverifiable — left as-is |
| CTB recovery linear in rank (§1.3) | confirmed |
| `ICV_VARIANCE` 256-entry table (§1.9) | **confirmed and transcribed** — parsed from the pinned `constants.py`, all 256 entries; plateau structure independently re-derived from `ICV_BASE` |
| Overdrive Mode coefficients and units (§5.1) | **contradicted** — three errors found in the previous revision (duplicated Victim row; JP-version Ally and Daredevil increments; spurious `× 3` in Warrior). Corrected against Fandom's game-data extract; recorded as §11 C13 |
| Warrior mode `estimatedDamage` (§5.1) | **confirmed** — defined as Attack damage ignoring enemy Defense, using Magic when Magic > Strength |
| Blitz Ace hit count 4 × 9 (§5.3) | **contradicted** — Fandom states eight attacks plus the finisher; corrected to 4 × 8 + 24. §11 C14 |
| Bushido button sequences (§5.5) | **contradicted** — the previous revision printed NA/JP sequences under an International baseline; corrected. §0 V14–V16 |
| Tornado success power 15 × 2 (§5.5) | **contradicted** — success uses the *immune* row (20 × 2) because Tornado has no rider status. §11 C15 |
| Slots symbol probability distribution (§5.6) | **premise refuted** — Fandom: "the player can control the outcome completely". No distribution exists; §5.6 now specifies reel strips and a spin rate. §11 C16 |
| Attack Reels maximum 12 hits "engine clamp" (§5.6) | **corrected** — 12 is `6 × 2`, the rule's natural maximum, not a clamp; the third symbol is **Miss** |
| Fury rotation scaling direction (§5.7) | **contradicted** — required rotation *shrinks* as Magic rises, not grows. Calibrated against Fandom's Magic 0/128/255 anchors |
| Aeon stat model — three rival figures across chapters (§6.4) | **resolved** — one `max(x, y) + z` model; the decompile reproduces all 45 of `ffx-yunalesca.md` §12's values exactly. `ffx-seymour-flux.md` §7.3's 4 000–7 000 is wrong for story aeons. §11 C17 |
| Aeon coefficient table (§6.4) | **confirmed** — Fandom stat-growth page publishes identical constants in `a`/`b` form. Tag raised to `[verified: 2 sources]` |
| Aeon HP/MP persistence and post-KO restoration (§6.1) | **confirmed** — Fandom *Aeon (Final Fantasy X)* states the carry-over, Save Sphere heal and full-HP/MP revival after a set number of battles. Tag raised to `[verified: 2 sources]`; the **number** of battles remains unpublished (3 shipped as an authored constant) |
| Aeon Overdrive gauge triggers, Boost/Shield effect, reset-on-death (§6.5) | **confirmed** — Fandom quantifies Boost as ×1.5 fill and Shield as zero fill, and states the gauge resets to zero on death |
| Steal roll and per-success halving (§7.8.1) | **confirmed and completed** — decompile `events/steal.py`: `base_chance // 2^successes` vs `rng % 255`, plus an independent 32/256 rare roll |
| Bribe cost and success curve (§7.8.2) | **confirmed** — the decompiled `int(gil*256/HP/20) - 64` reproduces Fandom's published 25/50/75/100 % curve exactly at ×10/×15/×20/×25 max HP, confirming the `HP × 25` figure `ffx-yunalesca.md` cites |
| Sphere Grid graph file availability (§10.3) | **resolved** — file vendored into `research/data/`; all 27 sanity node ids re-verified by name against the file (27/27 match); full census and all 85 ability nodes now embedded in the document |

**Gap-fill pass (this revision).** Thirteen flagged gaps were addressed: two blockers (aeon stat models, Sphere Grid data) and eleven majors. Ten were closed with sourced data, three were closed with explicitly-labelled authored models resting on verified anchors (Swordplay/Bushido input rules, the Slots spin rate, the aeon gauge increment). Four previously-published numbers were found to be **wrong** and corrected (Overdrive Mode Victim/Ally/Daredevil rows, Warrior's `× 3`, Blitz Ace's hit count, Tornado's success row, Bushido's button sequences), and one cross-document verdict was **overturned** (`ffx-yunalesca.md` §15.2 defect #4's claim that Regen was invented). One cross-document verdict was **upheld** (defect #10's "2.4× too durable").

Confirmed claims had their confidence tag upgraded to `[verified: 2 sources]` and the corroborating source cited inline plus added to the Sources section. The one contradicted claim (low-Agility CTB table) was annotated in place and in §11 C4 with the conflicting SinirothX values, the corroborating decompile-derived second source, and an explicit recommendation to keep the decompile value. Unverifiable claims were left unchanged (no confidence tag was lowered, since the original decompile sourcing stands; only claims marked "confirmed" or "contradicted" were edited per instructions).
