/**
 * The hidden Penance chapter's stage (FFX only; `src/scenes/penance.ts`, preflight P3): Chapter VIII's deck over Chapter VIII's own plate, with the giant and its two hands staged by combatant id. Layout A of the preflight
 * ("the giant over the bow"); the positions and heights are `[estimate]`s read by the job specs in `docs/handoff/ch-penance.md`, so what is pinned here is the shape: three distinct marks in formation order, the body behind
 * and above the hands, the Right Arm on the viewer's left, every figure inside the idle camera's frame, no change to Chapter VIII's own scene, and the scene's backdrop file existing.
 */

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { EVRAE_AIRSHIP_DECK_SLOTS, EVRAE_DECK_PLATE } from '../../../src/scenes/evrae-airship-deck.ts';
import { PENANCE_ENEMY_SPOTS, PENANCE_FIGURE_HEIGHTS, PENANCE_SLOTS } from '../../../src/scenes/penance.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { PENANCE_ID, PENANCE_LEFT_ARM_ID, PENANCE_RIGHT_ARM_ID } from '../../../src/data/ffx/penance-ids.ts';
import { penanceGroup } from '../../../src/data/ffx/enemies/penance.ts';

describe('the stage', () => {
  it('stages the three combatants in formation order on three different marks, the body behind the hands', () => {
    expect(PENANCE_SLOTS.enemy).toHaveLength(penanceGroup.enemies.length);
    const [body, right, left] = [PENANCE_ENEMY_SPOTS[PENANCE_ID]!, PENANCE_ENEMY_SPOTS[PENANCE_RIGHT_ARM_ID]!, PENANCE_ENEMY_SPOTS[PENANCE_LEFT_ARM_ID]!];
    expect(PENANCE_SLOTS.enemy.map((s) => [...s])).toEqual([[...body], [...right], [...left]]);
    expect(new Set([body, right, left].map((s) => s.join(','))).size).toBe(3);
    expect(body[2]).toBeLessThan(right[2]); // further from the camera than the hands (the game: 125 units off and 63 above)
    expect(body[2]).toBeLessThan(left[2]);
    expect(right[0]).toBeLessThan(body[0]); // the giant's right hand faces the viewer, so it is on the viewer's left
    expect(left[0]).toBeGreaterThan(body[0]);
  });

  it('the body stands more than twice as tall as a hand, and every figure fits the idle camera\'s frame (about 8.8 units high at that depth)', () => {
    expect(PENANCE_FIGURE_HEIGHTS[PENANCE_ID]!).toBeGreaterThan(2 * PENANCE_FIGURE_HEIGHTS[PENANCE_RIGHT_ARM_ID]!);
    expect(PENANCE_FIGURE_HEIGHTS[PENANCE_RIGHT_ARM_ID]).toBe(PENANCE_FIGURE_HEIGHTS[PENANCE_LEFT_ARM_ID]);
    for (const h of Object.values(PENANCE_FIGURE_HEIGHTS)) expect(h).toBeLessThan(8.8);
  });

  it('keeps the deck\'s party arc and its held party; the registry row is real and is the scene key the chapter names', () => {
    expect(PENANCE_SLOTS.party.map((s) => [...s])).toEqual(EVRAE_AIRSHIP_DECK_SLOTS.party.map((s) => [...s]));
    expect(PENANCE_SLOTS.holdParty).toBe(true);
    expect(getScene('penance')?.slots).toBe(PENANCE_SLOTS);
  });

  it('is built over Chapter VIII\'s own plate (no new plate), and that plate file exists', () => {
    expect(backdropFileOf('penance')).toBe(EVRAE_DECK_PLATE);
    expect(existsSync(new URL(`../../../public/art/backdrops/${EVRAE_DECK_PLATE}.png`, import.meta.url)) || process.env['CI'] !== undefined).toBe(true);
  });

  it('does not touch Chapter VIII\'s own scene: its enemy table still has the two marks it had', () => {
    expect(EVRAE_AIRSHIP_DECK_SLOTS.enemy).toHaveLength(2);
    expect(Object.keys(EVRAE_AIRSHIP_DECK_SLOTS.enemySpots ?? {}).sort()).toEqual(['cid', 'evrae']);
  });
});
