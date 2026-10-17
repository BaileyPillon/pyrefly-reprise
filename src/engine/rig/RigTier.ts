/**
 * Which tier of a rig's textures a figure loads, and how much of the device the rigs may hold (the rig program, 2026-10-17; both games, shared plumbing; pure: no `three`, no DOM).
 *
 * A rig is cut from the 2x master of its costume painting, so a part's PNG is the master's pixels. Six figures of that kind are a quarter of a gigabyte of GPU memory with their mips and
 * rim masks, and a phone budgets 220 MB for all its figures (`ArtBudget.ts`). Beside every part PNG and rim mask the pipeline writes the picture at half the width and height
 * (`<subject>/1x/<same name>`, `tools/rig/rig-tiers.mjs`; the art manifest lists a rig that has them in `rigTiers`). The mesh, the uvs and the rim's width need nothing else (they are 0..1 of
 * the image and painting px), so a figure just binds the other file.
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

/** What `planRigTextures` needs of a part. */
export interface TierPart {
  /** `[x, y, w, h]` in the master's px: the size of the part's PNG (and of its rim mask). */
  box: readonly [number, number, number, number];
  /** True when the part has a rim mask texture (`rimMode === 'mask'`). */
  rim: boolean;
}

/** Megabytes of GPU memory (RGBA8 with mips) one figure's textures take at these scales. A tier-1 file is `ceil(w / 2) x ceil(h / 2)` (`rig-tiers.mjs` halve). */
export function rigTextureMB(parts: readonly TierPart[], t: RigTextures): number {
  let mb = 0;
  const side = (n: number, s: RigScale): number => (s === 1 ? Math.ceil(n / 2) : n);
  for (const p of parts) {
    mb += textureMB(side(p.box[2], t.map), side(p.box[3], t.map));
    if (p.rim) mb += textureMB(side(p.box[2], t.rim), side(p.box[3], t.rim));
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
