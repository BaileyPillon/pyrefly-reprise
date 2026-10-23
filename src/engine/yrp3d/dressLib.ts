/**
 * **The dressphere models, loaded and kept warm** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only; `./dress.ts` says what the files are). A {@link DressLibrary} reads the manifest
 * (`dress/index.json`), builds a girl's model in any dressphere it lists, and keeps the models a swap may ask for next parsed and ready, so a change in the middle of a fight does not wait for a 25 MB file.
 *
 * - **A model** is the entry's armed `anims.glb` (the HD one, `hd/anims.glb`, when the page wants HD and the folder has it; the base one when the HD file is not there or does not load), cloned from the parsed file for each
 *   figure, with the plans of its own `clipmap.json` (`./clipMap.ts#dressPlansFor`, so the clip mapping stays data) and the `.chr` scale of its extras. Its weapons are in the file already. **A girl's models share one
 *   scale**: the starter is fitted to the figure's height as ever, and every other dressphere of hers is drawn at the same world scale (a Mascot, with its hat, 21 units against 17, stands taller than she did, as it does in the game;
 *   a swap does not change how big she is).
 * - **The parsed files** are shared and counted: a model leases the file it was cloned from and gives the lease back when it is disposed, and a file nobody holds and nobody has asked to keep warm is freed (its geometry and
 *   textures: a 4096 x 4096 HD texture is 64 MB, so what stays parsed is bounded).
 * - **Warming**: {@link DressLibrary.wearing} says a girl now wears a dressphere; the dresspheres she can change into next (`reach`: the neighbours on her Garment Grid, `./dressReach.ts`, at most {@link WARM_MAX}) are fetched
 *   and parsed one at a time, spaced out, after the fight has started, and the ones she can no longer reach are let go. A swap to a warm dressphere is a clone and a first draw.
 * - **No files, no problem**: a manifest that is not there means no library (the chapter keeps its single model per girl); a dressphere the manifest lacks, or whose files fail, gives no model and the skin keeps the one the girl has.
 *
 * Needs three.js (through the model); the files come through the loader's own IO (`./load.ts`), so a test hands fake bytes.
 */

import { dressPlansFor } from './clipMap.ts';
import { dressDirOf, dressFileUrl, dressFiles, dressIndexUrl, dressModelFile, parseDressIndex, type DressEntry, type DressIndex, type Girl } from './dress.ts';
import type { DressPort } from './dressSwap.ts';
import { chrScaleOf, defaultIO, freeScene, type FigureSource, type LoaderIO, type Parsed } from './load.ts';
import { YrpModel } from './model.ts';
import type { YrpId } from './layout.ts';

/** The most dresspheres warmed at once for one girl (each is up to 70 MB parsed): the ones she can change into next. */
export const WARM_MAX = 3;

export interface DressLibOptions {
  /** The page's base (`import.meta.env.BASE_URL`). */
  base: string;
  /** The models folder the `dress/` folder is in (the base one of `YRP_MODEL_DIRS`). */
  modelsDir: string;
  /** Take the HD file where the folder has one (the default; `?models=base` asks for the base files). */
  preferHd?: boolean;
  /** The figure's world height per id (the model is fitted to it; the skin refits to the actor's). */
  heights: Readonly<Record<YrpId, number>>;
  io?: LoaderIO;
  warn?: (message: string) => void;
  /** Which dresspheres a girl can change into from `current` (`./dressReach.ts`); with none, nothing is warmed. */
  reach?: (girl: Girl, current: string) => readonly string[];
  /** Milliseconds before the first warm-up and between one and the next (the defaults leave the opening and the frames alone); a test passes 0. */
  warmDelayMs?: number;
  gapMs?: number;
}

interface Held {
  value: Parsed | null;
  promise: Promise<Parsed | null>;
  users: number;
  want: boolean;
}

/** The library for a models folder, or null when it has no (valid) manifest. */
export async function openDressLibrary(opts: DressLibOptions): Promise<DressLibrary | null> {
  const io = opts.io ?? defaultIO();
  const json = await io.fetchJson(dressIndexUrl(opts.base, dressDirOf(opts.modelsDir)));
  const index = parseDressIndex(json);
  return index ? new DressLibrary(index, { ...opts, io }) : null;
}

export class DressLibrary implements DressPort {
  private readonly io: LoaderIO;
  private readonly dir: string;
  private readonly held = new Map<string, Held>();
  private readonly maps = new Map<string, Promise<unknown>>();
  private readonly wanted = new Map<Girl, Set<string>>();
  private chain: Promise<void> = Promise.resolve();
  private warmed = false;
  private closed = false;
  private readonly warnedAbout = new Set<string>();
  /** Each girl's starter's `trueHeight`: what her other dresspheres are scaled against. */
  private readonly reference = new Map<Girl, number>();

  constructor(
    readonly index: DressIndex,
    private readonly opts: DressLibOptions & { io: LoaderIO },
  ) {
    this.io = opts.io;
    this.dir = dressDirOf(opts.modelsDir);
  }

  /** The dressphere `girl` starts the chapter in (the manifest's, which is Chapter IV's build). */
  start(girl: Girl): string {
    return this.index.starts[girl];
  }

  has(girl: Girl, dress: string): boolean {
    return this.index.has(girl, dress);
  }

  /** What a figure loaded here reports as its source (the debug view's and the tests' read). */
  sourceOf(model: YrpModel, entry: DressEntry): FigureSource {
    return { mesh: `dress/${entry.folder}`, clips: `dress/${entry.folder}`, file: dressModelFile(entry, this.opts.preferHd !== false), look: 'diffuse', weapons: model.weaponKind };
  }

  private warn(message: string): void {
    if (this.warnedAbout.has(message)) return;
    this.warnedAbout.add(message);
    this.opts.warn?.(message);
  }

  private fetchParsed(url: string): Held {
    let h = this.held.get(url);
    if (h) return h;
    const entry: Held = { value: null, users: 0, want: false, promise: Promise.resolve(null) };
    entry.promise = (async () => {
      const bytes = await this.io.fetchBytes(url);
      if (!bytes) return null;
      try {
        const parsed = await this.io.parse(bytes);
        entry.value = parsed;
        if (this.closed || this.held.get(url) !== entry) freeScene(parsed.scene); // nobody wanted it by the time it came
        return parsed;
      } catch (e) {
        this.warn(`[yrp3d] ${url} did not parse: ${e instanceof Error ? e.message : String(e)}`);
        return null;
      }
    })();
    this.held.set(url, entry);
    h = entry;
    return h;
  }

  /** Take a lease on the parsed file at `url`: it stays until `release`. */
  private async lease(url: string): Promise<Parsed | null> {
    const h = this.fetchParsed(url);
    h.users++;
    const parsed = await h.promise;
    if (!parsed) this.release(url);
    return parsed;
  }

  private release(url: string): void {
    const h = this.held.get(url);
    if (!h) return;
    h.users = Math.max(0, h.users - 1);
    this.settle(url);
  }

  /** Free a parsed file nobody holds and nobody wants warm. */
  private settle(url: string): void {
    const h = this.held.get(url);
    if (!h || h.users > 0 || h.want) return;
    this.held.delete(url);
    if (h.value) freeScene(h.value.scene);
  }

  private mapOnce(url: string): Promise<unknown> {
    let p = this.maps.get(url);
    if (!p) {
      p = this.io.fetchJson(url);
      this.maps.set(url, p);
    }
    return p;
  }

  /** The URLs to try for an entry's model, best first: the HD file (when wanted and there), then the base one. */
  private urlsFor(entry: DressEntry): string[] {
    const files = dressFiles(entry);
    const hd = this.opts.preferHd !== false && files.hdAnims ? [files.hdAnims] : [];
    return [...hd, files.anims].map((f) => dressFileUrl(this.opts.base, this.dir, f));
  }

  /** A fresh model of `girl` in `dress`, or null when the manifest has no such dressphere or its files did not load. The caller owns the model (disposing it gives the lease back). */
  async model(girl: Girl, dress: string): Promise<YrpModel | null> {
    const entry = this.index.get(girl, dress);
    if (!entry || this.closed) return null;
    let leased: { url: string; parsed: Parsed } | null = null;
    for (const url of this.urlsFor(entry)) {
      const parsed = await this.lease(url);
      if (parsed) {
        leased = { url, parsed };
        break;
      }
    }
    if (!leased) {
      this.warn(`[yrp3d] no dressphere model for ${girl} in ${dress}: ${entry.folder} did not load`);
      return null;
    }
    const { url, parsed } = leased;
    const json = await this.mapOnce(dressFileUrl(this.opts.base, this.dir, dressFiles(entry).clipmap));
    const plans = dressPlansFor(json, parsed.animations.map((c) => c.name));
    const scene = await this.io.clone(parsed.scene);
    if (this.closed) {
      this.release(url);
      return null;
    }
    const model = new YrpModel(girl, scene, parsed.animations, this.opts.heights[girl], 'own', {
      plans,
      chrScale: chrScaleOf(parsed.extras),
      look: 'diffuse',
      dress: { name: dress, weapons: entry.weapons },
      onDispose: () => this.release(url),
    });
    const ref = this.reference.get(girl);
    if (ref !== undefined && ref > 0) model.setHeightScale(model.trueHeight / ref); // the same world scale as her starter
    return model;
  }

  /** The model the loader starts a girl in, with where it came from, or null (no such starter: the chapter's single model stands in). */
  async starter(id: YrpId): Promise<{ model: YrpModel; source: FigureSource } | null> {
    if (id === 'bahamut') return null;
    const dress = this.start(id);
    const entry = this.index.get(id, dress);
    const model = entry ? await this.model(id, dress) : null;
    if (model && !this.reference.has(id)) this.reference.set(id, model.trueHeight);
    return model && entry ? { model, source: this.sourceOf(model, entry) } : null;
  }

  /** `girl` wears `dress` now: warm the dresspheres she can change into from it, one at a time, and let go of the ones she can no longer reach. */
  wearing(girl: Girl, dress: string): void {
    if (this.closed) return;
    const next = (this.opts.reach?.(girl, dress) ?? []).filter((d) => d !== dress).map((d) => this.index.get(girl, d)).filter((e): e is DressEntry => e !== null).slice(0, WARM_MAX);
    const urls = new Set(next.map((e) => this.urlsFor(e)[0]!));
    const before = this.wanted.get(girl) ?? new Set<string>();
    this.wanted.set(girl, urls);
    for (const url of before) {
      if (urls.has(url)) continue;
      const h = this.held.get(url);
      if (h && ![...this.wanted].some(([g, set]) => g !== girl && set.has(url))) {
        h.want = false;
        this.settle(url);
      }
    }
    for (const url of urls) {
      if (before.has(url) && this.held.get(url)?.want) continue;
      this.chain = this.chain
        .then(() => this.pause())
        .then(async () => {
          if (this.closed || !this.wanted.get(girl)?.has(url)) return;
          const h = this.fetchParsed(url);
          h.want = true;
          await h.promise;
          if (!this.closed && !this.wanted.get(girl)?.has(url)) {
            h.want = false;
            this.settle(url);
          }
        })
        .catch(() => undefined);
    }
  }

  private pause(): Promise<void> {
    const ms = this.warmed ? (this.opts.gapMs ?? 350) : (this.opts.warmDelayMs ?? 1500);
    this.warmed = true;
    return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
  }

  /** Parsed files held right now (the debug view's and the tests' read). */
  get parsedCount(): number {
    return [...this.held.values()].filter((h) => h.value).length;
  }

  /** Resolves when the warm-up queued so far is done (a test's read). */
  get idle(): Promise<void> {
    return this.chain;
  }

  dispose(): void {
    this.closed = true;
    for (const h of this.held.values()) if (h.value) freeScene(h.value.scene);
    this.held.clear();
    this.wanted.clear();
  }
}
