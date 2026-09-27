/**
 * FOC16-02 (release 16 focused review, `critic/reviews/fc7f1a20-focused.md`):
 * on the pause CHAPTER tab the dossier (quote and snapshots) sat across
 * Trema's eyes on hero plate B. `dossierPlace.ts` tries the placements in
 * order and keeps the first whose ink clears the face; these tests hold the
 * pure part of that choice. Game case: both (shared pause plumbing); only
 * Chapter XIII's plate (FFX-2) has a face box today.
 */
import { describe, expect, it } from 'vitest';
import {
  CHAPTER_FACE_BOXES,
  chooseDossier,
  DOSSIER_PLACES,
  dossierClears,
  type DossierMeasure,
  type DossierPlace,
} from '../../src/app/screens/pause/dossierPlace.ts';
import { FACE_MARGIN, type Rect } from '../../src/app/screens/pause/faceClear.ts';

/** A face right of centre at 1600x900, where plate B puts Trema's. */
const FACE: Rect = { left: 900, right: 1180, top: 380, bottom: 620 };

const beside: DossierMeasure = {
  // The release 16 frame: quote and snapshots in a third column across the eyes.
  ink: [
    { left: 926, right: 1240, top: 300, bottom: 312 },
    { left: 926, right: 1236, top: 330, bottom: 440 },
    { left: 926, right: 1250, top: 454, bottom: 590 },
  ],
  floor: 686,
  width: 1600,
};
const under: DossierMeasure = {
  // Wrapped under the two columns, on the painting's empty left side.
  ink: [
    { left: 64, right: 380, top: 516, bottom: 530 },
    { left: 64, right: 380, top: 548, bottom: 660 },
    { left: 430, right: 760, top: 548, bottom: 686 },
  ],
  floor: 686,
  width: 1600,
};

function measurer(table: Partial<Record<DossierPlace, DossierMeasure | null>>, calls: DossierPlace[] = []) {
  return (p: DossierPlace): DossierMeasure | null => {
    calls.push(p);
    return table[p] ?? null;
  };
}

describe('the CHAPTER dossier keeps the plate face clear (FOC16-02)', () => {
  it('tries the placements in order, heading last', () => {
    expect(DOSSIER_PLACES).toEqual(['beside', 'under', 'under-lean', 'heading']);
  });

  it('keeps the three columns when they already clear the face', () => {
    const calls: DossierPlace[] = [];
    const far: DossierMeasure = { ...beside, ink: beside.ink.map((r) => ({ ...r, left: r.left - 700, right: r.right - 700 })) };
    expect(chooseDossier(FACE, measurer({ beside: far }, calls))).toBe('beside');
    expect(calls).toEqual(['beside']);
  });

  it('moves the dossier under the columns when beside covers the face', () => {
    expect(dossierClears(FACE, beside)).toBe(false);
    expect(chooseDossier(FACE, measurer({ beside, under }))).toBe('under');
  });

  it('drops the snapshots before it gives up on the quote', () => {
    const tooLow: DossierMeasure = { ...under, ink: [...under.ink.slice(0, 2), { ...under.ink[2]!, bottom: 720 }] };
    const lean: DossierMeasure = { ...under, ink: under.ink.slice(0, 2) };
    expect(chooseDossier(FACE, measurer({ beside, under: tooLow, 'under-lean': lean }))).toBe('under-lean');
  });

  it('falls back to the heading alone, which it never measures', () => {
    const calls: DossierPlace[] = [];
    expect(chooseDossier(FACE, measurer({ beside, under: beside, 'under-lean': beside }, calls))).toBe('heading');
    expect(calls).toEqual(['beside', 'under', 'under-lean']);
  });

  it('counts the face margin, the objective line and the frame edges', () => {
    const near: Rect = { left: FACE.left - FACE_MARGIN + 2, right: FACE.left - 4, top: 400, bottom: 420 };
    expect(dossierClears(FACE, { ink: [near], floor: 686, width: 1600 })).toBe(false);
    const clear: Rect = { ...near, left: near.left - 40, right: FACE.left - FACE_MARGIN - 2 };
    expect(dossierClears(FACE, { ink: [clear], floor: 686, width: 1600 })).toBe(true);
    expect(dossierClears(FACE, { ink: [{ ...clear, bottom: 700 }], floor: 686, width: 1600 })).toBe(false);
    expect(dossierClears(FACE, { ink: [{ ...clear, left: -3 }], floor: 686, width: 1600 })).toBe(false);
  });

  it('has a face box only for Chapter XIII plate B and Chapter X plate B, inside the painting', () => {
    expect(Object.keys(CHAPTER_FACE_BOXES)).toEqual(['ch13-trema', 'ch10-seymour-natus']);
    // Chapter X (FFX only): Natus's face is centred on his plate, inside the painting.
    const n = CHAPTER_FACE_BOXES['ch10-seymour-natus']!;
    expect(n.x0).toBeLessThan(0.5);
    expect(n.x1).toBeGreaterThan(0.5);
    expect(n.y0).toBeLessThan(n.y1);
    const f = CHAPTER_FACE_BOXES['ch13-trema']!;
    expect(f.x0).toBeGreaterThanOrEqual(0);
    expect(f.x1).toBeLessThanOrEqual(1);
    expect(f.x0).toBeLessThan(f.x1);
    expect(f.y0).toBeLessThan(f.y1);
    // Right of centre: the empty side, where the text goes, is the left.
    expect((f.x0 + f.x1) / 2).toBeGreaterThan(0.5);
  });
});
