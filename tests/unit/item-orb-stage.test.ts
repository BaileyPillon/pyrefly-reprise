/**
 * The FFX item gesture's light and its placement (`ItemOrbStage.ts`, `fx/ItemOrbFx.ts`, `ItemGestureTable.ts`; FFX only; presentation only):
 * the hand of every kind of figure (a painted one through the live plane at its character's anchor, a rigged one at the rig's `fist`), the stance that has no flask in it, and the orb's timeline
 * (it forms over the hand, is tossed, arcs to the middle of the target, bursts and goes; a self-use glows at the hand and then rises around the user), headless (no canvas: the shapes are left out).
 */
import { describe, expect, it } from 'vitest';
import { Object3D, Vector3 } from 'three';
import { ItemOrbFx, type P3 } from '../../src/engine/fx/ItemOrbFx.ts';
import { FFX_ITEM_HANDS, GENERIC_ITEM_HAND, ITEM_ORB, ITEM_SPARK, itemHandOf, RIG_ITEM_POSE } from '../../src/engine/ItemGestureTable.ts';
import { ItemOrbStage, type OrbFigure } from '../../src/engine/ItemOrbStage.ts';

const PARTY = ['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku'];

interface FakeOpts {
  at: P3;
  height?: number;
  fist?: { x: number; y: number } | null | 'throws';
}

/** A figure that answers what `ItemOrbStage` asks of a `PaintedActor`: a plane that maps (u, t) to a world point, a middle, a feet position, a height, and (a rig) a landmark. */
interface FakeActor {
  position: Vector3;
  height: number;
  paintPoint(u: number, t: number, out?: Vector3): Vector3;
  centerPoint(out?: Vector3): Vector3;
  landmark?: (name: string) => { x: number; y: number } | null;
}

function figure(artId: string, o: FakeOpts): OrbFigure {
  const height = o.height ?? 1.8;
  const actor: FakeActor = {
    position: new Vector3(o.at.x, o.at.y, o.at.z),
    height,
    paintPoint(u: number, t: number, out = new Vector3()): Vector3 {
      return out.set(this.position.x + (u - 0.5) * 1.2, this.position.y + (1 - t) * height, this.position.z);
    },
    centerPoint(out = new Vector3()): Vector3 {
      return out.set(this.position.x, this.position.y + height * 0.52, this.position.z);
    },
  };
  const fist = o.fist;
  if (fist !== undefined) {
    actor.landmark = (name: string): { x: number; y: number } | null => {
      if (fist === 'throws') throw new Error('the rig is not ready');
      return name === 'fist' ? fist : null;
    };
  }
  return { actor: actor as unknown as OrbFigure['actor'], artId };
}

function stageOf(figs: Record<string, OrbFigure>, rate = 1): { stage: ItemOrbStage; scene: Object3D } {
  const scene = new Object3D();
  return { stage: new ItemOrbStage(scene, (id) => figs[id], () => rate), scene };
}

const step = (stage: ItemOrbStage, ms: number, dt = 1 / 60): void => {
  for (let t = 0; t < ms - 1e-9; t += dt * 1000) stage.update(dt);
};

describe('the hand table', () => {
  it('has a hand for every FFX party member, inside the painting, in a stance with no flask', () => {
    for (const id of PARTY) {
      const h = FFX_ITEM_HANDS[id];
      expect(h, id).toBeDefined();
      expect(h!.u).toBeGreaterThan(0);
      expect(h!.u).toBeLessThan(1);
      expect(h!.t).toBeGreaterThan(0);
      expect(h!.t).toBeLessThan(1);
      expect(['idle', 'item']).toContain(h!.pose);
    }
  });
  it('keeps only Yuna on her item painting (an open hand, the staff planted); the flask holders stand in their idle', () => {
    expect(itemHandOf('yuna').pose).toBe('item');
    for (const id of PARTY.filter((p) => p !== 'yuna')) expect(itemHandOf(id).pose, id).toBe('idle');
  });
  it('gives a figure with no row the generic idle hand', () => {
    expect(itemHandOf('some-ally')).toBe(GENERIC_ITEM_HAND);
    expect(itemHandOf('constructor')).toBe(GENERIC_ITEM_HAND); // an inherited name is not a row
  });
});

describe('the stance and the hand of a figure', () => {
  it('a painted figure takes its table pose and its hand is its (u, t) through the live plane', () => {
    const tidus = figure('tidus', { at: { x: 2, y: 0, z: 0.5 } });
    const { stage } = stageOf({ tidus });
    expect(stage.stance('tidus')).toBe('idle');
    const hand = stage.handOf(tidus);
    const h = FFX_ITEM_HANDS['tidus']!;
    expect(hand.x).toBeCloseTo(2 + (h.u - 0.5) * 1.2, 6);
    expect(hand.y).toBeCloseTo((1 - h.t) * 1.8, 6);
  });
  it('each party member\'s hand is a different, plausible spot (above the knee, within the body\'s width)', () => {
    const spots = new Set<string>();
    for (const id of PARTY) {
      const f = figure(id, { at: { x: 0, y: 0, z: 0 } });
      const hand = stageOf({ [id]: f }).stage.handOf(f);
      expect(hand.y, id).toBeGreaterThan(0.6);
      expect(hand.y, id).toBeLessThan(1.8);
      spots.add(`${hand.x.toFixed(2)},${hand.y.toFixed(2)}`);
    }
    expect(spots.size).toBe(PARTY.length);
  });
  it('a rigged figure takes the rig\'s item key and its hand is the rig\'s fist at the figure\'s position', () => {
    const lulu = figure('lulu', { at: { x: -1, y: 0.1, z: 0.2 }, fist: { x: 0.3, y: 1.1 } });
    const { stage } = stageOf({ lulu });
    expect(stage.stance('lulu')).toBe(RIG_ITEM_POSE);
    const hand = stage.handOf(lulu);
    expect(hand.x).toBeCloseTo(-0.7, 6);
    expect(hand.y).toBeCloseTo(1.2, 6);
  });
  it('a rig that cannot say where its fist is (not ready, or none) falls back on the painting\'s hand and the idle', () => {
    for (const fist of ['throws' as const, null]) {
      const kimahri = figure('kimahri', { at: { x: 0, y: 0, z: 0 }, fist });
      const { stage } = stageOf({ kimahri });
      expect(stage.stance('kimahri')).toBe('idle');
      expect(stage.handOf(kimahri).y).toBeCloseTo((1 - FFX_ITEM_HANDS['kimahri']!.t) * 1.8, 6);
    }
  });
  it('has no stance for a combatant that is not on the field', () => {
    expect(stageOf({}).stage.stance('ghost')).toBeUndefined();
  });
});

describe('the orb\'s timeline', () => {
  const FORM = ITEM_ORB.formMs;
  const FLIGHT = ITEM_ORB.flightMs;

  it('forms over the hand, is tossed after the form time, lands on the target at the flight time, bursts and is gone', () => {
    const user = figure('tidus', { at: { x: 2, y: 0, z: 0 } });
    const ally = figure('yuna', { at: { x: -2, y: 0, z: 0 } });
    const { stage, scene } = stageOf({ tidus: user, yuna: ally });
    stage.toss('tidus', ['yuna'], { formMs: FORM, flightMs: FLIGHT, tone: 'heal' });
    expect(stage.state.phase).toBe('form');
    step(stage, FORM * 0.5);
    expect(stage.state.phase).toBe('form');
    const hand = stage.handOf(user);
    expect(Math.abs(stage.state.at.x - hand.x)).toBeLessThan(0.01); // over the hand
    expect(stage.state.at.y).toBeGreaterThan(hand.y); // and risen above it
    expect(scene.children.length).toBe(1); // the light hangs under the scene
    step(stage, FORM * 0.5 + 60);
    expect(stage.state.phase).toBe('flight');
    step(stage, FLIGHT - 60 - 17);
    expect(stage.state.phase).toBe('flight');
    step(stage, 40);
    expect(stage.state.phase).toBe('burst');
    const middle = new Vector3();
    (ally.actor as unknown as { centerPoint(o: Vector3): Vector3 }).centerPoint(middle);
    expect(stage.state.at.x).toBeCloseTo(middle.x, 1);
    expect(stage.state.at.y).toBeCloseTo(middle.y, 1);
    step(stage, 1200);
    expect(stage.state.phase).toBe('rest');
  });
  it('arcs above the straight line between hand and target in the middle of the flight', () => {
    const user = figure('tidus', { at: { x: 2, y: 0, z: 0 } });
    const ally = figure('yuna', { at: { x: -2, y: 0, z: 0 } });
    const { stage } = stageOf({ tidus: user, yuna: ally });
    stage.toss('tidus', ['yuna'], { formMs: FORM, flightMs: FLIGHT, tone: 'heal' });
    step(stage, FORM + 1);
    const from = { ...stage.state.at };
    step(stage, FLIGHT / 2);
    const mid = stage.state.at;
    const to = (ally.actor as unknown as { centerPoint(): Vector3 }).centerPoint();
    const line = (from.y + to.y) / 2;
    expect(mid.y).toBeGreaterThan(line + 0.05);
    expect(mid.x).toBeLessThan(from.x); // it has left the hand toward the ally
    expect(mid.x).toBeGreaterThan(to.x);
  });
  it('a group item (more than one target) lands in the middle of them', () => {
    const user = figure('tidus', { at: { x: 2, y: 0, z: 0 } });
    const a = figure('yuna', { at: { x: -1, y: 0, z: 0 } });
    const b = figure('auron', { at: { x: -3, y: 0, z: 0 } });
    const { stage } = stageOf({ tidus: user, yuna: a, auron: b });
    stage.toss('tidus', ['yuna', 'auron'], { formMs: 100, flightMs: 200, tone: 'heal' });
    step(stage, 100 + 200 + 40);
    expect(stage.state.phase).toBe('burst');
    expect(stage.state.at.x).toBeCloseTo(-2, 1);
  });
  it('runs on the effect clock\'s rate: at twice the rate the whole toss takes half as long', () => {
    const user = figure('tidus', { at: { x: 2, y: 0, z: 0 } });
    const ally = figure('yuna', { at: { x: -2, y: 0, z: 0 } });
    const { stage } = stageOf({ tidus: user, yuna: ally }, 2);
    stage.toss('tidus', ['yuna'], { formMs: FORM, flightMs: FLIGHT, tone: 'heal' });
    step(stage, (FORM + FLIGHT) / 2 + 40);
    expect(stage.state.phase).toBe('burst');
  });
  it('a toss at nobody on the field draws nothing; a second toss starts over from the hand', () => {
    const user = figure('tidus', { at: { x: 2, y: 0, z: 0 } });
    const ally = figure('yuna', { at: { x: -2, y: 0, z: 0 } });
    const { stage } = stageOf({ tidus: user, yuna: ally });
    stage.toss('tidus', ['ghost'], { formMs: FORM, flightMs: FLIGHT, tone: 'heal' });
    expect(stage.state.phase).toBe('rest');
    stage.toss('tidus', ['yuna'], { formMs: FORM, flightMs: FLIGHT, tone: 'heal' });
    step(stage, FORM + FLIGHT * 0.5);
    stage.toss('tidus', ['yuna'], { formMs: FORM, flightMs: FLIGHT, tone: 'heal' });
    expect(stage.state.phase).toBe('form');
  });
  it('the target is read live: a figure that moves during the flight carries the landing', () => {
    const user = figure('tidus', { at: { x: 2, y: 0, z: 0 } });
    const ally = figure('yuna', { at: { x: -2, y: 0, z: 0 } });
    const { stage } = stageOf({ tidus: user, yuna: ally });
    stage.toss('tidus', ['yuna'], { formMs: FORM, flightMs: FLIGHT, tone: 'heal' });
    step(stage, FORM + FLIGHT * 0.5);
    (ally.actor as unknown as { position: Vector3 }).position.x = -3;
    step(stage, FLIGHT * 0.5 + 40);
    expect(stage.state.phase).toBe('burst');
    expect(stage.state.at.x).toBeCloseTo(-3, 1);
  });
});

describe('the glow on the user', () => {
  it('forms at the hand, then rises around the figure, then is gone; nothing flies', () => {
    const user = figure('yuna', { at: { x: 0, y: 0, z: 0 } });
    const { stage } = stageOf({ yuna: user });
    stage.glow('yuna', { formMs: ITEM_ORB.selfFormMs });
    expect(stage.state.phase).toBe('self');
    step(stage, ITEM_ORB.selfFormMs + 400);
    expect(stage.state.phase).toBe('self');
    step(stage, 3000);
    expect(stage.state.phase).toBe('rest');
  });
});

describe('the light itself', () => {
  it('draws nothing at rest and shows sprites while it plays', () => {
    const fx = new ItemOrbFx();
    expect(fx.active).toBe(false);
    const hand = { x: 1, y: 1, z: 0 };
    fx.toss({ hand: () => hand, target: () => ({ x: -1, y: 1, z: 0 }), formMs: 200, flightMs: 300, tone: 'heal', unit: 1 });
    fx.update(0.1, null);
    expect(fx.group.children.filter((c) => c.visible).length).toBeGreaterThanOrEqual(2); // the halo and the core
    fx.hide();
    expect(fx.active).toBe(false);
    expect(fx.group.children.filter((c) => c.visible).length).toBe(0);
    fx.dispose();
  });
  it('is deterministic: two runs of the same toss put the same sparkles in the same places', () => {
    const run = (): number[] => {
      const fx = new ItemOrbFx();
      fx.toss({ hand: () => ({ x: 1, y: 1, z: 0 }), target: () => ({ x: -1, y: 1, z: 0 }), formMs: 100, flightMs: 200, tone: 'heal', unit: 1 });
      for (let i = 0; i < 24; i++) fx.update(1 / 60, null);
      return fx.group.children.filter((c) => c.visible).flatMap((c) => [c.position.x, c.position.y]);
    };
    expect(run()).toEqual(run());
  });
  it('an amber foe tone and a green ally tone are different colours', () => {
    const colour = (tone: 'heal' | 'foe'): number => {
      const fx = new ItemOrbFx();
      fx.toss({ hand: () => ({ x: 0, y: 1, z: 0 }), target: () => ({ x: -1, y: 1, z: 0 }), formMs: 200, flightMs: 300, tone, unit: 1 });
      fx.update(0.1, null);
      const halo = fx.group.children.find((c) => c.visible)!;
      return (halo as unknown as { material: { color: { getHex(): number } } }).material.color.getHex();
    };
    expect(colour('heal')).not.toBe(colour('foe'));
  });
});

describe('FFX-2\'s spark (a small white-blue toss and a burst; no orb, no trail, no hand glow)', () => {
  const SPARK = ITEM_SPARK;
  const lit = (_stage: ItemOrbStage, scene: Object3D): number => scene.children.flatMap((g) => g.children).filter((c) => c.visible).length;

  it('is half the orb\'s flight and is over before today\'s 380 ms wait ends', () => {
    expect(SPARK.flightMs).toBe(ITEM_ORB.flightMs / 2);
    expect(SPARK.formMs + SPARK.flightMs).toBeLessThan(380);
  });
  it('shows nothing at the hand, flies a small spark the half flight to the ally with no trail, then bursts white-blue and is gone', () => {
    const user = figure('yuna-songstress', { at: { x: 2, y: 0, z: 0 } });
    const ally = figure('rikku-thief', { at: { x: -2, y: 0, z: 0 } });
    const { stage, scene } = stageOf({ yuna: user, rikku: ally });
    stage.toss('yuna', ['rikku'], { formMs: SPARK.formMs, flightMs: SPARK.flightMs, tone: 'heal', style: 'spark' });
    expect(stage.state.phase).toBe('form');
    step(stage, SPARK.formMs * 0.8);
    expect(lit(stage, scene)).toBe(0); // the gesture shows nothing until the spark is let go
    step(stage, SPARK.formMs * 0.2 + 60);
    expect(stage.state.phase).toBe('flight');
    expect(lit(stage, scene)).toBe(2); // the small halo and core: no trail, no sparks
    step(stage, SPARK.flightMs);
    expect(stage.state.phase).toBe('burst');
    const burst = scene.children[0]!.children.filter((c) => c.visible);
    expect(burst.length).toBeGreaterThan(3); // the flash, the ring and the bits
    step(stage, 1200);
    expect(stage.state.phase).toBe('rest');
  });
  it('the burst is white-blue, not green and not amber', () => {
    const colour = (tone: 'heal' | 'foe', style?: 'orb' | 'spark'): number => {
      const fx = new ItemOrbFx();
      fx.toss({ hand: () => ({ x: 0, y: 1, z: 0 }), target: () => ({ x: -1, y: 1, z: 0 }), formMs: 10, flightMs: 10, tone, ...(style ? { style } : {}), unit: 1 });
      for (let i = 0; i < 6; i++) fx.update(1 / 60, null);
      return (fx.group.children.filter((c) => c.visible).at(-1) as unknown as { material: { color: { getHex(): number } } }).material.color.getHex(); // the last bit of the burst
    };
    const spark = colour('heal', 'spark');
    expect(spark).toBe(colour('foe', 'spark')); // the tone does not matter to a spark
    expect(spark).not.toBe(colour('heal'));
    expect(spark).not.toBe(colour('foe'));
    const b = spark & 0xff;
    const r = (spark >> 16) & 0xff;
    expect(b).toBeGreaterThan(r); // blue over red: white-blue
  });
  it('on the user it is only a burst on her after the form time: nothing at the hand, nothing rising', () => {
    const user = figure('yuna-songstress', { at: { x: 0, y: 0, z: 0 } });
    const { stage, scene } = stageOf({ yuna: user });
    stage.glow('yuna', { formMs: SPARK.selfFormMs, style: 'spark' });
    expect(stage.state.phase).toBe('sparkle');
    step(stage, SPARK.selfFormMs * 0.8);
    expect(lit(stage, scene)).toBe(0);
    step(stage, SPARK.selfFormMs * 0.2 + 60);
    expect(stage.state.phase).toBe('burst');
    expect(stage.state.at.x).toBeCloseTo(0, 1);
    expect(stage.state.at.y).toBeGreaterThan(0.5); // on her body, not at her feet
    step(stage, 1200);
    expect(stage.state.phase).toBe('rest');
  });
  it('two gestures at once (FFX-2\'s ATB overlaps actions) both play; a fourth cuts the oldest', () => {
    const a = figure('yuna-songstress', { at: { x: 2, y: 0, z: 0 } });
    const b = figure('rikku-thief', { at: { x: -2, y: 0, z: 0 } });
    const c = figure('paine-warrior', { at: { x: 0, y: 0, z: 1 } });
    const { stage } = stageOf({ yuna: a, rikku: b, paine: c });
    const o = { formMs: 100, flightMs: 300, tone: 'heal' as const, style: 'spark' as const };
    stage.toss('yuna', ['rikku'], o);
    stage.toss('rikku', ['paine'], o);
    expect(stage.playing).toBe(2);
    stage.toss('paine', ['yuna'], o);
    expect(stage.playing).toBe(3);
    stage.toss('yuna', ['rikku'], o);
    expect(stage.playing).toBe(3); // the pool is three: the oldest was cut and reused
    step(stage, 3000);
    expect(stage.playing).toBe(0);
  });
});
