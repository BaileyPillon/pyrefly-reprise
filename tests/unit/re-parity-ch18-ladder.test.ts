/**
 * **CH-XVIII ladder: the Chapter XVIII line and party, each against each** (re-parity; FFX only; measure, never tune).
 *
 * Plays Overdrive Sin (the whole chapter is link 4) through the app's own path (`registerBattleContent`,
 * `setupForChapter`) with every pair of
 *
 * - **line**: `before` = the line as it stood on the 12-turn clock before CH-XVIII (`helpers/sinFaceBeforeCh18.ts`, a frozen
 *   copy: one Firaga a turn), `shipped` = `intendedStrategy`, i.e. `src/engine/tactics/sin-face.ts` as it is on the tree under test;
 * - **party**: `rested` = `sinFahrenheitBuild` (the party straight out of Sin's back, as Chapter XVIII had it), `warded` =
 *   `sinFaceBuild` (the same party re-equipped against Gaze; what the chapter ships).
 *
 * and prints one row per pair: wins, Sin's HP left on a loss, party actions, party KOs, Gaze statuses that landed.
 * It is the command to **re-run on a merged tree** (W5, the Overdrive gauge gains and the aeon rules, may move this chapter):
 *
 * ```
 * PYREFLY_CH18_LADDER=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=<file>.json \
 *   node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/re-parity-ch18-ladder.test.ts --testTimeout=3600000
 * ```
 *
 * The shipped pair alone, through the plain harness, is `PYREFLY_MEASURE=1 PYREFLY_MEASURE_CHAPTERS=sin-face
 * PYREFLY_MEASURE_SEEDS=1-500 ... vitest run tests/unit/ffx-parity-measure.test.ts`. Seeds are a range `1-500` or a list
 * `1,7,42`; the default is 1 to 12. Skipped unless `PYREFLY_CH18_LADDER=1`, so the full suite pays nothing.
 * `docs/handoff/re-parity-ch18.md` holds the numbers this file printed on the tree it was written on.
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { sinFaceBuild, sinFahrenheitBuild } from '../../src/data/ffx/builds/sin-fahrenheit.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { sinFaceBeforeCh18 } from './helpers/sinFaceBeforeCh18.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const ON = process.env['PYREFLY_CH18_LADDER'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const SIN = 'overdrive-sin';

function parseSeeds(spec: string | undefined): number[] {
  if (!spec) return Array.from({ length: 12 }, (_, i) => i + 1);
  const range = /^(\d+)-(\d+)$/.exec(spec);
  if (range) return Array.from({ length: Number(range[2]) - Number(range[1]) + 1 }, (_, i) => Number(range[1]) + i);
  return spec.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
}
const SEEDS = parseSeeds(process.env['PYREFLY_MEASURE_SEEDS']);

/** What the shipped strategy does when a tactic has no pick: a ready Overdrive, else an attack, else a skill or spell, else the first row. */
function overdriveOrAttack(d: Input): Command {
  const enabled = d.commands.filter((c) => c.enabled);
  const pick =
    enabled.find((c) => c.command.kind === 'overdrive') ??
    enabled.find((c) => c.command.kind === 'attack') ??
    enabled.find((c) => c.category === 'skill' || c.category === 'blackmagic') ??
    enabled[0];
  if (!pick) return { kind: 'defend', targets: [] } as Command;
  const t = pick.validTargets.includes(SIN) ? SIN : pick.validTargets[0];
  return { ...pick.command, targets: t ? [t] : [] } as Command;
}

const LINES: Record<string, (d: Input, e: FFXEngine) => Command> = {
  before: (d, e) => sinFaceBeforeCh18(d.actorId, d.commands, e as never) ?? overdriveOrAttack(d),
  shipped: (d, e) => intendedStrategy(d.actorId, d.commands, e as never) ?? overdriveOrAttack(d),
};
const PARTIES: Record<string, FFXPartyBuild> = { rested: sinFahrenheitBuild, warded: sinFaceBuild };

interface One {
  seed: number;
  win: boolean;
  sinHpLeft: number;
  sinTurns: number;
  partyActions: number;
  kos: number;
  gazeStatuses: number;
}

function play(line: string, party: string, seed: number): One {
  const setup: BattleSetup = setupForChapter(CHAPTERS.find((c) => c.id === 'sin-face')!, seed);
  setup.party = PARTIES[party]!;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  let partyActions = 0;
  for (let step = 0; step < 100_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      const st = e.state() as BattleState;
      const log = st.log as Array<{ type: string; status?: string; targetId?: string }>;
      return {
        seed,
        win: d.result.outcome === 'victory',
        sinHpLeft: Math.max(0, st.combatants[SIN]!.hp),
        sinTurns: Number(st.flags['sin.turn'] ?? 0),
        partyActions,
        kos: log.filter((x) => x.type === 'ko' && st.combatants[x.targetId ?? '']?.side === 'party').length,
        gazeStatuses: log.filter((x) => x.type === 'status-add' && ['petrify', 'confuse', 'zombie'].includes(x.status ?? '') && st.combatants[x.targetId ?? '']?.side === 'party').length,
      };
    }
    partyActions += 1;
    e.submit(LINES[line]!(d as Input, e));
  }
  throw new Error(`${line}/${party} seed ${seed} never ended`);
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10);

describe.skipIf(!ON)('CH-XVIII ladder: line x party on Overdrive Sin (PYREFLY_CH18_LADDER=1)', () => {
  it('prints wins, Sin\'s HP left on a loss, party actions, KOs and Gaze statuses for each pair', async () => {
    await registerBattleContent();
    const rows: Array<Record<string, unknown>> = [];
    for (const line of Object.keys(LINES)) {
      for (const party of Object.keys(PARTIES)) {
        const runs = SEEDS.map((s) => play(line, party, s));
        const losses = runs.filter((r) => !r.win);
        const row = {
          line,
          party,
          seeds: SEEDS.length > 24 ? `${SEEDS[0]}-${SEEDS[SEEDS.length - 1]}` : SEEDS.join(','),
          wins: runs.filter((r) => r.win).length,
          of: runs.length,
          meanSinHpLeftOnLoss: Math.round(mean(losses.map((r) => r.sinHpLeft))),
          meanPartyActions: mean(runs.map((r) => r.partyActions)),
          meanPartyKos: mean(runs.map((r) => r.kos)),
          meanGazeStatuses: mean(runs.map((r) => r.gazeStatuses)),
          meanSinTurns: mean(runs.map((r) => r.sinTurns)),
        };
        rows.push(row);
        console.log(JSON.stringify(row));
      }
    }
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 3_600_000);
});
