/**
 * Pass 2's light (`AnimFx.ts`, `RigAnimLayer.ts`; `?anim=proto&style=P2`; both games, presentation only): no vial, no bottle: a glow that gathers at the hand and grows with the clip's glow level, an orb that
 * is tossed to an ally on an arc with a trail and bursts into sparkles on it, glow particles that rise around the user, a flash-out ring on a cast's release. The state machine is exercised with no
 * canvas (textures are null in a unit test) and through the real actor with a stand-in painting.
 */
import { Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { AnimFx } = await import('../../../src/engine/rig/anim/AnimFx.ts');
const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { STYLE_B, STYLE_P2 } = await import('../../../src/engine/rig/anim/AnimStyles.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
type RigFileT = import('../../../src/data/art/rigTypes.ts').RigFile;
type StyleT = import('../../../src/engine/rig/anim/AnimStyles.ts').AnimStyle;
type FxT = import('../../../src/engine/rig/anim/AnimFx.ts').AnimFx;

const visible = (fx: FxT): number => fx.group.children.filter((c) => c.visible).length;
const step = (fx: FxT, ms: number, dt = 1 / 60): void => {
  for (let t = 0; t < ms - 1e-9; t += dt * 1000) fx.update(dt, null);
};
const HAND = { x: 1, y: 1.2, z: 0 };
const TARGET = { x: -2, y: 1, z: 0 };

describe('the glow at the hand', () => {
  it('draws nothing at level 0 and more as the level grows: the halo, the core, up to ten sparks', () => {
    const fx = new AnimFx();
    fx.gather(HAND, 0, 0, 'item');
    expect(visible(fx)).toBe(0);
    fx.gather(HAND, 0.3, 0, 'item');
    const few = visible(fx);
    fx.gather(HAND, 1.2, 0, 'item');
    expect(visible(fx)).toBeGreaterThan(few);
    expect(visible(fx)).toBeLessThanOrEqual(2 + 10);
    expect(fx.active).toBe(true);
    fx.rest();
    expect(visible(fx)).toBe(0);
  });
  it('an item\'s orb floats above the hand by `lift` (in figure heights), a cast\'s glow sits on the doll', () => {
    const fx = new AnimFx();
    fx.setUnit(1);
    fx.gather(HAND, 1, 0.2, 'item');
    expect(fx.orbAt.y).toBeCloseTo(HAND.y + 0.2, 6);
    fx.gather(HAND, 1, 0, 'cast');
    expect(fx.orbAt.y).toBeCloseTo(HAND.y, 6);
    fx.setUnit(2);
    fx.gather(HAND, 1, 0.2, 'item');
    expect(fx.orbAt.y).toBeCloseTo(HAND.y + 0.4, 6); // sizes are a multiple of the figure's height / 1.8
  });
});

describe('the orb\'s toss', () => {
  it('leaves the hand, arcs to the target (above the straight line), takes the flight time, then bursts and is gone', () => {
    const fx = new AnimFx();
    fx.gather(HAND, 1.1, 0.1, 'item');
    const start = { ...fx.orbAt };
    fx.toss(TARGET, 420);
    expect(fx.flying).toBe(true);
    let peak = -Infinity;
    let t = 0;
    while (fx.flying && t < 2000) {
      fx.update(1 / 60, null);
      t += 1000 / 60;
      const o = fx.orbAt;
      const line = start.y + (TARGET.y - start.y) * ((start.x - o.x) / (start.x - TARGET.x));
      peak = Math.max(peak, o.y - line);
    }
    expect(t).toBeGreaterThan(380);
    expect(t).toBeLessThan(480);
    expect(peak).toBeGreaterThan(0.05); // the arc
    step(fx, 1200);
    expect(fx.flying).toBe(false);
    expect(visible(fx)).toBe(0);
    expect(fx.active).toBe(false);
  });
  it('a trail follows the orb in flight and the burst shows sparkles for a moment (more things on screen than the orb alone)', () => {
    const fx = new AnimFx();
    fx.gather(HAND, 1.1, 0.1, 'item');
    fx.toss(TARGET, 400);
    step(fx, 200);
    expect(visible(fx)).toBeGreaterThan(4); // halo, core and a trail
    step(fx, 230);
    const bursting = visible(fx);
    expect(bursting).toBeGreaterThan(8); // flash, ring, the bits
  });
  it('is deterministic: two runs put the same things in the same places', () => {
    const run = (): number[] => {
      const fx = new AnimFx();
      fx.gather(HAND, 1, 0.1, 'item');
      fx.toss(TARGET, 400);
      step(fx, 500);
      return fx.group.children.flatMap((c) => [c.position.x, c.position.y, c.scale.x, c.visible ? 1 : 0]);
    };
    expect(run()).toEqual(run());
  });
});

describe('the other light', () => {
  it('a cast\'s release flashes out: a bloom and a ring that open and are gone in under half a second', () => {
    const fx = new AnimFx();
    fx.flashOut(HAND, 'cast');
    step(fx, 100);
    expect(visible(fx)).toBeGreaterThanOrEqual(2);
    step(fx, 400);
    expect(visible(fx)).toBe(0);
  });
  it('glow particles rise around the user over a second and a half and are gone', () => {
    const fx = new AnimFx();
    fx.aura({ x: 0, y: 0, z: 0 }, 1.8);
    step(fx, 700);
    expect(visible(fx)).toBeGreaterThan(5);
    let maxY = 0;
    for (const c of fx.group.children) if (c.visible) maxY = Math.max(maxY, c.position.y);
    expect(maxY).toBeGreaterThan(0.3);
    step(fx, 2600);
    expect(visible(fx)).toBe(0);
  });
  it('hide() puts everything away', () => {
    const fx = new AnimFx();
    fx.gather(HAND, 1, 0.1, 'item');
    fx.toss(TARGET, 400);
    fx.aura({ x: 0, y: 0, z: 0 }, 1.8);
    fx.hide();
    expect(visible(fx)).toBe(0);
    expect(fx.flying).toBe(false);
  });
  it('disposes without a canvas', () => {
    const fx = new AnimFx();
    fx.gather(HAND, 1, 0, 'cast');
    expect(() => fx.dispose()).not.toThrow();
  });
});

// ------------------------------------------------------------------------------------------------ through the real actor
const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });
const opts = (): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false });
function fullFile(): RigFileT {
  const f = makeRigFile();
  const k = (bones: Record<string, { rot: number }>): RigFileT['keys'][string] => ({ bones, source: 'authored' });
  f.keys['follow'] = k({ chest: { rot: 0.5 } });
  f.keys['cast'] = k({ arm: { rot: -2.4 } });
  f.keys['item'] = k({ arm: { rot: -1.9 } });
  f.keys['victory'] = k({ arm: { rot: -2.8 } });
  f.keys['attack'] = k({ arm: { rot: 0.8 } });
  f.keys['hurt'] = k({ chest: { rot: -0.4 } });
  f.keys['ko'] = k({ pelvis: { rot: 1.4 } });
  f.landmarks['fist'] = { bone: 'arm', x: 150, y: 500 };
  return f;
}
async function rigged(anim: StyleT | null): Promise<RigActorT> {
  const r = readRig(fullFile());
  if (!r.ok) throw new Error(r.reason);
  return RigActor.createRigged(opts(), { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture(), anim });
}
const fxOf = (a: RigActorT): FxT | null => (a as unknown as { anim: { fx: FxT | null } }).anim.fx;
const run = (a: RigActorT, seconds: number): void => {
  for (let t = 0; t < seconds - 1e-9; t += 1 / 60) a.update(1 / 60);
};

describe('the actor draws light, not a vial', () => {
  it('pass 2 has an AnimFx and pass 1\'s styles have none (they keep the vial)', async () => {
    expect(fxOf(await rigged(STYLE_P2))).not.toBeNull();
    expect(fxOf(await rigged(STYLE_B))).toBeNull();
  });
  it('an item on an ally: the orb is tossed at the release (not before), and nothing is left on screen when it is over', async () => {
    const a = await rigged(STYLE_P2);
    const fx = fxOf(a)!;
    a.setPose('item');
    a.animBegin('item', [{ x: -2, y: 1, z: 0 }]);
    let tossed = -1;
    for (let i = 0; i < 60 * 6; i++) {
      a.update(1 / 60);
      if (fx.flying && tossed < 0) tossed = i / 60;
    }
    const lead0 = STYLE_P2.p2!.itemDwell + (22 + 37) * (1000 / 30);
    expect(tossed * 1000).toBeGreaterThan(lead0 - 100); // the toss leaves on the clip's release, not early
    expect(tossed * 1000).toBeLessThan(lead0 + 250);
    expect(fx.flying).toBe(false);
    expect(fx.active).toBe(false);
  });
  it('an item on the user: no orb flies; the glow particles rise around her at the release', async () => {
    const a = await rigged(STYLE_P2);
    const fx = fxOf(a)!;
    a.setPose('item');
    a.animBegin('item', [{ x: a.position.x, y: 1, z: a.position.z }]);
    let flew = false;
    let lit = false;
    for (let i = 0; i < 60 * 4; i++) {
      a.update(1 / 60);
      if (fx.flying) flew = true;
      if (i > 60 * 2.35 && fx.active) lit = true;
    }
    expect(flew).toBe(false);
    expect(lit).toBe(true);
  });
  it('a cast: the figure flashes as the thrust lets go and the glow is on screen through the hold', async () => {
    const a = await rigged(STYLE_P2);
    const fx = fxOf(a)!;
    const flash = vi.spyOn(a, 'flash');
    a.setPose('cast');
    a.animBegin('cast', [{ x: -2, y: 1, z: 0 }]);
    let glowing = 0;
    for (let i = 0; i < 60 * 5; i++) {
      a.update(1 / 60);
      if (i > 60 * 1.8 && i < 60 * 2.5 && fx.active) glowing++;
    }
    expect(glowing).toBeGreaterThan(30);
    expect(flash).toHaveBeenCalled();
    run(a, 1);
    expect(fx.active).toBe(false);
  });
  it('the lead the presenter waits for is the orb\'s landing for an ally and the glow\'s for the user', async () => {
    const ally = await rigged(STYLE_P2);
    ally.setPose('item');
    ally.animBegin('item', [{ x: -2, y: 1, z: 0 }]);
    const self = await rigged(STYLE_P2);
    self.setPose('item');
    self.animBegin('item', [{ x: self.position.x, y: 1, z: self.position.z }]);
    expect(ally.animLead('item')).toBeGreaterThan(self.animLead('item') - 1000); // both are in the same range (about two and a half seconds)
    expect(ally.animLead('item') - self.animLead('item')).toBeGreaterThan(100); // the ally's clip is the longer toss
  });
});
