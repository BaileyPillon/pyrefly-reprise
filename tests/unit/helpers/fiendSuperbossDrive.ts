/**
 * Drive the Fiend Arena Superbosses (act 1 Almighty Shinra, act 2 the Major Numerus; the hidden FFX-2 chapter 53) headlessly. **FFX-2 only.**
 *
 * - {@link openAct} opens one link on the real engine (the Lv 99 line, the group as the data defines it).
 * - {@link forcedAct} swaps every fighting enemy's script for a QUEUE of commands the test pushes (a rig, not a chapter): the move under test happens when the test says, and the engine resolves it with the game's rows,
 *   so the checks are of the engine and the data, not of the scripts (the scripts have their own files).
 * Nothing here tunes a boss (rule 6): the helper only opens fights and plays them; the bench lines (named policies standing in for a player) are a later stage of the lane.
 *
 * The party is the chapter's own build `fiendSuperbossBuild` (stage 3 of the lane: a deep copy of the Cup's `viaInfinitoBuild`, equal to it, a deep copy per call), so the lane's hashes and measurements are of the shipped preset.
 */

import type { BattleSetup, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { createHash } from 'node:crypto';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { fiendSuperbossBuild } from '../../../src/data/ffx2/builds/fiend-superbosses.ts';
import { act1ShinraGroup, act2NumerusGroup } from '../../../src/data/ffx2/enemies/fiend-superbosses.ts';
import { NUMERUS_HEAD_IDS, X2_ALMIGHTY_SHINRA_ID } from '../../../src/data/fiend-superbosses-ids.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { logOf, makeInvincible, nextInput, topUp, type AngraEv } from './angraMainyuDrive.ts';

export { logOf, makeInvincible, nextInput, topUp, type AngraEv };

type Input = Extract<Decision, { kind: 'player-input' }>;
/** 1 = act 1 (Almighty Shinra), 2 = act 2 (the Major Numerus). */
export type Act = 1 | 2;

export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The party of the lane's measurements: Chapter XIII's Lv 99 three as it is, a deep copy per call so no preset can mutate another's. */
export const lv99Build = (): FFX2PartyBuild => structuredClone(fiendSuperbossBuild);

/** The group of an act as the data defines it. */
export const groupOf = (act: Act): EnemyGroupDef => (act === 1 ? act1ShinraGroup : act2NumerusGroup);

/** Commands a test pushes for one enemy's forced script to return, in order. */
export type Queues = Record<string, Command[]>;

let forcedCount = 0;

/**
 * A copy of the act's group whose fighting enemies (not the parts) each run a script that returns the commands queued for it under its id (then nothing). The parts keep the `idle` script.
 * Returns the group and the queues, keyed by enemy id.
 */
export function forcedAct(act: Act): { group: EnemyGroupDef; queues: Queues } {
  const base = groupOf(act);
  const queues: Queues = {};
  const swap = (enemy: EnemyGroupDef['enemies'][number]): EnemyGroupDef['enemies'][number] => {
    const queue: Command[] = (queues[enemy.id] = []);
    const id = `zz-forced-fs-${forcedCount++}`;
    registerAiScript({ ...aiScriptFor(enemy.aiScriptId), id, decide: () => queue.shift() ?? null });
    return { ...enemy, aiScriptId: id };
  };
  return { group: { ...base, enemies: base.enemies.map(swap) }, queues };
}

export interface OpenOptions {
  build?: FFX2PartyBuild;
  group?: EnemyGroupDef;
  /** The girls carry Invincible from the first moment: the enemies' scripts run on their own clock for as long as the test wants. */
  immortal?: boolean;
  atbMode?: 'wait' | 'active';
  flags?: Record<string, string | number | boolean>;
  /** A rig the test applies to the opened engine before the first decision (a changed resist byte, a raised HP): an input to a measurement, never game data. */
  setup?: (engine: FFX2Engine) => void;
}

/** A fresh engine on act `act`, the Lv 99 line (a copy), one seed. */
export function openAct(act: Act, seed: number, opts: OpenOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait' }));
  engine.setSeed(seed);
  const setup: BattleSetup = {
    game: 'ffx2',
    party: opts.build ?? lv99Build(),
    enemies: opts.group ?? groupOf(act),
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.init(setup);
  Object.assign(engine.state().flags, opts.flags ?? {});
  if (opts.immortal) for (const id of GIRLS) makeInvincible(engine.state().combatants[id] as unknown as FFX2Combatant);
  opts.setup?.(engine);
  return engine;
}

/** A combatant as the engine holds it. */
export type Unit = FFX2Combatant & { aiMemory?: Record<string, unknown> };

export const unit = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;

/** The girls as the engine holds them. */
export function girlsOf(engine: FFX2Engine): Unit[] {
  return GIRLS.map((id) => unit(engine, id));
}

/** How many actions `actor` has finished so far. */
export function endsOf(engine: FFX2Engine, actor: string): number {
  return logOf(engine).filter((e) => e.type === 'action-end' && e.actorId === actor).length;
}

/** The girl's turn: `null` = defend. */
export type Turn = (d: Input, engine: FFX2Engine) => Command | null;

/**
 * Play forward until `actor` has finished `count` actions (or the battle ends, or the budget runs out). The girls answer with `turn` (defend by default). True when the count was reached.
 * `immortal` tops the girls up at each of their decisions.
 */
export function playUntilActed(engine: FFX2Engine, actor: string, count: number, turn: Turn = () => null, opts: { immortal?: boolean; maxDecisions?: number } = {}): boolean {
  for (let i = 0; i < (opts.maxDecisions ?? 4000); i++) {
    if (endsOf(engine, actor) >= count) return true;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return endsOf(engine, actor) >= count;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (opts.immortal) topUp(engine);
    engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
  }
  return endsOf(engine, actor) >= count;
}

/** The offered row of `kind` + `id` as a command aimed at `targets`, or `null` when the menu does not offer it. */
export function rowOf(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return r ? ({ ...r.command, targets } as Command) : null;
}

/** An ability command of an enemy, for the forced queue. */
export const move = (id: string, targets: string[] = []): Command => ({ kind: 'ability', id, targets });

/** Damage events on `target` so far, in order. */
export function damageOn(engine: FFX2Engine, target: string): AngraEv[] {
  return logOf(engine).filter((e) => e.type === 'damage' && e.targetId === target);
}

/** The outcome of a finished battle, or `undefined` while it is on. */
export function outcomeOf(engine: FFX2Engine): string | undefined {
  const state = engine.state() as { result?: { outcome?: string } | null };
  return state.result?.outcome;
}

/** Give a unit a permanent status (a rig): the way a test lays a condition the engine would otherwise need a long fight to reach. */
export function give(u: Unit, status: string): void {
  u.statuses[status as 'petrify'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
}

/** A rig: the girls' HP raised so that no big hit puts one down before the damage is read (the real HP is 10,710, 5,106 and 10,710). */
export function bigHp(engine: FFX2Engine, hp = 900_000): void {
  for (const g of girlsOf(engine)) {
    g.stats.maxHp = hp;
    g.hp = hp;
  }
}

/** The first plain attack row aimed at `target` (or the first valid target). */
export function attackOf(d: Input, target: string): Command {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  if (!r) return { kind: 'defend', targets: [] };
  const t = r.validTargets.find((x) => x === target) ?? r.validTargets[0];
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Stage 2: playing an act to its end (or to a named cap), and the event log's hash
// ---------------------------------------------------------------------------------------------------------------------------------

/** The turn cap of a run: 40 minutes of battle time (the FFX-2 engine counts 29.97 logic steps a second, `battle/ffx2/clock.ts`; stage 2 of the lane read the cap as 20 minutes at 60 a second). A run that reaches it is a RESULT named `cap`, never a failure. */
export const CAP_TICKS = 60 * 60 * 20;

/** The foes of an act that the girls aim at, in order: Shinra, or the four heads. */
export const targetsOf = (act: Act): readonly string[] => (act === 1 ? [X2_ALMIGHTY_SHINRA_ID] : NUMERUS_HEAD_IDS);

/** The first of the act's foes still standing (the headline target of the lines below). */
export function headlineOf(engine: FFX2Engine, act: Act): string {
  const list = targetsOf(act);
  return list.find((id) => unit(engine, id).alive) ?? (list[0] as string);
}

/**
 * The Darkness line, the base party's plain damage line (an input to a measurement, never game data; the Lv 99 line's Dark Knights Yuna and Paine cast Darkness, which ignores Defense, and Rikku attacks the first foe standing).
 * Not the shipped advisor: the chapter has none yet.
 */
export function darknessLine(act: Act): Turn {
  return (d, engine) => {
    if (d.actorId === 'rikku') return attackOf(d, headlineOf(engine, act));
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && (c.command as { id: string }).id === 'x2-dark-knight-darkness');
    return row ? ({ ...row.command, targets: [] } as Command) : attackOf(d, headlineOf(engine, act));
  };
}

export interface RunResult {
  /** `victory`, `defeat`, or `cap` (the turn cap was reached with the fight still on). */
  outcome: string;
  ticks: number;
  decisions: number;
  /** sha256 (first 16 hex digits) of every event of the run, serialised in order. */
  hash: string;
}

/** The hash of the engine's event log so far (the same digest as `ffx2ChapterDrive.ts#logHash`, for one link). */
export function eventHash(engine: FFX2Engine): string {
  return createHash('sha256').update(JSON.stringify(engine.state().log)).digest('hex').slice(0, 16);
}

/** Play an open fight with `turn` until it ends or the cap is reached. `immortal` tops the girls up at each of their decisions (their Invincible is laid by {@link openAct}'s `immortal`). */
export function playToEnd(engine: FFX2Engine, turn: Turn, opts: { immortal?: boolean; capTicks?: number } = {}): RunResult {
  const cap = opts.capTicks ?? CAP_TICKS;
  let decisions = 0;
  let outcome = 'cap';
  while (engine.state().ticks <= cap) {
    const d = engine.nextDecision();
    decisions += 1;
    if (d.kind === 'battle-over') {
      outcome = outcomeOf(engine) ?? 'over';
      break;
    }
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') {
      if (opts.immortal) topUp(engine);
      engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
    }
  }
  return { outcome, ticks: engine.state().ticks, decisions, hash: eventHash(engine) };
}

/** The abilities an actor started, in order, each with its targets (`id>target+target`). */
export function startsOf(engine: FFX2Engine, actor: string): string[] {
  return logOf(engine)
    .filter((e) => e.type === 'action-start' && e.actorId === actor)
    .map((e) => `${e.abilityId}${e.targets && e.targets.length > 0 ? '>' + e.targets.join('+') : ''}`);
}
