/**
 * The recordings in memory: manifest fetches, decoded buffers, the cache that holds them. No browser: the network and the decoder
 * are injected. Game case: both (shared plumbing).
 */
import { describe, expect, it } from 'vitest';

import { VoiceBank, type DecodedVoice, type VoiceBankDeps } from '../../src/audio/voice/VoiceBank.ts';

const buf = (frames: number): DecodedVoice => ({ length: frames, numberOfChannels: 1, duration: frames / 48000 });
const manifest = { version: 1, chapter: 'seymour-flux', game: 'ffx', lines: { aaa: { id: 'seymour-flux.pre.001', file: 'seymour-flux/a.mp3', ms: 1000, who: 'tidus' } } };

function deps(over: Partial<VoiceBankDeps<DecodedVoice>> = {}, frames = 1000): { deps: VoiceBankDeps<DecodedVoice>; fetched: string[]; decoded: number } {
  const state = { fetched: [] as string[], decoded: 0 };
  return {
    get fetched() { return state.fetched; },
    get decoded() { return state.decoded; },
    deps: {
      fetchJson: async (p) => { state.fetched.push(p); return manifest; },
      fetchBytes: async (p) => { state.fetched.push(p); return new ArrayBuffer(8); },
      decode: async () => { state.decoded++; return buf(frames); },
      ...over,
    },
  };
}

describe('chapter manifests', () => {
  it('fetches once however many ask, and answers entries once loaded', async () => {
    const d = deps();
    const bank = new VoiceBank(d.deps);
    expect(bank.entry('seymour-flux', 'aaa')).toBeNull(); // not loaded yet: the line is text only
    const [a, b] = await Promise.all([bank.loadChapter('seymour-flux'), bank.loadChapter('seymour-flux')]);
    expect(a).toBe(b);
    expect(d.fetched).toEqual(['voice/seymour-flux.json']);
    expect(bank.entry('seymour-flux', 'aaa')?.id).toBe('seymour-flux.pre.001');
    expect(bank.entry(null, 'aaa')).toBeNull();
    expect(bank.entry('seymour-flux', 'zzz')).toBeNull();
    await bank.loadChapter('seymour-flux');
    expect(d.fetched).toHaveLength(1);
  });

  it('remembers a miss (a 404, an HTML fallback, a throw) so the chapter is not asked again', async () => {
    let calls = 0;
    const bank = new VoiceBank<DecodedVoice>({ ...deps().deps, fetchJson: async () => { calls++; return '<!doctype html>'; } });
    expect(await bank.loadChapter('yunalesca')).toBeNull();
    expect(await bank.loadChapter('yunalesca')).toBeNull();
    expect(calls).toBe(1);
    const throwing = new VoiceBank<DecodedVoice>({ ...deps().deps, fetchJson: async () => { throw new Error('offline'); } });
    expect(await throwing.loadChapter('yunalesca')).toBeNull();
  });
});

describe('buffers', () => {
  it('fetches and decodes a file once for any number of callers, in flight or after', async () => {
    const d = deps();
    const bank = new VoiceBank(d.deps);
    const [a, b] = await Promise.all([bank.ensure('x/a.mp3'), bank.ensure('x/a.mp3')]);
    expect(a).toBe(b);
    expect(await bank.ensure('x/a.mp3')).toBe(a);
    expect(bank.peek('x/a.mp3')).toBe(a);
    expect(d.fetched).toEqual(['voice/x/a.mp3']);
    expect(d.decoded).toBe(1);
  });

  it('answers null for a file that would not come, and tries again at the next line (an offline blip is not forever)', async () => {
    let fail = true;
    const d = deps({ fetchBytes: async () => (fail ? null : new ArrayBuffer(8)) });
    const bank = new VoiceBank<DecodedVoice>(d.deps);
    expect(await bank.ensure('x/a.mp3')).toBeNull();
    fail = false;
    expect(await bank.ensure('x/a.mp3')).not.toBeNull();
    const throwing = new VoiceBank<DecodedVoice>({ ...deps().deps, fetchBytes: async () => { throw new Error('offline'); } });
    expect(await throwing.ensure('x/b.mp3')).toBeNull();
  });

  it('answers null for a file that came but would not decode, remembers it, and tries again only after retry()', async () => {
    let good = false;
    const d = deps({ decode: async () => (good ? buf(1000) : null) });
    const bank = new VoiceBank<DecodedVoice>(d.deps);
    expect(await bank.ensure('x/a.mp3')).toBeNull();
    good = true;
    expect(await bank.ensure('x/a.mp3')).toBeNull(); // a bad file is not fetched again on every line
    expect(d.fetched).toEqual(['voice/x/a.mp3']);
    bank.retry('x/a.mp3');
    expect(await bank.ensure('x/a.mp3')).not.toBeNull();
  });

  it('evicts the least recently used unpinned buffer when over its cap', async () => {
    // each buffer is 1000 frames x 4 bytes = 4000 bytes; the cap holds two
    const bank = new VoiceBank(deps().deps, 8000);
    await bank.ensure('a.mp3');
    await bank.ensure('b.mp3');
    bank.peek('a.mp3'); // a is now newer than b
    await bank.ensure('c.mp3');
    expect(bank.peek('b.mp3')).toBeNull();
    expect(bank.peek('a.mp3')).not.toBeNull();
    expect(bank.peek('c.mp3')).not.toBeNull();
    expect(bank.decodedBytes).toBe(8000);
  });

  it('never evicts a pinned buffer (a chapter\'s mid-battle lines), even over the cap', async () => {
    const bank = new VoiceBank(deps().deps, 8000);
    bank.pin(['a.mp3', 'b.mp3']);
    await bank.ensure('a.mp3');
    await bank.ensure('b.mp3');
    await bank.ensure('c.mp3');
    await bank.ensure('d.mp3');
    expect(bank.peek('a.mp3')).not.toBeNull();
    expect(bank.peek('b.mp3')).not.toBeNull();
    expect(bank.stats().pinned).toBe(2);
    bank.pin([]);
    await bank.ensure('e.mp3');
    expect(bank.decodedBytes).toBeLessThanOrEqual(8000);
  });

  it('clear() forgets everything', async () => {
    const bank = new VoiceBank(deps().deps);
    await bank.loadChapter('seymour-flux');
    await bank.ensure('a.mp3');
    bank.clear();
    expect(bank.peek('a.mp3')).toBeNull();
    expect(bank.manifest('seymour-flux')).toBeNull();
    expect(bank.stats().buffers).toBe(0);
  });
});
