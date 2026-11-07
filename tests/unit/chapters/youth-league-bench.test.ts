/**
 * The Youth League Tournament (the hidden FFX-2 chapter): winnability, MEASURED and never tuned (AGENTS.md rule 15; `critic/RUBRIC.md`; the method of `docs/plans/den-of-woe-bench.md`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * A *line* is a bot standing in for a player (`tests/unit/helpers/youthLeagueDrive.ts`): `defend` (nobody does anything), `ladder` (the shipped auto-battler with no tactic of the chapter's own: the generic ladder),
 * `intended` (the shipped auto-battler WITH the chapter's tactic, `src/engine/tactics/ffx2-youth-league.ts`), `darkness` (the sourced Chapter 5 clear: both Dark Knights on Darkness, Yuna heals and raises, the line the
 * tactic is written from) and `guarded` (the same with Protect and Shell first). **No boss row was touched and the party is the Chapter V preset as given.** 100 seeds a cell by default (`PYREFLY_BENCH_SEEDS=<n>` for more;
 * the engine is deterministic, so the table is exactly reproducible), every act fought fresh, and the whole chain through the app's own path (`setupForNextLink`, the checkpoint rule).
 *
 * **What the table says** is in `docs/handoff/ch-youth-league.md` section 6; the preflight's bar for this chapter is "easy": an expected chain win of at least 90 percent at a human pace on the preset (preflight section 8),
 * not a 60 to 80 percent band. A row far under the bar would be a finding about the party for Bailey, never a boss tweak. The assertions below are the bar and the resolved-cell checks; the numbers print.
 */
import { describe, expect, it } from 'vitest';

import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import { youthLeagueBuild } from '../../../src/data/ffx2/builds/youth-league.ts';
import { YL_ABILITY } from '../../../src/data/ffx2/enemies/youth-league-abilities.ts';
import { ACTS, driveChain, fight, type Act, type LineName } from '../helpers/youthLeagueDrive.ts';

const SEEDS = Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100);
const HUMAN_SEEDS = Math.min(SEEDS, 40);
/** The Wait split at a human pace: 1.5 s a menu, 0.5 s of it on the top list (the Den of Woe's bench). */
const HUMAN = { decisionMs: 1500, topMs: 500, engine: { waitSplit: true } } as const;

interface Cell {
  wins: number;
  losses: number;
  kos: number;
  seconds: number;
  menus: number;
  harbingers: number;
}

/** Cells already measured (the engine is deterministic, so a cell is measured once per run). `buildKey` names the what-if party. */
const MEMO = new Map<string, Cell>();

function cell(act: Act, line: LineName, seeds: number, opts: { human?: boolean; build?: FFX2PartyBuild; buildKey?: string } = {}): Cell {
  const key = [act, line, seeds, opts.human ?? false, opts.buildKey ?? 'preset'].join('|');
  const memo = MEMO.get(key);
  if (memo !== undefined) return memo;
  const c: Cell = { wins: 0, losses: 0, kos: 0, seconds: 0, menus: 0, harbingers: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = fight(act, seed, line, { maxDecisions: 40_000, ...(opts.human ? HUMAN : {}), ...(opts.build ? { build: structuredClone(opts.build) } : {}) });
    if (r.outcome === 'victory') c.wins += 1;
    else c.losses += 1;
    c.kos += r.kos;
    c.seconds += r.ticks / 29.97;
    c.menus += r.decisions;
    c.harbingers += r.moves[YL_ABILITY.harbinger] ?? 0;
  }
  MEMO.set(key, c);
  return c;
}

const row = (act: Act, line: string, c: Cell, seeds: number): string =>
  `act ${act + 1} ${line.padEnd(9)} ${String(c.wins).padStart(3)}/${seeds} wins ${(c.kos / seeds).toFixed(2)} girl KOs a fight ${(c.seconds / seeds).toFixed(0).padStart(3)} s ${(c.menus / seeds).toFixed(0).padStart(2)} menus${c.harbingers ? ` ${(c.harbingers / seeds).toFixed(2)} Harbingers` : ''}`;

/** The party with every member's level set (a what-if: the preset's own levels are the estimate). */
function withLevels(levels: readonly number[]): FFX2PartyBuild {
  const build = structuredClone(youthLeagueBuild);
  build.members.forEach((m, i) => {
    m.level = levels[i]!;
  });
  return build;
}

describe('each act, fresh, on every line (bench speed): the table of the handoff (section 6)', () => {
  it('prints the table; every cell resolves (a win or a loss, never a stalemate); a party that only defends wins almost nothing (a girl Elma confuses acts on her own, Darkness included, which is how the 2 wins of act 6 come)', () => {
    const lines: LineName[] = ['defend', 'ladder', 'intended', 'darkness', 'guarded'];
    const out: string[] = [];
    const cells: Array<[Act, LineName, Cell]> = [];
    for (const act of ACTS) {
      for (const line of lines) {
        const c = cell(act, line, SEEDS);
        out.push(row(act, line, c, SEEDS));
        cells.push([act, line, c]);
      }
    }
    console.info(`[youth league bench] ${SEEDS} seeds a cell, bench speed\n${out.join('\n')}`);
    for (const [act, line, c] of cells) {
      expect(c.wins + c.losses, `act ${act + 1} ${line}`).toBe(SEEDS);
      if (line === 'defend') expect(c.wins, `act ${act + 1} defend`).toBeLessThanOrEqual(Math.ceil(SEEDS * 0.05));
    }
  }, 600_000);

  it('the bar: the sourced line and the tactic win at least 95 of 100 seeds of every act (the chapter is a walkover, as the guides say), and the tactic is never worse than the generic ladder', () => {
    const floor = Math.ceil(SEEDS * 0.95);
    for (const act of ACTS) {
      const tactic = cell(act, 'intended', SEEDS);
      const sourced = cell(act, 'darkness', SEEDS);
      const ladder = cell(act, 'ladder', SEEDS);
      expect(sourced.wins, `act ${act + 1} darkness`).toBeGreaterThanOrEqual(floor);
      expect(tactic.wins, `act ${act + 1} intended`).toBeGreaterThanOrEqual(floor);
      expect(tactic.wins, `act ${act + 1}: the tactic against the ladder`).toBeGreaterThanOrEqual(ladder.wins);
    }
  }, 600_000);
});

describe('each act, fresh, at a human pace (the Wait split, 1.5 s a menu)', () => {
  it('prints the table (40 seeds a cell); the tactic and the sourced line win at least 90 percent of every act at a human pace', () => {
    const out: string[] = [];
    for (const act of ACTS) {
      for (const line of ['ladder', 'intended', 'darkness'] as LineName[]) {
        const c = cell(act, line, HUMAN_SEEDS, { human: true });
        out.push(row(act, line, c, HUMAN_SEEDS));
        expect(c.wins + c.losses, `act ${act + 1} ${line}`).toBe(HUMAN_SEEDS);
        if (line !== 'ladder') expect(c.wins / HUMAN_SEEDS, `act ${act + 1} ${line} at a human pace`).toBeGreaterThanOrEqual(0.9);
      }
    }
    console.info(`[youth league bench] ${HUMAN_SEEDS} seeds a cell, human pace\n${out.join('\n')}`);
  }, 600_000);
});

describe('Lucil: the Doom is the only thing that kills a girl (bench speed)', () => {
  it('the generic ladder loses girls to Harbinger and sometimes the fight; the tactic and the sourced line lose none (the Harbingers they let land are counted)', () => {
    const ladder = cell(6, 'ladder', SEEDS);
    const tactic = cell(6, 'intended', SEEDS);
    const sourced = cell(6, 'darkness', SEEDS);
    console.info(`[youth league bench] Lucil: ladder ${ladder.wins}/${SEEDS} wins ${(ladder.kos / SEEDS).toFixed(2)} KOs ${(ladder.harbingers / SEEDS).toFixed(2)} Harbingers; tactic ${tactic.wins}/${SEEDS} ${(tactic.kos / SEEDS).toFixed(2)} KOs; darkness ${sourced.wins}/${SEEDS} ${(sourced.kos / SEEDS).toFixed(2)} KOs`);
    expect(ladder.kos).toBeGreaterThan(tactic.kos);
    expect(tactic.kos).toBe(0);
    expect(sourced.kos).toBe(0);
  }, 300_000);
});

describe('the whole chain, through the app\'s own path (the party carried, a checkpoint on acts 2 to 7)', () => {
  it('bench speed: every line resolves; the tactic and the sourced line clear the chain on at least 95 percent of seeds; a lost chain is lost on one act and says which', async () => {
    await registerBattleContent();
    const out: string[] = [];
    for (const line of ['ladder', 'intended', 'darkness'] as LineName[]) {
      let wins = 0;
      const lostAt = [0, 0, 0, 0, 0, 0, 0];
      let kos = 0;
      let seconds = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const r = await driveChain(line, seed);
        kos += r.kos;
        seconds += r.seconds;
        if (r.outcome === 'victory' && r.outcomes.length === 7) wins += 1;
        else lostAt[r.outcomes.length - 1]! += 1;
      }
      out.push(`chain ${line.padEnd(9)} ${wins}/${SEEDS} cleared in one go, lost at acts ${lostAt.join(',')}, ${(kos / SEEDS).toFixed(2)} girl KOs a run, ${(seconds / SEEDS / 60).toFixed(1)} minutes of fighting`);
      expect(wins + lostAt.reduce((a, b) => a + b, 0), line).toBe(SEEDS);
      if (line !== 'ladder') expect(wins, line).toBeGreaterThanOrEqual(Math.ceil(SEEDS * 0.95));
    }
    console.info(`[youth league bench] the chain, bench speed\n${out.join('\n')}`);
  }, 900_000);

  it('a human pace (the Wait split, 1.5 s a menu, 0.5 s on the top list): the preflight\'s bar, an expected chain win of at least 90 percent on the preset', async () => {
    await registerBattleContent();
    const out: string[] = [];
    for (const line of ['ladder', 'intended', 'darkness'] as LineName[]) {
      let wins = 0;
      const lostAt = [0, 0, 0, 0, 0, 0, 0];
      for (let seed = 1; seed <= HUMAN_SEEDS; seed++) {
        const r = await driveChain(line, seed, { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } });
        if (r.outcome === 'victory' && r.outcomes.length === 7) wins += 1;
        else lostAt[r.outcomes.length - 1]! += 1;
      }
      out.push(`chain ${line.padEnd(9)} ${wins}/${HUMAN_SEEDS} cleared in one go, lost at acts ${lostAt.join(',')}`);
      if (line !== 'ladder') expect(wins / HUMAN_SEEDS, `${line} at a human pace`).toBeGreaterThanOrEqual(0.9);
    }
    console.info(`[youth league bench] the chain, human pace, ${HUMAN_SEEDS} seeds\n${out.join('\n')}`);
  }, 900_000);

  it('with retries: a defeat on acts 2 to 7 retries THAT act from the state the party entered it (the checkpoint), so the ladder\'s chain is cleared within three tries more often than in one', async () => {
    await registerBattleContent();
    let first = 0;
    let withRetries = 0;
    for (let seed = 1; seed <= HUMAN_SEEDS; seed++) {
      const a = await driveChain('ladder', seed);
      if (a.outcome === 'victory' && a.outcomes.length === 7) first += 1;
      const b = await driveChain('ladder', seed, { retries: 3 });
      if (b.outcome === 'victory') withRetries += 1;
    }
    console.info(`[youth league bench] the generic ladder: ${first}/${HUMAN_SEEDS} in one go, ${withRetries}/${HUMAN_SEEDS} with three retries`);
    expect(withRetries).toBeGreaterThanOrEqual(first);
  }, 900_000);
});

describe('the party as the only lever (what-ifs, measured and not built; the boss is never touched)', () => {
  it('the preset at Lv 40/42/44 (the other honest reading of "early in Chapter 5") and the Chapter 3 build (Lv 32/33/34): the table of the handoff', () => {
    const out: string[] = [];
    for (const [name, build] of [['Chapter V preset 46/48/50', youthLeagueBuild], ['Lv 40/42/44', withLevels([40, 42, 44])], ['Chapter 3 build 32/33/34', djoseBuild]] as const) {
      for (const line of ['darkness', 'intended'] as LineName[]) {
        const per = ACTS.map((act) => cell(act, line, Math.min(SEEDS, 50), { build, buildKey: name }));
        out.push(`${name.padEnd(26)} ${line.padEnd(9)} wins per act ${per.map((c) => c.wins).join(' ')} of ${Math.min(SEEDS, 50)}; girl KOs a fight ${per.map((c) => (c.kos / Math.min(SEEDS, 50)).toFixed(1)).join(' ')}`);
        for (const c of per) expect(c.wins + c.losses).toBe(Math.min(SEEDS, 50));
      }
    }
    console.info(`[youth league bench] the party what-ifs, bench speed\n${out.join('\n')}`);
  }, 900_000);
});
