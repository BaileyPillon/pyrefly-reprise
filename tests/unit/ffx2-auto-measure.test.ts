/**
 * **RE-parity balance measurement, FFX-2, the automatic-status layer and the counters** (re-parity X2-D).
 *
 * The shipped builds wear no accessory and learn no ability that keeps a status, sets an SOS set or counters, so on the shipped line the lane moves nothing
 * (`ffx2-parity-measure.test.ts` shows it, seed for seed). This file plays the same chapters, through the same path and the same strategy, with the
 * loadouts that DO use the lane, so the move can be measured: `PYREFLY_X2D_VARIANT` picks one.
 *
 * - `berserker`: all three girls in the Berserker dressphere with Counterattack, Magic Counter and Evade & Counter learned.
 * - `mixed`: Yuna a Berserker (the three counters), Rikku a Samurai with SOS Critical, Paine a Warrior with SOS Protect: the plan's "a Berserker, a Warrior
 *   with SOS Protect, a Samurai with SOS Critical in the line" (the Festivalist has no ability table in the engine).
 * - `bangles`: the shipped dresspheres, with a Wall Ring, a Regen Bangle and a Haste Bangle on the three girls' second accessory slot (SOS Wall, SOS Regen, SOS Haste).
 *
 * Per chapter it reports wins, losses, party turns, engine turns, minutes and party KOs over the whole chain (as the other measurement does), and the lane's own
 * counts: the counters played (by cause) and the times a girl's SOS set came on. **Measure, never tune.**
 *
 * Runs only with `PYREFLY_MEASURE=1`; `PYREFLY_MEASURE_SEEDS=<n>` or `<a>-<b>`, `PYREFLY_MEASURE_CHAPTERS=<id,id>`, `PYREFLY_MEASURE_OUT=<file>`.
 * The same file runs on the base commit (the counts are 0 there: no girl counters, no layer).
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2MemberBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEPS_PER_SECOND } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const VARIANT = process.env['PYREFLY_X2D_VARIANT'] ?? 'none';
const SEED_SPEC = process.env['PYREFLY_MEASURE_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const ONLY = process.env['PYREFLY_MEASURE_CHAPTERS']?.split(',');
const MAX_STEPS = 60_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;

const SAMURAI = ['x2-samurai-sparkler', 'x2-samurai-fireworks', 'x2-samurai-sos-critical'];
const WARRIOR = ['x2-warrior-sentinel', 'x2-warrior-sos-protect'];
const BERSERKER = ['x2-berserker-counterattack', 'x2-berserker-magic-counter', 'x2-berserker-evade-and-counter'];

function dressed(m: FFX2MemberBuild, sphere: string, learned: string[], accessories: string[] = []): FFX2MemberBuild {
  return {
    ...m,
    currentDressphere: sphere,
    owned: [...new Set([sphere, ...m.owned])],
    abilitiesLearned: { ...m.abilitiesLearned, [sphere]: { learned: [...learned], ap: 0 } },
    accessories: [...m.accessories, ...accessories],
  };
}

/** The variant's loadout laid on a chapter's opening party. */
function withVariant(setup: BattleSetup): BattleSetup {
  if (VARIANT === 'none' || setup.party.game !== 'ffx2') return setup;
  const [a, b, c] = setup.party.members;
  if (a === undefined || b === undefined || c === undefined) return setup;
  const members: [FFX2MemberBuild, FFX2MemberBuild, FFX2MemberBuild] =
    VARIANT === 'berserker'
      ? [dressed(a, 'berserker', BERSERKER), dressed(b, 'berserker', BERSERKER), dressed(c, 'berserker', BERSERKER)]
      : VARIANT === 'mixed'
        ? [dressed(a, 'berserker', BERSERKER), dressed(b, 'samurai', SAMURAI), dressed(c, 'warrior', WARRIOR)]
        : [{ ...a, accessories: [...a.accessories.slice(0, 1), 'wall-ring'] }, { ...b, accessories: [...b.accessories.slice(0, 1), 'regen-bangle'] }, { ...c, accessories: [...c.accessories.slice(0, 1), 'haste-bangle'] }];
  return { ...setup, party: { ...setup.party, members } };
}

interface One {
  outcome: string;
  link1Won: boolean;
  partyTurns: number;
  engineTurns: number;
  minutes: number;
  partyKos: number;
  counters: Record<string, number>;
  /** The times a girl's automatic-status layer put a status on in the middle of the battle (an SOS set coming on). */
  sosOn: number;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function tally(state: Readonly<BattleState>, one: One): void {
  for (const e of state.log) {
    if (e.type === 'ko') {
      const side = state.combatants[e.targetId]?.side;
      if (side === 'party' || side === 'aeon') one.partyKos += 1;
    } else if (e.type === 'counter' && state.combatants[e.actorId]?.side === 'party') {
      one.counters[e.cause] = (one.counters[e.cause] ?? 0) + 1;
    } else if (e.type === 'status-add' && e.instance.sourceAbilityId === 'auto-layer') {
      one.sosOn += 1;
    }
  }
}

async function playChain(chapter: Chapter, seed: number): Promise<One> {
  let setup: BattleSetup = withVariant(setupForChapter(chapter, seed));
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const one: One = { outcome: 'unresolved', link1Won: false, partyTurns: 0, engineTurns: 0, minutes: 0, partyKos: 0, counters: {}, sosOn: 0 };
  let link = 1;
  let ticks = 0;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      one.engineTurns += d.result.turns;
      tally(engine.state() as Readonly<BattleState>, one);
      ticks += (engine.state() as Readonly<BattleState>).ticks;
      one.outcome = String(d.result.outcome);
      if (link === 1) one.link1Won = one.outcome === 'victory';
      if (one.outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    one.partyTurns += 1;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  one.minutes = ticks / STEPS_PER_SECOND / 60;
  return one;
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10);

describe.skipIf(!MEASURE)('RE parity, FFX-2: the automatic-status layer and the counters (PYREFLY_MEASURE=1)', () => {
  it('plays each chapter\'s whole chain with the variant loadout', async () => {
    await registerBattleContent();
    const rows: unknown[] = [];
    for (const chapter of [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2' && (ONLY ? ONLY.includes(c.id) : CHAPTERS.includes(c)))) {
      const runs: One[] = [];
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await playChain(chapter, seed));
      const counters: Record<string, number> = {};
      for (const r of runs) for (const [k, v] of Object.entries(r.counters)) counters[k] = (counters[k] ?? 0) + v;
      rows.push({
        variant: VARIANT,
        chapter: chapter.id,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        sums: {
          partyTurns: runs.reduce((a, r) => a + r.partyTurns, 0),
          engineTurns: runs.reduce((a, r) => a + r.engineTurns, 0),
          minutes: runs.reduce((a, r) => a + r.minutes, 0),
          partyKos: runs.reduce((a, r) => a + r.partyKos, 0),
          counters,
          sosOn: runs.reduce((a, r) => a + r.sosOn, 0),
        },
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        unresolved: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
        link1Wins: runs.filter((r) => r.link1Won).length,
        meanPartyTurns: mean(runs.map((r) => r.partyTurns)),
        meanEngineTurns: mean(runs.map((r) => r.engineTurns)),
        meanMinutes: mean(runs.map((r) => r.minutes)),
        meanPartyKos: mean(runs.map((r) => r.partyKos)),
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 6_000_000);
});
