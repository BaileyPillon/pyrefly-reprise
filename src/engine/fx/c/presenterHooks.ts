/**
 * Option C, "Spectacle Combat" (eye-candy options round, 2026-09-29): the presenter's side.
 *
 * The beats call these at the moments C decorates (the action's opening, each blow, a fiend
 * being sent, the victory). They only talk to the optional `BattleStage.fx` port, so rule 1
 * holds: no `three`, no DOM, and with no port (tests, every build without `?fx=c`) each one is
 * a no-op that tells the beat to do exactly what it did before. The engine, its RNG and the
 * ATB clock never see any of it.
 *
 * Game case: both; the port decides the skin per game.
 */

import type { BattleEvent, CombatantId } from '../../../battle/common/types.ts';
import type { EventCtx } from '../../BattlePresenterEvents.ts';

/** What the stage offers option C. Every method is optional; `enabled()` false = today's look. */
export interface FxStagePort {
  enabled(): boolean;
  /** An action opens: Overdrives and Specials get the splash cut-in (C6). Resolves when it clears. */
  actionOpen?(o: { actorId: CombatantId; name: string; kind: 'overdrive' | 'special' | 'other' }): Promise<void>;
  /**
   * One blow lands. Returns how long (ms) the presentation holds (C2); the beat awaits that in
   * place of its own hit-stop sleep on a heavy blow, and never waits on a light one.
   * `shook` is true when C took over the camera shake (C4).
   */
  hit?(o: {
    targetId: CombatantId;
    element?: string | undefined;
    crit: boolean;
    heavy: boolean;
    hitIndex: number;
    hitCount: number;
    big: boolean;
    /** The action's damage type is magical (a non-elemental spell still gets a layer). */
    magic: boolean;
    action: number;
    speed: string;
    /** This blow is the last the action shows (`isLastShownBlow`); absent when the burst is not at hand. FFX's finishing accent reads it; FFX-2's does not. */
    lastShown?: boolean | undefined;
  }): { freezeMs: number; shook: boolean };
  /** A fiend is sent (only where the departure is a dissolve, C8). */
  dissolve?(id: CombatantId): void;
  /** The victory: `pose` chapters orbit, `hold` ones only push in (C9). Returns the ms the beat should hold for it. */
  victory?(kind: 'pose' | 'hold'): number;
  /**
   * An encounter's opening shot begins (the first link, and every later link of a chain). The victory arc
   * of the link before it is held at its end until then; from here it is let go (PR-0300).
   */
  opening?(): void;
}

/** The FFX-2 boss Specials and FFX boss moves that get the splash; party Overdrives always do. */
const SPECIALS = new Set(['mega flare', 'aerospark']);

interface ActionMark {
  kind: 'overdrive' | 'special' | 'other';
  count: number;
  magic: boolean;
}

const marks = new WeakMap<EventCtx, ActionMark>();

function port(ctx: EventCtx): FxStagePort | null {
  const fx = (ctx.stage as { fx?: FxStagePort }).fx;
  return fx && fx.enabled() ? fx : null;
}

/** `action-start`, after the Overdrive rig or the punch-in: the splash, when there is one. */
export async function fxActionOpen(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): Promise<void> {
  const prev = marks.get(ctx);
  const name = event.abilityName ?? '';
  const kind: ActionMark['kind'] =
    event.command.kind === 'overdrive' ? 'overdrive' : SPECIALS.has(name.trim().toLowerCase()) ? 'special' : 'other';
  const magic = event.abilityId ? ctx.deps.abilityFacts?.(event.abilityId)?.damageType === 'magical' : false;
  marks.set(ctx, { kind, count: (prev?.count ?? 0) + 1, magic });
  const fx = port(ctx);
  if (!fx?.actionOpen || kind === 'other' || ctx.speed() === 'skip') return;
  await fx.actionOpen({ actorId: event.actorId, name, kind });
}

/** A damage event the presenter shows as a blow (`BattlePresenterBeats.damage` hands it to `fxHit`): it hurts, and it is not an IMMUNE or a zero. */
function isBlow(e: BattleEvent): boolean {
  return e.type === 'damage' && e.amount > 0 && e.affinity !== 'immune';
}

/**
 * Is the damage event at `at` of `events` the last blow its action shows (FFX; release 53, the driver's item on RC10's hit-order lane)?
 *
 * An action that hits several targets more than once replays its hits round by round (`battle/ffx/hit-order.ts`), but each damage event keeps the index it was calculated at, so the hit with
 * the highest index is not always the one shown last (Fire Fury over foes that take five and two hits: it is the fourth of seven). The events that follow the one in hand are the action's own
 * (`EventCtx.burst`), so the last blow shown is the one no later blow of the same source follows before the action ends. A miss, an IMMUNE or zero number and a heal are not blows; a reaction
 * (a counter, another source's) inside the burst does not take the accent from the action it answers.
 */
export function isLastShownBlow(events: readonly BattleEvent[], at: number): boolean {
  const here = events[at];
  if (here === undefined || here.type !== 'damage') return true;
  for (let i = at + 1; i < events.length; i++) {
    const e = events[i]!;
    if (e.type === 'action-end' || e.type === 'action-start') return true;
    if (e.type === 'damage' && e.sourceId === here.sourceId && isBlow(e)) return false;
  }
  return true;
}

/** `isLastShownBlow` for the event in hand, or undefined when the burst being played is not at hand (a rig with no burst): the stage then keeps the index rule. */
function lastShownAt(ctx: EventCtx, event: Extract<BattleEvent, { type: 'damage' }>): boolean | undefined {
  const burst = ctx.burst;
  if (burst === undefined || burst.events[burst.at] !== event) return undefined;
  return isLastShownBlow(burst.events, burst.at);
}

/**
 * One blow. Returns null when C is off (the beat keeps today's shake and hit-stop), else the
 * ms the beat should wait on a heavy blow (0 on a light one) and whether C shook the camera.
 */
export function fxHit(
  ctx: EventCtx,
  event: Extract<BattleEvent, { type: 'damage' }>,
  heavy: boolean,
): { waitMs: number; shook: boolean } | null {
  const fx = port(ctx);
  if (!fx?.hit) return null;
  const mark = marks.get(ctx);
  const r = fx.hit({
    targetId: event.targetId,
    element: event.element,
    crit: event.crit === true,
    heavy,
    hitIndex: event.hitIndex ?? 0,
    hitCount: event.hitCount ?? 1,
    big: mark !== undefined && mark.kind !== 'other',
    magic: mark?.magic === true,
    action: mark?.count ?? -1,
    speed: ctx.speed(),
    lastShown: lastShownAt(ctx, event),
  });
  return { waitMs: heavy ? r.freezeMs : 0, shook: r.shook };
}

/** A fiend is sent: the richer dissolve (C8). Only called on the dissolve path. */
export function fxDissolve(ctx: EventCtx, id: CombatantId): void {
  port(ctx)?.dissolve?.(id);
}

/** The victory camera (C9). Returns how long the beat should hold for it (0 without C). */
export function fxVictory(ctx: EventCtx, kind: 'pose' | 'hold'): number {
  return ctx.speed() === 'normal' ? (port(ctx)?.victory?.(kind) ?? 0) : 0;
}

/**
 * The opening shot of an encounter or of a chain's next link (PR-0300). Without it, the previous link's
 * victory arc (12 degrees of yaw, a rise and a push about the old party centre) stayed on the camera, so a
 * Chapter XV seam opened with the floor plate's right edge in frame and black beyond it. Any speed, and
 * whether or not C is on right now (an arc held while the look was switched off must not come back).
 */
export function fxOpening(ctx: EventCtx): void {
  (ctx.stage as { fx?: FxStagePort }).fx?.opening?.();
}

/**
 * The optional port on the stage, declared here rather than in the two large files it lives on
 * (`BattlePresenterPorts.ts`, `BattlePresenterStage.ts`), which stay at their line budget: absent
 * everywhere but the option-C build (`app/screens/battleSpectacle.ts` sets it).
 */
declare module '../../BattlePresenterPorts.ts' {
  interface BattleStage {
    fx?: FxStagePort;
  }
}
declare module '../../BattlePresenterStage.ts' {
  interface PaintedStage {
    fx?: FxStagePort;
  }
}
