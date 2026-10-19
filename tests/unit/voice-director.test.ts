/**
 * The voice as the game drives it: chapter lifecycle, what may speak, ducking, skip, pause, preload. Everything outside the director
 * (network, decoder, the mixer, the clocks) is faked, so these run in Node. Game case: both for the plumbing; the FFX-2 cases pin
 * that an FFX-2 chapter asks for no voice file at all (rule 14, Bailey's scope of 2026-10-07).
 */
import { describe, expect, it } from 'vitest';

import { VoiceBank, type DecodedVoice } from '../../src/audio/voice/VoiceBank.ts';
import { VoiceDirector, VOICE_DUCK_ATTACK_S, VOICE_DUCK_GAIN, VOICE_DUCK_HOLD_MS, VOICE_DUCK_RELEASE_S, scriptKeys, type VoiceHost } from '../../src/audio/voice/VoiceDirector.ts';
import { ifFlag, narrate, parallel, say, wait } from '../../src/story/dsl.ts';
import { lineKey } from '../../src/story/voice/voiceKey.ts';
import { gatedVoice } from '../../src/story/voice/voicePort.ts';

const KEYS = {
  hey: lineKey('tidus', 'Hey!'),
  yes: lineKey('yuna', 'Yes.'),
  hmph: lineKey('auron', 'Hmph.'),
  beat: lineKey('tidus', 'Mid beat.'),
  quip: lineKey('yuna', 'May they rest.'),
  pre4: lineKey('auron', 'Pre four.'),
  pre5: lineKey('auron', 'Pre five.'),
  pre6: lineKey('auron', 'Pre six.'),
  pre7: lineKey('auron', 'Pre seven.'),
};
const lines = {
  [KEYS.hey]: { id: 'seymour-flux.pre.001', file: 'seymour-flux/seymour-flux.pre.001.mp3', ms: 1200, who: 'tidus' },
  [KEYS.yes]: { id: 'seymour-flux.pre.002', file: 'seymour-flux/seymour-flux.pre.002.mp3', ms: 600, who: 'yuna' },
  [KEYS.hmph]: { id: 'seymour-flux.pre.003', file: 'seymour-flux/seymour-flux.pre.003.mp3', ms: 500, who: 'auron' },
  [KEYS.pre4]: { id: 'seymour-flux.pre.004', file: 'seymour-flux/seymour-flux.pre.004.mp3', ms: 500, who: 'auron' },
  [KEYS.pre5]: { id: 'seymour-flux.pre.005', file: 'seymour-flux/seymour-flux.pre.005.mp3', ms: 500, who: 'auron' },
  [KEYS.pre6]: { id: 'seymour-flux.pre.006', file: 'seymour-flux/seymour-flux.pre.006.mp3', ms: 500, who: 'auron' },
  [KEYS.pre7]: { id: 'seymour-flux.pre.007', file: 'seymour-flux/seymour-flux.pre.007.mp3', ms: 500, who: 'auron' },
  [KEYS.beat]: { id: 'seymour-flux.mid-first-zombie.001', file: 'seymour-flux/seymour-flux.mid-first-zombie.001.mp3', ms: 1500, who: 'tidus' },
  [KEYS.quip]: { id: 'seymour-flux.quip-yuna.001', file: 'seymour-flux/seymour-flux.quip-yuna.001.mp3', ms: 900, who: 'yuna' },
};
const manifest = { version: 1, chapter: 'seymour-flux', game: 'ffx', lines };

class Src {
  onended: (() => void) | null = null;
  buffer: unknown = null;
  starts: number[] = [];
  connect(): void {}
  disconnect(): void {}
  start(_when: number, offset: number): void { this.starts.push(offset); }
  stop(): void {}
  end(): void { this.onended?.(); }
}
const param = () => ({ value: 1, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {} });

function rig(opts: { state?: string; enabled?: boolean; destination?: boolean; context?: boolean } = {}) {
  const t = { audio: 0, wall: 0, timers: [] as Array<{ at: number; fn: () => void; id: number }>, nextId: 1 };
  const requests: string[] = [];
  const calls: string[] = [];
  const sources: Src[] = [];
  const ctx = {
    state: opts.state ?? 'running',
    get currentTime() { return t.audio; },
    createBufferSource() { const s = new Src(); sources.push(s); return s; },
    createGain() { return { gain: param(), connect() {}, disconnect() {} }; },
  };
  const host = {
    context: opts.context === false ? null : (ctx as unknown as AudioContext),
    voiceDestination: opts.destination === false ? null : ({} as AudioNode),
    voiceEnabled: opts.enabled ?? true,
    unlock: () => { calls.push('unlock'); return true; },
    duck: (amount?: number, seconds?: number) => calls.push(`duck:${amount}:${seconds}`),
    unduck: (seconds?: number) => calls.push(`unduck:${seconds}`),
  } as VoiceHost & { voiceEnabled: boolean };
  const bank = new VoiceBank<DecodedVoice>({
    fetchJson: async (p) => { requests.push(p); return manifest; },
    fetchBytes: async (p) => { requests.push(p); return new ArrayBuffer(8); },
    decode: async () => ({ length: 48000, numberOfChannels: 1, duration: 1 }),
  });
  const director = new VoiceDirector(host, bank as unknown as VoiceBank<AudioBuffer>, {
    now: () => t.wall,
    setTimer: (fn, ms) => { const id = t.nextId++; t.timers.push({ at: t.wall + ms, fn, id }); return id; },
    clearTimer: (h) => { t.timers = t.timers.filter((x) => x.id !== h); },
  });
  const settle = () => new Promise<void>((r) => setTimeout(r, 0));
  const advance = (ms: number) => { t.wall += ms; for (const x of t.timers.filter((y) => y.at <= t.wall)) { t.timers = t.timers.filter((y) => y !== x); x.fn(); } };
  return { t, host, bank, director, requests, calls, sources, ctx, settle, advance };
}

const req = (who: string, text: string) => ({ who, text });
const stateOf = (run: unknown): string => (run as { state: string }).state;

describe('which chapters ask for voice at all', () => {
  it('an FFX-2 chapter requests no manifest and no file, and nothing in it speaks (rule 14)', async () => {
    const r = rig();
    const end = r.director.beginChapter('ffx2-leblanc', 'ffx2');
    r.director.prefetchScript([say('yuna-x2', 'Hey!'), say('tidus', 'Hey!')]);
    expect(r.director.begin(req('tidus', 'Hey!'))).toBeNull(); // even a line whose words match an FFX recording
    expect(r.director.spokenMs(req('tidus', 'Hey!'))).toBe(0);
    await r.settle();
    expect(r.requests).toEqual([]);
    end();
  });

  it('FF7 and an unknown game ask for nothing either', async () => {
    const r = rig();
    r.director.beginChapter('ff7-guard-scorpion', 'ff7');
    r.director.beginChapter('mystery', undefined);
    await r.settle();
    expect(r.requests).toEqual([]);
  });

  it('an FFX chapter fetches its manifest once and warms only its mid-battle and victory lines', async () => {
    const r = rig();
    r.director.beginChapter('seymour-flux', 'ffx');
    await r.settle();
    await r.settle();
    expect(r.requests.filter((p) => p.endsWith('.json'))).toEqual(['voice/seymour-flux.json']);
    const warmed = r.requests.filter((p) => p.endsWith('.mp3')).sort();
    expect(warmed).toEqual(['voice/seymour-flux/seymour-flux.mid-first-zombie.001.mp3', 'voice/seymour-flux/seymour-flux.quip-yuna.001.mp3']);
    expect(r.bank.stats().pinned).toBe(2);
  });

  it('ending the chapter stops the line and unpins; an old chapter\'s release does nothing once a new one began', async () => {
    const r = rig();
    const endOne = r.director.beginChapter('seymour-flux', 'ffx');
    await r.settle();
    const run = r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    r.director.beginChapter('yunalesca', 'ffx');
    expect(run?.holdMs()).toBe(0); // the old chapter's line was stopped by the new one
    endOne(); // stale: must not end the new chapter
    expect(r.director.begin(req('tidus', 'Hey!'))).toBeNull(); // the new chapter has no manifest loaded yet: text only
  });
});

describe('what may speak', () => {
  async function ready(over: Parameters<typeof rig>[0] = {}) {
    const r = rig(over);
    r.director.beginChapter('seymour-flux', 'ffx');
    await r.settle();
    await r.settle();
    return r;
  }

  it('speaks a line that has a recording, from the moment it begins', async () => {
    const r = await ready();
    expect(r.director.spokenMs(req('tidus', 'Hey!'))).toBe(1200 + 200);
    const run = r.director.begin(req('tidus', 'Hey!'));
    expect(run?.durationMs).toBe(1200);
    await r.settle();
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0]?.starts).toEqual([0]);
    expect(run?.holdMs()).toBeGreaterThan(0);
  });

  it.each([
    ['a line with no recording', {}, req('tidus', 'Nobody recorded this.')],
    ['voice turned off (VOICE-OVER off or VOICE 0)', { enabled: false }, req('tidus', 'Hey!')],
    ['no audio context yet (only a gesture may create one)', { context: false }, req('tidus', 'Hey!')],
    ['no voice bus', { destination: false }, req('tidus', 'Hey!')],
  ])('stays silent for %s, and holds the line for nothing', async (_name, over, line) => {
    const r = await ready(over);
    expect(r.director.begin(line)).toBeNull();
    expect(r.director.spokenMs(line)).toBe(0);
  });

  it('never queues a line across an unlock: a sleeping context gets one unlock try and then the line is text only', async () => {
    const r = await ready({ state: 'suspended' });
    expect(r.director.spokenMs(req('tidus', 'Hey!'))).toBe(0);
    expect(r.director.begin(req('tidus', 'Hey!'))).toBeNull();
    expect(r.calls).toEqual(['unlock']);
    r.ctx.state = 'running'; // audio wakes later: the old line does not suddenly play
    await r.settle();
    expect(r.sources).toHaveLength(0);
  });

  it('a recording that cannot be fetched or decoded is text only and never a wait', async () => {
    const r = rig();
    const broken = new VoiceBank<DecodedVoice>({ fetchJson: async () => manifest, fetchBytes: async () => null, decode: async () => null });
    const d = new VoiceDirector(r.host, broken as unknown as VoiceBank<AudioBuffer>, { now: () => r.t.wall, setTimer: () => 0, clearTimer: () => {} });
    d.beginChapter('seymour-flux', 'ffx');
    await r.settle();
    const run = d.begin(req('tidus', 'Hey!'));
    await r.settle();
    expect(run?.holdMs()).toBe(0);
  });

  it('a skipped scene starts nothing: the gated port refuses before the director sees the line', async () => {
    const r = await ready();
    let skipped = true;
    const port = gatedVoice(r.director, () => skipped);
    expect(port.begin(req('tidus', 'Hey!'))).toBeNull();
    expect(port.spokenMs(req('tidus', 'Hey!'))).toBe(0);
    await r.settle();
    expect(r.sources).toHaveLength(0);
    skipped = false;
    expect(port.begin(req('tidus', 'Hey!'))).not.toBeNull();
  });

  it('a new line stops the old one: a line never talks over the next', async () => {
    const r = await ready();
    const first = r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    r.director.begin(req('yuna', 'Yes.'));
    expect(first?.holdMs()).toBe(0);
    await r.settle();
    expect(r.sources).toHaveLength(2);
  });

  it('stop() ends the line in flight (skip, advance, teardown)', async () => {
    const r = await ready();
    const run = r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    r.director.stop();
    expect(run?.holdMs()).toBe(0);
  });
});

describe('ducking the music under a line', () => {
  async function playing() {
    const r = rig();
    r.director.beginChapter('seymour-flux', 'ffx');
    await r.settle();
    await r.settle();
    return r;
  }
  const finish = (r: Awaited<ReturnType<typeof playing>>) => r.sources[r.sources.length - 1]?.end();

  it('drops the music 3.5 dB over 120 ms when a line starts, and brings it back 400 ms after the last line, 600 ms on', async () => {
    const r = await playing();
    r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    expect(r.calls).toEqual([`duck:${VOICE_DUCK_GAIN}:${VOICE_DUCK_ATTACK_S}`]);
    expect(VOICE_DUCK_GAIN).toBeCloseTo(10 ** (-3.5 / 20), 2);
    finish(r);
    r.advance(VOICE_DUCK_HOLD_MS - 1);
    expect(r.calls).toHaveLength(1);
    r.advance(1);
    expect(r.calls).toEqual([`duck:${VOICE_DUCK_GAIN}:${VOICE_DUCK_ATTACK_S}`, `unduck:${VOICE_DUCK_RELEASE_S}`]);
  });

  it('keeps the duck between the lines of one exchange (less than 600 ms apart): no pumping', async () => {
    const r = await playing();
    r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    finish(r);
    r.advance(300);
    r.director.begin(req('yuna', 'Yes.'));
    await r.settle();
    r.advance(2000); // the first line's release timer was cancelled
    expect(r.calls).toEqual([`duck:${VOICE_DUCK_GAIN}:${VOICE_DUCK_ATTACK_S}`]);
    r.sources[r.sources.length - 1]?.end();
    r.advance(VOICE_DUCK_HOLD_MS);
    expect(r.calls.filter((c) => c.startsWith('unduck'))).toHaveLength(1);
  });

  it('ducks nothing for a line that never plays', async () => {
    const r = await playing();
    r.director.begin(req('tidus', 'Nobody recorded this.'));
    await r.settle();
    expect(r.calls).toEqual([]);
  });

  it('a pause freezes the line and leaves the music to the pause menu; resuming ducks again', async () => {
    const r = await playing();
    const run = r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    r.director.setPaused(true);
    expect(stateOf(run)).toBe('paused');
    r.advance(5000);
    expect(r.calls.filter((c) => c.startsWith('unduck'))).toEqual([]); // the pause menu ducks and unducks the music itself
    r.director.setPaused(false);
    expect(r.calls.filter((c) => c.startsWith('duck'))).toHaveLength(2);
    expect(r.sources).toHaveLength(2);
  });

  it('a hidden tab and the pause menu both hold the line; it resumes only when both let go', async () => {
    const r = await playing();
    const run = r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    r.director.setPaused(true, 'hidden');
    r.director.setPaused(true);
    r.director.setPaused(false);
    expect(stateOf(run)).toBe('paused');
    r.director.setPaused(false, 'hidden');
    expect(stateOf(run)).toBe('playing');
  });
});

describe('preloading a scene', () => {
  it('walks say and narrate steps through parallel and both legs of ifFlag, in play order', () => {
    const keys = scriptKeys([say('tidus', 'Hey!'), wait(100), parallel(say('yuna', 'Yes.')), ifFlag('f', [narrate('Once.')], [say('auron', 'Hmph.')])]);
    expect(keys).toEqual([lineKey('tidus', 'Hey!'), lineKey('yuna', 'Yes.'), lineKey('narrator', 'Once.'), lineKey('auron', 'Hmph.')]);
    expect(scriptKeys([say('yuna-x2', 'Um.', { voiceKey: 'doubled' })])).toEqual(['doubled']);
  });

  it('decodes the first voiced line and the four after it, skipping a line nobody recorded, then slides the window as lines begin', async () => {
    const r = rig();
    r.director.beginChapter('seymour-flux', 'ffx');
    await r.settle();
    await r.settle();
    const pre = () => r.requests.filter((p) => /pre\.\d+\.mp3$/.test(p)).map((p) => p.slice(-7, -4)).sort();
    r.director.prefetchScript([
      say('tidus', 'Hey!'), say('yuna', 'Yes.'), say('auron', 'Hmph.'), say('tidus', 'Unrecorded.'),
      say('auron', 'Pre four.'), say('auron', 'Pre five.'), say('auron', 'Pre six.'), say('auron', 'Pre seven.'),
    ]);
    await r.settle();
    await r.settle();
    expect(pre()).toEqual(['001', '002', '003', '004', '005']); // the unrecorded line is skipped over, not counted
    r.director.begin(req('tidus', 'Hey!')); // the four after line 1 are lines 2 to 5: already decoded
    await r.settle();
    expect(pre()).toEqual(['001', '002', '003', '004', '005']);
    r.director.begin(req('yuna', 'Yes.')); // now lines 3 to 6
    await r.settle();
    expect(pre()).toEqual(['001', '002', '003', '004', '005', '006']);
    r.director.begin(req('auron', 'Hmph.')); // and 4 to 7
    await r.settle();
    expect(pre()).toEqual(['001', '002', '003', '004', '005', '006', '007']);
  });
});

describe('the hook-up can be proved without ears', () => {
  it('debug() reports the chapter, the cache and the last plays', async () => {
    const r = rig();
    r.director.beginChapter('seymour-flux', 'ffx');
    await r.settle();
    await r.settle();
    r.director.begin(req('tidus', 'Hey!'));
    await r.settle();
    r.director.stop();
    const d = r.director.debug() as { chapter: string; asked: number; started: number; plays: Array<{ id: string; heard: boolean; why: string }>; cache: { buffers: number } };
    expect(d.chapter).toBe('seymour-flux');
    expect(d.asked).toBe(1);
    expect(d.started).toBe(1);
    expect(d.plays).toEqual([expect.objectContaining({ id: 'seymour-flux.pre.001', heard: true, why: 'stopped' })]);
    expect(d.cache.buffers).toBeGreaterThan(0);
  });
});
