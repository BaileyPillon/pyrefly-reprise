#!/usr/bin/env node
/**
 * art-watch: a tiny auto-refreshing gallery for watching AI renders land.
 *
 *   node tools/art-watch.mjs [--port=8890]
 *
 * Node built-ins only (http, fs, path) — no dependencies, so it can be left
 * running as a detached background process or a logon scheduled task without
 * needing `npm install` first.
 *
 * On every request to `/` it rescans a fixed set of folders for `*.png`,
 * sorts everything by mtime descending, and renders the newest 80 as a dark
 * "Ink & Gold" themed card grid. Each thumbnail is served through `/img?p=`,
 * which only serves files that resolve inside one of the allowed folders.
 *
 * Folders scanned (see ROOTS below):
 *   - D:/Tools/ComfyUI/output/pyrefly        (raw renders, flat)
 *   - public/art/pause                        (pause heroes, flat)
 *   - public/art/characters/*                 (chosen cut-outs, one level
 *                                              deep, skipping *.raw.png)
 *   - public/art/portraits                    (flat)
 *   - docs/screenshots/concept                (flat)
 *   - docs/screenshots/pause                  (flat)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// --------------------------------------------------------------- args

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const PORT = Number(args.port ?? 8890);
const HOST = '127.0.0.1';

// --------------------------------------------------------------- folders

const PROJECT_ROOT = 'D:/Final Fantasy';

/**
 * mode: 'flat' scans the folder itself for *.png; 'one-level' scans each
 * immediate subfolder of `dir` for *.png (used for public/art/characters/*).
 */
const ROOTS = [
  { dir: path.resolve('D:/Tools/ComfyUI/output/pyrefly'), label: 'raw renders', mode: 'flat' },
  { dir: path.resolve(PROJECT_ROOT, 'public/art/pause'), label: 'pause heroes', mode: 'flat' },
  {
    dir: path.resolve(PROJECT_ROOT, 'public/art/characters'),
    label: 'characters',
    mode: 'one-level',
    skip: /\.raw\.png$/i,
  },
  { dir: path.resolve(PROJECT_ROOT, 'public/art/portraits'), label: 'portraits', mode: 'flat' },
  { dir: path.resolve(PROJECT_ROOT, 'docs/screenshots/concept'), label: 'concept shots', mode: 'flat' },
  { dir: path.resolve(PROJECT_ROOT, 'docs/screenshots/pause'), label: 'pause shots', mode: 'flat' },
];

const MAX_CARDS = 80;

function listPngsFlat(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !/\.png$/i.test(e.name)) continue;
    out.push(path.join(dir, e.name));
  }
  return out;
}

function listPngsOneLevel(dir, skip) {
  let subdirs;
  try {
    subdirs = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const sub of subdirs) {
    if (!sub.isDirectory()) continue;
    const subdir = path.join(dir, sub.name);
    let files;
    try {
      files = fs.readdirSync(subdir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.isFile() || !/\.png$/i.test(f.name)) continue;
      if (skip && skip.test(f.name)) continue;
      out.push(path.join(subdir, f.name));
    }
  }
  return out;
}

function scanAll() {
  const items = [];
  for (const root of ROOTS) {
    const files = root.mode === 'one-level' ? listPngsOneLevel(root.dir, root.skip) : listPngsFlat(root.dir);
    for (const filePath of files) {
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch {
        continue;
      }
      items.push({ path: filePath, label: root.label, mtimeMs: stat.mtimeMs });
    }
  }
  items.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return items.slice(0, MAX_CARDS);
}

/** True only for a path that resolves inside one of the allowed ROOTS and is a real *.png file. */
function isAllowedImagePath(rawPath) {
  if (!rawPath) return false;
  const resolved = path.resolve(rawPath);
  if (!/\.png$/i.test(resolved)) return false;
  const resolvedKey = resolved.toLowerCase();
  const allowed = ROOTS.some((root) => {
    const rootKey = root.dir.toLowerCase();
    const rootWithSep = rootKey.endsWith(path.sep) ? rootKey : rootKey + path.sep;
    return resolvedKey === rootKey || resolvedKey.startsWith(rootWithSep);
  });
  if (!allowed) return false;
  try {
    return fs.statSync(resolved).isFile();
  } catch {
    return false;
  }
}

// --------------------------------------------------------------- rendering

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeAgo(mtimeMs) {
  const diffMs = Date.now() - mtimeMs;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hr ago';
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

function renderPage(items) {
  const now = new Date();
  const cards = items
    .map((item) => {
      const filename = path.basename(item.path);
      const imgUrl = `/img?p=${encodeURIComponent(item.path)}`;
      return `      <a class="card" href="${imgUrl}" target="_blank" rel="noopener">
        <div class="thumb"><img src="${imgUrl}" loading="lazy" alt="${escapeHtml(filename)}"></div>
        <div class="meta">
          <div class="filename" title="${escapeHtml(filename)}">${escapeHtml(filename)}</div>
          <div class="folder">${escapeHtml(item.label)}</div>
          <div class="ago">${escapeHtml(timeAgo(item.mtimeMs))}</div>
        </div>
      </a>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="20">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pyrefly Reprise &middot; latest renders</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #0d0f14;
    color: #e8e6df;
    font-family: 'Chakra Petch', system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.4rem 1.5rem;
    padding: 1.25rem 1.75rem;
    border-bottom: 1px solid #23262f;
    background: linear-gradient(180deg, #14161d 0%, #0d0f14 100%);
    position: sticky;
    top: 0;
  }
  h1 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    color: #c9a227;
    letter-spacing: 0.02em;
  }
  .stats {
    color: #9a9a9a;
    font-size: 0.95rem;
    display: flex;
    gap: 1.25rem;
  }
  .stats strong { color: #c9a227; }
  main { padding: 1.5rem; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
  .card {
    display: block;
    background: #14161d;
    border: 1px solid #23262f;
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .card:hover { border-color: #c9a227; transform: translateY(-2px); }
  .thumb {
    aspect-ratio: 1 / 1;
    background: #0a0b0f repeating-conic-gradient(#12141a 0% 25%, #0a0b0f 0% 50%) 50% / 16px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .thumb img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
  .meta { padding: 0.5rem 0.65rem 0.7rem; }
  .filename {
    font-size: 0.78rem;
    font-weight: 600;
    color: #e8e6df;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .folder { font-size: 0.72rem; color: #c9a227; margin-top: 0.15rem; }
  .ago { font-size: 0.72rem; color: #7a7a7a; margin-top: 0.1rem; }
  .empty { color: #7a7a7a; padding: 3rem 1rem; text-align: center; font-size: 1rem; }
</style>
</head>
<body>
<header>
  <h1>Pyrefly Reprise &middot; latest renders</h1>
  <div class="stats">
    <span><strong id="count">${items.length}</strong> image${items.length === 1 ? '' : 's'}</span>
    <span>refreshes every 20s &middot; <span id="clock">${now.toLocaleTimeString()}</span></span>
  </div>
</header>
<main>
${items.length ? `  <div class="grid">\n${cards}\n  </div>` : '  <div class="empty">No renders found yet.</div>'}
</main>
<script>
  // Purely cosmetic client-side tick between the 20s page refreshes.
  function tick() {
    var el = document.getElementById('clock');
    if (el) el.textContent = new Date().toLocaleTimeString();
  }
  setInterval(tick, 1000);
</script>
</body>
</html>
`;
}

// --------------------------------------------------------------- server

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  } catch {
    res.writeHead(400);
    res.end('bad request');
    return;
  }

  if (url.pathname === '/img') {
    const p = url.searchParams.get('p');
    if (!isAllowedImagePath(p)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('forbidden');
      return;
    }
    const resolved = path.resolve(p);
    fs.readFile(resolved, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      });
      res.end(data);
    });
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const items = scanAll();
    const html = renderPage(items);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    });
    res.end(html);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, HOST, () => {
  console.log(`[art-watch] listening on http://${HOST}:${PORT}/`);
});
