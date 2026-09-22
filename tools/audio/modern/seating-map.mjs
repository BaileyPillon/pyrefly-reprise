/**
 * Sketch A's seating map: every instrument name a score channel uses in the
 * two audition cues, resolved to real multi-layer SFZ patches and a seat.
 *
 * The same names the shipped presets use (src/audio/voices/presets), so no
 * score changes; only what plays them. VSCO 2 CE first; VCSL (via
 * vcsl-kit.mjs) where VSCO has no hi-hat or toms; the existing SF2 voices
 * where neither CC0 library has the instrument at all (electric bass, sub,
 * Rhodes, supersaw, celesta) — those are listed as `band` and say so.
 *
 * A layer is one desk: one patch, one seat, one gain. A preset that stacked
 * three Sonatina desks (violins I, violins II, violas) is three VSCO desks
 * here, each rendered with its own humanisation seed, so they are not
 * together to the sample the way one trigger is.
 *
 * Per layer:
 *   sfz      patch file under vsco2-ce-sfz, or 'vcsl:hihat' / 'vcsl:toms'
 *   artic    [{ maxSec, sfz }]: notes up to maxSec long use that patch instead
 *            (a stab held for a beat is a sustain, not a staccato cut off)
 *   keys     [lo, hi]: this desk only plays notes in that range
 *   seat     a seat in src/audio/voices/presets/seating.ts
 *   gain     linear, relative to the other desks of this instrument
 *   xfade    crossfade the patch's velocity layers on CC1 (sustains)
 *   legato   slurred notes use the wrapper's trigger=legato regions
 *   tune     cents, for a second desk of the same patch
 *   drum     { key, longKey, longSec } fixed-key percussion
 */

const SECTION_LEAN_MS = { violins: 0, violas: 2, cellos: 6, basses: 10, horns: 10, trombones: 8, trumpets: 4, winds: 0, timpani: 4, kit: 0 };

export const MODERN_MAP = {
  strings: {
    role: 'sustain',
    about: 'VSCO violin section + viola section sustain (vibrato), cellos under G3',
    layers: [
      { sfz: 'ViolinEnsSusVib.sfz', seat: 'violin-1', gain: 1.0, keys: [55, 127], xfade: true, legato: true, lean: SECTION_LEAN_MS.violins },
      { sfz: 'ViolaEnsSusVib.sfz', seat: 'viola', gain: 0.55, keys: [48, 88], xfade: true, legato: true, lean: SECTION_LEAN_MS.violas },
      { sfz: 'CelloEnsSusVib.sfz', seat: 'cello', gain: 0.9, keys: [0, 54], xfade: true, legato: true, lean: SECTION_LEAN_MS.cellos },
    ],
  },
  'strings-low': {
    role: 'sustain',
    about: 'VSCO cello section + contrabass (unison, as the SF2 preset doubled them)',
    layers: [
      { sfz: 'CelloEnsSusVib.sfz', seat: 'cello', gain: 1.0, keys: [0, 82], xfade: true, legato: true, lean: SECTION_LEAN_MS.cellos },
      { sfz: 'ContrabassSusVB.sfz', seat: 'bass', gain: 0.6, keys: [0, 62], xfade: true, legato: true, lean: SECTION_LEAN_MS.basses },
    ],
  },
  'strings-short': {
    role: 'short',
    about: 'VSCO violin spiccato over violin pizzicato, viola spiccato doubling',
    layers: [
      { sfz: 'ViolinEnsSpic.sfz', seat: 'violin-1', gain: 1.0, keys: [55, 127], lean: SECTION_LEAN_MS.violins },
      { sfz: 'ViolinEnsPizz.sfz', seat: 'violin-2', gain: 0.55, keys: [55, 127], lean: SECTION_LEAN_MS.violins },
      { sfz: 'ViolaEnsSpic.sfz', seat: 'viola', gain: 0.4, keys: [48, 88], lean: SECTION_LEAN_MS.violas },
    ],
  },
  brass: {
    role: 'sustain',
    about: 'VSCO horn a2 (two desks) over tenor trombone',
    layers: [
      { sfz: 'FHornSus.sfz', seat: 'horn', gain: 1.0, xfade: true, legato: true, lean: SECTION_LEAN_MS.horns, tune: -4 },
      { sfz: 'FHornSus.sfz', seat: 'horn', gain: 0.8, xfade: true, legato: true, lean: SECTION_LEAN_MS.horns + 4, tune: 5, desk: 2 },
      { sfz: 'TromboneSus.sfz', seat: 'trombone', gain: 0.55, keys: [0, 72], xfade: true, legato: true, lean: SECTION_LEAN_MS.trombones },
    ],
  },
  'brass-stab': {
    role: 'short',
    about: 'VSCO trumpet staccato over trombone staccato; held notes switch to sustain',
    layers: [
      { sfz: 'TrumpetStac.sfz', artic: [{ maxSec: 0.42, sfz: 'TrumpetStac.sfz' }, { maxSec: Infinity, sfz: 'TrumpetSus.sfz' }], seat: 'trumpet', gain: 1.0, keys: [50, 127], lean: SECTION_LEAN_MS.trumpets },
      { sfz: 'TromboneStac.sfz', artic: [{ maxSec: 0.42, sfz: 'TromboneStac.sfz' }, { maxSec: Infinity, sfz: 'TromboneSus.sfz' }], seat: 'trombone', gain: 0.75, keys: [0, 72], lean: SECTION_LEAN_MS.trombones },
    ],
  },
  flute: {
    role: 'solo',
    about: 'VSCO solo flute, sustain with vibrato',
    layers: [{ sfz: 'FluteSusVib.sfz', seat: 'flute', gain: 1.0, xfade: true, legato: true, lean: SECTION_LEAN_MS.winds }],
  },
  timpani: {
    role: 'drum',
    about: 'VSCO timpani, 2-3 dynamics x 2 takes',
    layers: [{ sfz: 'Timpani.sfz', seat: 'timpani', gain: 1.0, extend: 3, lean: SECTION_LEAN_MS.timpani }],
  },
  kick: {
    role: 'drum',
    about: 'VSCO concert bass drum (GM-StylePerc key 36): 7 dynamics x 2 takes',
    layers: [{ sfz: 'GM-StylePerc.sfz', seat: 'percussion-low', gain: 1.0, drum: { key: 36 }, extend: 0, lean: SECTION_LEAN_MS.kit }],
  },
  snare: {
    role: 'drum',
    about: 'VSCO snare (key 38, 5 dynamics x 2 takes); a long note is the roll (key 39)',
    layers: [{ sfz: 'GM-StylePerc.sfz', seat: 'percussion', gain: 1.0, drum: { key: 38, longKey: 39, longSec: 0.45 }, extend: 0, lean: SECTION_LEAN_MS.kit }],
  },
  crash: {
    role: 'drum',
    about: 'VSCO clash cymbals (key 49, 4 dynamics x 2 takes); long = suspended-cymbal swell',
    layers: [{ sfz: 'GM-StylePerc.sfz', seat: 'percussion', gain: 1.0, drum: { key: 49, longKey: 48, longSec: 0.7 }, extend: 0, lean: SECTION_LEAN_MS.kit }],
  },
  hat: {
    role: 'drum',
    about: 'VCSL hi-hat: closed 4 dynamics x 2 takes; a note over 0.16 s opens it',
    layers: [{ sfz: 'vcsl:hihat', seat: 'band-kit', gain: 1.0, drum: { key: 42, longKey: 46, longSec: 0.16 }, extend: 0, lean: SECTION_LEAN_MS.kit }],
  },
  tom: {
    role: 'drum',
    about: 'VCSL high and low toms: 3 dynamics x 2 takes each, following the written pitch',
    layers: [{ sfz: 'vcsl:toms', seat: 'band-kit', gain: 1.0, extend: 0, lean: SECTION_LEAN_MS.kit }],
  },

  // --- no CC0 SFZ equivalent on disk: the existing SF2 voices, performed by
  // the same model (phrase velocity, per-occurrence seeds, humanised onsets).
  bass: { role: 'band', about: 'SF2 fingered bass (FluidR3) — no CC0 electric bass on disk' },
  'bass-sub': { role: 'band', about: 'SF2 sub (FluidR3) — felt, not heard' },
  epiano: { role: 'band', about: 'SF2 Rhodes (FluidR3) — no CC0 electric piano on disk' },
  supersaw: { role: 'band', about: 'SF2 saw stacks (FluidR3) — a synth by design' },
  celesta: { role: 'band', about: 'SF2 celesta (FluidR3) — neither VSCO 2 CE nor VCSL has one' },
};

export function modernEntry(instrument) {
  const entry = MODERN_MAP[instrument];
  if (!entry) {
    throw new Error(`Sketch A has no modern seating for "${instrument}" — add it to tools/audio/modern/seating-map.mjs`);
  }
  return entry;
}
