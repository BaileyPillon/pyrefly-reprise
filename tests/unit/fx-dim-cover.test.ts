/**
 * The dim covers the view (r64; both games, shared spell-effect plumbing; the trailer lane's finding on the live build r63): the `dim` tile is 95 % dark from its radius to its edge, and a 1700-wide square of it centred
 * on a target near one side of the frame used to leave its far edge in the picture as a hard-edged dark rectangle (Bahamut's Curse on Yuna, Bahamut gathering Mega Flare, Chapter I's Lance of Atrophy and Full-Life).
 * The rule: every dim an effect draws is a COVER quad, so the pixels it fills are the whole view whatever the target's place, the look inside the old square is the tile's own, and outside it the rim is held (no step).
 * No GPU, no page: the rule is `FxCover.ts`, the draw list and the atlas are read as data; one source check keeps the shader (`FxBatch.ts`) paired with the flag.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ATLAS_SIZE, TILES, atlasPixels } from '../../src/engine/spellfx/FxAtlas.ts';
import { COVER, clampUv, coversView, filledRect, isCover, tileUv } from '../../src/engine/spellfx/FxCover.ts';
import { FxDrawList, type FxItem } from '../../src/engine/spellfx/FxDrawList.ts';
import { targetFromRect } from '../../src/engine/spellfx/effects-shared.ts';
import { FRESH_SPECS } from '../../src/engine/spellfx/SpellFxFresh.ts';
import { specOf, type FreshFxId } from '../../src/engine/spellfx/SpellFxTimeline.ts';
import { DEFAULT_FLASH_PARAMS } from '../../src/engine/spellfx/SpellFxParams.ts';
import type { FxGame } from '../../src/engine/spellfx/SpellFxRegistry.ts';

/** The viewports the demo meets: a phone held upright, the 1600x900 plate, full HD, 1440p, and a wide window. */
const VIEWS = [
  { w: 390, h: 844 },
  { w: 1600, h: 900 },
  { w: 1920, h: 1080 },
  { w: 2560, h: 1440 },
  { w: 3440, h: 1440 },
];

/** `SpellFxLayer.update`'s scale: the view over the 1600x900 plate, held to 0.45..1.5. */
const kOf = (v: { w: number; h: number }): number => Math.max(0.45, Math.min(1.5, Math.min(v.w / 1600, v.h / 900)));

const IDS = Object.keys(FRESH_SPECS) as FreshFxId[];

/** Every dim item one effect draws over its whole run, for a figure of this size standing with its centre at (fx, fy) of the view. */
function dimsOf(id: FreshFxId, game: FxGame, view: { w: number; h: number }, fx: number, fy: number, variant = ''): FxItem[] {
  const spec = specOf(id, true);
  const k = kOf(view);
  const h = view.h * 0.3;
  const T = targetFromRect({ x: fx - h * 0.2, y: fy - h / 2, w: h * 0.4, h }, k);
  const out: FxItem[] = [];
  for (let t = spec.startAt; t <= spec.end; t += 1 / 15) {
    const o = new FxDrawList(game, 1, DEFAULT_FLASH_PARAMS);
    o.paint = 1;
    o.variant = variant;
    o.begin();
    spec.draw(o, t, T);
    out.push(...o.items.filter((i) => i.tile === 'dim'));
  }
  return out;
}

describe('the dim covers the view', () => {
  it('FxDrawList.dim draws the dim tile as a cover quad, and nothing at an alpha nobody can see', () => {
    const o = new FxDrawList('ffx2', 1, DEFAULT_FLASH_PARAMS);
    o.begin();
    o.dim('#0A0414', 300, 800, 1700, 1700, 0.7);
    o.dim('#0A0414', 300, 800, 1700, 1700, 0.001);
    o.dim('#0A0414', 300, 800, 0, 1700, 0.7);
    expect(o.items).toHaveLength(1);
    const it = o.items[0]!;
    expect(it.tile).toBe('dim');
    expect(it.shape).toBe(0);
    expect(it.rot).toBe(0);
    expect(it.p[0]).toBe(COVER);
    expect(isCover(it)).toBe(true);
  });

  it('a cover quad fills the whole view; a plain quad only its own rectangle', () => {
    const view = { w: 1920, h: 1080 };
    const cover: FxItem = { layer: 0, shape: 0, tile: 'dim', x: 300, y: 800, w: 1700, h: 1700, rot: 0, col: [0, 0, 0], a: 0.7, p: [COVER, 0, 0, 0] };
    const plain: FxItem = { ...cover, p: [0, 0, 0, 0] };
    expect(filledRect(cover, view)).toEqual({ x0: 0, y0: 0, x1: 1920, y1: 1080 });
    expect(coversView(cover, view)).toBe(true);
    expect(filledRect(plain, view)).toEqual({ x0: -550, y0: -50, x1: 1150, y1: 1650 });
    expect(coversView(plain, view)).toBe(false); // the old square: its right edge at 1150 of 1920 stood in the picture
    expect(isCover({ ...cover, shape: 1 })).toBe(false); // a ring's p[0] is its radius, never a cover flag
  });

  it('every dim in every effect, both games, at every viewport and every place of the target, covers the view', () => {
    let seen = 0;
    const effects = new Set<string>();
    for (const id of IDS) {
      for (const game of ['ffx', 'ffx2'] as const) {
        for (const view of VIEWS) {
          for (const px of [0.08, 0.3, 0.5, 0.7, 0.92]) {
            for (const py of [0.3, 0.6]) {
              for (const i of dimsOf(id, game, view, view.w * px, view.h * py, id === 'gather' ? '4' : '')) {
                seen++;
                effects.add(`${id}/${game}`);
                expect(isCover(i), `${id} ${game} ${view.w}x${view.h} at ${px},${py}`).toBe(true);
                expect(coversView(i, view)).toBe(true);
              }
            }
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(500);
    // the effects that draw a dim: Chapter I's (Lance of Atrophy, Total Annihilation, Full-Life, Slowga, Drain, FFX Cure) and Chapter IV's (Curse, the charge's gather, Banish's dark)
    for (const id of ['atrophy', 'annihilate', 'fulllife', 'slowga', 'drain', 'curse', 'gather', 'cure']) expect([...effects].some((e) => e.startsWith(`${id}/`)), id).toBe(true);
  });

  it('no effect names the dim tile any other way: a bare quad of it would bring the hard edge back', () => {
    for (const f of ['bahamut', 'cure', 'flux', 'spirit']) {
      const src = readFileSync(new URL(`../../src/engine/spellfx/effects-painted-${f}.ts`, import.meta.url), 'utf8');
      expect(src.includes("'dim'"), `effects-painted-${f}.ts`).toBe(false);
    }
  });

  it('the lookup inside the old square is the ordinary one, and outside it is held to the rim', () => {
    const q = { x: 300, y: 800, w: 1700, h: 1700 };
    expect(tileUv(q, 300, 800)).toEqual([0.5, 0.5]); // the centre
    expect(tileUv(q, 300 - 850, 800)[0]).toBeCloseTo(0, 10); // the left rim
    expect(tileUv(q, 300 + 850, 800)[0]).toBeCloseTo(1, 10);
    expect(tileUv(q, 300, 800 - 850)[1]).toBeCloseTo(1, 10); // v is up: the top rim is 1
    expect(tileUv(q, 300, 800 + 850)[1]).toBeCloseTo(0, 10);
    // the far side of the frame, 1620 px right of the target and well past the square's edge at x = 1150
    const out = tileUv(q, 1920, 500);
    expect(out[0]).toBeGreaterThan(1);
    expect(clampUv(out)[0]).toBe(1);
    expect(clampUv([-3, 0.4])).toEqual([0, 0.4]);
    expect(clampUv([0.3, 0.4])).toEqual([0.3, 0.4]);
  });

  it('the dim tile\'s rim is one flat value and its darkest, so holding it past the edge leaves no step', () => {
    const px = atlasPixels(true);
    const i = TILES.dim.index;
    const ox = (i % 4) * 128;
    const oy = Math.floor(i / 4) * 128;
    const a = (x: number, y: number): number => px[((oy + y) * ATLAS_SIZE + ox + x) * 4 + 3]!;
    let max = 0;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) max = Math.max(max, a(x, y));
    expect(max).toBeGreaterThan(230);
    for (let n = 0; n < 128; n++) {
      // the texel the shader reads at uv 0 and uv 1 (the half-texel inset keeps it inside the tile), on all four rims
      for (const [x, y] of [[1, n], [126, n], [n, 1], [n, 126]] as const) expect(a(x, y), `rim ${x},${y}`).toBeGreaterThanOrEqual(max * 0.9); // the clamp itself is continuous (the held texel is the one the square already reached); the rim's own dip near a side's midpoint (radius 0.98) is a few levels
    }
  });

  it('the shader is paired with the flag: the vertex stage fills the view for a cover quad and the fragment stage clamps the lookup', () => {
    const src = readFileSync(new URL('../../src/engine/spellfx/FxBatch.ts', import.meta.url), 'utf8');
    expect(src).toContain('iB.z < 0.5 && iP.x > 0.5');
    expect(src).toContain('gl_Position = vec4(position.x * 2.0, position.y * 2.0, 0.0, 1.0);');
    expect(src).toContain('vec2 uv = clamp(vUv, 0.0, 1.0);');
  });
});
