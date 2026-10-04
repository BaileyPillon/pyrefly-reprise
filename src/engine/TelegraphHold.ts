/**
 * Release 38 telegraph hold (D-355, Bailey 2026-10-03; **FFX only**; presentation only, ports only: no `three`,
 * no DOM, no engine state, no RNG).
 *
 * The r37 telegraph slot (`KeySlots.telegraphUp`: a boss's own `telegraph.png`) shows at the engine's `charge`
 * beat, and Seymour Flux and Braska's Final Aeon never emit one, so their wind-up paintings could never show.
 * At the `action-start` of each one's headline move the boss now puts that painting up through the same slot and
 * holds it {@link TELEGRAPH_HOLD_MS} before the strike:
 *
 * - Seymour Flux (Chapter I): Lance of Atrophy (`lance-of-atrophy`).
 * - Braska's Final Aeon (Chapter III): Ultimate Jecht Shot (`ultimate-jecht-shot`, form 2's Overdrive; the
 *   painting is `braskas-final-aeon-2/telegraph.png`, so form 1 has none and does not hold).
 *
 * Nothing else holds: the table is the whole list, keyed by the boss's combatant id (Omnis is not in it; Bailey's
 * "maybe after"). The hold is an ADDED WAIT, which the r37 slot was built not to have: it is `ctx.sleep`, so it
 * scales with the playback speed and the pacing option like every beat (`'steady'`, the FFX default, makes the
 * authored 950 ms about 1.14 s; `'fast'` about 0.37 s; none at `'skip'`). It is the only wait added: the zoom and
 * the heartbeat that play under it end with it (see the end of `telegraphHold`).
 *
 * **Gates (all must hold, else the move plays exactly as before: no pose, no wait):** the move is in the table;
 * an FFX battle (never FF7's runner or FFX-2's framing); the actor is an enemy; BATTLE SPECTACLE is on and the boss
 * has its own `telegraph` painting (both read by `telegraphUp`: no painting installed, or the look off, is today's
 * move). It never reads engine state or the RNG, so the battle log is byte for byte what it was.
 *
 * **REDUCE MOTION** keeps the same pause and drops the motion: the painting goes up as a single cut (the slot's
 * `immediate` swap, no crossfade) and the boss's glow and the zoom-and-heartbeat of the `charge` beat are not
 * played. The pause stays because REDUCE MOTION never changes how long a beat waits (`ComfortCamera.ts`: "no
 * moment waits a different time"; `pace.ts`: "REDUCE MOTION never shortens these"), so a player with it on gets the
 * same fight rhythm (the same added time, to the frame) and the same time to read the warning, only without the
 * movement. Cutting the pause would also remove the one beat that tells that player the blow is coming.
 */
import type { BattleEvent } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { telegraphUp } from './KeySlots.ts';

/** The wind-up painting's hold before the strike, in ms at `timeScale` 1 (`ctx.sleep` applies speed and pacing). */
export const TELEGRAPH_HOLD_MS = 950;

/** Headline moves that hold, by the boss's combatant id (FFX data ids). Everything not named here plays as before. */
const HOLDS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['seymour-flux', new Set(['lance-of-atrophy'])], // Chapter I
  ['braskas-final-aeon', new Set(['ultimate-jecht-shot'])], // Chapter III, form 2
]);

/** Is this boss's move one that holds its telegraph painting? (The table only; the gates are in `telegraphHold`.) */
export function holdsTelegraph(actorId: string, abilityId: string | undefined): boolean {
  return abilityId !== undefined && HOLDS.get(actorId)?.has(abilityId) === true;
}

/**
 * `action-start`, before the move's own pose and shot: put the boss's telegraph painting up and hold it. Resolves
 * at once, having done nothing, for every move that does not hold.
 */
export async function telegraphHold(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): Promise<void> {
  const id = event.abilityId ?? (event.command as { id?: string }).id;
  if (!holdsTelegraph(event.actorId, id)) return;
  if (ctx.speed() === 'skip' || ctx.deps.actionMotion || ctx.moments?.shots?.ffx2Framing === true) return; // FFX only (not FF7's runner, not FFX-2); no chrome at 'skip'
  if (ctx.stage.sideOf(event.actorId) !== 'enemy') return;
  if (!telegraphUp(ctx, event.actorId)) return; // the look is off, or no painting of its own: today's move
  const calm = ctx.moments.reducedMotion === true;
  if (!calm) {
    ctx.stage.actor(event.actorId)?.flash(0xffc46b, 620, 0.7); // the `charge` beat's own glow, zoom and heartbeat
    void ctx.moments.telegraph(event.actorId, 1, event.abilityName ?? '');
  }
  await ctx.sleep(TELEGRAPH_HOLD_MS);
  // The zoom and the heartbeat are the wind-up, so they end with it. Left open they would outlive the move, and
  // `BattleMoments.actionClose` awaits their camera release (0.74 s at the default pacing, measured: the move's
  // `action-end` played 991 ms against today's 249): a second wait on top of the hold, which REDUCE MOTION never had.
  if (!calm) void ctx.moments.telegraphEnd();
}
