/**
 * The animation prototype inside `RigActor` (`?anim=proto`; `src/engine/rig/anim/`): off by default and then exactly the rig it always was; on, a pose request plays as a clip, the presenter's
 * beats (`animBegin`, `animLead`, `lunge`, `animBeat`) steer it, a blow's hit-stop freezes the attacker's pose for the first and the last hit only, and a rig that lacks a key the clips need is left alone.
 * Textures are stand-ins that need no image.
 */
import { Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { STYLE_A, STYLE_B, STYLE_C } = await import('../../../src/engine/rig/anim/AnimStyles.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
type RigFileT = import('../../../src/data/art/rigTypes.ts').RigFile;
type StyleT = import('../../../src/engine/rig/anim/AnimStyles.ts').AnimStyle;

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });
const opts = (): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false });

/** The fixture plus the keys the prototype's clips are made of. */
function fullFile(): RigFileT {
  const f = makeRigFile();
  const k = (bones: Record<string, { rot: number }>, extra = {}): RigFileT['keys'][string] => ({ bones, source: 'authored', ...extra });
  f.keys['follow'] = k({ chest: { rot: 0.5 }, arm: { rot: -0.4 } });
  f.keys['cast'] = k({ arm: { rot: -2.4 }, head: { rot: -0.2 } });
  f.keys['item'] = k({ arm: { rot: -1.9 }, chest: { rot: 0.1 } });
  f.keys['victory'] = k({ arm: { rot: -2.8 }, chest: { rot: -0.2 } });
  return f;
}

async function rigged(file: RigFileT, anim: StyleT | null): Promise<RigActorT> {
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  return RigActor.createRigged(opts(), { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture(), anim });
}
const run = (a: RigActorT, seconds: number, dt = 1 / 60): void => {
  for (let t = 0; t < seconds - 1e-9; t += dt) a.update(dt);
};
const armRot = (a: RigActorT): number => a.figure.skeleton.pose[8 * 5]!; // the `arm` bone's rot in the pose last solved

describe('the prototype is off unless asked for', () => {
  it('with no style the actor is the rig it always was: no layer, no clip, the lead is -1 (wait as ever)', async () => {
    const a = await rigged(fullFile(), null);
    expect(a.rigInfo().anim).toBeNull();
    a.setPose('attack');
    expect(a.blending).toBe(true); // the ordinary move
    expect(a.animLead('cast')).toBe(-1);
    expect(a.animBeat('contact', 0, 1)).toEqual({ punch: 0, ms: 0 });
    a.animBegin('cast', []); // a no-op
    run(a, 0.3);
    expect(a.blending).toBe(false);
    expect(a.pose).toBe('attack');
  });

  it('a rig without a key the clips need is left alone even when asked', async () => {
    const a = await rigged(makeRigFile(), STYLE_A); // no cast, item, follow or victory key
    expect(a.rigInfo().anim).toBeNull();
    a.setPose('attack');
    expect(a.blending).toBe(true);
  });
});

describe('a rig with no authored data keeps its own idle and lag chain', () => {
  it('the file\'s idle sines still breathe the chest and head, and its tail chain still swings, with the prototype on', async () => {
    const a = await rigged(fullFile(), STYLE_A);
    const chest = (): number => a.figure.skeleton.pose[2 * 5]!; // `chest` rot
    const tail = (): number => a.figure.skeleton.pose[9 * 5]!; // `tail0` rot
    let chestMax = 0;
    let tailMax = 0;
    for (let i = 0; i < 240; i++) {
      a.update(1 / 60);
      chestMax = Math.max(chestMax, Math.abs(chest()));
      tailMax = Math.max(tailMax, Math.abs(tail()));
    }
    expect(chestMax).toBeGreaterThan(0.001); // the idle breath, in radians (1.5 degrees at most)
    expect(chestMax).toBeLessThan(0.05);
    expect(Number.isFinite(tailMax)).toBe(true);
  });
});

describe('a pose request plays as a clip', () => {
  it('attack: no move in flight, the key is reported at once, the arm ends where the key puts it, and the figure rests in the pose', async () => {
    const a = await rigged(fullFile(), STYLE_A);
    expect(a.rigInfo().anim).toBe('A');
    run(a, 0.5);
    a.setPose('attack');
    expect(a.pose).toBe('attack');
    expect(a.blending).toBe(false); // the clip is the move, not RigTransition
    run(a, 1.0);
    expect(armRot(a)).toBeCloseTo(-1.2, 1); // the fixture's attack: arm -1.2 rad, plus a breath of idle
    a.setPose('idle');
    run(a, 1.0);
    expect(Math.abs(armRot(a))).toBeLessThan(0.05);
  });

  it('the strike overshoots its key before it settles (a back curve), and the same actor without the prototype never does', async () => {
    const peak = async (style: StyleT | null): Promise<number> => {
      const a = await rigged(fullFile(), style);
      run(a, 0.6);
      a.setPose('attack');
      let worst = 0;
      for (let i = 0; i < 90; i++) {
        a.update(1 / 60);
        worst = Math.min(worst, armRot(a)); // more negative than -1.2 is past the key
      }
      return worst;
    };
    expect(await peak(STYLE_B)).toBeLessThan(-1.25);
    expect(await peak(null)).toBeGreaterThan(-1.25);
  });

  it('a pose the clips do not play (defend) falls through to the ordinary move, from where the clip left the figure', async () => {
    const a = await rigged(fullFile(), STYLE_A);
    a.setPose('attack');
    run(a, 0.05);
    const mid = armRot(a);
    a.setPose('hurt');
    a.setPose('idle');
    a.setPose('ko'); // the ko is a clip too
    expect(a.pose).toBe('ko');
    expect(Number.isFinite(mid)).toBe(true);
  });
});

describe('the presenter\'s beats', () => {
  it('animBegin(cast) starts the clip; animLead is the time to its release and counts down on the figure\'s own clock', async () => {
    for (const [style, release] of [[STYLE_A, STYLE_A.cast.gather + STYLE_A.cast.channel + STYLE_A.cast.beat + STYLE_A.cast.release * 0.5], [STYLE_B, STYLE_B.cast.gather + STYLE_B.cast.channel + STYLE_B.cast.beat + STYLE_B.cast.release * 0.5], [STYLE_C, STYLE_C.cast.gather + STYLE_C.cast.channel + STYLE_C.cast.beat + STYLE_C.cast.release * 0.5]] as const) {
      const a = await rigged(fullFile(), style);
      run(a, 0.2);
      a.setPose('cast');
      a.animBegin('cast', [{ x: 2, y: 1, z: 0 }]);
      expect(a.animLead('cast')).toBeCloseTo(release, 6);
      run(a, 0.1);
      expect(a.animLead('cast')).toBeCloseTo(release - 100, 0);
      run(a, 5);
      expect(a.animLead('cast')).toBe(0);
    }
  });

  it('animLead(attack) is the wind-up still to go; a lunge schedules the strike so that its contact lands on the apex', async () => {
    const a = await rigged(fullFile(), STYLE_B);
    a.setPose('ready');
    run(a, 0.5);
    a.animBegin('attack', []);
    expect(a.animLead('attack')).toBeCloseTo(STYLE_B.attack.anticipation, 6);
    run(a, 0.1);
    expect(a.animLead('attack')).toBeCloseTo(STYLE_B.attack.anticipation - 100, 0);
    run(a, 0.2);
    expect(a.animLead('attack')).toBe(0);
    void a.lunge(0.5, 440); // the apex is 0.58 of 440 ms away; the strike must start (contact - 105 ms) before it
    // nothing moves until the strike is due: the held wind-up pose
    const held = armRot(a);
    run(a, (0.58 * 440 - STYLE_B.attack.action) / 1000 - 0.03);
    expect(armRot(a)).toBeCloseTo(held, 1);
    run(a, 0.2);
    expect(Math.abs(armRot(a) - held)).toBeGreaterThan(0.3); // the strike has played
  });

  it('a hit-stop holds the attacker for the first and the last blow of a multi-hit strike, not the ones between; style C has none', async () => {
    const frozenFor = async (style: StyleT, hitIndex: number, hitCount: number): Promise<number> => {
      const a = await rigged(fullFile(), style);
      run(a, 0.6);
      a.setPose('attack');
      run(a, 0.02); // the strike is under way
      const r = a.animBeat('contact', hitIndex, hitCount);
      expect(r.punch).toBe(hitIndex === 0 ? style.camera.contact : 0);
      const before = armRot(a);
      let still = 0;
      for (let i = 0; i < 20; i++) {
        a.update(1 / 60);
        if (armRot(a) === before) still++;
        else break;
      }
      return (still * 1000) / 60;
    };
    expect(await frozenFor(STYLE_B, 0, 3)).toBeGreaterThanOrEqual(STYLE_B.attack.hitStop - 17); // 80 ms: about 4 frames
    expect(await frozenFor(STYLE_B, 1, 3)).toBe(0); // a middle hit does not stop
    expect(await frozenFor(STYLE_B, 2, 3)).toBeGreaterThanOrEqual(STYLE_B.attack.hitStop - 17); // the last one does
    expect(await frozenFor(STYLE_A, 0, 1)).toBeGreaterThanOrEqual(STYLE_A.attack.hitStop - 17);
    expect(await frozenFor(STYLE_A, 0, 1)).toBeLessThan(STYLE_B.attack.hitStop);
    expect(await frozenFor(STYLE_C, 0, 1)).toBe(0);
  });

  it('a hit-stop of the whole picture (dt 0) freezes the clip with everything else', async () => {
    const a = await rigged(fullFile(), STYLE_A);
    run(a, 0.5);
    a.setPose('cast');
    run(a, 0.1);
    const x = armRot(a);
    for (let i = 0; i < 30; i++) a.update(0);
    expect(armRot(a)).toBe(x);
  });
});

describe('determinism', () => {
  it('two actors given the same requests and frames draw the same bits', async () => {
    const play = async (): Promise<number[]> => {
      const a = await rigged(fullFile(), STYLE_B);
      const out: number[] = [];
      for (let i = 0; i < 240; i++) {
        if (i === 20) a.setPose('ready');
        if (i === 60) a.setPose('attack');
        if (i === 100) a.setPose('follow');
        if (i === 130) a.setPose('idle');
        a.update(1 / 60);
        out.push(...a.figure.skeleton.pose);
      }
      return out;
    };
    expect(await play()).toEqual(await play());
  });
});
