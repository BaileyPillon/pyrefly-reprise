/**
 * Drive the Bevelle Guardians (Georapella and the Precepts Guard on floor 3, Baralai on floor 7; the hidden FFX-2 chapter) headlessly. **FFX-2 only.**
 *
 * - {@link openAct} opens one link on the real engine (the chapter's party, the group as the data defines it).
 * - {@link forced} swaps the guardian's script for a QUEUE of commands the test pushes (a rig, not a chapter): the move under test happens when the test says, and the engine resolves it with the game's rows,
 *   so the checks are of the engine and the data, not of the script (the scripts have their own file, `bevelle-guardians-ai.test.ts`).
 * - {@link LINES} are named policies standing in for a player; a line is an input to a measurement, never game data, and nothing here tunes a boss (rule 6; `docs/handoff/ch-bevelle-guardians.md`).
 */

import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { bevelleGuardiansBuild } from '../../../src/data/ffx2/builds/bevelle-guardians.ts';
import { bevelleGuardiansGroups } from '../../../src/data/ffx2/enemies/bevelle-guardians.ts';
import { BEVELLE_GUARDIANS_BODY_IDS } from '../../../src/data/bevelle-guardians-ids.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { logOf, makeInvincible, nextInput, topUp, type AngraEv } from './angraMainyuDrive.ts';

export { logOf, makeInvincible, nextInput, topUp, type AngraEv };

type Input = Extract<Decision, { kind: 'player-input' }>;
/** 0 = Georapella (floor 3), 1 = the Precepts Guard (floor 3), 2 = Baralai (floor 7). */
export type Act = 0 | 1 | 2;

export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The guardian of an act. */
export const bossOf = (act: Act): string => BEVELLE_GUARDIANS_BODY_IDS[act];

/** The commands a test pushes for the forced script to return, in order. */
export interface Forced {
  readonly queue: Command[];
}

let forcedCount = 0;

/** A copy of act `act`'s group whose guardian runs a script that returns the queued commands (then nothing). The real script's reaction hooks stay; only the poll is the test's. */
export function forced(act: Act): { group: EnemyGroupDef; forced: Forced } {
  const queue: Command[] = [];
  const id = `zz-forced-bevelle-${forcedCount++}`;
  const base = bevelleGuardiansGroups[act]!;
  registerAiScript({ ...aiScriptFor(base.enemies[0]!.aiScriptId), id, decide: () => queue.shift() ?? null });
  return { group: { ...base, enemies: base.enemies.map((e) => ({ ...e, aiScriptId: id })) }, forced: { queue } };
}

export interface OpenOptions {
  build?: FFX2PartyBuild;
  group?: EnemyGroupDef;
  /** The girls carry Invincible from the first moment: the guardian's script runs on its own clock for as long as the test wants. */
  immortal?: boolean;
  atbMode?: 'wait' | 'active';
  flags?: Record<string, string | number | boolean>;
  triggers?: BattleSetup['triggers'];
}

/** A fresh engine on act `act`, the chapter's party (a copy), one seed. */
export function openAct(act: Act, seed: number, opts: OpenOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait' }));
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: opts.build ?? structuredClone(bevelleGuardiansBuild),
    enemies: opts.group ?? bevelleGuardiansGroups[act]!,
    triggers: opts.triggers ?? [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  Object.assign(engine.state().flags, opts.flags ?? {});
  if (opts.immortal) for (const id of GIRLS) makeInvincible(engine.state().combatants[id] as unknown as FFX2Combatant);
  return engine;
}

/** A combatant as the engine holds it, with the AI memory a script keeps on an enemy. */
export type Unit = FFX2Combatant & { aiMemory?: Record<string, unknown> };

export const unit = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;

/** How many actions `actor` has finished so far. */
export function endsOf(engine: FFX2Engine, actor: string): number {
  return logOf(engine).filter((e) => e.type === 'action-end' && e.actorId === actor).length;
}

/** The girl's turn: `null` = defend. */
export type Turn = (d: Input, engine: FFX2Engine) => Command | null;

/** Play forward until `boss` has finished `count` actions (or the battle ends, or the budget runs out). The girls answer with `turn` (defend by default). True when the count was reached. */
export function playUntilBossActed(engine: FFX2Engine, boss: string, count: number, turn: Turn = () => null, opts: { immortal?: boolean; maxDecisions?: number } = {}): boolean {
  for (let i = 0; i < (opts.maxDecisions ?? 4000); i++) {
    if (endsOf(engine, boss) >= count) return true;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return endsOf(engine, boss) >= count;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (opts.immortal) topUp(engine);
    engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
  }
  return endsOf(engine, boss) >= count;
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

/** An ability command of the guardian, for the forced queue. */
export const move = (id: string, targets: string[] = []): Command => ({ kind: 'ability', id, targets });

/** The girls as the engine holds them. */
export function girlsOf(engine: FFX2Engine): Unit[] {
  return GIRLS.map((id) => unit(engine, id));
}

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

export type LineName = 'defend' | 'attack' | 'careful' | 'counter';

/** A girl who is down: a Phoenix Down raises her. */
function fallenGirl(engine: FFX2Engine): FFX2Combatant | undefined {
  return girlsOf(engine).find((g) => !g.alive && !g.removed);
}

function lowestFraction(engine: FFX2Engine): FFX2Combatant | undefined {
  return girlsOf(engine)
    .filter((g) => g.alive)
    .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
}

const DARKNESS = 'x2-dark-knight-darkness';

/**
 * Tending: what Yuna does when she is not attacking, and what Rikku does while a girl is down. A fallen girl is raised first (a Phoenix Down), a girl under 45 percent is cured (Cura from Yuna when she has the MP,
 * else a Hi-Potion), and otherwise null.
 */
function tend(d: Input, engine: FFX2Engine): Command | null {
  const fall = fallenGirl(engine);
  if (fall && (d.actorId === 'yuna' || d.actorId === 'rikku')) {
    const revive = rowOf(d, 'item', 'x2-phoenix-down', [fall.id]);
    if (revive) return revive;
  }
  if (d.actorId === 'yuna') {
    const low = lowestFraction(engine);
    if (low && low.hp < low.stats.maxHp * 0.45) {
      return rowOf(d, 'ability', 'x2-white-mage-cura', [low.id]) ?? rowOf(d, 'ability', 'x2-white-mage-cure', [low.id]) ?? rowOf(d, 'item', 'x2-hi-potion', [low.id]);
    }
  }
  return null;
}

/**
 * The curtains the careful lines open with: Rikku's first two turns are a Lunar Curtain (Shell on the party: the Ga spells and Demi are magic) and a Light Curtain (Protect: Drill Shot, Chain Attack and Glint are
 * physical). A fallen girl comes first.
 */
function curtains(d: Input, rikkuTurns: number): Command | null {
  if (d.actorId !== 'rikku') return null;
  if (rikkuTurns === 1) return rowOf(d, 'item', 'x2-lunar-curtain', []);
  if (rikkuTurns === 2) return rowOf(d, 'item', 'x2-light-curtain', []);
  return null;
}

/** The fighter's blow: Rikku casts Darkness when she has the HP to spare (it costs HP), else attacks; Paine attacks. Yuna, a White Mage, has NO Attack row in this build (`attackOf` answers a defend for her): she only tends, and never makes a result on the guardian. */
function strike(d: Input, boss: string, engine: FFX2Engine): Command {
  if (d.actorId === 'rikku' && unit(engine, 'rikku').hp > unit(engine, 'rikku').stats.maxHp * 0.5) {
    const dark = rowOf(d, 'ability', DARKNESS, []);
    if (dark) return dark;
  }
  return attackOf(d, boss);
}

/** The count Baralai keeps of results landed on him (his AI memory; the game shows none). */
export function baralaiHits(engine: FFX2Engine): number {
  const v = (engine.state().combatants['x2-baralai'] as Unit | undefined)?.aiMemory?.['baralaiHits']; // 0 in an act without him
  return typeof v === 'number' ? v : 0;
}

/**
 * The lines. `defend` is nobody doing anything useful (the control). `attack` is everyone striking the guardian, with no healing at all (Yuna has no Attack row, so she defends). `careful` opens with Rikku's two curtains, raises the fallen, cures under 45 percent and
 * otherwise strikes (Rikku's Darkness while she has the HP). `counter` is `careful` plus the answer to Baralai's counter: **a player who counts**. At eight or nine blows landed on him, only Paine strikes (Yuna and Rikku tend,
 * defend or wait), so the tenth result, and the Drill Shot with it, is Paine's: the Warrior with the most HP after the curtains, Protect halving the shot.
 */
export const LINES: Record<LineName, (act: Act) => Turn> = {
  defend: () => () => null,
  attack: (act) => (d) => attackOf(d, bossOf(act)),
  careful: (act) => carefulLine(bossOf(act)),
  counter: (act) => counterLine(bossOf(act)),
};

function carefulLine(boss: string): Turn {
  let rikkuTurns = 0;
  return (d, engine) => {
    if (d.actorId === 'rikku') rikkuTurns += 1;
    return tend(d, engine) ?? curtains(d, rikkuTurns) ?? strike(d, boss, engine);
  };
}

/** The counting player: from `HOLD_FROM` blows on, only Paine strikes. */
const HOLD_FROM = 8;
function counterLine(boss: string): Turn {
  let rikkuTurns = 0;
  return (d, engine) => {
    if (d.actorId === 'rikku') rikkuTurns += 1;
    const tended = tend(d, engine) ?? curtains(d, rikkuTurns);
    if (tended) return tended;
    if (baralaiHits(engine) >= HOLD_FROM && d.actorId !== 'paine') return null; // defend: the next result is Paine's
    return strike(d, boss, engine);
  };
}

export interface FightResult {
  outcome: string | undefined;
  ticks: number;
  bossHp: number;
  decisions: number;
  girlsAlive: number;
  moves: Record<string, number>;
  kos: number;
  /** Who each Drill Shot landed on, in order (Baralai only). */
  drillShots: string[];
  log: readonly AngraEv[];
}

/** One whole fight on one line. */
export function fight(act: Act, seed: number, line: LineName, opts: OpenOptions & { maxDecisions?: number } = {}): FightResult {
  const boss = bossOf(act);
  const engine = openAct(act, seed, opts);
  const turn = LINES[line](act);
  let outcome: string | undefined;
  let decisions = 0;
  for (let i = 0; i < (opts.maxDecisions ?? 6000); i++) {
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
    if (opts.immortal) topUp(engine);
    engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
  }
  const log = logOf(engine);
  const moves: Record<string, number> = {};
  let kos = 0;
  const drillShots: string[] = [];
  for (const e of log) {
    if (e.type === 'action-start' && e.actorId === boss && e.abilityId !== undefined) moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
    if (e.type === 'ko' && (GIRLS as readonly string[]).includes(e.targetId ?? '')) kos += 1;
    if (e.type === 'action-start' && e.actorId === boss && e.abilityId === 'x2-baralai-drill-shot' && e.targets?.[0] !== undefined) drillShots.push(e.targets[0]);
  }
  const b = unit(engine, boss);
  return { outcome, ticks: engine.state().ticks, bossHp: b.hp, decisions, girlsAlive: girlsOf(engine).filter((g) => g.alive).length, moves, kos, drillShots, log };
}

/**
 * Play forward (every girl defends, the guardian's script answers on its own) until `done(engine)` holds, the battle ends or the budget runs out. True when `done` held. `immortal` tops the girls up at each of their decisions.
 */
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
