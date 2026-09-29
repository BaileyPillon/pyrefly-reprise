// @vitest-environment jsdom
/**
 * fb-0929-sfx (Bailey's friend, 2026-09-29: "no sound effects on attacks so doesn't feel like I
 * did much"). The cues fire; the D-210 balance puts them under the score. D-210 is Bailey's
 * adopted decision, so the fix is a comparison switch, `?sfxmix=a|b|c`, default off:
 *
 * - no parameter (or `a`, or anything unknown) is exactly the shipped mix: SFX bus 0.35 at the
 *   new-profile default, the saved slider unchanged;
 * - `b` is +6 dB and `c` +10 dB on the SFX bus, on top of the slider, never saved.
 *
 * Game case: both (shared mixer; CHK-020).
 */
import { afterEach, describe, expect, it } from 'vitest';

import { AudioManager } from '../../src/audio/AudioManager.ts';
import { SFX_MIXES, sfxBusGain, sfxMixFromUrl } from '../../src/audio/sfxMix.ts';

const db = (x: number): number => 20 * Math.log10(x);

describe('?sfxmix= comparison switch', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('defaults to the shipped D-210 mix for no, empty or unknown values', () => {
    for (const q of ['', '?sfxmix=', '?sfxmix=z', '?wait=split', '?sfxmix=A']) {
      const m = sfxMixFromUrl(q);
      if (q === '?sfxmix=A') expect(m.option).toBe('a');
      else expect(m).toEqual(SFX_MIXES.a);
    }
    expect(sfxBusGain(0.35, SFX_MIXES.a)).toBeCloseTo(0.35, 6);
  });

  it('b is +6 dB and c is +10 dB on the effects bus', () => {
    expect(db(sfxMixFromUrl('?sfxmix=b').trim)).toBeCloseTo(6.02, 1);
    expect(db(sfxMixFromUrl('?sfxmix=c').trim)).toBeCloseTo(10, 1);
    expect(sfxBusGain(0.35, SFX_MIXES.b)).toBeCloseTo(0.7, 6);
  });

  it('the manager reports and applies the option; the default leaves D-210 untouched', () => {
    const shipped = new AudioManager({ useWorker: false, synthOnly: true });
    expect(shipped.debug().volumes.sfx).toBe(0.35);
    expect(shipped.debug().sfxMix).toEqual({ option: 'a', trim: 1, busGain: 0.35 });

    window.history.replaceState(null, '', '/?sfxmix=b');
    const louder = new AudioManager({ useWorker: false, synthOnly: true });
    // The saved slider is not touched; only the bus gain moves.
    expect(louder.debug().volumes.sfx).toBe(0.35);
    expect(louder.debug().sfxMix.option).toBe('b');
    expect(louder.debug().sfxMix.busGain).toBeCloseTo(0.7, 6);
    louder.setSfxVolume(0.5);
    expect(louder.debug().sfxMix.busGain).toBeCloseTo(1, 6);
  });
});
