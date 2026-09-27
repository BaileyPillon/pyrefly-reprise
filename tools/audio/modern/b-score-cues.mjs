/**
 * Direction B for the whole score (2026-09-27): the words ACE-Step is given for
 * each of the 25 music cues, and where each cue plays.
 *
 * Bailey picked Direction B by ear on 2026-09-27 ("7 is the only one that
 * sounds good"; track 7 of audio-pack-0926 was
 * public/audio/candidates/C-round1-battle-ffx-B-x12.ogg, cut from
 * B-battle-ffx-101 = ace_step_v1_3.5b, denoise 0.40, seed 101, the battle-ffx
 * tags in tools/audio/ace-step.mjs). That clip's tags are kept word for word
 * for battle-ffx and boss-ffx2-aeon (the two cues sketch B already rendered).
 * Every other cue gets the same style core (the words that aimed the model at
 * a modern FF / Clair Obscur orchestral sound) plus its OWN instruments and
 * mood, read from the score (src/audio/tracks/<cue>.ts channel list) and from
 * docs/audio/THEMES.md's cue map (key, bpm, meter, "the one emotion"). The
 * words describe what is already written; they add no instrument the cue does
 * not have, so the restyle changes timbre and performance, not arrangement.
 *
 * Game case (hard rule 14): per cue, from THEMES.md "Harmonic language, by
 * world" and the chapter cue map. FFX cues get the symphonic core; FFX-2 cues
 * get the core plus the hybrid pop production words sketch B used for
 * boss-ffx2-aeon; the three menu cues (title, chapter-select, pause) are shared
 * by both games and get the symphonic core (their scores are acoustic).
 */

const FFX_CORE =
  'cinematic orchestral film score, live symphony orchestra, large concert hall, ' +
  'modern fantasy RPG soundtrack, expressive live performance, instrumental, no vocals';
const FFX2_CORE =
  'cinematic orchestral film score with modern hybrid pop production, live strings, ' +
  'modern fantasy RPG soundtrack, expressive live performance, instrumental, no vocals';

const t = (core, words, key, bpm, meter) => `${core}, ${words}, ${key}, ${bpm} bpm, ${meter}`;

/** @type {Record<string, { game: 'ffx'|'ffx2'|'both', key: string, bpm: number, meter: string, plays: string, tags: string }>} */
export const B_CUES = {
  // --- the two cues sketch B rendered: the tags Bailey heard, verbatim -------
  'battle-ffx': {
    game: 'ffx', key: 'E minor', bpm: 150, meter: '4/4',
    plays: 'ordinary-fight cue (FFX encounters, chapters I-III era; THEMES row 4)',
    tags:
      'cinematic orchestral film score, epic battle music, live symphony orchestra, large concert hall, ' +
      'driving string ostinato, french horns, trumpets and trombones, timpani, taiko, orchestral percussion, ' +
      'modern fantasy RPG soundtrack, dramatic, instrumental, no vocals, E minor, 150 bpm, 4/4',
  },
  'boss-ffx2-aeon': {
    game: 'ffx2', key: 'Bb minor', bpm: 160, meter: '4/4',
    plays: 'battle: IV Bahamut, VI Leblanc (stand-in), XI Fallen Aeons, XIII Trema (Trema phase)',
    tags:
      'cinematic orchestral film score with modern hybrid pop production, live strings, brass stabs, ' +
      'electric bass, punchy drum kit, electric piano, synth pads, epic boss battle, ' +
      'modern fantasy RPG soundtrack, instrumental, no vocals, Bb minor, 160 bpm, 4/4',
  },

  // --- menus (both games) ----------------------------------------------------
  title: {
    game: 'both', key: 'A minor', bpm: 58, meter: '4/4',
    plays: 'title screen (TitleScreen.ts) and the demo scene',
    tags: t(FFX_CORE, 'solo grand piano, gentle flute, harp, soft string orchestra, intimate, melancholy, nostalgic, rubato', 'A minor', 58, '4/4'),
  },
  'chapter-select': {
    game: 'both', key: 'B minor', bpm: 84, meter: '3/4',
    plays: 'chapter select (BattleScreenFlow.ts on return)',
    tags: t(FFX_CORE, 'gentle waltz, flute, piano, harp, soft strings, celesta, distant soft choir pad, calm, unhurried', 'B minor', 84, '3/4'),
  },
  pause: {
    game: 'both', key: 'E minor', bpm: 46, meter: '4/4',
    plays: 'pause menu (src/ui/common/pauseMusic.ts)',
    tags: t(FFX_CORE, 'slow hymn, soft wordless choir, warm pad, harp, very quiet, still, suspended', 'E minor', 46, '4/4'),
  },

  // --- FFX -------------------------------------------------------------------
  'boss-dread': {
    game: 'ffx', key: 'D minor', bpm: 90, meter: '4/4',
    plays: 'demo cutscene (CutsceneScreen.ts DEMO_CUTSCENE_SCRIPT); no chapter row',
    tags: t(FFX_CORE, 'dark sacred choir, low strings, brass, timpani, tubular bells, ominous, patient, dread', 'D minor', 90, '4/4'),
  },
  'boss-seymour': {
    game: 'ffx', key: 'C# minor', bpm: 132, meter: '4/4',
    plays: 'battle: I Seymour Flux, XII Seymour Omnis (stand-in)',
    tags: t(FFX_CORE, 'epic boss battle, pipe organ, contrabasses, driving strings, brass, orchestral drums, baroque, sinister, grand', 'C# minor', 132, '4/4'),
  },
  'boss-seymour-macalania': {
    game: 'ffx', key: 'C# minor', bpm: 126, meter: '4/4',
    plays: 'battle: VII Seymour and Anima (Macalania), X Seymour Natus (stand-in)',
    tags: t(FFX_CORE, 'baroque pavane, harpsichord, solo oboe, pizzicato strings, string quartet, clarinet, low brass, bell, timpani, elegant, polite, sinister', 'C# minor', 126, '4/4'),
  },
  'boss-yunalesca': {
    game: 'ffx', key: 'F phrygian', bpm: 132, meter: '6/8',
    plays: 'battle: II Lady Yunalesca',
    tags: t(FFX_CORE, 'ritual boss battle, sacred choir in canon, harp, plucked ostinato, low strings, brass, timpani, taiko, relentless', 'F phrygian', 132, '6/8'),
  },
  'boss-jecht': {
    game: 'ffx', key: 'D minor', bpm: 144, meter: '4/4',
    plays: 'battle: III Braska\'s Final Aeon (Jecht)',
    tags: t(FFX_CORE, 'epic rock orchestral boss battle, distorted electric guitar riff, electric bass, rock drum kit, brass, strings, choir, heroic, tragic', 'D minor', 144, '4/4'),
  },
  'boss-yu-yevon': {
    game: 'ffx', key: 'E minor', bpm: 40, meter: '4/4',
    plays: 'battle: III Yu Yevon (final phase)',
    tags: t(FFX_CORE, 'vast slow sacred choir, pipe organ drone, low strings, celesta, organum, endless, awe', 'E minor', 40, '4/4'),
  },
  'boss-evrae': {
    game: 'ffx', key: 'A minor', bpm: 144, meter: '4/4',
    plays: 'battle: VIII Evrae (airship)',
    tags: t(FFX_CORE, 'airborne boss battle, driving strings, brass stabs, french horns, taiko, timpani, drum kit, piano, flute, urgent, soaring', 'A minor', 144, '4/4'),
  },
  'boss-yojimbo': {
    game: 'ffx', key: 'C minor', bpm: 132, meter: '4/4',
    plays: 'battle: IX Yojimbo, XIV Isaaru (stand-in)',
    tags: t(FFX_CORE, 'solo cello, solo violin, french horn, felt piano, string orchestra, taiko, timpani, grief, duty, dramatic', 'C minor', 132, '4/4'),
  },
  'scene-gagazet': {
    game: 'ffx', key: 'B minor', bpm: 72, meter: '4/4',
    plays: 'scene: I, VII (stand-in), IX, X (stand-in), XIV (stand-in)',
    tags: t(FFX_CORE, 'solo french horn, solo cello, low strings drone, distant choir, harp, taiko, bell, cold mountain, vast, lonely', 'B minor', 72, '4/4'),
  },
  'scene-zanarkand-dome': {
    game: 'ffx', key: 'B minor', bpm: 48, meter: '4/4',
    plays: 'scene: II Zanarkand Dome',
    tags: t(FFX_CORE, 'piano nocturne, warm strings, low strings, soft choir, celesta, harp, bell, bittersweet, remembering', 'B minor', 48, '4/4'),
  },
  'scene-dreams-end': {
    game: 'ffx', key: 'atonal', bpm: 76, meter: '4/4',
    plays: 'scene: III Dream\'s End, XII (stand-in)',
    tags: `${FFX_CORE}, ambient, celesta, pad, strings, low strings, soft choir, flute, bell, dreamlike, drifting, unmoored, 76 bpm, 4/4`,
  },
  'scene-fahrenheit': {
    game: 'ffx', key: 'D minor', bpm: 104, meter: '4/4',
    plays: 'scene: VIII Evrae (Fahrenheit deck)',
    tags: t(FFX_CORE, 'violins, flute, piano open fifths, brass, low strings, taiko heartbeat, timpani, wind, urgent, no way back', 'D minor', 104, '4/4'),
  },
  'victory-ffx': {
    game: 'ffx', key: 'C major', bpm: 120, meter: '4/4',
    plays: 'results after an FFX win (I-III, VII-X, XII, XIV); opens with a one-shot fanfare before the loop',
    tags: t(FFX_CORE, 'victory fanfare, brass, strings, timpani, harp, flute, piano, light percussion, relief, warm', 'C major', 120, '4/4'),
  },
  'ending-ffx': {
    game: 'ffx', key: 'B minor', bpm: 58, meter: '4/4',
    plays: 'FFX ending (braskas-final-aeon story script)',
    tags: t(FFX_CORE, 'solo piano then full orchestra, strings, brass, harp, choir, timpani, bell, farewell, emotional, peaceful', 'B minor', 58, '4/4'),
  },

  // --- FFX-2 -----------------------------------------------------------------
  'boss-vegnagun': {
    game: 'ffx2', key: 'F minor', bpm: 168, meter: '4/4',
    plays: 'battle: V Vegnagun',
    tags: t(FFX2_CORE, 'mechanical boss battle, synth arpeggio, synth bass, 808 kick, low brass octaves, choir, pipe organ, staccato strings, metallic hits, relentless', 'F minor', 168, '4/4'),
  },
  'boss-shuyin': {
    game: 'ffx2', key: 'C# minor', bpm: 154, meter: '4/4',
    plays: 'battle: V Shuyin, XV Den of Woe (stand-in)',
    tags: t(FFX2_CORE, 'piano and strings boss battle, harp, pad, bell, light drums, shaker, timpani, grief, tragic, emotional', 'C# minor', 154, '4/4'),
  },
  'scene-bevelle-underground': {
    game: 'ffx2', key: 'G minor', bpm: 100, meter: '4/4',
    plays: 'scene: IV Bahamut, VI (stand-in), XIII Trema (and Paragon link), XV (stand-in)',
    tags: t(FFX2_CORE, 'dark ambient pulse, synth arpeggio, synth bass, pipe organ, low strings, harp, clarinet, metallic hits, 808, underground machine', 'G minor', 100, '4/4'),
  },
  'scene-farplane': {
    game: 'ffx2', key: 'E major', bpm: 92, meter: '4/4',
    plays: 'scene: V Vegnagun, XI Fallen Aeons',
    tags: t(FFX2_CORE, 'ethereal, strings, low strings, pad, soft choir, flute, harp, celesta, bell, restful, distant', 'E major', 92, '4/4'),
  },
  'victory-ffx2': {
    game: 'ffx2', key: 'Eb major', bpm: 128, meter: '4/4',
    plays: 'results after an FFX-2 win (V, VI, XI, XIII, XV); opens with a one-shot brass fanfare before the groove',
    tags: t(FFX2_CORE, 'brass fanfare then pop groove, flute, mallets, electric piano, electric bass, drum kit, celesta, fun, upbeat', 'Eb major', 128, '4/4'),
  },
  'ending-ffx2': {
    game: 'ffx2', key: 'Bb major', bpm: 84, meter: '4/4',
    plays: 'FFX-2 ending (ffx2-vegnagun-shuyin story script)',
    tags: t(FFX2_CORE, 'pop ballad, piano, strings, pad, flute, soft choir, harp, electric piano, electric bass, light drums, gentle, hopeful goodbye', 'Bb major', 84, '4/4'),
  },
};

/** The three Macalania scene sketches (docs/audio/sketches/2026-09-24/), for the pack only. */
/** Tempo, key and instruments from each sketch's own score (tools/audio/scores/2026-09-24/*.mjs). FFX only. */
export const MACALANIA = {
  A: {
    game: 'ffx', key: 'F# minor', bpm: 56, meter: '4/4',
    file: 'docs/audio/sketches/2026-09-24/macalania-scene-a-frozen-temple.mp3',
    tags: t(FFX_CORE, 'alto flute, soft strings, low strings, glockenspiel, harp, chimes, celesta, cold, still, glassy, frozen temple', 'F# minor', 56, '4/4'),
  },
  B: {
    game: 'ffx', key: 'C# minor', bpm: 96, meter: '3/4',
    file: 'docs/audio/sketches/2026-09-24/macalania-scene-b-wedding-proposal.mp3',
    tags: t(FFX_CORE, 'courtly minuet, solo violin, string quartet, pizzicato, clarinet, strings, low strings, elegant, menacing', 'C# minor', 96, '3/4'),
  },
  C: {
    game: 'ffx', key: 'B minor', bpm: 72, meter: '4/4',
    file: 'docs/audio/sketches/2026-09-24/macalania-scene-c-crystal-and-pyreflies.mp3',
    tags: t(FFX_CORE, 'shimmering strings, string tremolo, low strings, celesta, glockenspiel, solo violin, crystal lake, glowing, quiet', 'B minor', 72, '4/4'),
  },
};
