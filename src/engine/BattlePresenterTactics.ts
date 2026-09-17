/**
 * Encounter tactics — **moved**, and kept here as a re-export.
 *
 * The per-chapter logic now lives one file per encounter under
 * `src/engine/tactics/`, so the five chapter agents can own their own files
 * instead of queueing behind each other on one 700-line module:
 *
 * | Chapter | File |
 * |---|---|
 * | 1 — Seymour Flux | `tactics/seymour-flux.ts` |
 * | 2 — Lady Yunalesca | `tactics/yunalesca.ts` |
 * | 3 — Braska's Final Aeon / Yu Yevon | `tactics/braskas-final-aeon.ts` |
 * | 4 — Bahamut | `tactics/ffx2-bahamut.ts` |
 * | 5 — Vegnagun / Shuyin | `tactics/ffx2-vegnagun-shuyin.ts` |
 *
 * with the shared reading helpers in `tactics/common.ts` and the registry in
 * `tactics/index.ts`. Nothing about how a tactic behaves changed in the move.
 *
 * This file stays so every existing import site — `BattlePresenterStrategies.ts`
 * and the tests — keeps working unchanged. **New code should import from
 * `./tactics/index.ts` directly**, and new encounter logic belongs in that
 * encounter's own file, never here.
 */

export type { Tactic } from './tactics/index.ts';
export { TACTICS, tacticFor } from './tactics/index.ts';
