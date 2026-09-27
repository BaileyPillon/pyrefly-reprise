/**
 * The results panel's per-member rows for the hidden FF7 fight (FF7 only).
 *
 * The panel is the house results page with recording off (plan
 * `docs/plans/ff7-guard-scorpion-architecture.md` §2.3 step 5); an FF7-faithful
 * results screen is a new screen and waits for its own options round (rule 9).
 *
 * What the numbers are [research/ff7-battle-core.md §11]: every member on the
 * field gets the **full** EXP total (`BattleResult.exp` is that per-member total);
 * AP goes to each equipped Materia, so it is printed once on the member's second
 * line, not as a share. Levels gained are not computed by the slice (engine
 * handoff, Open 5), so the level column stays at the build's level.
 *
 * Disclosed simplification: FF7 gives a member KO'd at the end 0 EXP; the
 * result does not say who stood at the end, so every row prints the total.
 */

import type { BattleResult } from '../../battle/common/types.ts';
import type { Ff7PartyBuild } from '../../battle/common/types-ff7.ts';

/** One row, in the shape `ui/common/resultsMath.ts` `ResultsMemberRow` prints. */
export interface Ff7ResultRow {
  id: string;
  name: string;
  award: number;
  awardUnit: 'EXP';
  levelDelta: number;
  levelUnit: 'Lv';
  detail: string;
  standing: string;
}

/** The field line-up's rows, in slot order. */
export function ff7MemberRows(build: Ff7PartyBuild, result: BattleResult): Ff7ResultRow[] {
  const won = result.outcome === 'victory';
  return build.activeSlots.flatMap((id) => {
    const m = build.members.find((x) => x.id === id);
    if (!m) return [];
    const materia = [...m.materia.weapon, ...m.materia.armour].filter((x) => x !== null).length;
    return [{
      id,
      name: m.name,
      award: won ? result.exp : 0,
      awardUnit: 'EXP' as const,
      levelDelta: 0,
      levelUnit: 'Lv' as const,
      detail: `LV ${m.base.level} · ${won ? result.ap : 0} AP to ${materia} MATERIA`,
      standing: `LV ${m.base.level}`,
    }];
  });
}
