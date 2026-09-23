# FINAL FANTASY X-2 — Core Battle System (Implementation Reference)

Research doc for **Pyrefly Reprise** (Vite + TypeScript + Three.js, HD-2D). Target audience: implementation agents who have never played FFX-2. Every number carries a confidence tag. Full URL list in **Sources** at the end.

**Confidence tags**
- `[verified: 2 sources]` — two or more independent sources agree
- `[single source]` — one source only
- `[estimate]` — not published anywhere I could find; a derived/recommended value for the fan game

**Primary sources, ranked by reliability**
1. **SinirothX, "Enemy Encyclopedia" (GameFAQs FAQ 31807)** — data extracted/hacked from the game. Contains the canonical 20-step damage flowchart, per-dressphere stat growth algorithms, EXP curves, and every enemy's damage constants. **Treat as decompile-grade; prefer over all others on conflict.**
2. **pbirdman, "FFX-2 Calculator (Draft 2)" (.xlsx, linked from GameFAQs)** — a working implementation of SinirothX's damage flowchart carrying the per-ability damage-constant tables, the ATB/CTIM/RECTIM tick model, the accuracy equation, the status-duration constants and the status-infliction formulas. Fan-made and therefore always tagged `[single source]`, but cross-validated against ~20 independently-published values (see **Sources**). **It is the only source for most of §2.9 and for the absolute units in §1.2–1.4 and §2.8.**
3. **Final Fantasy Wiki (finalfantasy.fandom.com)** — per-dressphere per-level stat tables (values match SinirothX's algorithms), ability AP/MP tables, item Priority/Type tags for Mix, status descriptions.
4. **Split Infinity, "Guide and Walkthrough" (GameFAQs FAQ 25872)** — the only complete per-ability tagging of charge-time / recovery-time / Protect / Shell / crit-capable / range, plus complete item and Garment Grid tables.
5. Jegged.com per-dressphere pages, StarNeptune "Dressphere Ability FAQ", misc. board threads — corroboration only.

---

## 0. Executive summary for implementers

FFX-2 is **real-time ATB**, not FFX's turn-based CTB. A unit's turn is a four-phase pipeline:

```
[ATB fill: green bar] -> [command input] -> [CTIM charge: purple bar] -> [execute] -> [RECTIM recovery] -> repeat
```

Three things dominate combat feel and must be modelled to make the game read as FFX-2:

1. **The Chain system.** Hits landing within ~2 s of the previous hit on the same target stack a multiplier starting at ×1.45 and rising ×0.05 per link, up to ×6.35 at Chain 99. Chained targets **cannot evade** and **cannot start a new action**. This is the game's core offensive loop.
2. **Spherechange.** Changing dressphere costs the character's whole turn (the ATB gauge is consumed and refills from empty) and can grant temporary buffs by "passing through" gates on the Garment Grid.
3. **Per-ability CT/RT tagging.** Every ability is either instant-with-recovery (`RT`), instant-with-double-recovery (`2xRT`), or charge-then-fire (`CT`). This is the main speed lever and is fully tabulated in section 3.

**The four numbers an engine needs before it can run at all** — all four were decoded in this revision:

| Need | Answer | Section |
|---|---|---|
| How long is a turn? | `ticks = floor(10000 × value / (Agility + 1))`, consumed at a fixed **3000 ticks/s**. One drawn bar = 24,000 ticks = 8.00 s. **Agility shortens the bar; it does not speed the fill.** | §1.2 |
| How much damage does ability X do? | Every ability has a `Power` (damage constant) and a `Formula` that selects one of six step-1 base numbers. Attack = 16. Complete table for every dressphere and every special-dressphere part. | §2.9 |
| Did it hit? | `hit% = clamp(0,100, Acc + Luck + 10·accuLv + 5·luckLv − (Eva + tLuck + 10·evaLv + 5·tLuckLv))`, with Darkness dividing Accuracy by **4**. | §2.6 |
| How long does a status last? | `seconds = durationValue × 0.53` at the default ATB speed; ×2 under Slow, ×0.95 under Haste. ~25 published values. | §2.8 |

---

## 1. ATB, charge time, recovery, Haste/Slow, and the Chain system

### 1.1 The four-phase turn pipeline

| Phase | Bar colour | What happens | Can be interrupted? |
|---|---|---|---|
| ATB fill | Green (red if Haste, gold if Slow, white if Stop) | Gauge fills from 0 to full. Only when **full** may a command be entered. | Yes — "Delay effect" empties a % of it; being hit while the command menu is open cancels the menu and delays the turn. |
| Command input | — | Player picks a command. In **Active** mode time keeps running; in **Wait** mode time freezes as soon as a submenu is entered. | n/a |
| CTIM (charge) | Purple | Ability-specific charge. Character takes a visible stance / aura. When the purple bar fills, the ability fires. | **Cannot be cancelled by damage, only delayed** (Delay effect shortens it). It **can** be fully cancelled by an "Action-cancel" (ACTIC) ability — Dismissal, Bully Ghiki — which resets the target's ATB to empty. |
| Execution + RECTIM (recovery) | — (no bar shown) | Animation plays. Some abilities then force a recovery window before the ATB begins to refill again. | n/a |

Key rules `[single source: Split Infinity G0905]`:
- A command may only be issued when the green ATB bar is **completely full**. Half-full does nothing.
- ATB bar *length* varies by dressphere — i.e. the gauge is effectively per-dressphere, driven by Agility.
- Not every ability has both CT and RT. An ability is tagged `CT`, `RT`, `2xRT`, or a combination (`CT, RT` — e.g. Great Whirl, Vajra, Sword Dance).
- **Any damage taken perturbs the bar's fill** for both party and enemies (enemy bars are not displayed).

### 1.2 ATB fill rate from Agility — DECODED TICK MODEL

> **Cross-document conflict RESOLVED.** `visual-bible.md` §4.0/§4.3 (citing StrategyWiki) states that *Agility sets the bar's **length** and the fill rate is **fixed***; earlier revisions of this section modelled a *fixed bar* with an Agility-scaled *rate*. **These are the same simulation**, and the decoded tick model below shows why: the number of ATB ticks a unit must accumulate before acting is `10000 × value / (Agility + 1)` — Agility shortens the runway — while ticks are consumed at a **fixed 3000 ticks per second**. Time-to-act is `∝ 1/(Agility+1)` under either description.
>
> **Decision for implementation: use the bar-LENGTH reading.** It is what the HUD actually draws (faster dresspheres get visibly shorter gauges), it makes Haste / Slow / the Config ATB-speed setting clean multipliers on a single global tick rate, and it is the only reading that explains why every charge-time reducer in the game is worded as *"wait down"* / *"shortens the gauge"* rather than *"speeds you up"*. `visual-bible.md`'s renderer spec is correct as written and needs no change; this section is the one that was wrong.

**The engine, in decoded units** `[single source: pbirdman, *FFX-2 Calculator (Draft 2)* spreadsheet, linked from the GameFAQs "Ability Damage Formulas" thread — a frame-accurate model whose independent item-power table exactly reproduces every published Mix damage value (see §3.11), which is a 20-point cross-check on the sheet's provenance]`:

| Quantity | Value / formula | Confidence |
|---|---|---|
| Gauge length for any ATB, CTIM or RECTIM entry | `ticks = floor(10000 × abilityValue / (Agility + 1))` | `[single source, calculator-derived]` |
| Tick rate — ATB speed **Normal** (default) | **3000 ticks/s** (= 50 ticks per frame at 60 fps) | `[single source]` |
| Tick rate — under **Slow** status | **1500 ticks/s** (`×0.5`) | `[verified: 2 sources]` (calculator `IF(status=1, 3000*1/2)`; FF Wiki Slow (FFX-2 status) = "fills at half speed") |
| Tick rate — under **Haste** status | **3150 ticks/s** (`×1.05`) | `[verified: 2 sources]` (calculator `IF(status>1, 3000*1.05)`; FF Wiki Haste (FFX-2 status) = "quickens the ATB charge rate by about 5%") |
| One *displayed* full bar | **24000 ticks** = **8.00 s** of runway at the normal rate | `[single source]` |
| Rendered bar length | `barPercent = ticks / 24000 × 100` | `[single source]` |
| Visible clamp / internal maximum | the drawn bar stops at **100%**; the internal gauge runs to **416%** (≈ 99,840 ticks ≈ **33.3 s**) and is still fully simulated | `[single source]` |
| Worked anchor straight out of the sheet | Agility **42**, recovery value **70** → 16,279 ticks → 67% bar → **5.42 s** | `[single source]` |

Collapsing the two constants gives the single line an implementer needs:

```
secondsToAct = 10000 * value / ((agility + 1) * tickRate)
             = 3.3333 * value / (agility + 1)          // at tickRate = 3000
```

```ts
// ---- FFX-2 ATB engine (decoded) --------------------------------------------
const TICKS_PER_BAR    = 24000;   // one drawn bar = 8.00 s at the base rate
const TICK_RATE_BASE   = 3000;    // ticks per second, Config ATB speed = Normal
const BAR_INTERNAL_MAX = 4.16;    // 416 % - simulated but never drawn

/** Ticks a unit must accumulate for a gauge entry of `value`. */
function atbTicks(value: number, agility: number): number {
  return Math.floor(10000 * value / (agility + 1));
}

/** "<Skillset> wait down" / Turbo / Lv.2-Lv.3 reducers shorten the GAUGE. */
function applyWaitDown(ticks: number, waitDownPercent: number): number {
  return ticks - Math.floor(ticks * waitDownPercent / 100);
}

/** Config ATB speed multiplies the global rate: Slow 0.746x, Normal 1x, Fast 1.262x
 *  (derived from the status-duration constants 0.71 / 0.53 / 0.42 s per unit, SS2.8). */
function tickRate(haste: boolean, slow: boolean, cfg: 'slow'|'normal'|'fast' = 'normal'): number {
  const cfgMul = cfg === 'slow' ? 0.53 / 0.71 : cfg === 'fast' ? 0.53 / 0.42 : 1;
  let r = TICK_RATE_BASE * cfgMul;
  if (slow)  r *= 0.5;    // 1500 at Normal
  else if (haste) r *= 1.05;  // 3150 at Normal
  return r;
}

function seconds(ticks: number, haste = false, slow = false): number {
  return ticks / tickRate(haste, slow);
}

/** What the HUD draws: bar LENGTH is a function of Agility, fill rate is fixed. */
function barFraction(ticks: number): number {
  return Math.min(1, ticks / TICKS_PER_BAR);  // >1 exists internally, is not drawn
}
```

**Worked turn periods** (recovery value 70, the sheet's default; `secondsToAct = 233.33 / (Agi+1)`), using the Lv 30 Agility figures from §5.2:

| Dressphere (Lv 30) | Agi | ticks | bar length | seconds | turns vs Dark Knight |
|---|---|---|---|---|---|
| Berserker | 66 | 10,447 | 44% | **3.48 s** | 1.68× |
| Thief | 62 | 11,111 | 46% | **3.70 s** | 1.58× |
| Gunner | 54 | 12,727 | 53% | **4.24 s** | 1.38× |
| Warrior | 51 | 13,461 | 56% | **4.49 s** | 1.30× |
| Dark Knight | 39 | 17,500 | 73% | **5.83 s** | 1.00× |

Split Infinity's observation that a Thief gets roughly **two turns for every one** a Dark Knight gets is therefore only ≈1.58× from Agility; the rest comes from ability tagging — the Thief's Attack is untagged and strikes twice, while nearly every Dark Knight action carries a `CT` charge *on top of* the recovery gauge. **Do not try to get 2:1 out of Agility alone.**

Other gauge rules:

| Fact | Value | Confidence |
|---|---|---|
| Stop: Agility treated as 0, gauge does not advance, commands cannot be entered | `×0` | `[verified: 2 sources]` |
| Sleep / KO / Petrify: gauge does not advance | `×0` | `[single source]` |
| HP Critical (<33% max HP): character "requires more time to act and recover from hits" | slower | `[single source]` (Split Infinity G0906) |
| Haste does **not** raise the Agility stat; it raises the tick rate and speeds animations | +5% rate | `[verified: 2 sources]` |
| Slow also **doubles the CTIM value** on top of halving the rate | `×2` CTIM | `[single source]` (Split Infinity G1020) |
| Any damage taken perturbs the gauge for both party and enemies (enemy bars are not displayed) | — | `[single source]` |

> **Recorded conflict — Haste magnitude.** The FF Wiki's *White Magic (Final Fantasy X-2)* spell table describes Haste as *"Doubles the speed at which the target's ATB gauge fills."* The FF Wiki's dedicated *Haste (Final Fantasy X-2 status)* article **and** the calculator both say **~5%** (`×1.05`). The spell-table line is boilerplate carried over from other FF titles. **Implement ×1.05.**

### 1.3 Charge time (CTIM) — decoded units and modifiers

CTIM uses the **same** tick formula as the ATB/recovery gauge (§1.2): `ticks = floor(10000 × chargeValue / (Agility + 1))`, drawn as the purple bar and consumed at the same global tick rate. A "wait down" reducer subtracts a **percentage of the tick count**, not of a fixed number of seconds:

```
chargeTicks = floor(10000 * chargeValue / (agility + 1));
chargeTicks = chargeTicks - floor(chargeTicks * waitDownPercent / 100);
```
`[single source, calculator-derived: cells C320 → E320 → F320 → A321 → B321 of the pbirdman sheet]`

Complete published set of CTIM modifiers (each is applied to the running tick count):

| Modifier | Effect on CTIM | Source of modifier | Confidence |
|---|---|---|---|
| White Magic Lv. 2 | −30% | White Mage, 40 AP | `[verified: 2 sources]` (Split Infinity; FF Wiki White Mage page) |
| White Magic Lv. 3 | −50% | White Mage, 60 AP (needs Lv. 2) | `[verified: 2 sources]` |
| Black Magic Lv. 2 | −30% | Black Mage, 40 AP (needs MP Absorb) | `[verified: 2 sources]` (Split Infinity; FF Wiki Black Mage page) |
| Black Magic Lv. 3 | −50% | Black Mage, 60 AP (needs Lv. 2) | `[verified: 2 sources]` |
| Kogoro / Ghiki / Flurry Lv. 2 | −30% | Trainer, 80 AP | `[single source]` |
| Kogoro / Ghiki / Flurry Lv. 3 | −50% | Trainer, 100 AP | `[single source]` |
| Fiend Hunter Lv. 2 | −40% | Gun Mage — **20 AP** (FF Wiki Gun Mage page) vs **30 AP** (Split Infinity). **Conflict; use 20 AP.** | `[contradicted — see note]` |
| Items Lv. 2 | −80% (Item command only; does **not** affect Stash) | Alchemist, 30 AP | `[single source]` |
| Turbo Arcana / Black Magic / White Magic / Bushido / Instinct / Swordplay | −40% each | "Tome" accessories (Arcane/Black/White/Bushido/Nature's/Sword Tome) | `[verified: 2 sources]` |
| "<Skillset> wait down" Garment Grid gate bonus | identical to the matching Turbo ability, −40% | all-four-gates bonus on Black Tabard / Chaos Maelstrom / Samurai's Honor / Blood of the Beast / Pride of the Sword / Tricks of the Trade | `[verified: 2 sources]` |
| Slow status | CTIM value **×2.0** *and* the tick rate halved — net **×4** in wall-clock seconds | — | `[single source]` |

**CTIM value assignments for the fan game.** No source publishes per-ability charge *values*; what is now known is the unit system and its absolute scale, so the assigned numbers are dimensionally correct and scale properly with Agility (which the previous flat "1.2 s / 2.0 s / 3.0 s" tiers did not — they made a Dark Knight and a Berserker charge at the same speed, which is wrong).

| Tier | Example abilities | `chargeValue` | s @ Agi 51 | s @ Agi 39 | Confidence |
|---|---|---|---|---|---|
| Instant (no `CT`) | Attack, all Gunplay, Steal/Pilfer family, Pray, Vigor, every Full Throttle main-part Throttle ability | **0** | 0.00 | 0.00 | `[verified: 2 sources]` — the tag itself is sourced |
| Short `CT` | Lv.1–2 magic, the four Break skills, elemental Swordplay, most Bushido, most Instinct, all Missile / Shell / Wing / Feather abilities | **16** | 1.03 s | 1.33 s | `[estimate]` |
| Medium `CT` | Lv.3 magic, Cura/Curaga, Delay Attack, Sparkler, Fireworks, Demi, Drain, Two Dice, the elemental Whirls | **26** | 1.67 s | 2.17 s | `[estimate]` |
| Long `CT` | Excalibur, Black Sky, Shin-Zantetsu, Full-Cure, Full-Life, Ultima, Flare, Charon, Moogle Beam, Cactling Gun, Four Dice, all four Reels, Great Whirl, Vajra, Sword Dance, Mix, Bribe | **39** | 2.50 s | 3.25 s | `[estimate]` |

*Reasoning for the estimate.* The sheet's only worked charge/recovery datum is `value 70 → 5.42 s at Agility 42`, i.e. **1 value unit = 0.0775 s at Agility 42**. The tiers above convert the previously-invented second-values (0 / 1.2 / 2.0 / 3.0 s, themselves tuned against video reference) into value units at that anchor — `value = seconds × (Agi+1) × 0.3` — and round. The *ratios* are the load-bearing part; the absolute scale is retuned by moving the single constant `TICK_RATE_BASE`.

### 1.4 Recovery time (RECTIM) — decoded units

| Tag | Meaning | Confidence |
|---|---|---|
| `RT` | Ability executes immediately, then the character sits through a recovery window before the ATB begins refilling. | `[single source: Split Infinity G14006]` |
| `2xRT` | Same, but recovery is **twice** as long. Used by: Gunner's Trigger Happy, Warrior's Sentinel, and **every Songstress Dance**. | `[single source]` |
| no tag | Bar refills immediately after execution (baseline gauge only). | `[single source]` |

RECTIM uses the identical tick formula. The sheet's default recovery value is **70**, the baseline post-action gauge every worked example in §1.2 uses.

| Tag | `recoveryValue` | s @ Agi 54 (Gunner) | s @ Agi 62 (Thief) | Confidence |
|---|---|---|---|---|
| untagged (immediate refill) | **70** | 4.24 s | 3.70 s | `[single source]` for the 70 anchor |
| `RT` | **70** — the baseline *is* the normal recovery; the tag marks that the ability adds no extra **charge** | 4.24 s | 3.70 s | `[estimate]` |
| `2xRT` | **140** | 8.49 s | 7.41 s | `[estimate]`, from the sourced "twice as long" wording |

Haste shortens all of this by raising the tick rate (×1.05) **and** by speeding the execution animation itself, which the gauge does not model.

Special: **Sentinel** (Warrior, 20 AP, `2xRT`) reduces *all* physical damage taken to **1 HP** until the user's ATB bar refills; magic damage is unaffected `[verified: 2 sources]`. The damage flowchart calls this "Defend status": any damage ≥2 from a Protect-reducible attack becomes 1 `[single source: SinirothX step 17]`.

Special: **Songstress Dances** are *sustained* — the effect persists "while dancing", i.e. for the entire time the Songstress's ATB bar is refilling, and ends when her next turn comes up `[verified: 2 sources]`. With `2xRT` = 140 value units that is **8.5 s at Agi 54**, which is the mechanical reason a Dance aura feels close to permanent.

### 1.5 Active vs Wait mode

| Mode | Behaviour | Confidence |
|---|---|---|
| **Active** | Time never stops, including while browsing the item list or a magic submenu. An enemy hit landing while a menu is open **closes the menu and applies Delay effect** to that character's ATB. | `[single source: Split Infinity G0913]` |
| **Wait** | Time runs while the top-level Main Command Window is open, but **freezes the moment any submenu is entered** (Item list, White Magic list, Garment Grid screen, etc.). The on-screen indicator in the upper-right flips between "Active mode" and "Wait mode". | `[single source]` |
| Automatic Wait | The game force-freezes time during certain long animations regardless of the setting. | `[single source]` |

There is also an **ATB speed setting** (Slow / Normal / Fast) in Config. Notable side effect: at **Fast**, units put to Sleep never wake up on their own; at other speeds Sleep expires after a while `[single source: Split Infinity G1004]`.

### 1.6 Battle start

| Situation | Effect | Confidence |
|---|---|---|
| Normal | ATB bars start at randomised fill levels. Any distribution of first turns is possible. | `[single source]` |
| **Ambushed!** | All enemies act first regardless of party Agility. After their free round, normal ATB resumes. | `[single source]` |
| **Pre-emptive strike!** | All party members act first regardless of enemy Agility. | `[single source]` |
| Thief's **First Strike** (40 AP, passive) | User starts with a **full** ATB bar even when ambushed. | `[single source]` |
| Thief's **Initiative** (60 AP, passive; needs First Strike) | Raises the chance of a party-wide pre-emptive strike. | `[single source]` |

### 1.7 The Chain system (exact)

This is the mechanic the prompt specifically asks for. It is a **consecutive-hit** system, not a downed/stagger-damage-reduction system.

| Rule | Value | Confidence |
|---|---|---|
| Chain window after a normal hit | **2 seconds** | `[verified: 2 sources]` (FF Wiki Chain; FF Wiki Critical hit) |
| Chain window after a **critical** hit | **3 seconds** (target takes one extra second to recover) | `[verified: 2 sources]` |
| Multiplier at "Chain x1!" | **×1.45** (normal damage +45%) | `[verified: 2 sources]` (FF Wiki Chain; Split Infinity G0912, credited to Zeruel) |
| Increment per additional link | **+0.05** | `[verified: 2 sources]` |
| General form | `chainMult = 1.40 + 0.05 * chainNumber` | `[verified: 2 sources]` |
| Stated maximum | "more than 600%" | `[verified: 2 sources]` |
| Maximum chain count | **99** ("Full Chain" trophy/achievement in HD Remaster is 99 chains) ⇒ ×6.35 | `[single source]` |
| Position in the damage pipeline | **Step 13** of 20 — after crit/berserk/back-attack multipliers, before elemental affinity | `[single source: SinirothX]` |

> **Recorded conflict.** SinirothX's flowchart writes step 13 as `× (1.4 + chain number × 0.5)`. That is almost certainly a typo for `× 0.05`: with 0.5 the first link would be ×1.9, contradicting both the Wiki and Split Infinity's independently-sourced ×1.45, and would blow past "600% maximum" by chain 10. **Implement `1.40 + 0.05 × chainNumber`.**

**Side effects of being chained** (these matter more than the damage bonus):

| Effect | Detail | Confidence |
|---|---|---|
| No evasion | A target still recovering from the previous hit **cannot evade** the next attack. | `[verified: 2 sources]` |
| Action lockout | A chained target **cannot start executing its own action**. A long enough chain can stop an enemy from ever acting. | `[verified: 2 sources]` |
| Exception | If the enemy has **already begun its attack animation**, chaining will not stop it. Very visible on slow-animation enemies (Tonberry family). | `[single source]` |
| Symmetric | **Enemies can chain the party** using the identical rules. | `[verified: 2 sources]` |

**Chain break conditions** `[verified: 2 sources]`:
1. More than 2 s (3 s after a crit) elapses between hits on that target.
2. The target dies / leaves the battlefield.
3. The chain counter is per-target — hitting a different enemy starts a separate chain.

**Multi-hit abilities self-chain.** Any ability that lands several hits on one target builds chain by itself. Documented self-chaining sources: Trigger Happy (one hit per R1 press), Thief's Attack (strikes twice), Blessed Gem (8 holy hits), Black Sky (10 hits), Great Whirl (12 hits), Four Dice, Lady Luck's reels `[verified: 2 sources]`.

**Positioning drives chaining** (this is why FFX-2's free-movement battlefield exists) `[single source: Split Infinity G0908]`: three characters standing close to one target land their attacks nearly simultaneously and chain easily; a character standing far away spends ~2 s running in, which usually breaks the chain. For an HD-2D reimplementation, model an **approach time** proportional to distance for `short range` abilities, and **zero approach time** for `long range` abilities.

**Range tag** (per-ability, tabulated in section 3): `long range` abilities fire from the starting position with no run-in. Gunner, Lady Luck, Alchemist, Trainer and Gun Mage are the long-range dresspheres `[verified: 2 sources]`.

---

## 2. Damage formulas, cap, criticals, accuracy, elements, statuses

### 2.1 The canonical 20-step damage flowchart

Source: SinirothX, Enemy Encyclopedia, "Data Interpretation/Damage Mechanics Flowchart". This is extracted game data and is the authoritative pipeline. `[single source, decompile-grade]` — but steps 1 and 3 are independently confirmed by the FF Wiki's Attack (command) page (which cites this same FAQ) and by a third-party transcription (Lodestone blog), so the base formulas are `[verified: 2 sources]`.

Apply in order. `prev` = result of all previous steps.

| # | Step | Formula | Applies to |
|---|---|---|---|
| 1 | Base number — **Physical** | `(Lv + Str) * Lv * Str / 1024 + Str` | physical |
| 1 | Base number — **Magic / Magic recovery** | `Lv * 2 + Mag` | magic, healing |
| 1 | Base number — **Special Magic** | `(Lv + Mag) * Lv * Mag / 1024 + Mag` | "special magic" type |
| 1 | Base number — **Fractional** | `target max/current HP (or MP) * fraction` | Demi, Cripple, Quarter Pounder, Blaster… |
| 1 | Base number — **Multiple** | ability-specific (see 2.3) | Charon, On the Level, Mirror of Equity, 1000 Needles |
| 1 | Base number — **Constant** | a flat number | many enemy attacks and all items |
| 2 | Damage constant (part 1) — magic only | magic: `prev * C^2 / 64` · magic recovery: `prev * C^2 / 128` | magic, healing |
| 3 | Defense | physical: `prev * (270 - Def) / 255`<br>**Table-turner only**: `prev * (15 + Def) / 255`<br>magic & special magic: `prev * (270 - MDef) / 255` | phys/magic |
| 4 | STR/MAG Up-Down | physical: `prev * (12 + userStrLevel) / 12`<br>magic/special/recovery: `prev * (12 + userMagLevel) / 12` | phys/magic |
| 5 | DEF/MDEF Up-Down | physical: `prev * (12 - targetDefLevel) / 12`<br>**Table-turner only**: `prev * (12 + targetDefLevel) / 12`<br>magic/special: `prev * (12 - targetMDefLevel) / 12` | phys/magic |
| 6 | Damage constant (part 2) | `prev * C / 16` | physical, special magic |
| 7 | Randomisation | `prev * rand(240..271) / 256` (≈ ×0.9375 … ×1.0586) | all except menu White Magic |
| 8 | Flat addition | Finale: `+99999`. Momentum: `+ (enemies you have defeated)` | those two only |
| 9 | Critical hit | `prev * 2` | — |
| 10 | Berserk (attacker berserked) | `prev * 1.25` | — |
| 11 | Attack from behind | `prev * 2` (only for Protect-reducible attacks) | — |
| 12 | Other multipliers | Fiend Hunter vs correct species `* 4` · HP/MP recovery items with Chemist or Double All `* 2` · elemental damage items with Elementalist or Double All `* 2` · non-elemental damage items with Physicist or Double All `* 2` · Black/White magic with Magic Booster `* 1.5` | — |
| 13 | **Chain** | `prev * (1.40 + 0.05 * chainNumber)` — see §1.7 conflict note | — |
| 14 | Element | weak `* 2` (**stacks** for multiple weaknesses) · resistant `* 0.5` (does **not** stack) · null `* 0` · absorb → converts damage into HP recovery | elemental |
| 15 | Multi-target | Black/White magic cast on **all** opponents or allies: `* 0.5` | magic only |
| 16 | Shell / Protect | Shell-reducible on Shell: `* 0.5` · Protect-reducible on Protect: `* 0.5` | — |
| 17 | Defend (Sentinel) | any Protect-reducible damage ≥2 becomes **1** | — |
| 18 | 9999-damage status (Cat Nip) | any damage in 1..9998 becomes **9999** | — |
| 19 | Damage limit | see §2.4 | — |
| 20 | Damage immunity | Protect-reducible vs Null Physical · Shell-reducible vs Null Magic · anything vs Invincible · fractional vs fractional-immune → displays **"IMMUNE"** | — |

**Implementation note — order matters.** Multi-target halving (step 15) happens *after* Chain (13) and Element (14) but *before* Shell/Protect (16). A Firaga cast on a 3-enemy group that is weak to fire and under Shell ends at `base × 2 (weak) × 0.5 (multi) × 0.5 (shell)` = `base × 0.5`.

### 2.2 How FFX-2's formulas differ from FFX

| Aspect | FFX | FFX-2 | Confidence |
|---|---|---|---|
| Physical base | `[(Str^3 / 32) + 32] * DmCon / 16` — pure Str cubic, level-independent | `(Lv + Str) * Lv * Str / 1024 + Str` — **Level is a first-class term** | `[verified: 2 sources]` |
| Defense curve | `[(Def - 280.4)^2 / 110] / 730 * (730 - Def*51 + Def^2/22) / 730` — heavily non-linear, sharply diminishing | `(270 - Def) / 255` — **linear**, and Def ≥ 270 yields zero/negative | `[verified: 2 sources]` |
| Magic base | `[(Mag^3/6) / 100 + 6] * DmCon / 4` then MDef curve | `Lv * 2 + Mag`, then `C^2 / 64`, then `(270 - MDef)/255` | `[verified: 2 sources]` |
| Damage constant placement | single `* DmCon / 16` | **split into two steps** — `C^2/64` (or `/128`) for magic *before* defense, `C/16` for physical/special magic *after* the stat modifiers | `[single source]` |
| Randomiser | `* (rand 0..31 + 240) / 256` | identical: `* rand(240..271) / 256` | `[verified: 2 sources]` |
| Buff/debuff maths | Cheer/Focus/Aim/Reflex are additive stat steps | **STR/MAG/DEF/MDEF Up/Down are ±1/12 multiplicative steps**, up to 10 stacks | `[verified: 2 sources]` |
| Turn system | CTB (deterministic turn list, Rank/ICV) | ATB (real-time gauges) | `[verified: 2 sources]` |
| Signature combo | none | **Chain** | `[verified: 2 sources]` |
| Back attacks | not a mechanic | **×2**, and ×4 with a crit | `[verified: 2 sources]` |

Two practical consequences for a fan game:
- **Level matters enormously in FFX-2.** A Lv 50 Warrior with Str 109 deals far more than the Str stat alone suggests, because `(50+109)*50*109/1024 ≈ 846`, dwarfing the `+ Str` term.
- **Defense is linear and caps out.** Enemy Def near 270 makes physical attacks useless, which is exactly why the Def-ignoring abilities (Cheap Shot, Sparkler, Fireworks, Darkness, Moogle Beam, Cactling Gun, Mortar) exist. Model Def-ignore as **skipping step 3 entirely**.

### 2.3 "Multiple"-type ability formulas (exact, published)

| Ability | Formula | Confidence |
|---|---|---|
| Charon (Dark Knight) | `user max HP * 2`; user is removed from the battle. Can exceed 9999 with BDL. | `[verified: 2 sources]` |
| On the Level (Gunner) | `user current Level * 16` | `[verified: 2 sources]` |
| Mirror of Equity (Samurai) | `(user max HP - user current HP) / 2` | `[verified: 2 sources]` |
| 1000 Needles (Blue Bullet) | flat `1000` | `[verified: 2 sources]` |
| Hurt (Berserker) | `37.5% of user's remaining HP` | `[single source]` |
| Momentum (Samurai) | normal physical base by Str, **plus 1 damage per enemy your party slot has ever defeated** (step 8). Max 99999 requires 99999 kills. | `[verified: 2 sources]` |
| Spare Change (Samurai) | `(22 * Gil) / (sqrt(Gil) + 20)` — cap 99999 with BDL; max throw 99,999,999 gil (NTSC-U) / 999,999,999 (JP) | `[single source: Split Infinity, credited to CopperTop + Chris A.]` |
| Bribe (Lady Luck) | `bribeNum = (GilUsed * 256 / (fiendMaxHP * 5)) - 64`; `successRate = bribeNum / 256`. Rule of thumb: pay `fiend max HP × 6.25`. | `[single source: Split Infinity, credited to DiabolicAngel]` |
| CONGRATS! gil (Random Reels) | `monsterLv * 5 * rand(128..256)` | `[single source]` |
| CONGRATS! item count | `floor(itemCount * sqrt(128) * rand(20..30) / 400) + rand(0..1)`, min 1, max 99 | `[single source]` |
| Darkness (Dark Knight) | user spends **12.5% of max HP**; physical damage to all enemies, **ignores Def**; scales with Str; cannot be used below 12.5% HP; costs no HP under Spellspring | `[verified: 2 sources]` |
| Blaster (Blue Bullet) | fractional: removes **93.75%** of target's current HP | `[single source]` |
| Cripple (Berserker) | fractional: **50%** of current HP | `[verified: 2 sources]` |
| Quarter Pounder (Gunner) | fractional: **25%** of current HP | `[verified: 2 sources]` |
| Demi (Arcana) | fractional: **25%** of current HP, all enemies, gravity element | `[verified: 2 sources]` |
| Halfdeath Petals (Floral Fallal L) | fractional: **50%** of current HP, all targets, gravity | `[single source]` |
| Wisenen (Full Throttle) | fractional: **75%** of current HP, gravity | `[single source]` |
| Seed Cannon (Blue Bullet) | **37.5% of target max HP**, physical type | `[single source]` |
| White Wind (Blue Bullet) | heals **37.5% of each ally's max HP** + cures poison/silence/darkness/berserk/confuse/sleep | `[single source]` |
| Storm Cannon (Blue Bullet) | `caster Level * 30`, non-elemental magic, all targets | `[single source]` |
| Dud (any Lady Luck reel failure) | special gravity damage removing **75% of current HP** from the whole party | `[verified: 2 sources]` |
| Moogle Cure / Cureja (Mascot Yuna) | heals **62.5% of max HP** + full status cleanse | `[single source]` |
| Clean Slate (Bushido) | heals **25% of max HP** (halved by Shell) + cures Curse/Darkness/Pointless/Poison/Silence/Slow | `[verified: 2 sources]` |
| Vigor (White Mage) | heals **50% of max HP** | `[single source]` |
| Regen / Poison tick | ≈ **3% of max HP** per interval; Poison does not tick while Stopped; Regen does not tick while Stopped | `[verified: 2 sources]` |
| Auto-Life revive | **25% of max HP** | `[verified: 2 sources]` |
| Phoenix Down / Life | Phoenix Down **25%**, Life spell **50%**, Full-Life **100%** | `[verified: 2 sources]` |

### 2.4 Damage cap and Break Damage Limit

| Rule | Value | Confidence |
|---|---|---|
| Default per-hit damage cap | **9999** | `[verified: 2 sources]` |
| With Break Damage Limit | **99999** | `[verified: 2 sources]` |
| Default max HP cap | **9999** | `[verified: 2 sources]` |
| With Break HP Limit | **99999** | `[verified: 2 sources]` |
| Max HP healed by an **item** in battle | **9999, always** — not liftable by BDL, and not by Alchemist's doubling | `[single source]` |
| BDL never applies to | all items; abilities named after items (Alchemist's Stash list) **except Soul Spring**; all Mix results **except** Soul Spring, Soul Sea, Ultra Potion, Mega Vitality, Mega Cocktail | `[single source: SinirothX step 19]` |
| MP cap | 999 (soft cap). **CONFLICT:** a GameFAQs board answer describing FFX/FFX-2's cap structure states MP has a soft cap of 999 but a **hard cap of 9999** (paralleling the 9999/99999 pattern for damage and HP), implying some mechanism raises the MP ceiling that this doc does not otherwise document. That source discusses FFX and FFX-2 together and does not name the specific FFX-2 ability/accessory that would unlock the higher MP cap, so this is flagged as an unresolved discrepancy rather than a proven correction. **Recommendation: treat 999 as the practical cap for implementation purposes** until a decompile-grade source (SinirothX-tier) settles whether a 9999 hard cap exists in FFX-2 specifically. | `[contradicted — see CONFLICT note]` |

**Where BDL comes from** (there is no ability-sphere version for normal dresspheres):

| Source | Notes | Confidence |
|---|---|---|
| **Invincible** accessory | grants Break Damage Limit | `[single source]` |
| **The End** Garment Grid | equip = Break HP Limit (permanent); pass Green+Red gates = Break Damage Limit (that battle) | `[single source]` |
| **Enterprise** accessory | grants Break HP Limit | `[single source]` |
| Special dresspheres | each part can learn BDL for 20 AP after finding a key item: Floral Fallal needs **Twilight Rain** (BDL) / **Aurora Rain** (BHL); Machina Maw needs **Machina Booster** / **Machina Reactor**; Full Throttle needs **Victor Primoris** / **Corpus Invictus** | `[verified: 2 sources]` |

### 2.5 Critical hits

| Rule | Value | Confidence |
|---|---|---|
| Critical multiplier | **×2** (step 9) | `[verified: 2 sources]` |
| Determined by | attacker's **Luck** vs target's **Luck** | `[single source]` |
| Back attack | **×2** (step 11), independent of crit | `[verified: 2 sources]` |
| Back attack **+** crit | **×4** total | `[verified: 2 sources]` |
| Crit extends the chain window | 2 s → **3 s** | `[verified: 2 sources]` |
| Which abilities can crit | only those tagged `CRIT` — see section 3 tables | `[single source]` |

**Guaranteed-crit sources** `[verified: 2 sources]`: Gunner **Burst Shot** / **Scatterburst**; Full Throttle **Fiers**; Songstress **Dirty Dancing** (party-wide, all physicals crit while dancing); Lady Luck **Critical** passive (160 AP, always crit); Samurai **SOS Critical** (80 AP, crits while HP < 33%); Peerless and Last Resort Garment Grids; several enemy attacks.

**Luck-boosting accessories**: Rabite's Foot (`LUCK +100`, rare — Jumbo Cactuar) and Key to Success (`LUCK +100`, `max HP +100%`, `max MP +100%`, Double All) `[verified: 2 sources]`.

### 2.6 Accuracy, evasion and misses — DECODED FORMULA

The hit check is a **flat additive points race**, not a ratio. It was decoded from the accuracy block of the pbirdman calculator (cells B309→F310→B311), and it simultaneously settles the long-running ACCU/EVA/LUCK Up-Down magnitude dispute (see §2.8) — in the *accuracy* equation those statuses are worth **flat points**, not ±1/12.

```
attackerScore = (hasDarkness ? floor(Accuracy / 4) : Accuracy)
              + attackerLuck
              + 10 * attackerAccuLevel      // ACCU Up positive, ACCU Down negative
              +  5 * attackerLuckLevel      // LUCK Up positive, LUCK Down negative

defenderScore = targetEvasion
              + targetLuck
              + 10 * targetEvaLevel
              +  5 * targetLuckLevel

hitPercent    = clamp(0, 100, attackerScore - defenderScore)   // integer percent
```
`[single source, calculator-derived]` — but the Darkness term (`Accuracy × 1/4`) independently explains Split Infinity's qualitative "physical attacks frequently miss", and the flat ±10 per ACCU/EVA level independently matches Split Infinity's *"each stack level changes the stat by ±10 points"* statement, which is a second, agreeing source for that term specifically `[verified: 2 sources]`.

**Worked example** (the calculator's own default): Accuracy 120, Luck 10, no buffs, vs Evasion 40, Luck 2, no buffs → `130 − 42 = 88%` hit chance.

| Rule | Detail | Confidence |
|---|---|---|
| "MISS" occurs when | the roll exceeds `hitPercent` — which is why a Darkness-afflicted attacker (Accuracy quartered) misses constantly | `[single source]` |
| Guaranteed hit | target is **Asleep** or **Stopped** ⇒ physical attacks always connect (Sleep also sets Evasion to 0) | `[single source]` |
| Guaranteed hit | target is inside a **chain window** (still recovering) ⇒ cannot evade | `[verified: 2 sources]` |
| Re-applying a status already on the target | displays "MISS" — unless the status is stackable, or was dispelled / expired / knocked off | `[single source]` |
| Mad Rush (Berserker) | listed in the ability tables with `Accuracy = 70` rather than `Stat`, i.e. it **overrides** the computed hit chance with a flat 70% in exchange for a guaranteed critical | `[verified: 2 sources]` |
| Zantetsu / Deeth / Shin-Zantetsu / Death / Eject | do **not** use this equation — they use the status-infliction formulas in §2.6a | `[single source]` |

**Calibration sanity check.** Party Accuracy runs 96–133 and Evasion 1–29 across dresspheres (§5.2); enemy Evasion is frequently 0–1 and enemy Accuracy is 0 on early fiends (SinirothX enemy entries). Against a typical boss (Evasion 0–5, Luck 2–10) a Lv 30 Gunner (Acc 124, Luck 17) sits at the 100% clamp, which is exactly why party physicals never miss in FFX-2 without Darkness — and why **Perfect Pitch (+10 ACCU levels = +100 points)** is a *hard guarantee*, not a marginal buff. Symmetrically, **Blind / Darkness on the party is the single most damaging debuff in the game**, because it divides Accuracy by four rather than subtracting from it.

### 2.6a Status-infliction chance — three decoded formulas

Every status-inflicting ability's table row (§2.9) carries a `Formula` field reading `Status 1`, `Status 2`, `Status 3`, or a fixed percentage. The three formulas were decoded from the same sheet (cells A300–F305) `[single source, calculator-derived]`:

| Type | Formula for `chance%` (clamped 0–100) | Used by |
|---|---|---|
| **Status 1** (linear) | `(userLv × 5 + statusPower) − (targetLv × 5 + targetResist)` | most ordinary status riders |
| **Status 2** (quartic‑over‑resist) | `t = floor(floor(100 × userLv² × power² / targetLv) / targetLv)`; `t = floor(floor(t / (resist+5)) / (resist+5)) − 1`; `chance = t / 128 × 100` (rounded to 1 dp if `t < 9`, else to 0 dp) | **Eject** family (Steal Will, Kogoro Strike, Carrier Flurry, PuPu Platter, Telekinesis), instant **Death** (Farplane Shadow, Death, Death Petals, Arsenic Knife) |
| **Status 3** (sextic) | `chance = floor(userLv⁶ / (targetLv³ × (resist+10)² × floor(resist/20 + 1))) / 1024 × 100` | **Zantetsu** (Samurai, always-kills wording is a `Status 3` roll) |

`targetResist` is the per-enemy resistance number SinirothX prints as e.g. `Resistant- Eject (12), Zantetsu (1)`. **This is why every FFX-2 boss is functionally immune to instant death**: bosses carry resistances high enough that the `(resist+5)²` / `(resist+10)²` denominators drive the chance to 0.

### 2.7 Elements

Seven damage types: **Fire, Ice, Lightning, Water, Holy, Gravity, Non-elemental** `[verified: 2 sources]`.
Opposing pairs: Fire↔Ice, Lightning↔Water. Holy, Gravity and Non-elemental have no opposite `[single source]`.

| Affinity | Multiplier | Stacking | Confidence |
|---|---|---|---|
| Weak | **×2** | **stacks** if the target is weak to more than one element in the attack | `[verified: 2 sources]` |
| Strong / Resistant | **×0.5** | does **not** stack — halved only once | `[verified: 2 sources]` |
| Null / Immune | **×0** (displays "IMMUNE") | — | `[verified: 2 sources]` |
| Absorb | damage is converted to HP recovery for the target | — | `[verified: 2 sources]` |
| Non-elemental | affinities are ignored entirely; only **Shell** reduces it (e.g. Flare, Ultima) | — | `[verified: 2 sources]` |

Per-element accessory keywords, useful for building loadouts:
- `…strike` (Firestrike, Icestrike, Lightningstrike, Waterstrike, Gravitystrike, Tetrastrike, Omnistrike) — adds that element to the wearer's physical attacks.
- `…Ward` — reduces incoming damage of that element.
- `…proof` — nullifies that element.
- `…Eater` — absorbs that element as HP.

### 2.8 Status effects — complete table

Format: **Stacks?** / **Persists after battle?** / **Removed by time or by being hit?**

#### Positive statuses (17)

| Status | Stacks | Post-battle | Expiry | Effect | Confidence |
|---|---|---|---|---|---|
| ACCU Up | yes (max 10) | no | none | raises Accuracy. **Conflict, see note below.** | `[single source]` |
| Auto-Life | no | no | on hit | revives on KO with **25% max HP** | `[verified: 2 sources]` |
| DEF Up | yes (max 10) | no | none | physical damage taken `× (12 - level)/12`; no effect on fractional damage | `[verified: 2 sources]` |
| EVA Up | yes (max 10) | no | none | raises Evasion | `[single source]` |
| Haste | no | no | time | ATB charge +~5%, animations sped up; red ATB bar; mutually exclusive with Slow | `[verified: 2 sources]` |
| Invincible | no | no | time | all damage nullified; **status effects still land** | `[verified: 2 sources]` |
| LUCK Up | yes (max 10) | no | none | raises Luck ⇒ more crits | `[single source]` |
| MAG Up | yes (max 10) | no | none | magic damage dealt `× (12 + level)/12` | `[verified: 2 sources]` |
| MDEF Up | yes (max 10) | no | none | magic damage taken `× (12 - level)/12` | `[verified: 2 sources]` |
| Null Magic | no | no | time* | immune to all magic ("IMMUNE"). *Enemies with it keep it all battle. | `[single source]` |
| Null Physical | no | no | time* | immune to all physical ("IMMUNE"). *Same note. | `[single source]` |
| Protect | no | no | time | physical damage `× 0.5`; does **not** change the Def stat; some attacks ignore it | `[verified: 2 sources]` |
| Reflect | no | no | time | bounces most **single-target** Black/White magic back at the caster; multi-target spells (e.g. Demi) are **not** reflected | `[verified: 2 sources]` |
| Regen | no | no | time | restores ≈3% max HP per tick; inert while Stopped | `[verified: 2 sources]` |
| Shell | no | no | time | magic damage `× 0.5`; does **not** change the MDef stat | `[verified: 2 sources]` |
| Spellspring | no | no | none | all MP costs become 0; also removes Darkness's HP cost for Dark Knight | `[verified: 2 sources]` |
| STR Up | yes (max 10) | no | none | physical damage dealt `× (12 + level)/12` | `[verified: 2 sources]` |

> **CONFLICT RESOLVED — ACCU/EVA/LUCK Up-Down magnitude.** Split Infinity states each stack level changes the stat by **±10 points**; the FF Wiki's per-status articles state **±1/12** for *all seven* stats uniformly (`ACCU Up raises Accuracy by 1/12, which can stack up to 10 times`), matching the confirmed STR/DEF/MAG/MDEF pattern. **Both are describing different things and Split Infinity is the one that matters.**
>
> The decoded accuracy equation (§2.6) consumes ACCU/EVA/LUCK levels as **flat additive points inside the hit check** — `±10 per ACCU level`, `±10 per EVA level`, `±5 per LUCK level` — and never as a multiplier on the underlying stat. The FF Wiki's `1/12` line is boilerplate copied across all ten status articles from the four stats where it is genuinely true (STR/DEF/MAG/MDEF, which *are* ±1/12 multiplicative damage steps 4 and 5 of the pipeline). ACCU, EVA and LUCK have **no** damage-pipeline step at all, so a "±1/12 to the stat" reading has nowhere to apply.
>
> **Implement:** STR / MAG / DEF / MDEF Up-Down = `×(12 ± level)/12` in damage steps 4–5. ACCU / EVA Up-Down = `±10 points per level` in the §2.6 hit check. LUCK Up-Down = `±5 points per level` in the §2.6 hit check (and it raises crit rate, which has no published formula — see §2.5). Perfect Pitch's **+10 ACCU levels = +100 accuracy points**, which is a guaranteed-hit button, not a rounding error. `[verified: 2 sources]`

#### Negative statuses (25)

| Status | Stacks | Post-battle | Expiry | Effect | Confidence |
|---|---|---|---|---|---|
| ACCU Down | yes (max 10) | no | none | lowers Accuracy | `[single source]` |
| **Action-cancel** (hidden) | no | no | instant | if the target is mid-CTIM, the charging action is **cancelled outright and the ATB restarts from empty**. Distinct from Delay. Sources: Dismissal (Samurai), Bully Ghiki (Rikku's Trainer). | `[verified: 2 sources]` |
| **Berserk** | no | no | time | attacker deals `× 1.25` damage (step 10) and gains **STR +1 level** in some cases; can only use the basic Attack command; **player loses control**. Berserked *enemies* may still use other attacks. **Ribbon does not protect against Warrior's Assault-applied Berserk.** | `[verified: 2 sources]` |
| **Confuse** | no | no | time **or** hit | target attacks friend and foe at random; a confused party member may use any command she has. Confusing an enemy is the only way to make it use White Wind / Mighty Guard on you (needed for Gun Mage learning). | `[verified: 2 sources]` |
| **Curse** | no | no | none | **the character cannot spherechange** — the L1 Garment Grid menu is disabled. Body flashes black. Cured by Holy Water, Remedy, Esuna, Clean Slate. | `[verified: 2 sources]` |
| **Darkness** | no | **yes** | none | physical attacks frequently miss (Accuracy down). Black mist around the head. Cured by Eye Drops. | `[verified: 2 sources]` |
| **Delay effect** (hidden) | no | no | instant | empties a predetermined **percentage** of the target's ATB **or** CTIM bar. If the target was choosing a command, the menu closes and the turn is lost until the bar refills. If the target was already in CTIM, the action is only delayed — **CTIM cannot be cancelled by Delay**. Delay Buster's effect is **twice** Delay Attack's. | `[verified: 2 sources]` |
| DEF Down | yes (max 10) | no | none | physical damage taken `× (12 + level)/12` | `[verified: 2 sources]` |
| **Doom** | no | no | time | red countdown timer over the target's head; at 0 the target is KO'd. **Timer is frozen while the target is Stopped.** | `[verified: 2 sources]` |
| **Eject** | no | no | none | target is removed from the battle entirely. Characters in a **special dressphere cannot be ejected**. | `[verified: 2 sources]` |
| EVA Down | yes (max 10) | no | none | lowers Evasion | `[single source]` |
| **Itchy** | no | no | special | the affected girl **must spherechange** (L1) before she can use any command; only L1 and Escape remain available. Cleared by performing a spherechange, or by becoming Confused. Cured by Holy Water / Remedy / Esuna. Blocked by Itchproof (Berserker 20 AP; Favorite Outfit accessory). | `[verified: 2 sources]` |
| **KO** | no | **yes** | none | out of action, ATB frozen. Revive with Phoenix Down (25%), Life (50%), Full-Life (100%), Mega Phoenix (50% to two), Moogle Life/Lifeja (full HP+MP). | `[verified: 2 sources]` |
| LUCK Down | yes (max 10) | no | none | lowers Luck | `[single source]` |
| MAG Down | yes (max 10) | no | none | magic damage dealt `× (12 - level)/12` | `[verified: 2 sources]` |
| MDEF Down | yes (max 10) | no | none | magic damage taken `× (12 + level)/12` | `[verified: 2 sources]` |
| **Petrification** | no | **yes** | none | turned to stone, ATB frozen. **Any connecting physical attack shatters the character permanently** (see Shattering). Petrified *enemies* shatter immediately. All three girls petrified = Game Over. Cured by Soft / Esuna / Remedy. | `[verified: 2 sources]` |
| **Pointless** | no | **yes** | none | the affected girl earns **no EXP at end of battle and no AP during battle**. Icon reads "EXP=0". Only two enemies in the game can inflict it. Cured by Holy Water. | `[verified: 2 sources]` |
| **Poison** | no | **yes** | none | loses ≈3% of max HP per tick; inert while Stopped. Cured by Antidote. | `[verified: 2 sources]` |
| **Shattering** (hidden) | no | no | on hit | consequence of Petrification — see above. | `[single source]` |
| **Silence** | no | **yes** | none | blocks White Magic, Black Magic and Arcana. Also blocks Songstress's Sing **and** Dance; Mascot Yuna loses Kupo! and Arcana; Mascot Rikku loses Wildcat and White Magic; Mascot Paine loses Black Magic. Cured by Echo Screen. | `[verified: 2 sources]` |
| **Sleep** | no | no | time **and/or** hit | ATB frozen, **Evasion reduced to 0**. At **ATB speed = Fast**, sleep never expires on its own. Songstress's **Sleepy Shuffle is special: physical hits do not wake the target.** | `[verified: 2 sources]` |
| **Slow** | no | no | time | ATB fills at **half speed**, CTIM **doubled**, animations slower, **gold ATB bar**. Mutually exclusive with Haste. | `[verified: 2 sources]` |
| **Stop** | no | no | time | Agility 0, ATB frozen white, no commands. **Also removes Sleep, Confusion and Berserk.** Freezes Doom's timer, Poison's ticks and Regen's ticks. | `[verified: 2 sources]` |
| STR Down | yes (max 10) | no | none | physical damage dealt `× (12 - level)/12` | `[verified: 2 sources]` |

**Durations — DECODED.** FFX-2 stores every timed status as an integer **duration value**, converted to wall-clock seconds by a single constant that depends only on the Config **ATB speed** setting `[single source, calculator-derived: cells G300–M300, G301–H301 of the pbirdman sheet]`:

```
seconds = durationValue * SECONDS_PER_UNIT        // rounded down to 1 decimal
```

| Config ATB speed | `SECONDS_PER_UNIT` | Confidence |
|---|---|---|
| **Slow** | **0.71** | `[single source]` |
| **Normal** (default — use this) | **0.53** | `[single source]` |
| **Fast** | **0.42** | `[single source]` |

Two status modifiers scale the whole duration on top of that:

| Modifier on the *afflicted unit* | Effect on remaining duration | Confidence |
|---|---|---|
| target is under **Slow** | `×2.0` | `[single source]` |
| target is under **Haste** | `×0.95` | `[single source]` |
| neither | `×1.0` | `[single source]` |

The sheet's own worked anchor: `durationValue 20 → 10.6 s` at Normal speed. That is the Invincible window from a Hero Drink — which is exactly how long an in-game Hero Drink lasts.

**Published duration values** (read straight off the ability / item tables of the same sheet; seconds column computed at Normal speed):

| Status source | `durationValue` | Seconds | Confidence |
|---|---|---|---|
| **Sleep** — global default for the status | **97** | **51.4 s** | `[single source]` |
| **Berserk / Confuse** — global default | **133** | **70.5 s** | `[single source]` |
| **Slow** — Silver / Gold Hourglass, Intimidate, Sticky Honey, Slow Shell | **100** | **53.0 s** | `[single source]` |
| **Haste** — Chocobo Feather, Healing Spring line, Booster, Floral Rush, Pumice Feather, Flurry Speed, GG "Haste" | **50** | **26.5 s** | `[single source]` |
| **Haste** — **Chocobo Wing** (the Mix result) | **120** | **63.6 s** | `[single source]` |
| **Haste** — GG **Hastega** | **40** | **21.2 s** | `[single source]` |
| **Haste** — Moogle Regen/ja rider | **60** | **31.8 s** | `[single source]` |
| **Protect / Shell / Reflect** — Light/Lunar/Star Curtain, White Mage spells, Mighty Guard, No Fear, Shellter/Protector, Flurry Guard/Shield, Moogle Wall | **100** | **53.0 s** | `[single source]` |
| **Protect / Shell / Reflect / Regen** — **Wall / Hi-Wall / Final Wall** (Mix) | **100** | **53.0 s** | `[single source]` |
| **Regen** — Healing Spring, White Mage Regen, White Honey, Lady Luck Regen | **50** | **26.5 s** | `[single source]` |
| **Regen** — Moogle Regen/ja | **80** | **42.4 s** | `[single source]` |
| **Invincible** — Hero Drink item, GG Hero Drink, Psychic Excellence | **20** | **10.6 s** | `[single source]` |
| **Invincible** — **Hero Drink / Miracle Drink (Mix)** | **15** | **8.0 s** | `[single source]` |
| **Stop** — Kogoro Freeze | **60** | **31.8 s** | `[single source]` |
| **Stop** — Borrowed Time, Congealed Honey, Still Wing, Stop Missile, Stop Spark | **100** | **53.0 s** | `[single source]` |
| **Stop** — Psychic Time Trip | **19** | **10.1 s** | `[single source]` |
| **Stop** — Paine's Mascot **Stop Knife** | **126** | **66.8 s** | `[single source]` |
| **Null Magic / Null Physical** — Floral Fallal Barrier / Shield | **20** | **10.6 s** | `[single source]` |
| **Null Magic / Null Physical** — Psychic Magic Guard / Physics Guard | **60** | **31.8 s** | `[single source]` |
| **Mighty Guard** (Blue Bullet) Protect+Shell | **127** | **67.3 s** | `[single source]` |
| **Silence / Confuse** — Psychic Brainstorm | Silence `Infinite`, Confuse **120** | — / **63.6 s** | `[single source]` |
| **Doom** — Candle of Life item | **9 turns** (turn-counted, *not* seconds) | — | `[single source]` |
| **Doom** — Arcana Doom, Doom Kogoro | **4 turns** | — | `[single source]` |

**Statuses with no duration value** (`Infinite` in the source tables) persist until dispelled, cured, or the battle ends: Poison, Darkness, Silence, Petrification, Curse, Pointless, Itchy, Berserk-from-Cat-Nip, Auto-Life, Spellspring, every STR/MAG/DEF/MDEF/ACCU/EVA/LUCK Up-Down stack, and all of the "Infinite"-flagged riders in §2.9. **Note this overturns the previous estimate table**, which had Berserk/Confuse at 20 s and Sleep at 15 s: the real values are 3–4× longer, and Poison/Darkness/Silence do not expire at all.

Two accessories are documented as producing "super long dance effects" (Adamantite, Shmooth Shailing), which is consistent with durations being data-driven per source rather than per status `[single source]`.

**Doom's timer is frozen while the target is Stopped** `[verified: 2 sources]`, and Doom is counted in *turns*, not seconds — model it as a decrement on the afflicted unit's own turn boundary.

**Blanket cures**
| Cure | Removes | Confidence |
|---|---|---|
| **Esuna** (10 MP) / **Remedy** item / Alchemist's Remedy | Berserk, Confuse, Curse, Darkness, Itchy, Petrification, Pointless, Poison, Silence, Sleep, Slow, Stop | `[verified: 2 sources]` |
| **Holy Water** | Curse, Pointless, Itchy | `[verified: 2 sources]` |
| **Dispel** (12 MP) / **Dispel Tonic** item | Auto-Life, Shell, Protect, Reflect, Regen, Haste, Spellspring | `[verified: 2 sources]` |
| **Full-Cure** (99 MP) | full HP + every negative status **except KO and Doom** | `[single source]` |
| **Ribbon** | Petrification, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Pointless, Itchy, Slow, Stop (**not** KO, Doom, Eject) | `[verified: 2 sources]` |
| **Super Ribbon** (Shmooth Shailing) | all negative statuses, but forces permanent **Auto-Slow** (only Haste cancels it) | `[verified: 2 sources]` |
| KO-then-revive | clears every status except Petrification (which risks shattering) | `[single source]` |


---

### 2.9 Player-ability damage constants (the `Power` / `DmCon` table)

**This section closes the document's largest gap.** SinirothX's section 20 ("Complete Attack List") is a one-line `COMING SOON` stub in every released version of the Enemy Encyclopedia, so no decompile-grade list of *player* ability constants has ever been published. The table below is transcribed from **pbirdman's *FFX-2 Calculator (Draft 2)*** spreadsheet, a working damage simulator that implements SinirothX's 20-step flowchart cell-for-cell and carries a per-ability `Power / Status / Chance / Duration / Accuracy / Formula` table for every dressphere including all nine special-dressphere parts.

**Provenance and why it is trustworthy** `[single source, with a 20-point independent cross-check]`:
- Its `Attack` power of **16** matches SinirothX's own per-enemy `damage constant: 16` for every fiend's Normal Attack.
- Its **item/Mix** powers reproduce the FF Wiki's independently-published Mix damage values *exactly* under one rule, `damage = power × 50`: Pineapple 3→150, Potato Masher 14→700, Cluster Bomb 30→1500, Blaster Mine 4→200, Hazardous Shell 20→1000, Heat Blaster 2→100, Firestorm 4→200, Burning Soul 8→400, Brimstone 3→150, Abaddon Flame 6→300, Archangel 1→50, White Hole 12→600 … twenty values from a source the sheet does not cite. A fabricated table does not do that.
- Its ATB, accuracy, Spare Change, Bribe and CONGRATS blocks all reproduce formulas that *are* independently published (§1.2, §2.6, §2.3).

**The `Power` column is the damage constant `C`** consumed at **step 2** (`× C²/64` magic, `× C²/128` magic recovery) or **step 6** (`× C/16` physical and special magic) of the §2.1 pipeline. **The `Formula` column selects the step-1 base number**:

| `Formula` | Step-1 base | Damage constant applied at |
|---|---|---|
| `Str` | `(Lv + Str) × Lv × Str / 1024 + Str` | step 6, `× C/16` |
| `Mag` | `Lv × 2 + Mag` | step 2, `× C²/64` |
| `Sp Mag` (special magic) | `(Lv + Mag) × Lv × Mag / 1024 + Mag` | step 6, `× C/16` |
| `Heal` (magic recovery) | `Lv × 2 + Mag` | step 2, `× C²/128` |
| `Curr HP` / `Max HP` | fractional — `Power` **is** the fraction (0.25 = 25%) | — |
| `Lvl` | `userLevel × Power` | — |
| `Status 2` / `Status 3` | no damage; see §2.6a | — |
| `Stat` in the *Accuracy* column | use the §2.6 hit equation; a number there is a flat override hit % | — |
| `n (xk)` in `Power` | `k` separate hits of constant `n` (each self-chains) | per hit |

> **Correction to a previously-quoted ladder.** This document formerly quoted `Lv.1 magic = 12, Lv.2 = 24, Lv.3 = 42, Flare = 60, Ultima = 70, Holy = 100` from an unnamed third-party transcription and flagged it as unverified. **Those numbers are wrong.** The real Black Magic ladder is **8 / 13 / 21**, Flare is **55**, Ultima **70**, and Holy is **12 × 8 hits** (not a single 100-power hit). Because magic scales as `C²`, the mistake mattered: the old ladder made Firaga `(42/12)² = 12.25×` Fire, where the true ratio is `(21/8)² = 6.9×`. **Replace the old ladder everywhere.**

### 2.9.1 Standard dresspheres

**Gunner**

| Ability | Power | Status | Chance | Duration | Accuracy | Formula |
|---|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Stat | Str |
| Trigger Happy | **2 (×1–60)** | — | — | — | — | Str |
| Potshot / Scattershot | 20 | — | — | — | Stat | Str |
| Cheap Shot | 16 | — | — | — | Stat | Str |
| Enchanted Ammo | 20 | — | — | — | Stat | Sp Mag |
| Target MP | 6 | — | — | — | Stat | Str (vs MP) |
| Quarter Pounder | 0.25 | — | — | — | Stat | Curr HP |
| On the Level | 16 | — | — | — | Stat | Lvl |
| Burst Shot / Scatterburst | 16 | Critical | Always | — | Stat | Str |
| Table-turner | 22 | — | — | — | Stat | Str (inverted Def step) |

> **Trigger Happy is the headline correction here.** Each shot is power **2**, not power 16 — one-eighth of a normal Attack — but the ability fires **up to 60 shots** in its window, each one adding a chain link. At 30 shots and a climbing chain multiplier it out-damages any single Gunplay ability; at 5 shots it is worthless. This is exactly the "mash R1" risk/reward the game is built on, and the previous text ("each shot's power equals a normal Attack") overstated it 8×. `[single source]`

**Thief**

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | **8 (×2)** | — | — | — | Str |
| Pilfer HP | 12 | — | — | — | Str (drains) |
| Pilfer MP | 6 | — | — | — | Str (drains MP) |
| Borrowed Time | — | Stop | Infinite | 100 (53.0 s) | — |
| Soul Swipe | — | Berserk | Infinite | — | — |
| Steal Will | — | Eject | 17 | — | Status 2 |

> Thief's double Attack is **8 + 8**, i.e. the same total power as one 16-power Attack — the advantage is purely that it lands **two chain links** instead of one. `[single source]`

**Warrior**

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Str |
| Power Break | 18 | STR Down | 100 | Infinite, −2 levels | Str |
| Armor Break | 18 | DEF Down | 100 | Infinite, −2 | Str |
| Magic Break | 18 | MAG Down | 100 | Infinite, −2 | Str |
| Mental Break | 18 | MDEF Down | 100 | Infinite, −2 | Str |
| Flametongue / Ice Brand / Thunder Blade / Liquid Steel | 20 | — | — | — | Str (elemental) |
| Demi Sword | 24 | — | — | — | Str (gravity) |
| Excalibur | 32 | — | — | — | Str (holy) |
| Delay Attack | 16 | Delay | Infinite | "Weak" | Str |
| Delay Buster | 18 | Delay | Infinite | "Strong" (= 2× Weak) | Str |
| Assault | — | Multi (Berserk+Haste+Shell+Protect, STR Up +1) | Multi | Multi | — |

**Songstress** — no Dance or Song appears in the constant table; every Dance/Song is a pure status aura with **zero damage**, sustained for the duration of the Songstress's recovery gauge (§1.4), not for a duration value. Perfect Pitch's +10 ACCU levels resolve to **+100 accuracy points** in the §2.6 equation. `[single source]`

**White Mage** (all `Heal` formula, `× C²/128`)

| Ability | Power | Status | Duration | Formula |
|---|---|---|---|---|
| Pray | 8 | — | — | Heal |
| Cure | 22 | — | — | Heal |
| Cura | 31 | — | — | Heal |
| Curaga | 38 | — | — | Heal |
| Regen | — | Regen | 50 (26.5 s) | — |
| Shell / Protect / Reflect | — | Pro/Shl/Ref | 126 (66.8 s) | — |

> The sheet labels Cura and Curaga `Mag` rather than `Heal`; every FFX-2 heal uses the magic-recovery branch (`C²/128`), so this is a transcription slip in the sheet. **Use `Heal` for all six.** `[single source]`
> Vigor (50% max HP), Life (50%), Full-Life (100%) and Full-Cure (100% + cleanse) are **fractional**, not constant-driven — see §2.3.

**Black Mage**

| Ability | Power | Status | Duration | Formula |
|---|---|---|---|---|
| Fire / Blizzard / Thunder / Water (Lv.1) | **8** | — | — | Mag |
| Fira / Blizzara / Thundara / Watera (Lv.2) | **13** | — | — | Mag |
| Firaga / Blizzaga / Thundaga / Waterga (Lv.3) | **21** | — | — | Mag |
| Focus | — | MAG Up +3 | Infinite | — |
| MP Absorb | 3 | — | — | Sp Mag (vs MP) |

Effective ratios after `C²/64`: Lv.1 `×1.00`, Lv.2 `×2.64`, Lv.3 `×6.89`.

**Gun Mage** — Blue Bullet and Fiend Hunter

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Str |
| Fiend Hunter (all ten) | 16 | — | — | — | Str (×4 vs correct species, step 12) |
| Fire Breath | 38 | — | — | — | Sp Mag (fire) |
| Seed Cannon | 0.375 | — | — | — | **Max HP** |
| Stone Breath | — | Petrify | 100 | — | — |
| Absorb | 8 | — | — | — | Sp Mag (drains HP+MP) |
| Bad Breath | — | Multi | 100 | Slow 100 (53.0 s) | — |
| Mighty Guard | — | Protect + Shell | Infinite | 127 (67.3 s) | — |
| Supernova | 65 | — | — | — | Sp Mag |
| Cry in the Night | 80 | — | — | — | Sp Mag |
| Drill Shot | 32 | — | — | — | Str |
| Mortar | 48 | — | — | — | Str (ignores Def) |
| Annihilator | 60 | — | — | — | Mag (ignores MDef) |
| Heaven's Cataract | 34 | DEF Down + MDEF Down | Infinite | −2 levels | Sp Mag |
| Storm Cannon | 30 | — | — | — | Lvl (= Lv × 30) |
| Blaster | 0.9375 | — | — | — | Curr HP |
| 1000 Needles | flat 1000 | — | — | — | constant |
| White Wind | 0.375 | cures 6 statuses | — | — | Max HP (heal) |

**Dark Knight**

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Str |
| **Darkness** | **20** | — | — | — | Str, ignores Def, all enemies, costs 12.5% max HP |
| Drain | 12 | — | — | — | Sp Mag (drains) |
| Demi | 0.25 | — | — | — | Curr HP (gravity) |
| Confuse | — | Confuse | 100 | 133 (70.5 s) | — |
| Break | — | Petrify | 80 | Infinite | — |
| Bio | — | Poison | 100 | Infinite | — |
| Doom | — | Doom | 100 | **4 turns** | — |
| Death | — | Death | 18 | — | Status 2 |
| **Black Sky** | **6 (×10)** | — | — | — | Str |
| Charon | — | — | — | — | `user max HP × 2`, user leaves battle |

**Samurai**

| Ability | Power | Status | Chance | Duration | Accuracy | Formula |
|---|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Stat | Str |
| Magicide | 8 | — | — | — | Stat | Str (vs MP) |
| Dismissal | 20 | **Action-cancel** | — | 1 | Stat | Str |
| Fingersnap | 20 | — | — | — | Stat | Str |
| Sparkler / Fireworks | 24 | — | — | — | Stat | Str (ignores Def) |
| Momentum | 16 | — | — | — | Stat | Str `+1 per lifetime kill` (step 8) |
| Shin-Zantetsu | — | Death | 80 | — | Stat | — |
| Nonpareil | — | STR Up / ACCU Up | Infinite | +2 / +10 levels | — | — |
| No Fear | — | Protect + Shell | Infinite | 100 (53.0 s) | — | — |
| Hayate | — | Haste / EVA Up | Infinite | 50 (26.5 s) / +10 levels | — | — |
| Zantetsu | — | Death | Always | — | — | Status 3 |
| Mirror of Equity | — | — | — | — | — | `(maxHP − currHP) / 2` |
| Spare Change | — | — | — | — | — | `22·G·√G / (G + 20√G)` |

**Berserker**

| Ability | Power | Status | Chance | Duration | Accuracy | Formula |
|---|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Stat | Str |
| Berserk | — | Berserk + STR Up | Multi | — / +1 level | — | — |
| Cripple | 0.5 | — | — | — | Stat | Curr HP |
| **Mad Rush** | **32** | Critical | Always | — | **70 (flat)** | Str |
| Crackdown | 16 | — | — | — | Stat | Str |
| Eject | — | Eject | 18 | — | — | Status 2 |
| Unhinge | 16 | ACCU Down / EVA Down | Infinite | −5 / −10 levels | Stat | Str |
| Intimidate | 16 | Slow | 100 | 100 (53.0 s) | Stat | Str |
| Envenom | 16 | Poison | 100 | Infinite | Stat | Str |
| Hurt | — | — | — | — | — | 37.5% of user's remaining HP |

> Mad Rush is the clean illustration of the accuracy system: `Power 32` (double Attack) **and** an always-critical (×2), i.e. `4×` an Attack — bought with a hard **70% hit rate** that ignores the user's Accuracy entirely. Expected value `4 × 0.70 = 2.8×`. `[single source]`

**Alchemist** — Attack 16 / Str. Every Stash and Mix result is item-typed; see §2.9.3 and §3.11.

**Lady Luck**

| Ability | Power | Status | Chance | Duration |
|---|---|---|---|---|
| Attack | 16 | — | — | — |
| Luck | — | LUCK Up | — | +10 levels |
| Felicity | — | LUCK Up | — | +3 levels |
| Tantalize | — | Confuse | 100 | 133 (70.5 s) |
| Regen (Magic Reels) | — | Regen | Infinite | 50 (26.5 s) |
| Shell / Protect / Reflect (reels) | — | Pro/Shl/Ref | Infinite | 126 (66.8 s) |

Every reel payload resolves to an existing ability or item and therefore inherits that entry's constant. Worked examples using this table: **Magic Reels triple Red 7 = Ultima at power 70 (`Mag`)**; **triple BAR = Black Sky, 6 × 10 hits**; **triple Cherry = Flare, power 55**; **Item Reels triple Cherry = Supreme Gem, power 50 → 2,500 damage**; **Blessed Gem = 5 × 8 hits → 250 × 8**; **Dark Matter = power 200 → 10,000, capped to 9,999**. **Dud** = 75% of current HP to the whole party (§2.3).

**Trainer** — Yuna / Kogoro

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Str |
| Kogoro Blaze | 18 | Darkness | 40 | Infinite | Str (fire) |
| Kogoro Freeze | 18 | Stop | 40 | 60 (31.8 s) | Str (ice) |
| Kogoro Shock | 18 | Berserk | 40 | 133 (70.5 s) | Str (lightning) |
| Kogoro Deluge | 18 | Sleep | 40 | 97 (51.4 s) | Str (water) |
| Kogoro Strike | — | Eject | 19 | — | Status 2 |
| Doom Kogoro | 18 | Doom | 100 | **4 turns** | Str |
| Kogoro Cure | 31 | — | — | — | Heal |
| Holy Kogoro | 32 | — | — | — | Str (holy) |
| Pound! | 38 | — | — | — | Str |

**Trainer** — Rikku / Ghiki

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Str |
| Sneaky Ghiki / Mugger Ghiki | 12 | — | — | — | Str |
| Ghiki Gouge | 12 | Darkness | 100 | Infinite | Str |
| Ghiki Gag | 12 | Silence | 100 | Infinite | Str |
| Pesky Ghiki | 12 | Berserk | 100 | 133 (70.5 s) | Str |
| **Bully Ghiki** | — | Delay + **Action-cancel** | Infinite | Weak / 100% | — |
| Ghiki Pep | 31 | — | — | — | Heal |
| Ghiki Cheer | — | STR Up + DEF Up | Infinite | +1 level each | — |
| Swarm, Swarm! (Pound Pound) | 38 | — | — | — | Str |

**Trainer** — Paine / Flurry

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Str |
| Poison Flurry | 16 | Poison | 100 | Infinite | Str |
| Stone Flurry | 16 | Petrify | 80 | Infinite | Str |
| Death Flurry | — | Death | 80 | — | — |
| Flurry Guard | 20 | Protect | Infinite | 100 (53.0 s) | Heal |
| Flurry Speed | 20 | Haste | Infinite | 80 (42.4 s) | Heal |
| Flurry Shield | 20 | Shell | Infinite | 100 (53.0 s) | Heal |
| HP Flurry | 31 | — | — | — | Heal |
| Carrier Flurry | — | Eject | 20 | — | Status 2 |
| Maulwings! | 38 | — | — | — | Str |

**Mascot** — Yuna / Rikku / Paine

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack (all three) | 16 | — | — | — | Str |
| **Moogle Beam** (Yuna) | **90** | — | — | — | Str |
| Moogle Regen / Regenja | — | Regen + Haste | Infinite | 80 (42.4 s) / 60 (31.8 s) | — |
| Moogle Wall / Wallja | — | Protect + Shell | Infinite | 100 (53.0 s) | — |
| Cait Fire/Thunder/Blizzard/Water (Rikku) | 16 | Petrify **or** Poison | 100 | — | Sp Mag |
| Power / Armor / Magic / Mental Eraser | — | STR / DEF / MAG / MDEF Down | Infinite | **−4 levels** | — |
| Speed Eraser | — | EVA Down | Infinite | **−10 levels** | — |
| PuPu Platter | — | Eject | 50 | — | Status 2 |
| Dark / Silence / Sleep / Poison / Berserk / Break / Arsenic Knife (Paine) | 18 | matching status | Infinite | — | Str |
| Stop Knife | 18 | Stop | Infinite | 126 (66.8 s) | Str |
| Quartet Knife | 18 | Multi (4 statuses) | Infinite | −3 | Str |
| **Cactling Gun** | **90** | — | — | — | Str |

> Moogle Beam and Cactling Gun at **power 90** are the strongest single-target `Str` abilities any standard dressphere has — 5.6× an Attack before chain. That is why Mascot is the endgame dressphere. `[single source]`

**Garment Grid- and accessory-granted abilities** (no dressphere owns these)

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Mug / Nab Gil | 16 | — | — | — | Str (always awards 1 AP even on failure) |
| Haste | — | Haste | Infinite | 50 (26.5 s) | — |
| Hastega | — | Haste | Infinite | 40 (21.2 s) | — |
| Blind | — | Darkness | 100 | Infinite | — |
| Silence | — | Silence | 100 | Infinite | — |
| Sleep | — | Sleep | 90 | 97 (51.4 s) | — |
| Hero Drink | — | Invincible | Infinite | 20 (10.6 s) | — |
| Osmose | 6 | — | — | — | Sp Mag (MP drain) |
| **Holy** | **12 (×8)** | — | — | — | Mag |
| **Flare** | **55** | — | — | — | Mag |
| **Ultima** | **70** | — | — | — | Mag |
| **Finale** | **48** | — | — | — | Str, `+99999` flat at step 8 |

### 2.9.2 Special dresspheres

**Floral Fallal — main body**

| Ability | Power | Status | Duration | Formula |
|---|---|---|---|---|
| Attack | 16 | — | — | Str |
| Heat / Ice / Electric / Aqua Whirl | **8 (×3)** | — | — | Sp Mag (elemental) |
| Barrier | — | Null Magic | 20 (10.6 s) | — |
| Shield | — | Null Physical | 20 (10.6 s) | — |
| Flare Whirl | **18 (×3)** | — | — | Sp Mag |
| **Great Whirl** | **8 (×12)** | — | — | Sp Mag |

**Floral Fallal — Right Pistil**

| Ability | Power | Status | Duration | Formula |
|---|---|---|---|---|
| White Pollen | 16 | — | — | Sp Mag (heal, party) |
| White Honey / Hard Leaves | — | Regen / Shell | 100 (53.0 s) | — |
| Tough Nuts / Mirror Petals | — | Protect / Reflect | 100 (53.0 s) | — |
| Floral Rush | — | Haste | 50 (26.5 s) | — |
| Floral Bomb / Fallal Bomb | 18 | STR Down / DEF Down | Infinite, −1 level | Str |
| Floral Magisol / Fallal Magisol | 18 | MAG Down / MDEF Down | Infinite, −1 level | Str |
| Right Stigma | 24 | — | — | Str |

**Floral Fallal — Left Pistil**

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Dream Pollen | 18 | **Sleep** | 100 | 97 (51.4 s) | Sp Mag |
| Mad Seeds | 18 | Berserk | 100 | 133 (70.5 s) | Sp Mag |
| Sticky Honey | 18 | Slow | 100 | 100 (53.0 s) | Sp Mag |
| Halfdeath Petals | 0.5 | — | — | — | Curr HP (gravity) |
| Poison Leaves | 18 | Poison | 100 | Infinite | Sp Mag |
| Death Petals | — | Death | 20 | — | Status 2 |
| Silent White | 18 | Darkness + Silence | 100 | Infinite | Str |
| Congealed Honey | 18 | Stop | 100 | 100 (53.0 s) | Str |
| Panic Floralysis | 18 | Confuse | 100 | 133 (70.5 s) | Str |
| Ash Floralysis | 18 | Petrify | 80 | Infinite | Str |
| Left Stigma | 24 | — | — | — | Str |

> **Correction:** §3.15 previously listed **Dream Pollen** as inflicting *Slow*. The constant table gives **Sleep**; Sticky Honey is the Slow one. `[single source]`

**Machina Maw — main body**

| Ability | Power | Status | Chance | Duration | Formula |
|---|---|---|---|---|---|
| Attack | 16 | — | — | — | Str |
| Death Missile / Break Missile | 18 | Death / Petrify | 80 | — | Str |
| Bio Missile / Berserk Missile | 18 | Poison / Berserk | 90 | Inf / 133 (70.5 s) | Str |
| Stop Missile | 18 | Stop | 100 | 100 (53.0 s) | Str |
| Confuse Missile | 18 | Confuse | 90 | 133 (70.5 s) | Str |
| **Shockwave** | **28** | — | — | — | Str, all |
| **Shockstorm** | **24** | Delay | Infinite | "Strong" | Str, all |
| **Vajra** | **80** | — | — | — | Str, all |

**Machina Maw — Smasher-R and Crusher-L**

| Ability | Part | Power | Status | Duration | Formula |
|---|---|---|---|---|---|
| Homing Ray | both | 20 | — | — | Str |
| Howitzer | both | 16 | — | — | Str |
| HP Repair | both | — | — | — | 25% of max HP |
| MP Repair | both | 30 | — | — | Heal (MP) |
| Sleep Shell | Smasher-R | 16 | Sleep 100 | 97 (51.4 s) | Str |
| Slow Shell | Smasher-R | 16 | Slow 100 | 100 (53.0 s) | Str |
| Anti-Power / Anti-Armor Shell | Smasher-R | **28** | STR / DEF Down | Infinite, **−3** | Str |
| Shellter / Protector | Smasher-R | — | Shell / Protect | 100 (53.0 s) | — |
| Blind Shell / Silence Shell | Crusher-L | 16 | Darkness / Silence | Infinite | Str |
| Anti-Magic / Anti-Mental Shell | Crusher-L | 16 | MAG / MDEF Down | Infinite, **−3** | Str |
| Booster | Crusher-L | — | Haste | 50 (26.5 s) | — |
| Offense / Defense | Crusher-L | — | STR / DEF Up | Infinite, **+3** | — |

**Full Throttle — main body**

| Ability | Power | Status | Chance | Formula |
|---|---|---|---|---|
| Attack | 16 | — | — | Str |
| Aestus / Winterkill / Levin / Whelmen | 20 | — | — | Str (fire / ice / lightning / water) |
| Assoil | 20 | — | — | Str (holy) |
| Wisenen | 0.75 | — | — | Curr HP (gravity) |
| **Fiers** | 16 | **Critical** | Always | Str (⇒ effective power 32) |
| Deeth | 20 | Death | 90 | Str |
| Fright | 24 | Confuse + Delay | Infinite | Str |
| **Sword Dance** | **48 (×2)** | — | — | Str, all enemies |

> **Sword Dance is the strongest thing in the game per action**: `48 × 2 hits` against *every* enemy, i.e. 6× an Attack per target, and the two hits self-chain. Combined with Full Throttle's `RT`-only main-part tagging (no charge at all on Throttle abilities), this is why the Bahamut chapter recommends the transformation. `[single source]`

**Full Throttle — Dextral Wing** (offence/debuff wing; every ability `Sp Mag`, 12 MP)

| Ability | Power | Status | Chance | Duration | AP |
|---|---|---|---|---|---|
| Venom Wing | 18 | Poison | Infinite | Infinite | init |
| Blind Wing | 18 | Darkness | Infinite | Infinite | init |
| Mute Wing | 18 | Silence | Infinite | Infinite | init |
| Lazy Wing | 18 | **Sleep** | Infinite | 97 (51.4 s) | init |
| Rock Wing | 18 | Petrification | 100 | Infinite | 10 |
| Violent Wing | 18 | Berserk | Infinite | 133 (70.5 s) | 10 |
| Still Wing | 18 | Stop | 100 | 100 (53.0 s) | 10 |
| Crazy Wing | 18 | Confusion | Infinite | 133 (70.5 s) | 10 |
| Stamina (HP restore, 1 target) | 32 | — | — | — | init |
| Mettle (MP restore, 1 target) | — | — | — | — | init |
| Reboot (revive 1 KO'd part) | — | — | — | — | 10 |

> **Correction:** §3.15 previously listed **Lazy Wing** as *Slow*. Both the FF Wiki's Dextral Arts table and the constant table give **Sleep**. There is no Slow in the Dextral set. `[verified: 2 sources]`

**Full Throttle — Sinistral Wing** (buff/debuff wing)

| Ability | AP | MP | Target | Effect | Duration |
|---|---|---|---|---|---|
| Steel Feather | init | 12 | party | **STR Up +2 levels** | Infinite |
| Diamond Feather | init | 12 | party | **DEF Up +2 levels** | Infinite |
| White Feather | init | 16 | all enemies | **STR Down 2 levels** | Infinite |
| Buckle Feather | init | 16 | all enemies | **DEF Down 4 levels** (FF Wiki) / **2 levels** (constant table) — conflict, use 4 | Infinite |
| Cloudy Feather | 10 | 16 | all enemies | **MAG Down 2 levels** | Infinite |
| Pointed Feather | 10 | 16 | all enemies | **MDEF Down 2 levels** (needs Cloudy Feather) | Infinite |
| Pumice Feather | 10 | 38 | party | **Haste** | 50 (26.5 s) |
| Ma'at's Feather | 10 | — | 1 enemy | Libra / Scan equivalent | — |
| Stamina | init | — | 1 char | restore HP — power **31**, `Heal` | — |
| Mettle | init | — | 1 char | restore MP | — |
| Reboot | 10 | — | 1 char | revive one KO'd part | — |
| Sinistral Arts | init | — | — | opens the skillset | — |

`[verified: 2 sources]` — AP/MP/target/effect from the FF Wiki *Sinistral Arts* and *Full Throttle (Final Fantasy X-2)* pages; power values and durations from the constant table.

### 2.9.3 Items and Mix results

Every item and Mix result uses `damage = power × 50` (a "Constant"-type step-1 base). **This rule reproduces all twelve independently-published Mix damage values exactly** — the cross-check that validates the whole sheet.

| Item | Power | Damage / effect | Notes |
|---|---|---|---|
| Budget Grenade | 0.4 | 20 | |
| Grenade | 4 | 200 | |
| S-Bomb | 7 | 350 | |
| M-Bomb | 8 | 400 | |
| L-Bomb | 9 | 450 | |
| Sleep / Silence / Dark Grenade | 5 | 250 + status, 50% | |
| Petrify Grenade | 5 | 250 + Petrify, 100% | |
| Bomb Fragment / Antarctic Wind / Electro Marble / Fish Scale (Lv 1 elemental) | 1.6 | 80 | |
| Bomb Core / Arctic Wind / Lightning Marble / Dragon Scale (Lv 2 elemental) | 6 | 300 | |
| Fire / Ice / Lightning / Water Gem | 2 (×6) | 100 × 6 hits | self-chains |
| Shining Gem | 30 | 1,500 | |
| Blessed Gem | 5 (×8) | 250 × 8 hits | self-chains hard |
| Supreme Gem | 50 | 2,500 | |
| Shadow Gem | 0.25 | 25% of current HP | gravity |
| **Dark Matter** | **200** | **10,000 → capped 9,999** | |
| Poison Fang | 8 | 400 + Poison 100% | |
| Silver / Gold Hourglass | — | Slow 100% for 100 (53.0 s) | |
| Candle of Life | — | Doom, 9 turns | |
| Farplane Shadow | — | Death, 18 (Status 2) | |
| Chocobo Feather / Wing | — | Haste, 100 (53.0 s) | |
| Healing Spring | — | Regen, 100 (53.0 s) | |
| Light / Lunar / Star Curtain | — | Protect / Shell / Reflect, 100 (53.0 s) | |
| Mana Spring | 4 | 200 MP | |
| Stamina Spring | 12 | 600 HP | |
| Soul Spring (item) | 20 | 1,000 drained | |
| Hero Drink (item) | — | Invincible, 20 (10.6 s) | |

**Mix results** (all `power × 50`; see §3.11 for which ingredient pairs produce them):

| Mix | Power | Damage | Cross-check vs FF Wiki |
|---|---|---|---|
| Pineapple | 3 | 150, all | 150 ✓ |
| Potato Masher | 14 | 700, all | 700 ✓ |
| Cluster Bomb | 30 | 1,500, all | 1,500 ✓ |
| Sunburst | 110 | 5,500, all | wiki says **6,000** — **conflict**, see note |
| Blaster Mine | 4 | 200 + Poison/Confuse 80%, 1 | 200 ✓ |
| Hazardous Shell | 20 | 1,000 + Poison/Confuse 80%, all | 1,000 ✓ |
| Heat Blaster / Snow Flurry / Thunderbolt / Waterfall | 2 (×3) | 100 × 3 | 100×3 ✓ |
| Firestorm / Icefall / Rolling Thunder / Flash Flood | 4 (×3) | 200 × 3 | 200×3 ✓ |
| Burning Soul / Winter Storm / Lightning Bolt / Tidal Wave | 8 (×4) | 400 × 4 | 400×4 ✓ |
| Brimstone / Black Ice / Aqua Toxin | 3 (×3) | 150 × 3 + status 100% | 150×3 ✓ |
| Electroshock | 3 (×3) | 150 × 3 + Petrify 80% | 150×3 ✓ |
| Abaddon Flame / Krysta / Dark Rain | 6 (×3) | 300 × 3 + status 100% | 300×3 ✓ |
| Thunderblast | 6 (×3) | 300 × 3 + Petrify 80% | 300×3 ✓ |
| Archangel | 1 (×8) | 50 × 8, 1 target | 50×8 ✓ |
| White Hole | 12 (×8) | 600 × 8, 1 target | 600×8 ✓ |
| Soul Spring | 0.1875 | drains ≈ 3/16 of **user max HP and MP** | "roughly 1/6" ✓ |
| Soul Sea | 0.375 | drains ≈ 3/8 of user max HP and MP | "roughly 1/3" ✓ |
| Nega Burst | 0.5 | 50% of current HP, all | ✓ |
| Black Hole | 0.75 | 75% of current HP, all | ✓ |
| Tallboy | 0.5 | 50% current HP + DEF/MDEF Down −3, all | ✓ |
| Grand Slam | 0.75 | 75% current HP + DEF/MDEF Down −5, all | ✓ |
| Chocobo Wing | — | Haste, party, **120 (63.6 s)** | ✓ |
| Wall / Hi-Wall / Final Wall | — | Protect (+Shell/+Reflect/+Haste), 100 (53.0 s) | ✓ |
| Hero Drink / Miracle Drink | — | Invincible, 15 (8.0 s) | ✓ |

> **Recorded conflict — Sunburst.** The constant table gives power **110** (= 5,500); the FF Wiki's Mix page states **6,000** (= power 120). Every other value in the column matches to the unit, so this is a one-cell discrepancy. **Use 6,000** — the wiki figure is the one a player can verify in-game, and the `×50` rule is otherwise perfect.

> **All item, Stash and Mix damage is hard-capped at 9,999** regardless of Break Damage Limit, except **Soul Spring, Soul Sea, Ultra Potion, Mega Vitality and Mega Cocktail** (§2.4). Dark Matter's power-200 = 10,000 is therefore always displayed as 9,999.

---

## 3. Dresspheres — complete ability data

### 3.0 How to read these tables

`AP` = ability points needed to learn (`init` = known from the start). `MP` = cast cost. `Tgt` = target scope. `Type`: **MCW** = adds a top-level command, **ACT** = active ability inside a submenu, **PAS** = always-on passive.

**Flags** (from Split Infinity's per-ability tagging, `[single source]` unless noted):

| Flag | Meaning |
|---|---|
| `P` | physical — halved by **Protect** |
| `S` | magical — halved by **Shell** |
| `S+` | damage scales with user **STR** / target **DEF Down** |
| `M+` | damage scales with user **MAG** / target **MDEF Down** |
| `R` | **reflectable** (single-target Black/White magic) |
| `E` | elemental — subject to affinity multipliers |
| `CT` | requires charge time (purple bar) |
| `RT` | instant, then recovery window |
| `2xRT` | instant, then **double-length** recovery |
| `CRIT` | can land a critical hit (×2) |
| `long` / `short` | **long range** = fires from starting position, no run-in; **short range** = must close distance (matters for chaining) |

> ### AP / MP COLUMN AUTHORITY — read this before using any cost
>
> **The tables in this section (§3.1–§3.15) are the authoritative AP/MP costs for the whole project.** Where `ffx2-bahamut.md` §4.4 disagrees, **this document wins and `ffx2-bahamut.md` is wrong.**
>
> The Bahamut document's Gunner table has its **AP and MP columns transposed** (it lists Potshot as "8 AP / 20 MP" etc.). The cause is identifiable: the FF Wiki's *Gunplay* page prints its columns in the order **Name | MP | AP | Description | Prerequisite**, i.e. **MP first**, and the Bahamut author read them as AP-first. The correct reading, confirmed on two independent sources, is:
>
> | Ability | **AP** | **MP** | Prerequisite |
> |---|---|---|---|
> | Potshot | 20 | 8 | — |
> | Cheap Shot | 30 | 8 | Potshot |
> | Enchanted Ammo | 30 | 8 | — |
> | Target MP | 30 | 8 | Enchanted Ammo |
> | Quarter Pounder | 40 | 8 | Target MP |
> | On the Level | 40 | 12 | Target MP |
> | Burst Shot | 60 | 12 | — |
> | Table-turner | 60 | 8 | Potshot |
> | Scattershot | 80 | 8 | Burst Shot |
> | Scatterburst | 120 | 36 | Scattershot |
>
> `[verified: 2 sources]` — FF Wiki *Gunplay* (explicit `MP | AP` header) and Jegged.com's Gunner page (AP-only listing: Potshot 20, Cheap Shot 30, Enchanted Ammo 30, Target MP 30, Quarter Pounder 40, On the Level 40, Burst Shot 60, Table-turner 60, Scattershot 80, Scatterburst 120, Trigger Happy Lv.2 80, Lv.3 150, Darkproof 30, Sleepproof 30). The two agree perfectly, and the AP column sums to the independently-published Gunner mastery total of **800**, which the transposed reading does not.
>
> The same arithmetic check settles the other two cross-document disputes:
> - **Warrior Power Break = 30 AP / 4 MP**, not `init`. Split Infinity's ability database prints `AP - na` for it, but the FF Wiki *Swordplay (Final Fantasy X-2)* table gives 30 AP, and 30 is exactly what is needed to make the Warrior's AP costs sum to the published mastery total of **740**. `ffx2-bahamut.md` §4.4 is correct here and §3.3 below has been fixed. `[verified: 2 sources + arithmetic]`
> - **White Mage Full-Life = 160 AP / 60 MP**, not 120. `ffx2-bahamut.md` §4.4 is correct. With Full-Life 160, Dispel 30 (not 20) and Cure 20 (not `init`), the White Mage costs sum to **750**, the published total. `[verified: 2 sources + arithmetic]`

**Mastery AP totals.** Every published "AP to master" figure is exactly the **sum of the dressphere's individual AP costs**, which is how the three disputes above were arbitrated. Totals computed from the corrected tables below:

| Dressphere | AP to master | Source | Confidence |
|---|---|---|---|
| Dark Knight | **490** | published + computed sum agrees | `[verified: 2 sources]` — the cheapest in the game |
| Black Mage | **680** | computed sum | `[single source, derived]` |
| Warrior | **740** | published 740 = computed sum with Power Break at 30 | `[verified: 2 sources]` |
| Songstress | **740** | computed sum (dances 680 + six songs at 10 each) | `[single source, derived]` |
| White Mage | **750** | published 750 = computed sum with Cure 20 / Dispel 30 / Full-Life 160 | `[verified: 2 sources]` |
| Samurai | **750** | computed sum | `[single source, derived]` |
| Gunner | **800** | published 800 = computed sum | `[verified: 2 sources]` |
| Gun Mage | **360** + 16 Blue Bullets | computed sum (10 × Fiend Hunter 20, FH Lv.2 20, Scan 20, Scan Lv.2 20, Scan Lv.3 100). Blue Bullets cost **0 AP** — they are learned by being hit, and each adds 1% mastery | `[single source, derived]` |
| Lady Luck | **1030** computed / **1050** published | 20 AP unaccounted; most likely Attack Reels is 20 AP rather than `init`. **Use 1050 and price Attack Reels at 20.** | `[contradicted]` |
| Thief | **1060** | computed sum | `[single source, derived]` |
| Berserker | **1360** | computed sum (Counterattack 180 + Magic Counter 300 + Evade & Counter 400 dominate) | `[single source, derived]` |
| Trainer | **600 per girl** (1800 across all three) | computed sum; each girl's pet has a separate 12-ability list | `[single source, derived]` |
| Mascot | **653 per girl** (1959 across all three) | computed sum | `[single source, derived]` |
| Alchemist | **2249** | computed sum — Ether 400 and Elixir 999 make it by far the most expensive | `[single source, derived]` |
| Special dresspheres | **~232 per part**, 696 per SDSP | computed sum across all three parts | `[single source, derived]` |

For the two encounters this project builds, the practical ceilings are: a Chapter 2/3 party realistically has **150–400 AP** invested per dressphere (see §6.7 for award rates), and a Chapter 5 party can plausibly have mastered 2–4 dresspheres per girl.

---

### 3.1 Gunner — Yuna's default. Long range, high Accuracy/Agility, no charge times.

Commands: **Attack · Trigger Happy · Gunplay · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| Attack | init | — | 1 any | MCW | physical damage, 1 target | P, S+, RT, CRIT, long |
| **Trigger Happy** | init | — | 1 enemy | MCW | Mash **R1** for **1.8 s**; each press fires one shot. Each shot is **damage constant 2** (one-eighth of a normal Attack's 16) and the ability fires **up to 60 shots** — see §2.9.1. | P, S+, **2xRT**, long |
| Potshot | 20 | 8 | 1 any | ACT | physical damage | P, S+, RT, CRIT, long |
| Cheap Shot | 30 | 8 | 1 any | ACT | physical damage, **ignores Def** | P, S+, RT, CRIT, long |
| Enchanted Ammo | 30 | 8 | 1 any | ACT | **non-elemental magic** damage | S, M+, RT, CRIT, long |
| Target MP | 30 | 8 | 1 any | ACT | special damage to target's **MP** | RT, long |
| Quarter Pounder | 40 | 8 | 1 any | ACT | fractional: removes **25% of current HP** | P, RT, CRIT, long |
| On the Level | 40 | 12 | 1 any | ACT | special damage = user Level × 16 | RT, long |
| Burst Shot | 60 | 12 | 1 any | ACT | **guaranteed critical** physical hit | P, S+, RT, CRIT, long |
| **Table-turner** | 60 | 8 | 1 any | ACT | physical; uses the inverted Def step `× (15 + Def)/255` — **more enemy Def = more damage** | P, S+, RT, CRIT, long |
| Scattershot | 80 | 8 | party | ACT | physical damage to all of target party | P, S+, RT, CRIT, long |
| Scatterburst | 120 | 36 | party | ACT | **guaranteed critical** to all of target party | P, S+, RT, CRIT, long |
| Darkproof | 30 | — | self | PAS | immune to Darkness | — |
| Sleepproof | 30 | — | self | PAS | immune to Sleep (needs Darkproof) | — |
| **Trigger Happy Lv. 2** | 80 | — | self | PAS | extends the window to **2.2 s** | — |
| **Trigger Happy Lv. 3** | 150 | — | self | PAS | extends the window to **2.6 s** (needs Lv. 2) | — |

**Trigger Happy minigame — implementation spec** `[verified: 2 sources]`:
- Window length: **1.8 s** base → **2.2 s** with Lv. 2 → **2.6 s** with Lv. 3.
- Input: repeated **R1** presses. One shot fires per press, subject to a per-shot cooldown/animation.
- Each shot uses **damage constant 2** (not 16 — corrected in §2.9.1) and can crit; the shots self-chain (each hit inside the 2 s window bumps the chain counter), so a long Trigger Happy climbs the chain multiplier by itself.
- Under **Haste** the delay between shots is reduced, effectively increasing shot count.
- The player may issue commands for the other two girls while Trigger Happy runs. If **two** characters are using Trigger Happy at once, **one R1 press fires for both**.
- Recovery afterwards is `2xRT`.
- *Original PS2 only:* with the **Cat Nip** accessory and the user in HP-Critical, every shot deals **9999** (the "9999 damage status", step 18 of the damage pipeline), making Trigger Happy the strongest attack in the game. In *International + Last Mission* and *HD Remaster*, Cat Nip also carries Auto-Slow and **Auto-Berserk**, and Berserk locks out the Trigger Happy command, killing the trick. `[verified: 2 sources]`

---

### 3.2 Thief — Rikku's default. Best Evasion, second-best Agility. Attack strikes twice.

Commands: **Attack · Steal · Flimflam · Flee · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| **Attack** | init | — | 1 any | MCW | physical damage — **strikes twice** (built-in 2-hit, self-chains) | P, S+, RT, CRIT, short |
| Steal | init | — | 1 enemy | MCW | attempt to steal an item. **Only one item per enemy per battle** (common *or* rare); an **Oversoul resets** the steal. | RT, short |
| Pilfer Gil | 30 | 2 | 1 enemy | ACT | steal gil; once per enemy, reset by Oversoul | RT, short |
| Borrowed Time | 100 | 16 | 1 enemy | ACT | inflict **Stop** | RT, short |
| Pilfer HP | 60 | 10 | 1 enemy | ACT | drain HP to the user (needs Pilfer Gil) | RT, short |
| Pilfer MP | 60 | **0** | 1 enemy | ACT | drain MP to the user (needs Pilfer HP) | RT, short |
| **Sticky Fingers** | 120 | 20 | 1 enemy | ACT | **100% guaranteed** item steal (needs Pilfer HP) | RT, short |
| **Master Thief** | 140 | 20 | 1 enemy | ACT | attempt to steal the **rare** item (needs Sticky Fingers) | RT, short |
| Soul Swipe | 160 | 12 | 1 enemy | ACT | inflict **Berserk** (needs Pilfer HP) | RT, short |
| **Steal Will** | 160 | 18 | 1 enemy | ACT | attempt to **Eject** the enemy from battle (needs Soul Swipe) | RT, short |
| Flee | 10 | — | all allies | MCW | **100% escape** for all non-KO'd girls; you keep spoils from enemies already killed | CT |
| Item Hunter | 60 | — | self | PAS | raises post-battle item drop odds | — |
| **First Strike** | 40 | — | self | PAS | user begins battle with a **full ATB bar**, even when Ambushed | — |
| **Initiative** | 60 | — | self | PAS | raises the chance of a party pre-emptive strike (needs First Strike) | — |
| Slowproof | 20 | — | self | PAS | immune to Slow (needs Item Hunter) | — |
| Stopproof | 40 | — | self | PAS | immune to Stop (needs Slowproof) | — |

> The prompt lists a Thief ability "Nuisance" — **no such ability exists** in FFX-2. The Flimflam command holds Pilfer Gil / Pilfer HP / Pilfer MP / Sticky Fingers / Master Thief / Soul Swipe / Steal Will / Borrowed Time. `[verified: 2 sources]`

**Why Thief is the chain dressphere** `[verified: 2 sources]`: Agility 62–64 at Lv 30–50 (second only to Berserker), every Attack is two hits, and every ability is `RT` (zero charge). Recommended "chain engine" build.

---

### 3.3 Warrior — Paine's default. High HP/Str/Def, terrible MDef.

Commands: **Attack · Swordplay · Assault · Sentinel · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| Attack | init | — | 1 any | MCW | physical damage | P, S+, RT, CRIT, short |
| **Sentinel** | 20 | — | self | MCW | until the user's ATB refills, **all physical damage taken becomes 1 HP**. Magic unaffected. User immobile meanwhile. | **2xRT** |
| Flametongue | 20 | 4 | 1 any | ACT | **Fire** physical damage | P, S+, E, CT, CRIT, short |
| Ice Brand | 20 | 4 | 1 any | ACT | **Ice** physical damage | P, S+, E, CT, CRIT, short |
| **Thunder Blade** | 20 | 4 | 1 any | ACT | **Lightning** physical damage | P, S+, E, CT, CRIT, short |
| Liquid Steel | 20 | 4 | 1 any | ACT | **Water** physical damage | P, S+, E, CT, CRIT, short |
| Demi Sword | 60 | 6 | 1 any | ACT | **Gravity** physical damage (needs all four elemental blades) | P, S+, E, CT, CRIT, short |
| **Excalibur** | 120 | 24 | 1 any | ACT | **Holy** physical damage (needs Demi Sword) | P, S+, E, CT, CRIT, short |
| **Power Break** | **30** | 4 | 1 any | ACT | damage + **STR Down 2 levels**. *(Was listed as `init` here; corrected — see the AP authority box in §3.0.)* | P, S+, CT, CRIT, short |
| **Armor Break** | 30 | 4 | 1 any | ACT | damage + **DEF Down 2 levels** | P, S+, CT, CRIT, short |
| **Magic Break** | 30 | 4 | 1 any | ACT | damage + **MAG Down 2 levels** | P, S+, CT, CRIT, short |
| **Mental Break** | 30 | 4 | 1 any | ACT | damage + **MDEF Down 2 levels** (needs Magic Break) | P, S+, CT, CRIT, short |
| Delay Attack | 100 | 10 | 1 any | ACT | damage + **Delay effect** (needs Armor Break) | P, S+, CT, CRIT, short |
| Delay Buster | 120 | 16 | 1 any | ACT | damage + Delay effect **twice as strong** (needs Delay Attack) | P, S+, CT, CRIT, short |
| **Assault** | 100 | — | all allies | MCW | casts **Berserk + Haste + Shell + Protect** on the whole party, plus **STR +1 level**. Ribbon does **not** block this Berserk. (needs Sentinel) | — |
| SOS Protect | 20 | — | self | PAS | permanent Protect while HP < 33% max (cannot be dispelled, does not wear off) (needs Sentinel) | — |

> Naming note: the prompt writes "Thunder Spark"; the actual ability is **Thunder Blade**. `[verified: 2 sources]`
> Swordplay outside Warrior: **Sword Lore** accessory (`STR +12`, grants the Swordplay command) or the **Pride of the Sword** Garment Grid. Mascot Yuna also keeps her learned Swordplay. `[verified: 2 sources]`

---

### 3.4 Songstress — sustained-aura dressphere. No Attack command.

Commands: **Dance · Sing · Item** `[verified: 2 sources]`

**Dances** — every Dance is `2xRT`, costs **0 MP**, and its effect lasts *for as long as the Songstress is dancing*, i.e. the whole time her ATB gauge is refilling. Choosing a new action ends the dance.

| Dance | AP | Target | Effect | Confidence |
|---|---|---|---|---|
| **Darkness Dance** | init | all enemies | continuous **Darkness** | `[verified: 2 sources]` |
| **Samba of Silence** | 20 | all enemies | continuous **Silence** | `[verified: 2 sources]` |
| **MP Mambo** | 20 | all allies | all MP costs become **0** — requires key item *Magical Dances Vol. I* | `[verified: 2 sources]` |
| **Magical Masque** | 20 | all allies | party gains **Null Magic** — requires key item *Magical Dances Vol. II* | `[verified: 2 sources]` |
| **Sleepy Shuffle** | 80 | all enemies | continuous **Sleep**; **physical hits do NOT wake them** | `[verified: 2 sources]` |
| **Carnival Cancan** | 80 | all allies | party max HP **doubled** and party recovers **25% of original max HP** (needs Sleepy Shuffle) | `[single source]` |
| **Slow Dance** | 60 | all enemies | continuous **Slow** | `[verified: 2 sources]` |
| **Breakdance** | 120 | all enemies | continuous **Stop** (needs Slow Dance) | `[verified: 2 sources]` |
| **Jitterbug** | 120 | all allies | continuous **Haste** (needs Slow Dance) | `[verified: 2 sources]` |
| **Dirty Dancing** | 160 | all allies | **every party physical attack deals critical damage** (needs Carnival Cancan) | `[verified: 2 sources]` |

**Songs** — all cost **4 MP**, are `CT`, and apply a persistent party-wide stat buff.

| Song | AP | Effect | Confidence |
|---|---|---|---|
| Battle Cry | 10 | party **STR Up +1 level** | `[verified: 2 sources]` |
| Cantus Firmus | 10 | party **DEF Up +1 level** (needs Battle Cry) | `[verified: 2 sources]` |
| Esoteric Melody | 10 | party **MAG Up +1 level** | `[verified: 2 sources]` |
| Disenchant | 10 | party **MDEF Up +1 level** (needs Esoteric Melody) | `[verified: 2 sources]` |
| **Perfect Pitch** | 10 | party **ACCU Up +10 levels** | `[verified: 2 sources]` |
| Matador's Song | 10 | party **EVA Up +10 levels** (needs Perfect Pitch) | `[verified: 2 sources]` |

> Names in the prompt that do **not** exist in FFX-2: "Wither", "Brr…", "Cantata" (the real song is **Cantus Firmus**). Sing **and** Dance are both blocked by Silence. `[verified: 2 sources]`
> Songstress is mastered at 14 learnable abilities + 2 key-item dances (MP Mambo, Magical Masque). `[single source]`

---

### 3.5 White Mage — no Attack command. Best MDef, high MP/Mag.

Commands: **Pray · Vigor · White Magic · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| **Pray** | init | — | all allies | MCW | small HP recovery to the whole party | S, M+, RT |
| **Vigor** | 20 | — | self | MCW | user recovers **50% of max HP** | S, M+, RT |
| **Cure** | **20** | 4 | 1 or all | ACT | small HP recovery. Already known from the start in *International* / *HD Remaster*, but still costs 20 AP toward mastery. Power **22**, `Heal`. | R, S, M+, CT |
| **Cura** | 40 | 10 | 1 or all | ACT | medium HP recovery | R, S, M+, CT |
| **Curaga** | 80 | 20 | 1 or all | ACT | large HP recovery (needs Cura) | R, S, M+, CT |
| **Regen** | 80 | 40 | 1 any | ACT | Regen status, ≈3% max HP per tick (needs Curaga) | R, CT |
| **Esuna** | 20 | 10 | 1 any | ACT | cures Berserk, Confuse, Curse, Darkness, Itchy, Petrification, Pointless, Poison, Silence, Sleep, Slow, Stop | R, CT |
| **Dispel** | **30** | 12 | 1 any | ACT | strips Auto-Life, Shell, Protect, Reflect, Regen, Haste, Spellspring (needs Esuna) | CT |
| **Life** | 30 | 18 | 1 any | ACT | revive with **50% max HP** | R, S, CT |
| **Full-Life** | **160** | 60 | 1 any | ACT | revive with **full max HP**; can exceed 9999 with caster BDL + target BHL (needs Life). *(Was 120 here; `ffx2-bahamut.md`'s 160 is correct — see §3.0.)* | R, S, CT |
| **Shell** | 30 | 10 | party | ACT | Shell on all of target party | R, CT |
| **Protect** | 30 | 12 | party | ACT | Protect on all of target party (needs Shell) | R, CT |
| **Reflect** | 30 | 14 | party | ACT | Reflect on all of target party (needs Protect) | R, CT |
| **Full-Cure** (nav-box name: **Renew**) | 80 | **99** | 1 any | ACT | full HP + removes every negative status **except KO and Doom**; can exceed 9999 with BDL+BHL (needs Regen) | R, S, CT |
| White Magic Lv. 2 | 40 | — | self | PAS | White Magic charge time **−30%** (needs Vigor) | — |
| White Magic Lv. 3 | 60 | — | self | PAS | White Magic charge time **−50%** (needs Lv. 2) | — |

> **Not available natively**: Holy, Hastega, Auto-Life. Those come from Garment Grids / accessories (see §4). `[verified: 2 sources]`
> Healing uses the *Magic Recovery* pipeline: `(Lv*2 + Mag) × C²/128 × (270-MDef)/255 × (12+MagLevel)/12 × rand(240..271)/256`, then **halved by Shell** and **halved again if cast on the whole party**. `[single source]`
> Split Infinity flags a bug/quirk: **White Magic used from the pause menu has no randomiser**. `[single source]`

---

### 3.6 Black Mage — no Attack command. Highest MP and Magic of the standard set.

Commands: **Black Magic · Focus · MP Absorb · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| Fire | init | 4 | 1 or all | ACT | weak **Fire** magic | R, S, M+, E, CT |
| Blizzard | init | 4 | 1 or all | ACT | weak **Ice** magic | R, S, M+, E, CT |
| Thunder | init | 4 | 1 or all | ACT | weak **Lightning** magic | R, S, M+, E, CT |
| Water | init | 4 | 1 or all | ACT | weak **Water** magic | R, S, M+, E, CT |
| Fira | 40 | 12 | 1 or all | ACT | medium Fire | R, S, M+, E, CT |
| Blizzara | 40 | 12 | 1 or all | ACT | medium Ice | R, S, M+, E, CT |
| Thundara | 40 | 12 | 1 or all | ACT | medium Lightning | R, S, M+, E, CT |
| Watera | 40 | 12 | 1 or all | ACT | medium Water | R, S, M+, E, CT |
| Firaga | 100 | 24 | 1 or all | ACT | major Fire (needs Fira) | R, S, M+, E, CT |
| Blizzaga | 100 | 24 | 1 or all | ACT | major Ice (needs Blizzara) | R, S, M+, E, CT |
| Thundaga | 100 | 24 | 1 or all | ACT | major Lightning (needs Thundara) | R, S, M+, E, CT |
| Waterga | 100 | 24 | 1 or all | ACT | major Water (needs Watera) | R, S, M+, E, CT |
| **Focus** | 10 | — | self | MCW | user gains **MAG Up +3 levels** | CT |
| **MP Absorb** | 10 | — | 1 any | MCW | drains MP from target into the user (needs Focus) | CT |
| Black Magic Lv. 2 | 40 | — | self | PAS | Black Magic charge time **−30%** (needs MP Absorb) | — |
| Black Magic Lv. 3 | 60 | — | self | PAS | Black Magic charge time **−50%** (needs Lv. 2) | — |

**The Fire → Ultima tier ladder.** Black Mage natively tops out at **-ga**. Everything above it is Garment-Grid or accessory content `[verified: 2 sources]`:

| Tier | Spell | Native to Black Mage? | Other access |
|---|---|---|---|
| I | Fire / Blizzard / Thunder / Water | yes (initial) | element Garment Grids (Heart of Flame, Ice Queen, Thunder Spawn, Menace of the Deep) when equipped |
| II | Fira / Blizzara / Thundara / Watera | yes (40 AP) | element GG, two gates (e.g. Heart of Flame Green+Red) |
| III | Firaga / Blizzaga / Thundaga / Waterga | yes (100 AP) | element GG, all three gates; Crimson/Snow/Ochre/Cerulean Ring accessories |
| IV | **Flare** (non-elemental, single target) | **no** | **Conflagration** GG — pass Red+Blue+Green gates |
| V | **Ultima** (non-elemental, all enemies) | **no** | **Megiddo** GG (all gates) **or** Lady Luck's **Magic Reels** triple Red 7 |
| — | **Holy** (holy element) | **no** | Garment Grids / accessories only |
| — | **Black Sky** (10 hits non-elemental) | **no** — it is an **Arcana** (Dark Knight) spell | Dark Knight 100 AP, Chaos Maelstrom GG, or Magic Reels triple BAR |

> **Damage constants — corrected, see §2.9.1.** The previously-quoted ladder (`Lv.1 = 12, Lv.2 = 24, Lv.3 = 42, Flare = 60, Ultima = 70, Holy = 100`) came from an unnamed third-party transcription and is **wrong**. The real values are:
>
> | Spell tier | `Power` (C) | Relative damage after `C²/64` |
> |---|---|---|
> | Fire / Blizzard / Thunder / Water | **8** | ×1.00 |
> | Fira / Blizzara / Thundara / Watera | **13** | ×2.64 |
> | Firaga / Blizzaga / Thundaga / Waterga | **21** | ×6.89 |
> | Flare (GG only) | **55** | ×47.3 |
> | Ultima (GG / Magic Reels only) | **70** | ×76.6 |
> | Holy (GG only) | **12 × 8 hits** | ×2.25 per hit, ×18 total — **and it builds 8 chain links** |
> | MP Absorb | **3** | `Sp Mag` branch |
> | Focus | — | MAG Up **+3 levels** ⇒ `×(12+3)/12 = ×1.25` on every subsequent spell |
>
> `[single source: pbirdman calculator, cross-validated — see §2.9]`. Note the consequences: **Firaga is only 6.9× Fire**, not the 12.25× the old ladder implied, and **Holy is a chain engine, not a nuke** — eight separate hits inside the 2 s window take the chain multiplier to ×1.75 by the last one.

---

### 3.7 Gun Mage — the Blue Mage. Long range, quadruple damage vs matching species.

Commands: **Attack · Blue Bullet · Fiend Hunter · Scan · Item**

**Fiend Hunter** (all `3 MP`, `20 AP`, `P, S+, CT, CRIT, long`) — each deals **×4 damage** (step 12) against one species:

| Ability | Target species | Prerequisite |
|---|---|---|
| Shell Cracker | Helm | — |
| Anti-Aircraft | Bird / Wasp | — |
| Silver Bullet | Lupine | — |
| Flan Eater | Flan | — |
| Elementillery | Elemental | Flan Eater |
| Killasaurus | Reptile | — |
| Drake Slayer | Drake | Killasaurus |
| Dismantler | Machine | — |
| Mech Destroyer | Mech | Dismantler |
| Demon Muzzle | Imp / Evil Eye | Anti-Aircraft |

| Support ability | AP | Effect |
|---|---|---|
| **Fiend Hunter Lv. 2** | 30 | Fiend Hunter charge time **−40%** |
| **Scan** | init | reveals target HP, MP, elemental affinities, status resistances |
| **Scan Lv. 2** | 20 | lets you rotate/zoom the enemy model in the Scan screen |
| **Scan Lv. 3** | 100 | Scan can also target your own party (needs Scan Lv. 2) |

**Blue Bullet — all 16 spells.** Learned by **being hit by the move while wearing Gun Mage** (KO'd is fine; the enemy must be the user). Each learned spell adds 1% toward mastering Gun Mage. `[verified: 2 sources]`

| Blue Bullet | MP | Target | Effect | Flags | Confidence |
|---|---|---|---|---|---|
| **1000 Needles** | 24 | 1 any | flat **1000** special damage | CT | `[verified: 2 sources]` |
| **Absorb** | 3 | 1 any | drains HP **and** MP to the user | M+, CT | `[single source]` |
| **Annihilator** | 48 | party | non-elemental magic, **ignores MDef** | S, M+, CT | `[single source]` |
| **Bad Breath** | 64 | party | inflicts **Poison, Silence, Darkness, Slow, Sleep** and either Berserk **or** Confusion (never both) | CT | `[verified: 2 sources]` |
| **Blaster** | 30 | 1 any | fractional: removes **93.75% of current HP** | CT | `[single source]` |
| **Cry in the Night** | 80 | party | large non-elemental magic damage | S, M+, CT | `[verified: 2 sources]` |
| **Drill Shot** | 32 | 1 any | physical damage | P, S+, CT | `[single source]` |
| **Fire Breath** | 28 | party | **Fire** magic damage | S, M+, E, CT | `[verified: 2 sources]` |
| **Heaven's Cataract** | 22 | party | non-elemental magic damage + **DEF Down 2 and MDEF Down 2** | S, M+, CT | `[single source]` |
| **Mighty Guard** | 32 | party | casts **Shell + Protect** on the party | CT | `[verified: 2 sources]` |
| **Mortar** | **99** | party | physical damage to all, **ignores Def** | P, S+, CT | `[single source]` |
| **Seed Cannon** | 28 | 1 any | removes **37.5% of target max HP**, physical type | P, CT | `[single source]` |
| **Stone Breath** | 32 | party | attempts **Petrification** on all | CT | `[verified: 2 sources]` |
| **Storm Cannon** | 38 | party | non-elemental magic damage `= caster Level × 30` | S, CT | `[single source]` |
| **Supernova** | 70 | party | enormous non-elemental magic damage | S, M+, CT | `[verified: 2 sources]` |
| **White Wind** | 16 | party | heals **37.5% of each target's max HP** + cures Poison, Silence, Darkness, Berserk, Confuse, Sleep | CT | `[verified: 2 sources]` |

**Which names from the prompt exist:** Fire Breath ✔ · White Wind ✔ · Bad Breath ✔ · Mighty Guard ✔ · Stone Breath ✔ · Absorb ✔ · Drill Shot ✔ · Heaven's Cataract ✔ · Storm Cannon ✔ · Mortar ✔ · Cry in the Night ✔ · Annihilator ✔ · Supernova ✔ · 1000 Needles ✔. **"Seed Burst" ✘** — the real name is **Seed Cannon**. **"Black Sky" ✘** — that is a Dark Knight *Arcana* spell, not a Blue Bullet. **"Aqua Breath" ✘** — does not exist in FFX-2. The 16th Blue Bullet the prompt omits is **Blaster**. `[verified: 2 sources]`

**Learning gotchas for the fan game** `[verified: 2 sources]`:
- **White Wind** and **Mighty Guard** must be *cast on your party by a Confused enemy* — you have to Confuse the fiend and wait.
- **Cry in the Night** is only available from **Oversouled Mega Tonberry** (Via Infinito floors 41+).
- **Supernova** only from Ultima Weapon; **Annihilator** only from the Experiment with its Special trait at Lv 5; **Mortar** only from Gippal in the Den of Woe.

---

### 3.8 Dark Knight — highest HP+Def of the standard set, slow (Agility 39–41).

Commands: **Attack · Darkness · Arcana · Charon · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| Attack | init | — | 1 any | MCW | physical damage | P, S+, RT, CRIT, short |
| **Darkness** | init | — | party | MCW | user spends **12.5% of max HP**; physical damage to **all** of target party, **ignores Def**; scales with STR; unusable below 12.5% HP; **free under Spellspring** | S+, CT, long |
| **Charon** | 20 | — | 1 enemy | MCW | unblockable special damage `= user max HP × 2`; **the user is removed from the battle**; can exceed 9999 with BDL | CT, short |
| Drain | 20 | 8 | 1 any | ACT | drains HP to the user | R, S, M+, CT |
| **Demi** | 20 | 10 | party | ACT | gravity magic, removes **25% of current HP** from all | S, CT |
| Confuse | 30 | 12 | 1 any | ACT | inflict **Confusion** (needs Demi) | R, CT |
| **Break** | 40 | 20 | 1 any | ACT | inflict **Petrification** (needs Confuse) | R, CT |
| **Bio** | 30 | 16 | party | ACT | inflict **Poison** on all | R, CT |
| **Doom** | 20 | 18 | 1 any | ACT | inflict **Doom** countdown (needs Bio) | CT |
| **Death** | 50 | 24 | 1 any | ACT | attempt instant **KO** (needs Doom) | R, CT |
| **Black Sky** | 100 | **80** | party | ACT | **10 hits** of non-elemental magic damage to all; **damage is based on the user's STR**; blocked by Silence (needs Death) | S, S+, CT |
| Poisonproof | 30 | — | self | PAS | immune to Poison | — |
| Stoneproof | 30 | — | self | PAS | immune to Petrification (needs Poisonproof) | — |
| Confuseproof | 30 | — | self | PAS | immune to Confusion (needs Stoneproof) | — |
| Curseproof | 30 | — | self | PAS | immune to Curse | — |
| Deathproof | 40 | — | self | PAS | immune to KO (needs Curseproof) | — |

> From the prompt's Dark Knight list: **Osmose ✘** (that is an accessory/Garment-Grid ability — Black Tome, White Tome, Covetous GG; Black Mage's equivalent is **MP Absorb**). **Berserk ✘** (Berserker dressphere). **"Poisontouch" ✘** as a Dark Knight ability — it is an auto-ability from Garment Grids/accessories; the Dark Knight's poison spell is **Bio**. `[verified: 2 sources]`
> Arcana outside Dark Knight: **Arcane Lore** accessory (`MAG +12`) or **Chaos Maelstrom** Garment Grid. **Arcane Tome** accessory gives Turbo Arcana (**−40% charge**). Mascot Yuna keeps her learned Arcana. `[verified: 2 sources]`
> Black Sky is unusual: a *magic* ability that scales off **Strength**. Implement it as special-magic type with `S+`.

---

### 3.9 Samurai — gil-throwing and instant-death specialist. All self-buffs (cannot target allies).

Commands: **Attack · Bushido · Spare Change · Zantetsu · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| Attack | init | — | 1 any | MCW | physical damage | P, S+, RT, CRIT, short |
| **Spare Change** | 20 | — | 1 any | MCW | throw gil for special damage: `(22 × Gil) / (sqrt(Gil) + 20)`; max throw 99,999,999 gil; can exceed 9999 with BDL | CT, long |
| **Zantetsu** | 140 | — | 1 enemy | MCW | instant-kill attempt on one enemy. **Independent of KO immunity** — every enemy has its own Zantetsu resistance 0–255; lower resistance and higher user Level raise the odds. (needs Shin-Zantetsu) | CT, long |
| **Mirror of Equity** | init | 16 | 1 any | ACT | physical damage `= (user max HP − user current HP) / 2` | P, CT, short |
| **Magicide** | 30 | 4 | 1 any | ACT | special damage to the target's **MP**; can crit | CT, CRIT, short |
| **Dismissal** | 30 | 10 | 1 any | ACT | damage + **Action-cancel**: if the target is charging (CTIM), the action is cancelled and its ATB restarts (needs Magicide) | P, S+, CT, CRIT, short |
| **Fingersnap** | 40 | 10 | 1 any | ACT | damage + **removes all STR/DEF/MAG/MDEF/ACCU/EVA/LUCK Up and Down levels** from the target (needs Dismissal) | P, S+, CT, CRIT, short |
| **Sparkler** | 40 | 12 | 1 any | ACT | physical damage, **ignores Def** | P, S+, CT, long |
| **Fireworks** | 60 | 18 | party | ACT | physical damage to all, **ignores Def** (needs Sparkler) | P, S+, CT, long |
| **Momentum** | 60 | 10 | 1 any | ACT | physical damage + **1 flat damage per enemy your party slot has ever defeated** (needs Sparkler) | P, CRIT, CT, short |
| **Shin-Zantetsu** | 100 | 32 | party | ACT | instant-KO attempt on **all** enemies (needs Momentum) | CT, long |
| **Nonpareil** | 20 | 10 | self | ACT | **STR Up +2**, **ACCU Up +10** | CT |
| **No Fear** | 30 | 12 | self | ACT | **Shell + Protect** on the user (needs Nonpareil) | CT |
| **Clean Slate** | 40 | 16 | self | ACT | heal **25% max HP** (halved by Shell) + cure Curse/Darkness/Pointless/Poison/Silence/Slow (needs No Fear) | S, CT |
| **Hayate** | 60 | 20 | self | ACT | **Haste** + **EVA Up +10** on the user (needs Clean Slate) | CT |
| **SOS Critical** | 80 | — | self | PAS | all user physical attacks are **critical** while HP < 33% max (needs Fireworks) | — |

> From the prompt's Samurai list: **Ashura ✘** and **SOS Spellspring ✘** (the latter is **Lady Luck**, 30 AP). Samurai's low-HP passive is **SOS Critical**. `[verified: 2 sources]`
> Bushido outside Samurai: **Bushido Lore** accessory (`STR +12`) or **Samurai's Honor** Garment Grid; **Bushido Tome** gives Turbo Bushido (−40% charge). Mascot Paine keeps her learned Bushido. `[verified: 2 sources]`
> Shin-Zantetsu, Fireworks, Clean Slate and Magicide also appear as Lady Luck **Attack Reels** results. `[verified: 2 sources]`

---

### 3.10 Berserker — highest HP and Agility, the counter-attack dressphere.

Commands: **Attack · Berserk · Instinct · Howl · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| Attack | init | — | 1 any | MCW | physical damage | P, S+, RT, CRIT, short |
| **Berserk** | init | — | self | ACT | **STR Up +1 level** and self-inflicted **Berserk** (damage ×1.25 via step 10, but you lose control until it wears off or Esuna clears it) | CT |
| **Cripple** | 20 | 6 | 1 any | ACT | fractional physical: removes **50% of current HP** | P, CT, short |
| **Mad Rush** | 30 | 6 | 1 any | ACT | lowered accuracy, much higher damage if it connects (needs Cripple) | P, S+, CT, CRIT, short |
| **Crackdown** | 30 | 6 | 1 any | ACT | damage + **strips Protect, Shell and Reflect** | P, S+, CT, CRIT, short |
| **Eject** | 40 | 8 | 1 enemy | ACT | attempt to **eject** one enemy from battle (needs Mad Rush) | CT, short |
| **Unhinge** | 40 | 8 | 1 any | ACT | damage + **ACCU Down 5**, **EVA Down 10** (needs Crackdown) | P, S+, CT, CRIT, short |
| **Intimidate** | 50 | 8 | 1 any | ACT | damage + **Slow** (needs Unhinge) | P, S+, CT, CRIT, short |
| **Envenom** | 30 | 10 | 1 any | ACT | damage + **Poison** | P, S+, CT, CRIT, short |
| **Hurt** | 60 | 10 | 1 any | ACT | damage `= 37.5% of the user's remaining HP` (needs Envenom) | P, CT, CRIT, short |
| **Howl** | 80 | — | self | MCW | **doubles the user's max HP**; can exceed 9999 with BHL; does **not** stack with other HP-doubling effects (needs Mad Rush) | CT |
| Itchproof | 20 | — | self | PAS | immune to **Itchy** (needs Cripple) | — |
| **Counterattack** | 180 | — | self | PAS | counter any single-target physical attack with a physical attack. **Does not trigger on hit-all attacks.** | — |
| **Magic Counter** | 300 | — | self | PAS | counter any single-target magic attack with a physical attack (needs Counterattack). Not on hit-all. | — |
| **Evade & Counter** | 400 | — | self | PAS | attempt to evade the incoming physical attack, then counter (needs Magic Counter) | — |
| **Auto-Regen** | 80 | — | self | PAS | permanent Regen — cannot be dispelled, never wears off (needs Hurt) | — |

> From the prompt's Berserker list: **"Scalp" ✘** — no such ability. Everything else listed exists. `[verified: 2 sources]`
> Instinct outside Berserker: **Nature's Lore** accessory (`STR +12`) or **Blood of the Beast** Garment Grid; **Nature's Tome** gives Turbo Instinct. Mascot Rikku keeps her learned Instinct. `[verified: 2 sources]`

---

### 3.11 Alchemist — free consumables and the Mix system. Long range.

Commands: **Attack · Mix · Stash · Item**

**Stash** — produces the named item **without consuming stock**. All are `CT`, cost **0 MP**.

| Stash ability | AP | Effect (identical to the item) |
|---|---|---|
| Potion | 10 | 1 target recovers **200 HP** |
| Hi-Potion | 40 | 1 target recovers **1000 HP** (needs Potion) |
| Mega-Potion | 120 | party recovers **2000 HP** each (needs Hi-Potion) |
| X-Potion | 160 | 1 target recovers up to **9999 HP** (needs Mega-Potion) |
| Remedy | 20 | cures the 12-status Esuna list |
| Dispel Tonic | 20 | strips Auto-Life/Shell/Protect/Reflect/Regen/Haste/Spellspring (needs Remedy) |
| Phoenix Down | 30 | revive with **25% max HP** |
| Mega Phoenix | 200 | revive up to two allies with **25% max HP** (needs Phoenix Down) |
| Ether | **400** | 1 target recovers **100 MP** (needs Dispel Tonic) |
| **Elixir** | **999** | 1 target recovers up to **9999 HP and 999 MP** (needs Ether) |

**Passives**

| Passive | AP | Effect |
|---|---|---|
| **Items Lv. 2** | 30 | Item-command charge time **−80%** (does **not** affect Stash) |
| **Chemist** | 40 | HP/MP recovery items used by this character are **doubled** (not Stash) |
| **Elementalist** | 80 | elemental-damage items are **doubled** (not Stash) |
| **Physicist** | 100 | non-elemental-damage items are **doubled** (needs Chemist + Elementalist; not Stash) |

#### Mix — the complete lookup engine

**Mix is not a recipe list. It is a two-field lookup, and it is fully decoded.** There are **4,624 possible ingredient pairs** producing **53 outcomes**, so a per-pair table is neither possible nor necessary: every item carries two hidden fields — a **Priority** integer 1–4 and a **Type** — and three functions resolve the pair. `CT` for every combination; free (the items are consumed, but Mix itself costs 0 MP). `[verified: 2 sources]` — FF Wiki *Mix (Final Fantasy X-2)* mechanics section and *Final Fantasy X-2 items* (which publishes the Priority and Type columns for every item).

> This replaces the previous prose paragraph, which named the 53 results but gave **no recipes and no effect values**. The engine below is an exact, deterministic, unordered-pair lookup — not a heuristic. `ffx-yunalesca.md` §10.9 correctly calls a heuristic mix engine a defect; this one is not.

##### Step 1 — Priority picks the primary item

> The item with the **smallest** Priority integer is the **primary**; the other is the **secondary**. **Lower number = higher priority.** If both have the same Priority, the **first item selected** is the primary — *except* when both are elemental, in which case Step 2 applies.

##### Step 2 — Opposites Cancel

> Opposing elements (**Fire ↔ Ice**, **Lightning ↔ Water**) with **equal** Priority cancel into a **plain physical Damage-type** mix. With unequal Priority, the higher-priority element simply wins.

##### Step 3 — Blend: primary Type × secondary Type → outcome Type

Status-effect items **blend** their status into the result, whether primary or secondary, yielding damage-plus-status or elemental-damage-plus-status. Items of high enough priority (Restorative, Reviving) absorb a Status secondary and the status does not take effect.

| Primary Type | Secondary Type | Outcome Type |
|---|---|---|
| Restorative | Reviving | Reviving |
| Restorative | Other | Restorative |
| Reviving | Other | Reviving |
| Curative | Other | Curative |
| Damage | Other | Damage |
| Fire | Holy · Status · **Ice** · Other | Holy · Fire Status · **Damage** · Fire |
| Ice | Holy · Status · **Fire** · Other | Holy · Ice Status · **Damage** · Ice |
| Lightning | Holy · Status · **Water** · Other | Holy · Lightning Status · **Damage** · Lightning |
| Water | Holy · Status · **Lightning** · Other | Holy · Water Status · **Damage** · Water |
| Holy | Other | Holy |
| Gravity | Holy · Status · Other | Holy · Gravity Status · Gravity |
| Status | Fire · Ice · Lightning · Water · Gravity · Other | Fire Status · Ice Status · Lightning Status · Water Status · Gravity Status · Damage Status |
| Stamina | Status · Mana · Other | Damage Status · **Absorb** · Stamina |
| Mana | Status · Stamina · Other | Damage Status · **Absorb** · Mana |
| Haste | Status · Other | Damage Status · Haste |
| Curtain | Status · Other | Damage Status · **Wall** |
| Star Curtain | Status · Other | Damage Status · **Hi-Wall** |
| Spring | Status · Other | Damage Status · **Absorb** |
| Hero Drink | Status · Other | Damage Status · **Drink** |
| Dispel Tonic | Other | **Ultra Cure** |
| Dark Matter | Other | **Drink** |

`[single source: FF Wiki Mix (FFX-2) mechanics section]`

##### Step 4 — outcome Type × **primary item's** Priority → the result

| Outcome Type | Priority 1 | Priority 2 | Priority 3 | Priority 4 |
|---|---|---|---|---|
| Damage | **Sunburst** | Cluster Bomb | Potato Masher | Pineapple |
| Fire | Burning Soul | Burning Soul | Firestorm | Heat Blaster |
| Ice | Winter Storm | Winter Storm | Icefall | Snow Flurry |
| Lightning | Lightning Bolt | Lightning Bolt | Rolling Thunder | Thunderbolt |
| Water | Tidal Wave | Tidal Wave | Flash Flood | Waterfall |
| Holy | **White Hole** | **White Hole** | Archangel | Archangel |
| Gravity | **Black Hole** | **Black Hole** | Nega Burst | Nega Burst |
| Damage Status | Hazardous Shell | Hazardous Shell | Blaster Mine | Blaster Mine |
| Fire Status | Abaddon Flame | Abaddon Flame | Brimstone | Brimstone |
| Ice Status | Krysta | Krysta | Black Ice | Black Ice |
| Lightning Status | Thunderblast | Thunderblast | Electroshock | Electroshock |
| Water Status | Dark Rain | Dark Rain | Aqua Toxin | Aqua Toxin |
| Gravity Status | **Grand Slam** | **Grand Slam** | Tallboy | Tallboy |
| Reviving | **Fantasy Phoenix** | Final Phoenix | Final Phoenix | Mega Phoenix |
| Restorative | **Final Elixir** | **Ultra Potion** | **Mega-Potion** | Hi-Potion |
| Curative | — | — | Panacea | Remedy |
| Absorb | Soul Sea | Soul Sea | Soul Spring | Soul Spring |
| Stamina | **Mega Cocktail** | **Mega Vitality** | — | — |
| Mana | **Mega Cocktail** | Mega Mana | — | — |
| Haste | **Final Wall** | — | **Chocobo Wing** | — |
| Wall | — | — | Wall | — |
| Hi-Wall | — | — | Hi-Wall | — |
| Drink | **Miracle Drink** | — | — | Hero Drink |
| Ultra Cure | — | **Ultra Cure** | — | — |

A blank cell means that combination is unreachable (e.g. Dispel Tonic is the only Dispel-Tonic-type item and it is Priority 2, so the Ultra Cure row can only ever fire at Priority 2). `[single source]`

##### Step 5 — the item Priority/Type table (all 67 mixable items)

| Item | Pri | Type | | Item | Pri | Type |
|---|---|---|---|---|---|---|
| Potion | 4 | Restorative | | Petrify Grenade | 3 | Status |
| Hi-Potion | 3 | Restorative | | Bomb Fragment | 4 | Fire |
| X-Potion | 2 | Restorative | | Bomb Core | 3 | Fire |
| Mega-Potion | 2 | Restorative | | Fire Gem | 2 | Fire |
| Ether | 3 | Restorative | | Antarctic Wind | 4 | Ice |
| Turbo Ether | 2 | Restorative | | Arctic Wind | 3 | Ice |
| Elixir | 2 | Restorative | | Ice Gem | 2 | Ice |
| **Megalixir** | **1** | Restorative | | Electro Marble | 4 | Lightning |
| Healing Spring | 2 | Restorative | | Lightning Marble | 3 | Lightning |
| Gysahl Greens | 3 | Restorative | | Lightning Gem | 2 | Lightning |
| Sylkis Greens | 3 | Restorative | | Fish Scale | 4 | Water |
| Mimett Greens | 3 | Restorative | | Dragon Scale | 3 | Water |
| Phoenix Down | 4 | Reviving | | Water Gem | 2 | Water |
| Mega Phoenix | 3 | Reviving | | Shadow Gem | 3 | Gravity |
| Antidote | 4 | Curative | | Twin Stars | 2 | Gravity |
| Soft | 4 | Curative | | Three Stars | 2 | Gravity |
| Eye Drops | 4 | Curative | | Shining Gem | 2 | Damage |
| Echo Screen | 4 | Curative | | **Supreme Gem** | **1** | Damage |
| Remedy | 3 | Curative | | Blessed Gem | 2 | **Holy** |
| **Holy Water** | 4 | **Holy** | | Poison Fang | 4 | Status |
| Budget Grenade | 4 | Damage | | Silver Hourglass | 3 | Status |
| Grenade | 3 | Damage | | Gold Hourglass | 2 | Status |
| S-Bomb | 3 | Damage | | Candle of Life | 4 | Status |
| M-Bomb | 3 | Damage | | Farplane Shadow | 3 | Status |
| L-Bomb | 2 | Damage | | **Dark Matter** | **1** | *Dark Matter* (unique) |
| Sleep Grenade | 3 | Status | | Chocobo Feather | 3 | Haste |
| Silence Grenade | 3 | Status | | **Chocobo Wing** | **1** | Haste |
| Dark Grenade | 3 | Status | | Lunar Curtain | 3 | Curtain |
| Light Curtain | 3 | Curtain | | Star Curtain | 3 | *Star Curtain* (unique) |
| Mana Spring | 4 | Spring | | Dispel Tonic | 2 | *Dispel Tonic* (unique) |
| Stamina Spring | 4 | Spring | | Hero Drink | 4 | *Hero Drink* (unique) |
| Soul Spring | 3 | Spring | | Stamina Tablet | 2 | Stamina |
| Mana Tablet | 2 | Mana | | **Stamina Tonic** | **1** | Stamina |
| **Mana Tonic** | **1** | Mana | | | | |

`[verified: 2 sources]` — FF Wiki *Final Fantasy X-2 items* publishes Priority and Type columns for every item; the four rows the wiki labels only "Unique" are resolved by the combination table above, which names each of them as its own singleton Type.

##### Step 6 — reference implementation

```ts
type MixType =
  | 'Restorative' | 'Reviving' | 'Curative' | 'Damage' | 'Status'
  | 'Fire' | 'Ice' | 'Lightning' | 'Water' | 'Holy' | 'Gravity'
  | 'Haste' | 'Curtain' | 'Spring' | 'Stamina' | 'Mana'
  | 'StarCurtain' | 'DispelTonic' | 'HeroDrink' | 'DarkMatter';

const OPPOSITE: Partial<Record<MixType, MixType>> =
  { Fire: 'Ice', Ice: 'Fire', Lightning: 'Water', Water: 'Lightning' };

function mix(first: Item, second: Item): MixResult {
  // Step 1 + 2: choose the primary
  let primary = first, secondary = second;
  if (second.priority < first.priority) { primary = second; secondary = first; }
  if (first.priority === second.priority && OPPOSITE[first.type] === second.type) {
    return RESULT_TABLE['Damage'][first.priority];      // Opposites Cancel
  }
  // Step 3: blend
  const outcome = BLEND[primary.type](secondary.type);  // the Step-3 table
  // Step 4: index by the PRIMARY item's priority
  return RESULT_TABLE[outcome][primary.priority];
}
```

The whole engine is `BLEND` (21 rows) plus `RESULT_TABLE` (24 rows × 4) plus 67 item tags — roughly 180 data entries for 4,624 pairs.

##### Step 7 — verified recipes for the mixes this project's encounters depend on

| Wanted result | Recipe (unordered) | Why it resolves | Effect |
|---|---|---|---|
| **Mega-Potion** | Hi-Potion + Potion | Hi-Potion P3 Restorative is primary; Restorative+Other → Restorative @P3 | **2,000 HP to all** |
| **Ultra Potion** | X-Potion + Potion | X-Potion P2 primary → Restorative @P2 | **9,999 HP to all, breaks the item cap** |
| **Final Elixir** | Megalixir + Potion | Megalixir P1 primary → Restorative @P1 | **Full HP + full MP + full cleanse, party** |
| **Mega Phoenix** | Phoenix Down + Phoenix Down | P4 Reviving both → Reviving @P4 | revive all at **25% max HP** |
| **Final Phoenix** | X-Potion + Phoenix Down | X-Potion P2 primary, Reviving secondary → Reviving @P2 | revive all at **full HP** |
| **Fantasy Phoenix** | Megalixir + Phoenix Down | Megalixir P1 primary → Reviving @P1 | revive all at full HP **and** full-heal the living |
| **Chocobo Wing** — *the Vegnagun party-Haste play* | Chocobo Feather + Potion | Feather P3 Haste is primary (P3 < P4); Haste+Other → Haste @P3 | **Haste on all, 120 (63.6 s)** |
| **Final Wall** | Chocobo Wing (item) + Potion | Chocobo Wing P1 Haste primary → Haste @P1 | **Protect + Shell + Reflect + Haste, all, 100 (53.0 s)** |
| **Wall** | Light Curtain + Potion | Curtain P3 primary → Wall @P3 | Protect + Shell, all |
| **Hi-Wall** | Star Curtain + Potion | Star Curtain P3 → Hi-Wall @P3 | Protect + Shell + Reflect, all |
| **Miracle Drink** | Dark Matter + Potion | Dark Matter P1 → Drink @P1 | **Invincible on the whole party, 15 (8.0 s)** |
| **Hero Drink** | Hero Drink + Potion | Hero Drink P4 → Drink @P4 | Invincible, 1 ally |
| **Ultra Cure** | Dispel Tonic + anything lower-priority | Dispel Tonic P2 → Ultra Cure @P2 | **50% max HP + full cleanse, all** |
| **Panacea** | Remedy + Antidote | Remedy P3 Curative primary → Curative @P3 | full cleanse, all |
| **Mega Vitality** | Stamina Tablet + Potion | P2 Stamina → Stamina @P2 | **double max HP, party — breaks the item cap** |
| **Mega Cocktail** | Stamina Tonic + Potion | P1 Stamina → Stamina @P1 | **double max HP and MP, party — breaks the item cap** |
| **Mega Mana** | Mana Tablet + Potion | P2 Mana → Mana @P2 | double max MP, party |
| **Soul Sea** | Soul Spring + Mana Tablet | Spring+Other → Absorb; Mana Tablet P2 is primary → Absorb @P2 | **drain ≈ 3/8 of user max HP+MP — breaks the item cap** |
| **Sunburst** | Supreme Gem + Potion | P1 Damage → Damage @P1 | 6,000 to all (see the Sunburst conflict note, §2.9.3) |
| **White Hole** | Blessed Gem + Potion | P2 Holy → Holy @P2 | 600 × 8 holy hits, 1 target — **8 chain links** |
| **Black Hole** | Twin Stars + Potion | P2 Gravity → Gravity @P2 | 75% of current HP, all |
| **Grand Slam** | Twin Stars + Poison Fang | Gravity primary, Status secondary → Gravity Status @P2 | 75% current HP **+ DEF/MDEF Down 5**, all |
| **Krysta** | Ice Gem + Sleep Grenade | Ice primary P2, Status secondary → Ice Status @P2 | 300 × 3 + Sleep, random |
| **Hazardous Shell** | Gold Hourglass + Poison Fang | Status + Status → Damage Status; Gold Hourglass P2 primary | 1,000 + Poison/Confuse 80%, all |

`[single source, derived]` — each recipe is a mechanical consequence of the published Priority/Type tables above rather than a transcribed recipe, so any implementation of Steps 1–4 reproduces them automatically.

> **BDL note.** Mix results that **can** break the 9,999 cap: **Soul Spring, Soul Sea, Ultra Potion, Mega Vitality, Mega Cocktail**. Everything else in Mix and Stash is hard-capped at 9,999. `[single source: SinirothX step 19]`
> **FFX cross-reference.** FFX's Rikku Mix (Overdrive) uses an analogous but *different* per-item grouping, and no public transcription of FFX's item mix-group IDs was located during this pass — `ffx-combat-core.md` §5.9's one-example-per-result list therefore remains open. **Do not port this X-2 table to FFX**; the outcome sets differ (FFX has Trio of 9999, Hyper Mighty G, Mighty Wall, Chaos Grenade, Eccentrick, Nega Burst etc. that X-2 does not, and X-2 has Final Wall, Mega Cocktail, Ultra Cure etc. that FFX does not). The *structure* — two hidden fields, three resolution functions — is the right shape to look for.

> From the prompt's Alchemist list: **"Blaster" ✘** for Alchemist — Blaster is a Blue Bullet. Alchemist's doubling passives are Chemist / Elementalist / Physicist. `[verified: 2 sources]`

---

### 3.12 Lady Luck — Luck/critical specialist, slot machines, gil manipulation. Long range.

Commands: **Attack · Gamble · Tantalize · Bribe · Item**

| Ability | AP | MP | Tgt | Type | Effect | Flags |
|---|---|---|---|---|---|---|
| Attack | init | — | 1 any | MCW | physical damage | P, S+, RT, CRIT, long |
| **Bribe** | 40 | — | 1 enemy | MCW | pay gil to make an enemy leave and hand over items. `bribeNum = (Gil×256)/(maxHP×5) − 64`, success = `bribeNum/256`. Rule of thumb: **maxHP × 6.25**. | CT |
| **Two Dice** | 20 | 4 | 1 any | ACT | special damage; number of hits depends on the two dice rolled | CT, short |
| **Four Dice** | 100 | 8 | party | ACT | special damage spread randomly across the target party; hit count from four dice (needs Two Dice) | CT, short |
| **Attack Reels** | init | — | 1 / any | ACT | 3-slot machine, physical results | CT |
| **Magic Reels** | 70 | — | 1 / any | ACT | 3-slot machine, magic results | CT |
| **Item Reels** | 80 | — | 1 / any | ACT | 3-slot machine, item results (needs Magic Reels) | CT |
| **Random Reels** | 120 | — | 1 / any | ACT | 3-slot machine, mixed results (needs Item Reels) | CT |
| **Luck** | 30 | 8 | self | ACT | **LUCK Up +10 levels** on the user | CT |
| **Felicity** | 40 | 8 | all allies | ACT | **LUCK Up +3 levels** party-wide (needs Luck) | CT |
| **Tantalize** | 60 | — | all enemies | MCW | inflict **Confusion** on all enemies | CT |
| **Critical** | 160 | — | self | PAS | **every** physical attack the user makes is a critical (needs Felicity) | — |
| **Double EXP** | 80 | — | self | PAS | user gains double EXP | — |
| **SOS Spellspring** | 30 | — | self | PAS | all MP costs become 0 while HP < 33% max (needs Four Dice) | — |
| **Gillionaire** | 100 | — | self | PAS | party gains double gil; **stacks across all three girls** → up to ×8 (needs Double EXP) | — |
| **Double Items** | 100 | — | self | PAS | party gains double item drops (accessories excluded); **stacks** → up to ×8 (needs Gillionaire) | — |

**Reels mechanics** `[verified: 2 sources]`: the slots begin spinning in a **random order**, and the player presses **X three times**, one press per reel. Three-of-a-kind gives the top result; two-of-a-kind (slots 1+2) gives a mid result; a single Cherry in slot 1 gives the weakest result; anything else is a **Dud**. All effects from one spin share a **single charge bar** and fire together.

**Dud: the whole party takes special gravity damage equal to 75% of current HP, ignoring defence.** With Cat Nip equipped a Dud can wipe the party — Split Infinity and the Wiki both flag this as the reason Lady Luck is a double-edged sword. `[verified: 2 sources]`

| Reel | 3-of-a-kind (Red 7 / BAR / Cherry / A / B / C) | Pairs (Cherry-Cherry / A-A / B-B / C-C) | Cherry-any-any |
|---|---|---|---|
| **Attack Reels** | Shin-Zantetsu / Excalibur / Cripple / Delay Buster (Sword) / Fireworks (Helmet) / Intimidate (Paw) | Clean Slate / Power Break (Sword) / Magicide (Helmet) / Eject (Paw) | Armor Break |
| **Magic Reels** | **Ultima** / **Black Sky** / **Flare** / Demi (Skull) / Firaga (Hat) / Auto-Life (Staff) | Bio / Break (Skull) / Thundara (Hat) / Esuna (Staff) | Cura |
| **Item Reels** | Megalixir+ / Mighty Guard+ / Supreme Gem / Megalixir (Blue Flask) / Blessed Gem (Red Orb) / Mighty Guard (Green Flask) | Mega-Ether / Ether (Blue Flask) / L-Bomb (Red Orb) / Lunar Curtain+ (Green Flask) | Light Curtain+ |
| **Random Reels** | **CONGRATS!** / Mega-Potion / Blizzaga / Cry in the Night / Dark Matter / Quartet Knife | Mental Break / Cure / Primo Grenade | Hi-Potion, Potion |

Notable reel payloads: **Megalixir+** = full party HP/MP **and revives KOs**; **Mighty Guard+** = Shell + Protect + Regen + **DEF Up 10 and MDEF Up 10**; **Dark Matter** = 9375–9999 special damage to all enemies; **Blessed Gem** = 8 holy hits of 281–317 each on one target (chains hard); **CONGRATS!** = every enemy hands over bribed items and leaves, and you still receive their EXP and gil.

> Lady Luck's **Magic Reels** and the **Megiddo** Garment Grid are the only two routes to **Ultima** in the game. `[verified: 2 sources]`
> The reels can be manipulated by repeatedly pausing the game to line up a desired symbol. `[single source]`

---

### 3.13 Trainer — one pet per girl, three entirely different ability sets. Long range.

Commands: **Attack · Pet · Item**. All three girls share the same HP/MP curve (131→3239 HP, 34→214 MP) but different combat stats — see §5.

**Yuna — Kogoro (dog).** Elemental striker.

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Holy Kogoro | init | 18 | **Holy** physical damage | P, S+, E, CT, CRIT |
| Kogoro Blaze | init | 4 | **Fire** physical + **Darkness** | P, S+, E, CT, CRIT |
| Kogoro Freeze | 40 | 4 | **Ice** physical + **Stop** | P, S+, E, CT, CRIT |
| Kogoro Shock | 40 | 4 | **Lightning** physical + **Berserk** | P, S+, E, CT, CRIT |
| Kogoro Deluge | 40 | 4 | **Water** physical + **Sleep** | P, S+, E, CT, CRIT |
| Kogoro Strike | 80 | 6 | attempt to **Eject** one enemy | CT |
| Doom Kogoro | 80 | 6 | physical + **Doom** (needs Kogoro Strike) | P, S+, CT, CRIT |
| Kogoro Cure | 30 | 10 | fair HP recovery, 1 target | S, M+, CT |
| Kogoro Remedy | 40 | 10 | cure all negative statuses except KO (needs Kogoro Cure) | CT |
| **Pound!** | 100 | 24 | huge physical damage (needs Doom Kogoro) | P, S+, CT, CRIT |
| Half MP Cost | 200 | — | halves all MP costs (needs MP Stroll) | PAS |
| HP Stroll | 20 | — | slowly regain HP while walking the field | PAS |
| MP Stroll | 20 | — | slowly regain MP while walking the field (needs HP Stroll) | PAS |
| Kogoro Lv. 2 | 80 | — | Kogoro charge time **−30%** | PAS |
| Kogoro Lv. 3 | 100 | — | Kogoro charge time **−50%** (needs Lv. 2) | PAS |

**Rikku — Ghiki (bug).** Status/theft harasser. Unusually, all of Ghiki's offensive abilities are `RT` (instant), not `CT`.

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Sneaky Ghiki | init | 12 | physical damage; also **steals gil** if the target is an enemy | P, S+, RT, CRIT |
| Ghiki Gouge | init | 8 | physical + **Darkness** | P, S+, RT, CRIT |
| Ghiki Gag | 80 | 8 | physical + **Silence** | P, S+, RT, CRIT |
| Mugger Ghiki | init | 12 | physical damage; also **steals an item** if the target is an enemy | P, S+, RT, CRIT |
| Pesky Ghiki | 100 | 8 | physical + **Berserk** | P, S+, RT, CRIT |
| Bully Ghiki | 100 | 8 | physical + **Action-cancel** (kills a charging enemy action) (needs Pesky Ghiki) | P, S+, RT, CRIT |
| Ghiki Pep | 30 | 10 | fair HP recovery, 1 target | S, M+, CT |
| Ghiki Meds | 40 | 10 | cure all negative statuses except KO (needs Ghiki Pep) | CT |
| Ghiki Cheer | init | 12 | target gains **STR Up +1 and DEF Up +1** | CT |
| **Swarm, swarm!** | 100 | 24 | huge physical damage (needs Bully Ghiki) | P, S+, CT, CRIT |
| Half MP Cost / HP Stroll / MP Stroll / Ghiki Lv. 2 / Ghiki Lv. 3 | 200 / 20 / 20 / 80 / 100 | — | as Kogoro's | PAS |

**Paine — Flurry (bird).** Support + instant-death.

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Carrier Flurry | init | 8 | attempt to **Eject** one enemy | CT |
| Poison Flurry | 40 | 4 | physical + **Poison** | P, S+, CT, CRIT |
| Stone Flurry | 60 | 16 | physical + **Petrification** (needs Poison Flurry) | P, S+, CT, CRIT |
| **Death Flurry** | 60 | 20 | attempt instant **KO** (needs Stone Flurry) | CT |
| Flurry Guard | 60 | 10 | small heal + **Protect** (needs Flurry Speed) | S, M+, CT |
| Flurry Speed | 60 | 10 | small heal + **Haste** | S, M+, CT |
| Flurry Shield | 60 | 10 | small heal + **Shell** (needs Flurry Speed) | S, M+, CT |
| HP Flurry | init | 10 | fair HP recovery to the **whole** target party | S, M+, CT |
| Recovery Flurry | 40 | 10 | cure all negative statuses except KO | CT |
| **Maulwings!** | 100 | 24 | huge physical damage (needs Death Flurry) | P, S+, CT, CRIT |
| Half MP Cost / HP Stroll / MP Stroll / Flurry Lv. 2 / Flurry Lv. 3 | 200 / 20 / 20 / 80 / 100 | — | as Kogoro's | PAS |

> The prompt's list for the Trainer is generic; note that the *Trainer is the only standard dressphere with **Half MP Cost** as a learnable passive* (200 AP), which is a major late-game enabler. `[verified: 2 sources]`

---

### 3.14 Mascot — the endgame dressphere. Best all-round stats, plus two borrowed skillsets each.

Obtained in Chapter 5 only, by getting **Episode Complete! in all 15 areas of Spira** `[verified: 2 sources]`. Each girl gets a different costume, a unique command, **Ribbon**, **Auto-Shell**, **Auto-Protect**, and access to two other dresspheres' learned skillsets.

**Shared across all three** (`PAS` unless noted):

| Ability | AP | Effect |
|---|---|---|
| **Ribbon** | **999** | immune to Petrification, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Pointless, Itchy, Slow, Stop. Requires the Warrior's **SOS Protect** to be learned first. |
| **Auto-Shell** | 80 | permanent Shell — cannot be dispelled, never wears off |
| **Auto-Protect** | 80 | permanent Protect (needs Auto-Shell) |
| *borrowed skillset A* | 80 | MCW command |
| *borrowed skillset B* | 80 | MCW command |

**Yuna — Moogle.** Command **Kupo!**; borrows **Swordplay** (Warrior) and **Arcana** (Dark Knight).

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Moogle Jolt | 40 | — | target recovers **25% of max MP** | CT |
| **Moogle Cure** | init | 10 | target recovers **62.5% of max HP** (BDL+BHL can exceed 9999) **and** is cured of the 12-status list | S, M+, CT |
| Moogle Regen | init | 18 | **Regen + Haste** on 1 target | CT |
| Moogle Wall | init | 18 | **Shell + Protect** on 1 target | CT |
| Moogle Life | init | 40 | revive 1 ally at **full HP and full MP** | S, CT |
| Moogle Cureja | 40 | 15 | Moogle Cure for the **whole party** | S, M+, CT |
| Moogle Regenja | 40 | 24 | Regen + Haste on the whole party | CT |
| Moogle Wallja | 40 | 24 | Shell + Protect on the whole party | CT |
| Moogle Lifeja | 40 | 60 | revive up to two allies at **full HP and MP** | S, CT |
| **Moogle Beam** | 80 | **99** | extreme physical damage to 1 target, **ignores Def** (needs Warrior's SOS Protect) | S, M+, CT |

**Rikku — Cait Sith.** Command **Wildcat**; borrows **Instinct** (Berserker) and **White Magic**.

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Cait Fire / Cait Thunder / Cait Blizzard / Cait Water | init | 12 each | elemental magic to the whole target party **+ Poison + Petrification** | S, M+, E, CT |
| Power Eraser | 40 | 12 | **STR Down 4 levels** on the whole target party | CT |
| Armor Eraser | 40 | 12 | **DEF Down 4** on the whole target party | CT |
| Magic Eraser | 40 | 12 | **MAG Down 4** on the whole target party | CT |
| Mental Eraser | 40 | 12 | **MDEF Down 4** on the whole target party | CT |
| Speed Eraser | 40 | 12 | **EVA Down 10** on the whole target party | CT |
| **PuPu Platter** | 80 | 48 | attempt to **Eject all enemies** (needs Warrior's SOS Protect) | CT |

**Paine — Tonberry.** Command **Cutlery**; borrows **Bushido** (Samurai) and **Black Magic**. Cutlery is a stronger Arcana: every knife is a *physical* hit that also applies a status.

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Dark Knife | init | 10 | physical + **Darkness** | P, S+, CT, CRIT |
| Silence Knife | init | 10 | physical + **Silence** | P, S+, CT, CRIT |
| Sleep Knife | init | 10 | physical + **Sleep** | P, S+, CT, CRIT |
| Berserk Knife | init | 10 | physical + **Berserk** | P, S+, CT, CRIT |
| Poison Knife | init | 10 | physical + **Poison** | P, S+, CT, CRIT |
| Stone Knife | init | 10 | physical + **Petrification** | P, S+, CT, CRIT |
| Stop Knife | init | 10 | physical + **Stop** | P, S+, CT, CRIT |
| **Quartet Knife** | init | 10 | physical + **STR/MAG/DEF/MDEF Down 3 levels** | P, S+, CT, CRIT |
| **Arsenic Knife** | init | 10 | physical + **instant KO** | P, S+, CT, CRIT |
| **Cactling Gun** | 80 | **99** | extreme physical damage, **ignores Def** (needs Warrior's SOS Protect) | P, S+, CT, long |

---

### 3.15 Special dresspheres (SDSP) — Floral Fallal, Machina Maw, Full Throttle

**Universal SDSP rules** `[verified: 2 sources]`:

| Rule | Detail |
|---|---|
| **Unlock condition** | The girl must have changed into **every dressphere on her currently equipped Garment Grid** during the battle — **and every node on that Grid must be occupied**. Then, on her turn, press **L1** to open the Grid and **R1** to trigger Special Dress Up, then **X**. |
| **Party** | The other two girls **leave the battlefield**. The transformed girl fights alone as **three independently-commanded parts** (main body + two satellites). |
| **Grids** | SDSP cannot be placed in a node. The **Unerring Path** Garment Grid (2 nodes, no gates) exists specifically to reach SDSP as fast as possible. |
| **Stat scaling** | **The more nodes the Garment Grid has, the higher the main unit's HP, MP, Str, Mag, Def and MDef after transforming.** Only the *main* part is affected. Node counts range **2–6**. A 6-node grid (First Steps, Black Tabard, Blood of the Beast, Chaos Maelstrom, Pride of the Sword, Samurai's Honor, Tricks of the Trade, White Signet) gives the strongest SDSP; **Unerring Path** (2 nodes) gives the fastest but weakest. See the node-scaling model below. |
| **Accessories** | While transformed, **every accessory the girl has equipped stops working** `[single source: FF Wiki Dressphere]`. Break Damage Limit and Break HP Limit must therefore come from the part's own 20 AP ability + key item, never from Invincible / Enterprise. |
| **Immunities** | Every SDSP part has **Ribbon plus Auto-Life** innately, and **cannot be Ejected**. |
| **No Item / Escape** | SDSP parts have **no Item command and no Escape command**. |
| **Mastery** | 14 learnable abilities per part; the last two (**Break HP Limit**, **Break Damage Limit**, 20 AP each) need key items — two per girl. |
| **Shared passives per part** | Ribbon (init) · Double HP (20 AP) · Triple HP (30 AP, needs Double HP) · Break HP Limit (20 AP + key item) · Break Damage Limit (20 AP + key item) |

#### SDSP base stats — per-level growth algorithms for all nine parts

SinirothX's *Dressphere Growth Algorithms* section (§19 of the Enemy Encyclopedia) publishes a complete growth algorithm for **every** special-dressphere part, exactly as it does for the standard dresspheres. The three-entity units therefore have full HP/MP/Str/Mag/Def/MDef/Agi/Acc/Eva/Luck curves at every level 1–99, which the previous revision of this section lacked entirely. Normalised form (see §5.1a for the shared algorithm and rounding rules):

`stat(lv) = lv·A + lv/D + B − lv²/Q`  (with `D = 0` meaning the `lv/D` term is absent)

| Part | Stat | A | D | B | Q |
|---|---|---|---|---|---|
| **Floral Fallal** (main) | HP | 72 | — | 180 | 13 |
| | MP | 6.6 | — | 60 | 40 |
| | Str | 2.2 | 6 | 18 | 176 |
| | Mag | 2.1 | 17 | 40 | 176 |
| | Def | 0.1 | 7 | 38 | 12800 |
| | MDef | 0.1 | 13 | 94 | 6400 |
| | Agi | 0 | 17 | 40 | 12800 |
| | Acc | 0 | 44 | 116 | 12800 |
| | Eva | 0 | 20 | 2 | 12800 |
| | Luck | 0 | 17 | 8 | 12800 |
| **Left / Right Pistil** (identical) | HP | 51 | — | 80 | 12 |
| | MP | 4 | — | 80 | 60 |
| | Str | 2.2 | 33 | 13 | 160 |
| | Mag | 1.6 | 20 | 30 | 320 |
| | Def | 0.1 | 13 | 40 | 12800 |
| | MDef | 0.1 | 13 | 70 | 6400 |
| | Agi | 0 | 16 | 38 | 12800 |
| | Acc | 0 | 22 | 105 | 12800 |
| | Eva | 0 | 22 | 2 | 12800 |
| | Luck | 0 | 20 | 5 | 12800 |
| **Machina Maw** (main) | HP | 66 | — | 200 | 13 |
| | MP | 5.5 | — | 40 | 70 |
| | Str | 2.3 | 20 | 19 | 192 |
| | Mag | 1.4 | 8 | 21 | 208 |
| | Def | 0.2 | 11 | 80 | 12800 |
| | MDef | 0.1 | 9 | 28 | 6400 |
| | Agi | 0 | 15 | 40 | 12800 |
| | Acc | 0 | 15 | 116 | 12800 |
| | Eva | 0 | 19 | 2 | 12800 |
| | Luck | 0 | 15 | 6 | 12800 |
| **Smasher-R / Crusher-L** (identical) | HP | 54 | — | 80 | 8.5 |
| | MP | 4 | — | 20 | 100 |
| | Str | 2.3 | 12 | 14 | 160 |
| | Mag | 1.3 | 11 | 20 | 208 |
| | Def | 0.3 | 13 | 30 | 6400 |
| | MDef | 0 | 7 | 28 | 9600 |
| | Agi | 0 | 17 | 38 | 12800 |
| | Acc | 0 | 8 | 110 | 12800 |
| | Eva | 0 | 17 | 1 | 12800 |
| | Luck | 0 | 19 | 5 | 12800 |
| **Full Throttle** (main) | HP | 70 | — | 220 | 15 |
| | MP | 1 | — | 2 | 240 |
| | Str | 2.4 | 18 | 24 | 208 |
| | Mag | 1.3 | 11 | 39 | 176 |
| | Def | 0.3 | 17 | 44 | 6400 |
| | MDef | 0.1 | 6 | 42 | 12800 |
| | Agi | 0 | 16 | 44 | 12800 |
| | Acc | 0 | 21 | 133 | 12800 |
| | Eva | 0 | 16 | 8 | 12800 |
| | Luck | 0 | 15 | 10 | 12800 |
| **Dextral / Sinistral Wing** (identical) | HP | 59 | — | 100 | 7 |
| | MP | 3 | — | 80 | 120 |
| | Str | 2 | 17 | 18 | 256 |
| | Mag | 1.1 | 8 | 22 | 240 |
| | Def | 0.4 | 27 | 43 | 6400 |
| | MDef | 0.1 | 10 | 42 | 12800 |
| | Agi | 0 | 15 | 40 | 12800 |
| | Acc | 0.2 | 15 | 106 | 12800 |
| | Eva | 0 | 22 | 2 | 12800 |
| | Luck | 0 | 17 | 3 | 12800 |

`[single source: SinirothX §19]`

**Worked stat blocks at the two levels this project needs** (floor of the algorithm; see §5.1a on ±1 drift):

| Unit | Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Floral Fallal (main) | 25 | 1,931 | 209 | 73 | 90 | 44 | 98 | 41 | 116 | 3 | 9 |
| Left / Right Pistil | 25 | 1,302 | 169 | 64 | 69 | 44 | 74 | 39 | 106 | 3 | 6 |
| Machina Maw (main) | 25 | 1,801 | 168 | 74 | 56 | 87 | 33 | 41 | 117 | 3 | 7 |
| Smasher-R / Crusher-L | 25 | 1,356 | 113 | 69 | 51 | 39 | 31 | 39 | 113 | 2 | 6 |
| Full Throttle (main) | 25 | 1,928 | 24 | 82 | 70 | 52 | 48 | 45 | 134 | 9 | 11 |
| Dextral / Sinistral Wing | 25 | 1,485 | 149 | 67 | 50 | 53 | 46 | 41 | 112 | 3 | 4 |
| Floral Fallal (main) | 50 | 3,587 | 327 | 122 | 133 | 49 | 102 | 42 | 116 | 4 | 10 |
| Left / Right Pistil | 50 | 2,421 | 238 | 108 | 104 | 48 | 78 | 40 | 107 | 4 | 7 |
| Machina Maw (main) | 50 | 3,307 | 279 | 123 | 85 | 94 | 38 | 43 | 119 | 4 | 9 |
| Smasher-R / Crusher-L | 50 | 2,485 | 195 | 117 | 77 | 48 | 34 | 40 | 116 | 3 | 7 |
| Full Throttle (main) | 50 | 3,553 | 41 | 134 | 94 | 61 | 55 | 46 | 135 | 10 | 13 |
| Dextral / Sinistral Wing | 50 | 2,692 | 209 | 111 | 72 | 64 | 51 | 43 | 119 | 4 | 5 |

`[single source, computed from the algorithms above]`

**Node-count scaling — model** `[estimate]`. Split Infinity and the FF Wiki both state the rule ("the more nodes the equipped Garment Grid has, the higher the **main** unit's HP, MP, Str, Mag, Def and MDef"; "the base statistics are directly related to the number of nodes") but **neither publishes a formula, and none exists in any source found**. What *is* sourced: node counts run **2–6**, and only the **main** part scales (the two satellites are fixed). SinirothX's algorithms give a single curve per part, which must correspond to one reference node count.

Recommended implementation, with the reasoning stated so it can be replaced if a formula surfaces:

```ts
// Treat SinirothX's published curve as the value at the MAXIMUM 6-node grid,
// and scale the six affected stats linearly down to a 2-node floor of 0.80x.
// Agi / Acc / Eva / Luck are NOT affected (the rule names six stats only).
const nodeScale = (nodes: number) => 0.70 + 0.05 * clamp(2, 6, nodes);  // 2 -> 0.80, 6 -> 1.00
```

| Nodes | Multiplier on main-part HP/MP/Str/Mag/Def/MDef | Example grid |
|---|---|---|
| 2 | **×0.80** | Unerring Path |
| 3 | ×0.85 | Heart Reborn, Healing Light |
| 4 | ×0.90 | Vanguard, Mounted Assault |
| 5 | ×0.95 | Covenant of Growth, Higher Power |
| 6 | **×1.00** | First Steps, Black Tabard, Chaos Maelstrom, Samurai's Honor, Tricks of the Trade, Pride of the Sword, Blood of the Beast, White Signet |

*Reasoning:* a 20% spread is large enough to make the choice matter (which every source insists it does) without making a 2-node rush non-viable (which no source suggests). Anchoring the *top* at the published curve rather than the bottom keeps every previously-computed number in this document valid for the 6-node case the boss chapters actually recommend. **Tag every SDSP stat block in the encounter documents with the node count it assumes.**

#### Floral Fallal (Yuna) — magic-oriented. Found on the Djose Highroad, Chapter 2.

Key items: **Aurora Rain** (Break HP Limit) · **Twilight Rain** (Break Damage Limit).

**Main part** — commands: *Attack · Fallalery · Great Whirl · Libra*

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Attack | init | — | physical damage, 1 enemy | P, S+, RT, CRIT, short |
| Libra | 4 | — | Scan-equivalent | CT |
| Heat / Ice / Electric / Aqua Whirl | init | 0 | **three** hits of Fire / Ice / Lightning / Water magic on random members of the target party | S, M+, E, CT |
| Barrier | 20 | 36 | **Null Magic** on self | CT |
| Shield | 20 | 36 | **Null Physical** on self (needs Barrier) | CT |
| Flare Whirl | 24 | 64 | **three** non-elemental magic hits on random targets | S, M+, CT |
| **Great Whirl** | 30 | — | **twelve** non-elemental magic hits on random enemies (needs Flare Whirl) | S, S+, CT, RT |
| All-Life | 8 | 70 | revive any KO'd parts **except the main body**, full HP | CT |

**Left Pistil** — commands: *Left Stigma · Left Pistilplay*. Offence + status. All cost **0 MP**.

| Ability | AP | Effect | Flags |
|---|---|---|---|
| Dream Pollen | init | non-elemental magic + **Slow**, all targets | S, M+, CT |
| Mad Seeds | init | non-elemental magic + **Berserk**, all | S, M+, CT |
| Sticky Honey | init | non-elemental magic + **Slow**, all | S, M+, CT |
| **Halfdeath Petals** | init | gravity magic removing **50% of current HP**, all | S, M+, E, CT |
| Poison Leaves | 10 | non-elemental magic + **Poison**, all | S, M+, CT |
| Death Petals | 10 | attempt instant **KO**, 1 target (needs Poison Leaves) | CT |
| Silent White | init | physical + **Silence and Darkness**, all | P, S+, CT, CRIT, long |
| Congealed Honey | 20 | physical + **Stop**, all | P, S+, CT, CRIT, long |
| Panic Floralysis | 10 | physical + **Confusion**, all (needs Congealed Honey) | P, S+, CT, CRIT, long |
| Ash Floralysis | 10 | physical + **Petrification**, all (needs Panic Floralysis) | P, S+, CT, CRIT, long |
| Left Stigma | 20 | plain physical attack, 1 target | P, S+, CT, CRIT, long |

**Right Pistil** — commands: *Right Stigma · Right Pistilplay*. Support + debuff. All cost **0 MP**.

| Ability | AP | Effect | Flags |
|---|---|---|---|
| White Pollen | init | HP recovery to the whole target party | S, M+, CT |
| White Honey | 10 | **Regen** on the whole target party | CT |
| Hard Leaves | init | **Shell** on the whole target party | CT |
| Tough Nuts | init | **Protect** on the whole target party | CT |
| Mirror Petals | init | **Reflect** on the whole target party | CT |
| Floral Rush | 20 | **Haste** on the whole target party (needs White Honey) | CT |
| Floral Bomb | init | physical + **STR Down 1**, all | P, S+, CT, CRIT, long |
| Fallal Bomb | 10 | physical + **DEF Down 1**, all | P, S+, CT, CRIT, long |
| Floral Magisol | 10 | physical + **MAG Down 1**, all (needs Fallal Bomb) | P, S+, CT, CRIT, long |
| Fallal Magisol | 20 | physical + **MDEF Down 1**, all (needs Floral Magisol) | P, S+, CT, CRIT, long |
| Right Stigma | 20 | plain physical attack, 1 target (needs Fallal Magisol) | P, S+, CT, CRIT, long |

#### Machina Maw (Rikku) — physical/status mech. Found in the Bikanel Oasis, Chapter 2.

Key items: **Machina Reactor** (Break HP Limit) · **Machina Booster** (Break Damage Limit).

**Main part** — commands: *Attack · Machinations · Revival · Vajra*

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Attack | init | — | physical damage | P, S+, RT, CRIT, short |
| Revival | 10 | — | revive one KO'd part at **50% max HP** | S, CT |
| Death Missile | init | 12 | physical + **instant KO** | P, S+, CT, CRIT, long |
| Bio Missile | init | 12 | physical + **Poison** | P, S+, CT, CRIT, long |
| Break Missile | init | 12 | physical + **Petrification** | P, S+, CT, CRIT, long |
| Berserk Missile | 10 | 12 | physical + **Berserk** | P, S+, CT, CRIT, long |
| Stop Missile | 10 | 12 | physical + **Stop** (needs Berserk Missile) | P, S+, CT, CRIT, long |
| Confuse Missile | 10 | 12 | physical + **Confusion** (needs Stop Missile) | P, S+, CT, CRIT, long |
| **Shockwave** | 20 | 36 | huge physical damage to all of target party | P, S+, CT, CRIT, long |
| **Shockstorm** | 20 | 36 | huge physical damage + **Delay effect**, all (needs Shockwave) | P, S+, CT, CRIT, long |
| **Vajra** | 30 | — | extreme non-elemental special damage to all enemies (needs Shockstorm) | P, S+, CT, RT, long |

**Left Crusher** — commands: *Homing Ray · Crush · HP Repair · MP Repair*

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Howitzer | init | 12 | physical damage | P, S+, CT, CRIT, long |
| Blind Shell | 10 | 12 | physical + **Darkness** | P, S+, CT, CRIT, long |
| Silence Shell | 10 | 12 | physical + **Silence** (needs Blind Shell) | P, S+, CT, CRIT, long |
| Anti-Magic Shell | 10 | 12 | physical + **MAG Down 3** (needs Silence Shell) | P, S+, CT, CRIT, long |
| Anti-Mental Shell | 10 | 12 | physical + **MDEF Down 3** (needs Anti-Magic Shell) | P, S+, CT, CRIT, long |
| Booster | 20 | 30 | **Haste** on the whole target party | CT |
| Offense | 20 | 10 | **STR Up +3 levels** on 1 target | CT |
| Defense | 20 | 10 | **DEF Up +3 levels** on 1 target (needs Offense) | CT |
| HP Repair | init | — | target recovers **25% of max HP** | S, CT |
| MP Repair | init | — | target recovers a large amount of MP | CT |
| Homing Ray | init | — | physical damage, 1 target | P, S+, CT, CRIT, long |

**Right Smasher** — commands: *Homing Ray · Smash · HP Repair · MP Repair*

| Ability | AP | MP | Effect | Flags |
|---|---|---|---|---|
| Howitzer | init | 12 | physical damage | P, S+, CT, CRIT, long |
| Sleep Shell | 10 | 12 | physical + **Sleep** | P, S+, CT, CRIT, long |
| Slow Shell | 10 | 12 | physical + **Slow** (needs Sleep Shell) | P, S+, CT, CRIT, long |
| Anti-Power Shell | 10 | 12 | physical + **STR Down 3** (needs Slow Shell) | P, S+, CT, CRIT, long |
| Anti-Armor Shell | 10 | 12 | physical + **DEF Down 3** (needs Anti-Power Shell) | P, S+, CT, CRIT, long |
| Scan | 10 | — | Scan-equivalent | CT |
| Shellter | 20 | 10 | **Shell** on the whole target party | CT |
| Protector | 20 | 10 | **Protect** on the whole target party (needs Shellter) | CT |
| HP Repair / MP Repair / Homing Ray | init | — | as Left Crusher | — |

#### Full Throttle (Paine) — physical brawler. From Tromell at Macalania Spring, Chapter 1 or 2.

Key items: **Corpus Invictus** (Break HP Limit) · **Victor Primoris** (Break Damage Limit).

**Main part** — commands: *Attack · Throttle · Fright · Sword Dance*. Every main-part offensive ability costs **0 MP** and is `RT` (instant) — Full Throttle is the fastest SDSP.

| Ability | AP | Effect | Flags |
|---|---|---|---|
| Attack | init | physical damage | P, S+, RT, CRIT, short |
| **Aestus** | init | **Fire** physical | P, S+, E, RT, CRIT, short |
| **Winterkill** | init | **Ice** physical | P, S+, E, RT, CRIT, short |
| **Whelmen** | init | **Water** physical | P, S+, E, RT, CRIT, short |
| **Levin** | init | **Lightning** physical | P, S+, E, RT, CRIT, short |
| **Wisenen** | 10 | **Gravity** physical: removes **75% of current HP** | P, RT, CRIT, short |
| **Fiers** | 20 | **guaranteed critical** physical hit (needs Wisenen) | P, S+, RT, CRIT, short |
| **Deeth** | 20 | physical + **instant KO** attempt (needs Fiers) | P, S+, RT, CRIT, short |
| **Assoil** | 20 | **Holy** physical | P, S+, E, RT, CRIT, short |
| **Fright** | 20 | physical + **Confusion and Delay** on one enemy (needs Assoil) | P, S+, CT, CRIT, short |
| **Sword Dance** | 30 | extreme physical damage to **all** enemies, **strikes twice** (needs Fright) | P, S+, CT, RT, CRIT, long |

**Sinistral Wing** — commands: *Sinistral Arts · Stamina · Mettle · Reboot*. The **buff/debuff** wing. Every Feather targets the whole party or every enemy; all status riders are **Infinite** duration except Haste.

| Ability | AP | MP | Tgt | Effect | Duration | Flags |
|---|---|---|---|---|---|---|
| Sinistral Arts | init | — | — | opens the skillset | — | — |
| **Steel Feather** | init | 12 | party | **STR Up +2 levels** | Infinite | CT |
| **Diamond Feather** | init | 12 | party | **DEF Up +2 levels** | Infinite | CT |
| **White Feather** | init | 16 | all enemies | **STR Down 2 levels** | Infinite | CT |
| **Buckle Feather** | init | 16 | all enemies | **DEF Down 4 levels** | Infinite | CT |
| **Cloudy Feather** | 10 | 16 | all enemies | **MAG Down 2 levels** | Infinite | CT |
| **Pointed Feather** | 10 | 16 | all enemies | **MDEF Down 2 levels** (needs Cloudy Feather) | Infinite | CT |
| **Pumice Feather** | 10 | 38 | party | **Haste** | 50 (26.5 s) | CT |
| **Ma'at's Feather** | 10 | — | 1 enemy | Libra / Scan equivalent | — | CT |
| **Stamina** | init | — | 1 part | restore HP — power **31**, `Heal` formula | — | CT |
| **Mettle** | init | — | 1 part | restore MP | — | CT |
| **Reboot** | 10 | — | 1 part | revive one KO'd part | — | CT |
| Ribbon | init | — | self | innate | — | PAS |
| Double HP / Triple HP | 20 / 30 | — | self | max HP ×2 / ×3 | — | PAS |
| Break HP Limit / Break Damage Limit | 20 / 20 | — | self | needs *Corpus Invictus* / *Victor Primoris* | — | PAS |

`[verified: 2 sources]` — AP/MP/target/effect from the FF Wiki *Sinistral Arts* and *Full Throttle (Final Fantasy X-2)* pages; power and duration values from the constant table (§2.9.2).
> **Conflict — Buckle Feather.** The FF Wiki gives **DEF Down 4 levels**; the constant table gives **−2**. Every other Feather agrees at ±2, so 4 is the deliberate outlier that makes Buckle Feather worth 16 MP. **Use 4.**
> **Steel Feather + Diamond Feather on the first two turns** is the standard opener: `×(12+2)/12 = ×1.167` on the main body's damage and `×(12−2)/12 = ×0.833` on damage taken, for 24 MP total.

**Dextral Wing** — commands: *Dextral Arts · Stamina · Mettle · Reboot*. The **status-delivery** wing. Every Wing ability is single-target, **12 MP**, damage constant **18**, `Sp Mag` formula (it scales with the Wing's Magic, not Strength), and `CT`.

| Ability | AP | MP | Power | Status | Chance | Duration | Flags |
|---|---|---|---|---|---|---|---|
| Dextral Arts | init | — | — | opens the skillset | — | — | — |
| **Venom Wing** | init | 12 | 18 | **Poison** | Infinite | Infinite | S, M+, CT |
| **Blind Wing** | init | 12 | 18 | **Darkness** | Infinite | Infinite | S, M+, CT |
| **Mute Wing** | init | 12 | 18 | **Silence** | Infinite | Infinite | S, M+, CT |
| **Lazy Wing** | init | 12 | 18 | **Sleep** | Infinite | 97 (51.4 s) | S, M+, CT |
| **Rock Wing** | 10 | 12 | 18 | **Petrification** | 100 | Infinite | S, M+, CT |
| **Violent Wing** | 10 | 12 | 18 | **Berserk** | Infinite | 133 (70.5 s) | S, M+, CT |
| **Still Wing** | 10 | 12 | 18 | **Stop** | 100 | 100 (53.0 s) | S, M+, CT |
| **Crazy Wing** | 10 | 12 | 18 | **Confusion** | Infinite | 133 (70.5 s) | S, M+, CT |
| **Stamina** | init | — | 32 | restore HP, 1 part, `Heal` | — | — | CT |
| **Mettle** | init | — | — | restore MP, 1 part | — | — | CT |
| **Reboot** | 10 | — | — | revive one KO'd part | — | — | CT |
| Ribbon | init | — | — | innate | — | — | PAS |
| Double HP / Triple HP | 20 / 30 | — | — | max HP ×2 / ×3 | — | — | PAS |
| Break HP Limit / Break Damage Limit | 20 / 20 | — | — | needs *Corpus Invictus* / *Victor Primoris* | — | — | PAS |

`[verified: 2 sources]` — AP/MP/status from the FF Wiki *Dextral Arts* page; power, chance and duration values from the constant table (§2.9.2).
> **Correction:** earlier revisions listed **Lazy Wing** as *Slow*. Both sources give **Sleep**. There is no Slow in the Dextral set — Slow on Full Throttle comes only from the Machina Maw / items side, which matters for the Vegnagun status game.

**Full Throttle main-part MP and AP** (the constant table's powers are in §2.9.2). Every Throttle ability costs **0 MP** and is `RT` with **no charge at all**, which makes Full Throttle the fastest thing in the game:

| Ability | AP | MP | Power | Notes |
|---|---|---|---|---|
| Attack | init | 0 | 16 | |
| Aestus / Winterkill / Whelmen / Levin | init | 0 | 20 | Fire / Ice / Water / Lightning |
| Wisenen | 10 | 0 | 0.75 curr HP | gravity |
| Fiers | 20 | 0 | 16 + guaranteed crit | ⇒ effective 32 |
| Deeth | 20 | 0 | 20 + Death 90% | |
| Assoil | 20 | 0 | 20 | Holy |
| **Fright** | **20** | 0 | 24 + Confuse + Delay | needs Assoil; `CT` |
| **Sword Dance** | **30** | 0 | **48 × 2 hits, all enemies** | needs Fright; `CT, RT` |

`[verified: 2 sources]` — AP from the FF Wiki *Full Throttle (Final Fantasy X-2)* page (Fright 20, Sword Dance 30, both explicitly stated in prose as well as in the table); powers from §2.9.2.

---

## 4. Spherechange and Garment Grids

### 4.1 Garment Grid structure

| Concept | Rule | Confidence |
|---|---|---|
| **Node** | An empty slot that holds one dressphere. A Grid has **2 to 6 nodes**. Nodes are connected by lines. | `[verified: 2 sources]` |
| **Gate** | A coloured orb sitting **on the line between two nodes**: **Red, Green, Blue, Yellow**. A Grid may have 0–4 gates. | `[verified: 2 sources]` |
| **Equipping** | Every girl must have a Garment Grid equipped with **at least one dressphere inserted**; the menu will not let you leave otherwise. | `[verified: 2 sources]` |
| **Sharing** | All three girls may equip the **same** Grid, and the same dressphere may sit on several Grids at once, provided you own a copy. | `[single source]` |
| **Equip effects (P-)** | Some Grids grant a permanent bonus simply for being equipped: `P-STAT+` (stat bonus), `P-ACTA` (an extra castable spell/skillset), `P-PASA` (an auto-ability). Active as long as the Grid is equipped. | `[verified: 2 sources]` |
| **Gate effects (T-)** | Passing through a gate during an in-battle spherechange grants a **temporary** bonus: `T-STAT+`, `T-ACTA`, `T-PASA`. **Lost at the end of the battle**, but retained through KO and revival. | `[verified: 2 sources]` |
| **Gate combos** | An effect may require one gate (`Y`) or a combination (`GR`, `RGY`, `GRYB`). **Order does not matter**, only that you have passed through all listed gates during this battle. | `[verified: 2 sources]` |
| **Stacking quirk** | Any Grid whose stat bonus is allocated to *all* gates grants it **per gate passed** — i.e. three or four times the listed value. Affects: Black Tabard, Blood of the Beast, Chaos Maelstrom, Enigma Plate, Font of Power, Howling Wind, Pride of the Sword, Ray of Hope, Samurai's Honor, Seething Cauldron, Stonehewn, Strength of One, White Signet. | `[single source]` |
| **Path display** | Lines you have already travelled this battle are drawn **blue**. | `[single source]` |

### 4.2 The spherechange action — cost in turns

| Rule | Detail | Confidence |
|---|---|---|
| **When** | Only on the girl's turn, i.e. when her **green ATB bar is full**. Press **L1**. | `[verified: 2 sources]` |
| **Cost** | The spherechange **consumes the whole turn**. The ATB gauge is spent and refills from empty, during which the transformation animation plays. There is no MP cost and no charge bar. | `[verified: 2 sources]` |
| **Adjacency** | You may only change into a dressphere **one link away** from the one currently worn. Gates sitting on that link do not count as a step — you pass *through* them. | `[verified: 2 sources]` |
| **Blocked by** | **Curse** disables the L1 menu entirely. | `[verified: 2 sources]` |
| **Forced by** | **Itchy** seals every command except L1 and Escape until you spherechange. | `[verified: 2 sources]` |
| **Out of battle** | Main menu → Equipment → Dressphere. Free, no adjacency restriction on the display, and stats/commands update immediately. | `[single source]` |
| **Mid-battle UI** | The Grid fills most of the screen; the battle continues in a **minimised window in the upper-right corner**. In Wait mode, entering this screen freezes time. | `[single source]` |

**Implementation note for the fan game.** Because the change costs a full ATB cycle, the design intent is that *passing gates is a buff action*: e.g. on Heart of Flame, changing Gunner→Warrior across the Yellow gate both re-rolls your role and grants Firestrike for the rest of the battle. Budget it as roughly "one lost turn for one battle-long buff".

### 4.3 Garment Grids you will realistically have by Chapter 3 and Chapter 5

Format: `Nodes | gates present (R/G/B/Y) | equip effect | gate effects`.

#### Available from Chapter 1–2 (assume present in a Chapter 3 encounter)

| Grid | Nodes | Gates | Equip effect | Gate effects | Obtained |
|---|---|---|---|---|---|
| **First Steps** | 6 | none | none | none | start of game |
| **Vanguard** | 5 | R G B Y | `STR +5`, `MAG +5` | Y = STR+5 · R = STR+5 · B = MAG+5 · G = MAG+5 | airship, read Shinra's Garment Grid tutorial (any chapter) |
| **Protection Halo** | 5 | R G B Y | `DEF +5`, `MDEF +5` | Y = DEF+5 · R = DEF+5 · B = MDEF+5 · G = MDEF+5 | Ch.1, defeat Flame Dragon (Besaid) |
| **Heart of Flame** | 3 | R G Y | Fire Eater, **Use Fire** | Y = Firestrike · G+R = Use Fira · G+R+Y = **Use Firaga** | Ch.1, "Foggy Fiend Frenzy" (Mushroom Rock) |
| **Menace of the Deep** | 3 | R G Y | Water Eater, **Use Water** | Y = Waterstrike · G+R = Use Watera · G+R+Y = **Use Waterga** | Ch.1, clear the Kilika password puzzle without fighting |
| **Thunder Spawn** | 3 | R G Y | Lightning Eater, **Use Thunder** | Y = Lightningstrike · G+R = Use Thundara · G+R+Y = **Use Thundaga** | Ch.1–2, chest at Luca dock 5 |
| **Ice Queen** | 3 | R G Y | Ice Eater, **Use Blizzard** | Y = Icestrike · G+R = Use Blizzara · G+R+Y = **Use Blizzaga** | Ch.1–2, "Follow that O'aka" (Macalania) |
| **Restless Sleep** | 5 | R G B Y | **Use Sleep**, **Use Bio** | G = Sleepproof · G+R = Sleeptouch · Y = Poisonproof · Y+B = Poisontouch | Ch.1, Youth League HQ (side ledge east on the minimap) |
| **Healing Wind** | 3 | R B (+Y) | healing-themed | — | Ch.1, Luca events |
| **Heart Reborn** | 3 | R B | **Use Life**, **Use Cure** | B = Use Cura · B+R = Use Curaga | Ch.1, Zanarkand, pick "Is that you, Isaaru?" |
| **Healing Light** | 4 | R G Y | **Use Cure** | R = Use Cura · G = Use Life · Y = Use Curaga · R+G+Y = **Use Full-Cure** | Ch.2, beat the Syndicate in Guadosalam (SM7) |
| **Downtrodder** | 3 | R G Y | **Gravity Eater** | G = Gravitystrike · R = **Use Demi** · G+R+Y = **Double HP** | Ch.2/3/5, Bevelle forbidden area |
| **Hour of Need** | 5 | R G B Y | `DEF +10`, `MDEF +10` | Y = DEF+10 · R = DEF+10 · B = MDEF+10 · G = MDEF+10 | Ch.2, beat Ormi at Bikanel Oasis |
| **Stonehewn** | 4 | R G B Y | `DEF +10` | **DEF +15 per gate** (all four) | Ch.2, beat Logos on Gagazet |
| **Bum Rush** | 5 | R G B Y | `STR +10`, `MAG +10` | Y = STR+10 · R = STR+10 · B = MAG+10 · G = MAG+10 | Ch.2, automatic after the three Syndicate disguises |
| **Unerring Path** | **2** | **none** | none | none | Ch.1/2, with Paine's SDSP from Tromell (also from Rikku's or Yuna's SDSP) — **the fastest route to a special dressphere** |
| **Covetous** | 3 | R B | none | R = **Use Osmose** · B = **Use Drain** | Ch.2, Shelinda interview at Luca Square |
| **Enigma Plate** | 4 | R G B Y | `MDEF +10` | **MDEF +15 per gate** | Ch.2/3/5, score 500+ in Gunner's Gauntlet |
| **Highroad Winds** | 4 | R G B Y | **First Strike** | G = Slowproof · R = Stopproof · Y = **Use Haste** · all four = **SOS Haste** | Ch.2/3/5, "Clean Sweep" in the Calm Lands |
| **Treasure Hunt** | 5 | R | **Use Mug** | R = **Double Items** | Ch.3/5, Sphere Break vs Shinra with an Item/Rare-Item border coin |
| **Samurai's Honor** | 6 | R G B Y | **Use Bushido abilities** | **STR +15 per gate**; all four = **Bushido wait down** (−40% CT) | Ch.2/3, calibrate 5+ Thunder Plains towers perfectly |
| **Raging Giant** | 5 | R G B Y | **Use Confuse** | G = Confuseproof · G+R = Confusetouch · Y = Berserkproof · Y+B = Berserktouch | Ch.1/2/3/5, second cipher door in the Besaid secret dungeon |

#### Added in Chapter 3–5

| Grid | Nodes | Gates | Equip effect | Gate effects | Obtained |
|---|---|---|---|---|---|
| **Pride of the Sword** | 6 | R G B Y | **Use Swordplay abilities** | **STR +15 per gate**; all four = **Swordplay wait down** | Ch.3, "Protect the Agency" (Macalania) |
| **Blood of the Beast** | 6 | R G B Y | **Use Instinct abilities** | **STR +15 per gate**; all four = **Instinct wait down** | Ch.3, New Yevon path, Bevelle Limbo (Pacce) |
| **Chaos Maelstrom** | 6 | R G B Y | **Use Arcana abilities** | **MAG +15 per gate**; all four = **Arcana wait down** | Ch.3/5, find 13 Squatter monkeys in Kilika woods |
| **Black Tabard** | 6 | R G B Y | **Use Black Magic abilities** | **MAG +15 per gate**; all four = **Black Magic wait down** | Ch.4, complete SM12 (Moonflow) |
| **Tempered Will** | 5 | R G | none | G = **Double HP** · R = **Double MP** | Ch.5, Guadosalam (Tromell, several prerequisites) |
| **Tricks of the Trade** | 6 | R G Y | none | R = Black Magic wait down · Y = White Magic wait down · G = Arcana wait down | Ch.5, Episode Complete for Kilika |
| **Font of Power** | 4 | R B Y | **Half MP Cost** | MAG +15 on G/Y/B; R+Y+B = **One MP Cost** | Ch.5, Fiend Colony dungeon (Mi'ihen) |
| **Flash of Steel** | 5 | R G B Y | `STR +20`, `MAG +20` | Y = STR+20 · R = STR+20 · B = MAG+20 · G = MAG+20 | Ch.5, Argent Inc. at Lv5 publicity |
| **Scourgebane** | 5 | R G B Y | none | per-gate status immunities (G = Sleepproof + Poisonproof, etc.) | Ch.5, Episode Complete in Bevelle |
| **Disaster in Bloom** | 5 | R G B Y | none | G = Sleeptouch · R = Silencetouch · Y = Darktouch · B = Poisontouch · all four = **Stonetouch** | Ch.5, Open Air Inc. at Lv5 publicity |
| **Immortal Soul** | 4 | R G Y | **Use Life**, **Use Cure** | G = Use Cura · Y = Use Curaga · R+G+Y = **Use Full-Life** | Ch.5, defeat Dark Anima |
| **Conflagration** | 4 | R G B | **Use Black Magic abilities** | R+B+G = **Use Flare** | Ch.5, Lian & Ayde chain (Gagazet) |
| **Megiddo** | 5 | R G Y | Ultima-themed | all gates = **Use Ultima** | Ch.5, reach Farplane Abyss via all five routes |
| **Bitter Farewell** | 5 | R G B Y | **Use Death**, **Use Doom** | G = Deathproof · G+R = Deathtouch · Y = Doomproof · Y+B = Doomtouch | Ch.2, Macalania Hypello after the musicians sidequest |
| **Covenant of Growth** | 5 | B Y | none | B = **Double AP** · Y = **Double EXP** | Ch.5, beat Frailea in the Cactuar Hollow cact-war |
| **The End** | 5 | R G B Y | **Break HP Limit** | G+R = **Break Damage Limit** · all four = **Use Finale** | Ch.5, Oversoul every Oversoul-able fiend, then talk to Shinra |

**Recommended defaults for a Chapter 3 boss encounter** `[estimate]`: Yuna on **Vanguard** or **Heart of Flame**, Rikku on **Highroad Winds** (First Strike is huge in an ATB game), Paine on **Hour of Need** or **Samurai's Honor**.
**Recommended defaults for a Chapter 5 boss encounter** `[estimate]`: **Tempered Will** (Double HP + Double MP), **Chaos Maelstrom** / **Pride of the Sword** (+60 STR or MAG across four gates plus the skillset), **Flash of Steel** (+20/+20 equipped, +80 across gates), **Font of Power** (One MP Cost), or **Unerring Path** when the plan is to reach a special dressphere on turn 3.

---

## 5. Character stats, accessories, items

### 5.1 The single most important stat fact

**In FFX-2, a character's combat stats are a function of (dressphere × level) only. Yuna, Rikku and Paine have IDENTICAL stats in the same dressphere at the same level.** The two exceptions are Trainer and Mascot, which have per-girl variants because the ability sets differ. `[verified: 2 sources]` — SinirothX's growth algorithms list Yuna's and Rikku's Gunner formulas as byte-identical, and the FF Wiki publishes a single stat table per standard dressphere.

What *does* differ per girl is the **EXP curve**: `EXP to next level = ((lv-1)^3 × A) + ((lv-1)^2 × B)` with `[single source]`

| Girl | A | B | EXP at Lv 30 | Lv 45 | Lv 50 |
|---|---|---|---|---|---|
| Yuna | 1.4 | 3.4 | 37,004 | 125,840 | 172,872 |
| Rikku | 1.3 | 2.7 | 33,976 | 115,966 | 159,426 |
| Paine | 1.2 | 4.2 | 32,799 | 110,352 | 151,263 |

So Paine levels fastest, Yuna slowest — but at equal level they are mechanically interchangeable.

**Growth algorithm shape** (example: Gunner) `[single source]`:
```
HP   = (lv * 42) + 79  - (lv^2 / 7)
MP   = (lv * 1.6) + 18 - (lv^2 / 188)
Str  = (lv * 1.5) + ((lv / 4) + 12)   - (lv^2 / 16 / 13 / 1)
Mag  = (lv * 0.6) + ((lv / 33) + 12)  - (lv^2 / 16 / 200 / 2)
Def  = (lv * 1.0) + ((lv / 100) + 11) - (lv^2 / 16 / 12 / 1)
MDef = (lv * 0.4) + ((lv / 11) + 12)  - (lv^2 / 16 / 200 / 2)
Agl  = (lv * 0)   + ((lv / 13) + 50)  - (lv^2 / 16 / 200 / 4)
Acc  = (lv * 0.1) + ((lv / 33) + 120) - (lv^2 / 16 / 200 / 4)
Eva  = (lv * 0)   + ((lv / 22) + 2)   - (lv^2 / 16 / 200 / 4)
Luck = (lv * 0.1) + ((lv / 27) + 12)  - (lv^2 / 16 / 200 / 4)
```
Note the quadratic **subtraction** term: all stats decelerate. Agility and Evasion have a zero linear term and therefore barely move across the whole game.

### 5.1a Growth algorithms for EVERY dressphere (not just Gunner)

SinirothX §19 publishes a growth algorithm for **all sixteen** dresspheres (and all nine special-dressphere parts — see §3.15), not only the Gunner example quoted above. Normalising every one of them to the same shape:

```
stat(lv) = lv*A  +  lv/D  +  B  -  lv^2/Q          // "D = -" means the lv/D term is absent
```

where `Q` is the product of the divisor chain SinirothX writes as `lv^2 / 16 / n / m` (e.g. Gunner Strength's `/16 /13 /1` is `Q = 208`). All three girls share identical coefficients in every standard dressphere — the algorithm lists for Yuna, Rikku and Paine are byte-identical — which confirms §5.1's headline fact.

| Dressphere | Stat | A (lv·A) | D (lv/D) | B (base) | Q (−lv²/Q) |
|---|---|---|---|---|---|
| **Gunner** | HP | 42 | — | 79 | 7 |
|  | MP | 1.6 | — | 18 | 188 |
|  | Str | 1.5 | 4 | 12 | 208 |
|  | Mag | 0.6 | 33 | 12 | 6400 |
|  | Def | 1 | 100 | 11 | 192 |
|  | MDef | 0.4 | 11 | 12 | 6400 |
|  | Agi | 0 | 13 | 50 | 12800 |
|  | Acc | 0.1 | 33 | 120 | 12800 |
|  | Eva | 0 | 22 | 2 | 12800 |
|  | Lck | 0.1 | 27 | 12 | 12800 |
| **Thief** | HP | 44 | — | 70 | 7.3 |
|  | MP | 2.2 | — | 33 | 122 |
|  | Str | 1.7 | 88 | 7 | 176 |
|  | Mag | 1.1 | 12 | 10 | 320 |
|  | Def | 0.5 | 7 | 8 | 1920 |
|  | MDef | 0.5 | 8 | 36 | 6400 |
|  | Agi | 0.1 | 80 | 57 | 12800 |
|  | Acc | 0 | 10 | 108 | 12800 |
|  | Eva | 0 | 8 | 17 | 12800 |
|  | Lck | 0 | 7 | 23 | 12800 |
| **Warrior** | HP | 46 | — | 103 | 18.3 |
|  | MP | 2.2 | — | 16 | 150 |
|  | Str | 2 | 4 | 14 | 304 |
|  | Mag | 0.4 | 13 | 12 | 6400 |
|  | Def | 1.1 | 60 | 74 | 208 |
|  | MDef | 0 | 10 | 5 | 6400 |
|  | Agi | 0 | 16 | 48 | 12800 |
|  | Acc | 0 | 22 | 100 | 12800 |
|  | Eva | 0 | 20 | 3 | 12800 |
|  | Lck | 0 | 22 | 11 | 12800 |
| **Songstress** | HP | 28 | — | 58 | 18.5 |
|  | MP | 3.3 | — | 36 | 99 |
|  | Str | 0.1 | 17 | 4 | 6400 |
|  | Mag | 1.4 | 10 | 17 | 288 |
|  | Def | 0.1 | 21 | 3 | 12800 |
|  | MDef | 0.4 | 100 | 32 | 6400 |
|  | Agi | 0.1 | 80 | 51 | 12800 |
|  | Acc | 0 | 18 | 96 | 12800 |
|  | Eva | 0 | 22 | 8 | 12800 |
|  | Lck | 0 | 16 | 8 | 12800 |
| **White Mage** | HP | 28 | — | 75 | 17.7 |
|  | MP | 3.9 | — | 44 | 122 |
|  | Str | 0.1 | 13 | 5 | 6400 |
|  | Mag | 1.8 | 10 | 28 | 160 |
|  | Def | 0.1 | 19 | 8 | 12800 |
|  | MDef | 0.9 | 100 | 111 | 1600 |
|  | Agi | 0 | 17 | 50 | 12800 |
|  | Acc | 0 | 18 | 98 | 12800 |
|  | Eva | 0 | 22 | 4 | 12800 |
|  | Lck | 0 | 19 | 9 | 12800 |
| **Black Mage** | HP | 27 | — | 73 | 19.3 |
|  | MP | 4.2 | — | 48 | 155 |
|  | Str | 0.1 | 17 | 5 | 6400 |
|  | Mag | 1.6 | 4 | 33 | 192 |
|  | Def | 0.1 | 17 | 4 | 12800 |
|  | MDef | 0.7 | 19 | 108 | 3200 |
|  | Agi | 0 | 17 | 49 | 12800 |
|  | Acc | 0 | 18 | 98 | 12800 |
|  | Eva | 0.1 | 22 | 2 | 12800 |
|  | Lck | 0 | 20 | 9 | 12800 |
| **Gun Mage** | HP | 36 | — | 72 | 8.8 |
|  | MP | 3.1 | — | 18 | 173 |
|  | Str | 2 | 67 | 14 | 160 |
|  | Mag | 1.5 | 4 | 28 | 192 |
|  | Def | 1 | 100 | 7 | 176 |
|  | MDef | 1 | 18 | 44 | 192 |
|  | Agi | 0 | 12 | 51 | 12800 |
|  | Acc | 0.1 | 100 | 118 | 12800 |
|  | Eva | 0 | 22 | 1 | 12800 |
|  | Lck | 0 | 27 | 9 | 12800 |
| **Dark Knight** | HP | 58 | — | 173 | 17.5 |
|  | MP | 3.2 | — | 85 | 155 |
|  | Str | 2.3 | 12 | 16 | 128 |
|  | Mag | 1 | 2 | 16 | 176 |
|  | Def | 0.5 | 20 | 90 | 6400 |
|  | MDef | 0.1 | 4 | 72 | 6400 |
|  | Agi | 0 | 16 | 36 | 12800 |
|  | Acc | 0 | 17 | 100 | 12800 |
|  | Eva | 0 | 20 | 0 | 12800 |
|  | Lck | 0 | 20 | 8 | 12800 |
| **Samurai** | HP | 38 | — | 78 | 13.3 |
|  | MP | 2.6 | — | 18 | 180 |
|  | Str | 2 | 10 | 15 | 192 |
|  | Mag | 0.6 | 4 | 18 | 6400 |
|  | Def | 0.3 | 100 | 32 | 6400 |
|  | MDef | 0.3 | 16 | 38 | 6400 |
|  | Agi | 0 | 17 | 54 | 12800 |
|  | Acc | 0 | 17 | 104 | 12800 |
|  | Eva | 0 | 20 | 10 | 12800 |
|  | Lck | 0 | 22 | 13 | 12800 |
| **Berserker** | HP | 66 | — | 113 | 10 |
|  | MP | 1.6 | — | 14 | 200 |
|  | Str | 2.1 | 5 | 16 | 128 |
|  | Mag | 0 | 33 | 1 | 12800 |
|  | Def | 0 | 14 | 24 | 12800 |
|  | MDef | 0 | 20 | 1 | 12800 |
|  | Agi | 0.1 | 80 | 58 | 12800 |
|  | Acc | 0 | 14 | 102 | 12800 |
|  | Eva | 0 | 14 | 13 | 12800 |
|  | Lck | 0 | 21 | 12 | 12800 |
| **Alchemist** | HP | 38 | — | 80 | 7.6 |
|  | MP | 1.5 | — | 14 | 177 |
|  | Str | 1.6 | 66 | 13 | 208 |
|  | Mag | 0.2 | 13 | 4 | 6400 |
|  | Def | 1 | 60 | 10 | 176 |
|  | MDef | 0.3 | 19 | 2 | 6400 |
|  | Agi | 0 | 12 | 50 | 12800 |
|  | Acc | 0 | 13 | 117 | 12800 |
|  | Eva | 0 | 22 | 1 | 12800 |
|  | Lck | 0 | 33 | 10 | 12800 |
| **Lady Luck** | HP | 35 | — | 77 | 7.7 |
|  | MP | 3.3 | — | 40 | 143 |
|  | Str | 1.3 | 75 | 10 | 688 |
|  | Mag | 1.1 | 75 | 15 | 480 |
|  | Def | 0 | 27 | 35 | 12800 |
|  | MDef | 0.2 | 13 | 37 | 6400 |
|  | Agi | 0 | 13 | 52 | 12800 |
|  | Acc | 0 | 44 | 122 | 12800 |
|  | Eva | 0 | 27 | 5 | 12800 |
|  | Lck | 0.2 | 20 | 19 | 12800 |
| **Trainer** | HP | 46 | — | 85 | 7 |
|  | MP | 2.6 | — | 32 | 130 |
|  | Str | 1.8 | 20 | 17 | 240 |
|  | Mag | 1.1 | 17 | 12 | 176 |
|  | Def | 0.3 | 27 | 32 | 6400 |
|  | MDef | 0.2 | 20 | 20 | 12800 |
|  | Agi | 0.1 | 100 | 47 | 12800 |
|  | Acc | 0 | 11 | 100 | 12800 |
|  | Eva | 0 | 20 | 4 | 12800 |
|  | Lck | 0 | 20 | 7 | 12800 |
| **Mascot** | HP | 81 | — | 90 | 6.7 |
|  | MP | 5.8 | — | 99 | 97 |
|  | Str | 1.8 | 17 | 20 | 240 |
|  | Mag | 2 | 12 | 30 | 112 |
|  | Def | 0.1 | 23 | 130 | 12800 |
|  | MDef | 0.1 | 8 | 110 | 6400 |
|  | Agi | 0.1 | 22 | 54 | 12800 |
|  | Acc | 0.1 | 22 | 120 | 12800 |
|  | Eva | 0 | 10 | 10 | 12800 |
|  | Lck | 0 | 23 | 15 | 12800 |
| **Festival-Goer (Omatsurishi)** | HP | 55 | — | 74 | 5.7 |
|  | MP | 4.8 | — | 31 | 68 |
|  | Str | 1.9 | 88 | 14 | 320 |
|  | Mag | 1.8 | 77 | 28 | 272 |
|  | Def | 1.3 | 100 | 18 | 192 |
|  | MDef | 0.8 | 13 | 24 | 9600 |
|  | Agi | 0 | 13 | 55 | 12800 |
|  | Acc | 0 | 24 | 102 | 12800 |
|  | Eva | 0 | 22 | 10 | 12800 |
|  | Lck | 0 | 11 | 10 | 12800 |
| **Psi-Kicker (Saikikka)** | HP | 48 | — | 80 | 5.8 |
|  | MP | 4.4 | — | 40 | 99 |
|  | Str | 1.9 | 20 | 17 | 192 |
|  | Mag | 1.8 | 4 | 30 | 272 |
|  | Def | 0.1 | 2 | 13 | 12800 |
|  | MDef | 0.6 | 13 | 121 | 12800 |
|  | Agi | 0 | 17 | 50 | 12800 |
|  | Acc | 0 | 20 | 107 | 12800 |
|  | Eva | 0 | 8 | 8 | 12800 |
|  | Lck | 0 | 26 | 9 | 12800 |


`[single source: SinirothX §19, Dressphere Growth Algorithms]`

**Calibration — read before using these.** The algorithms are **curve fits**, not the game's own per-level increments, and SinirothX says so explicitly. Measured against the FF Wiki's published Lv 1–99 tables:

| Stat group | Typical `floor()` deviation from the published tables | Notes |
|---|---|---|
| HP, Str, Mag | **0 to −1** at every level | safe to use directly |
| Def | 0 to −1 at most levels | safe |
| MP, Agi, Acc, Eva, Luck | 0 to −3 mid-curve, ≤1 at Lv 1 and Lv 99 | acceptable |
| MDef | **up to −12 mid-curve on some dresspheres** | see the Gunner warning below |

**Implementation rule:** `Math.floor()` the algorithm, then prefer a published table value whenever one exists for that exact level. The tables in §5.1b and §5.2 are ground truth; the algorithm is the interpolator for levels they do not list. This removes the previous defect — sparse tables plus one algorithm meant every unlisted level had to be linearly interpolated, which cannot reproduce the quadratic-deceleration curve.

> **Data warning — the FF Wiki's Gunner table duplicates its Defense column into Magic Defense.** Every row of the wiki's Gunner table has `Def == MDef` (12/12 at Lv 1, 32/32 at Lv 25, 36/36 at Lv 30, 58/58 at Lv 99), the Defense figures match the Defense algorithm to the unit, and the Magic Defense figures miss the MDef algorithm by 10–12. The algorithm's MDef values — **Lv 25 ≈ 23, Lv 30 ≈ 26, Lv 50 ≈ 32, Lv 99 ≈ 48** — are the ones to use for Gunner, and they are far more consistent with Gunner being a *poor* magic defender. The same duplication does **not** appear on Thief, Warrior, Dark Knight or the other pages, whose Def and MDef columns differ. `[contradicted — recorded]`

### 5.1b Per-level tables for the two encounter bands (Lv 20–30 and Lv 43–52)

Transcribed directly from the FF Wiki's per-dressphere Lv 1–99 stat tables, which are the ground truth referred to above. **Lv 20–30** covers the Chapter 2/3 Bahamut encounter (Bahamut himself is Lv 20); **Lv 43–52** covers the Chapter 5 Vegnagun / Shuyin encounter. Columns: **HP · MP · Str · Mag · Def · MDef · Agi · Acc · Eva · Luck**. `[verified: 2 sources]` (FF Wiki tables reproduce SinirothX's algorithms; deviations documented above).

**Gunner**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 862 | 51 | 46 | 24 | 30 | 30 | 53 | 123 | 4 | 15 |
| 21 | 898 | 52 | 46 | 24 | 29 | 29 | 53 | 123 | 4 | 15 |
| 22 | 934 | 54 | 48 | 25 | 30 | 30 | 53 | 123 | 4 | 15 |
| 23 | 970 | 56 | 49 | 26 | 31 | 31 | 53 | 123 | 4 | 15 |
| 24 | 1005 | 57 | 52 | 26 | 32 | 32 | 53 | 123 | 4 | 15 |
| 25 | 1040 | 59 | 52 | 27 | 32 | 32 | 53 | 123 | 4 | 16 |
| 26 | 1075 | 59 | 54 | 28 | 33 | 33 | 53 | 123 | 4 | 16 |
| 27 | 1109 | 61 | 55 | 28 | 33 | 33 | 53 | 123 | 4 | 16 |
| 28 | 1143 | 63 | 58 | 29 | 35 | 35 | 53 | 123 | 4 | 16 |
| 29 | 1177 | 64 | 58 | 30 | 35 | 35 | 53 | 123 | 4 | 16 |
| 30 | 1211 | 66 | 60 | 31 | 36 | 36 | 54 | 124 | 5 | 17 |
| 43 | 1621 | 82 | 78 | 39 | 44 | 44 | 55 | 126 | 5 | 18 |
| 44 | 1651 | 83 | 80 | 39 | 44 | 44 | 55 | 126 | 5 | 18 |
| 45 | 1680 | 84 | 81 | 40 | 45 | 45 | 55 | 126 | 5 | 19 |
| 46 | 1709 | 85 | 82 | 41 | 45 | 45 | 55 | 126 | 5 | 19 |
| 47 | 1738 | 86 | 83 | 41 | 45 | 45 | 55 | 126 | 5 | 19 |
| 48 | 1766 | 87 | 85 | 42 | 46 | 46 | 55 | 126 | 5 | 19 |
| 49 | 1794 | 88 | 86 | 43 | 47 | 47 | 55 | 126 | 4 | 19 |
| 50 | 1822 | 90 | 87 | 44 | 47 | 47 | 56 | 127 | 5 | 20 |
| 51 | 1850 | 90 | 88 | 43 | 47 | 47 | 56 | 127 | 5 | 20 |
| 52 | 1877 | 91 | 90 | 44 | 48 | 48 | 56 | 127 | 5 | 20 |

**Thief**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 896 | 74 | 39 | 32 | 24 | 54 | 60 | 110 | 19 | 26 |
| 21 | 934 | 76 | 40 | 33 | 24 | 54 | 60 | 110 | 19 | 26 |
| 22 | 972 | 78 | 42 | 34 | 25 | 55 | 60 | 110 | 19 | 26 |
| 23 | 1010 | 79 | 43 | 35 | 26 | 55 | 60 | 110 | 19 | 26 |
| 24 | 1048 | 81 | 44 | 37 | 27 | 57 | 60 | 110 | 19 | 26 |
| 25 | 1085 | 83 | 46 | 38 | 28 | 58 | 60 | 110 | 20 | 27 |
| 26 | 1122 | 85 | 48 | 38 | 28 | 59 | 61 | 110 | 20 | 27 |
| 27 | 1159 | 87 | 48 | 39 | 28 | 60 | 61 | 110 | 20 | 27 |
| 28 | 1195 | 88 | 50 | 40 | 29 | 60 | 61 | 111 | 20 | 27 |
| 29 | 1231 | 90 | 52 | 41 | 30 | 61 | 61 | 111 | 20 | 27 |
| 30 | 1267 | 92 | 53 | 43 | 32 | 62 | 62 | 112 | 21 | 28 |
| 43 | 1709 | 112 | 70 | 55 | 40 | 70 | 63 | 113 | 22 | 30 |
| 44 | 1741 | 114 | 70 | 55 | 41 | 71 | 63 | 113 | 22 | 30 |
| 45 | 1773 | 116 | 72 | 56 | 42 | 72 | 63 | 113 | 23 | 31 |
| 46 | 1805 | 117 | 73 | 57 | 41 | 72 | 63 | 113 | 23 | 31 |
| 47 | 1836 | 118 | 74 | 58 | 42 | 73 | 63 | 113 | 23 | 31 |
| 48 | 1867 | 120 | 75 | 59 | 43 | 74 | 63 | 113 | 23 | 31 |
| 49 | 1898 | 121 | 77 | 60 | 44 | 75 | 63 | 113 | 23 | 30 |
| 50 | 1928 | 123 | 78 | 62 | 45 | 76 | 64 | 114 | 24 | 31 |
| 51 | 1958 | 124 | 79 | 62 | 45 | 75 | 64 | 114 | 24 | 31 |
| 52 | 1988 | 125 | 80 | 63 | 46 | 76 | 65 | 114 | 24 | 31 |

**Warrior**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 1002 | 58 | 57 | 24 | 95 | 8 | 50 | 102 | 5 | 12 |
| 21 | 1045 | 60 | 58 | 24 | 96 | 8 | 50 | 102 | 5 | 12 |
| 22 | 1089 | 61 | 60 | 25 | 97 | 8 | 50 | 102 | 5 | 12 |
| 23 | 1133 | 63 | 62 | 25 | 97 | 8 | 50 | 102 | 5 | 12 |
| 24 | 1176 | 65 | 64 | 26 | 99 | 8 | 50 | 102 | 5 | 12 |
| 25 | 1219 | 67 | 66 | 26 | 100 | 9 | 50 | 102 | 5 | 12 |
| 26 | 1263 | 69 | 68 | 26 | 100 | 9 | 50 | 102 | 5 | 12 |
| 27 | 1306 | 71 | 69 | 27 | 101 | 9 | 50 | 102 | 5 | 12 |
| 28 | 1349 | 72 | 72 | 27 | 102 | 9 | 50 | 102 | 5 | 12 |
| 29 | 1392 | 74 | 74 | 28 | 103 | 9 | 50 | 102 | 5 | 12 |
| 30 | 1434 | 76 | 75 | 29 | 104 | 10 | 51 | 103 | 6 | 13 |
| 43 | 1980 | 98 | 98 | 34 | 113 | 11 | 52 | 103 | 6 | 13 |
| 44 | 2022 | 100 | 100 | 35 | 113 | 10 | 52 | 103 | 6 | 13 |
| 45 | 2063 | 102 | 101 | 36 | 115 | 11 | 52 | 103 | 6 | 13 |
| 46 | 2104 | 103 | 103 | 36 | 114 | 11 | 52 | 103 | 6 | 13 |
| 47 | 2145 | 105 | 104 | 37 | 115 | 11 | 52 | 103 | 6 | 13 |
| 48 | 2186 | 106 | 106 | 37 | 116 | 11 | 52 | 103 | 6 | 13 |
| 49 | 2226 | 107 | 108 | 38 | 117 | 11 | 52 | 103 | 6 | 13 |
| 50 | 2267 | 110 | 109 | 38 | 117 | 12 | 53 | 104 | 7 | 14 |
| 51 | 2307 | 111 | 110 | 38 | 118 | 12 | 53 | 104 | 7 | 14 |
| 52 | 2348 | 112 | 113 | 39 | 118 | 12 | 53 | 104 | 7 | 14 |

**Songstress**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 597 | 98 | 7 | 46 | 7 | 41 | 55 | 98 | 10 | 9 |
| 21 | 623 | 101 | 7 | 47 | 7 | 41 | 55 | 98 | 10 | 9 |
| 22 | 648 | 104 | 7 | 48 | 7 | 41 | 55 | 98 | 10 | 9 |
| 23 | 674 | 106 | 7 | 50 | 7 | 42 | 55 | 98 | 10 | 9 |
| 24 | 699 | 110 | 7 | 50 | 7 | 42 | 55 | 98 | 10 | 9 |
| 25 | 725 | 112 | 8 | 52 | 8 | 43 | 56 | 98 | 10 | 9 |
| 26 | 750 | 115 | 8 | 53 | 8 | 43 | 56 | 98 | 10 | 9 |
| 27 | 775 | 118 | 8 | 54 | 8 | 43 | 56 | 98 | 10 | 9 |
| 28 | 800 | 121 | 8 | 56 | 8 | 44 | 56 | 98 | 10 | 9 |
| 29 | 825 | 123 | 8 | 57 | 8 | 44 | 56 | 98 | 10 | 9 |
| 30 | 850 | 126 | 9 | 59 | 9 | 45 | 57 | 99 | 11 | 10 |
| 43 | 1163 | 159 | 10 | 75 | 10 | 49 | 58 | 99 | 11 | 10 |
| 44 | 1186 | 162 | 10 | 76 | 10 | 49 | 62 | 99 | 11 | 10 |
| 45 | 1209 | 164 | 11 | 77 | 11 | 50 | 58 | 99 | 11 | 10 |
| 46 | 1232 | 166 | 11 | 78 | 11 | 50 | 58 | 99 | 11 | 10 |
| 47 | 1255 | 169 | 11 | 79 | 11 | 50 | 58 | 99 | 11 | 10 |
| 48 | 1278 | 171 | 11 | 80 | 11 | 51 | 58 | 99 | 11 | 10 |
| 49 | 1301 | 173 | 11 | 81 | 11 | 51 | 58 | 99 | 11 | 10 |
| 50 | 1323 | 176 | 12 | 84 | 12 | 52 | 59 | 100 | 12 | 11 |
| 51 | 1346 | 178 | 12 | 84 | 11 | 52 | 59 | 100 | 11 | 11 |
| 52 | 1368 | 180 | 12 | 85 | 11 | 52 | 59 | 100 | 11 | 11 |

**White Mage**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 613 | 119 | 9 | 64 | 12 | 129 | 52 | 100 | 5 | 10 |
| 21 | 639 | 122 | 9 | 65 | 12 | 129 | 52 | 100 | 5 | 10 |
| 22 | 664 | 126 | 9 | 66 | 12 | 130 | 52 | 100 | 5 | 10 |
| 23 | 690 | 129 | 9 | 68 | 12 | 131 | 52 | 100 | 5 | 10 |
| 24 | 715 | 133 | 9 | 70 | 12 | 132 | 52 | 100 | 5 | 10 |
| 25 | 740 | 136 | 10 | 72 | 13 | 133 | 52 | 100 | 5 | 10 |
| 26 | 765 | 140 | 10 | 72 | 13 | 134 | 52 | 100 | 5 | 10 |
| 27 | 790 | 144 | 10 | 74 | 13 | 135 | 52 | 100 | 5 | 10 |
| 28 | 815 | 147 | 10 | 76 | 13 | 136 | 52 | 100 | 5 | 10 |
| 29 | 840 | 151 | 10 | 77 | 13 | 137 | 52 | 100 | 5 | 10 |
| 30 | 865 | 154 | 11 | 80 | 14 | 138 | 53 | 101 | 6 | 11 |
| 43 | 1175 | 196 | 13 | 98 | 15 | 148 | 54 | 102 | 6 | 11 |
| 44 | 1198 | 200 | 13 | 99 | 15 | 149 | 54 | 102 | 6 | 11 |
| 45 | 1221 | 203 | 14 | 101 | 16 | 150 | 54 | 102 | 6 | 11 |
| 46 | 1244 | 206 | 14 | 101 | 16 | 151 | 54 | 101 | 6 | 11 |
| 47 | 1267 | 209 | 13 | 103 | 16 | 152 | 53 | 101 | 6 | 11 |
| 48 | 1289 | 213 | 13 | 104 | 16 | 153 | 53 | 101 | 6 | 11 |
| 49 | 1312 | 216 | 13 | 105 | 16 | 154 | 53 | 101 | 6 | 11 |
| 50 | 1334 | 219 | 14 | 108 | 17 | 155 | 54 | 102 | 7 | 12 |
| 51 | 1357 | 221 | 14 | 108 | 17 | 155 | 54 | 102 | 7 | 12 |
| 52 | 1379 | 224 | 14 | 110 | 17 | 156 | 54 | 102 | 7 | 12 |

**Black Mage**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 593 | 130 | 8 | 68 | 7 | 124 | 51 | 99 | 4 | 10 |
| 21 | 618 | 134 | 8 | 69 | 7 | 124 | 51 | 99 | 4 | 10 |
| 22 | 642 | 137 | 8 | 71 | 7 | 125 | 51 | 99 | 4 | 10 |
| 23 | 667 | 141 | 8 | 72 | 7 | 126 | 51 | 99 | 4 | 10 |
| 24 | 692 | 145 | 8 | 74 | 7 | 127 | 51 | 99 | 4 | 10 |
| 25 | 716 | 149 | 9 | 76 | 8 | 128 | 51 | 99 | 4 | 10 |
| 26 | 740 | 153 | 9 | 77 | 8 | 128 | 51 | 99 | 4 | 10 |
| 27 | 765 | 157 | 9 | 79 | 8 | 129 | 51 | 99 | 4 | 10 |
| 28 | 789 | 160 | 9 | 80 | 8 | 130 | 51 | 99 | 4 | 10 |
| 29 | 813 | 164 | 9 | 82 | 8 | 131 | 51 | 99 | 4 | 10 |
| 30 | 837 | 169 | 10 | 84 | 9 | 132 | 52 | 100 | 5 | 11 |
| 43 | 1139 | 217 | 12 | 102 | 11 | 141 | 53 | 101 | 5 | 11 |
| 44 | 1161 | 220 | 12 | 104 | 11 | 141 | 53 | 101 | 5 | 11 |
| 45 | 1184 | 224 | 13 | 106 | 12 | 142 | 53 | 101 | 5 | 11 |
| 46 | 1206 | 228 | 12 | 106 | 11 | 142 | 52 | 101 | 5 | 11 |
| 47 | 1228 | 231 | 12 | 108 | 11 | 143 | 52 | 101 | 5 | 11 |
| 48 | 1250 | 235 | 12 | 109 | 11 | 144 | 52 | 100 | 5 | 11 |
| 49 | 1272 | 238 | 12 | 111 | 11 | 145 | 52 | 100 | 5 | 11 |
| 50 | 1294 | 242 | 13 | 112 | 12 | 146 | 53 | 101 | 6 | 12 |
| 51 | 1316 | 246 | 13 | 113 | 12 | 146 | 53 | 101 | 6 | 12 |
| 52 | 1337 | 249 | 13 | 115 | 12 | 147 | 53 | 101 | 6 | 12 |

**Gun Mage**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 747 | 98 | 52 | 61 | 25 | 63 | 53 | 120 | 3 | 10 |
| 21 | 778 | 101 | 54 | 62 | 25 | 64 | 53 | 120 | 3 | 10 |
| 22 | 809 | 104 | 55 | 64 | 25 | 65 | 53 | 120 | 3 | 10 |
| 23 | 840 | 106 | 57 | 65 | 26 | 66 | 53 | 120 | 3 | 10 |
| 24 | 871 | 109 | 59 | 67 | 27 | 66 | 53 | 120 | 3 | 10 |
| 25 | 901 | 112 | 61 | 68 | 28 | 67 | 53 | 120 | 3 | 10 |
| 26 | 932 | 115 | 62 | 70 | 28 | 68 | 53 | 120 | 3 | 10 |
| 27 | 962 | 117 | 64 | 71 | 28 | 69 | 53 | 120 | 3 | 10 |
| 28 | 991 | 120 | 66 | 73 | 29 | 69 | 53 | 121 | 3 | 10 |
| 29 | 1021 | 123 | 67 | 74 | 30 | 70 | 53 | 121 | 3 | 10 |
| 30 | 1050 | 126 | 69 | 76 | 31 | 71 | 55 | 122 | 4 | 11 |
| 43 | 1410 | 161 | 89 | 93 | 38 | 80 | 56 | 123 | 4 | 11 |
| 44 | 1436 | 163 | 90 | 95 | 38 | 80 | 56 | 123 | 4 | 11 |
| 45 | 1462 | 166 | 92 | 96 | 38 | 81 | 56 | 123 | 4 | 11 |
| 46 | 1488 | 168 | 93 | 97 | 39 | 81 | 56 | 123 | 4 | 11 |
| 47 | 1513 | 171 | 95 | 98 | 39 | 82 | 56 | 123 | 4 | 11 |
| 48 | 1539 | 173 | 96 | 100 | 40 | 82 | 56 | 123 | 4 | 11 |
| 49 | 1564 | 176 | 97 | 101 | 41 | 83 | 55 | 123 | 4 | 11 |
| 50 | 1588 | 179 | 99 | 102 | 41 | 83 | 56 | 124 | 5 | 12 |
| 51 | 1613 | 181 | 100 | 103 | 41 | 84 | 56 | 123 | 4 | 12 |
| 52 | 1637 | 184 | 102 | 105 | 41 | 84 | 56 | 123 | 4 | 12 |

**Dark Knight**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 1311 | 147 | 60 | 44 | 118 | 80 | 38 | 102 | 2 | 10 |
| 21 | 1366 | 150 | 62 | 45 | 118 | 80 | 38 | 102 | 2 | 10 |
| 22 | 1422 | 152 | 64 | 47 | 120 | 81 | 38 | 102 | 2 | 10 |
| 23 | 1477 | 155 | 65 | 47 | 119 | 80 | 38 | 102 | 2 | 10 |
| 24 | 1533 | 158 | 69 | 49 | 121 | 82 | 38 | 102 | 2 | 10 |
| 25 | 1588 | 161 | 71 | 50 | 122 | 82 | 38 | 102 | 2 | 10 |
| 26 | 1643 | 164 | 72 | 52 | 123 | 83 | 38 | 102 | 2 | 10 |
| 27 | 1698 | 167 | 75 | 52 | 123 | 84 | 38 | 102 | 2 | 10 |
| 28 | 1753 | 169 | 76 | 54 | 124 | 84 | 38 | 102 | 2 | 10 |
| 29 | 1807 | 172 | 78 | 55 | 125 | 84 | 38 | 102 | 2 | 10 |
| 30 | 1862 | 176 | 80 | 56 | 126 | 86 | 39 | 103 | 3 | 11 |
| 43 | 2562 | 211 | 103 | 70 | 134 | 91 | 40 | 104 | 3 | 11 |
| 44 | 2615 | 213 | 105 | 71 | 135 | 93 | 40 | 104 | 3 | 11 |
| 45 | 2668 | 216 | 107 | 72 | 136 | 93 | 40 | 104 | 3 | 11 |
| 46 | 2721 | 219 | 108 | 73 | 136 | 93 | 40 | 103 | 3 | 11 |
| 47 | 2773 | 221 | 110 | 74 | 137 | 94 | 40 | 103 | 3 | 11 |
| 48 | 2826 | 224 | 112 | 75 | 137 | 94 | 40 | 103 | 3 | 11 |
| 49 | 2878 | 226 | 114 | 76 | 138 | 94 | 40 | 103 | 3 | 11 |
| 50 | 2931 | 229 | 116 | 77 | 139 | 96 | 41 | 104 | 4 | 12 |
| 51 | 2983 | 232 | 117 | 78 | 139 | 95 | 41 | 104 | 4 | 12 |
| 52 | 3035 | 234 | 118 | 79 | 140 | 96 | 41 | 104 | 4 | 12 |

**Samurai**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 808 | 68 | 55 | 38 | 38 | 45 | 56 | 105 | 12 | 14 |
| 21 | 843 | 70 | 57 | 39 | 38 | 46 | 56 | 105 | 12 | 14 |
| 22 | 878 | 73 | 59 | 39 | 38 | 46 | 56 | 105 | 12 | 14 |
| 23 | 913 | 75 | 61 | 40 | 38 | 46 | 56 | 105 | 12 | 14 |
| 24 | 947 | 77 | 62 | 41 | 39 | 47 | 56 | 105 | 12 | 14 |
| 25 | 982 | 80 | 64 | 42 | 40 | 48 | 56 | 105 | 12 | 14 |
| 26 | 1016 | 82 | 66 | 43 | 40 | 47 | 56 | 105 | 12 | 14 |
| 27 | 1050 | 84 | 68 | 44 | 40 | 48 | 56 | 105 | 12 | 14 |
| 28 | 1084 | 86 | 69 | 45 | 40 | 48 | 56 | 105 | 12 | 14 |
| 29 | 1117 | 89 | 71 | 46 | 40 | 48 | 56 | 105 | 12 | 14 |
| 30 | 1151 | 91 | 74 | 48 | 41 | 50 | 57 | 106 | 13 | 15 |
| 43 | 1573 | 119 | 96 | 59 | 44 | 55 | 58 | 107 | 13 | 15 |
| 44 | 1605 | 122 | 97 | 58 | 44 | 54 | 58 | 107 | 13 | 15 |
| 45 | 1636 | 124 | 99 | 60 | 45 | 56 | 58 | 107 | 13 | 15 |
| 46 | 1667 | 126 | 100 | 61 | 45 | 56 | 58 | 107 | 13 | 15 |
| 47 | 1698 | 128 | 102 | 61 | 45 | 56 | 58 | 107 | 13 | 15 |
| 48 | 1729 | 130 | 103 | 63 | 46 | 57 | 57 | 107 | 13 | 15 |
| 49 | 1760 | 132 | 105 | 63 | 46 | 57 | 57 | 107 | 13 | 15 |
| 50 | 1791 | 135 | 107 | 64 | 47 | 58 | 58 | 108 | 14 | 16 |
| 51 | 1821 | 136 | 109 | 65 | 47 | 58 | 58 | 108 | 14 | 16 |
| 52 | 1851 | 138 | 110 | 66 | 47 | 58 | 58 | 108 | 14 | 16 |

**Berserker**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 1393 | 44 | 59 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 21 | 1455 | 45 | 61 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 22 | 1517 | 47 | 63 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 23 | 1579 | 48 | 64 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 24 | 1640 | 50 | 66 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 25 | 1701 | 51 | 69 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 26 | 1762 | 52 | 70 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 27 | 1823 | 54 | 72 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 28 | 1883 | 55 | 73 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 29 | 1943 | 56 | 75 | 3 | 26 | 3 | 61 | 104 | 15 | 13 |
| 30 | 2003 | 58 | 78 | 4 | 28 | 4 | 62 | 105 | 16 | 14 |
| 43 | 2767 | 73 | 100 | 4 | 28 | 4 | 64 | 106 | 17 | 14 |
| 44 | 2824 | 75 | 101 | 4 | 28 | 4 | 64 | 105 | 17 | 14 |
| 45 | 2881 | 76 | 104 | 4 | 28 | 4 | 64 | 105 | 17 | 14 |
| 46 | 2938 | 77 | 105 | 4 | 28 | 4 | 64 | 105 | 17 | 14 |
| 47 | 3995 | 78 | 106 | 4 | 28 | 4 | 64 | 105 | 17 | 14 |
| 48 | 3051 | 79 | 107 | 4 | 28 | 4 | 64 | 105 | 17 | 14 |
| 49 | 3107 | 80 | 109 | 4 | 28 | 4 | 63 | 105 | 17 | 14 |
| 50 | 3163 | 82 | 112 | 5 | 29 | 5 | 64 | 106 | 18 | 15 |
| 51 | 3219 | 82 | 113 | 5 | 29 | 5 | 64 | 106 | 17 | 15 |
| 52 | 3275 | 84 | 114 | 5 | 29 | 5 | 64 | 106 | 17 | 15 |

**Alchemist**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 788 | 42 | 44 | 12 | 26 | 10 | 52 | 119 | 3 | 11 |
| 21 | 820 | 43 | 44 | 12 | 26 | 10 | 52 | 119 | 3 | 11 |
| 22 | 853 | 45 | 46 | 13 | 26 | 10 | 52 | 119 | 3 | 11 |
| 23 | 885 | 46 | 47 | 13 | 27 | 11 | 52 | 120 | 3 | 11 |
| 24 | 917 | 47 | 49 | 14 | 28 | 11 | 52 | 120 | 3 | 11 |
| 25 | 948 | 48 | 50 | 14 | 29 | 12 | 52 | 120 | 3 | 11 |
| 26 | 980 | 50 | 51 | 15 | 30 | 12 | 52 | 120 | 3 | 11 |
| 27 | 1011 | 51 | 53 | 15 | 29 | 12 | 52 | 120 | 3 | 11 |
| 28 | 1041 | 52 | 54 | 15 | 30 | 13 | 52 | 120 | 3 | 11 |
| 29 | 1072 | 53 | 55 | 15 | 31 | 13 | 52 | 120 | 3 | 11 |
| 30 | 1102 | 54 | 57 | 17 | 32 | 14 | 53 | 121 | 4 | 12 |
| 43 | 1471 | 68 | 73 | 20 | 39 | 18 | 55 | 121 | 4 | 12 |
| 44 | 1498 | 70 | 74 | 21 | 38 | 18 | 55 | 121 | 4 | 12 |
| 45 | 1524 | 70 | 76 | 21 | 39 | 19 | 55 | 121 | 4 | 12 |
| 46 | 1550 | 72 | 76 | 22 | 40 | 19 | 54 | 122 | 4 | 12 |
| 47 | 1576 | 72 | 78 | 21 | 39 | 19 | 54 | 122 | 4 | 12 |
| 48 | 1601 | 73 | 78 | 22 | 41 | 20 | 54 | 122 | 4 | 12 |
| 49 | 1627 | 74 | 80 | 22 | 41 | 20 | 54 | 122 | 4 | 12 |
| 50 | 1652 | 75 | 81 | 23 | 42 | 21 | 55 | 123 | 4 | 13 |
| 51 | 1676 | 76 | 82 | 22 | 42 | 21 | 55 | 123 | 4 | 13 |
| 52 | 1701 | 77 | 83 | 23 | 42 | 21 | 55 | 123 | 4 | 13 |

**Lady Luck**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 726 | 104 | 36 | 37 | 26 | 43 | 55 | 123 | 5 | 24 |
| 21 | 755 | 106 | 37 | 38 | 26 | 43 | 55 | 123 | 5 | 24 |
| 22 | 785 | 109 | 38 | 38 | 26 | 43 | 55 | 123 | 5 | 24 |
| 23 | 814 | 112 | 39 | 39 | 26 | 43 | 55 | 123 | 5 | 24 |
| 24 | 843 | 115 | 41 | 40 | 26 | 44 | 55 | 123 | 5 | 25 |
| 25 | 871 | 118 | 42 | 41 | 26 | 44 | 55 | 123 | 5 | 25 |
| 26 | 900 | 121 | 43 | 42 | 26 | 44 | 55 | 123 | 5 | 25 |
| 27 | 928 | 124 | 44 | 43 | 26 | 45 | 55 | 123 | 5 | 26 |
| 28 | 956 | 127 | 45 | 44 | 26 | 45 | 55 | 123 | 5 | 26 |
| 29 | 983 | 130 | 46 | 45 | 26 | 45 | 55 | 123 | 5 | 26 |
| 30 | 1011 | 133 | 48 | 47 | 27 | 46 | 56 | 124 | 6 | 27 |
| 43 | 1342 | 169 | 63 | 59 | 27 | 48 | 57 | 125 | 6 | 29 |
| 44 | 1366 | 172 | 65 | 59 | 27 | 49 | 57 | 124 | 6 | 30 |
| 45 | 1390 | 174 | 66 | 60 | 27 | 49 | 57 | 124 | 6 | 30 |
| 46 | 1413 | 177 | 66 | 61 | 27 | 49 | 57 | 124 | 6 | 30 |
| 47 | 1436 | 180 | 68 | 62 | 27 | 50 | 57 | 124 | 6 | 31 |
| 48 | 1458 | 180 | 69 | 63 | 27 | 50 | 57 | 124 | 6 | 31 |
| 49 | 1481 | 185 | 70 | 63 | 27 | 50 | 57 | 124 | 6 | 31 |
| 50 | 1503 | 188 | 72 | 65 | 28 | 51 | 58 | 125 | 7 | 32 |
| 51 | 1525 | 190 | 73 | 66 | 28 | 51 | 58 | 125 | 7 | 32 |
| 52 | 1546 | 193 | 74 | 67 | 28 | 51 | 58 | 125 | 7 | 32 |

**Mascot**

| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 1651 | 211 | 56 | 68 | 135 | 117 | 58 | 123 | 13 | 17 |
| 21 | 1726 | 216 | 57 | 70 | 135 | 117 | 58 | 123 | 13 | 17 |
| 22 | 1800 | 222 | 58 | 71 | 135 | 117 | 58 | 123 | 13 | 17 |
| 23 | 1875 | 227 | 60 | 73 | 135 | 117 | 58 | 123 | 13 | 17 |
| 24 | 1949 | 233 | 62 | 75 | 135 | 118 | 58 | 123 | 13 | 17 |
| 25 | 2022 | 238 | 64 | 77 | 136 | 117 | 59 | 123 | 13 | 17 |
| 26 | 2096 | 243 | 65 | 78 | 136 | 118 | 59 | 123 | 13 | 17 |
| 27 | 2169 | 248 | 66 | 80 | 136 | 119 | 59 | 123 | 13 | 17 |
| 28 | 2241 | 253 | 68 | 81 | 136 | 119 | 59 | 123 | 13 | 17 |
| 29 | 2314 | 259 | 70 | 83 | 136 | 119 | 59 | 123 | 13 | 17 |
| 30 | 2386 | 264 | 72 | 84 | 137 | 120 | 60 | 124 | 15 | 18 |
| 43 | 3298 | 329 | 92 | 103 | 139 | 122 | 61 | 126 | 15 | 18 |
| 44 | 3366 | 335 | 93 | 104 | 138 | 123 | 61 | 126 | 15 | 18 |
| 45 | 3433 | 340 | 95 | 105 | 139 | 123 | 62 | 126 | 16 | 18 |
| 46 | 3501 | 344 | 96 | 107 | 139 | 123 | 62 | 126 | 16 | 18 |
| 47 | 3568 | 349 | 97 | 108 | 139 | 124 | 62 | 126 | 16 | 18 |
| 48 | 3635 | 354 | 99 | 110 | 139 | 124 | 62 | 126 | 16 | 18 |
| 49 | 3701 | 359 | 100 | 111 | 139 | 124 | 61 | 126 | 16 | 18 |
| 50 | 3767 | 364 | 102 | 112 | 140 | 124 | 62 | 127 | 17 | 19 |
| 51 | 3833 | 368 | 104 | 113 | 140 | 124 | 62 | 127 | 17 | 18 |
| 52 | 3899 | 373 | 105 | 114 | 140 | 125 | 63 | 127 | 17 | 18 |


**Trainer** — the FF Wiki's Trainer page carries no per-level table. All three girls share the HP/MP curve noted in §3.13 (131→3,239 HP, 34→214 MP) with different combat stats; use the Trainer growth algorithm in §5.1a. **Mascot** — the table above is the published Mascot curve; Rikku's and Paine's variants differ slightly because their borrowed skillsets differ (see §5.1). `[single source]`

### 5.2 Stat tables — all standard dresspheres at Lv 1 / 30 / 35 / 45 / 50 / 99

Columns: **HP · MP · Str · Mag · Def · MDef · Agi · Acc · Eva · Luck**. All values `[verified: 2 sources]` (FF Wiki tables reproduce SinirothX's algorithms).

**Gunner**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 121 | 19 | 13 | 10 | 12 | 12 | 50 | 120 | 2 | 11 |
| 30 | 1211 | 66 | 60 | 31 | 36 | 36 | 54 | 124 | 5 | 17 |
| 35 | 1374 | 72 | 67 | 34 | 39 | 39 | 54 | 124 | 4 | 18 |
| 45 | 1680 | 84 | 81 | 40 | 45 | 45 | 55 | 126 | 5 | 19 |
| 50 | 1822 | 90 | 87 | 44 | 47 | 47 | 56 | 127 | 5 | 20 |
| 99 | 2837 | 123 | 137 | 73 | 58 | 58 | 57 | 131 | 4 | 24 |

**Thief**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 114 | 35 | 8 | 11 | 7 | 36 | 57 | 107 | 15 | 22 |
| 30 | 1267 | 92 | 53 | 43 | 32 | 62 | 62 | 112 | 21 | 28 |
| 35 | 1443 | 100 | 60 | 47 | 35 | 65 | 62 | 112 | 22 | 29 |
| 45 | 1773 | 116 | 72 | 56 | 42 | 72 | 63 | 113 | 23 | 31 |
| 50 | 1928 | 123 | 78 | 62 | 45 | 76 | 64 | 114 | 24 | 31 |
| 99 | 3084 | 170 | 121 | 96 | 68 | 95 | 67 | 117 | 29 | 37 |

**Warrior**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 149 | 18 | 16 | 12 | 75 | 4 | 48 | 100 | 3 | 10 |
| 30 | 1434 | 76 | 75 | 29 | 104 | 10 | 51 | 103 | 6 | 13 |
| 35 | 1647 | 85 | 84 | 31 | 108 | 10 | 51 | 103 | 6 | 13 |
| 45 | 2063 | 102 | 101 | 36 | 115 | 11 | 52 | 103 | 6 | 13 |
| 50 | 2267 | 110 | 109 | 38 | 117 | 12 | 53 | 104 | 7 | 14 |
| 99 | 4122 | 168 | 168 | 56 | 132 | 13 | 54 | 103 | 6 | 13 |

**Black Mage**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 100 | 52 | 4 | 34 | 3 | 108 | 49 | 97 | 2 | 8 |
| 30 | 837 | 169 | 10 | 84 | 9 | 132 | 52 | 100 | 5 | 11 |
| 35 | 955 | 188 | 11 | 91 | 10 | 135 | 52 | 100 | 5 | 11 |
| 45 | 1184 | 224 | 13 | 106 | 12 | 142 | 53 | 101 | 5 | 11 |
| 50 | 1294 | 242 | 13 | 112 | 12 | 146 | 53 | 101 | 6 | 12 |
| 99 | 2239 | 400 | 19 | 164 | 18 | 178 | 54 | 102 | 5 | 12 |

**White Mage**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 103 | 47 | 5 | 29 | 8 | 111 | 50 | 98 | 3 | 8 |
| 30 | 865 | 154 | 11 | 80 | 14 | 138 | 53 | 101 | 6 | 11 |
| 35 | 986 | 170 | 12 | 87 | 15 | 142 | 53 | 101 | 6 | 11 |
| 45 | 1221 | 203 | 14 | 101 | 16 | 150 | 54 | 102 | 6 | 11 |
| 50 | 1334 | 219 | 14 | 108 | 17 | 155 | 54 | 102 | 7 | 12 |
| 99 | 2294 | 350 | 20 | 154 | 21 | 194 | 55 | 103 | 7 | 12 |

**Gun Mage**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 108 | 41 | 16 | 29 | 9 | 45 | 51 | 118 | 1 | 8 |
| 30 | 1050 | 126 | 69 | 76 | 31 | 71 | 55 | 122 | 4 | 11 |
| 35 | 1193 | 139 | 77 | 82 | 33 | 74 | 55 | 122 | 4 | 11 |
| 45 | 1462 | 166 | 92 | 96 | 38 | 81 | 56 | 123 | 4 | 11 |
| 50 | 1588 | 179 | 99 | 102 | 41 | 83 | 56 | 124 | 5 | 12 |
| 99 | 2523 | 288 | 152 | 149 | 51 | 97 | 59 | 127 | 4 | 11 |

**Dark Knight**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 231 | 88 | 18 | 17 | 98 | 65 | 36 | 100 | 0 | 8 |
| 30 | 1862 | 176 | 80 | 56 | 126 | 86 | 39 | 103 | 3 | 11 |
| 35 | 2133 | 190 | 89 | 62 | 130 | 88 | 39 | 103 | 3 | 11 |
| 45 | 2668 | 216 | 107 | 72 | 136 | 93 | 40 | 104 | 3 | 11 |
| 50 | 2931 | 229 | 116 | 77 | 139 | 96 | 41 | 104 | 4 | 12 |
| 99 | 5355 | 338 | 175 | 109 | 151 | 105 | 42 | 105 | 3 | 11 |

**Samurai**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 116 | 20 | 17 | 18 | 32 | 35 | 54 | 102 | 10 | 12 |
| 30 | 1151 | 91 | 74 | 48 | 41 | 50 | 57 | 106 | 13 | 15 |
| 35 | 1316 | 103 | 82 | 51 | 43 | 52 | 57 | 106 | 13 | 15 |
| 45 | 1636 | 124 | 99 | 60 | 45 | 56 | 58 | 107 | 13 | 15 |
| 50 | 1791 | 135 | 107 | 64 | 47 | 58 | 58 | 108 | 14 | 16 |
| 99 | 3104 | 221 | 171 | 100 | 57 | 72 | 59 | 109 | 13 | 15 |

**Berserker**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 179 | 15 | 18 | 1 | 24 | 1 | 58 | 102 | 13 | 11 |
| 30 | 2003 | 58 | 78 | 4 | 28 | 4 | 62 | 105 | 16 | 14 |
| 35 | 2301 | 64 | 87 | 4 | 28 | 4 | 62 | 105 | 16 | 14 |
| 45 | 2881 | 76 | 104 | 4 | 28 | 4 | 64 | 105 | 17 | 14 |
| 50 | 3163 | 82 | 112 | 5 | 29 | 5 | 64 | 106 | 18 | 15 |
| 99 | 5667 | 123 | 166 | 4 | 30 | 5 | 68 | 107 | 19 | 15 |

**Alchemist**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 118 | 15 | 14 | 3 | 11 | 2 | 50 | 117 | 1 | 9 |
| 30 | 1102 | 54 | 57 | 17 | 32 | 14 | 53 | 121 | 4 | 12 |
| 35 | 1249 | 60 | 64 | 18 | 34 | 16 | 54 | 121 | 4 | 12 |
| 45 | 1524 | 70 | 76 | 21 | 39 | 19 | 55 | 121 | 4 | 12 |
| 50 | 1652 | 75 | 81 | 23 | 42 | 21 | 55 | 123 | 4 | 13 |
| 99 | 2553 | 107 | 125 | 29 | 52 | 35 | 58 | 124 | 4 | 12 |

**Songstress**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 86 | 39 | 3 | 18 | 3 | 33 | 51 | 96 | 8 | 7 |
| 30 | 850 | 126 | 9 | 59 | 9 | 45 | 57 | 99 | 11 | 10 |
| 35 | 972 | 139 | 10 | 65 | 10 | 47 | 57 | 99 | 11 | 10 |
| 45 | 1209 | 164 | 11 | 77 | 11 | 50 | 58 | 99 | 11 | 10 |
| 50 | 1323 | 176 | 12 | 84 | 12 | 52 | 59 | 100 | 12 | 11 |
| 99 | 2301 | 263 | 17 | 130 | 16 | 67 | 60 | 100 | 10 | 11 |

**Lady Luck**
| Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 112 | 43 | 11 | 16 | 24 | 37 | 52 | 120 | 3 | 18 |
| 30 | 1011 | 133 | 48 | 47 | 27 | 46 | 56 | 124 | 6 | 27 |
| 35 | 1143 | 147 | 54 | 51 | 27 | 47 | 56 | 123 | 6 | 28 |
| 45 | 1390 | 174 | 66 | 60 | 27 | 49 | 57 | 124 | 6 | 30 |
| 50 | 1503 | 188 | 72 | 65 | 28 | 51 | 58 | 125 | 7 | 32 |
| 99 | 2270 | 298 | 125 | 104 | 28 | 61 | 59 | 124 | 6 | 41 |

**Trainer — per girl** (HP/MP identical across the three: 1337/104 at Lv 30, 2028/143 at Lv 50, 3239/214 at Lv 99)

| Girl | Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Yuna (Kogoro) | 30 | 1337 | 104 | 69 | 41 | 48 | 29 | 51 | 104 | 7 | 10 |
| Yuna | 45 | 1866 | 134 | 92 | 52 | 55 | 34 | 53 | 105 | 7 | 10 |
| Yuna | 50 | 2028 | 143 | 99 | 55 | 57 | 35 | 53 | 106 | 8 | 11 |
| Rikku (Ghiki) | 30 | 1337 | 104 | 58 | 47 | 32 | 33 | 57 | 105 | 8 | 10 |
| Rikku | 45 | 1866 | 134 | 79 | 60 | 39 | 38 | 59 | 107 | 8 | 10 |
| Rikku | 50 | 2028 | 143 | 85 | 64 | 42 | 40 | 60 | 108 | 9 | 11 |
| Paine (Flurry) | 30 | 1337 | 104 | 66 | 48 | 47 | 30 | 55 | 108 | 7 | 14 |
| Paine | 45 | 1866 | 134 | 89 | 60 | 52 | 35 | 56 | 110 | 7 | 14 |
| Paine | 50 | 2028 | 143 | 96 | 63 | 54 | 38 | 57 | 110 | 8 | 15 |

**Mascot — per girl** (Chapter 5 only; note the enormous Def/MDef)

| Girl | Lv | HP | MP | Str | Mag | Def | MDef | Agi | Acc | Eva | Luck |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Yuna | 30 | 2386 | 264 | 72 | 84 | 137 | 120 | 60 | 124 | 15 | 18 |
| Yuna | 45 | 3433 | 340 | 95 | 105 | 139 | 123 | 62 | 126 | 16 | 18 |
| Yuna | 50 | 3767 | 364 | 102 | 112 | 140 | 124 | 62 | 127 | 17 | 19 |
| Yuna | 99 | 6647 | 572 | 163 | 149 | 143 | 130 | 66 | 130 | 19 | 18 |
| Rikku | 30 | 2383 | 268 | 69 | 88 | 136 | 128 | 59 | 122 | 15 | 17 |
| Rikku | 45 | 3418 | 344 | 91 | 109 | 139 | 133 | 61 | 124 | 16 | 17 |
| Rikku | 50 | 3748 | 369 | 98 | 116 | 139 | 134 | 62 | 125 | 17 | 18 |
| Rikku | 99 | 6594 | 582 | 155 | 156 | 141 | 143 | 66 | 128 | 19 | 17 |
| Paine | 30 | 2342 | 240 | 76 | 70 | 134 | 118 | 56 | 128 | 10 | 18 |
| Paine | 45 | 3366 | 301 | 100 | 89 | 137 | 121 | 58 | 130 | 11 | 18 |
| Paine | 50 | 3693 | 320 | 108 | 96 | 138 | 123 | 59 | 132 | 11 | 19 |
| Paine | 99 | 6521 | 426 | 172 | 137 | 140 | 130 | 63 | 137 | 12 | 19 |

**Special dresspheres** have no published per-level table — their stats are derived at transformation time from the number of nodes on the Garment Grid (see §3.15). `[single source]` Qualitatively `[single source: Split Infinity G1322–G1324]`:

| SDSP | Main part strengths | Main part weaknesses |
|---|---|---|
| Floral Fallal (Yuna) | HP, MP, Str, Mag, MDef | Def, Agi, Acc, Eva, Luck |
| Machina Maw (Rikku) | HP, MP, Str, Def, Mag, Acc | MDef, Agi, Eva, Luck |
| Full Throttle (Paine) | HP, Str, Def, Mag, Agi, Acc | MP, MDef, Eva, Luck |

### 5.3 Quick-reference: dressphere roles at a glance

| Dressphere | Strong at | Weak at | Range | Notes |
|---|---|---|---|---|
| Gunner | Str, Agi, Acc | MP, Def, Mag, MDef, Eva, Luck | long | zero charge times |
| Thief | HP, Str, Agi, Luck, **Eva (best)** | MP, Def, Mag, MDef | short | Attack hits twice |
| Warrior | HP, Str, Def, Agi | MP, Mag, **MDef (worst)**, Eva, Luck | short | Break skills |
| Songstress | MP, Mag, Agi | HP, Def, MDef, Eva, Luck; **no Attack** | — | sustained auras |
| White Mage | MP, Mag, MDef, Agi | HP, Def, Eva, Luck; **no Attack** | — | healing |
| Black Mage | MP, Mag, MDef, Agi | HP, Def, Eva, Luck; **no Attack** | — | elemental nukes |
| Gun Mage | MP, Str, Mag, Agi, Acc | HP, Def, MDef, Eva, Luck | long | ×4 vs species |
| Alchemist | Str, Agi, Acc | everything else | long | free items, Mix |
| Lady Luck | MP, Str, Agi, Acc, **Luck (best)** | HP, Def, MDef, Eva | long | reels, Bribe, double drops |
| Berserker | HP, Str, **Agi (best)** | MP, Def, Mag, MDef, Eva, Luck | short | counters |
| Dark Knight | HP, MP, Str, Def | Mag, MDef, **Agi (worst)**, Acc, Eva, Luck | short/long | Darkness ignores Def |
| Samurai | HP, Str, Agi | MP, Def, Mag, MDef, Eva, Luck | mixed | instant death, gil damage |
| Trainer | HP, Str, Agi | MP, Def, Mag, MDef, Eva, Luck | long | Half MP Cost |
| **Mascot** | HP, MP, Str, Def, Mag, MDef, Agi, Acc | Eva, Luck | short | Ribbon, best overall |

### 5.4 Accessories — realistic mid- and late-game loadouts

Two accessory slots per girl, hard limit. `C`/`U`/`R` = common / uncommon / rare (bronze / silver / gold wrist icon in the menu). `[verified: 2 sources]`

**Statistic accessories (no auto-abilities)**

| Accessory | Effect | Sell / Buy | Rarity | Where |
|---|---|---|---|---|
| Amulet | `MAG +10` | 250 / 1000 | C | Calm Lands shop Ch.1–2 |
| Wristband | `STR +10` | 250 / 1000 | C | Calm Lands shop Ch.1–2 |
| Mythril Gloves | `DEF +20` | 250 / 1000 | C | Zanarkand shop Ch.1 |
| Defense Veil | `MDEF +20` | 250 / 1000 | C | Zanarkand shop Ch.1–2 |
| Iron Bangle | `max HP +20%` | 125 / 500 | C | Mi'ihen Ch.1 |
| Gauntlets | `STR +5, DEF +5` | 625 / 2500 | C | Mi'ihen shop Ch.1–2 |
| Tiara | `MAG +5, MDEF +5` | 625 / 2500 | C | Mi'ihen shop Ch.1–2 |
| **Titanium Bangle** | `max HP +40%` | 750 / 3000 | C | Calm Lands & Mi'ihen shops Ch.3 & 5; Gunner's Gauntlet prize |
| **Mythril Bangle** | `max HP +60%` | 1500 / — | C | Youth League HQ Ch.2; blitzball; Sand Worm |
| **Crystal Bangle** | `max HP +100%` | 2000 / — | U | Youth League HQ Ch.5; Machina Panzer; blitzball |
| Silver Bracer | `max MP +40%` | 1000 / 4000 | C | Mi'ihen & Macalania Ch.2 |
| Gold Bracer | `max MP +60%` | 1000 / 4000 | C | Macalania woods Ch.3 |
| Rune Bracer | `max MP +100%` | 1500 / — | U | Macalania Ch.5; Ruin Depths; Ultima Weapon |
| Muscle Belt | `STR +10, DEF +10` | 1000 / 4000 | C | Mi'ihen Ch.2 |
| Circlet | `MAG +10, MDEF +10` | 1000 / 4000 | C | Mi'ihen Ch.1; Mi'ihen shop Ch.3 & 5 |
| Power Wrist | `STR +20` | 1500 / 6000 | C | Calm Lands shop Ch.3 & 5 |
| Tarot Card | `MAG +20` | 1500 / 6000 | C | Calm Lands shop Ch.3 & 5 |
| Diamond Gloves | `DEF +40` | 1500 / 6000 | C | Zanarkand shop Ch.3 |
| Mystery Veil | `MDEF +40` | 1500 / 6000 | C | Zanarkand shop Ch.3 |
| Black Belt | `STR +20, DEF +20` | 2000 / — | C | Mi'ihen & Thunder Plains Ch.5 |
| Hyper Wrist | `STR +30` | 2000 / — | C | Djose & Thunder Plains Ch.5 |
| Talisman | `MAG +30` | 2000 / — | C | Thunder Plains Ch.5 |
| Hypno Crown | `MAG +20, MDEF +20` | 2000 / — | C | bribe Behemoth / Flan Blanco |
| Oath Veil | `MDEF +60` | 2000 / — | U | Bevelle Ch.3 |
| Crystal Gloves | `DEF +60` | 2000 / — | U | Bevelle Ch.5 |
| Power Gloves | `STR +40` | 2500 / — | C | Thunder Plains Ch.5 |
| Pixie Dust | `MAG +40` | 2500 / — | C | Thunder Plains Ch.5 |
| Champion Belt | `STR +40, DEF +40` | 2500 / — | U | King VERMIN!, bribe Gigas |
| Regal Crown | `MAG +40, MDEF +40` | 2500 / — | U | bribe Mushroom Cloud |
| Kaiser Knuckles | `STR +50` | 3000 / — | U | Guadosalam Ch.5 |
| Crystal Ball | `MAG +50` | 3000 / — | U | Guadosalam Ch.5; Chac |
| **Rabite's Foot** | `LUCK +100` | 10 / — | **R** | Jumbo Cactuar only |

**Status / ability / special accessories worth naming**

| Accessory | Effect | Rarity | Notes |
|---|---|---|---|
| **Beaded Brooch** | `DEF +8, MDEF +8`, **Sense Preserver** | U | Kilika shop Ch.3 & 5 — cheap, always available |
| Glass Buckle | `DEF +8, MDEF +8`, Health Preserver | U | Kilika shop Ch.3 & 5 |
| Faerie Earrings | `DEF +8, MDEF +8`, Sanity Preserver | U | Gunner's Gauntlet prize |
| Kinesis Badge | `DEF +8, MDEF +8`, Time Preserver | U | Guadosalam shop Ch.1–2 |
| Safety Bit | `DEF +12, MDEF +12`, Life Preserver | U | Ultima Weapon; Thunder Plains Ch.3 |
| Angel Earrings | `DEF +5, MDEF +5`, **Deathproof** | C | Guadosalam shop |
| Star Pendant | `DEF +4, MDEF +4`, Poisonproof | C | Celsius shop, all chapters |
| White Cape | `DEF +4, MDEF +4`, Silenceproof | C | Celsius shop |
| Silver Glasses | `DEF +4, MDEF +4`, Darkproof | C | Celsius shop |
| Twist Headband | `DEF +4, MDEF +4`, Sleepproof | C | Celsius shop |
| Gold Anklet | `DEF +4, MDEF +4`, Stoneproof | C | Guadosalam shop |
| Gris-Gris Bag | `DEF +4, MDEF +4`, **Curseproof** | C | Guadosalam Ch.3 |
| Favorite Outfit | `EVA +10, LUCK +10`, **Itchproof** | C | Guadosalam shop Ch.3 & 5 |
| Pearl Necklace | `DEF +4, MDEF +4`, Pointlessproof | C | Guadosalam shop |
| Dragonfly Orb | `DEF +4, MDEF +4`, Stopproof | C | Bikanel shop Ch.3 & 5 |
| Pretty Orb | `DEF +4, MDEF +4`, Slowproof | C | Bikanel shop Ch.3 & 5 |
| Moon Bracer | no stats, **Auto-Shell** | U | Besaid Ch.3; blitzball |
| Shining Bracer | no stats, **Auto-Protect** | U | Mushroom Rock Ch.2; blitzball |
| Recovery Bracer | no stats, **Auto-Regen** | U | Cavern of the Stolen Fayth Ch.3 |
| Star Bracer | no stats, **Auto-Reflect** | U | bribe Oversouled Barbuta; Calm Lands Ch.3 |
| Wall Ring | no stats, **SOS Wall** | C | Besaid Ch.2; Kilika Ch.5 |
| Defense Bracer | no stats, **Auto-Wall** | U | bribe Oversouled Adamantoise / Ultima Weapon |
| **Speed Bracer** | no stats, **Auto-Haste** + innate Hastega | **R** | Oversouled Lacerta only |
| Sprint Shoes | `AGL +10`, **First Strike** + innate Haste | U | Calm Lands Ch.3; blitzball |
| Haste Bangle | no stats, **SOS Haste** | U | bribe Oversouled Canis Major / Archaeothyris |
| Gold Hairpin | `MAG +20`, **Half MP Cost** | U | Ch.2, please Leblanc on the first attempt |
| Soul of Thamasa | `MAG +15`, **Magic Booster** (magic ×1.5, MP cost ×2) | U | Zanarkand monkey sidequest |
| Arcane / Black / White / Bushido / Nature's / Sword **Lore** | `MAG +12` or `STR +12`, grants that **skillset command** | U | bribe specific fiends; 50,000 gil each to buy |
| Arcane / Black / White / Bushido / Nature's / Sword **Tome** | `max HP or MP +10%`, `AGL +5`, **Turbo <skillset>** (−40% charge) | U | bribe specific fiends |
| Cat's Bell | `max HP +15%`, HP Stroll | C | Kilika temple Ch.5 |
| Wizard Bracelet | `max MP +20%`, MP Stroll | C | Kilika temple Ch.5 |
| Charm Bangle | `LUCK +10`, **No Encounters** | U | Open Air Inc. at Lv1 publicity |
| Lure Bracer | `STR +15`, More Encounters | U | Leblanc Syndicate drop Ch.2 |
| AP Egg | `LUCK +15`, **Triple AP** | **R** | blitzball prize; Ruin Depths Ch.5 |
| **Bloodlust** | `STR +60, MAG −50, MDEF −50, max HP −40%, max MP −40%`, Kijo's Soul, **Auto-Poison**, **Auto-Berserk** | **R** | Bevelle Gaol, Ch.2/3/5 |
| Wring | `DEF −20, MAG +80, max HP −40%`, Majo's Soul, S-Turbo Black Magic, Auto-Poison, Auto-Haste | **R** | Bevelle Gaol |
| Minerva's Plate | `STR −80, MAG +100, max MP +100%`, Turbo Black Magic, **Auto-Pointless** | **R** | Ch.2 Moonflow/Macalania Hypello chain |
| **Adamantite** | `DEF +120, MDEF +120, AGL −30, max HP +100%`, Auto-Wall | **R** | 2800+ points in Gunner's Gauntlet — **only one copy exists in the entire game** |
| **Shmooth Shailing** | `DEF +30, MDEF +30`, **Super Ribbon**, Auto-Slow | **R** | 150+ points in the Ch.4 dance rehearsal |
| **Ribbon** | no stats, **Ribbon** | **R** | Bevelle restricted area (Ch.2/3/5); bribe Oversouled Flailing Ochu |
| **Invincible** | no stats, **Break Damage Limit** | **R** | Kilika cameraman chain, Ch.5 |
| **Enterprise** | no stats, **Break HP Limit** | **R** | Ch.2 Tobli lift ordering puzzle |
| **Ragnarok** | no stats, **Spellspring** (all MP free) | **R** | Ch.5, Mi'ihen Mystery blaming Rikku |
| **Force of Nature** | no stats, **Omnistrike** + Omni Eater | **R** | Ch.5, Thunder Plains hidden-hole maths puzzles |
| **Key to Success** | `LUCK +100, max HP +100%, max MP +100%`, **Double All** | **R** | Ch.5, Tobli's Guadosalam office chest |
| **Iron Duke** | `STR +100, DEF +100, MAG +100, MDEF +100, AGL +10, ACCU +100, EVA +100, LUCK +50, max HP +100%, max MP +100%` | **R** | **defeat Trema on floor 100 of Via Infinito** |
| **Cat Nip** | no stats, **SOS 9999-damage**. *HD/International also add Auto-Slow and Auto-Berserk.* | **R** | Via Infinito floor 40 boss (Black Elemental), Ch.5 |

**Realistic loadouts** `[estimate]`:
- **Chapter 3 boss**: Titanium Bangle or Mythril Bangle + Power Wrist / Tarot Card. Status-proof accessory swapped in against a known status boss (Angel Earrings vs Death, Twist Headband vs Sleep).
- **Chapter 5 boss**: Crystal Bangle + Kaiser Knuckles / Crystal Ball, or a *Lore* accessory to graft a second skillset onto a strong body, or Ribbon + Crystal Bangle for a status-heavy fight.
- **Ribbon and Iron Duke are genuinely rare** and should be treated as endgame trophies, not defaults. Iron Duke in particular requires clearing all 100 floors of Via Infinito.
- Watch the **penalty** accessories: Bloodlust, Wring, Minerva's Plate, Adamantite (AGL −30 is brutal in an ATB game), Shmooth Shailing (Auto-Slow), Cat Nip (HD: Auto-Berserk).

### 5.5 Items — complete effects table

`SGL` = single target, `GRP` = target party. `Menu` = usable outside battle. Sell / Buy in gil. All `[verified: 2 sources]` unless noted; damage ranges are the post-randomiser spread and are `[single source: Split Infinity §12]`.

**Recovery**

| Item | Scope | Menu | Sell/Buy | Effect |
|---|---|---|---|---|
| **Potion** | SGL | yes | 12 / 50 | recovers **200 HP** |
| **Hi-Potion** | SGL | yes | 125 / 500 | recovers **1000 HP** |
| **X-Potion** | SGL | yes | 250 / — | recovers up to **9999 HP** (full max HP if used in the menu) |
| **Mega-Potion** | GRP | yes | 375 / — | **2000 HP** to every party member |
| **Ether** | SGL | yes | 250 / — | recovers **100 MP** |
| **Turbo Ether** | SGL | yes | 750 / — | recovers **500 MP** |
| **Elixir** | SGL | yes | 1250 / — | up to **9999 HP and 999 MP** (full max in the menu) |
| **Megalixir** | GRP | yes | 5000 / — | up to 9999 HP and 999 MP to the whole party |
| **Phoenix Down** | SGL | yes | 25 / 100 | revive with **25% max HP** (cap 9999) |
| **Mega Phoenix** | GRP | yes | 1000 / — | revive up to **two** allies with **50% max HP** |
| Gysahl / Mimett / Pahsana / Sylkis Greens | SGL | no | 25 / — | chocobo food; also recovers **100 HP** |
| Healing Spring | SGL | no | 150 / — | **Regen** on the whole target party (~3% max HP per tick) |
| Stamina Tablet | SGL | no | 200 / — | one target's **max HP doubled** for the battle (does not stack) |
| Stamina Tonic | GRP | no | 400 / — | party's **max HP doubled** for the battle |
| Mana Tablet | SGL | no | 300 / — | one target's **max MP doubled** for the battle |
| Mana Tonic | GRP | no | 400 / — | party's **max MP doubled** for the battle |
| Twin Stars | SGL | no | 200 / — | one ally's **MP cost becomes 0** for the battle (Spellspring); also removes Darkness's HP cost |
| **Three Stars** | GRP | no | 1250 / — | **whole party's MP cost becomes 0** for the battle |

**Status cures and inflictors**

| Item | Scope | Menu | Sell/Buy | Effect |
|---|---|---|---|---|
| **Antidote** | SGL | yes | 12 / 50 | cures Poison |
| **Echo Screen** | SGL | yes | 12 / 50 | cures Silence |
| **Eye Drops** | SGL | yes | 12 / 50 | cures Darkness |
| **Soft** | SGL | yes | 12 / 50 | cures Petrification |
| **Holy Water** | SGL | yes | 75 / 300 | cures **Curse, Pointless, Itchy** |
| **Remedy** | SGL | yes | 375 / — | cures Berserk, Confuse, Curse, Darkness, Itchy, Petrification, Poison, Pointless, Silence, Sleep, Slow, Stop |
| **Dispel Tonic** | SGL | no | 70 / — | strips Regen, Protect, Shell, Reflect, Auto-Life, Haste, Spellspring |
| **Chocobo Feather** | SGL | no | 40 / — | **Haste** on one target (dispellable) |
| **Chocobo Wing** | GRP | no | 50 / — | **Haste** on the whole target party |
| **Silver Hourglass** | SGL | no | 25 / — | **Slow** on one target |
| **Gold Hourglass** | GRP | no | 37 / — | **Slow** on the whole target party |
| **Light Curtain** | GRP | no | 45 / — | **Protect** on the target party |
| **Lunar Curtain** | GRP | no | 45 / — | **Shell** on the target party |
| **Star Curtain** | GRP | no | 45 / — | **Reflect** on the target party |
| **Candle of Life** | SGL | no | 50 / — | inflicts **Doom** |
| **Farplane Shadow** | SGL | no | 75 / — | inflicts **KO** |
| **Hero Drink** | SGL | no | 25 / — | **Invincible** for a fixed time (cannot be dispelled) |

**Damage items.** Every one of these ignores the user's Str/Mag **and** the target's Def/MDef, and ignores Shell/Protect/Reflect/Armor Break/Mental Break — they are flat-constant attacks with the standard randomiser. Elemental ones are still subject to elemental affinity. All are capped at 9999 even with Break Damage Limit.

| Item | Scope | Element | Sell/Buy | Damage |
|---|---|---|---|---|
| Bomb Fragment | SGL | Fire | 25 / — | 75–84 |
| Antarctic Wind | SGL | Ice | 50 / — | 75–84 |
| Electro Marble | SGL | Lightning | 25 / — | 75–84 |
| Fish Scale | SGL | Water | 25 / — | 75–84 |
| Bomb Core | SGL | Fire | 50 / — | 281–317 |
| Arctic Wind | SGL | Ice | 50 / — | 281–317 |
| Lightning Marble | SGL | Lightning | 50 / — | 281–317 |
| **Dragon Scale** | SGL | Water | 50 / — | 281–317 |
| **Fire Gem** | GRP | Fire | 75 / — | **six** hits of 93–105, randomly distributed |
| Ice Gem | GRP | Ice | 75 / — | six hits of 93–105 |
| Lightning Gem | GRP | Lightning | 75 / — | six hits of 93–105 |
| Water Gem | GRP | Water | 75 / — | six hits of 93–105 |
| **Blessed Gem** | SGL | Holy | 125 / — | **eight** hits of 234–264 each — **chains hard** |
| Shining Gem | SGL | non-elem. | 75 / — | 1406–1587 |
| Supreme Gem | GRP | non-elem. | 250 / — | 2343–2646 to all |
| **Dark Matter** | GRP | non-elem. | 7500 / — | **9375–9999** to all |
| Shadow Gem | GRP | Gravity | 50 / — | removes **25% of current HP** from all |
| **Budget Grenade** | GRP | physical | 12 / — | 18–22, always **critical** |
| **Grenade** | GRP | physical | 25 / — | 187–212, always critical |
| **S-Bomb** | GRP | physical | 50 / — | 328–370, always critical |
| **M-Bomb** | GRP | physical | 75 / — | 375–423, always critical |
| **L-Bomb** | GRP | physical | 100 / — | 421–476, always critical |
| Dark Grenade | GRP | physical | 37 / — | 234–264 critical + **Darkness** |
| Silence Grenade | GRP | physical | 37 / — | 234–264 critical + **Silence** |
| Sleep Grenade | GRP | physical | 50 / — | 234–264 critical + **Sleep** |
| Petrify Grenade | GRP | physical | 50 / — | 234–264 critical + **Petrification** |
| Poison Fang | SGL | special | 25 / — | 375–423 unblockable + **Poison** |
| **Stamina Spring** | SGL | drain | 75 / — | absorbs **562–635 HP** to the user |
| **Mana Spring** | SGL | drain | 75 / — | absorbs **187–211 MP** to the user |
| **Soul Spring** | SGL | drain | 100 / — | absorbs **937–1058 HP and up to 1058 MP**; one of the few item-named effects that **can** break the 9999 cap via Mix |

> Note: the prompt lists "Farplane Wind" — the FFX-2 item is **Farplane Shadow** (inflicts KO). "Dispel Tonic", "Dragon Scale", "Fire Gem", "Gold Hourglass", "Silver Hourglass", "Star/Light/Lunar Curtain", "Budget Grenade / Grenade / S-Bomb / M-Bomb / L-Bomb", "Chocobo Feather / Wing" all exist as listed. `[verified: 2 sources]`
> There are **68 regular items** and a long list of key items in the full game. `[single source]`

---

## 6. UI and flow facts implementers need

### 6.1 Battle HUD layout

| Element | Position | Contents | Confidence |
|---|---|---|---|
| **Help line** | top of screen | name of the currently targeted unit, plus small icons for every status on it | `[single source]` |
| **Mode indicator** | upper right | alternates between the words **"Active mode"** and **"Wait mode"** in real time | `[single source]` |
| **Main Command Window (MCW)** | lower left | the dressphere's top-level commands (Attack / Item / skillset / etc.) | `[single source]` |
| **Sub Command Window (SCW)** | lower left | reached by pressing **Right** from the MCW; contains **Escape** | `[single source]` |
| **ATB / character bars** | lower right | one row per girl: **name · current HP · current MP**, with her ATB gauge. Max HP/MP are only shown while she is targeted by a heal or an X-Potion. | `[single source]` |
| **Garment Grid overlay** | full screen, battle minimised to a window in the **upper right** | opened with **L1** on a girl's turn | `[single source]` |

**ATB gauge colour coding** `[verified: 2 sources]`:

| Colour | Meaning |
|---|---|
| Green | normal ATB fill |
| **Purple** | CTIM — the selected ability is charging |
| **Red** | **Haste** |
| **Gold** | **Slow** |
| **White** | **Stop** |

**HP / MP number colour coding** `[single source]`:

| Colour | HP meaning | MP meaning |
|---|---|---|
| White | ≥ 33% of max — "Fine" | ≥ 33% of max |
| **Yellow** | < 33% of max — **HP Critical**; the girl visibly **kneels**, acts more slowly, and takes longer to recover from hits. All `SOS ...` passives switch on here. | < 33% of max; unaffordable abilities are greyed out |
| **Red** | 0 — KO'd or otherwise incapacitated | 0 MP |

Greyed-out ability entries mean insufficient MP; selecting one plays an error sound `[single source]`.

**Status inspection trick**: targeting a girl with any status-affecting spell or item replaces the HP/MP row with a **white bar** showing icons for every status currently on her `[single source]`.

### 6.2 Damage number style

| Number | Meaning | Confidence |
|---|---|---|
| **White** | HP damage | `[verified: 2 sources]` |
| **Green** | HP recovery | `[verified: 2 sources]` |
| **White prefixed "MP"** | MP damage | `[single source]` |
| **Green prefixed "MP"** | MP recovery | `[single source]` |
| **"MISS"** | attack failed to connect | `[single source]` |
| **"IMMUNE"** | damage nullified by Null Physical / Null Magic / Invincible / fractional immunity | `[single source]` |

Numbers appear briefly above the target. For the HD-2D reimplementation, the FFX-2 look is a small pop-and-fade over the sprite, not FFX's larger drifting numerals.

### 6.3 The "Chain x N!" popup

- The text is literally `Chain x1!`, `Chain x2!`, `Chain x3!` … rendered over the target as it is being hit `[verified: 2 sources]`.
- It appears **only while a chain is live** (within the 2 s / 3 s window) — one popup per successful continuing hit.
- Both the party and the enemy party can trigger it.
- The counter runs to 99; the HD Remaster has a **"Full Chain"** trophy/achievement for reaching 99 `[single source]`.
- Implementation: attach the counter to the **target**, not the attacker. Reset on window expiry or target death.

### 6.4 Targeting feedback

On the battlefield, the current target gets a **white circle on the ground** beneath it plus a **yellow downward-pointing triangle** above it `[single source]`. Given the free-roaming positioning, this is load-bearing UI — implement both.

### 6.5 Enemy stance telegraphs

Enemies broadcast their next action through animation, and the game expects the player to read and react (e.g. throw a Silence Grenade at a charging caster) `[single source]`:

| Stance | Means |
|---|---|
| An aura surrounds the enemy | charging a **magic attack** |
| Odd fighting stance / movement speeds up | charging a **special physical attack** |
| Attack fires with no wind-up | ordinary physical attack |

This is the enemy-side equivalent of the purple CTIM bar and is the hook that makes Dismissal, Bully Ghiki, Delay Attack and Silence meaningful.

### 6.6 Spherechange animation flow

1. On a girl's full ATB turn, press **L1**.
2. The Garment Grid fills the screen; the live battle shrinks to a window in the upper right. (In Wait mode, time freezes here.)
3. Move the cursor to any dressphere **one link away** from the current one and press **X**.
4. The **transformation animation** plays — this is the signature FFX-2 sequence (pyreflies, costume change, pose). Meanwhile the ATB gauge has been consumed and begins refilling from zero.
5. If the traversed link had a **gate**, its temporary effect is applied on arrival and the line is redrawn **blue**.
6. Control returns; the girl now has the new dressphere's command set and stats.

**Special Dress Up variant**: when every node on the Grid has been visited (and every node is filled), pressing **L1** shows a Special Dress Up prompt — press **R1**, then **X**. The other two girls leave the field and a longer transformation plays; afterwards you are commanding three parts of one entity.

### 6.7 Victory / results screen

Order of presentation `[single source: Split Infinity G0917]`:

| Element | Position | Notes |
|---|---|---|
| Help line | top | — |
| **EXP** and **gil** for the battle | upper left | **EXP is not shared — each girl receives the full amount.** A girl who is KO'd, petrified, or has **Pointless** receives none. |
| **Items won** | below the EXP/gil lines | added straight to inventory; accessories can appear here |
| Per-girl EXP boxes | right half | portrait, name, **LV**, current EXP, EXP needed for the next level. **"LEVEL UP!!"** appears above the box when applicable. |
| Current total gil | below the boxes | — |
| Prompt | — | press **X** to return to the field |

#### AP award rates — decoded

**AP is awarded *during* battle, not on the results screen.** All AP earned by a girl feeds into the **single ability she is currently set to learn** on the dressphere she is *currently wearing* — switch dresspheres mid-battle and the AP starts flowing into that dressphere's selected ability instead. `[single source: Split Infinity G0908–G0912]`

| Award | AP | Confidence |
|---|---|---|
| **Using any dressphere ability that succeeds** (the default) | **1** | `[single source]` |
| **Using the basic Attack command** | **0** — Attack never awards AP | `[single source]` |
| **Killing an enemy** | the enemy's own **"AP Gained"** value, awarded to **all three girls**, not only the killer | `[verified: 2 sources]` |
| Using a **battle item** | 1 | `[single source]` |
| Using an ability granted by an accessory or Garment Grid | 1 | `[single source]` |

**Documented exceptions to the flat 1 AP** `[single source: Split Infinity G0912]`:

| Ability | AP per use |
|---|---|
| Machina Maw **Attack** | **1** (the only Attack command in the game that pays AP) |
| Machina Maw **Shockwave** | **2** |
| Machina Maw **Shockstorm** | **2** |
| Machina Maw **Vajra** | **3** |
| Floral Fallal **Flare Whirl** | **2** |
| Floral Fallal **Great Whirl** | **3** |
| **Nab Gil** / **Mug** (Garment Grid abilities) | **1 always — even when the steal fails** |

**When NO AP is awarded** `[single source]` — this is the important half, because it makes AP farming skill-dependent rather than spam-dependent:
- the ability's special effect failed (e.g. you tried to Poison an immune fiend);
- HP and/or MP were healed but the bar was already full;
- a steal attempt failed (except Nab Gil / Mug);
- the attack dealt **no damage** (immune, 0, or a miss);
- the status you tried to cure was not present;
- you used the **Attack** command (except Machina Maw's);
- the girl has **Pointless** status (icon "EXP=0" — she gets neither EXP nor AP).

**Per-enemy AP values.** SinirothX's bestiary publishes an `AP Gained` (and `Oversoul AP`) field for every enemy. Calibration points `[single source: SinirothX]`:

| Enemy | Level | AP Gained | Oversoul AP |
|---|---|---|---|
| Sallet (Ch. 1 trash) | 3 | 1 | 2 |
| Typical Ch. 1–2 fiend | 3–15 | 1–2 | 2–4 |
| **Bahamut** (Ch. 2, Underneath Bevelle) | 20 | **15** | — (bosses do not Oversoul) |

**Multipliers to model**: Covenant of Growth Garment Grid (**Double AP** on the Blue gate) · **AP Egg** accessory (**Triple AP**) · **Key to Success** accessory (Double All). These stack the way the gil/item doublers do.

**What this means for the two encounters' preset ability lists** — the point of documenting award rates at all:

| Encounter | Realistic AP per dressphere at that point | Justifies |
|---|---|---|
| **Bahamut** (Ch. 2/3, party Lv 20–28) | roughly **150–400 AP** per dressphere the player actually used, assuming ~60–120 random battles at 1–2 AP/kill × 3 girls plus ~2–4 ability uses per battle | Warrior through Mental Break (140 AP) + Sentinel (20); Gunner through Table-turner (240 AP cumulative); White Mage through Curaga + Shell + Protect (230 AP); **not** Excalibur (120 AP on top of 140 for the prerequisite chain), **not** Full-Life (160), **not** Assault (100) unless the player specifically chased it |
| **Vegnagun / Shuyin** (Ch. 5, party Lv 45–52) | **600–1,100 AP** per used dressphere, i.e. 2–4 mastered dresspheres per girl | Full White Mage mastery (750), full Warrior mastery (740), full Dark Knight mastery (490), Gunner mastery (800). **Not** Alchemist mastery (2,249 — Ether alone is 400 and Elixir 999) and **not** Berserker's counter chain (880 for the three counters) |

**Other results-screen multipliers**: Double EXP (Lady Luck, 80 AP, self) · Gillionaire (double gil, **stacks across all three girls up to ×8**) · Double Items (same stacking) · Covenant of Growth (Double EXP on the Yellow gate).

Partial victories: if you kill some enemies and then flee (or the rest flee), you keep the EXP, gil and items from everything you actually defeated `[single source]`.


### 6.8 Loss conditions

Game Over occurs when all three girls are **KO'd, petrified or shattered**. Notably, **if at least one girl successfully escapes, there is no Game Over** even if the other two are then KO'd. Being *ejected* from battle also ends the battle `[single source]`.

Petrification is a hidden loss condition: a petrified character **shatters permanently** if any physical attack connects, and all three petrified is an immediate Game Over `[verified: 2 sources]`.

### 6.9 Oversoul — note only, not needed for boss encounters

**Oversoul** is a random-encounter mechanic: after killing a set number of a given fiend family, the next one you meet transforms at the start of battle — blue pyrefly aura, restored HP/MP, all statuses cleared, **higher level and stats**, different (better) steal/drop/bribe tables, more gil, and **every ability costs 0 MP**. Stealing from an enemy resets when it Oversouls. About 30% of enemies (54 of 185) cannot Oversoul; no human-type enemy can. Oversoul is always the fiend's **first action**, it interrupts its own action timer, and it is itself an action — so a fast party can kill the fiend before it completes. `[verified: 2 sources]`

**Bosses do not Oversoul.** For a five-boss fan game this system can be omitted entirely; it is documented here only so that nobody implements a "boss suddenly powers up" mechanic thinking it is Oversoul. Boss phase changes in FFX-2 are scripted, not Oversoul.

---

## 7. Open questions / gaps in the public record

**Status after the gap-fill pass of this revision.** Eight of the ten previously-listed gaps are now closed; what remains is listed honestly below.

### Closed in this revision

| Was | Now | Where |
|---|---|---|
| No per-ability damage constants for player abilities | **Complete `Power` table for every dressphere and every SDSP part**, plus the `Formula` selector that picks the step-1 base, plus item/Mix powers under `damage = power × 50` | §2.9 |
| No ATB tick formula; bar-length vs fill-rate conflict with `visual-bible.md` | **`ticks = floor(10000 × value / (Agility + 1))` at a fixed 3000 ticks/s; one bar = 24,000 ticks = 8.00 s; internal max 416%.** The two descriptions are the same simulation; the bar-length reading is adopted and `visual-bible.md` needs no change | §1.2 |
| No CTIM/RECTIM values in seconds | **Unit system decoded** (same tick formula; "wait down" subtracts a percentage of the tick count). Per-ability *values* are still assigned by estimate, but now scale correctly with Agility | §1.3, §1.4 |
| No status durations | **`seconds = durationValue × 0.53`** at the default ATB speed, ×2 under Slow, ×0.95 under Haste, with ~25 published duration values | §2.8 |
| No hit/evade formula | **Decoded**: a flat additive points race, with Darkness dividing Accuracy by **4** | §2.6 |
| ACCU/EVA/LUCK Up-Down magnitude disputed | **Resolved**: flat **±10 (ACCU/EVA)** and **±5 (LUCK)** points inside the hit equation. The wiki's "±1/12" is boilerplate from the four damage stats | §2.8 |
| Gunner AP/MP transposed between documents | **Resolved**: this document's column order is correct; `ffx2-bahamut.md` §4.4 has AP and MP swapped. Confirmed by two sources **and** by the AP column summing to the published 800 mastery total | §3.0 |
| Warrior Power Break `init` vs 30 AP; White Mage Full-Life 120 vs 160 | **Resolved by arithmetic**: 30 and 160 are the values that make the Warrior and White Mage AP columns sum to their published 740 and 750 totals | §3.0 |
| Mix had no recipes and no effect values | **Complete deterministic engine**: Priority × Type lookup, 67 item tags, 21-row blend table, 24×4 result table, reference implementation, and verified recipes for every mix the encounters need | §3.11 |
| Only Gunner had a growth algorithm; sparse per-level tables | **All sixteen dresspheres and all nine SDSP parts** have growth algorithms, plus per-level tables for the full Lv 20–30 and Lv 43–52 encounter bands | §5.1a, §5.1b, §3.15 |
| Sinistral/Dextral Wing were prose stubs | **Full AP/MP/target/effect/power/duration tables** for both wings and for Full Throttle's main part | §3.15, §2.9.2 |
| No SDSP stat data at all | **Growth algorithms for all nine parts**, plus worked Lv 25 and Lv 50 stat blocks | §3.15 |
| No AP-per-action or AP-per-kill values | **1 AP per successful ability use, 0 for Attack**, seven documented exceptions, seven documented zero-award conditions, per-enemy `AP Gained` (Bahamut = 15) | §6.7 |

### Still open

1. **Critical-hit rate has no formula.** Crits are "determined by the attacker's Luck vs the target's Luck" and the multiplier is ×2, but no source gives the probability function — and unlike accuracy, the pbirdman calculator does not model it either (its crit input is a 0/1 switch). Guaranteed-crit sources (Burst Shot, Fiers, Dirty Dancing, Lady Luck's Critical, SOS Critical) sidestep the question; everything else needs an estimate. **Recommended `[estimate]`: `critChance = clamp(0.02, 0.60, (attackerLuck − targetLuck + 10) / 200)`**, which puts a Lv 30 party (Luck 13–28) at 8–14% against a Luck-10 boss and makes Lady Luck's +10 LUCK levels (§2.8: +50 points) the dominant crit source, matching how the dressphere plays.
2. **Per-ability CTIM/RECTIM *values* are still unpublished.** The unit system, the tick rate, the bar length and the modifier percentages are all decoded (§1.2–1.4), and one worked datum (value 70 → 5.42 s at Agility 42) anchors the absolute scale — but the individual per-ability numbers are assigned by tier estimate. This is now a *tuning* problem rather than an *unknown-units* problem.
3. **Special-dressphere node-count scaling has no published formula.** The rule is sourced (more nodes → higher main-part HP/MP/Str/Mag/Def/MDef, node counts 2–6, satellites unaffected); the magnitude is not. §3.15 supplies a reasoned ×0.80–×1.00 linear model.
4. **MP hard cap.** A GameFAQs board answer claims a 999 soft / 9999 hard structure paralleling HP and damage, without naming the FFX-2 mechanism that would unlock it. Treat **999** as the practical cap. See §2.4.
5. **Lady Luck's mastery total.** Computed sum 1,030 vs published 1,050; the 20 AP is most likely Attack Reels being 20 AP rather than `init`. See §3.0.
6. **Fiend Hunter Lv. 2 costs 20 AP (FF Wiki) or 30 AP (Split Infinity).** Unresolved; use 20.
7. **Sunburst's Mix power is 110 (5,500) in the calculator but 6,000 on the FF Wiki.** One-cell discrepancy in an otherwise perfect column; use 6,000. See §2.9.3.
8. **Buckle Feather is DEF Down 4 (FF Wiki) or 2 (calculator).** Use 4. See §3.15.
9. **Songstress Dance and Song durations** are not in the constant table — they are sustained auras tied to the Songstress's recovery gauge rather than to a duration value, so they need no duration constant, but the exact aura magnitudes (how many stat levels each Song applies) are only partly published.
10. **The FF Wiki's Gunner stat table duplicates Defense into Magic Defense.** Use the algorithm's MDef for Gunner. See §5.1a.
11. **FFX's Mix (Rikku's Overdrive) item-group table is still unlocated.** `ffx-combat-core.md` §5.9's one-example-per-result list remains a defect. The X-2 engine in §3.11 is the right *shape* to look for but the outcome sets and item tags differ and **must not be ported**.
12. **Chain multiplier increment has one conflicting transcription** (0.5 vs 0.05). Implement `1.40 + 0.05 × chainNumber`. See §1.7.

---

## Sources

**Decompile-derived / data-extracted**
- SinirothX, *Final Fantasy X-2 — Enemy Encyclopedia* (v1.3), GameFAQs — damage flowchart, stat growth algorithms, EXP curves, per-enemy data, Oversoul tables: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807
- gdgzfallen, *FFX-2 Active Skill Code List (Incomplete)*, GameFAQs boards — internal ability ID table confirming the complete ability roster: https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/75645949
- **pbirdman, *FFX-2 Calculator (Draft 2)* (.xlsx)** — the single most important source added in this revision. A working implementation of SinirothX's 20-step damage flowchart with per-ability `Power / Status / Chance / Duration / Accuracy / Formula` tables for every dressphere and every special-dressphere part, an ATB/CTIM/RECTIM tick model, the accuracy equation, the status-duration constants, the three status-infliction formulas, and item/Mix powers. Linked publicly from the GameFAQs "Ability Damage Formulas" thread (post #3, user *Kakuzatou*): https://www.dropbox.com/s/uh7n974ssnyxxho/pbirdmans%20ffx-2%20calclator%20%28Draft%20%202%29.xlsx — thread: https://gamefaqs.gamespot.com/boards/562386-final-fantasy-x-2/76204402
  - *Provenance note:* this is fan-made and uncredited to any decompile, so everything taken from it is tagged `[single source]`. It is nevertheless treated as high-confidence because (a) its `Attack` power of 16 matches SinirothX's per-enemy Normal-Attack damage constant, (b) its item powers reproduce ~20 independently-published FF Wiki Mix damage values exactly under a single `×50` rule, and (c) its Spare Change, Bribe, CONGRATS and randomiser blocks reproduce formulas that *are* independently published.

**Comprehensive guides**
- Split_Infinity (Damir Kolar), *Final Fantasy X-2 — Guide and Walkthrough* ("Cool Rikku" version) — battle system, statuses, all ability CT/RT/flag tagging, items, accessories, Garment Grids: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/25872
- StarNeptune (Jennie Cooper), *Final Fantasy X-2 — Dressphere Ability FAQ* v1.4 — AP/MP corroboration: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27068
- GameFAQs board thread, *Ability Damage Formulas* (FFX-2): https://gamefaqs.gamespot.com/boards/562386-final-fantasy-x-2/76204402
- GameFAQs board thread, *FFX-2 Ability Damage Formulas* (HD Remaster): https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/76205233

**Sources added in the gap-fill pass**
- Final Fantasy Wiki, *Gunplay* — the `Name | MP | AP | Description | Prerequisite` table that settles the Gunner cost transposition, plus every Gunplay prerequisite: https://finalfantasy.fandom.com/wiki/Gunplay
- Jegged.com, *Final Fantasy X-2 — Gunner* — independent AP-only listing corroborating the Gunplay AP column: https://www.jegged.com/Games/Final-Fantasy-X-2/Dresspheres/Gunner.html
- Jegged.com, *Warrior* — Warrior AP costs: https://www.jegged.com/Games/Final-Fantasy-X-2/Dresspheres/Warrior.html
- Jegged.com, *Lady Luck* — Lady Luck AP costs: https://www.jegged.com/Games/Final-Fantasy-X-2/Dresspheres/Lady-Luck.html
- Jegged.com, *Songstress* — all Dance and Song AP costs (sum = 740): https://www.jegged.com/Games/Final-Fantasy-X-2/Dresspheres/Songstress.html
- Final Fantasy Wiki, *Swordplay (Final Fantasy X-2)* — Power Break 30 AP / 4 MP and every Swordplay prerequisite: https://finalfantasy.fandom.com/wiki/Swordplay_(Final_Fantasy_X-2)
- Final Fantasy Wiki, *White Magic (Final Fantasy X-2)* — Full-Life 160 AP / 60 MP, Dispel 30 AP, Cure 20 AP, Full-Cure 80 AP: https://finalfantasy.fandom.com/wiki/White_Magic_(Final_Fantasy_X-2)
- Final Fantasy Wiki, *White Mage (Final Fantasy X-2)* — Pray/Vigor/White Magic Lv.2–3 costs and the per-level stat table: https://finalfantasy.fandom.com/wiki/White_Mage_(Final_Fantasy_X-2)
- Final Fantasy Wiki, *Black Mage (Final Fantasy X-2)*: https://finalfantasy.fandom.com/wiki/Black_Mage_(Final_Fantasy_X-2)
- Final Fantasy Wiki, *Gun Mage* — Fiend Hunter Lv.2 at 20 AP, Scan Lv.2/Lv.3: https://finalfantasy.fandom.com/wiki/Gun_Mage
- Final Fantasy Wiki, *Berserker (Final Fantasy X-2)*, *Samurai (Final Fantasy X-2)*, *Lady Luck (Final Fantasy X-2)*, *Thief (Final Fantasy X-2)*, *Alchemist (Final Fantasy X-2)*, *Songstress*, *Dark Knight (Final Fantasy X-2)*, *Mascot* — command/auto ability AP tables and the complete Lv 1–99 per-level stat tables used in §5.1b
- **Final Fantasy Wiki, *Mix (Final Fantasy X-2)*** — the Priority / Opposites-Cancel / Blend mechanics, the 24×4 outcome table, the 21-row blend table, and exact damage values for all 53 results: https://finalfantasy.fandom.com/wiki/Mix_(Final_Fantasy_X-2)
- **Final Fantasy Wiki, *Final Fantasy X-2 items*** — the per-item **Priority** and **Type** columns that drive Mix: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_items
- Final Fantasy Wiki, *Sinistral Arts* — full Sinistral Wing AP/MP/effect table: https://finalfantasy.fandom.com/wiki/Sinistral_Arts
- Final Fantasy Wiki, *Dextral Arts* — full Dextral Wing AP/MP/status table (Lazy Wing = Sleep): https://finalfantasy.fandom.com/wiki/Dextral_Arts
- Final Fantasy Wiki, *Full Throttle (Final Fantasy X-2)* — main-part and wing command tables, Fright 20 AP / Sword Dance 30 AP: https://finalfantasy.fandom.com/wiki/Full_Throttle_(Final_Fantasy_X-2)
- Final Fantasy Wiki, *Dressphere* — "the base statistics are directly related to the number of nodes on the equipped Garment Grid"; accessories are disabled while in a special dressphere: https://finalfantasy.fandom.com/wiki/Dressphere
- Final Fantasy Wiki, *Garment Grid* — node counts and gate mechanics: https://finalfantasy.fandom.com/wiki/Garment_Grid
- Final Fantasy Wiki, *Final Fantasy X-2 statuses* — the per-status "±1/12, stacks up to 10 times" wording examined in the §2.8 conflict note: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_statuses
- Final Fantasy Wiki, *Gunner (Final Fantasy X-2)* — Lv 1–99 stat table (and the Def/MDef duplication recorded in §5.1a): https://finalfantasy.fandom.com/wiki/Gunner_(Final_Fantasy_X-2)
- SinirothX §19 *Dressphere Growth Algorithms* and §4b *Species Enemies* (Bahamut entry: Lv 20, HP 8,400, EXP 1,300, **AP Gained 15**, Gil 1,000) — within the Enemy Encyclopedia linked above
- Split_Infinity §G0912 *How are AP obtained?* and §G1305 / §G1604 (SDSP node trick, node counts 2–6) — within the Guide and Walkthrough linked above

**Final Fantasy Wiki (finalfantasy.fandom.com)**
- Chain (term) — Chain multipliers and windows: https://finalfantasy.fandom.com/wiki/Chain_(term)
- Attack (command) — FFX-2 offensive/defensive/randomiser formulas: https://finalfantasy.fandom.com/wiki/Attack_(command)
- Critical hit — FFX-2 crit, back attack, chain interaction: https://finalfantasy.fandom.com/wiki/Critical_hit
- Haste (Final Fantasy X-2 status) — ATB phase breakdown and the ~5% figure: https://finalfantasy.fandom.com/wiki/Haste_(Final_Fantasy_X-2_status)
- Final Fantasy X-2 statuses: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_statuses
- Final Fantasy X-2 items: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_items
- Final Fantasy X-2 accessories: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_accessories
- Final Fantasy X-2 auto-abilities: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_auto-abilities
- Final Fantasy X-2 commands: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_commands
- Garment Grid: https://finalfantasy.fandom.com/wiki/Garment_Grid
- Dressphere: https://finalfantasy.fandom.com/wiki/Dressphere
- Break Damage Limit: https://finalfantasy.fandom.com/wiki/Break_Damage_Limit
- Oversoul (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Oversoul_(Final_Fantasy_X-2)
- Trigger Happy (Yuna ability): https://finalfantasy.fandom.com/wiki/Trigger_Happy_(Yuna_ability)
- Gunner (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Gunner_(Final_Fantasy_X-2)
- Gunplay: https://finalfantasy.fandom.com/wiki/Gunplay
- Thief (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Thief_(Final_Fantasy_X-2)
- Warrior (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Warrior_(Final_Fantasy_X-2)
- Swordplay (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Swordplay_(Final_Fantasy_X-2)
- Black Mage (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Black_Mage_(Final_Fantasy_X-2)
- Black Magic (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Black_Magic_(Final_Fantasy_X-2)
- White Mage (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/White_Mage_(Final_Fantasy_X-2)
- White Magic (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/White_Magic_(Final_Fantasy_X-2)
- Gun Mage: https://finalfantasy.fandom.com/wiki/Gun_Mage
- Blue Bullet: https://finalfantasy.fandom.com/wiki/Blue_Bullet
- Dark Knight (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Dark_Knight_(Final_Fantasy_X-2)
- Arcana (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Arcana_(Final_Fantasy_X-2)
- Samurai (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Samurai_(Final_Fantasy_X-2)
- Bushido (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Bushido_(Final_Fantasy_X-2)
- Berserker (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Berserker_(Final_Fantasy_X-2)
- Alchemist (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Alchemist_(Final_Fantasy_X-2)
- Mix (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Mix_(Final_Fantasy_X-2)
- Stash: https://finalfantasy.fandom.com/wiki/Stash
- Songstress: https://finalfantasy.fandom.com/wiki/Songstress
- Dance (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Dance_(Final_Fantasy_X-2)
- Sing (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Sing_(Final_Fantasy_X-2)
- Lady Luck (Final Fantasy X-2) — reel result tables: https://finalfantasy.fandom.com/wiki/Lady_Luck_(Final_Fantasy_X-2)
- Gamble (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Gamble_(Final_Fantasy_X-2)
- Trainer (Final Fantasy X-2): https://finalfantasy.fandom.com/wiki/Trainer_(Final_Fantasy_X-2)
- Mascot: https://finalfantasy.fandom.com/wiki/Mascot
- Floral Fallal: https://finalfantasy.fandom.com/wiki/Floral_Fallal
- Machina Maw: https://finalfantasy.fandom.com/wiki/Machina_Maw
- Darkness (Dark Knight ability): https://finalfantasy.fandom.com/wiki/Darkness_(Dark_Knight_ability)
- Gil Toss (Spare Change): https://finalfantasy.fandom.com/wiki/Gil_Toss
- Speed (stat): https://finalfantasy.fandom.com/wiki/Speed_(stat)
- Battle system: https://finalfantasy.fandom.com/wiki/Battle_system

**Corroborating transcriptions**
- Bear Ironfist, "FFX-2 Damage Formula" (FFXIV Lodestone blog) — independent transcription of the physical / magic / magic-recovery / special-magic formulas and the quoted damage-constant values: https://na.finalfantasyxiv.com/lodestone/character/4417600/blog/2916640
- TrueAchievements, "FFX-2: Full Chain" achievement (99 chains): https://www.trueachievements.com/a271751/ffx2-full-chain-achievement
- Steam Community, "[FFX-2] How do I break damage limit as YRP?": https://steamcommunity.com/app/359870/discussions/0/6471190413149593305/

**Fact-check pass — additional independent sources**
- Jegged.com, "ATB and Chain Attacks" (FFX-2 Tips and Tricks) — chain multiplier table (x1=1.45x … x20=2.40x): https://jegged.com/Games/Final-Fantasy-X-2/Tips-and-Tricks/ATB-and-Chain-Attacks.html
- PlayStationTrophies.org, "Overkill" trophy guide (FFX-2 HD) — confirms 9999 default / 99999 with Break Damage Limit: https://www.playstationtrophies.org/game/final-fantasy-x-2-hd-ps3-vita/trophy/77673-overkill.html
- GameFAQs board thread, cap structure discussion (9999/99999 damage & HP; disputed 999/9999 MP cap): https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/69845955
- Final Fantasy Wiki, Critical hit (generic) — corroborates ×2 crit multiplier: https://finalfantasy.fandom.com/wiki/Critical_hit
- Steam Community, FFX-2 battle-system damage-stacking discussion — corroborates back-attack ×2 and crit ×2: https://steamcommunity.com/app/359870/discussions/0/1696043806576672726/
- ffexodus.com, Dressphere 4 (Dark Knight) page — Charon mechanic (qualitative corroboration): https://ffexodus.com/ffx2/dress4.php
- Reddit, r/finalfantasyx, "X-2 question about Charon": https://www.reddit.com/r/finalfantasyx/comments/166a17s/x2_question_about_charon/
- GameFAQs, "FFX-2 FAQ/Walkthrough" by KeyBlade999 — independent corroboration of On the Level (16×Level), Trigger Happy Lv.3 (2.6s): https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/69206?page=56
- Final Fantasy Wiki, Warrior (Final Fantasy X-2) — Sentinel exact wording ("1 HP physical, full magic damage"): https://finalfantasy.fandom.com/wiki/Warrior_(Final_Fantasy_X-2)
- Final Fantasy Wiki, Slow (Final Fantasy X-2 status) — ATB half-speed, gold bar: https://finalfantasy.fandom.com/wiki/Slow_(Final_Fantasy_X-2_status)
- Final Fantasy Wiki, Regen (Final Fantasy X-2 status) — 3% max HP per tick: https://finalfantasy.fandom.com/wiki/Regen_(Final_Fantasy_X-2_status)
- Final Fantasy Wiki, Poison (Final Fantasy X-2) — ~3% max HP per tick: https://finalfantasy.fandom.com/wiki/Poison_(Final_Fantasy_X-2)
- Final Fantasy Wiki, Auto-Life (Final Fantasy X-2 status) — revives at 25% HP: https://finalfantasy.fandom.com/wiki/Auto-Life_(Final_Fantasy_X-2_status)
- Final Fantasy Wiki, Final Fantasy X-2 elements — weak damage doubles (stacks), resistant halves (no stacking): https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_elements

---

## Verification log

Results of an external fact-check pass over this document's claims. Corrections and tag upgrades from this pass have been applied inline above; this log is the full record.

| Claim | Verdict |
|---|---|
| Chain multiplier: ×1.45 at Chain x1, +0.05/link (1.40 + 0.05×chainNumber) | confirmed |
| Chain window: 2s after normal hit, 3s after critical hit | unverifiable |
| Maximum chain count is 99, giving ×6.35 at cap ("Full Chain" trophy) | unverifiable |
| Physical base damage formula: (Lv + Str) * Lv * Str / 1024 + Str | unverifiable |
| Defense step: prev * (270 - Def) / 255 (linear, physical) | unverifiable |
| Default per-hit damage cap is 9999; Break Damage Limit raises it to 99999 | confirmed |
| Default max HP cap is 9999; Break HP Limit raises it to 99999 | confirmed |
| MP cap is 999 (flat, no doc-mentioned way to raise it) | contradicted — see CONFLICT note in §2.4 |
| Critical hit multiplier is ×2 | confirmed |
| Back-attack multiplier is ×2 | confirmed |
| Back attack + critical hit together multiply damage ×4 | unverifiable |
| Charon (Dark Knight): damage = user's max HP × 2, user removed from battle | unverifiable |
| On the Level (Gunner): damage = user's current Level × 16 | confirmed |
| Spare Change (Samurai) formula: (22 * Gil) / (sqrt(Gil) + 20) | unverifiable |
| Trigger Happy window: 1.8s base, 2.2s Lv.2, 2.6s Lv.3 | confirmed |
| Mastery AP totals: Gunner 800, Warrior 740, Lady Luck 1050 | unverifiable |
| Thief's Attack strikes twice per use (built-in 2-hit) | unverifiable |
| Sentinel (Warrior, 20 AP): physical damage taken reduced to 1 HP until ATB refills; magic unaffected | confirmed |
| Haste raises ATB charge rate by ~5% (does not raise Agility) | unverifiable |
| Slow status: ATB fill ×0.5, CTIM ×2.0, gold ATB bar | confirmed |
| Regen and Poison each tick ~3% of max HP per interval | confirmed |
| Auto-Life revives at 25% of max HP | confirmed |
| Elemental weakness ×2 (stacks); resistance ×0.5 (does not stack) | confirmed |

## 8. Research sweep addendum (2026-09-23)

Sources read this pass: Split Infinity, *Guide and Walkthrough* (GameFAQs faqs/25872: §5 abbreviations, G0804, G0903, G0916-G0917, §12 items, §14 Gunplay, §16 G1601-G1611); SinirothX, *Enemy Encyclopedia* v1.3 (faqs/31807); FF Wiki raw wikitext via the MediaWiki API: *Critical hit* (rev 4049711), *Final Fantasy X-2 enemy abilities* (rev 3998493), *Final Fantasy X-2 items* (rev 4049343), *Dressphere* (rev 4045630), *Garment Grid* (rev 3998878), *Steal* (rev 4035497), *Steal Gil* (rev 4022614), *Final Fantasy X-2 commands* (rev 3998868).

**8.1 Grenade and the "always critical" column of §5.5.** §5.5's "always critical" on Budget Grenade, Grenade, S/M/L-Bomb and the four status grenades is an *interpretation*. Split Infinity's own wording is `one hit for 187-212 (CRIT!) phd VS all members in target party`; the same author writes **"guaranteed CRIT"** where he means guaranteed (Burst Shot: "guaranteed CRIT phd to one target"; Scatterburst: "guaranteed CRIT phd to all members of target party"), and his abbreviation list defines only `CRIT --- critical`. His printed band is the un-doubled one (187-212 = 200 × rand(240..271)/256). The same Grenade thrown by an enemy is **187~211** with no crit in two sources (SinirothX: "damage all characters by 187 to 211 HP (type: randomized constant)"; FF Wiki enemy abilities: "Inflicts 187~211 damage to the party"). FF Wiki *Critical hit* lists every guaranteed-crit source in X-2 (Lady Luck Critical, SOS Critical, Dirty Dancing, Fiers, Peerless, Last Resort, some enemy attacks) and names no item. **Ruling: Grenade = base 200, 187-211 per target before chain `[verified: 3 sources]`; a guaranteed crit is in no source; that a thrown item *can* crit on Luck rests on the `(CRIT!)` tag alone `[single source]`.** The same reading applies to every bomb row in §5.5 (the band printed is the band dealt).

**8.2 Does a mid-battle spherechange survive the battle? Not found in any source read.** Checked: every page and FAQ listed above, fourteen more GameFAQs FAQs (28684, 26991, 22855, 27115, 22790, 22447, 22872, 27786, 26832, 22681, 27315, 25791, 69206, 22332), GamerGuides' prologue page, the FF Wiki walkthroughs (Hamfruitcake 09 parts 1-2, Cymbeline) and the Japanese *ffdic* wiki pages for ドレスフィア and スペシャルドレス. None says whether a girl starts the next battle in the dressphere she ended the last one in. What *is* sourced about the battle boundary: gate (T-) effects end with the battle (§4.1, and Split Infinity G1608: "once the battle is over, all beneficial factors gained that way are lost") `[verified: 2 sources]`, and the special-dressphere unlock counts dresspheres worn "during the battle" (§3.15) `[verified: 2 sources]`. Status: **`[gap]`**, a question for the owner or a one-battle check on a real copy.

**8.3 Steal and Pilfer Gil, confirmations.** Steal's help text is "Steal items from one enemy." (FF Wiki *Final Fantasy X-2 commands*); "A successful steal can be performed once on an enemy, but can be performed again after an enemy Oversouls" (FF Wiki *Steal*), matching §3.2 `[verified: 2 sources]`. Pilfer Gil's yield is the enemy's own stolen-gil figure: SinirothX's field legend reads "Stolen Gil: [Gil you can steal from monster]", and FF Wiki *Steal Gil* says "The amount of gil that can be stolen varies between enemies ... bosses carrying the most" `[verified: 2 sources]`. The success roll and the 87.5 / 12.5 common/rare split are in `ffx2-bahamut.md` §1.6 `[verified: 2 sources]`.
