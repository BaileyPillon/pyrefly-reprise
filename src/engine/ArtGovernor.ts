import type { PerspectiveCamera, Texture } from 'three';
import { pickScale, requiredScale, textureMB } from './ArtBudget.ts';
import { EVICT_EVERY_MS, MAX_LOADS, PERSIST_MS, SAFETY, SEEN_WINDOW_MS, URGENT_EXTRA, type Entry, type Need } from './ArtEntry.ts';
import { evictions, roomFor, WARM_MIN_PIXELS, warmMB, warmRoom } from './ArtMemory.ts';
import { imageHeight, imageWidth, pixelsPer1xTexel, type GovernedActor, type GovernedPainting, type GovernedStage, type GovernorDeps, type GovernorStats, type LoadedPixels } from './ArtMeasure.ts';

export { PERSIST_MS, SEEN_WINDOW_MS } from './ArtEntry.ts';
export { pixelsPer1xTexel, type GovernedActor, type GovernedPainting, type GovernedStage, type GovernorDeps, type GovernorStats, type LoadedPixels, type LoadOptions, type PixelSource } from './ArtMeasure.ts';

/**
 * The art governor (release 39, "r39-hires-engine"; both games, shared plumbing, no game content).
 *
 * A painting is loaded at the master the device's budget allows before anything has measured it (`ArtTier.baseScaleFor`). From then on this decides, every frame and
 * from the camera that is actually looking at it, which master each figure needs: the smallest one that does not magnify a texel past one screen pixel
 * (`ArtBudget.pickScale`), within the device's ceiling. The swap is made **in place**, on the texture object the plane already draws, so the plane, its sidecar geometry,
 * its shadow and every pose comparison are untouched and every actor sharing the texture sees the new pixels at once.
 *
 * - **On demand**: a drawn painting whose measured magnification passes one texel per pixel is upgraded (`update`).
 * - **Ahead of a shot**: `anticipate` runs the same measurement from a camera that is not on screen yet (a rig, a held shot, the colossus master, a push-in).
 * - **Within a memory budget**: masters above the first-seen scale that are not on screen go back to it (`ArtMemory.evictions`) over `ArtBudget.textureMB`.
 * - **Siblings**: once a figure holds a master above where its other poses started, they follow at the same scale in the background, as room allows without evicting
 *   anything (a figure's opening poses start at the base master and its other poses at the approved file, `ArtTier.isOpeningPose`).
 *
 * At most two masters are in the air and one swap lands per frame.
 *
 * **Release 39.1: a swap never uploads.** Three used to upload a swapped-in master inside the next render, on the frame that drew it (145 ms for a 4x figure). Now a loaded
 * master that carries decoded pixels is uploaded ahead, a few megabytes a frame, into a staging texture (`TextureStager.ts`) while the painting keeps drawing the one it has;
 * when it is fully resident the painting adopts it (`apply`). A painting not drawn yet is **warmed** the same way (its own master, uploaded before its first draw), up to the
 * warm cap (`ArtMemory.ts`). With no stager (the tests, a browser that failed the probe) the swap is release 39's.
 */

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
  private staging = 0;
  private stagedLanded = 0;
  private warmed = 0;
  private lastSwapMs = 0;
  private updateMs = 0;
  private readonly trace: GovernorStats['trace'] = [];
  private readonly swaps: GovernorStats['swaps'] = [];
  /** Who is asking right now (for the trace). */
  private why = 'live';

  constructor(deps: GovernorDeps) {
    this.deps = deps;
  }

  /** One frame: register what is there, measure what is drawn, start what is needed, apply one finished swap, evict when over budget. */
  update(): void {
    if (this.disposed) return;
    const started = performance.now();
    this.run();
    this.updateMs += (performance.now() - started - this.updateMs) * 0.02;
  }

  private run(): void {
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

  /** Measure every drawn figure from a camera that is not on screen yet (a rig, a held shot, the colossus master, a push-in) and load what it would ask for. Returns how many loads it wanted. */
  anticipate(cam: PerspectiveCamera): number {
    if (this.disposed || this.deps.pinned?.()) return 0;
    cam.updateMatrixWorld();
    this.why = 'anticipated';
    const needs = this.collect(cam, true);
    this.dispatch(needs);
    return needs.length;
  }

  /** Ask for the master a figure needs when drawn `frac` of the frame tall (the held shots are framed by size, `fx/mix/heldShots.ts`); only paintings on screen. Returns how many loads it wanted. */
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
      entries.push({ url: e.url, scale: e.scale, mb: Math.round(e.mb * 10) / 10, px1x: Math.round(e.px1x * 100) / 100, seen: this.t - e.lastSeen <= SEEN_WINDOW_MS, warm: e.warm });
    }
    return {
      frame: this.frame, upgrades: this.upgrades, downgrades: this.downgrades, loadFailures: this.loadFailures, inflight: this.inflight, queued: this.ready.length,
      staging: this.staging, stagedLanded: this.stagedLanded, warmed: this.warmed, warmMB: Math.round(warmMB(this.entries.values()) * 10) / 10,
      residentMB: Math.round(resident * 10) / 10, budgetMB: this.deps.budget().textureMB, lastSwapMs: this.lastSwapMs, updateMs: Math.round(this.updateMs * 1000) / 1000,
      entries, trace: [...this.trace], swaps: [...this.swaps],
    };
  }

  dispose(): void {
    this.disposed = true;
    for (const e of this.entries.values()) this.dropStage(e);
    this.entries.clear();
    this.ready.length = 0;
  }

  // ------------------------------------------------------------------ internals

  private entryOf(g: GovernedPainting): Entry {
    const tex = g.painted.texture;
    let e = this.entries.get(tex);
    if (!e) {
      const scale = Math.max(1, Math.round(Number(tex.userData['artScale'] ?? g.painted.scale ?? 1)));
      e = { texture: tex, painted: g.painted, url: g.painted.url, scale, baseScale: scale, baseImage: tex.image, mb: 0, lastSeen: -1e9, px1x: 0, loading: 0, failed: new Set(), needSince: -1, staged: null, askedAt: 0, dropped: false, warm: false, warmTried: false, pendingMB: 0 };
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

  /** Can a loaded master be staged right now (a stage dependency, and the browser has proved the staged upload exact)? */
  private canStage(): boolean {
    return this.deps.stage !== undefined && (this.deps.canStage?.() ?? true);
  }

  /** A painting not drawn in the last 0.75 s: what lands for it is speculative until it is seen. */
  private unseen(e: Entry): boolean {
    return this.t - e.lastSeen > SEEN_WINDOW_MS;
  }

  /** Register every painting, measure the drawn ones, and list what each would like to be. `hypothetical`: a camera that is not the live one. */
  private collect(cam: PerspectiveCamera, hypothetical: boolean): Need[] {
    const alive = new Set<Texture>();
    const needs: Need[] = [];
    const H = this.deps.bufferHeight();
    const warming = !hypothetical && this.canStage();
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
          e.warm = false; // drawn: no longer speculative
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
      // lasting need makes a lead (a planned view or a bounce does not drag every pose of a figure up a tier). A painting that has
      // not been drawn yet and has nothing to upgrade to is warmed instead: its own master, uploaded before its first draw.
      if (!hypothetical) {
        for (const g of list) {
          const s = this.entryOf(g);
          if (g.drawn) continue;
          if (lead > s.baseScale && lead > s.scale && lead > s.loading) {
            const want = pickScale(lead, this.scalesOf(s), this.capOf(s));
            if (want > s.scale && want > s.loading) {
              needs.push({ entry: s, want, rank: 1, px1x: 0 });
              continue;
            }
          }
          if (warming && s.mb === 0 && !s.warm && !s.warmTried && s.loading === 0 && imageWidth(s.texture) * imageHeight(s.texture) >= WARM_MIN_PIXELS) {
            if (warmRoom(this.entries.values(), textureMB(imageWidth(s.texture), imageHeight(s.texture)), this.deps.budget().textureMB)) needs.push({ entry: s, want: s.scale, rank: 1, px1x: 1, warm: true });
          }
        }
      }
    }
    if (!hypothetical) {
      for (const [tex, e] of [...this.entries]) {
        if (alive.has(tex)) continue;
        this.dropStage(e);
        this.entries.delete(tex);
      }
    }
    return needs.sort((a, b) => a.rank - b.rank || b.px1x - a.px1x);
  }

  private dispatch(needs: Need[]): void {
    for (const n of needs) {
      if (this.inflight >= MAX_LOADS + (n.rank === 0 ? URGENT_EXTRA : 0)) break; // a figure on screen never waits behind a speculative load
      const e = n.entry;
      if (e.loading >= n.want) continue;
      const budgetMB = this.deps.budget().textureMB;
      if (n.rank === 1 && !roomFor(this.entries.values(), n.want, e, budgetMB)) continue; // a speculative load never makes the budget evict anything
      const sizeMB = textureMB((imageWidth(e.texture) * n.want) / e.scale, (imageHeight(e.texture) * n.want) / e.scale);
      if (n.warm && !warmRoom(this.entries.values(), sizeMB, budgetMB)) continue; // the warm pool has room for this one, counting every one already on its way
      e.loading = n.want;
      e.askedAt = this.t;
      if (n.rank === 1) e.pendingMB = sizeMB;
      if (n.warm) e.warmTried = true;
      this.inflight++;
      this.trace.push({ frame: this.frame, why: n.warm ? 'warm' : n.rank === 1 ? 'sibling' : this.why, url: e.url, from: e.scale, want: n.want, px1x: Math.round(n.px1x * 100) / 100 });
      if (this.trace.length > 48) this.trace.shift();
      this.deps
        .load(e.url, n.want, { urgent: n.rank === 0, warm: n.warm === true })
        .then((got) => this.loaded(e, n, got))
        .catch(() => this.failed(e, n));
    }
  }

  /** A load that raised: the master is not asked for again (a warm-up is just dropped). */
  private failed(e: Entry, n: Need): void {
    this.inflight--;
    this.clearLoading(e, n.want);
    if (n.warm) return;
    e.failed.add(n.want);
    this.loadFailures++;
  }

  /** The job for `scale` is over: the entry is free to ask again, unless a bigger one has been asked for since. */
  private clearLoading(e: Entry, scale: number): void {
    if (e.loading > scale) return;
    e.loading = 0;
    e.pendingMB = 0;
  }

  /** A master has loaded: stage its upload when it can be (the painting adopts it once it is resident), else queue the swap on the spot (a warm-up is dropped instead). */
  private loaded(e: Entry, n: Need, got: LoadedPixels | null): void {
    if (this.disposed) return void got?.bitmap?.close();
    const warm = n.warm === true;
    if (!got || got.scale < e.scale || (got.scale === e.scale && !warm) || !this.entries.has(e.texture)) {
      this.inflight--;
      this.clearLoading(e, n.want);
      got?.bitmap?.close();
      if (!warm) {
        e.failed.add(n.want); // nothing better came back: the master is not asked for again
        if (!got) this.loadFailures++;
      }
      return;
    }
    // Memory the painting is not using yet is speculative: it is staged only while the warm pool has room (a drawn painting is always staged).
    const room = !this.unseen(e) || warmRoom(this.entries.values(), textureMB(got.image.width, got.image.height), this.deps.budget().textureMB, e);
    const staged = got.bitmap && room ? (this.deps.stage?.(e.texture, got, n.rank === 0) ?? null) : null;
    if (!staged) {
      this.inflight--;
      got.bitmap?.close();
      if (warm) this.clearLoading(e, n.want);
      else this.ready.push(() => this.apply(e, got, null));
      return;
    }
    e.staged = staged;
    this.staging++;
    void staged.ready.then((ok) => {
      this.staging--;
      this.inflight--;
      e.staged = null;
      if (this.disposed) return staged.cancel();
      if (!ok) return this.clearLoading(e, n.want); // cancelled (a lost context, the painting left): not the master's fault, so it is not marked failed
      this.ready.push(() => this.apply(e, got, staged));
    });
  }

  /** Cancel a painting's upload in progress (it left the field, or the stage ended). */
  private dropStage(e: Entry): void {
    if (!e.staged) return;
    e.dropped = true;
    e.staged.cancel();
  }

  /** Swap the master in, on the next frame's turn: adopt the one already uploaded (release 39.1), or put the pixels in the old way. */
  private apply(e: Entry, got: LoadedPixels, staged: GovernedStage | null): void {
    this.clearLoading(e, got.scale);
    const warm = got.scale === e.scale;
    if (this.disposed || !this.entries.has(e.texture) || got.scale < e.scale || (warm && !staged)) return void staged?.cancel();
    const t0 = performance.now();
    const from = e.scale;
    if (staged) {
      if (!staged.adopt()) {
        if (!warm) {
          e.failed.add(got.scale);
          this.loadFailures++;
        }
        return;
      }
      this.stagedLanded++;
      this.noteSwap(e, got.scale, true);
      e.warm = this.unseen(e); // resident before it was drawn: speculative until it is
      if (warm) this.warmed++;
    } else {
      this.setImage(e, got.image, got.scale);
    }
    if (!warm) this.upgrades++;
    this.lastSwapMs = Math.round((performance.now() - t0) * 100) / 100;
    this.swaps.push({ t: Math.round(this.t), url: e.url, from, to: got.scale, staged: staged !== null, warm, waitMs: Math.round(this.t - e.askedAt) });
    if (this.swaps.length > 48) this.swaps.shift();
    this.evict();
  }

  /** In place, the release 39 way: the GL texture is freed now and made again, at the new size, on the next draw. */
  private setImage(e: Entry, image: unknown, scale: number): void {
    const tex = e.texture;
    tex.dispose();
    tex.image = image as typeof tex.image;
    tex.needsUpdate = true;
    e.warm = false;
    this.noteSwap(e, scale, false);
  }

  /** The bookkeeping of a swap: which master the texture holds, and its GPU size (a staged texture is resident whether or not it has been drawn). */
  private noteSwap(e: Entry, scale: number, resident: boolean): void {
    const tex = e.texture;
    tex.userData['artScale'] = scale;
    e.painted.scale = scale;
    e.scale = scale;
    e.mb = resident || e.mb > 0 ? textureMB(imageWidth(tex), imageHeight(tex)) : 0;
  }

  /** Send masters above their first scale that are not on screen back to it, least recently seen first, until the textures fit the budget. */
  private evict(): void {
    for (const e of evictions(this.entries.values(), this.t, this.deps.budget().textureMB)) {
      this.setImage(e, e.baseImage, e.baseScale);
      this.downgrades++;
    }
  }
}
