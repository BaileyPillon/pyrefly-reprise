// @vitest-environment jsdom
/**
 * fb-0929-sfx (Bailey's friend, 2026-09-29: "no sound effects on attacks so doesn't feel like I
 * did much"), then D-293 (Bailey, 2026-09-29 ~23:00 EDT, "yes, all your recommendations"):
 * balance b is the default. The +6 dB lives in the new-profile SFX volume (0.70); the
 * `?sfxmix=` comparison switch stays, re-based on it:
 *
 * - no parameter (or `b`, or anything unknown) is the shipped D-293 mix: trim 1;
 * - `a` is D-210's old balance: -6 dB, so at the default slider the bus is exactly 0.35;
 * - `c` is +4 dB more: at the default slider the same bus (1.107) the old `c` gave;
 * - on top of the slider, never saved.
 *
 * Game case: both (shared mixer; CHK-020).
 */
import { afterEach, describe, expect, it } from 'vitest';

import { AudioManager } from '../../src/audio/AudioManager.ts';
import { D210_SFX_VOLUME, SFX_DEFAULT_VOLUME, SFX_MIXES, sfxBusGain, sfxMixFromUrl } from '../../src/audio/sfxMix.ts';

const db = (x: number): number => 20 * Math.log10(x);

describe('?sfxmix= comparison switch, re-based on the D-293 default', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('defaults to the shipped D-293 mix (b, trim 1) for no, empty or unknown values', () => {
    for (const q of ['', '?sfxmix=', '?sfxmix=z', '?wait=split', '?sfxmix=B']) {
      expect(sfxMixFromUrl(q)).toEqual(SFX_MIXES.b);
    }
    expect(SFX_MIXES.b.trim).toBe(1);
    expect(sfxBusGain(SFX_DEFAULT_VOLUME, SFX_MIXES.b)).toBeCloseTo(0.7, 6);
  });

  it('the new default is D-210 +6 dB, and a gives back exactly the D-210 bus', () => {
    expect(db(SFX_DEFAULT_VOLUME / D210_SFX_VOLUME)).toBeCloseTo(6.02, 1);
    expect(db(sfxMixFromUrl('?sfxmix=a').trim)).toBeCloseTo(-6.02, 1);
    expect(sfxBusGain(SFX_DEFAULT_VOLUME, SFX_MIXES.a)).toBeCloseTo(D210_SFX_VOLUME, 6);
  });

  it('c is the same bus the old c gave at the default slider (0.35 x 3.162)', () => {
    expect(sfxBusGain(SFX_DEFAULT_VOLUME, sfxMixFromUrl('?sfxmix=c'))).toBeCloseTo(0.35 * 3.162, 3);
    expect(db(SFX_MIXES.c.trim)).toBeCloseTo(3.98, 1);
  });

  it('the manager reports and applies the option; the slider is never touched', () => {
    const shipped = new AudioManager({ useWorker: false, synthOnly: true });
    expect(shipped.debug().volumes.sfx).toBe(0.7);
    expect(shipped.debug().sfxMix).toEqual({ option: 'b', trim: 1, busGain: 0.7 });

    window.history.replaceState(null, '', '/?sfxmix=a');
    const old = new AudioManager({ useWorker: false, synthOnly: true });
    expect(old.debug().volumes.sfx).toBe(0.7);
    expect(old.debug().sfxMix.option).toBe('a');
    expect(old.debug().sfxMix.busGain).toBeCloseTo(0.35, 6);
    old.setSfxVolume(0.5);
    expect(old.debug().sfxMix.busGain).toBeCloseTo(0.25, 6);
  });
});
