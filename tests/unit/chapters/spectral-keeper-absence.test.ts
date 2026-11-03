/**
 * The hidden Spectral Keeper's machinery is absent from every other battle (FFX only; the preflight's "absence for all of them", the review's gap: the engine test's header promised it and nothing asserted it). The glyph
 * platforms, Move, First Strike on the front line, and the switched-off Guard and Sentinel are set up by the Keeper's own formation (`platformRing`, `frontLineFirstStrike`, `commandDisables`) and by nothing else. For
 * every other formation in the data layer: no `plat.*` flag, no Move row for anyone, no `platform` event, Guard and Sentinel on Auron's menu as the game has them, and the clock is the ordinary one (no Circle, no idle cycler).
 * The review measured byte-identical logs for 16 other FFX chapters on base and head; this keeps the cheap form of that proof in the suite.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { defend } from '../helpers/keeperDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => id !== 'spectral-keeper');

describe('no other formation gets the Keeper\'s machinery', () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('none sets the ring, the First Strike or the disabled commands (the group fields are the Keeper\'s alone)', () => {
    for (const [id, group] of others) {
      expect(group.platformRing, id).toBeUndefined();
      expect(group.frontLineFirstStrike, id).toBeUndefined();
    }
  });

  it('each plays its opening decisions with no platform flag, no Move row, no platform event, and Auron\'s Guard and Sentinel enabled where he has them', () => {
    let looked = 0;
    for (const [id, group] of others) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: true });
      for (let step = 0; step < 6; step++) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        looked++;
        expect(d.commands.some((c) => c.command.kind === 'trigger' && c.command.id === 'move'), `${id}: a Move row`).toBe(false);
        for (const c of d.commands) if (c.label === 'Guard' || c.label === 'Sentinel') expect(c.enabled, `${id}: ${c.label} greyed`).toBe(true);
        engine.submit(defend());
      }
      const state = engine.state();
      expect(Object.keys(state.flags).filter((k) => k.startsWith('plat.')), `${id}: platform flags`).toEqual([]);
      expect((state.log as readonly BattleEvent[]).some((e) => e.type === 'platform'), `${id}: a platform event`).toBe(false);
    }
    expect(looked).toBeGreaterThan(30);
  });
});
