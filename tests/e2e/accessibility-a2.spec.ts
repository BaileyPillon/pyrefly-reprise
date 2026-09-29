/**
 * OPTIONS accessibility A2 (D-285, PR-0032; frame A2 of
 * `docs/concepts/r29-options/options.html`), on the production build:
 *
 * - the three rows are driven by real keys at 1600x900 and by real taps at
 *   390x844 (touch), and what they write is on `<html>` again after a reload,
 *   before the pause is opened (applied on the first frame);
 * - at TEXT SIZE 130 % no text in the FFX battle HUD, the pause or the dialogue
 *   card is clipped, and no two HUD panels overlap, at 1600x900, 2000x1012 and
 *   390x844 (layout probes: `scrollWidth`/`scrollHeight` against the box, and
 *   the panels' client rects).
 *
 * Game case: both for the rows and the pause (FFX Chapter I is the frame the
 * target was drawn from); the 130 % HUD layout here is FFX's (the FFX-2 HUD and
 * the pause at 130 % wait for their own frames, D-220 Q4).
 */
import { expect, test, type Page } from '@playwright/test';

import type { ChapterId } from '../../src/data/encounters.ts';
import './support/pyrefly-window.ts';

const SAVE_KEY = 'pyrefly-reprise:save:v1';

/** Put comfort settings in the save before the app boots (once per tab, so a reload keeps what the page wrote). */
async function seed(page: Page, settings: Record<string, unknown>): Promise<void> {
  await page.addInitScript(
    ({ key, settings }) => {
      if (sessionStorage.getItem('__a2_seeded')) return;
      sessionStorage.setItem('__a2_seeded', '1');
      const raw = JSON.parse(localStorage.getItem(key) || 'null') ?? { version: 1, updatedAt: 0, chapters: {}, unlocked: [], flags: {}, seenCoach: [] };
      raw.settings = { ...(raw.settings ?? {}), ...settings };
      localStorage.setItem(key, JSON.stringify(raw));
    },
    { key: SAVE_KEY, settings },
  );
}

async function boot(page: Page, settings: Record<string, unknown> = {}): Promise<void> {
  await seed(page, settings);
  await page.goto('./?coach=off');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60_000 });
}

async function toMenu(page: Page, chapter: ChapterId = 'seymour-flux'): Promise<void> {
  await page.evaluate((id) => {
    const p = window.__pyrefly!;
    p.setMuted(true);
    p.setSeed(1);
    void p.gotoChapter(id, { skipCutscenes: true });
  }, chapter);
  const ok = await page.evaluate(async () => {
    for (let i = 0; i < 3000; i++) {
      await window.__pyrefly!.frame();
      const s = document.querySelector('.ig-cmd-stack');
      if (s && s.getBoundingClientRect().height > 0) return true;
    }
    return false;
  });
  expect(ok, 'the command menu came up').toBe(true);
  await page.waitForTimeout(600);
}

const html = (page: Page) =>
  page.evaluate(() => ({
    size: document.documentElement.dataset['textSize'],
    motion: document.documentElement.hasAttribute('data-reduce-motion'),
    effects: document.documentElement.hasAttribute('data-low-effects'),
  }));
const selectedRow = (page: Page) => page.evaluate(() => document.querySelector<HTMLElement>('.pause__row--sel')?.dataset['row']);
const rowValue = (page: Page, id: string) =>
  page.evaluate((id) => document.querySelector(`.pause__row[data-row="${id}"] .pause__v`)?.textContent?.trim(), id);

/** Clipped text and overlapping panels under `root` (see the file comment). */
async function layout(page: Page, root: string, panels: string): Promise<{ clipped: string[]; overlaps: string[]; offscreen: string[] }> {
  return page.evaluate(
    ({ root, panels }) => {
      const vis = (e: Element): boolean => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
      };
      const clipped: string[] = [];
      for (const r of document.querySelectorAll(root)) {
        for (const e of [r, ...r.querySelectorAll('*')] as HTMLElement[]) {
          if (!vis(e) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())) continue;
          const cs = getComputedStyle(e);
          const flow = `${cs.overflowX} ${cs.textOverflow}`;
          if (e.scrollWidth > e.clientWidth + 1 && /hidden|clip|ellipsis/.test(flow)) clipped.push(`${e.className}: "${e.textContent?.trim().slice(0, 30)}"`);
          if (e.scrollHeight > e.clientHeight + 2 && /hidden|clip/.test(cs.overflowY) && cs.webkitLineClamp === 'none') clipped.push(`${e.className} (height): "${e.textContent?.trim().slice(0, 30)}"`);
        }
      }
      const W = innerWidth;
      const H = innerHeight;
      const rects = [...document.querySelectorAll(panels)].filter(vis).map((e) => ({ cls: String((e as HTMLElement).className).split(' ')[0]!, r: e.getBoundingClientRect() }));
      const overlaps: string[] = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]!.r;
          const b = rects[j]!.r;
          const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ix > 2 && iy > 2) overlaps.push(`${rects[i]!.cls} x ${rects[j]!.cls}`);
        }
      }
      const offscreen = rects.filter(({ r }) => r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1).map((p) => p.cls);
      return { clipped, overlaps, offscreen };
    },
    { root, panels },
  );
}

const FFX_PANELS = [
  '.ffxhud__stage > .ffx-cmd-area', '.ffxhud__stage > .ffx-cmd-info:not([hidden])', '.ffxhud__stage > .ig-ctb',
  '.ffxhud__stage > .ig-stat-list', '.ffxhud__stage > .ffx-sensor', '.sgd__stack', '.sgd__toggle',
  '[data-role="move-advisor-card"]:not([hidden])', '[data-role="move-advisor-toggle"]:not([hidden])', '.eint__panel', '.eint__toggle',
].join(', ');
const PHONE_PANELS = ['.ffxhud .ig-ctb', '.ffxhud .ig-stat', '.ffxhud .ig-cmd', '.phud-guide', '.phud-foot'].join(', ');

test.describe('the three rows, by real input', () => {
  test('keys at 1600x900: TEXT SIZE, REDUCE MOTION and LOW EFFECTS, kept across a reload', async ({ page }) => {
    await boot(page, { reduceMotion: false, lowEffects: false });
    await toMenu(page);
    expect(await html(page)).toEqual({ size: '100', motion: false, effects: false });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    for (let i = 0; i < 12; i++) {
      if ((await page.evaluate(() => document.querySelector<HTMLElement>('.pause__tab--on')?.dataset['tab'])) === 'options') break;
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(250);
    }
    expect(await page.evaluate(() => document.querySelector<HTMLElement>('.pause__tab--on')?.dataset['tab'])).toBe('options');
    const go = async (id: string): Promise<void> => {
      for (let i = 0; i < 16 && (await selectedRow(page)) !== id; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(120);
      }
      expect(await selectedRow(page)).toBe(id);
    };
    await go('textSize');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    expect(await rowValue(page, 'textSize')).toBe('115%');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    expect(await rowValue(page, 'textSize')).toBe('130%');
    await go('reduceMotion');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200); // a frame between presses: Down and Enter in one frame would confirm the next row
    await go('lowEffects');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    expect(await html(page)).toEqual({ size: '130', motion: true, effects: true });
    expect(await rowValue(page, 'reduceMotion')).toBe('ON');
    expect(await rowValue(page, 'lowEffects')).toBe('ON');

    await page.reload();
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60_000 });
    expect(await html(page), 'on <html> at boot, before any pause').toEqual({ size: '130', motion: true, effects: true });
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).settings, SAVE_KEY);
    expect(saved).toMatchObject({ textSize: 1.3, reduceMotion: true, lowEffects: true });
  });

  test.describe('taps at 390x844', () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    test('the pause chip, the OPTIONS tab and the rows answer taps; TEXT SIZE wraps back to 100 %', async ({ page }) => {
      await boot(page, { reduceMotion: false, lowEffects: false });
      await toMenu(page);
      await page.locator('.battle-pause-chip').tap();
      await page.waitForTimeout(800);
      await page.locator('.pause__tab[data-tab="options"]').tap();
      await page.waitForTimeout(600);
      const row = (id: string) => page.locator(`.pause__row[data-row="${id}"]`);
      const seen: string[] = [];
      for (let i = 0; i < 3; i++) {
        await row('textSize').scrollIntoViewIfNeeded();
        await row('textSize').tap();
        await page.waitForTimeout(200);
        seen.push((await html(page)).size ?? '');
      }
      expect(seen).toEqual(['115', '130', '100']);
      await row('lowEffects').scrollIntoViewIfNeeded();
      await row('lowEffects').tap();
      await page.waitForTimeout(200);
      expect((await html(page)).effects).toBe(true);
      await row('reduceMotion').scrollIntoViewIfNeeded();
      await row('reduceMotion').tap();
      await page.waitForTimeout(200);
      expect((await html(page)).motion).toBe(true);
    });
  });
});

for (const vp of [
  { width: 1600, height: 900 },
  { width: 2000, height: 1012 },
]) {
  test.describe(`130 % at ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: vp });
    test('the FFX HUD, the pause and the dialogue card: nothing clipped, no panels overlapping', async ({ page }) => {
      await boot(page, { textSize: 1.3 });
      await toMenu(page);
      const hud = await layout(page, '.ffxhud', FFX_PANELS);
      expect(hud.clipped, 'HUD text clipped').toEqual([]);
      expect(hud.overlaps, 'HUD panels overlapping').toEqual([]);
      expect(hud.offscreen, 'HUD panels off screen').toEqual([]);
      expect(await page.evaluate(() => document.querySelectorAll('.ig-cmd-stack .ig-cmd').length), 'four command rows').toBeLessThanOrEqual(4);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      await page.locator('.pause__tab[data-tab="options"]').click();
      await page.waitForTimeout(600);
      const pause = await layout(page, '.pause__body', '.pause__col');
      expect(pause.clipped, 'pause text clipped').toEqual([]);
      expect(pause.overlaps).toEqual([]);
      await page.keyboard.press('Escape');

      await page.evaluate(() => void window.__pyrefly!.gotoChapter('seymour-flux', { skipCutscenes: false }));
      const line = await page.evaluate(async () => {
        for (let i = 0; i < 3000; i++) {
          await window.__pyrefly!.frame();
          const d = document.querySelector('.dbox--visible .dbox__text');
          if (d && (d.textContent ?? '').trim().length > 20) return true;
        }
        return false;
      });
      expect(line, 'a dialogue line came up').toBe(true);
      await page.waitForTimeout(2500);
      const dbox = await layout(page, '.dbox, .cutscene', '.dbox__win, .chint');
      expect(dbox.clipped, 'dialogue text clipped').toEqual([]);
      const fits = await page.evaluate(() => {
        const b = document.querySelector('.dbox__body')!.getBoundingClientRect();
        const w = document.querySelector('.dbox__win')!.getBoundingClientRect();
        return b.top >= w.top - 1 && b.bottom <= w.bottom + 1;
      });
      expect(fits, 'the line stays inside the card').toBe(true);
    });
  });
}

test.describe('130 % at 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  test('the phone HUD: nothing clipped, the party card capped at 115 %', async ({ page }) => {
    await boot(page, { textSize: 1.3 });
    await toMenu(page);
    const hud = await layout(page, '.ffxhud', PHONE_PANELS);
    expect(hud.clipped, 'phone HUD text clipped').toEqual([]);
    expect(hud.offscreen).toEqual([]);
    const sizes = await page.evaluate(() => ({
      label: parseFloat(getComputedStyle(document.querySelector('.ffxhud .ffx-cmd__label')!).fontSize),
      name: parseFloat(getComputedStyle(document.querySelector('.ffxhud .ig-stat__name')!).fontSize),
    }));
    expect(sizes.label, 'command labels at 130 %').toBeCloseTo(16 * 1.3, 1);
    expect(sizes.name, 'party names capped at 115 %').toBeCloseTo(17 * 1.15, 1);
  });
});
