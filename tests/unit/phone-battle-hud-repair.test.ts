// @vitest-environment jsdom
/**
 * The phone battle HUD (option B, Bailey 2026-09-25), the repair pass after
 * the verifier's round (game case: both; `phone-battle-hud.test.ts` has the
 * first build's tests):
 *
 *  - an ALL-target command (Pray, Mega-Potion, a -ga spell) now opens the
 *    target step on the phone: its brackets carry no `data-target-id`, so the
 *    readers missed it and a touch player had no Confirm;
 *  - the field slides so the acting figure and the party stay whole, and
 *    while aiming so the aimed figure does, carrying the drawn brackets with it
 *    (`phoneFraming.ts`; Chapter V's Yuna stood wholly off the frame);
 *  - the enemy-move line hangs under the rail however tall it grows;
 *  - FFX's paged command window steps by a finger drag;
 *  - the stylesheets cover the texts found under 14 px (the FFX-2 chain
 *    label, Chapter VII's tag, the battle-start skip line) and hide the
 *    clipped "ALL ALLIES" label the card now names.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installPhoneBattle, readGroup, targetHint, withPhoneLayout, type PhoneBattleText } from '../../src/ui/common/phoneBattle.ts';
import { bestLeft, createPhoneField, frameScore, framedIds, FRAME_WEIGHTS } from '../../src/ui/common/phoneFraming.ts';
import { readFfxPhone } from '../../src/ui/ffx/phoneHud.ts';
import { readFfx2Phone } from '../../src/ui/ffx2/phoneHud.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import type { BattleState } from '../../src/battle/common/types.ts';

let mqMatches = true;
beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  delete document.documentElement.dataset['phoneBattle'];
  mqMatches = true;
  Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
  (window as unknown as { matchMedia: unknown }).matchMedia = (media: string) => ({
    media,
    get matches() { return mqMatches; },
    addEventListener() {},
    removeEventListener() {},
  });
});
afterEach(() => {
  delete document.documentElement.dataset['phoneBattle'];
  document.documentElement.removeAttribute('style');
});

const TEXT: PhoneBattleText = {
  actor: 'Yuna', help: 'Restores HP to the party', command: 'Pray', target: 'All allies',
  targetHp: '', targetFace: '', targeting: true, ally: true, sensor: false, group: true,
};

function hudRoot(cls: string): HTMLElement {
  const hud = document.createElement('div');
  hud.className = cls;
  document.body.appendChild(hud);
  return hud;
}

function box(el: Element, r: { left: number; top?: number; width: number; height: number }): void {
  const top = r.top ?? 0;
  el.getBoundingClientRect = () => ({ left: r.left, top, width: r.width, height: r.height, right: r.left + r.width, bottom: top + r.height, x: r.left, y: top, toJSON() {} }) as DOMRect;
}

const GROUP_DOM = `
  <div class="ffx-targeting">
    <div class="ffx-target ffx-target--ally ffx-target--group"></div>
    <div class="ffx-target ffx-target--ally ffx-target--group"></div>
    <div class="ffx-target__all ffx-target__all--ally"><span>ALL ALLIES</span></div>
  </div>`;

describe('group aims (ALL ALLIES / ALL ENEMIES)', () => {
  it('readGroup finds a group aim by its brackets, which carry no data-target-id', () => {
    const hud = hudRoot('ffxhud');
    expect(readGroup(hud).on).toBe(false);
    hud.innerHTML = GROUP_DOM;
    expect(readGroup(hud)).toEqual({ on: true, ally: true, name: 'All allies' });
    hud.innerHTML = '<div class="ffx-targeting"><div class="ffx-target ffx-target--enemy ffx-target--group"></div></div>';
    expect(readGroup(hud)).toEqual({ on: true, ally: false, name: 'All enemies' });
  });

  it('both readers put a group aim in the target step (FFX Mega-Potion, FFX-2 Pray)', () => {
    const ffx = hudRoot('ffxhud');
    ffx.innerHTML = `<div class="ffx-cmd-area"><div class="ig-cmd ig-cmd--selected"><span class="ffx-cmd__label">Mega-Potion</span></div></div>${GROUP_DOM}`;
    expect(readFfxPhone(ffx)).toMatchObject({ targeting: true, group: true, ally: true, target: 'All allies', command: 'Mega-Potion', sensor: false });
    const x2 = hudRoot('ffx2hud');
    x2.innerHTML = `<div class="ffx2hud__command"><div class="ig-cmd ig-cmd--selected"><span class="ffx2cmd__label">Pray</span></div></div>${GROUP_DOM}`;
    expect(readFfx2Phone(x2)).toMatchObject({ targeting: true, group: true, ally: true, target: 'All allies', command: 'Pray' });
  });

  it('the step comes up with a card, a group hint and a Confirm that sends Enter; no swipe', () => {
    const hud = hudRoot('ffx2hud');
    const seen: string[] = [];
    window.addEventListener('keydown', (e) => seen.push(e.code));
    const pb = installPhoneBattle(hud, 'ffx2', () => TEXT);
    expect(hud.dataset['phoneStep']).toBe('target');
    expect(hud.dataset['phoneGroup']).toBe('on');
    expect(hud.querySelector('.phud-card__name')?.textContent).toBe('All allies');
    expect(hud.querySelector('.phud-target__hint')?.textContent).toBe('All three girls at once · Confirm or Back');
    expect(hud.querySelector('.phud-target__go')?.textContent).toBe('Pray → All allies');
    const start = new Event('touchstart');
    Object.defineProperty(start, 'touches', { value: [{ clientX: 300, clientY: 200 }] });
    const end = new Event('touchend');
    Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 150, clientY: 200 }] });
    window.dispatchEvent(start);
    window.dispatchEvent(end);
    expect(seen).toEqual([]);
    hud.querySelector<HTMLButtonElement>('.phud-target__go')!.click();
    expect(seen).toEqual(['Enter']);
    pb.destroy();
  });

  it('the group hint is game-aware (rule 14): "girls" in FFX-2, "party" in FFX', () => {
    expect(targetHint('ffx', true, true)).toBe('The whole party at once · Confirm or Back');
    expect(targetHint('ffx2', false, true)).toBe('Every enemy at once · Confirm or Back');
  });
});

describe('the field slide', () => {
  // Chapter V at 390x844, measured: the canvas is 924 wide, Yuna stood at -100.
  const ch5 = {
    view: 390,
    canvas: 924,
    home: -220,
    figures: [
      { x: 120, w: 103, weight: FRAME_WEIGHTS.actor },
      { x: 233, w: 111, weight: FRAME_WEIGHTS.party },
      { x: 360, w: 72, weight: FRAME_WEIGHTS.party },
      { x: 325, w: 363, weight: FRAME_WEIGHTS.boss },
    ],
  };

  it('keeps the acting girl and the party whole where the home slide cut Yuna off', () => {
    const left = bestLeft(ch5);
    for (const f of ch5.figures.slice(0, 3)) {
      expect(f.x + left).toBeGreaterThanOrEqual(0);
      expect(f.x + f.w + left).toBeLessThanOrEqual(390);
    }
    expect(frameScore(ch5, left)).toBeGreaterThan(frameScore(ch5, ch5.home));
  });

  it('stays home when nothing is gained, and never leaves the canvas', () => {
    const fits = { view: 360, canvas: 811, home: -225, figures: [{ x: 300, w: 60, weight: 6 }, { x: 420, w: 100, weight: 6 }] };
    expect(bestLeft(fits)).toBe(-225);
    const edge = { view: 360, canvas: 811, home: -225, figures: [{ x: 5, w: 40, weight: 10 }] };
    expect(bestLeft(edge)).toBe(0);
  });

  it('while aiming, the aimed figure comes first', () => {
    const aim = { ...ch5, figures: [...ch5.figures.slice(0, 3), { ...ch5.figures[3]!, weight: FRAME_WEIGHTS.focus }] };
    const left = bestLeft(aim);
    expect(325 + left).toBeGreaterThanOrEqual(0);
    expect(325 + 363 + left).toBeLessThanOrEqual(390);
  });

  it('an aeon stands in for the party, and a fallen enemy is left out', () => {
    const state = {
      activeIds: ['tidus', 'yuna', 'auron'],
      enemyIds: ['boss', 'gone'],
      aeonId: null,
      combatants: { boss: { hp: 10 }, gone: { hp: 0 } },
    } as unknown as BattleState;
    expect(framedIds(state, 'yuna')).toEqual([['tidus', 6], ['yuna', 10], ['auron', 6], ['boss', 1]]);
    expect(framedIds({ ...state, aeonId: 'valefor' }, 'valefor').map(([id]) => id)).toEqual(['valefor', 'boss']);
  });

  it('writes --phud-left, glides with a menu up, jumps while aiming and carries the brackets', async () => {
    const game = document.createElement('div');
    game.id = 'game';
    document.body.appendChild(game);
    box(game, { left: -267, width: 924, height: 520 });
    const layer = document.createElement('div');
    layer.className = 'ffx-targeting';
    document.body.appendChild(layer);
    const field = createPhoneField();
    field.setState({ activeIds: ['yuna'], enemyIds: ['tail'], aeonId: null, combatants: { tail: { hp: 5 } } } as unknown as BattleState);
    field.setActor('yuna');
    const rects: Record<string, { x: number; y: number; w: number; h: number }> = {
      yuna: { x: -147, y: 260, w: 103, h: 189 },
      tail: { x: 58, y: 74, w: 363, h: 257 },
    };
    field.setRects((id) => rects[id] ?? null);
    field.frame(0.93);
    const style = document.documentElement.style;
    const left = parseFloat(style.getPropertyValue('--phud-left'));
    expect(-147 + 267 + left).toBeGreaterThanOrEqual(0);
    expect(style.getPropertyValue('--phud-pan-time')).toBe('0.35s');
    // Aim at the tail: the slide jumps, and the bracket layer moves with it.
    box(game, { left, width: 924, height: 520 });
    field.frame(0.93, ['tail']);
    const aimLeft = parseFloat(style.getPropertyValue('--phud-left'));
    expect(style.getPropertyValue('--phud-pan-time')).toBe('0s');
    expect(58 - left + aimLeft + 363).toBeLessThanOrEqual(390);
    expect(layer.style.transform).toBe(`translateX(${aimLeft - left}px)`);
    // The cursor redraws against the new canvas: the layer goes back.
    layer.innerHTML = '<div class="ffx-target"></div>';
    await Promise.resolve();
    expect(layer.style.transform).toBe('');
    field.reset();
    expect(style.getPropertyValue('--phud-left')).toBe('');
  });

  it('withPhoneLayout feeds the field from the HUD port and resets it when the HUD hides', () => {
    const game = document.createElement('div');
    game.id = 'game';
    document.body.appendChild(game);
    box(game, { left: -267, width: 924, height: 520 });
    const root = document.createElement('div');
    document.body.appendChild(root);
    let synced = 0;
    const port = {
      mount(r: HTMLElement) {
        const el = document.createElement('div');
        el.dataset['role'] = 'ffx2-hud';
        el.className = 'ffx2hud';
        el.innerHTML = '<div class="ig-cmd"></div>';
        r.appendChild(el);
      },
      unmount() { root.innerHTML = ''; },
      sync() { synced++; },
      chooseCommand: () => new Promise(() => {}),
      setVisible() {},
      setTargetingPort() {},
    } as unknown as HudPort;
    const wrapped = withPhoneLayout(port, (el, field) => installPhoneBattle(el, 'ffx2', () => ({ ...TEXT, targeting: false, group: false }), { field }));
    wrapped.setTargetingPort!({ rect: (id: string) => (id === 'yuna' ? { x: -147, y: 0, w: 103, h: 10 } : null) } as never);
    wrapped.sync({ activeIds: ['yuna'], enemyIds: [], aeonId: null, combatants: {} } as unknown as BattleState, [] as never);
    void wrapped.chooseCommand('yuna', [], () => []);
    wrapped.mount(root);
    expect(synced).toBe(1);
    expect(document.documentElement.style.getPropertyValue('--phud-left')).not.toBe('');
    wrapped.setVisible(false);
    expect(document.documentElement.style.getPropertyValue('--phud-left')).toBe('');
    wrapped.unmount();
  });
});

describe('the rail and the list', () => {
  it('the enemy-move line hangs under the rail, however many gauges it holds', () => {
    const hud = hudRoot('ffx2hud');
    hud.innerHTML = '<div class="ffx2hud__enemies"></div><div class="eint"><div class="eint__panel"></div></div>';
    box(hud.querySelector('.ffx2hud__enemies')!, { left: 10, top: 10, width: 300, height: 140 });
    box(hud.querySelector('.eint__panel')!, { left: 10, top: 152, width: 300, height: 48 });
    const pb = installPhoneBattle(hud, 'ffx2', () => ({ ...TEXT, targeting: false, group: false }));
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--phud-rail-bottom')).toBe('150px');
    expect(style.getPropertyValue('--phud-line-bottom')).toBe('200px');
    pb.destroy();
    expect(style.getPropertyValue('--phud-rail-bottom')).toBe('');
  });

  it('a finger dragged up FFX\'s paged command window steps the cursor a row (two tiles)', () => {
    const hud = hudRoot('ffxhud');
    hud.innerHTML = '<div class="ffx-cmd-area"><div class="ig-cmd"></div></div>';
    const seen: string[] = [];
    window.addEventListener('keydown', (e) => seen.push(e.code));
    const pb = installPhoneBattle(hud, 'ffx', () => ({ ...TEXT, targeting: false, group: false }), { dragList: '.ffx-cmd-area' });
    const touch = (type: string, y: number): void => {
      const e = new Event(type);
      Object.defineProperty(e, type === 'touchend' ? 'changedTouches' : 'touches', { value: [{ clientX: 100, clientY: y }] });
      if (type === 'touchstart') Object.defineProperty(e, 'target', { value: hud.querySelector('.ig-cmd') });
      window.dispatchEvent(e);
    };
    touch('touchstart', 700);
    touch('touchmove', 680);
    expect(seen).toEqual([]);
    touch('touchmove', 650);
    expect(seen).toEqual(['ArrowDown', 'ArrowDown']);
    touch('touchmove', 700);
    expect(seen).toEqual(['ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp']);
    touch('touchend', 700);
    pb.destroy();
  });
});

describe('the stylesheets (CHK-003 and the group label)', () => {
  const read = (f: string): string => readFileSync(join(process.cwd(), f), 'utf8');
  it('lift the texts found under 14 px on the phone', () => {
    expect(read('src/ui/ffx2/phone-hud.css')).toMatch(/\.ffx2chain__label \{\s*font-size: 14px;/);
    expect(read('src/ui/ffx/phone-hud-parts.css')).toMatch(/\.mac-tag:not\(\.mac-tag--gold\) \.mac-tag__plate \{\s*font-size: 14px;/);
    expect(read('src/ui/common/phone-battle-parts.css')).toMatch(/\.bstart__skip \{\s*font-size: 14px;/);
  });
  it('hide the clipped ALL ALLIES label (the card names the group) and slide the canvas', () => {
    expect(read('src/ui/common/phone-battle-parts.css')).toMatch(/html\[data-phone-battle\] \.ffx-target__all \{\s*display: none !important;/);
    expect(read('src/ui/common/phone-battle.css')).toMatch(/left: var\(--phud-left,/);
  });
});

describe('the field plate note', () => {
  it('("already Hasted", 11 px on the desktop plate) is 14 px on the phone', () => {
    const css = readFileSync(join(process.cwd(), 'src/ui/common/phone-battle-parts.css'), 'utf8');
    expect(css).toMatch(/html\[data-phone-battle\] \.ffx-target__note \{\s*font-size: 14px;/);
  });
});
