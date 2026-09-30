/**
 * What the credits panel lists (D-305: Bailey, 2026-09-30, option O1 — a
 * CREDITS row under ABOUT in the pause OPTIONS tab).
 *
 * Content and grouping follow the approved frames
 * (`docs/concepts/credits-2026-09-30/o1-panel*.jpg`) and the compiled list
 * beside them (`credits.md`): MUSIC, SOUND EFFECTS, TYPE, ART AND TOOLS, then
 * the fan-work notice. Inside a group the entries whose licence demands
 * attribution come first (`credits.md`: "REQUIRED first").
 *
 * One addition to the frames: a REQUIRED entry carries a quiet `note` with the
 * source (and, for the Arvedi hall, the full author list and what was changed),
 * which is what CC BY 4.0 asks a credit to give "to the extent reasonably
 * practicable" and what `docs/audio/CREDITS.md`'s verbatim lines carry.
 *
 * Pure data. `tests/unit/credits-attribution.test.ts` holds it to
 * `audioSources.ts`, `docs/audio/CREDITS.md` and the audio manifest.
 *
 * Game case: both (one list for the whole product; FFX and FFX-2 pause screens
 * both show it).
 */

import { AUDIO_SOURCES, requiresAttribution, type AudioSourceId } from './audioSources.ts';

export interface CreditEntry {
  /** The work, as the frames print it (upper-cased by the stylesheet). */
  title: string;
  /** Who made it. */
  by: string;
  /** The licence, as printed. */
  licence: string;
  /** The licence asks for this line; everything else is a courtesy. */
  required?: boolean;
  /** A quieter third line: the source, and any change we made. */
  note?: string;
  /** The audio sources this line credits (`audioSources.ts`). */
  sources?: readonly AudioSourceId[];
}

export interface CreditGroup {
  id: string;
  heading: string;
  entries: readonly CreditEntry[];
}

const COMMONS = 'Wikimedia Commons';

export const CREDIT_GROUPS: readonly CreditGroup[] = [
  {
    id: 'music',
    heading: 'Music',
    entries: [
      { title: 'Salamander Grand Piano', by: 'Alexander Holm', licence: 'CC BY 3.0', required: true, note: 'freepats.zenvoid.org', sources: ['salamander'] },
      {
        title: 'Sonatina Symphonic Orchestra',
        by: 'Mattias Westlund',
        licence: 'CC Sampling Plus 1.0',
        required: true,
        note: 'SF2 conversion by Symphony2',
        sources: ['sonatina'],
      },
      { title: 'DRSKit 2.1', by: 'DrumGizmo team and Jes Eiler', licence: 'CC BY 4.0', required: true, note: 'Deva, Lars Muldjord; Jes Eiler of DRSDrums; drumgizmo.org', sources: ['drskit'] },
      {
        title: 'Arvedi Auditorium impulse responses',
        by: 'F. Miotello and colleagues',
        licence: 'CC BY 4.0',
        required: true,
        note:
          '“The Sound of the Violin’s Home: A Higher-Order Room Impulse Response Dataset of the Arvedi Auditorium in Cremona”, ' +
          'F. Miotello, G. Greco, P. Ostan, F. Del Gaudio, L. Comanducci, R. Malvermi, M. Pezzoli, F. Antonacci; ' +
          'Zenodo, doi:10.5281/zenodo.20098848; decoded to stereo, direct sound removed',
        sources: ['arvedi'],
      },
      { title: 'FluidR3 GM soundfont', by: 'Frank Wen', licence: 'MIT', sources: ['fluidr3'] },
      { title: 'Impulse responses', by: 'Aleksey Vaneev, Voxengo', licence: 'Free licence', sources: ['voxengo'] },
      { title: 'VSCO 2 Community Edition, VCSL', by: 'Versilian Studios', licence: 'CC0', sources: ['vsco2', 'vcsl'] },
      { title: 'Black And Blue Basses, Shinyguitar, cello', by: 'Karoryfer Samples, bigcat', licence: 'CC0', sources: ['karoryfer'] },
      { title: 'jRhodes3d', by: 'Jeff Learman', licence: 'CC0', sources: ['jrhodes3d'] },
      { title: 'Surge XT', by: 'Surge Synth Team', licence: 'GPL-3', sources: ['surge'] },
      { title: 'ACE-Step v1 and 1.5', by: 'ACE Studio and StepFun', licence: 'Apache-2.0, MIT', sources: ['ace-step-v1', 'ace-step-15'] },
    ],
  },
  {
    id: 'sfx',
    heading: 'Sound effects',
    entries: [
      { title: 'Thunderclap', by: 'Richard Humphries', licence: 'CC BY 4.0', required: true, note: COMMONS, sources: ['thunderclap'] },
      { title: 'Bonfire ignition', by: 'Work With Sounds / Werstas', licence: 'CC BY 4.0', required: true, note: COMMONS, sources: ['bonfire'] },
      { title: 'Glass breaking', by: 'Gravity Sound', licence: 'CC BY 4.0', required: true, note: COMMONS, sources: ['glass'] },
      { title: 'Impact, RPG, interface and sci-fi sounds', by: 'Kenney', licence: 'CC0', sources: ['kenney'] },
      { title: 'RPG, impact, splash, bang, metal and wood effects', by: 'rubberduck', licence: 'CC0', sources: ['rubberduck'] },
      { title: 'Swishes, RPG sound pack', by: 'artisticdude', licence: 'CC0', sources: ['artisticdude'] },
      { title: 'Sword effects', by: 'StarNinjas', licence: 'CC0', sources: ['starninjas'] },
      { title: 'Tiger, ocean, wind chime', by: 'schots, Jarrod Stanley, Membeth', licence: 'CC0', sources: ['tiger', 'ocean', 'windchime'] },
      { title: 'Grizzly bear vocalizations', by: 'NPS and MSU Acoustic Atlas, Jennifer Jerrett', licence: 'Public domain', sources: ['grizzly'] },
    ],
  },
  {
    id: 'type',
    heading: 'Type',
    entries: [
      { title: 'Chakra Petch, Cormorant Garamond, Exo 2', by: 'Their Project Authors', licence: 'SIL OFL 1.1' },
      { title: 'Rajdhani', by: 'Indian Type Foundry', licence: 'SIL OFL 1.1' },
      { title: 'Silkscreen, M PLUS Rounded 1c', by: 'Their Project Authors', licence: 'SIL OFL 1.1' },
    ],
  },
  {
    id: 'art',
    heading: 'Art and tools',
    entries: [
      { title: 'Animagine XL 4.0 Opt', by: 'Painted art made with it', licence: 'Open RAIL++-M' },
      { title: 'IP-Adapter, RealESRGAN, ComfyUI', by: 'h94, xinntao, ComfyUI authors', licence: 'Apache-2.0, BSD-3, GPL-3' },
      { title: 'three.js', by: 'three.js authors', licence: 'MIT' },
    ],
  },
];

/** The README's own notice, verbatim (`README.md` line 7); the frames print it unchanged. */
export const FAN_NOTICE =
  'Final Fantasy X and X-2, their characters, worlds, and names are the property of Square Enix. ' +
  'This project is a non-commercial fan work, unaffiliated with Square Enix. ' +
  'All code, art, music, and writing here are original.';

/** Every audio source whose licence asks for a credit (for the test and the debug API). */
export const ATTRIBUTION_REQUIRED_SOURCES = AUDIO_SOURCES.filter((s) => requiresAttribution(s.licence)).map((s) => s.id);
