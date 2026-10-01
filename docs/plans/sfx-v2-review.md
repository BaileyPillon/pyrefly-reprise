# SFX v2 (D-302): paper preflight

`node tools/critic-plan.mjs --paths src/audio/AudioManager.ts,src/engine/BattlePresenterEvents.ts,src/engine/BattleMoments.ts,public/audio/manifest.json`
classes this change **DEEP** (audio routing, battle presenter, asset manifest: shared systems; both games,
every chapter). Rule 15 asks for this paper pass before the build; it was written while the hookup was
being wired on branch `sfx-v2`, before the proof runs and before any commit, and the proof plan below
is what the branch then ran. Game case: both (each game its own voice); FF7 unchanged.

## What could go wrong, and what guards it

| Risk | Guard |
|---|---|
| A v2 key asked for before the v2 sprite has decoded plays nothing | every v2 cue names a first-bank stand-in (`sfxV2/cues.ts`); the unit test checks each one exists in the first bank; the proof counts any v2 key that fell back |
| An unknown key throws inside a beat and stalls the fight | the presenter's `playCue` keeps the old try / generic-hit fallback; a voice that throws costs its answer, never the beat (`BattlePresenterSfx.ts`) |
| FF7 or a unit test hears something new | the voice is `null` for FF7 and absent in tests; new moments (item use, counter) are silent without a voice; `setSfxGame` only for FFX / FFX-2 chapter runs. Unit test: "plays exactly the old cues without a voice" |
| One game hears the other's cue (rule 14) | `twin()` refuses cross-game cues; unit sweep over every moment x actor x game; the proof checks every play against the chapter's game |
| The title / chapter select change voice | the voice is set by `BattleScreenFlow.runChapter` for the run and cleared when it ends |
| Files over 400 lines grow (rule 7) | AudioManager 660 -> 634, BattlePresenterEvents 436 -> 427, BattlePresenterPorts 472 -> 470, BattleMoments 553 -> 550, BattleScreenFlow 525 -> 525, qa.mjs 512 -> 512; the logic lives in new modules |
| The shipping budget (85 MB) and the per-sprite gate (3.5 MB) | measured before choosing the encode: V0 4.89 MB (total 85.82 MB, over both), q1 4.22 MB (over), q2 3.64 MB (over the sprite gate), **q3 3.30 MB** (total 84.22 MB, both gates pass); coding error measured for each |
| Levels break D-293 (limiter acting during a fight) | the proof re-mixes the captured fight the way AudioManager mixes it and measures peak vs music peak, loudest 43 ms vs music average, and limiter activity |
| A save-data change | none: no save field, no migration |

## Proof plan

1. `npx tsc --noEmit`, `tests/unit/audio-sfx-v2.test.ts`, the full unit suite.
2. `node tools/audio/qa.mjs --strict` (both sprites audited under the same gates, total bytes against 85 MB).
3. A production build of the branch, served by `vite preview` on its own port; `tools/audio/sfx-v2-proof.mjs`
   headless for Chapter I (FFX) and Chapter IV (FFX-2): real keys and taps through the title, board, prep,
   scene skip, pause, a cancelled submenu and the first turns, then the intended route; plus an
   `--auto-only` run of each for a won fight's events. `tools/audio/sfx-v2-levels.py` checks every play
   against the brief and measures the levels.
