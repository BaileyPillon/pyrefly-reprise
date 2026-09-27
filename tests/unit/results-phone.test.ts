// @vitest-environment jsdom
/**
 * PR-0001, option B "full-bleed painting, ink sheet" (Bailey, 2026-09-26: "I'll go
 * with all of your recommendations"; target docs/concepts/phone-2026-09-26/
 * pr0001-victory-B.jpg and pr0001-defeat-B.jpg). Both games: the results screen is
 * shared plumbing, each game keeps its own accent.
 *
 * On an upright phone (the phone battle HUD's own query) the results leave the
 * 640x360 letterbox and fill the screen; every other window keeps today's page.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import type { InputSnapshot } from '../../src/app/Input.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { getChapter, type ChapterId } from '../../src/data/encounters.ts';
import { PHONE_BATTLE_QUERY } from '../../src/ui/common/phoneBattle.ts';
import { measuredPortraitIds, portraitCrop } from '../../src/ui/common/portrait.ts';
import { phoneHeroBox, RESULTS_PHONE_QUERY } from '../../src/ui/common/resultsPhone.ts';

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/results-phone.css'),
  'utf8',
);

function result(outcome: BattleResult['outcome'], patch: Partial<BattleResult> = {}): BattleResult {
  return {
    outcome, turns: 29, elapsedTicks: 500, elapsedMs: 60_000, ap: 15, exp: 6000, gil: 2000,
    drops: [{ itemId: 'phoenix-down', count: 2 }], overkilled: [], sphereLevelsGained: {},
    ...patch,
  };
}

/** A window whose `matchMedia` answers the phone query as told. */
function setPhone(on: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    matches: on && query === RESULTS_PHONE_QUERY,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

function render(chapterId: ChapterId, outcome: BattleResult['outcome'], patch: Partial<BattleResult> = {}): { root: HTMLElement; screen: ResultsScreen } {
  const save = new SaveStore(`r21-phone-${Math.random()}`, null);
  save.recordAttempt(chapterId);
  const screen = new ResultsScreen({ chapterId, result: result(outcome, patch), elapsedMs: 756_000 });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  screen.update(5); // finish the count-up
  return { root, screen };
}

function keys(...pressed: string[]): InputSnapshot {
  const left = new Set(pressed);
  return {
    actions: [],
    consume: (b: string) => left.delete(b),
  } as unknown as InputSnapshot;
}

afterEach(() => {
  document.body.innerHTML = '';
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
});

describe('PR-0001 B: which windows get the phone page', () => {
  it('is the phone battle HUD\'s own upright-phone query', () => {
    expect(RESULTS_PHONE_QUERY).toBe(PHONE_BATTLE_QUERY);
  });

  it('a desktop window keeps today\'s 640x360 letterboxed page', () => {
    setPhone(false);
    const { root } = render('ffx2-fallen-aeons', 'victory');
    expect(root.querySelector('.rres--phone')).toBeNull();
    expect(root.querySelector('.rres__ledger')).not.toBeNull();
    expect(root.querySelector('.rres__ink')).not.toBeNull();
    const stage = root.querySelector<HTMLElement>('.rres__stage')!;
    expect(stage.style.width).toBe('640px');
  });

  it('with no matchMedia at all (old test doubles) it is the desktop page', () => {
    const { root } = render('seymour-flux', 'victory');
    expect(root.querySelector('.rres--phone')).toBeNull();
  });
});

describe('PR-0001 B: the phone victory', () => {
  it('fills the screen: no 640x360 grid, the painting full-bleed with a face crop', () => {
    setPhone(true);
    const { root } = render('ffx2-fallen-aeons', 'victory');
    const el = root.querySelector<HTMLElement>('.rres--phone')!;
    expect(el).not.toBeNull();
    const stage = el.querySelector<HTMLElement>('.rres__stage')!;
    expect(stage.style.width).toBe('');
    expect(stage.style.transform).toBe('');
    const img = el.querySelector<HTMLImageElement>('.rresp__bleed img')!;
    expect(img.getAttribute('src')).toContain('portraits/yuna-x2.png');
    expect(img.dataset.faceCropManual).toBe('1');
    // Nothing from the desktop page on the phone.
    expect(el.querySelector('.rres__ledger, .rres__ink, .rres__member-detail')).toBeNull();
  });

  it('sets the spoils as ink tallies: EXP, AP, GIL, ITEMS on an FFX-2 win', () => {
    setPhone(true);
    const { root } = render('ffx2-fallen-aeons', 'victory');
    const keysShown = [...root.querySelectorAll('.rresp__tally .rresp__k')].map((k) => k.textContent);
    expect(keysShown).toEqual(['EXP', 'AP', 'GIL', 'ITEMS']);
    const values = [...root.querySelectorAll('.rresp__tally .rresp__v')].map((k) => k.textContent);
    expect(values).toEqual(['6,000', '15', '2,000', 'Phoenix Down ×2']);
    expect(root.textContent).toContain('×3 PARTY');
    expect(root.textContent).toContain('PER DRESSPHERE');
  });

  it('sets the party as chips with their gain, and drops the detail line', () => {
    setPhone(true);
    const { root } = render('ffx2-fallen-aeons', 'victory');
    const chips = [...root.querySelectorAll<HTMLElement>('.rresp__chip-member')];
    expect(chips.map((c) => c.querySelector('.rresp__name')?.textContent)).toEqual(['Yuna', 'Rikku', 'Paine']);
    for (const c of chips) expect(c.querySelector('.rresp__gain')?.textContent).toContain('+6,000');
    expect(root.textContent).not.toContain('MASTERED');
    expect(root.querySelector('.rresp__chips--n3')).not.toBeNull();
  });

  it('pins CONFIRM at the thumb, and a tap on it (data-action) or Enter continues', () => {
    setPhone(true);
    const { root, screen } = render('seymour-flux', 'victory');
    const confirm = root.querySelector<HTMLElement>('.rresp__dock [data-action="confirm"]');
    expect(confirm?.textContent).toContain('CONFIRM');
    let picked = '';
    (screen as unknown as { opts: { onChoice: (c: string) => void } }).opts.onChoice = (c) => (picked = c);
    screen.handleInput({ actions: ['confirm'], consume: () => false } as unknown as InputSnapshot);
    expect(picked).toBe('continue');
  });

  it('an FFX win prints AP, GIL, ITEMS (FFX pays no EXP)', () => {
    setPhone(true);
    const { root } = render('seymour-flux', 'victory');
    const keysShown = [...root.querySelectorAll('.rresp__tally .rresp__k')].map((k) => k.textContent);
    expect(keysShown).toEqual(['AP', 'GIL', 'ITEMS']);
    expect(root.querySelector('.rres--phone.ig--ffx2')).toBeNull();
  });
});

describe('PR-0001 B: the phone defeat', () => {
  it('lays the leader\'s fallen pose full-bleed and prints TURNS, ATTEMPTS, BEST', () => {
    setPhone(true);
    const { root } = render('seymour-omnis', 'defeat');
    const el = root.querySelector<HTMLElement>('.rres--phone.rres--defeat')!;
    expect(el).not.toBeNull();
    expect(el.querySelector('.rresp__bleed img')?.getAttribute('src')).toMatch(/characters\/tidus\/hurt\.png/);
    const keysShown = [...el.querySelectorAll('.rresp__tally .rresp__k')].map((k) => k.textContent);
    expect(keysShown).toEqual(['TURNS', 'ATTEMPTS', 'BEST']);
    expect(el.textContent).toContain('NEVER CLEARED');
  });

  it('the chips carry the Sphere Level, not a gain', () => {
    setPhone(true);
    const { root } = render('seymour-omnis', 'defeat');
    const gains = [...root.querySelectorAll('.rresp__chip-member .rresp__gain')];
    expect(gains).toHaveLength(0);
    const levels = [...root.querySelectorAll('.rresp__chip-member .rresp__lv')].map((l) => l.textContent ?? '');
    expect(levels.length).toBeGreaterThan(0);
    for (const l of levels) expect(l).toMatch(/^S\.LV \d+$/);
  });

  it('an FFX-2 loss prints each girl\'s level (LV), not a clipped dressphere name', () => {
    setPhone(true);
    const { root } = render('ffx2-fallen-aeons', 'defeat');
    const build = getChapter('ffx2-fallen-aeons')!.buildRef;
    if (build.game !== 'ffx2') throw new Error('Chapter XI is FFX-2');
    const levels = [...root.querySelectorAll('.rresp__chip-member .rresp__lv')].map((l) => l.textContent ?? '');
    expect(levels).toEqual(build.members.map((m) => `LV ${m.level}`));
  });

  it('RETRY and CHAPTER SELECT are at the thumb, and the arrow keys move the lit one', () => {
    setPhone(true);
    const { root, screen } = render('seymour-omnis', 'defeat');
    const lit = (): string => root.querySelector('.rresp__btn--lit')?.textContent?.trim() ?? '';
    expect([...root.querySelectorAll('.rresp__dock [data-action]')].map((b) => b.getAttribute('data-action')))
      .toEqual(['results:retry', 'results:chapter-select']);
    expect(lit()).toBe('RETRY');
    screen.handleInput(keys('right'));
    expect(lit()).toBe('CHAPTER SELECT');
    let picked = '';
    (screen as unknown as { opts: { onChoice: (c: string) => void } }).opts.onChoice = (c) => (picked = c);
    screen.handleInput(keys('confirm'));
    expect(picked).toBe('chapter-select');
  });
});

describe('PR-0001 B: the face-safe crop', () => {
  it('covers a 390x844 phone with every measured portrait, eyes in the upper half and on screen', () => {
    for (const id of measuredPortraitIds()) {
      const box = phoneHeroBox(id, 390, 844);
      const crop = portraitCrop(id);
      expect(box.left, id).toBeLessThanOrEqual(0.01);
      expect(box.top, id).toBeLessThanOrEqual(0.01);
      expect(box.left + box.width, id).toBeGreaterThanOrEqual(389.99);
      expect(box.top + box.height, id).toBeGreaterThanOrEqual(843.99);
      const eyeX = box.left + crop.fx * box.width;
      const eyeY = box.top + crop.fy * box.height;
      expect(eyeX, id).toBeGreaterThan(40);
      expect(eyeX, id).toBeLessThan(350);
      expect(eyeY, id).toBeGreaterThan(60);
      expect(eyeY, id).toBeLessThanOrEqual(0.42 * 844 + 0.01);
    }
  });
});

describe('PR-0001 B: results-phone.css', () => {
  it('prints nothing under 14 px', () => {
    const sizes = [...CSS.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(5);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(14);
  });

  it('makes every button at least 44 px tall', () => {
    const btn = CSS.match(/\.rresp__btn \{[^}]*\}/)?.[0] ?? '';
    const h = Number(btn.match(/height:\s*(\d+)px/)?.[1] ?? 0);
    expect(h).toBeGreaterThanOrEqual(44);
  });

  it('scopes every rule to the phone page, so no desktop size can match one', () => {
    const selectors = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((block) => block.split('{')[0]!.trim())
      .filter((sel) => sel.length > 0 && !sel.startsWith('@'));
    for (const sel of selectors) {
      for (const part of sel.split(',')) expect(part.trim(), sel).toMatch(/^\.rres--phone/);
    }
  });

  it('a defeat has no accent: no gold, no pink', () => {
    expect(CSS).toMatch(/\.rres--phone\.rres--defeat \{[^}]*--rresp-acc:\s*#f4f1e8/);
  });
});
