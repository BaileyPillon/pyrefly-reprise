import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The F1 text floor must WIN the cascade (hud-f1 review M1, 2026-10-23). `hud-f1-type.test.ts` reads the F1 sheets only, so it passed while `common/hud-floor.css` (one element more specific, and loaded
 * after) kept drawing the old /max numerals, count badges, OD label and role chip at 20 to 26 px at 2560 x 1440. This test compares the SPECIFICITY of each F1 text rule with the old rule that sets the same
 * property on the same element, and fails when the old one outranks it and `hudf1-floor.css` has no stronger twin.
 */
const root = join(__dirname, '../..');
const read = (p: string): string => readFileSync(join(root, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

type Spec = [number, number, number];
const cmp = (a: Spec, b: Spec): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function splitTop(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

/** Specificity of one selector: ids, classes / attributes / pseudo-classes, elements. `:not`, `:is` and `:has` count as their (largest) argument. */
function specificity(sel: string): Spec {
  const s: Spec = [0, 0, 0];
  const fn = /:(not|is|has|where)\(((?:[^()]|\([^()]*\))*)\)/g;
  const rest = sel.trim().replace(fn, (_m, name: string, arg: string) => {
    if (name !== 'where') {
      const best = splitTop(arg)
        .map(specificity)
        .reduce<Spec>((a, b) => (cmp(b, a) > 0 ? b : a), [0, 0, 0]);
      s[0] += best[0];
      s[1] += best[1];
      s[2] += best[2];
    }
    return ' ';
  });
  s[0] += (rest.match(/#[\w-]+/g) ?? []).length;
  s[1] += (rest.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  const bare = rest.replace(/\[[^\]]*\]/g, ' ').replace(/[.#:][\w-]+/g, ' ');
  s[2] += (bare.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return s;
}

interface Rule {
  sel: string;
  body: string;
}
function rules(css: string): Rule[] {
  const out: Rule[] = [];
  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) for (const sel of splitTop(m[1]!.trim())) out.push({ sel, body: m[2]! });
  return out;
}
/** "what the rule styles": the selector after the game's root, e.g. `.ig-stat__value small`. */
function tailOf(sel: string, rootClass: string): string | null {
  const m = new RegExp(`\\.${rootClass}(?:\\.hud-f1)?\\s+(.+)$`).exec(sel);
  return m ? m[1]!.trim() : null;
}
const sets = (body: string, prop: string): boolean => new RegExp(`(?:^|;|\\s)${prop}\\s*:`).test(body);

const floorOld = rules(read('src/ui/common/hud-floor.css'));
const floorF1 = rules(read('src/ui/hudf1/hudf1-floor.css'));
const f1Sheets = ['hudf1.css', 'hudf1-ffx.css', 'hudf1-ffx2.css'].flatMap((f) => rules(read(`src/ui/hudf1/${f}`)));

describe('the F1 floor sheet outranks the old floor', () => {
  it('measures specificity the way the cascade does', () => {
    expect(specificity('html:not([data-phone-battle]) .ffxhud .ig-stat__value small')).toEqual([0, 3, 2]);
    expect(specificity('.ffxhud.hud-f1 .ig-stat__value small')).toEqual([0, 3, 1]);
    expect(specificity('html:not([data-phone-battle]) .ffxhud.hud-f1 .ig-stat__value small')).toEqual([0, 4, 2]);
    expect(specificity(':root:has(.hud-f1) .dnum.dnum--glass')).toEqual([0, 4, 0]);
  });

  for (const [rootClass, game] of [
    ['ffxhud', 'FFX'],
    ['ffx2hud', 'FFX-2'],
  ] as const) {
    it(`${game}: every old floor rule on an element the F1 floor sheet restyles is outranked by it`, () => {
      const mine = floorF1.filter((r) => tailOf(r.sel, rootClass) !== null && sets(r.body, 'font-size'));
      let pairs = 0;
      for (const r of mine) {
        const tail = tailOf(r.sel, rootClass)!;
        // a rule with no old twin on the same tail (the MP unit: today's `.ig-stat__value small` reaches it) is checked by the browser audit instead
        const old = floorOld.filter((o) => tailOf(o.sel, rootClass) === tail && sets(o.body, 'font-size'));
        for (const o of old) {
          pairs++;
          expect(cmp(specificity(r.sel), specificity(o.sel)), `${r.sel} must outrank ${o.sel}`).toBeGreaterThan(0);
        }
      }
      expect(pairs, 'the test finds the pairs it is meant to compare').toBeGreaterThanOrEqual(2);
    });

    it(`${game}: no F1 text rule is silently beaten by an old floor rule (it has a twin in hudf1-floor.css, or is more specific)`, () => {
      const twins = new Set(floorF1.filter((r) => tailOf(r.sel, rootClass) !== null).map((r) => tailOf(r.sel, rootClass)!));
      const beaten: string[] = [];
      for (const r of f1Sheets) {
        if (!sets(r.body, 'font-size') && !sets(r.body, 'font')) continue;
        if (/!important/.test(r.body)) continue;
        const tail = tailOf(r.sel, rootClass);
        if (tail === null || twins.has(tail)) continue;
        for (const o of floorOld) {
          if (tailOf(o.sel, rootClass) !== tail || !sets(o.body, 'font-size')) continue;
          if (cmp(specificity(r.sel), specificity(o.sel)) <= 0) beaten.push(`${r.sel} loses to ${o.sel}`);
        }
      }
      expect(beaten).toEqual([]);
    });
  }

  it('the F1 damage numeral outranks every glass / foil numeral rule that styles a .dnum, and hangs from an F1 root (review M6)', () => {
    const mine = rules(read('src/ui/hudf1/hudf1-numbers.css'));
    expect(mine.length).toBeGreaterThan(0);
    for (const r of mine) expect(r.sel.startsWith(':root:has(.hud-f1) ')).toBe(true);
    const theirs = ['src/ui/common/pro-numbers.css', 'src/ui/common/damage-numbers.css', 'src/ui/common/fx-c-foil.css', 'src/ui/ffx2/ffx2-hud.css', 'src/ui/ffx/ffx-hud.css']
      .flatMap((f) => rules(read(f)))
      .filter((r) => r.sel.includes('.dnum') && (sets(r.body, 'filter') || sets(r.body, 'background') || sets(r.body, 'font-family')));
    expect(theirs.length).toBeGreaterThan(5);
    const top = theirs.reduce<Spec>((a, r) => (cmp(specificity(r.sel), a) > 0 ? specificity(r.sel) : a), [0, 0, 0]);
    for (const r of mine) expect(cmp(specificity(r.sel), top), `${r.sel} must outrank ${top.join(',')}`).toBeGreaterThan(0);
  });

  it('the OD label ends where the bar begins, so a full gauge\'s "OVERDRIVE" is not struck through (review M3)', () => {
    const css = read('src/ui/hudf1/hudf1-floor.css');
    expect(css).toMatch(/\.ffx-stat__od em \{[^}]*left: auto;[^}]*right: calc\(100% \+ 3\.5px\)/);
  });
});
