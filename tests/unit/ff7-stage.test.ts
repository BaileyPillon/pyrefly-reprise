/**
 * **FF7's battle staging at the No. 1 Reactor core** (the hidden Guard Scorpion
 * experiment): sides, facing, rows, the fixed camera, the boss's two forms,
 * and that none of it reaches an FFX or FFX-2 scene.
 *
 * Driven through the real `PaintedStage.add` with `PaintedActor.create`
 * recorded, not run (it needs a WebGL canvas), as `stage-figure-heights.test.ts`.
 *
 * **Game case: FF7 only** [AGENTS.md rule 14]; the "unchanged" cases pin the
 * FFX / FFX-2 path.
 */

import { existsSync, readFileSync } from 'node:fs';
import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const created: Array<Record<string, unknown>> = [];

vi.mock('../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      return f;
    }),
  },
}));
vi.mock('../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage } = await import('../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../src/engine/BattleCamera.ts');
const { HoldableCamera } = await import('../../src/engine/TargetFrameHold.ts');
const { FixedCamera, bodyFacingOption, stageCamera } = await import('../../src/engine/StageFacing.ts');
const { facingForSide, mirrorFor } = await import('../../src/engine/BattlePresenterActors.ts');
const { stagingOf } = await import('../../src/scenes/types.ts');
const S = await import('../../src/scenes/sector1-reactor-staging.ts');
const { SECTOR1_SLOTS } = await import('../../src/scenes/sector1-reactor.ts');
const { CAVERN_STOLEN_FAYTH_SLOTS } = await import('../../src/scenes/cavern-stolen-fayth.ts');
const { getSceneFactory, getScene } = await import('../../src/scenes/index.ts');
const { Ff7StageDirector } = await import('../../src/app/screens/BattleScreenFf7Stage.ts');
const { sector1ReactorBuild } = await import('../../src/data/ff7/builds/sector1-reactor.ts');
const { guardScorpion } = await import('../../src/data/ff7/enemies/guard-scorpion.ts');

type Fighter = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const fighter = (id: string, side: 'party' | 'enemy', slot: number, spriteKey: string, isBoss = false): Fighter =>
  ({ id, side, slot, alive: true, spriteKey, flags: { isBoss } }) as unknown as Fighter;

function stageWith(slots: typeof SECTOR1_SLOTS): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}
const optsFor = (id: string): Record<string, unknown> => created.find((o) => o['name'] === id)!;

/** The painted facing each installed FF7 painting declares (its sidecar), as installed on 2026-09-27. */
const ART_FACING = { 'ff7-cloud': 'left', 'ff7-barret': 'left', 'ff7-guard-scorpion': 'right', 'ff7-guard-scorpion-tail-up': 'right' } as const;

describe('FF7 staging: sides and facing (research/ff7-battle-staging.md §2, §3.3)', () => {
  beforeEach(() => {
    created.length = 0;
  });

  it('stands the party on the right and Guard Scorpion on the left, both starting in the front row', () => {
    const [cloud, barret] = SECTOR1_SLOTS.party;
    const boss = SECTOR1_SLOTS.enemySpots?.[S.SECTOR1_BOSS_ID];
    expect(boss).toBeDefined();
    expect(cloud![0]).toBeGreaterThan(boss![0]);
    expect(barret![0]).toBeGreaterThan(boss![0]);
    // One front row: about the same distance from the enemy (staging §5), both nearer it than any back-row spot.
    const dist = (p: readonly number[]): number => Math.hypot(p[0]! - boss![0], p[2]! - boss![2]);
    expect(Math.abs(dist(cloud!) - dist(barret!))).toBeLessThan(0.15);
    for (const slot of [0, 1]) expect(dist(S.rowSpot(slot, 'back'))).toBeGreaterThan(Math.max(dist(cloud!), dist(barret!)));
    expect(sector1ReactorBuild.members.map((m) => m.row)).toEqual(['front', 'front']);
    // The camera sits between them: the boss is left of the axis, the party right of it.
    expect(boss![0]).toBeLessThan(S.SECTOR1_CAMERA.position[0]);
    expect(cloud![0]).toBeGreaterThan(S.SECTOR1_CAMERA.position[0]);
  });

  it('turns the party toward -x and the boss toward +x through the stage', async () => {
    const stage = stageWith(SECTOR1_SLOTS);
    await stage.add(fighter('cloud', 'party', 0, 'ff7-cloud'));
    await stage.add(fighter('barret', 'party', 1, 'ff7-barret'));
    await stage.add(fighter('guard-scorpion', 'enemy', 0, 'ff7-guard-scorpion', true));
    expect(optsFor('cloud')).toMatchObject({ facing: -1 });
    expect(optsFor('barret')).toMatchObject({ facing: -1 });
    expect(optsFor('guard-scorpion')).toMatchObject({ facing: 1 });
    for (const id of ['cloud', 'barret', 'guard-scorpion']) expect(optsFor(id)).not.toHaveProperty('side');
    for (const id of ['cloud', 'barret', 'guard-scorpion']) expect(optsFor(id)['turnRing'], id).toBe(false); // FF7's triangle is the only turn marker
  });

  it('never mirrors a painting: each faces the way its body turns (Barret keeps his right gun-arm)', () => {
    expect(mirrorFor(ART_FACING['ff7-cloud'], -1)).toBe(1);
    expect(mirrorFor(ART_FACING['ff7-barret'], -1)).toBe(1);
    expect(mirrorFor(ART_FACING['ff7-guard-scorpion'], 1)).toBe(1);
    expect(mirrorFor(ART_FACING['ff7-guard-scorpion-tail-up'], 1)).toBe(1);
    // And had the house rule turned them (party +x), every one would have been flipped.
    expect(mirrorFor(ART_FACING['ff7-barret'], facingForSide('party'))).toBe(-1);
  });

  it('reads the same facing from the installed sidecars and the art manifest, where the art is on disk', () => {
    const manifest = 'public/art/manifest.json';
    if (!existsSync(manifest)) return; // art is local only (public/art is gitignored)
    const subjects = JSON.parse(readFileSync(manifest, 'utf8')).subjects as Record<string, { facing?: string; states: string[] }>;
    for (const [id, facing] of Object.entries(ART_FACING)) {
      expect(subjects[id]?.facing, id).toBe(facing);
      expect(subjects[id]?.states, id).toContain('idle');
      const side = JSON.parse(readFileSync(`public/art/characters/${id}/idle.json`, 'utf8')) as { facing: string };
      expect(side.facing, id).toBe(facing);
    }
  });

  it('points the FF7 data at the installed art ids, which cannot collide with an FFX or FFX-2 id', () => {
    expect(sector1ReactorBuild.members.map((m) => m.spriteKey)).toEqual(['ff7-cloud', 'ff7-barret']);
    expect(guardScorpion.forms.map((f) => f.spriteKey)).toEqual(['ff7-guard-scorpion', S.SECTOR1_TAIL_UP_ART]);
  });

  it('sizes the boss larger than the party, from the composite', () => {
    const h = S.SECTOR1_HEIGHTS;
    expect(h['guard-scorpion']).toBeGreaterThan(h.barret);
    expect(h.barret).toBeGreaterThan(h.cloud);
    expect(SECTOR1_SLOTS.figureHeights).toEqual(h);
  });
});

describe('FF7 rows (staging §5) and the raised tail', () => {
  it('puts the back row further right (away from the enemy), same depth', () => {
    for (const slot of [0, 1]) {
      const front = S.rowSpot(slot, 'front');
      const back = S.rowSpot(slot, 'back');
      expect(back[0] - front[0]).toBeCloseTo(S.SECTOR1_BACK_ROW_DX, 9);
      expect(back[0]).toBeGreaterThan(front[0]);
      expect([back[1], back[2]]).toEqual([front[1], front[2]]);
    }
    expect(S.rowSpot(0, 'front')).toEqual([...SECTOR1_SLOTS.party[0]!]);
  });

  it('shifts the boss only for the tail-raised painting, by the crop offset at the idle pixel scale', () => {
    expect(S.bossArtShift('ff7-guard-scorpion')).toBe(0);
    expect(S.bossArtShift(S.SECTOR1_TAIL_UP_ART)).toBeCloseTo((71 * 2.16) / 681, 9);
  });

  it('steps a member whose row flipped and moves the boss when its painting swaps', () => {
    const actors = new Map<string, Object3D & { moves: unknown[]; moveTo: (p: unknown, ms: number) => Promise<void> }>();
    for (const id of ['cloud', 'barret', 'guard-scorpion']) {
      const a = Object.assign(new Object3D(), { moves: [] as unknown[] }) as Object3D & { moves: unknown[]; moveTo: (p: unknown, ms: number) => Promise<void> };
      a.moveTo = async (p: unknown, ms: number): Promise<void> => void a.moves.push({ p, ms });
      actors.set(id, a);
    }
    let bossArt = 'ff7-guard-scorpion';
    const stage = {
      actor: (id: string) => actors.get(id),
      snapshot: () => [{ id: 'guard-scorpion', art: bossArt }],
    } as unknown as InstanceType<typeof PaintedStage>;
    const row: Record<string, 'front' | 'back'> = { cloud: 'front', barret: 'front' };
    const state = () =>
      ({
        activeIds: ['cloud', 'barret'],
        combatants: {
          cloud: { id: 'cloud', slot: 0, ff7: { row: row['cloud'] } },
          barret: { id: 'barret', slot: 1, ff7: { row: row['barret'] } },
        },
      }) as never;

    const d = new Ff7StageDirector(stage);
    d.place(state());
    expect(actors.get('barret')!.position.toArray()).toEqual(S.rowSpot(1, 'front'));
    expect(actors.get('guard-scorpion')!.position.x).toBe(S.SECTOR1_BOSS_SPOT[0]);

    d.sync(state()); // nothing changed
    expect(actors.get('barret')!.moves).toEqual([]);

    row['barret'] = 'back';
    d.sync(state());
    expect(actors.get('barret')!.moves).toEqual([{ p: { x: S.rowSpot(1, 'back')[0], y: 0, z: S.rowSpot(1, 'back')[2] }, ms: 360 }]);
    expect(d.stagedRow('barret')).toBe('back');
    expect(actors.get('cloud')!.moves).toEqual([]);

    bossArt = S.SECTOR1_TAIL_UP_ART;
    d.sync(state());
    expect(actors.get('guard-scorpion')!.position.x).toBeCloseTo(S.SECTOR1_BOSS_SPOT[0] + S.bossArtShift(bossArt), 9);
    bossArt = 'ff7-guard-scorpion';
    d.sync(state());
    expect(actors.get('guard-scorpion')!.position.x).toBe(S.SECTOR1_BOSS_SPOT[0]);
  });
});

describe("FF7's fixed camera (manual p. 30)", () => {
  function recorder(): { port: ConstructorParameters<typeof HoldableCamera>[0]; calls: string[] } {
    const calls: string[] = [];
    const port = {
      moveTo: async (r: string) => void calls.push(`moveTo:${r}`),
      snapTo: (r: string) => void calls.push(`snapTo:${r}`),
      shake: () => void calls.push('shake'),
      punch: async () => void calls.push('punch'),
      push: async () => void calls.push('push'),
      release: async () => void calls.push('release'),
      roll: async () => void calls.push('roll'),
      rigNames: ['idle', 'action'],
      rigName: 'idle',
    };
    return { port: port as never, calls };
  }

  it('holds the idle angle for the whole battle: moves, cuts, pushes, rolls and punches do nothing; shake plays', async () => {
    const { port, calls } = recorder();
    const cam = new FixedCamera(port);
    calls.length = 0;
    await cam.moveTo('action' as never, 400);
    cam.snapTo('action' as never);
    await cam.punch(0.2);
    await cam.push(0.2);
    await cam.roll(-4);
    cam.hold(false); // the presenter's release before the victory: ignored
    await cam.moveTo('victory' as never, 400);
    cam.shake(0.2, 300);
    expect(calls).toEqual(['shake']);
    expect(cam.holding).toBe(true);
  });

  it('every rig the scene publishes is the one fixed shot, with no sway', () => {
    const rigs = S.sector1RigsFor(16 / 9);
    for (const name of ['intro', 'idle', 'action', 'victory', 'enemy', 'party']) expect(rigs[name]).toEqual(S.SECTOR1_FIXED_RIG);
    expect(S.SECTOR1_FIXED_RIG.sway).toBe(0);
  });

  it('opens the fov on an upright phone so the fight keeps its width', () => {
    const wide = S.sector1RigsFor(16 / 9).idle;
    const phone = S.sector1RigsFor(390 / 844).idle;
    const halfW = (fov: number, aspect: number): number => Math.tan((fov * Math.PI) / 360) * aspect;
    expect(halfW(phone.fov!, 390 / 844)).toBeCloseTo(halfW(wide.fov!, 16 / 9), 3);
    expect(phone.position).toEqual(wide.position);
  });

  it('sizes the painting to cover the 16:9 frame, and the full width of a phone frame (letterboxed, still registered)', () => {
    const p = S.sector1Backdrop();
    const plateH = (p.width * S.SECTOR1_PLATE.h) / S.SECTOR1_PLATE.w;
    const d = S.SECTOR1_CAMERA.position[2] - p.distance;
    for (const aspect of [16 / 9, 390 / 844]) {
      const halfH = d * Math.tan((S.sector1RigsFor(aspect).idle.fov! * Math.PI) / 360);
      expect(p.width / 2, String(aspect)).toBeGreaterThanOrEqual(halfH * aspect * 0.999);
    }
    const halfH169 = d * Math.tan((S.SECTOR1_FOV * Math.PI) / 360);
    expect(plateH / 2).toBeGreaterThanOrEqual(halfH169);
  });
});

describe('FFX and FFX-2 scenes are untouched', () => {
  beforeEach(() => {
    created.length = 0;
  });

  it('a scene without sideFacing still hands the actor its side (the house rule), exactly as before', async () => {
    const stage = stageWith(CAVERN_STOLEN_FAYTH_SLOTS);
    await stage.add(fighter('lulu', 'party', 0, 'lulu'));
    await stage.add(fighter('yojimbo', 'enemy', 1, 'yojimbo', true));
    expect(optsFor('lulu')).toMatchObject({ side: 'party' });
    expect(optsFor('yojimbo')).toMatchObject({ side: 'enemy' });
    expect(optsFor('lulu')['turnRing']).toMatchObject({ color: 0xf0cf92 }); // FFX keeps its gold ring
    expect(optsFor('lulu')).not.toHaveProperty('facing');
    expect(bodyFacingOption(undefined, 'aeon')).toEqual({ side: 'aeon' });
  });

  it('a scene without fixedCamera gets the plain holdable camera, not held', () => {
    const stage = stageWith(CAVERN_STOLEN_FAYTH_SLOTS);
    expect(stage.camera).toBeInstanceOf(HoldableCamera);
    expect(stage.camera).not.toBeInstanceOf(FixedCamera);
    expect(stage.camera.holding).toBe(false);
    expect(stageWith(SECTOR1_SLOTS).camera).toBeInstanceOf(FixedCamera);
    expect(stageCamera({} as never, undefined)).not.toBeInstanceOf(FixedCamera);
  });

  it('stagingOf carries the two switches only when a scene sets them', () => {
    expect(stagingOf({ sideFacing: { party: -1, enemy: 1 }, fixedCamera: true })).toEqual({
      sideFacing: { party: -1, enemy: 1 },
      fixedCamera: true,
    });
    expect(stagingOf({ holdParty: true })).toEqual({ holdParty: true });
  });

  it('registers the FF7 scene under its own key', () => {
    expect(getSceneFactory('sector1-reactor')).toBeTypeOf('function');
    expect(getScene('sector1-reactor')).toMatchObject({ placeholder: false, slots: SECTOR1_SLOTS });
  });
});
