/**
 * The hidden Penance chapter's machinery is absent from every other battle (FFX only; the plan's "absence for all of them"), and the chapter's own battle is deterministic. The pieces that are shared plumbing, all inert
 * elsewhere: the `onDeath` hook (only Penance's script and the two arms' register one), the `EquipmentDef.weaponRow` field (only the Penance party carries it), the opening call `applyPenanceSetup` (it reads the group's id), and
 * the scene, door and registry rows. For every other formation in the data layer: no `pen.*` flag, no armed part revival, no Penance script, and the same opening decisions.
 *
 * The three golden suites (`ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`) are the whole-chain byte-identity proof for the other chapters; this file is the cheap form of it that names the Penance rows.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { registeredAiScriptIds } from '../../../src/battle/ffx/ai/index.ts';
import { registeredHookScriptIds } from '../../../src/battle/ffx/ai/hooks.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { PENANCE, RIGHT_ARM, actionList, actor, defend, log, newEngine, nextInput, swing } from '../helpers/penanceDrive.ts';
import { ctxOf } from '../helpers/penanceDrive.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const others = Object.entries(ENEMY_GROUPS_BY_ID).filter(([id]) => id !== 'penance');

describe('no other formation gets Penance\'s machinery', () => {
  it('there are other formations to look at, and none of them contains a Penance combatant or script', () => {
    expect(others.length).toBeGreaterThan(30);
    for (const [id, group] of others) {
      for (const enemy of group.enemies) {
        expect(enemy.id.startsWith('penance'), `${id}: ${enemy.id}`).toBe(false);
        expect(enemy.aiScriptId.startsWith('penance'), `${id}: ${enemy.aiScriptId}`).toBe(false);
      }
    }
  });

  it('each plays its opening decisions with no pen.* flag, no armed part revival, no Penance action and no form change it did not have before', () => {
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
      const state = engine.state();
      expect(Object.keys(state.flags).filter((k) => k.startsWith('pen.')), `${id}: pen flags`).toEqual([]);
      expect(ctxOf(engine).rt.pendingPartRevivals.filter((p) => p.id.startsWith('penance')), id).toEqual([]);
      expect((state.log as readonly BattleEvent[]).some((e) => e.type === 'action-start' && e.abilityId?.startsWith('penance-')), `${id}: a Penance action`).toBe(false);
    }
    expect(looked).toBeGreaterThan(30);
  });

  it('the only scripts with an onDeath hook are Penance\'s three: the registry knows exactly those ids for the chapter', () => {
    expect(registeredAiScriptIds().filter((id) => id.startsWith('penance'))).toEqual(['penance', 'penance-arm-left', 'penance-arm-right']);
    expect(registeredHookScriptIds().filter((id) => id.startsWith('penance')).sort()).toEqual(['penance', 'penance-arm-left', 'penance-arm-right']);
  });

  it('nothing outside the chapter carries a weapon row, and the contract field is optional (the other parties are exactly as they were)', () => {
    for (const m of zanarkandBuild.members) expect(Object.keys(m.equipment.weapon)).not.toContain('weaponRow');
  });
});

describe('the battle is deterministic and forks', () => {
  /** Play a fixed script: Tidus hits the Right Arm, the others defend, for `n` decisions. */
  function play(seed: number, n: number): string {
    const e = newEngine(seed);
    for (let i = 0; i < n; i++) {
      const d = nextInput(e);
      const c = d.actorId === 'tidus' ? swing(d, i % 2 === 0 ? RIGHT_ARM : PENANCE) : null;
      e.submit(c ?? defend());
    }
    return JSON.stringify([actionList(log(e)), actor(e, PENANCE).hp, actor(e, RIGHT_ARM).hp, e.state().ticks, e.state().flags]);
  }

  it('the same seed gives the same battle, entry for entry; another seed another one', () => {
    expect(play(21, 40)).toBe(play(21, 40));
    expect(play(21, 40)).not.toBe(play(22, 40));
  });

  it('a structured clone of the state carries the phase, the counter and the armed return, so a fork can go on', () => {
    const e = newEngine(23);
    actor(e, PENANCE).hp = 8_900_000 + 99_999;
    for (let i = 0; i < 40; i++) {
      const d = nextInput(e);
      const c = d.actorId === 'tidus' ? swing(d, PENANCE) : null;
      if (c) {
        e.submit(c);
        break;
      }
      e.submit(defend());
    }
    const copy = structuredClone(e.state());
    expect(copy.flags['pen.phase']).toBe(1);
    expect(typeof copy.flags['pen.counter']).toBe('number');
  });
});
