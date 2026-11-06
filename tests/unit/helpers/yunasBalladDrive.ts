/**
 * Drive Yuna's Ballad (the possessed Rikku, then the possessed Paine; the hidden FFX-2 chapter) headlessly. **FFX-2 only.**
 *
 * - {@link openDuel} opens one duel on the real engine (the chapter's party of one, the group as the data defines it).
 * - {@link forced} swaps the fighter's script for a QUEUE of commands the test pushes (a rig, not a chapter): the move under test happens when the test says, and the engine resolves it with the game's rows, so the checks are
 *   of the engine and the data, not of the script (the scripts have their own file, `yunas-ballad-ai.test.ts`).
 * - {@link driveChapter} plays both duels through `setupForNextLink`, as the app does (HP and MP carried into the second), with a {@link Turn} policy standing in for a player. A policy is an input to a measurement,
 *   never game data, and nothing here tunes a boss (rule 6; `docs/handoff/ch-yunas-ballad.md`).
 */

import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { yunasBalladBuild } from '../../../src/data/ffx2/builds/yunas-ballad.ts';
import { yunasBalladGroups } from '../../../src/data/ffx2/enemies/yunas-ballad.ts';
import { YUNAS_BALLAD_BODY_IDS } from '../../../src/data/yunas-ballad-ids.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

export type Input = Extract<Decision, { kind: 'player-input' }>;
export type Duel = 0 | 1;

/** The fighter of a duel (0 = the possessed Rikku, 1 = the possessed Paine). */
export const bossOf = (duel: Duel): string => YUNAS_BALLAD_BODY_IDS[duel];

/** A combatant as the engine holds it, with the AI memory a script keeps on an enemy. */
export type Unit = FFX2Combatant & { aiMemory?: Record<string, unknown> };

export const unit = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;

/** A battle event as the log holds it (the fields the tests read). */
export interface Ev {
  type: string;
  actorId?: string;
  targetId?: string;
  abilityId?: string;
  amount?: number;
  statusId?: string;
  [key: string]: unknown;
}

export const logOf = (engine: FFX2Engine): readonly Ev[] => engine.state().log as unknown as readonly Ev[];

/** The commands a test pushes for the forced script to return, in order. */
export interface Forced {
  readonly queue: Command[];
}

let forcedCount = 0;

/** A copy of duel `duel`'s group whose fighter runs a script that returns the queued commands (then nothing). */
export function forced(duel: Duel): { group: EnemyGroupDef; forced: Forced } {
  const queue: Command[] = [];
  const id = `zz-forced-ballad-${forcedCount++}`;
  const base = yunasBalladGroups[duel]!;
  registerAiScript({ ...aiScriptFor(base.enemies[0]!.aiScriptId), id, decide: () => queue.shift() ?? null });
  return { group: { ...base, enemies: base.enemies.map((e) => ({ ...e, aiScriptId: id })) }, forced: { queue } };
}

export interface OpenOptions {
  /** A modelled human decision time (ms of game clock burned at every menu); 0 = the auto-battler / Wait arm. Pair it with 'active'. */
  decisionMs?: number;
  build?: FFX2PartyBuild;
  group?: EnemyGroupDef;
  atbMode?: 'wait' | 'active';
  engine?: Partial<Ffx2EngineOptions>;
  triggers?: BattleSetup['triggers'];
}

/** The setup of duel `duel` for a seed. */
export function setupOf(duel: Duel, seed: number, opts: OpenOptions = {}): BattleSetup {
  return {
    game: 'ffx2',
    party: opts.build ?? structuredClone(yunasBalladBuild),
    enemies: opts.group ?? yunasBalladGroups[duel]!,
    triggers: opts.triggers ?? [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
}

/** A fresh engine on duel `duel`, the chapter's party of one (a copy), one seed. */
export function openDuel(duel: Duel, seed: number, opts: OpenOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait', ...opts.engine }));
  engine.setSeed(seed);
  engine.init(setupOf(duel, seed, opts));
  return engine;
}

/** The girl's turn: `null` = defend. */
export type Turn = (d: Input, engine: FFX2Engine) => Command | null;

const MAX_DECISIONS = 20_000;

/** How many actions `actor` has finished so far. */
export function endsOf(engine: FFX2Engine, actor: string): number {
  return logOf(engine).filter((e) => e.type === 'action-end' && e.actorId === actor).length;
}

/**
 * Play forward until `boss` has finished `count` actions (or the battle ends, or the budget runs out). Yuna answers with `turn` (defend by default). True when the count was reached.
 */
export function playUntilBossActed(engine: FFX2Engine, boss: string, count: number, turn: Turn = () => null, maxDecisions = 4000): boolean {
  for (let i = 0; i < maxDecisions; i++) {
    if (endsOf(engine, boss) >= count) return true;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return endsOf(engine, boss) >= count;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
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

/** An ability command of the fighter, for the forced queue. */
export const move = (id: string, targets: string[] = []): Command => ({ kind: 'ability', id, targets });

/** The outcome of a finished battle, or `undefined` while it is on. */
export function outcomeOf(engine: FFX2Engine): string | undefined {
  const state = engine.state() as BattleState & { result?: { outcome?: string } };
  return state.result?.outcome;
}

/** Yuna, as the engine holds her. */
export const yunaOf = (engine: FFX2Engine): Unit => unit(engine, 'yuna');

// ---------------------------------------------------------------------------------------------------------------------------------
// Whole duels and the whole chapter
// ---------------------------------------------------------------------------------------------------------------------------------

export interface DuelRun {
  outcome: string | undefined;
  /** Game ticks the duel lasted. */
  ticks: number;
  /** How many actions the fighter finished. */
  bossActions: number;
  /** Yuna's HP and MP when the duel ended. */
  hp: number;
  /** The lowest her HP fell to as a fraction of her maximum, sampled at every decision and every wait. */
  minHpFrac: number;
  mp: number;
  /** The fighter's moves, by ability id. */
  moves: Record<string, number>;
}

/** Play an open duel to its end with `turn`. */
export function runDuel(engine: FFX2Engine, duel: Duel, turn: Turn, maxDecisions = MAX_DECISIONS, decisionMs = 0): DuelRun {
  let outcome: string | undefined;
  let minHpFrac = 1;
  for (let i = 0; i < maxDecisions; i++) {
    const d = engine.nextDecision();
    const y = yunaOf(engine);
    minHpFrac = Math.min(minHpFrac, y.hp / y.stats.maxHp);
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (decisionMs > 0) {
      // A modelled human decision time burned as clock at the menu (the Den bench's harness): in Active mode the fight goes on under the open menu; the owner may no longer be able to answer.
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
  }
  const moves: Record<string, number> = {};
  for (const e of logOf(engine)) if (e.type === 'action-start' && e.actorId === bossOf(duel) && e.abilityId !== undefined) moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
  const yuna = yunaOf(engine);
  return { outcome, ticks: engine.state().ticks, bossActions: endsOf(engine, bossOf(duel)), hp: yuna.hp, minHpFrac, mp: yuna.mp, moves };
}

export interface ChapterRun {
  /** `victory` when both fell; otherwise the outcome of the duel that ended it. */
  outcome: string | undefined;
  duels: DuelRun[];
}

/** Both duels through `setupForNextLink`, as the app carries a chain (HP and MP into the second); a loss on either ends the run. */
export function driveChapter(turn: Turn, seed: number, opts: OpenOptions = {}): ChapterRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait', ...opts.engine }));
  let setup = setupOf(0, seed, opts);
  engine.setSeed(seed);
  engine.init(setup);
  const duels: DuelRun[] = [];
  for (const duel of [0, 1] as const) {
    const run = runDuel(engine, duel, turn, MAX_DECISIONS, opts.decisionMs ?? 0);
    duels.push(run);
    if (run.outcome !== 'victory') return { outcome: run.outcome, duels };
    if (duel === 1) break;
    setup = setupForNextLink(setup, yunasBalladGroups[1]!, engine.state(), seed + 1) as BattleSetup;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  return { outcome: 'victory', duels };
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Lines (test inputs standing in for a player)
// ---------------------------------------------------------------------------------------------------------------------------------

/** The healing items in the order a player reaches for them, strongest first. */
const HEAL_ITEMS = ['x2-x-potion', 'x2-hi-potion', 'x2-potion'] as const;

export interface LineOptions {
  /** The dressphere Yuna fights in: she Changes to it from the White Mage on the first turn it is offered. */
  dress: 'white-mage' | 'gunner' | 'warrior';
  /** Heal (an item, then Cura as a White Mage) below this fraction of her maximum HP. */
  healBelow: number;
  /** Open with Light Curtain (Protect) and Lunar Curtain (Shell) from the bag. */
  curtains: boolean;
  /** Drink a Hero Drink (Invincible) when she is below this fraction and one is left; 0 = never. */
  drinkBelow: number;
}

export const LINES = {
  /** A Gunner, healing at half, no curtains. */
  gunner: { dress: 'gunner', healBelow: 0.5, curtains: false, drinkBelow: 0 },
  /** A Warrior, healing at half, no curtains. */
  warrior: { dress: 'warrior', healBelow: 0.5, curtains: false, drinkBelow: 0 },
  /** A Warrior, Protect and Shell from the bag first, healing at half. */
  warriorCurtains: { dress: 'warrior', healBelow: 0.5, curtains: true, drinkBelow: 0 },
  /** A Gunner with the curtains. */
  gunnerCurtains: { dress: 'gunner', healBelow: 0.5, curtains: true, drinkBelow: 0 },
  /** She stays a White Mage: she can heal and Pray, and has no attack (a control: it cannot win). */
  whiteMage: { dress: 'white-mage', healBelow: 0.5, curtains: false, drinkBelow: 0 },
} satisfies Record<string, LineOptions>;

/** A policy for Yuna from a named line. */
export function turnOf(line: LineOptions): Turn {
  let opened = false;
  return (d, engine) => {
    const yuna = yunaOf(engine);
    const foe = Object.values(engine.state().combatants).find((u) => u.side === 'enemy' && u.alive) as Unit | undefined;
    if (!foe) return null;
    const worn = yuna.dresspheres?.current;
    const heal = (): Command | null => {
      for (const id of HEAL_ITEMS) {
        const c = rowOf(d, 'item', id, ['yuna']);
        if (c) return c;
      }
      return rowOf(d, 'ability', 'x2-white-mage-cura', ['yuna']);
    };
    if (yuna.hp < yuna.stats.maxHp * line.healBelow) return heal();
    if (line.curtains && !opened) {
      opened = true;
      const c = rowOf(d, 'item', 'x2-light-curtain', ['yuna']);
      if (c) return c;
    }
    if (line.curtains && !yuna.statuses['shell']) {
      const c = rowOf(d, 'item', 'x2-lunar-curtain', ['yuna']);
      if (c) return c;
    }
    if (worn !== line.dress) {
      const change = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' && c.command.extra.toDressphere === line.dress);
      if (change) return change.command as Command;
    }
    if (line.dress === 'white-mage') return rowOf(d, 'ability', 'x2-white-mage-pray', []);
    return attackOf(d, foe.id);
  };
}

/** Run `seeds` whole chapters under `line` and count the wins and where the losses fell. */
export function benchChapter(line: LineOptions, seeds: number, opts: OpenOptions = {}): { wins: number; duel0Wins: number; seconds: number[] } {
  let wins = 0;
  let duel0Wins = 0;
  const seconds: number[] = [];
  for (let s = 1; s <= seeds; s++) {
    const run = driveChapter(turnOf(line), s, opts);
    if (run.duels[0]?.outcome === 'victory') duel0Wins++;
    if (run.outcome === 'victory') wins++;
    seconds.push(run.duels.reduce((n, r) => n + r.ticks, 0));
  }
  return { wins, duel0Wins, seconds };
}
