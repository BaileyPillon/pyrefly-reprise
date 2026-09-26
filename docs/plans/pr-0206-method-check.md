# PR-0206 method check (rule 15): no advisor card at Chapter I's first decision at 2000x1012

Written 2026-09-26, paper only. **Game case: FFX** (the FFX HUD's advisor placement,
`src/ui/ffx/FFXBattleHud.ts` `placeAdvisor`; FFX-2 places its card by a different rule). Chapter I;
possibly any FFX chapter at a wide shape. It is new in round 13, not yet stalled; the program asks
for a check because the one repro used the wrong seed.

## The issue as the critic measures it

Round 13 (R13-UI-02): live, fresh profile, 2000x1012, "seed 1": at the first command menu (Tidus)
no NEXT BEST MOVE card is visible, the card's text is in the DOM, `measureCardVsRows` returned
`card = null`, and an `N HIDE MOVES` chip sits under the party. Round 12 at the same shape showed a
316x254 card. Acceptance: in Chapter I at 1600x900 and 2000x1012 the first-menu card is visible
with a non-zero rect on no party face; N hides and shows it with matching chip text; the safe-zones
test gains a 2000x1012 case.

## Why the repro is weak

- **The seed was not the battle's seed.** The harness recorded `__pyrefly.seed()`, not the battle
  state's seed (PR-0202). Round 13's own gap pass showed that with the seed truly pinned to 1 Tidus
  acts first, while the recorded runs opened with Flux's Lance of Atrophy and a held callout. So the
  "first decision" in round 13 and round 12 were probably different boards, and the chief's note
  already downgrades the comparison.
- **The suspected cause was ruled out.** The Chapter XII readout selectors added in 1a680e41..b975397b
  exist only when the Omnis readout is wired, so they cannot be the obstacle in Chapter I.

## Where the card can disappear (traced today)

`placeAdvisor` hides the card only when `solveAdvisorPlacement().zone` is null, and leaves the chip
up. That solve is **held for the whole decision**, keyed on the decision, the HUD scale and every
panel's box rounded to the grid, and **deliberately not** on where the fighters stand. So two
readings fit the observation:

1. **A stale decline.** The zone was solved at the instant the decision opened, while something
   transient was up (the coach mark, a held opening callout, a camera still settling so the sprites
   projected larger), found no room, and the held answer never re-solved when that thing went away,
   because none of it is in the key. The chip then describes a card the solver took down.
2. **A real decline.** At 2000x1012 (1.98:1, pillarboxed at a stage scale of 2.81) the union of the
   party, the bosses and the panels leaves no rectangle for even an 80 px card.

## The smallest test that tells them apart

After PR-0202 (batch 5), replay the round-13 route with the battle seed pinned, and at the first
decision log the solver's input rects, its key and its answer, then force one fresh solve two
seconds later with the same key inputs re-read. A null that becomes a zone on the fresh solve is
reading 1; a null that stays null is reading 2. In parallel and cheaper: a seed sweep 1 to 200 at
2000x1012 that only records whether the first decision's card is visible, which says how often a
player meets it.

## Recommendation

**Small probe first (needs PR-0202), then fix what it shows.**
- Reading 1: make the transient panels part of the key (or re-solve once when the coach mark or
  callout closes), with a unit test built from the logged rects.
- Reading 2: do what the round-13 fix names: dock the card compact in the guide rail instead of
  hiding it. Placing an existing card in a new spot is a layout change, so show one frame with the
  progress note; if a card cannot fit at all, relabel the chip `N SHOW MOVES` with a one-line "no
  room" note, which is the program's queue item 22 for Bailey ("recommend yes").
In both cases the chip text must match the card's state (CHK-006), and
`tests/unit/ui-ffx-hud-safe-zones.test.ts` gains the 2000x1012 case first, failing.
