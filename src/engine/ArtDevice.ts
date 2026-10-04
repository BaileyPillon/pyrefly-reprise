/**
 * The device the art is drawn on: read once, answered everywhere (release 39; both games, shared plumbing).
 *
 * `ArtBudget.ts` is the pure half (a class from a sample, the numbers a class gets). This is the half that looks at the
 * page: the phone layout, the GPU the renderer reports, the memory the browser admits to, and the width of the drawing
 * buffer, which `Renderer` keeps current. Nothing here is a setting and nothing is saved: the budget follows the device.
 *
 * Captures, QA and the unit tests can force a class: `?arttier=phone|low|mid|high` on the address, `setArtTier(...)` from code
 * (`__pyrefly.artTier`), and the answer is the same everywhere in the engine.
 */
import { budgetFor, classifyDevice, parseTierOverride, type ArtBudget, type DeviceClass } from './ArtBudget.ts';

/** What the phone tier is decided from. */
export interface TierEnv {
  /** True on the phone tier: the phone battle layout (an upright window under 600 px), or a coarse pointer on a screen whose short side is under 600 px (a phone held sideways). */
  phone: boolean;
  /** Viewport width, CSS px. */
  width: number;
  /** Device pixel ratio. */
  dpr: number;
}

/** The phone battle layout's own query (`ui/common/phoneBattle.ts` PHONE_BATTLE_QUERY). */
const PHONE_QUERY = '(max-width: 599px) and (orientation: portrait)';

interface TierGlobals {
  innerWidth?: number;
  devicePixelRatio?: number;
  screen?: { width: number; height: number };
  matchMedia?: (q: string) => { matches: boolean };
}

/** Read the tier's inputs from a window-like object; anything missing reads as a 1x desktop. */
export function readTierEnv(g: TierGlobals = globalThis as TierGlobals): TierEnv {
  const mm = (q: string): boolean => {
    try {
      return typeof g.matchMedia === 'function' && g.matchMedia(q).matches === true;
    } catch {
      return false;
    }
  };
  const short = g.screen ? Math.min(g.screen.width, g.screen.height) : Infinity;
  const phone = mm(PHONE_QUERY) || (mm('(pointer: coarse)') && short < 600);
  return { phone, width: typeof g.innerWidth === 'number' ? g.innerWidth : 0, dpr: typeof g.devicePixelRatio === 'number' ? g.devicePixelRatio : 1 };
}

let gpu: string | null = null;
let buffer = 0;
let forced: DeviceClass | null | undefined;
let cached: ArtBudget | null = null;
let pinnedScale: number | null | undefined;
let maxTexture = 16384;

function fromAddress(): DeviceClass | null {
  try {
    return parseTierOverride(new URLSearchParams(globalThis.location?.search ?? '').get('arttier'));
  } catch {
    return null;
  }
}

/**
 * Measurements only: pin every painting to one master (`?artscale=1..4` on the address, `setForcedArtScale` from code,
 * `__pyrefly.art.force`). The governor stands down while a scale is pinned, so a capture holds what it asked for.
 */
export function forcedArtScale(): number | null {
  if (pinnedScale !== undefined) return pinnedScale;
  try {
    const n = Number(new URLSearchParams(globalThis.location?.search ?? '').get('artscale'));
    return Number.isInteger(n) && n >= 1 && n <= 4 ? n : null;
  } catch {
    return null;
  }
}

export function setForcedArtScale(n: number | null | undefined): void {
  pinnedScale = n;
}

let linkOverride: boolean | null | undefined;

/** Force the connection reading (tests, captures, `__pyrefly.art`); `null` goes back to the address and then the browser. */
export function setSlowLink(v: boolean | null | undefined): void {
  linkOverride = v;
}

/**
 * True on a connection too slow to fetch the 2x masters ahead of the first menu (about 120 MB more than the approved set for a
 * chapter at 1440p): the data-saver switch on, a 3G-or-slower effective type, or a measured downlink under 10 Mbit/s (Chromium caps the reading at 10, so a fast link reads 10). Only Chromium
 * reports `navigator.connection`; Safari and Firefox read as fast. `?artlink=slow|fast` forces it for captures. A slow link starts every
 * painting at the approved file, as before release 39; the governor still upgrades whatever a close shot needs, in the background.
 */
export function slowLink(): boolean {
  if (linkOverride !== undefined && linkOverride !== null) return linkOverride;
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '').get('artlink');
    if (q === 'slow') return true;
    if (q === 'fast') return false;
  } catch {
    /* no address: read the connection */
  }
  const c = (globalThis as { navigator?: { connection?: { saveData?: boolean; effectiveType?: string; downlink?: number } } }).navigator?.connection;
  if (!c) return false;
  return c.saveData === true || /^(slow-2g|2g|3g)$/.test(c.effectiveType ?? '') || (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 10);
}

/** `Renderer` hands over the GPU string (UNMASKED_RENDERER_WEBGL) once its context exists. */
export function setGpuInfo(renderer: string | null): void {
  gpu = renderer;
  cached = null;
}

/** `Renderer` hands over the GPU's largest texture edge; a master is never asked for that would not fit it (`ArtGovernor`). */
export function setMaxTextureSize(px: number): void {
  if (px > 0) maxTexture = px;
}

export function maxTextureSize(): number {
  return maxTexture;
}

/** `Renderer` keeps the drawing buffer's width (CSS px x pixel ratio) current. */
export function setBufferWidth(px: number): void {
  buffer = Math.max(0, Math.round(px));
}

/** The drawing buffer's width in device pixels: the renderer's, else the window's at the renderer's pixel-ratio ceiling. */
export function bufferWidth(): number {
  if (buffer > 0) return buffer;
  const g = globalThis as { innerWidth?: number; devicePixelRatio?: number };
  return Math.round((g.innerWidth ?? 0) * Math.min(g.devicePixelRatio ?? 1, 2));
}

/** Force a class (tests, captures, `__pyrefly.artTier`); `null` goes back to the address and then the device. */
export function setArtTier(cls: DeviceClass | null | undefined): void {
  forced = cls;
  cached = null;
}

/** This device's class. */
export function deviceClass(): DeviceClass {
  if (forced) return forced;
  const address = fromAddress();
  if (address) return address;
  const env = readTierEnv();
  const nav = (globalThis as { navigator?: { deviceMemory?: number } }).navigator;
  return classifyDevice({ phone: env.phone, bufferWidth: bufferWidth(), gpu, memoryGB: typeof nav?.deviceMemory === 'number' ? nav.deviceMemory : null });
}

/** This device's budget (decided on first use, again when the GPU string arrives or a class is forced). */
export function artBudget(): ArtBudget {
  if (!cached) cached = budgetFor(deviceClass());
  return cached;
}
