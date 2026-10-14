/**
 * Drive the Tourist Trap (the optional FFX-2 mission, Yojimbo and Daigoro in the Cavern of the Stolen Fayth; the hidden chapter) headlessly. **FFX-2 only.** A *line* is an input to a
 * measurement, never game data, and nothing here tunes the boss (rule 6): `intendedStrategy` is what the move advisor and the autopilot play, and it reads the chapter's tactic
 * (`src/engine/tactics/ffx2-tourist-trap.ts`); `naive` is the same party attacking with no answers, reported and never tuned to.
 *
 * - `driveFight(seed, opts)` plays the one fight on any build, clock and action-time setting.
 * - `summarise(log)` reads Yojimbo's polls and real actions in order, Daigoro's bites, the poll and the time of each Zanmato, and the girls' knock-outs and turns off any log.
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { FFX2_TOURIST_TRAP } from '../../../src/data/chapter-ffx2-tourist-trap.ts';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { YOJIMBO_ACTIONS } from '../../../src/data/ffx2/enemies/tourist-trap-abilities.ts';
import { TOURIST_TRAP_BODY_IDS, X2_DAIGORO_ID, X2_YOJIMBO_ID, cavernYojimboGroup } from '../../../src/data/ffx2/enemies/tourist-trap.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** `intended` is the shipped line; `naive` attacks every turn and heals nobody. */
export type TouristTrapLine = 'intended' | 'naive';

export interface TouristTrapRun {
  outcome: string | undefined;
  ticks: number;
  /** Yojimbo's real actions (Kozuka, Wakizashi, Zanmato), by ability id, in the order he used them: a dog pick is a poll, not an action. */
  sequence: string[];
  /** Yojimbo's polls (his `turn-start` events: every poll, a dog pick included). */
  polls: number;
  /** The poll each of his Zanmatos came on (1-based, counted from the start of the fight): 14, 28, 42 ... */
  zanmatoPolls: number[];
  /** The time of each Zanmato, in seconds of battle time (the start of the poll that queued it). */
  zanmatoSeconds: number[];
  /** Daigoro's bites (his own actions). */
  bites: number;
  /** Yojimbo's moves, counted by ability id. */
  moves: Record<string, number>;
  /** The girls' actions. */
  partyTurns: number;
  /** Times a girl was knocked out. */
  kos: number;
  log: readonly BattleEvent[];
}

export interface TouristTrapDriveOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  build?: FFX2PartyBuild;
  line?: TouristTrapLine;
  /** The formation to fight: the shipped one by default. */
  group?: EnemyGroupDef;
}

const MAX_DECISIONS = 40_000;

/** The shipped formation with action time OFF (the control: the research prints no length, `TOURIST_TRAP_ACTION_TIME_ON`). */
export function withoutActionTime(group: EnemyGroupDef = cavernYojimboGroup): EnemyGroupDef {
  const { actionTimeSeconds: _unused, ...rest } = group;
  return rest;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => t === X2_YOJIMBO_ID) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** Yojimbo's moves and the girls' knock-outs, read off any log. */
export function summarise(log: readonly BattleEvent[]): Pick<TouristTrapRun, 'sequence' | 'polls' | 'zanmatoPolls' | 'zanmatoSeconds' | 'bites' | 'moves' | 'partyTurns' | 'kos'> {
  const sequence: string[] = [];
  const moves: Record<string, number> = {};
  const zanmatoPolls: number[] = [];
  const zanmatoSeconds: number[] = [];
  let polls = 0;
  let bites = 0;
  let partyTurns = 0;
  let kos = 0;
  let lastTicks = 0;
  for (const e of log as readonly (BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; who?: string; elapsedTicks?: number })[]) {
    if (e.type === 'turn-start' && e.actorId === X2_YOJIMBO_ID) {
      polls += 1;
      lastTicks = e.elapsedTicks ?? lastTicks;
    }
    if (e.type === 'action-start') {
      if (e.actorId === X2_DAIGORO_ID) bites += 1;
      else if (e.actorId !== undefined && TOURIST_TRAP_BODY_IDS.includes(e.actorId)) {
        const id = e.abilityId ?? '?';
        sequence.push(id);
        moves[id] = (moves[id] ?? 0) + 1;
        if (id === YOJIMBO_ACTIONS.zanmato) {
          zanmatoPolls.push(polls);
          zanmatoSeconds.push(lastTicks / STEPS_PER_SECOND);
        }
      } else partyTurns += 1;
    }
    if (e.type === 'ko') {
      const who = e.targetId ?? e.who;
      if (who !== undefined && !TOURIST_TRAP_BODY_IDS.includes(who)) kos += 1;
    }
  }
  return { sequence, polls, zanmatoPolls, zanmatoSeconds, bites, moves, partyTurns, kos };
}

/** One fight from the chapter's party (or `opts.build`), one line, one seed. The Wait clock by default, as a player has it. */
export function driveFight(seed = 1, opts: TouristTrapDriveOptions = {}): TouristTrapRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2',
    party: opts.build ?? (FFX2_TOURIST_TRAP.buildRef as FFX2PartyBuild),
    enemies: opts.group ?? cavernYojimboGroup,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  const decisionMs = opts.decisionMs ?? 0;
  const line = opts.line ?? 'intended';
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, ticks: engine.state().ticks, ...summarise(engine.state().log), log: engine.state().log };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    const picked = line === 'intended' ? intendedStrategy(d.actorId, d.commands, engine) : null;
    engine.submit(picked ?? fallback(d));
  }
  return { outcome: undefined, ticks: engine.state().ticks, ...summarise(engine.state().log), log: engine.state().log };
}
