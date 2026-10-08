// @vitest-environment jsdom
/**
 * Release 39.5, the two selectable chapter-select tracks (Bailey, 2026-10-07): "I'll go with B", "but C as a selectable
 * alternate", "and A as a selectable alternate as well", "B as the default".
 *
 * `chapter-select` (B, live since 39.4) stays the default and keeps its name. A and C are two NEW cues, `chapter-select-a` and
 * `chapter-select-c`: ElevenLabs takes mastered like the other takes of `docs/audio/music-elevenlabs-2026-10-07.json` (whose
 * `alternates` list records them), marked `source` in the manifest, stand-ins for B's score so a browser that cannot load the
 * file still plays music, chosen by `Settings.chapterSelectMusic` and played by the board (`BattleScreenFlow.chapterSelect`).
 * This pins that the cues exist and are what the record measured, that the choice reaches the mixer, that they fit the
 * shipping budget without raising it (they are encoded at LAME V4: V0 would not fit), and that the docs say what they are.
 *
 * Nothing here is a listening verdict (AGENTS.md rule 13). Game case: both games (the board is shared).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { audio } from '../../src/audio/index.ts';
import { getTrack, hasTrack, isStandIn, trackNames } from '../../src/audio/tracks/index.ts';
import type { App } from '../../src/app/App.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen } from '../../src/app/screens/BattleScreenFlow.ts';
import { CHAPTER_SELECT_CUES, CHAPTER_SELECT_MUSICS } from '../../src/app/saveFrontend.ts';
import { AUDIO_BUDGET_BYTES, externalSource } from '../../tools/audio/manifest-io.mjs';

const REPO = resolve(__dirname, '..', '..');
const text = (p: string) => readFileSync(resolve(REPO, p), 'utf8');
const read = (p: string) => JSON.parse(text(p));

interface Stereo {
  corr: number;
  sideMid: number;
  monoLoss: number;
}
interface EntryFields {
  loopStart: number;
  loopEnd: number;
  duration: number;
  bytes: number;
  lufs: number;
  truePeakDb: number;
}
interface Variant {
  dir: string;
  sha256: string;
  bytes: number;
  manifestEntry: EntryFields;
  stereo: Stereo;
}
interface Alternate {
  cue: string;
  setting: string;
  game: 'both';
  brief: string;
  request: { prompt: string };
  raw: { sha256: string };
  master: { mp3Quality: string; v0Bytes: number };
  loop: { startBar: number; endBar: number; bodyBars: number };
  variants: Record<string, Variant>;
  installedVariant: string | null;
  after: {
    bytes: number;
    sha256: string;
    decodedSamples: number;
    qa: { lufs: number; truePeakDb: number; seamOk: boolean; failures: string[] };
    measure: Stereo;
  };
  themesStereoGate: { corr: boolean; sideMid: boolean; monoLoss: boolean };
}
interface ElevenLabsRecord {
  source: string;
  gates: { qaStrictFindings: number };
  stereoGate: { thresholds: { corr: [number, number]; sideMid: [number, number]; monoLossMin: number } };
  cues: { cue: string }[];
  alternates: Alternate[];
}
interface ManifestEntry extends EntryFields {
  file: string;
  score?: string;
  source?: string;
}

const record = read('docs/audio/music-elevenlabs-2026-10-07.json') as ElevenLabsRecord;
const manifest = read('public/audio/manifest.json') as {
  music: Record<string, ManifestEntry>;
  sfx: { bytes: number } | null;
  sfxV2: { bytes: number } | null;
};
const RATE = 44100;
const RUN_ON_SECONDS = 3;
const sha256 = (cue: string) => createHash('sha256').update(readFileSync(resolve(REPO, `public/audio/music/${cue}.mp3`))).digest('hex');
const inRange = (x: number, [low, high]: [number, number]) => x >= low && x <= high;

function themesRow(cue: string): string[] | null {
  const line = text('docs/audio/THEMES.md')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`| \`${cue}\` | `));
  return line ? line.split('|').slice(1, -1).map((c) => c.trim()) : null;
}

describe('the cue map', () => {
  it('names B as the cue it always was and A and C as the two the record lists', () => {
    expect(record.alternates.map((a) => a.cue)).toEqual(['chapter-select-a', 'chapter-select-c']);
    expect(CHAPTER_SELECT_CUES.b).toBe('chapter-select');
    expect(CHAPTER_SELECT_CUES.a).toBe('chapter-select-a');
    expect(CHAPTER_SELECT_CUES.c).toBe('chapter-select-c');
    expect([...CHAPTER_SELECT_MUSICS]).toEqual(['b', 'a', 'c']);
    for (const a of record.alternates) expect(a.setting).toBe(`chapterSelectMusic = '${a.cue.slice(-1)}'`);
  });

  it('has every cue in the manifest with the exemption mark, and every cue the game can play can fall back to a score', () => {
    for (const cue of Object.values(CHAPTER_SELECT_CUES)) {
      expect(manifest.music[cue], `${cue} is not in the manifest`).toBeDefined();
      expect(hasTrack(cue), `${cue} has no score to fall back on`).toBe(true);
      expect(externalSource(manifest.music[cue])).not.toBeNull();
    }
  });

  it('plays B’s composition when a file cannot load, and lists B once, not three times (the jukebox and the render list)', () => {
    expect(isStandIn('chapter-select-a')).toBe(true);
    expect(isStandIn('chapter-select-c')).toBe(true);
    expect(isStandIn('chapter-select')).toBe(false);
    expect(getTrack('chapter-select-a')).toBe(getTrack('chapter-select'));
    expect(getTrack('chapter-select-c')).toBe(getTrack('chapter-select'));
    expect(trackNames()).toContain('chapter-select');
    expect(trackNames()).not.toContain('chapter-select-a');
    expect(trackNames()).not.toContain('chapter-select-c');
  });

  it('keeps the exemption exactly to the cues the record lists (cues and alternates)', () => {
    const exempt = Object.entries(manifest.music)
      .filter(([, entry]) => externalSource(entry) !== null)
      .map(([name]) => name)
      .sort();
    expect(exempt).toEqual([...record.cues.map((c) => c.cue), ...record.alternates.map((a) => a.cue)].sort());
  });
});

describe.each(record.alternates.map((a) => [a.cue, a] as const))('chapter-select alternate: %s', (cue, c) => {
  const entry = manifest.music[cue]!;
  const installed = c.installedVariant === null ? undefined : c.variants[c.installedVariant];

  it('ships the file the record measured, byte for byte, and says which variant it is', () => {
    expect(installed, `${cue}: installedVariant ${c.installedVariant} is not a variant in the record`).toBeDefined();
    expect(readFileSync(resolve(REPO, `public/audio/${entry.file}`)).length).toBe(c.after.bytes);
    expect(sha256(cue)).toBe(c.after.sha256);
    expect(c.after.sha256).toBe(installed!.sha256);
    expect(entry.file).toBe(`music/${cue}.mp3`);
  });

  it('has the manifest entry its variant describes, the exemption mark, and no score fingerprint', () => {
    const { loopStart, loopEnd, duration, bytes, lufs, truePeakDb } = entry;
    expect({ loopStart, loopEnd, duration, bytes, lufs, truePeakDb }).toEqual(installed!.manifestEntry);
    expect(entry.source).toBe(record.source);
    expect(Object.keys(entry).sort()).toEqual(['bytes', 'duration', 'file', 'loopEnd', 'loopStart', 'lufs', 'source', 'truePeakDb']);
    for (const [name, v] of Object.entries(c.variants)) expect(v.manifestEntry.bytes, `${cue} ${name}`).toBe(v.bytes);
  });

  it('decodes to the length the manifest says, with the 3 s run-on past the loop end, on sample-exact loop points', () => {
    expect(Math.abs(c.after.decodedSamples - Math.round(entry.duration * RATE))).toBeLessThanOrEqual(2);
    expect(Math.abs(entry.duration - (entry.loopEnd + RUN_ON_SECONDS))).toBeLessThan(0.001);
    for (const point of [entry.loopStart, entry.loopEnd]) expect(Math.abs(point * RATE - Math.round(point * RATE)), `${point} is on a sample`).toBeLessThan(0.05);
  });

  it('loops on bar lines: whole bars of the take between the two points', () => {
    expect(c.loop.endBar - c.loop.startBar).toBe(c.loop.bodyBars);
    expect(c.loop.bodyBars).toBeGreaterThanOrEqual(16);
  });

  it('passed the qa.mjs gates, the loudness target and the true-peak ceiling', () => {
    expect(c.after.qa.failures).toEqual([]);
    expect(c.after.qa.seamOk).toBe(true);
    expect(Math.abs(c.after.qa.lufs + 16), 'LUFS').toBeLessThan(0.5);
    expect(c.after.qa.truePeakDb).toBeLessThanOrEqual(-1);
  });

  it('is encoded at LAME V4, because V0 would not fit the budget; the record keeps what V0 would have cost', () => {
    expect(c.master.mp3Quality).toMatch(/V4/);
    expect(c.master.v0Bytes).toBeGreaterThan(c.after.bytes);
    // the floor `audio-music-o1.test.ts` holds the V0 cues to (200 kbps) does not apply to these two: they are held to the
    // 128 kbps the takes themselves came in at, so a lower VBR setting than V4 cannot slip in unnoticed
    expect((entry.bytes * 8) / entry.duration, `${cue} average bitrate`).toBeGreaterThan(128_000);
  });

  it('discloses the stereo gate as measured, and keeps a variant that passes it when the installed one fails', () => {
    const t = record.stereoGate.thresholds;
    const m = c.after.measure;
    expect(c.themesStereoGate).toEqual({ corr: inRange(m.corr, t.corr), sideMid: inRange(m.sideMid, t.sideMid), monoLoss: m.monoLoss >= t.monoLossMin });
    expect({ corr: m.corr, sideMid: m.sideMid, monoLoss: m.monoLoss }).toEqual(installed!.stereo);
    if (Object.values(c.themesStereoGate).some((ok) => !ok)) {
      const narrow = c.variants['narrow'];
      expect(narrow, `${cue}: no gate-passing variant to swap to`).toBeDefined();
      expect(inRange(narrow!.stereo.corr, t.corr) && inRange(narrow!.stereo.sideMid, t.sideMid) && narrow!.stereo.monoLoss >= t.monoLossMin).toBe(true);
    }
  });

  it('is described by THEMES.md and CREDITS.md the way the record has it', () => {
    const row = themesRow(cue);
    expect(row, `THEMES.md "How each cue ships" has no row for ${cue}`).not.toBeNull();
    const [, game, shipsAs, corr, sideMid, monoLoss] = row!;
    expect(game).toBe('both');
    expect(shipsAs).toMatch(/ElevenLabs/);
    expect(shipsAs).toMatch(/V4/);
    expect([Number(corr), Number(sideMid), Number(monoLoss)]).toEqual([c.after.measure.corr, c.after.measure.sideMid, c.after.measure.monoLoss]);
    if (Object.values(c.themesStereoGate).some((ok) => !ok)) expect(shipsAs).toMatch(/stereo gate/i);
    const credits = text('docs/audio/CREDITS.md');
    expect(credits).toContain(c.raw.sha256);
    expect(credits).toContain(c.request.prompt);
  });
});

describe('the budget', () => {
  it('still fits under 90 MB with both alternates in, the cap unchanged', () => {
    const shipped = Object.values(manifest.music).reduce((sum, e) => sum + e.bytes, 0) + (manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0);
    expect(AUDIO_BUDGET_BYTES).toBe(90e6);
    expect(shipped).toBeLessThan(AUDIO_BUDGET_BYTES);
    expect(record.gates.qaStrictFindings).toBe(0);
  });

  it('retired no cue: every cue the game had is still in the manifest', () => {
    for (const cue of ['title', 'chapter-select', 'pause', 'boss-seymour', 'boss-seymour-macalania', 'battle-ffx', 'boss-dread']) {
      expect(manifest.music[cue], cue).toBeDefined();
    }
  });
});

// ----------------------------------------------------- the board plays the chosen cue

class FakeBoard extends Screen implements FlowScreen<null> {
  readonly name = 'chapter-select';
  readonly done = Promise.resolve(null);
}
class FakeApp {
  readonly uiRoot = document.body.appendChild(document.createElement('div'));
  readonly save: SaveStore;
  readonly flow = new GameFlow(this as unknown as App);
  current: Screen | null = null;
  constructor(choice?: string) {
    const settings = choice === undefined ? {} : { chapterSelectMusic: choice };
    const slot = new Map<string, string>([[SAVE_KEY, JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings, seenCoach: [], flags: {} })]]);
    this.save = new SaveStore(SAVE_KEY, { getItem: (k) => slot.get(k) ?? null, setItem: (k, v) => void slot.set(k, v), removeItem: (k) => void slot.delete(k) });
  }
  async replace(screen: Screen): Promise<void> {
    await this.current?.exit();
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    this.current = screen;
    await screen.enter();
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

describe('GameFlow.chapterSelect plays the cue the setting names', () => {
  let played: Array<[string, unknown]> = [];
  beforeEach(() => {
    played = [];
    resetFlowScreens();
    registerFlowScreens({ chapterSelect: () => new FakeBoard() });
    vi.spyOn(audio, 'playMusic').mockImplementation((name: string, options?: unknown) => {
      played.push([name, options]);
      return Promise.resolve();
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    resetFlowScreens();
  });

  it.each([
    ['no choice (an older save)', undefined, 'chapter-select'],
    ['B', 'b', 'chapter-select'],
    ['A', 'a', 'chapter-select-a'],
    ['C', 'c', 'chapter-select-c'],
    ['a value that is not a track', 'z', 'chapter-select'],
  ])('%s', async (_label, choice, cue) => {
    const app = new FakeApp(choice);
    await app.flow.chapterSelect();
    expect(played).toEqual([[cue, { fade: 1.2 }]]);
  });
});
