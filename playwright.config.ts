import { defineConfig, devices } from '@playwright/test';

/**
 * Headless Chromium with SwiftShader so WebGL works without a GPU.
 * Keep these args in sync with tools/screenshot.mjs.
 */
export const CHROMIUM_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-gpu-sandbox',
];

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
