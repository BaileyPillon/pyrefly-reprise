/**
 * The two shapes of the MAX mix's plan: one candidate (`Try`) and the decided master waiting to be put on screen (`Decision`). Type-only, moved out of
 * `framing.ts` unchanged (release 39 integration) to keep that file under the 400-line house limit. Game case: both (the table's pin is FFX only).
 */

import type { Limit, PartyRule } from './clearance.ts';
import type { ColossusPin } from './colossusPin.ts';
import type { FramingReport } from './framingReport.ts';
import type { Actor, Pose } from './geometry.ts';
import type { Side } from './staging.ts';

/** One candidate of the plan: the colossus master at a BOSS SCALE step (the table's pinned one carries its `pin`), or today's rig with the party stepped. */
export type Try = { frac: number; colossus: boolean; partyDx: number; pin?: ColossusPin };

/** A decided master, waiting to be put on screen. */
export interface Decision {
  /** Today's rig (the parts off, or an authored master). */
  keep: boolean;
  pose: Pose;
  lens: [number, number];
  plan: Map<Actor, { k: number; dx: number }>;
  /** The chapter's slots (`stageTable.ts`); null = the stage's own. */
  side: Side | null;
  /** The table's colossus master, when the plan plays it (`colossusPin.ts`). */
  pin: ColossusPin | null;
  today: Pose;
  rule: PartyRule | null;
  limitOf: Map<Actor, Limit | null>;
  report: Partial<FramingReport>;
}
