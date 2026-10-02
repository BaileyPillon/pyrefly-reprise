import type { Object3D } from 'three';
import { artManifest } from '../../ArtManifest.ts';
import { artUrl, loadPainted, softSilhouette, tryLoadMeta, type PaintedTexture, type PoseMeta } from '../../PaintedArt.ts';

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
 */

/** The five parts of a painted change, in playing order (D-322). */
export const TWIRL_PARTS = ['twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end'] as const;

/** Each part's share of the beat: the art run's proposed step clock (12 steps of 1/12 s: 2, 2, 3, 2, 3). */
export const TWIRL_WEIGHT: Readonly<Record<string, number>> = { 'twirl-start': 2, 'twirl-going': 2, 'twirl-mid': 3, 'twirl-forming': 2, 'twirl-end': 3 };

/** The twirl keys a figure ships, in playing order (from the art manifest's states). Pure on its input. */
export function twirlKeysOf(states: readonly string[]): string[] {
  const order = ['start', 'going', 'mid', 'forming', 'end'];
  const rank = (s: string): number => {
    const m = /-(start|going|mid|forming|end)$/.exec(s);
    return m ? order.indexOf(m[1]!) : order.length;
  };
  return states.filter((s) => /^twirl-[a-z0-9-]+$/i.test(s)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'en', { numeric: true }));
}

/** The girl a figure belongs to (`yuna-gunner` -> `yuna`). */
export const girlOf = (figure: string): string => figure.split('-')[0] ?? '';

/** One key of a change: the figure whose folder holds the painting (the dressphere it is painted in), and its state. */
export interface TwirlKey {
  figure: string;
  key: string;
}

/**
 * The keys a change from `from` to `to` plays, in order: the old dressphere's `twirl-start` and
 * `twirl-going`, the girl's `twirl-mid` (under the new figure, the old one, or any figure of hers: `others`
 * is every subject id the manifest knows), the new dressphere's `twirl-forming` and `twirl-end`. Only what
 * `statesOf` lists; empty means today's flourish. Pure on its input.
 */
export function twirlPlan(from: string, to: string, statesOf: (id: string) => readonly string[] | null, others: readonly string[] = []): TwirlKey[] {
  const has = (fig: string, key: string): boolean => !!fig && (statesOf(fig) ?? []).includes(key);
  const plan: TwirlKey[] = [];
  for (const key of ['twirl-start', 'twirl-going']) if (has(from, key)) plan.push({ figure: from, key });
  const girl = girlOf(to || from);
  const mine = others.filter((id) => girl && id.startsWith(`${girl}-`)).sort();
  const mid = [to, from, ...mine].find((fig) => has(fig, 'twirl-mid'));
  if (mid) plan.push({ figure: mid, key: 'twirl-mid' });
  for (const key of ['twirl-forming', 'twirl-end']) if (has(to, key)) plan.push({ figure: to, key });
  return plan;
}

/**
 * What a key's own sidecar `scale` is multiplied by when it is shown on a figure standing in the idle
 * `stage` although it was painted against the idle `own` (`computePoseScale` sizes every pose by the idle
 * on stage): the two idles' pixels per world unit. 1 when either is unknown. Pure.
 */
export function keyRescale(own: Pick<PoseMeta, 'baselineY' | 'scale'> | null, stage: Pick<PoseMeta, 'baselineY' | 'scale'> | null): number {
  if (!own || !stage || !(own.baselineY > 0) || !(stage.baselineY > 0)) return 1;
  return (stage.baselineY / own.baselineY) * ((own.scale ?? 1) / (stage.scale ?? 1));
}

/**
 * How far one frame moves the twirl's clock (ms): the frame's own time, but never more than two frames at
 * 60 Hz. The change's first frames upload the new outfit's paintings and the keys; one such long frame let
 * the first key show for a single frame in the 2026-10-02 in-battle check (Chapter IV, 15 to 74 ms instead
 * of 107), so a slow frame slows the twirl instead of skipping a key.
 */
export function twirlStepMs(dtSeconds: number): number {
  return Math.min(Math.max(0, dtSeconds) * 1000, 1000 / 30);
}

/**
 * When each key shows (ms from the change), inside today's 0.8 s beat; the new outfit at the returned
 * `end`. Equal steps, or each key's share of `weights` (one per key) when given.
 */
export function twirlTimes(n: number, beatMs = 800, weights?: readonly number[]): { at: number[]; end: number } {
  const span = beatMs * 0.8;
  const w = weights && weights.length === n ? weights.map((x) => (x > 0 ? x : 1)) : Array.from({ length: n }, () => 1);
  const total = w.reduce((s, x) => s + x, 0);
  let acc = 0;
  const at = w.map((x) => {
    const t = Math.round((span * acc) / (total || 1));
    acc += x;
    return t;
  });
  return { at, end: Math.round(span) };
}

const STYLE_ID = 'mix-twirl-style';
const STYLE = '.mix-twirl .ffx2sf__column{opacity:0 !important}';

type Guts = Object3D & {
  slots: { mesh: Object3D; pose: string }[];
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
  private play: { a: Guts; keys: PaintedTexture[]; at: number[]; end: number; t: number } | null = null;
  on = false;
  readonly stats = { changes: 0, played: 0, keysFound: 0, lastPlan: [] as string[] };

  /** Wrap a party figure (once): its `loadPoses` (the change) and `flash` (the white flash it replaces). */
  watch(o: Object3D): void {
    const a = o as Guts;
    if (this.wrapped.has(a) || typeof a.loadPoses !== 'function') return;
    this.wrapped.add(a);
    const load = a.loadPoses;
    const flash = a.flash;
    const self = this;
    a.loadPoses = function (poses: Record<string, string>, initial?: string): Promise<void> {
      const from = subjectOf(a.poseUrls['idle']);
      const to = subjectOf(poses['idle']);
      const done = load.call(a, poses, initial);
      if (self.on && from && to && from !== to) void self.start(a, from, to, done);
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
    const figs = [...new Set([to, ...plan.map((k) => k.figure)])];
    const [loaded, idles] = await Promise.all([
      Promise.all(plan.map((k) => loadPainted(artUrl(`art/characters/${k.figure}/${k.key}.png`), () => softSilhouette('twirl')))),
      Promise.all(figs.map((f) => this.idleMeta(f))),
    ]);
    const idleOf = (f: string): PoseMeta | null => idles[figs.indexOf(f)] ?? null;
    const keys: PaintedTexture[] = [];
    const parts: string[] = [];
    loaded.forEach((k, i) => {
      if (k.placeholder) return void k.texture.dispose();
      const own = plan[i]!;
      const r = own.figure === to ? 1 : keyRescale(idleOf(own.figure), idleOf(to));
      keys.push(r === 1 ? k : { ...k, meta: { ...k.meta, scale: (k.meta.scale ?? 1) * r } });
      parts.push(own.key);
    });
    if (!keys.length) return;
    await done;
    const { at, end } = twirlTimes(keys.length, undefined, parts.map((p) => TWIRL_WEIGHT[p] ?? 2));
    this.stats.lastPlan = plan.map((k) => `${k.figure}/${k.key}`);
    this.play = { a, keys, at, end, t: 0 };
    this.stats.played++;
    if (!document.getElementById(STYLE_ID)) {
      const st = document.createElement('style');
      st.id = STYLE_ID;
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    document.documentElement.classList.add('mix-twirl');
  }

  /** Every frame (FFX-2): the key on screen for the change in play. */
  update(dt: number): void {
    const p = this.play;
    if (!p) return;
    p.t += twirlStepMs(dt);
    const a = p.a;
    const slot = a.slots[a.active];
    if (p.t >= p.end || !slot) return this.finish();
    let i = 0;
    while (i + 1 < p.at.length && p.t >= p.at[i + 1]!) i++;
    a.applyPose(a.active, slot.pose, p.keys[i]!);
  }

  private finish(): void {
    const p = this.play;
    this.play = null;
    document.documentElement.classList.remove('mix-twirl');
    if (!p) return;
    const slot = p.a.slots[p.a.active];
    const tex = slot ? (p.a.poses.get(slot.pose) ?? p.a.poses.get('idle')) : undefined;
    if (slot && tex) p.a.applyPose(p.a.active, slot.pose, tex);
    for (const k of p.keys) k.texture.dispose();
  }

  dispose(): void {
    this.finish();
    this.on = false; // the wrappers stay on the figures, inert
  }
}
