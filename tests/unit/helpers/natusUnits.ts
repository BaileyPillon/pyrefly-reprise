/**
 * Shared fixtures for the Chapter X (Seymour Natus, the Highbridge) engine
 * tests: the formation ids, exact-damage probe rows, an engine on the shipped
 * party, and the drive / read helpers. Split out of natus-engine.test.ts so
 * each test file stays under the 400-line house rule. **FFX only.** Test-only.
 */

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
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';

export const GROUP_ID = 'seymour-natus';
export const NATUS = 'seymour-natus';
export const MORT = 'mortibody';

/** Probe rows: exact damage (`fixed-no-variance`, type Other, so no Defense or Shell), and a Haste on everyone. */
export function fixedHit(id: string, amount: number): AbilityDef {
  return {
    id, name: id, game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: amount / 50,
    formula: 'fixed-no-variance', damageType: 'other', element: ['none'], targeting: 'single-enemy',
    hits: 1, statusEffects: [], removesStatuses: [], flags: [], canMiss: false,
  };
}
export const HIT_500 = fixedHit('test-hit-500', 500);
export const HIT_1000 = fixedHit('test-hit-1000', 1_000);
export const HIT_13000: AbilityDef = { ...fixedHit('test-hit-13000', 13_000), flags: ['always-break-damage-limit'] };

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES, HIT_500, HIT_1000, HIT_13000]);
content.addItems(Object.values(ITEMS));

export function newEngine(seed = 1): ReturnType<typeof createFFXEngine> {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID];
  if (!group) throw new Error(`${GROUP_ID} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: highbridgeBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

export type Input = Extract<Decision, { kind: 'player-input' }>;
export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** Drive until `stop`, answering every player turn with `choose`. */
export function drive(engine: BattleEngine, choose: (d: Input) => Command, stop: (e: BattleEngine) => boolean, max = 4000): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d));
  }
}

/** Advance to the next player input and return it (enemy turns resolve on the way). */
export function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('battle ended');
  }
  throw new Error('no player input');
}

export function actor(engine: BattleEngine, id: string): FFXCombatant {
  return engine.state().combatants[id] as FFXCombatant;
}

export function makeInvincible(engine: BattleEngine): void {
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (!c) continue;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

export function status(id: StatusInstance['id']): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

export function actions(log: readonly BattleEvent[], who: string): string[] {
  return log.filter((e) => e.type === 'action-start' && e.actorId === who).map((e) => (e as { abilityId: string }).abilityId);
}

export function flags(engine: BattleEngine): Record<string, unknown> {
  return engine.state().flags as Record<string, unknown>;
}
