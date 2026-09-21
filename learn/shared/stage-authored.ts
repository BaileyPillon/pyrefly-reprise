/**
 * The stage for a specimen whose pieces carry an **authored** box
 * (`Piece.stage`) — site A, whose three states are approved frames rather
 * than a generic grid (`docs/concepts/atlas/a-boss-atlas/a1`, `a2`, `a3`).
 *
 * The three states this paints, and what the frames ask of each:
 *  - **Assembled (0).** One whole subject at its authored size on a lit
 *    plinth, with a numbered pin on each part. No cards, no tiles.
 *  - **Pulled apart (the middle).** The parts spread across the free stage at
 *    their authored burst sizes, near ones larger with a longer paper shadow
 *    and the farthest faded, each tagged, each threaded to at most three
 *    legible cards with a "+ N more at 100%" note for the rest
 *    (`threads.ts`).
 *  - **Inventory (1).** The catalogue: a flow of named picture tiles and
 *    text chips under per-system headings (`inventory.ts`), laid out and
 *    measured by the browser so a chip is really sized to its own text, and
 *    panned vertically when it does not fit rather than shrunk below 13px.
 *
 * Camera, pointer and keyboard handling stay in `stage.ts`; this module only
 * turns state into DOM.
 */

import type { Piece, Specimen, System } from './model.ts';
import { burstProgress } from './layout.ts';
import type { StageBox } from './region.ts';
import { FREE_STAGE } from './region.ts';
import type { ExplorerState } from './store.ts';
import { visiblePieces } from './store.ts';
import { buildInventory } from './inventory.ts';
import type { MidLayout, ThreadAnchor, ThreadChild } from './threads.ts';
import { layoutMidCards, noteKey, planMidCards, resolveAnchor } from './threads.ts';
import { escapeHtml } from './text.ts';
import { artUrl } from './urls.ts';

/** Fades, as fractions of `explode`. The world hands over to the inventory near the top of the travel. */
const FADE = { cardsIn: 0.08, tagsIn: 0.16, worldOut: [0.72, 0.92], invIn: 0.78 } as const;
/** How far along the burst the pieces stop travelling: past this they hold still and cross-fade into the inventory. */
const HOLD_AT = 0.6;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function ramp(value: number, from: number, to: number): number {
  return to === from ? (value >= to ? 1 : 0) : clamp01((value - from) / (to - from));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function attrs(piece: Piece): string {
  return `data-piece-id="${escapeHtml(piece.id)}" data-system-id="${escapeHtml(piece.systemId)}"`;
}

function colourOf(specimen: Specimen, systemId: string): string {
  return specimen.systems.find((s: System) => s.id === systemId)?.colour ?? '#66627a';
}

/** The union of several boxes, or `undefined` when there are none. */
function union(boxes: readonly StageBox[]): StageBox | undefined {
  if (boxes.length === 0) return undefined;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const b of boxes) {
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export interface AuthoredPainter {
  paint(state: ExplorerState): void;
  destroy(): void;
}

/**
 * Creates the painter. `world` is the camera-transformed layer (stage units,
 * origin at its own top-left); `invHost` sits outside the camera so the
 * inventory's type never scales or tilts.
 */
export function createAuthoredPainter(specimen: Specimen, world: HTMLElement, invHost: HTMLElement): AuthoredPainter {
  /**
   * Art path -> height/width, learned from the images themselves.
   *
   * A painting's box is `width` from the frame and a height the art decides,
   * and the frames record no heights — so the first paint guesses square, the
   * images report their real shape as they load, and the stage redraws. That
   * keeps the plinth under the machine and the cards clear of it without a
   * table of hand-measured aspect ratios that would silently go stale the
   * next time a painting is regenerated.
   */
  const aspects = new Map<string, number>();
  let lastState: ExplorerState | undefined;
  let painting = false;

  /** Records an image's real aspect. Returns true when that is news. */
  function learn(img: HTMLImageElement): boolean {
    const key = img.dataset['art'];
    if (key === undefined || img.naturalWidth === 0) return false;
    const aspect = img.naturalHeight / img.naturalWidth;
    if (aspects.get(key) === aspect) return false;
    aspects.set(key, aspect);
    return true;
  }

  function boxFor(piece: Piece, t: number): StageBox {
    const stage = piece.stage;
    const w = stage === undefined ? piece.size : lerp(stage.width, stage.burstWidth ?? stage.width, t);
    const h = stage?.height ?? w * (piece.art !== undefined ? (aspects.get(piece.art) ?? 1) : 1);
    return { x: lerp(piece.home.x, piece.burst.x, t), y: lerp(piece.home.y, piece.burst.y, t), w, h };
  }

  /**
   * A part's depth cue, from its authored `layer`: the nearer it is, the
   * longer the paper shadow it throws; the farthest one softens and loses a
   * little colour, exactly as the a2 frame draws the tail behind everything.
   */
  function depthFilter(piece: Piece, mid: number, selected: boolean, accent: string): string {
    const layer = piece.stage?.layer ?? 2;
    const offset = (2 + layer * 3.2) * mid;
    const ambient = 12 + layer * 2;
    const far = layer <= 1 ? `saturate(${1 - 0.26 * mid}) brightness(${1 + 0.1 * mid}) blur(${mid}px)` : '';
    // The a2 frame outlines the selected part by stacking four one-direction drop shadows
    // around the cutout, which is the only way to draw a stroke along a PNG's own silhouette.
    const outline = selected
      ? `drop-shadow(2px 0 0 ${accent}) drop-shadow(-2px 0 0 ${accent}) drop-shadow(0 2px 0 ${accent}) drop-shadow(0 -2px 0 ${accent}) `
      : '';
    return `${outline}drop-shadow(${offset}px ${offset}px 0 rgba(11,10,18,.14)) drop-shadow(0 ${ambient}px ${ambient}px rgba(11,10,18,.2)) ${far}`;
  }

  function pieceHtml(piece: Piece, box: StageBox, selected: boolean, mid: number, accent: string): string {
    const flip = piece.stage?.flipX === true ? ' pyx-piece--flip' : '';
    const art = piece.art ?? '';
    const url = escapeHtml(artUrl(art));
    // The accent tint is the art's own silhouette as a mask, so it works for either
    // accent (Yevon gold or pyre pink) without a per-colour filter recipe.
    const tint = selected
      ? `<div class="pyx-piece__tint" style="-webkit-mask-image:url('${url}');mask-image:url('${url}')"></div>`
      : '';
    return `<div class="pyx-piece pyx-piece--painting pyx-piece--authored${flip}${selected ? ' pyx-piece--selected' : ''}" ${attrs(piece)}
      role="button" tabindex="0" aria-label="${escapeHtml(piece.name)}"
      style="left:${box.x}px;top:${box.y}px;width:${box.w}px;z-index:${piece.stage?.layer ?? 2};filter:${depthFilter(piece, mid, selected, accent)}">
      <img class="pyx-piece__img" data-art="${escapeHtml(art)}" src="${url}" alt="">${tint}</div>`;
  }

  /**
   * The lit plinth and the shadow it sits in.
   *
   * The ground line is the **largest** part's own bottom, not the union's: a
   * cutout with a lot of empty canvas under it (a tail that curls up inside a
   * tall PNG) would otherwise push the plinth off the bottom of the stage.
   * Its proportions are the a1 frame's — a plinth as wide as the subject and
   * a fifth as tall, the subject standing just forward of its centre.
   */
  function groundHtml(boxes: readonly StageBox[], mid: number, fade: number): string {
    const all = union(boxes);
    const biggest = [...boxes].sort((a, b) => b.w * b.h - a.w * a.h)[0];
    if (all === undefined || biggest === undefined) return '';
    const w = all.w * 1.02;
    const h = w * 0.19;
    const x = all.x + all.w / 2 - w / 2;
    const y = Math.min(biggest.y + biggest.h - h * 0.46, FREE_STAGE.y + FREE_STAGE.h - h);
    const floor = `<div class="pyx-floor" style="left:${FREE_STAGE.x}px;top:${FREE_STAGE.y + FREE_STAGE.h * 0.45}px;width:${FREE_STAGE.w}px;height:${FREE_STAGE.h * 0.62}px;opacity:${(mid * 0.55 * fade).toFixed(3)}"><i></i></div>`;
    const plinth = `<div class="pyx-plinth" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:${(fade * (1 - mid * 0.15)).toFixed(3)}"></div>`;
    const shade = `<div class="pyx-gshadow" style="left:${x + w * 0.09}px;top:${y + h * 0.24}px;width:${w * 0.82}px;height:${h * 0.44}px;opacity:${fade.toFixed(3)}"></div>`;
    return floor + plinth + shade;
  }

  function badgeHtml(piece: Piece, box: StageBox, pinFade: number, tagFade: number, selected: boolean): string {
    if (piece.badge === undefined) return '';
    const pin =
      pinFade > 0.01
        ? `<span class="pyx-pin" style="left:${box.x + box.w * 0.5 - 13}px;top:${box.y + box.h * 0.45}px;opacity:${pinFade.toFixed(3)}">${escapeHtml(piece.badge)}</span>`
        : '';
    const tag =
      tagFade > 0.01
        ? `<span class="pyx-tag${selected ? ' pyx-tag--sel' : ''}" style="left:${box.x}px;top:${box.y - 24}px;opacity:${tagFade.toFixed(3)}">${escapeHtml(piece.badge)} &middot; ${escapeHtml(piece.name)}</span>`
        : '';
    return pin + tag;
  }

  function midCardHtml(piece: Piece, box: StageBox, selected: boolean, colour: string, fade: number): string {
    const fact = piece.card.facts[0];
    const factLine =
      fact !== undefined ? `<div class="pyx-mcard__f">${escapeHtml(fact.label)} <b>${escapeHtml(fact.value)}</b></div>` : '';
    return `<div class="pyx-mcard${selected ? ' pyx-mcard--sel' : ''}" ${attrs(piece)} role="button" tabindex="0"
      aria-label="${escapeHtml(piece.name)}"
      style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;border-left-color:${escapeHtml(colour)};opacity:${fade.toFixed(3)}">
      <div class="pyx-mcard__n">${escapeHtml(piece.name)}</div>${factLine}</div>`;
  }

  function inventoryHtml(state: ExplorerState, visible: readonly Piece[]): string {
    return buildInventory(specimen, visible)
      .map((group) => {
        const cells = group.cells
          .map((cell) => {
            const sel = state.selectedId === cell.id ? ' pyx-inv--sel' : '';
            const common = `data-piece-id="${escapeHtml(cell.id)}" data-system-id="${escapeHtml(cell.systemId)}" role="button" tabindex="0"`;
            if (cell.kind === 'picture' && cell.art !== undefined) {
              return `<div class="pyx-tile${sel}" ${common} style="border-bottom-color:${escapeHtml(group.colour)}">
                <div class="pyx-tile__im" style="background-image:url('${escapeHtml(artUrl(cell.art))}')"></div>
                <div class="pyx-tile__cap"><span class="pyx-tile__n">${escapeHtml(cell.name)}</span><span class="pyx-tile__h">${escapeHtml(cell.note ?? '')}</span></div></div>`;
            }
            const note = cell.note !== undefined ? `<i>${escapeHtml(cell.note)}</i>` : '';
            return `<span class="pyx-invchip${sel}" ${common} style="--pyx-invchip-c:${escapeHtml(group.colour)}"><b>${escapeHtml(cell.name)}</b>${note}</span>`;
          })
          .join('');
        return `<div class="pyx-inv__g"><div class="pyx-inv__gh"><span class="pyx-inv__dot" style="background:${escapeHtml(group.colour)}"></span><span class="pyx-caps">${escapeHtml(group.name)}</span><span class="pyx-num">${group.count}</span></div><div class="pyx-inv__tiles">${cells}</div></div>`;
      })
      .join('');
  }

  function threadsHtml(
    anchorBoxes: ReadonlyMap<string, StageBox>,
    cardBoxes: ReadonlyMap<string, StageBox>,
    anchorOf: ReadonlyMap<string, string>,
    selectedId: string | null,
    fade: number,
  ): string {
    const lines: string[] = [];
    for (const [cardId, card] of cardBoxes) {
      const anchorId = anchorOf.get(cardId);
      const anchor = anchorId !== undefined ? anchorBoxes.get(anchorId) : undefined;
      if (anchor === undefined) continue;
      const ax = anchor.x + anchor.w / 2;
      const ay = anchor.y + anchor.h * 0.5;
      const toRight = card.x > ax;
      const cx = toRight ? card.x : card.x + card.w;
      const cy = card.y + card.h / 2;
      const hot = selectedId === cardId || selectedId === anchorId;
      const cls = hot ? 'pyx-thread pyx-thread--sel' : 'pyx-thread';
      lines.push(
        `<line class="${cls}" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}"/>` +
          `<circle class="${cls}" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="3"/>` +
          `<circle class="${cls}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2"/>`,
      );
    }
    if (lines.length === 0) return '';
    const box = { x: FREE_STAGE.x - 40, y: FREE_STAGE.y - 40, w: FREE_STAGE.w + 80, h: FREE_STAGE.h + 80 };
    return `<svg class="pyx-threads" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;opacity:${fade.toFixed(3)}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}">${lines.join('')}</svg>`;
  }

  /** One pass. Returns true when it learnt a new image aspect, so the caller can draw again with the real boxes. */
  function paintOnce(state: ExplorerState): boolean {
    const explode = state.explode;
    const t = burstProgress(explode);
    const mid = clamp01(explode / HOLD_AT);
    const worldFade = 1 - ramp(explode, FADE.worldOut[0], FADE.worldOut[1]);
    const cardFade = ramp(explode, FADE.cardsIn, FADE.cardsIn + 0.12) * worldFade;
    const tagFade = ramp(explode, FADE.tagsIn, FADE.tagsIn + 0.12) * worldFade;
    const pinFade = (1 - ramp(explode, 0.02, FADE.tagsIn)) * worldFade;
    const invFade = ramp(explode, FADE.invIn, 1);

    const visible = visiblePieces(specimen, state);
    // Paint order is the authored `layer`, low to high, so the head sits over the body
    // exactly as the frame stacks them (the world is flat: DOM order is the stacking order).
    const paintings = visible
      .filter((p) => p.kind === 'painting' && p.art !== undefined)
      .sort((a, b) => (a.stage?.layer ?? 2) - (b.stage?.layer ?? 2));
    const paintingIds = new Set(paintings.map((p) => p.id));
    const parentById = new Map(specimen.pieces.map((p) => [p.id, p.parentId]));

    const boxes = new Map<string, StageBox>();
    for (const piece of paintings) boxes.set(piece.id, boxFor(piece, t));

    // Which small cards to show, and where — only while the world is still on screen.
    const anchorOf = new Map<string, string>();
    const children: ThreadChild[] = [];
    if (cardFade > 0.01) {
      for (const piece of visible) {
        if (paintingIds.has(piece.id)) continue;
        const anchorId = resolveAnchor(
          piece.id,
          (id) => parentById.get(id),
          (id) => paintingIds.has(id),
        );
        children.push({ id: piece.id, anchorId, size: piece.size });
        if (anchorId !== null) anchorOf.set(piece.id, anchorId);
      }
    }
    const plan = planMidCards(children, 3);
    // The layout keeps clear of each part's own box *plus* the tag above it, so a
    // neighbour's card stack never lands on "2 · LEG".
    const anchors: ThreadAnchor[] = paintings.map((p) => {
      const box = boxes.get(p.id) as StageBox;
      return p.badge === undefined ? { id: p.id, box } : { id: p.id, box: { ...box, y: box.y - 28, h: box.h + 28 } };
    });
    const layout: MidLayout =
      cardFade > 0.01 ? layoutMidCards(anchors, plan, FREE_STAGE) : { boxes: new Map(), notes: new Map() };
    const cardBoxes = layout.boxes;

    const byId = new Map(specimen.pieces.map((p) => [p.id, p]));
    const cardHtml: string[] = [];
    for (const [key, box] of cardBoxes) {
      if (key.startsWith('note::')) continue;
      const piece = byId.get(key);
      if (piece === undefined) continue;
      cardHtml.push(midCardHtml(piece, box, state.selectedId === piece.id, colourOf(specimen, piece.systemId), cardFade));
    }
    for (const [anchorId, count] of layout.notes) {
      const box = cardBoxes.get(noteKey(anchorId));
      if (box === undefined) continue;
      cardHtml.push(
        `<div class="pyx-more" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;opacity:${cardFade.toFixed(3)}">+ ${count} more at 100%</div>`,
      );
    }

    const accent = getComputedStyle(world).getPropertyValue('--pyx-accent-on-paper').trim() || '#b8437e';
    const onlyCards = new Map<string, StageBox>([...cardBoxes].filter(([k]) => !k.startsWith('note::')));
    world.innerHTML =
      groundHtml([...boxes.values()], mid, worldFade) +
      threadsHtml(boxes, onlyCards, anchorOf, state.selectedId, cardFade) +
      paintings
        .map((piece) => pieceHtml(piece, boxes.get(piece.id) as StageBox, state.selectedId === piece.id, mid, accent))
        .join('') +
      paintings.map((piece) => badgeHtml(piece, boxes.get(piece.id) as StageBox, pinFade, tagFade, state.selectedId === piece.id)).join('') +
      cardHtml.join('');
    world.style.opacity = worldFade.toFixed(3);
    world.style.pointerEvents = worldFade > 0.05 ? 'auto' : 'none';

    invHost.innerHTML = invFade > 0.01 ? `<div class="pyx-inv__flow" data-inv-flow>${inventoryHtml(state, visible)}</div>` : '';
    invHost.style.opacity = invFade.toFixed(3);
    invHost.style.pointerEvents = invFade > 0.5 ? 'auto' : 'none';

    let learnedNow = false;
    for (const img of world.querySelectorAll<HTMLImageElement>('img[data-art]')) {
      if (img.complete) learnedNow = learn(img) || learnedNow;
      else img.addEventListener('load', onLoadLater, { once: true });
    }
    return learnedNow;
  }

  function onLoadLater(event: Event): void {
    if (learn(event.target as HTMLImageElement) && lastState !== undefined) repaintLast();
  }

  function repaintLast(): void {
    if (lastState !== undefined) paintOnce(lastState);
  }

  return {
    /** Paints, then paints once more if the first pass is what taught it an image's real shape. */
    paint(state: ExplorerState): void {
      if (painting) return;
      painting = true;
      try {
        lastState = state;
        if (paintOnce(state)) paintOnce(state);
      } finally {
        painting = false;
      }
    },
    destroy(): void {
      lastState = undefined;
      world.innerHTML = '';
      invHost.innerHTML = '';
    },
  };
}
