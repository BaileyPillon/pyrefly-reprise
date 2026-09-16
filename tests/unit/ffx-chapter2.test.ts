/**
 * Chapter 2 (Yunalesca, three chained forms) — integration against the **real**
 * data layer: the shipped `zanarkandBuild`, the shipped enemy group, and every
 * registered `AbilityDef`/`ItemDef`.
 *
 * This file exists because the e2e run was not reaching a decision inside its
 * 60 s budget, and the engine needed to answer whether that was logic or
 * pacing. It is logic — but not engine logic. Form I counters **every** landed
 * physical hit with Blind at chance 100 for 3 turns [ffx-yunalesca §5.1], and
 * Darkness drops physical hit chance to base/10 [ffx-combat-core §2.11]. A
 * driver that only ever presses Attack therefore blinds itself, whiffs over
 * half its swings, and loses ground to Absorb's `floor(maxHP/2)` self-heal.
 *
 * Both drivers below terminate. The naive one loses; the one that cures
 * Darkness wins and walks all three forms.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, buildBattle, createFFXEngine, dealDamage } from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';

function liveContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities(ALL_ABILITIES);
  reg.addItems(Object.values(ITEMS));
  return reg;
}

function newEngine(seed: number) {
  const group = ENEMY_GROUPS_BY_ID['yunalesca'];
  if (!group) throw new Error('yunalesca group missing from the data layer');
  const engine = createFFXEngine({ content: liveContent(), autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: zanarkandBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

type Chooser = (d: Extract<Decision, { kind: 'player-input' }>, state: Readonly<BattleState>) => Command;

interface RunStats {
  decisions: number;
  playerTurns: number;
  outcome: string | undefined;
  formChanges: number[];
  hits: number;
  misses: number;
}

function run(seed: number, choose: Chooser, maxDecisions = 30000): RunStats {
  const engine = newEngine(seed);
  const stats: RunStats = { decisions: 0, playerTurns: 0, outcome: undefined, formChanges: [], hits: 0, misses: 0 };

  for (let i = 0; i < maxDecisions; i++) {
    stats.decisions++;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      stats.outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'player-input') {
      stats.playerTurns++;
      engine.submit(choose(d, engine.state()));
    }
  }

  for (const e of engine.state().log) {
    if (e.type === 'form-change' && e.enemyId === 'yunalesca') stats.formChanges.push(e.formIndex);
    if (e.type === 'damage' && e.targetId === 'yunalesca' && e.amount > 0) stats.hits++;
    if (e.type === 'miss' && e.sourceId !== 'yunalesca') stats.misses++;
  }
  return stats;
}

/** Presses Attack and nothing else. */
const naive: Chooser = (d) => {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
};

/** Cures Darkness, revives and heals, then attacks. */
const competent: Chooser = (d, state) => {
  const self = state.combatants[d.actorId] as FFXCombatant | undefined;
  const active = state.activeIds
    .map((id) => state.combatants[id] as FFXCombatant | undefined)
    .filter((c): c is FFXCombatant => c !== undefined);
  const pick = (label: string, targetId?: string): Command | undefined => {
    const row = d.commands.find((c) => c.label === label && c.enabled);
    if (!row) return undefined;
    const target = targetId && row.validTargets.includes(targetId) ? targetId : row.validTargets[0];
    if (!target && row.validTargets.length > 0) return undefined;
    return { ...row.command, targets: target ? [target] : [] } as Command;
  };

  const downed = active.find((c) => !c.alive);
  if (downed) {
    const revive = pick('Phoenix Down', downed.id) ?? pick('Life', downed.id);
    if (revive) return revive;
  }
  // Zombie first: every HP restoration damages a Zombie instead, so healing one
  // is worse than doing nothing [ffx-combat-core §4.2]. Esuna does NOT cure it.
  const zombied = active.find((c) => c.alive && c.statuses['zombie'] !== undefined);
  if (zombied) {
    const cure = pick('Holy Water', zombied.id) ?? pick('Remedy', zombied.id);
    if (cure) return cure;
  }
  const hurt = active.find(
    (c) => c.alive && c.statuses['zombie'] === undefined && c.hp * 100 < c.stats.maxHp * 40,
  );
  if (hurt) {
    const heal = pick('Curaga', hurt.id) ?? pick('Cura', hurt.id) ?? pick('Hi-Potion', hurt.id);
    if (heal) return heal;
  }
  // Darkness is the whole fight for a physical party: cure it before swinging.
  const blind = active.find((c) => c.alive && c.statuses['darkness'] !== undefined);
  if (blind) {
    const cure = pick('Eye Drops', blind.id) ?? pick('Esuna', blind.id);
    if (cure) return cure;
  }
  void self;
  return naive(d, state);
};

describe('Chapter 2 — Yunalesca always reaches a decision', () => {
  it('terminates for a naive auto-attacker, without spinning', () => {
    const stats = run(20260916, naive);
    expect(stats.outcome).toBeDefined();
    expect(stats.decisions).toBeLessThan(30000);
  });

  it('blinds a naive auto-attacker into missing most of its swings', () => {
    // The Form I Blind counter is the reason Chapter 2 stalls under a driver
    // that never cures Darkness. If this ratio ever drops back toward zero,
    // the counter or the Darkness accuracy penalty has regressed.
    const stats = run(20260916, naive);
    expect(stats.misses).toBeGreaterThan(stats.hits * 0.8);
  });

  it('gets a Darkness-curing driver past Form I, so the transition really fires', () => {
    const stats = run(20260916, competent);
    expect(stats.formChanges[0]).toBe(1);
    expect(stats.outcome).toBeDefined();
  });

  it('terminates across seeds', () => {
    for (const seed of [1, 7, 999]) {
      const stats = run(seed, competent);
      expect(stats.outcome).toBeDefined();
      expect(stats.decisions).toBeLessThan(30000);
    }
  });

  it('is deterministic under a fixed seed', () => {
    const a = run(4242, competent);
    const b = run(4242, competent);
    expect(b).toEqual(a);
  });
});

describe('Yunalesca’s three-form chain', () => {
  it('re-assigns HP wholesale at each transition and discards the overflow', () => {
    const group = ENEMY_GROUPS_BY_ID['yunalesca'];
    if (!group) throw new Error('yunalesca group missing');
    const events: BattleEvent[] = [];
    let seq = 0;
    const ctx = buildBattle(
      {
        game: 'ffx',
        party: zanarkandBuild,
        enemies: group,
        triggers: [],
        seed: 11,
        condition: 'scripted',
        canEscape: false,
      },
      new SeededRng(11),
      liveContent(),
      (e) => {
        events.push({ ...e, seq: seq++ } as BattleEvent);
      },
    );

    const boss = ctx.state.combatants['yunalesca'] as FFXCombatant;
    const seen: Array<{ index: number; maxHp: number }> = [];

    // Three enormous blows: Form I -> II -> III -> dead. If overflow carried,
    // the next form would start short of its stored figure.
    for (let i = 0; i < 3; i++) {
      seen.push({ index: boss.enemy?.formIndex ?? -1, maxHp: boss.stats.maxHp });
      dealDamage(ctx, boss, 999999, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    }

    expect(seen).toEqual([
      { index: 0, maxHp: 24000 },
      { index: 1, maxHp: 48000 },
      { index: 2, maxHp: 60000 },
    ]);
    expect(boss.alive).toBe(false);
    expect(events.filter((e) => e.type === 'form-change')).toHaveLength(2);
  });
});
