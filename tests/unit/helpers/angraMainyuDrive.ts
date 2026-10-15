/**
 * Drive Angra Mainyu (FFX-2 Chapter 5, the hidden chapter) headlessly with a named line of play. **FFX-2 only.** A *line* is a small priority policy standing in for a player; it is an input to a measurement,
 * never game data, and nothing here tunes the boss (rule 6; `docs/plans/ch-angra-mainyu-review.md` §7).
 *
 * - **advisor**: the shipped move advisor's tactic (`src/engine/tactics/ffx2-angra-mainyu.ts`, the line the guide teaches): Yuna revives, ethers, cures a Silence, heals, Protect and Shell, Esuna; Rikku and Paine Darkness.
 * - **naive**: the same girls with no answers: Yuna only revives and cures a girl below 40 % (else Prays), Rikku Darkness, Paine the plain attack on the body. No Protect, no Shell, no items.
 * - **defend**: nobody does anything useful (every girl defends), so the three bodies' scripts run on their own clocks against a party that only stands; used to read the scripts' cadence in the real engine.
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { angraMainyuBuild } from '../../../src/data/ffx2/builds/angra-mainyu.ts';
import { angraMainyuGroup } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { ANGRA_MAINYU_BODY_IDS, X2_ANGRA_MAINYU_ID, X2_TAWRICH_ID, X2_ZARICH_ID } from '../../../src/data/angra-mainyu-ids.ts';
import { ffx2AngraMainyu } from '../../../src/engine/tactics/ffx2-angra-mainyu.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean; stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown> };

export type AngraLine = 'advisor' | 'naive' | 'defend';

function girls(engine: FFX2Engine): Unit[] {
  return (Object.values(engine.state().combatants) as unknown as Unit[]).filter((u) => u.side === 'party' && !u.removed);
}

function use(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const row = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return row ? ({ ...row.command, targets } as Command) : null;
}

/** The naive line: no answers to anything. */
function naiveTurn(d: Input, engine: FFX2Engine): Command | null {
  if (d.actorId === 'yuna') {
    const party = girls(engine);
    const ko = party.filter((u) => !u.alive);
    if (ko[0]) return use(d, 'item', 'x2-phoenix-down', [ko[0].id]) ?? use(d, 'ability', 'x2-white-mage-life', [ko[0].id]);
    const lowest = [...party].filter((u) => u.alive).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
    if (lowest && lowest.hp < lowest.stats.maxHp * 0.4) return use(d, 'ability', 'x2-white-mage-cura', [lowest.id]);
    return use(d, 'ability', 'x2-white-mage-pray', []);
  }
  if (d.actorId === 'rikku') return use(d, 'ability', 'x2-dark-knight-darkness', []);
  return null; // Paine: the fallback, the plain attack on the body
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => t === X2_ANGRA_MAINYU_ID) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** A decision that asks a girl for a command. */
export type AngraInput = Extract<Decision, { kind: 'player-input' }>;

/** A fresh engine on the chapter's fight, initialised exactly as {@link driveAngra} does; the caller steps it with {@link nextInput}. */
export function openAngra(seed: number, opts: AngraDriveOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2', party: opts.build ?? angraMainyuBuild, enemies: opts.group ?? angraMainyuGroup, triggers: opts.triggers ?? [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  Object.assign(engine.state().flags, opts.flags ?? {});
  if (opts.immortal) for (const id of ['yuna', 'rikku', 'paine']) makeInvincible(engine.state().combatants[id] as unknown as FFX2Combatant);
  return engine;
}

/** Every girl still standing back to full HP: Invincible stops the hits, not the poison that Bio and Bloody Breath leave, so the immortal rig tops up at every decision (a girl who is down is left down). */
export function topUp(engine: FFX2Engine): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const u = engine.state().combatants[id] as unknown as FFX2Combatant;
    if (u.alive) u.hp = u.stats.maxHp;
  }
}

/** Invincible for good (nothing a body throws lands), laid the way the engine lays an enemy's automatic status: no clock, no draw. */
export function makeInvincible(unit: FFX2Combatant): void {
  const instance = applyStatus(unit, { status: 'invincible', chance: 255, duration: 0 }, unit.id);
  if (instance) instance.ticksRemaining = null;
}

/** Step the engine (ticking through every wait) to the next decision that asks a girl for a command; `null` once the battle is over. */
export function nextInput(engine: FFX2Engine, maxDecisions = MAX_DECISIONS): AngraInput | null {
  for (let i = 0; i < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'player-input') return d;
  }
  return null;
}

/** The log's events as the tests read them (only the fields they use). */
export interface AngraEv {
  type: string;
  actorId?: string;
  targetId?: string;
  sourceId?: string;
  abilityId?: string;
  amount?: number;
  hitIndex?: number;
  hitCount?: number;
  reason?: string;
  status?: string;
  count?: number;
  multiplier?: number;
  element?: string;
  affinity?: string;
  cause?: string;
  hp?: number;
  elapsedTicks?: number;
  targets?: string[];
  instance?: { stacks?: number };
  result?: { outcome?: string; ap?: number; exp?: number; gil?: number; drops?: Array<{ itemId: string; count: number }> };
}

/** The engine's log, typed for the tests. */
export function logOf(engine: FFX2Engine): readonly AngraEv[] {
  return engine.state().log as unknown as readonly AngraEv[];
}

/** How many actions `actor` has started so far. */
export function startsOf(engine: FFX2Engine, actor: string): number {
  return logOf(engine).filter((e) => e.type === 'action-start' && e.actorId === actor).length;
}

/**
 * Play an engine forward, one decision at a time: `turn` answers each girl's menu (`null` = defend) and `until` is asked at every new decision, before it is answered. True once `until` holds; false when the
 * battle ends first or the decision budget runs out. `immortal` tops the girls up before each answer (see {@link topUp}).
 */
export function playAngra(
  engine: FFX2Engine,
  turn: (d: AngraInput) => Command | null,
  until: (engine: FFX2Engine) => boolean,
  opts: { immortal?: boolean; maxDecisions?: number } = {},
): boolean {
  for (let i = 0; i < (opts.maxDecisions ?? MAX_DECISIONS); i++) {
    const d = nextInput(engine);
    if (!d) return false;
    if (until(engine)) return true;
    if (opts.immortal) topUp(engine);
    engine.submit(turn(d) ?? { kind: 'defend', targets: [] });
  }
  return false;
}

/** The offered row of `kind` + `id` as a command aimed at `targets` (the same lookup the lines use), or `null` when the menu does not offer it. */
export function commandOf(d: AngraInput, kind: string, id: string, targets: string[]): Command | null {
  return use(d, kind, id, targets);
}

export interface AngraRun {
  outcome: string | undefined;
  ticks: number;
  /** The body's actions by ability id. */
  moves: Record<string, number>;
  /** Zarich's and Tawrich's actions by ability id. */
  armMoves: Record<string, number>;
  /** The body's actions in order (ability ids). */
  order: string[];
  /** Zarich's actions in order. */
  zarichOrder: string[];
  /** Tawrich's actions in order. */
  tawrichOrder: string[];
  partyTurns: number;
  /** Girls knocked out at least once, counted per KO event. */
  kos: number;
  /** Arms knocked out, counted per KO event, and revived by Full-Life. */
  armKos: number;
  armRevives: number;
  log: readonly BattleEvent[];
}

export interface AngraDriveOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  /** Wait split only: ms on the top-level list with the clock running. */
  topMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  build?: FFX2PartyBuild;
  /** A different formation (a test's variant of the three bodies). */
  group?: EnemyGroupDef;
  /** `state.flags` set after init. */
  flags?: Record<string, string | number | boolean>;
  /** Stop after this many decisions (a probe), and report what was seen. */
  maxDecisions?: number;
  /** The chapter's mid-battle triggers (`setupForChapter(...).triggers`); none by default. */
  triggers?: BattleSetup['triggers'];
  /** A measurement rig, not a chapter: the three girls carry Invincible from the first moment, so the three scripts run on their own clocks for as long as the test wants. */
  immortal?: boolean;
  /** Stop (and report what was seen) as soon as this is true; asked after every command is submitted. */
  stopWhen?: (engine: FFX2Engine) => boolean;
}

const MAX_DECISIONS = 60_000;

export function summariseAngra(engine: FFX2Engine, outcome: string | undefined): AngraRun {
  const log = engine.state().log;
  const moves: Record<string, number> = {};
  const armMoves: Record<string, number> = {};
  const order: string[] = [];
  const zarichOrder: string[] = [];
  const tawrichOrder: string[] = [];
  const isBody = (id: string | undefined): boolean => (ANGRA_MAINYU_BODY_IDS as readonly string[]).includes(id ?? '');
  let partyTurns = 0;
  let kos = 0;
  let armKos = 0;
  let armRevives = 0;
  for (const e of log as readonly (BattleEvent & { actorId?: string; abilityId?: string; targetId?: string })[]) {
    if (e.type === 'action-start') {
      if (e.actorId === X2_ANGRA_MAINYU_ID && e.abilityId !== undefined) {
        moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
        order.push(e.abilityId);
      } else if ((e.actorId === X2_ZARICH_ID || e.actorId === X2_TAWRICH_ID) && e.abilityId !== undefined) {
        armMoves[e.abilityId] = (armMoves[e.abilityId] ?? 0) + 1;
        (e.actorId === X2_ZARICH_ID ? zarichOrder : tawrichOrder).push(e.abilityId);
      } else if (!isBody(e.actorId)) partyTurns += 1;
    }
    if (e.type === 'ko') {
      if (e.targetId === X2_ZARICH_ID || e.targetId === X2_TAWRICH_ID) armKos += 1;
      else if (!isBody(e.targetId)) kos += 1;
    }
    if (e.type === 'revive' && (e.targetId === X2_ZARICH_ID || e.targetId === X2_TAWRICH_ID)) armRevives += 1;
  }
  return { outcome, ticks: engine.state().ticks, moves, armMoves, order, zarichOrder, tawrichOrder, partyTurns, kos, armKos, armRevives, log };
}

/** One fight from the chapter's preset (or `opts.build`), one line, one seed. */
export function driveAngra(line: AngraLine, seed: number, opts: AngraDriveOptions = {}): AngraRun {
  const engine = openAngra(seed, opts);
  const decisionMs = opts.decisionMs ?? 0;
  const limit = opts.maxDecisions ?? MAX_DECISIONS;
  for (let i = 0; i < limit; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summariseAngra(engine, d.result.outcome);
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (opts.topMs !== undefined && opts.topMs > 0) {
      engine.setMenuLevel('top');
      engine.tick(Math.min(opts.topMs, decisionMs), { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
    } else if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    if (opts.immortal) topUp(engine);
    if (line === 'defend') {
      engine.submit({ kind: 'defend', targets: [] });
      if (opts.stopWhen?.(engine)) break;
      continue;
    }
    const picked = line === 'advisor' ? ffx2AngraMainyu(d.actorId, d.commands, engine) : naiveTurn(d, engine);
    engine.submit(picked ?? fallback(d));
    if (opts.stopWhen?.(engine)) break;
  }
  return summariseAngra(engine, undefined);
}
