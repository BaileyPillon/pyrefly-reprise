/**
 * The CSS of step D1 of the FFX-2 Special look (game case: FFX-2 only in what is seen: every rule is keyed on a part row being drawn, the badge, the part tile or the plate attribute,
 * all of which exist only in a Special form).
 *
 * Read as text from the three sheets, from the first line of the step's block (a comment naming "Special look, step D1") to the end of the file. Every rule in that block has a selector
 * that contains one of the form markers; none keys on a class of the party list itself; the two form variables are declared on the form's list, not on `.ffx2hud`; the phone block never
 * uses an ellipsis on a name. Step A's CSS pin (`special-off-pins.test.ts`) proves the rules that were there are unchanged.
 *
 * Removal check: add a rule to the block keyed on `.ffx2hud__party` alone, or put `text-overflow: ellipsis` in a form rule, and the matching case fails.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = resolve(__dirname, '..', '..');
const MARK = 'Special look, step D1';
const FORM = /\.ig-stat--form|:has\(\.ig-stat--form-part\)|\.ffx2stat__badge|\.ffx2stat__part-img|\.ffx2stat__face--part|\[data-form-role\]/;

interface Rule { selectors: string[]; body: string }

function readRules(css: string): Rule[] {
  const out: Rule[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) break;
    const prelude = text.slice(i, open).replace(/^[\s;}]+/, '').trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    const inner = text.slice(open + 1, j - 1);
    if (/^@(media|supports)\b/.test(prelude)) out.push(...readRules(inner));
    else if (!prelude.startsWith('@')) out.push({ selectors: splitTop(prelude).map((s) => s.replace(/\s+/g, ' ').trim()), body: inner.replace(/\s+/g, ' ').trim() });
    i = j;
  }
  return out;
}

/** Split a selector list on the commas outside parentheses and brackets. */
function splitTop(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.filter((s) => s.trim());
}

function added(file: string): Rule[] {
  const css = readFileSync(resolve(REPO, file), 'utf8');
  const at = css.indexOf(MARK);
  expect(at, `${file} carries the step's block`).toBeGreaterThan(-1);
  const start = css.lastIndexOf('/*', at);
  return readRules(css.slice(start));
}

const FILES = ['src/ui/ffx2/ffx2-hud.css', 'src/ui/hudf1/hudf1-ffx2.css', 'src/ui/ffx2/phone-hud.css'] as const;

/** The rules the step adds, by their first selector (the list the cases below check against). */
const NAMED: Record<(typeof FILES)[number], string[]> = {
  'src/ui/ffx2/ffx2-hud.css': [
    '.ffx2hud__party:has(.ig-stat--form-part)',
    '.ffx2hud .ffx2hud__party:has(.ig-stat--form-part) .ig-stat',
    '.ffx2hud .ffx2hud__party:has(.ig-stat--form-part) .ig-stat--acting',
    '.ffx2stat__badge',
    '.ffx2hud__party:has(.ig-stat--form-part) .ffx2stat__badge',
    '.ffx2stat__face--part .ffx2stat__part-img',
    '.ffx2hud__party .ig-stat[data-form-role]',
  ],
  'src/ui/hudf1/hudf1-ffx2.css': [
    '.ffx2hud.hud-f1 .ffx2hud__party:has(.ig-stat--form-part)',
    '.ffx2hud.hud-f1 .ffx2hud__party:has(.ig-stat--form-part) .ffx2stat__top',
    'html:not([data-phone-battle]) .ffx2hud.hud-f1 .ffx2stat__badge',
  ],
  'src/ui/ffx2/phone-hud.css': [
    "html[data-phone-battle='ffx2'] .ffx2hud .ffx2hud__party:has(.ig-stat--form-part)",
    "html[data-phone-battle='ffx2'] .ffx2hud .ffx2hud__party:has(.ig-stat--form-part) .ig-stat",
    "html[data-phone-battle='ffx2'] .ffx2hud .ffx2hud__party:has(.ig-stat--form-part) .ig-stat__name",
    "html[data-phone-battle='ffx2'] .ffx2hud .ffx2hud__party:has(.ig-stat--form-part) .ffx2stat__badge",
    "html[data-phone-battle='ffx2']:has(.ig-stat--form-part) .ffx2-atbmode",
    "html[data-phone-battle='ffx2']:has(.ig-stat--form-part) .sthint--ffx2.sthint--phone",
  ],
};

describe('the rules the step adds', () => {
  for (const file of FILES) {
    it(`${file}: every named rule is there, and every added rule has a form marker in each selector`, () => {
      const rules = added(file);
      const firsts = rules.map((r) => r.selectors[0]);
      for (const name of NAMED[file]) expect(firsts, name).toContain(name);
      for (const r of rules) for (const sel of r.selectors) expect(FORM.test(sel), `${file}: ${sel}`).toBe(true);
    });

    it(`${file}: no added rule keys on a class of the party list alone`, () => {
      for (const r of added(file)) {
        for (const sel of r.selectors) {
          const onList = /(^|[ >+~])\.(ffx2hud__party|ig-stat-list)(?![\w-])/.test(sel.replace(/:has\([^)]*\)/g, ''));
          if (onList) expect(sel, `${file}: ${sel}`).toMatch(/:has\(\.ig-stat--form-part\)|\[data-form-role\]/);
        }
      }
    });
  }
});

describe('the form variables, the badge and the plate taps', () => {
  const hud = added('src/ui/ffx2/ffx2-hud.css');
  const decl = (rules: Rule[], sel: string): string => rules.find((r) => r.selectors.includes(sel))?.body ?? '';

  it('--ffx2-form-w and --ffx2-form-name are declared on the form\'s list, never on .ffx2hud', () => {
    const body = decl(hud, '.ffx2hud__party:has(.ig-stat--form-part)');
    expect(body).toContain('--ffx2-form-w: 250px');
    expect(body).toContain('--ffx2-form-name: 100px');
    for (const r of hud) if (r.selectors.some((s) => s === '.ffx2hud' || s === '.ffx2hud__party')) expect(r.body).not.toMatch(/--ffx2-form-/);
  });

  it('the badge is hidden outside a form and shown only while a part row is drawn', () => {
    expect(decl(hud, '.ffx2stat__badge')).toBe('display: none;');
    expect(decl(hud, '.ffx2hud__party:has(.ig-stat--form-part) .ffx2stat__badge')).toContain('display: inline-flex');
  });

  it('a plate takes pointer events through the attribute alone, and no class is toggled on the list', () => {
    expect(decl(hud, '.ffx2hud__party .ig-stat[data-form-role]')).toBe('pointer-events: auto; cursor: pointer;');
    const sources = ['src/ui/ffx2/plateTap.ts', 'src/ui/ffx2/specialRows.ts', 'src/ui/ffx2/partCrop.ts', 'src/ui/ffx2/specialLeave.ts'].map((f) => readFileSync(resolve(REPO, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''));
    for (const text of sources) expect(text).not.toMatch(/classList|className|setAttribute|\.style\b|toggleAttribute|innerHTML\s*=/);
  });
});

describe('the phone block', () => {
  const phone = added('src/ui/ffx2/phone-hud.css');
  const forms = phone.filter((r) => r.selectors.some((s) => s.includes(':has(.ig-stat--form-part)')));

  it('sets text-overflow: clip on the name and uses no ellipsis in any rule of a form', () => {
    const name = phone.find((r) => r.selectors.includes("html[data-phone-battle='ffx2'] .ffx2hud .ffx2hud__party:has(.ig-stat--form-part) .ig-stat__name"));
    expect(name?.body).toContain('text-overflow: clip');
    expect(name?.body).toContain('overflow: visible');
    for (const r of forms) expect(r.body, r.selectors[0]).not.toContain('ellipsis');
  });

  it('stacks the three plates: one column, 46 px rows, the badge at the 14 px floor, and the two lifted anchors gain 84 px', () => {
    const body = (sel: string): string => phone.find((r) => r.selectors.includes(sel))?.body ?? '';
    const p = "html[data-phone-battle='ffx2'] .ffx2hud .ffx2hud__party:has(.ig-stat--form-part)";
    expect(body(p)).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(body(`${p} .ig-stat`)).toContain('height: 46px');
    expect(body(`${p} .ffx2stat__badge`)).toContain('font-size: 14px');
    expect(body("html[data-phone-battle='ffx2']:has(.ig-stat--form-part) .ffx2-atbmode")).toContain('+ 76px + 84px');
    expect(body("html[data-phone-battle='ffx2']:has(.ig-stat--form-part) .sthint--ffx2.sthint--phone")).toContain('+ 68px + 84px');
  });
});

describe('the existing sheets are only added to', () => {
  it('the step\'s block is the tail of each file: nothing before it was edited (step A\'s CSS pin proves the named rules)', () => {
    for (const file of FILES) {
      const css = readFileSync(resolve(REPO, file), 'utf8');
      const at = css.indexOf(MARK);
      const tail = css.slice(css.lastIndexOf('/*', at));
      expect(tail.indexOf(MARK)).toBeGreaterThan(-1);
      expect(readRules(tail).length, file).toBeGreaterThan(2);
    }
  });
});
