/**
 * Chapter 3, part 1 — Braska's Final Aeon and the Yu Pagodas
 * [ffx-bfa-yu-yevon §1.4, §1.6].
 *
 * One monster entry serves both forms; the battle script overrides HP and
 * Strength on transformation. His Overdrive gauge is a first-class visible
 * resource fed mostly by the two Pagodas, and the **Talk** trigger zeroes it and
 * costs him his next turn — an exhaustible panic button with two charges,
 * battle-wide rather than two per form.
 */

import type { Command } from '../../common/types.ts';
import { isAlive, livingEnemies, rtOf, tryActor } from '../state.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

const TALK_PENDING = 'bfa.talkPending';
const FORM2_OPENED = 'bfa.form2Opened';

/** BFA's own weighted turn table. Authored weights [ffx-bfa-yu-yevon §1.6, estimate]. */
function weightedTurn(ai: AiContext, form: number, belowHalf: boolean): Command {
  const party = ai.ctx.state.activeIds.slice();
  if (form === 0) {
    return ai.ctx.rng.int(0, 99) < 75
      ? use(ai, 'left-arm-strike', [])
      : use(ai, 'jecht-beam', []);
  }
  const roll = ai.ctx.rng.int(0, 99);
  if (belowHalf) {
    // Blade Blitz absorbs the whole Left-Arm Strike share below 50%.
    return roll < 25 ? use(ai, 'jecht-beam', []) : use(ai, 'blade-blitz', party);
  }
  if (roll < 60) return use(ai, 'left-arm-strike-2', []);
  if (roll < 85) return use(ai, 'jecht-beam', []);
  return use(ai, 'blade-blitz', party);
}

/**
 * Which Overdrive the full gauge spends on, checked in this order
 * [ffx-bfa-yu-yevon §1.6].
 */
function overdriveBranch(ai: AiContext, form: number, belowHalf: boolean): Command {
  if (ai.ctx.state.aeonId) {
    return use(ai, form === 0 ? 'jecht-bomber' : 'jecht-bomber-2', []);
  }
  if (form === 1 && belowHalf) return use(ai, 'ultimate-jecht-shot', ai.ctx.state.activeIds.slice());
  if (form === 1) return use(ai, 'triumphant-grasp-2', []);
  return use(ai, 'triumphant-grasp', []);
}

/**
 * Turn resolution in precedence order:
 * Talk -> full gauge -> the form-2 opener -> the weighted roll.
 *
 * The research states the opener "outranks the gauge check" in prose (§1.7) but
 * lists it *below* the gauge in the numbered, implementation-facing order
 * (§1.6, restated in §7.12). We implement §1.6.
 */
export const braskasFinalAeonAi = (ai: AiContext): Command | null => {
  const form = ai.self.enemy?.formIndex ?? 0;
  const belowHalf = ai.self.hp * 2 <= ai.self.stats.maxHp;

  if (ai.ctx.state.flags[TALK_PENDING] === true) {
    ai.ctx.state.flags[TALK_PENDING] = false;
    ai.ctx.emit({ type: 'message', text: `${ai.self.name} hesitates`, kind: 'telegraph' });
    return null;
  }

  if ((ai.self.overdrive?.gauge ?? 0) >= 100) {
    return overdriveBranch(ai, form, belowHalf);
  }

  if (form === 1 && ai.ctx.state.flags[FORM2_OPENED] !== true) {
    ai.ctx.state.flags[FORM2_OPENED] = true;
    return use(ai, 'blade-blitz', ai.ctx.state.activeIds.slice());
  }

  return weightedTurn(ai, form, belowHalf);
};

/**
 * The Yu Pagodas.
 *
 * While **both** are up they only ever Power Wave the boss — 1 500 fixed, no
 * variance, plus a status strip and +20% to his gauge. The moment one is down
 * the survivor switches to attacking the party, which is why "kill both or
 * neither" is the correct guidance [§1.4].
 */
export const yuPagodaAi = (ai: AiContext): Command | null => {
  const siblings = livingEnemies(ai.ctx).filter((c) => c.flags.isPart && c.id !== ai.self.id);
  const bossId = ai.self.flags.partOf;
  const boss = bossId ? tryActor(ai.ctx, bossId) : livingEnemies(ai.ctx).find((c) => !c.flags.isPart);

  if (siblings.length > 0 && boss && isAlive(boss)) {
    // Two Power Wave records: the BFA-fight version (`mm2 #139`) strips the
    // full Zombie/Poison/Silence/Dark/Slow/Breaks list and pays +20% to his
    // gauge; the aeon / Yu Yevon version (`mm2 #210`) strips only
    // Poison/Zombie/Reflect and grants no gauge [ffx-bfa-yu-yevon §1.4, §2.3].
    const bfaFight = boss.id === 'braskas-final-aeon';
    return use(ai, bfaFight ? 'power-wave-bfa' : 'power-wave-aeon', [boss.id]);
  }

  // Solo: Pagoda A prioritises Curse, Pagoda B prioritises Osmose.
  const party = ai.ctx.state.activeIds.filter((id) => {
    const c = tryActor(ai.ctx, id);
    return c !== undefined && isAlive(c);
  });
  if (party.length === 0) return null;
  const target = [ai.ctx.rng.pick(party)];
  const prefersCurse = ai.self.slot % 2 === 0;
  return use(ai, prefersCurse ? 'yu-pagoda-curse' : 'osmose', target);
};

/**
 * A possessed aeon [ffx-bfa-yu-yevon §2.2].
 *
 * Every one of them opens with the scripted non-action "Possessed by Yu
 * Yevon!", then attacks, uses its special, and spends a full gauge on its own
 * Overdrive. Their stats are a live mirror of the player's aeon, so there is no
 * table here to get wrong.
 */
export const possessedAeonAi = (ai: AiContext): Command | null => {
  if (num(ai.memory, 'opened', 0) === 0) {
    ai.memory['opened'] = 1;
    ai.ctx.emit({ type: 'message', text: 'Possessed by Yu Yevon!', kind: 'telegraph' });
    return null;
  }

  const abilities = rtOf(ai.ctx, ai.self.id).abilityIds;
  if ((ai.self.overdrive?.gauge ?? 0) >= 100) {
    const od = ai.self.overdrive?.unlockedOverdriveIds ?? [];
    if (od[0] !== undefined) return use(ai, od[0], []);
  }
  if (abilities.length > 0 && ai.ctx.rng.int(0, 99) < 50) {
    return use(ai, ai.ctx.rng.pick(abilities), []);
  }
  return { kind: 'attack', targets: [] };
};

/**
 * The Talk trigger command [ffx-bfa-yu-yevon §1.6, §7.3].
 *
 * Zeroes his gauge now and makes him lose his **next** turn. Two charges,
 * battle-wide; the command is offered a third time and is deliberately inert.
 */
export function bfaTalkCharges(ai: AiContext): number {
  return num(ai.ctx.state.flags as AiContext['memory'], 'bfa.talkUsed', 0);
}

/** Mark the Talk trigger as consumed. Returns false once both charges are spent. */
export function consumeBfaTalk(ai: AiContext): boolean {
  const used = bfaTalkCharges(ai);
  ai.ctx.state.flags['bfa.talkUsed'] = used + 1;
  if (used >= 2) return false;
  ai.ctx.state.flags[TALK_PENDING] = true;
  return true;
}

registerAiScript('bfa-form-1', braskasFinalAeonAi);
registerAiScript('bfa-form-2', braskasFinalAeonAi);
registerAiScript('braskas-final-aeon', braskasFinalAeonAi);
registerAiScript('yu-pagoda', yuPagodaAi);
registerAiScript('possessed-aeon', possessedAeonAi);
