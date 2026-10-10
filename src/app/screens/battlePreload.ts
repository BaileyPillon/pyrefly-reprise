/**
 * Load a chapter's art while the player is still on its card, its prep menu
 * and its pre-battle scene (PR-0061, A-3), in the order the screens need it
 * (r29: PR-0221, PR-0240).
 *
 * Measured on a production build (real keys, seed 1, 1600x900, GPU), the
 * battle screen spent 2.2 s of Chapter 1's entry behind the swirl, 0.9 s of it
 * per-painting work (decode, matte check, alpha measurement): `PaintedArtCache.ts`
 * keeps that answer and this fills it early, one painting at a time with a
 * yield in between, so the menus keep their frame rate.
 *
 * r29 measured the cold load over a 25 Mbit/s link (`docs/handoff/r29-load.md`):
 * 25 to 33 s from the scene to the battle, almost all of it waiting on bytes,
 * because the board's rail strips and every card the cursor had rested on were
 * downloading alongside, and the scene's own speaker portraits were queued
 * behind them. So this now runs in phases, most urgent first, each waiting for
 * the one before so it has the pipe to itself:
 *
 * 1. the scene's opening frame: its backdrop and first speaker (`sceneArt.ts`);
 * 2. the scene's other speakers and plates;
 * 3. the battle's opening frame: the backdrop as `Backdrop` loads it, then the
 *    boss's idle, the party's idles and the faces the battle-start card and
 *    the HUD show;
 * 4. every other pose (downloads a few at a time, decode one at a time);
 * 5. the party's pause close-ups, the file the pause's `srcset` will choose.
 *
 * A board dwell (`boardWarm.ts`) runs phases 1 to 3 in the normal lane and then
 * waits: only a chosen chapter (`runChapter`) goes on to 4 and 5, and choosing
 * it promotes everything already asked for to the urgent lane. A newer preload
 * stops an older one at its next step and cancels its downloads, so a card the
 * cursor only passed does not keep downloading under the chosen one.
 *
 * It asks for exactly what `BattlePresenterStage` will stage: the engine's
 * own opening state, each figure's art id through the same `resolveArt`, every
 * pose that figure has, with the stage's matte and fit options. Anything it
 * misses is simply loaded by the battle as before. Only files the art manifest
 * lists are requested.
 *
 * Game case: both. Shared loading, no game rule involved.
 */

import type { Chapter } from '../../data/encounters.ts';
import { artCandidatesFor, backdropUrl, portraitUrl, resolveArt } from '../../engine/BattlePresenterArt.ts';
import { manifestKnowsAsset, pause2xUrlFor } from '../../engine/ArtManifest.ts';
import { artUrl, prewarmPainted } from '../../engine/PaintedArt.ts';
import { pixelUrlFor } from '../../engine/ArtTier.ts';
import { artNamespaceOfScene, inArtNamespace } from '../../data/art/artNamespace.ts';
import { pickHeroBackgroundUrl } from '../../ui/common/chapterPanel.ts';
import { demoteWarm, warmImages, type WarmLane } from '../imageWarm.ts';
import { plateIdFor } from './pause/plates.ts';
import { sceneArtUrls } from './sceneArt.ts';
import { SECTOR1_PLATE } from '../../scenes/sector1-reactor-staging.ts';
import { setupForChapter } from './BattleScreenSetup.ts';
import { createEngine } from './BattleScreenWiring.ts';
import { headlineEnemy } from '../../battle/common/headlineEnemy.ts';

/** The options `BattlePresenterStage.add` gives every figure. */
const STAGE_MATTE = { mode: 'auto' } as const;
const STAGE_FIT = {};
/** Downloads in flight at once for the poses (decode stays one at a time). */
const FETCH_WINDOW = 3;

interface Run {
  report: Promise<PreloadReport>;
  /** True once a chapter was chosen, not just rested on. */
  chosen: boolean;
  choose: () => void;
  stop: AbortController;
  /** Every image URL warmed so far, promoted when the chapter is chosen. */
  asked: string[];
}

/** One run per chapter at a time; a second call joins the first. */
const running = new Map<string, Run>();

/**
 * Who the battle-start card names, read from the same opening state the
 * preload builds (A-3): the card can go up over the ink while the battle is
 * still loading, before the battle screen has an engine of its own.
 */
export interface BattleCardInfo {
  bossName: string;
  artKey: string;
  party: Array<{ id: string; artId: string; name: string }>;
}
const cardInfo = new Map<string, BattleCardInfo>();

/** The card's boss and party for a chapter the preload has opened, or undefined. */
export function battleCardInfo(chapterId: string): BattleCardInfo | undefined {
  return cardInfo.get(chapterId);
}

/** True when a running preload has asked for this image (the board keeps it urgent when it leaves). */
export function preloadAsked(url: string): boolean {
  for (const run of running.values()) if (run.asked.includes(url)) return true;
  return false;
}

/** What a preload did, for the probe and the tests. */
export interface PreloadReport {
  chapterId: string;
  paintings: number;
  portraits: number;
  ms: number;
}

/** How a preload was asked for. */
export interface PreloadOptions {
  /** A card the cursor rests on: phases 1 to 3 in the normal lane, then wait to be chosen. */
  dwell?: boolean;
}

/** Pull a file into the HTTP cache without holding on to it. */
function prefetch(url: string, signal: AbortSignal): Promise<void> {
  return fetch(url, { signal })
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

/** Load order after the backdrop: the headline enemy, the other enemies, then the party. */
function rank(c: { side: string; flags: { isPart?: boolean } }): number {
  if (c.side !== 'enemy') return 2;
  return c.flags.isPart ? 1 : 0;
}

/** Scenes whose painting is not `backdrops/<sceneKey>.png`: the scene module names its own file. */
const SCENE_PLATES: Readonly<Record<string, string>> = { 'sector1-reactor': SECTOR1_PLATE.url }; // FF7 (r29 PR-0222)

/** The battle backdrop's URL as the scene loads it. */
export function plateUrlFor(sceneKey: string): string {
  const own = SCENE_PLATES[sceneKey];
  return own ? artUrl(own) : backdropUrl(sceneKey);
}

/** The pause close-up the pause's `srcset` will pick for this window (`PortraitStage.mountPlate`). */
export function pausePlateUrl(memberId: string, game: Chapter['game'], namespace?: string): string {
  const url1x = artUrl(`art/pause/${plateIdFor(memberId, game, namespace)}.png`);
  if (typeof window === 'undefined') return url1x;
  return pickHeroBackgroundUrl(url1x, pause2xUrlFor(url1x), window.innerWidth, window.innerHeight, window.devicePixelRatio);
}

/**
 * Warm the chapter's art. Never rejects; resolves with what it did.
 * `seed` only picks the engine's opening state, which never depends on it for
 * who is on the field.
 */
export function preloadBattle(chapter: Chapter, seed = 1, opts: PreloadOptions = {}): Promise<PreloadReport> {
  // The newest preload wins the pipe: every other run stops at its next step.
  for (const [id, run] of running) {
    if (id !== chapter.id) {
      run.stop.abort();
      demoteWarm(run.asked); // its images queue behind everything else now
      running.delete(id);
    }
  }
  const known = running.get(chapter.id);
  if (known) {
    if (!opts.dwell) known.choose();
    return known.report;
  }
  // No image pipeline (jsdom, a unit test): nothing can be warmed.
  if (typeof Image === 'undefined' || typeof Image.prototype.decode !== 'function') {
    return Promise.resolve({ chapterId: chapter.id, paintings: 0, portraits: 0, ms: 0 });
  }
  let chose: () => void = () => undefined;
  const chosenYet = new Promise<void>((resolve) => (chose = resolve));
  const run: Run = {
    report: Promise.resolve(null as never),
    chosen: !opts.dwell,
    stop: new AbortController(),
    asked: [],
    choose: () => {
      if (run.chosen) return;
      run.chosen = true;
      // Promote what the dwell asked for in the normal lane.
      void warmImages(run.asked, 'urgent');
      chose();
    },
  };
  if (run.chosen) chose();
  run.report = runPreload(chapter, seed, run, chosenYet);
  running.set(chapter.id, run);
  return run.report;
}

async function runPreload(chapter: Chapter, seed: number, run: Run, chosenYet: Promise<void>): Promise<PreloadReport> {
  const t0 = performance.now();
  const signal = run.stop.signal;
  const stopped = (): boolean => signal.aborted;
  const lane = (): WarmLane => (run.chosen ? 'urgent' : 'normal');
  const warm = (urls: string[]): Promise<boolean[]> => {
    run.asked.push(...urls);
    return warmImages(urls, lane());
  };
  let paintings = 0;
  let portraits = 0;
  try {
    // The opening state first (A-3: the card over the ink names its boss and party from it).
    const engine = await createEngine(chapter.game, setupForChapter(chapter, seed), { automated: true });
    const state = engine.state();
    const ns = artNamespaceOfScene(chapter.sceneKey); // the scene's art namespace (the experimental Leblanc chapter): the same ids the stage will resolve
    const figures = stagedIds(state)
      .map((id) => state.combatants[id])
      .filter((c): c is NonNullable<typeof c> => c !== undefined && !c.flags.hidden && !c.removed);
    const boss = headlineEnemy(state, chapter.enemyGroupRef.bossId); // PR-0243: the declared boss, else the first enemy
    const party = state.activeIds
      .map((id) => state.combatants[id])
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (boss) {
      cardInfo.set(chapter.id, {
        bossName: boss.name,
        artKey: inArtNamespace(ns, boss.spriteKey || boss.id),
        party: party.map((c) => ({ id: c.id, artId: inArtNamespace(ns, c.spriteKey || c.id), name: c.name })),
      });
    }
    // Phases 1 and 2: the pre-battle scene, its opening frame first.
    const scene = sceneArtUrls(chapter.scriptsRef?.pre, chapter.sceneKey);
    await warm(scene.first);
    if (stopped()) return report();
    await warm(scene.rest);
    if (stopped()) return report();

    // Phase 3: the battle's opening frame. The backdrop as `Backdrop` loads it (no matte, no fit).
    if (await prewarmPainted(plateUrlFor(chapter.sceneKey))) paintings++;
    figures.sort((a, b) => rank(a) - rank(b) || Number(b === boss) - Number(a === boss)); // the card's subject first
    // The card's chips: each face, and an FFX-2 girl's dressphere body under it
    // (`BattleStartBanner.memberFaceHtml`), decoded so no chip shows its letter (PR-0176).
    const faces = [
      ...[...new Set(party.flatMap((c) => [c.id, c.spriteKey || c.id]))].map((id) => portraitUrl(id)),
      ...party.filter((c) => c.spriteKey && c.spriteKey !== c.id).map((c) => artUrl(`art/characters/${inArtNamespace(ns, c.spriteKey)}/idle.png`)),
    ];
    const facesWarm = warm(faces);
    const later: string[] = [];
    for (const c of figures) {
      if (stopped()) return report();
      const kind = c.side === 'enemy' ? 'enemy' : 'party';
      const art = await resolveArt(artCandidatesFor(c, ns), kind);
      // Only what the manifest says is on disk: a figure with no painting
      // (Cid on the airship, an FFX-2 dressphere with no portrait) is drawn by
      // its stand-in, and asking for its files was a 404 each (round 11).
      const idle = art.poses['idle'];
      for (const u of new Set(Object.values(art.poses))) {
        if ((await manifestKnowsAsset(u)) === false) continue;
        if (u !== idle) later.push(u);
      }
      if (idle && (await manifestKnowsAsset(idle)) !== false) {
        if (await prewarmPainted(idle, STAGE_MATTE, STAGE_FIT)) paintings++;
        await yieldFrame();
      }
    }
    portraits += (await facesWarm).filter(Boolean).length;
    if (stopped()) return report();

    // A card only rested on stops here until it is chosen (or another card wins).
    if (!run.chosen) {
      await Promise.race([chosenYet, new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }))]);
      if (stopped()) return report();
    }

    // Phase 4: every other pose, a few downloads ahead of the one-at-a-time decode.
    let next = 0;
    let done = 0;
    // The file the painting will really be drawn from (release 39: the master of the device's base scale, not the approved file it is named after).
    const ahead = (): void => {
      while (next < later.length && next < done + FETCH_WINDOW) void pixelUrlFor(later[next++]!).then((px) => prefetch(px, signal));
    };
    for (const url of later) {
      ahead();
      if (stopped()) return report();
      if (await prewarmPainted(url, STAGE_MATTE, STAGE_FIT)) paintings++;
      done++;
      await yieldFrame();
    }

    // Phase 5: the party's pause close-ups (first Esc, then tab-next).
    await warm(party.map((c) => pausePlateUrl(c.id, chapter.game, ns)));
  } catch (e) {
    console.warn(`[preload] ${chapter.id}: stopped early`, e);
  } finally {
    if (running.get(chapter.id) === run) running.delete(chapter.id);
  }
  return report();

  function report(): PreloadReport {
    return { chapterId: chapter.id, paintings, portraits, ms: Math.round(performance.now() - t0) };
  }
}
