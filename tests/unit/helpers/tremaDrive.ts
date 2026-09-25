/**
 * Drive Chapter XIII (Paragon, then Trema, FFX-2) headlessly with a named line of play.
 * **FFX-2 only.** A *line* is a small priority policy standing in for a player who follows
 * one tactic: an input to a measurement, never game data. Nothing here tunes a boss
 * (`docs/plans/chapter-trema-review.md` §9: "measure, never tune").
 *
 * The lines follow the sources' clears (`research/ffx2-trema.md` §5): two Dark Knights on
 * Darkness and a healer `[verified: 3 sources]`; **never Darkness on Paragon** (it draws Big
 * Bang); **drain his MP first** `[verified: 4 sources]` (here the Gunner's Target MP, the one
 * drain TR11 a carries; the kit options' lines use a Soul Spring); Shell before Meteor (TR3 = a:
 * magical). The policies live in `tremaLines.ts`.
 */

import type { BattleEvent, BattleSetup, EnemyGroupDef, FFX2PartyBuild, InventoryEntry, StatBlock } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { CLOISTER_PARAGON, CLOISTER_TREMA } from '../../../src/data/ffx2/enemies/trema.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { fallback, knightTurn, rikkuTurn, units, type LineOptions } from './tremaLines.ts';
export { LINES, type LineOptions } from './tremaLines.ts';

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

function runLink(engine: FFX2Engine, line: LineOptions, decisionMs: number, topMs?: number): LinkRun {
  const startTicks = engine.state().ticks;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summarise(engine, d.result.outcome, startTicks);
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (topMs !== undefined && topMs > 0) {
      // Wait's split (`fallenAeonsDrive.ts`, `ffx2ChapterDrive.ts`): the clock runs while the
      // top-level list is open, and holds once the cursor drops into a submenu or the target
      // cursor. Only the `topMs` portion is ever ticked; the rest of `decisionMs` is spent with
      // the clock held, so it moves nothing.
      engine.setMenuLevel('top');
      engine.tick(Math.min(topMs, decisionMs), { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
    } else if (decisionMs > 0) {
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
  /** Wait split only: ms of `decisionMs` spent on the top-level list before a submenu or the
   * target cursor holds the clock (`fallenAeonsDrive.ts`, `ffx2ChapterDrive.ts`). */
  topMs?: number;
  /** A party build in place of the shipped preset: a kit option (`via-infinito-kit.ts`). */
  build?: FFX2PartyBuild;
  engine?: Partial<Ffx2EngineOptions>;
  /**
   * **Measured options for Bailey, never shipped** (plan §9: bring measured options, never
   * weaken a boss). `paragonStats` swaps in another *sourced* reading of Paragon's block (T-6:
   * the wiki's Mag 88 / Def 244 / MDef 89); `hpMultiplier` doubles the girls' max HP as the
   * sourced Stamina Tonic does (TR11 c, not in the engine). Applied right after `init`.
   */
  paragonStats?: Partial<StatBlock>;
  hpMultiplier?: number;
  /** Items added to the TR11 a bag, **an option row only** (the Phoenix Downs question for Bailey). */
  extraItems?: InventoryEntry[];
}

/** The preset, with any option items added to its bag. */
function partyFor(opts: DriveOptions): FFX2PartyBuild {
  const base = opts.build ?? viaInfinitoBuild;
  if (!opts.extraItems?.length) return base;
  return { ...base, inventory: [...base.inventory, ...opts.extraItems] };
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
    game: 'ffx2', party: partyFor(opts), enemies: group(CLOISTER_PARAGON), triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  applyOptions(engine, opts);
  return runLink(engine, line, opts.decisionMs ?? 0, opts.topMs);
}

/**
 * Link 2 on its own, from the preset at full HP and MP: an upper bound on what the chain's
 * Trema link can be (the chain arrives spent), and the Fiend Arena-shaped question "can the
 * party beat Trema at all".
 */
export function driveTremaFresh(line: LineOptions, seed: number, opts: DriveOptions = {}): LinkRun {
  const engine = newEngine(opts);
  const setup: BattleSetup = {
    game: 'ffx2', party: partyFor(opts), enemies: group(CLOISTER_TREMA), triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  applyOptions(engine, opts);
  return runLink(engine, line, opts.decisionMs ?? 0, opts.topMs);
}

/** The whole chapter: Paragon, then Trema in Paragon's end state, carried as the app carries it. */
export function driveChapter(
  line: LineOptions,
  seed: number,
  opts: DriveOptions = {},
): { outcome: string | undefined; links: LinkRun[]; tremaSetup?: BattleSetup } {
  const engine = newEngine(opts);
  let setup: BattleSetup = {
    game: 'ffx2', party: partyFor(opts), enemies: group(CLOISTER_PARAGON), triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  applyOptions(engine, { ...opts, hpMultiplier: 1 }); // HP is carried and clamped at the seam: link options only
  const first = runLink(engine, line, opts.decisionMs ?? 0, opts.topMs);
  if (first.outcome !== 'victory') return { outcome: first.outcome, links: [first] };
  setup = setupForNextLink(setup, group(CLOISTER_TREMA), engine.state(), seed + 1) as BattleSetup;
  engine.setSeed(setup.seed);
  engine.init(setup);
  const second = runLink(engine, line, opts.decisionMs ?? 0, opts.topMs);
  return { outcome: second.outcome, links: [first, second], tremaSetup: setup };
}
