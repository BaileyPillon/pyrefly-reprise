// @vitest-environment jsdom
/**
 * **A girl changes dressphere on the field** (`src/engine/yrp3d/skin.ts`'s dress step, with `dressSwap.ts`; the hidden 3D Bahamut chapter, FFX-2 only), driven with real `PaintedActor`s (a no-op 2D context stands in for
 * the canvas, as in `skin.test.ts`) and dressphere models built by a fake port. What it pins:
 *
 * 1. **The battle's word**: the dressphere in the actor's art id (`ART_KEY`, which the stage writes at the opening and when a `spherechange` swaps her painting) against the model's. Equal, absent or bare (`yuna`): nothing happens.
 * 2. **The swap**: a different dressphere asks the port once, lights the figure toward white (the albedo and an edge of emissive), puts the new model where the old stood at the peak (same motion layer, same yaw and height, the
 *    models map told, the old one disposed, her cast carried over), and lets the light fall off the new model. A late model holds the light; a model that never comes leaves her as she is and is not asked for again.
 * 3. **The rules**: a model that is not a dressphere's (the single model, Bahamut) is never swapped; REDUCE FLASHES softens the light; a second change after the first runs again; the port is told what she wears at the
 *    opening and after each swap (so it warms her neighbours).
 */
import { AnimationClip, BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D, Scene, VectorKeyframeTrack } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ART_KEY } from '../../../src/engine/BattlePresenterArt.ts';
import { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { BOSS_HEIGHT, PARTY_HEIGHT, PARTY_YAW, YRP_CAST, type YrpId } from '../../../src/engine/yrp3d/layout.ts';
import { loadYrpModels, type LoaderIO, type YrpModels } from '../../../src/engine/yrp3d/load.ts';
import { LIGHT, SWAP, type DressPort } from '../../../src/engine/yrp3d/dressSwap.ts';
import { YrpModel } from '../../../src/engine/yrp3d/model.ts';
import { YrpSkin, artOf, internalsOf } from '../../../src/engine/yrp3d/skin.ts';
import type { Girl } from '../../../src/engine/yrp3d/dress.ts';

function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
  const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'canvas') return canvas;
      if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
      if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
      if (prop === 'measureText') return () => ({ width: 10 });
      return () => stub;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
});
afterAll(() => vi.restoreAllMocks());

const blank = (): HTMLCanvasElement => document.createElement('canvas');
const NO_FILES: LoaderIO = { fetchBytes: async () => null, fetchJson: async () => null, parse: async () => ({ scene: new Group(), animations: [] }), clone: async (s) => s.clone(true) };
const HEIGHTS = { yuna: PARTY_HEIGHT, rikku: PARTY_HEIGHT, paine: PARTY_HEIGHT, bahamut: BOSS_HEIGHT };
const START: Record<Girl, string> = { yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' };

/** A dressphere model: a small scene with the game's idle, hit and cast clips, which the model builds its plans for from their names. */
function dressModel(girl: Girl, dress: string): YrpModel {
  const scene = new Group();
  const body = new Mesh(new BoxGeometry(0.5, 1.9, 0.4), new MeshStandardMaterial({ color: 0x336699 }));
  body.name = 'body';
  scene.add(body);
  const clip = (name: string): AnimationClip => new AnimationClip(name, 1, [new VectorKeyframeTrack('body.position', [0, 1], [0, 0, 0, 0, 0.1, 0])]);
  const clips = ['APPEAR_00', 'DMG1', 'MAGIC1_00', 'MAGIC1_01', 'MAGIC1_02'].map(clip);
  const model = new YrpModel(girl, scene, clips, HEIGHTS[girl], 'own', { dress: { name: dress, weapons: 1 } });
  vi.spyOn(model, 'dispose');
  return model;
}

interface Port extends DressPort {
  asked: Array<[Girl, string]>;
  worn: Array<[Girl, string]>;
  made: YrpModel[];
  /** Models the port will not make, by `girl/dress`. */
  missing: Set<string>;
  /** Resolve the next ask by hand (a late model): set `hold` and call `release`. */
  hold: boolean;
  release(): void;
}

function fakePort(): Port {
  let gates: Array<() => void> = [];
  const port: Port = {
    asked: [],
    worn: [],
    made: [],
    missing: new Set(),
    hold: false,
    release: () => {
      gates.forEach((g) => g());
      gates = [];
    },
    async model(girl, dress) {
      port.asked.push([girl, dress]);
      if (port.hold) await new Promise<void>((resolve) => gates.push(resolve));
      if (port.missing.has(`${girl}/${dress}`)) return null;
      const m = dressModel(girl, dress);
      port.made.push(m);
      return m;
    },
    wearing: (girl, dress) => void port.worn.push([girl, dress]),
  };
  return port;
}

interface Rig {
  scene: Scene;
  host: Group;
  models: YrpModels;
  skin: YrpSkin;
  actors: Record<string, PaintedActor>;
  port: Port;
}
const open: Rig[] = [];
afterEach(() => {
  for (const r of open.splice(0)) {
    r.skin.dispose();
    for (const a of Object.values(r.actors)) a.dispose();
  }
});

/** The skin over dressphere models for the girls (their starters) and a capsule Bahamut, with real actors named for the ids and the art ids the stage writes on them. */
async function rig(opts: { dress?: boolean; starters?: Partial<Record<Girl, string | null>>; art?: Partial<Record<YrpId, string>> } = {}): Promise<Rig> {
  const models = await loadYrpModels({ base: '/', dirs: ['models-exp/yrp'], heights: HEIGHTS, io: NO_FILES });
  for (const g of ['yuna', 'rikku', 'paine'] as const) {
    const start = opts.starters?.[g] === undefined ? START[g] : opts.starters[g];
    if (start) models.replace(g, dressModel(g, start));
  }
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  const actors: Record<string, PaintedActor> = {};
  for (const id of YRP_CAST) {
    const a = new PaintedActor({ name: id, worldHeight: HEIGHTS[id], side: id === 'bahamut' ? 'enemy' : 'party', placeholder: blank });
    const art = opts.art?.[id] ?? (id === 'bahamut' ? undefined : `${id}-${START[id as Girl]}`);
    if (art) a.userData[ART_KEY] = art;
    scene.add(a);
    actors[id] = a;
  }
  const port = fakePort();
  const skin = new YrpSkin({ host, models, ...(opts.dress === false ? {} : { dress: port }) });
  const r = { scene, host, models, skin, actors, port };
  open.push(r);
  return r;
}

const run = async (r: Rig, seconds: number, dt = 1 / 60): Promise<void> => {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    for (const a of Object.values(r.actors)) a.update(dt);
    r.skin.update(dt);
    await Promise.resolve(); // the port's promise settles between frames
  }
};
const modelOf = (r: Rig, id: YrpId): YrpModel => r.skin.get(id)!.model;
const say = (r: Rig, id: YrpId, art: string): void => void (r.actors[id]!.userData[ART_KEY] = art);
const lightOf = (r: Rig, id: YrpId): number => Math.max(...modelOf(r, id).materials.map((m) => (m as MeshStandardMaterial).emissive.r)); // the emissive white's strength

describe("the battle's word: the dressphere in the actor's art id", () => {
  it('reads the art id the stage wrote on the actor (and nothing when there is none)', async () => {
    const r = await rig({ art: { yuna: 'yuna-gunner' } });
    expect(artOf(r.actors['yuna']!)).toBe('yuna-gunner');
    expect(artOf(r.actors['bahamut']!)).toBeUndefined();
    r.actors['bahamut']!.userData[ART_KEY] = 7; // not a string: not an id
    expect(artOf(r.actors['bahamut']!)).toBeUndefined();
  });

  it('does nothing while it agrees with the model, or says nothing, or names no dressphere (the bare id the presenter falls back to)', async () => {
    const r = await rig({ art: { rikku: 'rikku' } }); // Rikku's id is bare: no dressphere named
    await run(r, 1);
    expect(r.port.asked).toEqual([]);
    say(r, 'yuna', 'yuna-white-mage'); // the same
    say(r, 'paine', 'rikku-thief'); // another girl's: names none for Paine
    await run(r, 1);
    expect(r.port.asked).toEqual([]);
    for (const id of ['yuna', 'rikku', 'paine'] as const) expect(lightOf(r, id), id).toBe(0);
  });

  it('is told what each girl wears at the opening (so the port warms her neighbours), and not for a figure that is no dressphere', async () => {
    const r = await rig({ starters: { paine: null } }); // Paine keeps the capsule: not a dressphere model
    r.skin.update(0.02);
    expect(r.port.worn.sort()).toEqual([['rikku', 'dark-knight'], ['yuna', 'white-mage']]);
  });
});

describe('the swap', () => {
  it("asks the port once for the new dressphere, lights her toward white, puts the new model in at the peak and lets the light fall off it", async () => {
    const r = await rig();
    await run(r, 0.1);
    const old = modelOf(r, 'yuna');
    expect(old.dress).toBe('white-mage');
    const albedo = (m: YrpModel): number => Math.max(...m.materials.map((x) => (x as MeshStandardMaterial).color.r));
    const rest = albedo(old);
    say(r, 'yuna', 'yuna-black-mage'); // the presenter's setArt, on the spherechange event
    await run(r, SWAP.up * 0.5);
    expect(r.port.asked).toEqual([['yuna', 'black-mage']]);
    expect(modelOf(r, 'yuna'), 'not yet: the light is going up').toBe(old);
    expect(lightOf(r, 'yuna')).toBeGreaterThan(0);
    expect(albedo(old), 'the whole figure goes toward white, not only her edge').toBeGreaterThan(rest * 1.5);
    await run(r, SWAP.up + 0.05);
    const next = modelOf(r, 'yuna');
    expect(next).not.toBe(old);
    expect(next.dress).toBe('black-mage');
    expect(r.models.models.get('yuna')).toBe(next); // the stage's discs and shadows follow the model on the actor
    expect(old.dispose).toHaveBeenCalledTimes(1);
    expect(old.root.parent).toBeNull();
    expect(next.root.parent).toBe(internalsOf(r.actors['yuna']!)!.inner); // the same motion layer: the lunge and the recoil move it
    expect(next.height).toBe(PARTY_HEIGHT);
    expect((next.root.children[0]!.children[0] as Object3D).rotation.y).toBeCloseTo(PARTY_YAW, 9); // the figure's yaw
    expect(lightOf(r, 'yuna'), 'the light is on the new model, already falling').toBeGreaterThan(LIGHT.peak * 0.4);
    await run(r, SWAP.down + 0.1);
    expect(lightOf(r, 'yuna')).toBe(0);
    expect(albedo(next)).toBeLessThan(rest * 1.1);
    expect(r.port.asked, 'one ask for one change').toEqual([['yuna', 'black-mage']]);
    expect(r.port.worn).toContainEqual(['yuna', 'black-mage']);
    // the other girls were never touched
    expect(modelOf(r, 'rikku').dress).toBe('dark-knight');
    expect(modelOf(r, 'paine').dress).toBe('warrior');
  });

  it('carries the change\'s cast over: the new model stands in the cast the old one was in', async () => {
    const r = await rig();
    await run(r, 0.1);
    const a = r.actors['yuna']!;
    a.setPose('cast', { immediate: true, force: true });
    modelOf(r, 'yuna').noteOpen('cast', 0.3);
    r.skin.listener.open?.('yuna', 'cast', 0.3);
    say(r, 'yuna', 'yuna-gunner');
    await run(r, SWAP.up + 0.3);
    expect(modelOf(r, 'yuna').dress).toBe('gunner');
    expect(modelOf(r, 'yuna').playing).toBe('cast');
  });

  it('holds the light for a model that is late and swaps when it comes', async () => {
    const r = await rig();
    r.port.hold = true;
    await run(r, 0.05);
    say(r, 'rikku', 'rikku-thief');
    await run(r, SWAP.up + 0.6);
    expect(modelOf(r, 'rikku').dress, 'still the old one').toBe('dark-knight');
    expect(lightOf(r, 'rikku'), 'the light holds at the peak').toBeGreaterThan(LIGHT.peak * 0.9);
    r.port.hold = false;
    r.port.release();
    await run(r, 0.1);
    expect(modelOf(r, 'rikku').dress).toBe('thief');
  });

  it('leaves her as she is when there is no model for the dressphere, lets the light fall, and does not ask again for the same word', async () => {
    const r = await rig();
    r.port.missing.add('paine/psychic');
    await run(r, 0.05);
    const was = modelOf(r, 'paine');
    say(r, 'paine', 'paine-psychic');
    await run(r, SWAP.up + SWAP.down + 0.5);
    expect(modelOf(r, 'paine')).toBe(was);
    expect(was.dispose).not.toHaveBeenCalled();
    expect(lightOf(r, 'paine')).toBe(0);
    await run(r, 1);
    expect(r.port.asked, 'once').toEqual([['paine', 'psychic']]);
    say(r, 'paine', 'paine-gunner'); // another word: asked
    await run(r, SWAP.up + 0.1);
    expect(modelOf(r, 'paine').dress).toBe('gunner');
  });

  it('runs again for a second change, and a model that arrives after the skin is gone is disposed, not left', async () => {
    const r = await rig();
    await run(r, 0.05);
    say(r, 'yuna', 'yuna-thief');
    await run(r, SWAP.up + SWAP.down + 0.2);
    expect(modelOf(r, 'yuna').dress).toBe('thief');
    say(r, 'yuna', 'yuna-white-mage');
    await run(r, SWAP.up + SWAP.down + 0.2);
    expect(modelOf(r, 'yuna').dress).toBe('white-mage');
    expect(r.port.asked).toEqual([['yuna', 'thief'], ['yuna', 'white-mage']]);

    const late = await rig();
    late.port.hold = true;
    await run(late, 0.05);
    say(late, 'rikku', 'rikku-gunner');
    await run(late, 0.1);
    late.skin.dispose();
    late.port.hold = false;
    late.port.release();
    await run(late, 0.05);
    expect(late.port.made[0]!.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('the rules', () => {
  it('never swaps a figure whose model is not a dressphere (the single model a girl keeps with no files; Bahamut)', async () => {
    const r = await rig({ starters: { yuna: null } });
    await run(r, 0.05);
    say(r, 'yuna', 'yuna-gunner');
    say(r, 'bahamut', 'bahamut-whatever');
    await run(r, 1);
    expect(r.port.asked).toEqual([]);
    expect(modelOf(r, 'yuna').dress).toBeNull();
  });

  it('keeps every girl on the model she was loaded with when the skin has no port', async () => {
    const r = await rig({ dress: false });
    await run(r, 0.05);
    say(r, 'yuna', 'yuna-gunner');
    await run(r, 1);
    expect(modelOf(r, 'yuna').dress).toBe('white-mage');
    expect(lightOf(r, 'yuna')).toBe(0);
  });

  it('softens the light under REDUCE FLASHES', async () => {
    const full = await rig();
    const soft = await rig();
    (soft.actors['yuna'] as unknown as { softFlash: () => boolean }).softFlash = () => true;
    for (const r of [full, soft]) {
      r.port.hold = true; // the light holds at the peak: the strongest it gets
      await run(r, 0.05);
      say(r, 'yuna', 'yuna-gunner');
      await run(r, SWAP.up + 0.2);
    }
    expect(lightOf(full, 'yuna')).toBeGreaterThan(LIGHT.peak * 0.9);
    expect(lightOf(soft, 'yuna')).toBeCloseTo(LIGHT.peak * LIGHT.soft, 2);
    full.port.hold = false;
    full.port.release();
    soft.port.hold = false;
    soft.port.release();
  });

  it("disposes the model it has when the skin is disposed, whichever swap it made", async () => {
    const r = await rig();
    await run(r, 0.05);
    say(r, 'yuna', 'yuna-gunner');
    await run(r, SWAP.up + 0.2);
    const now = modelOf(r, 'yuna');
    r.skin.dispose();
    expect(now.dispose).toHaveBeenCalled(); // `YrpModels.dispose` takes the model the map holds now
  });
});
