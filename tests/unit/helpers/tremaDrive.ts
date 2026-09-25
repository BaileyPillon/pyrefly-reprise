/**
 * Drive Chapter XIII (Paragon, then Trema, FFX-2) headlessly with a named line of play.
 * **FFX-2 only.** A *line* is a small priority policy standing in for a player who follows
 * one tactic: an input to a measurement, never game data. Nothing here tunes a boss
 * (`docs/plans/chapter-trema-review.md` §9: "measure, never tune").
 *
 * The lines follow the sources' clears (`research/ffx2-trema.md` §5): two Dark Knights on
 * Darkness and a healer `[verified: 3 sources]`; **never Darkness on Paragon** (it draws Big
 * Bang); **drain his MP first** `[verified: 4 sources]` (here the Gunner's Target MP, the one
 * drain the engine models); Shell before Meteor (TR3 = a: magical).
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef, StatBlock } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { CLOISTER_PARAGON, CLOISTER_TREMA } from '../../../src/data/ffx2/enemies/trema.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = {
  id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean;
  stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown>;
  dresspheres?: { current: string; garmentGrid: { nodePosition: number } };
};

export interface LineOptions {
  /** What the Dark Knights swing at Paragon: a plain Attack (Protect reduces it) or Darkness (it does not). */
  paragonDk: 'attack' | 'darkness';
  /** Rikku changes to Gunner at Trema's start and uses Target MP until his MP is below this; 0 = no drain. */
  drainBelow: number;
  /**
   * Curtains: Shell against Paragon's Genesis (magic); Protect against Trema's physical chain,
   * and Shell ahead of each Meteor (TR3 = a: Meteor is magical).
   */
  curtains: boolean;
  /** Rikku cures Confuse, Itchy and Stop with a stashed Remedy. */
  remedy: boolean;
}

export const LINES = {
  /** The sources' clear: Attack on Paragon, Curtains, the drain, Darkness x2 on Trema. */
  intended: { paragonDk: 'attack', drainBelow: 10, curtains: true, remedy: true },
  /** Credibly wrong on link 1 (plan §9): Darkness on Paragon, the move that wins everywhere else. */
  darknessOnParagon: { paragonDk: 'darkness', drainBelow: 10, curtains: true, remedy: true },
  /** Credibly wrong on link 2: straight to Darkness, no drain and no Curtains. */
  noDrainNoShell: { paragonDk: 'attack', drainBelow: 0, curtains: false, remedy: true },
  /** The intended line without the drain (Curtains kept): what the drain is worth. */
  noDrain: { paragonDk: 'attack', drainBelow: 0, curtains: true, remedy: true },
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

function boss(engine: FFX2Engine): Unit | undefined {
  return units(engine).find((u) => u.side === 'enemy' && u.alive);
}

function spherechangeTo(d: Input, dressphere: string): Command | null {
  const row = d.commands.find(
    (c) => c.enabled && c.command.kind === 'spherechange' &&
      (c.command as { extra: { toDressphere: string } }).extra.toDressphere === dressphere,
  );
  return row ? ({ ...row.command } as Command) : null;
}

const MENACED = ['confuse', 'itchy', 'stop'];

/** Rikku as a competent player runs her: revive, drain (Trema), heal the party, Curtains, cure, heal one; else swing. */
function rikkuTurn(d: Input, engine: FFX2Engine, line: LineOptions): Command | null {
  const party = girls(engine);
  const self = party.find((u) => u.id === d.actorId);
  const foe = boss(engine);
  const onTrema = foe?.id === 'trema';
  const sphere = self?.dresspheres?.current;
  const stash = sphere === 'alchemist';
  const living = party.filter((u) => u.alive);
  const lacking = (status: string) => living.filter((u) => !u.statuses[status]).length >= 2;

  const ko = party.filter((u) => !u.alive);
  if (ko[0]) {
    const revive = (stash ? use(d, 'ability', 'x2-alchemist-stash-phoenix-down', [ko[0].id]) : null) ??
      use(d, 'item', 'x2-phoenix-down', [ko[0].id]);
    if (revive) return revive;
  }
  // "Drain his MP first" (Trema only; research §5, `[verified: 4 sources]`): change to Gunner, Target MP until he is below the line, change back.
  if (onTrema && foe && line.drainBelow > 0) {
    if (foe.mp >= line.drainBelow) {
      if (sphere === 'alchemist') return spherechangeTo(d, 'gunner');
      if (sphere === 'gunner') {
        const drain = use(d, 'ability', 'x2-gunner-target-mp', [foe.id]);
        if (drain) return drain;
      }
    } else if (sphere === 'gunner') {
      return spherechangeTo(d, 'alchemist');
    }
  }
  const below = (f: number) => living.filter((u) => u.hp < u.stats.maxHp * f);
  if (below(0.45).length >= 2) {
    const all = use(d, 'item', 'x2-megalixir', []);
    if (all) return all;
  }
  if (line.curtains) {
    // Paragon: Genesis is magic, so Shell (it strips the Shell after it lands). Trema: his
    // three-hit chain is physical, so Protect; Shell ahead of each Meteor (TR3 = a).
    if (!onTrema && lacking('shell')) {
      const shell = use(d, 'item', 'x2-lunar-curtain', []);
      if (shell) return shell;
    }
    if (onTrema && lacking('protect')) {
      const protect = use(d, 'item', 'x2-light-curtain', []);
      if (protect) return protect;
    }
    if (onTrema && foe) {
      const next = foe.hp > foe.stats.maxHp / 2 ? 0.5 : foe.hp > foe.stats.maxHp / 4 ? 0.25 : 0;
      if (next > 0 && foe.hp < foe.stats.maxHp * (next + 0.08) && lacking('shell')) {
        const shell = use(d, 'item', 'x2-lunar-curtain', []);
        if (shell) return shell;
      }
    }
  }
  if (line.remedy) {
    const menaced = living.find((u) => MENACED.some((s) => u.statuses[s]));
    if (menaced) {
      const remedy = (stash ? use(d, 'ability', 'x2-alchemist-stash-remedy', [menaced.id]) : null) ??
        use(d, 'item', 'x2-remedy', [menaced.id]);
      if (remedy) return remedy;
    }
  }
  const lowest = [...living].sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (lowest && lowest.hp < lowest.stats.maxHp * 0.6 && stash) {
    const one = use(d, 'ability', 'x2-alchemist-stash-x-potion', [lowest.id]) ??
      use(d, 'ability', 'x2-alchemist-stash-elixir', [lowest.id]);
    if (one) return one;
  }
  if (foe) {
    const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
    if (attack) return { ...attack.command, targets: [foe.id] } as Command;
  }
  return null;
}

function knightTurn(d: Input, engine: FFX2Engine, line: LineOptions): Command | null {
  const party = girls(engine);
  const self = party.find((u) => u.id === d.actorId);
  const foe = boss(engine);
  if (!self || !foe) return null;
  // Itchy leaves only a spherechange: wait for the Remedy rather than change dresspheres.
  if (self.statuses['itchy']) return { kind: 'defend', targets: [] };
  const rikku = party.find((u) => u.id === 'rikku');
  if (rikku && !rikku.alive) {
    const pd = use(d, 'item', 'x2-phoenix-down', [rikku.id]);
    if (pd) return pd;
  }
  if (self.hp < self.stats.maxHp * 0.25) {
    const mega = use(d, 'item', 'x2-megalixir', []);
    if (mega) return mega;
  }
  const darkness = foe.id === 'trema' || line.paragonDk === 'darkness';
  if (darkness) {
    const dk = use(d, 'ability', 'x2-dark-knight-darkness', []);
    if (dk) return dk;
  }
  const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ??
    rowFor(d, 'ability', 'x2-dark-knight-attack');
  return attack ? ({ ...attack.command, targets: [foe.id] } as Command) : null;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface LinkRun {
  outcome: string | undefined;
  ticks: number;
  /** Game minutes this link took (ticks at 3,000 a second, Normal ATB speed). */
  minutes: number;
  count: (abilityId: string) => number;
  blocked: number;
  /** The link's own event log (for tests that read one run closely). */
  log: readonly BattleEvent[];
}

const MAX_DECISIONS = 60_000;

function runLink(engine: FFX2Engine, line: LineOptions, decisionMs: number): LinkRun {
  const startTicks = engine.state().ticks;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summarise(engine, d.result.outcome, startTicks);
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    const picked = d.actorId === 'rikku' ? rikkuTurn(d, engine, line) : knightTurn(d, engine, line);
    engine.submit(picked ?? fallback(d));
  }
  return summarise(engine, undefined, startTicks);
}

function summarise(engine: FFX2Engine, outcome: string | undefined, startTicks: number): LinkRun {
  const log = engine.state().log;
  const ticks = engine.state().ticks - startTicks;
  return {
    outcome,
    ticks,
    minutes: ticks / 3000 / 60,
    count: (id) => log.filter((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === id).length,
    blocked: log.filter((e) => e.type === 'message' && /lacks the MP|no MP left/.test((e as { text: string }).text)).length,
    log,
  };
}

export interface DriveOptions {
  decisionMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  /**
   * **Measured options for Bailey, never shipped** (plan §9: bring measured options, never
   * weaken a boss). `paragonStats` swaps in another *sourced* reading of Paragon's block (T-6:
   * the wiki's Mag 88 / Def 244 / MDef 89); `hpMultiplier` doubles the girls' max HP as the
   * sourced Stamina Tonic does (TR11 c, not in the engine). Applied right after `init`.
   */
  paragonStats?: Partial<StatBlock>;
  hpMultiplier?: number;
}

function applyOptions(engine: FFX2Engine, opts: DriveOptions): void {
  for (const u of units(engine)) {
    if (u.id === 'paragon' && opts.paragonStats) Object.assign(u.stats, opts.paragonStats);
    if (u.side === 'party' && opts.hpMultiplier && opts.hpMultiplier !== 1) {
      u.stats.maxHp = Math.floor(u.stats.maxHp * opts.hpMultiplier);
      u.hp = u.stats.maxHp;
    }
  }
}

export function group(id: string): EnemyGroupDef {
  const g = data.ENEMY_GROUPS_BY_ID[id];
  if (!g) throw new Error(`no formation ${id}`);
  return g;
}

export function newEngine(opts: DriveOptions = {}): FFX2Engine {
  return new FFX2Engine(ffx2Options({ atbMode: 'active', ...opts.engine }));
}

/** Link 1 on its own, from the preset. */
export function driveParagon(line: LineOptions, seed: number, opts: DriveOptions = {}): LinkRun {
  const engine = newEngine(opts);
  const setup: BattleSetup = {
    game: 'ffx2', party: viaInfinitoBuild, enemies: group(CLOISTER_PARAGON), triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  applyOptions(engine, opts);
  return runLink(engine, line, opts.decisionMs ?? 0);
}

/**
 * Link 2 on its own, from the preset at full HP and MP: an upper bound on what the chain's
 * Trema link can be (the chain arrives spent), and the Fiend Arena-shaped question "can the
 * party beat Trema at all".
 */
export function driveTremaFresh(line: LineOptions, seed: number, opts: DriveOptions = {}): LinkRun {
  const engine = newEngine(opts);
  const setup: BattleSetup = {
    game: 'ffx2', party: viaInfinitoBuild, enemies: group(CLOISTER_TREMA), triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  applyOptions(engine, opts);
  return runLink(engine, line, opts.decisionMs ?? 0);
}

/** The whole chapter: Paragon, then Trema in Paragon's end state, carried as the app carries it. */
export function driveChapter(
  line: LineOptions,
  seed: number,
  opts: DriveOptions = {},
): { outcome: string | undefined; links: LinkRun[]; tremaSetup?: BattleSetup } {
  const engine = newEngine(opts);
  let setup: BattleSetup = {
    game: 'ffx2', party: viaInfinitoBuild, enemies: group(CLOISTER_PARAGON), triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  applyOptions(engine, { ...opts, hpMultiplier: 1 }); // HP is carried and clamped at the seam: link options only
  const first = runLink(engine, line, opts.decisionMs ?? 0);
  if (first.outcome !== 'victory') return { outcome: first.outcome, links: [first] };
  setup = setupForNextLink(setup, group(CLOISTER_TREMA), engine.state(), seed + 1) as BattleSetup;
  engine.setSeed(setup.seed);
  engine.init(setup);
  const second = runLink(engine, line, opts.decisionMs ?? 0);
  return { outcome: second.outcome, links: [first, second], tremaSetup: setup };
}
