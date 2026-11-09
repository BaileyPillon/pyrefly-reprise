/**
 * Drive Ifrit at Kilika Temple (FFX-2 Chapter 3, the hidden chapter) headlessly with a named line of play. **FFX-2 only.** A *line* is a small priority policy standing in for a player; it is an input to a measurement,
 * never game data, and nothing here tunes the boss (rule 6; `docs/plans/ch-ifrit-review.md` §8).
 *
 * - **advisor**: the shipped move advisor's tactic (`src/engine/tactics/ffx2-ifrit-kilika.ts`, the line the guide teaches): Yuna revives, heals, Protect and Shell; Rikku Darkness; Paine Armor Break, Power Break, then the plain attack.
 * - **naive**: the same girls with no answers: Yuna only revives and cures a girl below 40 % (else Prays), Rikku Darkness, Paine the plain attack. No Protect, no Shell, no Breaks.
 *
 * The what-if builds (`samuraiPaine`, `djoseKilika`) are measurement inputs only; nothing ships them.
 */

import type { BattleEvent, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { kilikaBuild } from '../../../src/data/ffx2/builds/kilika.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import { IFRIT_ID, kilikaIfritGroup } from '../../../src/data/ffx2/enemies/ifrit.ts';
import {
  IFRIT_ABOUT_TO_BLOW_ID, IFRIT_ANGRY_ID, IFRIT_ATTACK_ID, IFRIT_ENDS_NOW_ID, IFRIT_FIRAGA_ID, IFRIT_FURIOUS_ID, IFRIT_HELLFIRE_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_TIME_UP_METEOR_ID,
} from '../../../src/data/ffx2/enemies/ifrit-abilities.ts';
import { ffx2IfritKilika } from '../../../src/engine/tactics/ffx2-ifrit-kilika.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean; stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown> };

export type IfritLine = 'advisor' | 'naive';

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

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => t === IFRIT_ID) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface IfritRun {
  outcome: string | undefined;
  ticks: number;
  /** His actions by ability id. */
  moves: Record<string, number>;
  /** His actions in order (ability ids). */
  order: string[];
  /** The girl each Meteor Strike went to, in order. */
  meteorVictims: string[];
  partyTurns: number;
  /** Girls knocked out at least once, counted per KO event. */
  kos: number;
  log: readonly BattleEvent[];
}

export interface IfritDriveOptions {
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

type Ev = BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; targets?: string[] };

export function summariseIfrit(engine: FFX2Engine, outcome: string | undefined): IfritRun {
  const log = engine.state().log;
  const moves: Record<string, number> = {};
  const order: string[] = [];
  const meteorVictims: string[] = [];
  let partyTurns = 0;
  let kos = 0;
  for (const e of log as readonly Ev[]) {
    if (e.type === 'action-start') {
      if (e.actorId === IFRIT_ID && e.abilityId !== undefined) {
        moves[e.abilityId] = (moves[e.abilityId] ?? 0) + 1;
        order.push(e.abilityId);
        if (e.abilityId === IFRIT_METEOR_STRIKE_ID && e.targets?.[0] !== undefined) meteorVictims.push(e.targets[0]);
      } else if (e.actorId !== IFRIT_ID) partyTurns += 1;
    }
    if (e.type === 'ko' && e.targetId !== IFRIT_ID) kos += 1;
  }
  return { outcome, ticks: engine.state().ticks, moves, order, meteorVictims, partyTurns, kos, log };
}

/** The Chapter 3 preset with Paine WEARING the Samurai dressphere she owns (a what-if: the shipped preset wears the Warrior). */
export function samuraiPaine(): FFX2PartyBuild {
  const build = structuredClone(kilikaBuild);
  const paine = build.members[2]!;
  paine.currentDressphere = 'samurai';
  paine.spriteKey = 'paine-warrior';
  return build;
}

/** The Djose preset (32 / 33 / 34, the end of Chapter 3, an estimate) as the harder what-if. */
export function djoseKilika(): FFX2PartyBuild {
  return structuredClone(djoseBuild);
}

/** One fight from the chapter's preset (or `opts.build`), one line, one seed. */
export function driveIfrit(line: IfritLine, seed: number, opts: IfritDriveOptions = {}): IfritRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2', party: opts.build ?? kilikaBuild, enemies: kilikaIfritGroup, triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  Object.assign(engine.state().flags, opts.flags ?? {});
  const decisionMs = opts.decisionMs ?? 0;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summariseIfrit(engine, d.result.outcome);
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
    const picked = line === 'advisor' ? ffx2IfritKilika(d.actorId, d.commands, engine) : naiveTurn(d, engine);
    engine.submit(picked ?? fallback(d));
  }
  return summariseIfrit(engine, undefined);
}

export const IFRIT_MOVES = {
  attack: IFRIT_ATTACK_ID,
  firaga: IFRIT_FIRAGA_ID,
  meteor: IFRIT_METEOR_STRIKE_ID,
  hellfire: IFRIT_HELLFIRE_ID,
  angry: IFRIT_ANGRY_ID,
  furious: IFRIT_FURIOUS_ID,
  aboutToBlow: IFRIT_ABOUT_TO_BLOW_ID,
  endsNow: IFRIT_ENDS_NOW_ID,
  timeUp: IFRIT_TIME_UP_METEOR_ID,
} as const;
