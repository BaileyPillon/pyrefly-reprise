import { describe, expect, it } from 'vitest';
import {
  laneClearance,
  solveFormation,
  type FormationMember,
} from '../../../src/engine/Formation.ts';

/**
 * Chapter 3 as Bailey photographed it: Braska's Final Aeon and two Yu Pagodas.
 * In the live build both Pagodas were entirely behind the aeon's painting.
 */
const CHAPTER_3: FormationMember[] = [
  { id: 'braskas-final-aeon', height: 4.6 },
  { id: 'yu-pagoda-b', height: 2.1 },
  { id: 'yu-pagoda-c', height: 2.1 },
];

describe('solveFormation', () => {
  it('places every member exactly once', () => {
    const slots = solveFormation(CHAPTER_3);
    expect(slots.map((s) => s.id).sort()).toEqual(
      ['braskas-final-aeon', 'yu-pagoda-b', 'yu-pagoda-c'].sort(),
    );
  });

  it('puts the big fiend behind the small ones', () => {
    const slots = solveFormation(CHAPTER_3);
    const aeon = slots.find((s) => s.id === 'braskas-final-aeon')!;
    for (const pagoda of slots.filter((s) => s.id.startsWith('yu-pagoda'))) {
      // Deeper into the field = more negative z.
      expect(aeon.spot[2]).toBeLessThan(pagoda.spot[2]);
    }
  });

  it('leaves no silhouette crossing another — the defect Bailey reported', () => {
    const clear = laneClearance(solveFormation(CHAPTER_3), CHAPTER_3);
    for (const [id, gap] of clear) {
      expect(gap, `${id} is overlapped by something in front of it`).toBeGreaterThan(0);
    }
  });

  it('spreads the two identical fiends to opposite sides', () => {
    const slots = solveFormation(CHAPTER_3);
    const b = slots.find((s) => s.id === 'yu-pagoda-b')!;
    const c = slots.find((s) => s.id === 'yu-pagoda-c')!;
    expect(Math.abs(b.spot[0] - c.spot[0])).toBeGreaterThan(1.2);
  });

  it('is deterministic — the same field twice is the same field', () => {
    expect(solveFormation(CHAPTER_3)).toEqual(solveFormation(CHAPTER_3));
  });

  it('does not depend on the order the combatants arrive in', () => {
    const shuffled = [CHAPTER_3[2]!, CHAPTER_3[0]!, CHAPTER_3[1]!];
    const a = new Map(solveFormation(CHAPTER_3).map((s) => [s.id, s.spot]));
    const b = new Map(solveFormation(shuffled).map((s) => [s.id, s.spot]));
    for (const [id, spot] of a) expect(b.get(id)).toEqual(spot);
  });

  it('stays inside the lane it is given', () => {
    const lane = { x: [1, 5] as [number, number], z: [-2, -6] as [number, number] };
    for (const s of solveFormation(CHAPTER_3, lane)) {
      expect(s.spot[0]).toBeGreaterThanOrEqual(1);
      expect(s.spot[0]).toBeLessThanOrEqual(5);
      expect(s.spot[2]).toBeLessThanOrEqual(-2);
    }
  });

  it('leaves a lone fiend where the scene put it', () => {
    expect(solveFormation([{ id: 'seymour-flux', height: 4.2 }])).toHaveLength(1);
  });

  describe("Chapter 1 — Seymour Flux and Mortiorchis", () => {
    const CHAPTER_1: FormationMember[] = [
      { id: 'mortiorchis', height: 5.2 },
      { id: 'seymour-flux', height: 3.4 },
    ];
    it('puts Mortiorchis, the larger, behind Seymour', () => {
      const slots = solveFormation(CHAPTER_1);
      const mor = slots.find((s) => s.id === 'mortiorchis')!;
      const flux = slots.find((s) => s.id === 'seymour-flux')!;
      expect(mor.spot[2]).toBeLessThan(flux.spot[2]);
    });
    it('clears both silhouettes', () => {
      for (const gap of laneClearance(solveFormation(CHAPTER_1), CHAPTER_1).values()) {
        expect(gap).toBeGreaterThan(0);
      }
    });
  });

  describe("Chapter 5 — Vegnagun's parts", () => {
    const VEGNAGUN: FormationMember[] = [
      { id: 'vegnagun-body', height: 6.5 },
      { id: 'vegnagun-head', height: 2.4, isPart: true, parentId: 'vegnagun-body' },
      { id: 'vegnagun-leg', height: 2.0, isPart: true, parentId: 'vegnagun-body' },
      { id: 'vegnagun-tail', height: 1.8, isPart: true, parentId: 'vegnagun-body' },
    ];

    it('gives every part its own place', () => {
      const slots = solveFormation(VEGNAGUN);
      expect(slots).toHaveLength(4);
      const xs = slots.filter((s) => s.id !== 'vegnagun-body').map((s) => s.spot[0]);
      expect(new Set(xs).size).toBe(3);
    });

    it('keeps the parts on the machine rather than scattering them', () => {
      const slots = solveFormation(VEGNAGUN);
      const body = slots.find((s) => s.id === 'vegnagun-body')!;
      for (const part of slots.filter((s) => s.id !== 'vegnagun-body')) {
        expect(Math.abs(part.spot[0] - body.spot[0])).toBeLessThan(6);
      }
    });

    it('lifts a part off the floor so it reads as attached, not standing', () => {
      const head = solveFormation(VEGNAGUN).find((s) => s.id === 'vegnagun-head')!;
      expect(head.spot[1]).toBeGreaterThan(0);
    });
  });
});
