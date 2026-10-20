/**
 * Pass 3's doll throw (`?anim=proto&style=P3`; FFX Lulu; plumbing for both games): the attack is a doll flown from the hand to the target's place in the painting and landing on the clip's contact mark (the game's
 * frame 20), a rebound and a return to the hand; Lulu stays where she is (the presenter's lunge carries her nowhere); the doll's own bob is held while it is away; with no aim, or in pass 2's style, the doll rides the
 * hand as it always did. The path between hand and target is ours (the game's motion data was read for frame counts only).
 */
import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'three';
import { DollThrow, type DollSpec, type ThrowAt } from '../../../src/engine/rig/anim/AnimDoll.ts';
import { RigAnimator, type AnimFrame } from '../../../src/engine/rig/anim/RigAnimator.ts';
import { STYLE_P2, STYLE_P3, animFromQuery } from '../../../src/engine/rig/anim/AnimStyles.ts';
import { LULU } from '../../../src/engine/rig/anim/LuluAnim.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import { frameMs } from '../../../src/engine/rig/anim/AnimRE.ts';
import { paintPointOf } from '../../../src/engine/rig/RigPaint.ts';
import { carrySkeleton } from '../../../tools/rig/lane/anim-draw.mjs';
import { clipRigOf } from '../../../tools/rig/lane/anim-rig.mjs';
import { normaliseRig } from '../../../tools/rig/rig-format.mjs';
import { HAVE_RIG, LULU_V2, near } from './anim-pass2-fixture.ts';
import { readFileSync } from 'node:fs';
import { Group, Matrix4, PerspectiveCamera } from 'three';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const SPEC: DollSpec = STYLE_P3.p3!.doll;
const out = (): ThrowAt => ({ x: 0, y: 0, rot: 0 });

describe('the throw\'s path', () => {
  const hand = { x: 800, y: 1000 };
  const aim = { x: 300, y: 400 };
  const contact = 255;
  const dist = Math.hypot(aim.x - hand.x, aim.y - hand.y);
  const mk = (): DollThrow => {
    const d = new DollThrow(SPEC);
    d.aim = aim;
    return d;
  };

  it('rides the hand before it leaves, and with no aim it never leaves', () => {
    const d = mk();
    expect(d.at(hand, SPEC.departMs - 1, contact, out())).toBe(false);
    expect(d.active(SPEC.departMs - 1, contact)).toBe(false);
    d.aim = null;
    expect(d.at(hand, 150, contact, out())).toBe(false);
    expect(d.active(150, contact)).toBe(false);
  });
  it('leaves the hand at the depart time, is exactly on the aim at the contact mark, and has turned once', () => {
    const d = mk();
    const o = out();
    expect(d.at(hand, SPEC.departMs, contact, o)).toBe(true);
    near(o.x, hand.x, 1e-6);
    near(o.y, hand.y, 1e-6);
    near(o.rot, 0, 1e-9);
    expect(d.at(hand, contact, contact, o)).toBe(true);
    near(o.x, aim.x, 1e-6);
    near(o.y, aim.y, 1e-6);
    near(o.rot, Math.PI * 2 * SPEC.turns, 1e-9);
  });
  it('arcs above the straight line between hand and target in the middle of the flight', () => {
    const d = mk();
    const o = out();
    const tMid = SPEC.departMs + (contact - SPEC.departMs) / 2;
    d.at(hand, tMid, contact, o);
    const p = 0.5 ** 1.35; // the flight's ease
    const lineY = hand.y + (aim.y - hand.y) * p;
    expect(o.y).toBeLessThan(lineY - SPEC.arc * dist * 0.5); // higher on screen (y grows down)
  });
  it('is continuous at the contact (the flight\'s end is the return\'s start), rebounds off the target, and is back on the hand when the return ends', () => {
    const d = mk();
    const a = out();
    const b = out();
    d.at(hand, contact - 0.01, contact, a);
    d.at(hand, contact + 0.01, contact, b);
    near(a.x, b.x, 0.2);
    near(a.y, b.y, 0.2);
    d.at(hand, contact + SPEC.returnMs * 0.12, contact, b);
    expect(Math.hypot(b.x - aim.x, b.y - aim.y)).toBeGreaterThan(SPEC.rebound * dist * 0.1); // it came off the target
    expect(Math.hypot(b.x - hand.x, b.y - hand.y)).toBeGreaterThan(Math.hypot(aim.x - hand.x, aim.y - hand.y) * 0.4); // and is not home yet
    expect(d.at(hand, contact + SPEC.returnMs - 0.01, contact, b)).toBe(true);
    near(b.x, hand.x, 1);
    near(b.y, hand.y, 1);
    near(b.rot, Math.PI * 2 * SPEC.turns * 2, 0.01); // two whole turns in all: the doll looks as it did when it left
    expect(d.at(hand, contact + SPEC.returnMs + 1, contact, b)).toBe(false);
    expect(d.active(contact + SPEC.returnMs + 1, contact)).toBe(false);
  });
  it('follows the hand on the way home (the hand moves; the doll comes to where it is then)', () => {
    const d = mk();
    const b = out();
    const hand2 = { x: 600, y: 900 };
    d.at(hand2, contact + SPEC.returnMs - 0.01, contact, b);
    near(b.x, hand2.x, 1);
    near(b.y, hand2.y, 1);
  });
});

describe('the style', () => {
  it('P3 is P2 (its clock, its clips, its orb toss) with the throw on top; P2 has none', () => {
    expect(STYLE_P3.p2).toBe(STYLE_P2.p2);
    expect(STYLE_P3.p3?.doll).toBeDefined();
    expect(STYLE_P2.p3).toBeUndefined();
    expect(animFromQuery('?anim=proto&style=P3')).toBe(STYLE_P3);
    expect(animFromQuery('?anim=proto&style=p3')?.id).toBe('P3');
    expect(animFromQuery('?anim=proto&style=P2')).toBe(STYLE_P2);
    expect(STYLE_P3.item).toEqual(STYLE_P2.item); // the orb toss exactly as Bailey liked it
    expect(STYLE_P3.p2!.orbFlight).toBe(420);
  });
});

const real = HAVE_RIG ? describe : describe.skip;
function luluAnimator(style: typeof STYLE_P3) {
  const { rt } = normaliseRig(JSON.parse(readFileSync(`${LULU_V2}/rig.json`, 'utf8')), { dir: LULU_V2 });
  if (!rt) throw new Error('the rig is refused');
  const clipRig = clipRigOf(rt, Boolean(style.p3)); // P3: the pseudo-bone for the knee's bend
  const sk = carrySkeleton(rt);
  const an = new RigAnimator({ ...clipRig, bones: rt.bones, skeleton: sk } as never, style, LULU, 1280);
  const dollIdx = clipRig.boneIndex.get('doll')!;
  const work = Float64Array.from(clipRig.keys.get('ready')!);
  const vel = new Float64Array(clipRig.channels);
  const frame = (dt = 1 / 60): AnimFrame => ({ dt, rate: 1, forward: 0, calm: false });
  /** The doll's joint now, painting px. */
  const joint = (): { x: number; y: number } => {
    sk.solve(work);
    return { x: sk.m[dollIdx * 6 + 4]!, y: sk.m[dollIdx * 6 + 5]! };
  };
  return { an, work, vel, frame, joint, sk, rt };
}

real('the throw on Lulu\'s real rig', () => {
  /** Play the attack as the presenter drives it: the wind-up from the ready stance, the strike scheduled on a lunge's apex; the doll's joint per frame. */
  function attack(style: typeof STYLE_P3, aim: { x: number; y: number } | null) {
    const a = luluAnimator(style);
    a.an.request('ready', 'idle', a.work, a.vel);
    a.an.begin('attack', a.work, a.vel);
    a.an.setAim(aim);
    const lead = a.an.lead('attack');
    const frames: Array<{ ms: number; j: { x: number; y: number }; events: string[] }> = [];
    let ms = 0;
    let lunged = false;
    for (let i = 0; i < 160; i++) {
      if (!lunged && ms >= lead) {
        a.an.lunge(440, ATTACK_IMPACT);
        lunged = true;
      }
      a.an.step(a.frame(), a.work, a.vel);
      ms += 1000 / 60;
      frames.push({ ms, j: a.joint(), events: a.an.drain() });
    }
    return { a, frames, lead };
  }
  const AIM = { x: 120, y: 420 };

  it('the doll is on the aim at the contact frame to within a frame\'s travel, then comes back to the hand', () => {
    const { a, frames } = attack(STYLE_P3, AIM);
    const i = frames.findIndex((f) => f.events.includes('contact'));
    expect(i).toBeGreaterThan(5);
    const d = (k: number): number => Math.hypot(frames[k]!.j.x - AIM.x, frames[k]!.j.y - AIM.y);
    // the contact mark falls between two frames: the nearer of the last flight frame (a frame's travel at the flight's fastest, 1.35 x the distance over the flight time per 1/60 s, is 10 percent of it) and the first
    // return frame (a rebound moves 4 percent a frame) is within 8 percent of the distance flown of the aim
    const flown = Math.hypot(AIM.x - frames[0]!.j.x, AIM.y - frames[0]!.j.y);
    const closest = Math.min(d(i - 1), d(i), d(i + 1));
    expect(closest).toBeLessThan(0.08 * flown + 3);
    // and exactly on the aim at the mark itself (the unit test of the path above): here a frame is as close as a frame gets
    // and long before the contact the doll is nowhere near the aim (it rides the hand), at the end it is back by the hand
    expect(d(2)).toBeGreaterThan(300);
    const last = frames[frames.length - 1]!;
    expect(Math.hypot(last.j.x - AIM.x, last.j.y - AIM.y)).toBeGreaterThan(300);
    void a;
  });
  it('with no aim, or in pass 2\'s style, the doll rides the hand exactly as before', () => {
    const none = attack(STYLE_P3, null).frames;
    const p2 = attack(STYLE_P2, AIM).frames;
    for (let k = 0; k < none.length; k++) {
      near(none[k]!.j.x, p2[k]!.j.x, 1e-6);
      near(none[k]!.j.y, p2[k]!.j.y, 1e-6);
    }
    expect(none.length).toBe(p2.length);
  });
  it('the contact lands on the game\'s frame 20 from the start of the wind-up (pass 2\'s clock, unchanged)', () => {
    const { frames, lead } = attack(STYLE_P3, AIM);
    const i = frames.findIndex((f) => f.events.includes('contact'));
    // the lunge is asked for after the wind-up's lead; its apex is ATTACK_IMPACT of 440 ms later and the strike's contact is scheduled on it
    near(frames[i]!.ms, lead + 440 * ATTACK_IMPACT, 40);
    near(lead + 440 * ATTACK_IMPACT, frameMs(20), 40);
  });
  it('the throw is aimed in the painting\'s px and only the doll moves: the hand, the arm and the head are where pass 2 had them', () => {
    const a = luluAnimator(STYLE_P3);
    const b = luluAnimator(STYLE_P2);
    for (const x of [a, b]) {
      x.an.request('ready', 'idle', x.work, x.vel);
      x.an.begin('attack', x.work, x.vel);
    }
    a.an.setAim(AIM);
    const dollIdx = a.rt.bones.findIndex((bn: { name: string }) => bn.name === "doll");
    let lunged = false;
    for (let i = 0; i < 80; i++) {
      if (!lunged && i * (1000 / 60) >= a.an.lead('attack')) {
        a.an.lunge(440, ATTACK_IMPACT);
        b.an.lunge(440, ATTACK_IMPACT);
        lunged = true;
      }
      a.an.step(a.frame(), a.work, a.vel);
      b.an.step(b.frame(), b.work, b.vel);
      for (let c = 0; c < a.rt.bones.length * 5; c++) {
        if (Math.floor(c / 5) === dollIdx) continue;
        near(a.work[c]!, b.work[c]!, 1e-9);
      }
    }
  });
});

describe('where the painting\'s px are in the world (RigPaint.paintPointOf)', () => {
  const frame = (camera: PerspectiveCamera | null) => {
    const plane = new Group();
    plane.scale.set(2.2, 2.0, 1);
    const inner = new Group();
    inner.position.set(0.3, 0.1, 0);
    inner.updateMatrix();
    return { position: { x: 1, y: 0, z: 0 }, plane, inner, image: { w: 1000, h: 2000 }, camera };
  };
  /** The same transform `RigActor.landmark` applies (px to the actor's local space) plus the position. */
  const forward = (f: ReturnType<typeof frame>, px: number, py: number): { x: number; y: number } => {
    f.plane.updateMatrix();
    f.inner.updateMatrix();
    const v = { x: px / f.image.w - 0.5, y: 0.5 - py / f.image.h, z: 0 };
    const m = new Matrix4().multiplyMatrices(f.inner.matrix, f.plane.matrix);
    const e = m.elements;
    return { x: f.position.x + e[0]! * v.x + e[4]! * v.y + e[12]!, y: f.position.y + e[1]! * v.x + e[5]! * v.y + e[13]! };
  };
  it('undoes landmark\'s mapping with no camera drawn yet', () => {
    const f = frame(null);
    const w = forward(f, 640, 700);
    const back = paintPointOf({ x: w.x, y: w.y, z: 0 }, f)!;
    near(back.x, 640, 1e-6);
    near(back.y, 700, 1e-6);
  });
  it('through a camera: a target far behind the figure is found where it APPEARS on the figure\'s plane, not at its own x and y', () => {
    const cam = new PerspectiveCamera(30, 16 / 9, 0.1, 100);
    cam.position.set(3, 1, 10);
    cam.lookAt(1, 1, 0);
    cam.updateMatrixWorld(true);
    const f = frame(cam);
    const target = { x: 1.5, y: 2.4, z: -6 };
    const flat = paintPointOf(target, frame(null))!;
    const seen = paintPointOf(target, f)!;
    expect(Math.hypot(flat.x - seen.x, flat.y - seen.y)).toBeGreaterThan(50); // parallax: the two differ
    // the seen point, put back into the world on the figure's plane, lies on the camera's ray to the target
    const w = forward(f, seen.x, seen.y);
    const eye = { x: 3, y: 1, z: 10 };
    const s = (0 - eye.z) / (target.z - eye.z);
    near(w.x, eye.x + (target.x - eye.x) * s, 1e-6);
    near(w.y, eye.y + (target.y - eye.y) * s, 1e-6);
  });
  it('answers null for a target on the camera\'s own level plane (no ray), and for a target behind the camera', () => {
    const cam = new PerspectiveCamera(30, 1, 0.1, 100);
    cam.position.set(0, 1, 10);
    cam.updateMatrixWorld(true);
    expect(paintPointOf({ x: 0, y: 1, z: 10 }, frame(cam))).toBeNull();
    expect(paintPointOf({ x: 0, y: 1, z: 20 }, frame(cam))).toBeNull();
  });
});

describe('the actor: she stays where she is while the doll is thrown', () => {
  it('with the throw on, a lunge asked of the actor is a lunge of no distance (the apex, the hold and the strike\'s timing are the presenter\'s and unchanged); with pass 2\'s style it carries her', async () => {
    const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
    const { PaintedActor } = await import('../../../src/engine/PaintedActor.ts');
    const { readRig } = await import('../../../src/engine/rig/RigData.ts');
    if (!HAVE_RIG) return;
    const file = JSON.parse(readFileSync(`${LULU_V2}/rig.json`, 'utf8'));
    const r = readRig(file);
    if (!r.ok) throw new Error(r.reason);
    const make = (style: typeof STYLE_P3) =>
      RigActor.createRigged({ name: 'lulu', worldHeight: 1.82, side: 'party', shadow: false }, { data: r.data, base: '/art/rigs/lulu', idlePainting: { texture: new Texture(), meta: { width: r.data.image.w, height: r.data.image.h, baselineY: r.data.baselineY }, placeholder: false, url: '/art/characters/lulu/idle.png' }, loadTexture: async () => new Texture(), anim: style });
    const spy = vi.spyOn(PaintedActor.prototype, 'lunge');
    const p3 = await make(STYLE_P3);
    void p3.lunge(1.4, 440, undefined, 1.4);
    expect(spy.mock.calls.at(-1)![0]).toBe(0);
    expect(spy.mock.calls.at(-1)![3]).toBe(0);
    const p2 = await make(STYLE_P2);
    void p2.lunge(1.4, 440, undefined, 1.4);
    expect(spy.mock.calls.at(-1)![0]).toBe(1.4);
    expect(spy.mock.calls.at(-1)![3]).toBe(1.4);
    spy.mockRestore();
  });
});
