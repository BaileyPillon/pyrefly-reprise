// @vitest-environment jsdom
/**
 * r381-ui-floor: the party list's aim nudge is held by the room the OD bar really leaves, measured at run time
 * (`src/ui/ffx/odHang.ts`; method check `docs/plans/r37-ui-floor-method-check.md` section 4, the independent check's blocker B1:
 * Chapter III at 1024x768, "6492/6492", the "D" cut by the window at every TEXT SIZE). Game case: FFX only (FFX-2's party list
 * is left-anchored, takes no aim nudge and has no Overdrive bar). The browser proof is in `docs/handoff/r381-ui-floor.md`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OD_HANG_PROP, aimNudge, odHangOf, publishOdHang } from '../../src/ui/ffx/odHang.ts';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

/** The list's own right edge is 23.11 grid px inside the 640 px stage; the aim keeps 2 grid px of air. */
const LIST_RIGHT_GRID = 640 - 23.11;
const LIMIT_GRID = 640 - 2;

function boxed(el: Element, r: { left: number; right: number; top?: number; bottom?: number }): void {
  const top = r.top ?? 0;
  const bottom = r.bottom ?? 10;
  (el as HTMLElement).getBoundingClientRect = (): DOMRect =>
    ({ left: r.left, right: r.right, top, bottom, x: r.left, y: top, width: r.right - r.left, height: bottom - top, toJSON: () => ({}) }) as DOMRect;
}

/** A party list at 1024x768 (stage scale 1.6) whose rows' OD bars and labels end at the given screen px. */
function list(rows: ReadonlyArray<{ bar: number; label: number }>, listRight = LIST_RIGHT_GRID * 1.6): HTMLElement {
  const el = document.createElement('div');
  el.className = 'ig-stat-list';
  boxed(el, { left: listRight - 342.8, right: listRight });
  for (const r of rows) {
    const row = document.createElement('div');
    row.className = 'ig-stat';
    const od = document.createElement('span');
    od.className = 'ig-stat__od ffx-stat__od';
    boxed(od, { left: r.bar - 85, right: r.bar });
    const em = document.createElement('em');
    em.textContent = 'OD';
    boxed(em, { left: r.label - 20, right: r.label });
    od.append(em);
    row.append(od);
    el.append(row);
  }
  document.body.append(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
  delete document.documentElement.dataset['phoneBattle'];
  vi.restoreAllMocks();
});

describe('odHangOf: how far the right-most bar or label reaches past the list, in list px', () => {
  it('is the widest reach divided by the screen px per list px (Chapter III, 1024x768: the bar hangs 16.2 grid px)', () => {
    expect(odHangOf(987.1, [1009.9, 1013, 993.2, 996.4], 1.6)).toBeCloseTo((1013 - 987.1) / 1.6, 6);
  });
  it('is 0 when nothing reaches past the list, and null when there is nothing to measure or no usable scale', () => {
    expect(odHangOf(987.1, [980, 975], 1.6)).toBe(0);
    expect(odHangOf(987.1, [], 1.6)).toBeNull();
    expect(odHangOf(987.1, [1000], 0)).toBeNull();
    expect(odHangOf(Number.NaN, [1000], 1.6)).toBeNull();
    expect(odHangOf(987.1, [Number.NaN], 1.6)).toBeNull();
  });
  it('divides by the TEXT SIZE scale too: the same screen reach is a smaller list px hang once the list is scaled up', () => {
    expect(odHangOf(1000, [1026], 1.6 * 1.3)).toBeCloseTo(12.5, 6);
  });
});

describe('aimNudge: the approved 6 % held by the room that is left', () => {
  const LIST_W = 213.75;
  it('keeps the approved 6 % where the hang is short (1600x900 and up, Chapters I and II at 4:3)', () => {
    expect(aimNudge(5, 1, LIST_W)).toBeCloseTo(0.06 * LIST_W, 6);
    expect(aimNudge(3, 1.3, LIST_W)).toBeCloseTo(0.06 * LIST_W, 6);
    expect(aimNudge(8, 1.3, LIST_W)).toBeCloseTo(21.1 / 1.3 - 8, 6); // 8.23: the growth at 130 % already takes part of the margin
  });
  it('shrinks it where the hang is long: Chapter III at 100 % leaves 21.1 - 16.25 = 4.85 grid px', () => {
    expect(aimNudge(16.25, 1, LIST_W)).toBeCloseTo(4.85, 6);
  });
  it('reaches 0, never below, once the list at rest fills the margin (Chapter III at 130 %)', () => {
    expect(aimNudge(16.25, 1.3, LIST_W)).toBe(0);
    expect(aimNudge(40, 1, LIST_W)).toBe(0);
  });
  it('the old fixed hang of 9.25 grid px is the third attempt\'s cap: 11.85 at 100 %', () => {
    expect(aimNudge(9.25, 1, LIST_W)).toBeCloseTo(11.85, 6);
  });
  it('keeps the bar inside the stage with 2 grid px of air at every hang and TEXT SIZE where the list at rest fits', () => {
    for (const ts of [1, 1.15, 1.3]) {
      for (let hang = 0; hang <= 40; hang += 0.5) {
        const rest = LIST_RIGHT_GRID + hang * ts;
        if (rest > LIMIT_GRID) continue; // the list at rest is already out: nothing the nudge can give back
        const after = LIST_RIGHT_GRID + (hang + aimNudge(hang, ts, LIST_W)) * ts;
        expect(after, `hang ${hang} at ${ts}`).toBeLessThanOrEqual(LIMIT_GRID + 1e-9);
      }
    }
  });
});

describe('publishOdHang: the measured hang goes onto the list for hud-floor.css (FFX only)', () => {
  const unit = 1.6; // the stage scale at 1024x768, TEXT SIZE 100 %

  it('publishes the widest hang of any bar or label, rounded up to 0.05 so a rounded reading never errs towards the edge', () => {
    const l = list([{ bar: 1013, label: 1009.9 }, { bar: 996.4, label: 993.2 }, { bar: 994.5, label: 991.4 }]);
    publishOdHang(l, unit);
    expect(l.style.getPropertyValue(OD_HANG_PROP)).toBe('16.25px'); // (1013 - 987.024) / 1.6 = 16.235, rounded up to 16.25
  });

  it('measures the label when it is the one reaching further (a label wider than its bar)', () => {
    const l = list([{ bar: 1000, label: 1013 }]);
    publishOdHang(l, unit);
    expect(parseFloat(l.style.getPropertyValue(OD_HANG_PROP))).toBeGreaterThanOrEqual((1013 - LIST_RIGHT_GRID * 1.6) / unit);
  });

  it('reads the TEXT SIZE scale from the list itself (the individual scale property)', () => {
    const l = list([{ bar: 1013, label: 1009.9 }]);
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
      const cs = real(el, pseudo);
      return el === l ? ({ scale: '1.3' } as unknown as CSSStyleDeclaration) : cs;
    });
    publishOdHang(l, unit);
    const at130 = parseFloat(l.style.getPropertyValue(OD_HANG_PROP));
    vi.restoreAllMocks();
    l.style.removeProperty(OD_HANG_PROP);
    publishOdHang(l, unit);
    const at100 = parseFloat(l.style.getPropertyValue(OD_HANG_PROP));
    expect(at130).toBeCloseTo(at100 / 1.3, 1);
  });

  it('writes only when the value moved (it runs every frame while aimed)', () => {
    const l = list([{ bar: 1013, label: 1009.9 }]);
    const set = vi.spyOn(l.style, 'setProperty');
    publishOdHang(l, unit);
    publishOdHang(l, unit);
    publishOdHang(l, unit);
    expect(set).toHaveBeenCalledTimes(1);
  });

  it('clears the property when there is no bar to measure, and does nothing on a list without a box', () => {
    const l = list([{ bar: 1013, label: 1009.9 }]);
    publishOdHang(l, unit);
    expect(l.style.getPropertyValue(OD_HANG_PROP)).not.toBe('');
    l.querySelector('.ffx-stat__od')!.remove();
    publishOdHang(l, unit);
    expect(l.style.getPropertyValue(OD_HANG_PROP)).toBe('');
    const bare = document.createElement('div');
    bare.className = 'ig-stat-list';
    document.body.append(bare); // jsdom: a zero box
    publishOdHang(bare, unit);
    expect(bare.style.getPropertyValue(OD_HANG_PROP)).toBe('');
  });

  it('does nothing on the phone layout (a flow layout without the nudge)', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const l = list([{ bar: 1013, label: 1009.9 }]);
    publishOdHang(l, unit);
    expect(l.style.getPropertyValue(OD_HANG_PROP)).toBe('');
  });
});

describe('wiring (FFX only)', () => {
  const read = (...p: string[]): string => readFileSync(join(SRC, ...p), 'utf8');
  it('FFXBattleHud measures before the aim class lands, and again every frame it is aimed', () => {
    const hud = read('ui', 'ffx', 'FFXBattleHud.ts');
    expect(hud).toMatch(/import \{ publishOdHang \} from '\.\/odHang\.ts';/);
    const first = hud.indexOf('publishOdHang(this.partyStatus.el, this.hudScale());');
    const toggle = hud.indexOf("this.el.classList.toggle('ffxhud--targeting-enemy'");
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(toggle);
    expect(hud).toMatch(/if \(this\.el\.classList\.contains\('ffxhud--targeting-enemy'\)\) publishOdHang\(this\.partyStatus\.el, this\.hudScale\(\)\);/);
  });
  it('FFX-2 does not import it (its list takes no aim nudge)', () => {
    expect(read('ui', 'ffx2', 'FFX2BattleHud.ts')).not.toContain('odHang');
  });
  it('hud-floor.css reads the property with the old hang as its fallback', () => {
    const css = read('ui', 'common', 'hud-floor.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toContain(`var(${OD_HANG_PROP}, 9.25px)`);
  });
});
