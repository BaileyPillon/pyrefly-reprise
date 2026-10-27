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

/**
 * MF-02 (lane "mf-l4-freezes", both games): the HIGH class (a discrete GPU, a 2,600 MB budget) may speculate 1,092 MB (42 percent, never over 1,100) and not 640. The pool still lives inside the class's budget (a
 * speculative load is admitted only when `roomFor` says the budget holds it, whether it is staged or swapped in unstaged), so this changes WHEN the memory is resident, not how much the class can ever hold: Chapter I
 * swapped 41 of 136 masters in unstaged because the pool was full (640 MB), and each paid a 50 to 145 ms upload on the frame that first drew it. `?warmpool=old` is release 64's 640 MB for a comparison.
 */
export const WARM_MAX_MB_HIGH = 1100;
export const WARM_SHARE_HIGH = 0.42;
export const HIGH_BUDGET_MB = 2400;

let widePool: boolean | undefined;
function wide(): boolean {
  if (widePool === undefined) {
    try {
      widePool = typeof window === 'undefined' ? true : new URLSearchParams(window.location.search).get('warmpool') !== 'old';
    } catch {
      widePool = true;
    }
  }
  return widePool;
}

/** For the tests and the lane's job: the wide pool on or off. */
export function setWidePool(on: boolean | undefined): void {
  widePool = on;
}

export function warmCap(budgetMB: number): number {
  if (budgetMB >= HIGH_BUDGET_MB && wide()) return Math.min(WARM_MAX_MB_HIGH, budgetMB * WARM_SHARE_HIGH);
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

/**
 * MF-02 (motion-fluidity pass, lane "mf-l4-freezes"; both games): which poses of a figure are staged first when the warm pool cannot hold them all. A figure's poses are not equally likely to be the next
 * one drawn: the strike, the spell, the flinch and the item come up every few turns, the sleep, the victory and the overdrive paintings once a fight or never. The pool used to fill in the order the
 * poses were registered (alphabetical), so at the first upgrade it took a figure's sleep and victory paintings and had no room left when the summon's hot poses were loaded 60 seconds in (Chapter I,
 * 41 of 136 masters swapped in unstaged and uploaded in 50 to 145 ms on the frame that first drew them). Ordering only: nothing is loaded that was not, and nothing looks different.
 */
const POSE_HEAT: Readonly<Record<string, number>> = {
  attack: 0.9, cast: 0.9, hurt: 0.9, item: 0.85, ready: 0.85, idle: 0.8, defend: 0.6, critical: 0.6, ko: 0.5, follow: 0.35, victory: 0.3, sleep: 0.2,
};

/** How soon a painting is likely to be drawn, 0 to 1, from the pose in its address (`art/characters/<id>/<pose>[@<n>x].<ext>`); 0.4 for a name this does not know (so an unknown set keeps its order). */
export function poseHeat(url: string): number {
  const m = /\/([a-z0-9-]+?)(?:%40|@)?(?:\d+x)?\.(?:png|webp)(?:\?.*)?$/i.exec(url);
  const pose = m?.[1]?.toLowerCase();
  if (!pose) return 0.4;
  if (pose.startsWith('od-')) return 0.2;
  return POSE_HEAT[pose] ?? 0.4;
}
