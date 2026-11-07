/**
 * A scripted player for the hidden Shinryu chapter (FFX only): plays the real engine to an outcome with **no god mode**, so the fight's winnability is MEASURED and not assumed (the preflight's section 8; the Penance and
 * Sanctuary Keeper benches' method). Test-only. It reads what a player reads (the menu's rows, the statuses on the icons, the HP bars) and never the script's draw.
 *
 * A **line** is a few switches on a common skeleton; the skeleton's priorities are fixed: stand a fallen member up (Phoenix Down; a shattered member cannot be raised, he is off the field), heal the hurt (an X-Potion
 * under half), and what is left goes to the line's offense. The lines:
 *
 * - **careless**: Attack Shinryu with everyone; heal nobody, raise nobody.
 * - **attack**: the skeleton and a plain Attack with the Celestial weapon (the guide's whole advice: "properly leveled characters with their strongest weapons", then "defeat Shinryu quickly", Jegged).
 * - **guide**: the same with **Tidus's Quick Hit** for every blow of his (the faster command: the way the Penance guides play him); the shipped line, `engine/tactics/shinryu.ts` is this line moved into the game.
 * Not tried (named): Overdrives (the gauges start at 40 and 35 and are not full inside a 25-tick fight; Rikku's Mix needs a recipe no source gives for this fight), Hastega, Wakka's Reels, Tidus's Cheer.
 */

import type { BattleEngine, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { shinryuBuild } from '../../../src/data/ffx/builds/shinryu.ts';
import { SHINRYU, actor, defend, flags, has, log, newEngine, row, type Input } from './shinryuDrive.ts';

export interface Line {
  readonly name: string;
  /** Attack and do nothing else. */
  readonly careless?: boolean;
  /** The skeleton's care: raise the fallen, heal the hurt. */
  readonly care: boolean;
  /** Tidus's Quick Hit in place of his Attack. */
  readonly quickHit: boolean;
}

export const LINES: Readonly<Record<string, Line>> = {
  careless: { name: 'careless', careless: true, care: false, quickHit: false },
  attack: { name: 'attack', care: true, quickHit: false },
  guide: { name: 'guide', care: true, quickHit: true },
};

export type Outcome = 'victory' | 'defeat' | 'stalled';

export interface Run {
  readonly line: string;
  readonly seed: number;
  readonly outcome: Outcome;
  readonly decisions: number;
  readonly ticks: number;
  /** Shinryu's HP when the run ended. */
  readonly hp: number;
  /** Erasers Shinryu used in the battle (counters are Attacks, not Erasers). */
  readonly erasers: number;
  /** Party members shattered (Petrify in the water). */
  readonly shattered: number;
  /** Shinryu's own turns (its Shining, Eraser and Attack that were not counters). */
  readonly turns: number;
  /** Shinryu's counters: one Attack for each blow that took HP from it and did not kill it. */
  readonly answers: number;
  /** The party's own counterattacks on Shinryu (the Celestial weapons' Evade & Counter answering its Attack): blows the player never ordered. */
  readonly partyCounters: number;
}

const front = (engine: BattleEngine): FFXCombatant[] => engine.state().activeIds.map((id) => actor(engine, id));
const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;
const HEAL_ITEMS = ['x-potion', 'mega-potion', 'hi-potion'] as const;
/** A member needs a heal when the next ordinary blow plus a Shining could take him low: under half his maximum. */
const HEAL_UNDER = 0.5;

/** Skeleton step: stand a fallen member up (a shattered one is gone), heal the hurt. */
function care(d: Input, party: readonly FFXCombatant[]): Command | null {
  const fallen = party.find((c) => !c.alive && !c.removed);
  if (fallen) {
    const pd = row(d, 'item', 'phoenix-down', fallen.id);
    if (pd) return pd;
  }
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * HEAL_UNDER).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) {
    for (const item of HEAL_ITEMS) {
      const it = row(d, 'item', item, hurt.id);
      if (it) return it;
    }
  }
  return null;
}

/** One command for `d`, by the line. */
export function choose(engine: BattleEngine, d: Input, line: Line): Command {
  const strike = row(d, 'attack', undefined, SHINRYU) ?? defend();
  if (line.careless) return strike;
  const tended = line.care ? care(d, front(engine)) : null;
  if (tended) return tended;
  if (line.quickHit && d.actorId === 'tidus') return row(d, 'ability', 'quick-hit', SHINRYU) ?? strike;
  return strike;
}

/** Play one battle with `line`, no god mode, to an outcome (or a stall). */
export function play(seed: number, line: Line, party: FFXPartyBuild = shinryuBuild, maxDecisions = 600): Run {
  const engine = newEngine(seed, party);
  let decisions = 0;
  let outcome: Outcome = 'stalled';
  for (let i = 0; i < maxDecisions * 8 && decisions < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome === 'victory' ? 'victory' : 'defeat';
      break;
    }
    if (d.kind !== 'player-input') continue;
    decisions++;
    engine.submit(choose(engine, d, line));
  }
  const events = log(engine);
  const answers = events.filter((e) => e.type === 'counter' && e.actorId === SHINRYU).length;
  const partyCounters = events.filter((e) => e.type === 'counter' && e.actorId !== SHINRYU).length;
  const starts = events.filter((e) => e.type === 'action-start' && e.actorId === SHINRYU);
  return {
    line: line.name,
    seed,
    outcome,
    decisions,
    ticks: engine.state().ticks,
    hp: actor(engine, SHINRYU).hp,
    erasers: starts.filter((e) => e.type === 'action-start' && e.abilityId === 'shinryu-eraser').length,
    shattered: events.filter((e) => e.type === 'message' && / shatters$/.test(e.text)).length,
    turns: starts.length - answers,
    answers,
    partyCounters,
  };
}

export const flagOf = (engine: BattleEngine, key: string): number => {
  const v = flags(engine)[key];
  return typeof v === 'number' ? v : 0;
};

/** The party with the Celestial weapons taken off: the plain weapon each member started with, Break Damage Limit kept (the bench's what-if; the same 99,999 cap, no Celestial HP formula). */
export function withPlainWeapons(party: FFXPartyBuild): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) {
    const { weaponRow: _ignored, ...rest } = m.equipment.weapon;
    m.equipment.weapon = { ...rest, autoAbilities: ['break-damage-limit'] };
  }
  return out;
}

/** The party without Auto-Haste on any armour (the bench's what-if: the swimmers act at the plain speed). */
export function withoutAutoHaste(party: FFXPartyBuild): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.equipment.armor = { ...m.equipment.armor, autoAbilities: m.equipment.armor.autoAbilities.filter((a) => a !== 'auto-haste') };
  return out;
}

/** The share of `runs` that are victories, as a percentage with one decimal. */
export function winRate(runs: readonly Run[]): number {
  return runs.length === 0 ? 0 : Math.round((runs.filter((r) => r.outcome === 'victory').length / runs.length) * 1000) / 10;
}

/** `play` over seeds `first` to `first + seeds - 1`. */
export function bench(line: Line, seeds: number, party: FFXPartyBuild = shinryuBuild, first = 1): Run[] {
  const runs: Run[] = [];
  for (let s = first; s < first + seeds; s++) runs.push(play(s, line, party));
  return runs;
}

/** True when a member carries the status (re-exported for the tests). */
export { has };
