/**
 * What this device can hold, and which resolution of a painting a given on-screen size needs (release 39, "r39-hires-engine";
 * Bailey 2026-10-04 ~00:35, "I need super high resolution now. DO NOT hold back."; both games, shared plumbing, no game content).
 *
 * Pure: no DOM, no three.js, no clock. The engine reads the device once (`ArtDevice.ts`), hands the sample to
 * {@link classifyDevice}, and every question below is arithmetic on numbers.
 *
 * **One measure drives everything**: *magnification*, the screen pixels one texel of the file actually drawn covers
 * (1.0 = one texel per pixel; 2.7 = each texel is smeared over 2.7 x 2.7 pixels). A painting asks for a master of
 * `ceil(pixels per 1x texel)` times its approved size, so that no texel is magnified more than {@link TARGET_MAG}.
 * The camera, the shot and the window size all reach the engine as that one number (`ArtGovernor.ts`).
 *
 * **Device tiers are automatic and are not a setting** (no save key, so this is not the save-data class): the phone layout,
 * a software renderer, an integrated or unknown GPU and a discrete GPU each get a budget. Nothing here ever raises a
 * budget above what the file set can supply: a missing master falls back to the next lower tier (`pickScale`).
 */

/** The class of a device, from what the browser tells us. */
export type DeviceClass = 'phone' | 'low' | 'mid' | 'high';

/** How the post chain anti-aliases (`PostAa.ts`): nothing, an SMAA pass after the grade, or a multisampled scene pass. */
export type AaMode = 'off' | 'smaa' | 'msaa';

/** What {@link classifyDevice} reads. Anything unknown is `null` and reads as a middling desktop. */
export interface DeviceSample {
  /** The phone battle layout (`ArtTier.readTierEnv`). */
  phone: boolean;
  /** The drawing buffer's width in device pixels (CSS width x the renderer's pixel ratio). */
  bufferWidth: number;
  /** `WEBGL_debug_renderer_info` UNMASKED_RENDERER_WEBGL, or null. */
  gpu: string | null;
  /** `navigator.deviceMemory` (GB, capped at 8 by Chrome), or null. */
  memoryGB: number | null;
}

/** One device's budgets. Every number is a ceiling the engine stays under; none is a promise a file exists. */
export interface ArtBudget {
  cls: DeviceClass;
  /** The highest whole-number master of a figure this device will hold (1 = approved size only). */
  maxScale: number;
  /** The highest master of a backdrop painting (and so of its depth plates): 1 or 2. */
  backdropScale: number;
  /** Texture memory the painted figures may hold at once, megabytes with mip chains; above it the governor evicts. */
  textureMB: number;
  /** Ground canvas edge, pixels (Chapter I's snowfield; `Backdrop.ts`). */
  groundPx: number;
  /** Deck tile edge, pixels (Chapter IV's machina deck; `bevelle-underground.ts`). */
  deckPx: number;
  /** The anti-aliasing the device runs by default: SMAA on a desktop (measured against MSAA, `PostAa.ts`); `?aa=` and `Renderer.setAa` override it for captures. */
  aa: AaMode;
  /** Samples of the multisampled scene target when `aa` is `msaa` (the hardware may clamp it). */
  msaaSamples: number;
}

/** What a texel may be magnified to before a bigger master is asked for. Bailey's brief: at most one texel per pixel. */
export const TARGET_MAG = 1.0;

/** The scales a master can have (`<state>@<n>x.png`, n >= 2, beside the approved 1x file). */
export const MASTER_SCALES: readonly number[] = [2, 3, 4];

/** Megabytes a mip-mapped RGBA8 texture of this size occupies on the GPU (the mip chain adds a third). */
export function textureMB(width: number, height: number): number {
  return (width * height * 4 * (4 / 3)) / (1024 * 1024);
}

/** The kind of GPU a renderer string names: `software`, `discrete`, `integrated` or `unknown`. */
export function classifyGpu(renderer: string | null): 'software' | 'discrete' | 'integrated' | 'unknown' {
  if (!renderer) return 'unknown';
  const r = renderer.toLowerCase();
  if (/swiftshader|llvmpipe|softpipe|software|basic render/.test(r)) return 'software';
  if (/nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|radeon vii|apple m\d|intel\(r\) arc|intel arc|arc\(tm\)/.test(r)) return 'discrete';
  if (/intel|uhd|iris|hd graphics|radeon\(tm\) graphics|radeon graphics|radeon vega|adreno|mali|powervr|videocore|apple gpu/.test(r)) return 'integrated';
  return 'unknown';
}

/** The device class: the phone layout first, then the GPU, then the memory the browser admits to. */
export function classifyDevice(s: DeviceSample): DeviceClass {
  if (s.phone) return 'phone';
  const kind = classifyGpu(s.gpu);
  if (kind === 'software') return 'low';
  if (kind === 'discrete') return s.memoryGB !== null && s.memoryGB <= 4 ? 'mid' : 'high';
  return 'mid';
}

const BUDGETS: Readonly<Record<DeviceClass, ArtBudget>> = {
  phone: { cls: 'phone', maxScale: 2, backdropScale: 1, textureMB: 220, groundPx: 1024, deckPx: 512, aa: 'off', msaaSamples: 4 },
  low: { cls: 'low', maxScale: 2, backdropScale: 1, textureMB: 500, groundPx: 1024, deckPx: 512, aa: 'off', msaaSamples: 4 },
  mid: { cls: 'mid', maxScale: 2, backdropScale: 1, textureMB: 900, groundPx: 2048, deckPx: 2048, aa: 'smaa', msaaSamples: 4 },
  high: { cls: 'high', maxScale: 4, backdropScale: 2, textureMB: 2600, groundPx: 4096, deckPx: 4096, aa: 'smaa', msaaSamples: 4 },
};

/** The budget of a device class (a fresh object, so a caller may adjust its own copy). */
export function budgetFor(cls: DeviceClass): ArtBudget {
  return { ...BUDGETS[cls] };
}

/** Parse a `?arttier=` override (captures, QA and the measurements force a class); anything else is null. */
export function parseTierOverride(value: string | null | undefined): DeviceClass | null {
  return value === 'phone' || value === 'low' || value === 'mid' || value === 'high' ? value : null;
}

/** Pixels across which the standard camera at 1440p shows the widest figure at under one texel per pixel (see the evidence). */
export const BASE_BUFFER_WIDTH = 2560;

/**
 * The scale a figure loads at **before** anything has measured it: 1x on a buffer under 1440p wide (the standard camera shows
 * every figure at 0.95x or less at 1440p, so no master can add a visible texel there), the 2x master from 1440p up so the
 * colossus and held shots that magnify a figure start sharp. Never above the device's ceiling.
 */
export function baseScale(b: ArtBudget, bufferWidth: number): number {
  return Math.min(b.maxScale, bufferWidth >= BASE_BUFFER_WIDTH ? 2 : 1);
}

/**
 * The scale a backdrop painting (and its depth plates) is drawn at: the 2x master when the device allows it and the buffer is
 * wide enough that the painting is magnified past one texel per pixel at its native size (2688 px of painting across about 53
 * percent of the frame: 1.3x at 1440p, 0.97x at 1080p).
 */
export function backdropScaleFor(b: ArtBudget, bufferWidth: number): number {
  return bufferWidth >= BASE_BUFFER_WIDTH ? b.backdropScale : 1;
}

/** The real-valued master scale an on-screen size asks for: screen pixels per 1x texel over the magnification we accept. */
export function requiredScale(pixelsPer1xTexel: number, target: number = TARGET_MAG): number {
  return pixelsPer1xTexel > 0 ? pixelsPer1xTexel / target : 1;
}

/**
 * The master to draw from: the smallest one at or above `required` that the device's `cap` allows, else the largest one
 * under the cap (a figure that cannot reach one texel per pixel still takes the best the device and the file set give),
 * else 1. `available` are the scales on disk beyond 1x (2, 3, 4); order does not matter.
 */
export function pickScale(required: number, available: readonly number[], cap: number): number {
  const ok = [...available].filter((s) => s >= 2 && s <= cap).sort((a, b) => a - b);
  if (required <= 1 || ok.length === 0) return 1;
  const enough = ok.find((s) => s >= required - 1e-6);
  return enough ?? ok[ok.length - 1]!;
}

/** The scale one step below `scale` among `available` (and 1x at the bottom): what a missing file falls back to. */
export function fallbackScale(scale: number, available: readonly number[]): number {
  const below = [...available].filter((s) => s >= 2 && s < scale).sort((a, b) => b - a);
  return below[0] ?? 1;
}

/** A slot's hysteresis: upgrade at the first sign of magnification, downgrade only when the smaller master is clearly enough. */
export const DOWNGRADE_SLACK = 0.55;

/**
 * Should a texture at `held` be replaced? `up` when the held master is magnified past the target and a bigger one is allowed,
 * `down` never from here (eviction owns it), else `keep`. Pure so the governor's rules are testable without a GPU.
 */
export function tierMove(held: number, required: number, available: readonly number[], cap: number): 'up' | 'keep' {
  const want = pickScale(required, available, cap);
  return want > held ? 'up' : 'keep';
}

/** One resident master, for the eviction ledger. */
export interface Resident {
  key: string;
  scale: number;
  mb: number;
  /** The frame it was last drawn on screen. */
  lastSeen: number;
  /** A texture on screen right now is never evicted. */
  visible: boolean;
}

/**
 * Which resident masters to drop to get under `budgetMB`: only masters above 1x that are not on screen, least recently seen
 * first, biggest first among equals. Returns the keys, in drop order. Never drops a visible texture, so a scene that really
 * needs more than the budget keeps it (the budget is the governor's target, not a hard wall).
 */
export function evictionOrder(residents: readonly Resident[], budgetMB: number): string[] {
  let total = residents.reduce((s, r) => s + r.mb, 0);
  if (total <= budgetMB) return [];
  const drop = residents
    .filter((r) => r.scale > 1 && !r.visible)
    .sort((a, b) => a.lastSeen - b.lastSeen || b.mb - a.mb);
  const out: string[] = [];
  for (const r of drop) {
    if (total <= budgetMB) break;
    out.push(r.key);
    total -= r.mb;
  }
  return out;
}
