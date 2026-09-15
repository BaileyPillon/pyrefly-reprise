/** Registry of the original music tracks. */

import type { Track } from '../score.ts';
import { titleTrack } from './title.ts';
import { battleTrack } from './battle-ffx.ts';
import { bossTrack } from './boss-dread.ts';

export const TRACKS: Record<string, Track> = {
  title: titleTrack,
  'battle-ffx': battleTrack,
  'boss-dread': bossTrack,
};

export const TRACK_BLURBS: Record<string, string> = {
  title: 'Gentle solo piano ballad, strings entering — "memory of a lost city". A minor, 64 bpm.',
  'battle-ffx': 'Driving rock-orchestral battle theme. E minor, 150 bpm.',
  'boss-dread': 'Slow choir/timpani dread for Seymour and Yunalesca. D minor, 90 bpm.',
};

export function trackNames(): string[] {
  return Object.keys(TRACKS);
}

export function hasTrack(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(TRACKS, name);
}

export function getTrack(name: string): Track {
  const track = TRACKS[name];
  if (!track) throw new Error(`Unknown track "${name}". Known: ${trackNames().join(', ')}`);
  return track;
}

export { titleTrack, battleTrack, bossTrack };
