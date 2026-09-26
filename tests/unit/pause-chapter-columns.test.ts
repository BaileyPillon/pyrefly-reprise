/**
 * `chapterColumns` (the CHAPTER tab's data), tested directly and without a
 * DOM — pure `data -> rows`.
 *
 * PR-0171 / PR-0189 (round 12/13): the pause can open over a cutscene, with
 * no live battle state and so no party; and the "Dressphere" label was cut
 * to "DRESSPHE…" in the narrow key column.
 */
import { describe, expect, it } from 'vitest';
import { chapterColumns, type ChapterContext } from '../../src/app/screens/pause/panels.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import type { AnyCombatant } from '../../src/battle/common/types.ts';

const baseCtx = (over: Partial<ChapterContext> = {}): ChapterContext => ({
  meta: getChapterMeta('seymour-flux'),
  objectives: [],
  progress: null,
  playTimeMs: 0,
  sceneKey: 'zanarkand-dome',
  state: null,
  game: 'ffx',
  ...over,
});

const ffx2Member = { id: 'yuna', dresspheres: { current: 'gunner' } } as unknown as AnyCombatant;

describe('chapterColumns', () => {
  it('PR-0171: with no live state (the pause opened over a cutscene), THE PARTY column is omitted, not printed empty', () => {
    const columns = chapterColumns(baseCtx({ state: null }));
    expect(columns.find((c) => c.id === 'gear')).toBeUndefined();
    expect(columns.map((c) => c.heading)).not.toContain('The party');
  });

  it('with a live state, THE PARTY column is present and wide (PR-0189: room for "Dressphere")', () => {
    const state = {
      activeIds: ['yuna'],
      combatants: { yuna: ffx2Member },
    } as unknown as ChapterContext['state'];
    const columns = chapterColumns(baseCtx({ state, game: 'ffx2' }));
    const gear = columns.find((c) => c.id === 'gear');
    expect(gear).toBeDefined();
    expect(gear!.heading).toBe('The party');
    expect(gear!.wide).toBe(true);
    expect(gear!.rows.some((r) => r.label === 'Dressphere' && r.value === 'gunner')).toBe(true);
  });
});
