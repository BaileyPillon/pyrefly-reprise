# Preflight: the advisor treats a charging party buff as spent (PR-0088 repair)

Release 09 repair, 2026-09-23. Rule 15 paper preflight: `node tools/critic-plan.mjs --paths
src/engine/tactics/advisor-committed.ts` classes the build DEEP (three checkpoints since the last
deep review), and the change sits in the move advisor.

## The defect (the verifier's, reproduced)

`a149d13` made the card drop a row that only repeats what another girl's charging command already
does, but "repeats" read only cures (`status-remove` on an ally) and raises. A Light or Lunar Curtain
behind one already on the charge bar was still offered: 18 top picks over 20 Chapter 6 runs under
Wait, 17 under Active at 1.5 s (`critic/scratch/release-09-repair/probe-advisor-committed.test.ts`).
The second Curtain adds nothing because the engine's `applyStatus` returns null for a status already
there; seed 1, Wait, Act II: Yuna's resolves (`status-add protect` on all three), Paine's adds none.
Curtain accounting over the 20 Wait runs: 46 Light Curtains used, 87 Protects applied (138 possible).

## The change

- `Committed.buffs`: `"<target>:<status>"` for every status a queued command puts on an ally, read
  from the same simulation that already gives the cures.
- `repeatsCommitted`: a row counts as a repeat when it cures, buffs an ally or raises, and every one of
  those is already queued, with no damage, no status on an enemy, and no HP for anyone it is not
  raising. HP healing is not treated as covered: a second Hi-Potion still adds HP.
- The rest stays as `a149d13` left it: the row is dropped, and if nothing else is on the menu the
  list stands.

## Which game

FFX-2 only (AGENTS.md rule 14). Only FFX-2's ATB puts a command on a charge bar while another girl
chooses (research/ffx2-combat-core.md §1.1, §1.3). `committedByAllies` returns the empty reading on
any non-FFX-2 board, and the FFX no-op test still walks every FFX chapter.

## Risks and how they are checked

- Over-dropping: a Curtain that covers more than the queued buff (Paine's single-target Protect
  queued, Rikku's Light Curtain covers three) still has an uncovered buff, so it stays on the card.
- Enemy debuffs are out of scope. Two girls queuing the same debuff can both matter, because a debuff
  may miss.
- Tests: `tests/unit/advisor-committed.test.ts`, where the independent `doubleSpend` oracle now also
  counts ally buffs (8 of its 9 tests failed against `a149d13`; the FFX no-op passed), plus a Wait and Active walk over every board with an ally's
  Curtain charging. The verifier's probe is re-run (target 0 buff repeats) and all advisor suites
  are re-run.
