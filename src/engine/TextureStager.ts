import { Texture } from 'three';
import { BACKOFF_FRAMES, SLOW_UPLOAD_MS, bandBudget, nextBand, rowsForBudget } from './StageBands.ts';
import { PROBE_OFF, probeBrowser, type ProbeResult } from './StageProbe.ts';

/**
 * Staged texture uploads (release 39.1, "r391-stalls"; both games, shared plumbing, no game content).
 *
 * Release 39 swapped a master into a painting's texture in place and Three uploaded it inside the next `render()`: 145 ms for a 4x figure, 200 ms for a 2x backdrop
 * (Chromium decodes the PNG again on the main thread inside `texSubImage2D(<img>)` when the alpha is left straight), on the frame that drew it, mid-turn. This
 * uploads the master **ahead of the frame that needs it** and lets the painting adopt the finished texture:
 *
 * 1. **Decode off the main thread.** The loader hands over an `ImageBitmap` (`MasterLoad.ts`: straight alpha, no colour conversion, flipped as a texture holds it).
 * 2. **A staging texture.** A second Three `Texture` with the painting's sampler state and `source.dataReady = false`: `renderer.initTexture` allocates its storage
 *    (`texStorage2D`, the full mip chain, sRGB) and uploads nothing.
 * 3. **Row bands, a few megabytes a frame** (`StageBands.ts`): `texSubImage2D(bitmap)` through the WebGL2 sub-rectangle overload (`UNPACK_SKIP_ROWS`), 1.3 to 1.7 ms a
 *    band at 4096 wide; then one `generateMipmap`. Where a browser rejects the overload (the probe, `StageProbe.ts`) the staging texture is uploaded in one call instead.
 * 4. **Adoption.** The painting keeps drawing its old texture the whole time. When the staging texture is resident the painting's `texture.source` becomes the
 *    staging texture's, which is Three's own way for two textures to share one GL texture (a clone shares its source and its GL texture by design): the painting's
 *    old GL texture is freed, nothing is uploaded, and the swap is one frame, between two draws. The painting's `Texture` object, its materials and every pose
 *    comparison are untouched; `texture.image` is the decoded `<img>` handle, as before, so a restored context re-uploads from it as release 39 did.
 *
 * Only what the browser has proved exact is used: `probeBrowser()` uploads a PNG with colour hidden under alpha 0 and partial alpha both ways and compares the texels,
 * and a browser that fails keeps the release 39 swap (`stage()` answers null). The band path reads `renderer.properties.get(texture).__webglTexture`, which is
 * three 0.186.0's own record (pinned; `tests/unit/r391-three-contract.test.ts` pins the shape): a missing handle falls back to the one-call upload for that texture.
 */

/** The slice of a `WebGLRenderer` the stager uses (the real renderer satisfies it; the tests pass a fake). */
export interface StageHost {
  getContext(): WebGLRenderingContext | WebGL2RenderingContext;
  initTexture(texture: Texture): void;
  readonly state: {
    bindTexture(webglType: number, webglTexture: WebGLTexture, webglSlot?: number): void;
    unbindTexture(): void;
    pixelStorei(name: number, value: number | boolean): void;
  };
  readonly properties: { get(object: unknown): unknown };
}

/** What a stage request carries. */
export interface StageRequest {
  /** The painting's texture: its sampler state is copied onto the staging texture, and it adopts the staged GL texture when that is resident. */
  target: Texture;
  /** What `target.image` is after adoption: the decoded `<img>` handle. It is never uploaded from here. */
  image: { width: number; height: number };
  /** The decoded pixels: straight alpha, flipped as a texture holds them. Closed once resident, or when the job is cancelled. */
  bitmap: ImageBitmap;
  /** A figure on screen is waiting for this master (the larger band budget, first in the queue). */
  urgent: boolean;
}

/** A master on its way to the GPU. */
export interface StagedUpload {
  /** True once the staging texture is fully resident, false when the job was cancelled or failed. Settles once. */
  readonly ready: Promise<boolean>;
  /** Make the painting draw the staged texture, in place and in one step. Only after `ready` is true; false when it cannot (the painting is then unchanged). */
  adopt(): boolean;
  /** Drop the job: the staging texture is freed and the bitmap closed. A no-op after `adopt`. */
  cancel(): void;
}

export interface StagerStats {
  mode: 'pending' | 'off' | 'oneshot' | 'bands';
  probe: string;
  /** Jobs not yet adopted or cancelled. */
  jobs: number;
  started: number;
  landed: number;
  adopted: number;
  cancelled: number;
  /** Bands and one-call uploads made, and the bytes they carried. */
  uploads: number;
  mb: number;
  /** The slowest single upload call (ms) and the one before it. */
  maxUploadMs: number;
  lastUploadMs: number;
  /** Frames on which a tick uploaded something. */
  busyFrames: number;
}

interface Job {
  id: number;
  req: StageRequest;
  staging: Texture;
  /** The staging texture's GL texture when it is uploaded in bands. */
  handle: WebGLTexture | null;
  width: number;
  height: number;
  /** Rows in so far (bands). */
  done: number;
  state: 'uploading' | 'resident' | 'adopted' | 'cancelled';
  /** The bitmap has been closed (at the landing, or on a cancel). */
  closed: boolean;
  settle: (ok: boolean) => void;
}

/** The sampler and format fields three's texture cache key reads (`WebGLTextures.getTextureCacheKey`): the staging texture must carry the painting's, or adoption would make a second GL texture. */
export const SAMPLER_FIELDS = [
  'wrapS', 'wrapT', 'magFilter', 'minFilter', 'anisotropy', 'internalFormat', 'format', 'type', 'generateMipmaps', 'premultiplyAlpha', 'flipY', 'unpackAlignment', 'colorSpace',
] as const;

/** Copy a painting's sampler state onto its staging texture. */
export function copySampler(to: Texture, from: Texture): void {
  const dst = to as unknown as Record<string, unknown>;
  const src = from as unknown as Record<string, unknown>;
  for (const k of SAMPLER_FIELDS) dst[k] = src[k];
}

/** The most jobs held at once (the governor already allows two loads). */
const MAX_JOBS = 4;

export class TextureStager {
  private readonly host: StageHost;
  private mode: StagerStats['mode'] = 'pending';
  private probe: ProbeResult = PROBE_OFF;
  private readonly jobs: Job[] = [];
  private nextId = 1;
  private lastTick = 0;
  /** Frames left of the back-off after a slow upload call (the GPU is busy with something else). */
  private backoff = 0;
  private disposed = false;
  private readonly counters = { started: 0, landed: 0, adopted: 0, cancelled: 0, uploads: 0, bytes: 0, maxUploadMs: 0, lastUploadMs: 0, busyFrames: 0 };

  /** `probe` is the browser's verdict (tests pass their own); the default runs `probeBrowser()` once per session. */
  constructor(host: StageHost, probe: Promise<ProbeResult> | ProbeResult = probeBrowser()) {
    this.host = host;
    void Promise.resolve(probe).then(
      (r) => this.settle(r),
      () => this.settle(PROBE_OFF),
    );
  }

  private settle(r: ProbeResult): void {
    this.probe = r;
    this.mode = r.bitmap ? (r.bands ? 'bands' : 'oneshot') : 'off';
  }

  /** True once the probe has passed: a master loaded with a bitmap may be staged. */
  get enabled(): boolean {
    return !this.disposed && (this.mode === 'bands' || this.mode === 'oneshot');
  }

  private lost(): boolean {
    try {
      return this.host.getContext().isContextLost();
    } catch {
      return true;
    }
  }

  /**
   * Start uploading `req.bitmap` into a staging texture. Null when staging is not available (the probe has not passed, the context is lost, too many jobs): the caller
   * swaps the old way. Otherwise the staging texture is allocated now and filled by `tick()`, a few megabytes a frame.
   */
  stage(req: StageRequest): StagedUpload | null {
    if (!this.enabled || this.jobs.length >= MAX_JOBS || this.lost()) return null;
    const width = req.bitmap.width;
    const height = req.bitmap.height;
    if (!(width > 0 && height > 0)) return null;
    const job = (this.mode === 'bands' ? this.bandsJob(req, width, height) : null) ?? this.oneShotJob(req, width, height);
    return this.enqueue(job);
  }

  /** A staging texture whose storage Three has allocated and whose GL texture the bands go into; null when Three's record is not the shape this was written against. */
  private bandsJob(req: StageRequest, width: number, height: number): Job | null {
    const staging = new Texture(req.image as unknown as Texture['image']);
    copySampler(staging, req.target);
    staging.needsUpdate = true;
    let handle: WebGLTexture | null = null;
    try {
      staging.source.dataReady = false; // allocate the storage and set the sampler; upload nothing
      this.host.initTexture(staging);
      const h = (this.host.properties.get(staging) as { __webglTexture?: unknown } | undefined)?.__webglTexture;
      handle = typeof h === 'object' && h !== null ? (h as WebGLTexture) : null;
    } catch {
      handle = null;
    }
    if (!handle) {
      staging.source.dataReady = true;
      staging.dispose();
      return null;
    }
    return { id: this.nextId++, req, staging, handle, width, height, done: 0, state: 'uploading', closed: false, settle: () => undefined };
  }

  /** A staging texture that is uploaded in one call, when `tick()` reaches it. */
  private oneShotJob(req: StageRequest, width: number, height: number): Job {
    const staging = new Texture(req.image as unknown as Texture['image']);
    copySampler(staging, req.target);
    return { id: this.nextId++, req, staging, handle: null, width, height, done: 0, state: 'uploading', closed: false, settle: () => undefined };
  }

  private enqueue(job: Job): StagedUpload {
    let settle: (ok: boolean) => void = () => undefined;
    const ready = new Promise<boolean>((resolve) => {
      settle = resolve;
    });
    job.settle = settle;
    this.jobs.push(job);
    this.jobs.sort((a, b) => Number(b.req.urgent) - Number(a.req.urgent) || a.id - b.id);
    this.counters.started++;
    return { ready, adopt: () => this.adopt(job), cancel: () => this.cancel(job) };
  }

  /** One frame: upload this frame's bands of the jobs in the queue, urgent first. Call it once a frame, before the render. */
  tick(): void {
    const now = performance.now();
    const frameMs = this.lastTick > 0 ? now - this.lastTick : 16.7;
    this.lastTick = now;
    if (this.disposed || this.jobs.length === 0) return;
    if (this.lost()) return void this.cancelAll();
    const queue = this.jobs.filter((j) => j.state === 'uploading');
    if (queue.length === 0) return;
    let budget = bandBudget(queue[0]!.req.urgent, frameMs);
    if (this.backoff > 0) {
      this.backoff--;
      budget = Math.floor(budget / 4);
    }
    let touched = false;
    for (const job of queue) {
      if (budget <= 0) break;
      budget -= job.handle ? this.bands(job, budget) : this.oneShot(job);
      touched = true;
    }
    if (touched) {
      this.host.state.unbindTexture();
      this.counters.busyFrames++;
    }
  }

  private timed(fn: () => void): void {
    const t0 = performance.now();
    fn();
    const ms = performance.now() - t0;
    this.counters.lastUploadMs = Math.round(ms * 100) / 100;
    if (ms > this.counters.maxUploadMs) this.counters.maxUploadMs = Math.round(ms * 100) / 100;
    if (ms > SLOW_UPLOAD_MS) this.backoff = BACKOFF_FRAMES; // the call waited on the GPU: do not pile on
    this.counters.uploads++;
  }

  /** Upload bands of one job until the budget is spent or it is whole; returns the bytes sent. */
  private bands(job: Job, budget: number): number {
    const gl = this.host.getContext() as WebGL2RenderingContext;
    const { state } = this.host;
    let sent = 0;
    const rows = rowsForBudget(job.width, budget);
    state.bindTexture(gl.TEXTURE_2D, job.handle!, gl.TEXTURE0);
    state.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    state.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    state.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    for (let band = nextBand(job.done, job.height, rows); band && sent < budget; band = nextBand(job.done, job.height, rows)) {
      const { y, rows: n } = band;
      this.timed(() => {
        state.pixelStorei(gl.UNPACK_SKIP_ROWS, y);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, job.width, n, gl.RGBA, gl.UNSIGNED_BYTE, job.req.bitmap);
      });
      job.done += n;
      sent += n * job.width * 4;
    }
    state.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    this.counters.bytes += sent;
    if (job.done >= job.height) {
      this.timed(() => gl.generateMipmap(gl.TEXTURE_2D));
      job.staging.source.dataReady = true;
      this.land(job);
    }
    return sent;
  }

  /** The whole texture in one call (a browser that rejects the sub-rectangle overload, or a missing GL handle). */
  private oneShot(job: Job): number {
    const { staging, req } = job;
    const gl = this.host.getContext() as WebGL2RenderingContext;
    // Three leaves the flip and premultiply state alone for an ImageBitmap (the bitmap carries its own), and a browser may refuse an upload with either on.
    this.host.state.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.host.state.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.timed(() => {
      staging.image = req.bitmap as unknown as Texture['image'];
      staging.needsUpdate = true;
      this.host.initTexture(staging);
      staging.image = req.image as unknown as Texture['image']; // the handle again: a restored context re-uploads from it, as release 39 did
    });
    this.counters.bytes += job.width * job.height * 4;
    this.land(job);
    return job.width * job.height * 4;
  }

  private land(job: Job): void {
    job.state = 'resident';
    this.counters.landed++;
    this.closeBitmap(job);
    job.settle(true);
  }

  private adopt(job: Job): boolean {
    if (job.state !== 'resident' || this.disposed) return false;
    const target = job.req.target;
    try {
      target.dispose(); // frees the painting's old GL texture and Three's record of it
      target.source = job.staging.source; // Three's own sharing: this texture now draws the staged GL texture
      this.host.initTexture(target); // takes its share of that GL texture; the source is current, so nothing is uploaded
      job.staging.dispose(); // gives back the staging texture's share: the GL texture lives as long as the painting does
    } catch {
      this.cancel(job);
      return false;
    }
    job.state = 'adopted';
    this.counters.adopted++;
    this.drop(job);
    return true;
  }

  private cancel(job: Job): void {
    if (job.state === 'adopted' || job.state === 'cancelled') return;
    const wasResident = job.state === 'resident';
    job.state = 'cancelled';
    this.counters.cancelled++;
    try {
      job.staging.dispose();
    } catch {
      /* the context is going away */
    }
    this.closeBitmap(job);
    this.drop(job);
    if (!wasResident) job.settle(false);
  }

  private closeBitmap(job: Job): void {
    if (job.closed) return;
    job.closed = true;
    try {
      job.req.bitmap.close();
    } catch {
      /* already closed */
    }
  }

  private drop(job: Job): void {
    const i = this.jobs.indexOf(job);
    if (i >= 0) this.jobs.splice(i, 1);
  }

  private cancelAll(): void {
    for (const job of [...this.jobs]) this.cancel(job);
  }

  stats(): StagerStats {
    const c = this.counters;
    return {
      mode: this.mode,
      probe: this.probe.reason,
      jobs: this.jobs.length,
      started: c.started,
      landed: c.landed,
      adopted: c.adopted,
      cancelled: c.cancelled,
      uploads: c.uploads,
      mb: Math.round((c.bytes / 1048576) * 10) / 10,
      maxUploadMs: c.maxUploadMs,
      lastUploadMs: c.lastUploadMs,
      busyFrames: c.busyFrames,
    };
  }

  dispose(): void {
    this.cancelAll();
    this.disposed = true;
  }
}
