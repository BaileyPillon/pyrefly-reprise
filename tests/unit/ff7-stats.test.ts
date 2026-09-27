/**
 * FF7 derived stats and MP (core §1.1, §8.3 to §8.5; gs §8.4's derived table). FF7 only.
 */

import { describe, expect, it } from 'vitest';
import {
  applyPoolPct,
  canPayMp,
  deriveMemberStats,
  payMp,
  spellsFromMateria,
  totalPrimary,
  withModifier,
} from '../../src/battle/ff7/index.ts';
import { ff7Registry, sector1ReactorBuild } from '../../src/data/ff7/index.ts';

const reg = ff7Registry();
const [cloudBuild, barretBuild] = sector1ReactorBuild.members;
if (!cloudBuild || !barretBuild) throw new Error('build missing a member');

describe('FF7 derived stats at the Guard Scorpion (gs §8.4, derived)', () => {
  it('Cloud: HP 316, MP 57, Att 37 / 96, Def 25 / 2, MAt 25, MDf 18', () => {
    expect(deriveMemberStats(cloudBuild, reg.materia)).toEqual({
      maxHp: 316, maxMp: 57, att: 37, atPct: 96, def: 25, dfPct: 2, mat: 25, mdf: 18, mdPct: 0, dex: 9, lck: 15,
    });
  });
  it('Barret with Restore: HP 317, MP 43, Att 32 / 97, Def 27 / 2, MAt 17, MDf 15', () => {
    expect(deriveMemberStats(barretBuild, reg.materia)).toEqual({
      maxHp: 317, maxMp: 43, att: 32, atPct: 97, def: 27, dfPct: 2, mat: 17, mdf: 15, mdPct: 0, dex: 10, lck: 17,
    });
  });
  it('equipment and Materia bonuses flow into the primaries: Cloud Mag 21 + 2 (Buster Sword) + 2 (Materia), Str 21 - 2', () => {
    const p = totalPrimary(cloudBuild, reg.materia);
    expect(p.mag).toBe(25);
    expect(p.str).toBe(19);
  });
  it('armour MDefense is never added to MDf (the kept bug, core §1.1)', () => {
    const withMdef = { ...cloudBuild, armour: { ...cloudBuild.armour, mdef: 40 } };
    expect(deriveMemberStats(withMdef, reg.materia).mdf).toBe(18);
  });
  it('Materia percentages are summed and applied once, truncated toward zero (core §8.5)', () => {
    expect(applyPoolPct(329, -4)).toBe(316);
    expect(applyPoolPct(55, 4)).toBe(57);
    expect(applyPoolPct(43, 2)).toBe(43);
    expect(applyPoolPct(323, -2)).toBe(317);
  });
  it('with no Materia the pools are the base ones', () => {
    const bare = { ...cloudBuild, materia: { weapon: [null, null], armour: [] } };
    const d = deriveMemberStats(bare, reg.materia);
    expect(d.maxHp).toBe(329);
    expect(d.maxMp).toBe(55);
    expect(d.att).toBe(39);
    expect(d.mat).toBe(23);
  });
  it('an unknown Materia id throws, never silently', () => {
    const bad = { ...cloudBuild, materia: { weapon: [{ id: 'nope' }], armour: [] } };
    expect(() => deriveMemberStats(bad, reg.materia)).toThrow(/unknown Materia/);
  });
  it('the Stat Modifier is Stat + [Mod * Stat / 100], clamped to -100..+100 (core §1.2)', () => {
    expect(withModifier(37, 0)).toBe(37);
    expect(withModifier(37, 50)).toBe(55);
    expect(withModifier(37, -100)).toBe(0);
    expect(withModifier(37, 300)).toBe(74);
  });
});

describe('FF7 Magic and MP (core §8.4, §8.5)', () => {
  it('Materia grants the spell lists: Cloud Bolt and Ice, Barret Cure', () => {
    expect(spellsFromMateria(cloudBuild, reg.materia)).toEqual(['bolt', 'ice']);
    expect(spellsFromMateria(barretBuild, reg.materia)).toEqual(['cure']);
  });
  it('Cloud casts 14 Bolts from 57 MP; Barret 8 Cures from 43 (core §8.5, gs §9)', () => {
    let mp = 57;
    let casts = 0;
    while (canPayMp(mp, 4)) { mp = payMp(mp, 4); casts++; }
    expect(casts).toBe(14);
    expect(mp).toBe(1);
    expect(Math.floor(43 / 5)).toBe(8);
    expect(canPayMp(4, 5)).toBe(false);
    expect(payMp(3, 5)).toBe(0);
  });
});
