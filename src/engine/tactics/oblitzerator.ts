/**
 * The hidden Oblitzerator chapter (the blitzball machine and the dock crane at Luca; **FFX only** [AGENTS.md rule 14]): the line the fight is played with. It is registered under the FFX game in `./lookup.ts`, so an FFX-2 board
 * never reaches it, and it returns `null` (a swing) when the Oblitzerator is not on the field.
 *
 * ## Why the card needed it
 *
 * Nothing in the fight is hidden, but the generic card cannot see the crane: it ranks the damage of each row and sends everyone at the machine, which draws a ball back one time in three and meets a machine that doubles its
 * pace as it is hurt. The crane line is the fight the game built (`research/re-ffx-oblitzerator-crane.md` 0 and 4.5). This is the line the bench calls the **advisor** (`tests/unit/helpers/oblitzeratorBot.ts`), moved into the
 * game so that the card, the strategy guide's NEXT line and the auto-battler all play it. **Nothing in the fight is tuned**: the numbers are the game's ("RE n" below).
 *
 * ## The line, and where each rule comes from
 *
 * 1. **Keep the party up** (the skeleton): Phoenix Down on a fallen member; a potion for anyone under 45 percent of his HP (the Rush is ten balls of about 35, so a member under 400 can fall to a bad spread: RE 4.1). No
 *    cure is in the line: in this engine the Darkness and Silence a ball leaves tick off at the end of the very turn it lands in (`docs/handoff/ch-oblitzerator.md`, the finding), so there is never anything to cure.
 * 2. **Lulu casts Thunder at the crane** (RE 4.5): the first two casts are answered with a line, the third powers it. A cast at the crane draws no ball (the Oblitzerator's counters belong to the Oblitzerator alone, RE 4.5).
 *    Nobody swings at the machine meanwhile: a plain blow draws a Blind Ball and a spell a Mute Ball, one time in three (RE 4.2).
 * 3. **Tidus hastes Lulu once**, so her three casts come sooner (his start command; Haste is his, RE 5); every other member Defends until the crane has power.
 * 4. **With the crane powered Tidus uses it** (RE 4.5): the Oblitzerator drops to a sixteenth of its HP and stops acting and answering. **Then anyone swings**: 375 HP is two blows.
 * 5. If the crane is spent or gone and the machine is alive, swing at the machine.
 *
 * Measured on the real engine over seeds 1 to 200 with the shipped build (Tidus, Lulu and Kimahri on the Luca estimate): see `docs/handoff/ch-oblitzerator.md`. The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { LUCA_CRANE_ID, OBLITZERATOR_FLAGS, OBLITZERATOR_ID, OBLITZERATOR_ROWS } from '../../data/ffx/oblitzerator-ids.ts'; // a module with no imports of its own
import { type Tactic, has } from './common.ts';

/** The Oblitzerator's combatant id (`src/data/ffx/oblitzerator-ids.ts`), the one `tacticFor` keys this encounter on. */
export const OBLITZERATOR_BOSS_IDS: readonly CombatantId[] = [OBLITZERATOR_ID];

/** A member needs a heal when the next Rush could be the last: under 45 percent of his maximum. */
const HEAL_UNDER = 0.45;

const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id: string | undefined, target?: CombatantId): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/** Rule 1: stand a fallen member up, heal the hurt. */
function care(commands: readonly AvailableCommand[], party: readonly FFXCombatant[]): Command | null {
  const down = party.find((c) => !alive(c));
  if (down) return pick(commands, 'item', 'phoenix-down', down.id);
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * HEAL_UNDER).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) return pick(commands, 'item', 'potion', hurt.id);
  return null;
}

export const oblitzeratorLine: Tactic = (actorId, commands, engine: BattleEngine) => {
  const state = engine.state();
  const machine = state.combatants[OBLITZERATOR_ID] as FFXCombatant | undefined;
  if (machine === undefined || !alive(machine)) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (me === undefined || me.side !== 'party') return null;
  const front = state.activeIds.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);
  const crane = (state.flags[OBLITZERATOR_FLAGS.crane] as number | undefined) ?? 0;
  const lifted = state.flags[OBLITZERATOR_FLAGS.ended] === true;

  // 1. Keep the party up.
  const tended = care(commands, front);
  if (tended) return tended;

  // 4. The machine is lifted: anyone swings (375 HP is two blows, and it answers nothing now).
  if (lifted) return pick(commands, 'attack', undefined, OBLITZERATOR_ID);

  // 4. The crane has power: Tidus uses it.
  if (crane === 1 && actorId === 'tidus') {
    const use = pick(commands, 'trigger', OBLITZERATOR_ROWS.useCrane, LUCA_CRANE_ID);
    if (use) return use;
  }

  // 2. The crane is dark: Lulu casts Thunder at it.
  if (crane === 0) {
    if (actorId === 'lulu' && !has(me, 'silence')) {
      const thunder = pick(commands, 'ability', OBLITZERATOR_ROWS.thunder, LUCA_CRANE_ID);
      if (thunder) return thunder;
    }
    // 3. Tidus hastes Lulu once; everyone else waits (a plain blow or a spell at the machine draws a ball back).
    const lulu = front.find((c) => c.id === 'lulu');
    if (actorId === 'tidus' && lulu !== undefined && alive(lulu) && !has(lulu, 'haste')) {
      const haste = pick(commands, 'ability', 'haste', lulu.id);
      if (haste) return haste;
    }
    return pick(commands, 'defend', undefined);
  }

  // The crane has power and it is not Tidus's turn: wait for him (a swing now would draw a ball for nothing).
  if (crane === 1) return pick(commands, 'defend', undefined);

  // 5. Anything else (the crane spent and the machine alive, or Tidus's key already used): swing at the machine.
  return pick(commands, 'attack', undefined, OBLITZERATOR_ID);
};

export default oblitzeratorLine;
