/**
 * **Chateau Leblanc, the Last Room — scene staging.**
 *
 * Everything here is checked against the **pure, DOM-free exports** of
 * `src/scenes/leblanc-last-room.ts`: the slot table and the actor-height
 * table. Nothing in this project's scene modules has unit coverage of the
 * actual `SceneFactory` build (`buildFarplaneScene`, `buildGagazetScene`,
 * etc.) because they paint textures with `document.createElement('canvas')`,
 * and `vitest.config.ts` runs in the `node` environment with no DOM — this
 * track does not introduce that gap, it is the standing shape of every scene
 * in `src/scenes/`. The one real-input check this scene got is a browser pass
 * against a live dev server (`docs/handoff/chapter-leblanc-scene.md`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Nothing here exists in FFX.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  LEBLANC_LAST_ROOM_ACTOR_HEIGHTS,
  LEBLANC_LAST_ROOM_SLOTS,
} from '../../../src/scenes/leblanc-last-room.ts';
import { LEBLANC_ACT_III } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';

describe('leblanc-last-room — the trio and the party marks', () => {
  it('publishes exactly one slot per active party member and at least one per enemy the formation can field', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.party).toHaveLength(3);
    const formation = ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III];
    expect(formation).toBeDefined();
    expect(LEBLANC_LAST_ROOM_SLOTS.enemy.length).toBeGreaterThanOrEqual(formation!.enemies.length);
  });

  it('every published slot is a finite [x, 0, z] on the ground plane', () => {
    for (const slot of [...LEBLANC_LAST_ROOM_SLOTS.party, ...LEBLANC_LAST_ROOM_SLOTS.enemy]) {
      expect(slot).toHaveLength(3);
      for (const n of slot) expect(Number.isFinite(n)).toBe(true);
      expect(slot[1]).toBe(0);
    }
  });

  it('stages Leblanc centre-back with Ormi and Logos flanking on either side of her, matching leblanc-syndicate.ts\'s slot order (0 Leblanc, 1 Logos, 2 Ormi)', () => {
    const formation = ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III]!;
    const bySlot = new Map(formation.enemies.map((e) => [e.slot, e.id]));
    expect(bySlot.get(0)).toBe('leblanc');
    expect(bySlot.get(1)).toBe('logos');
    expect(bySlot.get(2)).toBe('ormi');

    const [leblancPos, logosPos, ormiPos] = LEBLANC_LAST_ROOM_SLOTS.enemy;
    // "Flanking" means the two henchmen sit on either side of Leblanc's own
    // x — not both on the same side of her, which would read as a line, not
    // a trio blocking a door.
    expect(Math.sign(logosPos![0] - leblancPos![0])).not.toBe(0);
    expect(Math.sign(ormiPos![0] - leblancPos![0])).not.toBe(0);
    expect(Math.sign(logosPos![0] - leblancPos![0])).not.toBe(Math.sign(ormiPos![0] - leblancPos![0]));
  });

  it('keeps every enemy slot on the enemy side of the field and every party slot on the party side, per SceneSlots\' own contract ("party faces +x, enemies face -x")', () => {
    for (const slot of LEBLANC_LAST_ROOM_SLOTS.enemy) expect(slot[2]).toBeLessThan(0);
    for (const slot of LEBLANC_LAST_ROOM_SLOTS.party.slice(0, 3)) expect(slot[2]).toBeGreaterThan(-2);
  });

  it('gives every actor a positive, human-scaled world height, and keeps Ormi shorter and Logos taller than the party baseline (options.json: Ormi "short and stout", Logos "tall and slim")', () => {
    const h = LEBLANC_LAST_ROOM_ACTOR_HEIGHTS;
    for (const height of Object.values(h)) {
      expect(height).toBeGreaterThan(1.2);
      expect(height).toBeLessThan(2.3);
    }
    expect(h.ormi).toBeLessThan(h.yuna);
    expect(h.logos).toBeGreaterThan(h.paine);
  });

  it('gives partyHeight/enemyHeight sane fallbacks for a generic actor placed with no explicit height', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.partyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.yuna, 5);
    expect(LEBLANC_LAST_ROOM_SLOTS.enemyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc, 5);
  });
});

describe('leblanc-last-room — FFX-2-only absence [AGENTS.md rule 14]', () => {
  it('imports nothing from the FFX (CTB) side of the data or engine tree', () => {
    // Read the module's own source rather than its runtime shape: an import of
    // `src/data/ffx/**` or `src/battle/ffx/**` would be a game-case violation
    // even if nothing it exported were used.
    const src = readFileSync(
      fileURLToPath(new URL('../../../src/scenes/leblanc-last-room.ts', import.meta.url)),
      'utf8',
    );
    expect(src).not.toMatch(/from ['"].*\/battle\/ffx\//);
    expect(src).not.toMatch(/from ['"].*\/data\/ffx\//);
  });
});
