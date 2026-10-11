import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, type Object3D, type Texture } from 'three';
import { paintedCanvasTexture } from './PaintedArt.ts';
import { radialCanvas } from './ProceduralArt.ts';
import { PUFFS, PUFF_COLOUR, puffAt } from './KoFall.ts';

/**
 * The DUST PUFF of a fall and of a revive (FA-2 and FA-3, P1-B: "dust, not pyreflies"; both games): six soft, pale discs that grow, drift up and fade
 * where the body lies, drawn over the figure. The numbers are the Motion Options page's (`KoFall.puffAt`); this file is only the quads.
 *
 * Not on `QuadField`: that is a wrapping ambient field whose puffs repeat on a seeded phase, and a one-shot needs a clock of its own. Six CPU-driven quads
 * cost nothing and write no shader blind. Dust, not pyreflies: pyreflies belong to the dead and the departing (`pyreflyCanon.ts`), and a body that falls is
 * neither.
 *
 * A child of the actor (not of the plane group, which squashes on the landing), so it is placed in the actor's frame; `x` is the lying body's middle.
 */

/** A human is 1.75 tall; the puff's numbers are for one (`KoFall.PUFFS`), and a taller or shorter figure scales them. */
const HUMAN = 1.75;
/** The puff sits this far over the floor to begin with (the page's 5 px), and in front of the planes. */
const LIFT = 0.037;
const FRONT = 0.3;
/** Drawn after the figure (its planes are 10). */
const ORDER = 12;
/** The page squashes the discs to 0.62 of their height, so they read as dust on a floor. */
const FLATTEN = 0.62;

let shared: Texture | null = null;
function dustTexture(): Texture {
  shared ??= paintedCanvasTexture(radialCanvas(128, [[0, 1], [0.5, 0.5], [1, 0]]));
  return shared;
}

export class KoPuff {
  readonly group = new Group();
  private readonly quads: Mesh[] = [];
  private readonly k: number;
  private age = -1;
  private size = 1;
  private cx = 0;
  private len = 1;

  /** @param parent the actor; @param worldHeight its standing height. */
  constructor(parent: Object3D, worldHeight: number) {
    this.k = worldHeight / HUMAN;
    this.group.name = 'ko-puff';
    for (let i = 0; i < PUFFS.length; i++) {
      const mat = new MeshBasicMaterial({ map: dustTexture(), color: PUFF_COLOUR, transparent: true, depthWrite: false, depthTest: true, opacity: 0 });
      const quad = new Mesh(new PlaneGeometry(1, 1), mat);
      quad.renderOrder = ORDER;
      quad.visible = false;
      this.quads.push(quad);
      this.group.add(quad);
    }
    parent.add(this.group);
  }

  /** Whether a puff is up. */
  get playing(): boolean {
    return this.age >= 0;
  }

  /** Let a puff go up at `cx` (the lying body's middle, in the actor's frame), `len` long (the body's length), at `size` (1 a fall's, 0.6 a revive's). */
  start(size: number, cx: number, len: number): void {
    this.size = size;
    this.cx = cx;
    this.len = len;
    this.age = 0;
    this.layout();
  }

  /** Move it on by `ms` of real time. */
  update(ms: number): void {
    if (this.age < 0) return;
    this.age += Math.max(0, ms);
    this.layout();
  }

  private layout(): void {
    let any = false;
    this.quads.forEach((quad, i) => {
      const p = puffAt(this.age, i, this.size);
      quad.visible = p !== null;
      if (!p) return;
      any = true;
      const r = p.radius * this.k;
      quad.scale.set(2 * r, 2 * r * FLATTEN, 1);
      quad.position.set(this.cx + p.ox * this.len, LIFT * this.k + p.rise * this.k, FRONT);
      (quad.material as MeshBasicMaterial).opacity = p.alpha;
    });
    if (!any && this.age > 0) this.age = -1; // every puff has gone
  }

  dispose(): void {
    for (const quad of this.quads) {
      quad.geometry.dispose();
      (quad.material as MeshBasicMaterial).dispose();
    }
    this.group.removeFromParent();
    this.age = -1;
  }
}
