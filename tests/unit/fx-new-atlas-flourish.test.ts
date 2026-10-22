/**
 * The painted finish's four atlas tiles and the livelier item toss (motion pass, lane "fx"; Bailey 2026-10-22). No GPU, no page: the atlas is read as pixels, the toss is driven with a stand-in light.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { ATLAS_SIZE, TILES, atlasPixels } from '../../src/engine/spellfx/FxAtlas.ts';
import { OrbFlourish } from '../../src/engine/fx/ItemOrbFlourish.ts';
import { fxShare } from '../../src/engine/spellfx/FxPerfGuard.ts';
import type { FxTile } from '../../src/engine/spellfx/FxDrawList.ts';
import { Scene, Sprite } from 'three';

afterEach(() => {
  fxShare.particles = fxShare.trails = 1;
});

const EXTRA: FxTile[] = ['streak', 'facet', 'dab', 'dim'];
const LIVE = (Object.keys(TILES) as FxTile[]).filter((t) => !TILES[t].extra);

/** Alpha (0..255) of a tile at (x, y) in -1..1, y up. */
function alphaAt(px: Uint8Array, tile: FxTile, x: number, y: number): number {
  const i = TILES[tile].index;
  const ox = (i % 4) * 128;
  const oy = Math.floor(i / 4) * 128;
  const cx = Math.min(127, Math.max(0, Math.floor(((x + 1) / 2) * 128)));
  const cy = Math.min(127, Math.max(0, Math.floor(((y + 1) / 2) * 128)));
  return px[((oy + cy) * ATLAS_SIZE + ox + cx) * 4 + 3]!;
}

function tileBytes(px: Uint8Array, tile: FxTile): Uint8Array {
  const i = TILES[tile].index;
  const ox = (i % 4) * 128;
  const oy = Math.floor(i / 4) * 128;
  const out = new Uint8Array(128 * 128 * 4);
  for (let j = 0; j < 128; j++) out.set(px.subarray(((oy + j) * ATLAS_SIZE + ox) * 4, ((oy + j) * ATLAS_SIZE + ox + 128) * 4), j * 128 * 4);
  return out;
}

describe('the atlas', () => {
  const plain = atlasPixels();
  const painted = atlasPixels(true);

  it('the live game\'s atlas is untouched: the ten tiles are the same bytes with or without the painted finish\'s, and the four extra tiles are empty without it', () => {
    expect(plain.length).toBe(ATLAS_SIZE * ATLAS_SIZE * 4);
    for (const t of LIVE) expect(Buffer.compare(Buffer.from(tileBytes(plain, t)), Buffer.from(tileBytes(painted, t))), t).toBe(0);
    for (const t of EXTRA) {
      expect(TILES[t].extra, t).toBe(true);
      expect(tileBytes(plain, t).every((b) => b === 0), `${t} empty in the live atlas`).toBe(true);
      expect(tileBytes(painted, t).some((b) => b > 0), `${t} drawn in the painted one`).toBe(true);
    }
    expect(LIVE).toHaveLength(10);
  });

  it('streak: a bright round head at +x, a tail that thins to a point at -x', () => {
    expect(alphaAt(painted, 'streak', 0.72, 0)).toBeGreaterThan(200);
    expect(alphaAt(painted, 'streak', -0.1, 0)).toBeGreaterThan(40);
    expect(alphaAt(painted, 'streak', -0.9, 0)).toBeLessThan(alphaAt(painted, 'streak', 0.3, 0));
    expect(alphaAt(painted, 'streak', 0.3, 0.6)).toBe(0); // thin: nothing far to the side
    expect(alphaAt(painted, 'streak', 0.99, 0)).toBe(0);
  });

  it('facet: a diamond pointing up, widest below its middle, lighter on its right', () => {
    expect(alphaAt(painted, 'facet', 0, -0.3)).toBeGreaterThan(150);
    expect(alphaAt(painted, 'facet', 0.3, -0.3)).toBeGreaterThan(0);
    expect(alphaAt(painted, 'facet', 0.3, 0.8)).toBe(0); // the tip is narrow
    expect(alphaAt(painted, 'facet', 0.5, 0)).toBe(0);
    const i = TILES.facet.index;
    const px = (x: number): number => painted[((Math.floor(i / 4) * 128 + 50) * ATLAS_SIZE + (i % 4) * 128 + x) * 4]!; // the R channel (whiteness) at a row
    expect(px(64 + 12)).toBeGreaterThan(px(64 - 12));
  });

  it('dab is an uneven round blob and dim is clear in the middle and dark at the edge', () => {
    expect(alphaAt(painted, 'dab', 0, 0)).toBeGreaterThan(200);
    expect(alphaAt(painted, 'dab', 0.95, 0.95)).toBe(0);
    expect(alphaAt(painted, 'dim', 0, 0)).toBe(0);
    expect(alphaAt(painted, 'dim', 0.1, 0.1)).toBe(0);
    expect(alphaAt(painted, 'dim', 0.95, 0)).toBeGreaterThan(150);
    expect(alphaAt(painted, 'dim', 0.6, 0)).toBeGreaterThan(alphaAt(painted, 'dim', 0.4, 0));
  });
});

/** A stand-in for the item light: its phase and where the orb is. */
function light(): { phase: string; orbAt: { x: number; y: number; z: number }; lightNow: { tone: string; k: number } } {
  return { phase: 'rest', orbAt: { x: 0, y: 1, z: 0 }, lightNow: { tone: 'heal', k: 1 } };
}

const visible = (f: OrbFlourish): Sprite[] => f.group.children.filter((c): c is Sprite => c instanceof Sprite && c.visible);

describe('the livelier item toss', () => {
  const dt = 1 / 120;

  it('draws a comet trail behind the FFX orb in flight, and none behind FFX-2\'s spark', () => {
    for (const [tone, expectTrail] of [['heal', true], ['spark', false]] as const) {
      const f = new OrbFlourish();
      const fx = light();
      const scene = new Scene();
      fx.phase = 'flight';
      fx.lightNow.tone = tone;
      for (let i = 0; i < 60; i++) {
        fx.orbAt = { x: i * 0.01, y: 1 + Math.sin(i * 0.05) * 0.1, z: 0 };
        f.update(dt, fx as never, scene);
      }
      expect(visible(f).length > 0, tone).toBe(expectTrail);
      if (expectTrail) {
        const s = visible(f);
        expect(s.length).toBeGreaterThan(5);
        const sizes = s.map((x) => x.scale.x);
        expect(Math.max(...sizes)).toBeGreaterThan(0);
        expect(s.every((x) => x.material.opacity > 0)).toBe(true);
      }
      f.dispose();
    }
  });

  it('bursts with rings, a ground ripple, eased sparks and dabs when the light lands, then puts itself away', () => {
    const f = new OrbFlourish();
    const fx = light();
    const scene = new Scene();
    fx.phase = 'flight';
    f.update(dt, fx as never, scene);
    fx.phase = 'burst';
    fx.orbAt = { x: 2, y: 1, z: 0 };
    f.update(dt, fx as never, scene);
    for (let i = 0; i < 12; i++) f.update(dt, fx as never, scene);
    const early = visible(f);
    expect(early.length).toBeGreaterThan(10); // two rings, a ripple, the sparks and dabs
    const widest = (): number => Math.max(...visible(f).map((s) => s.scale.x));
    const w1 = widest();
    for (let i = 0; i < 30; i++) f.update(dt, fx as never, scene);
    const w2 = widest();
    for (let i = 0; i < 30; i++) f.update(dt, fx as never, scene);
    const w3 = widest();
    // the rings burst out fast and settle: the first stretch grows more than the second
    expect(w2).toBeGreaterThan(w1);
    expect(w3 - w2).toBeLessThan(w2 - w1);
    // the ground ripple is flat
    expect(visible(f).some((s) => s.scale.y < s.scale.x * 0.4)).toBe(true);
    for (let i = 0; i < 120; i++) f.update(dt, fx as never, scene);
    expect(f.active).toBe(false);
    expect(visible(f)).toHaveLength(0);
    f.dispose();
  });

  it('FFX-2\'s self-use spark (sparkle then burst) bursts too, and the guard thins the sparks before the trail', () => {
    const count = (share: number): number => {
      fxShare.particles = share;
      const f = new OrbFlourish();
      const fx = light();
      fx.lightNow.tone = 'spark';
      const scene = new Scene();
      fx.phase = 'sparkle';
      f.update(dt, fx as never, scene);
      fx.phase = 'burst';
      f.update(dt, fx as never, scene);
      for (let i = 0; i < 6; i++) f.update(dt, fx as never, scene);
      const n = visible(f).length;
      f.dispose();
      return n;
    };
    const full = count(1);
    expect(full).toBeGreaterThan(10);
    expect(count(0.25)).toBeLessThan(full);
  });

  it('is deterministic and hide() puts everything away', () => {
    const run = (): string => {
      const f = new OrbFlourish();
      const fx = light();
      const scene = new Scene();
      fx.phase = 'flight';
      f.update(dt, fx as never, scene);
      fx.phase = 'burst';
      for (let i = 0; i < 20; i++) f.update(dt, fx as never, scene);
      const out = JSON.stringify(visible(f).map((s) => [Math.round(s.position.x * 1e4), Math.round(s.position.y * 1e4), Math.round(s.scale.x * 1e4)]));
      f.hide();
      expect(visible(f)).toHaveLength(0);
      f.dispose();
      return out;
    };
    expect(run()).toBe(run());
  });
});
