/**
 * **M1, travel** (opt-motion prototype, `?motion=M1`, never merged to main): a party figure's physical blow runs key
 * to key to the target along an arc with a short smear, and the camera trucks with it, instead of the key swapping in
 * place and the house lunge sliding it 1.4 units.
 *
 * Game case, decided from the sources (`research/ffx2-combat-core.md` section 1, `research/battle-camera-perspectives.md`
 * B.1; AGENTS.md rule 14):
 * - **FFX-2: sourced.** A short-range dressphere "must close distance" and spends about 2 s running in when far; a
 *   long-range one (Gunner, Gun Mage, Alchemist, Lady Luck, Trainer) fires "from starting position, no run-in". So
 *   only a short-range physical blow travels here, a long-range one does not, and nothing plays over an open FFX-2
 *   command menu (the brief's rule, `suppressWhileMenu`).
 * - **FFX: not sourced.** Nothing in `research/` describes FFX's melee approach or its per-move camera: it is `[absence]`
 *   (`battle-camera-perspectives.md` A.2). This option is our own staging there and is labelled so. It plays on an
 *   Overdrive or a plain attack by a figure the engine does not mark long range.
 * Distances and times are our estimate.
 *
 * It rides the `actionMotion` port FF7 already uses (`BattlePresenterMotion.ts`): `strike` runs after the shot has
 * opened and before the house strike; `close` brings the figure home. With the option off (or REDUCE MOTION on) both
 * return at once and the action plays exactly as today. Presentation only: no engine state, no RNG.
 */
import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import type { ActionMotionPort, ActionStartEvent, MotionCtx } from '../../engine/BattlePresenterMotion.ts';
import { motionMs } from '../../engine/BattlePresenterMotion.ts';
import type { ActorHandle, Point3 } from '../../engine/BattlePresenterPorts.ts';
import { odPoseFor } from '../../engine/KeySlots.ts';
import { motionOn } from '../../engine/motion/MotionMode.ts';
import { STANDARD_DRESSPHERES } from '../../data/ffx2/dresspheres/index.ts';

/** The run in and the run home, ms at normal speed (our estimate; FFX-2's far run-in is about 2 s in the sources, ours is a short read of it). */
export const TRAVEL_MS = { in: 430, overdrive: 560, home: 320 } as const;

interface Run {
  home: Point3;
  dir: 1 | -1;
}

export class TravelMotion implements ActionMotionPort {
  readonly suppressWhileMenu = true;
  private readonly runs = new Map<CombatantId, Run>();

  constructor(
    private readonly game: 'ffx' | 'ffx2',
    private readonly state: () => BattleState | null = () => null,
  ) {}

  open(): void {}

  /** FFX-2: does this figure's dressphere fire from where she stands? */
  private longRange(id: CombatantId): boolean {
    if (this.game !== 'ffx2') return false;
    const c = this.state()?.combatants[id] as { dresspheres?: { current?: string } } | undefined;
    const cur = c?.dresspheres?.current;
    return cur !== undefined && (STANDARD_DRESSPHERES as Record<string, { longRange?: boolean } | undefined>)[cur]?.longRange === true;
  }

  async strike(event: ActionStartEvent, ctx: MotionCtx, pose: string): Promise<void> {
    if (!motionOn('M1') || ctx.reducedMotion === true || ctx.speed === 'skip' || pose !== 'attack') return;
    const side = ctx.stage.sideOf(event.actorId);
    if (side !== 'party' && side !== 'aeon') return;
    if (this.longRange(event.actorId)) return; // FFX-2 sourced: long range fires from its place
    const id = event.abilityId ?? (event.command as { id?: string }).id;
    const hasKey = id !== undefined && ctx.stage.paints?.(event.actorId, odPoseFor(id)) === true;
    const actor = ctx.stage.actor(event.actorId);
    const targetId = (event.targets ?? []).find((t) => ctx.stage.sideOf(t) === 'enemy');
    const target = targetId ? ctx.stage.actor(targetId) : undefined;
    if (!actor || !target || this.runs.has(event.actorId)) return;

    const home: Point3 = { x: actor.position.x, y: actor.position.y, z: actor.position.z };
    const dir: 1 | -1 = target.position.x >= home.x ? 1 : -1;
    const overdrive = event.command.kind === 'overdrive';
    const reach = Math.min(2.4, Math.max(1.1, 0.7 + this.heightOf(target) * 0.2));
    const spot: Point3 = { x: target.position.x - dir * (reach + 1.4), y: home.y, z: target.position.z + 0.45 }; // the house lunge (1.4) carries her the rest of the way to `reach`
    const ms = motionMs(overdrive ? TRAVEL_MS.overdrive : TRAVEL_MS.in, ctx.speed);
    this.runs.set(event.actorId, { home, dir });

    // Key to key: the wind-up key on the run, the strike key as she arrives (a painted move key, once installed, is left alone).
    const keys = !hasKey && ctx.stage.paints?.(event.actorId, 'ready') === true;
    if (keys) actor.setPose('ready', { force: true });
    void ctx.stage.truck?.((spot.x - home.x) * 0.55, 0.12, 0, ms);
    actor.smear?.(dir, 0.16, ms * 0.95, overdrive ? 0.75 : 0.55);
    const run = Promise.all([actor.moveTo(spot, ms), actor.hop(overdrive ? 0.9 : 0.42, ms)]);
    if (keys) void ctx.sleep(ms * 0.72).then(() => actor.setPose(pose));
    await run;
    void actor.squash(Math.round(ms * 0.45), 0.6);
  }

  private heightOf(a: ActorHandle): number {
    return Math.max(0.5, a.headPoint().y - a.position.y);
  }

  async close(actorId: CombatantId, ctx: MotionCtx): Promise<void> {
    const run = this.runs.get(actorId);
    if (!run) return;
    this.runs.delete(actorId);
    const actor = ctx.stage.actor(actorId);
    if (!actor) return;
    const ms = motionMs(TRAVEL_MS.home, ctx.speed);
    actor.setPose('idle');
    actor.smear?.(-run.dir, 0.1, ms * 0.9, 0.4);
    void ctx.stage.truck?.(0, 0, 0, ms);
    await Promise.all([actor.moveTo(run.home, ms), actor.hop(0.2, ms)]);
    void ctx.stage.truck?.(0, 0, 0, 1); // a killed tween must not leave the frame off true
  }
}
