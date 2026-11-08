/**
 * The Youth League Tournament (the hidden chapter; FFX-2 only): Yaibal, four mobs, Elma and Lucil on Mushroom Rock Road, seven fights in a row. **Game case: FFX-2 only** [AGENTS.md rule 14]. Registered under the FFX-2
 * game in `./lookup.ts`, so an FFX board never reaches it.
 *
 * ## The line
 *
 * The bench's `darkness` line (`tests/unit/helpers/youthLeagueDrive.ts#LINES.darkness`, `tests/unit/chapters/youth-league-bench.test.ts`), written as a tactic for the Chapter V preset: Yuna the White Mage heals and
 * raises, Rikku and Paine the Dark Knights cast **Darkness**, which hits every enemy at once and ignores Defense, the sourced clear of the same party on the same road (`research/ffx2-gippal-den-of-woe.md` §5). It
 * picks only among the rows the engine offers. **Why it exists:** the shipped auto-battler's generic ladder (the bench's `ladder` line, the autopilot on a board with no tactic) wins Lucil 88 times in 100 and the whole
 * chain 81 times in 100 at bench speed (27 of 40 at a human pace), with 5.5 girls down a fight against her: Harbinger's Doom (10.5 s, nothing cures it) takes a girl out every fifth action and the ladder's heals do
 * not raise her in time. This line wins every seed of every act with no girl down (`tests/unit/chapters/youth-league-bench.test.ts`).
 *
 * Yuna:
 * 1. **Revive**: a Mega Phoenix for two down, else a Phoenix Down on the first (Doom is not cured by anything in the data, so the raise is the answer to it).
 * 2. **Heal**: a Mega-Potion when two are under half; a Curaga (or an X-Potion) for one under 40 percent.
 * 3. **Cura** for one under 75 percent; else **Pray**.
 *
 * The Dark Knights: a Phoenix Down for Yuna when she is down; an X-Potion when under a fifth; a plain Attack at the weakest enemy when under 35 percent (Darkness costs HP); else **Darkness**.
 *
 * Returns `null` (the generic ladder) when no fighter of the chapter is on the field.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, aim, activeParty, hpFraction } from './common.ts';
import { ACT_ENEMY_IDS } from '../../data/youth-league-ids.ts';

/** The twenty fighters of the seven acts: the tactic and the guide register the same ids. */
export const YOUTH_LEAGUE_BOSS_IDS: readonly CombatantId[] = ACT_ENEMY_IDS.flat();

/** Heal one girl under this fraction (the bench's line, not game data). */
export const HEAL_ONE_BELOW = 0.4;
/** Mend two together when they are both under this fraction. */
export const HEAL_TWO_BELOW = 0.5;
/** Cura when nobody is lower than the above but one is under this. */
export const CURA_BELOW = 0.75;
/** A Dark Knight takes a potion under this fraction, and stops paying Darkness's HP under the next. */
export const KNIGHT_POTION_BELOW = 0.2;
export const KNIGHT_SWING_BELOW = 0.35;

function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return r ? ({ ...r.command, targets } as Command) : null;
}

function yunaTurn(commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  const down = party.filter((u) => !u.alive);
  if (down.length >= 2) {
    const mega = use(commands, 'item', 'x2-mega-phoenix', []);
    if (mega) return mega;
  }
  if (down[0]) {
    const back = use(commands, 'item', 'x2-phoenix-down', [down[0].id]) ?? use(commands, 'ability', 'x2-white-mage-life', [down[0].id]);
    if (back) return back;
  }
  const living = party.filter((u) => u.alive);
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (living.filter((u) => hpFraction(u) < HEAL_TWO_BELOW).length >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (lowest && hpFraction(lowest) < HEAL_ONE_BELOW) {
    const one = use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]) ?? use(commands, 'item', 'x2-x-potion', [lowest.id]);
    if (one) return one;
  }
  if (lowest && hpFraction(lowest) < CURA_BELOW) {
    const cura = use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(commands, 'ability', 'x2-white-mage-pray', []);
}

function knightTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], foes: AnyCombatant[]): Command | null {
  const yuna = party.find((u) => u.id === 'yuna');
  if (yuna && !yuna.alive) {
    const back = use(commands, 'item', 'x2-phoenix-down', [yuna.id]);
    if (back) return back;
  }
  if (hpFraction(self) < KNIGHT_POTION_BELOW) {
    const potion = use(commands, 'item', 'x2-x-potion', [self.id]);
    if (potion) return potion;
  }
  const weakest = [...foes].sort((a, b) => a.hp - b.hp)[0];
  const swing = (): Command | null => {
    const attack = commands.find((c) => c.enabled && c.command.kind === 'attack');
    return attack && weakest ? aim(attack, weakest.id) : null;
  };
  if (hpFraction(self) < KNIGHT_SWING_BELOW) {
    const s = swing();
    if (s) return s;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []) ?? swing();
}

export const ffx2YouthLeague: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const foes = state.enemyIds
    .map((id) => state.combatants[id])
    .filter((c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive && !c.removed && YOUTH_LEAGUE_BOSS_IDS.includes(c.id));
  if (foes.length === 0) return null;
  const party = activeParty(engine);
  const self = party.find((u) => u.id === actorId);
  if (!self) return null;
  return actorId === 'yuna' ? yunaTurn(commands, party) : knightTurn(commands, self, party, foes);
};

export default ffx2YouthLeague;
