/**
 * Chapter 1 — Seymour Flux and the Mortiorchis [ffx-seymour-flux §4].
 *
 * Two actors, one shared script state. The Mortiorchis owns a turn slot and the
 * animation; **Seymour owns the stats** — Full-Life, Cross Cleave, Slowga and
 * Total Annihilation are rows in `m142` even though the mount performs them
 * [§3.1, §3.2, §4.4.2].
 *
 * Three rules the encounter lives on:
 * - If either enemy gets **two turns in a row** it does nothing on the second
 *   [§4.1]. Implemented as a guard on the actor that acted last, not as a fixed
 *   order, because CTB can genuinely double up.
 * - Phase 1 is a repeating **6-step cycle** shared by both actors, Seymour on
 *   the even steps and the mount on the odd ones [§4.2].
 * - Phase 2 runs **two independent sub-scripts in parallel**: Seymour's
 *   Flare/Reflect loop and the mount's Total Annihilation charge ladder [§4.4].
 */

import type { Command } from '../../common/types.ts';
import { has, livingEnemies, rtOf, tryActor } from '../state.ts';
import { type AiContext, flag, registerAiScript, use } from './types.ts';

/** Shared cycle state lives on the Seymour actor so both scripts read one copy. */
const HOST_ID = 'seymour-flux';
const MOUNT_ID = 'mortiorchis';

/** Battle-scoped flags, kept on `BattleState.flags` so a story trigger can read them. */
const P1_STEP = 'seymour.p1Step';
const PHASE = 'seymour.phase';
const LAST_ENEMY = 'seymour.lastEnemyActor';
const FLARED = 'seymour.flaredThisLoop';
const CHARGE_TURNS = 'seymour.chargeTurns';
const CHARGE_REQUIRED = 'seymour.chargeRequired';
const HAS_ANNIHILATED = 'seymour.hasAnnihilated';
const AEON_TURNS = 'seymour.aeonTurnsTaken';

function stateNum(ai: AiContext, key: string, fallback = 0): number {
  const v = ai.ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

function setState(ai: AiContext, key: string, value: number | boolean): void {
  ai.ctx.state.flags[key] = value;
}

/**
 * The alternation guard [§4.1]. Returns true when this actor must pass because
 * it also took the previous enemy turn.
 */
function doubledUp(ai: AiContext): boolean {
  const last = ai.ctx.state.flags[LAST_ENEMY];
  return typeof last === 'string' && last === ai.self.id;
}

function noteActed(ai: AiContext): void {
  ai.ctx.state.flags[LAST_ENEMY] = ai.self.id;
}

/** Phase 2 begins when Seymour drops below 50% and reacts with Reflect [§4.3]. */
function currentPhase(ai: AiContext): 1 | 2 {
  const host = tryActor(ai.ctx, HOST_ID);
  if (host && host.hp * 2 < host.stats.maxHp) {
    setState(ai, PHASE, 2);
    return 2;
  }
  return stateNum(ai, PHASE, 1) === 2 ? 2 : 1;
}

/** `p1Step` advances once per enemy action, so the two actors interleave [§4.2]. */
function advanceStep(ai: AiContext): void {
  setState(ai, P1_STEP, (stateNum(ai, P1_STEP) + 1) % 6);
}

function zombiedTargets(ai: AiContext): string[] {
  return ai.ctx.state.activeIds.filter((id) => {
    const c = tryActor(ai.ctx, id);
    return c !== undefined && has(c, 'zombie') && c.alive;
  });
}

function livingTargets(ai: AiContext): string[] {
  return ai.ctx.state.activeIds.filter((id) => {
    const c = tryActor(ai.ctx, id);
    return c !== undefined && c.alive && !c.removed;
  });
}

/**
 * Seymour Flux.
 *
 * Banish outranks everything, but only after the aeon has had **exactly one
 * turn** [§4.5] — the summon is a one-action burst, not a stall. The `§4.8`
 * pseudocode puts the Banish check above the phase switch unconditionally; we
 * gate it on the aeon having acted, which is what §4.5 actually specifies.
 */
export const seymourFluxAi = (ai: AiContext): Command | null => {
  if (doubledUp(ai)) {
    ai.ctx.emit({ type: 'message', text: 'Seymour waits', kind: 'telegraph' });
    noteActed(ai);
    return null;
  }
  noteActed(ai);

  const aeonId = ai.ctx.state.aeonId;
  if (aeonId) {
    const aeonTurns = rtOf(ai.ctx, aeonId).turnsTaken;
    setState(ai, AEON_TURNS, aeonTurns);
    if (aeonTurns >= 1) return use(ai, 'banish', [aeonId]);
    // The aeon has not acted yet; fall through and take a normal turn.
  }

  if (currentPhase(ai) === 1) {
    const step = stateNum(ai, P1_STEP);
    advanceStep(ai);
    if (step === 0 || step === 2) {
      const targets = livingTargets(ai);
      return use(ai, 'lance-of-atrophy', targets.length > 0 ? [ai.ctx.rng.pick(targets)] : []);
    }
    if (step === 4) return use(ai, 'dispel', ai.ctx.state.activeIds.slice());
    // Steps 1, 3 and 5 belong to the mount; if Seymour lands on one anyway
    // (a Banish or a pass shifted the parity) he falls back to Lance.
    const targets = livingTargets(ai);
    return use(ai, 'lance-of-atrophy', targets.length > 0 ? [ai.ctx.rng.pick(targets)] : []);
  }

  // Phase 2: Flare is *always* cast at Self. Reflect (or its absence) decides
  // who eats it — do not special-case the targeting [§4.4.1].
  const flared = flag(ai.ctx.state.flags as AiContext['memory'], FLARED);
  const hasReflect = has(ai.self, 'reflect');
  if (hasReflect && flared) {
    ai.ctx.emit({ type: 'message', text: 'Seymour waits', kind: 'telegraph' });
    return null;
  }
  if (!hasReflect && flared) {
    setState(ai, FLARED, false);
    return use(ai, 'reflect', [ai.self.id]);
  }
  setState(ai, FLARED, true);
  return use(ai, 'flare', [ai.self.id]);
};

/**
 * The Mortiorchis.
 *
 * Phase 1 it takes the odd steps of the shared cycle. Phase 2 it runs the
 * two-stage Total Annihilation telegraph: **first use costs two charge turns,
 * every use after that costs one**, because it stays in Auto-Attack Mode
 * [§4.4.2]. An aeon on the field **holds** the ladder — the charge is
 * postponed, not lost, which is the mechanical basis for summon-stalling.
 */
export const mortiorchisAi = (ai: AiContext): Command | null => {
  if (doubledUp(ai)) {
    ai.ctx.emit({ type: 'message', text: 'The Mortiorchis stirs', kind: 'telegraph' });
    noteActed(ai);
    return null;
  }
  noteActed(ai);

  if (currentPhase(ai) === 1) {
    const step = stateNum(ai, P1_STEP);
    advanceStep(ai);
    if (step === 1 || step === 3) {
      const zombies = zombiedTargets(ai);
      const pool = zombies.length > 0 ? zombies : livingTargets(ai);
      return use(ai, 'full-life', pool.length > 0 ? [ai.ctx.rng.pick(pool)] : []);
    }
    if (step === 5) return use(ai, 'cross-cleave', ai.ctx.state.activeIds.slice());
    return use(ai, 'cross-cleave', ai.ctx.state.activeIds.slice());
  }

  // Phase 2 charge ladder.
  if (ai.ctx.state.aeonId) {
    ai.ctx.emit({ type: 'message', text: 'The Mortiorchis holds', kind: 'telegraph' });
    return null;
  }

  const required = stateNum(ai, CHARGE_REQUIRED, 2);
  const turns = stateNum(ai, CHARGE_TURNS, 0);
  if (turns >= required) {
    setState(ai, CHARGE_TURNS, 0);
    setState(ai, CHARGE_REQUIRED, 1);
    setState(ai, HAS_ANNIHILATED, true);
    rtOf(ai.ctx, ai.self.id).charge = null;
    return use(ai, 'total-annihilation', ai.ctx.state.activeIds.slice());
  }

  const next = turns + 1;
  setState(ai, CHARGE_TURNS, next);
  const annihilated = ai.ctx.state.flags[HAS_ANNIHILATED] === true;
  const stage: 1 | 2 = next === 1 && !annihilated ? 1 : 2;
  const name = stage === 1 ? 'Auto-Attack Mode' : 'Ready To Annihilate';
  rtOf(ai.ctx, ai.self.id).charge = { name, turnsLeft: required - next, stage };
  ai.ctx.emit({ type: 'charge', enemyId: ai.self.id, name, turnsLeft: required - next, stage });
  ai.ctx.emit({ type: 'message', text: `${ai.self.name} enters ${name}`, kind: 'telegraph' });
  return null;
};

/**
 * Seymour's counters [§4.3, §4.6]. Called by the engine after an action
 * resolves against him.
 *
 * Both thresholds can fire from one big hit. Poison damage triggers **neither**;
 * Mortibsorption damage triggers **both**.
 */
export function seymourThresholdCounters(ai: AiContext, fromPoison: boolean): Command[] {
  if (fromPoison) return [];
  const out: Command[] = [];
  const self = ai.self;
  if (self.hp * 4 < self.stats.maxHp * 3 && !has(self, 'protect')) {
    out.push(use(ai, 'protect', [self.id]));
  }
  if (self.hp * 2 < self.stats.maxHp && !has(self, 'reflect')) {
    setState(ai, PHASE, 2);
    out.push(use(ai, 'reflect', [self.id]));
  }
  return out;
}

/** A player delay attempt is punished with party-wide Slowga [§4.6]. */
export function seymourDelayCounter(ai: AiContext): Command {
  return use(ai, 'slowga', ai.ctx.state.activeIds.slice());
}

/** True while both enemies are up, which the mount guarantees [§2.2]. */
export function mortiorchisAlive(ai: AiContext): boolean {
  return livingEnemies(ai.ctx).some((c) => c.id === MOUNT_ID);
}

registerAiScript(HOST_ID, seymourFluxAi);
registerAiScript(MOUNT_ID, mortiorchisAi);
