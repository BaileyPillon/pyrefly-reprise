/**
 * PR-0225 (critic round 15): the capture harness's decisions, held as pure functions.
 * Round 15's real-key runs of Chapters III and XII lost because `confirmTarget` could not
 * steer to a lettered enemy ("Slow -> Yu Pagoda A" landed on yu-pagoda-right, 43 times),
 * and its dialogue recorder merged repeats. `critic/runner/lib/route-pure.mjs` holds the
 * rules; these are their cases. Game case: shared critic tooling (both); the letter rule
 * is FFX only, from `src/battle/ffx/letterTags.ts`, which the first case runs alongside.
 */
import { describe, expect, it } from 'vitest';

import { letterTagsOf } from '../../src/battle/ffx/letterTags.ts';
import type { BattleState } from '../../src/battle/common/types.ts';
import { dboxStep, isAllDisabledOverlay, letterTagMap, resolveTargetId, slugOf, type DboxMem, type DboxSample } from '../../critic/runner/lib/route-pure.mjs';

const stateOf = (defs: [string, string][]): BattleState =>
  ({ enemyIds: defs.map(([id]) => id), combatants: Object.fromEntries(defs.map(([id, name]) => [id, { id, name }])) }) as unknown as BattleState;

const BFA: [string, string][] = [['yu-pagoda-left', 'Yu Pagoda'], ['yu-pagoda-right', 'Yu Pagoda'], ['yu-yevon', 'Yu Yevon']];
const OMNIS: [string, string][] = [['seymour-omnis', 'Seymour Omnis'], ['mortiphasm-1', 'Mortiphasm'], ['mortiphasm-2', 'Mortiphasm'], ['mortiphasm-3', 'Mortiphasm'], ['mortiphasm-4', 'Mortiphasm']];
const rosterOf = (defs: [string, string][]) => ({ enemyIds: defs.map(([id]) => id), names: Object.fromEntries(defs) });

describe('the letter rule the harness copies', () => {
  it.each([['Braska final aeon', BFA], ['Seymour Omnis', OMNIS]] as const)('gives exactly the tags letterTagsOf gives (%s)', (_label, defs) => {
    const real = letterTagsOf(stateOf(defs));
    const copy = letterTagMap(defs.map(([id]) => id), (id) => defs.find(([d]) => d === id)?.[1]);
    expect([...copy.entries()]).toEqual([...real.entries()]);
  });
});

describe('a lettered target name is mapped to its data-target-id (issue 3)', () => {
  it('Yu Pagoda A is the left pagoda and B the right, never the highlighted default', () => {
    const dom = ['yu-pagoda-left', 'yu-pagoda-right', 'yu-yevon'];
    expect(resolveTargetId('Yu Pagoda A', rosterOf(BFA), dom)).toBe('yu-pagoda-left');
    expect(resolveTargetId('Yu Pagoda B', rosterOf(BFA), dom)).toBe('yu-pagoda-right');
    // what the old slug match did: no data-target-id starts with "yu-pagoda-a"
    expect(dom.some((id) => id.startsWith(slugOf('Yu Pagoda A')))).toBe(false);
  });

  it('Mortiphasm A..D map to mortiphasm-1..4 and an unlettered unique name resolves by name', () => {
    const dom = OMNIS.map(([id]) => id);
    expect(['A', 'B', 'C', 'D'].map((l) => resolveTargetId(`Mortiphasm ${l}`, rosterOf(OMNIS), dom))).toEqual(['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4']);
    expect(resolveTargetId('Seymour Omnis', rosterOf(OMNIS), dom)).toBe('seymour-omnis');
    expect(resolveTargetId('Yu Yevon', rosterOf(BFA), ['yu-yevon'])).toBe('yu-yevon');
  });

  it('a lettered enemy that is not on screen resolves to null instead of a neighbour', () => {
    expect(resolveTargetId('Mortiphasm B', rosterOf(OMNIS), ['mortiphasm-1', 'mortiphasm-3'])).toBeNull();
  });

  it('keeps the old id-slug match for names the roster cannot settle (FFX-2 rows, party members)', () => {
    expect(resolveTargetId('Yuna', { enemyIds: [], names: {} }, ['yuna', 'rikku', 'paine'])).toBe('yuna');
    expect(resolveTargetId('', rosterOf(BFA), ['yu-yevon'])).toBeNull();
  });
});

describe('a menu with nothing to choose (issue 2)', () => {
  it('is an overlay whose every row is disabled', () => {
    expect(isAllDisabledOverlay([{ disabled: true }, { disabled: true }])).toBe(true);
    expect(isAllDisabledOverlay([{ disabled: true }, { disabled: false }])).toBe(false);
    expect(isAllDisabledOverlay([])).toBe(false);
  });
});

describe('the dialogue recorder makes one entry per show (issue 4)', () => {
  const box = (speaker: string, text: string): DboxSample => ({ speaker, role: '', text, portrait: null, narrate: false });
  const run = (steps: (DboxSample | null)[]): DboxMem => {
    const mem: DboxMem = { lines: [], seen: null };
    steps.forEach((cur, i) => dboxStep(mem, cur, i * 100, 'cutscene'));
    return mem;
  };

  it('a typewriter growing is one entry that keeps its final text', () => {
    const mem = run([box('Yuna', 'I'), box('Yuna', 'I will'), box('Yuna', 'I will go.')]);
    expect(mem.lines.map((l) => l.text)).toEqual(['I will go.']);
    expect(mem.lines[0]?.lastMs).toBe(200);
  });

  it('the same line shown twice in a row is two entries (a repeat is measurable)', () => {
    const mem = run([box('Auron', 'Spread out.'), box('Auron', 'S'), box('Auron', 'Spread out.')]);
    expect(mem.lines.map((l) => l.text)).toEqual(['Spread out.', 'Spread out.']);
  });

  it('two lines by one speaker that share a 24-character opening are two entries', () => {
    const opening = 'She was never meant to l';
    const mem = run([box('Rikku', `${opening}eave.`), box('Rikku', ''), box('Rikku', `${opening}ive here.`)]);
    expect(mem.lines).toHaveLength(2);
  });

  it('a box that went away between two shows separates them, and the end is recorded', () => {
    const mem = run([box('Tidus', 'Hey.'), null, box('Tidus', 'Hey.')]);
    expect(mem.lines).toHaveLength(2);
    expect(mem.lines[0]?.endMs).toBe(100);
  });

  it('a hidden box records nothing', () => {
    expect(run([null, null]).lines).toEqual([]);
  });
});
