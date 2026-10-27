/**
 * The alpha fields of a painting, made in a Worker (a Vite worker entry: `AlphaThumb.ts` starts it with `new Worker(new URL('./alphaThumbWorker.ts', import.meta.url), { type: 'module' })`). Post-conference
 * motion-fluidity pass, lane "mf-l4-freezes", MF-02; both games; no look change.
 *
 * It receives a painting as its encoded bytes (a Blob) or its address, decodes it here (no page thread, no GPU queue behind it), and makes each field the way the page made it:
 *   - 'draw': `drawImage(painting, 0, 0, w, h)` on a `willReadFrequently` canvas of w x h with the default smoothing, then the alpha byte of every texel (`AlphaPrime.readExtents`, `fx/mix/geometry.ts`);
 *   - 'bitmap-medium': `createImageBitmap(painting, { resizeWidth: w, resizeHeight: h, resizeQuality: 'medium' })` and a 1:1 draw of it (`fx/mix/breathRig.ts`).
 * Top row first, one byte a texel. A field is handed back the moment it is made (the 'draw' ones share one decode and come first), the buffer transferred, not copied.
 */

type Mode = 'draw' | 'bitmap-medium';
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

function alphaOf(src: ImageBitmap, w: number, h: number): Uint8Array {
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) throw new Error('alpha thumb: no 2d context');
  g.clearRect(0, 0, w, h);
  g.drawImage(src, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const a = new Uint8Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3]!;
  return a;
}

scope.onmessage = async (e): Promise<void> => {
  const { id, source, specs } = e.data;
  let full: ImageBitmap | null = null;
  try {
    const blob = await bytesOf(source);
    // the fields that share the full decode first, so the extents (the one a figure's first frame waits for) never wait for the breathing rig's second decode
    const order = specs.map((s, i) => ({ s, i })).sort((x, y) => Number(x.s.mode !== 'draw') - Number(y.s.mode !== 'draw'));
    for (const { s, i } of order) {
      let a: Uint8Array;
      if (s.mode === 'draw') {
        full ??= await createImageBitmap(blob);
        a = alphaOf(full, s.w, s.h);
      } else {
        const small = await createImageBitmap(blob, { resizeWidth: s.w, resizeHeight: s.h, resizeQuality: 'medium' });
        try {
          a = alphaOf(small, s.w, s.h);
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
