/**
 * `learn/studio/rules.ts` — the 137-rule inventory ported from the mockup
 * round's `inventory.mjs`, and `learn/studio/specimen.ts` building on top of
 * it and `trace.ts`'s real engine trace.
 */

import { describe, expect, it } from 'vitest';
import { STUDIO_COMPONENTS, STUDIO_RULES, rulesForComponent, type StudioComponentId } from '../../learn/studio/rules.ts';
import { runExampleTurn } from '../../learn/studio/trace.ts';
import { buildTurnSpecimen } from '../../learn/studio/specimen.ts';

/** The counts `inventory.mjs` verified in the approved mockup frames (`b3-inventory.png`). */
const EXPECTED_COUNTS: Record<StudioComponentId, number> = {
  turn: 8,
  command: 13,
  hit: 6,
  damage: 34,
  element: 10,
  status: 37,
  overdrive: 18,
  boss: 11,
};

describe('STUDIO_RULES: every rule is sourced', () => {
  it('has a non-empty id, component, name, line and cite on every rule', () => {
    expect(STUDIO_RULES.length).toBeGreaterThan(0);
    for (const rule of STUDIO_RULES) {
      expect(rule.id.trim().length).toBeGreaterThan(0);
      expect(rule.component.trim().length).toBeGreaterThan(0);
      expect(rule.name.trim().length).toBeGreaterThan(0);
      expect(rule.line.trim().length).toBeGreaterThan(0);
      expect(rule.cite.trim().length).toBeGreaterThan(0);
    }
  });

  it('has every rule id unique', () => {
    const ids = new Set(STUDIO_RULES.map((r) => r.id));
    expect(ids.size).toBe(STUDIO_RULES.length);
  });

  it('totals 137 rules, matching the mockup round\'s verified inventory', () => {
    expect(STUDIO_RULES.length).toBe(137);
  });

  it('matches the per-component counts the approved mockup frame shows', () => {
    for (const component of STUDIO_COMPONENTS) {
      const count = rulesForComponent(component.id).length;
      expect(count).toBe(EXPECTED_COUNTS[component.id]);
    }
    const total = STUDIO_COMPONENTS.reduce((sum, c) => sum + rulesForComponent(c.id).length, 0);
    expect(total).toBe(STUDIO_RULES.length);
  });

  it('has exactly the eight components, in the approved display order', () => {
    expect(STUDIO_COMPONENTS.map((c) => c.id)).toEqual([
      'turn',
      'command',
      'hit',
      'damage',
      'element',
      'status',
      'overdrive',
      'boss',
    ]);
  });
});

describe('buildTurnSpecimen', () => {
  it('builds without throwing, with computed system counts', () => {
    const trace = runExampleTurn({ seed: 1 });
    const specimen = buildTurnSpecimen(trace, STUDIO_RULES);

    expect(specimen.systems).toHaveLength(8);
    expect(specimen.pieces.length).toBe(8 + STUDIO_RULES.length);

    const summedCounts = specimen.systems.reduce((sum, s) => sum + s.count, 0);
    expect(summedCounts).toBe(specimen.pieces.length);

    for (const system of specimen.systems) {
      const expected = 1 + EXPECTED_COUNTS[system.id as StudioComponentId];
      expect(system.count).toBe(expected);
    }
  });

  it('gives every piece a card with a non-empty cite', () => {
    const trace = runExampleTurn({ seed: 1 });
    const specimen = buildTurnSpecimen(trace, STUDIO_RULES);
    for (const piece of specimen.pieces) {
      expect(piece.card.cite.trim().length).toBeGreaterThan(0);
    }
  });
});
