import { describe, expect, it } from 'vitest';
import { Group, Mesh, Object3D, PerspectiveCamera, Vector3 } from 'three';
import { BattleCamera, type CameraRig } from '../../../src/engine/BattleCamera.ts';
import { anchorPoint } from '../../../src/engine/PartAnchors.ts';
import { FARPLANE_STAGING } from '../../../src/scenes/farplane-parts.ts';
import {
  COLOSSUS_BACKDROP,
  COLOSSUS_LINK_IDS,
  COLOSSUS_LINK_ORDER,
  COLOSSUS_PART_BASE_HEIGHT,
  COLOSSUS_TABLES,
  VegnagunColossus,
  colossusLinkOf,
  colossusStaging,
} from '../../../src/scenes/farplane-colossus.ts';

// Vegnagun staging option A (Bailey, 2026-09-26: "i'll go with all your recommendations");
// docs/concepts/vegnagun-colossus-2026-09-26/README.md. FFX-2 only, Chapter V.

const TODAY: Record<string, CameraRig> = {
  idle: { position: [0, 2.7, 9.8], lookAt: [0.5, 1.45, -1.4], fov: 32 },
  enemy: { position: [1.5, 2.4, 5.8], lookAt: [3.1, 1.8, -2.5], fov: 32, sway: 0.7 },
  action: { position: [-0.15, 2.55, 9.6], lookAt: [1.05, 1.5, -1.2], fov: 32, sway: 0.7 },
};

/** A stand-in for a staged PaintedActor: named by combatant id, with setAlpha (what findFigure looks for). */
function figure(id: string): Object3D {
  const o = new Object3D() as Object3D & { setAlpha(a: number): void };
  o.name = id;
  o.setAlpha = () => {};
  return o;
}

function sceneWithBackdrop(): { root: Group; group: Group; painting: Mesh } {
  const root = new Group();
  const group = new Group();
  const painting = new Mesh();
  painting.name = 'backdrop-painting';
  painting.scale.set(60, 34, 1);
  painting.position.y = 5;
  group.add(painting);
  root.add(group);
  return { root, group, painting };
}

const v = (p: CameraRig['position']): number[] => (p instanceof Vector3 ? p.toArray() : [...p]).map((n) => +n.toFixed(3));

describe('Vegnagun colossus tables (option A, FFX-2 only)', () => {
  it('stages the links in the sourced order: tail, leg + Nodes, body + Bulwarks, head + Redoubts', () => {
    expect(COLOSSUS_LINK_ORDER).toEqual(['tail', 'leg', 'body', 'head']);
    expect(COLOSSUS_LINK_IDS).toEqual({ tail: 'vegnagun-tail', leg: 'vegnagun-leg', body: 'vegnagun-body', head: 'vegnagun-head' });
  });

  it("uses the option's frames on a desktop: part spots, scales, the head mirrored, the low fov-40 camera", () => {
    const d = COLOSSUS_TABLES.desktop;
    expect(d.parts.tail).toEqual({ spot: [9.74, -1.4, -17], scale: 5.6, mirror: false });
    expect(d.parts.leg).toEqual({ spot: [3.2, 0, -12], scale: 5.5, mirror: false });
    expect(d.parts.body).toEqual({ spot: [-4.6, 0, -16], scale: 4.3, mirror: false });
    expect(d.parts.head).toEqual({ spot: [0.33, 1.6, -15], scale: 4.8, mirror: true });
    expect(d.idle).toEqual({ position: [1.2, 1.15, 14.5], lookAt: [1.8, 3.4, -4], fov: 40, sway: 0.6 });
    expect(d.push).toEqual({ position: [1.35, 1.0, 12.0], lookAt: [1.9, 3.9, -4], fov: 40, sway: 0.6 });
  });

  it("uses the phone's own table on an upright phone", () => {
    const p = COLOSSUS_TABLES.phone;
    expect(p.parts.tail).toEqual({ spot: [0.79, -0.6, -17], scale: 3.9, mirror: false });
    expect(p.parts.leg).toEqual({ spot: [0.6, 0, -12], scale: 4.6, mirror: false });
    expect(p.parts.body).toEqual({ spot: [-4.6, 0, -16], scale: 2.7, mirror: false });
    expect(p.parts.head).toEqual({ spot: [-4.32, 1.2, -15], scale: 3.6, mirror: true });
    expect(p.idle.fov).toBe(40);
    expect(p.push.fov).toBe(40);
  });

  it('scales the backdrop 1.8 and lifts it 6 so the horizon stays behind the part', () => {
    expect(COLOSSUS_BACKDROP.scale).toBe(1.8);
    expect(COLOSSUS_BACKDROP.lift).toBe(6);
  });
});

describe('colossusStaging (the switches the Farplane publishes)', () => {
  for (const phone of [false, true]) {
    const t = phone ? COLOSSUS_TABLES.phone : COLOSSUS_TABLES.desktop;
    const s = colossusStaging(phone);
    it(`pins and sizes each part from its table (${phone ? 'phone' : 'desktop'})`, () => {
      for (const link of COLOSSUS_LINK_ORDER) {
        const id = COLOSSUS_LINK_IDS[link];
        expect(s.enemySpots[id]).toEqual(t.parts[link].spot);
        expect(s.figureHeights[id]).toBeCloseTo(COLOSSUS_PART_BASE_HEIGHT * t.parts[link].scale, 6);
      }
      // Chapter XI's placeholder Shiva keeps its spot; the party is still held.
      expect(s.enemySpots['x2-shiva']).toEqual(FARPLANE_STAGING.enemySpots['x2-shiva']);
      expect(s.holdParty).toBe(true);
    });

    it(`scales the part rings with their part and stands the Bulwark rings upright on the body (${phone ? 'phone' : 'desktop'})`, () => {
      const base = FARPLANE_STAGING.partAnchors;
      const bodyK = t.parts.body.scale;
      const headK = t.parts.head.scale;
      for (const id of ['bulwark-r', 'bulwark-l']) {
        const a = s.partAnchors[id]!;
        expect(a.mode).toBe('onParent');
        if (a.mode !== 'onParent') continue;
        expect(a.ring.ground).toBe(false);
        expect(a.px[1]).toBe(700);
        expect(a.ring.radius).toBeCloseTo(0.55 * bodyK, 6);
      }
      for (const id of ['redoubt-r', 'redoubt-l']) {
        const a = s.partAnchors[id]!;
        const b = base[id]!;
        if (a.mode !== 'onParent' || b.mode !== 'onParent') throw new Error('redoubts are on-parent');
        expect(a.px).toEqual(b.px);
        expect(a.ring.radius).toBeCloseTo(b.ring.radius * headK, 6);
      }
      // The Nodes hang far overhead of the scaled leg (§4.3's "far overhead").
      const leg = { x: t.parts.leg.spot[0], y: 0, z: t.parts.leg.spot[2], height: COLOSSUS_PART_BASE_HEIGHT * t.parts.leg.scale };
      for (const id of ['node-a', 'node-b', 'node-c']) {
        const [, y] = anchorPoint(s.partAnchors[id]!, leg);
        expect(y).toBeGreaterThan(leg.height * 1.5);
      }
    });
  }

  it('leaves the shared farplane-parts table untouched', () => {
    colossusStaging(false);
    const b = FARPLANE_STAGING.partAnchors['bulwark-r']!;
    if (b.mode !== 'onParent') throw new Error('on-parent');
    expect(b.ring).toEqual({ radius: 0.55, ground: true });
  });
});

describe('colossusLinkOf', () => {
  it('names the latest Vegnagun link staged, so a fading part never holds the next link back', () => {
    const root = new Group();
    expect(colossusLinkOf(root)).toBeNull();
    root.add(figure('yuna'), figure('vegnagun-tail'));
    expect(colossusLinkOf(root)).toBe('tail');
    root.add(figure('vegnagun-leg'), figure('node-a'));
    expect(colossusLinkOf(root)).toBe('leg');
  });
});

describe('VegnagunColossus (the per-link camera, backdrop and mirror)', () => {
  function setup(phone = false): { cam: BattleCamera; root: Group; painting: Mesh; c: VegnagunColossus } {
    const cam = new BattleCamera(new PerspectiveCamera(32, 16 / 9, 0.1, 500), { rigs: TODAY, initial: 'idle' });
    const { root, group, painting } = sceneWithBackdrop();
    const c = new VegnagunColossus(TODAY, group, phone);
    c.bind(cam);
    return { cam, root, painting, c };
  }

  it('does nothing until a Vegnagun part is staged (Chapter XI on the same scene stays as it is)', () => {
    const { cam, root, painting, c } = setup();
    root.add(figure('x2-shiva'));
    c.update(root);
    expect(v(cam.getRig('idle')!.position)).toEqual([0, 2.7, 9.8]);
    expect(painting.scale.x).toBe(60);
    expect(c.active).toBe(false);
  });

  it("puts the low camera on idle and the push on the enemy rig while a part is staged, and grows the backdrop", () => {
    const { cam, root, painting, c } = setup();
    root.add(figure('vegnagun-tail'));
    c.update(root);
    expect(c.active).toBe(true);
    expect(v(cam.getRig('idle')!.position)).toEqual([1.2, 1.15, 14.5]);
    expect(cam.getRig('idle')!.fov).toBe(40);
    expect(v(cam.getRig('enemy')!.position)).toEqual([1.35, 1, 12]);
    expect(v(cam.getRig('action')!.position)).toEqual([-0.15, 2.55, 9.6]); // untouched
    expect(painting.scale.x).toBeCloseTo(108, 6);
    expect(painting.scale.y).toBeCloseTo(61.2, 6);
    expect(painting.position.y).toBeCloseTo(11, 6);
    // A second frame changes nothing more.
    c.update(root);
    expect(painting.scale.x).toBeCloseTo(108, 6);
  });

  it('uses the phone rigs on a phone', () => {
    const { cam, root, c } = setup(true);
    root.add(figure('vegnagun-leg'));
    c.update(root);
    expect(v(cam.getRig('idle')!.position)).toEqual([1.9, 1.15, 14.5]);
    expect(v(cam.getRig('enemy')!.lookAt)).toEqual([2.6, 4.1, -4]);
  });

  it('mirrors the head, and only the head', () => {
    const { root, c } = setup();
    const head = figure('vegnagun-head');
    const yuna = figure('yuna');
    root.add(head, yuna);
    c.update(root);
    expect(head.scale.x).toBe(-1);
    expect(yuna.scale.x).toBe(1);
    c.update(root);
    expect(head.scale.x).toBe(-1); // never flipped back
  });

  it('holds the staging through the gap between two links, and gives it all back when Shuyin takes the field', () => {
    const { cam, root, painting, c } = setup();
    const tail = figure('vegnagun-tail');
    root.add(tail);
    c.update(root);
    root.remove(tail);
    c.update(root);
    expect(c.active).toBe(true);
    root.add(figure('shuyin'));
    c.update(root);
    expect(c.active).toBe(false);
    expect(v(cam.getRig('idle')!.position)).toEqual([0, 2.7, 9.8]);
    expect(cam.getRig('idle')!.fov).toBe(32);
    expect(v(cam.getRig('enemy')!.position)).toEqual([1.5, 2.4, 5.8]);
    expect(painting.scale.x).toBe(60);
    expect(painting.position.y).toBe(5);
  });

  it('draws the part rings over the paintings while it is on', () => {
    const { root, c } = setup();
    const ring = new Mesh();
    ring.name = 'part-ring:bulwark-l';
    ring.renderOrder = 7;
    root.add(figure('vegnagun-body'), ring);
    c.update(root);
    expect(ring.renderOrder).toBeGreaterThan(7);
  });

  it('lets go of the camera on bind(null)', () => {
    const { cam, root, c } = setup();
    c.bind(null);
    root.add(figure('vegnagun-tail'));
    c.update(root);
    expect(v(cam.getRig('idle')!.position)).toEqual([0, 2.7, 9.8]);
  });
});
