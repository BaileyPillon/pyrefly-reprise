/**
 * **One hit runner, both AI lanes' scripts on it** (release candidate 1; re-parity AI lane B and AI-Seymour; FFX only).
 *
 * The two lanes each built the game's `onHit` (once per action per target, after the last of the action's hit records on
 * the target and before the death check) and each wrote its bosses against its own copy. They merge into ONE runner,
 * `ai/hooks.ts#runOnHit`, called from `abilities.ts#finishTouched` over the tally `hit-apply.ts` keeps. The danger of a
 * textual merge was silent: `abilities.ts` merged without a conflict into a file whose second runner received the map the
 * first had just emptied, so one lane's scripts (lane B's five, Yunalesca to Yu Yevon) would never have run, and every
 * file and test of that lane could still have compiled and passed on its own.
 *
 * This file is what fails if that ever happens again, for either lane:
 *
 * 1. the registry holds the hooks of every script of both lanes;
 * 2. for EVERY shipped enemy whose script registered an `onHit` (found from the data, not from a list), one action that
 *    reaches it calls that hook exactly once, whichever lane wrote it;
 * 3. both registration APIs (`registerScriptHooks`, AI-Seymour's, and `registerHitScript`, lane B's `HitEvent` shape) are the
 *    same runner: two targets of one action, one on each, each hear it once, right after their own hits;
 * 4. through the whole engine turn (the action, the reaction queue and its drain), Yunalesca counters a physical blow and a
 *    Guado Guardian drinks its Auto-Potion, one boss from each lane.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXEngine, registerHitScript, registerScriptHooks, resolveAbility } from '../../src/battle/ffx/index.ts';
import { hooksOf, listensToHit, registeredHookScriptIds, scriptIdOf } from '../../src/battle/ffx/ai/hooks.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { exactHit } from './helpers/seymourParity.ts';
import { groupOf, liveBattle } from './helpers/aiScript.ts';

/** The scripts AI lane B registers (Chapters II and III). */
const LANE_B = [
  'yunalesca', 'yunalesca-form-1', 'yunalesca-form-2', 'yunalesca-form-3',
  'bfa-form-1', 'bfa-form-2', 'braskas-final-aeon',
  'yu-pagoda', 'yu-pagoda-bfa', 'yu-pagoda-aeon',
  'possessed-aeon',
  'yu-yevon',
];
/** The scripts AI-Seymour registers (Chapters I, VII, X and XII). */
const LANE_A = [
  'seymour-flux', 'mortiorchis',
  'seymour-macalania', 'guado-guardian-macalania', 'anima-macalania',
  'seymour-natus', 'mortibody',
  'seymour-omnis', 'mortiphasm',
];

/** A hundred points of damage that always land: it reaches the target and changes almost nothing. */
const poke = (id: string, targeting: AbilityDef['targeting'] = 'single-enemy'): AbilityDef => exactHit(id, 100, { targeting });

/** The shipped enemies whose script listens to `onHit`: [group id, enemy id, script id]. */
function hookedEnemies(): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  for (const [groupId, group] of Object.entries(ENEMY_GROUPS_BY_ID)) {
    for (const enemy of group.enemies) {
      const script = enemy.forms[0]?.aiScriptId ?? enemy.aiScriptId;
      if (script !== undefined && registeredHookScriptIds().includes(script)) out.push([groupId, enemy.id, script]);
    }
  }
  return out;
}

describe('the registry holds the hooks of both lanes', () => {
  it('lists every script of AI lane B (Chapters II and III)', () => {
    const ids = registeredHookScriptIds();
    for (const id of LANE_B) expect(ids, id).toContain(id);
  });

  it('lists every script of AI-Seymour (Chapters I, VII, X and XII)', () => {
    const ids = registeredHookScriptIds();
    for (const id of LANE_A) expect(ids, id).toContain(id);
  });
});

describe('the one runner calls the hook of every hooked enemy of the shipped data, exactly once per action', () => {
  const hooked = hookedEnemies();

  it('finds the enemies of both lanes in the data (so the table below is not empty for one of them)', () => {
    const scripts = new Set(hooked.map(([, , script]) => script));
    // The script id in force when the fight opens: a form's own id wins over the enemy's.
    for (const id of ['yunalesca-form-1', 'bfa-form-1', 'yu-pagoda-bfa', 'yu-pagoda-aeon', 'possessed-aeon', 'yu-yevon']) expect(scripts, `lane B: ${id}`).toContain(id);
    for (const id of ['seymour-flux', 'mortiorchis', 'guado-guardian-macalania', 'seymour-natus', 'seymour-omnis']) expect(scripts, `lane A: ${id}`).toContain(id);
  });

  for (const [groupId, enemyId, script] of hooked) {
    it(`${groupId} / ${enemyId} (${script}): one action that reaches it calls its onHit once`, () => {
      const live = liveBattle(groupId);
      const target = live.at(enemyId);
      // The probe is about the runner, not about whether the fight lets a party member reach this body now.
      delete target.flags.untargetable;
      delete target.flags.hidden;
      expect(listensToHit(target), 'the script listens to onHit').toBe(true);
      const hooks = hooksOf(target)!;
      const original = hooks.onHit!;
      let calls = 0;
      hooks.onHit = (...args) => {
        calls += 1;
        original(...args);
      };
      try {
        resolveAbility(live.ctx, live.at('tidus'), poke('rc1-poke'), [enemyId]);
      } finally {
        hooks.onHit = original;
      }
      expect(calls, 'one hit record, one event').toBe(1);
    });
  }
});

describe('both registration APIs are the one runner', () => {
  it('two enemies of one action, one registered with registerScriptHooks and one with registerHitScript, each hear it once, right after their own hits', () => {
    const order: string[] = [];
    registerScriptHooks('rc1-probe-seymour-shape', {
      onHit: (_ctx, self, used, report) => {
        order.push(`A:${self.id}:${used.def.id}:${report.lastDamage}:${report.affectsHp}`);
      },
    });
    registerHitScript('rc1-probe-lane-b-shape', (event) => {
      order.push(`B:${event.target.id}:${event.def.id}:${event.lastDamage}:${event.affectsHp}:${event.attacker.id}`);
    });
    const group = groupOf('braskas-final-aeon');
    const [left, right] = [group.enemies.find((e) => e.id === 'yu-pagoda-left')!, group.enemies.find((e) => e.id === 'yu-pagoda-right')!];
    left.forms = [{ ...left.forms[0]!, aiScriptId: 'rc1-probe-seymour-shape' }];
    left.aiScriptId = 'rc1-probe-seymour-shape';
    right.forms = [{ ...right.forms[0]!, aiScriptId: 'rc1-probe-lane-b-shape' }];
    right.aiScriptId = 'rc1-probe-lane-b-shape';
    const live = liveBattle('braskas-final-aeon', { group });
    resolveAbility(live.ctx, live.at('tidus'), poke('rc1-sweep', 'all-enemies'), ['braskas-final-aeon']);
    expect(order.filter((o) => o.includes('yu-pagoda'))).toEqual([
      'A:yu-pagoda-left:rc1-sweep:100:true',
      'B:yu-pagoda-right:rc1-sweep:100:true:tidus',
    ]);
  });

  it('the script id in force is the form’s own id when it has one, as the runner reads it', () => {
    const live = liveBattle('yunalesca');
    expect(scriptIdOf(live.at('yunalesca'))).toBe('yunalesca-form-1');
  });
});

describe('through a whole engine turn (the action, the reaction queue, its drain)', () => {
  /** The first player decision's actor attacks `targetId`; the events that turn produced. */
  async function firstAttack(chapterId: string, targetId: string, seed = 1): Promise<BattleEvent[]> {
    await registerBattleContent();
    const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
    const setup = setupForChapter(chapter, seed);
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(setup.seed);
    engine.init(setup);
    for (let step = 0; step < 2_000; step++) {
      const d = engine.nextDecision();
      if (d.kind === 'resolved' || d.kind === 'waiting') continue;
      if (d.kind === 'battle-over') break;
      const from = engine.state().log.length;
      const state = engine.state();
      const target = state.combatants[targetId] as FFXCombatant | undefined;
      expect(target, `${targetId} is in the battle`).toBeDefined();
      engine.submit({ kind: 'attack', targets: [targetId] });
      engine.nextDecision();
      return engine.state().log.slice(from);
    }
    throw new Error('no player decision came');
  }

  it('Chapter II: Yunalesca answers the first physical blow with her Form I counter (AI lane B: hook, queue, drain)', async () => {
    const events = await firstAttack('yunalesca', 'yunalesca');
    const counters = events.filter((e) => e.type === 'counter' && e.actorId === 'yunalesca');
    expect(counters.map((e) => (e as { abilityId: string }).abilityId)).toEqual(['blind-counter']);
  });

  it('Chapter VII: a Guado Guardian drinks its Auto-Potion when the first blow lands on it (AI-Seymour: hook, queue, drain)', async () => {
    const events = await firstAttack('seymour-anima-macalania', 'guado-guardian-a');
    const counters = events.filter((e) => e.type === 'counter' && e.actorId === 'guado-guardian-a');
    expect(counters.map((e) => (e as { abilityId: string }).abilityId)).toEqual(['guardian-auto-potion']);
  });
});
