/**
 * D-196: a Sensor-immune target gets no plate at all — real keys, on a
 * production build.
 *
 * `research/ffx-yojimbo.md` §2, "Scan and Sensor show nothing": aiming at
 * Yojimbo (`immune-to-sensor`, `src/data/ffx/enemies/yojimbo.ts`) used to
 * open `.ffx-sensor` with his name, a `? ? ?` HP line and a "SENSOR FAILED"
 * caption. `SensorPanel.open()` now refuses a Sensor-immune target outright
 * (`docs/target/decisions.json` D-196 + its correction), so aiming at him
 * opens nothing. Everything else is unchanged, checked here against a normal
 * target in the same chapter's own command menu.
 *
 * FFX only [AGENTS.md rule 14]: `.ffx-sensor` and `immunityFlags` are FFX's;
 * FFX-2 puts an enemy's read-out on the boss gauge strip instead
 * (`tests/unit/ui-sensor-steer.test.ts`).
 *
 * **Its own production build and preview server**, never the shared `dist/`
 * (AGENTS.md "Shared working tree"): `npx vite build --outDir .dist-sensor-tmp`
 * once in `beforeAll`, served by `vite preview` on a free port between 5885
 * and 5889 as the brief asked, torn down by PID in `afterAll`. Real keys
 * throughout past the debug API's screen-navigation shortcuts, the same
 * convention `tests/e2e/intent-pause.spec.ts` documents.
 */

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

test.beforeEach(() => {
  test.setTimeout(300_000);
});

// --------------------------------------------------------- the own server

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const OUT_DIR = '.dist-sensor-tmp';
const PORT_MIN = 5885;
const PORT_MAX = 5889;
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

async function pickFreePort(): Promise<number> {
  for (let port = PORT_MIN; port <= PORT_MAX; port++) {
    if (await isFree(port)) return port;
  }
  throw new Error(`no free port in ${PORT_MIN}-${PORT_MAX}`);
}

async function waitForServerReady(url: string, timeoutMs = 45_000): Promise<void> {
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
  throw new Error(`preview server at ${url} did not answer within ${timeoutMs}ms (${String(lastError)})`);
}

test.beforeAll(async () => {
  test.setTimeout(300_000);
  const port = await pickFreePort();
  baseUrl = `http://127.0.0.1:${port}${BASE}`;
  server = spawn(
    process.execPath,
    [
      join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
      'preview',
      '--outDir',
      OUT_DIR,
      '--port',
      String(port),
      '--strictPort',
      '--host',
      '127.0.0.1',
    ],
    { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  await waitForServerReady(baseUrl, 240_000);
});

test.afterAll(() => {
  const pid = server?.pid;
  if (!pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  else server?.kill('SIGTERM');
  server = null;
});

const url = (path = ''): string => {
  const u = new URL(path, baseUrl);
  u.searchParams.set('coach', 'off'); // no teaching overlay over the plate this spec probes
  return u.toString();
};

const screenOf = (page: Page): Promise<string> => page.evaluate(() => window.__pyrefly!.screen());

async function waitUntil(
  page: Page,
  predicate: () => Promise<boolean>,
  { timeoutMs = 30_000, intervalMs = 250 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<boolean> {
  const start = Date.now();
  for (;;) {
    if (await predicate()) return true;
    if (Date.now() - start >= timeoutMs) return false;
    await page.waitForTimeout(intervalMs);
  }
}

/** Title -> chapter select -> prep -> `chapterId`'s battle. Real screen changes throughout. */
async function enterChapter(page: Page, chapterId: string): Promise<void> {
  await page.goto(url());
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 45_000 });
  await page.evaluate(() => window.__pyrefly!.setSeed(1));
  await page.keyboard.press('Enter');
  const atChapterSelect = await waitUntil(page, async () => (await screenOf(page)) === 'chapter-select', {
    timeoutMs: 60_000,
    intervalMs: 400,
  });
  expect(atChapterSelect, 'Enter never reached chapter select').toBe(true);

  await page.evaluate((id) => window.__pyrefly!.trigger(`select:${id}`), chapterId);
  const atPrep = await waitUntil(page, async () => (await screenOf(page)) === 'party-prep', {
    timeoutMs: 30_000,
    intervalMs: 300,
  });
  expect(atPrep, `selecting ${chapterId} never reached party prep`).toBe(true);

  await page.evaluate(() => window.__pyrefly!.trigger('prep:begin'));
  const reachedBattle = await waitUntil(
    page,
    async () => {
      const s = await screenOf(page);
      if (s === 'cutscene') await page.evaluate(() => window.__pyrefly!.skipCutscene());
      return s === 'battle';
    },
    { timeoutMs: 60_000, intervalMs: 300 },
  );
  expect(reachedBattle, `${chapterId} never reached the battle screen`).toBe(true);
}

interface Look {
  awaitingMenu: boolean | null;
}

const look = (page: Page): Promise<Look> =>
  page.evaluate(() => {
    const battle = window.__pyrefly!.battle();
    const b = (battle?.snapshot() ?? {}) as Record<string, never>;
    const playback = (b['playback'] ?? null) as { awaitingMenu?: boolean } | null;
    return { awaitingMenu: playback?.awaitingMenu ?? null };
  });

async function waitForCommandMenu(page: Page): Promise<void> {
  await page.evaluate(() => window.__pyrefly!.trigger('battle:fast'));
  const ok = await waitUntil(page, async () => Boolean((await look(page)).awaitingMenu), {
    timeoutMs: 90_000,
    intervalMs: 300,
  });
  if (!ok) throw new Error('the battle never reached a command menu');
  await page.evaluate(() => window.__pyrefly!.trigger('battle:normal'));
}

interface SensorProbe {
  present: boolean;
  hidden: boolean;
  text: string;
  hasFailedCaption: boolean;
  hasName: boolean;
  hasHp: boolean;
}

const sensorProbe = (page: Page): Promise<SensorProbe> =>
  page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-role="sensor-panel"]');
    if (!el) return { present: false, hidden: true, text: '', hasFailedCaption: false, hasName: false, hasHp: false };
    return {
      present: true,
      hidden: el.hidden === true,
      text: el.textContent ?? '',
      hasFailedCaption: el.querySelector('.ffx-sensor__failed') !== null,
      hasName: el.querySelector('.ffx-sensor__name') !== null,
      hasHp: el.querySelector('.ffx-sensor__hp') !== null,
    };
  });

/** Real keys: Enter selects the highlighted (first) command row, opening the target picker. */
async function openTargetingOnFirstCandidate(page: Page): Promise<void> {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
}

for (const viewport of [
  { width: 1600, height: 900 },
  { width: 390, height: 844 },
] as const) {
  test.describe(`at ${viewport.width}x${viewport.height}`, () => {
    test('Chapter IX: aiming Attack at Yojimbo opens no Sensor plate at all', async ({ page }) => {
      await page.setViewportSize(viewport);
      await enterChapter(page, 'yojimbo-cavern');
      await waitForCommandMenu(page);

      // Boss-first (`yojimboGroup.enemies = [yojimbo, ginnem, daigoro]`,
      // `turnQueue.ts#tieBreakRank`): the target picker's first candidate is
      // Yojimbo himself.
      await openTargetingOnFirstCandidate(page);
      const probe = await sensorProbe(page);
      expect(probe.hidden, 'the Sensor plate must not be shown for a Sensor-immune target').toBe(true);
      expect(probe.hasFailedCaption, 'no "SENSOR FAILED" caption either').toBe(false);
      expect(probe.hasName).toBe(false);
      expect(probe.hasHp).toBe(false);
      expect(probe.text).not.toContain('Yojimbo');
    });

    test('a normal FFX target still opens the Sensor plate exactly as before', async ({ page }) => {
      await page.setViewportSize(viewport);
      await enterChapter(page, 'seymour-flux');
      await waitForCommandMenu(page);

      await openTargetingOnFirstCandidate(page);
      const probe = await sensorProbe(page);
      expect(probe.present).toBe(true);
      expect(probe.hidden, 'a normal target opens the plate').toBe(false);
      expect(probe.hasName).toBe(true);
      expect(probe.hasFailedCaption, 'a normal target never gets the old "SENSOR FAILED" tail').toBe(false);
      // Scanned already (this chapter's party carries Sensor, so the target
      // was auto-revealed at battle start) or not: either way this is the
      // unchanged "one enemy-health presentation" contract
      // (`tests/unit/ui-ffx-enemy-plate.test.ts`) — a real HP figure or the
      // "? ? ?" placeholder, never the immune target's "no plate at all".
      expect(probe.hasHp).toBe(true);
      expect(probe.text.includes('? ? ?') || /\d+\s*\/\s*\d+/.test(probe.text)).toBe(true);
    });
  });
}
