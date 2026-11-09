/**
 * Shared fixtures for the hidden Belgemine's Challenge chapter's engine tests and bench (FFX only; Yuna alone and her ten aeons against Belgemine's eight at the Remiem Temple): an engine on any of the eight formations, the drive and
 * read helpers, the one-duel and eight-duel players that the bench and the tests both use. Test-only. **No boss row is ever touched**: a line is a plan among the party's own commands, a lever is the party preset's estimate.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { belgemineBuild } from '../../../src/data/ffx/builds/belgemine.ts';
import { BELG_ACTS, BELGEMINE_ID, BELG_IDS, type BelgActKey } from '../../../src/data/ffx/belgemine-ids.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { type BelgemineLine, belgemineTactic } from '../../../src/engine/tactics/belgemine.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export type Input = Extract<Decision, { kind: 'player-input' }>;
export type Line = (d: Input, e: BattleEngine) => Command | null;

export const ACT_KEYS: readonly BelgActKey[] = BELG_ACTS.map((a) => a.key);
export const groupIdOf = (key: BelgActKey): string => BELG_ACTS.find((a) => a.key === key)!.groupId;

export function setup(key: BelgActKey, seed: number, party: FFXPartyBuild = belgemineBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[groupIdOf(key)];
  if (!group) throw new Error(`the formation '${groupIdOf(key)}' is missing from the data layer`);
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function engineOn(s: BattleSetup): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(s);
  return engine;
}

export function newEngine(key: BelgActKey = 'valefor', seed = 1, party: FFXPartyBuild = belgemineBuild): ReturnType<typeof createFFXEngine> {
  return engineOn(setup(key, seed, party));
}

export const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
export const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];
export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}

/** The foes of a battle that decide it (not Belgemine, not the dog). */
export const foesOf = (engine: BattleEngine): string[] => engine.state().enemyIds.filter((id) => id !== BELGEMINE_ID && id !== BELG_IDS.dog);

/** The enabled row of `kind`/`id`, aimed at `target`; null when it is not offered. */
export function row(d: Input, kind: Command['kind'], id: string | undefined, target?: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/** Advance to the next player input. */
export function nextInput(engine: BattleEngine, max = 600): Input {
  for (let i = 0; i < max; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

/** The careless line: Yuna calls the first aeon the menu offers (never Yojimbo or the Sisters), the aeon Attacks the first foe standing; nothing else. */
export const careless: Line = (d, engine) => {
  const state = engine.state();
  if (state.aeonId === d.actorId) {
    const foe = foesOf(engine).find((id) => actor(engine, id).alive);
    return foe === undefined ? null : row(d, 'attack', undefined, foe);
  }
  for (const c of d.commands) if (c.enabled && c.command.kind === 'summon' && c.command.id !== 'yojimbo' && c.command.id !== 'cindy') return { ...c.command, targets: [] } as Command;
  return null;
};

/** The chapter's shipped line, with a plain Attack or the careless pick where it has no opinion. */
export const advisor = (line?: BelgemineLine): Line => {
  const tactic = belgemineTactic(line);
  return (d, engine) => tactic(d.actorId, [...d.commands], engine) ?? careless(d, engine);
};

/** What one duel came to. */
export interface DuelResult {
  outcome: 'victory' | 'defeat' | 'unfinished';
  inputs: number;
  turns: number;
  /** Aeon KOs in the duel. */
  koCount: number;
  /** Overdrive moves the enemy fired (the gauge's big move). */
  bigMoves: number;
  nextGroupId?: string;
  state: ReturnType<BattleEngine['state']>;
}

const BIG_MOVES = new Set(['belg-energy-blast', 'grothia-hellfire', 'belg-thors-hammer', 'belg-diamond-dust', 'spathi-mega-flare', 'yojimbo-zanmato', 'belg-oblivion', 'belg-delta-attack']);

/** Play an engine to its end with `choose` (null means Defend); `maxInputs` guards a stalemate. */
export function playEngine(engine: BattleEngine, choose: Line, maxInputs = 800): DuelResult {
  let inputs = 0;
  for (let i = 0; i < maxInputs * 6; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return finish(engine, d.result.outcome === 'victory' ? 'victory' : 'defeat', inputs, d.result.nextGroupId);
    if (d.kind !== 'player-input') continue;
    if (++inputs > maxInputs) break;
    let cmd = choose(d, engine);
    if (cmd !== null && !d.commands.some((c) => c.enabled && c.command.kind === cmd!.kind)) cmd = null;
    try {
      engine.submit(cmd ?? defendOrAttack(d, engine));
    } catch {
      engine.submit(defendOrAttack(d, engine));
    }
  }
  return finish(engine, 'unfinished', inputs);
}

/** A turn that is spent by a command the menu allows: an aeon Attacks, Yuna calls the first aeon offered. */
function defendOrAttack(d: Input, engine: BattleEngine): Command {
  const any = careless(d, engine);
  if (any !== null) return any;
  const first = d.commands.find((c) => c.enabled && c.validTargets.length > 0);
  return first === undefined ? defend() : ({ ...first.command, targets: [first.validTargets[0]!] } as Command);
}

function finish(engine: BattleEngine, outcome: DuelResult['outcome'], inputs: number, nextGroupId?: string): DuelResult {
  const events = log(engine);
  const koCount = events.filter((e) => e.type === 'ko' && (engine.state().combatants[(e as { targetId?: string }).targetId ?? ''] as FFXCombatant | undefined)?.side === 'aeon').length;
  const bigMoves = events.filter((e) => e.type === 'action-start' && BIG_MOVES.has(e.abilityId ?? '') && e.actorId.startsWith('belg-')).length;
  return { outcome, inputs, turns: engine.state().turn, koCount, bigMoves, ...(nextGroupId !== undefined ? { nextGroupId } : {}), state: engine.state() };
}

/** One duel alone, from the preset as it stands. */
export function playDuel(seed: number, key: BelgActKey, choose: Line, party: FFXPartyBuild = belgemineBuild): DuelResult {
  return playEngine(newEngine(key, seed, party), choose);
}

/** What the whole chapter came to. */
export interface ChainResult {
  outcome: 'victory' | 'defeat' | 'unfinished';
  /** The acts played, in order (the last is the one that decided it). */
  acts: DuelResult[];
  /** The index of the act the chain was lost in, or -1. */
  lostIn: number;
}

/**
 * The eight acts chained as `runEncounterChain` chains them: the party enters each act as the last left it (`setupForNextLink`: HP and MP, the bag, the aeons, Yojimbo's compatibility, the gil, the gauges) and the next act's own
 * rule restores the party and every aeon on entry (`restoresPartyOnEntry` and `restoresAeonsOnEntry`, which the engine applies when it builds the battle). The seed of act _n_ is `seed + n - 1`.
 */
export function playChain(seed: number, choose: Line, party: FFXPartyBuild = belgemineBuild): ChainResult {
  const acts: DuelResult[] = [];
  let s = setup('valefor', seed, party);
  for (let n = 0; n < ACT_KEYS.length; n++) {
    const engine = engineOn(s);
    const result = playEngine(engine, choose);
    acts.push(result);
    if (result.outcome !== 'victory') return { outcome: result.outcome, acts, lostIn: n };
    if (result.nextGroupId === undefined) break;
    const next = ENEMY_GROUPS_BY_ID[result.nextGroupId];
    if (next === undefined) throw new Error(`the chain names a missing formation '${result.nextGroupId}'`);
    s = setupForNextLink(s, next, engine.state(), seed + n + 1) as BattleSetup;
  }
  return { outcome: 'victory', acts, lostIn: -1 };
}

/** The figures of one cell. */
export interface Rate {
  seeds: number;
  wins: number;
  defeats: number;
  unfinished: number;
  /** Mean aeon KOs a duel. */
  koMean: number;
  /** Mean big moves the enemy fired a duel. */
  bigMean: number;
  /** Median inputs. */
  inputsMedian: number;
}

export const share = (r: Rate): number => r.wins / Math.max(1, r.seeds);
const median = (xs: readonly number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

/** `seeds` single duels of one act from seed 1. */
export function rateOfDuel(seeds: number, key: BelgActKey, choose: Line, party: FFXPartyBuild = belgemineBuild): Rate {
  const runs: DuelResult[] = [];
  for (let seed = 1; seed <= seeds; seed++) runs.push(playDuel(seed, key, choose, party));
  return summarise(runs);
}

/** `seeds` whole chapters from seed 1 (the figures are over every act played). */
export function rateOfChain(seeds: number, choose: Line, party: FFXPartyBuild = belgemineBuild): Rate & { lostIn: number[] } {
  const lostIn: number[] = new Array<number>(ACT_KEYS.length).fill(0);
  const all: DuelResult[] = [];
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const chain = playChain(seed, choose, party);
    all.push(...chain.acts);
    if (chain.outcome === 'victory') wins++;
    else if (chain.lostIn >= 0) lostIn[chain.lostIn]!++;
  }
  const base = summarise(all);
  return { ...base, seeds, wins, defeats: seeds - wins, unfinished: all.filter((r) => r.outcome === 'unfinished').length, lostIn };
}

function summarise(runs: readonly DuelResult[]): Rate {
  const mean = (f: (r: DuelResult) => number): number => runs.reduce((a, r) => a + f(r), 0) / Math.max(1, runs.length);
  return {
    seeds: runs.length,
    wins: runs.filter((r) => r.outcome === 'victory').length,
    defeats: runs.filter((r) => r.outcome === 'defeat').length,
    unfinished: runs.filter((r) => r.outcome === 'unfinished').length,
    koMean: mean((r) => r.koCount),
    bigMean: mean((r) => r.bigMoves),
    inputsMedian: median(runs.map((r) => r.inputs)),
  };
}

/** The preset with Yuna's and the aeons' Luck, HP or a stat fraction changed (the levers the bench reports). */
export function withAeonHpFraction(party: FFXPartyBuild, fraction: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const a of out.aeons) {
    a.stats.maxHp = Math.max(1, Math.round(a.stats.maxHp * fraction));
    a.stats.hp = a.stats.maxHp;
    a.hp = a.stats.maxHp;
  }
  return out;
}

/** The preset with Yuna's Grand Summon gauge at `gauge` (a lever: the preflight's section 4 starts it full). */
export function withYunaGauge(party: FFXPartyBuild, gauge: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) if (m.id === 'yuna') m.overdrive = { ...m.overdrive, gauge };
  return out;
}

/** The preset without some of her aeons (a lever: BD4's alternative gates Anima, Yojimbo and the Sisters behind the game's items). */
export function withoutAeons(party: FFXPartyBuild, ids: readonly string[]): FFXPartyBuild {
  const out = structuredClone(party);
  out.aeons = out.aeons.filter((a) => !ids.includes(a.id));
  return out;
}

/** The preset with every aeon's starting Overdrive gauge at `gauge` (a lever). */
export function withAeonGauges(party: FFXPartyBuild, gauge: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const a of out.aeons) a.overdriveGauge = gauge;
  return out;
}

/** The engine's own context (its runtime counters), for a test that sets a CTB counter. */
export const ctxOf = (engine: BattleEngine): import('../../../src/battle/ffx/state.ts').Ctx => (engine as unknown as { ctx: import('../../../src/battle/ffx/state.ts').Ctx }).ctx;
