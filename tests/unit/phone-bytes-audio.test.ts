// @vitest-environment jsdom
/**
 * Release 73, lane "r73-bytes" (BOTH games, shared audio plumbing; ChatGPT point 5, `docs/BUDGETS.md` B2a): on the phone class the chapter's results cues (the victory and the defeat music) do not share the line with
 * the battle's entry. Release 70's phone10 run, Chapter IV: the warm was still fetching them (1.6 MB, 1.3 s of a 10 Mbit/s line) when the battle screen began to enter, behind the fight's own theme.
 *
 * Proved here with the real `AudioManager` and `MusicLoader` against a fake context and a fake network (the harness of `music-warm.test.ts`) and the real `LoadHold`:
 *   - `WarmGate` is a plain seam: no gate, no wait; a newer run's gate replaces the old; an old run cannot remove the newer gate; a gate that throws is no gate;
 *   - `AudioManager.fetchWarm` waits for the gate's promise before a cue, and a run that was replaced meanwhile fetches nothing more;
 *   - `musicChapter` holds exactly the cues after the scene's bed and the first fight's theme, only while the entry holds the line, and fetches them in order when it opens;
 *   - a desktop, `?phonebytes=off` and a hold that is not there fetch the four cues straight through, as before.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AudioManager } from '../../src/audio/AudioManager.ts';
import { audio } from '../../src/audio/index.ts';
import { setWarmGate, warmGate } from '../../src/audio/WarmGate.ts';
import { chapterLaterCues, chapterWarmCues, musicChapter } from '../../src/app/chapterMusicWarm.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { bytesBooks, holdBackground, releaseBackground, resetHoldForTests, setForegroundFirst } from '../../src/engine/LoadHold.ts';

const CUES = ['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx'] as const;

const manifestJson = {
  version: 1,
  sampleRate: 44100,
  music: Object.fromEntries(CUES.map((name) => [name, { file: `music/${name}.mp3`, loopStart: 4, loopEnd: 80, duration: 90 }])),
};

function network() {
  const log: string[] = [];
  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const url = String(input);
    log.push(url);
    if (url.endsWith('/audio/manifest.json')) return new Response(JSON.stringify(manifestJson), { status: 200 });
    const name = /\/music\/([^/]+)\.mp3$/.exec(url)?.[1] ?? '';
    if (!name || !(CUES as readonly string[]).includes(name)) return new Response('', { status: 404 });
    return new Response(new TextEncoder().encode(name), { status: 200 });
  };
  const musicRequests = (): string[] => log.filter((u) => u.includes('/music/')).map((u) => /\/music\/([^/]+)\.mp3$/.exec(u)?.[1] ?? u);
  return { log, fetchImpl, musicRequests };
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
  return {
    state: 'running',
    sampleRate: 48000,
    currentTime: 1,
    destination: new FakeNode(),
    resume: (): Promise<void> => Promise.resolve(),
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBufferSource: () => Object.assign(new FakeNode(), { buffer: null, loop: false, loopStart: 0, loopEnd: 0, start: () => {}, stop: () => {}, onended: null as unknown }),
    decodeAudioData: async (bytes: ArrayBuffer) => ({ name: new TextDecoder().decode(bytes), duration: 90 }),
  };
}

let net: ReturnType<typeof network>;

function unlocked(): AudioManager {
  const am = new AudioManager({ useWorker: false, baseUrl: '/' });
  const raw = am as unknown as Record<string, unknown>;
  const ctx = fakeContext();
  raw['ctx'] = ctx;
  raw['musicBus'] = ctx.createGain();
  return am;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 60; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 60; i++) await Promise.resolve();
}

beforeEach(() => {
  net = network();
  vi.stubGlobal('fetch', net.fetchImpl);
  resetHoldForTests();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetHoldForTests();
  setWarmGate(() => undefined)(); // no gate is left behind
});

describe('WarmGate', () => {
  it('answers nothing without a gate, and a gate that throws is no gate', () => {
    expect(warmGate('victory-ffx')).toBeUndefined();
    const off = setWarmGate(() => {
      throw new Error('boom');
    });
    expect(warmGate('victory-ffx')).toBeUndefined();
    off();
  });

  it('the newest gate replaces the last, and an old run cannot take away the newer run\'s gate', () => {
    const wait = Promise.resolve();
    const offOld = setWarmGate(() => undefined);
    const offNew = setWarmGate(() => wait);
    expect(warmGate('x')).toBe(wait);
    offOld(); // the older run ends: the newer gate stays
    expect(warmGate('x')).toBe(wait);
    offNew();
    expect(warmGate('x')).toBeUndefined();
  });
});

describe('AudioManager.fetchWarm and the gate', () => {
  it('waits for the gate before a cue it names, goes on at once for the others, and fetches in the order asked', async () => {
    let open: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => (open = resolve));
    const off = setWarmGate((cue) => (cue === 'victory-ffx' ? wait : undefined));
    const am = unlocked();
    am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour']);
    open();
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    off();
  });

  it('a run that was replaced while a cue waited fetches nothing more', async () => {
    let open: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => (open = resolve));
    const off = setWarmGate((cue) => (cue === 'victory-ffx' ? wait : undefined));
    const am = unlocked();
    am.warmMusic(['scene-gagazet', 'victory-ffx', 'defeat-ffx']);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet']);
    am.warmMusic(['boss-seymour']); // a newer run
    open();
    await settle();
    expect(net.musicRequests().filter((n) => n === 'victory-ffx' || n === 'defeat-ffx')).toEqual([]);
    off();
  });

  it('with no gate nothing waits: the four cues are fetched straight through (the desktop)', async () => {
    const am = unlocked();
    am.warmMusic(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
  });
});

describe('musicChapter on a phone whose entry holds the line', () => {
  const ch1 = (): NonNullable<ReturnType<typeof getChapter>> => getChapter('seymour-flux')!;
  const run = (am: AudioManager): (() => void) => {
    vi.spyOn(audio, 'warmMusic').mockImplementation((names) => am.warmMusic(names));
    return musicChapter('seymour-flux', () => undefined);
  };

  it('the later cues are the results cues: everything after the scene bed and the first fight\'s theme, in both games', () => {
    expect(chapterWarmCues(ch1())).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    expect(chapterLaterCues(ch1())).toEqual(['victory-ffx', 'defeat-ffx']);
    expect(chapterLaterCues(getChapter('ffx2-leblanc')!)).toEqual(['victory-ffx2', 'defeat-ffx2']);
    for (const id of ['ffx2-trema', 'ffx2-bahamut', 'seymour-flux', 'yunalesca', 'sin-face']) {
      const c = getChapter(id as never)!;
      const later = chapterLaterCues(c);
      expect(later.includes(c.music.scene as string), id).toBe(false); // the scene's bed is never held (Trema's opening fight is scored with it)
      for (const cue of later) expect(chapterWarmCues(c).indexOf(cue), `${id}/${cue}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('held: the scene bed and the boss theme come at once, the victory and defeat cues wait for the hold and then follow in order', async () => {
    setForegroundFirst(true);
    holdBackground();
    const am = unlocked();
    const done = run(am);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour']);
    expect(bytesBooks().audioCues).toBeGreaterThanOrEqual(1);
    releaseBackground();
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    done();
  });

  it('?phonebytes=off keeps release 69/70\'s order while the hold stays shut: all four cues straight through', async () => {
    vi.stubGlobal('location', { search: '?phonebytes=off' });
    setForegroundFirst(true);
    holdBackground();
    const am = unlocked();
    const done = run(am);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    expect(bytesBooks().audioCues).toBe(0);
    done();
  });

  it('no hold (a desktop, or a warm that finished before the entry began): nothing is held and nothing counted', async () => {
    const am = unlocked();
    const done = run(am);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    expect(bytesBooks().audioCues).toBe(0);
    done();
  });

  it('the end of the run takes its gate away, so the next run\'s cues are never held by this one', async () => {
    setForegroundFirst(true);
    holdBackground();
    vi.spyOn(audio, 'warmMusic').mockReturnValue(() => undefined);
    const done = musicChapter('seymour-flux', () => undefined);
    expect(warmGate('victory-ffx')).toBeInstanceOf(Promise); // held: the victory cue waits
    expect(warmGate('boss-seymour')).toBeUndefined(); // the fight's own theme never does
    done();
    expect(warmGate('victory-ffx')).toBeUndefined();
  });
});
