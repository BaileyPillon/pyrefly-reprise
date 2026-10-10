/**
 * The hidden Sinspawn Gui chapter (the Ridge of Mushroom Rock Road, Operation Mi'ihen; **FFX only** [AGENTS.md rule 14]): the line the two fights are beaten with on the Ridge build
 * (`data/ffx/builds/mushroom-rock.ts`; the party's numbers are an estimate, the fights' are the game's own, `research/re-ffx-ai-gui.md` "RE §n").
 * Registered under the FFX game in `./lookup.ts`, so an FFX-2 board never reaches it; it returns `null` (the generic ladder) when Gui is not on the field or an aeon has the turn.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/sinspawn-gui-bench.test.ts`, which wins 96 to 98 of 100 seeds in the first fight and every seed of the second on the real engine
 * (the bench prints the exact figures; the party estimate may move, the boss never does), written as a tactic rule for rule:
 *
 * 1. **Keep everyone up.** A Phoenix Down for a fallen member of the front line (a body Attack is 540 to 790, so a caster can fall in one blow); Cure, Hi-Potion or Potion for anyone under
 *    half; Esuna for the Venom's Poison (RE §4: poison on a permanent status).
 * 2. **Answer the head.** When it shakes (`gui.headState` = 3, the warning turn has passed) the next head turn is the Venom; **a damaging hit on it now stops it** (RE §5.3, §9 G-07). The head is
 *    out of reach of melee (RE §4, §9 G-09), so a spell, Wakka's weapon or Seymour's Fira does it: the first row that reaches it, Seymour's Fira first (it kills the second fight's 1,000-HP head).
 * 3. **Auron breaks the body's Power first.** Power Break **lands on the body and only the body** (RE §3.2: byte 0 on the body, 255 on the head and arms); the body's Attack is the fight's damage
 *    (RE §8: 618 to 698 against Defense 25). Measured on the bench: the first fight goes from about two wins in three to nearly every seed with that one turn.
 * 4. **Tidus hands out Haste and Cheer** while the body is fresh (Jegged: "Haste on everyone", Cheer and Focus early; research §13) and then hits like everyone else.
 * 5. **Arms first, then the body.** The arms shield the body from every physical command while one lives (RE §5.4, G-08); they have 800 HP and regrow together on the body's 3rd or 4th turn once
 *    both are down (RE §5.5, G-10). Physical attackers hit the arm with the least HP; Lulu's spells go to an arm too in the first fight. Once both are down the body is open to everything.
 * 6. **Spells and Overdrives need no opening** (RE §5.4: type 2 and type 0 commands pass the shield): Seymour's Fira, then his Requiem the moment the Stoic gauge allows it, on the body.
 *
 * The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, Command, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, activeParty, aim, has, revive, row, stacksOf } from './common.ts';

/** The two bodies (fight 1, fight 2), mirrored from `src/data/ffx/sinspawn-gui-ids.ts`. */
export const SINSPAWN_GUI_BOSS_IDS: readonly CombatantId[] = ['sinspawn-gui', 'sinspawn-gui-2'];
const HEAD: CombatantId = 'sinspawn-gui-head';
const ARMS: readonly CombatantId[] = ['sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'];
/** `src/battle/ffx/ai/sinspawn-gui-rules.ts#GUI_HEAD_STATE_FLAG`: 3 = the head has shaken and its next turn is the Venom. */
const HEAD_STATE_FLAG = 'gui.headState';

/** Heal anyone under this share of max HP. */
const HEAL_UNDER = 0.5;
/** A Hi-Potion (1,000 HP) is worth a turn when this much is missing; a Potion (200) when this much. */
const HI_POTION_WORTH = 700;
const POTION_WORTH = 250;
/** Tidus buffs while the body is above this share of its HP (the opening, not the end). */
const BUFF_WHILE_BODY_ABOVE = 0.75;

const living = (engine: BattleEngine, ids: readonly CombatantId[]): FFXCombatant[] =>
  ids.map((id) => engine.state().combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => !!c && c.alive && c.hp > 0 && !c.removed);

/** The first enabled row of `kind` (and `id`, when given) that can name `target` (when given). */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string, target?: CombatantId): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
}

function onTarget(commands: readonly AvailableCommand[], kind: 'ability' | 'item', id: string, target: CombatantId): Command | null {
  const r = pick(commands, kind, id, target);
  return r ? aim(r, target) : null;
}

/** Rule 1: revive, cure Poison, heal. */
function upkeep(commands: readonly AvailableCommand[], party: readonly FFXCombatant[]): Command | null {
  const raise = revive([...commands], [...party]);
  if (raise) return raise;
  const standing = party.filter((c) => c.alive && c.hp > 0);
  const poisoned = standing.find((c) => has(c, 'poison'));
  if (poisoned) {
    const cure = onTarget(commands, 'ability', 'esuna', poisoned.id);
    if (cure) return cure;
  }
  const hurt = standing.sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (!hurt || hurt.hp / hurt.stats.maxHp >= HEAL_UNDER) return null;
  const missing = hurt.stats.maxHp - hurt.hp;
  return (
    onTarget(commands, 'ability', 'cure', hurt.id) ??
    (missing > HI_POTION_WORTH ? onTarget(commands, 'item', 'hi-potion', hurt.id) : null) ??
    (missing > POTION_WORTH ? onTarget(commands, 'item', 'potion', hurt.id) : null)
  );
}

/** Rule 2: the first row that reaches the head and hurts it. */
function stopTheVenom(commands: readonly AvailableCommand[]): Command | null {
  for (const id of ['fira', 'fire', 'thunder', 'blizzard', 'water']) {
    const spell = onTarget(commands, 'ability', id, HEAD);
    if (spell) return spell;
  }
  const swing = pick(commands, 'attack', undefined, HEAD); // Wakka's weapon reaches it (RE §4)
  return swing ? aim(swing, HEAD) : null;
}

/** Rule 5: the arm with the least HP that this row can name, else the body. */
function mark(row_: AvailableCommand, body: FFXCombatant, arms: readonly FFXCombatant[]): CombatantId {
  const arm = [...arms].sort((a, b) => a.hp - b.hp).find((a) => row_.validTargets.includes(a.id));
  return arm ? arm.id : row_.validTargets.includes(body.id) ? body.id : (row_.validTargets[0] as CombatantId);
}

export const sinspawnGui: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const body = SINSPAWN_GUI_BOSS_IDS.map((id) => state.combatants[id] as FFXCombatant | undefined).find((c) => c && c.side === 'enemy' && c.alive);
  if (!body) return null;
  if (state.aeonId === actorId) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (!me) return null;
  const party = activeParty(engine).filter((c): c is FFXCombatant => !c.removed);
  const arms = living(engine, ARMS);
  const head = living(engine, [HEAD])[0];

  // 1. Keep everyone up.
  const care = upkeep(commands, party);
  if (care) return care;

  // 2. The head has shaken: a damaging hit now stops the Venom.
  if (head && state.flags[HEAD_STATE_FLAG] === 3) {
    const stop = stopTheVenom(commands);
    if (stop) return stop;
  }

  // 3. Auron: Power Break on the body, once.
  if (actorId === 'auron' && !has(body, 'power-break')) {
    const breaker = onTarget(commands, 'ability', 'power-break', body.id);
    if (breaker) return breaker;
  }

  // 4. Tidus: Haste on whoever lacks it, then Cheer to two stacks, while the body is still fresh.
  if (actorId === 'tidus' && body.hp > body.stats.maxHp * BUFF_WHILE_BODY_ABOVE) {
    const lacking = party.find((c) => c.alive && c.hp > 0 && !has(c, 'haste'));
    const haste = lacking ? onTarget(commands, 'ability', 'haste', lacking.id) : null;
    if (haste) return haste;
    const cheer = row([...commands], ['Cheer']);
    if (cheer && stacksOf(me, 'cheer') < 2) return aim(cheer);
  }

  // 6. Seymour: his Requiem the moment the gauge allows it (it passes the shield), else Fira on the body.
  if (actorId === 'seymour') {
    const requiem = pick(commands, 'overdrive');
    if (requiem) return aim(requiem, body.id);
    return onTarget(commands, 'ability', 'fira', body.id) ?? onTarget(commands, 'ability', 'fire', body.id);
  }

  // Any other Overdrive that is ready goes on the body (type 0: nothing shields it).
  const overdrive = pick(commands, 'overdrive');
  if (overdrive) return aim(overdrive, overdrive.validTargets.includes(body.id) ? body.id : undefined);

  // 5. Arms first, then the body. Lulu's spells go to an arm in the first fight; the physical hit goes to the arm with the least HP.
  if (me.id === 'lulu') {
    const spell = commands.find((c) => c.enabled && c.category === 'blackmagic' && (arms.length > 0 ? arms.some((a) => c.validTargets.includes(a.id)) : c.validTargets.includes(body.id)));
    if (spell) return aim(spell, mark(spell, body, body.id === 'sinspawn-gui' ? arms : []));
  }
  const swing = pick(commands, 'attack');
  if (swing) return aim(swing, mark(swing, body, arms));
  return null;
};

export default sinspawnGui;
