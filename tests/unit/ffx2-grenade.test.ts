/**
 * PR-0087: the FFX-2 Grenade is base 200, 187-211 per enemy before chain, with
 * no guaranteed crit [ffx2-combat-core §8.1; ffx2-leblanc-syndicate §18 C18.1;
 * docs/plans/questions-for-bailey-2026-09-23.md Q2].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Before the fix every hit was a
 * crit (`bonusCrit: 100`): chapter 6 Act I, seeds 1-30, 90 hits, 90 crits,
 * unchained hits 375-423.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_I } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';

/** The first Grenade of the battle, thrown at once, everyone else Defending. */
function firstGrenade(seed: number): Array<{ amount: number; crit: boolean; chain: number }> {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
    atbMode: 'wait',
  });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2', party: chateauBuild, enemies: data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_I]!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  let thrower = '';
  for (let i = 0; i < 5000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') continue;
    if (thrower) { engine.submit({ kind: 'defend', targets: [] }); } else {
      const row = d.commands.find((c) => c.command.kind === 'item' && c.command.id === 'x2-grenade')!;
      thrower = d.actorId;
      engine.submit({ ...row.command, targets: [row.validTargets[0]!] } as Command);
    }
    const chain = new Map<string, number>();
    const hits: Array<{ amount: number; crit: boolean; chain: number }> = [];
    for (const e of engine.state().log) {
      if (e.type === 'chain') chain.set(e.targetId, e.count);
      if (e.type === 'damage' && e.sourceId === thrower) hits.push({ amount: e.amount, crit: e.crit, chain: chain.get(e.targetId) ?? 0 });
    }
    if (hits.length > 0) return hits;
  }
  throw new Error('the Grenade never landed');
}

describe('Grenade (FFX-2, PR-0087)', () => {
  it('lands 187-211 per enemy unchained and is not a guaranteed crit (seeds 1-30)', () => {
    const hits = Array.from({ length: 30 }, (_, i) => firstGrenade(i + 1)).flat();
    const plain = hits.filter((h) => !h.crit && h.chain === 0);
    expect(hits.length).toBe(90);
    expect(plain.length).toBeGreaterThan(60);
    for (const h of plain) {
      expect(h.amount).toBeGreaterThanOrEqual(187);
      expect(h.amount).toBeLessThanOrEqual(211);
    }
    expect(hits.filter((h) => h.crit).length).toBeLessThan(hits.length / 2);
  });

  it('carries no bonusCrit', () => {
    expect(data.ABILITIES['x2-item-grenade']!.bonusCrit ?? 0).toBe(0);
    expect(data.ABILITIES['x2-item-grenade']!.power * 50).toBe(200);
  });
});
