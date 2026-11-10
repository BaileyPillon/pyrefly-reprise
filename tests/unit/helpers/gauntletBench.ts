/**
 * **The bench's harness for the hidden Gauntlet chapter** (FFX only; chapter 54; `docs/handoff/ch-gauntlet.md`): plays one act, or the whole chain of the tiers built the way the chapter chains them (the real engine, the carry
 * between the acts, the heal each act's entry gives), with the advisor's line, a careless one or an ablation, over as many seeds as it is asked. Used by `tests/unit/chapters/gauntlet-bench.test.ts` and by the table's
 * tool (`tools/gauntlet-bench.mjs`), so what the test pins and what the document prints are one measurement. **No boss row is ever touched**: a cell is a choice of line or of the party's own estimate. The pattern of
 * `darkAeonsBench.ts`.
 */

import type { BattleEngine, BattleSetup, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';
import { GAUNTLET_ACTS, type GauntletCreatureId } from '../../../src/data/ffx/gauntlet-ids.ts';
import { GAUNTLET_ACTS_BUILT } from '../../../src/data/ffx/enemies/gauntlet-groups.ts';
import { type LineOptions, SHIPPED_LINE, lineWith } from '../../../src/engine/tactics/gauntlet.ts';
import { type Input, type Line, careless as carelessLine, content, groupOfCreature, row as rowOf } from './gauntletDrive.ts';

export { carelessLine, rowOf };
export type { Input, Line };

/** The plan's target and band (`docs/plans/ch-gauntlet-review.md` section 8): about 70 percent per act and for the chain, 60 to 80 accepted; a careless line "mostly loses" is not asked of the simple acts. */
export const TARGET = 0.7;
export const BAND: readonly [number, number] = [0.6, 0.8];

/** The creatures whose rules are built (the acts the chain runs). */
export const BUILT: readonly GauntletCreatureId[] = GAUNTLET_ACTS.slice(0, GAUNTLET_ACTS_BUILT).map((a) => a.creature);

/** The line the chapter's advisor plays (`src/engine/tactics/gauntlet.ts`): the intended line. */
export const advisorLine: Line = (d, e) => lineWith(SHIPPED_LINE)(d.actorId, d.commands, e);

/** The line with one rule taken away or one lever moved (the bench's ablations: what each rule of `src/engine/tactics/gauntlet.ts` is worth). */
export const ABLATIONS: Readonly<Record<string, Partial<LineOptions>>> = {
  'no-zanmato': { zanmato: false },
  'zanmato-all': { zanmatoAt: ['cactuar-king', 'don-tonberry', 'jormungand'] },
  'no-fodder': { fodder: false },
  'no-wait': { tonberryWait: false },
  'no-overdrives': { useOverdrives: false },
  'no-quick-hit': { quickHit: false },
  'pay-10k': { payGil: 10_000 },
  'pay-1m': { payGil: 1_000_000 },
  'heal-45': { healUnder: 0.45 },
  'heal-75': { healUnder: 0.75 },
};

/** The shipped line with the named ablations applied. */
export function ablatedLine(...names: string[]): Line {
  const options: LineOptions = { ...SHIPPED_LINE, ...Object.assign({}, ...names.map((n) => ABLATIONS[n] ?? (() => { throw new Error(`no ablation '${n}'`); })())) };
  const tactic = lineWith(options);
  return (d, e) => tactic(d.actorId, d.commands, e);
}

function setupOf(party: FFXPartyBuild, creature: GauntletCreatureId, seed: number): BattleSetup {
  return { game: 'ffx', party, enemies: groupOfCreature(creature), triggers: [], seed, condition: 'normal', canEscape: false };
}

function engineOn(setup: BattleSetup): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup);
  return engine;
}

/** What one fight came to. `escape` is the Cactuar King leaving ("it got away"). */
export interface FightResult {
  outcome: 'victory' | 'defeat' | 'escape' | 'unfinished';
  /** Player inputs answered. */
  inputs: number;
  /** The battle's ticks at the end. */
  ticks: number;
}

/** Play an engine to its end with `choose` (null means Defend); `maxInputs` guards a stalemate. */
export function playEngine(engine: BattleEngine, choose: Line, maxInputs = 2500): FightResult {
  let inputs = 0;
  for (let i = 0; i < maxInputs * 4; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, inputs, ticks: engine.state().ticks };
    if (d.kind !== 'player-input') continue;
    if (++inputs > maxInputs) break;
    engine.submit(choose(d, engine) ?? { kind: 'defend', targets: [] });
  }
  return { outcome: 'unfinished', inputs, ticks: engine.state().ticks };
}

/** One act alone, from the preset as it stands. */
export function playAct(seed: number, creature: GauntletCreatureId, choose: Line, party: FFXPartyBuild = gauntletBuild): FightResult {
  return playEngine(engineOn(setupOf(party, creature, seed)), choose);
}

/** What a whole chapter came to. */
export interface ChainResult {
  outcome: 'victory' | 'unfinished' | 'escape' | `defeat-${number}`;
  /** The act that was lost or left (1 to 9), or 0. */
  lostAt: number;
  fights: FightResult[];
}

/**
 * The acts of the tiers built chained as `runEncounterChain` chains them: the party enters each act as the one before left it (`setupForNextLink`: HP and MP, the bag, the aeons, the gil, the kill counts), and the act's own
 * rule then restores the party and the aeons on entry (`EnemyGroupDef.restoresPartyOnEntry` and `restoresAeonsOnEntry`, which the engine applies when it builds the battle). The seed of each act is the next seed.
 */
export function playChain(seed: number, choose: Line, party: FFXPartyBuild = gauntletBuild): ChainResult {
  const fights: FightResult[] = [];
  let setup = setupOf(party, BUILT[0]!, seed);
  let engine = engineOn(setup);
  for (let i = 0; i < BUILT.length; i++) {
    const result = playEngine(engine, choose);
    fights.push(result);
    if (result.outcome !== 'victory') return { outcome: result.outcome === 'unfinished' ? 'unfinished' : result.outcome === 'escape' ? 'escape' : (`defeat-${i + 1}` as const), lostAt: i + 1, fights };
    const next = BUILT[i + 1];
    if (next === undefined) break;
    setup = setupForNextLink(setup, groupOfCreature(next), engine.state(), seed + i + 1) as BattleSetup;
    engine = engineOn(setup);
  }
  return { outcome: 'victory', lostAt: 0, fights };
}

/** The preset with `phoenixDowns` Phoenix Downs in the bag. */
export function withPhoenixDowns(party: FFXPartyBuild, phoenixDowns: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const entry of out.inventory) if (entry.itemId === 'phoenix-down') entry.count = phoenixDowns;
  return out;
}

/** The preset with `gil` in the purse (Yojimbo is paid from it). */
export function withGil(party: FFXPartyBuild, gil: number): FFXPartyBuild {
  const out = structuredClone(party);
  out.gil = gil;
  return out;
}

/** The preset with one aeon's Overdrive gauge set. */
export function withAeonGauge(party: FFXPartyBuild, aeonId: string, gauge: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const a of out.aeons) if (a.id === aeonId) a.overdriveGauge = gauge;
  return out;
}

/** The preset with Strength, Defense, Magic and Magic Defense of every member at `fraction` of the caps. */
export function withStatFraction(party: FFXPartyBuild, fraction: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) for (const k of ['str', 'def', 'mag', 'mdef'] as const) m.stats[k] = Math.round(m.stats[k] * fraction);
  return out;
}

/** The preset with every member's Luck set. */
export function withLuck(party: FFXPartyBuild, luck: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.stats.luck = luck;
  return out;
}

/** The preset with every member's Evasion set. */
export function withEvasion(party: FFXPartyBuild, evasion: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.stats.eva = evasion;
  return out;
}

/** The preset with every member's kill count set (the Karma lever, preflight GA5). */
export function withKills(party: FFXPartyBuild, kills: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.kills = kills;
  return out;
}

/** The preset with the line-up swapped (`active` three on the field, the rest on the bench). */
export function withLineUp(party: FFXPartyBuild, active: readonly [string, string, string]): FFXPartyBuild {
  const out = structuredClone(party);
  const all = [...out.activeSlots, ...out.reserve];
  out.activeSlots = [...active] as typeof out.activeSlots;
  out.reserve = all.filter((id) => !active.includes(id)) as typeof out.reserve;
  return out;
}

/** The figures of one cell: how many of `seeds` fights were won, by outcome. */
export interface Rate {
  seeds: number;
  wins: number;
  losses: number;
  /** The Cactuar King left ("it got away"). */
  escapes: number;
  unfinished: number;
}

export const share = (r: Rate): number => r.wins / Math.max(1, r.seeds);
export const inBand = (x: number): boolean => x >= BAND[0] && x <= BAND[1];

/** `seeds` fights of one act from seed 1. */
export function actRate(seeds: number, creature: GauntletCreatureId, choose: Line, party: FFXPartyBuild = gauntletBuild, firstSeed = 1): Rate {
  const r: Rate = { seeds, wins: 0, losses: 0, escapes: 0, unfinished: 0 };
  for (let seed = firstSeed; seed < firstSeed + seeds; seed++) {
    const out = playAct(seed, creature, choose, party);
    if (out.outcome === 'victory') r.wins++;
    else if (out.outcome === 'defeat') r.losses++;
    else if (out.outcome === 'escape') r.escapes++;
    else r.unfinished++;
  }
  return r;
}

/** `seeds` whole chapters from seed 1, with the act the first loss or departure came at tallied. */
export function chainRate(seeds: number, choose: Line, party: FFXPartyBuild = gauntletBuild, firstSeed = 1): Rate & { lostAt: number[] } {
  const r = { seeds, wins: 0, losses: 0, escapes: 0, unfinished: 0, lostAt: Array<number>(BUILT.length + 1).fill(0) };
  for (let seed = firstSeed; seed < firstSeed + seeds; seed++) {
    const out = playChain(seed, choose, party);
    if (out.outcome === 'victory') r.wins++;
    else if (out.outcome === 'unfinished') r.unfinished++;
    else {
      if (out.outcome === 'escape') r.escapes++;
      else r.losses++;
      r.lostAt[out.lostAt] = (r.lostAt[out.lostAt] ?? 0) + 1;
    }
  }
  return r;
}
