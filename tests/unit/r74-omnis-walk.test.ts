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
import { GAP } from '../../src/ui/ffx/hudSafeZones.ts';
import { apart, bar } from './helpers/r72HudBoards.ts';
import { Model, WINDOWS, flagOf, gridPx, harnessPair, paintedBoxes, recordedAdvisor, sensorOf } from './helpers/r74OmnisModel.ts';
import { WALKS } from './helpers/r74OmnisWalk.ts';

afterEach(() => {
  document.body.replaceChildren();
});

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
