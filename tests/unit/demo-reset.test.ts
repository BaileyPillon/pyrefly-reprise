// @vitest-environment jsdom
/**
 * THE RESET KEY (release 61, the conference demo; Bailey, 2026-10-21, decision 169c; demo mode only; `src/app/demo/demoReset.ts`).
 *
 * Claims:
 *  1. The hold is 1.5 s and only a hold: a tap, a brush, a stalled frame or letting go before the end fires nothing; holding past the end fires exactly once; letting go re-arms it.
 *  2. Select and Start together are the pad's input (either alone is not).
 *  3. A reset clears the visitor's run (the save's chapter records, flags, unlocks, onboarding memory; the demo's seed rotation; the board's memory) and, since release 62 (decision 173i), puts every setting
 *     back to the demo's defaults (volumes, the look, the title art, all of them); it keeps the switch that says demo mode is on.
 *  4. The sequence is: wipe, fade the sound, fade the picture, halt, reload, in that order.
 *  5. The ring shows nothing for a tap, fills while held and goes away; the wiring does nothing outside demo mode.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PAD_SELECT,
  PAD_START,
  RESET_HOLD_MS,
  RING_AFTER_MS,
  ResetController,
  ResetHold,
  ResetRing,
  clearVisitorState,
  installDemoReset,
  padResetHeld,
  performDemoReset,
  type ResetDeps,
} from '../../src/app/demo/demoReset.ts';
import { SaveStore, defaultSettings } from '../../src/app/SaveData.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { lastBoardChapter, rememberBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';

class MemStore {
  private m = new Map<string, string>();
  get length(): number {
    return this.m.size;
  }
  key(i: number): string | null {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string): string | null {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v);
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
}

afterEach(() => {
  setDemoMode(null);
  sessionStorage.clear();
  document.body.innerHTML = '';
});

describe('the hold timer', () => {
  it('fires after 1.5 s of a held input, once', () => {
    const h = new ResetHold();
    expect(RESET_HOLD_MS).toBe(1500);
    let fired = 0;
    let last = 0;
    for (let t = 0; t < 2400; t += 16) {
      const r = h.step(16, true);
      last = r.progress;
      if (r.fired) fired++;
    }
    expect(fired).toBe(1);
    expect(last).toBe(1);
  });

  it('does not fire for a tap, a brush, or any hold that is let go of before the end', () => {
    const h = new ResetHold();
    expect(h.step(16, true).fired).toBe(false); // a tap
    expect(h.step(16, false)).toEqual({ progress: 0, fired: false });
    for (let t = 0; t < 1450; t += 10) expect(h.step(10, true).fired).toBe(false); // 1.45 s: close, not there
    expect(h.step(10, false).progress).toBe(0); // let go: back to nothing
    for (let t = 0; t < 1450; t += 10) expect(h.step(10, true).fired).toBe(false); // and the count starts again from zero
  });

  it('lets go and holds again: it fires again', () => {
    const h = new ResetHold(100);
    expect(h.step(100, true).fired).toBe(true);
    expect(h.step(50, true).fired).toBe(false);
    h.step(10, false);
    expect(h.step(100, true).fired).toBe(true);
  });

  it('a stalled frame cannot turn a brush into a hold: one step adds 100 ms at most', () => {
    const h = new ResetHold();
    const r = h.step(60_000, true);
    expect(r.fired).toBe(false);
    expect(r.progress).toBeCloseTo(100 / 1500, 5);
  });
});

describe('the pad input', () => {
  const pad = (down: number[], connected = true): { connected: boolean; buttons: Array<{ pressed: boolean }> } => ({
    connected,
    buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i) })),
  });

  it('Select and Start together, and neither alone', () => {
    expect(padResetHeld([pad([PAD_SELECT, PAD_START])])).toBe(true);
    expect(padResetHeld([pad([PAD_SELECT])])).toBe(false);
    expect(padResetHeld([pad([PAD_START])])).toBe(false);
    expect(padResetHeld([pad([0, 1, 2, 3])])).toBe(false);
    expect(padResetHeld([null, pad([PAD_SELECT, PAD_START])])).toBe(true);
    expect(padResetHeld([pad([PAD_SELECT, PAD_START], false)])).toBe(false);
    expect(padResetHeld(null)).toBe(false);
  });
});

describe('clearing the visitor', () => {
  function playedStore(): { save: SaveStore; storage: MemStore } {
    const storage = new MemStore();
    const save = new SaveStore('test-save', storage);
    save.recordAttempt('seymour-flux');
    save.recordClear('seymour-flux', 95_000, 9);
    save.recordAttempt('ffx2-bahamut');
    save.unlock('some-entry');
    save.setFlag('seen-thing', true);
    save.markCoachSeen('briefing');
    save.setSettings({ titleArt: 'echo', musicVolume: 0.33, textSize: 1.15 });
    return { save, storage };
  }

  it('drops the run and puts the settings back to the demo defaults, the title-art pick, the volumes and the look among them (release 62, 173i)', () => {
    const { save, storage } = playedStore();
    save.setSettings({ visualStyle: 'classic', masterVolume: 0.2, sfxVolume: 0.9, voiceOn: false, titleArt: 'farplane', titleArtPicked: true });
    expect(save.settings.titleArt).toBe('farplane');
    expect(save.isCleared('seymour-flux')).toBe(true);
    clearVisitorState(save, null);
    expect(save.isCleared('seymour-flux')).toBe(false);
    expect(Object.keys(save.snapshot().chapters)).toEqual([]);
    expect(save.snapshot().unlocked).toEqual([]);
    expect(save.snapshot().flags).toEqual({});
    expect(save.seenCoach).toEqual([]);
    const d = defaultSettings();
    expect(save.settings.titleArt).toBe(d.titleArt);
    expect(save.settings.titleArt).toBe('echo'); // The Echo, release 61's default
    expect(save.settings.titleArtPicked).toBe(false);
    expect(save.settings.visualStyle).toBe('hd2d');
    expect(save.settings.musicVolume).toBeCloseTo(d.musicVolume, 5);
    expect(save.settings.masterVolume).toBeCloseTo(d.masterVolume, 5);
    expect(save.settings.sfxVolume).toBeCloseTo(d.sfxVolume, 5);
    expect(save.settings.voiceOn).toBe(true);
    expect(save.settings.textSize).toBeCloseTo(d.textSize, 5);
    // and what is on disk says the same (a reload reads it back)
    const reread = new SaveStore('test-save', storage);
    expect(Object.keys(reread.snapshot().chapters)).toEqual([]);
    expect(reread.settings.titleArt).toBe('echo');
    expect(reread.settings.visualStyle).toBe('hd2d');
    expect(reread.settings.musicVolume).toBeCloseTo(d.musicVolume, 5);
    expect(reread.settings.masterVolume).toBeCloseTo(d.masterVolume, 5);
  });

  it('every setting goes back, not only the ones named above: the whole settings object is the defaults again', () => {
    const { save } = playedStore();
    save.setSettings({ ffx2Atb: 'active', textSpeed: 2, reduceFlashes: true, lowEffects: true, chapterSelectMusic: 'c', voiceVolume: 0.1 });
    const before = save.snapshot().settings;
    expect(before).not.toEqual(defaultSettings());
    clearVisitorState(save, null);
    expect(save.snapshot().settings).toEqual(defaultSettings());
    expect(Object.keys(save.snapshot().settings).length).toBe(Object.keys(defaultSettings()).length);
  });

  it('the mixer is not touched by the wipe (the sound is fading and the page reloads: no burst at the booth); only the reload applies the defaults', () => {
    const { save } = playedStore();
    let applied = 0;
    const real = save.setSettings.bind(save);
    save.setSettings = (patch) => {
      applied += 1;
      real(patch);
    };
    clearVisitorState(save, null);
    expect(applied).toBe(0);
  });

  it("forgets the tab's seed rotation and the board's memory, and not the switch that says demo mode is on", () => {
    sessionStorage.setItem('pyrefly.demo', '1');
    sessionStorage.setItem('pyrefly.demo.runs.seymour-flux', '2');
    sessionStorage.setItem('pyrefly.demo.runs.ffx2-bahamut', '1');
    sessionStorage.setItem('pyrefly.demo.won', 'seymour-flux');
    sessionStorage.setItem('unrelated', 'x');
    rememberBoardChapter('ffx2-bahamut');
    expect(lastBoardChapter()).toBe('ffx2-bahamut');
    clearVisitorState(null, sessionStorage);
    expect(sessionStorage.getItem('pyrefly.demo')).toBe('1');
    expect(sessionStorage.getItem('pyrefly.demo.runs.seymour-flux')).toBeNull();
    expect(sessionStorage.getItem('pyrefly.demo.runs.ffx2-bahamut')).toBeNull();
    expect(sessionStorage.getItem('pyrefly.demo.won')).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('x');
    expect(lastBoardChapter()).toBeNull();
  });

  it('a store that throws is a store with nothing to clear', () => {
    const broken = {
      get length(): number {
        throw new Error('blocked');
      },
      key: () => null,
      removeItem: () => undefined,
    };
    expect(() => clearVisitorState(null, broken)).not.toThrow();
  });
});

describe('the reset sequence', () => {
  it('wipes, fades the sound, fades the picture, halts, reloads: in that order, and only then', async () => {
    const calls: string[] = [];
    const save = { reset: vi.fn(() => calls.push('reset')) };
    const deps: ResetDeps = {
      save: save as unknown as ResetDeps['save'],
      tab: null,
      fadeAudio: () => calls.push('audio'),
      fadeScreen: async () => {
        calls.push('screen');
      },
      halt: () => calls.push('halt'),
      reload: () => calls.push('reload'),
    };
    await performDemoReset(deps);
    expect(calls).toEqual(['reset', 'audio', 'screen', 'halt', 'reload']);
  });
});

describe('the controller and the ring', () => {
  function rig(): { clock: { t: number }; held: { key: boolean; pad: boolean }; fired: number[]; ring: number[]; controller: ResetController } {
    const clock = { t: 0 };
    const held = { key: false, pad: false };
    const fired: number[] = [];
    const ring: number[] = [];
    const controller = new ResetController({ now: () => clock.t, keyHeld: () => held.key, padHeld: () => held.pad }, { set: (p: number) => ring.push(p) }, () => fired.push(clock.t));
    return { clock, held, fired, ring, controller };
  }
  const run = (r: ReturnType<typeof rig>, ms: number, step = 16): void => {
    for (let i = 0; i < ms / step; i++) {
      r.clock.t += step;
      r.controller.tick();
    }
  };

  it('fires once at 1.5 s of the keyboard hold', () => {
    const r = rig();
    r.controller.tick();
    r.held.key = true;
    run(r, 2400);
    expect(r.fired.length).toBe(1);
    expect(r.fired[0]!).toBeGreaterThanOrEqual(1500);
    expect(r.fired[0]!).toBeLessThan(1700);
    expect(r.controller.done).toBe(true);
  });

  it('fires at 1.5 s of the pad hold too', () => {
    const r = rig();
    r.controller.tick();
    r.held.pad = true;
    run(r, 1800);
    expect(r.fired.length).toBe(1);
  });

  it('a brush of the key draws no ring and fires nothing', () => {
    const r = rig();
    r.controller.tick();
    r.held.key = true;
    run(r, RING_AFTER_MS - 32);
    r.held.key = false;
    run(r, 200);
    expect(r.fired).toEqual([]);
    expect(Math.max(...r.ring)).toBe(0);
  });

  it('the ring fills while held and clears when let go', () => {
    const r = rig();
    r.controller.tick();
    r.held.key = true;
    run(r, 800);
    const mid = r.ring[r.ring.length - 1]!;
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.7);
    r.held.key = false;
    run(r, 32);
    expect(r.ring[r.ring.length - 1]).toBe(0);
    expect(r.fired).toEqual([]);
  });

  it('the ring element: hidden at 0, shown with a proportional arc, gone on dispose', () => {
    const ring = new ResetRing();
    expect(ring.el.hidden).toBe(true);
    ring.set(0.5);
    expect(ring.el.hidden).toBe(false);
    const arc = ring.el.querySelector('.demo-reset__arc')!;
    const full = 2 * Math.PI * 21;
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(full / 2, 1);
    expect(ring.el.textContent).toContain('Hold to restart');
    ring.set(0);
    expect(ring.el.hidden).toBe(true);
    ring.dispose();
    expect(document.querySelector('.demo-reset')).toBeNull();
  });
});

describe('the wiring', () => {
  let raf: Array<(t: number) => void> = [];
  let now = 0;
  beforeEach(() => {
    raf = [];
    now = 0;
    vi.stubGlobal('requestAnimationFrame', (fn: (t: number) => void) => (raf.push(fn), raf.length));
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  const frames = (ms: number): void => {
    for (let t = 0; t < ms; t += 16) {
      now += 16;
      const fns = raf.splice(0);
      for (const fn of fns) fn(now);
    }
  };
  const fakeApp = (): { app: never; calls: string[] } => {
    const calls: string[] = [];
    const storage = new MemStore();
    const app = {
      save: new SaveStore('wiring-save', storage),
      fade: (_to: string, ms: number) => (calls.push(`fade:${ms}`), Promise.resolve()),
      stop: () => calls.push('stop'),
    };
    return { app: app as never, calls };
  };

  it('holding Home in demo mode runs the reset (the page reloads); a tap does not', async () => {
    setDemoMode(true);
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    const { app, calls } = fakeApp();
    const wired = installDemoReset(app);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Home', bubbles: true }));
    frames(64);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Home', bubbles: true }));
    frames(2000);
    expect(calls).toEqual([]);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Home', bubbles: true }));
    frames(300);
    expect(document.querySelector<HTMLElement>('.demo-reset')!.hidden).toBe(false);
    frames(1500);
    await Promise.resolve();
    await Promise.resolve();
    expect(calls).toContain('stop');
    wired.dispose();
  });

  it('outside demo mode Home does nothing at all', async () => {
    setDemoMode(false);
    const { app, calls } = fakeApp();
    const wired = installDemoReset(app);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Home', bubbles: true }));
    frames(3000);
    await Promise.resolve();
    expect(calls).toEqual([]);
    expect(document.querySelector('.demo-reset')).toBeNull(); // no hold, no ring element at all
    wired.dispose();
  });
});
