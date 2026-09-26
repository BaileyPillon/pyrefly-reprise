# FOC-06 method check (rule 15): advisor and intent chips under 14 effective px

Written 2026-09-26, paper only. **Game case: both** (the move-advisor card and the enemy-intent
card are shared `src/ui/common` components both HUDs mount, CHK-020). Batch 3 owns the files.

## The issue as the critic measures it

Round 13: at the first menu after the coach, the advisor's chips ("Guide's pick", "in White
Magic", "10 MP", "always hits", "+ Shell") measure 12.2 effective px, and "Next best move" 12.2 to
12.93, in both games at 1600x900 and 2000x1012 (XI, IV, V, II, X, XIV). CHK-003's pass line is
**zero leaves under 14 css px**. Acceptance: `advisorMinEffPx >= 14` at 1600x900 and 2000x1012 in
every chapter of both games, and a rotation sweep of the HUD and pause finds no leaf under 14 px.

## History and why it stalled

- Round 08 measured 9.75 px at 1600x900 and 2.38 px on a phone. `2b49aa7f` floored the *rendered*
  size: `move-advisor.css` sets `--mad-fs-floor: calc(12.2px / var(--lb-scale, 1))` and every
  `font-size` is `max(authored, var(--mad-fs-floor))`. The mechanism is right and scale-proof.
- **The number was the wrong one.** 12.2 came from FOC-04's 12 px floor for the in-stage HUD;
  CHK-003 says 14. Rounds 11 to 13 then measured exactly 12.2 everywhere, which is the floor
  working as written against a floor the check does not use.
- **Nobody raised it because of what it costs.** `docs/handoff/release-09-repair.md` measured the
  12.2 floor's own cost: FFX Chapter I at 1280x720 went from 11 text runs to 8 (it loses "always
  hits", "+ Haste", the effect line and the reason), because the FFX safe zone gives the card only
  144x56 grid px there. A 14 px floor sheds more. Keeping every row would need a bigger zone, a
  visible layout change, so the earlier agent disclosed it and stopped (rule 9).
- The intent card has **no floor at all**: `enemy-intent*.css` authors 3.9 to 10 grid px under its
  own `--eint-scale` transform. The critic's chip numbers are the advisor's, but the same sweep will
  fail the intent card the moment it is measured.

## Alternatives

1. **Raise the one variable** to `calc(14.2px / var(--lb-scale, 1))` (and add the same floor to the
   intent card's type), and let the density ladder shed rows. Class A if the lead move, its target
   and its menu word survive at every shape.
2. **Keep every row**: move the card or grow its zone at small shapes. A new layout, so options
   first (rule 9).
3. **Two floors** (14 at 1600 and above, 12 at 1280x720). Fails CHK-003 as written.

## The smallest test that tells them apart

Render at 14.2 px on every row (a stylesheet override on a production build, no code) and walk the
card with the transform-aware effective-size walk the critic uses, at 1280x720, 1600x900 and
2000x1012, in one chapter per game with the densest card (FFX Chapter I, FFX-2 Chapter IV), seed
pinned. Count, per shape, which rows the ladder sheds, and whether the lead move, target and menu
survive. Same walk over the intent card.

- If they survive at every shape: alternative 1, done.
- If they survive at 1600 and 2000 but not at 1280x720: build alternative 1 for the acceptance
  shapes, and put queue item 24 to Bailey with the 1280x720 frames ("at 1280x720, all rows at 12 px,
  or fewer rows at 14 px?", recommend fewer rows at 14 px).

## Recommendation

**Small probe first, then continue with alternative 1.** The mechanism is proven; the fix is one
token plus the same floor on the intent card, and the probe tells us whether it needs Bailey's word
at 1280x720. Acceptance tests: `tests/unit/advisor-card-css-type-floor.test.ts` moves its arithmetic
to 14 px (fails first), plus the real-key walk at the two acceptance shapes in every chapter of
both games.
