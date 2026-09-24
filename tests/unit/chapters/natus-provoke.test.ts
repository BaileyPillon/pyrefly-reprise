/**
 * **Seymour Natus: Provoke and his Protect counter** — the repair for the
 * verifier's regression on `cca51807` (2026-09-24).
 *
 * Natus's 24,000 Protect is a counter whose decompiled target is "Counter
 * Self" [research/ffx-seymour-natus-highbridge.md §2.1 row 3:59, §4.2,
 * verified: 3 sources]. Provoke is landable on him [§1.3, verified: 2 sources],
 * and before this repair the shared Provoke redirect
 * (`targeting.ts#redirectTarget`) sent every enemy action to the provoker,
 * self-buffs included: the Protect landed on Tidus, or, with Tidus Reflected,
 * bounced onto Mortibody. Provoke "forces the enemy to target the provoker"
 * [ffx-combat-core §4.2]; an action the enemy aims at itself or its own side
 * targets no one on the other side, so it is not redirected (our reading of
 * the general rule; sourced for Natus by the "Counter Self" target).
 *
 * Every other FFX boss is Provoke-immune (the last case pins that), so the
 * repair changes Chapter X only.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEngine, BattleEvent, Command, Decision, FFXCombatant, StatusInstance } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import * as rules from '../../../src/battle/ffx/ai/seymour-natus-rules.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';

const NATUS = 'seymour-natus';
const MORT = 'mortibody';

const HIT_1000: AbilityDef = {
  id: 'test-hit-1000', name: 'test-hit-1000', game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: 20,
  formula: 'fixed-no-variance', damageType: 'other', element: ['none'], targeting: 'single-enemy',
  hits: 1, statusEffects: [], removesStatuses: [], flags: [], canMiss: false,
};

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES, HIT_1000]);
content.addItems(Object.values(ITEMS));

function newEngine(seed: number): BattleEngine {
  const group = ENEMY_GROUPS_BY_ID[NATUS];
  if (!group) throw new Error('seymour-natus group missing');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: highbridgeBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (c) { c.stats.maxHp = 99_999; c.hp = 99_999; }
  }
  return engine;
}

type Input = Extract<Decision, { kind: 'player-input' }>;
const defend = (): Command => ({ kind: 'defend', targets: [] });

function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('battle ended');
  }
  throw new Error('no player input');
}

function drive(engine: BattleEngine, stop: (e: BattleEngine) => boolean, max = 4000): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(defend());
  }
}

const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
function status(id: StatusInstance['id']): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}
const protectLandings = (log: readonly BattleEvent[]): string[] =>
  log.flatMap((e) => (e.type === 'status-add' && e.status === 'protect' && e.instance.sourceId === NATUS ? [e.targetId] : []));

describe('Chapter X: Provoke does not redirect Natus\'s "Counter Self" Protect (FFX only)', () => {
  it('Natus Provoked by Tidus: the 24,000 counter puts Protect on Natus, 20/20 seeds', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const engine = newEngine(seed);
      const natus = actor(engine, NATUS);
      natus.hp = 24_500;
      natus.statuses.provoke = { ...status('provoke'), sourceId: 'tidus' };
      nextInput(engine);
      const from = engine.state().log.length;
      engine.submit({ kind: 'ability', id: HIT_1000.id, targets: [NATUS] });
      const log = engine.state().log.slice(from);
      expect(engine.state().flags[rules.NATUS_PHASE]).toBe(2);
      expect(log.filter((e) => e.type === 'counter' && e.actorId === NATUS && e.abilityId === 'protect')).toHaveLength(1);
      expect(protectLandings(log)).toEqual([NATUS]);
      expect(natus.statuses.protect).toBeDefined();
      expect(actor(engine, 'tidus').statuses.protect).toBeUndefined();
    }
  });

  it('the Provoke + Reflect line: his bounced Multi-ra moves the phase and the Protect still lands on him', () => {
    let proved = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const engine = newEngine(seed);
      const natus = actor(engine, NATUS);
      natus.hp = 24_500;
      actor(engine, 'tidus').statuses.reflect = status('reflect');
      natus.statuses.provoke = { ...status('provoke'), sourceId: 'tidus' };
      drive(engine, (e) => e.state().flags[rules.NATUS_PHASE] === 2
        || e.state().log.filter((x) => x.type === 'action-start' && x.actorId === NATUS).length >= 1);
      if (engine.state().flags[rules.NATUS_PHASE] !== 2) continue; // both bounces went to Mortibody
      drive(engine, (e) => protectLandings(e.state().log).length > 0, 50);
      expect(protectLandings(engine.state().log)).toEqual([NATUS]);
      expect(actor(engine, MORT).statuses.protect).toBeUndefined();
      proved++;
    }
    expect(proved).toBeGreaterThan(10);
  });

  it('his attacks still go to the provoker: Provoke keeps working on the other side', () => {
    const engine = newEngine(2);
    const natus = actor(engine, NATUS);
    natus.statuses.provoke = { ...status('provoke'), sourceId: 'yuna' };
    const from = engine.state().log.length;
    drive(engine, (e) => e.state().log.slice(from).some((x) => x.type === 'damage' && x.sourceId === NATUS));
    const hits = engine.state().log.slice(from).filter((x) => x.type === 'damage' && x.sourceId === NATUS);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect((h as { targetId: string }).targetId).toBe('yuna');
  });

  it("absence: Natus and Braska's Final Aeon are the only targetable, Provoke-landable FFX enemies with a self action", () => {
    const reach: string[] = [];
    for (const [groupId, group] of Object.entries(ENEMY_GROUPS_BY_ID)) {
      for (const def of [...group.enemies, ...(group.parts ?? [])]) {
        if ((def.immunities.provoke ?? 0) >= 255 || def.flags?.untargetable === true) continue;
        const selfRows = def.abilityIds.filter((id) => content.ability(id)?.targeting === 'self');
        if (selfRows.length > 0) reach.push(`${groupId}:${def.id}:${selfRows.join('+')}`);
      }
    }
    // Natus: none of his rows is `self` (the counter reuses the ally-target
    // Protect, aimed at himself). BFA: only the form-change cue, and the
    // research lists him Provoke-immune [ffx-bfa-yu-yevon §1.2], a data gap
    // reported to the Chapter III owner, not fixed here.
    expect(reach).toEqual(['braskas-final-aeon:braskas-final-aeon:draws-sword']);
  });
});
