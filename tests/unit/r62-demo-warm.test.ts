// @vitest-environment jsdom
/**
 * RELEASE 62, PR-0481 (the conference demo; both games), part 2 of 2: the warm itself and its wiring (the scene store and the offscreen slices are `r62-demo-warm-stage.test.ts`).
 *
 * Round 28 timed the picker's A press to the first command at 12 to 14 s with frames of 0.8 to 1.5 s. About 3.4 s of that is the battle LOADING (the paintings' per-pose work that waited for a
 * chosen card, `loadScene`'s 0.8 s task, the diorama's programs on the first draw, the textures' first upload). `app/demo/demoWarm.ts` pays them behind the title and the picker, one fight after the
 * other; `scenes/prebuilt.ts` hands the scene it built to the battle; `drawSlicedOffscreen` draws it into the composer's buffer, never the screen. This file pins:
 *
 *  3. the warm itself: both fights in order (paintings, then stage), only in demo mode, only behind the title and the picker, stoppable, restartable, no step after a fight is picked;
 *  4. the wiring: the page starts it in demo mode only, the picker re-starts it, the flow stops it, the battle takes its scene from the store.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera } from 'three';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');

const camera = new PerspectiveCamera();

// ---------------------------------------------------------------------------- 3. the warm

const calls: string[] = [];
const hold = new Set<string>();

vi.mock('../../src/app/screens/battlePreload.ts', () => ({
  preloadBattle: vi.fn(async (chapter: { id: string }) => {
    calls.push(`paintings ${chapter.id}`);
    return { chapterId: chapter.id, paintings: 3, portraits: 1, ms: 1 };
  }),
  battleCardInfo: vi.fn(() => undefined), // the card's boss and party come from the real preload; none here (the splash crops are `r63-fix-warm.test.ts`'s)
}));
vi.mock('../../src/app/screens/BattleScreenWarmup.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/app/screens/BattleScreenWarmup.ts')>();
  return {
    ...real,
    warmShaders: vi.fn(async (_r: unknown, scene: { key?: string }) => {
      calls.push(`compile ${scene.key}`);
      return { ms: 1, finished: true };
    }),
    drawSlicedOffscreen: vi.fn(async (_r: unknown, scene: { key?: string }) => {
      calls.push(`draw ${scene.key}`);
    }),
  };
});
vi.mock('../../src/engine/fx/b/LivingPaintings.ts', () => ({
  warmLivingPlates: vi.fn(async (a: { key: string }) => {
    calls.push(`plates ${a.key}`);
    return true;
  }),
}));
vi.mock('../../src/scenes/prebuilt.ts', () => ({
  hasPrebuilt: vi.fn((k: string) => hold.has(k)),
  prebuildScene: vi.fn(async (k: string) => {
    calls.push(`build ${k}`);
    hold.add(k);
    return { key: k, scene: { key: k }, hideOwnActors: () => calls.push(`hide ${k}`), dispose: () => undefined };
  }),
}));

import { setDemoMode } from '../../src/app/demoMode.ts';
import { demoWarmLog, demoWarmSwitchedOff, resetDemoWarm, stopDemoWarm, warmDemoFights } from '../../src/app/demo/demoWarm.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { battleScreenSource } from './helpers/battleScreenSource.ts';

const sceneOf = (id: string): string => CHAPTERS.find((c) => c.id === id)!.sceneKey;
const app = (name: string | null) => ({ renderer: { camera, prepareLook: () => calls.push('look') }, current: name ? { name } : null }) as never;

describe('the warm (app/demo/demoWarm.ts)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    calls.length = 0;
    hold.clear();
    resetDemoWarm();
    setDemoMode(true);
    window.history.replaceState(null, '', '/?prebuild=off'); // r64 (item 200b): the fight prebuild is the demo's default now (prebuild-figures.test.ts); this file pins the warm's own steps, which it adds one to
  });
  afterEach(() => {
    vi.useRealTimers();
    setDemoMode(null);
    window.history.replaceState(null, '', '/');
  });

  const run = async (a: unknown, fights?: readonly string[], opts?: { light?: boolean }) => {
    const p = warmDemoFights(a as never, fights, opts);
    await vi.advanceTimersByTimeAsync(5000);
    return p;
  };

  it('warms Chapter I (FFX) and then Chapter IV (FFX-2): the paintings, then the stage: built, hidden actors, look, compiled, drawn offscreen', async () => {
    await run(app('title'));
    const g = sceneOf('seymour-flux');
    const b = sceneOf('ffx2-bahamut');
    expect(calls).toEqual([`paintings seymour-flux`, `build ${g}`, `hide ${g}`, 'look', `plates ${g}`, `compile ${g}`, `draw ${g}`, `paintings ffx2-bahamut`, `build ${b}`, `hide ${b}`, 'look', `plates ${b}`, `compile ${b}`, `draw ${b}`]);
    expect(demoWarmLog().map((e) => e.what)).toEqual(['seymour-flux: paintings', 'seymour-flux: depth plates cut ahead', 'seymour-flux: stage built, compiled and drawn offscreen', 'ffx2-bahamut: paintings', 'ffx2-bahamut: depth plates cut ahead', 'ffx2-bahamut: stage built, compiled and drawn offscreen', 'breath rigs read ahead']); // perf-trim: the last step reads every cached painting's breathing field (nothing is cached in this test: the note alone)
  });

  it('R63: the fight the cursor rests on is warmed first, and a cursor that moves hands the warm over at the next step', async () => {
    const { noteDemoFocus } = await import('../../src/app/demo/demoWarm.ts');
    noteDemoFocus('ffx2-bahamut');
    await run(app('title'));
    expect(calls.slice(0, 2)).toEqual(['paintings ffx2-bahamut', `build ${sceneOf('ffx2-bahamut')}`]);
    expect(calls.indexOf('paintings seymour-flux')).toBeGreaterThan(calls.indexOf(`draw ${sceneOf('ffx2-bahamut')}`));
  });

  it("R63: the retry's warm behind a lost fight's card is light: the scene, its plates and the compile of its programs; no offscreen draw, no breath rigs", async () => {
    await run(app('pro-defeat'), ['ffx2-bahamut'], { light: true });
    const b = sceneOf('ffx2-bahamut');
    expect(calls).toEqual([`paintings ffx2-bahamut`, `build ${b}`, `hide ${b}`, 'look', `plates ${b}`, `compile ${b}`]);
    expect(demoWarmLog().map((e) => e.what)).toEqual(['ffx2-bahamut: paintings', 'ffx2-bahamut: depth plates cut ahead', 'ffx2-bahamut: stage built, compiled and drawn offscreen']);
  });

  it('the plates are cut while the programs compile, and a cut that fails does not stop the stage (the battle then cuts them itself, as before)', async () => {
    const living = await import('../../src/engine/fx/b/LivingPaintings.ts');
    vi.mocked(living.warmLivingPlates).mockRejectedValueOnce(new Error('depth map missing'));
    await run(app('title'), ['seymour-flux']);
    const g = sceneOf('seymour-flux');
    expect(calls).toEqual([`paintings seymour-flux`, `build ${g}`, `hide ${g}`, 'look', `compile ${g}`, `draw ${g}`]);
    expect(demoWarmLog().map((e) => e.what)).toEqual(['seymour-flux: paintings', 'seymour-flux: stage built, compiled and drawn offscreen', 'breath rigs read ahead']);
  });

  it('a room option B does not dress cuts nothing, and the stage is still built', async () => {
    const living = await import('../../src/engine/fx/b/LivingPaintings.ts');
    vi.mocked(living.warmLivingPlates).mockResolvedValueOnce(false);
    await run(app('title'), ['seymour-flux']);
    expect(demoWarmLog().map((e) => e.what)).toEqual(['seymour-flux: paintings', 'seymour-flux: stage built, compiled and drawn offscreen', 'breath rigs read ahead']);
  });

  it('works behind the picker too, and behind nothing else', async () => {
    await run(app('chapter-select'), ['seymour-flux']);
    expect(calls).toContain(`draw ${sceneOf('seymour-flux')}`);
    for (const screen of ['battle', 'results', 'cutscene', 'pause', null]) {
      calls.length = 0;
      resetDemoWarm();
      hold.clear();
      await run(app(screen as string | null));
      expect(calls, String(screen)).toEqual([]);
    }
  });

  it('does nothing outside demo mode, or with ?demowarm=off', async () => {
    setDemoMode(false);
    await run(app('title'));
    expect(calls).toEqual([]);
    setDemoMode(true);
    window.history.replaceState(null, '', '/?demo=1&demowarm=off');
    expect(demoWarmSwitchedOff()).toBe(true);
    await run(app('title'));
    expect(calls).toEqual([]);
    expect(demoWarmSwitchedOff('?demo=1')).toBe(false);
  });

  it('a stage that is already held is not built again (the picker after a fight builds only what the fight used up)', async () => {
    hold.add(sceneOf('seymour-flux'));
    await run(app('chapter-select'));
    expect(calls).not.toContain(`build ${sceneOf('seymour-flux')}`);
    expect(calls).toContain(`paintings seymour-flux`); // the paintings are asked for again: a finished run is cheap, and an unfinished one is joined
    expect(calls).toContain(`build ${sceneOf('ffx2-bahamut')}`);
  });

  it('takes no further step once a fight is picked, and starts afresh on the next call', async () => {
    const a = app('chapter-select');
    const first = warmDemoFights(a as never);
    await vi.advanceTimersByTimeAsync(10);
    stopDemoWarm(); // runChapter: the fight picked has the main thread
    await vi.advanceTimersByTimeAsync(5000);
    await first;
    const afterStop = calls.length;
    expect(calls.filter((c) => c.startsWith('draw')).length).toBeLessThan(2); // the second fight's stage was not built
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls.length).toBe(afterStop);
    // back at the picker: the next call picks up what is missing
    const again = warmDemoFights(a as never);
    await vi.advanceTimersByTimeAsync(5000);
    await again;
    expect(calls).toContain(`draw ${sceneOf('ffx2-bahamut')}`);
  });

  it('stops at the next step when the screen changes under it (the visitor pressed A)', async () => {
    const screen = { name: 'chapter-select' };
    const a = { renderer: { camera }, current: screen } as never;
    const p = warmDemoFights(a);
    await vi.advanceTimersByTimeAsync(10);
    screen.name = 'battle';
    await vi.advanceTimersByTimeAsync(5000);
    await p;
    expect(calls.filter((c) => c.startsWith('build')).length).toBeLessThanOrEqual(1);
    expect(calls).not.toContain(`paintings ffx2-bahamut`);
  });

  it('a second call while a run is going joins it', async () => {
    const a = app('title');
    const p1 = warmDemoFights(a as never);
    const p2 = warmDemoFights(a as never);
    expect(p2).toBe(p1);
    await vi.advanceTimersByTimeAsync(5000);
    await p1;
    expect(calls.filter((c) => c === `build ${sceneOf('seymour-flux')}`)).toHaveLength(1);
  });

  it('never rejects: a stage that cannot be built ends the run quietly', async () => {
    const prebuilt = await import('../../src/scenes/prebuilt.ts');
    vi.mocked(prebuilt.prebuildScene).mockRejectedValueOnce(new Error('texture lost'));
    await expect(run(app('title'))).resolves.toBeUndefined();
    expect(demoWarmLog().some((e) => e.what.startsWith('stopped'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------- 4. the wiring

describe('the wiring', () => {
  it('the page starts the warm in demo mode only, a moment after the title is up', () => {
    const main = src('src/main.ts');
    expect(main).toMatch(/if \(demoModeOn\(\)\) setTimeout\(\(\) => void warmDemoFights\(app\), WARM_FIGHTS_AT_MS\)/);
    expect(main).toMatch(/if \(demoModeOn\(\)\) setTimeout\(warmBattleStage, WARM_STAGE_AT_MS\)/);
  });

  it('R63: the warm starts well before a player at a human pace can have chosen a fight, the once-per-page costs first and clear of each other', async () => {
    const { WARM_FIGHTS_AT_MS, WARM_STAGE_AT_MS } = await import('../../src/app/demo/demoWarm.ts');
    expect(WARM_STAGE_AT_MS).toBeLessThan(WARM_FIGHTS_AT_MS);
    expect(WARM_FIGHTS_AT_MS - WARM_STAGE_AT_MS).toBeGreaterThanOrEqual(800);
    expect(WARM_FIGHTS_AT_MS).toBeLessThanOrEqual(2000); // release 62's 6000 ms left both stages unbuilt at a press 6 to 7 s after the load
  });

  it('the picker starts it again a moment after it has painted, and drops the timer on the way out', () => {
    const board = src('src/app/demo/demoBoard.ts');
    expect(board).toContain('this.warmTimer = setTimeout(() => void warmDemoFights(this.app), WARM_AFTER_MS)');
    expect(board).toMatch(/override exit\(\): void \{\n\s+if \(this\.warmTimer !== null\) clearTimeout\(this\.warmTimer\)/);
  });

  it('the plates are cut from inside the stage step, before the programs are asked for, with the renderer the battle composes them on', () => {
    const warm = src('src/app/demo/demoWarm.ts');
    expect(warm).toContain('warmLivingPlates({ key: scene.key, scene: scene.scene, renderer:');
    expect(warm.indexOf('warmLivingPlates(')).toBeLessThan(warm.indexOf('await warmShaders('));
    const battle = battleScreenSource();
    expect(battle).toContain('renderer: this.app.renderer.renderer }); // eye-candy option B'); // the same renderer
  });

  it('the flow stops it when a run starts, before the run\'s own warm-ups; the battle takes its scene from the store', () => {
    const flow = src('src/app/screens/BattleScreenFlow.ts');
    expect(flow.indexOf('stopDemoWarm(id);')).toBeGreaterThan(0); // post-fight-start: it names the fight it starts, so the other fight's stage step in flight lets go
    expect(flow.indexOf('stopDemoWarm(id);')).toBeLessThan(flow.indexOf('warmBattleStage();'));
    const battle = battleScreenSource();
    expect(battle).toContain('await takeScene(chapter.sceneKey, this.app.renderer.camera)');
    expect(battle).not.toContain('await loadScene(chapter.sceneKey');
  });
});
