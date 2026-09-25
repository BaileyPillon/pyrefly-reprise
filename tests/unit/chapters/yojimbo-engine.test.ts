/**
 * **Yojimbo, Cavern of the Stolen Fayth** — the mechanic units from
 * `docs/plans/chapter-yojimbo-review.md` §9 (with the review's corrections),
 * the three new engine capabilities, the data against the research, and the
 * game-specific absence tests.
 *
 * Every case pins **one research claim** against the real engine and the real
 * data. Nothing greps: hard rule 3 says prove it by running the engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The last describe blocks are
 * the absence tests the rule requires.
 */

import { describe, expect, it } from 'vitest';
import type {
  AbilityDef,
  BattleEngine,
  BattleEvent,
  Command,
  Decision,
  FFXCombatant,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import * as rules from '../../../src/battle/ffx/ai/yojimbo-rules.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import * as data from '../../../src/data/ffx/enemies/yojimbo.ts';
import * as rows from '../../../src/data/ffx/enemies/yojimbo-abilities.ts';
import { yojimboCavernBuild } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES as FFX2_ABILITIES } from '../../../src/data/ffx2/index.ts';

const GROUP_ID = 'yojimbo-cavern';

/** Two probe rows for mechanics no party member owns at this build point. */
const QUAD: AbilityDef = {
  id: 'test-quad-slash', name: 'Quad Slash', game: 'ffx', category: 'skill', mpCost: 0, rank: 3,
  power: 16, formula: 'strength', damageType: 'physical', element: ['none'], targeting: 'single-enemy',
  hits: 4, statusEffects: [], removesStatuses: [], flags: [], canMiss: false,
};
const GRAVITY: AbilityDef = {
  id: 'test-gravity', name: 'Gravity', game: 'ffx', category: 'blackmagic', mpCost: 0, rank: 3,
  power: 8, formula: 'percent-current', damageType: 'magical', element: ['none'], targeting: 'single-enemy',
  hits: 1, statusEffects: [], removesStatuses: [], flags: [], canMiss: false,
};

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES, QUAD, GRAVITY]);
content.addItems(Object.values(ITEMS));

function newEngine(seed = 1): ReturnType<typeof createFFXEngine> {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID];
  if (!group) throw new Error(`${GROUP_ID} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: yojimboCavernBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

type Input = Extract<Decision, { kind: 'player-input' }>;
const defend = (): Command => ({ kind: 'defend', targets: [] });

/** Drive until `stop`, answering every player turn with `choose`. */
function drive(engine: BattleEngine, choose: (d: Input) => Command, stop: (e: BattleEngine) => boolean, max = 4000): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d));
  }
}

function yojimbo(engine: BattleEngine): FFXCombatant {
  return engine.state().combatants['yojimbo'] as FFXCombatant;
}

function setGauge(engine: BattleEngine, value: number): void {
  const od = yojimbo(engine).overdrive;
  if (!od) throw new Error('no gauge');
  od.gauge = value;
}

/** Take the party out of danger so a unit measures the mechanic. */
function makeInvincible(engine: BattleEngine): void {
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (!c) continue;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

/** Run until Yojimbo's next turn has resolved; return that turn's events, from its `turn-start`. */
function nextYojimboTurn(engine: BattleEngine, choose: (d: Input) => Command = defend): BattleEvent[] {
  const from = engine.state().log.length;
  const opened = (): number =>
    engine.state().log.findIndex((e, i) => i >= from && e.type === 'turn-start' && e.actorId === 'yojimbo');
  drive(engine, choose, (e) => {
    const at = opened();
    if (at < 0) return e.state().result !== null;
    return e.state().log.slice(at + 1).some((ev) => ev.type === 'turn-start') || e.state().result !== null;
  });
  const tail = engine.state().log.slice(Math.max(0, opened()));
  const next = tail.findIndex((ev, i) => i > 0 && ev.type === 'turn-start');
  return next > 0 ? tail.slice(0, next) : tail;
}

function abilitiesUsedBy(events: readonly BattleEvent[], actorId: string): string[] {
  return events
    .filter((e): e is Extract<BattleEvent, { type: 'action-start' }> => e.type === 'action-start' && e.actorId === actorId)
    .map((e) => e.abilityId ?? '');
}

// ---------------------------------------------------------------------------
// The data, against research §2 and §3
// ---------------------------------------------------------------------------

describe('Yojimbo — the stat block and the formation [research §2]', () => {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID]!;
  const y = group.enemies.find((e) => e.id === 'yojimbo')!;
  const dog = group.enemies.find((e) => e.id === 'daigoro')!;
  const ginnem = group.enemies.find((e) => e.id === 'ginnem')!;

  it('§2.5 — Ginnem, Yojimbo, Daigoro hold slots M1-M3, the boss is listed first, and it cannot be fled', () => {
    // Listed boss-first so the battle-start card headlines Yojimbo (verifier,
    // 2026-09-24: it read "Lady Ginnem"); the slots keep the formation.
    expect(group.enemies.map((e) => e.id)).toEqual(['yojimbo', 'ginnem', 'daigoro']);
    expect(group.enemies.map((e) => e.slot)).toEqual([1, 0, 2]);
    expect(ginnem.slot).toBe(0);
    expect(y.slot).toBe(1);
    expect(dog.slot).toBe(2);
    expect(group.canEscape).toBe(false);
    expect(group.game).toBe('ffx');
  });

  it('§2.1 — HP 33,000, Defense 80, Magic Defense 0, Agility 32, overkill 4,060, no rewards', () => {
    expect(y.stats).toMatchObject({ hp: 33_000, mp: 2_000, str: 34, def: 80, mag: 35, mdef: 0, agi: 32, luck: 15, eva: 0 });
    expect(y.rewards).toMatchObject({ ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 4_060, drops: [] });
    expect(y.affinities).toEqual({});
    expect(y.flags.isBoss).toBe(true);
  });

  it('§2.3 — Doom lands with count 5; Death, the Breaks, Slow and Sleep do not; Threaten is immune (B9)', () => {
    expect(y.immunities.doom).toBeUndefined();
    expect(y.doomTurns).toBe(5);
    for (const s of ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'armor-break', 'slow', 'sleep', 'eject'] as const) {
      expect(y.immunities[s], s).toBe(255);
    }
    expect(y.threatenChance).toBe(0);
    expect(y.immunityFlags).toEqual(expect.arrayContaining([
      'immune-to-percentage-damage', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe',
    ]));
  });

  it('§2.5 — Daigoro is Strength 25, HP 1; Ginnem HP 10; both untargetable (B3)', () => {
    expect(dog.stats.str).toBe(25);
    expect(dog.hp).toBe(1);
    expect(dog.abilityIds).toEqual(['daigoro-attack']);
    expect(ginnem.hp).toBe(10);
    expect(ginnem.stats.str).toBe(7);
    expect(ginnem.abilityIds).toEqual([]);
    for (const e of [dog, ginnem]) expect(e.flags.untargetable).toBe(true);
  });

  it('the battle layer and the data layer name the same ids', () => {
    expect(rules.YOJIMBO_ID).toBe(data.YOJIMBO_ID);
    expect(rules.DAIGORO_ID).toBe(data.DAIGORO_ID);
    expect(rules.GINNEM_ID).toBe(data.GINNEM_ID);
    expect(rules.YOJIMBO_SCRIPT).toBe(data.YOJIMBO_SCRIPT);
    expect(rules.YOJIMBO_BYSTANDER_SCRIPT).toBe(data.YOJIMBO_BYSTANDER_SCRIPT);
    for (const k of ['YOJIMBO_DAIGORO_ORDER', 'YOJIMBO_KOZUKA', 'YOJIMBO_WAKIZASHI', 'YOJIMBO_ZANMATO', 'DAIGORO_ATTACK'] as const) {
      expect(rules[k], k).toBe(rows[k]);
    }
  });
});

describe('Yojimbo — the action rows [research §3.1]', () => {
  const r = rows.YOJIMBO_ABILITIES;

  it('Kozuka 16 and Wakizashi 28 are Strength, physical, one random character, no crit', () => {
    for (const [id, dc] of [['yojimbo-kozuka', 16], ['yojimbo-wakizashi', 28]] as const) {
      expect(r[id]).toMatchObject({ formula: 'strength', power: dc, damageType: 'physical', targeting: 'random-enemy', hits: 1 });
      expect(r[id]?.flags).not.toContain('crit-eligible');
    }
  });

  it('Daigoro 20 crits with bonus +20 and shatters at 10 %', () => {
    expect(r['daigoro-attack']).toMatchObject({ formula: 'strength', power: 20, targeting: 'random-enemy', bonusCrit: 20, shatterChance: 10 });
    expect(r['daigoro-attack']?.flags).toEqual(expect.arrayContaining(['crit-eligible', 'shatter']));
  });

  it("Zanmato is fixed DC 200 to the whole party, typed 'other' (the review's correction), never misses", () => {
    expect(r['yojimbo-zanmato']).toMatchObject({
      formula: 'fixed-no-variance', power: 200, damageType: 'other', targeting: 'all-enemies', canMiss: false,
    });
  });

  it('the order row deals nothing and names the dog', () => {
    expect(r['yojimbo-daigoro']).toMatchObject({ formula: 'none', hits: 0, canMiss: false });
    expect(r['yojimbo-daigoro']?.extra).toEqual({ ordersActor: 'daigoro', orderedAbility: 'daigoro-attack' });
  });
});

// ---------------------------------------------------------------------------
// Capability 1 — on the field, no turns of its own
// ---------------------------------------------------------------------------

describe('Capability: a combatant on the field that takes no turns of its own', () => {
  it('Ginnem and Daigoro never open a turn and never appear in the CTB forecast', () => {
    const engine = newEngine(11);
    makeInvincible(engine);
    for (const row of engine.predictTurnOrder(16)) expect(['ginnem', 'daigoro']).not.toContain(row.actorId);
    drive(engine, defend, (e) => e.state().turn >= 120);
    const turns = engine.state().log.filter((e) => e.type === 'turn-start').map((e) => (e as { actorId: string }).actorId);
    expect(turns.length).toBeGreaterThan(100);
    expect(turns).not.toContain('ginnem');
    expect(turns).not.toContain('daigoro');
    // …and yet both are on the field.
    expect(engine.state().enemyIds).toEqual(['yojimbo', 'ginnem', 'daigoro']);
    expect(engine.state().combatants['daigoro']?.alive).toBe(true);
  });

  it('neither can be targeted by any command (B3)', () => {
    const engine = newEngine(2);
    let checked = 0;
    drive(engine, (d) => {
      for (const c of d.commands) {
        expect(c.validTargets).not.toContain('ginnem');
        expect(c.validTargets).not.toContain('daigoro');
      }
      checked++;
      return defend();
    }, () => checked >= 6);
    expect(checked).toBe(6);
  });

  it('Yojimbo falling ends the battle in victory while both bystanders still stand', () => {
    const engine = newEngine(3);
    yojimbo(engine).hp = 1;
    drive(engine, () => ({ kind: 'attack', targets: ['yojimbo'] }), (e) => e.state().result !== null);
    expect(engine.state().result?.outcome).toBe('victory');
    expect(engine.state().combatants['daigoro']?.alive).toBe(true);
    expect(engine.state().combatants['ginnem']?.alive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Capability 2 — Yojimbo's turn orders Daigoro to act
// ---------------------------------------------------------------------------

describe("Capability: Yojimbo's turn orders Daigoro to act [§2.5, §3.1]", () => {
  it('below 25 % the only action is the order, and the dog acts on the same turn', () => {
    const engine = newEngine(4);
    makeInvincible(engine);
    for (let i = 0; i < 12; i++) {
      setGauge(engine, 0);
      const turn = nextYojimboTurn(engine);
      expect(abilitiesUsedBy(turn, 'yojimbo')).toEqual(['yojimbo-daigoro']);
      expect(abilitiesUsedBy(turn, 'daigoro')).toEqual(['daigoro-attack']);
      const bite = turn.find((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'daigoro');
      expect(bite, 'the dog bites a party member').toBeDefined();
    }
  });

  it("the bite uses the dog's Strength, never Yojimbo's", () => {
    const measure = (dogStr: number, yojimboStr: number): number => {
      const engine = newEngine(5);
      makeInvincible(engine);
      (engine.state().combatants['daigoro'] as FFXCombatant).stats.str = dogStr;
      yojimbo(engine).stats.str = yojimboStr;
      setGauge(engine, 0);
      const turn = nextYojimboTurn(engine);
      const hit = turn.find((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'daigoro') as
        | { amount: number }
        | undefined;
      return hit?.amount ?? -1;
    };
    const base = measure(25, 34);
    expect(base).toBeGreaterThan(0);
    expect(measure(25, 255)).toBe(base); // Yojimbo's own Strength changes nothing
    expect(measure(1, 34)).toBeLessThan(base / 10); // the dog's does
  });

  it('the order costs the dog no CTB and charges only Yojimbo (one turn of his per order)', () => {
    const engine = newEngine(6);
    makeInvincible(engine);
    drive(engine, defend, (e) => e.state().turn >= 60);
    const log = engine.state().log;
    const orders = log.filter((e) => e.type === 'action-start' && e.actorId === 'yojimbo' && e.abilityId === 'yojimbo-daigoro').length;
    const bites = log.filter((e) => e.type === 'action-start' && e.actorId === 'daigoro').length;
    expect(orders).toBeGreaterThan(0);
    expect(bites).toBe(orders);
  });
});

// ---------------------------------------------------------------------------
// Capability 3 — the enemy Overdrive gauge, in state and in events
// ---------------------------------------------------------------------------

describe('Capability: the Zanmato gauge is exposed in state and events [§4.1]', () => {
  it('Yojimbo carries a 0-100 gauge on the published state, tagged for a widget, starting at 0 (B2)', () => {
    const engine = newEngine(7);
    const od = yojimbo(engine).overdrive;
    expect(od).toMatchObject({ gauge: 0, enemyGaugeRules: 'yojimbo' });
    // Nobody else in the formation carries one.
    expect((engine.state().combatants['daigoro'] as FFXCombatant).overdrive).toBeUndefined();
  });

  it('+3 once per party action that targets him, not per hit (Y-1)', () => {
    const engine = newEngine(8);
    makeInvincible(engine);
    let done = false;
    drive(engine, () => {
      if (done) return defend();
      done = true;
      return { kind: 'ability', id: 'test-quad-slash', targets: ['yojimbo'] };
    }, () => done);
    const log = engine.state().log;
    const gains = log
      .filter((e) => e.type === 'overdrive-gauge' && e.who === 'yojimbo' && e.cause === 'targeted')
      .map((e) => (e as { to: number; from: number }).to - (e as { to: number; from: number }).from);
    expect(gains).toEqual([3]);
    const hits = log.filter((e) => e.type === 'damage' && (e as { targetId: string }).targetId === 'yojimbo');
    expect(hits).toHaveLength(4);
  });

  it('+2 on each of his attacking turns (the Daigoro order included), emitted as cause "attacking"', () => {
    const engine = newEngine(9);
    makeInvincible(engine);
    setGauge(engine, 30);
    const turn = nextYojimboTurn(engine);
    const gain = turn.filter((e) => e.type === 'overdrive-gauge' && e.who === 'yojimbo');
    expect(gain).toHaveLength(1);
    expect(gain[0]).toMatchObject({ from: 30, to: 32, cause: 'attacking' });
  });

  it('the bands gate the pool: <25 order only; 25 adds Kozuka; 50 adds Wakizashi [verified: 3 sources]', () => {
    expect(rules.yojimboPool(0)).toEqual(['yojimbo-daigoro']);
    expect(rules.yojimboPool(24)).toEqual(['yojimbo-daigoro']);
    expect(rules.yojimboPool(25)).toEqual(['yojimbo-daigoro', 'yojimbo-kozuka']);
    expect(rules.yojimboPool(49)).toEqual(['yojimbo-daigoro', 'yojimbo-kozuka']);
    expect(rules.yojimboPool(50)).toEqual(['yojimbo-daigoro', 'yojimbo-kozuka', 'yojimbo-wakizashi']);
    expect(rules.yojimboPool(99)).toEqual(['yojimbo-daigoro', 'yojimbo-kozuka', 'yojimbo-wakizashi']);
    expect([0, 25, 50, 80, 100].map((g) => rules.yojimboBand(g))).toEqual(['daigoro', 'kozuka', 'wakizashi', 'heightened', 'zanmato']);
    expect([24, 49, 79, 99].map((g) => rules.yojimboBand(g))).toEqual(['daigoro', 'kozuka', 'wakizashi', 'heightened']);
  });

  it('in play, each band uses exactly its pool, every member of it, at an even split (B2)', () => {
    for (const [gauge, pool] of [[10, ['yojimbo-daigoro']], [30, ['yojimbo-daigoro', 'yojimbo-kozuka']], [60, ['yojimbo-daigoro', 'yojimbo-kozuka', 'yojimbo-wakizashi']]] as const) {
      const count = new Map<string, number>();
      for (let seed = 1; seed <= 150; seed++) {
        const engine = newEngine(seed);
        makeInvincible(engine);
        setGauge(engine, gauge);
        const used = abilitiesUsedBy(nextYojimboTurn(engine), 'yojimbo');
        expect(used).toHaveLength(1);
        count.set(used[0]!, (count.get(used[0]!) ?? 0) + 1);
      }
      expect([...count.keys()].sort()).toEqual([...pool].sort());
      for (const n of count.values()) expect(n).toBeGreaterThan(150 / pool.length / 2);
    }
  });

  it('at 100 his next turn is Zanmato, 9,999 to each of the three, then the gauge returns to 0 (B2)', () => {
    const engine = newEngine(10);
    makeInvincible(engine);
    setGauge(engine, 100);
    const turn = nextYojimboTurn(engine);
    expect(abilitiesUsedBy(turn, 'yojimbo')).toEqual(['yojimbo-zanmato']);
    const reset = turn.find((e) => e.type === 'overdrive-gauge' && e.who === 'yojimbo');
    expect(reset).toMatchObject({ from: 100, to: 0, cause: 'zanmato' });
    const dmg = turn.filter((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'yojimbo') as Array<{ targetId: string; amount: number }>;
    expect(dmg.map((d) => d.targetId).sort()).toEqual(['kimahri', 'lulu', 'yuna']);
    for (const d of dmg) expect(d.amount).toBe(9_999);
    expect(yojimbo(engine).overdrive?.gauge).toBe(0);
  });

  it('Protect does not reduce Zanmato', () => {
    const engine = newEngine(12);
    makeInvincible(engine);
    for (const id of engine.state().activeIds) {
      const c = engine.state().combatants[id]!;
      c.statuses['protect'] = { id: 'protect', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
    setGauge(engine, 100);
    const dmg = nextYojimboTurn(engine).filter((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'yojimbo');
    expect(dmg).toHaveLength(3);
    for (const d of dmg) expect((d as { amount: number }).amount).toBe(9_999);
  });

  it('an aeon on the field takes Zanmato alone, and Shield cuts it to a quarter [§4.3, §5.3]', () => {
    const run = (shield: boolean): { targets: string[]; amount: number; partyHp: number[] } => {
      const engine = newEngine(13);
      makeInvincible(engine);
      let summoned = false;
      let shielded = !shield;
      drive(engine, (d) => {
        if (!summoned && d.actorId === 'yuna') { summoned = true; return { kind: 'summon', id: 'bahamut', targets: [] }; }
        if (summoned && !shielded && d.actorId === 'bahamut') { shielded = true; return { kind: 'ability', id: 'shield', targets: ['bahamut'] }; }
        return defend();
      }, () => summoned && shielded && engine.state().aeonId !== null);
      const aeon = engine.state().combatants['bahamut']!;
      aeon.stats.maxHp = 99_999;
      aeon.hp = 99_999;
      setGauge(engine, 100);
      const st = engine.state();
      const before = ['lulu', 'kimahri', 'yuna'].map((id) => st.combatants[id]!.hp);
      const dmg = nextYojimboTurn(engine).filter((e) => e.type === 'damage' && (e as { sourceId?: string }).sourceId === 'yojimbo') as Array<{ targetId: string; amount: number }>;
      const after = ['lulu', 'kimahri', 'yuna'].map((id) => st.combatants[id]!.hp);
      return { targets: dmg.map((d) => d.targetId), amount: dmg[0]?.amount ?? -1, partyHp: after.map((hp, i) => hp - before[i]!) };
    };
    const bare = run(false);
    expect(bare.targets).toEqual(['bahamut']);
    expect(bare.amount).toBe(9_999);
    expect(bare.partyHp).toEqual([0, 0, 0]); // the party, off the field, loses nothing
    const shielded = run(true);
    expect(shielded.targets).toEqual(['bahamut']);
    expect(shielded.amount).toBeLessThanOrEqual(2_500);
    expect(shielded.amount).toBeGreaterThanOrEqual(2_499);
  });
});

// ---------------------------------------------------------------------------
// The sourced counterplay and the closed doors
// ---------------------------------------------------------------------------

describe('Yojimbo — Doom, and what fails on him [§2.3, §5.3]', () => {
  it('Kimahri arrives with Doom and a full gauge, and Doom kills him as his fifth turn opens', () => {
    const engine = newEngine(14);
    makeInvincible(engine);
    let doomed = false;
    drive(engine, (d) => {
      if (!doomed && d.actorId === 'kimahri') {
        const row = d.commands.find((c) => c.command.kind === 'overdrive' && c.command.id === 'doom' && c.enabled);
        expect(row, 'Doom is on the Ronso Rage menu').toBeDefined();
        doomed = true;
        return { kind: 'overdrive', id: 'doom', targets: ['yojimbo'] };
      }
      return defend();
    }, (e) => e.state().result !== null);
    const log = engine.state().log;
    const landed = log.findIndex((e) => e.type === 'status-add' && e.targetId === 'yojimbo' && e.status === 'doom');
    expect(landed).toBeGreaterThan(0);
    const after = log.slice(landed);
    const hisTurns = after.filter((e) => e.type === 'turn-start' && e.actorId === 'yojimbo').length;
    const hisActions = after.filter((e) => e.type === 'action-start' && e.actorId === 'yojimbo').length;
    expect(hisTurns).toBe(5);
    expect(hisActions).toBe(4); // the fifth turn opens on the countdown's end
    expect(engine.state().result?.outcome).toBe('victory');
  });

  it('Threaten fails (B9), Gravity-class damage does nothing, Scan reveals nothing, and nobody can flee', () => {
    const engine = newEngine(15);
    makeInvincible(engine);
    const plan: Command[] = [
      { kind: 'ability', id: 'threaten', targets: ['yojimbo'] },
      { kind: 'ability', id: 'test-gravity', targets: ['yojimbo'] },
      { kind: 'ability', id: 'scan', targets: ['yojimbo'] },
      { kind: 'escape', targets: [], extra: { mode: 'party' } },
    ];
    let i = 0;
    drive(engine, () => plan[i++] ?? defend(), () => i > plan.length);
    const y = yojimbo(engine);
    expect(y.statuses['threaten']).toBeUndefined();
    expect(y.hp).toBe(33_000);
    expect(y.revealed).not.toBe(true);
    expect(engine.state().result).toBeNull();
    expect(engine.state().log.some((e) => e.type === 'message' && e.text === "Can't escape!")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The build and the registration
// ---------------------------------------------------------------------------

describe('The Cavern build and the chapter registration', () => {
  it('the build is the Gagazet upper bound without Gagazet: no Mighty Guard / White Wind, Doom with a full gauge (B8)', () => {
    const k = yojimboCavernBuild.members.find((m) => m.id === 'kimahri')!;
    expect(k.learnedAbilityIds).not.toContain('mighty-guard');
    expect(k.learnedAbilityIds).not.toContain('white-wind');
    expect(k.overdrive?.unlockedOverdriveIds).toContain('doom');
    expect(k.overdrive?.unlockedOverdriveIds).not.toContain('mighty-guard');
    expect(k.overdrive?.gauge).toBe(100);
    expect(yojimboCavernBuild.activeSlots).toEqual(['lulu', 'kimahri', 'yuna']);
    expect(yojimboCavernBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
    expect(yojimboCavernBuild.inventory.some((e) => e.itemId === 'candle-of-life')).toBe(false);
    expect(yojimboCavernBuild.gil).toBe(gagazetBuild.gil - 20_000);
    // Gagazet itself is untouched by the copy.
    expect(gagazetBuild.members.find((m) => m.id === 'kimahri')?.learnedAbilityIds).toContain('mighty-guard');
  });

  it('Chapter IX is registered by id, reachable, and listed after Chapter VIII (listed 2026-09-24)', () => {
    const ch = getChapter('yojimbo-cavern');
    expect(ch).toBeDefined();
    expect(ch).toMatchObject({ game: 'ffx', number: 9, title: 'Yojimbo' });
    expect(ch?.enemyGroupRef.id).toBe(GROUP_ID);
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).not.toContain('yojimbo-cavern');
    expect(CHAPTERS.map((c) => c.id).slice(-2)).toEqual(['evrae-airship', 'yojimbo-cavern']);
    expect(CHAPTER_IDS.at(-1)).toBe('yojimbo-cavern');
    // The story layer (tests/unit/chapters/yojimbo-content.test.ts pins its lines):
    // the pre scene ends by opening the battle, the post scene shows results.
    expect(ch?.scriptsRef.pre.at(-1)).toEqual({ type: 'battleStart' });
    expect(ch?.scriptsRef.post.some((s) => s.type === 'results')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Absence tests [AGENTS.md rule 14, CHK-021]
// ---------------------------------------------------------------------------

describe('FFX only: nothing here reaches another chapter or FFX-2', () => {
  it('no other formation, FFX or FFX-2, carries an ordering row or a Yojimbo script', () => {
    const ordering = ALL_ABILITIES.filter((a) => a.extra?.['ordersActor'] !== undefined).map((a) => a.id);
    expect(ordering).toEqual(['yojimbo-daigoro']);
    expect(FFX2_ABILITIES.some((a) => a.extra?.['ordersActor'] !== undefined)).toBe(false);
    for (const [id, group] of Object.entries(ENEMY_GROUPS_BY_ID)) {
      if (id === GROUP_ID) continue;
      for (const e of group.enemies) expect(e.aiScriptId.startsWith('yojimbo'), `${id}/${e.id}`).toBe(false);
    }
  });

  it('every other FFX chapter keeps every living enemy in its CTB queue and never grows an enemy gauge tagged yojimbo', () => {
    for (const ch of CHAPTERS.filter((c) => c.game === 'ffx' && c.id !== 'yojimbo-cavern')) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: ch.buildRef as typeof yojimboCavernBuild, enemies: ch.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      const st = engine.state();
      const inQueue = new Set(engine.predictTurnOrder(40).map((r) => r.actorId));
      for (const id of st.enemyIds) {
        const e = st.combatants[id] as FFXCombatant;
        expect(e.overdrive?.enemyGaugeRules, `${ch.id}/${id}`).not.toBe('yojimbo');
        if (e.alive && !e.removed) expect(inQueue.has(id), `${ch.id}/${id} lost its turn`).toBe(true);
      }
    }
  });
});
