// @vitest-environment jsdom
/**
 * REDUCE FLASHES on the REAL `PaintedStage` (PR-0032): the screen wash (`screenFlash`, which the summon, the form change, the
 * Spherechange, the imminent-attack warning, every element wash and the cutscene fades all go through), the element wash a `'screen'`
 * VFX plays, the bloom at a blow, and the getter the stage hands every actor it stages. Off, the stage paints what it always painted.
 *
 * The actor and the hit effects are replaced by recorders (the way `engine/stage-edge-feather.test.ts` does): the REAL `PaintedActor`
 * flash is `flash-actor.test.ts`. Game case: both (shared plumbing).
 */
import { Group, Object3D, PerspectiveCamera, Scene, type Vector3 } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const made: Array<Object3D & Record<string, unknown>> = [];
const blooms: unknown[][] = [];

vi.mock('../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      f['height'] = 2;
      f['centerPoint'] = (v: Vector3): Vector3 => v.set(0, 1, 0);
      made.push(f);
      return f;
    }),
  },
}));
vi.mock('../../src/engine/VFX.ts', () => ({
  HitEffects: class extends Group {
    flash = { play: (...a: unknown[]): number => blooms.push(a) };
    sparks = { emit: (): void => {} };
    slash = { play: async (): Promise<void> => {} };
    update(): void {}
    override dispose(): void {}
  },
}));
vi.mock('../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage } = await import('../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../src/engine/BattleCamera.ts');
const { ZANARKAND_DOME_SLOTS } = await import('../../src/scenes/zanarkand-dome.ts');
const { DIM_IVORY, IVORY, SOFT_BLOOM_CAP } = await import('../../src/engine/flashRules.ts');

type Who = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const who = (id: string, side: 'enemy' | 'aeon' | 'party'): Who =>
  ({ id, side, slot: 0, alive: true, spriteKey: id, flags: { isBoss: side === 'enemy' } }) as unknown as Who;

let on = false;

function stage(withFlag = true): { stage: InstanceType<typeof PaintedStage>; root: HTMLElement } {
  const cam = new PerspectiveCamera();
  const root = document.createElement('div');
  document.body.appendChild(root);
  const s = new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots: ZANARKAND_DOME_SLOTS,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
    overlayRoot: root,
    ...(withFlag ? { reduceFlashes: () => on } : {}),
  });
  return { stage: s, root };
}

const wash = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('.battle-screen-flash')!;

beforeEach(() => {
  made.length = 0;
  blooms.length = 0;
  on = false;
  document.body.innerHTML = '';
});

describe('screenFlash', () => {
  it('off, with no option at all: the colour as given at opacity 1, as it has always been', () => {
    const { stage: s, root } = stage(false);
    s.screenFlash('#ffffff', 260);
    expect(wash(root).style.background).toMatch(/^(#ffffff|rgb\(255, 255, 255\))/);
    expect(wash(root).style.opacity).toBe('1');
  });

  it('off, with the option answering false: the same', () => {
    const { stage: s, root } = stage();
    s.screenFlash('#ffffff', 260);
    expect(wash(root).style.opacity).toBe('1');
    s.screenFlash('rgba(255,70,50,0.28)', 420);
    expect(wash(root).style.opacity).toBe('1');
  });

  it('on: a white wash is ivory at 35 %', () => {
    on = true;
    const { stage: s, root } = stage();
    s.screenFlash('#ffffff', 260);
    const el = wash(root);
    expect(el.style.opacity).toBe('0.35');
    expect(el.style.background).toMatch(/^(#fff1d6|rgb\(255, 241, 214\))/i);
    expect(IVORY.toLowerCase()).toBe('#fff1d6');
  });

  it('on: the imminent-attack red (already 28 %) is not touched, the defeat dim is not touched', () => {
    on = true;
    const { stage: s, root } = stage();
    s.screenFlash('rgba(255,70,50,0.28)', 420);
    expect(wash(root).style.opacity).toBe('1');
    s.screenFlash('rgba(0,0,0,0.55)', 900);
    expect(wash(root).style.opacity).toBe('1');
    expect(wash(root).style.background).toContain('0.55');
  });

  it('on: a white wash of 900 ms (a cover) is opaque in dim ivory, never white', () => {
    on = true;
    const { stage: s, root } = stage();
    s.screenFlash('#ffffff', 900);
    expect(wash(root).style.opacity).toBe('1');
    expect(wash(root).style.background).toMatch(new RegExp(`^(${DIM_IVORY}|rgb\\(89, 84, 75\\))`, 'i'));
  });

  it('the getter is read at every call, so the pause\'s switch applies on resume', () => {
    const { stage: s, root } = stage();
    s.screenFlash('#ffffff', 220);
    expect(wash(root).style.opacity).toBe('1');
    on = true;
    s.screenFlash('#ffffff', 220);
    expect(wash(root).style.opacity).toBe('0.35');
    on = false;
    s.screenFlash('#ffffff', 220);
    expect(wash(root).style.opacity).toBe('1');
  });

  it('every wash goes through it: the presenter\'s vfx port', () => {
    on = true;
    const { stage: s, root } = stage();
    s.vfx.screenFlash('#ffffff', 220);
    expect(wash(root).style.opacity).toBe('0.35');
  });
});

describe('an element wash (a `screen` VFX key)', () => {
  const KEYS: Array<[string, boolean]> = [
    // [key, true when the element's colour is white-ish and so turns ivory]
    ['fire', false],
    ['ice', false],
    ['lightning', false],
    ['water', false],
    ['holy', false],
    ['heal', false],
    ['slash', true], // 0xffffff
    ['impact', false],
    ['dark', false],
  ];

  it.each(KEYS)('%s peaks at 35 %% under the setting and at full strength without it', async (key, white) => {
    const off = stage();
    await off.stage.vfx.play(key as never, 'screen');
    expect(wash(off.root).style.opacity).toBe('1');
    on = true;
    const soft = stage();
    await soft.stage.vfx.play(key as never, 'screen');
    expect(wash(soft.root).style.opacity).toBe('0.35');
    if (white) expect(wash(soft.root).style.background).toMatch(/^(#fff1d6|rgb\(255, 241, 214\))/i);
    on = false;
  });
});

describe('the bloom at a blow', () => {
  async function blow(opts: { crit?: boolean; quiet?: boolean } = {}): Promise<unknown[][]> {
    const { stage: s } = stage();
    await s.add(who('seymour-flux', 'enemy'));
    blooms.length = 0;
    await s.vfx.impact('seymour-flux', { element: 'fire', crit: opts.crit === true, ...(opts.quiet ? { quiet: true } : {}) });
    return [...blooms];
  }

  it('off: today\'s bloom, with no cap, on every blow, quiet or not', async () => {
    const a = await blow();
    expect(a).toHaveLength(1);
    expect(a[0]![4], 'no cap argument').toBeUndefined();
    const b = await blow({ quiet: true });
    expect(b, 'a quiet blow still blooms with the setting off: only the setting turns the rule on').toHaveLength(1);
  });

  it('on: the bloom peaks at 35 %', async () => {
    on = true;
    const a = await blow({ crit: true });
    expect(a).toHaveLength(1);
    expect(a[0]![4]).toBe(SOFT_BLOOM_CAP);
    expect(a[0]![2], 'its size is not touched').toBeGreaterThan(0);
  });

  it('on: a later blow of the action (quiet) opens no bloom', async () => {
    on = true;
    expect(await blow({ quiet: true })).toHaveLength(0);
  });
});

describe('the getter every staged actor carries', () => {
  it('answers the setting live', async () => {
    const { stage: s } = stage();
    await s.add(who('tidus', 'party'));
    await s.add(who('seymour-flux', 'enemy'));
    expect(made).toHaveLength(2);
    for (const a of made) {
      const soft = a['softFlash'] as () => boolean;
      expect(soft(), 'off').toBe(false);
      on = true;
      expect(soft(), 'on').toBe(true);
      on = false;
    }
  });

  it('answers false when the stage was given no setting', async () => {
    const { stage: s } = stage(false);
    await s.add(who('tidus', 'party'));
    expect((made[0]!['softFlash'] as () => boolean)()).toBe(false);
  });
});
