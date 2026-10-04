/**
 * Morning ask 11 (D-346; FFX-2 only): the DRESSPHERE SHOT's push-in fallback (`pushIn.ts`). When the full close shot finds no clean
 * frame, or on the upright phone, the battle camera pushes a short way in on the girl who changes; the point it zooms on keeps its
 * place on screen, every frame of the push passes the shot's rules and the plate gate, and REDUCE MOTION is one static cut to the end.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Actor, Fig, Pose } from '../../src/engine/fx/mix/geometry.ts';
import { cameraAt, figBox } from '../../src/engine/fx/mix/geometry.ts';
import type { Field } from '../../src/engine/fx/mix/clearance.ts';
import { HeldShots, shotScore } from '../../src/engine/fx/mix/heldShots.ts';
import type { Plate } from '../../src/engine/fx/mix/plate.ts';
import { plateExcess, plateMiss } from '../../src/engine/fx/mix/plate.ts';
import { pushAt, pushCandidates, pushEnd, PUSH_SECONDS, searchPush } from '../../src/engine/fx/mix/pushIn.ts';
import type { RigWatch } from '../../src/engine/fx/mix/rigWatch.ts';

const W = 1600;
const H = 900;
const A = W / H;
const field = (panels: Field['panels'] = []): Field => ({ W, H, view: { l: 0, r: W, t: 0, b: H }, panels });
const fig = (x: number, z: number, h: number, id: string, enemy = false): Fig => ({ feet: new Vector3(x, 0, z), h, halfW: h * 0.25, enemy, id });
const master: Pose = { pos: new Vector3(0, 1.7, 12), look: new Vector3(0, 1.1, 0), fov: 32 };
const search = (figs: Fig[], subject: number, f: Field = field(), plate: Plate | null = null, m: Pose = master) =>
  searchPush({ master: m, subject, figs, field: f, lens: [0, 0], aspect: A, plate, rule: shotScore });
const px = (p: Vector3, pose: Pose): { x: number; y: number } => {
  const v = p.clone().project(cameraAt(pose, A));
  return { x: (v.x * 0.5 + 0.5) * W, y: (0.5 - v.y * 0.5) * H };
};

describe('the push-in is a dolly along the line to her: the point it aims at keeps its place on screen', () => {
  const g = fig(0.6, 0, 1.7, 'paine');
  it('the anchor stays on its pixel while she grows', () => {
    const c = { s: 0.3, anchor: 0.55, pan: [0, 0] as [number, number] };
    const end = pushEnd(master, g, A, c);
    const anchor = new Vector3(0.6, 1.7 * 0.55, 0);
    expect(px(anchor, end).x).toBeCloseTo(px(anchor, master).x, 1);
    expect(px(anchor, end).y).toBeCloseTo(px(anchor, master).y, 1);
    const hMaster = figBox(g, cameraAt(master, A), W, H);
    const hEnd = figBox(g, cameraAt(end, A), W, H);
    expect((hEnd.b - hEnd.t) / (hMaster.b - hMaster.t)).toBeGreaterThan(1.3); // about 1.4x: a small push
    expect(end.pos.distanceTo(master.pos)).toBeCloseTo(0.3 * master.pos.distanceTo(new Vector3(0.6, 1.7 * 0.55, 0)), 4);
    expect(end.fov).toBe(master.fov);
  });

  it('an aim shift moves her on screen by that share of the frame', () => {
    const still = pushEnd(master, g, A, { s: 0.2, anchor: 0.55, pan: [0, 0] });
    const shifted = pushEnd(master, g, A, { s: 0.2, anchor: 0.55, pan: [0.1, 0] });
    const a = new Vector3(0.6, 1.7 * 0.55, 0);
    expect(px(a, shifted).x - px(a, still).x).toBeGreaterThan(0.07 * W); // + = content moves right
  });

  it('is eased, arrives after PUSH_SECONDS and holds; REDUCE MOTION is the end framing at once', () => {
    const end = pushEnd(master, g, A, { s: 0.3, anchor: 0.55, pan: [0, 0] });
    const plan = { from: master, to: end, seconds: PUSH_SECONDS };
    expect(pushAt(plan, 0, false).pos.distanceTo(master.pos)).toBeLessThan(1e-9);
    const mid = pushAt(plan, PUSH_SECONDS / 2, false).pos.distanceTo(master.pos) / end.pos.distanceTo(master.pos);
    expect(mid).toBeCloseTo(0.5, 2);
    expect(pushAt(plan, PUSH_SECONDS * 3, false).pos.distanceTo(end.pos)).toBeLessThan(1e-9);
    expect(pushAt(plan, 0, true).pos.distanceTo(end.pos), 'REDUCE MOTION: one static cut to the end framing').toBeLessThan(1e-9);
    expect(pushAt(plan, 0.2, true).look.distanceTo(end.look)).toBeLessThan(1e-9);
  });

  it('prefers the larger small push first, a gentler one next, and tries no aim shift before one', () => {
    const c = pushCandidates();
    expect(c[0]).toEqual({ s: 0.3, anchor: 0.55, pan: [0, 0] });
    expect(c[1]!.pan).toEqual([0.05, 0]);
    expect(Math.max(...c.map((x) => x.s))).toBeLessThanOrEqual(0.42);
  });
});

describe('searchPush: the first push whose every frame passes', () => {
  const party = (): Fig[] => [fig(-1.1, 0.4, 1.7, 'yuna'), fig(0, 0, 1.7, 'rikku'), fig(1.1, 0.4, 1.7, 'paine'), fig(5, -2, 5, 'boss', true)];

  it('a clear scene takes the preferred push', () => {
    const r = search(party(), 1);
    expect(r.plan).not.toBeNull();
    expect(r.plan!.from).toBe(master);
    expect(r.note).toContain('push s0.3');
  });

  it('the subject whole and every other member whole or wholly out, at every sampled frame: a neighbour the push would crop is not accepted', () => {
    const figs = [fig(-3.9, 0, 1.7, 'yuna'), fig(0, 0, 1.7, 'rikku'), fig(5, -2, 5, 'boss', true)];
    const r = search(figs, 1);
    if (r.plan) {
      for (const u of [0.5, 0.75, 1]) {
        const cam = cameraAt(pushAt(r.plan, u * PUSH_SECONDS, false), A);
        const b = figBox(figs[0]!, cam, W, H);
        const inView = Math.max(0, Math.min(b.r, W) - Math.max(b.l, 0)) / (b.r - b.l);
        expect(inView > 0.97 || inView < 0.03, `Yuna at ${u}: ${inView}`).toBe(true);
      }
    }
    expect(r.note.length).toBeGreaterThan(0);
  });

  it('her face under a panel at the end of every push: no shot (null)', () => {
    // A panel across the whole upper-middle of the frame: her head is under it however the camera moves.
    const r = search(party(), 1, field([{ l: 300, r: 1300, t: 0, b: 500 }]));
    expect(r.plan).toBeNull();
  });

  it('the push never shows more of the plate edge than the master does', () => {
    // A plate hung behind the party, as wide as the master's view of it (+ a hair on the right), so a camera that slides right shows the void.
    const z = -10;
    const half = (12 - z) * Math.tan((32 * Math.PI) / 360) * A;
    const plate: Plate = { o: new Vector3(0, 6, z), u: new Vector3(1, 0, 0), v: new Vector3(0, 1, 0), n: new Vector3(0, 0, 1), hw: half + 0.05, hh: 20 };
    const figs = [fig(2.4, 0, 1.7, 'rikku'), fig(-1.2, 0, 1.7, 'yuna'), fig(5, -2, 5, 'boss', true)];
    const today = plateMiss(plate, master, W, H);
    const r = search(figs, 0, field(), plate);
    if (r.plan) for (const u of [0.5, 0.75, 1]) expect(plateExcess(plate, today, pushAt(r.plan, u * PUSH_SECONDS, false), W, H, [0, 0]), `at ${u}`).toBe(0);
    const free = search(figs, 0);
    expect(free.plan).not.toBeNull();
  });
});

describe('HeldShots: the fallback runs where the full shot finds nothing, never over a menu, and holds like the full shot', () => {
  const rigs = { write: () => undefined } as unknown as RigWatch;
  const girl = (name: string, x: number): Actor =>
    ({
      name, facing: 1, visible: true, lifeState: 'idle', pose: 'idle', poseUrls: { idle: `art/characters/${name}-gunner/idle.png` }, tweens: { size: 0 },
      worldHeight: 1.7, poseSize: [1, 1.7], scale: new Vector3(1, 1, 1), position: new Vector3(x, 0, 0), getWorldPosition: (v: Vector3) => v.set(x, 0, 0),
    }) as unknown as Actor;
  const canvas = (w: number, h: number) => ({ getBoundingClientRect: () => ({ left: 0, top: 0, right: w, bottom: h, width: w, height: h }) });
  let live: { w: number; h: number } = { w: W, h: H };
  const mount = (panels: { l: number; t: number; r: number; b: number }[] = []): void => {
    const c = canvas(live.w, live.h);
    const els = panels.map((p) => ({ getBoundingClientRect: () => ({ left: p.l, top: p.t, right: p.r, bottom: p.b, width: p.r - p.l, height: p.b - p.t }), className: 'x', parentElement: null, contains: () => false }));
    void els;
    (globalThis as { window?: unknown }).window = { innerWidth: live.w, innerHeight: live.h };
    (globalThis as { getComputedStyle?: unknown }).getComputedStyle = () => ({ display: 'block', visibility: 'visible', opacity: '1', backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none' });
    (globalThis as { document?: unknown }).document = {
      querySelector: (sel: string) => (sel.includes('canvas') ? c : null),
      querySelectorAll: () => [],
      documentElement: { dataset: {} },
    };
  };
  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { getComputedStyle?: unknown }).getComputedStyle;
    live = { w: W, h: H };
  });
  const o = (actors: Actor[], over: Record<string, unknown> = {}) => ({ actors, master, lens: [0, 0] as [number, number], odOn: false, scOn: true, menu: false, ready: true, ...over });

  it('on the phone only the push-in plays (the full shot is closed); under REDUCE MOTION it is the end framing at once; it is held 1.6 s and handed back when a menu opens', () => {
    mount();
    const a = girl('rikku', 0);
    const b = girl('paine', 1.1);
    const s = new HeldShots('ffx2', rigs);
    s.update(1 / 60, o([a, b], { phone: true, rm: true }));
    set(a, 'poseUrls', { idle: 'art/characters/rikku-songstress/idle.png' });
    const held = s.update(1 / 60, o([a, b], { phone: true, rm: true }));
    expect(held?.push, s.lastTry).toBeDefined();
    expect(s.stats.push).toBe(1);
    expect(s.stats.sc).toBe(0);
    expect(held!.pose.pos.distanceTo(held!.push!.to.pos), 'REDUCE MOTION: the end framing on the first frame').toBeLessThan(1e-9);
    expect(s.holdMs()).toBeGreaterThan(1500);
    // The slice moving under it (the phone's HUD slides) ends it.
    live = { w: W + 40, h: H };
    mount();
    expect(s.update(1 / 60, o([a, b], { phone: true, rm: true }))).toBeNull();
    expect(s.stats.slideBacks).toBe(1);
  });

  it('a menu opening hands the push-in back at once, and no push is started while a menu is open', () => {
    mount();
    const a = girl('rikku', 0);
    const b = girl('paine', 1.1);
    const s = new HeldShots('ffx2', rigs);
    s.update(1 / 60, o([a, b], { phone: true }));
    set(a, 'poseUrls', { idle: 'art/characters/rikku-songstress/idle.png' });
    expect(s.update(1 / 60, o([a, b], { phone: true, menu: true }))).toBeNull();
    expect(s.stats.push).toBe(0);
    set(a, 'poseUrls', { idle: 'art/characters/rikku-gunner/idle.png' });
    s.update(1 / 60, o([a, b], { phone: true }));
    set(a, 'poseUrls', { idle: 'art/characters/rikku-songstress/idle.png' });
    expect(s.update(1 / 60, o([a, b], { phone: true }))?.push).toBeDefined();
    expect(s.update(1 / 60, o([a, b], { phone: true, menu: true }))).toBeNull();
  });

  it('the push moves the pose each frame and arrives at the end framing after PUSH_SECONDS (no REDUCE MOTION)', () => {
    mount();
    const a = girl('rikku', 0);
    const b = girl('paine', 1.1);
    const s = new HeldShots('ffx2', rigs);
    s.update(1 / 60, o([a, b], { phone: true }));
    set(a, 'poseUrls', { idle: 'art/characters/rikku-songstress/idle.png' });
    const first = s.update(1 / 60, o([a, b], { phone: true }))!;
    const p0 = first.pose.pos.clone();
    expect(p0.distanceTo(first.push!.from.pos), 'starts at the battle camera: no cut').toBeLessThan(0.05);
    for (let i = 0; i < 30; i++) s.update(1 / 60, o([a, b], { phone: true }));
    const half = s.held!.pose.pos.distanceTo(first.push!.from.pos);
    expect(half).toBeGreaterThan(0.2);
    for (let i = 0; i < 60; i++) s.update(1 / 60, o([a, b], { phone: true }));
    expect(s.held!.pose.pos.distanceTo(first.push!.to.pos)).toBeLessThan(1e-6);
  });
});

function set(a: Actor, k: string, v: unknown): void {
  (a as unknown as Record<string, unknown>)[k] = v;
}
