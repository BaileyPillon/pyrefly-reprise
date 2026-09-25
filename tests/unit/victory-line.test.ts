// Victory lines on the shared results screen (PR-0021, PR-0187; Bailey's pick A,
// docs/plans/decisions-2026-09-25.md item 7). Both games: the rotation is shared
// plumbing; the lines are each chapter's first lines, exactly as the sheet quotes.
import { describe, expect, it } from 'vitest';
import { victoryLine, victoryTurn } from '../../src/ui/common/victoryLine.ts';
import { buildMemberRows, isSilentResultsChapter } from '../../src/ui/common/resultsMath.ts';
import { CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { UNLISTED_CHAPTERS } from '../../src/data/chapters-unlisted.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';

/** A plain win: everyone on the panel's list, as `ResultsScreen` builds it. */
function win(): BattleResult {
  return {
    outcome: 'victory',
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

/** Every line the rotation can serve for a chapter, speaker by speaker. */
function served(chapterId: string): Map<string, string> {
  const chapter = getChapter(chapterId);
  const rows = buildMemberRows(chapter, win());
  const ids = rows.map((r) => r.id);
  const out = new Map<string, string>();
  if (isSilentResultsChapter(chapterId)) return out;
  for (let turn = 0; turn < 12; turn++) {
    const v = victoryLine(chapter?.scriptsRef.victoryQuips, ids, turn);
    if (v) out.set(v.speakerId, v.line);
  }
  return out;
}

/** The first lines the sheet quotes (writing-bible §5.4 for I and II). */
const SHEET: Record<string, Record<string, string>> = {
  'seymour-flux': {
    tidus: '...Okay. Next one.',
    yuna: 'May they rest.',
    auron: "It isn't over.",
    wakka: '...Ya. Okay. Ya.',
    lulu: "Don't celebrate yet.",
    kimahri: 'Kimahri remembers.',
    rikku: '...Can we not do that again?',
  },
  'ffx2-vegnagun-shuyin': { yuna: "...Let's go home.", rikku: "That one wasn't fun.", paine: '...Yeah.' },
  'ffx2-leblanc': { yuna: 'We got it back.', rikku: 'Gullwings one, Syndicate nothing!', paine: 'Predictable.' },
  'evrae-airship': {
    tidus: 'Okay. Next one.',
    wakka: 'Ya! That is how you do it!',
    lulu: 'Stone Ward. Now that it is over.',
    rikku: 'Ha! Bad dog!',
    auron: 'A guard. Nothing more.',
    kimahri: 'It fell. Good.',
  },
};
SHEET.yunalesca = { ...SHEET['seymour-flux'] };

describe('victoryLine: the speaker rotates, the line is the first of the bank', () => {
  const banks = { tidus: ['a1', 'a2'], yuna: ['b1', 'b2', 'b3'], auron: ['c1'] };

  it('walks the party in the panel order and wraps', () => {
    const ids = ['tidus', 'yuna', 'auron'];
    expect([0, 1, 2, 3].map((t) => victoryLine(banks, ids, t))).toEqual([
      { speakerId: 'tidus', line: 'a1' },
      { speakerId: 'yuna', line: 'b1' },
      { speakerId: 'auron', line: 'c1' },
      { speakerId: 'tidus', line: 'a1' },
    ]);
  });

  it('never serves a later pooled line', () => {
    for (let t = 0; t < 30; t++) expect(['a1', 'b1', 'c1']).toContain(victoryLine(banks, ['tidus', 'yuna', 'auron'], t)?.line);
  });

  it('skips a member with no bank (or an empty one) instead of going quiet', () => {
    const ids = ['kimahri', 'tidus', 'rikku', 'yuna'];
    const withEmpty = { ...banks, rikku: [] as string[] };
    expect(victoryLine(withEmpty, ids, 0)?.speakerId).toBe('tidus');
    expect(victoryLine(withEmpty, ids, 1)?.speakerId).toBe('yuna');
    expect(victoryLine(withEmpty, ids, 2)?.speakerId).toBe('tidus');
  });

  it('says nothing for an empty bank, no party, or no chapter', () => {
    expect(victoryLine({}, ['tidus'], 0)).toBeUndefined();
    expect(victoryLine(banks, [], 0)).toBeUndefined();
    expect(victoryLine(undefined, ['tidus'], 0)).toBeUndefined();
  });

  it('survives a negative, fractional or non-finite turn', () => {
    expect(victoryLine(banks, ['tidus', 'yuna'], -1)?.speakerId).toBe('yuna');
    expect(victoryLine(banks, ['tidus', 'yuna'], 1.7)?.speakerId).toBe('yuna');
    expect(victoryLine(banks, ['tidus', 'yuna'], Number.NaN)?.speakerId).toBe('tidus');
  });
});

describe('victoryTurn: every recorded attempt moves the speaker on', () => {
  it('opens a fresh save on the first member', () => {
    expect(victoryTurn({})).toBe(0);
    expect(victoryTurn({ 'seymour-flux': { attempts: 1 } })).toBe(0);
  });

  it('counts attempts across chapters, so the next chapter and a retry both rotate', () => {
    expect(victoryTurn({ 'seymour-flux': { attempts: 1 }, yunalesca: { attempts: 1 } })).toBe(1);
    expect(victoryTurn({ 'seymour-flux': { attempts: 3 }, yunalesca: { attempts: 2 } })).toBe(4);
  });

  it('ignores a missing or corrupt count', () => {
    expect(victoryTurn({ a: {}, b: { attempts: Number.NaN }, c: { attempts: -4 }, d: { attempts: 2 } })).toBe(1);
  });
});

describe('the lines each chapter serves are exactly the ones the sheet quotes (both games)', () => {
  for (const [chapterId, expected] of Object.entries(SHEET)) {
    it(`${chapterId}: every speaker on the panel says their sheet line`, () => {
      const lines = served(chapterId);
      expect(lines.size).toBeGreaterThan(1);
      for (const [who, line] of lines) expect(line, who).toBe(expected[who]);
    });
  }

  it('Chapter VII (coming) serves only first lines of its bank', () => {
    const chapter = getChapter('seymour-anima-macalania');
    const banks = chapter?.scriptsRef.victoryQuips ?? {};
    for (const [who, line] of served('seymour-anima-macalania')) expect(line, who).toBe(banks[who]?.[0]);
  });

  it('no longer ends Chapters I and II on the same speaker for a fresh save', () => {
    // Fresh save: Chapter I is attempt 1 (turn 0), Chapter II attempt 2 (turn 1).
    const one = getChapter('seymour-flux');
    const two = getChapter('yunalesca');
    const a = victoryLine(one?.scriptsRef.victoryQuips, buildMemberRows(one, win()).map((r) => r.id), 0);
    const b = victoryLine(two?.scriptsRef.victoryQuips, buildMemberRows(two, win()).map((r) => r.id), 1);
    expect(a?.speakerId).not.toBe(b?.speakerId);
  });

  it('keeps Chapters III (PR-0187), IV, IX and XIII silent', () => {
    for (const id of ['braskas-final-aeon', 'ffx2-bahamut', 'yojimbo-cavern', 'ffx2-trema']) {
      expect(served(id).size, id).toBe(0);
    }
  });

  it('serves no line outside the chapter banks in any registered chapter', () => {
    for (const chapter of [...CHAPTERS, ...UNLISTED_CHAPTERS]) {
      for (const [who, line] of served(chapter.id)) {
        expect(chapter.scriptsRef.victoryQuips[who]?.[0], `${chapter.id} ${who}`).toBe(line);
      }
    }
  });
});
