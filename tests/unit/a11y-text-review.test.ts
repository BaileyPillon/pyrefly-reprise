// @vitest-environment jsdom
/**
 * The adversarial review of lane a11y-text (2026-10-29, `docs/handoff/a11y-text.md` "Review fixes"): what the first pass left unpinned or got wrong.
 *
 *  - minor 2: the phone's enemy-move line keeps the engine's damage RANGE (release 67 printed TIDUS 707-799; the first pass printed only the point figure) and falls back to the point figure when the range does not fit.
 *  - minor 3: FFX-2's phone line has no status chip (rule 14: only FFX's body ever carried one), at every text size.
 *  - minor 4: the target flag's plate width reaches the dock through `TargetCursor.dockFor` (a mutation that dropped the call survived all 153 target-cursor tests).
 *  - minor 10 and 11: a face that arrives after the first fit fits the phone line again; two names that start alike do not read the same on the narrow rung.
 * The desktop-layout fixes (the guide over the hero and the cue, the tip against the turn strip) are in `a11y-text-f1.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { proRing, proRingBox } from '../../src/ui/common/proMarkers.ts';
import { EnemyIntentPanel, type IntentTargetView, type IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { ROW2_RUNGS, attachPhoneFit, fitPhoneLine, phoneBodyHtml, phoneDensityOf, phoneFigures, shortNames } from '../../src/ui/common/enemy-intent-phone.ts';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';
import { lastDecl, leafRules, readSource } from './helpers/cssEval.ts';

const target = (name: string, amount: number, min = amount, max = amount, lethal = false): IntentTargetView =>
  ({ targetId: name.toLowerCase(), targetName: name, amount, min, max, hpFraction: lethal ? 1 : 0.3, lethal, hitChancePercent: null }) as IntentTargetView;

function view(rows: IntentTargetView[] = [target('Tidus', 753, 707, 799), target('Yuna', 794, 746, 842), target('Kimahri', 743, 698, 788)], over: Partial<IntentView> = {}): IntentView {
  return {
    enemyId: 'seymour', enemyName: 'Seymour Flux', turnsAway: 0, actsNext: true, kind: 'action', moveName: 'Lance of Atrophy', abilityId: 'lance-of-atrophy', description: 'x', elements: [],
    statusText: ['Zombie 99%'], estimate: null, randomTarget: { perHit: false, hits: 1, rows }, confidence: 'scripted', branches: [], charge: null, counters: [], formNote: null, notes: [], cite: 'x', ...over,
  } as IntentView;
}
const text = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const phoneBody = (v: IntentView): HTMLElement => {
  const el = document.createElement('div');
  el.className = 'eint__body';
  el.innerHTML = phoneBodyHtml(v, '<span class="eint__conf eint__conf--scripted">Scripted</span>', '', 'Lance of Atrophy');
  document.body.append(el);
  return el;
};

beforeEach(() => {
  document.body.innerHTML = '';
});
afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-phone-battle');
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
});

describe('minor 2: the range stays on the phone line until the point figure is all that fits', () => {
  it('a damage or heal figure with a range carries it (707–799, +80–120); a point figure, a lethal one (KO) and a status-only candidate carry none', () => {
    const f = phoneFigures(view([target('Tidus', 753, 707, 799), target('Yuna', 172, 172, 172), target('Rikku', -100, 80, 120), target('Auron', 400, 380, 420, true)]));
    expect(f.rows.map((r) => [r.name, r.amount, r.band])).toEqual([['Tidus', '753', '707–799'], ['Yuna', '172', ''], ['Rikku', '+100', '+80–120'], ['Auron', 'KO', '']]);
    const names = phoneFigures(view([target('Tidus', 0, 0, 5), target('Yuna', 0)]));
    expect(names.rows.map((r) => [r.kind, r.band])).toEqual([['candidate', ''], ['candidate', '']]);
  });

  it('the markup holds both the range and the point figure on a ranged figure (the sheet draws one), and only the point figure on the others', () => {
    const b = phoneBody(view([target('Tidus', 753, 707, 799), target('Yuna', 172)]));
    const [ranged, plain] = [...b.querySelectorAll('.eint__fig')];
    expect(ranged!.classList.contains('eint__fig--ranged')).toBe(true);
    expect([text(ranged!.querySelector('.eint__fb')), text(ranged!.querySelector('.eint__fa'))]).toEqual(['707–799', '753']);
    expect(plain!.classList.contains('eint__fig--ranged')).toBe(false);
    expect(plain!.querySelector('.eint__fb')).toBeNull();
    expect(text(plain!.querySelector('.eint__fa'))).toBe('172');
  });

  it('the point rung comes after the short names and before the count: ROW2_RUNGS is p-sh, p-pt, p-sm, p-el2', () => {
    expect(ROW2_RUNGS).toEqual(['p-sh', 'p-pt', 'p-sm', 'p-el2']);
  });

  it('p-pt is spent only when a figure has a range; a line of point figures goes straight from the short names to the count', () => {
    const over = (): ((row: HTMLElement) => boolean) => (row) => row.classList.contains('eint__r2');
    const ranged = fitPhoneLine(phoneBody(view()), over());
    expect(ranged.filter((c) => ROW2_RUNGS.includes(c))).toEqual(['p-sh', 'p-pt', 'p-sm', 'p-el2']);
    const points = fitPhoneLine(phoneBody(view([target('Tidus', 753), target('Yuna', 794)])), over());
    expect(points.filter((c) => ROW2_RUNGS.includes(c))).toEqual(['p-sh', 'p-sm', 'p-el2']);
  });

  it('the sheet draws the range by default, the point figure under p-pt, and the heal range in the heal colour', () => {
    const sheet = leafRules(readSource('src/ui/common/phone-enemy-line.css'));
    const P = 'html[data-phone-battle]';
    expect(lastDecl(sheet, `${P} .eint__fig--ranged .eint__fa`, 'display')).toBe('none');
    expect(lastDecl(sheet, `${P} .eint__phone.p-pt .eint__fig--ranged .eint__fb`, 'display')).toBe('none');
    expect(lastDecl(sheet, `${P} .eint__phone.p-pt .eint__fig--ranged .eint__fa`, 'display')).toBe('inline');
    expect(lastDecl(sheet, `${P} .eint__fig--heal .eint__fb`, 'color')).toBeDefined();
    expect(lastDecl(sheet, `${P} .eint__fb`, 'font-weight')).toBe('700');
  });
});

describe('minor 3: FFX-2 has no status chip on the phone line, at any text size; FFX keeps its chip', () => {
  function bodyOf(game: 'ffx' | 'ffx2', density: 'full' | 'brief'): HTMLElement {
    document.documentElement.setAttribute('data-phone-battle', game);
    const overlay = document.createElement('div');
    document.body.appendChild(overlay);
    const panel = new EnemyIntentPanel({ game, readVisible: () => true, writeVisible: () => {} });
    // FFX-2 mounts at 'full', and at 'brief' at TEXT SIZE 115 / 130 (`density` is a live rule there)
    panel.mount(overlay, { host: overlay, scale: () => 1, project: () => ({ x: 100, y: 100 }), avoid: () => [], density: () => density });
    panel.setSource(() => view());
    return overlay.querySelector<HTMLElement>('.eint__body')!;
  }

  it('Chapter I (FFX): the chip is in row 1', () => {
    expect(text(bodyOf('ffx', 'brief').querySelector('.eint__r1 .eint__status-chip'))).toBe('Zombie 99%');
  });

  it('Chapter IV (FFX-2): no chip at 100 (full) and none at 115 / 130 (brief); the rest of the line is the same', () => {
    for (const d of ['full', 'brief'] as const) {
      document.body.innerHTML = '';
      const b = bodyOf('ffx2', d);
      expect(b.querySelector('.eint__phone'), d).not.toBeNull();
      expect(b.querySelector('.eint__status-chip'), d).toBeNull();
      expect(text(b.querySelector('.eint__r1 .eint__label'))).toBe('Lance of Atrophy');
      expect(b.querySelectorAll('.eint__fig').length).toBe(3);
    }
  });

  it("the density off the phone is the mount's own, whatever the game", () => {
    expect(phoneDensityOf('full', 'ffx2')).toBe('full');
    expect(phoneDensityOf('brief', 'ffx')).toBe('brief');
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    expect([phoneDensityOf('brief', 'ffx'), phoneDensityOf('full', 'ffx2'), phoneDensityOf('brief', 'ffx2')]).toEqual(['phone-brief', 'phone', 'phone']);
  });
});

describe('minor 4: the flag\'s damage line reaches the dock (TargetCursor.dockFor -> plateWidth -> dockPlate)', () => {
  const BOSS = { x: 900, y: 120, w: 520, h: 700 };
  const ENTRY: TargetEntry = { id: 'seymour', name: 'Seymour Flux', kind: 'enemy' };
  const HELP = 'Physical damage to one enemy. Never misses.';

  function ring(): { x: number; y: number; w: number; h: number } {
    return proRingBox(proRing(BOSS, 1440));
  }
  function plateSide(help: string): string {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2560 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1440 });
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const c = new TargetCursor();
    c.setChrome('ffx2');
    c.setProjector(() => BOSS);
    // a panel 330 px right of the ring: a 250 px plate (the name row alone) clears it, a 460 px plate (the 29-glyph damage line at 19 px) does not
    const r = ring();
    c.setPanels([{ x: r.x + r.w + 6 + 330, y: r.y + r.h / 2 - 60, w: 80, h: 120 }]);
    c.setHelpLine(help);
    document.body.append(c.el);
    c.showSingle([ENTRY]);
    return c.el.querySelector<HTMLElement>('.ffx-target__plate')!.className;
  }

  it('without a damage line the plate stays beside the ring (right); with the long line it is counted at its width and the dock leaves that side', () => {
    expect(plateSide('')).toContain('ffx-target__plate--right');
    document.body.innerHTML = '';
    expect(plateSide(HELP)).not.toContain('ffx-target__plate--right');
  });
});

describe('minor 11: short names on the narrow rung', () => {
  it('names that start alike are told apart: initials, then the last three characters; unique names keep their first three letters', () => {
    expect(shortNames(['Tidus', 'Yuna', 'Kimahri'])).toEqual(['Tid', 'Yun', 'Kim']);
    expect(shortNames(['Yu Pagoda A', 'Yu Pagoda B'])).toEqual(['YPA', 'YPB']);
    expect(shortNames(['Auron', 'Aurochs'])).toEqual(['ron', 'chs']); // one word each, same initial: the last three characters
    expect(new Set(shortNames(['Sin Fin', 'Sin Fan', 'Sin Fun'])).size).toBe(3);
  });

  it('the figures carry the told-apart names, and a name with a space in its third place is not left with a trailing blank', () => {
    const f = phoneFigures(view([target('Yu Pagoda A', 300), target('Yu Pagoda B', 310), target('Yuna', 280)]));
    expect(f.rows.map((r) => r.short)).toEqual(['YPA', 'YPB', 'Yun']);
    expect(shortNames(['Yu Madhi'])).toEqual(['Yu']);
  });
});

describe('minor 10: a face that arrives after the first fit fits the line again', () => {
  const widthOf = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
  const clientOf = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  afterEach(() => {
    if (widthOf) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', widthOf);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)['scrollWidth'];
    if (clientOf) Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientOf);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)['clientWidth'];
    delete (document as unknown as Record<string, unknown>)['fonts'];
  });

  it('while the faces are loading, the fit is run once more when they have arrived (the wider face makes a row overflow with no rewrite and no resize)', async () => {
    let perChar = 10;
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get(this: HTMLElement) { return this.classList.contains('eint__r1') ? (this.textContent ?? '').length * perChar : 0; } }); // row 1 only: row 2 holds every rung's alternative in the markup
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get(this: HTMLElement) { return this.classList.contains('eint__r1') ? 700 : 0; } });
    let arrive: () => void = () => {};
    const ready = new Promise<void>((r) => { arrive = r; });
    Object.defineProperty(document, 'fonts', { configurable: true, value: { status: 'loading', ready } });
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    const body = document.createElement('div');
    body.className = 'eint__body';
    document.body.append(body);
    attachPhoneFit(body);
    body.innerHTML = phoneBodyHtml(view(), '<span class="eint__conf eint__conf--scripted">Scripted</span>', '', 'Lance of Atrophy');
    await new Promise((r) => setTimeout(r, 0));
    const wrap = body.querySelector('.eint__phone')!;
    expect([...wrap.classList].filter((c) => c.startsWith('p-'))).toEqual([]); // fits in the fallback face
    perChar = 40; // the real face is wider
    arrive();
    await ready;
    await new Promise((r) => setTimeout(r, 0));
    expect([...wrap.classList].filter((c) => c.startsWith('p-')).length).toBeGreaterThan(0);
  });
});
