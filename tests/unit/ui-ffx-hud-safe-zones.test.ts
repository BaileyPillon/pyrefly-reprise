// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { menuOwnsCancel } from '../../src/ui/common/menuCancel.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import {
  ADVISOR_CHIP_RESERVE,
  advisorChipDock,
  advisorZone,
  CHIP_WIDTH,
  GAP,
  MAX_ADVISOR_HEIGHT,
  MAX_ADVISOR_WIDTH,
  MIN_ADVISOR_HEIGHT,
  MIN_ADVISOR_WIDTH,
  NARROW_ADVISOR_WIDTH,
  SKEW,
  SPRITE_FOOT_MARGIN_RATIO,
  SPRITE_HALF_WIDTH_RATIO,
  SPRITE_TOP_MARGIN_RATIO,
  type AdvisorZone,
  type AdvisorZoneInput,
  type Rect,
} from '../../src/ui/ffx/hudSafeZones.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { openKimahriRage } from '../../src/ui/ffx/minigames/index.ts';

/**
 * The fix-3 round's two HUD guarantees, both from Bailey's Chapter 1 capture:
 *
 * 1. **No title slab outlives its decision.** An Overdrive picker's ivory head
 *    stayed on the field through the next character's turn, printed over the
 *    `G GUIDE` chip and the Sensor card.
 * 2. **No optional panel lands on a fighter.** The advisor card sat across
 *    Tidus and Kimahri because it was measured against the HUD's panels and
 *    knows nothing about the party standing between them.
 *
 * The zone arithmetic is pinned against the rects measured live at 1600x900 on
 * the 640x360 grid (`docs/handoff/fix3-ffx-hud.md` has the run and the raw
 * numbers), so a later change to a party slot or a HUD rail that breaks the
 * guarantee fails here rather than in a screenshot.
 */

// ---------------------------------------------------------------- measured

/**
 * The always-on chrome, identical in all three FFX chapters.
 *
 * **Re-measured from the round-02 gate's own run** (the adversarial pass drove
 * the built build with real keyboard input at four viewports and dumped every
 * box; `docs/screenshots/fix3/critic-ffx-hud/*.json`). The fixture it replaced
 * had the enemy-intent slab at x 344..494, which is where it sits on a *mock*
 * screen — on the real one it hangs at x 165..326, the band directly above the
 * party's heads. Every zone test in this file passed against that fixture while
 * the shipped card was printed across Chapter 2's whole party, which is the
 * single most useful thing the gate proved about this file.
 */
const CHROME = {
  // `.ig-cmd-stack`, at its tallest: the top-level menu with `MAX_VISIBLE_ROWS`
  // rows. **Not** the old `.ffx-cmd-area` union, whose top edge was the help
  // slab's 131 in every state.
  cmdArea: { left: 30.4, top: 166.4, right: 217.6, bottom: 334.4 },
  // The help slab's fixed slot — `FFXBattleHud.CMD_INFO_SLOT`, painted box.
  cmdInfo: { left: 24, top: 121, right: 196, bottom: 154 },
  partyStatus: { left: 402.8, top: 258.4, right: 616.8, bottom: 348 },
  // The rail now ends a GAP above the help slab's slot rather than a clearance
  // above the command area, so it is the same height in every state.
  guide: { left: 21.2, top: 44, right: 153.2, bottom: 115 },
  sensor: { left: 426.8, top: 166, right: 545.2, bottom: 253.2 },
  ctb: { left: 547.6, top: 49.6, right: 620.4, bottom: 200.4 },
  // FFX ships the read-out folded (`FFXBattleHud`'s `readVisible`), so what is
  // on screen by default is this chip, docked on the CTB queue's top-right.
  intentChip: { left: 566.8, top: 38.8, right: 618.8, bottom: 46.4 },
} as const;

/**
 * Where `.ffx-sensor` sat before round 03 moved it: x 200..300, y 24..102.
 *
 * Kept as a fixture because the solver must go on handling a plate in the band
 * above the party — a later scene, or FFX-2's own card, can still put one
 * there. What changed is where the game puts the plate, not the arithmetic.
 */
const SENSOR_IN_SHELF: Rect = { left: 191.7, top: 24, right: 308.3, bottom: 102 };

/**
 * The enemy-intent slab **as the player sees it after pressing `E`**, measured
 * on the gate build at 1600x900 at each chapter's first decision.
 *
 * It is not in `LIVE` below, because FFX no longer ships it open: 150 x 119
 * grid px in the one band wide enough for the advisor card is the reason
 * Chapter 1's card had nowhere to stand. It is exercised here so that the
 * solver still answers honestly for a player who opens it.
 */
const INTENT_OPEN: Record<string, Rect> = {
  'seymour-flux': { left: 165.2, top: 12.4, right: 315.2, bottom: 131.6 },
  yunalesca: { left: 176.4, top: 12.4, right: 326.4, bottom: 131.6 },
  'braskas-final-aeon': { left: 168.4, top: 93.2, right: 318.4, bottom: 149.4 },
};

/**
 * What is **actually** up on each chapter's first turn. The enemy plate is the
 * only difference: FFX's `revealForSensorAuto` fires when Chapter 1 opens, and
 * chapters 2 and 3 never show it — their bosses keep their numbers.
 */
const LIVE: Record<string, Omit<typeof CHROME, 'sensor'> & { sensor: Rect | null }> = {
  'seymour-flux': { ...CHROME },
  yunalesca: { ...CHROME, sensor: null },
  'braskas-final-aeon': { ...CHROME, sensor: null },
};

/**
 * The party, measured live through the debug API at 1600x900, on the grid.
 *
 * Each sprite is recorded twice, because the HUD and the player see different
 * things and the gap between them is where an earlier round's bug lived:
 *
 * - `head` / `feet` are the only two things the HUD is given. `HudPort`'s
 *   projector answers with **points**, so `FFXBattleHud.partySpriteRects`
 *   reconstructs a rectangle from them;
 * - `quad` is the actor's painted plane — what the player actually sees, and
 *   what a panel may not be drawn over.
 *
 * A reconstruction that does not contain the quad is a fighter the "no panel on
 * a fighter" rule cannot see, which is why `covers` is asserted first.
 */
interface SpriteSample {
  name: string;
  head: { x: number; y: number };
  feet: { x: number; y: number };
  quad: Rect;
}

const PARTY: Record<string, SpriteSample[]> = {
  'seymour-flux': [
    { name: 'tidus', head: { x: 192, y: 188.8 }, feet: { x: 196.1, y: 313.8 },
      quad: { left: 144.7, top: 175.6, right: 241.2, bottom: 314.1 } },
    { name: 'yuna', head: { x: 113, y: 174.2 }, feet: { x: 118.7, y: 283.1 },
      quad: { left: 65.3, top: 162.6, right: 164.3, bottom: 283.4 } },
    { name: 'kimahri', head: { x: 249.8, y: 162.5 }, feet: { x: 251.5, y: 258.5 },
      quad: { left: 214.4, top: 152.4, right: 285.7, bottom: 258.7 } },
  ],
  yunalesca: [
    { name: 'tidus', head: { x: 323.6, y: 212.2 }, feet: { x: 323.5, y: 340.4 },
      quad: { left: 277.1, top: 198.8, right: 369.8, bottom: 340.9 } },
    { name: 'yuna', head: { x: 254.9, y: 204.3 }, feet: { x: 255.6, y: 318.4 },
      quad: { left: 206.7, top: 192.3, right: 302.8, bottom: 318.9 } },
    { name: 'auron', head: { x: 338, y: 195.2 }, feet: { x: 337.9, y: 293 },
      quad: { left: 301.8, top: 185.2, right: 374.1, bottom: 293.3 } },
  ],
  'braskas-final-aeon': [
    { name: 'tidus', head: { x: 191.6, y: 213.9 }, feet: { x: 193.5, y: 338.9 },
      quad: { left: 145.7, top: 200.8, right: 238.3, bottom: 339.2 } },
    { name: 'yuna', head: { x: 114.7, y: 203.1 }, feet: { x: 117.3, y: 311.8 },
      quad: { left: 68.4, top: 191.8, right: 162.5, bottom: 312 } },
    { name: 'auron', head: { x: 248.7, y: 194.6 }, feet: { x: 249.5, y: 290.1 },
      quad: { left: 213, top: 184.8, right: 284.6, bottom: 290.3 } },
  ],
};

/**
 * **The bosses**, reconstructed by the same three ratios, from the gate's run.
 *
 * This is refutation 2 of the round-02 gate in one constant. `advisorZone` was
 * never handed an enemy rect, so its bottom-right pocket ran from the party's
 * right edge to the party-status column — which in all three chapters is
 * straight through the boss — and the shipped card was measured 773 grid px²
 * into Seymour Flux, 1 626 into Braska's Final Aeon and 358 into the right-hand
 * Yu Pagoda, at every viewport.
 */
const ENEMIES: Record<string, Rect[]> = {
  'seymour-flux': [
    { left: 316.9, top: 13.6, right: 513.5, bottom: 239.8 },
    { left: 341.1, top: 35, right: 421.6, bottom: 127.6 },
  ],
  yunalesca: [{ left: 328.6, top: 63.4, right: 498.8, bottom: 259 }],
  'braskas-final-aeon': [
    { left: 320.1, top: 61.4, right: 491, bottom: 258 },
    { left: 420.5, top: 146.7, right: 495.4, bottom: 232.9 },
    { left: 295, top: 147.9, right: 376.6, bottom: 241.8 },
  ],
};

/**
 * Exactly what `FFXBattleHud.spriteRects` builds from the two anchors.
 *
 * Kept in step with that method by hand — it is four lines, and duplicating
 * them here is what lets the whole zone question be answered in Node.
 */
function reconstruct(s: SpriteSample): Rect {
  const span = Math.abs(s.feet.y - s.head.y);
  const half = span * SPRITE_HALF_WIDTH_RATIO;
  return {
    left: s.head.x - half,
    right: s.head.x + half,
    top: Math.min(s.head.y, s.feet.y) - span * SPRITE_TOP_MARGIN_RATIO,
    bottom: Math.max(s.head.y, s.feet.y) + span * SPRITE_FOOT_MARGIN_RATIO,
  };
}

const rectsFor = (chapter: string): Rect[] => PARTY[chapter]!.map(reconstruct);

/** The whole board for a chapter, exactly as the HUD assembles it. */
function boardFor(chapter: string, over: Partial<AdvisorZoneInput> = {}): AdvisorZoneInput {
  return { ...LIVE[chapter]!, sprites: rectsFor(chapter), enemies: ENEMIES[chapter]!, ...over };
}

/** The card's layout box on the grid, from a zone plus the height it renders at. */
function cardRect(zone: { left: number; width: number; bottom: number }, height: number): Rect {
  return {
    left: zone.left,
    right: zone.left + zone.width,
    top: 360 - zone.bottom - height,
    bottom: 360 - zone.bottom,
  };
}

/**
 * The card's box as **a browser reports it**: the axis-aligned bounds of the
 * sheared shape, `SKEW * height` wider than the layout box.
 *
 * This is the rect every harness that has ever measured this HUD used —
 * `getBoundingClientRect` on a `skewX`-ed element gives no other answer — so it
 * is the rect the assertions below are written against. The previous solver
 * reasoned about corners instead and was 44 grid px² of Kimahri wrong.
 */
function cardPaintedRect(zone: AdvisorZone, height: number): Rect {
  const reach = (SKEW * height) / 2;
  const box = cardRect(zone, height);
  return { ...box, left: box.left - reach, right: box.right + reach };
}

/**
 * How many grid px² two rects share.
 *
 * Area rather than a boolean throughout, because every number in the round-02
 * gate's report was an area and a failure here should be comparable with one:
 * "7 465 grid px² of Tidus" is a defect a reader can picture, "true" is not.
 */
function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Everything on a board a panel may not be drawn over, named for the failure message. */
function obstaclesOf(chapter: string, board: AdvisorZoneInput): Array<[string, Rect]> {
  const out: Array<[string, Rect]> = [
    ['command stack', board.cmdArea],
    ['party status', board.partyStatus],
    ['CTB queue', board.ctb!],
    ['intent chip', board.intentChip!],
  ];
  if (board.cmdInfo) out.push(['command help', board.cmdInfo]);
  if (board.guide) out.push(['strategy guide', board.guide]);
  if (board.sensor) out.push(['enemy plate', board.sensor]);
  if (board.intent) out.push(['enemy intent', board.intent]);
  // The party by its **painted quad**, not by the reconstruction the zone was
  // solved from: covering the estimate is not the promise.
  for (const s of PARTY[chapter]!) out.push([`sprite ${s.name}`, s.quad]);
  for (const [i, e] of (board.enemies ?? []).entries()) out.push([`enemy ${i}`, e]);
  return out;
}

/**
 * The shortest the advisor card can render, in grid px, measured on the built
 * preview at 1600x900 — the head line plus one move row, which is what the
 * first turn of every chapter prints.
 */
const CARD_MIN_MEASURED = 31;

// ------------------------------------------------------------- advisorZone

describe('the sprite rect the HUD reconstructs', () => {
  for (const [chapter, sprites] of Object.entries(PARTY)) {
    for (const s of sprites) {
      it(`covers all of ${s.name}'s painted quad in ${chapter}`, () => {
        const r = reconstruct(s);
        expect({
          left: r.left <= s.quad.left,
          top: r.top <= s.quad.top,
          right: r.right >= s.quad.right,
          bottom: r.bottom >= s.quad.bottom,
        }).toEqual({ left: true, top: true, right: true, bottom: true });
      });
    }
  }
});

describe('advisorZone', () => {
  for (const chapter of Object.keys(PARTY)) {
    describe(chapter, () => {
      it('finds a box at the width the card was designed at', () => {
        // Refutations 1 and 2 of the round-02 gate, as one assertion. That
        // build answered `null` for Chapter 2 — and then drew the card anyway,
        // on `MoveAdvisor`'s unguarded anchor, across all three party sprites —
        // and 83px-wide narrow pockets for chapters 1 and 3, 49 grid px under
        // the width `MoveAdvisor` was designed at, both of them over the boss.
        const zone = advisorZone(boardFor(chapter));
        expect({ chapter, zone }).toMatchObject({ zone: expect.anything() as object });
        expect(zone!.kind).not.toBe('compact');
        expect(zone!.width).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
        expect(zone!.width).toBeLessThanOrEqual(MAX_ADVISOR_WIDTH);
      });

      it('keeps the card off every panel and every fighter, as a browser measures it', () => {
        // Against the **painted** bounds at every height the density ladder can
        // settle on, because a shorter card is sheared less and sits in a
        // different rectangle than a tall one.
        const board = boardFor(chapter);
        const zone = advisorZone(board)!;
        for (let h = 8; h <= zone.maxHeight; h += 4) {
          const card = cardPaintedRect(zone, h);
          for (const [name, r] of obstaclesOf(chapter, board)) {
            expect({ chapter, h, panel: name, over: Math.round(overlapArea(card, r)) }).toMatchObject({ over: 0 });
          }
        }
      });

      it('keeps the chip off them too, since the chip is what the player clicks', () => {
        const board = boardFor(chapter);
        const zone = advisorZone(board)!;
        // The chip rides in the reserve above the card, at the card's own left
        // edge. `CHIP_WIDTH` x `ADVISOR_CHIP_RESERVE` is the whole of it.
        const top = 360 - zone.bottom - zone.maxHeight - ADVISOR_CHIP_RESERVE;
        const chip: Rect = { left: zone.left, top, right: zone.left + CHIP_WIDTH, bottom: top + ADVISOR_CHIP_RESERVE };
        for (const [name, r] of obstaclesOf(chapter, board)) {
          expect({ chapter, panel: name, over: Math.round(overlapArea(chip, r)) }).toMatchObject({ over: 0 });
        }
      });

      it('gives the card a box at least as tall as the card itself needs', () => {
        // `CARD_MIN_MEASURED` is a hard number read off the built preview rather
        // than a re-statement of the constant under test, so lowering
        // `MIN_ADVISOR_HEIGHT` back to something the card does not fit in fails
        // here too.
        const zone = advisorZone(boardFor(chapter))!;
        expect({ chapter, h: zone.maxHeight }).toMatchObject({ h: expect.any(Number) as number });
        expect(zone.maxHeight).toBeGreaterThanOrEqual(CARD_MIN_MEASURED);
        expect(zone.maxHeight).toBeGreaterThanOrEqual(MIN_ADVISOR_HEIGHT);
        expect(zone.maxHeight).toBeLessThanOrEqual(MAX_ADVISOR_HEIGHT);
      });

      it('still answers honestly when the player opens the enemy-intent slab', () => {
        // Pressing `E` puts a 150 x 119 slab back in the band the card took.
        // Whatever comes back then, it is a box clear of everything or it is
        // `null` — never the round-02 build's third option, a card drawn on the
        // party because nothing else fitted.
        const board = boardFor(chapter, { intent: INTENT_OPEN[chapter]! });
        const zone = advisorZone(board);
        if (!zone) {
          expect(advisorChipDock(board)).not.toBeNull();
          return;
        }
        for (let h = 8; h <= zone.maxHeight; h += 4) {
          const card = cardPaintedRect(zone, h);
          for (const [name, r] of obstaclesOf(chapter, board)) {
            expect({ chapter, h, panel: name, over: Math.round(overlapArea(card, r)) }).toMatchObject({ over: 0 });
          }
        }
      });
    });
  }

  it('puts all three chapters in clear sky above the party, not in a pocket on the boss', () => {
    const solved = Object.fromEntries(
      Object.keys(PARTY).map((c) => {
        const z = advisorZone(boardFor(c))!;
        return [c, { kind: z.kind, width: Math.round(z.width), height: Math.round(z.maxHeight) }];
      }),
    );
    // The numbers themselves, so a change to a party slot, a boss's staging or
    // one of the two left-column panels shows up here as a diff rather than as
    // a screenshot nobody takes. `shelf` is "the box's floor is above every
    // party head", which is what the round-02 addendum asked for and what the
    // build it audited did not do in a single one of twelve measured states.
    expect(solved).toEqual({
      'seymour-flux': { kind: 'shelf', width: 132, height: 93 },
      yunalesca: { kind: 'shelf', width: 143, height: 98 },
      'braskas-final-aeon': { kind: 'shelf', width: 134, height: 98 },
    });
  });

  it('trades height for width when the band is only just wide enough', () => {
    // Chapter 1 is the case that forced this, and it is the reason the round-02
    // build fell to an 83px pocket. Its open band measures 152.4 grid px; the
    // card's painted width is `width + SKEW * height`, so at the full 104 of
    // height the widest card that fits is 130.3 — under `MIN_ADVISOR_WIDTH`,
    // and the old solver declined. At 90 of height it is 133.2.
    const zone = advisorZone(boardFor('seymour-flux'))!;
    expect(zone.maxHeight).toBeLessThan(MAX_ADVISOR_HEIGHT);
    expect(zone.width + SKEW * zone.maxHeight).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
    expect(zone.width).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
    // And the height it kept is still well past what the card needs at 132.
    expect(zone.maxHeight).toBeGreaterThanOrEqual(84);
  });

  it('never returns a box shorter or narrower than the card, at any plate depth', () => {
    // A property over the whole family of boards the three chapters can reach:
    // push the enemy plate's bottom edge down one grid px at a time, which is
    // the thing that squeezed Chapter 1's band, and assert the answer is always
    // either null or a box the card fits in — never something between.
    for (const chapter of Object.keys(PARTY)) {
      for (let bottom = 24; bottom <= 200; bottom++) {
        const zone = advisorZone(boardFor(chapter, { sensor: { left: 191.7, top: 24, right: 308.3, bottom } }));
        if (zone === null) continue;
        expect({ chapter, bottom, h: zone.maxHeight, w: zone.width }).toMatchObject({
          h: expect.any(Number) as number,
        });
        expect(zone.maxHeight).toBeGreaterThanOrEqual(MIN_ADVISOR_HEIGHT);
        expect(zone.width).toBeGreaterThanOrEqual(NARROW_ADVISOR_WIDTH);
        expect(zone.width).toBeLessThanOrEqual(MAX_ADVISOR_WIDTH);
      }
    }
  });

  it('never lands on a fighter, at any plate depth, in any chapter', () => {
    // The same sweep, asserting the thing Bailey actually reported. 531 boards.
    for (const chapter of Object.keys(PARTY)) {
      for (let bottom = 24; bottom <= 200; bottom++) {
        const board = boardFor(chapter, { sensor: { left: 191.7, top: 24, right: 308.3, bottom } });
        const zone = advisorZone(board);
        if (!zone) continue;
        const card = cardPaintedRect(zone, zone.maxHeight);
        for (const s of PARTY[chapter]!) {
          expect({ chapter, bottom, sprite: s.name, over: Math.round(overlapArea(card, s.quad)) }).toMatchObject({
            over: 0,
          });
        }
        for (const [i, e] of ENEMIES[chapter]!.entries()) {
          expect({ chapter, bottom, enemy: i, over: Math.round(overlapArea(card, e)) }).toMatchObject({ over: 0 });
        }
      }
    }
  });

  it('is told about the bosses, and moves out of the way of one that grows', () => {
    // Slide Yunalesca left 60 grid px and the card must give ground rather than
    // be drawn over her, which is exactly what the round-02 build did not do.
    const grown = [{ left: 268.6, top: 63.4, right: 498.8, bottom: 259 }];
    const board = boardFor('yunalesca', { enemies: grown });
    const zone = advisorZone(board)!;
    expect(overlapArea(cardPaintedRect(zone, zone.maxHeight), grown[0]!)).toBe(0);
    expect(zone.left + zone.width).toBeLessThan(advisorZone(boardFor('yunalesca'))!.left + advisorZone(boardFor('yunalesca'))!.width);
  });

  it('clamps the band to the width the card was designed for', () => {
    // Guide off, plate off, intent folded: the band is over 300 grid px, and a
    // 300px-wide NEXT BEST MOVE slab is a letterbox rather than a card.
    const zone = advisorZone(boardFor('yunalesca', { guide: null }))!;
    expect(zone.width).toBeLessThanOrEqual(MAX_ADVISOR_WIDTH);
    expect(zone.width).toBeGreaterThan(advisorZone(boardFor('yunalesca'))!.width);
  });

  it('finds the band beside the party when the one above it is full', () => {
    // The pocket is not dead code, and the solver finding it without being told
    // about it is the point of the rewrite: with the band above the party
    // filled — a tall enemy-intent slab, which is what the player gets on `E` —
    // and the party tucked left of x 220, the only box left is the bottom-right
    // one, and it is found by the same search that finds the shelf.
    const tucked: Rect[] = [
      { left: 40, top: 180, right: 130, bottom: 320 },
      { left: 120, top: 170, right: 220, bottom: 330 },
    ];
    const zone = advisorZone({
      ...CHROME,
      sensor: null,
      intent: { left: 159, top: 4, right: 396, bottom: 160 },
      sprites: tucked,
      enemies: [],
    })!;
    expect(zone.left).toBeGreaterThanOrEqual(220 + GAP);
    expect(zone.width).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
    const card = cardPaintedRect(zone, zone.maxHeight);
    for (const r of tucked) expect(Math.round(overlapArea(card, r))).toBe(0);
    expect(Math.round(overlapArea(card, { left: 159, top: 4, right: 396, bottom: 160 }))).toBe(0);
    // And it is bottom-anchored ground rather than the shelf, which is the only
    // thing the old `pocket` name ever meant.
    expect(360 - zone.bottom).toBeGreaterThan(CHROME.cmdArea.top);
  });

  it('keeps room above the card for its own chip', () => {
    // The chip rides above the card, so it is the chip that has to clear
    // whatever bounds the box from above. The live matrix caught it poking into
    // the Sensor card in every state the Sensor was up. Swept over every plate
    // depth, because which panel bounds the box from above changes with it.
    for (const chapter of Object.keys(PARTY)) {
      for (let bottom = 24; bottom <= 200; bottom += 4) {
        const plate: Rect = { left: 191.7, top: 24, right: 308.3, bottom };
        const zone = advisorZone(boardFor(chapter, { sensor: plate }));
        if (!zone) continue;
        const chip: Rect = {
          left: zone.left,
          top: 360 - zone.bottom - zone.maxHeight - ADVISOR_CHIP_RESERVE,
          right: zone.left + CHIP_WIDTH,
          bottom: 360 - zone.bottom - zone.maxHeight,
        };
        expect({ chapter, bottom, over: Math.round(overlapArea(chip, plate)) }).toMatchObject({ over: 0 });
        expect(chip.top).toBeGreaterThanOrEqual(GAP);
      }
    }
  });

  it('hands back null rather than a nonsense box when the frame is full', () => {
    const wall: Rect[] = [{ left: 0, top: 0, right: 640, bottom: 360 }];
    expect(advisorZone({ ...CHROME, sensor: null, sprites: wall, enemies: [] })).toBeNull();
  });

  it('falls to a narrow card in clear ground before it declines, never to a wide one on a fighter', () => {
    // A board with no 132-wide box left: the party walled across the open band.
    // The round-02 build's answer to this shape was the *narrow pocket*, which
    // was neither clear nor honest. The relaxed pass is the same solver at a
    // smaller minimum, so whatever it returns is still clear of everything.
    const crowd: Rect[] = [
      ...rectsFor('seymour-flux'),
      { left: 176, top: 20, right: 300, bottom: 150 },
    ];
    const board = boardFor('seymour-flux', { sprites: crowd });
    const zone = advisorZone(board);
    if (zone) {
      expect(zone.width).toBeGreaterThanOrEqual(NARROW_ADVISOR_WIDTH);
      const card = cardPaintedRect(zone, zone.maxHeight);
      for (const r of crowd) expect(Math.round(overlapArea(card, r))).toBe(0);
      for (const e of ENEMIES['seymour-flux']!) expect(Math.round(overlapArea(card, e))).toBe(0);
    } else {
      expect(advisorChipDock(board)).not.toBeNull();
    }
  });

  it('parks the chip on clear ground when it declines', () => {
    // The chip is the whole advisor for that decision, so it may not fall back
    // to the stylesheet's `left: 196px` anchor, which in chapters 1 and 3 is
    // Tidus's chest.
    const crowd: Rect[] = [
      ...rectsFor('seymour-flux'),
      { left: 160, top: 14, right: 400, bottom: 160 },
    ];
    const board = boardFor('seymour-flux', { sprites: crowd, sensor: SENSOR_IN_SHELF });
    expect(advisorZone(board)).toBeNull();
    const dock = advisorChipDock(board)!;
    expect(dock).not.toBeNull();
    const chip: Rect = {
      left: dock.left,
      top: 360 - dock.bottom - ADVISOR_CHIP_RESERVE,
      right: dock.left + CHIP_WIDTH,
      bottom: 360 - dock.bottom,
    };
    for (const [name, r] of obstaclesOf('seymour-flux', board)) {
      expect({ panel: name, over: Math.round(overlapArea(chip, r)) }).toMatchObject({ over: 0 });
    }
    for (const r of crowd) expect(Math.round(overlapArea(chip, r))).toBe(0);
  });

  it('clears the command stack when a submenu grows it up into the band', () => {
    // Opening a Skill list moves the stack's top edge, and the card has to come
    // with it rather than be drawn over.
    const open = { ...CHROME.cmdArea, top: 140 };
    const board = boardFor('yunalesca', { cmdArea: open });
    const zone = advisorZone(board)!;
    expect(overlapArea(cardPaintedRect(zone, zone.maxHeight), open)).toBe(0);
  });
});

// ---------------------------------------------------- the command help slab

describe('the command window’s help slab', () => {
  /**
   * `FFXBattleHud.CMD_INFO_SLOT` — the third refutation of the round-02 gate,
   * as arithmetic.
   *
   * That build let the slab ride `GAP` above the command stack, whose height
   * swings by 90 grid px between the top-level menu and a targeting state, so
   * the one panel up on every decision travelled with it: measured 1 366 grid
   * px² on Yuna in Chapter 3 at 1280x720 in ten of thirteen states, and
   * 1 900 + 3 140 on Tidus and Yuna in Chapter 1 with a White Magic list open.
   */
  const SLOT = CHROME.cmdInfo;

  for (const chapter of Object.keys(PARTY)) {
    it(`never touches a party sprite in ${chapter}`, () => {
      for (const s of PARTY[chapter]!) {
        expect({ chapter, sprite: s.name, over: Math.round(overlapArea(SLOT, s.quad)) }).toMatchObject({ over: 0 });
      }
    });
  }

  it('clears Kimahri, who is the only one who stands this high in the column', () => {
    // 4.8 grid px, and it is the number to move if the slab is ever widened.
    const kimahri = PARTY['seymour-flux']!.find((s) => s.name === 'kimahri')!;
    expect(kimahri.quad.left - SLOT.right).toBeGreaterThan(0);
  });

  it('sits below the strategy guide’s rail, not through it', () => {
    expect(SLOT.top - CHROME.guide.bottom).toBeGreaterThanOrEqual(GAP);
  });

  it('sits above the command stack at its tallest, so the two never swap places', () => {
    expect(CHROME.cmdArea.top - SLOT.bottom).toBeGreaterThanOrEqual(GAP);
  });

  it('is a fixed width, so no sentence can grow it across the frame', () => {
    // SWITCH's help — "Swap in a reserve member (L1 / Q). The member coming in
    // takes this turn." — grew the old `max-width: 240px` slab from 81 grid px
    // to **248**, and ran it 11 830 grid px² under the enemy-intent slab, from
    // one keypress. The gate measured the same slab at five different widths in
    // five consecutive states of one menu. It is one width now and it wraps.
    const GATE_WORST_RIGHT = 274.5;
    expect(SLOT.right).toBeLessThan(GATE_WORST_RIGHT);
    // And the width it settled on is the one that clears the advisor's band:
    // the card's left edge in every chapter is right of the slab's right edge.
    for (const chapter of Object.keys(PARTY)) {
      const zone = advisorZone(boardFor(chapter))!;
      expect({ chapter, over: Math.round(overlapArea(SLOT, cardPaintedRect(zone, zone.maxHeight))) }).toMatchObject({
        over: 0,
      });
    }
  });
});


// ------------------------------------------------ no title outlives its turn

function mountHud(): FFXBattleHud {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  return hud;
}

/** The `.ig-minigame` slabs still on the HUD's stage. */
function slabs(hud: FFXBattleHud): number {
  return hud.el.querySelectorAll('.ig-minigame').length;
}

/** An Overdrive picker left on the stage by hand, as a leak would leave it. */
function leakSlab(hud: FFXBattleHud): void {
  const stage = hud.el.querySelector<HTMLElement>('.ffxhud__stage')!;
  const slab = document.createElement('div');
  slab.className = 'ig-minigame ffx-mg';
  slab.innerHTML = '<div class="ig-minigame__title">Ronso Rage</div>';
  stage.appendChild(slab);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a title slab never outlives its decision', () => {
  it('is gone by the time the next character is asked for a command', async () => {
    const hud = mountHud();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    leakSlab(hud);
    expect(slabs(hud)).toBe(1);

    const pending = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    expect(slabs(hud)).toBe(0);
    void pending;
  });

  it('is gone when the turn passes to another actor', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 0 } as never);
    leakSlab(hud);
    hud.onEvent({ type: 'turn-start', actorId: 'tidus', seq: 1 } as never);
    expect(slabs(hud)).toBe(0);
  });

  it('stays put while the same actor is still taking their turn', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 0 } as never);
    leakSlab(hud);
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 1 } as never);
    expect(slabs(hud)).toBe(1);
  });

  it('is gone once the battle has a result', () => {
    const hud = mountHud();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    leakSlab(hud);
    const decided: BattleState = { ...state, result: { outcome: 'victory' } as unknown as BattleState['result'] };
    hud.sync(decided, makeFakeTurnPreview());
    expect(slabs(hud)).toBe(0);
  });

  it('takes the message banner down with it, so one turn cannot label the next', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 0 } as never);
    hud.onEvent({ type: 'message', text: 'Kimahri uses Ronso Rage', kind: 'action', seq: 1 } as never);
    const banner = hud.el.querySelector<HTMLElement>('.ig-banner')!;
    expect(banner.hidden).toBe(false);
    hud.onEvent({ type: 'turn-start', actorId: 'tidus', seq: 2 } as never);
    expect(banner.hidden).toBe(true);
  });
});

// ------------------------------------------------- the HUD applying the zone

/** The advisor's card and chip, as `placeAdvisor` sees them. */
function advisorEls(hud: FFXBattleHud): { root: HTMLElement; card: HTMLElement; chip: HTMLElement } {
  return {
    root: hud.el.querySelector<HTMLElement>('[data-role="move-advisor"]')!,
    card: hud.el.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!,
    chip: hud.el.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]')!,
  };
}

/**
 * A projector that answers with one fighter big enough to cover the stage.
 *
 * jsdom lays nothing out, so every HUD panel measures zero and `advisorZone`
 * sees an empty screen — which is a solvable one. The party is the only input
 * the HUD builds from the projector rather than from `offsetWidth`, so it is
 * the one that can be driven from a test, and a fighter that fills the frame is
 * the board on which every placement honestly fails.
 */
function wallProjector(): (id: string, anchor: string) => { x: number; y: number } {
  // `hudScale()` falls back to the window (1024x768 in jsdom) => scale 1.6,
  // origin (-512, -288). These two points reconstruct to a rect covering the
  // whole 640x360 grid; see `partySpriteRects`.
  return (_id, anchor) => (anchor === 'head' ? { x: 0, y: -288 } : { x: 0, y: 1760 });
}

/**
 * Three sprites shoulder to shoulder across the frame from grid y 60 down.
 *
 * `wallProjector` covers the stage outright, which is the right board for
 * "declines rather than invent a box" and the wrong one for "and then docks
 * the chip" — there is nowhere to dock it either. This leaves the top 54 grid
 * px clear: too short for a card (which needs `MIN_ADVISOR_HEIGHT` plus its
 * chip's reserve, 83) and roomy for a 56 x 11 chip. See `partySpriteRects` for
 * the reconstruction these two points are solved backwards from.
 */
function floorWallProjector(): (id: string, anchor: string) => { x: number; y: number } {
  const xs = new Map<string, number>();
  const columns = [-352, 0, 352];
  return (id, anchor) => {
    if (!xs.has(id)) xs.set(id, columns[xs.size % columns.length]!);
    const x = xs.get(id)!;
    return anchor === 'head' ? { x, y: -133.6 } : { x, y: 283.8 };
  };
}

describe('the FFX HUD applying the advisor zone', () => {
  it('gives the card the whole box and never a fraction of one', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const { card, root } = advisorEls(hud);
    expect(hud.advisorPlacement).not.toBeNull();
    expect(hud.advisorPlacement!.maxHeight).toBeGreaterThanOrEqual(MIN_ADVISOR_HEIGHT);
    expect(root.dataset['zone']).toBe(hud.advisorPlacement!.kind);
    expect(parseFloat(card.style.maxHeight)).toBeCloseTo(hud.advisorPlacement!.maxHeight, 1);
  });

  it('holds one placement for the whole decision, however many frames it takes', () => {
    // The flapping half of the report: the zone's inputs include the party's
    // projected rects, and re-solving per frame flipped the card between the
    // shelf and its own placement several times a second.
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const first = hud.advisorPlacement;
    const { card } = advisorEls(hud);
    const geometry = [card.style.left, card.style.width, card.style.bottom, card.style.maxHeight].join();
    for (let i = 0; i < 60; i++) {
      hud.update(16);
      expect(hud.advisorPlacement).toBe(first);
    }
    expect([card.style.left, card.style.width, card.style.bottom, card.style.maxHeight].join()).toBe(geometry);
  });

  it('does not re-solve because the party moved inside a decision', () => {
    // The acting character steps forward on their turn. A first attempt at the
    // hold re-solved whenever the party's projected union drifted more than a
    // few grid px, and the live matrix caught it at Chapter 1's second decision
    // with three different boxes inside one turn. Every way the party can
    // genuinely relocate is a command, and a command ends the decision.
    const hud = mountHud();
    hud.setProjector(((_id: string, anchor: string) =>
      anchor === 'head' ? { x: -400, y: -200 } : { x: -400, y: 100 }) as never);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const first = hud.advisorPlacement;
    expect(first).not.toBeNull();

    // The whole party takes a long step to the right: 100 viewport px, which is
    // 62 grid px at this scale — far past any drift threshold worth having.
    hud.setProjector(((_id: string, anchor: string) =>
      anchor === 'head' ? { x: -300, y: -200 } : { x: -300, y: 100 }) as never);
    for (let i = 0; i < 30; i++) hud.update(16);
    expect(hud.advisorPlacement).toBe(first);
  });

  it('solves again when the next decision opens', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const first = hud.advisorPlacement;
    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    hud.update(16);
    expect(hud.advisorPlacement).not.toBe(first);
    expect(hud.advisorPlacement).toMatchObject({ kind: first!.kind, maxHeight: first!.maxHeight });
  });

  /**
   * **The card comes down, and the chip stays on clear ground.**
   *
   * This describe block asserted the opposite for one build. The reasoning was
   * "a card in an imperfect place answers the question; a card that is not
   * there does not", and it had a real cost behind it: an earlier build took
   * the card off the screen on five of Chapter 1's seven decisions and left a
   * two-word chip floating where it used to be.
   *
   * The round-02 gate measured what "imperfect" came to on the build that
   * reasoning shipped. In Chapter 2, at all four viewports, `advisorZone`
   * answered `null` and the HUD drew the card anyway, on `MoveAdvisor`'s own
   * unguarded anchor: **7 465 grid px² of it on Tidus, 4 125 on Yuna, 1 781 on
   * Auron**, with the `N HIDE MOVES` chip on Yuna's head. That is not an
   * imperfect place, it is the fight with a slab over it — and the file's own
   * header had promised the other behaviour the whole time.
   *
   * The reason the old cost does not come back is that `null` is now a much
   * rarer answer: the solver searches the frame instead of trying three named
   * placements, it falls to an 80px card before it declines, and the three
   * shipped chapters are pinned above as finding a 132px one.
   */
  describe('with no zone the card fits in', () => {
    it('takes the card down rather than drawing it on the party', () => {
      const hud = mountHud();
      hud.setProjector(wallProjector() as never);
      hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
      hud.update(16);
      const { card, root, chip } = advisorEls(hud);
      expect(hud.advisorPlacement).toBeNull();
      expect(card.hidden).toBe(true);
      expect(root.dataset['zone']).toBe('free');
      expect(card.dataset['zone']).toBeUndefined();
      // Nothing measured is left on the card either, so the frame it comes back
      // on is `MoveAdvisor.layout`'s own and not a stale box.
      expect(card.style.maxHeight).toBe('');
      expect(card.style.top).toBe('');
      // The chip is still there — it *is* the advisor for that decision.
      expect(chip.hidden).toBe(false);
    });

    it('docks the chip on the solver’s own answer, not the stylesheet anchor', () => {
      // `move-advisor.css` parks the chip at `left: 196px`, which in chapters 1
      // and 3 is Tidus's chest. With no zone there is still a chip-sized box on
      // the frame, and `advisorChipDock` is the same search that failed to find
      // a card-sized one.
      const hud = mountHud();
      hud.setProjector(floorWallProjector() as never);
      hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
      hud.update(16);
      const { card, chip } = advisorEls(hud);
      expect(hud.advisorPlacement).toBeNull();
      expect(card.hidden).toBe(true);
      expect(chip.style.left).not.toBe('');
      expect(chip.style.bottom).not.toBe('');
      expect(parseFloat(chip.style.left)).not.toBeCloseTo(196, 1);
      // In the clear band above the party's heads, which is grid y 6..54 here.
      expect(360 - parseFloat(chip.style.bottom)).toBeLessThanOrEqual(54);
    });

    it('takes a measured zone again at the next decision', () => {
      const hud = mountHud();
      hud.setProjector(wallProjector() as never);
      hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
      hud.update(16);
      const { card, root } = advisorEls(hud);
      expect(root.dataset['zone']).toBe('free');

      hud.setProjector((() => null) as never);
      void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
      hud.update(16);
      expect(hud.advisorPlacement).not.toBeNull();
      expect(card.hidden).toBe(false);
      expect(root.dataset['zone']).not.toBe('free');
      expect(parseFloat(card.style.maxHeight)).toBeCloseTo(hud.advisorPlacement!.maxHeight, 1);
    });

    /**
     * The chip is not a second state machine. It was, briefly: it reported the
     * HUD's decline rather than the player's preference, so `N` could not put
     * the card back and the chip said a third thing no other screen says.
     */
    describe('its chip', () => {
      it('offers to hide the card, because the card is there to hide', () => {
        const hud = mountHud();
        hud.setProjector(wallProjector() as never);
        hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
        hud.update(16);
        const { chip } = advisorEls(hud);
        expect(hud.advisorPlacement).toBeNull();
        expect(chip.textContent?.toLowerCase()).toContain('hide moves');
        expect(chip.textContent?.toLowerCase()).not.toContain('room');
        expect(chip.getAttribute('aria-pressed')).toBe('true');
      });

      it('answers N, both ways, with nothing else in between', () => {
        // On a frame that *has* a zone, because the two answers must not be
        // confused: `N` is the player's preference and the zone is the room on
        // the screen. Only the first can put the card back.
        const hud = mountHud();
        hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
        hud.update(16);
        const { card, chip } = advisorEls(hud);
        expect(hud.advisorPlacement).not.toBeNull();

        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }));
        hud.update(16);
        expect(card.hidden).toBe(true);
        expect(chip.textContent?.toLowerCase()).toContain('best move');
        expect(chip.getAttribute('aria-pressed')).toBe('false');

        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }));
        hud.update(16);
        expect(card.hidden).toBe(false);
        expect(chip.textContent?.toLowerCase()).toContain('hide moves');
        expect(hud.moveAdvisor.isVisible).toBe(true);
      });
    });
  });
});

describe('an Overdrive picker with nothing to pick', () => {
  it('backs out on cancel and takes its overlay off the field', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [] });
    expect(root.querySelectorAll('.ig-minigame').length).toBe(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    await expect(pending).rejects.toThrow(/backed out/);
    expect(root.querySelectorAll('.ig-minigame').length).toBe(0);
  });

  it('accepts confirm as a way out too, so it can never become a wall', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [] });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(pending).rejects.toThrow(/backed out/);
    expect(root.querySelectorAll('.ig-minigame').length).toBe(0);
  });

  it('still resolves normally when there is a Rage to choose', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [{ id: 'jump', name: 'Jump' }] });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(pending).resolves.toMatchObject({ kind: 'kimahri-rage', rage: { rageId: 'jump' } });
    expect(root.querySelectorAll('.ig-minigame').length).toBe(0);
  });
});

// ------------------------------------------------- one press, one meaning

/**
 * `src/ui/ffx/cancelClaim.ts` has the full account. In short: the menus answer
 * `keydown` the instant it arrives, `BattleScreen` polls the same press as an
 * edge on the next frame, and a claim dropped synchronously left that poll
 * looking at a free Esc — so one tap backed out of a submenu *and* opened the
 * pause menu. Every job of the live HUD matrix died on it.
 */
const afterFrame = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(() => resolve(), 0);
  });

const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code }));
};

/** Walk the stack down to the first row that opens a submenu. */
function stepToGroupRow(hud: FFXBattleHud): void {
  for (let i = 0; i < 8; i++) {
    if (hud.el.querySelector('.ig-cmd--selected .ffx-cmd__chev')) return;
    key('ArrowDown');
  }
  throw new Error('no group row in the fixture command list');
}

describe('Esc in a menu does not also open the pause', () => {
  it('keeps the claim through the frame that carries the press, then drops it', async () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    const pending = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    expect(menuOwnsCancel()).toBe(false); // top row: Esc belongs to the pause

    stepToGroupRow(hud);
    key('Enter');
    expect(menuOwnsCancel()).toBe(true); // in a submenu: Esc is the back button

    key('Escape');
    // The step back has already happened...
    expect(hud.el.querySelector('.ig-cmd--selected .ffx-cmd__chev')).not.toBeNull();
    // ...but the claim is still up, which is what `BattleScreen` polls next.
    expect(menuOwnsCancel()).toBe(true);

    await afterFrame();
    expect(menuOwnsCancel()).toBe(false); // a *second* tap pauses, as it should

    void pending;
  });

  it('drops the claim at once when the decision was made with confirm', async () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    const pending = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    key('Enter'); // Attack, straight to targeting
    expect(menuOwnsCancel()).toBe(true);
    key('Enter'); // confirm the target — the command is submitted
    expect(menuOwnsCancel()).toBe(false);
    await expect(pending).resolves.toMatchObject({ kind: 'attack' });
  });

  it('holds it for an Overdrive picker backed out of with Esc', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [{ id: 'jump', name: 'Jump' }] });
    expect(menuOwnsCancel()).toBe(true);

    key('Escape');
    expect(menuOwnsCancel()).toBe(true);
    await expect(pending).rejects.toThrow(/backed out/);

    await afterFrame();
    expect(menuOwnsCancel()).toBe(false);
  });
});
