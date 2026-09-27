/**
 * PR-0072 (FFX-2 only, Chapter V): Vegnagun's contact shadow is drawn where
 * the part meets the plain on screen: along the camera's ray through its feet
 * for the sunk tail, at the feet for a part on the plain, and not at all for a
 * part floating above the camera's eye (the head).
 */
import { describe, expect, it } from 'vitest';
import { Group, Mesh, PerspectiveCamera, Vector3 } from 'three';
import { ColossusContactShadow, contactOnPlain } from '../../../src/scenes/farplane-colossus-shadow.ts';
import { COLOSSUS_TABLES } from '../../../src/scenes/farplane-colossus.ts';

const eye = new Vector3(...COLOSSUS_TABLES.desktop.idle.position);

describe('where a part meets the plain', () => {
  it('the sunk tail meets it on the ray toward the camera, nearer than its feet', () => {
    const feet = new Vector3(...COLOSSUS_TABLES.desktop.parts.tail.spot);
    const p = contactOnPlain(eye, feet)!;
    expect(p.y).toBeCloseTo(0.012, 6);
    expect(p.z).toBeGreaterThan(feet.z);
    const d1 = feet.clone().sub(eye).normalize();
    const d2 = p.clone().sub(eye).normalize();
    expect(d1.distanceTo(d2)).toBeLessThan(1e-6);
  });

  it('a part on the plain meets it at its feet; the floating head never does', () => {
    const leg = new Vector3(...COLOSSUS_TABLES.desktop.parts.leg.spot);
    expect(contactOnPlain(eye, leg)!.toArray()).toEqual([leg.x, 0.012, leg.z]);
    expect(contactOnPlain(eye, new Vector3(...COLOSSUS_TABLES.desktop.parts.head.spot))).toBeNull();
  });
});

describe('the shadow follows the staged part', () => {
  function staged(id: string, spot: readonly number[]) {
    const root = new Group();
    const part = new Group() as Group & { setAlpha(): void; shadow: Mesh; worldHeight: number };
    part.name = id;
    part.setAlpha = () => {};
    part.worldHeight = 20;
    part.shadow = new Mesh();
    part.position.set(spot[0]!, spot[1]!, spot[2]!);
    root.add(part);
    return { root, part };
  }
  const cam = new PerspectiveCamera(40, 16 / 9);
  cam.position.copy(eye);

  it('stands in for the tail blob, on the plain', () => {
    const s = new ColossusContactShadow(new Group());
    const { root, part } = staged('vegnagun-tail', COLOSSUS_TABLES.desktop.parts.tail.spot);
    s.update(root, cam);
    expect(s.mesh.visible).toBe(true);
    expect(s.mesh.position.y).toBeCloseTo(0.012, 6);
    expect(part.shadow.visible).toBe(false);
  });

  it('shows none under the floating head, and none with no part', () => {
    const s = new ColossusContactShadow(new Group());
    s.update(staged('vegnagun-head', COLOSSUS_TABLES.desktop.parts.head.spot).root, cam);
    expect(s.mesh.visible).toBe(false);
    s.update(new Group(), cam);
    expect(s.mesh.visible).toBe(false);
  });
});
