// @vitest-environment jsdom
/**
 * PR-0373 (round 25, both games, shared audio plumbing): a chapter's scene, boss and victory cues are fetched and decoded
 * when its card is confirmed, so the first line of the opening scene never waits on a fetch.
 *
 * What is proved here, with the real `AudioManager` and `MusicLoader` against a fake context and a fake network:
 *   - the cues are requested in order (scene, boss, victory), after the manifest, and nothing plays or is queued;
 *   - the call returns at once and never throws, whatever the network does;
 *   - only cues that have a rendered file are fetched; with the audio still locked nothing is;
 *   - the warmed cues survive the scene cue's own start (an eviction used to throw them away, and the battle fetched the
 *     boss cue again), a cue that has played stops being owed, and the end of the run (or a newer run) ends the hold;
 *   - a play that arrives while its warm is in flight joins it: one fetch, not two.
 * `tests/unit/chapter-music-warm.test.ts` holds the other half: which cues a chapter warms, and that the flow does it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AudioManager } from '../../src/audio/AudioManager.ts';
import { MusicWarmHold } from '../../src/audio/MusicWarm.ts';

const CUES = ['scene-gagazet', 'boss-seymour', 'victory-ffx', 'scene-zanarkand-dome', 'boss-yunalesca'] as const;

const manifestJson = {
  version: 1,
  sampleRate: 44100,
  music: Object.fromEntries(CUES.map((name) => [name, { file: `music/${name}.mp3`, loopStart: 4, loopEnd: 80, duration: 90 }])),
};

/** A fake network: every request is logged, a music file can be held back until the test lets it go. */
function network() {
  const log: string[] = [];
  const held = new Map<string, () => void>();
  const gates = new Map<string, Promise<void>>();
  const hold = (name: string): void => {
    gates.set(
      name,
      new Promise<void>((resolve) => {
        held.set(name, resolve);
      }),
    );
  };
  const release = (name: string): void => held.get(name)?.();
  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const url = String(input);
    log.push(url);
    if (url.endsWith('/audio/manifest.json')) return new Response(JSON.stringify(manifestJson), { status: 200 });
    const name = /\/music\/([^/]+)\.mp3$/.exec(url)?.[1] ?? '';
    await gates.get(name);
    if (!name || !(CUES as readonly string[]).includes(name)) return new Response('', { status: 404 });
    return new Response(new TextEncoder().encode(name), { status: 200 });
  };
  const musicRequests = (): string[] => log.filter((u) => u.includes('/music/')).map((u) => /\/music\/([^/]+)\.mp3$/.exec(u)?.[1] ?? u);
  return { log, hold, release, fetchImpl, musicRequests };
}

function fakeContext() {
  class FakeParam {
    value = 1;
    setValueAtTime(v: number): void {
      this.value = v;
    }
    exponentialRampToValueAtTime(): void {}
    linearRampToValueAtTime(): void {}
    cancelScheduledValues(): void {}
  }
  class FakeNode {
    connect(): void {}
    disconnect(): void {}
  }
  const sources: Array<{ buffer: { name: string } | null }> = [];
  return {
    sources,
    state: 'running',
    sampleRate: 48000,
    currentTime: 1,
    destination: new FakeNode(),
    resume: (): Promise<void> => Promise.resolve(),
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBufferSource: () => {
      const source = Object.assign(new FakeNode(), { buffer: null as { name: string } | null, loop: false, loopStart: 0, loopEnd: 0, start: () => {}, stop: () => {}, onended: null as unknown });
      sources.push(source);
      return source;
    },
    decodeAudioData: async (bytes: ArrayBuffer) => ({ name: new TextDecoder().decode(bytes), duration: 90 }),
  };
}

type Net = ReturnType<typeof network>;
let net: Net;

/** A manager with a running (fake) context, as the board has by the time a card is confirmed. */
function unlocked() {
  const am = new AudioManager({ useWorker: false, baseUrl: '/' });
  const ctx = fakeContext();
  const raw = am as unknown as Record<string, unknown>;
  raw['ctx'] = ctx;
  raw['musicBus'] = ctx.createGain();
  return { am, ctx, loader: raw['loader'] as { cachedNames(): string[]; has(n: string): boolean } };
}

/** Let every pending promise chain run (the fake network is all microtasks). */
async function settle(): Promise<void> {
  for (let i = 0; i < 60; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 60; i++) await Promise.resolve();
}

beforeEach(() => {
  net = network();
  vi.stubGlobal('fetch', net.fetchImpl);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MusicWarmHold', () => {
  it('owes the cues in order, forgets one when it plays, and ends with its run', () => {
    const hold = new MusicWarmHold();
    const run = hold.begin(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'boss-seymour']);
    expect(hold.held()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    expect(hold.keep('scene-gagazet')).toEqual(['boss-seymour', 'victory-ffx']);
    hold.played('scene-gagazet');
    expect(hold.held()).toEqual(['boss-seymour', 'victory-ffx']);
    hold.release(run);
    expect(hold.held()).toEqual([]);
  });

  it('a newer run replaces the hold, and an older run cannot end the newer one', () => {
    const hold = new MusicWarmHold();
    const first = hold.begin(['a']);
    const second = hold.begin(['b']);
    expect(hold.isCurrent(first)).toBe(false);
    expect(hold.isCurrent(second)).toBe(true);
    hold.release(first);
    expect(hold.held()).toEqual(['b']);
    hold.release(second);
    expect(hold.held()).toEqual([]);
  });
});

describe('AudioManager.warmMusic', () => {
  it('fetches the cues in the order asked, after the manifest, and plays nothing', async () => {
    const { am, ctx, loader } = unlocked();
    am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    await settle();
    expect(net.log[0]).toBe('/audio/manifest.json');
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    expect(loader.cachedNames()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    expect(ctx.sources).toHaveLength(0); // nothing started
    expect(am.currentMusic).toBeNull();
    expect(am.requestedMusic).toBeNull(); // and nothing is pending: what plays, and when, is unchanged
    expect(am.debug().music.held).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
  });

  it('one cue at a time, so the scene cue is not slowed by the cues behind it', async () => {
    const { am } = unlocked();
    net.hold('scene-gagazet');
    am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet']); // the boss cue waits for the scene cue
    net.release('scene-gagazet');
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
  });

  it('returns at once and never throws, whatever the network does', async () => {
    const { am } = unlocked();
    vi.stubGlobal('fetch', async () => {
      throw new Error('offline');
    });
    let release: (() => void) | undefined;
    expect(() => {
      release = am.warmMusic(['scene-gagazet', 'boss-seymour']);
    }).not.toThrow();
    expect(typeof release).toBe('function');
    await settle();
    expect(am.currentMusic).toBeNull();
    expect(() => release?.()).not.toThrow();
  });

  it('leaves alone a cue with no rendered file, a name that is no track, and a cue already decoded', async () => {
    const { am, loader } = unlocked();
    am.warmMusic(['not-a-track', 'title', 'scene-gagazet']); // `title` is a track the manifest above does not list
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet']);
    expect(am.debug().music.held).toEqual(['title', 'scene-gagazet']); // only real tracks are owed (and only the decoded ones are kept: see the eviction tests)
    am.warmMusic(['scene-gagazet']);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet']); // decoded already: not fetched again
    expect(loader.has('scene-gagazet')).toBe(true);
  });

  it('fetches nothing while the audio is still locked, and nothing in a synth-only build', async () => {
    const locked = new AudioManager({ useWorker: false, baseUrl: '/' });
    locked.warmMusic(['scene-gagazet']);
    const synth = new AudioManager({ useWorker: false, baseUrl: '/', synthOnly: true });
    (synth as unknown as Record<string, unknown>)['ctx'] = fakeContext();
    synth.warmMusic(['scene-gagazet']);
    await settle();
    expect(net.log).toEqual([]);
  });

  it('a play that arrives while its warm is in flight joins it: one fetch', async () => {
    const { am, ctx } = unlocked();
    net.hold('scene-gagazet');
    am.warmMusic(['scene-gagazet', 'boss-seymour']);
    await settle();
    const played = am.playMusic('scene-gagazet');
    await settle();
    net.release('scene-gagazet');
    await played;
    await settle();
    expect(net.musicRequests().filter((n) => n === 'scene-gagazet')).toHaveLength(1);
    expect(am.currentMusic).toBe('scene-gagazet');
    expect(ctx.sources.map((s) => s.buffer?.name)).toEqual(['scene-gagazet']);
  });

  it('a newer run stops an older one at its next cue', async () => {
    const { am } = unlocked();
    net.hold('scene-gagazet');
    am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    await settle();
    am.warmMusic(['scene-zanarkand-dome', 'boss-yunalesca']);
    net.release('scene-gagazet');
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'scene-zanarkand-dome', 'boss-yunalesca']); // the old run's boss and victory cues were never fetched
  });
});

describe('the warmed cues survive the plays between the confirm and the fight', () => {
  it('the scene cue starting keeps the boss and victory cues; the battle fetches nothing', async () => {
    const { am, loader } = unlocked();
    void am.playMusic('boss-yunalesca'); // stands in for the board's cue, still playing at the confirm
    await settle();
    const release = am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    await settle();
    expect(loader.cachedNames().sort()).toEqual(['boss-seymour', 'boss-yunalesca', 'scene-gagazet', 'victory-ffx']);
    const before = net.musicRequests().length;

    await am.playMusic('scene-gagazet', { fade: 1.4 }); // the opening scene
    expect(loader.cachedNames().sort()).toEqual(['boss-seymour', 'scene-gagazet', 'victory-ffx']); // the board's cue goes, as always; the owed cues stay
    await am.playMusic('boss-seymour', { fade: 1.2 }); // the fight
    expect(loader.cachedNames().sort()).toEqual(['boss-seymour', 'victory-ffx']); // the scene is played out and is dropped
    await am.playMusic('victory-ffx', { fade: 0.4 }); // the results
    expect(loader.cachedNames()).toEqual(['victory-ffx']);

    expect(net.musicRequests().length, 'no cue was fetched after the confirm').toBe(before);
    release();
  });

  it('without the warm, the same plays fetch every cue when it is asked for (what the build did before)', async () => {
    const { am } = unlocked();
    await am.playMusic('scene-gagazet');
    await am.playMusic('boss-seymour');
    await am.playMusic('victory-ffx');
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
  });

  it('the end of the run ends the hold: the next play drops the cues that were never played', async () => {
    const { am, loader } = unlocked();
    const release = am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx']);
    await settle();
    release(); // the player backed out of prep
    expect(am.debug().music.held).toEqual([]);
    await am.playMusic('boss-yunalesca'); // the board's cue again
    expect(loader.cachedNames()).toEqual(['boss-yunalesca']);
  });

  it('an older run ending does not end the newer run\'s hold', async () => {
    const { am, loader } = unlocked();
    const older = am.warmMusic(['scene-gagazet', 'boss-seymour']);
    await settle();
    const newer = am.warmMusic(['scene-zanarkand-dome', 'boss-yunalesca']);
    await settle();
    older();
    await am.playMusic('scene-zanarkand-dome');
    expect(loader.cachedNames().sort()).toEqual(['boss-yunalesca', 'scene-zanarkand-dome']);
    newer();
  });

  it('the caller\'s own upcoming list still comes first, and the cache never holds more than three after a play', async () => {
    const { am, loader } = unlocked();
    am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'boss-yunalesca']);
    await settle();
    await am.playMusic('scene-gagazet', { upcoming: ['boss-yunalesca'] });
    const kept = loader.cachedNames().sort();
    expect(kept).toHaveLength(3);
    expect(kept).toContain('scene-gagazet');
    expect(kept).toContain('boss-yunalesca'); // the caller's named cue beats the hold's order
  });
});
