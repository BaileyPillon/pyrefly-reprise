/**
 * **E1-H (D-360, Bailey 2026-10-03 ~16:25 EDT): Evrae's NEAR slot moves right for the repainted idle, and is pinned.**
 *
 * The approved idle was repainted with the neck arch lengthened 165 px so the head stays and the coil stands right of the party
 * (tail loop dropped; 200 px of canvas cropped at the left, so 1171 px became 1136). A painted plane is centred on its slot, so
 * for the head to stay put the slot moves right by `(200 + 165) / 2` canvas px of `4.1 / 768` world. Evrae's resolved centre
 * before the repaint was 3.018, not the data spot's 2.3 (ProneLay slid the wide idle's plane 0.718 right along the floor), and a
 * pinned figure is never slid: the deck pins Evrae and Cid (`SceneSlots.enemySpots`) on the director's own NEAR spot, which is
 * that resolved centre plus the move. Staging, not game data.
 *
 * What this holds: the formula, the composition of the spot, the pin, the untouched generic slot table that Chapters XVII and XVIII
 * share, the relax step and the director both leaving the pinned spot alone, and (only once the E1-H art is installed, because
 * `public/art` is gitignored) the installed canvas agreeing with the numbers.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Evrae is Chapter VIII's boss and its range mechanic has no FFX-2 counterpart
 * (`research/ffx-evrae-airship.md` section 0.4); nothing here is read by an FFX-2 chapter.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../../src/engine/ArtManifest.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import type { DepthRect } from '../../../src/engine/ScreenRects.ts';
import { solveFormation, type Spot } from '../../../src/engine/Formation.ts';
import { laneFrom, relaxActorsOf, relaxField, type RelaxField, type StagedForRelax } from '../../../src/engine/StageRelax.ts';
import { evraeGroup } from '../../../src/data/ffx/enemies/evrae.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS as SLOTS, EVRAE_ENEMY_SLOT } from '../../../src/scenes/evrae-airship-deck.ts';
import { AirshipRangeDirector } from '../../../src/scenes/evrae-airship-director.ts';
import {
  EVRAE_BASELINE_PX,
  EVRAE_E1H_SLOT_DX,
  EVRAE_NEAR_CENTRE_X_BEFORE_E1H,
  EVRAE_NEAR_SPOT,
  EVRAE_NEAR_SPOT_BEFORE_E1H,
  EVRAE_WORLD_HEIGHT,
  RANGE_STAGING,
} from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';
import { evraeSubject } from '../../../src/scenes/evrae-airship-subjects.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';

afterEach(() => resetArtManifest());

describe('the slot move', () => {
  it('is the repaint\'s canvas change: ((200 + 165) / 2) canvas px of 4.1 / 768 world, kept to four places', () => {
    const exact = ((200 + 165) / 2) * (EVRAE_WORLD_HEIGHT / EVRAE_BASELINE_PX.near);
    expect(exact).toBeCloseTo(0.97428, 5);
    expect(EVRAE_E1H_SLOT_DX).toBeCloseTo(exact, 3);
    expect(EVRAE_E1H_SLOT_DX).toBe(0.9743);
  });

  it('puts NEAR Evrae on the centre it resolved to before (3.018) plus that move, at the data spot\'s height and depth', () => {
    expect(EVRAE_NEAR_CENTRE_X_BEFORE_E1H).toBe(3.018);
    expect([...EVRAE_NEAR_SPOT_BEFORE_E1H]).toEqual([2.3, -0.9, -4.7]);
    expect(EVRAE_NEAR_SPOT[0]).toBeCloseTo(3.018 + 0.9743, 6);
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
