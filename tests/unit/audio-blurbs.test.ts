/**
 * The debug overlay and the audition page are where everyone — the owner
 * included — reads what a cue *is*. Before this file those lines were
 * hand-typed prose, and four of the twenty-one had drifted away from the
 * score: `scene-zanarkand-dome` advertised 58 bpm against a track at 48,
 * `boss-yu-yevon` 96 against 40, `ending-ffx` 66 against 58, and three of them
 * named the wrong key as well. A blurb nobody can trust is worse than none,
 * because it is the thing an agent who cannot hear reaches for.
 *
 * So the tempo is no longer written down: `TRACK_BLURBS` renders it off the
 * live `Track`. What is left to check here is everything prose can still get
 * wrong —
 *
 *  1. the **title** against the track module's own header line,
 *  2. the **key** against the cue map in `docs/audio/THEMES.md`,
 *  3. the cue map's **tempo** against the track (so the bible cannot drift
 *     either — one of the two has to be wrong and the test says which),
 *  4. the key against the track's **actual pitch content**, so a key that both
 *     the bible and the blurb agree on still has to be the key the notes are
 *     in.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { toMidi, type Track } from '../../src/audio/score.ts';
import { TRACKS, TRACK_BLURBS, TRACK_NOTES } from '../../src/audio/tracks/index.ts';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const THEMES_MD = join(REPO_ROOT, 'docs', 'audio', 'THEMES.md');
const TRACK_DIR = join(REPO_ROOT, 'src', 'audio', 'tracks');

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
/** Two spellings for every black note, because the score uses both. */
const TONIC_PC: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/** Channels that carry no pitch — their "notes" are drum-map indices. */
const UNPITCHED = /kick|snare|hat|taiko|cymbal|clap|tom|noise|perc|clang|siren|breakbeat|kit|timpani-hit/i;

// ---------------------------------------------------------------------------
// The cue map, parsed out of the bible
// ---------------------------------------------------------------------------

export interface CueMapRow {
  key: string;
  bpm: number;
}

/**
 * Reads the `| # | Cue | Themes | Key | BPM | Form | Emotion |` table under
 * "## The cue map". Parsing the doc rather than copying it is the whole point:
 * a blurb and a bible that disagree is the bug we are hunting.
 */
function readCueMap(markdown: string): Map<string, CueMapRow> {
  const rows = new Map<string, CueMapRow>();
  const section = markdown.split('## The cue map')[1] ?? '';
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 7) continue;
    const cue = cells[1]!.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s*\(new\)\s*/, '').trim();
    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(cue)) continue; // the header row and the |---| rule
    const bpm = Number.parseInt(cells[4]!.replace(/\*\*/g, ''), 10);
    rows.set(cue, { key: normaliseKey(cells[3]!), bpm });
  }
  return rows;
}

/**
 * `**B minor** → **B major**` -> `B minor → B major`;
 * `A minor (a tone below home)` -> `A minor`; `B minor, 3/4` -> `B minor`.
 * The metre and the parenthetical asides belong to other columns.
 */
function normaliseKey(cell: string): string {
  return cell
    .replace(/\*\*/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/,\s*\d+\/\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** `* "Iron Verdict" — Vegnagun, ...` from a track module's header. */
function moduleTitle(key: string): string | null {
  const source = readFileSync(join(TRACK_DIR, `${key}.ts`), 'utf8');
  return /^\s*\*\s*["“]([^"”]+)["”]/m.exec(source)?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// What key are the notes actually in
// ---------------------------------------------------------------------------

/**
 * Weighted pitch-class profile: every pitched note counts for its duration
 * times its velocity times its channel's gain, which is roughly "how much of
 * this pitch you hear". Returns shares that sum to 1.
 */
export function pitchClassProfile(track: Track): number[] {
  const weight = new Array<number>(12).fill(0);
  for (const channel of track.channels) {
    if (UNPITCHED.test(channel.instrument)) continue;
    const transpose = channel.transpose ?? 0;
    for (const [, dur, pitch, velocity] of channel.notes) {
      const midi = toMidi(pitch) + transpose;
      if (!Number.isFinite(midi)) continue;
      weight[(((midi % 12) + 12) % 12)]! += Math.max(0.05, dur) * (velocity ?? 0.8) * (channel.volume ?? 1);
    }
  }
  const total = weight.reduce((a, b) => a + b, 0);
  return total > 0 ? weight.map((w) => w / total) : weight;
}

/** Pitch classes ordered loudest first, e.g. `['F', 'G#', 'A#', ...]`. */
function rankedPitchClasses(track: Track): string[] {
  const profile = pitchClassProfile(track);
  return PITCH_CLASSES.map((name, i) => ({ name, share: profile[i]! }))
    .sort((a, b) => b.share - a.share)
    .map((entry) => entry.name);
}

/** `'B minor → B major'` -> `'B'`; `'no tonic'` -> `null`. */
function tonicOf(key: string): string | null {
  const first = key.split('→')[0]!.trim();
  const letter = /^([A-G][#b]?)(?=\s|$)/.exec(first)?.[1];
  return letter ?? null;
}

const CUE_MAP = readCueMap(readFileSync(THEMES_MD, 'utf8'));
const NOTE_ENTRIES = Object.entries(TRACK_NOTES);

describe('TRACK_NOTES covers the score', () => {
  it('has exactly one note per composed track', () => {
    expect(Object.keys(TRACK_NOTES).sort()).toEqual(Object.keys(TRACKS).sort());
  });

  it('parsed the cue map — 21 rows, one per cue', () => {
    expect([...CUE_MAP.keys()].sort()).toEqual(Object.keys(TRACKS).sort());
  });
});

describe.each(NOTE_ENTRIES)('%s', (key, note) => {
  const track = TRACKS[key]!;
  const row = CUE_MAP.get(key)!;
  const blurb = TRACK_BLURBS[key]!;

  it('is titled the way its own module titles it', () => {
    expect(moduleTitle(key), `${key}.ts header`).toBe(note.title);
    expect(blurb.startsWith(`"${note.title}" — `)).toBe(true);
  });

  it("states the track's real tempo, and the cue map agrees", () => {
    expect(blurb).toContain(`, ${track.bpm} bpm`);
    // The tempo is rendered from `track.bpm`, so this can only fail when the
    // bible and the score have parted company.
    expect(row.bpm, `cue map BPM for ${key}`).toBe(track.bpm);
    // Nothing may hard-code a *different* number: the only integer before
    // " bpm" is the one we rendered.
    expect([...blurb.matchAll(/(\d+) bpm/g)].map((m) => m[1])).toEqual([String(track.bpm)]);
  });

  it('names the key the cue map names', () => {
    expect(note.key).toBe(row.key);
    expect(blurb).toContain(`${note.key}, ${track.bpm} bpm`);
  });

  it('prints the metre only when it is not 4/4', () => {
    const [beats, unit] = track.timeSig;
    if (beats === 4 && unit === 4) expect(blurb).not.toMatch(/\d\/\d/);
    else expect(blurb).toContain(`, ${beats}/${unit}.`);
  });

  it('is in the key it claims, by the score\'s own pitch content', () => {
    const ranked = rankedPitchClasses(track);
    const tonic = tonicOf(note.key);
    if (tonic === null) {
      // `scene-dreams-end` declares "no tonic" and has to earn it: nothing may
      // dominate. Its loudest pitch class sits at ~15.5%, against ~1/12 = 8.3%
      // for a perfectly flat drift and 25-60% for every cue with a key.
      const profile = pitchClassProfile(track);
      expect(Math.max(...profile), `${key} claims no tonic`).toBeLessThan(0.2);
      return;
    }
    // A tonic does not have to be the single loudest pitch class — `victory-ffx`
    // leans on its major third, `ending-ffx2` modulates up a step and ends
    // there — but a cue in the wrong key would not have its claimed tonic in
    // the top three at all.
    expect(ranked.slice(0, 3), `${key}: loudest pitch classes are ${ranked.slice(0, 4).join(', ')}`).toContain(
      TONIC_PC[tonic] === undefined ? tonic : PITCH_CLASSES[TONIC_PC[tonic]!]!,
    );
  });
});
