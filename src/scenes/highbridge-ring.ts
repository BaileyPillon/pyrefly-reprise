import { DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, type Object3D, type Texture } from 'three';
import { artUrl, tryLoadTexture } from '../engine/PaintedArt.ts';
import { findFigure } from './cavern-stolen-fayth-cast.ts';

// ---------------------------------------------------------------------------
// Seymour Natus's stone ring, turning behind him (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]: Chapter X's own figure.
//
// On whose word: O-1 A (D-093, Bailey 2026-09-24, "I'll go with your
// recommendations for all"): the ring drawn BEHIND the figure as its own layer,
// and its rotation, both labelled OURS, not sourced
// (`public/art/characters/seymour-natus/idle.json` `layers`, and
// `docs/concepts/chapters/natus/INSTALLED.md`: "Turning it is presentation work").
//
// The painting is `public/art/characters/seymour-natus-ring/idle.png` (1006 x
// 1006, judge-locked set chapter:natus), scaled to the idle's composite: its
// diameter is 974 idle px and its centre sits at idle (346, 469), with the
// idle's feet at y 1148. The ring PNG is at the idle's pixel scale, 1006 px
// square around that 974 px circle. So on a Natus `h` world units tall (the
// stage sizes the painting's baseline span to `h`) the plane is 1006/1148 h
// across (the stone 974/1148 h) and its centre (1148-469)/1148 h above his
// feet, on his own centre line.
//
// A scene owns no actors (`src/scenes/types.ts`), so this reads the staged
// figure by its combatant id, as the Cavern does (`cavern-stolen-fayth-cast.ts`),
// and follows it: position, alpha and visibility. Presentation only: it never
// touches battle state, and on any other field it finds nothing and hides.

/** Natus's combatant id, mirrored from `src/battle/ffx/ai/seymour-natus-rules.ts` (`NATUS_ID`). */
export const NATUS_FIGURE_ID = 'seymour-natus';

/** The ring against the idle painting, from the sidecars (see the module note). */
export const NATUS_RING = {
  url: 'art/characters/seymour-natus-ring/idle.png',
  /** The painted stone's diameter over the idle's baseline span (the idle sidecar's `ringDiameterPx`). */
  diameter: 974 / 1148,
  /** The ring PNG's side over the idle's baseline span: the plane the stone is drawn on. */
  plane: 1006 / 1148,
  /** Centre height over the idle's baseline span. */
  centreY: (1148 - 469) / 1148,
  /** Behind him, away from the camera, so it always draws under the figure. */
  behind: 0.2,
  /** One turn every 48 s: slow enough to read as stone, ours. */
  turnPerSecond: (Math.PI * 2) / 48,
} as const;

/** The duck-typed alpha a staged figure carries (`PaintedActor.alpha`). */
interface Faded extends Object3D {
  readonly alpha?: number;
}

/** The ring layer: add `mesh` to the scene group, call `update` every frame. */
export class NatusRing {
  readonly mesh: Mesh;
  private readonly material: MeshBasicMaterial;
  private texture: Texture | null = null;
  private angle = 0;

  constructor(private readonly figureHeight: number) {
    this.material = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, fog: false });
    this.mesh = new Mesh(new PlaneGeometry(1, 1), this.material);
    this.mesh.name = 'natus-ring';
    this.mesh.visible = false;
    const d = NATUS_RING.plane * figureHeight;
    this.mesh.scale.set(d, d, 1);
  }

  /** Load the painting; with no painting the ring simply never shows. */
  async load(): Promise<void> {
    const tex = await tryLoadTexture(artUrl(NATUS_RING.url));
    if (!tex) return;
    this.texture = tex;
    this.material.map = tex;
    this.material.needsUpdate = true;
  }

  /** Follow Natus under `root` (the three.js scene the stage parents actors in). */
  update(dt: number, root: Object3D | null): void {
    const natus = findFigure(root, NATUS_FIGURE_ID) as Faded | null;
    const alpha = natus && natus.visible ? (natus.alpha ?? 1) : 0;
    this.mesh.visible = this.texture !== null && alpha > 0.01;
    if (!natus || !this.mesh.visible) return;
    this.angle = (this.angle + dt * NATUS_RING.turnPerSecond) % (Math.PI * 2);
    this.mesh.rotation.z = this.angle;
    this.mesh.position.set(
      natus.position.x,
      natus.position.y + NATUS_RING.centreY * this.figureHeight,
      natus.position.z - NATUS_RING.behind,
    );
    this.material.opacity = alpha;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture?.dispose();
    this.mesh.removeFromParent();
  }
}
