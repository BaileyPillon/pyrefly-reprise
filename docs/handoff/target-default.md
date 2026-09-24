# Handoff: the target cursor opens on the sensible side (target-default)

**State:** built and repaired in the hotfix worktree `D:/pyrefly-hotfix2`. Commits: 167cd89d
(the fix) and the repair commit on top of it. Not pushed, not deployed, and no critic review
yet. Game case: **both** (shared plumbing; the same rule in each game).

## What changed for the player

When a move can target either side, the cursor now opens on the enemy for attacks, Breaks,
Drain, Doom, Death, Cheap Shot and Dispel. It opens on the party for cures, buffs and Esuna.
Phoenix Down and Life open on whoever is KO'd. The arrows still reach every legal target, and
mouse clicks go where they land. Plain Attack always opened on an enemy. The complaint came
from the `single-any` skills.

## Where it lives

- `src/battle/common/aim.ts` holds the rule (pure). `src/battle/ffx2/aim.ts` and `withAim` in
  `src/battle/ffx/commands.ts` fill `AvailableCommand.preferredTargets`.
- `TargetCursor.showSingle(..., prefer)` opens on the leftmost preferred entry. Both
  `CommandMenu`s pass the row's hint.
- Tests: `tests/unit/target-default-side-ffx.test.ts`, `tests/unit/target-default-side-ffx2.test.ts`.
- Paper review: `docs/plans/target-default-review.md`, written late, in the repair pass.
- Shots: `docs/screenshots/hotfix/target-default-*.jpg` (before = live, after = worktree).

## Open

- **For Bailey:** the unsourced judgement calls in `docs/plans/target-default-review.md` §6
  (Dispel and Copycat/Mix open on an enemy, Esuna and Regen on the party, and so on). The
  driver should file them as a `proposed` decision in `docs/target/decisions.json` on main,
  under the next free id. The hotfix tree's copy of that file is far behind main, so the
  repair did not write to it.
- Known limit: the hint is taken when the decision is made. A party member KO'd while a menu
  is already open (Active mode) is not preferred by a revive, and the cursor falls back to the
  leftmost entry, the same as live.
- Existing issue, not caused by this change: in ch4, clicking Paine's bracket centre during a
  target step can submit Bahamut (live does the same).
