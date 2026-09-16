/**
 * FFX status catalog — merges `core.ts` (incapacitating/control/support
 * statuses) and `stacks-and-flags.ts` (Nul charges, Auto-Life, Critical, the
 * two aeon stances, the four Breaks, the six stacking buffs, and the Mix/
 * tonic enhancement flags) into one lookup keyed by `FFXStatusId`.
 *
 * See `core.ts` for the `FFXStatusDef` shape and why it is a project-local
 * addition rather than a contract change.
 */

import type { FFXStatusId } from '../../../battle/common/types.ts';
import type { FFXStatusDef } from './core.ts';
import { STATUSES_CORE } from './core.ts';
import { STATUSES_STACKS_AND_FLAGS } from './stacks-and-flags.ts';

export type { FFXStatusDef, StatusDurationModel } from './core.ts';

export const FFX_STATUSES: Record<FFXStatusId, FFXStatusDef> = {
  ...STATUSES_CORE,
  ...STATUSES_STACKS_AND_FLAGS,
} as Record<FFXStatusId, FFXStatusDef>;

export default FFX_STATUSES;
