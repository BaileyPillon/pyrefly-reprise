/**
 * Site C's own pure logic: where the frame sits on the stage, how its sheets
 * are ordered in depth, which pieces Chapter II really uses, and how an
 * inventory piece finds its thumbnail.
 *
 * The one thing worth a test above all others here is the lesson sites A and
 * B both taught: **nothing may sit under the chrome**. The approved frames
 * could ignore `FREE_STAGE` (they show no detail card); this page cannot, so
 * both ends of the slider are checked against it.
 */

import { describe, expect, it } from 'vitest';

import { FREE_STAGE } from '../../learn/shared/region.ts';
import { GF, MAX_GAP, PLANES, RAIL_LAYER_IDS, framePlacement, inventoryFade, planeZ, ramp, worldFade } from '../../learn/exploded/frame.ts';
import { LAYERS, LAYER_SYSTEMS } from '../../learn/exploded/layers.ts';
import { chapterUseById, usedByChapter } from '../../learn/exploded/chapter-use.ts';
import { thumbKeyForPiece } from '../../learn/exploded/thumbs.ts';

const RAD = Math.PI / 180;

/** The stack's half-width once turned, ignoring perspective (which only pulls the far sheets in). */
function projectedHalfWidth(t: number): number {
  const placement = framePlacement(t);
  const deepest = Math.max(...PLANES.map((plane) => Math.abs(planeZ(plane, placement.gap))));
  const yaw = placement.rotateY * RAD;
  return (deepest * Math.abs(Math.sin(yaw)) + (GF.width / 2) * Math.abs(Math.cos(yaw))) * placement.scale;
}

describe('site C: the frame on the stage', () => {
  it('fills the chrome-free box exactly when assembled, and never more', () => {
    const placement = framePlacement(0);
    expect(placement.width).toBeCloseTo(FREE_STAGE.w, 6);
    expect(placement.left).toBeGreaterThanOrEqual(FREE_STAGE.x - 0.001);
    expect(placement.left + placement.width).toBeLessThanOrEqual(FREE_STAGE.x + FREE_STAGE.w + 0.001);
    expect(placement.top).toBeGreaterThanOrEqual(FREE_STAGE.y);
    expect(placement.top + placement.height).toBeLessThanOrEqual(FREE_STAGE.y + FREE_STAGE.h);
    expect(placement.gap).toBe(0);
    expect(placement.rotateY).toBe(0);
  });

  it('keeps the pulled-apart stack inside the chrome-free box', () => {
    const placement = framePlacement(1);
    expect(placement.gap).toBe(MAX_GAP);
    const halfWidth = projectedHalfWidth(1);
    expect(halfWidth).toBeLessThan(FREE_STAGE.w / 2);
    const halfHeight = (GF.height / 2) * placement.scale;
    const centreY = placement.top + placement.height / 2;
    expect(centreY - halfHeight).toBeGreaterThan(FREE_STAGE.y);
    expect(centreY + halfHeight).toBeLessThan(FREE_STAGE.y + FREE_STAGE.h);
  });

  it('turns further when the view rail asks, without leaving the box', () => {
    expect(framePlacement(0.5, 45).rotateY).toBeCloseTo(framePlacement(0.5).rotateY + 45, 6);
    expect(projectedHalfWidth(1)).toBeLessThan(FREE_STAGE.w / 2);
  });

  it('stacks the eight sheets back to front, with the two depth bands behind the light', () => {
    const zs = PLANES.map((plane) => planeZ(plane, MAX_GAP));
    expect(zs).toHaveLength(8);
    for (let i = 1; i < zs.length; i += 1) {
      expect(zs[i]).toBeGreaterThan(zs[i - 1] ?? 0);
    }
    const keys = PLANES.map((plane) => plane.key);
    expect(keys.indexOf('band-near')).toBeLessThan(keys.indexOf('light'));
    expect(keys[keys.length - 1]).toBe('hud');
  });

  it('names only real components, and covers every on-screen one', () => {
    const declared = new Set(LAYER_SYSTEMS.map((system) => system.id));
    for (const plane of PLANES) expect(declared.has(plane.layerId)).toBe(true);
    for (const id of RAIL_LAYER_IDS) expect(declared.has(id)).toBe(true);

    const onScreen = LAYERS.filter((layer) => layer.onScreen).map((layer) => layer.id);
    const painted = new Set(PLANES.map((plane) => plane.layerId));
    for (const id of onScreen) expect(painted.has(id)).toBe(true);
    expect(RAIL_LAYER_IDS).toEqual(LAYERS.filter((layer) => !layer.onScreen).map((layer) => layer.id));
  });

  it('fades the world out before the inventory is solid, and never both at full', () => {
    expect(ramp(0.5, 0, 1)).toBeCloseTo(0.5, 6);
    expect(worldFade(0)).toBe(1);
    expect(worldFade(1)).toBe(0);
    expect(inventoryFade(0)).toBe(0);
    expect(inventoryFade(1)).toBe(1);
    for (let e = 0; e <= 1.0001; e += 0.05) {
      expect(worldFade(e) + inventoryFade(e)).toBeLessThanOrEqual(1.5);
    }
  });
});

describe('site C: what Chapter II uses', () => {
  const use = chapterUseById('yunalesca', ['ch2-yunalesca', 'ch1-seymour-flux']);

  it('reads the chapter’s own scene, party, aeons and formation', () => {
    expect([...use.backdrops]).toEqual(['zanarkand-dome']);
    for (const id of ['tidus', 'yuna', 'auron', 'yunalesca-1']) {
      expect(use.subjects.has(id)).toBe(true);
    }
    expect(use.subjects.has('valefor')).toBe(true);
    expect(use.portraits.has('tidus')).toBe(true);
    expect(use.music.has('boss-yunalesca')).toBe(true);
  });

  it('claims a pause plate only when the shipped manifest really has one', () => {
    expect([...use.pause]).toEqual(['ch2-yunalesca']);
    expect([...chapterUseById('yunalesca', []).pause]).toEqual([]);
  });

  it('marks the chapter’s own pieces and nobody else’s', () => {
    expect(usedByChapter('asset-subject-yunalesca-1', use)).toBe(true);
    expect(usedByChapter('asset-backdrop-zanarkand-dome', use)).toBe(true);
    expect(usedByChapter('asset-backdrop-farplane', use)).toBe(false);
    expect(usedByChapter('asset-subject-vegnagun-head', use)).toBe(false);
    // All eight Ink & Gold parts are the FFX battle HUD this frame draws.
    expect(usedByChapter('asset-hud-slab', use)).toBe(true);
    // Audio families are never claimed: a chapter names cues, not families.
    expect(usedByChapter('asset-audio-sfx-battle', use)).toBe(false);
  });
});

describe('site C: thumbnails', () => {
  it('maps each painted family to its own thumbnail prefix, and nothing else', () => {
    expect(thumbKeyForPiece('asset-subject-yunalesca-1')).toBe('sub-yunalesca-1');
    expect(thumbKeyForPiece('asset-backdrop-zanarkand-dome')).toBe('bd-zanarkand-dome');
    expect(thumbKeyForPiece('asset-portrait-tidus')).toBe('pt-tidus');
    expect(thumbKeyForPiece('asset-pause-ch2-yunalesca')).toBe('pp-ch2-yunalesca');
    expect(thumbKeyForPiece('asset-hud-slab')).toBeUndefined();
    expect(thumbKeyForPiece('layer-boss-billboard')).toBeUndefined();
  });
});
