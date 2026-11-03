/**
 * Drive the Fallen Maesters (the Via Infinito's floors 20, 40, 60 and 80; the hidden FFX-2 chapter) headlessly. **FFX-2 only.**
 *
 * - {@link openFloor} opens one link on the real engine (the chapter's party, the group as the data defines it).
 * - {@link forced} swaps the fiend's script for a QUEUE of commands the test pushes (a rig, not a chapter): the move under test happens when the test says, and the engine resolves it with the
 *   game's rows, so the checks are of the engine and the data, not of the script (the scripts have their own file, `fallen-maesters-ai.test.ts`).
 * - {@link LINES} are named policies standing in for a player; a line is an input to a measurement, never game data, and nothing here tunes a boss (rule 6; `docs/handoff/ch-maesters.md`).
 */

import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { aiScriptFor, registerAiScript } from '../../../src/battle/ffx2/ai/index.ts';
import { fallenMaestersBuild } from '../../../src/data/ffx2/builds/fallen-maesters.ts';
import { fallenMaestersGroups } from '../../../src/data/ffx2/enemies/fallen-maesters.ts';
import { FALLEN_MAESTERS_BODY_IDS } from '../../../src/data/fallen-maesters-ids.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { logOf, makeInvincible, nextInput, topUp, type AngraEv } from './angraMainyuDrive.ts';
import { walkChange } from './fallenMaestersWalk.ts';

export { logOf, makeInvincible, nextInput, topUp, type AngraEv };

type Input = Extract<Decision, { kind: 'player-input' }>;
export type Floor = 0 | 1 | 2 | 3;

export const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The fiend of a floor (0 = floor 20, 1 = floor 40, 2 = floor 60, 3 = floor 80). */
export const bossOf = (floor: Floor): string => FALLEN_MAESTERS_BODY_IDS[floor];

/** The commands a test pushes for the forced script to return, in order. */
export interface Forced {
  readonly queue: Command[];
}

let forcedCount = 0;

/** A copy of floor `floor`'s group whose fiend runs a script that returns the queued commands (then nothing). */
export function forced(floor: Floor): { group: EnemyGroupDef; forced: Forced } {
  const queue: Command[] = [];
  const id = `zz-forced-maesters-${forcedCount++}`;
  const base = fallenMaestersGroups[floor]!;
  // The real script's other entries (Concherer's reaction) stay; only the poll is the test's.
  registerAiScript({ ...aiScriptFor(base.enemies[0]!.aiScriptId), id, decide: () => queue.shift() ?? null });
  return { group: { ...base, enemies: base.enemies.map((e) => ({ ...e, aiScriptId: id })) }, forced: { queue } };
}

export interface OpenOptions {
  build?: FFX2PartyBuild;
  group?: EnemyGroupDef;
  /** The girls carry Invincible from the first moment: the fiend's script runs on its own clock for as long as the test wants. */
  immortal?: boolean;
  atbMode?: 'wait' | 'active';
  /**
   * A rig: Yuna and Paine break the damage limit from the first turn, as a girl does once her Garment Grid has passed the gates that The End needs (`garment-grids.ts`; the build starts with none passed).
   * It stands for the player having done that Spherechange work; the chapter does not give it.
   */
  breakDamageLimit?: boolean;
  flags?: Record<string, string | number | boolean>;
  triggers?: BattleSetup['triggers'];
}

/** A fresh engine on floor `floor`, the chapter's party (a copy), one seed. */
export function openFloor(floor: Floor, seed: number, opts: OpenOptions = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: opts.atbMode ?? 'wait' }));
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: opts.build ?? structuredClone(fallenMaestersBuild),
    enemies: opts.group ?? fallenMaestersGroups[floor]!,
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

/**
 * Play forward until `boss` has finished `count` actions (or the battle ends, or the budget runs out). The girls answer with `turn` (defend by default). True when the count was reached.
 */
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

/** An ability command of the fiend, for the forced queue. */
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

export type LineName = 'defend' | 'darkness' | 'curtains' | 'charon' | 'paine-charon' | 'walk' | 'chain' | 'remedy' | 'remedy-charon';

/** A girl who is down and can be raised: not one a petrified blow destroyed (Death and Eject), which no item brings back. */
function fallenGirl(engine: FFX2Engine): FFX2Combatant | undefined {
  return girlsOf(engine).find((g) => !g.alive && g.statuses['eject'] === undefined && !g.removed);
}

function lowestFraction(engine: FFX2Engine): FFX2Combatant | undefined {
  return girlsOf(engine)
    .filter((g) => g.alive)
    .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
}

/**
 * The lines. `darkness`: Yuna and Paine (Dark Knights) Darkness on the fiend, Rikku mends (a Megalixir on the party when a girl is below half, Stash Phoenix Down on a fallen girl) and otherwise attacks.
 * `curtains` is `darkness` with Rikku's first two turns spent on a Light Curtain (Protect) and a Lunar Curtain (Shell) on the party; `charon` casts Charon (a hit that can pass 10,000 with Break Damage Limit) instead of Darkness;
 * `remedy` and `remedy-charon` add Rikku curing a petrified girl with a Remedy first (the Remedy cures Petrify: probed on the engine). `defend` is nobody doing anything useful.
 */
export const LINES: Record<LineName, (boss: string) => Turn> = {
  defend: () => () => null,
  darkness: (boss) => (d, engine) => mend(d, engine) ?? knight(d, boss, DARKNESS),
  curtains: (boss) => curtainsLine(boss, DARKNESS),
  charon: (boss) => curtainsLine(boss, CHARON),
  'paine-charon': (boss) => curtainsLine(boss, (actor) => (actor === 'paine' ? CHARON : DARKNESS)),
  walk: (boss) => walkLine(boss),
  chain: (boss) => chainLine(boss),
  remedy: (boss) => curtainsLine(boss, DARKNESS, true),
  'remedy-charon': (boss) => curtainsLine(boss, CHARON, true),
};

const DARKNESS = 'x2-dark-knight-darkness';
const CHARON = 'x2-dark-knight-charon';

/** The curtains line: Rikku's first two turns are a Light Curtain and a Lunar Curtain on the party (a fallen girl is raised first), then mend; the knights cast `spell`. */
function curtainsLine(boss: string, spell: string | ((actor: string) => string), cureStone = false): Turn {
  let rikkuTurns = 0;
  return (d, engine) => {
    if (cureStone && d.actorId === 'rikku') {
      // The Remedy cures Petrify (probed: the engine removes it), so a girl turned to stone is cured before anything else, and before the blow on her.
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

/**
 * The walk line: what a player does with the build as it is. Paine spends her first turns on Changes along The End's grid (the red and the green gate, then home to the Dark Knight; the menu's own rows), Rikku and
 * Yuna play the curtains line meanwhile (Rikku's Light and Lunar Curtain, then mending; Yuna's Darkness), and Paine casts Charon once she wears the Dark Knight with the limit broken. Nothing is written to the girl.
 */
function walkLine(boss: string): Turn {
  const rest = curtainsLine(boss, (actor) => (actor === 'paine' ? CHARON : DARKNESS));
  return (d, engine) => (d.actorId === 'paine' ? walkChange(d, engine, 'paine', ['red', 'green']) : null) ?? rest(d, engine);
}

/**
 * The chain line: the shape of the sourced answer to Chac (a chain or a delay-lock from the first second: `research/ffx2-combat-core.md` §1.7, the Steam and Split reports it cites). Rikku's first turn is the Change to the Gunner (one link from the
 * Alchemist), then she mends (a Remedy on a girl turned to stone, a Megalixir under half) or fires Trigger Happy; the knights Attack to keep the window open. It is what the kit as given can do toward a chain, and it is a measurement, not a recommendation.
 */
function chainLine(boss: string): Turn {
  return (d, engine) => {
    if (d.actorId !== 'rikku') return attackOf(d, boss);
    if (unit(engine, 'rikku').dresspheres?.current === 'alchemist') {
      const change = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' && c.command.extra.toDressphere === 'gunner');
      if (change) return change.command as Command;
    }
    const stone = girlsOf(engine).find((g) => g.alive && g.statuses['petrify'] !== undefined);
    const cure = stone ? rowOf(d, 'item', 'x2-remedy', [stone.id]) : null;
    if (cure) return cure;
    const low = lowestFraction(engine);
    const mend = low && low.hp < low.stats.maxHp * 0.5 ? rowOf(d, 'item', 'x2-megalixir', []) : null;
    return mend ?? rowOf(d, 'ability', 'x2-gunner-trigger-happy', [boss]) ?? attackOf(d, boss);
  };
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

function knight(d: Input, boss: string, spell = 'x2-dark-knight-darkness'): Command | null {
  if (d.actorId !== 'rikku') {
    const dark = rowOf(d, 'ability', spell, spell === 'x2-dark-knight-darkness' ? [] : [boss]);
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
  shellBroken: boolean;
  log: readonly AngraEv[];
}

/** One whole fight on one line. */
export function fight(floor: Floor, seed: number, line: LineName, opts: OpenOptions & { maxDecisions?: number } = {}): FightResult {
  const boss = bossOf(floor);
  const engine = openFloor(floor, seed, opts);
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
    shellBroken: b.aiMemory?.['conchererShellBroken'] === 1,
    log,
  };
}

/**
 * Play forward (every girl defends, the fiend's script answers on its own) until `done(engine)` holds, the battle ends or the budget runs out. True when `done` held. `immortal` tops the girls up at each of their decisions.
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
