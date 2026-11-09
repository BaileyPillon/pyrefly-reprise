/**
 * Drive Garik Ronso and the Ronso Youths (FFX-2 Chapter 3, the hidden chapter) headlessly with a named line of play. **FFX-2 only.** A *line* is a small priority policy standing in for a player; it is an input to a
 * measurement, never game data, and nothing here tunes the boss (rule 6; `docs/plans/ch-lionheart-review.md` section 8).
 *
 * - **advisor**: the shipped move advisor's tactic (`src/engine/tactics/ffx2-garik-ronso.ts`, the line the guide teaches): Yuna revives, heals and keeps Protect up; Rikku and Paine cast Darkness.
 * - **naive**: the same girls with no answers: Yuna only revives and cures a girl below 40 % (else Prays), Rikku Darkness, Paine the plain attack on the first target. No Protect.
 * - **blackMage**: the advisor line with Yuna wearing Black Mage from her first turn (the Curse trap, hostile fight): she Changes and casts nothing else useful, so the line measures what the lance costs.
 *
 * The what-if builds (`besaidKit`, `lv40Kit`) are measurement inputs only; nothing ships them. `forced` makes a fighter do a chosen move once (the engine tests' rig).
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { besaidBuild } from '../../../src/data/ffx2/builds/besaid.ts';
import { garikRonsoBuild } from '../../../src/data/ffx2/builds/garik-ronso.ts';
import { garikFriendlyGroup, garikHostileGroup } from '../../../src/data/ffx2/enemies/garik-ronso.ts';
import { GARIK_BODY_IDS, X2_GARIK_BOUT_ID, X2_GARIK_ID } from '../../../src/data/garik-ronso-ids.ts';
import { ffx2GarikRonso } from '../../../src/engine/tactics/ffx2-garik-ronso.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean; stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown> };

export type GarikFight = 'hostile' | 'friendly';
export type GarikLine = 'advisor' | 'naive' | 'blackMage';

export const GROUPS: Readonly<Record<GarikFight, EnemyGroupDef>> = { hostile: garikHostileGroup, friendly: garikFriendlyGroup };

function girls(engine: FFX2Engine): Unit[] {
  return (Object.values(engine.state().combatants) as unknown as Unit[]).filter((u) => u.side === 'party' && !u.removed);
}

function use(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const row = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return row ? ({ ...row.command, targets } as Command) : null;
}

/** The naive line: no answers to anything. */
function naiveTurn(d: Input, engine: FFX2Engine): Command | null {
  if (d.actorId === 'yuna') {
    const party = girls(engine);
    const ko = party.filter((u) => !u.alive);
    if (ko[0]) return use(d, 'item', 'x2-phoenix-down', [ko[0].id]) ?? use(d, 'ability', 'x2-white-mage-life', [ko[0].id]);
    const lowest = [...party].filter((u) => u.alive).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
    if (lowest && lowest.hp < lowest.stats.maxHp * 0.4) return use(d, 'ability', 'x2-white-mage-cura', [lowest.id]);
    return use(d, 'ability', 'x2-white-mage-pray', []);
  }
  if (d.actorId === 'rikku') return use(d, 'ability', 'x2-dark-knight-darkness', []);
  return null;
}

/** The Black Mage line: Yuna wears Black Mage as soon as she can (one Change), then the advisor line. */
function blackMageTurn(d: Input, engine: FFX2Engine): Command | null {
  if (d.actorId === 'yuna') {
    const unit = engine.state().combatants['yuna'] as unknown as { dresspheres?: { current: string } };
    if (unit.dresspheres?.current !== 'black-mage') {
      const change = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' && (c.command as { extra?: { toDressphere?: string } }).extra?.toDressphere === 'black-mage');
      if (change) return { ...change.command, targets: [] } as Command;
    }
  }
  return ffx2GarikRonso(d.actorId, d.commands, engine);
}

function fallback(d: Input, group: EnemyGroupDef): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const ids = group.enemies.map((e) => e.id);
  const target = row.validTargets.find((t) => ids.includes(t)) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface GarikRun {
  outcome: string | undefined;
  ticks: number;
  /** The foes' actions by ability id, all bodies together. */
  moves: Record<string, number>;
  /** Garik's actions in order (ability ids). */
  garikOrder: string[];
  /** Every foe action in order, as `actor:ability`. */
  order: string[];
  /** The largest number of actions any one foe took. */
  longest: number;
  partyTurns: number;
  /** Girls knocked out at least once, counted per KO event. */
  kos: number;
  /** Times the lance's Curse landed. */
  curses: number;
  log: readonly BattleEvent[];
}

export interface GarikDriveOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  /** Wait split only: ms on the top-level list with the clock running. */
  topMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  build?: FFX2PartyBuild;
  /** `state.flags` set after init. */
  flags?: Record<string, number | string | boolean>;
}

const MAX_DECISIONS = 40_000;

type Ev = BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; targets?: string[]; status?: string };

export function summariseGarik(engine: FFX2Engine, outcome: string | undefined): GarikRun {
  const log = engine.state().log;
  const foes: ReadonlySet<string> = new Set(GARIK_BODY_IDS);
  const moves: Record<string, number> = {};
  const garikOrder: string[] = [];
  const order: string[] = [];
  const perFoe: Record<string, number> = {};
  let partyTurns = 0;
  let kos = 0;
  let curses = 0;
  for (const e of log as readonly Ev[]) {
    if (e.type === 'action-start') {
      if (e.actorId !== undefined && foes.has(e.actorId) && e.abilityId !== undefined) {
        moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
        order.push(`${e.actorId}:${e.abilityId}`);
        perFoe[e.actorId] = (perFoe[e.actorId] ?? 0) + 1;
        if (e.actorId === X2_GARIK_ID || e.actorId === X2_GARIK_BOUT_ID) garikOrder.push(e.abilityId);
      } else partyTurns += 1;
    }
    if (e.type === 'ko' && e.targetId !== undefined && !foes.has(e.targetId)) kos += 1;
    if (e.type === 'status-add' && e.status === 'curse') curses += 1;
  }
  return { outcome, ticks: engine.state().ticks, moves, garikOrder, order, longest: Math.max(0, ...Object.values(perFoe)), partyTurns, kos, curses, log };
}

/** The Chapter 2 preset carried forward (a what-if: the shipped preset is the Djose one, an end-of-Chapter-3 estimate). */
export function besaidKit(): FFX2PartyBuild {
  return structuredClone(besaidBuild);
}

/** The shipped preset with every girl at Lv 40 (a what-if, easier). */
export function lv40Kit(): FFX2PartyBuild {
  const build = structuredClone(garikRonsoBuild);
  for (const m of build.members) m.level = 40;
  return build;
}

/** One fight from the chapter's preset (or `opts.build`), one line, one seed. */
export function driveGarik(fight: GarikFight, line: GarikLine, seed: number, opts: GarikDriveOptions = {}): GarikRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const group = GROUPS[fight];
  const setup: BattleSetup = { game: 'ffx2', party: opts.build ?? garikRonsoBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  Object.assign(engine.state().flags, opts.flags ?? {});
  const decisionMs = opts.decisionMs ?? 0;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summariseGarik(engine, d.result.outcome);
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (opts.topMs !== undefined && opts.topMs > 0) {
      engine.setMenuLevel('top');
      engine.tick(Math.min(opts.topMs, decisionMs), { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
    } else if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    const picked = line === 'advisor' ? ffx2GarikRonso(d.actorId, d.commands, engine) : line === 'naive' ? naiveTurn(d, engine) : blackMageTurn(d, engine);
    engine.submit(picked ?? fallback(d, group));
  }
  return summariseGarik(engine, undefined);
}
