// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { makeDresspherePanel } from '../../src/ui/ffx2/party-prep/panels.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import type { PrepPanelContext } from '../../src/app/screens/PartyPrepScreen.ts';

/**
 * The Dresspheres tab against the real chapter builds.
 *
 * The ivory sheet is a fixed band — it starts at 75.56 and the hint line is at
 * 213.33 — and Chapter 5's girls have *mastered* their dresspheres, so the
 * full learned list wrapped to five rows of chips and pushed the sheet down
 * over `▲▼ PARTY ◄► TABS ENTER BEGINS THE BATTLE ESC BACK`. The chip list is
 * capped and the tail counted; these pin that, and pin that the panel still
 * tells the truth about the total.
 */

const MAX_CHIPS = 10;

function mountFor(chapterId: string, memberId: string): HTMLElement {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const root = document.createElement('div');
  document.body.appendChild(root);
  const panel = makeDresspherePanel();
  panel.mount(root, { chapter, memberId } as PrepPanelContext);
  return root;
}

const FFX2_CHAPTERS = CHAPTERS.filter((c) => c.game === 'ffx2').map((c) => c.id);

describe('FFX-2 Dresspheres tab', () => {
  it('covers all five listed X-2 chapters (IV, V, VI, XIII since 2026-09-25 and XI since 2026-09-26)', () => {
    expect(FFX2_CHAPTERS.length).toBe(5);
  });

  for (const chapterId of FFX2_CHAPTERS) {
    for (const memberId of ['yuna', 'rikku', 'paine']) {
      it(`${chapterId} / ${memberId}: never lists more than ${MAX_CHIPS} abilities`, () => {
        const root = mountFor(chapterId, memberId);
        const chips = root.querySelectorAll('.x2prep__col .ffxprep-chip');
        const more = root.querySelectorAll('.x2prep-chip--more');
        // At most the cap, plus the "+N" chip when there is a tail.
        expect(chips.length).toBeLessThanOrEqual(MAX_CHIPS + more.length);
        expect(more.length).toBeLessThanOrEqual(1);
      });
    }
  }

  it('counts the tail rather than dropping it silently', () => {
    // Chapter 5 Yuna has mastered White Mage: 16 of 16.
    const root = mountFor('ffx2-vegnagun-shuyin', 'yuna');
    const line = root.querySelector('.x2prep-line')?.textContent ?? '';
    const total = Number(/(\d+)\s*\/\s*(\d+)/.exec(line)?.[2] ?? 0);
    const learned = Number(/(\d+)\s*\/\s*(\d+)/.exec(line)?.[1] ?? 0);
    expect(total).toBeGreaterThan(MAX_CHIPS);
    expect(learned).toBe(total);

    const named = root.querySelectorAll('.x2prep__col .ffxprep-chip:not(.x2prep-chip--more)').length;
    const more = root.querySelector('.x2prep-chip--more');
    expect(named).toBe(MAX_CHIPS);
    expect(more).not.toBeNull();
    expect(Number(more?.textContent?.replace('+', ''))).toBe(learned - MAX_CHIPS);
  });

  it('names every ability when the list is short enough', () => {
    // Chapter 4 Yuna is mid-ladder.
    const root = mountFor('ffx2-bahamut', 'yuna');
    const line = root.querySelector('.x2prep-line')?.textContent ?? '';
    const learned = Number(/(\d+)\s*\/\s*(\d+)/.exec(line)?.[1] ?? 0);
    if (learned > MAX_CHIPS) return; // covered by the cap test above
    const named = root.querySelectorAll('.x2prep__col .ffxprep-chip:not(.x2prep-chip--more)').length;
    expect(named).toBe(learned);
    expect(root.querySelector('.x2prep-chip--more')).toBeNull();
  });
});
