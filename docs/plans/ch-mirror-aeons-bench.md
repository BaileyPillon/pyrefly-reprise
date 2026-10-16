# Mirror Aeons: the difficulty bench (Chapter XXVII, FFX, listed; "Dark Mirror")

**Game case: FFX only** (AGENTS.md rule 14). The harness measures the real engine, with the Dark Aeons' AI coded from `research/re-ffx-dark-aeons.md` (nothing in it invented), Yuna's Yojimbo and Magus Sisters as the
reverse-engineering session's (RE's) engine plays them (lane FFX-K), and the party preset of `data/ffx/builds/mirror-aeons.ts`. **No boss row, formation or script is ever touched to reach a number**: the levers are the party's
own estimates and WHICH of the game's own fights each act uses (the plan: `docs/plans/ch-mirror-aeons-review.md` section 3).

> **THE TABLE OF RECORD IS HELD (the release driver, 2026-10-15, after RE's independent check of its engine at d8fa5b69).** Today the Sisters can only Combine or Dismiss (the seven other orders are `enabled: false`, and every
> bar is 0 after a Combine), and a landed Zanmato of Yuna's Yojimbo one-shots the first target only (RE's open item 7). **RE's note** (`research/re-ffx-zanmato-and-orders.md`) **has since settled what the game does: a landed player Zanmato hits every
> legal enemy of one group with Death at 255 and Slice does nothing in this build, so it ENDS a Dark fight at once; the driver keeps that as faithful and rare (5 in 64 per Pay at the extreme: all 9,999,999 gil,
> compatibility 255, byte 4, hire answer 1; more with a full gauge; never from a free attack against such foes).** In Act II the engine's first-target kill already ends the fight (Dark Yojimbo is the one legal target: his dog
> is untargetable), so the Pay-on numbers already include that rule; the engine's group effect is still to land. RE is fixing the group effect and the orders on its branch as fast-forwards, and **a difficulty measured on that engine is not the chapter's.** So: the harness is built for every cell, **one smoke cell proves it runs** (below), and the full table
> is left for the re-run the driver triggers when RE's follow-up has landed (the recipe below). Everything under "PRELIMINARY" was measured before the hold: it is kept only as the reason for the placeholder constants
> (`MIRROR_ACT_I`, `MIRROR_ACT_II`, `ENDGAME_PHOENIX_DOWNS`) and as the shape to expect. **It is not the table of record and no decision should rest on it.**

Bailey, 2026-10-15: "i like the mirror match but make the difficulty appropriate not too easy not too hard". The target the plan turned that into: **a full run (Act I, the heal, Act II) with the advisor's line is won about
70 percent of the time (60 to 80 accepted), and a careless line (the plain Attack on the first living enemy, no aeon, no item) mostly loses (under 20 percent).** Prefer the game's own formations; the trio with its gauges
at 0 (OUR adjustment) only if no faithful cell lands in the band.

## What is built

- **The harness**: `tests/unit/helpers/mirrorAeonsBench.ts` plays one act, or both chained the way the chapter chains them (the real engine, `setupForNextLink`, the heal Act II's entry gives), with a *line* over as many
  seeds as asked; `tools/mirror-aeons-bench.mjs` prints the tables from it; `tests/unit/chapters/mirror-aeons-bench.test.ts` pins it.
- **The cells.** Act I: the faithful trio `kino00_70` (gauges 100), the faithful pair `kino01_72`, the trio at gauge 0 `kino00_70-g0` (OUR adjustment, the one cell that is not a game formation), and the single sisters
  (`kino05_71` Mindy, `kino05_70` Sandy, `kino01_71` Cindy). Act II: the Dark Yojimbo tiers `nagi05_70`, `_71`, `_72` (and `_73`, `_74`, which the plan leaves out). A chain is any Act I cell then any tier.
- **The lines.** `advisor`: the shipped tactic (`engine/tactics/mirror-aeons.ts`, the same code the Auto strategy runs), **Pay ON**: Yojimbo is the first aeon sent in against a Zanmato and is paid 100,000 a turn. `nopay`:
  **Pay OFF, Yojimbo unpaid**: he is sent in first as the shield and never paid, so he is sent away at his first menu turn (his own free attacks, which the game never makes a Zanmato against such foes, are all he gets) and
  the shield leaves before the blow. `noyojimbo`: **Pay OFF, Yojimbo never sent in**: the story aeons and the Sisters are the shield, nothing is paid, so **no Zanmato of the player's can roll**. `careless`: `Attack` on the first
  living enemy, no aeon, no item. Each is also an ablation of the shipped line (`ABLATIONS` in the helper: `shield-on-full`, `heal-45`, `no-auto-life`, `no-cheer`, `story-aeons-first`, `items-only`, `no-pay`, `no-yojimbo`).
- **The levers**: `--phoenix N` (the bag's Phoenix Downs, the main one), `--luck N`, `--stat F` (a share of four stat caps), and the choice of cell.
- **The tests**: the harness, the reach measurements (what a blade and a spell land: the hit rule is the game's) and **one smoke cell** (the shipped cell runs for all four lines, every fight ends) are always on; **the rate
  pins are off unless `MIRROR_AEONS_BENCH=1`** (the shipped cell's band, the Pay-off lines, the trio and the singles), so RE's follow-up cannot turn the suite red before the driver has re-run the table.

## The re-run recipe (the driver triggers it when RE's follow-up has landed)

1. Merge `origin/re-parity-ffx-yojimbo-sisters` into `ch-mirror-aeons`; run RE's six parity files and the chapter's suites (`tests/unit/chapters/mirror-aeons-*.test.ts`).
2. The whole matrix, Pay ON (about ten minutes; every Act I cell against every tier, and each act alone):
   `node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --acts --lines advisor,careless`
3. Act II both ways: with Pay ON and Pay OFF (the table must say so; **label the Pay-on rows "provisional until RE's Zanmato fix" until that fix is in**, after which they are final):
   `node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --acts --lines advisor,nopay,noyojimbo --cells kino01_72:nagi05_70,kino01_72:nagi05_71,kino01_72:nagi05_72`
4. If another Sister order now works and fills the bars, the shipped line may use it only with a measured gain (a design change of the line: the driver's call; `--ablate all` prints what each rule is worth).
5. Pick the Act I cell and tier nearest 70 percent inside 60 to 80 for the advisor's line (`pickCell`); the adjusted trio only if no faithful cell lands in the band; the Phoenix Downs is the lever (`--phoenix 14` to
   `20`, 400 seeds around the pick; Luck and the stat share are cliffs, not dials). Set `MIRROR_ACT_I`, `MIRROR_ACT_II` and `ENDGAME_PHOENIX_DOWNS`, update the pins in the bench test, and run it with the rate pins on:
   `MIRROR_AEONS_BENCH=1 node node_modules/vitest/vitest.mjs run tests/unit/chapters/mirror-aeons-bench.test.ts --maxWorkers=4 --testTimeout=240000`
6. Write the table of record here, replacing the PRELIMINARY sections, and update the handoff (`docs/handoff/ch-mirror-aeons.md`, section 4) and the placeholder notes in `data/ffx/builds/mirror-aeons.ts` and
   `data/ffx/mirror-aeons-ids.ts`.

## The smoke cell (run to prove the harness; nothing is concluded from 20 seeds)

`node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 20 --phoenix 17 --cells kino01_72:nagi05_71 --acts --lines advisor,nopay,noyojimbo` (about 20 seconds):

| Act I then Act II | advisor (Pay ON) | nopay (Yojimbo unpaid) | noyojimbo |
|---|---|---|---|
| kino01_72 then nagi05_71 | 60 percent (12 of 20; lost in I 6, in II 2) | 35 percent (7 of 20; 6 / 7) | 60 percent (12 of 20; 6 / 2) |

| Act alone | advisor | nopay | noyojimbo |
|---|---|---|---|
| kino01_72 | 70 percent (14 of 20) | 70 percent (14 of 20) | 70 percent (14 of 20) |
| nagi05_71 | 100 percent (20 of 20) | 45 percent (9 of 20) | 100 percent (20 of 20) |

It ran: every fight ended, the counts add up, the three lines differ where they should (Act I is the same for all three, since no Yojimbo is sent in there; Act II differs by line).

## PRELIMINARY: the run before the hold (the engine as merged at d8fa5b69)

The sections below were measured before the driver's hold, on 200 or 400 seeds a cell, and are the evidence behind the placeholder constants only.


### How it was measured

- **The harness** is `tests/unit/helpers/mirrorAeonsBench.ts` (the same code `tests/unit/chapters/mirror-aeons-bench.test.ts` pins), driven from the command line by `tools/mirror-aeons-bench.mjs` (Node with
  `--experimental-transform-types`, because the engine's sources use parameter properties). One fight takes 60 to 200 ms; a seed is one fight, seeds 1 to N.
- **A chain** is Act I on seed s, then Act II on seed s+1 through the real chain mechanics (`setupForNextLink`: the party as Act I left it, the heal, the carried flags); a loss in either act is a loss of the chain. Where a
  table says "alone", the act is played from the fresh preset.
- **The lines.** *advisor* is the shipped tactic (`src/engine/tactics/mirror-aeons.ts`, `mirrorAeons`: the same code the Auto strategy runs): **Pay ON**, Yojimbo the first aeon sent in against a Zanmato and paid 100,000 a
  turn. *no Yojimbo* (`no-yojimbo`) is the same line with Yojimbo never sent in: the story aeons and the Sisters are the shield, nothing is paid, **no Zanmato of the player's can roll**. *Yojimbo unpaid* (`no-pay`) sends him in
  first as the shield and never pays him: on his first menu turn he is sent away (his own free attacks, which the game never makes a Zanmato against such foes, are all he gets), so the shield leaves before the blow. *careless*
  is `Attack` on the first living enemy, no aeon, no item. All read only what the menu offers.
- **Sampling.** 200 seeds a cell (95 percent interval of about plus or minus 6 points at 74 percent); the pick is also run on 400 (plus or minus 4). Two runs of the same seeds are identical (the engine is deterministic), so
  differences between runs are the code's or the lever's, never luck; differences between different seed sets are noise.
- **Not touched:** every boss row, formation and script (the Dark Aeons' numbers are the game's), the party's stat caps, and the advisor's line (its constants were set before the bench ran the final cells; the section "The
  advisor's line" shows what each rule is worth).

### The table: Act I cell by Act II tier, the whole chapter, 17 Phoenix Downs, 200 seeds a line

| Act I | Act II tier | advisor, **Pay ON (provisional)** | **Pay OFF: no Yojimbo (final)** | Pay OFF: Yojimbo unpaid | careless |
|---|---|---|---|---|---|
| faithful trio `kino00_70` (gauges 100) | 1, 2 or 3 | 0 of 200 (lost in I 200) | 0 of 200 (Pay never enters: Act I is lost) | 0 of 200 | 0 of 200 |
| **faithful pair `kino01_72`** | 1 `nagi05_70` | 69 percent (138; lost in I 26, in II 36) | 66 percent (132; 26 / 42) | 17 percent (34; 26 / 140) | 0 of 200 |
| **faithful pair `kino01_72`** | **2 `nagi05_71`** | **74 percent** (147; 26 / 27) | **69 percent** (138; 26 / 36) | 20 percent (39; 26 / 135) | 0 of 200 |
| **faithful pair `kino01_72`** | 3 `nagi05_72` | 77 percent (153; 26 / 21) | 74 percent (148; 26 / 26) | 18 percent (36; 26 / 138) | 0 of 200 |
| trio at gauge 0 `kino00_70-g0` (OUR adjustment) | 1, 2 or 3 | 0 of 200 (lost in I 200) | 0 of 200 | 0 of 200 | 0 of 200 |

Each act alone (fresh preset, 17 Phoenix Downs, 200 seeds):

| Act | advisor, **Pay ON (provisional)** | **Pay OFF: no Yojimbo** | Pay OFF: Yojimbo unpaid | careless |
|---|---|---|---|---|
| faithful trio `kino00_70` | 0 of 200 | 0 of 200 | 0 of 200 | 0 of 200 |
| **faithful pair `kino01_72`** | **87 percent** (174) | 87 percent (174) | 87 percent (174) | 0 of 200 |
| trio at gauge 0 `kino00_70-g0` | 0 of 200 | 0 of 200 | 0 of 200 | 0 of 200 |
| tier 1 `nagi05_70` | 97 percent (193) | 96 percent (192) | 28 percent (57) | 0 of 200 |
| tier 2 `nagi05_71` | 97 percent (194) | 97 percent (193) | 28 percent (56) | 0 of 200 |
| tier 3 `nagi05_72` | 100 percent (200) | 100 percent (199) | 23 percent (46) | 0 of 200 |

What the tables say together:

- **Act II is easy alone (97 percent, Pay on or off) and hard in the chain (about 84 percent of the survivors of Act I win it) because the chain arrives with the Phoenix Downs Act I spent**; the heal gives back HP, MP and the
  aeons, not the bag. The bag is the chapter's budget, which is why it is the lever.
- **Pay barely decides Act II**: alone, Pay ON and the line that never sends Yojimbo in are within one seed in a hundred; in the chain Pay ON is 3 to 5 points ahead in every tier (66 to 69, 69 to 74, 74 to 77), which is
  the most the instant wins of a landed Zanmato can be worth in the number (the game's own rule, kept; rare per Pay).
- **Calling Yojimbo and not paying him is the worst thing a player can do** (20 percent): the shield is gone at his first menu. Today the HUD's Pay row does exactly that (it sends a payment of nothing: the handoff's open item 1).

### Why the others are not the pick

- **The faithful trio `kino00_70` (gauges 100) is out of the advisor's reach: 0 of 200 with 17 Phoenix Downs and 1 of 100 with 99.** The reasons are in the engine, not in a number: the Delta Attack is the third enemy action
  of the battle, so it lands before any plan can; it is six hits of up to 99,999 on whatever stands in front (a Sister of Yuna's as the shield takes it once; **the second Delta Attack has no shield left, because Mindy and
  Sandy kill a lone aeon first**); the Dark Aeons' special moves (their cap is 99,999) are one-shots on a 9,999-HP member; Camisade drains MP. This is the hardest rung of the game's own ladder and the tactic cannot beat it,
  so by Bailey's "not too hard" it cannot be the chapter's Act I. It is registered and plays (the bench's cell), so a human who is better than the line is not locked out of it by data.
- **The trio with its gauges at 0 (`kino00_70-g0`, the one cell that is OUR adjustment, not a game formation; the row is `SISTER_ADJUSTED_FORMATIONS`) does not help: 0 of 200 with 17 Phoenix Downs, 4 of 100 with 99.** The Delta
  Attack only comes later (tick 45, after five rounds), but three Dark Aeons at once is still a storm the line cannot weather. **It is not shipped and nothing in the player's text names it**; it stays as a bench cell. The
  brief's rule (use it only if no faithful cell lands in the band) is moot: three faithful cells land in the band.
- **The single sisters are too easy to be an Act** (17 Phoenix Downs, 100 seeds): Sandy alone is won by the advisor's line 100 of 100 and by the careless line 100 of 100; Cindy alone 100 and 98; Mindy alone is won by the
  advisor 100 of 100 and by the careless line 0 of 100 (no plain blow lands on Evasion 240), and a single sister into tier 2 is 95 to 96 percent for the advisor (above the band).
- **Tier 1 and tier 3** are in the band too (Pay OFF 66 and 74 percent) and are the one-constant alternatives (see the recommended cell).

### The levers, on the placeholder cell (whole chapter)

**Phoenix Downs in the bag (the main lever; Luck 60, stats at the caps; 200 seeds a cell)**

| Phoenix Downs | advisor, **Pay ON (provisional)** | **Pay OFF: no Yojimbo** | advisor lost in Act I / in Act II |
|---:|---|---|---|
| 10 | 12 percent (23) | | 159 / 18 |
| 14 | 44 percent (87) | | 81 / 32 |
| 15 | 55 percent (110) | 52 percent (103) | 58 / 32 |
| 16 | 68 percent (136) | 65 percent (130) | 36 / 28 |
| **17** | **74 percent (147)** | **69 percent (138)** | 26 / 27 |
| 18 | 80 percent (159) | 78 percent (155) | 13 / 28 |
| 19 | 84 percent (168) | 82 percent (164) | 13 / 19 |
| 20 | 88 percent (175) | 85 percent (170) | 8 / 17 |
| 30 | 94 percent (188) | | 3 / 9 |
| 99 | 94 percent (188) | | 3 / 9 |

Each Phoenix Down is worth 3 to 13 points near the pick, and the curve flattens at 94 percent (a line that never runs out of Phoenix Downs still loses 6 percent of runs: the Zanmato and Passado one-shots). **17 is the pick**:
the Pay-off line is on the target and the Pay-on line 4 over, both inside the band by more than a Phoenix Down's worth; 16 leaves Pay OFF at 65 and 18 puts Pay ON at 80, the edge of the band.

**Luck (every member's; the preset ships 60; the advisor's line, Pay ON; 200 seeds)**

| Luck | whole chapter | lost in Act I / in Act II |
|---:|---|---|
| **60** | **74 percent (147)** | 26 / 27 |
| 40 | 32 percent (64) | 94 / 42 |
| 20 | 4 percent (7) | 176 / 17 |
| 0 | 0 of 200 | 199 / 1 |

**Stat fraction (Strength, Defense, Magic and Magic Defense at this share of the caps; 17 Phoenix Downs; the advisor's line, Pay ON; 200 seeds)**

| Share | whole chapter | lost in Act I / in Act II |
|---:|---|---|
| **1.00** | **74 percent (147)** | 26 / 27 |
| 0.95 | 5 percent (9) | 89 / 102 |
| 0.90 | 1 percent (1) | 191 / 8 |
| 0.80 | 0 of 200 | 200 / 0 |

Luck and the stat fraction are **cliffs, not dials**: a fifth less Luck or five percent less of four stats turns three runs in four into one in three or one in twenty. The party the preset describes (every stat at the cap, Luck
60) is the edge the fight is balanced on. Both are kept as they were and the Phoenix Downs are the lever.

### The advisor's line: what each rule is worth

The same cell (pair, tier 2, 17 Phoenix Downs, 200 seeds), the shipped line with one rule taken away at a time (`ABLATIONS` in the helper; `--ablate all` in the tool):

| Line | whole chapter | lost in Act I / in Act II |
|---|---|---|
| **shipped (Pay ON)** | **74 percent (147)** | 26 / 27 |
| an aeon goes in only when his blade is full (100, not 88) | 55 percent (109) | 26 / 65 |
| heal under 45 percent of a member's HP (not 60) | 55 percent (109) | 48 / 43 |
| no Auto-Life upkeep | 48 percent (95) | 17 / 88 |
| no Cheer stacks against Dark Yojimbo | 22 percent (43) | 26 / 131 |
| the story aeons go in before Yojimbo | 69 percent (138) | 26 / 36 |
| healing from the bag only (no Curaga, Cura or Cure) | 4 percent (7) | 174 / 19 |
| **Pay OFF: Yojimbo never sent in** | **69 percent (138)** | 26 / 36 |
| **Pay OFF: Yojimbo sent in first, never paid** | 20 percent (39) | 26 / 135 |

Every rule is load-bearing, and none is a secret: they appear in the guide's hints (`data/guides/mirror-aeons.ts`) in the player's words.

### What is an estimate, and what waits

**Estimates (named constants, one place each; none is a game number):** 17 Phoenix Downs (the lever, measured above); the party at the caps with Luck 60 (`ENDGAME_LUCK`); the Sisters' start gauges at 100 and
Yojimbo's at 0 (`SISTERS_START_GAUGE`, `YOJIMBO_START_GAUGE`: the Sisters' first menu offers Combine powers only while all three gauges are full, and the orders that could fill a bar are not carried out); the Sisters' start
motivation 50 (`SISTERS_START_MOTIVATION`: RE marks it unsourced; it sets Combine powers' chance, 200 plus motivation in RE's kernel, and was not measured as a lever); Yojimbo's start compatibility 128 (**strongly indicated
by the owner's saves, live confirmation pending**; a fixed per-chapter value, never persisted across sessions) and hire answer 2; the party's gil 1,500,000 (the line pays Yojimbo 100,000, `PAY_GIL`). The advisor's constants
(`SHIELD_AT_GAUGE` 88, `HEAL_UNDER` 0.6, `ITEM_HEAL_UNDER` 0.25, `CHEER_STACKS` 5) are the line's own.

**What waits for RE** (and each would need this bench re-run, because 17 Phoenix Downs is tuned to the engine as merged): **the Zanmato fix** (the Pay-on rows; see the notice at the top); the order of Zanmato and Auto-Life inside
a hit (RE note 8.3); the dog's hit event while it is untargetable (8.4); the Sisters' seven other orders (listed, greyed, not carried out: nothing here uses one); the Pay roll's payment scale (the HUD has no payment picker yet and
sends 0, so Yojimbo leaves; the advisor's line sends 100,000); and any change to what a Sister's summon costs or does. The bench's cells and constants are pinned in `tests/unit/chapters/mirror-aeons-bench.test.ts` (the picks,
the 17, the Pay-off lines), so the day one moves a test says so.

**To repeat the tables** (one cell takes about two minutes on a busy machine; the whole matrix about ten); the lines are `advisor` (Pay ON), `nopay` (Yojimbo unpaid), `noyojimbo` (Pay OFF, no Yojimbo) and `careless`:

    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --acts --lines advisor,careless
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --acts --lines advisor,nopay,noyojimbo --cells kino01_72:nagi05_70,kino01_72:nagi05_71,kino01_72:nagi05_72
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 16 --cells kino01_72:nagi05_71 --lines advisor,noyojimbo
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 400 --phoenix 17 --cells kino01_72:nagi05_71 --lines advisor,noyojimbo,careless
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --luck 40 --cells kino01_72:nagi05_71 --lines advisor
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --stat 0.95 --cells kino01_72:nagi05_71 --lines advisor
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 200 --phoenix 17 --cells kino01_72:nagi05_71 --lines advisor --ablate all
    node --experimental-transform-types tools/mirror-aeons-bench.mjs --seeds 100 --phoenix 17 --acts --cells kino05_71:nagi05_71,kino05_70:nagi05_71,kino01_71:nagi05_71
