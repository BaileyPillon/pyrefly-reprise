/**
 * Yuna's Ballad (the hidden FFX-2 chapter): how winnable the two duels are, MEASURED, never tuned. **FFX-2 only** [AGENTS.md rule 14; the PRODUCT-BRIEF: a boss number is never tuned, difficulty only through the party
 * and the formation, and a link that measures unwinnable or trivial gets options with numbers].
 *
 * A *line* is a test input standing in for a player (`tests/unit/helpers/yunasBalladDrive.ts#LINES`), never game data: a Warrior or a Gunner that heals with the bag at half HP (the sourced answers are a White Mage for
 * Protect, a Warrior for the Breaks and a Dark Knight, `research/ffx2-gippal-den-of-woe.md` section 5; Yuna's grid holds the White Mage, Gunner, Thief, Warrior and Lady Luck, so the Warrior and the Gunner are her
 * attackers), with the curtains from the bag as a variant, a no-heal line, and the White Mage that never attacks as the control. The party is the Den's kit (YB3) and, for the alternative row, the plain Chapter V preset
 * Yuna (Lv 46, no Hero Drinks).
 *
 * The suite runs `PYREFLY_BENCH_SEEDS` seeds (default 24, bench speed, Wait ATB); the handoff's table is the 200-seed run:
 * `PYREFLY_BENCH_SEEDS=200 npx vitest run tests/unit/chapters/yunas-ballad-bench.test.ts` prints it (`PYREFLY_MEASURE=1` adds the per-duel minutes and Yuna's lowest HP).
 */
import { describe, expect, it } from 'vitest';

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { LINES, driveChapter, turnOf, type LineOptions } from '../helpers/yunasBalladDrive.ts';

const SEEDS = Math.max(8, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 24));
const MEASURE = process.env['PYREFLY_MEASURE'] === '1' || process.env['PYREFLY_BENCH_SEEDS'] !== undefined;

/** The plain Chapter V preset's Yuna alone (Lv 46, no Hero Drinks, the Den's bag without them): the alternative to YB3. */
function chapterVYuna(): FFX2PartyBuild {
  const full = structuredClone(farplaneBuild);
  return { ...full, members: [full.members[0]!] };
}

interface Row {
  wins: number;
  duel0: number;
  secs: number;
  secs0: number;
  secs1: number;
  worstMin: number;
  meanMin: number;
}

function bench(line: LineOptions, seeds: number, build?: FFX2PartyBuild, active = false): Row {
  let wins = 0;
  let duel0 = 0;
  const total: number[] = [];
  const d0: number[] = [];
  const d1: number[] = [];
  const mins: number[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const run = driveChapter(turnOf(line), seed, { ...(build === undefined ? {} : { build }), ...(active ? { atbMode: 'active' as const, decisionMs: 1500 } : {}) });
    if (run.duels[0]?.outcome === 'victory') duel0++;
    if (run.outcome === 'victory') {
      wins++;
      total.push((run.duels[0]!.ticks + run.duels[1]!.ticks) / 30);
    }
    if (run.duels[0]) d0.push(run.duels[0].ticks / 30);
    if (run.duels[1]) d1.push(run.duels[1].ticks / 30);
    for (const duel of run.duels) mins.push(duel.minHpFrac);
  }
  const mean = (a: number[]): number => (a.length === 0 ? NaN : a.reduce((x, y) => x + y, 0) / a.length);
  return { wins, duel0, secs: mean(total), secs0: mean(d0), secs1: mean(d1), worstMin: Math.min(...mins), meanMin: mean(mins) };
}

function report(name: string, row: Row, seeds: number): void {
  if (!MEASURE) return;
  console.info(
    `[yunas ballad bench] ${name.padEnd(28)} wins ${String(row.wins).padStart(3)}/${seeds}  duel 1 won ${String(row.duel0).padStart(3)}/${seeds}  chapter ${row.secs.toFixed(0)} s (${(row.secs / 60).toFixed(1)} min)  ` +
      `duel 1 ${row.secs0.toFixed(0)} s, duel 2 ${row.secs1.toFixed(0)} s  Yuna's lowest HP: mean ${(row.meanMin * 100).toFixed(0)}%, worst ${(row.worstMin * 100).toFixed(0)}%`,
  );
}

describe(`how winnable the two duels are (${SEEDS} seeds a line; measured, never tuned)`, () => {
  it('the Den kit (YB3): a Warrior or a Gunner who heals at half HP wins nearly every seed, in a few minutes', () => {
    for (const [name, line] of [['warrior (heal at half)', LINES.warrior], ['gunner (heal at half)', LINES.gunner], ['warrior + curtains', LINES.warriorCurtains]] as const) {
      const row = bench(line, SEEDS);
      report(name, row, SEEDS);
      expect(row.wins / SEEDS, name).toBeGreaterThanOrEqual(0.9);
      expect(row.secs, `${name}: the whole chapter takes minutes, not seconds`).toBeGreaterThan(60);
      expect(row.secs, `${name}: and not an hour`).toBeLessThan(600);
    }
  }, 240_000);

  it('the duels are not trivial: a Warrior who never heals loses a real share (the Den kit), and a Yuna who only defends or only prays never wins', () => {
    const noHeal = bench({ ...LINES.warrior, healBelow: 0 }, SEEDS);
    report('warrior, never heals', noHeal, SEEDS);
    const healer = bench(LINES.warrior, SEEDS);
    expect(noHeal.wins, 'healing matters').toBeLessThan(healer.wins);
    expect(noHeal.wins / SEEDS, 'and the no-heal line is not hopeless on the Den kit').toBeGreaterThan(0.2);
    expect(noHeal.worstMin, 'she goes to the edge').toBeLessThanOrEqual(0.05);
    const prays = bench(LINES.whiteMage, 8);
    report('white mage (control, 8 seeds)', prays, 8);
    expect(prays.wins).toBe(0);
  }, 240_000);

  it('the alternative kit (the plain Chapter V preset, Lv 46, no Hero Drinks): the healing line still wins, the no-heal line is lost on every seed', () => {
    const build = chapterVYuna();
    const healer = bench(LINES.warrior, SEEDS, build);
    report('alt kit: warrior (heal)', healer, SEEDS);
    expect(healer.wins / SEEDS).toBeGreaterThanOrEqual(0.9);
    const noHeal = bench({ ...LINES.warrior, healBelow: 0 }, SEEDS, build);
    report('alt kit: warrior, no heal', noHeal, SEEDS);
    expect(noHeal.wins / SEEDS).toBeLessThanOrEqual(0.1);
  }, 240_000);

  it('at human speed (Active ATB, 1.5 s of clock a menu) the healing Warrior still wins most seeds', () => {
    const seeds = Math.min(SEEDS, 40);
    const row = bench(LINES.warrior, seeds, undefined, true);
    report('warrior, Active, 1.5 s a menu', row, seeds);
    expect(row.wins / seeds).toBeGreaterThanOrEqual(0.5);
  }, 240_000);
});
