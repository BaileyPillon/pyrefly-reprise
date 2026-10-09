/**
 * The three Macalania scripts — Seymour, the two Guado Guardians, Anima — registered, and the encounter's public
 * face. Everything they read (the ids, the numbers, the battle flags, the opening, the Talk table) is in
 * `./macalania-rules.ts`; the act changes are `./macalania-acts.ts`; the scripts themselves are
 * `./macalania-seymour.ts`, `./macalania-guardian.ts` and `./macalania-anima.ts`. The split is the 400-line house
 * limit [AGENTS.md hard rule 7], not a seam in the design.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — an FFX encounter registered in the FFX AI registry. Re-parity:
 * the rules are the game's own scripts (`research/re-ffx-ai-seymour.md` section 3).
 */

import { registerAiScript } from './types.ts';
import { ANIMA_MACALANIA_SCRIPT, GUADO_GUARDIAN_SCRIPT, SEYMOUR_MACALANIA_SCRIPT } from './macalania-rules.ts';
import { seymourMacalaniaAi } from './macalania-seymour.ts';
import { guadoGuardianAi } from './macalania-guardian.ts';
import { animaMacalaniaAi } from './macalania-anima.ts';

export * from './macalania-rules.ts';
export { runMacalaniaPhaseHooks } from './macalania-acts.ts';
export { seymourMacalaniaAi, guadoGuardianAi, animaMacalaniaAi };

registerAiScript(SEYMOUR_MACALANIA_SCRIPT, seymourMacalaniaAi);
registerAiScript(GUADO_GUARDIAN_SCRIPT, guadoGuardianAi);
registerAiScript(ANIMA_MACALANIA_SCRIPT, animaMacalaniaAi);
