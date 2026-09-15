#!/usr/bin/env node
/**
 * Headless screenshot tool.
 *
 *   node tools/screenshot.mjs --out=docs/screenshots/00-demo-scene.png
 *   node tools/screenshot.mjs --screen=demo --frames=90 --out=shot.png
 *   node tools/screenshot.mjs --url=http://localhost:5173/ --out=shot.png
 *
 * With no --url it builds nothing but starts its own `vite preview` on
 * --port (default 4319) and shuts it down again afterwards, so it needs
 * `npm run build` to have produced dist/ first.
 *
 * Flags:
 *   --url=       page to load; skips the preview server
 *   --out=       PNG path (default docs/screenshots/shot.png)
 *   --screen=    calls window.__pyrefly.goto(name) after boot
 *   --frames=    frames to wait after goto (default 60)
 *   --width=     viewport width  (default 1600)
 *   --height=    viewport height (default 900)
 *   --port=      preview port (default 4319)
 *   --timeout=   ms to wait for __pyreflyReady (default 30000)
 *   --headed     run with a visible browser (debugging)
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

/** SwiftShader flags; without these Chromium has no GPU in CI and renders black. */
export const CHROMIUM_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-gpu-sandbox',
];

function parseArgs(argv) {
  const out = { _: [] };
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      out[key] = value === undefined ? true : value;
    } else {
      out._.push(arg);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const PORT = Number(args.port ?? process.env.PREVIEW_PORT ?? 4319);
const OUT = resolve(process.cwd(), String(args.out ?? 'docs/screenshots/shot.png'));
const WIDTH = Number(args.width ?? 1600);
const HEIGHT = Number(args.height ?? 900);
const FRAMES = Number(args.frames ?? 60);
const READY_TIMEOUT = Number(args.timeout ?? 30000);
/** Mirrors vite.config.ts: preview serves the build under its production base. */
const BASE = process.env.BASE_PATH ?? '/pyrefly-reprise/';

function probePort(port, host = '127.0.0.1') {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ port, host });
    const finish = (ok) => {
      socket.destroy();
      resolvePromise(ok);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(700, () => finish(false));
  });
}

async function waitForPort(port, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probePort(port)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/** True when whatever answers on `port` is this game (and not another project). */
async function isOurServer(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}${BASE}`, { redirect: 'follow' });
    if (!res.ok) return false;
    const html = await res.text();
    return html.includes('Pyrefly Reprise') && html.includes('id="game"');
  } catch {
    return false;
  }
}

/** First port at or after `start` that nothing is listening on. */
async function findFreePort(start, tries = 25) {
  for (let p = start; p < start + tries; p++) {
    if (!(await probePort(p))) return p;
  }
  throw new Error(`no free port in ${start}..${start + tries}`);
}

async function startPreview(requestedPort) {
  let port = requestedPort;
  if (await probePort(port)) {
    if (await isOurServer(port)) {
      console.log(`[screenshot] reusing the Pyrefly preview already on :${port}`);
      return { url: `http://127.0.0.1:${port}${BASE}`, stop: async () => {} };
    }
    port = await findFreePort(requestedPort + 1);
    console.log(`[screenshot] :${requestedPort} is taken by another server, using :${port}`);
  }

  console.log(`[screenshot] starting vite preview on :${port}`);
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
  );

  let log = '';
  child.stdout.on('data', (d) => (log += d.toString()));
  child.stderr.on('data', (d) => (log += d.toString()));

  const up = await waitForPort(port);
  if (!up) {
    child.kill();
    throw new Error(`vite preview never came up on :${port}\n${log}`);
  }

  return {
    url: `http://127.0.0.1:${port}${BASE}`,
    stop: async () => {
      child.kill();
      await new Promise((r) => setTimeout(r, 200));
    },
  };
}

async function main() {
  const server = args.url ? null : await startPreview(PORT);
  const url = String(args.url ?? server.url);

  const browser = await chromium.launch({
    headless: !args.headed,
    args: CHROMIUM_ARGS,
  });

  const consoleErrors = [];
  let exitCode = 0;

  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    console.log(`[screenshot] loading ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: READY_TIMEOUT });

    await page.waitForFunction(() => window.__pyreflyReady === true, null, {
      timeout: READY_TIMEOUT,
    });

    const renderer = await page.evaluate(() => {
      const canvas = document.querySelector('#game canvas');
      const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
      if (!gl) return 'no-webgl-context';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
    });
    console.log(`[screenshot] webgl renderer: ${renderer}`);

    if (args.screen) {
      const ok = await page.evaluate((name) => window.__pyrefly.goto(name), String(args.screen));
      if (!ok) throw new Error(`unknown screen "${args.screen}"`);
      console.log(`[screenshot] switched to screen "${args.screen}"`);
    }

    await page.evaluate(async (n) => {
      for (let i = 0; i < n; i++) await window.__pyrefly.frame();
    }, FRAMES);
    // Let CSS transitions (the fade) finish too.
    await page.waitForTimeout(600);
    await page.evaluate(async () => {
      for (let i = 0; i < 12; i++) await window.__pyrefly.frame();
    });

    await mkdir(dirname(OUT), { recursive: true });
    const buffer = await page.screenshot({ type: 'png' });
    await writeFile(OUT, buffer);
    console.log(`[screenshot] wrote ${OUT} (${WIDTH}x${HEIGHT}, ${buffer.length} bytes)`);

    if (consoleErrors.length) {
      console.error(`[screenshot] ${consoleErrors.length} console error(s):`);
      for (const e of consoleErrors) console.error('  ' + e);
      exitCode = 1;
    }
  } catch (err) {
    console.error('[screenshot] failed:', err);
    if (consoleErrors.length) {
      console.error('[screenshot] console output before the failure:');
      for (const e of consoleErrors) console.error('  ' + e);
    }
    exitCode = 1;
  } finally {
    await browser.close();
    if (server) await server.stop();
  }

  process.exit(exitCode);
}

main();
