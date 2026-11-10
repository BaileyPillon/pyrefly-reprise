/**
 * Gullwings, Chapter 1 (the hidden chapter; FFX-2 only): the line the guide teaches, as the move advisor's tactic. **Game case: FFX-2 only** [AGENTS.md rule 14]. Registered under the FFX-2 game in `./lookup.ts`, so an FFX
 * board never reaches it; the combatant ids are the chapter's own `x2-boris`, `x2-flame-dragon`, `x2-guardian-beast` and `x2-ysls-zero`.
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/gullwings-ch1-bench.test.ts`): an input to a measurement, never game data, and nothing in it tunes a boss (hard rule 6;
 * `boss-side-fix-needs-measured-options`). It answers what the research says about the four fights (`research/re-ffx2-gullwings-chapter1.md`): Boris is weak to Fire and Ice, but a blow kills a spider of Defense 3, so the girls
 * simply strike, and his Sticky End may Stop a girl (a **Remedy** frees her); the Flame Dragon is weak to Ice and half Fire (it breathes Fire), so a Black Mage casts **Blizzard**; the Guardian Beast is weak to everything and
 * curses a girl (no changing dress after that, so the change is made on the first turn; a **Holy Water** lifts it); YSLS-Zero has Defense 104 and Magic Defense 3, so **magic** goes through where blows do not.
 *
 * Who is what, per fight (a girl changes once, on her first turn, along the one link her Garment Grid offers; a Change costs the turn):
 *
 * | Fight | Yuna | Rikku | Paine |
 * |---|---|---|---|
 * | Boris | Gunner, strikes | Thief, strikes | Warrior, strikes |
 * | Flame Dragon | Gunner, strikes | **Black Mage, Blizzard** | Warrior, strikes |
 * | Guardian Beast | **White Mage, heals** | **Black Mage, Fire** | **Black Mage, Fire** |
 * | YSLS-Zero | Gunner, strikes | Thief, strikes | Warrior, strikes |

 * The table is what the bench found (`tests/unit/chapters/gullwings-ch1-bench.test.ts`, 100 seeds a cell, five role tables compared), not what the guides' words suggest: against the Beast the changed party wins 97 of 100 with
 * 0.9 knock-outs a fight where the three starting dresspheres (with the same potions) win 79 with 3.4; against YSLS-Zero (Defense 104) the three starting dresspheres win 99 of 100, as often as any table, with fewer knock-outs than two
 * Black Mages (2.1 against 4.0; a Gunner's blow does 46 through the Defense, a Warrior's 68, a Black Mage's Fire 93), so the line does not change dress there. A White Mage Yuna beside a Thief and a Warrior takes fewer knock-outs
 * again (1.8) in half again the time (2.8 minutes against 1.9): a trade the bench shows and the line does not make. Boris and the Flame Dragon fall to any line at any party level from 4 to 22.

 * Every girl, before her own action, in this order: 1. **Revive** a fallen girl (a Phoenix Down; Yuna and Rikku). 2. **Free** a Stopped girl (a Remedy; Yuna and Rikku). 3. **Heal** the girl under 45 percent of her maximum
 * HP (a Hi-Potion, else a Potion; the White Mage's Pray when two girls are under 70 percent). Then the fight's role from the table.
 *
 * Returns `null` (the generic ladder) when none of the four bosses is on the field. It picks only among the rows the engine offers.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { X2_BORIS_ID, X2_FLAME_DRAGON_ID, X2_GUARDIAN_BEAST_ID, X2_YSLS_ZERO_ID } from '../../data/gullwings-ch1-ids.ts';
import { type Tactic, activeParty, aim, has, hpFraction } from './common.ts';

/** The chapter's four combatant ids: the tactic and the guide register the same ids (`src/data/ffx2/enemies/gullwings-ch1.ts`). */
export const GULLWINGS_CH1_BOSS_IDS: readonly CombatantId[] = [X2_BORIS_ID, X2_FLAME_DRAGON_ID, X2_GUARDIAN_BEAST_ID, X2_YSLS_ZERO_ID];

/** Heal below this fraction of a girl's maximum HP (our line, not game data: the bench's). */
export const HEAL_BELOW = 0.45;
/** The White Mage's Pray when this many girls are under {@link PRAY_BELOW}. */
export const PRAY_WHEN_GIRLS = 2;
export const PRAY_BELOW = 0.7;

/** The dressphere each girl fights in, per boss (a girl on her own sphere does not change). */
export const ROLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  [X2_BORIS_ID]: { yuna: 'gunner', rikku: 'thief', paine: 'warrior' },
  [X2_FLAME_DRAGON_ID]: { yuna: 'gunner', rikku: 'black-mage', paine: 'warrior' },
  [X2_GUARDIAN_BEAST_ID]: { yuna: 'white-mage', rikku: 'black-mage', paine: 'black-mage' },
  [X2_YSLS_ZERO_ID]: { yuna: 'gunner', rikku: 'thief', paine: 'warrior' },
};

/** The spell the Black Mage casts at each boss: Ice for the Flame Dragon (weak to Ice, half Fire), Fire elsewhere (Boris and the Beast are weak to it, YSLS-Zero neither weak nor resistant; all cost the same 4 MP). */
export const SPELL: Readonly<Record<string, string>> = {
  [X2_FLAME_DRAGON_ID]: 'x2-black-mage-blizzard',
  [X2_BORIS_ID]: 'x2-black-mage-fire',
  [X2_GUARDIAN_BEAST_ID]: 'x2-black-mage-fire',
  [X2_YSLS_ZERO_ID]: 'x2-black-mage-fire',
};

function itemRow(commands: AvailableCommand[], id: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === 'item' && 'id' in c.command && (c.command as { id: string }).id === id);
}

function abilityRow(commands: AvailableCommand[], id: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && (c.command as { id: string }).id === id);
}

function changeRow(commands: AvailableCommand[], to: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === 'spherechange' && (c.command as { extra?: { toDressphere?: string } }).extra?.toDressphere === to);
}

const wornOf = (c: AnyCombatant): string | undefined => (c as AnyCombatant & { dresspheres?: { current?: string } }).dresspheres?.current;

/** A role table: per boss id, per girl id, the dressphere she fights in. */
export type RoleTable = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** The tactic over a role table and a spell table (the shipped one is {@link ffx2GullwingsCh1}; the bench builds the others it compares). */
export function gullwingsTactic(roles: RoleTable, spells: Readonly<Record<string, string>>): Tactic {
  return (actorId, commands, engine) => run(roles, spells, actorId, commands, engine);
}

function run(roles: RoleTable, spells: Readonly<Record<string, string>>, actorId: CombatantId, commands: AvailableCommand[], engine: BattleEngine): Command | null {
  const state = engine.state();
  const boss = state.enemyIds.map((id) => state.combatants[id]).find((c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive && GULLWINGS_CH1_BOSS_IDS.includes(c.id));
  if (!boss) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  const living = party.filter((c) => c.alive);
  const helper = actorId === 'yuna' || actorId === 'rikku';

  // 1. Revive.
  const fallen = party.find((c) => !c.alive);
  if (fallen && helper) {
    const down = itemRow(commands, 'x2-phoenix-down');
    if (down) return aim(down, fallen.id);
  }
  // 2. Free a Stopped girl.
  const stopped = living.find((c) => c.id !== actorId && has(c, 'stop'));
  if (stopped && helper) {
    const remedy = itemRow(commands, 'x2-remedy');
    if (remedy) return aim(remedy, stopped.id);
  }
  // 3. Heal.
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (lowest && hpFraction(lowest) < HEAL_BELOW) {
    if (wornOf(self) === 'white-mage' && living.filter((c) => hpFraction(c) < PRAY_BELOW).length >= PRAY_WHEN_GIRLS) {
      const pray = abilityRow(commands, 'x2-white-mage-pray');
      if (pray) return aim(pray);
    }
    if (helper || hpFraction(lowest) < 0.25) {
      const potion = itemRow(commands, 'x2-hi-potion') ?? itemRow(commands, 'x2-potion');
      if (potion) return aim(potion, lowest.id);
    }
  }
  if (wornOf(self) === 'white-mage' && living.filter((c) => hpFraction(c) < PRAY_BELOW).length >= PRAY_WHEN_GIRLS) {
    const pray = abilityRow(commands, 'x2-white-mage-pray');
    if (pray) return aim(pray);
  }

  // The fight's role: change once to the girl's sphere, then play it.
  const want = roles[boss.id]?.[actorId];
  const worn = wornOf(self);
  if (want !== undefined && worn !== undefined && worn !== want) {
    const change = changeRow(commands, want);
    if (change) return { ...change.command, targets: [] } as Command;
  }
  if (worn === 'black-mage') {
    const cast = abilityRow(commands, spells[boss.id] ?? 'x2-black-mage-fire');
    if (cast) return aim(cast, boss.id);
  }
  if (worn === 'white-mage') {
    const pray = abilityRow(commands, 'x2-white-mage-pray');
    if (pray) return aim(pray);
  }
  const swing = commands.find((c) => c.enabled && c.command.kind === 'attack');
  return swing ? aim(swing, boss.id) : null;
}

export const ffx2GullwingsCh1: Tactic = gullwingsTactic(ROLES, SPELL);

export default ffx2GullwingsCh1;
