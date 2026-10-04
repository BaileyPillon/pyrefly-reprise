/**
 * The crispness options round (scratch branch `crisp-options`, never merged; Bailey 2026-10-04: "I need super high resolution now.
 * DO NOT hold back."). One config object holds every lever of the round, so a capture can switch them at run time
 * (`window.__pyrefly.crisp`) and a page load can pick one by address (`?crisp=f1`, or the single flags below).
 * Both games, shared plumbing; no game content.
 *
 * Levers (each default leaves the frame exactly as release 39 draws it, which is option A):
 * - `aaPre`   : the pre-grade SMAA of the MAX mix's SMOOTH EDGES (`fx/mix/cinema.ts`); live release 38 has only this one.
 * - `aa`      : the renderer's own anti-aliasing (`off` | `smaa` after the grade | `msaa` scene target), `?aa=` as before.
 * - `ss`      : supersampling of the scene pass (1 = off), resolved with `ssFilter` before the bloom (`SsaaPass.ts`).
 * - `cas`     : contrast adaptive sharpening amount 0..1 (`CasPass.ts`), `casSharp` its shape 0..1 (the -1/8 to -1/5 lobe), `casAt` before
 *               the grade (`pre`) or after (`post`), `casFloor` the local contrast below which nothing is sharpened (the painted grain,
 *               the soft far field).
 * - `mips`    : `gpu` (the box-filtered chain the driver makes) or `lanczos` (prefiltered levels, `MipPrefilter.ts`).
 * - `aniso`   : an anisotropy floor for painted textures (0 = leave them as they are).
 * - `mipBias` : a negative bias of the figures' texture sampling (0 = none).
 *
 * Pure: no DOM beyond reading the address, no three.
 */

export type CrispFilter = 'box' | 'lanczos' | 'lanczos2' | 'catmull' | 'mitchell';
export type CrispAa = 'off' | 'smaa' | 'msaa';

export interface CrispConfig {
  aaPre: boolean;
  /** `null`: leave the renderer's own choice (`ArtBudget.aa`, `?aa=`). */
  aa: CrispAa | null;
  ss: number;
  ssFilter: CrispFilter;
  /** 0..1 of how much of the anti-ringing clamp the resolve applies. */
  ssRing: number;
  cas: number;
  casSharp: number;
  casAt: 'pre' | 'post';
  casFloor: number;
  mips: 'gpu' | 'lanczos';
  aniso: number;
  mipBias: number;
}

export const DEFAULT_CRISP: Readonly<CrispConfig> = {
  aaPre: true,
  aa: null,
  ss: 1,
  ssFilter: 'lanczos',
  ssRing: 0.5,
  cas: 0,
  casSharp: 0.5,
  casAt: 'pre',
  casFloor: 0.05,
  mips: 'gpu',
  aniso: 0,
  mipBias: 0,
};

/**
 * The named end states of the options round. `a` is release 39 as built (two SMAA passes in the chain); everything else is a
 * change against it. The page shows each of these by name.
 */
export const CRISP_PRESETS: Readonly<Record<string, Partial<CrispConfig>>> = {
  a: { aaPre: true, aa: 'smaa' },
  a2: { aaPre: true, aa: 'off' },
  b: { aaPre: false, aa: 'msaa' },
  c1: { aaPre: true, aa: 'off', cas: 0.5 },
  c2: { aaPre: true, aa: 'off', cas: 1, casSharp: 1 },
  c2post: { aaPre: true, aa: 'off', cas: 1, casSharp: 1, casAt: 'post' },
  // the same two without the noise floor, to show what the floor protects (the painted grain and the soft far field)
  c2nf: { aaPre: true, aa: 'off', cas: 1, casSharp: 1, casFloor: 0 },
  c2postnf: { aaPre: true, aa: 'off', cas: 1, casSharp: 1, casAt: 'post', casFloor: 0 },
  d15: { aaPre: false, aa: 'off', ss: 1.5 },
  d2: { aaPre: false, aa: 'off', ss: 2 },
  // the resolve filter's own comparison (supersampling 2x, one filter at a time), and the 3x reference every variant is measured against
  d2box: { aaPre: false, aa: 'off', ss: 2, ssFilter: 'box' },
  d2cat: { aaPre: false, aa: 'off', ss: 2, ssFilter: 'catmull' },
  d2mit: { aaPre: false, aa: 'off', ss: 2, ssFilter: 'mitchell' },
  d2l2: { aaPre: false, aa: 'off', ss: 2, ssFilter: 'lanczos2' },
  ref3: { aaPre: false, aa: 'off', ss: 3, ssFilter: 'lanczos', ssRing: 0.5 },
  e: { aaPre: true, aa: 'off', mips: 'lanczos', aniso: 16 },
  ebias: { aaPre: true, aa: 'off', mips: 'lanczos', aniso: 16, mipBias: -0.5 },
  // F: supersample, the sharpening amount that lands nearest the 3x reference (0.4 at 1.5x, 0.3 at 2x), the plates' anisotropy;
  // f1 adds E's prefiltered mips to F (to show what they are worth)
  g0: { aaPre: false, aa: 'off', ss: 1.5, aniso: 16 },
  g1: { aaPre: false, aa: 'off', ss: 1.5, cas: 0.4, aniso: 16 },
  g2: { aaPre: false, aa: 'off', ss: 2, cas: 0.3, aniso: 16 },
  f1: { aaPre: false, aa: 'off', ss: 1.5, cas: 0.4, mips: 'lanczos', aniso: 16 },
};

const FILTERS: readonly CrispFilter[] = ['box', 'lanczos', 'lanczos2', 'catmull', 'mitchell'];

const num = (v: string | null, lo: number, hi: number): number | null => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null;
};

/** Merge a partial config over a base, keeping only valid values. */
export function mergeCrisp(base: CrispConfig, patch: Partial<CrispConfig>): CrispConfig {
  const out: CrispConfig = { ...base };
  if (typeof patch.aaPre === 'boolean') out.aaPre = patch.aaPre;
  if (patch.aa === null || patch.aa === 'off' || patch.aa === 'smaa' || patch.aa === 'msaa') out.aa = patch.aa;
  if (typeof patch.ss === 'number' && Number.isFinite(patch.ss)) out.ss = Math.min(4, Math.max(1, patch.ss));
  if (patch.ssFilter && FILTERS.includes(patch.ssFilter)) out.ssFilter = patch.ssFilter;
  if (typeof patch.ssRing === 'number' && Number.isFinite(patch.ssRing)) out.ssRing = Math.min(1, Math.max(0, patch.ssRing));
  if (typeof patch.cas === 'number' && Number.isFinite(patch.cas)) out.cas = Math.min(1, Math.max(0, patch.cas));
  if (typeof patch.casSharp === 'number' && Number.isFinite(patch.casSharp)) out.casSharp = Math.min(1, Math.max(0, patch.casSharp));
  if (patch.casAt === 'pre' || patch.casAt === 'post') out.casAt = patch.casAt;
  if (typeof patch.casFloor === 'number' && Number.isFinite(patch.casFloor)) out.casFloor = Math.min(0.5, Math.max(0, patch.casFloor));
  if (patch.mips === 'gpu' || patch.mips === 'lanczos') out.mips = patch.mips;
  if (typeof patch.aniso === 'number' && Number.isFinite(patch.aniso)) out.aniso = Math.min(16, Math.max(0, Math.round(patch.aniso)));
  if (typeof patch.mipBias === 'number' && Number.isFinite(patch.mipBias)) out.mipBias = Math.min(0, Math.max(-2, patch.mipBias));
  return out;
}

/** Parse the address: `?crisp=<preset>` first, then single flags (`ss`, `ssf`, `ssring`, `cas`, `cassharp`, `casat`, `casfloor`, `aapre`, `mips`, `aniso`, `mipbias`). */
export function parseCrisp(search: string): CrispConfig {
  let cfg: CrispConfig = { ...DEFAULT_CRISP };
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return cfg;
  }
  const named = CRISP_PRESETS[(p.get('crisp') ?? '').toLowerCase()];
  if (named) cfg = mergeCrisp(cfg, named);
  const patch: Partial<CrispConfig> = {};
  const ss = num(p.get('ss'), 1, 4);
  if (ss !== null) patch.ss = ss;
  const f = (p.get('ssf') ?? '').toLowerCase() as CrispFilter;
  if (FILTERS.includes(f)) patch.ssFilter = f;
  const ring = num(p.get('ssring'), 0, 1);
  if (ring !== null) patch.ssRing = ring;
  const cas = num(p.get('cas'), 0, 1);
  if (cas !== null) patch.cas = cas;
  const shape = num(p.get('cassharp'), 0, 1);
  if (shape !== null) patch.casSharp = shape;
  const floor = num(p.get('casfloor'), 0, 0.5);
  if (floor !== null) patch.casFloor = floor;
  const at = p.get('casat');
  if (at === 'pre' || at === 'post') patch.casAt = at;
  const pre = p.get('aapre');
  if (pre === '0' || pre === 'off') patch.aaPre = false;
  else if (pre === '1' || pre === 'on') patch.aaPre = true;
  const mips = p.get('mips');
  if (mips === 'gpu' || mips === 'lanczos') patch.mips = mips;
  const an = num(p.get('aniso'), 0, 16);
  if (an !== null) patch.aniso = an;
  const mb = num(p.get('mipbias'), -2, 0);
  if (mb !== null) patch.mipBias = mb;
  return mergeCrisp(cfg, patch);
}
