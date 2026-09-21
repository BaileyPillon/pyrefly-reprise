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

describe('pause-screen.css is authored for a window, not for a 640x360 stage', () => {
  const sheet = css('pause-screen.css');

  it('mounts the layer at viewport level', () => {
    // `absolute` was the bars: the layer only covered the letterboxed stage.
    expect(/\.pause \{[^}]*position: fixed;/s.test(sheet)).toBe(true);
    expect(/\.pause \{[^}]*inset: 0;/s.test(sheet)).toBe(true);
  });

  it('declares no font-size a player could not read', () => {
    const tiny: string[] = [];
    for (const m of sheet.matchAll(/font-size:\s*([^;]+);/g)) {
      const decl = m[1]!;
      // Anything fluid is bounded by its own clamp floor, which the next test
      // checks; a bare literal is the thing that went wrong here.
      if (/var\(|clamp\(|max\(|inherit|1em/.test(decl)) continue;
      const px = Number.parseFloat(decl);
      if (Number.isFinite(px) && px < 14) tiny.push(decl.trim());
    }
    // The battle chip is the one survivor: it is battle chrome, sized in device
    // px against the HUD, and is not part of this screen's type.
    expect(tiny).toEqual(['12px']);
  });

  it('floors every clamp()ed type token at 14px', () => {
    const floors = [...sheet.matchAll(/--pause-fs-[a-z-]+:\s*clamp\(([\d.]+)px/g)].map((m) =>
      Number.parseFloat(m[1]!),
    );
    expect(floors.length).toBeGreaterThanOrEqual(8);
    expect(Math.min(...floors)).toBeGreaterThanOrEqual(14);
  });

  it('never blurs the painting, and stops drifting for prefers-reduced-motion', () => {
    const art = /\.pause__art-img \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    expect(art).toContain('object-fit: cover');
    expect(art).not.toMatch(/filter:[^;]*blur\(/);
    expect(sheet).toContain('@keyframes pause-art-drift');
    // The reduced-motion block is last in the file, so everything after its
    // `@media` line is it.
    const reduced = sheet.slice(sheet.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/\.pause__art-img \{\s*animation: none;/);
  });
});

/*
 * ------------------------------------------------------------ the party card
 *
 * `2420/2420` printed through the gold OD gauge, and `Kimahri` came out as
 * `Kima…`, on every window between 721 and ~1100 CSS px wide — 1024x768 and
 * 800x600, the 4:3 aspect the brief names. The first pass "fixed" it inside a
 * `max-width: 720px` query, which moved the defect rather than removing it.
 *
 * The root cause is one declaration: `min-width: 0` on a flex item, which
 * overrides the automatic minimum size that would otherwise stop a card
 * shrinking past its own contents. It is invisible in a screenshot at the size
 * the author happened to test, so it is pinned here as a declaration.
 */
describe('a party card is never narrower than the numbers inside it', () => {
  // Comments out: this file explains itself in prose, and the prose quotes the
  // very declarations these tests are asserting are gone.
  const sheet = css('pause-screen.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const block = (selector: string): string => {
    const at = sheet.indexOf(`\n${selector} {`);
    return at < 0 ? '' : sheet.slice(at, sheet.indexOf('\n}', at));
  };

  it('does not zero the automatic minimum size of the card or its body', () => {
    expect(block('.pause__card')).not.toMatch(/min-width:\s*0/);
    expect(block('.pause__card-body')).not.toMatch(/min-width:\s*0/);
  });

  /*
   * Flex lines are collected on the hypothetical main size — the basis clamped
   * by min and max — so with the automatic minimum left alone a basis of 0 both
   * wraps honestly *and* lets three cards grow into a rail that has room for
   * three. `flex: 1 1 auto` broke the second half of that at 2000x1012.
   */
  it('lets a card that will not fit take a new row instead of shrinking', () => {
    expect(block('.pause__card')).toMatch(/flex:\s*1 1 0/);
    expect(block('.pause__party')).toMatch(/flex-wrap:\s*wrap/);
  });

  it('keeps a full HP pair on one line, which is why the width has to give', () => {
    expect(block('.pause__card-nums > span')).toMatch(/white-space:\s*nowrap/);
  });

  /*
   * The other half of the same rule, and the one the third pass caught.
   *
   * A flex item's automatic minimum size is itself clamped by `max-width`, so a
   * cap below what the card holds does not make the card wrap — it makes the
   * card overflow. At 800x600 the old 150px floor gave `scrollWidth` 154 against
   * `clientWidth` 147 on all three cards and the OD gauge painted past the
   * border. 168 is the measured need plus headroom; anything under about 160
   * puts the defect back.
   */
  it('caps a card no tighter than its own contents at the type floor', () => {
    const cap = /max-width:\s*clamp\((\d+)px,/.exec(block('.pause__card'));
    expect(cap).not.toBeNull();
    expect(Number(cap![1])).toBeGreaterThanOrEqual(160);
  });
});

/*
 * ------------------------------------------------------------------ the rail
 *
 * At 800x600 the Seymour quote was printed straight across MUSIC PLAYER,
 * CHAPTER SELECT and QUIT TO TITLE — rows the cursor could still land on and
 * activate. Grid areas are allowed to overlap and an `end`-aligned item in a
 * collapsed `1fr` row lays itself out *upwards* out of that row, so the three
 * slabs of the left column could stack on each other. Flex items cannot.
 */
describe('the left column cannot print one slab over another', () => {
  const sheet = css('pause-screen.css');

  it('is one grid area holding one flex column', () => {
    const frame = /\n\.pause__frame \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    expect(frame).toContain("'rail  panel'");
    // The three-area version is what allowed the overlap.
    expect(frame).not.toMatch(/'menu\s+panel'/);
    const rail = /\n\.pause__rail \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    expect(rail).toMatch(/display:\s*flex/);
    expect(rail).toMatch(/flex-direction:\s*column/);
    expect(rail).toMatch(/min-height:\s*0/);
  });

  it('hangs the quote with an auto margin, never with grid end-alignment', () => {
    const quote = /\n\.pause__quote \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    expect(quote).toMatch(/margin-top:\s*auto/);
    expect(quote).not.toMatch(/align-self:\s*end/);
    expect(quote).not.toMatch(/grid-area/);
  });

  it('folds on height as well as on width', () => {
    // 800x600 is not narrow by any width test and has nowhere near the room.
    expect(sheet).toMatch(/@media \(max-height: \d+px\)/);
    const short = sheet.slice(sheet.indexOf('@media (max-height:'));
    expect(short).toContain('.pause__quote,');
    expect(short).toContain('display: none;');
  });

  it('scrolls the menu rather than pushing a row off the window', () => {
    const menu = /\n\.pause__menu \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    expect(menu).toMatch(/overflow-y:\s*auto/);
    expect(menu).toMatch(/min-height:\s*0/);
  });
});

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
