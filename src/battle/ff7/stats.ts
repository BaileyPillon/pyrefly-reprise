/**
 * FF7 derived stats from base stats + equipment + Materia [core §1.1, §8.3].
 *
 * Pure functions, integer arithmetic in the order the research gives (FF7 is an
 * integer engine: `[x]` is truncation, core §1.1). Game case: **FF7 only.**
 *
 * ```
 * Att = Str + weapon Attack        At% = weapon Attack%
 * Def = Vit + armour Defense       Df% = [Dex / 4] + armour Defense%
 * MAt = Mag                        MDf = Spr   (armour MDefense NOT added: the kept bug)
 * MD% = armour MDefense%
 * ```
 *
 * Equipment and Materia bonuses to primary stats flow into the derived stats
 * [core §1.1, single source: Fergusson BM §1.1]. Materia HP and MP percentages
 * are summed and applied once, truncated toward zero: Cloud's two magic Materia
 * give `55 + [55 * 4 / 100] = 57` MP and `329 - [329 * 4 / 100] = 316` HP
 * [core §8.5, gs §8.4, derived].
 */

import type { Ff7BaseStats, Ff7DerivedStats, Ff7EquipmentDef, Ff7MemberBuild, MateriaInstance } from '../common/types-ff7.ts';
import type { Ff7MateriaDef } from './defs.ts';

type Primary = 'str' | 'vit' | 'mag' | 'spr' | 'dex' | 'lck';
const PRIMARY: readonly Primary[] = ['str', 'vit', 'mag', 'spr', 'dex', 'lck'];

/** Integer truncation toward zero, FF7's `[x]` [core §1.1]. */
export function trunc(x: number): number {
  return Math.trunc(x);
}

/** Every Materia orb a member has equipped, weapon slots first, in slot order. */
export function equippedMateria(member: Pick<Ff7MemberBuild, 'materia'>): MateriaInstance[] {
  const out: MateriaInstance[] = [];
  for (const m of member.materia.weapon) if (m) out.push(m);
  for (const m of member.materia.armour) if (m) out.push(m);
  return out;
}

/** Look a Materia up or throw (a typo in a build is a data bug, never silent). */
function materiaDef(registry: Readonly<Record<string, Ff7MateriaDef>>, id: string): Ff7MateriaDef {
  const def = registry[id];
  if (!def) throw new Error(`FF7 stats: unknown Materia '${id}'`);
  return def;
}

/** Primary stats after equipment and Materia bonuses [core §1.1]. */
export function totalPrimary(
  member: Pick<Ff7MemberBuild, 'base' | 'weapon' | 'armour' | 'accessory' | 'materia'>,
  materia: Readonly<Record<string, Ff7MateriaDef>>,
): Record<Primary, number> {
  const out = {} as Record<Primary, number>;
  const gear: Array<Ff7EquipmentDef | null> = [member.weapon, member.armour, member.accessory];
  const orbs = equippedMateria(member).map((m) => materiaDef(materia, m.id));
  for (const k of PRIMARY) {
    let v = member.base[k];
    for (const g of gear) v += g?.statBonus?.[k] ?? 0;
    for (const o of orbs) v += o.stat[k] ?? 0;
    out[k] = v;
  }
  return out;
}

/** Apply a summed percentage to a pool, truncated toward zero [core §8.5, derived]. */
export function applyPoolPct(base: number, pct: number): number {
  return base + trunc((base * pct) / 100);
}

/** The battle stats FF7's formulas read, for one party member [core §1.1]. */
export function deriveMemberStats(
  member: Pick<Ff7MemberBuild, 'base' | 'weapon' | 'armour' | 'accessory' | 'materia'>,
  materia: Readonly<Record<string, Ff7MateriaDef>>,
): Ff7DerivedStats {
  const p = totalPrimary(member, materia);
  const orbs = equippedMateria(member).map((m) => materiaDef(materia, m.id));
  const hpPct = orbs.reduce((s, o) => s + o.hpPct, 0);
  const mpPct = orbs.reduce((s, o) => s + o.mpPct, 0);
  const armour = member.armour;
  return {
    maxHp: applyPoolPct(member.base.hp, hpPct),
    maxMp: applyPoolPct(member.base.mp, mpPct),
    att: p.str + (member.weapon.att ?? 0),
    atPct: member.weapon.atPct ?? 0,
    def: p.vit + (armour.def ?? 0) + (member.accessory?.def ?? 0),
    dfPct: trunc(p.dex / 4) + (armour.dfPct ?? 0) + (member.accessory?.dfPct ?? 0),
    mat: p.mag,
    // Armour MDefense is never added in battle, on PC or PlayStation [core §1.1, single source: Fergusson BM §1.1].
    mdf: p.spr,
    mdPct: (armour.mdPct ?? 0) + (member.accessory?.mdPct ?? 0),
    dex: p.dex,
    lck: p.lck,
  };
}

/**
 * The Stat Modifier [core §1.2, single source: Fergusson BM §3.1]: an integer
 * percentage -100..+100 on Att, Def, MAt, MDf, Df% and Dex, read as
 * `Stat + [Modifier * Stat / 100]`. Nothing at the first fight changes it.
 */
export function withModifier(stat: number, modifierPct: number): number {
  const m = Math.max(-100, Math.min(100, modifierPct));
  return stat + trunc((m * stat) / 100);
}

/** Base Dexterity only, for the Turn Timer's NormalSpeed [core §2.3]. */
export function baseDex(base: Pick<Ff7BaseStats, 'dex'>): number {
  return base.dex;
}

/** Spells a member's equipped Materia grants, in slot order, without duplicates [core §8.4]. */
export function spellsFromMateria(
  member: Pick<Ff7MemberBuild, 'materia'>,
  materia: Readonly<Record<string, Ff7MateriaDef>>,
): string[] {
  const out: string[] = [];
  for (const m of equippedMateria(member)) {
    for (const s of materiaDef(materia, m.id).spells) if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** True when `mp` pays for `cost` [core §8.5]. */
export function canPayMp(mp: number, cost: number): boolean {
  return mp >= cost;
}

/** MP after paying `cost`, never below 0. */
export function payMp(mp: number, cost: number): number {
  return Math.max(0, mp - cost);
}
