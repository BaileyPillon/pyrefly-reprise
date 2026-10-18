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
 * source (for the Commons recordings, the file page; for the Arvedi hall, the
 * full author list) and what we changed or used it in, which is what CC BY 4.0
 * section 3(a)(1) asks a credit to give "to the extent reasonably practicable"
 * and what `docs/audio/CREDITS.md`'s verbatim lines carry. `LICENCE_LINKS`
 * gives the licences' URIs once, above the fan-work notice.
 *
 * Pure data. `tests/unit/credits-attribution.test.ts` holds it to
 * `audioSources.ts`, `docs/audio/CREDITS.md` and the audio manifest.
 *
 * Game case: both (one list for the whole product; FFX and FFX-2 pause screens
 * both show it).
 */

import { BTS_LIVE } from '../changelog/behindTheScenes.ts';
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

/** Where the three CC BY 4.0 recordings live: each note gives its file page (`docs/audio/CREDITS.md`'s table). */
const COMMONS = 'commons.wikimedia.org/wiki/File:';
/** What `recipes.py` does to them (cut, low-passed, mixed under other layers), as the licence asks us to say. */
const EDITED = 'edited: cut, filtered and layered into our effects';

const BASE_CREDIT_GROUPS: readonly CreditGroup[] = [
  {
    id: 'music',
    heading: 'Music',
    entries: [
      { title: 'Salamander Grand Piano', by: 'Alexander Holm', licence: 'CC BY 3.0', required: true, note: 'played in our original music; freepats.zenvoid.org', sources: ['salamander'] },
      {
        title: 'Sonatina Symphonic Orchestra',
        by: 'Mattias Westlund',
        licence: 'CC Sampling Plus 1.0',
        required: true,
        note: 'SF2 conversion by Symphony2; samples processed and played in our original music and effects',
        sources: ['sonatina'],
      },
      { title: 'DRSKit 2.1', by: 'DrumGizmo team and Jes Eiler', licence: 'CC BY 4.0', required: true, note: 'Deva, Lars Muldjord; Jes Eiler of DRSDrums; drumgizmo.org; mixed into our original music', sources: ['drskit'] },
      {
        title: 'Arvedi Auditorium impulse responses',
        by: 'F. Miotello and colleagues',
        licence: 'CC BY 4.0',
        required: true,
        note:
          '“The Sound of the Violin’s Home: A Higher-Order Room Impulse Response Dataset of the Arvedi Auditorium in Cremona”, ' +
          'F. Miotello, G. Greco, P. Ostan, F. Del Gaudio, L. Comanducci, R. Malvermi, M. Pezzoli, F. Antonacci; ' +
          'Zenodo, doi:10.5281/zenodo.20098848; decoded to stereo, direct sound removed, used as the hall of our original music',
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
      { title: 'Thunderclap', by: 'Richard Humphries', licence: 'CC BY 4.0', required: true, note: `${EDITED}; ${COMMONS}Nosferatu_thunderclap_-_Richard_Humphries.wav`, sources: ['thunderclap'] },
      { title: 'Bonfire ignition', by: 'Work With Sounds / Werstas', licence: 'CC BY 4.0', required: true, note: `${EDITED}; ${COMMONS}WWS_Bonfireignition.ogg`, sources: ['bonfire'] },
      { title: 'Glass breaking', by: 'Gravity Sound', licence: 'CC BY 4.0', required: true, note: `${EDITED}; ${COMMONS}Glass_breaking_(Gravity_Sound).wav`, sources: ['glass'] },
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

/**
 * The AI tools the game was made with, named in the credits (Bailey, 2026-10-08, decisions item 31 e: "The in-game Credits
 * must name them at the same moment the page goes public"). PREPARED, not shown: this group is in `CREDIT_GROUPS` only
 * while the BEHIND THE SCENES switch is on (`changelog/behindTheScenes.ts`), so the page that tells the story and the credits
 * that back it go public together and by the same constant. Until then the list is exactly what it was. The names are the
 * ones the page's "Made with" line uses (`behindTheScenes/facts.ts`, MADE_WITH); a test keeps the two together.
 * The line under each says what it made, in the quieter note style of the required lines; ComfyUI and Animagine are
 * licensed and listed under "Art and tools" too, which this group points to.
 */
export const AI_TOOLS_GROUP: CreditGroup = {
  id: 'ai',
  heading: 'Made with AI tools',
  entries: [
    { title: 'ElevenLabs Music and ElevenLabs voices', by: 'ElevenLabs', licence: 'AI-generated', note: 'music tracks and the spoken lines of Tidus, Yuna and Auron, each picked by ear' },
    { title: 'ChatGPT Images', by: 'OpenAI', licence: 'AI-generated', note: 'the title paintings, made in the Art Room and approved by Bailey' },
    { title: 'ComfyUI with Animagine XL 4.0', by: 'open tools, run on Bailey’s own computer', licence: 'AI-generated', note: 'most of the paintings; their licences are listed under Art and tools' },
    { title: 'Claude', by: 'Anthropic', licence: 'AI-assisted', note: 'builds and reviews the game, and plays it as its critic' },
  ],
};

/** The groups with the AI tools after them, and without: the two states the switch chooses between (the tests ask for both). */
export function creditGroups(withAiTools: boolean): readonly CreditGroup[] {
  return withAiTools ? [...BASE_CREDIT_GROUPS, AI_TOOLS_GROUP] : BASE_CREDIT_GROUPS;
}

/** What the panel lists: the four groups of the approved frames, and the AI tools after them only while the switch is on. */
export const CREDIT_GROUPS: readonly CreditGroup[] = BTS_LIVE ? [...BASE_CREDIT_GROUPS, AI_TOOLS_GROUP] : BASE_CREDIT_GROUPS;

/** The README's own notice, verbatim (`README.md` line 7); the frames print it unchanged. */
export const FAN_NOTICE =
  'Final Fantasy X and X-2, their characters, worlds, and names are the property of Square Enix. ' +
  'This project is a non-commercial fan work, unaffiliated with Square Enix. ' +
  'All code, art, music, and writing here are original.';

/**
 * The licences the REQUIRED lines are under, with their URIs: CC BY 4.0
 * section 3(a)(1)(C) and CC BY 3.0 section 4(a) ask for the URI or a link, and
 * CC Sampling Plus 1.0 for the same. Printed once, above the fan-work notice.
 */
export const LICENCE_LINKS =
  'Licences: CC BY 4.0 creativecommons.org/licenses/by/4.0 · CC BY 3.0 creativecommons.org/licenses/by/3.0 · ' +
  'CC Sampling Plus 1.0 creativecommons.org/licenses/sampling+/1.0';

/** Every audio source whose licence asks for a credit (for the test and the debug API). */
export const ATTRIBUTION_REQUIRED_SOURCES = AUDIO_SOURCES.filter((s) => requiresAttribution(s.licence)).map((s) => s.id);
