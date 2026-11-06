/**
 * Drive the Farplane Cup (the Fiend Arena's three duels: Auron, Tidus and Seymour; the hidden FFX-2 chapter) headlessly. **FFX-2 only.**
 *
 * - {@link openDuel} opens one link on the real engine (the chapter's party, the group as the data defines it).
 * - {@link forced} swaps the duelist's script for a QUEUE of commands the test pushes (a rig, not a chapter): the move under test happens when the test says, and the engine resolves it with the game's rows, so the
 *   checks are of the engine and the data, not of the script (the scripts have their own file, `farplane-cup-ai.test.ts`).
 * - {@link LINES} are named policies standing in for a player; a line is an input to a measurement, never game data, and nothing here tunes a boss (rule 6; `docs/handoff/ch-farplane-cup.md`).
 */

import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { farplaneCupBuild } from '../../../src/data/ffx2/builds/farplane-cup.ts';
import { farplaneCupGroups } from '../../../src/data/ffx2/enemies/farplane-cup.ts';
import { FARPLANE_CUP_BODY_IDS } from '../../../src/data/farplane-cup-ids.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { logOf, makeInvincible, nextInput, topUp, type AngraEv } from './angraMainyuDrive.ts';
import { walkChange } from './fallenMaestersWalk.ts';

export { logOf, makeInvincible, nextInput, topUp, type AngraEv };

type Input = Extract<Decision, { kind: 'player-input' }>;
/** 0 = duel 1 (Auron), 1 = duel 2 (Tidus), 2 = duel 3 (Seymour). */
export type Duel = 0 | 1 | 2;

export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The duelist of a duel. */
export const bossOf = (duel: Duel): string => FARPLANE_CUP_BODY_IDS[duel];

/** The commands a test pushes for the forced script to return, in order. */
export interface Forced {
  readonly queue: Command[];
}

let forcedCount = 0;

/** A copy of duel `duel`'s group whose duelist runs a script that returns the queued commands (then nothing). */
export function forced(duel: Duel): { group: EnemyGroupDef; forced: Forced } {
  const queue: Command[] = [];
  const id = `zz-forced-cup-${forcedCount++}`;
  const base = farplaneCupGroups[duel]!;
  registerAiScript({ ...aiScriptFor(base.enemies[0]!.aiScriptId), id, decide: () => queue.shift() ?? null });
  return { group: { ...base, enemies: base.enemies.map((e) => ({ ...e, aiScriptId: id })) }, forced: { queue } };
}

export interface OpenOptions {
  build?: FFX2PartyBuild;
  group?: EnemyGroupDef;
  /** The girls carry Invincible from the first moment: the duelist's script runs on its own clock for as long as the test wants. */
  immortal?: boolean;
  atbMode?: 'wait' | 'active';
  /**
   * A rig: Yuna and Paine break the damage limit from the first turn, as a girl does once her Garment Grid has passed the gates that The End needs (`garment-grids.ts`; the build starts with none passed).
   * It stands for the player having done that Spherechange work; the chapter does not give it.
   */
  breakDamageLimit?: boolean;
  flags?: Record<string, string | number | boolean>;
  triggers?: BattleSetup['triggers'];
  /** A rig the test applies to the opened engine before the first decision (a changed resist byte, a lowered level): an input to a measurement, never game data. */
  setup?: (engine: FFX2Engine) => void;
}

/** A fresh engine on duel `duel`, the chapter's party (a copy), one seed. */
export function openDuel(duel: Duel, seed: number, opts: OpenOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait' }));
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: opts.build ?? structuredClone(farplaneCupBuild),
    enemies: opts.group ?? farplaneCupGroups[duel]!,
    triggers: opts.triggers ?? [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  Object.assign(engine.state().flags, opts.flags ?? {});
  if (opts.immortal) for (const id of GIRLS) makeInvincible(engine.state().combatants[id] as unknown as FFX2Combatant);
  if (opts.breakDamageLimit) {
    for (const id of ['yuna', 'paine']) {
      const girl = unit(engine, id);
      girl.aiMemory = { ...(girl.aiMemory ?? {}), bdl: true };
    }
  }
  opts.setup?.(engine);
  return engine;
}

/** A combatant as the engine holds it, with the AI memory a script keeps on an enemy (the girls carry the `bdl` flag of the Break Damage Limit rig in it). */
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

/** An ability command of the duelist, for the forced queue. */
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

export type LineName = 'defend' | 'darkness' | 'curtains' | 'charon' | 'walk' | 'remedy';

/** A girl who is down and can be raised: not one an Eject or a shatter took out of the fight, which no item brings back. */
function fallenGirl(engine: FFX2Engine): FFX2Combatant | undefined {
  return girlsOf(engine).find((g) => !g.alive && g.statuses['eject'] === undefined && !g.removed);
}

function lowestFraction(engine: FFX2Engine): FFX2Combatant | undefined {
  return girlsOf(engine)
    .filter((g) => g.alive)
    .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
}

const DARKNESS = 'x2-dark-knight-darkness';
const CHARON = 'x2-dark-knight-charon';

/**
 * The lines. `darkness`: Yuna and Paine (Dark Knights) Darkness on the duelist, Rikku mends (a Megalixir on the party when a girl is below half, a Phoenix Down on a fallen girl) and otherwise attacks. `curtains` is
 * `darkness` with Rikku's first two turns spent on a Light Curtain (Protect) and a Lunar Curtain (Shell) on the party; `charon` casts Charon (a hit that can pass 10,000 with Break Damage Limit) instead of Darkness on
 * the curtains opening; `walk` is `curtains` with Paine walking The End's grid first (the four Changes the menu offers: two across the red and green gates, two home) and then casting Charon, which is what a player
 * with the build as given can do for the cap; `remedy` is `curtains` plus Rikku curing a girl turned to stone first (Seymour's Break). `defend` is nobody doing anything useful.
 */
export const LINES: Record<LineName, (boss: string) => Turn> = {
  defend: () => () => null,
  darkness: (boss) => (d, engine) => mend(d, engine) ?? knight(d, boss, DARKNESS),
  curtains: (boss) => curtainsLine(boss, DARKNESS),
  charon: (boss) => curtainsLine(boss, CHARON),
  walk: (boss) => walkLine(boss),
  remedy: (boss) => curtainsLine(boss, DARKNESS, true),
};

/** The curtains line: Rikku's first two turns are a Light Curtain and a Lunar Curtain on the party (a fallen girl is raised first), then mend; the knights cast `spell`. */
function curtainsLine(boss: string, spell: string | ((actor: string) => string), cureStone = false): Turn {
  let rikkuTurns = 0;
  return (d, engine) => {
    if (cureStone && d.actorId === 'rikku') {
      const stone = girlsOf(engine).find((g) => g.alive && g.statuses['petrify'] !== undefined);
      const cure = stone ? rowOf(d, 'item', 'x2-remedy', [stone.id]) : null;
      if (cure) return cure;
    }
    if (d.actorId === 'rikku') {
      rikkuTurns += 1;
      const fall = fallenGirl(engine);
      if (fall) {
        const revive = rowOf(d, 'ability', 'x2-alchemist-stash-phoenix-down', [fall.id]);
        if (revive) return revive;
      }
      if (rikkuTurns === 1) return rowOf(d, 'item', 'x2-light-curtain', []) ?? null;
      if (rikkuTurns === 2) return rowOf(d, 'item', 'x2-lunar-curtain', []) ?? null;
    }
    return mend(d, engine) ?? knight(d, boss, typeof spell === 'string' ? spell : spell(d.actorId));
  };
}

/** The walk line: Paine spends her first turns on Changes along The End's grid, Rikku and Yuna play the curtains line meanwhile, and Paine casts Charon once she wears the Dark Knight with the limit broken. */
function walkLine(boss: string): Turn {
  const rest = curtainsLine(boss, (actor) => (actor === 'paine' ? CHARON : DARKNESS));
  return (d, engine) => (d.actorId === 'paine' ? walkChange(d, engine, 'paine', ['red', 'green']) : null) ?? rest(d, engine);
}

function mend(d: Input, engine: FFX2Engine): Command | null {
  if (d.actorId !== 'rikku') return null;
  const low = lowestFraction(engine);
  const fall = fallenGirl(engine);
  if (fall) {
    const revive = rowOf(d, 'ability', 'x2-alchemist-stash-phoenix-down', [fall.id]);
    if (revive) return revive;
  }
  if (low && low.hp < low.stats.maxHp * 0.5) return rowOf(d, 'item', 'x2-megalixir', []);
  return null;
}

function knight(d: Input, boss: string, spell = DARKNESS): Command | null {
  if (d.actorId !== 'rikku') {
    const dark = rowOf(d, 'ability', spell, spell === DARKNESS ? [] : [boss]);
    if (dark) return dark;
  }
  return attackOf(d, boss);
}

export interface FightResult {
  outcome: string | undefined;
  ticks: number;
  bossHp: number;
  decisions: number;
  girlsAlive: number;
  moves: Record<string, number>;
  kos: number;
  ejects: number;
  log: readonly AngraEv[];
}

/** One whole fight on one line. */
export function fight(duel: Duel, seed: number, line: LineName, opts: OpenOptions & { maxDecisions?: number } = {}): FightResult {
  const boss = bossOf(duel);
  const engine = openDuel(duel, seed, opts);
  const turn = LINES[line](boss);
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
  for (const e of log) {
    if (e.type === 'action-start' && e.actorId === boss && e.abilityId !== undefined) moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
    if (e.type === 'ko' && (GIRLS as readonly string[]).includes(e.targetId ?? '')) kos += 1;
  }
  const b = unit(engine, boss);
  return {
    outcome,
    ticks: engine.state().ticks,
    bossHp: b.hp,
    decisions,
    girlsAlive: girlsOf(engine).filter((g) => g.alive).length,
    moves,
    kos,
    ejects: girlsOf(engine).filter((g) => g.statuses['eject'] !== undefined).length,
    log,
  };
}

/** Play forward (every girl defends, the duelist's script answers on its own) until `done(engine)` holds, the battle ends or the budget runs out. True when `done` held. `immortal` tops the girls up at each of their decisions. */
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
