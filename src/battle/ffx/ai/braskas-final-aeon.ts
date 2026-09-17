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

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, livingEnemies, rtOf, tryActor } from '../state.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

const TALK_PENDING = 'bfa.talkPending';
const FORM2_OPENED = 'bfa.form2Opened';

/**
 * His Overdrive gauge, 0-100, kept on the battle's own flag bag
 * [ffx-bfa-yu-yevon §1.6, §7.2 checklist item 2].
 *
 * **Why it lives here and not on the combatant.** `setup.ts` builds an
 * `overdrive` block for party members and for aeons and for nobody else, so
 * `ai.self.overdrive` on an enemy is `undefined` — which meant the gauge check
 * in this script could never be true and **Braska's Final Aeon never used a
 * single Overdrive in either form**. Measured before this: 200 battles, zero
 * Triumphant Grasps, zero Ultimate Jecht Shots, zero Jecht Bombers, and the
 * Talk trigger command inert (`execute.ts` zeroes `boss.overdrive.gauge`, which
 * does not exist). That is the encounter's signature mechanic and the entire
 * reason the Trigger Command exists, so it is restored here rather than left to
 * a wider engine change: `ctx.state.flags` is already the shared bag this
 * script uses for `bfa.talkPending`, both Pagodas and `consumeBfaTalk` can
 * reach it, and no other chapter's data or engine path is touched.
 *
 * Inputs, per §1.6:
 *
 * | Input | Gain | Confidence |
 * |---|---|---|
 * | A Yu Pagoda's Power Wave lands on him | **+20**, flat | [verified: 2 sources] |
 * | He is targeted by a damaging **action** (not per hit) | 0-10, mean 5 | [estimate] |
 * | He takes a turn, including the scripted `Draws sword.` | 0-10, mean 5 | [estimate] |
 * | Reaches 100 | spent on his **next** turn, then reset to 0 | [verified: 2 sources] |
 * | Talk | set to 0, and he loses his next turn entirely | [verified: 2 sources] |
 *
 * The gauge **carries across the form transition** and is not reset (§1.6,
 * §1.7: one `m132` monster entry, one battle-wide pool of two Talk charges).
 */
const GAUGE = 'bfa.gauge';
/** A possessed aeon's own Overdrive gauge, in its actor memory [§2.3]. */
const AEON_GAUGE = 'aeon.gauge';
/** How far into `state.log` the "was he targeted" scan has already read. */
const LOG_SEEN = 'bfa.logSeen';

/**
 * Read the gauge.
 *
 * The higher of the flag and whatever `boss.overdrive` holds, so that an
 * `EnemyDef` or a future `setup.ts` that *does* build an `overdrive` block for
 * an enemy keeps working and wins: the flag is the fallback, not an override.
 */
export function bfaGauge(ctx: Ctx, boss: FFXCombatant): number {
  const flag = ctx.state.flags[GAUGE];
  return Math.max(typeof flag === 'number' ? flag : 0, boss.overdrive?.gauge ?? 0);
}

/** Add to the gauge, clamped to 0-100, mirrored onto the boss, and told to the HUD. */
export function addBfaGauge(ctx: Ctx, boss: FFXCombatant, amount: number, cause: string): void {
  const from = bfaGauge(ctx, boss);
  const to = Math.max(0, Math.min(100, from + amount));
  ctx.state.flags[GAUGE] = to;
  if (boss.overdrive) boss.overdrive.gauge = to;
  if (to === from) return;
  ctx.emit({ type: 'overdrive-gauge', who: boss.id, from, to, cause });
}

/**
 * How many player-side **actions** have damaged him since his last turn.
 *
 * Per *action*, not per hit — the same counting rule §3.4.1 spells out for Yu
 * Yevon's Curaga counter — so a multi-hit Overdrive pays once. `hitIndex === 0`
 * is the first hit of an action, which makes the count without needing a hook
 * anywhere else in the engine.
 */
function damagingActionsSinceLastTurn(ai: AiContext): number {
  const log = ai.ctx.state.log;
  const from = num(ai.memory, LOG_SEEN, 0);
  let seen = 0;
  for (let i = from; i < log.length; i++) {
    const ev = log[i];
    if (ev === undefined || ev.type !== 'damage') continue;
    if (ev.targetId !== ai.self.id || ev.amount <= 0 || ev.hitIndex !== 0) continue;
    const source = ev.sourceId !== undefined ? tryActor(ai.ctx, ev.sourceId) : undefined;
    if (source && source.side !== 'enemy') seen++;
  }
  ai.memory[LOG_SEEN] = log.length;
  return seen;
}

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

  // Everything the party did to him since his last turn pays into the gauge
  // before he chooses, at 0-10 per damaging action [§1.6, estimate].
  const targeted = damagingActionsSinceLastTurn(ai);
  for (let i = 0; i < targeted; i++) addBfaGauge(ai.ctx, ai.self, ai.ctx.rng.int(0, 10), 'targeted');

  if (ai.ctx.state.flags[TALK_PENDING] === true) {
    ai.ctx.state.flags[TALK_PENDING] = false;
    ai.ctx.emit({ type: 'message', text: `${ai.self.name} hesitates`, kind: 'telegraph' });
    return null;
  }

  if (bfaGauge(ai.ctx, ai.self) >= 100) {
    addBfaGauge(ai.ctx, ai.self, -100, 'spend');
    return overdriveBranch(ai, form, belowHalf);
  }

  // Acting is itself worth 0-10 [§1.6, estimate].
  addBfaGauge(ai.ctx, ai.self, ai.ctx.rng.int(0, 10), 'acting');

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
    // The BFA-fight record also pays a flat **+20 %** into his gauge
    // [§1.6, verified: 2 sources]. The aeon / Yu Yevon record grants none.
    if (bfaFight) addBfaGauge(ai.ctx, boss, 20, 'power-wave');
    // The aeon / Yu Yevon record pays **15-30 %** into a possessed aeon's own
    // gauge instead [§2.3, verified: 2 sources].
    else {
      const bossAi = rtOf(ai.ctx, boss.id).ai;
      bossAi[AEON_GAUGE] = num(bossAi, AEON_GAUGE, 0) + ai.ctx.rng.int(15, 30);
    }
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

  // Its own gauge, kept in its actor memory for the same reason BFA's is kept
  // on the state flags: `setup.ts` builds no `overdrive` block for an enemy.
  // Rates are the only *quantified* enemy-gauge figures published anywhere
  // [ffx-bfa-yu-yevon §2.3, verified: 2 sources]: **15-30 %** per Yu Pagoda
  // Power Wave, **0-10 %** when targeted by an attack or when it acts.
  ai.memory[AEON_GAUGE] =
    num(ai.memory, AEON_GAUGE, 0) +
    damagingActionsSinceLastTurn(ai) * ai.ctx.rng.int(0, 10) +
    ai.ctx.rng.int(0, 10);

  // §2.2 gives each possessed aeon "Attack, <special>, <Overdrive>", and the
  // Overdrive is an Overdrive: it is spent on a full gauge, not rolled as an
  // ordinary turn. The data layer flattens the moveset into one `abilityIds`
  // list, so the split is made here off the ability's own `category` — which
  // was the difference between Shiva opening with Heavenly Strike and Shiva
  // opening with a 9,999 party-wide Diamond Dust on turn 9.
  const abilities = rtOf(ai.ctx, ai.self.id).abilityIds;
  const overdrives = abilities.filter((id) => ai.ctx.content.ability(id)?.category === 'overdrive');
  const ordinary = abilities.filter((id) => ai.ctx.content.ability(id)?.category !== 'overdrive');

  if (num(ai.memory, AEON_GAUGE, 0) >= 100 && overdrives[0] !== undefined) {
    ai.memory[AEON_GAUGE] = 0;
    return use(ai, overdrives[0], ai.ctx.state.activeIds.slice());
  }
  if (ordinary.length > 0 && ai.ctx.rng.int(0, 99) < 50) {
    return use(ai, ai.ctx.rng.pick(ordinary), []);
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
  // Zero the gauge this script actually reads. `execute.ts` zeroes
  // `boss.overdrive.gauge`, which no enemy has — see {@link GAUGE}.
  addBfaGauge(ai.ctx, ai.self, -100, 'talk');
  return true;
}

registerAiScript('bfa-form-1', braskasFinalAeonAi);
registerAiScript('bfa-form-2', braskasFinalAeonAi);
registerAiScript('braskas-final-aeon', braskasFinalAeonAi);
registerAiScript('yu-pagoda', yuPagodaAi);
// The data layer names the two Pagoda rotations by *context*, because the two
// Power Wave records differ: `#139` in the BFA fight (strips the full
// Zombie/Poison/Silence/Dark/Slow/Breaks list and pays +20% to his Overdrive
// gauge) and `#210` in the aeon / Yu Yevon fights (strips only
// Poison/Zombie/Reflect) [ffx-bfa-yu-yevon §1.4, §2.3]. `yuPagodaAi` already
// picks between them from the boss on the field, but neither id was registered,
// so `chooseAiCommand` fell through to its plain-Attack fallback and **no Yu
// Pagoda in the chapter ever cast Power Wave**: the boss was never healed, never
// cleansed, and his gauge never got its +20%. Registering the two ids the data
// actually ships is the whole fix.
registerAiScript('yu-pagoda-bfa', yuPagodaAi);
registerAiScript('yu-pagoda-aeon', yuPagodaAi);
registerAiScript('possessed-aeon', possessedAeonAi);
