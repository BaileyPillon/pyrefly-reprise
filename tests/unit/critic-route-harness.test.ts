/**
 * PR-0225 (critic round 15): the capture harness's decisions, held as pure functions.
 * Round 15's real-key runs of Chapters III and XII lost because `confirmTarget` could not
 * steer to a lettered enemy ("Slow -> Yu Pagoda A" landed on yu-pagoda-right, 43 times),
 * and its dialogue recorder merged repeats. `critic/runner/lib/route-pure.mjs` holds the
 * rules; these are their cases. Game case: shared critic tooling (both); the letter rule
 * is FFX only, from `src/battle/ffx/letterTags.ts`, which the first case runs alongside.
 */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

import { letterTagsOf } from '../../src/battle/ffx/letterTags.ts';
import type { BattleState } from '../../src/battle/common/types.ts';
import { BUSHIDO_KEYS, dboxStep, deriveOutcome, isAllDisabledOverlay, keysForChips, letterTagMap, minigameKindOf, resolveTargetId, slugOf, swordplayPressNow, type DboxMem, type DboxSample } from '../../critic/runner/lib/route-pure.mjs';

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

// ---------------------------------------------------------------------------
// PR-0261 (round 19, widened): the route types the Overdrive overlay it is shown and reads the end of a route from
// the screen and the engine result, never from link 1's victory event. Game case: the overlays are FFX only
// (Bushido is Auron's, Swordplay Tidus's); the outcome reader is shared by both games.
// ---------------------------------------------------------------------------

describe('which overlay is up (PR-0261)', () => {
  it('names Bushido and Swordplay from the subtitle and leaves every other overlay to the old handling', () => {
    expect(minigameKindOf('BUSHIDO · ENTER THE SEQUENCE')).toBe('bushido');
    expect(minigameKindOf('SWORDPLAY · CONFIRM IN THE GOLD ZONE')).toBe('swordplay');
    for (const other of ['BLITZ · STOP THE REELS', 'GRAND SUMMON', '', null, undefined]) expect(minigameKindOf(other as string)).toBeNull();
  });
});

describe('Bushido: the chips shown are typed in order (PR-0261)', () => {
  it('maps the nine glyphs the overlay draws to keys, and the circle is X, never Escape (Escape opens the pause)', () => {
    const shown = ['↑', '↓', '←', '→', '✕', '○', '△'];
    const { keys, unknown } = keysForChips(shown);
    expect(keys).toEqual(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'x', 'q']);
    expect(unknown).toEqual([]);
    expect(Object.values(BUSHIDO_KEYS)).not.toContain('Escape');
    expect(keysForChips(['L1', 'R1']).keys).toEqual(['f', 'r']);
    expect(keysForChips(['□']).keys).toEqual(['k']); // Shooting Star's square (r38, PR-0308)
  });

  it('reports a glyph it has no key for instead of guessing one', () => {
    expect(keysForChips(['↑', '?'])).toEqual({ keys: ['ArrowUp'], unknown: ['?'] });
  });

  it('every glyph of the overlay\'s own GLYPH table is in the key table (the two cannot drift apart)', () => {
    const src = fs.readFileSync('src/ui/ffx/minigames/AuronSequence.ts', 'utf8');
    const glyphs = [...src.slice(src.indexOf('const GLYPH'), src.indexOf('};', src.indexOf('const GLYPH'))).matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]!);
    expect(glyphs.length).toBeGreaterThanOrEqual(9);
    for (const g of glyphs) expect(BUSHIDO_KEYS[g], g).toBeTruthy();
  });
});

describe('Swordplay: press when the marker, carried by the key\'s travel time, is in the zone (PR-0261)', () => {
  // The overlay's default bar: zone 12.2 % wide, centred (start 43.9 %), marker 340 px/s on a 360 px bar = 0.0944 %/ms.
  const zone = [43.89, 12.22] as const;
  it('presses with the marker inside the middle of the zone, not at its edge or outside it', () => {
    expect(swordplayPressNow(50, 49, 10, zone[0], zone[1], 30)).toBe(true);
    expect(swordplayPressNow(20, 19, 10, zone[0], zone[1], 30)).toBe(false);
    expect(swordplayPressNow(44.3, 43.3, 10, zone[0], zone[1], 0)).toBe(false); // inside the zone but on its rim (outside the inner 70 %)
  });

  it('leads the marker: still short of the zone but arriving within the lead presses; past the zone and still going away does not', () => {
    expect(swordplayPressNow(47.2, 46.2, 10, zone[0], zone[1], 30)).toBe(true); // carried 3 % forward to 50.2
    expect(swordplayPressNow(60, 59, 10, zone[0], zone[1], 30)).toBe(false); // past the zone, heading out
  });

  it('never presses on a missing reading', () => {
    expect(swordplayPressNow(NaN, 1, 10, zone[0], zone[1], 30)).toBe(false);
    expect(swordplayPressNow(50, 49, 0, zone[0], zone[1], 30)).toBe(false);
    expect(swordplayPressNow(50, 49, 10, NaN, zone[1], 30)).toBe(false);
  });
});

describe('the end of a route is read from what the game shows (PR-0261)', () => {
  const link1Won = [{ type: 'victory' }];
  it('a chain stalled in link 2 is "stalled at link 2, moment:battle-start", not link 1\'s victory', () => {
    const r = deriveOutcome({ screenAtEnd: 'battle', log: link1Won, seen: { links: 2, chainLength: 3, phase: 'moment:battle-start' } });
    expect(r.outcome).toBe('stalled');
    expect(r.detail).toBe('stalled at link 2, moment:battle-start');
    expect(r.stalledAt).toEqual({ link: 2, phase: 'moment:battle-start' });
  });

  it('the results screen\'s own words win over any event', () => {
    expect(deriveOutcome({ screenAtEnd: 'results', resultsText: 'CHAPTER III · CLEARED', log: [], seen: {} }).outcome).toBe('victory');
    expect(deriveOutcome({ screenAtEnd: 'results', resultsText: 'Defeat · RETRY', log: link1Won, seen: { links: 1, chainLength: 3 } }).outcome).toBe('defeat');
  });

  it('a victory event counts only on the last link, and only once the battle screen was left', () => {
    expect(deriveOutcome({ screenAtEnd: 'cutscene', log: link1Won, seen: { links: 3, chainLength: 3 } }).outcome).toBe('victory');
    const early = deriveOutcome({ screenAtEnd: 'cutscene', log: link1Won, seen: { links: 1, chainLength: 3 } });
    expect(early.outcome).toBe('undecided');
    expect(deriveOutcome({ screenAtEnd: 'cutscene', log: link1Won, seen: { links: 1, chainLength: 3 }, final: true }).outcome).toBe('stalled');
  });

  it('a defeat event with the battle left is a defeat; one with the battle still up is a stall', () => {
    expect(deriveOutcome({ screenAtEnd: 'results', log: [{ type: 'defeat' }], seen: { links: 2, chainLength: 3 } }).outcome).toBe('defeat');
    expect(deriveOutcome({ screenAtEnd: 'battle', log: [{ type: 'defeat' }], seen: { links: 2, chainLength: 3, phase: 'hud:menu' } }).outcome).toBe('stalled');
  });

  it('a single-link chapter (no chain length) is its own last link', () => {
    expect(deriveOutcome({ screenAtEnd: 'cutscene', log: link1Won, seen: { links: 1 } }).outcome).toBe('victory');
  });
});
