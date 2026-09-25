/**
 * **Does the advisor add to Chapter V's and VI's losses under the default Wait split?**
 * (decision sheet 2026-09-25 item 3, D; critic round 12 PR-0076 fix (1), R12-UI-01). Measurement
 * only, skipped unless `PYREFLY_MEASURE=1`. **FFX-2 only** (AGENTS.md rule 14).
 *
 * 40 seeds, the default Wait split, `T` ms of every decision on the top-level list (the clock
 * runs; `research/ffx2-combat-core.md` §1.5) and the rest inside a submenu (held). `T` = 0, 1,000
 * and 1,500 ms, as the sheet asks. Two drivers on the same seeds: the chapter's own line
 * (`intendedStrategy`) and a card follower who presses only the advisor's top row
 * (`buildAdvisorView(...).suggestions[0]`, the live HUD's options: the X-2 registries and the held
 * command), the round-12 FFX bench's method. A declined card falls back to the first enabled
 * Attack and is counted. `T` is an **authored measurement input, not game data**. Nothing here
 * tunes a boss (hard rule 6).
 *
 * ```
 * PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-advisor-wait-split-bench.test.ts --testTimeout=60000
 * ```
 */

import { afterAll, describe, expect, it } from 'vitest';
import type { BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, type AdvisorOptions } from '../../src/engine/tactics/advisor.ts';
import { rowFor } from '../../src/engine/tactics/guide.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Number(process.env['ADVISOR_BENCH_SEEDS'] ?? 40);
const TOPS = [0, 1000, 1500];
const HELD_MS = 1000;
const MAX_DECISIONS = 30_000;

type Input = Extract<Decision, { kind: 'player-input' }>;
type Driver = 'intended' | 'advisor';

interface Run { outcome: string | undefined; links: number; minutes: number; declines: number; closed: number; picks: Map<string, number> }

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

function pick(engine: FFX2Engine, d: Input, driver: Driver, options: AdvisorOptions, run: Run): Command {
  if (driver === 'intended') return intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d);
  const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, options);
  const top = view?.suggestions[0];
  if (!top) {
    run.declines += 1;
    return fallback(d);
  }
  const label = rowFor(d.commands, top.command)?.label ?? top.command.kind;
  run.picks.set(label, (run.picks.get(label) ?? 0) + 1);
  return top.command;
}

function runLink(engine: FFX2Engine, driver: Driver, topMs: number, options: AdvisorOptions, run: Run): string | undefined {
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return d.result.outcome;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (topMs > 0) {
      engine.setMenuLevel('top');
      engine.tick(topMs, { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) {
        run.closed += 1;
        continue;
      }
      engine.tick(HELD_MS, { throughInput: true }); // held: moves nothing
    }
    // The card is read on the board the player confirms on, after the top-list time.
    engine.submit(pick(engine, d, driver, options, run));
  }
  return undefined;
}

function driveChain(order: readonly string[], party: FFX2PartyBuild, seed: number, driver: Driver, topMs: number): Run {
  const opts = ffx2Options({ atbMode: 'wait', waitSplit: true });
  const engine = new FFX2Engine(opts);
  const options: AdvisorOptions = {
    ffx2: { ...(opts.abilities ? { abilities: opts.abilities } : {}), ...(opts.items ? { items: opts.items } : {}) },
    queued: () => {
      const held = engine.heldCommand();
      return held ? [held] : [];
    },
  };
  const run: Run = { outcome: undefined, links: 0, minutes: 0, declines: 0, closed: 0, picks: new Map() };
  const first = data.ENEMY_GROUPS_BY_ID[order[0]!];
  if (!first) throw new Error(`no formation ${order[0]}`);
  let setup: BattleSetup = { game: 'ffx2', party, enemies: first, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  let group: EnemyGroupDef = first;
  for (;;) {
    run.outcome = runLink(engine, driver, topMs, options, run);
    run.minutes += engine.state().ticks / 3000 / 60;
    if (run.outcome !== 'victory') break;
    run.links += 1;
    const nextId = group.nextGroupId;
    if (!nextId) break;
    const next = data.ENEMY_GROUPS_BY_ID[nextId];
    if (!next) throw new Error(`chain points at "${nextId}" with no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + run.links) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  return run;
}

const CHAPTERS = [
  { name: 'V Vegnagun', order: VEGNAGUN_CHAIN_ORDER, party: farplaneBuild },
  { name: 'VI Leblanc', order: LEBLANC_CHAIN_ORDER, party: chateauBuild },
] as const;

const rows: string[] = [];
const picks: string[] = [];

describe.skipIf(!MEASURE)('item 3 D: the advisor bench, Chapters V and VI, Wait split (PYREFLY_MEASURE=1)', () => {
  for (const ch of CHAPTERS) {
    it(ch.name, () => {
      for (const top of TOPS) {
        for (const driver of ['intended', 'advisor'] as const) {
          const runs = Array.from({ length: SEEDS }, (_, i) => driveChain(ch.order, ch.party, i + 1, driver, top));
          const wins = runs.filter((r) => r.outcome === 'victory').length;
          const links = runs.reduce((a, r) => a + r.links, 0) / SEEDS;
          const lost: Record<number, number> = {};
          for (const r of runs) if (r.outcome !== 'victory') lost[r.links + 1] = (lost[r.links + 1] ?? 0) + 1;
          const lostAt = Object.entries(lost).map(([l, n]) => `link ${l}: ${n}`).join(', ') || '—';
          rows.push(
            `| ${ch.name} | ${top / 1000} s | ${driver === 'intended' ? 'intended line' : 'advisor top row'} | ${wins}/${SEEDS} | ${links.toFixed(2)} | ${lostAt} | ${(runs.reduce((a, r) => a + r.minutes, 0) / SEEDS).toFixed(1)} | ${runs.reduce((a, r) => a + r.closed, 0)} | ${runs.reduce((a, r) => a + r.declines, 0)} |`,
          );
          if (driver === 'advisor') {
            const all = new Map<string, number>();
            for (const r of runs) for (const [k, v] of r.picks) all.set(k, (all.get(k) ?? 0) + v);
            const top8 = [...all.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(', ');
            picks.push(`- ${ch.name}, ${top / 1000} s: ${top8}`);
          }
          expect(runs.length).toBe(SEEDS);
        }
      }
    }, 3_600_000);
  }
  afterAll(() => {
    console.log([
      '',
      '| Chapter | Top-list time | Driver | Wins | Links cleared (avg) | Lost at | Avg min | Menus closed | Card declined |',
      '|---|---|---|---:|---:|---|---:|---:|---:|',
      ...rows,
      '',
      'Advisor top-row picks (most pressed):',
      ...picks,
    ].join('\n'));
  });
});
