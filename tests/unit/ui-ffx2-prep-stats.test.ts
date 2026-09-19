// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { makeStatsPanel } from '../../src/ui/ffx2/party-prep/StatsPanel.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { dressphereStats } from '../../src/battle/ffx2/dressphere-stats.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';
import type { PrepPanelContext } from '../../src/app/screens/PartyPrepScreen.ts';

/**
 * The FFX-2 Stats tab, against the real chapter builds.
 *
 * It exists to close the parity half of critic round 02's ranked issue 40 —
 * and, more than that, to make [ffx2-combat-core §5.1] visible: **stats are a
 * function of (dressphere x level) only**, so the same sphere at the same level
 * is the same block for all three girls. A player arriving from FFX will assume
 * the opposite.
 */

const FFX2_CHAPTERS = CHAPTERS.filter((c) => c.game === 'ffx2');

function mountFor(chapterId: string, memberId: string): HTMLElement {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const root = document.createElement('div');
  document.body.appendChild(root);
  makeStatsPanel().mount(root, { chapter, memberId } as PrepPanelContext);
  return root;
}

describe('FFX-2 Stats tab', () => {
  it('is registered for X-2 only, after Dresspheres and before Accessories', () => {
    const panel = makeStatsPanel();
    expect(panel.game).toBe('ffx2');
    expect(panel.id).toBe('stats');
    expect(panel.order).toBe(10);
  });

  for (const chapter of FFX2_CHAPTERS) {
    for (const memberId of ['yuna', 'rikku', 'paine']) {
      it(`${chapter.id} / ${memberId}: prints the worn block from the engine's own table`, () => {
        const build = chapter.buildRef as FFX2PartyBuild;
        const member = build.members.find((m) => m.id === memberId)!;
        const want = dressphereStats(member.currentDressphere, member.level);
        const root = mountFor(chapter.id, memberId);

        const values = [...root.querySelectorAll('.x2prep-stat')].map((row) => [
          row.querySelector('.x2prep-stat__k')?.textContent,
          row.querySelector('.x2prep-stat__v')?.textContent,
        ]);
        expect(values.length).toBe(10);
        // Not recomputed in the UI: every figure is the engine's.
        expect(Object.fromEntries(values)).toMatchObject({
          HP: String(want.maxHp),
          MP: String(want.maxMp),
          STR: String(want.str),
          MAG: String(want.mag),
          AGI: String(want.agi),
        });
        // Named, never an id.
        const head = root.querySelector('.x2prep-line')?.textContent ?? '';
        expect(head).toContain(member.name);
        expect(head).not.toMatch(/[a-z]+-[a-z]+/);
      });

      it(`${chapter.id} / ${memberId}: compares every other dressphere she owns`, () => {
        const build = chapter.buildRef as FFX2PartyBuild;
        const member = build.members.find((m) => m.id === memberId)!;
        const others = member.owned.filter((id) => id !== member.currentDressphere);
        const root = mountFor(chapter.id, memberId);
        const rows = [...root.querySelectorAll('.x2prep-cmp__row:not(.x2prep-cmp__row--head)')];
        expect(rows.length).toBe(others.length);
        for (const row of rows) {
          // Ten deltas, one per stat row, each an arrow-and-number or a dash.
          expect(row.querySelectorAll('.x2prep-cmp__cell').length).toBe(10);
          expect(row.querySelector('.x2prep-cmp__name')?.textContent).not.toMatch(/[a-z]+-[a-z]+/);
        }
      });
    }
  }

  it('says the rule out loud, because nothing else in the game does', () => {
    const root = mountFor(FFX2_CHAPTERS[0]!.id, 'yuna');
    expect(root.querySelector('.x2prep-foot')?.textContent).toMatch(/dressphere and the level/i);
  });

  it('draws the same block for all three girls in the same sphere at the same level', () => {
    // The mechanic itself, asserted rather than described: this is why the tab
    // compares spheres and not characters.
    const a = dressphereStats('gunner', 24);
    const b = dressphereStats('gunner', 24);
    expect(a).toEqual(b);
    expect(dressphereStats('warrior', 24)).not.toEqual(a);
  });
});
