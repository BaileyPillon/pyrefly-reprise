/**
 * **The blow lands when the strike does** (VP-1001-06; both games).
 *
 * Every physical action started a 440 ms lunge at `action-start` and the target's recoil came
 * with the `damage` (or `miss`) event, after the wind-up sleep and whatever the HUD did with the
 * events in between: measured lunge start to recoil 366 to 399 ms (median), when the attacker
 * was already about 90 percent of the way home, so every hit landed on air. The lunge's own
 * impact is at 0.58 of the move (`ATTACK_IMPACT`, 255 ms).
 *
 * Now the two meet. `armContact` hands the lunge a contact: the strike runs to its apex and holds
 * there (a short contact freeze) until the first hit or miss on someone else releases it;
 * `meetContact` makes that hit wait for the apex if it arrives early. Both waits are capped, so a
 * physical action with no hit event (a status-only skill) holds at most `CONTACT_HOLD_MAX_MS`
 * and a hit never waits more than `CONTACT_WAIT_MAX_MS`. `actionEnd` always releases.
 *
 * Presentation only (no engine state, no RNG); ports only. The per-command lunge profiles the
 * critic also suggested are a new look and are left to Bailey (EC-1001-04).
 */
import type { CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { followThrough } from './KeyPoses.ts';
import { curvesOn } from './motion/CurvesSwitch.ts'; // motion pass (lane "core")

/** What a lunge is handed: hold at the apex until `hold` settles; call `reached` at the apex. */
export interface LungeContact {
  hold: Promise<unknown>;
  reached: () => void;
  /**
   * Optional (motion pass, lane "core"; only with the new curves on): the impact painting's hook. The sampled strike calls it on its `travelPeak` mark (the fastest frame before
   * contact), so the impact painting is up AT the blow and not after it; `reached` then only marks the contact. Absent: today's lunge, which puts the painting up at `reached`.
   */
  impact?: () => void;
  /** Optional (same, step 2): the way out. The sampled strike calls it on its `settlePeak` mark (the fastest frame of the way home): the impact painting goes to the follow-through or the idle there. */
  settle?: () => void;
}

/** The longest the attacker holds at the apex waiting for the blow, ms at timeScale 1. */
export const CONTACT_HOLD_MAX_MS = 700;
/** The new strike's extra run to its contact over today's apex (400 - 255 ms, rounded up), added to the hold cap while `curvesOn()`. */
export const CURVES_CONTACT_EXTRA_MS = 150;
/** The longest a hit waits for the attacker to reach the apex, ms at timeScale 1. */
export const CONTACT_WAIT_MAX_MS = 400;

interface Pending {
  attacker: CombatantId;
  reached: Promise<void>;
  release: () => void;
}

const pending = new WeakMap<EventCtx, Pending>();

/** Arm the contact for `attacker`'s lunge (replacing any left over). */
export function armContact(ctx: EventCtx, attacker: CombatantId): LungeContact {
  releaseContact(ctx);
  let release: () => void = () => {};
  let reach: () => void = () => {};
  const held = new Promise<void>((r) => (release = r));
  const reached = new Promise<void>((r) => (reach = r));
  pending.set(ctx, { attacker, reached, release });
  // The new strike reaches its contact later (wind-up and travel are 0.4 s, not 0.255 s): the cap counts from the lunge's start, so it is lengthened by the same difference.
  return { hold: Promise.race([held, ctx.sleep(CONTACT_HOLD_MAX_MS + (curvesOn() ? CURVES_CONTACT_EXTRA_MS : 0))]), reached: reach };
}

/**
 * Before a hit or a miss on `targetId` plays: wait (capped) for the attacker's apex, then let the
 * strike go on. A no-op without an armed contact, and for the attacker's own events.
 */
export async function meetContact(ctx: EventCtx, targetId: CombatantId): Promise<void> {
  const p = pending.get(ctx);
  if (!p || p.attacker === targetId) return;
  await Promise.race([p.reached, ctx.sleep(CONTACT_WAIT_MAX_MS)]);
  if (pending.get(ctx) !== p) return;
  // D-313: a painted follow-through goes up as the blow lands and holds at full reach for a beat.
  pending.delete(ctx);
  const beat = followThrough(ctx, p.attacker);
  if (beat > 0) void ctx.sleep(beat).then(p.release);
  else p.release();
}

/** Let any held strike finish (`actionEnd`, and every new contact). */
export function releaseContact(ctx: EventCtx): void {
  const p = pending.get(ctx);
  if (!p) return;
  pending.delete(ctx);
  p.release();
}
