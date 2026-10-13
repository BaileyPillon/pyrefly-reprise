// @vitest-environment jsdom
/**
 * The FFX party prep's Overdrive mode rows take a real mouse click (found by r43-prepphone, handed to the release driver:
 * `docs/handoff/r43-prepphone.md`, "Found, not changed").
 *
 * `index.html` makes `#ui` `pointer-events: none` (the WebGL canvas under it keeps the pointer where nothing on the overlay wants it) and
 * that inherits all the way down. Its `#ui [data-action], #ui button, #ui .ui-interactive` rule turns it back on, but a mode row carries
 * `data-mode`, so it inherited `none`: on a desktop a click on a row landed on the canvas (`elementFromPoint` returned the canvas) and the
 * only thing that equipped a mode was a script's `row.click()`, which is what every unit test did. The fix is the row's own
 * `pointer-events: auto`, as `.prep__member`, `.prep__tab` and `.prep__start` restate it in the shell's sheet.
 *
 * What this file holds: the rule is there; no other `cursor: pointer` control of the three prep sheets lacks it; and the REAL panel's rows,
 * under the page's own `#ui` rules, compute to `auto` with the sheet and to `none` without it (the control that says the harness sees the bug).
 * A real mouse click in a browser is checked by hand against a dev server; jsdom has no hit testing.
 *
 * Game case: FFX only. The Overdrive tab and its mode rows are FFX's (`.ffxprep-*`); FFX-2 has no Overdrive prep tab, and the phone page's
 * rows (both sizes of phone and tablet) already set `pointer-events: auto` of their own (`prep-phone-parts.css`).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import type { PrepPanelContext } from '../../src/app/screens/PartyPrepScreen.ts';
import { makeOverdrivePanel } from '../../src/ui/ffx/party-prep/panels.ts';
import { makeFakePartyBuild } from '../../src/ui/ffx/testFixtures.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

// ----------------------------------------------------------------------------- a small CSS reader (the one in r43-text-floor-css.test.ts)

interface Rule {
  /** The selector text, comments stripped, whitespace squeezed. */
  sel: string;
  /** The at-rules it sits in, outermost first, joined with " | " ("" at the top level). */
  at: string;
  body: string;
}

/** The leaf rule blocks of a sheet, with the at-rule each sits in. Handles comments, strings and nested at-rules. */
function leafRules(css: string): Rule[] {
  const out: Rule[] = [];
  const stack: { open: number; head: string; hasChild: boolean }[] = [];
  let headStart = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i]!;
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? css.length : end + 1;
      continue;
    }
    if (c === '"' || c === "'") {
      i++;
      while (i < css.length && css[i] !== c) i += css[i] === '\\' ? 2 : 1;
      continue;
    }
    if (c === '{') {
      const head = css.slice(headStart, i).replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/\s+/g, ' ');
      if (stack.length > 0) stack[stack.length - 1]!.hasChild = true;
      stack.push({ open: i, head, hasChild: false });
      headStart = i + 1;
    } else if (c === '}') {
      const top = stack.pop();
      if (top && !top.hasChild) out.push({ sel: top.head, at: stack.map((s) => s.head).join(' | '), body: css.slice(top.open + 1, i) });
      headStart = i + 1;
    } else if (c === ';' && stack.length === 0) {
      headStart = i + 1;
    }
  }
  return out;
}

/** `{ prop: value }` for a rule body's declarations (comments out first: a comment may quote a declaration). */
const declarations = (body: string): Record<string, string> =>
  Object.fromEntries([...body.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([a-z-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));

const FFX_SHEET = 'src/ui/ffx/party-prep/party-prep.css';
const PREP_SHEETS = ['src/ui/common/party-prep.css', FFX_SHEET, 'src/ui/ffx2/party-prep/party-prep.css'] as const;

// ----------------------------------------------------------------------------- the CSS half

describe('the Overdrive mode row restates pointer-events: auto (it is not a [data-action], so #ui\'s none reaches it)', () => {
  const rules = leafRules(read(FFX_SHEET));

  it('.ffxprep-mode-row declares pointer-events: auto, at the top level (every window size)', () => {
    const row = rules.filter((r) => r.sel === '.ffxprep-mode-row');
    expect(row).toHaveLength(1);
    expect(row[0]!.at).toBe('');
    expect(declarations(row[0]!.body)['pointer-events']).toBe('auto');
    expect(declarations(row[0]!.body)['cursor']).toBe('pointer'); // it is a click target: the cursor says so
  });

  it('no rule of the sheet takes it away again (no `pointer-events: none` on a mode row)', () => {
    const taken = rules.filter((r) => /mode-row/.test(r.sel) && declarations(r.body)['pointer-events'] === 'none');
    expect(taken.map((r) => r.sel)).toEqual([]);
  });

  it('every `cursor: pointer` control of the three prep sheets carries its own pointer-events: auto (none repeats the bug)', () => {
    const found: string[] = [];
    for (const file of PREP_SHEETS) {
      for (const r of leafRules(read(file))) {
        if (declarations(r.body)['cursor'] !== 'pointer') continue;
        found.push(r.sel);
        expect(declarations(r.body)['pointer-events'], `${file}: ${r.sel}`).toBe('auto');
      }
    }
    // The reader found the shell's own targets and the mode row, so the loop above is not empty.
    for (const sel of ['.prep__member', '.prep__tab', '.prep__start', '.ffxprep-mode-row']) expect(found, sel).toContain(sel);
  });
});

// ----------------------------------------------------------------------------- the behaviour half

/** `index.html`'s own `#ui` rules (`#ui` itself and the `[data-action]`, `button`, `.ui-interactive` fallback), read from the file. */
function pageUiRules(): Rule[] {
  const styles = [...read('index.html').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]!).join('\n');
  return leafRules(styles).filter((r) => r.at === '' && /^#ui(?![-\w])/.test(r.sel));
}

const asCss = (rules: readonly Rule[]): string => rules.map((r) => `${r.sel} {${r.body}}`).join('\n');

/** The real Overdrive panel for Tidus, mounted the way the shell mounts a panel, in a `#ui` styled by the page's own rules and, optionally, the FFX panel sheet. */
function mountOverdrive(withPanelSheet: boolean): HTMLElement[] {
  const style = document.createElement('style');
  style.textContent = asCss(pageUiRules()) + (withPanelSheet ? '\n' + asCss(leafRules(read(FFX_SHEET)).filter((r) => r.at === '')) : '');
  document.head.appendChild(style);
  document.body.innerHTML = '<div id="ui"><div class="screen"><div class="prep"><div class="prep__sheet"><div class="prep__sheet-inner" data-role="body"></div></div></div></div></div>';
  const body = document.querySelector<HTMLElement>('[data-role="body"]')!;
  const build = makeFakePartyBuild();
  const ctx: PrepPanelContext = { chapter: { buildRef: build } as PrepPanelContext['chapter'], memberId: 'tidus' };
  makeOverdrivePanel().mount(body, ctx);
  return [...body.querySelectorAll<HTMLElement>('.ffxprep-mode-list [data-mode]')];
}

describe("the real Overdrive panel's rows, under the page's own #ui rules (jsdom resolves the inheritance)", () => {
  afterEach(() => {
    document.head.querySelectorAll('style').forEach((s) => s.remove());
    document.body.innerHTML = '';
  });

  it("the premise: the page's #ui is pointer-events: none and its fallback names [data-action], button and .ui-interactive, not a mode row", () => {
    const rules = pageUiRules();
    const ui = rules.find((r) => r.sel === '#ui');
    expect(ui && declarations(ui.body)['pointer-events']).toBe('none');
    const fallback = rules.find((r) => r.sel.includes('[data-action]'));
    expect(fallback && declarations(fallback.body)['pointer-events']).toBe('auto');
    expect(fallback!.sel.split(',').map((s) => s.trim())).toEqual(['#ui [data-action]', '#ui button', '#ui .ui-interactive']);
  });

  it('control, without the fix: every mode row (and its words) inherits none, the bug the click fell through', () => {
    const rows = mountOverdrive(false);
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
      expect(row.hasAttribute('data-action')).toBe(false); // so the page's fallback does not reach it
      expect(getComputedStyle(row).pointerEvents, row.dataset['mode']).toBe('none');
    }
  });

  it('with the sheet, every mode row and the words in it take the pointer', () => {
    const rows = mountOverdrive(true);
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
      expect(row.classList.contains('ffxprep-mode-row')).toBe(true);
      expect(getComputedStyle(row).pointerEvents, row.dataset['mode']).toBe('auto');
      expect(getComputedStyle(row.querySelector('.ffxprep-mode-row__name')!).pointerEvents).toBe('auto');
    }
    // The list around the rows is not made a target: only what is clicked takes the pointer.
    expect(getComputedStyle(document.querySelector('.ffxprep-mode-list')!).pointerEvents).toBe('none');
  });
});
