/**
 * The hidden Shinryu chapter (the Monster Arena's deep-water dragon; **FFX only** [AGENTS.md rule 14]): the line the fight is played with. It is registered under the FFX game in `./lookup.ts`, so an FFX-2 board never
 * reaches it, and it returns `null` (a swing) when Shinryu is not on the field.
 *
 * ## The line, and where each rule comes from
 *
 * The fight is a race (`research/re-ffx-shinryu.md` summary 6): twenty-one blows of 99,999 end it, and every extra Shinryu turn is another one-in-three Eraser, which in this water breaks a swimmer for good. So the line is the
 * guide's whole advice, "properly leveled characters with their strongest weapons", then "defeat Shinryu quickly" (Jegged), made into three rules, and **it is the line `tests/unit/helpers/shinryuBot.ts` calls `guide`**:
 *
 * 1. **Keep the party up** (the skeleton): a Phoenix Down on a member who is down (a shattered member is off the field and cannot be raised: the row is not offered), an X-Potion (or the next item down) for anyone under half
 *    his HP. Shinryu answers every blow it feels with a claw (RE 2), so the party loses a little HP all the way through.
 * 2. **Tidus: Quick Hit** in place of his plain Attack, the faster command, as the Penance guides play him (a Quick Hit is the same blow on the same Celestial weapon, a rank sooner).
 * 3. Anything else swings (`null`): the plain Attack with the Celestial weapon, which is already the 99,999 cap.
 *
 * Measured on the real engine (`docs/handoff/ch-shinryu.md` section 5): the shipped party wins every battle with this line and with the careless one alike; the line is **not** what makes the fight winnable, it is what makes it
 * fastest (a median of 24 ticks against 26), and the tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { SHINRYU_ID } from '../../data/ffx/shinryu-ids.ts'; // a module with no imports of its own
import type { Tactic } from './common.ts';

/** Shinryu's combatant id (`src/data/ffx/shinryu-ids.ts`), the one `tacticFor` keys this encounter on. */
export const SHINRYU_BOSS_IDS: readonly CombatantId[] = [SHINRYU_ID];

/** A member needs a heal when a Shining and a claw could take him low: under half his maximum. */
const HEAL_UNDER = 0.5;
const HEAL_ITEMS = ['x-potion', 'mega-potion', 'hi-potion'] as const;

const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id: string | undefined, target?: CombatantId): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/** Rule 1: stand a fallen member up, heal the hurt. */
function care(commands: readonly AvailableCommand[], party: readonly FFXCombatant[]): Command | null {
  const down = party.find((c) => !c.alive && !c.removed);
  if (down) {
    const pd = pick(commands, 'item', 'phoenix-down', down.id);
    if (pd) return pd;
  }
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * HEAL_UNDER).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) {
    const heal = HEAL_ITEMS.map((i) => pick(commands, 'item', i, hurt.id)).find((c) => c !== null) ?? null;
    if (heal) return heal;
  }
  return null;
}

export const shinryu: Tactic = (actorId, commands, engine: BattleEngine) => {
  const state = engine.state();
  const dragon = state.combatants[SHINRYU_ID] as FFXCombatant | undefined;
  if (dragon === undefined || !alive(dragon)) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (me === undefined || me.side !== 'party') return null;
  const front = state.activeIds.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);

  // 1. Keep the party up.
  const tended = care(commands, front);
  if (tended) return tended;

  // 2. Tidus: Quick Hit.
  if (actorId === 'tidus') {
    const hit = pick(commands, 'ability', 'quick-hit', SHINRYU_ID);
    if (hit) return hit;
  }
  // 3. Swing.
  return null;
};

export default shinryu;
