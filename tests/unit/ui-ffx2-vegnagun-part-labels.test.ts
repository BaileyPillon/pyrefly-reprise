// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, AvailableCommand, BattleState } from '../../src/battle/common/types.ts';
import { dockPlate, overlapArea, plateBox } from '../../src/ui/ffx/targetCursorParts.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { BAND_GRID_HEIGHT } from '../../src/ui/ffx2/commandHelpBand.ts';
import { MARK_GAP, NodeEdgeMarkers, placeMarks, ROW_GAP } from '../../src/ui/ffx2/nodeEdgeMarkers.ts';

/**
 * D-044 (FFX-2 only, Chapter 5): a single-target attack aimed at a named
 * Vegnagun part has to be readable. Two defects the focused review of
 * a999d133 measured at 1600x900 and 2000x1012:
 *
 * - Left Bulwark's ring stands under the FFX-2 command window (the open link 3
 *   staging question), and the FFX-2 cursor was never given the HUD's panels,
 *   so its "Left Bulwark" plate printed over the CHANGE row;
 * - the Nodes hang overhead, so their bracket, flower and plate were all drawn
 *   off-frame; the approved Node C marks them at the top edge instead.
 *
 * Geometry is the measured 1600x900 frame: command window x 1246-1570,
 * y 351-609; Left Bulwark's ring x 1437-1526, y 365-485.
 */
const WINDOW = { x: 1246, y: 351, w: 324, h: 258 };
const LEFT_BULWARK = { x: 1437, y: 365, w: 89, h: 120 };

let saved: { w: number; h: number };
beforeEach(() => {
  document.body.innerHTML = '';
  saved = { w: window.innerWidth, h: window.innerHeight };
  Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
});
afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: saved.w, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: saved.h, configurable: true });
});

describe('dockPlate (shared plumbing, both games)', () => {
  it('keeps the plate under the figure when that side is clear', () => {
    const d = dockPlate({ x: 900, y: 360, w: 90, h: 120 }, 131, 34, [WINDOW]);
    expect(d.side).toBe('below');
  });

  it('pushes the plate out past the panel a boxed-in figure stands under', () => {
    const d = dockPlate(LEFT_BULWARK, 131, 34, [WINDOW]);
    const box = plateBox(d.side, d.x, d.y, 131, 34);
    expect(overlapArea(box, WINDOW)).toBe(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    // Above the window, right over the ring it names.
    expect(d.side).toBe('above');
    expect(box.x + box.w / 2).toBeCloseTo(LEFT_BULWARK.x + LEFT_BULWARK.w / 2, 0);
  });

  it('with no panels, docks under the figure as before', () => {
    expect(dockPlate(LEFT_BULWARK, 131, 34, []).side).toBe('below');
  });
});

describe('the FFX-2 command menu hands its cursor the HUD panels (D-044)', () => {
  const commands: AvailableCommand[] = [
    {
      command: { kind: 'attack', targets: [] },
      label: 'Attack',
      category: 'attack',
      mpCost: 0,
      enabled: true,
      validTargets: ['bulwark-l'],
    },
  ];
  const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };

  function open(panels?: () => Array<typeof WINDOW>): HTMLElement {
    const container = document.createElement('div');
    const targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
    void openCommandMenu({
      container,
      targetLayer,
      commands,
      previewRank: () => EMPTY,
      project: () => null,
      projectRect: () => LEFT_BULWARK,
      nameOf: () => 'Left Bulwark',
      ...(panels ? { panels } : {}),
      onPreview: () => {},
      actorName: 'Rikku',
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    return targetLayer;
  }

  it("docks Left Bulwark's plate off the command window", () => {
    const layer = open(() => [WINDOW]);
    const plate = layer.querySelector<HTMLElement>('.ffx-target__plate');
    expect(plate?.textContent).toContain('Left Bulwark');
    expect(plate?.className).toContain('ffx-target__plate--above');
    expect(parseFloat(plate!.style.top)).toBeLessThanOrEqual(WINDOW.y);
  });

  it('without panels (the HUD mock) the plate keeps its place under the figure', () => {
    const layer = open();
    expect(layer.querySelector('.ffx-target__plate')?.className).toContain('ffx-target__plate--below');
  });
});

describe('placeMarks (Node C edge markers)', () => {
  it('keeps each marker on its Node when nothing is in the way', () => {
    const at = placeMarks([{ id: 'node-a', x: 300, w: 38 }], []);
    expect(at.get('node-a')).toBe(300);
  });

  it('spreads markers that crowd each other, in the Nodes own order, never overlapping', () => {
    // The measured 1600x900 projections: Node A 404, Node C 430, Node B 461 grid units.
    const wants = [
      { id: 'node-a', x: 404, w: 38 },
      { id: 'node-b', x: 461, w: 38 },
      { id: 'node-c', x: 430, w: 38 },
    ];
    const at = placeMarks(wants, []);
    const xs = ['node-a', 'node-c', 'node-b'].map((id) => at.get(id)!);
    expect(xs[0]).toBeLessThan(xs[1]!);
    expect(xs[1]).toBeLessThan(xs[2]!);
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(38 + MARK_GAP - 1e-6);
  });

  it('slides off a blocked span (the TARGET plate) and stays inside the frame', () => {
    const at = placeMarks([{ id: 'node-a', x: 380, w: 38 }], [{ lo: 256, hi: 400 }]);
    const x = at.get('node-a')!;
    expect(x - 19).toBeGreaterThanOrEqual(400 + MARK_GAP - 1e-6);
    const edge = placeMarks([{ id: 'node-b', x: 700, w: 38 }], []);
    expect(edge.get('node-b')! + 19).toBeLessThanOrEqual(636 + 1e-6);
  });
});

describe('placeMarks keeps the Nodes order when the markers are pushed away', () => {
  it('stacks them A, C, B when the only room is to the left of a plate and the slab (was B, C, A)', () => {
    // The measured 2000x1012 frame on the grid: ATB chip to 134, TARGET plate 267-373, intent slab 376-526, actor plate 530-630.
    const wants = [
      { id: 'node-a', x: 430, w: 38 },
      { id: 'node-c', x: 470, w: 38 },
      { id: 'node-b', x: 510, w: 38 },
    ];
    const blocked = [
      { lo: 18, hi: 134 },
      { lo: 267, hi: 373 },
      { lo: 376, hi: 526 },
      { lo: 530, hi: 630 },
    ];
    const at = placeMarks(wants, blocked);
    const [a, c, b] = ['node-a', 'node-c', 'node-b'].map((id) => at.get(id)!);
    expect(a).toBeLessThan(c!);
    expect(c).toBeLessThan(b!);
    expect(b! + 19).toBeLessThanOrEqual(267 - MARK_GAP + 1e-6);
    expect(a! - 19).toBeGreaterThanOrEqual(134 + MARK_GAP - 1e-6);
  });
});

describe('NodeEdgeMarkers (FFX-2 only)', () => {
  function state(colour: number, alive = true): BattleState {
    const node = (id: string, name: string) => ({ id, name, side: 'enemy', spriteKey: 'vegnagun-node', alive, flags: { isPart: true }, aiMemory: { colour } });
    return {
      combatants: {
        'node-a': node('node-a', 'Node A'),
        'node-b': node('node-b', 'Node B'),
        'vegnagun-leg': { id: 'vegnagun-leg', name: 'Vegnagun', side: 'enemy', spriteKey: 'vegnagun-leg', alive: true, flags: {} },
      },
    } as unknown as BattleState;
  }

  function mount(s: BattleState, y: number, bandOnStage = true): { marks: NodeEdgeMarkers; layer: HTMLElement } {
    const host = document.createElement('div');
    const layer = document.createElement('div');
    host.append(layer);
    document.body.append(host);
    const marks = new NodeEdgeMarkers();
    const xs: Record<string, number> = { 'node-a': 1000, 'node-b': 1150 };
    marks.mount(layer, () => ({
      state: s,
      project: (id) => (xs[id] === undefined ? null : { x: xs[id]!, y }),
      host,
      stageX: 0,
      stageY: 0,
      scale: 2.5,
      bandOnStage: () => bandOnStage,
    }));
    marks.update();
    return { marks, layer };
  }

  it('marks each Node above the top edge with an arrow inside its own plate unit, under the help band', () => {
    const { layer } = mount(state(1), -300);
    const marks = [...layer.querySelectorAll<HTMLElement>('.ffx2-nodemark')];
    expect(marks.map((m) => m.textContent)).toEqual(['Node A', 'Node B']);
    for (const m of marks) {
      expect(m.querySelector('.ffx2-nodemark__arrow')).not.toBeNull();
      expect(m.className).toContain('ffx2-nodemark--green');
      expect(parseFloat(m.style.top)).toBeCloseTo(BAND_GRID_HEIGHT + ROW_GAP, 2);
    }
    expect(parseFloat(marks[0]!.style.left)).toBeCloseTo(400, 0);
  });

  it('sits at the stage top when the band is not on the stage', () => {
    const { layer } = mount(state(0), -300, false);
    expect(parseFloat(layer.querySelector<HTMLElement>('.ffx2-nodemark')!.style.top)).toBeCloseTo(ROW_GAP, 2);
    expect(layer.querySelector('.ffx2-nodemark')!.className).toContain('ffx2-nodemark--red');
  });

  it('lights the Node the cursor is on', () => {
    const { marks, layer } = mount(state(2), -300);
    marks.select(['node-b']);
    const on = [...layer.querySelectorAll('.ffx2-nodemark--on')].map((m) => m.textContent);
    expect(on).toEqual(['Node B']);
    expect(layer.querySelector('.ffx2-nodemark--yellow')).not.toBeNull();
    marks.select(null);
    expect(layer.querySelector('.ffx2-nodemark--on')).toBeNull();
  });

  it('draws nothing for a Node that is in frame, or KO, and nothing after unmount', () => {
    expect(mount(state(0), 200).layer.querySelector('.ffx2-nodemark')).toBeNull();
    expect(mount(state(0, false), -300).layer.querySelector('.ffx2-nodemark')).toBeNull();
    const { marks, layer } = mount(state(0), -300);
    marks.unmount();
    expect(layer.querySelector('.ffx2-nodemark')).toBeNull();
  });
});
