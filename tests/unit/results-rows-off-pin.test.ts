// @vitest-environment jsdom
/**
 * The OFF pin of the results page's member rows (step D1 of the FFX-2 Special look; game case: both games, unchanged: D1 edits no results file).
 *
 * D1 adds six part ids to `dressphereIcons.ts`'s tables and edits `PartyRows.ts`, both of which sit beside the face builders the results rows embed. Pinned in
 * `tests/fixtures/specials/off-pins/results-rows.json`: the member rows (`.rres__member`) of the real results screen after the count has settled, for an FFX chapter (Spherimorph)
 * and an FFX-2 chapter (Chapter IV). A later change that alters one byte of either with the switch off fails here.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import type { ChapterId } from '../../src/data/encounters.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { expectPinned } from './helpers/offPins.ts';

const FFX: BattleResult = {
  outcome: 'victory', turns: 9, elapsedTicks: 500, elapsedMs: 53_000, ap: 4_860, exp: 0, gil: 4_000,
  drops: [{ itemId: 'lv-2-key-sphere', count: 2 }], overkilled: ['spherimorph'],
  sphereLevelsGained: { tidus: 0, yuna: 0, lulu: 0 }, turnsTaken: { tidus: 3, yuna: 3, lulu: 3 },
};
const FFX2: BattleResult = {
  outcome: 'victory', turns: 12, elapsedTicks: 700, elapsedMs: 71_000, ap: 120, exp: 900, gil: 1_500,
  drops: [], overkilled: [],
  sphereLevelsGained: { yuna: 0, rikku: 0, paine: 0 }, turnsTaken: { yuna: 4, rikku: 4, paine: 4 },
};

beforeEach(() => {
  document.body.innerHTML = '';
});

function rows(chapterId: ChapterId, result: BattleResult): string[] {
  const save = new SaveStore(`d1-results-pin-${chapterId}`, null);
  save.recordAttempt(chapterId);
  const screen = new ResultsScreen({ chapterId, result });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  screen.update(10); // the whole roll
  return [...root.querySelectorAll<HTMLElement>('.rres__member')].map((m) => m.outerHTML);
}

describe('OFF pin 9: the member rows of the real results screen', () => {
  it('an FFX chapter and an FFX-2 chapter draw the pinned rows', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const ffx = rows('spherimorph', FFX);
    const ffx2 = rows('ffx2-bahamut', FFX2);
    expect(ffx.length).toBeGreaterThanOrEqual(3);
    expect(ffx2.length).toBeGreaterThanOrEqual(3);
    expectPinned('results-rows', { ffx, ffx2 });
  });
});
