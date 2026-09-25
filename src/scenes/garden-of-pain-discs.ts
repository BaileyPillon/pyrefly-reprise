import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, type Camera, type Object3D, type Texture } from 'three';
import { artUrl, tryLoadTexture } from '../engine/PaintedArt.ts';
import { OMNIS_FACING_KEY } from '../engine/OmnisDiscTap.ts';

// ---------------------------------------------------------------------------
// The Garden of Pain's four Mortiphasms, painted (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]: Chapter XII, Seymour Omnis
// (`research/ffx-seymour-omnis.md` §2, §4.1, §4.3).
//
// On whose word: Bailey's O-2 B (2026-09-25, "I'll go with all your
// recommendations"): painted discs, the quarter that faces him lit. The art is
// installed and locked (`docs/concepts/chapters/omnis/INSTALLED.md`):
//
// - `characters/mortiphasm/idle.png`, 668 x 668, disc radius 318 at the centre.
//   Its quarters run **clockwise on screen from screen right: Fire, Water, Ice,
//   Thunder** (our estimate, B8). **Never mirrored**: a mirror reverses the ring.
//   A turn is a rotation.
// - `characters/mortiphasm-facing/idle.png`, the same size: lights the quarter at
//   screen right, dims the other three, draws a gold rim arc. It does not turn
//   with the disc; it is rotated 180 degrees for a disc on his right.
//
// The discs are the scene's props, not stage figures: the stage stands the four
// Mortiphasm combatants **figure-less** on overhead anchors at the same points
// (`garden-of-pain.ts`, `PartAnchors.ts`), so the cursor, the damage numbers and
// the Sensor still find them. Which colour each disc shows him is written onto
// its (figure-less) actor by the FFX HUD tap (`src/engine/OmnisDiscTap.ts`) as
// the presenter plays the fight; this module turns the painting to match.

/** The ring, clockwise on screen from screen right. Mirrored from `seymour-omnis-rules.ts#DISC_RING` (a test pins it). */
export const DISC_RING_ON_SCREEN = ['fire', 'water', 'ice', 'lightning'] as const;

/** The painting's pixels: its size and the disc's radius (`mortiphasm/idle.json`). */
export const DISC_PAINT = { size: 668, radius: 318 } as const;

/** One disc: its combatant id, its centre in the world, and where Seymour is from it (0 = screen right, 180 = screen left). */
export interface DiscPlacement {
  id: string;
  centre: [number, number, number];
  towardHim: 0 | 180;
}

/** How long a quarter turn takes on screen. Ours: the sources say only that the disc turns. */
export const DISC_TURN_MS = 450;

/**
 * The clockwise screen rotation, in degrees, that brings `element`'s quarter round to face him.
 * Unknown colours (none today) leave the disc as painted.
 */
export function discAngleFor(element: string, towardHim: 0 | 180): number {
  const i = (DISC_RING_ON_SCREEN as readonly string[]).indexOf(element);
  if (i < 0) return towardHim;
  return towardHim - 90 * i;
}

/** `target` restated as the nearest equivalent angle to `current` (a quarter turn goes the short way). */
export function nearestAngle(current: number, target: number): number {
  const delta = ((((target - current) % 360) + 540) % 360) - 180;
  return current + delta;
}

interface DiscProp {
  place: DiscPlacement;
  disc: Mesh;
  face: Mesh;
  /** Clockwise degrees on screen, drawn now and aimed at. */
  angle: number;
  target: number;
  /** The staged actor this disc last read, so a restaged battle snaps instead of spinning. */
  seen: Object3D | null;
}

function billboard(mesh: Mesh, clockwiseDeg: () => number): void {
  mesh.onBeforeRender = (_r, _s, camera: Camera): void => {
    mesh.quaternion.copy(camera.quaternion);
    mesh.rotateZ((-clockwiseDeg() * Math.PI) / 180);
    mesh.updateMatrixWorld();
  };
}

/** The four painted discs and their facing layers. */
export class GardenDiscs {
  readonly group = new Group();
  private readonly props: DiscProp[];
  private readonly textures: Texture[] = [];

  constructor(placements: readonly DiscPlacement[], diameter: number) {
    this.group.name = 'mortiphasm-discs';
    const size = (diameter * DISC_PAINT.size) / (2 * DISC_PAINT.radius);
    this.props = placements.map((place) => {
      const mk = (order: number): Mesh => {
        const mat = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
        const m = new Mesh(new PlaneGeometry(size, size), mat);
        m.position.set(...place.centre);
        m.renderOrder = order;
        m.frustumCulled = false;
        this.group.add(m);
        return m;
      };
      const start = discAngleFor('fire', place.towardHim); // §4.1: all four open on Fire [verified: 3 sources]
      const prop: DiscProp = { place, disc: mk(-2), face: mk(-1), angle: start, target: start, seen: null };
      prop.disc.name = `mortiphasm-disc:${place.id}`;
      prop.face.name = `mortiphasm-facing:${place.id}`;
      billboard(prop.disc, () => prop.angle);
      billboard(prop.face, () => prop.place.towardHim);
      return prop;
    });
  }

  /** Load both paintings; until then (or if either is missing) nothing is drawn. */
  async load(): Promise<void> {
    const [disc, face] = await Promise.all([
      tryLoadTexture(artUrl('art/characters/mortiphasm/idle.png')),
      tryLoadTexture(artUrl('art/characters/mortiphasm-facing/idle.png')),
    ]);
    if (!disc || !face) {
      disc?.dispose();
      face?.dispose();
      return;
    }
    this.textures.push(disc, face);
    for (const p of this.props) {
      for (const [mesh, map] of [[p.disc, disc], [p.face, face]] as const) {
        const mat = mesh.material as MeshBasicMaterial;
        mat.map = map;
        mat.opacity = 1;
        mat.needsUpdate = true;
      }
    }
  }

  /** The angle each disc is drawn at now, clockwise degrees (tests, debug). */
  angles(): number[] {
    return this.props.map((p) => p.angle);
  }

  /** @param dt seconds. `root` is where the stage parents the actors (the scene group's parent). */
  update(dt: number, root: Object3D | null): void {
    for (const p of this.props) {
      const actor = root?.children.find((c) => c.name === p.place.id) ?? null; // the stage parents actors here, by combatant id
      const element = actor?.userData[OMNIS_FACING_KEY];
      if (typeof element === 'string') p.target = nearestAngle(p.angle, discAngleFor(element, p.place.towardHim));
      if (actor !== p.seen) {
        // A new fight on this field: stand the disc where the fight says, with no spin.
        p.seen = actor;
        p.angle = p.target = typeof element === 'string' ? discAngleFor(element, p.place.towardHim) : discAngleFor('fire', p.place.towardHim);
        continue;
      }
      const step = (90 * dt * 1000) / DISC_TURN_MS;
      const d = p.target - p.angle;
      p.angle = Math.abs(d) <= step ? p.target : p.angle + Math.sign(d) * step;
    }
  }

  dispose(): void {
    for (const p of this.props) {
      for (const m of [p.disc, p.face]) {
        m.geometry.dispose();
        (m.material as MeshBasicMaterial).dispose();
      }
    }
    for (const t of this.textures) t.dispose();
    this.group.removeFromParent();
    this.group.clear();
  }
}
