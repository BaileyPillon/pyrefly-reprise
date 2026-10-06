/**
 * **How far the house strike's lunge carries its fighter** (r391-reach; the presenter's half of `StandReach.ts`; no `three`, no DOM: ports only).
 *
 * `strikeReach` hands the solver (`motion/StandReach.ts`) the painted shapes the stage reports through `stage.motion` (`shape`: the figure's painted box
 * and, read from its painting's alpha, its painted front row by row; `rect` alone where a stage cannot read a painting) and answers with the lunge:
 * `base` where the strike already reaches its target, else the distance at which it does. WHO gets it is the game's call (`lungeDistance`: FFX's party and
 * fiends, FFX-2's fiends and its girls after a RUN-IN; not a long-range girl, who fires from where she stands; not FF7, which runs its own melee): this function is
 * geometry plus the choice of target.
 *
 * Which target: the foe the action names. A fiend's ability can name its target only as it resolves (its `action-start` carries none, over a third of the fiends'
 * physical strikes): the burst being played holds the action's own later events, so the targets of its first blows are the target ({@link blowTargets}); with no burst
 * to read (an ATB charge, whose blows come in a later burst) every figure on the other side is a candidate and the shortest reach rules, so a strike never goes further
 * than the one it could not tell from.
 *
 * Through which camera: the one the blow is SEEN through. The lunge runs under the attacker's own shot (`BattleMoments.actionOpen`), but the first hit hard-cuts to the
 * rig of whoever is struck (`BattleMoments.impact`: an enemy's rig for a fiend, the party's for a party member) and the strike holds at full reach in that shot, so
 * both figures are read through that rig (`StageMotionPort.shape`'s `rig`: the same push the shot holds) and not through the attacker's. The two views differ by the
 * parallax between a fighter near the camera and a foe far behind it: a strike that touches in one view stands tens of pixels short in the other.
 *
 * Which figures stand in its way: those in the attacker's own depth lane (|dz| < `LANE`) that are on the field and shown (a figure a summon has taken off
 * the field, a fiend that has dissolved, answers null from `shape`); the target itself is never an obstacle.
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { ActionMotionPort, ActionStartEvent } from '../BattlePresenterMotion.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import type { BattleStage } from '../BattlePresenterPorts.ts';
import { heldOffStage } from '../SummonStaging.ts';
import type { Shape } from './Silhouette.ts';
import { LANE, reachAlong, type ReachWorld } from './StandReach.ts';

/**
 * The lunge, world units, that carries `event.actorId`'s painted front to its target's: `base` (today's 1.4) to the unit where it already reaches, where the
 * target is above or below its rows, where nothing can be solved against (a stage without the motion port), and in every case the caller leaves alone.
 * Presentation only: no engine state, no RNG, no timing (the lunge keeps its 440 ms and its apex at 0.58). The distance beyond the house lunge rides an eased step
 * (`BattlePresenterActors.reachOffset`), so a long lunge does not jump its first frame; the house part is the old curve to the frame.
 */
export function strikeReach(ctx: { readonly stage: BattleStage }, event: Pick<ActionStartEvent, 'actorId' | 'targets'>, base: number, pose?: string, burst?: Burst): number {
  const stage = ctx.stage;
  const world = stage.motion;
  const from = stage.actor(event.actorId);
  if (!world || !from) return base;
  const id = event.actorId;
  const fiend = stage.sideOf(id) === 'enemy';
  const named = event.targets?.length ? event.targets : blowTargets(burst, id);
  const staged = stage.staged();
  const foes = (named.length ? named : staged).filter((t) => t !== id && stage.actor(t) !== undefined && (stage.sideOf(t) === 'enemy') !== fiend);
  const dir = ((from as { facing?: number }).facing ?? (fiend ? -1 : 1)) < 0 ? -1 : 1;
  const scale = Math.max(0.25, (world.view().w || 1600) / 1600);
  const away = heldOffStage(stage);
  const have = stage.camera.rigNames;
  const cutRig = (target: CombatantId): string | undefined => (stage.sideOf(target) === 'enemy' ? ['enemy', 'action', 'idle'] : ['party', 'action', 'idle']).find((n) => have.includes(n));
  /**
   * `who`'s painted shape, with its feet carried `along` world units along the attacker's facing (the attacker's own lunge); null when it is not shown. The
   * attacker is read in `pose`, the one its blow lands in, which is not the one showing when a wind-up leads (the impact painting, up at the apex).
   */
  const shapeOf = (who: CombatantId, along = 0, rig?: string): Shape | null => {
    const p = stage.actor(who)?.position;
    if (!p) return null;
    const o = { ...(along ? { at: { x: p.x + dir * along, y: p.y, z: p.z } } : {}), ...(pose && who === id ? { pose } : {}), ...(rig ? { rig } : {}) };
    if (world.shape) return world.shape(who, o);
    const rect = world.rect(who, o);
    return rect ? { rect } : null;
  };
  let reach = Number.POSITIVE_INFINITY;
  for (const t of foes) {
    const rig = cutRig(t); // the shot the blow is seen through: the struck figure's rig
    if (!shapeOf(t, 0, rig)) continue; // a foe that is not shown (dissolved, off the field) is nobody's target: it does not hold the others' reach back
    const lane = staged.filter((o) => {
      const p = stage.actor(o)?.position;
      return o !== id && o !== t && !away.has(o) && p !== undefined && Math.abs(p.z - from.position.z) < LANE;
    });
    const w: ReachWorld = { dir, scale, attacker: (along) => shapeOf(id, along, rig), target: () => shapeOf(t, 0, rig), lane: lane.map((o) => () => shapeOf(o, 0, rig)) };
    reach = Math.min(reach, reachAlong(base, w));
  }
  return Number.isFinite(reach) ? reach : base;
}

/** The burst an event is played in (`EventCtx.burst`): taken by the beat before it awaits anything, so an overlapping burst (FFX-2's ATB) cannot swap it. */
export type Burst = NonNullable<EventCtx['burst']>;

/**
 * The targets of the blows `actorId`'s action lands in the burst it plays in: the `damage` and `miss` events after the event in hand, up to the action's own
 * `action-end` (or the actor's next `action-start`), that the actor deals (a counter's blows carry another source). Empty with no burst.
 */
export function blowTargets(burst: Burst | undefined, actorId: CombatantId): CombatantId[] {
  const out: CombatantId[] = [];
  if (!burst) return out;
  for (let i = burst.at + 1; i < burst.events.length; i++) {
    const e = burst.events[i]!;
    if ((e.type === 'action-end' || e.type === 'action-start') && e.actorId === actorId) break;
    if ((e.type === 'damage' || e.type === 'miss') && e.targetId !== actorId && (e.sourceId === undefined || e.sourceId === actorId) && !out.includes(e.targetId)) out.push(e.targetId);
  }
  return out;
}

/** The house lunge, world units (`BattlePresenterBeats.actionStart`): tuned against the stage's own formations. */
export const HOUSE_LUNGE = 1.4;

/**
 * The distance the house strike's lunge carries `event.actorId`: its start (`base`: the house lunge, a counter's shorter 0.6; or the port's own shorter lunge after
 * a run-in, `lungeFor`: only the blow is left), solved against the target ({@link strikeReach}, the attacker read in `pose`: the one its blow lands in) where the game's
 * rules let the lunge reach (`reachFor`), else the start.
 *
 * Game case (AGENTS.md rule 14, CHK-021; decided from `research/*.md`, written in `docs/handoff/r391-reach.md`):
 * - **FFX: yes, party and fiends.** FFX has no run-in (`research/battle-camera-perspectives.md` A.2 `[absence]`; D-354 holds one for Bailey's yes), so the house
 *   lunge is FFX's whole approach and a blow that stops short of its target is a defect (a port-less presenter reaches).
 * - **FFX-2 fiends: held at live's lunge until Bailey decides.** A fiend has no run in either game (its approach is the same lunge) and the sources say nothing either
 *   way, so the lane's "yes" (shared plumbing, CHK-020) waits for his word: `reachFor` answers no for them while `FFX2_FIENDS_REACH` (`BattleScreenRunIn.ts`) is false.
 * - **FFX-2 girls: after her run-in, yes; without one, no.** A short-range dressphere RUNS IN first (sourced: "a character standing far away spends ~2 s running in",
 *   `research/ffx2-combat-core.md` section 1); where she stops is ours (`motion/StandOff.ts`, chosen against the target's painted shape, up to a quarter of the frame of travel),
 *   and where that leaves a gap (Leblanc, Rikku, when Ormi stands far to the right: 170 to 300 px) the lunge from there closes the rest, as in FFX. A long-range dressphere
 *   (Gunner, Lady Luck, Alchemist, Trainer, Gun Mage) fires from where she stands, no run-in at all (sourced, 2 sources), and with a command menu open the run is suppressed by
 *   design: her strike must not close the distance (`reachFor` answers no for her).
 * - **FF7: no** (its port does not answer: it runs its own melee).
 */
export function lungeDistance(ctx: { readonly stage: BattleStage }, event: Pick<ActionStartEvent, 'actorId' | 'targets'>, motion: ActionMotionPort | null | undefined, pose?: string, burst?: Burst, base = HOUSE_LUNGE): number {
  return lungePlan(ctx, event, motion, pose, burst, base).distance;
}

/**
 * {@link lungeDistance} with the part of it that is the house lunge: `house` is the start (the lunge as today), `distance - house` the extra carried to reach. The extra rides
 * the eased step (`PaintedActor.lunge`'s `house`), so a strike that reaches further does not jump further in a frame.
 */
export function lungePlan(ctx: { readonly stage: BattleStage }, event: Pick<ActionStartEvent, 'actorId' | 'targets'>, motion: ActionMotionPort | null | undefined, pose?: string, burst?: Burst, base = HOUSE_LUNGE): { distance: number; house: number } {
  const house = motion?.lungeFor?.(event.actorId) ?? base; // after a run-in only the blow is left: the port's shorter lunge
  const reaches = motion ? motion.reachFor?.(event.actorId) === true : true;
  return { distance: reaches ? strikeReach(ctx, event, house, pose, burst) : house, house };
}
