// @vitest-environment jsdom
/**
 * THE RECORDED R72 CURSOR WALKS OF CHAPTER XII, RUN THROUGH THE R74 STEER (lane r74-omnis, 2026-11-02; FFX ONLY, rule 14). No browser: this is a MODEL of the walk, built from the browser's own numbers and the repository's own code.
 *
 * What is real: the 290 stops of `helpers/r74OmnisWalk.ts` (the flag, the advisor and the Sensor card as the r72 harness measured them, ten windows), the boards of `helpers/r72HudBoards.ts` (the panels as the r71/r72 sheets measured
 * them), the advisor's solver (`advisorZone`, designed card, strip and tip), and the two builders the HUD calls (`advisorInkRects`, `advisorKeepOffRects`) with the held flag box of `flagSteer.ts`, run on a DOM tree that carries those boxes.
 * What is a model: the board's panels are the r71 sheets' (one board per window, the 1600 x 900 one for 1366, 1440, 1536 and 1920 wide, where the sheets show the F1 layout is grid-fixed), the card the solver places is checked against the
 * RECORDED card first (calibration), the card that stands when the flag lands is the model's own (its height is its box's, so it reads taller than the real card: a conservative conflict test), and the flag's positions are the recorded ones, so a flag that would dock differently against a card that has MOVED is not modelled (job J74-1 of \`docs/handoff/r74-omnis.md\` reads it).
 *
 * What it proves: (1) the data is the hold's data (34 flag-over-advisor stops, 1 over the Enemy Intent line); (2) the model reproduces the recorded card where the solver is given the recorded Sensor card (calibration); (3) with the steer, EVERY stop of
 * every window reads 0 flag-over-advisor pairs (the card, its chip or the tip), the flag's box being kept clear by at least the solver's GAP; (4) where the flag never lay on the advisor the steer is silent: the placement is the one with no
 * flag at all.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { advisorZone } from '../../src/ui/ffx/advisorStrip.ts';
import { advisorInkRects, advisorKeepOffRects } from '../../src/ui/ffx/hudAvoidSelectors.ts';
import { GAP, SKEW, type AdvisorZone, type AdvisorZoneInput, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';
import { BOARDS, apart, badge, bar } from './helpers/r72HudBoards.ts';
import { WALKS, type Stop } from './helpers/r74OmnisWalk.ts';

afterEach(() => {
  document.body.replaceChildren();
});

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
const snap = (r: Rect, q: number): Rect => R(Math.floor(r.left / q) * q, Math.floor(r.top / q) * q, Math.ceil(r.right / q) * q, Math.ceil(r.bottom / q) * q);
const boxOf = (x: number, y: number, w: number, h: number): Rect => R(x, y, x + w, y + h);
const flagOf = (s: Stop): Rect => boxOf(s[1], s[2], s[3], s[4]);
const recordedAdvisor = (s: Stop): Rect => boxOf(s[5], s[6], s[7], s[8]);
const sensorOf = (s: Stop): Rect => boxOf(s[9], s[10], s[11], s[12]);

/** The windows and TEXT SIZES with a record, each with the board the model uses (the r71 sheets read 1280, 1600 and 2560; the F1 layout is grid-fixed, so the 1600 board stands for 1366, 1440, 1536 and 1920; 3440 is 2560 shifted 440 px and is not modelled). */
const WINDOWS: ReadonlyArray<{ key: string; w: number; h: number; ts: number; board: string; modelled: boolean }> = [
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
const gridPx = (w: WindowDef): number => Math.min(w.w / 640, w.h / 360);
type WindowDef = (typeof WINDOWS)[number];

/** The harness's pair test (`hudread.analyse`): both overlaps over 1.5 px, in the window's own px. */
function harnessPair(w: WindowDef, a: Rect, b: Rect): boolean {
  const g = gridPx(w);
  return (Math.min(a.right, b.right) - Math.max(a.left, b.left)) * g > 1.5 && (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) * g > 1.5;
}

/** The advisor's painted boxes for a placed zone: the card (or the tip bar and its badge) and, for a card, the `N` chip that rides above it. The card is taken as tall as its box allows (the real card is shorter: the clearance is conservative). */
function paintedBoxes(z: AdvisorZone): Rect[] {
  if (z.kind === 'tip') return [bar(z), badge(z)];
  const reach = (SKEW * z.maxHeight) / 2;
  const y1 = 360 - z.bottom;
  const card = R(z.left - reach, y1 - z.maxHeight, z.left + z.width + reach, y1);
  return [card, R(card.left, card.top - 13, card.left + 56, card.top - 2)];
}

/** The model of one window: a HUD tree that carries the board's boxes and the walk's flag, and the solver run on what the real builders return. */
class Model {
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

const windows = WINDOWS.filter((w) => w.modelled);

describe('the recorded data is the hold\'s data', () => {
  it('29 stops in each of ten windows, 290 in all', () => {
    for (const w of WINDOWS) expect(WALKS[w.key], w.key).toHaveLength(29);
    expect(WINDOWS.reduce((n, w) => n + WALKS[w.key]!.length, 0)).toBe(290);
  });

  it('at TEXT SIZE 100 the flag lay over the advisor in 33 of 232 stops (1600: 5, 1366: 2, 1440: 9, 1536: 6, 1920: 11) and over the Enemy Intent line once (1280): the 34 of the hold; 0 at 2560 and 3440, and 0 at TEXT SIZE 115', () => {
    const per: Record<string, number> = {};
    for (const w of WINDOWS) per[w.key] = WALKS[w.key]!.filter((s) => s[13]!.includes('advcardxtplate')).length;
    expect(per).toEqual({ '100@1280x720': 0, '100@1366x768': 2, '100@1440x810': 9, '100@1536x864': 6, '100@1600x900': 5, '100@1920x1080': 11, '100@2560x1440': 0, '100@3440x1440': 0, '115@1280x720': 0, '115@1600x900': 0 });
    expect(Object.entries(per).filter(([k]) => k.startsWith('100@')).reduce((n, [, v]) => n + v, 0)).toBe(33);
    const intent = WINDOWS.flatMap((w) => WALKS[w.key]!.filter((s) => s[13]!.includes('omrintentxtplate')).map(() => w.key));
    expect(intent).toEqual(['100@1280x720']); // 33 + 1 = the 34 of the hold
    expect(WINDOWS.filter((w) => w.key.startsWith('100@')).reduce((n, w) => n + WALKS[w.key]!.length, 0)).toBe(232);
  });

  it('the recorded boxes agree with the harness: every tagged stop is a real overlap by the harness\'s test, and every other stop is not one (to the 0.1 px the numbers were rounded to)', () => {
    for (const w of WINDOWS) {
      for (const [i, s] of WALKS[w.key]!.entries()) {
        const tagged = s[13]!.includes('advcardxtplate');
        const computed = harnessPair(w, recordedAdvisor(s), flagOf(s));
        if (tagged !== computed) {
          // the record rounds to 0.1 grid px; accept a sub-pixel disagreement in the harness's own units
          const g = gridPx(w);
          const ow = (Math.min(recordedAdvisor(s).right, flagOf(s).right) - Math.max(recordedAdvisor(s).left, flagOf(s).left)) * g;
          const oh = (Math.min(recordedAdvisor(s).bottom, flagOf(s).bottom) - Math.max(recordedAdvisor(s).top, flagOf(s).top)) * g;
          expect(Math.abs(Math.min(ow, oh) - 1.5), `${w.key} stop ${i}: ${ow.toFixed(2)} x ${oh.toFixed(2)} px`).toBeLessThan(0.5);
        }
      }
    }
  });

  it('the Sensor card never touched the flag in any of the 290 stops (the F1 layout\'s card stands at top 79, over the flag\'s reach), by 5 grid px at least', () => {
    let nearest = Infinity;
    for (const w of WINDOWS) for (const s of WALKS[w.key]!) nearest = Math.min(nearest, apart(sensorOf(s), flagOf(s)));
    expect(nearest).toBeGreaterThanOrEqual(5);
  });
});

describe('calibration: with the recorded Sensor card the model places the card where the browser did', () => {
  for (const w of windows.filter((x) => x.key.startsWith('100@') && !x.key.includes('2560'))) {
    it(`${w.key}: the model's designed card and the recorded one agree on the right edge and the foot to 10 and 8 grid px at 28 of 29 stops`, () => {
      const m = new Model(w, false);
      let agree = 0;
      for (const s of WALKS[w.key]!) {
        const z = m.step(s).zone!;
        const painted = paintedBoxes(z)[0]!;
        const rec = recordedAdvisor(s);
        if (z.kind !== 'tip' && Math.abs(painted.right - rec.right) < 10 && Math.abs(painted.bottom - rec.bottom) < 8) agree++;
        if (z.kind === 'tip' && Math.abs(painted.right - rec.right) < 12 && Math.abs(painted.bottom - rec.bottom) < 8) agree++;
      }
      expect(agree).toBeGreaterThanOrEqual(28);
    });
  }

  for (const key of ['115@1280x720', '115@1600x900']) {
    it(`${key}: the model's tip and the recorded one agree on the right edge and the foot (the tip stands on the top row, far from the flag) at all 29 stops`, () => {
      const w = WINDOWS.find((x) => x.key === key)!;
      const m = new Model(w, false);
      for (const s of WALKS[key]!) {
        const z = m.step(s).zone!;
        expect(z.kind, key).toBe('tip');
        expect(Math.abs(bar(z).right - recordedAdvisor(s).right), key).toBeLessThan(12);
        expect(Math.abs(bar(z).bottom - recordedAdvisor(s).bottom), key).toBeLessThan(8);
      }
    });
  }
});

describe('with the steer: every stop of every modelled window reads 0 flag-over-advisor pairs', () => {
  for (const w of windows) {
    it(`${w.key}: 29 stops, the card, its chip and the tip clear of the flag by GAP (${GAP}) or more`, () => {
      const m = new Model(w, true);
      let worst = Infinity;
      for (const [i, s] of WALKS[w.key]!.entries()) {
        const { zone } = m.step(s);
        if (!zone) continue; // declined: the card is put away and the chip left on clear ground (the solver's decline); nothing painted to overlap
        for (const p of paintedBoxes(zone)) {
          worst = Math.min(worst, apart(p, flagOf(s)));
          expect(harnessPair(w, p, flagOf(s)), `${w.key} stop ${i} ${s[0]}: ${zone.kind}`).toBe(false);
        }
      }
      expect(worst, `${w.key} nearest approach`).toBeGreaterThanOrEqual(GAP - 0.01);
    });
  }

  it('the total over the 261 modelled stops (the 33 pairs the walk read over the advisor; the Enemy Intent line is a panel the flag docks off, in the wiring test) is 0', () => {
    let pairs = 0;
    let acted = 0;
    let stops = 0;
    for (const w of windows) {
      const m = new Model(w, true);
      for (const s of WALKS[w.key]!) {
        const { zone, ink } = m.step(s);
        stops++;
        if (ink) acted++;
        if (zone) for (const p of paintedBoxes(zone)) if (harnessPair(w, p, flagOf(s))) pairs++;
      }
    }
    expect(stops).toBe(29 * 9);
    expect(pairs).toBe(0);
    expect(acted, 'the steer acts only once the flag has lain on the advisor, and then holds').toBeGreaterThan(0);
  });
});

describe('where the flag never lay on the advisor the steer is silent', () => {
  for (const w of windows.filter((x) => !WALKS[x.key]!.some((s) => s[13]!.includes('advcardxtplate')))) {
    it(`${w.key}: the placement at every stop is the one with no flag at all (the flag's box is never given to the solver)`, () => {
      const withFlag = new Model(w, true);
      const without = new Model(w, false);
      for (const s of WALKS[w.key]!) {
        const a = withFlag.step(s);
        const b = without.step(s);
        expect(a.ink, `${w.key} ${s[0]}`).toBe(false);
        expect(a.zone, `${w.key} ${s[0]}`).toEqual(b.zone);
      }
    });
  }

  it('where it acted, it acted from the first stop the flag lay on the advisor on, and the card came home when the flag left that place (1600 x 900: the card stands where the model puts it with no flag at the stops the flag was far from)', () => {
    const w = windows.find((x) => x.key === '100@1600x900')!;
    const m = new Model(w, true);
    const free = new Model(w, false);
    const rows = WALKS[w.key]!.map((s) => ({ s, a: m.step(s), b: free.step(s) }));
    const first = rows.findIndex((r) => r.s[13]!.includes('advcardxtplate'));
    expect(first, 'the first recorded overlap').toBe(3);
    for (const r of rows.slice(0, first)) expect(r.a.zone, `${r.s[0]} before the flag lay on the card`).toEqual(r.b.zone);
    expect(rows[first]!.a.zone, 'the stop it acts at').not.toEqual(rows[first]!.b.zone);
    expect(rows[first]!.a.ink).toBe(true);
  });
});

describe('the control: without the steer the same model reads the defect the walk read', () => {
  for (const w of windows.filter((x) => WALKS[x.key]!.some((s) => s[13]!.includes('advcardxtplate')))) {
    it(`${w.key}: with the flag out of the solver's input the card stands on the flag at as many stops as the browser read, or more (the model's card is as tall as its box, so it reads a few more)`, () => {
      const m = new Model(w, false);
      let stops = 0;
      for (const s of WALKS[w.key]!) {
        const { zone } = m.step(s);
        if (zone && paintedBoxes(zone).some((p) => harnessPair(w, p, flagOf(s)))) stops++;
      }
      const recorded = WALKS[w.key]!.filter((s) => s[13]!.includes('advcardxtplate')).length;
      expect(stops, w.key).toBeGreaterThanOrEqual(recorded);
    });
  }
});

describe('the steer does not make the card hop: it re-solves when the flag changes place, not when it breathes', () => {
  it('the zone changes at most 5 times in a walk of 29 stops in every window (the card moves once when the flag first lands on it, and again only when the flag leaves its held box)', () => {
    for (const w of windows) {
      const m = new Model(w, true);
      let prev: string | null = null;
      let changes = 0;
      for (const s of WALKS[w.key]!) {
        const z = JSON.stringify(m.step(s).zone);
        if (prev !== null && z !== prev) changes++;
        prev = z;
      }
      expect(changes, w.key).toBeLessThanOrEqual(5);
    }
  });

  it('the flag drifts 5 to 8 grid px inside a walk (x 295.1 to 303.3 at 1600 x 900 over the stops that dock left); the held box (the flag grown by FLAG_PAD each way) takes that drift in, so the card changes place at most 5 times against more than 15 distinct flag places', () => {
    const w = windows.find((x) => x.key === '100@1600x900')!;
    const m = new Model(w, true);
    let prev: string | null = null;
    let changes = 0;
    const lefts = new Set<number>();
    for (const s of WALKS[w.key]!) {
      lefts.add(s[1]);
      const z = JSON.stringify(m.step(s).zone);
      if (prev !== null && z !== prev) changes++;
      prev = z;
    }
    expect(lefts.size, 'distinct flag places').toBeGreaterThan(15);
    expect(changes).toBeLessThanOrEqual(5);
  });
});
