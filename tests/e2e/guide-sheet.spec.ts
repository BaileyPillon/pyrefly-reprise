import { expect, test, type Page } from '@playwright/test';

import { enterBattle, settle } from './support/stage-measure.ts';
import './support/pyrefly-window.ts';

/**
 * R38 (both games): the desktop strategy guide is a scrolling reading sheet, and the status cure-hint card has a box of its own
 * above it. Real keys and a real mouse wheel; the debug API only walks to the fight, and one labelled probe stamps a status on a
 * party member as the HUD sees it (the engine's rules never read `state()`), so the card has something to say.
 *
 * What only a browser can show, and `tests/unit/strategy-guide-sheet.test.ts` cannot: the stage is scaled (2.5x at 1600x900), and a
 * browser applies a wheel's pixels to a scroll offset as they are, so a notch used to move the sheet 250 screen px, three and a half
 * times what it shows. The guide scales the wheel itself now, so a notch moves the text by what the wheel says.
 *
 * Runs against the shared config's `vite preview` of a production build (`PREVIEW_PORT` picks the port; a preview already on it is
 * reused). 1600x900 here, the viewport the guide's type floor is set at; the unit tests pin the arithmetic at every scale.
 */

test.use({ viewport: { width: 1600, height: 900 } });
test.beforeEach(() => {
  test.setTimeout(240_000);
});

interface SheetRead {
  scrollTop: number;
  max: number;
  clientHeight: number;
  scale: number;
  overflowY: string;
  top: string;
  gap: number;
  more: boolean;
  units: number;
  hidden: boolean;
}

const readSheet = (page: Page): Promise<SheetRead> =>
  page.evaluate(() => {
    const p = document.querySelector<HTMLElement>('.sgd__panel')!;
    const b = p.getBoundingClientRect();
    const units = Array.from(p.querySelectorAll<HTMLElement>('.sgd__u'));
    const top = units.find((u) => u.getBoundingClientRect().bottom > b.top + 1);
    return {
      scrollTop: p.scrollTop,
      max: p.scrollHeight - p.clientHeight,
      clientHeight: p.clientHeight,
      scale: p.offsetWidth > 0 ? b.width / p.offsetWidth : 0,
      overflowY: getComputedStyle(p).overflowY,
      top: (top?.innerText ?? '').replace(/\s+/g, ' ').trim(),
      gap: top ? top.getBoundingClientRect().top - b.top : -1,
      more: document.querySelector('.sgd__more') !== null,
      units: units.length,
      hidden: p.hidden === true,
    };
  });

/** Stamp `status` on the party member whose id contains `who`, in the state the HUD is fed (a presentation probe, no engine file). */
async function stamp(page: Page, status: string, who: string): Promise<void> {
  await page.evaluate(
    ({ status, who }) => {
      const screen = window.__pyrefly!.battle()!;
      const eng = screen.battleEngine as unknown as { state(): { combatants: Record<string, { side: string; statuses?: Record<string, unknown> }> }; __orig?: () => unknown };
      const hud = (screen as unknown as { hud?: { syncVitals?(s: unknown): void } }).hud;
      const ids = Object.keys(eng.state().combatants).filter((id) => eng.state().combatants[id]!.side === 'party');
      const id = ids.find((i) => i.includes(who)) ?? ids[0]!;
      const orig = eng.state.bind(eng);
      eng.__orig = orig;
      eng.state = () => {
        const st = orig();
        const c = st.combatants[id]!;
        c.statuses = { ...(c.statuses ?? {}), [status]: { turns: 3, stacks: 1, source: 'probe' } };
        return st;
      };
      (window as unknown as { __stamp?: { id: string; status: string } }).__stamp = { id, status };
      hud?.syncVitals?.(eng.state());
    },
    { status, who },
  );
}

/** Take the stamp off: `state()` back to the engine's own, and (FFX hands out its live state) the stamped status off that too. */
async function unstamp(page: Page): Promise<void> {
  await page.evaluate(() => {
    const screen = window.__pyrefly!.battle()!;
    const eng = screen.battleEngine as unknown as { state: () => { combatants: Record<string, { statuses?: Record<string, unknown> }> }; __orig?: () => unknown };
    if (eng.__orig) eng.state = eng.__orig as typeof eng.state;
    const w = window as unknown as { __stamp?: { id: string; status: string } };
    const st = eng.state();
    if (w.__stamp) delete st.combatants[w.__stamp.id]?.statuses?.[w.__stamp.status];
    w.__stamp = undefined;
    const hud = (screen as unknown as { hud?: { syncVitals?(s: unknown): void } }).hud;
    hud?.syncVitals?.(st);
  });
}

const CASES = [
  { id: 'seymour-flux', game: 'FFX', boss: 'Seymour Flux', status: 'zombie', who: 'kimahri' },
  { id: 'ffx2-bahamut', game: 'FFX-2', boss: 'Bahamut', status: 'curse', who: 'paine' },
] as const;

for (const c of CASES) {
  test.describe(`${c.game}: ${c.id}`, () => {
    test.beforeEach(async ({ page }) => {
      await enterBattle(page, c.id);
      await settle(page, 20);
      await page.waitForFunction(() => document.querySelector('.sgd__panel') !== null && !(document.querySelector('.sgd__panel') as HTMLElement).hidden);
      await page.waitForTimeout(600);
    });

    test('opens on the boss’s header, scrolls, and has no MORE row', async ({ page }) => {
      const s = await readSheet(page);
      expect(s.overflowY).toBe('auto');
      expect(s.more, 'the MORE row is gone').toBe(false);
      expect(s.max, 'there is more document than the sheet shows').toBeGreaterThan(20);
      expect(s.scrollTop, 'it opened part way down: the preparation sits above the header').toBeGreaterThan(0);
      expect(s.top.startsWith(c.boss), `the unit at the top is ${c.boss}'s header (got "${s.top.slice(0, 40)}")`).toBe(true);
      expect(s.gap, 'only the empty gap above the header shows, no half line').toBeLessThan(14);
      expect(s.gap).toBeGreaterThanOrEqual(0);
    });

    test('a wheel notch moves the text by what the wheel says, not by the stage’s scale', async ({ page }) => {
      const box = (await page.locator('.sgd__panel').boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      const before = await readSheet(page);
      expect(before.scale, 'the stage is scaled up').toBeGreaterThan(2);
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(500);
      const after = await readSheet(page);
      const screenPx = (after.scrollTop - before.scrollTop) * after.scale;
      expect(screenPx, 'a 100 px notch moved the text about 100 screen px').toBeGreaterThan(90);
      expect(screenPx).toBeLessThan(110);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(500);
      expect((await readSheet(page)).scrollTop).toBeCloseTo(before.scrollTop, 0);
    });

    test('`[` and `]` page, Home and End go to the ends, and `]` reaches every unit of the page', async ({ page }) => {
      await page.keyboard.press('Home');
      await page.waitForTimeout(80);
      const top = await readSheet(page);
      expect(top.scrollTop).toBe(0);
      await page.keyboard.press(']');
      await page.waitForTimeout(80);
      const paged = await readSheet(page);
      expect(paged.scrollTop / paged.clientHeight).toBeGreaterThan(0.8);
      expect(paged.scrollTop / paged.clientHeight).toBeLessThan(0.9);
      await page.keyboard.press('[');
      await page.waitForTimeout(80);
      expect((await readSheet(page)).scrollTop).toBeCloseTo(0, 0);
      // walk the page by `]` from the top, remembering every unit that was on screen at a stop
      const reached = new Set<number>();
      for (let i = 0; i < 400; i++) {
        const seen = await page.evaluate(() => {
          const p = document.querySelector<HTMLElement>('.sgd__panel')!;
          const b = p.getBoundingClientRect();
          const out: number[] = [];
          p.querySelectorAll<HTMLElement>('.sgd__u').forEach((u, k) => {
            const r = u.getBoundingClientRect();
            if (r.bottom > b.top && r.top < b.bottom) out.push(k);
          });
          return { out, atFoot: p.scrollTop >= p.scrollHeight - p.clientHeight - 0.5 };
        });
        seen.out.forEach((k) => reached.add(k));
        if (seen.atFoot) break;
        await page.keyboard.press(']');
        await page.waitForTimeout(30);
      }
      expect(reached.size, 'every unit of the page was on screen at some stop').toBe(top.units);
      await page.keyboard.press('End');
      await page.waitForTimeout(80);
      const foot = await readSheet(page);
      expect(foot.scrollTop).toBeCloseTo(foot.max, 0);
      // the keys that belong to the menu are not the sheet's
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(80);
      expect((await readSheet(page)).scrollTop, 'ArrowDown is the menu’s').toBe(0);
    });

    test('G puts the sheet away and G brings it back on the boss, wherever it was left', async ({ page }) => {
      const opened = (await readSheet(page)).scrollTop;
      await page.keyboard.press('End');
      await page.waitForTimeout(80);
      expect((await readSheet(page)).scrollTop).not.toBe(opened);
      await page.keyboard.press('g');
      await page.waitForTimeout(400);
      expect((await readSheet(page)).hidden, 'G hides the sheet').toBe(true);
      expect(await page.locator('.sgd__toggle').innerText()).toMatch(/guide/i);
      await page.keyboard.press('g');
      await page.waitForTimeout(600);
      const back = await readSheet(page);
      expect(back.hidden).toBe(false);
      expect(back.scrollTop, 'it opens on the boss again').toBeCloseTo(opened, 0);
    });

    test('the chip does what G does: a click puts the sheet away and a click brings it back on the boss', async ({ page }) => {
      const opened = (await readSheet(page)).scrollTop;
      await page.keyboard.press('End');
      await page.waitForTimeout(80);
      await page.locator('.sgd__toggle').click();
      await page.waitForTimeout(400);
      expect((await readSheet(page)).hidden, 'a click on the chip hides the sheet').toBe(true);
      await page.locator('.sgd__toggle').click();
      await page.waitForTimeout(600);
      const back = await readSheet(page);
      expect(back.hidden).toBe(false);
      expect(back.scrollTop).toBeCloseTo(opened, 0);
    });

    test('the cure-hint card has a box of its own above the sheet, and the sheet keeps its page', async ({ page }) => {
      // FFX-2's clock runs under the menu, so a real status may already have a card up: count them, and ask only that ours goes.
      const cards = (): Promise<number> => page.evaluate(() => document.querySelectorAll('.sthint:not([hidden]):not(.sthint--solo)').length);
      const had = await cards();
      await stamp(page, c.status, c.who);
      await page.waitForFunction(() => document.querySelector('.sthint:not([hidden])') !== null, null, { timeout: 15_000 });
      await settle(page, 20);
      const geo = () =>
        page.evaluate(() => {
          const r = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
          const card = document.querySelector('.sthint:not([hidden]):not(.sthint--solo)');
          const sheet = document.querySelector('.sgd__panel') as HTMLElement;
          const stack = document.querySelector('.sgd__stack');
          const cb = r(card);
          const sb = r(sheet);
          const kb = r(stack);
          return {
            parent: card?.parentElement?.className ?? null,
            inSheet: !!(card && sheet.contains(card)),
            card: cb ? { top: cb.top, bottom: cb.bottom, left: cb.left, right: cb.right } : null,
            sheet: sb ? { top: sb.top, bottom: sb.bottom, left: sb.left, right: sb.right } : null,
            stack: kb ? { top: kb.top, bottom: kb.bottom, left: kb.left, right: kb.right } : null,
            scrollTop: sheet.scrollTop,
          };
        });
      const up = await readSheet(page);
      const g = await geo();
      expect(g.parent).toBe('sgd__slot');
      expect(g.inSheet, 'the card is not a block of the document').toBe(false);
      expect(g.card!.bottom, 'the card is above the sheet').toBeLessThanOrEqual(g.sheet!.top + 1);
      expect(g.card!.top).toBeGreaterThanOrEqual(g.stack!.top - 1);
      expect(g.sheet!.bottom, 'the sheet ends where the column ends').toBeLessThanOrEqual(g.stack!.bottom + 1);
      expect(g.scrollTop, 'the page did not move when the card came').toBeCloseTo(up.scrollTop, 0);
      // G folds the guide: the card stands alone in the stage, where the approved frame has it
      await page.keyboard.press('g');
      await page.waitForTimeout(500);
      const folded = await page.evaluate(() => {
        const card = document.querySelector('.sthint:not([hidden]):not(.sthint--solo)');
        return { parent: card?.parentElement?.className ?? null };
      });
      expect(folded.parent).toMatch(/stage/);
      await page.keyboard.press('g');
      await page.waitForTimeout(500);
      // the status goes: the card goes and the sheet has its whole column again
      await unstamp(page);
      await page.waitForFunction(
        (n) => document.querySelectorAll('.sthint:not([hidden]):not(.sthint--solo)').length <= n,
        had,
        { timeout: 15_000 },
      );
      await settle(page, 20);
      expect(await cards(), 'the stamped card went').toBeLessThanOrEqual(had);
      const after = await readSheet(page);
      expect(after.scrollTop).toBeCloseTo(up.scrollTop, 0);
    });
  });
}
