import { Matrix4, Vector3, type Mesh, type PerspectiveCamera, type Texture } from 'three';
import type { ArtBudget } from './ArtBudget.ts';

/**
 * What the art governor measures with and is handed (release 39; `ArtGovernor.ts`): a painting's texel on screen, and the shapes of
 * the paintings, the actors that hold them and the dependencies the governor runs on. Split out so the governor stays under the
 * house line limit; `ArtGovernor.ts` re-exports all of it.
 */

/** What the governor needs of a painting: `PaintedActor.paintings()` gives these. */
export interface GovernedPainting {
  painted: { texture: Texture; meta: { width: number; height: number; content?: { x0: number; x1: number; y0: number; y1: number } }; url: string; scale?: number };
  mesh: Mesh;
  drawn: boolean;
}

/** Anything with paintings (a `PaintedActor`; a fake in the unit tests). */
export interface GovernedActor {
  paintings(): GovernedPainting[];
}

/** A decoded master: an image element in the game, a plain object in the tests. */
export interface PixelSource {
  width: number;
  height: number;
}

export interface GovernorDeps {
  actors: () => Iterable<GovernedActor>;
  camera: () => PerspectiveCamera;
  /** The drawing buffer's height in device pixels. */
  bufferHeight: () => number;
  budget: () => ArtBudget;
  /** The masters on disk beyond 1x for a painting's 1x URL, or null when unknown. */
  scalesFor: (url: string) => readonly number[] | null;
  /** Load the master of that scale (or the best one below it); null when nothing loads. */
  load: (url: string, scale: number) => Promise<{ image: PixelSource; scale: number } | null>;
  /** True under `?artscale=`: every painting is pinned to one master and nothing is measured. */
  pinned?: () => boolean;
  /** The GPU's largest texture edge in pixels: a master whose longer edge would pass it is never asked for. */
  maxTexture?: () => number;
}

const a0 = new Vector3();
const a1 = new Vector3();
const a2 = new Vector3();

/**
 * Screen pixels one texel of the painting's approved (1x) file covers at the painted content's centre: the texel's two edges
 * projected through the plane's world matrix and the camera, the longer one. Exact for a plane turned toward the camera (the
 * interim yaw), foreshortened by a body lying on the floor (a KO), and behind the camera or inside the near plane it is 0.
 * `meta` is the 1x sidecar's size and content box; the camera's matrices must be current.
 */
export function pixelsPer1xTexel(world: Matrix4, camera: PerspectiveCamera, bufferHeight: number, meta: GovernedPainting['painted']['meta']): number {
  const c = meta.content;
  const lx = c ? (c.x0 + c.x1) / 2 / meta.width - 0.5 : 0;
  const ly = c ? 0.5 - (c.y0 + c.y1) / 2 / meta.height : 0;
  a0.set(lx, ly, 0).applyMatrix4(world).applyMatrix4(camera.matrixWorldInverse);
  if (!(-a0.z > camera.near)) return 0;
  const W = bufferHeight * camera.aspect;
  const toPx = (v: Vector3, local: Vector3): Vector3 => {
    local.applyMatrix4(world).project(camera);
    return v.set((local.x * 0.5 + 0.5) * W, (-local.y * 0.5 + 0.5) * bufferHeight, 0);
  };
  const p0 = toPx(a0, a0.set(lx, ly, 0));
  const pu = toPx(a1, a1.set(lx + 1 / meta.width, ly, 0));
  const pv = toPx(a2, a2.set(lx, ly + 1 / meta.height, 0));
  return Math.max(Math.hypot(pu.x - p0.x, pu.y - p0.y), Math.hypot(pv.x - p0.x, pv.y - p0.y));
}
