/**
 * LANE "PREBUILD", REVIEW 2 FIX (2026-10-24; both games: Chapter I is FFX, Chapter IV is FFX-2; the conference demo only).
 *
 * THE RACE the light review proved (`review2/progress.md`: 5 of 13 timed Chapter IV presses, 2 of 6 in the first scan): the visitor presses A on the picker while a figure of that same fight is still being
 * built behind it. `BattleScreen.enter` names the chapter for the battle (`setCurvesChapter`), then the figure's build finishes and the prebuild "puts back" the chapter it had saved (nothing), because its
 * old guard asked only `demoChapter() === chapter.id`, which is true then too. The fight ran with the demo chapter unset: every new piece off, a cyan outline on Bahamut.
 *
 * This pins the pure form of it (no GPU, no scene): `withDemoChapter` keeps the chapter when a fight began during the work, restores it when none did, and `parkOrDispose` lets go of the rig
 * registry's entry for a figure that finished after the press.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/engine/rig/RigLoad.ts', async (orig) => {
  const real = await orig<typeof import('../../src/engine/rig/RigLoad.ts')>();
  return { ...real, unregisterRigUse: vi.fn(real.unregisterRigUse) };
});

const { withDemoChapter, parkOrDispose } = await import('../../src/app/demo/prebuildFigures.ts');
const { demoChapter, setDemoChapter, isDemoChapter } = await import('../../src/engine/motion/DemoGate.ts');
const { setCurvesChapter } = await import('../../src/engine/motion/CurvesSwitch.ts');
const rigLoad = await import('../../src/engine/rig/RigLoad.ts');
const cache = await import('../../src/engine/FigureCache.ts');

const CH4 = 'ffx2-bahamut';
const CH1 = 'seymour-flux';

/** A build that is "in flight": resolves when the test says so. */
function inFlight(): { work: () => Promise<string>; finish: () => void; started: Promise<void> } {
  let finish: () => void = () => undefined;
  let begun: () => void = () => undefined;
  const started = new Promise<void>((r) => (begun = r));
  const gate = new Promise<void>((r) => (finish = r));
  return {
    work: async () => {
      begun();
      await gate;
      return 'built';
    },
    finish,
    started,
  };
}

/** The warm's own `calm()`: true until a fight is picked (`stopDemoWarm` + the screen leaving the picker). */
function calmFlag(): { calm: () => boolean; press: () => void } {
  let calm = true;
  return { calm: () => calm, press: () => void (calm = false) };
}

const fig = (name: string): { built: { actor: never; rig: null }; disposed: string[] } => {
  const disposed: string[] = [];
  return { built: { actor: { name, dispose: () => void disposed.push(name) } as never, rig: null }, disposed };
};

beforeEach(() => {
  setDemoChapter(undefined);
  cache.dropParked();
  vi.mocked(rigLoad.unregisterRigUse).mockClear();
});

describe('withDemoChapter: the chapter survives a press that lands while a figure is being built', () => {
  it('THE RACE: the visitor enters the same chapter during the build; the battle keeps its chapter', async () => {
    const b = inFlight();
    const c = calmFlag();
    const run = withDemoChapter(CH4, c.calm, b.work);
    await b.started;
    expect(demoChapter()).toBe(CH4); // named for the figure's construction
    // the press: the flow stops the warm, then the battle screen names its chapter (the same one)
    c.press();
    setCurvesChapter(CH4);
    b.finish();
    await run;
    expect(demoChapter()).toBe(CH4); // before the fix: undefined (the saved "before" was put back over the battle's own)
    expect(isDemoChapter(demoChapter())).toBe(true); // the gate every new piece reads
  });

  it('the press has stopped the warm but the battle has not named its chapter yet: the chapter is left as it is', async () => {
    const b = inFlight();
    const c = calmFlag();
    const run = withDemoChapter(CH4, c.calm, b.work);
    await b.started;
    c.press();
    b.finish();
    await run;
    expect(demoChapter()).toBe(CH4);
  });

  it('a fight of the other chapter entered during the build keeps its own chapter', async () => {
    const b = inFlight();
    const c = calmFlag();
    const run = withDemoChapter(CH4, c.calm, b.work);
    await b.started;
    c.press();
    setCurvesChapter(CH1);
    b.finish();
    await run;
    expect(demoChapter()).toBe(CH1);
  });

  it('no press: the chapter that was there before comes back (nothing, or an earlier name)', async () => {
    const quiet = inFlight();
    const c = calmFlag();
    const first = withDemoChapter(CH4, c.calm, quiet.work);
    await quiet.started;
    expect(demoChapter()).toBe(CH4);
    quiet.finish();
    await first;
    expect(demoChapter()).toBeUndefined();

    setDemoChapter(CH1);
    const again = inFlight();
    const second = withDemoChapter(CH4, c.calm, again.work);
    await again.started;
    again.finish();
    await second;
    expect(demoChapter()).toBe(CH1);
  });

  it('a build that throws still puts the chapter back when no fight began, and still leaves it when one did', async () => {
    const c = calmFlag();
    await expect(withDemoChapter(CH4, c.calm, async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(demoChapter()).toBeUndefined();

    await expect(
      withDemoChapter(CH4, c.calm, async () => {
        c.press();
        setCurvesChapter(CH4);
        throw new Error('boom again');
      }),
    ).rejects.toThrow('boom again');
    expect(demoChapter()).toBe(CH4);
  });

  it('the chapter is named for the whole build (the figures read it as they are made)', async () => {
    const seen: Array<string | undefined> = [];
    await withDemoChapter(CH1, () => true, async () => {
      seen.push(demoChapter());
      await Promise.resolve();
      seen.push(demoChapter());
    });
    expect(seen).toEqual([CH1, CH1]);
  });
});

describe('parkOrDispose: a figure that finishes after the press', () => {
  it('is parked while the warm is calm, and the rig registry keeps its entry', () => {
    const f = fig('paine');
    expect(parkOrDispose('room', 'paine', 'fp', f.built, () => true)).toBe(true);
    expect(cache.hasParked('room', 'paine', 'fp')).toBe(true);
    expect(f.disposed).toEqual([]);
    expect(rigLoad.unregisterRigUse).not.toHaveBeenCalled();
  });

  it('is disposed, never parked, and its rig-use entry is released, when a fight was picked meanwhile', () => {
    const f = fig('paine');
    expect(parkOrDispose('room', 'paine', 'fp', f.built, () => false)).toBe(false);
    expect(cache.hasParked('room', 'paine')).toBe(false);
    expect(f.disposed).toEqual(['paine']);
    expect(rigLoad.unregisterRigUse).toHaveBeenCalledWith('paine');
  });

  it('still disposes the figure when the registry cannot release it', () => {
    vi.mocked(rigLoad.unregisterRigUse).mockImplementationOnce(() => {
      throw new Error('no rig registered');
    });
    const f = fig('rikku');
    expect(parkOrDispose('room', 'rikku', 'fp', f.built, () => false)).toBe(false);
    expect(f.disposed).toEqual(['rikku']);
  });
});
