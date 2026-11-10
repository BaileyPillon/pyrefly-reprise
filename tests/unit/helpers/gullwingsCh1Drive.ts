/**
 * Drive Gullwings, Chapter 1 (the four hotspot fights of the hidden FFX-2 chapter) headlessly with a named line of play. **FFX-2 only.** A *line* is a small priority policy standing in for a player; it is an input to a
 * measurement, never game data, and nothing here tunes a boss (rule 6; `docs/plans/ch-dragon-review.md` §8).
 *
 * - **advisor**: the shipped move advisor's tactic (`src/engine/tactics/ffx2-gullwings-ch1.ts`, the line the guide teaches): revive, free a Stopped girl, heal under 45 percent, then each girl's role in the fight (Black Mage
 *   Rikku and Paine against the Beast and YSLS-Zero, a White Mage Yuna who heals, Blizzard against the Flame Dragon).
 * - **naive**: the three girls as they start (Gunner, Thief, Warrior) with no answers: every girl strikes; Yuna and Rikku raise a fallen girl and use a Potion on a girl under 40 percent. No Change, no Remedy, no element.
 * - **defend**: nobody does anything (the control: the fight ends in defeat).
 *
 * {@link openAct} opens one act on the real engine; {@link forced} swaps a boss's script for a queue of commands the test pushes (a rig, not a chapter), so the move under test happens when the test says and the engine resolves
 * it with the game's rows, as the Bevelle chapter's tests do.
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { gullwingsCh1Build } from '../../../src/data/ffx2/builds/gullwings-ch1.ts';
import { gullwingsCh1Groups } from '../../../src/data/ffx2/enemies/gullwings-ch1.ts';
import { GULLWINGS_CH1_BODY_IDS } from '../../../src/data/gullwings-ch1-ids.ts';
import { ffx2GullwingsCh1 } from '../../../src/engine/tactics/ffx2-gullwings-ch1.ts';
import type { Tactic } from '../../../src/engine/tactics/common.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean; stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown>; aiMemory?: Record<string, unknown>; dresspheres?: { current?: string } };

/** 0 = Boris, 1 = the Flame Dragon, 2 = the Guardian Beast, 3 = YSLS-Zero. */
export type Act = 0 | 1 | 2 | 3;
export const ACTS: readonly Act[] = [0, 1, 2, 3];
export type GullwingsLine = 'advisor' | 'naive' | 'defend';
export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The boss of an act. */
export const bossOf = (act: Act): string => GULLWINGS_CH1_BODY_IDS[act];

export function girlsOf(engine: FFX2Engine): Unit[] {
  return GIRLS.map((id) => engine.state().combatants[id] as unknown as Unit);
}

export function unit(engine: FFX2Engine, id: string): Unit {
  return engine.state().combatants[id] as unknown as Unit;
}

/** The commands a test pushes for the forced script to return, in order. */
export interface Forced {
  readonly queue: Command[];
}

let forcedCount = 0;

/** A copy of act `act`'s group whose boss runs a script that returns the queued commands (then nothing). The real script's other hooks stay; only the poll is the test's. */
export function forced(act: Act): { group: EnemyGroupDef; forced: Forced } {
  const queue: Command[] = [];
  const id = `zz-forced-gullwings-${forcedCount++}`;
  const base = gullwingsCh1Groups[act]!;
  registerAiScript({ ...aiScriptFor(base.enemies[0]!.aiScriptId), id, decide: () => queue.shift() ?? null });
  return { group: { ...base, enemies: base.enemies.map((e) => ({ ...e, aiScriptId: id })) }, forced: { queue } };
}

export interface OpenOptions {
  build?: FFX2PartyBuild;
  group?: EnemyGroupDef;
  atbMode?: 'wait' | 'active';
  engine?: Partial<Ffx2EngineOptions>;
  flags?: Record<string, number | string | boolean>;
  triggers?: BattleSetup['triggers'];
}

/** A fresh engine on act `act`, the chapter's party (a copy), one seed. */
export function openAct(act: Act, seed: number, opts: OpenOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait', ...opts.engine }));
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: structuredClone(opts.build ?? gullwingsCh1Build),
    enemies: opts.group ?? gullwingsCh1Groups[act]!,
    triggers: opts.triggers ?? [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  Object.assign(engine.state().flags, opts.flags ?? {});
  return engine;
}

/** The log as plain records. */
export type Ev = BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; targets?: string[]; amount?: number; status?: string; name?: string };
export const logOf = (engine: FFX2Engine): readonly Ev[] => engine.state().log as readonly Ev[];

function use(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const row = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return row ? ({ ...row.command, targets } as Command) : null;
}

function fallback(d: Input, boss: string): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => t === boss) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** The naive line: every girl strikes; Yuna and Rikku raise a fallen girl and use a Potion under 40 percent; no Change, no Remedy, no element. */
function naiveTurn(d: Input, engine: FFX2Engine, boss: string): Command | null {
  const party = girlsOf(engine);
  if (d.actorId === 'yuna' || d.actorId === 'rikku') {
    const ko = party.find((u) => !u.alive && !u.removed);
    if (ko) return use(d, 'item', 'x2-phoenix-down', [ko.id]);
    const lowest = party.filter((u) => u.alive).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
    if (lowest && lowest.hp < lowest.stats.maxHp * 0.4) return use(d, 'item', 'x2-potion', [lowest.id]);
  }
  const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  return swing ? ({ ...swing.command, targets: [boss] } as Command) : null;
}

export interface ActRun {
  outcome: string | undefined;
  ticks: number;
  /** The boss's actions by ability id. */
  moves: Record<string, number>;
  /** The boss's actions in order (ability ids). */
  order: string[];
  partyTurns: number;
  /** Girls knocked out, counted per KO event. */
  kos: number;
  /** Times a girl took Stop / Curse (status events). */
  stops: number;
  curses: number;
  /** The boss's remaining HP at the end. */
  bossHp: number;
  log: readonly BattleEvent[];
}

export interface DriveOptions extends OpenOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  /** Wait split only: ms on the top-level list with the clock running. */
  topMs?: number;
  maxDecisions?: number;
  /** The advisor line's tactic (default: the shipped one); the bench passes the role tables it compares. */
  tactic?: Tactic;
}

export function summarise(engine: FFX2Engine, act: Act, outcome: string | undefined): ActRun {
  const boss = bossOf(act);
  const log = logOf(engine);
  const moves: Record<string, number> = {};
  const order: string[] = [];
  let partyTurns = 0;
  let kos = 0;
  let stops = 0;
  let curses = 0;
  for (const e of log) {
    if (e.type === 'action-start') {
      if (e.actorId === boss && e.abilityId !== undefined) {
        moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
        order.push(e.abilityId);
      } else if (e.actorId !== boss) partyTurns += 1;
    }
    if (e.type === 'ko' && e.targetId !== boss) kos += 1;
    if (e.type === 'status-add' && GIRLS.includes(e.targetId as (typeof GIRLS)[number])) {
      if (e.status === 'stop') stops += 1;
      if (e.status === 'curse') curses += 1;
    }
  }
  return { outcome, ticks: engine.state().ticks, moves, order, partyTurns, kos, stops, curses, bossHp: unit(engine, boss).hp, log };
}

/** One act from the chapter's party (or `opts.build`), one line, one seed. */
export function driveAct(act: Act, line: GullwingsLine, seed: number, opts: DriveOptions = {}): ActRun {
  const engine = openAct(act, seed, opts);
  const boss = bossOf(act);
  const decisionMs = opts.decisionMs ?? 0;
  const limit = opts.maxDecisions ?? 40_000;
  for (let i = 0; i < limit; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summarise(engine, act, d.result.outcome);
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
    if (line === 'defend') {
      engine.submit({ kind: 'defend', targets: [] });
      continue;
    }
    const picked = line === 'advisor' ? (opts.tactic ?? ffx2GullwingsCh1)(d.actorId, d.commands, engine) : naiveTurn(d, engine, boss);
    engine.submit(picked ?? fallback(d, boss));
  }
  return summarise(engine, act, undefined);
}

/** The chapter's party at other levels (a measurement input; Yuna, Rikku, Paine). */
export function levelsBuild(yuna: number, rikku: number, paine: number): FFX2PartyBuild {
  const build = structuredClone(gullwingsCh1Build);
  [yuna, rikku, paine].forEach((level, i) => {
    build.members[i]!.level = level;
  });
  return build;
}

export const moveCmd = (id: string, targets: string[] = []): Command => ({ kind: 'ability', id, targets });
