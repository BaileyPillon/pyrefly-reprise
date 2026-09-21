import { describe, expect, it } from 'vitest';
import type { MidCardMetrics, ThreadAnchor, ThreadChild } from '../../learn/shared/threads.ts';
import { distanceToBox, layoutMidCards, noteKey, planMidCards, resolveAnchor } from '../../learn/shared/threads.ts';
import type { StageBox } from '../../learn/shared/region.ts';
import { contains, FREE_STAGE, overlaps } from '../../learn/shared/region.ts';
import { buildChapterSpecimen } from '../../learn/atlas/data.ts';
import { burstProgress } from '../../learn/shared/layout.ts';

const METRICS: MidCardMetrics = { cardWidth: 100, cardHeight: 40, gap: 10, margin: 10, noteHeight: 20 };
const REGION: StageBox = { x: -400, y: -300, w: 800, h: 600 };

function child(id: string, anchorId: string | null, size: number): ThreadChild {
  return { id, anchorId, size };
}

describe('resolveAnchor', () => {
  const parents: Record<string, string | undefined> = {
    'ability-x': 'redoubt',
    redoubt: 'head',
    head: undefined,
    orphan: 'missing',
  };
  const parentOf = (id: string): string | undefined => parents[id];

  it('walks past a parent that is not itself an anchor', () => {
    expect(resolveAnchor('ability-x', parentOf, (id) => id === 'head')).toBe('head');
  });

  it('returns the first ancestor that is an anchor', () => {
    expect(resolveAnchor('ability-x', parentOf, (id) => id === 'redoubt' || id === 'head')).toBe('redoubt');
  });

  it('returns null when the chain runs out', () => {
    expect(resolveAnchor('orphan', parentOf, () => false)).toBeNull();
    expect(resolveAnchor('head', parentOf, () => true)).toBeNull();
  });

  it('stops on a cycle instead of hanging', () => {
    const cyclic: Record<string, string> = { a: 'b', b: 'a' };
    expect(resolveAnchor('a', (id) => cyclic[id], () => false)).toBeNull();
  });
});

describe('planMidCards', () => {
  const children = [
    child('c1', 'head', 10),
    child('c2', 'head', 50),
    child('c3', 'head', 30),
    child('c4', 'head', 40),
    child('c5', 'tail', 5),
    child('loose', null, 7),
  ];

  it('keeps the largest children of each anchor, in descending size', () => {
    expect(planMidCards(children, 3).shown.get('head')).toEqual(['c2', 'c4', 'c3']);
  });

  it('counts the ones it dropped, and only those', () => {
    const plan = planMidCards(children, 3);
    expect(plan.hidden.get('head')).toBe(1);
    expect(plan.hidden.has('tail')).toBe(false);
  });

  it('separates children whose anchor is not on stage', () => {
    expect(planMidCards(children, 3).loose).toEqual(['loose']);
  });

  it('breaks a size tie by id, so the same data always draws the same cards', () => {
    const tied = [child('b', 'head', 1), child('a', 'head', 1), child('c', 'head', 1)];
    expect(planMidCards(tied, 2).shown.get('head')).toEqual(['a', 'b']);
  });
});

describe('layoutMidCards', () => {
  const anchor = (id: string, box: StageBox): ThreadAnchor => ({ id, box });

  it('stacks a parent’s cards in order, one card height plus a gap apart', () => {
    const anchors = [anchor('head', { x: -50, y: -50, w: 100, h: 100 })];
    const plan = planMidCards([child('a', 'head', 3), child('b', 'head', 2)], 3);
    const { boxes } = layoutMidCards(anchors, plan, REGION, METRICS);
    const a = boxes.get('a');
    const b = boxes.get('b');
    expect(a).toBeDefined();
    expect(b?.x).toBe(a?.x);
    expect((b?.y ?? 0) - (a?.y ?? 0)).toBe(METRICS.cardHeight + METRICS.gap);
  });

  it('never overlaps a part, another stack, or the edge of the region', () => {
    const anchors = [
      anchor('head', { x: -300, y: -250, w: 200, h: 160 }),
      anchor('body', { x: -60, y: -80, w: 240, h: 220 }),
      anchor('tail', { x: 180, y: -260, w: 140, h: 120 }),
    ];
    const plan = planMidCards(
      ['head', 'body', 'tail'].flatMap((id) => [child(`${id}-1`, id, 3), child(`${id}-2`, id, 2), child(`${id}-3`, id, 1)]),
      3,
    );
    const { boxes } = layoutMidCards(anchors, plan, REGION, METRICS);
    const cards = [...boxes.entries()].filter(([key]) => !key.startsWith('note::')).map(([, box]) => box);
    expect(cards.length).toBe(9);
    for (const card of cards) {
      expect(contains(REGION, card)).toBe(true);
      for (const a of anchors) expect(overlaps(card, a.box)).toBe(false);
    }
  });

  it('emits a note box and its count for a stack that dropped children', () => {
    const anchors = [anchor('head', { x: -50, y: -50, w: 100, h: 100 })];
    const plan = planMidCards([1, 2, 3, 4, 5].map((n) => child(`c${n}`, 'head', n)), 3);
    const { boxes, notes } = layoutMidCards(anchors, plan, REGION, METRICS);
    expect(notes.get('head')).toBe(2);
    expect(boxes.get(noteKey('head'))).toBeDefined();
  });

  it('shortens a stack rather than dropping it when the stage is crowded, and says so in the note', () => {
    // A region with room for exactly one card beside the part.
    const tight: StageBox = { x: 0, y: 0, w: 240, h: 64 };
    const anchors = [anchor('head', { x: 0, y: 0, w: 100, h: 64 })];
    const plan = planMidCards([child('a', 'head', 3), child('b', 'head', 2), child('c', 'head', 1)], 3);
    const { boxes, notes } = layoutMidCards(anchors, plan, tight, METRICS);
    expect(boxes.get('a')).toBeDefined();
    expect(boxes.get('b')).toBeUndefined();
    expect(notes.get('head')).toBe(2);
  });

  it('places a loose card even with no anchors at all', () => {
    const plan = planMidCards([child('loose', null, 1)], 3);
    const { boxes } = layoutMidCards([], plan, REGION, METRICS);
    expect(contains(REGION, boxes.get('loose') as StageBox)).toBe(true);
  });
});

/** Asserts every card `boxes` placed for `anchor` reads as belonging to it, not to a neighbour. */
function expectStacksNearestOwnPart(
  anchors: readonly ThreadAnchor[],
  plan: ReturnType<typeof planMidCards>,
  boxes: ReadonlyMap<string, StageBox>,
): void {
  for (const anchor of anchors) {
    for (const id of plan.shown.get(anchor.id) ?? []) {
      const box = boxes.get(id);
      if (box === undefined) continue; // a crowded stage may shorten or drop a stack; nothing to check then
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      const ownDistance = distanceToBox(cx, cy, anchor.box);
      for (const other of anchors) {
        if (other.id === anchor.id) continue;
        expect(distanceToBox(cx, cy, other.box), `${id} (${anchor.id}'s card) vs "${other.id}"`).toBeGreaterThanOrEqual(
          ownDistance,
        );
      }
    }
  }
}

describe('layoutMidCards keeps a stack beside its own part', () => {
  const anchor = (id: string, box: StageBox): ThreadAnchor => ({ id, box });

  it('never places a stack nearer to a different part than to its own, even when a nearby part invites it', () => {
    // Two parts on the same side of the region's centre, close enough together that the
    // old "nudge toward the middle" bias walked each one's cards toward the *other* part —
    // exactly the bug docs/screenshots/learn/a-55.png caught (the Body's cards ending up
    // beside the Head, and the Head's beside the Body).
    const anchors = [anchor('near-left', { x: -260, y: -60, w: 100, h: 120 }), anchor('near-right', { x: -40, y: -60, w: 100, h: 120 })];
    const plan = planMidCards(
      ['near-left', 'near-right'].flatMap((id) => [child(`${id}-1`, id, 3), child(`${id}-2`, id, 2), child(`${id}-3`, id, 1)]),
      3,
    );
    const { boxes } = layoutMidCards(anchors, plan, REGION, METRICS);
    expect(plan.shown.get('near-left')?.every((id) => boxes.has(id))).toBe(true);
    expect(plan.shown.get('near-right')?.every((id) => boxes.has(id))).toBe(true);
    expectStacksNearestOwnPart(anchors, plan, boxes);
  });

  it('holds for a wider spread of parts too, with stacks free of every part and each other', () => {
    const anchors = [
      anchor('head', { x: -300, y: -250, w: 200, h: 160 }),
      anchor('body', { x: -60, y: -80, w: 240, h: 220 }),
      anchor('tail', { x: 180, y: -260, w: 140, h: 120 }),
    ];
    const plan = planMidCards(
      ['head', 'body', 'tail'].flatMap((id) => [child(`${id}-1`, id, 3), child(`${id}-2`, id, 2), child(`${id}-3`, id, 1)]),
      3,
    );
    const { boxes } = layoutMidCards(anchors, plan, REGION, METRICS);
    expectStacksNearestOwnPart(anchors, plan, boxes);
  });
});

describe('layoutMidCards on the real chapter 5 specimen', () => {
  // Real pixel dimensions of `public/art/characters/<id>/idle.png`, read straight from each
  // file's own PNG header since vitest has no image loader to learn them from — the same
  // aspect `stage-authored.ts`'s `aspects` map ends up holding once a browser loads the art.
  const ASPECT: Record<string, number> = {
    'vegnagun-head': 832 / 1216,
    'vegnagun-tail': 822 / 1176,
    'vegnagun-body': 827 / 1213,
    'vegnagun-leg': 1175 / 777,
    shuyin: 1136 / 694,
  };

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  it('keeps every stack nearer to its own part than to any other, at the a-55 explode state', () => {
    const specimen = buildChapterSpecimen('ffx2-vegnagun-shuyin');
    const t = burstProgress(0.55);
    const paintings = specimen.pieces.filter((p) => p.kind === 'painting' && p.stage !== undefined);
    const paintingIds = new Set(paintings.map((p) => p.id));

    const anchors: ThreadAnchor[] = paintings.map((piece) => {
      const stage = piece.stage;
      if (stage === undefined) throw new Error('unreachable: filtered above');
      const w = lerp(stage.width, stage.burstWidth ?? stage.width, t);
      const h = w * (ASPECT[piece.id] ?? 1);
      const box = { x: lerp(piece.home.x, piece.burst.x, t), y: lerp(piece.home.y, piece.burst.y, t), w, h };
      // `stage-authored.ts` grows a badged part's box upward by 28 units, so a neighbour's
      // stack keeps clear of the "N · Name" tag above it too; every chapter-5 part has one.
      return { id: piece.id, box: piece.badge === undefined ? box : { ...box, y: box.y - 28, h: box.h + 28 } };
    });

    const parentById = new Map(specimen.pieces.map((p) => [p.id, p.parentId]));
    const children: ThreadChild[] = specimen.pieces
      .filter((p) => !paintingIds.has(p.id))
      .map((p) => ({
        id: p.id,
        anchorId: resolveAnchor(p.id, (id) => parentById.get(id), (id) => paintingIds.has(id)),
        size: p.size,
      }));

    const plan = planMidCards(children, 3);
    const { boxes } = layoutMidCards(anchors, plan, FREE_STAGE);

    // The point of the fix: a reader takes a card's position as saying which part it
    // belongs to, so every stack this produced must actually be nearest its own part.
    expectStacksNearestOwnPart(anchors, plan, boxes);
  });
});
