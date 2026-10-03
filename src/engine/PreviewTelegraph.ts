/**
 * PREVIEW ONLY (branch preview-picks, never merged): holds a boss's `telegraph` painting for one beat before the
 * headline moves of bosses whose engine AI emits no `charge` event (so the r37 telegraph slot never fires for them).
 * Off unless the page sets `globalThis.__previewTelegraph = true` (the capture script does, through an init script);
 * a build with no flag, or a boss with no painting, plays exactly as main does. Ports only: no `three`, no DOM, no
 * engine state, no RNG. The hold is an ADDED WAIT of `PREVIEW_TELEGRAPH_MS` (the real wiring is Bailey's decision:
 * critic EC-1001-06, a deep-class change).
 *
 * Game case: both, per boss: Seymour Flux, Evrae, Yunalesca (FFX only); Trema (FFX-2 only).
 */
import type { BattleEvent } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { TELEGRAPH_POSE } from './KeySlots.ts';

export const PREVIEW_TELEGRAPH_MS = 950;

/** Headline move ids (data ids) that get the hold. */
const MOVES: ReadonlySet<string> = new Set([
  'lance-of-atrophy', // Seymour Flux, FFX Ch I
  'mega-death', 'hellbiter', // Yunalesca, FFX Ch II
  'evrae-inhale', // Evrae, FFX Ch VIII (the intended tactics never draw it: Evrae opens with attack and Photon Spray)
  'evrae-photon-spray', // PREVIEW STAND-IN so the Evrae painting shows in play: the painting is the Inhale wind-up, not a Photon Spray one
  'trema-meteor', 'trema-ultima', // Trema, FFX-2 Ch XIII
]);

export async function previewTelegraphHold(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): Promise<void> {
  if ((globalThis as { __previewTelegraph?: boolean }).__previewTelegraph !== true) return;
  const id = event.abilityId ?? (event.command as { id?: string }).id;
  if (!id || !MOVES.has(id) || ctx.stage.sideOf(event.actorId) !== 'enemy') return;
  if (ctx.stage.paints?.(event.actorId, TELEGRAPH_POSE) !== true) return;
  const actor = ctx.stage.actor(event.actorId);
  if (!actor) return;
  actor.setPose(TELEGRAPH_POSE);
  actor.flash(0xffc46b, 620, 0.7);
  void ctx.moments.telegraph(event.actorId, 1, event.abilityName ?? '');
  await ctx.sleep(PREVIEW_TELEGRAPH_MS);
}
