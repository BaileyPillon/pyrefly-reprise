/**
 * MF-28 (lane "mf-l4-freezes", FFX-2 Chapter IV only: Bevelle underground). Three draws a transparent double-sided material twice, back faces then front faces, flipping `material.side` and setting `needsUpdate` each
 * time, so the eight additive light-shaft planes made three look their program up 32 times a frame (two passes of the scene, two flips each: the heap profile's biggest allocator, 121 KB a frame of a 437 KB
 * frame). An additive plane with no depth write draws the same pixels in one pass (a plane seen from the front has no back faces; the order of additive terms does not matter), so those materials say so.
 * A source pin: the browser job `probe-programs` of the lane counted the lookups (38.8 a frame before, see docs/handoff/mf-l4-freezes.md).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Bevelle underground light shafts are drawn in one pass (MF-28)', () => {
  const src = readFileSync('src/scenes/bevelle-underground.ts', 'utf8');
  const blocks = [...src.matchAll(/new MeshBasicMaterial\(\{([\s\S]*?)\}\)/g)].map((m) => m[1]!).filter((b) => /DoubleSide/.test(b) && /AdditiveBlending/.test(b));

  it('finds the two additive double-sided materials (the shafts and the hole shafts)', () => {
    expect(blocks.length).toBe(2);
  });

  it('each says forceSinglePass, and none of them writes depth (the case where one pass is the same picture)', () => {
    for (const b of blocks) {
      expect(b).toMatch(/forceSinglePass:\s*true/);
      expect(b).toMatch(/depthWrite:\s*false/);
    }
  });
});
