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

/** A loaded master: the image the texture keeps (an `<img>` handle in the game), its scale, and the decoded pixels it is staged from (`MasterLoad.ts`) when there are any. */
export interface LoadedPixels {
  image: PixelSource;
  scale: number;
  /** Decoded off the main thread; whoever takes it closes it (the stager once resident, the governor when it swaps the old way). */
  bitmap?: ImageBitmap | null;
}

/** What a load is for (see {@link GovernorDeps.load}). */
export interface LoadOptions {
  urgent: boolean;
  warm: boolean;
}

/** A master on its way to the GPU as the governor sees it (`TextureStager.StagedUpload`; a fake in the tests). */
export interface GovernedStage {
  /** True once it is fully resident on the GPU, false when it was cancelled or failed. */
  readonly ready: Promise<boolean>;
  /** The painting draws it from the next draw on, in place. False (and the painting unchanged) when it cannot. */
  adopt(): boolean;
  cancel(): void;
}

export interface GovernorDeps {
  actors: () => Iterable<GovernedActor>;
  camera: () => PerspectiveCamera;
  /** The drawing buffer's height in device pixels. */
  bufferHeight: () => number;
  budget: () => ArtBudget;
  /** The masters on disk beyond 1x for a painting's 1x URL, or null when unknown. */
  scalesFor: (url: string) => readonly number[] | null;
  /**
   * Load the master of that scale (or the best one below it); null when nothing loads. `opts` (release 39.1): `urgent` is a figure on screen waiting for it (everything else is
   * background work and should not crowd out the loads the first menu waits for), `warm` is a master the browser has already fetched once (read it from the cache, do not revalidate).
   */
  load: (url: string, scale: number, opts?: LoadOptions) => Promise<LoadedPixels | null>;
  /**
   * Release 39.1: start uploading a loaded master to the GPU ahead of the frame that draws it (`TextureStager.ts`); the painting adopts it when it is resident. Null (or
   * absent: the tests, a browser that failed the probe) means swap on the spot as release 39 did. `urgent`: a figure on screen is waiting for it.
   */
  stage?: (texture: Texture, loaded: LoadedPixels, urgent: boolean) => GovernedStage | null;
  /** True while `stage` can take a master (the browser has proved the staged upload exact); the governor asks for warm-ups only then. Absent: whenever `stage` is. */
  canStage?: () => boolean;
  /** True under `?artscale=`: every painting is pinned to one master and nothing is measured. */
  pinned?: () => boolean;
  /** The clock in ms (default `performance.now`); the tests step their own. */
  now?: () => number;
  /** The GPU's largest texture edge in pixels: a master whose longer edge would pass it is never asked for. */
  maxTexture?: () => number;
}

/** What the governor reports (`ArtGovernor.stats()`, `__pyrefly.art.stats()`). */
export interface GovernorStats {
  frame: number;
  upgrades: number;
  downgrades: number;
  loadFailures: number;
  inflight: number;
  queued: number;
  /** Masters being uploaded to the GPU ahead of their swap, how many landed that way, how many paintings were warmed (a master uploaded before its first draw), and the speculative megabytes held (release 39.1). */
  staging: number;
  stagedLanded: number;
  warmed: number;
  warmMB: number;
  residentMB: number;
  budgetMB: number;
  lastSwapMs: number;
  /** The CPU time of `update()` itself, milliseconds per frame (an exponential mean): the cost of measuring. */
  updateMs: number;
  entries: Array<{ url: string; scale: number; mb: number; px1x: number; seen: boolean; warm: boolean }>;
  /** The last decisions to load a bigger master: what asked (`live`, `anticipated`, `size`, `sibling`), for which painting, at what magnification. */
  trace: Array<{ frame: number; why: string; url: string; from: number; want: number; px1x: number }>;
  /** The last swaps: when (ms on the page's clock), which painting, from which master to which, whether it was staged, and how long it took from the ask to the swap. */
  swaps: Array<{ t: number; url: string; from: number; to: number; staged: boolean; warm: boolean; waitMs: number }>;
}

/** A texture's image size in pixels (an `<img>` reports its natural size, a bitmap or a canvas its own). */
export function imageWidth(t: Texture): number {
  const img = t.image as { naturalWidth?: number; width?: number } | null;
  return Number(img?.naturalWidth || img?.width || 1);
}

export function imageHeight(t: Texture): number {
  const img = t.image as { naturalHeight?: number; height?: number } | null;
  return Number(img?.naturalHeight || img?.height || 1);
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
