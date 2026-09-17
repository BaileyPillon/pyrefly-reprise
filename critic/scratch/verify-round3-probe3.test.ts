import { describe, it } from 'vitest';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
describe('probe3', () => {
  it('raw seed42 1110-1140', () => {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({ game: 'ffx', party: zanarkandBuild, enemies: ENEMY_GROUPS_BY_ID['yunalesca'], triggers: [], seed: 42, condition: 'normal', canEscape: false });
    for (let i = 0; i < 30000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
        engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? { kind: 'attack', targets: row?.validTargets[0] ? [row.validTargets[0]] : [] });
      }
    }
    const log = engine.state().log;
    for (let j = 1108; j <= 1140; j++) console.log(`[${j}] ${JSON.stringify(log[j])}`);
  });
});
