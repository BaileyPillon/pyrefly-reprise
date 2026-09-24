/**
 * **Seymour Natus and Mortibody, the Highbridge** — the mechanic units from
 * `docs/plans/chapter-natus-review.md` §9 (one per research row), with the
 * Review section's corrections and Bailey's answers (2026-09-24, "I'll go with
 * your recommendations for all").
 *
 * Every case pins one research claim against the real engine and the real
 * data. Nothing greps: hard rule 3 says prove it by running the engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The last describe block holds
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
  StatusInstance,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import * as rules from '../../../src/battle/ffx/ai/seymour-natus-rules.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import * as data from '../../../src/data/ffx/enemies/seymour-natus.ts';
import * as rows from '../../../src/data/ffx/enemies/seymour-natus-abilities.ts';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';
import { CHAPTERS } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES as FFX2_ABILITIES } from '../../../src/data/ffx2/index.ts';

const GROUP_ID = 'seymour-natus';
const NATUS = 'seymour-natus';
const MORT = 'mortibody';

/** Probe rows: exact damage (`fixed-no-variance`, type Other, so no Defense or Shell), and a Haste on everyone. */
function fixedHit(id: string, amount: number): AbilityDef {
  return {
    id, name: id, game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: amount / 50,
    formula: 'fixed-no-variance', damageType: 'other', element: ['none'], targeting: 'single-enemy',
    hits: 1, statusEffects: [], removesStatuses: [], flags: [], canMiss: false,
  };
}
const HIT_500 = fixedHit('test-hit-500', 500);
const HIT_1000 = fixedHit('test-hit-1000', 1_000);
const HIT_13000: AbilityDef = { ...fixedHit('test-hit-13000', 13_000), flags: ['always-break-damage-limit'] };

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES, HIT_500, HIT_1000, HIT_13000]);
content.addItems(Object.values(ITEMS));

function newEngine(seed = 1): ReturnType<typeof createFFXEngine> {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID];
  if (!group) throw new Error(`${GROUP_ID} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: highbridgeBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
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

/** Advance to the next player input and return it (enemy turns resolve on the way). */
function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('battle ended');
  }
  throw new Error('no player input');
}

function actor(engine: BattleEngine, id: string): FFXCombatant {
  return engine.state().combatants[id] as FFXCombatant;
}

function makeInvincible(engine: BattleEngine): void {
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (!c) continue;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

function status(id: StatusInstance['id']): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

function actions(log: readonly BattleEvent[], who: string): string[] {
  return log.filter((e) => e.type === 'action-start' && e.actorId === who).map((e) => (e as { abilityId: string }).abilityId);
}

function flags(engine: BattleEngine): Record<string, unknown> {
  return engine.state().flags as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Data against the research
// ---------------------------------------------------------------------------

describe('Seymour Natus and Mortibody — the stat blocks and the formation [research §1, §2]', () => {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID]!;
  const natus = group.enemies.find((e) => e.id === NATUS)!;
  const mort = group.enemies.find((e) => e.id === MORT)!;

  it('the formation is [Natus, Mortibody], cannot flee, and the ids the AI keys on match the data', () => {
    expect(group.enemies.map((e) => e.id)).toEqual([NATUS, MORT]);
    expect(group.canEscape).toBe(false);
    expect(rules.NATUS_ID).toBe(data.NATUS_ID);
    expect(rules.MORTIBODY_ID).toBe(data.MORTIBODY_ID);
    expect(rules.NATUS_SCRIPT).toBe(natus.aiScriptId);
    expect(rules.MORTIBODY_SCRIPT).toBe(mort.aiScriptId);
    expect(mort.flags).toMatchObject({ isPart: true, partOf: NATUS });
  });

  it('Natus: HP 36,000, Def 0, MDef 0, Mag 25, Agi 21; Poison 50 with a 4 % tick; the rewards', () => {
    expect(natus.stats).toMatchObject({ hp: 36_000, maxHp: 36_000, def: 0, mdef: 0, mag: 25, agi: 21, str: 30, mp: 200 });
    expect(natus.immunities.poison).toBe(50);
    expect(natus.poisonTickPercent).toBe(4);
    expect(natus.rewards).toMatchObject({ ap: 6_300, apOverkill: 9_450, gil: 3_500, overkillThreshold: 3_500 });
    expect(natus.rewards.steal?.common).toEqual({ itemId: 'tetra-elemental', count: 2 });
    expect(natus.rewards.steal?.rare).toEqual({ itemId: 'tetra-elemental', count: 3 });
    for (const s of ['petrify', 'slow', 'doom', 'magic-break', 'armor-break', 'mental-break', 'eject'] as const) {
      expect(natus.immunities[s], s).toBe(255);
    }
    expect(natus.immunityFlags).toEqual(expect.arrayContaining(['immune-to-delay', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-bribe']));
    expect(natus.threatenChance).toBe(0); // B10: immune until checked (N-3)
  });

  it('Mortibody: HP 4,000, Def 50, Agi 28, Luck 20 (decompile over wiki, N-4), Armor Break 50, Delay landable', () => {
    expect(mort.stats).toMatchObject({ hp: 4_000, def: 50, mag: 20, str: 22, agi: 28, luck: 20 });
    expect(mort.immunities['armor-break']).toBe(50);
    expect(mort.immunities.poison).toBe(255);
    expect(mort.immunityFlags).not.toContain('immune-to-delay');
    expect(mort.rewards.overkillThreshold).toBe(36_000);
  });

  it('the rows carry their decompiled numbers [research §3]', () => {
    for (const id of [rows.NATUS_MULTI_FIRA, rows.NATUS_MULTI_BLIZZARA, rows.NATUS_MULTI_THUNDARA, rows.NATUS_MULTI_WATERA]) {
      expect(rows.SEYMOUR_NATUS_ABILITIES[id]).toMatchObject({ power: 36, hits: 2, rank: 3, targeting: 'random-enemy', canMiss: false });
      expect(rows.SEYMOUR_NATUS_ABILITIES[id]?.flags).toContain('reflectable');
    }
    expect(rows.natusFlare).toMatchObject({ power: 60, rank: 5, shatterChance: 10, canMiss: false });
    expect(rows.natusBreak.statusEffects).toEqual([{ status: 'petrify', chance: 254, duration: 254 }]);
    expect(rows.natusBreak.flags).toContain('reflectable');
    for (const r of [rows.mortibodyFire, rows.mortibodyBlizzard, rows.mortibodyThunder, rows.mortibodyWater]) {
      expect(r).toMatchObject({ power: 16, targeting: 'all-enemies', shatterChance: 10, canMiss: false });
    }
    expect(rows.mortibodyShatteringClaw).toMatchObject({ power: 16, formula: 'strength', damageType: 'physical', shatterChance: 90, accuracy: 100 });
    expect(rows.mortibodyDesperado).toMatchObject({ power: 10, formula: 'fixed', damageType: 'other', targeting: 'all-enemies' });
    expect(rows.mortibodyCura).toMatchObject({ power: 40, formula: 'healing' });
    expect(rows.mortibodyCura.flags).toContain('reflectable');
  });
});

// ---------------------------------------------------------------------------
// Phase 1: the combo
// ---------------------------------------------------------------------------

describe('Phase 1 — the elemental combo [research §4.1, N-2, N-G3, N-G4]', () => {
  it('Mortibody walks Ice → Thunder → Water → Fire and Natus answers each time with the Multi-ra of the element it just cast', () => {
    const engine = newEngine(5);
    makeInvincible(engine);
    drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 6);
    const log = engine.state().log;
    expect(actions(log, MORT).slice(0, 6)).toEqual([
      'mortibody-blizzard', 'mortibody-thunder', 'mortibody-water', 'mortibody-fire', 'mortibody-blizzard', 'mortibody-thunder',
    ]);
    // Every Natus cast names the element of the Mortibody spell before it.
    let last: string | null = null;
    const pairs: [string | null, string][] = [];
    for (const e of log) {
      if (e.type !== 'action-start') continue;
      if (e.actorId === MORT) last = e.abilityId ?? null;
      if (e.actorId === NATUS) pairs.push([last, e.abilityId ?? '']);
    }
    const suffix: Record<string, string> = {
      'mortibody-blizzard': 'blizzara', 'mortibody-thunder': 'thundara', 'mortibody-water': 'watera', 'mortibody-fire': 'fira',
    };
    expect(pairs.length).toBeGreaterThan(2);
    for (const [m, n] of pairs) if (m) expect(n).toBe(`natus-multi-${suffix[m]}`);
  });

  it('if Natus moves before Mortibody has cast, he uses the rotation’s current element (N-1, our estimate)', () => {
    // Mortibody (Agility 28) opens on every seed; a Delay Buster on it before
    // its first turn is how Natus gets there first. Delay lands on Mortibody
    // (not Delay-immune, §2.2); on Natus it would fail (§1.3).
    let proved = false;
    for (let seed = 1; seed <= 40 && !proved; seed++) {
      const engine = newEngine(seed);
      makeInvincible(engine);
      drive(engine, (d) => {
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === 'delay-attack');
        return row && row.validTargets.includes(MORT) ? { kind: 'ability', id: 'delay-attack', targets: [MORT] } : defend();
      }, (e) => actions(e.state().log, NATUS).length + actions(e.state().log, MORT).length >= 1);
      const first = engine.state().log.find((e) => e.type === 'action-start' && (e.actorId === NATUS || e.actorId === MORT));
      if (first?.type === 'action-start' && first.actorId === NATUS) {
        expect(first.abilityId).toBe('natus-multi-blizzara');
        proved = true;
      }
    }
    expect(proved).toBe(true);
  });

  it('Multi-ra hits two different members when two or more are standing, and the same one when only one is', () => {
    let casts = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const engine = newEngine(seed);
      makeInvincible(engine);
      drive(engine, defend, (e) => actions(e.state().log, NATUS).length >= 3);
      const log = engine.state().log;
      for (let i = 0; i < log.length; i++) {
        const e = log[i]!;
        if (e.type !== 'action-start' || e.actorId !== NATUS || !(e.abilityId ?? '').startsWith('natus-multi')) continue;
        const end = log.findIndex((x, j) => j > i && x.type === 'action-end');
        const hit = log.slice(i, end).filter((x) => x.type === 'damage' && x.sourceId === NATUS).map((x) => (x as { targetId: string }).targetId);
        expect(hit.length).toBe(2);
        expect(hit[0]).not.toBe(hit[1]);
        casts++;
      }
    }
    expect(casts).toBeGreaterThan(20);

    // One member standing: both hits land on her.
    const engine = newEngine(3);
    makeInvincible(engine);
    for (const id of ['tidus', 'kimahri']) {
      const c = actor(engine, id);
      c.hp = 0; c.alive = false; c.statuses.ko = status('ko');
    }
    drive(engine, defend, (e) => actions(e.state().log, NATUS).length >= 1);
    const log = engine.state().log;
    const at = log.findIndex((x) => x.type === 'action-start' && x.actorId === NATUS);
    const end = log.findIndex((x, j) => j > at && x.type === 'action-end');
    const hit = log.slice(at, end).filter((x) => x.type === 'damage' && x.sourceId === NATUS).map((x) => (x as { targetId: string }).targetId);
    expect(hit).toEqual(['yuna', 'yuna']);
  });
});

// ---------------------------------------------------------------------------
// The phase rule
// ---------------------------------------------------------------------------

describe('The phase is stored and moves only on damage from an action [§4.2, the review’s "below"]', () => {
  it('a hit that leaves him at exactly 24,000 moves nothing; the next hit below it moves to phase 2 and fires Protect once', () => {
    const engine = newEngine(2);
    makeInvincible(engine);
    actor(engine, NATUS).hp = 24_500;
    let d = nextInput(engine);
    engine.submit({ kind: 'ability', id: HIT_500.id, targets: [NATUS] });
    expect(actor(engine, NATUS).hp).toBe(24_000);
    expect(flags(engine)[rules.NATUS_PHASE] ?? 1).toBe(1);
    d = nextInput(engine);
    const from = engine.state().log.length;
    engine.submit({ kind: 'ability', id: HIT_500.id, targets: [NATUS] });
    const after = engine.state().log.slice(from);
    expect(flags(engine)[rules.NATUS_PHASE]).toBe(2);
    expect(after.filter((e) => e.type === 'counter' && e.actorId === NATUS && e.abilityId === 'protect')).toHaveLength(1);
    expect(actor(engine, NATUS).statuses.protect).toBeDefined();
    // Once: a second hit below the line draws no second Protect.
    void d;
    nextInput(engine);
    const from2 = engine.state().log.length;
    engine.submit({ kind: 'ability', id: HIT_500.id, targets: [NATUS] });
    expect(engine.state().log.slice(from2).some((e) => e.type === 'counter')).toBe(false);
  });

  it('one hit across both lines moves straight to phase 3 and still fires the Protect once', () => {
    const engine = newEngine(4);
    makeInvincible(engine);
    actor(engine, NATUS).hp = 24_500;
    nextInput(engine);
    const from = engine.state().log.length;
    engine.submit({ kind: 'ability', id: HIT_13000.id, targets: [NATUS] });
    expect(actor(engine, NATUS).hp).toBe(11_500);
    expect(flags(engine)[rules.NATUS_PHASE]).toBe(3);
    expect(engine.state().log.slice(from).filter((e) => e.type === 'counter' && e.abilityId === 'protect')).toHaveLength(1);
  });

  it('Poison carrying him below 24,000 moves nothing until the next hit (the "Poison and wait" rule)', () => {
    const engine = newEngine(6);
    makeInvincible(engine);
    const natus = actor(engine, NATUS);
    natus.hp = 24_900;
    natus.statuses.poison = status('poison');
    drive(engine, defend, () => natus.hp < 24_000);
    // The tick is 4 % of 36,000.
    const tick = engine.state().log.filter((e) => e.type === 'damage' && e.targetId === NATUS).at(-1);
    expect(tick && tick.type === 'damage' ? tick.amount : 0).toBe(1_440);
    expect(natus.hp).toBe(23_460);
    // Several enemy turns later he is still in phase 1, still casting the combo.
    const from = engine.state().log.length;
    drive(engine, defend, (e) => actions(e.state().log.slice(from), NATUS).length >= 2);
    expect(flags(engine)[rules.NATUS_PHASE] ?? 1).toBe(1);
    for (const a of actions(engine.state().log.slice(from), NATUS)) expect(a.startsWith('natus-multi')).toBe(true);
    expect(engine.state().log.slice(from).some((e) => e.type === 'counter')).toBe(false);
    // The next hit, however small, moves him.
    nextInput(engine);
    engine.submit({ kind: 'ability', id: HIT_500.id, targets: [NATUS] });
    expect(flags(engine)[rules.NATUS_PHASE]).toBe(2);
  });

  it('his own Multi-ra bounced off a Reflected, Provoking member moves his phase (B8 = a, our estimate)', () => {
    let proved = false;
    for (let seed = 1; seed <= 40 && !proved; seed++) {
      const engine = newEngine(seed);
      makeInvincible(engine);
      const natus = actor(engine, NATUS);
      natus.hp = 24_200;
      actor(engine, 'tidus').statuses.reflect = status('reflect');
      natus.statuses.provoke = { ...status('provoke'), sourceId: 'tidus' };
      drive(engine, defend, (e) => actions(e.state().log, NATUS).length >= 1);
      const bouncedOntoHim = engine.state().log.some((e) => e.type === 'damage' && e.sourceId === NATUS && e.targetId === NATUS);
      if (!bouncedOntoHim) continue; // both bounces went to Mortibody on this seed
      expect(flags(engine)[rules.NATUS_PHASE]).toBe(2);
      expect(engine.state().log.some((e) => e.type === 'counter' && e.actorId === NATUS && e.abilityId === 'protect')).toBe(true);
      proved = true;
    }
    expect(proved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mortibsorption: Chapter X's own pair
// ---------------------------------------------------------------------------

describe('Mortibsorption — Mortibody drains Natus and comes back [§4.4, N-G1]', () => {
  it('a drain across 24,000 moves the phase and fires the Protect counter at once', () => {
    const engine = newEngine(7);
    makeInvincible(engine);
    actor(engine, NATUS).hp = 26_000;
    actor(engine, MORT).hp = 1;
    nextInput(engine);
    const from = engine.state().log.length;
    engine.submit({ kind: 'attack', targets: [MORT] });
    const after = engine.state().log.slice(from);
    expect(after.some((e) => e.type === 'message' && e.text === 'Mortibody uses Mortibsorption')).toBe(true);
    expect(actor(engine, NATUS).hp).toBe(22_000);
    expect(flags(engine)[rules.NATUS_PHASE]).toBe(2);
    expect(after.filter((e) => e.type === 'counter' && e.actorId === NATUS && e.abilityId === 'protect')).toHaveLength(1);
    expect(actor(engine, NATUS).statuses.protect).toBeDefined();
  });

  it('drains 4,000, 3,000, 2,000, 1,000, 1,000 and revives at the next value down (the engine reading, [derived])', () => {
    const engine = newEngine(8);
    makeInvincible(engine);
    const drains: number[] = [];
    for (let i = 0; i < 5; i++) {
      actor(engine, MORT).hp = 1;
      nextInput(engine);
      const before = actor(engine, NATUS).hp;
      engine.submit({ kind: 'attack', targets: [MORT] });
      drains.push(before - actor(engine, NATUS).hp);
      expect(actor(engine, MORT).hp).toBe(actor(engine, MORT).stats.maxHp);
    }
    expect(drains).toEqual([4_000, 3_000, 2_000, 1_000, 1_000]);
    expect(actor(engine, MORT).stats.maxHp).toBe(1_000);
  });

  it('a lethal drain wins the battle (it fires even when it kills him; the battle ends on Natus, N-10)', () => {
    const engine = newEngine(9);
    makeInvincible(engine);
    actor(engine, NATUS).hp = 3_000;
    actor(engine, MORT).hp = 1;
    nextInput(engine);
    engine.submit({ kind: 'attack', targets: [MORT] });
    expect(engine.state().result?.outcome).toBe('victory');
    expect(actor(engine, MORT).hp).toBeGreaterThan(0); // the body came back; it does not block victory
  });
});

// ---------------------------------------------------------------------------
// Phases 2 and 3, Break and shatter, Cura
// ---------------------------------------------------------------------------

describe('Phase 2 — Break and Shattering Claw [§4.1, §5]', () => {
  it('Natus casts Break and Mortibody the Claw every turn; the Claw shatters a petrified member at about 90 %', () => {
    let clawsOnStone = 0;
    let shattered = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const engine = newEngine(seed);
      makeInvincible(engine);
      flags(engine)[rules.NATUS_PHASE] = 2;
      actor(engine, 'kimahri').statuses.petrify = status('petrify');
      drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 1);
      const log = engine.state().log;
      expect(actions(log, MORT)[0]).toBe('mortibody-shattering-claw');
      for (const a of actions(log, NATUS)) expect(a).toBe('natus-break');
      const at = log.findIndex((x) => x.type === 'action-start' && x.actorId === MORT);
      const end = log.findIndex((x, j) => j > at && x.type === 'action-end');
      const slice = log.slice(at, end + 1);
      const hitKimahri = slice.some((x) => (x.type === 'damage' || x.type === 'miss') && x.targetId === 'kimahri');
      if (!hitKimahri || !slice.some((x) => x.type === 'damage' && x.targetId === 'kimahri')) continue;
      clawsOnStone++;
      if (slice.some((x) => x.type === 'status-add' && x.targetId === 'kimahri' && x.status === 'eject')) shattered++;
    }
    expect(clawsOnStone).toBeGreaterThan(15);
    const rate = shattered / clawsOnStone;
    expect(rate).toBeGreaterThan(0.75);
    expect(rate).toBeLessThan(1);
  });

  it('a shattered member is gone for the battle and no Switch refills the slot', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const engine = newEngine(seed);
      makeInvincible(engine);
      flags(engine)[rules.NATUS_PHASE] = 2;
      actor(engine, 'kimahri').statuses.petrify = status('petrify');
      drive(engine, defend, (e) => actor(e, 'kimahri').statuses.eject !== undefined || actions(e.state().log, MORT).length >= 1);
      if (actor(engine, 'kimahri').statuses.eject === undefined) continue;
      expect(actor(engine, 'kimahri').removed).toBe(true);
      // For the rest of a long run: Kimahri never takes a turn again, and every
      // Switch row offered swaps out the member whose turn it is — never the
      // hole Kimahri left (`commands.ts`: `outId` is always the acting member).
      const from = engine.state().log.length;
      let offered = 0;
      drive(engine, (d) => {
        for (const c of d.commands) {
          if (c.command.kind !== 'switch') continue;
          offered++;
          expect(c.command.extra).toMatchObject({ outId: d.actorId });
          expect(d.actorId).not.toBe('kimahri');
        }
        return defend();
      }, (e) => e.state().log.length - from > 400);
      expect(offered).toBeGreaterThan(0);
      expect(engine.state().log.slice(from).some((e) => e.type === 'turn-start' && e.actorId === 'kimahri')).toBe(false);
      expect(actor(engine, 'kimahri').statuses.eject).toBeDefined();
      return;
    }
    throw new Error('no seed shattered Kimahri');
  });

  it('Break reflected off a Reflected member misses both enemies: they are Petrify-immune', () => {
    const engine = newEngine(11);
    makeInvincible(engine);
    flags(engine)[rules.NATUS_PHASE] = 2;
    for (const id of engine.state().activeIds) actor(engine, id).statuses.reflect = status('reflect');
    drive(engine, defend, (e) => actions(e.state().log, NATUS).length >= 2);
    expect(actor(engine, NATUS).statuses.petrify).toBeUndefined();
    expect(actor(engine, MORT).statuses.petrify).toBeUndefined();
    for (const id of engine.state().activeIds) expect(actor(engine, id).statuses.petrify).toBeUndefined();
  });
});

describe('Phase 3 — Flare and Cura [§4.1, §4.3]', () => {
  it('Natus casts Flare (rank 5) and Mortibody casts Cura on him', () => {
    const engine = newEngine(12);
    makeInvincible(engine);
    flags(engine)[rules.NATUS_PHASE] = 3;
    actor(engine, NATUS).hp = 10_000;
    drive(engine, defend, (e) => actions(e.state().log, NATUS).length >= 2 && actions(e.state().log, MORT).length >= 2);
    const log = engine.state().log;
    expect(new Set(actions(log, NATUS))).toEqual(new Set(['natus-flare']));
    expect(new Set(actions(log, MORT))).toEqual(new Set(['mortibody-cura']));
    // A heal is a negative `damage` event; §3.3: 1,200 (1,125-1,270) at Magic 20.
    const heals = log.filter((e) => e.type === 'damage' && e.sourceId === MORT && e.amount < 0);
    expect(heals.length).toBeGreaterThan(0);
    for (const h of heals) if (h.type === 'damage') {
      expect(h.targetId).toBe(NATUS);
      expect(-h.amount).toBeGreaterThanOrEqual(1_125);
      expect(-h.amount).toBeLessThanOrEqual(1_270);
    }
  });

  it('a Reflect on Natus bounces Mortibody’s Cura onto the party (strategy 5)', () => {
    const engine = newEngine(13);
    makeInvincible(engine);
    flags(engine)[rules.NATUS_PHASE] = 3;
    actor(engine, NATUS).hp = 10_000;
    actor(engine, NATUS).statuses.reflect = status('reflect');
    drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 1);
    const heals = engine.state().log.filter((e) => e.type === 'damage' && e.sourceId === MORT && e.amount < 0);
    expect(heals.length).toBeGreaterThan(0);
    for (const h of heals) if (h.type === 'damage') expect(['tidus', 'yuna', 'kimahri']).toContain(h.targetId);
    expect(actor(engine, NATUS).hp).toBe(10_000);
  });
});

// ---------------------------------------------------------------------------
// Banish, Desperado, Talk, and what fails
// ---------------------------------------------------------------------------

describe('Banish, Desperado and Talk [§4.3, §6.2]', () => {
  it('an aeon gets exactly one turn, then Natus Banishes it', () => {
    const engine = newEngine(14);
    makeInvincible(engine);
    drive(engine, (d) => {
      if (d.actorId === 'yuna' && !engine.state().aeonId && !engine.state().log.some((e) => e.type === 'summon')) {
        return { kind: 'summon', id: 'ifrit', targets: [] };
      }
      return defend();
    }, (e) => e.state().log.some((x) => x.type === 'action-start' && x.actorId === NATUS && x.abilityId === 'banish'));
    const log = engine.state().log;
    const summoned = log.findIndex((e) => e.type === 'summon');
    const banished = log.findIndex((e) => e.type === 'action-start' && e.actorId === NATUS && e.abilityId === 'banish');
    expect(summoned).toBeGreaterThan(-1);
    expect(banished).toBeGreaterThan(summoned);
    const aeonTurns = log.slice(summoned, banished).filter((e) => e.type === 'turn-start' && e.actorId === 'ifrit').length;
    expect(aeonTurns).toBe(1);
    expect(engine.state().aeonId).toBeNull();
  });

  it('Haste on all three active members calls Desperado: 468-529 to each, the §3.2 strip list, Shell ignored', () => {
    const engine = newEngine(15);
    makeInvincible(engine);
    for (const id of engine.state().activeIds) {
      const c = actor(engine, id);
      for (const s of ['haste', 'shell', 'protect', 'regen', 'nulblaze'] as const) c.statuses[s] = status(s);
    }
    drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 1);
    const log = engine.state().log;
    expect(actions(log, MORT)[0]).toBe('mortibody-desperado');
    const hits = log.filter((e) => e.type === 'damage' && e.sourceId === MORT);
    expect(hits).toHaveLength(3);
    for (const h of hits) if (h.type === 'damage') {
      expect(h.amount).toBeGreaterThanOrEqual(468);
      expect(h.amount).toBeLessThanOrEqual(529);
    }
    for (const id of engine.state().activeIds) {
      const c = actor(engine, id);
      for (const s of ['haste', 'shell', 'protect', 'regen', 'nulblaze'] as const) expect(c.statuses[s], `${id} ${s}`).toBeUndefined();
    }
  });

  it('Haste on two is safe (strategy 7): no Desperado', () => {
    const engine = newEngine(15);
    makeInvincible(engine);
    for (const id of engine.state().activeIds.slice(0, 2)) actor(engine, id).statuses.haste = status('haste');
    drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 3);
    expect(actions(engine.state().log, MORT)).not.toContain('mortibody-desperado');
  });

  it('Talk: Tidus and Auron +10 Strength, Yuna +10 Magic Defense, once each; Kimahri has no line', () => {
    const engine = newEngine(16);
    makeInvincible(engine);
    const before = { tidus: actor(engine, 'tidus').stats.str, yuna: actor(engine, 'yuna').stats.mdef };
    const talked = new Set<string>();
    drive(engine, (d) => {
      const talk = d.commands.find((c) => c.command.kind === 'trigger' && 'id' in c.command && c.command.id === 'talk');
      if (d.actorId === 'kimahri') expect(talk?.enabled ?? false).toBe(false);
      if (talk?.enabled && !talked.has(d.actorId)) {
        talked.add(d.actorId);
        return talk.command;
      }
      if (talked.has(d.actorId)) expect(talk?.enabled ?? false).toBe(false);
      return defend();
    }, () => talked.has('tidus') && talked.has('yuna') && engine.state().log.filter((e) => e.type === 'turn-start' && e.actorId === 'yuna').length >= 2);
    expect(actor(engine, 'tidus').stats.str).toBe(before.tidus + 10);
    expect(actor(engine, 'yuna').stats.mdef).toBe(before.yuna + 10);
    expect(rules.NATUS_TALK_BONUS).toEqual({
      tidus: { stat: 'str', amount: 10, label: 'Strength' },
      auron: { stat: 'str', amount: 10, label: 'Strength' },
      yuna: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
    });
  });

  it('Threaten and Magic Break fail on Natus, and nobody can flee', () => {
    const engine = newEngine(17);
    makeInvincible(engine);
    const d = nextInput(engine);
    // Whoever is up casts the probes through the engine; the rows need not be in their menu.
    void d;
    const plan: Command[] = [
      { kind: 'ability', id: 'threaten', targets: [NATUS] },
      { kind: 'ability', id: 'magic-break', targets: [NATUS] },
      { kind: 'escape', targets: [], extra: { mode: 'party' } },
    ];
    engine.submit(plan[0]!);
    let i = 1;
    drive(engine, () => plan[i++] ?? defend(), () => i > plan.length);
    expect(actor(engine, NATUS).statuses.threaten).toBeUndefined();
    expect(actor(engine, NATUS).statuses['magic-break']).toBeUndefined();
    expect(engine.state().result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Absence tests [AGENTS.md rule 14, CHK-021]
// ---------------------------------------------------------------------------

describe('FFX only: nothing here reaches another chapter or FFX-2', () => {
  it('only Natus’s Multi-ra carries distinct targets per hit; no other formation runs a Natus script', () => {
    const distinct = ALL_ABILITIES.filter((a) => a.extra?.['distinctTargetsPerHit'] === true).map((a) => a.id).sort();
    expect(distinct).toEqual(['natus-multi-blizzara', 'natus-multi-fira', 'natus-multi-thundara', 'natus-multi-watera']);
    expect(FFX2_ABILITIES.some((a) => a.extra?.['distinctTargetsPerHit'] !== undefined)).toBe(false);
    for (const [id, group] of Object.entries(ENEMY_GROUPS_BY_ID)) {
      if (id === GROUP_ID) continue;
      for (const e of group.enemies) expect(rules.isNatusScript(e.aiScriptId), `${id}/${e.id}`).toBe(false);
    }
  });

  it('every other FFX chapter keeps its natus.* flags empty through a seeded run', () => {
    for (const ch of CHAPTERS.filter((c) => c.game === 'ffx')) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: ch.buildRef as typeof highbridgeBuild, enemies: ch.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      drive(engine, defend, (e) => e.state().turn > 40);
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('natus.')), ch.id).toEqual([]);
    }
  });
});
