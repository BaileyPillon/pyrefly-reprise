/**
 * Release 62, decision 173i (Bailey, 2026-10-22 ~00:00 EDT; both games, demo mode only; the card is FFX-2 Chapter IV's): the Bahamut picker card's art is brightened to match Seymour's
 * (exposure and a gradient on the card's own layers; the painting master and the other cards are untouched).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/demo/demo.css', 'utf8');
const cssBare = css.replace(/\/\*[\s\S]*?\*\//g, ''); // the rules without their comments


describe('173i: the Bahamut card is lifted, on its own layers only', () => {
  const rules = [...cssBare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1]!.trim(), body: m[2]! }));
  const lift = rules.filter((r) => /ffx2-bahamut/.test(r.sel));

  it('every lift rule is scoped to the demo picker and names Bahamut, so no other card, no other screen and no non-demo board moves', () => {
    expect(lift.length).toBeGreaterThanOrEqual(5);
    for (const r of lift) {
      for (const part of r.sel.split(',')) {
        expect(part.trim(), part).toMatch(/^\.fe-cselect--demo /);
        expect(part, part).toMatch(/ffx2-bahamut/);
      }
    }
  });

  it('the unselected card, the selected one and the big plate are all brighter than the board\'s own values (scene 0.62 / 0.95 / 0.8; boss 0.84)', () => {
    const brightness = (sel: RegExp): number => {
      const r = lift.find((x) => sel.test(x.sel) && /brightness/.test(x.body))!;
      return Number(/brightness\(([\d.]+)\)/.exec(r.body)![1]);
    };
    expect(brightness(/\.fe-card\[data-card='ffx2-bahamut'\] \.cs-art__scene$/)).toBeGreaterThan(0.62 * 2);
    expect(brightness(/\.fe-card--sel\[data-card='ffx2-bahamut'\] \.cs-art__scene$/)).toBeGreaterThan(0.95);
    expect(brightness(/\.fe-hero\[data-chapter='ffx2-bahamut'\] \.cs-art__scene$/)).toBeGreaterThan(0.8);
    expect(brightness(/\.fe-card\[data-card='ffx2-bahamut'\] \.cs-art__boss$/)).toBeGreaterThan(0.84);
  });

  it('a gradient lift sits over the card\'s art (a violet haze, screen-blended), not over the painting file', () => {
    const haze = lift.find((r) => /::after/.test(r.sel))!;
    expect(haze.body).toMatch(/radial-gradient/);
    expect(haze.body).toMatch(/mix-blend-mode: screen/);
  });

  it('nothing in the lift writes to a painting: it is CSS on the picker alone (no art path in it)', () => {
    for (const r of lift) expect(r.body).not.toMatch(/url\(|art\//);
  });
});
