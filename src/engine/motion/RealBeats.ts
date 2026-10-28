/**
 * THE PRESENTER'S SIDE OF THE REAL MOTION (conference demo, integration 2, 2026-10-22; `?curves=real` and `?curves=real-snappy`, `RealMotion.ts`). Small answers the beats ask: "what does the real game
 * do for this figure's attack, cast, hit, run home?". Every function answers undefined (the house curves, or today's code, play) unless the real mode is on in a demo chapter AND the table has a row for
 * the figure. Ports only: no `three`, no DOM, no engine state, no RNG.
 *
 * The figure is named by its ART id (`stage.artOf`, optional on the port: a stage without it is asked by the combatant id, which is the art id for the party in both chapters).
 *
 * Game case: FFX only in Chapter I, FFX-2 only in Chapter IV (the chapter's game picks the table; `CurvesSwitch.curvesGame`).
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { BattleStage } from '../BattlePresenterPorts.ts';
import { curvesGame, realKind } from './CurvesSwitch.ts';
import { contactMsOf, holdMsOf, phasesOf, realArcGain, realCastOf, realHitMs, realRowOf, realStrikeProfile } from './RealMotion.ts';
import { defaultPaceFactor, type StrikeProfile } from './StrikeCurve.ts';

/** The slice of a presenter context these answers read: the stage (the event context and the motion context both have it). */
type EventCtx = { readonly stage: BattleStage };

/** The art id the stage drew this combatant with, else the combatant's own id. */
export function artIdOf(ctx: EventCtx, id: CombatantId): string {
  return ctx.stage?.artOf?.(id) ?? id;
}

/** The real attack profile of a combatant in the running real mode, or undefined (`?curves=new`, `today`, a figure the table does not cover). */
export function realProfileOf(ctx: EventCtx, id: CombatantId | null | undefined): StrikeProfile | undefined {
  const kind = realKind();
  return kind && id ? realStrikeProfile(curvesGame(), artIdOf(ctx, id), kind) : undefined;
}

/** The real strike's contact for a combatant, ms at timeScale 1 and pace 1 (the sound's lead and the contact beat's waits are written in it); undefined outside a real mode. */
export function realContactMsOf(ctx: EventCtx, id: CombatantId | null | undefined): number | undefined {
  const p = realProfileOf(ctx, id);
  return p && id ? contactMsOf(p, ctx.stage?.actor?.(id)?.strikeHeft?.() ?? 0) : undefined;
}

/** How long the real strike holds at its contact at least, same units. */
export function realHoldMsOf(ctx: EventCtx, id: CombatantId | null | undefined): number | undefined {
  const p = realProfileOf(ctx, id);
  return p && id ? holdMsOf(p, ctx.stage?.actor?.(id)?.strikeHeft?.() ?? 0) : undefined;
}

/** A figure's height in world units (its head over its feet), as `liftCaster` reads it. */
function heightOf(ctx: EventCtx, id: CombatantId): number | undefined {
  const a = ctx.stage?.actor?.(id);
  return a ? Math.max(0.5, a.headPoint().y - a.position.y) : undefined;
}

/**
 * The cast's lift in a real mode: how high (world units) and how long it takes to rise (paced ms, the wind-up of the real clip), and how long the release takes (the real clip's recovery).
 * Undefined when the table has no cast for the caster.
 */
export function realCastLift(ctx: EventCtx, id: CombatantId, moveScale: number): { height: number; riseMs: number; releaseMs: number } | undefined {
  if (!realKind()) return undefined;
  const game = curvesGame();
  const cast = realCastOf(game, artIdOf(ctx, id));
  const h = heightOf(ctx, id);
  if (!cast || cast.liftShare === undefined || cast.windupMs === undefined || h === undefined) return undefined;
  const k = moveScale / defaultPaceFactor(game);
  return { height: h * cast.liftShare * realArcGain(), riseMs: cast.windupMs * k, releaseMs: (cast.returnMs ?? 260) * k };
}

/** How long a hit reaction lasts in a real mode (the real clip's recovery), ms; `fallback` outside one or for a figure the table does not cover. */
export function realRecoilMs(ctx: EventCtx, id: CombatantId, fallback: number): number {
  if (!realKind()) return fallback;
  return realHitMs(curvesGame(), artIdOf(ctx, id)) ?? fallback;
}

/**
 * FFX-2's run home in a real mode: the real back-jump of the attack (its length, and its height in world units). Undefined when the figure's real return does not leave the floor (Yuna stays; the
 * house run home plays) or outside a real mode.
 */
export function realLeapBack(ctx: EventCtx, id: CombatantId): { ms: number; height: number } | undefined {
  const kind = realKind();
  if (!kind) return undefined;
  const row = realRowOf(curvesGame(), artIdOf(ctx, id))?.attack;
  const h = heightOf(ctx, id);
  if (!row || h === undefined || row.returnArc < 0.1) return undefined;
  return { ms: phasesOf(curvesGame(), row, kind).returnMs, height: h * row.returnArc * realArcGain() };
}
