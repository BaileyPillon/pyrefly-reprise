import type { Object3D } from 'three';
import { artManifest } from '../../ArtManifest.ts';
import { artUrl, loadPainted, prewarmPainted, softSilhouette, tryLoadMeta, type PaintedTexture, type PoseMeta } from '../../PaintedArt.ts';
import { giveBackColumn, hideColumn, showColumn } from './twirlColumn.ts';
import { GRID_EVENT, HOLD_MAX_MS, LATE_MS, TWIRL_WEIGHT, girlOf, keyRescale, playAt, twirlKeysOf, twirlPlan, twirlStepMs, twirlTimes, type TwirlKey } from './twirlPlan.ts';

export { GRID_EVENT, HOLD_MAX_MS, LATE_MS, TWIRL_PARTS, TWIRL_WEIGHT, girlOf, keyRescale, playAt, twirlKeysOf, twirlPlan, twirlStepMs, twirlTimes, type TwirlKey } from './twirlPlan.ts';

/** The pause between two prewarmed keys (ms): each decode is a burst of main-thread work, never two back to back. */
const WARM_GAP_MS = 250;

/**
 * The MAX mix (D-316), the FFX-2 spherechange's painted TWIRL KEYS slot (B's no-render part; FFX-2 only,
 * FFX has no spherechange: research/ffx-vs-ffx2-presentation.md section 6). The keys are Bailey's picks
 * (D-322, installed 2026-10-02 from the overnight art run, set `bailey:2026-10-02-art`):
 *
 * - a key is a chosen painting `public/art/characters/<figure>/twirl-<part>.png` (with its sidecar), so the
 *   art manifest lists it as a state of the dressphere it is painted in. Five parts: `twirl-start` (she
 *   begins to twirl in the dressphere she leaves, its weapon already gone), `twirl-going` (that outfit
 *   unravelling into pink and gold ribbons), `twirl-mid` (the ribbons and light: today's white column,
 *   painted; one per girl), `twirl-forming` (the new outfit forming out of the ribbons) and `twirl-end`
 *   (the manifest: a flourish in the new dressphere). A change from A to B plays A's start and going, her
 *   mid, then B's forming and end, each that is there (`twirlPlan`). No file is ever requested that the
 *   manifest does not list;
 * - each key is painted at its own dressphere's pixel scale (its sidecar `scale` multiplies that figure's
 *   idle, the house rule), while the stage sizes every pose by the idle it is standing in: a key painted
 *   for another figure is resized by the two idles' sidecars (`keyRescale`), so it stands as tall as it
 *   was painted; its sidecar `anchorY` keeps its own foot line (ribbons may hang below the feet);
 * - the keys play inside today's beat (Active ATB: never added to it, 0.8 s,
 *   `SpherechangeFlourish.FLOURISH_MS`), each part for its share of the art run's proposed step clock
 *   (start 2, going 2, mid 3, forming 2, end 3); the white flash on the figure, the screen wash and the
 *   flourish's white column give way to them (the motes, the ring and the name plate stay), and the new
 *   outfit lands after the last key;
 * - with no keys for a change nothing changes: today's flourish plays exactly as it does.
 *
 * Part of DRESSPHERE SHOT (BATTLE SPECTACLE), so the switch that holds the close shot also holds the
 * keys. REDUCE MOTION: no keys (today's flourish, which is already a cut under it). Presentation only.
 *
 * Round 19 (PR-0315, PR-0327; FFX-2 only):
 * - **one painting at a time.** A key is a cut to the next (`applyPose` on the showing plane), never a
 *   crossfade; but a pose crossfade the presenter had already started (its 120 ms to the cast pose) kept
 *   writing the two planes' opacities underneath, so for about 0.2 s the old outfit and a key showed at once, a
 *   ghosted double. While a change plays, the showing plane is pinned at full and the other at none, every frame
 *   (`pin`); `stats.ghost` is the most the other plane showed before the pin, a check's measure;
 * - **keys ready, or no keys.** The keys are fetched and decoded ahead (`prewarm`, at idle, one at a time: the
 *   party's own `twirl-start`, `-going` and `-mid` at battle start, the `-forming` and `-end` of the dressphere
 *   each outfit in the Change submenu would put on, when it opens), and a change whose keys are not ready within `LATE_MS` plays today's
 *   flourish instead of keys that land after the new outfit.
 *
 * Round 21 (PR-0334, PR-0314; FFX-2 only): the flourish's CSS white column is hidden from the change's first frame (`twirlColumn.ts`) and
 * given back, replayed, only if the keys do not come; the idle sidecars a change reads are fetched with the keys (so a first change does not
 * miss `LATE_MS`); the twirl starts as soon as its keys are here instead of after the new outfit's paintings have loaded, and its last key
 * holds until they are (`playAt`, `load`); the held shot starts from `takeBegun()` and is held while `busy()` (`heldShots.ts`).
 */

type Guts = Object3D & {
  slots: { mesh: Object3D; pose: string; fade: number }[];
  syncOpacity(): void;
  active: number;
  poses: Map<string, PaintedTexture>;
  poseUrls: Record<string, string>;
  applyPose(i: number, name: string, tex: PaintedTexture): void;
  flash(colour?: number | string, ms?: number, peak?: number, floorCut?: number): void;
  loadPoses(poses: Record<string, string>, initial?: string): Promise<void>;
};

const subjectOf = (url: string | undefined): string => /characters\/([^/]+)\//.exec(url ?? '')?.[1] ?? '';

/** Hide the stage's full-screen wash for `ms` (the spherechange's white card, VP-1001-15). */
function hideWash(ms: number): void {
  const el = document.querySelector<HTMLElement>('.battle-screen-flash');
  if (!el) return;
  el.style.visibility = 'hidden';
  window.setTimeout(() => (el.style.visibility = ''), ms);
}

/** Watches the FFX-2 girls' figures; plays a change's keys when the manifest lists any. */
export class TwirlSlot {
  private readonly wrapped = new Set<Guts>();
  private readonly idles = new Map<string, Promise<PoseMeta | null>>();
  /** `pre`: the keys sized for the figure standing now (the outfit she leaves); `post`: sized for the new outfit's idle, which the stage uses once it has loaded. */
  private play: { a: Guts; pre: PaintedTexture[]; post: PaintedTexture[]; at: number[]; end: number; t: number; ready: boolean; held: number } | null = null;
  on = false;
  /** Figures whose change began since the mix last asked, and how many changes are loading (PR-0314: the held shot starts at the first frame, not the load's end). */
  private readonly began: Object3D[] = [];
  private loading = 0;
  readonly stats = { changes: 0, played: 0, keysFound: 0, late: 0, prewarmed: 0, ghost: 0, ghostNow: 0, lastPlan: [] as string[] };
  /** Checks only: `false` leaves the planes as the presenter's crossfade has them (what round 19 saw). */
  pinOn = true;
  /**
   * Fetch ahead at battle start (the full tier on a desktop window). Off on the phone and under LOW EFFECTS, where the keys of
   * a girl are fetched when her Change submenu opens instead: about 5 MB less for a fight in which nobody changes.
   */
  eager = true;
  private readonly girls = new Map<string, Guts>();
  private readonly flashes = new Map<Guts, Guts['flash']>();
  private readonly warmed = new Set<string>();
  private warming: Promise<void> = Promise.resolve();
  private readonly onGrid = (e: Event): void => {
    const d = (e as CustomEvent<{ girl?: string; to?: string[] }>).detail;
    if (d?.girl && Array.isArray(d.to)) this.prewarmGrid(d.girl, d.to);
  };

  constructor() {
    if (typeof window !== 'undefined') window.addEventListener(GRID_EVENT, this.onGrid);
  }

  /** Wrap a party figure (once): its `loadPoses` (the change) and `flash` (the white flash it replaces). */
  watch(o: Object3D): void {
    const a = o as Guts;
    if (this.wrapped.has(a) || typeof a.loadPoses !== 'function') return;
    this.wrapped.add(a);
    const load = a.loadPoses;
    const flash = a.flash;
    this.flashes.set(a, flash);
    const self = this;
    a.loadPoses = function (poses: Record<string, string>, initial?: string): Promise<void> {
      const from = subjectOf(a.poseUrls['idle']);
      const to = subjectOf(poses['idle']);
      const done = load.call(a, poses, initial);
      if (self.on && from && to && from !== to) {
        self.began.push(a);
        void self.start(a, from, to, done);
      }
      return done;
    };
    a.flash = function (colour?: number | string, ms?: number, peak?: number, floorCut?: number): void {
      // The presenter's 420 ms full white flash on a spherechange, and the screen wash right after it:
      // the keys replace both when this girl has any.
      if (self.on && colour === 0xffffff && ms === 420 && peak === 1 && self.hasKeys(a)) {
        queueMicrotask(() => hideWash(450));
        return;
      }
      flash.call(a, colour, ms, peak, floorCut);
    };
    this.girls.set(girlOf(subjectOf(a.poseUrls['idle'])), a);
    this.idle(() => (this.eager ? this.prewarmFrom(a) : undefined));
  }

  /** Is a change loading or its keys playing? A held shot is not handed back while it is (heldShots.ts). */
  busy(): boolean {
    return this.loading > 0 || this.play !== null;
  }

  /** The figures whose change began since the last call (and forget them): what `HeldIn.begun` carries. */
  takeBegun(): Object3D[] { return this.began.length ? this.began.splice(0) : []; }

  /** Run `fn` when the browser is idle (a short timeout where it has no idle callback). */
  private idle(fn: () => void): void {
    const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (typeof ric === 'function') ric(fn, { timeout: 4000 });
    else window.setTimeout(fn, 2500);
  }

  /** Fetch and decode these keys one after another, at idle (PR-0327): the same cache `loadPainted` reads. */
  prewarm(keys: readonly TwirlKey[]): void {
    const m = artManifest();
    if (!m || !this.on) return;
    for (const k of keys) {
      const url = artUrl(`art/characters/${k.figure}/${k.key}.png`);
      if (this.warmed.has(url) || !(m.subjects[k.figure]?.states ?? []).includes(k.key)) continue;
      this.warmed.add(url);
      this.warming = this.warming.then(() => new Promise<void>((res) => window.setTimeout(res, WARM_GAP_MS))).then(() => prewarmPainted(url)).then((ok) => void (ok && this.stats.prewarmed++), () => undefined);
    }
  }

  /** At battle start: the keys this girl always needs, the dressphere she leaves and her `twirl-mid`. */
  private prewarmFrom(a: Guts): void {
    const m = artManifest();
    const from = subjectOf(a.poseUrls['idle']);
    if (!m || !from || !this.on) return;
    const plan = twirlPlan(from, '', (id) => m.subjects[id]?.states ?? null, Object.keys(m.subjects));
    this.prewarm(plan);
    // The scales a change reads (each figure's idle sidecar, a few hundred bytes): fetched now, so the first change does not wait a
    // round trip for them and miss `LATE_MS` (PR-0334: a late change plays the white flourish the keys replace).
    for (const f of new Set([from, ...plan.map((k) => k.figure)])) void this.idleMeta(f);
  }

  /** The Change submenu opened for `girl`: the keys of the dressphere each reachable node would put on. */
  prewarmGrid(girl: string, to: readonly string[]): void {
    const m = artManifest();
    if (!m || !girl) return;
    const mine = this.girls.get(girl.toLowerCase());
    if (mine) this.prewarmFrom(mine); // the dressphere she leaves and her twirl-mid, first
    const keys: TwirlKey[] = [];
    for (const id of to) {
      const fig = `${girl.toLowerCase()}-${id}`;
      void this.idleMeta(fig); // the new outfit's scale, ahead of the change (see `prewarmFrom`)
      for (const key of ['twirl-forming', 'twirl-end']) keys.push({ figure: fig, key });
    }
    this.prewarm(keys);
  }

  /** Does this girl ship twirl keys under any of her figures? */
  private hasKeys(a: Guts): boolean {
    const m = artManifest();
    const from = subjectOf(a.poseUrls['idle']);
    const girl = girlOf(from);
    if (!m || !girl) return false;
    return Object.keys(m.subjects).some((id) => id.startsWith(`${girl}-`) && twirlKeysOf(m.subjects[id]?.states ?? []).length > 0);
  }

  /** A figure's idle sidecar (its pixel scale), fetched once per battle. */
  private idleMeta(fig: string): Promise<PoseMeta | null> {
    let p = this.idles.get(fig);
    if (!p) this.idles.set(fig, (p = tryLoadMeta(artUrl(`art/characters/${fig}/idle.png`))));
    return p;
  }

  private async start(a: Guts, from: string, to: string, done: Promise<void>): Promise<void> {
    this.stats.changes++;
    const m = artManifest();
    const plan = m ? twirlPlan(from, to, (id) => m.subjects[id]?.states ?? null, Object.keys(m.subjects)) : [];
    if (!plan.length) return; // today's flourish
    this.stats.keysFound++;
    // PR-0334 (round 21): the flourish's CSS white column opens on the change's first frame, the keys only after they and the new outfit
    // have loaded (hundreds of ms on a network): a hard-edged white slab in 7 of 7 changes. The keys replace it, so it is hidden from
    // the first frame, synchronously; if the keys do not come it is given back, replayed from its start.
    hideColumn();
    const guard = window.setTimeout(() => {
      if (!this.play) showColumn(); // a load that never ends must not hide a later change's column
    }, 3000);
    let played = false;
    this.loading++;
    try {
      played = await this.load(a, plan, from, to, done);
    } finally {
      this.loading--;
      window.clearTimeout(guard);
      if (!played) giveBackColumn(a.name);
    }
  }

  /**
   * Fetch the plan's keys (and the idles' scales), then queue the play. True when a play is queued; false for today's flourish.
   *
   * Round 21 (PR-0314): the play starts as soon as the keys are here, not after the new outfit's paintings have loaded (`done`): on a
   * network that wait was the figure standing in her old outfit for hundreds of ms, longer with the high-resolution tiers. The keys are files
   * of their own, so they do not wait for it; the only things that do are the size the stage draws a pose at (it is set by the idle in use, so
   * each key carries a `pre` size for the outfit she leaves and a `post` one for the new idle) and the last frame, which holds until the new
   * outfit is ready (`playAt`).
   */
  private async load(a: Guts, plan: readonly TwirlKey[], from: string, to: string, done: Promise<void>): Promise<boolean> {
    const figs = [...new Set([to, from, ...plan.map((k) => k.figure)])];
    const all = Promise.all([
      Promise.all(plan.map((k) => loadPainted(artUrl(`art/characters/${k.figure}/${k.key}.png`), () => softSilhouette('twirl')))),
      Promise.all(figs.map((f) => this.idleMeta(f))),
    ]);
    let timer = 0;
    const got = await Promise.race([all, new Promise<null>((res) => (timer = window.setTimeout(() => res(null), LATE_MS)))]);
    window.clearTimeout(timer);
    if (!got) {
      // The keys are not here yet: today's flourish (the white flash the keys had replaced), and the keys are kept for the next change.
      this.stats.late++;
      void all.then(([ks]) => ks.forEach((k) => k.texture.dispose())).catch(() => undefined);
      if (this.on) this.flashes.get(a)?.call(a, 0xffffff, 420, 1);
      return false;
    }
    const [loaded, idles] = got;
    const idleOf = (f: string): PoseMeta | null => idles[figs.indexOf(f)] ?? null;
    const sized = (k: PaintedTexture, r: number): PaintedTexture => (r === 1 ? k : { ...k, meta: { ...k.meta, scale: (k.meta.scale ?? 1) * r } });
    const pre: PaintedTexture[] = [];
    const post: PaintedTexture[] = [];
    const parts: string[] = [];
    loaded.forEach((k, i) => {
      if (k.placeholder) return void k.texture.dispose();
      const own = plan[i]!;
      pre.push(sized(k, own.figure === from ? 1 : keyRescale(idleOf(own.figure), idleOf(from))));
      post.push(sized(k, own.figure === to ? 1 : keyRescale(idleOf(own.figure), idleOf(to))));
      parts.push(own.key);
    });
    if (!pre.length) return false;
    const { at, end } = twirlTimes(pre.length, undefined, parts.map((p) => TWIRL_WEIGHT[p] ?? 2));
    this.stats.lastPlan = plan.map((k) => `${k.figure}/${k.key}`);
    const play = { a, pre, post, at, end, t: 0, ready: false, held: 0 };
    this.play = play;
    this.stats.played++;
    void done.then(() => void (play.ready = true), () => void (play.ready = true)); // the outfit is in (or will never be): the last key may let go
    return true;
  }

  /** Every frame (FFX-2): the key on screen for the change in play. */
  update(dt: number): void {
    const p = this.play;
    if (!p) return;
    const step = twirlStepMs(dt);
    p.t += step;
    const a = p.a;
    const slot = a.slots[a.active];
    const shown = playAt(p.at, p.end, p.t, p.ready);
    if (!slot || shown.over) return this.finish();
    if (p.t >= p.end) {
      p.held += step; // the keys are done and the new outfit is not in yet: the last key holds, for a while
      if (p.held > HOLD_MAX_MS) return this.finish();
    }
    a.applyPose(a.active, slot.pose, (p.ready ? p.post : p.pre)[shown.i]!);
    this.pin(a);
  }

  /**
   * One painting on screen (PR-0315): the plane showing a key at full, the other at none. A pose crossfade the
   * presenter started a moment before the change keeps writing both planes' opacities each frame (its tween),
   * and read as the old outfit and a key at once. The most the other plane showed is `stats.ghost`.
   */
  private pin(a: Guts): void {
    const slot = a.slots[a.active];
    if (!slot) return;
    this.stats.ghostNow = 0;
    for (const s of a.slots) if (s !== slot) this.stats.ghostNow = Math.round(s.fade * 100) / 100;
    this.stats.ghost = Math.max(this.stats.ghost, this.stats.ghostNow);
    if (!this.pinOn) return;
    for (const s of a.slots) s.fade = s === slot ? 1 : 0;
    a.syncOpacity();
  }

  private finish(): void {
    const p = this.play;
    this.play = null;
    showColumn();
    if (!p) return;
    const slot = p.a.slots[p.a.active];
    const tex = slot ? (p.a.poses.get(slot.pose) ?? p.a.poses.get('idle')) : undefined;
    if (slot && tex) p.a.applyPose(p.a.active, slot.pose, tex);
    for (const k of p.pre) k.texture.dispose();
  }

  dispose(): void {
    if (typeof window !== 'undefined') window.removeEventListener(GRID_EVENT, this.onGrid);
    this.finish();
    this.on = false; // the wrappers stay on the figures, inert
  }
}
