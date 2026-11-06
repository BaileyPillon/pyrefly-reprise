/**
 * Yuna's Ballad (the hidden chapter; FFX-2 only): Yuna alone against the possessed Rikku, then the possessed Paine. **Game case: FFX-2 only** [AGENTS.md rule 14]. Registered under the FFX-2 game in `./lookup.ts`, so an
 * FFX board never reaches it.
 *
 * ## The line
 *
 * The bench's `warrior` line (`tests/unit/helpers/yunasBalladDrive.ts#LINES.warrior`, `tests/unit/chapters/yunas-ballad-bench.test.ts`), written as a tactic for the Den kit's Yuna. **Why it exists:** Yuna starts as a White
 * Mage, who has no attack at all, so the generic ladder (and the move advisor that reads this tactic) answered a full turn with Pray, which heals about 109 HP and wins 0 of 8 seeds; the line below wins every seed of the
 * bench. The sources name a Warrior for the Breaks, a White Mage for Protect and a Dark Knight (GamerGuides, `research/ffx2-gippal-den-of-woe.md` section 5); Yuna's Tempered Will grid holds the White Mage, Gunner, Thief, Warrior
 * and Lady Luck (the Dark Knight is owned but off the grid), so the Warrior is the one of the three attackers that the bench found fastest (about 2.4 minutes the chapter against the Gunner's 2.7).
 *
 * 1. **Heal** under half her maximum HP: an X-Potion, else a Hi-Potion, else a Potion (a Cura as a White Mage if the bag is empty). Nothing heals between the duels, so this is the whole game (the bench's no-heal
 *    Warrior wins about one seed in two, the Chapter V preset's none).
 * 2. **Change to the Warrior** once (a Change costs the turn; the Gunner is the same answer one node over).
 * 3. **Attack** the one fighter.
 *
 * Returns `null` (the generic ladder) when neither fighter is on the field. It picks only among the rows the engine offers.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { X2_POSSESSED_PAINE_ID, X2_POSSESSED_RIKKU_ID } from '../../data/yunas-ballad-ids.ts';
import { type Tactic, aim, hpFraction } from './common.ts';

/** The two fighters: the tactic and the (future) guide register the same ids. */
export const YUNAS_BALLAD_BOSS_IDS: readonly CombatantId[] = [X2_POSSESSED_RIKKU_ID, X2_POSSESSED_PAINE_ID];

/** Heal below this fraction of her maximum HP (our line, not game data: the bench's). */
export const HEAL_BELOW = 0.5;
/** The healing items in the order a player reaches for them, strongest first. */
const HEAL_ITEMS = ['x2-x-potion', 'x2-hi-potion', 'x2-potion'] as const;
/** The dressphere the line fights in. */
export const FIGHT_DRESSPHERE = 'warrior';

function item(commands: AvailableCommand[], id: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === 'item' && 'id' in c.command && (c.command as { id: string }).id === id);
}

export const ffx2YunasBallad: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const foe = state.enemyIds
    .map((id) => state.combatants[id])
    .find((c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive && YUNAS_BALLAD_BOSS_IDS.includes(c.id));
  const self = state.combatants[actorId] as (AnyCombatant & { dresspheres?: { current?: string } }) | undefined;
  if (!foe || !self || actorId !== 'yuna') return null;

  if (hpFraction(self) < HEAL_BELOW) {
    for (const id of HEAL_ITEMS) {
      const potion = item(commands, id);
      if (potion) return aim(potion, self.id);
    }
    const cura = commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && (c.command as { id: string }).id === 'x2-white-mage-cura');
    if (cura) return aim(cura, self.id);
  }

  if (self.dresspheres?.current !== FIGHT_DRESSPHERE) {
    const change = commands.find((c) => c.enabled && c.command.kind === 'spherechange' && c.command.extra?.['toDressphere'] === FIGHT_DRESSPHERE);
    if (change) return change.command as Command;
  }

  const attack = commands.find((c) => c.enabled && c.command.kind === 'attack');
  return attack ? aim(attack, foe.id) : null;
};

export default ffx2YunasBallad;
