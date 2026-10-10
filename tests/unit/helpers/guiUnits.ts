/**
 * Shared fixtures for the hidden Sinspawn Gui chapter's engine tests (`sinspawn-gui`; the Ridge's two fights; FFX only): an engine on either fight, the drive and read helpers, and the
 * party-wide "nobody on either side dies" helper that keeps a mechanic unit on its mechanic. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { mushroomRockBuild } from '../../../src/data/ffx/builds/mushroom-rock.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const BODY = 'sinspawn-gui';
export const BODY_2 = 'sinspawn-gui-2';
export const HEAD = 'sinspawn-gui-head';
export const ARM_L = 'sinspawn-gui-arm-left';
export const ARM_R = 'sinspawn-gui-arm-right';
export const ARMS = [ARM_L, ARM_R] as const;

export type Input = Extract<Decision, { kind: 'player-input' }>;
export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** The shipped build with a different opening line-up of the six (Switch is legal in the first fight). */
export function lineUp(active: [string, string, string]): FFXPartyBuild {
  const reserve = mushroomRockBuild.members.map((m) => m.id).filter((id) => !active.includes(id));
  return { ...mushroomRockBuild, activeSlots: active as FFXPartyBuild['activeSlots'], reserve: reserve as FFXPartyBuild['reserve'] };
}

export function setup(fight: 1 | 2, seed: number, party: FFXPartyBuild = mushroomRockBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[fight === 1 ? 'sinspawn-gui-1' : 'sinspawn-gui-2'];
  if (!group) throw new Error('the Gui formations are missing from the data layer');
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: fight === 1 ? 'normal' : 'scripted', canEscape: false };
}

export function newEngine(fight: 1 | 2 = 1, seed = 1, party: FFXPartyBuild = mushroomRockBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(fight, seed, party));
  return engine;
}

/** The second fight opened the way the chain opens it: on the party the first fight ended with (`setupForNextLink`). */
export function secondFightAfter(first: BattleEngine, seed: number): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupForNextLink(setup(1, seed), ENEMY_GROUPS_BY_ID['sinspawn-gui-2']!, first.state(), seed + 1));
  return engine;
}

export function actor(engine: BattleEngine, id: string): FFXCombatant {
  return engine.state().combatants[id] as FFXCombatant;
}
export const flags = (engine: BattleEngine): Record<string, unknown> => engine.state().flags as Record<string, unknown>;

/** Nobody on the party side dies and nobody runs dry (the enemy side is left alone). */
export function invincible(engine: BattleEngine): void {
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds, ...(st.aeonId ? [st.aeonId] : [])]) {
    const c = st.combatants[id];
    if (!c) continue;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
    c.mp = c.stats.maxMp;
  }
}

/** Drive until `stop`, answering every player turn with `choose` (and keeping the party up when `keepUp`). */
export function drive(engine: BattleEngine, choose: (d: Input, e: BattleEngine) => Command, stop: (e: BattleEngine) => boolean, max = 4000, keepUp = true): void {
  for (let i = 0; i < max; i++) {
    if (keepUp) invincible(engine);
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d, engine));
  }
}

/** Advance to the next player input and return it (enemy turns resolve on the way). */
export function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('battle ended');
  }
  throw new Error('no player input');
}

/** Advance to the next input of `who`, defending with everyone else. */
export function inputFor(engine: BattleEngine, who: string, keepUp = true): Input {
  for (let i = 0; i < 120; i++) {
    if (keepUp) invincible(engine);
    const d = nextInput(engine);
    if (d.actorId === who) return d;
    engine.submit(defend());
  }
  throw new Error(`no turn for ${who}`);
}

/** The row `id` (an ability) offered to this input, aimed at `target`; null when it is not offered or cannot name the target. */
export function cast(d: Input, id: string, target?: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && c.command.id === id && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : r.validTargets.length && (r.targeting ?? '').startsWith('single') ? [r.validTargets[0]!] : [] } as Command) : null;
}
export function swing(d: Input, target: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(target));
  return r ? ({ ...r.command, targets: [target] } as Command) : null;
}

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(log: readonly BattleEvent[], who: string): string[] {
  return log.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}
/** Damage numbers dealt to `target` in the log, in order. */
export function damageTo(log: readonly BattleEvent[], target: string): number[] {
  return log.flatMap((e) => (e.type === 'damage' && e.targetId === target ? [e.amount] : []));
}
