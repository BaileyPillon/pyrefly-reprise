/**
 * **The bench's harness for the hidden Mirror Aeons chapter** (FFX only; `docs/plans/ch-mirror-aeons-bench.md`): plays one act, or both acts chained the way the chapter chains them (the real engine, the carry between
 * the links, the heal Act II's entry gives), with the advisor's line or a careless one, over as many seeds as it is asked. Used by `tests/unit/chapters/mirror-aeons-bench.test.ts` and by the table's tool
 * (`tools/mirror-aeons-bench.mjs`), so what the test pins and what the document prints are one measurement. **No boss row is ever touched**: a cell is a choice among the game's own formations, a preset lever is the
 * party's own estimate.
 */

import type { BattleEngine, BattleSetup, Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { sistersGroupId, yojimboGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { type LineOptions, SHIPPED_LINE, lineWith, mirrorAeons } from '../../../src/engine/tactics/mirror-aeons.ts';
import { careless as carelessLine, row as rowOf, type Input } from './mirrorAeonsDrive.ts';

export { carelessLine, rowOf };
export type { Input };

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

/** The plan's target and band (`docs/plans/ch-mirror-aeons-review.md` section 3): about 70 percent, 60 to 80 accepted; a careless line "mostly loses": under 20. */
export const TARGET = 0.7;
export const BAND: readonly [number, number] = [0.6, 0.8];
export const CARELESS_AT_MOST = 0.2;

/** The line the chapter's advisor plays (`src/engine/tactics/mirror-aeons.ts`): the intended line. */
export const advisorLine = (d: Input, e: BattleEngine): Command | null => mirrorAeons(d.actorId, d.commands, e);
export type Line = (d: Input, e: BattleEngine) => Command | null;

/**
 * The line with one rule taken away (the bench's ablations: what each rule of `src/engine/tactics/mirror-aeons.ts` is worth). The names are the document's: `shield-on-full` waits for the full gauge, `heal-45` heals
 * under 45 percent, `no-auto-life`, `no-cheer`, `story-aeons-first` sends the five story aeons before Yojimbo, `items-only` heals from the bag and not with Yuna's spells.
 */
export const ABLATIONS: Readonly<Record<string, Partial<LineOptions>>> = {
  'shield-on-full': { shieldAt: 100 },
  'heal-45': { healUnder: 0.45 },
  'no-auto-life': { lifeUpkeep: false },
  'no-cheer': { cheerStacks: 0 },
  'story-aeons-first': { yojimboFirst: false },
  'items-only': { spellHeal: false },
};

/** The shipped line with the named ablations applied. */
export function ablatedLine(...names: string[]): Line {
  const options: LineOptions = { ...SHIPPED_LINE, ...Object.assign({}, ...names.map((n) => ABLATIONS[n] ?? (() => { throw new Error(`no ablation '${n}'`); })())) };
  const tactic = lineWith(options);
  return (d, e) => tactic(d.actorId, d.commands, e);
}

/** Act I's cells (the file names of the game's formations; the adjusted trio is OUR adjustment) and Act II's tiers. */
export const ACT_I_CELLS = ['kino00_70', 'kino01_72', 'kino00_70-g0'] as const;
export const ACT_II_CELLS = ['nagi05_70', 'nagi05_71', 'nagi05_72'] as const;

const groupOf = (file: string) => {
  const group = ENEMY_GROUPS_BY_ID[file.startsWith('kino') ? sistersGroupId(file) : yojimboGroupId(file)];
  if (group === undefined) throw new Error(`the bench has no formation '${file}'`);
  return group;
};

function setupOf(party: FFXPartyBuild, file: string, seed: number): BattleSetup {
  return { game: 'ffx', party, enemies: groupOf(file), triggers: [], seed, condition: 'normal', canEscape: false };
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
export function playEngine(engine: BattleEngine, choose: Line, maxInputs = 1500): FightResult {
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

/** One act alone, from the preset as it stands. */
export function playAct(seed: number, file: string, choose: Line, party: FFXPartyBuild = mirrorAeonsBuild): FightResult {
  return playEngine(engineOn(setupOf(party, file, seed)), choose);
}

/** What a whole chapter came to. */
export interface ChainResult {
  outcome: 'victory' | 'defeat-I' | 'defeat-II' | 'unfinished';
  first: FightResult;
  second?: FightResult;
}

/**
 * Act I then Act II, chained as `runEncounterChain` chains them: the party enters Act II as Act I left it (`setupForNextLink`: HP and MP, the bag, the aeons, Yojimbo's compatibility and the gil), and the link's own rule
 * then restores the party and the aeons on entry (`EnemyGroupDef.restoresPartyOnEntry` and `restoresAeonsOnEntry`, which the engine applies when it builds the battle). The seed of Act II is the next seed.
 */
export function playChain(seed: number, actI: string, actII: string, choose: Line, party: FFXPartyBuild = mirrorAeonsBuild): ChainResult {
  const setup1 = setupOf(party, actI, seed);
  const engine1 = engineOn(setup1);
  const first = playEngine(engine1, choose);
  if (first.outcome !== 'victory') return { outcome: first.outcome === 'unfinished' ? 'unfinished' : 'defeat-I', first };
  const setup2 = setupForNextLink(setup1, groupOf(actII), engine1.state(), seed + 1) as BattleSetup;
  const second = playEngine(engineOn(setup2), choose);
  return { outcome: second.outcome === 'victory' ? 'victory' : second.outcome === 'unfinished' ? 'unfinished' : 'defeat-II', first, second };
}

/** The preset with `phoenixDowns` Phoenix Downs in the bag (the bench's main lever). */
export function withPhoenixDowns(party: FFXPartyBuild, phoenixDowns: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const entry of out.inventory) if (entry.itemId === 'phoenix-down') entry.count = phoenixDowns;
  return out;
}

/** The preset with every member's Luck set (a lever the bench measured and left at its first value). */
export function withLuck(party: FFXPartyBuild, luck: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.stats.luck = luck;
  return out;
}

/** The preset with Strength, Defense, Magic and Magic Defense of every member at `fraction` of the caps (the "stat estimate" lever; Agility, Evasion, Accuracy and the HP stay: speed and the hit rule are not what it measures). */
export function withStatFraction(party: FFXPartyBuild, fraction: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) for (const k of ['str', 'def', 'mag', 'mdef'] as const) m.stats[k] = Math.round(m.stats[k] * fraction);
  return out;
}

/** The figures of one cell: how many of `seeds` fights were won, by outcome. */
export interface Rate {
  seeds: number;
  wins: number;
  lostFirst: number;
  lostSecond: number;
  unfinished: number;
}

export const share = (r: Rate): number => r.wins / Math.max(1, r.seeds);
export const inBand = (x: number): boolean => x >= BAND[0] && x <= BAND[1];

/** `seeds` chained chapters (or, with `actII` null, single acts) from seed 1. */
export function rateOf(seeds: number, actI: string, actII: string | null, choose: Line, party: FFXPartyBuild = mirrorAeonsBuild): Rate {
  const r: Rate = { seeds, wins: 0, lostFirst: 0, lostSecond: 0, unfinished: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const out = actII === null ? playAct(seed, actI, choose, party) : playChain(seed, actI, actII, choose, party);
    if (out.outcome === 'victory') r.wins++;
    else if (out.outcome === 'defeat-I' || out.outcome === 'defeat') r.lostFirst++;
    else if (out.outcome === 'defeat-II') r.lostSecond++;
    else r.unfinished++;
  }
  return r;
}

/** The cell whose advisor rate is nearest the target and inside the band; null when none is. */
export function pickCell<T extends { advisor: Rate }>(cells: readonly T[]): T | null {
  const inside = cells.filter((c) => inBand(share(c.advisor))).sort((a, b) => Math.abs(share(a.advisor) - TARGET) - Math.abs(share(b.advisor) - TARGET));
  return inside[0] ?? null;
}
