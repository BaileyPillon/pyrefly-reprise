/**
 * **RE-parity measurement, FFX-2 kill rewards** (re-parity RC9, lane X2-C; **FFX-2 only**).
 *
 * For every FFX-2 chapter, the SHIPPED `intendedStrategy` plays the chapter through the app's own path (as `ffx2-parity-measure.test.ts`
 * does) on a range of seeds, and this file adds up what each WON chain paid on its results screen: the EXP, the AP (per dressphere),
 * the gil, and the items by id, summed over the links the way `chainSpoils` does. It also counts how many items were dropped, how many
 * seeds dropped each item at least once, and the draws taken on the two shared streams (10 and 11) when the build has a tap.
 * **Measure, never tune**: nothing here changes a boss or a party number.
 *
 * `PYREFLY_X2C_VARIANT=hunter` plays the same chapters with all three girls in the Thief dressphere with Item Hunter learned (the one
 * reward ability a shipped dressphere teaches), so the drop threshold's `+64` per owner can be measured.
 *
 * Runs only with `PYREFLY_MEASURE=1`. `PYREFLY_MEASURE_SEEDS=<n>` plays seeds 1 to n (default 12) and `<a>-<b>` plays seeds a to b,
 * `PYREFLY_MEASURE_CHAPTERS=<id,id>` narrows the run, `PYREFLY_MEASURE_OUT=<file>` writes the rows as JSON. The same file runs on
 * the base commit (before) and on the branch (after): it reads only `BattleResult` fields that both have.
 *
 * Game case: **FFX-2 only**.
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleResult, BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2MemberBuild } from '../../src/battle/common/types.ts';
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

/** The Thief's ladder up to Item Hunter (a shipped dressphere's one reward ability). */
const HUNTER = ['x2-thief-item-hunter'];

function dressed(m: FFX2MemberBuild, sphere: string, learned: string[]): FFX2MemberBuild {
  return {
    ...m,
    currentDressphere: sphere,
    owned: [...new Set([sphere, ...m.owned])],
    abilitiesLearned: { ...m.abilitiesLearned, [sphere]: { learned: [...learned], ap: 0 } },
  };
}

/** The variant's loadout laid on a chapter's opening party. */
function withVariant(setup: BattleSetup): BattleSetup {
  if (VARIANT === 'none' || setup.party.game !== 'ffx2') return setup;
  const [a, b, c] = setup.party.members;
  if (a === undefined || b === undefined || c === undefined) return setup;
  const members: [FFX2MemberBuild, FFX2MemberBuild, FFX2MemberBuild] = [dressed(a, 'thief', HUNTER), dressed(b, 'thief', HUNTER), dressed(c, 'thief', HUNTER)];
  return { ...setup, party: { ...setup.party, members } };
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
  let setup: BattleSetup = withVariant(setupForChapter(chapter, seed));
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
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
