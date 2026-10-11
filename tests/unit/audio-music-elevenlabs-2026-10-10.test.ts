// @vitest-environment jsdom
/**
 * Two more ElevenLabs takes (2026-10-10), FFX-2 only: `boss-leblanc` (Chapter VI's Leblanc fight and the hidden Leblanc chapter) and `boss-bahamut`
 * (Chapter IV's Bahamut fight).
 *
 * Bailey, 2026-10-10: "Whatever you recommend for sound effects and music I'll go with those recommendations"; the driver picked LB-M5 and BH-M4.
 * `docs/audio/music-elevenlabs-2026-10-10.json` is the record (the request as sent, the raw take's hash, the shipped files' hashes and manifest
 * entries). This pins that the shipped files are the ones recorded, that the manifest entries carry `source` (the exemption from the stale-render
 * checks) exactly as the record says, that each cue can still be synthesised (a stand-in for `boss-ffx2-aeon`'s score), that the engine routes
 * those three encounters to the new cues and every other chapter keeps its cue (rule 14: FFX-2 only), and that THEMES.md and CREDITS.md name them.
 * Nothing here is a listening verdict (AGENTS.md rule 13). Game case: FFX-2 only.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { cueForGroup } from '../../src/app/screens/BattleEncounterChain.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { hasTrack, isStandIn, trackNames } from '../../src/audio/tracks/index.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS } from '../../src/data/encounters.ts';
import { AUDIO_BUDGET_BYTES, externalSource } from '../../tools/audio/manifest-io.mjs';

const REPO = join(__dirname, '..', '..'); // jsdom: import.meta.url is not a file URL here
const text = (p: string) => readFileSync(join(REPO, p), 'utf8');
const read = (p: string) => JSON.parse(text(p));

interface Entry {
  file: string;
  loopStart: number;
  loopEnd: number;
  duration: number;
  bytes: number;
  lufs: number;
  truePeakDb: number;
  source?: string;
}
interface Cue {
  cue: string;
  game: string;
  brief: string;
  raw: { sha256: string; bytes: number };
  file: { bytes: number; sha256: string };
  manifestEntry: Entry;
}
const record = read('docs/audio/music-elevenlabs-2026-10-10.json') as { source: string; gameCase: string; cues: Cue[] };
const manifest = read('public/audio/manifest.json') as { music: Record<string, Entry>; sfx: { bytes: number } | null; sfxV2: { bytes: number } | null };
const NEW = ['boss-bahamut', 'boss-leblanc'];
const RATE = 44100;

const sha256 = (cue: string) => createHash('sha256').update(readFileSync(join(REPO, 'public', 'audio', 'music', `${cue}.mp3`))).digest('hex');

describe('ElevenLabs music of 2026-10-10: the record and the files', () => {
  it('lists exactly the two cues, once each and in order, both FFX-2', () => {
    expect(record.cues.map((c) => c.cue)).toEqual(NEW);
    for (const c of record.cues) expect(c.game, c.cue).toBe('FFX-2');
    expect(record.gameCase).toMatch(/^FFX-2 only/);
  });

  it('ships the recorded files byte for byte, with the recorded manifest entries and the `source` exemption', () => {
    for (const c of record.cues) {
      const entry = manifest.music[c.cue]!;
      expect(entry, `${c.cue} is in the manifest`).toBeDefined();
      expect(entry.file).toBe(`music/${c.cue}.mp3`);
      expect(readFileSync(join(REPO, 'public', 'audio', entry.file)).length).toBe(c.file.bytes);
      expect(sha256(c.cue)).toBe(c.file.sha256);
      expect(entry, c.cue).toEqual(c.manifestEntry);
      expect(entry.bytes).toBe(c.file.bytes);
      expect(externalSource(entry), c.cue).toBe(record.source);
      expect(Object.keys(entry).sort()).toEqual(['bytes', 'duration', 'file', 'loopEnd', 'loopStart', 'lufs', 'source', 'truePeakDb']);
    }
  });

  it('loops on sample boundaries, with the 3 s run-on past the loop end, and can still be synthesised from the aeon score', () => {
    for (const c of record.cues) {
      const e = manifest.music[c.cue]!;
      for (const seconds of [e.loopStart, e.loopEnd]) expect(Math.abs(seconds * RATE - Math.round(seconds * RATE)), c.cue).toBeLessThan(0.5);
      expect(Math.abs(e.duration - (e.loopEnd + 3)), c.cue).toBeLessThan(0.001);
      expect(hasTrack(c.cue), c.cue).toBe(true);
      expect(isStandIn(c.cue), `${c.cue} plays another cue's composition and has none of its own`).toBe(true);
      expect(trackNames(), c.cue).not.toContain(c.cue);
    }
  });

  it('is described by THEMES.md and CREDITS.md', () => {
    const themes = text('docs/audio/THEMES.md');
    const credits = text('docs/audio/CREDITS.md');
    for (const c of record.cues) {
      const row = themes.split(/\r?\n/).find((l) => l.startsWith(`| \`${c.cue}\` | `));
      expect(row, `THEMES.md "How each cue ships" has no row for ${c.cue}`).toBeDefined();
      expect(row!).toMatch(/^\| `[a-z-]+` \| FFX-2 \| \*\*ElevenLabs\*\*/);
      expect(credits, `CREDITS.md does not carry the raw take's hash for ${c.cue}`).toContain(c.raw.sha256);
      expect(credits).toContain(c.brief);
    }
  });

  it('is inside the shipping budget, which is 100 MB under Bailey\'s 2026-10-10 words', () => {
    const shipped = Object.values(manifest.music).reduce((sum, e) => sum + e.bytes, 0) + (manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0);
    expect(AUDIO_BUDGET_BYTES).toBe(100e6);
    expect(shipped).toBeLessThan(AUDIO_BUDGET_BYTES);
  });
});

describe('ElevenLabs music of 2026-10-10: the engine routes three FFX-2 encounters to them and nothing else', () => {
  /** Every cue the chain resolves for a chapter, link by link, the way the screen does. */
  async function resolved(chapterId: string): Promise<string[]> {
    const chapter = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].find((c) => c.id === chapterId)!;
    const out: string[] = [];
    let group = chapter.enemyGroupRef;
    let link: 'first' | 'next' = 'first';
    for (let i = 0; i < 12 && group; i++) {
      out.push(cueForGroup(chapter, group, link).track ?? '(carries)');
      link = 'next';
      if (!group.nextGroupId) break;
      group = (await findEnemyGroup(group.nextGroupId))!;
    }
    return out;
  }

  it("Chapter IV's Bahamut fight plays boss-bahamut", async () => {
    expect(await resolved('ffx2-bahamut')).toEqual(['boss-bahamut']);
  });

  it("Chapter VI's three Leblanc acts and the hidden Leblanc chapter play boss-leblanc on every link", async () => {
    expect(await resolved('ffx2-leblanc')).toEqual(['boss-leblanc', 'boss-leblanc', 'boss-leblanc']);
    expect(await resolved('exp-leblanc')).toEqual(['boss-leblanc', 'boss-leblanc', 'boss-leblanc']);
  });

  it('leaves every other chapter on its own cue: the Fallen Aeons and Ixion took the batch-1 aeon cue on the same day (audio-music-batch1-2026-10-10.test.ts); no FFX chapter names a new cue', async () => {
    for (const id of ['ffx2-fallen-aeons', 'ffx2-ixion-djose']) expect((await resolved(id)).every((cue) => cue === 'boss-ffx2-fallen-aeons'), id).toBe(true);
    for (const chapter of [...CHAPTERS, ...EXPERIMENT_CHAPTERS]) {
      if (['ffx2-bahamut', 'ffx2-leblanc', 'exp-leblanc'].includes(chapter.id)) continue;
      expect((await resolved(chapter.id)).filter((cue) => NEW.includes(cue)), chapter.id).toEqual([]);
      expect([chapter.music.battle, chapter.music.phase2, chapter.music.scene].filter((cue) => cue && NEW.includes(cue)), chapter.id).toEqual([]);
    }
  });
});
