/**
 * Chapter 3, part 1: Braska's Final Aeon, his turn and his `onHit` (`research/re-ffx-ai-yunalesca-bfa.md` section 3, m132 in
 * `sins06_00`; **FFX only**). The Yu Pagodas are `yu-pagoda.ts`, the possessed aeons `possessed-aeons.ts`, Yu Yevon `yu-yevon.ts`.
 *
 * One monster entry serves both forms; the battle script overwrites HP and Strength on transformation. His Overdrive gauge is
 * a first-class visible resource and the script does all its arithmetic with fixed numbers, no randomness:
 *
 * | Input | Gain |
 * |---|---|
 * | his own turn, phase 0 | +2 |
 * | his own turn, phases 1 and 2 | +3 |
 * | every hit event (any command that is not a Power Wave, or a Power Wave when the gauge is already full) | +5 |
 * | a Yu Pagoda's Power Wave on him | +20 |
 *
 * The Overdrive test reads the gauge as it stood when his last hook finished, so the turn the gauge reaches 100 is not an
 * Overdrive turn and the next one is (row B5); the turn's own gain is added after the test. A hit that carries it past 100
 * clamps it to 100. The Overdrive then replaces that turn's move and zeroes the gauge, whatever it had just gained.
 *
 * The script keeps two numbers: its own running gauge (`v11`) and the Overdrive property the game tests and draws. Every
 * hook ends by copying the first into the second, except two: the hit that ends his first form and the hit that first leaves
 * the second form below half (the transformation and the phase-2 latch return before the copy). That hit's gain therefore
 * stays in `v11` only, and the test of his next turn still reads the older property. {@link scriptGauge} is the running
 * number, `bfa.gauge` the property.
 *
 * **Talk** sets a flag when it resolves and does nothing else then (row B7): the gauge is cleared, the pending Overdrive
 * cancelled and the turn spent on an empty action when his next turn starts. Two charges, battle-wide; the third is text.
 *
 * Phase 0 is the first form, phase 1 the second, and phase 2 latches once a hit leaves him below 60,000 (row B3).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { advanceForm } from '../forms.ts';
import { type Ctx, has, rtOf } from '../state.ts';
import { frontLine, gameMod, livingFrontLine, pickActor, randomLiving } from './game-rolls.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

const TALK_PENDING = 'bfa.talkPending';
const FORM2_OPENED = 'bfa.form2Opened';
const PHASE_2 = 'bfa.phase2';

/** His Overdrive gauge, 0 to 100, on the battle's flag bag: an enemy has no Overdrive block of its own. */
const GAUGE = 'bfa.gauge';
/** The script's running gauge (`v11`), kept in his actor memory only while a hit has left it ahead of the property copy. */
const AHEAD = 'bfa.v11';

/** The gauge the Overdrive test and the HUD read: the higher of the flag and whatever `boss.overdrive` holds. */
export function bfaGauge(ctx: Ctx, boss: FFXCombatant): number {
  const flag = ctx.state.flags[GAUGE];
  return Math.max(typeof flag === 'number' ? flag : 0, boss.overdrive?.gauge ?? 0);
}

/** The script's running gauge: what its next addition starts from. It equals {@link bfaGauge} unless a hit left it ahead. */
export function scriptGauge(ctx: Ctx, boss: FFXCombatant): number {
  const ahead = rtOf(ctx, boss.id).ai[AHEAD];
  return typeof ahead === 'number' ? ahead : bfaGauge(ctx, boss);
}

/** Write the property copy (clamped to 0 to 100) from the script's gauge, mirror it onto the boss and tell the HUD. */
export function setBfaGauge(ctx: Ctx, boss: FFXCombatant, to: number, cause: string): void {
  const from = bfaGauge(ctx, boss);
  const next = Math.max(0, Math.min(100, to));
  delete rtOf(ctx, boss.id).ai[AHEAD]; // the copy is written, so the two numbers agree again
  ctx.state.flags[GAUGE] = next;
  if (boss.overdrive) boss.overdrive.gauge = next;
  if (next !== from) ctx.emit({ type: 'overdrive-gauge', who: boss.id, from, to: next, cause });
}

/** The phase (0, 1, 2); 2 latches once he is below half of the second form's pool. */
function phaseOf(ctx: Ctx, boss: FFXCombatant): number {
  const form = boss.enemy?.formIndex ?? 0;
  if (form === 0) return 0;
  const mem = rtOf(ctx, boss.id).ai;
  const half = Math.floor((boss.enemy?.forms[1]?.hp ?? boss.stats.maxHp) / 2);
  if (mem[PHASE_2] === true || boss.hp < half) {
    mem[PHASE_2] = true;
    return 2;
  }
  return 1;
}

interface Move {
  id: string;
  targets: string[];
  gain: number;
}

/**
 * The phase table of section 3.4. The roll is drawn first and the target pick after it, only in the branches that pick one
 * (Blade Blitz aims at the front line and draws nothing); the form-II opener still takes both draws and then overrides.
 */
function phaseMove(ai: AiContext, phase: number, opener: boolean): Move {
  const ctx = ai.ctx;
  const front = frontLine(ctx).map((c) => c.id);
  const pick = (): string[] => {
    const target = randomLiving(ctx);
    return target ? [target.id] : [];
  };
  if (phase === 0) {
    const roll = gameMod(ctx, 3);
    return { id: roll === 0 ? 'jecht-beam' : 'left-arm-strike', targets: pick(), gain: 2 };
  }
  if (phase === 1) {
    const roll = gameMod(ctx, 5);
    const move: Move =
      roll === 0
        ? { id: 'jecht-beam', targets: pick(), gain: 3 }
        : roll === 2 || roll === 4
          ? { id: 'blade-blitz', targets: front, gain: 3 }
          : { id: 'left-arm-strike-2', targets: pick(), gain: 3 };
    return opener ? { id: 'blade-blitz', targets: front, gain: 3 } : move;
  }
  const roll = gameMod(ctx, 3);
  return roll === 0 ? { id: 'jecht-beam', targets: pick(), gain: 3 } : { id: 'blade-blitz', targets: front, gain: 3 };
}

/**
 * The Overdrive he spends when the stored gauge is full (section 3.4, the common tail): Jecht Bomber, or its second-form
 * twin, on one random living actor while an aeon is on the field; otherwise by phase, Triumphant Grasp (two forms of it) on a
 * random living actor who is not petrified, or Ultimate Jecht Shot on the front line.
 */
function overdriveMove(ai: AiContext, phase: number): Command {
  const ctx = ai.ctx;
  if (ctx.state.aeonId) {
    const target = randomLiving(ctx);
    return use(ai, phase === 0 ? 'jecht-bomber' : 'jecht-bomber-2', target ? [target.id] : []);
  }
  if (phase === 2) return use(ai, 'ultimate-jecht-shot', frontLine(ctx).map((c) => c.id));
  const target = pickActor(ctx, livingFrontLine(ctx).filter((c) => !has(c, 'petrify')));
  return use(ai, phase === 0 ? 'triumphant-grasp' : 'triumphant-grasp-2', target ? [target.id] : []);
}

/** His turn: the phase move, then the Overdrive that replaces it, then a pending Talk that cancels both. */
export const braskasFinalAeonAi = (ai: AiContext): Command | null => {
  const { ctx, self: boss } = ai;
  const phase = phaseOf(ctx, boss);
  const stored = bfaGauge(ctx, boss); // the Overdrive test reads the property copy

  let opener = false;
  if (phase === 1 && ctx.state.flags[FORM2_OPENED] !== true) {
    ctx.state.flags[FORM2_OPENED] = true;
    opener = true;
  }
  const move = phaseMove(ai, phase, opener);
  let command: Command = use(ai, move.id, move.targets);
  let gauge = scriptGauge(ctx, boss) + move.gain; // the turn's gain goes onto the script's own running number

  if (stored >= 100) {
    command = overdriveMove(ai, phase);
    gauge = 0;
  }

  if (ctx.state.flags[TALK_PENDING] === true) {
    ctx.state.flags[TALK_PENDING] = false;
    setBfaGauge(ctx, boss, 0, 'talk');
    ctx.emit({ type: 'message', text: `${boss.name} hesitates`, kind: 'telegraph' });
    return null;
  }

  setBfaGauge(ctx, boss, gauge, stored >= 100 ? 'spend' : 'acting');
  return command;
};

/**
 * His `onHit` (m132 f6 @0x05FF, then the transformation @0x06E3), once per sub-action that reached him: the gauge, then the
 * change of form when a hit leaves the first form at 0 HP (the engine settles a death in the second). A Power Wave pays +20
 * while the gauge is below 100, a different count only if no Pagoda has taken a turn since the last revival, which cannot
 * happen (a Pagoda's Power Wave is always preceded by its turn start) [note section 3.5]; any other hit pays +5.
 */
function braskasHit(event: HitEvent): void {
  const { ctx, target: boss, def } = event;
  const mem = rtOf(ctx, boss.id).ai;
  const running = scriptGauge(ctx, boss);
  const powerWave = def.id === 'power-wave-bfa' && running < 100;
  const next = Math.min(100, running + (powerWave ? 20 : 5));
  const form = boss.enemy?.formIndex ?? 0;
  const half = Math.floor((boss.enemy?.forms[1]?.hp ?? boss.stats.maxHp) / 2);
  const spent = boss.hp === 0;
  const latches = form === 1 && mem[PHASE_2] !== true && boss.hp < half;
  if (spent && form === 0) advanceForm(ctx, boss);
  if (latches) mem[PHASE_2] = true;
  // The transformation and the phase-2 latch return before the script copies its gauge into the property (m132 f7 @0x06F8,
  // @0x077E): the gain stays in the running number and the tested copy is the older one until his next hook. A Power Wave
  // branch copies it itself, so it is the one hit that still shows.
  if ((spent || latches) && !powerWave) {
    mem[AHEAD] = next;
    return;
  }
  setBfaGauge(ctx, boss, next, powerWave ? 'power-wave' : 'hit');
}

/** Talk charges used so far: two, battle-wide. */
export function bfaTalkCharges(ai: AiContext): number {
  return num(ai.ctx.state.flags as AiContext['memory'], 'bfa.talkUsed', 0);
}

/**
 * The Talk trigger command (section 3.6): the first two resolve into a flag the next turn answers; the third is dialogue only
 * and returns false so the executor says so. Nothing happens to the gauge now.
 */
export function consumeBfaTalk(ai: AiContext): boolean {
  const used = bfaTalkCharges(ai);
  ai.ctx.state.flags['bfa.talkUsed'] = used + 1;
  if (used >= 2) return false;
  ai.ctx.state.flags[TALK_PENDING] = true;
  return true;
}

for (const id of ['bfa-form-1', 'bfa-form-2', 'braskas-final-aeon']) {
  registerAiScript(id, braskasFinalAeonAi);
  registerHitScript(id, braskasHit, { managesHp: true });
}
