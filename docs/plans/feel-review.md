# Feel category review (rule 15): 7.9, 7.8, 7.8

Written 2026-09-26, paper only. RUBRIC §8: a category that two consecutive reviews leave without a
gain gets a written method check before the next batch in that area. **Game case: both** (the
category spans both games; each fix below carries its own case).

## The record

| round | build | feel | the carried majors |
|---|---|---|---|
| 11 | 76f587c3 | 7.9 | PR-0061 |
| 12 | 5be4babe | 7.8 | PR-0061, new PR-0180 (R12-FN-01) |
| 13 | b975397b | 7.8, "held" | PR-0061, PR-0180 |

Round 13's "for" column grew (Chapter V won by real keys on the Wait split, four new chapters open
the house way, PR-0104 partly better at 1.05 s) and the score did not move, because the anchor is
"7 = functional with conspicuous weaknesses" and the two carried majors are the conspicuous
weaknesses. Round 13 also names what it could not see: no latency run, the Isaaru party action
caught on a pause frame, the XII sending motion, and (now captured) the XII battle-start card.

## Why the category stalled

**The batches between rounds did not touch either major.** Round 11's and 12's batches worked on
combat, encounter, interface and new chapters; PR-0061's last repairs were `303d71ea` and
`09e9710b` (loading, before round 11), and PR-0180 had no owner at all. Polish items moved (PR-0104)
and new chapters added motion, neither of which moves a category anchored on its majors. Two
further causes kept the numbers noisy: the harness recorded a seed it was not playing (PR-0202),
so Chapter I's opening jumped from 8.1 s to 14.4 s for reasons outside the build; and the feel
auditor had no latency evidence in round 13.

## What would move it, in order of lift

1. **PR-0061 on the D-206 calibration** (`docs/plans/pr-0061-method-check.md`, round-13 addendum):
   the approved 6.0 s counts as authored, and the leftover in I, V, X, XI and XIV (1.6 to 4.3 s,
   callout holds and sensor lines) is cut by auto-advancing under the action. Batch 2, class A.
2. **PR-0180, the FFX action name** (`docs/plans/pr-0180-method-check.md`): built behind an OFF
   switch now, turned on when the approved Steam session (D-205) or a GameFAQs citation sources it.
3. **The polish that reads as feel**: PR-0205 (XI link 2 reads "Magus Sisters"), PR-0191 (the
   Zanmato banner holds 2.6 s), PR-0146 (no HUD panel before the boss caption), PR-0104 (the next
   cut-in waits for the confirmed action's first effect, capped at 0.8 s, the menu never delayed),
   PR-0190 (no lost Enter during a cut-in).
4. **Evidence, so the category is not capped by what was not measured**: a latency run on an idle
   host (keydown to highlight, Confirm to action-start) in I, IV, IX and XI; the XV timed
   sequences; the Isaaru party action and the XII sending motion; one FAST Chapter V measurement.
   These go in round 14's coverage list (program §6), on batch 5's pinned-seed harness.

## The alternative, and why not

Spend the next batch on more new motion (cut-ins, sending, summons) and hope the "for" column
outweighs the majors. Two rounds show it does not: the anchor holds at 7 while a major stands.

## The smallest test of whether this batch worked

Round 14's feel auditor re-measures PR-0061 in CAL-005's leftover form on a pinned seed, and reads
the action name in the DOM within 200 ms of action-start in X and XII with the switch on (or
records it as awaiting its source). If both majors close or drop to polish, the category is judged
without its conspicuous weaknesses; if either stays open, the report says which kind of leftover
remains, so the next method check starts from a number, not an impression.

## Recommendation

**Change method: aim the batch at the two majors, not around them.** Batch 2 carries PR-0061
(the addendum's option (a)) and PR-0180 (built OFF), plus the five polish items; batch 5's harness
supplies the pinned seed and the latency and timeline evidence. Target for round 14: feel at 8.5 or
more; 9.0 needs PR-0180 sourced and switched on.
