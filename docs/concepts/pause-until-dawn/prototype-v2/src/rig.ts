/**
 * The rig description: what art exists, where it goes, and the head region
 * a turn is allowed to warp. `loadRig` tries the art agent's `rig.json`
 * first and falls back to a stand-in built from the frontal plate alone, so
 * this runtime is complete and testable before that file exists (per the
 * brief: "poll the file at the end; it is being authored in parallel").
 */
import { RIG_CONSTANTS, type RigConstants } from './constants.ts';

export interface PatchState {
  /** Relative to this rig file's own directory, or null for "the plate itself". */
  file: string | null;
}

export interface PatchGroup {
  /** [x, y, w, h] in the rig canvas's own pixel space. */
  box: [number, number, number, number];
  pad: number;
  feather: number;
  states: Record<string, PatchState>;
}

export type PixelBox = [x: number, y: number, w: number, h: number];

export interface RigKey {
  id: string;
  /** Degrees of yaw this painted key represents; 0 = frontal. */
  yawDeg: number;
  file: string;
  /** Hand-authored landmarks in rig-canvas pixel space, for a real mesh warp. */
  landmarks?: Array<[number, number]>;
  /**
   * Where `file` sits on the shared canvas. Filled in by `derivePlacementBoxes`
   * for an authored rig (from `artMeta`, since a key's own head-flat crop is
   * usually smaller than the canvas); the stand-in sets it to the full canvas
   * directly, because its one key *is* the full plate.
   */
  placementBox?: PixelBox;
}

export interface HeadBox {
  /** Normalised [0..1] box within the rig canvas the turn is allowed to warp. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Rig {
  character: string;
  canvas: { width: number; height: number };
  /** The pinned body layer: shoulders, collar, background. Never warped. */
  bodyFile: string;
  /** Where `bodyFile` sits on the canvas (see `RigKey.placementBox`'s note). */
  bodyPlacementBox?: PixelBox;
  headBox: HeadBox;
  keys: RigKey[];
  patches: Record<string, PatchGroup>;
  constants: RigConstants;
  /** True when this is the built-in stand-in, not the art agent's file. */
  standIn: boolean;
  /** Present only on an authored rig; read only by `derivePlacementBoxes`. */
  artMeta?: ArtMeta;
}

interface ArtMetaLayerEntry {
  file: string;
  box?: PixelBox;
}
interface ArtMetaLayer {
  headFlat?: { file: string; box?: PixelBox };
  files?: Record<string, ArtMetaLayerEntry>;
}
interface ArtMeta {
  layers?: Record<string, ArtMetaLayer>;
}

/**
 * Yuna X-2's patch geometry as authored in
 * `art/patches/patches.json` (canvas 832x1216). Brows have no delivered art
 * (both `raised` and `drawn` are `FAIL`, per `art/patches/patches.md`), so
 * the group is declared with no files — `face.ts` still runs the brow
 * scheduler for the diagnostics log, but the renderer draws nothing for it.
 */
function standInPatches(): Record<string, PatchGroup> {
  return {
    eyes: {
      box: [248, 345, 517, 125],
      pad: 24,
      feather: 8,
      states: {
        open: { file: null },
        half: { file: 'patches/eyes/half.png' },
        closed: { file: 'patches/eyes/closed.png' },
      },
    },
    mouth: {
      box: [300, 585, 320, 105],
      pad: 24,
      feather: 8,
      states: {
        neutral: { file: null },
        parted: { file: 'patches/mouth/parted.png' },
        smile: { file: 'patches/mouth/smile.png' },
        pressed: { file: 'patches/mouth/pressed.png' },
      },
    },
    brows: {
      box: [260, 300, 500, 65],
      pad: 16,
      feather: 8,
      states: { neutral: { file: null }, raised: { file: null }, drawn: { file: null } },
    },
  };
}

/**
 * A generous, hand-eyeballed bounding box covering hair-top to chin on the
 * Yuna X-2 plate (832x1216) — approximate pending real geometry from the art
 * agent's `rig.json`. It only has to be big enough that the warp mask fades
 * to zero before it reaches the shoulders/collar, which it does by a wide
 * margin at these numbers.
 */
const STAND_IN_HEAD_BOX: HeadBox = { x: 0.1, y: 0.06, w: 0.8, h: 0.56 };

export function buildStandInRig(frontalFile: string, character = 'yuna-x2'): Rig {
  const fullCanvas: PixelBox = [0, 0, 832, 1216];
  return {
    character,
    canvas: { width: 832, height: 1216 },
    bodyFile: frontalFile,
    bodyPlacementBox: fullCanvas,
    headBox: STAND_IN_HEAD_BOX,
    keys: [{ id: 'frontal', yawDeg: 0, file: frontalFile, placementBox: fullCanvas }],
    patches: standInPatches(),
    constants: RIG_CONSTANTS,
    standIn: true,
  };
}

/**
 * Fills in `placementBox` for the body layer and every key of an authored
 * rig, from `artMeta.layers` (see `Rig`'s doc comment). A key's own
 * pre-composited `headFlat` file states its box directly only for `frontal`
 * in the first delivery (`art/rig.json`, 2026-09-21); for the others this
 * falls back to the union-ish box of their `hair` layer (the widest
 * constituent, per `keys.md`: "headCore + hair only" for a yaw key), which
 * matches the shipped crop size to within a few pixels — close enough for a
 * cross-dissolve, not claimed to be exact. With no metadata at all (or on
 * the stand-in, which never reaches this function), a key's box is the
 * whole canvas.
 */
export function derivePlacementBoxes(rig: Rig): void {
  const canvasBox: PixelBox = [0, 0, rig.canvas.width, rig.canvas.height];
  const layers = rig.artMeta?.layers;
  const frontalBody = layers?.frontal?.files?.body?.box;
  rig.bodyPlacementBox = frontalBody ?? canvasBox;
  for (const key of rig.keys) {
    const layer = layers?.[key.id];
    key.placementBox = layer?.headFlat?.box ?? layer?.files?.hair?.box ?? canvasBox;
  }
}

function isRig(value: unknown): value is Rig {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.character === 'string' && typeof v.bodyFile === 'string' && Array.isArray(v.keys);
}

/**
 * Tries `rigUrl` (the art agent's authored file); on any failure — 404,
 * network error, malformed JSON, or a shape that doesn't look like a rig —
 * falls back to the stand-in built from `frontalFile`. Never throws.
 */
/** `keys` sorted by yaw, ascending (most-left-turned first). */
export function sortedKeys(rig: Rig): RigKey[] {
  return [...rig.keys].sort((a, b) => a.yawDeg - b.yawDeg);
}

/**
 * The yaw range this rig actually supports. The stand-in only warps one
 * painting, so it uses the documented, conservative `RIG_CONSTANTS.yaw.maxDeg`
 * on both sides; an authored rig's range comes straight from its own keys —
 * `art/rig.json`'s first delivery is asymmetric (-85 to +40: `profile-right`
 * never passed its own judge across five rounds, see `art/keys/keys.md`), and
 * the driver should not pretend otherwise.
 */
export function yawRangeForRig(rig: Rig): { min: number; max: number } {
  if (rig.standIn || rig.keys.length < 2) {
    return { min: -RIG_CONSTANTS.yaw.maxDeg, max: RIG_CONSTANTS.yaw.maxDeg };
  }
  const yaws = rig.keys.map((k) => k.yawDeg);
  return { min: Math.min(...yaws), max: Math.max(...yaws) };
}

/** commonLandmarkOrder in every authored key so far: [...,'chin',...] at index 6. */
export const CHIN_LANDMARK_INDEX = 6;

export interface YawBracket {
  a: RigKey;
  /** null at either end of the range: `a` alone covers it, no second key to blend toward. */
  b: RigKey | null;
  /** 0..1, how far from `a` toward `b`. */
  t: number;
}

/** Which one or two keys (and blend weight) cover a given yaw, from `sortedKeys`'s own order. */
export function bracketForYaw(sorted: readonly RigKey[], yawDeg: number): YawBracket {
  const first = sorted[0];
  if (!first) throw new Error('a rig needs at least one key');
  if (sorted.length === 1 || yawDeg <= first.yawDeg) return { a: first, b: null, t: 0 };
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    if (yawDeg <= b.yawDeg) {
      const span = b.yawDeg - a.yawDeg;
      const t = span === 0 ? 0 : (yawDeg - a.yawDeg) / span;
      return { a, b, t: Math.max(0, Math.min(1, t)) };
    }
  }
  return { a: sorted[sorted.length - 1]!, b: null, t: 0 };
}

export async function loadRig(rigUrl: string, frontalFile: string, character = 'yuna-x2'): Promise<Rig> {
  try {
    const res = await fetch(rigUrl);
    if (res.ok) {
      const json: unknown = await res.json();
      if (isRig(json)) {
        const rig: Rig = { ...json, standIn: false };
        derivePlacementBoxes(rig);
        return rig;
      }
    }
  } catch {
    // Falls through to the stand-in — see the module doc comment.
  }
  return buildStandInRig(frontalFile, character);
}
