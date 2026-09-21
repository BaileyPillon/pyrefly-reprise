import { describe, expect, it } from 'vitest';
import type { Piece, PieceCard } from '../../learn/shared/model.ts';
import { packInventory } from '../../learn/shared/pack.ts';
import type { PackBox, PackedSlot } from '../../learn/shared/pack.ts';

function card(): PieceCard {
  return {
    eyebrow: '',
    body: '',
    claimKind: '',
    facts: [],
    cite: 'fixture-source §1',
    tabs: [],
  };
}

function pick<T>(items: readonly T[], index: number): T {
  const item = items[((index % items.length) + items.length) % items.length];
  if (item === undefined) throw new Error('pick: empty array');
  return item;
}

/** Deterministic pseudo-varied sizes, comfortably above `minCell` and below every box width used below. */
function makePieces(count: number, systemIds: readonly string[]): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const size = 40 + ((i * 37) % 120); // 40..159
    return {
      id: `piece-${i}`,
      systemId: pick(systemIds, i),
      name: `Piece ${i}`,
      kind: 'tile' as const,
      size,
      home: { x: 0, y: 0, z: 0 },
      burst: { x: 0, y: 0, z: 0 },
      card: card(),
    };
  });
}

const EPS = 1e-6;

function assertNoOverlaps(slots: readonly (readonly [string, PackedSlot])[]): void {
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const [idA, a] = slots[i]!;
      const [idB, b] = slots[j]!;
      const overlaps = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      expect(overlaps, `${idA} and ${idB} overlap: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`).toBe(false);
    }
  }
}

function checkPacking(pieces: readonly Piece[], box: PackBox): void {
  const result = packInventory(pieces, box);

  expect(result.slots.size).toBe(pieces.length);

  const entries = [...result.slots.entries()];
  for (const [id, slot] of entries) {
    expect(slot.x, `${id} x >= 0`).toBeGreaterThanOrEqual(-EPS);
    expect(slot.y, `${id} y >= 0`).toBeGreaterThanOrEqual(-EPS);
    expect(slot.x + slot.w, `${id} within width`).toBeLessThanOrEqual(box.width + EPS);
    expect(slot.y + slot.h, `${id} within grown height`).toBeLessThanOrEqual(box.height + result.overflowHeight + EPS);
  }

  assertNoOverlaps(entries);

  // Largest-first within each system: read each group in (y, then x) order and check sizes never increase.
  const bySystem = new Map<string, Piece[]>();
  for (const piece of pieces) {
    const list = bySystem.get(piece.systemId) ?? [];
    list.push(piece);
    bySystem.set(piece.systemId, list);
  }
  for (const [systemId, group] of bySystem) {
    const readingOrder = [...group].sort((a, b) => {
      const slotA = result.slots.get(a.id);
      const slotB = result.slots.get(b.id);
      if (!slotA || !slotB) throw new Error('missing slot');
      return slotA.y !== slotB.y ? slotA.y - slotB.y : slotA.x - slotB.x;
    });
    for (let i = 1; i < readingOrder.length; i += 1) {
      expect(readingOrder[i]!.size, `system ${systemId} stays largest-first`).toBeLessThanOrEqual(
        readingOrder[i - 1]!.size,
      );
    }
  }
}

describe('packInventory: fits at natural size', () => {
  it('places 5 pieces with no overlap, in bounds, largest first per system', () => {
    checkPacking(makePieces(5, ['system-a', 'system-b']), { width: 1600, height: 700, gap: 8, minCell: 24 });
  });
});

describe('packInventory: scale, bounds and order at scale', () => {
  const boxes: readonly PackBox[] = [
    { width: 1600, height: 700, gap: 8, minCell: 24 },
    { width: 390, height: 600, gap: 6, minCell: 24 },
  ];
  const counts = [5, 60, 400];

  for (const box of boxes) {
    for (const count of counts) {
      it(`packs ${count} pieces into a ${box.width}x${box.height} box`, () => {
        checkPacking(makePieces(count, ['system-a', 'system-b', 'system-c']), box);
      });
    }
  }
});

describe('packInventory: group order follows the pieces array', () => {
  it('keeps system A entirely above system B when A appears first', () => {
    const pieces = [
      ...makePieces(4, ['system-a']),
      ...makePieces(4, ['system-b']).map((piece, i) => ({ ...piece, id: `b-${i}`, systemId: 'system-b' })),
    ];
    const result = packInventory(pieces, { width: 1600, height: 900, gap: 8, minCell: 24 });

    const bottomOfA = Math.max(
      ...pieces.filter((p) => p.systemId === 'system-a').map((p) => {
        const slot = result.slots.get(p.id);
        if (!slot) throw new Error('missing slot');
        return slot.y + slot.h;
      }),
    );
    const topOfB = Math.min(
      ...pieces.filter((p) => p.systemId === 'system-b').map((p) => {
        const slot = result.slots.get(p.id);
        if (!slot) throw new Error('missing slot');
        return slot.y;
      }),
    );

    expect(topOfB).toBeGreaterThanOrEqual(bottomOfA);
  });
});

describe('packInventory: overflow', () => {
  it('shrinks toward minCell and reports overflowHeight when even that cannot fit', () => {
    const pieces = makePieces(400, ['system-a', 'system-b', 'system-c']);
    const box: PackBox = { width: 390, height: 200, gap: 6, minCell: 24 };
    const result = packInventory(pieces, box);

    expect(result.slots.size).toBe(400);
    expect(result.overflowHeight).toBeGreaterThan(0);

    for (const [, slot] of result.slots) {
      expect(slot.w).toBeGreaterThanOrEqual(box.minCell - EPS);
    }
  });

  it('reports zero overflow when the natural size already fits', () => {
    const result = packInventory(makePieces(2, ['system-a']), { width: 1600, height: 900, gap: 8, minCell: 24 });
    expect(result.overflowHeight).toBe(0);
  });
});

describe('packInventory: edge cases', () => {
  it('returns an empty result for no pieces', () => {
    const result = packInventory([], { width: 800, height: 600, gap: 8, minCell: 24 });
    expect(result.slots.size).toBe(0);
    expect(result.overflowHeight).toBe(0);
  });
});
