# Chapter XV (the Den of Woe): options for Bailey's word, 2026-09-25 (measured)

**Game case: FFX-2 only.** The three shades, ATB and FFX-2 items. Evidence: branch
`chapter-gippal-ship-0925` (`D:/pyrefly-ch-gippal-ship`), `tests/unit/chapters/den-of-woe-options-bench.test.ts`
(the table below is copied from its output; run it with `PYREFLY_MEASURE=1`), `docs/plans/den-of-woe-bench.md`, and the ship check
`docs/concepts/chapters/den-of-woe/ship/CHECK.md` (blocker B1, major M1). **No boss number changed.**
Every option is **built and switched OFF**. With every switch off, the chapter is the one the ship check
passed. Its guide, formations and kit are identical, and the tactic's 994 decisions over 60 fights match
decision for decision.

## The short version

1. As shipped, **nobody wins the Den at human speed**: 0 of 200 first tries. Nooj's Lightfall does
   5,000 to everyone and kills Yuna (2,488 max HP) from full.
2. **Levels plus Hero Drinks together** are the best: about **1 in 4 on the first try (52/200)**, and
   **3 in 4 within five tries (153/200)**, retrying from Baralai as the game does.
3. The guide's Lightfall advice (M1) is **worse** on today's kit (0 against 15 of 200) and **better** once
   both options are on (52 against 39). So your pick on the kit decides whether the advice stays.

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
  kit options on it flips: the prep wins 52 and no prep wins 39.

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

## Recommendation: both kit options, keep the prep, keep the retry from Baralai

That is `DEN_OF_WOE_HERO_DRINKS = 3` and `DEN_OF_WOE_LEVEL_BONUS = 8`, with the other two switches
unchanged. It gives **about 1 in 4 on the first try and 3 in 4 within five**. It keeps the guide's
sourced advice, which pays with this kit (M1 settles as "keep"), and it keeps the game's own retry. It
rests on two estimates: the level raise and the Hero Drink count.

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

- "Den: both" (the recommendation, about 1 in 4 first try, 3 in 4 within five)
- "Den: both, retry from the shade"
- "Den: drinks, no prep" (no level raise; about 1 in 7 first try)
- "Den: no prep" (the M1 fix alone; about 1 in 13 first try)
- "Den: park" (stays unlisted)
