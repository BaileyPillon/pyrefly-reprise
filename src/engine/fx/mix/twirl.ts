import type { Object3D } from 'three';
import { artManifest } from '../../ArtManifest.ts';
import { artUrl, loadPainted, softSilhouette, type PaintedTexture } from '../../PaintedArt.ts';

/**
 * The MAX mix (D-316), the FFX-2 spherechange's painted TWIRL KEYS slot (B's no-render part; FFX-2 only,
 * FFX has no spherechange: research/ffx-vs-ffx2-presentation.md section 6). The painted keys (a twirl
 * start, a mid-twirl with ribbons and light, the manifest end) are rendered tonight as CANDIDATES for
 * Bailey's pick; none is installed. This is the slot that plays them once they are:
 *
 * - a key is a chosen painting `public/art/characters/<figure>/twirl-<name>.png` (with its sidecar), so
 *   the art manifest lists it as a state of that figure: the new dressphere's figure first (e.g.
 *   `yuna-gunner`), then the one she leaves. No file is ever requested that the manifest does not list;
 * - when a girl has keys, her change plays them in order (start, mid, end, then any others by name)
 *   inside today's beat (Active ATB: never added to it, 0.8 s, `SpherechangeFlourish.FLOURISH_MS`), the
 *   white flash on the figure, the screen wash and the flourish's white column give way to them (the
 *   motes, the ring and the name plate stay), and the new outfit lands after the last key;
 * - with no keys (today, everywhere) nothing changes: today's flourish plays exactly as it does.
 *
 * Part of DRESSPHERE SHOT (BATTLE SPECTACLE), so the switch that holds the close shot also holds the
 * keys. REDUCE MOTION: no keys (today's flourish, which is already a cut under it). Presentation only.
 */

/** The twirl keys a figure ships, in playing order (from the art manifest's states). Pure on its input. */
export function twirlKeysOf(states: readonly string[]): string[] {
  const rank = (s: string): number => (/-start$/.test(s) ? 0 : /-mid$/.test(s) ? 1 : /-end$/.test(s) ? 2 : 3);
  return states.filter((s) => /^twirl-[a-z0-9-]+$/i.test(s)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'en', { numeric: true }));
}

/** The girl a figure belongs to (`yuna-gunner` -> `yuna`). */
export const girlOf = (figure: string): string => figure.split('-')[0] ?? '';

/**
 * The figure whose keys a change plays, and the keys: the new dressphere's figure, else the one she
 * leaves, else any figure of the same girl that ships keys (`others`: every subject id the manifest knows).
 */
export function twirlSource(from: string, to: string, statesOf: (id: string) => readonly string[] | null, others: readonly string[] = []): { figure: string; keys: string[] } | null {
  const girl = girlOf(to || from);
  const mine = others.filter((id) => girl && id.startsWith(`${girl}-`)).sort();
  for (const fig of [to, from, ...mine]) {
    if (!fig) continue;
    const keys = twirlKeysOf(statesOf(fig) ?? []);
    if (keys.length) return { figure: fig, keys };
  }
  return null;
}

/** When each key shows (ms from the change), inside today's 0.8 s beat; the new outfit at the returned `end`. */
export function twirlTimes(n: number, beatMs = 800): { at: number[]; end: number } {
  const span = beatMs * 0.8;
  const step = n > 0 ? span / n : 0;
  return { at: Array.from({ length: n }, (_, i) => Math.round(i * step)), end: Math.round(span) };
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
  private play: { a: Guts; keys: PaintedTexture[]; at: number[]; end: number; t: number } | null = null;
  on = false;
  readonly stats = { changes: 0, played: 0, keysFound: 0 };

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
    return !!m && !!from && twirlSource(from, '', (id) => m.subjects[id]?.states ?? null, Object.keys(m.subjects)) !== null;
  }

  private async start(a: Guts, from: string, to: string, done: Promise<void>): Promise<void> {
    this.stats.changes++;
    const m = artManifest();
    const src = m ? twirlSource(from, to, (id) => m.subjects[id]?.states ?? null, Object.keys(m.subjects)) : null;
    if (!src) return; // today's flourish
    this.stats.keysFound++;
    const keys = (await Promise.all(src.keys.map((k) => loadPainted(artUrl(`art/characters/${src.figure}/${k}.png`), () => softSilhouette('twirl'))))).filter((k) => !k.placeholder);
    if (!keys.length) return;
    await done;
    const { at, end } = twirlTimes(keys.length);
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
    p.t += dt * 1000;
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
