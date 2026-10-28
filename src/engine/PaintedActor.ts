import { MeshBasicMaterial, type Texture } from 'three';
import { approach } from './BattlePresenterActors.ts';
import { PaintedArt } from './PaintedArt.ts';
import { syncPaintedBloom } from './BloomMask.ts';
import { shadowX } from './feel/ContactShadow.ts'; // `?shadow=follow` (demo chapters, off by default): the contact shadow stays under the feet
import { shadowFollows } from './feel/FeelSwitch.ts';
import { paceRate } from './pace.ts';
import { curvesOn } from './motion/CurvesSwitch.ts';
import { squashPair } from './motion/ActorCurves.ts';
import { alignedSwapOn } from './PoseSwap.ts'; // W5: `?swap=aligned` (off by default), and the lunge's first frame (on; `?motion=classic` restores cubic-out)
import { proCriticalBreath } from './look/pro/ProBreath.ts'; // lane pro-look: the critical stance's slower, deeper breath (markers piece; off by default)
import { unpinRelight } from './look/relight/FigureRelight.ts'; // demo looks (dev flag `?look=`): light on the paintings, from their normal maps
import type { PaintedActorOptions } from './PaintedActorTypes.ts';
import { TAU, DEG2RAD, YAW_TAU, LIE_ANGLE, clamp01 } from './PaintedActorKit.ts';
import { PaintedActorReaders } from './PaintedActorReaders.ts';

// The options, the pose map and a pose's shape live in `PaintedActorTypes.ts`, the interim-yaw switch in `PaintedActorKit.ts` (a pure move, 2026-10-28); everything this file used to export still comes from here.
export type { PaintedActorOptions, PaintedActorRimOptions, PaintedActorShadowOptions, PoseMap, PoseShape, PoseSwapOptions } from './PaintedActorTypes.ts';
export { isInterimYawEnabled, setInterimYawEnabled } from './PaintedActorKit.ts';

/**
 * A painted character in the 2.5D scene.
 *
 * A `THREE.Group` holding **two** textured planes (so poses crossfade rather
 * than popping) plus a soft contact shadow on the ground. Sizing is driven by a
 * *world height*, not by pixels: a human is 1.8 world units tall whether the
 * painting is 900 px or 1600 px, and the figure's feet — `baselineY` from the
 * sidecar JSON — sit exactly on the group's origin.
 *
 * On top of the pose animation sit independent procedural motion layers that
 * **stack**: breathing, sway, lunge, recoil, squash, hop and shake all
 * contribute to one transform each frame, so an actor can be mid-lunge, mid-hop
 * and shaking without any of them fighting.
 *
 * Over those sits the **life layer** (`BattlePresenterActors.ts`): the pose name
 * is also a *state*, so `setPose('ready')` leans the fighter forward and lights
 * the turn ring under their feet, `setPose('defend')` braces them, `setPose`
 * ('ko') drops the body, a revive brings it back up with a glow, and `recoil`
 * flinches through the `hurt` painting with a warm tint. The presenter did not
 * have to learn any of it: it still just names poses.
 *
 * **Facing is two numbers, not one.** The body's facing (party +x, enemies -x)
 * aims the lunge and the lean; whether the *plane* is mirrored depends on which
 * way the painting was painted (`artFacing`, or the pose sidecar's `facing`).
 * Art that already faces the right way for its side is never flipped.
 *
 * On top of that sits the **interim turn**: until a subject is re-rendered to
 * the v3 contract (painted at ~45° toward the enemy), its straight-on plane is
 * *yawed* toward the other team so it is not addressing the camera mid-fight.
 * A pose whose sidecar already declares `right` or `left` is left flat.
 * `window.__pyrefly.interimYaw(false)` turns the whole thing off for an A/B.
 *
 * The API is deliberately parallel to {@link SpriteActor}: `update(dt)`,
 * `flash`, `shake`, `fadeTo`, `setAlpha`, `moveTo`, `setFacing`,
 * `setBrightness`, `dispose`.
 */
export class PaintedActor extends PaintedActorReaders {
  /** Build an actor and await its poses. Missing PNGs become placeholders. */
  static async create(opts: PaintedActorOptions = {}): Promise<PaintedActor> {
    const actor = new PaintedActor(opts);
    if (opts.poses) await actor.loadPoses(opts.poses, opts.initialPose);
    return actor;
  }

  /**
   * Build an actor from a painted **subject id**, the one-liner most scenes
   * want:
   *
   * ```ts
   * const tidus = await PaintedActor.fromSubject('tidus', { worldHeight: 1.75 });
   * ```
   *
   * Reads `public/art/characters/<id>/<state>.png` + `.json` through
   * {@link PaintedArt.load}, so a state without its own painting falls back to
   * `idle` and a subject with no painting at all falls back to a soft grey
   * silhouette (with a warning). Never rejects.
   */
  static async fromSubject(
    id: string,
    opts: Omit<PaintedActorOptions, 'poses'> & { states?: readonly string[] } = {},
  ): Promise<PaintedActor> {
    const { states, ...actorOpts } = opts;
    const subject = await PaintedArt.load(id, {
      ...(states ? { states } : {}),
      ...(actorOpts.matte ? { matte: actorOpts.matte } : {}),
      ...(actorOpts.fitBaseline !== undefined ? { fitBaseline: actorOpts.fitBaseline } : {}),
    });
    const actor = new PaintedActor({ name: id, ...actorOpts });
    // The sidecars are the art's own word on which way it faces; an explicit
    // option still wins, because a caller who says so has looked at the PNG.
    if (subject.facing && actorOpts.artFacing === undefined) actor.setArtFacing(subject.facing);
    actor.adoptPoses(subject.poses, actorOpts.initialPose);
    actor.subject = subject;
    return actor;
  }

  /**
   * @param dt seconds. Must be called every frame.
   * @param realDt the same frame's unscaled seconds (default `dt`): the pose blend runs on it, so neither a hit-stop that holds the field (`dt` 0) nor the pacing option stretches or freezes a crossfade (FB-1).
   */
  update(dt: number, realDt: number = dt): void {
    this.tweens.update(dt * paceRate('action')); // the pacing option (`pace.ts`): one-shot moves only, never the idle
    this.curves.advance(dt * 1000 * paceRate('action')); // motion pass (lane "core"): the new curves, sampled from accumulated PACED time (zero in a hit-stop, like the tweens)
    const cv = this.curves.out;
    if (this.blend.advance(realDt * 1000 * (curvesOn() ? paceRate('action') : 1))) this.syncOpacity(); // FB-1: the pose blend, on the real clock; with the new curves on the same pace as the moves it is scheduled from
    const held = this.blend.takeStart(); // PoseBlend rule 2: a request that waited for the weaker plane to be nearly gone starts now
    if (held) this.beginBlend(held.key, this.poses.get(held.key), held.plan);
    if (alignedSwapOn()) this.alignPlanes(); // W5: the aligned dissolve's drift follows the fades just written
    this.smear.step(realDt * 1000 * (curvesOn() ? paceRate('action') : 1)); // the smear window's amount, from the blend's progress; the cut-side anchor's glide runs on the blend's own clock, so it is cut and glide together at any pace (MF-18)
    for (const s of this.slots) syncPaintedBloom(s.material, this.u.dissolve.value > 0, this.bloomMasked);
    this.clock += dt;

    // --- how much of what is on screen is a downed figure ------------------
    // Blended across the crossfade, so the standing idle's breathing eases out
    // as the KO painting eases in rather than stopping dead.
    const prone = this.proneWeight();
    // A body rolled onto its back ({@link lieDown}) is down too: no breath, lean or crouch.
    const upright = (1 - prone) * (1 - this.lieRoll);

    // --- life: posture eases toward whatever state we are in ---------------
    this.life?.update(dt);
    const p = this.life?.posture;
    const lean = p ? p.lean * this.worldHeight : 0;
    const crouch = p ? p.crouch * this.worldHeight : 0;
    const tilt = p ? p.tilt : 0;

    // --- stack the motion layers into one transform ------------------------
    // Breathing runs on its own phase accumulator rather than off the clock, so
    // a fighter holding their breath to guard — and letting it go again — eases
    // between tempos instead of jumping a quarter-cycle.
    const critBreath = this.breatheAmp > 0 ? proCriticalBreath(this.pose) : null; // a figure that breathes at all, in the low-HP stance, under the pro markers
    this.breathPhase += dt * (critBreath ? critBreath.speed : this.breatheSpeed) * (p ? p.tempo : 1);
    const breatheAmp = (critBreath ? Math.max(this.breatheAmp, critBreath.amplitude) : this.breatheAmp) * upright * (p ? p.breathe : 1);
    const breathe = breatheAmp ? Math.sin(this.breathPhase * TAU) * 0.5 + 0.5 : 0;
    const breatheScale = 1 + breatheAmp * (breathe - 0.5) * 2;

    const sq = squashPair(this.squashAmount, cv.sy, curvesOn(), this.squashScratch); // today's 18/14 percent, or the subtle volume-preserving family with the new curves on

    const hit = this.hit.step(dt * 1000, dt * 1000 * paceRate('action'), this.hitOut); // MF-03: nothing (sy 1) unless `?hit=` asked for a reaction
    this.inner.scale.set(sq.x / hit.sy, breatheScale * sq.y * hit.sy, 1);

    const hover =
      this.hoverHeight +
      (this.hoverBobAmp
        ? Math.sin(this.clock * this.hoverBobSpeed * TAU) * this.hoverBobAmp
        : 0);

    // The lean rides with the lunge: both are "forward" for this fighter, and
    // forward is the body's facing, never the mirror.
    let ox = (this.lungeOffset + this.recoilOffset + cv.x + lean * upright) * this.facing;
    let oy =
      this.hopHeight + cv.lift + hover - (crouch + this.fallDrop * this.fallGain * this.worldHeight * 0.05) * upright;

    this.smear.track(ox, oy, dt, realDt); // how fast the figure moves, before the shake: the smear's planner reads it

    if (this.shakeLeftMs > 0) {
      this.shakeLeftMs -= dt * 1000;
      const k = Math.max(0, this.shakeLeftMs / this.shakeTotalMs);
      this.shakePhase += dt * 62;
      ox += Math.sin(this.shakePhase) * this.shakeAmp * k;
      oy += Math.sin(this.shakePhase * 1.63) * this.shakeAmp * k * 0.42;
    }
    ox += hit.x;
    oy += hit.y;

    const lie = this.lieRoll * LIE_ANGLE * this.facing;
    const [lieDx, lieLift, lieDz] = this.lieOffset(lie);
    ox += lieDx;
    oy += lieLift;
    this.inner.position.set(ox, oy, lieDz);
    // Sway is a standing figure's weight shifting; on a body lying down it only
    // wobbles the painting and shows the corners of the PNG's rectangle.
    const swayAmp = this.swayAmp * upright;
    const sway = swayAmp ? Math.sin(this.clock * this.swaySpeed * TAU) * swayAmp : 0;
    // Posture tilt is a *body* rotation (forward = the way the fighter is
    // turned, so it carries the facing), kept small and faded out with the pose.
    const bodyTilt = (tilt + cv.lean + this.fallTilt * this.fallGain * 0.3) * upright * -this.facing;
    this.inner.rotation.z = sway + bodyTilt + lie;
    this.inner.rotation.x = -this.lieTilt * this.lieRoll;

    // --- the interim turn --------------------------------------------------
    // The plane yawed toward the enemy, for art not yet repainted turned. It
    // rides on `inner` (both planes only: the shadow and turn ring stay flat on
    // the ground), and the lunge is applied after it, so "forward" stays world
    // ±x. Faded out with `upright` and the roll: a prone or lying painting is a
    // *wide* plane, and swinging one in depth shows the corners of its PNG.
    const yawWanted = this.yawTarget() * upright;
    if (this.yawPrimed) {
      this.appliedYaw = approach(this.appliedYaw, yawWanted, YAW_TAU, dt);
    } else {
      // The field opens already turned: nobody swings into their stance on the
      // first half-second of a battle (or mid-swing in a frame-2 capture).
      this.yawPrimed = true;
      this.appliedYaw = yawWanted;
    }
    this.inner.rotation.y = this.appliedYaw * DEG2RAD;

    // --- turn highlight ----------------------------------------------------
    if (this.turnRing) {
      const k = clamp01(this.ringOverride ?? (p ? p.ring : 0));
      const visible = k > 0.01 && this._alpha > 0.02;
      this.turnRing.visible = visible;
      if (visible) {
        const pulse = 0.82 + Math.sin(this.clock * 1.7) * 0.18;
        const r = this.ringBaseRadius * (0.93 + 0.07 * k) * (1 + 0.025 * pulse);
        this.turnRing.scale.set(r, r * 0.46, 1);
        const rm = this.turnRing.material as MeshBasicMaterial;
        rm.opacity = this.ringBaseOpacity * k * pulse * this._alpha;
      }
    }

    // --- selection accent --------------------------------------------------
    // Eased rather than switched, because the cursor moves between enemies on
    // every arrow press and a pool that pops on and off at 12 Hz is a strobe.
    if (this.accent) {
      this.accentLevel = approach(this.accentLevel, this.accentWanted, 0.075, dt);
      const visible = this.accentLevel > 0.01 && this._alpha > 0.02;
      this.accent.visible = visible;
      if (visible) {
        // A slow breathe, distinct from the turn ring's faster pulse, so the
        // two marks are still told apart when they land on the same figure.
        const pulse = 0.86 + Math.sin(this.clock * 2.4) * 0.14;
        if (this.accentHalo) {
          const r = Math.max(0.6, this.worldHeight * 0.62) * (0.97 + 0.05 * pulse);
          this.accent.scale.set(r, r, 1);
        } else {
          const r = Math.max(0.55, this.footprintRadius() * 1.35, this.worldHeight * 0.4);
          this.accent.scale.set(r * (1 + 0.03 * pulse), r * 0.44 * (1 + 0.03 * pulse), 1);
          this.accent.position.x = ox * 0.55;
          // On the floor even when the station lifts the figure (the Yu Pagodas stand at y 1.01): PR-0031.
          this.accent.position.y = 0.026 - this.position.y;
        }
        (this.accent.material as MeshBasicMaterial).opacity =
          0.72 * this.accentLevel * pulse * this._alpha;
      }
    }

    // --- contact shadow reacts to squash and hop ---------------------------
    if (this.shadow) {
      const lift = Math.min(1, (this.hopHeight + cv.lift + hover) / Math.max(0.001, this.worldHeight * 0.6));
      // Follow the pose's footprint: a body on the ground casts a long, flat
      // shadow under its whole length, not the standing figure's small disc.
      const base = Math.max(this.shadowBaseRadius, this.footprintRadius());
      const follow = shadowFollows();
      // Off the ground by a hop OR (the curves) a cast lift, the strike's arc or an FFX-2 leap: the lane "feel" asked for the sum here (feel/ContactShadow.ts).
      const air = follow ? this.shadowAir.step(dt, this.hopHeight + cv.lift, this.worldHeight) : null;
      const r = base * (1 + this.squashAmount * 0.3 + Math.max(0, 1 / cv.sy - 1) * 5) * (1 - lift * 0.42) * (air?.radius ?? 1); // the shadow spreads on a landing's squash (curves)
      // The wider the footprint, the flatter the blob, so a prone shadow does
      // not balloon into a circle the size of the body's length.
      const squash = this.shadowSquash * (this.shadowBaseRadius / Math.max(1e-4, base)) ** 0.5;
      this.shadow.scale.set(r, r * Math.min(this.shadowSquash, squash), 1);
      // Today 0.55 of the offset. The curves (lane "core") put the shadow under the feet through the lunge but leave the posture lean out; `?shadow=follow` (lane "feel") puts it
      // under the boots with all of the offset but a lying body's swing about its feet. Either switch alone does what its lane built; both on subtract both.
      const underFeet = curvesOn();
      this.shadow.position.x = underFeet ? ox - 0.45 * lean * upright * this.facing - (follow ? 0.45 * lieDx : 0) : shadowX(ox, lieDx, follow);
      const sm = this.shadow.material as MeshBasicMaterial;
      sm.opacity = this.shadowBaseOpacity * this._alpha * (1 - lift * 0.5) * (air?.opacity ?? 1);
    }
  }

  /**
   * Every texture this actor holds, the idle painting first (lane "prebuild": the demo uploads a figure's paintings behind the picker, `app/demo/prebuildDraw.ts`). Borrowed textures are included; the actor's own are what it frees.
   */
  heldTextures(): Texture[] {
    const out = new Set<Texture>();
    const idle = this.poses.get('idle');
    if (idle) out.add(idle.texture);
    for (const p of this.poses.values()) out.add(p.texture);
    for (const t of this.owned) out.add(t);
    return [...out];
  }

  override dispose(): void {
    this.tweens.killAll();
    unpinRelight(this.lightPins);
    this.lightPins.clear();
    this.cheerWait = null;
    this.hit.clear();
    this.curves.dispose();
    this.blend.cancel();
    for (const slot of this.slots) {
      slot.mesh.geometry.dispose();
      slot.material.dispose();
      slot.depth?.dispose();
    }
    // Only textures this actor loaded itself; borrowed ones may still be in
    // use by whoever lent them. The `Set` also collapses the several pose
    // names that share one texture when a state falls back to `idle`.
    for (const tex of this.owned) tex.dispose();
    this.owned.clear();
    this.poses.clear();
    if (this.shadow) {
      this.shadow.geometry.dispose();
      (this.shadow.material as MeshBasicMaterial).dispose();
    }
    if (this.turnRing) {
      this.turnRing.geometry.dispose();
      (this.turnRing.material as MeshBasicMaterial).dispose();
    }
    if (this.accent) {
      this.accent.geometry.dispose();
      (this.accent.material as MeshBasicMaterial).dispose();
      this.accent = null;
    }
    this.removeFromParent();
  }
}
