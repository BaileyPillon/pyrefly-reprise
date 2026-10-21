// @vitest-environment jsdom
/**
 * Release 61 (the conference demo build), QUIETER RESULTS for one fight (Bailey, 2026-10-21 ~00:15 EDT, decision 168d, "Quieter results for this fight (Recommended)"):
 * FFX-2 Chapter IV (Bahamut) gets a softer results cue and a calmer Rikku face; every other chapter, in both games, is exactly what it was.
 *
 * Game case: FFX-2 ONLY (Chapter IV; `research/ffx-vs-ffx2-presentation.md` section 2.2: no victory pose after Bahamut, the celebration withheld when the story is grave).
 * Existing assets only: the cue is `pause` (already in the library and the manifest), the face is the head of Rikku's Dark Knight painting (already shipped, with a measured crop).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { chapterWarmCues } from '../../src/app/chapterMusicWarm.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import { DEFEAT_CUES, resultsCueFor, resultsScreenSilent, startResultsMusic } from '../../src/app/screens/resultsMusic.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { CHAPTERS, getChapter, type ChapterId } from '../../src/data/encounters.ts';
import { partyFaceHtml } from '../../src/ui/common/partyFace.ts';
import { buildMemberRows } from '../../src/ui/common/resultsMath.ts';
import { phonePageHtml } from '../../src/ui/common/resultsPhone.ts';
import { QUIET_RESULTS, quietResultsOf } from '../../src/ui/common/quietResults.ts';
import { wedgePortraitId } from '../../src/ui/common/victoryLine.ts';

const REPO = resolve(__dirname, '..', '..');

function result(outcome: BattleResult['outcome']): BattleResult {
  return { outcome, turns: 10, elapsedTicks: 500, elapsedMs: 60_000, ap: 10, exp: 10, gil: 100, drops: [], overkilled: [], sphereLevelsGained: {} };
}

function render(chapterId: ChapterId, outcome: BattleResult['outcome']): HTMLElement {
  const save = new SaveStore('r61-quiet-results-test', null);
  save.recordAttempt(chapterId);
  const screen = new ResultsScreen({ chapterId, result: result(outcome) });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  return root;
}

const faceSrcs = (root: HTMLElement, who: string): string[] => {
  const row = [...root.querySelectorAll<HTMLElement>('.rres__member')].find((m) => m.querySelector('.rres__member-name')?.textContent === who);
  return [...(row?.querySelectorAll('.rres__face img') ?? [])].map((i) => i.getAttribute('src') ?? '');
};

describe('the table: Chapter IV of FFX-2 and nothing else', () => {
  it('names exactly one chapter, and it is an FFX-2 chapter', () => {
    expect(Object.keys(QUIET_RESULTS)).toEqual(['ffx2-bahamut']);
    expect(getChapter('ffx2-bahamut')?.game).toBe('ffx2');
    expect(getChapter('ffx2-bahamut')?.number).toBe(4);
  });

  it('answers null for every other chapter, for undefined, and for a prototype key', () => {
    for (const c of CHAPTERS) if (c.id !== 'ffx2-bahamut') expect(quietResultsOf(c.id), c.id).toBeNull();
    expect(quietResultsOf(undefined)).toBeNull();
    expect(quietResultsOf('toString')).toBeNull();
    expect(quietResultsOf('constructor')).toBeNull();
  });
});

describe('the cue', () => {
  it('Chapter IV\'s win plays `pause`, a victory-kind cue, with the results fade; its own `music.victory` is left as it was', () => {
    const ch = getChapter('ffx2-bahamut')!;
    expect(ch.music.victory).toBe('victory-bahamut'); // encounters.ts (a contract file) is untouched
    expect(resultsCueFor(ch, 'victory')).toEqual({ cue: 'pause', kind: 'victory', fade: 0.4 });
    expect(resultsScreenSilent(ch)).toBe(true); // no pose, no tally flourish, no quips: unchanged
  });

  it('Chapter IV\'s loss and withdrawal are unchanged: its game\'s defeat cue, and nothing for an escape', () => {
    const ch = getChapter('ffx2-bahamut')!;
    expect(resultsCueFor(ch, 'defeat')).toMatchObject({ cue: DEFEAT_CUES.ffx2, kind: 'defeat' });
    expect(resultsCueFor(ch, 'escape')).toBeNull();
  });

  it('every other chapter, in both games, plays what it played: its own `music.victory` (or nothing)', () => {
    for (const c of CHAPTERS) {
      if (c.id === 'ffx2-bahamut') continue;
      expect(resultsCueFor(c, 'victory'), c.id).toEqual(c.music.victory ? { cue: c.music.victory, kind: 'victory', fade: 0.4 } : null);
    }
    expect(resultsCueFor(getChapter('seymour-flux')!, 'victory')?.cue).toBe('victory-ffx');
    expect(resultsCueFor(getChapter('ffx2-vegnagun-shuyin')!, 'victory')?.cue).toBe('victory-ffx2');
  });

  it('is a cue the library has, that loops under a results screen, and the project\'s own named stand-in for this slot', () => {
    const manifest = JSON.parse(readFileSync(resolve(REPO, 'public/audio/manifest.json'), 'utf8')) as { music: Record<string, { duration: number; loopStart?: number; loopEnd?: number; oneShot?: boolean }> };
    const cue = manifest.music['pause']!;
    expect(cue, 'pause is in the manifest').toBeTruthy();
    expect(cue.oneShot).not.toBe(true);
    expect(cue.loopStart).toBeGreaterThan(0);
    expect(cue.loopEnd!).toBeGreaterThan(cue.loopStart!);
    expect(cue.loopEnd!).toBeLessThanOrEqual(cue.duration);
    expect(manifest.music['victory-bahamut'], 'the cue it replaces is still in the library, for a one-line revert').toBeTruthy();
    const tracks = readFileSync(resolve(REPO, 'src/audio/tracks/index.ts'), 'utf8');
    expect(tracks).toMatch(/'victory-bahamut': 'pause'/); // the synth stand-in of this very slot is `pause`
    expect(QUIET_RESULTS['ffx2-bahamut']!.cue).toBe('pause');
  });

  it('is what the mixer is asked for on a Chapter IV win, and on no other chapter\'s', () => {
    const asked: string[] = [];
    const audio = { requestedMusic: null, playMusic: (n: string) => void asked.push(n), stopMusic: () => undefined };
    startResultsMusic(audio, resultsCueFor(getChapter('ffx2-bahamut')!, 'victory'));
    startResultsMusic(audio, resultsCueFor(getChapter('ffx2-leblanc')!, 'victory'));
    startResultsMusic(audio, resultsCueFor(getChapter('seymour-flux')!, 'victory'));
    expect(asked).toEqual(['pause', 'victory-ffx2', 'victory-ffx']);
  });

  it('is what the chapter\'s run warms while the player is in party prep (not the cue the screen no longer plays)', () => {
    const ch4 = chapterWarmCues(getChapter('ffx2-bahamut')!);
    expect(ch4).toContain('pause');
    expect(ch4).not.toContain('victory-bahamut');
    expect(ch4).toContain(DEFEAT_CUES.ffx2);
    for (const c of CHAPTERS) {
      if (c.id === 'ffx2-bahamut' || !c.music.victory) continue;
      expect(chapterWarmCues(c), c.id).toContain(c.music.victory);
    }
  });
});

describe('Rikku\'s face on the results', () => {
  it('the face ladder has a body-only mode: her dressphere\'s painting\'s head, and no portrait rung', () => {
    const plain = partyFaceHtml({ id: 'rikku', name: 'Rikku', dressphere: 'dark-knight' });
    const quiet = partyFaceHtml({ id: 'rikku', name: 'Rikku', dressphere: 'dark-knight', bodyOnly: true });
    expect(plain).toMatch(/art\/portraits\/rikku(-x2)?\.png/);
    expect(quiet).not.toContain('art/portraits/');
    expect(quiet).toContain('art/characters/rikku-dark-knight/idle.png');
    // the flag is for a dressphere only (FFX has no dressphere and one portrait per id): ignored there
    expect(partyFaceHtml({ id: 'tidus', name: 'Tidus', bodyOnly: true })).toBe(partyFaceHtml({ id: 'tidus', name: 'Tidus' }));
  });

  it('Chapter IV, a win: Rikku\'s tile is the Dark Knight painting\'s head; Yuna\'s and Paine\'s tiles keep their portraits, and the wedge is still Yuna', () => {
    const root = render('ffx2-bahamut', 'victory');
    expect(faceSrcs(root, 'Rikku').join(' ')).not.toContain('art/portraits/');
    expect(faceSrcs(root, 'Rikku').join(' ')).toContain('art/characters/rikku-dark-knight/idle.png');
    expect(faceSrcs(root, 'Yuna').join(' ')).toMatch(/art\/portraits\/yuna(-x2)?\.png/);
    expect(faceSrcs(root, 'Paine').join(' ')).toContain('art/portraits/paine.png');
    expect(root.querySelector('.rres__ink img')?.getAttribute('src')).toContain(`art/portraits/${wedgePortraitId('yuna', getChapter('ffx2-bahamut'))}.png`);
    expect(root.querySelector('.rres--silent')).not.toBeNull();
    root.remove();
  });

  it('Chapter IV, a loss: the grin is as wrong there, so the tile is the same; the leader still lies fallen', () => {
    const root = render('ffx2-bahamut', 'defeat');
    expect(faceSrcs(root, 'Rikku').join(' ')).not.toContain('art/portraits/');
    expect(root.querySelector('.rres__ink img')?.getAttribute('src')).toContain('art/characters/yuna-white-mage/hurt.png');
    root.remove();
  });

  it('the phone page\'s chips follow the desktop page (the same model)', () => {
    const ch = getChapter('ffx2-bahamut')!;
    const model = {
      victory: true, silent: true, heading: 'Results', clock: '1:00', tags: [], quip: undefined, ledger: [], progress: 1, actionIndex: 0,
      rows: buildMemberRows(ch, result('victory')),
      bodyFaces: quietResultsOf(ch.id)!.bodyFaces,
    };
    const host = document.createElement('div');
    host.innerHTML = phonePageHtml(model, '');
    const chips = [...host.querySelectorAll<HTMLElement>('.rresp__chip-member')];
    expect(chips.length).toBe(3);
    const srcs = (name: string): string =>
      [...chips.find((c) => c.querySelector('.rresp__name')?.textContent === name)!.querySelectorAll('img')].map((i) => i.getAttribute('src')).join(' ');
    expect(srcs('Rikku')).not.toContain('art/portraits/');
    expect(srcs('Rikku')).toContain('art/characters/rikku-dark-knight/idle.png');
    expect(srcs('Yuna')).toMatch(/art\/portraits\/yuna(-x2)?\.png/);
    // without the list, the same chips draw the portrait (every other chapter)
    const plain = document.createElement('div');
    plain.innerHTML = phonePageHtml({ ...model, bodyFaces: undefined }, '');
    expect(plain.innerHTML).toMatch(/art\/portraits\/rikku(-x2)?\.png/);
  });

  it('every other chapter keeps every portrait tile it had: Rikku in Chapter VI (FFX-2) and Tidus in Chapter I (FFX)', () => {
    const vi = render('ffx2-leblanc', 'victory');
    expect(faceSrcs(vi, 'Rikku').join(' ')).toMatch(/art\/portraits\/rikku(-x2)?\.png/);
    vi.remove();
    const i = render('seymour-flux', 'victory');
    expect(faceSrcs(i, 'Tidus').join(' ')).toContain('art/portraits/tidus.png');
    i.remove();
  });
});
