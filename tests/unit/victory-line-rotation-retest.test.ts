/**
 * PR-0021 re-test (D-204, Bailey 2026-09-26: D-173's rotating speaker is the
 * finished form): on one profile, attempts 0, 1 and 2 of Chapter I each show a
 * different speaker's first-bank line, and five wins show at least three
 * distinct lines, none outside the chapter's bank.
 *
 * Both games (the results screen is shared plumbing); Chapter I is the
 * acceptance chapter. This is the seam-level half: `GameFlow` records the
 * attempt before the battle and `ResultsScreen` reads `victoryTurn` from the
 * save and `victoryLine` from the chapter bank, the same two calls as here.
 * The live half (real keys, one profile, three wins) is round 15's.
 */

import { describe, expect, it } from 'vitest';

import type { BattleResult } from '../../src/battle/common/types.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { buildMemberRows } from '../../src/ui/common/resultsMath.ts';
import { victoryLine, victoryTurn } from '../../src/ui/common/victoryLine.ts';

const WIN: BattleResult = {
  outcome: 'victory',
  turns: 10,
  elapsedTicks: 500,
  elapsedMs: 60_000,
  ap: 10,
  exp: 0,
  gil: 100,
  drops: [],
  overkilled: [],
  sphereLevelsGained: {},
};

/** One profile's line for its n-th recorded attempt of Chapter I (the attempt is recorded before the fight). */
function lineOnAttempt(n: number): { speakerId: string; line: string } | undefined {
  const chapter = getChapter('seymour-flux');
  const ids = buildMemberRows(chapter, WIN).map((r) => r.id);
  const turn = victoryTurn({ 'seymour-flux': { attempts: n + 1 } });
  return victoryLine(chapter?.scriptsRef.victoryQuips, ids, turn);
}

describe('PR-0021 re-test: one profile, Chapter I', () => {
  it('attempts 0, 1 and 2 each give the next speaker their first line', () => {
    const lines = [0, 1, 2].map(lineOnAttempt);
    expect(lines.every((l) => l !== undefined)).toBe(true);
    expect(new Set(lines.map((l) => l!.speakerId)).size).toBe(3);
    const banks = getChapter('seymour-flux')!.scriptsRef.victoryQuips;
    for (const l of lines) expect(l!.line).toBe(banks[l!.speakerId]![0]);
  });

  it('five wins show at least three distinct lines, every one from the chapter bank', () => {
    const banks = getChapter('seymour-flux')!.scriptsRef.victoryQuips;
    const firsts = new Set(Object.values(banks).map((b) => b[0]));
    const shown = [0, 1, 2, 3, 4].map((n) => lineOnAttempt(n)!.line);
    expect(new Set(shown).size).toBeGreaterThanOrEqual(3);
    for (const line of shown) expect(firsts.has(line)).toBe(true);
  });
});
