/**
 * Shared fixtures for the Chapter XII (Seymour Omnis, the Garden of Pain)
 * engine tests: the formation ids, probe rows, an engine on the shipped party
 * (or a line-up override), and the drive / read helpers. **FFX only.**
 * Test-only.
 */

import type {
  AbilityDef,
  BattleEngine,
  BattleEvent,
  Command,
  Decision,
  FFXCombatant,
  FFXPartyBuild,
  StatusInstance,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { gardenOfPainBuild } from '../../../src/data/ffx/builds/garden-of-pain.ts';

export const GROUP_ID = 'seymour-omnis';
export const OMNIS = 'seymour-omnis';
export const DISCS = ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'] as const;

/** Probe rows: exact damage (`fixed-no-variance`, type Other: no Defense, no Shell, turns no disc). */
export function fixedHit(id: string, amount: number, targeting: AbilityDef['targeting'] = 'single-enemy'): AbilityDef {
  return {
    id, name: id, game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: amount / 50,
    formula: 'fixed-no-variance', damageType: 'other', element: ['none'], targeting,
    hits: 1, statusEffects: [], removesStatuses: [], flags: ['always-break-damage-limit'], canMiss: false,
  };
}
export const HIT_500 = fixedHit('test-hit-500', 500);
export const HIT_61000 = fixedHit('test-hit-61000', 61_000);
/** A random-enemy physical probe (Slice & Dice's targeting, research §2). */
export const RANDOM_HIT: AbilityDef = { ...fixedHit('test-random-hit', 100, 'random-enemy'), damageType: 'physical', hits: 8 };

/** A party-wide spell probe (all enemies, magical, non-elemental). */
export const ALL_SPELL: AbilityDef = { ...fixedHit('test-all-spell', 100, 'all-enemies'), damageType: 'magical', category: 'blackmagic' };

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES, HIT_500, HIT_61000, RANDOM_HIT, ALL_SPELL]);
content.addItems(Object.values(ITEMS));

/** The shipped build with a different opening line-up (every switch is legal in this fight anyway). */
export function lineUp(active: [string, string, string]): FFXPartyBuild {
  const reserve = gardenOfPainBuild.members.map((m) => m.id).filter((id) => !active.includes(id));
  return { ...gardenOfPainBuild, activeSlots: active, reserve };
}

export function newEngine(seed = 1, party: FFXPartyBuild = gardenOfPainBuild): ReturnType<typeof createFFXEngine> {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID];
  if (!group) throw new Error(`${GROUP_ID} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
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

/** Advance to the next input of `who`, defending with everyone else. */
export function inputFor(engine: BattleEngine, who: string): Input {
  for (let i = 0; i < 60; i++) {
    const d = nextInput(engine);
    if (d.actorId === who) return d;
    engine.submit(defend());
  }
  throw new Error(`no turn for ${who}`);
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

export function discs(engine: BattleEngine): string[] {
  return String(engine.state().flags['omnis.discs']).split(',');
}

/** Omnis's turns, each as the list of rows it resolved (a volley is its four casts). */
export function omnisTurns(log: readonly BattleEvent[]): string[][] {
  const out: string[][] = [];
  let current: string[] | null = null;
  for (const e of log) {
    if (e.type === 'turn-start') current = e.actorId === OMNIS ? [] : null;
    if (current && e.type === 'turn-start') out.push(current);
    if (current && e.type === 'action-start' && e.actorId === OMNIS && e.abilityId) current.push(e.abilityId);
  }
  return out;
}
