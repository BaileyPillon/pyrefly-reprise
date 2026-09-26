# PR-0181 method check (rule 15): an FFX summon leaves the party on the field

Written 2026-09-26, paper only, before the first build attempt (the issue has been open at major in
rounds 12 and 13 with no repair tried). **Game case: FFX only** (Yuna's summons; FFX-2 has none).
Chapters: I, X and XIV (and IX, where a summon is most visible).

## The issue as the critic measures it

On Bahamut's turn in Chapter X, Bahamut is painted at party height behind Tidus and Yuna, the three
party figures stand in place and the party rows stay in the panel (dimmed). In XIV Yuna stands in
front of Valefor. Acceptance (round 13): in I, X and XIV, on the aeon's first menu, the aeon is at
least 75% unoccluded, no party quad overlaps it, and the party rows are replaced by the aeon's.

## The current route, traced

- **The engine is already right.** `src/battle/ffx/aeons.ts` `summonAeon` calls `freezeParty` and
  puts the aeon on slot 1; `dismissAeon` calls `thawParty`. This is
  `research/ffx-combat-core.md` §6.1, `[verified: 2 sources]`: "The summoned aeon **replaces the
  entire active party**; the party members are removed from the field", and dismissal or the aeon's
  KO "returns the party".
- **The presentation is not.** `src/engine/BattlePresenterBeats.ts` `summon()` (lines 159-171)
  adds the aeon actor, fades it in and hops it, and never touches the three party actors.
  `BattlePresenterArt.ts:269` scales an aeon at `defaults.enemy * 0.7`, which is why Bahamut
  paints at party height. The `dismiss` case in `BattlePresenterEvents.ts:271` fades the aeon out
  and does nothing for the party either.

## Why it stalled

Nobody picked it up: it sat in no batch. Round 12 asked for it FFX-only with the same fix; round
13 repeated it. There is no failed attempt to learn from, only a missing owner. The one open point
the program names is whether this is **restored canon** (class A) or **a new look** that needs a
before/after frame first (§3 item 10 of the program).

## Alternatives

1. **Party off stage (canon).** On `summon`: fade the three party actors out (the Switch beat's
   `fadeTo(0)` already exists) and keep them staged but hidden; stage the aeon centre-front at its
   own scale. On `dismiss` (command, KO or Banish): fade the aeon out and the party back in, at
   their own slots. The HUD swaps the party rows for the aeon's row while `state.aeonId` is set.
2. **Party dimmed and pushed back.** Keep them visible behind the aeon. Not what §6.1 says, and it
   keeps the occlusion the acceptance check measures. This one would be a new look.

## The smallest test that tells them apart

There is nothing to measure between them in the engine; the source decides. The deciding test is
a presenter unit test: after a `summon` event, each party actor's alpha is 0 (or it is not
staged), the aeon's scale equals its own art scale and its slot is centre-front; after `dismiss`,
the party alpha is back to 1. Plus the round-13 acceptance on real keys (Ch X Bahamut, Ch XIV
Valefor, Ch I any aeon before Banish) at 1600x900 and 2000x1012.

Things to check while building, not decisions: the aeon's scale should come from its sidecar or
height rule, not a new number chosen by eye (if there is no sourced or approved size, use the
painting's own height rule and say so); Banish in I must bring the party back on the same beat;
the Yojimbo recall departure (`BattlePresenterDepartures.ts`, D-076) must keep its own exit.

## Recommendation

**Continue, as class A (restored canon).** §6.1 is verified with two sources, the engine already
does it, and alternative 1 only makes the field show what the engine does. It is not a new look,
so no options round is needed; the driver may still show one before/after frame with the progress
report. The build belongs to batch 2 (`src/engine/**`, the presenter, so a focused review before
deploy and a deep review after), with the HUD row swap in `src/ui/ffx/FFXBattleHud.ts` (1,544
lines: the swap goes in a new module).
