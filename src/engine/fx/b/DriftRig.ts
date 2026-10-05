import { Vector3, type PerspectiveCamera } from 'three';
import type { BattleCamera } from '../../BattleCamera.ts';
import { eyeCandy, type FxTier } from '../EyeCandy.ts';
import { calmedDrift, menuCalm } from '../mix/menuCalm.ts';
import { DRIFT_FFX, DRIFT_FFX2, DriftEnvelope, arcTurn, driftAt, easeWeight, type DriftOffset, type DriftSpec } from './CameraDrift.ts';

/**
 * LIVING PAINTINGS' camera drift on the live camera (B2, moved out of `LivingPaintings.ts` unchanged so
 * that file stays under 400 lines, rule 7): the neutral rig's arcing Lissajous, eased in once the rig is
 * still and cut to zero on every move, plus REDUCE MOTION's hold on the rig's own idle sway. The maths is
 * `CameraDrift.ts`; this class only reads and writes the three.js camera.
 *
 * Game case: both (FFX at the tuned periods, FFX-2 at 0.8 of them). One fight asks for more: Chapter III's row calms the drift while a command
 * menu is open (FFX only; `mix/menuCalm.ts`, `mix/stageTable.ts`): the amplitude shrinks and the camera leans to its right, eased in and out over a second.
 */

const TIER_DRIFT: Record<FxTier, number> = { full: 1, phone: 0.6, low: 0.5 };

export interface DriftHost {
  camera: PerspectiveCamera;
  rigName: () => string;
  battleCamera: BattleCamera;
}

export class DriftRig {
  readonly spec: DriftSpec;
  /** The drift's own weight this frame (0..1 times the dial and the tier). */
  now = 0;
  /** This frame's offset (already weighted), or null when nothing drifts. */
  offset: DriftOffset | null = null;
  private readonly env = new DriftEnvelope();
  private readonly prevRaw = new Vector3();
  private hasPrev = false;
  private swayBase: number | null = null;

  /** @param scale the room's own multiplier on the drift's amplitude (`RoomSpec.drift`) */
  constructor(private readonly host: DriftHost, game: 'ffx' | 'ffx2', scale = 1) {
    const base = game === 'ffx2' ? DRIFT_FFX2 : DRIFT_FFX;
    this.spec = scale === 1 ? base : { ...base, lateral: base.lateral * scale, vertical: base.vertical * scale, dolly: base.dolly * scale };
  }

  /** Reduce motion zeroes the rig's idle sway while option B is on (main never did). */
  holdSway(zero: boolean): void {
    const bc = this.host.battleCamera as unknown as { swayAmplitude: number };
    if (zero) {
      if (this.swayBase === null) this.swayBase = bc.swayAmplitude;
      bc.swayAmplitude = 0;
    } else this.restoreSway();
  }

  restoreSway(): void {
    if (this.swayBase === null) return;
    (this.host.battleCamera as unknown as { swayAmplitude: number }).swayAmplitude = this.swayBase;
    this.swayBase = null;
  }

  /** One frame, after the rig has placed the camera; `time` is the room's clock. */
  update(dt: number, time: number, rm: boolean, tier: FxTier): void {
    const cam = this.host.camera;
    menuCalm.step(dt); // every frame, drifting or not: the calm follows the menu in real time
    let moving = false;
    if (dt > 0) {
      if (this.hasPrev) moving = cam.position.distanceTo(this.prevRaw) / dt > 0.25;
      this.prevRaw.copy(cam.position);
      this.hasPrev = true;
    }
    const bc = this.host.battleCamera;
    const rig = this.host.rigName();
    const allowed = !rm && rig === 'idle' && bc.pushAmount === 0 && bc.rollDeg === 0 && !moving && eyeCandy.sub('b', 'drift');
    const w = easeWeight(this.env.update(dt, allowed)) * eyeCandy.dial('drift') * TIER_DRIFT[tier];
    this.now = w;
    this.offset = null;
    if (w <= 0) return;
    const raw = driftAt(time, this.spec, w);
    const calm = menuCalm.active;
    const d = calm ? calmedDrift(raw, calm, menuCalm.weight, w) : raw;
    this.offset = d;
    const q = cam.quaternion;
    const right = new Vector3(1, 0, 0).applyQuaternion(q);
    const up = new Vector3(0, 1, 0).applyQuaternion(q);
    const fwd = new Vector3(0, 0, -1).applyQuaternion(q);
    cam.position.addScaledVector(right, d.x).addScaledVector(up, d.y).addScaledVector(fwd, d.z);
    const look = bc.getRig(rig)?.lookAt;
    const dist = look ? cam.position.distanceTo(look instanceof Vector3 ? look : new Vector3(...look)) : 11;
    const turn = arcTurn(d.x, d.y, dist);
    cam.rotateY(turn.yaw);
    cam.rotateX(turn.pitch);
    cam.updateMatrixWorld();
  }
}
