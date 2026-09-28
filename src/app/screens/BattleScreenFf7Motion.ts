/**
 * **FF7's action motion** (FF7 only): the `actionMotion` port the presenter's
 * beats call around each action (`src/engine/BattlePresenterMotion.ts`).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Built only for a chapter whose
 * game is `'ff7'` (`BattleScreenGameDeps.ts`); FFX and FFX-2 get no motion port.
 *
 * On whose word: Bailey, 2026-09-27, "I'll go with all of your recommendations"
 * (D-244: B1 painted attack poses with a hit flash and knock-back, D1 win poses
 * then a hold in silence, G1's pan up; D-259 the Film paintings; D-262 sides
 * switched). What it does:
 *
 * - **B1, the painted keys.** Cloud (the Buster Sword is not Long Range) runs
 *   to a strike point just in front of Guard Scorpion's rifles in his wind-up
 *   pose, strikes there (`attack`, the strike painting), holds the
 *   follow-through after the blow, and runs back. Braver is "a jump upwards
 *   followed by a downward slash" (FF Wiki "Braver (Final Fantasy VII)", revid
 *   3921199): the same run, then a leap, the strike on the way down. Barret
 *   (Gatling Gun, Long Range, gs §8.3) aims and fires from his spot; the muzzle
 *   flash is drawn by code (`spellfx/ff7`). A caster raises Cloud's sword or
 *   Barret's free hand. The white hit flash and the knock-back land with the
 *   blow (`battleFf7Fx.ts`), and the boss's recoil painting is its `hurt`.
 * - **The boss's physical moves:** Rifle kicks the body back, Scorpion Tail
 *   lunges, Tail Laser braces; Search Scope starts its lock-on effect.
 * - **D1** (FF Wiki "Final Fantasy VII victory poses"): Cloud "pumps his fist
 *   twice, spins his sword in one hand, places it on his back"; Barret "squats,
 *   stands and punches the air with his normal hand, looping"; then a hold in
 *   silence. A KO'd member stays down.
 * - **G1:** the camera pans up over the fallen party (FF Wiki "Game Over
 *   (term)", revid 4032692), then the Game Over screen (`ui/ff7/Ff7GameOver.ts`).
 *
 * Every distance and timing is **our estimate**; no research file sources animation.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import type { Ff7PartyBuild } from '../../battle/common/types-ff7.ts';
import type { ActorHandle } from '../../engine/BattlePresenterPorts.ts';
import { motionMs, type ActionMotionPort, type ActionStartEvent, type MotionCtx } from '../../engine/BattlePresenterMotion.ts';
import { FF7_ABILITIES } from '../../data/ff7/abilities.ts';
import { viewportAspect } from '../../scenes/cavern-stolen-fayth-rigs.ts';
import { SECTOR1_HEIGHTS, sector1Layout, strikeSpot, type Sector1Layout } from '../../scenes/sector1-reactor-staging.ts';

/** The run to the strike point and the run back, ms at normal speed. Our estimate. */
export const FF7_RUN_MS = 460;
export const FF7_RUN_BACK_MS = 400;
/** B1's holds, ms: the wind-up at the strike point, the follow-through after the blow, Barret's aim (Big Shot's charge). */
export const FF7_KEYS_MS = { windUp: 140, follow: 240, aim: 260, charge: 620, leap: 560 } as const;
/** D1: the hold in silence after the win poses, ms. */
export const FF7_VICTORY_HOLD_MS = 2500;
/** G1: the pan up, ms, and the beat it holds there. */
export const FF7_GAME_OVER_PAN_MS = 2400;
export const FF7_GAME_OVER_HOLD_MS = 500;

/** Kept for the old tests' vocabulary: the strike point is now in front of the rifles (`strikeSpot`). */
export const FF7_REACH_PER_HEIGHT = 1.22;
/** The strike point stands this much nearer the camera than the target, so the attacker is drawn in front of it. */
export const FF7_STRIKE_DZ = 0.5;

/** The boss's own moves by ability: a signed lunge distance (negative = back) and its length. Our estimate. */
export const FF7_ENEMY_MOVES: Readonly<Record<string, { distance: number; ms: number }>> = {
  rifle: { distance: -0.35, ms: 300 },
  'scorpion-tail': { distance: 1.1, ms: 440 },
  'tail-laser': { distance: -0.5, ms: 520 },
};

/** Whether the action is a physical blow (the FF7 ability's formula). */
export function ff7PhysicalAction(abilityId: string | undefined): boolean {
  return abilityId !== undefined && FF7_ABILITIES[abilityId]?.formula === 'physical';
}

/** The pose a caster raises: Cloud's sword, Barret's free hand (his right arm is the gun). */
const CAST_POSE: Readonly<Record<string, string>> = { cloud: 'windup', barret: 'punch' };

type Wait = (ms: number) => Promise<void>;

export class Ff7ActionMotion implements ActionMotionPort {
  private readonly home = new Map<CombatantId, { x: number; y: number; z: number }>();
  /** Who is mid-action with which keys, so `close` knows what to undo. */
  private readonly acting = new Map<CombatantId, 'melee' | 'gun' | 'cast'>();

  constructor(
    /** Party members who run to strike: their weapon is not Long Range. */
    private readonly runners: ReadonlySet<CombatantId>,
    /** The layout the scene was built for (desk or upright phone). */
    private readonly layoutOf: () => Sector1Layout = () => sector1Layout(viewportAspect()),
    /** The live state, for who still stands at the victory (a KO'd member stays down). */
    private readonly state: () => BattleState | null = () => null,
  ) {}

  /** Members of `build` whose weapon is not Long Range. */
  static forBuild(build: Ff7PartyBuild, state?: () => BattleState | null): Ff7ActionMotion {
    const runners = new Set(build.members.filter((m) => m.weapon.longRange !== true).map((m) => m.id));
    return new Ff7ActionMotion(runners, undefined, state);
  }

  ownsWindUp(event: ActionStartEvent): boolean {
    return this.acting.get(event.actorId) === 'melee' || this.acting.get(event.actorId) === 'gun';
  }

  async open(event: ActionStartEvent, ctx: MotionCtx): Promise<void> {
    const actor = ctx.stage.actor(event.actorId);
    if (!actor) return;
    const side = ctx.stage.sideOf(event.actorId);
    const wait: Wait = (ms) => ctx.sleep(ms);
    if (side === 'enemy') return this.enemy(event, actor, ctx);
    if (side !== 'party') return;
    const physical = ff7PhysicalAction(event.abilityId ?? (event.command.kind === 'attack' ? 'attack' : undefined));
    if (!physical) {
      const cast = event.command.kind === 'ability' || event.command.kind === 'limit' ? CAST_POSE[event.actorId] : undefined;
      if (cast) {
        this.acting.set(event.actorId, 'cast');
        actor.setPose(cast, { force: true });
      }
      return;
    }
    if (!this.runners.has(event.actorId)) {
      // Long Range: aim, then fire from the spot (Big Shot charges its fireball first).
      this.acting.set(event.actorId, 'gun');
      actor.setPose('aim', { force: true });
      await wait(event.abilityId === 'big-shot' ? FF7_KEYS_MS.charge : FF7_KEYS_MS.aim);
      actor.setPose('attack', { force: true });
      return;
    }
    const target = event.targets.find((id) => ctx.stage.sideOf(id) === 'enemy');
    if (!target || !ctx.stage.actor(target)) return;
    this.acting.set(event.actorId, 'melee');
    this.home.set(event.actorId, { x: actor.position.x, y: actor.position.y, z: actor.position.z });
    actor.setPose('windup', { force: true });
    const [x, y, z] = strikeSpot(this.layoutOf());
    await actor.moveTo({ x, y, z }, motionMs(FF7_RUN_MS, ctx.speed));
    if (event.abilityId === 'braver') {
      // The leap, and the slash on the way down.
      const leap = actor.hop(1.2, motionMs(FF7_KEYS_MS.leap, ctx.speed));
      await wait(FF7_KEYS_MS.leap * 0.45);
      actor.setPose('attack', { force: true });
      await leap;
      return;
    }
    await wait(FF7_KEYS_MS.windUp);
    actor.setPose('attack', { force: true });
    void actor.lunge(0.35, motionMs(260, ctx.speed));
  }

  private async enemy(event: ActionStartEvent, actor: ActorHandle, ctx: MotionCtx): Promise<void> {
    if (event.abilityId === 'search-scope') {
      // The lock-on has no damage to land, so it starts its own effect (a red sight on the target).
      const target = event.targets[0];
      if (target) ctx.stage.vfx.land?.(target, { abilityId: 'search-scope', targets: event.targets, sourceId: event.actorId });
      return;
    }
    const move = FF7_ENEMY_MOVES[event.abilityId ?? ''];
    if (move) await actor.lunge(move.distance, motionMs(move.ms, ctx.speed));
  }

  async close(actorId: CombatantId, ctx: MotionCtx): Promise<void> {
    const kind = this.acting.get(actorId);
    this.acting.delete(actorId);
    const actor = ctx.stage.actor(actorId);
    if (!actor || !kind) return;
    if (kind === 'melee') {
      actor.setPose('follow', { force: true });
      await ctx.sleep(FF7_KEYS_MS.follow);
      actor.setPose('idle', { force: true });
      const home = this.home.get(actorId);
      this.home.delete(actorId);
      if (home) await actor.moveTo(home, motionMs(FF7_RUN_BACK_MS, ctx.speed));
      return;
    }
    if (kind === 'gun') {
      actor.setPose('aim', { force: true });
      await ctx.sleep(160);
    }
  }

  /** Whether `id` is away from home mid-action (tests, the harness). */
  away(id: CombatantId): boolean {
    return this.home.has(id);
  }

  /** D1: the win poses, then a hold in silence. */
  async victory(ctx: MotionCtx): Promise<void> {
    const up = (id: CombatantId): boolean => {
      const c = this.state()?.combatants[id];
      return c ? c.alive && !c.removed : true;
    };
    const party = ctx.stage.staged().filter((id) => ctx.stage.sideOf(id) === 'party' && up(id));
    const loop = { on: true };
    const moves = party.map((id) => {
      const a = ctx.stage.actor(id);
      if (!a) return Promise.resolve();
      return id === 'barret' ? barretWins(a, ctx, loop) : cloudWins(a, ctx);
    });
    await Promise.all([...moves.filter((_, i) => party[i] !== 'barret'), ctx.sleep(2600)]);
    await ctx.sleep(FF7_VICTORY_HOLD_MS);
    loop.on = false;
  }

  /** G1: the pan up over the fallen party. */
  async defeat(ctx: MotionCtx): Promise<void> {
    const cam = (ctx.stage.camera as { unheld?: () => MotionCtx['stage']['camera'] }).unheld?.();
    if (!cam) return;
    // The band sinks away so the fallen party stays in the frame (the FF7 HUD root; `ff7-hud-look.css`).
    if (typeof document !== 'undefined') document.querySelector('.ff7hud')?.setAttribute('data-ff7-gameover', '');
    // The fallen party lies on the floor (no KO painting yet: the hurt painting, laid down).
    for (const id of ctx.stage.staged()) {
      const a = ctx.stage.sideOf(id) === 'party' ? (ctx.stage.actor(id) as unknown as { lieDown?: (ms: number) => Promise<void> } | undefined) : undefined;
      void a?.lieDown?.(motionMs(520, ctx.speed));
    }
    await cam.moveTo('ff7-gameover', motionMs(FF7_GAME_OVER_PAN_MS, ctx.speed));
    await ctx.sleep(FF7_GAME_OVER_HOLD_MS);
  }
}

/** Cloud: the fist pumped twice, the one-hand sword spin, the sword onto his back (held). */
async function cloudWins(a: ActorHandle, ctx: MotionCtx): Promise<void> {
  a.setPose('victory', { force: true });
  for (let i = 0; i < 2; i++) {
    await a.hop(0.07, motionMs(240, ctx.speed));
    await ctx.sleep(90);
  }
  a.setPose('spin', { force: true });
  void a.squash(motionMs(300, ctx.speed), 0.2);
  await ctx.sleep(760);
  a.setPose('back', { force: true });
  await ctx.sleep(300);
}

/** Barret: squat, stand, punch the air with his normal hand, looping until the hold ends. */
async function barretWins(a: ActorHandle, ctx: MotionCtx, loop: { on: boolean }): Promise<void> {
  for (let i = 0; i < 8 && loop.on; i++) {
    a.setPose('victory', { force: true });
    await ctx.sleep(560);
    if (!loop.on) break;
    a.setPose('idle', { force: true });
    await ctx.sleep(260);
    a.setPose('punch', { force: true });
    await a.hop(0.05, motionMs(260, ctx.speed));
    await ctx.sleep(1100);
  }
  a.setPose('punch', { force: true });
}

/** The target's world height (the scene's own heights), for the tests. */
export function ff7HeightOf(id: CombatantId): number {
  return (SECTOR1_HEIGHTS as Record<string, number>)[id] ?? 2;
}
