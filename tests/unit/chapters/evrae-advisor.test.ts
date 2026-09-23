/**
 * **The move-advisor card against Evrae** — the verifier's advisor finding on
 * the Chapter 8 integration (2026-09-23), pinned against the real engine.
 *
 * Following the card's top row every turn stalled the fight at the 400-turn
 * stalemate guard on four seeds in five. Three defects, each proved here by
 * running the engine rather than by reading the code [AGENTS.md hard rule 3]:
 *
 *  1. **The preview could not see Wakka's reach.** `simulate.ts#runtimeFor`
 *     rebuilt the engine runtime without the encounter's setup marks, so
 *     `ActorRuntime.rangedWeapon` was gone and Wakka's Attack at FAR previewed
 *     as `action-start, action-end` and nothing else. The no-op guard then
 *     (correctly, on what it was shown) buried the chapter's own line.
 *  2. **A buff at its stack cap was priced as possible.** `advisor-roll.ts`
 *     let every stacking buff through to its odds, but FFX's `applyStatus`
 *     refuses a sixth stack (and FFX-2's a stack past `STAT_STACK_MAX`), so
 *     Aim and Cheer on a capped party were recommended hundreds of times a
 *     fight.
 *  3. **The card recommended orders the widget refuses.** "Pull back" while
 *     already FAR (or already ordered FAR) is a row the order widget greys out
 *     as "Already far" / "Ordered": the player cannot press what the card says.
 *
 * **Game case: FFX only** for 1 and 3 (the airship mechanic has no X-2
 * counterpart, research/ffx-evrae-airship.md §0.4). 2 is shared advisor
 * plumbing ("both"), each game with its own cap; its X-2 half is asserted in
 * `tests/unit/advisor-stack-cap.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { simulateFFXCommand } from '../../../src/battle/ffx/simulate.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { airshipOrderRefusal } from '../../../src/engine/tactics/airship-orders.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

function newEngine(seed: number): BattleEngine {
  const group = ENEMY_GROUPS_BY_ID['evrae-airship'];
  if (!group) throw new Error('evrae-airship missing from the data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: fahrenheitBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function topRow(engine: BattleEngine, d: Input): Command | null {
  const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ffxContent: content, planner: true });
  return view?.suggestions[0]?.command ?? null;
}

/** The card's top row, pressed every turn and nothing else. */
function followTheCard(
  engine: BattleEngine,
  onDecision: (d: Input, top: Command | null) => void,
  maxSteps = 60_000,
): string {
  for (let i = 0; i < maxSteps; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return String((d as { result?: { outcome?: string } }).result?.outcome);
    if (d.kind !== 'player-input') continue;
    const top = topRow(engine, d);
    onDecision(d, top);
    engine.submit(top ?? { kind: 'defend', targets: [] });
  }
  return 'unresolved';
}

/** Walk the battle on the chapter's own line to Wakka's first turn with the ship FAR. */
function wakkaAtFar(engine: BattleEngine): Input {
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'wakka' && engine.state().flags['airship.range'] === 'far') return d;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
  }
  throw new Error('never reached a Wakka turn at FAR');
}

describe('Evrae: the preview sees the encounter the engine is running', () => {
  it("previews Wakka's Attack at FAR as damage, as the engine resolves it (research §4.3)", () => {
    const engine = newEngine(1);
    const d = wakkaAtFar(engine);
    const row = d.commands.find((c) => c.command.kind === 'attack');
    expect(row?.enabled).toBe(true);
    expect(row?.validTargets).toContain('evrae');
    const out = simulateFFXCommand(engine.state(), 'wakka', { kind: 'attack', targets: ['evrae'] }, { roll: 'mid', content });
    expect(out?.rejected ?? false).toBe(false);
    expect(out?.damageToEnemies ?? 0).toBeGreaterThan(0);
  });
});

describe('Evrae: the card never recommends a turn that does nothing', () => {
  it('never tops a stacking buff whose target is already at the five-stack cap', () => {
    clearAdvisorCache();
    const engine = newEngine(1);
    let capped = 0;
    followTheCard(
      engine,
      (_d, top) => {
        if (top?.kind !== 'ability' || (top.id !== 'aim' && top.id !== 'cheer')) return;
        const t = engine.state().combatants[(top.targets as readonly string[])[0] ?? ''];
        const stacks = (t?.statuses as Record<string, { stacks?: number } | undefined>)[top.id]?.stacks ?? 0;
        if (stacks >= 5) capped += 1;
      },
      4000,
    );
    expect(capped).toBe(0);
  });

  it('never tops an order the order widget greys out (Already near/far, Ordered)', () => {
    clearAdvisorCache();
    const engine = newEngine(2);
    const refused: string[] = [];
    followTheCard(
      engine,
      (_d, top) => {
        if (top?.kind !== 'trigger') return;
        const why = airshipOrderRefusal(engine.state().flags, top.id);
        if (why) refused.push(`${top.id}: ${why}`);
      },
      4000,
    );
    expect(refused).toEqual([]);
  });

  it("puts Wakka's Attack on top at FAR when the chapter's line swings (research §4.3, tactic rule 10)", () => {
    clearAdvisorCache();
    const engine = newEngine(1);
    let wakkaFar = 0;
    let wakkaAttack = 0;
    followTheCard(
      engine,
      (d, top) => {
        if (d.actorId !== 'wakka' || engine.state().flags['airship.range'] !== 'far') return;
        wakkaFar += 1;
        if (top?.kind === 'attack') wakkaAttack += 1;
      },
      4000,
    );
    expect(wakkaFar).toBeGreaterThan(0);
    expect(wakkaAttack).toBeGreaterThan(0);
  });
});

describe("Evrae: the order refusal is the widget's rule, stated once", () => {
  it('refuses the range the ship is already in, and the order already standing', () => {
    expect(airshipOrderRefusal({ 'airship.range': 'far', 'airship.order': '' }, 'pull-back')).toBe('Already far');
    expect(airshipOrderRefusal({ 'airship.range': 'near', 'airship.order': '' }, 'close-in')).toBe('Already near');
    expect(airshipOrderRefusal({ 'airship.range': 'near', 'airship.order': 'far' }, 'pull-back')).toBe('Ordered');
    expect(airshipOrderRefusal({ 'airship.range': 'far', 'airship.order': 'near' }, 'close-in')).toBe('Ordered');
    expect(airshipOrderRefusal({ 'airship.range': 'far', 'airship.order': '' }, 'close-in')).toBeNull();
    expect(airshipOrderRefusal({ 'airship.range': 'near', 'airship.order': '' }, 'pull-back')).toBeNull();
  });

  it('is silent in every battle without the airship flag (no other chapter changes)', () => {
    expect(airshipOrderRefusal({}, 'pull-back')).toBeNull();
    expect(airshipOrderRefusal({}, 'talk')).toBeNull();
  });
});

describe("Evrae: the card's top row, pressed every turn, finishes the fight", () => {
  it('does not stall: no seed in 1-5 runs to the stalemate guard', () => {
    const outcomes: string[] = [];
    for (const seed of [1, 2, 3, 4, 5]) {
      clearAdvisorCache();
      outcomes.push(followTheCard(newEngine(seed), () => {}));
    }
    expect(outcomes.filter((o) => o === 'escape' || o === 'unresolved')).toEqual([]);
  }, 300_000);
});
