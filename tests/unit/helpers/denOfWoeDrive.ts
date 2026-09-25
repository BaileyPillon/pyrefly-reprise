/**
 * Drive Chapter XV (the Den of Woe, FFX-2) headlessly with a named line of play.
 * **FFX-2 only.** A *line* is a small priority policy standing in for a player
 * who follows one tactic; it is an input to a measurement, never game data, and
 * nothing here tunes a boss (`docs/plans/chapter-gippal-review.md` §9: measure,
 * never tune; never weaken a boss).
 *
 * The lines follow the sources' clears (`research/ffx2-gippal-den-of-woe.md` §5):
 * two Dark Knights on Darkness plus a White Mage healing, Protect first
 * `[verified: 4 sources]`; Remedy on Looming Glacier's Stop; on Nooj, more than
 * 5,000 HP on the Dark Knights when Lightfall comes (the Chapter V bag has no Dark
 * Matter, GP6 a, so Yuna's answer is a Phoenix Down afterwards).
 */

import type { BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { DEN_OF_WOE_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = {
  id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean;
  stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown>; aiMemory?: Record<string, unknown>;
};

export interface LineOptions {
  /** What the Dark Knights do: Darkness (HP cost, ignores Defense) or Drain (MP, magic). */
  dk: 'darkness' | 'drain';
  /** The White Mage: Protect then Shell on the party early in each link. */
  guardEarly: boolean;
  /** The White Mage: cure damage (off = she only revives and Prays). */
  heal: boolean;
  /** The White Mage: Remedy on Stop, and on her own Silence. */
  remedy: boolean;
  /**
   * Nooj: once he is near the end (HP 8,000 or less, before Lightfall), keep the
   * Dark Knights above 5,000 HP: Yuna tops them up and they Attack instead of a
   * Darkness that would take them to 5,000 or below.
   */
  lightfallPrep: boolean;
  /** A Dark Knight throws a Phoenix Down (a Mega Phoenix for two) when the healer is down. */
  dkRevive: boolean;
  /**
   * What-if only (GP6 b, not shipped): a girl who would not survive Lightfall drinks a Hero Drink
   * (Invincible, 10.6 s) once Nooj is at 4,500 HP or less and Lightfall is still to come. The bag
   * must carry them ({@link withHeroDrinks}); the Chapter V bag has none.
   */
  heroDrink?: boolean;
}

export const LINES = {
  /** The sourced clear: Protect + Shell first, Darkness x2, heals, Remedy on Stop, Lightfall prep. */
  intended: { dk: 'darkness', guardEarly: true, heal: true, remedy: true, lightfallPrep: true, dkRevive: true },
  /** The same without the Lightfall prep: Darkness to the end. */
  noPrep: { dk: 'darkness', guardEarly: true, heal: true, remedy: true, lightfallPrep: false, dkRevive: true },
  /** Credibly wrong (plan §9, "magic into Baralai"): the Dark Knights Drain on MP, no Protect, no Remedy. */
  magic: { dk: 'drain', guardEarly: false, heal: true, remedy: false, lightfallPrep: false, dkRevive: true },
  /** Credibly wrong: all-out, Darkness x2, Yuna only revives and Prays, nobody else revives. */
  allOut: { dk: 'darkness', guardEarly: false, heal: false, remedy: false, lightfallPrep: false, dkRevive: false },
} satisfies Record<string, LineOptions>;

function units(engine: FFX2Engine): Unit[] {
  return Object.values(engine.state().combatants) as unknown as Unit[];
}

function rowFor(d: Input, kind: string, id: string) {
  return d.commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
}

function use(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const row = rowFor(d, kind, id);
  return row ? ({ ...row.command, targets } as Command) : null;
}

function girls(engine: FFX2Engine): Unit[] {
  return units(engine).filter((u) => u.side === 'party' && !u.removed);
}

function nooj(engine: FFX2Engine): Unit | undefined {
  return units(engine).find((u) => u.id === 'shade-nooj' && u.alive);
}

/** Nooj near the end and Lightfall still to come. */
function prepWindow(engine: FFX2Engine, line: LineOptions): boolean {
  const n = nooj(engine);
  return line.lightfallPrep && !!n && n.hp <= 8000 && !n.aiMemory?.['lightfallFired'];
}

const DK_FLOOR = 5000;

/** GP6 b what-if: drink before Lightfall (see {@link LineOptions.heroDrink}). */
function heroDrink(d: Input, engine: FFX2Engine, line: LineOptions, self: Unit | undefined): Command | null {
  const n = nooj(engine);
  if (!line.heroDrink || !self || !n || n.hp > 4500 || n.aiMemory?.['lightfallFired'] || self.statuses['invincible']) return null;
  if (self.id !== 'yuna' && self.hp > DK_FLOOR) return null;
  return use(d, 'item', 'x2-hero-drink', [self.id]);
}

/** The party with `count` Hero Drinks added to its bag: GP6 b as numbers, an `[estimate]` count. */
export function withHeroDrinks(party: FFX2PartyBuild, count: number): FFX2PartyBuild {
  return { ...party, inventory: [...party.inventory, { itemId: 'x2-hero-drink', count }] };
}

function yunaTurn(d: Input, engine: FFX2Engine, line: LineOptions, turn: number): Command | null {
  const party = girls(engine);
  const self = party.find((u) => u.id === d.actorId);
  const ko = party.filter((u) => !u.alive);
  if (ko.length >= 2) {
    const mega = use(d, 'item', 'x2-mega-phoenix', []);
    if (mega) return mega;
  }
  if (ko[0]) return use(d, 'item', 'x2-phoenix-down', [ko[0].id]) ?? use(d, 'ability', 'x2-white-mage-life', [ko[0].id]);
  const living = party.filter((u) => u.alive);
  const below = (f: number) => living.filter((u) => u.hp < u.stats.maxHp * f);
  const lowest = [...living].sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (line.remedy) {
    const stopped = living.find((u) => u.statuses['stop']);
    if (stopped) {
      const remedy = use(d, 'item', 'x2-remedy', [stopped.id]);
      if (remedy) return remedy;
    }
    if (self?.statuses['silence']) {
      const remedy = use(d, 'item', 'x2-remedy', [self.id]);
      if (remedy) return remedy;
    }
  }
  if (line.heal) {
    if (below(0.25).length >= 2) {
      const all = use(d, 'item', 'x2-megalixir', []) ?? use(d, 'item', 'x2-mega-potion', []);
      if (all) return all;
    }
    if (below(0.55).length >= 2) {
      const all = use(d, 'item', 'x2-mega-potion', []);
      if (all) return all;
    }
    if (lowest && lowest.hp < lowest.stats.maxHp * 0.4) {
      const one = use(d, 'item', 'x2-x-potion', [lowest.id]) ?? use(d, 'ability', 'x2-white-mage-curaga', [lowest.id]);
      if (one) return one;
    }
  }
  const drink = heroDrink(d, engine, line, self);
  if (drink) return drink;
  if (prepWindow(engine, line)) {
    const knights = living.filter((u) => u.id !== 'yuna' && u.hp <= DK_FLOOR);
    if (knights.length >= 2) {
      const all = use(d, 'item', 'x2-mega-potion', []);
      if (all) return all;
    }
    if (knights[0]) {
      const one = use(d, 'ability', 'x2-white-mage-curaga', [knights[0].id]) ?? use(d, 'item', 'x2-x-potion', [knights[0].id]);
      if (one) return one;
    }
  }
  if (self && self.mp < 30) {
    const ether = use(d, 'item', 'x2-turbo-ether', [self.id]);
    if (ether) return ether;
  }
  if (line.guardEarly && turn < 8) {
    if (living.some((u) => !u.statuses['protect'])) {
      const protect = use(d, 'ability', 'x2-white-mage-protect', []) ?? use(d, 'item', 'x2-light-curtain', [living.find((u) => !u.statuses['protect'])!.id]);
      if (protect) return protect;
    }
    if (living.some((u) => !u.statuses['shell'])) {
      const shell = use(d, 'ability', 'x2-white-mage-shell', []);
      if (shell) return shell;
    }
  }
  if (line.heal && lowest && lowest.hp < lowest.stats.maxHp * 0.75) {
    const cura = use(d, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(d, 'ability', 'x2-white-mage-pray', []);
}

function knightTurn(d: Input, engine: FFX2Engine, line: LineOptions): Command | null {
  const party = girls(engine);
  const self = party.find((u) => u.id === d.actorId);
  const enemy = units(engine).find((u) => u.side === 'enemy' && u.alive);
  const ko = party.filter((u) => !u.alive);
  if (line.dkRevive && ko.some((u) => u.id === 'yuna')) {
    const revive = (ko.length >= 2 ? use(d, 'item', 'x2-mega-phoenix', []) : null) ?? use(d, 'item', 'x2-phoenix-down', ['yuna']);
    if (revive) return revive;
  }
  if (self && self.hp < self.stats.maxHp * 0.2) {
    const potion = use(d, 'item', 'x2-x-potion', [self.id]);
    if (potion) return potion;
  }
  const attack = () => {
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? rowFor(d, 'ability', 'x2-dark-knight-attack');
    return row && enemy ? ({ ...row.command, targets: [enemy.id] } as Command) : null;
  };
  if (line.dk === 'drain' && enemy) {
    const drain = use(d, 'ability', 'x2-dark-knight-drain', [enemy.id]);
    if (drain) return drain;
    return attack();
  }
  const drink = heroDrink(d, engine, line, self);
  if (drink) return drink;
  if (self && prepWindow(engine, line) && self.hp - Math.ceil(self.stats.maxHp / 8) <= DK_FLOOR) {
    const swing = attack();
    if (swing) return swing;
  }
  return use(d, 'ability', 'x2-dark-knight-darkness', []);
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface LinkRun {
  outcome: string | undefined;
  ticks: number;
  /** How many times each of the shade's moves started, by ability id. */
  moves: Record<string, number>;
  /** Girls KO'd by the end of the link (0 on a loss means the link ended some other way). */
  koAtEnd: number;
}

const MAX_DECISIONS = 40_000;

function runLink(engine: FFX2Engine, line: LineOptions, decisionMs: number, topMs?: number): LinkRun {
  let turn = 0;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summarise(engine, d.result.outcome);
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (topMs !== undefined && topMs > 0) {
      // Wait's split (`tremaDrive.ts`, `fallenAeonsDrive.ts`): the clock runs while the top-level
      // command menu is open and holds once the cursor drops into a submenu or onto a target, so
      // only the `topMs` part of `decisionMs` is ever ticked.
      engine.setMenuLevel('top');
      engine.tick(Math.min(topMs, decisionMs), { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
    } else if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    turn += 1;
    const picked = d.actorId === 'yuna' ? yunaTurn(d, engine, line, turn) : knightTurn(d, engine, line);
    engine.submit(picked ?? fallback(d));
  }
  return summarise(engine, undefined);
}

function summarise(engine: FFX2Engine, outcome: string | undefined): LinkRun {
  const moves: Record<string, number> = {};
  for (const e of engine.state().log) {
    const id = (e as { abilityId?: string }).abilityId;
    if (e.type === 'action-start' && id?.startsWith('x2-den-')) moves[id] = (moves[id] ?? 0) + 1;
  }
  return { outcome, ticks: engine.state().ticks, moves, koAtEnd: girls(engine).filter((u) => !u.alive).length };
}

export interface DriveOptions {
  decisionMs?: number;
  /** Wait split only: ms of `decisionMs` spent on the top-level command menu (clock running). */
  topMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  /** Look at the engine once a link has ended (a test reads the log). */
  inspect?: (engine: FFX2Engine) => void;
  /** The party (default: the Chapter V preset, GP5 a). A what-if bench passes another. */
  party?: FFX2PartyBuild;
  /** Look at the engine as a link opens (the Den only). */
  start?: (engine: FFX2Engine) => void;
  /** The story's mid-battle triggers (the ship layer's story test); none by default, as the benches run. */
  triggers?: BattleSetup['triggers'];
}

function group(id: string): EnemyGroupDef {
  const g = data.ENEMY_GROUPS_BY_ID[id];
  if (!g) throw new Error(`no formation ${id}`);
  return g;
}

/** One link on its own, from the preset at full HP and MP (a fresh start of that shade). */
export function driveLink(linkId: string, line: LineOptions, seed: number, opts: DriveOptions = {}): LinkRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2', party: opts.party ?? farplaneBuild, enemies: group(linkId), triggers: opts.triggers ?? [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  const run = runLink(engine, line, opts.decisionMs ?? 0, opts.topMs);
  opts.inspect?.(engine);
  return run;
}

/**
 * The whole Den, one line throughout, carrying the party through `setupForNextLink`
 * as the app does (GP3 a: everything carries). A loss on any link ends the run: the
 * retry starts again from Baralai (GP4, built as a).
 */
export function driveDen(line: LineOptions, seed: number, opts: DriveOptions = {}): { outcome: string | undefined; links: LinkRun[] } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  let setup: BattleSetup = {
    game: 'ffx2', party: opts.party ?? farplaneBuild, enemies: group(DEN_OF_WOE_CHAIN_ORDER[0]), triggers: opts.triggers ?? [], seed,
    condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  const links: LinkRun[] = [];
  for (let i = 0; i < DEN_OF_WOE_CHAIN_ORDER.length; i++) {
    opts.start?.(engine);
    const run = runLink(engine, line, opts.decisionMs ?? 0, opts.topMs);
    opts.inspect?.(engine);
    links.push(run);
    if (run.outcome !== 'victory') return { outcome: run.outcome, links };
    const nextId = DEN_OF_WOE_CHAIN_ORDER[i + 1];
    if (!nextId) break;
    setup = setupForNextLink(setup, group(nextId), engine.state(), seed + i + 1) as BattleSetup;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  return { outcome: 'victory', links };
}
