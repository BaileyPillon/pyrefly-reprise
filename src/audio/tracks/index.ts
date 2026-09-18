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
};

/**
 * Keys whose own track has not landed yet play an existing composition instead.
 * A key listed in COMPOSED always wins, so registering a real track retires its
 * stand-in automatically; delete the line here when it does. Empty now that
 * every key has its own composition — kept so a future key can land early.
 */
const STAND_INS: Record<string, string> = {};

export const TRACKS: Record<string, Track> = { ...COMPOSED };
for (const [key, target] of Object.entries(STAND_INS)) {
  if (!Object.prototype.hasOwnProperty.call(TRACKS, key)) TRACKS[key] = COMPOSED[target]!;
}

export const TRACK_BLURBS: Record<string, string> = {
  title:
    '"Tide, Remembered" — the farewell theme, bars 1-8 only, a tone below its own key and never finishing: solo piano, then strings and a distant voice. A minor, 58 bpm.',
  'battle-ffx': 'Driving rock-orchestral battle theme. E minor, 150 bpm.',
  'boss-dread': 'Slow choir/timpani dread for Seymour and Yunalesca. D minor, 90 bpm.',
  'chapter-select':
    '"Threshold, Unhurried" — the farewell theme as a waltz: four passes of one eight-bar phrase, piano to quartet to an inverted texture and back. B minor, 84 bpm, 3/4.',
  pause:
    '"Still Water" — the prayer\'s first eight bars, one voice over a tenor drone, mostly air. E Aeolian, 46 bpm.',
  'scene-gagazet':
    '"Where the Horns Fell Silent" — flute over an open-fifth choir, a clan horn call and distant taiko thunder. B minor with a dorian G#, 72 bpm.',
  'boss-seymour':
    '"Ascension of the Unmaker" — a demonic mass at battle tempo: choir over an organ lament bass, spiccato strings, taiko and a Sending counter-line. C# minor, 132 bpm.',
  'scene-zanarkand-dome':
    '"Where the Tide Stopped" — sparse piano dyads, pad and bell in the ruined dome; the sigh returns, the question stays open. E minor, 58 bpm.',
  'boss-yunalesca':
    '"Rite Without End" — a fixed-pitch choir chant over a relentless harp and spiccato ostinato; the rite never changes its note. F harmonic minor, 6/8, 132 bpm.',
  'scene-dreams-end':
    '"A City That Never Was" — celesta music box over whole-tone drift inside Sin; the title\'s rise, bent wrong. No tonic, 76 bpm.',
  'boss-jecht':
    '"Blitz for Two" — double-tracked drop-D guitar riffs and a real solo; the bridge turns to D major for the father\'s pride. D minor, 144 bpm.',
  'boss-yu-yevon':
    '"What the Tide Keeps" — organ, choir and full orchestra; Sending in dread, the sigh in answer, the rising cell triumphant in D major. B minor, 96 bpm.',
  'victory-ffx':
    '"Bright After the Storm" — a one-shot rising brass fanfare, then a pluck-and-piano results loop that grows and recedes. C major, 120 bpm.',
  'ending-ffx':
    '"Tide, Answered" — the title\'s A-minor question answered in D major: solo piano, strings, then choir with the rising cell augmented. 66 bpm.',
  'scene-bevelle-underground':
    '"Iron Undertow" — arp-pluck sixteenths, half-time 808 and distant metal clangs beneath Bevelle; the Sphere hook in minor, fragment first. G minor, 100 bpm.',
  'scene-farplane':
    '"Where the Pyreflies Rest" — flute, harp and a soft supersaw pad; FFX\'s rising cell at peace, answered by Lenne\'s line. E major, 92 bpm.',
  'boss-vegnagun':
    '"Iron Verdict" — a never-ending synth-bass ostinato, metal-hit clangs and an alarm siren; bars lurch 3½ and 4½ beats like a machine missing a step. F minor, 168 bpm.',
  'boss-shuyin':
    '"The Weight of a Thousand Years" — a 16th-note piano riff under electronic rock; Lenne\'s theme as an anguished hook, tender in the half-time B. C# minor, 154 bpm.',
  'victory-ffx2':
    '"Sphere Shine" — a synth-brass fanfare on the Sphere hook and an Eb9 hit, then an 808 results groove riffing on the hook. Eb major, 128 bpm.',
  'boss-ffx2-aeon':
    '"Static Coronation" — supersaw stabs on the Sphere hook recast in minor, octave-pumping synth-bass, breakbeats; the chorus turns the hook hopeful in Db. Bb minor, 160 bpm.',
  'ending-ffx2':
    '"Wherever the Tide Takes Me" — a pop ballad: epiano verses on the slowed Sphere hook, Lenne\'s line in major for the chorus, drums only in the last third, a final chorus up a step where FFX\'s rising cell visits. Bb major → C, 84 bpm.',
};

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
