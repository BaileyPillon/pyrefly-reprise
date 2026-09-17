# Fix: best-time-flow

Key: `best-time-flow`. Scope: `src/app/screens/BattleScreenFlow.ts` (the
`recordClear` call and its inputs only) and `src/app/SaveData.ts` (a
migration).

## The defect

`GameFlow.runChapter` recorded a chapter's best time straight from the raw
wall clock:

```ts
if (outcome.result) save.recordClear(id, outcome.elapsedMs, outcome.result.turns);
```

`outcome.elapsedMs` is `BattleScreenResult.elapsedMs`, the presenter's own
wall clock — the same number `docs/handoff/polish-results-screen.md`
identifies as the Results panel's preferred clock, but recorded here
**before** that panel's plausibility floor (`ui/common/resultsMath.ts`'s
`clearTimeMs` / `MIN_PLAUSIBLE_WALL_CLOCK_MS = 1000`) ever applied to it.

Two consequences:

1. **`speed: 'skip'` writes a sub-second best time.** At that playback speed
   every animation wait collapses to zero (`resultsMath.ts`'s own comment:
   "a whole chapter resolves in a few hundred milliseconds"), so
   `outcome.elapsedMs` is a handful of milliseconds. `recordClear` wrote that
   number verbatim, and Chapter Select prints whatever `bestTimeMs` holds — so
   a chapter could show something like `0:00` as its "record" run.
2. **An automated run recorded a time at all.** `RunChapterOptions.auto`
   (`AutoStrategy | null`) marks a run driven by the debug API's
   `autoBattle`, an e2e spec, or the critic — never a human play session.
   Nothing gated `recordClear` on it, so any bot run, at any speed, could
   overwrite (or create) a chapter's best time.

## The fix

`BattleScreenFlow.ts` now exports a small pure helper, `clearTimeToRecord`,
next to `GameFlow`, and `runChapter` calls it instead of writing
`outcome.elapsedMs` directly:

```ts
export function clearTimeToRecord(
  result: BattleResult,
  wallClockMs: number,
  game: GameId,
  auto: AutoStrategy | null | undefined,
): number | null {
  if (auto) return null;
  return clearTimeMs(result, wallClockMs, game);
}
```

- **Same floor the panel uses.** It calls `ui/common/resultsMath.ts`'s own
  `clearTimeMs(result, wallClockMs, game)` — the exact function
  `ResultsScreen` uses to compute the number it prints
  (`docs/handoff/polish-results-screen.md`). Whatever the panel would show is
  what now gets recorded; the two can no longer disagree, and a `speed:
  'skip'` run falls through to the tick-based estimate instead of writing a
  near-zero millisecond count.
- **Never for an automated run.** When `auto` is set, the function returns
  `null` and `runChapter` skips `recordClear` entirely — no best time is
  written, however long the run took wall-clock. `recordAttempt` (the
  attempts counter) is untouched; only the time/best-time semantics were in
  scope for this defect.

`runChapter`'s call site:

```ts
if (outcome.result) {
  const toRecord = clearTimeToRecord(outcome.result, outcome.elapsedMs, chapter.game, opts.auto);
  if (toRecord !== null) save.recordClear(id, toRecord, outcome.result.turns);
}
```

`chapter.game` (`GameId`, `'ffx' | 'ffx2'`, `src/battle/common/types.ts`) is
the same field `ResultsScreen.enter()` reads off the chapter to pick the
`.ig--ffx2` styling, so the tick-rate `clearTimeMs` falls back to now matches
what the chapter actually is.

No numbers were invented for this part: `MIN_PLAUSIBLE_WALL_CLOCK_MS`,
`FFX_MS_PER_TICK` and `FFX2_MS_PER_TICK` already exist and are cited in
`src/ui/common/resultsMath.ts` (measured/`TICK_RATE_BASE`-derived, per
`research/ffx2-combat-core.md` §1.2 for the FFX-2 rate); this fix only makes
`BattleScreenFlow` go through them instead of bypassing them.

## The migration — cleaning up saves already written by the bug

Bogus best times from the defect above are already sitting in players'
`localStorage`. `SaveData.ts` adds:

```ts
export const IMPLAUSIBLE_BEST_TIME_MS = 5000;
```

and `migrate()` (which `SaveStore.load()` already runs unconditionally on
every load, not gated on the stored `version`) now drops any chapter's
`bestTimeMs` under that floor, leaving `cleared` and `bestTurns` alone — the
clear itself was real, only the timing was corrupt:

```ts
function sanitizeChapters(chapters: Record<string, ChapterRecord>): Record<string, ChapterRecord> {
  const out: Record<string, ChapterRecord> = {};
  for (const [id, rec] of Object.entries(chapters)) {
    out[id] =
      rec.bestTimeMs !== null && rec.bestTimeMs < IMPLAUSIBLE_BEST_TIME_MS
        ? { ...rec, bestTimeMs: null }
        : rec;
  }
  return out;
}
```

**Why 5 s, not `MIN_PLAUSIBLE_WALL_CLOCK_MS` (1 s):** the two constants do
different jobs. `MIN_PLAUSIBLE_WALL_CLOCK_MS` is the going-forward gate the
fixed code now checks a run against *before* ever recording anything, so a
sub-1s wall clock is redirected to the tick estimate rather than written raw.
The migration instead has to clean up values the *broken* code already wrote,
which could be that tick-based fallback itself (still small for a short
automated fight, not just the raw millisecond count) — so it uses a more
conservative floor to catch both shapes of bad data. No chapter in
`src/data/encounters.ts` can be legitimately cleared in under 5 real seconds
(every fight in `research/ffx-combat-core.md` / `research/ffx2-combat-core.md`
takes multiple full turns, each turn alone costing whole seconds of ATB/CTB
runway — `research/ffx2-combat-core.md` §1.2: "one drawn bar = 24,000 ticks =
8.00 s"), so 5 s cannot false-positive on a genuine clear.

## Tests

- `tests/unit/battle-screen-flow-clear-time.test.ts` — `clearTimeToRecord`:
  floors a real run's wall clock the same way the Results panel would, never
  returns the raw sub-floor clock, and returns `null` for any automated run
  regardless of how long it took.
- `tests/unit/save-data-best-time-migration.test.ts` — `migrate`: drops a
  best time under `IMPLAUSIBLE_BEST_TIME_MS` while keeping `cleared` /
  `bestTurns`, keeps a plausible one, and runs regardless of the stored
  `version`.

Both pass under `npx vitest run <file>`; `npx tsc --noEmit` is clean for
these two files (an unrelated pre-existing error surfaced transiently in
`src/battle/ffx2/resolve.ts`, outside this fix's scope, and was gone on a
second run — another agent's concurrent WIP in that file).

## Known unrelated failures at the time of this fix

`npx vitest run` (full suite) had 2 pre-existing failures in
`tests/unit/ui-ffx-party-prep.test.ts` (`Stats panel` HP/MP values), unrelated
to `BattleScreenFlow.ts` / `SaveData.ts` and not touched by this change —
consistent with the concurrent art/engine agents' in-flight edits to
`PartyPrepScreen.ts` per the orchestrator's ownership map.
