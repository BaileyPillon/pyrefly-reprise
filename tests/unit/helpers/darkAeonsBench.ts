/**
 * **The bench's harness for the hidden Dark Aeons chapter** (FFX only; `docs/handoff/ch-dark-aeons.md` section 7): plays one link, or the whole chain of seven the way the chapter chains them (the real engine, the carry between
 * the links, the heal each link's entry gives), with the advisor's line or a careless one, over as many seeds as it is asked. Used by `tests/unit/chapters/dark-aeons-bench.test.ts` and by the table's tool
 * (`tools/dark-aeons-bench.mjs`), so what the test pins and what the document prints are one measurement. **No boss row is ever touched**: a cell is a choice of line or of the party's own estimate.
 */

import type { BattleEngine, BattleSetup, Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { DARK_SIX_LINKS, type DarkSixKey, darkSixLink } from '../../../src/data/ffx/dark-aeons-six-ids.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { type LineOptions, SHIPPED_LINE, darkAeons, lineWith } from '../../../src/engine/tactics/dark-aeons.ts';
import { careless as carelessLine, row as rowOf, type Input } from './darkAeonsDrive.ts';

export { carelessLine, rowOf };
export type { Input };

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

/** The plan's target and band (`docs/plans/ch-dark-aeons-review.md` section 7): about 70 percent per link and for the chain, 60 to 80 accepted; a careless line "mostly loses": under 20 per link. */
export const TARGET = 0.7;
export const BAND: readonly [number, number] = [0.6, 0.8];
export const CARELESS_AT_MOST = 0.2;

export type Line = (d: Input, e: BattleEngine) => Command | null;
/** The line the chapter's advisor plays (`src/engine/tactics/dark-aeons.ts`): the intended line. */
export const advisorLine: Line = (d, e) => darkAeons(d.actorId, d.commands, e);

/** The line with one rule taken away or one lever moved (the bench's ablations: what each rule of `src/engine/tactics/dark-aeons.ts` is worth). */
export const ABLATIONS: Readonly<Record<string, Partial<LineOptions>>> = {
  'no-fodder': { useFodder: false },
  'no-zanmato': { zanmato: false },
  'zanmato-all': { zanmatoAt: ['dark6-valefor', 'dark6-ifrit', 'dark6-ixion-1', 'dark6-ixion-2', 'dark6-shiva', 'dark6-anima', 'dark6-bahamut'] },
  'zanmato-late': { zanmatoAt: ['dark6-shiva', 'dark6-anima', 'dark6-bahamut'] },
  'no-auto-life': { lifeUpkeep: false },
  'no-overdrives': { useOverdrives: false },
  'no-quick-hit': { quickHit: false },
  'pay-10k': { payGil: 10_000 },
  'pay-1m': { payGil: 1_000_000 },
  'shield-early': { shieldMarginHits: 5 },
  'shield-late': { shieldMarginHits: 1 },
  'heal-45': { healUnder: 0.45 },
  'heal-75': { healUnder: 0.75 },
};

/** The shipped line with the named ablations applied. */
export function ablatedLine(...names: string[]): Line {
  const options: LineOptions = { ...SHIPPED_LINE, ...Object.assign({}, ...names.map((n) => ABLATIONS[n] ?? (() => { throw new Error(`no ablation '${n}'`); })())) };
  const tactic = lineWith(options);
  return (d, e) => tactic(d.actorId, d.commands, e);
}

const groupOf = (key: DarkSixKey) => {
  const group = ENEMY_GROUPS_BY_ID[darkSixLink(key).groupId];
  if (group === undefined) throw new Error(`the bench has no link '${key}'`);
  return group;
};

function setupOf(party: FFXPartyBuild, key: DarkSixKey, seed: number): BattleSetup {
  return { game: 'ffx', party, enemies: groupOf(key), triggers: [], seed, condition: 'normal', canEscape: false };
}

function engineOn(setup: BattleSetup): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup);
  return engine;
}

/** What one fight came to. */
export interface FightResult {
  outcome: 'victory' | 'defeat' | 'unfinished';
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
    if (d.kind === 'battle-over') return { outcome: d.result.outcome === 'victory' ? 'victory' : 'defeat', inputs, ticks: engine.state().ticks };
    if (d.kind !== 'player-input') continue;
    if (++inputs > maxInputs) break;
    engine.submit(choose(d, engine) ?? { kind: 'defend', targets: [] });
  }
  return { outcome: 'unfinished', inputs, ticks: engine.state().ticks };
}

/** One link alone, from the preset as it stands. */
export function playLink(seed: number, key: DarkSixKey, choose: Line, party: FFXPartyBuild = darkAeonsBuild): FightResult {
  return playEngine(engineOn(setupOf(party, key, seed)), choose);
}

/** What a whole chapter came to. */
export interface ChainResult {
  outcome: 'victory' | 'unfinished' | `defeat-${number}`;
  /** The link that was lost (1 to 7), or 0. */
  lostAt: number;
  fights: FightResult[];
}

/**
 * The seven links chained as `runEncounterChain` chains them: the party enters each link as the one before left it (`setupForNextLink`: HP and MP, the bag, the aeons, the gil), and the link's own rule then restores the
 * party and the aeons on entry (`EnemyGroupDef.restoresPartyOnEntry` and `restoresAeonsOnEntry`, which the engine applies when it builds the battle). The seed of each link is the next seed.
 * `retries` is how many times a lost link may be retried from its checkpoint (the chapter retries a link; the bag carries as it stood on entry).
 */
export function playChain(seed: number, choose: Line, party: FFXPartyBuild = darkAeonsBuild): ChainResult {
  const fights: FightResult[] = [];
  let setup = setupOf(party, DARK_SIX_LINKS[0]!.key, seed);
  let engine = engineOn(setup);
  for (let i = 0; i < DARK_SIX_LINKS.length; i++) {
    const link = DARK_SIX_LINKS[i]!;
    const result = playEngine(engine, choose);
    fights.push(result);
    if (result.outcome !== 'victory') return { outcome: result.outcome === 'unfinished' ? 'unfinished' : (`defeat-${link.link}` as const), lostAt: link.link, fights };
    const next = DARK_SIX_LINKS[i + 1];
    if (next === undefined) break;
    setup = setupForNextLink(setup, groupOf(next.key), engine.state(), seed + i + 1) as BattleSetup;
    engine = engineOn(setup);
  }
  return { outcome: 'victory', lostAt: 0, fights };
}

/** The preset with `phoenixDowns` Phoenix Downs in the bag (the bench's main lever). */
export function withPhoenixDowns(party: FFXPartyBuild, phoenixDowns: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const entry of out.inventory) if (entry.itemId === 'phoenix-down') entry.count = phoenixDowns;
  return out;
}

/** The preset with `gil` in the purse (Yojimbo is paid from it: the bench's lever for the two long fights). */
export function withGil(party: FFXPartyBuild, gil: number): FFXPartyBuild {
  const out = structuredClone(party);
  out.gil = gil;
  return out;
}

/** The preset with one aeon's Overdrive gauge set (Yojimbo's full gauge adds 20 to the Pay's motivation, RE's Zanmato note: the bench's lever for the two long fights). */
export function withAeonGauge(party: FFXPartyBuild, aeonId: string, gauge: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const a of out.aeons) if (a.id === aeonId) a.overdriveGauge = gauge;
  return out;
}

/** The preset with Strength, Defense, Magic and Magic Defense of every member at `fraction` of the caps (the "stat estimate" lever; Agility, Evasion, Accuracy, Luck and the HP stay: speed and the hit rules are not what it measures). */
export function withStatFraction(party: FFXPartyBuild, fraction: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) for (const k of ['str', 'def', 'mag', 'mdef'] as const) m.stats[k] = Math.round(m.stats[k] * fraction);
  return out;
}

/** The preset with every member's Luck set (the cliff: Dark Bahamut is hit 58 in 101 at Luck 60 and 38 at Luck 40, RE six 6.1). */
export function withLuck(party: FFXPartyBuild, luck: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.stats.luck = luck;
  return out;
}

/** The preset with every member's Evasion set (Dark Ixion's blade lands when Evasion plus Luck is under 290, RE six 6.2). */
export function withEvasion(party: FFXPartyBuild, evasion: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.stats.eva = evasion;
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
  unfinished: number;
}

export const share = (r: Rate): number => r.wins / Math.max(1, r.seeds);
export const inBand = (x: number): boolean => x >= BAND[0] && x <= BAND[1];

/** `seeds` fights of one link from seed 1. */
export function linkRate(seeds: number, key: DarkSixKey, choose: Line, party: FFXPartyBuild = darkAeonsBuild, firstSeed = 1): Rate {
  const r: Rate = { seeds, wins: 0, losses: 0, unfinished: 0 };
  for (let seed = firstSeed; seed < firstSeed + seeds; seed++) {
    const out = playLink(seed, key, choose, party);
    if (out.outcome === 'victory') r.wins++;
    else if (out.outcome === 'defeat') r.losses++;
    else r.unfinished++;
  }
  return r;
}

/** `seeds` whole chapters from seed 1, with the link the first loss came at tallied. */
export function chainRate(seeds: number, choose: Line, party: FFXPartyBuild = darkAeonsBuild, firstSeed = 1): Rate & { lostAt: number[] } {
  const r = { seeds, wins: 0, losses: 0, unfinished: 0, lostAt: Array<number>(DARK_SIX_LINKS.length + 1).fill(0) };
  for (let seed = firstSeed; seed < firstSeed + seeds; seed++) {
    const out = playChain(seed, choose, party);
    if (out.outcome === 'victory') r.wins++;
    else if (out.outcome === 'unfinished') r.unfinished++;
    else {
      r.losses++;
      r.lostAt[out.lostAt] = (r.lostAt[out.lostAt] ?? 0) + 1;
    }
  }
  return r;
}
