/**
 * Steal and Pilfer Gil on the real FFX-2 engine (`src/battle/ffx2/steal.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Chapter 6 gives Rikku both
 * commands (`chateau.ts`); before this fix Steal spent her turn with no event
 * and Pilfer Gil landed a 0-damage hit (docs/plans/questions-for-bailey-2026-09-23.md Q5).
 *
 * Sourced rules under test: success = steal byte / 255, then 1 in 8 rare
 * [`ffx2-bahamut.md` §1.6]; one successful steal per enemy per battle
 * [ffx2-combat-core §3.2, §8.3]; Pilfer Gil takes the enemy's stolen-gil figure
 * once and deals no damage [§3.2, §8.3]; Leblanc 1,500 gil, steal byte 192
 * [ffx2-leblanc-syndicate §3.1, §6.3].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Command, Rng } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { resolveTheft, stealByte } from '../../src/battle/ffx2/steal.ts';
import { buildResult } from '../../src/battle/ffx2/results.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_I, LEBLANC_ACT_III } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';

function engineFor(groupId: string, seed: number): FFX2Engine {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
    atbMode: 'wait',
  });
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`no group ${groupId}`);
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** Advance to Rikku's next menu (everyone else Defends) and submit `abilityId` on `targetId`. */
function rikkuDoes(engine: FFX2Engine, abilityId: string, targetId: string): BattleEvent[] {
  for (let i = 0; i < 5000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('battle ended first');
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') continue;
    if (d.actorId !== 'rikku') { engine.submit({ kind: 'defend', targets: [] }); continue; }
    const row = d.commands.find((c) => 'id' in c.command && c.command.id === abilityId);
    if (!row || !row.enabled) throw new Error(`${abilityId} not offered`);
    const from = engine.state().log.length;
    engine.submit({ ...row.command, targets: [targetId] } as Command);
    return engine.state().log.slice(from);
  }
  throw new Error('Rikku never got a turn');
}

const messages = (events: BattleEvent[]): string[] =>
  events.flatMap((e) => (e.type === 'message' ? [e.text] : []));

/** An Rng that answers `int` from a script, so each branch of the roll is pinned. */
function scripted(ints: number[]): Rng {
  const queue = [...ints];
  return {
    next: () => 0,
    int: () => { const v = queue.shift(); if (v === undefined) throw new Error('unexpected draw'); return v; },
    pick: (xs) => xs[0]!,
    seed: () => {},
    currentSeed: 0,
  };
}

function theftFixture(rng: Rng) {
  const engine = engineFor(LEBLANC_ACT_III, 1);
  const units = (engine as unknown as { units: Ffx2Unit[] }).units;
  const state: BattleState = engine.state();
  const events: unknown[] = [];
  const env = { units, state, rng, emit: (e: unknown) => events.push(e), items: itemRegistryFrom(Object.values(data.ITEMS)) };
  const rikku = units.find((u) => u.id === 'rikku')!;
  const leblanc = units.find((u) => u.enemy && u.name === 'Leblanc')!;
  return { env, rikku, leblanc, state, events };
}

describe('Steal (FFX-2)', () => {
  it('rolls the steal byte out of 255: Leblanc 192 succeeds on 191 and fails on 192', () => {
    expect(stealByte(data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III]!.enemies.find((e) => e.name === 'Leblanc')!.rewards.steal!)).toBe(192);
    const steal = data.ABILITIES['x2-thief-steal']!;

    const hit = theftFixture(scripted([191, 3]));
    expect(resolveTheft(hit.env as never, hit.rikku, steal, [hit.leblanc.id])).toBe(true);
    expect(hit.state.flags['inventory:x2-elixir']).toBe((chateauBuild.inventory.find((i) => i.itemId === 'x2-elixir')?.count ?? 0) + 1);

    const miss = theftFixture(scripted([192]));
    const before = miss.state.flags['inventory:x2-elixir'];
    resolveTheft(miss.env as never, miss.rikku, steal, [miss.leblanc.id]);
    expect(miss.state.flags['inventory:x2-elixir']).toBe(before);
    expect(miss.leblanc.stolenFrom).toBeFalsy();
  });

  it('takes the rare slot 1 time in 8 (the second draw is 0)', () => {
    const steal = data.ABILITIES['x2-thief-steal']!;
    const f = theftFixture(scripted([0, 0]));
    const logos = f.env.units.find((u) => u.enemy && u.name === 'Logos')!;
    const rareBefore = f.state.flags['inventory:x2-elixir'];
    const commonBefore = f.state.flags['inventory:x2-mega-potion'];
    resolveTheft(f.env as never, f.rikku, steal, [logos.id]);
    expect(f.state.flags['inventory:x2-elixir']).toBe(Number(rareBefore ?? 0) + 1); // Logos rare = Elixir
    expect(f.state.flags['inventory:x2-mega-potion']).toBe(commonBefore);
  });

  it('on the real engine: Act I Steal on the Dr. Goon lands at the sourced rate and never twice', () => {
    let firstTry = 0;
    const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
    for (const seed of seeds) {
      const engine = engineFor(LEBLANC_ACT_I, seed);
      const first = messages(rikkuDoes(engine, 'x2-thief-steal', 'dr-goon'));
      expect(first).toHaveLength(1); // never silent again
      if (/stole (Budget Grenade|Grenade)!/.test(first[0]!)) firstTry += 1;
      // Keep stealing until it lands, then once more: the enemy is empty.
      let landed = /stole [A-Z]/.test(first[0]!);
      for (let i = 0; i < 20 && !landed; i++) landed = /stole [A-Z]/.test(messages(rikkuDoes(engine, 'x2-thief-steal', 'dr-goon'))[0]!);
      expect(landed).toBe(true);
      const held = (engine.state().flags['inventory:x2-budget-grenade'] as number | undefined ?? 0) +
        Number(engine.state().flags['inventory:x2-grenade']);
      expect(messages(rikkuDoes(engine, 'x2-thief-steal', 'dr-goon'))).toEqual(['Dr. Goon has nothing left to steal']);
      expect((engine.state().flags['inventory:x2-budget-grenade'] as number | undefined ?? 0) +
        Number(engine.state().flags['inventory:x2-grenade'])).toBe(held);
    }
    // The Dr. Goon's rate is the record's 75 % (191/255 on the byte scale): 60 seeds land ~45.
    console.log(`Dr. Goon first-try steals: ${firstTry}/60`);
    expect(firstTry).toBeGreaterThan(35);
    expect(firstTry).toBeLessThan(55);
  });
});

describe('Pilfer Gil (FFX-2)', () => {
  it('takes Leblanc\'s 1,500 gil once, deals no damage, opens no chain and costs 2 MP', () => {
    const engine = engineFor(LEBLANC_ACT_III, 3);
    const leblanc = engine.state().enemyIds.find((id) => engine.state().combatants[id]?.name === 'Leblanc')!;
    const mpBefore = engine.state().combatants['rikku']!.mp;
    const hpBefore = engine.state().combatants[leblanc]!.hp;
    const events = rikkuDoes(engine, 'x2-thief-pilfer-gil', leblanc);
    expect(messages(events)).toEqual(['Rikku pilfered 1,500 gil!']);
    expect(events.some((e) => e.type === 'damage' || e.type === 'chain')).toBe(false);
    expect(engine.state().combatants[leblanc]!.hp).toBe(hpBefore);
    expect(engine.state().combatants['rikku']!.mp).toBe(mpBefore - 2);
    expect(engine.state().flags['stolenGil']).toBe(1500);

    expect(messages(rikkuDoes(engine, 'x2-thief-pilfer-gil', leblanc))).toEqual(['Leblanc has no gil to take']);
    expect(engine.state().flags['stolenGil']).toBe(1500);
  });

  it('adds pilfered gil to the result, except on a defeat', () => {
    const f = theftFixture(scripted([]));
    resolveTheft(f.env as never, f.rikku, data.ABILITIES['x2-thief-pilfer-gil']!, [f.leblanc.id]);
    const units = f.env.units;
    const dropGil = units.filter((u) => u.enemy).reduce((s, u) => s + (u.enemy?.rewards.gil ?? 0), 0);
    expect(buildResult(units, f.state, 'victory', 0).gil).toBe(dropGil + 1500);
    expect(buildResult(units, f.state, 'escape', 0).gil).toBe(1500);
    expect(buildResult(units, f.state, 'defeat', 0).gil).toBe(0);
  });

  it('Act I and II records carry no stolen gil (published for Act III only)', () => {
    for (const id of [LEBLANC_ACT_I, 'ffx2-leblanc-logos-room']) {
      for (const e of data.ENEMY_GROUPS_BY_ID[id]!.enemies) expect(e.rewards.stolenGil).toBeUndefined();
    }
  });
});

describe('Redoubt steal and stolen gil (FFX-2, ffx2-vegnagun-shuyin §13.2 S1-S2)', () => {
  it('both Redoubts: Phoenix Down x1 / rare Mega Phoenix x1 at 128/255, Pilfer Gil 350', () => {
    const redoubts = (data.ENEMY_GROUPS_BY_ID['vegnagun-head']!.parts ?? []).filter((e) => e.id.startsWith('redoubt'));
    expect(redoubts).toHaveLength(2);
    for (const r of redoubts) {
      expect(r.rewards.steal).toEqual({
        baseChance: 50,
        stealRate: 128,
        common: { itemId: 'x2-phoenix-down', count: 1 },
        rare: { itemId: 'x2-mega-phoenix', count: 1 },
      });
      expect(stealByte(r.rewards.steal!)).toBe(128);
      expect(r.rewards.stolenGil).toBe(350);
    }
  });
});
