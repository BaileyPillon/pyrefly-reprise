/**
 * A scripted player for the hidden Spherimorph chapter (FFX only): plays the real engine to an outcome with no god mode, so the fight's winnability is MEASURED and not assumed (the preflight's section 8; the Dark
 * Aeons and Sanctuary Keeper benches' method). Test-only. It reads what a player reads (the menu's rows, the statuses on the icons, the HP bars, the spell the boss answers with) and **never the script's hidden state**:
 * the weakness is found the way a player finds it, from the battle's log.
 *
 * A **line** is a plan on a common skeleton. The skeleton stands a fallen member up (Phoenix Down) and heals the hurt (Cura, or an item); what is left goes into the line's own plan. The lines:
 *
 * - **careless**: everyone Attacks (what a player does who has not read the guides). Lulu swings her staff.
 * - **blind**: the skeleton's care, Tidus Attacks, Lulu casts the highest tier of an element drawn at random every turn (no clue read): the player who guesses.
 * - **advisor**: the shipped tactic (`src/engine/tactics/spherimorph.ts`): probe with a plain blow, read the answer, cast its opposite, probe again after every hit that lands.
 * - **ablations** of the advisor: **no-reprobe** reads the clue once and trusts it for the whole fight (the shift makes it stale), **no-care** (nobody heals or stands up), **no-protect** (Yuna never casts Protect).
 *
 * The line-up is a parameter (the preflight's SP2: Tidus, Yuna, Lulu, or Tidus, Auron, Lulu).
 */

import type { AvailableCommand, BattleEngine, BattleEvent, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { spherimorph as shippedTactic, clueOf } from '../../../src/engine/tactics/spherimorph.ts';
import { spherimorphBuild } from '../../../src/data/ffx/builds/spherimorph.ts';
import { SM, actor, defend, newEngine, row, type Input } from './spherimorphDrive.ts';

export interface Line {
  readonly name: string;
  readonly kind: 'careless' | 'blind' | 'advisor';
  readonly care: boolean;
  readonly protect: boolean;
  readonly reprobe: boolean;
}

export const LINES: Readonly<Record<string, Line>> = {
  careless: { name: 'careless', kind: 'careless', care: false, protect: false, reprobe: true },
  blind: { name: 'blind', kind: 'blind', care: true, protect: false, reprobe: true },
  advisor: { name: 'advisor', kind: 'advisor', care: true, protect: true, reprobe: true },
  'no-reprobe': { name: 'no-reprobe', kind: 'advisor', care: true, protect: true, reprobe: false },
  'no-care': { name: 'no-care', kind: 'advisor', care: false, protect: true, reprobe: true },
  'no-protect': { name: 'no-protect', kind: 'advisor', care: true, protect: false, reprobe: true },
};

/** A build with another front line (the bench is the other four of the seven, in the preset's order). */
export function buildWith(front: readonly [string, string, string]): FFXPartyBuild {
  const seven = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'];
  return { ...spherimorphBuild, activeSlots: [...front], reserve: seven.filter((id) => !front.includes(id)) };
}

export type Outcome = 'victory' | 'defeat' | 'stalled';

export interface Run {
  readonly line: string;
  readonly seed: number;
  readonly outcome: Outcome;
  readonly decisions: number;
  readonly ticks: number;
  /** Spherimorph's HP when the run ended. */
  readonly hp: number;
  /** The fewest HP it reached (the best the party did). */
  readonly lowestHp: number;
  /** How many times its weakness shifted. */
  readonly shifts: number;
  readonly koCount: number;
  /** Spells the party cast that it took in (healed it). */
  readonly absorbed: number;
}

const front = (engine: BattleEngine): FFXCombatant[] => engine.state().activeIds.map((id) => actor(engine, id));
const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0;
const HEAL_ITEMS = ['mega-potion', 'x-potion', 'hi-potion'] as const;

/** The skeleton: stand a fallen member up, heal the hurt (Yuna's Cura, or a potion). */
function care(d: Input, party: readonly FFXCombatant[]): Command | null {
  const down = party.find((c) => !alive(c));
  if (down) return row(d, 'item', 'phoenix-down', down.id);
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * 0.55).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp);
  const worst = hurt[0];
  if (worst === undefined) return null;
  const group = hurt.length >= 2 ? row(d, 'ability', 'cura', worst.id) : null;
  return group ?? row(d, 'ability', 'cure', worst.id) ?? row(d, 'ability', 'cura', worst.id) ?? HEAL_ITEMS.map((i) => row(d, 'item', i, worst.id)).find((c) => c !== null) ?? null;
}

/** A small seeded generator for the blind line (mulberry32), so a run replays. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TIERS: readonly (readonly string[])[] = [['fira', 'fire'], ['blizzara', 'blizzard'], ['thundara', 'thunder'], ['watera', 'water']];

function decide(engine: BattleEngine, d: Input, line: Line, rand: () => number, memo: { clue: unknown }): Command {
  const me = d.actorId;
  const swing = row(d, 'attack', undefined, SM);
  const fallback = (): Command => swing ?? defend();
  if (line.kind === 'careless') return fallback();

  const party = front(engine).filter(alive);
  if (line.care) {
    const tended = care(d, party);
    if (tended) return tended;
  }
  if (line.kind === 'blind') {
    if (me === 'lulu') {
      const pick = TIERS[Math.floor(rand() * TIERS.length)]!;
      for (const id of pick) {
        const cast = row(d, 'ability', id, SM);
        if (cast) return cast;
      }
    }
    if (me === 'tidus' || me === 'auron') return fallback();
    return defend();
  }

  // advisor and its ablations: the shipped tactic, with the piece removed where the ablation says.
  const log = engine.state().log as readonly BattleEvent[];
  let proxy: BattleEngine = engine;
  if (!line.reprobe) {
    // read the first clue once and trust it for ever: hand the tactic a log that ends at the first answer it ever saw
    const first = memo.clue as readonly BattleEvent[] | null;
    if (first === null && clueOf(log) !== null) memo.clue = [...log];
    if (memo.clue !== null) proxy = { ...engine, state: () => ({ ...engine.state(), log: memo.clue as BattleEvent[] }) } as unknown as BattleEngine;
  }
  const commands: AvailableCommand[] = d.commands.filter((c) => !(!line.protect && c.command.kind === 'ability' && c.command.id === 'protect'));
  const pick = shippedTactic(me, commands, proxy);
  if (pick) return pick;
  // no opinion: Tidus, Auron, Wakka, Kimahri and Rikku swing (the generic ladder), the casters wait
  if (me === 'tidus' || me === 'auron' || me === 'wakka' || me === 'kimahri' || me === 'rikku') return fallback();
  return defend();
}

/** Play one fight to an outcome. */
export function play(seed: number, lineName: string, frontLine: readonly [string, string, string] = ['tidus', 'yuna', 'lulu'], maxDecisions = 4_000): Run {
  const line = LINES[lineName];
  if (!line) throw new Error(`no line ${lineName}`);
  const engine = newEngine(seed, buildWith(frontLine));
  const rand = rng(seed * 7919 + 13);
  const memo: { clue: unknown } = { clue: null };
  let decisions = 0;
  let lowest = Number.POSITIVE_INFINITY;
  let outcome: Outcome = 'stalled';
  let ticks = 0;
  let koCount = 0;
  for (let i = 0; i < maxDecisions; i++) {
    const dec = engine.nextDecision();
    if (dec.kind === 'battle-over') {
      outcome = dec.result.outcome === 'victory' ? 'victory' : dec.result.outcome === 'defeat' ? 'defeat' : 'stalled';
      ticks = dec.result.elapsedTicks;
      break;
    }
    if (dec.kind !== 'player-input') continue;
    decisions++;
    const s = actor(engine, SM);
    lowest = Math.min(lowest, s.hp);
    engine.submit(decide(engine, dec, line, rand, memo));
  }
  const log = engine.state().log as readonly BattleEvent[];
  koCount = log.filter((e) => e.type === 'ko').length;
  const absorbed = log.filter((e) => e.type === 'damage' && e.targetId === SM && e.amount < 0 && e.sourceId !== SM).length;
  return { line: lineName, seed, outcome, decisions, ticks, hp: actor(engine, SM).hp, lowestHp: Math.min(lowest, actor(engine, SM).hp), shifts: Number(engine.state().flags['sm.shifts'] ?? 0), koCount, absorbed };
}

/** Wins, as a count, over `seeds` (1-based, `from` up). */
export function wins(lineName: string, frontLine: readonly [string, string, string], seeds: number, from = 1): { won: number; runs: Run[] } {
  const runs: Run[] = [];
  for (let seed = from; seed < from + seeds; seed++) runs.push(play(seed, lineName, frontLine));
  return { won: runs.filter((r) => r.outcome === 'victory').length, runs };
}
