import { CanvasTexture, CircleGeometry, Mesh, MeshBasicMaterial, Vector3, type Object3D, type PerspectiveCamera } from 'three';
import { findFigure } from './cavern-stolen-fayth-cast.ts';

// ---------------------------------------------------------------------------
// PR-0072: Vegnagun stands on the Farplane (FFX-2 only, Chapter V)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]; Chapter V's colossus staging
// (option A, `farplane-colossus.ts`) and nothing else.
//
// The parts are pinned where the approved frames put them (Bailey, D-228), and
// the tail stands sunk below the plain (y -1.4), so its painted base meets the
// plain on screen in front of where its feet are. Its own contact shadow, at
// its feet, lay under the plain and behind its painting; round 7's PR-0072 saw
// "no cast shadow or contact pool". So each part's shadow is drawn where the
// part meets the plain *on screen*: on the plain (y 0), along the camera's ray
// through the part's feet point, sized for that distance. A part standing on
// the plain (the leg, the body) gets it at its feet; a part floating above the
// camera's eye (the head) meets no plain and gets none, as a hovering figure
// keeps none. The part's own blob is hidden while this one stands in for it.
// No part moves, no painting changes.

const FLOOR_Y = 0.012;
/** A dark, soft pool, as the girls' contact shadows are drawn (`PaintedActor`, navy at about 0.5). */
const OPACITY = 0.55;
const COLOR = 0x050a14;
const SQUASH = 0.34;

function blobTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/** Where the camera's ray through `feet` meets the plain, or null when it never does (a floating part). */
export function contactOnPlain(eye: Vector3, feet: Vector3, out = new Vector3()): Vector3 | null {
  if (feet.y >= eye.y) return null;
  if (feet.y >= -0.05) return out.set(feet.x, FLOOR_Y, feet.z); // standing on the plain
  const t = (eye.y - FLOOR_Y) / (eye.y - feet.y);
  return out.subVectors(feet, eye).multiplyScalar(t).add(eye);
}

type Part = Object3D & { shadow?: Object3D | null; worldHeight?: number; alpha?: number };

/** The staged part ids, latest link first. */
const PART_IDS: readonly string[] = ['vegnagun-head', 'vegnagun-body', 'vegnagun-leg', 'vegnagun-tail'];

export class ColossusContactShadow {
  readonly mesh: Mesh;
  private readonly eye = new Vector3();
  private readonly feet = new Vector3();
  private readonly at = new Vector3();

  constructor(parent: Object3D) {
    const map = blobTexture();
    const mat = new MeshBasicMaterial({ color: COLOR, transparent: true, opacity: OPACITY, depthWrite: false, ...(map ? { map } : {}) });
    this.mesh = new Mesh(new CircleGeometry(1, 40), mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 4;
    this.mesh.name = 'colossus-contact-shadow';
    this.mesh.visible = false;
    parent.add(this.mesh);
  }

  hide(): void {
    this.mesh.visible = false;
  }

  /** Each frame: the latest staged part's contact, from where the camera stands. */
  update(root: Object3D | null, camera: PerspectiveCamera | null): void {
    const part = PART_IDS.map((id) => findFigure(root, id) as unknown as Part | null).find((p) => p !== null) ?? null;
    if (!part || !camera) {
      this.hide();
      return;
    }
    if (part.shadow) part.shadow.visible = false;
    part.getWorldPosition(this.feet);
    camera.getWorldPosition(this.eye);
    const hit = contactOnPlain(this.eye, this.feet, this.at);
    if (!hit) {
      this.hide();
      return;
    }
    // Sized as the part's own blob was (its world height x 0.36), for the distance it is seen at.
    const k = this.eye.distanceTo(hit) / Math.max(1e-3, this.eye.distanceTo(this.feet));
    const r = (part.worldHeight ?? 10) * 0.36 * k;
    this.mesh.position.copy(hit);
    this.mesh.scale.set(r, r * SQUASH, 1);
    const mat = this.mesh.material as MeshBasicMaterial;
    mat.opacity = OPACITY * Math.max(0, Math.min(1, part.alpha ?? 1));
    this.mesh.visible = true;
  }
}
