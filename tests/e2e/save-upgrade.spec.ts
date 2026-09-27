/**
 * CHK-024, the upgrade matrix in a real browser (PR-0195, round 13; its unit half
 * is `tests/unit/save-upgrade-fixture.test.ts`).
 *
 * A save written by the previous live build (release 20,
 * `tests/fixtures/saves/release-20.json`, exported from that build's own
 * SaveStore) is put into localStorage BEFORE the page boots, then this build is
 * booted and driven with real keys: the board must show every clear with its
 * ribbon and best time, and the pause OPTIONS of an FFX-2 chapter must show the
 * saved volumes, text speed and ATB mode. A truncated blob must boot to a fresh
 * save with no console error.
 *
 * Both games: shared plumbing (`src/app/SaveData.ts`); the fixture has FFX and
 * FFX-2 clears, and X-2 BATTLE / ATB SPEED are FFX-2-only rows (rule 14).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

interface Fixture {
  localStorage: Record<string, string>;
  expect: { cleared: string[]; notCleared: string[]; bestTimeMs: Record<string, number> };
}

const fixture = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'saves', 'release-20.json'), 'utf8'),
) as Fixture;
const KEY = 'pyrefly-reprise:save:v1';

/** Seed localStorage once, before the app's first script runs (a later reload keeps what the app wrote). */
async function injectBeforeBoot(page: Page, items: Record<string, string>): Promise<void> {
  await page.addInitScript((seed: Record<string, string>) => {
    try {
      if (sessionStorage.getItem('chk024-seeded')) return;
      localStorage.clear();
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
      sessionStorage.setItem('chk024-seeded', '1');
    } catch {
      /* storage blocked: the test's own assertions will say so */
    }
  }, items);
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

const screen = (page: Page): Promise<string | null> => page.evaluate(() => window.__pyrefly?.screen() ?? null);
const boardState = (page: Page) =>
  page.evaluate(() => {
    const s = window.__pyrefly!.snapshotState() as { screenState?: { selectedId?: string; cleared?: string[] } };
    return { selectedId: s.screenState?.selectedId ?? null, cleared: s.screenState?.cleared ?? [] };
  });

async function bootToBoard(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60_000 });
  await expect.poll(() => screen(page), { timeout: 30_000 }).toBe('title');
  // Real keys: Enter past the title (and the briefing on a fresh save), never once the board is up.
  for (let i = 0; i < 30 && (await screen(page)) !== 'chapter-select'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
  }
  await expect.poll(() => screen(page), { timeout: 15_000 }).toBe('chapter-select');
}

async function walkToCard(page: Page, id: string): Promise<void> {
  for (const key of [...Array<string>(16).fill('ArrowRight'), ...Array<string>(16).fill('ArrowLeft')]) {
    if ((await boardState(page)).selectedId === id) return;
    await page.keyboard.press(key);
    await page.waitForTimeout(160);
  }
  expect((await boardState(page)).selectedId).toBe(id);
}

const mmss = (ms: number): string => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

test.describe('CHK-024: a release-20 save survives the upgrade', () => {
  test('clears, ribbons and best times on the board; volumes, text speed and ATB mode in the FFX-2 pause', async ({ page }) => {
    test.setTimeout(150_000);
    const errors = collectErrors(page);
    await injectBeforeBoot(page, fixture.localStorage);
    await bootToBoard(page);

    const board = await boardState(page);
    for (const id of fixture.expect.cleared) expect(board.cleared).toContain(id);
    for (const id of fixture.expect.notCleared) expect(board.cleared).not.toContain(id);
    const ribbons = await page.locator('.fe-card__ribbon').allTextContents();
    expect(ribbons.length).toBe(fixture.expect.cleared.length);
    for (const ms of Object.values(fixture.expect.bestTimeMs)) expect(ribbons.join(' ')).toContain(mmss(ms));
    await page.screenshot({ path: 'docs/screenshots/t1-b5/chk024-upgrade-board.jpg', type: 'jpeg', quality: 80 });

    // The mixer took the saved volumes at boot (round 03 blocker #5).
    const volumes = await page.evaluate(() => window.__pyrefly!.audioDebug().volumes);
    expect(volumes).toEqual({ master: 0.55, music: 0.35, sfx: 0.65 });

    // Into an FFX-2 chapter by real keys, pause over its pre-battle scene, OPTIONS.
    await walkToCard(page, 'ffx2-bahamut');
    await page.keyboard.press('Enter');
    await expect.poll(() => screen(page), { timeout: 20_000 }).toBe('party-prep');
    await page.keyboard.press('Enter');
    await expect.poll(() => screen(page), { timeout: 30_000 }).toMatch(/^(cutscene|battle)$/);
    await page.waitForTimeout(1200);
    await page.keyboard.press('Escape');
    await expect.poll(() => screen(page), { timeout: 10_000 }).toBe('pause');
    for (let i = 0; i < 8 && !(await page.locator('[data-row="masterVolume"]').count()); i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(350);
    }
    const value = (id: string) => page.locator(`[data-row="${id}"] .pause__v`).first().innerText();
    expect((await value('masterVolume')).trim()).toBe('55');
    expect((await value('musicVolume')).trim()).toBe('35');
    expect((await value('sfxVolume')).trim()).toBe('65');
    expect((await value('textSpeed')).trim()).toBe('1.5x');
    expect((await value('ffx2Atb')).trim()).toBe('ACTIVE');
    expect((await value('ffx2AtbSpeed')).trim()).toBe('FAST');
    expect((await value('guideVisible')).trim()).toBe('OFF');
    await page.screenshot({ path: 'docs/screenshots/t1-b5/chk024-upgrade-pause-options.jpg', type: 'jpeg', quality: 80 });

    // A reload on this build keeps it all (the app has since rewritten the slot itself).
    await page.reload();
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60_000 });
    const after = await page.evaluate(() => (window.__pyrefly!.snapshotState() as { save?: { settings?: Record<string, unknown> } }).save?.settings ?? null);
    expect(after).toMatchObject({ masterVolume: 0.55, musicVolume: 0.35, sfxVolume: 0.65, textSpeed: 1.5, ffx2Atb: 'active' });
    expect(errors).toEqual([]);
  });

  test('a truncated save boots to a fresh save with no error', async ({ page }) => {
    const errors = collectErrors(page);
    const raw = fixture.localStorage[KEY] ?? '';
    await injectBeforeBoot(page, { [KEY]: raw.slice(0, Math.floor(raw.length / 2)) });
    await bootToBoard(page);
    expect((await boardState(page)).cleared).toEqual([]);
    expect(await page.locator('.fe-card__ribbon').count()).toBe(0);
    const volumes = await page.evaluate(() => window.__pyrefly!.audioDebug().volumes);
    expect(volumes).toEqual({ master: 0.8, music: 0.7, sfx: 0.9 });
    await page.screenshot({ path: 'docs/screenshots/t1-b5/chk024-truncated-board.jpg', type: 'jpeg', quality: 80 });
    expect(errors).toEqual([]);
  });
});
