import { expect, test } from '@playwright/test';

import './support/pyrefly-window.ts';
import { CHAPTER_OF, PARTS, PLATE_NAMES, openChapterWithSpecials, startOwnServer, walkToForm, waitForFormMenu, type Girl, type OwnServer } from './support/special-walk.ts';

/**
 * E2E 23 of the FFX-2 Special look (step D2): the pause screen with a form up. FFX-2 only: the three Special dresspheres exist only in FFX-2. WRITTEN in step D2, RUN in Stage 2 (under the
 * suite lock, with the art installed); not run here.
 *
 * Template `pause.spec.ts`: its own vite dev server on a random port 5400-5990, stopped by its own PID; real keys; the debug API only reads (and boots, as the template does).
 *
 * Steps: Chapter IV (Yuna, Rikku) or Chapter V (Paine) with the test word `?specials=on`; the girl's own greedy walk along her Garment Grid to her Special by real keys (cap 60 decisions,
 * a clear failure message, never a loop); the control back at the three plates; the pause key. Asserts (D-32): the member tabs read the girl's name then the two parts' own names, then the
 * six fixed tabs; the real tab keys (E, Q) walk all three member tabs; the plate on every member tab is the MAIN's (`yuna-ffx2`, `rikku-ffx2`, `paine`); no response >= 400 names a pause or
 * portrait plate or a part id, and with `STRICT_404=1` (Stage 2, the art installed) there is no response >= 400 at all. Each girl runs twice: with the manifest as served and with the
 * manifest request aborted (the plate then has no manifest to consult). Screenshots `docs/screenshots/special-pause-form-<girl>.png` with `SPECIAL_SHOTS=1`.
 */

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

const STRICT_404 = process.env['STRICT_404'] === '1';
const SHOTS = process.env['SPECIAL_SHOTS'] === '1';
const MAIN_PLATE: Record<Girl, string> = { yuna: 'yuna-ffx2', rikku: 'rikku-ffx2', paine: 'paine' };
const FIXED = ['chapter', 'guide', 'options', 'accessibility', 'controls', 'music'];

for (const girl of ['yuna', 'rikku', 'paine'] as const) {
  for (const manifest of ['as served', 'aborted'] as const) {
    test(`${girl} in her Special, manifest ${manifest}: the pause tabs are the three plates, each on the main's plate, and nothing asks for a part's file`, async ({ page }) => {
      const bad: string[] = [];
      page.on('response', (r) => {
        if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
      });
      if (manifest === 'aborted') await page.route('**/art/manifest.json', (route) => route.abort());

      const thrown = await openChapterWithSpecials(page, server!.baseUrl, CHAPTER_OF[girl]);
      const walk = await walkToForm(page, girl);
      console.log(`[pause-with-form ${girl}] ${walk.decisions.length} decisions: ${walk.decisions.join(' ; ')}`);
      await waitForFormMenu(page, girl);

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.__pyrefly!.app.screens.some((s) => s.name === 'pause'), null, { timeout: 10_000 });
      await page.waitForTimeout(500);

      const tabIds = await page.locator('.pause__tab').evaluateAll((els) => els.map((e) => e.getAttribute('data-tab')));
      expect(tabIds, 'three member tabs for the three plates, then the six fixed ones').toEqual([`member:${girl}`, `member:${PARTS[girl][0]}`, `member:${PARTS[girl][1]}`, ...FIXED]);
      const labels = (await page.locator('.pause__tab').allTextContents()).map((t) => t.trim());
      expect(labels.slice(0, 3)).toEqual([...PLATE_NAMES[girl]]);
      for (const away of (['yuna', 'rikku', 'paine'] as const).filter((g) => g !== girl)) expect(tabIds, `${away} is away`).not.toContain(`member:${away}`);

      const activeTab = (): Promise<string | null> => page.locator('.pause__tab--on').getAttribute('data-tab');
      expect(await activeTab()).toBe(tabIds[0]);
      for (const [i, id] of tabIds.slice(0, 3).entries()) {
        if (i > 0) {
          await page.keyboard.press('KeyE'); // the real tab key
          await page.waitForTimeout(250);
        }
        expect(await activeTab(), `tab ${i}`).toBe(id);
        const plates = await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('.pause__art img[data-plate]')].map((img) => img.dataset['plate']));
        expect(new Set(plates), `the plate on ${id}`).toEqual(new Set([MAIN_PLATE[girl]]));
        // the part's tab reads its own meters: the HP pair of the body is the member's, not the main's
        const hp = await page.locator('.pause__row[data-row="hp"] .pause__v').first().textContent();
        expect(hp ?? '', `${id} has an HP row`).toMatch(/\d+\s*\/\s*\d+/);
      }
      if (SHOTS) await page.screenshot({ path: `docs/screenshots/special-pause-form-${girl}.png` });

      const mine = bad.filter((u) => /art\/pause\/|art\/portraits\//.test(u) || PARTS[girl].some((p) => u.includes(p)));
      expect(mine, 'no failed request for a plate, a portrait or a part').toEqual([]);
      if (STRICT_404) expect(bad, 'with the art installed nothing at all answers an error').toEqual([]);
      expect(thrown, 'no uncaught page error').toEqual([]);
    });
  }
}
