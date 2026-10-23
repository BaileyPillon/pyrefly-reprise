/**
 * **The real models on the battle's actors** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): the stage (`PaintedStage`) owns the actors and plays every `BattleEvent` onto them through the presenter, exactly as it does
 * in Chapter IV; this skin finds them where the stage puts them and carries a model on each, with the painted planes switched off. It is the house habit of `engine/ffx3d/ffxSkin.ts` (the hidden Fayth chapter's
 * models), for a softly shaded model whose own motions play.
 *
 * ## How a model rides an actor
 *
 * The stage names each `PaintedActor` by its combatant id and adds it to the three.js scene the scene's group is mounted in. The skin looks them up there by name every frame (the stage replaces an actor of the same
 * id, so a new object is attached afresh) and parents the model to the actor's `inner` group, where the actor stacks every motion layer (`PaintedActor.update`): **the lunge, the recoil, the hop, the squash, the shake,
 * the breath and the sway are the presenter's own and move the model with them**, along the body's facing (the scene's `sideFacing`: the party toward -x, Bahamut toward +x). What the skin adds is what a flat painting
 * did with a pose name and a shader, done to a model:
 *
 * - **Facing.** The model is turned to the three-quarter yaw of `./layout.ts` (the actor's interim yaw is off: that turn is for flat paintings).
 * - **Flash.** The actor's own flash (a hit's white, a heal's green, a revive's blue: `PaintedActor.flash`) is read off its uniform cells and drives the model's emissive, as a capped rim accent (`./rim.ts`), never a flat tint of the body.
 * - **Motions.** The beats (`./beats.ts`) and the pose the actor shows start the game's own clips (`./clips.ts`): an attack, a cast or an item as it opens and ends, the blow landing, a hit, a fall and a rise, the victory, and the
 *   low-HP kneel when the rest pose is `critical` (the battle screen's `restPoses`, below a third of the HP in FFX-2). A model with a fall clip of its own is not tipped over as well.
 * - **Cast glow.** While the actor holds the `cast` pose a glow swells on the model (`castGlow`): warm for the girls, Bahamut's violet for him.
 * - **Tint and stone.** The actor's hurt tint and brightness multiply the model's colour; a petrified figure goes grey.
 * - **KO.** A downed figure (`lifeState` 'down') plays its fall and stays down; a revive plays the rise. A model with no fall clip (a capsule, the AI Bahamut) tips onto its back about its feet instead.
 * - **Fade.** The actor's alpha and dissolve (a sent fiend comes apart) fade the model and its ink.
 * - **Size.** The model is fitted to the actor's world height, which the stage solves from the scene's heights; if the stage re-sizes the figure, the model is refitted.
 *
 * Every figure of the cast carries a model (its own file, or the neutral capsule where the file is missing); an actor the skin cannot take (its private parts changed) is left as the stage made it. The painted planes' private switches are reached the way `ffxSkin.ts` reaches them, and
 * `tests/unit/yrp3d/skin.test.ts` pins that they are still there. Game case: FFX-2 only.
 */

import { Color, Group, type Object3D } from 'three';
import { PaintedActor } from '../PaintedActor.ts';
import { castGlow, yawFor, YRP_BOSS_ID, YRP_CAST, type YrpId } from './layout.ts';
import type { BeatListener } from './beats.ts';
import type { YrpModels } from './load.ts';
import type { YrpModel } from './model.ts';
import { paceRate } from '../pace.ts';
import { ACCENT } from './rim.ts';

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

/** The pose `actor` was last asked for (`PaintedActor.requested`, private): `critical` for a figure at low HP, even when it has no painting for it and shows the idle. */
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

/** A hit's flash is white, the girls' cast glow warm, Bahamut's his possession violet (the stage's boss pool, `scenes/bevelle-underground.ts`). */
const GLOW_COLOUR: Readonly<Record<'party' | 'boss', number>> = { party: 0xffe2a6, boss: 0xb468ff };
/** The share of full emissive the flash and the glow reach is `ACCENT` (`./rim.ts`): a rim accent, capped low, so a hit or a cast reads without turning the boss into a flat salmon silhouette or the girls to white. */
/** Seconds a downed body takes to tip, and a glow to fade. */
const LIE_TAU = 0.2;
const GLOW_TAU = 0.18;
const ACT_TAU = 0.25;
const STONE = new Color(0.6, 0.6, 0.64);

const approach = (from: number, to: number, tau: number, dt: number): number => from + (to - from) * (dt > 0 ? 1 - Math.exp(-dt / tau) : 1);

/** One model on one actor. */
interface Bound {
  readonly id: YrpId;
  readonly actor: PaintedActor;
  readonly model: YrpModel;
  readonly parts: PaintedInternals;
  lie: number;
  glow: number;
  castAt: number | null;
  /** How much the figure is acting, for a model that flaps (the AI Bahamut's wings). */
  act: number;
  /** A cast is open (the beat), so the glow holds whatever painting the actor shows. */
  castHold: boolean;
}

export interface YrpSkinOptions {
  /** The scene's group: the actors are found among the children of the scene it is mounted in. */
  readonly host: Object3D;
  /** The loaded models (by id; a missing id leaves that figure painted). */
  readonly models: YrpModels;
}

export class YrpSkin {
  private readonly bound = new Map<YrpId, Bound>();
  private readonly colour = new Color();
  private readonly emissive = new Color();
  private clock = 0;

  constructor(private readonly opts: YrpSkinOptions) {}

  /**
   * What the shot director's beats tell the skin (`./beats.ts`, wired by the scene): an attack or a cast opening starts that clip on the figure that does it, a blow landing puts the attack's strike on it. The speed of a
   * one-shot follows the pacing option.
   */
  readonly listener: BeatListener = {
    open: (actorId, kind, lead) => {
      const b = this.bound.get(actorId as YrpId);
      if (!b) return;
      b.castHold = kind === 'cast'; // the glow follows the cast the beat announced, whatever painting the actor shows
      b.model.noteOpen(kind, lead, paceRate('action'));
    },
    windup: (actorId, kind, lead) => this.bound.get(actorId as YrpId)?.model.windup(kind, lead) ?? 0,
    impact: (actorId) => this.bound.get(actorId as YrpId)?.model.noteImpact(),
    close: (actorId) => {
      const b = this.bound.get(actorId as YrpId);
      if (!b) return;
      b.castHold = false;
      b.model.noteClose();
    },
  };

  /** The ids that carry a model now, and whether it is the id's own file or the neutral capsule (the debug view's and the tests' read). */
  get carrying(): Record<string, 'own' | 'capsule'> {
    return Object.fromEntries([...this.bound].map(([id, b]) => [id, b.model.source]));
  }

  /** The actor and the model of an id (a test's read), or null when it is not attached. */
  get(id: YrpId): { actor: PaintedActor; model: YrpModel } | null {
    const b = this.bound.get(id);
    return b ? { actor: b.actor, model: b.model } : null;
  }

  /** Once a frame, after the stage's own work: attach to any actor that is new and make every model follow its actor. Nothing to do before the host is mounted in a scene. `dt` is the field's seconds. */
  update(dt = 0): void {
    this.clock += dt;
    const scene = this.opts.host.parent;
    if (!scene) return;
    for (const id of YRP_CAST) {
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

  private attach(id: YrpId, actor: PaintedActor, model: YrpModel): void {
    this.bound.get(id)?.model.root.removeFromParent();
    const parts = internalsOf(actor);
    if (!parts) {
      this.bound.delete(id);
      return;
    }
    actor.setInterimYaw(0); // a flat painting's turn toward the other side: off for a model, which has its own
    hidePaintedFigure(actor);
    model.setYaw(yawFor(id));
    model.fitTo(actor.height);
    parts.inner.add(model.root);
    this.bound.set(id, { id, actor, model, parts, lie: actor.lifeState === 'down' && !model.playsKo ? 1 : 0, glow: 0, castAt: null, act: 0, castHold: false });
  }

  private follow(b: Bound, dt: number): void {
    const { actor, model, parts } = b;
    model.fitTo(actor.height); // the stage may re-size a figure after it is staged

    // fade: the actor's alpha, and the painted figure's dissolve (a sent fiend comes apart)
    const dissolve = Number.isFinite(actor.dissolveLevel) ? Math.min(1, Math.max(0, actor.dissolveLevel)) : 0;
    const alpha = actor.visible ? actor.alpha * (1 - dissolve) : 0;
    model.root.visible = alpha > 0.002;

    // KO: a model with no fall of its own tips onto its back and stays; a revive stands it up (a model with a fall clip plays it instead: `notePose` below)
    b.lie = approach(b.lie, actor.lifeState === 'down' && !model.playsKo ? 1 : 0, LIE_TAU, dt);
    if (b.lie < 0.002) b.lie = 0;
    model.setLie(b.lie, actor.facingDir);

    // what the actor is doing: the requested pose (the life layer's state, so a figure with no painting for it still reads as hurt or victorious), else the pose shown
    const life = actor.lifeState;
    const pose = life === 'hurt' || life === 'victory' ? life : actor.pose;
    const casting = pose === 'cast' || b.castHold;

    // glow: a cast swells one; anything else lets it go
    if (casting) {
      b.castAt ??= this.clock;
      b.glow = approach(b.glow, Math.max(0, Math.min(1, castGlow(this.clock - b.castAt))), GLOW_TAU, dt);
    } else {
      b.castAt = null;
      b.glow = approach(b.glow, 0, GLOW_TAU, dt);
    }

    // channels: colour (tint, brightness, stone), emissive (the stronger of the flash and the glow), opacity
    const u = parts.u;
    this.colour.copy(u.tint.value).multiplyScalar(u.brightness.value);
    if (u.desaturate.value > 0.001) this.colour.lerp(STONE, Math.min(1, u.desaturate.value));
    const who = b.id === YRP_BOSS_ID ? 'boss' : 'party';
    const flash = Math.min(1, Math.max(0, u.flashAmount.value)) * ACCENT.flash[who];
    const glow = b.glow * ACCENT.glow[who];
    let amount = 0;
    if (flash >= glow) {
      this.emissive.copy(u.flashColor.value);
      amount = flash;
    } else {
      this.emissive.setHex(GLOW_COLOUR[who]);
      amount = glow;
    }
    model.setChannels({ colour: this.colour, emissive: this.emissive, amount, opacity: alpha });
    model.setOrb(b.glow);
    // a rigid winged model (the AI Bahamut) flaps harder as it acts; Bahamut rears back as his glow swells (his Mega Flare)
    b.act = approach(b.act, pose === 'attack' || casting ? 1 : pose === 'hurt' ? 0.5 : 0, ACT_TAU, dt);
    model.setActivity(b.act);
    if (b.id === YRP_BOSS_ID) model.setRear(Math.min(1, b.glow / 0.5));

    const still = (actor as unknown as { still?: () => boolean }).still?.() === true; // REDUCE MOTION stills the idle
    const down = actor.lifeState === 'down';
    const low = !down && (requestedPose(actor) === 'critical' || actor.pose === 'critical'); // the low-HP rest pose: the kneel (a painting for it shows 'critical'; the chain critical -> idle shows the idle and only the request says so)
    model.notePose(pose, down, low, paceRate('action')); // a rise to hurt or victory starts that pose; a fall, a rise and the kneel follow the body's state
    model.update(dt, still || (down && !model.playsKo)); // a fall, a rise and a celebration run to their end even when the idle is stilled; a body that is tipped by the actor holds its pose (the flap stops)
  }

  dispose(): void {
    for (const b of this.bound.values()) b.model.root.removeFromParent();
    this.bound.clear();
    this.opts.models.dispose();
  }
}
