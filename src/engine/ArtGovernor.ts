import type { PerspectiveCamera, Texture } from 'three';
import { evictionOrder, pickScale, requiredScale, textureMB, type Resident } from './ArtBudget.ts';
import { pixelsPer1xTexel, type GovernedActor, type GovernedPainting, type GovernorDeps, type PixelSource } from './ArtMeasure.ts';

export { pixelsPer1xTexel, type GovernedActor, type GovernedPainting, type GovernorDeps, type PixelSource } from './ArtMeasure.ts';

/**
 * The art governor (release 39, "r39-hires-engine"; both games, shared plumbing, no game content).
 *
 * A painting is loaded at the master the device's budget allows before anything has measured it (`ArtTier.baseScaleFor`). From
 * then on this decides, every frame and from the camera that is actually looking at it, which master each figure needs: the
 * smallest one that does not magnify a texel past one screen pixel (`ArtBudget.pickScale`), within the device's ceiling. A
 * figure drawn bigger than its master asks for the next one up; the swap is made **in place**, on the texture object the plane
 * already draws (`texture.dispose()`, new image, `needsUpdate`), so the plane, its sidecar geometry, its shadow and every pose
 * comparison are untouched and every actor sharing the texture sees the new pixels at once.
 *
 * - **On demand**: a drawn painting whose measured magnification passes one texel per pixel is upgraded (`update`).
 * - **Ahead of a shot**: `anticipate` runs the same measurement from a camera that is not on screen yet (a rig, a held shot, the
 *   colossus master, a push-in), so the master is resident when the cut lands.
 * - **Within a memory budget**: masters above the first-seen scale that are not on screen go back to it (`evictionOrder`) when the
 *   figures' texture memory passes `ArtBudget.textureMB`; a painting seen in the last 0.75 s is never evicted.
 * - **Siblings**: once a figure's painting has been upgraded, its other poses follow at the same scale in the background, as room
 *   allows without evicting anything, so a pose change inside a close shot does not drop to the smaller file.
 *
 * Measuring is arithmetic on the plane's world matrix and the camera (`pixelsPer1xTexel`). Loads and swaps are async and
 * staggered: at most two loads in flight and one swap per frame (a 4x master is a 50 MB upload).
 */

interface Entry {
  texture: Texture;
  painted: GovernedPainting['painted'];
  url: string;
  /** The master the texture holds now. */
  scale: number;
  /** What it was first seen holding, and the image to go back to. */
  baseScale: number;
  baseImage: unknown;
  /** GPU megabytes (with mips) once it has been drawn; 0 until then. */
  mb: number;
  lastSeen: number;
  px1x: number;
  /** The scale being loaded or waiting to be swapped in (0 = none). */
  loading: number;
  failed: Set<number>;
  /** The time (ms) the live camera first wanted a bigger master than it holds (-1 = it does not now). */
  needSince: number;
}

interface Need {
  entry: Entry;
  want: number;
  /** 0 for a painting on screen (biggest magnification first), 1 for a sibling pose. */
  rank: number;
  px1x: number;
}

/** How long (ms) a painting counts as "on screen" after it was last drawn, for eviction. */
export const SEEN_WINDOW_MS = 750;
const MAX_LOADS = 2;
/**
 * How long (ms) a live need must last before a master is fetched for it: a punch or a shake bounces a figure to twice its size for a
 * third of a second, and a download that lands after it is bytes for nothing. Time, not frames, so a 144 or 240 Hz screen waits as
 * long as a 60 Hz one. A planned view (`anticipate`) is not asked to wait.
 */
export const PERSIST_MS = 300;
/** How often (ms) the memory budget is checked besides after each swap. */
const EVICT_EVERY_MS = 250;
/** A little over the measured number: the plane's yaw and the camera's sway only shrink it, but the measure is taken a frame late. */
const SAFETY = 1.04;

export interface GovernorStats {
  frame: number;
  upgrades: number;
  downgrades: number;
  loadFailures: number;
  inflight: number;
  queued: number;
  residentMB: number;
  budgetMB: number;
  lastSwapMs: number;
  entries: Array<{ url: string; scale: number; mb: number; px1x: number; seen: boolean }>;
  /** The last decisions to load a bigger master: what asked (`live`, `anticipated`, `size`, `sibling`), for which painting, at what magnification. */
  trace: Array<{ frame: number; why: string; url: string; from: number; want: number; px1x: number }>;
}

export class ArtGovernor {
  private readonly deps: GovernorDeps;
  private readonly entries = new Map<Texture, Entry>();
  private readonly ready: Array<() => void> = [];
  private frame = 0;
  /** The clock, ms, as of this frame's update. */
  private t = 0;
  private lastEvict = 0;
  private inflight = 0;
  private disposed = false;
  private upgrades = 0;
  private downgrades = 0;
  private loadFailures = 0;
  private lastSwapMs = 0;
  private readonly trace: GovernorStats['trace'] = [];
  /** Who is asking right now (for the trace). */
  private why = 'live';

  constructor(deps: GovernorDeps) {
    this.deps = deps;
  }

  /** One frame: register what is there, measure what is drawn, start what is needed, apply one finished swap, evict when over budget. */
  update(): void {
    if (this.disposed) return;
    this.frame++;
    this.t = this.deps.now ? this.deps.now() : performance.now();
    if (this.deps.pinned?.()) return;
    const cam = this.deps.camera();
    cam.updateMatrixWorld();
    this.why = 'live';
    this.dispatch(this.collect(cam, false));
    this.ready.shift()?.();
    if (this.t - this.lastEvict >= EVICT_EVERY_MS) {
      this.lastEvict = this.t;
      this.evict();
    }
  }

  /**
   * Measure every drawn figure from a camera that is not on screen yet (a rig, a held shot, the colossus master, a push-in) and
   * start loading what that view would ask for; the figures are measured where they stand now. Returns how many loads it wanted.
   */
  anticipate(cam: PerspectiveCamera): number {
    if (this.disposed || this.deps.pinned?.()) return 0;
    cam.updateMatrixWorld();
    this.why = 'anticipated';
    const needs = this.collect(cam, true);
    this.dispatch(needs);
    return needs.length;
  }

  /**
   * Ask for the master a figure needs when it is drawn `frac` of the frame tall: the held shots are framed by size, not by camera
   * (`fx/mix/heldShots.ts`: the Overdrive shot up to 0.72, the dressphere shot up to 0.68), so their masters can be had before the
   * first cut. Only the paintings on screen are asked for. Returns how many loads it wanted.
   */
  anticipateSize(actors: Iterable<GovernedActor>, frac: number): number {
    if (this.disposed || this.deps.pinned?.()) return 0;
    const H = this.deps.bufferHeight();
    const needs: Need[] = [];
    for (const actor of actors) {
      for (const g of actor.paintings()) {
        const c = g.painted.meta.content;
        const e = this.entryOf(g);
        if (!g.drawn || !c || c.y1 <= c.y0) continue;
        const px = ((frac * H) / (c.y1 - c.y0)) * SAFETY;
        const want = pickScale(requiredScale(px), this.scalesOf(e), this.capOf(e));
        if (want > e.scale && want > e.loading) needs.push({ entry: e, want, rank: 0, px1x: px });
      }
    }
    needs.sort((a, b) => a.rank - b.rank || b.px1x - a.px1x);
    this.why = 'size';
    this.dispatch(needs);
    return needs.length;
  }

  /** What every drawn figure would be magnified to from `cam` (matrices current), without asking for anything: for the tables. */
  measureFrom(cam: PerspectiveCamera): Array<{ url: string; scale: number; px1x: number; mag: number }> {
    cam.updateMatrixWorld();
    const H = this.deps.bufferHeight();
    const out: Array<{ url: string; scale: number; px1x: number; mag: number }> = [];
    for (const actor of this.deps.actors()) {
      for (const g of actor.paintings()) {
        if (!g.drawn) continue;
        g.mesh.updateWorldMatrix(true, false);
        const e = this.entryOf(g);
        const px = pixelsPer1xTexel(g.mesh.matrixWorld, cam, H, g.painted.meta);
        out.push({ url: e.url, scale: e.scale, px1x: Math.round(px * 1000) / 1000, mag: Math.round((px / e.scale) * 1000) / 1000 });
      }
    }
    return out;
  }

  /** Everything the governor holds, for the debug API and the measurements. */
  stats(): GovernorStats {
    let resident = 0;
    const entries: GovernorStats['entries'] = [];
    for (const e of this.entries.values()) {
      resident += e.mb;
      entries.push({ url: e.url, scale: e.scale, mb: Math.round(e.mb * 10) / 10, px1x: Math.round(e.px1x * 100) / 100, seen: this.t - e.lastSeen <= SEEN_WINDOW_MS });
    }
    return {
      frame: this.frame,
      upgrades: this.upgrades,
      downgrades: this.downgrades,
      loadFailures: this.loadFailures,
      inflight: this.inflight,
      queued: this.ready.length,
      residentMB: Math.round(resident * 10) / 10,
      budgetMB: this.deps.budget().textureMB,
      lastSwapMs: this.lastSwapMs,
      entries,
      trace: [...this.trace],
    };
  }

  dispose(): void {
    this.disposed = true;
    this.entries.clear();
    this.ready.length = 0;
  }

  // ------------------------------------------------------------------ internals

  private entryOf(g: GovernedPainting): Entry {
    const tex = g.painted.texture;
    let e = this.entries.get(tex);
    if (!e) {
      const scale = Math.max(1, Math.round(Number(tex.userData['artScale'] ?? g.painted.scale ?? 1)));
      e = { texture: tex, painted: g.painted, url: g.painted.url, scale, baseScale: scale, baseImage: tex.image, mb: 0, lastSeen: -1e9, px1x: 0, loading: 0, failed: new Set(), needSince: -1 };
      this.entries.set(tex, e);
    }
    return e;
  }

  /** The ceiling for one painting: the device class's, and the largest master whose longer edge the GPU can hold. */
  private capOf(e: Entry): number {
    const m = e.painted.meta;
    const fit = Math.floor((this.deps.maxTexture?.() ?? Infinity) / Math.max(1, m.width, m.height));
    return Math.max(1, Math.min(this.deps.budget().maxScale, fit));
  }

  private scalesOf(e: Entry): number[] {
    return (this.deps.scalesFor(e.url) ?? []).filter((s) => !e.failed.has(s));
  }

  /** Register every painting, measure the drawn ones, and list what each would like to be. `hypothetical`: a camera that is not the live one. */
  private collect(cam: PerspectiveCamera, hypothetical: boolean): Need[] {
    const alive = new Set<Texture>();
    const needs: Need[] = [];
    const H = this.deps.bufferHeight();
    for (const actor of this.deps.actors()) {
      const list = actor.paintings();
      let lead = 0;
      for (const g of list) {
        alive.add(g.painted.texture);
        const e = this.entryOf(g);
        if (!g.drawn) continue;
        g.mesh.updateWorldMatrix(true, false);
        const px = pixelsPer1xTexel(g.mesh.matrixWorld, cam, H, g.painted.meta) * SAFETY;
        if (!hypothetical) {
          e.lastSeen = this.t;
          e.px1x = px;
          if (e.mb === 0) e.mb = textureMB(imageWidth(e.texture), imageHeight(e.texture));
        }
        const want = pickScale(requiredScale(px), this.scalesOf(e), this.capOf(e));
        lead = Math.max(lead, e.scale, e.loading);
        if (want > e.scale && want > e.loading) {
          if (hypothetical) needs.push({ entry: e, want, rank: 0, px1x: px });
          else {
            if (e.needSince < 0) e.needSince = this.t;
            if (this.t - e.needSince >= PERSIST_MS) needs.push({ entry: e, want, rank: 0, px1x: px });
          }
        } else if (!hypothetical) e.needSince = -1;
      }
      // Siblings: once a figure holds a master above where it started, its other poses follow it there, as room allows. Only a live,
      // lasting need makes a lead (a planned view or a bounce does not drag every pose of a figure up a tier).
      if (!hypothetical) {
        for (const g of list) {
          const s = this.entryOf(g);
          if (g.drawn || lead <= s.baseScale || lead <= s.scale || lead <= s.loading) continue;
          const want = pickScale(lead, this.scalesOf(s), this.capOf(s));
          if (want > s.scale && want > s.loading) needs.push({ entry: s, want, rank: 1, px1x: 0 });
        }
      }
    }
    if (!hypothetical) for (const tex of [...this.entries.keys()]) if (!alive.has(tex)) this.entries.delete(tex);
    return needs.sort((a, b) => a.rank - b.rank || b.px1x - a.px1x);
  }

  private dispatch(needs: Need[]): void {
    for (const n of needs) {
      if (this.inflight >= MAX_LOADS) break;
      const e = n.entry;
      if (e.loading >= n.want) continue;
      if (n.rank === 1 && !this.roomFor(n.want, e)) continue; // a speculative load never makes the budget evict anything
      e.loading = n.want;
      this.inflight++;
      this.trace.push({ frame: this.frame, why: n.rank === 1 ? 'sibling' : this.why, url: e.url, from: e.scale, want: n.want, px1x: Math.round(n.px1x * 100) / 100 });
      if (this.trace.length > 48) this.trace.shift();
      this.deps
        .load(e.url, n.want)
        .then((got) => {
          this.inflight--;
          if (this.disposed) return;
          if (!got || got.scale <= e.scale) {
            e.loading = 0;
            e.failed.add(n.want);
            if (!got) this.loadFailures++;
            return;
          }
          this.ready.push(() => this.apply(e, got.image, got.scale));
        })
        .catch(() => {
          this.inflight--;
          e.loading = 0;
          e.failed.add(n.want);
          this.loadFailures++;
        });
    }
  }

  /** Would a master of `scale` for this painting fit under the budget, counting every master already promised? (Sibling loads ask; they never evict.) */
  private roomFor(scale: number, e: Entry): boolean {
    const k = scale / e.scale;
    const now = e.mb > 0 || e.scale > e.baseScale ? textureMB(imageWidth(e.texture), imageHeight(e.texture)) : 0;
    return this.committedMB() + textureMB(imageWidth(e.texture) * k, imageHeight(e.texture) * k) - now <= this.deps.budget().textureMB;
  }

  /** Megabytes the figures' textures take once drawn: what is resident now, the masters swapped in that have not been drawn yet, and the loads on their way. */
  private committedMB(): number {
    let t = 0;
    for (const e of this.entries.values()) {
      const k = Math.max(e.loading, e.scale) / e.scale;
      if (e.mb > 0 || e.scale > e.baseScale || e.loading > e.scale) t += textureMB(imageWidth(e.texture) * k, imageHeight(e.texture) * k);
    }
    return t;
  }

  /** Swap the pixels in, on the next frame's turn. */
  private apply(e: Entry, image: PixelSource, scale: number): void {
    e.loading = 0;
    if (this.disposed || !this.entries.has(e.texture) || scale <= e.scale) return;
    const t0 = performance.now();
    this.setImage(e, image, scale);
    this.upgrades++;
    this.lastSwapMs = Math.round((performance.now() - t0) * 100) / 100;
    this.evict();
  }

  /** In place: the GL texture is freed now and made again, at the new size, on the next draw. */
  private setImage(e: Entry, image: unknown, scale: number): void {
    const tex = e.texture;
    tex.dispose();
    tex.image = image as typeof tex.image;
    tex.needsUpdate = true;
    tex.userData['artScale'] = scale;
    e.painted.scale = scale;
    e.scale = scale;
    e.mb = e.mb > 0 ? textureMB(imageWidth(tex), imageHeight(tex)) : 0;
  }

  /** Send masters above their first scale that are not on screen back to it, least recently seen first, until the textures fit the budget. */
  private evict(): void {
    const residents: Resident[] = [];
    const byKey = new Map<string, Entry>();
    let i = 0;
    for (const e of this.entries.values()) {
      if (e.mb <= 0) continue;
      const key = String(i++);
      byKey.set(key, e);
      residents.push({ key, scale: e.scale > e.baseScale ? e.scale : 1, mb: e.mb, lastSeen: e.lastSeen, visible: this.t - e.lastSeen <= SEEN_WINDOW_MS });
    }
    for (const key of evictionOrder(residents, this.deps.budget().textureMB)) {
      const e = byKey.get(key)!;
      this.setImage(e, e.baseImage, e.baseScale);
      this.downgrades++;
    }
  }
}

function imageWidth(t: Texture): number {
  const img = t.image as { naturalWidth?: number; width?: number } | null;
  return Number(img?.naturalWidth || img?.width || 1);
}

function imageHeight(t: Texture): number {
  const img = t.image as { naturalHeight?: number; height?: number } | null;
  return Number(img?.naturalHeight || img?.height || 1);
}
