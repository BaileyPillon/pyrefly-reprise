# Chapter XV, the Den of Woe: ship layer (FFX-2 only), unlisted

**Game case: FFX-2 only** (AGENTS.md rule 14): the three shades, ATB, the FFX-2 status set. The
registry lines (scenes index, unlisted chapter and meta lists) are shared plumbing, "both".

Branch `chapter-gippal-ship-0925`, worktree `D:/pyrefly-ch-gippal-ship` (from `chapter-gippal-0925`,
`main` merged twice, last at 53b926fe). **Not listed** (the listing step is the driver's; commit
5c8706d6 is the pattern). No push, no deploy.

## What is built (Bailey's picks, D-148 / D-158 / D-182)

| Piece | File | Notes |
|---|---|---|
| Ship record | `src/data/chapter-den-of-woe-ship.ts` | lays `sceneKey: 'den-of-woe'` and the story over the engine record; music unchanged (GP16 stand-in `boss-shuyin`) |
| Scene | `src/scenes/den-of-woe.ts` | the installed O-3 A plate, Chapter V's framing, rigs and slots; the boss spot for each shade; shade heights from the options frames Bailey picked from (2.61 / 2.57 / 2.79); sparse live pyreflies |
| Story | `src/story/scripts/ffx2-den-of-woe.ts` | every line of `docs/plans/gippal-story-draft.md` ("As built" there lists the one lint edit and what differs) |
| Pause card | `src/data/chapter-meta-den-of-woe.ts` | hero plate B `pause/ch15-ffx2-den-of-woe`, numeral XV, three link objectives |
| Guide | `src/data/guides/ffx2-den-of-woe.ts` | Wait-split habit line first under Wait (main's `WAIT_SPLIT_HABIT_RULE`), four cited rules, link titles |
| Tactic | `src/engine/tactics/ffx2-den-of-woe.ts` | the bench's intended line; wins exactly as it does |
| Paintings | `src/data/ffx2/enemies/den-of-woe.ts` | `spriteKey`s now name `gippal-shade`, `baralai-shade`, `nooj-shade` (before, the chapter loaded none) |
| AI callout | `src/battle/ffx2/ai/den-of-woe.ts` | `baralai-count-seven`, once; no RNG draw, bench identical |
| Departures | none | the house pyrefly dissolve (the shades are "fused with pyreflies"; no other exit is sourced) |

## Measured

`docs/plans/den-of-woe-bench.md`: the Den on the intended line is **12 / 200** at bench speed and
**0 / 40** at human speed (Wait split); Nooj is the wall (1 / 40 fresh at human speed). The
sourced player-side options (Hero Drinks GP6 b, levels GP5 b) are numbers for Bailey, not built.

## Repair cycle 1 (2026-09-25): B1 and M1 of the ship check, built as options OFF

The ship check (`docs/concepts/chapters/den-of-woe/ship/CHECK.md`) found one listing blocker (B1:
nobody wins at human speed) and one major (M1: the guide's Lightfall prep measures worse than no
prep). Both are Bailey's call, never a boss number, so each answer is **built and switched OFF**, like
Trema's options. The sheet is `docs/plans/den-of-woe-options-2026-09-25.md`.

| Switch (Bailey's pick today) | Where | On, it does |
|---|---|---|
| `DEN_OF_WOE_HERO_DRINKS = 0` (GP6 a) | `src/data/ffx2/builds/den-of-woe.ts` | 3 (`[estimate]`) Hero Drinks in the bag; the tactic and guide drink one on Nooj before Lightfall |
| `DEN_OF_WOE_LEVEL_BONUS = 0` (GP5 a) | same | +8 levels (`[estimate]`, G-12 unsourced) |
| `DEN_OF_WOE_RETRY_FROM_LINK = false` (GP4 a build) | `src/data/ffx2/enemies/den-of-woe.ts` | Gippal and Nooj become `checkpointOnEntry` links (Trema's seam) |
| `DEN_OF_WOE_LIGHTFALL_PREP = true` (as shipped) | `src/data/guides/ffx2-den-of-woe.ts` | `false` drops the prep's two hints; the tactic keeps to Darkness |

All four are re-exported from `src/data/chapter-ffx2-den-of-woe.ts`. With them as they are, the
chapter is unchanged: the kit is `farplaneBuild` itself, the formations and the guide serialise
identically, and the tactic's 994 decisions over 60 fights match the ship commit's decision for
decision. Tests: `den-of-woe-options.test.ts` (the switches, each option through its factory, and the
option tactics run on the engine with their guides explaining every pick) and
`den-of-woe-options-bench.test.ts` (the sheet's table, 200 human seeds with retries: run it with `PYREFLY_MEASURE=1`, about 90 s alone and 3 min in the full suite; a small harness check always runs). A
headless check with all four switched on (then back off) showed the levels and max HP in effect, the
Hero Drinks drunk on Nooj, and a real-key RETRY after a Nooj loss that opened on Nooj in the entry
state.

**Recommendation in the sheet:** GP5 b + GP6 b, keep the prep, keep the retry from Baralai. That is
52/200 on the first try and 153/200 within five. **Listing still waits for Bailey's reply.**

## Frames (JPEG, `docs/concepts/chapters/den-of-woe/ship/`)

Headless Playwright on a private Vite server (port 5780, HMR and watch off), stopped by its PID.
Baralai at 1280x720, 1600x900, 2000x1012 and 390x844 (with the entrance callout, and
`-menu` at the command menu); Gippal and Nooj at 1600x900 and Nooj at 390x844 (enemy HP held at 1
and party HP kept full through the debug API to reach links 2 and 3); the pre story (narration and
the cave); the pause card's chapter tab at 1600x900 and 390x844. 0 page errors; a real Enter
sequence took a real turn (Yuna's Pray); on the phone no battle text under 14 px and no sideways
scroll.

## Open, disclosed

- **Phone framing:** at 390x844 with the command menu open, the phone framing keeps the three girls
  whole and cuts Baralai at the right edge (`fight-baralai-390x844-menu.jpg`). The slots are
  Chapter V's; the framing is the shared `phoneFraming.ts`. Not changed here.
- **Pause chapter tab:** the hero plate's face (focal x 0.25) sits under the left-hand chrome; the
  plate has no `PLATE_SHAPES` row (neither have Chapters XI to XIII's). A `plates.ts` row is the fix
  if Bailey wants the face clear.
- **Narration portrait:** lines 3 and 4 play without the Shuyin portrait (`narrate` has none).
- **Music:** the stand-in cue until a `boss-den-of-woe` sketch is picked by ear (rule 13).
- `scenes/index.ts` is at 399 lines; Chapters XI and XIV's branches add their own entries, so the
  integrator must compact one more entry.
