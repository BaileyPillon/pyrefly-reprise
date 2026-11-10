import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Page } from '@playwright/test';

import './pyrefly-window.ts';
import { LEAVE_ROW, PARTS, PASS_ROWS, ROW_ATTACK, ROW_CHANGE, firstPresent, nextChangeRow, type Girl, type RowPick } from './special-rows.ts';

// The chapter and part tables live in `special-rows.ts` (no playwright import), where the unit test that proves them on the real engine reads the same ones.
export { CHAPTER_OF, PARTS, type Girl } from './special-rows.ts';

/**
 * What the two Special-form end-to-end specs share (`pause-with-form.spec.ts`, `special-touch-aim.spec.ts`): an own vite dev server, a Special-on boot, and the greedy walk of one girl
 * to her Special by real keys (FFX-2 only: the three Special dresspheres exist only in FFX-2). WRITTEN in step D2 of the Special look and RUN in Stage 2, under the suite lock and with the art
 * installed: nothing in it has met a browser yet, so every wait names what it waits for and every loop has a cap that fails with a message instead of looping.
 *
 * Why an own dev server: the shared config serves the production `dist/`, where the test word `?specials=on` is compiled out (`__PYREFLY_SPECIALS__` is false); only a dev server (or a
 * test preview build) carries it. The server is stopped by its own PID.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const PORT_MIN = 5400;
const PORT_MAX = 5990;

/** The badge letters of each girl's Special. */
export const BADGE: Record<Girl, string> = { yuna: 'FF', rikku: 'MW', paine: 'FT' };
export const PLATE_NAMES: Record<Girl, readonly [string, string, string]> = {
  yuna: ['Yuna', 'Right Pistil', 'Left Pistil'],
  rikku: ['Rikku', 'Smasher-R', 'Crusher-L'],
  paine: ['Paine', 'Dextral Wing', 'Sinistral Wing'],
};

// ------------------------------------------------------------------------------------------------ the own server

export interface OwnServer {
  baseUrl: string;
  stop(): void;
}

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
  });
}

async function pickFreePort(): Promise<number> {
  for (let i = 0; i < 40; i++) {
    const port = PORT_MIN + Math.floor(Math.random() * (PORT_MAX - PORT_MIN + 1));
    if (await isFree(port)) return port;
  }
  throw new Error(`no free port found in ${PORT_MIN}-${PORT_MAX}`);
}

async function waitForServerReady(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  let lastError: unknown = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`dev server at ${url} did not answer within ${timeoutMs}ms (${String(lastError)})`);
}

/** A plain `vite` dev server of its own on a random free port; `node_modules/vite/bin/vite.js` directly, so the PID is the real server's and `stop` ends it by that PID only. */
export async function startOwnServer(): Promise<OwnServer> {
  const port = await pickFreePort();
  const baseUrl = `http://127.0.0.1:${port}/`;
  const child: ChildProcess = spawn(process.execPath, [join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServerReady(baseUrl, 240_000);
  return {
    baseUrl,
    stop: () => {
      const pid = child.pid;
      if (!pid) return;
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
      else child.kill('SIGTERM');
    },
  };
}

// ------------------------------------------------------------------------------------------------ the page

/** Poll `predicate` on the real clock until it is true; false on the cap. */
export async function waitUntil(page: Page, predicate: () => Promise<boolean>, { timeoutMs = 30_000, intervalMs = 250 }: { timeoutMs?: number; intervalMs?: number } = {}): Promise<boolean> {
  const start = Date.now();
  for (;;) {
    if (await predicate()) return true;
    if (Date.now() - start >= timeoutMs) return false;
    await page.waitForTimeout(intervalMs);
  }
}

const screenOf = (page: Page): Promise<string> => page.evaluate(() => window.__pyrefly!.screen());

/** Title, board, the chapter, party prep, the opening scene skipped, to its battle: with the Special word on and the seed fixed. Returns the page errors seen. */
export async function openChapterWithSpecials(page: Page, baseUrl: string, chapterId: string): Promise<string[]> {
  const thrown: string[] = [];
  page.on('pageerror', (e) => thrown.push(String(e)));
  await page.goto(new URL('?specials=on&coach=off', baseUrl).toString());
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
  await page.evaluate(() => window.__pyrefly!.setSeed(1));
  expect(await page.evaluate(() => window.__pyrefly!.specials()), 'the Special word is on in this build').toBe(true);
  await page.keyboard.press('Enter');
  expect(await waitUntil(page, async () => (await screenOf(page)) === 'chapter-select', { timeoutMs: 60_000, intervalMs: 400 }), 'Enter never reached chapter select').toBe(true);
  await page.evaluate((id) => window.__pyrefly!.trigger(`select:${id}`), chapterId);
  expect(await waitUntil(page, async () => (await screenOf(page)) === 'party-prep', { timeoutMs: 30_000, intervalMs: 300 }), `selecting ${chapterId} never reached party prep`).toBe(true);
  await page.evaluate(() => window.__pyrefly!.trigger('prep:begin'));
  const inBattle = await waitUntil(
    page,
    async () => {
      const s = await screenOf(page);
      if (s === 'cutscene') await page.evaluate(() => window.__pyrefly!.skipCutscene());
      return s === 'battle';
    },
    { timeoutMs: 60_000, intervalMs: 300 },
  );
  expect(inBattle, `${chapterId} never reached the battle screen`).toBe(true);
  await page.evaluate(() => window.__pyrefly!.trigger('battle:fast'));
  return thrown;
}

export interface MenuView {
  up: boolean;
  /** The plate whose command menu is open (the HUD's acting row), or null. */
  actor: string | null;
  rows: string[];
  disabled: boolean[];
  sel: number;
  title: string | null;
}

export const menuView = (page: Page): Promise<MenuView> =>
  page.evaluate(() => {
    const menu = document.querySelector('.ffx2hud__command');
    const rows = [...document.querySelectorAll('.ffx2hud__command .ig-cmd')];
    return {
      up: !!menu && rows.length > 0 && menu.getBoundingClientRect().width > 0,
      actor: document.querySelector<HTMLElement>('.ffx2hud__party .ig-stat--acting')?.dataset['actorId'] ?? null,
      rows: rows.map((r) => r.querySelector('.ffx2cmd__label')?.textContent?.trim() ?? ''),
      disabled: rows.map((r) => r.classList.contains('ig-cmd--disabled')),
      sel: rows.findIndex((r) => r.classList.contains('ig-cmd--selected')),
      title: document.querySelector('.ffx2hud__command .ffx2cmd__title')?.textContent?.trim() ?? null,
    };
  });

/** Light the row named `label` with the arrows and take it with Enter. False when the menu has no such row. */
export async function takeRow(page: Page, label: string): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    const m = await menuView(page);
    const want = m.rows.indexOf(label);
    if (want < 0) return false;
    if (m.sel === want) {
      await page.keyboard.press('Enter');
      return true;
    }
    await page.keyboard.press(want > m.sel ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(90);
  }
  return false;
}

/**
 * Open the first of `picks` that the menu shows enabled, wherever it sits: the top level, or the first submenu that lists any of them (a part's menu is one Skill submenu, the White Mage's
 * is White Magic). Returns the pick that was opened, so the caller can assert the aim it names. Throws, naming every row it saw, when none is there. The candidate lists are the tables of
 * `special-rows.ts`, which `tests/unit/special-e2e-rows.test.ts` proves on the real engine.
 */
export async function openRowAnywhere(page: Page, picks: readonly RowPick[]): Promise<RowPick> {
  const top = await menuView(page);
  const here = firstPresent(picks, top.rows, top.disabled);
  if (here) {
    expect(await takeRow(page, here.label), `${here.label} on the top list`).toBe(true);
    return here;
  }
  const seen: string[] = [`top: ${top.rows.join(' | ')}`];
  for (const row of top.rows) {
    if ([ROW_ATTACK, ROW_CHANGE].includes(row) || LEAVE_ROW.test(row)) continue;
    if (!(await takeRow(page, row))) continue;
    await page.waitForTimeout(300);
    const sub = await menuView(page);
    seen.push(`${row}: ${sub.rows.join(' | ')}`);
    const hit = firstPresent(picks, sub.rows, sub.disabled);
    if (hit) {
      expect(await takeRow(page, hit.label), `${hit.label} in ${row}`).toBe(true);
      return hit;
    }
    await page.keyboard.press('Escape'); // back to the top list of the menu
    await page.waitForTimeout(300);
  }
  throw new Error(`none of ${picks.map((p) => p.label).join(', ')} on the menu (${seen.join(' ; ')})`);
}

export const activeIds = (page: Page): Promise<string[]> => page.evaluate(() => [...(window.__pyrefly!.battleState()?.activeIds ?? [])]);

/** Wait, on the real clock, for any command menu to be open; throws with `what` on the cap. */
export async function waitForMenu(page: Page, what: string, timeoutMs = 90_000): Promise<MenuView> {
  let last: MenuView | null = null;
  const ok = await waitUntil(page, async () => ((last = await menuView(page)).up && last.actor !== null), { timeoutMs, intervalMs: 250 });
  if (!ok) throw new Error(`no command menu within ${timeoutMs} ms (${what}); screen ${await screenOf(page)}, last ${JSON.stringify(last)}`);
  return last!;
}

/**
 * The greedy walk: at each menu of `girl`, open Change; take the row labelled `... (Special)` if there is one, else the first enabled row whose dress has not been worn yet; at every other
 * plate's menu take the first of `PASS_ROWS` (Attack, or Cure on the White Mage's menu, which has no Attack row) at whatever is aimed. Ends when the engine's live list holds her two parts and
 * a menu of one of the three plates is open. Capped at `maxDecisions` menus; fails with a message that names the last menu seen, never loops.
 *
 * Known risk (found on the real engine in review fix pass 2, not fixed here): the foe's Curse shuts the Change list (every row greyed, "Cursed"); Bahamut puts it on a girl in Chapter IV
 * within the first menus at seed 1. The walk then throws with the rows it saw rather than wandering. `specialDrive.walkTo` lifts the status as a rig; this page has no such rig, and Holy Water
 * aimed at the girl is the in-game answer (a Stage 2 call; see the handoff, section 15).
 */
export async function walkToForm(page: Page, girl: Girl, maxDecisions = 60): Promise<{ decisions: string[] }> {
  const decisions: string[] = [];
  const worn = new Set<string>();
  for (let n = 0; n < maxDecisions; n++) {
    const m = await waitForMenu(page, `decision ${n} of the walk to ${girl}'s Special`);
    const ids = await activeIds(page);
    if (PARTS[girl].every((p) => ids.includes(p))) return { decisions };
    if (m.actor !== girl) {
      const pass = await openRowAnywhere(page, PASS_ROWS);
      await page.waitForTimeout(250);
      await page.keyboard.press('Enter'); // the aim opens on the sensible side (the foe for Attack, an ally for Cure): confirm it
      decisions.push(`${m.actor}: ${pass.label}`);
      await page.waitForTimeout(400);
      continue;
    }
    if (!(await takeRow(page, ROW_CHANGE))) throw new Error(`${girl}'s menu has no ${ROW_CHANGE} row: ${m.rows.join(' | ')}`);
    await page.waitForFunction((title) => document.querySelector('.ffx2hud__command .ffx2cmd__title')?.textContent?.trim() === title, ROW_CHANGE, { timeout: 3_000 }).catch(() => null);
    const change = await menuView(page);
    if (change.title !== ROW_CHANGE) throw new Error(`${girl}: the ${ROW_CHANGE} list did not open (a Curse greys it; decision ${n}): ${change.rows.join(' | ')}`);
    const next = nextChangeRow(change.rows, change.disabled, worn); // the rule is in `special-rows.ts`, where the unit test runs it on the real engine
    if (next < 0) throw new Error(`${girl}: the Change list offers no unworn dress (decision ${n}): ${change.rows.join(' | ')}`);
    worn.add(change.rows[next]!);
    decisions.push(`${girl}: Change -> ${change.rows[next]}`);
    if (!(await takeRow(page, change.rows[next]!))) throw new Error(`${girl}: could not take ${change.rows[next]}`);
    await page.waitForTimeout(600);
  }
  throw new Error(`${girl} did not reach her Special within ${maxDecisions} decisions: ${decisions.join(' ; ')}`);
}

/** Wait for the walk's end: the control back at one of the three plates, the form's flourish over. */
export async function waitForFormMenu(page: Page, girl: Girl): Promise<MenuView> {
  let last: MenuView | null = null;
  const ok = await waitUntil(page, async () => ((last = await menuView(page)).up && (last.actor === girl || PARTS[girl].includes(last.actor ?? ''))), { timeoutMs: 120_000, intervalMs: 300 });
  if (!ok) throw new Error(`the control never came back at ${girl}'s plates: ${JSON.stringify(last)}`);
  return last!;
}
