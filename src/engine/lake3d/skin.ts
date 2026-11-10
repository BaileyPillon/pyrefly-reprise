/**
 * **The Meshy models on the battle's actors** (the hidden Wendigo chapter's 3D stage; FFX only): the stage (`PaintedStage`) owns the actors and plays every `BattleEvent` onto them through the presenter, exactly as it does in
 * every chapter; this skin finds them where the stage puts them and carries a model on each, with the painted planes switched off. It is the house habit of `../yrp3d/skin.ts` (the hidden 3D Bahamut chapter's models) for the
 * lake's cast: ten bodies and the four aeons of the roster (an actor the skin has no model for, such as an aeon whose file has not come in yet or could not be read, is left as the stage made it: the painting).
 *
 * ## How a model rides an actor
 *
 * The stage names each `PaintedActor` by its combatant id and adds it to the three.js scene the scene's group is mounted in. The skin looks them up there by name every frame (the stage replaces an actor of the same id, so a
 * new object is attached afresh) and parents the model to the actor's `inner` group, where the actor stacks every motion layer: **the lunge, the recoil, the hop, the squash, the shake and the breath are the presenter's own and
 * move the model with them**. What the skin adds is what a flat painting did with a pose name and a shader, done to a model:
 *
 * - **Facing.** The house rule (the party turned toward +x, the enemies toward -x: the lunge runs along x) turned a little toward the lens so faces show (`facingYaw`).
 * - **Motion.** The beats (`./beats.ts`) and the pose the actor shows start the clips (`./model.ts`): an action as it opens, the blow landing, a hit, a fall and a rise, the victory and the low-HP kneel. The Wendigo's arms
 *   go up and down on their two moves' beats (`./clipMap.ts` `stanceChange`). **Sleep** is read from the actor (`PaintedActor.hasStatus`, told by the presenter's status events): a sleeper's arms come down on the spot and it
 *   plays the game's sleep clips, whatever the engine's flag says until the next hit.
 * - **Flash, glow, tint and stone.** The actor's own flash (a hit's white, a heal's green) and its cast glow ride a capped emissive accent; its hurt tint and brightness multiply the colour; a petrified figure goes grey.
 * - **Fade.** The actor's alpha and dissolve fade the model (a defeated Guardian's body fades; the Wendigo's stays).
 * - **The epilogue's fall.** `sinkOf` (set by the stage) drops the party through the breaking ice.
 *
 * `tests/unit/lake3d/skin.test.ts` pins that the actor's private parts are still there. Game case: FFX only.
 */

import { Color, Group, type Object3D } from 'three';
import { PaintedActor } from '../PaintedActor.ts';
import { paceRate } from '../pace.ts';
import { LAKE_AEONS, LAKE_CAST, LAKE_ENEMIES, type LakeId } from '../../data/ffx/lake-models.ts';
import type { BeatListener } from './beats.ts';
import type { LakeModels } from './load.ts';
import { ACCENT, type LakeModel } from './model.ts';
import { stanceChange } from './clipMap.ts';

/** What a `PaintedActor` keeps private and the skin needs: the switch of its painted figure, its plane meshes, its motion group and its uniform cells. */
export interface PaintedInternals {
  showFigure: boolean;
  slots: ReadonlyArray<{ mesh: Object3D }>;
  inner: Group;
  u: {
    flashAmount: { value: number };
    flashColor: { value: Color };
    tint: { value: Color };
    brightness: { value: number };
    desaturate: { value: number };
  };
}

/** The pose `actor` was last asked for (`PaintedActor.requested`, private): `critical` for a figure at low HP, even when it has no painting for it. */
export function requestedPose(actor: PaintedActor): string {
  const r = (actor as unknown as { requested?: unknown }).requested;
  return typeof r === 'string' ? r : '';
}

/** The private parts of `actor`, or null when `PaintedActor` no longer has them (the skin then leaves that actor painted). */
export function internalsOf(actor: PaintedActor): PaintedInternals | null {
  const a = actor as unknown as Partial<PaintedInternals>;
  const u = a.u;
  const ok =
    a.inner instanceof Group &&
    Array.isArray(a.slots) &&
    typeof a.showFigure === 'boolean' &&
    !!u &&
    typeof u.flashAmount?.value === 'number' &&
    u.flashColor?.value instanceof Color &&
    u.tint?.value instanceof Color &&
    typeof u.brightness?.value === 'number' &&
    typeof u.desaturate?.value === 'number';
  return ok ? (a as PaintedInternals) : null;
}

/** Switch the actor's painted planes off for good: the figure rule, and the planes themselves. Returns false when the actor's private parts are not as expected. */
export function hidePaintedFigure(actor: PaintedActor): boolean {
  const parts = internalsOf(actor);
  if (!parts) return false;
  parts.showFigure = false;
  for (const slot of parts.slots) slot.mesh.visible = false;
  return true;
}

/** How far each side's bodies turn toward the lens from side-on, radians: the party's faces and the Wendigo's must show. */
export const TURN_TO_LENS: Readonly<Record<string, number>> = { party: 0.55, wendigo: 0.8, guardian: 0.6, aeon: 0.45 };

/** The yaw a model of `id` is turned to (radians about +Y, 0 facing +Z): the party toward +x, the enemies toward -x, each a little toward the lens. */
export function facingYaw(id: LakeId): number {
  if (id === 'wendigo') return -Math.PI / 2 + TURN_TO_LENS['wendigo']!;
  if ((LAKE_ENEMIES as readonly string[]).includes(id)) return -Math.PI / 2 + TURN_TO_LENS['guardian']!;
  if ((LAKE_AEONS as readonly string[]).includes(id)) return Math.PI / 2 - TURN_TO_LENS['aeon']!; // an aeon fights on the party's side
  return Math.PI / 2 - TURN_TO_LENS['party']!;
}

/** A cast's glow colour by who casts: the party's cold white, the Wendigo's ice blue, the Guardians' old gold, an aeon's pale light. */
const GLOW_COLOUR: Readonly<Record<'party' | 'wendigo' | 'guardian' | 'aeon', number>> = { party: 0xdcefff, wendigo: 0x8fd0ff, guardian: 0xffe2a6, aeon: 0xeaf4ff };
const whoOf = (id: LakeId): 'party' | 'wendigo' | 'guardian' | 'aeon' =>
  id === 'wendigo' ? 'wendigo' : (LAKE_ENEMIES as readonly string[]).includes(id) ? 'guardian' : (LAKE_AEONS as readonly string[]).includes(id) ? 'aeon' : 'party';

/** How many opened actions the skin remembers. */
export const BEAT_LOG = 200;
const LIE_TAU = 0.2;
const GLOW_TAU = 0.18;
const STONE = new Color(0.6, 0.6, 0.66);
const approach = (from: number, to: number, tau: number, dt: number): number => from + (to - from) * (dt > 0 ? 1 - Math.exp(-dt / tau) : 1);
/** A cast's glow swells over its first moments and holds: 0 at the start to 1 after 0.6 s. */
const castGlow = (t: number): number => Math.min(1, Math.max(0, t / 0.6));

/** One model on one actor. */
interface Bound {
  readonly id: LakeId;
  readonly actor: PaintedActor;
  readonly model: LakeModel;
  readonly parts: PaintedInternals;
  lie: number;
  glow: number;
  castAt: number | null;
  castHold: boolean;
}

export interface LakeSkinOptions {
  /** The scene's group: the actors are found among the children of the scene it is mounted in. */
  readonly host: Object3D;
  /** The loaded models (an id with none leaves that figure painted). */
  readonly models: LakeModels;
}

export class LakeSkin {
  private readonly bound = new Map<LakeId, Bound>();
  private readonly colour = new Color();
  private readonly emissive = new Color();
  private clock = 0;
  /** The epilogue's fall for the party, metres down and a tilt in radians (set by the stage each frame; 0 and 0 outside the epilogue). */
  sinkOf: (id: LakeId) => { down: number; tilt: number } = () => ({ down: 0, tilt: 0 });
  /** True from the moment the last foe has fallen (the win and the ice break, `./director.ts`): every standing party member plays its victory pose. */
  celebrating = false;

  constructor(private readonly opts: LakeSkinOptions) {}

  /** The actions the presenter has opened, as the skin was told (the debug handle's and the capture tool's read: the moment each began on the screen), newest last, at most {@link BEAT_LOG}. */
  readonly beats: Array<{ at: number; actor: string; kind: string; ability?: string }> = [];

  /** What the shot director's beats tell the skin (`./beats.ts`, wired by the scene). */
  readonly listener: BeatListener = {
    open: (actorId, kind, lead, abilityId) => {
      this.beats.push({ at: Date.now(), actor: actorId, kind, ...(abilityId === undefined ? {} : { ability: abilityId }) });
      if (this.beats.length > BEAT_LOG) this.beats.shift();
      const b = this.bound.get(actorId as LakeId);
      if (!b) return;
      b.castHold = kind === 'cast';
      const stance = stanceChange(b.id, abilityId);
      if (stance !== null) b.model.setStance(stance);
      else b.model.noteOpen(kind, lead, paceRate('action'), abilityId);
    },
    windup: (actorId, kind, lead, abilityId) => this.bound.get(actorId as LakeId)?.model.windup(kind, lead, abilityId) ?? 0,
    impact: (actorId) => this.bound.get(actorId as LakeId)?.model.noteImpact(),
    close: (actorId) => {
      const b = this.bound.get(actorId as LakeId);
      if (!b) return;
      b.castHold = false;
      b.model.noteClose();
    },
  };

  /** The ids that carry a model now, and whether it is the id's own file or the neutral capsule (the debug view's and the tests' read). */
  get carrying(): Record<string, 'own' | 'capsule'> {
    return Object.fromEntries([...this.bound].map(([id]) => [id, this.opts.models.sources.get(id) ?? 'capsule']));
  }

  /** The actor and the model of an id (a test's read), or null when it is not attached. */
  get(id: LakeId): { actor: PaintedActor; model: LakeModel } | null {
    const b = this.bound.get(id);
    return b ? { actor: b.actor, model: b.model } : null;
  }

  /** Once a frame, after the stage's own work: attach to any actor that is new and make every model follow its actor. Nothing to do before the host is mounted in a scene. `dt` is the field's seconds. */
  update(dt = 0): void {
    this.clock += dt;
    const scene = this.opts.host.parent;
    if (!scene) return;
    for (const id of LAKE_CAST) {
      const model = this.opts.models.models.get(id);
      if (!model) continue;
      const actor = scene.children.find((c): c is PaintedActor => c instanceof PaintedActor && c.name === id);
      if (!actor) continue;
      const have = this.bound.get(id);
      if (!have || have.actor !== actor) this.attach(id, actor, model);
      const now = this.bound.get(id);
      if (now) this.follow(now, dt);
    }
  }

  private attach(id: LakeId, actor: PaintedActor, model: LakeModel): void {
    this.bound.get(id)?.model.root.removeFromParent();
    const parts = internalsOf(actor);
    if (!parts) {
      this.bound.delete(id);
      return;
    }
    actor.setInterimYaw(0); // a flat painting's turn toward the other side: off for a model, which has its own
    hidePaintedFigure(actor);
    model.setYaw(facingYaw(id));
    model.fitTo(actor.height);
    parts.inner.add(model.root);
    this.bound.set(id, { id, actor, model, parts, lie: actor.lifeState === 'down' && !model.playsKo ? 1 : 0, glow: 0, castAt: null, castHold: false });
  }

  private follow(b: Bound, dt: number): void {
    const { actor, model, parts } = b;
    model.fitTo(actor.height); // the stage may re-size a figure after it is staged

    const dissolve = Number.isFinite(actor.dissolveLevel) ? Math.min(1, Math.max(0, actor.dissolveLevel)) : 0;
    const alpha = actor.visible ? actor.alpha * (1 - dissolve) : 0;
    model.root.visible = alpha > 0.002;

    b.lie = approach(b.lie, actor.lifeState === 'down' && !model.playsKo ? 1 : 0, LIE_TAU, dt);
    if (b.lie < 0.002) b.lie = 0;
    model.setLie(b.lie, actor.facingDir);
    const sink = this.sinkOf(b.id);
    model.setSink(sink.down, sink.tilt);

    const life = actor.lifeState;
    const celebrate = this.celebrating && whoOf(b.id) === 'party' && life !== 'down'; // the win: the party poses on the breaking ice, a beat before the presenter's own victory pose
    const pose = celebrate ? 'victory' : life === 'hurt' || life === 'victory' ? life : actor.pose;
    const casting = pose === 'cast' || b.castHold;
    if (casting) {
      b.castAt ??= this.clock;
      b.glow = approach(b.glow, castGlow(this.clock - b.castAt), GLOW_TAU, dt);
    } else {
      b.castAt = null;
      b.glow = approach(b.glow, 0, GLOW_TAU, dt);
    }

    const u = parts.u;
    this.colour.copy(u.tint.value).multiplyScalar(u.brightness.value);
    if (u.desaturate.value > 0.001) this.colour.lerp(STONE, Math.min(1, u.desaturate.value));
    const cap = whoOf(b.id) === 'party' ? 'party' : 'boss';
    const flash = Math.min(1, Math.max(0, u.flashAmount.value)) * ACCENT.flash[cap];
    const glow = b.glow * ACCENT.glow[cap];
    let amount = 0;
    if (flash >= glow) {
      this.emissive.copy(u.flashColor.value);
      amount = flash;
    } else {
      this.emissive.setHex(GLOW_COLOUR[whoOf(b.id)]);
      amount = glow;
    }
    model.setChannels({ colour: this.colour, emissive: this.emissive, amount, opacity: alpha });

    model.noteSleep((actor as unknown as { hasStatus?: (s: string) => boolean }).hasStatus?.('sleep') === true); // Sleep brings the arms down on the spot and plays the sleep clips
    const still = (actor as unknown as { still?: () => boolean }).still?.() === true; // REDUCE MOTION stills the idle
    const down = actor.lifeState === 'down';
    const low = !down && (requestedPose(actor) === 'critical' || actor.pose === 'critical');
    model.notePose(pose, down, low, paceRate('action'));
    const stone = u.desaturate.value > 0.5; // a petrified figure stands still
    model.update(dt, still || stone || (down && !model.playsKo));
  }

  dispose(): void {
    for (const b of this.bound.values()) b.model.root.removeFromParent();
    this.bound.clear();
    this.opts.models.dispose();
  }
}
