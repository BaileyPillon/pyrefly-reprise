/**
 * Enemy intent, engine side — `src/battle/ffx/intent.ts`,
 * `src/battle/ffx2/intent.ts` and the `src/battle/ffx/estimate.ts` adapter.
 *
 * The panel these back makes one claim the player will act on: *this is the
 * move that is coming, and this is what it will do to you.* Three things have
 * to be true for that claim to be safe, and this file is each of them as an
 * assertion.
 *
 * 1. **Asking must not answer.** Every FFX rotation is stateful — Seymour's
 *    six-step cycle in `state.flags`, Yunalesca's `priv0004` in her AI memory,
 *    the Mortiorchis's charge ladder in both — so a prediction that called the
 *    script for real would advance the fight once per render. The first
 *    describe block snapshots the whole live context and compares it after.
 * 2. **The prediction must match the research.** Not "some ability comes back":
 *    the *shipped rotation's* ability, on the turn the research puts it.
 * 3. **The countdown must be the real countdown.** Total Annihilation is the
 *    encounter's clock, and a panel that printed the wrong number of turns is
 *    worse than one that printed none.
 *
 * DOM, the E key, the preference and the layout are in
 * `tests/unit/ui-enemy-intent.test.ts` — this file never touches a document.
 */

import { describe, expect, it } from 'vitest';
import type {
  BattleEvent,
  BattleSetup,
  Command,
  Decision,
  EnemyGroupDef,
  FFXCombatant,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, buildBattle, createFFXEngine } from '../../src/battle/ffx/index.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import {
  cloneCtx,
  describeAbility,
  predictEnemyIntent,
  predictEnemyIntents,
  predictNextEnemyIntent,
  statusWord,
} from '../../src/battle/ffx/intent.ts';
import { statusOdds } from '../../src/battle/ffx/estimate.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import {
  type Ffx2IntentEnv,
  predictFFX2EnemyIntent,
} from '../../src/battle/ffx2/intent.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

/**
 * The bundle `FFX2Engine.intent()` hands its predictor, rebuilt from outside so
 * a test can pin one enemy rather than whichever the gauges put first.
 */
function intentEnv(engine: FFX2Engine): Ffx2IntentEnv {
  return {
    state: engine.state(),
    rng: new SeededRng(engine.state().seed),
    snapshot: engine.gaugeSnapshot(),
  };
}

function liveContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities(ALL_ABILITIES);
  reg.addItems(Object.values(ITEMS));
  return reg;
}

function groupOf(id: string): EnemyGroupDef {
  const group = ENEMY_GROUPS_BY_ID[id];
  if (!group) throw new Error(`${id} group missing from the data layer`);
  return group;
}

/** A live engine context, built exactly as `FFXEngine.init` builds one. */
function realCtx(groupId: string, seed: number, party = gagazetBuild): { ctx: Ctx; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  let seq = 0;
  const ctx = buildBattle(
    {
      game: 'ffx',
      party,
      enemies: groupOf(groupId),
      triggers: [],
      seed,
      condition: 'scripted',
      canEscape: false,
    },
    new SeededRng(seed),
    liveContent(),
    (e) => {
      events.push({ ...e, seq: seq++ } as BattleEvent);
    },
  );
  return { ctx, events };
}

/**
 * Everything a dry run could possibly move, as one comparable string.
 *
 * The public state plus the *private* runtime: AI memory, CTB counters, the
 * charge ladder and the RNG stream position. A prediction that advanced any one
 * of them would be a prediction the player pays for.
 */
function fingerprint(ctx: Ctx): string {
  const runtimes = [...ctx.rt.actors.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, r]) => [id, r.ctb, r.turnsTaken, r.charge, r.ai, r.abilityIds, r.stealCount]);
  return JSON.stringify({
    state: ctx.state,
    runtimes,
    rng: ctx.rng.saveState(),
    lastEnemyActorId: ctx.rt.lastEnemyActorId,
    inventory: [...ctx.rt.inventory.entries()].sort(),
  });
}

// ---------------------------------------------------------------------------

describe('a dry run never touches the live battle', () => {
  it('leaves state, AI memory, CTB counters and the RNG stream exactly as it found them', () => {
    const { ctx } = realCtx('seymour-flux', 7);
    const before = fingerprint(ctx);

    // Ten predictions in a row is the realistic load: the HUD refreshes once
    // per playback step, and a long turn has several.
    for (let i = 0; i < 10; i++) {
      expect(predictNextEnemyIntent(ctx)).not.toBeNull();
      predictEnemyIntents(ctx);
    }

    expect(fingerprint(ctx)).toBe(before);
  });

  it('holds for Yunalesca, whose whole cycle lives in per-actor AI memory', () => {
    const { ctx } = realCtx('yunalesca', 3, zanarkandBuild);
    const her = ctx.state.combatants['yunalesca'] as FFXCombatant;
    expect(her).toBeDefined();
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 1;
    const before = fingerprint(ctx);

    for (let i = 0; i < 10; i++) predictEnemyIntent(ctx, 'yunalesca');

    expect(fingerprint(ctx)).toBe(before);
    expect(ctx.rt.actors.get('yunalesca')!.ai['priv0004']).toBe(1);
  });

  it("cloneCtx's copy can be scribbled on without the original noticing", () => {
    const { ctx } = realCtx('seymour-flux', 11);
    const before = fingerprint(ctx);
    const { ctx: clone, events } = cloneCtx(ctx);

    clone.state.flags['seymour.p1Step'] = 5;
    clone.rt.actors.get('seymour-flux')!.ai['scribble'] = 1;
    (clone.state.combatants['tidus'] as FFXCombatant).hp = 1;
    clone.rng.int(0, 99);
    clone.emit({ type: 'message', text: 'never reaches the log', kind: 'system' });

    expect(fingerprint(ctx)).toBe(before);
    expect(events).toHaveLength(1);
    // The log is shared by reference on purpose (it is the largest thing in a
    // late state and no script writes to it), so an emitted event must land in
    // the collector and *not* be appended to the battle's own log.
    expect(ctx.state.log.some((e) => e.type === 'message' && e.text === 'never reaches the log')).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('the predicted opener matches the shipped rotation', () => {
  it('Seymour Flux opens phase 1 with Lance of Atrophy [ffx-seymour-flux §4.2]', () => {
    // §4.2's six-step cycle puts Seymour on the even steps: 0 and 2 are Lance
    // of Atrophy, 4 is the party-wide Dispel.
    const { ctx } = realCtx('seymour-flux', 5);
    const intent = predictEnemyIntent(ctx, 'seymour-flux');
    expect(intent?.abilityId).toBe('lance-of-atrophy');
    expect(intent?.moveName).toBe('Lance of Atrophy');
    expect(intent?.confidence).toBe('scripted');
  });

  it('the Mortiorchis opens on its own parity with Full-Life [ffx-seymour-flux §4.2]', () => {
    // The mount owns the odd steps, and `stepFor` snaps the shared counter to
    // the actor's own parity — which is the fix that stopped it opening with
    // Cross Cleave on every turn.
    const { ctx } = realCtx('seymour-flux', 5);
    const intent = predictEnemyIntent(ctx, 'mortiorchis');
    expect(intent?.abilityId).toBe('full-life');
  });

  it('Seymour reaches Dispel on step 4 and the mount reaches Cross Cleave on step 5', () => {
    const { ctx } = realCtx('seymour-flux', 5);
    ctx.state.flags['seymour.p1Step'] = 4;
    expect(predictEnemyIntent(ctx, 'seymour-flux')?.abilityId).toBe('dispel');
    ctx.state.flags['seymour.p1Step'] = 5;
    expect(predictEnemyIntent(ctx, 'mortiorchis')?.abilityId).toBe('cross-cleave');
  });

  it('Yunalesca Form III reaches Mega Death at step 4 of the five-step ring [ffx-yunalesca §5.3]', () => {
    // §5.3: two weighted steps, a forced Mind Blast at 2, one more weighted
    // step, then Mega Death at 4 — whose case assigns 0 rather than
    // incrementing, which is what closes the ring.
    const { ctx } = realCtx('yunalesca', 3, zanarkandBuild);
    const her = ctx.state.combatants['yunalesca'] as FFXCombatant;
    her.enemy!.formIndex = 2;
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 4;

    const intent = predictEnemyIntent(ctx, 'yunalesca');
    expect(intent?.abilityId).toBe('mega-death');
    expect(intent?.moveName).toBe('Mega Death');
    // The ring's Mega Death step has no RNG branch in it at all.
    expect(intent?.confidence).toBe('scripted');
  });

  it('Form III step 2 is the forced Mind Blast, and step 0 is the weighted branch', () => {
    const { ctx } = realCtx('yunalesca', 3, zanarkandBuild);
    const her = ctx.state.combatants['yunalesca'] as FFXCombatant;
    her.enemy!.formIndex = 2;

    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 2;
    expect(predictEnemyIntent(ctx, 'yunalesca')?.abilityId).toBe('mind-blast');

    // Step 0 is `weightedStep`: a real coin-flip between Hellbiter and a heal,
    // so the panel must say "likely" and show the odds rather than state it.
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 0;
    const weighted = predictEnemyIntent(ctx, 'yunalesca', { samples: 64 });
    expect(weighted?.confidence).toBe('likely');
    expect(weighted!.branches.length).toBeGreaterThan(1);
    // PR-0123: largest-remainder rounding (`roundSharesTo100`) guarantees this
    // exactly, not merely approximately — a printed distribution that adds up
    // to 101 is a defect, not a rounding nicety.
    const sum = weighted!.branches.reduce((n, b) => n + b.percent, 0);
    expect(sum).toBe(100);
    expect(weighted!.branches.map((b) => b.abilityId)).toContain('hellbiter');
    // The badge answers for the move actually rolled, so that move's own
    // label always has an entry to look up (`EnemyIntent.ts confidenceHtml`).
    expect(weighted!.branches.find((b) => b.label === weighted!.moveName)).toBeDefined();
  });

  it('a one-sample prediction is never reported as scripted by accident', () => {
    // With a single sample every branch looks deterministic, so the panel would
    // state a coin flip as fact. The sampler's default is what stops that; this
    // pins the relationship rather than the number.
    const { ctx } = realCtx('yunalesca', 3, zanarkandBuild);
    const her = ctx.state.combatants['yunalesca'] as FFXCombatant;
    her.enemy!.formIndex = 2;
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 0;
    expect(predictEnemyIntent(ctx, 'yunalesca', { samples: 1 })?.confidence).toBe('scripted');
    expect(predictEnemyIntent(ctx, 'yunalesca')?.confidence).toBe('likely');
  });
});

// ---------------------------------------------------------------------------

describe('charge countdowns', () => {
  /** Phase 2, no aeon: the mount is on the Total Annihilation ladder [§4.4.2]. */
  function phaseTwo(seed = 9): Ctx {
    const { ctx } = realCtx('seymour-flux', seed);
    const host = ctx.state.combatants['seymour-flux'] as FFXCombatant;
    host.hp = Math.floor(host.stats.maxHp / 4); // below 50% -> phase 2
    ctx.state.flags['seymour.phase'] = 2;
    return ctx;
  }

  it('the first Total Annihilation costs two charge turns, and the panel counts them down', () => {
    const ctx = phaseTwo();
    // Turn one of the ladder: `required` 2, `turns` 0 -> one turn still owed.
    const first = predictEnemyIntent(ctx, 'mortiorchis');
    expect(first?.kind).toBe('charge');
    expect(first?.charge).toEqual(
      expect.objectContaining({ name: 'Auto-Attack Mode', turnsLeft: 1, stage: 1 }),
    );
    expect(first?.charge?.payloadName).toBe('Total Annihilation');
    expect(first?.moveName).toBe('Total Annihilation');

    // Turn two: the second charge turn, stage 2, and the payload lands next.
    ctx.state.flags['seymour.chargeTurns'] = 1;
    const second = predictEnemyIntent(ctx, 'mortiorchis');
    expect(second?.charge).toEqual(
      expect.objectContaining({ name: 'Ready To Annihilate', turnsLeft: 0, stage: 2 }),
    );

    // Ladder full: the move itself.
    ctx.state.flags['seymour.chargeTurns'] = 2;
    const fires = predictEnemyIntent(ctx, 'mortiorchis');
    expect(fires?.kind).toBe('action');
    expect(fires?.abilityId).toBe('total-annihilation');
  });

  it('every later Total Annihilation costs one charge turn, not two [§4.4.2]', () => {
    const ctx = phaseTwo();
    ctx.state.flags['seymour.hasAnnihilated'] = true;
    ctx.state.flags['seymour.chargeRequired'] = 1;
    ctx.state.flags['seymour.chargeTurns'] = 0;
    const intent = predictEnemyIntent(ctx, 'mortiorchis');
    expect(intent?.charge?.turnsLeft).toBe(0);
    expect(intent?.charge?.stage).toBe(2);
  });

  it('prices what the countdown lands on, not the dead turn it is spending', () => {
    // "This turn does nothing" is the least useful thing the panel could say
    // with Total Annihilation two turns out, so a charge turn describes and
    // costs the **payload** against the board the player is standing on.
    const ctx = phaseTwo();
    const intent = predictEnemyIntent(ctx, 'mortiorchis');
    expect(intent?.kind).toBe('charge');
    expect(intent?.abilityId).toBe('total-annihilation');
    expect(intent?.description).toContain('5 hits');
    expect(intent?.estimate?.perTarget.length).toBeGreaterThanOrEqual(3);
    for (const row of intent!.estimate!.perTarget) expect(row.amount).toBeGreaterThan(0);
  });

  it('an aeon on the field holds the ladder — the charge is postponed, not lost', () => {
    const ctx = phaseTwo();
    const before = ctx.state.flags['seymour.chargeTurns'];
    ctx.state.aeonId = 'valefor';
    // With no aeon actually built into this fixture the mount still refuses to
    // charge, which is the mechanic: summoning stalls it.
    const intent = predictEnemyIntent(ctx, 'mortiorchis');
    expect(intent?.kind).not.toBe('action');
    expect(ctx.state.flags['seymour.chargeTurns']).toBe(before);
  });
});

// ---------------------------------------------------------------------------

describe('the damage estimate', () => {
  it('puts a real, banded figure on every party member Total Annihilation reaches', () => {
    const ctx = (() => {
      const { ctx: c } = realCtx('seymour-flux', 9);
      const host = c.state.combatants['seymour-flux'] as FFXCombatant;
      host.hp = Math.floor(host.stats.maxHp / 4);
      c.state.flags['seymour.phase'] = 2;
      c.state.flags['seymour.chargeTurns'] = 2;
      return c;
    })();

    const intent = predictEnemyIntent(ctx, 'mortiorchis');
    expect(intent?.abilityId).toBe('total-annihilation');
    const est = intent?.estimate;
    expect(est).toBeTruthy();
    // Party-wide: every living active member gets a row.
    expect(est!.perTarget.length).toBeGreaterThanOrEqual(3);
    for (const row of est!.perTarget) {
      expect(row.amount).toBeGreaterThan(0);
      expect(row.min).toBeLessThanOrEqual(row.amount);
      expect(row.max).toBeGreaterThanOrEqual(row.amount);
      expect(row.hpFraction).toBeGreaterThan(0);
    }
    expect(est!.totalHarmToParty).toBeGreaterThan(0);
  });

  it('Mega Death reads as lethal for a living character and blocked for a Zombie', () => {
    // The single most important number this panel can print in Chapter 2.
    const { ctx } = realCtx('yunalesca', 3, zanarkandBuild);
    const her = ctx.state.combatants['yunalesca'] as FFXCombatant;
    her.enemy!.formIndex = 2;
    ctx.rt.actors.get('yunalesca')!.ai['priv0004'] = 4;

    const victim = ctx.state.combatants[ctx.state.activeIds[0]!] as FFXCombatant;
    const megaDeath = ALL_ABILITIES.find((a) => a.id === 'mega-death')!;
    const app = megaDeath.statusEffects[0]!;
    expect(statusOdds(victim, app)).toEqual({ status: 'ko', percent: 100, blocked: false });

    victim.statuses['zombie'] = {
      id: 'zombie',
      turnsRemaining: 255,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: true,
    };
    expect(statusOdds(victim, app)).toEqual({ status: 'ko', percent: 0, blocked: true });

    const intent = predictEnemyIntent(ctx, 'yunalesca');
    expect(intent?.statusText.some((t) => t.startsWith('Death'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('the written half', () => {
  it('describes an action from its own record rather than from a prose table', () => {
    const totalAnnihilation = ALL_ABILITIES.find((a) => a.id === 'total-annihilation')!;
    const text = describeAbility(totalAnnihilation);
    expect(text).toContain('Magical');
    expect(text).toContain('the whole party');
    expect(text).toContain('5 hits');
    expect(text).toContain('never misses');
  });

  it('names Death rather than printing the raw `ko` id', () => {
    expect(statusWord('ko')).toBe('Death');
    expect(statusWord('power-break')).toBe('Power Break');
  });

  it("lists Yunalesca's Form I counters, including the gate bug that turns them off", () => {
    const { ctx } = realCtx('yunalesca', 3, zanarkandBuild);
    const intent = predictEnemyIntent(ctx, 'yunalesca');
    const counters = intent!.counters.join(' ');
    expect(counters).toContain('Blind');
    expect(counters).toContain('Silence');
    expect(counters).toContain('Sleep');
    expect(counters).toContain('ffx-yunalesca §5.1');
  });

  it("lists Seymour's Delay punish, and his Banish only while an aeon is out", () => {
    const { ctx } = realCtx('seymour-flux', 5);
    expect(predictEnemyIntent(ctx, 'seymour-flux')!.counters.join(' ')).toContain('Slowga');
    expect(predictEnemyIntent(ctx, 'seymour-flux')!.counters.join(' ')).not.toContain('Banish');
    ctx.state.aeonId = 'valefor';
    expect(predictEnemyIntent(ctx, 'seymour-flux')!.counters.join(' ')).toContain('Banish');
  });

  it("names the next form's opener once the current one is nearly done [ffx-yunalesca §1.3]", () => {
    const { ctx } = realCtx('yunalesca', 3, zanarkandBuild);
    const her = ctx.state.combatants['yunalesca'] as FFXCombatant;
    expect(predictEnemyIntent(ctx, 'yunalesca')!.formNote).toBeNull();

    her.hp = Math.floor(her.stats.maxHp * 0.05);
    const note = predictEnemyIntent(ctx, 'yunalesca')!.formNote;
    // I -> II is Metamorphosis then Hellbiter on the whole party.
    expect(note).toContain('Hellbiter');
  });

  it('reports the boss Overdrive gauge Chapter 3 is built around [ffx-bfa-yu-yevon §1.6]', () => {
    const { ctx } = realCtx('braskas-final-aeon', 4, zanarkandBuild);
    ctx.state.flags['bfa.gauge'] = 80;
    const intent = predictEnemyIntent(ctx, 'braskas-final-aeon');
    expect(intent).not.toBeNull();
    expect(intent!.notes.join(' ')).toContain('Overdrive 80/100');
  });
});

// ---------------------------------------------------------------------------

describe('through the engine facade', () => {
  it('FFXEngine.intent() names the enemy the CTB forecast puts first', () => {
    const engine = createFFXEngine({ content: liveContent(), autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: gagazetBuild,
      enemies: groupOf('seymour-flux'),
      triggers: [],
      seed: 12,
      condition: 'scripted',
      canEscape: false,
    });

    const intent = engine.intent();
    expect(intent).not.toBeNull();
    const firstEnemyRow = engine.predictTurnOrder(8).find((row) => !row.isParty);
    expect(intent!.enemyId).toBe(firstEnemyRow?.actorId);
    expect(intent!.turnsAway).toBeGreaterThanOrEqual(0);
  });

  it('asking the engine repeatedly does not move the battle on', () => {
    const engine = createFFXEngine({ content: liveContent(), autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: gagazetBuild,
      enemies: groupOf('seymour-flux'),
      triggers: [],
      seed: 12,
      condition: 'scripted',
      canEscape: false,
    });
    const before = JSON.stringify(engine.state());
    for (let i = 0; i < 5; i++) engine.intent();
    expect(JSON.stringify(engine.state())).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// FFX-2
// ---------------------------------------------------------------------------

describe('FFX-2 intent', () => {
  function bahamutEngine(seed = 1): FFX2Engine {
    const engine = new FFX2Engine({ minigames: false });
    engine.init(bahamutSetup(seed));
    return engine;
  }

  it("names Bahamut's opener — Curse, step 1 of the fixed 12-action loop [ffx2-bahamut §2.1]", () => {
    const engine = bahamutEngine();
    const intent = engine.intent();
    expect(intent?.enemyId).toBe('bahamut');
    expect(intent?.abilityId).toBe('bahamut-curse');
    // No RNG branch anywhere in the loop: the panel may state it flatly.
    expect(intent?.confidence).toBe('scripted');
  });

  it('counts the five dead turns down to Mega Flare, and never as a clock', () => {
    const engine = bahamutEngine();
    const unit = engine.state().combatants['bahamut'] as Ffx2Unit;

    // Step 7 is the first countdown turn: five dead turns, then Mega Flare.
    unit.aiMemory = { actions: 6 };
    const first = predictFFX2EnemyIntent(intentEnv(engine), 'bahamut');
    expect(first?.kind).toBe('charge');
    expect(first?.charge?.turnsLeft).toBe(5);
    expect(first?.charge?.payloadName).toBe('Mega Flare');
    expect(first?.moveName).toBe('Mega Flare');

    // Step 11 is the last of them.
    unit.aiMemory = { actions: 10 };
    expect(predictFFX2EnemyIntent(intentEnv(engine), 'bahamut')?.charge?.turnsLeft).toBe(1);

    // Step 12 is the move itself.
    unit.aiMemory = { actions: 11 };
    const fires = predictFFX2EnemyIntent(intentEnv(engine), 'bahamut');
    expect(fires?.kind).toBe('action');
    expect(fires?.abilityId).toBe('mega-flare');
  });

  it('never advances the loop by being asked', () => {
    const engine = bahamutEngine();
    const unit = engine.state().combatants['bahamut'] as Ffx2Unit;
    unit.aiMemory = { actions: 3 };
    const before = JSON.stringify(engine.state());

    for (let i = 0; i < 10; i++) engine.intent();

    expect(JSON.stringify(engine.state())).toBe(before);
    expect(unit.aiMemory['actions']).toBe(3);
  });

  it('prices Mega Flare while the countdown is still running', () => {
    const engine = bahamutEngine();
    const unit = engine.state().combatants['bahamut'] as Ffx2Unit;
    unit.aiMemory = { actions: 6 }; // step 7: the first of five dead turns
    const intent = predictFFX2EnemyIntent(intentEnv(engine), 'bahamut');
    expect(intent?.kind).toBe('charge');
    expect(intent?.abilityId).toBe('mega-flare');
    expect(intent?.estimate?.perTarget.length).toBeGreaterThanOrEqual(1);
    for (const row of intent!.estimate!.perTarget) expect(row.amount).toBeGreaterThan(0);
    // One countdown, one number: the note carries the rule and not a second,
    // one-higher figure read off the last charge that actually fired.
    expect(intent!.notes.join(' ')).toContain('action counter, not a clock');
    expect(intent!.notes.join(' ')).not.toMatch(/countdown at \d/);
  });

  it('prints the countdown the player can already see, not the one turn ahead', () => {
    // The dry run's own charge is what the *next* turn will announce, one lower
    // than the number on screen. Two countdowns for one move on one screen is
    // the failure this guards.
    const engine = bahamutEngine();
    const unit = engine.state().combatants['bahamut'] as Ffx2Unit;
    unit.aiMemory = { actions: 7 }; // step 8 -> would announce 4
    const state = engine.state() as { log: unknown[]; nextSeq: number };
    state.log.push({ type: 'charge', enemyId: 'bahamut', name: '5', turnsLeft: 5, stage: 1, seq: state.nextSeq++ });

    const intent = predictFFX2EnemyIntent(intentEnv(engine), 'bahamut');
    expect(intent?.charge?.turnsLeft).toBe(5);
  });

  it('estimates Impulse against every girl it reaches', () => {
    const engine = bahamutEngine();
    const unit = engine.state().combatants['bahamut'] as Ffx2Unit;
    unit.aiMemory = { actions: 4 }; // step 5: Impulse, 3/8 of current HP, party-wide
    const intent = predictFFX2EnemyIntent(intentEnv(engine), 'bahamut');
    expect(intent?.abilityId).toBe('impulse');
    expect(intent?.estimate?.perTarget.length).toBeGreaterThanOrEqual(1);
    for (const row of intent!.estimate!.perTarget) expect(row.amount).toBeGreaterThan(0);
  });
});

// ---------------------------------- PR-0123: the real Chapter 5 link 3 case

/**
 * Round 09's capture, reproduced against the shipped rotation rather than a
 * crafted `IntentView` — the same registries `BattleScreenContent.ts` injects,
 * the same chain-advance helper the battle screen calls between links, and the
 * intended strategy driving every earlier decision, exactly as
 * `strategy-ffx2-vegnagun-shuyin.test.ts` walks the whole chain. **Case:
 * FFX-2 only** — the chain, its data tables and `setupForNextLink` are all
 * X-2 (AGENTS.md rule 14); the fix itself is shared (see the "both games"
 * tests in `ui-enemy-intent.test.ts`).
 */
function ffx2EngineOptions() {
  return {
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
    minigames: false,
  };
}

function chainFallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** Drive the Vegnagun chain to link 3's (Body/Bulwarks) first menu, seed 1. */
function bulwarkIntentAtLink3(): ReturnType<FFX2Engine['intent']> {
  const seed = 1;
  const engine = new FFX2Engine(ffx2EngineOptions());
  const first = ffx2Data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[0]!];
  if (!first) throw new Error('the Vegnagun chain is missing from the data layer');
  let setup: BattleSetup = {
    game: 'ffx2',
    party: farplaneBuild,
    enemies: first,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  let group: EnemyGroupDef = first;
  let linkIndex = 0;
  for (let i = 0; i < 200_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      const nextId = group.nextGroupId;
      if (d.result.outcome !== 'victory' || !nextId) {
        throw new Error(`chain stopped before link 3 (outcome ${d.result.outcome})`);
      }
      const next = ffx2Data.ENEMY_GROUPS_BY_ID[nextId];
      if (!next) throw new Error(`chain points at "${nextId}" but no formation exports that id`);
      setup = setupForNextLink(setup, next, engine.state(), seed + ++linkIndex);
      group = next;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (linkIndex === 2) return engine.intent();
    const picked = intendedStrategy(d.actorId, d.commands, engine);
    engine.submit(picked ?? chainFallback(d));
  }
  throw new Error('never reached link 3');
}

describe('PR-0123: the badge and the Odds table agree on the shipped rotation', () => {
  it('Chapter 5 link 3, seed 1: the Bulwark rolls Protect at its own 29%, not Regen\'s 38%', () => {
    const intent = bulwarkIntentAtLink3();
    expect(intent?.enemyId).toBe('bulwark-r');
    expect(intent?.moveName).toBe('Protect');
    expect(intent?.confidence).toBe('likely');
    const sum = intent!.branches.reduce((n, b) => n + b.percent, 0);
    expect(sum).toBe(100);
    const match = intent!.branches.find((b) => b.label === intent!.moveName);
    expect(match?.percent).toBe(29);
  });
});
