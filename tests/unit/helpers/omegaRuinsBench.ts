/**
 * **The bench's harness for the hidden Omega Ruins chapter** (FFX only; `docs/plans/ch-weapon-review.md` section 8): plays one act, or the three acts chained the way the chapter chains them (the real engine, the carry
 * between the links, the heal each later act gives), with the advisor's line or a careless one, over as many seeds as it is asked. Used by `tests/unit/chapters/omega-ruins-bench.test.ts` and by the table's tool
 * (`tools/omega-ruins-bench.mjs`), so what the test pins and what the document prints are one measurement. **No boss row is ever touched**: the only lever is the party preset (`data/ffx/builds/omega-ruins.ts`).
 *
 * Test-only. A *line* reads what a player reads (the menu's rows, the statuses on the icons, the MP gauge) and never the hidden counters or the cycle.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { omegaRuinsBuild, withBagCounts, withPiercingWeapons } from '../../../src/data/ffx/builds/omega-ruins.ts';
import { NEMESIS_GROUP_ID, OMEGA_GROUP_ID, ULTIMA_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import { type LineOptions, SHIPPED_LINE, lineWith } from '../../../src/engine/tactics/omega-ruins.ts';
import { ACTS, careless as carelessLine, engineOf, nextAct, setup, type Input } from './omegaRuinsDrive.ts';

export { ACTS, carelessLine };
export type { Input };

/** The plan's target and band for Act III (preflight section 8): about 70 percent, 60 to 80 accepted; a careless line mostly loses (under 20). */
export const TARGET = 0.7;
export const BAND: readonly [number, number] = [0.6, 0.8];
export const CARELESS_AT_MOST = 0.2;

export type Line = (d: Input, e: BattleEngine) => Command | null;

/** The line the chapter's advisor plays (`src/engine/tactics/omega-ruins.ts`): the intended line. */
export function advisorOf(options: LineOptions = SHIPPED_LINE): Line {
  const tactic = lineWith(options);
  return (d, e) => tactic(d.actorId, d.commands, e);
}
export const advisorLine: Line = advisorOf();

/** The gil one Pay of Yojimbo costs in the bench's Yojimbo line (the Mirror Aeons bench's own `PAY_GIL`). */
export const YOJIMBO_PAY_GIL = 100_000;
const YOJIMBO_FLAG = 'bench.yojimbo';

/**
 * **The Zanmato lottery** (preflight WP9: Yojimbo is on the roster as in the Mirror build, "the bench measures with and without"): `base` with Yojimbo opening the fight. Yuna's first turn summons him; each of his menus is a Pay of
 * {@link YOJIMBO_PAY_GIL} until the gil is gone, then Dismiss; the party then plays `base`. A landed Zanmato kills every legal foe of its group whatever its Death immunity (RE's `afda2d451`, in the engine), and Nemesis's Zanmato
 * byte is 4, which divides the Pay roll (`data/ffx/builds/mirror-aeons.ts`, `YOJIMBO_START_GAUGE`). It is a bench line, never the shipped tactic.
 */
export function withYojimbo(base: Line): Line {
  return (d, e) => {
    const me = e.state().combatants[d.actorId] as FFXCombatant;
    const flags = e.state().flags as Record<string, number | string | boolean>;
    if (me.id === 'yojimbo') {
      const pay = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'yojimbo-pay');
      if (pay) return { ...pay.command, targets: [], gilSpent: YOJIMBO_PAY_GIL } as Command;
      const home = d.commands.find((c) => c.enabled && c.command.kind === 'dismiss');
      if (home) return { ...home.command, targets: home.validTargets.slice(0, 1) } as Command;
    }
    if (d.actorId === 'yuna' && e.state().aeonId === null && flags[YOJIMBO_FLAG] === undefined) {
      const summon = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && 'id' in c.command && c.command.id === 'yojimbo');
      if (summon) {
        flags[YOJIMBO_FLAG] = 1;
        return { ...summon.command, targets: [] } as Command;
      }
    }
    return base(d, e);
  };
}

/** The advisor with one rule taken away (the bench's ablations; the names are the document's). */
export const ABLATIONS: Readonly<Record<string, Partial<LineOptions>>> = {
  'no-auto-life': { autoLife: false },
  'no-mp-items': { drinkMp: false },
  'no-quick-hit': { quickHit: false },
  'no-care': { care: false },
  'life-two': { lifeHolders: 2 },
  'life-one': { lifeHolders: 1 },
};

/** The shipped line with the named ablations applied. */
export function ablatedLine(...names: string[]): Line {
  const merged = Object.assign({}, ...names.map((n) => ABLATIONS[n] ?? (() => { throw new Error(`no ablation '${n}'`); })()));
  return advisorOf({ ...SHIPPED_LINE, ...merged });
}

/** What one fight came to. */
export interface FightResult {
  outcome: 'victory' | 'defeat' | 'unfinished';
  /** Player inputs answered. */
  inputs: number;
  /** The battle's ticks at the end. */
  ticks: number;
  /** The foe's HP at the end. */
  foeHp: number;
  /** Members knocked out (every KO of a party member or aeon). */
  kos: number;
  /** The foe's own turns. */
  foeTurns: number;
}

const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];

/** Play an engine to its end with `choose` (null means Defend); `maxInputs` guards a stalemate. */
export function playEngine(engine: BattleEngine, choose: Line, maxInputs = 2500): FightResult {
  let inputs = 0;
  let outcome: FightResult['outcome'] = 'unfinished';
  for (let i = 0; i < maxInputs * 4; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome === 'victory' ? 'victory' : 'defeat';
      break;
    }
    if (d.kind !== 'player-input') continue;
    if (++inputs > maxInputs) break;
    engine.submit(choose(d, engine) ?? { kind: 'defend', targets: [] });
  }
  const state = engine.state();
  const foe = state.enemyIds[0] as string;
  const events = log(engine);
  return {
    outcome,
    inputs,
    ticks: state.ticks,
    foeHp: (state.combatants[foe] as FFXCombatant).hp,
    kos: events.filter((e) => e.type === 'ko' && e.targetId !== foe).length,
    foeTurns: events.filter((e) => e.type === 'turn-start' && e.actorId === foe).length,
  };
}

/** One act alone, from the preset as it stands (`act` 0 Ultima Weapon, 1 Omega Weapon, 2 Nemesis). */
export function playAct(seed: number, act: 0 | 1 | 2, choose: Line, party: FFXPartyBuild = omegaRuinsBuild): FightResult {
  return playEngine(engineOf(setup(seed, ACTS[act], party)), choose);
}

/** What the whole chapter came to. */
export interface ChainResult {
  outcome: 'victory' | 'defeat-I' | 'defeat-II' | 'defeat-III' | 'unfinished';
  acts: FightResult[];
}

const OUTCOME_OF = ['defeat-I', 'defeat-II', 'defeat-III'] as const;

/**
 * The three acts chained as `runEncounterChain` chains them: the party enters each act as the one before left it (`setupForNextLink`: HP and MP, the bag, the aeons, the gil), and the link's own rule then restores the
 * party and the aeons on entry (`EnemyGroupDef.restoresPartyOnEntry` and `restoresAeonsOnEntry`, which the engine applies when it builds the battle). The seed of each act is the next seed.
 */
export function playChain(seed: number, choose: Line, party: FFXPartyBuild = omegaRuinsBuild): ChainResult {
  const acts: FightResult[] = [];
  let current: BattleSetup = setup(seed, ULTIMA_GROUP_ID, party);
  const links = [OMEGA_GROUP_ID, NEMESIS_GROUP_ID, null] as const;
  for (let i = 0; i < 3; i++) {
    const engine = engineOf(current);
    const result = playEngine(engine, choose);
    acts.push(result);
    if (result.outcome !== 'victory') return { outcome: result.outcome === 'unfinished' ? 'unfinished' : OUTCOME_OF[i]!, acts };
    const next = links[i];
    if (next === null || next === undefined) break;
    current = nextAct(current, engine, next, seed + i + 1);
  }
  return { outcome: 'victory', acts };
}

/** The preset with `phoenixDowns` Phoenix Downs in the bag (the main lever). */
export function withPhoenixDowns(party: FFXPartyBuild, phoenixDowns: number): FFXPartyBuild {
  return withBagCounts(party, { 'phoenix-down': phoenixDowns });
}

/** The levers of the preset itself (`data/ffx/builds/omega-ruins.ts`): Piercing on the weapons, and the bag's counts. */
export { withBagCounts as withBag, withPiercingWeapons as withPiercing };

/** The shared preset without the chapter's levers: the Mirror Aeons build as it stands (the baseline of the table of record). */
export const SHARED_PRESET: FFXPartyBuild = mirrorAeonsBuild;

/** The figures of one cell: how many of `seeds` runs were won, by outcome. */
export interface Rate {
  seeds: number;
  wins: number;
  lost: number;
  unfinished: number;
  /** Total member KOs over the won runs, and Nemesis turns over the won runs (for the report). */
  koTotal: number;
  turnTotal: number;
}

export const share = (r: Rate): number => r.wins / Math.max(1, r.seeds);
export const inBand = (x: number): boolean => x >= BAND[0] && x <= BAND[1];

/** `seeds` fights of one act (`act` 0 to 2) from seed `first`. */
export function rateOfAct(seeds: number, act: 0 | 1 | 2, choose: Line, party: FFXPartyBuild = omegaRuinsBuild, first = 1): Rate {
  const r: Rate = { seeds, wins: 0, lost: 0, unfinished: 0, koTotal: 0, turnTotal: 0 };
  for (let seed = first; seed < first + seeds; seed++) {
    const out = playAct(seed, act, choose, party);
    if (out.outcome === 'victory') {
      r.wins++;
      r.koTotal += out.kos;
      r.turnTotal += out.foeTurns;
    } else if (out.outcome === 'defeat') r.lost++;
    else r.unfinished++;
  }
  return r;
}

/** `seeds` whole chapters (three chained acts) from seed `first`. */
export function rateOfChain(seeds: number, choose: Line, party: FFXPartyBuild = omegaRuinsBuild, first = 1): Rate & { lostIn: [number, number, number] } {
  const r = { seeds, wins: 0, lost: 0, unfinished: 0, koTotal: 0, turnTotal: 0, lostIn: [0, 0, 0] as [number, number, number] };
  for (let seed = first; seed < first + seeds; seed++) {
    const out = playChain(seed, choose, party);
    if (out.outcome === 'victory') r.wins++;
    else if (out.outcome === 'unfinished') r.unfinished++;
    else {
      r.lost++;
      r.lostIn[OUTCOME_OF.indexOf(out.outcome)]!++;
    }
  }
  return r;
}
