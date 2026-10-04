/**
 * **E1-H (D-360, Bailey 2026-10-03 ~16:25 EDT): Evrae's NEAR slot moves right for the repainted idle, and is pinned.**
 *
 * The approved idle was repainted with the neck arch lengthened 165 px so the head stays and the coil stands right of the party
 * (tail loop dropped; 200 px of canvas cropped at the left, so 1171 px became 1136). A painted plane is centred on its slot, so
 * for the head to stay put the slot moves right by `(200 + 165) / 2` canvas px of `4.1 / 768` world. Evrae's resolved centre
 * before the repaint was 3.018, not the data spot's 2.3 (ProneLay slid the wide idle's plane 0.718 right along the floor), and a
 * pinned figure is never slid: the deck pins Evrae and Cid (`SceneSlots.enemySpots`) on the director's own NEAR spot, which is
 * that resolved centre plus the move, less the 0.1 world rail trim of the repair. Staging, not game data.
 *
 * **The repair of the critic's check (2026-10-04).** The coil reached the turn rail at 16:10 and 4:3, and the phone's refit pulled
 * the camera back for the longer figure. NEAR's rigs now stand back as the window narrows (`nearDollyFor`, Chapter VIII's Evrae
 * only), and the phone's A-12 refit leaves Evrae out (`PHONE_FIT_KEY`).
 *
 * What this holds: the formula, the composition of the spot, the pin, the untouched generic slot table that Chapters XVII and XVIII
 * share, the relax step and the director both leaving the pinned spot alone, the aspect stand-back (its function, the coil keeping
 * its 16:9 place in the window, whom it applies to), the phone's flag, and (only once the E1-H art is installed, because
 * `public/art` is gitignored) the installed canvas agreeing with the numbers.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Evrae is Chapter VIII's boss and its range mechanic has no FFX-2 counterpart
 * (`research/ffx-evrae-airship.md` section 0.4); nothing here is read by an FFX-2 chapter.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../../src/engine/ArtManifest.ts';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import { PHONE_FIT_KEY } from '../../../src/engine/ShotRules.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import type { DepthRect } from '../../../src/engine/ScreenRects.ts';
import { solveFormation, type Spot } from '../../../src/engine/Formation.ts';
import { laneFrom, relaxActorsOf, relaxField, type RelaxField, type StagedForRelax } from '../../../src/engine/StageRelax.ts';
import { evraeGroup } from '../../../src/data/ffx/enemies/evrae.ts';
import { EVRAE_AIRSHIP_DECK_RIGS as RIGS, EVRAE_AIRSHIP_DECK_SLOTS as SLOTS, EVRAE_ENEMY_SLOT } from '../../../src/scenes/evrae-airship-deck.ts';
import { AirshipRangeDirector } from '../../../src/scenes/evrae-airship-director.ts';
import {
  EVRAE_COIL_REACH,
  EVRAE_TRIM_PER_DOLLY,
  NEAR_ASPECT_REF,
  NEAR_DOLLY_MARGIN,
  NEAR_DOLLY_MAX,
  nearAspectFor,
  nearCoilDepthRatio,
  nearDollyFor,
} from '../../../src/scenes/evrae-airship-aspect.ts';
import {
  EVRAE_BASELINE_PX,
  EVRAE_E1H_RAIL_TRIM_DX,
  EVRAE_E1H_SLOT_DX,
  EVRAE_NEAR_CENTRE_X_BEFORE_E1H,
  EVRAE_NEAR_SPOT,
  EVRAE_NEAR_SPOT_BEFORE_E1H,
  EVRAE_WORLD_HEIGHT,
  RANGE_STAGING,
} from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';
import { evraeSubject, phoneRig } from '../../../src/scenes/evrae-airship-subjects.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';

afterEach(() => {
  resetArtManifest();
  vi.unstubAllGlobals();
});

describe('the slot move', () => {
  it('is the repaint\'s canvas change: ((200 + 165) / 2) canvas px of 4.1 / 768 world, kept to four places', () => {
    const exact = ((200 + 165) / 2) * (EVRAE_WORLD_HEIGHT / EVRAE_BASELINE_PX.near);
    expect(exact).toBeCloseTo(0.97428, 5);
    expect(EVRAE_E1H_SLOT_DX).toBeCloseTo(exact, 3);
    expect(EVRAE_E1H_SLOT_DX).toBe(0.9743);
  });

  it('puts NEAR Evrae on the centre it resolved to before (3.018) plus that move and the rail trim, at the data spot\'s height and depth', () => {
    expect(EVRAE_NEAR_CENTRE_X_BEFORE_E1H).toBe(3.018);
    expect(EVRAE_E1H_RAIL_TRIM_DX).toBe(-0.1);
    expect([...EVRAE_NEAR_SPOT_BEFORE_E1H]).toEqual([2.3, -0.9, -4.7]);
    expect(EVRAE_NEAR_SPOT[0]).toBeCloseTo(3.018 + 0.9743 - 0.1, 6);
    expect(EVRAE_NEAR_SPOT[1]).toBe(EVRAE_NEAR_SPOT_BEFORE_E1H[1]);
    expect(EVRAE_NEAR_SPOT[2]).toBe(EVRAE_NEAR_SPOT_BEFORE_E1H[2]);
    expect([...RANGE_STAGING.near.evrae]).toEqual([...EVRAE_NEAR_SPOT]);
    expect(evraeSubject().spot.near).toEqual(RANGE_STAGING.near.evrae);
  });

  it('leaves FAR\'s spot and every rig alone', () => {
    expect([...RANGE_STAGING.far.evrae]).toEqual([6.4, 3.3, -30]);
    expect(RANGE_STAGING.near.rigs.idle).toEqual({ position: [-0.5, 1.45, 9.4], lookAt: [0.9, 1.75, -3.0], fov: 34 });
  });
});

describe('the pin', () => {
  it('stands Evrae and Cid on the director\'s own NEAR spot, and nobody else', () => {
    expect(SLOTS.enemySpots).toEqual({ evrae: [...RANGE_STAGING.near.evrae], cid: [...RANGE_STAGING.near.evrae] });
    expect(Object.keys(SLOTS.enemySpots ?? {}).sort()).toEqual(Object.keys(EVRAE_ENEMY_SLOT).sort());
    expect(SLOTS.holdParty).toBe(true);
  });

  it('leaves the generic enemy slot table at its pre-E1-H point: Chapters XVII and XVIII share this slot object', () => {
    expect(SLOTS.enemy).toEqual([[...EVRAE_NEAR_SPOT_BEFORE_E1H], [...EVRAE_NEAR_SPOT_BEFORE_E1H]]);
    // Their combatants (Fins, Genais, the Core, the face) are not named in the pin, so it is inert for them.
    for (const id of ['left-fin', 'right-fin', 'sinspawn-genais', 'sin-core', 'overdrive-sin']) {
      expect(SLOTS.enemySpots?.[id], id).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------------
// The shared relax step leaves a pinned Evrae where it is
// ---------------------------------------------------------------------------------------------------------------------------

function camera(): PerspectiveCamera {
  const c = new PerspectiveCamera(32, 16 / 9, 0.1, 100);
  c.position.set(0, 2, 10);
  c.lookAt(0, 1, 0);
  c.updateMatrixWorld(true);
  return c;
}

/**
 * Evrae and the invisible Cid share one slot (he is on the enemy side only for a turn-order row), so their boxes overlap exactly,
 * and Rikku stands in front of them; staged as the stage stages them: pinned when the scene's `enemySpots` names them.
 */
function deck(slots: SceneSlots): { f: RelaxField; rikku: Vector3; evrae: Vector3; cid: Vector3 } {
  const [rx, ry, rz] = SLOTS.party[2]!;
  const rikku = new Vector3(rx, ry, rz);
  const spot = slots.enemySpots?.['evrae'] ?? [...EVRAE_NEAR_SPOT_BEFORE_E1H];
  const evrae = new Vector3(spot[0], spot[1], spot[2]);
  const cid = evrae.clone();
  const widths = new Map([['rikku', 166], ['evrae', 700], ['cid', 160]]);
  const pin = (id: string): { pinned?: boolean } => (slots.enemySpots?.[id] ? { pinned: true } : {});
  const staged = new Map<string, StagedForRelax>([
    ['rikku', { kind: 'party', actor: { position: rikku } }],
    ['evrae', { kind: 'enemy', actor: { position: evrae }, ...pin('evrae') }],
    ['cid', { kind: 'enemy', actor: { position: cid }, ...pin('cid') }],
  ]);
  const f: RelaxField = {
    actors: relaxActorsOf(staged),
    rects: () => {
      const out = new Map<string, DepthRect>();
      for (const [id, st] of staged) {
        const w = widths.get(id)!;
        out.set(id, { x: 800 + st.actor.position.x * 100 - w / 2, y: 300, w, h: 300, depth: id === 'rikku' ? 9 : id === 'cid' ? 12 : 16 });
      }
      return out;
    },
    panels: [],
    camera: camera(),
    canvasW: 1600,
    slots,
  };
  return { f, rikku, evrae, cid };
}

/** What `BattlePresenterStage.applyFormation` hands the solver: the enemies the scene does not pin, in the scene's own lane. */
function formationSpots(slots: SceneSlots): Map<string, Spot> {
  const members = ['evrae', 'cid'].filter((id) => !slots.enemySpots?.[id]).map((id) => ({ id, height: EVRAE_WORLD_HEIGHT }));
  if (members.length < 2) return new Map();
  return new Map(solveFormation(members, laneFrom(slots.enemy)).map((s) => [s.id, s.spot]));
}

describe('the shared steps and the pin', () => {
  it('names the combatant ids the formation really has (a wrong key would silently pin nobody)', () => {
    expect(evraeGroup.enemies.map((e) => e.id).sort()).toEqual(Object.keys(SLOTS.enemySpots ?? {}).sort());
  });

  it('the formation solver spreads an unpinned Evrae and Cid off their slot, and has nothing to move once both are pinned', () => {
    const free = formationSpots({ ...SLOTS, enemySpots: undefined });
    expect(free.size).toBe(2);
    expect(Math.abs(free.get('evrae')![0] - EVRAE_NEAR_SPOT_BEFORE_E1H[0])).toBeGreaterThan(0.05);
    expect(formationSpots(SLOTS).size).toBe(0);
  });

  it('the relax step nudges an unpinned Evrae out from behind Cid, and leaves the pinned pair exactly where they stand', () => {
    const free = deck({ ...SLOTS, enemySpots: undefined });
    const start = free.evrae.x;
    for (let call = 0; call < 6; call++) if (relaxField(free.f, 14)) break;
    expect(Math.abs(free.evrae.x - start)).toBeGreaterThan(0.05);

    const pinned = deck(SLOTS);
    const before = [pinned.evrae.toArray(), pinned.cid.toArray()];
    for (let call = 0; call < 12; call++) if (relaxField(pinned.f, 14)) break;
    expect([pinned.evrae.toArray(), pinned.cid.toArray()]).toEqual(before);
    expect(before[0]).toEqual([...RANGE_STAGING.near.evrae]);
    expect(pinned.rikku.x).toBe(SLOTS.party[2]![0]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------
// The range director places Evrae on the pin at NEAR, and the swap to FAR and back keeps it there
// ---------------------------------------------------------------------------------------------------------------------------

function evraeManifest(): ArtManifest {
  return {
    version: 1,
    generatedAt: 'test',
    subjects: { evrae: { states: ['attack', 'breath-charge', 'hurt', 'idle', 'idle-far', 'idle-near', 'ko'], portrait: false, facing: 'left' } },
    portraits: [],
    backdrops: [],
    pause: [],
    pause2x: [],
    title: [],
    title2x: [],
  } as ArtManifest;
}

function fakeDeck(): AirshipDeck {
  return { group: new Group(), layers: [], wind: 1, setHaze(): void {}, update(): void {}, dispose(): void {} } as unknown as AirshipDeck;
}

function fakeActor() {
  return {
    pose: 'idle',
    u: { rimStrength: { value: 0.7 } },
    extents: { maxExtent: 2.2, minExtent: 0.5, proneAspect: 1.15 },
    lifeState: 'alive',
    position: new Vector3(),
    scale: new Vector3(1, 1, 1),
    userData: {} as Record<string, unknown>,
    poseSize: [10, 5] as [number, number],
    setAlpha(): void {},
    async loadPoses(): Promise<void> {},
  };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

describe('the range director', () => {
  it('places Evrae on the pinned spot at NEAR, on the FAR spot at FAR, and back on the pinned spot', async () => {
    setArtManifest(evraeManifest());
    const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const actor = fakeActor();
    await director.bindEvrae(actor as never);
    expect(actor.position.toArray()).toEqual([...SLOTS.enemySpots!['evrae']!]);
    director.setRange('far', { immediate: true });
    await settle();
    expect(actor.position.toArray()).toEqual([...RANGE_STAGING.far.evrae]);
    director.setRange('near', { immediate: true });
    await settle();
    expect(actor.position.toArray()).toEqual([...SLOTS.enemySpots!['evrae']!]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------
// The aspect stage: NEAR's rigs stand back as the window narrows (D-360 repair of the critic's check, 2026-10-04)
// ---------------------------------------------------------------------------------------------------------------------------

const ASPECTS = { '21:9': 2560 / 1080, '1.98': 2000 / 1012, '16:9': 16 / 9, '16:10': 16 / 10, '3:2': 3 / 2, '4:3': 4 / 3 } as const;

function lookCamera(rig: { position: readonly number[]; lookAt: readonly number[]; fov: number }, aspect: number): PerspectiveCamera {
  const c = new PerspectiveCamera(rig.fov, aspect, 0.1, 400);
  c.position.set(rig.position[0]!, rig.position[1]!, rig.position[2]!);
  c.lookAt(new Vector3(rig.lookAt[0]!, rig.lookAt[1]!, rig.lookAt[2]!));
  c.updateMatrixWorld(true);
  return c;
}

/** The painted coil's outer end (the right edge of idle.png's alpha) at mid-height, as the stand-back is sized for it. */
const coilEnd = (): Vector3 => new Vector3(EVRAE_NEAR_SPOT[0] + EVRAE_COIL_REACH, EVRAE_NEAR_SPOT[1] + 1.2, EVRAE_NEAR_SPOT[2]);

describe('the aspect stand-back (nearDollyFor) and the trim that goes with it (nearAspectFor)', () => {
  it('is 1 at 16:9 and wider, and grows as the window narrows, up to the mix\'s own bound', () => {
    expect(NEAR_ASPECT_REF).toBeCloseTo(16 / 9, 12);
    for (const a of [ASPECTS['21:9'], ASPECTS['1.98'], ASPECTS['16:9']]) expect(nearDollyFor(a)).toBe(1);
    expect(nearDollyFor(ASPECTS['16:10'])).toBeGreaterThan(1.13);
    expect(nearDollyFor(ASPECTS['16:10'])).toBeLessThan(1.16);
    expect(nearDollyFor(ASPECTS['4:3'])).toBeGreaterThan(1.42);
    expect(nearDollyFor(ASPECTS['4:3'])).toBeLessThanOrEqual(NEAR_DOLLY_MAX);
    const asc = [1.7, ASPECTS['16:10'], ASPECTS['3:2'], ASPECTS['4:3'], 1.3].map(nearDollyFor);
    for (let i = 1; i < asc.length; i++) expect(asc[i]).toBeGreaterThanOrEqual(asc[i - 1]!);
    expect(NEAR_DOLLY_MAX).toBe(1.45);
    expect(nearDollyFor(1.25)).toBe(NEAR_DOLLY_MAX);
    expect(nearDollyFor(1)).toBe(NEAR_DOLLY_MAX);
  });

  it('answers 1 to anything that is not a window shape (no window, a zero size)', () => {
    for (const a of [Number.NaN, 0, -1, Number.POSITIVE_INFINITY]) expect(nearDollyFor(a)).toBe(1);
  });

  it('sizes the stand-back for the coil\'s depth along the rig\'s view axis (recomputed here with three.js)', () => {
    const idle = RANGE_STAGING.near.rigs.idle;
    const cam = lookCamera(idle, NEAR_ASPECT_REF);
    const depth = (v: Vector3): number => -v.clone().applyMatrix4(cam.matrixWorldInverse).z;
    const aim = new Vector3(idle.lookAt[0], idle.lookAt[1], idle.lookAt[2]);
    expect(nearCoilDepthRatio()).toBeCloseTo(depth(coilEnd()) / depth(aim), 6);
    expect(nearCoilDepthRatio()).toBeGreaterThan(1.15);
    expect(nearCoilDepthRatio()).toBeLessThan(1.22);
  });

  it('keeps the coil\'s end where it stands at 16:9 in the window\'s width, less the 10 % margin, from 16:10 down to 4:3', () => {
    const at16by9 = coilEnd().project(lookCamera(RANGE_STAGING.near.rigs.idle, NEAR_ASPECT_REF)).x;
    expect(NEAR_DOLLY_MARGIN).toBe(1.1);
    for (const a of [ASPECTS['16:10'], ASPECTS['3:2'], ASPECTS['4:3'], 1.35]) {
      const rig = phoneRig(RANGE_STAGING.near.rigs.idle, { dolly: nearDollyFor(a) });
      const at = coilEnd().project(lookCamera(rig, a)).x;
      expect(at, `aspect ${a.toFixed(3)}`).toBeLessThan(at16by9);
      expect(at, `aspect ${a.toFixed(3)}`).toBeGreaterThan(at16by9 - 0.07);
    }
    // the plain Hor+ rule (margin 1) would land on it exactly, which is what the margin is measured from
    const plain = (a: number): number => 1 + nearCoilDepthRatio() * (NEAR_ASPECT_REF / a - 1);
    for (const a of [ASPECTS['16:10'], ASPECTS['4:3']]) {
      const rig = phoneRig(RANGE_STAGING.near.rigs.idle, { dolly: plain(a) });
      expect(coilEnd().project(lookCamera(rig, a)).x, `plain ${a.toFixed(3)}`).toBeCloseTo(at16by9, 3);
    }
  });

  it('stands the camera back along its own view line: same aim, same angle, farther by the factor', () => {
    const idle = RANGE_STAGING.near.rigs.idle;
    const k = nearDollyFor(ASPECTS['4:3']);
    const rig = phoneRig(idle, { dolly: k });
    expect(rig.lookAt).toEqual(idle.lookAt);
    const before = new Vector3(...idle.position).sub(new Vector3(...idle.lookAt));
    const after = new Vector3(...rig.position).sub(new Vector3(...rig.lookAt));
    expect(after.length()).toBeCloseTo(before.length() * k, 9);
    expect(after.clone().normalize().distanceTo(before.clone().normalize())).toBeLessThan(1e-12);
  });
});

describe('the window\'s trim off the 16:9 pin (nearAspectFor)', () => {
  it('is nothing at 16:9 and wider, and moves the figure left in proportion to the stand-back below it', () => {
    for (const a of [ASPECTS['21:9'], ASPECTS['1.98'], ASPECTS['16:9']]) expect(nearAspectFor(a)).toEqual({ dolly: 1, dx: 0 });
    for (const a of [ASPECTS['16:10'], ASPECTS['3:2'], ASPECTS['4:3'], 1.2]) {
      const { dolly, dx } = nearAspectFor(a);
      expect(dolly).toBe(nearDollyFor(a));
      expect(dx).toBeCloseTo(-EVRAE_TRIM_PER_DOLLY * (dolly - 1), 12);
      expect(dx).toBeLessThan(0);
    }
    expect(EVRAE_TRIM_PER_DOLLY).toBe(0.25);
  });

  it('keeps the pin plus the trim within what the party allows at every window (a total shift of 0.35 world at most)', () => {
    for (const a of [ASPECTS['16:10'], ASPECTS['3:2'], ASPECTS['4:3'], 1, 0.5]) {
      expect(EVRAE_E1H_RAIL_TRIM_DX + nearAspectFor(a).dx).toBeGreaterThan(-0.35);
    }
  });
});

/** A window stand-in for the director's reads (`innerWidth`, `innerHeight`, `matchMedia` for the phone query). */
function stubWindow(w: number, h: number, phone = false): void {
  vi.stubGlobal('window', { innerWidth: w, innerHeight: h, matchMedia: () => ({ matches: phone }) });
}

async function boundDirector(id = 'evrae', actor = fakeActor()) {
  setArtManifest(evraeManifest());
  const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };
  const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
  const camera = new BattleCamera(new PerspectiveCamera(34, 16 / 9, 0.1, 400), { rigs: RIGS as Record<string, never>, initial: 'idle' });
  director.bindCamera(camera);
  await director.bindEvrae(actor as never, id);
  return { director, camera, actor };
}

const positionOf = (camera: BattleCamera, rig: string): number[] => (camera.getRig(rig)!.position as Vector3).toArray();

describe('the range director, aspect and phone (Chapter VIII\'s Evrae only)', () => {
  it('stands NEAR\'s three rigs back for a 16:10 and a 4:3 window, about their own aim', async () => {
    for (const [w, h] of [[1440, 900], [1024, 768]] as const) {
      stubWindow(w, h);
      const { camera } = await boundDirector();
      const k = nearDollyFor(w / h);
      expect(k).toBeGreaterThan(1);
      for (const name of ['idle', 'action', 'enemy'] as const) {
        const want = phoneRig(RANGE_STAGING.near.rigs[name], { dolly: k }).position;
        expect(positionOf(camera, name), `${name} at ${w}x${h}`).toEqual([...want]);
        expect((camera.getRig(name)!.lookAt as Vector3).toArray()).toEqual([...RANGE_STAGING.near.rigs[name].lookAt]);
      }
    }
  });

  it('leaves the rigs as authored at 16:9, 21:9 and with no window at all', async () => {
    for (const [w, h] of [[1600, 900], [2560, 1080]] as const) {
      stubWindow(w, h);
      const { camera } = await boundDirector();
      expect(positionOf(camera, 'idle')).toEqual([...RANGE_STAGING.near.rigs.idle.position]);
    }
    vi.unstubAllGlobals();
    const { camera } = await boundDirector();
    expect(positionOf(camera, 'idle')).toEqual([...RANGE_STAGING.near.rigs.idle.position]);
  });

  it('stands Evrae off the pin by the window\'s trim at NEAR, on the pin at 16:9, and back at the same spot after FAR', async () => {
    stubWindow(1440, 900);
    const narrow = await boundDirector();
    const trim = nearAspectFor(1440 / 900).dx;
    expect(trim).toBeLessThan(0);
    expect(narrow.actor.position.x).toBeCloseTo(EVRAE_NEAR_SPOT[0] + trim, 9);
    expect(narrow.actor.position.y).toBe(EVRAE_NEAR_SPOT[1]);
    expect(narrow.actor.position.z).toBe(EVRAE_NEAR_SPOT[2]);
    narrow.director.setRange('far', { immediate: true });
    await settle();
    expect(narrow.actor.position.toArray()).toEqual([...RANGE_STAGING.far.evrae]);
    narrow.director.setRange('near', { immediate: true });
    await settle();
    expect(narrow.actor.position.x).toBeCloseTo(EVRAE_NEAR_SPOT[0] + trim, 9);
    stubWindow(1600, 900);
    const wide = await boundDirector();
    expect(wide.actor.position.toArray()).toEqual([...EVRAE_NEAR_SPOT]);
  });

  it('puts FAR\'s rigs as authored, and NEAR\'s stand-back again on the way back', async () => {
    stubWindow(1440, 900);
    const { director, camera } = await boundDirector();
    const near = positionOf(camera, 'idle');
    expect(near).not.toEqual([...RANGE_STAGING.near.rigs.idle.position]);
    director.setRange('far', { immediate: true });
    await settle();
    expect(positionOf(camera, 'idle')).toEqual([...RANGE_STAGING.far.rigs.idle.position]);
    director.setRange('near', { immediate: true });
    await settle();
    expect(positionOf(camera, 'idle')).toEqual(near);
  });

  it('does not touch the rigs of a Fin (Chapter XVII) or of no foe (Chapter XVIII), at any window', async () => {
    stubWindow(1024, 768);
    const fin = await boundDirector('left-fin');
    expect(positionOf(fin.camera, 'idle')).toEqual([...RANGE_STAGING.near.rigs.idle.position]);
    const none = await boundDirector('evrae', null as never);
    expect(positionOf(none.camera, 'idle')).toEqual([...RANGE_STAGING.near.rigs.idle.position]);
    expect((fin.actor.userData as Record<string, unknown>)[PHONE_FIT_KEY]).toBeUndefined();
  });

  it('on a phone window keeps the rigs as authored (the A-12 refit owns that camera) and marks Evrae out of the refit', async () => {
    stubWindow(390, 844, true);
    const { camera, actor } = await boundDirector();
    expect(positionOf(camera, 'idle')).toEqual([...RANGE_STAGING.near.rigs.idle.position]);
    expect((actor.userData as Record<string, unknown>)[PHONE_FIT_KEY]).toBe(false);
  });

  it('marks Evrae out of the phone refit on a desktop window too (the flag is read only where the refit runs)', async () => {
    stubWindow(1600, 900);
    const { actor } = await boundDirector();
    expect((actor.userData as Record<string, unknown>)[PHONE_FIT_KEY]).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------
// The installed art, once it is the E1-H set (public/art is gitignored: absent or older art skips these)
// ---------------------------------------------------------------------------------------------------------------------------

const DIR = fileURLToPath(new URL('../../../public/art/characters/evrae/', import.meta.url));
const sidecar = (name: string): { width: number; height: number; baselineY: number } | null => {
  const p = `${DIR}${name}.json`;
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as { width: number; height: number; baselineY: number }) : null;
};
const pngSize = (name: string): [number, number] => {
  const b = readFileSync(`${DIR}${name}.png`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
const E1H_INSTALLED = sidecar('idle')?.width === 1136;

describe('with the E1-H art installed', () => {
  it.skipIf(!E1H_INSTALLED)('the canvas agrees with the numbers: 1171 - 200 + 165 px wide, the idle twin and the 2x master matching it, the baselines unchanged', () => {
    const idle = sidecar('idle')!;
    expect(idle.width).toBe(1171 - 200 + 165);
    expect(idle.height).toBe(784);
    expect(idle.baselineY).toBe(EVRAE_BASELINE_PX.near);
    expect(sidecar('idle-near')).toMatchObject({ width: 1136, height: 784, baselineY: 768 });
    expect(Buffer.compare(readFileSync(`${DIR}idle.png`), readFileSync(`${DIR}idle-near.png`))).toBe(0);
    expect(pngSize('idle')).toEqual([1136, 784]);
    expect(pngSize('idle@2x')).toEqual([2272, 1568]);
    for (const k of ['attack', 'hurt', 'breath-charge']) {
      const s = sidecar(k)!;
      expect(pngSize(k), k).toEqual([s.width, s.height]);
    }
    expect(sidecar('hurt')).toMatchObject({ height: 874, baselineY: 858 });
    expect(sidecar('breath-charge')).toMatchObject({ width: 1136, height: 784, baselineY: 768 });
  });
});
