// @vitest-environment jsdom
/**
 * hotfix-music-overlap (2026-09-29, Bailey: "when i choose a chapter it sounds like the chapter
 * music and main menu music are both playing at the same time when they shouldnt be").
 *
 * The music slot holds one track. A new cue crossfades in, and the crossfade ends with the old
 * source stopped; never two tracks after it, never three during it. Three ways the old
 * `AudioManager` broke that, each pinned here against the real manager and a recording context:
 *
 * 1. **A context that is not running yet** (created without user activation: a pad press the
 *    browser does not count, a first touch on iOS). Its clock is frozen, so every cue requested
 *    meanwhile (title, then chapter select, then the chapter's own) was started at the same
 *    frozen instant, and each superseded one got a fade-out that begins when the context
 *    finally runs. Worse, `fadeOutSlot` read `gain.value`, which is the default 1.0 until the
 *    audio thread has rendered the node, so each superseded cue was re-armed at FULL volume.
 *    The first audible moment played the whole backlog at once.
 * 2. **The same read on a running context**: a cue replaced before the audio thread rendered its
 *    first quantum jumped from silence to full volume and faded out from there, on top of the
 *    cue that replaced it.
 * 3. **A third cue during a crossfade** left the first outgoing cue fading for its full length,
 *    so three tracks sounded at once.
 *
 * Plus the unlock listeners: they came off after the first gesture even when that gesture left
 * the context suspended, so nothing ever resumed it (and the later resume is what released the
 * backlog above).
 *
 * Game case: both (shared audio routing; every FFX and FFX-2 screen plays music through this one
 * slot; CHK-020).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AudioManager } from '../../src/audio/AudioManager.ts';

interface Src {
  name: string;
  startAt: number | null;
  stopAt: number | null;
}
interface ParamEvent {
  kind: 'set' | 'ramp' | 'cancel';
  v: number;
  at: number;
}

/** A context that records what it was asked to do; `value` behaves like Chrome's (default until rendered). */
function recordingContext(clock: { now: number }, state: { value: string }) {
  const sources: Src[] = [];
  const params: ParamEvent[][] = [];
  class FakeParam {
    value = 1; // what Chrome reports for a gain the audio thread has not rendered yet
    readonly events: ParamEvent[] = [];
    constructor() {
      params.push(this.events);
    }
    setValueAtTime(v: number, at: number): void {
      this.events.push({ kind: 'set', v, at });
    }
    exponentialRampToValueAtTime(v: number, at: number): void {
      this.events.push({ kind: 'ramp', v, at });
    }
    linearRampToValueAtTime(): void {}
    cancelScheduledValues(at: number): void {
      this.events.push({ kind: 'cancel', v: 0, at });
    }
  }
  class FakeNode {
    connect(): void {}
    disconnect(): void {}
  }
  const ctx = {
    get state(): string {
      return state.value;
    },
    sampleRate: 48000,
    get currentTime(): number {
      return clock.now;
    },
    destination: new FakeNode(),
    resume: (): Promise<void> => Promise.resolve(),
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBufferSource: () => {
      const rec: Src = { name: '', startAt: null, stopAt: null };
      sources.push(rec);
      const node = Object.assign(new FakeNode(), {
        buffer: null as unknown,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        onended: null as unknown,
        start: (at: number) => {
          rec.startAt = at;
        },
        stop: (at = clock.now) => {
          rec.stopAt = rec.stopAt === null ? at : Math.min(rec.stopAt, at);
        },
      });
      return node;
    },
  };
  return { ctx, sources, params };
}

function harness(opts: { now?: number; state?: string } = {}) {
  const clock = { now: opts.now ?? 10 };
  const state = { value: opts.state ?? 'running' };
  const rec = recordingContext(clock, state);
  const am = new AudioManager({ useWorker: false, synthOnly: true });
  const raw = am as unknown as Record<string, unknown> & { loader: Record<string, unknown> };
  raw['ctx'] = rec.ctx;
  raw['musicBus'] = rec.ctx.createGain();
  raw['loadManifest'] = async () => {};
  raw.loader['evict'] = () => {};
  raw.loader['load'] = async () => ({ buffer: {}, loopStart: 0, loopEnd: 1 });
  const play = async (name: string, fade: number): Promise<void> => {
    await am.playMusic(name, { fade });
    rec.sources[rec.sources.length - 1]!.name = name;
  };
  /** Sources a listener hears at context time `t`: started, not yet stopped. */
  const liveAt = (t: number): string[] =>
    rec.sources.filter((s) => s.startAt !== null && s.startAt <= t && (s.stopAt === null || s.stopAt > t)).map((s) => s.name);
  /**
   * The loudest gain a slot is left scheduled for once it was taken out of the slot: every `set`
   * and ramp target after the last `cancelScheduledValues` (which wiped its own fade-in).
   */
  const loudestAfter = (index: number, from: number): number => {
    const events = rec.params[index + 1]!;
    const lastCancel = events.map((e) => e.kind).lastIndexOf('cancel');
    return Math.max(0, ...events.slice(lastCancel + 1).filter((e) => e.at >= from).map((e) => e.v));
  };
  return { am, clock, state, rec, play, liveAt, loudestAfter };
}

describe('hotfix-music-overlap: one music track at a time', () => {
  it('a context that is not running yet keeps only the newest cue; the backlog never plays when it starts', async () => {
    // Created without activation: the clock is frozen at 0.
    const h = harness({ now: 0, state: 'suspended' });
    await h.play('title', 1.6);
    await h.play('chapter-select', 1.2);
    await h.play('scene-macalania-temple', 1.4);

    // The context starts running (the first counted gesture). What is live from its first sample on?
    expect(h.liveAt(0)).toEqual(['scene-macalania-temple']);
    expect(h.liveAt(0.5)).toEqual(['scene-macalania-temple']);
    // And no superseded cue was re-armed at full volume.
    expect(h.loudestAfter(0, 0)).toBeLessThan(0.01); // title's gain
    expect(h.loudestAfter(1, 0)).toBeLessThan(0.01); // chapter-select's gain
  });

  it('a cue replaced before its first rendered quantum is cut, not faded out from full volume', async () => {
    const h = harness({ now: 5 });
    await h.play('title', 1.6);
    await h.play('chapter-select', 1.2); // same instant: the title's gain still reads the default 1.0
    expect(h.loudestAfter(0, 5)).toBeLessThan(0.01);
    expect(h.liveAt(5.2)).toEqual(['chapter-select']);
  });

  it('a normal crossfade starts the old cue from the level it is at and ends with it stopped', async () => {
    const h = harness({ now: 20 });
    await h.play('title', 1.6);
    h.clock.now = 30; // the title has been at full level for 8.4 s
    await h.play('chapter-select', 1.2);
    const title = h.rec.params[1]!;
    const armed = title.filter((e) => e.kind === 'set' && e.at === 30).map((e) => e.v);
    expect(armed).toEqual([1]); // its real level, the crossfade still sounds like one
    expect(title.some((e) => e.kind === 'ramp' && e.v < 0.001 && Math.abs(e.at - 31.2) < 1e-6)).toBe(true);
    expect(h.liveAt(30.6)).toEqual(['title', 'chapter-select']);
    expect(h.liveAt(31.3)).toEqual(['chapter-select']);
  });

  it('a third cue during a crossfade cuts the oldest: never three tracks at once', async () => {
    const h = harness({ now: 20 });
    await h.play('title', 1.6);
    h.clock.now = 30;
    await h.play('chapter-select', 1.2);
    h.clock.now = 30.4;
    await h.play('scene-gagazet', 1.4);
    // The oldest is cleared with a 60 ms declick (plus the 50 ms stop margin), not left to finish its 1.2 s fade.
    expect(h.liveAt(30.45)).toContain('title');
    for (const t of [30.52, 30.6, 31, 31.2, 31.5]) expect(h.liveAt(t).length, `at ${t}`).toBeLessThanOrEqual(2);
    expect(h.liveAt(32)).toEqual(['scene-gagazet']);
  });

  it('stopMusic on a context that is not running stops the track outright', async () => {
    const h = harness({ now: 0, state: 'suspended' });
    await h.play('title', 1.6);
    h.am.stopMusic(0.8);
    expect(h.liveAt(0)).toEqual([]);
  });
});

describe('hotfix-music-overlap: the unlock listeners stay armed until the context runs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a first gesture that leaves the context suspended does not disarm the next one', () => {
    let resumes = 0;
    class FakeAudioContext {
      state = 'suspended';
      sampleRate = 48000;
      currentTime = 0;
      destination = {};
      private node = () => ({
        connect() {},
        disconnect() {},
        gain: { value: 1 },
        threshold: { value: 0 },
        knee: { value: 0 },
        ratio: { value: 0 },
        attack: { value: 0 },
        release: { value: 0 },
      });
      createGain = this.node;
      createDynamicsCompressor = this.node;
      createBuffer = () => ({ getChannelData: () => new Float32Array(4) });
      createConvolver = () => ({ ...this.node(), buffer: null, normalize: true });
      resume = (): Promise<void> => {
        resumes++;
        if (resumes >= 2) this.state = 'running'; // the second gesture is the one the browser counts
        return Promise.resolve();
      };
      addEventListener(): void {}
    }
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const target = document.createElement('div');
    const am = new AudioManager({ useWorker: false, synthOnly: true });
    (am as unknown as Record<string, unknown>)['warmSfx'] = () => {};
    am.installUnlockListeners(target);

    target.dispatchEvent(new Event('touchstart')); // creates the context: suspended
    expect(am.context?.state).toBe('suspended');
    target.dispatchEvent(new Event('touchend')); // the gesture iOS counts: must still reach resume()
    expect(resumes).toBeGreaterThanOrEqual(1);
    target.dispatchEvent(new Event('click'));
    expect(am.context?.state).toBe('running');
  });
});
