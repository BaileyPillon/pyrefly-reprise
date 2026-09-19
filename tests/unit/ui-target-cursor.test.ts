// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';
import { resolveTargetMode } from '../../src/ui/ffx/CommandMenuLogic.ts';
import type { AvailableCommand } from '../../src/battle/common/types.ts';

/**
 * The three fiends of Bailey's Chapter 3 frame, laid out along the bottom of a
 * 1920x1080 frame in the order the *engine* emits them — which is deliberately
 * not left-to-right, because the cursor has to sort them itself.
 */
const RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  'braskas-final-aeon': { x: 1080, y: 380, w: 420, h: 520 },
  'yu-pagoda-c': { x: 760, y: 560, w: 150, h: 330 },
  'yu-pagoda-b': { x: 1560, y: 500, w: 130, h: 300 },
};

const ENEMIES: TargetEntry[] = [
  { id: 'braskas-final-aeon', name: "Braska's Final Aeon", kind: 'enemy' },
  { id: 'yu-pagoda-c', name: 'Yu Pagoda', kind: 'enemy', tag: 'C' },
  { id: 'yu-pagoda-b', name: 'Yu Pagoda', kind: 'enemy', tag: 'B' },
];

const PARTY: TargetEntry[] = [
  { id: 'tidus', name: 'Tidus', kind: 'self' },
  { id: 'yuna', name: 'Yuna', kind: 'ally' },
  { id: 'auron', name: 'Auron', kind: 'ally' },
];

function makeCursor(): TargetCursor {
  const c = new TargetCursor();
  c.setProjector((id) => RECTS[id] ?? { x: 100, y: 100, w: 80, h: 200 });
  document.body.append(c.el);
  return c;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('the bracket is scaled to the figure, not to a fixed box', () => {
  it('draws each bracket at the silhouette it was given', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    const boxes = [...c.el.querySelectorAll<HTMLElement>('.ffx-target')];
    expect(boxes).toHaveLength(3);
    const aeon = boxes.find((b) => b.dataset['targetId'] === 'braskas-final-aeon')!;
    expect(aeon.style.width).toBe('420px');
    expect(aeon.style.height).toBe('520px');
    const pagoda = boxes.find((b) => b.dataset['targetId'] === 'yu-pagoda-c')!;
    // The defect this replaces drew BOTH of these at a fixed 64px.
    expect(pagoda.style.width).toBe('150px');
    expect(pagoda.style.width).not.toBe(aeon.style.width);
  });

  it('sizes the corner to the figure, within bounds', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    const aeon = c.el.querySelector<HTMLElement>('[data-target-id="braskas-final-aeon"]')!;
    const pagoda = c.el.querySelector<HTMLElement>('[data-target-id="yu-pagoda-c"]')!;
    const cornerOf = (el: HTMLElement): number =>
      Number.parseFloat(el.style.getPropertyValue('--ffx-corner'));
    expect(cornerOf(aeon)).toBeGreaterThan(cornerOf(pagoda));
    expect(cornerOf(aeon)).toBeLessThanOrEqual(54);
    expect(cornerOf(pagoda)).toBeGreaterThanOrEqual(12);
  });
});

describe('the name plate carries the letter tag', () => {
  it("prints the tag that tells Yu Pagoda B from Yu Pagoda C", () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    c.setActiveById('yu-pagoda-c');
    const plate = c.el.querySelector('.ffx-target__plate')!;
    expect(plate.querySelector('.ffx-target__name')!.textContent).toBe('Yu Pagoda');
    expect(plate.querySelector('.ffx-target__tag')!.textContent).toBe('C');
  });

  it('shows exactly one plate, on the active target', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    expect(c.el.querySelectorAll('.ffx-target__plate')).toHaveLength(1);
  });

  it('prints a buff note when the HUD supplied one', () => {
    const c = makeCursor();
    c.showSingle([{ ...PARTY[1]!, note: 'already Hasted' }]);
    expect(c.el.querySelector('.ffx-target__note')!.textContent).toBe('already Hasted');
  });
});

describe('cycling follows on-screen position, left to right', () => {
  it('starts on the leftmost fiend, not the first the engine emitted', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    // Yu Pagoda C is at x=760, the leftmost; the engine listed the aeon first.
    expect(c.activeTargetId).toBe('yu-pagoda-c');
  });

  it('steps rightward across the field', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    c.step(1);
    expect(c.activeTargetId).toBe('braskas-final-aeon'); // x = 1080
    c.step(1);
    expect(c.activeTargetId).toBe('yu-pagoda-b'); // x = 1560
  });

  it('wraps around rather than stopping at the edge', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    c.step(-1);
    expect(c.activeTargetId).toBe('yu-pagoda-b');
  });
});

describe('a multi-target command rings every target', () => {
  it('brackets all three party members and labels the group', () => {
    const c = makeCursor();
    c.showGroup(PARTY);
    expect(c.el.querySelectorAll('.ffx-target--group')).toHaveLength(3);
    expect(c.el.querySelector('.ffx-target__all')!.textContent).toBe('ALL ALLIES');
  });

  it('says ALL ENEMIES for an all-enemy command', () => {
    const c = makeCursor();
    c.showGroup(ENEMIES);
    expect(c.el.querySelector('.ffx-target__all')!.textContent).toBe('ALL ENEMIES');
  });

  it('withdraws the field cursor — a hand between three allies points at nothing', () => {
    const c = makeCursor();
    c.showGroup(PARTY);
    expect(c.el.querySelector('.ffx-target__hand')).toBeNull();
  });

  it('reports every id as selected', () => {
    const c = makeCursor();
    c.showGroup(PARTY);
    expect(c.selection).toMatchObject({ mode: 'all' });
    expect(c.selection!.ids.sort()).toEqual(['auron', 'tidus', 'yuna']);
  });

  /**
   * The live defect in Bailey's own frame. `.ffx-target--dim` was put on every
   * target of a party-wide cast, and the CSS rule behind that class carried a
   * `border-width` SHORTHAND — so the three green L-shaped brackets came out as
   * eight closed grey squares and nothing said who Hastega was for. Two
   * guards, because it took both mistakes to produce it.
   */
  it('dims nobody — in a group cast every figure IS a target', () => {
    const c = makeCursor();
    c.showGroup(PARTY);
    expect(c.el.querySelectorAll('.ffx-target--dim')).toHaveLength(0);
    c.showGroup(ENEMIES);
    expect(c.el.querySelectorAll('.ffx-target--dim')).toHaveLength(0);
  });

  it('still dims the candidates a single-target cursor is not aimed at', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    // Three candidates, one aimed at: the other two stay subordinate.
    expect(c.el.querySelectorAll('.ffx-target--dim')).toHaveLength(2);
  });
});

describe('the cursor chrome is game-specific (AGENTS.md rule 14)', () => {
  it('FFX shows the pointing hand and no flower', () => {
    const c = makeCursor();
    c.setChrome('ffx');
    c.showSingle(ENEMIES);
    expect(c.el.querySelector('.ffx-target__hand')).not.toBeNull();
    expect(c.el.querySelector('.ffx-target__flower')).toBeNull();
  });

  it('FFX-2 shows the six-petal flower and NEVER the hand', () => {
    const c = makeCursor();
    c.setChrome('ffx2');
    c.showSingle(ENEMIES);
    expect(c.el.querySelector('.ffx-target__flower')).not.toBeNull();
    // visual-bible 4.2: "not a finger". ffx-vs-ffx2-presentation 9 row 2: the
    // two chromes must never be mixed.
    expect(c.el.querySelector('.ffx-target__hand')).toBeNull();
  });

  it('draws six petals, as the source specifies', () => {
    const c = makeCursor();
    c.setChrome('ffx2');
    c.showSingle(ENEMIES);
    expect(c.el.querySelectorAll('.ffx-flower__petal')).toHaveLength(6);
  });

  it('the bracket and the name plate are the same in both games', () => {
    const ffx = makeCursor();
    ffx.setChrome('ffx');
    ffx.showSingle(ENEMIES);
    ffx.setActiveById('yu-pagoda-c');
    const ffx2 = makeCursor();
    ffx2.setChrome('ffx2');
    ffx2.showSingle(ENEMIES);
    ffx2.setActiveById('yu-pagoda-c');
    for (const c of [ffx, ffx2]) {
      expect(c.el.querySelectorAll('.ffx-target')).toHaveLength(3);
      expect(c.el.querySelector('.ffx-target__tag')!.textContent).toBe('C');
    }
  });
});

describe('the selection is published so every surface can agree', () => {
  it('fires on show, on each step and on hide', () => {
    const c = makeCursor();
    const seen: Array<string[] | null> = [];
    c.setOnSelection((sel) => seen.push(sel ? sel.ids : null));
    c.showSingle(ENEMIES);
    c.step(1);
    c.hide();
    expect(seen).toHaveLength(3);
    expect(seen[2]).toBeNull();
  });

  it('names the accent kind, so the field knows gold from green', () => {
    const c = makeCursor();
    c.showSingle(PARTY);
    c.setActiveById('yuna');
    expect(c.selection!.kind).toBe('ally');
    c.showSingle(ENEMIES);
    expect(c.selection!.kind).toBe('enemy');
  });
});

describe('resolveTargetMode — Hastega is not a question', () => {
  const cmd = (over: Partial<AvailableCommand>): AvailableCommand =>
    ({
      command: { kind: 'ability', id: 'x', targets: [] },
      label: 'X',
      category: 'whitemagic',
      mpCost: 0,
      enabled: true,
      validTargets: ['tidus', 'yuna', 'auron'],
      ...over,
    }) as AvailableCommand;

  it('treats a party-wide cast as ALL, not as a choice of one', () => {
    // The exact defect in Bailey's frame: before `targeting` was published,
    // Hastega arrived as three validTargets and an empty command.targets,
    // which is indistinguishable from "pick one of these three".
    expect(resolveTargetMode(cmd({ targeting: 'all-allies' }))).toEqual({
      mode: 'all',
      targets: ['tidus', 'yuna', 'auron'],
    });
  });

  it('treats an all-enemy cast the same way', () => {
    expect(resolveTargetMode(cmd({ targeting: 'all-enemies' })).mode).toBe('all');
  });

  it('still asks which one for a single-target cast', () => {
    expect(resolveTargetMode(cmd({ targeting: 'single-ally' })).mode).toBe('choose');
  });

  it('falls back to the old behaviour when the engine did not say', () => {
    expect(resolveTargetMode(cmd({})).mode).toBe('choose');
  });

  it('never asks when the engine already resolved the targets', () => {
    const resolved = cmd({
      command: { kind: 'ability', id: 'x', targets: ['yuna'] },
      targeting: 'all-allies',
    });
    expect(resolveTargetMode(resolved)).toEqual({ mode: 'none', targets: ['yuna'] });
  });
});

describe('hiding clears the field', () => {
  it('leaves no bracket, plate or hand behind', () => {
    const c = makeCursor();
    c.showSingle(ENEMIES);
    c.hide();
    expect(c.el.innerHTML).toBe('');
  });

  it('does not re-publish null when nothing was showing', () => {
    const c = makeCursor();
    const spy = vi.fn();
    c.setOnSelection(spy);
    c.hide();
    expect(spy).not.toHaveBeenCalled();
  });
});
