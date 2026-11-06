/**
 * **The opening state of the six other Dark Aeons' battles** (FFX only; the hidden Dark Aeons chapter; `research/re-ffx-dark-aeons-six.md` 4): what the monsters' set-up scripts write when the battle starts, as state and
 * not as decisions. Called once from `./dark-aeons-setup.ts` (which `setup.ts#buildBattle` calls); a no-op in every battle whose group is not one of the chapter's seven (it reads the group's id).
 *
 * - **The Overdrive gauge** is shown with a maximum of 100 and starts at 0 in all six (no script writes a current value, and the record's 0 stands: RE six 4), tagged so the HUD can tell it from a party gauge.
 * - **Dark Ixion's second fight** writes his current HP 1,300,000 over the record's maximum 1,200,000 (RE six 4.3; `[bytes]`; the game's HP setter does not clamp, **our engine's damage code does, at the first change**, so the first damaging blow only removes the overage: live check L1). The stat writes ride on the data's form.
 *
 * Not written here: the start type (Normal in six formations; Dark Anima's writes nothing and the chapter takes Normal too, pick DA9), and any decision of the AI.
 */

import type { EnemyGroupDef } from '../../common/types.ts';
import { type Ctx, tryActor } from '../state.ts';
import { SIX_FORMATIONS, SIX_GAUGE_RULES } from './dark-aeons-six-rules.ts';

export function applyDarkAeonsSixSetup(ctx: Ctx, group: EnemyGroupDef): void {
  const formation = SIX_FORMATIONS[group.id];
  if (formation === undefined) return;
  const c = tryActor(ctx, formation.bodyId);
  if (c === undefined) return;
  c.overdrive = { gauge: 0, mode: 'stoic', unlockedOverdriveIds: [formation.overdrive], enemyGaugeRules: SIX_GAUGE_RULES };
  if (formation.currentHp !== undefined) c.hp = formation.currentHp; // the set-up script's write (RE six 4.3): current over maximum
}
