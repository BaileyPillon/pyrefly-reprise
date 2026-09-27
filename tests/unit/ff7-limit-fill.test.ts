/**
 * The FF7 Limit gauge fill (core §7.1) against gs §9's worked numbers. FF7 only.
 */

import { describe, expect, it } from 'vitest';
import { deriveMemberStats, fillLimitGauge, limitReady, limitUnitsGained, LIMIT_GAUGE_FULL } from '../../src/battle/ff7/index.ts';
import { ff7Registry, sector1ReactorBuild } from '../../src/data/ff7/index.ts';

const reg = ff7Registry();
const [cloudBuild, barretBuild] = sector1ReactorBuild.members;
if (!cloudBuild || !barretBuild) throw new Error('build missing a member');
const CLOUD_HP = deriveMemberStats(cloudBuild, reg.materia).maxHp;
const BARRET_HP = deriveMemberStats(barretBuild, reg.materia).maxHp;
const CLOUD_L1 = reg.limits.cloud?.lnum[0] ?? 0;
const BARRET_L1 = reg.limits.barret?.lnum[0] ?? 0;

describe('FF7 Limit gauge (gs §9, derived)', () => {
  it('LNum at Level 1: Cloud 140, Barret 129 (core §7.1)', () => {
    expect([CLOUD_L1, BARRET_L1]).toEqual([140, 129]);
    expect([CLOUD_HP, BARRET_HP]).toEqual([316, 317]);
  });
  it('a Rifle hit (38) gives Cloud 65 and Barret 69', () => {
    expect(limitUnitsGained(38, CLOUD_HP, CLOUD_L1)).toBe(65);
    expect(limitUnitsGained(38, BARRET_HP, BARRET_L1)).toBe(69);
  });
  it('a Scorpion Tail (68) gives 117 and 127; a Tail Laser hit (77) gives 133 and 142', () => {
    expect(limitUnitsGained(68, CLOUD_HP, CLOUD_L1)).toBe(117);
    expect(limitUnitsGained(68, BARRET_HP, BARRET_L1)).toBe(127);
    expect(limitUnitsGained(77, CLOUD_HP, CLOUD_L1)).toBe(133);
    expect(limitUnitsGained(77, BARRET_HP, BARRET_L1)).toBe(142);
  });
  it('two Tail Lasers fill both gauges; two Scorpion Tails leave 234 and 254; three Rifles 195 and 207', () => {
    const run = (hits: number[], hp: number, lnum: number) => hits.reduce((g, h) => fillLimitGauge(g, h, hp, lnum, true), 0);
    expect(run([77, 77], CLOUD_HP, CLOUD_L1)).toBe(LIMIT_GAUGE_FULL);
    expect(run([77, 77], BARRET_HP, BARRET_L1)).toBe(LIMIT_GAUGE_FULL);
    expect(run([68, 68], CLOUD_HP, CLOUD_L1)).toBe(234);
    expect(run([68, 68], BARRET_HP, BARRET_L1)).toBe(254);
    expect(limitReady(254)).toBe(false);
    expect(limitReady(255)).toBe(true);
    expect(run([38, 38, 38], CLOUD_HP, CLOUD_L1)).toBe(195);
    expect(run([38, 38, 38], BARRET_HP, BARRET_L1)).toBe(207);
  });
  it('only an enemy fills it; Fury doubles and Sadness halves the units; nothing for 0 damage', () => {
    expect(fillLimitGauge(10, 77, CLOUD_HP, CLOUD_L1, false)).toBe(10);
    expect(limitUnitsGained(38, CLOUD_HP, CLOUD_L1, 'fury')).toBe(131);
    expect(limitUnitsGained(38, CLOUD_HP, CLOUD_L1, 'sadness')).toBe(32);
    expect(limitUnitsGained(0, CLOUD_HP, CLOUD_L1)).toBe(0);
  });
});
