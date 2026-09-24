/**
 * **Chapter I: Poison carrying Seymour Flux below 50 % does not open phase 2** (combat-fixes-0924 (d)).
 *
 * `research/ffx-seymour-flux.md` §4.3: "HP loss came from **Poison** | **No threshold reaction, no
 * pattern change** | The check only fires on direct attacks and on Mortibsorption" `[verified: 2
 * sources]`. The AI read its phase from HP, so a Poison tick below 35,000 started the Flare loop with
 * no Reflect up and the first Flare hit Seymour himself (14 of 200 intended runs). The phase is now
 * stored and only a real hit moves it (`seymour-flux.ts#stepFluxPhase`). Proved on the real engine and
 * the real Chapter I data (hard rule 3). Plan: `docs/plans/combat-fixes-0924-review.md` §8.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Seymour Flux and the Mortiorchis are FFX's.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEngine, BattleEvent, Decision, FFXCombatant, StatusInstance } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';

const SEYMOUR = 'seymour-flux';
const MOUNT = 'mortiorchis';
const PHASE = 'seymour.phase';
/** 2 % of 70,000 [ffx-seymour-flux §1.1]; one tick from 35,500 lands on 34,100, below 35,000. */
const JUST_ABOVE_HALF = 35_500;

/** A probe that always lands for exactly 100 (type Other, `canMiss: false`): a direct hit. */
const PROBE: AbilityDef = {
  id: 'test-direct-hit', name: 'test', game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: 2,
  formula: 'fixed-no-variance', damageType: 'other', element: ['none'], targeting: 'single-enemy',
  hits: 1, statusEffects: [], removesStatuses: [], flags: [], canMiss: false,
};

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES, PROBE]);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

function newEngine(seed: number): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: gagazetBuild, enemies: ENEMY_GROUPS_BY_ID[SEYMOUR]!, triggers: [], seed, condition: 'normal', canEscape: false });
  // Nobody on the party side dies while the test watches Seymour's script.
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (c) { c.stats.maxHp = 99_999; c.hp = 99_999; }
  }
  return engine;
}

function actor(engine: BattleEngine, id: string): FFXCombatant {
  return engine.state().combatants[id] as FFXCombatant;
}

function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('battle ended');
  }
  throw new Error('no player input');
}

function status(id: StatusInstance['id']): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** The party Defends until `done` says stop; returns the log written meanwhile. */
function defendUntil(engine: BattleEngine, done: (log: readonly BattleEvent[]) => boolean): BattleEvent[] {
  const from = engine.state().log.length;
  for (let i = 0; i < 400; i++) {
    const slice = engine.state().log.slice(from);
    if (done(slice)) return slice;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
  }
  return engine.state().log.slice(from);
}

const poisonTickOnSeymour = (e: BattleEvent): boolean =>
  e.type === 'damage' && e.targetId === SEYMOUR && e.sourceId === undefined && e.amount === 1_400;
const seymourActs = (e: BattleEvent): e is Extract<BattleEvent, { type: 'action-start' }> =>
  e.type === 'action-start' && e.actorId === SEYMOUR;

/** Poison Seymour just above 50 % (Protect already up, so only the 50 % line matters) and let it tick below. */
function poisonAcrossHalf(engine: BattleEngine): BattleEvent[] {
  nextInput(engine);
  const s = actor(engine, SEYMOUR);
  s.hp = JUST_ABOVE_HALF;
  s.statuses.poison = status('poison');
  s.statuses.protect = status('protect');
  return defendUntil(engine, (log) => log.some(poisonTickOnSeymour));
}

describe('Chapter I: Poison never moves Seymour Flux\'s phase; the next real hit does [ffx-seymour-flux §4.3]', () => {
  it('a Poison tick below 50 % fires no Reflect and leaves the stored phase at 1', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = newEngine(seed);
      const log = poisonAcrossHalf(engine);
      expect(log.some(poisonTickOnSeymour), `seed ${seed}: no Poison tick`).toBe(true);
      expect(actor(engine, SEYMOUR).hp * 2, `seed ${seed}`).toBeLessThan(70_000);
      expect(log.filter((e) => e.type === 'counter' && e.actorId === SEYMOUR), `seed ${seed}`).toHaveLength(0);
      expect(actor(engine, SEYMOUR).statuses.reflect, `seed ${seed}`).toBeUndefined();
      expect(engine.state().flags[PHASE], `seed ${seed}`).not.toBe(2);
    }
  });

  it('below 50 % by Poison he keeps casting phase 1 (never the Flare without Reflect)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = newEngine(seed);
      poisonAcrossHalf(engine);
      const log = defendUntil(engine, (l) => l.filter(seymourActs).length >= 3);
      const casts = log.filter(seymourActs).map((e) => e.abilityId);
      expect(casts.length, `seed ${seed}`).toBeGreaterThanOrEqual(3);
      expect(casts.every((id) => id === 'lance-of-atrophy' || id === 'dispel'), `seed ${seed}: ${casts.join(', ')}`).toBe(true);
      expect(log.filter((e) => e.type === 'damage' && e.sourceId === SEYMOUR && e.targetId === SEYMOUR && e.amount > 0), `seed ${seed}`).toHaveLength(0);
    }
  });

  it('the next direct hit fires the Reflect counter and opens phase 2; his Flare then bounces off him', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = newEngine(seed);
      poisonAcrossHalf(engine);
      nextInput(engine);
      const from = engine.state().log.length;
      engine.submit({ kind: 'ability', id: PROBE.id, targets: [SEYMOUR] });
      const hit = engine.state().log.slice(from);
      const counters = hit.filter((e) => e.type === 'counter' && e.actorId === SEYMOUR);
      expect(counters.map((e) => (e as { abilityId: string }).abilityId), `seed ${seed}`).toEqual(['reflect']);
      expect(engine.state().flags[PHASE], `seed ${seed}`).toBe(2);
      expect(actor(engine, SEYMOUR).statuses.reflect, `seed ${seed}`).toBeDefined();

      const log = defendUntil(engine, (l) => l.some((e) => seymourActs(e) && e.abilityId === 'flare-self') && l.some((e) => e.type === 'action-end' && e.actorId === SEYMOUR));
      const flareAt = log.findIndex((e) => seymourActs(e) && e.abilityId === 'flare-self');
      expect(flareAt, `seed ${seed}: no Flare`).toBeGreaterThanOrEqual(0);
      const end = log.findIndex((e, j) => j > flareAt && e.type === 'action-end' && e.actorId === SEYMOUR);
      const flare = log.slice(flareAt, end);
      expect(flare.filter((e) => e.type === 'damage' && e.targetId === SEYMOUR && e.amount > 0), `seed ${seed}`).toHaveLength(0);
    }
  });

  it('a Threatened Seymour cannot counter the hit, but the hit still moves the stored phase (Threaten stops actions, not the pattern)', () => {
    const engine = newEngine(3);
    poisonAcrossHalf(engine);
    nextInput(engine);
    actor(engine, SEYMOUR).statuses.threaten = status('threaten');
    const from = engine.state().log.length;
    engine.submit({ kind: 'ability', id: PROBE.id, targets: [SEYMOUR] });
    const hit = engine.state().log.slice(from);
    expect(hit.filter((e) => e.type === 'counter' && e.actorId === SEYMOUR)).toHaveLength(0);
    expect(engine.state().flags[PHASE]).toBe(2);
  });

  it('a hit on the Mortiorchis alone (no drain) does not move Seymour\'s phase', () => {
    const engine = newEngine(3);
    poisonAcrossHalf(engine);
    nextInput(engine);
    actor(engine, MOUNT).hp = 4_000;
    engine.submit({ kind: 'ability', id: PROBE.id, targets: [MOUNT] });
    expect(engine.state().flags[PHASE]).not.toBe(2);
  });
});
