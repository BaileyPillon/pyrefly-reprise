/**
 * The full-bleed, high-resolution pause screen (fix round 3).
 *
 * Bailey played the live build on a 2000x1012 window and reported three things
 * about this screen: the painting did not reach the edges, it looked like a
 * small image blown up, and the chrome was too small to read. The first is a
 * layout fact, the second is an asset-pipeline fact and the third is a
 * stylesheet fact — so this file pins one of each, at the level it can be
 * pinned without a browser. The browser half (real key presses at six viewport
 * sizes, measured rects and `currentSrc`) is in
 * `docs/handoff/fix3-pause.md`.
 *
 * The CSS assertions read the stylesheet as text. That is unusual here and
 * deliberate: the defect was a *literal* — `font-size: 5.33px`, authored for a
 * 640x360 canvas that this screen no longer has — and a value that small
 * cannot come back without this file going red.
 */

import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildManifest } from '../../tools/gen/manifest.mjs';
import {
  parseArtManifest,
  pause2xUrlFor,
  pauseStemOf,
  resetArtManifest,
  setArtManifest,
} from '../../src/engine/ArtManifest.ts';
import { DEFAULT_PAUSE_FOCAL, parseArtFocal } from '../../src/ui/common/chapterPanel.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', 'src');
const css = (name: string): string => readFileSync(join(SRC, 'ui', 'common', name), 'utf8');

// ------------------------------------------------------- reading the cascade

/** One declaration block, with the selector list it was written against. */
interface CssRule {
  file: string;
  selector: string;
  body: string;
}

/**
 * Every rule in every stylesheet under `src/`, flattened.
 *
 * `@media` wrappers fall out of the match on their own: a selector cannot
 * contain a brace, so the only things that match are the innermost blocks. That
 * loses the media condition, which is the conservative direction — a rule
 * inside a query applies to *fewer* windows than this pretends, never more.
 */
function allCssRules(): CssRule[] {
  const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.css'));
  const rules: CssRule[] = [];
  for (const file of files) {
    const text = readFileSync(join(SRC, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1]!.trim();
      if (selector.startsWith('@') || !selector) continue;
      rules.push({ file: file.replace(/\\/g, '/'), selector, body: m[2]! });
    }
  }
  return rules;
}

/**
 * CSS specificity as the one number that matters here: how many classes,
 * attributes and pseudo-classes the selector carries (ids and elements do not
 * appear in any of these rules). Arguments of `:not()` count, which is what the
 * spec says and what makes `.cpanel:not(.cpanel--fluid) .x` a three.
 *
 * Read for the *strongest* selector in a list, because that is the one that
 * decides whether the rule wins on an element all of them match.
 */
function classWeight(selectorList: string): number {
  return Math.max(
    ...selectorList.split(',').map((sel) => (sel.match(/\.[\w-]+/g) ?? []).length + (sel.match(/\[[^\]]+\]/g) ?? []).length),
  );
}

// ---------------------------------------------------------------- manifest

describe('the manifest indexes the 2x pause masters', () => {
  let root = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pyrefly-pause2x-'));
    mkdirSync(join(root, 'pause'), { recursive: true });
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    resetArtManifest();
  });

  const plate = (name: string, files: string[]): void => {
    for (const f of files) writeFileSync(join(root, 'pause', `${name}${f}`), 'x');
  };

  it('lists a plate that ships both the 1x PNG and the 2x WebP', () => {
    plate('ch1-seymour-flux', ['.png', '.json', '.2x.webp']);
    plate('ch2-yunalesca', ['.png', '.json']);

    const { manifest } = buildManifest(root);

    expect(manifest.pause).toEqual(['ch1-seymour-flux', 'ch2-yunalesca']);
    expect(manifest.pause2x).toEqual(['ch1-seymour-flux']);
  });

  it('never lists a 2x master with no 1x plate beside it', () => {
    // A half-landed render. Offering it alone would leave a browser that picks
    // the small candidate — or cannot decode WebP — with no painting at all.
    plate('ch3-orphan', ['.2x.webp']);

    const { manifest } = buildManifest(root);

    expect(manifest.pause).toEqual([]);
    expect(manifest.pause2x).toEqual([]);
  });

  it('does not mistake a numbered candidate or another extension for a master', () => {
    plate('ch4-bahamut', ['.png', '.json', '.2.webp', '.2x.png', '.2x.jpg']);

    const { manifest } = buildManifest(root);

    expect(manifest.pause).toEqual(['ch4-bahamut']);
    expect(manifest.pause2x).toEqual([]);
  });
});

describe('parseArtManifest', () => {
  it('reads pause2x, and treats a manifest written before it as empty', () => {
    expect(
      parseArtManifest({ subjects: {}, pause: ['a'], pause2x: ['a'] })?.pause2x,
    ).toEqual(['a']);
    // An older deploy's manifest.json: no opinion means ship the 1x alone.
    expect(parseArtManifest({ subjects: {}, pause: ['a'] })?.pause2x).toEqual([]);
    expect(parseArtManifest({ subjects: {}, pause2x: 'nope' })?.pause2x).toEqual([]);
  });
});

describe('pause plate urls', () => {
  afterEach(() => resetArtManifest());

  it('finds the stem of a pause plate url and nothing else', () => {
    expect(pauseStemOf('/pyrefly-reprise/art/pause/ch1-seymour-flux.png')).toBe('ch1-seymour-flux');
    expect(pauseStemOf('/art/pause/auron.png?v=2')).toBe('auron');
    expect(pauseStemOf('/art/portraits/auron.png')).toBeNull();
    expect(pauseStemOf('/art/pause/auron.2x.webp')).toBeNull();
    expect(pauseStemOf('/art/characters/auron/idle.png')).toBeNull();
  });

  it('offers the 2x master only for a plate the manifest actually saw', () => {
    setArtManifest({
      version: 1,
      generatedAt: '',
      subjects: {},
      portraits: [],
      backdrops: [],
      pause: ['ch1-seymour-flux', 'ch2-yunalesca'],
      pause2x: ['ch1-seymour-flux'],
      title: [],
      title2x: [],
    });

    expect(pause2xUrlFor('/art/pause/ch1-seymour-flux.png')).toBe('/art/pause/ch1-seymour-flux.2x.webp');
    // The whole point: no srcset entry for a file nobody has rendered yet.
    expect(pause2xUrlFor('/art/pause/ch2-yunalesca.png')).toBeNull();
    expect(pause2xUrlFor('/art/portraits/auron.png')).toBeNull();
  });

  it('says nothing at all before the manifest has loaded', () => {
    resetArtManifest();
    expect(pause2xUrlFor('/art/pause/ch1-seymour-flux.png')).toBeNull();
  });
});

// ------------------------------------------------------------------- focal

describe('parseArtFocal', () => {
  it('reads a focal point out of a plate sidecar', () => {
    expect(parseArtFocal({ focal: { x: 0.42, y: 0.28 } })).toEqual({ x: 0.42, y: 0.28 });
  });

  it('clamps rather than rejects a value outside the frame', () => {
    expect(parseArtFocal({ focal: { x: 1.4, y: -0.2 } })).toEqual({ x: 1, y: 0 });
  });

  it('answers null for every shape a generator sidecar actually has', () => {
    // These are real sidecars: prompt/seed/canvas metadata with no focal.
    expect(parseArtFocal({ seed: 20261675, canvas: { width: 1344, height: 768 } })).toBeNull();
    expect(parseArtFocal({ focal: { x: '0.5', y: 0.3 } })).toBeNull();
    expect(parseArtFocal({ focal: { x: Number.NaN, y: 0.3 } })).toBeNull();
    expect(parseArtFocal({ focal: null })).toBeNull();
    expect(parseArtFocal(null)).toBeNull();
  });

  it('defaults above centre, because every plate is a head-and-shoulders close-up', () => {
    expect(DEFAULT_PAUSE_FOCAL).toEqual({ x: 0.5, y: 0.35 });
  });
});

// --------------------------------------------------------------- the CSS
/*
 * Three describes stood here and are gone with what they described.
 *
 * They pinned the old pause stylesheet: `.pause__art-img`'s framing, the
 * `--pause-fs-*` clamp floors, the three party cards' flex minimums, and the
 * `'rail panel'` grid that stopped the Seymour quote printing over QUIT TO
 * TITLE. The Until Dawn remake (Bailey, 21 Sep 2026, "B, yes, yes, yes") has
 * no cards, no rail and no grid: one painted plate per member fills the
 * window and every line floats on it. What replaced those guarantees — the
 * 14px floor on every desktop token, the 12px floor on the phone, the grade,
 * the reduced-motion stop and the mirrored chrome — is pinned by
 * `pause-remake-css.test.ts`, and the six approved frames are in
 * `docs/concepts/pause-until-dawn/`.
 *
 * Everything below this point is the shared `chapter-panel.css`, which party
 * prep still uses and the remake did not touch.
 */

describe('chapter-panel.css scales for both of its grounds', () => {
  const sheet = css('chapter-panel.css');

  it('keeps the prep tab on the 640x360 grid by default', () => {
    // `--cp-u: 1px` is what makes every `calc(5.33 * var(--cp-u))` below come
    // out at the grid value it replaced, so the letterboxed tab is unchanged.
    expect(/\.cpanel \{[^}]*--cp-u: 1px;/s.test(sheet)).toBe(true);
  });

  it('gives the pause screen a fluid scale with a 14px floor', () => {
    const fluid = /\.cpanel--fluid \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    const floors = [...fluid.matchAll(/--cp-fs-[a-z-]+:\s*clamp\(([\d.]+)px/g)].map((m) =>
      Number.parseFloat(m[1]!),
    );
    expect(floors.length).toBeGreaterThanOrEqual(10);
    expect(Math.min(...floors)).toBeGreaterThanOrEqual(14);
  });

  it('lets a polaroid caption wrap instead of truncating it', () => {
    // The defect: `-webkit-line-clamp: 2` printed "Limbo, a thousand years…"
    // on a tile with room for the words. (The comment that records that is
    // still in the file, so this looks for the *declaration*.)
    expect(sheet).not.toMatch(/^\s*-webkit-line-clamp: \d/m);
    const cap = /\.cpanel__snap-cap \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    expect(cap).not.toContain('text-overflow: ellipsis');
    expect(cap).toContain('overflow-wrap: break-word');
  });
});

/*
 * ------------------------------------------------------- the caption, again
 *
 * The test above passed for a whole round while the defect stood, and the way
 * it managed that is the lesson: it read one stylesheet. The prep menu's
 * CHAPTER tab — the *default* tab, on the path into every chapter — adds
 * `.prepchap__cols .cpanel__snap-cap { white-space: nowrap; text-overflow:
 * ellipsis }` from a different file, which is more specific than the shared
 * rule, so the CHAPTER tab went on printing "Limbo, a thousand y…" and "you
 * don't get anothe…" — Bailey's exact reported string — with this suite green.
 *
 * So this one asks the question the browser asks: across **every stylesheet in
 * the tree**, is the rule that wins on a caption element one that lets it wrap?
 * It stays honest if another track's file changes, which is the point: the
 * caption is shared, and a guard that only watches its own file is not a guard.
 */
describe('no stylesheet in the tree may truncate a polaroid caption', () => {
  const rules = allCssRules().filter((r) => r.selector.includes('.cpanel__snap-cap'));

  const truncates = (body: string): boolean =>
    /white-space:\s*nowrap/.test(body) || /text-overflow:\s*ellipsis/.test(body) || /-webkit-line-clamp:\s*\d/.test(body);
  const resets = (body: string): boolean =>
    /white-space:\s*normal/.test(body) && /text-overflow:\s*clip/.test(body);

  it('has a reset in the shared stylesheet that outranks every truncating rule', () => {
    const guards = rules.filter((r) => resets(r.body));
    expect(guards.map((g) => g.file)).toContain('ui/common/chapter-panel.css');
    const strongest = Math.max(...guards.map((g) => classWeight(g.selector)));

    for (const rule of rules.filter((r) => truncates(r.body))) {
      // A truncating rule may exist — it is another track's file and this track
      // may not edit it — but it must lose.
      expect(
        classWeight(rule.selector),
        `${rule.file} — "${rule.selector}" truncates a caption at weight ${classWeight(rule.selector)}, ` +
          `which the shared reset (weight ${strongest}) does not outrank`,
      ).toBeLessThan(strongest);
      expect(rule.body, `${rule.file} — "${rule.selector}" truncates a caption with !important`).not.toContain(
        '!important',
      );
    }
  });

  it('reaches both grounds: the pause screen has no .cpanel__snaps wrapper', () => {
    // The pause screen lifts the bare <figure>s out of the dossier and lays
    // them out itself, so a guard hung off `.cpanel__snaps` would silently miss
    // the screen the round was about. `.cpanel__snap` is on both.
    const guard = rules.find((r) => resets(r.body) && r.file === 'ui/common/chapter-panel.css');
    expect(guard?.selector).toContain('.cpanel__snap ');
    expect(guard?.selector).not.toContain('.cpanel__snaps ');
  });
});
