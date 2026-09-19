import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * A guard on the stylesheet itself, because the defect it pins cannot be seen
 * in jsdom: jsdom does not cascade a `border-width` shorthand over the
 * per-side widths, so the DOM tests all passed while the real browser drew
 * four closed squares.
 *
 * The bracket is four **L-shaped corners**: each corner span sets two of its
 * four border widths and leaves the other two at zero. Any rule that writes
 * the `border-width` shorthand anywhere in that subtree sets all four sides at
 * once and closes the L into a square. That is exactly what
 * `.ffx-target--dim .ffx-target__c { border-width: 2px }` did, on every target
 * of the Hastega cast in Bailey's screenshot. The stroke weight travels as
 * `--ffx-bw` instead.
 *
 * GAME-AWARE (AGENTS.md rule 14): the bracket is **both games** — FFX and
 * FFX-2 share one `TargetCursor` and this one stylesheet for it.
 */
const CSS = readFileSync(
  fileURLToPath(new URL('../../src/ui/ffx/ffx-hud.css', import.meta.url)),
  'utf8',
);

/** The stylesheet with comments stripped, so prose about the bug is not read as the bug. */
const CODE = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Every rule whose selector mentions the target bracket, as [selector, body]. */
function bracketRules(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(CODE))) {
    const selector = m[1]!.trim();
    if (/\.ffx-target(\b|__|--)/.test(selector)) out.push([selector, m[2]!]);
  }
  return out;
}

describe('the target bracket stays four L-shaped corners', () => {
  it('finds the bracket rules at all', () => {
    const rules = bracketRules();
    expect(rules.length).toBeGreaterThan(5);
    expect(rules.some(([sel]) => sel.includes('.ffx-target__c--tl'))).toBe(true);
  });

  it('never sets the border-width shorthand on a bracket rule', () => {
    const offenders: string[] = [];
    for (const [sel, body] of bracketRules()) {
      for (const decl of body.split(';')) {
        const m = /^\s*border-width\s*:\s*(.+)$/.exec(decl);
        if (!m) continue;
        // `inherit` is the one legal use: the ink underlay takes the corner's
        // own computed per-side widths, so it is the same L two pixels larger.
        if (m[1]!.trim() !== 'inherit') offenders.push(sel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('never sets the border shorthand to a non-zero width either', () => {
    const offenders: string[] = [];
    for (const [sel, body] of bracketRules()) {
      for (const decl of body.split(';')) {
        const m = /^\s*border\s*:\s*(.+)$/.exec(decl);
        if (!m) continue;
        // `border: 0 solid <colour>` is the reset every corner starts from and
        // is fine; anything with a real length closes the L into a square.
        if (/(^|\s)(?!0(\s|$))[\d.]+(px|em|rem)?(\s|$)/.test(m[1]!)) offenders.push(sel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('each corner sets exactly two per-side widths, from --ffx-bw', () => {
    for (const corner of ['tl', 'tr', 'bl', 'br']) {
      const rule = bracketRules().find(([sel]) => sel.includes(`.ffx-target__c--${corner}`));
      expect(rule, corner).toBeDefined();
      const sides = rule![1].match(/border-(top|right|bottom|left)-width\s*:/g) ?? [];
      expect(sides, corner).toHaveLength(2);
      expect(rule![1], corner).toContain('var(--ffx-bw)');
    }
  });

  it('the subordinate-candidate rule changes the custom property, not a border', () => {
    const dim = bracketRules().find(([sel]) => sel.trim() === '.ffx-target--dim');
    expect(dim).toBeDefined();
    expect(dim![1]).toContain('--ffx-bw');
  });
});

/**
 * The bracket and the plate are ONE layer.
 *
 * The pre-release verifier read Chapter 1's KO'd-ally frame as "her bracket is
 * drawn underneath the item rows while her name plate is drawn on top of
 * them". Both are children of `.ffx-targeting`, so that can only become true
 * if a rule gives one of them a z-index of its own and splits the stack. This
 * guard is what stops that happening later.
 */
describe('the whole cursor stacks as one layer, above the command lists', () => {
  it('only the layer root carries a z-index', () => {
    const offenders: string[] = [];
    for (const [sel, body] of bracketRules()) {
      if (/(^|\s|,)\.ffx-targeting\s*$/.test(sel)) continue;
      if (/z-index\s*:/.test(body)) offenders.push(sel);
    }
    expect(offenders).toEqual([]);
    const root = /\.ffx-targeting\s*\{([^{}]*)\}/.exec(CODE)?.[1] ?? '';
    expect(root).toMatch(/z-index:\s*(3[2-9]|[4-9]\d)/);
  });

  it('the plate has a rule for each dock side TargetCursor can choose', () => {
    for (const side of ['below', 'above', 'right', 'left']) {
      expect(CODE, side).toContain(`.ffx-target__plate--${side}`);
    }
  });

  it("a selected KO'd ally's row is not greyed out of its own accent", () => {
    // `.ffx-stat--ko` wears `filter: grayscale(1)`, which greys the green
    // selection ring with everything else. Selection wins on the one row the
    // player is aiming at. FFX only (rule 14): `.ffx-stat--ko` is FFX's row.
    const rule = /\.ffxhud\s+\.ig-stat\.ffx-stat--ko\.ig-party-row--targeted\s*\{([^{}]*)\}/.exec(CODE)?.[1];
    expect(rule, 'no KO+targeted rule in ffx-hud.css').toBeDefined();
    expect(rule).toMatch(/filter:\s*none/);
    expect(rule).toMatch(/opacity:\s*1/);
    expect(rule).toContain('#7ee8b0');
  });
});
