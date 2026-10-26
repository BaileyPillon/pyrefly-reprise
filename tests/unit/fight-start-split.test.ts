/**
 * The fight-start timeline's splitter (`tools/fight-start-split.mjs`; post-conference lane "post-fight-start", PR-0481; both games, measurement tooling only).
 * The marks are the shape of a real run of the demo's Chapter IV on the production build of release 64 (cold page, press 2 s after the board came up), trimmed to the marks the splitter reads: first as
 * the frame-polled marks of the first draft of the instrument, then as the exact marks (taken at the call) it writes now.
 */
import { describe, expect, it } from 'vitest';

import { splitTimeline, type TimelineMark } from '../../tools/fight-start-split.mjs';

const at = (t: number, k: string, v: unknown): TimelineMark => ({ t, k, v });

/** Demo Chapter IV: the press at 1000, then the fight start. */
const DEMO_CH4: TimelineMark[] = [
  at(100, 'screen', 'title'),
  at(500, 'screen', 'chapter-select'),
  at(1000, 'press', null),
  at(1173, 'screen', 'battle'),
  at(1173, 'entry', 'pf-entry pf-entry--shatter pf-entry--ffx2'),
  at(2392, 'loadcard', true),
  at(4318, 'phase', 'idle'),
  at(4318, 'menu', ''),
  at(5546, 'bosscard', 'on'),
  at(5848, 'loadcard', false),
  at(6181, 'entry', ''),
  at(7364, 'bosscard', 'leaving'),
  at(7630, 'bosscard', ''),
  at(7664, 'phase', 'moment:battle-start'),
  at(13764, 'phase', 'play:turn-start'),
  at(14772, 'phase', 'command:yuna'),
  at(14772, 'menu', 'yuna'),
  at(15050, 'phase', 'idle'),
];

describe('splitTimeline', () => {
  it('cuts the demo start into press-wait, entry-load, first-draw, card, card-to-sweep, sweep and sweep-to-menu, in order, with no hole and no overlap', () => {
    const s = splitTimeline({ marks: DEMO_CH4, gaps: [] });
    expect(s.parts.map((p) => p.name)).toEqual(['press-wait', 'entry-load', 'first-draw', 'card', 'card-to-sweep', 'sweep', 'sweep-to-menu']);
    expect(s.totalMs).toBe(13772);
    expect(s.parts[0]!.startMs).toBe(0);
    expect(s.parts.at(-1)!.endMs).toBe(s.totalMs);
    for (let i = 1; i < s.parts.length; i++) expect(s.parts[i]!.startMs).toBe(s.parts[i - 1]!.endMs);
    expect(s.parts.reduce((a, p) => a + p.ms, 0)).toBe(s.totalMs);
  });

  it('adds the waits, the load and the authored time up to the whole', () => {
    const s = splitTimeline({ marks: DEMO_CH4, gaps: [] });
    expect(s.deadMs).toBe(1173 - 1000 + (7664 - 7630)); // the press-wait and the gap between the card going and the sweep beginning
    expect(s.loadMs).toBe(5546 - 1173);
    expect(s.authoredMs).toBe(7630 - 5546 + (13764 - 7664) + (14772 - 13764));
    expect(s.deadMs + s.loadMs + s.authoredMs).toBe(s.totalMs);
  });

  it('reports the overlapping spans apart: the entry overlay, the loading card, the presenter, the boss card and the sweep', () => {
    const s = splitTimeline({ marks: DEMO_CH4, gaps: [] });
    expect(s.facts).toMatchObject({ screenBattleMs: 173, entryOnMs: 173, entryMs: 5008, loadCardOnMs: 1392, loadCardMs: 3456, presenterUpMs: 3318, cardOnMs: 4546, cardMs: 2084, sweepMs: 6100 });
  });

  it('names a scene, a prep menu and a held frame after the scene when the screens say so (the ordinary game)', () => {
    const marks: TimelineMark[] = [
      at(0, 'press', null),
      at(300, 'screen', 'party-prep'),
      at(2300, 'screen', 'cutscene'),
      at(32300, 'scene-finished', true),
      at(32310, 'screen', 'battle'),
      at(32900, 'entry', 'pf-entry pf-entry--blur'),
      at(35000, 'phase', 'idle'),
      at(36000, 'bosscard', 'on'),
      at(36700, 'bosscard', ''),
      at(36720, 'phase', 'moment:battle-start'),
      at(37000, 'phase', 'play:turn-start'),
      at(38000, 'menu', 'tidus'),
    ];
    const s = splitTimeline({ marks, gaps: [] });
    expect(s.parts.map((p) => p.name)).toEqual(['press-wait', 'party-prep', 'scene', 'after-scene', 'entry-load', 'first-draw', 'card', 'card-to-sweep', 'sweep', 'sweep-to-menu'].filter((n) => n !== 'after-prep'));
    const by = Object.fromEntries(s.parts.map((p) => [p.name, p.ms]));
    expect(by['scene']).toBe(30000);
    expect(by['after-scene']).toBe(600); // the script has ended at 32300 and the entry opens at 32900
    expect(s.deadMs).toBe(300 + 600 + 20);
  });

  it('counts the frame gaps of the run, the longest, the lost milliseconds, and those in the first 9 s', () => {
    const gaps: Array<[number, number]> = [[900, 400], [1500, 120], [3000, 40], [11000, 300], [20000, 999]];
    const s = splitTimeline({ marks: DEMO_CH4, gaps });
    expect(s.worstGapMs).toBe(300); // the 400 ms gap is before the press and the 999 ms one after the first menu: neither is in the span
    expect(s.gapsOver100).toBe(2);
    expect(s.gapsOver250).toBe(1);
    expect(s.lostMs).toBe(Math.round(120 - 16.7 + (40 - 16.7) + (300 - 16.7)));
    expect(s.lostFirst9sMs).toBe(Math.round(120 - 16.7 + (40 - 16.7))); // within 9 s of the press (t <= 10000); the 300 ms gap at 11000 is later
  });

  it('separates the steps of the demo warm done before the press from those that ended after it', () => {
    const s = splitTimeline({ marks: DEMO_CH4, gaps: [], warm: [{ ms: 800, what: 'seymour-flux: paintings' }, { ms: 6119, what: 'ffx2-bahamut: paintings' }] });
    expect(s.warm.before).toEqual(['seymour-flux: paintings']);
    expect(s.warm.after).toEqual([{ atMs: 5119, what: 'ffx2-bahamut: paintings' }]);
  });

  it('reads the exact marks (taken at the call) in place of the polled ones, and finds the frozen frame under the entry', () => {
    // Chapter I of the demo: the intro's script ends at 10200, the entry is put up at 10228 and a 1403 ms task starts there, which a frame loop would only see end at 11631
    const marks: TimelineMark[] = [
      at(0, 'press', null),
      at(30, 'push', 'cutscene'),
      at(10200, 'scene-finished', true),
      at(10228, 'entry-add', 'pf-entry pf-entry--shatter pf-entry--ffx'),
      at(10230, 'pop', 'cutscene'),
      at(10232, 'push', 'battle'),
      at(11636, 'screen', 'battle'), // the frame loop's late reading
      at(11722, 'loadcard-add', null),
      at(12564, 'phase', 'idle'),
      at(13881, 'bosscard-add', null),
      at(14195, 'loadcard-remove', null),
      at(14746, 'entry-remove', 'pf-entry'),
      at(15995, 'bosscard-remove', null),
      at(15995, 'phase', 'moment:battle-start'),
      at(22700, 'phase', 'idle'),
      at(22760, 'menu', 'tidus'),
    ];
    const s = splitTimeline({ marks, gaps: [], long: [[200, 300], [10228, 1403], [12050, 514], [14328, 151]] });
    expect(s.parts.map((p) => p.name)).toEqual(['press-wait', 'scene', 'after-scene', 'entry-load', 'first-draw', 'card', 'card-to-sweep'.replace('card-to-sweep', 'sweep'), 'sweep-to-menu'].filter((n) => n !== 'card-to-sweep'));
    const by = Object.fromEntries(s.parts.map((p) => [p.name, p.ms]));
    expect(by['scene']).toBe(10200 - 30);
    expect(by['after-scene']).toBe(28); // the script has ended and the entry is not up yet
    expect(s.facts['entryOnMs']).toBe(10228);
    expect(s.facts['loadCardUpAtCardMs']).toBe(13881 - 11722); // the card over the entry had been up this long when the battle's own card went on
    expect(s.facts['frozenMs']).toBe(1403); // the longest task that starts under the entry, before the boss card
  });

  it('answers an empty split for a run with no press or no menu', () => {
    expect(splitTimeline({ marks: [at(5, 'screen', 'title')], gaps: [] }).totalMs).toBe(0);
    expect(splitTimeline({ marks: [at(5, 'press', null)], gaps: [] }).parts).toEqual([]);
  });
});
