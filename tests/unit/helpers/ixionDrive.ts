/**
 * Drive Ixion at Djose (FFX-2) headlessly with a named line of play. **FFX-2 only.** A *line* is a small
 * priority policy standing in for a player; it is an input to a measurement, never game data, and nothing
 * here tunes the boss (rule 6; `docs/plans/ixion-bench.md`).
 *
 * - **sensible**: the guides' clear (research `ffx2-ixion-djose.md` §4.5): two Dark Knights on Darkness, a
 *   White Mage who puts Shell and Protect up and keeps them up, heals, and **answers the tell**: when the
 *   "Recharge" line has gone up and Thor's Hammer has not yet come, she tops everyone up and re-casts Shell
 *   (Split_Infinity: "heal as soon as you see Recharge").
 * - **naive**: the same party with no answers: Darkness, and a White Mage who only revives, cures a girl
 *   below 40 % and otherwise Prays. No Shell, no Protect, and the tell is ignored.
 */

import type { BattleEvent, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import { djoseIxionGroup, IXION_ID } from '../../../src/data/ffx2/enemies/ixion-djose.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean; stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown> };

export type IxionLine = 'sensible' | 'naive';

export const RECHARGE = 'x2-ixion-recharge';
export const HAMMER = 'x2-ixion-thors-hammer';

function girls(engine: FFX2Engine): Unit[] {
  return (Object.values(engine.state().combatants) as unknown as Unit[]).filter((u) => u.side === 'party' && !u.removed);
}

function use(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const row = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return row ? ({ ...row.command, targets } as Command) : null;
}

/** What the player can read off the screen: Ixion's last action was Recharge, and the Hammer has not come. */
export function tellIsUp(log: readonly BattleEvent[]): boolean {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i] as { type: string; actorId?: string; abilityId?: string };
    if (e.type === 'action-start' && e.actorId === IXION_ID) return e.abilityId === RECHARGE;
  }
  return false;
}

function yunaTurn(d: Input, engine: FFX2Engine, line: IxionLine): Command | null {
  const party = girls(engine);
  const ko = party.filter((u) => !u.alive);
  if (ko[0]) return use(d, 'item', 'x2-phoenix-down', [ko[0].id]) ?? use(d, 'ability', 'x2-white-mage-life', [ko[0].id]);
  const living = party.filter((u) => u.alive);
  const lowest = [...living].sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  const below = (f: number) => living.filter((u) => u.hp < u.stats.maxHp * f);
  if (line === 'naive') {
    if (lowest && lowest.hp < lowest.stats.maxHp * 0.4) return use(d, 'ability', 'x2-white-mage-cura', [lowest.id]);
    return use(d, 'ability', 'x2-white-mage-pray', []);
  }
  const self = living.find((u) => u.id === d.actorId);
  if (self && self.mp < 24) {
    const ether = use(d, 'item', 'x2-ether', [self.id]);
    if (ether) return ether;
  }
  if (tellIsUp(engine.state().log)) {
    // The tell: Shell first (it halves the Hammer), then everyone as high as she can get them.
    if (living.some((u) => !u.statuses['shell'])) {
      const shell = use(d, 'ability', 'x2-white-mage-shell', []) ?? use(d, 'item', 'x2-lunar-curtain', []);
      if (shell) return shell;
    }
    if (below(0.7).length >= 2) {
      const all = use(d, 'item', 'x2-mega-potion', []) ?? use(d, 'ability', 'x2-white-mage-pray', []);
      if (all) return all;
    }
    if (lowest && lowest.hp < lowest.stats.maxHp * 0.9) return use(d, 'ability', 'x2-white-mage-curaga', [lowest.id]);
  }
  if (below(0.35).length >= 2) {
    const all = use(d, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (lowest && lowest.hp < lowest.stats.maxHp * 0.45) {
    const one = use(d, 'ability', 'x2-white-mage-curaga', [lowest.id]) ?? use(d, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (one) return one;
  }
  if (living.some((u) => !u.statuses['shell'])) {
    const shell = use(d, 'ability', 'x2-white-mage-shell', []);
    if (shell) return shell;
  }
  if (living.some((u) => !u.statuses['protect'])) {
    const protect = use(d, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  if (lowest && lowest.hp < lowest.stats.maxHp * 0.75) return use(d, 'ability', 'x2-white-mage-cura', [lowest.id]);
  return use(d, 'ability', 'x2-white-mage-pray', []);
}

function knightTurn(d: Input, engine: FFX2Engine, line: IxionLine): Command | null {
  const self = girls(engine).find((u) => u.id === d.actorId);
  if (line === 'sensible' && self && self.hp < self.stats.maxHp * 0.25) {
    const potion = use(d, 'item', 'x2-hi-potion', [self.id]);
    if (potion) return potion;
  }
  return use(d, 'ability', 'x2-dark-knight-darkness', []);
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => t === IXION_ID) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface IxionRun {
  outcome: string | undefined;
  ticks: number;
  /** Ixion's actions (each `action-start` he takes). */
  ixionTurns: number;
  /** The girls' actions. */
  partyTurns: number;
  recharges: number;
  hammers: number;
  /** Hammers that left at least one girl KO'd. */
  hammerKos: number;
  log: readonly BattleEvent[];
}

export interface IxionDriveOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  /** Wait split only: ms on the top-level list with the clock running. */
  topMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  /** `state.flags` set after init: F-8's `ixionThundaraSplit = 'wiki'`, FA8 b's `fallenAeonsAcTrigger = 'damaged'`. */
  flags?: Record<string, string | number | boolean>;
  build?: FFX2PartyBuild;
}

const MAX_DECISIONS = 40_000;

function summarise(engine: FFX2Engine, outcome: string | undefined): IxionRun {
  const log = engine.state().log;
  let ixionTurns = 0, partyTurns = 0, recharges = 0, hammers = 0, hammerKos = 0;
  let inHammer = false, koThisHammer = false;
  for (const e of log as readonly (BattleEvent & { actorId?: string; abilityId?: string })[]) {
    if (e.type === 'action-start') {
      if (inHammer && koThisHammer) hammerKos += 1;
      inHammer = false;
      if (e.actorId === IXION_ID) {
        ixionTurns += 1;
        if (e.abilityId === RECHARGE) recharges += 1;
        if (e.abilityId === HAMMER) { hammers += 1; inHammer = true; koThisHammer = false; }
      } else partyTurns += 1;
    }
    if (e.type === 'ko' && inHammer) koThisHammer = true;
  }
  if (inHammer && koThisHammer) hammerKos += 1;
  return { outcome, ticks: engine.state().ticks, ixionTurns, partyTurns, recharges, hammers, hammerKos, log };
}

/** One fight from the chapter's preset (or `opts.build`), one line, one seed. */
export function driveIxion(line: IxionLine, seed: number, opts: IxionDriveOptions = {}): IxionRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2', party: opts.build ?? djoseBuild, enemies: djoseIxionGroup, triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  Object.assign(engine.state().flags, opts.flags ?? {});
  const decisionMs = opts.decisionMs ?? 0;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return summarise(engine, d.result.outcome);
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
    const picked = d.actorId === 'yuna' ? yunaTurn(d, engine, line) : knightTurn(d, engine, line);
    engine.submit(picked ?? fallback(d));
  }
  return summarise(engine, undefined);
}
