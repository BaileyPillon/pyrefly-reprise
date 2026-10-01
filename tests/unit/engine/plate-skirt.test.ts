import { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Texture, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { addPlateSkirt, plateTexture, skirtGeometry } from '../../../src/engine/PlateSkirt.ts';
import { ROAD_BACKDROP, ROAD_RIGS } from '../../../src/scenes/road-to-the-farplane.ts';
import type { CameraRig } from '../../../src/engine/BattleCamera.ts';

/**
 * VP-1001-30 (FFX-2 only, Chapter XI): the Road to the Farplane's plate ended above the frame's
 * bottom edge at rest (a flat violet band). The skirt carries the plate's stone below it.
 */
const PLATE_H = (ROAD_BACKDROP.width * 1536) / 2688;

/** Where a rig's lowest ray meets the plate's plane, at a 16:9 frame. */
function lowestHit(r: CameraRig): number {
  const rig = r as { position: readonly number[]; lookAt: readonly number[]; fov?: number };
  const cam = new PerspectiveCamera(rig.fov ?? 32, 16 / 9, 0.1, 500);
  cam.position.set(rig.position[0]!, rig.position[1]!, rig.position[2]!);
  cam.lookAt(new Vector3(rig.lookAt[0]!, rig.lookAt[1]!, rig.lookAt[2]!));
  cam.updateMatrixWorld();
  const p = new Vector3(0, -1, 0.5).unproject(cam);
  const dir = p.sub(cam.position).normalize();
  const t = (ROAD_BACKDROP.distance - cam.position.z) / dir.z;
  return cam.position.y + dir.y * t;
}

describe('the Road to the Farplane plate skirt', () => {
  const plateBottom = ROAD_BACKDROP.centreY - PLATE_H / 2;

  it('the resting and party rigs see below the plate (the defect)', () => {
    expect(lowestHit(ROAD_RIGS['idle']!)).toBeLessThan(plateBottom);
    expect(lowestHit(ROAD_RIGS['party']!)).toBeLessThan(plateBottom);
  });

  it('the skirt reaches below every rig lowest ray', () => {
    const group = new Group();
    const main = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new Texture() }));
    main.name = 'backdrop-painting';
    group.add(main);
    const map = plateTexture(group)!;
    expect(map).toBe((main.material as MeshBasicMaterial).map);
    const dispose = addPlateSkirt(group, map, { width: ROAD_BACKDROP.width, height: PLATE_H, centreY: ROAD_BACKDROP.centreY, z: ROAD_BACKDROP.distance, depth: 8 });
    const skirt = group.getObjectByName('backdrop-layer-skirt') as Mesh;
    const top = skirt.position.y + 4;
    const bottom = skirt.position.y - 4;
    expect(top).toBeCloseTo(plateBottom, 5);
    for (const name of ['idle', 'action', 'party', 'enemy', 'victory']) {
      expect(lowestHit(ROAD_RIGS[name]!), name).toBeGreaterThan(bottom);
    }
    dispose();
    expect(group.getObjectByName('backdrop-layer-skirt')).toBeUndefined();
  });

  it('mirrors the plate bottom rows: the seam row is the painting last row', () => {
    const g = skirtGeometry({ width: 10, height: 50, centreY: 0, z: 0, depth: 5 });
    const uv = g.getAttribute('uv');
    const pos = g.getAttribute('position');
    for (let i = 0; i < uv.count; i++) {
      if (pos.getY(i) > 0) expect(uv.getY(i)).toBe(0);
      else expect(uv.getY(i)).toBeCloseTo(0.1, 6);
    }
  });
});
