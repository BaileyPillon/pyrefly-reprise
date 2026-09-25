/**
 * Drive Chapter XI (the fallen aeons, FFX-2) headlessly with a named line of
 * play. **FFX-2 only.** A *line* is a small priority policy standing in for a
 * player who follows one tactic; it is an input to a measurement, never game
 * data, and nothing here tunes a boss (`docs/plans/chapter-fallen-aeons-review.md` §9).
 *
 * The lines follow the sources' clears (`research/ffx2-fallen-aeons.md` §5):
 * two Dark Knights on Darkness and a White Mage healing `[verified: 3 sources]`;
 * Remedy on Stop; Dispel on Not-So-Mighty Guard; Shell early and Remedy after
 * Pain on Anima; "kill Mindy first" (the wiki and GamerGuides).
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild, MidBattleTrigger } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { FALLEN_AEONS_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean; stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown> };

export interface LineOptions {
  /**
   * What the Dark Knights do: Darkness on all, or one named enemy while it lives,
   * by Attack (physical, rolls against Evasion) or by Drain (magic, never misses;
   * Attack once the MP runs out).
   */
  dk: 'darkness' | { focus: string; via?: 'attack' | 'drain' };
  /** The White Mage: cure Stop with a Remedy. */
  remedyStop: boolean;
  /** The White Mage: Remedy a girl carrying Pain's Silence or Darkness. */
  remedyPain: boolean;
  /** The White Mage: Dispel an enemy under Protect, Shell or Regen. */
  dispel: boolean;
  /** The White Mage: Shell (then Protect) the party once, early. */
  guardEarly: boolean;
  /** The White Mage: cure damage (off = she only revives and Prays). */
  heal: boolean;
  /**
   * The White Mage: Shell and Protect come first, ahead of cures and Dispel (GamerGuides:
   * "Mighty Guard or Protect + Shell at the start of each fight", research §5 `[single source]`).
   * Off = the older order, where `guardEarly` waits behind cures and Dispel.
   */
  guardFirst?: boolean;
  /** The White Mage: the guard from the bag (Lunar Curtain, Light Curtain: party-wide, no charge). */
  curtains?: boolean;
}

export const LINES = {
  /** Shiva, the sourced clear the preset can do: Protect + Shell, Darkness x2, heals, Remedy on Stop. */
  shivaIntended: { dk: 'darkness', remedyStop: true, remedyPain: false, dispel: false, guardEarly: true, heal: true },
  /** Shiva, "all-out" (plan §9): Darkness x2, Yuna only revives and Prays, nobody cures Stop. */
  shivaAllOut: { dk: 'darkness', remedyStop: false, remedyPain: false, dispel: false, guardEarly: false, heal: false },
  /** Sisters, the guides' line: Protect + Shell, kill Mindy first, Dispel the guard, heal. */
  sistersMindyFirst: { dk: { focus: 'mindy' }, remedyStop: false, remedyPain: false, dispel: true, guardEarly: true, heal: true },
  /**
   * Sisters, "kill Mindy first" by the preset's one single-target spell: Drain
   * never misses, so Mindy's Evasion 76 stops mattering (verifier 2026-09-24).
   */
  sistersMindyFirstDrain: { dk: { focus: 'mindy', via: 'drain' }, remedyStop: false, remedyPain: false, dispel: true, guardEarly: true, heal: true },
  /** Sisters, the 3-guide clear: Protect + Shell, Darkness x2, Dispel the guard, heal. */
  sistersDarknessDispel: { dk: 'darkness', remedyStop: false, remedyPain: false, dispel: true, guardEarly: true, heal: true },
  /** Sisters, credibly wrong (plan §9): Darkness spam, no Dispel (guard and heals kept). */
  sistersDarknessSpam: { dk: 'darkness', remedyStop: false, remedyPain: false, dispel: false, guardEarly: true, heal: true },
  /** Anima, the sourced clear: Shell and Protect early, Darkness x2, heals, Remedy after Pain. */
  animaIntended: { dk: 'darkness', remedyStop: false, remedyPain: true, dispel: false, guardEarly: true, heal: true },
  /** Anima, credibly wrong: no Shell, no Remedy after Pain. */
  animaNoAnswers: { dk: 'darkness', remedyStop: false, remedyPain: false, dispel: false, guardEarly: false, heal: true },
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

/**
 * The White Mage as a competent player runs her: items first (they have no charge
 * bar), spells when the bag cannot answer. `heal: false` is the reckless line:
 * she only revives and Prays.
 */
function guardTurn(d: Input, living: Unit[], line: LineOptions): Command | null {
  if (living.some((u) => !u.statuses['shell'])) {
    const shell = (line.curtains ? use(d, 'item', 'x2-lunar-curtain', []) : null) ?? use(d, 'ability', 'x2-white-mage-shell', []);
    if (shell) return shell;
  }
  if (living.some((u) => !u.statuses['protect'])) {
    const protect = (line.curtains ? use(d, 'item', 'x2-light-curtain', []) : null) ?? use(d, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  return null;
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
  if (line.guardFirst && line.guardEarly && turn < 8) {
    const guard = guardTurn(d, living, line);
    if (guard) return guard;
  }
  const below = (f: number) => living.filter((u) => u.hp < u.stats.maxHp * f);
  const lowest = [...living].sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
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
  if (line.remedyStop) {
    const stopped = living.find((u) => u.statuses['stop']);
    if (stopped) return use(d, 'item', 'x2-remedy', [stopped.id]);
  }
  if (line.remedyPain) {
    const pained = living.find((u) => u.statuses['silence'] || u.statuses['darkness']);
    if (pained) {
      const remedy = use(d, 'item', 'x2-remedy', [pained.id]);
      if (remedy) return remedy;
    }
  }
  if (self && self.mp < 30) {
    const ether = use(d, 'item', 'x2-turbo-ether', [self.id]);
    if (ether) return ether;
  }
  if (line.dispel) {
    const guarded = units(engine).find(
      (u) => u.side === 'enemy' && u.alive && (u.statuses['protect'] || u.statuses['shell'] || u.statuses['regen']),
    );
    if (guarded) {
      const dispel = use(d, 'ability', 'x2-white-mage-dispel', [guarded.id]);
      if (dispel) return dispel;
    }
  }
  if (line.guardEarly && turn < 8) {
    const guard = guardTurn(d, living, line);
    if (guard) return guard;
  }
  if (line.heal && lowest && lowest.hp < lowest.stats.maxHp * 0.75) {
    const cura = use(d, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(d, 'ability', 'x2-white-mage-pray', []);
}

function knightTurn(d: Input, engine: FFX2Engine, line: LineOptions): Command | null {
  const self = girls(engine).find((u) => u.id === d.actorId);
  if (self && self.hp < self.stats.maxHp * 0.2) {
    const potion = use(d, 'item', 'x2-x-potion', [self.id]);
    if (potion) return potion;
  }
  if (typeof line.dk === 'object') {
    const focus = units(engine).find((u) => u.id === (line.dk as { focus: string }).focus && u.alive);
    if (focus && line.dk.via === 'drain') {
      const drain = use(d, 'ability', 'x2-dark-knight-drain', [focus.id]);
      if (drain) return drain;
    }
    if (focus) {
      const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ??
        rowFor(d, 'ability', 'x2-dark-knight-attack');
      if (attack) return { ...attack.command, targets: [focus.id] } as Command;
    }
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
  deltaAttacks: number;
  overdrives: number;
  /** The battle's event log, for the loss anatomy (`fallen-aeons-ship-bench.test.ts`). */
  log: readonly BattleEvent[];
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
      // Wait's split: the top-level list runs the clock, a submenu holds it.
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
  const log = engine.state().log;
  const started = (id: string) =>
    log.filter((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === id).length;
  return {
    outcome,
    ticks: engine.state().ticks,
    deltaAttacks: started('x2-magus-delta-attack'),
    overdrives: started('x2-shiva-diamond-dust') + started('x2-anima-oblivion'),
    log,
  };
}

export interface DriveOptions {
  decisionMs?: number;
  /** Wait split only: ms spent on the top-level list before the submenu. */
  topMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  /** Set `state.flags` after init (the FA8 b switch). */
  flags?: Record<string, string | number | boolean>;
  /** The party (default: the chapter's `farplaneBuild`); a measured option passes its own. */
  build?: FFX2PartyBuild;
  /** The story's mid-battle triggers (default none), for the ship layer's trigger tests. */
  triggers?: MidBattleTrigger[];
}

function group(id: string): EnemyGroupDef {
  const g = data.ENEMY_GROUPS_BY_ID[id];
  if (!g) throw new Error(`no formation ${id}`);
  return g;
}

/**
 * One link on its own, the party as it would arrive: link 1 from the preset,
 * links 2 and 3 through the Save Sphere restore (FA2 b), which makes a lone
 * link equal to the FA3 retry of that link.
 */
export function driveLink(linkId: string, line: LineOptions, seed: number, opts: DriveOptions = {}): LinkRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2', party: opts.build ?? farplaneBuild, enemies: group(linkId), triggers: opts.triggers ?? [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  Object.assign(engine.state().flags, opts.flags ?? {});
  return runLink(engine, line, opts.decisionMs ?? 0, opts.topMs);
}

/** The whole chain, one line per link, carrying the party through `setupForNextLink` as the app does. */
export function driveChain(
  lines: readonly [LineOptions, LineOptions, LineOptions],
  seed: number,
  opts: DriveOptions = {},
): { outcome: string | undefined; links: LinkRun[] } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  let setup: BattleSetup = {
    game: 'ffx2', party: opts.build ?? farplaneBuild, enemies: group(FALLEN_AEONS_CHAIN_ORDER[0]), triggers: [], seed,
    condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  const links: LinkRun[] = [];
  for (let i = 0; i < FALLEN_AEONS_CHAIN_ORDER.length; i++) {
    Object.assign(engine.state().flags, opts.flags ?? {});
    const run = runLink(engine, lines[i]!, opts.decisionMs ?? 0, opts.topMs);
    links.push(run);
    if (run.outcome !== 'victory') return { outcome: run.outcome, links };
    const nextId = FALLEN_AEONS_CHAIN_ORDER[i + 1];
    if (!nextId) break;
    setup = setupForNextLink(setup, group(nextId), engine.state(), seed + i + 1) as BattleSetup;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  return { outcome: 'victory', links };
}
