/**
 * **The stage's full teardown frees every actor's foot-occlusion ellipse (`BattlePresenterStage.dispose`).**
 *
 * `attachFootOcclusion` (A-8, `ContactShadow.ts`) puts a tight dark ellipse under every grounded figure's blob; its material is a CLONE of the blob's, so
 * nobody else frees it. `removeCombatant` has always called `disposeFootOcclusion`; `dispose()` (the whole stage, on leaving a battle) freed each actor but
 * skipped that call, so every battle entry left one material per grounded figure on the GPU: four for a party of three against one boss, in every chapter
 * (found by the ch-anime review, `docs/handoff/ch-anime.md` open issue 3).
 *
 * Driven through the real `PaintedStage.add` and `.dispose` with `PaintedActor.create` replaced by a plain group that carries a blob (it needs a WebGL
 * canvas otherwise); the materials are watched for their `dispose` event.
 *
 * **Game case: both** [AGENTS.md rule 14]: shared presenter plumbing; the bug is the same in FFX and FFX-2 battles.
 */

import { Group, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Scene } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The actor stand-ins, in creation order, so a test can read the blob each one carries. */
const made: Array<{ name: string; actor: Object3D & { shadow: Mesh; levitates: boolean }; levitates: boolean }> = [];
let hover = new Set<string>();

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      const name = String(o['name']);
      const f = new Group() as Group & Record<string, unknown>;
      f.name = name;
      const blob = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ transparent: true, opacity: 0.5 }));
      blob.name = 'shadow';
      f.add(blob);
      f['shadow'] = blob;
      f['levitates'] = hover.has(name);
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      made.push({ name, actor: f as never, levitates: hover.has(name) });
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
const { CAVERN_STOLEN_FAYTH_SLOTS } = await import('../../../src/scenes/cavern-stolen-fayth.ts');

type Combatant = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const member = (id: string, side: 'party' | 'enemy', slot: number): Combatant =>
  ({ id, side, slot, alive: true, spriteKey: id, flags: side === 'enemy' ? { isBoss: slot === 1 } : {} }) as unknown as Combatant;

function newStage(): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots: CAVERN_STOLEN_FAYTH_SLOTS,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

const ellipseOf = (actor: { shadow: Mesh }): Mesh | undefined => actor.shadow.getObjectByName('foot-occlusion') as Mesh | undefined;

/** Hear a material's `dispose` event (three raises it once per `dispose()` call). */
function watch(m: MeshBasicMaterial, into: Set<MeshBasicMaterial>): void {
  m.addEventListener('dispose', () => into.add(m));
}

describe('PaintedStage.dispose frees the foot-occlusion ellipses', () => {
  beforeEach(() => {
    made.length = 0;
    hover = new Set();
  });

  it('every grounded figure gets one ellipse when it is staged (the thing that has to be freed): three party members and a boss make four', async () => {
    const stage = newStage();
    for (const [i, id] of ['tidus', 'yuna', 'auron'].entries()) await stage.add(member(id, 'party', i));
    await stage.add(member('boss', 'enemy', 1));
    expect(made).toHaveLength(4);
    for (const m of made) expect(ellipseOf(m.actor), m.name).toBeDefined();
  });

  it('the full teardown frees all four: each ellipse is detached from its blob and its (cloned) material is disposed', async () => {
    const stage = newStage();
    for (const [i, id] of ['tidus', 'yuna', 'auron'].entries()) await stage.add(member(id, 'party', i));
    await stage.add(member('boss', 'enemy', 1));
    const freed = new Set<MeshBasicMaterial>();
    const ellipses = made.map((m) => ellipseOf(m.actor)!);
    for (const e of ellipses) watch(e.material as MeshBasicMaterial, freed);
    expect(ellipses.every((e) => e.parent !== null)).toBe(true);

    stage.dispose();

    expect(freed.size, 'four contact-shadow materials, one per figure').toBe(4);
    for (const [i, e] of ellipses.entries()) {
      expect(e.parent, `${made[i]!.name}'s ellipse is off its blob`).toBeNull();
      expect(ellipseOf(made[i]!.actor), made[i]!.name).toBeUndefined();
    }
  });

  it('the blob itself is not touched (its geometry and material are the actor\'s own, and the actor frees them)', async () => {
    const stage = newStage();
    await stage.add(member('tidus', 'party', 0));
    const blob = made[0]!.actor.shadow;
    const blobFreed = new Set<MeshBasicMaterial>();
    watch(blob.material as MeshBasicMaterial, blobFreed);
    stage.dispose();
    expect(blobFreed.size).toBe(0);
    expect(blob.geometry).toBeDefined();
  });

  it('a hovering figure has no ellipse and the teardown passes over it', async () => {
    hover = new Set(['wisp']);
    const stage = newStage();
    await stage.add(member('tidus', 'party', 0));
    await stage.add(member('wisp', 'enemy', 0));
    const wisp = made.find((m) => m.name === 'wisp')!;
    expect(ellipseOf(wisp.actor)).toBeUndefined();
    const freed = new Set<MeshBasicMaterial>();
    watch(ellipseOf(made[0]!.actor)!.material as MeshBasicMaterial, freed);
    expect(() => stage.dispose()).not.toThrow();
    expect(freed.size).toBe(1);
  });

  it('removing one combatant first frees its ellipse once, and the teardown then frees only the others', async () => {
    const stage = newStage();
    await stage.add(member('tidus', 'party', 0));
    await stage.add(member('yuna', 'party', 1));
    const freed = new Map<string, number>();
    for (const m of made) (ellipseOf(m.actor)!.material as MeshBasicMaterial).addEventListener('dispose', () => freed.set(m.name, (freed.get(m.name) ?? 0) + 1));
    stage.removeCombatant('tidus');
    expect(freed.get('tidus')).toBe(1);
    stage.dispose();
    expect(freed.get('tidus'), 'not freed a second time').toBe(1);
    expect(freed.get('yuna')).toBe(1);
  });

  it('a second teardown on an emptied stage frees nothing again', async () => {
    const stage = newStage();
    await stage.add(member('tidus', 'party', 0));
    let n = 0;
    (ellipseOf(made[0]!.actor)!.material as MeshBasicMaterial).addEventListener('dispose', () => n++);
    stage.dispose();
    stage.dispose();
    expect(n).toBe(1);
  });
});
