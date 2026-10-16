# Mirror Aeons: the difficulty bench (hidden FFX chapter 27, "Dark Mirror")

**Game case: FFX only** (AGENTS.md rule 14). Measured 2026-10-15 on the real engine, with the Dark Aeons' AI coded from `research/re-ffx-dark-aeons.md` (nothing in it invented), Yuna's Yojimbo and Magus Sisters as the
reverse-engineering session's engine (lane FFX-K, merged at 42dc0f547) plays them, and the party preset of `data/ffx/builds/mirror-aeons.ts`. **No boss row, formation or script was touched to reach a number**: the levers are
the party's own estimates and WHICH of the game's own fights each act uses (the plan: `docs/plans/ch-mirror-aeons-review.md` section 3).

Bailey, 2026-10-15: "i like the mirror match but make the difficulty appropriate not too easy not too hard". The target the plan turned that into: **a full run (Act I, the heal, Act II) with the advisor's line is won about
70 percent of the time (60 to 80 accepted), and a careless line (the plain Attack on the first living enemy, no aeon, no item) mostly loses (under 20 percent).** Prefer the game's own formations; the trio with its gauges
at 0 (OUR adjustment) only if no faithful cell lands in the band.

## The recommended cell

| | |
|---|---|
| **Act I** | **the faithful pair `kino01_72`** (Dark Mindy and Dark Sandy; both gauges start at 0), `MIRROR_ACT_I` |
| **Act II** | **Dark Yojimbo, tier 2 `nagi05_71`** (+10 a turn, first Zanmato on his 11th turn), `MIRROR_ACT_II` |
| **Between the acts** | the party and every aeon restored in full (the driver's delegated pick; `EnemyGroupDef.restoresPartyOnEntry` with `restoresAeonsOnEntry`); the bag is **not** restocked |
| **The lever** | **17 Phoenix Downs** in the bag (`ENDGAME_PHOENIX_DOWNS`), an estimate: no source gives the endgame stock |
| **Result** | advisor **74 percent (294 of 400 seeds; 95 percent interval 69 to 78)**, careless **0 of 200** |

The three Act II tiers are all inside the band with the pair (69, 74 and 77 percent at 17 Phoenix Downs; 200 seeds each, so the three differences are inside one interval of one another). Tier 2 is the pick because it is RE's
recommended spacing (about four player actions between Zanmatos, the first at which a player can read the gauge and plan: RE note 2.6, 4.5) and because tier 1 is the only tier whose game fight also writes an **ambushed
start**, which the chapter does not model (every fight here starts normal), so tier 1 would be the one tier whose defining rule is missing. Tier 3 (+16) leaves two actions between Zanmatos and is the harder reading of the same
fight; it stays registered and is a one-constant move if Bailey wants the cavern harder.

## How it was measured

- **The harness** is `tests/unit/helpers/mirrorAeonsBench.ts` (the same code `tests/unit/chapters/mirror-aeons-bench.test.ts` pins), driven from the command line by `tools/mirror-aeons-bench.mjs` (Node with
  `--experimental-transform-types`, because the engine's sources use parameter properties). One fight takes 60 to 200 ms; a seed is one fight, seeds 1 to N.
- **A chain** is Act I on seed s, then Act II on seed s+1 through the real chain mechanics (`setupForNextLink`: the party as Act I left it, the heal, the carried flags); a loss in either act is a loss of the chain. Where a
  table says "alone", the act is played from the fresh preset.
- **The advisor's line** is the shipped tactic (`src/engine/tactics/mirror-aeons.ts`, `mirrorAeons`: the same code the game's "next best move" and the Auto strategy run). **The careless line** is `Attack` on the first
  living enemy, no aeon, no item. Both read only what the menu offers.
- **Sampling.** 200 seeds a cell (95 percent interval of about plus or minus 6 points at 74 percent); the sweeps around the pick use 400 seeds (plus or minus 4). Two runs of the same seeds are identical (the engine is
  deterministic), so differences between runs are the code's or the lever's, never luck; differences between different seed sets are noise.
- **Not touched:** every boss row, formation and script (the Dark Aeons' numbers are the game's), the party's stat caps, and the advisor's line (its constants were set before the bench ran the final cells; section "The
  advisor's line" shows what each rule is worth).

## The table: Act I cell by Act II tier, the whole chapter, 17 Phoenix Downs, 200 seeds a line

| Act I | Act II tier | advisor (whole chapter) | careless (whole chapter) |
|---|---|---|---|
| faithful trio `kino00_70` (gauges 100) | 1 `nagi05_70` | 0 of 200 (lost in I 200) | 0 of 200 |
| faithful trio `kino00_70` | 2 `nagi05_71` | 0 of 200 (lost in I 200) | 0 of 200 |
| faithful trio `kino00_70` | 3 `nagi05_72` | 0 of 200 (lost in I 200) | 0 of 200 |
| **faithful pair `kino01_72`** | 1 `nagi05_70` | **69 percent** (138 of 200; lost in I 26, in II 36) | 0 of 200 |
| **faithful pair `kino01_72`** | **2 `nagi05_71`** | **74 percent** (147 of 200; lost in I 26, in II 27) | 0 of 200 |
| **faithful pair `kino01_72`** | 3 `nagi05_72` | **77 percent** (153 of 200; lost in I 26, in II 21) | 0 of 200 |
| trio at gauge 0 `kino00_70-g0` (OUR adjustment) | 1 `nagi05_70` | 0 of 200 (lost in I 200) | 0 of 200 |
| trio at gauge 0 `kino00_70-g0` | 2 `nagi05_71` | 0 of 200 (lost in I 200) | 0 of 200 |
| trio at gauge 0 `kino00_70-g0` | 3 `nagi05_72` | 0 of 200 (lost in I 200) | 0 of 200 |

Each act alone (fresh preset, 17 Phoenix Downs, 200 seeds):

| Act | advisor | careless |
|---|---|---|
| faithful trio `kino00_70` | 0 of 200 | 0 of 200 |
| **faithful pair `kino01_72`** | **87 percent** (174 of 200) | 0 of 200 |
| trio at gauge 0 `kino00_70-g0` | 0 of 200 | 0 of 200 |
| tier 1 `nagi05_70` | 97 percent (193 of 200) | 0 of 200 |
| tier 2 `nagi05_71` | 97 percent (194 of 200) | 0 of 200 |
| tier 3 `nagi05_72` | 100 percent (200 of 200) | 0 of 200 |

What the two tables say together: **Act II is easy alone (97 percent) and hard in the chain (about 84 percent of the survivors of Act I win it) because the chain arrives with the Phoenix Downs Act I spent**; the heal gives
back HP, MP and the aeons, not the bag. The bag is the chapter's budget, which is why it is the lever.

## Why the others are not the pick

- **The faithful trio `kino00_70` (gauges 100) is out of the advisor's reach: 0 of 200 with 17 Phoenix Downs and 1 of 100 with 99.** The reasons are in the engine, not in a number: the Delta Attack is the third enemy action
  of the battle, so it lands before any plan can; it is six hits of up to 99,999 on whatever stands in front (a Sister of Yuna's as the shield takes it once; **the second Delta Attack has no shield left, because Mindy and
  Sandy kill a lone aeon first**); the Dark Aeons' special moves (their cap is 99,999) are one-shots on a 9,999-HP member; Camisade drains MP. This is the hardest rung of the game's own ladder and the tactic cannot beat it,
  so by Bailey's "not too hard" it cannot be the chapter's Act I. It is registered and plays (the bench's cell), so a human who is better than the line is not locked out of it by data.
- **The trio with its gauges at 0 (`kino00_70-g0`, the one cell that is OUR adjustment, not a game formation; the row is `SISTER_ADJUSTED_FORMATIONS`) does not help: 0 of 200 with 17 Phoenix Downs, 4 of 100 with 99.** The Delta
  Attack only comes later (tick 45, after five rounds), but three Dark Aeons at once is still a storm the line cannot weather. **It is not shipped and nothing in the player's text names it**; it stays as a bench cell. The
  brief's rule (use it only if no faithful cell lands in the band) is moot: three faithful cells land in the band.
- **The single sisters are too easy to be an Act**: the careless line wins Sandy alone and Cindy alone at least 9 times in 10 (pinned in `mirror-aeons-bench.test.ts`).
- **Tier 1 and tier 3** are in the band too (69 and 77 percent) and are the one-constant alternatives (see the recommended cell).

## The levers, on the recommended cell (advisor, whole chapter)

**Phoenix Downs in the bag (the main lever; Luck 60, stats at the caps)**

| Phoenix Downs | whole chapter | seeds | lost in Act I / in Act II |
|---:|---|---:|---|
| 10 | 12 percent (23) | 200 | 159 / 18 |
| 14 | 44 percent (87) | 200 | 81 / 32 |
| 15 | 55 percent (220) | 400 | 113 / 67 |
| 16 | 66 percent (264) | 400 | 75 / 61 |
| **17** | **74 percent (294)** | 400 | 53 / 53 |
| 18 | 79 percent (315) | 400 | 34 / 51 |
| 20 | 88 percent (175) | 200 | 8 / 17 |
| 30 | 94 percent (188) | 200 | 3 / 9 |
| 99 | 94 percent (188) | 200 | 3 / 9 |

Each Phoenix Down is worth 6 to 11 points near the pick, and the curve flattens at 94 percent (a line that never runs out of Phoenix Downs still loses 6 percent of runs: the Zanmato and Passado one-shots). **16 gives 66,
17 gives 74, 18 gives 79: 17 is the pick** (4 points over the target, inside the band by 6; 16 is also 4 away and 6 above the bottom of the band, but with a wider tail: lost in Act I 75 of 400 against 53).

**Luck (every member's; the preset ships 60; 200 seeds)**

| Luck | whole chapter | lost in Act I / in Act II |
|---:|---|---|
| **60** | **74 percent (147)** | 26 / 27 |
| 40 | 32 percent (64) | 94 / 42 |
| 20 | 4 percent (7) | 176 / 17 |
| 0 | 0 of 200 | 199 / 1 |

**Stat fraction (Strength, Defense, Magic and Magic Defense at this share of the caps; 17 Phoenix Downs; 200 seeds)**

| Share | whole chapter | lost in Act I / in Act II |
|---:|---|---|
| **1.00** | **74 percent (147)** | 26 / 27 |
| 0.95 | 5 percent (9) | 89 / 102 |
| 0.90 | 1 percent (1) | 191 / 8 |
| 0.80 | 0 of 200 | 200 / 0 |

Luck and the stat fraction are **cliffs, not dials**: a fifth less Luck or five percent less of four stats turns three runs in four into one in three or one in twenty. The party the preset describes (every stat at the cap, Luck
60) is the edge the fight is balanced on. Both are kept as they were and the Phoenix Downs are the lever.

## The advisor's line: what each rule is worth

The same cell (pair, tier 2, 17 Phoenix Downs, 200 seeds), the shipped line with one rule taken away at a time (`ABLATIONS` in the helper; `--ablate all` in the tool):

| Line | whole chapter | lost in Act I / in Act II |
|---|---|---|
| **shipped** | **74 percent (147)** | 26 / 27 |
| an aeon goes in only when his blade is full (100, not 88) | 55 percent (109) | 26 / 65 |
| heal under 45 percent of a member's HP (not 60) | 55 percent (109) | 48 / 43 |
| no Auto-Life upkeep | 48 percent (95) | 17 / 88 |
| no Cheer stacks against Dark Yojimbo | 22 percent (43) | 26 / 131 |
| the story aeons go in before Yojimbo | 69 percent (138) | 26 / 36 |
| healing from the bag only (no Curaga, Cura or Cure) | 4 percent (7) | 174 / 19 |

Every rule is load-bearing, and none is a secret: all seven appear in the guide's hints (`data/guides/mirror-aeons.ts`) in the player's words.

## What is an estimate, and what waits

**Estimates (named constants, one place each; none is a game number):** 17 Phoenix Downs (the lever, measured above); the party at the caps with Luck 60 (`ENDGAME_LUCK`); the Sisters' start gauges at 100 and
Yojimbo's at 0 (`SISTERS_START_GAUGE`, `YOJIMBO_START_GAUGE`: the Sisters' first menu offers Combine powers only while all three gauges are full); the Sisters' start motivation 50
(`SISTERS_START_MOTIVATION`: RE marks it unsourced; it sets Combine powers' chance, 200 plus motivation in RE's kernel, and was not measured as a lever); Yojimbo's start compatibility 128 (**strongly indicated by the owner's saves, live
confirmation pending**) and hire answer 2; the party's gil 1,500,000 (the line pays Yojimbo 100,000, `PAY_GIL`). The advisor's constants (`SHIELD_AT_GAUGE` 88, `HEAL_UNDER` 0.6, `ITEM_HEAL_UNDER` 0.25, `CHEER_STACKS` 5)
are the line's own.

**What waits for RE's final check** (and each would need this bench re-run, because 17 Phoenix Downs is tuned to the engine as merged): the order of Zanmato and Auto-Life inside a hit (RE note 8.3); the dog's hit event
while it is untargetable (8.4); the seven Sister orders that are listed but not built (only Combine powers has a handler); the Pay roll's payment scale (the HUD has no payment picker yet and sends 0; the advisor's line sends
100,000); and any change to what a Sister's summon costs or does. The bench's cells and constants are pinned in `tests/unit/chapters/mirror-aeons-bench.test.ts` (the picks and the 17), so the day one moves a test says so.

**To repeat the table** (one cell takes about two minutes on a busy machine; the whole matrix about ten):

    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --acts
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 400 --phoenix 16 --cells kino01_72:nagi05_71 --lines advisor
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --luck 40 --cells kino01_72:nagi05_71 --lines advisor
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --stat 0.95 --cells kino01_72:nagi05_71 --lines advisor
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --cells kino01_72:nagi05_71 --lines advisor --ablate all
