// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { menuOwnsCancel } from '../../src/ui/common/menuCancel.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import {
  ADVISOR_CHIP_RESERVE,
  advisorChipDock,
  advisorZone,
  GAP,
  MAX_ADVISOR_HEIGHT,
  MAX_ADVISOR_WIDTH,
  MIN_ADVISOR_HEIGHT,
  MIN_ADVISOR_WIDTH,
  NARROW_ADVISOR_WIDTH,
  SHELF_RIGHT,
  SKEW,
  SPRITE_FOOT_MARGIN_RATIO,
  SPRITE_HALF_WIDTH_RATIO,
  SPRITE_TOP_MARGIN_RATIO,
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
 * The always-on chrome, identical in all three FFX chapters, plus every
 * optional panel up at once.
 *
 * `intent` and `ctb` joined this fixture with the fix-3 gate round: the
 * enemy-intent slab is 150 x 168 grid px hung over the boss from y 4 and was
 * not an input to `advisorZone` at all, which Chapter 1's shelf cleared by 1.6
 * grid px of luck. Measured on the built preview at 1600x900, Chapter 1's first
 * turn.
 */
const CHROME = {
  cmdArea: { left: 30.2, top: 204.5, right: 210.7, bottom: 334.2 },
  partyStatus: { left: 402.7, top: 258.3, right: 616.9, bottom: 348 },
  guide: { left: 21.3, top: 44, right: 153.3, bottom: 200 },
  sensor: { left: 191.7, top: 24, right: 308.3, bottom: 102 },
  intent: { left: 344.2, top: 4, right: 494.2, bottom: 172.5 },
  ctb: { left: 547.6, top: 49.8, right: 620.5, bottom: 200.4 },
} as const;

/**
 * What is **actually** up on each chapter's first turn, measured on the same
 * run. The Sensor card is the difference and it is the whole defect: FFX's
 * `revealForSensorAuto` fires when the battle opens, `SensorPanel.hide()` has
 * no caller, and so in Chapter 1 the scan result sits in the shelf's band for
 * the entire fight. Chapters 2 and 3 never show it — their bosses keep their
 * numbers — which is why only Chapter 1 shipped a sliced card.
 */
const LIVE: Record<string, Omit<typeof CHROME, 'sensor' | 'intent'> & { sensor: Rect | null; intent: Rect }> = {
  'seymour-flux': { ...CHROME },
  yunalesca: { ...CHROME, sensor: null, intent: { left: 347.8, top: 4, right: 497.8, bottom: 134.1 } },
  'braskas-final-aeon': { ...CHROME, sensor: null, intent: { left: 347.8, top: 4, right: 497.8, bottom: 157.4 } },
};

/**
 * The party, measured live through the debug API at 1600x900, on the grid.
 *
 * Each sprite is recorded twice, because the HUD and the player see different
 * things and the gap between them is where the last round's bug lived:
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
 * Exactly what `FFXBattleHud.partySpriteRects` builds from the two anchors.
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

/** The card's box on the grid, from a zone plus the height it renders at. */
function cardRect(zone: { left: number; width: number; bottom: number }, height: number): Rect {
  return {
    left: zone.left,
    right: zone.left + zone.width,
    top: 360 - zone.bottom - height,
    bottom: 360 - zone.bottom,
  };
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * The card as it is **painted**: the four corners of the sheared parallelogram.
 *
 * `skewX` slides each row by `SKEW * (y - the box's vertical centre)`, so the
 * top edge ends up `SKEW * height / 2` right of the solved box and the bottom
 * edge the same distance left of it.
 */
function cardQuad(zone: { left: number; width: number; bottom: number }, height: number): Array<[number, number]> {
  const b = 360 - zone.bottom;
  const t = b - height;
  const d = (SKEW * height) / 2;
  return [
    [zone.left + d, t],
    [zone.left + zone.width + d, t],
    [zone.left + zone.width - d, b],
    [zone.left - d, b],
  ];
}

/** Does a painted parallelogram touch an axis-aligned rect? Rows the two share. */
function quadHitsRect(quad: Array<[number, number]>, r: Rect): boolean {
  const [tl, tr, br] = [quad[0]!, quad[1]!, quad[2]!];
  const top = tl[1];
  const bottom = br[1];
  const yLo = Math.max(top, r.top);
  const yHi = Math.min(bottom, r.bottom);
  if (yHi <= yLo) return false;
  // The shear is horizontal, so the card's edges at height y are its top edge
  // slid by SKEW * (top - y). Both ends of the shared band bound the extremes.
  for (const y of [yLo, yHi]) {
    const slide = SKEW * (top - y);
    const left = tl[0] + slide;
    const right = tr[0] + slide;
    if (left < r.right && right > r.left) return true;
  }
  return false;
}

/**
 * The shortest the advisor card can render, in grid px, measured on the built
 * preview at 1600x900 — the head line plus one move row, which is what the
 * first turn of every chapter prints.
 *
 * The old `MIN_ADVISOR_HEIGHT` was 22 on the reasoning that this number was
 * about 14. It is 31, and the eight grid px between those two are the sliced
 * card Bailey reported.
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
      const sprites = rectsFor(chapter);
      const live = { ...LIVE[chapter]!, sprites };

      it('never puts the card on a party sprite, at any height the card can reach', () => {
        const zone = advisorZone(live);
        expect(zone).not.toBeNull();
        const box = cardRect(zone!, zone!.maxHeight);
        // Against the **painted** quad, not against the reconstruction the
        // zone was solved from: covering the estimate is not the promise.
        for (const s of PARTY[chapter]!) {
          expect({ chapter, sprite: s.name, box, overlaps: overlaps(box, s.quad) }).toMatchObject({ overlaps: false });
        }
      });

      it('never puts the card on the command stack or the party-status column', () => {
        const zone = advisorZone(live);
        const box = cardRect(zone!, zone!.maxHeight);
        expect(overlaps(box, CHROME.cmdArea)).toBe(false);
        expect(overlaps(box, CHROME.partyStatus)).toBe(false);
      });

      it('never puts the card on the CTB queue or the enemy-intent slab', () => {
        const zone = advisorZone(live);
        const box = cardRect(zone!, zone!.maxHeight);
        expect({ chapter, ctb: overlaps(box, CHROME.ctb) }).toMatchObject({ ctb: false });
        expect({ chapter, intent: overlaps(box, live.intent) }).toMatchObject({ intent: false });
      });

      it('gives the card at least the width it can still be read at', () => {
        const zone = advisorZone(live)!;
        expect(zone.width).toBeGreaterThanOrEqual(NARROW_ADVISOR_WIDTH);
        // The narrow pocket is the only placement allowed under the designed
        // width, and only because the alternative on that screen is no card.
        if (zone.kind !== 'pocket-narrow') expect(zone.width).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
      });

      it('gives the card a box at least as tall as the card itself needs', () => {
        // The regression this whole round is about. `CARD_MIN_MEASURED` is a
        // hard number read off the built preview rather than a re-statement of
        // the constant under test, so lowering `MIN_ADVISOR_HEIGHT` back to
        // something the card does not fit in fails here too.
        expect({ chapter, h: advisorZone(live)!.maxHeight }).toMatchObject({
          h: expect.any(Number) as number,
        });
        expect(advisorZone(live)!.maxHeight).toBeGreaterThanOrEqual(CARD_MIN_MEASURED);
        expect(advisorZone(live)!.maxHeight).toBeGreaterThanOrEqual(MIN_ADVISOR_HEIGHT);
      });
    });
  }

  it('takes the shelf in chapters 2 and 3, and the narrow pocket in chapter 1', () => {
    // Chapters 2 and 3 never raise the Sensor card, so their shelf runs from the
    // stage's top rail down to the party's heads and offers the full 104.
    // Chapter 1 does raise it, permanently, and what is left of its shelf is
    // 24 grid px — so the card goes to the one piece of clear ground on that
    // screen, the 93px pocket between Kimahri and the party-status column.
    expect(
      Object.fromEntries(
        Object.keys(PARTY).map((c) => [c, advisorZone({ ...LIVE[c]!, sprites: rectsFor(c) })!.kind]),
      ),
    ).toEqual({
      'seymour-flux': 'pocket-narrow',
      yunalesca: 'shelf',
      'braskas-final-aeon': 'shelf',
    });
  });

  it('never hands back the 24px shelf that shipped the sliced card', () => {
    // The exact board from the pre-deploy gate: Chapter 1, first turn, guide
    // and Sensor and intent all up. The old solver answered
    // `{ kind: 'shelf', maxHeight: 24.06 }` for a card whose shortest possible
    // rendering is 31 grid px, and the card was painted cut through the middle
    // of its own move line. Whatever this returns now, it is never that.
    const zone = advisorZone({ ...LIVE['seymour-flux']!, sprites: rectsFor('seymour-flux') })!;
    expect(zone.kind).not.toBe('shelf');
    expect(zone.maxHeight).toBeGreaterThanOrEqual(31);
    expect(zone.maxHeight).toBeGreaterThanOrEqual(MIN_ADVISOR_HEIGHT);
  });

  it('declines rather than return any box shorter than the card, at every band', () => {
    // A property over the whole family of boards the three chapters can reach:
    // push the Sensor card's bottom edge down one grid px at a time, which is
    // the thing that squeezed Chapter 1's shelf, and assert the answer is
    // always either null or a box the card fits in — never something between.
    for (const chapter of Object.keys(PARTY)) {
      for (let bottom = 24; bottom <= 200; bottom++) {
        const zone = advisorZone({
          ...LIVE[chapter]!,
          sensor: { left: 191.7, top: 24, right: 308.3, bottom },
          sprites: rectsFor(chapter),
        });
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

  it('stands beside the enemy-intent slab rather than ducking under it', () => {
    // Measured at 1280x720, and this is the whole reason the sub-band search
    // exists: the slab is pinned to the boss through the render camera, so its
    // grid-space left edge is 347.8 at 1600x900 and **339.7** at 1280x720. At
    // 347.8 it is right of `SHELF_RIGHT` and invisible to the shelf; at 339.7 it
    // is 0.3 grid px inside it, and a solver that answers "then the slab is my
    // ceiling" hands Chapter 2 a 23px box at one viewport and 104 at the other,
    // for the same board. Stopping a gap short of the slab costs 6px of width.
    const sprites = rectsFor('yunalesca');
    const tucked: Rect = { left: 339.7, top: 4, right: 489.7, bottom: 134.1 };
    const zone = advisorZone({ ...LIVE['yunalesca']!, intent: tucked, sprites })!;
    expect(zone.kind).toBe('shelf');
    expect(zone.maxHeight).toBe(MAX_ADVISOR_HEIGHT);
    expect(zone.left + zone.width).toBeLessThanOrEqual(tucked.left - GAP + 0.001);
    // And it is the *same* box the wider viewport solves, bar the gap it pays
    // to stand clear of the slab (6) and the 0.3 the slab reaches inside
    // SHELF_RIGHT at this viewport.
    const wide = advisorZone({ ...LIVE['yunalesca']!, sprites })!;
    expect(zone.bottom).toBe(wide.bottom);
    expect(zone.maxHeight).toBe(wide.maxHeight);
    // Within the gap it pays to stand clear of the slab, the 0.3 the slab
    // reaches inside SHELF_RIGHT at this viewport, and the couple of px of
    // difference in the shear each rail reserves.
    expect(wide.width - zone.width).toBeLessThanOrEqual(GAP + (SHELF_RIGHT - tucked.left) + 2);
  });

  it('keeps the card’s painted corners off the panels the skew reaches', () => {
    // The card is sheared and `.ig-stat-list`, `.sgd__panel` and `.ffx-cmd-area`
    // are not, so clearing them as *boxes* is not clearing them. Before
    // `shearedRails` the solved boxes were a clean 6 grid px clear and the
    // painted shapes were not: Chapter 1's top-right corner reached 0.8 px into
    // the party-status column and Chapter 2's bottom-left corner 0.5 px into the
    // strategy guide, both measured in Chromium off the built bundle.
    //
    // Checked at every height the density ladder can settle on, because which
    // corner reaches furthest, and how far, both move with the card's height.
    for (const chapter of Object.keys(PARTY)) {
      const zone = advisorZone({ ...LIVE[chapter]!, sprites: rectsFor(chapter) })!;
      for (let h = 8; h <= zone.maxHeight; h += 4) {
        const card = cardQuad(zone, h);
        for (const [name, r] of [
          ['party status', CHROME.partyStatus],
          ['strategy guide', CHROME.guide],
          ['command area', CHROME.cmdArea],
          ['CTB queue', CHROME.ctb],
          ['enemy intent', LIVE[chapter]!.intent],
          ...PARTY[chapter]!.map((s) => [`sprite ${s.name}`, s.quad] as const),
        ] as Array<readonly [string, Rect]>) {
          expect({ chapter, h, panel: name, hit: quadHitsRect(card, r) }).toMatchObject({ hit: false });
        }
      }
    }
  });

  it('clamps the band to the width the card was designed at', () => {
    // Guide off: the shelf measures 304 grid px, and a 304px NEXT BEST MOVE
    // slab is a letterbox rather than a card.
    const zone = advisorZone({ ...LIVE['yunalesca']!, guide: null, sprites: rectsFor('yunalesca') })!;
    expect(zone.width).toBe(MAX_ADVISOR_WIDTH);
  });

  it('still takes the pocket when an encounter does leave one', () => {
    // The pocket is not dead code: a party standing left of x 250 leaves 146
    // grid px of it, and that is the placement nearest where the card shipped.
    const tucked: Rect[] = [
      { left: 40, top: 180, right: 130, bottom: 320 },
      { left: 120, top: 170, right: 220, bottom: 330 },
    ];
    const zone = advisorZone({ ...CHROME, sprites: tucked })!;
    expect(zone.kind).toBe('pocket');
    expect(zone.left).toBeGreaterThanOrEqual(220 + GAP);
    expect(zone.width).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
  });

  it('keeps room above the card for its own chip', () => {
    // The chip rides above the card, so it is the chip that has to clear
    // whatever bounds the zone from above. The live matrix caught it poking
    // into the Sensor card in every state the Sensor was up.
    const sprites = rectsFor('braskas-final-aeon');
    const zone = advisorZone({ ...CHROME, sprites })!;
    const chipTop = 360 - zone.bottom - zone.maxHeight - ADVISOR_CHIP_RESERVE;
    expect(chipTop).toBeGreaterThanOrEqual(CHROME.sensor.bottom);
  });

  it('drops the shelf below the Sensor card rather than under it', () => {
    // A Sensor card shallow enough to leave the shelf standing: the deep one
    // Chapter 1 really shows leaves 24px and is declined outright, which is the
    // separate case above.
    const sprites = rectsFor('yunalesca');
    const shallow: Rect = { left: 191.7, top: 24, right: 308.3, bottom: 60 };
    const withSensor = advisorZone({ ...LIVE['yunalesca']!, sensor: shallow, sprites })!;
    const noSensor = advisorZone({ ...LIVE['yunalesca']!, sprites })!;
    expect(withSensor.kind).toBe('shelf');
    expect(withSensor.maxHeight).toBeLessThanOrEqual(noSensor.maxHeight);
    expect(cardRect(withSensor, withSensor.maxHeight).top).toBeGreaterThanOrEqual(shallow.bottom);
  });

  it('clears the command stack when a submenu grows it up into the shelf', () => {
    // Opening a Skill list raises the stack's top edge from 204.5 to 177.8,
    // which is inside Chapter 2's shelf. The card has to come up with it.
    const sprites = rectsFor('yunalesca');
    const open = { ...CHROME.cmdArea, top: 177.8 };
    const zone = advisorZone({ ...LIVE['yunalesca']!, cmdArea: open, sprites })!;
    const box = cardRect(zone, zone.maxHeight);
    expect(overlaps(box, open)).toBe(false);
    expect(box.bottom).toBeLessThanOrEqual(open.top - GAP + 0.001);
  });

  it('uses the whole band when the guide is off, since its rail is gone', () => {
    const sprites = rectsFor('yunalesca');
    const on = advisorZone({ ...LIVE['yunalesca']!, sprites })!;
    const off = advisorZone({ ...LIVE['yunalesca']!, guide: null, sprites })!;
    expect(off.left).toBeLessThan(on.left);
    expect(off.width).toBeGreaterThan(on.width);
  });

  it('hands back null rather than a nonsense box when the party fills the frame', () => {
    const wall: Rect[] = [{ left: 0, top: 0, right: 640, bottom: 360 }];
    expect(advisorZone({ ...CHROME, sprites: wall })).toBeNull();
  });

  it('keeps the measured gap between the card and whatever bounds it', () => {
    // Chapter 2, the shelf: right of the guide's rail, left of the party-status
    // column, standing `GAP` above the highest head under it.
    const sprites = rectsFor('yunalesca');
    const zone = advisorZone({ ...LIVE['yunalesca']!, sprites })!;
    const headsTop = Math.min(...sprites.map((r) => r.top));
    expect(zone.left).toBeGreaterThanOrEqual(CHROME.guide.right + GAP - 0.001);
    expect(zone.left + zone.width).toBeLessThanOrEqual(CHROME.partyStatus.left - GAP + 0.001);
    expect(360 - zone.bottom).toBeLessThanOrEqual(headsTop - GAP + 0.001);
  });

  it('keeps the measured gap between the narrow pocket and the party', () => {
    // Chapter 1, the pocket: it starts a full `GAP` right of Kimahri's
    // reconstructed edge and stops a full `GAP` short of the party-status rail.
    const sprites = rectsFor('seymour-flux');
    const zone = advisorZone({ ...LIVE['seymour-flux']!, sprites })!;
    const spritesRight = Math.max(...sprites.map((r) => r.right));
    expect(zone.left).toBeGreaterThanOrEqual(spritesRight + GAP - 0.001);
    expect(zone.left + zone.width).toBeLessThanOrEqual(CHROME.partyStatus.left - GAP + 0.001);
    // And its top clears the enemy-intent slab, which is what bounds it there.
    expect(cardRect(zone, zone.maxHeight).top).toBeGreaterThanOrEqual(CHROME.intent.bottom + GAP - 0.001);
  });

  it('never offers more height than the card was designed at', () => {
    // The pocket's raw room in chapters 1 and 3 is ~144px — well over the
    // card. Without the clamp the card grows to fill it and the NEXT BEST MOVE
    // slab becomes a column.
    for (const chapter of Object.keys(PARTY)) {
      expect(advisorZone({ ...LIVE[chapter]!, sprites: rectsFor(chapter) })!.maxHeight).toBeLessThanOrEqual(
        MAX_ADVISOR_HEIGHT,
      );
    }
  });

  it('still hands back the smaller room when that is honestly all there is', () => {
    // A shelf bounded above by a shallow Sensor card and below by the party's
    // heads: less than MAX_ADVISOR_HEIGHT, more than the card's minimum, and it
    // must survive rather than be rounded up to a box that is not there.
    const shallow: Rect = { left: 191.7, top: 24, right: 308.3, bottom: 60 };
    const sprites = rectsFor('yunalesca');
    const zone = advisorZone({ ...LIVE['yunalesca']!, sensor: shallow, sprites })!;
    const headsTop = Math.min(...sprites.map((r) => r.top));
    expect(zone.maxHeight).toBe(headsTop - GAP - (shallow.bottom + GAP) - ADVISOR_CHIP_RESERVE);
    expect(zone.maxHeight).toBeLessThan(MAX_ADVISOR_HEIGHT);
    expect(zone.maxHeight).toBeGreaterThanOrEqual(MIN_ADVISOR_HEIGHT);
  });

  it('parks the chip in a band no card could use, when it declines', () => {
    // Chapter 1 with every panel up and the party standing across the pocket
    // too: nothing holds the card, and the chip still must not fall back to the
    // stylesheet's anchor, which is on Tidus.
    const sprites = [...rectsFor('seymour-flux'), { left: 300, top: 150, right: 400, bottom: 340 }];
    const input = { ...LIVE['seymour-flux']!, sprites };
    expect(advisorZone(input)).toBeNull();
    const dock = advisorChipDock(input)!;
    expect(dock).not.toBeNull();
    // It sits in the 24px band under the Sensor card — too short for the card,
    // roomy for an 8px chip — and left of every sprite's column.
    expect(dock.left).toBeGreaterThanOrEqual(CHROME.guide.right + GAP - 0.001);
    expect(360 - dock.bottom).toBeLessThanOrEqual(Math.min(...sprites.map((r) => r.top)) - GAP + 0.001);
    expect(360 - dock.bottom).toBeGreaterThanOrEqual(CHROME.sensor.bottom + GAP + ADVISOR_CHIP_RESERVE - 0.001);
  });

  it('refuses a pocket too short to hold the card rather than squeezing one in', () => {
    // A party that stands clear of the pocket's x span but whose sprites hang
    // down to the stage floor leaves a wide pocket with no vertical room.
    const floorHugger: Rect[] = [{ left: 100, top: 20, right: 250, bottom: 356 }];
    const zone = advisorZone({
      ...CHROME,
      sensor: { left: 250, top: 24, right: 396, bottom: 330 },
      sprites: floorHugger,
    });
    expect(zone?.kind).not.toBe('pocket');
  });

  it('lifts the pocket clear of the Sensor card when the two share a column', () => {
    const tucked: Rect[] = [{ left: 40, top: 180, right: 220, bottom: 330 }];
    const low: Rect = { left: 226, top: 24, right: 396, bottom: 180 };
    const withSensor = advisorZone({ ...CHROME, sensor: low, sprites: tucked })!;
    expect(withSensor.kind).toBe('pocket');
    expect(cardRect(withSensor, withSensor.maxHeight).top).toBeGreaterThanOrEqual(low.bottom);
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

  it('takes the card down rather than slice it when nothing fits', () => {
    const hud = mountHud();
    hud.setProjector(wallProjector() as never);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const { card, root, chip } = advisorEls(hud);
    expect(hud.advisorPlacement).toBeNull();
    expect(card.hidden).toBe(true);
    expect(root.dataset['zone']).toBe('none');
    // The chip is the whole panel in this state, so it stays on the field.
    expect(chip.hidden).toBe(false);
  });

  it('brings the card back the moment a box exists again', () => {
    // A decline is a statement about this frame's screen, not a latch: the
    // Sensor card comes down, a member is KO'd out of the band, the player
    // switches the guide off, and the card is owed its box again.
    const hud = mountHud();
    hud.setProjector(wallProjector() as never);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const { card, root } = advisorEls(hud);
    expect(card.hidden).toBe(true);

    hud.setProjector((() => null) as never);
    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    hud.update(16);
    expect(hud.advisorPlacement).not.toBeNull();
    expect(card.hidden).toBe(false);
    expect(root.dataset['zone']).not.toBe('none');
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
