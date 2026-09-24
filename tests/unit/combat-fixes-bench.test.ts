/**
 * **combat-fixes-0924 — the seeded bench** behind `docs/plans/combat-fixes-0924-review.md` §5.
 *
 * Win rates on the real engines, the real data and the shipped builds, for the intended line and a
 * credibly wrong one in every chapter a fix touches:
 *
 * - (a) FFX-2 magic never rolls: Chapters IV, V, VI (Wait, 0 ms a menu, whole chain, no retry).
 *   Lines: **intended** (the shipped `intendedStrategy`), **wrong** (mash Attack, no upkeep:
 *   `attackStrategy`) and **magic-first** (the intended upkeep, otherwise the strongest hostile
 *   magic the girl has: the line fix (a) moves most on the party side).
 * - (b) Chapter I: **intended** (the shipped tactic: kill Seymour, leave the mount), **drain-farm**
 *   (research §6 row 17: the same upkeep, but the hits go to the Mortiorchis so every kill drains
 *   Seymour; the line (b) moves most) and **wrong** (mash Attack, no upkeep: `attackStrategy`).
 * - (c) Chapter III, first link: **intended** and **provoke** (Tidus keeps Provoke on Braska's Final
 *   Aeon, otherwise the intended line). Measured to inform Bailey; (c) is not built.
 *
 * **Measure, never tune.** With `PYREFLY_MEASURE=1` it runs 200 seeds a line and prints one JSON
 * line per row; by default it is a 10-seed smoke that pins only that every battle ends.
 * Game case: (a) FFX-2 only, (b) and (c) FFX only [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, CombatantId } from '../../src/battle/common/types.ts';
import type { AutoStrategy } from '../../src/engine/BattlePresenter.ts';
import { attackStrategy, intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import {
  type Ffx2Chapter,
  type Run,
  driveChapter1,
  driveChapter3Bfa,
  driveFfx2,
  ffx2Ability,
  magicMisses,
} from './helpers/combatFixesDrive.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = MEASURE ? 200 : 10;

function isRestorativeCommand(c: Command | null): boolean {
  if (!c) return false;
  if (c.kind === 'item') return true;
  if (c.kind !== 'ability') return false;
  const def = ffx2Ability(c.id);
  return !!def && (def.flags.includes('heals') || def.formula === 'healing');
}

/** The intended upkeep; otherwise the strongest hostile magical action on offer. */
const magicFirst: AutoStrategy = (actorId, commands, engine) => {
  const planned = intendedStrategy(actorId, commands, engine);
  if (isRestorativeCommand(planned)) return planned;
  const st = engine.state();
  const foes = new Set(
    Object.values(st.combatants)
      .filter((c) => c.side === 'enemy' && c.alive && !c.removed)
      .map((c) => c.id),
  );
  let best: { row: AvailableCommand; power: number } | undefined;
  for (const row of commands) {
    if (!row.enabled || row.command.kind !== 'ability') continue;
    const def = ffx2Ability(row.command.id);
    if (!def || def.damageType !== 'magical' || def.flags.includes('heals')) continue;
    if (!row.validTargets.some((t) => foes.has(t))) continue;
    if (!best || def.power > best.power) best = { row, power: def.power };
  }
  if (!best) return planned;
  if (best.row.command.targets.length) return best.row.command;
  const target = best.row.validTargets.find((t) => foes.has(t)) as CombatantId;
  return { ...best.row.command, targets: [target] } as Command;
};

/**
 * Research §6 row 17, "Kill Mortiorchis repeatedly": the intended upkeep and buffs, but every
 * hostile single-target action the intended line aims at Seymour goes to the mount instead, so
 * each kill drains Seymour (4,000 / 3,000 / 2,000 / 1,000 ...). The line fix (b) moves.
 */
const drainFarm: AutoStrategy = (actorId, commands, engine) => {
  const planned = intendedStrategy(actorId, commands, engine);
  if (!planned || planned.targets.length !== 1 || planned.targets[0] !== 'seymour-flux') return planned;
  const row = commands.find((c) => c.enabled && c.command.kind === planned.kind && ('id' in c.command ? c.command.id : undefined) === ('id' in planned ? planned.id : undefined));
  const mount = engine.state().combatants['mortiorchis'];
  if (!row || !mount?.alive || !row.validTargets.includes('mortiorchis')) return planned;
  return { ...planned, targets: ['mortiorchis'] } as Command;
};

const BFA = 'braskas-final-aeon';

/** Keep Provoke on Braska's Final Aeon with whoever has it; otherwise the intended line. */
const provokeBfa: AutoStrategy = (actorId, commands, engine: BattleEngine) => {
  const bfa = engine.state().combatants[BFA];
  if (bfa && bfa.alive && bfa.statuses['provoke'] === undefined) {
    const row = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === 'provoke' && c.validTargets.includes(BFA));
    if (row) return { ...row.command, targets: [BFA] } as Command;
  }
  return intendedStrategy(actorId, commands, engine);
};

interface Row {
  chapter: string;
  line: string;
  seeds: number;
  wins: number;
  outcomes: Record<string, number>;
  extra: Record<string, number>;
}

function bench(chapter: string, line: string, play: (seed: number) => Run, extra: (r: Run) => Record<string, number>): Row {
  const row: Row = { chapter, line, seeds: SEEDS, wins: 0, outcomes: {}, extra: {} };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = play(seed);
    row.outcomes[r.outcome] = (row.outcomes[r.outcome] ?? 0) + 1;
    if (r.outcome === 'victory') row.wins += 1;
    for (const [k, v] of Object.entries(extra(r))) row.extra[k] = (row.extra[k] ?? 0) + v;
  }
  if (MEASURE) console.log(`BENCH ${JSON.stringify(row)}`);
  return row;
}

const X2_LINES: ReadonlyArray<[string, AutoStrategy]> = [
  ['intended', intendedStrategy],
  ['wrong', attackStrategy],
  ['magic-first', magicFirst],
];

describe(`combat-fixes-0924 bench (${SEEDS} seeds a line; measured, not tuned)`, () => {
  for (const chapter of [4, 5, 6] as Ffx2Chapter[]) {
    for (const [line, strategy] of X2_LINES) {
      it(`(a) Chapter ${chapter}, ${line}: every run ends`, () => {
        const row = bench(`ch${chapter}`, line, (s) => driveFfx2(chapter, s, strategy), (r) => ({ ...magicMisses(r.logs) }));
        expect(row.outcomes['unfinished'] ?? 0).toBe(0);
      }, 600_000);
    }
  }

  const ch1Extra = (r: Run): Record<string, number> => {
    const log = r.logs[0]!;
    return {
      // Phase 2's Flare detonating on Seymour himself (no Reflect up when it resolved).
      selfFlareHits: log.filter((e) => e.type === 'damage' && e.sourceId === 'seymour-flux' && e.targetId === 'seymour-flux' && e.amount > 0).length,
      mortibsorptions: log.filter((e) => e.type === 'heal' && e.cause === 'mortibsorption').length,
      countersOffTheDrain: log.filter((e) => e.type === 'counter' && e.actorId === 'seymour-flux' && e.targetId === 'mortiorchis').length,
    };
  };
  for (const [line, strategy] of [['intended', intendedStrategy], ['drain-farm', drainFarm], ['wrong', attackStrategy]] as const) {
    it(`(b) Chapter 1, ${line}: every run ends`, () => {
      const row = bench('ch1', line, (s) => driveChapter1(s, strategy), ch1Extra);
      expect(row.outcomes['unfinished'] ?? 0).toBe(0);
    }, 600_000);
  }

  for (const [line, strategy] of [['intended', intendedStrategy], ['provoke', provokeBfa]] as const) {
    it(`(c) Chapter 3 link 1 (BFA), ${line}: every run ends`, () => {
      const row = bench('ch3-bfa', line, (s) => driveChapter3Bfa(s, strategy), (r) => ({
        provokeLanded: r.logs[0]!.filter((e) => e.type === 'status-add' && e.targetId === BFA && e.status === 'provoke').length,
      }));
      expect(row.outcomes['unfinished'] ?? 0).toBe(0);
    }, 600_000);
  }
});
