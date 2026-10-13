// A static server for a built site that speaks HTTP/2 over TLS, the way the live host does (r46-scenecue; both games, measurement tooling).
//
//   node tools/dist-h2-server.mjs --dir=dist --port=5246 --key=<key.pem> --cert=<cert.pem>
//
// Why not `vite preview`: it speaks HTTP/1.1, so the browser opens six connections and the seventh request waits in ITS queue, which
// is not what the live site does (Cloudflare serves every file of the page over one multiplexed connection, HTTP/2 or HTTP/3). The audio
// timing questions (does the chapter's scene cue arrive before the first spoken line?) depend on that, so they are measured here.
//
// What it serves like the host: `Cache-Control: public, max-age=0, must-revalidate` and an ETag (304 on a match) on everything, the
// year-long `immutable` rule on `/assets/*` only (the vetted `_headers`), no compression (the art and audio are already compressed;
// the host compresses the code, so the code arrives a little larger here, the same in every build compared), `_headers` itself is a
// 404. The key and certificate are a throwaway pair for 127.0.0.1 (see docs/handoff/r46-scenecue.md for the openssl line); the
// browser is started with `ignoreHTTPSErrors`. Prints `listening <port> pid <pid>` once up; stop it by that PID, never by image name.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createSecureServer } from 'node:http2';
import { extname, join, normalize, resolve, sep } from 'node:path';
import process from 'node:process';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const root = resolve(arg('dir', 'dist'));
const port = Number(arg('port', '5246'));
const logPriority = process.argv.includes('--log-priority'); // print each request's `priority` header (RFC 9218) and path: what the browser asks the host to schedule
const keyFile = arg('key', '');
const certFile = arg('cert', '');
if (!keyFile || !certFile) throw new Error('--key and --cert are required');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/** The file a request path names under the root, or null (outside the root, missing, a directory without an index). */
function fileFor(pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const full = normalize(join(root, rel));
  if (full !== root && !full.startsWith(root + sep)) return null;
  const target = existsSync(full) && statSync(full).isDirectory() ? join(full, 'index.html') : full;
  if (!existsSync(target) || !statSync(target).isFile()) return null;
  if (target === join(root, '_headers')) return null; // the host reads it; no address serves it
  return target;
}

const server = createSecureServer({ key: readFileSync(keyFile), cert: readFileSync(certFile), allowHTTP1: true }, (req, res) => {
  const url = new URL(req.url ?? '/', 'https://localhost');
  if (logPriority) console.log(`req ${req.httpVersion} priority=${req.headers.priority ?? '-'} ${url.pathname}`);
  const file = fileFor(url.pathname);
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
    return;
  }
  const st = statSync(file);
  const etag = `"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"`;
  const rel = file.slice(root.length + 1).split(sep).join('/');
  const headers = {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
    etag,
  };
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }
  res.writeHead(200, { ...headers, 'content-length': st.size });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
});
server.on('error', (e) => {
  console.error(`server error: ${e.message}`);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`listening ${port} pid ${process.pid} dir ${root}`));
