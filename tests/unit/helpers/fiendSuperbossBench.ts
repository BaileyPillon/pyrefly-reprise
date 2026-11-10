/**
 * The bench of the Fiend Arena Superbosses (Almighty Shinra, then the Major Numerus; the hidden FFX-2 chapter 53). **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss row moves here (rule 6); a
 * result goes to Bailey as an options sheet (`docs/plans/ch-fiend-superbosses-options.md`).
 *
 * A *line* is a policy standing in for a player and a *kit* is a change to the party the bench applies as a rig; both are inputs to a measurement, never game data. The shipped party is Chapter XIII's Lv 99 three
 * (`fiendSuperbossBuild`); a kit never ships (LG4).
 *
 * - Lines: `advisor` (the shipped tactic, the line the guide teaches), `darkness` (Yuna and Paine Darkness, Rikku swings: no curtains, no mending), `naive` (every girl a plain Attack), `miracle` (Rikku Mixes Miracle
 *   Drinks to keep every girl Invincible; the Mix row is not in Rikku's menu yet, so the line submits the command directly: **bench-only**) and `hero` (the advisor line, but a girl drinks a Hero Drink on herself
 *   when a foe is charging one of the big blows).
 * - Kits: `ribbon` (a Ribbon in place of the Crystal Bangle: it blocks every status Duo throws), `thunder` (the girls take no Thunder damage: no accessory sets that in the game's data today, so it is a pure
 *   rig), `darkMatter` (99 Dark Matter and 99 Potions in the bag: Miracle Drink needs a Dark Matter in a slot, the shipped bag holds none), `heroDrinks` (n Hero Drinks in the bag).
 * - Paces: `bench` (zero decision time, Wait), `split` (the live default: Wait split, 1.5 s a menu, 0.5 s of it on the top list with the clock running) and `active` (the Active clock, 1.5 s a decision).
 *
 * Time: the FFX-2 engine counts 29.97 logic steps a second (`battle/ffx2/clock.ts`); a run is capped at 40 minutes of battle time (`CAP_TICKS`) and a run that reaches the cap is counted `cap`, never hidden.
 */

import type { BattleEngine, Command, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import { FS_ABILITY, NUMERUS_HEAD_IDS, X2_ALMIGHTY_SHINRA_ID } from '../../../src/data/fiend-superbosses-ids.ts';
import { ffx2FiendSuperbosses } from '../../../src/engine/tactics/ffx2-fiend-superbosses.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { topUp } from './angraMainyuDrive.ts';
import { CAP_TICKS, GIRLS, attackOf, darknessLine, groupOf, headlineOf, logOf, lv99Build, rowOf, unit, type Act, type Turn } from './fiendSuperbossDrive.ts';

export type LineName = 'advisor' | 'darkness' | 'naive' | 'miracle' | 'hero';
export type Pace = 'bench' | 'split' | 'active';

export interface Kit {
  ribbon?: boolean;
  thunder?: boolean;
  darkMatter?: boolean;
  heroDrinks?: number;
  /**
   * A DIAGNOSTIC rig, not an option anything could ship today: Invincible laid on the three girls before the first blow, as `cover` counts of the clock (15 is a Miracle Drink's own length, about 7.9 s; `Infinity`
   * is for good). It isolates the opening from the rest of the fight: Almighty Shinra's first move lands at 2.6 s and no girl's first action can resolve before it.
   */
  cover?: number;
  /** A DIAGNOSTIC rig: the girls' HP is topped up at each of their decisions (stage 2 of the lane played this way; the Dark Knights' Darkness costs HP, so a line with no mending stops casting without it). */
  topUp?: boolean;
}

export interface Spec {
  act: Act;
  /** How the battle opens: the chapter's own (act 1 is the first link, `normal`; act 2 is a chained link, `scripted`, and its group opens as a separate battle: the game's start, `opensAsSeparateBattle`), unless a cell says otherwise. */
  condition?: 'normal' | 'scripted';
  /**
   * MEASUREMENT ONLY: open act 2 as the engine opens a plain chained link, a CONTINUATION (every wait whole, no trim, `battle/ffx2/atb-open.ts`), by switching `SEPARATE_BATTLE_GAUGES` off for the run
   * (`Ffx2EngineOptions.separateBattleGauges`). This is how the chapter opened act 2 before the fix pass of lane w53; it is the alternative the options sheet carries, never what is played.
   */
  continuation?: boolean;
  line: LineName;
  kit?: Kit;
  pace?: Pace;
}

export const PACES: Readonly<Record<Pace, { decisionMs: number; topMs?: number; engine: Partial<Ffx2EngineOptions> }>> = {
  bench: { decisionMs: 0, engine: { atbMode: 'wait' } },
  split: { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } },
  active: { decisionMs: 1500, engine: { atbMode: 'active' } },
};

/** The four Commands (a 99,999-limit blow each; Protect and Shell change nothing). */
export const COMMAND_IDS: readonly string[] = [FS_ABILITY.radisCommand, FS_ABILITY.venamCommand, FS_ABILITY.fulmenCommand, FS_ABILITY.mortisCommand];
/** The blows the `hero` line drinks against: the Commands, and Shinra's party-wide blows. */
export const BIG_BLOW_IDS: readonly string[] = [...COMMAND_IDS, FS_ABILITY.clione, FS_ABILITY.finalImpact, FS_ABILITY.ultimaShinra, FS_ABILITY.fireworks];

/**
 * The `miracle` line mixes again only when a living girl's Invincible would be gone by the time the new Drink lands: a Drink that lands on a girl who is still Invincible does nothing (a status does not stack). It lands
 * about 4.8 s after Rikku's menu (measured, `fiend-superbosses-bench.test.ts`), which is 4.8 x 29.97 steps x about 95 units a step = about 13,700 of the clock's units; 14,000 is that, rounded up.
 */
export const MIRACLE_LANDING_UNITS = 14_000;

/** The party of a cell: the shipped one (a copy) with the kit's bag and accessories. */
export function buildFor(kit: Kit = {}): FFX2PartyBuild {
  const build = lv99Build();
  if (kit.ribbon) for (const m of build.members) m.accessories = m.accessories.map((a) => (a === 'crystal-bangle' ? 'ribbon' : a));
  const extra: Array<{ itemId: string; count: number }> = [];
  if (kit.darkMatter) extra.push({ itemId: 'x2-dark-matter', count: 99 }, { itemId: 'x2-potion', count: 99 });
  if (kit.heroDrinks) extra.push({ itemId: 'x2-hero-drink', count: kit.heroDrinks });
  build.inventory = [...build.inventory, ...extra];
  return build;
}

const asBattle = (e: unknown): BattleEngine => e as BattleEngine;
const girls = (engine: FFX2Engine): FFX2Combatant[] => GIRLS.map((id) => unit(engine, id));

/** The shipped tactic's choice, or a plain Attack on the first foe standing when it has none. */
const advisorLine = (act: Act): Turn => (d, engine) => ffx2FiendSuperbosses(d.actorId, d.commands, asBattle(engine)) ?? attackOf(d, headlineOf(engine, act));

const MIX: Command = { kind: 'ability', id: 'x2-alchemist-mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: ['x2-dark-matter', 'x2-potion'], resultAbilityId: null } } } as unknown as Command;

/** Rikku's Miracle Drink loop: raise and cure first, then a Mix whenever a living girl is short of Invincible, else the advisor line. */
const miracleLine = (act: Act): Turn => {
  const rest = advisorLine(act);
  return (d, engine) => {
    if (d.actorId === 'rikku') {
      const party = girls(engine);
      const down = party.find((g) => !g.alive && g.statuses['eject'] === undefined && !g.removed);
      if (down) {
        const back = rowOf(d, 'ability', 'x2-alchemist-stash-phoenix-down', [down.id]);
        if (back) return back;
      }
      const stone = party.find((g) => g.alive && g.statuses['petrify'] !== undefined);
      if (stone) {
        const cure = rowOf(d, 'item', 'x2-remedy', [stone.id]);
        if (cure) return cure;
      }
      const short = party.some((g) => g.alive && (g.statuses['invincible']?.ticksRemaining ?? 0) < MIRACLE_LANDING_UNITS);
      const flags = engine.state().flags as Record<string, number | undefined>;
      if (short && (flags['inventory:x2-dark-matter'] ?? 0) > 0 && (flags['inventory:x2-potion'] ?? 0) > 0) return MIX;
    }
    return rest(d, engine);
  };
};

/** The advisor line, but a girl drinks a Hero Drink on herself while a foe is charging one of the big blows. */
const heroLine = (act: Act): Turn => {
  const rest = advisorLine(act);
  return (d, engine) => {
    const self = unit(engine, d.actorId);
    const foes = act === 1 ? [X2_ALMIGHTY_SHINRA_ID] : [...NUMERUS_HEAD_IDS];
    const charging = foes.some((id) => {
      const c = unit(engine, id).atb.charging?.commandRef as { id?: string } | undefined;
      return unit(engine, id).alive && c?.id !== undefined && BIG_BLOW_IDS.includes(c.id);
    });
    if (charging && self.alive && self.statuses['invincible'] === undefined) {
      const drink = rowOf(d, 'item', 'x2-hero-drink', [self.id]);
      if (drink) return drink;
    }
    return rest(d, engine);
  };
};

export const LINES: Record<LineName, (act: Act) => Turn> = {
  advisor: advisorLine,
  darkness: (act) => darknessLine(act),
  naive: (act) => (d, engine) => attackOf(d, headlineOf(engine, act)),
  miracle: miracleLine,
  hero: heroLine,
};

export interface Stat {
  outcome: 'victory' | 'defeat' | 'cap';
  ticks: number;
  /** Girl KO events. */
  kos: number;
  /** The act's foes' HP left at the end, as a fraction of their maximum (Shinra's; or the four heads' together). */
  foeLeft: number;
  headsDown: number;
  /** Commands begun, and how many of them ended with no girl put down while they were in flight. */
  commands: number;
  commandsClean: number;
  miracles: number;
  drinks: number;
  /** Petrify events laid on a girl (Duo's Break). */
  stoned: number;
}

type Ev = { type: string; actorId?: string; targetId?: string; abilityId?: string; status?: string; command?: { kind?: string; id?: string } };

/** What a finished fight was like, read off its event log. */
export function summarise(engine: FFX2Engine, act: Act, outcome: Stat['outcome']): Stat {
  const open = new Map<string, number>();
  let kos = 0;
  let commands = 0;
  let clean = 0;
  let miracles = 0;
  let drinks = 0;
  let stoned = 0;
  const girlIds: readonly string[] = GIRLS;
  for (const e of logOf(engine) as unknown as readonly Ev[]) {
    if (e.type === 'action-start' && e.actorId !== undefined) {
      if (e.abilityId !== undefined && COMMAND_IDS.includes(e.abilityId)) {
        commands += 1;
        open.set(e.actorId, 0);
      }
      if (e.abilityId === 'x2-mix-miracle-drink') miracles += 1;
      if (e.command?.kind === 'item' && e.command.id === 'x2-hero-drink') drinks += 1;
    } else if (e.type === 'ko' && e.targetId !== undefined && girlIds.includes(e.targetId)) {
      kos += 1;
      for (const [k, v] of open) open.set(k, v + 1);
    } else if (e.type === 'status-add' && e.status === 'petrify' && e.targetId !== undefined && girlIds.includes(e.targetId)) stoned += 1;
    else if (e.type === 'action-end' && e.actorId !== undefined && open.has(e.actorId)) {
      if (open.get(e.actorId) === 0) clean += 1;
      open.delete(e.actorId);
    }
  }
  const foes = act === 1 ? [X2_ALMIGHTY_SHINRA_ID] : [...NUMERUS_HEAD_IDS];
  const hp = foes.reduce((s, id) => s + Math.max(0, unit(engine, id).hp), 0);
  const max = foes.reduce((s, id) => s + unit(engine, id).stats.maxHp, 0);
  return { outcome, ticks: engine.state().ticks, kos, foeLeft: hp / max, headsDown: foes.filter((id) => !unit(engine, id).alive).length, commands, commandsClean: clean, miracles, drinks, stoned };
}

const MAX_DECISIONS = 60_000;

/** The open engine of a cell on one seed: the cell's pace, party and rigs applied, before the first decision. */
export function openEngine(spec: Spec, seed: number): FFX2Engine {
  const pace = PACES[spec.pace ?? 'bench'];
  const kit = spec.kit ?? {};
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...pace.engine, ...(spec.continuation ? { separateBattleGauges: false } : {}) }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: buildFor(kit), enemies: groupOf(spec.act), triggers: [], seed, condition: spec.condition ?? (spec.act === 2 ? 'scripted' : 'normal'), canEscape: false });
  if (kit.thunder) for (const g of girls(engine)) (g.affinities as Record<string, string>)['lightning'] = 'immune';
  if (kit.cover !== undefined) {
    for (const g of girls(engine)) {
      const forGood = !Number.isFinite(kit.cover);
      const instance = applyStatus(g, { status: 'invincible', chance: 255, duration: forGood ? 0 : kit.cover }, 'rikku', 'x2-mix-miracle-drink');
      if (instance && forGood) instance.ticksRemaining = null;
    }
  }
  return engine;
}

/** One whole fight of one cell on one seed. */
export function runFight(spec: Spec, seed: number): Stat {
  const pace = PACES[spec.pace ?? 'bench'];
  const kit = spec.kit ?? {};
  const engine = openEngine(spec, seed);
  const turn = LINES[spec.line](spec.act);
  for (let i = 0; i < MAX_DECISIONS && engine.state().ticks <= CAP_TICKS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summarise(engine, spec.act, d.result.outcome === 'victory' ? 'victory' : 'defeat');
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (pace.topMs !== undefined && pace.topMs > 0) {
      engine.setMenuLevel('top');
      engine.tick(Math.min(pace.topMs, pace.decisionMs), { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
    } else if (pace.decisionMs > 0) {
      engine.tick(pace.decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    if (kit.topUp) topUp(engine);
    engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
  }
  return summarise(engine, spec.act, 'cap');
}

export interface Tally {
  seeds: number;
  wins: number;
  defeats: number;
  caps: number;
  kos: number;
  seconds: number;
  foeLeft: number;
  headsDown: number;
  commands: number;
  commandsClean: number;
  miracles: number;
  drinks: number;
  stoned: number;
}

export const emptyTally = (): Tally => ({ seeds: 0, wins: 0, defeats: 0, caps: 0, kos: 0, seconds: 0, foeLeft: 0, headsDown: 0, commands: 0, commandsClean: 0, miracles: 0, drinks: 0, stoned: 0 });

export function addStat(t: Tally, s: Stat): void {
  t.seeds += 1;
  if (s.outcome === 'victory') t.wins += 1;
  else if (s.outcome === 'defeat') t.defeats += 1;
  else t.caps += 1;
  t.kos += s.kos;
  t.seconds += s.ticks / STEPS_PER_SECOND;
  t.foeLeft += s.foeLeft;
  t.headsDown += s.headsDown;
  t.commands += s.commands;
  t.commandsClean += s.commandsClean;
  t.miracles += s.miracles;
  t.drinks += s.drinks;
  t.stoned += s.stoned;
}

/** Seeds `first` to `first + seeds - 1` of one cell. */
export function runCell(spec: Spec, seeds: number, first = 1): Tally {
  const t = emptyTally();
  for (let seed = first; seed < first + seeds; seed++) addStat(t, runFight(spec, seed));
  return t;
}
