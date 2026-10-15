/**
 * Drive Angra Mainyu at the Bikanel excavation camp (FFX-2 Chapter 5, the hidden chapter) headlessly with a named line of play. **FFX-2 only.** A *line* is a small priority policy standing in for
 * a player; it is an input to a measurement, never game data, and nothing here tunes the boss (rule 6; `docs/plans/ch-angra-mainyu-review.md`).
 *
 * - **advisor**: the shipped move advisor (`intendedStrategy`, which finds `src/engine/tactics/ffx2-angra-mainyu.ts` by the boss on the board: the line the guide teaches): Yuna revives, heals,
 *   Protects and cleanses; Rikku and Paine cast Darkness, drink when low, and raise Yuna.
 * - **naive**: the same girls with no answers, a player who has not found the trick: Yuna only revives and cures a girl below 40 % (else Prays); Rikku and Paine swing at the body with the plain
 *   Attack. No Darkness, no Protect, no cleansing.
 * - **swing**: the engine tests' control, never benched: Yuna plays the advisor's line, and Rikku and Paine swing at the body, so no arm ever falls and his clock runs untouched.
 */

import type { BattleEvent, BattleResult, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { ANGRA_ABILITY, ANGRA_ID } from '../../../src/data/angra-mainyu-ids.ts';
import { angraMainyuGroup } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

export type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean; stats: { maxHp: number; maxMp: number } };

export type AngraLine = 'advisor' | 'naive' | 'swing';

function girls(engine: FFX2Engine): Unit[] {
  return (Object.values(engine.state().combatants) as unknown as Unit[]).filter((u) => u.side === 'party' && !u.removed);
}

function use(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const row = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return row ? ({ ...row.command, targets } as Command) : null;
}

/** Rikku's or Paine's plain Attack on the body. */
function swingAtBody(d: Input): Command | null {
  const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(ANGRA_ID));
  return attack ? ({ ...attack.command, targets: [ANGRA_ID] } as Command) : null;
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
  return swingAtBody(d);
}

function pick(line: AngraLine, d: Input, engine: FFX2Engine): Command | null {
  if (line === 'naive') return naiveTurn(d, engine);
  if (line === 'swing' && d.actorId !== 'yuna') return swingAtBody(d);
  return intendedStrategy(d.actorId, d.commands, engine) as Command | null;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => t === ANGRA_ID) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface AngraRun {
  outcome: string | undefined;
  ticks: number;
  /** His actions by ability id. */
  moves: Record<string, number>;
  /** His actions in order (ability ids). */
  order: string[];
  /** Perdition's Flames he began. */
  flames: number;
  /** Arms that fell (`part-destroyed`) and arms he raised (`part-restored`). */
  armFalls: number;
  armRevives: number;
  partyTurns: number;
  /** Girls knocked out, counted per KO event. */
  kos: number;
  log: readonly BattleEvent[];
  engine: FFX2Engine;
  /** The battle's result, when it ended. */
  result?: BattleResult;
}

export interface AngraDriveOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  /** Wait split only: ms on the top-level list with the clock running. */
  topMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  build?: FFX2PartyBuild;
  /** The body's HP and MP after init (a test's start; the chapter starts him full). */
  bodyHp?: number;
  bodyMp?: number;
  /** Stop after this many decisions (a short test); the default runs the fight out. */
  maxDecisions?: number;
  /** Stop as soon as this holds (checked after every step), with the fight unfinished: a test reads the live board at that moment. */
  until?: (engine: FFX2Engine) => boolean;
  /** A test's own command for this menu, ahead of the line (`null`: the line decides). */
  plan?: (d: Input, engine: FFX2Engine) => Command | null;
}

const MAX_DECISIONS = 60_000;

export function summariseAngra(engine: FFX2Engine, outcome: string | undefined, result?: BattleResult): AngraRun {
  const log = engine.state().log;
  const moves: Record<string, number> = {};
  const order: string[] = [];
  let partyTurns = 0;
  let kos = 0;
  let armFalls = 0;
  let armRevives = 0;
  const party = new Set(girls(engine).map((u) => u.id));
  for (const e of log as readonly (BattleEvent & { actorId?: string; abilityId?: string; targetId?: string })[]) {
    if (e.type === 'action-start') {
      if (e.actorId === ANGRA_ID && e.abilityId !== undefined) {
        moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
        order.push(e.abilityId);
      } else if (e.actorId !== undefined && party.has(e.actorId)) partyTurns += 1;
    }
    if (e.type === 'ko' && e.targetId !== undefined && party.has(e.targetId)) kos += 1;
    if (e.type === 'part-destroyed') armFalls += 1;
    if (e.type === 'part-restored') armRevives += 1;
  }
  return {
    outcome, ticks: engine.state().ticks, moves, order, flames: moves[ANGRA_ABILITY.perditionsFlame] ?? 0, armFalls, armRevives, partyTurns, kos, log, engine, ...(result ? { result } : {}),
  };
}

/** One fight from the chapter's preset (or `opts.build`), one line, one seed. */
export function driveAngra(line: AngraLine, seed: number, opts: AngraDriveOptions = {}): AngraRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2', party: opts.build ?? farplaneBuild, enemies: angraMainyuGroup, triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  const body = engine.state().combatants[ANGRA_ID]!;
  if (opts.bodyHp !== undefined) body.hp = opts.bodyHp;
  if (opts.bodyMp !== undefined) body.mp = opts.bodyMp;
  const decisionMs = opts.decisionMs ?? 0;
  const cap = opts.maxDecisions ?? MAX_DECISIONS;
  for (let i = 0; i < cap; i++) {
    if (opts.until?.(engine)) return summariseAngra(engine, undefined);
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summariseAngra(engine, d.result.outcome, d.result);
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
    engine.submit(opts.plan?.(d, engine) ?? pick(line, d, engine) ?? fallback(d));
  }
  return summariseAngra(engine, undefined);
}
