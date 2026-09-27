/**
 * CHK-008: HUD panels measured against the painted actors, promoted from the
 * round scratch harness (thresholds program batch 5, 2026-09-26).
 *
 * For every listed chapter at 1280x720, 1600x900, 2000x1000 and 2560x1440 the
 * spec enters the fight, walks the HUD states it can reach with real keys, and
 * intersects every visible HUD panel (as painted: the skewed slab, clipped
 * polygon against box) with every staged actor's projected quad. A hit on the
 * upper third of an actor's quad is a **face hit** (CHECKS.md: "no panel
 * intersects a face or a weapon"); the command stack over the party's lower
 * third is one of the two declared overlaps and is naturally outside that band.
 *
 * The nine CHK-008 states, and what this spec does with each:
 *   1 all panels open ............ first menu, advisor, intent and guide on
 *   2 a submenu .................. Item opened
 *   3 that submenu cancelled ..... Escape
 *   4 the Sensor card ............ Attack, the target cursor up (the card follows the target)
 *   5 a stage-2 telegraph ........ NOT DRIVEN: needs a scripted board (reported as unreached)
 *   6 a five-hit numeral burst ... sampled as "resolving": 450 ms after a submitted Attack
 *   7 an Overdrive picker ........ NOT DRIVEN: needs a full gauge (reported as unreached)
 *   8 that picker cancelled ...... NOT DRIVEN (as 7)
 *   9 every optional panel off ... N, E and G at the next menu
 *
 * A measuring stick for batches 2 and 3: it writes a report per chapter and
 * viewport (see `support/stage-measure.ts`) and only fails on its own errors,
 * unless `CHK_STRICT=1`. Run against a production build:
 * `npx vite build && npx playwright test tests/e2e/hud-collision.spec.ts`
 * (`CHK_CHAPTERS=seymour-flux,ffx2-bahamut` narrows it).
 *
 * Both games: shared plumbing; the panel list names both HUDs' panels, and a
 * chapter only ever shows its own game's.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  STRICT, enterBattle, listedChapters, quadBoxOverlap, readActors, screenName, settle, waitMenu, writeReport,
  type Actor, type Quad,
} from './support/stage-measure.ts';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 2000, height: 1000 },
  { width: 2560, height: 1440 },
] as const;

/** Panel roots of both HUDs. Full-screen layers are skipped at run time (> 60% of the viewport). */
const PANELS = [
  // FFX
  '.ig-cmd-stack', '.ffx-cmd-info', '.ig-stat-list', '.ig-ctb', '.ffx-sensor', '.ffx-telegraph', '.ig-banner',
  '.ig-bosshp', '.ffx-airship-order', '.ffx-zg', '.ffx-target__plate', '.ffx-target__all',
  // shared panels
  '.eint__panel', '.sgd__panel', '[data-role="move-advisor-card"]', '[data-role="move-advisor-toggle"]', '.coach-mark', '.dbox',
  // FFX-2
  '.ffx2stat', '.ffx2-cmd-info', '.ffx2chain', '.ffx2boss', '.ffx2-tplate', '.ffx2-aplate', '.ffx2-reels',
  '.ffx2-trigger', '.ffx2-nodemark', '.ffx2atb', '.ffx2sc', '.ffx2sf',
] as const;

interface PanelShape {
  sel: string;
  quad: Quad;
  box: { x: number; y: number; w: number; h: number };
}

function readPanels(page: Page): Promise<PanelShape[]> {
  return page.evaluate((selectors: readonly string[]) => {
    const vw = innerWidth * innerHeight;
    const out: PanelShape[] = [];
    for (const sel of selectors) {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (b.width < 2 || b.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
        if (el.closest('[hidden]')) continue;
        if (b.width * b.height > 0.6 * vw) continue; // a layer, not a panel
        const m = /^matrix\(([^)]+)\)$/.exec(cs.transform);
        const k = m ? -(Number(m[1]!.split(',')[2]) || 0) : 0;
        const dx = k * b.height;
        out.push({
          sel,
          quad: [
            { x: b.left + dx, y: b.top },
            { x: b.right, y: b.top },
            { x: b.right - dx, y: b.bottom },
            { x: b.left, y: b.bottom },
          ],
          box: { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) },
        });
      }
    }
    return out;
  }, PANELS);
}

interface Hit {
  panel: string;
  actor: string;
  side: string;
  px: number;
  facePx: number;
}

interface StateReport {
  state: string;
  reached: boolean;
  note?: string;
  screen?: string | null;
  panels?: { sel: string; box: PanelShape['box'] }[];
  actors?: Pick<Actor, 'id' | 'side' | 'x' | 'y' | 'w' | 'h'>[];
  hits?: Hit[];
  faceHits?: number;
}

async function measure(page: Page, state: string): Promise<StateReport> {
  const [panels, actors] = await Promise.all([readPanels(page), readActors(page)]);
  const hits: Hit[] = [];
  for (const p of panels) {
    for (const a of actors) {
      if (!a.alive) continue;
      const px = quadBoxOverlap(p.quad, a);
      if (px < 1) continue;
      const face = { x: a.x, y: a.y, w: a.w, h: a.h / 3 };
      hits.push({ panel: p.sel, actor: a.id, side: a.side, px: Math.round(px), facePx: Math.round(quadBoxOverlap(p.quad, face)) });
    }
  }
  return {
    state, reached: true, screen: await screenName(page),
    panels: panels.map((p) => ({ sel: p.sel, box: p.box })),
    actors: actors.map((a) => ({ id: a.id, side: a.side, x: Math.round(a.x), y: Math.round(a.y), w: Math.round(a.w), h: Math.round(a.h) })),
    hits, faceHits: hits.filter((h) => h.facePx > 0).length,
  };
}

const rowLabels = (page: Page): Promise<string[]> =>
  page.evaluate(() => Array.from(document.querySelectorAll('.ig-cmd-stack .ig-cmd')).map((r) => (r.textContent ?? '').replace(/\s+/g, ' ').trim()));
const selectedRow = (page: Page): Promise<string> =>
  page.evaluate(() => (document.querySelector('.ig-cmd-stack .ig-cmd--selected')?.textContent ?? '').replace(/\s+/g, ' ').trim());

/**
 * The three optional-panel preferences as the save holds them: the advisor (N,
 * `advisorVisible`), the intent panel (E, `intentVisible`) and the guide (G,
 * `guideVisible`). N and G are read from the settings, because the guide's
 * root stays mounted (folded to a chip) when switched off. E is read from the
 * DOM: in FFX the intent card opens on E without the preference changing, in
 * FFX-2 E flips the preference and the panel goes with it.
 */
const optionalPanels = (page: Page): Promise<Record<'n' | 'e' | 'g', boolean>> =>
  page.evaluate(() => {
    const s = (window.__pyrefly!.snapshotState() as { save?: { settings?: Record<string, unknown> } }).save?.settings ?? {};
    const intent = Array.from(document.querySelectorAll<HTMLElement>('.eint__panel')).some((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden';
    });
    return { n: s['advisorVisible'] !== false, e: intent, g: s['guideVisible'] !== false };
  });

/** Press N / E / G (real keys) until each preference is in the wanted state; returns what stuck. */
async function setOptionalPanels(page: Page, want: boolean): Promise<Record<'n' | 'e' | 'g', boolean>> {
  for (const k of ['n', 'e', 'g'] as const) {
    // A press that lands while the menu is still opening is dropped, so try up to twice.
    for (let tries = 0; tries < 2 && (await optionalPanels(page))[k] !== want; tries++) {
      await page.keyboard.press(k);
      await page.waitForTimeout(400);
    }
  }
  await settle(page, 8);
  return optionalPanels(page);
}

/** A target cursor is up: the stage has a selection (FFX), or the targeting layer lists targets (both HUDs). */
const selecting = (page: Page): Promise<boolean> =>
  page.evaluate(
    () => (window.__pyrefly!.targeting()?.selection ?? null) !== null || document.querySelectorAll('[data-target-id]').length > 0,
  );

/** Arrow to the first row whose label matches, with real keys (down, then up: FFX-2 menus do not wrap). */
async function selectRow(page: Page, re: RegExp): Promise<boolean> {
  for (const key of ['ArrowDown', 'ArrowUp']) {
    for (let i = 0; i < 10; i++) {
      if (re.test(await selectedRow(page))) return true;
      await page.keyboard.press(key);
      await page.waitForTimeout(110);
    }
  }
  return re.test(await selectedRow(page));
}

/** Enter (real key) until a target cursor is up, at most three presses (a group, then an entry, then the cursor). */
async function openTargetCursor(page: Page): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Enter');
    for (let t = 0; t < 8; t++) {
      await page.waitForTimeout(150);
      if (await selecting(page)) return true;
    }
    if (!(await page.evaluate(() => document.querySelector('.ig-cmd-stack .ig-cmd') !== null))) return false;
  }
  return false;
}

for (const vp of VIEWPORTS) {
  test.describe(`CHK-008 HUD against actors at ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: vp });
    for (const ch of listedChapters()) {
      test(`${ch.id}`, async ({ page }) => {
        test.setTimeout(300_000);
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await enterBattle(page, ch.id);
        const states: StateReport[] = [];

        // 1 all panels open (the coaching was marked seen; N, E and G switch on whatever is off).
        const opened = await setOptionalPanels(page, true);
        states.push({ ...(await measure(page, '1 all panels open')), note: `advisor ${opened.n}, intent ${opened.e}, guide ${opened.g}` });
        // 2 and 3: a submenu and its cancel.
        if (await selectRow(page, /^item/i)) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          states.push({ ...(await measure(page, '2 a submenu (Item)')), note: (await rowLabels(page)).slice(0, 6).join(' / ') });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          states.push(await measure(page, '3 that submenu cancelled'));
        } else {
          states.push({ state: '2 a submenu (Item)', reached: false, note: 'no Item row on this menu' }, { state: '3 that submenu cancelled', reached: false });
        }
        // 4 a target cursor (Attack when there is one, else the first row's first entry), then 6 resolving.
        if (!(await selectRow(page, /^attack/i))) await selectRow(page, /./);
        if (await openTargetCursor(page)) {
          states.push(await measure(page, '4 target cursor and Sensor card'));
          await page.keyboard.press('Enter');
          await page.waitForTimeout(450);
          states.push(await measure(page, '6 resolving (numerals)'));
        } else {
          states.push({ state: '4 target cursor and Sensor card', reached: false, note: `no target cursor opened (rows ${(await rowLabels(page)).join(' / ')})` }, { state: '6 resolving (numerals)', reached: false });
        }
        states.push(
          { state: '5 a stage-2 telegraph', reached: false, note: 'not driven: needs a scripted board' },
          { state: '7 an Overdrive picker', reached: false, note: 'not driven: needs a full gauge' },
          { state: '8 that picker cancelled', reached: false, note: 'not driven (as 7)' },
        );
        // 9 every optional panel off, at the next menu.
        await page.evaluate(() => window.__pyrefly!.setBattleSpeed('fast'));
        if (await waitMenu(page, 90_000)) {
          const left = await setOptionalPanels(page, false);
          states.push({ ...(await measure(page, '9 every optional panel off')), note: `preferences still on: advisor ${left.n}, intent ${left.e}, guide ${left.g}` });
          await setOptionalPanels(page, true);
        } else {
          states.push({ state: '9 every optional panel off', reached: false, note: `no next menu (screen ${await screenName(page)})` });
        }

        const faceHits = states.flatMap((s) => (s.hits ?? []).filter((h) => h.facePx > 0).map((h) => ({ state: s.state, ...h })));
        const file = writeReport(`hud-collision-${ch.id}-${vp.width}x${vp.height}`, {
          check: 'CHK-008', chapter: ch.id, game: ch.game, viewport: `${vp.width}x${vp.height}`, seed: 1,
          reached: states.filter((s) => s.reached).length, of: 9, faceHits: faceHits.length, faceHitList: faceHits, states, errors,
        });
        console.log(`CHK-008 ${ch.id} ${vp.width}x${vp.height}: ${states.filter((s) => s.reached).length}/9 states, ${faceHits.length} face hits -> ${file}`);

        // The measurement ran: a first menu with actors and panels.
        expect(states[0]?.actors?.length ?? 0, 'actors were projected').toBeGreaterThan(0);
        expect(states[0]?.panels?.length ?? 0, 'panels were read').toBeGreaterThan(0);
        expect(errors).toEqual([]);
        if (STRICT) expect(faceHits, 'CHK-008: no panel on a face').toEqual([]);
      });
    }
  });
}
