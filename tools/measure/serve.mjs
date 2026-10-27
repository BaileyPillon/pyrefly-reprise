// A read-only static server for a built candidate, started IN the tool's own process (motion-fluidity pass, lane L5; both games, tooling).
//
// The measuring tools play a built bundle (`dist-gate` of a review's candidate, or any `dist`), never a dev server and never a new production build: one build, many address words (each look variant of the pass is
// an address word whose default is today). Serving from inside the tool means there is no second process to leave behind (a Vite server on the default config holds 1.1 GB and 93,000 file watches even idle; AGENTS.md
// "Stop the servers you start"): it ends with the tool, and `close()` ends it earlier. It serves files under the folder only (a path that leaves it is a 403), with byte ranges (the audio is read in ranges),
// and `index.html` for a path with no file (the game is one page). It writes nothing.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
});

/** The file a request path names under `root`, or null when it leaves the root. Pure. */
export function resolveUnder(root, urlPath) {
  const clean = decodeURIComponent(String(urlPath).split('?')[0].split('#')[0]);
  const abs = path.resolve(root, `.${clean.startsWith('/') ? clean : `/${clean}`}`);
  const rootAbs = path.resolve(root);
  return abs === rootAbs || abs.startsWith(rootAbs + path.sep) ? abs : null;
}

/** Parse `Range: bytes=a-b` for a file of `size` bytes: `{start, end}` or null (whole file) or 'bad'. Pure. */
export function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header ?? '').trim());
  if (!m) return null;
  let start = m[1] === '' ? NaN : Number(m[1]);
  let end = m[2] === '' ? NaN : Number(m[2]);
  if (Number.isNaN(start) && Number.isNaN(end)) return 'bad';
  if (Number.isNaN(start)) { start = Math.max(0, size - end); end = size - 1; } else if (Number.isNaN(end) || end >= size) end = size - 1;
  return start > end || start >= size ? 'bad' : { start, end };
}

/**
 * Serve `root` on 127.0.0.1. Resolves `{ base, port, close }`; `base` ends with a slash.
 * @param {string} root the built folder
 * @param {{ port?: number }} [o] port 0 (default) picks a free one
 */
export function serveDist(root, { port = 0 } = {}) {
  if (!fs.existsSync(path.join(root, 'index.html'))) return Promise.reject(new Error(`${root} has no index.html: not a built candidate`));
  const server = http.createServer((req, res) => {
    try {
      let file = resolveUnder(root, req.url ?? '/');
      if (!file) { res.writeHead(403).end('outside the root'); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) file = path.join(root, 'index.html');
      const stat = fs.statSync(file);
      const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
      const range = parseRange(req.headers.range, stat.size);
      const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
      if (range === 'bad') { res.writeHead(416, { ...base, 'Content-Range': `bytes */${stat.size}` }).end(); return; }
      if (range) {
        res.writeHead(206, { ...base, 'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}`, 'Content-Length': range.end - range.start + 1 });
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(file, { start: range.start, end: range.end }).pipe(res);
        return;
      }
      res.writeHead(200, { ...base, 'Content-Length': stat.size });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).pipe(res);
    } catch (e) {
      res.writeHead(500).end(String(e).slice(0, 200));
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const p = server.address().port;
      resolve({ base: `http://127.0.0.1:${p}/`, port: p, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) });
    });
  });
}
