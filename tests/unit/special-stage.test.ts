/**
 * Tests 4 and 14, the stage-integrated cases, of the FFX-2 Special look (step C2; game case: FFX-2 only in what is seen; the stage hooks are shared plumbing for both games, inert while no form is
 * registered): the REAL `PaintedStage` with `PaintedActor.create` recorded, not run (it needs a WebGL canvas), the way `engine/stage-party-stature.test.ts` does it.
 *
 * Held here: a re-stage with a form up leaves exactly one painted actor per id, two stubs, and the parked girls (off the field); no formation pass moves a stub and no part is ever asked for art;
 * `projectRect(part)` is the figure's rectangle in the mask-tolerance in mode (a) and the part's own box in (b); in a scene WITHOUT `formHeights` (Chapters IV and V) the Special stands at the
 * fitted 2.82 / 2.64 / 2.82 at 1600 x 900 and 2.09 / 1.82 / 2.09 at 390 x 844, no stature is recorded, and the exit's `setArt` returns the girl to the shared 1.82; the phase floor centre, the StageArt
 * party list and the smear's warm figure ignore a stub; with no form `placeAnchored` runs nothing (Chapter V's Bulwark keeps its anchor object) and `actor(id)` is the figure itself; `actor(part)` is
 * the part's handle and `actor(main)` the hit-gated figure while a form is up.
 *
 * `PhaseLighting.figures` still lists a stub: it lists every anchored part today (Chapter V's Bulwarks), and a filter there would change that OFF; a figure-less actor has no painting to light.
 *
 * Fails without the feature: every case that registers a form (no `setForm`).
 */

import { Group, Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const created: Array<Record<string, unknown>> = [];
const resolved: string[][] = [];
type Fig = Object3D & Record<string, unknown>;
const figures: Fig[] = [];

vi.mock('../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const { SPECIAL_PARTS: table } = await import('../../src/data/art/specialParts.ts'); // the recorded figure's content box is its Special's idle whole-figure box (or a plain box for anyone else)
      const own = Object.values(table).find((row) => row.artId.startsWith(String(o['name']) + '-'));
      const box: [number, number, number, number] = own?.poses['idle']?.whole.box ?? [272, 196, 1180, 1340];
      const f = new Object3D() as Fig;
      f.name = String(o['name']);
      f['worldHeight'] = Number(o['worldHeight']);
      Object.defineProperty(f, 'height', { get: () => f['worldHeight'] as number });
      f['mirrored'] = false;
      f['pose'] = 'idle';
      f['alpha'] = 1;
      f['setPose'] = (): void => {};
      f['setAlpha'] = (a: number): void => { f['alpha'] = a; };
      f['fadeTo'] = async (a: number): Promise<void> => { f['alpha'] = a; };
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      f['update'] = (): void => {};
      f['setPerch'] = (): void => {};
      f['loadPoses'] = async (): Promise<void> => {};
      f['setWorldHeight'] = (h: number): void => { f['worldHeight'] = h; };
      // a plane 0.8 h wide and h tall with its feet on the ground point: (u, t) are the painting's fractions
      f['paintPoint'] = (u: number, t: number, out = new Vector3()): Vector3 => {
        const h = f['worldHeight'] as number;
        f.updateWorldMatrix(true, false);
        return out.set((u - 0.5) * 0.8 * h, (1 - t) * h, 0).applyMatrix4(f.matrixWorld);
      };
      f['contentQuad'] = (out?: [Vector3, Vector3, Vector3, Vector3]) => {
        const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
        const p = (u: number, t: number, to: Vector3): void => void (f['paintPoint'] as (u: number, t: number, o: Vector3) => Vector3)(u, t, to);
        const [x0, y0, x1, y1] = box;
        p(x0 / 1536, y1 / 1536, q[0]); p(x1 / 1536, y1 / 1536, q[1]); p(x1 / 1536, y0 / 1536, q[2]); p(x0 / 1536, y0 / 1536, q[3]);
        return q;
      };
      f['centerPoint'] = (out: Vector3) => out.set(f.position.x, 0.52 * (f['worldHeight'] as number), f.position.z);
      f['headPoint'] = (out: Vector3) => out.set(f.position.x, f['worldHeight'] as number, f.position.z);
      figures.push(f);
      return f;
    }),
  },
}));
vi.mock('../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => {
    resolved.push([...ids]);
    return { artId: ids[0] ?? 'unknown', poses: {} };
  }),
  resolvePoseMap: vi.fn(async () => ({})),
}));

const { PaintedStage } = await import('../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../src/engine/BattleCamera.ts');
const { STATURE_KEY } = await import('../../src/engine/PartyStature.ts');
const { setSpecialLook, specialFitGirls } = await import('../../src/engine/SpecialStaging.ts');
const { SPECIAL_PARTS } = await import('../../src/data/art/specialParts.ts');

import type { BattleState } from '../../src/battle/common/types.ts';
import type { SceneSlots } from '../../src/scenes/index.ts';
import type { StageForm } from '../../src/engine/SpecialStaging.ts';

const GIRLS = [
  { id: 'yuna', special: 'floral-fallal', art: 'yuna-floral-fallal', pods: ['floral-fallal-right-pistil', 'floral-fallal-left-pistil'], slot: 0, desktop: 2.82, phone: 2.09 },
  { id: 'rikku', special: 'machina-maw', art: 'rikku-machina-maw', pods: ['machina-maw-smasher-r', 'machina-maw-crusher-l'], slot: 1, desktop: 2.64, phone: 1.82 },
  { id: 'paine', special: 'full-throttle', art: 'paine-full-throttle', pods: ['full-throttle-right', 'full-throttle-left'], slot: 2, desktop: 2.82, phone: 2.09 },
] as const;

// no `formHeights`: Chapters IV and V
const SLOTS: SceneSlots = {
  party: [[-1.95, 0, 1.5], [-3.15, 0, 0.25], [-1.35, 0, -0.95]],
  enemy: [[3, 0, -2.6], [4.5, 0, -1.2]],
  partyHeight: 1.82,
  enemyHeight: 4.1,
};

function stageFor(w: number, h: number, slots: SceneSlots = SLOTS, rig: { position: number[]; lookAt: number[]; fov: number } = { position: [0, 3, 12], lookAt: [0, 1.5, 0], fov: 28 }) {
  const cam = new PerspectiveCamera(rig.fov, w / h, 0.1, 100);
  cam.position.set(rig.position[0]!, rig.position[1]!, rig.position[2]!);
  cam.lookAt(rig.lookAt[0]!, rig.lookAt[1]!, rig.lookAt[2]!);
  cam.updateMatrixWorld();
  const canvas = { clientWidth: w, clientHeight: h, getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }) } as unknown as HTMLCanvasElement;
  return new PaintedStage({ scene: new Scene(), camera: cam, battleCamera: new BattleCamera(cam, { rigs: { idle: { position: rig.position as [number, number, number], lookAt: rig.lookAt as [number, number, number] } } }), slots, canvas });
}
type Stage = ReturnType<typeof stageFor>;

const member = (id: string, slot: number, side: 'party' | 'enemy', extra: Record<string, unknown> = {}) =>
  ({ id, name: id, side, slot, alive: true, removed: false, spriteKey: id, flags: {}, ...extra });

/** A Chapter IV-like state: the girls on their gunner paintings, two foes; with `form`, the girl's three parts are the active ids. */
function stateOf(form?: (typeof GIRLS)[number]): BattleState {
  const combatants: Record<string, unknown> = {};
  for (const g of GIRLS) combatants[g.id] = member(g.id, g.slot, 'party', { level: 30, dresspheres: { current: g.id === form?.id ? g.special : 'gunner' } });
  for (const g of GIRLS) for (const p of g.pods) combatants[p] = member(p, 3, 'party', { level: 30 });
  combatants['bahamut'] = member('bahamut', 0, 'enemy', { flags: { isBoss: true } });
  combatants['wing'] = member('wing', 1, 'enemy');
  const active = form ? [form.id, ...form.pods] : GIRLS.map((g) => g.id);
  return { game: 'ffx2', combatants, activeIds: active, reserveIds: [], enemyIds: ['bahamut', 'wing'], aeonId: null, flags: {} } as unknown as BattleState;
}

const formOf = (g: (typeof GIRLS)[number]): StageForm => ({ girl: g.id, special: g.special, main: g.id, right: g.pods[0], left: g.pods[1], parked: GIRLS.filter((x) => x.id !== g.id).map((x) => x.id), gate: { blocked: false } });

/** The entry's stage calls, as the presenter makes them. */
async function enter(stage: Stage, g: (typeof GIRLS)[number]): Promise<StageForm> {
  const form = formOf(g);
  stage.setForm(form);
  await stage.addCombatant(g.pods[0], { artId: '', side: 'party', slot: 3 + 2 * g.slot });
  await stage.addCombatant(g.pods[1], { artId: '', side: 'party', slot: 4 + 2 * g.slot });
  await stage.setArt(g.id, g.art);
  return form;
}

/** One frame's `placeAnchored` for every staged figure (`update` needs the whole GPU kit the recorded actors do not have). */
const place = (stage: Stage): void => stage.staged().forEach((id) => (stage as unknown as { placeAnchored(id: string): void }).placeAnchored(id));

const figureOf = (id: string): Fig => figures.filter((f) => f.name === id).at(-1)!;
const countOf = (id: string): number => created.filter((o) => o['name'] === id).length;

beforeEach(() => {
  created.length = 0;
  resolved.length = 0;
  figures.length = 0;
  setSpecialLook(null);
});
afterEach(() => setSpecialLook(null));

describe('with no form up (every shipped chapter)', () => {
  it('actor(id) is the figure itself, figureEnv().slots is the stage\'s own object, and nothing is registered', async () => {
    const stage = stageFor(1600, 900);
    await stage.stage(stateOf());
    for (const g of GIRLS) expect(stage.actor(g.id)).toBe(figureOf(g.id));
    expect((stage as unknown as { figureEnv(): { slots: SceneSlots } }).figureEnv().slots).toBe(SLOTS);
  });

  it('placeAnchored runs nothing: a Bulwark-like anchored part keeps its anchor object', async () => {
    const anchor = { mode: 'onParent' as const, px: [100, 100] as [number, number], chestPx: [100, 90] as [number, number], paint: { width: 200, height: 200, baselineY: 190, contentTop: 10 }, ring: { radius: 0.5, ground: false } };
    const slots = { ...SLOTS, partAnchors: { wing: anchor } } as unknown as SceneSlots;
    const stage = stageFor(1600, 900, slots);
    const state = stateOf();
    (state.combatants['wing'] as unknown as { flags: Record<string, unknown> }).flags = { isPart: true, partOf: 'bahamut' };
    await stage.stage(state);
    const staged = (stage as unknown as { actors: Map<string, { anchor: unknown }> }).actors.get('wing')!;
    expect(staged.anchor).toBe(anchor);
    (stage as unknown as { placeAnchored(id: string): void }).placeAnchored('wing');
    expect(staged.anchor).toBe(anchor);
  });
});

describe.each(GIRLS)('a form up: $id', (g) => {
  it('stands at the fitted height in a scene with no formHeights, records no stature, and the exit returns her to 1.82', async () => {
    for (const [w, h, key] of [[1600, 900, 'desktop'], [390, 844, 'phone']] as const) {
      created.length = 0;
      const stage = stageFor(w, h);
      await stage.stage(stateOf());
      await enter(stage, g);
      expect(figureOf(g.id)['worldHeight'], `${g.id} at ${w}x${h}`).toBeCloseTo(g[key], 2);
      expect(figureOf(g.id).userData[STATURE_KEY], 'no stature').toBeUndefined();
      expect(g[key] / 1.82).toBeCloseTo(specialFitGirls(g.art, key, 4.1 / 1.82)!, 2);
      await stage.setArt(g.id, `${g.id}-gunner`);
      expect(figureOf(g.id)['worldHeight']).toBeCloseTo(1.82, 6);
      expect(figureOf(g.id).userData[STATURE_KEY]).toBeUndefined();
    }
  });

  it('a re-stage with the form up leaves one painted actor per id, two stubs and the parked girls off the field; no part is asked for art', async () => {
    const stage = stageFor(1600, 900);
    await stage.stage(stateOf());
    const form = await enter(stage, g);
    created.length = 0;
    resolved.length = 0;
    await stage.stage(stateOf(g));
    expect(new Set(stage.staged())).toEqual(new Set([...GIRLS.map((x) => x.id), ...g.pods, 'bahamut', 'wing']));
    expect(countOf(g.id)).toBe(1);
    for (const id of form.parked) {
      expect(stage.actor(id)?.alpha ?? 0, `${id} is held off`).toBe(0);
    }
    for (const p of g.pods) expect(resolved.filter((ids) => ids.includes(p)), `${p} asked for no art`).toEqual([]);
    expect(resolved.some((ids) => ids.length === 0)).toBe(true);
  });

  it('no formation pass moves a stub, and no key-feature box is listed for one', async () => {
    const stage = stageFor(1600, 900);
    await stage.stage(stateOf());
    await enter(stage, g);
    place(stage);
    const before = g.pods.map((p) => figureOf(p).position.toArray());
    stage.applyFormation();
    stage.relaxFormation();
    expect(g.pods.map((p) => figureOf(p).position.toArray())).toEqual(before);
    expect(stage.keyFeatureRects()).toEqual([]);
  });

  it('projectRect(part) is the figure\'s rectangle (within the mask tolerance) under (a) and the part\'s own box under (b)', async () => {
    for (const mark of ['a', 'b'] as const) {
      setSpecialLook({ mark });
      const stage = stageFor(1600, 900);
      await stage.stage(stateOf());
      await enter(stage, g);
      place(stage);
      const whole = stage.projectRect(g.id)!;
      const part = stage.projectRect(g.pods[0])!;
      if (mark === 'a') {
        for (const k of ['x', 'y', 'w', 'h'] as const) expect(part[k], k).toBeCloseTo(whole[k], 0);
      } else {
        const apart = (['x', 'y', 'w', 'h'] as const).reduce((a, k) => a + Math.abs(part[k] - whole[k]), 0);
        expect(apart, 'the part box is its own, not the figure box').toBeGreaterThan(5);
      }
    }
  });

  it('the phase floor centre, the StageArt party list and the smear\'s warm figure ignore a stub', async () => {
    const stage = stageFor(1600, 900);
    await stage.stage(stateOf());
    await enter(stage, g);
    place(stage);
    const centre = (stage as unknown as { partyFloorCentre(): { x: number; z: number } }).partyFloorCentre();
    const girls = GIRLS.map((x) => figureOf(x.id).position);
    expect(centre.x).toBeCloseTo(girls.reduce((a, p) => a + p.x, 0) / 3, 6);
    expect(centre.z).toBeCloseTo(girls.reduce((a, p) => a + p.z, 0) / 3, 6);
    const art = (stage as unknown as { art: { deps: { party(): Iterable<unknown> } } }).art;
    expect([...art.deps.party()]).toHaveLength(3);
  });

  it('actor(part) is the part\'s handle (not the stub), actor(main) the hit-gated figure; dropping the form gives the plain figure back', async () => {
    const stage = stageFor(1600, 900);
    await stage.stage(stateOf());
    const form = await enter(stage, g);
    const figure = figureOf(g.id);
    expect(stage.actor(g.pods[0])).not.toBe(figureOf(g.pods[0]));
    expect(stage.actor(g.pods[0])).not.toBe(figure);
    expect(stage.actor(g.id)).not.toBe(figure);
    expect((stage.actor(g.id) as unknown as { name: string }).name).toBe(g.id);
    expect(stage.actor('bahamut')).toBe(figureOf('bahamut'));
    form.gate.blocked = true;
    stage.setForm(null);
    expect(stage.actor(g.id)).toBe(figure);
    expect(stage.actor(g.pods[0])).toBe(figureOf(g.pods[0]));
  });
});

describe('the part mark (b)', () => {
  it('markParts lights the aimed-at parts under (b) and is a no-op under (a) and with no form', async () => {
    const g = GIRLS[0]!;
    const seen = (stage: Stage) => stage.partRingSnapshot().map((r: { id: string; lit?: boolean }) => `${r.id}:${r.lit === true}`).sort();
    const stage = stageFor(1600, 900);
    await stage.stage(stateOf());
    stage.markParts([g.pods[0]]); // no form: nothing
    await enter(stage, g);
    const before = seen(stage);
    stage.markParts([g.pods[0]]); // (a): nothing
    expect(seen(stage)).toEqual(before);
    setSpecialLook({ mark: 'b' });
    const b = stageFor(1600, 900);
    await b.stage(stateOf());
    await enter(b, g);
    const spy = vi.spyOn((b as unknown as { partRings: { setMark(id: string, on: boolean): void } }).partRings, 'setMark');
    b.markParts([g.pods[0]]);
    expect(spy.mock.calls).toEqual([[g.pods[0], true], [g.pods[1], false]]);
    b.markParts([]);
    expect(spy.mock.calls.slice(2)).toEqual([[g.pods[0], false], [g.pods[1], false]]);
  });

  it('the anchor table is the rows the stage reads: the idle row of the table is the figure\'s box', () => {
    for (const g of GIRLS) expect(SPECIAL_PARTS[g.special].poses['idle']!.whole.box).toHaveLength(4);
  });
});

// ---------------------------------------------------------------- test 14: the framing, at each girl's own slot

const { BEVELLE_UNDERGROUND_RIGS, BEVELLE_UNDERGROUND_SLOTS } = await import('../../src/scenes/bevelle-underground.ts');
const { FARPLANE_SLOTS } = await import('../../src/scenes/farplane.ts');

describe.each([
  { name: 'Chapter IV (the Bevelle underground)', slots: BEVELLE_UNDERGROUND_SLOTS, rig: BEVELLE_UNDERGROUND_RIGS.idle },
  { name: 'Chapter V (the Farplane)', slots: FARPLANE_SLOTS as unknown as SceneSlots, rig: { position: [0, 3, 9.6], lookAt: [0.5, 1.45, -1.4], fov: 32 } },
])('the framing on the idle camera of ', ({ slots, rig }) => {
  it.each(GIRLS)(' at her own slot: the head and the whole width inside the frame, the width under the desktop cap (35 percent of the window), the camera untouched', async (g) => {
    const stage = stageFor(1600, 900, slots, rig);
    await stage.stage(stateOf());
    const camBefore = (stage as unknown as { opts: { camera: PerspectiveCamera } }).opts.camera.position.toArray();
    await enter(stage, g);
    const r = stage.projectRect(g.id)!;
    expect(r.y, 'the head is inside the frame').toBeGreaterThanOrEqual(0);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.w).toBeLessThanOrEqual(1600);
    expect(r.w, 'under the width cap').toBeLessThanOrEqual(0.35 * 1600 * 1.0001);
    expect((stage as unknown as { opts: { camera: PerspectiveCamera } }).opts.camera.position.toArray()).toEqual(camBefore);
    expect(stage.actor(g.id)).toBeDefined();
  });
});

describe('the alternative semantic: a scene that names the form height (formHeights) plans the camera on the shared height', () => {
  it('records the stature for the framing plan and stands at the named height, the camera planned as before', async () => {
    const g = GIRLS[0]!;
    const slots = { ...SLOTS, formHeights: { [g.art]: 2.9 } } as SceneSlots;
    const stage = stageFor(1600, 900, slots);
    await stage.stage(stateOf());
    await enter(stage, g);
    expect(figureOf(g.id)['worldHeight']).toBeCloseTo(2.9, 6);
    expect(figureOf(g.id).userData[STATURE_KEY]).toBeCloseTo(2.9 / 1.82, 6);
  });
});
