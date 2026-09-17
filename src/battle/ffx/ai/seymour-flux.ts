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

import type { Command, FFXCombatant } from '../../common/types.ts';
import { has, livingEnemies, livingFriendlies, rtOf, tryActor } from '../state.ts';
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

/**
 * Read this actor's step of the shared phase-1 cycle, snapping the counter to
 * the actor's own parity first [§4.2].
 *
 * §4.2's cycle is six steps with **Seymour on the even ones** (Lance, Lance,
 * Dispel) and **the mount on the odd ones** (Full-Life, Full-Life, Cross
 * Cleave). A single shared counter that advances once per enemy action only
 * produces that table while the two actors strictly alternate — and they do
 * not. CTB gives the mount the first turn on a good share of seeds (both are
 * Agility 38), a Banish turn or an alternation pass shifts the parity, and from
 * then on the counter is inverted for the rest of phase 1.
 *
 * That was not a cosmetic drift. With the parity inverted, every one of the
 * mount's turns fell through to its `else` branch — which was Cross Cleave, the
 * cycle's single biggest hit — so the fight opened with a party-wide ~2,400 on
 * *every* mount turn instead of one in six. Measured on seed 42 before this
 * fix: Cross Cleave on enemy turns 1 and 4, and the party was dead on turn 4
 * with Seymour untouched at 70,000.
 *
 * Snapping (rather than leaving the actor to guess) keeps the call-and-response
 * §4.2 describes: Seymour sets up, the mount punishes, and Dispel still lands
 * on the step immediately before Cross Cleave.
 */
function stepFor(ai: AiContext, parity: 0 | 1): number {
  let step = stateNum(ai, P1_STEP);
  if (step % 2 !== parity) step = (step + 1) % 6;
  setState(ai, P1_STEP, step);
  return step;
}

/**
 * Whoever is actually standing opposite these two right now.
 *
 * **Not `state.activeIds`.** While an aeon holds the field it is the *only*
 * present friendly actor and the party is off-stage with frozen counters
 * [ffx-combat-core §6.1, ffx-seymour-flux §4.5], which is the whole mechanical
 * basis of §6 row 15's summon-to-stall. Reading `activeIds` handed Seymour's
 * single-target actions an off-stage party member as an explicit target, and
 * `targeting.ts`'s explicit branch only filters on `onField` — which a frozen
 * party member still satisfies — so Lance of Atrophy and Full-Life kept
 * landing on the party *through* a summon. `livingFriendlies` is the engine's
 * own answer to the same question and already returns the aeon alone.
 */
function livingOpponents(ai: AiContext): FFXCombatant[] {
  return livingFriendlies(ai.ctx);
}

function zombiedTargets(ai: AiContext): string[] {
  return livingOpponents(ai)
    .filter((c) => has(c, 'zombie'))
    .map((c) => c.id);
}

function livingTargets(ai: AiContext): string[] {
  return livingOpponents(ai).map((c) => c.id);
}

/** The party-wide actions aim at whoever is present, for the same reason. */
function partyTargets(ai: AiContext): string[] {
  return livingOpponents(ai).map((c) => c.id);
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
    // Seymour owns the even steps: 0 and 2 are Lance of Atrophy, 4 is the
    // party-wide Dispel that strips the party right before the mount's Cross
    // Cleave [§4.2].
    const step = stepFor(ai, 0);
    advanceStep(ai);
    if (step === 4) return use(ai, 'dispel', partyTargets(ai));
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
    // The mount owns the odd steps: 1 and 3 are Full-Life on a zombified
    // member (the kill half of the Lance combo), 5 is Cross Cleave — **once**
    // per six-step cycle, not on every mount turn [§4.2].
    const step = stepFor(ai, 1);
    advanceStep(ai);
    if (step === 5) return use(ai, 'cross-cleave', partyTargets(ai));
    const zombies = zombiedTargets(ai);
    const pool = zombies.length > 0 ? zombies : livingTargets(ai);
    return use(ai, 'full-life', pool.length > 0 ? [ai.ctx.rng.pick(pool)] : []);
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
    return use(ai, 'total-annihilation', partyTargets(ai));
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
