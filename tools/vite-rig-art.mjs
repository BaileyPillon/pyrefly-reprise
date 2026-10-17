/**
 * The dev server's route to the rigs: `/art/rigs/<subject>/...` is served from a folder OUTSIDE `public/art` (the rig program, 2026-10-17; both games).
 *
 * Rigs are one painting cut into parts (`src/data/art/rigTypes.ts`); their art lives in `D:/pyrefly-art-rigs/<subject>/` (override with `RIG_ART_DIR`), never in the
 * hard-linked art mirror. The game asks for `art/rigs/<subject>/rig.json` and its part PNGs (`src/engine/rig/RigLoad.ts`); this plugin answers those from the rig folder,
 * ahead of Vite's own static middleware, and lets every other request through. A path that leaves the folder is refused. `apply: 'serve'`: it is never in a build, so a
 * release takes its rigs from a release art mirror instead (TODO in `docs/handoff/rig-engine.md`).
 *
 * `RIG_ART_ALIAS="kimahri=kimahri-proto"` serves a fixture folder as a subject's (the smoke run's prototype Kimahri).
 * Used by the scratch config `tools/zz-rig.tmp.config.mjs`; it is not wired into `vite.config.ts`.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES = { '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

/** The file a `/art/rigs/...` URL names under `root`, or null (not a rig URL, outside the folder, or missing). Pure, for the tests. */
export function rigFileFor(url, root, aliases = {}) {
  const at = url.search(/[?#]/);
  const path = decodeURIComponent(at < 0 ? url : url.slice(0, at));
  const m = /^\/art\/rigs\/([^/]+)(\/.*)?$/.exec(path);
  if (!m) return null;
  const base = resolve(root);
  const folder = Object.hasOwn(aliases, m[1]) ? aliases[m[1]] : m[1]; // a fixture folder standing in for a subject: kimahri -> kimahri-proto
  const file = resolve(join(base, normalize(`${folder}${m[2] ?? ''}`)));
  if (file !== base && !file.startsWith(base + sep)) return null;
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

/** `RIG_ART_ALIAS="kimahri=kimahri-proto,rikku=rikku-test"` as `{kimahri: 'kimahri-proto', ...}`. */
export function parseAliases(text) {
  const out = {};
  for (const pair of (text ?? '').split(',')) {
    const [k, v] = pair.split('=').map((x) => x.trim());
    if (k && v) out[k] = v;
  }
  return out;
}

export function pyreflyRigArt(root = process.env.RIG_ART_DIR ?? 'D:/pyrefly-art-rigs', aliases = parseAliases(process.env.RIG_ART_ALIAS)) {
  return {
    name: 'pyrefly-rig-art',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = typeof req.url === 'string' ? req.url : '';
        if (!url.startsWith('/art/rigs/')) return next();
        let file = null;
        try {
          file = rigFileFor(url, root, aliases);
        } catch {
          file = null;
        }
        if (!file) {
          // a rig that is not there is a real 404 (not index.html with a 200): the game reads that as "no rig"
          res.statusCode = 404;
          res.end('no such rig file');
          return undefined;
        }
        res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(file).pipe(res);
        return undefined;
      });
    },
  };
}
