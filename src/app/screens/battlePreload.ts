/**
 * Load a chapter's battle while the player is still on its prep menu and
 * pre-battle scene (PR-0061).
 *
 * Measured on a production build (real keys, seed 1, 1600x900, GPU), the
 * battle screen spent 2.2 s of Chapter 1's entry behind the swirl before the
 * battle-start card could go up, and 0.9 s of that was per-painting work on
 * the main thread: decoding about 30 PNGs, the matte check and the alpha
 * measurement, all of it the same answer every time. `PaintedArtCache.ts`
 * keeps that answer; this module fills it early, one painting at a time with
 * a yield in between, so the prep menu and the scene keep their frame rate
 * and the battle finds everything ready.
 *
 * It asks for exactly what `BattlePresenterStage` will stage: the engine's
 * own opening state (party slots, enemies and visible parts), each figure's
 * art id through the same `resolveArt`, every pose that figure has, with the
 * stage's matte and fit options; the scene's backdrop as `Backdrop` loads it;
 * and the portraits the battle-start card and the HUD show. Anything it misses
 * is simply loaded by the battle as before.
 *
 * Game case: both. Shared loading, no game rule involved.
 */

import type { Chapter } from '../../data/encounters.ts';
import { artIdFor, backdropUrl, portraitUrl, resolveArt } from '../../engine/BattlePresenterArt.ts';
import { manifestKnowsAsset } from '../../engine/ArtManifest.ts';
import { prewarmPainted } from '../../engine/PaintedArt.ts';
import { warmImage } from '../imageWarm.ts';
import { setupForChapter } from './BattleScreenSetup.ts';
import { createEngine } from './BattleScreenWiring.ts';

/** The options `BattlePresenterStage.add` gives every figure. */
const STAGE_MATTE = { mode: 'auto' } as const;
const STAGE_FIT = {};

/** One run per chapter at a time; a second call joins the first. */
const running = new Map<string, Promise<PreloadReport>>();

/** What a preload did, for the probe and the tests. */
export interface PreloadReport {
  chapterId: string;
  paintings: number;
  portraits: number;
  ms: number;
}

/** Pull a file into the HTTP cache without holding on to it. */
function prefetch(url: string): Promise<void> {
  return fetch(url)
    .then((res) => (res.ok ? res.blob() : null))
    .then(
      () => undefined,
      () => undefined,
    );
}

/** A macrotask yield, so a frame can land between two paintings. */
const yieldFrame = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** The ids the stage draws at the opening: party slots, an aeon, enemies, visible parts. */
function stagedIds(state: {
  activeIds: readonly string[];
  enemyIds: readonly string[];
  aeonId?: string | null;
  combatants: Record<string, { flags: { isPart?: boolean; hidden?: boolean }; removed?: boolean }>;
}): string[] {
  const ids = new Set<string>([...state.activeIds, ...(state.aeonId ? [state.aeonId] : []), ...state.enemyIds]);
  for (const [id, c] of Object.entries(state.combatants)) {
    if (c.flags.isPart && !c.flags.hidden && !c.removed) ids.add(id);
  }
  return [...ids];
}

/**
 * Warm the chapter's battle art. Never rejects; resolves with what it did.
 * `seed` only picks the engine's opening state, which never depends on it for
 * who is on the field.
 */
export function preloadBattle(chapter: Chapter, seed = 1): Promise<PreloadReport> {
  const known = running.get(chapter.id);
  if (known) return known;
  // No image pipeline (jsdom, a unit test): nothing can be warmed.
  if (typeof Image === 'undefined' || typeof Image.prototype.decode !== 'function') {
    return Promise.resolve({ chapterId: chapter.id, paintings: 0, portraits: 0, ms: 0 });
  }
  const run = (async (): Promise<PreloadReport> => {
    const t0 = performance.now();
    let paintings = 0;
    let portraits = 0;
    try {
      // The backdrop first: the largest file, and the first thing the scene loads.
      if (await prewarmPainted(backdropUrl(chapter.sceneKey))) paintings++;
      const engine = await createEngine(chapter.game, setupForChapter(chapter, seed), { automated: true });
      const state = engine.state();
      const figures = stagedIds(state)
        .map((id) => state.combatants[id])
        .filter((c): c is NonNullable<typeof c> => c !== undefined && !c.flags.hidden && !c.removed);
      // Party first (the card's faces), then the enemies.
      figures.sort((a, b) => Number(a.side === 'enemy') - Number(b.side === 'enemy'));
      for (const c of figures) {
        const kind = c.side === 'enemy' ? 'enemy' : 'party';
        if (kind === 'party') {
          for (const id of new Set([c.id, c.spriteKey || c.id])) {
            if (await warmImage(portraitUrl(id))) portraits++;
          }
        }
        const art = await resolveArt([artIdFor(c), c.spriteKey, c.id], kind);
        // Idle first: it is what the card and the opening frame show.
        const poses = Object.entries(art.poses).sort(([a], [b]) => Number(b === 'idle') - Number(a === 'idle'));
        // Only what the manifest says is on disk: a figure with no painting
        // (Cid on the airship, an FFX-2 dressphere with no portrait) is drawn
        // by its stand-in, and asking for its files was a 404 each (round 11).
        const urls: string[] = [];
        for (const u of new Set(poses.map(([, p]) => p))) {
          if ((await manifestKnowsAsset(u)) !== false) urls.push(u);
        }
        // The downloads run ahead in parallel (into the HTTP cache only; the
        // cache below keeps the one image it needs); the decode-and-measure
        // stays one painting at a time.
        for (const url of urls) void prefetch(url);
        for (const url of urls) {
          if (await prewarmPainted(url, STAGE_MATTE, STAGE_FIT)) paintings++;
          await yieldFrame();
        }
      }
    } catch (e) {
      console.warn(`[preload] ${chapter.id}: stopped early`, e);
    } finally {
      running.delete(chapter.id);
    }
    return { chapterId: chapter.id, paintings, portraits, ms: Math.round(performance.now() - t0) };
  })();
  running.set(chapter.id, run);
  return run;
}
