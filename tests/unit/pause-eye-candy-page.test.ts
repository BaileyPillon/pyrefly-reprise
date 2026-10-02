// @vitest-environment jsdom
/**
 * The EYE CANDY page (D-317: Bailey, 2026-10-02 ~01:15 EDT, "all your recommendations, godspeed", option A;
 * frames `docs/concepts/eye-candy-settings-2026-10-02/a*.jpg`). One OPTIONS row opens a page built like the
 * CREDITS panel: ALL LOOKS on top, the three looks as masters with their parts indented, one help line for
 * the focused switch. Keys go through the real `Input` (window key events), taps are DOM clicks on the
 * rows, and the pad's buttons are the snapshots it produces (Cross = confirm, Circle = cancel, Start, L1,
 * R1, the D-pad as the arrows).
 *
 * Game case: both. Run on Chapter I (FFX: OVERDRIVE SHOT, no DRESSPHERE SHOT) and Chapter IV (FFX-2: the
 * other way round).
 */
import { PerspectiveCamera } from 'three';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import type { App } from '../../src/app/App.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { EYE_CANDY_CLOSE_ACTION, EYE_CANDY_OPEN_CLASS } from '../../src/app/screens/pause/eyeCandyPage.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { FX_SWITCH_FIELDS, fxAllOnPatch } from '../../src/app/fxParts.ts';
import { eyeCandyOn } from '../../src/engine/fx/eyeCandyFlags.ts';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { fightFacts } from '../../src/engine/fx/mix/gates.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, String(v)), removeItem: (k) => void map.delete(k) };
}

function pad(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const set = new Set(pressed);
  return {
    pressed: (b) => set.has(b),
    justPressed: (b) => set.has(b),
    justReleased: () => false,
    consume: (b) => set.has(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: true,
    lastDevice: 'gamepad',
  };
}

interface Harness {
  screen: PauseScreen;
  store: SaveStore;
  input: Input;
  root: HTMLElement;
  clock: number;
  resumed: number;
  dispose(): void;
}
let live: Harness | null = null;

function mount(chapterId: string, storage = memoryStorage()): Harness {
  const chapter = getChapter(chapterId)!;
  const store = new SaveStore(`pause-ec-${chapterId}`, storage);
  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);
  const h = { store, input, root, clock: 0, resumed: 0 } as unknown as Harness;
  const screen = new PauseScreen({ chapter, chainLength: 1, onResume: () => void h.resumed++, onRestart: () => {}, onChapterSelect: () => {}, onQuitToTitle: () => {} });
  const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 100);
  screen.app = { save: store, input, screens: [screen], renderer: { camera } } as unknown as App;
  screen.root = root;
  void screen.enter();
  h.screen = screen;
  h.dispose = () => {
    screen.exit();
    input.detach();
    root.remove();
  };
  live = h;
  return h;
}

function frame(h: Harness): void {
  h.clock += 50;
  h.screen.handleInput(h.input.update(h.clock));
  h.input.endFrame();
}
function key(h: Harness, code: string): void {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
  frame(h);
  window.dispatchEvent(new window.KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
  frame(h);
}
const tap = (h: Harness, selector: string): void => {
  h.root.querySelector<HTMLElement>(selector)!.click();
  frame(h);
};
const page = (h: Harness): HTMLElement | null => h.root.querySelector('.pause__ec');
const cursor = (h: Harness): string | undefined => page(h)?.querySelector<HTMLElement>('.pause__row--sel')?.dataset['row'];
const pageRow = (h: Harness, id: string): HTMLElement => page(h)!.querySelector<HTMLElement>(`[data-row="${id}"]`)!;
const value = (h: Harness, id: string): string => (pageRow(h, id).querySelector('.pause__v')?.textContent ?? '').trim();
const listValue = (h: Harness, id: string): string =>
  (h.root.querySelector<HTMLElement>(`.pause__col[data-col="settings"] [data-row="${id}"] .pause__v`)?.textContent ?? '').trim();
const s = (h: Harness): Record<string, unknown> => h.screen.snapshot();
const head = (h: Harness): string => (page(h)?.querySelector('.pause__ec-h')?.textContent ?? '').trim();
const help = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('[data-role="ec-help-desk"] span')].map((e) => (e.textContent ?? '').trim());
/** The device's reason under the help line (empty when the focused row carries no device note). */
const why = (h: Harness): string => (h.root.querySelector('[data-role="ec-help-desk"] .pause__ec-help-d')?.textContent ?? '').trim();
/** The small note after a row's value (`CUT`, `STILL`, `OFF HERE`, `LESS HERE`) and its device limit, if any. */
const note = (h: Harness, id: string): { text: string; limit: string | null } | null => {
  const em = pageRow(h, id).querySelector('.pause__v em');
  return em ? { text: (em.textContent ?? '').replace(/^\u00b7\s*/, '').trim(), limit: em.getAttribute('data-limit') } : null;
};
/** The device as a phone held upright shows it: the phone tier and the layout flag the battle HUD sets. */
function phoneDevice(chapterId: string): void {
  eyeCandy.setTier('phone');
  document.documentElement.dataset['phoneBattle'] = chapterId === 'seymour-flux' ? 'ffx' : 'ffx2';
}
const pageIds = (h: Harness): string[] => [...page(h)!.querySelectorAll<HTMLElement>('.pause__ec-row')].map((r) => r.dataset['row'] ?? '');

/** OPTIONS by the trigger, then real keys: Down into the list, Down to EYE CANDY, Enter. */
function openByKeys(h: Harness): void {
  h.screen.trigger('pause:tab:options');
  for (let i = 0; i < 20 && s(h)['row'] !== 'eyeCandy'; i++) key(h, 'ArrowDown');
  expect(s(h)['row']).toBe('eyeCandy');
  key(h, 'Enter');
  expect(page(h)).not.toBeNull();
}
function walkTo(h: Harness, id: string): void {
  for (let i = 0; i < 14 && cursor(h) !== id; i++) key(h, 'ArrowDown');
  expect(cursor(h)).toBe(id);
}

beforeAll(async () => {
  await registerBattleContent();
});
afterEach(() => {
  live?.dispose();
  live = null;
  resetCoach();
  document.body.innerHTML = '';
  applyComfort({ reduceMotion: false, ...fxAllOnPatch() });
  eyeCandy.setTier(null);
  delete document.documentElement.dataset['phoneBattle'];
  fightFacts.colossus = null;
});

describe.each([
  ['FFX', 'seymour-flux', 'fxHero', 'fxSphere', 'OVERDRIVE SHOT', 'FFX only.'],
  ['FFX-2', 'ffx2-bahamut', 'fxSphere', 'fxHero', 'DRESSPHERE SHOT', 'FFX-2 only.'],
] as const)('the EYE CANDY page, %s', (_game, chapterId, mine, theirs, shotLabel, shotGame) => {
  it('opens by keys on ALL LOOKS with focus on it; lists ALL LOOKS and 11 switches, this game’s shot only', () => {
    const h = mount(chapterId);
    openByKeys(h);
    expect(h.root.querySelector(`.${EYE_CANDY_OPEN_CLASS} [data-role="body"]`), 'the class that hides the columns').toBeTruthy();
    expect(cursor(h)).toBe('fxAll');
    expect((document.activeElement as HTMLElement | null)?.dataset['row']).toBe('fxAll');
    const ids = pageIds(h);
    expect(ids).toHaveLength(12);
    expect(ids).toContain(mine);
    expect(ids).not.toContain(theirs);
    expect(ids.slice(0, 5)).toEqual(['fxAll', 'fxLight', 'fxDof', 'fxFog', 'fxEdges']);
    expect(pageRow(h, mine).textContent).toContain(shotLabel);
    expect(head(h)).toMatch(/^Eye candy\s*11 of 11 on$/i);
    expect(value(h, 'fxAll')).toBe('ALL ON');
    expect(s(h)['eyeCandy']).toMatchObject({ open: true, row: 'fxAll', all: 'ALL ON', count: { on: 11, of: 11 } });
  });

  it('Up and Down walk one list and wrap; the help line follows the cursor', () => {
    const h = mount(chapterId);
    openByKeys(h);
    key(h, 'ArrowUp');
    expect(cursor(h), 'Up from ALL LOOKS wraps to the last part').toBe('fxSplash');
    key(h, 'ArrowDown');
    expect(cursor(h)).toBe('fxAll');
    expect(help(h)[0]).toBe('ALL LOOKS');
    walkTo(h, mine);
    expect(help(h)).toEqual([shotLabel, expect.stringContaining('REDUCE MOTION keeps one cut.'), shotGame]);
    expect(s(h)['row'], 'the OPTIONS cursor under the page does not move').toBe('eyeCandy');
  });

  it('flips a part, a look, ALL OFF and ALL ON; the save, the count and the seam follow live', () => {
    const h = mount(chapterId);
    openByKeys(h);
    walkTo(h, 'fxFog');
    key(h, 'Enter');
    expect(h.store.settings.fxFog).toBe(false);
    expect(value(h, 'fxFog')).toBe('OFF');
    expect(eyeCandyOn('fog')).toBe(false);
    expect(head(h)).toMatch(/10 of 11 on/i);
    // A look: Left flips it too. Its parts keep their own ON and are drawn dim; they stop playing.
    walkTo(h, 'fxLiving');
    key(h, 'ArrowLeft');
    expect(h.store.settings.fxLiving).toBe(false);
    expect([h.store.settings.fxBreath, h.store.settings.fxKo]).toEqual([true, true]);
    expect(pageRow(h, 'fxBreath').classList.contains('pause__ec-row--dim')).toBe(true);
    expect(value(h, 'fxBreath')).toBe('ON');
    expect([eyeCandyOn('livingPaintings'), eyeCandyOn('breathing'), eyeCandyOn('koCollapse')]).toEqual([false, false, false]);
    // The approved FFX-2 frame's state: FOG off and LIVING PAINTINGS off read 7 OF 11.
    expect(head(h)).toMatch(/7 of 11 on/i);
    expect(value(h, 'fxAll')).toBe('MIXED');
    // ALL LOOKS: Left is ALL OFF (the three looks; each part keeps its value), Right is ALL ON (all twelve).
    key(h, 'ArrowUp');
    for (let i = 0; i < 14 && cursor(h) !== 'fxAll'; i++) key(h, 'ArrowUp');
    key(h, 'ArrowLeft');
    expect([h.store.settings.fxLight, h.store.settings.fxLiving, h.store.settings.fxSpectacle]).toEqual([false, false, false]);
    expect(h.store.settings.fxDof).toBe(true);
    expect(value(h, 'fxAll')).toBe('ALL OFF');
    expect(head(h)).toMatch(/0 of 11 on/i);
    expect(eyeCandyOn('depthOfField')).toBe(false);
    key(h, 'ArrowRight');
    expect(value(h, 'fxAll')).toBe('ALL ON');
    for (const k of ['fog', 'breathing', 'splashArt', 'cinemaLight'] as const) expect(eyeCandyOn(k), k).toBe(true);
    expect([h.store.settings.fxFog, h.store.settings.fxSphere, h.store.settings.fxHero]).toEqual([true, true, true]);
    // Confirm flips between ALL ON and not.
    key(h, 'Enter');
    expect(value(h, 'fxAll')).toBe('ALL OFF');
    key(h, 'Enter');
    expect(value(h, 'fxAll')).toBe('ALL ON');
  });

  it('a part turned off stays off when its look returns', () => {
    const h = mount(chapterId);
    openByKeys(h);
    walkTo(h, mine);
    key(h, 'Enter');
    walkTo(h, 'fxAll');
    walkTo(h, 'fxSpectacle');
    key(h, 'Enter');
    key(h, 'Enter');
    expect(h.store.settings.fxSpectacle).toBe(true);
    expect(h.store.settings[mine]).toBe(false);
    expect(eyeCandyOn('chapterFraming')).toBe(true);
    expect(eyeCandyOn(mine === 'fxHero' ? 'overdriveShot' : 'dressphereShot')).toBe(false);
  });

  it('taps: the row opens the page, a tap flips a switch and puts the cursor on it, the Esc BACK prompt goes back', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    tap(h, '.pause__col[data-col="settings"] [data-row="eyeCandy"]');
    expect(page(h)).not.toBeNull();
    tap(h, '.pause__ec [data-row="fxKo"]');
    expect(cursor(h)).toBe('fxKo');
    expect(h.store.settings.fxKo).toBe(false);
    tap(h, '.pause__ec [data-row="fxAll"]');
    expect(value(h, 'fxAll'), 'a tap on ALL LOOKS acts as Confirm: not ALL ON, so ALL ON').toBe('ALL ON');
    expect(h.store.settings.fxKo).toBe(true);
    const back = h.root.querySelector<HTMLElement>(`[data-action="${EYE_CANDY_CLOSE_ACTION}"]`)!;
    expect(back.textContent).toMatch(/Esc\s*Back/i);
    tap(h, `[data-action="${EYE_CANDY_CLOSE_ACTION}"]`);
    expect(page(h)).toBeNull();
    expect(s(h)).toMatchObject({ tab: 'options', focus: 'body', row: 'eyeCandy', eyeCandy: null });
    expect(h.resumed).toBe(0);
  });

  it('Esc, Backspace and X go back one level: the cursor and the DOM focus land on EYE CANDY, which reads the new count', () => {
    for (const code of ['Escape', 'Backspace', 'KeyX']) {
      const h = mount(chapterId);
      openByKeys(h);
      walkTo(h, 'fxDof');
      key(h, 'Enter');
      key(h, code);
      expect(page(h), code).toBeNull();
      expect(h.root.querySelector(`.${EYE_CANDY_OPEN_CLASS}`)).toBeNull();
      expect(h.resumed, `${code} in the page does not resume`).toBe(0);
      expect(s(h)).toMatchObject({ tab: 'options', focus: 'body', row: 'eyeCandy' });
      expect((document.activeElement as HTMLElement | null)?.dataset['row']).toBe('eyeCandy');
      expect(listValue(h, 'eyeCandy')).toBe('10 OF 11');
      h.dispose();
      live = null;
    }
  });

  it('the pad: Cross flips, the D-pad walks, Circle and Start go back, L1 and R1 close it and change tab', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    h.screen.handleInput(pad([], ['pause:row:eyeCandy']));
    expect(page(h)).not.toBeNull();
    h.screen.handleInput(pad(['down']));
    expect(cursor(h)).toBe('fxLight');
    h.screen.handleInput(pad(['confirm']));
    expect(h.store.settings.fxLight).toBe(false);
    h.screen.handleInput(pad(['cancel']));
    expect(page(h)).toBeNull();
    expect(s(h)['row']).toBe('eyeCandy');
    h.screen.handleInput(pad(['confirm']));
    expect(page(h), 'Confirm on the EYE CANDY row opens it again').not.toBeNull();
    h.screen.handleInput(pad(['start']));
    expect(page(h)).toBeNull();
    expect(h.resumed).toBe(0);
    h.screen.handleInput(pad(['confirm']));
    h.screen.handleInput(pad(['r1']));
    expect(page(h)).toBeNull();
    expect(s(h)['tab']).toBe('controls');
    h.screen.trigger('pause:tab:options');
    h.screen.handleInput(pad([], ['pause:row:eyeCandy']));
    h.screen.handleInput(pad(['l1']));
    expect(page(h)).toBeNull();
    expect(s(h)['tab']).toBe('guide');
  });

  it('Q and E close it and change tab; so does a tab click', () => {
    const h = mount(chapterId);
    openByKeys(h);
    key(h, 'KeyE');
    expect(page(h)).toBeNull();
    expect(s(h)['tab']).toBe('controls');
    openByKeys(h);
    key(h, 'KeyQ');
    expect(page(h)).toBeNull();
    expect(s(h)['tab']).toBe('guide');
    openByKeys(h);
    tap(h, '[data-tab="music"]');
    expect(page(h)).toBeNull();
    expect(s(h)['tab']).toBe('music');
  });

  it('the DEPTH OF FIELD and shot help lines say what the build does (they described the mockup)', () => {
    const SHOT_HELP: Record<string, string> = {
      fxHero: 'While you enter an Overdrive, the camera holds a close shot of the fighter, then cuts back. REDUCE MOTION keeps one cut.',
      fxSphere: 'On a dressphere change the camera cuts to a held close shot of the girl, then cuts back. REDUCE MOTION keeps one cut.',
    };
    const h = mount(chapterId);
    openByKeys(h);
    walkTo(h, 'fxDof');
    expect(help(h)[1]).toBe('Aims the soft focus band at your fighters, set for each chapter’s camera. Off: the scene keeps its own band.');
    walkTo(h, mine);
    expect(help(h)[1]).toBe(SHOT_HELP[mine]);
    for (const id of ['fxDof', mine]) {
      walkTo(h, id);
      expect(help(h)[1], id).not.toMatch(/full the first time|instant after|painted keys|even focus/i);
    }
  });

  it('REDUCE MOTION keeps the shot: ON · CUT, never OFF HERE, on the desktop device', () => {
    const h = mount(chapterId);
    h.store.setSettings({ reduceMotion: true });
    openByKeys(h);
    expect(note(h, mine)).toEqual({ text: 'CUT', limit: null });
    expect(pageIds(h).filter((id) => note(h, id)?.limit)).toEqual([]);
  });

  it('the device is shown, never written: a phone held upright reads OFF HERE on DEPTH OF FIELD and the shot, LESS HERE on CHAPTER FRAMING, and the help line says why', () => {
    phoneDevice(chapterId);
    const h = mount(chapterId);
    openByKeys(h);
    expect(value(h, 'fxDof')).toBe('ON· OFF HERE');
    expect(value(h, 'fxFraming')).toBe('ON· LESS HERE');
    expect(value(h, mine)).toBe('ON· OFF HERE');
    expect(note(h, mine)).toEqual({ text: 'OFF HERE', limit: 'off' });
    expect(note(h, 'fxFraming')).toEqual({ text: 'LESS HERE', limit: 'less' });
    // what the phone leaves alone reads plain ON
    for (const id of ['fxLight', 'fxFog', 'fxEdges', 'fxLiving', 'fxBreath', 'fxKo', 'fxSpectacle', 'fxSplash']) expect(value(h, id), id).toBe('ON');
    // the save, the count, the seam and the OPTIONS row never change with the device
    expect(FX_SWITCH_FIELDS.filter((f) => h.store.settings[f] !== true), 'all twelve saved switches still ON').toEqual([]);
    expect([h.store.settings.fxDof, h.store.settings.fxFraming, h.store.settings[mine]]).toEqual([true, true, true]);
    expect(head(h)).toMatch(/^Eye candy\s*11 of 11 on$/i);
    for (const k of ['depthOfField', 'chapterFraming', mine === 'fxHero' ? 'overdriveShot' : 'dressphereShot'] as const) expect(eyeCandyOn(k), k).toBe(true);
    expect(s(h)['eyeCandy']).toMatchObject({ device: { tier: 'phone', phone: true }, rows: expect.arrayContaining([{ id: 'fxDof', own: true, on: true, limit: 'off' }, { id: 'fxFraming', own: true, on: true, limit: 'less' }]) });
    // the reason closes the help body, in its own line
    expect(why(h)).toBe('');
    walkTo(h, 'fxDof');
    expect(why(h)).toBe('Off on a phone screen.');
    expect(help(h)[1]).toContain('Off: the scene keeps its own band.Off on a phone screen.');
    walkTo(h, 'fxFraming');
    expect(why(h)).toBe('On a phone held upright the bosses keep today’s size; the rest still works.');
    walkTo(h, mine);
    expect(why(h)).toBe('Off on a phone held upright: it shows a slice of the picture, so the camera stays wide.');
    walkTo(h, 'fxFog');
    expect(why(h), 'a row the device leaves alone has no reason line').toBe('');
  });

  it('a phone held upright in a fight with no colossus (Chapter I) costs CHAPTER FRAMING nothing: no note on it; the others stay', () => {
    phoneDevice(chapterId);
    fightFacts.colossus = false;
    const h = mount(chapterId);
    openByKeys(h);
    expect(value(h, 'fxFraming')).toBe('ON');
    expect(pageIds(h).filter((id) => note(h, id)?.limit)).toEqual(['fxDof', mine]);
    walkTo(h, 'fxFraming');
    expect(why(h)).toBe('');
    // with a colossus the note is there
    h.dispose();
    live = null;
    fightFacts.colossus = true;
    const again = mount(chapterId);
    openByKeys(again);
    expect(value(again, 'fxFraming')).toBe('ON· LESS HERE');
  });

  it('LOW EFFECTS reads OFF HERE on DEPTH OF FIELD and FOG and LESS HERE on SMOOTH EDGES; the shot and the framing play (no phone layout)', () => {
    eyeCandy.setTier('low');
    const h = mount(chapterId);
    openByKeys(h);
    expect([value(h, 'fxDof'), value(h, 'fxFog'), value(h, 'fxEdges')]).toEqual(['ON· OFF HERE', 'ON· OFF HERE', 'ON· LESS HERE']);
    expect([value(h, 'fxFraming'), value(h, mine), value(h, 'fxBreath'), value(h, 'fxKo'), value(h, 'fxSplash')]).toEqual(['ON', 'ON', 'ON', 'ON', 'ON']);
    walkTo(h, 'fxDof');
    expect(why(h)).toBe('Off under LOW EFFECTS.');
    walkTo(h, 'fxFog');
    expect(why(h)).toBe('Off under LOW EFFECTS.');
    walkTo(h, 'fxEdges');
    expect(why(h)).toBe('LOW EFFECTS keeps only the fringe fix, not the outline pass.');
    expect(head(h)).toMatch(/11 of 11 on/i);
  });

  it('a screen under 600 px that is not held upright (the phone tier alone) closes DEPTH OF FIELD only', () => {
    eyeCandy.setTier('phone');
    const h = mount(chapterId);
    openByKeys(h);
    expect(pageIds(h).filter((id) => note(h, id)?.limit)).toEqual(['fxDof']);
    expect(value(h, mine)).toBe('ON');
  });

  it('a part turned OFF, or whose look is OFF, shows no device note: it plays nothing anyway; and the device outranks REDUCE MOTION', () => {
    phoneDevice(chapterId);
    const h = mount(chapterId);
    h.store.setSettings({ reduceMotion: true });
    openByKeys(h);
    expect(value(h, mine), 'a shot closed here is not one cut').toBe('ON· OFF HERE');
    expect(value(h, 'fxBreath'), 'REDUCE MOTION still stills the breathing here').toBe('ON· STILL');
    walkTo(h, 'fxDof');
    key(h, 'Enter');
    expect(value(h, 'fxDof')).toBe('OFF');
    expect(why(h)).toBe('');
    walkTo(h, 'fxSpectacle');
    key(h, 'Enter');
    expect(value(h, 'fxFraming')).toBe('ON');
    expect(value(h, mine)).toBe('ON');
    expect(pageRow(h, mine).classList.contains('pause__ec-row--dim')).toBe(true);
    key(h, 'Enter');
    expect(value(h, mine), 'the look back: the note is back').toBe('ON· OFF HERE');
  });

  it('every row that carries a device note has a reason to show (phone held upright, LOW EFFECTS, both)', () => {
    for (const setup of [() => phoneDevice(chapterId), () => eyeCandy.setTier('low'), () => { phoneDevice(chapterId); eyeCandy.setTier('low'); }]) {
      setup();
      const h = mount(chapterId);
      openByKeys(h);
      const limited = pageIds(h).filter((id) => note(h, id)?.limit);
      expect(limited.length).toBeGreaterThan(0);
      for (const id of limited) {
        walkTo(h, id);
        expect(why(h).length, `${id} has a reason`).toBeGreaterThan(15);
      }
      h.dispose();
      live = null;
      eyeCandy.setTier(null);
      delete document.documentElement.dataset['phoneBattle'];
    }
  });

  it('REDUCE MOTION is shown, never written: a note in the heading and ON · STILL / ON · CUT on the parts it changes', () => {
    const h = mount(chapterId);
    h.store.setSettings({ reduceMotion: true });
    openByKeys(h);
    expect(head(h)).toMatch(/Reduce motion is on/i);
    expect(value(h, 'fxBreath')).toBe('ON· STILL');
    expect(value(h, 'fxKo')).toBe('ON· CUT');
    expect(value(h, mine)).toBe('ON· CUT');
    expect(value(h, 'fxDof')).toBe('ON');
    expect(h.store.settings.fxBreath).toBe(true);
    expect(eyeCandyOn('breathing'), 'the seam still says ON: the play site holds it still').toBe(true);
    // A part whose look is OFF shows no note: it does not play at all.
    walkTo(h, 'fxLiving');
    key(h, 'Enter');
    expect(value(h, 'fxBreath')).toBe('ON');
  });
});

describe('FF7 and the save', () => {
  it('FF7 has no EYE CANDY row, so the page cannot open', () => {
    const h = mount('ff7-guard-scorpion');
    h.screen.trigger('pause:tab:options');
    h.screen.handleInput(pad([], ['pause:row:eyeCandy']));
    expect(page(h)).toBeNull();
  });

  it('what the page writes is in the save: a remount on the same storage reads it back', () => {
    const storage = memoryStorage();
    const h = mount('seymour-flux', storage);
    openByKeys(h);
    walkTo(h, 'fxEdges');
    key(h, 'Enter');
    walkTo(h, 'fxSpectacle');
    key(h, 'Enter');
    key(h, 'Escape');
    h.dispose();
    live = null;
    const again = mount('seymour-flux', storage);
    expect([again.store.settings.fxEdges, again.store.settings.fxSpectacle, again.store.settings.fxSplash]).toEqual([false, false, true]);
    openByKeys(again);
    expect(value(again, 'fxEdges')).toBe('OFF');
    expect(pageRow(again, 'fxSplash').classList.contains('pause__ec-row--dim')).toBe(true);
    expect(head(again)).toMatch(/6 of 11 on/i);
  });
});
