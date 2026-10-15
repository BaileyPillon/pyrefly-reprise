// @vitest-environment jsdom
/**
 * Music batch 2 (2026-10-12): 27 ElevenLabs originals replace or join the score, three compositions lose their MP3.
 *
 * Bailey, 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please. this is extremely important."; 2026-10-12:
 * "I'll go with all of your recommendations" (driver items 47, 52, 53, 58 and 61). `docs/audio/music-batch2-2026-10-12.json` is the record (the requests as sent, the raw takes' hashes,
 * the shipped files' hashes, manifest entries and what each replaced). This pins that the shipped files are the ones recorded, that the manifest entries say what the record says (the
 * `source` exemption, the `oneShot` flag on the two defeat cues), that every new cue can still be synthesised (from the composition it stands in for), that the engine routes each chapter
 * to its cues and no other chapter to them (rule 14: which game), that the three retired compositions are unreferenced, unshipped and still a fallback, that Bailey's by-ear picks (Chapter I's
 * boss-seymour, the chapter-select board) were not touched, that THEMES.md and CREDITS.md name every cue, and that the budget holds. The results screen's cues are `results-music.test.ts`'s.
 * Nothing here is a listening verdict (AGENTS.md rule 13).
 *
 * Game case: per cue, from the record (FFX only, FFX-2 only); the plumbing is both.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { cueForGroup } from '../../src/app/screens/BattleEncounterChain.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { MusicPlayer } from '../../src/ui/common/MusicPlayer.ts';
import { RETIRED_MUSIC_CUES, TRACKS, getTrack, hasTrack, isRetiredMusic, isStandIn, trackNames } from '../../src/audio/tracks/index.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { AUDIO_BUDGET_BYTES, externalSource } from '../../tools/audio/manifest-io.mjs';
import { batch2, batch2Added, batch2Replaced, batch2Retired } from './helpers/musicBatch2.ts';

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
  oneShot?: boolean;
}
const manifest = read('public/audio/manifest.json') as { music: Record<string, Entry>; sfx: { bytes: number } | null; sfxV2: { bytes: number } | null; sfxParity: { packs: Record<string, { bytes: number }> } };
const sha256 = (path: string) => createHash('sha256').update(readFileSync(join(REPO, path))).digest('hex');
const RATE = 44100;
const allChapters = (): Chapter[] => [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];
const GAME = (c: Chapter): string => (c.game === 'ffx2' ? 'FFX-2' : c.game === 'ff7' ? 'FF7' : 'FFX');

/** The twenty-seven cues, in the record's order, with the game each belongs to. */
const CUES = batch2.cues.map((c) => c.cue);

describe('batch 2 (2026-10-12): the record and the files', () => {
  it('lists the 27 cues once each: 18 replaced in place, 9 new, 3 retired', () => {
    expect(CUES).toHaveLength(27);
    expect(new Set(CUES).size).toBe(27);
    expect(batch2Replaced.size).toBe(18);
    expect(batch2Added.size).toBe(9);
    expect([...batch2Retired].sort()).toEqual([...RETIRED_MUSIC_CUES].sort());
    expect(batch2.totals).toMatchObject({ replacedInPlace: 18, newCues: 9, retiredFiles: 3 });
    for (const c of batch2.cues) {
      expect(c.request.model_id, c.cue).toBe('music_v2_5');
      expect(c.pick, c.cue).toMatch(/^[A-Z0-9-]+$/);
    }
  });

  it('ships the recorded files byte for byte, with the recorded manifest entries and the `source` exemption', () => {
    for (const c of batch2.cues) {
      const entry = manifest.music[c.cue]!;
      expect(entry, `${c.cue} is in the manifest`).toBeDefined();
      expect(entry.file).toBe(`music/${c.cue}.mp3`);
      expect(statSync(join(REPO, 'public/audio', entry.file)).size).toBe(c.file.bytes);
      expect(sha256(`public/audio/music/${c.cue}.mp3`)).toBe(c.file.sha256);
      expect(entry, c.cue).toEqual(c.manifestEntry);
      expect(entry.bytes).toBe(c.file.bytes);
      expect(externalSource(entry), c.cue).toBe(batch2.source);
      const keys = ['bytes', 'duration', 'file', 'loopEnd', 'loopStart', 'lufs', 'source', 'truePeakDb', ...(c.kind === 'oneshot' ? ['oneShot'] : [])].sort();
      expect(Object.keys(entry).sort(), c.cue).toEqual(keys);
    }
  });

  it('loops on sample boundaries; a loop has the 3 s run-on past its end, a one-shot ends in 2 s of held silence', () => {
    for (const c of batch2.cues) {
      const e = manifest.music[c.cue]!;
      for (const seconds of [e.loopStart, e.loopEnd]) expect(Math.abs(seconds * RATE - Math.round(seconds * RATE)), c.cue).toBeLessThan(0.5);
      if (c.kind === 'oneshot') {
        expect(e.oneShot, c.cue).toBe(true);
        expect(e.loopEnd, `${c.cue}: the loop is the end of the file`).toBe(e.duration);
        expect(e.loopEnd - e.loopStart, c.cue).toBeGreaterThan(1.9);
        expect(e.loopEnd - e.loopStart, c.cue).toBeLessThan(2.1);
        expect(c.master.clickRatio, `${c.cue} ends in digital silence`).toBe(0);
      } else {
        expect(Math.abs(e.duration - (e.loopEnd + 3)), c.cue).toBeLessThan(0.001);
        expect(c.master.clickRatio as number, `${c.cue} click ratio`).toBeLessThan(1);
        expect(c.master.stepOk, `${c.cue} wrap step`).toBe(true);
        expect(c.master.fluxRatio as number, `${c.cue} spectral flux across the seam`).toBeLessThan(1.05);
      }
    }
  });

  it('is the file the lane mastered to -16 LUFS and passed the stereo gate (correlation 0.60 to 0.85, side/mid -10 to -6 dB, mono loss no worse than -1 dB)', () => {
    for (const c of batch2.cues) {
      const s = c.stereo.after;
      expect(c.stereo.pass, c.cue).toBe(true);
      expect(s.corr, `${c.cue} correlation`).toBeGreaterThanOrEqual(0.6);
      expect(s.corr, `${c.cue} correlation`).toBeLessThanOrEqual(0.85);
      expect(s.sideMid, `${c.cue} side/mid`).toBeGreaterThanOrEqual(-10);
      expect(s.sideMid, `${c.cue} side/mid`).toBeLessThanOrEqual(-6);
      expect(s.monoLoss, `${c.cue} mono loss`).toBeGreaterThanOrEqual(-1);
      expect(Math.abs(c.manifestEntry.lufs + 16), c.cue).toBeLessThan(0.5);
      expect(c.manifestEntry.truePeakDb, `${c.cue} true peak`).toBeLessThanOrEqual(-1);
    }
  });

  it('knows what each replaced: the file the base shipped (hash and size), and that bytes before plus the movement are the bytes after', () => {
    let moved = 0;
    for (const c of batch2.cues) {
      if (c.mode === 'replace') {
        expect(c.before, `${c.cue} replaced something`).not.toBeNull();
        expect(c.before!.manifestEntry.bytes, c.cue).toBe(c.before!.bytes);
        expect(c.before!.sha256, `${c.cue} replaced another file`).not.toBe(c.file.sha256);
        moved += c.file.bytes - c.before!.bytes;
      } else {
        expect(c.before, `${c.cue} is new`).toBeNull();
        moved += c.file.bytes;
      }
    }
    for (const r of batch2.retired) moved -= r.bytes;
    expect(batch2.totals.musicBytesAfter - batch2.totals.musicBytesBefore).toBe(moved);
    expect(Object.values(manifest.music).reduce((sum, e) => sum + e.bytes, 0)).toBe(batch2.totals.musicBytesAfter);
  });

  it('leaves what Bailey chose by ear alone (58d): Chapter I\'s boss-seymour and the chapter-select board are not in the record', () => {
    expect(CUES).not.toContain('boss-seymour');
    expect(CUES).not.toContain('chapter-select');
    expect(CUES).not.toContain('title');
    const seymour = allChapters().find((c) => c.id === 'seymour-flux')!;
    expect([seymour.music.battle, seymour.enemyGroupRef.musicCues?.[0]?.track]).toEqual(['boss-seymour', 'boss-seymour']);
  });

  it('stays inside the shipping budget with every sprite and pack counted, and well under the 105 MB the batch started with', () => {
    const packs = Object.values(manifest.sfxParity?.packs ?? {}).reduce((sum, p) => sum + (p.bytes ?? 0), 0);
    const shipped = Object.values(manifest.music).reduce((sum, e) => sum + e.bytes, 0) + (manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0) + packs;
    expect(shipped).toBeLessThan(AUDIO_BUDGET_BYTES);
    expect(batch2.totals.musicBytesAfter).toBeLessThan(batch2.totals.musicBytesBefore);
  });
});

describe('batch 2: synthesis, retirement and the jukebox', () => {
  const stillMine = batch2.cues.filter((c) => c.mode === 'new');

  it('every new cue can still be synthesised: it stands in for the composition the record names, and has none of its own', () => {
    for (const c of stillMine) {
      expect(hasTrack(c.cue), c.cue).toBe(true);
      expect(isStandIn(c.cue), `${c.cue} plays another cue's composition and has none of its own`).toBe(true);
      expect(trackNames(), c.cue).not.toContain(c.cue);
      expect(getTrack(c.cue), c.cue).toBe(getTrack(c.fallback));
    }
  });

  it('every replaced cue keeps its own composition as its fallback (the MP3 is what plays)', () => {
    for (const c of batch2.cues.filter((x) => x.mode === 'replace')) {
      expect(trackNames(), c.cue).toContain(c.cue);
      expect(isStandIn(c.cue), c.cue).toBe(false);
    }
  });

  it('retires three MP3s: gone from the disk and the manifest, kept as a composition, and the fallback of a cue that is still played', () => {
    const fallbackOf = new Map(stillMine.map((c) => [c.cue, c.fallback]));
    for (const r of batch2.retired) {
      expect(existsSync(join(REPO, 'public/audio', r.manifestEntry.file)), `${r.cue}'s file is still on disk`).toBe(false);
      expect(manifest.music[r.cue], `${r.cue} is still in the manifest`).toBeUndefined();
      expect(isRetiredMusic(r.cue)).toBe(true);
      expect(TRACKS[r.cue], `${r.cue} lost its composition`).toBeDefined();
      expect(trackNames(), r.cue).toContain(r.cue);
      expect([...fallbackOf.values()], `${r.cue} is no one's fallback, so why is it kept`).toContain(r.cue);
    }
    expect(manifest.music['boss-yunalesca'], 'boss-yunalesca').toBeUndefined();
    expect(RETIRED_MUSIC_CUES).toEqual(['boss-ffx2-aeon', 'boss-dread', 'boss-yunalesca']);
  });

  it('retires only what nothing plays: no chapter record, script, formation or dossier names a retired cue', async () => {
    for (const chapter of allChapters()) {
      const named = new Set<string>([chapter.music.scene ?? '', chapter.music.battle ?? '', chapter.music.phase2 ?? '', chapter.music.victory ?? '', ...(getChapterMeta(chapter.id)?.musicKeys ?? [])]);
      let group: typeof chapter.enemyGroupRef | null = chapter.enemyGroupRef;
      for (let i = 0; group && i < 16; i++) {
        for (const cue of group.musicCues ?? []) if (cue.track) named.add(cue.track);
        group = group.nextGroupId ? await findEnemyGroup(group.nextGroupId) : null;
      }
      for (const script of [chapter.scriptsRef.pre, chapter.scriptsRef.post, ...Object.values(chapter.scriptsRef.midScripts ?? {})]) {
        for (const step of script) if (step.type === 'music' && step.track) named.add(step.track);
      }
      for (const cue of RETIRED_MUSIC_CUES) expect(named.has(cue), `${chapter.id} still names the retired ${cue}`).toBe(false);
    }
  });

  it('keeps the pause jukebox to what ships: a retired composition is not listed, a chapter\'s own stand-in cue is', () => {
    const player = new MusicPlayer({ root: document.createElement('div'), chapterKeys: ['boss-gui', 'boss-challenge'] });
    for (const cue of RETIRED_MUSIC_CUES) expect(player.select(cue), `${cue} is listed`).toBe(false);
    for (const cue of ['boss-gui', 'boss-challenge', 'boss-jecht', 'boss-seymour', 'scene-gagazet']) expect(player.select(cue), `${cue} is not listed`).toBe(true);
  });
});

describe('batch 2: the engine routes each chapter to its cues (rule 14: which game)', () => {
  /** Every cue the chain resolves for a chapter, link by link, the way the screen does. */
  async function links(chapter: Chapter): Promise<string[]> {
    const out: string[] = [];
    let group = chapter.enemyGroupRef;
    let link: 'first' | 'next' = 'first';
    for (let i = 0; i < 16 && group; i++) {
      out.push(cueForGroup(chapter, group, link).track ?? '(carries)');
      link = 'next';
      if (!group.nextGroupId) break;
      group = (await findEnemyGroup(group.nextGroupId))!;
    }
    return out;
  }
  const pre = (c: Chapter): (string | null)[] => c.scriptsRef.pre.filter((s) => s.type === 'music').map((s) => (s as { track: string | null }).track);

  /** The chapter's scene bed (the record) and each link's theme, after batch 2. Everything else about a chapter's music is unchanged and pinned by its own tests. */
  const EXPECTED: Record<string, { scene: string | null; links: string[] }> = {
    'seymour-flux': { scene: 'scene-gagazet', links: ['boss-seymour'] },
    yunalesca: { scene: 'scene-zanarkand-dome', links: ['boss-challenge'] },
    'braskas-final-aeon': { scene: 'scene-dreams-end', links: ['boss-jecht', '(carries)', 'boss-yu-yevon', 'boss-yu-yevon', 'boss-yu-yevon', 'boss-yu-yevon', 'boss-yu-yevon'] },
    'ffx2-bahamut': { scene: 'scene-bevelle-underground', links: ['boss-bahamut'] },
    'ffx2-vegnagun-shuyin': { scene: 'scene-farplane', links: ['boss-vegnagun', 'boss-vegnagun', 'boss-vegnagun', 'boss-vegnagun', '(carries)'] },
    'ffx2-leblanc': { scene: 'scene-chateau-leblanc', links: ['boss-leblanc', 'boss-leblanc', 'boss-leblanc'] },
    'seymour-anima-macalania': { scene: 'scene-macalania-temple', links: ['boss-seymour-macalania'] },
    'evrae-airship': { scene: 'scene-fahrenheit', links: ['boss-evrae'] },
    'yojimbo-cavern': { scene: 'scene-gagazet', links: ['boss-yojimbo'] },
    'seymour-natus': { scene: 'scene-gagazet', links: ['boss-seymour-natus'] },
    'ffx2-fallen-aeons': { scene: 'scene-farplane', links: ['boss-ffx2-fallen-aeons', 'boss-ffx2-fallen-aeons', 'boss-ffx2-fallen-aeons'] },
    'seymour-omnis': { scene: 'scene-dreams-end', links: ['boss-seymour-omnis'] },
    'ffx2-trema': { scene: 'scene-bevelle-underground', links: ['scene-bevelle-underground', 'boss-trema'] },
    'isaaru-via-purifico': { scene: 'scene-gagazet', links: ['boss-isaaru', 'boss-isaaru', 'boss-isaaru'] },
    'ffx2-den-of-woe': { scene: 'scene-bevelle-underground', links: ['boss-den-of-woe', 'boss-den-of-woe', 'boss-den-of-woe'] },
    'ffx2-ixion-djose': { scene: 'scene-bevelle-underground', links: ['boss-ffx2-fallen-aeons'] },
    'sin-fins-core': { scene: 'scene-fahrenheit', links: ['boss-sin-assault', 'boss-sin-assault', 'boss-sin-assault'] },
    'sin-face': { scene: 'scene-fahrenheit', links: ['boss-sin-countdown'] },
    'ff7-guard-scorpion': { scene: null, links: ['boss-ff7-guard'] },
    'exp-leblanc': { scene: 'scene-chateau-leblanc', links: ['boss-leblanc', 'boss-leblanc', 'boss-leblanc'] },
    'ffx2-masterpiece-theatre': { scene: 'scene-bevelle-underground', links: ['boss-experiment', 'boss-experiment'] },
    'sinspawn-gui': { scene: 'scene-gagazet', links: ['boss-gui', 'boss-challenge'] },
    'exp-fayth': { scene: 'scene-fahrenheit', links: ['boss-evrae'] }, // the hidden Fayth chapter is Chapter VIII's record by reference, so it plays Chapter VIII's music (FFX only)
    'biran-yenke': { scene: 'scene-gagazet', links: ['boss-challenge'] }, // the hidden Biran and Yenke chapter (FFX only, 2026-10-14): the mountain's own bed and the generic "Challenge" boss cue Chapter II and the Gui guest hour play, by reference (no source names this fight's cue)
    'ffx2-tourist-trap': { scene: 'scene-bevelle-underground', links: ['boss-ffx2-fallen-aeons'] }, // the hidden Tourist Trap (FFX-2 only, 2026-10-14): the field bed and the "Aeons" cue the Road and Ixion play, by reference
    'ffx2-valefor-besaid': { scene: 'scene-bevelle-underground', links: ['boss-ffx2-fallen-aeons'] }, // the hidden Valefor at Besaid (FFX-2 only): the aeon cue Chapter XI and Ixion play, our own take
    'ffx2-angra-mainyu': { scene: 'scene-bevelle-underground', links: ['boss-ffx2-fallen-aeons'] }, // the hidden Angra Mainyu (FFX-2 only, 2026-10-14): the same "Aeons" cue, by reference
    'mirror-aeons': { scene: 'scene-gagazet', links: ['boss-challenge', 'boss-yojimbo'] }, // the hidden Mirror Aeons chapter (FFX only, 2026-10-15): the mountain's bed as the stand-in, the generic "Challenge" boss cue for the Sisters and Yojimbo's own cue for Dark Yojimbo, both by reference
  };

  it('plays each chapter\'s scene bed and each link\'s theme as the table says: the 18 listed chapters, FF7, and the five hidden experiments', async () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(allChapters().map((c) => c.id).sort());
    for (const chapter of allChapters()) {
      expect(chapter.music.scene, `${chapter.id} scene`).toBe(EXPECTED[chapter.id]!.scene);
      expect(await links(chapter), `${chapter.id} links`).toEqual(EXPECTED[chapter.id]!.links);
    }
  });

  it('starts the chateau bed in Chapter VI\'s and the hidden Leblanc preview\'s pre scene, and in no other chapter\'s', () => {
    for (const chapter of allChapters()) {
      const beds = pre(chapter);
      expect(beds.includes('scene-chateau-leblanc'), chapter.id).toBe(chapter.id === 'ffx2-leblanc' || chapter.id === 'exp-leblanc');
      if (chapter.id === 'ffx2-leblanc' || chapter.id === 'exp-leblanc') expect(beds, chapter.id).not.toContain('scene-bevelle-underground');
    }
  });

  it('plays each new cue in its own chapters only, and only in its own game (an FFX cue in FFX chapters, an FFX-2 cue in FFX-2 chapters)', async () => {
    const owners: Record<string, string[]> = {
      'boss-challenge': ['yunalesca', 'sinspawn-gui', 'biran-yenke', 'mirror-aeons'],
      'boss-gui': ['sinspawn-gui'],
      'boss-seymour-omnis': ['seymour-omnis'],
      'boss-den-of-woe': ['ffx2-den-of-woe'],
      'boss-experiment': ['ffx2-masterpiece-theatre'],
      'scene-chateau-leblanc': ['ffx2-leblanc', 'exp-leblanc'],
      'victory-bahamut': ['ffx2-bahamut'],
    };
    for (const c of batch2.cues.filter((x) => x.mode === 'new' && owners[x.cue])) {
      for (const chapter of allChapters()) {
        const meta = getChapterMeta(chapter.id)?.musicKeys ?? [];
        const plays = [chapter.music.scene, chapter.music.battle, chapter.music.phase2, chapter.music.victory, ...(await links(chapter)), ...pre(chapter), ...meta].includes(c.cue);
        expect(plays, `${chapter.id} / ${c.cue}`).toBe(owners[c.cue]!.includes(chapter.id));
        if (plays) expect(GAME(chapter), `${chapter.id} / ${c.cue}`).toBe(c.game);
      }
    }
  });

  it('keeps Chapter I and the board on the cues Bailey chose by ear, and takes the Experiment and Sinspawn Gui off the cues they borrowed', async () => {
    expect(await links(allChapters().find((c) => c.id === 'seymour-flux')!)).toEqual(['boss-seymour']);
    const borrowed = ['boss-seymour', 'boss-dread', 'boss-ffx2-aeon', 'boss-vegnagun', 'boss-yunalesca'];
    for (const id of ['ffx2-masterpiece-theatre', 'sinspawn-gui', 'seymour-omnis', 'ffx2-den-of-woe']) {
      const chapter = allChapters().find((c) => c.id === id)!;
      const cues = [chapter.music.battle, chapter.music.phase2, ...(await links(chapter))];
      for (const cue of borrowed) expect(cues, `${id} still plays ${cue}`).not.toContain(cue);
    }
  });
});

describe('batch 2: THEMES.md and CREDITS.md name every cue', () => {
  const themes = text('docs/audio/THEMES.md').split(/\r?\n/);
  const credits = text('docs/audio/CREDITS.md');

  it('has a "How each cue ships" row for each, with the figures of the shipped file, and discloses the stereo gate where it failed as rendered', () => {
    for (const c of batch2.cues) {
      const row = themes.find((l) => l.startsWith(`| \`${c.cue}\` | `));
      expect(row, `THEMES.md has no row for ${c.cue}`).toBeDefined();
      const cells = row!.split('|').slice(1, -1).map((x) => x.trim());
      expect(cells[1], c.cue).toBe(c.game);
      expect(cells[2]!.startsWith('**ElevenLabs**'), `${c.cue}: ${cells[2]}`).toBe(true);
      expect(cells[2], c.cue).toContain(`brief \`${c.pick}\``);
      expect([Number(cells[3]), Number(cells[4]), Number(cells[5])], `${c.cue}: THEMES.md columns`).toEqual([c.stereo.after.corr, c.stereo.after.sideMid, c.stereo.after.monoLoss]);
      if (!c.stereo.passedAsRendered) expect(cells[2], `${c.cue}: the failed stereo gate is not disclosed`).toMatch(/stereo gate failed/);
    }
    for (const r of batch2.retired) {
      const row = themes.find((l) => l.startsWith(`| \`${r.cue}\` | `));
      expect(row, r.cue).toBeDefined();
      expect(row, r.cue).toContain('**retired**');
    }
  });

  it('carries, for each, the raw take\'s hash and the prompt as sent', () => {
    for (const c of batch2.cues) {
      expect(credits, `CREDITS.md does not carry the raw take's hash for ${c.cue}`).toContain(c.raw.sha256);
      expect(credits, `CREDITS.md does not name brief ${c.pick}`).toContain(`brief \`${c.pick}\``);
      expect(credits, `CREDITS.md does not carry the prompt of ${c.cue} as sent`).toContain(c.request.prompt);
    }
  });

  it('shows the chapters\' cues in the chapter cue map as they now are (Chapters II, IV, VI, XII and XV, and the hidden Sinspawn Gui row)', () => {
    const row = (id: string) => themes.find((l) => l.includes(`\`${id}\` `) && /^\| (I|II|III|IV|V|VI|XII|XV|EXP) \|/.test(l)) ?? '';
    expect(row('yunalesca')).toContain('`boss-challenge`');
    expect(row('ffx2-bahamut')).toContain('`victory-bahamut`');
    expect(row('ffx2-leblanc')).toContain('`scene-chateau-leblanc`');
    expect(row('seymour-omnis')).toContain('`boss-seymour-omnis`');
    expect(row('ffx2-den-of-woe')).toContain('`boss-den-of-woe`');
    expect(row('sinspawn-gui')).toContain('fight 1 `boss-gui`, fight 2 `boss-challenge`');
  });
});
