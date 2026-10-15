/**
 * Shared fixtures for the hidden Biran and Yenke chapter's engine tests (FFX only; Kimahri alone against the two Ronso brothers): an engine on the one formation, and the drive and read helpers.
 * Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { kimahriTrialBuild } from '../../../src/data/ffx/builds/kimahri-trial.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const BIRAN = 'biran-ronso';
export const YENKE = 'yenke-ronso';
export const KIM = 'kimahri';
export const SAME_SIDE = 'ronso.sameSide';

export type Input = Extract<Decision, { kind: 'player-input' }>;

export function setup(seed: number, party: FFXPartyBuild = kimahriTrialBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID['biran-yenke-duel'];
  if (!group) throw new Error('the Biran and Yenke formation is missing from the data layer');
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, party: FFXPartyBuild = kimahriTrialBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, party));
  return engine;
}

export const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
export const flags = (engine: BattleEngine): Record<string, unknown> => engine.state().flags as Record<string, unknown>;
export const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];

/** Kimahri is untouchable (the enemy side is left alone): a mechanic unit stays on its mechanic. */
export function invincible(engine: BattleEngine): void {
  const k = actor(engine, KIM);
  k.stats.maxHp = 99_999;
  k.hp = 99_999;
}

/** Advance to Kimahri's next input (the brothers' turns resolve on the way). */
export function nextInput(engine: BattleEngine, keepUp = true): Input {
  for (let i = 0; i < 400; i++) {
    if (keepUp) invincible(engine);
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
export function row(d: Input, kind: Command['kind'], id: string | undefined, target?: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}
export const lancet = (d: Input, target: string): Command | null => row(d, 'ability', 'lancet', target);
export const swing = (d: Input, target: string): Command | null => row(d, 'attack', undefined, target);
export const rage = (d: Input, id: string, target: string): Command | null => row(d, 'overdrive', id, target);

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}

/** The "Kimahri learns X" banners, in order. */
export const learned = (events: readonly BattleEvent[]): string[] => events.flatMap((e) => (e.type === 'message' && /learns /.test(e.text) ? [e.text.replace(/^.*learns /, '')] : []));

/** Defend with Kimahri until `stop`, collecting nothing: lets the brothers' scripts run. */
export function runDefending(engine: BattleEngine, stop: (e: BattleEngine) => boolean, max = 200): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    nextInput(engine);
    engine.submit(defend());
  }
}
