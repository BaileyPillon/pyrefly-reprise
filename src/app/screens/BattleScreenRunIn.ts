/**
 * **RUN-IN** (FFX-2 only): a girl's physical attack runs to her target and, after the blow, runs home; the camera trucks
 * part of the way with her, and a short smear of afterimages trails her. The `actionMotion` port the presenter's beats
 * call around each action (`src/engine/BattlePresenterMotion.ts`): `strike` between the shot opening and the house
 * strike, `lungeFor` for the strike's shorter lunge, `close` for the run home.
 *
 * Game case (AGENTS.md rule 14, decided from the sources): **FFX-2 only.** `research/ffx2-combat-core.md` section 1
 * (line 264): "a character standing far away spends ~2 s running in, which usually breaks the chain ... model an
 * approach time proportional to distance for `short range` abilities, and zero approach time for `long range`
 * abilities" (single source, Split Infinity G0908); line 266: "`long range` abilities fire from the starting position
 * with no run-in. Gunner, Lady Luck, Alchemist, Trainer and Gun Mage are the long-range dresspheres" (verified, 2
 * sources). So a short-range girl runs in and a long-range one stays where she is (her shot flies instead,
 * `motion/SkillTravel.ts`). **FFX gets none**: no source describes FFX's approach (`research/battle-camera-perspectives.md`
 * A.2, `[absence]`), and Bailey held it for his own yes (D-354). The run's length is ours: the far run-in is "about
 * 2 s" in the sources, this is a short read of it (about 0.35 to 0.5 s each way, by distance).
 *
 * Under BATTLE SPECTACLE only, never under REDUCE MOTION, and never over an open command menu (the FFX-2 menu rule,
 * D-357): the presenter asks the gate (`motion/MotionGate.ts`) before `strike`; this port snaps home instead of
 * running when the gate has closed since (`MotionCtx.still`). Where she stops is `motion/StandOff.ts`: chosen from what
 * the picture shows and outside the target's painted shape, in every FFX-2 chapter. Presentation only: no engine state,
 * no RNG.
 *
 * Round 21 (PR-0364; FFX-2 only): the truck is fitted so no girl on her side leaves the frame (`motion/StandOff.ts` `fitTruck`).
 *
 * Her place is hers while she is out (repair of the check's one major, `motion/PlaceOwner.ts`): the MAX mix's staging keeps a
 * share of x in a figure's position and reads any x it did not write as the stage re-seating her, so a run, which is not a
 * re-seat, left her home one share further along at every attack. `home` is the position she stands at when the run begins (share
 * and all), the stop is exactly where the stand-off planned it, and the run home ends on `home` before the mix is given her back.
 */
import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { STANDARD_DRESSPHERES } from '../../data/ffx2/dresspheres/index.ts';
import type { ActionMotionPort, ActionStartEvent, MotionCtx } from '../../engine/BattlePresenterMotion.ts';
import { motionMs } from '../../engine/BattlePresenterMotion.ts';
import type { Point3 } from '../../engine/BattlePresenterPorts.ts';
import { realLeapBack } from '../../engine/motion/RealBeats.ts';
import { windupMsOf } from '../../engine/motion/RealMotion.ts'; // release 68: the strike is asked for early by the wind-up it will play (the real one in Chapter IV), not the house one // `?curves=real` / `real-snappy`: the run home is the real back-jump (its length and its height)
import { arcFor, profileAfterRun, strikeHoldOver } from '../../engine/motion/CurveBeats.ts';
import { FLOW_LEAD_MAX_SHARE, flowLeadMs, paceRunMs, runEase, runMode } from '../../engine/motion/RunEase.ts'; // MF-04 (`?run=`): a trapezoid run, a leap at rest on both ends, the strike as she brakes, the real pace
import { defaultPaceFactor } from '../../engine/motion/StrikeCurve.ts'; // motion pass (lane "core"): the run's arc is a leap with the new curves on, today's hop otherwise
import { ownPlace } from '../../engine/motion/PlaceOwner.ts';
import { planRun, type RunWorld } from '../../engine/motion/StandOff.ts';
import type { StageMotionPort } from '../../engine/motion/StageMotionPort.ts';
import { motionBeat } from '../../engine/feel/MotionBeats.ts';
import { actorHeft } from '../../engine/feel/MotionHooks.ts'; // `?motionsfx=` (demo chapters, off by default): the whoosh of the run

/** The longest `close` waits for a real strike's hold to end (ms at normal speed): the real chain is under a second; a strike that was replaced never reports its end. */
export const HOLD_WAIT_MAX_MS = 1600;

/** The lunge that still follows the run: she has run in, so only the blow is left (today's house lunge is 1.4 from where she stands). */
export const STRIKE_LUNGE = 0.6;

/**
 * Run times, ms at normal speed, by distance in world units: ours (a short read of the sources' "about 2 s"). A run is 0.32 to
 * 0.47 s in and three quarters of that home, so a whole attack is 0.56 to 0.82 s longer than today's.
 */
export function runMs(distance: number): { in: number; home: number } {
  const t = Math.min(470, Math.max(320, 240 + 36 * distance));
  return { in: Math.round(t), home: Math.round(t * 0.75) };
}

/** Smear strength on the way in and on the way home (0..1). */
const SMEAR = { in: 0.9, home: 0.6 } as const;

interface Run {
  /** MF-04: where she stops (the stand-off's spot), for {@link RunInMotion.reachGap}. */
  spot: Point3;
  /** Release 68: the camera truck the run ends under (the stand-off's), for {@link RunInMotion.reachTruck}. */
  truck: Point3;
  home: Point3;
  /** The figure whose place this run owns, handed back from this very object whatever the stage hands out later. */
  figure: object;
}

/** One planned run, for the debug snapshot and the per-chapter stand-off pass (the last {@link NOTES_KEPT}). */
export interface RunNote {
  actor: CombatantId;
  target: CombatantId;
  home: Point3;
  spot: Point3;
  distance: number;
  why: { score: number; travelPx: number; scale: number; covered: number; inFrontOfFeet: boolean; buried: number };
  /** Her painted box and the target's on screen at the stop (CSS px: x, y, w, h), under the truck she runs with. */
  girlRect: number[] | null;
  targetRect: number[] | null;
  /** `performance.now()` when the run began, ms: to line a run up with the events around it. */
  at: number;
}
const NOTES_KEPT = 60;

/** What the stand-off needs to know about the field for one run: the girl, her target, everyone else, as the stage sees them. */
function worldOf(world: StageMotionPort, ctx: MotionCtx, id: CombatantId, targetId: CombatantId, home: Point3): RunWorld | null {
  const target = world.span(targetId);
  if (!target) return null;
  return {
    home,
    girl: world.span(id),
    target,
    rectOf: (at, truck) => world.rect(id, { at, truck }),
    targetRect: (truck) => world.rect(targetId, { truck }),
    others: ctx.stage
      .staged()
      .filter((o) => o !== id && o !== targetId)
      .map((o) => ({ z: ctx.stage.actor(o)?.position.z ?? 0, rect: (truck) => world.rect(o, { truck }) })),
    // The girls on her side stay in the frame the truck follows her through (round 21, PR-0364: Yuna left it on Rikku's runs).
    keep: ctx.stage
      .staged()
      .filter((o) => o !== id && ctx.stage.sideOf(o) === 'party')
      .map((o) => ({ rect: (truck, rig) => world.rect(o, { truck, ...(rig ? { rig } : {}) }) })),
    // ...on each rig the first hit may cut to as well, the truck still on through the cut (PR-0364: Yuna was out of it at the blow in IV and XIII).
    cuts: world.cutRigs?.(id) ?? [],
    view: world.view(),
  };
}

export class RunInMotion implements ActionMotionPort {
  private readonly runs = new Map<CombatantId, Run>();
  /** The plans made so far, newest last (`window.__pyrefly.battle().battlePresenter.deps.actionMotion.notes`). */
  readonly notes: RunNote[] = [];

  constructor(private readonly state: () => BattleState | null = () => null) {}

  open(): void {}

  /** FFX-2: does this girl's dressphere fire from where she stands (Gunner, Lady Luck, Alchemist, Trainer, Gun Mage)? */
  longRange(id: CombatantId): boolean {
    const cur = this.dressphereOf(id);
    return cur !== undefined && (STANDARD_DRESSPHERES as Record<string, { longRange?: boolean } | undefined>)[cur]?.longRange === true;
  }

  private dressphereOf(id: CombatantId): string | undefined {
    const c = this.state()?.combatants[id] as { dresspheres?: { current?: string } } | undefined;
    return c?.dresspheres?.current;
  }

  /**
   * The strike's lunge reaches for its target (r391-reach) for a fiend (it has no run: its lunge is its whole approach, as in FFX) and for a girl who has RUN IN (the run's
   * stop is staged, not sourced: where it leaves a gap, the lunge from there closes the rest, as in FFX). Not for a girl who has not (a long-range dressphere fires from where she
   * stands, sourced; a menu open suppresses the run by design): her strike must not close the distance.
   */
  reachFor(id: CombatantId): boolean {
    return this.state()?.combatants[id]?.side === 'enemy' || this.runs.has(id);
  }

  /** MF-04: how far along her facing she still has to run to her spot, world units (0 once she is there): the lunge of a strike asked for as she brakes is solved from the spot. */
  reachGap(id: CombatantId): number {
    const run = this.runs.get(id);
    const a = run?.figure as { position?: Point3; facing?: number } | undefined;
    if (!run || !a?.position) return 0;
    return Math.max(0, (run.spot.x - a.position.x) * ((a.facing ?? 1) < 0 ? -1 : 1));
  }

  /**
   * Release 68: the camera truck the run ends under, while she is out. The strike asked for as the run brakes reads the foe through the camera of the blow (the truck the run's tween is still on its way to), as the strike asked for
   * after the run has always done; read part-way, a girl near the camera and a foe far behind it slide by different amounts and the lunge stops about the camera's remaining slide times their parallax (about 20 px) short.
   */
  reachTruck(id: CombatantId): Point3 | undefined {
    return this.runs.get(id)?.truck;
  }

  /** The strike's lunge while she is out: shorter, since she has run in. */
  lungeFor(id: CombatantId): number | undefined {
    return this.runs.has(id) ? STRIKE_LUNGE : undefined;
  }

  async strike(event: ActionStartEvent, ctx: MotionCtx, pose: string): Promise<void> {
    if (pose !== 'attack' || event.command.kind !== 'attack' || ctx.still === true) return;
    const id = event.actorId;
    // A girl in a standard dressphere, on the party's side, short range (a part or a transformation has none of these).
    if (ctx.stage.sideOf(id) !== 'party' || this.dressphereOf(id) === undefined || this.longRange(id) || this.runs.has(id)) return;
    const world = ctx.stage.motion;
    const actor = ctx.stage.actor(id);
    const targetId = (event.targets ?? []).find((t) => ctx.stage.sideOf(t) === 'enemy' && ctx.stage.actor(t));
    if (!world || !actor || !targetId) return;

    const home: Point3 = { x: actor.position.x, y: actor.position.y, z: actor.position.z };
    const w = worldOf(world, ctx, id, targetId, home);
    const plan = w ? planRun(w) : null;
    if (!plan) return; // nothing to plan against (a figure off the field): the strike plays as it does today
    const mode = runMode(); // MF-04: `?run=today` (the default) is all false and every line below plays as it did
    const ms = motionMs(mode.pace ? paceRunMs(plan.distance) : runMs(plan.distance).in, ctx.speed);
    ownPlace(actor, true); // from here to the end of `close`, the MAX mix's staging leaves her x alone (see the header)
    this.runs.set(id, { home, figure: actor, spot: plan.spot, truck: plan.truck });
    const box = (r: { x: number; y: number; w: number; h: number } | null): number[] | null => (r ? [r.x, r.y, r.w, r.h].map(Math.round) : null);
    this.notes.push({ actor: id, target: targetId, home, spot: plan.spot, distance: plan.distance, why: plan.why, girlRect: box(world.rect(id, { at: plan.spot, truck: plan.truck })), targetRect: box(world.rect(targetId, { truck: plan.truck })), at: typeof performance === 'undefined' ? 0 : performance.now() });
    if (this.notes.length > NOTES_KEPT) this.notes.shift();

    // Not on her ready painting (none installed): the strike painting stays off until she is there.
    const readyKey = ctx.stage.paints?.(id, 'ready') === true;
    if (!readyKey) actor.setPose('idle');
    void world.truck(plan.truck.x, plan.truck.y, plan.truck.z, ms);
    world.smear(id, ms * 0.95, SMEAR.in);
    motionBeat({ kind: 'dash', strength: SMEAR.in, heft: actorHeft(actor), ms, atMs: ms * 0.3 }); // the run in: the afterimage's streak has its whoosh
    const arrive = Promise.all([actor.moveTo(plan.spot, ms, runEase(mode)), arcFor(actor, 0.42, ms, mode.smooth)]);
    const after = mode.flow && actor.waitMs ? profileAfterRun(ctx, id) : undefined; // the profile the strike after this run will play: her real one (Chapter IV's default), else the house flow profile
    const lead = after ? Math.min(ms * FLOW_LEAD_MAX_SHARE, flowLeadMs(ctx.speed === 'fast' ? 0.32 : 1, defaultPaceFactor('ffx2'), windupMsOf(after, actor.strikeHeft?.() ?? 0))) : 0; // MF-04: the wind-up is the end of the stop, not a stand after it; release 68: the wind-up that plays, not the house one
    if (lead > 1) await Promise.race([arrive, actor.waitMs!(ms - lead)]);
    else await arrive;
    if (!readyKey) actor.setPose('attack');
  }

  async close(actorId: CombatantId, ctx: MotionCtx): Promise<void> {
    const run = this.runs.get(actorId);
    if (!run) return;
    this.runs.delete(actorId);
    try {
      const actor = ctx.stage.actor(actorId);
      const world = ctx.stage.motion;
      if (!actor) return;
      // Over a menu, under REDUCE MOTION, or if she was knocked out out there, she is simply home again: nothing plays.
      const down = (actor as { pose?: string }).pose === 'ko';
      const back = ctx.still === true || down ? undefined : realLeapBack(ctx, actorId); // the real back-jump: its length and height, else the house run home
      const mode = runMode();
      const away = Math.hypot(actor.position.x - run.home.x, actor.position.z - run.home.z);
      const ms = ctx.still === true || down ? 1 : motionMs(back?.ms ?? (mode.pace ? Math.round(paceRunMs(away) * 0.75) : runMs(away).home), ctx.speed);
      const held = ctx.still === true || down ? undefined : strikeHoldOver(actor); // `?curves=real`: she finishes the real clip's hold at the foe (the strike's `holdEnd`) before she leaps back; capped, a strike that was replaced never ends it
      if (held) await Promise.race([held, ctx.sleep(HOLD_WAIT_MAX_MS)]);
      actor.setPose('idle');
      if (ms > 1) world?.smear(actorId, ms * 0.9, SMEAR.home);
      if (ms > 1) motionBeat({ kind: 'dash', strength: SMEAR.home, heft: actorHeft(actor), ms, atMs: ms * 0.3 }); // and the run home, lighter
      void world?.truck(0, 0, 0, ms);
      await Promise.all([actor.moveTo(run.home, ms, runEase(mode)), ...(ms > 1 ? [arcFor(actor, back?.height ?? 0.2, ms, mode.smooth)] : [])]);
      void world?.truck(0, 0, 0, 1); // never leave the frame off true
    } finally {
      ownPlace(run.figure, false); // home (or gone): the mix's staging has her again, at the place it left her
    }
  }
}
