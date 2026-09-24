/**
 * **Chapter X — Seymour Natus and Mortibody**, the Highbridge of Bevelle.
 *
 * Source: `research/ffx-seymour-natus-highbridge.md` §4.1 and the §4.6
 * reference pseudocode, with the preflight review's corrections
 * (`docs/plans/chapter-natus-review.md`, Review): the phase edges are
 * "below", the Multi-ra targets are two different members when possible, and
 * the element step has its own key. Shared state and the rules both scripts
 * read are in `./seymour-natus-rules.ts`.
 *
 * | Phase (stored) | Mortibody | Natus |
 * |---|---|---|
 * | 1 | tier-1 spell on the whole party, the rotation's element | Multi-ra of **the same element** on two members |
 * | 2 | Shattering Claw on a random member | Break (Petrify) on a random member |
 * | 3 | Cura on Natus | Flare on a random member (rank 5) |
 *
 * Above every phase: Natus **Banishes** an aeon once it has had its one turn,
 * and Mortibody's next action is **Desperado** while all three active members
 * are Hasted [§4.3]. [verified: 3 sources] for the table; the element order
 * and Natus-moves-first are labelled in `NATUS_ASSUMPTIONS`.
 *
 * The scripts move shared state (the element step) at decision time, as
 * Macalania's and Yojimbo's do. An intent dry-run runs them on a cloned
 * context, so asking never moves the live rotation.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { type AiContext, registerAiScript } from './types.ts';
import {
  MORTIBODY_CLAW_ID,
  MORTIBODY_CURA_ID,
  MORTIBODY_DESPERADO_ID,
  MORTIBODY_SCRIPT,
  MORTIBODY_TIER_ONE,
  NATUS_BREAK_ID,
  NATUS_FLARE_ID,
  NATUS_ID,
  NATUS_MULTI_RA,
  NATUS_SCRIPT,
  banishDue,
  castRotationElement,
  comboElement,
  desperadoDue,
  natusPhase,
  natusUse,
} from './seymour-natus-rules.ts';

export * from './seymour-natus-rules.ts';

/** One Seymour Natus turn [§4.1, §4.3, §4.6]. */
export function seymourNatusAi(ai: AiContext): Command {
  const aeon = banishDue(ai);
  if (aeon) return natusUse(ai, 'banish', [aeon]);

  switch (natusPhase(ai.ctx)) {
    case 1:
      // The combo: the element Mortibody cast last [verified: 3 sources], or
      // the rotation's current element if it has not cast yet (N-1, estimate).
      return natusUse(ai, NATUS_MULTI_RA[comboElement(ai.ctx)], []);
    case 2:
      return natusUse(ai, NATUS_BREAK_ID, []);
    case 3:
      return natusUse(ai, NATUS_FLARE_ID, []);
  }
}

/** One Mortibody turn [§4.1, §4.3, §4.6]. */
export function mortibodyAi(ai: AiContext): Command {
  // §4.3 [verified: 3 sources]: Haste on all three active members calls
  // Desperado on Mortibody's next action, whatever the phase.
  if (desperadoDue(ai.ctx)) return natusUse(ai, MORTIBODY_DESPERADO_ID, []);

  switch (natusPhase(ai.ctx)) {
    case 1:
      return natusUse(ai, MORTIBODY_TIER_ONE[castRotationElement(ai.ctx)], []);
    case 2:
      // "every turn" [single source: GameFAQs], a random member (N-12).
      return natusUse(ai, MORTIBODY_CLAW_ID, []);
    case 3:
      // Cura on slot M1 = Natus [§3.2].
      return natusUse(ai, MORTIBODY_CURA_ID, [NATUS_ID]);
  }
}

registerAiScript(NATUS_SCRIPT, seymourNatusAi);
registerAiScript(MORTIBODY_SCRIPT, mortibodyAi);
