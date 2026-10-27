#!/usr/bin/env node
/**
 * A STATIC SERVER OVER SEVERAL ROOTS, for timing a lean build against a full build's art (post-conference lane "post-fight-start", both games; tooling only, nothing ships).
 *
 *   node tools/overlay-static.mjs --port=5604 --root=<lean dist> --root=<full build with the art> [--quiet]
 *
 * A path is looked for in the first root, then the next: `tools/lean-vite.config.mts` writes only `index.html` and `assets/`, and the art, audio, fonts and depth maps come from the
 * second root (the live artifact, `D:/pyrefly-release55/dist-release`, or any build of the same art). Read-only: nothing is written to a root.
 *
 * It answers as the Cloudflare site does (`dist-release/_headers`): `/assets/*` is `public, max-age=31536000, immutable`; everything else is `public, max-age=0, must-revalidate`
 * with an ETag and a 304 on a matching `If-None-Match`, so a second visit in one browser context revalidates the art exactly as the live site's does. Range requests are answered (audio).
 *
 * `index.html` from the first root has its painted-art names made as a full build writes them: a `art/....png` the second root does not hold but holds as `.webp` (the title plate's preload
 * hint) is rewritten to the file that is served, the rule `tools/art-derive-plugin.mjs` `closeBundle` applies to the written page.
 *
 * `GET /__overlay/stop` ends the process (for a script that started it); Bash `taskkill /PID <pid>` works as well. Binds 127.0.0.1 only.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const argv = process.argv.slice(2);
const flag = (name) => argv.filter((a) => a.startsWith(`--${name}=`)).map((a) => a.slice(name.length + 3));
const port = Number(flag('port')[0] ?? 5604);
const roots = flag('root').map((r) => resolve(r));
const quiet = argv.includes('--quiet');
if (roots.length === 0) {
  console.error('overlay-static: pass at least one --root=<dir>');
  process.exit(2);
}
for (const r of roots) if (!existsSync(r)) { console.error(`overlay-static: ${r} does not exist`); process.exit(2); }

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.flac': 'audio/flac', '.m4a': 'audio/mp4', '.opus': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.wasm': 'application/wasm', '.bin': 'application/octet-stream',
};

/** The file a URL path names in the first root that holds it, or null. Never leaves the root. */
function locate(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  for (const root of roots) {
    const file = resolve(root, clean === '' ? 'index.html' : clean);
    if (file !== root && !file.startsWith(root + sep)) continue;
    try {
      const st = statSync(file);
      if (st.isFile()) return { file, st, root };
      if (st.isDirectory() && existsSync(join(file, 'index.html'))) return { file: join(file, 'index.html'), st: statSync(join(file, 'index.html')), root };
    } catch { /* not in this root */ }
  }
  return null;
}

const ART_PNG_NAME = /(?<![\w-])art\/[A-Za-z0-9_@.\-/]+?\.png(?![\w])/g;
const holds = (rel) => roots.some((r) => existsSync(join(r, rel)));
const webpOf = (rel) => rel.replace(/\.png$/, '.webp');

/** `index.html` as a full build writes it: a PNG name that only exists as a WebP names the WebP. */
function pageText(file) {
  return readFileSync(file, 'utf8').replace(ART_PNG_NAME, (name) => (!holds(name) && holds(webpOf(name)) ? webpOf(name) : name));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/__overlay/stop') {
    res.end('bye');
    setTimeout(() => process.exit(0), 50);
    return;
  }
  const hit = locate(url.pathname);
  if (!hit) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    if (!quiet) console.log(`404 ${url.pathname}`);
    return;
  }
  const { file, st } = hit;
  const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const immutable = /^\/assets\//.test(url.pathname);
  const headers = { 'content-type': type, 'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate', 'accept-ranges': 'bytes' };
  if (file.endsWith('index.html') && hit.root === roots[0]) {
    const body = Buffer.from(pageText(file));
    res.writeHead(200, { ...headers, 'content-length': body.length });
    res.end(body);
    return;
  }
  const etag = `W/"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"`;
  headers['etag'] = etag;
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers['range'] ?? ''));
  if (range && (range[1] !== '' || range[2] !== '')) {
    const start = range[1] === '' ? Math.max(0, st.size - Number(range[2])) : Number(range[1]);
    const end = range[1] === '' || range[2] === '' ? st.size - 1 : Math.min(st.size - 1, Number(range[2]));
    if (start > end || start >= st.size) {
      res.writeHead(416, { 'content-range': `bytes */${st.size}` });
      res.end();
      return;
    }
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, 'content-length': st.size });
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => console.log(`overlay-static: http://127.0.0.1:${port}/ over ${roots.join(' then ')} (pid ${process.pid})`));
