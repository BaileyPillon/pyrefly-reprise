/**
 * The two rotations of the *Fahrenheit* fight — **Evrae** and **Cid**.
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 2 (the two
 * scripts read from the game, m119 and m149; re-parity AI lane C), which replaced
 * the wiki-derived pseudocode of `research/ffx-evrae-airship.md` §4.4, §5.7 and
 * §2.3 (Cid's decision order, quoted verbatim below). Everything they read — the
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
import { randomLiving } from './game-rolls.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  AIRSHIP_BREATH_CHARGED,
  AIRSHIP_MISSILES,
  AIRSHIP_NEAR_STEP,
  AIRSHIP_ORDER,
  AIRSHIP_OUT_OF_AMMO,
  AIRSHIP_RANGE,
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
  EVRAE_SWOOPING_SCYTHE,
  airshipRange,
  applyQueuedOrder,
  evraePhase,
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
 * His turn, as the script has it (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 2.3, m119 f2 @0x1D5). The slot
 * `v7` (`AIRSHIP_NEAR_STEP`, with `AIRSHIP_BREATH_CHARGED` for 3) only advances at NEAR:
 *
 * - **NEAR, slot 0 or 1** → one living, targetable front-line member is picked (a draw only with two or more); the Attack
 *   slot is a Stone Gaze on that member while the counter is above 5 (and the counter is spent), else an Attack on it.
 * - **NEAR, slot 2** → Inhale, the telegraph. **Slot 3** → Poison Breath on the front line.
 * - **FAR, slot 3** → the named whiff: the ship pulled back while he breathed in, and the player's spent turn *worked* (§12.3).
 * - **FAR, Haste phase** → Swooping Scythe on the front line, then he is NEAR and the pending order is gone (D-05).
 * - **FAR otherwise** → Photon Spray: eight hits, each re-rolling its target (`targeting: 'random-enemy'`, a fresh pick per
 *   hit). **Not** an 8x multiplier on one victim [§3.3 note 5].
 *
 * Swooping Scythe is also his answer to a hit while FAR in the Haste phase: that is his `onHit` (`./evrae-counters.ts`).
 */
export const evraeAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;
  const charged = ctx.state.flags[AIRSHIP_BREATH_CHARGED] === true;

  if (airshipRange(ctx) === 'far') {
    if (charged) {
      consumeCharge(ctx);
      return use(ai, EVRAE_OUT_OF_BREATH_RANGE, [ai.self.id]);
    }
    if (evraePhase(ctx) === 2) {
      ctx.state.flags[AIRSHIP_RANGE] = 'near';
      ctx.state.flags[AIRSHIP_ORDER] = '';
      return use(ai, EVRAE_SWOOPING_SCYTHE, []);
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
  const victim = randomLiving(ctx);
  const aim = victim === undefined ? [] : [victim.id];
  if (stoneGazeDue(ctx)) {
    spendStoneGazeCounter(ctx);
    return use(ai, EVRAE_STONE_GAZE, aim);
  }
  return use(ai, EVRAE_ATTACK, aim);
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
