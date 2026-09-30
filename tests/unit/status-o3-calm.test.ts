// @vitest-environment jsdom
/**
 * Status display O3 repair (2026-09-30): REDUCE MOTION and LOW EFFECTS reach the status marks.
 * Both games (shared plumbing). Browser proof (running animations before and after, both flags,
 * both games, both sizes) is in `docs/concepts/status-display-0929/final/`; this pins the rules.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { StatusFigureTint } from '../../src/ui/common/statusFigureTint.ts';
import { statusMotionStill } from '../../src/ui/common/statusCalm.ts';
import type { BattleState } from '../../src/battle/common/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');
const MARKS = read('src/ui/common/status-marks.css');
const CALM = read('src/ui/common/status-marks-calm.css');

/** Every selector in `status-marks.css` whose rule starts an animation. */
function animatedSelectors(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    if (!/animation:\s*stm-/.test(m[2]!)) continue;
    for (const sel of m[1]!.replace(/\/\*[\s\S]*?\*\//g, '').split(',')) out.push(sel.trim().replace(/\s+/g, ' '));
  }
  return out;
}

/** The text of the `@media (prefers-reduced-motion: reduce) { ... }` block, and the rest. */
function split(css: string): { media: string; rest: string } {
  const i = css.indexOf('@media (prefers-reduced-motion: reduce)');
  const open = css.indexOf('{', i);
  let depth = 0;
  let end = open;
  for (let k = open; k < css.length; k++) {
    if (css[k] === '{') depth++;
    if (css[k] === '}' && --depth === 0) {
      end = k;
      break;
    }
  }
  return { media: css.slice(open + 1, end), rest: css.slice(0, i) + css.slice(end + 1) };
}

describe('the marks stylesheet and its calm counterpart', () => {
  const animated = animatedSelectors(MARKS);
  const { media, rest } = split(CALM);

  it('finds the looping marks (guards the parse)', () => {
    expect(animated.length).toBe(8);
  });

  it('REDUCE MOTION (the row) stops every animated mark and keeps it visible', () => {
    for (const sel of animated) {
      const rule = new RegExp(`html\\[data-reduce-motion\\] ${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{[^}]*animation:\\s*none;[^}]*opacity:\\s*1`);
      expect(rest, sel).toMatch(rule);
    }
  });

  it('REDUCE MOTION (the OS preference) stops the same marks', () => {
    for (const sel of animated) {
      const rule = new RegExp(`(^|[\\s,{}])${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{[^}]*animation:\\s*none;[^}]*opacity:\\s*1`);
      expect(media, sel).toMatch(rule);
    }
  });

  it('never hides a mark to stop it: no opacity 0 or display none under REDUCE MOTION', () => {
    expect(rest.split('/* ---- LOW EFFECTS')[0]).not.toMatch(/opacity:\s*0[;\s}]|display:\s*none/);
    expect(media).not.toMatch(/opacity:\s*0[;\s}]|display:\s*none/);
  });

  it('orbs and stars get fixed spots so a still does not stack them', () => {
    for (const c of ['red', 'white', 'yellow', 'blue']) expect(rest).toContain(`.stm--orb-${c} i { transform: translate(`);
    expect(rest).toContain('.stm--stars i:first-child { transform');
    expect(rest).toContain('.stm--stars i + i { transform');
  });

  it('LOW EFFECTS lightens the particle marks (smoke, bubbles, Z, orbs): still, fewer, no blur or glow', () => {
    const low = rest.slice(rest.indexOf('/* ---- LOW EFFECTS'));
    for (const m of ['smoke', 'bubbles', 'zzz', 'orb']) expect(low).toMatch(new RegExp(`html\\[data-low-effects\\] \\.stm--${m}[^{]*\\{[^}]*animation:\\s*none`));
    expect(low).toMatch(/\.stm--smoke,[^{]*\{[^}]*filter:\s*none/);
    expect(low).toMatch(/\.stm--orb i \{[^}]*box-shadow:\s*none/);
    expect(low).toMatch(/\.stm--smoke i:nth-child\(n \+ 5\)/);
  });

  it('is loaded after the marks stylesheet (same specificity in the OS block)', () => {
    const src = read('src/ui/common/statusMarks.ts');
    expect(src.indexOf("'./status-marks.css'")).toBeGreaterThan(0);
    expect(src.indexOf("'./status-marks-calm.css'")).toBeGreaterThan(src.indexOf("'./status-marks.css'"));
  });
});

describe('the old pips and chips leave no CSS behind', () => {
  const sheets = ['src/ui/ffx/ffx-hud.css', 'src/ui/ffx/phone-hud.css', 'src/ui/ffx2/ffx2-hud.css', 'src/ui/ffx2/phone-hud.css'];
  it('no rule styles the removed .ffx2-status-chip, .ffx-stat__statuses i or .ffx-ctb-statuses i', () => {
    for (const s of sheets) {
      const css = read(s).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(css, s).not.toMatch(/\.ffx2-status-chip/);
      expect(css, s).not.toMatch(/\.ffx-stat__statuses i\b/);
      expect(css, s).not.toMatch(/\.ffx-ctb-statuses i\b/);
    }
  });
});

describe('Pointless flash (the script-driven look)', () => {
  afterEach(() => {
    delete document.documentElement.dataset['reduceMotion'];
  });

  function rig() {
    const cells = { flashAmount: { value: 0 }, flashFloorCut: { value: 0 }, flashColor: { value: { set() {} } } };
    const fig = {
      setTint() {},
      update() {},
      traverse(fn: (o: unknown) => void) {
        fn({ material: { uniforms: cells } });
      },
    };
    const tint = new StatusFigureTint('ffx2', () => ({ actor: () => fig }));
    const state = {
      result: null,
      combatants: { rikku: { id: 'rikku', alive: true, removed: false, flags: {}, statuses: { pointless: { id: 'pointless' } } } },
    } as unknown as BattleState;
    tint.sync(state);
    const amounts: number[] = [];
    for (let i = 0; i < 24; i++) {
      tint.update(0.1);
      amounts.push(+cells.flashAmount.value.toFixed(4));
    }
    return amounts;
  }

  it('pulses normally', () => {
    const a = rig();
    const peak = a.indexOf(Math.max(...a));
    expect(Math.max(...a)).toBeGreaterThan(0.3);
    // It must fall again after the peak (it once rose to the peak and stayed there).
    expect(Math.min(...a.slice(peak + 1, peak + 12))).toBeLessThan(0.05);
  });

  it('holds one visible value under REDUCE MOTION', () => {
    document.documentElement.dataset['reduceMotion'] = '';
    expect(statusMotionStill()).toBe(true);
    const a = rig();
    expect(new Set(a).size).toBe(1);
    expect(a[0]).toBeGreaterThan(0.05);
  });

  it('is off with no flag and no OS preference', () => {
    expect(statusMotionStill()).toBe(false);
  });
});
