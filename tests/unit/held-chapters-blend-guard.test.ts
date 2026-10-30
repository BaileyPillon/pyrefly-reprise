/**
 * The 50 ms blend's reach where a head travels up and down (held-chapters lane, 2026-10-29; FFX only in effect: Chapter VIII's Evrae and Chapter XVIII's Sin's face; `motion/SwapSwitch.ts` `BLEND3_HEAD_MAX`).
 *
 * The planner reads the distance between two heads along x only (`SmearFacts.anchorDistance`), so a swap whose heads are 0.12 of the figure's height apart straight up and down read as "close" and got the
 * 50 ms three-frame blend, which steps the weighted head 0.6 of that distance in one frame: Evrae's `cast>idle` and `hurt>idle`, Auron's `critical>victory` (55 to 60 px in the release 68 runs, gated at 40).
 * In the two chapters of `BLEND_HEAD_CHAPTERS` the guard now also reads the whole distance (`SmearFacts.headDistance`); every other chapter reads what it read. The line is 0.11 of the figure's height (the
 * review of 2026-10-29 found 0.08 sent Wakka's blends, 0.101 and 0.102 of his height apart and never a recorded jerk, back to today's blend); the real shares are pinned on the real actor in
 * `tests/unit/engine/held-chapters-evrae-actor.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PoseBlend } from '../../src/engine/PoseBlend.ts';
import { planeAnchor, type Footprint } from '../../src/engine/PoseAlign.ts';
import { setCurvesChapter } from '../../src/engine/motion/CurvesSwitch.ts';
import { SmearDirector, type SmearHost } from '../../src/engine/motion/SmearDirector.ts';
import { pairFacts } from '../../src/engine/motion/SmearFacts.ts';
import { resetSmearLog } from '../../src/engine/motion/SmearLog.ts';
import { setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';
import { resetSwapLog, swapLog } from '../../src/engine/motion/SwapLog.ts';
import { BLEND3_HEAD_MAX, BLEND_HEAD_CHAPTERS, SCOPE_EXCEPTIONS, WIDE_CHAPTERS, blendGuardFromSearch, blendGuardOn, blendHeadMax, blendTooFar, setBlendGuard, setCauseMode, setStanceMode, setSwapScope } from '../../src/engine/motion/SwapSwitch.ts';
import { setMenuHold } from '../../src/engine/motion/MenuHold.ts';

afterEach(() => {
  setBlendGuard(null);
  setSmearStyle(null);
  setCurvesChapter(undefined);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setMenuHold(null);
  resetSmearLog();
  resetSwapLog();
});

const H = 1.8;
const W = 3;
const SOLID = { w: 4, h: 4, bits: new Uint8Array(16).fill(1) };
/** A solid plane W wide and H tall, centred at (cx, H/2), whose head box is centred `right` world units right of its middle and `up` world units above its middle. */
const plane = (right: number, up: number): Footprint => {
  const u = 0.5 + right / W;
  const t = 0.5 - up / H;
  return { cx: 0, cy: H / 2, width: W, height: H, mirror: 1, mask: SOLID, head: [u - 0.05, t - 0.05, u + 0.05, t + 0.05] };
};

describe('the whole distance between two heads', () => {
  it('planeAnchor carries the head box centre\'s height as well as its x (world units, y up)', () => {
    const a = planeAnchor(plane(0.3, 0.45))!;
    expect(a.x).toBeCloseTo(0.3, 6);
    expect(a.y).toBeCloseTo(H / 2 + 0.45, 6);
    expect(a.source).toBe('head');
  });

  it('pairFacts: heads straight above one another are 0 apart sideways and dy / height apart in all', () => {
    const f = pairFacts(plane(0, 0), plane(0, -0.18), H); // the incoming head is 0.18 lower: a tenth of the height
    expect(f.anchorDistance).toBeCloseTo(0, 6);
    expect(f.headDistance).toBeCloseTo(0.1, 6);
    const g = pairFacts(plane(0, 0), plane(0.12, -0.16), H); // 0.12 across and 0.16 down: 0.2 in all, over 1.8
    expect(g.anchorDistance).toBeCloseTo(0.12 / H, 6);
    expect(g.headDistance).toBeCloseTo(0.2 / H, 6);
  });

  it('pairFacts: a plane with no silhouette gives none', () => {
    expect(pairFacts({ ...plane(0, 0), mask: null }, plane(0, 0), H).headDistance).toBeNull();
  });
});

describe('the table of chapters that read it', () => {
  it('names Evrae and Sin\'s face at 0.11 and no other chapter; an unnamed chapter, or none, reads the sideways distance only', () => {
    expect(BLEND3_HEAD_MAX).toBe(0.11);
    expect(Object.keys(BLEND_HEAD_CHAPTERS).sort()).toEqual(['evrae-airship', 'sin-face']);
    expect(blendHeadMax('evrae-airship')).toBe(0.11);
    expect(blendHeadMax('sin-face')).toBe(0.11);
    for (const id of ['seymour-flux', 'ffx2-bahamut', 'yunalesca', 'ffx2-ixion-djose', 'constructor', undefined]) expect(blendHeadMax(id), String(id)).toBeNull();
  });

  it('the off word: ?blendguard=off (or setBlendGuard(false)) puts the named chapters back on the sideways distance, for a run that reads a chapter with and without the guard', () => {
    expect(blendGuardFromSearch(undefined)).toBe(true);
    expect(blendGuardFromSearch('?swapscope=all')).toBe(true);
    expect(blendGuardFromSearch('?swapscope=all&blendguard=off')).toBe(false);
    expect(blendGuardFromSearch('?blendguard=on')).toBe(true);
    expect(blendGuardOn()).toBe(true);
    setBlendGuard(false);
    expect(blendGuardOn()).toBe(false);
    expect(blendHeadMax('evrae-airship')).toBeNull();
    expect(blendTooFar(0.3, 'sin-face')).toBe(false);
    setBlendGuard(null);
    expect(blendHeadMax('evrae-airship')).toBe(0.11);
  });

  it('every chapter in it is a listed chapter; Sin\'s face is still held, and Evrae keeps its guard after his exception was lifted (release 69: the guard is what his hurt>idle needs, so the table travels with the chapter)', () => {
    for (const id of Object.keys(BLEND_HEAD_CHAPTERS)) expect(WIDE_CHAPTERS, id).toContain(id);
    expect(Object.keys(SCOPE_EXCEPTIONS)).toContain('sin-face');
    expect(Object.keys(SCOPE_EXCEPTIONS)).not.toContain('evrae-airship');
    expect(blendHeadMax('evrae-airship')).toBe(BLEND3_HEAD_MAX);
  });

  it('blendTooFar: at or over the line in the named chapters; never elsewhere; an unknown distance is not too far', () => {
    expect(blendTooFar(0.11, 'evrae-airship')).toBe(true);
    expect(blendTooFar(0.223, 'sin-face')).toBe(true); // Auron's critical>victory
    expect(blendTooFar(0.132, 'evrae-airship')).toBe(true); // Evrae's hurt>idle
    expect(blendTooFar(0.12, 'evrae-airship')).toBe(true); // Evrae's cast>idle
    expect(blendTooFar(0.109, 'evrae-airship')).toBe(false);
    expect(blendTooFar(0.102, 'sin-face')).toBe(false); // Wakka's critical>idle: a step of 17 to 20 px, never a recorded jerk
    expect(blendTooFar(0.101, 'evrae-airship')).toBe(false); // Wakka's follow>idle
    expect(blendTooFar(null, 'evrae-airship')).toBe(false);
    expect(blendTooFar(Number.NaN, 'evrae-airship')).toBe(false);
    expect(blendTooFar(0.5, 'seymour-flux')).toBe(false);
    expect(blendTooFar(0.5, undefined)).toBe(false);
  });
});

// ------------------------------------------------------------------ the director, on a fake host with the real PoseBlend

interface Rig {
  dir: SmearDirector;
  /** Ask for painting `pose` the way `PaintedActor.setPose` does, the incoming head `right` and `up` world units from the plane's middle; returns what `swap()` said (true: a cut or a designed blend; false: today's blend). */
  ask(pose: string, right: number, up: number): boolean;
}

function rig(startPose: string, startRight: number, startUp: number): Rig {
  const mk = (pose: string, fade: number) => ({ fade, pose, mesh: { scale: { x: 1, y: H } }, material: { uniforms: {} as Record<string, undefined> } });
  const planes = [mk(startPose, 1), mk('', 0)] as const;
  const blend = new PoseBlend([planes[0], planes[1]]);
  const fp: Footprint[] = [plane(startRight, startUp), plane(startRight, startUp)];
  let active: 0 | 1 = 0;
  const host: SmearHost = {
    name: () => 'evrae',
    worldHeight: () => H,
    planes: [planes[0], planes[1]],
    cells: { smearAmt: { value: 0 }, smearStyle: { value: 0 }, smearVec: { value: { set: () => undefined } } },
    blend,
    showing: () => active,
    poseOf: (i) => planes[i]!.pose,
    footprintOf: (i) => fp[i]!,
    canCut: () => true,
    flash: () => undefined,
    flashBlocked: () => false,
  };
  const dir = new SmearDirector(host);
  return {
    dir,
    ask(pose, right, up) {
      const p = blend.request(pose, 120, active);
      if (p.same) throw new Error('the fake host asked for the pose it already shows');
      planes[p.to]!.pose = pose;
      fp[p.to] = plane(right, up);
      active = p.to;
      return dir.swap(p.to, pose);
    },
  };
}

function setUp(chapter: string): void {
  setSmearStyle('paint');
  setCurvesChapter(chapter);
  setSwapScope('all'); // the measuring word: the looks play in every chapter, the held ones too
  setCauseMode('pick');
  setStanceMode('v1a');
}

const designed = (): string[] => swapLog().designed.map((d) => `${d.from}>${d.to} ${d.cls} ${d.ms}`);

describe('the director: a pick blend across heads that are far apart straight up and down', () => {
  it('Evrae: cast>idle with the heads 0.12 of his height apart (0.04 sideways, the outlines overlapping 0.9) keeps today\'s blend', () => {
    setUp('evrae-airship');
    const r = rig('cast', 0, 0);
    expect(r.ask('idle', 0.07, 0.2)).toBe(false); // today's blend: nothing retuned, nothing designed
    expect(designed()).toEqual([]);
  });

  it('Evrae: the same swap with the heads 0.05 apart stays the 50 ms blend, so the rule is a line and not a switch', () => {
    setUp('evrae-airship');
    const r = rig('cast', 0, 0);
    expect(r.ask('idle', 0.02, 0.09)).toBe(true);
    expect(designed()).toEqual(['cast>idle castEnd 50']);
  });

  it("Evrae: Wakka's follow>idle, the heads 0.0996 of his height apart (0.039 sideways), stays the 50 ms blend: the line is 0.11, not the 0.08 the first build had", () => {
    setUp('evrae-airship');
    const r = rig('follow', 0, 0);
    expect(r.ask('idle', 0.07, 0.165)).toBe(true); // hypot(0.07, 0.165) / 1.8 = 0.0996
    expect(designed()).toEqual(['follow>idle home 50']);
  });

  it('Sin\'s face: the same Wakka swap, 0.10 apart, is the 50 ms blend too', () => {
    setUp('sin-face');
    const r = rig('critical', 0, 0);
    expect(r.ask('idle', 0.07, 0.165)).toBe(true);
    expect(designed()).toEqual(['critical>idle criticalOut 50']);
  });

  it('the off word: with the guard off, Evrae\'s cast>idle at 0.12 is the 50 ms blend (the sideways distance is 0.04, so the planner reads it as close), for the run that measures the chapter without the guard', () => {
    setUp('evrae-airship');
    setBlendGuard(false);
    const r = rig('cast', 0, 0);
    expect(r.ask('idle', 0.07, 0.2)).toBe(true);
    expect(designed()).toEqual(['cast>idle castEnd 50']);
  });

  it('Sin\'s face: Auron\'s critical>victory, 0.22 of his height straight up, keeps today\'s blend', () => {
    setUp('sin-face');
    const r = rig('critical', 0, 0);
    expect(r.ask('victory', 0.02, 0.4)).toBe(false);
    expect(designed()).toEqual([]);
  });

  it('Chapter I (a pack chapter) and Yunalesca read what they read: the same 0.12 swap gets the 50 ms blend', () => {
    for (const chapter of ['seymour-flux', 'yunalesca', 'ffx2-ixion-djose']) {
      resetSwapLog();
      setUp(chapter);
      const r = rig('cast', 0, 0);
      expect(r.ask('idle', 0.07, 0.2), chapter).toBe(true);
      expect(designed(), chapter).toEqual(['cast>idle castEnd 50']);
    }
  });

  it('the word the page can still give: `?stance=v3` keeps its unguarded blend (the plan\'s V3 arm, for the clip) even in Evrae', () => {
    setUp('evrae-airship');
    setStanceMode('v3');
    const r = rig('idle', 0, 0);
    expect(r.ask('ready', 0.07, 0.3)).toBe(true); // idle>ready is a stance change: v3 blends whatever the pair
    expect(designed()).toEqual(['idle>ready stance 50']);
  });
});
