/**
 * MF-11 (motion-fluidity pass, lane L2 "moves"; curves audit C-09, C-10; both games: Seymour Flux and Bahamut are rigs): a rig boss's KO and its return, behind `?rigko=` (`today`, `whole`; **`whole` is the default since release 67**,
 * so every `today` case below names the word).
 *
 * The REAL `RigActor` over the synthetic rig of the rig tests, stepped frame by frame. Today: the generic fall (written for a painted body) keeps the collapsed body sinking and then lifts it back; the
 * idle key is asked for while the strike is still sliding home. `whole`: the ko key is the whole fall, the landing is played on the frame it ends, and the idle key waits for the strike to be over.
 */
import { Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { setMoveWord } = await import('../../../src/engine/motion/MoveSwitch.ts');
const { setCurvesChapter, setCurvesMode } = await import('../../../src/engine/motion/CurvesSwitch.ts');
const { setPace, setPaceGame } = await import('../../../src/engine/pace.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

afterEach(() => {
  setMoveWord('rigko', null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setPaceGame('other');
  setPace('steady');
});

const idlePainting = (): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' });

async function boss(side: 'party' | 'enemy' = 'enemy'): Promise<RigActorT> {
  const r = readRig(makeRigFile());
  if (!r.ok) throw new Error(r.reason);
  const a = await RigActor.createRigged({ name: 'testfig', worldHeight: 1.82, side, shadow: false }, { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture() });
  a.position.set(2, 0, 0);
  return a;
}

/** The largest rise of the group above the lowest point it had reached so far, px (positive up). */
function riseAfterLow(y: number[]): number {
  let low = Infinity;
  let rise = 0;
  for (const v of y) {
    low = Math.min(low, v);
    rise = Math.max(rise, v - low);
  }
  return rise;
}

const inner = (a: RigActorT): { position: { y: number } } => (a as unknown as { inner: { position: { y: number } } }).inner;
const gain = (a: RigActorT): number => (a as unknown as { fallGain: number }).fallGain;

/** Step an actor `ms` at `hz`, calling `each(t)` after every frame. */
function run(a: RigActorT, ms: number, hz: number, each: (t: number) => void = () => {}): void {
  const dt = 1000 / hz;
  for (let t = dt; t <= ms + 1e-6; t += dt) {
    a.update(dt / 1000);
    each(t);
  }
}

/** Count the landing squash (the fall's 280 ms, 0.5 slap) the actor starts. */
function watchLanding(a: RigActorT): { at: number[] } {
  const seen = { at: [] as number[], now: 0 };
  const real = a as unknown as { squash: (ms?: number, amount?: number) => Promise<void> };
  const orig = real.squash.bind(a);
  real.squash = (ms?: number, amount?: number): Promise<void> => {
    if (amount === 0.5) seen.at.push(seen.now);
    return orig(ms, amount);
  };
  (seen as unknown as { tick: (t: number) => void }).tick = (t) => (seen.now = t);
  return seen;
}

describe('MF-11: a rig boss goes down', () => {
  for (const hz of [60, 120, 144]) {
    it(`today at ${hz} Hz: the generic fall sinks the collapsed body past the key and lifts it back (the bug the word removes)`, async () => {
      setMoveWord('rigko', 'today');
      setPaceGame('ffx2');
      const a = await boss();
      a.update(0);
      const y: number[] = [];
      a.setPose('ko');
      run(a, 900, hz, () => y.push(inner(a).position.y * 146));
      expect(gain(a)).toBe(1);
      expect(riseAfterLow(y)).toBeGreaterThan(4); // the fixture's boss is 1.82 tall: a body that sinks, thuds and rises back by several px
    });

    it(`whole at ${hz} Hz: the ko key is the whole fall: no generic sink or rise, and the landing is on the frame the key ends`, async () => {
      setMoveWord('rigko', 'whole');
      setPaceGame('ffx2');
      const a = await boss();
      a.update(0);
      const w = watchLanding(a);
      a.setPose('ko');
      expect(gain(a)).toBe(0);
      let keyEndedAt = -1;
      const ys: number[] = [];
      run(a, 900, hz, (t) => {
        (w as unknown as { tick: (t: number) => void }).tick(t);
        ys.push(inner(a).position.y * 146);
        if (keyEndedAt < 0 && !a.blending) keyEndedAt = t;
      });
      expect(w.at).toHaveLength(1); // once: the fall tween's later end finds it done
      expect(keyEndedAt).toBeGreaterThan(0);
      expect(Math.abs(w.at[0]! - keyEndedAt)).toBeLessThanOrEqual(1000 / hz + 1e-6); // within one display frame of the key's end
      expect(riseAfterLow(ys)).toBeLessThan(2.5); // nothing lifts the collapsed body back (only the landing's little ground shake)
    });
  }

  it('whole: today\'s landing (the tween\'s end) is 150 ms or more later than the key; the word pulls it onto the key', async () => {
    setMoveWord('rigko', 'today');
    setPaceGame('ffx2');
    const today = await boss();
    today.update(0);
    const wt = watchLanding(today);
    today.setPose('ko');
    run(today, 900, 120, (t) => (wt as unknown as { tick: (t: number) => void }).tick(t));
    setMoveWord('rigko', 'whole');
    const whole = await boss();
    whole.update(0);
    const ww = watchLanding(whole);
    whole.setPose('ko');
    run(whole, 900, 120, (t) => (ww as unknown as { tick: (t: number) => void }).tick(t));
    expect(ww.at[0]!).toBeLessThan(wt.at[0]! - 100);
  });

  it('a revive after a whole KO gives the fall tilt back (fallGain 1) and a later KO plays whole again', async () => {
    setMoveWord('rigko', 'whole');
    const a = await boss('party');
    a.update(0);
    a.setPose('ko');
    run(a, 600, 60);
    expect(gain(a)).toBe(0);
    a.setPose('idle');
    run(a, 300, 60);
    expect(gain(a)).toBe(1);
    a.setPose('ko');
    expect(gain(a)).toBe(0);
  });

  it('a figure with no ko key is left alone (a dressphere falls straight to idle)', async () => {
    setMoveWord('rigko', 'whole');
    const a = await boss('party');
    a.update(0);
    Object.defineProperty(a, 'rigKeys', { value: new Set(['idle', 'attack']) });
    a.setPose('ko');
    expect(gain(a)).toBe(1);
  });
});

describe('MF-11: a rig boss comes home', () => {
  /** A strike in flight under the new curves (the held idle looks at the strike). */
  async function striking(): Promise<RigActorT> {
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    setPaceGame('ffx');
    const a = await boss();
    a.update(0);
    a.setPose('attack');
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
    return a;
  }

  it('today: the idle key is asked for at once, with the strike still sliding home', async () => {
    setMoveWord('rigko', 'today');
    const a = await striking();
    run(a, 700, 60);
    expect(a.striking).toBe(true);
    a.setPose('idle');
    expect(a.pose).toBe('idle');
  });

  it('whole: the idle key waits for the strike to be over, then moves', async () => {
    setMoveWord('rigko', 'whole');
    const a = await striking();
    run(a, 700, 60);
    expect(a.striking).toBe(true);
    a.setPose('idle');
    expect(a.pose).toBe('attack'); // the key stays on the strike's pose while it slides home
    let left = -1;
    run(a, 3000, 60, (t) => {
      if (left < 0 && a.pose === 'idle') left = t;
    });
    expect(left).toBeGreaterThan(0);
    expect(a.striking).toBe(false);
  });

  it('whole: any other request cancels a held idle', async () => {
    setMoveWord('rigko', 'whole');
    const a = await striking();
    run(a, 700, 60);
    a.setPose('idle');
    a.setPose('ready');
    run(a, 3000, 60);
    expect(a.pose).toBe('ready');
  });

  it('whole: with no strike in flight an idle request moves the key at once, as ever', async () => {
    setMoveWord('rigko', 'whole');
    const a = await boss();
    a.update(0);
    a.setPose('attack');
    run(a, 400, 60);
    a.setPose('idle');
    expect(a.pose).toBe('idle');
  });
});
