/**
 * The contact shadow follows (`?shadow=follow`; motion program, lane "feel", 2026-10-22; both games; party and bosses): the pure module, and the REAL `PaintedActor` through a
 * lunge and a hop, read from its own scene graph. Today's 0.55 follow is pinned so the default cannot drift.
 */
import { Group, Texture, type Mesh, type MeshBasicMaterial } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIR_FADE, AIR_REF, AIR_SHRINK, GROUND_EPS, LAND_SPREAD, LAND_TAU, ShadowFollow, shadowX } from '../../src/engine/feel/ContactShadow.ts';
import { resetFeelForTests, setFeelChapter } from '../../src/engine/feel/FeelSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import type { PaintedTexture } from '../../src/engine/PaintedArt.ts';

// a canvas the three side never uploads (the painted stand-ins and the shared noise, blob and ring textures need none in a test), as the head-lock fixture does
vi.mock('../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});
const { PaintedActor } = await import('../../src/engine/PaintedActor.ts');

/** A standing figure's painting as the loader hands it, without the art on disk: 400 x 800, feet on row 780. */
const painting = (_subject: string, pose: string): PaintedTexture => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780, scale: 1 }, placeholder: false, url: `/art/characters/test/${pose}.png` });

afterEach(() => {
  resetFeelForTests();
  vi.restoreAllMocks();
});

describe('shadowX', () => {
  it('today: 0.55 of the offset. follow: all of it, except a lying body\'s swing about its feet keeps 0.55', () => {
    expect(shadowX(2, 0, false)).toBeCloseTo(1.1, 12);
    expect(shadowX(2, 0, true)).toBe(2);
    expect(shadowX(-1.4, 0, true)).toBe(-1.4);
    expect(shadowX(2, 0.5, true)).toBeCloseTo(2 - 0.45 * 0.5, 12); // lunge 1.5 + lie 0.5 -> 1.5 + 0.55 * 0.5
    expect(shadowX(2, 0.5, false)).toBeCloseTo(1.1, 12);
  });
});

describe('ShadowFollow', () => {
  const H = 1.82;
  it('is 1 and 1 at rest, on the ground, forever', () => {
    const s = new ShadowFollow();
    for (let i = 0; i < 120; i++) expect(s.step(1 / 60, 0, H)).toEqual({ radius: 1, opacity: 1 });
    const hair = s.step(1 / 60, H * GROUND_EPS * 0.9, H); // a hair off the floor: a hair of change, no step
    expect(hair.radius).toBeGreaterThan(0.995);
    expect(hair.opacity).toBeGreaterThan(0.995);
  });

  it('shrinks and fades with the height off the ground, all the way at the reference height, smoothly', () => {
    const s = new ShadowFollow();
    const full = s.step(1 / 60, AIR_REF * H, H);
    expect(full.radius).toBeCloseTo(1 - AIR_SHRINK, 9);
    expect(full.opacity).toBeCloseTo(1 - AIR_FADE, 9);
    const above = s.step(1 / 60, 3 * H, H);
    expect(above).toEqual(full); // no further
    let last = 1;
    for (let lift = 0; lift <= AIR_REF * H; lift += 0.005) {
      const r = new ShadowFollow().step(1 / 60, lift, H).radius;
      expect(r).toBeLessThanOrEqual(last + 1e-12); // monotone
      last = r;
    }
  });

  it('spreads when the figure comes down (up to LAND_SPREAD), thinner while it spreads, and settles back within a tenth of a second', () => {
    const s = new ShadowFollow();
    // a hop: rise 0.3 s, fall 0.3 s, at 60 Hz, 0.5 units
    let landed = -1;
    let peakSpread = 0;
    for (let i = 0; i < 80; i++) {
      const t = i / 60;
      const lift = t < 0.6 ? Math.sin((Math.PI * t) / 0.6) * 0.5 : 0;
      const m = s.step(1 / 60, lift, H);
      if (lift === 0 && t >= 0.6 && landed < 0) landed = i;
      if (landed >= 0) peakSpread = Math.max(peakSpread, m.radius - 1);
    }
    expect(peakSpread).toBeGreaterThan(0.05);
    expect(peakSpread).toBeLessThanOrEqual(LAND_SPREAD + 1e-9);
    const after = new ShadowFollow();
    after.step(1 / 60, 0.5, H);
    const land = after.step(1 / 60, 0, H);
    expect(land.radius).toBeGreaterThan(1);
    expect(land.opacity).toBeLessThan(1);
    let m = land;
    for (let i = 0; i < 8; i++) m = after.step(1 / 60, 0, H); // 133 ms
    expect(m.radius - 1).toBeLessThan((LAND_SPREAD * Math.exp(-0.1 / LAND_TAU)) * 1.2);
    for (let i = 0; i < 40; i++) m = after.step(1 / 60, 0, H);
    expect(m).toEqual({ radius: 1, opacity: 1 });
  });

  it('a small hop lands with a quarter of the spread at least; a bigger one with more', () => {
    const small = new ShadowFollow();
    small.step(1 / 60, 0.03, H);
    const a = small.step(1 / 60, 0, H).radius - 1;
    const big = new ShadowFollow();
    big.step(1 / 60, 0.5, H);
    const b = big.step(1 / 60, 0, H).radius - 1;
    expect(a).toBeGreaterThanOrEqual(LAND_SPREAD * 0.25 - 1e-9);
    expect(b).toBeGreaterThan(a);
  });

  it('is on field time: 60 and 144 Hz agree on the spread a given time after landing, and a hit-stop (dt 0) holds it', () => {
    const after = (hz: number, ms: number): number => {
      const s = new ShadowFollow();
      s.step(1 / hz, 0.4, H);
      s.step(1 / hz, 0, H); // the landing frame
      let t = 1 / hz;
      let m = s.step(0, 0, H);
      while (t * 1000 < ms - 1e-6) {
        m = s.step(1 / hz, 0, H);
        t += 1 / hz;
      }
      return m.radius - 1;
    };
    const a = after(60, 66.67);
    const b = after(144, 66.67);
    expect(Math.abs(a - b)).toBeLessThan(0.012);
    const held = new ShadowFollow();
    held.step(1 / 60, 0.4, H);
    const first = held.step(1 / 60, 0, H).radius;
    for (let i = 0; i < 5; i++) expect(held.step(0, 0, H).radius).toBe(first);
  });
});

// ------------------------------------------------------------------ the real actor

/** A party figure WITH a contact shadow (the head-lock fixture builds its Yuna without one). */
function figure(): InstanceType<typeof PaintedActor> {
  const actor = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', life: false, interimYaw: false, breathe: false, sway: false, shadow: {} });
  const poses: Record<string, PaintedTexture> = { idle: painting('yuna', 'idle') };
  actor.adoptPoses(poses, 'idle');
  actor.position.set(-2, 0, 0);
  return actor;
}
const shadowOf = (a: Group): Mesh => a.getObjectByName('contact-shadow') as Mesh;
const innerX = (a: InstanceType<typeof PaintedActor>): number => (a as unknown as { inner: Group }).inner.position.x;

describe('on the real actor, through a lunge and a hop', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    setPaceGame('other');
    setPace('current');
  });
  afterEach(() => setPace('steady'));

  it('today the shadow trails the lunge at 0.55; with follow it is under the figure (x equal) at every frame, party', () => {
    for (const follow of [false, true]) {
      resetFeelForTests(follow ? '?shadow=follow' : '?pack=off'); // r64: with no word at all the demo chapters follow
      setFeelChapter('seymour-flux');
      const a = figure();
      const sh = shadowOf(a);
      for (let i = 0; i < 3; i++) a.update(1 / 60);
      void a.lunge(2.4, 440);
      let worst = 0;
      let furthest = 0;
      for (let i = 0; i < 40; i++) {
        a.update(1 / 60);
        const off = innerX(a);
        furthest = Math.max(furthest, off);
        worst = Math.max(worst, Math.abs(sh.position.x - off));
        if (!follow) expect(sh.position.x).toBeCloseTo(off * 0.55, 9);
      }
      expect(furthest).toBeGreaterThan(2); // it really lunged
      if (follow) expect(worst).toBeLessThan(1e-9);
      else expect(worst).toBeGreaterThan(0.9); // today's trail: a metre behind the boots
    }
  });

  it('is under the boots through a recoil and a lean too, and not in another chapter', () => {
    resetFeelForTests('?pack=demo');
    setFeelChapter('yunalesca'); // not a demo chapter: the pack changes nothing
    const a = figure();
    for (let i = 0; i < 3; i++) a.update(1 / 60);
    void a.recoil(360, 0.34);
    for (let i = 0; i < 6; i++) a.update(1 / 60);
    expect(shadowOf(a).position.x).toBeCloseTo(innerX(a) * 0.55, 9);
    setFeelChapter('ffx2-bahamut');
    a.update(1 / 60);
    expect(shadowOf(a).position.x).toBeCloseTo(innerX(a), 9);
  });

  it('shrinks and fades while the figure hops, and spreads when it lands, and is exactly the resting shadow before and after', () => {
    resetFeelForTests('?shadow=follow');
    setFeelChapter('ffx2-bahamut');
    const a = figure();
    for (let i = 0; i < 3; i++) a.update(1 / 60);
    const rest = { sx: shadowOf(a).scale.x, op: (shadowOf(a).material as MeshBasicMaterial).opacity };
    void a.hop(0.7, 360);
    let minR = Infinity;
    let minO = Infinity;
    let maxR = 0;
    let landed = false;
    for (let i = 0; i < 45; i++) {
      a.update(1 / 60);
      const r = shadowOf(a).scale.x;
      const o = (shadowOf(a).material as MeshBasicMaterial).opacity;
      minR = Math.min(minR, r);
      minO = Math.min(minO, o);
      if (i > 20) maxR = Math.max(maxR, r);
      if (i > 22) landed = true;
    }
    expect(landed).toBe(true);
    expect(minR).toBeLessThan(rest.sx * 0.75); // it shrank in the air
    expect(minO).toBeLessThan(rest.op * 0.7); // and faded
    expect(maxR).toBeGreaterThan(rest.sx * 1.02); // and spread on landing
    for (let i = 0; i < 30; i++) a.update(1 / 60);
    expect(shadowOf(a).scale.x).toBeCloseTo(rest.sx, 9);
    expect((shadowOf(a).material as MeshBasicMaterial).opacity).toBeCloseTo(rest.op, 9);
  });

  it('the shadow does not shrink for a steady hover: only for what leaves the ground (a hovering boss keeps its resting shadow)', () => {
    resetFeelForTests('?shadow=follow');
    setFeelChapter('seymour-flux');
    const hovering = new PaintedActor({ name: 'flux', worldHeight: 4.1, side: 'enemy', life: false, interimYaw: false, breathe: false, sway: false, shadow: {}, hover: { height: 0.8, bobAmplitude: 0 } });
    hovering.adoptPoses({ idle: painting('yuna', 'idle') }, 'idle');
    hovering.update(1 / 60);
    const follow = shadowOf(hovering).scale.x;
    resetFeelForTests('?shadow=today');
    setFeelChapter('seymour-flux');
    hovering.update(1 / 60);
    expect(shadowOf(hovering).scale.x).toBeCloseTo(follow, 9);
  });
});
