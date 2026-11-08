/**
 * The hidden Omega Ruins chapter (Ultima Weapon, Omega Weapon and Nemesis; **FFX only** [AGENTS.md rule 14]): the line the three fights are played with. It is registered under the FFX game in `./lookup.ts`, so an FFX-2 board never
 * reaches it, and it returns `null` (the generic ladder) when none of the three is on the field.
 *
 * ## Why the card needs it
 *
 * Against the endgame party (HP 9,999, every stat 255) **Ultima Weapon and Omega Weapon are checks of preparation, not fights** (`research/re-ffx-omega-ultima-nemesis.md` section 6: the biggest blow is about 330, and the party
 * kills Ultima Weapon in one hit and Omega Weapon in eleven), and **Nemesis is the fight**: its Ethereal Cannon, Ultra Spark and Armageddon each exceed a member's 9,999 HP (its Attack, 13,975 to 15,780, is halved by the party's Auto-Protect and leaves a member at 2,000 to 3,000), so the party is dead in a third of Nemesis's turns unless it has a second
 * life. Until this line existed the first menu's NEXT BEST MOVE card named "Attack" or an Overdrive, and an Overdrive is the one thing Nemesis punishes (it answers every special-class command with an Ultima on the whole line).
 * This is the line the bench calls the **advisor** (`tests/unit/chapters/omega-ruins-bench.test.ts`, `tools/omega-ruins-bench.mjs`), moved into the game so that the card, the strategy guide's NEXT line and the auto-battler all
 * play it. **Nothing in the fight is tuned**: the enemy numbers are the game's (`research/re-ffx-omega-ultima-nemesis.md`), the party is an `[estimate]` preset (`data/ffx/builds/omega-ruins.ts`).
 *
 * ## The line, and where each rule comes from
 *
 * 1. **Keep the party up** (the skeleton; every fight): stand a fallen member up with a Phoenix Down, cure what stops a person acting (Soft for Petrify, which Ultima Weapon's and Omega Weapon's Break puts on one of you; Esuna or a
 *    Remedy for Confuse and Sleep; an Echo Screen or a Remedy for Silence). Heal nobody under Nemesis: a Cannon, a Spark or an Armageddon is lethal at any HP, and a second blow kills what the Attack left.
 * 2. **Never an Overdrive against Nemesis**, and never a Mix or an item thrown at it: each is a special-class command and is answered by an Ultima (5,100 to 5,800) on the whole line (`research/re-ffx-omega-ultima-nemesis.md`
 *    4.3). The line swings and casts.
 * 3. **Auto-Life on the line, Yuna's first duty against Nemesis** (the guides' own advice for the fight, and the note's 6: its Ultra Spark and Armageddon kill all three at once, and **a Phoenix Down cannot stand a party that is all down
 *    at once**: an Auto-Phoenix needs a living member to use it). Auto-Life costs 97 MP, so Yuna **drinks a Turbo Ether, an Elixir or an Ether when she cannot afford one**; once it is gone from a member (a KO uses it up) she casts it again.
 * 4. **Tidus: Quick Hit** (rank 2 against the Attack's 3: the same blow in two thirds of the time; it is a physical blow, so the Ultima reply does not fire) while he has the MP; **Lulu: Attack** (her blow reads her weapon, and the
 *    spells of the party's cell are not stronger per tick against Nemesis: see the bench).
 * 5. Everything else swings (an explicit Attack, so the generic ladder never picks an Overdrive).
 *
 * `lineWith` builds a line with some of those rules taken away (the bench's ablations); `omegaRuins` is the shipped line. The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { NEMESIS_ID, OMEGA_WEAPON_ID, ULTIMA_WEAPON_ID } from '../../data/ffx/omega-ruins-ids.ts'; // a module with no imports of its own
import { type Tactic, has } from './common.ts';

/** The three bodies' combatant ids (`src/data/ffx/omega-ruins-ids.ts`), the ones `tacticFor` keys this encounter on. */
export const OMEGA_RUINS_BOSS_IDS: readonly CombatantId[] = [ULTIMA_WEAPON_ID, OMEGA_WEAPON_ID, NEMESIS_ID];

/** What Auto-Life costs (the catalogue's row, `data/ffx/abilities/whitemagic-revival.ts`): the line drinks an Ether when Yuna has less. */
export const AUTO_LIFE_MP = 97;
/** What Quick Hit costs (`data/ffx/abilities/skill-breaks-misc.ts`). */
export const QUICK_HIT_MP = 36;
/** Yuna's MP items, the biggest first. */
const MP_ITEMS = ['turbo-ether', 'elixir', 'ether'] as const;

/** The switches of a line; each is one rule of the header, so the bench can take one away at a time. */
export interface LineOptions {
  /** Rule 1: the skeleton's care (Phoenix Down, cures). */
  readonly care: boolean;
  /** Rule 3: Yuna keeps Auto-Life on the line against Nemesis. */
  readonly autoLife: boolean;
  /** Rule 3: Yuna drinks an MP item when she cannot afford a cast. */
  readonly drinkMp: boolean;
  /** Rule 4: Tidus swings Quick Hit while he has the MP. */
  readonly quickHit: boolean;
  /** Rule 3: how many living members Yuna keeps Auto-Life on (3 is all of them). */
  readonly lifeHolders: number;
}

export const SHIPPED_LINE: LineOptions = { care: true, autoLife: true, drinkMp: true, quickHit: true, lifeHolders: 3 };

const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id: string | undefined, target?: CombatantId): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/** Rule 1: stand a fallen member up, cure what stops a person acting. */
function care(commands: readonly AvailableCommand[], party: readonly FFXCombatant[], me: FFXCombatant): Command | null {
  const down = party.find((c) => !alive(c));
  if (down) return pick(commands, 'item', 'phoenix-down', down.id);
  const canCast = !has(me, 'silence');
  for (const c of party) {
    if (!alive(c)) continue;
    if (has(c, 'petrify')) {
      const cure = pick(commands, 'item', 'soft', c.id);
      if (cure) return cure;
    }
  }
  for (const c of party) {
    if (!alive(c)) continue;
    if (has(c, 'silence') && c.id === 'yuna') {
      const cure = pick(commands, 'item', 'echo-screen', c.id) ?? pick(commands, 'item', 'remedy', c.id); // the endgame bag holds Remedies, not Echo Screens
      if (cure) return cure;
    }
    if (has(c, 'confuse') || has(c, 'sleep')) {
      const cure = (canCast && pick(commands, 'ability', 'esuna', c.id)) || pick(commands, 'item', 'remedy', c.id);
      if (cure) return cure;
    }
  }
  return null;
}

/** Rule 3: Auto-Life on a living member who lacks it (the front line in slot order), or an MP item when Yuna cannot pay for the cast. */
function lifeUpkeep(commands: readonly AvailableCommand[], party: readonly FFXCombatant[], me: FFXCombatant, options: LineOptions): Command | null {
  if (has(me, 'silence')) return null;
  const living = party.filter(alive);
  if (living.filter((c) => has(c, 'auto-life')).length >= Math.min(options.lifeHolders, living.length)) return null;
  const bare = living.find((c) => !has(c, 'auto-life'));
  if (bare === undefined) return null;
  if (me.mp >= AUTO_LIFE_MP) return pick(commands, 'ability', 'auto-life', bare.id);
  if (!options.drinkMp) return null;
  for (const item of MP_ITEMS) {
    const drink = pick(commands, 'item', item, me.id);
    if (drink) return drink;
  }
  return null;
}

/** The line, with the rules `options` leaves on. */
export function lineWith(options: LineOptions): Tactic {
  return (actorId, commands, engine: BattleEngine) => {
    const state = engine.state();
    const present = OMEGA_RUINS_BOSS_IDS.map((id) => state.combatants[id] as FFXCombatant | undefined).find((c) => c !== undefined && alive(c));
    if (present === undefined) return null;
    const me = state.combatants[actorId] as FFXCombatant | undefined;
    if (me === undefined || me.side !== 'party') return null;
    const front = state.activeIds.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);
    const strike = pick(commands, 'attack', undefined, present.id);

    const tended = options.care ? care(commands, front, me) : null;
    if (tended) return tended;

    if (present.id === NEMESIS_ID) {
      if (actorId === 'yuna' && options.autoLife) {
        const upkeep = lifeUpkeep(commands, front.filter(alive), me, options);
        if (upkeep) return upkeep;
      }
      if (actorId === 'tidus' && options.quickHit && !has(me, 'silence') && me.mp >= QUICK_HIT_MP) {
        const hit = pick(commands, 'ability', 'quick-hit', present.id);
        if (hit) return hit;
      }
    }
    return strike; // rule 5: an explicit swing, so the generic ladder never spends an Overdrive on a Weapon
  };
}

/** The shipped line. */
export const omegaRuins: Tactic = lineWith(SHIPPED_LINE);

export default omegaRuins;
