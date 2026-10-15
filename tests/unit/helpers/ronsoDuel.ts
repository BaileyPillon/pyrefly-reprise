/**
 * The runner and the readings for the **Biran and Yenke duel** (the hidden chapter `biran-yenke`: Kimahri alone against the two Ronso at the gate of Mt. Gagazet). **FFX only.**
 * Test-only.
 *
 * One battle per seed on the real FFX engine and the chapter's own data, set up exactly as the battle screen sets it up (`setupForChapter`). Human pace equals bench speed: FFX
 * is CTB and the clock moves only on turns. **Measure, never tune**: every move is the game's own row and the Ronso's numbers are written from Kimahri's (`research/ffx-biran-yenke.md`);
 * only Kimahri's preset (`data/ffx/builds/gagazet-gate.ts`, an estimate) may move.
 */

import type { AvailableCommand, BattleEngine, BattleEvent, Command, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const CHAPTER_ID = 'biran-yenke';
export const BIRAN = 'biran-ronso';
export const YENKE = 'yenke-ronso';
export type Input = Extract<Decision, { kind: 'player-input' }>;
/** A player line: the command for this decision, or `null` to press the fallback (Attack, else the first row). */
export type Line = (engine: BattleEngine, d: Input) => Command | null;

/** The shipped advisor's line, through the presenter's own dispatcher (so the registration is proved too, not only the tactic). */
export const intendedLine: Line = (engine, d) => intendedStrategy(d.actorId, d.commands, engine) as Command | null;

/** Attack only, at the first target offered: a player who never Lancets, never heals, never uses a Rage. */
export const attackOnly: Line = (_engine, d) => {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  const t = row?.validTargets[0];
  return row ? ({ ...row.command, targets: t ? [t] : [] } as Command) : null;
};

export interface DuelReading {
  seed: number;
  outcome: string;
  /** The engine's turn counter (every actor's turn). */
  turns: number;
  /** Kimahri's decisions. */
  actions: number;
  /** The Rages Lancet taught, in order. */
  learned: string[];
  /** Each Ronso's moves, by command row. */
  moves: Record<string, number>;
  /** Times the two separated ("stand apart") and closed ranks again. */
  apart: number;
  rejoined: number;
  /** Kimahri's Overdrives used, by Rage. */
  rages: Record<string, number>;
  /** Who fell first. */
  firstFall: string;
  /** Kimahri's HP fraction at the end (0 on a loss). */
  hpAtEnd: number;
  /** Damage Kimahri's Attack dealt to the Ronso while they stood together (a covered blow) and apart. */
  coveredHits: number;
  openHits: number;
  /** Loss cause: '' on a win, else the move that took Kimahri down, or 'unresolved'. */
  cause: string;
  /** The largest single hit of Kimahri's area breaths (Aqua Breath, Fire Breath) and of his Lancet on a Ronso. */
  maxBreath: number;
  maxLancet: number;
  /** The largest hit a Ronso dealt Kimahri, by move ('attack' is a berserk Biran's forced Bulldoze). */
  maxHitTaken: Record<string, number>;
}

const fallback = (d: Input): Command => {
  const row: AvailableCommand | undefined = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  return row ? ({ ...row.command, targets: target ? [target] : [] } as Command) : ({ kind: 'defend', targets: [] } as Command);
};

function read(engine: BattleEngine, seed: number, actions: number): DuelReading {
  const s = engine.state();
  const log: readonly BattleEvent[] = s.log;
  const learned: string[] = [];
  const moves: Record<string, number> = {};
  const rages: Record<string, number> = {};
  let apart = 0;
  let rejoined = 0;
  let firstFall = '';
  let current = '';
  let currentActor = '';
  let cause = '';
  let coveredHits = 0;
  let openHits = 0;
  let maxBreath = 0;
  let maxLancet = 0;
  const maxHitTaken: Record<string, number> = {};
  let together = true;
  for (const e of log) {
    if (e.type === 'message' && / learned /.test(e.text)) learned.push(e.text.replace(/^.* learned /, '').replace(/!$/, ''));
    else if (e.type === 'message' && /stand apart/.test(e.text)) { apart++; together = false; }
    else if (e.type === 'message' && /close ranks/.test(e.text)) { rejoined++; together = true; }
    else if (e.type === 'action-start') {
      current = e.abilityId ?? e.command.kind;
      currentActor = e.actorId;
      if (e.actorId === BIRAN || e.actorId === YENKE) {
        const key = `${e.actorId === BIRAN ? 'B' : 'Y'}:${current}`;
        moves[key] = (moves[key] ?? 0) + 1;
      }
      if (e.actorId === 'kimahri' && e.command.kind === 'overdrive') rages[current] = (rages[current] ?? 0) + 1;
    } else if (e.type === 'damage' && currentActor === 'kimahri' && (e.targetId === BIRAN || e.targetId === YENKE)) {
      if (current === 'attack') {
        if (together) coveredHits++;
        else openHits++;
      }
      if (current === 'aqua-breath' || current === 'fire-breath') maxBreath = Math.max(maxBreath, e.amount);
      if (current === 'lancet') maxLancet = Math.max(maxLancet, e.amount);
    } else if (e.type === 'damage' && (currentActor === BIRAN || currentActor === YENKE) && e.targetId === 'kimahri' && e.amount > 0) {
      maxHitTaken[`${currentActor === BIRAN ? 'B' : 'Y'}:${current}`] = Math.max(maxHitTaken[`${currentActor === BIRAN ? 'B' : 'Y'}:${current}`] ?? 0, e.amount);
    } else if (e.type === 'ko') {
      const who = s.combatants[e.targetId];
      if (who?.side === 'party') cause = current || 'status';
      if ((e.targetId === BIRAN || e.targetId === YENKE) && firstFall === '') firstFall = e.targetId;
    }
  }
  const outcome = s.result?.outcome ?? 'unfinished';
  const k = s.combatants['kimahri'] as FFXCombatant | undefined;
  return {
    seed,
    outcome,
    turns: s.turn,
    actions,
    learned,
    moves,
    apart,
    rejoined,
    rages,
    firstFall,
    hpAtEnd: k && k.hp > 0 ? k.hp / k.stats.maxHp : 0,
    coveredHits,
    openHits,
    cause: outcome === 'victory' ? '' : outcome === 'defeat' ? `down:${cause}` : outcome,
    maxBreath,
    maxLancet,
    maxHitTaken,
  };
}

/** Play the duel once under `line`. `onInit` may probe or change the freshly initialised engine. */
export function runDuel(line: Line, seed: number, onInit?: (engine: BattleEngine) => void): DuelReading {
  const chapter = getChapter(CHAPTER_ID);
  if (!chapter) throw new Error(`${CHAPTER_ID} is not registered`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupForChapter(chapter, seed));
  onInit?.(engine);
  let actions = 0;
  let streak = 0;
  for (let step = 0; step < 20_000; step++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    let cmd: Command | null = streak >= 6 ? ({ kind: 'defend', targets: [] } as Command) : streak >= 3 ? fallback(d) : line(engine, d);
    cmd ??= fallback(d);
    const events = engine.submit(cmd);
    if (events.length === 0) streak++;
    else { streak = 0; actions++; }
  }
  return read(engine, seed, actions);
}

/** A fresh engine on the chapter's setup, for probes. */
export function duelEngine(seed: number): BattleEngine {
  const chapter = getChapter(CHAPTER_ID);
  if (!chapter) throw new Error(`${CHAPTER_ID} is not registered`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupForChapter(chapter, seed));
  return engine;
}

export const pct = (n: number, of: number): string => `${n}/${of} (${of ? Math.round((n * 1000) / of) / 10 : 0} %)`;
