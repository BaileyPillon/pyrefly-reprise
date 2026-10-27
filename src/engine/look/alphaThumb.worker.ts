import { alphaPlane, areaAverage } from './alphaArea.ts';

/**
 * The alpha fields of a painting, made in a Worker (a Vite worker entry: `AlphaThumb.ts` starts it with `new Worker(new URL('./alphaThumb.worker.ts', import.meta.url), { type: 'module' })`). Post-conference
 * motion-fluidity pass, lane "mf-l4-freezes", MF-02; both games.
 *
 * It receives a painting as its encoded bytes (a Blob) or its address, decodes it here (no page thread, no GPU queue behind it), and makes each field:
 *   - 'area': the mean of the alpha plane over each output texel's footprint (`alphaArea.ts`): the extents field the look reads (`AlphaPrime.readExtents`);
 *   - 'draw': `drawImage(bitmap, 0, 0, w, h)` on a `willReadFrequently` canvas of w x h at the 'medium' quality: the second opinion the extents field is checked against;
 *   - 'bitmap-medium': `createImageBitmap(painting, { resizeWidth: w, resizeHeight: h, resizeQuality: 'medium' })` and a 1:1 draw of it: the breathing rig's field, byte for byte the page's own (`fx/mix/breathRig.ts`).
 * Top row first, one byte a texel. A field is handed back the moment it is made (the ones that share the full decode first), the buffer transferred, not copied.
 */

type Mode = 'area' | 'draw' | 'bitmap-medium';
interface Spec {
  w: number;
  h: number;
  mode: Mode;
}
interface Req {
  id: number;
  source: Blob | string;
  specs: Spec[];
}

interface WorkerScope {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent<Req>) => void) | null;
}

const scope = self as unknown as WorkerScope;

async function bytesOf(source: Blob | string): Promise<Blob> {
  if (typeof source !== 'string') return source;
  // the page's `<img>` just fetched this: the HTTP cache has it, so ask for that and never for a revalidation
  const res = await fetch(source, { cache: 'force-cache', priority: 'low' } as RequestInit);
  if (!res.ok) throw new Error(`alpha thumb: ${res.status}`);
  return res.blob();
}

function context(w: number, h: number): OffscreenCanvasRenderingContext2D {
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) throw new Error('alpha thumb: no 2d context');
  g.clearRect(0, 0, w, h);
  return g;
}

/** The alpha bytes of a w x h canvas that holds the field's pixels. */
function alphaOf(g: OffscreenCanvasRenderingContext2D, w: number, h: number): Uint8Array {
  return alphaPlane(g.getImageData(0, 0, w, h).data, w, h);
}

/** The alpha plane of a decoded painting at full size, read in strips of 512 rows so the worker never holds a second copy of 4 bytes a texel (22 megapixels at the largest master). */
function planeOf(bmp: ImageBitmap): Uint8Array {
  const { width: w, height: h } = bmp;
  const plane = new Uint8Array(w * h);
  const strip = Math.min(512, h);
  const g = context(w, strip);
  for (let y = 0; y < h; y += strip) {
    const rows = Math.min(strip, h - y);
    g.clearRect(0, 0, w, strip);
    g.drawImage(bmp, 0, y, w, rows, 0, 0, w, rows);
    plane.set(alphaOf(g, w, rows), y * w);
  }
  return plane;
}

scope.onmessage = async (e): Promise<void> => {
  const { id, source, specs } = e.data;
  let full: ImageBitmap | null = null;
  try {
    const blob = await bytesOf(source);
    // the fields that share the full decode first (the extents, which a figure's first frame waits for, before the check), the breathing rig's second decode last
    const rank = (m: Mode): number => (m === 'area' ? 0 : m === 'draw' ? 1 : 2);
    const order = specs.map((s, i) => ({ s, i })).sort((x, y) => rank(x.s.mode) - rank(y.s.mode));
    let plane: Uint8Array | null = null;
    for (const { s, i } of order) {
      let a: Uint8Array;
      if (s.mode === 'area') {
        full ??= await createImageBitmap(blob);
        plane ??= planeOf(full); // read once, whatever fields want it
        a = areaAverage(plane, full.width, full.height, s.w, s.h);
      } else if (s.mode === 'draw') {
        full ??= await createImageBitmap(blob);
        const g = context(s.w, s.h);
        g.imageSmoothingQuality = 'medium';
        g.drawImage(full, 0, 0, s.w, s.h);
        a = alphaOf(g, s.w, s.h);
      } else {
        const small = await createImageBitmap(blob, { resizeWidth: s.w, resizeHeight: s.h, resizeQuality: 'medium' });
        try {
          const g = context(s.w, s.h);
          g.drawImage(small, 0, 0, s.w, s.h);
          a = alphaOf(g, s.w, s.h);
        } finally {
          small.close();
        }
      }
      scope.postMessage({ id, ok: true, i, a }, [a.buffer]);
    }
    scope.postMessage({ id, ok: true, done: true });
  } catch {
    scope.postMessage({ id, ok: false });
  } finally {
    full?.close();
  }
};
