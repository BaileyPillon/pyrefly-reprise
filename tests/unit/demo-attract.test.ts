// @vitest-environment jsdom
/**
 * THE ATTRACT LOOP (release 61, the conference demo; Bailey, 2026-10-21, decision 169n; demo mode only; `src/app/demo/demoAttract.ts`, `demoIdle.ts`, `demoTitle.ts`; Seymour Flux is Chapter I, FFX, Bahamut is
 * Chapter IV, FFX-2).
 *
 * Claims:
 *  1. Idle is idle: 60 s of nothing starts it; any key, click, touch, wheel, real mouse movement or pad button is someone, and a mouse resting on the table is no one.
 *  2. The reel is Seymour then Bahamut on the demo seeds, round and round; nothing on the way writes the save, counts a run, or reaches the fight as input; any wake ends it at once, the music comes back to its
 *     setting and the title is shown again; an error or a loop of instant failures ends it the same way.
 *  3. Outside demo mode the title starts nothing.
 * The segments themselves (a real `BattleScreen` on a real GPU) are proved in the browser check (`docs/handoff/r61-flow.md`); here a stand-in screen takes their place.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdleClock, POINTER_ACTIVE_PX, STICK_ACTIVE, ATTRACT_AFTER_MS, padActive, watchActivity } from '../../src/app/demo/demoIdle.ts';
import { AttractBattle, AttractWake, MAX_SHORT_RUN, anyPress, attractPlan, attractRunning, runAttract, ATTRACT_MUSIC, type AttractSegment } from '../../src/app/demo/demoAttract.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { demoSeedAt, setDemoMode } from '../../src/app/demoMode.ts';
import { audio } from '../../src/audio/index.ts';
import type { InputSnapshot } from '../../src/app/Input.ts';

afterEach(() => {
  setDemoMode(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('the idle clock', () => {
  it('counts from the last thing that happened', () => {
    const c = new IdleClock(1000);
    expect(c.idleMs(1000)).toBe(0);
    expect(c.expired(1000 + ATTRACT_AFTER_MS - 1)).toBe(false);
    expect(c.expired(1000 + ATTRACT_AFTER_MS)).toBe(true);
    c.touch(50_000);
    expect(c.expired(50_000 + ATTRACT_AFTER_MS - 1)).toBe(false);
    expect(c.idleMs(40_000)).toBe(0); // never negative
    expect(ATTRACT_AFTER_MS).toBe(60_000);
  });
});

describe('who counts as someone', () => {
  const pad = (down: number[] = [], axes: number[] = [0, 0, 0, 0]): { connected: boolean; buttons: Array<{ pressed: boolean }>; axes: number[] } => ({ connected: true, buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i) })), axes });

  it('a pad button, or a stick pushed, is a person; a pad at rest and stick drift are not', () => {
    expect(padActive([pad([0])])).toBe(true);
    expect(padActive([pad([9])])).toBe(true);
    expect(padActive([pad([], [STICK_ACTIVE, 0, 0, 0])])).toBe(true);
    expect(padActive([pad([], [0, -0.8, 0, 0])])).toBe(true);
    expect(padActive([pad([], [0.12, -0.08, 0.03, 0.2])])).toBe(false);
    expect(padActive([pad()])).toBe(false);
    expect(padActive([null])).toBe(false);
    expect(padActive(null)).toBe(false);
  });

  it('a key, a press, a touch and the wheel are people; a mouse that barely moves is not; one that really moves is', () => {
    let n = 0;
    const stop = watchActivity(() => n++, window);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    window.dispatchEvent(new Event('pointerdown'));
    window.dispatchEvent(new Event('touchstart'));
    window.dispatchEvent(new Event('wheel'));
    expect(n).toBe(4);
    const move = (x: number, y: number): void => {
      const e = new Event('pointermove') as Event & { clientX: number; clientY: number };
      e.clientX = x;
      e.clientY = y;
      window.dispatchEvent(e);
    };
    move(100, 100);
    move(101, 102);
    move(99, 101);
    expect(n).toBe(4);
    move(100 + POINTER_ACTIVE_PX, 100);
    expect(n).toBe(5);
    stop();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    expect(n).toBe(5);
  });
});

describe('what wakes the reel', () => {
  it('any press in the input snapshot', () => {
    const snap = (down: string[], actions: string[] = []): Pick<InputSnapshot, 'justPressed' | 'actions'> => ({ justPressed: (b) => down.includes(b), actions });
    expect(anyPress(snap([]))).toBe(false);
    expect(anyPress(snap(['confirm']))).toBe(true);
    expect(anyPress(snap(['left']))).toBe(true);
    expect(anyPress(snap([], ['fe-card-1']))).toBe(true);
  });

  it('keys, pointer presses, the wheel and the pads, once; the press is not passed on', async () => {
    const wake = new AttractWake();
    let pads: Array<ReturnType<typeof fakePad> | null> = [null];
    function fakePad(down: number[]): { connected: boolean; buttons: Array<{ pressed: boolean }>; axes: number[] } {
      return { connected: true, buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i) })), axes: [0, 0, 0, 0] };
    }
    vi.useFakeTimers();
    wake.arm(window, () => pads as never);
    expect(wake.isWoken).toBe(false);
    pads = [fakePad([])];
    vi.advanceTimersByTime(500);
    expect(wake.isWoken).toBe(false);
    pads = [fakePad([1])];
    vi.advanceTimersByTime(150);
    expect(wake.isWoken).toBe(true);
    await wake.woken;
    wake.release();

    const wake2 = new AttractWake();
    wake2.arm(window);
    let reached = false;
    window.addEventListener('keydown', () => (reached = true)); // the title's own listener, bubble phase
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    expect(wake2.isWoken).toBe(true);
    expect(reached).toBe(false);
    wake2.release();
  });
});

describe('the plan', () => {
  it('is Seymour Flux (FFX) then Bahamut (FFX-2) on the demo seeds, at normal speed', () => {
    const plan = attractPlan();
    expect(plan.map((s) => s.chapterId)).toEqual(['seymour-flux', 'ffx2-bahamut']);
    expect(plan.map((s) => s.seed)).toEqual([demoSeedAt('seymour-flux', 0), demoSeedAt('ffx2-bahamut', 0)]);
    expect(plan.map((s) => s.seed)).toEqual([7, 56]);
    for (const s of plan) {
      expect(s.speed).toBe('normal');
      expect(s.maxMs).toBeGreaterThanOrEqual(30_000);
      expect(s.maxMs).toBeLessThanOrEqual(90_000);
    }
  });

  it('Seymour is 40 seconds at normal speed and nothing else; Bahamut skips to the count, runs it fast, and ends 7 seconds after the Mega Flare starts', () => {
    const [seymour, bahamut] = attractPlan();
    expect(seymour!.maxMs).toBe(40_000);
    expect(seymour!.phases).toBeUndefined();
    expect(seymour!.endAfter).toBeUndefined();
    expect(bahamut!.phases!.map((p) => [p.speed, p.afterMs])).toEqual([['skip', 12_000], ['fast', 0]]);
    expect(bahamut!.maxMs).toBe(80_000);
    expect(bahamut!.endAfter).toEqual({ abilityId: 'mega-flare', afterMs: 7_000 });
  });
});

describe('the pacing of a segment (the reel only watches the engine)', () => {
  type Pace = { visibleMs: number; engine: unknown; presenter: unknown; pace(): void; highlightDone: Promise<void> };
  function rig(segment: AttractSegment): { screen: Pace; speeds: string[]; flags: Record<string, number>; log: Array<{ type: string; abilityId?: string }>; setSpeed: (s: string) => void } {
    const chapter = getChapter(segment.chapterId)!;
    const screen = new AttractBattle(chapter, segment, new AttractWake()) as unknown as Pace;
    const speeds: string[] = [];
    const flags: Record<string, number> = {};
    const log: Array<{ type: string; abilityId?: string }> = [];
    let current = 'normal';
    screen.engine = { state: () => ({ flags, log }) };
    screen.presenter = {
      get playbackSpeed() {
        return current;
      },
      setSpeed: (sp: string) => {
        current = sp;
        speeds.push(sp);
      },
    };
    return { screen, speeds, flags, log, setSpeed: (sp) => (current = sp) };
  }
  const bahamut = (): AttractSegment => attractPlan()[1]!;

  it('Bahamut: normal for 12 seconds, skip until the count opens (the flag leaves 0), fast until the cast (the flag is 1), then normal for good', () => {
    const { screen, speeds, flags } = rig(bahamut());
    screen.visibleMs = 5000;
    screen.pace();
    expect(speeds).toEqual([]); // the opening plays at normal speed: nothing to set
    screen.visibleMs = 12_000;
    screen.pace();
    expect(speeds).toEqual(['skip']);
    flags['bahamutCountdown'] = 0; // the window is out: the flag reads 0 until the count opens
    screen.visibleMs = 20_000;
    screen.pace();
    screen.pace();
    expect(speeds).toEqual(['skip']); // one change, not one per frame
    flags['bahamutCountdown'] = 5; // the count opens: the jump ends on that frame
    screen.visibleMs = 22_000;
    screen.pace();
    expect(speeds).toEqual(['skip', 'fast']);
    flags['bahamutCountdown'] = 3;
    screen.visibleMs = 40_000;
    screen.pace();
    expect(speeds).toEqual(['skip', 'fast']);
    flags['bahamutCountdown'] = 1; // the cast
    screen.visibleMs = 50_000;
    screen.pace();
    expect(speeds).toEqual(['skip', 'fast', 'normal']);
    flags['bahamutCountdown'] = 0; // the next cycle's reset must not send it back
    screen.visibleMs = 70_000;
    screen.pace();
    expect(speeds).toEqual(['skip', 'fast', 'normal']);
  });

  it('the jump does not start before 12 seconds, whatever the flag says', () => {
    const { screen, speeds, flags } = rig(bahamut());
    flags['bahamutCountdown'] = 0;
    screen.visibleMs = 11_999;
    screen.pace();
    expect(speeds).toEqual([]);
  });

  it('the highlight ends 7 seconds after the Mega Flare starts, and not before', async () => {
    const { screen, log, flags } = rig(bahamut());
    let done = false;
    void screen.highlightDone.then(() => (done = true));
    flags['bahamutCountdown'] = 3;
    log.push({ type: 'action-start', abilityId: 'attack' }, { type: 'action-start', abilityId: 'impulse' });
    screen.visibleMs = 20_000;
    screen.pace();
    await Promise.resolve();
    expect(done).toBe(false); // other actions do not count
    log.push({ type: 'action-start', abilityId: 'mega-flare' });
    screen.visibleMs = 30_000;
    screen.pace();
    screen.visibleMs = 36_900;
    screen.pace();
    await Promise.resolve();
    expect(done).toBe(false);
    screen.visibleMs = 37_000;
    screen.pace();
    await Promise.resolve();
    expect(done).toBe(true);
  });

  it('Seymour is never touched: the speed is not set and the highlight never ends by itself', async () => {
    const { screen, speeds } = rig(attractPlan()[0]!);
    let done = false;
    void screen.highlightDone.then(() => (done = true));
    for (const t of [1000, 15_000, 39_000, 90_000]) {
      screen.visibleMs = t;
      screen.pace();
    }
    await Promise.resolve();
    expect(speeds).toEqual([]);
    expect(done).toBe(false);
  });
});

// ------------------------------------------------------------ the loop, with stand-in screens

interface Fake {
  calls: string[];
  app: never;
  volumes: number[];
  saveWrites: string[];
}

function fakeApp(): Fake {
  const calls: string[] = [];
  const volumes: number[] = [];
  const saveWrites: string[] = [];
  // a save that records any write at all: the loop may read settings and nothing else
  const save = new Proxy(
    { settings: { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.35 } } as Record<string, unknown>,
    {
      get: (t, k) => (k in t ? t[k as string] : (...a: unknown[]) => void saveWrites.push(`${String(k)}(${a.join(',')})`)),
    },
  );
  const app = {
    save,
    fade: (to: string, ms: number) => (calls.push(`fade:${to}:${ms}`), Promise.resolve()),
    replace: async (s: { name?: string }) => void calls.push(`replace:${s.name ?? '?'}`),
    goto: async (name: string) => void calls.push(`goto:${name}`),
  };
  vi.spyOn(audio, 'setMusicVolume').mockImplementation((v: number) => void volumes.push(v));
  vi.spyOn(audio, 'applySettings').mockImplementation(() => void calls.push('applySettings'));
  return { calls, app: app as never, volumes, saveWrites };
}

function standIn(lifeMs: number, log: string[], woken?: () => void): (chapter: { id: string }, seg: AttractSegment, wake: AttractWake) => never {
  return ((chapter: { id: string }, seg: AttractSegment, wake: AttractWake) => {
    log.push(`make:${chapter.id}:${seg.seed}`);
    void wake;
    woken?.();
    return { name: `stand-in-${chapter.id}`, finished: new Promise<void>((r) => window.setTimeout(r, lifeMs)) };
  }) as never;
}

describe('the reel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('plays Seymour, then Bahamut, then Seymour again; a wake ends it with the title, the music restored, and no save touched', async () => {
    const f = fakeApp();
    const made: string[] = [];
    const wake = new AttractWake();
    const done = runAttract(f.app, attractPlan(), wake, standIn(10 * 60_000, made));
    await vi.advanceTimersByTimeAsync(1000);
    expect(attractRunning()).toBe(true);
    expect(made).toEqual(['make:seymour-flux:7']);
    await vi.advanceTimersByTimeAsync(41_000); // the Seymour segment's cap
    await vi.advanceTimersByTimeAsync(2000);
    expect(made).toEqual(['make:seymour-flux:7', 'make:ffx2-bahamut:56']);
    await vi.advanceTimersByTimeAsync(111_000); // the Bahamut segment's cap
    await vi.advanceTimersByTimeAsync(2000);
    expect(made).toEqual(['make:seymour-flux:7', 'make:ffx2-bahamut:56', 'make:seymour-flux:7']);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await vi.advanceTimersByTimeAsync(2000);
    const report = await done;
    expect(report.woken).toBe(true);
    expect(report.error).toBeNull();
    expect(report.segments).toBe(3);
    expect(f.calls[f.calls.length - 1]).toBe('goto:title');
    expect(f.calls.filter((c) => c === 'goto:title').length).toBe(1);
    expect(f.calls.indexOf('applySettings')).toBeLessThan(f.calls.indexOf('goto:title'));
    expect(f.volumes).toEqual([0.7 * ATTRACT_MUSIC]);
    expect(f.saveWrites).toEqual([]);
    expect(attractRunning()).toBe(false);
  });

  it('never goes through the chapter flow: it makes screens and swaps them, nothing else', async () => {
    const f = fakeApp();
    const wake = new AttractWake();
    const done = runAttract(f.app, attractPlan(), wake, standIn(10 * 60_000, []));
    await vi.advanceTimersByTimeAsync(2000);
    wake.wake();
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect(f.calls.filter((c) => !c.startsWith('fade:'))).toEqual(['replace:stand-in-seymour-flux', 'applySettings', 'goto:title']);
    expect(f.saveWrites).toEqual([]);
  });

  it('a wake while the first segment loads ends it before the next', async () => {
    const f = fakeApp();
    const wake = new AttractWake();
    const done = runAttract(f.app, attractPlan(), wake, standIn(10 * 60_000, [], () => wake.wake()));
    await vi.advanceTimersByTimeAsync(3000);
    const report = await done;
    expect(report.woken).toBe(true);
    expect(report.segments).toBeLessThanOrEqual(1);
    expect(f.calls[f.calls.length - 1]).toBe('goto:title');
  });

  it('a fight that ends at once, over and over, ends the loop instead of spinning', async () => {
    const f = fakeApp();
    const made: string[] = [];
    const done = runAttract(f.app, attractPlan(), new AttractWake(), standIn(100, made));
    await vi.advanceTimersByTimeAsync(10_000);
    const report = await done;
    expect(report.woken).toBe(false);
    expect(report.error).toMatch(/keep ending at once/);
    expect(made.length).toBe(MAX_SHORT_RUN);
    expect(f.calls[f.calls.length - 1]).toBe('goto:title');
  });

  it('a segment that cannot be built ends the loop and shows the title', async () => {
    const f = fakeApp();
    const done = runAttract(f.app, attractPlan(), new AttractWake(), (() => {
      throw new Error('painting missing');
    }) as never);
    await vi.advanceTimersByTimeAsync(2000);
    const report = await done;
    expect(report.error).toBe('painting missing');
    expect(f.calls[f.calls.length - 1]).toBe('goto:title');
    expect(f.volumes.length).toBe(1);
    expect(f.calls).toContain('applySettings');
  });

  it('a press while the first segment art is still loading is answered at once: the title never went', async () => {
    const f = fakeApp();
    const wake = new AttractWake();
    const asked: string[] = [];
    const done = runAttract(f.app, attractPlan(), wake, standIn(10 * 60_000, []), (chapter) => {
      asked.push(chapter.id);
      return new Promise(() => undefined); // never finishes loading
    });
    await vi.advanceTimersByTimeAsync(3000);
    expect(f.calls).toEqual([]); // nothing faded, nothing replaced: the title is still up
    wake.wake();
    await vi.advanceTimersByTimeAsync(10);
    const report = await done;
    expect(asked).toEqual(['seymour-flux']);
    expect(report).toMatchObject({ woken: true, left: false, segments: 0, error: null });
    expect(f.calls).toEqual(['applySettings']); // the music back, and no fade, no goto: the title stands
    expect(attractRunning()).toBe(false);
  });

  it('loads the first segment before it fades, and each next one behind the one that is playing', async () => {
    const f = fakeApp();
    const wake = new AttractWake();
    const events: string[] = [];
    const done = runAttract(
      f.app,
      attractPlan(),
      wake,
      ((chapter: { id: string }) => {
        events.push(`make:${chapter.id}`);
        return { name: 'x', finished: new Promise<void>((r) => window.setTimeout(r, 10 * 60_000)) };
      }) as never,
      (chapter) => {
        events.push(`preload:${chapter.id}`);
        return Promise.resolve();
      },
    );
    await vi.advanceTimersByTimeAsync(2000);
    wake.wake();
    await vi.advanceTimersByTimeAsync(2000);
    const report = await done;
    expect(report.left).toBe(true);
    expect(events).toEqual(['preload:seymour-flux', 'make:seymour-flux', 'preload:ffx2-bahamut']);
  });

  it('does not start a second reel while one runs', async () => {
    const f = fakeApp();
    const wake = new AttractWake();
    const first = runAttract(f.app, attractPlan(), wake, standIn(10 * 60_000, []));
    await vi.advanceTimersByTimeAsync(500);
    const second = await runAttract(f.app, attractPlan(), new AttractWake(), standIn(10 * 60_000, []));
    expect(second.segments).toBe(0);
    wake.wake();
    await vi.advanceTimersByTimeAsync(2000);
    await first;
  });
});
