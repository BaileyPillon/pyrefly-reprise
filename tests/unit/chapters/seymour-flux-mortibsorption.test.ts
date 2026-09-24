/**
 * **Chapter I: Mortibsorption runs Seymour's threshold counters** (combat-fixes-0924 (b)).
 *
 * `research/ffx-seymour-flux.md` §2.2: "Mortibsorption damage **counts as 'being attacked'** for
 * Seymour's HP-threshold AI checks (see §4.3)" `[verified: 2 sources]`; §4.3: Protect below 75 %,
 * Reflect below 50 %. The engine used to compute those counters after the drain and drop them, which
 * left the phase flag at 2 with no Reflect up, so his next Flare detonated on himself. Proved on the
 * real engine and the real Chapter I data (hard rule 3). Plan: `docs/plans/combat-fixes-0924-review.md`.
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

/** A probe that always lands for exactly 100 (type Other, `canMiss: false`), so the kill is certain. */
const PROBE: AbilityDef = {
  id: 'test-kill-mount', name: 'test', game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: 2,
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

/** Put Seymour just above 50 % (and below 75 %) with the mount one hit from death, then kill it. */
function drainAcrossHalf(engine: BattleEngine): BattleEvent[] {
  nextInput(engine);
  actor(engine, SEYMOUR).hp = 36_000; // 70,000 max: a 4,000 drain lands him on 32,000, below 35,000
  actor(engine, MOUNT).hp = 1;
  const from = engine.state().log.length;
  engine.submit({ kind: 'ability', id: PROBE.id, targets: [MOUNT] });
  return engine.state().log.slice(from);
}

describe('Chapter I: Mortibsorption runs the threshold counters it owes [ffx-seymour-flux §2.2, §4.3]', () => {
  it('a drain across 50 % fires Reflect (and the owed Protect) as counters, at once', () => {
    const engine = newEngine(3);
    const after = drainAcrossHalf(engine);
    expect(after.some((e) => e.type === 'heal' && e.cause === 'mortibsorption')).toBe(true);
    expect(actor(engine, SEYMOUR).hp).toBe(32_000);
    const counters = after.filter((e) => e.type === 'counter' && e.actorId === SEYMOUR && e.targetId === MOUNT);
    expect(counters.map((e) => (e as { abilityId: string }).abilityId).sort()).toEqual(['protect', 'reflect']);
    expect(actor(engine, SEYMOUR).statuses.reflect).toBeDefined();
    expect(actor(engine, SEYMOUR).statuses.protect).toBeDefined();
  });

  it('his next Flare bounces off his Reflect instead of detonating on himself', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = newEngine(seed);
      drainAcrossHalf(engine);
      const from = engine.state().log.length;
      let flareAt = -1;
      for (let i = 0; i < 400 && flareAt < 0; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
        const log = engine.state().log;
        flareAt = log.findIndex((e, j) => j >= from && e.type === 'action-start' && e.actorId === SEYMOUR && e.abilityId === 'flare-self');
      }
      expect(flareAt, `seed ${seed}: Seymour cast no Flare`).toBeGreaterThanOrEqual(0);
      const log = engine.state().log;
      const end = log.findIndex((e, j) => j > flareAt && e.type === 'action-end' && e.actorId === SEYMOUR);
      const flare = log.slice(flareAt, end);
      const onHimself = flare.filter((e) => e.type === 'damage' && e.targetId === SEYMOUR && e.amount > 0);
      expect(onHimself, `seed ${seed}`).toHaveLength(0);
      expect(flare.some((e) => e.type === 'damage' && e.targetId !== SEYMOUR && e.amount > 0), `seed ${seed}: the Flare hit nobody`).toBe(true);
    }
  });

  it('a Threatened Seymour cannot counter the drain [ffx-combat-core §4.2]', () => {
    const engine = newEngine(3);
    nextInput(engine);
    actor(engine, SEYMOUR).statuses.threaten = status('threaten');
    const after = drainAcrossHalf(engine);
    expect(after.some((e) => e.type === 'heal' && e.cause === 'mortibsorption')).toBe(true);
    expect(after.filter((e) => e.type === 'counter' && e.actorId === SEYMOUR)).toHaveLength(0);
    expect(actor(engine, SEYMOUR).statuses.reflect).toBeUndefined();
  });

  it('a drain that stays above both thresholds fires nothing', () => {
    const engine = newEngine(3);
    nextInput(engine);
    actor(engine, SEYMOUR).hp = 70_000;
    actor(engine, MOUNT).hp = 1;
    const from = engine.state().log.length;
    engine.submit({ kind: 'ability', id: PROBE.id, targets: [MOUNT] });
    const after = engine.state().log.slice(from);
    expect(actor(engine, SEYMOUR).hp).toBe(66_000);
    expect(after.filter((e) => e.type === 'counter' && e.actorId === SEYMOUR)).toHaveLength(0);
  });
});
