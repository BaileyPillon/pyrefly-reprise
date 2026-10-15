/**
 * Drive the Tourist Trap (the optional FFX-2 mission, Yojimbo and Daigoro in the Cavern of the Stolen Fayth; the hidden chapter) headlessly. **FFX-2 only.** A *line* is an input to a
 * measurement, never game data, and nothing here tunes the boss (rule 6): `intendedStrategy` is what the move advisor and the autopilot play, and it reads the chapter's tactic
 * (`src/engine/tactics/ffx2-tourist-trap.ts`); `naive` is the same party attacking with no answers, reported and never tuned to.
 *
 * - `driveFight(seed, opts)` plays the one fight on any build, clock and action-time setting.
 * - `recordPolls(run)` records every poll of Yojimbo's and Daigoro's scripts while `run` goes, read off the scripts themselves: since 2026-10-14 a poll that is not a turn (a dog pick, the dog asleep)
 *   leaves nothing in the event log (the engine takes its `turn-start` and `action-end` back: `flavour-turn.ts#pollIsNotATurn`), so the log can no longer count polls and `turn-start`s are real turns only.
 *   Do not call `engine.intent()` inside it: the intent board's dry run calls the same scripts on a clone.
 * - `summarise(log, polls)` reads Yojimbo's polls (from the recording) and real actions in order, Daigoro's bites, the poll and the time of each Zanmato, and the girls' knock-outs and turns off any log.
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { FFX2_TOURIST_TRAP } from '../../../src/data/chapter-ffx2-tourist-trap.ts';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { YOJIMBO_ACTIONS, YOJIMBO_SCRIPTS } from '../../../src/data/ffx2/enemies/tourist-trap-abilities.ts';
import { TOURIST_TRAP_BODY_IDS, X2_DAIGORO_ID, X2_YOJIMBO_ID, cavernYojimboGroup } from '../../../src/data/ffx2/enemies/tourist-trap.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** `intended` is the shipped line; `naive` attacks every turn and heals nobody. */
export type TouristTrapLine = 'intended' | 'naive';

/** One call of Yojimbo's or Daigoro's script: who, when, what it queued (null for a dog pick or a sleeping dog) and how many girls were down. */
export interface TouristTrapPoll {
  actorId: string;
  /** Logic steps elapsed at the poll, as a `turn-start`'s `elapsedTicks` reads them. */
  at: number;
  /** The ability the poll queued; null when it queued nothing (Yojimbo's dog pick, Daigoro asleep). */
  abilityId: string | null;
  /** Girls knocked out at the poll (a fallen girl adds 30 steps to a monster's rest, so a rest measured across a knock-out is not the row's). */
  downedGirls: number;
}

/** Record every poll of both scripts while `run` goes, then put the registry back. */
export function recordPolls<T>(run: (polls: TouristTrapPoll[]) => T): T {
  const polls: TouristTrapPoll[] = [];
  const originals = [YOJIMBO_SCRIPTS.yojimbo, YOJIMBO_SCRIPTS.daigoro].map((id) => aiScriptFor(id));
  for (const script of originals) {
    registerAiScript({
      ...script,
      decide(ctx) {
        const command = script.decide(ctx);
        polls.push({
          actorId: ctx.self.id,
          at: Math.round(ctx.ticks),
          abilityId: command && command.kind === 'ability' ? command.id : null,
          downedGirls: ctx.units.filter((u) => u.side === 'party' && !u.alive).length,
        });
        return command;
      },
    });
  }
  try {
    return run(polls);
  } finally {
    for (const script of originals) registerAiScript(script);
  }
}

export interface TouristTrapRun {
  outcome: string | undefined;
  ticks: number;
  /** Yojimbo's real actions (Kozuka, Wakizashi, Zanmato), by ability id, in the order he used them: a dog pick is a poll, not an action. */
  sequence: string[];
  /** Yojimbo's polls (every call of his script, from {@link recordPolls}: a dog pick is a poll, and leaves nothing in the log). */
  polls: number;
  /** Yojimbo's dog picks: polls that queued nothing. */
  dogPicks: number;
  /** Daigoro's polls that queued nothing (he was asleep). */
  sleepingPolls: number;
  /** Every poll of either script, in order. */
  pollLog: readonly TouristTrapPoll[];
  /** The `turn-start` events of the whole log: real turns only (the girls', Yojimbo's real moves, Daigoro's bites). */
  turnStarts: number;
  /** The turns the fight's own result carries (`result.turns`, the results screen's TURNS), or `state().turn` when the fight did not end. */
  turns: number;
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
export function summarise(
  log: readonly BattleEvent[],
  pollLog: readonly TouristTrapPoll[],
): Pick<TouristTrapRun, 'sequence' | 'polls' | 'dogPicks' | 'sleepingPolls' | 'pollLog' | 'turnStarts' | 'zanmatoPolls' | 'zanmatoSeconds' | 'bites' | 'moves' | 'partyTurns' | 'kos'> {
  const sequence: string[] = [];
  const moves: Record<string, number> = {};
  const zanmatoPolls: number[] = [];
  const zanmatoSeconds: number[] = [];
  const yojimboPolls = pollLog.filter((p) => p.actorId === X2_YOJIMBO_ID);
  // The poll each Zanmato was queued on, counted from the start of the fight; only the ones that fired are reported (a charge the fight ended on is not).
  const zanmatoPollNumbers = yojimboPolls.flatMap((p, i) => (p.abilityId === YOJIMBO_ACTIONS.zanmato ? [i + 1] : []));
  let fired = 0;
  let turnStarts = 0;
  let bites = 0;
  let partyTurns = 0;
  let kos = 0;
  let lastTicks = 0;
  for (const e of log as readonly (BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; who?: string; elapsedTicks?: number })[]) {
    if (e.type === 'turn-start') turnStarts += 1;
    if (e.type === 'turn-start' && e.actorId === X2_YOJIMBO_ID) lastTicks = e.elapsedTicks ?? lastTicks; // a real turn: the poll that queued the move
    if (e.type === 'action-start') {
      if (e.actorId === X2_DAIGORO_ID) bites += 1;
      else if (e.actorId !== undefined && TOURIST_TRAP_BODY_IDS.includes(e.actorId)) {
        const id = e.abilityId ?? '?';
        sequence.push(id);
        moves[id] = (moves[id] ?? 0) + 1;
        if (id === YOJIMBO_ACTIONS.zanmato) {
          zanmatoPolls.push(zanmatoPollNumbers[fired] ?? -1);
          zanmatoSeconds.push(lastTicks / STEPS_PER_SECOND);
          fired += 1;
        }
      } else partyTurns += 1;
    }
    if (e.type === 'ko') {
      const who = e.targetId ?? e.who;
      if (who !== undefined && !TOURIST_TRAP_BODY_IDS.includes(who)) kos += 1;
    }
  }
  return {
    sequence,
    polls: yojimboPolls.length,
    dogPicks: yojimboPolls.filter((p) => p.abilityId === null).length,
    sleepingPolls: pollLog.filter((p) => p.actorId === X2_DAIGORO_ID && p.abilityId === null).length,
    pollLog,
    turnStarts,
    zanmatoPolls,
    zanmatoSeconds,
    bites,
    moves,
    partyTurns,
    kos,
  };
}

/** One fight from the chapter's party (or `opts.build`), one line, one seed. The Wait clock by default, as a player has it. */
export function driveFight(seed = 1, opts: TouristTrapDriveOptions = {}): TouristTrapRun {
  return recordPolls((polls) => playFight(seed, opts, polls));
}

function playFight(seed: number, opts: TouristTrapDriveOptions, polls: TouristTrapPoll[]): TouristTrapRun {
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
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, ticks: engine.state().ticks, turns: d.result.turns, ...summarise(engine.state().log, polls), log: engine.state().log };
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
  return { outcome: undefined, ticks: engine.state().ticks, turns: engine.state().turn, ...summarise(engine.state().log, polls), log: engine.state().log };
}
