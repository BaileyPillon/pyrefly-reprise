/** Registry of the original music tracks. */

import type { Track } from '../score.ts';
import { titleTrack } from './title.ts';
import { battleTrack } from './battle-ffx.ts';
import { bossTrack } from './boss-dread.ts';
import { chapterSelectTrack } from './chapter-select.ts';
import { pauseTrack } from './pause.ts';
import { gagazetTrack } from './scene-gagazet.ts';
import { seymourTrack } from './boss-seymour.ts';
import { zanarkandDomeTrack } from './scene-zanarkand-dome.ts';
import { yunalescaTrack } from './boss-yunalesca.ts';
import { dreamsEndTrack } from './scene-dreams-end.ts';
import { jechtTrack } from './boss-jecht.ts';
import { yuYevonTrack } from './boss-yu-yevon.ts';
import { victoryTrack } from './victory-ffx.ts';
import { endingTrack } from './ending-ffx.ts';
import { sceneBevelleUndergroundTrack } from './scene-bevelle-underground.ts';
import { sceneFarplaneTrack } from './scene-farplane.ts';
import { vegnagunTrack } from './boss-vegnagun.ts';
import { shuyinTrack } from './boss-shuyin.ts';
import { victoryFfx2Track } from './victory-ffx2.ts';
import { bossFfx2AeonTrack } from './boss-ffx2-aeon.ts';
import { endingFfx2Track } from './ending-ffx2.ts';
import { sceneFahrenheitTrack } from './scene-fahrenheit.ts';
import { bossEvraeTrack } from './boss-evrae.ts';
import { bossSeymourMacalaniaTrack } from './boss-seymour-macalania.ts';
import { bossYojimboTrack } from './boss-yojimbo.ts';
import { sceneMacalaniaTempleTrack } from './scene-macalania-temple.ts';

/** The final music keys (CONTRACT-CHANGES §8). `playMusic` resolves every one. */
export const MUSIC_KEYS = [
  'title',
  'chapter-select',
  'scene-gagazet',
  'boss-seymour',
  'scene-zanarkand-dome',
  'boss-yunalesca',
  'scene-dreams-end',
  'boss-jecht',
  'boss-yu-yevon',
  'victory-ffx',
  'ending-ffx',
  'scene-bevelle-underground',
  'boss-ffx2-aeon',
  'scene-farplane',
  'boss-vegnagun',
  'boss-shuyin',
  'victory-ffx2',
  'ending-ffx2',
  // Chapter VIII, Evrae on the Fahrenheit (FFX only): CONTRACT-CHANGES 2026-09-23.
  'scene-fahrenheit',
  'boss-evrae',
  // Chapter VII, Seymour and Anima at Macalania (FFX only): CONTRACT-CHANGES 2026-09-24.
  'boss-seymour-macalania',
  // Chapter IX, Yojimbo in the Cavern of the Stolen Fayth (FFX only): CONTRACT-CHANGES 2026-09-24.
  'boss-yojimbo',
  // Chapter VII's scene cue, Macalania Temple (FFX only): CONTRACT-CHANGES 2026-09-29 (D-278).
  'scene-macalania-temple',
] as const;

export type FinalMusicKey = (typeof MUSIC_KEYS)[number];

/** Tracks with their own composition. */
const COMPOSED: Record<string, Track> = {
  title: titleTrack,
  'battle-ffx': battleTrack,
  'boss-dread': bossTrack,
  'chapter-select': chapterSelectTrack,
  pause: pauseTrack,
  'scene-gagazet': gagazetTrack,
  'boss-seymour': seymourTrack,
  'scene-zanarkand-dome': zanarkandDomeTrack,
  'boss-yunalesca': yunalescaTrack,
  'scene-dreams-end': dreamsEndTrack,
  'boss-jecht': jechtTrack,
  'boss-yu-yevon': yuYevonTrack,
  'victory-ffx': victoryTrack,
  'ending-ffx': endingTrack,
  'scene-bevelle-underground': sceneBevelleUndergroundTrack,
  'scene-farplane': sceneFarplaneTrack,
  'boss-vegnagun': vegnagunTrack,
  'boss-shuyin': shuyinTrack,
  'victory-ffx2': victoryFfx2Track,
  'boss-ffx2-aeon': bossFfx2AeonTrack,
  'ending-ffx2': endingFfx2Track,
  'scene-fahrenheit': sceneFahrenheitTrack,
  'boss-evrae': bossEvraeTrack,
  'boss-seymour-macalania': bossSeymourMacalaniaTrack,
  'boss-yojimbo': bossYojimboTrack,
  'scene-macalania-temple': sceneMacalaniaTempleTrack,
};

/**
 * Keys whose own track has not landed yet play an existing composition instead.
 * A key listed in COMPOSED always wins, so registering a real track retires its
 * stand-in automatically; delete the line here when it does.
 *
 * FFX-2 only, 2026-10-10 (Bailey: "Whatever you recommend for sound effects and music I'll go with those recommendations"): two ElevenLabs takes ship
 * as cues of their own, `boss-leblanc` (Chapter VI and the hidden Leblanc chapter) and `boss-bahamut` (Chapter IV), so the shared `boss-ffx2-aeon`
 * stays with the rest. The MP3 is what plays; if it cannot load, the synth fallback is the aeon composition they replace.
 *
 * Batch 1, 2026-10-10 (Bailey: "ill go with all your recommendations", on the batch-1 music picks): six more ElevenLabs takes ship as cues of
 * their own, each with the composition it replaces as its synth fallback (the MP3 is what plays):
 * FFX-2 only: `boss-ffx2-fallen-aeons` (Chapter XI's three links and Chapter XVI's Ixion: the game plays the same track at both, so one cue)
 * and `boss-trema` (Chapter XIII's second phase), both over `boss-ffx2-aeon`;
 * FFX only: `boss-seymour-natus` (Chapter X) over `boss-seymour-macalania`, `boss-isaaru` (Chapter XIV) over `boss-yojimbo`, and
 * `boss-sin-assault` (Chapter XVII, links I to III) and `boss-sin-countdown` (Chapter XVIII) over `boss-evrae`.
 *
 * FF7 only, the same day: `boss-ff7-guard` (the hidden 'limit' chapter's Guard Scorpion, silent before). No FF7 score exists and `playMusic` refuses a key with
 * no track, so its synth fallback (only if the MP3 cannot load) is the generic FFX battle bed `battle-ffx`: a cross-game fallback, named here on purpose.
 *
 * Batch 2, 2026-10-12 (Bailey, 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please."; 2026-10-12:
 * "I'll go with all of your recommendations"): an ElevenLabs original for every remaining synth cue. Where one replaces a cue for every chapter that played it, it keeps the
 * cue's key (the MP3 and manifest entry change, this score stays as the fallback). Where it serves only some of a cue's chapters, it is a key of its own over the old score:
 * FFX only: `boss-challenge` (Chapter II, Yunalesca, and the hidden Sinspawn Gui chapter's second fight: the game plays one "Challenge" track at both, so one cue; Chapter I keeps
 * `boss-seymour`, which Bailey chose by ear) over `boss-yunalesca`; `boss-gui` (that chapter's first fight) over `boss-dread`; `boss-seymour-omnis` (Chapter XII) over `boss-seymour`.
 * FFX-2 only: `boss-den-of-woe` (Chapter XV) over `boss-shuyin`; `boss-experiment` (the hidden Experiment, both acts) over `boss-ffx2-aeon`; `scene-chateau-leblanc` (Chapter VI and
 * the hidden Leblanc chapter only) over `scene-bevelle-underground`. The results screen's cues have no score of their own either: `victory-bahamut` (Chapter IV, FFX-2) and
 * `defeat-ffx` (FFX) fall back to the hymn-bed `pause`, which is sparse and calm and shared by both games; `defeat-ffx2` (FFX-2) to `scene-farplane`. (A fallback loops: a defeat
 * cue made to play once only plays once when its MP3 loads.)
 */
const STAND_INS: Record<string, string> = {
  'boss-leblanc': 'boss-ffx2-aeon',
  'boss-bahamut': 'boss-ffx2-aeon',
  'boss-ffx2-fallen-aeons': 'boss-ffx2-aeon',
  'boss-trema': 'boss-ffx2-aeon',
  'boss-seymour-natus': 'boss-seymour-macalania',
  'boss-isaaru': 'boss-yojimbo',
  'boss-sin-assault': 'boss-evrae',
  'boss-sin-countdown': 'boss-evrae',
  'boss-ff7-guard': 'battle-ffx',
  'boss-challenge': 'boss-yunalesca',
  'boss-gui': 'boss-dread',
  'boss-seymour-omnis': 'boss-seymour',
  'boss-den-of-woe': 'boss-shuyin',
  'boss-experiment': 'boss-ffx2-aeon',
  'scene-chateau-leblanc': 'scene-bevelle-underground',
  'victory-bahamut': 'pause',
  'defeat-ffx': 'pause',
  'defeat-ffx2': 'scene-farplane',
};

/**
 * Compositions whose pre-render is retired (batch 2, 2026-10-12): no chapter, script or screen plays the cue any more, so no MP3 ships for it and the manifest has no
 * entry. The score stays in the repo as the synth fallback of the cues that stand in for it (`boss-yunalesca` under `boss-challenge`, `boss-dread` under `boss-gui`,
 * `boss-ffx2-aeon` under the six cues over it), which is the only way it can be heard now; the pause jukebox leaves it out of its list, because it would play the synth.
 * `tests/unit/audio-music-batch2-2026-10-12.test.ts` holds the list to that: each is unreferenced, unshipped and a stand-in's fallback.
 */
export const RETIRED_MUSIC_CUES: readonly string[] = ['boss-ffx2-aeon', 'boss-dread', 'boss-yunalesca'];

/** True for a composition whose MP3 is retired (see {@link RETIRED_MUSIC_CUES}). */
export function isRetiredMusic(name: string): boolean {
  return RETIRED_MUSIC_CUES.includes(name);
}

export const TRACKS: Record<string, Track> = { ...COMPOSED };
for (const [key, target] of Object.entries(STAND_INS)) {
  if (!Object.prototype.hasOwnProperty.call(TRACKS, key)) TRACKS[key] = COMPOSED[target]!;
}

/**
 * What the debug overlay and the audition page say about one cue.
 *
 * Three of these four fields are prose a human writes; the fourth, **tempo, is
 * never written down here** — {@link TRACK_BLURBS} reads it off the `Track`
 * itself. The old blurbs were hand-typed strings and four of them had drifted
 * (zanarkand-dome was advertised at 58 bpm against a score at 48, yu-yevon at
 * 96 against 40, ending-ffx at 66 against 58), which is exactly the failure a
 * derived field cannot have. `key` is still prose, so
 * `tests/unit/audio-blurbs.test.ts` checks it against the cue map in
 * `docs/audio/THEMES.md` and against the track's own pitch content.
 */
export interface TrackNote {
  /** The cue's title, quoted at the head of the rendered line. */
  title: string;
  /** Key, spelled exactly as the cue map's "Key" column spells it. */
  key: string;
  /** Themes used and how they are transformed — the cue map's column 3. */
  themes: string;
  /** "The one thing the cue must leave behind" — the cue map's last column. */
  intent: string;
}

/**
 * Per-cue notes, taken row by row from the cue map in `docs/audio/THEMES.md`
 * (§"The cue map") and from each track module's own header. Keep the rows in
 * the cue map's order so the two can be diffed side by side.
 */
export const TRACK_NOTES: Record<string, TrackNote> = {
  title: {
    title: 'Tide, Remembered',
    key: 'A minor',
    themes: 'FAREWELL bars 1-8 only on solo piano, the phrase never finishing, with HYMN_HEAD on flute at the very top',
    intent: 'a story that is already over, being told anyway',
  },
  'chapter-select': {
    title: 'Threshold, Unhurried',
    key: 'B minor',
    themes: 'HYMN_HEAD alone, four notes on flute, then FAREWELL_WALTZ bars 1-8 looping there',
    intent: 'unhurried choosing; nothing here can hurt you yet',
  },
  pause: {
    title: 'Still Water',
    key: 'E Aeolian',
    themes: 'HYMN bars 1-8, solo soprano over a tenor drone — no alto, no bass, no percussion',
    intent: 'the game holding its breath',
  },
  'battle-ffx': {
    title: 'Hold the Trail',
    key: 'E minor',
    themes: "BATTLE_HOOK in full, with FATHER's rhythm (not its pitches) in the kit and bass",
    intent: 'we can win this',
  },
  'boss-dread': {
    title: 'The Unsent Hymn',
    key: 'D minor',
    themes: 'HYMN in canon at the octave, choir over a pedal, SEYMOUR as a bass counter-line at half volume',
    intent: 'something is watching, and it is patient',
  },
  'boss-seymour': {
    title: 'Noble Rot',
    key: 'C# minor',
    themes:
      'SEYMOUR in pedal organ and contrabasses, SEYMOUR_MIRROR in the manuals, the minor-third sequence, SEYMOUR_UNMOORED once in the final section',
    intent: 'contempt that has convinced itself it is mercy',
  },
  'boss-yunalesca': {
    title: 'Rite Without End',
    key: 'F Phrygian',
    themes:
      'HYMN at +1, HYMN_HEAD as a four-entry canon three beats apart at the octave and the fourth with velocity locked at 0.62, then AMEN_PHRYGIAN',
    intent: 'a rite that will finish with or without you',
  },
  'boss-jecht': {
    title: 'Blitz for Two',
    key: 'D minor',
    themes:
      'FATHER in full; FAREWELL bars 9-12 at half-time in the bridge; the two superimposed in the climax, FATHER entering two beats late',
    intent: 'two people talking over each other, and both of them are right',
  },
  'boss-yu-yevon': {
    title: 'No End',
    key: 'E Aeolian',
    themes:
      'HYMN whole at augment(2), choir over one drone, bars 12-16 unaccompanied, the amen replaced by a held iv that never resolves and a second choir a fifth above, eight beats late',
    intent: 'no end',
  },
  'scene-gagazet': {
    title: 'Where the Horns Fell Silent',
    key: 'B minor',
    themes:
      'FATHER_STRAIGHTENED on one unaccompanied horn, once; FAREWELL_RISE on solo cello, once; then thirty seconds of drone',
    intent: 'the mountain does not care',
  },
  'scene-zanarkand-dome': {
    title: 'Where the Tide Stopped',
    key: 'B minor',
    themes:
      'FAREWELL as a nocturne — melody up an octave, sextuplet left hand, soprano alone on bars 9-12 — and HYMN harmonised in strings, the only time it is ever warm',
    intent: 'warmth remembered, which is worse than cold',
  },
  'scene-dreams-end': {
    title: 'A City That Never Was',
    key: 'no tonic',
    themes: 'FAREWELL_RISE alone on celesta, bent, over whole voicings planing in parallel with no functional logic',
    intent: 'unmoored',
  },
  'scene-bevelle-underground': {
    title: 'Iron Undertow',
    key: 'G minor',
    themes: 'HYMN_POISONED once on low clarinet, and a SONGSTRESS_DARK fragment on synth bass',
    intent: 'the machine under the cathedral',
  },
  'scene-farplane': {
    title: 'Where the Pyreflies Rest',
    key: 'E major',
    themes: 'HYMN harmonised in quartal stacks, distant; FAREWELL_RISE answered by SONGSTRESS_RISE',
    intent: 'rest without forgetting',
  },
  'victory-ffx': {
    title: 'Bright After the Storm',
    key: 'C major',
    themes:
      "VICTORY_FANFARE as a one shot into VICTORY_LOOP, with FAREWELL's incipit in the major on flute at bars 7-8; the fanfare closes F-C, not G-C",
    intent: 'relief, not triumph',
  },
  'ending-ffx': {
    title: 'The Dream That Has To End',
    key: 'B minor → B major',
    themes:
      'FAREWELL complete twice — solo piano bars 1-8, then bars 1-16 on FAREWELL_CHORDS_RELEASED with full orchestra — and HYMN bars 13-16 with one Picardy third in the last bar',
    intent: 'permission to stop',
  },
  'boss-ffx2-aeon': {
    title: 'Static Coronation',
    key: 'Bb minor',
    themes: 'SONGSTRESS_DARK as supersaw stabs over octave-pumping synth bass and breakbeats; the bridge keeps its ii-V',
    intent: 'a pop star fighting a god, and enjoying it',
  },
  'boss-vegnagun': {
    title: 'Iron Verdict',
    key: 'F minor',
    themes:
      'SONGSTRESS_DARK mechanised: constant note lengths, jitter under 3 ms, bare octaves in low brass, the bridge stripped to a static pedal',
    intent: 'something enormous, and nobody is driving',
  },
  'boss-shuyin': {
    title: 'The Weight of a Thousand Years',
    key: 'C# minor',
    themes:
      "SONGSTRESS in the parallel minor with the tonic unmoved, bar 7's borrowed joy gone merely diatonic; piano and strings, rubato in the half-time B",
    intent: 'grief that has curdled',
  },
  'victory-ffx2': {
    title: 'Sphere Shine',
    key: 'Eb major',
    themes: 'SONGSTRESS_HOOK as a brass fanfare, the identity leap intact and major, then an 808 results groove on the hook',
    intent: 'that was fun',
  },
  'ending-ffx2': {
    title: 'Wherever the Tide Takes Me',
    key: 'Bb major → C',
    themes: 'SONGSTRESS complete with its bridge; the last chorus up a step, FAREWELL_RISE visiting on flute',
    intent: 'the second game says goodbye more gently, because it can',
  },
  'boss-evrae': {
    title: 'Open Sky, Closed Gate',
    key: 'A minor',
    themes:
      'FAREWELL_RISE driven at speed as the head of a two-bar ship figure with rests in it; FAREWELL_RISE and FAREWELL_FALL at double length on a distant flute; no HYMN, no choir',
    intent: 'the ship is the weapon; keep your distance',
  },
  'scene-fahrenheit': {
    title: 'Within the Hour',
    key: 'D minor',
    themes:
      'FAREWELL_RISE and FAREWELL_FALL at double length on violins; the ship figure foreshadowed on flute; the peak closes on the AMEN',
    intent: 'no time, and no way back',
  },
  'boss-seymour-macalania': {
    title: 'The Courtesy',
    key: 'C# minor',
    themes:
      'SEYMOUR an octave up on oboe over a harpsichord pavane that bows every fourth bar; SEYMOUR_MIRROR in the cellos; a chromatic decline that will not stop; the sequence takes one extra step at the summon, then a plagal amen to the wrong chord',
    intent: 'polite, and wrong',
  },
  'boss-yojimbo': {
    title: "The Summoner's Sorrow",
    key: 'C minor',
    themes:
      'its own line (a rising fifth that leans on the flat sixth) on solo cello, then violin once a bowed pulse and taiko join; the line up the mode on a horn; one crack on the flat sixth, then control and the amen. No dominant anywhere',
    intent: 'grief under control, and it cracks once',
  },
  'scene-macalania-temple': {
    title: 'The Frozen Temple',
    key: 'F# minor',
    themes:
      'no shared cell but HYMN_HEAD, once, at 1.5x on one distant voice as the door glows; quartal ice in high strings, irregular glockenspiel drips, an alto flute that walks through without a pulse and never lands on the tonic; harp open fifths on bVI - bVII - i. No dominant, no organ, no chanted choir',
    intent: 'ice pretending to be masonry, and something behind the door',
  },
};

/** "3/4", or `''` for plain 4/4 — the only time the metre is worth printing. */
function meterSuffix(track: Track): string {
  const [beats, unit] = track.timeSig;
  return beats === 4 && unit === 4 ? '' : `, ${beats}/${unit}`;
}

/**
 * One line per cue for the debug overlay and the audition page.
 *
 * Built from {@link TRACK_NOTES} and the **live** `Track`, so the tempo and
 * metre shown are by construction the tempo and metre that render.
 */
export const TRACK_BLURBS: Record<string, string> = Object.fromEntries(
  Object.entries(TRACK_NOTES).map(([key, note]) => {
    const track = TRACKS[key];
    const tail = track ? `${note.key}, ${track.bpm} bpm${meterSuffix(track)}.` : `${note.key}.`;
    return [key, `"${note.title}" — ${note.themes}; ${note.intent}. ${tail}`];
  }),
);

/** True when `name` currently plays another key's composition. */
export function isStandIn(name: string): boolean {
  return !Object.prototype.hasOwnProperty.call(COMPOSED, name) && hasTrack(name);
}

/** Keys with their own composition (stand-ins excluded, so previews never duplicate). */
export function trackNames(): string[] {
  return Object.keys(COMPOSED);
}

export function hasTrack(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(TRACKS, name);
}

export function getTrack(name: string): Track {
  const track = TRACKS[name];
  if (!track) throw new Error(`Unknown track "${name}". Known: ${Object.keys(TRACKS).join(', ')}`);
  return track;
}

export { titleTrack, battleTrack, bossTrack };
