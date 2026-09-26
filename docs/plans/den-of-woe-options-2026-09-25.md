# Chapter XV (the Den of Woe): options for Bailey's word, 2026-09-25 (measured)

**Game case: FFX-2 only.** The three shades, ATB and FFX-2 items. Evidence: branch
`chapter-gippal-ship-0925` (`D:/pyrefly-ch-gippal-ship`), `tests/unit/chapters/den-of-woe-options-bench.test.ts`
(the table below is copied from its output; run it with `PYREFLY_MEASURE=1`), `docs/plans/den-of-woe-bench.md`, and the ship check
`docs/concepts/chapters/den-of-woe/ship/CHECK.md` (blocker B1, major M1). **No boss number changed.**
**Bailey picked on 2026-09-26: "I pick your recommendation for Den of Woe"**, that is "Den: both, drop
the prep". The chapter now ships with both kit options on and no Lightfall prep; the retry from the
lost shade stays off. See "Bailey's pick, 2026-09-26" at the end. Everything above that section is the
sheet as Bailey read it, with the re-check's four wording minors corrected.

## The short version

1. As shipped, **nobody wins the Den at human speed**: 0 of 200 first tries. Nooj's Lightfall does
   5,000 to everyone and kills Yuna (2,488 max HP) from full.
2. **Levels plus Hero Drinks together** are the best kit at every speed. With no prep (the recommended
   pair) that is about **1 in 5 on the first try (39/200)** and **4 in 5 within five tries (160/200)**,
   retrying from Baralai as the game does. (With the prep it is 52 and 153.)
3. The guide's Lightfall advice (M1) is a **separate call**, and the measured lean is to **drop it**.
   On every kit without both options it loses at every speed tested. With both options on it wins only
   one point: the first try at our 1.5 s speed (52 against 39). Faster or slower players, and players
   counted within five tries from Baralai, do better without it (for example 160 against 153 at 1.5 s).
   Within three tries at 1.5 s the prep still leads (125 against 115).

## How to read the numbers

- **Human** means the live default: Wait split, 1.5 s a menu, 0.5 s of it on the top list. There are
  200 seeds, each one a player. **Bench** means perfect instant play.
- **Within 3 / 5 tries** means the player tries again after a loss, and the retry is reseeded. The
  retry starts from Baralai (GP4 a, today) or from the shade they lost to (GP4 b).
- **Prep** means the guide's Lightfall advice as shipped: keep the Dark Knights above 5,000 HP, using
  Curaga and plain swings. **No prep** means Darkness to the end.

## The options

### GP6 b: 3 Hero Drinks in the bag (`DEN_OF_WOE_HERO_DRINKS`)

- **What changes:** the Chapter V bag gains 3 Hero Drinks. Near the end of Nooj, the tactic and the guide
  have a girl drink one. That makes her Invincible for 10.6 s, through Lightfall.
- **Sources:** Invincible is the sources' answer to Lightfall (research §5: the wiki and GamerGuides, who
  reach it with an Alchemist's Dark Matter mix). The preset has no Alchemist, and a Hero Drink gives the
  same status to one girl. **The count of 3 is an `[estimate]`.** Drinking at Nooj 4,500 HP or less is
  our own line, not game data.
- **Measured:** first try 28/200 without the prep and 18/200 with it. Nooj fought fresh: 86/200.

### GP5 b: +8 levels, 54 / 56 / 58 (`DEN_OF_WOE_LEVEL_BONUS`)

- **What changes:** each girl is 8 levels higher. The shades are 52 to 63, and the preset is 46 to 50.
- **Sources:** **none give a player level for the Den** (research §5, G-12). The size of the raise is an
  `[estimate]` in your name.
- **Measured:** first try 22/200 without the prep and 19/200 with it.

### GP4 b: retry from the shade you lost to (`DEN_OF_WOE_RETRY_FROM_LINK`)

- **What changes:** a loss to Gippal or Nooj retries that shade, from the state the party entered it on.
  It uses Trema's checkpoint seam. Today, and in the game, a loss sends you back to Baralai.
- **Sources:** none. It is a convenience, not the game.
- **Measured:** it helps only when the kit is weak. With both kit options on it adds almost nothing
  (160 against 153 of 200 within 5 tries).

### M1: drop the Lightfall prep from the guide and tactic (`DEN_OF_WOE_LIGHTFALL_PREP`)

- **What changes:** the Curaga hint and the plain-swing hint on Nooj go, and the Dark Knights stay on
  Darkness.
- **Sources:** the prep is the sources' advice (§5), made for a party with more HP.
- **Measured:** on today's kit, no prep wins 15/200 on the first try and the prep wins 0/200. With both
  kit options on, the prep leads only on the first try at 1.5 s (52 against 39). It trails at 1.0 s
  and 2.5 s, and within five tries at every speed (the speed table below).

## The Lightfall prep across human speeds (first try, 200 seeds, Wait split)

Our human model's speed is a guess, so the prep's verdict has to hold across it. It does not. The
table comes from `den-of-woe-options-bench.test.ts` ("across human speeds", `PYREFLY_MEASURE=1`). It
matches the ship check's re-check sweep (`CHECK.md`) cell for cell.

| Menu time / top list | Shipped kit | + Hero Drinks | + 8 levels | Both: first try | Both: within 5 tries |
|---|---|---|---|---|---|
| 1.0 s / 0.3 s | 4 vs **14** | 26 vs **38** | 24 vs **36** | 60 vs **66** | 170 vs **173** |
| 1.5 s / 0.5 s (the sheet's) | 0 vs **15** | 18 vs **28** | 19 vs **22** | **52** vs 39 | 153 vs **160** |
| 2.5 s / 0.8 s | 2 vs **14** | 13 vs **15** | 7 vs **33** | 38 vs **48** | 126 vs **134** |

Each cell reads **prep vs no prep**, and the higher one is in bold. "Both" is the best kit at every
speed with either line. Within five tries means retrying from Baralai, as the game does.

## The whole table (human, 200 seeds; bench and Active for reference)

| Kit, line | First try | Within 3 / 5, from Baralai | Within 3 / 5, from the lost shade | Bench | Active 1.5 s |
|---|---:|---|---|---:|---:|
| Shipped kit, prep (as shipped) | 0 | 4 / 4 | 9 / 21 | 12 | 0 |
| Shipped kit, no prep (M1) | 15 | 38 / 50 | 38 / 72 | 26 | 0 |
| + Hero Drinks, prep | 18 | 37 / 59 | 65 / 91 | 63 | 0 |
| + Hero Drinks, no prep | 28 | 64 / 91 | 74 / 115 | 76 | 0 |
| + 8 levels, prep | 19 | 46 / 87 | 55 / 85 | 45 | 2 |
| + 8 levels, no prep | 22 | 69 / 110 | 81 / 114 | 73 | 7 |
| **Both, prep** | **52** | **125 / 153** | 119 / 160 | 96 | 5 |
| Both, no prep | 39 | 115 / 160 | 114 / 158 | 102 | 7 |

**Active is not rescued by anything.** Under the Active setting (not the default) no mix passes 7 of
200. A player who picks Active will almost never clear the Den.

## Recommendation: two separate calls

**1. The kit: both options, and keep the retry from Baralai.** That is `DEN_OF_WOE_HERO_DRINKS = 3`
and `DEN_OF_WOE_LEVEL_BONUS = 8`, with the retry switch unchanged. "Both" is the best kit at every speed
tested, and it keeps the game's own retry. It rests on two estimates: the level raise and the Hero
Drink count. With the prep dropped (call 2 below) the pair gives **about 1 in 5 on the first try and 4
in 5 within five (39 / 160)**; with the prep kept it is about 1 in 4 and 3 in 4 (52 / 153).

**2. The Lightfall prep: drop it (the measured lean).** That is `DEN_OF_WOE_LIGHTFALL_PREP = false`.
Picking the kit does not settle this. The prep is the sources' advice (research §5), made for a
party with more HP than the Chapter V preset. With both kit options on, it helps only a player at our
1.5 s speed on the first try (52 against 39). Faster and slower players, and players counted within
five tries from Baralai, do better without it (66 / 39 / 48 first try against 60 / 52 / 38, and 173 / 160 / 134 within five
against 170 / 153 / 126). On every other kit, no prep wins at every speed. Keeping the prep would
teach advice that costs or ties wins for most players. The honest price of dropping it: the guide no
longer repeats a line the sources give.

If you would rather not raise the levels, the next best mix is **Hero Drinks, no prep**. That is
**1 in 7 first try, about 1 in 2 within five (91/200)**, or 115/200 with the retry from the lost shade.

## Checked in the live game (headless, all four switches on for the check, then back off)

On a private dev server (port 5781, stopped):

- Levels 54 / 56 / 58 and max HP 2,824 / 6,456 / 6,654 are in effect.
- The tactic drank Hero Drinks on Nooj, with 7 wins in 12 seeds at bench speed.
- Seed 3 lost to Nooj. A real Enter on RETRY opened Nooj at 23,800 HP with the party at 1,236 / 1,758 /
  2,443, which is the state it entered on. There were 0 page errors.

The frames are in `D:/Tools/pyrefly-scratch/chapters/den-of-woe-repair/shots/`.

## To ship, once you pick

1. Flip the switches you named. Each one is a single line.
2. Update `den-of-woe-options.test.ts`'s "at Bailey's pick" block to the new picks.
3. Re-run the benches, then do the listing step (the driver's).

The kit options change only Chapter XV.

## Replies you can send

The kit and the prep are separate words; name both. A bare "Den: both" does not settle the prep: read
alone it would keep the prep as then shipped (ON), which the sheet advises against, so the driver asks
rather than assume the lean. (Bailey's reply named the recommendation, which is both calls.)

- "Den: both, no prep" (the recommendation: 39 first try and 160 within five at 1.5 s; ahead at 1.0 s
  and 2.5 s)
- "Den: both, keep the prep" (52 first try and 153 within five at 1.5 s; behind at the other speeds)
- "Den: both, no prep, retry from the shade"
- "Den: drinks, no prep" (no level raise; about 1 in 7 first try)
- "Den: no prep" (the M1 fix alone; about 1 in 13 first try)
- "Den: park" (stays unlisted)

## Bailey's pick, 2026-09-26

**Bailey, ~00:05 EDT: "I pick your recommendation for Den of Woe".** The recommendation was "Den: both,
drop the prep". **FFX-2 only** (Chapter XV). Built on `chapter-gippal-ship-0925` after merging `main`
30420871 (commit `168ea0f2`), in commit `f61b85e5`:

| Switch | Value | What it means |
|---|---|---|
| `DEN_OF_WOE_HERO_DRINKS` | **3** `[estimate]` | 3 Hero Drinks in the Chapter XV bag. Near the end of Nooj (4,500 HP or less, our own line) a girl Lightfall would kill drinks one: Invincible, the sources' answer, reached with a Hero Drink because the preset has no Alchemist |
| `DEN_OF_WOE_LEVEL_BONUS` | **8** `[estimate]`, in Bailey's name | Yuna 54, Rikku 56, Paine 58 (max HP 2,824 / 6,456 / 6,654) |
| `DEN_OF_WOE_LIGHTFALL_PREP` | **false** | no Curaga or plain-swing hint on Nooj; the Dark Knights stay on Darkness |
| `DEN_OF_WOE_RETRY_FROM_LINK` | **false** (not picked) | a loss retries from Baralai, as the game does |

The guide's Lightfall rule, the pause and prep tip, and the tactic teach the picked line. No boss number
changed. `farplaneBuild` itself is untouched; the kit is a copy with the two options on.

### Measured on the shipped record (`den-of-woe-shipped-bench.test.ts`, `PYREFLY_MEASURE=1`, 200 seeds)

| Speed | First try | Within 3 / 5, retry from Baralai |
|---|---:|---|
| Human, Wait split 1.0 s / 0.3 s | 66 | 136 / 173 |
| **Human, Wait split 1.5 s / 0.5 s (the live default)** | **39** | **115 / 160** |
| Human, Wait split 2.5 s / 0.8 s | 48 | 99 / 134 |
| Bench speed (D = 0) | 102 | 173 / 199 |
| Active, 1.5 s | 7 | 15 / 20 |

This is what the sheet predicted: 39 first try and 160 within five at 1.5 s, and every cell of the
speed table, reproduced exactly after the merge of `main`. The options bench prints the table above
unchanged. At the live default about **1 in 5 clear on the first try and 4 in 5 within five tries**. The
Active setting is still not rescued (7 of 200).

### One engine finding that moves these numbers (not fixed here; for the driver)

In `src/battle/ffx2/resolve.ts` `targetForHit`, an all-target move re-filters the living list on every
hit and takes `living[hitIndex % living.length]`. When an earlier target dies mid-move, a later hit
wraps back to a girl already hit, and the last girl is never hit. It was seen live (seed 6): Lightfall
hit Yuna (Invincible, immune), killed Rikku, then hit Yuna again, and **Paine took nothing**. The same
code is on `main`, so it is shared FFX-2 plumbing and affects every all-target move in every FFX-2
chapter. It flatters the player. A scratch copy with each target hit once (not committed) measures
the shipped Den at **34 first try and 102 / 149 within 3 / 5** at 1.5 s (59 / 169 at 1.0 s, 45 / 131
at 2.5 s, bench 94). That is still about 1 in 6 first try and 3 in 4 within five, and still the best kit.

### Re-measured on main after the engine fix (2026-09-26, Bailey's D-193 option B)

Bailey picked the engine fix ("I'll go with all your recommendations", D-193), and branch
`ffx2-engine-fixes-0926` is merged on main (merge `8235ad63`): each girl now takes an all-target hit
once (IC-2), so Lightfall no longer skips the last girl. IC-1's immune-hit switch and the menu-cancel
switch stay OFF. **FFX-2 only.** The shipped record, re-run on main (`den-of-woe-shipped-bench.test.ts`,
`PYREFLY_MEASURE=1`, 200 seeds, retry from Baralai):

| Speed | First try | Within 3 / 5 | Before the fix |
|---|---:|---|---|
| Human, Wait split 1.0 s / 0.3 s | 59 | 134 / 169 | 66, 136 / 173 |
| **Human, Wait split 1.5 s / 0.5 s (the live default)** | **34** | **102 / 149** | 39, 115 / 160 |
| Human, Wait split 2.5 s / 0.8 s | 45 | 98 / 131 | 48, 99 / 134 |
| Bench speed (D = 0) | 94 | 168 / 196 | 102, 173 / 199 |
| Active, 1.5 s | 6 | 12 / 16 | 7, 15 / 20 |

Every cell the scratch copy above and `docs/plans/ffx2-engine-fixes-2026-09-26.md` predicted is
exact (34 first try, 102 / 149 at 1.5 s; 59 / 169 and 45 / 131; bench 94). At the live default about
**1 in 6 clear on the first try and 3 in 4 within five tries**. No Den number changed; the table in
"Measured on the shipped record" above is the record at the pick and stays as it was.

### The real flow (production build, headless GPU, fresh profile each run)

The chapter is unlisted, so every run opened it with `window.__pyrefly.gotoChapter`. Frames:
`docs/concepts/chapters/den-of-woe/ship/picked/`. All runs had 0 page errors, 0 console errors and 0
HTTP errors, and every image decoded (64 to 67 a run).

- **1600x900 and 390x844:** prep shows LV 54 / 56 / 58. The Items tab, reached with the Right key,
  lists Hero Drink ×3. The prep CHAPTER tab carries the new tip at both sizes, and the pause GUIDE tab carries it at 1600x900. Then the pre
  scene, 8 lines, each advanced by Enter. The battle opens at levels 54 / 56 / 58 with max HP
  2,824 / 6,456 / 6,654, and the first menu comes up in about 11 s. One real action by Enter presses:
  Yuna, Pray on the party.
- **The drink (seed 6; debug API: Baralai and Gippal at skip speed, then normal speed on Nooj):** Yuna
  drank a Hero Drink at Nooj 524 HP and was Invincible when Lightfall came. Both hits on her were
  "miss, immune", and she kept 2,151 HP. Rikku (4,527 HP, no drink yet) was KO'd.
- **A win (seed 6, the shipped tactic at skip speed, real Enter through the pre scene, the post scene
  and results):** all three shades, then the post scene (Paine's "Enough. Let them rest." first). The
  results read "Victory, NEW BEST", and the flow resolved `victory` over 3 links.

Disclosed, not changed here (shared presentation):

- At 390x844 the pause GUIDE tab's "designed line" has zero height, the same on Chapter VI (listed).
  The tip still shows on the phone prep CHAPTER tab.
- Yuna's party row shows four chips at most. With Protect, Shell and Darkness up, the INV chip is cut
  off at the row's edge, so Invincible is not visible there.
- The "acts next: Lightfall" card read all three girls KO for a moment after Yuna's drink had landed.
  Its figures match a forecast computed before the drink (stale, not refreshed on the status change).
  The cause is inferred from the figures and was not proved on the engine.
