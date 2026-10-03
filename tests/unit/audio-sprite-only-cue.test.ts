// @vitest-environment jsdom
/**
 * PR-0326 (critic round 19, CHK-001 step 3; both games): the title's press-start cue is the very
 * press that unlocks audio, so the first-bank sprite has not decoded when it fires and
 * `playSfx` used to answer it from the procedural synth (27 of 27 runs). `playSfxFromSprite`
 * waits for the decode (bounded) and plays nothing when the sprite never arrives.
 */
import { describe, expect, it, vi } from 'vitest';

import { AudioManager } from '../../src/audio/AudioManager.ts';

interface Inner {
  ctx: unknown;
  manifest: unknown;
  manifestLoad: Promise<void>;
  sprites: { v1: unknown; firstBank: Promise<void> | null };
}

const CUE = { offset: 1, duration: 0.5 };
const manifestWith = (sfx: boolean): unknown => ({
  sfx: sfx ? { file: 'sfx/sprite.mp3', cues: { 'battle-start': CUE } } : null,
  sfxV2: null,
});

function manager(opts: { sprite: boolean; manifest: unknown }): { audio: AudioManager; inner: Inner; play: ReturnType<typeof vi.fn> } {
  const audio = new AudioManager({ useWorker: false, synthOnly: true });
  const inner = audio as unknown as Inner;
  inner.ctx = {};
  inner.manifest = opts.manifest;
  inner.manifestLoad = Promise.resolve();
  inner.sprites.v1 = opts.sprite ? ({} as AudioBuffer) : null;
  const play = vi.fn();
  (audio as unknown as { playSfx: unknown }).playSfx = play;
  return { audio, inner, play };
}

describe('the press-start cue plays from its sprite or not at all (PR-0326)', () => {
  it('a decoded sprite plays the cue at once', async () => {
    const { audio, play } = manager({ sprite: true, manifest: manifestWith(true) });
    expect(await audio.playSfxFromSprite('battle-start')).toBe(true);
    expect(play).toHaveBeenCalledWith('battle-start', {});
  });

  it('a sprite that decodes within the wait plays the cue after the decode, never the synth before it', async () => {
    const { audio, inner, play } = manager({ sprite: false, manifest: manifestWith(true) });
    let finish: () => void = () => undefined;
    inner.sprites.firstBank = new Promise<void>((resolve) => { finish = resolve; });
    const result = audio.playSfxFromSprite('battle-start');
    await Promise.resolve();
    expect(play, 'nothing plays while the sprite is still decoding').not.toHaveBeenCalled();
    inner.sprites.v1 = {} as AudioBuffer;
    finish();
    expect(await result).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('a sprite that never decodes plays nothing at the cap, and so does a cue the sprite lacks', async () => {
    const slow = manager({ sprite: false, manifest: manifestWith(true) });
    slow.inner.sprites.firstBank = new Promise<void>(() => undefined);
    expect(await slow.audio.playSfxFromSprite('battle-start', {}, 20)).toBe(false);
    expect(slow.play).not.toHaveBeenCalled();

    const lacking = manager({ sprite: true, manifest: { sfx: { file: 'sfx/sprite.mp3', cues: {} }, sfxV2: null } });
    expect(await lacking.audio.playSfxFromSprite('battle-start')).toBe(false);
    expect(lacking.play).not.toHaveBeenCalled();
  });

  it('with no audio context nothing plays, and with no sprite in the build at all the synth is the design and plays', async () => {
    const none = manager({ sprite: false, manifest: null });
    (none.inner as { ctx: unknown }).ctx = null;
    expect(await none.audio.playSfxFromSprite('battle-start')).toBe(false);

    const synthBuild = manager({ sprite: false, manifest: manifestWith(false) });
    expect(await synthBuild.audio.playSfxFromSprite('battle-start')).toBe(true);
    expect(synthBuild.play).toHaveBeenCalledTimes(1);
  });
});
