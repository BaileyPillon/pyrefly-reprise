/**
 * Hotfix 24: Grand Summon summons the aeon the player picks, and the party
 * leaves the field while it is out. Real keys, on a production build.
 *
 * Bailey, 2026-09-27, Chapter IX: "i tried my overdrive and i think valefor
 * came out i had yuna selected ... my whole party was still there"
 * (`docs/plans/valefor-overdrive-bug-2026-09-27.md`, S1 and S3). The picker
 * threw on its first render, so Valefor came out every time; and the stage
 * kept the three party figures standing in front of the aeon.
 *
 * Setup only through the debug API: the seed, the chapter (cutscenes skipped)
 * and Yuna's gauge set to 100 at the first menu, so her next menu is built with
 * it. Everything after that is real keys: the other members Attack, Yuna opens
 * Overdrive, Grand Summon, moves to the **3rd row** and confirms; the aeon's own
 * menu Dismisses it. In IX, Escape first backs out of the picker (Yuna's menu
 * again, no aeon, the gauge kept, and the second pick opens the picker again
 * rather than rolling a default); in X, the cursor first visits the 5th row,
 * which must scroll into sight (the list shows four).
 *
 * FFX only [AGENTS.md rule 14]: Grand Summon and aeons exist only in the FFX
 * chapters.
 *
 * Its own production build and preview server, never the shared `dist/`:
 * `npx vite build --outDir .dist-hotfix24-tmp` (built here when missing),
 * served on a free port in 7100-7109 and stopped by PID in `afterAll`. Frames
 * go to the test's output folder, or to `docs/screenshots/hotfix-24/` with
 * `HOTFIX24_SHOTS=1`.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page, type TestInfo } from '@playwright/test';

import './support/pyrefly-window.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const OUT_DIR = '.dist-hotfix24-tmp';
const PORT_MIN = 7100;
const PORT_MAX = 7109;
const BASE = process.env['BASE_PATH'] ?? '/pyrefly-reprise/';

let server: ChildProcess | null = null;
let baseUrl = '';

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
  });
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(5_000) })).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview at ${url} did not answer within ${timeoutMs} ms`);
}

test.beforeAll(async () => {
  test.setTimeout(600_000);
  const vite = join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(join(REPO_ROOT, OUT_DIR, 'index.html'))) {
    const built = spawnSync(process.execPath, [vite, 'build', '--outDir', OUT_DIR], { cwd: REPO_ROOT, stdio: 'inherit' });
    if (built.status !== 0) throw new Error('the production build failed');
  }
  let port = 0;
  for (let p = PORT_MIN; p <= PORT_MAX && !port; p++) if (await isFree(p)) port = p;
  if (!port) throw new Error(`no free port in ${PORT_MIN}-${PORT_MAX}`);
  baseUrl = `http://127.0.0.1:${port}${BASE}`;
  server = spawn(process.execPath, [vite, 'preview', '--outDir', OUT_DIR, '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer(baseUrl, 240_000);
});

test.afterAll(() => {
  const pid = server?.pid;
  if (pid && process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  else server?.kill('SIGTERM');
  server = null;
});

test.beforeEach(() => {
  test.setTimeout(360_000);
});

// ------------------------------------------------------------------ probes

const phase = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const b = window.__pyrefly!.battle() as unknown as { presenter?: { snapshot(): { phase?: string } } } | null;
    return b?.presenter?.snapshot().phase ?? '';
  });

const selected = (page: Page): Promise<string> =>
  page.evaluate(() => document.querySelector('.ig-cmd--selected')?.textContent?.trim() ?? '');

interface Field {
  aeonId: string | null;
  party: Record<string, number>;
  aeonAlpha: number | null;
  rows: string[];
}

/** The party figures' alpha, the aeon's, and the status rows' names. */
const field = (page: Page): Promise<Field> =>
  page.evaluate(() => {
    type Stage = { staged(): string[]; sideOf(id: string): string | undefined; actor(id: string): { alpha: number } | undefined };
    const stage = (window.__pyrefly!.battle() as unknown as { stage: Stage }).stage;
    const state = window.__pyrefly!.battleState();
    const party: Record<string, number> = {};
    let aeonAlpha: number | null = null;
    for (const id of stage.staged()) {
      const alpha = Math.round((stage.actor(id)?.alpha ?? -1) * 100) / 100;
      if (id === state?.aeonId) aeonAlpha = alpha;
      else if (stage.sideOf(id) === 'party') party[id] = alpha;
    }
    const rows = [...document.querySelectorAll('.ig-stat')].map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim());
    return { aeonId: state?.aeonId ?? null, party, aeonAlpha, rows };
  });

async function until<T>(page: Page, read: () => Promise<T>, ok: (v: T) => boolean, timeoutMs: number, label: string): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = await read();
    if (ok(v)) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`${label}: gave up after ${timeoutMs} ms (last: ${JSON.stringify(v)})`);
    await page.waitForTimeout(120);
  }
}

async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
  const dir = process.env['HOTFIX24_SHOTS'] === '1' ? join(REPO_ROOT, 'docs', 'screenshots', 'hotfix-24') : info.outputPath();
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `${name}.jpg`), type: 'jpeg', quality: 74 });
}

/** Move the command cursor to the row matching `re`, with real ArrowDown presses. */
async function cursorTo(page: Page, re: RegExp, label: string): Promise<void> {
  for (let i = 0; i < 14 && !re.test(await selected(page)); i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(130);
  }
  expect(await selected(page), label).toMatch(re);
}

// ------------------------------------------------------------------- flow

async function grandSummonThirdRow(page: Page, info: TestInfo, chapterId: string, tag: string, backOutFirst = false, peekFifth = false): Promise<void> {
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /overlay failed|minigame/i.test(m.text())) consoleErrors.push(m.text());
  });
  await page.goto(`${baseUrl}?coach=off`);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180_000 });
  await page.evaluate((id) => {
    const P = window.__pyrefly!;
    P.setMuted(true);
    P.markCoachSeen();
    P.setSeed(1);
    void P.gotoChapter(id as never, { skipCutscenes: true });
  }, chapterId);

  // Setup only: Yuna's gauge to 100 at the first menu, so her next menu offers Grand Summon.
  await until(page, () => phase(page), (p) => p.startsWith('command:'), 180_000, 'first command menu');
  const filled = await page.evaluate(() => {
    const yuna = window.__pyrefly!.battleState()?.combatants['yuna'] as { overdrive?: { gauge: number } } | undefined;
    if (!yuna?.overdrive) return false;
    yuna.overdrive.gauge = 100;
    return true;
  });
  expect(filled, 'Yuna has an Overdrive gauge').toBe(true);
  let skipFirst = true;

  // Real keys: everyone else Attacks until Yuna's menu opens with the full gauge.
  for (let turn = 0; turn < 12; turn++) {
    const p = await until(page, () => phase(page), (v) => v.startsWith('command:'), 120_000, 'a command menu');
    await page.waitForTimeout(450);
    if (p === 'command:yuna' && !skipFirst) break;
    skipFirst = false;
    await cursorTo(page, /^attack/i, 'Attack row');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await until(page, () => phase(page), (v) => !v.startsWith('command:'), 20_000, 'the attack leaves the menu');
  }
  expect(await phase(page)).toBe('command:yuna');
  await shot(page, info, `${tag}-1-yuna-menu`);

  const openPicker = async (): Promise<string[]> => {
    await cursorTo(page, /overdrive|grand/i, 'Overdrive row');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    if (/grand/i.test(await selected(page))) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
    }
    // The picker is open and lists the roster by name.
    return until(
      page,
      () => page.evaluate(() => [...document.querySelectorAll('.ffx-mg-list__row')].map((r) => r.firstChild?.textContent ?? '')),
      (v) => v.length >= 3,
      10_000,
      'the Grand Summon list',
    );
  };
  let listed = await openPicker();
  if (backOutFirst) {
    // Escape in the picker: Yuna's own menu again, no aeon, the gauge kept; the next pick asks again.
    await page.keyboard.press('Escape');
    await until(page, () => phase(page), (v) => v === 'command:yuna', 10_000, "back to Yuna's menu");
    await until(page, () => page.evaluate(() => document.querySelectorAll('.ffx-mg-list__row').length), (n) => n === 0, 5_000, 'the picker closed');
    const kept = await page.evaluate(() => {
      const s = window.__pyrefly!.battleState();
      return { aeon: s?.aeonId ?? null, gauge: (s?.combatants['yuna'] as { overdrive?: { gauge: number } } | undefined)?.overdrive?.gauge };
    });
    expect(kept).toEqual({ aeon: null, gauge: 100 });
    await page.waitForTimeout(450);
    await shot(page, info, `${tag}-1b-backed-out-menu`);
    listed = await openPicker();
  }
  const step = async (key: string, n: number): Promise<void> => {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(170);
    }
  };
  if (peekFifth && listed.length >= 5) {
    // The list shows four rows; the fifth (Bahamut) must scroll into sight when the cursor reaches it.
    await step('ArrowDown', 4);
    const inView = await page.evaluate(() => {
      const list = document.querySelector('.ffx-mg-list')?.getBoundingClientRect();
      const row = document.querySelector('.ffx-mg-list__row--selected')?.getBoundingClientRect();
      return !!list && !!row && row.top >= list.top - 1 && row.bottom <= list.bottom + 1;
    });
    expect(inView, `the 5th row (${listed[4]}) is in sight under the cursor`).toBe(true);
    await shot(page, info, `${tag}-2a-fifth-row-in-view`);
    await step('ArrowUp', 2);
  } else {
    await step('ArrowDown', 2);
  }
  const onRow = await page.evaluate(() => document.querySelector('.ffx-mg-list__row--selected')?.firstChild?.textContent ?? '');
  expect(onRow).toBe(listed[2]);
  await shot(page, info, `${tag}-2-picker-third-row`);
  await page.keyboard.press('Enter');

  const want = (listed[2] ?? '').toLowerCase();
  const out = await until(page, () => field(page), (f) => f.aeonId !== null, 12_000, 'an aeon on the field');
  expect(out.aeonId, `the 3rd row (${listed[2]}) is summoned, not Valefor`).toBe(want);
  await page.waitForTimeout(300);
  await shot(page, info, `${tag}-3-summon-moment`);

  // S3: the party fades off (alpha 0), the aeon stands alone, the rows are the aeon's.
  const alone = await until(
    page,
    () => field(page),
    (f) => Object.values(f.party).every((a) => a === 0) && f.aeonAlpha === 1,
    8_000,
    'the party off the field',
  );
  expect(Object.keys(alone.party).length).toBeGreaterThan(0);
  expect(alone.rows).toHaveLength(1);
  expect(alone.rows[0]?.toLowerCase()).toContain(want);
  await until(page, () => phase(page), (v) => v === `command:${want}`, 120_000, "the aeon's menu");
  await page.waitForTimeout(450);
  await shot(page, info, `${tag}-4-aeon-alone-menu`);

  // Dismiss with real keys brings the party back.
  await cursorTo(page, /dismiss/i, 'Dismiss row');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  if ((await phase(page)).startsWith('command:')) await page.keyboard.press('Enter'); // a target step, if one opens
  const back = await until(
    page,
    () => field(page),
    (f) => f.aeonId === null && Object.values(f.party).length > 0 && Object.values(f.party).every((a) => a === 1),
    15_000,
    'the party back after Dismiss',
  );
  // The rows follow once the Dismiss beat has played (the HUD syncs after the burst).
  const rowsBack = await until(page, () => field(page), (f) => f.rows.length === Object.keys(back.party).length, 15_000, 'the party rows back');
  expect(rowsBack.rows.some((r) => r.toLowerCase().includes(want))).toBe(false);
  await page.waitForTimeout(300);
  await shot(page, info, `${tag}-5-party-back`);

  const log = await page.evaluate(() => window.__pyrefly!.battleLog().filter((e) => e.type === 'summon' || e.type === 'dismiss'));
  expect(log.map((e) => ('aeonId' in e ? `${e.type}:${String(e.aeonId)}` : e.type))).toContain(`summon:${want}`);
  expect(consoleErrors, 'no overlay failure on the console').toEqual([]);
}

test('Chapter IX: Escape backs out to the menu; then Grand Summon, 3rd row, that aeon comes out alone; Dismiss brings the party back', async ({ page }, info) => {
  await grandSummonThirdRow(page, info, 'yojimbo-cavern', 'ch09', true);
});

test('Chapter X: the same with real keys, the 5th row scrolled into sight on the way', async ({ page }, info) => {
  await grandSummonThirdRow(page, info, 'seymour-natus', 'ch10', false, true);
});
