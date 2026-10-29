/**
 * Where a plane stands: the mirror, the placement and registration of each painting, the aligned dissolve's geometry, the stand-in painting and the two plane materials.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` -> `PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { DoubleSide, Mesh, MeshDepthMaterial, PlaneGeometry, RGBADepthPacking, ShaderMaterial, Vector2, type Camera } from 'three';
import { mirrorFor } from './BattlePresenterActors.ts';
import { paintedCanvasTexture, type PaintedTexture, type PoseMeta } from './PaintedArt.ts';
import { placePlane } from './PaintedRest.ts';
import { stanceShift } from './PoseRegistration.ts';
import { PAINTED_BLENDING } from './BloomMask.ts';
import { paintedFragmentShader, paintedVertexShader } from './shaders/PaintedShader.ts';
import { alignWeight, type Footprint } from './PoseAlign.ts'; // W5: the aligned dissolve's geometry
import { placeTipped, type SlotTip } from './KoTip.ts'; // FA-2: the KO fall tips the standing plane about its feet (KoFall.ts)
import type { PlaneSlot } from './PaintedActorTypes.ts';
import { UNSIZED, RAD2DEG, yawScratchA, yawScratchB } from './PaintedActorKit.ts';
import { PaintedActorBase } from './PaintedActorBase.ts';

export abstract class PaintedActorPlacement extends PaintedActorBase {
  protected makeSlot(renderOrder: number): PlaneSlot {
    const material = new ShaderMaterial({
      uniforms: {
        map: { value: null },
        opacity: { value: 0 },
        texel: { value: new Vector2(1 / 1024, 1 / 1024) },
        // Per-slot, not shared: the contact ramp is a fixed *world* distance,
        // so its UV height depends on how tall this pose's plane ended up.
        contactBand: { value: 0.1 },
        ...this.u,
        smearVec: { value: new Vector2() }, // per plane: its own size and mirror (a rig's parts share the actor's cell)
      },
      vertexShader: paintedVertexShader,
      fragmentShader: paintedFragmentShader,
      transparent: true,
      ...PAINTED_BLENDING,
      depthWrite: false,
      depthTest: true,
      side: DoubleSide,
    });
    const mesh = new Mesh(new PlaneGeometry(1, 1), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;
    mesh.visible = false;
    // The camera comes to *us*. `onBeforeRender` fires on the main pass only
    // (the shadow pass goes through `onBeforeShadow`, which `Object3D` no-ops),
    // so the interim yaw can answer to a rig that has swung round the side
    // without `PaintedStage` having to hand every actor a camera, and without
    // this class growing a reference to one it would then have to keep current.
    mesh.onBeforeRender = (_renderer, scene, camera): void => {
      if (scene) this.noteViewCamera(camera);
    };

    let depth: MeshDepthMaterial | null = null;
    if (this.castsShadow) {
      depth = new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        alphaTest: this.shadowAlphaTest,
      });
      mesh.customDepthMaterial = depth;
      mesh.castShadow = true;
    }
    return {
      mesh,
      material,
      depth,
      fade: 0,
      pose: '',
      meta: { width: 1, height: 1, baselineY: 1 },
      scale: UNSIZED,
      painted: null,
      base: UNSIZED,
      lock: 1,
      subject: null,
      tip: null,
      meet: 0,
      align: 0,
    };
  }

  protected makePlaceholderPose(url: string): PaintedTexture {
    const canvas = this.placeholderFactory();
    return {
      texture: paintedCanvasTexture(canvas),
      meta: {
        width: canvas.width,
        height: canvas.height,
        baselineY: canvas.height * this.placeholderBaseline,
      },
      placeholder: true,
      url,
    };
  }

  /** One plane as the aligned dissolve sees it: its unit square in the actor's frame without the drift it carries now, and its silhouette. A plane laid on the floor is not read. */
  protected footprintOf(slot: PlaneSlot): Footprint {
    const s = slot.mesh.scale;
    const usable = !slot.scale.prone && !slot.tip && slot.mesh.rotation.z === 0;
    return {
      cx: slot.mesh.position.x - slot.align,
      cy: slot.mesh.position.y,
      width: Math.abs(s.x),
      height: Math.abs(s.y),
      mirror: s.x < 0 ? -1 : 1,
      mask: usable ? slot.meta.silhouette ?? null : null,
      head: slot.meta.head ?? null,
    };
  }

  /** W5: write each plane's drift for this frame: its full shift times the weight of its fade while a blend runs, none otherwise (and the shift is forgotten once the blend is over). */
  protected alignPlanes(): void {
    const running = this.blend.blending;
    for (const slot of this.slots) {
      if (!running) slot.meet = 0;
      const want = slot.meet * alignWeight(slot.fade);
      if (want !== slot.align) {
        slot.align = want;
        this.placeSlot(slot);
      }
    }
  }

  /**
   * Free a texture that has just been replaced, but only if this actor owns it
   * and no other pose name still points at it.
   */
  protected retire(previous: PaintedTexture | undefined): void {
    if (!previous || !this.owned.has(previous.texture)) return;
    for (const p of this.poses.values()) {
      if (p.texture === previous.texture) return;
    }
    this.owned.delete(previous.texture);
    previous.texture.dispose();
  }

  protected syncOpacity(): void {
    for (const slot of this.slots) {
      const o = slot.fade * this._alpha;
      slot.material.uniforms['opacity']!.value = o;
      slot.mesh.visible = this.showFigure && o > 0.001;
      // Only the dominant plane casts, so a crossfade never doubles the shadow.
      if (this.castsShadow) slot.mesh.castShadow = slot.fade > 0.5 && this._alpha > 0.3;
    }
  }

  /** Where the camera lies from here, as a yaw in degrees. From the renderer. */
  private noteViewCamera(camera: Camera): void {
    const here = this.getWorldPosition(yawScratchA);
    const eye = camera.getWorldPosition(yawScratchB);
    const dx = eye.x - here.x;
    const dz = eye.z - here.z;
    if (dx === 0 && dz === 0) return;
    this.viewAzimuth = Math.atan2(dx, dz) * RAD2DEG;
  }

  /** -1 when this pose has to be flipped to face the way the body is turned. */
  protected mirrorOf(meta: PoseMeta): 1 | -1 {
    return mirrorFor(meta.facing ?? this.artFacing, this.facing);
  }

  /** True when the plane on screen is drawn mirrored. Debug + tests. */
  get mirrored(): boolean {
    return this.mirrorOf(this.slots[this.active]!.meta) === -1;
  }

  protected placeSlot(slot: PlaneSlot): void {
    placePlane(slot.mesh, slot.scale, slot.meta, this.proneShift);
    const dx = this.poseShiftPx?.[slot.pose];
    if (dx) slot.mesh.position.x += dx * slot.scale.unitsPerPixel * (slot.mesh.scale.x < 0 ? -1 : 1);
    slot.mesh.position.x += this.registrationShift(slot);
    slot.mesh.position.x += slot.align; // W5: the aligned dissolve's drift (0 outside one)
    if (slot.tip) placeTipped(slot.mesh, slot.tip, slot.meta, slot.scale); // FA-2: the KO's topple, on top of the placement above
  }

  /** FA-2 and FA-3 (`KoTip.ts`, called by `fx/mix/living.ts`): tip one plane about its feet (or put it upright with null) and place it again at once. */
  tipSlot(slot: PlaneSlot, tip: SlotTip | null): void {
    slot.tip = tip;
    this.placeSlot(slot);
  }

  /**
   * Release 39 pose registration (`PoseRegistration.ts`): a plane is centred on the actor by its PNG, but a pose's feet are not
   * at its PNG's middle, so the figure slid across the floor whenever the pose changed. Each plane is slid so the point the
   * figure stands on sits where the idle's does. Only measured, standing poses move; the idle itself never does.
   */
  protected registrationShift(slot: PlaneSlot): number {
    const ref = this.reference;
    const at = slot.meta.stanceX;
    if (!ref || ref === slot.meta || ref.stanceX === undefined || at === undefined || slot.scale.prone || this.referenceUpp <= 0) return 0;
    return stanceShift(
      { stanceX: at, width: slot.meta.width, unitsPerPixel: slot.scale.unitsPerPixel, mirror: slot.mesh.scale.x < 0 ? -1 : 1 },
      { stanceX: ref.stanceX, width: ref.width, unitsPerPixel: this.referenceUpp, mirror: this.mirrorOf(ref) },
    );
  }

  /** Slide a prone body along the floor, world units (`ProneLay` picks it). */
  setProneShift(dx: number): void {
    this.proneShift = dx;
    for (const slot of this.slots) this.placeSlot(slot);
  }

  protected applyMirror(): void {
    for (const slot of this.slots) {
      slot.mesh.scale.x = Math.abs(slot.mesh.scale.x) * this.mirrorOf(slot.meta);
      this.placeSlot(slot);
    }
    // The rim direction is in the painting's own space, so it follows the
    // mirror, not the body: flipping the plane flips where its light comes from.
    const m = this.mirrorOf(this.slots[this.active]!.meta);
    this.u.rimDir.value.set(this.rimDirBase.x * m, this.rimDirBase.y);
  }

  /** 0 while standing, 1 once a prone pose has fully crossfaded in. */
  protected proneWeight(): number {
    let total = 0;
    let prone = 0;
    for (const slot of this.slots) {
      if (slot.fade <= 0) continue;
      total += slot.fade;
      if (slot.scale.prone) prone += slot.fade;
    }
    return total > 0 ? prone / total : 0;
  }

  /** Footprint radius blended across the crossfade, in world units. */
  protected footprintRadius(): number {
    let total = 0;
    let sum = 0;
    for (const slot of this.slots) {
      if (slot.fade <= 0) continue;
      total += slot.fade;
      sum += slot.scale.footprint * slot.fade;
    }
    return total > 0 ? sum / total : 0;
  }

  /**
   * The height VFX should aim at: the standing height normally, but the top of
   * the actual plane once the figure is on the ground — a damage number over a
   * KO'd character belongs just above the body, not where his head used to be.
   */
  protected get aimHeight(): number {
    const slot = this.slots[this.active]!;
    return slot.scale.prone ? Math.max(0.2, slot.scale.topY) : this.worldHeight;
  }
}
