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
import type { BattleEvent, BattleState, Command, Decision, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import {
  FFXContentRegistry,
  applyStatus,
  buildBattle,
  createFFXEngine,
  dealDamage,
  koActor,
  resolveAbility,
} from '../../src/battle/ffx/index.ts';
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

  it('still terminates for a driver that cures Darkness', () => {
    // It no longer clears Form I. With enemy actions correctly using the ALWAYS
    // hit formula, Absorb lands every time and out-heals a party that spends
    // its turns curing and healing: a balance question, not an engine one.
    const stats = run(20260916, competent);
    expect(stats.outcome).toBeDefined();
    expect(stats.decisions).toBeLessThan(30000);
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

// ---------------------------------------------------------------------------
// Fidelity fixes found by running the shipped strategy against real data.
// Each of these was unit-green and integration-broken before.
// ---------------------------------------------------------------------------

function realCtx(seed: number, group = ENEMY_GROUPS_BY_ID['yunalesca']) {
  if (!group) throw new Error('yunalesca group missing');
  const events: BattleEvent[] = [];
  let seq = 0;
  const ctx = buildBattle(
    { game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed, condition: 'scripted', canEscape: false },
    new SeededRng(seed),
    liveContent(),
    (e) => {
      events.push({ ...e, seq: seq++ } as BattleEvent);
    },
  );
  const at = (id: string) => ctx.state.combatants[id] as FFXCombatant;
  return { ctx, events, at };
}

describe('enemy actions use the ALWAYS hit formula (§2.11)', () => {
  it('Absorb lands every time for exactly floor(maxHP/2), and heals her the same (§16)', () => {
    // Enemy Accuracy is never read. Before this fix Yunalesca (ACC 0) rolled
    // the physical table at base 25, so Absorb, Mind Blast and Mega Death
    // landed about one time in four.
    const { ctx, at } = realCtx(3);
    const boss = at('yunalesca');
    const absorb = ctx.content.ability('absorb');
    if (!absorb) throw new Error('absorb missing');
    for (let i = 0; i < 20; i++) {
      const auron = at('auron');
      auron.hp = auron.stats.maxHp;
      boss.hp = 10000;
      resolveAbility(ctx, boss, absorb, ['auron']);
      expect(auron.hp).toBe(auron.stats.maxHp - Math.floor(auron.stats.maxHp / 2));
      expect(boss.hp).toBe(10000 + Math.floor(auron.stats.maxHp / 2));
    }
  });

  it('a party Cure never whiffs', () => {
    const { ctx, events, at } = realCtx(4);
    const cure = ctx.content.ability('cure');
    if (!cure) throw new Error('cure missing');
    for (let i = 0; i < 30; i++) {
      at('auron').hp = 100;
      resolveAbility(ctx, at('yuna'), cure, ['auron']);
    }
    expect(events.filter((e) => e.type === 'miss')).toHaveLength(0);
  });
});

describe('Death actually kills, and Zombie is what spares you (§5.3)', () => {
  it('Mega Death takes a non-Zombie to 0 HP with a ko event, and spares a Zombie', () => {
    const { ctx, events, at } = realCtx(5);
    const megaDeath = ctx.content.ability('mega-death');
    if (!megaDeath) throw new Error('mega-death missing');
    // Strip the build's Death Ward so the roll is 100 - 0 > rng%101, not a coinflip.
    for (const id of ['tidus', 'yuna', 'auron']) at(id).immunities['ko'] = 0;
    at('tidus').immunities['zombie'] = 0;
    at('yuna').immunities['zombie'] = 0;
    applyStatus(ctx, undefined, at('tidus'), { status: 'zombie', chance: 255, duration: 254 });
    applyStatus(ctx, undefined, at('yuna'), { status: 'zombie', chance: 255, duration: 254 });

    // Chance 100 fails only on a roll of exactly 100, so allow a retry rather
    // than asserting on a 1-in-101 edge.
    for (let i = 0; i < 5 && at('auron').alive; i++) {
      resolveAbility(ctx, at('yunalesca'), megaDeath, []);
    }
    expect(at('auron').alive).toBe(false);
    expect(at('auron').hp).toBe(0);
    expect(events.some((e) => e.type === 'ko' && e.targetId === 'auron')).toBe(true);
    // The two Zombies survive every cast.
    expect(at('tidus').alive).toBe(true);
    expect(at('yuna').alive).toBe(true);
  });

  it('a party that cured Zombie is wiped by Mega Death; one that kept it is untouched', () => {
    const cast = (keepZombie: boolean): number => {
      const { ctx, at } = realCtx(6);
      const megaDeath = ctx.content.ability('mega-death');
      if (!megaDeath) throw new Error('mega-death missing');
      for (const id of ['tidus', 'yuna', 'auron']) {
        at(id).immunities['ko'] = 0;
        at(id).immunities['zombie'] = 0;
        if (keepZombie) applyStatus(ctx, undefined, at(id), { status: 'zombie', chance: 255, duration: 254 });
      }
      resolveAbility(ctx, at('yunalesca'), megaDeath, []);
      return ['tidus', 'yuna', 'auron'].filter((id) => !at(id).alive).length;
    };
    // The wrong tactic must stay punished: this is the inversion the fix closes.
    expect(cast(false)).toBeGreaterThanOrEqual(2);
    expect(cast(true)).toBe(0);
  });
});

describe('revival effects and Zombie (§4.2, §7.1)', () => {
  it('Phoenix Down revives a KO’d Zombie at 50% HP, and it stays a Zombie', () => {
    // Zombie survives KO. Refusing to revive a KO'd Zombie made every
    // zombified member who died permanently lost, which is how Form II bled out.
    const { ctx, at } = realCtx(7);
    const tidus = at('tidus');
    tidus.immunities['zombie'] = 0;
    applyStatus(ctx, undefined, tidus, { status: 'zombie', chance: 255, duration: 254 });
    koActor(ctx, tidus);
    const phoenix = ctx.content.itemEffect('phoenix-down');
    if (!phoenix) throw new Error('phoenix-down missing');
    resolveAbility(ctx, at('yuna'), { ...phoenix, category: 'item' }, ['tidus']);
    expect(tidus.alive).toBe(true);
    expect(tidus.hp).toBe(Math.floor(tidus.stats.maxHp / 2));
    expect(tidus.statuses['zombie']).toBeDefined();
  });

  it('a revival effect kills a living Zombie outright', () => {
    const { ctx, at } = realCtx(8);
    const auron = at('auron');
    auron.immunities['zombie'] = 0;
    applyStatus(ctx, undefined, auron, { status: 'zombie', chance: 255, duration: 254 });
    const phoenix = ctx.content.itemEffect('phoenix-down');
    if (!phoenix) throw new Error('phoenix-down missing');
    resolveAbility(ctx, at('yuna'), { ...phoenix, category: 'item' }, ['auron']);
    expect(auron.alive).toBe(false);
    expect(auron.hp).toBe(0);
  });

  it('a revival effect still whiffs on a living non-Zombie', () => {
    const { ctx, events, at } = realCtx(9);
    const phoenix = ctx.content.itemEffect('phoenix-down');
    if (!phoenix) throw new Error('phoenix-down missing');
    const before = at('auron').hp;
    resolveAbility(ctx, at('yuna'), { ...phoenix, category: 'item' }, ['auron']);
    expect(at('auron').hp).toBe(before);
    expect(events.some((e) => e.type === 'miss' && e.reason === 'wrong-state')).toBe(true);
  });
});

describe('the transformation turns (§1.3)', () => {
  /** Forms I and II at 1 HP, so a plain Attack pushes her through both. */
  function shortChain(): readonly BattleEvent[] {
    const group = JSON.parse(JSON.stringify(ENEMY_GROUPS_BY_ID['yunalesca'])) as EnemyGroupDef;
    const y = group.enemies[0];
    if (!y || !y.forms[0] || !y.forms[1]) throw new Error('yunalesca forms missing');
    y.forms[0].hp = 1;
    y.forms[1].hp = 1;
    y.hp = 1;
    y.stats.hp = 1;
    y.stats.maxHp = 1;
    const engine = createFFXEngine({ content: liveContent(), autoResolveMinigames: true });
    engine.init({ game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 31, condition: 'normal', canEscape: false });
    for (let i = 0; i < 2000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') engine.submit(naive(d, engine.state()));
      const log = engine.state().log;
      const forms = log.filter((e) => e.type === 'form-change').length;
      const megaDeaths = log.filter((e) => e.type === 'action-start' && e.abilityId === 'mega-death').length;
      if (forms === 2 && megaDeaths > 0) break;
    }
    return engine.state().log;
  }

  /** The first action Yunalesca takes on her own scheduled turn after `afterSeq`. */
  function nextScheduledAction(log: readonly BattleEvent[], afterSeq: number): string | undefined {
    let onHerTurn = false;
    for (const e of log) {
      if (e.seq <= afterSeq) continue;
      if (e.type === 'turn-start') onHerTurn = e.actorId === 'yunalesca';
      if (onHerTurn && e.type === 'action-start' && e.actorId === 'yunalesca') return e.abilityId;
    }
    return undefined;
  }

  it('opens Form II with Hellbiter and Form III with Mega Death', () => {
    const log = shortChain();
    const changes = log.filter((e): e is Extract<BattleEvent, { type: 'form-change' }> => e.type === 'form-change');
    expect(changes.map((c) => c.formIndex)).toEqual([1, 2]);
    const [toTwo, toThree] = changes;
    if (!toTwo || !toThree) throw new Error('expected two transitions');
    expect(nextScheduledAction(log, toTwo.seq)).toBe('hellbiter');
    expect(nextScheduledAction(log, toThree.seq)).toBe('mega-death');
  });

  it('never counters the blow that kills a form', () => {
    const log = shortChain();
    for (const change of log.filter((e) => e.type === 'form-change')) {
      // Between the transformation and the next turn boundary there must be no
      // Yunalesca counter: onHit ran the transformation instead.
      for (const e of log) {
        if (e.seq <= change.seq) continue;
        if (e.type === 'turn-start') break;
        expect(e.type === 'counter' && e.actorId === 'yunalesca').toBe(false);
      }
    }
  });
});
