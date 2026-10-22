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
import { hitPower } from '../../motion/DemoHit.ts';
import { demoMotionOn } from '../../motion/DemoMotion.ts';
import { rumbleHit, rumbleOpen, rumbleWin } from '../../feel/FeelHooks.ts'; // the motion program's gamepad rumble (`?rumble=`): a no-op unless switched on in a demo chapter
import { punchMode, rumbleOn, stopMode } from '../../feel/FeelSwitch.ts';
import { isBossBigMove } from '../../feel/HitStopShort.ts';
import { bigBlowClaimed } from '../../feel/BlowClaim.ts';
import { isFfx2, menuBlocks } from '../../KeySlots.ts';

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
    /** `?motion=demo` only (`motion/DemoHit.hitPower`): how hard the blow is. */
    power?: number | undefined;
    /** A foe's headline move (`feel/HitStopShort.isBossBigMove`); read by `?hitstop=short` and `?punch=new`. */
    bossBig?: boolean | undefined;
    /** FFX-2: a command menu is open right now; `?punch=new` plays no camera punch over it, `?hitstop=short` holds no frame. */
    menuOpen?: boolean | undefined;
    /** The new effects' beat claimed this blow (`feel/BlowClaim.ts`): the feel rules treat it as the finisher of a big action. */
    fxBig?: boolean | undefined;
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
  /** A foe is using one of its headline moves (`feel/HitStopShort.BOSS_BIG_MOVES`), and who it is (under FFX-2's ATB another actor's blow can land while this action is the latest opened). */
  bossBig: boolean;
  actorId: CombatantId;
}

const marks = new WeakMap<EventCtx, ActionMark>();
/** Each actor's latest opened action: under FFX-2's Active ATB a blow can land after another actor's action has opened (Impulse's blows after a girl's attack began), so `marks` (the latest of all) names the wrong action. */
const bySource = new WeakMap<EventCtx, Map<CombatantId, ActionMark>>();

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
  const mark: ActionMark = { kind, count: (prev?.count ?? 0) + 1, magic, actorId: event.actorId, bossBig: isBossBigMove(event.abilityId) && ctx.stage.sideOf?.(event.actorId) === 'enemy' };
  marks.set(ctx, mark);
  let own = bySource.get(ctx);
  if (!own) bySource.set(ctx, (own = new Map()));
  own.set(event.actorId, mark);
  rumbleOpen(ctx, kind);
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

const lastByIndex = (e: Extract<BattleEvent, { type: 'damage' }>): boolean => (e.hitIndex ?? 0) >= (e.hitCount ?? 1) - 1;

/**
 * One blow. Returns null when C is off (the beat keeps today's shake and hit-stop), else the
 * ms the beat should wait on a heavy blow (0 on a light one) and whether C shook the camera.
 */
export function fxHit(
  ctx: EventCtx,
  event: Extract<BattleEvent, { type: 'damage' }>,
  heavy: boolean,
): { waitMs: number; shook: boolean } | null {
  const latest = marks.get(ctx);
  const feel = punchMode() !== 'today' || stopMode() !== 'today'; // only under the motion program's switches does `big` follow the blow's own action; today it is the latest opened, as it always was
  // A blow that names no source (a poison tick, an end-of-turn effect) belongs to no action: under the motion program's switches it takes none of the latest action's facts (integration review m1: a poison
  // tick on Seymour after Lance of Atrophy was read as the Lance's blow and got a second stop and pulse). With every switch at today the latest action is read as it always was.
  const ownerless = event.sourceId === undefined && (feel || rumbleOn());
  // The action this blow belongs to: its source's own latest action, else the latest of all when that is the source's (or the blow names no source).
  const mark = ownerless ? undefined : ((event.sourceId !== undefined ? bySource.get(ctx)?.get(event.sourceId) : undefined) ?? (latest !== undefined && (event.sourceId === undefined || event.sourceId === latest.actorId) ? latest : undefined));
  const bossBig = mark?.bossBig === true;
  const bigMark = feel ? mark : latest;
  const fxBig = bigBlowClaimed(event); // the new effects' beat named this an Overdrive's opening blow or a boss's headline blow: it takes the finisher's pulse, stop and punch once (`feel/BlowClaim.ts`)
  rumbleHit(
    ctx,
    event,
    heavy,
    fxBig ? { kind: mark !== undefined && mark.kind !== 'other' ? mark.kind : 'overdrive', bossBig } : mark === undefined ? undefined : { kind: mark.kind, bossBig },
    fxBig || (isFfx2(ctx) ? lastByIndex(event) : (lastShownAt(ctx, event) ?? lastByIndex(event))),
  );
  const fx = port(ctx);
  if (!fx?.hit) return null;
  const r = fx.hit({
    targetId: event.targetId,
    element: event.element,
    crit: event.crit === true,
    heavy,
    hitIndex: event.hitIndex ?? 0,
    hitCount: event.hitCount ?? 1,
    big: bigMark !== undefined && bigMark.kind !== 'other',
    magic: latest?.magic === true,
    action: latest?.count ?? -1,
    speed: ctx.speed(),
    lastShown: lastShownAt(ctx, event),
    bossBig,
    menuOpen: menuBlocks(ctx),
    ...(fxBig ? { fxBig } : {}),
    ...(demoMotionOn() ? { power: hitPower(event.amount, ctx.hpMaxOf?.(event.targetId)) } : {}), // `?motion=demo`: the stop and the shake grow with the blow (`motion/DemoHit.ts`)
  });
  return { waitMs: heavy || demoMotionOn() ? r.freezeMs : 0, shook: r.shook }; // the demo waits out every stop it makes, so the next beat does not run ahead of a held field
}

/** A fiend is sent: the richer dissolve (C8). Only called on the dissolve path. */
export function fxDissolve(ctx: EventCtx, id: CombatantId): void {
  port(ctx)?.dissolve?.(id);
}

/** The victory camera (C9). Returns how long the beat should hold for it (0 without C). */
export function fxVictory(ctx: EventCtx, kind: 'pose' | 'hold'): number {
  if (kind === 'pose') rumbleWin(ctx); // a 'hold' win (FFX-2 Chapter IV: the girls do not pose after Bahamut, research/ffx-vs-ffx2-presentation.md 2.2) is not celebrated, so no pulse either
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
