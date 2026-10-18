/**
 * **RE-parity measurement, FFX-2 Confusion** (re-parity RC9 lane X2-H; `docs/handoff/re-parity-rc9-x2-confusion.md` section 5). **FFX-2 only.**
 *
 * The shipped `intendedStrategy` plays every FFX-2 chapter's whole chain through the app's own path (the same loop as `ffx2-parity-measure.test.ts`) and, besides wins, party turns and
 * party KOs, this file counts what Confusion does: the seeds in which a girl was Confused, the turns the Confusion pick took, what it picked and whom it aimed at. `PYREFLY_CONFUSION=off`
 * puts the pre-RC9 rule back through a module mock of the switch (`constants.ts#CONFUSION_PICK`), so one file measures both sides of the change on the same tree.
 *
 * Every row also carries one digest per seed of every event of every link (`digests`), so the same file run on two trees (this one and `origin/r49-rc`, where the two mocks below have nothing
 * to wrap) says seed by seed whether the fights are the same event for event. Three what-ifs, none of them the shipped line, put a Confused girl where the data has none: `PYREFLY_CONFUSE=yuna`
 * (the named girls start every link Confused), `PYREFLY_PARAGON=normal` (Chapter XIII opens with the Cloister Paragon of the normal form, whose third normal attack Confuses) and
 * `PYREFLY_LEVEL_SHIFT=-20` (every party member's level moved: -20 puts the Angra Mainyu party back on the Chapter V preset, where Tawrich's Bloody Breath can Confuse).
 *
 * Runs only with `PYREFLY_MEASURE=1`. `PYREFLY_MEASURE_SEEDS=<n>` plays seeds 1 to n (default 12) or `<a>-<b>`; `PYREFLY_MEASURE_OUT=<file>` writes the rows as JSON;
 * `PYREFLY_MEASURE_CHAPTERS=<id,id>` narrows the run; `PYREFLY_MEASURE_TAG=<text>` is written into every row. Measure, never tune: nothing here changes a boss or a party number.
 */

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { describe, it, vi } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';

interface Pick {
  actor: string;
  kind: string;
  id: string;
  relation: string;
  count: number;
}

const { picks, idles } = vi.hoisted(() => ({ picks: [] as Pick[], idles: { count: 0 } }));

vi.mock('../../src/battle/ffx2/constants.ts', async (importOriginal) => {
  const m = await importOriginal<Record<string, unknown>>();
  return process.env['PYREFLY_CONFUSION'] === 'off' ? { ...m, CONFUSION_PICK: false } : m;
});
vi.mock('../../src/battle/ffx2/adapt/confusion.ts', async (importOriginal) => {
  const m = await importOriginal<typeof import('../../src/battle/ffx2/adapt/confusion.ts')>();
  return {
    ...m,
    confusedTurn: (actor: Parameters<typeof m.confusedTurn>[0], env: Parameters<typeof m.confusedTurn>[1]) => {
      const turn = m.confusedTurn(actor, env);
      if (turn === null) {
        idles.count += 1;
        return turn;
      }
      const targets = turn.command.targets.map((t) => env.units.find((u) => u.id === t)).filter((u) => u !== undefined);
      const relation = targets.length === 0 ? 'none' : targets.length > 1 ? 'group' : targets[0]?.id === actor.id ? 'self' : targets[0]?.side === actor.side ? 'ally' : 'enemy';
      picks.push({ actor: actor.id, kind: turn.command.kind, id: 'id' in turn.command ? String(turn.command.id) : '', relation, count: turn.candidates });
      return turn;
    },
  };
});

import { FFX2Engine, STEPS_PER_SECOND } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { cloisterParagonGroup } from '../../src/data/ffx2/enemies/trema.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const SEED_SPEC = process.env['PYREFLY_MEASURE_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const ONLY = process.env['PYREFLY_MEASURE_CHAPTERS']?.split(',');
/** What-if (not the shipped line): the named girls start every link Confused for the game's own timer, 200,000 units (about 70 seconds at the Normal speed). */
const INJECT = process.env['PYREFLY_CONFUSE']?.split(',').filter((x) => x.length > 0) ?? [];
/** What-if (not the shipped line): Chapter XIII opens with the Cloister Paragon of the normal form (`PYREFLY_PARAGON=normal`), whose third normal attack is the one enemy strike that Confuses a girl; the shipped chapter opens with the Oversoul form, which has no Confusion. */
const PARAGON_NORMAL = process.env['PYREFLY_PARAGON'] === 'normal';
/** What-if (not the shipped line): every party member's level moved by this much at the start of the chain (`PYREFLY_LEVEL_SHIFT=-20` puts the Angra Mainyu party back on the Chapter V preset's levels, where Tawrich's Bloody Breath can Confuse). */
const LEVEL_SHIFT = Number(process.env['PYREFLY_LEVEL_SHIFT'] ?? '0');
/** A free label written into every row (`PYREFLY_MEASURE_TAG=base`): the same file also runs on a tree that has no Confusion pick, where the mocks below have nothing to wrap. */
const TAG = process.env['PYREFLY_MEASURE_TAG'] ?? '';
const MAX_STEPS = 60_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;

interface One {
  outcome: string;
  link1Won: boolean;
  partyTurns: number;
  engineTurns: number;
  minutes: number;
  partyKos: number;
  confusedGirls: number;
  confusedTurns: number;
  /** A digest of every event of every link, in order: two trees agree on a seed only when their logs are the same event for event. */
  digest: string;
}

function shiftLevels(setup: BattleSetup): BattleSetup {
  const party = setup.party as { members?: Array<{ level: number }> };
  if (LEVEL_SHIFT === 0 || party.members === undefined) return setup;
  const members = party.members.map((m) => ({ ...m, level: Math.max(1, Math.min(99, m.level + LEVEL_SHIFT)) }));
  return { ...setup, party: { ...setup.party, members } as BattleSetup['party'] };
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function partyKosOf(state: Readonly<BattleState>): number {
  let kos = 0;
  for (const e of state.log) {
    if (e.type !== 'ko') continue;
    const side = state.combatants[e.targetId]?.side;
    if (side === 'party' || side === 'aeon') kos += 1;
  }
  return kos;
}

/** How many girls took Confusion in this link (status-add events). */
function confusedGirlsOf(state: Readonly<BattleState>): number {
  let n = 0;
  for (const e of state.log) if (e.type === 'status-add' && e.status === 'confuse' && state.combatants[e.targetId]?.side === 'party') n += 1;
  return n;
}

/** Put Confusion on the named girls (the engine's combatants are its units). */
function injectConfusion(engine: FFX2Engine): void {
  const combatants = (engine.state() as BattleState).combatants;
  for (const id of INJECT) {
    const girl = combatants[id];
    if (girl !== undefined && girl.alive && girl.statuses['confuse'] === undefined) {
      girl.statuses['confuse'] = { id: 'confuse', turnsRemaining: null, ticksRemaining: 200_000, charges: null, stacks: 1, permanent: false };
    }
  }
}

async function playChain(chapter: Chapter, seed: number): Promise<One> {
  let setup: BattleSetup = shiftLevels(setupForChapter(chapter, seed));
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  injectConfusion(engine);
  let outcome = 'unresolved';
  let link = 1;
  let link1Won = false;
  let partyTurns = 0;
  let engineTurns = 0;
  let partyKos = 0;
  let ticks = 0;
  let confusedGirls = 0;
  const before = picks.length;
  const hash = createHash('sha1');
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      engineTurns += d.result.turns;
      partyKos += partyKosOf(engine.state() as Readonly<BattleState>);
      ticks += (engine.state() as Readonly<BattleState>).ticks;
      confusedGirls += confusedGirlsOf(engine.state() as Readonly<BattleState>);
      outcome = String(d.result.outcome);
      for (const event of (engine.state() as Readonly<BattleState>).log) hash.update(JSON.stringify(event));
      hash.update(`|over:${outcome}:${d.result.turns}|`);
      if (link === 1) link1Won = outcome === 'victory';
      if (outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      injectConfusion(engine);
      continue;
    }
    partyTurns += 1;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return { outcome, link1Won, partyTurns, engineTurns, minutes: ticks / STEPS_PER_SECOND / 60, partyKos, confusedGirls, confusedTurns: picks.length - before, digest: hash.digest('hex').slice(0, 12) };
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10);
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

describe.skipIf(!MEASURE)('RE parity, FFX-2 Confusion: the intended line in every FFX-2 chapter (PYREFLY_MEASURE=1)', () => {
  it("measures wins, party turns, KOs and what the Confusion pick did, over each chapter's whole chain", async () => {
    await registerBattleContent();
    const rows: unknown[] = [];
    for (const listed of [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2' && (ONLY ? ONLY.includes(c.id) : CHAPTERS.includes(c)))) {
      const chapter: Chapter = PARAGON_NORMAL && listed.id === 'ffx2-trema' ? { ...listed, enemyGroupRef: cloisterParagonGroup } : listed;
      const runs: One[] = [];
      const from = picks.length;
      const idleFrom = idles.count;
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await playChain(chapter, seed));
      const mine = picks.slice(from);
      const tally = (key: keyof Pick): Record<string, number> => mine.reduce<Record<string, number>>((acc, p) => ({ ...acc, [String(p[key])]: (acc[String(p[key])] ?? 0) + 1 }), {});
      rows.push({
        chapter: PARAGON_NORMAL && chapter.id === 'ffx2-trema' ? 'ffx2-trema+normal-paragon' : chapter.id,
        tag: TAG,
        confusion: process.env['PYREFLY_CONFUSION'] === 'off' ? 'old rule (menu kept)' : 'the game\'s pick',
        injected: INJECT,
        levelShift: LEVEL_SHIFT,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        digests: runs.map((r) => r.digest),
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        sums: { partyTurns: sum(runs.map((r) => r.partyTurns)), engineTurns: sum(runs.map((r) => r.engineTurns)), minutes: Math.round(sum(runs.map((r) => r.minutes)) * 10) / 10, partyKos: sum(runs.map((r) => r.partyKos)) },
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        link1Wins: runs.filter((r) => r.link1Won).length,
        meanPartyTurns: mean(runs.map((r) => r.partyTurns)),
        meanEngineTurns: mean(runs.map((r) => r.engineTurns)),
        meanMinutes: mean(runs.map((r) => r.minutes)),
        meanPartyKos: mean(runs.map((r) => r.partyKos)),
        confusion_: {
          seedsWithAGirlConfused: runs.filter((r) => r.confusedGirls > 0).length,
          girlsConfused: sum(runs.map((r) => r.confusedGirls)),
          pickTurns: mine.length,
          pickTurnsPerSeedWithConfusion: mean(runs.filter((r) => r.confusedGirls > 0).map((r) => r.confusedTurns)),
          idlePicks: idles.count - idleFrom,
          byKind: tally('kind'),
          byTarget: tally('relation'),
          byCandidates: tally('count'),
        },
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 6_000_000);
});
