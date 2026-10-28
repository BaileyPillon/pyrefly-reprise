/**
 * The enemy-move line under the phone rail is two lines at most, with an ellipsis (backlog 57, release 67; both games, the phone HUD only).
 *
 * `docs/handoff/phone-battle-hud.md` says "the enemy-move line under it, two lines at most"; in Chapter I at 390 x 844 the stylesheet clamped it to THREE. The clamp now reads two, the body's height is the two
 * line boxes, and the rule lives in the phone HUD stylesheet and nowhere else (desktop and a phone held sideways keep today's slab: every rule here is scoped under `html[data-phone-battle]`).
 * The one documented exception stays: a line moved off a guarded feature (`data-phud-line-moved`, the Vegnagun leg's lens) is narrower and may run to five.
 *
 * jsdom has no layout, so the wrapping itself cannot be measured here (the next real-browser pass at 390 x 844 in Chapter I does that); what is pinned is the stylesheet that decides it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHONE = 'src/ui/common/phone-battle-parts.css';
const css = (file: string): string => readFileSync(join(process.cwd(), file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of every rule whose selector list names `selector` exactly, later ones over earlier ones (the cascade at equal specificity). */
function rule(text: string, selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  let found = false;
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!m[1]!.split(',').map((s) => s.trim()).includes(selector)) continue;
    found = true;
    for (const d of m[2]!.split(';')) {
      const i = d.indexOf(':');
      if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).replace('!important', '').trim();
    }
  }
  if (!found) throw new Error(`no rule for ${selector}`);
  return out;
}

describe('the phone HUD\'s enemy-move line', () => {
  const body = rule(css(PHONE), 'html[data-phone-battle] .eint__body');

  it('is clamped to two lines with an ellipsis, in the prefixed and the standard property', () => {
    expect(body['display']).toBe('-webkit-box');
    expect(body['-webkit-box-orient']).toBe('vertical');
    expect(body['-webkit-line-clamp']).toBe('2');
    expect(body['line-clamp']).toBe('2');
    expect(body['overflow']).toBe('hidden');
    expect(body['text-overflow']).toBe('ellipsis');
  });

  it('is no taller than its two line boxes (14 px at 1.3 = 2.6em), so no sliver of a third line shows', () => {
    expect(body['font-size']).toBe('14px');
    expect(body['line-height']).toBe('1.3');
    expect(body['max-height']).toBe('2.6em');
  });

  it('keeps the panel around it no taller than two lines and its padding', () => {
    const panel = rule(css(PHONE), 'html[data-phone-battle] .eint__panel');
    expect(parseFloat(panel['max-height']!)).toBeLessThanOrEqual(60);
    expect(panel['padding']).toBe('6px 10px');
  });

  it('keeps the documented exception: a line moved off a guarded feature runs to five', () => {
    const moved = rule(css(PHONE), 'html[data-phone-battle][data-phud-line-moved] .eint__body');
    expect(moved['-webkit-line-clamp']).toBe('5');
    expect(moved['line-clamp']).toBe('5');
  });

  it('is the phone HUD\'s only: the desktop slab\'s own stylesheets set no two-line clamp on it, and no phone rule is unscoped', () => {
    for (const f of ['src/ui/common/enemy-intent.css', 'src/ui/common/enemy-intent-overflow.css', 'src/ui/common/enemy-intent-brief-status.css']) {
      expect(css(f)).not.toMatch(/line-clamp:\s*2/);
    }
    const text = css(PHONE);
    for (const m of text.matchAll(/([^{}]+)\{/g)) {
      for (const sel of m[1]!.split(',').map((s) => s.trim()).filter((s) => s.includes('eint'))) expect(sel.startsWith('html[data-phone-battle]')).toBe(true);
    }
  });
});
