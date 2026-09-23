/**
 * **The §4.5 trap on the card and in the guide** — Chapter VIII end-to-end
 * finding F1 (commit 7119762f, evidence `win-23-no-row-for-defend-kimahri`):
 * late in the fight, ship FAR, breath charged, the guide told Kimahri to
 * Defend (FFX's window has no Defend row) and the card put "Lancet -> Evrae"
 * on top, the very press research/ffx-evrae-airship.md §4.5 warns makes Evrae
 * Swoop in and breathe anyway.
 *
 * Run on the engine, seeds 1-5, the card's top row pressed every turn. Those
 * seeds rarely meet the board on their own (seed 6 of the card-follower does,
 * which is the board win-23 shows), so every real decision is also asked the
 * question with the breath charged and the ship FAR written onto its flags:
 * the same party, bench, items and boss, the §4.5 board.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the airship mechanic has no X-2
 * counterpart (§0.4).
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { pressable } from '../../../src/engine/tactics/advisor-menu.ts';
import { baitsTheBreath, holdingForTheBreath } from '../../../src/engine/tactics/airship-orders.ts';
import { recommendedCommand } from '../../../src/engine/tactics/guide.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

function newEngine(seed: number): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx', party: fahrenheitBuild, enemies: ENEMY_GROUPS_BY_ID['evrae-airship']!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  return engine;
}

const names = (c: Command | null | undefined): boolean =>
  ((c?.targets ?? []) as readonly string[]).includes('evrae');

describe('Evrae: a charged breath at FAR is never answered by naming Evrae (§4.5, e2e F1)', () => {
  it('seeds 1-5, following the card: no card row and no guide NEXT names Evrae, and the card tops the line', () => {
    let held = 0;
    let asked = 0;
    const bad: string[] = [];
    for (const seed of [1, 2, 3, 4, 5]) {
      clearAdvisorCache();
      const engine = newEngine(seed);
      for (let i = 0; i < 60_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const input = d as Input;
        const state = engine.state();
        const view = buildAdvisorView(state, { actorId: input.actorId, commands: input.commands }, { ffxContent: content, planner: true });
        const top = view?.suggestions[0]?.command ?? null;
        const board = holdingForTheBreath(state.flags)
          ? state
          : { ...state, flags: { ...state.flags, 'airship.range': 'far', 'airship.breathCharged': true } };
        {
          held += board === state ? 1 : 0;
          asked += 1;
          // The plan cache keys on HP and sequence, not flags: clear it around
          // the rewritten board so neither answer is the other's.
          if (board !== state) clearAdvisorCache();
          const card = board === state
            ? view
            : buildAdvisorView(board, { actorId: input.actorId, commands: input.commands }, { ffxContent: content, planner: true });
          const next = recommendedCommand(board, { actorId: input.actorId, commands: input.commands });
          const where = `seed ${seed} ${input.actorId}`;
          for (const s of card?.suggestions ?? []) if (names(s.command)) bad.push(`${where}: card ${s.label}`);
          if (names(next)) bad.push(`${where}: guide names Evrae`);
          if (!next || !pressable(board, next)) bad.push(`${where}: guide NEXT ${next?.kind ?? 'none'} is not on the FFX window`);
          if (board !== state) clearAdvisorCache();
          if (card?.suggestions[0]?.source !== 'tactic') bad.push(`${where}: card top is not the line (${card?.suggestions[0]?.label})`);
        }
        engine.submit(top ?? { kind: 'defend', targets: [] });
      }
    }
    expect(bad).toEqual([]);
    expect(asked).toBeGreaterThan(100);
    void held;
  }, 300_000);

  it('seed 6, following the card, meets the real board and answers it with the line', () => {
    clearAdvisorCache();
    const engine = newEngine(6);
    let held = 0;
    const bad: string[] = [];
    for (let i = 0; i < 60_000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const state = engine.state();
      const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, { ffxContent: content, planner: true });
      if (holdingForTheBreath(state.flags)) {
        held += 1;
        for (const s of view?.suggestions ?? []) if (names(s.command)) bad.push(`${d.actorId}: ${s.label}`);
        if (view?.suggestions[0]?.source !== 'tactic') bad.push(`${d.actorId}: top ${view?.suggestions[0]?.label}`);
      }
      engine.submit(view?.suggestions[0]?.command ?? { kind: 'defend', targets: [] });
    }
    expect(bad).toEqual([]);
    expect(held).toBeGreaterThan(0);
  }, 120_000);

  it('the gate is inert off the airship board and at NEAR', () => {
    const lancet = { kind: 'ability', id: 'lancet', targets: ['evrae'] } as unknown as Command;
    expect(baitsTheBreath({ 'airship.range': 'far', 'airship.breathCharged': true }, lancet)).toBe(true);
    expect(baitsTheBreath({ 'airship.range': 'near', 'airship.breathCharged': true }, lancet)).toBe(false);
    expect(baitsTheBreath({ 'airship.range': 'far', 'airship.breathCharged': false }, lancet)).toBe(false);
    expect(baitsTheBreath({}, lancet)).toBe(false);
  });
});
