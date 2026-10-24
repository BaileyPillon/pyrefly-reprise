// @vitest-environment jsdom
/**
 * R63-PLAY, the overnight fix of the skeptic's KO finding (both games): the KO mark stands on the downed member's own sprite and keeps clear of the figures in front of her.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BattleState } from '../../src/battle/common/types.ts';
import { setProMode } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { KO_MARK_MIN_VISIBLE, markSpot, ProFieldMarks } from '../../src/ui/common/ProFieldMarks.ts';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');
void src;
void vi;

// ------------------------------------------------------------------------------------------------ KO

describe("KO: the mark stands on the downed member's own sprite", () => {
  const at = { x: 200, y: 230 }; // the point of her own body the mark would take
  const ownW = 200;

  it('that point when no standing figure covers it', () => {
    expect(markSpot(at, ownW, [])).toEqual(at);
  });

  it('a figure standing in front of it moves the mark along her own width to the first point that is clear', () => {
    const tidus = { x: 150, y: 150, w: 100, h: 200 }; // covers x 150..250 (and the 6 px round it)
    const spot = markSpot(at, ownW, [tidus])!;
    expect(spot.y).toBe(230);
    expect(Math.abs(spot.x - at.x)).toBeLessThanOrEqual(ownW * 0.6);
    expect(spot.x < 144 || spot.x > 256).toBe(true);
  });

  it('no clear point along her width: no mark, rather than a mark on someone else', () => {
    expect(markSpot(at, ownW, [{ x: -1000, y: 0, w: 3000, h: 1000 }])).toBeNull();
  });

  const state = (alive: Record<string, boolean>): BattleState =>
    ({ activeIds: Object.keys(alive), combatants: Object.fromEntries(Object.entries(alive).map(([id, a]) => [id, { id, alive: a }])) }) as unknown as BattleState;
  const tick = (m: ProFieldMarks, ms: number): void => {
    for (let t = 0; t < ms; t += 10) m.update(0.01);
  };
  const at2 = (m: ProFieldMarks): [number, number] => {
    const t = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(m.el.querySelector<HTMLElement>('.pro-ko-mark')!.style.transform)!;
    return [Number(t[1]), Number(t[2])];
  };

  it('the HUD layer keeps the mark off the figure in front of her, and draws none when her sprite is off the stage or all but covered', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2560 }); // wide = 230 px: the mark sits 46 px above her feet
    try {
      const m = new ProFieldMarks('ffx');
      document.body.append(m.el);
      let rects: Record<string, { x: number; y: number; w: number; h: number } | null> = { tidus: { x: 150, y: 150, w: 100, h: 200 }, kimahri: { x: 100, y: 200, w: 200, h: 100 } };
      let visible = 1;
      m.setProjector(() => ({ x: 200, y: 330 })); // her actor's feet: the old anchor is (200, 284), under Tidus
      m.setFigures({ rect: (id) => rects[id] ?? null, visibility: () => visible });
      m.sync(state({ tidus: true, kimahri: false }));
      tick(m, 2500);
      const mark = m.el.querySelector<HTMLElement>('.pro-ko-mark')!;
      expect(Number(mark.style.opacity)).toBe(1);
      const [x, y] = at2(m);
      expect(x < 144 || x > 256).toBe(true); // not over the figure in front of her
      expect(Math.abs(x - 200)).toBeLessThanOrEqual(120); // and still on her own width
      expect(y).toBeCloseTo(284, 0);
      visible = KO_MARK_MIN_VISIBLE / 2; // all but covered
      tick(m, 20);
      expect(Number(mark.style.opacity)).toBe(0);
      visible = 1;
      tick(m, 20);
      expect(Number(mark.style.opacity)).toBe(1);
      rects = { tidus: rects['tidus']!, kimahri: null }; // her sprite is off the stage
      tick(m, 20);
      expect(Number(mark.style.opacity)).toBe(0);
    } finally {
      setProMode(null);
      setDemoChapter(undefined);
    }
  });

  it('with no figure in front of her the mark stands where it always did, field wired or not', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    try {
      const m = new ProFieldMarks('ffx');
      document.body.append(m.el);
      m.setProjector(() => ({ x: 500, y: 800 }));
      m.sync(state({ tidus: true, kimahri: false }));
      tick(m, 2500);
      expect(Number(m.el.querySelector<HTMLElement>('.pro-ko-mark')!.style.opacity)).toBe(1);
      expect(at2(m)[0]).toBe(500);
      const m2 = new ProFieldMarks('ffx');
      document.body.append(m2.el);
      m2.setProjector(() => ({ x: 500, y: 800 }));
      m2.setFigures({ rect: () => ({ x: 0, y: 0, w: 10, h: 10 }), visibility: () => 1 });
      m2.sync(state({ tidus: true, kimahri: false }));
      tick(m2, 2500);
      expect(at2(m2)[0]).toBe(500);
    } finally {
      setProMode(null);
      setDemoChapter(undefined);
    }
  });
});
