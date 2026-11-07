/**
 * rigs-v2 (2026-10-29; Tidus FFX only, Rikku Dark Knight FFX-2 only; the recorder's query hook is shared plumbing, both games): the lane registry's two new subjects, `tidus-v2` and `rikku-dark-knight-v2`, record the
 * NEW pilots under `?partyrigs=v2` in their own chapter, and `laneQuery` composes the page address's extra words (the environment first: the page reads the first occurrence of a word).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { laneQuery, subjectSpec, validateSubject, type SubjectSpec } from '../../../tools/rig/lane/lane-pure.mjs';
import { partyRigsModeFromSearch } from '../../../src/engine/motion/PartyRigsSwitch.ts';
import { ROOT } from './pose-gate-fixtures.ts';

type Entry = SubjectSpec & { query?: string };
const registry = JSON.parse(readFileSync(join(ROOT, 'tools/rig/lane/lane-subjects.json'), 'utf8')) as { subjects: Record<string, Entry> };

describe('the registry entries of the new pilots', () => {
  it.each([
    ['tidus-v2', 'tidus-x', 'ffx', 'seymour-flux', 'tidus'],
    ['rikku-dark-knight-v2', 'rikku-dark-knight-x', 'ffx2', 'ffx2-bahamut', 'rikku'],
  ])('%s: the first pilot\'s script and tracker, its own chapter (%s, %s), and the word', (id, first, game, chapter, actor) => {
    const v2 = registry.subjects[id]!;
    const v1 = registry.subjects[first]!;
    expect(validateSubject(id, v2)).toEqual([]);
    expect(subjectSpec(registry, id)).toBe(v2);
    expect(v2.game).toBe(game);
    expect(v2.chapter).toEqual({ id: chapter });
    expect(v2.actor).toBe(actor);
    expect(v2.query).toBe('partyrigs=v2');
    const { query: _q, ...rest } = v2 as Entry & { _note?: string };
    const { _note: _n, ...same } = rest as Entry & { _note?: string };
    expect(same).toEqual(v1);
  });

  it('the first pilots stay as they were (no word of their own: they are `?partyrigs=on`)', () => {
    expect(registry.subjects['tidus-x']!.query).toBeUndefined();
    expect(registry.subjects['rikku-dark-knight-x']!.query).toBeUndefined();
  });
});

describe('laneQuery', () => {
  it('is empty with nothing, and joins the environment\'s words and the entry\'s own, each behind one &', () => {
    expect(laneQuery(undefined, undefined)).toBe('');
    expect(laneQuery('', '')).toBe('');
    expect(laneQuery(undefined, 'partyrigs=v2')).toBe('&partyrigs=v2');
    expect(laneQuery('wait=hold', 'partyrigs=v2')).toBe('&wait=hold&partyrigs=v2');
    expect(laneQuery('?wait=hold', '&partyrigs=v2')).toBe('&wait=hold&partyrigs=v2');
  });

  it('the environment wins: the page reads the first occurrence, so partyrigs=off in the environment is the painting set of a v2 subject', () => {
    const asked = `?rig=on${laneQuery('partyrigs=off', 'partyrigs=v2')}`;
    expect(asked).toBe('?rig=on&partyrigs=off&partyrigs=v2');
    expect(partyRigsModeFromSearch(asked)).toBe('off');
    expect(partyRigsModeFromSearch(`?rig=on${laneQuery(undefined, 'partyrigs=v2')}`)).toBe('v2');
  });
});
