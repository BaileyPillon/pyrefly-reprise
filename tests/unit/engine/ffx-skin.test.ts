/**
 * **The `ffx` skin on the real painted actors** (`src/engine/ffx3d/ffxSkin.ts`; the hidden Fayth chapter; FFX only). The REAL `PaintedActor` (the head-lock fixture's, with its real pose stand-ins) carries a stand-in
 * model, and the skin is driven the way the scene drives it, once a frame with the host group mounted in the three.js scene the stage adds its actors to. What this file pins:
 *
 * 1. **The private parts the skin writes are still there**: `PaintedActor` keeps `inner`, `slots` and `showFigure` private, and the skin switches the painted figure off through them (the chapter-local write
 *    the range director's `rimOf` and `keepUpright` also make). If a refactor renames one, this fails instead of the picture quietly showing a painting inside a model.
 * 2. **The painted planes stay off for good**: through a pose swap, an alpha change and a frame.
 * 3. **A model rides its actor**: it is a child of the actor's `inner` group (where every motion layer lands), faces the other side's stand point, the actor's height becomes the model's, the flat painting's
 *    interim turn is off, and Evrae's contact shadow is hidden (a party member keeps his).
 * 4. **Alpha and scale follow the actor**: the range director fades Evrae with `setAlpha` and scales the actor for the FAR painting; the model takes the alpha and divides the scale out.
 * 5. **A replaced actor takes the model with it**; an actor with no model is left painted (only laid flat); nothing happens before the host is mounted.
 *
 * Game case: FFX only (the skin is the hidden FFX chapter's).
 */
import { Group, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POSES, PaintedActor, painting, reset, type Actor } from './head-lock-fixture.ts'; // first: it installs the canvas stand-ins the actor needs
import { FfxSkin, hidePaintedFigure, internalsOf } from '../../../src/engine/ffx3d/ffxSkin.ts';
import { FFX_EVRAE_SPOTS, FFX_PARTY_SLOTS, ffxFaythStaging } from '../../../src/engine/ffx3d/ffxStaging.ts';
import { ffxPointTuple } from '../../../src/engine/ffx3d/ffxWorld.ts';
import type { FfxModel, FfxModels } from '../../../src/engine/ffx3d/models.ts';

afterEach(reset);

function actor(name: string, at: [number, number, number], opts: { shadow?: boolean; side?: 'party' | 'enemy' } = {}): Actor {
  const a = new PaintedActor({
    name,
    worldHeight: name === 'evrae' ? 4.1 : 1.75,
    side: opts.side ?? (name === 'evrae' ? 'enemy' : 'party'),
    breathe: false,
    sway: false,
    life: false,
    shadow: opts.shadow === false ? false : { radius: 0.62 },
    turnRing: false,
  });
  a.adoptPoses(Object.fromEntries(POSES.map((p) => [p, painting('yuna', p)])), 'idle');
  a.position.set(...at);
  return a;
}

/** A stand-in model: a root group at a known scale, a height, and a spy on the fade. */
function model(id: string, height: number, scale = 0.09): FfxModel & { setOpacity: ReturnType<typeof vi.fn> } {
  const root = new Group();
  root.name = `ffx-${id}`;
  root.scale.setScalar(scale);
  return { id, root, height, setOpacity: vi.fn(), dispose: vi.fn() } as FfxModel & { setOpacity: ReturnType<typeof vi.fn> };
}

const modelsOf = (...ms: FfxModel[]): FfxModels => ({ stage: null, actors: Object.fromEntries(ms.map((m) => [m.id, m])), problems: [], dispose: () => {} });

/** A scene with the skin's host mounted in it and the actors added beside it, as the battle screen and the stage do. */
function field(...actors: Actor[]): { scene: Scene; host: Group } {
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  for (const a of actors) scene.add(a);
  return { scene, host };
}

const TIDUS_AT = ffxPointTuple(FFX_PARTY_SLOTS[0]!); // (-2.41047, 3.37466, -11.57025)
const EVRAE_AT = ffxPointTuple(FFX_EVRAE_SPOTS.near); // (-13.49862, 3.37466, -7.7135)
const INNER_OF = (a: Actor): Group => (a as unknown as { inner: Group }).inner;

describe('the private parts of PaintedActor the skin writes', () => {
  it('are there: inner, two plane slots and showFigure', () => {
    const parts = internalsOf(actor('tidus', TIDUS_AT))!;
    expect(parts).not.toBeNull();
    expect(parts.inner).toBeInstanceOf(Group);
    expect(parts.slots).toHaveLength(2);
    expect(parts.showFigure).toBe(true);
    for (const s of parts.slots) expect(s.mesh.parent).toBe(parts.inner); // the planes ride the same group the model will
  });

  it('are not found on anything else: a plain object or a group is left alone', () => {
    expect(internalsOf({} as never)).toBeNull();
    expect(internalsOf(new Group() as never)).toBeNull();
    expect(hidePaintedFigure({} as never)).toBe(false);
  });
});

describe('switching the painted figure off', () => {
  it('hides both planes, and they stay hidden through a pose swap, an alpha change and a frame', () => {
    const a = actor('tidus', TIDUS_AT);
    const parts = internalsOf(a)!;
    a.update(1 / 60);
    expect(parts.slots.some((s) => s.mesh.visible)).toBe(true); // painted, as built
    expect(hidePaintedFigure(a)).toBe(true);
    expect(parts.showFigure).toBe(false);
    expect(parts.slots.every((s) => !s.mesh.visible)).toBe(true);
    a.setPose('attack', { immediate: true, force: true });
    a.setAlpha(0.6);
    a.update(1 / 60);
    a.setPose('idle', { immediate: true, force: true });
    a.setAlpha(1);
    a.update(1 / 60);
    expect(parts.slots.every((s) => !s.mesh.visible), 'a painted plane came back').toBe(true);
    expect(a.paintings().filter((p) => p.drawn)).toEqual([]); // nothing painted is drawn: the art governor loads no master for it
  });
});

describe('a model on its actor', () => {
  it('rides the actor\'s inner group, faces the other side, takes its height, and the painted turn is off', () => {
    const tidus = actor('tidus', TIDUS_AT);
    const evrae = actor('evrae', EVRAE_AT);
    const { host } = field(tidus, evrae);
    const mt = model('tidus', 1.49);
    const me = model('evrae', 7.57, 0.385);
    const staging = ffxFaythStaging();
    const skin = new FfxSkin({ host, models: modelsOf(mt, me), staging });
    expect(tidus.interimYawDeg).toBeGreaterThan(0); // the stage's default: a flat painting turned a few degrees toward the other side
    skin.update();

    expect(mt.root.parent).toBe(INNER_OF(tidus));
    expect(me.root.parent).toBe(INNER_OF(evrae));
    expect(tidus.interimYawDeg).toBe(0);
    expect(evrae.interimYawDeg).toBe(0);
    expect(tidus.height).toBe(1.49);
    expect(evrae.height).toBe(7.57);
    // the party faces Evrae's NEAR spot (-13.49862, -7.7135) from Tidus's slot; Evrae faces the middle of the party's three slots
    expect(mt.root.rotation.y).toBeCloseTo(Math.atan2(EVRAE_AT[0] - TIDUS_AT[0], EVRAE_AT[2] - TIDUS_AT[2]), 10);
    const mid = staging.partySlots.slice(0, 3).reduce((s, p) => [s[0]! + p.x / 3, s[1]! + p.z / 3], [0, 0]);
    expect(me.root.rotation.y).toBeCloseTo(Math.atan2(mid[0]! - EVRAE_AT[0], mid[1]! - EVRAE_AT[2]), 10);
    expect(me.root.rotation.y).toBeGreaterThan(Math.PI / 2 - 0.2); // toward +x, a little toward +z
    // the painted planes are off, Evrae's contact shadow too, a party member's stays
    expect(internalsOf(tidus)!.slots.every((s) => !s.mesh.visible)).toBe(true);
    expect(tidus.shadow!.visible).toBe(true);
    expect(evrae.shadow!.visible).toBe(false);
    // the model's own scale is untouched at first
    expect(mt.root.scale.x).toBeCloseTo(0.09, 12);
    expect(skin.actors.get('tidus')).toBe(tidus);
  });

  it('follows the actor\'s alpha (the range director\'s fade) and divides out its scale (the FAR painting\'s size)', () => {
    const evrae = actor('evrae', EVRAE_AT);
    const { host } = field(evrae);
    const me = model('evrae', 7.57, 0.385);
    const skin = new FfxSkin({ host, models: modelsOf(me), staging: ffxFaythStaging() });
    skin.update();
    expect(me.setOpacity).toHaveBeenLastCalledWith(1);
    expect(me.root.visible).toBe(true);

    evrae.setAlpha(0.5);
    skin.update();
    expect(me.setOpacity).toHaveBeenLastCalledWith(0.5);
    expect(me.root.visible).toBe(true);
    const calls = me.setOpacity.mock.calls.length;
    skin.update();
    expect(me.setOpacity.mock.calls.length, 'an unchanged alpha is not set again').toBe(calls);

    evrae.setAlpha(0);
    skin.update();
    expect(me.root.visible).toBe(false);

    evrae.setAlpha(1);
    evrae.scale.setScalar(2); // the director sizes the actor for a painting
    skin.update();
    expect(me.root.scale.x).toBeCloseTo(0.385 / 2, 12);
    evrae.scale.setScalar(0.5);
    skin.update();
    expect(me.root.scale.x).toBeCloseTo(0.385 / 0.5, 12);
    evrae.scale.setScalar(1);
    skin.update();
    expect(me.root.scale.x).toBeCloseTo(0.385, 12);

    evrae.visible = false; // held off the stage (an aeon is out)
    skin.update();
    expect(me.root.visible).toBe(false);
  });

  it('moves the model to a replaced actor of the same id (the stage replaces an actor when it re-adds a combatant)', () => {
    const first = actor('tidus', TIDUS_AT);
    const { scene, host } = field(first);
    const mt = model('tidus', 1.49);
    const skin = new FfxSkin({ host, models: modelsOf(mt), staging: ffxFaythStaging() });
    skin.update();
    expect(mt.root.parent).toBe(INNER_OF(first));

    scene.remove(first);
    const second = actor('tidus', TIDUS_AT);
    scene.add(second);
    skin.update();
    expect(mt.root.parent).toBe(INNER_OF(second));
    expect(INNER_OF(first).children).not.toContain(mt.root);
    expect(internalsOf(second)!.slots.every((s) => !s.mesh.visible)).toBe(true);
    expect(skin.actors.get('tidus')).toBe(second);
  });

  it('leaves an actor with no model painted: only the flat painting\'s turn is switched off', () => {
    const lulu = actor('lulu', TIDUS_AT);
    const wakka = actor('wakka', TIDUS_AT);
    const { host } = field(lulu, wakka);
    const mw = model('wakka', 1.43);
    new FfxSkin({ host, models: modelsOf(mw), staging: ffxFaythStaging() }).update();
    expect(mw.root.parent).toBe(INNER_OF(wakka));
    expect(internalsOf(lulu)!.slots.some((s) => s.mesh.visible) || internalsOf(lulu)!.showFigure).toBe(true); // Lulu has no model: still a painting
    expect(INNER_OF(lulu).children.find((c) => c.name.startsWith('ffx-'))).toBeUndefined();
  });

  it('the painted skin at FFX\'s staging (no models) lays every billboard flat and attaches nothing', () => {
    const tidus = actor('tidus', TIDUS_AT);
    const evrae = actor('evrae', EVRAE_AT);
    const { host } = field(tidus, evrae);
    const skin = new FfxSkin({ host, models: null, staging: ffxFaythStaging() });
    skin.update();
    expect(tidus.interimYawDeg).toBe(0);
    expect(evrae.interimYawDeg).toBe(0);
    expect(internalsOf(tidus)!.showFigure).toBe(true);
    expect(tidus.height).toBe(1.75); // the painted height stands
    expect([...skin.actors.keys()].sort()).toEqual(['evrae', 'tidus']);
  });

  it('does nothing before the host is mounted in a scene, and survives an update with no actors', () => {
    const host = new Group();
    const mt = model('tidus', 1.49);
    const skin = new FfxSkin({ host, models: modelsOf(mt), staging: ffxFaythStaging() });
    expect(() => skin.update()).not.toThrow();
    const scene = new Scene();
    scene.add(host);
    expect(() => skin.update()).not.toThrow();
    expect(mt.root.parent).toBeNull();
  });
});
