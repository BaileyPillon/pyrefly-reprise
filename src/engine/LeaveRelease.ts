/**
 * Leaving a fight lets go of what the fight did not use (lane "budgets-2", 2026-10-29; BOTH games, shared loading and memory plumbing; ChatGPT point 5, `docs/BUDGETS.md` B5a).
 *
 * Release 68's focused review (R68-B1) measured the renderer process growing by 74 percent over A, B, A, B, A (Chapter I and Chapter IV), the JS heap by 7 MB and the DOM not at all after the FFX-2
 * HUD fix; the same chapter five times in a row stayed flat. What grows is memory the page keeps ON PURPOSE for a retry and then keeps for the chapter before it as well: the decoded paintings
 * (`PaintedArtCache`: 96 paintings, 900 MB, two chapters' worth: Chapter I has 48 pose files and Chapter IV 43) and the lighting maps (`FigureRelight`: 56 maps, 112 while a figure pins one, evicted one
 * at a time as the next map loads: Chapter I has 40 maps and Chapter IV 28). A retry or the same chapter again needs its own set warm; it never needs the other chapter's.
 *
 * So a fight is a numbered epoch: {@link beginFight} opens it (every painting and map asked for from then on is stamped with it) and {@link endFight}, once the stage is disposed and its figures have
 * let go of their pins, drops the paintings and the unpinned maps the fight did not touch, and unbinds the eye-candy scene (`GoldenHour.bindEyeCandyScene` held the last diorama's Scene object
 * until the next battle bound another). The chapter just left keeps everything it used, so a retry is as warm as before.
 *
 * OFF BY DEFAULT in release 69 (driver, 2026-10-30): the browser job (budgets-2, B5a) measured the books right (49 or 59 paintings and 42 or 38 maps at the boards, against 96 and 80) but the renderer
 * process and page counters worse (+110.8 and +80.2 MB growth over the five fights against +67.1 old, B5a-02/-04/-05) and a revisit 3.5 s slower to enter (B5d-01), peak unchanged. So the default build
 * behaves as release 68: `?memrelease=on` turns the release on (the A/B of the browser jobs); `?memrelease=off` and no word both leave it off. The scene is still unbound either way. The caller passes
 * `keep: true` in the conference demo, whose second fight is built behind the picker and must stay warm.
 */
import { beginPaintingEpoch, dropPaintingsBefore, paintingCacheMB, paintingCacheSize, paintingCacheStamps } from './PaintedArtCache.ts';
import { beginRelightEpoch, relightCacheStats, releaseRelightBefore } from './look/relight/FigureRelight.ts';
import { bindEyeCandyScene } from './fx/a/GoldenHour.ts';

let override: boolean | null | undefined;

/** Force the release on or off (tests, captures); `null` goes back to the address. */
export function setMemRelease(value: boolean | null | undefined): void {
  override = value;
}

/** False unless the address says `?memrelease=on` (or a test forced it on): release 69 ships the leave-release off. */
export function memRelease(): boolean {
  if (override !== undefined && override !== null) return override;
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('memrelease') === 'on';
  } catch {
    return false;
  }
}

/** What the last {@link endFight} let go of (the debug probe and the tests). */
export interface LeaveReport {
  paintings: number;
  paintingMB: number;
  maps: number;
}

let fight = 0;
let last: LeaveReport | null = null;

/** A fight begins: paintings and lighting maps asked for from here on belong to it. Returns its number. */
export function beginFight(): number {
  fight = beginPaintingEpoch();
  beginRelightEpoch(fight);
  return fight;
}

/**
 * The fight is over and its stage is disposed: let go of what it did not use. Safe to call twice and without a `beginFight` (it does nothing then). `keep` (the demo) lets go of nothing.
 * Returns what it released, or null when the release is off, `keep` is set, no fight was begun, or the fight was not judged.
 *
 * `fight` (the number {@link beginFight} returned): the screen that ends is the one that began. A screen that was overtaken and finishes late finds a NEWER fight under way and does nothing at all
 * (it must neither unbind the new screen's scene nor judge what the new fight has not asked for yet; the new fight's own end drops whatever the old one left, since it is older than the new epoch).
 * `judge: false`: unbind the scene but keep every cache as it is. A fight whose figures were never all built (the screen was torn down while it loaded) asked for a part of its set, so what it did not
 * touch is not known to be unused: the chapter before keeps its warm set (review R1).
 */
export function endFight(opts: { keep?: boolean; fight?: number; judge?: boolean } = {}): LeaveReport | null {
  const from = fight;
  if (opts.fight !== undefined && opts.fight !== from) return null; // overtaken: a newer fight (or none) owns the books now
  fight = 0;
  bindEyeCandyScene(null); // the next battle binds its own; the board and the menus have none
  if (from === 0 || opts.judge === false || !memRelease() || opts.keep === true) return null;
  const p = dropPaintingsBefore(from);
  last = { paintings: p.dropped, paintingMB: Math.round(p.mb * 10) / 10, maps: releaseRelightBefore(from) };
  return last;
}

/** The debug probe (`__pyrefly.art.stats().memory`): what the caches hold now and what the last fight's end released. */
export function memoryBooks(): { paintings: number; paintingMB: number; stamps: number; relight: { maps: number; textures: number; pinned: number; stamps: number }; fight: number; release: boolean; last: LeaveReport | null } {
  return { paintings: paintingCacheSize(), paintingMB: Math.round(paintingCacheMB() * 10) / 10, stamps: paintingCacheStamps(), relight: relightCacheStats(), fight, release: memRelease(), last };
}
