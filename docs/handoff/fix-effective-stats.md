# fix-effective-stats — the prep Stats tab reflects equipment

**Key:** `effective-stats` · **Status:** done, `npx tsc --noEmit` clean, full `npx vitest run` green (66 files / 2408 tests).

## The defect

The party-prep **Stats** tab printed ten raw `StatBlock` fields and then
disclaimed itself:

> Strength through Accuracy are base values — equipment bonuses aren't reflected yet.

Worse than a missing feature: the tab actively told the player their gear did
nothing, on a screen whose whole job is "is this loadout ready for the boss?".

## What it does now

`src/battle/ffx/effectiveStats.ts` is a new **pure** export that folds a
member's two equipment slots into their stat sheet, and the tab renders its
rows. Screenshots: `docs/screenshots/42c-prep-stats-effective.png` (Tidus) and
`docs/screenshots/42d-prep-stats-best-tier.png` (Yuna).

| Row | Tidus @ Mt. Gagazet | Why |
|---|---|---|
| HP | `2200 → 2420  +10%` | Glorious Shield's HP +10% really does raise the pool |
| STRENGTH | `31  +10% dmg` | Baroque Sword's Strength +10% is a damage-chain step |
| MAGIC DEF (Yuna) | `39  −10% taken` | Blessed Ring, best tier of the family |
| AGILITY / LUCK / EVASION / ACCURACY | bare number | no §9 auto-ability touches them |

The note is replaced by a legend that is *true*: "Equipment grants
auto-abilities, not stat points: HP/MP +% raise the pool, the rest apply in
the damage chain."

## The one judgement call: no invented "effective Strength"

The task asked for base **and** effective on every row. Only the two pools get
a different `effective`, deliberately.

`research/ffx-combat-core.md` §9 is explicit — Strength +10 % is
`dmg += dmg × 10 // 100` at step 8 and "does **not** raise the Strength stat".
Printing `31 → 34` would not just be unsourced, it would be numerically wrong
by a wide margin: the `strength` POWER term is cubic (`str³ // 32 + 30`, §2.2),
so 31 → 34 reads as roughly **+31 %** damage, not the +10 % the sword grants.
So each row carries the percentage and a `kind` saying where it lands
(`pool` / `damage` / `mitigation` / `none`), and the UI renders that.

The second call: for the pools, `effective` is `StatBlock.maxHp`/`maxMp` **as
authored**, not a re-derivation. That field is the contract ("effective maximum
HP after HP+%") and is what `PartyPrepScreen`'s field card and the battle HUD
already draw — a menu that quietly recomputed it could disagree with the card
six inches below it. The §9 derivation is exported separately as
`effectivePool()`, and the test suite holds every shipped build to it, so a
mis-authored `maxHp` fails a test instead of splitting the screen.

## Files

| File | Change |
|---|---|
| `src/battle/ffx/equipment.ts` | **Additive only.** New `EquipmentBearer` (the structural "wears gear" slice, satisfied by both `FFXCombatant` and `FFXMemberBuild`), `bearerHasAuto()`, `BonusFamily`, `bonusPercentFor()`, and the `hp-N`/`mp-N` tables from §9. Existing exports keep their signatures; `hasAuto` now delegates to `bearerHasAuto` so there is one definition of the lookup. |
| `src/battle/ffx/effectiveStats.ts` | **New.** `effectiveStats(member)`, `effectivePool(member, 'hp'\|'mp')`, and the row/kind types. |
| `src/battle/ffx/index.ts` | Additive re-exports of both. |
| `src/ui/ffx/party-prep/panels.ts` | `makeStatsPanel()` renders `effectiveStats().rows`; note replaced by the legend. Computes nothing itself (`docs/CONTRACTS.md` layering rule). |
| `src/ui/ffx/party-prep/party-prep.css` | `.ffxprep-stat__vs` / `__base` / `__bonus`; dropped the now-meaningless `.ffxprep-stat--base` opacity rule. Still `--ig-*`-only [CONTRACT-CHANGES decision 10]. |
| `tests/unit/ffx-effective-stats.test.ts` | **New**, 11 tests. |
| `tests/unit/ui-ffx-party-prep.test.ts` | Stats-panel tests updated + 2 new. |
| `docs/screenshots/42c-…`, `42d-…` | Captured from a live dev server. |

## Numbers, and where each comes from

Every one is `research/ffx-combat-core.md` §9 unless noted; the build values
are `src/data/ffx/builds/gagazet.ts`, itself sourced to
`research/ffx-seymour-flux.md` §7.7.1/§7.7.2.

- `maxHP = baseHP × (100+N) // 100`, clamped **9 999** (99 999 with Break HP
  Limit); MP likewise, clamped **999** (9 999 with Break MP Limit). `//` is
  floor and load-bearing — HP 1 375 with HP +5 % is **1 443**, not 1 444;
  pinned.
- Tiers within a family do **not** stack: Yuna's Blessed Ring carries
  `magic-def-10` *and* `magic-def-5` and is worth **10**, not 15. This is the
  same `bestPercent` steps 8/9 of the damage chain already used — the menu
  reads the identical table, so it cannot drift from the engine.
- Strength / Magic +3/5/10/20 % → outgoing physical / magical damage;
  Defense / Magic Def +3/5/10/20 % → incoming. `other`-type damage (every
  Overdrive and Mix) gets neither (§2.4) — not surfaced on this tab, but it is
  why the chip says "dmg" rather than "damage from everything".
- `effectivePool()` reproduces all seven authored `maxHp`/`maxMp` values in
  `gagazet.ts` exactly (2200→2420, 2100→2310, 3100→3410, 2300→2530,
  1250→1375, 1400→1540, and Yuna's untouched 1500/270).

## Notes for whoever picks this up next

- `effectiveStats()` takes any `{ stats, equipment? }`, so the FFX-2 prep
  screen and the battle HUD can use it unchanged; FFX-2's garment-grid stat
  model is a different research section and is **not** covered here.
- `max-hp-x2` / `max-mp-x2` (Rikku's Mix flags, §5.9) are battle-time effects
  on a live combatant, not equipment, so they are not in `effectivePool()`.
- The Equipment tab still prints raw auto-ability ids as chips
  (`strength-10`, `zombie-ward`). A display-name table for `AutoAbilityId`
  would improve both tabs; out of scope here.
