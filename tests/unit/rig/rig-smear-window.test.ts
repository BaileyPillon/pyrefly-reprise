/**
 * Motion pass, lane "core", step 2 (SMEAR) on a RIG (the bosses): a key that swaps (nearly) the whole figure's images flips them at progress 0.5 of the move; with the smear on that flip is a CUT
 * (no cross-fade, so two figures are never on the screen) and a streak covers it: a window of a few frames centred on the flip, written onto the cells the parts share. A small change, the switch off,
 * and every chapter but the two demo chapters keep today's cross-fade. Game case: both (shared plumbing; the two bosses are Chapter I FFX and Chapter IV FFX-2). Textures are stand-ins.
 */
import { Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';
import { setCurvesChapter } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { resetSmearLog, smearLog } from '../../../src/engine/motion/SmearLog.ts';
import { setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type RigFileT = import('../../../src/data/art/rigTypes.ts').RigFile;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

afterEach(() => {
  setSmearStyle(null);
  setCurvesChapter(undefined);
  setDemoMotion(null);
  resetSmearLog();
});

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });

/** The fixture with an `attack` and a `hurt` key that swap EVERY part to another image (a whole-figure change, like both demo bosses), and an `alt` key that swaps only the head. */
function bossFile(): RigFileT {
  const f = makeRigFile();
  const parts = f.parts.map((p) => ({ ...p, variants: { x: { png: `${p.name}.x.png` } } }));
  const all = Object.fromEntries(parts.map((p) => [p.name, { image: 'x' }]));
  return { ...f, version: 2, parts, keys: { ...f.keys, attack: { ...f.keys['attack']!, parts: all }, hurt: { ...f.keys['hurt']!, parts: all }, alt: { ...f.keys['hurt']!, parts: { head: { image: 'x' } } } } };
}

async function boss(name = 'seymour'): Promise<RigActorT> {
  const r = readRig(bossFile());
  if (!r.ok) throw new Error(r.reason);
  return RigActor.createRigged(
    { name, worldHeight: 4.1, side: 'enemy', shadow: false },
    { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture() },
  );
}
const cellsOf = (a: RigActorT): { smearAmt: { value: number }; smearStyle: { value: number } } => (a as unknown as { u: ReturnType<typeof cellsOf> }).u;
const partMaterial = (a: RigActorT) => (a.figure.plane.children[0] as import('three').Mesh).material as import('three').ShaderMaterial;

interface Rec {
  p: number;
  amt: number;
  fading: boolean;
  ghost: boolean;
}
function play(a: RigActorT, key: string, frame = 1 / 120): Rec[] {
  const out: Rec[] = [];
  a.setPose(key);
  for (let i = 0; i < 80; i++) {
    a.update(frame);
    out.push({ p: a.figure.partState()[0]!, amt: cellsOf(a).smearAmt.value, fading: a.figure.fading, ghost: a.figure.plane.children.some((c) => c.name.endsWith('~ghost') && c.visible) });
    if (!a.blending && i > 3) break;
  }
  return out;
}

describe('a rig\'s whole-figure image change under the smear', () => {
  for (const hz of [60, 120, 240]) {
    it(`is a cut with no cross-fade at ${hz} Hz, covered by a window of a few frames centred on the flip`, async () => {
      setSmearStyle('paint');
      setCurvesChapter('seymour-flux');
      const a = await boss();
      for (let i = 0; i < 12; i++) a.update(1 / hz);
      const r = play(a, 'attack', 1 / hz);
      expect(smearLog()).toHaveLength(1);
      expect(smearLog()[0]).toMatchObject({ actor: 'seymour', from: 'idle', to: 'attack', style: 'paint', kind: 'rig' });
      expect(r.some((x) => x.fading || x.ghost)).toBe(false); // a cut: no ghost holding the old image
      const flip = r.findIndex((x, i) => i > 0 && x.p !== r[i - 1]!.p);
      expect(flip).toBeGreaterThan(0);
      expect(r[flip - 1]!.amt).toBeGreaterThan(0.2); // streaked just before the flip
      expect(r[flip]!.amt).toBeGreaterThan(0.2); // and just after
      const lit = r.filter((x) => x.amt > 0).length;
      expect(lit).toBeGreaterThanOrEqual(2);
      expect(lit * (1000 / hz)).toBeLessThanOrEqual(smearLog()[0]!.cutMs + 2 * (1000 / hz) + 1);
      expect(r.at(-1)!.amt).toBe(0);
    });
  }

  it('the parts share the actor\'s cells and the patched shader carries the streak into each part\'s own uv', async () => {
    setSmearStyle('blur');
    setCurvesChapter('ffx2-bahamut');
    const a = await boss('bahamut');
    const m = partMaterial(a);
    expect(m.uniforms['smearAmt']).toBe(cellsOf(a).smearAmt); // shared by reference
    expect(m.fragmentShader).toContain('dFdx(vFig)'); // the rig's patch
    expect(m.fragmentShader).not.toContain('vec2 smearUvVec(vec2 v) { return v; }');
    for (let i = 0; i < 12; i++) a.update(1 / 120);
    play(a, 'hurt');
    expect(smearLog()[0]).toMatchObject({ style: 'blur', to: 'hurt', flash: false, kind: 'rig' });
  });

  it('a figure that only changes key streaks the way it FACES (a foe to the left, a party member to the right), in the plane own coordinates', async () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    for (const [side, facing] of [['enemy', -1], ['party', 1]] as const) {
      const r = readRig(bossFile());
      if (!r.ok) throw new Error(r.reason);
      const a = await RigActor.createRigged({ name: 'seymour', worldHeight: 4.1, side, shadow: false }, { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture() });
      for (let i = 0; i < 12; i++) a.update(1 / 120);
      a.setPose('attack');
      let seen = 0;
      for (let i = 0; i < 30 && !seen; i++) {
        a.update(1 / 120);
        if (cellsOf(a).smearAmt.value > 0.3) seen = (a as unknown as { u: { smearVec: { value: { x: number } } } }).u.smearVec.value.x;
      }
      const plane = (a as unknown as { slots: [{ mesh: { scale: { x: number } } }]; active: number }).slots[(a as unknown as { active: number }).active]!.mesh.scale.x;
      expect(Math.sign(seen), side).toBe(facing * Math.sign(plane)); // a mirrored plane's coordinates run the other way
    }
  });

  it('a small change (one part), the switch off, another chapter and an immediate pose keep the cross-fade', async () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    setDemoMotion(true);
    let a = await boss();
    play(a, 'alt');
    expect(smearLog()).toHaveLength(0);
    setSmearStyle('off');
    a = await boss();
    play(a, 'attack');
    expect(smearLog()).toHaveLength(0);
    setSmearStyle('paint');
    setCurvesChapter('tourist-trap');
    a = await boss();
    play(a, 'attack');
    expect(smearLog()).toHaveLength(0);
    setCurvesChapter('seymour-flux');
    a = await boss();
    a.setPose('attack', { immediate: true });
    expect(smearLog()).toHaveLength(0);
  });

  it('a knock-out is not smeared here (its own cut is step 3)', async () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const a = await boss();
    play(a, 'ko');
    expect(smearLog()).toHaveLength(0);
  });

  it('the flash goes out with the cut into an attack, and stays out under REDUCE FLASHES', async () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const flash = (a: RigActorT): number => (a as unknown as { u: { flashAmount: { value: number } } }).u.flashAmount.value;
    let a = await boss();
    play(a, 'attack');
    // the flash fires at the window and decays; read it on the way
    a = await boss();
    let peak = 0;
    a.setPose('attack');
    for (let i = 0; i < 40; i++) {
      a.update(1 / 120);
      peak = Math.max(peak, flash(a));
    }
    expect(peak).toBeGreaterThan(0.1);
    a = await boss();
    a.softFlash = () => true;
    peak = 0;
    a.setPose('attack');
    for (let i = 0; i < 40; i++) {
      a.update(1 / 120);
      peak = Math.max(peak, flash(a));
    }
    expect(peak).toBe(0);
    expect(smearLog().at(-1)!.to).toBe('attack');
  });
});
