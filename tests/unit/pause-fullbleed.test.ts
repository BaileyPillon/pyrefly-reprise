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

import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    expect(sheet).not.toMatch(/^\s*-webkit-line-clamp:/m);
    const cap = /\.cpanel__snap-cap \{(.*?)\n\}/s.exec(sheet)?.[1] ?? '';
    expect(cap).not.toContain('text-overflow: ellipsis');
    expect(cap).toContain('overflow-wrap: break-word');
  });
});
