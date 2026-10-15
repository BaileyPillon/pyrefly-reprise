/**
 * **RE-parity measurement, FFX-2 kill rewards** (re-parity RC9, lane X2-C; **FFX-2 only**).
 *
 * For every FFX-2 chapter, the SHIPPED `intendedStrategy` plays the chapter through the app's own path (as `ffx2-parity-measure.test.ts`
 * does) on a range of seeds, and this file adds up what each WON chain paid on its results screen: the EXP, the AP (per dressphere),
 * the gil, and the items by id, summed over the links the way `chainSpoils` does. It also counts how many items were dropped, how many
 * seeds dropped each item at least once, and the draws taken on the two shared streams (10 and 11) when the build has a tap.
 * **Measure, never tune**: nothing here changes a boss or a party number.
 *
 * `PYREFLY_X2C_VARIANT=hunter|butterfingers|gillionaire|doubles|triple` plays the same chapters with the three girls' ability words set (Item Hunter, Butterfingers,
 * Gillionaire, Double AP + Double Items + Double EXP, Double and Triple AP) after each link's `init`, so the reward abilities can be measured with the combat itself
 * untouched (the words are read by the kill roll only). The base commit ignores them: its columns are the shipped line's.
 *
 * Runs only with `PYREFLY_MEASURE=1`. `PYREFLY_MEASURE_SEEDS=<n>` plays seeds 1 to n (default 12) and `<a>-<b>` plays seeds a to b,
 * `PYREFLY_MEASURE_CHAPTERS=<id,id>` narrows the run, `PYREFLY_MEASURE_OUT=<file>` writes the rows as JSON. The same file runs on
 * the base commit (before) and on the branch (after): it reads only `BattleResult` fields that both have.
 *
 * Game case: **FFX-2 only**.
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleResult, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const VARIANT = process.env['PYREFLY_X2C_VARIANT'] ?? 'none';
const SEED_SPEC = process.env['PYREFLY_MEASURE_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const ONLY = process.env['PYREFLY_MEASURE_CHAPTERS']?.split(',');
const MAX_STEPS = 60_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;

/**
 * The ability words a variant lays on the three girls after each `init` (`Ffx2Unit.autoWords`: word 0 `Chr+0x650`, word 1 `Chr+0x652`), so the reward abilities can be
 * measured with the combat itself untouched (the words are read by the kill roll and, for word 0 and 2, the MP cost; none of these sets an MP bit).
 */
const VARIANT_WORDS: Readonly<Record<string, readonly [number, number, number]>> = {
  hunter: [0, 0x0200, 0], // Item Hunter on all three girls: +64 each on the drop byte
  butterfingers: [0, 0x0002, 0], // the rare slot is certain when an item drops
  gillionaire: [0, 0x0010, 0], // gil x2 per owner: x8
  doubles: [0x1000, 0x0020 | 0x0040, 0], // Double AP, Double Items, Double EXP on all three
  triple: [0x3000, 0, 0], // Double AP and Triple AP: x6
};

function withVariant(engine: FFX2Engine): void {
  const words = VARIANT_WORDS[VARIANT];
  if (words === undefined) return;
  for (const unit of (engine as unknown as { units: Array<{ side: string; autoWords?: readonly [number, number, number] }> }).units) if (unit.side === 'party') unit.autoWords = words;
}

interface One {
  outcome: string;
  /** The links won, with what each paid. */
  links: Array<Pick<BattleResult, 'exp' | 'ap' | 'gil'> & { drops: Array<{ itemId: string; count: number }> }>;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

async function playChain(chapter: Chapter, seed: number): Promise<One> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  withVariant(engine);
  const one: One = { outcome: 'unresolved', links: [] };
  let link = 1;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      one.outcome = String(d.result.outcome);
      if (d.result.outcome === 'victory') one.links.push({ exp: d.result.exp, ap: d.result.ap, gil: d.result.gil, drops: d.result.drops.map((x) => ({ itemId: x.itemId, count: x.count })) });
      if (one.outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      withVariant(engine);
      continue;
    }
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return one;
}

interface Row {
  chapter: string;
  seeds: number;
  firstSeed: number;
  perSeed: string;
  wins: number;
  /** Summed over the WON chains (every link of a won chain), the way the results screen sums a chain. Sums, so split runs merge exactly. */
  total: { exp: number; ap: number; gil: number; items: number };
  /** Items by id: the count over the won chains, and the number of won chains that paid at least one. */
  items: Record<string, { count: number; chains: number }>;
  /** The most AP a single link paid (the per-battle cap of the game is 99). */
  maxLinkAp: number;
  /** Per link, summed over the won chains that reached it. */
  perLink: Array<{ link: number; won: number; exp: number; ap: number; gil: number; items: number }>;
  seconds: number;
}

describe.skipIf(!MEASURE)('RE parity, FFX-2 kill rewards: what each won chain paid (PYREFLY_MEASURE=1)', () => {
  it('measures EXP, AP, gil and items over the whole chain of each chapter', async () => {
    await registerBattleContent();
    const rows: Row[] = [];
    for (const chapter of [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2' && (ONLY ? ONLY.includes(c.id) : CHAPTERS.includes(c)))) {
      const started = Date.now();
      const runs: One[] = [];
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await playChain(chapter, seed));
      const won = runs.filter((r) => r.outcome === 'victory');
      const total = { exp: 0, ap: 0, gil: 0, items: 0 };
      const items: Row['items'] = {};
      const perLink = new Map<number, { won: number; exp: number; ap: number; gil: number; items: number }>();
      let maxLinkAp = 0;
      for (const run of won) {
        const seen = new Set<string>();
        run.links.forEach((l, i) => {
          const pl = perLink.get(i + 1) ?? { won: 0, exp: 0, ap: 0, gil: 0, items: 0 };
          pl.won += 1;
          pl.exp += l.exp;
          pl.ap += l.ap;
          pl.gil += l.gil;
          total.exp += l.exp;
          total.ap += l.ap;
          total.gil += l.gil;
          maxLinkAp = Math.max(maxLinkAp, l.ap);
          for (const drop of l.drops) {
            const it = (items[drop.itemId] ??= { count: 0, chains: 0 });
            it.count += drop.count;
            total.items += drop.count;
            pl.items += drop.count;
            if (!seen.has(drop.itemId)) {
              seen.add(drop.itemId);
              it.chains += 1;
            }
          }
          perLink.set(i + 1, pl);
        });
      }
      rows.push({
        chapter: chapter.id,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        wins: won.length,
        total,
        items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => a.localeCompare(b))),
        maxLinkAp,
        perLink: [...perLink.entries()].sort(([a], [b]) => a - b).map(([link, v]) => ({ link, ...v })),
        seconds: Math.round((Date.now() - started) / 1000),
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 6_000_000);
});
