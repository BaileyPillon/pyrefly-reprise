/**
 * A scripted player for the hidden Sanctuary Keeper chapter (FFX only): plays the real engine to an outcome with no god mode, so the fight's winnability is MEASURED and not assumed (the preflight's section 8; the Dark Aeons
 * bench's method, `docs/plans/ch-dark-aeons-review.md`). Test-only. It reads what a player reads (the menu's rows, the statuses on the icons, the HP bars) and never the hidden counter or the cycle.
 *
 * A **line** is a few switches on a common skeleton. The skeleton's priorities are fixed: stand a fallen member up (Phoenix Down), cure what stops a person acting (Echo Screen for Silence, Esuna for Confuse, Darkness and
 * Sleep), heal the hurt (Curaga, or an item when Yuna cannot), and what is left goes into the line's own plan. The lines:
 *
 * - **careless**: Attack the Keeper with everyone; heal nobody, cure nothing (what a player does who has not read the guides).
 * - **plain**: the skeleton and Attack, no plan.
 * - **advisor**: the guides' play: Tidus casts Hastega (again after a sweep strips it), Yuna puts Reflect on the Keeper first and Shell on each member, Lulu (or Tidus's Poison Fang) keeps it poisoned, Auron (when in front)
 *   breaks its Armor, and Yuna Dispels a Reflect a party member holds once the Keeper is under half (so its Reflect trick has nothing to bounce off).
 * - **ablations**: the advisor with one piece removed (**no-reflect**, **no-poison**, **no-shell**, **no-haste**, **no-dispel**), to see which pieces move the result.
 *
 * The line-up is a parameter (the preflight's SK2: Tidus, Yuna, Lulu, or Tidus, Yuna, Auron).
 */

import type { BattleEngine, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { sanctuaryKeeperBuild } from '../../../src/data/ffx/builds/sanctuary-keeper.ts';
import { KEEPER, actor, defend, flags, has, keeper, newEngine, row, type Input } from './sanctuaryDrive.ts';

export interface Line {
  readonly name: string;
  /** Attack the Keeper and do nothing else. */
  readonly careless?: boolean;
  /** The skeleton's care: raise the fallen, cure, heal. */
  readonly care: boolean;
  readonly haste: boolean;
  readonly shell: boolean;
  readonly reflect: boolean;
  readonly poison: boolean;
  readonly breaks: boolean;
  readonly dispel: boolean;
}

const FULL: Line = { name: 'advisor', care: true, haste: true, shell: true, reflect: true, poison: true, breaks: true, dispel: true };

export const LINES: Readonly<Record<string, Line>> = {
  careless: { name: 'careless', careless: true, care: false, haste: false, shell: false, reflect: false, poison: false, breaks: false, dispel: false },
  plain: { name: 'plain', care: true, haste: false, shell: false, reflect: false, poison: false, breaks: false, dispel: false },
  advisor: FULL,
  'no-reflect': { ...FULL, name: 'no-reflect', reflect: false, dispel: false },
  'no-poison': { ...FULL, name: 'no-poison', poison: false },
  'no-shell': { ...FULL, name: 'no-shell', shell: false },
  'no-haste': { ...FULL, name: 'no-haste', haste: false },
  'no-dispel': { ...FULL, name: 'no-dispel', dispel: false },
};

/** A build with another front line (the bench is the other four of the seven, in the preset's order). */
export function buildWith(front: readonly [string, string, string]): FFXPartyBuild {
  const seven = ['tidus', 'yuna', 'kimahri', 'auron', 'wakka', 'lulu', 'rikku'];
  return { ...sanctuaryKeeperBuild, activeSlots: [...front], reserve: seven.filter((id) => !front.includes(id)) };
}

export type Outcome = 'victory' | 'defeat' | 'stalled';

export interface Run {
  readonly line: string;
  readonly seed: number;
  readonly outcome: Outcome;
  readonly decisions: number;
  readonly ticks: number;
  /** The Keeper's HP when the run ended. */
  readonly hp: number;
  /** The most damage taken off it before it was healed back: the best its HP got to (the lowest value reached). */
  readonly lowestHp: number;
  readonly sweeps: number;
  readonly koCount: number;
}

const front = (engine: BattleEngine): FFXCombatant[] => engine.state().activeIds.map((id) => actor(engine, id));
const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0;
const HEAL_ITEMS = ['mega-potion', 'x-potion', 'hi-potion'] as const;

/** A member needs a heal when the next ordinary blow could be the last: under 70 percent of his maximum. */
function needsHeal(c: FFXCombatant): boolean {
  return alive(c) && c.hp < c.stats.maxHp * 0.7;
}

/** Skeleton step: stand a fallen member up, cure what stops a person acting, heal the hurt. `me` is the actor whose turn it is. */
function care(d: Input, party: readonly FFXCombatant[]): Command | null {
  const me = d.actorId;
  const down = party.find((c) => !alive(c));
  if (down) return row(d, 'item', 'phoenix-down', down.id);
  for (const c of party) {
    if (has(c, 'silence') && c.id === 'yuna') {
      const cure = row(d, 'item', 'echo-screen', c.id);
      if (cure) return cure;
    }
  }
  const meFighter = party.find((c) => c.id === me);
  const canCast = meFighter !== undefined && !has(meFighter, 'silence');
  for (const c of party) {
    if (!alive(c)) continue;
    if (has(c, 'confuse') || has(c, 'darkness') || has(c, 'silence')) {
      const cure = (canCast && row(d, 'ability', 'esuna', c.id)) || row(d, 'item', has(c, 'silence') ? 'echo-screen' : has(c, 'darkness') ? 'eye-drops' : 'remedy', c.id);
      if (cure) return cure;
    }
  }
  const hurt = party.filter(needsHeal).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) {
    const heal = (canCast && row(d, 'ability', 'curaga', hurt.id)) || HEAL_ITEMS.map((i) => row(d, 'item', i, hurt.id)).find((c) => c !== null) || null;
    if (heal) return heal;
  }
  return null;
}

/** The line's plan for this actor, or null to fall through to an Attack. */
function plan(engine: BattleEngine, d: Input, line: Line): Command | null {
  const me = d.actorId;
  const k = keeper(engine);
  const party = front(engine).filter(alive);
  const half = k.hp < k.stats.maxHp / 2;
  const canCast = !has(actor(engine, me), 'silence');

  if (me === 'tidus') {
    if (line.haste && canCast && party.filter((c) => !has(c, 'haste')).length >= 2) {
      const cast = row(d, 'ability', 'hastega', 'tidus');
      if (cast) return cast;
    }
    if (line.poison && !party.some((c) => c.id === 'lulu') && !has(k, 'poison')) return row(d, 'item', 'poison-fang', KEEPER);
  }
  if (me === 'yuna' && canCast) {
    // Reflect comes AFTER the poison: a reflected Bio bounces back on its caster (the target builder sends a spell at a Reflect holder back to the user), so the order is Bio, then Reflect.
    const poisoner = party.some((c) => c.id === 'lulu' && !has(c, 'silence')) || party.some((c) => c.id === 'tidus');
    if (line.reflect && !has(k, 'reflect') && (!line.poison || has(k, 'poison') || !poisoner)) {
      const cast = row(d, 'ability', 'reflect', KEEPER);
      if (cast) return cast;
    }
    if (line.dispel && half && has(k, 'reflect')) {
      const holder = party.find((c) => has(c, 'reflect'));
      if (holder) {
        const cast = row(d, 'ability', 'dispel', holder.id);
        if (cast) return cast;
      }
    }
    if (line.shell) {
      const bare = party.find((c) => !has(c, 'shell'));
      if (bare) {
        const cast = row(d, 'ability', 'shell', bare.id);
        if (cast) return cast;
      }
      const open = party.find((c) => !has(c, 'protect'));
      if (open) {
        const cast = row(d, 'ability', 'protect', open.id);
        if (cast) return cast;
      }
    }
  }
  if (me === 'lulu' && canCast && line.poison && !has(k, 'poison')) return row(d, 'ability', 'bio', KEEPER);
  if (me === 'auron' && line.breaks && !has(k, 'armor-break')) return row(d, 'ability', 'armor-break', KEEPER);
  return null;
}

/** One command for `d`, by the line. */
export function choose(engine: BattleEngine, d: Input, line: Line): Command {
  const strike = row(d, 'attack', undefined, KEEPER) ?? defend();
  if (line.careless) return strike;
  const tended = line.care ? care(d, front(engine)) : null;
  if (tended) return tended;
  return plan(engine, d, line) ?? strike;
}

/** Play one battle with `line`, no god mode, to an outcome (or a stall). */
export function play(seed: number, line: Line, party: FFXPartyBuild = sanctuaryKeeperBuild, maxDecisions = 1500): Run {
  const engine = newEngine(seed, party);
  let decisions = 0;
  let lowest = keeper(engine).hp;
  let outcome: Outcome = 'stalled';
  for (let i = 0; i < maxDecisions * 8 && decisions < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome === 'victory' ? 'victory' : 'defeat';
      break;
    }
    if (d.kind !== 'player-input') continue;
    decisions++;
    lowest = Math.min(lowest, keeper(engine).hp);
    engine.submit(choose(engine, d, line));
  }
  const state = engine.state();
  const events = state.log as ReadonlyArray<{ type: string; actorId?: string; abilityId?: string; status?: string; targetId?: string }>;
  const sweeps = events.filter((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'sanctuary-tail-sweep').length;
  const koCount = events.filter((e) => e.type === 'ko' && e.targetId !== KEEPER).length;
  return { line: line.name, seed, outcome, decisions, ticks: state.ticks, hp: keeper(engine).hp, lowestHp: lowest, sweeps, koCount };
}

export const flagOf = (engine: BattleEngine, key: string): number => {
  const v = flags(engine)[key];
  return typeof v === 'number' ? v : 0;
};

/** The party with every member's Luck set (a lever the bench measures; no boss number moves). */
export function withLuck(party: FFXPartyBuild, luck: number): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.stats = { ...m.stats, luck };
  return out;
}

/** The party with the bag's counts of some items set (the bench's other lever). */
export function withBag(party: FFXPartyBuild, counts: Readonly<Record<string, number>>): FFXPartyBuild {
  const out = structuredClone(party);
  const bag = new Map(out.inventory.map((e) => [e.itemId, e.count] as const));
  for (const [id, n] of Object.entries(counts)) bag.set(id, n);
  out.inventory = [...bag.entries()].map(([itemId, count]) => ({ itemId, count }));
  return out;
}

/** The share of `runs` that are victories, as a percentage with one decimal. */
export function winRate(runs: readonly Run[]): number {
  return runs.length === 0 ? 0 : Math.round((runs.filter((r) => r.outcome === 'victory').length / runs.length) * 1000) / 10;
}

/** `play` over seeds 1 to `seeds`. */
export function bench(line: Line, seeds: number, party: FFXPartyBuild = sanctuaryKeeperBuild, first = 1): Run[] {
  const runs: Run[] = [];
  for (let s = first; s < first + seeds; s++) runs.push(play(s, line, party));
  return runs;
}
