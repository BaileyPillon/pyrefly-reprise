/**
 * The presenter's half of `?motion=M3` (opt-motion prototype, never on main): a spell or a shot visibly leaves the
 * caster, crosses the field and lands, instead of the effect simply appearing on the target.
 *
 * Game case: both, one rule. It reads only what the stage already knows (who acts, who is hit, the ability id); the
 * look (colour, arc, trail) is the stage's (`ProjectileFx.ts`). Ports only, no `three`, no DOM (hard rule 1).
 *
 * - Launched at `action-start` for a `cast` action (a spell or a special) whose targets are on the other side. Heals
 *   and self buffs, whose targets share the caster's side, are left as they are.
 * - The first blow waits for the projectile (`awaitProjectile`, called from `awaitSpellLanding`), so the numeral
 *   still lands with the effect; the flight is about as long as the action's own opening wait, so a single spell
 *   adds almost nothing.
 * - Off under REDUCE MOTION, in `skip` playback, and (FFX-2 only) while a command menu is open.
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import type { ActionStartEvent } from '../BattlePresenterMotion.ts';
import { menuBlocksMotion } from '../KeySlots.ts';
import { motionOn } from './MotionMode.ts';

/** Flight times at normal speed, ms (our estimate; the sources say nothing about spell travel). */
export const FLIGHT_MS = { orb: 400, tracer: 160, beam: 260 } as const;

const pending = new WeakMap<EventCtx, Map<CombatantId, Promise<void>>>();

/** `action-start`: send the projectile(s) for this action, if it has any. */
export function launchProjectile(ctx: EventCtx, event: ActionStartEvent, pose: string): void {
  if (!motionOn('M3') || pose !== 'cast') return;
  if (ctx.moments?.reducedMotion === true || ctx.speed() === 'skip' || menuBlocksMotion(ctx)) return;
  const travel = ctx.stage.vfx.travel;
  if (!travel) return;
  const side = ctx.stage.sideOf(event.actorId);
  const foes = (event.targets ?? []).filter((t) => {
    const s = ctx.stage.sideOf(t);
    return s !== undefined && s !== side && !(side !== 'enemy' && s === 'aeon') && t !== event.actorId;
  });
  if (!foes.length || (event.command.kind !== 'ability' && event.command.kind !== 'overdrive')) return;
  const id = event.abilityId ?? (event.command as { id?: string }).id;
  const kind = id && /darkness|dark-knight/.test(id) ? 'beam' : 'orb';
  const scale = ctx.speed() === 'fast' ? 0.4 : 1;
  const flights = foes.slice(0, 4).map((to) => travel.call(ctx.stage.vfx, event.actorId, to, { ...(id ? { abilityId: id } : {}), kind, ms: Math.round(FLIGHT_MS[kind] * scale) }).landed);
  let m = pending.get(ctx);
  if (!m) pending.set(ctx, (m = new Map()));
  m.set(event.actorId, Promise.all(flights).then(() => undefined));
}

/** The first blow of `actorId`'s action: wait (capped) until its projectile has landed. */
export function awaitProjectile(ctx: EventCtx, actorId: CombatantId | undefined): Promise<unknown> | undefined {
  const m = pending.get(ctx);
  const p = actorId ? m?.get(actorId) : undefined;
  if (!p) return undefined; // nothing in flight: no await at all, so without the flag the loop is untouched
  m!.delete(actorId!);
  return Promise.race([p, ctx.sleep(900)]);
}
