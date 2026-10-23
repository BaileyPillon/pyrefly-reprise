/**
 * **The framing** (`src/engine/yrp3d/frames.ts`; the hidden 3D Bahamut chapter, FFX-2 only). Bailey picked "b: dolly in" (2026-10-22): frame b is the chapter's default; `?frame=a` is the old framing, exactly as it was, and
 * `?frame=c` the opt-in lower three-quarter. Held without a renderer, like `layout.test.ts`: which frame a page gets, that A is untouched, the girls' share of the frame's height, where Bahamut stands, that the painting plane
 * still fills the frame, that no reserve spot shows, and **that the command menu and the party HUD clear all three girls in b** (the nudge: the party stands about a metre toward Bahamut).
 */
import { describe, expect, it } from 'vitest';

import { predictedPanels } from '../../../src/engine/fx/mix/hudPanels.ts';
import { DEFAULT_FRAME, FRAME_NAMES, FRAME_RIGS, IDLE_B, IDLE_C, PARTY_DX, establishing, frameChoice, panned, partySlotsFor, rigsFor } from '../../../src/engine/yrp3d/frames.ts';
import { PARTY_SLOTS, RIGS, YRP_PARTY_IDS, figureBoxes, planeMiss, project, type RigData, type ScreenBox, type V3 } from '../../../src/engine/yrp3d/layout.ts';

/** Chapter IV's painting plane as `scenes/bevelle-underground.ts` builds it (the same numbers `layout.test.ts` holds). */
const PLANE = { z: -50, width: 78 + 2 * 18, height: 44.6, centreY: -2.82 };
const AS = 16 / 9;
const share = (rig: RigData, slots: readonly V3[] = PARTY_SLOTS): { mean: number; yuna: number; rikku: number; paine: number; feet: number } => {
  const b = figureBoxes(rig, AS, slots);
  const h = (id: 'yuna' | 'rikku' | 'paine'): number => b[id].bottom - b[id].top;
  return { mean: (h('yuna') + h('rikku') + h('paine')) / 3, yuna: h('yuna'), rikku: h('rikku'), paine: h('paine'), feet: Math.max(b.yuna.bottom, b.rikku.bottom, b.paine.bottom) };
};

describe('which frame a page asks for', () => {
  it('is frame b with no query and for anything but a or c; a and c in any case', () => {
    expect(DEFAULT_FRAME).toBe('b');
    expect(FRAME_NAMES).toEqual(['a', 'b', 'c']);
    for (const q of ['', '?', '?frame=b', '?frame=B', '?frame=', '?frame=d', '?frame=bb', '?frames=a', '?boss=real', '?bossrig=simple', '?frame=1', '?frame=ab']) expect(frameChoice(q), q).toBe('b');
    expect([frameChoice('?frame=a'), frameChoice('?frame=A'), frameChoice('?bossrig=simple&frame=a')]).toEqual(['a', 'a', 'a']);
    expect([frameChoice('?frame=c'), frameChoice('?frame=C'), frameChoice('?frame=c&boss=real')]).toEqual(['c', 'c', 'c']);
  });

  it('leaves frame A exactly as it was: the same table object, the same slots object, every rig unchanged', () => {
    expect(rigsFor('a')).toBe(RIGS);
    expect(FRAME_RIGS.a).toBe(RIGS);
    expect(partySlotsFor('a')).toBe(PARTY_SLOTS);
    expect(PARTY_DX.a).toBe(0);
    expect(rigsFor(frameChoice('?frame=a'))['idle']).toEqual({ position: [2.2, 4.9, 10.4], lookAt: [0.6, 1.95, -0.8], fov: 32 });
    expect(RIGS['intro']).toEqual({ position: [3.0, 8.4, 17.6], lookAt: [0.2, 2.4, -2.6], fov: 32, sway: 1.4 });
    expect(PARTY_SLOTS.slice(0, 3)).toEqual([[4.6, 0, 0.2], [3.4, 0, -1.0], [2.2, 0, -2.2]]);
  });

  it("changes only the two resting shots in c, and in b those two and the two close shots that look at the party (panned with it): every other rig is frame A's, the same values", () => {
    const c = rigsFor('c');
    const b = rigsFor('b');
    for (const [frame, t, changed] of [['c', c, ['idle', 'intro']], ['b', b, ['idle', 'intro', 'party', 'victory']]] as const) {
      expect(Object.keys(t).sort(), frame).toEqual(Object.keys(RIGS).sort());
      for (const name of Object.keys(RIGS)) {
        if (changed.includes(name as never)) expect(t[name], `${frame} ${name}`).not.toEqual(RIGS[name]);
        else expect(t[name], `${frame} ${name}`).toBe(RIGS[name]);
      }
    }
    expect(partySlotsFor('c')).toBe(PARTY_SLOTS);
    for (const name of ['party', 'victory'] as const) {
      expect(b[name], name).toEqual(panned(RIGS[name]!, PARTY_DX.b)); // the same shot, the same distance from the girls it looks at
      expect(b[name]!.lookAt[0] - RIGS[name]!.lookAt[0], name).toBeCloseTo(PARTY_DX.b, 6);
      expect(b[name]!.position[0] - RIGS[name]!.position[0], name).toBeCloseTo(PARTY_DX.b, 6);
      expect([b[name]!.position[1], b[name]!.position[2], b[name]!.lookAt[1], b[name]!.lookAt[2], b[name]!.fov]).toEqual([RIGS[name]!.position[1], RIGS[name]!.position[2], RIGS[name]!.lookAt[1], RIGS[name]!.lookAt[2], RIGS[name]!.fov]);
    }
  });

  it('stands the girls of b about two metres toward Bahamut, on the same lines of depth, and leaves the four reserve spots where they were', () => {
    const slots = partySlotsFor('b');
    expect(slots).toHaveLength(PARTY_SLOTS.length);
    expect(PARTY_DX.b).toBeLessThan(-1.5);
    expect(PARTY_DX.b).toBeGreaterThan(-2.3);
    slots.slice(0, 3).forEach((s, i) => expect([s[0], s[1], s[2]]).toEqual([Math.round((PARTY_SLOTS[i]![0] + PARTY_DX.b) * 100) / 100, PARTY_SLOTS[i]![1], PARTY_SLOTS[i]![2]]));
    expect(slots.slice(3)).toEqual(PARTY_SLOTS.slice(3));
    expect(slots[0]![0]).toBeGreaterThan(slots[1]![0]); // Yuna still in front and right, Paine at the back and left
    expect(slots[1]![0]).toBeGreaterThan(slots[2]![0]);
  });
});

describe('frame A is the baseline the framing is measured against', () => {
  it("stands the girls at about a quarter of the frame's height (24 to 30 percent, mean 0.27)", () => {
    const a = share(RIGS['idle']!);
    expect(a.mean).toBeGreaterThan(0.26);
    expect(a.mean).toBeLessThan(0.28);
    expect([a.paine > 0.23, a.yuna < 0.31]).toEqual([true, true]);
  });
});

// The numbers below are the layout maths' (`layout.ts` projection of the rig as written). In the game, CHAPTER FRAMING (the menu clearance, `engine/fx/mix`) then pulls the camera back about 8 percent and shifts the picture by a
// lens offset of 128 px at 1600x900 to clear the command menu, and the silhouettes are about 0.93 of the models' boxes: the live measures are in `frames.ts`'s header.
describe('frame b (the default): the camera dollies in and down, the girls at about a third, Bahamut in frame, the menu clear of all three', () => {
  const idle = rigsFor('b')['idle']!;
  const slots = partySlotsFor('b');
  const b = figureBoxes(idle, AS, slots);

  it("is the table's idle and stands the girls at 0.34 to 0.375 of the height (Yuna at the front the most, Paine at the back the least)", () => {
    expect(idle).toBe(IDLE_B);
    const s = share(idle, slots);
    expect(s.mean).toBeGreaterThan(0.34);
    expect(s.mean).toBeLessThan(0.375);
    expect(s.yuna).toBeGreaterThan(s.rikku);
    expect(s.rikku).toBeGreaterThan(s.paine);
    expect(s.paine).toBeGreaterThan(0.28);
    expect(s.mean / share(RIGS['idle']!).mean).toBeGreaterThan(1.25); // a quarter larger than frame A's, or more
    expect(idle.fov).toBe(RIGS['idle']!.fov); // a dolly, not a zoom: A's lens
  });

  it('keeps the row in the middle with its feet in the frame, Paine at the back and left, Yuna at the front and right', () => {
    for (const id of YRP_PARTY_IDS) {
      expect(b[id].left, `${id} left`).toBeGreaterThan(0.4);
      expect(b[id].right, `${id} right`).toBeLessThan(0.87); // the command column starts at 0.774 and the party HUD at 0.721: the row is left of them (the game's lens shift takes it further left)
      expect(b[id].top, `${id} top`).toBeGreaterThan(0.3);
      expect(b[id].bottom, `${id} feet`).toBeLessThan(0.97);
    }
    expect(b.paine.left).toBeLessThan(b.rikku.left);
    expect(b.rikku.left).toBeLessThan(b.yuna.left);
    expect(b.paine.bottom).toBeLessThan(b.rikku.bottom);
    expect(b.rikku.bottom).toBeLessThan(b.yuna.bottom);
  });

  it('keeps Bahamut on the left with his feet and horns in the frame (only the far wing tip may leave the left edge, as at A), his body clear of the first girl', () => {
    expect(b.bahamut.top).toBeGreaterThan(-0.03); // his box is the widest he stands, wings out; the horns are in
    expect(b.bahamut.bottom).toBeLessThan(0.75);
    expect(b.bahamut.left).toBeGreaterThan(-0.15);
    expect(b.bahamut.right - b.paine.left).toBeLessThan(0.2); // the box is the wing span: the wings are high over Paine, only the tail comes down toward her
    expect(b.bahamut.bottom - b.bahamut.top).toBeGreaterThan(0.6); // still the giant over the three girls
  });

  /**
   * The menu-overlap guard: the HUD panels CHAPTER FRAMING itself predicts for FFX-2 (`predictedPanels`: the command list and the party stats) against the girls' boxes as the layout maths draws them, after **the pull-backs
   * the planner has been seen to take** (1.04 in the last live capture of this configuration, 1.08 before it) and **each lens outcome it can take**: 128 px to the left (the picture away from the menu), no shift, and 64 px to the
   * right (toward it: the planner took that one live, for a configuration where Bahamut's wing needed bringing into view). The planner's search prefers the smallest change that passes, so which outcome a run lands on varies; the girls
   * must be clear in all three, each held to the bound that outcome can honestly meet.
   *
   * The box is the maths' own, 0.42 m either side of the feet and the whole height, and is wider than the silhouette: the live measure of this configuration was about 1 percent of Yuna's silhouette (8 percent of her box) under the
   * panels. So the bound is a tenth of the box where the picture does not move toward the menu, and **a third where it does** (the box reads 24 to 32 percent for Yuna there; her silhouette far less). What keeps the guard honest is
   * the comparison it also makes: over frame A's slots the same camera leaves Yuna at 60 to 90 percent under them at every outcome, and the nudge has to take at least a quarter of her box out from under them.
   */
  const BACKS = [1.04, 1.08] as const;
  const OUTCOMES = [
    { lens: -128, max: 0.02, why: 'the picture shifted away from the menu' },
    { lens: 0, max: 0.1, why: 'no shift' },
    { lens: 64, max: 0.35, why: 'the picture shifted toward the menu' },
  ] as const;
  const underPanels = (rig: RigData, party: readonly V3[], back: number, lens: number): Record<'yuna' | 'rikku' | 'paine', number> => {
    const pulled: RigData = { ...rig, position: rig.position.map((v, i) => rig.lookAt[i]! + (v - rig.lookAt[i]!) * back) as unknown as V3 };
    const boxes = figureBoxes(pulled, AS, party);
    const panels = predictedPanels('ffx2', 1600, 900, false).slice(0, 2); // the command list and the party stats
    const out = {} as Record<'yuna' | 'rikku' | 'paine', number>;
    for (const id of YRP_PARTY_IDS) {
      const box: ScreenBox = { left: boxes[id].left * 1600 + lens, right: boxes[id].right * 1600 + lens, top: boxes[id].top * 900, bottom: boxes[id].bottom * 900 };
      let covered = 0;
      // the share of the box under any panel, by area (the two panels do not overlap each other)
      for (const p of panels) {
        const w = Math.min(box.right, p.r) - Math.max(box.left, p.l);
        const h = Math.min(box.bottom, p.b) - Math.max(box.top, p.t);
        if (w > 0 && h > 0) covered += w * h;
      }
      out[id] = covered / ((box.right - box.left) * (box.bottom - box.top));
    }
    return out;
  };

  it('clears the command menu and the party HUD at every pull-back and lens outcome the planner can take: no girl above the bound for that outcome (a tenth of her box, a third where the picture shifts toward the menu)', () => {
    for (const back of BACKS)
      for (const { lens, max, why } of OUTCOMES) {
        const now = underPanels(idle, slots, back, lens);
        for (const id of YRP_PARTY_IDS) expect(now[id], `${id} under the menu and the party HUD at back ${back}, lens ${lens} (${why})`).toBeLessThan(max);
      }
  });

  it("is the nudge that clears them: over frame A's slots the same camera leaves Yuna at least half under them at every outcome, and b's slots take at least a quarter of her box out", () => {
    for (const back of BACKS)
      for (const { lens, why } of OUTCOMES) {
        const before = underPanels(idle, PARTY_SLOTS, back, lens);
        const now = underPanels(idle, slots, back, lens);
        expect(before.yuna, `Yuna at back ${back}, lens ${lens} (${why}) over frame A's slots`).toBeGreaterThan(0.5);
        expect(before.yuna - now.yuna, `Yuna's share taken out at back ${back}, lens ${lens} (${why})`).toBeGreaterThan(0.25);
      }
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
    const slots = partySlotsFor(frame);

    it(`${frame}: keeps the painting under the whole frame at 16:10 and 16:9, no reserve spot in the frame, and Bahamut in the left half of the frame`, () => {
      for (const name of ['idle', 'intro'] as const) {
        for (const aspect of [16 / 10, 16 / 9]) expect(planeMiss(t[name]!, aspect, PLANE), `${frame} ${name} at ${aspect.toFixed(2)}`).toBe(0);
        for (const slot of slots.slice(3)) {
          const p = project(t[name]!, AS, slot);
          expect(p.depth <= 0 || p.x > 1.02 || p.x < -0.02 || p.y > 1.02 || p.y < -0.02, `a reserve spot is in the ${frame} ${name} frame`).toBe(true);
        }
        const bah = figureBoxes(t[name]!, AS, slots).bahamut;
        expect(bah.left + bah.right, `${frame} ${name}: Bahamut left of the middle`).toBeLessThan(1);
      }
    });

    it(`${frame}: the establishing shot shows the whole row smaller than the resting shot, with Bahamut standing in the frame`, () => {
      const rest = share(t['idle']!, slots);
      const intro = share(t['intro']!, slots);
      expect(intro.mean).toBeLessThan(rest.mean * 0.75);
      expect(intro.mean).toBeGreaterThan(0.12);
      const b = figureBoxes(t['intro']!, AS, slots);
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
