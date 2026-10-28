/**
 * How big a plane is: putting a painting on a plane, the reference pose every other pose is sized against, and the head lock that holds the idle's head size.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` -> `PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { Matrix4, Vector2 } from 'three';
import type { PaintedTexture, PoseMeta } from './PaintedArt.ts';
import { computePoseScale, contactBandFor, type PoseScale } from './PaintedScale.ts';
import { subjectOfPainting } from './PoseRegistration.ts';
import { HEAD_BAND, projectedHeadSize, scaledPose, solveHeadFactor, type HeadBox } from './HeadLock.ts'; // D-510: the engine keeps the head steady
import { cutoutShadow } from './ShadowCutout.ts';
import { bindRelight } from './look/relight/FigureRelight.ts'; // demo looks (dev flag `?look=`): light on the paintings, from their normal maps
import type { PlaneSlot, HeadRef } from './PaintedActorTypes.ts';
import { lockLocal, lockMvp, lockPos, lockScale, lockQuat } from './PaintedActorKit.ts';
import { PaintedActorPlacement } from './PaintedActorPlacement.ts';

export abstract class PaintedActorSizing extends PaintedActorPlacement {
  protected applyPose(slotIndex: number, name: string, tex: PaintedTexture): void {
    const slot = this.slots[slotIndex]!;
    slot.pose = name;
    slot.painted = tex;
    slot.meta = tex.meta;
    slot.material.uniforms['map']!.value = tex.texture;
    bindRelight(slot.material, tex.url, tex.scale, tex.placeholder); // demo looks (dev flag `?look=`): the figure's normal map; a no-op without the flag
    (slot.material.uniforms['texel']!.value as Vector2).set(
      1 / Math.max(1, tex.meta.width),
      1 / Math.max(1, tex.meta.height),
    );
    slot.mesh.visible = this.showFigure;
    if (slot.depth) cutoutShadow(slot.material, slot.depth, tex.texture, this.shadowAlphaTest); // VP-1001-31: figure-shaped

    // One pixel scale for the whole subject, taken from idle — so a landscape
    // KO render becomes a wide, low body instead of a standing figure's height
    // stretched across two and a half world units. A placeholder has no
    // relationship to the subject's pixel scale, so it sizes itself.
    const reference = tex.placeholder ? null : this.reference;
    const scale = computePoseScale(tex.meta, {
      worldHeight: this.worldHeight,
      reference,
      ...this.extents,
    });
    slot.base = scale;
    slot.lock = 1;
    slot.meet = 0; // W5: a plane given a new painting carries no drift from the old pair
    slot.align = 0;
    slot.subject = subjectOfPainting(tex.url);

    // The plane itself never rotates — mirroring is a negative scale.x, and the
    // pose's own orientation is painted into the texture; a prone one is only
    // rolled to rest on the floor (`PaintedRest.placePlane`, PR-0022). (The KO fall
    // tilts the *inner group*, which carries both planes together.)
    this.sizeSlot(slot, scale);
    this.lockHead(slot); // D-510: from the last frame's view, so a plane put up between two frames is never drawn at the table's scale

    if (scale.clamped) {
      console.warn(
        `[painted] pose "${name}" (${tex.meta.width}x${tex.meta.height}) is at a very ` +
          `different pixel scale from "${this.referencePose}"; clamped to ` +
          `${scale.width.toFixed(2)}x${scale.height.toFixed(2)} world units. ` +
          'Add a `scale` override to its sidecar JSON if that is wrong.',
      );
    }
  }

  /**
   * Pick the pose whose pixel scale the others inherit: the idle painting, or —
   * when idle is missing — the first real, upright pose there is. Placeholders
   * never qualify, because a grey silhouette's pixels mean nothing.
   */
  protected pickReference(): void {
    this.reference = this.chooseReference();
    const own = this.reference
      ? computePoseScale(this.reference, { worldHeight: this.worldHeight, reference: this.reference, ...this.extents })
      : null;
    this.referenceUpp = own ? own.unitsPerPixel : 0;
    this.headRef = own ? this.headRefOf(this.reference!, own) : null;
  }

  /**
   * D-510: what every other pose's head is held to: the reference's head box, sizing and subject. Nothing when the reference has no registered
   * head, lies down, or the actor shifts its poses by hand (FF7's Film set); a placeholder never has a head.
   */
  private headRefOf(ref: PoseMeta, scale: PoseScale): HeadRef | null {
    if (!ref.head || scale.prone || this.poseShiftPx) return null;
    for (const p of this.poses.values()) if (p.meta === ref && !p.placeholder) return { head: ref.head, scale, subject: subjectOfPainting(p.url) };
    return null;
  }

  private chooseReference(): PoseMeta | null {
    if (!this.sizeFromReference) return null;
    const idle = this.poses.get(this.referencePose);
    if (idle && !idle.placeholder) return idle.meta;
    for (const pose of this.poses.values()) {
      if (pose.placeholder) continue;
      if (pose.meta.height >= pose.meta.width) return pose.meta;
    }
    return null;
  }

  /** Re-size both planes — after the reference pose has changed underneath. */
  protected resize(): void {
    for (const slot of this.slots) {
      const tex = this.poses.get(slot.pose);
      if (tex) this.applyPose(this.slots.indexOf(slot), slot.pose, tex);
    }
    this.syncOpacity();
  }

  /** Put a plane at `scale`: its size, where it stands (`placeSlot`) and the contact ramp that follows its height. The one place a plane's `scale` is written after `computePoseScale`. */
  private sizeSlot(slot: PlaneSlot, scale: PoseScale): void {
    slot.scale = scale;
    slot.mesh.scale.set(scale.width * this.mirrorOf(slot.meta), scale.height, 1);
    this.placeSlot(slot);
    slot.material.uniforms['contactBand']!.value = contactBandFor(scale.height);
  }

  /**
   * D-510 (`HeadLock.ts`): called by the stage once a frame, after `update`, with this frame's view-projection (`HeadLockStage.holdHeads`). Every plane
   * that shows is scaled about the figure's feet so its registered head is as big on screen as the idle's is, under this camera; a plane put up between
   * two frames is held at once from the view kept here. Nothing happens for an actor with no registered idle head, and an actor never handed a view
   * (a cutscene, a portrait) is never touched.
   */
  holdHead(view: Matrix4): void {
    this.headView.copy(view);
    this.headViewed = true;
    if (!this.headRef || !this.showFigure) return;
    for (const slot of this.slots) if (slot.fade > 0.001 && slot.mesh.visible) this.lockHead(slot);
  }

  /**
   * Hold one plane's head to the idle's, through the view {@link holdHead} last saw. A plane that cannot be held (no registered head, no view yet, the
   * reference itself, a stand-in, another subject's painting, a degenerate frame) has the table's scale, exactly what it had before the lock; a plane the
   * lock held before and cannot now is put back at it.
   */
  private lockHead(slot: PlaneSlot): void {
    const ref = this.headRef;
    const head = slot.meta.head;
    // The reference itself is never held, unless it is tipped (FA-2 and FA-3: the idle toppled on the floor is seen from a different depth, and a revive crosses a lying body, whose head is held, to it).
    if (!ref || !head || !this.headViewed || !this.showFigure || (slot.meta === this.reference && !slot.tip) || !slot.painted || slot.painted.placeholder || ref.subject === null || slot.subject !== ref.subject) {
      if (slot.lock !== 1) {
        slot.lock = 1;
        this.sizeSlot(slot, slot.base);
      }
      return;
    }
    const want = this.referenceHeadSize(ref);
    const res = solveHeadFactor((f) => {
      this.sizeSlot(slot, scaledPose(slot.base, f));
      slot.mesh.updateMatrix();
      return this.headSizeThrough(slot.mesh.matrix, head);
    }, want);
    if (!res.skipped && Math.abs(res.factor - res.evaluated) > 1e-9) this.sizeSlot(slot, scaledPose(slot.base, res.factor));
    slot.lock = res.skipped ? 1 : res.factor;
    if (this.headLock.note(slot.pose, res)) {
      console.warn(`[headlock] "${this.name}" pose "${slot.pose}": its head needs x${res.raw.toFixed(3)} of the table's scale; held to x${res.factor.toFixed(2)} (the band is ${HEAD_BAND[0]} to ${HEAD_BAND[1]}).`);
    }
  }

  /** How big a head box is on screen through `local` (a plane's matrix in the inner group) under the view in hand: NDC units, NaN when degenerate. */
  private headSizeThrough(local: Matrix4, head: HeadBox): number {
    lockMvp.multiplyMatrices(this.headView, this.inner.matrixWorld).multiply(local);
    return projectedHeadSize(lockMvp.elements, head);
  }

  /** The idle's head on screen: its plane as `placeSlot` puts it (centred on the actor, its anchor row on the ground), under the figure's transform of this frame. */
  private referenceHeadSize(ref: HeadRef): number {
    this.inner.updateWorldMatrix(true, false);
    lockLocal.compose(lockPos.set(0, ref.scale.offsetY, 0), lockQuat.identity(), lockScale.set(ref.scale.width * this.mirrorOf(this.reference!), ref.scale.height, 1));
    return this.headSizeThrough(lockLocal, ref.head);
  }

  /**
   * D-510: `scale` (a pose's table scale, `computePoseScale`) with the factor the head lock would hold the pose at if it stood now, for a pose that is not
   * on a plane (`poseShape`: the strike solver's look at the pose a blow lands in, which must be the plane the stage will draw, not the table's). Reads the
   * view the last frame saw and changes nothing; `scale` itself when the pose could not be held.
   */
  protected heldScale(painted: PaintedTexture, scale: PoseScale, mirror: 1 | -1): PoseScale {
    const ref = this.headRef;
    const head = painted.meta.head;
    if (!ref || !head || !this.headViewed || !this.showFigure || painted.meta === this.reference || painted.placeholder || subjectOfPainting(painted.url) !== ref.subject) return scale;
    const want = this.referenceHeadSize(ref);
    const res = solveHeadFactor((f) => {
      const s = scaledPose(scale, f);
      // where `placeSlot` would put it: slid across so its stance is the idle's, its anchor row on the ground
      const x = this.registrationShift({ meta: painted.meta, scale: s, mesh: { scale: { x: s.width * mirror } } } as unknown as PlaneSlot);
      lockLocal.compose(lockPos.set(x, s.offsetY, 0), lockQuat.identity(), lockScale.set(s.width * mirror, s.height, 1));
      return this.headSizeThrough(lockLocal, head);
    }, want);
    return res.skipped ? scale : scaledPose(scale, res.factor);
  }

  /**
   * A new world height for the figure this actor draws: a boss whose painting changes with its form and whose form is named a height by the scene (`SceneStaging.formHeights`, Chapter II's Lady
   * Yunalesca). Every size the actor holds is a multiple of `worldHeight` read when it is needed, but the pose scales, which are solved when the poses load: this recomputes the head reference and
   * the planes of the poses it holds, and the stage calls it **before** `loadPoses` at a form change so the new painting is solved at the new height. `radii` are the contact shadow's and the turn
   * ring's, which the stage authors at a fixed radius times the figure's `ringScale`; they are given, not scaled, so a figure that goes back to its first height gets its first radii bit for bit.
   * A height equal to the current one changes nothing.
   */
  setWorldHeight(height: number, radii?: { shadow?: number; ring?: number }): void {
    if (radii?.shadow !== undefined && this.shadow) this.shadowBaseRadius = radii.shadow;
    if (radii?.ring !== undefined && this.turnRing) this.ringBaseRadius = radii.ring;
    if (height === this.worldHeight) return;
    this.worldHeight = height;
    if (this.poses.size > 0) {
      this.pickReference();
      this.resize();
    }
  }
}
