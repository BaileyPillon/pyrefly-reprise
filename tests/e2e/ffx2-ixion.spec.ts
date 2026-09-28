import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

/**
 * Chapter XVI, Ixion at Djose (FFX-2 only), end to end by real input, as listed on 2026-09-27.
 *
 * From the title by real keys (or taps on a phone): the board, the Ixion card (the last playable card, one Left
 * from the first), party prep, the opening scene, the fight played to a win with a sensible line (the in-battle
 * strategy guide's own NEXT pick, which is the chapter tactic: Darkness on the Dark Knights, Shell, Protect and
 * heals on Yuna, and Shell plus heals the moment the "Recharge" banner shows), the results, the fall, the Abyss,
 * the four whistles, the Bevelle Underground, and back on the board with the clear shown ("1 of 15 beaten").
 *
 * The debug API only reads (the state, the guide's DOM, the targeting snapshot) and pins the seed; it never
 * submits a command, skips a scene or sets a number. Frames: `docs/screenshots/chapter-ixion/listed/<w>x<h>-*.jpg`.
 * Runs against the shared config's preview (`PREVIEW_PORT`; an already-running server on it is reused).
 */

const SHOTS = 'docs/screenshots/chapter-ixion/listed';
const SEED = 3;
const DEBUG = !!process.env['IXION_E2E_DEBUG'];
const FIGHT_MS = Number(process.env['IXION_E2E_FIGHT_MS'] ?? 600_000);
const ID = 'ffx2-ixion-djose';
const ITEMS = new Set(['Mega-Potion', 'Hi-Potion', 'Phoenix Down', 'Ether', 'Lunar Curtain', 'X-Potion', 'Remedy']);

test.beforeEach(() => {
  test.setTimeout(900_000);
});

type Input = 'keys' | 'touch';

const tag = (page: Page): string => `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
const shoot = (page: Page, moment: string): Promise<Buffer> =>
  page.screenshot({ path: `${SHOTS}/${tag(page)}-${moment}.jpg`, type: 'jpeg', quality: 82 });
const screen = (page: Page): Promise<string | undefined> => page.evaluate(() => window.__pyrefly!.app.current?.name);

async function boot(page: Page): Promise<string[]> {
  const thrown: string[] = [];
  page.on('pageerror', (e) => thrown.push(String(e)));
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
  await page.evaluate((s) => window.__pyrefly!.setSeed(s), SEED);
  return thrown;
}

/** One press of confirm: Enter, or a tap on the given element (else the screen's middle). */
async function confirm(page: Page, input: Input, tapAt?: string): Promise<void> {
  if (input === 'keys') {
    await page.keyboard.press('Enter');
    return;
  }
  const target = tapAt ? page.locator(tapAt).first() : null;
  if (target) await target.scrollIntoViewIfNeeded({ timeout: 1_500 }).catch(() => null); // a swipe on the board's card list
  const box = target ? await target.boundingBox({ timeout: 1_500 }).catch(() => null) : null;
  const { width, height } = page.viewportSize()!;
  await page.touchscreen.tap(box ? box.x + box.width / 2 : width / 2, box ? box.y + box.height / 2 : height * 0.8);
}

/** Title to the board. */
async function toBoard(page: Page, input: Input): Promise<void> {
  expect(await screen(page)).toBe('title');
  await shoot(page, '01-title');
  for (let i = 0; i < 8 && (await screen(page)) !== 'chapter-select'; i++) {
    await confirm(page, input);
    await page.waitForTimeout(1500);
  }
  expect(await screen(page)).toBe('chapter-select');
  await page.waitForTimeout(1500);
}

interface Board {
  selectedId: string;
  beaten: number;
  total: number;
  tiles: number;
  cleared: string[];
}
const board = (page: Page): Promise<Board> => page.evaluate(() => window.__pyrefly!.app.current!.snapshot() as unknown as Board);

/** The command menu's rows, which one is lit, and its title. */
async function menuView(page: Page): Promise<{ rows: string[]; sel: number; title: string | null }> {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ffx2hud__command .ig-cmd')];
    return {
      rows: rows.map((r) => r.querySelector('.ffx2cmd__label')?.textContent?.trim() ?? ''),
      sel: rows.findIndex((r) => r.classList.contains('ig-cmd--selected')),
      title: document.querySelector('.ffx2hud__command .ffx2cmd__title')?.textContent?.trim() ?? null,
    };
  });
}

/** Light the row named `label` and take it: arrows then Enter, or a tap on the row. */
async function takeRow(page: Page, input: Input, label: string): Promise<boolean> {
  for (let i = 0; i < 24; i++) {
    const m = await menuView(page);
    const want = m.rows.indexOf(label);
    if (want < 0) return false;
    if (input === 'touch') {
      const row = page.locator('.ffx2hud__command .ig-cmd').nth(want);
      await row.scrollIntoViewIfNeeded({ timeout: 1_500 }).catch(() => null); // a swipe down a long list
      const box = await row.boundingBox({ timeout: 1_500 }).catch(() => null);
      if (!box) return false;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      return true;
    }
    if (m.sel === want) {
      await page.keyboard.press('Enter');
      return true;
    }
    await page.keyboard.press(want > m.sel ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(90);
  }
  return false;
}

/** The girl whose menu is open, and what the guide says she should do. */
async function guideNext(page: Page): Promise<{ actor: string; label: string; target: string } | null> {
  return page.evaluate(() => {
    const actor = document.querySelector('.sgd__sec--next .sgd__actor')?.textContent?.trim();
    const label = document.querySelector('.sgd__sec--next .sgd__label')?.textContent?.trim();
    const target = document.querySelector('.sgd__sec--next .sgd__target')?.textContent?.trim() ?? '';
    return actor && label ? { actor, label, target } : null;
  });
}

/** Aim at `name` (a girl's or Ixion's display name): arrows until the selection is theirs, or a tap on them. */
async function aim(page: Page, input: Input, name: string): Promise<void> {
  await page.waitForFunction(() => (window.__pyrefly!.targeting()?.selection?.ids.length ?? 0) > 0, null, { timeout: 5_000 }).catch(() => null);
  const id = name.toLowerCase() === 'ixion' ? 'x2-ixion' : name.toLowerCase();
  const onTarget = async (): Promise<boolean> => {
    const sel = await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null);
    return !name || !sel || sel.mode !== 'single' || sel.ids[0] === id;
  };
  if (input === 'touch') {
    // The phone: tap the girl's plate (or the fiend) to aim, then the Confirm bar (`.phud-target__go`).
    if (!(await onTarget())) {
      // Her figure on the field first (the stage's own hit area), then her plate.
      const fig = await page.evaluate((who) => window.__pyrefly!.targeting()?.rects[who] ?? null, id);
      if (fig) await page.touchscreen.tap(fig.x + fig.w / 2, fig.y + fig.h * 0.45);
      await page.waitForTimeout(250);
      if (!(await onTarget())) {
        const plate = await page.locator(`.ffx2hud__party [data-actor-id="${id}"]`).first().boundingBox({ timeout: 1_500 }).catch(() => null);
        if (plate) await page.touchscreen.tap(plate.x + plate.width / 2, plate.y + plate.height / 2);
        await page.waitForTimeout(250);
      }
      const box = fig;
      const r = fig;
      if (DEBUG) console.log(`[aim] ${id} plate=${JSON.stringify(box)} r=${JSON.stringify(r)} now=${JSON.stringify(await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null))}`);
    }
    // A first-turn coach card can take the first tap (it fades on a touch), so tap again until the aim closes.
    for (let i = 0; i < 4; i++) {
      const gb = await page.locator('.phud-target__go:visible').first().boundingBox({ timeout: 1_500 }).catch(() => null);
      if (!gb) break;
      await page.touchscreen.tap(gb.x + gb.width / 2, gb.y + gb.height / 2);
      await page.waitForTimeout(350);
      if (!(await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null))) break;
      if (DEBUG) console.log(`[aim] go tap ${i} left the aim open`);
    }
    return;
  }
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    if (await onTarget()) break;
    await page.keyboard.press(key);
    await page.waitForTimeout(110);
  }
  await page.keyboard.press('Enter');
}

/** Which top-level command holds `label` for this girl (the preset: Yuna White Mage, the others Dark Knight). */
function categoryOf(actor: string, label: string): string {
  if (ITEMS.has(label)) return 'Item';
  if (label === 'Attack') return 'Attack';
  return actor === 'Yuna' ? 'White Magic' : 'Skill';
}

/** The chapter's line when the guide is not fresh: Darkness on a Knight; Yuna revives, heals, or Prays. */
async function fallbackPick(page: Page, isYuna: boolean): Promise<{ actor: string; label: string; target: string }> {
  if (!isYuna) return { actor: 'Knight', label: 'Darkness', target: 'all enemies' };
  const girls = await page.evaluate(() => {
    const s = window.__pyrefly!.battleState()!;
    return ['yuna', 'rikku', 'paine'].map((id) => {
      const c = s.combatants[id] as unknown as { name: string; hp: number; stats: { maxHp: number } };
      return { name: c.name, frac: c.hp / c.stats.maxHp };
    });
  });
  const down = girls.find((g) => g.frac <= 0);
  if (down) return { actor: 'Yuna', label: 'Phoenix Down', target: down.name };
  const low = [...girls].sort((a, b) => a.frac - b.frac)[0]!;
  if (low.frac < 0.5) return { actor: 'Yuna', label: 'Curaga', target: low.name };
  return { actor: 'Yuna', label: 'Pray', target: 'the party' };
}

/** Play one decision by real input, following the guide's NEXT. Returns what was taken. */
async function playTurn(page: Page, input: Input): Promise<string | null> {
  await page.waitForTimeout(220); // the guide re-reads the board as the menu opens
  const m = await menuView(page);
  if (m.title !== null && (await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null))) {
    await aim(page, input, ''); // an aim left open (a tap that did not land): confirm it
    return null;
  }
  if (m.rows.length === 0) return null;
  if (m.title !== null) {
    // A submenu left open (a tap that missed its row): take the guide's row there again.
    const again = await guideNext(page);
    if (!again || !m.rows.includes(again.label) || !(await takeRow(page, input, again.label))) return null;
    await page.waitForTimeout(200);
    await aim(page, input, /party|all/i.test(again.target) ? '' : again.target || 'Ixion');
    return `${again.actor}: ${again.label}${again.target ? ` → ${again.target}` : ''} (again)`;
  }
  // Whose menu: only the White Mage has White Magic. The guide's NEXT is used when it names that girl's kind;
  // a phone keeps the guide folded behind its GUIDE chip and may not have re-read the board, so a stale pick
  // falls back to the same line read off the party's HP (`fallbackPick`).
  const isYuna = m.rows.includes('White Magic');
  const guided = await guideNext(page);
  const next = guided && (guided.actor === 'Yuna') === isYuna ? guided : await fallbackPick(page, isYuna);
  const cat = categoryOf(next.actor, next.label);
  if (DEBUG) console.log(`[turn] rows=${m.rows.join('|')} guided=${JSON.stringify(guided)} next=${JSON.stringify(next)} cat=${cat}`);
  if (!(await takeRow(page, input, cat))) return null;
  if (cat !== 'Attack') {
    // The submenu: wait for its title, then its row (never Escape: at the top level that is the pause menu).
    const opened = await page
      .waitForFunction((c) => document.querySelector('.ffx2hud__command .ffx2cmd__title')?.textContent?.trim() === c, cat, { timeout: 2_000 })
      .then(() => true, () => false);
    if (!opened) return null;
    if (!(await takeRow(page, input, next.label))) return null;
  }
  await page.waitForTimeout(200);
  const single = next.target && !/party|all/i.test(next.target) ? next.target : 'Ixion';
  await aim(page, input, /party|all/i.test(next.target) ? '' : single);
  return `${next.actor}: ${next.label}${next.target ? ` → ${next.target}` : ''}`;
}

interface Fight {
  outcome: string | undefined;
  taken: string[];
  recharges: number;
  hammers: number;
  bannerSeen: boolean;
}

/** The fight, to its end, by real input. Shoots the first menu, the Recharge banner and Thor's Hammer. */
async function fight(page: Page, input: Input): Promise<Fight> {
  const taken: string[] = [];
  let bannerSeen = false;
  let shotMenu = false;
  let shotBanner = false;
  let shotHammer = false;
  let outcome: string | undefined;
  let counts = { recharges: 0, hammers: 0 };
  const start = Date.now();
  while (Date.now() - start < FIGHT_MS) {
    const state = await page.evaluate(() => {
      const s = window.__pyrefly!.battleState();
      const log = window.__pyrefly!.battleLog();
      const menu = document.querySelector('.ffx2hud__command');
      const menuUp = !!menu && !!menu.querySelector('.ig-cmd') && menu.getBoundingClientRect().width > 0;
      const banner = document.querySelector<HTMLElement>('[data-role="battle-message"]');
      const bannerText = banner && !banner.hidden ? banner.textContent : null;
      const ix = log.filter((e) => e.type === 'action-start' && e.actorId === 'x2-ixion') as Array<{ abilityId?: string }>;
      const end = log.find((e) => e.type === 'victory' || e.type === 'defeat');
      return {
        result: s?.result?.outcome ?? (end ? end.type : null),
        screen: window.__pyrefly!.app.current?.name,
        menuUp,
        bannerText,
        last: ix.at(-1)?.abilityId ?? null,
        recharges: ix.filter((e) => e.abilityId === 'x2-ixion-recharge').length,
        hammers: ix.filter((e) => e.abilityId === 'x2-ixion-thors-hammer').length,
      };
    });
    if (state.screen === 'battle') counts = { recharges: state.recharges, hammers: state.hammers };
    if (state.result) outcome = state.result;
    if (state.bannerText && /Recharge/.test(state.bannerText)) {
      bannerSeen = true;
      if (!shotBanner) { shotBanner = true; await shoot(page, '07-recharge-banner'); }
    }
    if (state.last === 'x2-ixion-thors-hammer' && !shotHammer) {
      shotHammer = true;
      await page.waitForTimeout(700);
      await shoot(page, '08-thors-hammer');
    }
    if (state.result) break;
    if (state.screen !== 'battle') {
      // Only the battle's own overlays may sit over it mid-fight; anything else means the fight is over.
      if (state.screen === 'pause') { await page.keyboard.press('Escape'); await page.waitForTimeout(400); continue; }
      break;
    }
    if (state.menuUp) {
      if (!shotMenu) { shotMenu = true; await shoot(page, '06-first-menu'); }
      const t = await playTurn(page, input);
      if (t) taken.push(t);
      await page.waitForTimeout(150);
      continue;
    }
    await page.waitForTimeout(120);
  }
  return { outcome, ...counts, taken, bannerSeen };
}

/** A cutscene line or a choice: the box's text and whether a choice is open. */
async function sceneView(page: Page): Promise<{ screen: string | undefined; text: string; choice: boolean; plate: string | null }> {
  return page.evaluate(() => ({
    screen: window.__pyrefly!.app.current?.name,
    text: document.querySelector('.dbox')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    choice: !!document.querySelector('.dbox--choice'),
    plate: (document.querySelector('.cutscene') as HTMLElement | null)?.dataset['plate'] ?? null,
  }));
}

test.describe('Chapter XVI, Ixion at Djose: listed and playable (FFX-2 only)', () => {
  for (const [label, viewport, input] of [
    ['desktop 1600x900, keys', { width: 1600, height: 900 }, 'keys'],
    ['phone 390x844, touch', { width: 390, height: 844 }, 'touch'],
  ] as const) {
    test.describe(label, () => {
      test.use({ viewport, ...(input === 'touch' ? { hasTouch: true, isMobile: true } : {}) });

      test('title, the Ixion card, prep, the fight to a win, the fall, the whistles, results, the clear on the board', async ({ page }) => {
        const thrown = await boot(page);
        await toBoard(page, input);
        const before = await board(page);
        expect(before.tiles).toBe(16);
        expect([before.beaten, before.total]).toEqual([0, 15]);

        // The Ixion card: the last playable card, one Left (or a tap on it).
        if (input === 'keys') await page.keyboard.press('ArrowLeft');
        else await confirm(page, input, `[data-card="${ID}"]`);
        await page.waitForTimeout(1200);
        expect((await board(page)).selectedId).toBe(ID);
        await shoot(page, '02-board-ixion-card');
        await confirm(page, input, input === 'touch' ? `[data-card="${ID}"]` : undefined);
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'party-prep', null, { timeout: 30_000 });
        await page.waitForTimeout(1500);
        await shoot(page, '03-prep');
        await confirm(page, input, input === 'touch' ? '.prep__start' : undefined);

        // The opening scene, by confirm presses, until the fight.
        let sawOpening = false;
        for (let i = 0; i < 60 && (await screen(page)) !== 'battle'; i++) {
          const v = await sceneView(page);
          if (v.text.includes("This can't be happening.") && !sawOpening) { sawOpening = true; await shoot(page, '04-opening-line'); }
          if (v.screen === 'cutscene') await confirm(page, input);
          await page.waitForTimeout(700);
        }
        expect(sawOpening, 'Rikku opens the fight with the game\'s own line').toBe(true);
        expect(await screen(page)).toBe('battle');
        await page.waitForTimeout(2500);
        await shoot(page, '05-field');

        const f = await fight(page, input);
        console.log(`[ixion ${tag(page)}] ${f.outcome}; ${f.taken.length} decisions by ${input}; Recharge ${f.recharges}, Hammer ${f.hammers}, banner ${f.bannerSeen}\n  ${f.taken.join('\n  ')}`);
        expect(f.outcome).toBe('victory');
        expect(f.taken.length).toBeGreaterThan(3);
        if (f.recharges > 0) expect(f.bannerSeen, 'the Recharge banner showed').toBe(true);

        // Results, then the fall, the Abyss, the four whistles, the wake; then the board.
        const seen = { results: false, fall: false, abyss: false, whistles: 0, wake: false };
        for (let i = 0; i < 260 && (await screen(page)) !== 'chapter-select'; i++) {
          const v = await sceneView(page);
          if (v.screen === 'results' && !seen.results) {
            seen.results = true;
            await page.waitForTimeout(2500);
            await shoot(page, '09-results');
          }
          if (v.text.includes('Ixion rises and charges') && !seen.fall) { seen.fall = true; await shoot(page, '10-the-fall'); }
          if (v.plate === 'ffx2-abyss-standin' && v.text.includes('Lenne') && !seen.abyss) { seen.abyss = true; await shoot(page, '11-abyss-shuyin'); }
          if (v.choice) {
            seen.whistles++;
            if (seen.whistles === 1) await shoot(page, '12-whistle-prompt');
            await confirm(page, input, input === 'touch' ? '.dbox__choice-row' : undefined);
            await page.waitForTimeout(900);
            if (seen.whistles === 4) await shoot(page, '13-fourth-whistle');
            continue;
          }
          if (v.plate === 'bevelle-underground' && v.text.includes('Bevelle Underground') && !seen.wake) { seen.wake = true; await shoot(page, '14-wake-bevelle'); }
          if (v.screen === 'cutscene' || v.screen === 'results') {
            // A phone taps the results' CONFIRM bar, or the dialogue card to advance.
            const at = v.screen === 'results' ? '.rresp__btn--lit, .rres__confirm' : '.dbox__win';
            await confirm(page, input, input === 'touch' ? at : undefined);
          }
          await page.waitForTimeout(v.screen === 'battle' ? 400 : 650);
        }
        expect(seen).toEqual({ results: true, fall: true, abyss: true, whistles: 4, wake: true });
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 60_000 });
        await page.waitForTimeout(2000);
        const after = await board(page);
        expect(after.cleared).toContain(ID);
        expect([after.beaten, after.total]).toEqual([1, 15]);
        await shoot(page, '15-board-cleared');
        expect(thrown, 'no uncaught page error').toEqual([]);
      });
    });
  }
});
