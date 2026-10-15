/**
 * **The possessed Magus Sisters: one battle, three bodies** (the hidden Last Summoning chapter; **FFX only**; `research/re-ffx-last-summoning.md` section 6.2, the compiled scripts m178 to m180 and the two Yu Pagodas',
 * `[bytes]`). Chapter III builds the Sisters as three separate battles and never reaches them; the game fights them together (`sins07_07`), and this module is that fight's whole mind: the three scripts, the gauges
 * and the Pagodas' Power Wave. Each Sister has her own script id (`possessed-cindy`, `possessed-sandy`, `possessed-mindy`; `data/ffx/enemies/last-summoning-chain.ts` names them), so nothing here runs in any other
 * fight, and the single-aeon scripts of `./possessed-aeons.ts` are untouched.
 *
 * **Cindy's turn**, in order: (1) all three Sisters alive and each gauge at 100 or more: **Delta Attack** on the whole front line, all three gauges back to 0; (2) her HP below two thirds of her maximum
 * (`(max / 3) x 2`, integer): **Drain** on the front-line actor with the most HP; (3) Sandy's or Mindy's HP percent (255 for a dead one) at 50 or less: **Curaga** on the one with the lower percent (a tie goes to
 * Mindy); (4) else **Camisade** on a random living front-line actor. **Sandy's turn**: (1) all three full: send the token to Cindy (she throws the Delta Attack at once); (2) Cindy alive without Reflect:
 * **Reflect** on Cindy; (3) **Haste** on a random Sister without it; (4) **Razzia** on a random living front-line actor. **Mindy's turn**: (1) all three full: the token; (2) Cindy alive with Reflect: **Flare**
 * on Cindy (it bounces onto the front line through her Reflect); (3) a coin of 48.97 percent (`GetRandomValue() mod 100` above 50) **Passado**, else **Flare**, on a random living front-line actor.
 *
 * **The gauges** are the Sisters' own, on a 100-point scale: 0 to 9 after each of her turns (not after a Delta Attack or a token), **10 to 19 for every hit event that reaches her** (ignored at 0 HP, at 100 or for a
 * command that does not touch HP), and **30 to 39 more when the hit is a Yu Pagoda's Power Wave**. **The Pagodas** feed the Sister whose gauge is lowest (ties drawn, stream 4) and take no action when that gauge is
 * already 100 ({@link sistersPowerWave}, called by `./yu-pagoda.ts`). Cindy **remembers her Reflect**: a Power Wave that strips it is undone on the hit.
 *
 * **Our assumptions, each named** (the note does not settle them): (a) the draw order inside Mindy's third branch is the aeons' (the target pick first, then the coin); (b) the token is a no-damage action of
 * ours (`possessed-sisters-token`, the game's row is not named) and Cindy's reaction to it is a free Delta Attack through the engine's reaction queue; (c) all three Sisters are on the field from the start (how
 * Sandy and Mindy enter play is untraced, RE 9 item 6) and only Cindy spends her first turn on the no-damage staging; (d) a Sister absent from the battle counts as dead.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive, rtOf, tryActor } from '../state.ts';
import { frontLine, gameMod, highestHpLiving, pickActor, randomLiving } from './game-rolls.ts';
import { queueReaction } from './hooks.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';

/** The ids of the three bodies, in the order the game lists them (Cindy, Sandy, Mindy). */
export const SISTER_BODY_IDS = ['possessed-cindy', 'possessed-sandy', 'possessed-mindy'] as const;

/** A Sister's Overdrive gauge, in her actor memory (the aeons' key: `./possessed-aeons.ts`). */
const GAUGE = 'aeon.gauge';
/** Cindy's memory of her Reflect, written by the Pagoda before it heals her and read by her hit script. */
const HAD_REFLECT = 'sisters.hadReflect';

const DELTA = 'possessed-cindy-delta-attack';
const TOKEN = 'possessed-sisters-token';
const POWER_WAVE = 'power-wave-aeon';

/** Is this body one of the three? */
export function isSisterBody(c: FFXCombatant | undefined): boolean {
  return c !== undefined && (SISTER_BODY_IDS as readonly string[]).includes(c.id);
}

/** The Sisters that are in this battle (living or not), in the game's order. */
export function sisterBodies(ctx: Ctx): FFXCombatant[] {
  return SISTER_BODY_IDS.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined && ctx.state.enemyIds.includes(c.id));
}

/** True when this battle is the Sisters' (any of the three is among the enemies). */
export function isSistersBattle(ctx: Ctx): boolean {
  return sisterBodies(ctx).length > 0;
}

const gaugeOf = (ctx: Ctx, c: FFXCombatant): number => num(rtOf(ctx, c.id).ai, GAUGE, 0);

/** All three Sisters are present, alive, and each gauge is at 100 or more: the Delta Attack's test. */
export function allReady(ctx: Ctx): boolean {
  const all = SISTER_BODY_IDS.map((id) => tryActor(ctx, id));
  return all.every((c) => c !== undefined && isAlive(c) && gaugeOf(ctx, c) >= 100);
}

/** HP as a percent of the maximum, 255 for one that is gone (the scripts' reading of a dead Sister). */
function percentOf(c: FFXCombatant | undefined): number {
  if (c === undefined || !isAlive(c)) return 255;
  return Math.floor((c.hp * 100) / Math.max(1, c.stats.maxHp));
}

/** After a Delta Attack: every Sister's gauge back to 0. */
function zeroGauges(ctx: Ctx): void {
  for (const c of sisterBodies(ctx)) rtOf(ctx, c.id).ai[GAUGE] = 0;
}

/** After a turn that was not the joint action: 0 to 9 on her gauge, clamped at 100. */
function gainAfterTurn(ai: AiContext): void {
  const gauge = num(ai.memory, GAUGE, 0);
  ai.memory[GAUGE] = Math.min(100, gauge + gameMod(ai.ctx, 10));
}

/** Cindy's turn (the staging turn first, then the four branches). */
export const possessedCindyAi = (ai: AiContext): Command | null => {
  const { ctx, self, memory } = ai;
  if (num(memory, 'opened', 0) === 0) {
    memory['opened'] = 1;
    ctx.emit({ type: 'message', text: 'Possessed by Yu Yevon!', kind: 'telegraph' });
    return null;
  }
  const front = frontLine(ctx).map((c) => c.id);
  if (allReady(ctx)) {
    zeroGauges(ctx);
    return use(ai, DELTA, front);
  }
  let command: Command;
  if (self.hp < Math.floor(self.stats.maxHp / 3) * 2) {
    const target = highestHpLiving(ctx);
    command = use(ai, 'drain', target ? [target.id] : []);
  } else {
    const sandy = tryActor(ctx, 'possessed-sandy');
    const mindy = tryActor(ctx, 'possessed-mindy');
    const ps = percentOf(sandy);
    const pm = percentOf(mindy);
    if (ps <= 50 || pm <= 50) {
      const heal = ps < pm ? sandy : mindy; // a tie goes to Mindy
      command = use(ai, 'curaga', heal ? [heal.id] : []);
    } else {
      const target = randomLiving(ctx);
      command = use(ai, 'possessed-cindy-camisade', target ? [target.id] : []);
    }
  }
  gainAfterTurn(ai);
  return command;
};

/** The joint action's call: when every gauge is full, Sandy's and Mindy's turn is spent sending it to Cindy. */
function sendToken(ai: AiContext): Command | null {
  const cindy = tryActor(ai.ctx, 'possessed-cindy');
  return cindy === undefined ? null : use(ai, TOKEN, [cindy.id]);
}

/** Sandy's turn. */
export const possessedSandyAi = (ai: AiContext): Command | null => {
  const { ctx } = ai;
  if (allReady(ctx)) return sendToken(ai);
  const cindy = tryActor(ctx, 'possessed-cindy');
  let command: Command;
  if (cindy !== undefined && isAlive(cindy) && !has(cindy, 'reflect')) {
    command = use(ai, 'reflect', [cindy.id]);
  } else {
    const slow = sisterBodies(ctx).filter((c) => isAlive(c) && !has(c, 'haste'));
    const lucky = slow.length > 0 ? pickActor(ctx, slow) : undefined;
    if (lucky !== undefined) {
      command = use(ai, 'haste', [lucky.id]);
    } else {
      const target = randomLiving(ctx);
      command = use(ai, 'possessed-sandy-razzia', target ? [target.id] : []);
    }
  }
  gainAfterTurn(ai);
  return command;
};

/** Mindy's turn. */
export const possessedMindyAi = (ai: AiContext): Command | null => {
  const { ctx } = ai;
  if (allReady(ctx)) return sendToken(ai);
  const cindy = tryActor(ctx, 'possessed-cindy');
  let command: Command;
  if (cindy !== undefined && isAlive(cindy) && has(cindy, 'reflect')) {
    command = use(ai, 'flare', [cindy.id]); // it bounces onto the front line through her Reflect
  } else {
    const target = randomLiving(ctx);
    const aim = target ? [target.id] : [];
    command = gameMod(ctx, 100) > 50 ? use(ai, 'possessed-mindy-passado', aim) : use(ai, 'flare', aim);
  }
  gainAfterTurn(ai);
  return command;
};

/**
 * The Yu Pagodas' Power Wave in this battle (called by `./yu-pagoda.ts` while both Pagodas are up): the living Sister whose gauge is lowest (ties drawn), and no action at all when that gauge is already
 * 100. Cindy's Reflect is remembered before the wave strips it.
 */
export function sistersPowerWave(ai: AiContext): Command | null {
  const { ctx } = ai;
  const living = sisterBodies(ctx).filter((c) => isAlive(c));
  if (living.length === 0) return null;
  const low = living.reduce((m, c) => Math.min(m, gaugeOf(ctx, c)), 100);
  if (low >= 100) return null;
  const pick = pickActor(ctx, living.filter((c) => gaugeOf(ctx, c) === low));
  if (pick === undefined) return null;
  if (pick.id === 'possessed-cindy') rtOf(ctx, pick.id).ai[HAD_REFLECT] = has(pick, 'reflect') ? 1 : 0;
  return use(ai, POWER_WAVE, [pick.id]);
}

/** Put Cindy's Reflect back after a Power Wave took it (a fresh status that lasts until removed, as every status with no counter of its own). */
function restoreReflect(ctx: Ctx, cindy: FFXCombatant): void {
  const inst = { id: 'reflect' as const, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
  cindy.statuses['reflect'] = inst;
  ctx.emit({ type: 'status-add', targetId: cindy.id, status: 'reflect', instance: { ...inst } });
}

/**
 * A Sister's `onHit`: Cindy answers the token with the Delta Attack (a free action, every gauge back to 0); every Sister's gauge takes 10 to 19 per hit event and 30 to 39 more from a Power Wave (ignored at 0 HP,
 * at 100 or for a command that does not touch HP), and Cindy restores the Reflect a Power Wave stripped.
 */
function sisterHit(event: HitEvent): void {
  const { ctx, target, def, attacker } = event;
  const memory = rtOf(ctx, target.id).ai;
  if (def.id === TOKEN) {
    if (target.id !== 'possessed-cindy' || !isAlive(target)) return;
    zeroGauges(ctx);
    queueReaction(ctx, target.id, { kind: 'ability', id: DELTA, targets: frontLine(ctx).map((c) => c.id) }, { keepsControl: true, byId: attacker.id });
    return;
  }
  const gauge = num(memory, GAUGE, 0);
  if (target.hp !== 0 && gauge < 100 && event.affectsHp) {
    let next = gauge + 10 + gameMod(ctx, 10);
    if (def.id === POWER_WAVE) next += 30 + gameMod(ctx, 10);
    memory[GAUGE] = Math.min(100, next);
  }
  if (target.id === 'possessed-cindy' && def.id === POWER_WAVE && num(memory, HAD_REFLECT, 0) === 1 && target.hp > 0 && !has(target, 'reflect')) restoreReflect(ctx, target);
}

registerAiScript('possessed-cindy', possessedCindyAi);
registerAiScript('possessed-sandy', possessedSandyAi);
registerAiScript('possessed-mindy', possessedMindyAi);
for (const id of SISTER_BODY_IDS) registerHitScript(id, sisterHit);
