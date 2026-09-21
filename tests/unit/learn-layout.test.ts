import { describe, expect, it } from 'vitest';
import type { Piece, PieceCard } from '../../learn/shared/model.ts';
import { pieceTransform, stageRotation } from '../../learn/shared/layout.ts';
import type { PieceSlot } from '../../learn/shared/layout.ts';
import type { ViewName } from '../../learn/shared/store.ts';

function card(): PieceCard {
  return {
    eyebrow: 'Structure',
    body: 'A placeholder part for testing.',
    claimKind: 'System overview',
    facts: [],
    cite: 'fixture-source §1',
    tabs: [],
  };
}

const fixturePiece: Piece = {
  id: 'piece-a',
  systemId: 'system-a',
  name: 'Piece A',
  kind: 'painting',
  size: 20,
  home: { x: 0, y: 0, z: 0 },
  burst: { x: 40, y: 30, z: 80 },
  card: card(),
};

const fixtureSlot: PieceSlot = { x: 200, y: 150, w: 60, h: 60 };

describe('pieceTransform: exact endpoints', () => {
  it('is exactly piece.home at explode 0', () => {
    const t = pieceTransform(fixturePiece, fixtureSlot, 0);
    expect(t).toEqual({ x: 0, y: 0, z: 0, scale: 1, rotateY: 0 });
  });

  it('is exactly the slot position with z 0 at explode 1', () => {
    const t = pieceTransform(fixturePiece, fixtureSlot, 1);
    expect(t.x).toBe(fixtureSlot.x);
    expect(t.y).toBe(fixtureSlot.y);
    expect(t.z).toBe(0);
    expect(t.scale).toBe(fixtureSlot.w / fixturePiece.size);
    expect(t.rotateY).toBe(0);
  });

  it('clamps out-of-range explode to the same endpoints', () => {
    expect(pieceTransform(fixturePiece, fixtureSlot, -1)).toEqual(pieceTransform(fixturePiece, fixtureSlot, 0));
    expect(pieceTransform(fixturePiece, fixtureSlot, 2)).toEqual(pieceTransform(fixturePiece, fixtureSlot, 1));
  });
});

describe('pieceTransform: continuity at 0.6', () => {
  it('the burst leg reaches exactly piece.burst (scale 1) at 0.6', () => {
    const t = pieceTransform(fixturePiece, fixtureSlot, 0.6);
    expect(t).toEqual({ x: fixturePiece.burst.x, y: fixturePiece.burst.y, z: fixturePiece.burst.z, scale: 1, rotateY: 0 });
  });

  it('has no seam: values just below and just above 0.6 both approach the 0.6 value', () => {
    const at = pieceTransform(fixturePiece, fixtureSlot, 0.6);
    const justBelow = pieceTransform(fixturePiece, fixtureSlot, 0.6 - 1e-6);
    const justAbove = pieceTransform(fixturePiece, fixtureSlot, 0.6 + 1e-6);

    for (const key of ['x', 'y', 'z', 'scale'] as const) {
      expect(Math.abs(justBelow[key] - at[key])).toBeLessThan(1e-3);
      expect(Math.abs(justAbove[key] - at[key])).toBeLessThan(1e-3);
    }
  });
});

describe('pieceTransform: monotone in progress', () => {
  it('x and y travel monotonically home -> burst -> slot across the full range', () => {
    const samples = Array.from({ length: 41 }, (_, i) => pieceTransform(fixturePiece, fixtureSlot, i / 40));
    for (let i = 1; i < samples.length; i += 1) {
      const previous = samples[i - 1]!;
      const current = samples[i]!;
      expect(current.x).toBeGreaterThanOrEqual(previous.x - 1e-9);
      expect(current.y).toBeGreaterThanOrEqual(previous.y - 1e-9);
    }
  });

  it('z rises toward the burst depth on the first leg, then falls to 0 on the second', () => {
    const firstLeg = Array.from({ length: 13 }, (_, i) => pieceTransform(fixturePiece, fixtureSlot, (i / 12) * 0.6));
    for (let i = 1; i < firstLeg.length; i += 1) {
      expect(firstLeg[i]!.z).toBeGreaterThanOrEqual(firstLeg[i - 1]!.z - 1e-9);
    }

    const secondLeg = Array.from({ length: 13 }, (_, i) => pieceTransform(fixturePiece, fixtureSlot, 0.6 + (i / 12) * 0.4));
    for (let i = 1; i < secondLeg.length; i += 1) {
      expect(secondLeg[i]!.z).toBeLessThanOrEqual(secondLeg[i - 1]!.z + 1e-9);
    }
  });
});

const views: readonly ViewName[] = ['threeQuarter', 'front', 'side', 'back'];

describe('stageRotation: exact endpoints', () => {
  it('holds each view\'s base angle at explode 0', () => {
    expect(stageRotation('threeQuarter', 0)).toBe(45);
    expect(stageRotation('front', 0)).toBe(0);
    expect(stageRotation('side', 0)).toBe(90);
    expect(stageRotation('back', 0)).toBe(180);
  });

  it('reaches exactly 0 (front-on) at explode 1 for every view', () => {
    for (const view of views) {
      expect(stageRotation(view, 1)).toBe(0);
    }
  });
});

describe('stageRotation: continuity and monotonicity', () => {
  it('is continuous at 0.6 for a view with a non-zero base angle', () => {
    const at = stageRotation('back', 0.6);
    const justAbove = stageRotation('back', 0.6 + 1e-6);
    expect(at).toBe(180);
    expect(Math.abs(justAbove - at)).toBeLessThan(1e-3);
  });

  it('eases monotonically toward 0 between 0.6 and 1', () => {
    const samples = Array.from({ length: 13 }, (_, i) => stageRotation('back', 0.6 + (i / 12) * 0.4));
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]!).toBeLessThanOrEqual(samples[i - 1]! + 1e-9);
    }
    expect(samples[samples.length - 1]).toBe(0);
  });
});
