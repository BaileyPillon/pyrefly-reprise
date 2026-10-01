/**
 * Every outside source a shipped audio file was made with, and the licence it
 * came under.
 *
 * The machine-readable record the audio tools themselves keep lives outside
 * the repository (`D:/Tools/pyrefly-scratch/audio-0930/sfx/tools/sources.json`
 * for the recorded SFX set; the music-v2 renderers under
 * `D:/Tools/pyrefly-scratch/audio-v2/`), so a unit test cannot read it. This
 * list is the in-repo copy of the part that matters for the credits, checked
 * three ways by `tests/unit/credits-attribution.test.ts`:
 *
 * - every section a source `feeds` exists in `public/audio/manifest.json`;
 * - every source whose licence asks for attribution has a REQUIRED entry on
 *   the credits screen (`creditsData.ts`) naming it and its licence;
 * - every row `docs/audio/CREDITS.md` marks as required (a CC BY or CC
 *   Sampling Plus licence cell, "**required**", "Attribution required: yes",
 *   or a line of its verbatim blocks) matches one of these by `match`.
 *
 * Checked against the sources on 2026-09-30 (branch credits-o1 = main +
 * music-v2 + sfx-v2): `docs/audio/CREDITS.md`, `D:/Tools/downloads.md`, the
 * SFX set's `sources.json` and `recipes.py` (which files a shipped cue loads)
 * and the library paths the music-v2 renderers read. Nothing here is guessed:
 * where a source did not record something, the credits say so or leave it out.
 *
 * Game case: both (the music and effects of both games draw on these).
 */

/** A section of `public/audio/manifest.json`. */
export type AudioManifestSection = 'music' | 'sfx' | 'sfxV2';

export interface AudioSource {
  /** Stable key the credits entries point at. */
  id: string;
  work: string;
  author: string;
  licence: string;
  /** Which shipped audio it reaches. */
  feeds: readonly AudioManifestSection[];
  /** Case-insensitive substrings that identify this source in `docs/audio/CREDITS.md`. */
  match: readonly string[];
}

/**
 * True when a licence obliges us to credit the author: any CC BY (not CC0,
 * not "BY-NC ... only if redistributed") and CC Sampling Plus.
 */
export function requiresAttribution(licence: string): boolean {
  return /^CC[- ]BY(?!-NC)\b/i.test(licence.trim()) || /Sampling Plus/i.test(licence);
}

export const AUDIO_SOURCES = [
  // ---- music (R1 on main, music v2) ------------------------------------
  { id: 'salamander', work: 'Salamander Grand Piano V3', author: 'Alexander Holm', licence: 'CC BY 3.0', feeds: ['music'], match: ['Salamander'] },
  { id: 'sonatina', work: 'Sonatina Symphonic Orchestra', author: 'Mattias Westlund', licence: 'CC Sampling Plus 1.0', feeds: ['music', 'sfx', 'sfxV2'], match: ['Sonatina'] },
  { id: 'drskit', work: 'DRSKit 2.1', author: 'DrumGizmo team (Deva, Lars Muldjord) and Jes Eiler of DRSDrums', licence: 'CC BY 4.0', feeds: ['music'], match: ['DRSKit'] },
  { id: 'arvedi', work: 'Arvedi Auditorium room impulse responses', author: 'F. Miotello, G. Greco, P. Ostan, F. Del Gaudio, L. Comanducci, R. Malvermi, M. Pezzoli, F. Antonacci', licence: 'CC BY 4.0', feeds: ['music'], match: ['Arvedi'] },
  { id: 'fluidr3', work: 'FluidR3 GM/GM2', author: 'Frank Wen', licence: 'MIT', feeds: ['music'], match: ['FluidR3'] },
  { id: 'voxengo', work: 'Voxengo free impulse responses', author: 'Aleksey Vaneev (Voxengo)', licence: 'Voxengo licence (royalty-free; the IR files are never redistributed)', feeds: ['music', 'sfxV2'], match: ['Voxengo'] },
  { id: 'vsco2', work: 'VSCO 2 Community Edition', author: 'Versilian Studios', licence: 'CC0', feeds: ['music', 'sfxV2'], match: ['VSCO 2'] },
  { id: 'vcsl', work: 'VCSL, Versilian Community Sample Library', author: 'Versilian Studios', licence: 'CC0', feeds: ['music', 'sfxV2'], match: ['VCSL'] },
  { id: 'karoryfer', work: 'Black And Blue Basses, Shinyguitar, Karoryfer x bigcat cello', author: 'Karoryfer Samples, bigcat instruments', licence: 'CC0', feeds: ['music'], match: ['Karoryfer'] },
  { id: 'jrhodes3d', work: 'jRhodes3d', author: 'Jeff Learman', licence: 'CC0 (music made with it)', feeds: ['music'], match: ['jRhodes3d'] },
  { id: 'surge', work: 'Surge XT 1.3.4', author: 'Surge Synth Team', licence: 'GPL-3 (the synth; its output is ours)', feeds: ['music'], match: ['Surge XT'] },
  { id: 'ace-step-v1', work: 'ACE-Step v1 3.5B', author: 'ACE Studio and StepFun', licence: 'Apache-2.0', feeds: ['music'], match: ['ACE-Step v1'] },
  { id: 'ace-step-15', work: 'ACE-Step 1.5 turbo and XL turbo', author: 'ACE Studio and StepFun', licence: 'MIT', feeds: ['music'], match: ['ACE-Step 1.5'] },
  // ---- the recorded SFX set (sprite-v2, D-302) -------------------------
  { id: 'thunderclap', work: 'Nosferatu thunderclap', author: 'Richard Humphries', licence: 'CC BY 4.0', feeds: ['sfxV2'], match: ['Nosferatu_thunderclap', 'Thunderclap by Richard Humphries'] },
  { id: 'bonfire', work: 'Bonfire ignition (WWS_Bonfireignition)', author: 'Work With Sounds / Werstas', licence: 'CC BY 4.0', feeds: ['sfxV2'], match: ['WWS_Bonfireignition', 'Bonfire ignition by'] },
  { id: 'glass', work: 'Glass breaking', author: 'Gravity Sound', licence: 'CC BY 4.0', feeds: ['sfxV2'], match: ['Glass_breaking_(Gravity_Sound)', 'Glass breaking by Gravity Sound'] },
  { id: 'kenney', work: 'Impact Sounds, RPG Audio, Interface Sounds, Sci-fi Sounds', author: 'Kenney', licence: 'CC0 1.0', feeds: ['sfxV2'], match: ['kenney_'] },
  { id: 'rubberduck', work: 'Seven CC0 SFX packs on OpenGameArt', author: 'rubberduck', licence: 'CC0 1.0', feeds: ['sfxV2'], match: ['(rubberduck)'] },
  { id: 'artisticdude', work: 'Swishes Sound Pack, RPG Sound Pack', author: 'artisticdude', licence: 'CC0 1.0', feeds: ['sfxV2'], match: ['(artisticdude)'] },
  { id: 'starninjas', work: '20 Sword Sound Effects (attacks and clashes)', author: 'StarNinjas', licence: 'CC0 1.0', feeds: ['sfxV2'], match: ['(StarNinjas)'] },
  { id: 'tiger', work: 'Angry tiger (439280_schots)', author: 'schots', licence: 'CC0', feeds: ['sfxV2'], match: ['schots'] },
  { id: 'grizzly', work: 'Grizzly bear vocalizations 001 (Yellowstone sound library)', author: 'NPS and MSU Acoustic Atlas / Jennifer Jerrett', licence: 'Public domain', feeds: ['sfxV2'], match: ['Grizzly'] },
  { id: 'ocean', work: 'Ocean waves on a tropical beach', author: 'Jarrod Stanley', licence: 'CC0', feeds: ['sfxV2'], match: ['Ocean_Waves'] },
  { id: 'windchime', work: 'Windglockenspiel Koshi', author: 'Membeth', licence: 'CC0', feeds: ['sfxV2'], match: ['Windglockenspiel'] },
] as const satisfies readonly AudioSource[];

export type AudioSourceId = (typeof AUDIO_SOURCES)[number]['id'];
