/**
 * Evrae's two orders to Cid read as orders, not as moves aimed at a person
 * (critic round 13 PR-0162 and PR-0163).
 *
 * Before: the guide filled `{actor}` into a possessive ("Cid pulls the Tidus's
 * ship out of reach"), and both panels printed "Pull back → Tidus" because the
 * trigger row is aimed at its own actor so the engine has an id to resolve. An
 * order moves the ship; it has no target the player picks.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the airship orders are an FFX
 * Trigger Command with no X-2 counterpart (research/ffx-evrae-airship.md §0.4).
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { fahrenheitBuild } from '../../src/data/ffx/builds/fahrenheit.ts';
import { EVRAE_GUIDE } from '../../src/data/guides/evrae.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { targetLabel } from '../../src/engine/tactics/targetLabel.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';

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

function firstInput(engine: BattleEngine): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no player input');
}

function orderRow(d: Input, id: string): AvailableCommand | undefined {
  return d.commands.find((r) => r.command.kind === 'trigger' && r.command.id === id);
}

describe('Evrae orders copy (PR-0162, PR-0163)', () => {
  it('the Pull back hint names no actor in a possessive, for every actor', () => {
    const hint = EVRAE_GUIDE.hints.find((h) => h.when.labels?.includes('Pull back'));
    expect(hint).toBeDefined();
    for (const actor of ['Tidus', 'Rikku', 'Yuna', 'Wakka', 'Lulu', 'Auron', 'Kimahri']) {
      const text = hint!.text.replaceAll('{actor}', actor).replaceAll('{target}', actor);
      expect(text).not.toMatch(/the \w+'s ship/);
      expect(text).not.toContain(actor);
      expect(text.startsWith('Cid pulls the ship out of reach')).toBe(true);
    }
  });

  it('a self-aimed order prints no target in either panel', () => {
    const engine = newEngine(1);
    const d = firstInput(engine);
    for (const id of ['pull-back', 'close-in']) {
      const row = orderRow(d, id);
      expect(row, id).toBeDefined();
      const aimed = { ...row!.command, targets: [d.actorId] } as Command;
      const actorName = engine.state().combatants[d.actorId]!.name;
      expect(targetLabel('ffx', aimed, actorName)).toBeNull();
    }
  });

  it('the guide NEXT line and the advisor card for an order carry no target name', () => {
    for (const seed of [1, 2, 3]) {
      clearAdvisorCache();
      const engine = newEngine(seed);
      for (let i = 0; i < 600; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
        if (view?.next?.command.kind === 'trigger') expect(view.next.targetName, `seed ${seed} guide`).toBeNull();
        const adv = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ffxContent: content, planner: true });
        for (const s of adv?.suggestions ?? []) {
          if (s.command.kind === 'trigger') expect(s.targetName, `seed ${seed} advisor ${s.label}`).toBeNull();
        }
        engine.submit(view?.next?.command ?? { kind: 'defend', targets: [] });
      }
    }
  });
});
