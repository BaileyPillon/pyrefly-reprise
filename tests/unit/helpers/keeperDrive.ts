/**
 * Shared fixtures for the hidden Spectral Keeper chapter's engine tests (FFX only; Tidus, Yuna and Auron on the glyph platforms): an engine on the one formation, and the drive and read helpers. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const KEEPER = 'spectral-keeper';
export const circleId = (platform: number): string => `spectral-circle-${platform}`;

export type Input = Extract<Decision, { kind: 'player-input' }>;

export function setup(seed: number, party: FFXPartyBuild = zanarkandBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID['spectral-keeper'];
  if (!group) throw new Error('the Spectral Keeper formation is missing from the data layer');
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, party: FFXPartyBuild = zanarkandBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, party));
  return engine;
}

export const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
export const flags = (engine: BattleEngine): Record<string, number | string | boolean> => engine.state().flags;
export const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];
export const platformOfId = (engine: BattleEngine, id: string): number | undefined => {
  const v = flags(engine)[`plat.at.${id}`];
  return typeof v === 'number' ? v : undefined;
};

/** Everybody in the front line is untouchable: a mechanic unit stays on its mechanic. */
export function invincible(engine: BattleEngine): void {
  for (const id of engine.state().activeIds) {
    const c = actor(engine, id);
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

/** Advance to the next player input (the Keeper's and the Circles' turns resolve on the way). */
export function nextInput(engine: BattleEngine, keepUp = true, max = 600): Input {
  for (let i = 0; i < max; i++) {
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
export const swing = (d: Input, target: string = KEEPER): Command | null => row(d, 'attack', undefined, target);
export const scan = (d: Input, target: string = KEEPER): Command | null => row(d, 'ability', 'scan', target);
export const move = (d: Input, platform: number): Command | null => row(d, 'trigger', 'move', circleId(platform));

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}

/** The full list of `action-start` events as `who:ability`, in order. */
export function actionList(events: readonly BattleEvent[]): string[] {
  return events.flatMap((e) => (e.type === 'action-start' ? [`${e.actorId}:${e.abilityId ?? e.command.kind}`] : []));
}

/** Defend until `stop`, letting the Keeper's script run. */
export function runDefending(engine: BattleEngine, stop: (e: BattleEngine) => boolean, max = 200): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    nextInput(engine);
    engine.submit(defend());
  }
}

export const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
export const party = ['tidus', 'yuna', 'auron'] as const;

/** Advance (the others defend) to `who`'s input. */
export function inputFor(engine: BattleEngine, who: string, max = 60): Input {
  for (let i = 0; i < max; i++) {
    const d = nextInput(engine);
    if (d.actorId === who) return d;
    engine.submit(defend());
  }
  throw new Error(`no input for ${who}`);
}

export const events = (engine: BattleEngine): readonly BattleEvent[] => log(engine);
export const keeperActions = (engine: BattleEngine): string[] => actionList(events(engine)).filter((a) => a.startsWith(`${KEEPER}:`)).map((a) => a.slice(KEEPER.length + 1));
export const lastSweep = (engine: BattleEngine): string[] => {
  const starts = events(engine).filter((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'keeper-attack-all');
  const last = starts[starts.length - 1];
  return last && last.type === 'action-start' ? [...last.targets] : [];
};
