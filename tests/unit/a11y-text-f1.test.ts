/**
 * TEXT SIZE reaches the F1 battle HUD (lane a11y-text, 2026-10-29; round 30b PR-0559; BOTH games: Chapter I FFX and Chapter IV FFX-2, the two chapters the F1 HUD draws in).
 *
 * The finding: at TEXT SIZE 100 / 115 / 130 the desktop command labels measured 30.2 / 28.2 / 31.9 px in Chapter I and the party names 31.3 / 26.8 / 30.3 px in Chapter IV (1600x900, live release 66).
 * The cause: the F1 HUD is only drawn at 100 (release 67's `hudF1TextSizeOk`), its own type (12 and 12.5 grid px) is bigger than today's (9.8 and 9.3), and 115 handed the player today's HUD at 1.15 times
 * the smaller size. The F1 HUD now stays up and each of its zones grows by the setting about the corner it is pinned to (`ui/hudf1/hudf1-textsize.css`).
 *
 * jsdom has no layout, so this file computes it: it reads the REAL stylesheets (the F1 sheets, `text-size.css`, `text-size-wide.css`), evaluates the type sizes at 1280x720 and 1600x900 for 100, 115 and 130,
 * builds the box of every zone on the 640 x 360 grid from the declared `left` / `top` / `width` / `height` and grows it by the declared `scale`, `transform-origin` and `translate` (`helpers/f1Zones.ts`), and fails
 * if two zones overlap or one leaves the stage. The browser sweep in `docs/handoff/a11y-text.md` reads the same things from a running page.
 */
import { describe, expect, it } from 'vitest';
import { cmpSpec, evalLength, evalPair, lastDecl, leafRules, readSource, specificity, type CssRule } from './helpers/cssEval.ts';
import { FFX2_PFX, FFX2_ZONES, FFX_PFX, FFX_ZONES, SIZES, ctx, f1, f1ffx, f1ffx2, f1text, ffxCmdRows, num, overlap, painted, tsFfx, tsWide, boxOf, x2Party, type Box, type Zone } from './helpers/f1Zones.ts';

const floorF1 = leafRules(readSource('src/ui/hudf1/hudf1-floor.css'));
const WINDOWS = [
  { name: '1280x720', vw: 1280, vh: 720, lb: 2 },
  { name: '1600x900', vw: 1600, vh: 900, lb: 2.5 },
] as const;

describe('the boxes of the F1 zones, computed from the real sheets', () => {
  for (const [game, zones] of [['Chapter I (FFX)', FFX_ZONES], ['Chapter IV (FFX-2)', FFX2_ZONES]] as const) {
    describe(game, () => {
      for (const ts of SIZES) {
        it(`at TEXT SIZE ${Math.round(ts * 100)}: every zone stays on the 640 x 360 stage and none overlaps another`, () => {
          const boxes = zones.map((z) => ({ z, b: painted(z, ts) }));
          for (const { z, b } of boxes) {
            expect(b.l, `${z.name} left`).toBeGreaterThanOrEqual(-0.01);
            expect(b.t, `${z.name} top`).toBeGreaterThanOrEqual(-0.01);
            expect(b.l + b.w, `${z.name} right`).toBeLessThanOrEqual(640.01);
            expect(b.t + b.h, `${z.name} bottom`).toBeLessThanOrEqual(360.01);
          }
          for (let i = 0; i < boxes.length; i++)
            for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i]!.b, boxes[j]!.b), `${boxes[i]!.z.name} over ${boxes[j]!.z.name} at ${ts}`).toBe(0);
        });
      }
    });
  }

  it('Chapter I: the left column keeps its foot where it is (28, 313.5) and its order (hero over cue over verbs) at 115 and 130', () => {
    for (const ts of SIZES) {
      const [hero, cue, verbs] = ['hero', 'cue', 'verbs'].map((n) => painted(FFX_ZONES.find((z) => z.name === n)!, ts)) as [Box, Box, Box];
      expect(verbs.t + verbs.h, `foot at ${ts}`).toBeCloseTo(313.5, 3);
      expect(verbs.l).toBeCloseTo(28, 3);
      expect(hero.l).toBeCloseTo(28, 3);
      expect(cue.l).toBeCloseTo(28, 3);
      expect(hero.t + hero.h, 'hero ends above the cue').toBeLessThanOrEqual(cue.t + 0.01);
      expect(cue.t + cue.h, 'cue ends above the verbs').toBeLessThanOrEqual(verbs.t + 0.01);
    }
  });

  it('Chapter IV: the right column keeps its right edge (622) and its order, and ends above the party cards at every size', () => {
    for (const ts of SIZES) {
      const [hero, cue, verbs, party] = ['hero', 'cue', 'verbs', 'party cards'].map((n) => painted(FFX2_ZONES.find((z) => z.name === n)!, ts)) as [Box, Box, Box, Box];
      expect(verbs.l + verbs.w + 10 * ts, `right edge at ${ts}`).toBeCloseTo(622, 3);
      expect(hero.t + hero.h).toBeLessThanOrEqual(cue.t + 0.01);
      expect(cue.t + cue.h).toBeLessThanOrEqual(verbs.t + 0.01);
      expect(verbs.t + verbs.h, 'the window ends above the first party card').toBeLessThanOrEqual(party.t + 0.01);
    }
  });

  it("the foot and the right edge are the F1 sheets' own numbers (a move of the hero, the cue or the verbs in the F1 sheets must move the origins with it)", () => {
    // Chapter I: the foot is the verbs' top plus the five-row list's height; each origin is the foot's distance below that box's own top
    const foot = num(f1ffx, '.ffxhud.hud-f1 .ffx-cmd-area', 'top') + ffxCmdRows.h;
    expect(foot).toBeCloseTo(313.5, 3);
    expect(evalPair(lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1 .ffx-cmd-area`, 'transform-origin')!, ctx(1))[1]).toBeCloseTo(foot - num(f1ffx, '.ffxhud.hud-f1 .ffx-cmd-area', 'top'), 3);
    expect(evalPair(lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-hero`, 'transform-origin')!, ctx(1))[1]).toBeCloseTo(foot - num(f1, '.f1-hero', 'top'), 3);
    // the cue's translate is (scale - 1) x (its centre - the foot's corner)
    const cue = boxOf(f1, '.f1-cue');
    const [tx, ty] = evalPair(lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-cue`, 'translate')!, ctx(2)); // scale 2: the factor (scale - 1) is 1
    expect(tx).toBeCloseTo(cue.l + cue.w / 2 - num(f1ffx, '.ffxhud.hud-f1 .ffx-cmd-area', 'left'), 3);
    expect(ty).toBeCloseTo(cue.t + cue.h / 2 - foot, 3);
    // the ribbon and the bars pin their corners (top left; bottom left)
    const rib = boxOf(f1, '.f1-ribbon');
    const [rx, ry] = evalPair(lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-ribbon`, 'translate')!, ctx(2));
    expect([rx, ry]).toEqual([rib.w / 2, rib.h / 2]);
    const bar = boxOf(f1, '.f1-prompts');
    const [bx, by] = evalPair(lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-prompts`, 'translate')!, ctx(2));
    expect([bx, by]).toEqual([bar.w / 2, -bar.h / 2]);
    const bar2 = FFX2_ZONES.find((z) => z.name === 'prompt bar')!.box;
    const [b2x, b2y] = evalPair(lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-prompts`, 'translate')!, ctx(2));
    expect([b2x, b2y]).toEqual([bar2.w / 2, -bar2.h / 2]);
    // Chapter IV: the window's content ends where the origin is (content foot), the rest lifts by the party's height x (scale - 1)
    const v = FFX2_ZONES.find((z) => z.name === 'verbs')!;
    const contentFoot = v.box.t + v.box.h - v.pad![2];
    const rightEdge = v.box.l + v.box.w;
    expect(rightEdge).toBe(622);
    expect(evalPair(lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .ffx2hud__command`, 'transform-origin')!, ctx(1))).toEqual([v.box.w, contentFoot - v.box.t]);
    expect(evalPair(lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-hero`, 'transform-origin')!, ctx(1))).toEqual([rightEdge - num(f1ffx2, '.ffx2hud.hud-f1 .f1-hero', 'left'), contentFoot - num(f1ffx2, '.ffx2hud.hud-f1 .f1-hero', 'top')]);
    expect(evalPair(lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .ffx2hud__command`, 'translate')!, ctx(2))[1]).toBe(-x2Party.h);
    const cue2 = FFX2_ZONES.find((z) => z.name === 'cue')!.box;
    const [c2x, c2y] = evalPair(lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-cue`, 'translate')!, ctx(2));
    expect(c2x).toBeCloseTo(cue2.l + cue2.w / 2 - rightEdge, 3);
    expect(c2y).toBeCloseTo(cue2.t + cue2.h / 2 - contentFoot - x2Party.h, 3);
  });
});

// ------------------------------------------------------------------------------------------ the type

describe('PR-0559: the F1 battle type rises with TEXT SIZE (computed sizes from the real stylesheets)', () => {
  /** [what, game, the F1 rule that sets the size, the zone that grows it (its `scale` rule)] */
  const TEXT: ReadonlyArray<readonly [string, string, readonly CssRule[], string, readonly CssRule[], string]> = [
    ['Chapter I command labels', 'ffx', f1ffx, '.ffxhud.hud-f1 .ffx-cmd__label', f1text, `${FFX_PFX} .ffxhud.hud-f1 .ffx-cmd-area`],
    ['Chapter I party names', 'ffx', f1ffx, '.ffxhud.hud-f1 .ig-stat__name', tsFfx, `${FFX_PFX} .ffxhud__stage > .ig-stat-list`],
    ['Chapter I party HP', 'ffx', f1ffx, '.ffxhud.hud-f1 .ig-stat__value', tsFfx, `${FFX_PFX} .ffxhud__stage > .ig-stat-list`],
    ['Chapter I hero name', 'ffx', f1, '.f1-hero__name', f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-hero`],
    ['Chapter I boss ribbon name', 'ffx', f1, '.f1-ribbon__name', f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-ribbon`],
    ['Chapter IV command labels', 'ffx2', f1ffx2, '.ffx2hud.hud-f1 .ffx2cmd__label', f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .ffx2hud__command`],
    ['Chapter IV party names', 'ffx2', f1ffx2, '.ffx2hud.hud-f1 .ig-stat__name', tsWide, `${FFX2_PFX} .ffx2hud__stage > .ffx2hud__party`],
    ['Chapter IV party HP', 'ffx2', f1ffx2, '.ffx2hud.hud-f1 .ig-stat__value', tsWide, `${FFX2_PFX} .ffx2hud__stage > .ffx2hud__party`],
    ['Chapter IV hero name', 'ffx2', f1, '.f1-hero__name', f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-hero`],
  ];
  const sizeOf = (rules: readonly CssRule[], sel: string): string => {
    const direct = lastDecl(rules, sel, 'font-size');
    if (direct !== undefined) return direct;
    const font = lastDecl(rules, sel, 'font'); // `700 16px/1 face`
    const m = font && /(?:^|\s)(\d[\d.]*px)\//.exec(font);
    if (!m) throw new Error(`${sel} sets no size`);
    return m[1]!;
  };

  for (const [what, , sizeRules, sizeSel, zoneRules, zoneSel] of TEXT) {
    for (const w of WINDOWS) {
      it(`${what} at ${w.name}: the painted size grows by exactly the setting and is never under 14 px`, () => {
        const authored = parseFloat(sizeOf(sizeRules, sizeSel));
        const drawn = SIZES.map((ts) => {
          const zoneScale = evalLength(lastDecl(zoneRules, zoneSel, 'scale') ?? '1', ctx(ts, w));
          return authored * w.lb * zoneScale;
        });
        expect(drawn[1]!, `${what}: 115 draws bigger than 100`).toBeGreaterThan(drawn[0]!);
        expect(drawn[2]!, `${what}: 130 draws bigger than 115`).toBeGreaterThan(drawn[1]!);
        expect(drawn[1]! / drawn[0]!).toBeCloseTo(1.15, 6);
        expect(drawn[2]! / drawn[0]!).toBeCloseTo(1.3, 6);
        expect(drawn[0]!, `${what} at 100 is over the 14 px floor on its own`).toBeGreaterThanOrEqual(14);
      });
    }
  }

  it('the round-30b numbers: the command label at 1600x900 was 30.2 / 28.2 / 31.9 (down, then up); it is now 30 / 34.5 / 39 (up, up)', () => {
    const authored = parseFloat(sizeOf(f1ffx, '.ffxhud.hud-f1 .ffx-cmd__label'));
    expect(authored).toBe(12);
    const at = (ts: number): number => authored * 2.5 * evalLength(lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1 .ffx-cmd-area`, 'scale')!, ctx(ts));
    expect([at(1), at(1.15), at(1.3)].map((v) => Math.round(v * 10) / 10)).toEqual([30, 34.5, 39]);
  });

  it('the F1 floor sheet still floors the small F1 type at 14 px under the grown zones (it only ever raises a size)', () => {
    const small = lastDecl(floorF1, 'html:not([data-phone-battle]) .ffxhud.hud-f1 .ig-stat__value small', 'font-size');
    expect(small).toBe('max(7.5px, var(--hud-floor))');
    for (const w of WINDOWS) expect(evalLength(small!, { vw: w.vw, vh: w.vh, vars: { '--hud-floor': `${14.1 / w.lb}px` } }) * w.lb).toBeGreaterThanOrEqual(14.1);
  });
});

// ------------------------------------------------------------------------------------------ the cascade

describe('the F1 text-size rules are scoped and outrank the rules they replace', () => {
  it('every selector starts from the text-size attribute that is not 100 and not the phone (nothing here matches at 100, on the phone, or with F1 off)', () => {
    for (const r of f1text) {
      expect(r.sel.startsWith(FFX_PFX) || r.sel.startsWith(FFX2_PFX), r.sel).toBe(true);
      expect(r.sel, r.sel).toContain('.hud-f1');
    }
  });

  const beats = (mine: string, theirs: string, rules: readonly CssRule[]): void => {
    expect(cmpSpec(specificity(mine), specificity(theirs)), `${mine} over ${theirs}`).toBeGreaterThan(0);
    expect(rules.some((r) => r.sel === theirs), `the sheet still has ${theirs}`).toBe(true);
  };

  it('Chapter I: the verbs\' origin, the banner and Intel\'s chips', () => {
    beats(`${FFX_PFX} .ffxhud.hud-f1 .ffx-cmd-area`, `${FFX_PFX} .ffxhud__stage > .ffx-cmd-area`, tsFfx);
    beats(`${FFX_PFX} .ffxhud.hud-f1 .ig-banner`, '.ffxhud.hud-f1 .ig-banner', f1ffx);
    beats(`${FFX_PFX} .ffxhud.hud-f1.f1-intel .sgd`, '.hud-f1.f1-intel .sgd', f1);
    beats(`${FFX_PFX} .ffxhud.hud-f1.f1-intel .mad__card[data-zone='tip']`, ".ffxhud.hud-f1.f1-intel .mad__card[data-zone='tip']", f1);
  });

  it('Chapter IV: the window\'s scale, origin, lift and cap, and the tip chip', () => {
    const mine = `${FFX2_PFX} .ffx2hud.hud-f1 .ffx2hud__command`;
    beats(mine, `${FFX2_PFX} .ffx2hud__stage > .ffx2hud__command`, tsWide);
    beats(mine, "html[data-text-size-wide='115']:not([data-phone-battle]) .ffx2hud__stage > .ffx2hud__command", tsWide);
    beats(mine, "html[data-text-size-wide='130']:not([data-phone-battle]) .ffx2hud__stage > .ffx2hud__command", tsWide);
    beats(mine, '.ffx2hud.hud-f1 .ffx2hud__command', f1ffx2);
    beats(`${mine}:has(.ffx2cmd__title)`, '.ffx2hud.hud-f1 .ffx2hud__command:has(.ffx2cmd__title)', f1ffx2);
    beats(`${FFX2_PFX} .ffx2hud.hud-f1.f1-intel .mad__card[data-zone='tip']`, ".ffx2hud.hud-f1.f1-intel .mad__card[data-zone='tip']", f1ffx2);
  });

  it("Intel's Sensor card keeps its place: today's step up and left (-34, -56 at 130) would put it across the turn strip; F1's rule drops the step and outranks today's", () => {
    const sensor = FFX_ZONES.find((z) => z.name === 'sensor card (Intel)')!;
    const strip = FFX_ZONES.find((z) => z.name === 'turn strip')!;
    const todays: Zone = { ...sensor, effects: [sensor.effects[0]!, [[{ sel: 'today', at: '', body: 'translate: -34px -56px' }], 'today']] };
    expect(overlap(painted(todays, 1.3), painted(strip, 1.3)), "today's step lands on the strip").toBeGreaterThan(1000);
    expect(overlap(painted(sensor, 1.3), painted(strip, 1.3))).toBe(0);
    const mine = `${FFX_PFX} .ffxhud.hud-f1:not(.f1-acting) .ffx-sensor`;
    expect(lastDecl(f1text, mine, 'translate')).toBe('none');
    beats(mine, "html[data-text-size='115']:not([data-phone-battle]) .ffxhud__stage > .ffx-sensor", tsFfx);
    beats(mine, "html[data-text-size='130']:not([data-phone-battle]) .ffxhud__stage > .ffx-sensor", tsFfx);
  });

  it("the F1 window keeps its own cap at 115 and 130 (114 for four rows, 98 under a title), not today's 179 / 147", () => {
    expect(lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .ffx2hud__command`, 'max-height')).toBe(lastDecl(f1ffx2, '.ffx2hud.hud-f1 .ffx2hud__command', 'max-height'));
    expect(lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .ffx2hud__command:has(.ffx2cmd__title)`, 'max-height')).toBe(lastDecl(f1ffx2, '.ffx2hud.hud-f1 .ffx2hud__command:has(.ffx2cmd__title)', 'max-height'));
  });

  it("Intel's chips step by what the ribbon grew: the rules give the 100 % places back at 100 (22, 166, 196)", () => {
    const at100 = (sel: string, prop: string): string => String(evalLength(lastDecl(f1text, sel, prop)!.replace(/^translate[XY]\(|\)\s*(skewX\(.*\))?$/g, '').replace(/^calc\(/, 'calc('), ctx(1)));
    expect(at100(`${FFX_PFX} .ffxhud.hud-f1.f1-intel .sgd`, 'transform')).toBe('22');
    const tipX = lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1.f1-intel .mad__card[data-zone='tip']`, 'transform')!;
    expect(evalLength(/translateX\((.*?)\) skewX/.exec(tipX)![1]!, ctx(1))).toBe(166);
    const left = lastDecl(f1text, `${FFX2_PFX} .ffx2hud.hud-f1.f1-intel .mad__card[data-zone='tip']`, 'left')!;
    expect(evalLength(left, ctx(1))).toBe(196);
    // and they match the F1 sheets' own numbers at 100
    expect(lastDecl(f1, '.hud-f1.f1-intel .sgd', 'transform')).toBe('translateY(22px)');
    expect(lastDecl(f1, ".ffxhud.hud-f1.f1-intel .mad__card[data-zone='tip']", 'transform')).toBe('translateX(166px) skewX(var(--ig-skew))');
    expect(lastDecl(f1ffx2, ".ffx2hud.hud-f1.f1-intel .mad__card[data-zone='tip']", 'left')).toBe('196px');
  });
});
