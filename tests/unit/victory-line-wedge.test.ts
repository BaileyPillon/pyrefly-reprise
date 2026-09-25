// @vitest-environment jsdom
// VL-1, closed by option 2 (Bailey, 2026-09-25: "I'll go with your recommendations
// for everything"): on a win the member who speaks the victory line stands in the
// results wedge; a loss keeps the leader's fallen pose. Both games: the results
// screen is shared plumbing. This drives the real `ResultsScreen.enter()` for every
// registered chapter and several rotation turns, and reads the rendered DOM.
import { describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { CHAPTERS, getChapter, type ChapterId } from '../../src/data/encounters.ts';
import { measuredPortraitIds } from '../../src/ui/common/portrait.ts';
import { buildMemberRows, leaderId } from '../../src/ui/common/resultsMath.ts';
import { victoryLine, wedgeFigureId } from '../../src/ui/common/victoryLine.ts';

function result(outcome: BattleResult['outcome']): BattleResult {
  return {
    outcome,
    turns: 10,
    elapsedTicks: 500,
    elapsedMs: 60_000,
    ap: 10,
    exp: 10,
    gil: 100,
    drops: [],
    overkilled: [],
    sphereLevelsGained: {},
  };
}

/** Enter a real results screen after `attempts` recorded attempts; return its root. */
function render(chapterId: ChapterId, outcome: BattleResult['outcome'], attempts: number): HTMLElement {
  const save = new SaveStore('vl1-wedge-test', null);
  for (let i = 0; i < attempts; i++) save.recordAttempt(chapterId);
  const screen = new ResultsScreen({ chapterId, result: result(outcome) });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  return root;
}

/** The member whose art the wedge shows, read off the rendered `<img>`'s src. */
function wedgeId(root: HTMLElement): string | undefined {
  const src = root.querySelector('.rres__ink img')?.getAttribute('src') ?? '';
  return /art\/(?:portraits|characters)\/([^/.]+)/.exec(src)?.[1];
}

const TURNS = [1, 2, 3, 4, 5, 6];

describe('VL-1 option 2: the speaker stands in the wedge (both games)', () => {
  for (const chapter of CHAPTERS) {
    it(`${chapter.id}: on every win the wedge figure is the line's speaker`, () => {
      for (const attempts of TURNS) {
        const root = render(chapter.id, 'victory', attempts);
        const quip = root.querySelector<HTMLElement>('.rres__quip');
        const speaker = quip?.dataset.speaker;
        if (speaker) expect(wedgeId(root), `${chapter.id} attempt ${attempts}`).toBe(speaker);
        else expect(wedgeId(root) ?? leaderId(chapter)).toBe(leaderId(chapter));
        root.remove();
      }
    });

    it(`${chapter.id}: a loss keeps the leader's fallen pose, with no line`, () => {
      for (const attempts of TURNS) {
        const root = render(chapter.id, 'defeat', attempts);
        expect(root.querySelector('.rres__quip')).toBeNull();
        const img = root.querySelector('.rres__ink img.rres__hero--fallen');
        expect(img?.getAttribute('src')).toContain(`art/characters/${leaderId(chapter)}/hurt.png`);
        root.remove();
      }
    });
  }

  it('Chapters I and II rotate the wedge off the leader on the second win', () => {
    const one = render('seymour-flux', 'victory', 1);
    expect(wedgeId(one)).toBe('tidus');
    const two = render('yunalesca', 'victory', 2);
    expect(two.querySelector<HTMLElement>('.rres__quip')?.dataset.speaker).toBe('yuna');
    expect(wedgeId(two)).toBe('yuna');
  });

  it('every member who can speak a line has a measured portrait for the wedge', () => {
    const measured = new Set(measuredPortraitIds());
    for (const chapter of CHAPTERS) {
      const ids = buildMemberRows(chapter, result('victory')).map((r) => r.id);
      for (let t = 0; t < ids.length; t++) {
        const v = victoryLine(chapter.scriptsRef.victoryQuips, ids, t);
        if (v) expect(measured.has(v.speakerId), `${chapter.id} ${v.speakerId}`).toBe(true);
      }
    }
  });
});

describe('wedgeFigureId', () => {
  const quip = { speakerId: 'yuna', line: 'May they rest.' };
  it('stands the speaker on a win with a line', () => {
    expect(wedgeFigureId(true, quip, 'tidus')).toBe('yuna');
  });
  it('keeps the leader on a silent win and on any loss', () => {
    expect(wedgeFigureId(true, undefined, 'tidus')).toBe('tidus');
    expect(wedgeFigureId(false, quip, 'tidus')).toBe('tidus');
    expect(wedgeFigureId(false, undefined, undefined)).toBeUndefined();
  });
  it('agrees with a real chapter build', () => {
    expect(leaderId(getChapter('yunalesca'))).toBe('tidus');
  });
});
