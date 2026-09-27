/**
 * A-8 (iteration 2 B3; both games, shared PaintedActor plumbing): contact
 * shadows that read on dark floors. The blob strengthens on a dark ground,
 * a tight foot-occlusion ellipse rides it under the baseline, a floor of
 * unknown colour keeps today's blob, and the ellipse is freed with the figure.
 * The luma measure (at least 12 % below the floor round the feet, at each
 * chapter's first menu) is taken in the browser.
 */
import { describe, expect, it } from 'vitest';
import { CircleGeometry, Color, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry } from 'three';
import { DEFAULT_SHADOW, attachFootOcclusion, contactShadowStyle, disposeFootOcclusion, groundLumaOf, lumaOf } from '../../src/engine/ContactShadow.ts';

describe('A-8: contact shadows', () => {
  it('a floor of unknown colour keeps today\'s blob exactly', () => {
    expect(contactShadowStyle(null)).toEqual({ ...DEFAULT_SHADOW });
    expect(DEFAULT_SHADOW).toMatchObject({ opacity: 0.48, color: 0x050a14 });
  });

  it('the darker the floor, the stronger and blacker the blob', () => {
    const bright = contactShadowStyle(0.7);
    const mid = contactShadowStyle(0.3);
    const dark = contactShadowStyle(0.08);
    expect(bright.opacity).toBeCloseTo(0.48, 5);
    expect(mid.opacity).toBeGreaterThan(bright.opacity);
    expect(dark.opacity).toBeGreaterThan(mid.opacity);
    expect(dark.opacity).toBeLessThanOrEqual(0.78 + 1e-9);
    expect(dark.color).toBe(0x000000);
    expect(bright.color).toBe(DEFAULT_SHADOW.color);
  });

  it("reads the floor from the scene's ground mesh", () => {
    const root = new Group();
    expect(groundLumaOf(root)).toBeNull();
    const ground = new Mesh(new PlaneGeometry(1, 1), new MeshLambertMaterial({ color: new Color(0x202428) }));
    ground.name = 'ground';
    root.add(ground);
    expect(groundLumaOf(root)).toBeCloseTo(lumaOf(new Color(0x202428).getHex()), 5);
  });

  it('the foot ellipse rides the blob, follows its opacity, and is freed with the figure', () => {
    const blob = new Mesh(new CircleGeometry(1, 16), new MeshBasicMaterial({ transparent: true, opacity: 0.5 }));
    const style = contactShadowStyle(0.1);
    const foot = attachFootOcclusion(blob, style)!;
    expect(foot.parent).toBe(blob);
    expect(foot.scale.x).toBeLessThan(0.5);
    (blob.material as MeshBasicMaterial).opacity = 0.2;
    foot.onBeforeRender(null as never, null as never, null as never, null as never, null as never, null as never);
    expect((foot.material as MeshBasicMaterial).opacity).toBeCloseTo(0.2 * style.occlusion, 5);
    disposeFootOcclusion(blob);
    expect(blob.children).toHaveLength(0);
    expect(attachFootOcclusion(null, style)).toBeNull();
  });
});
