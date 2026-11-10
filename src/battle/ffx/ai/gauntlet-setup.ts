/**
 * **The opening state of the hidden Gauntlet chapter's battles** (FFX only; chapter 54): what the creatures' scripts write when they start, as state and not as decisions. Called once from
 * `setup.ts#buildBattle` through `./dark-aeons-setup.ts` (a one-line hook, the way the Belgemine and Dark Aeons set-ups hang there); **a no-op in every battle whose group is not one of the chapter's**, so nothing
 * else in the project changes (proved by an A/B of seeded event-log digests, `docs/handoff/ch-gauntlet.md`).
 *
 * - **Earth Eater starts with Reflect on** (the record's start-up status word 0x20, `data/ffx/enemies/gauntlet-records.ts`; RE n 1): a status, not an immunity, written like Penance's Protect (nothing is emitted:
 *   setup events never reach the presenter, and the status pips read the state). Its two published flags start at "standing, nothing taken". The Armored flag is the record's.
 * - **The Greater Sphere draws its first element** (`GetRandomValue() mod 4`, its init): the affinities and the counter rows are written at once (`./gauntlet-greater-sphere.ts#applySphereSetup`).
 *
 * The other creatures' init writes (Don Tonberry's variables, the Cactuar King's counters) are their scripts' memory, which starts at 0 and is read with a default of 0.
 */

import type { EnemyGroupDef } from '../../common/types.ts';
import { type Ctx, tryActor } from '../state.ts';
import { applySphereSetup } from './gauntlet-greater-sphere.ts';
import { EATER_DOWN_FLAG, EATER_TOTAL_FLAG, GAUNTLET_GROUP_IDS, GAUNTLET_IDS } from './gauntlet-rules.ts';

/** Reflect as a cast Reflect is: it lasts until it is removed (the status table's 254 turns). */
const REFLECT = { id: 'reflect' as const, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };

export function applyGauntletSetup(ctx: Ctx, group: EnemyGroupDef): void {
  if (group.id === GAUNTLET_GROUP_IDS.earthEater) {
    const eater = tryActor(ctx, GAUNTLET_IDS.earthEater);
    if (eater === undefined) return;
    eater.statuses['reflect'] = { ...REFLECT };
    ctx.state.flags[EATER_DOWN_FLAG] = false;
    ctx.state.flags[EATER_TOTAL_FLAG] = 0;
    return;
  }
  if (group.id === GAUNTLET_GROUP_IDS.greaterSphere) applySphereSetup(ctx, GAUNTLET_IDS.greaterSphere);
}
