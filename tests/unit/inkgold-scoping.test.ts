/**
 * Decision 10: only `src/ui/inkgold/` may declare a bare `.ig-*` rule.
 *
 * `.ig-*` is a shared namespace — `src/ui/ffx/**`, `src/ui/ffx2/**` and
 * `src/ui/common/**` all render those class names into the same document — so
 * an unscoped rule in one consumer's stylesheet silently restyles every other
 * consumer's elements.
 *
 * This is not hypothetical. `overdrive-minigames.css` declared a bare
 * `.ig-minigame { opacity: 0 }` as its own enter animation, revealed by its own
 * `.ffx-mg--open`. The FFX-2 Trigger Happy and Lady Luck overlays render
 * `.ig-minigame` and never add that class, so both rendered fully invisible,
 * with nothing thrown and every test green. It was found by eye, fixed with an
 * override in the victim's stylesheet, and came back the moment that override
 * was refactored away — which is why the rule needs a test rather than a note.
 *
 * A consumer rule is legal when every `.ig-*` selector in it is qualified by an
 * owned class or ancestor: `.ffx-hud .ig-minigame`, `.ig-minigame.ffx-mg`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const UI = 'src/ui';
const SHARED_LAYER = 'inkgold';

function cssFilesUnder(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) cssFilesUnder(p, out);
    else if (name.endsWith('.css')) out.push(p);
  }
  return out;
}

/** Strip comments and @-rule preludes, then return each rule's selector list. */
function selectorsOf(css: string): string[] {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: string[] = [];
  for (const m of noComments.matchAll(/([^{}]+)\{/g)) {
    const prelude = m[1]!.trim();
    if (prelude.startsWith('@') || prelude === '') continue;
    for (const sel of prelude.split(',')) out.push(sel.trim());
  }
  return out.filter(Boolean);
}

/**
 * A selector is scoped when something in it is NOT an `.ig-*` class — an owned
 * class, an id, or an element/ancestor. A selector built only from `.ig-*`
 * pieces (plus combinators and pseudo-classes) reaches every consumer.
 */
function isScoped(selector: string): boolean {
  const withoutIg = selector
    .replace(/\.ig-[A-Za-z0-9_-]+/g, ' ')
    .replace(/::?[A-Za-z-]+(\([^)]*\))?/g, ' ')
    .replace(/[>+~*\s]/g, ' ')
    .trim();
  return withoutIg.length > 0;
}

describe('decision 10 — .ig-* selectors are scoped outside src/ui/inkgold', () => {
  const consumerCss = cssFilesUnder(UI).filter((p) => !p.replace(/\\/g, '/').includes(`${UI}/${SHARED_LAYER}/`));

  it('finds consumer stylesheets to check', () => {
    expect(consumerCss.length).toBeGreaterThan(0);
  });

  for (const file of consumerCss) {
    it(`${file.replace(/\\/g, '/')} declares no bare .ig-* rule`, () => {
      const offenders = selectorsOf(readFileSync(file, 'utf8'))
        .filter((sel) => /\.ig-/.test(sel))
        .filter((sel) => !isScoped(sel));

      expect(
        offenders,
        `Unscoped .ig-* selector(s) in ${file}. These restyle every other consumer's ` +
          `elements. Qualify each with an owned class or ancestor — e.g. ` +
          `".ig-minigame.ffx-mg" or ".ffx-hud .ig-minigame". See decision 10 in ` +
          `docs/CONTRACT-CHANGES.md.`,
      ).toEqual([]);
    });
  }
});
