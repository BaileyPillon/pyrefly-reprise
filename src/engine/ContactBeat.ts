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

/** What a lunge is handed: hold at the apex until `hold` settles; call `reached` at the apex. */
export interface LungeContact {
  hold: Promise<unknown>;
  reached: () => void;
}

/** The longest the attacker holds at the apex waiting for the blow, ms at timeScale 1. */
export const CONTACT_HOLD_MAX_MS = 700;
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
  return { hold: Promise.race([held, ctx.sleep(CONTACT_HOLD_MAX_MS)]), reached: reach };
}

/**
 * Before a hit or a miss on `targetId` plays: wait (capped) for the attacker's apex, then let the
 * strike go on. A no-op without an armed contact, and for the attacker's own events.
 */
export async function meetContact(ctx: EventCtx, targetId: CombatantId): Promise<void> {
  const p = pending.get(ctx);
  if (!p || p.attacker === targetId) return;
  await Promise.race([p.reached, ctx.sleep(CONTACT_WAIT_MAX_MS)]);
  releaseContact(ctx);
}

/** Let any held strike finish (`actionEnd`, and every new contact). */
export function releaseContact(ctx: EventCtx): void {
  const p = pending.get(ctx);
  if (!p) return;
  pending.delete(ctx);
  p.release();
}
