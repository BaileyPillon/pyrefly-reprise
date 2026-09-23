/**
 * `pause-screen.css`, read as the contract it is.
 *
 * The remade pause screen is a stylesheet problem as much as a code one: the
 * mockup (`docs/concepts/pause-until-dawn/pause-ud.css`) is authored 1:1 at
 * 1600x900 in flat pixels, and the product has to hold the same composition at
 * 1280x720, 1600x900, 2000x1012, 2560x1080 and 390x844. Every number is
 * therefore written as the viewport expression that **equals the mockup's
 * number at 1600x900**, floored and capped — and a floor is only a floor if
 * something checks it.
 *
 * Bailey's first complaint about the previous pause screen was that the chrome
 * was unreadable (`docs/handoff/fix3-pause.md`), so the floor is the load
 * bearing part: **14 effective CSS px on a desktop window, 12 on the phone.**
 * This file evaluates every `clamp()` in the sheet at all five viewports and
 * fails if any of them can compute smaller.
 *
 * It also pins the four things a later edit could quietly undo: grade B rather
 * than the grade A Bailey did not pick, the reduced-motion stop, the mirrored
 * chrome, and the absence of panels.
 *
 * No jsdom: this is arithmetic on text, which is why it can pin a property
 * choice the way a screenshot cannot.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'pause-screen.css'), 'utf8');

/** The five sizes the brief names, plus the phone. */
const DESKTOP = [
  [1280, 720],
  [1600, 900],
  [2000, 1012],
  [2560, 1080],
] as const;
const PHONE = [390, 844] as const;

/** Where the phone rules start: everything before it is the desktop sheet. */
const PHONE_QUERY = '@media (max-width: 620px)';

const beforePhone = SHEET.slice(0, SHEET.indexOf(PHONE_QUERY));
const phoneBlock = SHEET.slice(SHEET.indexOf(PHONE_QUERY));

/** One CSS length, in px, at a given viewport. Handles px, vw and vh. */
function lengthPx(decl: string, w: number, h: number): number {
  const t = decl.trim();
  if (t.endsWith('vw')) return (Number.parseFloat(t) / 100) * w;
  if (t.endsWith('vh')) return (Number.parseFloat(t) / 100) * h;
  return Number.parseFloat(t);
}

/** `clamp(a, b, c)` evaluated the way a browser evaluates it. */
function evalClamp(expr: string, w: number, h: number): number {
  const inner = /clamp\(([^()]*)\)/.exec(expr);
  if (!inner) return Number.NaN;
  const [lo, mid, hi] = inner[1]!.split(',').map((p) => lengthPx(p, w, h));
  return Math.min(Math.max(lo!, mid!), hi!);
}

/** Every `--pu-fs*` token declared in a slice of the sheet. */
function typeTokens(slice: string): Array<[string, string]> {
  return [...slice.matchAll(/(--pu-fs[a-z-]*):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]);
}

describe('the pause layer is the window, not a letterboxed stage', () => {
  it('mounts at viewport level', () => {
    // `absolute` was the ink bars down the sides of Bailey's 2000x1012 shot.
    const root = /\.pause \{(.*?)\n\}/s.exec(SHEET)?.[1] ?? '';
    expect(root).toMatch(/position:\s*fixed/);
    expect(root).toMatch(/inset:\s*0/);
    expect(root).toMatch(/overflow:\s*hidden/);
  });

  it('gives the painting the whole layer and crops away from the face', () => {
    const plate = /\.pause__plate \{(.*?)\n\}/s.exec(SHEET)?.[1] ?? '';
    expect(plate).toMatch(/object-fit:\s*cover/);
    expect(plate).toMatch(/object-position:/);
    // A blurred painting is what the leaving plate does, never the live one.
    expect(plate).not.toMatch(/filter:[^;]*blur\(/);
  });
});

describe('nothing on a desktop window can compute below 14px', () => {
  const tokens = typeTokens(beforePhone);

  it('declares the type as clamps, not as bare numbers', () => {
    // Four: the label, the value, the active tab and the big serif line.
    expect(tokens.map(([n]) => n)).toEqual(['--pu-fs', '--pu-fs-v', '--pu-fs-on', '--pu-fs-line']);
    for (const [name, value] of tokens) {
      expect(value, `${name} is not a clamp`).toMatch(/^clamp\(/);
    }
  });

  for (const [w, h] of DESKTOP) {
    it(`holds the 14px floor at ${w}x${h}`, () => {
      for (const [name, value] of tokens) {
        const px = evalClamp(value, w, h);
        expect(Number.isFinite(px), `${name} did not evaluate`).toBe(true);
        expect(px, `${name} at ${w}x${h}`).toBeGreaterThanOrEqual(14);
      }
    });
  }

  it('matches the mockup exactly at 1600x900, which is what it was drawn at', () => {
    const at1600 = Object.fromEntries(tokens.map(([n, v]) => [n, evalClamp(v, 1600, 900)]));
    // pause-ud.css: labels 14, values and tabs 15, the active tab 20, the big
    // serif line 39.
    expect(at1600['--pu-fs']).toBeCloseTo(14, 6);
    expect(at1600['--pu-fs-v']).toBeCloseTo(15, 6);
    expect(at1600['--pu-fs-on']).toBeCloseTo(20, 6);
    expect(at1600['--pu-fs-line']).toBeCloseTo(39, 6);
  });

  /**
   * The widest BATTLE STATS label, measured in Chromium at the 14px floor
   * with this sheet's `letter-spacing: 0.15em; text-transform: uppercase`:
   * `MAGIC DEF` needs 89px of `scrollWidth`, `STRENGTH` 87px.
   *
   * The cell is `width: var(--pu-key); overflow: hidden; text-overflow:
   * ellipsis`, so a `--pu-key` below that is not a tight fit, it is an
   * ellipsis: at 1280x720, where 6.25vw floored at 84px while `--pu-fs` stayed
   * at 14, both rows printed as `MAGIC D…` and `STRENGT…`. The type stops
   * shrinking and the column must not go on shrinking past it.
   */
  const LABEL_PX_AT_14 = 89;

  /** `--pu-key`, wherever it is declared in a slice. */
  const keyToken = (slice: string): string =>
    /--pu-key:\s*([^;]+);/.exec(slice)?.[1]?.trim() ?? '';

  for (const [w, h] of DESKTOP) {
    it(`fits MAGIC DEF in the label column at ${w}x${h}`, () => {
      const fs = evalClamp(typeTokens(beforePhone)[0]![1], w, h);
      const key = evalClamp(keyToken(beforePhone), w, h);
      const needs = (LABEL_PX_AT_14 * fs) / 14;
      expect(key, `--pu-key is ${key}px and MAGIC DEF needs ${needs}px at ${w}x${h}`)
        .toBeGreaterThanOrEqual(needs);
    });
  }

  it('fits it on the phone too, where the type drops to 12px', () => {
    const fs = lengthPx(typeTokens(phoneBlock)[0]![1], PHONE[0], PHONE[1]);
    const key = lengthPx(keyToken(phoneBlock), PHONE[0], PHONE[1]);
    expect(key).toBeGreaterThanOrEqual((LABEL_PX_AT_14 * fs) / 14);
  });

  it('declares no bare font-size a player could not read', () => {
    const tiny: string[] = [];
    for (const m of beforePhone.matchAll(/font-size:\s*([^;]+);/g)) {
      const decl = m[1]!;
      if (/var\(|clamp\(|max\(|min\(|inherit|em$/.test(decl.trim())) continue;
      const px = Number.parseFloat(decl);
      if (Number.isFinite(px) && px < 14) tiny.push(decl.trim());
    }
    expect(tiny).toEqual([]);
  });
});

describe('the phone runs at a 12px floor and nowhere lower', () => {
  it('re-declares every type token for 390x844', () => {
    const tokens = typeTokens(phoneBlock);
    expect(tokens.map(([n]) => n)).toEqual(['--pu-fs', '--pu-fs-v', '--pu-fs-on', '--pu-fs-line']);
    for (const [name, value] of tokens) {
      const px = lengthPx(value, PHONE[0], PHONE[1]);
      expect(Number.isFinite(px), `${name} did not evaluate`).toBe(true);
      expect(px, `${name} on the phone`).toBeGreaterThanOrEqual(12);
    }
  });

  it('turns the strip into one swipeable row and stacks the columns', () => {
    expect(phoneBlock).toMatch(/\.pause__swipe \{[^}]*mask-image/s);
    expect(phoneBlock).toMatch(/flex-direction:\s*column/);
  });
});

describe('FOC-03: the pause tab tap target reaches 44px on the phone', () => {
  /**
   * `.pause__tab` measured 52x25px at 390x844 (`critic/reviews/5e92289…-
   * focused.json`) — under the ~44px touch minimum. Keyboard and gamepad
   * cycling already worked, so the fix only raises the phone breakpoint's
   * padding; the type size, the wide layout and the underline's own `bottom`
   * offset are untouched.
   *
   * A box's rendered height is padding plus its line box, and this file is
   * arithmetic on text with no layout engine behind it (see the header), so
   * the line-box half of that sum is a measured constant, the same way
   * `LABEL_PX_AT_14` above is: on the running game at exactly 390x844, a plain
   * tab's own line box (`--pu-fs-v`, 13px) is 17px tall and the active tab's
   * (`--pu-fs-on`, 17px) is 22px, and both numbers held across two different
   * padding trials while this fix was being sized. Only the padding this rule
   * controls is asserted as a computed value; the two constants are the
   * caption on the measurement, not something this file could derive itself.
   */
  const TAB_LINE_BOX_PX = 17;
  const TAB_ON_LINE_BOX_PX = 22;
  const TOUCH_MIN_PX = 44;

  function verticalPadding(block: string, selector: string): number {
    const body = new RegExp(`${selector.replace('.', '\\.')} \\{([^}]*)\\}`).exec(block)?.[1] ?? '';
    const decl = /padding:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? '';
    const parts = decl.split(/\s+/).map((p) => Number.parseFloat(p));
    if (parts.some((n) => Number.isNaN(n))) return Number.NaN;
    // `padding: top [right [bottom [left]]]` — only top and bottom are ever
    // used at this breakpoint (this sheet never sets a phone `.pause__tab`
    // padding with four values).
    const [top, right, bottom] = parts;
    return parts.length >= 3 ? (top ?? 0) + (bottom ?? 0) : (top ?? 0) + (right ?? top ?? 0);
  }

  it('raises the phone padding enough that both tab sizes clear 44px', () => {
    const vertical = verticalPadding(phoneBlock, '.pause__tab');
    expect(Number.isFinite(vertical), '.pause__tab has a padding declaration on the phone').toBe(true);
    expect(TAB_LINE_BOX_PX + vertical, 'a plain tab').toBeGreaterThanOrEqual(TOUCH_MIN_PX);
    expect(TAB_ON_LINE_BOX_PX + vertical, 'the active tab').toBeGreaterThanOrEqual(TOUCH_MIN_PX);
  });

  it('leaves the desktop tab padding alone', () => {
    expect(beforePhone).toMatch(/\.pause__tab \{[^}]*padding:\s*0 0 clamp\(14px, 1\.9vh, 22px\)/);
  });
});

describe('grade B, the one Bailey picked', () => {
  it('grades the painting with a filter and a tint, never by editing a file', () => {
    // pause-ud.css grade B: saturate(0.58) contrast(1.05) brightness(0.66).
    const plate = /\.pause__plate \{(.*?)\n\}/s.exec(SHEET)?.[1] ?? '';
    expect(plate).toContain('saturate(0.58)');
    expect(plate).toContain('contrast(1.05)');
    expect(plate).toContain('brightness(0.66)');
  });

  it('does not ship grade A, the cool faithful grade that was not picked', () => {
    // Grade A is saturate(0.2) on a #04141d multiply; if it ever comes back it
    // is a setting Bailey asked for, not a default someone changed.
    expect(SHEET).not.toContain('saturate(0.2)');
    expect(SHEET).not.toContain('#04141d');
  });

  it('keeps the warm tint, the falloff, the vignette and 13% grain', () => {
    expect(SHEET).toMatch(/\.pause__tint \{[^}]*mix-blend-mode:\s*multiply/s);
    expect(SHEET).toMatch(/\.pause__grain \{[^}]*opacity:\s*0\.13/s);
    expect(SHEET).toContain('.pause__falloff');
    expect(SHEET).toContain('.pause__vig');
    // FFX-2 repoints the accent to pyre pink; FFX keeps gold.
    expect(SHEET).toMatch(/\.ig--ffx2 \.pause__tint::after/);
    expect(SHEET).toMatch(/--pu-accent:\s*var\(--ig-accent/);
  });
});

describe('the painting stops moving when the player says so', () => {
  it('stops for Settings.reduceMotion, through the class the screen sets', () => {
    expect(SHEET).toMatch(/\.pause__art--still \.pause__plate \{[^}]*animation:\s*none/s);
  });

  it('stops for prefers-reduced-motion as well, with no setting involved', () => {
    const reduced = SHEET.slice(SHEET.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/\.pause__plate \{[^}]*animation:\s*none/s);
    expect(reduced).toMatch(/transition:\s*none/);
  });
});

describe('the chrome stands on whichever side of the painting is empty', () => {
  it('mirrors every anchored block, not only the columns', () => {
    for (const sel of [
      '.pause--mirror .pause__brand',
      '.pause--mirror .pause__body',
      '.pause--mirror .pause__obj',
      '.pause--mirror .pause__falloff',
    ]) {
      expect(SHEET, sel).toContain(sel);
    }
    // The prompts mirror as a pair.
    expect(SHEET).toMatch(/\.pause--mirror \.pause__back,\s*\n\.pause--mirror \.pause__hide/);
  });
});

describe('H leaves the painting, and there are no panels to leave', () => {
  it('hides every line at once by hiding the one layer they share', () => {
    expect(SHEET).toMatch(/\.pause--bare \.pause__ui \{\s*display:\s*none/);
    expect(SHEET).toMatch(/\.pause--bare \.pause__baseline \{\s*display:\s*block/);
  });

  it('paints no box, card or slab behind any line', () => {
    // The absence is the design (README: "no panels, no boxes, no cards").
    // A background or a border on a content block would be one creeping back.
    for (const sel of ['.pause__body', '.pause__col', '.pause__obj', '.pause__quote', '.pause__snaps']) {
      const block = new RegExp(`\\${sel} \\{(.*?)\\n\\}`, 's').exec(SHEET)?.[1] ?? '';
      expect(block, `${sel} has a background`).not.toMatch(/background(-color)?:\s*(?!none)/);
      expect(block, `${sel} has a border`).not.toMatch(/\bborder:\s*(?!0)/);
      expect(block, `${sel} has a radius`).not.toMatch(/border-radius/);
    }
  });
});

describe('PR-0098 repair: a scrolled OPTIONS row past the fifth is a real row', () => {
  it('keeps every settings row a flex row, never the bare div display the hiding rule left behind', () => {
    // round 09's first pass beat `.pause__row { display: flex }` on
    // specificity with `.pause__col[data-col='settings'] > div:nth-of-type(n
    // + 6) { display: block }` — a plain `div` selector plus two classes and
    // a pseudo-class outranks one class. ATB SPEED and BATTLE HELP rendered
    // with the label and value glued together and the selection dot on its
    // own line. `display: flex` matches `.pause__row`'s own display, so the
    // override only ever restores visibility, never the layout.
    const rule = /\.pause__col\[data-col='settings'\] > div:nth-of-type\(n \+ 6\) \{\s*display:\s*([a-z]+);/.exec(
      SHEET,
    );
    expect(rule?.[1]).toBe('flex');
  });

  it('caps the settings column at exactly five rows, the same budget its sibling columns get', () => {
    // The first pass's `calc(var(--pu-row) * 5.6 + 26px)` made the column
    // taller than the five-row budget every other phone column has, which
    // pushed THIS ENCOUNTER (the sibling column below it, `.pause__body`
    // stacks them at this width) down into the objective line. Five rows,
    // nothing extra, matches what the fight/stats columns already render.
    const block = /\.pause__col\[data-col='settings'\] \{(.*?)\n\}/s.exec(SHEET)?.[1] ?? '';
    expect(block).toMatch(/max-height:\s*calc\(var\(--pu-row\)\s*\*\s*5\)/);
  });
});
