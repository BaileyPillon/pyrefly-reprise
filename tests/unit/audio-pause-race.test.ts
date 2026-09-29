// @vitest-environment jsdom
/**
 * PR-0226 (critic round 15, R15-AUD-01): after a pause, the `pause` cue could
 * replace the battle theme for the rest of the fight.
 *
 * Proved cause: `AudioManager.playMusic` returned early for the cue already
 * playing **before** bumping its request id, so the resume call
 * `playMusic(previous)` did not cancel a `playMusic('pause')` still waiting on
 * its decode (the first pause of a session, Esc pressed twice within ~150 ms).
 * When the pause buffer landed it took the music slot, and every later pause
 * saw `current === 'pause'` and remembered nothing. A second path in the same
 * class: a pause while the battle cue was still decoding remembered the older
 * cue (`currentMusic`), cancelled the battle request, and resume brought back
 * the wrong one.
 *
 * These run the real `AudioManager` and the real `setPauseMusic` against a
 * fake context and a loader whose decodes the test resolves by hand.
 *
 * Game case: both (shared audio plumbing; FFX and FFX-2 battle and cutscene
 * screens call `setPauseMusic`; CHK-020).
 */
import { describe, expect, it } from 'vitest';

import { AudioManager } from '../../src/audio/AudioManager.ts';
import { PAUSE_CUE, setPauseMusic } from '../../src/ui/common/pauseMusic.ts';

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
    createBufferSource: () =>
      Object.assign(new FakeNode(), { start: () => {}, stop: () => {}, onended: null as unknown }),
  };
}

/** A manager whose decodes wait until `finish(name)` is called. */
function harness() {
  const am = new AudioManager({ useWorker: false, synthOnly: true });
  const raw = am as unknown as Record<string, unknown> & { loader: Record<string, unknown> };
  const ctx = fakeContext();
  raw['ctx'] = ctx;
  raw['musicBus'] = ctx.createGain();
  raw['loadManifest'] = async () => {};
  raw.loader['evict'] = () => {};
  const waiting = new Map<string, Array<() => void>>();
  raw.loader['load'] = (_ctx: unknown, name: string) =>
    new Promise((resolve) => {
      const list = waiting.get(name) ?? [];
      list.push(() => resolve({ buffer: {}, loopStart: 0, loopEnd: 1 }));
      waiting.set(name, list);
    });
  const flush = async (): Promise<void> => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };
  const finish = async (name: string): Promise<void> => {
    await flush();
    for (const done of waiting.get(name) ?? []) done();
    waiting.delete(name);
    await flush();
  };
  return { am, finish, flush };
}

describe('PR-0226: a pause cue that finishes decoding after resume never takes the music slot', () => {
  it('AudioManager: a no-op request for the cue already playing still cancels a pending different cue', async () => {
    const { am, finish } = harness();
    void am.playMusic('boss-seymour');
    await finish('boss-seymour');
    expect(am.currentMusic).toBe('boss-seymour');

    void am.playMusic('pause'); // left decoding
    void am.playMusic('boss-seymour'); // the cue already playing: returns early
    await finish('pause');
    expect(am.currentMusic).toBe('boss-seymour');
  });

  it('Esc, Esc within the decode on a cold first pause: the battle cue stays, and the next pause still works', async () => {
    const { am, finish } = harness();
    void am.playMusic('boss-ffx2-aeon');
    await finish('boss-ffx2-aeon');

    setPauseMusic(am, true);
    setPauseMusic(am, false);
    await finish(PAUSE_CUE);
    expect(am.currentMusic).toBe('boss-ffx2-aeon');

    // A later, slow pause: the menu plays `pause`, and resume brings the fight back.
    setPauseMusic(am, true);
    await finish(PAUSE_CUE);
    expect(am.currentMusic).toBe(PAUSE_CUE);
    setPauseMusic(am, false);
    await finish('boss-ffx2-aeon');
    expect(am.currentMusic).toBe('boss-ffx2-aeon');
  });

  it('a pause while the battle cue is still decoding comes back to the battle cue, not the scene before it', async () => {
    const { am, finish } = harness();
    void am.playMusic('title');
    await finish('title');
    void am.playMusic('boss-seymour'); // the battle chain's request, still decoding
    expect(am.requestedMusic).toBe('boss-seymour');

    setPauseMusic(am, true);
    setPauseMusic(am, false);
    await finish(PAUSE_CUE);
    await finish('boss-seymour');
    expect(am.currentMusic).toBe('boss-seymour');
  });

  it('a second pause press while the pause cue is still decoding does not remember `pause` as the cue to return to', async () => {
    const { am, finish } = harness();
    void am.playMusic('boss-seymour');
    await finish('boss-seymour');
    setPauseMusic(am, true);
    setPauseMusic(am, true); // pending `pause` counts as already paused
    setPauseMusic(am, false);
    await finish(PAUSE_CUE);
    expect(am.currentMusic).toBe('boss-seymour');
  });

  it('before the first gesture the queued cue is what a pause returns to', () => {
    const am = new AudioManager({ useWorker: false, synthOnly: true });
    void am.playMusic('title');
    expect(am.currentMusic).toBeNull();
    expect(am.requestedMusic).toBe('title');
    setPauseMusic(am, true);
    expect(am.requestedMusic).toBe(PAUSE_CUE);
    setPauseMusic(am, false);
    expect(am.requestedMusic).toBe('title');
  });
});
