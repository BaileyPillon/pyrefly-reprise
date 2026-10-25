// @vitest-environment jsdom
/**
 * LANE "PREBUILD" (2026-10-24; both games): the order of the demo warm with the fight prebuild on. The figures of a fight are an extra step after its stage (`prebuildFigures.ts`), split into the
 * essentials (the room's light, the figures, their idle paintings, their programs, the looks' reads, the splash crops) and the rest (the other poses). Measured with the second fight picked: the first
 * fight's other poses took seconds that the second fight's stage was waiting for, so every fight's essentials come before any fight's other poses. With the prebuild off the warm is r63-play's, step for step.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera } from 'three';

const camera = new PerspectiveCamera();
const calls: string[] = [];
const hold = new Set<string>();
let prebuildIsOn = true;

vi.mock('../../src/app/screens/battlePreload.ts', () => ({
  preloadBattle: vi.fn(async (chapter: { id: string }) => {
    calls.push(`paintings ${chapter.id}`);
    return { chapterId: chapter.id, paintings: 3, portraits: 1, ms: 1 };
  }),
  battleCardInfo: vi.fn(() => undefined),
}));
vi.mock('../../src/app/screens/BattleScreenWarmup.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/app/screens/BattleScreenWarmup.ts')>();
  return {
    ...real,
    warmShaders: vi.fn(async () => ({ ms: 1, finished: true })),
    drawSlicedOffscreen: vi.fn(async () => undefined),
  };
});
vi.mock('../../src/engine/fx/b/LivingPaintings.ts', () => ({ warmLivingPlates: vi.fn(async () => true) }));
vi.mock('../../src/scenes/prebuilt.ts', () => ({
  hasPrebuilt: vi.fn((k: string) => hold.has(k)),
  prebuildScene: vi.fn(async (k: string) => {
    hold.add(k);
    return { key: k, scene: { key: k }, hideOwnActors: () => undefined, dispose: () => undefined };
  }),
}));
vi.mock('../../src/app/demo/prebuildSwitch.ts', () => ({ prebuildOn: () => prebuildIsOn }));
vi.mock('../../src/app/demo/prebuildFigures.ts', () => ({
  newPrebuildPlan: vi.fn((_app: unknown, chapter: { id: string }) => {
    let essential = 2;
    let rest = 2;
    return {
      stats: {},
      step: async () => {
        calls.push(`essential ${chapter.id}`);
        return --essential > 0;
      },
      stepRest: async () => {
        calls.push(`rest ${chapter.id}`);
        return --rest > 0;
      },
    };
  }),
}));

import { setDemoMode } from '../../src/app/demoMode.ts';
import { noteDemoFocus, resetDemoWarm, warmDemoFights } from '../../src/app/demo/demoWarm.ts';

const app = (name: string | null) => ({ renderer: { camera, prepareLook: () => undefined }, current: name ? { name } : null }) as never;
const run = async (a: unknown, fights?: readonly string[], opts?: { light?: boolean }) => {
  const p = warmDemoFights(a as never, fights, opts);
  await vi.advanceTimersByTimeAsync(8000);
  return p;
};
const steps = (): string[] => calls.filter((c) => /^(essential|rest|paintings) /.test(c));

describe('the warm with the fight prebuild on', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    calls.length = 0;
    hold.clear();
    resetDemoWarm();
    setDemoMode(true);
    prebuildIsOn = true;
  });
  afterEach(() => {
    vi.useRealTimers();
    setDemoMode(null);
    window.history.replaceState(null, '', '/');
  });

  it('does every fight\'s essentials before any fight\'s other poses, the first fight first', async () => {
    await run(app('title'));
    expect(steps()).toEqual([
      'paintings seymour-flux', 'essential seymour-flux', 'essential seymour-flux',
      'paintings ffx2-bahamut', 'essential ffx2-bahamut', 'essential ffx2-bahamut',
      'rest seymour-flux', 'rest seymour-flux', 'rest ffx2-bahamut', 'rest ffx2-bahamut',
    ]);
  });

  it('with the cursor on the second fight, its essentials go first and its other poses come first too', async () => {
    noteDemoFocus('ffx2-bahamut');
    await run(app('title'));
    const s = steps();
    expect(s.slice(0, 3)).toEqual(['paintings ffx2-bahamut', 'essential ffx2-bahamut', 'essential ffx2-bahamut']);
    expect(s.indexOf('essential seymour-flux')).toBeLessThan(s.indexOf('rest ffx2-bahamut'));
    expect(s.indexOf('rest ffx2-bahamut')).toBeLessThan(s.indexOf('rest seymour-flux'));
  });

  it('stops at the next step when the screen changes under it, and never starts a step on a fight screen', async () => {
    const a = { renderer: { camera, prepareLook: () => undefined }, current: { name: 'title' as string } };
    const p = warmDemoFights(a as never);
    await vi.advanceTimersByTimeAsync(300);
    a.current.name = 'party-prep';
    await vi.advanceTimersByTimeAsync(8000);
    await p;
    const n = steps().length;
    expect(n).toBeLessThan(10);
    await vi.advanceTimersByTimeAsync(5000);
    expect(steps().length).toBe(n);
  });

  it('is r63-play\'s warm, step for step, with the prebuild off or for the light retry warm', async () => {
    prebuildIsOn = false;
    await run(app('title'));
    expect(steps()).toEqual(['paintings seymour-flux', 'paintings ffx2-bahamut']);
    calls.length = 0;
    hold.clear();
    resetDemoWarm();
    await run(app('pro-defeat'), ['ffx2-bahamut'], { light: true });
    expect(steps()).toEqual(['paintings ffx2-bahamut']); // the prebuild off: the light warm is r63-play's, the stage alone
  });

  it('r64-fixes: the light retry warm behind a lost fight\'s card builds the figures too (their paintings went up again under the retry\'s first seconds), the essentials before the other poses', async () => {
    prebuildIsOn = true;
    await run(app('pro-defeat'), ['ffx2-bahamut'], { light: true });
    const s = steps();
    expect(s.slice(0, 3)).toEqual(['paintings ffx2-bahamut', 'essential ffx2-bahamut', 'essential ffx2-bahamut']);
    expect(s.filter((x) => x.startsWith('rest')).length).toBeGreaterThan(0);
    expect(s.indexOf('rest ffx2-bahamut')).toBeGreaterThan(s.lastIndexOf('essential ffx2-bahamut'));
  });
});
