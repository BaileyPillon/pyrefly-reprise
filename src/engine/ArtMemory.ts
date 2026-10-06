import { evictionOrder, textureMB, type Resident } from './ArtBudget.ts';
import { SEEN_WINDOW_MS, type Entry } from './ArtEntry.ts';
import { imageHeight, imageWidth } from './ArtMeasure.ts';

/**
 * The art governor's texture-memory accounting (release 39, "r39-hires-engine", split out of `ArtGovernor.ts` for the house line limit; release 39.1 added the warm pool;
 * both games, shared plumbing). Pure over the governor's entries: no DOM, no three.js beyond the texture's image size.
 */

/** Megabytes the figures' textures take once drawn: what is resident now, the masters swapped in that have not been drawn yet, and the loads on their way. */
export function committedMB(entries: Iterable<Entry>): number {
  let t = 0;
  for (const e of entries) {
    const k = Math.max(e.loading, e.scale) / e.scale;
    if (e.mb > 0 || e.scale > e.baseScale || e.loading > e.scale) t += textureMB(imageWidth(e.texture) * k, imageHeight(e.texture) * k);
  }
  return t;
}

/** Would a master of `scale` for this painting fit under the budget, counting every master already promised? (Speculative loads ask; they never evict.) */
export function roomFor(entries: Iterable<Entry>, scale: number, e: Entry, budgetMB: number): boolean {
  const k = scale / e.scale;
  const now = e.mb > 0 || e.scale > e.baseScale ? textureMB(imageWidth(e.texture), imageHeight(e.texture)) : 0;
  return committedMB(entries) + textureMB(imageWidth(e.texture) * k, imageHeight(e.texture) * k) - now <= budgetMB;
}

/**
 * The warm pool (release 39.1): masters uploaded to the GPU ahead of the first frame that draws them (a sibling pose brought up in the background, a base-loaded 2x pose
 * the first menu has not drawn yet) so that first draw is not a 20 to 40 ms upload. They are speculative memory until the painting is drawn, so they are capped: a share of the
 * class's texture budget, and never more than {@link WARM_MAX_MB}. Past the cap a painting is uploaded the old way, at its first draw.
 */
export const WARM_MAX_MB = 640;
export const WARM_SHARE = 0.3;
/** A painting smaller than this (pixels) is not worth warming: its first draw uploads in about 4 ms. */
export const WARM_MIN_PIXELS = 1_500_000;

export function warmCap(budgetMB: number): number {
  return Math.min(WARM_MAX_MB, budgetMB * WARM_SHARE);
}

/** Megabytes held by masters uploaded ahead and not drawn since, and those on their way (a speculative load counts from the moment it is asked for). */
export function warmMB(entries: Iterable<Entry>): number {
  let t = 0;
  for (const e of entries) t += (e.warm ? e.mb : 0) + e.pendingMB;
  return t;
}

/** Would `sizeMB` more of warm memory stay under the cap? `own` is the entry the megabytes are for: its own pending load is not counted twice. */
export function warmRoom(entries: Iterable<Entry>, sizeMB: number, budgetMB: number, own?: Entry): boolean {
  return warmMB(entries) - (own?.pendingMB ?? 0) + sizeMB <= warmCap(budgetMB);
}

/** The entries to send back to their first scale: masters above it that are not on screen, least recently seen first, until the textures fit the budget. */
export function evictions(entries: Iterable<Entry>, t: number, budgetMB: number): Entry[] {
  const residents: Resident[] = [];
  const byKey = new Map<string, Entry>();
  let i = 0;
  for (const e of entries) {
    if (e.mb <= 0) continue;
    const key = String(i++);
    byKey.set(key, e);
    residents.push({ key, scale: e.scale > e.baseScale ? e.scale : 1, mb: e.mb, lastSeen: e.lastSeen, visible: t - e.lastSeen <= SEEN_WINDOW_MS });
  }
  return evictionOrder(residents, budgetMB).map((key) => byKey.get(key)!);
}
