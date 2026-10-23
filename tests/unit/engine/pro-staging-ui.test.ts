// @vitest-environment jsdom
/**
 * The pro staging's DOM pieces (lane "pro-staging"; both games; Chapters I and IV only): the layer's mount and cue handling (the canvas itself is drawn in a real browser: jsdom has no 2D context), the boss card's
 * full-bleed option, the defeat card's choices and words, the results dissolve, and the switchboard's key. The plan and the presenter's cues are in `pro-staging.test.ts` and `pro-staging-presenter.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { BattleStartBanner } from '../../../src/ui/common/BattleStartBanner.ts';
import { ProStageLayer } from '../../../src/ui/common/proStage/ProStageLayer.ts';
import { playResultsDissolve } from '../../../src/ui/common/proStage/resultsDissolve.ts';
import { ProDefeatScreen } from '../../../src/app/screens/ProDefeatScreen.ts';
import { setDefeatNote } from '../../../src/engine/pro/staging/DefeatNote.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { setStagingMode, setStagingPieceOff, stagingMode } from '../../../src/engine/pro/staging/StagingSwitch.ts';
import { SWITCHES, switchOfCode } from '../../../src/app/demo/switchboardModel.ts';
import { CHANGE_OPEN_MS } from '../../../src/engine/pro/staging/OpeningPlan.ts';

beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no art server in a unit test')));
});
afterEach(() => {
  setStagingMode(null);
  setStagingPieceOff(null);
  setDemoChapter(undefined);
  setDefeatNote(null);
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

const facts = { game: 'ffx' as const, scale: 1, calm: false, tame: false };

describe('the layer', () => {
  const make = (game: 'ffx' | 'ffx2' = 'ffx') => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const rects: Record<string, { x: number; y: number; w: number; h: number }> = { tidus: { x: 100, y: 500, w: 200, h: 250 }, boss: { x: 800, y: 60, w: 400, h: 480 } };
    const layer = new ProStageLayer({ root, game, rectOf: (id) => rects[id] ?? null, pointOf: (id) => (rects[id] ? { x: rects[id]!.x + 50, y: rects[id]!.y + 100 } : null), nameOf: (id) => (id === 'boss' ? 'Seymour Flux' : 'Tidus') });
    return { root, layer };
  };

  it('mounts under the HUD (first child) and over it (last child), and removes itself', () => {
    const { root, layer } = make();
    expect(root.firstElementChild).toBe(layer.under);
    expect(root.lastElementChild).toBe(layer.top);
    expect(layer.under.dataset['game']).toBe('ffx');
    layer.dispose();
    expect(root.children).toHaveLength(0);
  });

  it('a held breath sinks the HUD (data-pst on the root, --pst-hud) from the tell, and gives it back after the lift', () => {
    const { root, layer } = make();
    layer.breath({ ...facts, kind: 'mark', move: 'total-annihilation', name: 'Total Annihilation', attacker: 'boss', party: ['tidus'] });
    layer.update(0.1);
    expect(root.dataset['pst']).toBeUndefined(); // the name and the rim only: the HUD is untouched
    layer.breath({ ...facts, kind: 'tell', move: 'total-annihilation', name: 'Total Annihilation', attacker: 'boss', party: ['tidus'], msToBlow: 1000 });
    for (let i = 0; i < 70; i++) layer.update(1 / 60);
    expect(root.dataset['pst']).toBe('');
    expect(Number(root.style.getPropertyValue('--pst-hud'))).toBeLessThan(0.3);
    layer.breath({ ...facts, kind: 'blow', move: 'total-annihilation', attacker: 'boss' });
    layer.breath({ ...facts, kind: 'lift' });
    for (let i = 0; i < 60; i++) layer.update(1 / 60);
    expect(root.dataset['pst']).toBeUndefined();
    expect(root.style.getPropertyValue('--pst-hud')).toBe('');
    expect(layer.alive).toBe(false);
  });

  it('FFX-2 (D-357, D-441): a command menu open holds the wash and the HUD sink off, one that opens mid-breath gives the HUD back, one that closes lets the breath play on', () => {
    const { root, layer } = make('ffx2');
    let menu = true;
    layer.setMenuProbe(() => menu);
    const cue = { ...facts, game: 'ffx2' as const, move: 'mega-flare' as const, name: 'Mega Flare', attacker: 'boss', party: ['tidus'] };
    layer.breath({ ...cue, kind: 'mark' });
    layer.breath({ ...cue, kind: 'tell', msToBlow: 1400, menu: true });
    for (let i = 0; i < 80; i++) layer.update(1 / 60);
    expect(Number(root.style.getPropertyValue('--pst-hud') || 1)).toBeGreaterThan(0.99); // the menu was open from the first frame: the HUD never sank
    expect(layer.snapshot().frame?.drain).toBe(0);
    menu = false;
    for (let i = 0; i < 40; i++) layer.update(1 / 60);
    expect(layer.snapshot().frame?.drain).toBeGreaterThan(0.9); // the menu closed: the breath plays on
    expect(Number(root.style.getPropertyValue('--pst-hud'))).toBeLessThan(0.3);
    menu = true; // a girl's menu opens in the middle of it
    for (let i = 0; i < 30; i++) layer.update(1 / 60);
    expect(layer.snapshot().frame?.drain).toBeLessThan(0.02);
    expect(root.dataset['pst'] === undefined || Number(root.style.getPropertyValue('--pst-hud')) > 0.98).toBe(true);
  });

  it('a probe that throws costs the check, never the frame', () => {
    const { layer } = make('ffx2');
    layer.setMenuProbe(() => {
      throw new Error('boom');
    });
    layer.breath({ ...facts, game: 'ffx2', kind: 'tell', move: 'mega-flare', name: 'X', attacker: 'boss', party: ['tidus'], msToBlow: 900 });
    expect(() => {
      for (let i = 0; i < 40; i++) layer.update(1 / 60);
    }).not.toThrow();
    expect(layer.snapshot().frame?.drain).toBeGreaterThan(0.5);
  });

  it('an Overdrive opening lights and sinks the HUD even while a marked move waits for its turn (the Total Annihilation marker stays up while the party acts)', () => {
    const { root, layer } = make();
    layer.breath({ ...facts, kind: 'mark', move: 'total-annihilation', name: 'Total Annihilation', attacker: 'boss', party: ['tidus'] });
    layer.opening({ ...facts, kind: 'overdrive', actor: 'tidus', name: 'Spiral Cut' });
    for (let i = 0; i < 30; i++) layer.update(1 / 60);
    expect(Number(root.style.getPropertyValue('--pst-hud'))).toBeLessThan(0.6);
    expect(layer.alive).toBe(true); // the marker is still there
    for (let i = 0; i < 90; i++) layer.update(1 / 60);
    expect(layer.alive).toBe(true);
    expect(root.dataset['pst']).toBeUndefined(); // the opening is over and gave the HUD back; the marker alone does not hold it
  });

  it('the pause freezes it: no update, no clock', () => {
    const { layer } = make();
    layer.breath({ ...facts, kind: 'mark', move: 'total-annihilation', name: 'X', attacker: 'boss', party: [] });
    layer.breath({ ...facts, kind: 'tell', move: 'total-annihilation', name: 'X', attacker: 'boss', party: [], msToBlow: 1000 });
    const before = layer.snapshot().clock;
    // (the screen's update is not called while the pause is up: nothing here moves the clock)
    expect(layer.snapshot().clock).toBe(before);
    layer.update(0.5);
    expect(layer.snapshot().clock).toBe(before + 500);
  });

  it('a cue never throws into the presenter, even for ids the stage does not know', () => {
    const { layer } = make();
    expect(() => {
      layer.breath({ ...facts, kind: 'tell', move: 'total-annihilation', name: 'X', attacker: 'nobody', party: ['ghost'], msToBlow: 900 });
      layer.ending({ ...facts, kind: 'freeze', boss: 'nobody', holdMs: 500 });
      layer.opening({ ...facts, kind: 'overdrive', actor: 'ghost', name: 'Y' });
      for (let i = 0; i < 90; i++) layer.update(1 / 60);
    }).not.toThrow();
  });

  it('the victory freeze takes the HUD out and the title names the foe; the fall dims the scene', () => {
    const { root, layer } = make();
    layer.ending({ ...facts, kind: 'freeze', boss: 'boss', holdMs: 520 });
    for (let i = 0; i < 20; i++) layer.update(1 / 60);
    expect(Number(root.style.getPropertyValue('--pst-hud'))).toBeLessThan(0.05);
    layer.ending({ ...facts, kind: 'title', boss: 'boss' });
    for (let i = 0; i < 60; i++) layer.update(1 / 60);
    expect(layer.top.querySelector('.pst__title-sub')?.textContent).toBe('Seymour Flux felled');
    expect(layer.top.querySelector<HTMLElement>('.pst__title')?.style.opacity).toBe('1');
    layer.clear();
    expect(layer.top.querySelector<HTMLElement>('.pst__title')?.style.opacity).toBe('0');
    layer.ending({ ...facts, kind: 'fall', party: ['tidus'] });
    for (let i = 0; i < 70; i++) layer.update(1 / 60);
    expect(Number(layer.top.querySelector<HTMLElement>('.pst__dim')?.style.opacity)).toBeGreaterThan(0.95);
    expect(Number(layer.top.querySelector<HTMLElement>('.pst__caption')?.style.opacity)).toBeGreaterThan(0.95);
  });

  it('the FFX Overdrive opening shows a small name beside the caster; the FFX-2 Change flags the root for the pearl plate and takes it away', () => {
    const { root, layer } = make();
    layer.opening({ ...facts, kind: 'overdrive', actor: 'tidus', name: 'Spiral Cut' });
    for (let i = 0; i < 40; i++) layer.update(1 / 60);
    expect(layer.top.querySelector('.pst__od-name')?.textContent).toBe('Spiral Cut');
    expect(layer.top.querySelector('.pst__od-who')?.textContent).toBe('Tidus · Overdrive');
    expect(Number(layer.top.querySelector<HTMLElement>('.pst__od')?.style.opacity)).toBeGreaterThan(0.9);
    layer.opening({ ...facts, game: 'ffx2', kind: 'change', actor: 'yuna', dress: 'gunner', gate: 'green' });
    expect(root.dataset['pstOpen']).toBe('');
    for (let i = 0; i < Math.ceil((CHANGE_OPEN_MS / 1000) * 60) + 4; i++) layer.update(1 / 60);
    expect(root.dataset['pstOpen']).toBeUndefined();
  });
});

describe('the layer canvas (a recording 2D context, jsdom has none)', () => {
  const calls: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (t, k: string) => {
      if (k in t) return t[k];
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return (): { addColorStop(): void } => (calls.push(k), { addColorStop: () => undefined });
      return (): void => void calls.push(k);
    },
    set: (t, k: string, v) => ((t[k] = v), true),
  });
  beforeEach(() => {
    calls.length = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as never);
  });
  afterEach(() => vi.restoreAllMocks());

  const draw = (game: 'ffx' | 'ffx2', move: 'total-annihilation' | 'mega-flare', t: number, lift?: number): { calls: string[]; gradients: number } => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const rects: Record<string, { x: number; y: number; w: number; h: number }> = { tidus: { x: 100, y: 500, w: 200, h: 250 }, yuna: { x: 300, y: 520, w: 180, h: 230 }, boss: { x: 800, y: 60, w: 400, h: 480 }, seymour: { x: 1000, y: 40, w: 300, h: 400 } };
    const layer = new ProStageLayer({ root, game, rectOf: (id) => rects[id] ?? null, pointOf: (id) => (rects[id] ? { x: rects[id]!.x + 50, y: rects[id]!.y + 100 } : null) });
    layer.setCompanions(['seymour']);
    calls.length = 0;
    layer.scrubBreath({ game, move, name: 'X', attacker: 'boss', party: ['tidus', 'yuna'], companions: ['seymour'], t, tellMs: 1200, ...(lift === undefined ? {} : { lift }) });
    const out = { calls: [...calls], gradients: calls.filter((c) => c === 'createRadialGradient').length };
    layer.dispose();
    return out;
  };

  it('draws nothing before the tell and clears when it is over (a marked move draws only its name and ring: DOM)', () => {
    expect(draw('ffx', 'total-annihilation', -1).gradients).toBe(0);
    expect(draw('ffx', 'total-annihilation', 3500, 900).calls).toContain('clearRect');
  });
  it('a tell cuts a window for each figure that keeps its colour (two girls, the attacker and its companion), then draws motes, the core and the rims', () => {
    const f = draw('ffx', 'total-annihilation', 1100);
    expect(f.calls).toContain('fillRect');
    expect(f.gradients).toBeGreaterThanOrEqual(4 + 2 + 20); // four pools, two rims, the motes still in flight
  });
  it('Mega Flare blow opens the flood and draws the flash in both skins, and the attacker pool closes with it', () => {
    const before = draw('ffx2', 'mega-flare', 1190);
    const blow = draw('ffx2', 'mega-flare', 1300);
    expect(blow.gradients).toBeGreaterThan(0);
    expect(blow.gradients).toBeLessThan(before.gradients + 60);
  });
});

describe('the boss card and the comfort rows', () => {
  const css = readFileSync('src/ui/common/proStage/proCard.css', 'utf8');
  it('the white blink and the push honour REDUCE FLASHES and REDUCE MOTION (the rows, not only the OS query), and the loading card does not blink', () => {
    expect(css).toContain('html[data-reduce-flashes] .bstart--pro::before');
    expect(css).toContain('html[data-reduce-motion] .bstart--pro .bstart__wash');
    expect(css.replace(/\s+/g, ' ')).toContain('.bstart--pro.bstart--loading::before { display: none; }');
  });
  it('the name is sized by the frame height as well as its width, and no text on the card, the defeat card or the staging sits under 14 px', () => {
    expect(css).toContain('font-size: clamp(40px, min(11.6vw, 14.2vh), 320px)');
    for (const f of ['proCard.css', 'proDefeat.css', 'proStage.css']) {
      const text = readFileSync(`src/ui/common/proStage/${f}`, 'utf8');
      for (const m of text.matchAll(/font-size:\s*clamp\((\d+(?:\.\d+)?)px/g)) expect(Number(m[1]), `${f}: ${m[0]}`).toBeGreaterThanOrEqual(14);
    }
  });
});

describe('the boss card', () => {
  const card = (pro: boolean): HTMLElement => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const banner = new BattleStartBanner({ root, bossName: 'Seymour Flux', subline: 'The mountain of the Ronso', chapterNumber: 1, game: 'ffx', ...(pro ? { pro: true as const } : {}) });
    void banner.show();
    return banner.el;
  };
  it('is the full-bleed painting only when asked, with the same content either way', () => {
    const today = card(false);
    const pro = card(true);
    expect(today.classList.contains('bstart--pro')).toBe(false);
    expect(pro.classList.contains('bstart--pro')).toBe(true);
    for (const el of [today, pro]) {
      expect(el.querySelector('.bstart__name')?.textContent).toBe('SeymourFlux');
      expect(el.querySelector('.bstart__subline')?.textContent).toBe('The mountain of the Ronso');
      expect(el.querySelector('.bstart__eyebrow')?.textContent).toContain('CHAPTER');
    }
  });
});

describe('the defeat card', () => {
  const boot = async (): Promise<{ screen: ProDefeatScreen; choices: string[]; press: (name: string) => void }> => {
    const choices: string[] = [];
    const screen = new ProDefeatScreen({ game: 'ffx', turns: 12, elapsedMs: 51000, attempt: 1, onChoice: (c) => choices.push(c) });
    screen.root = document.createElement('div');
    document.body.appendChild(screen.root);
    screen.enter();
    const consumed = new Set<string>();
    const press = (name: string): void => {
      consumed.clear();
      screen.handleInput({ actions: [], consume: (n: string) => n === name && !consumed.has(n) && (consumed.add(n), true), justPressed: () => false } as never);
    };
    return { screen, choices, press };
  };

  it('names the cause, the turn, the attempt and the time, and focuses TRY AGAIN', async () => {
    setDefeatNote({ cause: 'Total Annihilation' });
    const { screen } = await boot();
    expect(screen.root.querySelector('.pdf__cause')?.textContent).toBe('Felled by Total Annihilation');
    expect(screen.root.querySelector('.pdf__meta')?.textContent).toContain('Turn 12');
    expect(screen.root.querySelector('.pdf__meta')?.textContent).toContain('Attempt 1');
    expect(screen.root.querySelector('.pdf__meta')?.textContent).toContain('0:51');
    const buttons = [...screen.root.querySelectorAll('.pdf__btn')];
    expect(buttons.map((b) => b.textContent?.replace(/\s+/g, ' ').trim().toLowerCase())).toEqual([expect.stringContaining('try again'), expect.stringContaining('other fight')]);
    expect(buttons[0]!.classList.contains('is-focus')).toBe(true);
  });

  it('one confirm is TRY AGAIN; right then confirm is OTHER FIGHT; cancel is the picker; the answer is given once', async () => {
    const a = await boot();
    a.press('confirm');
    expect(a.choices).toEqual(['retry']);
    a.press('confirm');
    expect(a.choices).toEqual(['retry']);
    await expect(a.screen.done).resolves.toBeUndefined();
    const b = await boot();
    b.press('right');
    b.press('confirm');
    expect(b.choices).toEqual(['other-fight']);
    const c = await boot();
    c.press('cancel');
    expect(c.choices).toEqual(['chapter-select']);
  });

  it('a click on a button gives the old panel\'s own action words', async () => {
    const { screen, choices } = await boot();
    screen.handleInput({ actions: ['results:other-fight'], consume: () => false, justPressed: () => false } as never);
    expect(choices).toEqual(['other-fight']);
  });
});

describe('the results dissolve', () => {
  const coverOf = (tame: boolean): HTMLElement => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let el: HTMLElement | null = null;
    const append = root.appendChild.bind(root);
    root.appendChild = ((n: Node) => ((el = n as HTMLElement), append(n))) as typeof root.appendChild;
    void playResultsDissolve(root, 'ffx', undefined, tame);
    return el!;
  };
  it('REDUCE FLASHES: the cover is dim ivory at 35 percent brightness, never the near-white gradient', () => {
    expect(coverOf(false).style.background).toContain('radial-gradient');
    expect(coverOf(true).style.background).toContain('rgb(89, 84, 75)'); // flashRules.DIM_IVORY #59544B
  });
  it('covers, swaps under the cover, and is gone; with no animation support the swap still happens', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const order: string[] = [];
    await playResultsDissolve(root, 'ffx', () => order.push('cover'), true);
    expect(order).toEqual(['cover']);
    expect(root.querySelector('[data-role="results-dissolve"]')).toBeNull();
  });
});

describe('the switchboard\'s key', () => {
  it('the backslash flips the staging between pro and today, and the master key sets it with the rest', () => {
    const s = switchOfCode('Backslash')!;
    expect(SWITCHES).toContain(s);
    expect(s.name).toBe('staging');
    setStagingMode('pro');
    expect(s.isNew()).toBe(true);
    expect(s.flip!()).toBe('today');
    expect(stagingMode()).toBe('today');
    s.set!(true);
    expect(stagingMode()).toBe('pro');
  });
});
