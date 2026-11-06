/**
 * The hidden Sanctuary Keeper's machinery is absent from every other battle (FFX only; the preflight's "absence for all of them"). The script, its `sk.*` flags and its state are set up by the Keeper's own formation and
 * script id and by nothing else. For every other formation in the data layer: no `sk.*` flag after the opening decisions, no group using the script, and no other enemy named like it. The Spectral Keeper (chapter 29) is
 * a different monster: its flags and script are untouched. The full unit suite is the proof that every other chapter's log is unchanged; this keeps the cheap form of that proof in the suite. FFX-2 and FF7 have no part in it.
 */

import { describe, expect, it } from 'vitest';
import type { Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { registeredHookScriptIds } from '../../../src/battle/ffx/ai/hooks.ts';
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { defend } from '../helpers/sanctuaryDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => id !== 'sanctuary-keeper');

describe('no other formation gets the Sanctuary Keeper\'s script', () => {
  it('there are other formations to look at', () => {
    expect(others.length).toBeGreaterThan(30);
  });

  it('the script id is registered once, with hooks, and only this formation\'s Keeper names it', () => {
    expect(registeredAiScriptIds()).toContain('sanctuary-keeper');
    expect(registeredHookScriptIds()).toContain('sanctuary-keeper');
    for (const [id, group] of others) {
      for (const e of group.enemies) {
        expect(e.aiScriptId, `${id}: ${e.id}`).not.toBe('sanctuary-keeper');
        for (const f of e.forms) expect(f.aiScriptId, `${id}: ${e.id} form`).not.toBe('sanctuary-keeper');
      }
    }
  });

  it('the Spectral Keeper (chapter 29) keeps its own script and flags: they are another monster\'s', () => {
    const spectral = ENEMY_GROUPS_BY_ID['spectral-keeper']!;
    expect(spectral.enemies[0]!.aiScriptId).toBe('spectral-keeper');
    expect(spectral.enemies.map((e) => e.id)).not.toContain('sanctuary-keeper');
  });

  it('each plays its opening decisions with no sk.* flag set', () => {
    let looked = 0;
    for (const [id, group] of others) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: true });
      for (let step = 0; step < 6; step++) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        looked++;
        engine.submit(defend());
      }
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('sk.')), `${id}: sk flags`).toEqual([]);
    }
    expect(looked).toBeGreaterThan(30);
  });
});
