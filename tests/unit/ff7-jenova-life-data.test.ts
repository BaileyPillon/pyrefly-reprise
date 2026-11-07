/**
 * Jenova LIFE's data and the Forgotten Capital preset (hidden chapter 44; FF7 only): the record, the oracle numbers,
 * the clock pins, the Materia levels from AP, the spell and Limit rows, and that every id the build names resolves.
 * Sources: `research/ff7-jenova-life.md` ("jl"), whose sections each assertion names.
 */

import { describe, expect, it } from 'vitest';
import { damageRange, magicalBase, spellsFromMateria, materiaLevel, ticksToFill } from '../../src/battle/ff7/index.ts';
import { forgottenCapitalBuild, jenovaLife, jenovaLifeGroup, sector1ReactorBuild } from '../../src/data/ff7/index.ts';
import { JL_REG, jlEnv, JENOVA } from './helpers/jenova.ts';

describe('jl §3: the record', () => {
  const f = jenovaLife.ff7!;
  it('Lv 50, 10,000 HP, 300 MP, Att 128, MAt 40, Def 110, MDf 290, Df% 10, Dex 140, Lck 40', () => {
    expect(f.level).toBe(50);
    expect(f.stats).toEqual({ maxHp: 10_000, maxMp: 300, att: 128, def: 110, dfPct: 10, mat: 40, mdf: 290, dex: 140, lck: 40 });
    expect(magicalBase(f.stats.mat, f.level)).toBe(540); // jl §3: M = 6 * (40 + 50)
    expect([jenovaLife.hp, jenovaLife.mp]).toEqual([10_000, 300]);
  });
  it('4,000 EXP, 350 AP, 1,500 gil, and a certain Wizard Bracelet (class 63 of 63, not LE\'s 24.7%)', () => {
    expect([f.exp, f.ap, f.gil]).toEqual([4000, 350, 1500]);
    expect(f.drops).toEqual([{ itemId: 'wizard-bracelet', count: 1, chanceClass: 63 }]);
    expect(JL_REG.equipment['wizard-bracelet']?.statBonus).toEqual({ mag: 20 });
  });
  it('absorbs Water, weak to Earth, void Gravity; immune to the eleven statuses and not to Paralysed, Darkness, Slow, Sadness, Fury', () => {
    expect(f.elements).toEqual({ water: 'absorb', earth: 'weak', gravity: 'void' });
    for (const s of ['sleep', 'small', 'confusion', 'silence', 'frog', 'stop', 'berserk', 'poison', 'petrify', 'slow-numb', 'manipulate', 'death', 'death-sentence']) {
      expect(f.statusImmune).toContain(s);
    }
    for (const s of ['paralysed', 'darkness', 'slow', 'sadness', 'fury', 'reflect', 'barrier', 'mbarrier', 'regen']) expect(f.statusImmune).not.toContain(s);
  });
  it('one enemy, no escape, a script of her own', () => {
    expect(jenovaLifeGroup.enemies).toHaveLength(1);
    expect(jenovaLifeGroup.canEscape).toBe(false);
    expect(jenovaLife.aiScriptId).toBe('jenova-life');
    for (const a of jenovaLife.abilityIds) expect(JL_REG.abilities[a]?.kind).toBe('enemy');
  });
});

describe('jl §4: her four actions, and Gamer Corner\'s Def-140 oracle (343, 392, 850)', () => {
  const ab = (id: string) => JL_REG.abilities[id]!;
  it('Blue Light 7/8x for 8 MP, Blue Flame 1x for 12, Aqualung 3 1/4x for 34 on all, Reflect for 30 on herself', () => {
    expect([ab('blue-light').power, ab('blue-light').mpCost]).toEqual([14, 8]);
    expect([ab('blue-flame').power, ab('blue-flame').mpCost]).toEqual([16, 12]);
    expect([ab('aqualung').power, ab('aqualung').mpCost, ab('aqualung').targeting]).toEqual([52, 34, 'all-opponents']);
    expect([ab('jenova-reflect').mpCost, ab('jenova-reflect').targeting, ab('jenova-reflect').status]).toEqual([30, 'self', { add: ['reflect'] }]);
    expect(ab('blue-light').element).toEqual(['water', 'shout']);
    expect(ab('aqualung').reflectable).toBe(true);
  });
  it('against a flat Def / MDf 140 target the top of the range is 343, 392 and 850 (Aqualung with its 2/3 split)', () => {
    const target = { def: 140, mdf: 140, hp: 9999, maxHp: 9999 };
    const user = { level: 50, att: 128, mat: 40 };
    const top = (id: string, split: boolean) => damageRange({
      formula: 'magical', power: ab(id).power, user, target, elements: [...(ab(id).element as readonly string[])] as never, affinities: {}, modifiers: { split },
    }).max;
    expect(top('blue-light', false)).toBe(343); // Gamer Corner prints 344: the +-1 drift of a different floor, jl §4
    expect(top('blue-flame', false)).toBe(392);
    expect(top('aqualung', ab('aqualung').splitsOnMulti === true)).toBe(850);
  });
});

describe('jl §9: the clock at Battle Speed 128 (core §2.1 to §2.3)', () => {
  it('NormalSpeed 88; the Turn Timer rates 177, 192, 171 and 289; full in 371, 342, 384 and 227 ticks; she acts 1.6 times as often', () => {
    const { env } = jlEnv();
    expect(env.rt.normalSpeed).toBe(88);
    expect(env.rt.increase).toEqual({ cloud: 177, tifa: 192, barret: 171, [JENOVA]: 289 });
    expect(ticksToFill(177)).toBe(371);
    expect(ticksToFill(192)).toBe(342);
    expect(ticksToFill(171)).toBe(384);
    expect(ticksToFill(289)).toBe(227);
    expect(371 / 227).toBeGreaterThan(1.6);
  });
});

describe('jl §9: the preset (all [estimate]; pinned so a change is deliberate)', () => {
  it('three members, Cloud and Tifa in front, Barret behind, in slot order', () => {
    expect(forgottenCapitalBuild.activeSlots).toEqual(['cloud', 'tifa', 'barret']);
    expect(forgottenCapitalBuild.members.map((m) => [m.id, m.row, m.base.level])).toEqual([['cloud', 'front', 38], ['tifa', 'front', 38], ['barret', 'back', 38]]);
  });
  it('the pools and battle stats the engine derives from the base stats, equipment and Materia', () => {
    const { u } = jlEnv();
    const d = (id: string) => u(id).ff7.derived;
    expect([d('cloud').maxHp, d('cloud').maxMp, d('cloud').att, d('cloud').def, d('cloud').mat, d('cloud').mdf]).toEqual([2046, 350, 108, 114, 77, 58]);
    expect([d('tifa').maxHp, d('tifa').maxMp, d('tifa').att, d('tifa').atPct, d('tifa').def, d('tifa').mat, d('tifa').mdf]).toEqual([1990, 302, 117, 112, 98, 65, 54]);
    expect([d('barret').maxHp, d('barret').maxMp, d('barret').att, d('barret').def, d('barret').mat, d('barret').mdf]).toEqual([2471, 284, 95, 120, 62, 62]);
  });
  it('the Magic each member has from its Materia at its AP', () => {
    const by = Object.fromEntries(forgottenCapitalBuild.members.map((m) => [m.id, spellsFromMateria(m, JL_REG.materia)]));
    expect(by['cloud']).toEqual(['cure', 'cure2', 'regen', 'bolt', 'bolt2', 'bolt3', 'quake', 'quake2', 'barrier', 'mbarrier']);
    expect(by['tifa']).toEqual(['ice', 'ice2', 'ice3', 'cure', 'cure2']);
    expect(by['barret']).toEqual(['cure', 'cure2', 'regen', 'fire', 'fire2', 'fire3']);
    expect(by['cloud']!.length).toBeLessThanOrEqual(12); // the Magic grid is 3 columns by 4 rows
  });
  it('the bag, and the Limit each member holds (levels 2, 3 and 3)', () => {
    expect(forgottenCapitalBuild.inventory).toEqual([{ itemId: 'potion', count: 20 }, { itemId: 'hi-potion', count: 15 }, { itemId: 'phoenix-down', count: 10 }]);
    const lim = Object.fromEntries(forgottenCapitalBuild.members.map((m) => [m.id, [m.limit.level, m.limit.learnedLimitIds]]));
    expect(lim).toEqual({
      cloud: [2, ['blade-beam', 'climhazzard']],
      tifa: [3, ['dolphin-blow']],
      barret: [3, ['satellite-beam', 'angermax']],
    });
    expect(JL_REG.limits['tifa']?.lnum).toEqual([120, 334, 509, 566]);
  });
  it('every id the build and the boss name resolves in the registry, and every record carries a cite', () => {
    for (const m of forgottenCapitalBuild.members) {
      expect(JL_REG.equipment[m.weapon.id]).toBe(m.weapon);
      expect(JL_REG.equipment[m.armour.id]).toBe(m.armour);
      if (m.accessory) expect(JL_REG.equipment[m.accessory.id]).toBe(m.accessory);
      for (const orb of [...m.materia.weapon, ...m.materia.armour]) if (orb) expect(JL_REG.materia[orb.id]).toBeDefined();
      for (const l of m.limit.learnedLimitIds) expect(JL_REG.abilities[l]?.kind).toBe('limit');
      expect(JL_REG.limits[m.id]).toBeDefined();
      for (const s of spellsFromMateria(m, JL_REG.materia)) expect(JL_REG.abilities[s]).toBeDefined();
    }
    for (const i of forgottenCapitalBuild.inventory) expect(JL_REG.items[i.itemId]).toBeDefined();
    for (const d of jenovaLife.ff7!.drops) expect(JL_REG.equipment[d.itemId] ?? JL_REG.items[d.itemId]).toBeDefined();
  });
});

describe('Materia levels from AP (LE party §3.5; chapter 44)', () => {
  const lvl = (id: string, ap: number | undefined) => materiaLevel(JL_REG.materia[id]!, ap);
  it('Fire, Ice and Lightning: level 2 at 2,000 and level 3 at 18,000; Restore 2,500 and 17,000; Earth 6,000 and 22,000; Barrier 5,000', () => {
    expect([lvl('lightning', 1999), lvl('lightning', 2000), lvl('lightning', 17_999), lvl('lightning', 18_000)]).toEqual([1, 2, 2, 3]);
    expect([lvl('restore', 2499), lvl('restore', 2500), lvl('restore', 16_999), lvl('restore', 17_000)]).toEqual([1, 2, 2, 3]);
    expect([lvl('earth', 5999), lvl('earth', 6000), lvl('earth', 21_999), lvl('earth', 22_000)]).toEqual([1, 2, 2, 3]);
    expect([lvl('barrier', 4999), lvl('barrier', 5000), lvl('barrier', 99_999)]).toEqual([1, 2, 2]); // Reflect (level 3) is not carried: jl pick J6
  });
  it('an orb with no AP is at level 1, so the Guard Scorpion build\'s Magic is unchanged', () => {
    expect(lvl('fire', undefined)).toBe(1);
    const spells = sector1ReactorBuild.members.map((m) => spellsFromMateria(m, JL_REG.materia));
    expect(spells).toEqual([['bolt', 'ice'], ['cure']]);
  });
  it('the stat deltas are the tier\'s: light magic -2% HP, +2% MP, Str -1, Mag +1; Barrier is medium', () => {
    expect(JL_REG.materia['earth']).toMatchObject({ hpPct: -2, mpPct: 2, stat: { str: -1, mag: 1 } });
    expect(JL_REG.materia['barrier']).toMatchObject({ hpPct: -5, mpPct: 5, stat: { str: -2, vit: -1, mag: 2, spr: 1 } });
  });
});

describe('the spell and Limit rows (LE formulas 6.1, LE party 9; single source)', () => {
  const row = (id: string) => { const a = JL_REG.abilities[id]!; return [a.power, a.mpCost]; };
  it('Fire, Ice and Bolt: 1/2x, 1 1/4x, 4x at 4, 22 and 52 MP; Quake 11/16x, 1 1/2x, 4 3/8x at 6, 28 and 68; Cure2 Base + 770 for 24', () => {
    for (const fam of ['fire', 'ice', 'bolt']) {
      expect([row(fam), row(`${fam}2`), row(`${fam}3`)]).toEqual([[8, 4], [20, 22], [64, 52]]);
    }
    expect([row('quake'), row('quake2'), row('quake3')]).toEqual([[11, 6], [24, 28], [70, 68]]);
    expect(row('cure2')).toEqual([35, 24]);
    expect(22 * JL_REG.abilities['cure2']!.power).toBe(770);
    expect([row('regen')[1], row('barrier')[1], row('mbarrier')[1]]).toEqual([30, 16, 24]);
  });
  it('every attack spell is reflectable and toggles; Quake is Earth', () => {
    for (const id of ['fire', 'fire2', 'fire3', 'ice2', 'ice3', 'bolt2', 'bolt3', 'quake', 'quake2', 'quake3']) {
      expect(JL_REG.abilities[id]).toMatchObject({ reflectable: true, canToggleAll: true, formula: 'magical' });
    }
    expect(JL_REG.abilities['quake2']?.element).toEqual(['earth']);
  });
  it('Limits: Blade Beam 3 1/2x, Climhazzard 4 3/8x, Satellite Beam 2 3/16x all-enemy auto-critical, Angermax 18 x 1/2x, Tifa 1 1/4x to 1 3/4x in five hits', () => {
    const a = (id: string) => JL_REG.abilities[id]!;
    expect([a('blade-beam').power, a('climhazzard').power, a('satellite-beam').power]).toEqual([56, 70, 35]);
    expect(a('satellite-beam')).toMatchObject({ crit: 'auto', targeting: 'all-opponents' });
    expect(a('angermax').hits).toHaveLength(18);
    expect(new Set(a('angermax').hits)).toEqual(new Set([8]));
    expect(a('dolphin-blow').hits).toEqual([20, 22, 24, 26, 28]);
    expect(a('dolphin-blow').hits!.reduce((s, p) => s + p, 0)).toBe(120); // 7 1/2x Base over five hits
    for (const id of ['blade-beam', 'climhazzard', 'satellite-beam', 'angermax', 'dolphin-blow']) expect(a(id).hit).toEqual({ kind: 'physical', atPct: 255 });
  });
});
