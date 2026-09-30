/**
 * The sound-effect balance, and `?sfxmix=`, its comparison switch.
 *
 * Bailey's friend, 2026-09-29: "no sound effects on attacks so doesn't feel
 * like I did much". Measured (docs/handoff/fb-0929-sfx.md): every attack, hit,
 * spell, heal and KO cue fired, but at the D-210 default (SFX 0.35 against a
 * 0.7 music bus) an attack's loudest 43 ms sat at about the music's average and
 * its peak 4 to 6 dB under the music's peaks, so the score masked it.
 *
 * **D-293** (Bailey, 2026-09-29 ~23:00 EDT, "yes, all your recommendations"):
 * option b, effects +6 dB against the D-210 default, is now the default. The
 * +6 dB lives in the new-profile SFX volume ({@link SFX_DEFAULT_VOLUME}, 0.70 =
 * 0.35 x 2), not in a trim, so a volume the player set is never doubled and the
 * slider shows what plays (docs/plans/sfx-b-review.md).
 *
 * The switch stays for comparison, re-based on the new default: `a` halves the
 * bus (-6 dB: at the default slider exactly D-210's 0.35), `b` (or no
 * parameter) is the shipped mix, `c` is +4 dB more (at the default slider the
 * same bus as the old `c`). The trim multiplies the SFX bus on top of the
 * player's own slider; it is never saved and changes no per-cue level.
 * Both games (shared mixer).
 */

export type SfxMixOption = 'a' | 'b' | 'c';

export interface SfxMix {
  option: SfxMixOption;
  /** What it is, in words Bailey can pick from. */
  label: string;
  /** Linear gain on the SFX bus, on top of the saved SFX volume. */
  trim: number;
}

/** D-210's new-profile SFX volume (2026-09-26), effects about 6 dB under the music's peaks. */
export const D210_SFX_VOLUME = 0.35;

/** D-293's new-profile SFX volume: D-210's +6 dB, a hit level with the music's peaks. */
export const SFX_DEFAULT_VOLUME = 0.7;

export const SFX_MIXES: Readonly<Record<SfxMixOption, SfxMix>> = {
  a: { option: 'a', label: 'D-210, the old balance (effects -6 dB: bus 0.35 at the default slider)', trim: 0.5 },
  b: { option: 'b', label: 'D-293, shipped (effects bus 0.70 at the default slider, level with the music bus)', trim: 1 },
  c: { option: 'c', label: 'Effects +4 dB more (bus 1.11 at the default slider: attack peaks over the music)', trim: 1.581 },
};

/** The option named by `?sfxmix=`, or `b` (the shipped D-293 mix) for anything else. */
export function sfxMixFromUrl(search: string = globalThis.location?.search ?? ''): SfxMix {
  try {
    const v = new URLSearchParams(search).get('sfxmix')?.trim().toLowerCase();
    if (v === 'a' || v === 'b' || v === 'c') return SFX_MIXES[v];
  } catch {
    /* no location: the shipped mix */
  }
  return SFX_MIXES.b;
}

/** The SFX bus gain for a saved volume under a mix. */
export function sfxBusGain(volume: number, mix: SfxMix): number {
  return Math.max(0, volume) * mix.trim;
}
