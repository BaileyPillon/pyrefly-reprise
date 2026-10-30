/**
 * One cut-anchor word for a chapter (held-chapters lane, 2026-10-29; FFX only in effect: Yunalesca and Sin's face; `motion/CutAnchor.ts` `CUT_ANCHOR_CHAPTERS`).
 *
 * Release 68 kept both chapters out of the wide swap scope because their planned cuts sit across heads 0.40 to 0.44 of the figure's height apart: a step of about half the drawn height, which the harness
 * refuses to excuse by 0.1 to 1.2 percent (Yunalesca's attack to cast 133 px against a cap of 131.5, Auron's follow to idle 224 px against 222 in Sin's face). The cut anchor (MF-18) is the plan's own fix; it was a
 * word for a game (`CUT_ANCHOR_DEFAULT`), and lifting an exception by flipping FFX would have flipped Chapter I and the eight FFX joiners with it. Now a chapter can have its own word. Inert today: both chapters
 * are `SCOPE_EXCEPTIONS`, and the smear is `off` outside the two pack chapters.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PoseBlend } from '../../src/engine/PoseBlend.ts';
import type { Footprint } from '../../src/engine/PoseAlign.ts';
import { setCurvesChapter } from '../../src/engine/motion/CurvesSwitch.ts';
import { CUT_ANCHOR_CHAPTERS, CUT_ANCHOR_DEFAULT, chapterWord, cutAnchorFromSearch, cutAnchorGame, cutAnchorMode, setCutAnchorMode } from '../../src/engine/motion/CutAnchor.ts';
import { SmearDirector, type SmearHost } from '../../src/engine/motion/SmearDirector.ts';
import { resetSmearLog, smearLog } from '../../src/engine/motion/SmearLog.ts';
import { setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';
import { resetSwapLog } from '../../src/engine/motion/SwapLog.ts';
import { SCOPE_EXCEPTIONS, setCauseMode, setStanceMode, setSwapScope } from '../../src/engine/motion/SwapSwitch.ts';
import { setMenuHold } from '../../src/engine/motion/MenuHold.ts';
import { setAlignedSwap } from '../../src/engine/PoseSwap.ts';

beforeEach(() => {
  vi.stubGlobal('location', { search: '' }); // a page with the pack on (the desktop default) and no word in the address
});

afterEach(() => {
  vi.unstubAllGlobals();
  setCutAnchorMode(null);
  setSmearStyle(null);
  setCurvesChapter(undefined);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setMenuHold(null);
  setAlignedSwap(null);
  resetSmearLog();
  resetSwapLog();
});

describe('the table', () => {
  it('gives Yunalesca and Sin\'s face the anchor and no other chapter', () => {
    expect(CUT_ANCHOR_CHAPTERS).toEqual({ yunalesca: 'on', 'sin-face': 'on' });
    expect(chapterWord('yunalesca')).toBe('on');
    expect(chapterWord('sin-face')).toBe('on');
    for (const id of ['seymour-flux', 'ffx2-bahamut', 'evrae-airship', 'ffx2-ixion-djose', 'constructor', 'toString', undefined]) expect(chapterWord(id), String(id)).toBeNull();
  });

  it('is inert today and stays so until a lift: every chapter in it is FFX\'s and a SCOPE_EXCEPTION (no cut is planned there), so the game words are untouched', () => {
    for (const id of Object.keys(CUT_ANCHOR_CHAPTERS)) {
      expect(cutAnchorGame(id), id).toBe('ffx');
      expect(Object.keys(SCOPE_EXCEPTIONS), id).toContain(id);
    }
    expect(CUT_ANCHOR_DEFAULT).toEqual({ ffx: 'today', ffx2: 'today' });
  });
});

describe('the word a chapter reads', () => {
  it('no address word: the chapter\'s own, else the game\'s (today)', () => {
    expect(cutAnchorFromSearch('', 'ffx', 'yunalesca')).toBe('on');
    expect(cutAnchorFromSearch('', 'ffx', 'sin-face')).toBe('on');
    expect(cutAnchorFromSearch('', 'ffx', 'seymour-flux')).toBe('today');
    expect(cutAnchorFromSearch('', 'ffx2', 'ffx2-ixion-djose')).toBe('today');
    expect(cutAnchorFromSearch('', 'ffx')).toBe('today');
  });

  it('an address word beats the chapter\'s (`today` brings release 67\'s cut back, `moving` is the fallback), and the pack off is today whatever the table says', () => {
    expect(cutAnchorFromSearch('?cutanchor=today', 'ffx', 'yunalesca')).toBe('today');
    expect(cutAnchorFromSearch('?cutanchor=moving', 'ffx', 'sin-face')).toBe('moving');
    expect(cutAnchorFromSearch('?pack=off', 'ffx', 'yunalesca')).toBe('today');
    expect(cutAnchorFromSearch(undefined, 'ffx', 'yunalesca')).toBe('today'); // no page at all: release 62's
  });

  it('the live reader follows the running chapter: Yunalesca on, Chapter I today; a forced mode beats both', () => {
    setCurvesChapter('yunalesca');
    setCutAnchorMode(null);
    expect(cutAnchorMode()).toBe('on');
    setCurvesChapter('seymour-flux');
    expect(cutAnchorMode()).toBe('today');
    setCurvesChapter('sin-face');
    expect(cutAnchorMode()).toBe('on');
    setCutAnchorMode('moving');
    expect(cutAnchorMode()).toBe('moving');
  });
});

// ------------------------------------------------------------------ the director, on a fake host: Yunalesca's cut is anchored, Chapter I's is not

const H = 1.8;
const W = 3;
const SOLID = { w: 4, h: 4, bits: new Uint8Array(16).fill(1) };
const plane = (right: number): Footprint => {
  const u = 0.5 + right / W;
  return { cx: 0, cy: H / 2, width: W, height: H, mirror: 1, mask: SOLID, head: [u - 0.05, 0.05, u + 0.05, 0.15] };
};

function cutAcross(heads: number): Array<[number, number]> {
  const mk = (pose: string, fade: number) => ({ fade, pose, mesh: { scale: { x: 1, y: H } }, material: { uniforms: {} as Record<string, undefined> } });
  const planes = [mk('idle', 1), mk('', 0)] as const;
  const blend = new PoseBlend([planes[0], planes[1]]);
  const fp: Footprint[] = [plane(0), plane(0)];
  const shifts: Array<[number, number]> = [];
  let active: 0 | 1 = 0;
  const host: SmearHost = {
    name: () => 'auron',
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
    shiftPlane: (i, dx) => { shifts.push([i, dx]); },
  };
  const dir = new SmearDirector(host);
  const p = blend.request('hurt', 120, active);
  if (p.same) throw new Error('the fake host asked for the pose it already shows');
  planes[p.to]!.pose = 'hurt';
  fp[p.to] = plane(heads * H);
  active = p.to;
  dir.swap(p.to, 'hurt');
  return shifts;
}

describe('the director on a cut across heads 0.33 of the height apart, no forced mode and no address word', () => {
  const setUp = (chapter: string): void => {
    setSmearStyle('paint');
    setCurvesChapter(chapter);
    setSwapScope('all'); // the measuring word: the looks play in the held chapters too
    setCauseMode('cut');
    setCutAnchorMode(null);
  };

  it('Yunalesca: the incoming plane is drawn back so 0.12 of the height is left, and the cut is logged with its glide', () => {
    setUp('yunalesca');
    const shifts = cutAcross(0.33);
    expect(shifts).toHaveLength(1);
    expect(shifts[0]![1]).toBeCloseTo(-(0.33 - 0.12) * H, 9);
    expect(smearLog()[0]!.glide).toBeDefined();
  });

  it('Chapter I and Ixion XVI: the same cut moves nothing (their word is today)', () => {
    for (const chapter of ['seymour-flux', 'ffx2-ixion-djose', 'evrae-airship']) {
      resetSmearLog();
      setUp(chapter);
      expect(cutAcross(0.33), chapter).toEqual([]);
      expect(smearLog()[0]?.glide, chapter).toBeUndefined();
    }
  });
});
