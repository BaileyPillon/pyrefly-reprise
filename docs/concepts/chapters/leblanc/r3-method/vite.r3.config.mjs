/**
 * Art method r3 pilot, P7 (FFX-2 only, chapter 6 Leblanc): the repo's Vite config plus one
 * middleware that answers /art/characters/leblanc/* and /art/manifest.json from a SCRATCH copy
 * (D:/Tools/pyrefly-lora/leblanc/r3/art-scratch/<variant>/), so candidates are swapped in without
 * writing a byte under public/art. The active variant is the text of art-scratch/ACTIVE, read per
 * request. A file missing from the variant folder is a real 404 (the "no hurt file" control).
 *
 *   node node_modules/vite/bin/vite.js --config docs/concepts/chapters/leblanc/r3-method/vite.r3.config.mjs --port 59xx
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const SCRATCH = 'D:/Tools/pyrefly-lora/leblanc/r3/art-scratch';

function scratchArt() {
  return {
    name: 'r3-scratch-art',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        const active = existsSync(join(SCRATCH, 'ACTIVE')) ? readFileSync(join(SCRATCH, 'ACTIVE'), 'utf8').trim() : '';
        if (!active) return next();
        const dir = join(SCRATCH, active);
        if (url === '/art/manifest.json' && existsSync(join(dir, 'manifest.json'))) {
          res.setHeader('content-type', 'application/json');
          res.setHeader('cache-control', 'no-store');
          return res.end(readFileSync(join(dir, 'manifest.json')));
        }
        const m = url.match(/^\/art\/characters\/leblanc\/([a-z0-9._-]+)$/i);
        if (!m) return next();
        const f = join(dir, 'characters/leblanc', m[1]);
        res.setHeader('cache-control', 'no-store');
        if (!existsSync(f)) {
          res.statusCode = 404;
          return res.end('not in the scratch variant');
        }
        res.setHeader('content-type', f.endsWith('.png') ? 'image/png' : 'application/json');
        return res.end(readFileSync(f));
      });
    },
  };
}

export default defineConfig({
  root: REPO,
  base: '/',
  publicDir: join(REPO, 'public'),
  plugins: [scratchArt()],
  // no HMR and no watcher: other agents edit src/ while this runs, and a full reload mid-capture
  // dropped window.__pyrefly (first full P7 run failed on pilotA)
  server: { host: '127.0.0.1', hmr: false, watch: null },
  // its own optimizer cache (the shared node_modules/.vite belongs to the other agents' servers) and only
  // the game's entry to scan: with the default entries the scan walks every HTML page under docs/ and
  // held every request for minutes (first P7 attempt timed out)
  cacheDir: 'D:/Tools/pyrefly-lora/leblanc/r3/.vite-cache',
  optimizeDeps: { entries: ['index.html'] },
});
