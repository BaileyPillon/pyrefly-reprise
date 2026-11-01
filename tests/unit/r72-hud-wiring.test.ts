// @vitest-environment jsdom
/**
 * THE REAL FFX HUD GIVING THE ADVISOR'S SOLVER THE F1 RIBBON (lane r72-hud, review fixes of 2026-11-01; FFX ONLY: Chapter IX `yojimbo-cavern`, Chapter XII `seymour-omnis`; rule 14: FFX-2's HUD never reaches this solver).
 *
 * The first pass pinned `FFXBattleHud.solveAdvisorPlacement`'s two new inputs by source text only, and the review's mutants C1 and C2 (the two lists neutralised with `.slice(0, 0)`, the text kept) survived 1,934 tests.
 * The inputs now come from two pure functions (`hudAvoidSelectors.advisorInkRects` and `advisorKeepOffRects`), tested on small trees below, and the HUD is run for real here (jsdom: nothing is laid out, so the boxes a
 * browser would measure are supplied, in the stage's grid px, through `getBoundingClientRect` the way `ui-ffx-advisor-tip.test.ts` supplies the intent panel's). What is asserted is the end result a player sees:
 *
 *  - Chapter IX with the gauge up and the F1 HUD on: the one-row tip is solved clear of the ribbon (without the ribbon in `keepOff` it stands on it);
 *  - Chapter XII with the read-out live and the F1 HUD on: the designed card (which reads the ribbon as ink) and the tip both stand clear of it;
 *  - Chapter I (the F1 HUD on, no marker, no gauge up), the F1 HUD off, a hidden gauge: the placement is EXACTLY what it is with no ribbon at all (the ribbon is not an obstacle there).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { advisorInkRects, advisorKeepOffRects } from '../../src/ui/ffx/hudAvoidSelectors.ts';
import { ADVISOR_CHIP_RESERVE, GAP, STAGE, type AdvisorZone, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { apart, badge, bar } from './helpers/r72HudBoards.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });

afterEach(() => {
  document.body.innerHTML = '';
});

/** The window the HUD is laid out in under jsdom: 1024 x 768, so scale 1.6 and the stage's origin at (-512, -288) viewport px (`ui-ffx-advisor-tip.test.ts`). */
const K = 1.6;
const toViewport = (r: Rect): DOMRect => {
  const left = r.left * K - 512, top = r.top * K - 288, right = r.right * K - 512, bottom = r.bottom * K - 288;
  return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) } as DOMRect;
};
/** Make an element measure as `grid` (the stage's 640 x 360 grid px). */
function place(el: Element, grid: Rect): void {
  (el as HTMLElement).getBoundingClientRect = (): DOMRect => toViewport(grid);
}

/** Three sprites shoulder to shoulder from grid y 60 down (`ui-ffx-advisor-tip.test.ts` `topBandProjector`): the top 54 grid px of the stage are clear, which holds a tip and no designed card. */
function topBandProjector(): (id: string, anchor: string) => { x: number; y: number } {
  const xs = new Map<string, number>();
  const columns = [-352, 0, 352];
  return (id, anchor) => {
    if (!xs.has(id)) xs.set(id, columns[xs.size % columns.length]!);
    const x = xs.get(id)!;
    return anchor === 'head' ? { x, y: -133.6 } : { x, y: 283.8 };
  };
}

/** The F1 boss ribbon as the r71 sheets read it at 1600 x 900 and 100 percent: x 25 to 191, y 12 to 38. */
const RIBBON = R(25, 12, 191, 38);

type State = { f1?: boolean; omnis?: boolean; gauge?: 'up' | 'hidden' | null; ribbon?: boolean };

/** Mount the real HUD with the party in the top band's way, put it in the given chapter's state, and solve. */
function solve(state: State, projector: ((id: string, anchor: string) => { x: number; y: number }) | null = topBandProjector(), ribbonAt: Rect = RIBBON): { hud: FFXBattleHud; zone: AdvisorZone | null } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  if (projector) hud.setProjector(projector as never);
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  if (state.f1) hud.el.classList.add('hud-f1');
  if (state.omnis) hud.el.setAttribute('data-omnis-readout', '');
  const zg = hud.el.querySelector<HTMLElement>('.ffx-zg');
  if (zg && state.gauge) zg.hidden = state.gauge === 'hidden';
  const ribbon = hud.el.querySelector<HTMLElement>('.f1-ribbon');
  if (ribbon && state.ribbon !== false) place(ribbon, ribbonAt);
  hud.update(16);
  return { hud, zone: hud.advisorPlacement };
}

describe('the F1 ribbon is on the HUD the test mounts', () => {
  it('the HUD mounts the F1 layer\'s ribbon and the Zanmato gauge (hidden), the two things the state below switches', () => {
    const { hud } = solve({});
    expect(hud.el.querySelector('.f1-ribbon')).not.toBeNull();
    expect(hud.el.querySelector<HTMLElement>('.ffx-zg')).not.toBeNull();
    expect(hud.el.querySelector<HTMLElement>('.ffx-zg')!.hidden).toBe(true);
  });
});

describe('Chapter IX (FFX only): the real HUD stands the one-row tip clear of the F1 ribbon while the gauge is up', () => {
  it('without the ribbon as an obstacle the tip stands on it (the board is a real one: the ribbon is in the tip\'s way)', () => {
    const { zone } = solve({ f1: true, gauge: 'hidden' }); // F1 on, gauge hidden = Chapter I's state
    expect(zone?.kind).toBe('tip');
    expect(apart(bar(zone!), RIBBON), 'the bar against the ribbon').toBeLessThan(0);
  });

  it('with the gauge up and the F1 HUD on: still a tip, clear of the ribbon by GAP, badge included', () => {
    const { zone } = solve({ f1: true, gauge: 'up' });
    expect(zone?.kind).toBe('tip');
    expect(apart(bar(zone!), RIBBON), 'bar').toBeGreaterThanOrEqual(GAP - 0.01);
    expect(apart(badge(zone!), RIBBON), 'badge').toBeGreaterThanOrEqual(GAP - 0.01);
  });

  it('the gauge up with the F1 HUD OFF (today\'s HUD, ?hud=today, ?treated=pack, TEXT SIZE 130): the placement is the one with no ribbon at all', () => {
    expect(solve({ f1: false, gauge: 'up' }).zone).toEqual(solve({ f1: true, gauge: 'hidden' }).zone);
  });
});

describe('Chapter XII (FFX only): the real HUD keeps the designed card and the tip clear of the F1 ribbon while the disc read-out is live', () => {
  it('the tip: clear of the ribbon by GAP; with no marker (Chapter I) it is on it', () => {
    const { zone } = solve({ f1: true, omnis: true });
    expect(zone?.kind).toBe('tip');
    expect(apart(bar(zone!), RIBBON)).toBeGreaterThanOrEqual(GAP - 0.01);
    expect(apart(badge(zone!), RIBBON)).toBeGreaterThanOrEqual(GAP - 0.01);
    expect(apart(bar(solve({ f1: true }).zone!), RIBBON), 'Chapter I').toBeLessThan(0);
  });

  it('the F1 HUD off: the placement is the one with no ribbon at all', () => {
    expect(solve({ f1: false, omnis: true }).zone).toEqual(solve({ f1: true }).zone);
  });

  describe('the designed card (an open sky: no party in the way, so the card stands at x 213 to 439, y 95 to 199 and its chip above it)', () => {
    // A ribbon stub across the card's ground. The real ribbon is at the top left; where it stands is not the point, that the solver reads it as ink in XII and not elsewhere is.
    const IN_THE_WAY = R(213, 100, 440, 140);
    const cardBox = (z: AdvisorZone): Rect => R(z.left - 9, STAGE.height - z.bottom - z.maxHeight - ADVISOR_CHIP_RESERVE, z.left + z.width + 9, STAGE.height - z.bottom);
    const open = (state: State): AdvisorZone | null => solve(state, null, IN_THE_WAY).zone;

    it('with no ribbon in play the card is on that ground (a card, not a tip), which is what makes the next case a test', () => {
      const z = open({ f1: true });
      expect(z?.kind).not.toBe('tip');
      expect(apart(cardBox(z!), IN_THE_WAY)).toBeLessThan(0);
    });

    it('Chapter XII (the read-out live, F1 on): the ribbon is ink, so the card (or the tip it falls to) stands clear of it by GAP', () => {
      const z = open({ f1: true, omnis: true });
      expect(z).not.toBeNull();
      const painted = z!.kind === 'tip' ? [bar(z!), badge(z!)] : [cardBox(z!)];
      for (const p of painted) expect(apart(p, IN_THE_WAY), z!.kind).toBeGreaterThanOrEqual(GAP - 0.01);
    });

    it('Chapter IX (the gauge up) reads the ribbon for the TIP only: the designed card is where it is with no ribbon (it does not move there)', () => {
      expect(open({ f1: true, gauge: 'up' })).toEqual(open({ f1: true }));
    });

    it('the F1 HUD off, or the marker without the F1 HUD: the card is where it is with no ribbon', () => {
      expect(open({ f1: false, omnis: true })).toEqual(open({ f1: true }));
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------- the two builders, on small trees

describe('hudAvoidSelectors.advisorInkRects and advisorKeepOffRects: what the solver is given in each chapter', () => {
  const tree = (o: { f1?: boolean; omnis?: boolean; gauge?: 'up' | 'hidden' | null }): { root: HTMLElement; ribbon: HTMLElement; strip: HTMLElement; chip: HTMLElement } => {
    const root = document.createElement('div');
    root.className = o.f1 === false ? 'ffxhud' : 'ffxhud hud-f1';
    if (o.omnis) root.setAttribute('data-omnis-readout', '');
    const stage = document.createElement('div');
    if (o.gauge) {
      const zg = document.createElement('div');
      zg.className = 'ffx-zg';
      zg.hidden = o.gauge === 'hidden';
      stage.append(zg);
    }
    const ribbon = document.createElement('div');
    ribbon.className = 'f1-ribbon';
    const strip = document.createElement('div');
    strip.className = 'ffx-omr__strip';
    const chip = document.createElement('button');
    chip.className = 'sgd__toggle';
    stage.append(ribbon, strip, chip);
    root.append(stage);
    document.body.append(root);
    place(ribbon, R(25.2, 12.5, 190.7, 37.5));
    place(strip, R(272.1, 5.2, 457.2, 36));
    place(chip, R(20, 33, 80, 44));
    return { root, ribbon, strip, chip };
  };
  const rectOf = (el: HTMLElement | null): Rect | null => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const g = (v: number): number => Math.round(v * 1e6) / 1e6; // (x * 1.6 - 512 + 512) / 1.6 is 3.9999999999999996 for 4: the HUD's own stageRect snaps outwards from there
    return { left: g((b.left + 512) / K), top: g((b.top + 288) / K), right: g((b.right + 512) / K), bottom: g((b.bottom + 288) / K) };
  };
  const near = (a: Rect | undefined, b: Rect): void => {
    expect(a).toBeDefined();
    for (const k of ['left', 'top', 'right', 'bottom'] as const) expect(a![k], k).toBeCloseTo(b[k], 6);
  };

  it('Chapter XII: the ink holds the ribbon, snapped OUTWARDS to whole px, beside the strip; the tip\'s keepOff holds the ribbon and the guide\'s chip', () => {
    const t = tree({ omnis: true });
    const ink = advisorInkRects(t.root, [], rectOf);
    expect(ink.length).toBe(2); // the strip and the ribbon (no gauge, no panels of the other chapters)
    near(ink.find((r) => r.top === 12), R(25, 12, 191, 38)); // 25.2 -> 25, 12.5 -> 12, 190.7 -> 191, 37.5 -> 38
    near(ink.find((r) => r.top === 5), R(272, 5, 458, 36));
    const keep = advisorKeepOffRects(t.root, rectOf);
    expect(keep.length).toBe(2);
    near(keep.find((r) => r.top === 12), R(25, 12, 191, 38));
    near(keep.find((r) => r.top === 33), R(20, 33, 80, 44));
  });

  it('Chapter IX (the gauge up): the ribbon is keepOff for the tip and NOT ink (the designed card does not read it, so it does not move)', () => {
    const t = tree({ gauge: 'up' });
    expect(advisorKeepOffRects(t.root, rectOf).some((r) => r.top === 12), 'keepOff').toBe(true);
    expect(advisorInkRects(t.root, [], rectOf).some((r) => r.top === 12), 'ink').toBe(false);
  });

  it('Chapter I, a hidden gauge, F1 off: no ribbon in either list; the guide\'s chip stays in keepOff', () => {
    for (const o of [{}, { gauge: 'hidden' as const }, { f1: false, omnis: true }, { f1: false, gauge: 'up' as const }]) {
      const t = tree(o);
      expect(advisorKeepOffRects(t.root, rectOf).some((r) => r.top === 12), JSON.stringify(o)).toBe(false);
      expect(advisorInkRects(t.root, [], rectOf).some((r) => r.top === 12), JSON.stringify(o)).toBe(false);
      expect(advisorKeepOffRects(t.root, rectOf).some((r) => r.top === 33), `${JSON.stringify(o)}: the chip`).toBe(true);
    }
  });

  it('a box that measures nothing (hidden, zero size) is skipped, and the gauge\'s own elements come first', () => {
    const t = tree({ omnis: true });
    t.strip.getBoundingClientRect = (): DOMRect => toViewport(R(0, 0, 0, 0));
    const rect = (el: HTMLElement | null): Rect | null => {
      const r = rectOf(el);
      return r && r.right > r.left && r.bottom > r.top ? r : null;
    };
    expect(advisorInkRects(t.root, [], rect).length).toBe(1);
    const gaugeEl = document.createElement('div');
    place(gaugeEl, R(221, 4, 425, 64));
    near(advisorInkRects(t.root, [gaugeEl], rect)[0], R(221, 4, 425, 64));
  });
});

describe('FFXBattleHud.ts calls the two builders with its own stage rect, and did not grow', () => {
  const src = readFileSync(resolve('src/ui/ffx/FFXBattleHud.ts'), 'utf8');

  it('one call each, nothing chained on it (a `.slice(0, 0)` survived the old substring guard)', () => {
    expect(src).toContain('const inkRects = advisorInkRects(this.el, this.zanmato.obstacleEls(), (e) => this.stageRect(e));');
    expect(src).toContain('keepOff: advisorKeepOffRects(this.el, (e) => this.stageRect(e)),');
    expect(src).not.toMatch(/advisor(Ink|KeepOff)Rects\([^\n]*\)\s*\./);
  });

  it('the file is over 400 lines and must not grow', () => {
    expect((src.match(/\n/g) ?? []).length).toBeLessThanOrEqual(1811);
  });
});
