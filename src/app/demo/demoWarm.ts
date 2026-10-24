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
import { prepareMixSplash } from '../../engine/fx/mix/splash.ts';
import { battleCardInfo, preloadBattle } from '../screens/battlePreload.ts';
import { drawSlicedOffscreen, warmShaders } from '../screens/BattleScreenWarmup.ts';
import { demoModeOn } from '../demoMode.ts';
import { DEMO_FIGHTS } from './demoFlow.ts';
import { newPrebuildPlan, type PrebuildPlan } from './prebuildFigures.ts'; // lane "prebuild": the fights' figures, built behind the picker
import { prebuildOn } from './prebuildSwitch.ts';

/**
 * When, after the page's first real frame, the title starts the two warms (`main.ts`). Release 62 used 4000 and 6000, which left both stages unbuilt at a press a human makes 6 s after the load (Chapter I's was
 * built at 9.6 s of page time, Chapter IV's at 11.9 s). The overnight fix of the skeptic's M1 (r63-play; both games) starts them at 700 and 1500 ms because the warm no longer holds the page for long: the
 * plate cut is off the page, the atlas a tile at a time, each texture and each program family its own step behind a fence, and every step looks at the pad first. The once-per-page costs go first
 * (`warmBattleStage`), the fights' stages after them.
 */
export const WARM_STAGE_AT_MS = 700;
export const WARM_FIGHTS_AT_MS = 1500;

/** The screens the warm may work behind: the title and the picker. */
const CALM = new Set(['title', 'chapter-select', 'pro-defeat']); // r63-play: and behind a lost fight's card, where the retry's stage is built

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

/** `?retrywarm=off`: a lost fight's retry stage is not built behind the defeat card (the hurried opening alone is the quick retry): for a comparison, or if the warm behind the card ever swallows a press at the booth. */
export function retryWarmSwitchedOff(search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  try {
    return new URLSearchParams(search).get('retrywarm') === 'off';
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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Is a press in progress? A button held on a pad (the keyboard and the mouse are read by the page's own events, which a task of this warm cannot swallow). r63-play, the overnight fix of the skeptic's M1: a step
 * that starts while a button is down would hold the page through the release; the warm waits for it (at most about a second, so a stuck button never stops the warm for good).
 */
export function padBusy(pads: ArrayLike<{ buttons: ArrayLike<{ pressed: boolean }> } | null> | null | undefined): boolean {
  if (!pads) return false;
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad) continue;
    for (let b = 0; b < pad.buttons.length; b++) if (pad.buttons[b]?.pressed === true) return true;
  }
  return false;
}

const inputBusy = (): boolean => {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function' && padBusy(navigator.getGamepads());
  } catch {
    return false;
  }
};

const idle = async (ms = 60): Promise<void> => {
  await sleep(ms);
  for (let i = 0; i < 25 && inputBusy(); i++) await sleep(40);
};

/** The fight whose card the picker's cursor rests on: its stage is warmed before the other's (r63-play: the player is about to pick it). */
let focusId: string | null = null;
export function noteDemoFocus(id: string): void {
  focusId = id;
}

/** The slice of `App` this reads. */
export type WarmApp = Pick<App, 'renderer'> & { readonly current: { readonly name: string } | null };

/**
 * Warm both demo fights, in order, behind the title and the picker. One run at a time (a second call joins it); a run that was stopped starts afresh on the next call (the picker, after a
 * fight). Never rejects; resolves when it has done what it will.
 */
export function warmDemoFights(app: WarmApp, fights: readonly string[] = DEMO_FIGHTS.map((f) => f.id), opts: { light?: boolean } = {}): Promise<void> {
  if (!demoModeOn() || demoWarmSwitchedOff()) return Promise.resolve();
  if (running) return stopped ? running.then(() => warmDemoFights(app, fights, opts)) : running; // a run that was stopped ends at its next step; this call then starts afresh
  const light = opts.light === true; // the retry's warm behind the defeat card: the scene, its plates and its programs' compile; none of the offscreen draws (a 0.3 s upload and the programs' first uses), the splash crops or the breath rigs, which could stop the page as TRY AGAIN is pressed
  stopped = false;
  if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>)['__demoWarmLog'] = log; // the probe reads what the warm did (dev tools, the booth check)
  const calm = (): boolean => !stopped && CALM.has(app.current?.name ?? '');
  running = (async () => {
    // One fight at a time, a step at a time: the paintings, then the stage, then the splash crops. The fight whose card the cursor rests on goes first, and a cursor that moves hands the warm to the other fight at
    // the next step boundary (r63-play, the overnight fix of the skeptic's M1: the player is about to pick it; at human pace there is time for one fight's stage, not both).
    const figuresAhead = !light && prebuildOn(); // lane "prebuild" (`?prebuild=off` is r63-play exactly): the figures are built, uploaded and drawn behind the picker too
    const plans = new Map<string, PrebuildPlan>();
    const steps = new Map(fights.map((id) => [id, { paintings: false, stage: false, figures: !figuresAhead, splash: false, rest: !figuresAhead }]));
    const pick = (ids: string[]): string | null => (ids.length ? (focusId !== null && ids.includes(focusId) ? focusId : ids[0]!) : null);
    // The essentials of every fight come before the other poses of any (lane "prebuild": the first fight's secondary paintings took seconds that the second fight's stage was waiting for).
    const nextFight = (): string | null =>
      pick(fights.filter((id) => { const st = steps.get(id)!; return !(st.paintings && st.stage && st.figures && st.splash); })) ?? pick(fights.filter((id) => !steps.get(id)!.rest));
    for (let id = nextFight(); id !== null; id = nextFight()) {
      const st = steps.get(id)!;
      const chapter = getChapter(id);
      if (!chapter) {
        st.paintings = st.stage = st.figures = st.splash = st.rest = true;
        continue;
      }
      if (!calm()) return;
      if (!st.paintings) {
        await preloadBattle(chapter, 1); // the paintings, every phase (phases 4 and 5 wait for a chosen card otherwise)
        st.paintings = true;
        note(`${id}: paintings`);
        await idle();
      } else if (!st.stage) {
        st.stage = true;
        if (!hasPrebuilt(chapter.sceneKey)) {
          await buildStage(app, chapter, idle, light);
          note(`${id}: stage built, compiled and drawn offscreen`);
          await idle();
        }
      } else if (!st.figures) {
        let plan = plans.get(id);
        if (!plan) plans.set(id, (plan = newPrebuildPlan(app, chapter, calm, idle, (what) => note(what), () => warmSplashCrops(chapter, calm))));
        if (!(await plan.step())) st.figures = true;
        await idle(20);
      } else if (!st.splash) {
        st.splash = true;
        if (!light && (await warmSplashCrops(chapter, calm))) note(`${id}: splash crops`); // the portraits' crops the first splash would make in the fight (a getImageData and a toBlob of 0.1 s)
      } else {
        if (!(await plans.get(id)?.stepRest())) st.rest = true; // the figures' other poses, one painting a step, after every fight's essentials
        await idle(20);
      }
    }
    if (light) return;
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
async function buildStage(app: WarmApp, chapter: Chapter, pause: (ms?: number) => Promise<void>, light = false): Promise<void> {
  const scene = await prebuildScene(chapter.sceneKey, app.renderer.camera);
  await pause(20); // a task boundary after the scene's 0.1 s of layer canvases, with a look at the pad
  scene.hideOwnActors();
  patchSideFogIn(scene.scene); // as `BattleScreen.enter` does before it compiles: the patched plates are other programs than the plain ones
  applyChapterLook(chapter.id, visualStyleOf(readSetting('visualStyle'))); // the look's passes join the post chain now (a battle that starts takes the same look, for the same chapter)
  (app.renderer as { prepareLook?: () => void }).prepareLook?.();
  await pause(20);
  // The depth plates' CPU half (0.65 s in one task right after the press, round 28) is cut while the GPU process compiles; the battle's own build takes the cut (`DepthPlates.precutPlates`).
  const cutting = warmLivingPlates({ key: scene.key, scene: scene.scene, renderer: (app.renderer as { renderer?: WebGLRenderer }).renderer }).catch(() => false);
  await warmShaders(app.renderer, scene.scene); // the programs build in the GPU process while the page runs
  if (await cutting) note(`${chapter.id}: depth plates cut ahead`);
  if (light) return;
  await pause(20);
  await drawSlicedOffscreen(app.renderer, scene.scene); // the GPU executables and the textures, one program family a frame
}

/**
 * The splash crops of the fight's figures, made behind the picker (r63-play, the overnight fix of the skeptic's M1; both games). `prepareMixSplash` is what the battle calls for every staged figure the moment it
 * starts: each crop is a `getImageData` and a `toBlob` of 0.05 to 0.12 s (seen as a 150 ms frame 1.2 s into Chapter I and under Chapter IV's swirl). It is the same call with the same art, made earlier, one figure at a
 * time; the crops are kept for the battle (`releaseMixSplash` forgets them when it ends). Nothing is made when the splash art is switched off.
 */
async function warmSplashCrops(chapter: Chapter, calm: () => boolean): Promise<boolean> {
  const info = battleCardInfo(chapter.id);
  if (!info || (chapter.game !== 'ffx' && chapter.game !== 'ffx2')) return false;
  for (const art of new Set([info.artKey, ...info.party.map((m) => m.artId)])) {
    if (!calm()) return false;
    prepareMixSplash(art, chapter.game);
    await idle(140);
  }
  return true;
}

/** Forget everything (tests only). */
export function resetDemoWarm(): void {
  running = null;
  stopped = false;
  focusId = null;
  log.length = 0;
}
