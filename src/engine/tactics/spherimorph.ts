/**
 * The hidden Spherimorph chapter (the guardian of the spring in the Macalania Woods; **FFX only** [AGENTS.md rule 14]): the line the fight is played with. It is registered under the FFX game in `./lookup.ts`, so an
 * FFX-2 board never reaches it, and it returns `null` (a swing) when Spherimorph is not on the field.
 *
 * ## Why the card needed it
 *
 * The fight is a puzzle, not a damage race (`research/re-ffx-spherimorph.md` section 0): Spherimorph takes damage from one element only, absorbs the other three and Holy (the damage heals it), and answers a hit
 * by what hit it. A caster who guesses wastes the turn and feeds it (a wrong -ra cast heals it about 1,300 and is answered on all three of the line); a player who swings at it plain is divided by three (Armored: 42 to 47
 * a swing). The generic ladder knows neither, so this is the line the fight needs: it reads the one clue the game gives and acts on it. It is also the line the bench calls the **advisor**
 * (`tests/unit/helpers/spherimorphBot.ts`), so the card, the strategy guide's NEXT line and the auto-battler all play it. **Nothing in the fight is tuned**: the numbers are the game's.
 *
 * ## The line, and where each rule comes from
 *
 * 1. **Keep the party up** (the skeleton): Phoenix Down on a fallen member; Yuna's Cura (or Cure, or a potion when she cannot) for anyone under 55 percent of his HP, and a potion from anyone else for someone under a third. Press halves everybody's current HP and the counters
 *    land on the same few people (RE 4.2, 6).
 * 2. **Read the clue.** The one thing the game shows is the spell Spherimorph answers a hit with, and that spell is the element **opposite** its weakness (RE 4.1: Fire and Ice are a pair, Thunder and Water the other).
 *    The line reads it from the battle's own log, the way a player reads the screen: the latest spell Spherimorph cast, unless an Elemental Shift came after it (a shift redraws the state, so the old clue is stale).
 * 3. **Probe when the clue is stale or missing.** The first fighter in the line who can strike plain (Tidus; any non-caster) attacks with an unelemented weapon: it is divided by three, but it is always answered with the
 *    clue (RE 4.3 item 6). Lulu never probes.
 * 4. **Nuke when the clue is known.** Lulu casts the opposite of the clue, at the highest tier she has (RE 6: Fira 1,822 to 2,056 on the weakness against a wrong-element -ra cast that heals it about 1,300). The hit
 *    shifts the state, so the next turn probes again (one time in four it draws the same state; the line probes anyway, because a guess costs a heal). While the clue is stale she builds Focus, **with no cap** (review of 2026-11-06, a leak found in the fix pass): FFX's command window has no Defend row, so a line that says "wait" is not printable and the card then falls back
 *    to its own ranking, which simulates each row on the live board and so reads the hidden weakness (Lulu's top row was then the very element it is weak to). A Focus row is always printable, costs no MP and never leaks. The
 *    waits of Tidus and Yuna fall back the same way and show a harmless row (Cheer, a Nul spell), which reads nothing of the weakness; `spherimorph-tactic.test.ts` pins that no card of the three changes with the weakness.
 * 5. **Tidus, clue known:** Haste on Lulu, once; otherwise Defend (a second plain blow would only draw another answer). **Yuna:** Protect on the line once Spherimorph is under half and Press has begun (RE 4.2).
 * 6. **Auron, when he is in front:** Armor Break once (RE 1.2: it lands, and takes the Armored division away, RE 6: his plain blow 382 to 431 becomes 900 to 1,016); then he strikes. Wakka, Kimahri and Rikku swing.
 * 7. Anything else swings (`null`), as the generic ladder does after a tactic that has no opinion.
 *
 * Measured on the real engine over seeds 1 to 200 (`docs/handoff/ch-spherimorph.md` section 6). The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, BattleEvent, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { SPHERIMORPH_ID, SPHERIMORPH_ROWS } from '../../data/ffx/spherimorph-ids.ts'; // a module with no imports of its own
import { type Tactic, has } from './common.ts';

/** Spherimorph's combatant id (`src/data/ffx/spherimorph-ids.ts`), the one `tacticFor` keys this encounter on. */
export const SPHERIMORPH_BOSS_IDS: readonly CombatantId[] = [SPHERIMORPH_ID];

type Element = 'fire' | 'ice' | 'lightning' | 'water';

/** The element each of its answers is made of: the monster-side rows and the player-side spells it casts. */
const ANSWER_ELEMENT: Readonly<Record<string, Element>> = {
  [SPHERIMORPH_ROWS.fire]: 'fire', [SPHERIMORPH_ROWS.blizzard]: 'ice', [SPHERIMORPH_ROWS.thunder]: 'lightning', [SPHERIMORPH_ROWS.water]: 'water',
  [SPHERIMORPH_ROWS.playerFire]: 'fire', [SPHERIMORPH_ROWS.playerBlizzard]: 'ice', [SPHERIMORPH_ROWS.playerThunder]: 'lightning', [SPHERIMORPH_ROWS.playerWater]: 'water',
};

/** Its answer is the opposite of its weakness: Fire and Ice are a pair, Thunder and Water the other (RE 4.1). */
const OPPOSITE: Readonly<Record<Element, Element>> = { fire: 'ice', ice: 'fire', lightning: 'water', water: 'lightning' };

/** The spells that hit each element, highest tier first (Lulu's preset has the -ra tier). */
const CAST_LADDER: Readonly<Record<Element, readonly string[]>> = {
  fire: ['firaga', 'fira', 'fire'],
  ice: ['blizzaga', 'blizzara', 'blizzard'],
  lightning: ['thundaga', 'thundara', 'thunder'],
  water: ['waterga', 'watera', 'water'],
};

/** A member needs a heal when the next blow and an answer could be the last: under 55 percent of his maximum. */
const HEAL_UNDER = 0.55;
const HEAL_UNDER_OTHERS = 0.33;
const HEAL_ITEMS = ['mega-potion', 'x-potion', 'hi-potion'] as const;

const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id: string | undefined, target?: CombatantId): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/**
 * **The clue** (what a player reads off the screen): the element of the latest spell Spherimorph cast, or `null` when an Elemental Shift came after it or it has cast none. This is the element OPPOSITE its weakness.
 * Read from the battle's own log; the line never reads the script's hidden state.
 */
export function clueOf(log: readonly BattleEvent[]): Element | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i] as BattleEvent;
    if (e.type !== 'action-start' || e.actorId !== SPHERIMORPH_ID) continue;
    const id = e.abilityId;
    if (id === SPHERIMORPH_ROWS.shift) return null;
    const element = id === undefined ? undefined : ANSWER_ELEMENT[id];
    if (element !== undefined) return element;
  }
  return null;
}

/** Rule 1: stand a fallen member up, heal the hurt. Yuna heals first; the others drink a potion only for someone under a third while she can still cast. */
function care(commands: readonly AvailableCommand[], party: readonly FFXCombatant[], me: FFXCombatant): Command | null {
  const down = party.find((c) => !alive(c));
  if (down) return pick(commands, 'item', 'phoenix-down', down.id);
  const canCast = !has(me, 'silence');
  const healerHere = party.some((c) => c.id === 'yuna' && !has(c, 'silence'));
  const under = me.id === 'yuna' || !healerHere ? HEAL_UNDER : HEAL_UNDER_OTHERS;
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * under).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp);
  const worst = hurt[0];
  if (worst === undefined) return null;
  const group = hurt.length >= 2 && canCast ? pick(commands, 'ability', 'cura', worst.id) : null;
  const single = (canCast && pick(commands, 'ability', 'cure', worst.id)) || null;
  return group ?? single ?? HEAL_ITEMS.map((i) => pick(commands, 'item', i, worst.id)).find((c) => c !== null) ?? null;
}

export const spherimorph: Tactic = (actorId, commands, engine: BattleEngine) => {
  const state = engine.state();
  const boss = state.combatants[SPHERIMORPH_ID] as FFXCombatant | undefined;
  if (boss === undefined || !alive(boss)) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (me === undefined || me.side !== 'party') return null;
  const front = state.activeIds.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);

  // 1. Keep the party up.
  const tended = care(commands, front, me);
  if (tended) return tended;

  const party = front.filter(alive);
  const canCast = !has(me, 'silence');
  const clue = clueOf(state.log as readonly BattleEvent[]);
  const pressing = boss.hp < boss.stats.maxHp / 2;

  // 6. Auron's armour break, once, before his blows.
  if (actorId === 'auron') {
    if (!has(boss, 'armor-break')) return pick(commands, 'ability', 'armor-break', boss.id);
    return null;
  }

  if (actorId === 'lulu') {
    if (!canCast) return null;
    // 4. The clue is known: cast the opposite of it at the highest tier. Stale: build Focus, never probe.
    if (clue !== null) {
      for (const id of CAST_LADDER[OPPOSITE[clue]]) {
        const cast = pick(commands, 'ability', id, boss.id);
        if (cast) return cast;
      }
      return null;
    }
    const focus = pick(commands, 'ability', 'focus', me.id);
    if (focus) return focus;
    return pick(commands, 'defend', undefined);
  }

  if (actorId === 'yuna') {
    // 5. Press has begun: Protect halves it.
    if (pressing && canCast) {
      const open = party.find((c) => !has(c, 'protect'));
      const protect = open ? pick(commands, 'ability', 'protect', open.id) : null;
      if (protect) return protect;
    }
    return pick(commands, 'defend', undefined);
  }

  if (actorId === 'tidus') {
    // 3. Stale clue: probe with a plain blow. Known: Haste on Lulu once, then wait.
    if (clue === null) return null;
    const lulu = party.find((c) => c.id === 'lulu');
    if (lulu !== undefined && canCast && !has(lulu, 'haste')) {
      const haste = pick(commands, 'ability', 'haste', lulu.id);
      if (haste) return haste;
    }
    return pick(commands, 'defend', undefined);
  }

  // Wakka, Kimahri, Rikku: a plain blow, as the generic ladder gives.
  return null;
};

export default spherimorph;
