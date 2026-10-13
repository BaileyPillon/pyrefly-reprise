# Fayth 3D, phase 1: paper preflight (critic/RUBRIC.md, deep-class trigger)

Main session, 2026-10-10 ~17:35 EDT. No browser, no build. Plan: `docs/plans/fayth-3d.md`. Survey: `docs/plans/fayth-3d-survey.md`.

## Scope of phase 1

1. The four chapter-select doors become one table under `src/app/screens/frontend/`, and `fayth` joins it. `ChapterSelectScreen.ts` is at 399 of 400 lines.
2. Chapter `exp-fayth`, number 22:
   - derived from `EVRAE_AIRSHIP`;
   - registered in `chapters-experiments.ts`;
   - `ChapterId` and `Chapter.number` widened in `encounters.ts`;
   - an `UNLISTED_CHAPTER_META` row;
   - scene key `exp-fayth-deck` via `makeAirshipDeckScene`, plus its `PYREFLY_CANON` row.
3. The optional `SceneStaging.shotDirector` seam, consulted by `BattleMoments`, published by no scene yet except a stub on `exp-fayth-deck` that declines every beat.
4. A dev-only Vite plugin `/__ffx-local/` and a DEV-gated probe, with no skin wired yet; guard tests.

## Game case and source (rule 14)

FFX only. The encounter is FFX's Evrae (`research/ffx-evrae-airship.md`), and the camera is FFX's (D-632; `research/battle-camera-perspectives.md` section A: FFX's camera is authored and reframes per action). The door and registry edits are shared plumbing; Chapters I to XXI behave as before.

## Acceptance cases

1. On the board, `fayth` typed in order opens `exp-fayth`; the real `Input` letters are F = `l1`, A = `left` (consumed as a word key), Y, T and H unbound. A wrong letter resets, and a 2 s gap resets. Nothing is listed or remembered (the experiments' store only).
2. `limit`, `leblanc`, `mushroom` and `experiment` still open their chapters (their four suites stay green, unchanged except imports). One new test over the table: no word begins with, ends with or contains another, and no suffix of one is a prefix of another.
3. `exp-fayth` for seed S plays to the same event log as `evrae-airship` for seed S (the determinism proof, as `exp-leblanc.test.ts` did).
4. With no director published, `BattleMoments` issues exactly the calls it issues today: the golden digests, `pyrefly-canon`, `party-stature-chapters` and every `tests/unit/chapters/evrae-*` suite pass unchanged.
5. The stub director on `exp-fayth-deck` declines every beat, so the chapter plays Chapter VIII's camera for now.
6. Guards pass:
   - the plugin is serve-only with no preview or build hooks;
   - no retail extensions under `public/`;
   - the probe does nothing unless `import.meta.env.DEV`.
7. `tsc --noEmit` is clean, `node tools/orphans.mjs` lists no new orphan, and every touched file stays under 400 lines. `scenes/index.ts` does not grow.

## Before and after measurement

Behaviour changes only on the new chapter. "Before" for everything else is the current suite. "After" is the same suite plus the new door, registration and guard suites. The board's tile count is unchanged.

## Existing evidence that stays reusable

- The Evrae suites and Chapter VIII's golden digests: no Evrae code is edited.
- The four door suites.
- The 39.4.x reviews of Chapter VIII: the new chapter reuses its data by reference.

## Risks checked on paper

| Risk | Answer |
|---|---|
| Save-data class | No: `experimental: true` routes to `pyrefly-reprise:experiments:v1`; no `SaveData.ts`, no settings |
| Shared contract | `encounters.ts` unions (additive) and `scenes/types.ts` `SceneStaging` (additive): `CONTRACT-CHANGES.md` entry |
| Camera-lab files | `BattleMoments.ts` gets one optional consult per beat, inert by default; the lab session gets a line |
| Retail assets | Phase 1 ships no asset and serves only an empty dev route; guards land before any converter output exists |
| File caps | Doors to a table; `encounters.ts` 396 and `chapter-meta.ts` 397 take one line each at most (split if needed) |

## Result

**PROCEED**, with two conditions:
- the seam stays a no-op for every scene that does not publish a director (case 4);
- `scenes/index.ts` does not grow (move the experimental rows to a side table if needed).
