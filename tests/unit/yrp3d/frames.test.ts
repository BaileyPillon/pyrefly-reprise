/**
 * **The framing mockups** (`src/engine/yrp3d/frames.ts`; the hidden 3D Bahamut chapter, FFX-2 only): `?frame=b` and `?frame=c` are two closer resting views for Bailey to look at (the girls looked small at frame A's
 * 21 to 27 percent of the height); frame A is the approved layout and stays the default. Held without a renderer, like `layout.test.ts`: the girls' share of the frame's height, where Bahamut stands, that the painting
 * plane still fills the frame, that no reserve spot shows, and above all that **no query and every other query leave frame A exactly as it was**.
 */
import { describe, expect, it } from 'vitest';

import { FRAME_NAMES, FRAME_RIGS, IDLE_B, IDLE_C, establishing, frameChoice, rigsFor } from '../../../src/engine/yrp3d/frames.ts';
import { PARTY_SLOTS, RIGS, YRP_PARTY_IDS, figureBoxes, planeMiss, project, type RigData } from '../../../src/engine/yrp3d/layout.ts';

/** Chapter IV's painting plane as `scenes/bevelle-underground.ts` builds it (the same numbers `layout.test.ts` holds). */
const PLANE = { z: -50, width: 78 + 2 * 18, height: 44.6, centreY: -2.82 };
const AS = 16 / 9;
const share = (rig: RigData): { mean: number; yuna: number; rikku: number; paine: number; feet: number } => {
  const b = figureBoxes(rig, AS);
  const h = (id: 'yuna' | 'rikku' | 'paine'): number => b[id].bottom - b[id].top;
  return { mean: (h('yuna') + h('rikku') + h('paine')) / 3, yuna: h('yuna'), rikku: h('rikku'), paine: h('paine'), feet: Math.max(b.yuna.bottom, b.rikku.bottom, b.paine.bottom) };
};

describe('which frame a page asks for', () => {
  it('is frame A with no query, and for anything but b or c; b and c in any case', () => {
    expect(FRAME_NAMES).toEqual(['a', 'b', 'c']);
    for (const q of ['', '?', '?frame=a', '?frame=', '?frame=d', '?frame=bb', '?frames=b', '?boss=real', '?bossrig=clips', '?frame=1']) expect(frameChoice(q), q).toBe('a');
    expect([frameChoice('?frame=b'), frameChoice('?frame=B'), frameChoice('?bossrig=clips&frame=b')]).toEqual(['b', 'b', 'b']);
    expect([frameChoice('?frame=c'), frameChoice('?frame=C'), frameChoice('?frame=c&boss=real')]).toEqual(['c', 'c', 'c']);
  });

  it("leaves frame A exactly as it was: the same table object, every rig unchanged", () => {
    expect(rigsFor('a')).toBe(RIGS);
    expect(FRAME_RIGS.a).toBe(RIGS);
    expect(rigsFor(frameChoice(''))['idle']).toEqual({ position: [2.2, 4.9, 10.4], lookAt: [0.6, 1.95, -0.8], fov: 32 });
    expect(RIGS['intro']).toEqual({ position: [3.0, 8.4, 17.6], lookAt: [0.2, 2.4, -2.6], fov: 32, sway: 1.4 });
  });

  it("changes only the two resting shots: every other rig of b and c is frame A's, the same values", () => {
    for (const frame of ['b', 'c'] as const) {
      const t = rigsFor(frame);
      expect(Object.keys(t).sort(), frame).toEqual(Object.keys(RIGS).sort());
      for (const name of Object.keys(RIGS)) {
        if (name === 'idle' || name === 'intro') expect(t[name], `${frame} ${name}`).not.toEqual(RIGS[name]);
        else expect(t[name], `${frame} ${name}`).toBe(RIGS[name]);
      }
    }
  });
});

describe('frame A is the baseline the mockups are measured against', () => {
  it("stands the girls at about a quarter of the frame's height (24 to 30 percent, mean 0.27)", () => {
    const a = share(RIGS['idle']!);
    expect(a.mean).toBeGreaterThan(0.26);
    expect(a.mean).toBeLessThan(0.28);
    expect([a.paine > 0.23, a.yuna < 0.31]).toEqual([true, true]);
  });
});

// The numbers below are the layout maths' (`layout.ts` projection of the rig as written). In the game, CHAPTER FRAMING (the menu clearance, `engine/fx/mix`) then pulls the camera back a few percent and shifts the picture by
// a lens offset to clear the command menu, and the silhouettes are about 0.93 of the models' boxes: the live measures are in `frames.ts`'s header.
describe('frame b: the camera dollies in and down, the girls at about 35 percent, Bahamut still in frame', () => {
  const idle = rigsFor('b')['idle']!;
  const b = figureBoxes(idle, AS);

  it("is the table's idle and stands the girls at 0.35 to 0.385 of the height (Yuna at the front the most, Paine at the back the least)", () => {
    expect(idle).toBe(IDLE_B);
    const s = share(idle);
    expect(s.mean).toBeGreaterThan(0.35);
    expect(s.mean).toBeLessThan(0.385);
    expect(s.yuna).toBeGreaterThan(s.rikku);
    expect(s.rikku).toBeGreaterThan(s.paine);
    expect(s.paine).toBeGreaterThan(0.28);
    expect(s.mean / share(RIGS['idle']!).mean).toBeGreaterThan(1.3); // a third larger than frame A's
    expect(idle.fov).toBe(RIGS['idle']!.fov); // a dolly, not a zoom: A's lens
  });

  it('keeps the row on the right with its feet in the frame, Paine at the back and left, Yuna at the front and right', () => {
    for (const id of YRP_PARTY_IDS) {
      expect(b[id].left, `${id} left`).toBeGreaterThan(0.55);
      expect(b[id].right, `${id} right`).toBeLessThan(1.03); // the menu clearance shifts the picture left in the game
      expect(b[id].top, `${id} top`).toBeGreaterThan(0.3);
      expect(b[id].bottom, `${id} feet`).toBeLessThan(0.97);
    }
    expect(b.paine.left).toBeLessThan(b.rikku.left);
    expect(b.rikku.left).toBeLessThan(b.yuna.left);
    expect(b.paine.bottom).toBeLessThan(b.rikku.bottom);
    expect(b.rikku.bottom).toBeLessThan(b.yuna.bottom);
  });

  it('keeps Bahamut on the left with his feet and horns in the frame (only the far wing tip may leave the left edge, as at A) and clear of the first girl', () => {
    expect(b.bahamut.top).toBeGreaterThan(-0.03); // his box is the widest he stands, wings out; the horns are in
    expect(b.bahamut.bottom).toBeLessThan(0.75);
    expect(b.bahamut.left).toBeGreaterThan(-0.15);
    expect(b.bahamut.right).toBeLessThan(b.paine.left);
    expect(b.bahamut.bottom - b.bahamut.top).toBeGreaterThan(0.6); // still the giant over the three girls
  });
});

describe('frame c: a lower, closer three-quarter, the girls at about 45 percent, Bahamut towering partly out of frame', () => {
  const idle = rigsFor('c')['idle']!;
  const b = figureBoxes(idle, AS);

  it("is the table's idle, lower than both A and B, and stands the girls at 0.45 to 0.49 of the height", () => {
    expect(idle).toBe(IDLE_C);
    const s = share(idle);
    expect(s.mean).toBeGreaterThan(0.45);
    expect(s.mean).toBeLessThan(0.49);
    expect(s.rikku).toBeGreaterThan(0.4);
    expect(s.paine).toBeGreaterThan(0.34);
    expect(idle.position[1]).toBeLessThan(IDLE_B.position[1]);
    expect(idle.position[1]).toBeLessThan(RIGS['idle']!.position[1]);
    expect(idle.position[1]).toBeLessThan(2.2); // below the girls' heads (1.9) and not far above
    expect(s.mean / share(RIGS['idle']!).mean).toBeGreaterThan(1.65);
    expect(idle.fov).toBe(RIGS['idle']!.fov);
  });

  it('keeps the row on the right with its feet in the frame', () => {
    for (const id of YRP_PARTY_IDS) {
      expect(b[id].left, `${id} left`).toBeGreaterThan(0.5);
      expect(b[id].right, `${id} right`).toBeLessThan(1.03); // the menu clearance shifts the picture left in the game
      expect(b[id].bottom, `${id} feet`).toBeLessThan(0.96);
    }
    expect(b.paine.left).toBeLessThan(b.rikku.left);
    expect(b.rikku.left).toBeLessThan(b.yuna.left);
  });

  it('lets Bahamut tower out of the top of the frame: his horns are above it, his feet and the most of his body in it, on the left', () => {
    expect(b.bahamut.top).toBeLessThan(-0.05);
    expect(b.bahamut.bottom).toBeGreaterThan(0.5);
    expect(b.bahamut.bottom).toBeLessThan(0.75);
    expect(b.bahamut.right).toBeLessThan(b.paine.left);
    expect(b.bahamut.bottom - b.bahamut.top).toBeGreaterThan(0.7);
    expect(b.bahamut.left).toBeGreaterThan(-0.3); // his body is in; the far wing tip is out
  });
});

describe("every frame's resting and establishing shots", () => {
  for (const frame of ['a', 'b', 'c'] as const) {
    const t = rigsFor(frame);

    it(`${frame}: keeps the painting under the whole frame at 16:10 and 16:9, no reserve spot in the frame, and Bahamut in the left half of the frame`, () => {
      for (const name of ['idle', 'intro'] as const) {
        for (const aspect of [16 / 10, 16 / 9]) expect(planeMiss(t[name]!, aspect, PLANE), `${frame} ${name} at ${aspect.toFixed(2)}`).toBe(0);
        for (const slot of PARTY_SLOTS.slice(3)) {
          const p = project(t[name]!, AS, slot);
          expect(p.depth <= 0 || p.x > 1.02 || p.x < -0.02 || p.y > 1.02 || p.y < -0.02, `a reserve spot is in the ${frame} ${name} frame`).toBe(true);
        }
        const bah = figureBoxes(t[name]!, AS).bahamut;
        expect(bah.left + bah.right, `${frame} ${name}: Bahamut left of the middle`).toBeLessThan(1);
      }
    });

    it(`${frame}: the establishing shot shows the whole row smaller than the resting shot, with Bahamut standing in the frame`, () => {
      const rest = share(t['idle']!);
      const intro = share(t['intro']!);
      expect(intro.mean).toBeLessThan(rest.mean * 0.75);
      expect(intro.mean).toBeGreaterThan(0.12);
      const b = figureBoxes(t['intro']!, AS);
      for (const id of YRP_PARTY_IDS) expect([b[id].left > 0, b[id].right < 1, b[id].bottom < 0.9], `${frame} intro ${id}`).toEqual([true, true, true]);
      expect(b.bahamut.top).toBeGreaterThan(0);
      expect(b.bahamut.bottom).toBeLessThan(0.75);
    });
  }

  it('builds an establishing shot by pulling the resting camera back along its line of sight and up', () => {
    const rest = IDLE_B;
    const e = establishing(rest);
    expect(e.fov).toBe(rest.fov);
    expect(e.sway).toBe(1.4);
    const back = (r: RigData): number => Math.hypot(r.position[0] - r.lookAt[0], r.position[2] - r.lookAt[2]);
    expect(back(e) / back(rest)).toBeGreaterThan(1.6);
    expect(e.position[1]).toBeGreaterThan(rest.position[1]);
    expect(e.lookAt[1]).toBeGreaterThan(rest.lookAt[1]);
    expect(e.lookAt[2]).toBeLessThan(rest.lookAt[2]);
  });
});
