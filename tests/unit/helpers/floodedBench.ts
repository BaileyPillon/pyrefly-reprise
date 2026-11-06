/**
 * **The bench's harness for the hidden Flooded Ways chapter** (FFX only; `docs/handoff/ch-flooded-ways.md`): plays Evrae Altana's three areas as one fight (the real engine, the carry between the areas as
 * `runEncounterChain` does it) and Geosgaeno as another, with a named line, over as many seeds as it is asked. Used by `tests/unit/chapters/flooded-ways-bench.test.ts` and by the table's tool
 * (`tools/flooded-ways-bench.mjs`), so what the test pins and what the document prints are one measurement. **No boss row is ever touched**: a cell is a choice of line or of the party's own estimate.
 *
 * The lines are the bench's own players, not the game's: each is a few rules of the guides' advice written down. They are a floor for a thinking player, not a ceiling.
 */

import type { BattleEngine, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { swimmersBuild } from '../../../src/data/ffx/builds/swimmers.ts';
import { EVRAE_ALTANA_ID, GEOSGAENO_ID } from '../../../src/data/ffx/flooded-ways-ids.ts';
import { type Input, type LinkKey, actor, defend, flags, playChain, playEngine, row, setup, newEngine, LINK_KEYS } from './floodedDrive.ts';

export type Line = (d: Input, e: BattleEngine) => Command | null;

const SWIM = ['tidus', 'wakka', 'rikku'] as const;
const frac = (c: FFXCombatant): number => c.hp / Math.max(1, c.stats.maxHp);
const living = (e: BattleEngine): FFXCombatant[] => SWIM.map((id) => actor(e, id)).filter((c) => c.alive && !c.removed);
const fallen = (e: BattleEngine): FFXCombatant[] => SWIM.map((id) => actor(e, id)).filter((c) => !c.alive && !c.removed);
const heldId = (e: BattleEngine): string => String(flags(e)['fw.hold'] ?? '');

/** A healing item on the weakest living member under `under` of their maximum, or a Phoenix Down on a fallen one; null when nothing needs it. */
function mend(d: Input, e: BattleEngine, under: number): Command | null {
  const down = fallen(e)[0];
  if (down !== undefined) {
    const c = row(d, 'item', 'phoenix-down', down.id);
    if (c) return c;
  }
  const weakest = living(e).filter((c) => c.id !== heldId(e)).sort((a, b) => frac(a) - frac(b))[0];
  if (weakest !== undefined && frac(weakest) < under) {
    for (const id of ['hi-potion', 'x-potion', 'al-bhed-potion', 'potion']) {
      const c = row(d, 'item', id, weakest.id);
      if (c) return c;
    }
  }
  return null;
}

/** Strike the foe with the best thing on the menu: an Overdrive when one is ready, else the plain Attack. */
function strike(d: Input, targetId: string): Command | null {
  const od = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(targetId));
  if (od) return { ...od.command, targets: [targetId] } as Command;
  return row(d, 'attack', undefined, targetId);
}

// ---------------------------------------------------------------------------
// Evrae Altana (areas 1 to 3, one fight)
// ---------------------------------------------------------------------------

/** The guides' line: two Phoenix Downs end the dead one, and a fallen member is stood up first. */
export const evraePhoenix: Line = (d, e) => {
  const evrae = actor(e, EVRAE_ALTANA_ID);
  if (evrae.alive) {
    const c = row(d, 'item', 'phoenix-down', EVRAE_ALTANA_ID);
    if (c) return c;
  }
  return strike(d, EVRAE_ALTANA_ID);
};

/** The line without the trick: open the locks, strike, mend at 45 percent; never a healing item on Evrae. */
export const evraeOrdinary: Line = (d, e) => {
  const fix = mend(d, e, 0.45);
  if (fix) return fix;
  for (const lock of ['gate-lock-1', 'gate-lock-2']) {
    const c = row(d, 'trigger', 'open-lock', lock);
    if (c) return c;
  }
  return strike(d, EVRAE_ALTANA_ID);
};

/** The plain Attack on Evrae Altana, nothing else, never an item. */
export const evraeCareless: Line = (d, e) => row(d, 'attack', undefined, EVRAE_ALTANA_ID) ?? row(d, 'attack', undefined, 'gate-lock-1') ?? row(d, 'attack', undefined, 'gate-lock-2') ?? (e ? null : null);

// ---------------------------------------------------------------------------
// Geosgaeno
// ---------------------------------------------------------------------------

/** What the held character does: `struggle` always, `wait` (Defend) always, or `smart` (wait while the spit-out would leave everyone standing, else Struggle). */
export type HoldPolicy = 'struggle' | 'wait' | 'smart';

function heldMove(d: Input, e: BattleEngine, policy: HoldPolicy): Command | null {
  const me = actor(e, d.actorId);
  const others = living(e).filter((c) => c.id !== me.id);
  const spit = Math.max(0, me.hp - 1);
  const safe = others.every((c) => c.hp > spit);
  if (policy === 'wait' || (policy === 'smart' && safe)) return defend();
  return row(d, 'ability', 'struggle', GEOSGAENO_ID) ?? defend();
}

/** The elemental line: Poison Fang once, then the gems in turn (Geosgaeno is weak to all five), an Overdrive when ready, mending first. */
export function geosgaenoLine(policy: HoldPolicy = 'smart', mendUnder = 0.5): Line {
  return (d, e) => {
    if (heldId(e) === d.actorId) return heldMove(d, e, policy);
    const fix = mend(d, e, mendUnder);
    if (fix) return fix;
    const geo = actor(e, GEOSGAENO_ID);
    if (!geo.statuses['poison']) {
      const c = row(d, 'item', 'poison-fang', GEOSGAENO_ID);
      if (c) return c;
    }
    for (const id of ['fire-gem', 'ice-gem', 'lightning-gem', 'water-gem']) {
      const c = row(d, 'item', id, GEOSGAENO_ID);
      if (c) return c;
    }
    return strike(d, GEOSGAENO_ID);
  };
}

/** The plain Attack on Geosgaeno, never an item, the held character struggling. */
export const geosgaenoCareless: Line = (d, e) => (heldId(e) === d.actorId ? heldMove(d, e, 'struggle') : row(d, 'attack', undefined, GEOSGAENO_ID));

// ---------------------------------------------------------------------------
// Fights and rates
// ---------------------------------------------------------------------------

export interface FightResult {
  outcome: 'victory' | 'defeat' | 'unfinished';
  /** Player inputs answered. */
  inputs: number;
  /** The area (1 to 3) Evrae fell in or the party fell in; 0 for Geosgaeno. */
  area: number;
  /** Members shattered by the water over the fight. */
  shattered: number;
}

const flat = (outcome: string): FightResult['outcome'] => (outcome === 'victory' ? 'victory' : outcome === 'defeat' ? 'defeat' : 'unfinished');

/** Geosgaeno alone (the second fight), from seed `seed`. */
export function playGeosgaeno(seed: number, line: Line, party: FFXPartyBuild = swimmersBuild, maxInputs = 900): FightResult {
  const e = newEngine(seed, 'geosgaeno', party);
  const run = playEngine(e, line, maxInputs);
  return { outcome: flat(run.outcome), inputs: run.inputs, area: 0, shattered: shatters(e) };
}

function shatters(e: BattleEngine): number {
  return SWIM.filter((id) => actor(e, id).statuses['eject'] !== undefined).length;
}

/** Evrae Altana's areas chained as the chapter chains them, until the boss falls (a win) or the party does. */
export async function playEvrae(seed: number, line: Line, party: FFXPartyBuild = swimmersBuild, maxInputs = 900): Promise<FightResult> {
  let inputs = 0;
  let shattered = 0;
  let lastArea = 1;
  const { steps, outcome } = await playChain(seed, (engine, key) => {
    const run = playEngine(engine, line, maxInputs);
    inputs += run.inputs;
    shattered += shatters(engine);
    lastArea = LINK_KEYS.indexOf(key) + 1;
    return run;
  }, party, 'geosgaeno');
  void steps;
  return { outcome: flat(outcome), inputs, area: lastArea, shattered };
}

export interface Rate {
  seeds: number;
  wins: number;
  losses: number;
  unfinished: number;
  /** Average members shattered per fight. */
  shatterAvg: number;
}

export const share = (r: Rate): number => r.wins / Math.max(1, r.seeds);

function tally(results: FightResult[]): Rate {
  return {
    seeds: results.length,
    wins: results.filter((r) => r.outcome === 'victory').length,
    losses: results.filter((r) => r.outcome === 'defeat').length,
    unfinished: results.filter((r) => r.outcome === 'unfinished').length,
    shatterAvg: results.reduce((a, r) => a + r.shattered, 0) / Math.max(1, results.length),
  };
}

export function geosgaenoRate(seeds: number, line: Line, party: FFXPartyBuild = swimmersBuild, firstSeed = 1): Rate {
  const out: FightResult[] = [];
  for (let seed = firstSeed; seed < firstSeed + seeds; seed++) out.push(playGeosgaeno(seed, line, party));
  return tally(out);
}

export async function evraeRate(seeds: number, line: Line, party: FFXPartyBuild = swimmersBuild, firstSeed = 1): Promise<Rate> {
  const out: FightResult[] = [];
  for (let seed = firstSeed; seed < firstSeed + seeds; seed++) out.push(await playEvrae(seed, line, party));
  return tally(out);
}

/** The party with the bag changed: `kit` false removes the preflight's kit (the Highbridge bag as it was, 12 Phoenix Downs). */
export function withBag(party: FFXPartyBuild, kit: boolean): FFXPartyBuild {
  if (kit) return party;
  const out = structuredClone(party);
  const drop = new Set(['fire-gem', 'ice-gem', 'lightning-gem', 'water-gem', 'poison-fang', 'x-potion']);
  out.inventory = out.inventory.filter((e) => !drop.has(e.itemId)).map((e) => (e.itemId === 'phoenix-down' ? { ...e, count: 12 } : e));
  return out;
}

export { setup };
export type { LinkKey };
