/**
 * PR-0198 (critic round 13): **the FFX advisor never aims an HP restorative at
 * a living Zombie.**
 *
 * Live on b975397b, Chapter III: Braska's Final Aeon's Triumphant Grasp put
 * Zombie on Yuna, her MP fell under the tactic's refill floor, and the card
 * said "Elixir → Yuna, in Items". The Elixir dealt her 5,130 and KO'd her, in
 * 2 of the 4 real-key losses. The engine probe found the same shape in
 * Chapters I and II: a Potion on a Zombie Tidus at Yunalesca, an Al Bhed
 * Potion on a Zombie Tidus at Seymour Flux, each topping the card because
 * "damage to your own side" still counted as "does something" once the
 * chapter's own line (Defend) was judged inert.
 *
 * Two halves, both asserted here:
 *
 *  * **the tactic** (`braskas-final-aeon.ts` `supportTurn`) refills a Zombie
 *    Yuna with Ether or Turbo Ether only, and cures the Zombie when the Elixir
 *    is all that is left;
 *  * **the card** (`advisor-guard.ts` `harmsAZombie`) puts any row whose
 *    preview damages or KOs a living Zombie ally behind every row that does
 *    not, whichever chapter's line or ranking produced it — so the fix holds
 *    for every FFX tactic, not only Chapter III's.
 *
 * Game case: **FFX only.** Zombie (healing is damage) is FFX's status
 * [research/ffx-combat-core.md]; FFX-2's data layer defines no `zombie`, so the
 * shared guard can never fire there.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleState,
  Command,
  CombatantId,
  Decision,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { simulateFFXCommand } from '../../src/battle/ffx/simulate.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

function engineFor(chapterId: string, seed: number) {
  const chapter = getChapter(chapterId)!;
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party: chapter.buildRef,
    enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return engine;
}

const ZOMBIE = {
  id: 'zombie',
  turnsRemaining: null,
  ticksRemaining: null,
  charges: null,
  stacks: 0,
  permanent: false,
} as const;

const CURES = ['Holy Water', 'Remedy', 'Esuna'];

/** Yuna's first decision of Chapter III, on a cloned board: Zombie, MP under two Curagas. */
function zombieYunaBoard(): { state: BattleState; decision: Input } {
  const engine = engineFor('braskas-final-aeon', 1);
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'yuna') {
      const state = JSON.parse(JSON.stringify(engine.state())) as BattleState;
      const yuna = state.combatants['yuna']!;
      yuna.statuses['zombie'] = { ...ZOMBIE };
      yuna.mp = 20;
      // The live board: both runs had spent the Holy Waters and Remedies by
      // then, so the tactic's own Zombie cure (`repair`) had nothing to press.
      const commands = d.commands.filter((c) => !CURES.includes(c.label));
      return { state, decision: { ...d, commands } };
    }
    const cmd = recommendedCommand(engine.state(), d);
    engine.submit(cmd ?? ({ kind: 'defend', targets: [] } as Command));
  }
  throw new Error('Yuna never got a turn');
}

const labelOf = (commands: readonly AvailableCommand[], c: Command | null | undefined): string => {
  if (!c) return '';
  const id = 'id' in c ? String((c as { id?: unknown }).id) : '';
  return commands.find((r) => r.command.kind === c.kind && 'id' in r.command && String(r.command.id) === id)?.label ?? c.kind;
};

/** Does this command, previewed on this board, hurt a living Zombie on the party's side? */
function hurtsAZombie(state: BattleState, actorId: CombatantId, command: Command): boolean {
  const out = simulateFFXCommand(state, actorId, command, { roll: 'mid', content });
  if (!out) return false;
  for (const [id, delta] of Object.entries(out.hpDelta)) {
    const c = state.combatants[id];
    if (c && c.side === 'party' && c.alive && c.statuses['zombie'] && delta > 0) return true;
  }
  return out.kills.some((id) => state.combatants[id]?.side === 'party');
}

describe('PR-0198: Chapter III, a Zombie Yuna under the MP floor', () => {
  it('the board is the live one: Elixir, Ether and Turbo Ether are all on her menu', () => {
    const { decision } = zombieYunaBoard();
    for (const name of ['Elixir', 'Ether', 'Turbo Ether']) {
      expect(decision.commands.some((c) => c.enabled && c.label === name), name).toBe(true);
    }
  });

  it('the tactic refills with an Ether, never the Elixir', () => {
    const { state, decision } = zombieYunaBoard();
    const pick = recommendedCommand(state, decision);
    expect(labelOf(decision.commands, pick)).not.toBe('Elixir');
    expect(pick && hurtsAZombie(state, 'yuna', pick)).toBeFalsy();
  });

  it('the card tops with Ether, Turbo Ether or a cure, never the Elixir', () => {
    clearAdvisorCache();
    const { state, decision } = zombieYunaBoard();
    const top = buildAdvisorView(state, decision, { ffxContent: content, planner: true })?.suggestions[0];
    expect(top).toBeTruthy();
    expect(top!.label).not.toBe('Elixir');
    expect(hurtsAZombie(state, 'yuna', top!.command)).toBe(false);
  });

  it('with only the Elixir left, neither the tactic nor the card offers it', () => {
    clearAdvisorCache();
    const { state, decision } = zombieYunaBoard();
    const commands = decision.commands.filter((c) => c.label !== 'Ether' && c.label !== 'Turbo Ether');
    const only = { ...decision, commands };
    const pick = recommendedCommand(state, only);
    expect(labelOf(commands, pick)).not.toBe('Elixir');
    const top = buildAdvisorView(state, only, { ffxContent: content, planner: true })?.suggestions[0];
    expect(top?.label).not.toBe('Elixir');
    expect(top && hurtsAZombie(state, 'yuna', top.command)).toBeFalsy();
  });
});

/**
 * The engine repros from the round-13 combat audit, where the card's own
 * ranking (not a tactic) put a restorative on a Zombie: the chapter's line was
 * Defend, judged inert, and the self-inflicted damage counted as "useful".
 */
describe('PR-0198: no FFX card tops with a restorative on a living Zombie', () => {
  const cases: Array<[string, number, number]> = [
    ['yunalesca', 186798638, 240],
    ['yunalesca', 692159646, 200],
    ['seymour-flux', 1761425604, 30],
  ];
  for (const [chapterId, seed, lastTurn] of cases) {
    it(`${chapterId} seed ${seed}, following the card`, () => {
      clearAdvisorCache();
      const engine = engineFor(chapterId, seed);
      const hits: string[] = [];
      for (let i = 0; i < 20_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const state = engine.state() as BattleState;
        if (state.turn > lastTurn) break;
        const top = buildAdvisorView(state, d, { ffxContent: content, planner: true })?.suggestions[0];
        if (top && hurtsAZombie(state, d.actorId, top.command)) {
          hits.push(`turn ${state.turn} ${d.actorId}: ${top.label} -> ${top.targetId}`);
        }
        const r = d.commands.find((c) => c.enabled && c.validTargets.length > 0)!;
        engine.submit(top?.command ?? ({ ...r.command, targets: [r.validTargets[0]!] } as Command));
      }
      expect(hits).toEqual([]);
    }, 60_000);
  }
});
