/**
 * THE DEMO'S BOSS STAGES, WARMED BEHIND THE TITLE AND THE PICKER (release 62, PR-0481; the conference demo, `?demo=1` only; both games: Chapter I is FFX, Chapter IV is FFX-2).
 *
 * Round 28's deep review of release 61 timed the picker's A press to the first command at 12 to 14 s on a cold page, with frames of 0.8 to 1.5 s. Measured here on the same build (headless GPU
 * Chromium, 2560x1440; `D:/Tools/pyrefly-scratch/2026-10-22/r62/`): about 3.4 s of that is the battle LOADING under the entry's swirl, and the rest is the authored opening (the boss card and the
 * sweep). The load has five costs, none of them the fight's, and all of them can be paid before the press:
 *
 * 1. the fight's paintings: the pose-by-pose decode, matte check and alpha reads (`battlePreload.ts`, phases 4 and 5 start only when the card is CHOSEN, so they ran during the entry);
 * 2. `loadScene`: the backdrop's layer canvases, one main-thread task of 0.8 s that is the first thing the battle does (`scenes/prebuilt.ts`);
 * 3. the diorama's programs, built on the first draw: `getProgramInfoLog` waits 1.0 to 1.5 s for the GPU process (a frame gap of that size);
 * 4. the textures' first upload (0.5 s of `texSubImage2D`).
 * 5. the depth plates of the living painting: the CPU half of their build (the painting and the depth map read back, the feather blur, the cut) is one 0.65 s task right after the press
 *    (`DepthPlates.precutPlates`, through `warmLivingPlates`, is the same arithmetic on the same inputs made behind the picker, in separate tasks, and the battle's own build takes the result).
 *
 * So for each demo fight, one after the other, while the title or the picker is what is on screen: the paintings are preloaded in full, the scene is built and kept, its programs compile in the
 * background (`warmShaders`), and it is drawn once per program family into the composer's own buffer (`drawSlicedOffscreen`: never the canvas, the post chain not run), which builds the GPU
 * executables and uploads the textures. The battle then takes that scene (`takeScene`) and finds its field warm. Nothing about a fight differs: same scene, same art, same engine.
 *
 * It is cooperative: it works only while the title or the picker is on screen, never starts a step once a fight has been picked (`stopDemoWarm`, called by the flow when a run starts), and a
 * step that has begun is one task or one background compile. Back at the picker after a fight, it builds the scene the fight consumed. Outside demo mode nothing calls it.
 */

import type { WebGLRenderer } from 'three';
import type { App } from '../App.ts';
import { getChapter, type Chapter } from '../../data/encounters.ts';
import { applyChapterLook } from '../../engine/look/LookState.ts';
import { patchSideFogIn } from '../../engine/PlateSideFog.ts';
import { warmLivingPlates } from '../../engine/fx/b/LivingPaintings.ts';
import { prewarmBreathRig } from '../../engine/fx/mix/breathRig.ts';
import { preparedPaintings } from '../../engine/PaintedArtCache.ts';
import { hasPrebuilt, prebuildScene } from '../../scenes/prebuilt.ts';
import { readSetting } from '../SaveData.ts';
import { visualStyleOf } from '../saveVisualStyle.ts';
import { preloadBattle } from '../screens/battlePreload.ts';
import { drawSlicedOffscreen, warmShaders } from '../screens/BattleScreenWarmup.ts';
import { demoModeOn } from '../demoMode.ts';
import { DEMO_FIGHTS } from './demoFlow.ts';

/**
 * When, after the page's first real frame, the title starts the two warms (`main.ts`). Release 62 used 4000 and 6000; the R63 play lane measured a player at a human pace (3 s on the title, 3 s on the
 * picker) fighting before either stage was built (0 or 1 warm steps done at the press), and the cold load then cost 1.1 to 1.7 s of frame time in the fight's first 9 s (Chapter IV, 8 to 12 frames over 50 ms).
 * The once-per-page costs (`warmBattleStage`: a second WebGL2 context, 0.7 s of main thread, then the spell atlas) go first, the fights' stages after them. Game case: both.
 */
export const WARM_STAGE_AT_MS = 700;
export const WARM_FIGHTS_AT_MS = 1600;

/** The screens the warm may work behind: the title and the picker. */
const CALM = new Set(['title', 'chapter-select']);

/** What the warm has done, for the probe (`window.__pyrefly` is not touched; the page reads this through `demoWarmLog`) and for the tests. */
const log: Array<{ ms: number; what: string }> = [];
const note = (what: string): void => void log.push({ ms: Math.round(typeof performance !== 'undefined' ? performance.now() : 0), what }); // the page's clock

/** `?demowarm=off`: the release-61 behaviour, for a comparison or if the warm ever misbehaves at the booth (the address of the kiosk page carries it). */
export function demoWarmSwitchedOff(search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  try {
    return new URLSearchParams(search).get('demowarm') === 'off';
  } catch {
    return false;
  }
}

/** The steps taken so far, with the page's time (`performance.now()`). */
export function demoWarmLog(): ReadonlyArray<{ ms: number; what: string }> {
  return log;
}

let running: Promise<void> | null = null;
let stopped = false;

/** A fight has been picked (or the page is leaving): no more steps start. */
export function stopDemoWarm(): void {
  stopped = true;
}

const idle = (ms = 60): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** The slice of `App` this reads. */
export type WarmApp = Pick<App, 'renderer'> & { readonly current: { readonly name: string } | null };

/**
 * Warm both demo fights, in order, behind the title and the picker. One run at a time (a second call joins it); a run that was stopped starts afresh on the next call (the picker, after a
 * fight). Never rejects; resolves when it has done what it will.
 */
export function warmDemoFights(app: WarmApp, fights: readonly string[] = DEMO_FIGHTS.map((f) => f.id)): Promise<void> {
  if (!demoModeOn() || demoWarmSwitchedOff()) return Promise.resolve();
  if (running) return stopped ? running.then(() => warmDemoFights(app, fights)) : running; // a run that was stopped ends at its next step; this call then starts afresh
  stopped = false;
  if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>)['__demoWarmLog'] = log; // the probe reads what the warm did (dev tools, the booth check)
  const calm = (): boolean => !stopped && CALM.has(app.current?.name ?? '');
  running = (async () => {
    for (const id of fights) {
      const chapter = getChapter(id);
      if (!chapter) continue;
      if (!calm()) return;
      await preloadBattle(chapter, 1); // the paintings, every phase (phases 4 and 5 wait for a chosen card otherwise)
      note(`${id}: paintings`);
      await idle();
      if (!calm()) return;
      if (!hasPrebuilt(chapter.sceneKey)) {
        await buildStage(app, chapter);
        note(`${id}: stage built, compiled and drawn offscreen`);
        await idle();
      }
    }
    // lane perf-trim: every painting's breathing field (the living paintings' alpha read) is read behind the title, one picture at a time, so that no pose's first sight in the fight stops the page for the read
    for (const p of await preparedPaintings()) {
      if (!calm()) return;
      await prewarmBreathRig(p.source as CanvasImageSource & { width?: number });
      await idle();
    }
    note('breath rigs read ahead');
  })()
    .catch((e) => note(`stopped: ${String(e).slice(0, 80)}`))
    .finally(() => {
      running = null;
    });
  return running;
}

/** Build `chapter`'s scene, get its programs built and its textures up, and keep it for the battle. */
async function buildStage(app: WarmApp, chapter: Chapter): Promise<void> {
  const scene = await prebuildScene(chapter.sceneKey, app.renderer.camera);
  scene.hideOwnActors();
  patchSideFogIn(scene.scene); // as `BattleScreen.enter` does before it compiles: the patched plates are other programs than the plain ones
  applyChapterLook(chapter.id, visualStyleOf(readSetting('visualStyle'))); // the look's passes join the post chain now (a battle that starts takes the same look, for the same chapter)
  (app.renderer as { prepareLook?: () => void }).prepareLook?.();
  // The depth plates' CPU half (0.65 s in one task right after the press, round 28) is cut while the GPU process compiles; the battle's own build takes the cut (`DepthPlates.precutPlates`).
  const cutting = warmLivingPlates({ key: scene.key, scene: scene.scene, renderer: (app.renderer as { renderer?: WebGLRenderer }).renderer }).catch(() => false);
  await warmShaders(app.renderer, scene.scene); // the programs build in the GPU process while the page runs
  if (await cutting) note(`${chapter.id}: depth plates cut ahead`);
  await drawSlicedOffscreen(app.renderer, scene.scene); // the GPU executables and the textures, one program family a frame
}

/** Forget everything (tests only). */
export function resetDemoWarm(): void {
  running = null;
  stopped = false;
  log.length = 0;
}
