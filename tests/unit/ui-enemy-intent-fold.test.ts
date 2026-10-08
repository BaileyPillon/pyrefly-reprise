// @vitest-environment jsdom
/**
 * **The room a scene leaves the enemy-intent slab above the fiends' heads (`EnemyIntentMountOptions.maxHeight`; FFX-2 Chapter VI; branch r3941-spacing).**
 *
 * The slab's body is capped at 0.3 of the frame (`MAX_HEIGHT_FRACTION`) and folds past it, its MORE row counting what is hidden. In Chapter VI the Syndicate
 * stand at their real sizes, so a tall slab held under the top bar reaches their heads (Act I's Blizzard card: 327 px at 1600x900 against heads at y 350; at
 * 1280x720 every card is clamped). A scene that hangs the slab over the highest head (`SceneStaging.intentRoof`) hands the panel the room between the top band and
 * that head, and the panel folds its body until it fits: a few grid px at a time, never under the floor, the answer standing while its room and text stand.
 *
 * jsdom has no layout engine, so the boxes the fold reads are stubbed from the body's own cap: the body's height is its natural height or its cap, whichever is
 * less, the panel is the body plus 12 grid px of padding and 9 more for the MORE row while the body is clipped, and the letterbox is 2.5.
 *
 * **Game case: FFX-2 only** (the option is only passed by `FFX2BattleHud`); the panel is shared with FFX and is as it was with the option absent.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { EnemyIntentPanel, MIN_FOLDED_BODY, type IntentView } from '../../src/ui/common/EnemyIntent.ts';

const SCALE = 2.5;
const NATURAL = 300; // the body's natural height, grid px: longer than any cap here
const CHROME = 12; // the panel's padding and border, grid px
const MORE = 9; // the MORE row, grid px, while it shows
const BASE_CAP = (900 * 0.3) / SCALE; // 108 grid px at 1600x900

function view(): IntentView {
  return {
    enemyId: 'fem-goon',
    enemyName: 'Fem-Goon',
    turnsAway: 0,
    actsNext: true,
    kind: 'action',
    moveName: 'Blizzard',
    abilityId: 'blizzard',
    description: 'Magical Ice damage to the whole party.',
    elements: ['ice'],
    statusText: [],
    estimate: { name: 'Blizzard', hits: 1, totalHarmToParty: 160, heals: false, perTarget: [{ targetId: 'yuna', targetName: 'Yuna', amount: 55, min: 52, max: 59, hpFraction: 0.05, lethal: false, hitChancePercent: null }] },
    confidence: 'scripted',
    branches: [],
    charge: null,
    counters: [],
    formNote: null,
    notes: [],
    cite: 'ffx2-leblanc-syndicate §4',
  } as IntentView;
}

const rectOf = (height: number): DOMRect => {
  const full = { x: 0, y: 0, left: 0, top: 0, right: 375, bottom: height, width: 375, height };
  return { ...full, toJSON: () => full } as DOMRect;
};
function stubRect(el: Element, rect: Partial<DOMRect>): void {
  const full = { x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, ...rect };
  el.getBoundingClientRect = () => ({ ...full, toJSON: () => full }) as DOMRect;
}

const live: EnemyIntentPanel[] = [];
afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

interface Harness {
  panel: EnemyIntentPanel;
  body: HTMLElement;
  setRoom(room: number | null): void;
  /** One frame later: the body's max-height in grid px, or 'none' while a key lifts the cap. */
  frame(): number | 'none';
}
function mount(startRoom: number | null, withOption = true): Harness {
  let room = startRoom;
  const overlay = document.createElement('div');
  document.body.appendChild(overlay);
  stubRect(overlay, { left: 0, top: 0, right: 1600, bottom: 900, width: 1600, height: 900 });
  const panel = new EnemyIntentPanel({ game: 'ffx2', readVisible: () => true, writeVisible: () => {} });
  stubRect(panel.el, { left: 0, top: 0, right: 1600, bottom: 900, width: 1600, height: 900 });
  panel.mount(overlay, { host: overlay, scale: () => SCALE, project: () => ({ x: 800, y: 700 }), avoid: () => [], ...(withOption ? { maxHeight: () => room } : {}) });
  live.push(panel);
  panel.setSource(() => view());
  const panelEl = overlay.querySelector<HTMLElement>('[data-role="enemy-intent-panel"]')!;
  const body = panelEl.querySelector<HTMLElement>('.eint__body')!;
  const more = panelEl.querySelector<HTMLElement>('.eint__more')!;
  Object.defineProperty(body, 'scrollHeight', { configurable: true, get: () => NATURAL });
  const bodyH = (): number => Math.min(NATURAL, Number.parseFloat(body.style.maxHeight) || NATURAL) * SCALE;
  body.getBoundingClientRect = () => rectOf(bodyH());
  panelEl.getBoundingClientRect = () => rectOf(bodyH() + (CHROME + (more.hidden ? 0 : MORE)) * SCALE);
  return {
    panel,
    body,
    setRoom: (r) => {
      room = r;
    },
    frame: () => {
      panel.update(0.016);
      return body.style.maxHeight === 'none' ? 'none' : Number.parseFloat(body.style.maxHeight);
    },
  };
}

describe('EnemyIntentMountOptions.maxHeight: the body folds until the panel fits the room', () => {
  it('without the option, or with a null room, the body keeps its own cap (every other chapter is as it was)', () => {
    expect(mount(null, false).frame()).toBe(BASE_CAP);
    expect(mount(null).frame()).toBe(BASE_CAP);
  });

  it('a room the panel already fits changes nothing', () => {
    // at its own cap the panel is (108 + 12 + 9) x 2.5 = 322.5 px
    expect(mount(400).frame()).toBe(BASE_CAP);
    expect(mount(322.5).frame()).toBe(BASE_CAP);
  });

  it('folds the body to a whole number of steps (4 grid px) that makes the panel fit', () => {
    const h = mount(250);
    // the body at its cap is 270 px, the panel 322.5: 72.5 px too tall; the next step down is 190 px = 76 grid px, and the panel is then 242.5 px
    expect(h.frame()).toBe(76);
    expect(((h.frame() as number) + CHROME + MORE) * SCALE).toBeLessThanOrEqual(250);
    expect(h.body.classList.contains('eint__body--clipped')).toBe(true);
  });

  it('never folds under the floor: a room the slab cannot honour leaves its shortest body', () => {
    expect(MIN_FOLDED_BODY).toBeGreaterThanOrEqual(24); // the name line, the move and a line of what it does
    expect(mount(60).frame()).toBe(MIN_FOLDED_BODY);
  });

  it('stands while the room stays within its step (the camera sways a pixel or two) and follows it when it moves', () => {
    const h = mount(250);
    expect(h.frame()).toBe(76);
    h.setRoom(252);
    expect(h.frame()).toBe(76);
    h.setRoom(248);
    expect(h.frame()).toBe(76);
    h.setRoom(262);
    expect(h.frame()).toBe(80); // a step more room, a step more body
    h.setRoom(400);
    expect(h.frame()).toBe(BASE_CAP); // room enough again: unfolded
    h.setRoom(250);
    expect(h.frame()).toBe(76);
  });

  it('a held key lifts every cap, the fold with it, and releasing it folds again', () => {
    const h = mount(250);
    expect(h.frame()).toBe(76);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
    expect(h.frame()).toBe('none');
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' }));
    expect(h.frame()).toBe(76);
  });

  it('the MORE row is on while the body is folded', () => {
    const h = mount(250);
    h.frame();
    const more = h.panel.el.querySelector<HTMLElement>('.eint__more')!;
    expect(more.hidden).toBe(false);
  });
});
