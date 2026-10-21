/**
 * **The toon models on the battle's actors** (the hidden Wind Waker chapter; FFX-2 only): the stage (`PaintedStage`) owns the actors and plays every `BattleEvent` onto them through the presenter, exactly as it does in
 * chapter 24; this skin finds them where the stage puts them and carries a model on each, with the painted planes switched off. It is the house habit of `engine/ffx3d/ffxSkin.ts` (the hidden Fayth chapter's models), for
 * a toon-shaded model, a head that turns to the viewer, weapons on the hands and a boss that flaps.
 *
 * ## How a model rides an actor
 *
 * The stage names each `PaintedActor` by its combatant id and adds it to the three.js scene the scene's group is mounted in. The skin looks them up there by name every frame (the stage replaces an actor of the same id,
 * so a new object is attached afresh) and parents the model to the actor's `inner` group, where the actor stacks every motion layer (`PaintedActor.update`): **the lunge, the recoil, the hop, the squash, the shake, the
 * breath and the sway are the presenter's own and move the model with them**. What the skin adds is what a flat painting did with a pose name and a shader, done to a model:
 *
 * - **Facing.** A girl's body is turned `BODY_OFF_DEG` off the direction to the lens (the stance points at the boss; `./layout.ts` `bodyYaw`) and her head is turned toward the viewer every frame (`./pose.ts`); Valefor takes
 *   a fixed turn toward the party. The actor's interim yaw is off: that turn is for flat paintings.
 * - **Flash.** The actor's own flash (a hit's white, a heal's green, a revive's blue: `PaintedActor.flash`) is read off its uniform cells and drives the model's emissive.
 * - **Cast aura.** While the actor holds the `cast` pose a thin toon rim glows on the model's silhouette (`./glow.ts`, the shader's `uToonGlow`), in the spell's colour for a girl and a warm gold for Valefor's charge, pulsing;
 *   with a faint lift of the fill (`GLOW_FILL`) and never more: phase 2's emissive fill turned the girls into cream ghosts.
 * - **Tint and stone.** The actor's hurt tint and brightness multiply the model's colour; a petrified figure goes grey.
 * - **KO.** A downed figure (`lifeState` 'down') tips onto its back about its feet and stays (the files carry no knock-out clip); a revive stands it up. Valefor falls to the floor first.
 * - **Fade.** The actor's alpha and dissolve fade the model.
 * - **Size.** The model is fitted to the actor's world height times its own share (`heightFactor`: Rikku a little shorter than Yuna, Paine a little taller), and refitted if the stage re-sizes the figure.
 * - **Weapons.** Once a girl stands on her slot in her stance, her weapons are aimed at Valefor's chest (`./props.ts`).
 * - **The blob.** The actor's own contact blob is switched off: the sun's shadow map draws the shadow in this look.
 * - **Valefor's moves.** The shot director's beats (`./beats.ts`) start her stand-in effects (`./moveFx.ts`, `./moves.ts`) and make her wings flap harder for as long as the action is open.
 *
 * Every figure of the cast carries a model (its own file, or the neutral capsule where the file is missing); an actor the skin cannot take (its private parts changed) is left as the stage made it. The painted planes'
 * private switches are reached the way `ffxSkin.ts` reaches them, and `tests/unit/ww3d/skin.test.ts` pins that they are still there. Game case: FFX-2 only.
 */

import { Color, Group, Vector3, type Object3D } from 'three';
import { PaintedActor } from '../PaintedActor.ts';
import { paceRate } from '../pace.ts';
import type { BeatListener } from './beats.ts';
import { BOSS_RIM, DEFAULT_RIM, RIM_SHAPE_BOSS, RIM_SHAPE_GIRL, fillAmount, flashStrength, glowLevel, rimStrength, spellRim, type Rgb } from './glow.ts';
import {
  BOSS_HOVER,
  BOSS_SPOT,
  PARTY_SLOTS,
  WW_BOSS_ID,
  WW_CAST,
  WW_PARTY_IDS,
  heightFactor,
  type V3,
  type WwId,
} from './layout.ts';
import { MOUTH_LOCAL, CHEST_LOCAL, type ModelSource, type WwModel, type WwModels } from './model.ts';
import type { MoveFx } from './moveFx.ts';
import { defaultTargets, moveKindOf } from './moves.ts';

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

/** The faint fill under the aura is warm (a girl's) or a golden white (Valefor's). */
const GLOW_COLOUR: Readonly<Record<'party' | 'boss', number>> = { party: 0xffe2a6, boss: 0xfff0b0 };
/** Seconds a downed body takes to tip, a glow to fade, and an action's flap to rise. */
const LIE_TAU = 0.2;
const GLOW_TAU = 0.18;
const ACT_TAU = 0.2;
/** Seconds a girl's cast glow may last: a cast's own length (the beat and the clip are about two seconds). */
const CAST_GLOW_MAX = 2.4;
const STONE = new Color(0.6, 0.6, 0.64);
/** How close to its slot a girl stands before her weapons are aimed (metres), and the height of the girls' chests that her effects aim at. */
const AT_SLOT = 0.35;
const CHEST_SHARE = 0.55;

/** Valefor's chest, the point the girls aim at: her spot at her hover plus 1.3 m (the lab's). */
const BOSS_CHEST: V3 = [BOSS_SPOT[0], BOSS_HOVER + 1.3, BOSS_SPOT[2]];

const approach = (from: number, to: number, tau: number, dt: number): number => from + (to - from) * (dt > 0 ? 1 - Math.exp(-dt / tau) : 1);

/** One model on one actor. */
interface Bound {
  readonly id: WwId;
  readonly actor: PaintedActor;
  readonly model: WwModel;
  readonly parts: PaintedInternals;
  lie: number;
  /** The aura's level, 0 off to 1 held, smoothed. */
  glow: number;
  /** Seconds the aura has been on, for its pulse (it keeps counting while it fades). */
  glowAge: number;
  /** The aura's colour: the spell's (a girl's, set when the cast opens), or Valefor's. */
  rim: Rgb;
  castAt: number | null;
  /** How much the figure is acting, for a model that flaps (Valefor's wings). */
  act: number;
  /** A cast is open (the beat), so the glow holds whatever painting the actor shows. */
  castHold: boolean;
  /** An action of the boss's is open (the beat), from its opening to its close. */
  busy: boolean;
  /** The girl's weapons have been aimed at Valefor. */
  aimed: boolean;
}

export interface WwSkinOptions {
  /** The scene's group: the actors are found among the children of the scene it is mounted in. */
  readonly host: Object3D;
  /** The loaded models (by id; a missing id leaves that figure painted). */
  readonly models: WwModels;
  /** Valefor's stand-in effects (the scene owns the object and advances it). */
  readonly fx: MoveFx;
}

export class WwSkin {
  private readonly bound = new Map<WwId, Bound>();
  private readonly colour = new Color();
  private readonly emissive = new Color();
  private readonly chest = new Vector3(...BOSS_CHEST);
  private clock = 0;

  constructor(private readonly opts: WwSkinOptions) {}

  /**
   * What the shot director's beats tell the skin (`./beats.ts`, wired by the scene): an attack or a cast opening starts that clip on the figure that does it, a blow landing puts the attack's strike on it, and an
   * action of Valefor's opens her effect (by ability id) and her flap. The speed of a one-shot follows the pacing option.
   */
  readonly listener: BeatListener = {
    open: (actorId, kind, lead, info) => {
      const b = this.bound.get(actorId as WwId);
      if (!b) return;
      b.castHold = kind === 'cast';
      if (b.castHold) {
        b.castAt = null; // a new cast swells afresh, even where the last one never closed
        b.glowAge = 0;
        if (b.id !== WW_BOSS_ID) b.rim = spellRim(info.abilityId); // the girl's rim takes the spell's colour
      }
      b.model.noteOpen(kind, lead, paceRate('action'));
      if (b.id !== WW_BOSS_ID) return;
      b.busy = true; // every Valefor action flaps her wings harder, until it closes
      const move = moveKindOf(info.abilityId);
      if (!move) return;
      const named = info.targetIds.length > 0 ? info.targetIds : defaultTargets(move); // the party-wide moves open with nobody named
      const targets = named.map((t) => this.chestOf(t)).filter((p): p is Vector3 => p !== null);
      if (targets.length === 0 && move !== 'blast') return;
      const from = b.model.worldPointOf(move === 'blast' ? CHEST_LOCAL : MOUTH_LOCAL);
      this.opts.fx.start(move, from, targets, lead);
    },
    impact: (actorId) => this.bound.get(actorId as WwId)?.model.noteImpact(paceRate('action')),
    close: (actorId) => {
      const b = this.bound.get(actorId as WwId);
      if (!b) return;
      b.castHold = false;
      b.busy = false;
    },
  };

  /** The ids that carry a model now, and whether it is the id's own file or the neutral capsule (the debug view's and the tests' read). */
  get carrying(): Record<string, ModelSource> {
    return Object.fromEntries([...this.bound].map(([id, b]) => [id, b.model.source]));
  }

  /** The actor and the model of an id (a test's read), or null when it is not attached. */
  get(id: WwId): { actor: PaintedActor; model: WwModel } | null {
    const b = this.bound.get(id);
    return b ? { actor: b.actor, model: b.model } : null;
  }

  private actorsOf(): readonly Object3D[] {
    return this.opts.host.parent?.children ?? [];
  }

  /** The chest of a combatant in world space (a girl's, where Valefor's beam lands), or null when it has no actor. */
  private chestOf(id: string): Vector3 | null {
    const actor = this.actorsOf().find((c): c is PaintedActor => c instanceof PaintedActor && c.name === id);
    if (!actor) return null;
    return new Vector3(actor.position.x, actor.position.y + actor.height * CHEST_SHARE, actor.position.z);
  }

  /** Once a frame, after the stage's own work: attach to any actor that is new and make every model follow its actor. Nothing to do before the host is mounted in a scene. `dt` is the field's seconds. */
  update(dt = 0): void {
    this.clock += dt;
    const scene = this.opts.host.parent;
    if (!scene) return;
    for (const id of WW_CAST) {
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

  private attach(id: WwId, actor: PaintedActor, model: WwModel): void {
    this.bound.get(id)?.model.root.removeFromParent();
    const parts = internalsOf(actor);
    if (!parts) {
      this.bound.delete(id);
      return;
    }
    actor.setInterimYaw(0); // a flat painting's turn toward the other side: off for a model, which has its own
    hidePaintedFigure(actor);
    if (actor.shadow) actor.shadow.visible = false; // the sun's shadow map draws the shadow in this look
    const girl = (WW_PARTY_IDS as readonly string[]).indexOf(id);
    if (girl >= 0) model.setYaw(model.bodyYawAt(PARTY_SLOTS[girl]!));
    model.fitTo(actor.height * heightFactor(id));
    parts.inner.add(model.root);
    this.bound.set(id, { id, actor, model, parts, lie: actor.lifeState === 'down' ? 1 : 0, glow: 0, glowAge: 0, rim: id === WW_BOSS_ID ? BOSS_RIM : DEFAULT_RIM, castAt: null, act: 0, castHold: false, busy: false, aimed: model.weapons.length === 0 });
  }

  private follow(b: Bound, dt: number): void {
    const { actor, model, parts } = b;
    model.fitTo(actor.height * heightFactor(b.id)); // the stage may re-size a figure after it is staged
    if (actor.shadow) actor.shadow.visible = false; // the actor may switch its blob back on (it does for a fade); this look has none

    // fade: the actor's alpha, and the painted figure's dissolve (a sent fiend comes apart)
    const dissolve = Number.isFinite(actor.dissolveLevel) ? Math.min(1, Math.max(0, actor.dissolveLevel)) : 0;
    const alpha = actor.visible ? actor.alpha * (1 - dissolve) : 0;
    model.root.visible = alpha > 0.002;

    // KO: a downed body tips onto its back and stays; a revive stands it up
    b.lie = approach(b.lie, actor.lifeState === 'down' ? 1 : 0, LIE_TAU, dt);
    if (b.lie < 0.002) b.lie = 0;
    model.setLie(model.falls ? 0 : b.lie, actor.facingDir); // a model with its own fall clip lies down by that clip, not by tipping over

    // what the actor is doing: the requested pose (the life layer's state, so a figure with no painting for it still reads as hurt or victorious), else the pose shown
    const life = actor.lifeState;
    const pose = life === 'hurt' || life === 'victory' ? life : actor.pose;
    const casting = pose === 'cast' || b.castHold;

    // aura: a cast lights one; anything else lets it go. A girl's beat that never closes (under the ATB a second action can be open when hers ends, so the presenter puts the wrong figure's pose back and her
    // pose and cast hold stay, phase 2: Yuna stood cream and see-through for the rest of the fight) lets the aura go after a cast's length. Valefor's charge is as long as her action, so hers is not capped.
    b.glowAge += dt;
    if (casting) {
      b.castAt ??= this.clock;
      const age = this.clock - b.castAt;
      const stuck = b.id !== WW_BOSS_ID && age > CAST_GLOW_MAX;
      b.glow = approach(b.glow, stuck ? 0 : glowLevel(age), GLOW_TAU, dt);
    } else {
      b.castAt = null;
      b.glow = approach(b.glow, 0, GLOW_TAU, dt);
    }

    // channels: colour (tint, brightness, stone), emissive (the stronger of the flash and the glow), opacity
    const u = parts.u;
    this.colour.copy(u.tint.value).multiplyScalar(u.brightness.value);
    if (u.desaturate.value > 0.001) this.colour.lerp(STONE, Math.min(1, u.desaturate.value));
    const flash = flashStrength(u.flashAmount.value); // a power curve: the game's small charge pulses stay invisible, a hit is a near silhouette for a moment (`./glow.ts`)
    const fill = fillAmount(b.glow);
    let amount = 0;
    if (flash >= fill) {
      this.emissive.copy(u.flashColor.value);
      amount = flash;
    } else {
      this.emissive.setHex(GLOW_COLOUR[b.id === WW_BOSS_ID ? 'boss' : 'party']);
      amount = fill;
    }
    model.setChannels({ colour: this.colour, emissive: this.emissive, amount, opacity: alpha, ...(b.glow > 0.004 ? { rim: { colour: b.rim, strength: rimStrength(b.glow, b.glowAge), shape: b.id === WW_BOSS_ID ? RIM_SHAPE_BOSS : RIM_SHAPE_GIRL } } : {}) });

    // Valefor's wings flap harder as she acts, from the beat's opening to its close (or while a pose says so)
    b.act = approach(b.act, b.busy || pose === 'attack' || casting ? 1 : pose === 'hurt' ? 0.5 : 0, ACT_TAU, dt);
    model.setActivity(b.act);

    const still = (actor as unknown as { still?: () => boolean }).still?.() === true; // REDUCE MOTION stills the idle
    const down = actor.lifeState === 'down';
    model.notePose(pose, down, paceRate('action')); // a rise to hurt or victory starts that clip
    model.update(dt, still || (down && !model.falls && b.id !== WW_BOSS_ID)); // a body that is down holds its pose while the actor tips it over; Valefor's flap and bob go on until she is down for good

    // the weapons: aimed at Valefor's chest once the girl stands on her slot, in her stance
    if (!b.aimed && model.playing === 'idle') this.aim(b);
  }

  private aim(b: Bound): void {
    const girl = (WW_PARTY_IDS as readonly string[]).indexOf(b.id);
    const slot = girl >= 0 ? PARTY_SLOTS[girl] : undefined;
    if (!slot) {
      b.aimed = true;
      return;
    }
    if (Math.hypot(b.actor.position.x - slot[0], b.actor.position.z - slot[2]) > AT_SLOT) return; // still walking on
    b.actor.updateWorldMatrix(true, true);
    b.model.aimWeapons(this.chest);
    b.aimed = true;
    this.pinHead(b);
  }

  /**
   * The HUD fences the strategy guide and the advisor card off the girls' heads, through `PaintedActor.headPoint` (the actor's position plus 0.92 of its height). A chibi model in her stance leans toward the lens, and
   * the camera looks up from below, so her real head projects above that point and the guide card clipped Yuna's hair (polish 1). Once a girl stands on her slot in her stance, her actor's head point is the top of her
   * real head as it is then (the head bone plus how far her hair stands above it), kept as an offset from the actor so a clip's crouch or jump never moves the fence (the guide would fold and unfold with it).
   */
  private pinHead(b: Bound): void {
    if (b.id === WW_BOSS_ID) return;
    const top = b.model.headTopWorld(new Vector3());
    if (!top) return;
    const rest = top.sub(b.actor.position).clone();
    b.actor.headPoint = (out = new Vector3()): Vector3 => out.set(b.actor.position.x + rest.x, b.actor.position.y + rest.y, b.actor.position.z + rest.z);
  }

  dispose(): void {
    for (const b of this.bound.values()) b.model.root.removeFromParent();
    this.bound.clear();
    this.opts.models.dispose();
  }
}
