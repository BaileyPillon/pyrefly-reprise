/**
 * **The fayth's permanent Auto-Life leaves no event gap at a KO** (re-parity RC6, FOC43-04; **FFX only**: only the FFX engine has the permanent flag).
 *
 * The 7b2582e7 focused review saw Tidus's Auto-Life icon in Chapter III's last link leave his row about 125 ms early after the Curse and stay off for
 * the length of the revive beat. Cause (traced with the engine): the KO reset (FFX-G02 section 3.1) wipes the extra word, Auto-Life included, and the
 * revive puts the permanent flag back inside the same call (sections 3.6 and 3.7). The engine emitted the wipe's `status-remove` (reason ko) and then
 * put the status back with no event at all, so anything that follows the event stream lost the icon with no `status-add` to bring it back.
 * Nothing sees the gap inside that one call, so the engine now leaves the permanent Auto-Life on the body through the wipe and says nothing about it;
 * a CAST Auto-Life is still removed, with its `status-remove` (consumed), because the game does not give that one back.
 *
 * Three things are pinned: the event sequence of a fayth holder's KO and of a cast holder's, hand-worked on the death rig; the stream and the board
 * agreeing about every member's Auto-Life through Chapter III's whole chain on real seeds (the stream is the only thing a presenter has); and that the
 * fayth really does revive there (so the second check bites).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { aimedAt, buildRun, probe, runAction, type Scenario, type TargetSpec } from './helpers/ffxEngineDeath.ts';

/** The target-level story of one KO: the damage hits, then what the wipe and the revive say, in order. */
function story(kind: 'fayth' | 'cast'): string[] {
  const t: TargetSpec = {
    id: 'ally0',
    side: 'party',
    aim: 'exact',
    aimHit: 2,
    margin: 0,
    statuses: { zombie: true, scan: false, poison: false, regen: false, haste: false, autoLife: kind },
    doubleHp: false,
    baseMax: 2000,
    thresholdMul: 1,
  };
  const s: Scenario = { seed: 4242, power: 25, hits: 4, kind: 'attack', zombifyBlow: false, targetsAreMonsters: false, targets: [t] };
  const run = buildRun(s, aimedAt(s, probe(s)));
  runAction(run);
  expect(run.targets[0]!.alive).toBe(true);
  expect(run.targets[0]!.statuses['auto-life'] !== undefined).toBe(kind === 'fayth');
  // Critical comes and goes with the HP in the middle of the hits; it is not part of this rule, so it stays out of the story.
  const own = run.events.filter((e) => e['targetId'] === 'ally0' && e['status'] !== 'critical');
  return own.map((e) => {
    const type = String(e['type']);
    if (type === 'status-add' || type === 'status-remove') return `${type}:${String(e['status'])}${e['reason'] ? `:${String(e['reason'])}` : ''}`;
    if (type === 'revive') return `revive:${String(e['cause'])}`;
    return type;
  });
}

describe('FOC43-04: the fayth\'s permanent Auto-Life at a KO (FFX only)', () => {
  it('a fayth holder: four hits, the Zombie wiped, the revive; Auto-Life has no event of its own and stays on the body', () => {
    expect(story('fayth')).toEqual([
      'damage', 'damage', 'damage', 'damage',
      'status-remove:zombie:ko',
      'revive:fayth',
    ]);
  });

  it('a cast holder: the same four hits, then the Auto-Life is spent with its event, the Zombie wiped, the revive', () => {
    expect(story('cast')).toEqual([
      'damage', 'damage', 'damage', 'damage',
      'status-remove:auto-life:consumed',
      'status-remove:zombie:ko',
      'revive:auto-life',
    ]);
  });
});

type Input = Extract<Decision, { kind: 'player-input' }>;
function fallback(d: Input): Command {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!r) return { kind: 'defend', targets: [] } as Command;
  const t = r.validTargets[0];
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

describe('FOC43-04: Chapter III, the whole chain: the event stream and the board agree about Auto-Life', () => {
  it('on 8 seeds, every member\'s Auto-Life read off the events equals the board after every action, and the fayth revives happen', async () => {
    await registerBattleContent();
    const chapter = CHAPTERS.find((c) => c.id === 'braskas-final-aeon')!;
    let faythRevives = 0;
    let linksChecked = 0;
    for (let seed = 1; seed <= 8; seed += 1) {
      let setup: BattleSetup = setupForChapter(chapter, seed);
      let group: EnemyGroupDef = chapter.enemyGroupRef;
      const engine = new FFXEngine({ autoResolveMinigames: true });
      engine.setSeed(setup.seed);
      engine.init(setup);
      let link = 1;
      for (let step = 0; step < 200_000; step += 1) {
        const startBoard = engine.state() as BattleState;
        // the stream starts from the board as the link opened (the presenter reads it the same way)
        const held = new Map<string, boolean>();
        for (const id of [...startBoard.activeIds, ...startBoard.reserveIds]) held.set(id, startBoard.combatants[id]?.statuses['auto-life'] !== undefined);
        let seen = startBoard.log.length;
        let over: Decision | undefined;
        for (let inner = 0; inner < 200_000; inner += 1) {
          const d = engine.nextDecision();
          const st = engine.state() as BattleState;
          for (; seen < st.log.length; seen += 1) {
            const e = st.log[seen]!;
            if (e.type === 'status-add' && e.status === 'auto-life' && held.has(e.targetId)) held.set(e.targetId, true);
            if (e.type === 'status-remove' && e.status === 'auto-life' && held.has(e.targetId)) held.set(e.targetId, false);
            if (e.type === 'revive' && e.cause === 'fayth') faythRevives += 1;
          }
          if (d.kind === 'resolved' || d.kind === 'waiting') continue;
          // between actions: the stream says what the board holds
          for (const [id, has] of held) {
            const c = st.combatants[id];
            if (c) expect(c.statuses['auto-life'] !== undefined, `seed ${seed} link ${link}: ${id}'s Auto-Life by the events (${has}) against the board`).toBe(has);
          }
          if (d.kind === 'battle-over') { over = d; break; }
          engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
        }
        linksChecked += 1;
        if (!over || over.kind !== 'battle-over' || String(over.result.outcome) !== 'victory' || !group.nextGroupId) break;
        const next = await findEnemyGroup(group.nextGroupId);
        if (!next) break;
        setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
        group = next;
        link += 1;
        engine.setSeed(setup.seed);
        engine.init(setup);
      }
    }
    expect(linksChecked).toBeGreaterThan(8);
    expect(faythRevives).toBeGreaterThan(20);
  }, 300_000);
});
