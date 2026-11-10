import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';
import { BADGE, CHAPTER_OF, PARTS, menuView, openChapterWithSpecials, startOwnServer, takeRow, waitForFormMenu, waitUntil, walkToForm, type Girl, type OwnServer } from './support/special-walk.ts';

/**
 * E2E 24 of the FFX-2 Special look (step D2): a part can be aimed by a real tap at 390x844, and the badge and the names read there. FFX-2 only: the three Special dresspheres exist only in
 * FFX-2. WRITTEN in step D2, RUN in Stage 2 (under the suite lock, with the art installed); not run here.
 *
 * Template `ffx2-ixion.spec.ts` (`test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })` and `page.touchscreen.tap`), with its own vite dev server because the
 * test word `?specials=on` is compiled out of the production build the shared config serves.
 *
 * Which girls: the walk to the Special is by keys (greedy, capped); the aims are by real taps. The one-target ally rows in a form are the part menus' own: Rikku's Machina Maw parts have
 * HP Repair and MP Repair, Paine's Full Throttle wings have Stamina and Mettle (read off the real engine in step D2: the unit probe lists them with three valid targets); Yuna's Floral
 * Fallal parts offer only all-allies groups and self rows, so there is no one-target pick to aim on her side until a part is down and a Revival row appears (a design question for Bailey,
 * recorded in the handoff). So this spec runs Rikku (Chapter IV) and Paine (Chapter V).
 *
 * Asserts: the badge shows at 390 (`.ffx2stat__badge` visible, a box, the Special's letters); no part name is clipped (`scrollWidth <= clientWidth`) or ellipsised; every plate has computed
 * `pointer-events: auto`; the party list carries no class beyond today's (read from the OFF pin `hud-menu-ffx2-ch4.json`); a first tap on a plate that is not aimed moves the aim to it and
 * confirms nothing; a second tap on the aimed plate confirms (`aimOnTap`); the aimed plate has `.ffx2--targeted-ally`; each of the three plates takes the aim; a tap on a plate while an ENEMY is
 * aimed does nothing. Under the Q-2 default (a) the figure's own rectangle cannot tell three taps apart, which is why the plates are the targets; under (b) add the part-region taps in Stage 2.
 */

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test.beforeEach(() => {
  test.setTimeout(600_000);
});

let server: OwnServer | null = null;
test.beforeAll(async () => {
  test.setTimeout(300_000);
  server = await startOwnServer();
});
test.afterAll(() => {
  server?.stop();
  server = null;
});

/** The one-target ENEMY row of each part (read off the real engine in review fix R3-2): a part is offered no Attack row, only its own skills; Howitzer is on both of Rikku's parts, Paine's right wing has Venom Wing and her left Ma'at's Feather. */
const ENEMY_ROW: Record<string, string> = { 'machina-maw-smasher-r': 'Howitzer', 'machina-maw-crusher-l': 'Howitzer', 'full-throttle-right': 'Venom Wing', 'full-throttle-left': "Ma'at's Feather" };

/** The one-target ally row of each girl's parts. */
const ALLY_ROW: Partial<Record<Girl, string>> = { rikku: 'HP Repair', paine: 'Stamina' };

/** The class tokens the party list carries today (read from the OFF pin, taken before the look steps). */
function todaysPartyClasses(): Set<string> {
  const pin = JSON.parse(readFileSync(resolve(process.cwd(), 'tests', 'fixtures', 'specials', 'off-pins', 'hud-menu-ffx2-ch4.json'), 'utf8')) as Record<string, { partyClass: string }>;
  return new Set(Object.values(pin).flatMap((s) => s.partyClass.split(/\s+/).filter(Boolean)));
}

const selection = (page: Page): Promise<{ ids: string[]; mode: string } | null> => page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null);

/** Pass a turn by taking Attack at whatever is aimed (the foe). */
async function attack(page: Page): Promise<void> {
  expect(await takeRow(page, 'Attack'), 'an Attack row').toBe(true);
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
}

/** Pass turns until a part's menu is open. */
async function toPartMenu(page: Page, girl: Girl): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const m = await waitForFormMenu(page, girl);
    if (m.actor && PARTS[girl].includes(m.actor)) return m.actor;
    await attack(page);
  }
  throw new Error(`no menu of ${girl}'s parts within 30 turns`);
}

/** Open the row named `label` wherever it sits: the top level, or the first submenu that lists it. */
async function openRowAnywhere(page: Page, label: string): Promise<void> {
  const top = await menuView(page);
  if (top.rows.includes(label)) return void (await takeRow(page, label));
  for (const row of top.rows) {
    if (['Attack', 'Change'].includes(row) || /^Leave /.test(row)) continue;
    if (!(await takeRow(page, row))) continue;
    await page.waitForTimeout(300);
    const sub = await menuView(page);
    if (sub.rows.includes(label)) {
      expect(await takeRow(page, label), `${label} in ${row}`).toBe(true);
      return;
    }
    await page.keyboard.press('Escape'); // back to the top list of the menu
    await page.waitForTimeout(300);
  }
  throw new Error(`no row ${label} on the menu: ${top.rows.join(' | ')}`);
}

const plateBox = (page: Page, id: string) => page.locator(`.ffx2hud__party [data-actor-id="${id}"]`).first().boundingBox({ timeout: 2_000 });
async function tapPlate(page: Page, id: string): Promise<void> {
  const box = await plateBox(page, id);
  expect(box, `plate ${id} has a box`).not.toBeNull();
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.waitForTimeout(350);
}

for (const girl of ['rikku', 'paine'] as const) {
  test(`${girl} in her Special at 390x844: the badge and the names read, and a real tap on each plate aims it`, async ({ page }) => {
    const thrown = await openChapterWithSpecials(page, server!.baseUrl, CHAPTER_OF[girl]);
    await walkToForm(page, girl);
    const part = await toPartMenu(page, girl);
    expect(PARTS[girl]).toContain(part);

    // the badge and the names, with the party list on screen
    const badge = page.locator('.ffx2stat__badge').first();
    await expect(badge, 'the badge shows at 390').toBeVisible();
    const bb = await badge.boundingBox();
    expect(bb && bb.width > 0 && bb.height > 0, 'the badge has a box').toBe(true);
    expect((await badge.textContent())?.trim()).toBe(BADGE[girl]);
    const names = await page.locator('.ig-stat--form-part .ig-stat__name').evaluateAll((els) => els.map((e) => ({ text: e.textContent, clipped: e.scrollWidth > e.clientWidth, ellipsis: getComputedStyle(e).textOverflow === 'ellipsis' })));
    expect(names, 'two part names').toHaveLength(2);
    for (const n of names) expect(n, n.text ?? '').toMatchObject({ clipped: false, ellipsis: false });
    const plates = await page.locator('.ffx2hud__party [data-form-role]').evaluateAll((els) => els.map((e) => ({ id: (e as HTMLElement).dataset['actorId'], pe: getComputedStyle(e).pointerEvents })));
    expect(plates).toHaveLength(3);
    for (const p of plates) expect(p.pe, p.id ?? '').toBe('auto');
    const today = todaysPartyClasses();
    const classes = (await page.locator('.ffx2hud__party').first().getAttribute('class'))!.split(/\s+/).filter(Boolean);
    for (const c of classes) expect(today.has(c), `the party list carries ${c}, which today's does not`).toBe(true);

    // a one-target pick of the part's own: its aim opens on a plate
    await openRowAnywhere(page, ALLY_ROW[girl]!);
    expect(await waitUntil(page, async () => (await selection(page)) !== null, { timeoutMs: 5_000, intervalMs: 150 }), 'the ally aim opened').toBe(true);
    const all: string[] = [girl, ...PARTS[girl]];
    const first = (await selection(page))!;
    expect(first.mode).toBe('single');
    // each of the three plates takes the aim by one tap and the pick stays open
    for (const id of all.filter((p) => p !== first.ids[0])) {
      await tapPlate(page, id);
      const now = await selection(page);
      expect(now?.ids, `a first tap on ${id} aims it and confirms nothing`).toEqual([id]);
      await expect(page.locator(`.ffx2hud__party [data-actor-id="${id}"]`).first()).toHaveClass(/ffx2--targeted-ally/);
    }
    // a second tap on the aimed plate confirms
    const aimed = (await selection(page))!.ids[0]!;
    const logBefore = await page.evaluate(() => window.__pyrefly!.battleLog().length);
    await tapPlate(page, aimed);
    expect(await waitUntil(page, async () => (await selection(page)) === null, { timeoutMs: 5_000, intervalMs: 150 }), 'the second tap confirmed the aim').toBe(true);
    expect(await waitUntil(page, async () => (await page.evaluate(() => window.__pyrefly!.battleLog().length)) > logBefore, { timeoutMs: 20_000 }), 'the command played').toBe(true);

    // a tap on a plate while an ENEMY is aimed does nothing
    const partNow = await toPartMenu(page, girl);
    await openRowAnywhere(page, ENEMY_ROW[partNow]!); // not Attack: the engine offers a part no Attack row
    expect(await waitUntil(page, async () => (await selection(page)) !== null, { timeoutMs: 5_000, intervalMs: 150 }), 'the enemy aim opened').toBe(true);
    const foe = (await selection(page))!;
    expect(foe.ids.some((id) => all.includes(id)), 'the pick aims a foe').toBe(false);
    for (const id of all) {
      await tapPlate(page, id);
      expect((await selection(page))?.ids, `a tap on ${id} while a foe is aimed`).toEqual(foe.ids);
    }
    await page.keyboard.press('Enter');
    expect(thrown, 'no uncaught page error').toEqual([]);
  });
}
