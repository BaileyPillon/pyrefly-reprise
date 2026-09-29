/**
 * `?sfxmix=` — a comparison switch for the sound-effect balance (fb-0929-sfx).
 *
 * Bailey's friend, 2026-09-29: "no sound effects on attacks so doesn't feel
 * like I did much". Measured (docs/handoff/fb-0929-sfx.md): every attack, hit,
 * spell, heal and KO cue does fire, but at the D-210 default (SFX bus 0.35
 * against a 0.7 music bus) an attack's loudest 43 ms sits at about the music's
 * average level and its peak about 10 dB under the music's peaks, so the score
 * masks it. D-210 is Bailey's adopted decision, so this switch does not change
 * it: it offers measured alternatives to hear side by side, and the default
 * (`a`, or no parameter) is exactly the shipped mix.
 *
 * The trim multiplies the SFX bus on top of the player's own slider; it is
 * never saved, and it changes no per-cue level. Both games (shared mixer).
 */

export type SfxMixOption = 'a' | 'b' | 'c';

export interface SfxMix {
  option: SfxMixOption;
  /** What it is, in words Bailey can pick from. */
  label: string;
  /** Linear gain on the SFX bus, on top of the saved SFX volume. */
  trim: number;
}

export const SFX_MIXES: Readonly<Record<SfxMixOption, SfxMix>> = {
  a: { option: 'a', label: 'D-210 as shipped (effects bus 0.35)', trim: 1 },
  b: { option: 'b', label: 'Effects +6 dB (bus 0.70, level with the music bus)', trim: 2 },
  c: { option: 'c', label: 'Effects +10 dB (attack peaks level with the music peaks)', trim: 3.162 },
};

/** The option named by `?sfxmix=`, or `a` (the shipped mix) for anything else. */
export function sfxMixFromUrl(search: string = globalThis.location?.search ?? ''): SfxMix {
  try {
    const v = new URLSearchParams(search).get('sfxmix')?.trim().toLowerCase();
    if (v === 'a' || v === 'b' || v === 'c') return SFX_MIXES[v];
  } catch {
    /* no location: the shipped mix */
  }
  return SFX_MIXES.a;
}

/** The SFX bus gain for a saved volume under a mix. */
export function sfxBusGain(volume: number, mix: SfxMix): number {
  return Math.max(0, volume) * mix.trim;
}
