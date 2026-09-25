# ch1-seed: paper preflight (AGENTS.md rule 15)

**Track:** decisions-2026-09-25 item 5, option B (PR-0008). Bailey, 2026-09-25: "I'll go with
all your recommendations". Worktree `D:/pyrefly-dec-0925`, branch `decisions-0925`.

**Order, stated plainly:** `critic-plan --paths` classes this change as DEEP (`src/app/runSeed.ts`
is an unclassified product path, so it counts as a shared system). This preflight should have come
before the code. It was written after the first draft, then checked against that draft line by
line. The draft changed nothing it names below.

## Game case

- **Seed plumbing: both games.** Every chapter's first attempt goes through
  `GameFlow.runChapter`, so the fresh seed applies to FFX and FFX-2 alike. The seed is our
  plumbing, not game data (sheet item 5). No research line applies to it.
- **Guide corrections, 160-seed floor, method check: FFX only.** Chapter 1 (Seymour Flux).

## What changes

1. `src/app/runSeed.ts` (new, no DOM, no `three`): `drawRunSeed()` returns the pinned seed or a
   fresh one in 1..0x7fff0000. `pinRunSeed(n | null)` sets the pin.
2. `src/app/screens/pause/restartCarry.ts`: `openRun` gives a fresh run with no seed of its own
   a drawn seed (`SeededRunOptions`). The restart memo stores the seeded options, so a RESTART
   ENCOUNTER that resumes a Save Sphere checkpoint (Chapter XI) keeps the seed of the run it
   resumes. It does not draw again.
3. `src/app/screens/BattleScreenFlow.ts` (508 lines, over the cap, so it must not grow and does
   not): the seed comes out of `openRun`. `preloadBattle` now runs after `openRun`, so it gets
   the same seed as the battle. The retry is still `seed + attempt * 1000`. `closeRun` gets the
   seeded options.
4. `src/debug/api.ts` (467 lines, stays 467): `setSeed(n)` also pins the real-key flow.
   `gotoChapter` still passes `opts.seed ?? currentSeed` explicitly, so every harness run
   through it stays fixed at seed 1 by default.

## Risks and how each one is covered

| Risk | Cover |
|---|---|
| A test or capture that walks in from the title gets a different fight each run | Unit flow tests pin seed 1 in `beforeEach`. The two real-key e2e specs (`intent-pause`, `pause`) call `setSeed(1)` before their first key. **`critic/runner/lib/play.mjs` walks in by real keys with no `setSeed`. It is under `critic/`, which this track may not edit, so the next critic run owes a `__pyrefly.setSeed(1)` step there (handed to the driver).** |
| RESTART redraws the seed and the resumed link is not the same fight | `openRun` returns the memo's seeded options. Test: "RESTART past a Save Sphere keeps the run's drawn seed". |
| Retry arithmetic overflows 32 bits | Max draw 0x7fff0000 plus 1000 per attempt stays under 2^31 for about 65,000 retries. `SeededRng` also truncates to uint32. |
| Determinism of the engines | Unchanged. `Math.random` is called once per run, in `src/app/`. `src/battle/` still never calls it. |
| Save data | Untouched. The seed is not saved, so this is not the save-data class. |
| Odds per attempt | Unchanged. The seed only picks which of the fight's own rolls come up. |

## Tests

- `tests/unit/pause-restart-checkpoint.test.ts`: four new cases (the draw range and the pin, a
  drawn seed plus RETRY's +1000, two fresh runs plus a named seed, RESTART keeps the drawn seed).
  Existing cases pinned to seed 1.
- `tests/unit/flow-checkpoint-retry.test.ts`: pinned to seed 1.
- `tests/unit/strategy-seymour-flux.test.ts`: the new 160-seed floor (73; measured 78).
- `npx tsc --noEmit`, guide tests, then the full suite once.

## Acceptance

- Real keys from the title into Chapter 1, twice, with no `setSeed`: `battleState().seed` differs
  and is not 1. After `setSeed(1)`: seed 1.
- `git diff` touches no boss data, AI or preset file.
