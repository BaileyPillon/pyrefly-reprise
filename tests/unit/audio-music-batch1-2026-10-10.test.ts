// @vitest-environment jsdom
/**
 * Batch 1 of the ElevenLabs Music options (2026-10-10): six takes ship as cues of their own, and `boss-evrae`'s loop points are re-cut.
 *
 * Bailey, 2026-10-10 about 22:10 EDT, on the driver's batch-1 picks: "ill go with all your recommendations" (the standing words of about 18:20: "Whatever
 * you recommend for sound effects and music I'll go with those recommendations"). `docs/audio/music-batch1-2026-10-10.json` is the record (the requests as
 * sent, the raw takes' hashes, the shipped files' hashes and manifest entries, the Evrae measurements). This pins that the shipped files are the ones recorded,
 * that the manifest entries carry `source` exactly as the record says, that each cue can still be synthesised (from the composition it replaces), that the engine
 * routes each chapter to its cue and no other chapter to it (rule 14: which game), that the replaced cues stay in use (so no file is retired), that THEMES.md and
 * CREDITS.md name them, and that the Evrae re-cut moved only two manifest numbers. Nothing here is a listening verdict (AGENTS.md rule 13).
 *
 * Game case: FFX-2 only for `boss-ffx2-fallen-aeons` (Chapters XI and XVI) and `boss-trema` (Chapter XIII, phase 2); FFX only for `boss-seymour-natus` (X),
 * `boss-isaaru` (XIV), `boss-sin-assault` (XVII), `boss-sin-countdown` (XVIII) and the `boss-evrae` re-cut (Chapter VIII).
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { cueForGroup } from '../../src/app/screens/BattleEncounterChain.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { getTrack, hasTrack, isStandIn, trackNames } from '../../src/audio/tracks/index.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { AUDIO_BUDGET_BYTES, externalSource } from '../../tools/audio/manifest-io.mjs';
import { batch2 } from './helpers/musicBatch2.ts';

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
  replaces: string | null;
  request: { model_id: string; prompt: string; music_length_ms: number; force_instrumental: boolean };
  raw: { sha256: string; bytes: number };
  file: { bytes: number; sha256: string };
  manifestEntry: Entry;
  master: { clickRatio: number; fluxRatio: number; stepOk: boolean };
}
interface Seam {
  loopStartSample: number;
  loopEndSample: number;
  loopStart: number;
  loopEnd: number;
  clickRatio: number;
  wrapStep: number;
  splicedClickRatio: number;
}
const record = read('docs/audio/music-batch1-2026-10-10.json') as {
  source: string;
  gameCase: string;
  cues: Cue[];
  evraeRecut: { before: Seam; after: Seam; periodSamples: number; decodedFrames: number; manifestBefore: { loopStart: number; loopEnd: number }; manifestAfter: { loopStart: number; loopEnd: number } };
};
const manifest = read('public/audio/manifest.json') as { music: Record<string, Entry>; sfx: { bytes: number } | null; sfxV2: { bytes: number } | null };
const v2 = read('docs/audio/music-v2-2026-09-30.json') as { cues: { cue: string; after: { sha256: string }; loop: { loopStart: number; loopEnd: number; duration: number } }[] };
const RATE = 44100;

/**
 * The cue each new key plays, the cue it replaced in the chapter (null: the hidden FF7 chapter was silent), the composition that is its synth fallback, and the
 * chapters and links that play it.
 */
const EXPECTED: Record<string, { game: string; replaces: string | null; fallback: string; chapters: Record<string, string[]> }> = {
  'boss-ffx2-fallen-aeons': {
    game: 'FFX-2',
    replaces: 'boss-ffx2-aeon',
    fallback: 'boss-ffx2-aeon',
    // The hidden Valefor at Besaid (FFX-2 only; 2026-10-14) plays the aeon cue on its one link, by reference: the same fallen-aeons battle cue as Chapter XI and Ixion, our own composition, no new file.
    chapters: { 'ffx2-fallen-aeons': ['boss-ffx2-fallen-aeons', 'boss-ffx2-fallen-aeons', 'boss-ffx2-fallen-aeons'], 'ffx2-ixion-djose': ['boss-ffx2-fallen-aeons'], 'ffx2-valefor-besaid': ['boss-ffx2-fallen-aeons'] },
  },
  'boss-trema': { game: 'FFX-2', replaces: 'boss-ffx2-aeon', fallback: 'boss-ffx2-aeon', chapters: { 'ffx2-trema': ['scene-bevelle-underground', 'boss-trema'] } },
  'boss-seymour-natus': { game: 'FFX', replaces: 'boss-seymour-macalania', fallback: 'boss-seymour-macalania', chapters: { 'seymour-natus': ['boss-seymour-natus'] } },
  'boss-isaaru': { game: 'FFX', replaces: 'boss-yojimbo', fallback: 'boss-yojimbo', chapters: { 'isaaru-via-purifico': ['boss-isaaru', 'boss-isaaru', 'boss-isaaru'] } },
  'boss-sin-assault': { game: 'FFX', replaces: 'boss-evrae', fallback: 'boss-evrae', chapters: { 'sin-fins-core': ['boss-sin-assault', 'boss-sin-assault', 'boss-sin-assault'] } },
  'boss-sin-countdown': { game: 'FFX', replaces: 'boss-evrae', fallback: 'boss-evrae', chapters: { 'sin-face': ['boss-sin-countdown'] } },
  // FF7 only: the hidden 'limit' chapter was silent; no FF7 score exists, so the synth fallback is the generic FFX battle bed (named in tracks/index.ts).
  'boss-ff7-guard': { game: 'FF7', replaces: null, fallback: 'battle-ffx', chapters: { 'ff7-guard-scorpion': ['boss-ff7-guard'] } },
};
/** Cues of the record that are in this branch (the FF7 cue is not in every one). */
const NEW = record.cues.map((c) => c.cue);

const sha256 = (path: string) => createHash('sha256').update(readFileSync(join(REPO, path))).digest('hex');
const allChapters = (): Chapter[] => [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];

describe('batch 1 (2026-10-10): the record and the files', () => {
  it('lists the cues once each, in order, with the games and the composition each replaces', () => {
    expect(NEW).toEqual(Object.keys(EXPECTED).filter((k) => NEW.includes(k)));
    for (const c of record.cues) {
      expect(c.game, c.cue).toBe(EXPECTED[c.cue]!.game);
      expect(c.replaces ?? null, c.cue).toBe(EXPECTED[c.cue]!.replaces);
      expect(c.request.model_id, c.cue).toBe('music_v2_5');
    }
  });

  it('ships the recorded files byte for byte, with the recorded manifest entries and the `source` exemption', () => {
    for (const c of record.cues) {
      const entry = manifest.music[c.cue]!;
      expect(entry, `${c.cue} is in the manifest`).toBeDefined();
      expect(entry.file).toBe(`music/${c.cue}.mp3`);
      expect(readFileSync(join(REPO, 'public', 'audio', entry.file)).length).toBe(c.file.bytes);
      expect(sha256(`public/audio/music/${c.cue}.mp3`)).toBe(c.file.sha256);
      expect(entry, c.cue).toEqual(c.manifestEntry);
      expect(entry.bytes).toBe(c.file.bytes);
      expect(externalSource(entry), c.cue).toBe(record.source);
      expect(Object.keys(entry).sort()).toEqual(['bytes', 'duration', 'file', 'loopEnd', 'loopStart', 'lufs', 'source', 'truePeakDb']);
    }
  });

  it('loops on sample boundaries with the 3 s run-on past the loop end, and every seam passed the lane gates', () => {
    for (const c of record.cues) {
      const e = manifest.music[c.cue]!;
      for (const seconds of [e.loopStart, e.loopEnd]) expect(Math.abs(seconds * RATE - Math.round(seconds * RATE)), c.cue).toBeLessThan(0.5);
      expect(Math.abs(e.duration - (e.loopEnd + 3)), c.cue).toBeLessThan(0.001);
      expect(c.master.clickRatio, `${c.cue} click ratio`).toBeLessThan(1);
      expect(c.master.stepOk, `${c.cue} wrap step`).toBe(true);
      expect(c.master.fluxRatio, `${c.cue} spectral flux across the seam`).toBeLessThan(1.05);
    }
  });

  it("can still be synthesised: each cue is a stand-in for the composition it replaces (the MP3 is what plays)", () => {
    for (const c of record.cues) {
      expect(hasTrack(c.cue), c.cue).toBe(true);
      expect(isStandIn(c.cue), `${c.cue} plays another cue's composition and has none of its own`).toBe(true);
      expect(trackNames(), c.cue).not.toContain(c.cue);
      expect(getTrack(c.cue), c.cue).toBe(getTrack(EXPECTED[c.cue]!.fallback));
    }
  });

  it('is described by THEMES.md ("How each cue ships") and CREDITS.md (the prompt as sent, the raw take\'s hash)', () => {
    const themes = text('docs/audio/THEMES.md');
    const credits = text('docs/audio/CREDITS.md');
    for (const c of record.cues) {
      const row = themes.split(/\r?\n/).find((l) => l.startsWith(`| \`${c.cue}\` | `));
      expect(row, `THEMES.md "How each cue ships" has no row for ${c.cue}`).toBeDefined();
      expect(row!.startsWith(`| \`${c.cue}\` | ${c.game} | **ElevenLabs**`), `${c.cue}: ${row}`).toBe(true);
      expect(credits, `CREDITS.md does not carry the raw take's hash for ${c.cue}`).toContain(c.raw.sha256);
      expect(credits).toContain(c.brief);
      expect(credits, `CREDITS.md does not carry the prompt of ${c.cue} as sent`).toContain(c.request.prompt);
    }
  });

  it('stays inside the shipping budget (100 MB under Bailey\'s 2026-10-10 words; 105 MB for the FF7 cue), counting the sfx sprites', () => {
    const shipped = Object.values(manifest.music).reduce((sum, e) => sum + e.bytes, 0) + (manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0);
    expect(shipped).toBeLessThan(AUDIO_BUDGET_BYTES);
  });
});

describe('batch 1 (2026-10-10): the engine routes each chapter to its cue and no other chapter to it (rule 14)', () => {
  /** Every cue the chain resolves for a chapter, link by link, the way the screen does. */
  async function resolved(chapterId: string): Promise<string[]> {
    const chapter = allChapters().find((c) => c.id === chapterId)!;
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
  const preMusic = (chapterId: string): (string | null)[] =>
    allChapters().find((c) => c.id === chapterId)!.scriptsRef.pre.filter((s) => s.type === 'music').map((s) => (s as { track: string | null }).track);

  it('plays each cue on every link of its chapter, and Trema alone on the second phase', async () => {
    for (const cue of NEW) for (const [id, links] of Object.entries(EXPECTED[cue]!.chapters)) expect(await resolved(id), `${id} -> ${cue}`).toEqual(links);
  });

  it('names the cue in the chapter record, its pre scene and its meta, and not the cue it replaced (Trema keeps the scene bed for Paragon; the FF7 chapter is silent in its scene and has no meta)', () => {
    const chapterOf = (id: string) => allChapters().find((c) => c.id === id)!;
    for (const cue of NEW) {
      for (const id of Object.keys(EXPECTED[cue]!.chapters)) {
        const chapter = chapterOf(id);
        expect([chapter.music.battle, chapter.music.phase2], `${id} record`).toContain(cue);
        const replaced = EXPECTED[cue]!.replaces;
        if (EXPECTED[cue]!.game !== 'FF7') {
          // The hidden FF7 chapter has no meta.
          expect(getChapterMeta(id)?.musicKeys, `${id} meta`).toContain(cue);
          expect(getChapterMeta(id)?.musicKeys, `${id} meta`).not.toContain(replaced);
        }
        if (replaced) expect([chapter.music.scene, chapter.music.battle, chapter.music.phase2], `${id} record`).not.toContain(replaced);
      }
    }
    // The pre scenes that start the fight's cue themselves.
    expect(preMusic('seymour-natus')).toContain('boss-seymour-natus');
    expect(preMusic('isaaru-via-purifico')).toContain('boss-isaaru');
    expect(preMusic('sin-fins-core')).toContain('boss-sin-assault');
    expect(preMusic('sin-face')).toContain('boss-sin-countdown');
    for (const id of ['seymour-natus', 'isaaru-via-purifico', 'sin-fins-core', 'sin-face']) {
      expect(preMusic(id), id).not.toContain('boss-evrae');
      expect(preMusic(id), id).not.toContain('boss-yojimbo');
      expect(preMusic(id), id).not.toContain('boss-seymour-macalania');
    }
  });

  it('keeps every other chapter on its own cue: an FFX cue is played only in FFX chapters and an FFX-2 cue only in FFX-2 chapters', async () => {
    for (const chapter of allChapters()) {
      const cues = await resolved(chapter.id);
      const record0 = [chapter.music.scene, chapter.music.battle, chapter.music.phase2];
      for (const cue of NEW) {
        const mine = Object.keys(EXPECTED[cue]!.chapters).includes(chapter.id);
        const plays = cues.includes(cue) || record0.includes(cue);
        expect(plays, `${chapter.id} / ${cue}`).toBe(mine);
        if (plays) expect(chapter.game === 'ffx2' ? 'FFX-2' : chapter.game === 'ff7' ? 'FF7' : 'FFX', `${chapter.id} / ${cue}`).toBe(EXPECTED[cue]!.game);
      }
    }
  });

  it('retires no file: the cues the chapters left are still the cue of another chapter (boss-ffx2-aeon, whose last chapter was the hidden Experiment, retired in batch 2 of 2026-10-12)', async () => {
    const stillUsedBy: Record<string, string> = {
      'boss-seymour-macalania': 'seymour-anima-macalania', // Chapter VII
      'boss-yojimbo': 'yojimbo-cavern', // Chapter IX
      'boss-evrae': 'evrae-airship', // Chapter VIII
    };
    for (const [cue, id] of Object.entries(stillUsedBy)) {
      expect(await resolved(id), `${id} still plays ${cue}`).toContain(cue);
      expect(manifest.music[cue], `${cue} stays in the manifest`).toBeDefined();
    }
  });
});

describe("batch 1 (2026-10-10): boss-evrae's loop points re-cut (FFX, Chapter VIII keeps the cue)", () => {
  const e = record.evraeRecut;
  // Batch 2 (2026-10-12) replaced boss-evrae's file with an original; the re-cut file and entry are what its record says it replaced.
  const replaced = batch2.cues.find((c) => c.cue === 'boss-evrae')?.before ?? null;
  const m = replaced?.manifestEntry ?? manifest.music['boss-evrae']!;

  it('moved only the manifest\'s two loop points: the MP3 is the one music v2 shipped, and the loop period is unchanged', () => {
    const shipped = v2.cues.find((c) => c.cue === 'boss-evrae')!;
    expect(replaced?.sha256 ?? sha256('public/audio/music/boss-evrae.mp3')).toBe(shipped.after.sha256);
    expect([shipped.loop.loopStart, shipped.loop.loopEnd, shipped.loop.duration]).toEqual([e.manifestBefore.loopStart, e.manifestBefore.loopEnd, m.duration]);
    expect([m.loopStart, m.loopEnd]).toEqual([e.manifestAfter.loopStart, e.manifestAfter.loopEnd]);
    expect([m.loopStart, m.loopEnd]).toEqual([e.after.loopStart, e.after.loopEnd]);
    expect(e.after.loopEndSample - e.after.loopStartSample).toBe(e.before.loopEndSample - e.before.loopStartSample);
    expect(e.periodSamples).toBe(3_234_000);
    for (const seconds of [m.loopStart, m.loopEnd]) expect(Math.abs(seconds * RATE - Math.round(seconds * RATE))).toBeLessThan(0.5);
    expect(Math.round(m.loopStart * RATE)).toBe(e.after.loopStartSample);
    expect(Math.round(m.loopEnd * RATE)).toBe(e.after.loopEndSample);
    expect(m.loopEnd).toBeLessThan(m.duration);
  });

  it('stays within 20 ms of the score\'s own loop (the stale-render gate) and cleared the click gate: ratio 4.60 before, under 1.0 after', () => {
    expect(Math.abs(m.loopStart - e.manifestBefore.loopStart)).toBeLessThan(0.02);
    expect(Math.abs(m.loopEnd - e.manifestBefore.loopEnd)).toBeLessThan(0.02);
    expect(e.before.clickRatio).toBe(4.596);
    expect(e.after.clickRatio).toBeLessThan(1);
    expect(e.after.splicedClickRatio).toBeLessThan(1);
    expect(e.after.wrapStep).toBeLessThan(e.before.wrapStep / 100);
  });
});
