#!/usr/bin/env node
/**
 * CAMERA LAB: a tiny static server for `dist-lab/` (a test harness; D-318).
 *
 *   node tools/lab/serve-lab.mjs [--port 5270] [--prefix /x/y/] [--csp] [--open] [--public <dir>]
 *
 * Serves the bundle under `--prefix` (default `/`), wrapping `index.html` (a fragment) in the same
 * document shell the artifact publisher adds. `--csp` sends the publisher's same-origin policy, so
 * a run here proves the page needs nothing else. `--open` opens the default browser at the lab.
 * `--public <dir>` serves any file the bundle lacks from that folder (the launcher points it at the
 * worktree's `public/`, so a reserve switched in or another dressphere still finds its painting).
 * Used by `play-camera-lab.cmd`; stops when its window closes (Ctrl+C).
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? process.argv[i + 1] : d;
};
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist-lab');
const port = Number(arg('--port', '5270'));
let prefix = arg('--prefix', '/');
if (!prefix.endsWith('/')) prefix += '/';
const csp = process.argv.includes('--csp');
const publicDir = process.argv.includes('--public') ? resolve(arg('--public', 'public')) : null;
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:";
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};
const SHELL_HEAD = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>';
const SHELL_TAIL = '</body></html>';

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No dist-lab/index.html under ${root}: run node tools/lab/build-lab.mjs first.`);
  process.exit(1);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const headers = csp ? { 'Content-Security-Policy': CSP } : {};
  if (!url.pathname.startsWith(prefix)) {
    res.writeHead(302, { Location: prefix });
    return void res.end();
  }
  let rel = decodeURIComponent(url.pathname.slice(prefix.length));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  let file = normalize(join(root, rel));
  if (publicDir && rel !== 'index.html' && (!existsSync(file) || !statSync(file).isFile())) {
    const alt = normalize(join(publicDir, rel));
    if (alt.startsWith(publicDir) && existsSync(alt)) file = alt;
  }
  const inside = file.startsWith(root) || (publicDir !== null && file.startsWith(publicDir));
  if (!inside || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain', ...headers });
    return void res.end('not found');
  }
  if (rel === 'index.html') {
    res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store', ...headers });
    return void res.end(SHELL_HEAD + readFileSync(file, 'utf8') + SHELL_TAIL);
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', ...headers });
  createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  const at = `http://127.0.0.1:${port}${prefix}`;
  console.log(`Camera lab (test build) at ${at}${csp ? ' with the publisher CSP' : ''}. Close this window to stop it.`);
  if (process.argv.includes('--open')) exec(process.platform === 'win32' ? `start "" "${at}"` : `xdg-open "${at}"`);
});
