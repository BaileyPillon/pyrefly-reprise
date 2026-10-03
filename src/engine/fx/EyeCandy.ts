/**
 * The eye-candy options round (2026-09-29, AGENTS.md rule 9: end state first): which
 * prototype option is switched on, at which tier, under which accessibility flags.
 *
 * Option D (A + B + C together) is the game's look: Bailey picked it on 2026-09-29 ("I'll go with
 * all of your recommendations please", D-287). The URL switch is for comparison and tests, never a
 * setting and never saved:
 * - no parameter (or nothing it recognises) = **D**, every option on;
 * - `?fx=off` = today's look before D (every option off), for comparison and tests;
 * - `?fx=a` (or `a,b`, `all`, `d`) switches exactly the named options on;
 * - `?fxsub=-shafts,-flare` turns single sub-effects off;
 * - `?fxtier=full|phone|low` forces a tier.
 * With no `?fx=`, the OPTIONS rows CINEMA LIGHT, LIVING PAINTINGS and BATTLE SPECTACLE (`app/fxLooks.ts`,
 * saved, default ON) switch A, B and C live through {@link EyeCandyState.applyLooks}; a URL `?fx=` wins
 * over the rows for that page load, so tests and captures stay exact.
 * `window.__pyrefly.fx` (`src/debug/fxApi.ts`) flips the same state at runtime.
 *
 * Pure: no DOM and no `three`. The caller hands in the search string, the settings and the
 * viewport, so vitest runs it in Node. Game case: both (shared plumbing); the options decide
 * per game what they draw.
 */

export type FxOption = 'a' | 'b' | 'c';
export type FxTier = 'full' | 'phone' | 'low';

export const FX_OPTIONS: readonly FxOption[] = ['a', 'b', 'c'];

/**
 * Strength dials (`?fxdial=bloom:1.4,shafts:0.5`, `__pyrefly.fx.dial(name, v)`): multipliers on
 * each effect's tuned strength, 1 = as tuned, 0 = none, clamped to 0..3. `all` scales every dial.
 * The README of each option says how far each one goes and where it starts to hurt.
 */
export const FX_DIALS = ['all', 'bloom', 'shafts', 'haze', 'streaks', 'look', 'rim', 'grain', 'vignette', 'dof', 'halo', 'flare', 'drift', 'lamps', 'weather', 'shadow', 'reflect', 'focus', 'sway', 'shake', 'sparks', 'impact', 'spells', 'hitstop', 'splash', 'heat', 'orbit'] as const;
export type FxDial = (typeof FX_DIALS)[number];

/** Parse `?fxdial=`; unknown names and non-numbers are ignored. */
export function parseFxDials(raw: string | null): Partial<Record<FxDial, number>> {
  const out: Partial<Record<FxDial, number>> = {};
  for (const part of (raw ?? '').split(',')) {
    const [k, v] = part.split(':').map((x) => x.trim());
    const n = Number(v);
    if (!k || !(FX_DIALS as readonly string[]).includes(k) || v === undefined || v === '' || !Number.isFinite(n)) continue;
    out[k as FxDial] = Math.min(3, Math.max(0, n));
  }
  return out;
}

export interface FxQuery {
  on: Record<FxOption, boolean>;
  /** Sub-effects switched off by `?fxsub=-id` (true = forced off). */
  subOff: Set<string>;
  tier: FxTier | null;
  dials: Partial<Record<FxDial, number>>;
  /** True when `?fx=` named options: the URL then wins over the OPTIONS rows for this page load. */
  named: boolean;
}

/** The default: option D, every option on (Bailey's pick, 2026-09-29). */
const defaultOn = (): Record<FxOption, boolean> => ({ a: true, b: true, c: true });

/** Parse the URL switch. Anything unknown is ignored; no parameter = option D (everything on). */
export function parseFxQuery(search: string): FxQuery {
  const on: Record<FxOption, boolean> = { a: false, b: false, c: false };
  const subOff = new Set<string>();
  let tier: FxTier | null = null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return { on: defaultOn(), subOff, tier, dials: {}, named: false };
  }
  let named = false;
  for (const raw of (params.get('fx') ?? '').toLowerCase().split(',')) {
    const v = raw.trim();
    if (v === 'all' || v === 'd') for (const o of FX_OPTIONS) on[o] = true; // option D = A + B + C together
    else if (v === 'off') for (const o of FX_OPTIONS) on[o] = false;
    else if ((FX_OPTIONS as readonly string[]).includes(v)) on[v as FxOption] = true;
    else continue;
    named = true;
  }
  if (!named) Object.assign(on, defaultOn());
  for (const raw of (params.get('fxsub') ?? '').split(',')) {
    const v = raw.trim();
    if (v.startsWith('-') && v.length > 1) subOff.add(v.slice(1));
  }
  const t = params.get('fxtier');
  if (t === 'full' || t === 'phone' || t === 'low') tier = t;
  return { on, subOff, tier, dials: parseFxDials(params.get('fxdial')), named };
}

export interface FxEnv {
  lowEffects: boolean;
  reduceMotion: boolean;
  /** REDUCE FLASHES; the setting may not exist yet (r31-access), so callers read it defensively. */
  reduceFlashes: boolean;
  width: number;
  height: number;
}

/**
 * The tier: `low` under Low effects, `phone` when the short side is under 600 CSS px (the
 * rule `resolveFxQuality` uses), else `full`. A forced tier wins, except that Low effects
 * can only make it lighter.
 */
export function resolveFxTier(env: Pick<FxEnv, 'lowEffects' | 'width' | 'height'>, forced: FxTier | null = null): FxTier {
  if (env.lowEffects) return 'low';
  if (forced) return forced;
  return Math.min(env.width, env.height) < 600 ? 'phone' : 'full';
}

/** A ring of frame intervals (ms), for `__pyrefly.fx.stats()`. */
export class FrameProbe {
  private readonly ring: Float64Array;
  private n = 0;
  private i = 0;

  constructor(size = 600) {
    this.ring = new Float64Array(size);
  }

  push(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    this.ring[this.i] = ms;
    this.i = (this.i + 1) % this.ring.length;
    this.n = Math.min(this.n + 1, this.ring.length);
  }

  reset(): void {
    this.n = 0;
    this.i = 0;
  }

  get count(): number {
    return this.n;
  }

  /** The p-th percentile (0..100) of the stored intervals, nearest rank. 0 when empty. */
  percentile(p: number): number {
    if (!this.n) return 0;
    const v = Array.from(this.ring.subarray(0, this.n)).sort((a, b) => a - b);
    const k = Math.min(v.length - 1, Math.max(0, Math.ceil((p / 100) * v.length) - 1));
    return v[k]!;
  }

  stats(): { frames: number; p50: number; p95: number; p99: number; mean: number } {
    const r = (x: number): number => Math.round(x * 100) / 100;
    let sum = 0;
    for (let k = 0; k < this.n; k++) sum += this.ring[k]!;
    return { frames: this.n, p50: r(this.percentile(50)), p95: r(this.percentile(95)), p99: r(this.percentile(99)), mean: r(this.n ? sum / this.n : 0) };
  }
}

/**
 * Option D's balance (A + B + C together, `?fx=d`): where two options light the same thing, each
 * alone was tuned to carry the frame, so together they would stack. B's lamp halos are bloomed
 * again by A, A's haze sits on B's weather veils, and A's big-spell flare lands on C's payoff.
 * These factors apply only while both options of a pair are on (and, with a `tier`, only on that
 * tier); each option alone is unchanged. Tuned on the four chapters' captures for the options page
 * (2026-09-29, `docs/concepts/eye-candy-2026-09-29/d/README.md`), then again on the judge's must-fix
 * list once Bailey picked D (`d-final/README.md`).
 */
export const FX_OVERLAP: readonly { when: readonly FxOption[]; tier?: FxTier; dials: Partial<Record<FxDial, number>> }[] = [
  // The painting reads first and the air second (must-fix 3); B's halos are not bloomed a second time (7).
  { when: ['a', 'b'], dials: { bloom: 0.6, lamps: 0.3, haze: 0.3, shafts: 0.8 } },
  // The big moments keep their target readable (must-fix 1): less flare and halo on C's payoffs.
  { when: ['a', 'c'], dials: { flare: 0.55, halo: 0.7 } },
  // The phone tier: spells as lines and layers, not a clipped white-orange disc (must-fix 5). A's spell
  // halo is what clips them (probed sub by sub on Chapter I's phone fire, d-final/fixes/), so it drops most.
  { when: ['a', 'c'], tier: 'phone', dials: { spells: 0.6, halo: 0.2, bloom: 0.85 } },
];

/** The product of the overlap factors that apply to a dial under the given switches and tier. */
export function overlapBalance(on: Record<FxOption, boolean>, name: FxDial, tier: FxTier = 'full'): number {
  let k = 1;
  for (const o of FX_OVERLAP) if (o.when.every((w) => on[w]) && (!o.tier || o.tier === tier)) k *= o.dials[name] ?? 1;
  return k;
}

/** The live switch state: one per page (`eyeCandy`). */
export class EyeCandyState {
  readonly on: Record<FxOption, boolean>;
  readonly subOff: Set<string>;
  forcedTier: FxTier | null;
  readonly dials: Partial<Record<FxDial, number>>;
  /** The URL named options (`?fx=`), so the OPTIONS rows do not switch them this page load. */
  readonly urlNamed: boolean;
  /** Presentation clocks stopped (captures: the same frame ON and OFF). */
  frozen = false;
  readonly probe = new FrameProbe();
  /** Read every frame, so an OPTIONS change applies at once. */
  env: () => FxEnv = () => ({ lowEffects: false, reduceMotion: false, reduceFlashes: false, width: 1600, height: 900 });
  private readonly listeners = new Set<() => void>();

  constructor(q: FxQuery) {
    this.on = { ...q.on };
    this.subOff = new Set(q.subOff);
    this.forcedTier = q.tier;
    this.dials = { ...q.dials };
    this.urlNamed = q.named;
  }

  /**
   * The OPTIONS rows (`app/fxLooks.ts`): each look on or off, live, from the saved settings. A no-op
   * when the URL named options for this page load (`?fx=off` stays off for tests and comparisons).
   */
  applyLooks(looks: Readonly<Record<FxOption, boolean>>): void {
    if (this.urlNamed) return;
    for (const o of FX_OPTIONS) this.set(o, looks[o] !== false);
  }

  /** A dial's multiplier (its own value times `all`). */
  dial(name: FxDial): number {
    const own = this.dials[name] ?? 1;
    return name === 'all' ? own : own * (this.dials.all ?? 1) * overlapBalance(this.on, name, this.tier);
  }

  setDial(name: FxDial, v: number): void {
    if (!(FX_DIALS as readonly string[]).includes(name) || !Number.isFinite(v)) return;
    this.dials[name] = Math.min(3, Math.max(0, v));
    this.changed();
  }

  /** True when any option is on. */
  get anyOn(): boolean {
    return FX_OPTIONS.some((o) => this.on[o]);
  }

  enabled(opt: FxOption): boolean {
    return this.on[opt];
  }

  /** A sub-effect of an option: on while its option is on and nobody switched it off. */
  sub(opt: FxOption, id: string): boolean {
    return this.on[opt] && !this.subOff.has(id);
  }

  get tier(): FxTier {
    return resolveFxTier(this.env(), this.forcedTier);
  }

  get reduceMotion(): boolean {
    return this.env().reduceMotion;
  }

  get reduceFlashes(): boolean {
    return this.env().reduceFlashes;
  }

  set(opt: FxOption, on: boolean): void {
    if (this.on[opt] === on) return;
    this.on[opt] = on;
    this.changed();
  }

  setSub(id: string, on: boolean): void {
    if (on) this.subOff.delete(id);
    else this.subOff.add(id);
    this.changed();
  }

  setTier(t: FxTier | null): void {
    this.forcedTier = t;
    this.changed();
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    for (const fn of this.listeners) fn();
  }

  snapshot(): Record<string, unknown> {
    const e = this.env();
    return {
      on: { ...this.on },
      subOff: [...this.subOff],
      tier: this.tier,
      forcedTier: this.forcedTier,
      dials: { ...this.dials },
      reduceMotion: e.reduceMotion,
      reduceFlashes: e.reduceFlashes,
      lowEffects: e.lowEffects,
      frozen: this.frozen,
    };
  }
}

/** The page's switch state, read once from the URL at boot. */
export const eyeCandy = new EyeCandyState(parseFxQuery(typeof location === 'undefined' ? '' : location.search));
