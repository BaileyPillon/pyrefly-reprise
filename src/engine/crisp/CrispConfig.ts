/**
 * The standard battle view's sharpness, as data (release 39; Bailey picked "F plus" on 2026-10-04: "I'll go with all of your
 * recommendations"). Both games, shared plumbing; no game content. Pure: no DOM beyond the address, no three.
 *
 * The recipe is one scene pass drawn `ss` times wider and taller and resolved down with a Lanczos-3 filter BEFORE the bloom
 * (`SsaaPass.ts`), both SMAA passes off (the supersample is the anti-aliasing), and a light contrast-adaptive sharpen right
 * before the grade (`CasPass.ts`). It comes in three rungs, one ladder:
 *
 *   fplus  2x, sharpen 0.3: the high device class, the target.
 *   f      1.5x, sharpen 0.4: the mid class, and what a high-class device steps down to when it cannot hold the frame rate.
 *   a2     no supersample, no sharpen, ONE SMAA pass (the MAX mix's, before the grade, exactly as live release 38 draws it): the
 *          low class, and the floor of the ladder.
 *   phone  today's frame, never supersampled: the phone layout and the phone effects tier. It already runs exactly one AA pass
 *          (the MAX mix's FXAA); release 39's second SMAA, after the grade, is off on the phone class.
 *
 * Release 39's own SMAA after the grade (`Renderer.smaaPass`) is retired from every rung: it ran on top of the MAX mix's, so a
 * frame was softened twice (the crispness options round, `docs/handoff/crisp-options.md`, finding 1). `?aa=smaa|msaa` still switches it
 * on for a capture.
 *
 * Developer overrides (captures, QA, the unit tests): `?crisp=<name>` plays one named end state and PINS it (the frame-time
 * governor stands down, as `?artscale=` does for the art), and the single flags `ss`, `cas` and `aapre` change one lever of it.
 */
import type { AaMode, DeviceClass } from '../ArtBudget.ts';

/** The effects tier (`EyeCandy.FxTier`), repeated here so this file stays pure. */
export type CrispTier = 'full' | 'phone' | 'low';

/** One end state of the frame: every lever the rig switches. */
export interface CrispConfig {
  /** 1 = the scene is drawn at the drawing buffer's size; above 1, that many times wider and taller, resolved down before the bloom. */
  ss: number;
  /** How much of the resolve's anti-ringing clamp is applied, 0..1 (the dark ink lines would otherwise halo). */
  ssRing: number;
  /** The sharpening amount, 0..1 (0 = the pass is off). */
  cas: number;
  /** The filter's own shape, 0..1 (CAS's -1/8 soft to -1/5 hard lobe). */
  casSharp: number;
  /** Local contrast below which nothing is sharpened (the painted grain and the soft far field). */
  casFloor: number;
  /** The MAX mix's SMOOTH EDGES pass before the grade (SMAA on the full tier, FXAA on the phone): off while the scene is supersampled. */
  aaPre: boolean;
  /** The renderer's own anti-aliasing after the grade; null leaves it as the address (`?aa=`) or the budget (off) say. */
  aa: AaMode | null;
}

/** The rungs the frame-time governor walks down, best first. */
export type GovernedRung = 'fplus' | 'f' | 'a2';
export type CrispRung = GovernedRung | 'phone';

export const LADDER: readonly GovernedRung[] = ['fplus', 'f', 'a2'];

const BASE: Readonly<CrispConfig> = { ss: 1, ssRing: 0.5, cas: 0, casSharp: 0.5, casFloor: 0.05, aaPre: true, aa: null };

/** The three rungs and the phone's frame. */
export const RUNGS: Readonly<Record<CrispRung, Readonly<CrispConfig>>> = {
  fplus: { ...BASE, ss: 2, cas: 0.3, aaPre: false },
  f: { ...BASE, ss: 1.5, cas: 0.4, aaPre: false },
  a2: { ...BASE },
  phone: { ...BASE },
};

/**
 * The named end states a developer can pin (`?crisp=<name>`, `__pyrefly.crisp.preset(name)`). `a` is release 39 as built (two SMAA
 * passes), `ref3` the 3x reference every sharpness number is measured against; `g1` and `g2` are the options page's names for F and F plus.
 * Every one is a whole state (`aa` explicit), so switching between them at run time leaves nothing of the last one behind.
 */
export const CRISP_PRESETS: Readonly<Record<string, Readonly<CrispConfig>>> = {
  fplus: { ...RUNGS.fplus, aa: 'off' },
  g2: { ...RUNGS.fplus, aa: 'off' },
  f: { ...RUNGS.f, aa: 'off' },
  g1: { ...RUNGS.f, aa: 'off' },
  a2: { ...RUNGS.a2, aa: 'off' },
  a: { ...BASE, aa: 'smaa' },
  phone: { ...RUNGS.phone, aa: 'off' },
  ref3: { ...BASE, ss: 3, aaPre: false, aa: 'off' },
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Merge a partial config over a base, keeping only valid values. */
export function mergeCrisp(base: CrispConfig, patch: Partial<CrispConfig>): CrispConfig {
  const out: CrispConfig = { ...base };
  const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  if (finite(patch.ss)) out.ss = clamp(patch.ss, 1, 4);
  if (finite(patch.ssRing)) out.ssRing = clamp(patch.ssRing, 0, 1);
  if (finite(patch.cas)) out.cas = clamp(patch.cas, 0, 1);
  if (finite(patch.casSharp)) out.casSharp = clamp(patch.casSharp, 0, 1);
  if (finite(patch.casFloor)) out.casFloor = clamp(patch.casFloor, 0, 0.5);
  if (typeof patch.aaPre === 'boolean') out.aaPre = patch.aaPre;
  if (patch.aa === null || patch.aa === 'off' || patch.aa === 'smaa' || patch.aa === 'msaa') out.aa = patch.aa;
  return out;
}

/** What the address pins: a whole state (and its name), or null when it says nothing about the frame. */
export interface CrispOverride {
  name: string | null;
  cfg: CrispConfig;
}

const num = (v: string | null, lo: number, hi: number): number | null => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n, lo, hi) : null;
};

/** Parse the address: `?crisp=<name>`, then the single flags `ss`, `cas` and `aapre` over it (or over a2 when no name is given). */
export function parseCrisp(search: string): CrispOverride | null {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return null;
  }
  const key = (p.get('crisp') ?? '').toLowerCase();
  const named = CRISP_PRESETS[key];
  const patch: Partial<CrispConfig> = {};
  const ss = num(p.get('ss'), 1, 4);
  if (ss !== null) patch.ss = ss;
  const cas = num(p.get('cas'), 0, 1);
  if (cas !== null) patch.cas = cas;
  const pre = p.get('aapre');
  if (pre === '0' || pre === 'off') patch.aaPre = false;
  else if (pre === '1' || pre === 'on') patch.aaPre = true;
  if (!named && Object.keys(patch).length === 0) return null;
  const start: CrispConfig = named ? { ...named } : { ...RUNGS.a2, aa: 'off' };
  return { name: named ? key : null, cfg: mergeCrisp(start, patch) };
}

/**
 * The rung a device starts on, from its class (`ArtBudget.classifyDevice`): the discrete GPU starts on F plus, an integrated or
 * unknown one on F, a software renderer on A2. The governor can only take it down from there (`FrameGovernor`).
 */
export function startRung(cls: DeviceClass): GovernedRung {
  if (cls === 'high') return 'fplus';
  if (cls === 'mid') return 'f';
  return 'a2';
}

/**
 * The rung a frame is drawn on: the phone layout and the phone effects tier keep today's frame; LOW EFFECTS and the low class
 * never supersample; everything else is where the governor stands.
 */
export function rungFor(cls: DeviceClass, tier: CrispTier, governed: GovernedRung): CrispRung {
  if (cls === 'phone' || tier === 'phone') return 'phone';
  if (cls === 'low' || tier === 'low') return 'a2';
  return governed;
}

/** The rung below this one on the ladder, or null at the floor. */
export function stepDownFrom(rung: GovernedRung): GovernedRung | null {
  const i = LADDER.indexOf(rung);
  return i >= 0 && i < LADDER.length - 1 ? LADDER[i + 1]! : null;
}
