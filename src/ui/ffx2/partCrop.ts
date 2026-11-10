/**
 * The tile of a part's plate in the FFX-2 party list (step D1 of the Special look; FFX-2 only in what is seen).
 *
 * A part has no portrait and no painting of its own: its tile is a CROP of the figure's already-loaded idle painting (`art/characters/<art>/idle.png`, the main's art id), cut at the
 * part's own region. The box comes from the generated parts table (`data/art/specialParts.ts`, `poses.idle.<role>.crop`, fractions of the painting) through {@link partCropOf}, the one
 * reader of that table here. No part id ever appears in a requested URL, so a doubled-id request cannot happen. Under the painting sits the two-letter monogram (RP, LP, SR, CL, DW, SW),
 * the floor of every face tile; while the art is not installed the switch stays OFF, so a player never sees the bare monogram as a final face.
 */

import type { FFX2Combatant } from '../../battle/common/types.ts';
import { SPECIAL_PARTS, type SpecialPartsId } from '../../data/art/specialParts.ts';
import { manifestKnowsAssetNow } from '../../engine/ArtManifest.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { rowMarkHtml, type RowMark } from '../common/proMarkers.ts';
import { dressphereColour } from './dressphereIcons.ts';

export interface PartCrop {
  /** The main's art id, e.g. `yuna-floral-fallal`. */
  art: string;
  paintW: number;
  paintH: number;
  /** `[x0, y0, x1, y1]`, fractions of the painting. */
  box: readonly [number, number, number, number];
}

/** The crop of one part in the figure's idle painting, or `undefined` when the table has no idle row for it. */
export function partCropOf(special: string, role: 'right' | 'left'): PartCrop | undefined {
  const t = SPECIAL_PARTS[special as SpecialPartsId] as (typeof SPECIAL_PARTS)[SpecialPartsId] | undefined;
  const pose = t?.poses['idle'];
  const p = pose?.[role];
  return t && pose && p ? { art: t.artId, paintW: pose.paint.width, paintH: pose.paint.height, box: p.crop } : undefined;
}

const px2 = (n: number): string => `${(Math.round(n * 100) / 100).toFixed(2)}%`;

/**
 * The inline style that shows `box` in the square tile with the smaller side of the box filling it, so the crop stays right even if a box was clamped to a non-square. For a square box
 * it is `width = 100 / w %` and `left = -100 * x0 / w %`.
 */
export function partCropStyle(c: PartCrop): string {
  const [x0, y0, x1, y1] = c.box;
  if (!(x0 >= 0 && x0 < x1 && x1 <= 1 && y0 >= 0 && y0 < y1 && y1 <= 1)) throw new Error(`a part crop must satisfy 0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1, got [${c.box.join(', ')}]`);
  const W = c.paintW;
  const H = c.paintH;
  const s = 1 / Math.min((x1 - x0) * W, (y1 - y0) * H);
  const left = 50 - 100 * ((x0 + x1) / 2) * W * s;
  const top = 50 - 100 * ((y0 + y1) / 2) * H * s;
  return `position:absolute;left:${px2(left)};top:${px2(top)};width:${px2(100 * W * s)};height:${px2(100 * H * s)};max-width:none;object-fit:fill;z-index:2`;
}

/**
 * A part's face tile: the monogram floor, then the crop of the figure when the art is known (or the manifest has no opinion yet; the `<img>` removes itself on a miss), then the
 * pro-look KO pill that every face tile carries. No `data-face-*` attribute (the portrait refinement passes must not adopt it) and no job chip.
 */
export function partFaceHtml(c: FFX2Combatant, monogram: string, crop?: PartCrop, proMark?: RowMark): string {
  const path = crop ? `art/characters/${crop.art}/idle.png` : null;
  const img =
    crop && path && manifestKnowsAssetNow(artUrl(path)) !== false
      ? `<img class="ffx2stat__face-img ffx2stat__part-img" src="${artUrl(path)}" alt="" draggable="false" style="${partCropStyle(crop)}" onerror="this.remove()" />`
      : '';
  return `<div class="ffx2stat__face ffx2stat__face--part" title="${c.name}" style="--ffx2-job:${dressphereColour(c.dresspheres!.current)}">
      <span class="ffx2stat__mono">${monogram}</span>
      ${img}${rowMarkHtml(proMark ?? null)}
    </div>`;
}
