/**
 * Drive the Youth League Tournament (Mushroom Rock Road's seven fights in a row; the hidden FFX-2 chapter) headlessly. **FFX-2 only.**
 *
 * - {@link openAct} opens one act on the real engine (the chapter's party, the group as the data defines it).
 * - {@link forced} swaps ONE fighter's script for a QUEUE of commands the test pushes (a rig, not a chapter): the move under test happens when the test says, and the engine resolves it with the game's rows, so the
 *   checks are of the engine and the data, not of the script (the scripts have their own file, `youth-league-ai.test.ts`).
 * - {@link LINES} are named policies standing in for a player; a line is an input to a measurement, never game data, and nothing here tunes a boss (rule 6; `docs/handoff/ch-youth-league.md`).
 * - {@link driveChain} plays the whole chain through the app's own path (`setupForChapter`, `setupForNextLink`, the checkpoint rule), so what a bench says of the seven acts is what a player meets.
 */

import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { youthLeagueBuild } from '../../../src/data/ffx2/builds/youth-league.ts';
import { youthLeagueGroups } from '../../../src/data/ffx2/enemies/youth-league.ts';
import { ACT_ENEMY_IDS } from '../../../src/data/youth-league-ids.ts';
import { FFX2_YOUTH_LEAGUE } from '../../../src/data/chapter-ffx2-youth-league.ts';
import { ffx2EngineOptions } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { logOf, makeInvincible, nextInput, topUp, type AngraEv } from './angraMainyuDrive.ts';

export { logOf, makeInvincible, nextInput, topUp, type AngraEv };

type Input = Extract<Decision, { kind: 'player-input' }>;
/** 0 = act 1 (Yaibal) ... 6 = act 7 (Lucil). */
export type Act = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const ACTS: readonly Act[] = [0, 1, 2, 3, 4, 5, 6];

export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The act's fighters' ids, in slot order. */
export const fightersOf = (act: Act): readonly string[] => ACT_ENEMY_IDS[act];

/** A combatant as the engine holds it, with the AI memory a script keeps on an enemy. */
export type Unit = FFX2Combatant & { aiMemory?: Record<string, unknown> };
export const unit = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;
export const girlsOf = (engine: FFX2Engine): Unit[] => GIRLS.map((id) => unit(engine, id));
/** The enemies of the battle, in slot order. */
export const foesOf = (engine: FFX2Engine): Unit[] => (Object.values(engine.state().combatants) as unknown as Unit[]).filter((u) => u.side === 'enemy').sort((a, b) => a.slot - b.slot);

/** The commands a test pushes for the forced script to return, in order. */
export interface Forced {
  readonly queue: Command[];
}

let forcedCount = 0;

/**
 * A copy of act `act`'s group whose fighter number `index` runs a script that returns the queued commands (then nothing). The others keep their own scripts, or with `quiet` do nothing at all (the idle
 * script), so the move under test is the only thing that happens to the girls.
 */
export function forced(act: Act, index = 0, opts: { quiet?: boolean } = {}): { group: EnemyGroupDef; forced: Forced } {
  const queue: Command[] = [];
  const id = `zz-forced-yl-${forcedCount++}`;
  const base = youthLeagueGroups[act]!;
  registerAiScript({ ...aiScriptFor(base.enemies[index]!.aiScriptId), id, decide: () => queue.shift() ?? null });
  return { group: { ...base, enemies: base.enemies.map((e, i) => (i === index ? { ...e, aiScriptId: id } : opts.quiet ? { ...e, aiScriptId: 'idle' } : e)) }, forced: { queue } };
}

export interface OpenOptions {
  build?: FFX2PartyBuild;
  group?: EnemyGroupDef;
  /** The girls carry Invincible from the first moment: the scripts run on their own clock for as long as the test wants. */
  immortal?: boolean;
  atbMode?: 'wait' | 'active';
  flags?: Record<string, string | number | boolean>;
  triggers?: BattleSetup['triggers'];
  /** A rig the test applies to the opened engine before the first decision (a changed resist byte, a lowered HP): an input to a measurement, never game data. */
  setup?: (engine: FFX2Engine) => void;
}

/** A fresh engine on act `act`, the chapter's party (a copy), one seed. */
export function openAct(act: Act, seed: number, opts: OpenOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait' }));
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: opts.build ?? structuredClone(youthLeagueBuild),
    enemies: opts.group ?? youthLeagueGroups[act]!,
    triggers: opts.triggers ?? [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  Object.assign(engine.state().flags, opts.flags ?? {});
  if (opts.immortal) for (const id of GIRLS) makeInvincible(engine.state().combatants[id] as unknown as FFX2Combatant);
  opts.setup?.(engine);
  return engine;
}

/** How many actions `actor` has finished so far. */
export function endsOf(engine: FFX2Engine, actor: string): number {
  return logOf(engine).filter((e) => e.type === 'action-end' && e.actorId === actor).length;
}

/** The girl's turn: `null` = defend. */
export type Turn = (d: Input, engine: FFX2Engine) => Command | null;

/** Play forward until `actor` has finished `count` actions (or the battle ends, or the budget runs out). The girls answer with `turn` (defend by default). True when the count was reached. */
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

/** Play forward (every girl defends, the fighters answer on their own) until `done(engine)` holds, the battle ends or the budget runs out. True when `done` held. `immortal` tops the girls up at each of their decisions. */
export function playUntil(engine: FFX2Engine, done: (engine: FFX2Engine) => boolean, opts: { immortal?: boolean; maxDecisions?: number } = {}): boolean {
  for (let i = 0; i < (opts.maxDecisions ?? 4000); i++) {
    if (done(engine)) return true;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return done(engine);
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (opts.immortal) topUp(engine);
    engine.submit({ kind: 'defend', targets: [] });
  }
  return done(engine);
}

/** The offered row of `kind` + `id` as a command aimed at `targets`, or `null` when the menu does not offer it. */
export function rowOf(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return r ? ({ ...r.command, targets } as Command) : null;
}

/** The first plain attack row aimed at `target` (or the first valid target). */
export function attackOf(d: Input, target: string): Command {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  if (!r) return { kind: 'defend', targets: [] };
  const t = r.validTargets.find((x) => x === target) ?? r.validTargets[0];
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

/** An ability command of a fighter, for the forced queue. */
export const move = (id: string, targets: string[] = []): Command => ({ kind: 'ability', id, targets });

/** Damage events on `target` so far, in order. */
export function damageOn(engine: FFX2Engine, target: string): AngraEv[] {
  return logOf(engine).filter((e) => e.type === 'damage' && e.targetId === target);
}

/** The outcome of a finished battle, or `undefined` while it is on. */
export function outcomeOf(engine: FFX2Engine): string | undefined {
  const state = engine.state() as BattleState & { result?: { outcome?: string } };
  return state.result?.outcome;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Lines (test inputs standing in for a player)
// ---------------------------------------------------------------------------------------------------------------------------------

export type LineName = 'defend' | 'intended' | 'darkness' | 'guarded';

const living = (engine: FFX2Engine): Unit[] => foesOf(engine).filter((u) => u.alive && !u.removed);

/** A girl who is down and can be raised. */
function fallenGirl(engine: FFX2Engine): Unit | undefined {
  return girlsOf(engine).find((g) => !g.alive && g.statuses['eject'] === undefined && !g.removed);
}

function lowestFraction(engine: FFX2Engine): Unit | undefined {
  return girlsOf(engine)
    .filter((g) => g.alive)
    .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
}

/** The foe a plain attack goes to: the weakest by HP among the living (the tactic's rule of thumb: finish the small ones first). */
function weakest(engine: FFX2Engine): Unit | undefined {
  return [...living(engine)].sort((a, b) => a.hp - b.hp)[0];
}

/**
 * The healer's turn (Yuna, the White Mage): raise a fallen girl; a Mega-Potion when two are below half; a Curaga or an X-Potion on one below 40 percent; Shell and Protect on the party in the first turns of the
 * `guarded` line; otherwise Cura on one below 75 percent or Pray.
 */
function yunaTurn(d: Input, engine: FFX2Engine, guard: boolean, turn: number): Command | null {
  const fall = fallenGirl(engine);
  if (fall) return rowOf(d, 'item', 'x2-phoenix-down', [fall.id]) ?? rowOf(d, 'ability', 'x2-white-mage-life', [fall.id]);
  const girls = girlsOf(engine).filter((g) => g.alive);
  const low = lowestFraction(engine);
  if (girls.filter((g) => g.hp < g.stats.maxHp * 0.5).length >= 2) {
    const all = rowOf(d, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (low && low.hp < low.stats.maxHp * 0.4) {
    const one = rowOf(d, 'ability', 'x2-white-mage-curaga', [low.id]) ?? rowOf(d, 'item', 'x2-x-potion', [low.id]);
    if (one) return one;
  }
  if (guard && turn <= 2) {
    const wrap = turn === 1 ? rowOf(d, 'ability', 'x2-white-mage-protect', []) : rowOf(d, 'ability', 'x2-white-mage-shell', []);
    if (wrap) return wrap;
  }
  if (low && low.hp < low.stats.maxHp * 0.75) {
    const cura = rowOf(d, 'ability', 'x2-white-mage-cura', [low.id]);
    if (cura) return cura;
  }
  return rowOf(d, 'ability', 'x2-white-mage-pray', []);
}

/** A Dark Knight's turn: raise Yuna if she is down; a potion on herself below a fifth; Darkness (all enemies, ignores Defense, costs HP); a plain attack at the weakest foe when her HP is low. */
function knightTurn(d: Input, engine: FFX2Engine): Command | null {
  const fall = fallenGirl(engine);
  if (fall?.id === 'yuna') {
    const revive = rowOf(d, 'item', 'x2-phoenix-down', ['yuna']);
    if (revive) return revive;
  }
  const self = girlsOf(engine).find((g) => g.id === d.actorId);
  if (self && self.hp < self.stats.maxHp * 0.2) {
    const potion = rowOf(d, 'item', 'x2-x-potion', [self.id]);
    if (potion) return potion;
  }
  const foe = weakest(engine);
  if (self && self.hp < self.stats.maxHp * 0.35 && foe) return attackOf(d, foe.id);
  return rowOf(d, 'ability', 'x2-dark-knight-darkness', []) ?? (foe ? attackOf(d, foe.id) : null);
}

/**
 * The lines. `darkness` is the sourced Chapter 5 clear (two Dark Knights on Darkness, a White Mage healing); `guarded` adds Protect and Shell from Yuna's first two turns; `intended` is the SHIPPED autopilot
 * (`intendedStrategy`, what the app's own auto-battler plays); `defend` is nobody doing anything useful.
 */
export const LINES: Record<LineName, () => Turn> = {
  defend: () => () => null,
  intended: () => (d, engine) => intendedStrategy(d.actorId, d.commands, engine as never),
  darkness: () => {
    let yunaTurns = 0;
    return (d, engine) => (d.actorId === 'yuna' ? yunaTurn(d, engine, false, ++yunaTurns) : knightTurn(d, engine));
  },
  guarded: () => {
    let yunaTurns = 0;
    return (d, engine) => (d.actorId === 'yuna' ? yunaTurn(d, engine, true, ++yunaTurns) : knightTurn(d, engine));
  },
};

export interface FightResult {
  outcome: string | undefined;
  ticks: number;
  decisions: number;
  girlsAlive: number;
  kos: number;
  /** How many times each move of any enemy started, by ability id. */
  moves: Record<string, number>;
  log: readonly AngraEv[];
}

/** Run `engine` to the end of its battle on `turn`. */
export function runOut(engine: FFX2Engine, turn: Turn, opts: { immortal?: boolean; maxDecisions?: number; decisionMs?: number } = {}): FightResult {
  let outcome: string | undefined;
  let decisions = 0;
  for (let i = 0; i < (opts.maxDecisions ?? 8000); i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = String(d.result.outcome);
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(25, d.nextEventMs)); // a 25 ms quantum: the status clocks wake the engine every few ms and a whole fight would otherwise spend the budget
      continue;
    }
    if (d.kind !== 'player-input') continue;
    decisions += 1;
    if (opts.decisionMs) {
      engine.tick(opts.decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    if (opts.immortal) topUp(engine);
    engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
  }
  const log = logOf(engine);
  const moves: Record<string, number> = {};
  let kos = 0;
  const state = engine.state();
  for (const e of log) {
    const actor = e.actorId === undefined ? undefined : state.combatants[e.actorId];
    if (e.type === 'action-start' && actor?.side === 'enemy' && e.abilityId !== undefined) moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
    if (e.type === 'ko' && (GIRLS as readonly string[]).includes(e.targetId ?? '')) kos += 1;
  }
  return { outcome, ticks: state.ticks, decisions, girlsAlive: girlsOf(engine).filter((g) => g.alive).length, kos, moves, log };
}

/** One whole fresh act on one line. */
export function fight(act: Act, seed: number, line: LineName, opts: OpenOptions & { maxDecisions?: number; decisionMs?: number } = {}): FightResult {
  const engine = openAct(act, seed, opts);
  return runOut(engine, LINES[line](), opts);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// The whole chain, through the app's own path
// ---------------------------------------------------------------------------------------------------------------------------------

export interface ChainRun {
  /** The outcome of each act fought, in order (a defeat ends the run). */
  outcomes: string[];
  /** The last outcome: `victory` only if all seven were won. */
  outcome: string;
  /** Girls KO'd, summed over the acts. */
  kos: number;
  /** Engine seconds, summed over the acts. */
  seconds: number;
  /** Per act: the fight result, in order. */
  acts: FightResult[];
}

/**
 * Play the chapter from act 1 on `line`, the party carried from act to act by the app's own rule (`setupForNextLink`), until a defeat or the seventh victory. With `retries` above 0 a defeat on act 2 to 7 retries THAT act
 * from the state the party entered it (the checkpoint, `BattleChainCheckpoint.ts`), up to `retries` times in all; a defeat on act 1 starts over.
 */
export async function driveChain(line: LineName, seed: number, opts: { retries?: number; decisionMs?: number; build?: FFX2PartyBuild } = {}): Promise<ChainRun> {
  let setup: BattleSetup = setupForChapter(FFX2_YOUTH_LEAGUE, seed);
  if (opts.build) setup = { ...setup, party: structuredClone(opts.build) };
  let group: EnemyGroupDef = setup.enemies;
  let link = 1;
  let retriesLeft = opts.retries ?? 0;
  const run: ChainRun = { outcomes: [], outcome: 'unresolved', kos: 0, seconds: 0, acts: [] };
  let checkpoint = checkpointAt(link, group, setup);
  for (let guard = 0; guard < 40; guard++) {
    const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const result = runOut(engine, LINES[line](), { ...(opts.decisionMs ? { decisionMs: opts.decisionMs } : {}), maxDecisions: 12_000 });
    run.acts.push(result);
    run.kos += result.kos;
    run.seconds += result.ticks / 29.97;
    run.outcomes.push(result.outcome ?? 'unresolved');
    run.outcome = result.outcome ?? 'unresolved';
    if (result.outcome === 'victory') {
      if (!group.nextGroupId) return run;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) return run;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      checkpoint = checkpointAt(link, group, setup) ?? checkpoint;
      continue;
    }
    // A defeat: retry the checkpoint act (acts 2 to 7), or the chapter from act 1.
    if (retriesLeft <= 0) return run;
    retriesLeft -= 1;
    if (checkpoint && checkpoint.group === group) {
      setup = resumeSetup(checkpoint, seed + 1000 + retriesLeft);
      link = checkpoint.link;
    } else {
      setup = setupForChapter(FFX2_YOUTH_LEAGUE, seed + 1000 + retriesLeft);
      if (opts.build) setup = { ...setup, party: structuredClone(opts.build) };
      group = setup.enemies;
      link = 1;
      checkpoint = null;
    }
  }
  return run;
}
