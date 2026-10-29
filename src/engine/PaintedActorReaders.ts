/**
 * What the stage and the presenter ask of a figure: its reactions to a blow, which paintings it holds, the geometry of its painting, where its head and centre are, its facing and the interim turn.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` -> `PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { Mesh, Vector3, type Texture } from 'three';
import { clampYawToCamera, facingForSide, interimYawFor, type ActorSide, type ArtFacing } from './BattlePresenterActors.ts';
import type { PaintedTexture } from './PaintedArt.ts';
import { computePoseScale } from './PaintedScale.ts';
import { noteImpact } from './look/living/StageImpacts.ts'; // release 62 (FFX-2's living cathedral): a landed blow starts a ring in the polished floor's reflection
import { recoilLegacy } from './HitRecoil.ts'; // r40-recoil (FC-1): the knock-back's curve
import { curvesOn } from './motion/CurvesSwitch.ts';
import { heftOf } from './motion/ActorCurves.ts';
import { newPushMs, recoilDistance } from './motion/RecoilCurve.ts';
import type { PoseShape, PlaneSlot } from './PaintedActorTypes.ts';
import { interimYawOn, FALL_MS } from './PaintedActorKit.ts';
import { PaintedActorPoses } from './PaintedActorPoses.ts';

export abstract class PaintedActorReaders extends PaintedActorPoses {
  /** True while a pose crossfade runs (it is no tween in {@link PaintedActor.tweens}, so `stillActor` asks here). */
  get blending(): boolean {
    return this.blend.blending;
  }

  /**
   * Release 39 (`ArtGovernor.ts`): every real painting this actor holds, once each (a pose that fell back to idle shares idle's), and
   * whether a plane is drawing it right now. A stand-in is left out: it has no master to swap in.
   */
  paintings(): Array<{ painted: PaintedTexture; mesh: Mesh; drawn: boolean }> {
    const drawn = new Map<Texture, Mesh>();
    for (const slot of this.slots) {
      const p = slot.painted;
      if (p && slot.mesh.visible && slot.fade > 0.02 && this._alpha > 0.02) drawn.set(p.texture, slot.mesh);
    }
    const out: Array<{ painted: PaintedTexture; mesh: Mesh; drawn: boolean }> = [];
    const seen = new Set<Texture>();
    for (const p of this.poses.values()) {
      if (p.placeholder || seen.has(p.texture)) continue;
      seen.add(p.texture);
      out.push({ painted: p, mesh: drawn.get(p.texture) ?? this.slots[this.active]!.mesh, drawn: drawn.has(p.texture) });
    }
    return out;
  }

  get poseNames(): string[] {
    return [...this.poses.keys()];
  }

  /** True when every loaded pose is a procedural stand-in. */
  get isPlaceholder(): boolean {
    if (!this.poses.size) return true;
    return [...this.poses.values()].every((p) => p.placeholder);
  }

  /**
   * Knocked back and springing home — and, when there is a `hurt` painting,
   * wearing it for the length of the flinch.
   *
   * The presenter calls this on every hit, so this is where "recoil on hit with
   * a brief tint" lives: one call from `BattlePresenterBeats.damage` gives the
   * knock-back, the pose and the bruise.
   */
  recoil(ms = 340, distance = 0.28, knock?: { reach: number; ms: number }, hold?: number): Promise<void> {
    noteImpact(this, distance >= 0.3); // a no-op unless the look's living room asked for hits (`look/living/StageImpacts.ts`)
    const fresh = !recoilLegacy() && curvesOn();
    this.smear.hintRecoil(this.facing, knock ? knock.reach : fresh ? recoilDistance(distance, heftOf(this.worldHeight)) : distance, knock ? knock.ms : fresh ? newPushMs(ms) : 80); // the push is fastest on its first frame, which is where the hurt swap is made
    this.flinch(ms, hold);
    return knock ? Promise.resolve() : this.knockBack(ms, distance); // MF-03 `?hit=knock`: the push is `hitReact`'s, not the recoil tween's
  }

  /**
   * The hit reaction on its own: the `hurt` pose for a moment, a warm tint over
   * the painting, then back to whatever the fighter was doing.
   *
   * No-op on a downed fighter — a body on the ground does not flinch — and on
   * an actor whose life layer is off.
   */
  flinch(ms = 340, hold = ms): void {
    const life = this.life;
    if (!life || life.state === 'down' || this.flinching) return;
    const back = this.stance.back(this.requested || 'idle', this.flinchToken); // MF-12: a blow inside a held string hands back the stance the string began from, not the previous blow's hurt
    const backPaint = this.stance.paint(this.requested || 'idle', this.requestedPaint, this.flinchToken); // MF-05: a girl struck with her menu open (?stance=v1a|v1b) comes back on the idle painting, not the ready one; inside a held string, on the painting the string began from
    const token = ++this.flinchToken;
    this.stance.begin(token, back, hold > ms, backPaint);
    this.flinching = true;
    try {
      this.setPose('hurt');
    } finally {
      this.flinching = false;
    }
    this.tintHurt(Math.max(160, ms * 0.7));
    // A plain timer: hold the flinch, then hand the pose back (and its painting) — unless someone (a KO, the next action) has taken it in the meantime.
    this.tweens.to(0, 1, {
      durationMs: Math.max(1, hold), // MF-12 (`?hurtstring=hold`): the painting stays up through a string of blows; the next flinch takes the token and the last one lets go
      easing: 'linear',
      onUpdate: () => {},
      onComplete: () => {
        if (this.flinchToken !== token) return;
        if (this.life?.state !== 'hurt') return;
        this.setPose(back === 'hurt' ? 'idle' : back, back !== 'hurt' && backPaint ? { paint: backPaint } : undefined);
      },
    });
  }

  /** True when this figure is staged off the ground and wants a halo, not a pool. */
  get levitates(): boolean {
    return this.hoverHeight > 0.05;
  }

  /**
   * The painted silhouette's four corners in **world** space, in the order
   * bottom-left, bottom-right, top-right, top-left of the plane's own frame.
   *
   * Taken from the pose's tight alpha box (`PoseScale.contentBox`) rather than
   * the plane, and pushed through the plane's live world matrix, so it carries
   * the interim yaw, the mirror, the lunge, the KO tilt and the hover bob. This
   * is what `PaintedStage.projectRect` turns into the screen rectangle a target
   * bracket is drawn on and an occlusion test is run against.
   *
   * `out` must hold four vectors; one is allocated per call when omitted.
   */
  contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3] {
    const corners: [Vector3, Vector3, Vector3, Vector3] = out ?? [
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
    ];
    const slot = this.slots[this.active]!;
    const box = slot.scale.contentBox;
    // The mesh's own local frame is a unit plane centred on its origin, scaled
    // by `mesh.scale` and lifted by `mesh.position.y` (= `scale.offsetY`). The
    // content box is expressed against the *group* origin, so undo that lift
    // and the scale to land back in unit-plane coordinates.
    const sx = slot.mesh.scale.x;
    const sy = slot.mesh.scale.y || 1;
    const lift = slot.scale.offsetY;
    // |sx|: the box is in the painting's own frame; a negative `sx` then mirrors it with the silhouette.
    const ax = Math.abs(sx);
    const u0 = ax === 0 ? -0.5 : box.x0 / ax;
    const u1 = ax === 0 ? 0.5 : box.x1 / ax;
    const v0 = (box.y0 - lift) / sy;
    const v1 = (box.y1 - lift) / sy;
    corners[0].set(u0, v0, 0);
    corners[1].set(u1, v0, 0);
    corners[2].set(u1, v1, 0);
    corners[3].set(u0, v1, 0);
    // `updateWorldMatrix` rather than trusting the last render's matrices: the
    // HUD asks for this from its own reposition path, which can run before the
    // renderer has touched the graph this frame.
    slot.mesh.updateWorldMatrix(true, false);
    for (const c of corners) c.applyMatrix4(slot.mesh.matrixWorld);
    return corners;
  }

  /**
   * The painted box of pose `name` as it would stand if it were the pose showing now, and what its alpha is read from (`motion/Silhouette.ts`): nothing is changed
   * (no pose swap, no crossfade, no life state). The strike solver's look at the pose a blow lands in (the impact painting) while the wind-up is still up
   * (r391-reach): the same sizing, placement and registration `applyPose` gives a slot, so for the pose that IS showing it is `contentQuad`. Null for a pose with
   * no painting of its own to size (a placeholder) and for a body lying down (a prone plane is placed by its ground hull).
   */
  poseShape(name: string): PoseShape | null {
    const resolved = this.resolveDrawable(name);
    const painted = resolved ? this.poses.get(resolved) : undefined;
    if (!resolved || !painted || painted.placeholder) return null;
    const table = computePoseScale(painted.meta, { worldHeight: this.worldHeight, reference: this.reference, ...this.extents });
    if (table.prone) return null;
    const mirror = this.mirrorOf(painted.meta);
    const scale = this.heldScale(painted, table, mirror); // D-510: the plane as the stage will draw it, held to the idle's head, not the table's
    const sx = scale.width * mirror;
    // where `placeSlot` puts the plane across: the sidecar's shift, then the registration that stands the pose's feet where the idle's are
    let px = 0;
    const shift = this.poseShiftPx?.[resolved];
    if (shift) px += shift * scale.unitsPerPixel * (sx < 0 ? -1 : 1);
    px += this.registrationShift({ meta: painted.meta, scale, mesh: { scale: { x: sx } } } as unknown as PlaneSlot);
    const b = scale.contentBox;
    const x0 = px + (mirror > 0 ? b.x0 : -b.x1);
    const x1 = px + (mirror > 0 ? b.x1 : -b.x0);
    this.inner.updateWorldMatrix(true, false);
    const at = (x: number, y: number): Vector3 => new Vector3(x, y, 0).applyMatrix4(this.inner.matrixWorld);
    return {
      corners: [at(x0, b.y0), at(x1, b.y0), at(x1, b.y1), at(x0, b.y1)],
      tex: painted.texture,
      u0: b.x0 / scale.width + 0.5,
      u1: b.x1 / scale.width + 0.5,
      v0: (b.y0 - scale.offsetY) / scale.height + 0.5,
      v1: (b.y1 - scale.offsetY) / scale.height + 0.5,
      mirrored: mirror < 0,
    };
  }

  /**
   * Pyrefly dissolve: 0 = solid, 1 = gone.
   *
   * Dissolving all the way *is* a death, so the body goes down with it: the
   * fiend collapses and comes apart at the same time, instead of standing to
   * attention while it evaporates. (This is the enemy half of the KO — a party
   * member gets the fall from `setPose('ko')` and stays on the field.)
   */
  dissolveTo(value: number, ms = 900, colour?: number | string): Promise<void> {
    if (colour !== undefined) this.u.dissolveColor.value.set(colour as never);
    // Fall *then* come apart. The KO drop takes ~300 ms, so holding the
    // dissolve off for a beat lets the eye see the fiend go down before the
    // pyreflies take it; starting both on the same frame reads as a figure
    // evaporating on its feet, and the fall is lost inside the fade. The delay
    // is taken out of the move, not added to it, so every caller's timing
    // (`TIMING.ko`) is unchanged.
    let delayMs = 0;
    if (value >= 0.999 && this.life && this.life.state !== 'down') {
      this.setPose('ko');
      delayMs = Math.min(FALL_MS * 0.6, ms * 0.25);
    }
    return this.tweens.toAsync(this.u.dissolve.value, value, {
      durationMs: Math.max(1, ms - delayMs),
      delayMs,
      easing: 'quadInOut',
      onUpdate: (v) => {
        this.u.dissolve.value = v;
      },
    });
  }

  /**
   * Turn the fighter: 1 = toward +x, -1 = toward -x.
   *
   * This is the direction the *body* faces, not a mirror instruction. Whether
   * the plane ends up flipped depends on which way the painting itself faces
   * ({@link setArtFacing} and each pose's sidecar), so art that is already
   * correct for its side is drawn exactly as painted.
   */
  setFacing(dir: 1 | -1): void {
    this.facing = dir;
    this.applyMirror();
  }

  /** {@link setFacing} from the team: party and aeons +x, enemies -x. */
  setSide(side: ActorSide): void {
    this.setFacing(facingForSide(side));
  }

  /** Declare which way this subject's paintings face. See {@link ArtFacing}. */
  setArtFacing(art: ArtFacing): void {
    this.artFacing = art;
    this.applyMirror();
  }

  get facingDir(): 1 | -1 {
    return this.facing;
  }

  get artFacingDir(): ArtFacing {
    return this.artFacing;
  }

  /**
   * Set this actor's interim turn, in degrees — how far a still-frontal
   * painting's plane is yawed toward the enemy. 0 leaves it flat to camera.
   *
   * The *sign* is not this: which way the plane turns comes from the body's
   * facing (party +x, enemies -x), and a pose whose sidecar already says
   * `right` or `left` is left flat however large this is, because it was
   * painted turned and turning it again makes a profile. See
   * {@link import('./BattlePresenterActors.ts').interimYawFor}.
   */
  setInterimYaw(deg: number): void {
    this.interimYaw = Number.isFinite(deg) ? Math.abs(deg) : 0;
  }

  /** This actor's interim turn, in degrees. */
  get interimYawDeg(): number {
    return this.interimYaw;
  }

  /** The yaw actually on the planes right now, in degrees. Debug + tests. */
  get yawDeg(): number {
    return this.appliedYaw;
  }

  /** Where the yaw is easing to, in degrees: the rule, clamped to the camera. */
  protected yawTarget(): number {
    if (!interimYawOn || this.interimYaw === 0) return 0;
    const art = this.slots[this.active]!.meta.facing ?? this.artFacing;
    const want = interimYawFor(art, this.facing, this.interimYaw);
    if (want === 0) return 0;
    return this.viewAzimuth === null ? want : clampYawToCamera(want, this.viewAzimuth);
  }

  /** World-space point at the top of the figure — VFX and damage numbers. */
  headPoint(out = new Vector3()): Vector3 {
    return out.set(this.position.x, this.position.y + this.aimHeight * 0.92, this.position.z);
  }

  /**
   * World point of a spot on the painting on screen, through the live plane:
   * `u` across from the painting's left edge, `t` down from its top, both 0..1.
   * The plane's offset, mirror, lunge, KO tilt and bob all come with it. Used
   * to pin a figure-less part to its parent's painting (`PartAnchors.ts`).
   */
  paintPoint(u: number, t: number, out = new Vector3()): Vector3 {
    const slot = this.slots[this.active]!;
    slot.mesh.updateWorldMatrix(true, false);
    return out.set(u - 0.5, 0.5 - t, 0).applyMatrix4(slot.mesh.matrixWorld);
  }

  /** World-space point at mid-torso. */
  centerPoint(out = new Vector3()): Vector3 {
    return out.set(this.position.x, this.position.y + this.aimHeight * 0.52, this.position.z);
  }

  get height(): number {
    return this.worldHeight;
  }

  /** True while the pose on screen is a downed (wider-than-tall) painting. */
  get isProne(): boolean {
    return this.slots[this.active]!.scale.prone;
  }

  /**
   * True while a prone plane is still on screen, whatever pose is asked for: a revive makes the standing plane the active one at once, and the lying body fades out under it
   * (`ProneLay` keeps its slide until then). A figure with no lying plane showing is false.
   */
  get proneLingers(): boolean {
    return this.slots.some((s) => s.scale.prone && s.fade > 0.001);
  }

  /** World size of the plane currently showing — `[width, height]`. */
  get poseSize(): [number, number] {
    const s = this.slots[this.active]!.scale;
    return [Math.abs(s.width), s.height];
  }
}
