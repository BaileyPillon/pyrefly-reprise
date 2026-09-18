/**
 * Photo mode — the pause screen with every piece of chrome taken away.
 *
 * The player presses F on the pause menu, the whole menu disappears, and what
 * is left is the diorama as the renderer already has it: the same frame that
 * was underneath the pause art, still being drawn every tick, still frozen.
 * Arrow keys or a mouse drag swing the camera a little way around what it was
 * already looking at, Z pushes in, Esc puts everything back.
 *
 * ## Why this moves the renderer's camera and not the BattleCamera
 *
 * `src/engine/BattleCamera.ts` owns the named rigs and the moves between them,
 * and it is a battle-presentation concern with another agent's hands on it.
 * Photo mode wants neither: it is not a rig, it must not be recorded as one,
 * and it has to be exactly undoable. So it borrows `Renderer.camera` — the
 * one object the frozen `lastRendered` pair is still pointing at — records its
 * position and orientation on entry, and writes them back verbatim on exit.
 *
 * That is only safe *because* the screen underneath is frozen: `App` does not
 * call `update()` on a screen with an overlay over it, so nothing else is
 * touching the camera for as long as photo mode is up, and there is no
 * interpolation to fight. Outside a pause overlay this class would be wrong.
 *
 * ## Orbit model
 *
 * A turntable around a pivot, not a free-look: the pivot is the point the
 * camera was already looking at (its forward ray at {@link FOCUS_DISTANCE},
 * which is roughly where a staged actor stands on our dioramas), and yaw /
 * pitch / dolly move the camera on a sphere around it. Pitch is clamped well
 * short of the poles and yaw is clamped to a narrow arc, because "a little" is
 * the brief: a painted 2.5D diorama has nothing painted on its far side, and
 * letting the player swing behind it would show them the backs of the
 * billboards.
 */

import { Spherical, Vector3, type PerspectiveCamera } from 'three';

/** Metres along the camera's forward ray to put the orbit pivot. */
export const FOCUS_DISTANCE = 7.5;

/** Yaw is clamped to +/- this, in radians (~22 degrees each way). */
export const YAW_LIMIT = 0.38;
/** Pitch is clamped to +/- this from where it started, in radians (~14 degrees). */
export const PITCH_LIMIT = 0.25;
/** Dolly range as a multiplier on the starting radius. */
export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 1.25;

/** Radians per second while an arrow key is held. */
const KEY_ORBIT_SPEED = 0.55;
/** Radians per pixel of mouse drag. */
const DRAG_SPEED = 0.0045;
/** Radius multiplier per second while Z is held. */
const ZOOM_SPEED = 0.45;

export interface PhotoModeOptions {
  camera: PerspectiveCamera;
  /** Everything to hide while photo mode is up — the pause menu's own root. */
  chrome: HTMLElement;
  /** Where to mount the one surviving hint line. */
  root: HTMLElement;
  /** Called when the player backs out (Esc, or a click on the hint). */
  onExit: () => void;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export class PhotoMode {
  private readonly opts: PhotoModeOptions;
  private readonly pivot = new Vector3();
  private readonly spherical = new Spherical();
  private readonly startPosition = new Vector3();
  private readonly startQuaternion: PerspectiveCamera['quaternion'];
  private readonly startTheta: number;
  private readonly startPhi: number;
  private readonly startRadius: number;

  private hintEl: HTMLElement | null = null;
  private dragging = false;
  private lastPointer: { x: number; y: number } | null = null;
  private disposed = false;

  constructor(opts: PhotoModeOptions) {
    this.opts = opts;
    const camera = opts.camera;

    this.startPosition.copy(camera.position);
    this.startQuaternion = camera.quaternion.clone();

    // The pivot is wherever the camera was already pointing. `getWorldDirection`
    // reads the camera's own matrix, so this works from any rig without the
    // scene having to tell us what it framed.
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    this.pivot.copy(camera.position).addScaledVector(forward, FOCUS_DISTANCE);

    this.spherical.setFromVector3(new Vector3().subVectors(camera.position, this.pivot));
    this.startTheta = this.spherical.theta;
    this.startPhi = this.spherical.phi;
    this.startRadius = this.spherical.radius;

    opts.chrome.dataset['photo'] = 'on';
    this.mountHint();
    this.attachPointer();
  }

  /** The hint strip is the only thing photo mode leaves on screen. */
  private mountHint(): void {
    const el = document.createElement('div');
    el.className = 'pause__photo-hint';
    el.innerHTML =
      '<b>&#9664; &#9654; &#9650; &#9660;</b> LOOK <span>&middot;</span> <b>DRAG</b> LOOK <span>&middot;</span> <b>Z</b> ZOOM <span>&middot;</span> <b data-action="photo:exit" role="button" tabindex="0">ESC</b> BACK';
    this.opts.root.appendChild(el);
    this.hintEl = el;
  }

  private attachPointer(): void {
    const canvasRoot = document.body;
    canvasRoot.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (this.hintEl?.contains(e.target as Node)) return;
    this.dragging = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging || !this.lastPointer) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.orbit(-dx * DRAG_SPEED, -dy * DRAG_SPEED);
  };

  private readonly onPointerUp = (): void => {
    this.dragging = false;
    this.lastPointer = null;
  };

  /**
   * Move the camera by a yaw/pitch delta, clamped to the arc photo mode is
   * allowed to see, and write the result back to the camera.
   */
  private orbit(dTheta: number, dPhi: number): void {
    this.spherical.theta = clamp(
      this.spherical.theta + dTheta,
      this.startTheta - YAW_LIMIT,
      this.startTheta + YAW_LIMIT,
    );
    this.spherical.phi = clamp(
      this.spherical.phi + dPhi,
      this.startPhi - PITCH_LIMIT,
      this.startPhi + PITCH_LIMIT,
    );
    this.apply();
  }

  private dolly(factor: number): void {
    this.spherical.radius = clamp(
      this.spherical.radius * factor,
      this.startRadius * ZOOM_MIN,
      this.startRadius * ZOOM_MAX,
    );
    this.apply();
  }

  private apply(): void {
    const camera = this.opts.camera;
    camera.position.copy(this.pivot).add(new Vector3().setFromSpherical(this.spherical));
    camera.lookAt(this.pivot);
    camera.updateMatrixWorld();
  }

  /**
   * One frame of held-key movement.
   *
   * Driven from the pause screen's `update`, which the App loop still calls
   * every frame (the overlay is the top screen; it is the screen *below* that
   * is frozen), so this is real, frame-rate-independent motion.
   */
  update(dt: number, held: { left: boolean; right: boolean; up: boolean; down: boolean; zoom: boolean }): void {
    if (this.disposed) return;
    const yaw = (held.left ? 1 : 0) - (held.right ? 1 : 0);
    const pitch = (held.up ? 1 : 0) - (held.down ? 1 : 0);
    if (yaw !== 0 || pitch !== 0) this.orbit(yaw * KEY_ORBIT_SPEED * dt, pitch * KEY_ORBIT_SPEED * dt);
    if (held.zoom) this.dolly(1 - ZOOM_SPEED * dt);
  }

  /** Current framing, for the debug snapshot and the tests. */
  snapshot(): Record<string, number> {
    return {
      yaw: Number((this.spherical.theta - this.startTheta).toFixed(4)),
      pitch: Number((this.spherical.phi - this.startPhi).toFixed(4)),
      zoom: Number((this.spherical.radius / this.startRadius).toFixed(4)),
    };
  }

  /** Put the camera and the chrome back exactly as they were. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const camera = this.opts.camera;
    camera.position.copy(this.startPosition);
    camera.quaternion.copy(this.startQuaternion);
    camera.updateMatrixWorld();
    delete this.opts.chrome.dataset['photo'];
    this.hintEl?.remove();
    this.hintEl = null;
    document.body.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  /** Back out. The screen supplies what "back" does. */
  exit(): void {
    this.opts.onExit();
  }
}
