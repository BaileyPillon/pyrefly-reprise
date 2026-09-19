import { defineConfig, devices } from '@playwright/test';
import { currentChromiumArgs, resolveBrowserMode } from './tools/browser-mode.mjs';

/**
 * Headless Chromium launch args. SwiftShader (software WebGL) by default, so
 * results are identical on this machine, CI or another dev's laptop. Set
 * PYREFLY_BROWSER=gpu to use the real GPU instead — much faster locally, but
 * never for pixel-exact goldens. See docs/DEV.md "Fast browser" for the
 * measured numbers and caveats. Keep tools/screenshot.mjs's copy in sync if
 * you change the SwiftShader set (it does not import this file, to stay
 * dependency-free of playwright.config.ts).
 */
export const CHROMIUM_ARGS: string[] = [...currentChromiumArgs()];

/** For anything that wants to log or assert which mode a run used. */
export const BROWSER_MODE = resolveBrowserMode();

/**
 * Preview port. 4173 (Vite's default) is deliberately avoided because it is a
 * common squatter; override with PREVIEW_PORT if 4319 is taken too.
 */
const PORT = Number(process.env.PREVIEW_PORT ?? 4319);
/** Mirrors vite.config.ts: preview serves the build under its production base. */
const BASE = process.env.BASE_PATH ?? '/pyrefly-reprise/';
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: `${ORIGIN}${BASE}`,
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
        deviceScaleFactor: 1,
        launchOptions: { args: CHROMIUM_ARGS },
      },
    },
  ],

  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `${ORIGIN}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
