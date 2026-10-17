/**
 * Chapter VI driven link by link for the X2-L / XL1 measurement (PR-0107, how a chained link opens). **FFX-2 only.**
 *
 * The same chain loop as `ffx2ChapterDrive.ts#driveChain` (the bench checks the two equal, seeds 1 to 3, event for event), with what
 * the link-opening question needs and `driveChain` does not hand back: each link's own length in logic steps, who holds the smallest
 * wait on the field the moment the link is initialised (the game's first to fill), and who actually takes the first turn and the
 * first action of the link. The decision time `D` is an input to a measurement, not game data (`ffx2ChapterDrive.ts`).
 */

import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

/** The three paces `docs/handoff/iter2-b1.md` defines. */
export interface Speed {
  key: 'human' | 'active' | 'bench';
  decisionMs: number;
  /** The Wait split: the first `topMs` of each decision are spent on the top list, the rest inside a submenu. */
  topMs?: number;
  engine: Partial<Ffx2EngineOptions>;
}

export const SPEEDS: readonly Speed[] = [
  /** The live Wait split: 1.5 s a menu, 0.5 s of it on the top list. */
  { key: 'human', decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } },
  /** Active: 1.5 s a menu with the clock running. */
  { key: 'active', decisionMs: 1500, engine: { atbMode: 'active' } },
  /** Zero decision time. */
  { key: 'bench', decisionMs: 0, engine: {} },
];

/** The girls of Chapter VI's build; anyone else on the field is the Syndicate. */
export const GIRLS: ReadonlySet<string> = new Set(['yuna', 'rikku', 'paine']);

export type Side = 'party' | 'enemy';

/** One link of the chain, as the bench reads it. */
export interface LinkRecord {
  groupId: string;
  /** Logic steps this link ran. */
  ticks: number;
  /** `victory` / `defeat`, or undefined when the loop ran out. */
  outcome: string | undefined;
  /** Who holds the smallest wait right after the link was initialised (ties: the lower slot), i.e. fills first. */
  fillsFirst: Side;
  /** Who takes the first `turn-start` of the link's log. */
  firstTurn: Side | null;
  /** Who takes the first `action-start` of the link's log. */
  firstAct: Side | null;
  /** HP the girls lost in this link (damage events to a girl, amount above 0). */
  damageTaken: number;
  /** Girls knocked out in this link. */
  kos: number;
}

export interface LeblancRun {
  /** The last link's outcome: `victory` only when all three links were won. */
  outcome: string | undefined;
  logs: BattleEvent[][];
  links: LinkRecord[];
}

const MAX_DECISIONS = 30_000;

function sideOf(id: string): Side {
  return GIRLS.has(id) ? 'party' : 'enemy';
}

function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

function runLink(engine: FFX2Engine, speed: Speed): string | undefined {
  const { decisionMs, topMs } = speed;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return d.result.outcome;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (topMs !== undefined) {
      const top = Math.min(topMs, decisionMs);
      if (top > 0) {
        engine.setMenuLevel('top');
        engine.tick(top, { throughInput: true });
        engine.setMenuLevel('deep');
        if (!engine.inputValid(d.actorId)) continue;
      }
      if (decisionMs - top > 0) engine.tick(decisionMs - top, { throughInput: true });
    } else if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    const picked = intendedStrategy(d.actorId, d.commands, engine);
    engine.submit(picked ?? fallback(d));
  }
  return undefined;
}

/** The side whose unit has the smallest wait left (the first to reach 0); among equals the lower kernel slot. */
function fillsFirst(engine: FFX2Engine): Side {
  const units = (Object.values(engine.state().combatants) as Ffx2Unit[]).filter((u) => u.alive && !u.removed);
  let best: Ffx2Unit | undefined;
  for (const u of units) {
    if (best === undefined || u.atb.recovery < best.atb.recovery || (u.atb.recovery === best.atb.recovery && u.gauge.slot < best.gauge.slot)) best = u;
  }
  return best === undefined ? 'enemy' : best.side === 'party' ? 'party' : 'enemy';
}

function readLog(log: readonly BattleEvent[]): Pick<LinkRecord, 'firstTurn' | 'firstAct' | 'damageTaken' | 'kos'> {
  let firstTurn: Side | null = null;
  let firstAct: Side | null = null;
  let damageTaken = 0;
  let kos = 0;
  for (const e of log) {
    if (e.type === 'turn-start' && firstTurn === null) firstTurn = sideOf(e.actorId);
    if (e.type === 'action-start' && firstAct === null) firstAct = sideOf(e.actorId);
    if (e.type === 'damage' && GIRLS.has(e.targetId) && e.amount > 0) damageTaken += e.amount;
    if (e.type === 'ko' && GIRLS.has(e.targetId)) kos += 1;
  }
  return { firstTurn, firstAct, damageTaken, kos };
}

/** Chapter VI, Acts I to III, one unbroken run in the shipped order with the shipped line (`intendedStrategy`). */
export function driveLeblanc(seed: number, speed: Speed, extra: Partial<Ffx2EngineOptions> = {}): LeblancRun {
  const engine = new FFX2Engine(ffx2Options({ ...speed.engine, ...extra }));
  const first = data.ENEMY_GROUPS_BY_ID[LEBLANC_CHAIN_ORDER[0]];
  if (!first) throw new Error('the Chateau chain is missing its first act');
  let setup: BattleSetup = { game: 'ffx2', party: chateauBuild, enemies: first, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  let group: EnemyGroupDef = first;
  const out: LeblancRun = { outcome: undefined, logs: [], links: [] };
  let opens = fillsFirst(engine);
  for (let linkNo = 1; ; linkNo++) {
    const outcome = runLink(engine, speed);
    const log = [...engine.state().log];
    out.logs.push(log);
    out.links.push({ groupId: group.id, ticks: engine.state().ticks, outcome, fillsFirst: opens, ...readLog(log) });
    out.outcome = outcome;
    if (outcome !== 'victory' || !group.nextGroupId) break;
    const next = data.ENEMY_GROUPS_BY_ID[group.nextGroupId];
    if (!next) throw new Error(`the chain points at "${group.nextGroupId}", which has no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + linkNo) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
    opens = fillsFirst(engine);
  }
  return out;
}
