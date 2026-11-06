/**
 * Shared fixtures for the hidden Penance chapter's engine tests (FFX only; Tidus, Yuna and Rikku against Penance and its two Arms): an engine on the one formation, and the drive and read helpers. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { penanceBuild } from '../../../src/data/ffx/builds/penance.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const PENANCE = 'penance';
export const RIGHT_ARM = 'penance-right-arm';
export const LEFT_ARM = 'penance-left-arm';
export const ARMS = [RIGHT_ARM, LEFT_ARM] as const;

export type Input = Extract<Decision, { kind: 'player-input' }>;

export function setup(seed: number, party: FFXPartyBuild = penanceBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID['penance'];
  if (!group) throw new Error('the Penance formation is missing from the data layer');
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, party: FFXPartyBuild = penanceBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, party));
  return engine;
}

export const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
export const flags = (engine: BattleEngine): Record<string, number | string | boolean> => engine.state().flags;
export const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];
export const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
export const counter = (engine: BattleEngine): number => Number(flags(engine)['pen.counter'] ?? 0);
export const phase = (engine: BattleEngine): number => Number(flags(engine)['pen.phase'] ?? 0);

/** What the mechanic tests shrug off: every status the arms and Penance inflict (an Armor-Broken member takes 99,999 from the next physical hit, so Calamity and Immolation would otherwise end a test about something else). */
const WARDED = ['petrify', 'doom', 'armor-break', 'mental-break', 'power-break', 'magic-break', 'poison', 'curse', 'sleep', 'silence', 'darkness'] as const;

/** Everybody in the front line is untouchable by anything but Judgment Day (which takes 99,999 whatever the maximum): a mechanic unit stays on its mechanic. The statuses the arms and Penance inflict are shrugged off too (Petrify would shatter a member, Doom would count the party down to death in five turns, an Armor Break turns the next blow into 99,999). */
export function invincible(engine: BattleEngine): void {
  for (const id of engine.state().activeIds) {
    const c = actor(engine, id);
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
    for (const status of WARDED) {
      c.immunities[status] = 255;
      delete c.statuses[status];
    }
  }
}

/** Advance to the next player input (the enemies' turns resolve on the way). */
export function nextInput(engine: BattleEngine, keepUp = true, max = 1500): Input {
  for (let i = 0; i < max; i++) {
    if (keepUp) invincible(engine);
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error(`the battle ended: ${d.result.outcome}; last: ${actionList(log(engine)).slice(-6).join(' | ')}`);
  }
  throw new Error('no player input');
}

export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
export function row(d: Input, kind: Command['kind'], id: string | undefined, target?: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}
export const swing = (d: Input, target: string): Command | null => row(d, 'attack', undefined, target);

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}

/** The full list of `action-start` events as `who:ability`, in order. */
export function actionList(events: readonly BattleEvent[]): string[] {
  return events.flatMap((e) => (e.type === 'action-start' ? [`${e.actorId}:${e.abilityId ?? e.command.kind}`] : []));
}

/** Play `n` enemy-side turns with the party defending (and unkillable), returning once `stop` holds. */
export function runDefending(engine: BattleEngine, stop: (e: BattleEngine) => boolean, max = 400): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    nextInput(engine);
    engine.submit(defend());
  }
}

/** Drop Penance's HP to `hp` through the engine's own state (a test's fast-forward; the hit that matters is dealt by a real action afterwards). */
export function setPenanceHp(engine: BattleEngine, hp: number): void {
  actor(engine, PENANCE).hp = hp;
}

/** Every turn that opened, with the clock reading when it did (the sum of the `elapsedTicks` of the turn-start events). */
export function turnClock(events: readonly BattleEvent[]): Array<{ actor: string; tick: number; turn: number }> {
  let tick = 0;
  const out: Array<{ actor: string; tick: number; turn: number }> = [];
  for (const e of events) {
    if (e.type !== 'turn-start') continue;
    tick += e.elapsedTicks;
    out.push({ actor: e.actorId, tick, turn: e.turn });
  }
  return out;
}

/**
 * Walk the log once and report, for each action Penance started, whether each arm was standing at that moment (an arm falls at its `part-destroyed` and stands again at its `part-restored`).
 * The Judgment Day gate is exactly "both standing".
 */
export function penanceActionsWithArms(events: readonly BattleEvent[]): Array<{ ability: string; right: boolean; left: boolean }> {
  const up: Record<string, boolean> = { [RIGHT_ARM]: true, [LEFT_ARM]: true };
  const out: Array<{ ability: string; right: boolean; left: boolean }> = [];
  for (const e of events) {
    if (e.type === 'part-destroyed') up[e.partId] = false;
    else if (e.type === 'part-restored') up[e.partId] = true;
    else if (e.type === 'action-start' && e.actorId === PENANCE && e.abilityId !== undefined && e.abilityId !== 'penance-separation') out.push({ ability: e.abilityId, right: up[RIGHT_ARM] === true, left: up[LEFT_ARM] === true });
  }
  return out;
}
