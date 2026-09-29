/**
 * The two bench policies for Chapter XVIII (`sin-face`) link 4 (Overdrive Sin), and what the
 * bench reads off a finished battle. **FFX only.** Test-only.
 *
 * - **sensible** — research §8 row 8 `[verified: 4 sources]`: "Hastega and
 *   Focus/Cheer during the three pulls, Wakka and Lulu firing; Armor Break the
 *   moment it is in range; Overdrives … to finish", plus the ordinary upkeep a
 *   player does (Soft a Petrify, Remedy a Confuse, Phoenix Down a KO, a potion
 *   under 35 %). Opening line Tidus / Yuna / Auron (the preset's): Tidus Hastes,
 *   Yuna and Auron make way for Lulu and Wakka while the ship is FAR, and Auron
 *   comes back for Armor Break (then Mental Break) once Sin is in reach. Aeons
 *   are **not** used: the preset's aeon gauges are not full, so their Overdrives
 *   are out of reach without a line this bench does not model (said in the plan).
 * - **naive** — the "credibly wrong" line: the opening three stay, everyone
 *   swings Attack when it reaches and Defends when it does not, Overdrives when
 *   full, Yuna casts Curaga under 40 %, a Phoenix Down on a KO. No Haste, no
 *   Breaks, no swaps, no status care.
 *
 * Human pace equals bench speed here: FFX is CTB, the clock moves only on
 * turns, so a slow player faces the same fight (the house rule, stated in
 * `docs/plans/yojimbo-faithfulness-2026-09-26.md` §3).
 */

import type { AvailableCommand, BattleEngine, BattleEvent, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { type Input, SIN, actor, atSin, defend, enabledRow, flag, row } from './sinUnits.ts';

export type Policy = 'sensible' | 'naive';

const has = (c: FFXCombatant | undefined, s: string): boolean => c?.statuses?.[s as keyof FFXCombatant['statuses']] !== undefined;
const alive = (c: FFXCombatant | undefined): boolean => !!c && c.hp > 0 && !has(c, 'ko');

function actives(engine: BattleEngine): FFXCombatant[] {
  return engine.state().activeIds.map((id) => actor(engine, id)).filter((c): c is FFXCombatant => !!c);
}

function reserve(engine: BattleEngine): string[] {
  return [...engine.state().reserveIds];
}

function item(d: Input, id: string, target: string): Command | null {
  const r = enabledRow(d.commands, 'item', id);
  return r && r.validTargets.includes(target) ? { kind: 'item', id, targets: [target] } : null;
}

function ability(d: Input, id: string, target: string): Command | null {
  const r = enabledRow(d.commands, 'ability', id);
  return r && r.validTargets.includes(target) ? { kind: 'ability', id, targets: [target] } : null;
}

function switchTo(d: Input, inId: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command as { extra: { inId: string } }).extra.inId === inId);
  return r ? ({ ...r.command, extra: { outId: d.actorId, inId } } as Command) : null;
}

function overdrive(d: Input): Command | null {
  const r: AvailableCommand | undefined = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(SIN));
  return r ? ({ ...r.command, targets: [SIN] } as Command) : null;
}

/** Soft a Petrify, Remedy a Confuse, Phoenix Down a KO, then a potion under 35 % (Holy Water first on a Zombie). */
function upkeep(engine: BattleEngine, d: Input): Command | null {
  for (const c of actives(engine)) {
    if (c.id === d.actorId) continue;
    if (has(c, 'petrify')) return item(d, 'soft', c.id) ?? item(d, 'remedy', c.id);
    if (has(c, 'confuse')) return item(d, 'remedy', c.id);
    if (!alive(c)) return item(d, 'phoenix-down', c.id) ?? item(d, 'mega-phoenix', c.id);
  }
  for (const c of actives(engine)) {
    if (!alive(c) || c.hp >= c.stats.maxHp * 0.35) continue;
    if (has(c, 'zombie')) return item(d, 'holy-water', c.id);
    return item(d, 'x-potion', c.id) ?? item(d, 'hi-potion', c.id);
  }
  return null;
}

function sensible(engine: BattleEngine, d: Input): Command {
  const me = d.actorId;
  const far = flag(engine, 'airship.range') === 'far';
  const sin = actor(engine, SIN);
  const bench = reserve(engine);
  if (engine.state().aeonId === me) return overdrive(d) ?? atSin(row(d.commands, 'attack')) ?? defend();

  const fix = upkeep(engine, d);
  if (fix) return fix;

  const unhasted = actives(engine).filter((c) => alive(c) && !has(c, 'haste'));
  if (unhasted.length >= 2 && enabledRow(d.commands, 'ability', 'hastega')) return { kind: 'ability', id: 'hastega', targets: [me] };
  if (unhasted.length === 1 && enabledRow(d.commands, 'ability', 'haste')) return ability(d, 'haste', unhasted[0]!.id) ?? defend();

  const od = overdrive(d);
  if (od) return od;

  // Lulu out of Firaga MP drinks an Ether (100 MP), then a Turbo Ether.
  if (me === 'lulu' && actor(engine, me).mp < 16) {
    const mp = item(d, 'ether', me) ?? item(d, 'turbo-ether', me);
    if (mp) return mp;
  }

  if (far) {
    if (me === 'tidus') {
      const cheer = actives(engine).some((c) => (c.statuses['cheer']?.stacks ?? 0) < 5);
      return cheer && enabledRow(d.commands, 'ability', 'cheer') ? { kind: 'ability', id: 'cheer', targets: [me] } : defend();
    }
    if (me === 'wakka') return atSin(row(d.commands, 'attack')) ?? defend();
    if (me === 'lulu') return ability(d, 'firaga', SIN) ?? ability(d, 'fira', SIN) ?? defend();
    for (const next of ['wakka', 'lulu']) if (bench.includes(next)) return switchTo(d, next) ?? defend();
    return defend();
  }

  // In reach. Auron comes back for the Breaks; whoever else stands is the damage.
  const broken = has(sin, 'armor-break');
  if (!broken && me !== 'auron' && bench.includes('auron') && (me === 'tidus' || me === 'yuna')) return switchTo(d, 'auron') ?? defend();
  if (me === 'auron') {
    if (!broken) return ability(d, 'armor-break', SIN) ?? defend();
    if (!has(sin, 'mental-break') && actives(engine).some((c) => c.id === 'lulu')) return ability(d, 'mental-break', SIN) ?? atSin(row(d.commands, 'attack')) ?? defend();
  }
  if (me === 'lulu') return ability(d, 'firaga', SIN) ?? atSin(row(d.commands, 'attack')) ?? defend();
  if (me === 'yuna') {
    for (const next of ['auron', 'wakka', 'lulu']) if (bench.includes(next)) return switchTo(d, next) ?? defend();
  }
  return atSin(row(d.commands, 'attack')) ?? defend();
}

function naive(engine: BattleEngine, d: Input): Command {
  const me = d.actorId;
  if (engine.state().aeonId === me) return overdrive(d) ?? atSin(row(d.commands, 'attack')) ?? defend();
  for (const c of actives(engine)) if (!alive(c)) return item(d, 'phoenix-down', c.id) ?? defend();
  if (me === 'yuna' && actives(engine).some((c) => alive(c) && c.hp < c.stats.maxHp * 0.4) && enabledRow(d.commands, 'ability', 'curaga')) {
    return { kind: 'ability', id: 'curaga', targets: [me] };
  }
  return overdrive(d) ?? atSin(row(d.commands, 'attack')) ?? defend();
}

export function choose(policy: Policy, engine: BattleEngine, d: Input): Command {
  return policy === 'sensible' ? sensible(engine, d) : naive(engine, d);
}

// ---------------------------------------------------------------------------
// What the bench reads off a finished battle
// ---------------------------------------------------------------------------

export interface Reading {
  outcome: string;
  /** The engine's turn counter (every actor's turn). */
  turns: number;
  /** Sin's own turns (the clock). */
  sinTurns: number;
  /** The battle ended on Giga-Graviton's scripted Game Over. */
  gigaGraviton: boolean;
  sinHpLeft: number;
  gazes: number;
  /** Damage each Overdrive dealt to Sin, in order. */
  overdrives: Array<{ who: string; id: string; damage: number }>;
  /** Player-side damage to Sin while the ship was FAR (the three pulls). */
  farDamage: number;
}

export function read(engine: BattleEngine): Reading {
  const s = engine.state();
  const log: readonly BattleEvent[] = s.log;
  const overdrives: Reading['overdrives'] = [];
  let current: { who: string; id: string; damage: number } | null = null;
  let pulls = 0; // the ship is FAR until Sin's third pull starts (the AI flips the range at decision time)
  let farDamage = 0;
  for (const e of log) {
    if (e.type === 'turn-start') {
      current = null;
    } else if (e.type === 'action-start') {
      current = null;
      if (e.actorId === SIN && e.command.kind === 'ability' && e.command.id === 'overdrive-sin-drawn') pulls++;
      if (e.command.kind === 'overdrive' && e.actorId !== SIN) {
        current = { who: e.actorId, id: e.command.id, damage: 0 };
        overdrives.push(current);
      }
    } else if (e.type === 'damage' && e.targetId === SIN && e.amount > 0) {
      if (current) current.damage += e.amount;
      if (pulls < 3) farDamage += e.amount;
    }
  }
  const gazes = log.filter((e) => e.type === 'counter' && e.actorId === SIN).length;
  return {
    outcome: s.result?.outcome ?? 'unfinished',
    turns: s.turn,
    sinTurns: typeof s.flags['sin.turn'] === 'number' ? (s.flags['sin.turn'] as number) : 0,
    gigaGraviton: s.flags['battle.scriptedGameOver'] === true && s.result?.outcome === 'defeat',
    sinHpLeft: Math.max(0, (s.combatants[SIN] as FFXCombatant).hp),
    gazes,
    overdrives,
    farDamage,
  };
}

/** One seeded battle under a policy. */
export function play(engine: BattleEngine, policy: Policy, drive: (e: BattleEngine, c: (d: Input) => Command) => void): Reading {
  drive(engine, (d) => choose(policy, engine, d));
  return read(engine);
}
