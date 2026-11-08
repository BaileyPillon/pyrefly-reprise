/**
 * **Release 78, R77-4 (FFX only; the Sphere Grid is FFX's): the results row's Sphere Level bar is never past its cap.** The focused review of release 77 read the Omega Ruins' results as "S.LV 186 · 33,000/22,000 AP" (Tidus),
 * "S.LV 179 · 77,000/22,000" (Yuna) and "S.LV 174 · 77,000/22,000" (Lulu).
 *
 * Cause (traced on the data): the Omega Ruins' three links are one results screen (`poolsChainSpoils`: AP 50,000 + 60,000 + 55,000 = 165,000 and gil 50,000), and `chainSpoils` adds the AP and the Sphere Levels each link
 * reported. Each link counted its own levels from its own AP and dropped the remainder (two levels each, 6,000, 16,000 and 11,000 over), so Tidus's six levels leave 33,000 of the printed 165,000 unspent: a bar of
 * 1.5 levels. The fix is in `sphereGridBar.ts` (the levels the printed AP still pays for are counted), with a last guard that holds the bar at its cap. FFX only; FFX-2's dressphere bar is untouched.
 *
 * Inert elsewhere, proven: for every FFX chapter and a sweep of AP, a row whose bar is within its cap prints exactly what the old arithmetic printed (the same levels, the same rest, the same cap).
 */
import { describe, expect, it } from 'vitest';
import { chainSpoils } from '../../src/app/screens/BattleChainSpoils.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { apForLevel } from '../../src/battle/ffx/results.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { buildMemberRows, formatNumber } from '../../src/ui/common/resultsMath.ts';
import { sphereGridBar } from '../../src/ui/common/sphereGridBar.ts';

/** What the page printed before release 78 (the old `sphereGridDetail`, verbatim arithmetic). */
function oldDetail(sLv: number, bankedAp: number, levelsGained: number): string {
  let rest = bankedAp;
  for (let i = 0; i < levelsGained; i++) rest -= apForLevel(sLv + i);
  const now = sLv + levelsGained;
  return `S.LV ${now} · ${formatNumber(Math.max(0, rest))}/${formatNumber(apForLevel(now))} AP`;
}

/** What the engine reports for one link: the levels `results.ts#sphereLevels` buys from this link's own AP. */
function levelsOf(sLv: number, gridAp: number, linkAp: number): number {
  let banked = gridAp + linkAp;
  let levels = 0;
  while (banked >= apForLevel(sLv + levels) && levels < 255) {
    banked -= apForLevel(sLv + levels);
    levels += 1;
  }
  return levels;
}

const link = (ap: number, gil: number, levels: Record<string, number>, over: Partial<BattleResult> = {}): BattleResult => ({
  outcome: 'victory', turns: 5, elapsedTicks: 100, elapsedMs: 60_000, ap, exp: 0, gil, drops: [], overkilled: [], sphereLevelsGained: levels,
  turnsTaken: { tidus: 2, yuna: 2, lulu: 2 }, ...over,
});

const barOf = (detail: string): { rest: number; cap: number } => {
  const m = /· ([\d,]+)\/([\d,]+) AP$/.exec(detail)!;
  return { rest: Number(m[1]!.replace(/,/g, '')), cap: Number(m[2]!.replace(/,/g, '')) };
};

describe('the Omega Ruins as the review saw them (FFX only)', () => {
  // The three links' own results as the engine reports them (Ultima Weapon 50,000 AP with overkill, Omega Weapon 60,000 with overkill, Nemesis 55,000; the party starts at S.LV 180, 175 and 170 with no banked AP).
  const won = [link(50_000, 20_000, { tidus: 2, yuna: 2, lulu: 2 }), link(60_000, 30_000, { tidus: 2, yuna: 2, lulu: 2 })];
  const last = link(55_000, 0, { tidus: 2, yuna: 2, lulu: 2 });
  const pooled = chainSpoils('ffx', won, last, true);
  const rows = buildMemberRows(getChapter('omega-ruins'), pooled);

  it('the pooled result is 165,000 AP and 50,000 gil with six levels per member (the sum of three floors)', () => {
    expect([pooled.ap, pooled.gil, pooled.sphereLevelsGained]).toEqual([165_000, 50_000, { tidus: 6, yuna: 6, lulu: 6 }]);
  });

  it('the old arithmetic printed the over-cap bar: 33,000 against 22,000 (the control: this is the defect)', () => {
    expect(oldDetail(180, 165_000, 6)).toBe('S.LV 186 · 33,000/22,000 AP');
  });

  it('no row prints a bar past its cap, and each row is the levels the printed 165,000 AP buys: seven for Tidus (S.LV 187, 11,000 over), for Yuna (S.LV 182) and for Lulu (S.LV 177)', () => {
    expect(rows.map((r) => r.detail)).toEqual(['S.LV 187 · 11,000/22,000 AP', 'S.LV 182 · 11,000/22,000 AP', 'S.LV 177 · 11,000/22,000 AP']);
    for (const r of rows) {
      const { rest, cap } = barOf(r.detail);
      expect(rest, r.id).toBeLessThan(cap);
    }
    expect(rows.map((r) => r.levelDelta)).toEqual([7, 7, 7]);
    expect(rows.map((r) => r.standing)).toEqual(['S.LV 187', 'S.LV 182', 'S.LV 177']);
  });

  it('the review\'s own rows (levels 6, 4 and 4: Yuna and Lulu sat out a link) print 77,000 over 22,000 under the old arithmetic and a bar inside its cap now', () => {
    expect([oldDetail(180, 165_000, 6), oldDetail(175, 165_000, 4), oldDetail(170, 165_000, 4)]).toEqual(['S.LV 186 · 33,000/22,000 AP', 'S.LV 179 · 77,000/22,000 AP', 'S.LV 174 · 77,000/22,000 AP']);
    const reviewed = buildMemberRows(getChapter('omega-ruins'), { ...pooled, sphereLevelsGained: { tidus: 6, yuna: 4, lulu: 4 } });
    for (const r of reviewed) {
      const { rest, cap } = barOf(r.detail);
      expect(rest, r.id).toBeLessThan(cap);
    }
    expect(reviewed.map((r) => r.detail)).toEqual(['S.LV 187 · 11,000/22,000 AP', 'S.LV 182 · 11,000/22,000 AP', 'S.LV 177 · 11,000/22,000 AP']);
  });
});

describe('sphereGridBar', () => {
  it('counts the whole levels the banked AP still buys beyond the engine\'s count, and says how many it added', () => {
    expect(sphereGridBar(180, 165_000, 6)).toEqual({ now: 187, levels: 7, carried: 1, rest: 11_000, cap: 22_000 });
    expect(sphereGridBar(30, 79, 0)).toMatchObject({ now: 30, levels: 0, carried: 0, rest: 79 });
  });

  it('with `carry` false it is the engine\'s count as it was and holds the bar at its cap (the revert switch)', () => {
    expect(sphereGridBar(180, 165_000, 6, false)).toEqual({ now: 186, levels: 6, carried: 0, rest: 22_000, cap: 22_000 });
  });

  it('a rest that is negative (a member with Double AP reported more levels than the printed AP buys) is 0, as before', () => {
    expect(sphereGridBar(30, 100, 2)).toMatchObject({ levels: 2, carried: 0, rest: 0 });
  });

  it('inert: wherever the old bar was within its cap (0 up to just under a level), the new one prints the same, over a sweep of levels, banked AP and levels gained', () => {
    let checked = 0;
    for (const sLv of [1, 18, 30, 60, 99, 103, 104, 150, 180, 254]) {
      for (let banked = 0; banked <= 400_000; banked += 977) {
        for (const gained of [0, 1, 2, 5, 9]) {
          let rest = banked;
          for (let i = 0; i < gained; i++) rest -= apForLevel(sLv + i);
          if (rest >= apForLevel(sLv + gained)) continue; // the old bar was past its cap: the case this release fixes
          const bar = sphereGridBar(sLv, banked, gained);
          expect(`S.LV ${bar.now} · ${formatNumber(bar.rest)}/${formatNumber(bar.cap)} AP`, `${sLv}/${banked}/${gained}`).toBe(oldDetail(sLv, banked, gained));
          expect(bar.carried).toBe(0);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(3_000);
  });

  it('never past its cap, for any input at all, with or without carry', () => {
    for (const sLv of [0, 1, 30, 103, 180, 255]) {
      for (const banked of [0, 5, 22_000, 22_001, 165_000, 9_999_999]) {
        for (const gained of [0, 3, 8, 40]) {
          for (const carry of [true, false]) {
            const bar = sphereGridBar(sLv, banked, gained, carry);
            expect(bar.rest, `${sLv}/${banked}/${gained}/${carry}`).toBeLessThanOrEqual(bar.cap);
            expect(bar.rest).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});

describe('inert on every shipped FFX chapter: the rows of a result whose levels are the engine\'s are the old rows', () => {
  const ffx = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx');

  it('each FFX chapter, a sweep of single-link AP: the row text and the chip are what the old arithmetic printed', () => {
    expect(ffx.length).toBeGreaterThan(20);
    let rows = 0;
    for (const chapter of ffx) {
      const build = chapter.buildRef;
      if (build.game !== 'ffx') continue;
      for (const ap of [0, 40, 1_200, 6_000, 40_000, 71_739, 165_000]) {
        const levels = Object.fromEntries(build.members.map((m) => [m.id, levelsOf(m.sphereGrid.sLv, m.sphereGrid.ap, ap)]));
        const result = link(ap, 100, levels, { turnsTaken: Object.fromEntries(build.members.map((m) => [m.id, 1])) });
        for (const row of buildMemberRows(chapter, result)) {
          const m = build.members.find((x) => x.id === row.id);
          if (!m) continue;
          expect(row.detail, `${chapter.id}/${row.id}/${ap}`).toBe(oldDetail(m.sphereGrid.sLv, m.sphereGrid.ap + ap, levels[row.id] ?? 0));
          expect(row.levelDelta, `${chapter.id}/${row.id}/${ap}`).toBe(levels[row.id] ?? 0);
          rows++;
        }
      }
    }
    expect(rows).toBeGreaterThan(300);
  });
});
