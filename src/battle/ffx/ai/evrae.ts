/**
 * The two rotations of the *Fahrenheit* fight — **Evrae** and **Cid**.
 *
 * Source: `research/ffx-evrae-airship.md` §4.4 (what Evrae does at each range),
 * §5.7 (the reference pseudocode this file follows step for step) and §2.3
 * (Cid's decision order, quoted verbatim below). Everything they read — the
 * constants, the AUTHORED decisions, the airship flags, the setup hook, the
 * counters — lives in `./evrae-rules.ts` and is re-exported from here, so one
 * import reaches the whole encounter. The split is the 400-line house limit
 * [AGENTS.md hard rule 7].
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — an FFX encounter registered in
 * the FFX AI registry. See `./evrae-rules.ts` for the fence and the absence
 * test.
 */

import type { Command } from '../../common/types.ts';
import { type Ctx, rtOf, tryActor } from '../state.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  AIRSHIP_BREATH_CHARGED,
  AIRSHIP_MISSILES,
  AIRSHIP_NEAR_STEP,
  AIRSHIP_OUT_OF_AMMO,
  CID_GUIDED_MISSILES,
  CID_ID,
  CID_SCRIPT,
  EVRAE_ATTACK,
  EVRAE_ID,
  EVRAE_INHALE,
  EVRAE_OUT_OF_BREATH_RANGE,
  EVRAE_PHOTON_SPRAY,
  EVRAE_POISON_BREATH,
  EVRAE_SCRIPT,
  EVRAE_STONE_GAZE,
  airshipRange,
  applyQueuedOrder,
  isEvraeBattle,
  queuedOrder,
} from './evrae-rules.ts';
import { spendStoneGazeCounter, stoneGazeDue } from './evrae-counters.ts';

export * from './evrae-rules.ts';
export * from './evrae-counters.ts';

function step(ctx: Ctx): number {
  const v = ctx.state.flags[AIRSHIP_NEAR_STEP];
  return typeof v === 'number' ? v : 0;
}

/** The breath's charge is consumed by resolving **or** by whiffing [§3.3 note 4]. */
function consumeCharge(ctx: Ctx): void {
  ctx.state.flags[AIRSHIP_BREATH_CHARGED] = false;
  ctx.state.flags[AIRSHIP_NEAR_STEP] = 0;
}

// ---------------------------------------------------------------------------
// Evrae
// ---------------------------------------------------------------------------

/**
 * §5.7, transcribed. The one structural difference from the pseudocode is that
 * **Swooping Scythe is not a scheduled branch here** — it is a counter, fired
 * from `collectEvraeCounters` the instant the player targets Evrae at FAR in
 * phase 2, which is what both sources describe ("a counter that brings Evrae
 * close after unleashing it") and what makes §4.5's trap bite.
 *
 * Read the three range branches against each other and the mechanic is the
 * whole rotation:
 *
 * - **FAR with a charged breath** → the named whiff. The player spent a turn on
 *   an order instead of on damage and it *worked*; §12.3 calls this a
 *   celebration beat, and the row is a real decompiled action, not a message.
 * - **FAR otherwise** → Photon Spray: eight hits, each re-rolling its target
 *   (`targeting: 'random-enemy'`, which this contract defines as a fresh pick
 *   per hit). **Not** an 8x multiplier on one victim [§3.3 note 5].
 * - **NEAR** → the four-turn cycle, with Stone Gaze replacing a melee slot once
 *   the aggro counter is spent. Phase 2 stops using Stone Gaze, which
 *   {@link stoneGazeDue} encodes by gating on phase 1 — "unless one is already
 *   readied" [§5.4, single source].
 */
export const evraeAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;
  const charged = ctx.state.flags[AIRSHIP_BREATH_CHARGED] === true;

  if (airshipRange(ctx) === 'far') {
    if (charged) {
      consumeCharge(ctx);
      return use(ai, EVRAE_OUT_OF_BREATH_RANGE, [ai.self.id]);
    }
    return use(ai, EVRAE_PHOTON_SPRAY, []);
  }

  // NEAR.
  if (charged) {
    consumeCharge(ctx);
    return use(ai, EVRAE_POISON_BREATH, []);
  }

  const s = step(ctx);
  if (s === 2) {
    // The telegraph. One turn of warning, and it is a named, visible action.
    ctx.state.flags[AIRSHIP_NEAR_STEP] = 3;
    ctx.state.flags[AIRSHIP_BREATH_CHARGED] = true;
    return use(ai, EVRAE_INHALE, [ai.self.id]);
  }

  ctx.state.flags[AIRSHIP_NEAR_STEP] = s >= 3 ? 1 : s + 1;
  if (stoneGazeDue(ctx)) {
    spendStoneGazeCounter(ctx);
    return use(ai, EVRAE_STONE_GAZE, []);
  }
  return use(ai, EVRAE_ATTACK, []);
};

// ---------------------------------------------------------------------------
// Cid
// ---------------------------------------------------------------------------

/**
 * §2.3, `[verified: 2 sources]`, transcribed exactly:
 *
 * ```
 * if (queuedOrder !== null) { applyOrder(queuedOrder); queuedOrder = null; return; }
 * if (range === FAR && missilesLeft > 0) { missilesLeft -= 1; return GuidedMissiles(EVRAE); }
 * if (range === FAR && missilesLeft === 0) return announceOutOfAmmo();  // once, then silent
 * return doNothing();
 * ```
 *
 * **The order-vs-missile exclusivity is the rule the whole fight turns on.** A
 * manoeuvre consumes his turn, so every course change costs a volley. The order
 * is never free, and a redundant one costs the same — {@link
 * REDUNDANT_ORDER_BURNS_TURN}.
 *
 * Returning `null` is a deliberate pass; the engine still charges rank-3
 * recovery, so a skipped turn is a real turn [`ai/types.ts`].
 *
 * The two message strings below are **placeholders owned by the story and
 * widget tracks** — the order widget is C-11 and needs Bailey's approval before
 * anything renders it [AGENTS.md rule 9]. They exist so the engine tests can
 * assert the economy; they are original copy, not canon lines.
 */
export const cidAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;

  if (queuedOrder(ctx) !== null) {
    const order = queuedOrder(ctx);
    applyQueuedOrder(ctx);
    ctx.emit({
      type: 'message',
      text: order === 'far' ? 'The Fahrenheit pulls back' : 'The Fahrenheit closes in',
      kind: 'telegraph',
    });
    return null;
  }

  if (airshipRange(ctx) !== 'far') return null;

  const left = typeof ai.memory['missilesLeft'] === 'number' ? (ai.memory['missilesLeft'] as number) : 0;
  if (left > 0) {
    ai.memory['missilesLeft'] = left - 1;
    ctx.state.flags[AIRSHIP_MISSILES] = left - 1;
    return use(ai, CID_GUIDED_MISSILES, [EVRAE_ID]);
  }

  if (ctx.state.flags[AIRSHIP_OUT_OF_AMMO] !== true) {
    ctx.state.flags[AIRSHIP_OUT_OF_AMMO] = true;
    ctx.emit({ type: 'message', text: 'Cid is out of missiles', kind: 'system' });
  }
  return null;
};

/** Volleys still in the rack, for the tactic, the guide and the tests. */
export function missilesLeft(ctx: Ctx): number {
  if (!isEvraeBattle(ctx)) return 0;
  if (!tryActor(ctx, CID_ID)) return 0;
  const v = rtOf(ctx, CID_ID).ai['missilesLeft'];
  return typeof v === 'number' ? v : 0;
}

registerAiScript(EVRAE_SCRIPT, evraeAi);
registerAiScript(CID_SCRIPT, cidAi);
