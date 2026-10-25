import { type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { cutAndFlip, type CutReply, type CutRequest } from './plateCutWork.ts';
import type { PlateBuildOptions, PlateGeometry, PlateLayout } from './DepthPlates.ts';

/**
 * The CPU half of the depth plates' build, which can be done before the battle (release 62, PR-0481, the conference demo; both games: Chapter I's Gagazet is FFX, Chapter IV's Bevelle underground is FFX-2).
 *
 * What it leaves: the depth map at the cut's size, each plate flipped bottom-up for the GL upload, and how much of the frame each owns. On the booth's two fights this half is one 0.65 s task on the main
 * thread right after the press (round 28, release 61; measured here: the painting and the depth map drawn down and read back, the feather blur, the cut, the flip). It reads nothing but the painting's
 * pixels, the depth map and the layout, so the conference demo does it behind the picker (`DepthPlates.precutPlates`, called from `app/demo/demoWarm.ts` through `warmLivingPlates`) and the build takes
 * the result: the same arithmetic on the same inputs, made earlier, once. `DepthPlates.build` is the only reader, and it makes the cut itself when none is held.
 */

/** Per painting row (top to bottom), 0..1: is that row's ray onto the ground nearer than `far`? */
export function floorRows(g: PlateGeometry, h: number, far: number): Float32Array {
  const rows = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    const py = g.centreY + (0.5 - (y + 0.5) / h) * g.height;
    if (py >= g.camRef.y - 1e-3) continue;
    const t = g.camRef.y / (g.camRef.y - py);
    const z = g.camRef.z + t * (g.distance - g.camRef.z);
    const k = Math.min(1, Math.max(0, (z - far) / 6));
    rows[y] = k * k * (3 - 2 * k);
  }
  return rows;
}

/**
 * The width the cut runs at when the plates are composed on the GPU: the derived depth maps are 1344x768 (`tools/fx/depth.py`), so
 * a cut at their own size loses nothing, costs a quarter of a cut at the painting's 2688 and half of the 2048 it used to run at,
 * and the colour comes from the painting's own pixels at their full size (`PlateCompose.ts`).
 */
export const GPU_CUT_WIDTH = 1344;

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return img;
}

function pixels(src: CanvasImageSource, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high'; // a master is drawn down 2 to 4 times: the default bilinear read would alias
  ctx.drawImage(src, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

export interface CutResult {
  depth: Float32Array;
  flipped: Uint8Array[];
  coverage: number[];
  cutMs: number;
}

/** Everything that decides the cut, read off the group and the options at once (no waiting). */
export interface CutPlan {
  g: PlateGeometry;
  main: Mesh | undefined;
  image: CanvasImageSource & { naturalWidth?: number; width?: number };
  loadedW: number;
  loadedScale: number;
  gpu: boolean;
  w: number;
  h: number;
  blur: number;
}

/** `g` is the group's `plateGeometry` (the caller read it); null when the group has no painting to cut. */
export function planCut(group: Group, layout: PlateLayout, opts: PlateBuildOptions, g: PlateGeometry | null): CutPlan | null {
  const main = group.getObjectByName('backdrop-painting') as Mesh | undefined;
  const map = (main?.material as MeshBasicMaterial | undefined)?.map;
  const image = map?.image as (CanvasImageSource & { naturalWidth?: number; width?: number }) | undefined;
  if (!g || !image) return null;
  // The painting as loaded: the approved 2688 px, or its master (`artScale` 2: 5376 px). The full tier makes plates as wide as
  // the painting that loaded, cutting at the depth map's own 1344 and laying the painting's pixels over that cut on the GPU; the
  // phone tier keeps its own small cut. With no renderer (unit tests) the cut itself runs at the approved width on the CPU.
  const loadedW = Number(image.naturalWidth || image.width || layout.width);
  const loadedScale = Math.max(1, Math.round(Number(map?.userData['artScale'] ?? 1)));
  const baseW = Math.round(loadedW / loadedScale);
  const gpu = !!(opts.native && opts.renderer);
  const w = opts.native ? (gpu ? Math.min(baseW, GPU_CUT_WIDTH) : baseW) : layout.width;
  const h = Math.round((w * g.height) / g.width);
  const blur = opts.native ? Math.max(1, Math.round((layout.blur * w) / layout.width)) : layout.blur;
  return { g, main, image, loadedW, loadedScale, gpu, w, h, blur };
}

/** Two cuts are the same cut when this is the same: the depth map, the layout, the size, and the geometry the floor's rows read. */
export function cutKey(depthUrl: string, layout: PlateLayout, p: CutPlan): string {
  const { g } = p;
  return [depthUrl, p.w, p.h, p.blur, layout.soft, layout.thresholds.join(','), layout.floor?.far ?? '-', g.height, g.centreY, g.distance, g.camRef.y, g.camRef.z].join('|');
}

const nextTask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * The cut's arithmetic, off the page when there is a Worker (r63-play, the overnight fix of the skeptic's M1; both games): the 0.22 to 0.30 s the page used to spend on it behind the picker was a stretch in which a
 * press was never seen. One worker for the page's life, started on the first cut; with no Worker (the unit tests, an old browser) or a worker that fails, the same function runs on the page, as it always did.
 */
let cutWorker: Worker | null | undefined;
let cutSeq = 0;
const cutWaiting = new Map<number, { resolve: (r: CutReply) => void; reject: (e: unknown) => void }>();

function plateWorker(): Worker | null {
  if (cutWorker !== undefined) return cutWorker;
  cutWorker = null;
  if (typeof Worker === 'undefined') return null;
  try {
    const w = new Worker(new URL('./plateWorker.ts', import.meta.url), { type: 'module', name: 'plate-cut' });
    w.onmessage = (e: MessageEvent<{ id: number; ok: boolean; reply?: CutReply; error?: string }>): void => {
      const job = cutWaiting.get(e.data.id);
      if (!job) return;
      cutWaiting.delete(e.data.id);
      if (e.data.ok && e.data.reply) job.resolve(e.data.reply);
      else job.reject(new Error(e.data.error ?? 'plate cut failed'));
    };
    w.onerror = (): void => {
      cutWorker = null; // a worker that cannot run: every cut from here on runs on the page
      for (const [id, job] of cutWaiting) {
        cutWaiting.delete(id);
        job.reject(new Error('plate worker failed'));
      }
    };
    cutWorker = w;
  } catch {
    cutWorker = null;
  }
  return cutWorker;
}

/** The cut, in the worker when there is one, else here. A failure of the worker is answered by the same arithmetic on the page. */
export function cutOffThread(req: CutRequest): Promise<CutReply> {
  const w = plateWorker();
  if (!w) return Promise.resolve(cutAndFlip(req));
  return new Promise<CutReply>((resolve, reject) => {
    const id = ++cutSeq;
    cutWaiting.set(id, { resolve, reject });
    try {
      w.postMessage({ id, req }); // copied, not transferred: the page keeps its arrays for the fallback
    } catch (e) {
      cutWaiting.delete(id);
      reject(e);
    }
  }).catch(() => cutAndFlip(req));
}

/** Make the cut. `yieldBetween`: ahead of a battle the picker is on screen, so the steps are separate tasks and not one. */
export async function runCut(depthUrl: string, layout: PlateLayout, p: CutPlan, yieldBetween: boolean): Promise<CutResult> {
  const { g, image, w, h, blur } = p;
  const depthImg = await loadImage(depthUrl);
  const t0 = performance.now();
  const paint = pixels(image, w, h);
  if (yieldBetween) await nextTask();
  const dBytes = pixels(depthImg, w, h);
  const depth = new Float32Array(w * h);
  for (let i = 0; i < depth.length; i++) depth[i] = dBytes[i * 4]! / 255;
  const rows = layout.floor ? floorRows(g, h, layout.floor.far) : undefined;
  if (yieldBetween) await nextTask();
  // The feather blurs, the cut and the flip (rows bottom-up for the GL upload: a data texture is never flipped by the driver) are the 0.2 to 0.3 s of the task: off the page where a worker exists.
  const { flipped, coverage } = await cutOffThread({ paint, depth, w, h, cut: { thresholds: layout.thresholds, soft: layout.soft, blur }, solid: 0.999, topRows: rows });
  const cutMs = Math.round(performance.now() - t0);
  return { depth, flipped, coverage, cutMs };
}

/** Cuts made ahead of their build, by the painting they were cut from (a painting nobody builds from is collected with its cuts). */
const held = new WeakMap<object, Map<string, Promise<CutResult>>>();

/** The cut held for this painting and key, if any (not taken). */
export function heldCut(image: object, key: string): Promise<CutResult> | undefined {
  return held.get(image)?.get(key);
}

/** Hold a cut for the build that asks for this painting and key. */
export function holdCut(image: object, key: string, made: Promise<CutResult>): void {
  let m = held.get(image);
  if (!m) held.set(image, (m = new Map()));
  m.set(key, made);
}

/** Forget a held cut (it was taken, or it failed); only if it is still this one. */
export function dropCut(image: object, key: string, made?: Promise<CutResult>): void {
  const m = held.get(image);
  if (m && (made === undefined || m.get(key) === made)) m.delete(key);
}
