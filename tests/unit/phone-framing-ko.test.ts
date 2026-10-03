/**
 * D-249 Q12 (Bailey 2026-09-27, "all of your recommendations"; FFX-2 Chapter XI only): on the Fallen
 * Aeons road a knocked-out girl weighs less in the upright phone's framing, so the slide follows the
 * girls still fighting. Every other chapter keeps the approved 60 percent framing.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { FRAME_WEIGHTS, KO_FRAMING_SCOPE, bestLeft, framedIds, koFramingChapter } from '../../src/ui/common/phoneFraming.ts';
import { ROAD_SHIVA, roadAnimaGroup, roadShivaGroup, roadSistersGroup } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';

const board = (game: 'ffx' | 'ffx2', enemyIds: string[], ko: string[]): BattleState =>
  ({
    game,
    activeIds: ['yuna', 'rikku', 'paine'],
    enemyIds,
    aeonId: null,
    combatants: {
      yuna: { alive: !ko.includes('yuna'), hp: ko.includes('yuna') ? 0 : 900 },
      rikku: { alive: !ko.includes('rikku'), hp: ko.includes('rikku') ? 0 : 900 },
      paine: { alive: !ko.includes('paine'), hp: ko.includes('paine') ? 0 : 900 },
      ...Object.fromEntries(enemyIds.map((id) => [id, { alive: true, hp: 100 }])),
    },
  }) as unknown as BattleState;

describe('a knocked-out girl weighs less on the Chapter XI road only (D-249 Q12)', () => {
  it('the scope is exactly the road’s enemies, read off the shipped groups', () => {
    const ids = [roadShivaGroup, roadSistersGroup, roadAnimaGroup].flatMap((g) => g.enemies.map((e) => e.id));
    expect([...KO_FRAMING_SCOPE].sort()).toEqual([...ids].sort());
    expect(ROAD_SHIVA).toBe('ffx2-road-shiva');
  });

  it('weighs the fallen girl FRAME_WEIGHTS.ko in Chapter XI, at every link, and the actor and the living as before', () => {
    for (const enemy of ['x2-shiva', 'sandy', 'x2-anima']) {
      const w = Object.fromEntries(framedIds(board('ffx2', [enemy], ['paine']), 'yuna'));
      expect(w['paine'], enemy).toBe(FRAME_WEIGHTS.ko);
      expect(w['yuna']).toBe(FRAME_WEIGHTS.actor);
      expect(w['rikku']).toBe(FRAME_WEIGHTS.party);
    }
    expect(FRAME_WEIGHTS.ko).toBeLessThan(FRAME_WEIGHTS.party);
    expect(FRAME_WEIGHTS.ko).toBeGreaterThan(FRAME_WEIGHTS.enemy);
  });

  it('changes nothing in any other chapter: the same fallen girl keeps the party weight', () => {
    for (const [game, enemies] of [['ffx2', ['vegnagun-leg']], ['ffx2', ['bahamut']], ['ffx', ['seymour-flux']]] as const) {
      const state = board(game, [...enemies], ['paine']);
      expect(koFramingChapter(state), enemies[0]).toBe(false);
      expect(Object.fromEntries(framedIds(state, 'yuna'))['paine'], enemies[0]).toBe(FRAME_WEIGHTS.party);
    }
    // An FFX board never reaches the scope, even if an id collided.
    expect(koFramingChapter(board('ffx', ['x2-shiva'], ['paine']))).toBe(false);
  });

  it('with nobody down the road frames exactly as before, and a summoned aeon is untouched', () => {
    const up = framedIds(board('ffx2', ['x2-shiva'], []), 'yuna');
    expect(up.map(([, w]) => w)).toEqual([FRAME_WEIGHTS.actor, FRAME_WEIGHTS.party, FRAME_WEIGHTS.party, FRAME_WEIGHTS.enemy]);
    expect(framedIds({ ...board('ffx2', ['x2-shiva'], ['paine']), aeonId: 'valefor' }, 'yuna')[0]).toEqual(['valefor', FRAME_WEIGHTS.party]);
  });

  it('the slide follows the girls still fighting: a fallen girl at the edge no longer drags it', () => {
    // A 390 wide window on a 924 canvas. Paine lies at the far left; Yuna (acting), Rikku and the boss are to the right.
    const figures = (paine: number) => [
      { x: 0, w: 100, weight: paine },
      { x: 120, w: 80, weight: FRAME_WEIGHTS.actor },
      { x: 220, w: 80, weight: FRAME_WEIGHTS.party },
      { x: 330, w: 200, weight: FRAME_WEIGHTS.boss },
    ];
    const base = { view: 390, canvas: 924, home: 0 };
    const equal = bestLeft({ ...base, figures: figures(FRAME_WEIGHTS.party) });
    const lowered = bestLeft({ ...base, figures: figures(FRAME_WEIGHTS.ko) });
    expect(equal, 'at the party weight the slide holds Paine in view').toBe(0);
    expect(lowered, 'lowered, it moves toward the fighters and the boss').toBeLessThan(equal);
    expect(120 + lowered).toBeGreaterThanOrEqual(0); // Yuna and Rikku stay whole
    expect(220 + 80 + lowered).toBeLessThanOrEqual(390);
  });
});
