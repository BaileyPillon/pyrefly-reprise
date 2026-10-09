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
 *
 * **Re-parity W3 (FFX-2 only; reason "game-code parity").** Steal, Pilfer Gil and Bribe run inside the strike
 * (`resolve-strike.ts`, `steal.ts`) on the proven theft kernels (`kernel/steal.ts`, `research/re-ffx2-hit-status.md`
 * section 5): the item roll is `draw % 255 < byte` on fixed stream 10 and the slot roll `draw & 0xff < 32` on stream 11 (the
 * rare slot, one in eight); Pilfer Gil is a success roll and then an amount roll, `floor(floor((s + 100) * gil / 200) *
 * 255 / 255)`, so it takes between half and all of the enemy's figure, once. The enemy's steal byte and figure are the game's
 * monster row (`src/data/ffx2/monster-records/`): the goons' byte is 255, not 191. `resolveTheft` is gone.
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
import { applyPilferGil, applyStealItem, stealByte, type TheftEnv } from '../../src/battle/ffx2/steal.ts';
import { resolveCommand } from '../../src/battle/ffx2/adapt/command.ts';
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
  const env: TheftEnv & { units: Ffx2Unit[] } = { units, state, rng, emit: (e) => events.push(e), items: itemRegistryFrom(Object.values(data.ITEMS)) };
  const rikku = units.find((u) => u.id === 'rikku')!;
  const leblanc = units.find((u) => u.enemy && u.name === 'Leblanc')!;
  return { env, rikku, leblanc, state, events };
}

/** The Steal row's theft on `target`, as the strike runs it after the hit determination. */
function steal(f: ReturnType<typeof theftFixture>, abilityId: string, target: Ffx2Unit): void {
  const ability = data.ABILITIES[abilityId]!;
  applyStealItem(f.env, resolveCommand(ability, f.rikku), f.rikku, target);
}

describe('Steal (FFX-2)', () => {
  it('rolls the steal byte out of 255: Leblanc 192 succeeds on 191 and fails on 192', () => {
    expect(stealByte(data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III]!.enemies.find((e) => e.name === 'Leblanc')!.rewards.steal!)).toBe(192);

    const hit = theftFixture(scripted([191, 3]));
    steal(hit, 'x2-thief-steal', hit.leblanc);
    expect(hit.state.flags['inventory:x2-elixir']).toBe((chateauBuild.inventory.find((i) => i.itemId === 'x2-elixir')?.count ?? 0) + 1);

    const miss = theftFixture(scripted([192]));
    const before = miss.state.flags['inventory:x2-elixir'];
    steal(miss, 'x2-thief-steal', miss.leblanc);
    expect(miss.state.flags['inventory:x2-elixir']).toBe(before);
    expect(miss.leblanc.stolenFrom).toBeFalsy();
  });

  it('takes the rare slot 1 time in 8 (the second draw is 0)', () => {
    const f = theftFixture(scripted([0, 0]));
    const logos = f.env.units.find((u) => u.enemy && u.name === 'Logos')!;
    const rareBefore = f.state.flags['inventory:x2-elixir'];
    const commonBefore = f.state.flags['inventory:x2-mega-potion'];
    steal(f, 'x2-thief-steal', logos);
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
    // The Dr. Goon's steal byte is the game row's 255 (it was the wiki's 191, 75 %): `draw % 255 < 255` never fails, so
    // every one of the 60 seeds lands on the first try.
    expect(firstTry).toBe(60);
  });
});

describe('Pilfer Gil (FFX-2)', () => {
  it('takes Leblanc\'s 1,500 gil once, deals no damage, opens no chain and costs 2 MP', () => {
    const engine = engineFor(LEBLANC_ACT_III, 3);
    const leblanc = engine.state().enemyIds.find((id) => engine.state().combatants[id]?.name === 'Leblanc')!;
    const mpBefore = engine.state().combatants['rikku']!.mp;
    const hpBefore = engine.state().combatants[leblanc]!.hp;
    const events = rikkuDoes(engine, 'x2-thief-pilfer-gil', leblanc);
    // The game's amount roll takes half to all of the figure: floor((s + 100) * 1500 / 200), s = 0..100 -> 750..1500.
    const text = messages(events);
    expect(text).toHaveLength(1);
    const taken = Number(/^Rikku pilfered ([0-9,]+) gil!$/.exec(text[0]!)?.[1]?.replace(/,/g, ''));
    expect(taken).toBeGreaterThanOrEqual(750);
    expect(taken).toBeLessThanOrEqual(1500);
    expect(events.some((e) => e.type === 'damage' || e.type === 'chain')).toBe(false);
    expect(engine.state().combatants[leblanc]!.hp).toBe(hpBefore);
    expect(engine.state().combatants['rikku']!.mp).toBe(mpBefore - 2);
    expect(engine.state().flags['stolenGil']).toBe(taken);

    expect(messages(rikkuDoes(engine, 'x2-thief-pilfer-gil', leblanc))).toEqual(['Leblanc has no gil to take']);
    expect(engine.state().flags['stolenGil']).toBe(taken);
  });

  it('adds pilfered gil to the result, except on a defeat', () => {
    const f = theftFixture(scripted([0, 100])); // success, then the top amount roll: floor(200 * 1500 / 200) = 1,500
    applyPilferGil(f.env, f.rikku, f.leblanc);
    const units = f.env.units;
    const dropGil = units.filter((u) => u.enemy).reduce((s, u) => s + (u.enemy?.rewards.gil ?? 0), 0);
    expect(buildResult(units, f.state, 'victory', 0).gil).toBe(dropGil + 1500);
    expect(buildResult(units, f.state, 'escape', 0).gil).toBe(1500);
    expect(buildResult(units, f.state, 'defeat', 0).gil).toBe(0);
  });

  it('every enemy of Acts I and II carries the game row figure too (the wiki published it for Act III only)', () => {
    // The game's monster rows hold a figure for every monster, and the gil chance byte is 255 for all of them
    // (research/re-ffx2-ai-leblanc-den-ixion.md 1.9): Pilfer Gil works from the first room.
    for (const id of [LEBLANC_ACT_I, 'ffx2-leblanc-logos-room']) {
      for (const e of data.ENEMY_GROUPS_BY_ID[id]!.enemies) {
        expect(e.ffx2Record?.stealGil, e.id).toBeGreaterThan(0);
        expect(e.rewards.stolenGil, e.id).toBe(e.ffx2Record?.stealGil);
      }
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
        stealRate: 128, // the game row's byte, which equals the authored one here
        common: { itemId: 'x2-phoenix-down', count: 1 },
        rare: { itemId: 'x2-mega-phoenix', count: 1 },
      });
      expect(stealByte(r.rewards.steal!)).toBe(128);
      expect(r.rewards.stolenGil).toBe(350);
    }
  });
});
