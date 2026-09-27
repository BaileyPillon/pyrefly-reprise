# FF7 plumbing: the hidden Guard Scorpion experiment (steps 1, 6, 7 + the audit)

Branch `ff7-plumbing` (worktree `D:/pyrefly-ff7`), 2026-09-27. Not merged, not deployed.
Plan: `docs/plans/ff7-guard-scorpion-architecture.md`. Game case: **FF7 only** for the
records, store, flow and door; **shared plumbing (both + FF7)** for the contracts and the
game-branch guards. FFX and FFX-2 are unchanged (full suite green, the FFX-2 ATB golden
byte-identical, no file under `src/battle/ffx*` touched).

## What exists

- **Contracts** (`docs/CONTRACT-CHANGES.md`, 2026-09-27): `GameId` += `'ff7'`;
  `src/battle/common/types-ff7.ts`; the `'limit'` command and `'limit-gauge'` event;
  `Chapter.experimental`, `number: 0`, `ListedChapterId`; `ChapterMusic.scene/battle`
  may be `null` (silence); `src/data/ff7/ids.ts`.
- **The guard**: `src/battle/common/game.ts` (`ffxFamily`, `isFfxFamily`,
  `Ff7NotHandledError`). Every two-way game branch is listed with its disposition in
  `docs/plans/ff7-game-branch-audit.md`.
- **Registration**: `src/data/chapter-ff7-guard-scorpion.ts` in `UNLISTED_CHAPTERS`; data
  in `src/data/ff7/` (cited to `research/ff7-guard-scorpion.md` and
  `research/ff7-battle-core.md`; estimates labelled; gil left out as unsourced).
- **Flow and store**: `runChapter` sends `chapter.experimental` to
  `src/app/screens/BattleScreenExperiment.ts`; records go to
  `pyrefly-reprise:experiments:v1` (`src/app/experiments/experimentRecords.ts`), never the save.
- **The switch**: `FF7_EXPERIMENT_READY = false` in `src/app/experiments/ff7Flag.ts`. Off:
  the door does nothing and `gotoChapter('ff7-guard-scorpion')` returns `null` at once.
- **The secret door** (Bailey's approved option A): `src/app/screens/frontend/secretDoor.ts`,
  wired in `ChapterSelectScreen` (type L-I-M-I-T; tap "Chapter select" seven times in about
  4 s; L1 R1 L1 R1 Select, or F R F R M on a keyboard).
- **Critic**: `ff7-engine` and `ff7-experiment` rules in `critic/policy.json`; CHK-025.

## What is next (not done here)

1. The FF7 engine (`src/battle/ff7/`, plan steps 2 to 5) and Bailey's HUD (option A, made
   more faithful; `docs/plans/ff7-hud-faithful-a-spec.md`).
2. Replace the three guards that stop the flow (`battleSpellFx`, `createEngine`,
   `createHud`) with `'ff7'` branches, give FF7 its own results and defeat panels (RETRY),
   then flip `FF7_EXPERIMENT_READY`.
3. Open questions for Bailey (plan §6): music (silence until a sketch is heard), FF7's ATB
   mode default, whether a success sign plays when the door opens.
4. AGENTS.md still says "CHK-001 to CHK-024"; CHK-025 now exists.
