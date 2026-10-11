/**
 * Chapter X, **the whole game path under each line** (`PYREFLY_CHX_SWITCH=1`; about 100 s a line, so it is not in the default suite).
 * **Game case: FFX only** [AGENTS.md rule 14]. `natus-line-switch.test.ts` proves each line's tactic, guide text and behaviour on
 * the engine in a few seconds; this file proves the one-constant claim itself: the module graph is reloaded with
 * `NATUS_LINE` (`src/data/guides/natus-line.ts`) replaced by each id, so the registered tactic (`intendedStrategy`, the auto-battle),
 * the strategy guide's NEXT line (`buildGuideView`), the move advisor's card (`buildAdvisorView`) and the pause tip are the ones a
 * single edit to that constant would give. It pins that they follow the line, and **counts** (never pins) how often the advisor's
 * top card is the line's pick, which the handoff reports: the advisor's planner may prefer a row of its own.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Command } from '../../../src/battle/common/types.ts';
import { NATUS_LINE_IDS, type NatusLineId } from '../../../src/data/guides/natus-line.ts';

const ON = process.env['PYREFLY_CHX_SWITCH'] === '1';
const SEEDS = [1, 2];
const NATUS = 'seymour-natus';

/**
 * The line the mocked `NATUS_LINE` reads. The mock's factory runs once per file (a second `doMock` of the same path kept the first
 * id's module, which made every line after the first play the first line's tactic), so the property is a getter over this variable:
 * each `run` sets it, resets the module graph, and every module that reads `NATUS_LINE` as it loads sees that run's id.
 */
const current = vi.hoisted(() => ({ id: 'shipped' }));

vi.mock('../../../src/data/guides/natus-line.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/data/guides/natus-line.ts')>();
  return {
    ...actual,
    get NATUS_LINE() {
      return current.id;
    },
  };
});

async function run(id: NatusLineId) {
  current.id = id;
  vi.resetModules();
  const [{ FFXContentRegistry, createFFXEngine }, data, { highbridgeBuild }, strat, tactics, guideMod, advisorMod, lineMod, guides, textMod, metaMod] = await Promise.all([
    import('../../../src/battle/ffx/index.ts'),
    import('../../../src/data/ffx/index.ts'),
    import('../../../src/data/ffx/builds/highbridge.ts'),
    import('../../../src/engine/BattlePresenterStrategies.ts'),
    import('../../../src/engine/tactics/seymour-natus.ts'),
    import('../../../src/engine/tactics/guide.ts'),
    import('../../../src/engine/tactics/advisor.ts'),
    import('../../../src/data/guides/seymour-natus.ts'),
    import('../../../src/data/guides/index.ts'),
    import('../../../src/data/guides/natus-line-text.ts'),
    import('../../../src/data/chapter-meta-natus.ts'),
  ]);
  const content = new FFXContentRegistry();
  content.addAbilities(data.ALL_ABILITIES);
  content.addItems(Object.values(data.ITEMS));
  const lineTactic = tactics.makeSeymourNatus(id);
  const same = (a: Command | null, b: Command | null): boolean => JSON.stringify(a) === JSON.stringify(b);
  let decisions = 0;
  let tacticMatches = 0;
  let nextAgrees = 0;
  let nextSeen = 0;
  let cards = 0;
  let topIsPick = 0;
  for (const seed of SEEDS) {
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({ game: 'ffx', party: highbridgeBuild, enemies: data.ENEMY_GROUPS_BY_ID[NATUS]!, triggers: [], seed, condition: 'normal', canEscape: false });
    for (let i = 0; i < 20_000; i += 1) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      decisions += 1;
      const pick = strat.intendedStrategy(d.actorId, d.commands, engine as never) ?? { kind: 'defend', targets: [] };
      if (same(pick, lineTactic(d.actorId, d.commands, engine))) tacticMatches += 1;
      const state = engine.state();
      const view = guideMod.buildGuideView(state, { actorId: d.actorId, commands: d.commands });
      if (view?.next) {
        nextSeen += 1;
        if (same(view.next.command, pick)) nextAgrees += 1;
      }
      if (decisions % 12 === 0) {
        const card = advisorMod.buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, { ffxContent: content });
        if (card && card.suggestions.length > 0) {
          cards += 1;
          if (same(card.suggestions[0]!.command, pick)) topIsPick += 1;
        }
      }
      engine.submit(pick);
    }
  }
  return {
    decisions, tacticMatches, nextSeen, nextAgrees, cards, topIsPick,
    guideIsLine: JSON.stringify(guides.guideForChapter('seymour-natus')) === JSON.stringify(lineMod.natusGuideFor(id)),
    tip: metaMod.NATUS_META.tip,
    lineTip: textMod.NATUS_LINE_TEXT[id].tip,
  };
}

describe.skipIf(!ON)('Chapter X: the whole game path follows NATUS_LINE (PYREFLY_CHX_SWITCH=1)', () => {
  for (const id of NATUS_LINE_IDS) {
    it(`${id}: the registered tactic, the guide's NEXT line, the advisor and the pause tip`, async () => {
      const r = await run(id);
      console.log(`[natus line ${id}] menus ${r.decisions}, guide NEXT agrees ${r.nextAgrees}/${r.nextSeen}, advisor top card is the pick ${r.topIsPick}/${r.cards}`);
      expect(r.decisions).toBeGreaterThan(50);
      expect(r.tacticMatches).toBe(r.decisions);
      expect(r.guideIsLine).toBe(true);
      expect(r.nextAgrees).toBe(r.nextSeen);
      expect(r.cards).toBeGreaterThan(2);
      if (r.lineTip !== undefined) expect(r.tip).toBe(r.lineTip);
      else expect(r.tip).toMatch(/Haste only Tidus and Auron/);
    }, 900_000);
  }
});
