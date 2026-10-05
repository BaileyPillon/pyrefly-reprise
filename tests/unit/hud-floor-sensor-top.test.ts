// @vitest-environment jsdom
/**
 * The open Sensor card's CSS `top` (release 39 HOLD, R39F-01; FFX only: Chapter X, Seymour Natus).
 *
 * Two sheets set it. `ffx-hud.css` adds the aim steer (`--ffx-sensor-dy`) and the pin's lift (`--ffx-sensor-py`, the place the MAX mix's table
 * stands the card while Natus's colossus master does, written by `SensorPin`); `hud-floor.css` (r37-ui-floor) is the more specific rule and takes
 * the third chip row's lift off the same `top`. It left the pin's term out, so at 1600x900, 2000x1012 and 2560x1440 the card stood at 165 px
 * instead of 4 px and covered 48 percent of Natus (live 0). A browser resolves `calc()` and `var()` at layout time, not jsdom, so this reads the
 * sheets' own text and evaluates it: the pinned place the table names, the guard that keeps the lift off the stage's top edge, the unpinned
 * card exactly as the floor lane measured it, and a sweep that no sheet sets the open card's `top` without the pin's term again.
 *
 * Game case: FFX only (the card is FFX's own; the phone and FFX-2 never reach these rules).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SensorPin } from '../../src/engine/fx/mix/sensorPin.ts';
import { SENSOR_HOME } from '../../src/engine/fx/mix/colossusPin.ts';
import { ALL_ROWS } from '../../src/engine/fx/mix/stageTable.ts';

const UI = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'ui');
const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');
const sheet = (...p: string[]): string => strip(readFileSync(join(UI, ...p), 'utf8'));
const FLOOR = sheet('common', 'hud-floor.css');
const HUD = sheet('ffx', 'ffx-hud.css');

interface Rule { readonly selector: string; readonly body: string }
const rulesOf = (css: string): Rule[] => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim().replace(/\s+/g, ' '), body: m[2]!.trim() }));
const declOf = (r: Rule | undefined, prop: string): string => {
  const m = r?.body.match(new RegExp(`(?:^|;|\\s)${prop}:\\s*([^;]+);?`));
  if (!m) throw new Error(`no ${prop} in ${r?.selector}`);
  return m[1]!.trim();
};

/** Evaluates the CSS arithmetic these sheets use: px lengths and plain numbers, + - * /, parentheses, calc, clamp, min, max and var() with a fallback. */
function evaluate(expr: string, vars: Readonly<Record<string, string>>): number {
  const tok = expr.match(/var\(|clamp\(|calc\(|min\(|max\(|--[\w-]+|-?\d*\.?\d+(?:px)?|[()+\-*/,]/g) ?? [];
  let i = 0;
  const next = (): string => tok[i++]!;
  const peek = (): string | undefined => tok[i];
  const args = (): number[] => {
    const out = [sum()];
    while (peek() === ',') { next(); out.push(sum()); }
    next(); // the closing parenthesis
    return out;
  };
  function atom(): number {
    const t = next();
    if (t === '(') { const v = sum(); next(); return v; }
    if (t === 'calc(') { const v = sum(); next(); return v; }
    if (t === 'var(') {
      const name = next();
      const fallback = peek() === ',' ? (next(), sum()) : null;
      next();
      if (name in vars) return evaluate(vars[name]!, vars);
      if (fallback === null) throw new Error(`${name} is not set`);
      return fallback;
    }
    if (t === 'clamp(') { const [lo, v, hi] = args() as [number, number, number]; return Math.max(lo, Math.min(v, hi)); }
    if (t === 'min(') return Math.min(...args());
    if (t === 'max(') return Math.max(...args());
    return parseFloat(t);
  }
  function product(): number {
    let v = atom();
    while (peek() === '*' || peek() === '/') v = next() === '*' ? v * atom() : v / atom();
    return v;
  }
  function sum(): number {
    let v = product();
    while (peek() === '+' || peek() === '-') v = next() === '+' ? v + product() : v - product();
    return v;
  }
  return sum();
}

const FLOOR_RULES = rulesOf(FLOOR);
const OPEN_CARD = 'html:not([data-phone-battle]) .ffxhud .ffx-sensor:not(.ffx-sensor--folded)';
const floorTop = declOf(FLOOR_RULES.find((r) => r.selector === OPEN_CARD), 'top');
const chipH = declOf(FLOOR_RULES.find((r) => r.selector === 'html:not([data-phone-battle]) .ffxhud .ffx-sensor'), '--sensor-chip-h');
const floorToken = declOf(FLOOR_RULES.find((r) => r.body.includes('--hud-floor:')), '--hud-floor');
const homeTop = declOf(rulesOf(HUD).find((r) => r.selector === '.ffx-sensor'), 'top');

/** `LetterboxStage`'s own formula: grid px to window px. */
const stageScale = (w: number, h: number): number => Math.min(w / 640, h / 360);

/** What `SensorPin` writes for the card the table names (read from the real writer, not assumed), as the custom property the sheets read. */
function pinnedPy(card: readonly [number, number]): string {
  document.body.innerHTML = '<div class="ffx-sensor"></div>';
  const el = document.querySelector<HTMLElement>('.ffx-sensor')!;
  new SensorPin().update(card);
  const py = el.style.getPropertyValue('--ffx-sensor-py');
  document.body.innerHTML = '';
  return py;
}

const NATUS = ALL_ROWS.find((r) => r.chapter === 'seymour-natus')!.colossus![0]!;
const PIN_TOP = NATUS.pin.card[1];
const PY = pinnedPy(NATUS.pin.card);

/** The open card's `top` (grid px) in a window, with the pin's lift (`pinned`) or without, and the aim steer's lift (`dy`). */
function openTop(w: number, h: number, pinned: boolean, dy = '0px'): number {
  const vars: Record<string, string> = { '--lb-scale': String(stageScale(w, h)), '--hud-floor': floorToken, '--sensor-chip-h': chipH, '--ffx-sensor-dy': dy };
  if (pinned) vars['--ffx-sensor-py'] = PY;
  return evaluate(floorTop, vars);
}

describe('the open Sensor card stands where the pin puts it (FFX only, Chapter X)', () => {
  it('reads the table\'s own place: the pin\'s lift is the card\'s top less the stylesheet\'s resting place, so home plus the lift is the pin', () => {
    expect(PIN_TOP).toBeLessThan(SENSOR_HOME[1] / 4);
    expect(PY).toBe(`${(PIN_TOP - SENSOR_HOME[1]).toFixed(1)}px`);
    expect(evaluate(homeTop, { '--ffx-sensor-py': PY })).toBeCloseTo(PIN_TOP, 6);
    expect(evaluate(homeTop, {})).toBe(SENSOR_HOME[1]);
  });

  it('under the floor rule it still stands at the pin\'s place at 1600x900, 2000x1012 and 2560x1440 (card top 4 px; it was 165 px)', () => {
    for (const [w, h] of [[1600, 900], [2000, 1012], [2560, 1440]] as const) {
      const aspect = w / h;
      expect(aspect, `${w}x${h} is a window shape the pin was proved at`).toBeGreaterThanOrEqual(NATUS.aspect[0]);
      expect(aspect).toBeLessThanOrEqual(NATUS.aspect[1]);
      const top = openTop(w, h, true);
      // 1600x900 is the one of the three where the floored type needs a hair of the third row (0.8 grid px); the others are exactly the pin.
      expect(top, `${w}x${h}`).toBeGreaterThan(PIN_TOP - 1);
      expect(top, `${w}x${h}`).toBeLessThanOrEqual(PIN_TOP);
    }
    expect(openTop(2560, 1440, true)).toBe(PIN_TOP);
    expect(openTop(2000, 1012, true)).toBe(PIN_TOP);
    expect(openTop(1600, 900, true)).toBeCloseTo(PIN_TOP - 0.8, 6);
  });

  it('never rises past the top of the stage, in any window shape the pin covers (the third row grows the card downward there)', () => {
    for (const [w, h] of [[1024, 576], [1280, 720], [1366, 768], [1440, 810], [1536, 864], [1600, 900], [1920, 1080], [2000, 1012], [2560, 1080], [2560, 1440], [3440, 1440]] as const) {
      expect(openTop(w, h, true), `${w}x${h}`).toBeGreaterThanOrEqual(0);
      expect(openTop(w, h, true), `${w}x${h}`).toBeLessThanOrEqual(PIN_TOP);
    }
    // 1280x720 measured: the lift is 12.2 grid px there, so the pinned card stops at the top of the stage and its name stays on screen.
    expect(openTop(1280, 720, true)).toBe(0);
    expect(openTop(1366, 768, true)).toBe(0);
  });

  it('an unpinned card is exactly the floor lane\'s: 166 less the third row\'s lift, which is 0 from 1920x1080 up and 7.5 grid px at 1024x768', () => {
    expect(openTop(2560, 1440, false)).toBe(SENSOR_HOME[1]);
    expect(openTop(1920, 1080, false)).toBe(SENSOR_HOME[1]);
    expect(openTop(1600, 900, false)).toBeCloseTo(SENSOR_HOME[1] - 0.8, 6);
    expect(openTop(1280, 720, false)).toBeCloseTo(153.835, 3); // measured in Chromium: 153.835px
    expect(openTop(1024, 768, false)).toBeCloseTo(SENSOR_HOME[1] - 7.5, 6);
  });

  it('the aim steer\'s own lift (Chapter XII\'s Omnis line, `--ffx-sensor-dy`) still moves the card, pinned or not', () => {
    expect(openTop(2560, 1440, false, '-30px')).toBe(SENSOR_HOME[1] - 30);
    expect(openTop(2560, 1440, true, '-2px')).toBe(PIN_TOP - 2);
    expect(openTop(2560, 1440, true, '6px')).toBe(PIN_TOP + 6);
  });
});

describe('no sheet sets the open Sensor card\'s top without the pin\'s lift again', () => {
  const files = (readdirSync(UI, { recursive: true }) as string[]).filter((f) => f.endsWith('.css'));
  const cardTops = files.flatMap((f) =>
    rulesOf(strip(readFileSync(join(UI, f), 'utf8')))
      .filter((r) => /\.ffx-sensor(:not\([^)]*\))*$/.test(r.selector.split(',').pop()!.trim()) && !r.selector.includes("[data-phone-battle='") && /(?:^|;|\s)top:/.test(r.body))
      .map((r) => ({ file: f.replace(/\\/g, '/'), selector: r.selector, top: declOf(r, 'top') })),
  );

  it('finds the two desktop rules (the stylesheet\'s own and the floor\'s)', () => {
    expect(cardTops.map((c) => c.file).sort()).toEqual(['common/hud-floor.css', 'ffx/ffx-hud.css']);
  });

  it('each carries the pin\'s lift and the aim steer\'s', () => {
    for (const c of cardTops) {
      expect(c.top, `${c.file}: ${c.selector}`).toContain('var(--ffx-sensor-py, 0px)');
      expect(c.top, `${c.file}: ${c.selector}`).toContain('var(--ffx-sensor-dy, 0px)');
    }
  });
});
