/**
 * **The opening state of the Flooded Ways' battles** (FFX only; the hidden Flooded Ways chapter): what the monsters' and the formations' scripts write when they start, as state and not as decisions
 * (`research/re-ffx-geosgaeno-evrae-altana.md` 2.1, 4.1, 4.3 and 4.4). Called once from `formation-commands.ts#applyFormationCommandDisables` (the formation script's own setup call, after the opening
 * counters); a no-op in every battle that is not one of the chapter's four.
 *
 * - **The water battle** (the formation block's byte 3, RE 2.1): the flag the status step reads (`adapt/status.ts`) so a Petrify that lands on a party member shatters them. Raised for any group that says `inWater`.
 * - **Evrae Altana is a permanent Zombie** (RE 1.2, the record's automatic status word 0x0002): healing damages it and a Phoenix Down is a killing blow. The engine reads no automatic status for a monster, so the setup
 *   gives it as the equipment statuses are given (`permanent`, stack 255: no Dispel or Remedy removes it). Its turn flag starts at 0 in every area (RE 4.3).
 * - **The Gate Locks take no turns and are no part of the victory** (RE 4.4: turn, must-be-killed and CTB bar all off): `ordersOnly` and `nonCombatant`, the way the Mortiphasm discs and Daigoro are.
 * - **Geosgaeno's cycle starts at slot 0 and nobody is inside** (RE 4.1).
 */

import type { EnemyGroupDef } from '../../common/types.ts';
import { type Ctx, rtOf, tryActor } from '../state.ts';
import {
  EVRAE_ALTANA_ID,
  EVRAE_FLIP,
  FLOODED_LINK_OF_GROUP,
  GATE_LOCK_IDS,
  GEO_V4,
  HOLD_FLAG,
  LINK_FLAG,
  STOMACH_SAVED_MAX,
  WATER_FLAG,
} from './flooded-ways-rules.ts';

export function applyFloodedWaysSetup(ctx: Ctx, group: EnemyGroupDef): void {
  if (group.inWater === true) ctx.state.flags[WATER_FLAG] = true;
  const link = FLOODED_LINK_OF_GROUP[group.id];
  if (link === undefined) return;
  ctx.state.flags[LINK_FLAG] = link.key;
  ctx.state.flags[EVRAE_FLIP] = 0;
  ctx.state.flags[HOLD_FLAG] = '';
  ctx.state.flags[GEO_V4] = 0;
  ctx.state.flags[STOMACH_SAVED_MAX] = 0;
  const evrae = tryActor(ctx, EVRAE_ALTANA_ID);
  if (evrae !== undefined && link.area !== 0) {
    evrae.statuses['zombie'] = { id: 'zombie', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
  }
  for (const id of GATE_LOCK_IDS) {
    const lock = tryActor(ctx, id);
    if (lock === undefined) continue;
    const rt = rtOf(ctx, id);
    rt.ordersOnly = true;
    rt.nonCombatant = true;
  }
}
