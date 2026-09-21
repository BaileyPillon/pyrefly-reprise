/**
 * The pulled-apart middle of the explode: which small cards hang off which
 * painted part, and where they go.
 *
 * The approved frame `docs/concepts/atlas/a-boss-atlas/a2-exploded-selected.html`
 * sets the rules this module implements. A part shows **at most three**
 * legible cards, each joined to it by a thin thread, and a quiet
 * "+ N more at 100%" note stands in for the rest — a part with fifty
 * abilities draws three of them and says so, rather than fifty unreadable
 * 20-pixel chips. Which three: the largest, by the same `Piece.size` the
 * inventory orders by, so the choice is a real, sourced magnitude rather
 * than array order.
 *
 * Everything here is pure: boxes in, boxes out, no DOM and no specimen
 * lookups, so the rules are testable without a browser.
 */

import type { StageBox } from './region.ts';
import { contains, overlaps } from './region.ts';

/** A painted piece a card can hang from, with the box it occupies on stage. */
export interface ThreadAnchor {
  readonly id: string;
  readonly box: StageBox;
}

/** A candidate card: which anchor it belongs to (already resolved), and how big its subject is. */
export interface ThreadChild {
  readonly id: string;
  readonly anchorId: string | null;
  readonly size: number;
}

export interface MidPlan {
  /** Anchor id -> the children it shows, largest first. An anchor with nothing to show is absent. */
  readonly shown: ReadonlyMap<string, readonly string[]>;
  /** Anchor id -> how many of its children there was no room for. Absent when none were dropped. */
  readonly hidden: ReadonlyMap<string, number>;
  /** Children whose anchor is not on stage (an isolated ability, a hidden system): shown on their own. */
  readonly loose: readonly string[];
}

/**
 * Walks `parentOf` upward from `id` until it reaches a piece `isAnchor`
 * accepts — an ability owned by a Redoubt threads to the Head the Redoubt
 * belongs to, because the Redoubt itself has no painting. Returns `null` when
 * the chain runs out, and stops at the first repeat so a bad `parentId` cycle
 * cannot hang the stage.
 */
export function resolveAnchor(
  id: string,
  parentOf: (pieceId: string) => string | undefined,
  isAnchor: (pieceId: string) => boolean,
): string | null {
  const seen = new Set<string>([id]);
  let current = parentOf(id);
  while (current !== undefined && !seen.has(current)) {
    if (isAnchor(current)) return current;
    seen.add(current);
    current = parentOf(current);
  }
  return null;
}

/** Groups `children` by anchor, keeps the `maxPerAnchor` largest of each, and counts the rest. */
export function planMidCards(children: readonly ThreadChild[], maxPerAnchor: number): MidPlan {
  const byAnchor = new Map<string, ThreadChild[]>();
  const loose: ThreadChild[] = [];

  for (const child of children) {
    if (child.anchorId === null) {
      loose.push(child);
      continue;
    }
    const group = byAnchor.get(child.anchorId);
    if (group) group.push(child);
    else byAnchor.set(child.anchorId, [child]);
  }

  const shown = new Map<string, readonly string[]>();
  const hidden = new Map<string, number>();
  for (const [anchorId, group] of byAnchor) {
    const ordered = [...group].sort((a, b) => b.size - a.size || a.id.localeCompare(b.id));
    const taken = ordered.slice(0, Math.max(0, maxPerAnchor));
    if (taken.length > 0) shown.set(anchorId, taken.map((c) => c.id));
    if (ordered.length > taken.length) hidden.set(anchorId, ordered.length - taken.length);
  }

  return {
    shown,
    hidden,
    loose: [...loose].sort((a, b) => b.size - a.size || a.id.localeCompare(b.id)).slice(0, maxPerAnchor).map((c) => c.id),
  };
}

export interface MidCardMetrics {
  readonly cardWidth: number;
  readonly cardHeight: number;
  readonly gap: number;
  /** Clearance between an anchor's own box and its stack of cards. */
  readonly margin: number;
  /** Height of the "+ N more" line under a stack. */
  readonly noteHeight: number;
}

export const DEFAULT_MID_METRICS: MidCardMetrics = {
  cardWidth: 194,
  cardHeight: 44,
  gap: 8,
  margin: 14,
  noteHeight: 20,
};

/** The key a stack's "+ N more" note is returned under. */
export function noteKey(anchorId: string): string {
  return `note::${anchorId}`;
}

function stackHeight(count: number, hasNote: boolean, m: MidCardMetrics): number {
  return count * m.cardHeight + Math.max(0, count - 1) * m.gap + (hasNote ? m.noteHeight + 4 : 0);
}

function free(candidate: StageBox, obstacles: readonly StageBox[], region: StageBox): boolean {
  return contains(region, candidate) && !obstacles.some((o) => overlaps(candidate, o));
}

/** Euclidean distance from a point to the nearest point of `box` — 0 when the point sits inside it. */
export function distanceToBox(x: number, y: number, box: StageBox): number {
  const dx = Math.max(box.x - x, 0, x - (box.x + box.w));
  const dy = Math.max(box.y - y, 0, y - (box.y + box.h));
  return Math.hypot(dx, dy);
}

/**
 * True when `(x, y)` is at least as close to `own` as to every other part on
 * stage — the rule that keeps a stack from reading as another part's cards
 * (`docs/screenshots/learn/a-55.png` found the Body's stack sitting beside
 * the Head, and vice versa, because nothing enforced this).
 */
function nearestToOwnPart(x: number, y: number, own: ThreadAnchor, anchors: readonly ThreadAnchor[]): boolean {
  const ownDistance = distanceToBox(x, y, own.box);
  return anchors.every((other) => other.id === own.id || distanceToBox(x, y, other.box) >= ownDistance);
}

/** Candidate positions are tried on this lattice, in stage units. */
const SCAN = { x: 16, y: 12 } as const;

/** Where the mid-state cards landed, and what each stack's "+ N more" note should say. */
export interface MidLayout {
  /** Card id -> its box, plus {@link noteKey}(anchorId) -> the note's box for every stack that has one. */
  readonly boxes: ReadonlyMap<string, StageBox>;
  /** Anchor id -> the number its note shows. Larger than the plan's when a crowded stage shortened the stack. */
  readonly notes: ReadonlyMap<string, number>;
}

/**
 * Places each anchor's stack of cards at the **free position nearest to it**:
 * every lattice position inside `region` that clears the parts and the stacks
 * already placed, and stays at least as close to this anchor's own box as to
 * any other part's, is scored by its distance from the anchor's own box, with
 * a nudge toward the side facing away from the stage centre so a part near an
 * edge throws its cards outward, clear of its neighbours, and the best one
 * wins. Anchors are placed largest first, so the part the reader is looking
 * at gets the room it wants and the small ones fit around it.
 *
 * The nearest-to-its-own-part rule is the hard one: a reader takes a card's
 * position as saying which part it belongs to, so a candidate slot closer to
 * a *different* part than to its own is never acceptable, no matter how free
 * it is — the stack shortens instead (the take-fewer loop below), and a stack
 * that still fits nowhere at any length is left out rather than misplaced.
 *
 * Returns a box per card id, plus one under {@link noteKey} per stack that
 * dropped children. A stack that fits nowhere at all is left out rather than
 * dumped on top of something.
 */
export function layoutMidCards(
  anchors: readonly ThreadAnchor[],
  plan: MidPlan,
  region: StageBox,
  metrics: MidCardMetrics = DEFAULT_MID_METRICS,
): MidLayout {
  const placed = new Map<string, StageBox>();
  const notes = new Map<string, number>();
  const obstacles: StageBox[] = anchors.map((a) => a.box);
  const centerX = region.x + region.w / 2;
  const centerY = region.y + region.h / 2;
  const ordered = [...anchors].sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h || a.id.localeCompare(b.id));

  const putStack = (anchorId: string, ids: readonly string[], hiddenCount: number, at: StageBox): void => {
    let y = at.y;
    for (const id of ids) {
      placed.set(id, { x: at.x, y, w: metrics.cardWidth, h: metrics.cardHeight });
      y += metrics.cardHeight + metrics.gap;
    }
    if (hiddenCount > 0) {
      placed.set(noteKey(anchorId), { x: at.x, y: y - metrics.gap + 4, w: metrics.cardWidth, h: metrics.noteHeight });
      notes.set(anchorId, hiddenCount);
    }
    obstacles.push(at);
  };

  for (const anchor of ordered) {
    const wanted = plan.shown.get(anchor.id) ?? [];
    if (wanted.length === 0) continue;
    // The side that faces away from the stage centre, per axis: a part left of centre
    // prefers to throw its cards further left, not back in toward the crowd in the middle.
    const awayX = anchor.box.x + anchor.box.w / 2 < centerX ? -1 : 1;
    const awayY = anchor.box.y + anchor.box.h / 2 < centerY ? -1 : 1;
    const maxX = region.x + region.w - metrics.cardWidth;

    // Ask for the whole stack, then for a shorter one: a crowded stage should still say
    // *something* about every part, and the note under it keeps the count honest either way.
    for (let take = wanted.length; take >= 1; take -= 1) {
      const ids = wanted.slice(0, take);
      const hiddenCount = (plan.hidden.get(anchor.id) ?? 0) + (wanted.length - take);
      const h = stackHeight(take, hiddenCount > 0, metrics);
      const maxY = region.y + region.h - h;

      let chosen: StageBox | undefined;
      let bestScore = Infinity;
      for (let x = region.x; x <= maxX; x += SCAN.x) {
        for (let y = region.y; y <= maxY; y += SCAN.y) {
          const candidate = { x, y, w: metrics.cardWidth, h };
          if (!free(candidate, obstacles, region)) continue;
          // Reject a slot that would read as another part's cards, even if it is otherwise
          // free — checking every card's own centre, not just the stack's overall midpoint,
          // because a tall stack's far end can drift nearer a neighbour even when its
          // midpoint is still closest to its own part.
          let everyCardOwnedByThisAnchor = true;
          for (let i = 0; i < take && everyCardOwnedByThisAnchor; i += 1) {
            const cardCy = y + i * (metrics.cardHeight + metrics.gap) + metrics.cardHeight / 2;
            if (!nearestToOwnPart(x + metrics.cardWidth / 2, cardCy, anchor, anchors)) everyCardOwnedByThisAnchor = false;
          }
          if (!everyCardOwnedByThisAnchor) continue;
          const cx = x + metrics.cardWidth / 2;
          const cy = y + h / 2;
          const dx = cx - (anchor.box.x + anchor.box.w / 2);
          const dy = cy - (anchor.box.y + anchor.box.h / 2);
          // Distance from the part, with a small discount for the side that faces away from the middle.
          const score =
            Math.hypot(dx, dy) -
            (Math.sign(dx) === awayX ? metrics.margin * 1.5 : 0) -
            (Math.sign(dy) === awayY ? metrics.margin * 1.5 : 0);
          if (score < bestScore) {
            bestScore = score;
            chosen = candidate;
          }
        }
      }

      if (chosen !== undefined) {
        putStack(anchor.id, ids, hiddenCount, chosen);
        break;
      }
    }
  }

  // Loose cards (an isolated ability, or one whose part is hidden) stack at the region's centre.
  if (plan.loose.length > 0) {
    const h = stackHeight(plan.loose.length, false, metrics);
    const at = {
      x: region.x + (region.w - metrics.cardWidth) / 2,
      y: region.y + Math.max(0, (region.h - h) / 2),
      w: metrics.cardWidth,
      h,
    };
    let y = at.y;
    for (const id of plan.loose) {
      placed.set(id, { x: at.x, y, w: metrics.cardWidth, h: metrics.cardHeight });
      y += metrics.cardHeight + metrics.gap;
    }
  }

  return { boxes: placed, notes };
}
