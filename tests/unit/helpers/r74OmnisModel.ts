/**
 * THE MODEL OF THE RECORDED R72 WALKS (lane r74-omnis, 2026-11-02; FFX only): the windows, the helpers and the `Model` class that `r74-omnis-walk.test.ts` runs the 290 recorded stops through, moved here unchanged so the review's
 * sweep of flag places (`r74-omnis-review-fixes.test.ts`) runs the same boards, the same builders and the same solver. A helper, not a test file; it needs a DOM (`@vitest-environment jsdom`) because the model builds a HUD tree.
 */
import { advisorZone } from '../../../src/ui/ffx/advisorStrip.ts';
import { advisorInkRects, advisorKeepOffRects } from '../../../src/ui/ffx/hudAvoidSelectors.ts';
import { SKEW, type AdvisorZone, type AdvisorZoneInput, type Rect } from '../../../src/ui/ffx/hudSafeZones.ts';
import { BOARDS, badge, bar } from './r72HudBoards.ts';
import { type Stop } from './r74OmnisWalk.ts';

export const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
export const snap = (r: Rect, q: number): Rect => R(Math.floor(r.left / q) * q, Math.floor(r.top / q) * q, Math.ceil(r.right / q) * q, Math.ceil(r.bottom / q) * q);
export const boxOf = (x: number, y: number, w: number, h: number): Rect => R(x, y, x + w, y + h);
export const flagOf = (s: Stop): Rect => boxOf(s[1], s[2], s[3], s[4]);
export const recordedAdvisor = (s: Stop): Rect => boxOf(s[5], s[6], s[7], s[8]);
export const sensorOf = (s: Stop): Rect => boxOf(s[9], s[10], s[11], s[12]);

/** The windows and TEXT SIZES with a record, each with the board the model uses (the r71 sheets read 1280, 1600 and 2560; the F1 layout is grid-fixed, so the 1600 board stands for 1366, 1440, 1536 and 1920; 3440 is 2560 shifted 440 px and is not modelled). */
export const WINDOWS: ReadonlyArray<{ key: string; w: number; h: number; ts: number; board: string; modelled: boolean }> = [
  { key: '100@1280x720', w: 1280, h: 720, ts: 1, board: 'XII 100 1280x720 intel+target', modelled: true },
  { key: '100@1366x768', w: 1366, h: 768, ts: 1, board: 'XII 100 1600x900 intel+target', modelled: true },
  { key: '100@1440x810', w: 1440, h: 810, ts: 1, board: 'XII 100 1600x900 intel+target', modelled: true },
  { key: '100@1536x864', w: 1536, h: 864, ts: 1, board: 'XII 100 1600x900 intel+target', modelled: true },
  { key: '100@1600x900', w: 1600, h: 900, ts: 1, board: 'XII 100 1600x900 intel+target', modelled: true },
  { key: '100@1920x1080', w: 1920, h: 1080, ts: 1, board: 'XII 100 1600x900 intel+target', modelled: true },
  { key: '100@2560x1440', w: 2560, h: 1440, ts: 1, board: 'XII 100 2560x1440 intel+target', modelled: true },
  { key: '100@3440x1440', w: 3440, h: 1440, ts: 1, board: 'XII 100 2560x1440 intel+target', modelled: false },
  { key: '115@1280x720', w: 1280, h: 720, ts: 1.15, board: 'XII 115 1280x720 intel', modelled: true },
  { key: '115@1600x900', w: 1600, h: 900, ts: 1.15, board: 'XII 115 1600x900 intel', modelled: true },
];

/** The grid-to-px factor of a window: the stage is 640 x 360 grid px, letterboxed. */
export const gridPx = (w: WindowDef): number => Math.min(w.w / 640, w.h / 360);
export type WindowDef = (typeof WINDOWS)[number];

/** The harness's pair test (`hudread.analyse`): both overlaps over 1.5 px, in the window's own px. */
export function harnessPair(w: WindowDef, a: Rect, b: Rect): boolean {
  const g = gridPx(w);
  return (Math.min(a.right, b.right) - Math.max(a.left, b.left)) * g > 1.5 && (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) * g > 1.5;
}

/** The advisor's painted boxes for a placed zone: the card (or the tip bar and its badge) and, for a card, the `N` chip that rides above it. The card is taken as tall as its box allows (the real card is shorter: the clearance is conservative). */
export function paintedBoxes(z: AdvisorZone): Rect[] {
  if (z.kind === 'tip') return [bar(z), badge(z)];
  const reach = (SKEW * z.maxHeight) / 2;
  const y1 = 360 - z.bottom;
  const card = R(z.left - reach, y1 - z.maxHeight, z.left + z.width + reach, y1);
  return [card, R(card.left, card.top - 13, card.left + 56, card.top - 2)];
}

/** The model of one window: a HUD tree that carries the board's boxes and the walk's flag, and the solver run on what the real builders return. */
export class Model {
  readonly rects = new WeakMap<HTMLElement, Rect | null>();
  readonly root = document.createElement('div');
  readonly flag = this.add('ffx-target__plate');
  readonly card = this.add('x');
  readonly chip = this.add('y');
  private held: { key: string; zone: AdvisorZone | null } | null = null;
  /** The zone placed so far this walk; `null` until the first stop. */
  zone: AdvisorZone | null = null;
  constructor(readonly win: WindowDef, readonly flagOn: boolean) {
    const b = BOARDS[win.board]!;
    this.root.className = 'ffxhud hud-f1';
    this.root.setAttribute('data-omnis-readout', '');
    this.card.setAttribute('data-role', 'move-advisor-card');
    this.chip.setAttribute('data-role', 'move-advisor-toggle');
    this.card.className = 'mad__card';
    this.chip.className = 'mad__toggle';
    for (const [cls, r] of [['f1-ribbon', b.ribbon], ['ffx-omr__strip', b.ink[0]!], ['ffx-omr__note', b.ink[1]!], ['ffx-omr__intent', b.ink[2]!], ['sgd__toggle', R(b.guide!.left, b.guide!.top - 11, b.guide!.left + 61, b.guide!.top)], ['sgd__keys', R(b.guide!.left + 61, b.guide!.top - 11, b.guide!.left + 112, b.guide!.top)]] as const) {
      this.rects.set(this.add(cls), r);
    }
    document.body.append(this.root);
  }
  private add(cls: string): HTMLElement {
    const e = document.createElement('div');
    e.className = cls;
    this.rects.set(e, null);
    this.root.append(e);
    return e;
  }
  rectOf = (e: HTMLElement | null): Rect | null => (e ? (this.rects.get(e) ?? null) : null);

  /** The solver's input for one stop: the board, the recorded Sensor card, and the two builders' lists (the flag's box among them once it has lain on the advisor). */
  input(s: Stop): AdvisorZoneInput {
    const b = BOARDS[this.win.board]!;
    return {
      cmdArea: b.cmdArea,
      cmdInfo: R(24, 121, 24 + 172 * this.win.ts, 121 + 33 * this.win.ts),
      partyStatus: b.partyStatus,
      guide: b.guide,
      sensor: snap(sensorOf(s), 1),
      intent: null,
      ctb: b.ctb,
      sprites: b.sprites.map((r) => snap(r, 4)),
      enemies: [...b.enemies.map((r) => snap(r, 4)), ...advisorInkRects(this.root, [], this.rectOf)],
      keepOff: advisorKeepOffRects(this.root, this.rectOf),
    };
  }

  /**
   * One stop: the flag where the walk had it, the advisor where it stands (the card the model placed, the first one with no flag up), the builders asked, and the solver re-run only when its key (the lists and the Sensor card) changed, as
   * the HUD holds a placement. Returns the zone now standing and whether the flag's box is in the input.
   */
  step(s: Stop): { zone: AdvisorZone | null; ink: boolean } {
    if (!this.zone) {
      // the first stop: the card the solver stands with no flag up (the record's own card is the calibration's, above)
      this.rects.set(this.flag, null);
      this.zone = advisorZone(this.input(s), false, true);
    }
    this.rects.set(this.flag, this.flagOn ? flagOf(s) : null);
    const standing = paintedBoxes(this.zone!);
    this.rects.set(this.card, standing[0]!);
    this.rects.set(this.chip, standing[1] ?? null);
    const input = this.input(s);
    const key = JSON.stringify([input.keepOff, input.enemies, input.sensor]);
    if (!this.held || this.held.key !== key) {
      this.held = { key, zone: advisorZone(input, false, true) };
    }
    this.zone = this.held.zone;
    const f = flagOf(s);
    return { zone: this.zone, ink: this.flagOn && (input.keepOff ?? []).some((r) => r.left <= f.left && r.right >= f.right && r.top <= f.top && r.bottom >= f.bottom) };
  }
}
