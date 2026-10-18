/**
 * **The opening state of the Dark Aeons' battles** (FFX only; `research/re-ffx-yojimbo-sisters-feasibility.md`): what the formations' scripts write when they start, as state and not as decisions.
 * Called once from `setup.ts#buildBattle`; a no-op in every battle whose group is not one of the chapter's eleven (it reads the group's id).
 *
 * - **Every sister's Overdrive gauge** is shown with a maximum of 100 and starts at **100 in the trio formations** (RE section 4.2), so the first move of the trio is the joint attack; in the other four
 *   formations no current value is written (0, `[inferred]`: RE section 9 item 3). Dark Yojimbo's gauge starts at 0 (no write sets it: RE section 4.1).
 * - **The game's battle id** and, for Dark Yojimbo, **the tier's per-turn fill** are published as flags (`./dark-aeons-seams.ts`), because the scripts branch on the battle id and the fill depends on it.
 * - **The dog takes no turns and is no part of the victory** (its script clears the turn, targetable and must-be-killed flags: RE section 3): it is marked `ordersOnly` and `nonCombatant`, the way the
 *   trial Yojimbo's bystanders are (`./yojimbo-rules.ts#markYojimboRuntime`); it acts only when ordered.
 *
 * Not written here: the ambushed start of the first Yojimbo tier (the monster's write lands after the opening counters, so it changes the intro only: RE section 3), and any decision of the AI.
 */

import type { EnemyGroupDef } from '../../common/types.ts';
import { type Ctx, rtOf, tryActor } from '../state.ts';
import { DARK_BATTLE_ID_FLAG, DARK_FORMATIONS, DARK_GAUGE_PER_TURN_FLAG, DARK_IDS } from './dark-aeons-seams.ts';

/** The Overdrive row each Dark enemy owns (the ids of `data/ffx/enemies/dark-aeons-abilities.ts`): the sisters' joint attack, Yojimbo's Zanmato. */
const OVERDRIVE_OF: Readonly<Record<string, string>> = {
  [DARK_IDS.cindy]: 'dark-delta-attack',
  [DARK_IDS.sandy]: 'dark-delta-attack',
  [DARK_IDS.mindy]: 'dark-delta-attack',
  [DARK_IDS.yojimbo]: 'dark-zanmato',
};

/** The tag on an enemy gauge the Dark Aeons' scripts own (`EnemyFields`' `enemyGaugeRules` is a string tag only). */
export const DARK_GAUGE_RULES = 'dark-aeons';

export function applyDarkAeonsSetup(ctx: Ctx, group: EnemyGroupDef): void {
  const formation = DARK_FORMATIONS[group.id];
  if (formation === undefined) return;
  ctx.state.flags[DARK_BATTLE_ID_FLAG] = formation.battleId;
  if (formation.gaugePerTurn !== undefined) ctx.state.flags[DARK_GAUGE_PER_TURN_FLAG] = formation.gaugePerTurn;
  for (const [id, overdrive] of Object.entries(OVERDRIVE_OF)) {
    const c = tryActor(ctx, id);
    if (c === undefined) continue;
    c.overdrive = { gauge: id === DARK_IDS.yojimbo ? 0 : formation.startGauge, mode: 'stoic', unlockedOverdriveIds: [overdrive], enemyGaugeRules: DARK_GAUGE_RULES };
  }
  const dog = tryActor(ctx, DARK_IDS.daigoro);
  if (dog !== undefined) {
    const rt = rtOf(ctx, dog.id);
    rt.ordersOnly = true;
    rt.nonCombatant = true;
  }
}
