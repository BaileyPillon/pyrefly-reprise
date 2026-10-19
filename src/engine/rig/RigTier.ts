/**
 * Which tier of a rig's textures a figure loads, and how much of the device the rigs may hold (the rig program, 2026-10-17; both games, shared plumbing; pure: no `three`, no DOM).
 *
 * A rig is cut from the 2x master of its costume painting, so a part's PNG is the master's pixels. Six figures of that kind are a quarter of a gigabyte of GPU memory with their mips and
 * rim masks, and a phone budgets 220 MB for all its figures (`ArtBudget.ts`). Beside every part PNG and rim mask the pipeline writes the picture at half the width and height
 * (`<subject>/1x/<same name>`, `tools/rig/rig-tiers.mjs`; the art manifest lists a rig that has them in `rigTiers`). The mesh, the uvs and the rim's width need nothing else (they are 0..1 of
 * the image and painting px), so a figure just binds the other file. **Memory is budgeted from the files' own sizes**, which the gate stamps (`gate.textures`): a part's PNG is not always its box
 * (a ribbon-mapped spear shaft is a thin strip), and a rim mask is not always its map's size (Kimahri's are half of it; a mask already at half its map's size or less has a byte-identical twin).
 *
 * **Which tier** is the paintings' own rule, not a second one: a figure loads at the scale the device would draw its idle painting at (`ArtTier.baseScaleFor`: 1x under a 1440p buffer,
 * the 2x master from 1440p up, 1x on a slow link, the device's ceiling, a pinned `?artscale=`), and the on-screen magnification can raise it later, as the art governor raises a painting
 * (`RigActor` asks `wantsMaster` of the idle plane's measured texel). **The rim mask is a soft factor along an outline** and is read in painting px (`RigMaterial.texel`), so it loads at 1x
 * whenever a 1x twin exists, even beside a 2x map: a mask at half resolution moves a rim's end by a texel of the 1x painting and draws the same on screen.
 *
 * **How much**: the rigs of a battle share `RIG_SHARE` of the class's figure-texture budget (`ArtBudget.textureMB`; the paintings' idles, the backdrop and the effects have the rest). A figure asks
 * for the tier it wants; if that does not fit what is free it takes the next one down; if even that does not fit it is the painting set (`planRigTextures`), as a rig that cannot be built always was.
 */
import { textureMB } from '../ArtBudget.ts';
import { shippedArtUrl } from '../ArtShipped.ts';
import type { RigData } from './RigData.ts';

export type RigScale = 1 | 2;

/** The scale each kind of texture of a figure loads at. */
export interface RigTextures {
  map: RigScale;
  rim: RigScale;
}

/** The folder beside `rig.json` that holds the half-size twins (`tools/rig/rig-tiers.mjs` TIER_DIR). */
export const RIG_TIER_FOLDER = '1x';

/** The share of a class's figure-texture budget the rigs may hold at once. */
export const RIG_SHARE = 0.5;

/** What `planRigTextures` needs of a part: the size of its PNG and of its rim mask, as the files are (`[w, h]`; the rim null when the part has no mask texture). */
export interface TierPart {
  map: readonly [number, number];
  rim: readonly [number, number] | null;
}

/** Is a rim mask bigger than half its map? Then its 1x twin is halved; otherwise the twin is the same file (`tools/rig/rig-tiers.mjs#rimNeedsHalving`, pinned equal by a test). */
export const rimNeedsHalving = (rim: readonly [number, number], map: readonly [number, number]): boolean => rim[0] * 2 > map[0] + 1 || rim[1] * 2 > map[1] + 1;

/** The sizes of a part's 1x twins (`tools/rig/rig-tiers.mjs#twinSizes`): the map halved, the rim halved only when it is bigger than half its map. */
export function twinSizes(p: TierPart): { map: readonly [number, number]; rim: readonly [number, number] | null } {
  const half = (n: number): number => Math.ceil(n / 2);
  return { map: [half(p.map[0]), half(p.map[1])], rim: p.rim === null ? null : rimNeedsHalving(p.rim, p.map) ? [half(p.rim[0]), half(p.rim[1])] : p.rim };
}

const size = (v: unknown): [number, number] | null => (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 1) ? [v[0] as number, v[1] as number] : null);

/**
 * The textures of a rig as the memory budget sees them: the sizes the gate stamped (`gate.textures`), else the part's box for both files (the format's own claim: a PNG is its box, a rim the same
 * size). **Every v2 variant is another texture** (loaded eagerly in v2.0), listed here after its part under the key `<part>:<variant>`, so the budget, the tier plan and the ledger all count it.
 */
export function tierPartsOf(data: Pick<RigData, 'parts' | 'gate'>): TierPart[] {
  const stamped = data.gate?.textures;
  const one = (key: string, m: { box: readonly number[]; rimMode: string; rim: string | null }): TierPart => {
    const t = stamped?.[key];
    const map = size(t?.map) ?? [m.box[2]!, m.box[3]!];
    const rim = m.rimMode === 'mask' && m.rim !== null ? (size(t?.rim) ?? map) : null;
    return { map, rim };
  };
  return data.parts.flatMap((p) => [one(p.name, p), ...p.variants.map((v) => one(`${p.name}:${v.name}`, v))]);
}

/** Megabytes of GPU memory (RGBA8 with mips) one figure's textures take at these scales. */
export function rigTextureMB(parts: readonly TierPart[], t: RigTextures): number {
  let mb = 0;
  for (const p of parts) {
    const twin = twinSizes(p);
    const m = t.map === 1 ? twin.map : p.map;
    mb += textureMB(m[0], m[1]);
    if (p.rim) {
      const r = t.rim === 1 ? twin.rim! : p.rim;
      mb += textureMB(r[0], r[1]);
    }
  }
  return mb;
}

export type TierPlan = { ok: true; textures: RigTextures; mb: number } | { ok: false; reason: string };

/**
 * The textures a figure loads: the first of the tiers it would take, best first, that fits what the rigs may still hold.
 * @param o.tiers the scales the art manifest lists for the rig (`rigTiers`; undefined or without 1: only the full-size files exist)
 * @param o.want the scale the device would draw the figure's idle painting at (`baseScaleFor`): 2 or more asks for the 2x map
 * @param o.budgetMB the class's figure-texture budget @param o.usedMB what the rigs already hold
 */
export function planRigTextures(o: { parts: readonly TierPart[]; tiers: readonly number[] | undefined; want: number; budgetMB: number; usedMB: number }): TierPlan {
  const has1 = o.tiers?.includes(1) === true;
  const candidates: RigTextures[] = o.want >= 2 ? [{ map: 2, rim: has1 ? 1 : 2 }, ...(has1 ? [{ map: 1, rim: 1 } as RigTextures] : [])] : has1 ? [{ map: 1, rim: 1 }] : [{ map: 2, rim: 2 }];
  const cap = o.budgetMB * RIG_SHARE;
  for (const textures of candidates) {
    const mb = rigTextureMB(o.parts, textures);
    if (o.usedMB + mb <= cap) return { ok: true, textures, mb };
  }
  const smallest = rigTextureMB(o.parts, candidates[candidates.length - 1]!);
  return { ok: false, reason: `over the rig texture budget (${smallest.toFixed(0)} MB at the smallest tier, ${Math.max(0, cap - o.usedMB).toFixed(0)} MB free of ${cap.toFixed(0)})` };
}

/** The URL of one texture file of a rig: `base` is the rig's folder URL (no trailing slash), `file` the bare name in `rig.json`. Mapped to the file the site serves (`ArtShipped.ts`: a master derived as WebP). */
export function rigFileUrl(base: string, file: string, scale: RigScale): string {
  return shippedArtUrl(scale === 1 ? `${base}/${RIG_TIER_FOLDER}/${file}` : `${base}/${file}`);
}

/**
 * Should a figure holding the 1x maps ask for the 2x ones? True when one texel of the 1x painting covers more than one screen pixel (the art governor's own target,
 * `ArtBudget.TARGET_MAG`), which is when the 1x file is magnified. `pxPer1xTexel` is `ArtMeasure.pixelsPer1xTexel` of the idle plane.
 */
export function wantsMaster(pxPer1xTexel: number, target = 1): boolean {
  return pxPer1xTexel > target;
}

/** What the rigs of a page hold, in megabytes of texture. Each figure reserves what it loads and gives it back when it goes. */
export class RigTextureLedger {
  private used = 0;

  get usedMB(): number {
    return this.used;
  }

  /** Reserve `mb`; the returned function gives it back (once; a second call does nothing). */
  reserve(mb: number): () => void {
    this.used += mb;
    let given = false;
    return () => {
      if (given) return;
      given = true;
      this.used = Math.max(0, this.used - mb);
    };
  }

  /** Forget everything held (a dev reload; the tests). */
  reset(): void {
    this.used = 0;
  }
}

/** The page's ledger. */
export const rigLedger = new RigTextureLedger();
