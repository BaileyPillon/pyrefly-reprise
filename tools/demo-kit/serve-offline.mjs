#!/usr/bin/env node
/**
 * Serve a folder of the game's shipped files with no internet, for the conference booth (R61; docs/DEMO-KIT.md).
 *
 *   node tools/demo-kit/serve-offline.mjs --dir <folder> [--port 5173] [--host 127.0.0.1] [--pid-file <file>]
 *
 * Plain Node, no dependency, no build: it hands out the bytes of the folder the way the live host does (`public/_headers`: hashed bundles cached for a year, everything else asked about every time and
 * answered 304), with Range support for the audio. It listens on the loopback only, so nothing on the conference network can reach it. A busy port falls through to the next free one (up to 30 higher);
 * the line `LISTENING http://127.0.0.1:<port>/` says which. `POST /__demo-kit/stop` from the same machine closes it; `GET /__demo-kit/health` answers `{ ok, dir, port, served }`.
 *
 * Game case: both (tooling).
 */

import { createReadStream, existsSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { DEFAULT_PORT, cacheControlOf, contentTypeOf, parseRange, safeJoin } from './demo-kit-lib.mjs';

const PORT_TRIES = 30;

/** Start a server on `dir`. Resolves `{ server, port, close }` once it listens. `onStop` runs after a `POST /__demo-kit/stop` has closed it (the command line exits there; a test does not). */
export async function startServer({ dir, port = DEFAULT_PORT, host = '127.0.0.1', log = () => {}, onStop = () => {} }) {
  const root = resolve(dir);
  if (!existsSync(resolve(root, 'index.html'))) throw new Error(`no index.html in ${root}: that is not a copy of the site (run fetch-site first)`);
  const counts = { served: 0, notFound: 0, errors: 0 };
  let closing = null;

  const send = (res, status, headers, body) => {
    res.writeHead(status, headers);
    res.end(body);
  };

  const server = createServer((req, res) => {
    const url = req.url ?? '/';
    const path = url.split('?')[0] ?? '/';
    const local = req.socket.remoteAddress === '127.0.0.1' || req.socket.remoteAddress === '::1' || req.socket.remoteAddress === '::ffff:127.0.0.1';

    if (path === '/__demo-kit/health') {
      return send(res, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, JSON.stringify({ ok: true, dir: root, port: server.address().port, ...counts }));
    }
    if (path === '/__demo-kit/stop') {
      if (req.method !== 'POST' || !local) return send(res, 405, { Allow: 'POST' }, 'POST from this machine only');
      send(res, 200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'stopping');
      setImmediate(() => closing?.());
      return undefined;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { Allow: 'GET, HEAD' }, 'method not allowed');

    const file = safeJoin(root, path);
    let stat = null;
    try {
      stat = file ? statSync(file) : null;
    } catch {
      stat = null;
    }
    if (!file || !stat || !stat.isFile()) {
      counts.notFound++;
      log(`404 ${path}`);
      return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, 'not found');
    }

    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const headers = {
      'Content-Type': contentTypeOf(file),
      'Cache-Control': cacheControlOf(path),
      ETag: etag,
      'Last-Modified': stat.mtime.toUTCString(),
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };
    if (req.headers['if-none-match'] === etag) {
      counts.served++;
      return send(res, 304, headers);
    }
    const range = parseRange(req.headers['range'], stat.size);
    if (range === 'unsatisfiable') return send(res, 416, { ...headers, 'Content-Range': `bytes */${stat.size}` });
    const status = range ? 206 : 200;
    const start = range ? range.start : 0;
    const end = range ? range.end : stat.size - 1;
    headers['Content-Length'] = String(stat.size === 0 ? 0 : end - start + 1);
    if (range) headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    res.writeHead(status, headers);
    counts.served++;
    if (req.method === 'HEAD' || stat.size === 0) return res.end();
    const stream = createReadStream(file, { start, end });
    stream.on('error', (err) => {
      counts.errors++;
      log(`error ${path}: ${err.message}`);
      res.destroy();
    });
    res.on('close', () => stream.destroy());
    stream.pipe(res);
    return undefined;
  });
  server.keepAliveTimeout = 30_000;

  const listen = (p) =>
    new Promise((ok, fail) => {
      const onError = (err) => {
        server.off('listening', onListening);
        fail(err);
      };
      const onListening = () => {
        server.off('error', onError);
        ok();
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(p, host);
    });

  let bound = port;
  for (let i = 0; ; i++) {
    try {
      await listen(port === 0 ? 0 : port + i);
      bound = server.address().port;
      break;
    } catch (err) {
      if (err.code !== 'EADDRINUSE' || port === 0 || i >= PORT_TRIES) throw err;
    }
  }

  const close = () =>
    new Promise((ok) => {
      server.close(() => ok());
      server.closeAllConnections?.();
    });
  closing = async () => {
    await close();
    onStop();
  };
  return { server, port: bound, close };
}

async function main(argv) {
  const opt = (name, fallback = null) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
  };
  const dir = opt('--dir');
  if (!dir) {
    console.error('usage: node tools/demo-kit/serve-offline.mjs --dir <folder> [--port 5173] [--host 127.0.0.1] [--pid-file <file>]');
    process.exitCode = 2;
    return;
  }
  const pidFile = opt('--pid-file');
  try {
    const leave = () => {
      if (pidFile) rmSync(pidFile, { force: true });
      process.exit(0);
    };
    const { port, close } = await startServer({ dir, port: Number(opt('--port', String(DEFAULT_PORT))), host: opt('--host', '127.0.0.1'), log: (m) => console.log(m), onStop: leave });
    if (pidFile) writeFileSync(pidFile, JSON.stringify({ pid: process.pid, port, dir: resolve(dir) }));
    console.log(`LISTENING http://${opt('--host', '127.0.0.1')}:${port}/`);
    const stop = async () => {
      await close();
      leave();
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } catch (err) {
    console.error(`cannot serve: ${err.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main(process.argv.slice(2));
