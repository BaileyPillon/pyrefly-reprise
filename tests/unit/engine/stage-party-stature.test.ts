/**
 * **The stage stands the FFX party at its real relative heights** (`PaintedStage.add` + `PartyStature.ts`, r3941-heights).
 *
 * Driven through the real `PaintedStage.stage` / `add` / `addCombatant` with `PaintedActor.create` recorded, not run (it needs a
 * WebGL canvas), the way `stage-figure-heights.test.ts` does it: what the stage hands the actor is what the player sees, because the
 * actor sizes every plane, mark and motion from the `worldHeight` it is given and the stage scales the contact shadow and the turn
 * ring it authors at a fixed radius.
 *
 * Held here:
 *
 * - every one of the seven heroes, in an FFX battle, gets the shared party height times his table ratio, and his shadow and ring
 *   scale with it; Tidus gets exactly the shared height;
 * - FFX-2's Yuna and Rikku (the same ids) get exactly what they got before, and so does everyone who is not a hero on the party's side
 *   (an aeon, a fiend with a hero's id);
 * - a Switch-in (staged from a stub through `addCombatant`) stands at his own height too, so does a hero staged by a later `stage()`;
 * - a height the scene names for a combatant (Chapter XIV's Yuna) or a director hands `add` is the figure's own and is not multiplied;
 * - `?stature=off` plays the old, equal heights, for same-build before and after pictures.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]; the FFX-2 cases are the proof that nothing else moves.
 */

import { Group, Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const created: Array<Record<string, unknown>> = [];
/** The figures the mocked `PaintedActor.create` returned, in order (the stage writes the stature on the actor for the framing). */
const actorsOut: Array<Object3D> = [];

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['setAlpha'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      // A billboard sized by the world height it was given (what the real actor's painted quad does): 0.1 h left to 0.4 h right of the ground point, 0.05 h below it to 0.95 h above.
      const h = Number(o['worldHeight']);
      f['contentQuad'] = (out?: [Vector3, Vector3, Vector3, Vector3]) => {
        f.updateWorldMatrix(true, false);
        const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
        q[0].set(-0.1 * h, -0.05 * h, 0).applyMatrix4(f.matrixWorld);
        q[1].set(0.4 * h, -0.05 * h, 0).applyMatrix4(f.matrixWorld);
        q[2].set(0.4 * h, 0.95 * h, 0).applyMatrix4(f.matrixWorld);
        q[3].set(-0.1 * h, 0.95 * h, 0).applyMatrix4(f.matrixWorld);
        return q;
      };
      f['centerPoint'] = (out: Vector3) => out.set(f.position.x, 0.52 * h, f.position.z);
      actorsOut.push(f);
      return f;
    }),
  },
}));
vi.mock('../../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage } = await import('../../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../../src/engine/BattleCamera.ts');
const { setStatureOff, STATURE_KEY } = await import('../../../src/engine/PartyStature.ts');
const { CHARACTER_IDS } = await import('../../../src/data/ffx/ids.ts');
const { FFX_PARTY_STATURE } = await import('../../../src/data/ffx/party-stature.ts');
const { VIA_PURIFICO_SLOTS, VIA_ACTOR_HEIGHTS } = await import('../../../src/scenes/via-purifico.ts');

import type { BattleState, GameId, Side } from '../../../src/battle/common/types.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';

const PARTY_H = 1.82;
const SLOTS: SceneSlots = {
  party: [
    [-1.95, 0, 1.5],
    [-3.15, 0, 0.25],
    [-1.35, 0, -0.95],
  ],
  enemy: [[3, 0, -2.6]],
  partyHeight: PARTY_H,
  enemyHeight: 4.1,
};

function stageWith(slots: SceneSlots): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

type Member = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const member = (id: string, slot: number, side: Side = 'party'): Member =>
  ({ id, name: id, side, slot, alive: true, removed: false, spriteKey: id, flags: {} }) as unknown as Member;

/** Just enough of a `BattleState` for `PaintedStage.stage` (no enemies: the formation solver needs two). */
function stateOf(game: GameId, ids: readonly string[], side: Side = 'party'): BattleState {
  return {
    game,
    combatants: Object.fromEntries(ids.map((id, i) => [id, member(id, i, side)])),
    activeIds: [...ids],
    reserveIds: [],
    enemyIds: [],
    aeonId: null,
    flags: {},
  } as unknown as BattleState;
}

const optsFor = (id: string): Record<string, unknown> => created.filter((o) => o['name'] === id).at(-1)!;
const radius = (o: Record<string, unknown>, k: 'shadow' | 'turnRing'): number => (o[k] as { radius: number }).radius;
const heightOf = (id: string): number => optsFor(id)['worldHeight'] as number;
/** The factor the stage recorded on the figure it made last for `id` (undefined: none, the figure stands at the shared height). */
const statureOn = (id: string): unknown => actorsOut.filter((a) => a.name === id).at(-1)!.userData[STATURE_KEY];

beforeEach(() => {
  created.length = 0;
  actorsOut.length = 0;
  setStatureOff(false);
});
afterEach(() => setStatureOff(null));

describe('PaintedStage: the FFX party stands at its real relative heights', () => {
  it('gives each of the seven heroes the shared height times his ratio, and his shadow and ring the same factor', async () => {
    const stage = stageWith(SLOTS);
    for (const id of CHARACTER_IDS) {
      await stage.stage(stateOf('ffx', [id]));
      const r = FFX_PARTY_STATURE[id].ratio;
      expect(heightOf(id), id).toBe(PARTY_H * r);
      expect(radius(optsFor(id), 'shadow'), id).toBe(0.62 * r);
      expect(radius(optsFor(id), 'turnRing'), id).toBe(0.78 * r);
    }
  });

  it('records the factor it drew each hero by on his actor, for the framing, and nothing on a figure it did not scale', async () => {
    const stage = stageWith(SLOTS);
    for (const id of CHARACTER_IDS) {
      await stage.stage(stateOf('ffx', [id]));
      const r = FFX_PARTY_STATURE[id].ratio;
      expect(statureOn(id), id).toBe(r === 1 ? undefined : r); // Tidus stands at the shared height: no key, so the framing reads him exactly as it always did
    }
    for (const id of ['yuna', 'kimahri', 'tidus']) {
      await stage.stage(stateOf('ffx2', [id])); // FFX-2: the same ids, no key
      expect(statureOn(id), `ffx2 ${id}`).toBeUndefined();
    }
    await stage.stage(stateOf('ffx', ['tidus']));
    await stage.addCombatant('valefor', { artId: 'valefor', side: 'aeon', slot: 1 });
    expect(statureOn('valefor')).toBeUndefined();
    await stage.add(member('auron', 0, 'enemy'));
    expect(statureOn('auron')).toBeUndefined(); // a fiend with a hero's id
    await stage.add(member('kimahri', 1), 2.5); // an arrival director's height is the figure's own
    expect(statureOn('kimahri')).toBeUndefined();
    setStatureOff(true);
    await stage.stage(stateOf('ffx', ['kimahri'])); // ?stature=off
    expect(statureOn('kimahri')).toBeUndefined();
  });

  it("records no factor for Chapter XIV's Yuna, whose scene names her height", async () => {
    const stage = stageWith(VIA_PURIFICO_SLOTS);
    await stage.stage(stateOf('ffx', ['yuna']));
    expect(statureOn('yuna')).toBeUndefined();
  });

  it("reads a hero at the shared height when asked (the formation relaxation's view), and as drawn otherwise", async () => {
    const stageAt = (cam: PerspectiveCamera): InstanceType<typeof PaintedStage> =>
      new PaintedStage({
        scene: new Scene(),
        camera: cam,
        battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
        slots: SLOTS,
        canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
      });
    const camera = (): PerspectiveCamera => {
      const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 200);
      cam.position.set(0, 3, 10);
      cam.lookAt(0, 1, 0);
      cam.updateMatrixWorld(true);
      return cam;
    };
    const ids = ['tidus', 'kimahri', 'yuna'];
    const on = stageAt(camera());
    await on.stage(stateOf('ffx', ids));
    const drawn = on.screenRects();
    const shared = on.screenRects(true);
    setStatureOff(true);
    const off = stageAt(camera());
    await off.stage(stateOf('ffx', ids));
    const old = off.screenRects(); // the same party, every hero at the shared height: the picture the relaxation has always settled the fiends against
    for (const id of ids) {
      for (const k of ['x', 'y', 'w', 'h', 'depth'] as const) expect(shared.get(id)![k], `${id} ${k}`).toBeCloseTo(old.get(id)![k], 6);
    }
    expect(drawn.get('tidus')).toEqual(old.get('tidus')); // Tidus is the shared height
    expect(drawn.get('kimahri')!.h).toBeGreaterThan(old.get('kimahri')!.h * 1.2); // and as drawn Kimahri is taller
    expect(drawn.get('yuna')!.h).toBeLessThan(old.get('yuna')!.h * 0.95);
  });

  it("stands Tidus at exactly the shared height, with the shadow and ring he always had", async () => {
    const stage = stageWith(SLOTS);
    await stage.stage(stateOf('ffx', ['tidus']));
    expect(heightOf('tidus')).toBe(PARTY_H);
    expect(radius(optsFor('tidus'), 'shadow')).toBe(0.62);
    expect(radius(optsFor('tidus'), 'turnRing')).toBe(0.78);
  });

  it("puts the tallest painting (Kimahri's, 30 percent over Tidus's: his body 21 percent) and the shortest (Yuna, Rikku) 9 percent under, in one battle", async () => {
    const stage = stageWith(SLOTS);
    await stage.stage(stateOf('ffx', ['tidus', 'kimahri', 'rikku']));
    expect(heightOf('kimahri') / heightOf('tidus')).toBeCloseTo(1.304, 12);
    expect(heightOf('rikku') / heightOf('tidus')).toBeCloseTo(0.911, 12);
  });

  it("leaves FFX-2's Yuna and Rikku exactly as they were, and every other id the FFX-2 party shares", async () => {
    const stage = stageWith(SLOTS);
    for (const id of ['yuna', 'rikku', 'paine', 'tidus', 'kimahri', 'wakka', 'lulu', 'auron']) {
      await stage.stage(stateOf('ffx2', [id]));
      expect(heightOf(id), id).toBe(PARTY_H);
      expect(radius(optsFor(id), 'shadow'), id).toBe(0.62);
      expect(radius(optsFor(id), 'turnRing'), id).toBe(0.78);
    }
  });

  it('leaves an aeon and a fiend alone, even one that carries a hero id', async () => {
    const stage = stageWith(SLOTS);
    await stage.stage(stateOf('ffx', ['tidus']));
    await stage.addCombatant('yuna', { artId: 'valefor', side: 'aeon', slot: 1 }); // an aeon-side figure that carries a hero's id (the real aeons are `valefor` and the like): the side decides, not the id
    expect(heightOf('yuna')).toBe(4.1 * 0.7);
    expect(radius(optsFor('yuna'), 'turnRing')).toBe(0.78); // an aeon is a party-kind figure: its ring is the party's, unscaled
    await stage.addCombatant('valefor', { artId: 'valefor', side: 'aeon', slot: 1 }); // and a real one, as a summon stages it
    expect(heightOf('valefor')).toBe(4.1 * 0.7);
    await stage.add(member('auron', 0, 'enemy'));
    expect(heightOf('auron')).toBe(4.1 * 0.7);
    expect(radius(optsFor('auron'), 'turnRing')).toBe(1.7);
  });

  it('stands a Switch-in (staged from a stub through addCombatant) at his own height too', async () => {
    const stage = stageWith(SLOTS);
    await stage.stage(stateOf('ffx', ['tidus', 'yuna', 'auron']));
    await stage.addCombatant('wakka', { artId: 'wakka', side: 'party', slot: 2 });
    expect(heightOf('wakka')).toBe(PARTY_H * 1.201);
    expect(radius(optsFor('wakka'), 'shadow')).toBe(0.62 * 1.201);
  });

  it('keeps the old equal heights with ?stature=off, so one build draws the before and the after', async () => {
    setStatureOff(true);
    const stage = stageWith(SLOTS);
    for (const id of CHARACTER_IDS) {
      await stage.stage(stateOf('ffx', [id]));
      expect(heightOf(id), id).toBe(PARTY_H);
      expect(radius(optsFor(id), 'shadow'), id).toBe(0.62);
      expect(radius(optsFor(id), 'turnRing'), id).toBe(0.78);
    }
  });

  it('takes a height the scene names for the combatant as its own: Chapter XIV keeps Yuna at the room\'s 1.68', async () => {
    expect(VIA_PURIFICO_SLOTS.partyHeight).toBe(VIA_ACTOR_HEIGHTS.yuna);
    expect(VIA_PURIFICO_SLOTS.figureHeights?.['yuna']).toBe(VIA_ACTOR_HEIGHTS.yuna);
    const stage = stageWith(VIA_PURIFICO_SLOTS);
    await stage.stage(stateOf('ffx', ['yuna']));
    expect(heightOf('yuna')).toBe(1.68);
    expect(radius(optsFor('yuna'), 'shadow')).toBe(0.62);
    expect(radius(optsFor('yuna'), 'turnRing')).toBe(0.78);
  });

  it("takes an arrival director's height as given, with no ratio on top", async () => {
    const stage = stageWith(SLOTS);
    await stage.stage(stateOf('ffx', ['tidus']));
    await stage.add(member('kimahri', 1), 2.5);
    expect(heightOf('kimahri')).toBe(2.5);
    expect(radius(optsFor('kimahri'), 'turnRing')).toBe(0.78);
  });

  it('scales nobody before a state has been staged (add alone, as the older stage tests drive it)', async () => {
    const stage = stageWith(SLOTS);
    await stage.add(member('kimahri', 0));
    expect(heightOf('kimahri')).toBe(PARTY_H);
  });

  it("re-staging a state (a chain seam) gives the same heights again, not a ratio on a ratio", async () => {
    const stage = stageWith(SLOTS);
    const state = stateOf('ffx', ['tidus', 'kimahri']);
    await stage.stage(state);
    await stage.stage(state);
    expect(created.filter((o) => o['name'] === 'kimahri').map((o) => o['worldHeight'])).toEqual([PARTY_H * 1.304, PARTY_H * 1.304]);
  });
});
