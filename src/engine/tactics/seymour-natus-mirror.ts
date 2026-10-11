/**
 * Chapter X, the **mirror** line: Provoke and Reflect (research `ffx-seymour-natus-highbridge.md` §6.3 row 2, GameFAQs'
 * strategy 2, `[single source: GameFAQs]` plus the decompile: Natus keeps control when Provoked and aims every spell of his at
 * the Provoker, and Multi-ra, Break and Flare are all reflectable).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Selected by `NATUS_LINE === 'mirror'` (`src/data/guides/natus-line.ts`); the
 * shipped line never calls this file.
 *
 * ## The line
 *
 * 1. **Kimahri hands his turn to Rikku and Yuna hers to Auron** (a switch takes the outgoing member's turn at once, so neither
 *    costs a turn): the party is Tidus, Rikku and Auron. No aeons are sent, so Natus never has a Banish to spend.
 * 2. **Tidus Provokes Natus** whenever the Provoke is not on him.
 * 3. **Rikku keeps Reflect on Tidus.** Every spell Natus aims at the Provoker bounces: Flare and the Multi-ra pair land on
 *    Natus himself (Magic Defense 0), Break misses him (he is Petrify-immune).
 * 4. Upkeep is items only (a Cura on the Reflected Provoker would bounce too): a Soft on a stone, a Phoenix Down on a fallen
 *    member, a Hi-Potion under 45 %.
 * 5. Auron Talks, then swings; Tidus swings; Rikku waits (Defend) when she has nothing to cast.
 *
 * Mortibody is not Provoke-able (immune), so its Claw, Desperado and Cura still come; the measured line wins them all.
 * This is the bench's `provokeReflect` (`tests/unit/chapters/natus-bench.test.ts`), moved here without a rule changed.
 */

import type { AvailableCommand, Command, FFXCombatant } from '../../battle/common/types.ts';
import { activeParty, has, hpFraction } from './common.ts';
import type { BattleEngine } from '../../battle/common/types.ts';
import { SEYMOUR_NATUS_ID, defend, hitNatus, offered, switchTo, use } from './seymour-natus-rows.ts';

/** Heal under this fraction of max HP (the bench's intended line). */
const HEAL_UNDER = 0.45;

export function mirrorTactic(actorId: string, commands: AvailableCommand[], engine: BattleEngine, natus: FFXCombatant): Command {
  if (actorId === 'kimahri') return switchTo(commands, 'rikku') ?? defend(commands);
  if (actorId === 'yuna') return switchTo(commands, 'auron') ?? defend(commands);
  const party = activeParty(engine).filter((c) => !(c as FFXCombatant).removed);
  const tidus = engine.state().combatants['tidus'] as FFXCombatant | undefined;

  const stone = party.find((c) => has(c, 'petrify'));
  if (stone && offered(commands, 'item', 'soft', stone.id)) return use('item', 'soft', stone.id);
  const down = party.find((c) => c.hp <= 0 && !has(c, 'petrify'));
  if (down && offered(commands, 'item', 'phoenix-down', down.id)) return use('item', 'phoenix-down', down.id);

  if (actorId === 'tidus' && !has(natus, 'provoke') && offered(commands, 'ability', 'provoke', SEYMOUR_NATUS_ID)) {
    return use('ability', 'provoke', SEYMOUR_NATUS_ID);
  }
  if (actorId === 'rikku' && tidus && tidus.hp > 0 && !has(tidus, 'reflect') && offered(commands, 'ability', 'reflect', 'tidus')) {
    return use('ability', 'reflect', 'tidus');
  }
  const low = party.filter((c) => c.hp > 0 && hpFraction(c) < HEAL_UNDER).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (low && offered(commands, 'item', 'hi-potion', low.id)) return use('item', 'hi-potion', low.id);
  if (actorId === 'auron') {
    const talk = offered(commands, 'trigger', 'talk');
    return talk ? talk.command : hitNatus(commands);
  }
  return actorId === 'rikku' ? defend(commands) : hitNatus(commands);
}
